# Application de Conversion d'Unités de Mesure 🔄

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
* `/backend` : API REST Node.js développée avec Express (Port 5000) gérant l'ensemble des règles métiers et les calculs de conversion.
* `/frontend` : Application Web Single Page (SPA) développée en React avec Vite et structurée par des composants Material UI modernes (Port 5173).

---

## Comment Lancer l'Application

### Prérequis
* Node.js (v18+) et npm installés sur votre machine.

### 1. Lancer le Backend (Serveur de Conversion)
Dans un terminal, déplacez-vous dans le dossier `/backend` et lancez le serveur :
```bash
cd backend
npm install   # Installé automatiquement
npm start     # Démarre le serveur sur http://localhost:5000
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
