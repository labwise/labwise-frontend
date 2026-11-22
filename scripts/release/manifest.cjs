'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function files(root) {
  if (fs.realpathSync(root) !== root) throw new Error('root_link');
  const result = Object.create(null);
  function walk(dir, prefix) {
    for (const name of fs.readdirSync(dir).sort()) {
      const relative = prefix ? prefix + '/' + name : name;
      if (relative === 'manifest.json') continue;
      if (/[\r\n\0\\]/.test(name) || name === '.' || name === '..' || /(^|\/)\.env(?:\.|$)/.test(relative)) throw new Error('unsafe_name');
      const full = path.join(dir, name), stat = fs.lstatSync(full);
      if (stat.isSymbolicLink() || fs.realpathSync(full) !== full) throw new Error('link');
      if (stat.isDirectory()) walk(full, relative);
      else if (stat.isFile()) result[relative] = digest(fs.readFileSync(full));
      else throw new Error('not_regular');
    }
  }
  walk(root, '');
  for (const required of ['dist/server.js', 'dist/.next/BUILD_ID', 'scripts/release/manifest.cjs', 'scripts/release/switch.cjs']) {
    if (!result[required]) throw new Error('missing_required');
  }
  if (!Object.keys(result).some(p => p.startsWith('dist/.next/static/')) ||
      !Object.keys(result).some(p => p.startsWith('dist/public/'))) throw new Error('missing_assets');
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b, 'en')));
}
function create(root) {
  const body = Buffer.from(JSON.stringify({ version: 1, files: files(root) }) + '\n');
  fs.writeFileSync(path.join(root, 'manifest.json'), body, { flag: 'wx' });
  return digest(body);
}
function mutableCache(file) {
  return /^dist\/\.next\/cache\/(images|fetch-cache)\//.test(file) ||
    (file.startsWith('dist/.next/server/app/') && /\.(html|rsc|meta|body)$/.test(file));
}
function verify(root, expected, runtime = false) {
  if (!/^[0-9a-f]{64}$/.test(expected)) throw new Error('hash_format');
  const file = path.join(root, 'manifest.json'), stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('manifest_type');
  const bytes = fs.readFileSync(file);
  if (digest(bytes) !== expected) throw new Error('manifest_hash');
  const manifest = JSON.parse(bytes);
  if (manifest.version !== 1 || !manifest.files || Array.isArray(manifest.files)) throw new Error('manifest_shape');
  const actual = files(root);
  const keys = Object.keys(actual).filter(k => !runtime || !mutableCache(k)).sort();
  const wanted = Object.keys(manifest.files).filter(k => !runtime || !mutableCache(k)).sort();
  if (JSON.stringify(keys) !== JSON.stringify(wanted) || keys.some(k => actual[k] !== manifest.files[k])) throw new Error('files_mismatch');
  return keys.length;
}
module.exports = { create, verify, digest, files, mutableCache };
if (require.main === module) {
  try {
    const [mode, input, hash] = process.argv.slice(2), root = path.resolve(input);
    if (mode === 'create') process.stdout.write(create(root) + '\n');
    else if (mode === 'verify') process.stdout.write(JSON.stringify({ result: 'MANIFEST_OK', files: verify(root, hash) }) + '\n');
    else throw new Error('usage');
  } catch { process.stdout.write('{"result":"HOLD","reason":"manifest_invalid"}\n'); process.exitCode = 2; }
}
