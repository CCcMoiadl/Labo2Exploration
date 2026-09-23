import assert from 'node:assert/strict';
import { connect } from 'node:tls';

// Node.js 24, sans dépendance. Les erreurs TLS font échouer fetch.
const origin = new URL(process.env.PUBLIC_URL || 'https://cegexplabo.xyz');
assert.equal(origin.protocol, 'https:', 'PUBLIC_URL doit utiliser HTTPS');
assert.equal(origin.pathname, '/', 'PUBLIC_URL doit désigner la racine du site');
assert.ok(!origin.username && !origin.password && !origin.search && !origin.hash);

const certificate = await new Promise((resolve, reject) => {
  const socket = connect({ host: origin.hostname, port: Number(origin.port || 443), servername: origin.hostname });
  socket.setTimeout(15000, () => socket.destroy(new Error('Délai de vérification TLS dépassé')));
  socket.once('error', reject);
  socket.once('secureConnect', () => {
    const peer = socket.getPeerCertificate();
    socket.end();
    resolve(peer);
  });
});
assert.equal(certificate.issuer.O, "Let's Encrypt", "Certificat Let's Encrypt attendu");
console.log(`OK : certificat Let's Encrypt valide jusqu'au ${certificate.valid_to}.`);

async function request(path, options = {}) {
  return fetch(new URL(path, origin), {
    ...options, redirect: 'manual', signal: AbortSignal.timeout(15000),
  });
}

const http = new URL('/?verification=https', origin);
http.protocol = 'http:';
const redirect = await fetch(http, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
assert.ok([301, 308].includes(redirect.status), 'Redirection HTTP permanente attendue');
assert.equal(new URL(redirect.headers.get('location'), http).href,
  new URL('/?verification=https', origin).href, 'La redirection doit conserver le chemin et la requête');
console.log('OK : HTTP redirige vers HTTPS.');

const page = await request('/');
assert.equal(page.status, 200, 'Page principale inaccessible');
assert.match(page.headers.get('content-type') || '', /text\/html/);
const html = await page.text();
assert.match(html, /id=["']root["']/);
const asset = html.match(/src=["']([^"']+\.js)["']/)?.[1];
assert.ok(asset, 'Bundle JavaScript absent');
assert.equal(new URL(asset, origin).origin, origin.origin);
const bundle = await request(asset);
assert.equal(bundle.status, 200, 'Bundle JavaScript inaccessible');
assert.match(bundle.headers.get('content-type') || '', /javascript/);
await bundle.arrayBuffer();
console.log('OK : page React et bundle accessibles avec un certificat TLS valide.');

const health = await request('/health');
assert.equal(health.status, 200);
const status = await health.json();
assert.equal(status.status, 'ok');
assert.ok(Math.abs(Date.now() - Date.parse(status.timestamp)) < 60000, 'Horodatage de santé invalide');

const categories = await request('/api/categories');
assert.equal(categories.status, 200);
assert.deepEqual(Object.keys(await categories.json()).sort(), ['length', 'temperature', 'volume', 'weight']);
const conversion = await request('/api/convert', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ category: 'length', fromUnit: 'm', toUnit: 'cm', value: 2 }),
});
assert.equal(conversion.status, 200);
assert.equal((await conversion.json()).convertedValue, 200);
console.log('OK : santé du backend, catégories et conversion 2 m = 200 cm via NGINX.');
