# Production Azure

- Site : https://cegexplabo.xyz
- VM Ubuntu 24.04 x86-64 : `64.236.212.75`, compte `azureuser`, SSH 22.
- DNS Porkbun : enregistrement A à la racine vers `64.236.212.75`.
- Application : `/opt/unitly`, frontend publié dans `/var/www/unitly`.
- Backend : service `unitly-backend`, port 3000 ; Node.js 24 installé dans
  `/opt/node-v24.21.0-linux-x64` et accessible via `/usr/local/bin/node`.
- Nginx sert React et transmet `/api/` et `/health` au backend.
- Certbot configure HTTPS et renouvelle le certificat avec `certbot.timer`.

Chaque push sur `main` déclenche `.github/workflows/deploy.yml` : tests,
lint, compilation, transfert SSH, redémarrage du backend et vérification HTTPS.
Un lancement manuel est disponible dans Actions → Déploiement production.

Les secrets `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY` et
`SSH_KNOWN_HOSTS` sont configurés dans GitHub Actions. La clé de déploiement
est dédiée à GitHub ; la clé privée d'administration du Bureau n'est pas
envoyée au dépôt. Les variables sont `APP_DIR=/opt/unitly`,
`BACKEND_PORT=3000` et `WEB_ROOT=/var/www/unitly`.

Le fichier `nginx-cegexplabo.conf` est la configuration HTTP initiale ; Certbot
ajoute les directives TLS sur la VM. Ne pas écraser la configuration active
avec ce fichier après l'émission du certificat.

Diagnostic sur la VM :

```sh
sudo systemctl status unitly-backend nginx
sudo journalctl -u unitly-backend -n 100 --no-pager
curl --fail http://127.0.0.1:3000/health
sudo nginx -t
sudo systemctl status certbot.timer
```

Conserver l'IP Azure statique et les ports 80/443 accessibles depuis Internet.
Le runner GitHub doit pouvoir joindre le port SSH. Les changements applicatifs
ne nécessitent aucune modification DNS ni connexion manuelle à la VM.
