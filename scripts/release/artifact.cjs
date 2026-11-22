'use strict';
const fs = require('fs');
const crypto = require('crypto');
function archiveHash(file) {
  const st = fs.lstatSync(file);
  if (!st.isFile() || st.isSymbolicLink()) throw new Error('archive_type');
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function makeInfo(commit, runId, manifestSha256, archive) {
  if (!/^[0-9a-f]{40}$/.test(commit) || !/^[0-9]+$/.test(runId) || !/^[0-9a-f]{64}$/.test(manifestSha256)) throw new Error('input');
  return { version: 1, commit, runId, manifestSha256, archiveSha256: archiveHash(archive) };
}
function checkInfo(info, commit, runId, manifestSha256, archive) {
  const expected = makeInfo(commit, runId, manifestSha256, archive);
  if (!info || Object.keys(info).sort().join(',') !== Object.keys(expected).sort().join(',') ||
      Object.keys(expected).some(key => expected[key] !== info[key])) throw new Error('provenance');
  return expected.archiveSha256;
}
module.exports = { makeInfo, checkInfo };
if (require.main === module) {
  try {
    const [mode, file, commit, runId, manifest, archive] = process.argv.slice(2);
    if (mode === 'create') fs.writeFileSync(file, JSON.stringify(makeInfo(commit, runId, manifest, archive)) + '\n', { flag: 'wx' });
    else if (mode === 'verify') process.stdout.write(checkInfo(JSON.parse(fs.readFileSync(file, 'utf8')), commit, runId, manifest, archive) + '\n');
    else throw new Error('usage');
  } catch { process.stdout.write('{"result":"HOLD","reason":"artifact_invalid"}\n'); process.exitCode = 2; }
}
