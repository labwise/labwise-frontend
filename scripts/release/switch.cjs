'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const { verify, digest } = require('./manifest.cjs');
const API = 'labwise-api-a5ec5ca';
const API_BASE = '/home/ec2-user/labwise-backend';
const RELEASE_BASE = '/home/ec2-user/labwise-frontend-releases';
const OLD_FP = '36f7d12094afb7d4';
const SAFE = { NODE_ENV: 'production', DB_SYNCHRONIZE: 'false', AUTO_CANCEL_CRON_ENABLED: 'false', DORMANT_CRON_ENABLED: 'false', PORT: '3000' };
let phase = 'setup';
const pe = row => row.pm2_env || row;
const name = row => row.name || pe(row).name;
const envValue = (row, key) => Object.hasOwn(pe(row).env || {}, key) ? pe(row).env[key] : pe(row)[key];
const fingerprint = row => digest([name(row), pe(row).pm_exec_path, pe(row).pm_cwd].join('\0')).slice(0, 16);
function apiOf(rows, expectedPid) {
  if (!Array.isArray(rows)) throw new Error('list');
  const hits = rows.filter(row => name(row) === API);
  if (hits.length !== 1) throw new Error('api_count');
  const row = hits[0], p = pe(row);
  if (p.status !== 'online' || p.autorestart !== true || !Number.isInteger(row.pid) || row.pid <= 0 ||
      p.pm_exec_path !== API_BASE + '/releases/a5ec5ca/dist/main.js' || p.pm_cwd !== API_BASE ||
      Object.entries(SAFE).some(([key, value]) => String(envValue(row, key)) !== value) ||
      (expectedPid !== undefined && row.pid !== expectedPid)) throw new Error('api_changed');
  return row;
}
function oldOf(rows) { return rows.filter(row => fingerprint(row) === OLD_FP); }
function newOf(rows, sha) { return rows.filter(row => name(row) === 'labwise-web-' + sha.slice(0, 7)); }
function checkNew(row, sha, live) {
  const dir = RELEASE_BASE + '/' + sha.slice(0, 7) + '/dist', p = pe(row);
  if (name(row) !== 'labwise-web-' + sha.slice(0, 7) || p.pm_exec_path !== dir + '/server.js' || p.pm_cwd !== dir ||
      p.autorestart !== true || String(envValue(row, 'PORT')) !== '3001' ||
      envValue(row, 'NODE_ENV') !== 'production' || envValue(row, 'HOSTNAME') !== '127.0.0.1' ||
      (live && (p.status !== 'online' || !Number.isInteger(row.pid) || row.pid <= 0))) throw new Error('new_invalid');
}
function checkDump(rows, sha, wantNew) {
  if (!Array.isArray(rows) || rows.length !== 2) throw new Error('dump_count');
  // PM2 dumps do not guarantee live PIDs/status. Only persisted API identity/env are checked here.
  const api = rows.find(row => name(row) === API);
  if (!api || pe(api).pm_exec_path !== API_BASE + '/releases/a5ec5ca/dist/main.js' || pe(api).pm_cwd !== API_BASE ||
      pe(api).autorestart !== true || Object.entries(SAFE).some(([k, v]) => String(envValue(api, k)) !== v)) throw new Error('dump_api');
  const rest = rows.filter(row => name(row) !== API);
  if (rest.length !== 1) throw new Error('dump_roles');
  if (wantNew) checkNew(rest[0], sha, false);
  else if (fingerprint(rest[0]) !== OLD_FP) throw new Error('dump_previous');
}
async function switchCore(ops) {
  await ops.preflight();
  await ops.probe();
  await ops.backup();
  try {
    await ops.stopOld();
    await ops.startNew();
    await ops.checkNew();
    await ops.stage('switched');
    return { result: 'SWITCHED', changed: true, saved: false };
  } catch {
    try {
      await ops.restoreOld();
      await ops.checkOld();
      await ops.dumpUnchanged();
      await ops.stage('rolledback');
      return { result: 'ROLLED_BACK', previousHealthy: true, saved: false };
    } catch { return { result: 'ROLLBACK_FAILED', previousHealthy: false, saved: 'unknown' }; }
  }
}
async function commitCore(ops) {
  await ops.preflight();
  await ops.backupValid();
  await ops.checkNew();
  try {
    await ops.deleteOld();
    await ops.saveAndVerify(true);
    await ops.stage('committed');
    return { result: 'COMMITTED', saved: true, bootDumps: 2, mode600: true, backendUnchanged: true };
  } catch { return { result: 'COMMIT_HELD', saved: 'unknown', backupKept: true }; }
}
async function rollbackCore(ops) {
  await ops.preflight();
  await ops.backupValid();
  try {
    await ops.restoreOld();
    await ops.checkOld();
    await ops.saveAndVerify(false);
    await ops.stage('rolledback');
    return { result: 'ROLLED_BACK', previousHealthy: true, saved: true, bootDumps: 2, mode600: true, backendUnchanged: true };
  } catch { return { result: 'ROLLBACK_FAILED', previousHealthy: false, saved: 'unknown', backupKept: true }; }
}
function privateRead(file) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const s = fs.fstatSync(fd);
    if (!s.isFile() || s.uid !== process.getuid() || (s.mode & 511) !== 384) throw new Error('private_file');
    return fs.readFileSync(fd);
  } finally { fs.closeSync(fd); }
}
function privateWrite(file, bytes, exclusive = false) {
  const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW |
    (exclusive ? fs.constants.O_EXCL : fs.constants.O_TRUNC), 0o600);
  try { fs.fchmodSync(fd, 0o600); fs.writeFileSync(fd, bytes); } finally { fs.closeSync(fd); }
}
function actualEnv(pid) {
  if (fs.statSync('/proc/' + pid).uid !== process.getuid()) throw new Error('process_owner');
  return Object.fromEntries(fs.readFileSync('/proc/' + pid + '/environ', 'utf8').split('\0').filter(x => x.includes('=')).map(x => {
    const at = x.indexOf('='); return [x.slice(0, at), x.slice(at + 1)];
  }));
}
function listeners(port) {
  return execFileSync('ss', ['-ltnpH', 'sport = :' + port], { stdio: 'pipe', timeout: 5000 }).toString().trim().split('\n').filter(Boolean);
}
function portOwner(port, pid) {
  const lines = listeners(port);
  if (!lines.length || lines.some(line => {
    const pids = [...line.matchAll(/pid=(\d+)/g)].map(m => Number(m[1]));
    return !pids.length || pids.some(p => p !== pid);
  })) throw new Error('port_owner');
}
function get(port, url) {
  return new Promise((resolve, reject) => {
    const req = http.get('http://127.0.0.1:' + port + url, res => {
      let text = '';
      res.on('data', bytes => { text += bytes; if (text.length > 2_000_000) req.destroy(new Error('limit')); });
      res.on('end', () => res.statusCode === 200 ? resolve(text) : reject(new Error('status')));
    });
    req.setTimeout(5000, () => req.destroy(new Error('timeout'))); req.on('error', reject);
  });
}
async function health(port, candidate) {
  const home = await get(port, '/');
  const register = await get(port, '/register');
  await get(port, '/products');
  if (candidate && (!home.includes('상품 찾기') || home.includes('10,000종') || !register.includes('min-w-0'))) throw new Error('wrong_screen');
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function retry(fn, attempts = 30) {
  for (let i = 0; i < attempts; i++) { try { return await fn(); } catch { if (i === attempts - 1) throw new Error('health_timeout'); await sleep(500); } }
}
async function run() {
  const [mode, sha, expected] = process.argv.slice(2);
  if (!['preflight', 'switch', 'commit', 'rollback'].includes(mode) || !/^[0-9a-f]{40}$/.test(sha) || !/^[0-9a-f]{64}$/.test(expected)) throw new Error('usage');
  if (process.getuid() === 0 || os.userInfo().username !== 'ec2-user') throw new Error('user');
  const home = process.env.PM2_HOME || os.homedir() + '/.pm2';
  if (fs.realpathSync(home) !== home || !fs.lstatSync(home + '/rpc.sock').isSocket() || !fs.lstatSync(home + '/pub.sock').isSocket()) throw new Error('daemon');
  const pidFd = fs.openSync(home + '/pm2.pid', fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  let daemon;
  try {
    const st = fs.fstatSync(pidFd);
    if (!st.isFile() || st.uid !== process.getuid()) throw new Error('daemon');
    daemon = Number(fs.readFileSync(pidFd, 'utf8').trim());
  } finally { fs.closeSync(pidFd); }
  if (!Number.isInteger(daemon) || daemon <= 0) throw new Error('daemon');
  process.kill(daemon, 0);
  const root = process.env.LW_PM2_ROOT;
  if (!root || fs.realpathSync(root) !== root || require(root + '/package.json').version !== '7.0.1') throw new Error('pm2_version');
  const rel = RELEASE_BASE + '/' + sha.slice(0, 7), backup = home + '/lw-front-backup-' + sha.slice(0, 7);
  const lock = '/tmp/labwise-frontend-release.lock';
  fs.mkdirSync(lock);
  console.log = console.warn = console.error = () => {};
  const pm2 = require(root);
  const call = (method, ...args) => new Promise((resolve, reject) => pm2[method](...args, (e, value) => e ? reject(new Error('pm2_operation')) : resolve(value)));
  let activeProbe;
  const timer = setTimeout(() => {
    if (activeProbe) activeProbe.kill('SIGTERM');
    pm2.disconnect();
    try { fs.rmdirSync(lock); } catch {}
    process.stdout.write('{"result":"HOLD","reason":"deadline"}\n'); process.exit(2);
  }, 150_000);
  let state, original, apiPid, previous;
  const dumpFiles = ['dump.pm2', 'dump.pm2.bak'];
  function readState() {
    const st = fs.lstatSync(backup);
    if (!st.isDirectory() || st.isSymbolicLink() || fs.realpathSync(backup) !== backup || st.uid !== process.getuid() || (st.mode & 511) !== 448) throw new Error('backup_directory');
    const data = JSON.parse(privateRead(backup + '/state.json'));
    if (data.version !== 1 || data.sha !== sha || data.manifest !== expected || !data.previous || fingerprint({ name: data.previous.name, pm_exec_path: data.previous.script, pm_cwd: data.previous.cwd }) !== OLD_FP) throw new Error('backup_state');
    return data;
  }
  async function checkedApi(rows) {
    const api = apiOf(rows, apiPid);
    const env = actualEnv(api.pid);
    if (Object.entries(SAFE).some(([k, v]) => env[k] !== v)) throw new Error('actual_api_env');
    portOwner(3000, api.pid); return api;
  }
  const ops = {
    async preflight() {
      phase = 'preflight';
      const rows = await call('list');
      if (mode === 'switch' || mode === 'preflight') {
        const api = apiOf(rows); apiPid = api.pid;
        const old = oldOf(rows);
        if (rows.length !== 2 || old.length !== 1 || pe(old[0]).status !== 'online' || newOf(rows, sha).length) throw new Error('previous_state');
        previous = old[0];
        if (!fs.lstatSync(pe(previous).pm_exec_path).isFile() || fs.realpathSync(pe(previous).pm_cwd) !== pe(previous).pm_cwd) throw new Error('previous_files');
        portOwner(3001, previous.pid);
        if (actualEnv(previous.pid).PORT !== '3001') throw new Error('previous_env');
        original = dumpFiles.map(file => privateRead(home + '/' + file));
        original.forEach(bytes => checkDump(JSON.parse(bytes), sha, false));
        if (mode === 'switch' && fs.existsSync(backup)) throw new Error('backup_exists');
        const disk = fs.statfsSync('/home/ec2-user');
        if (disk.bavail * disk.bsize < 512 * 1024 * 1024) throw new Error('disk_capacity');
      } else {
        state = readState(); apiPid = state.apiPid;
        const fresh = newOf(rows, sha), old = oldOf(rows);
        if (fresh.length !== 1 || ![2, 3].includes(rows.length) || old.length !== rows.length - 2 || (old.length && pe(old[0]).status !== 'stopped')) throw new Error('release_state');
        checkNew(fresh[0], sha, true);
      }
      await checkedApi(rows);
      // Upload pins every file. Next.js later updates its documented ISR/image/fetch caches.
      // Activation keeps all executable/static/package files pinned and allows only those cache paths.
      if (mode !== 'preflight') verify(rel, expected, true);
    },
    async probe() {
      phase = 'probe';
      if (listeners(3103).length) throw new Error('probe_port');
      const memory = fs.readFileSync('/proc/meminfo', 'utf8').match(/^MemAvailable:\s+(\d+) kB$/m);
      if (!memory || Number(memory[1]) < 320 * 1024) throw new Error('probe_capacity');
      const probe = spawn(process.execPath, [rel + '/dist/server.js'], { cwd: rel + '/dist', stdio: 'ignore', env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=192', NODE_ENV: 'production', HOSTNAME: '127.0.0.1', PORT: '3103' } });
      activeProbe = probe;
      probe.on('error', () => {});
      try { await retry(async () => { portOwner(3103, probe.pid); await health(3103, true); }); }
      finally {
        probe.kill('SIGTERM');
        await retry(async () => { if (listeners(3103).length) throw new Error('probe_alive'); }, 15);
        activeProbe = undefined;
      }
    },
    async backup() {
      phase = 'backup';
      fs.mkdirSync(backup, { mode: 0o700 });
      const sums = {};
      for (let i = 0; i < dumpFiles.length; i++) {
        if (!privateRead(home + '/' + dumpFiles[i]).equals(original[i])) throw new Error('dump_changed');
        privateWrite(backup + '/' + dumpFiles[i], original[i], true); sums[dumpFiles[i]] = digest(original[i]);
      }
      state = { version: 1, sha, manifest: expected, apiPid, stage: 'prepared', previous: { name: name(previous), script: pe(previous).pm_exec_path,
        cwd: pe(previous).pm_cwd, env: actualEnv(previous.pid), autorestart: pe(previous).autorestart !== false } };
      privateWrite(backup + '/state.json', JSON.stringify(state), true); privateWrite(backup + '/sums.json', JSON.stringify(sums), true);
      await ops.backupValid();
    },
    async backupValid() {
      state = readState();
      const sums = JSON.parse(privateRead(backup + '/sums.json'));
      if (Object.keys(sums).sort().join(',') !== dumpFiles.slice().sort().join(',')) throw new Error('backup_sums');
      for (const file of dumpFiles) {
        const data = privateRead(backup + '/' + file);
        if (digest(data) !== sums[file]) throw new Error('backup_hash');
        checkDump(JSON.parse(data), sha, false);
      }
    },
    async stopOld() { phase = 'stop_previous'; await checkedApi(await call('list')); await call('stop', state.previous.name); await retry(async () => { if (listeners(3001).length) throw new Error('port_busy'); }); },
    async startNew() {
      phase = 'start_candidate';
      await call('start', { name: 'labwise-web-' + sha.slice(0, 7), script: rel + '/dist/server.js', cwd: rel + '/dist',
        autorestart: true, env: { NODE_ENV: 'production', HOSTNAME: '127.0.0.1', PORT: '3001' } });
    },
    async checkNew() { await retry(async () => {
      const rows = await call('list'); await checkedApi(rows);
      const hits = newOf(rows, sha); if (hits.length !== 1) throw new Error('new_count');
      checkNew(hits[0], sha, true); portOwner(3001, hits[0].pid); await health(3001, true);
    }); },
    async restoreOld() {
      phase = 'restore_previous';
      await ops.backupValid();
      let rows = await call('list'); await checkedApi(rows);
      const fresh = newOf(rows, sha);
      if (fresh.length > 1) throw new Error('new_count');
      if (fresh.length) { checkNew(fresh[0], sha, false); await call('delete', name(fresh[0])); }
      rows = await call('list'); if (newOf(rows, sha).length) throw new Error('new_not_deleted');
      const old = oldOf(rows);
      if (old.length > 1 || rows.length !== 1 + old.length) throw new Error('old_count');
      if (old.length) { if (pe(old[0]).status !== 'online') await call('restart', state.previous.name); }
      else await call('start', state.previous);
    },
    async checkOld() { await retry(async () => {
      const rows = await call('list'); await checkedApi(rows);
      const old = oldOf(rows);
      if (rows.length !== 2 || old.length !== 1 || pe(old[0]).status !== 'online') throw new Error('old_unhealthy');
      portOwner(3001, old[0].pid); await health(3001, false);
    }); },
    async dumpUnchanged() { for (const file of dumpFiles) if (!privateRead(home + '/' + file).equals(privateRead(backup + '/' + file))) throw new Error('dump_changed'); },
    async deleteOld() {
      let rows = await call('list'); await checkedApi(rows);
      const old = oldOf(rows);
      if (old.length > 1 || (old.length && pe(old[0]).status !== 'stopped')) throw new Error('old_active');
      if (old.length) await call('delete', state.previous.name);
      rows = await call('list'); await checkedApi(rows);
      if (rows.length !== 2 || oldOf(rows).length || newOf(rows, sha).length !== 1) throw new Error('delete_unconfirmed');
    },
    async saveAndVerify(wantNew) {
      phase = 'save';
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const rows = await call('list'); await checkedApi(rows); checkDump(rows, sha, wantNew);
          for (let i = 0; i < 2; i++) { process.kill(daemon, 0); execFileSync(process.execPath, [root + '/bin/pm2', 'save'], { stdio: 'pipe', timeout: 15_000 }); }
          for (const file of dumpFiles) {
            const fd = fs.openSync(home + '/' + file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
            try { const st = fs.fstatSync(fd); if (!st.isFile() || st.uid !== process.getuid()) throw new Error('dump_owner'); fs.fchmodSync(fd, 0o600); } finally { fs.closeSync(fd); }
            checkDump(JSON.parse(privateRead(home + '/' + file)), sha, wantNew);
          }
          return;
        } catch { if (attempt === 1) throw new Error('save_unconfirmed'); }
      }
    },
    async stage(value) { state.stage = value; privateWrite(backup + '/state.json', JSON.stringify(state)); },
  };
  try {
    await call('connect');
    let result;
    if (mode === 'preflight') { await ops.preflight(); result = { result: 'PREFLIGHT_OK', backendUnchanged: true }; }
    else if (mode === 'switch') result = await switchCore(ops);
    else if (mode === 'commit') result = await commitCore(ops);
    else result = await rollbackCore(ops);
    process.stdout.write(JSON.stringify(result) + '\n');
    const expectedResult = { preflight: 'PREFLIGHT_OK', switch: 'SWITCHED', commit: 'COMMITTED', rollback: 'ROLLED_BACK' }[mode];
    if (result.result !== expectedResult) process.exitCode = 2;
  } finally { clearTimeout(timer); pm2.disconnect(); fs.rmdirSync(lock); }
}
module.exports = { apiOf, checkNew, checkDump, fingerprint, switchCore, commitCore, rollbackCore, API, API_BASE, RELEASE_BASE, SAFE };
if (require.main === module) run().catch(error => {
  const known = new Set(['usage', 'user', 'daemon', 'pm2_version', 'previous_state', 'previous_files', 'previous_env',
    'backup_exists', 'disk_capacity', 'probe_capacity', 'probe_port', 'health_timeout', 'private_file', 'api_changed', 'actual_api_env', 'api_count']);
  process.stdout.write(JSON.stringify({ result: 'HOLD', reason: known.has(error.message) ? error.message : 'release_unconfirmed', phase,
    code: ['ENOENT','EACCES','EPERM','EIO','ETIMEDOUT'].includes(error.code) ? error.code : 'other' }) + '\n'); process.exitCode = 2;
});
