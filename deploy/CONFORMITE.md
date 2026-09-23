# Audit du laboratoire — 23 septembre 2026

Le site fonctionne depuis l'extérieur. L'audit a été complété par une connexion
SSH avec la clé d'administration fournie, des contrôles sur la VM et un essai
dans Chrome depuis le PC Windows. Les réglages du portail Azure non accessibles
par SSH sont distingués des résultats observés.

| Tâche | État vérifié pendant cet audit | Preuve ou action restante |
|---|---|---|
| 1. VM Linux Azure | Confirmé par SSH : Ubuntu 24.04.4 LTS, noyau Azure et métadonnées Azure | Taille réelle `Standard_B2ats_v2`. |
| 2. OS, CPU, mémoire, stockage | Inventaire relevé sur la VM et dans IMDS | Valeurs réelles dans le tableau ci-dessous. |
| 3. Réseau et SSH protégé | UFW actif, HTTP/HTTPS autorisés, SSH par clé avec limitation des tentatives, root et mots de passe interdits ; backend sur `127.0.0.1:3000` | Détail du NSG à consulter dans Azure ; SSH reste public pour le runner GitHub. |
| 4. Domaine et DNS | Résolution A de `cegexplabo.xyz` vers `64.236.212.75` confirmée | Confirmer dans Azure que l'IP est statique et conserver une preuve de réservation du domaine. Porkbun est indiqué dans AZURE.md. |
| 5. NGINX et reverse proxy | `nginx -t` réussi sur la VM ; page React et API accessibles sur le même domaine | Configuration active valide et routage testé. |
| 6. Dépendances et démarrage automatique | Node.js 24.21.0 et npm 11.19.0 ; NGINX et backend `enabled` et `active` | Redémarrage du backend réussi ; aucun redémarrage complet de la VM pendant l'audit. |
| 7. Application sur le domaine | Confirmé par requêtes externes | Page, bundle JS, santé, catégories et conversion `2 m = 200 cm` réussis. |
| 8. Let's Encrypt et HTTP → HTTPS | Certificat Let's Encrypt validé, expiration le 22 décembre 2026 à 18:10:46 UTC ; redirection HTTP 301 vers HTTPS confirmée | `certbot.timer` activé et actif ; `certbot renew --dry-run` réussi. |
| 9. GitHub Actions | Workflow sur push `main`, dépendances, tests, lint, build, SSH avec secrets, journaux et résumé présents ; une exécution réussie confirmée | Les nouveaux contrôles locaux doivent encore être publiés. Ne jamais copier les valeurs des secrets dans le rapport. |
| 10. Navigateur externe et pipeline après fusion | Chrome externe affiche `1 ft = 0,3048 m` ; pipeline exécuté après fusion de la PR #2 (échec), puis réussi sur le push de correction | Liens ci-dessous. Rejouer après la prochaine fusion pour obtenir aussi un succès directement sur une fusion. |

## Inventaire des ressources

Relevés du 23 septembre 2026. Le nom du processeur hôte ne représente pas le
nombre de cœurs alloués à cette VM ; l'espace disponible varie avec l'utilisation.

| Ressource | Valeur | Origine |
|---|---|---|
| Système | Ubuntu 24.04.4 LTS, x86-64, noyau `6.17.0-1022-azure` | `/etc/os-release`, `uname` |
| Taille Azure (SKU) | `Standard_B2ats_v2` | Azure IMDS, champ `compute/vmSize` |
| Processeur (modèle et vCPU) | AMD EPYC 7763 64-Core Processor ; **2 vCPU alloués** | `lscpu` |
| Mémoire totale | 892 Mio visibles par Linux ; swap absent | `free -h` |
| Disque OS (type et capacité provisionnée) | 30 Gio ; `Premium_LRS` | `lsblk` et IMDS `storageProfile/osDisk/managedDisk/storageAccountType` |
| Stockage visible et espace disponible | Racine ext4 de 29 Gio ; 3,1 Gio utilisés, 25 Gio disponibles | `lsblk` et `df -h /` |
| Adresse IPv4 publique | `64.236.212.75` | DNS confirmé ; allocation statique à confirmer dans Azure |
| Domaine | `cegexplabo.xyz` | Résolution DNS et HTTPS confirmés |

Sur la VM, relever les informations sans inclure de clés, jetons ou fichiers `.env` :

```sh
cat /etc/os-release
lscpu
free -h
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS
df -h /
command -v node
node --version
npm --version
sudo systemctl is-enabled nginx unitly-backend.service
sudo systemctl is-active nginx unitly-backend.service
sudo nginx -t
sudo ss -lntp
sudo ufw status verbose
sudo sshd -T | grep -E '^(port|permitrootlogin|pubkeyauthentication|passwordauthentication|kbdinteractiveauthentication) '
sudo certbot certificates
sudo systemctl status certbot.timer --no-pager
sudo certbot renew --dry-run
```

Le contrôle SSH doit aussi tenir compte d'éventuels blocs `Match` : utiliser
`sshd -T -C user=azureuser,host=<hote-client>,addr=<ip-client>` pour le contexte
réel. Après correction, `sshd -t` réussit et `sshd -T` confirme
`permitrootlogin no`, `passwordauthentication no` et
`kbdinteractiveauthentication no`. Une nouvelle connexion `azureuser` avec
la clé autorisée a réussi après rechargement.

## Réseau et sécurité appliqués

UFW est actif et activé au démarrage : connexions entrantes refusées par défaut,
sortantes autorisées, TCP 80/443 autorisés et TCP 22 limité en fréquence, en
IPv4 et IPv6. Le backend écoute exclusivement sur `127.0.0.1:3000`, constaté
avec `ss -lntp`. Les détails du NSG restent à relever dans le portail Azure.

Le fichier [ssh/00-unitly-security.conf](ssh/00-unitly-security.conf) reproduit
les paramètres installés dans `/etc/ssh/sshd_config.d/00-unitly-security.conf`.
SSH exige une clé et refuse root ainsi que les mots de passe. Le pipeline
vérifie strictement la clé hôte. La clé privée d'administration n'a été ni
affichée, ni copiée sur la VM, ni ajoutée au dépôt.

Le service tourne actuellement sous `azureuser`, qui possède des droits sudo
d'administration. Pour réduire davantage les droits de la clé de déploiement,
migrer vers un compte dédié avec le sudo limité décrit dans le README et
adapter le service ainsi que les secrets GitHub. Cette migration n'a pas été
effectuée pendant l'audit.

Limiter la source du port 22 à l'IP d'administration et à la source du runner.
Le workflow utilise actuellement `ubuntu-latest`, dont l'adresse sortante n'est
pas fixe : une règle limitée à l'IP personnelle empêcherait le déploiement.
Pour une restriction réseau stable, utiliser un runner avec sortie fixe ou une
connexion privée et adapter `runs-on`. Ne pas modifier les règles actives sans
vérifier l'accès administrateur et celui du pipeline.

## HTTPS et démarrage automatique

Le fichier NGINX du dépôt sert à l'installation HTTP initiale. Après pointage
DNS et ouverture des ports, l'administrateur peut configurer le certificat avec :

```sh
sudo certbot --nginx -d cegexplabo.xyz --redirect
sudo nginx -t
sudo systemctl enable --now nginx unitly-backend.service certbot.timer
sudo certbot renew --dry-run
```

Ces commandes supposent Certbot et son plugin NGINX installés ainsi que le
service systemd complété. Sur une installation utilisant une autre méthode
d'installation de Certbot, vérifier le mécanisme de renouvellement correspondant.
Ne pas réinstaller le modèle HTTP par-dessus le site HTTPS déjà configuré.
Contrôler l'émetteur et les échéances avec `certbot certificates`.

Après un redémarrage planifié de la VM, exécuter les contrôles `is-enabled`,
`is-active` et le test public ci-dessous. Conserver la date et les résultats
pour prouver le démarrage automatique, sans déclarer ce test réussi à l'avance.

## Vérifications exécutées et preuves GitHub

Le 23 septembre 2026 : installation des dépendances des deux projets,
13 tests backend et 4 tests frontend réussis, syntaxe backend, lint et build
frontend réussis. Syntaxe Bash de `deploy.sh` vérifiée.

Depuis une machine extérieure à la VM, avec Node.js 24 :

```sh
node deploy/verify-public.mjs
```

Ce script a réussi pendant l'audit. Il vérifie la redirection permanente HTTP,
la validation TLS et l'émetteur Let's Encrypt, la page HTML et son bundle JavaScript, `/health`, les quatre
catégories et une conversion réelle. Il fait désormais partie du workflow de
production. Ce contrôle HTTP n'exécute pas l'interface dans un navigateur.

Un contrôle supplémentaire a été exécuté dans Google Chrome en mode headless
depuis le PC Windows, avec un profil temporaire neuf : la page publique charge
React et son API, puis affiche `1 ft = 0,3048 m` dans le panneau de résultat.
Le DOM rendu a été contrôlé après exécution du JavaScript. L'historique et les
autres interactions n'ont pas fait l'objet d'un scénario navigateur complet.

L'API publique GitHub confirme :

- [Déploiement réussi sur push main](https://github.com/CCcMoiadl/Labo2Exploration/actions/runs/35907414651),
  commit `9e7d0cd861706a747a0dfc288cdafed4e2cb2c53`, lancé à 19:09:26 UTC.
- [Déploiement échoué après la fusion précédente](https://github.com/CCcMoiadl/Labo2Exploration/actions/runs/35898399705),
  commit `e3330d533ddfc4bfd0539a7aa9deb81f32c42406`, lancé à 17:50:46 UTC.

Le succès plus récent prouve un déploiement sur push ; le premier lien de fusion
prouve qu'un test après fusion a bien eu lieu, avec un échec ensuite corrigé.
Il reste préférable d'obtenir aussi une exécution réussie directement sur une
nouvelle fusion. Les corrections de CI et le contrôle public renforcé sont
encore locaux ; la restriction d'écoute du backend a aussi été appliquée sur la VM.

## Validation finale à consigner

1. Conserver une preuve du NSG, de l'allocation statique de l'IP et de la
   réservation du domaine depuis les portails correspondants.
2. Pour compléter le test Chrome automatisé, vérifier manuellement les menus,
   l'historique et le rechargement ; conserver une capture datée si nécessaire.
3. Lors d'un prochain redémarrage planifié, confirmer que l'application revient
   sans démarrage manuel. Les services sont déjà configurés `enabled`.
4. Soumettre un changement par pull request, attendre la CI, puis fusionner dans
   `main`. Relever l'URL de la PR, le SHA fusionné et l'URL de l'exécution de
   déploiement réussie correspondant à ce SHA.
5. Confirmer les étapes SSH et contrôle public dans les journaux, puis refaire
   une conversion dans le navigateur. Ajouter les preuves à ce document.

La clé du Bureau a permis de terminer l'audit SSH. Le backend, la configuration
SSH et UFW ont été corrigés sur la VM. Aucune fusion ou publication GitHub n'a
été effectuée pendant cet audit ; les preuves citées sont des observations réelles.
