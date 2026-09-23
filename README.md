# Application de Conversion d'Unités de Mesure (https://github.com/CCcMoiadl/Labo2Exploration/edit/main/README.md) 🔄

Cette application complète de conversion d'unités de mesure propose une interface utilisateur interactive et réactive construite en **React** avec **Material UI** (MUI), connectée à un serveur **Node.js / Express** pour effectuer tous les calculs de conversion en temps réel.

## Fonctionnalités Clés

1. **Catégories Supportées** :
   - 📏 **Longueur** : Mètres (m), Centimètres (cm), Kilomètres (km), Pieds (ft), Pouces (in), Milles (mi).
   - 💧 **Volume** : Litres (L), Millilitres (mL), Gallons US (gal), Tasses (tasse), Onces liquides (fl oz).
   - ⚖️ **Poids / Masse** : Kilogrammes (kg), Grammes (g), Livres (lb), Onces (oz).
   - 🌡️ **Température** : Celsius (°C), Fahrenheit (°F), Kelvin (K).

2. **Interface Interactive et Performante** :
   - **Conversion en temps réel** (Saisie réactive au fur et à mesure que vous tapez ou changez d'unité).
   - **Inversion rapide des unités** (Bouton "Swap" pour inverser l'unité d'origine et de destination, réajustant automatiquement la valeur convertie).
   - **Mode Sombre / Clair** (Basculez instantanément l'apparence de l'application selon vos préférences).
   - **Formules de conversion visibles** (La formule mathématique appliquée par le backend s'affiche sous le résultat).

3. **Historique des Conversions** :
   - Historique persistant (stocké dans le stockage local de votre navigateur).
   - Possibilité de réappliquer une ancienne conversion instantanément en un clic.
   - Option pour effacer l'historique complet.

4. **Robustesse et Validation** :
   - Validation stricte des données d'entrée (pas de valeurs négatives autorisées pour les dimensions physiques comme la longueur, le volume ou le poids, tout en autorisant les températures négatives).
   - Gestion gracieuse des erreurs de connexion au backend.

---

## Architecture de l'Application

L'application est structurée en deux répertoires distincts :
* `/backend` : API REST Node.js développée avec Express (Port 3000 par défaut) gérant l'ensemble des règles métiers et les calculs de conversion.
* `/frontend` : Application Web Single Page (SPA) développée en React avec Vite et structurée par des composants Material UI modernes (Port 5173).

---

## Comment Lancer l'Application

### Prérequis
* Node.js 24 et npm installés sur votre machine (version utilisée par le CI).

### 1. Lancer le Backend (Serveur de Conversion)
Dans un terminal, déplacez-vous dans le dossier `/backend` et lancez le serveur :
```bash
cd backend
npm install   # Installé automatiquement
npm start     # Démarre le serveur sur http://localhost:3000
```
Le serveur redémarrera automatiquement si vous effectuez des modifications si vous utilisez `npm run dev`.

### 2. Lancer le Frontend (Application React)
Dans un autre terminal, déplacez-vous dans le dossier `/frontend` et démarrez le serveur de développement :
```bash
cd frontend
npm install   # Installé automatiquement
npm run dev   # Démarre l'application sur http://localhost:5173
```

---

## Intégration continue (CI)

L'audit des dix exigences du laboratoire, les preuves disponibles et les
vérifications restant à effectuer sont dans [deploy/CONFORMITE.md](deploy/CONFORMITE.md).

Le workflow [GitHub Actions](.github/workflows/ci.yml) s'exécute à chaque push et pull request. Il peut aussi être lancé manuellement depuis l'onglet **Actions** du dépôt, en sélectionnant **CI**, puis **Run workflow**.

Deux jobs indépendants utilisent Node.js 24 et un cache npm :

* **Frontend** : installation reproductible avec `npm ci`, tests avec `npm test`, analyse du code avec `npm run lint`, puis compilation avec `npm run build`.
* **Backend** : installation avec `npm ci`, vérification de syntaxe avec `node --check server.js`, puis tests avec `npm test`.

Pour reproduire les vérifications localement, exécutez ces commandes dans les dossiers respectifs. Aucun secret n'est nécessaire pour les tests locaux. Le workflow `ci.yml` reste consacré aux vérifications ; le workflow `deploy.yml` décrit ci-dessous exécute également les vrais tests avant le déploiement.

### Déploiement GitHub Actions sur main

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) se déclenche à chaque push sur `main`. Il utilise les actions officielles `actions/checkout` et `actions/setup-node`, Node.js 24 et `npm ci`. Les tests backend et frontend, la vérification de syntaxe, le lint et le build doivent tous réussir avant toute connexion SSH. Les déploiements GitHub sont sérialisés sans interrompre celui qui est en cours.

Dans **Settings → Secrets and variables → Actions → Secrets**, créer exactement ces secrets :

| Secret | Contenu |
|---|---|
| `DEPLOY_HOST` | Adresse IPv4 publique ou nom DNS de la VM, sans préfixe SSH ni port |
| `DEPLOY_USER` | Compte Linux de déploiement non root, correspondant au service systemd |
| `SSH_PRIVATE_KEY` | Clé privée SSH dédiée au déploiement, complète et multiligne, sans phrase secrète pour cette exécution non interactive ; sa clé publique doit être autorisée sur la VM |
| `SSH_PORT` | Port SSH de la VM |
| `SSH_KNOWN_HOSTS` | Ligne(s) `known_hosts` de la VM, vérifiée(s) par un canal de confiance ; pour un port non standard, utiliser la forme `[hôte]:port` |

Le cinquième secret permet de vérifier l'identité du serveur avec `StrictHostKeyChecking=yes`. Ne pas accepter aveuglément une clé obtenue par `ssh-keyscan` pendant le pipeline. Vérifier son empreinte depuis la console de la VM avant d'enregistrer la ligne `known_hosts`. Aucun secret ne doit être ajouté au dépôt.

Dans l'onglet **Variables**, créer `APP_DIR` (obligatoire, racine du dépôt sur la VM, par exemple `/opt/unitly`). `BACKEND_PORT` et `WEB_ROOT` sont facultatives et valent respectivement `3000` et `/var/www/unitly` par défaut. Ces chemins doivent être absolus, sans espaces ni caractères spéciaux ; ils doivent correspondre à la configuration systemd et NGINX.

La VM doit être accessible en SSH depuis le runner GitHub, disposer de Node.js 24, npm, Bash, rsync et flock, et avoir les dossiers et permissions décrits dans la section `deploy.sh`. Le service systemd doit déjà être installé et activé, avec la permission sudo limitée à son redémarrage. Node.js et npm doivent être disponibles dans une session SSH non interactive.

Le transfert rsync contient `backend/`, `frontend/` (y compris le build validé) et `deploy.sh`. Il exclut `.git`, `node_modules`, tous les fichiers `.env*`, les clés et certificats, sans supprimer de fichiers distants. Le script existant refait les installations, tests et build sur la VM avant le redémarrage et le contrôle `/health`. La clé SSH temporaire est créée uniquement sur le runner, avec des permissions restrictives, puis supprimée à la fin de l'étape. Le code de sortie SSH transmet tout échec distant au workflow ; le résumé GitHub indique le résultat.

## Observabilité du backend

Après avoir lancé `npm start` dans `backend`, vérifiez l'application dans un second terminal :

```bash
curl -i http://localhost:3000/health
```

Dans Windows PowerShell, utilisez `curl.exe -i http://localhost:3000/health`.
Adaptez le port si la variable `PORT` est définie.
L'endpoint renvoie HTTP **200**, un JSON et l'en-tête `Cache-Control: no-store` :

```json
{"status":"ok","timestamp":"2026-09-16T14:30:00.000Z"}
```

L'horodatage UTC est généré à chaque appel. Cette vérification confirme que le processus Express répond ; elle ne vérifie pas des services externes.

Chaque requête terminée produit une ligne JSON sur la sortie standard : horodatage, niveau (`info`, `warn` pour les erreurs 4xx, `error` pour les erreurs 5xx), événement, méthode HTTP, route Express, statut HTTP et durée en millisecondes. Les routes non reconnues et les requêtes rejetées avant le routage portent la valeur `unmatched`.

Les journaux ne contiennent ni URL brute, paramètres de requête, corps, en-têtes, cookies, adresse IP, ni valeurs de conversion. Les tests backend (`cd backend`, puis `npm test`) vérifient `/health` et l'absence de données sensibles dans les journaux, y compris pour une route inconnue et un JSON invalide.

## Préparation pour Ubuntu et NGINX

Prérequis : Node.js 24 et npm. Depuis la racine du dépôt, installer et vérifier chaque partie :

```bash
cd backend
npm ci --omit=dev
npm run check
npm test
cd ../frontend
npm ci --include=dev
npm test
npm run lint
npm run build
cd ..
```

Le backend est du JavaScript directement exécutable : il ne nécessite pas de compilation. Pour le démarrer depuis la racine du dépôt sur Ubuntu :

```bash
cd backend
NODE_ENV=production PORT=3000 npm start
```

Cette commande reste au premier plan. Pour le démarrage automatique, utiliser le modèle systemd décrit ci-dessous.
`backend/.env.example` documente les variables sans secret. Aucun fichier `.env` n'est requis ni chargé automatiquement : les variables sont injectées via l'environnement du processus ou le service systemd. Le port par défaut est 3000.

Le build produit `frontend/dist/index.html` et `frontend/dist/assets/`, à servir comme fichiers statiques par NGINX. Par exemple, depuis la racine du dépôt, pour publier ces fichiers dans un répertoire accessible à NGINX :

```bash
sudo install -d -m 755 /var/www/unitly
sudo cp -R frontend/dist/. /var/www/unitly/
sudo find /var/www/unitly -type d -exec chmod 755 {} +
sudo find /var/www/unitly -type f -exec chmod 644 {} +
```

Configurer NGINX avec `/var/www/unitly` comme racine statique, `index.html` comme index et un repli vers `/index.html` pour les routes frontend. Transmettre `/api/` et `/health` au backend `http://127.0.0.1:3000` en conservant le chemin complet, notamment le préfixe `/api`. Le frontend utilise déjà des URL relatives `/api` ; aucune adresse de VM ou valeur secrète n'est intégrée au build. En développement et en prévisualisation, Vite transmet `/api` au port 3000 ; adapter sa configuration si le port backend local change.

NGINX sert directement le build en production ; les commandes `npm run dev` et `npm run preview` servent uniquement au développement et à la vérification locale. Après avoir configuré NGINX sur la VM :

```bash
sudo nginx -t
sudo systemctl reload nginx
curl --fail-with-body http://127.0.0.1:3000/health
```

## Démarrage automatique avec systemd (sur la VM Ubuntu uniquement)

Le modèle [deploy/systemd/unitly-backend.service](deploy/systemd/unitly-backend.service) utilise le dossier `backend` et lance directement `node server.js`, la commande réelle du script `npm start`. Systemd supervise ainsi le processus Node.js. Le service attend `network-online.target`, redémarre après une erreur avec un délai de cinq secondes et envoie ses sorties à journald.

Après installation des dépendances backend, préparer une copie du modèle sur la VM, depuis la racine du dépôt :

```bash
cp deploy/systemd/unitly-backend.service /tmp/unitly-backend.service
nano /tmp/unitly-backend.service
```

Remplacer tous les paramètres dans cette copie :

| Paramètre | Valeur attendue |
|---|---|
| `<DEPLOY_USER>` | Utilisateur Linux existant, non root et avec un UID différent de 0, par exemple `deploy` |
| `<APP_DIR>` | Chemin absolu de la racine du dépôt, par exemple `/opt/unitly` ; le modèle ajoute `/backend` |
| `<BACKEND_PORT>` | Port libre entre 1024 et 65535, par exemple `3000`, identique à la cible du proxy NGINX |

L'utilisateur doit pouvoir traverser le chemin et lire `backend/server.js` et `backend/node_modules`. Le modèle utilise `/usr/local/bin/node`, chemin indiqué dans la documentation Azure : vérifier `command -v node` et `node --version` sur la VM (Node.js 24), puis adapter `ExecStart` au chemin absolu réel si nécessaire. Systemd ne charge pas le profil shell ni automatiquement une installation Node.js gérée par nvm. Aucun secret n'est nécessaire dans cette unité. Le backend écoute uniquement sur `127.0.0.1` ; les connexions publiques passent par NGINX.

Valider la copie complétée, puis installer le service :

```bash
sudo systemd-analyze verify /tmp/unitly-backend.service
sudo install -o root -g root -m 644 /tmp/unitly-backend.service /etc/systemd/system/unitly-backend.service
sudo systemctl daemon-reload
sudo systemctl enable unitly-backend.service
sudo systemctl start unitly-backend.service
sudo systemctl status unitly-backend.service --no-pager
```

Le fichier d'unité appartient à root pour protéger sa configuration ; le processus s'exécute sous l'utilisateur renseigné dans `User=`. `enable` active le démarrage aux prochains démarrages de la VM et `start` le lance immédiatement.

Après mise à jour du backend, redémarrer et vérifier le service :

```bash
sudo systemctl restart unitly-backend.service
sudo systemctl status unitly-backend.service --no-pager
sudo journalctl -u unitly-backend.service -n 100 --no-pager
sudo journalctl -u unitly-backend.service -f
```

Quitter le suivi des journaux avec Ctrl+C. Vérifier également `curl --fail-with-body http://127.0.0.1:3000/health` en adaptant le port choisi. Après toute modification du fichier installé, relancer `daemon-reload`, puis `restart`. Toutes ces commandes sont destinées à la VM Ubuntu ; le modèle contenant les paramètres ne doit pas être installé tel quel.

## Script de déploiement sur la VM

Le script [deploy.sh](deploy.sh) s'exécute avec le compte de déploiement, jamais avec `sudo bash`. Il ne récupère pas le code : placer d'abord la version voulue dans le dépôt. Avec Node.js 24, npm, Bash et `flock` disponibles, exécuter :

```bash
APP_DIR=/opt/unitly BACKEND_PORT=3000 WEB_ROOT=/var/www/unitly bash /opt/unitly/deploy.sh
```

Remplacer les chemins et le port par ceux de la VM. `APP_DIR` désigne la racine du dépôt ; `BACKEND_PORT` doit correspondre au service systemd et au reverse proxy NGINX. Le script ne modifie pas le port du service installé. Le compte doit pouvoir écrire dans le dépôt, son cache npm et le répertoire statique `WEB_ROOT`, y compris les fichiers déjà publiés. NGINX doit pouvoir lire ces fichiers. Un administrateur prépare ces permissions une seule fois ; le script ne change aucun propriétaire ni aucune permission système.

Le script verrouille les déploiements concurrents, installe avec `npm ci`, teste et compile le frontend, installe les dépendances backend avec `--omit=dev`, vérifie et teste le backend, redémarre le service puis contrôle `/health`. Le contrôle exige HTTP 200, un contenu JSON, `status: "ok"` et un horodatage datant de moins d'une minute. Il réessaie jusqu'à 15 fois, avec un délai réseau de deux secondes et une pause d'une seconde. Un échec donne un code de sortie non nul. Le frontend est publié après validation de la santé du backend, ressources avant `index.html`, sans supprimer les anciens fichiers. Le déploiement est effectué sur place et peut interrompre brièvement le backend pendant la mise à jour des dépendances ; aucun retour arrière automatique n'est prévu.

La configuration NGINX ne change pas lors de ce déploiement : remplacer les fichiers statiques ne nécessite pas de rechargement. Le script ne demande donc aucune permission sudo pour NGINX. Une modification ultérieure de sa configuration doit être validée et rechargée séparément par l'administrateur.

### Permission sudo minimale

Le service doit déjà être installé et activé conformément à la section systemd. Le script utilise uniquement la commande privilégiée exacte `/usr/bin/systemctl restart unitly-backend.service`, avec `sudo -n` pour échouer sans demander de mot de passe. Sur Ubuntu, l'administrateur vérifie d'abord `command -v systemctl`, puis ouvre un fichier dédié avec `sudo visudo -f /etc/sudoers.d/unitly-deploy` et ajoute, en remplaçant `<DEPLOY_USER>` :

```sudoers
<DEPLOY_USER> ALL=(root) NOPASSWD: /usr/bin/systemctl restart unitly-backend.service
```

Valider avec `sudo visudo -c`. Ne pas autoriser `systemctl *`, un shell, npm ou le script complet en tant que root. Le fichier `/etc/systemd/system/unitly-backend.service` reste propriété de root et non modifiable par le compte de déploiement ; son `User=` doit être un compte non root. `daemon-reload`, `enable` et l'installation du service restent des opérations initiales administrateur, elles ne sont pas nécessaires à chaque déploiement. `systemctl status unitly-backend.service --no-pager` peut être exécuté sans sudo ; l'accès aux journaux dépend des permissions locales de journald.

## Détails Techniques

### API REST (Backend)

* **`GET /api/categories`**
  Renvoie la liste complète des catégories de conversion disponibles, ainsi que leurs unités associées, leurs noms complets et leurs symboles.

* **`POST /api/convert`**
  Effectue une conversion d'unité.
  * **Corps de la requête (JSON)** :
    ```json
    {
      "category": "length",
      "fromUnit": "ft",
      "toUnit": "m",
      "value": 10
    }
    ```
  * **Réponse (JSON)** :
    ```json
    {
      "category": "length",
      "fromUnit": "ft",
      "toUnit": "m",
      "originalValue": 10,
      "convertedValue": 3.048,
      "formula": "valeur * 0.304800"
    }
    ```

### Composants Material UI Utilisés (Frontend)
* `ThemeProvider`, `createTheme` et `CssBaseline` pour la gestion dynamique du thème Sombre/Clair.
* `Container`, `Grid` et `Box` pour une mise en page moderne, alignée et entièrement adaptative (mobile, tablette, PC).
* `Tabs` et `Tab` avec des icônes descriptives (`StraightenIcon`, `OpacityIcon`, `BalanceIcon`, `ThermostatIcon`) pour naviguer fluidement entre les catégories.
* `TextField` et `FormControl`/`Select` pour une saisie de données ergonomique et élégante.
* `Paper`, `Card` et `CardContent` pour des sections épurées au design surélevé.
* `Tooltip` pour ajouter des explications au survol des boutons interactifs.
* `Alert` pour avertir l'utilisateur en cas de saisie invalide ou d'indisponibilité du serveur.
