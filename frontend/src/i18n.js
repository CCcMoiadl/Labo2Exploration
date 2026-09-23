export const messages = {
  fr: {
    language: 'Langue', french: 'Français', english: 'English',
    themeTooltip: 'Personnaliser la couleur du thème', themeAria: 'Choisir la couleur du thème',
    light: 'Passer au mode clair', dark: 'Passer au mode sombre', lightAria: 'Activer le mode clair', darkAria: 'Activer le mode sombre',
    themeColor: 'Couleur du thème', themeHelp: 'Cliquez sur la couleur pour ouvrir la roue.', openColor: 'Ouvrir la roue de couleur', customColor: 'Couleur personnalisée du thème',
    editable: 'Modifiable', hexLabel: 'Valeur hexadécimale', hexError: 'Format attendu : #RRGGBB', resetPurple: 'Rétablir le violet', chooseColor: (color) => `Choisir la couleur ${color}`,
    instant: 'Conversion instantanée', heroTitle: 'Chaque mesure,', heroAccent: ' simplifiée.', heroDescription: 'Convertissez longueurs, volumes, masses et températures avec précision, en un clin d’œil.',
    measurement: 'Type de mesure', categories: 'Catégories de conversion', value: 'Valeur à convertir', from: 'Unité de départ', to: 'Unité d’arrivée', swap: 'Inverser les unités',
    converting: 'Conversion en cours…', result: 'Résultat', equals: 'équivaut à', enterValue: 'Entrez une valeur pour voir le résultat.',
    history: 'Historique récent', lastConversions: 'Vos 20 dernières conversions', clear: 'Tout effacer', empty: 'Rien à afficher pour le moment', next: 'Vos prochaines conversions apparaîtront ici.', restore: 'Réappliquer cette conversion',
    preparing: 'Préparation du convertisseur…', retry: 'Réessayer', offline: 'Le serveur est hors ligne ou inaccessible. Vérifiez que le backend Node.js est démarré.', footer: 'Unitly · Des conversions simples et précises',
    loadCategories: 'Impossible de charger les catégories.', invalidValue: 'Veuillez saisir une valeur à convertir.', finite: 'Veuillez saisir un nombre fini valide.', invalidCategory: 'Veuillez choisir une catégorie valide.', invalidUnits: 'Veuillez choisir des unités valides.',
    negative: 'Les valeurs négatives ne sont pas autorisées pour cette catégorie.', absoluteZero: 'La température ne peut pas être inférieure au zéro absolu.', connection: 'Impossible de joindre le serveur. Veuillez réessayer.', invalidResponse: 'Le serveur a envoyé une réponse invalide. Veuillez réessayer.', conversionFailed: 'La conversion a échoué. Veuillez réessayer.', invalidRequest: 'Le corps de la requête doit être au format JSON.', invalidObject: 'Un objet JSON est attendu.', invalidNumber: 'La valeur à convertir doit être un nombre valide.', invalidApiCategory: 'Catégorie invalide ou manquante.', invalidApiUnits: 'Unités de départ ou d’arrivée invalides.', apiNegative: 'La valeur ne peut pas être négative pour cette catégorie.', tooLarge: 'La valeur est trop grande pour cette conversion.',
    categoryNames: { length: 'Longueur', volume: 'Volume', weight: 'Poids', temperature: 'Température' },
    units: { ft: 'Pieds', m: 'Mètres', cm: 'Centimètres', km: 'Kilomètres', in: 'Pouces', mi: 'Milles', l: 'Litres', ml: 'Millilitres', gal: 'Gallons (US)', cup: 'Tasses (US)', oz: 'Onces liquides (US)', kg: 'Kilogrammes', g: 'Grammes', lb: 'Livres', C: 'Celsius', F: 'Fahrenheit', K: 'Kelvin' },
  },
  en: {
    language: 'Language', french: 'Français', english: 'English',
    themeTooltip: 'Customize theme color', themeAria: 'Choose theme color',
    light: 'Switch to light mode', dark: 'Switch to dark mode', lightAria: 'Enable light mode', darkAria: 'Enable dark mode',
    themeColor: 'Theme color', themeHelp: 'Click the color to open the picker.', openColor: 'Open color picker', customColor: 'Custom theme color',
    editable: 'Editable', hexLabel: 'Hex value', hexError: 'Expected format: #RRGGBB', resetPurple: 'Restore purple', chooseColor: (color) => `Choose color ${color}`,
    instant: 'Instant conversion', heroTitle: 'Every measurement,', heroAccent: ' simplified.', heroDescription: 'Convert lengths, volumes, weights, and temperatures accurately in the blink of an eye.',
    measurement: 'Measurement type', categories: 'Conversion categories', value: 'Value to convert', from: 'From unit', to: 'To unit', swap: 'Swap units',
    converting: 'Converting…', result: 'Result', equals: 'equals', enterValue: 'Enter a value to see the result.',
    history: 'Recent history', lastConversions: 'Your last 20 conversions', clear: 'Clear all', empty: 'Nothing to show yet', next: 'Your next conversions will appear here.', restore: 'Apply this conversion again',
    preparing: 'Preparing converter…', retry: 'Retry', offline: 'The server is offline or unreachable. Check that the Node.js backend is running.', footer: 'Unitly · Simple and accurate conversions',
    loadCategories: 'Unable to load categories.', invalidValue: 'Enter a value to convert.', finite: 'Enter a valid finite number.', invalidCategory: 'Choose a valid category.', invalidUnits: 'Choose valid units.',
    negative: 'Negative values are not allowed for this category.', absoluteZero: 'Temperature cannot be below absolute zero.', connection: 'Unable to reach the server. Please try again.', invalidResponse: 'The server returned an invalid response. Please try again.', conversionFailed: 'Conversion failed. Please try again.', invalidRequest: 'The request body must be valid JSON.', invalidObject: 'A JSON object is required.', invalidNumber: 'The value must be a valid number.', invalidApiCategory: 'Invalid or missing category.', invalidApiUnits: 'Invalid source or destination units.', apiNegative: 'The value cannot be negative for this category.', tooLarge: 'The value is too large for this conversion.',
    categoryNames: { length: 'Length', volume: 'Volume', weight: 'Weight', temperature: 'Temperature' },
    units: { ft: 'Feet', m: 'Meters', cm: 'Centimeters', km: 'Kilometers', in: 'Inches', mi: 'Miles', l: 'Liters', ml: 'Milliliters', gal: 'Gallons (US)', cup: 'Cups (US)', oz: 'Fluid ounces (US)', kg: 'Kilograms', g: 'Grams', lb: 'Pounds', C: 'Celsius', F: 'Fahrenheit', K: 'Kelvin' },
  },
};

export const unitName = (unit, language) => messages[language].units[unit.id] ?? unit.name;
export const categoryName = (id, fallback, language) => messages[language].categoryNames[id] ?? fallback;
