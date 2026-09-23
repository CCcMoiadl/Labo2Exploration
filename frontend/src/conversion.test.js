import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestConversion, validateConversion } from './conversion.js';

const categories = {
  length: { units: [{ id: 'm' }, { id: 'cm' }] },
  temperature: { units: [{ id: 'C' }, { id: 'F' }, { id: 'K' }] },
};

test('validation frontend : valeurs, catégories et unités', () => {
  for (const value of ['', ' ', 'abc', 'Infinity', '1e309', '-1']) {
    assert.notEqual(validateConversion(value, 'length', 'm', 'cm', categories), '');
  }
  for (const value of ['0', '1.5', '1e3']) assert.equal(validateConversion(value, 'length', 'm', 'cm', categories), '');
  assert.notEqual(validateConversion('1', '__proto__', 'm', 'cm', categories), '');
  assert.notEqual(validateConversion('1', 'length', 'inconnue', 'cm', categories), '');
  assert.notEqual(validateConversion('1', 'length', 'm', 'inconnue', categories), '');
});

test('validation frontend : zéro absolu et températures négatives', () => {
  for (const [unit, minimum] of [['C', -273.15], ['F', -459.67], ['K', 0]]) {
    assert.equal(validateConversion(String(minimum), 'temperature', unit, 'C', categories), '');
    assert.match(validateConversion(String(minimum - 1), 'temperature', unit, 'C', categories), /zéro absolu/);
  }
  assert.equal(validateConversion('-10', 'temperature', 'C', 'F', categories), '');
});

test('le client appelle la route API avec le JSON attendu', async (t) => {
  const payload = { category: 'length', fromUnit: 'm', toUnit: 'cm', value: 2 };
  const signal = new AbortController().signal;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/convert');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), payload);
    assert.equal(options.signal, signal);
    return Response.json({ convertedValue: 200, formula: 'valeur * 100' });
  });
  assert.equal((await requestConversion(payload, signal)).convertedValue, 200);
});

test('les erreurs réseau, HTTP et réponses invalides sont compréhensibles', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch');
  mock.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(requestConversion({}), /Impossible de joindre le serveur/);
  mock.mock.mockImplementation(async () => Response.json({ error: 'Catégorie invalide.' }, { status: 400 }));
  await assert.rejects(requestConversion({}), /Catégorie invalide/);
  for (const response of [new Response('<html>Erreur</html>'), Response.json({ convertedValue: null }), Response.json(null)]) {
    mock.mock.mockImplementation(async () => response);
    await assert.rejects(requestConversion({}), /réponse invalide/);
  }
  mock.mock.mockImplementation(async () => { throw new DOMException('Aborted', 'AbortError'); });
  await assert.rejects(requestConversion({}), { name: 'AbortError' });
});
