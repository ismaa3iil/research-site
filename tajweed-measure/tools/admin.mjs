import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
const api = process.env.TAJWEED_API_URL?.replace(/\/$/, '');
const token = process.env.TAJWEED_ADMIN_SECRET;
if (!api || !token) throw new Error('Set TAJWEED_API_URL and TAJWEED_ADMIN_SECRET in your shell. Never commit the secret.');
const [command, value, taskList] = process.argv.slice(2);
async function request(path, method = 'GET', body) {
  const response = await fetch(api + '/v1/admin/' + path, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error); return result;
}
if (command === 'invite') {
  if (!value || !taskList) throw new Error('Usage: node tools/admin.mjs invite "Expert label" all|task_id,task_id');
  console.log(JSON.stringify(await request('experts', 'POST', { label: value, taskIds: taskList === 'all' ? 'all' : taskList.split(',') }), null, 2));
} else if (command === 'list') console.log(JSON.stringify(await request('experts'), null, 2));
else if (command === 'revoke') {
  if (!/^[a-f0-9-]{36}$/.test(value || '')) throw new Error('Provide the expert ID from list.');
  console.log(await request(`experts/${value}/revoke`, 'POST'));
} else if (command === 'export') {
  if (!value) throw new Error('Provide a private output filename.');
  const data = await request('export');
  await mkdir(dirname(value), { recursive: true });
  await writeFile(value, JSON.stringify(data, null, 2)); console.log(`Saved ${value}`);
} else throw new Error('Commands: invite, list, revoke, export.');
