'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { create, verify } = require('./manifest.cjs');
const { apiOf, checkNew, checkDump, switchCore, commitCore, rollbackCore, API, API_BASE, RELEASE_BASE, SAFE } = require('./switch.cjs');
const SHA = '1234567' + 'a'.repeat(33);
const api = () => ({ name: API, pid: 100, pm2_env: { status: 'online', autorestart: true,
  pm_exec_path: API_BASE + '/releases/a5ec5ca/dist/main.js', pm_cwd: API_BASE, env: { ...SAFE } } });
const front = () => ({ name: 'labwise-web-1234567', pid: 101, pm2_env: { status: 'online', autorestart: true,
  pm_exec_path: RELEASE_BASE + '/1234567/dist/server.js', pm_cwd: RELEASE_BASE + '/1234567/dist',
  env: { NODE_ENV: 'production', HOSTNAME: '127.0.0.1', PORT: '3001' } } });
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-web-manifest-'));
  for (const file of ['dist/server.js', 'dist/.next/BUILD_ID', 'dist/.next/static/app.js', 'dist/public/logo.svg', 'scripts/release/manifest.cjs', 'scripts/release/switch.cjs']) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), 'fixture-' + file);
  }
  return fs.realpathSync(root);
}
test('manifest verifies hidden assets, package data and exact file count', () => {
  const root = fixture();
  try { const hash = create(root); assert.equal(verify(root, hash), 6); }
  finally { fs.rmSync(root, { recursive: true }); }
});
for (const kind of ['changed', 'added', 'missing', 'manifest', 'env', 'prototype']) test('manifest rejects ' + kind, () => {
  const root = fixture();
  try {
    const hash = create(root);
    if (kind === 'changed') fs.writeFileSync(path.join(root, 'dist/server.js'), 'tampered');
    if (kind === 'added') fs.writeFileSync(path.join(root, 'dist/extra.js'), 'tampered');
    if (kind === 'missing') fs.unlinkSync(path.join(root, 'dist/server.js'));
    if (kind === 'manifest') fs.appendFileSync(path.join(root, 'manifest.json'), ' ');
    if (kind === 'env') fs.writeFileSync(path.join(root, 'dist/.env'), 'SECRET_SENTINEL');
    if (kind === 'prototype') fs.writeFileSync(path.join(root, '__proto__'), 'untracked');
    assert.throws(() => verify(root, hash));
  } finally { fs.rmSync(root, { recursive: true }); }
});
test('manifest rejects nested junctions without following them', () => {
  const root = fixture(), outside = fixture();
  try {
    fs.symlinkSync(outside, path.join(root, 'dist', 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.throws(() => create(root));
  } finally { fs.rmSync(root, { recursive: true }); fs.rmSync(outside, { recursive: true }); }
});
test('runtime permits Next ISR/cache updates but still rejects changed executable files', () => {
  const root = fixture();
  try {
    const html = path.join(root, 'dist/.next/server/app/index.html');
    fs.mkdirSync(path.dirname(html), { recursive: true }); fs.writeFileSync(html, 'prerender');
    const hash = create(root); fs.writeFileSync(html, 'regenerated');
    const cache = path.join(root, 'dist/.next/cache/fetch-cache/key');
    fs.mkdirSync(path.dirname(cache), { recursive: true }); fs.writeFileSync(cache, 'data');
    assert.throws(() => verify(root, hash)); assert.equal(verify(root, hash, true), 6);
    fs.writeFileSync(path.join(root, 'dist/server.js'), 'tampered'); assert.throws(() => verify(root, hash, true));
  } finally { fs.rmSync(root, { recursive: true }); }
});
test('runtime does not permit executable additions outside cache paths', () => {
  const root = fixture();
  try {
    const hash = create(root); fs.writeFileSync(path.join(root, 'dist/.next/extra.js'), 'tampered');
    assert.throws(() => verify(root, hash, true));
  } finally { fs.rmSync(root, { recursive: true }); }
});
test('backend identity and actual PID are preserved', () => {
  assert.equal(apiOf([api()], 100).pid, 100);
  assert.throws(() => apiOf([api()], 999));
  assert.throws(() => apiOf([api(), api()]));
});
for (const key of Object.keys(SAFE)) test('backend safe flag enforced: ' + key, () => {
  const row = api(); row.pm2_env.env[key] = 'WRONG'; assert.throws(() => apiOf([row]));
});
for (const field of ['script', 'cwd', 'env', 'autorestart', 'status']) test('new app rejects wrong ' + field, () => {
  const row = front();
  if (field === 'script') row.pm2_env.pm_exec_path = '/unexpected';
  if (field === 'cwd') row.pm2_env.pm_cwd = '/unexpected';
  if (field === 'env') row.pm2_env.env.PORT = '3000';
  if (field === 'autorestart') row.pm2_env.autorestart = false;
  if (field === 'status') row.pm2_env.status = 'stopped';
  assert.throws(() => checkNew(row, SHA, true));
});
test('two-entry dump exact roles/env and autorestart checked', () => {
  checkDump([api(), front()], SHA, true);
  assert.throws(() => checkDump([api(), front(), front()], SHA, true));
  const row = api(); row.pm2_env.env.DB_SYNCHRONIZE = 'true';
  assert.throws(() => checkDump([row, front()], SHA, true));
  assert.throws(() => checkDump([api(), front()], SHA, false));
});
test('existing frontend dump fingerprint is accepted and unexpected path refused', () => {
  const previous = { name: 'labwise-frontend', pm_exec_path: '/home/ec2-user/labwise-frontend-standalone/server.js',
    pm_cwd: '/home/ec2-user/labwise-frontend-standalone' };
  checkDump([api(), previous], SHA, false);
  previous.pm_cwd = '/unexpected'; assert.throws(() => checkDump([api(), previous], SHA, false));
});
function ops(failing) {
  const calls = [], proxy = {};
  for (const method of ['preflight','probe','backup','stopOld','startNew','checkNew','restoreOld','checkOld','dumpUnchanged','stage','backupValid','deleteOld','saveAndVerify']) {
    proxy[method] = async (...args) => { calls.push([method, ...args]); if (failing.includes(method)) throw new Error('PRIVATE_ERROR_SENTINEL'); };
  }
  return { calls, proxy };
}
test('switch probes and backs up before stopping; never saves', async () => {
  const { calls, proxy } = ops([]); assert.equal((await switchCore(proxy)).result, 'SWITCHED');
  assert.deepEqual(calls.map(x=>x[0]), ['preflight','probe','backup','stopOld','startNew','checkNew','stage']);
});
for (const point of ['preflight', 'probe', 'backup']) test('no stop on ' + point + ' failure', async () => {
  const { calls, proxy } = ops([point]); await assert.rejects(switchCore(proxy));
  assert(!calls.some(x=>x[0] === 'stopOld' || x[0] === 'startNew'));
});
for (const point of ['stopOld','startNew','checkNew']) test('rollback verified after ' + point + ' failure', async () => {
  const { calls, proxy } = ops([point]); const result = await switchCore(proxy);
  assert.equal(result.result, 'ROLLED_BACK'); assert.equal(result.previousHealthy, true);
  assert(calls.some(x=>x[0] === 'checkOld')); assert(calls.some(x=>x[0] === 'dumpUnchanged'));
});
for (const point of ['restoreOld','checkOld','dumpUnchanged']) test('rollback failure is never reported as recovered: ' + point, async () => {
  const { proxy } = ops(['startNew', point]); assert.equal((await switchCore(proxy)).result, 'ROLLBACK_FAILED');
});
test('commit verifies new app/backup before deletion and save', async () => {
  const { calls, proxy } = ops([]); assert.equal((await commitCore(proxy)).result, 'COMMITTED');
  assert.deepEqual(calls.map(x=>x[0]), ['preflight','backupValid','checkNew','deleteOld','saveAndVerify','stage']);
});
for (const point of ['preflight','backupValid','checkNew']) test('commit refuses before delete on ' + point, async () => {
  const { calls, proxy } = ops([point]); await assert.rejects(commitCore(proxy));
  assert(!calls.some(x=>x[0] === 'deleteOld' || x[0] === 'saveAndVerify'));
});
for (const point of ['deleteOld','saveAndVerify']) test('commit holds and keeps backup on ' + point, async () => {
  const { proxy } = ops([point]); const result = await commitCore(proxy);
  assert.equal(result.result, 'COMMIT_HELD'); assert.equal(result.backupKept, true);
});
test('explicit rollback checks previous health before saving', async () => {
  const { calls, proxy } = ops([]); assert.equal((await rollbackCore(proxy)).result, 'ROLLED_BACK');
  assert.deepEqual(calls.map(x=>x[0]), ['preflight','backupValid','restoreOld','checkOld','saveAndVerify','stage']);
});
