#!/usr/bin/env bash
set -euo pipefail

fail() { printf 'Erreur : %s\n' "$1" >&2; exit 1; }
trap 'printf "Échec du déploiement à la ligne %s.\n" "$LINENO" >&2' ERR

# Fournir les chemins et le port de la VM, sans secrets.
APP_DIR="${APP_DIR:-<APP_DIR>}"
BACKEND_PORT="${BACKEND_PORT:-<BACKEND_PORT>}"
WEB_ROOT="${WEB_ROOT:-/var/www/unitly}"

[[ "$EUID" -ne 0 ]] || fail 'Exécuter ce script avec le compte de déploiement, pas root.'
[[ "$APP_DIR" == /* && -d "$APP_DIR" ]] || fail 'APP_DIR doit être un répertoire absolu existant.'
[[ "$BACKEND_PORT" =~ ^[1-9][0-9]{3,4}$ ]] || fail 'BACKEND_PORT doit être un port entre 1024 et 65535.'
(( BACKEND_PORT >= 1024 && BACKEND_PORT <= 65535 )) || fail 'Port hors limites.'
[[ "$WEB_ROOT" == /* && -d "$WEB_ROOT" && -w "$WEB_ROOT" ]] || fail 'WEB_ROOT doit être un répertoire absolu existant et accessible en écriture.'

cd -- "$APP_DIR"
for command in npm node flock sudo; do
  command -v "$command" >/dev/null || fail "Commande requise absente : $command"
done
[[ -x /usr/bin/systemctl ]] || fail 'systemctl est attendu dans /usr/bin/systemctl.'
[[ -f backend/package-lock.json && -f frontend/package-lock.json && -f backend/server.js ]] || fail 'Structure du dépôt incomplète.'
[[ "$(node -p 'process.versions.node.split(".")[0]')" == 24 ]] || fail 'Node.js 24 est requis.'

# Empêcher deux déploiements simultanés dans ce dépôt.
exec 9>.deploy.lock
flock -n 9 || fail 'Un autre déploiement est déjà en cours.'
sudo -n -l /usr/bin/systemctl restart unitly-backend.service >/dev/null 2>&1 || fail 'Permission sudo de redémarrage absente (voir README).'
umask 022

printf '[1/5] Installation et compilation du frontend\n'
(
  cd frontend
  npm ci --include=dev --no-audit --no-fund
  npm test
  npm run lint
  npm run build
)
[[ -s frontend/dist/index.html && -d frontend/dist/assets ]] || fail 'Build frontend incomplet.'

printf '[2/5] Installation et vérification du backend\n'
(
  cd backend
  npm ci --omit=dev --no-audit --no-fund
  npm run check
  npm test
)

printf '[3/5] Redémarrage du backend\n'
sudo -n /usr/bin/systemctl restart unitly-backend.service

printf '[4/5] Vérification de santé du backend\n'
BACKEND_PORT="$BACKEND_PORT" node --input-type=module <<'NODE'
const url = `http://127.0.0.1:${process.env.BACKEND_PORT}/health`;
let healthy = false;
for (let attempt = 0; attempt < 15; attempt++) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000), redirect: 'error' });
    if (response.status !== 200 || !response.headers.get('content-type')?.includes('application/json')) throw new Error();
    const body = await response.json();
    const timestamp = Date.parse(body.timestamp);
    if (body.status !== 'ok' || !Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > 60000) throw new Error();
    healthy = true;
    break;
  } catch {
    // Ne jamais afficher le corps de réponse ou le détail des erreurs réseau.
    if (attempt < 14) await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
if (!healthy) {
  console.error('Erreur : /health ne renvoie pas un statut 200 et un JSON de santé valide. Consulter les journaux du service.');
  process.exit(1);
}
console.log('Backend opérationnel : HTTP 200, statut ok et horodatage récent.');
NODE

printf '[5/5] Publication du frontend statique\n'
# Publier les ressources avant index.html ; conserver les anciens assets en cache.
for entry in frontend/dist/*; do
  [[ "$(basename -- "$entry")" == index.html ]] && continue
  cp -R -- "$entry" "$WEB_ROOT/"
done
cp -- frontend/dist/index.html "$WEB_ROOT/index.html"
printf 'Déploiement terminé. Configuration NGINX inchangée : aucun rechargement nécessaire.\n'
