import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { app } from './server.js';

let server;
let base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((resolve) => server.close(resolve)));
const valid = { category: 'length', fromUnit: 'm', toUnit: 'cm', value: 1 };

test('/health renvoie 200 avec un statut et un horodatage UTC courant', async () => {
  const start = Date.now();
  const response = await fetch(`${base}/health`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/json/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const data = await response.json();
  assert.equal(data.status, 'ok');
  const timestamp = Date.parse(data.timestamp);
  assert.ok(timestamp >= start && timestamp <= Date.now());
  assert.equal(new Date(timestamp).toISOString(), data.timestamp);
});

test('les journaux décrivent les requêtes sans exposer les données sensibles', async (t) => {
  const entries = [];
  t.mock.method(console, 'log', (line) => entries.push(JSON.parse(line)));
  const marker = 'donnee-confidentielle-test';
  const headers = { Authorization: `Bearer ${marker}`, Cookie: `session=${marker}`, 'Content-Type': 'application/json' };
  await fetch(`${base}/health?token=${marker}`, { headers });
  await fetch(`${base}/api/convert`, {
    method: 'POST', headers, body: JSON.stringify({ ...valid, secret: marker }),
  });
  await fetch(`${base}/${marker}`, { headers });
  await fetch(`${base}/api/convert?token=${marker}`, { method: 'POST', headers, body: `{${marker}` });
  assert.equal(entries.length, 4);
  assert.deepEqual(entries.map((entry) => entry.statusCode), [200, 200, 404, 400]);
  assert.deepEqual(entries.map((entry) => entry.route), ['/health', '/api/convert', 'unmatched', 'unmatched']);
  assert.deepEqual(entries.map((entry) => entry.level), ['info', 'info', 'warn', 'warn']);
  assert.deepEqual(entries.map((entry) => entry.method), ['GET', 'POST', 'GET', 'POST']);
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry).sort(), ['timestamp', 'level', 'event', 'method', 'route', 'statusCode', 'durationMs'].sort());
    assert.equal(entry.event, 'http_request');
    assert.ok(Number.isFinite(Date.parse(entry.timestamp)));
    assert.ok(Number.isFinite(entry.durationMs) && entry.durationMs >= 0);
  }
  assert.ok(!JSON.stringify(entries).includes(marker));
});

async function post(body, status = 200) {
  const response = await fetch(`${base}/api/convert`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  assert.equal(response.status, status);
  assert.match(response.headers.get('content-type'), /application\/json/);
  const data = await response.json();
  if (status !== 200) assert.equal(typeof data.error, 'string');
  return data;
}

test('les catégories exposent les quatre opérations', async () => {
  const response = await fetch(`${base}/api/categories`);
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(await response.json()), ['length', 'volume', 'weight', 'temperature']);
});

for (const [category, fromUnit, toUnit, value, expected] of [
  ['length', 'ft', 'm', 10, 3.048], ['volume', 'l', 'ml', 2, 2000],
  ['weight', 'kg', 'g', 3, 3000], ['temperature', 'C', 'F', 100, 212],
  ['temperature', 'C', 'K', -273.15, 0], ['temperature', 'F', 'K', -459.67, 0],
  ['temperature', 'K', 'C', 0, -273.15], ['length', 'm', 'm', 1e308, 1e308],
]) {
  test(`${value} ${fromUnit} → ${toUnit}`, async () => {
    const data = await post({ category, fromUnit, toUnit, value });
    assert.equal(data.convertedValue, expected);
    assert.equal(typeof data.formula, 'string');
  });
}

test('les saisies invalides donnent une erreur 400 JSON', async () => {
  for (const value of [null, '', '12', true, [], {}, 'Infinity', -1]) await post({ ...valid, value }, 400);
  await post({ ...valid, value: undefined }, 400);
  for (const category of ['inconnue', '__proto__', 'constructor', ['length']]) await post({ ...valid, category }, 400);
  for (const fromUnit of ['inconnue', '__proto__', ['m']]) await post({ ...valid, fromUnit }, 400);
  await post({ ...valid, toUnit: 'constructor' }, 400);
  for (const [fromUnit, value] of [['C', -274], ['F', -460], ['K', -1]]) {
    await post({ category: 'temperature', fromUnit, toUnit: 'C', value }, 400);
  }
  await post({ ...valid, fromUnit: 'km', value: 1e308 }, 400);
  await post([], 400);
});

test('erreurs de protocole en JSON français', async () => {
  for (const [path, options, status, message] of [
    ['/api/absente', {}, 404, /introuvable/],
    ['/api/convert', { method: 'POST', body: 'texte' }, 415, /format JSON/],
    ['/api/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }, 400, /JSON invalide/],
    ['/api/convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: 'x'.repeat(110000) }) }, 413, /volumineux/],
  ]) {
    const response = await fetch(`${base}${path}`, options);
    assert.equal(response.status, status);
    assert.match((await response.json()).error, message);
  }
});
