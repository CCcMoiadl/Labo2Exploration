import express from 'express';
import cors from 'cors';
import { pathToFileURL } from 'node:url';

export const app = express();
const PORT = process.env.PORT || 3000;

// Ne journaliser que des métadonnées : aucune URL brute ni donnée utilisateur.
app.use((req, res, next) => {
  const started = process.hrtime.bigint();
  res.once('finish', () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      event: 'http_request',
      method: req.method,
      route: req.route?.path ?? 'unmatched',
      statusCode: res.statusCode,
      durationMs: Number((Number(process.hrtime.bigint() - started) / 1e6).toFixed(3)),
    }));
  });
  next();
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Structure des données des catégories et unités (en français pour l'utilisateur, avec labels clairs)
const unitData = {
  length: {
    name: "Longueur",
    baseUnit: "m",
    units: {
      m: { name: "Mètres", label: "m", factor: 1 },
      cm: { name: "Centimètres", label: "cm", factor: 0.01 },
      km: { name: "Kilomètres", label: "km", factor: 1000 },
      ft: { name: "Pieds", label: "ft", factor: 0.3048 },
      in: { name: "Pouces", label: "in", factor: 0.0254 },
      mi: { name: "Milles", label: "mi", factor: 1609.344 }
    }
  },
  volume: {
    name: "Volume",
    baseUnit: "l",
    units: {
      l: { name: "Litres", label: "L", factor: 1 },
      ml: { name: "Millilitres", label: "mL", factor: 0.001 },
      gal: { name: "Gallons (US)", label: "gal", factor: 3.785411784 },
      cup: { name: "Tasses (US)", label: "tasse", factor: 0.2365882365 },
      oz: { name: "Onces liquides (US)", label: "fl oz", factor: 0.02957352956 }
    }
  },
  weight: {
    name: "Poids / Masse",
    baseUnit: "kg",
    units: {
      kg: { name: "Kilogrammes", label: "kg", factor: 1 },
      g: { name: "Grammes", label: "g", factor: 0.001 },
      lb: { name: "Livres", label: "lb", factor: 0.45359237 },
      oz: { name: "Onces", label: "oz", factor: 0.028349523125 }
    }
  },
  temperature: {
    name: "Température",
    units: {
      C: { name: "Celsius", label: "°C" },
      F: { name: "Fahrenheit", label: "°F" },
      K: { name: "Kelvin", label: "K" }
    }
  }
};

// Fonctions spécifiques pour la conversion de température
const convertTemperature = (value, from, to) => {
  let celsius;
  // Convertir l'unité d'origine en Celsius
  if (from === 'C') {
    celsius = value;
  } else if (from === 'F') {
    celsius = (value - 32) * 5 / 9;
  } else if (from === 'K') {
    celsius = value - 273.15;
  } else {
    throw new Error("Unité de température d'origine invalide");
  }

  // Convertir le Celsius vers l'unité de destination
  let result;
  if (to === 'C') {
    result = celsius;
  } else if (to === 'F') {
    result = (celsius * 9 / 5) + 32;
  } else if (to === 'K') {
    result = celsius + 273.15;
  } else {
    throw new Error("Unité de température de destination invalide");
  }

  // Formule pour affichage
  let formula = "";
  if (from === 'C' && to === 'F') formula = `(${value} * 9/5) + 32`;
  else if (from === 'F' && to === 'C') formula = `(${value} - 32) * 5/9`;
  else if (from === 'C' && to === 'K') formula = `${value} + 273.15`;
  else if (from === 'K' && to === 'C') formula = `${value} - 273.15`;
  else if (from === 'F' && to === 'K') formula = `(${value} - 32) * 5/9 + 273.15`;
  else if (from === 'K' && to === 'F') formula = `(${value} - 273.15) * 9/5 + 32`;
  else formula = `${value}`;

  return { value: result, formula };
};

// Get all categories and units
app.get('/api/categories', (req, res) => {
  try {
    const categories = {};
    for (const [key, cat] of Object.entries(unitData)) {
      categories[key] = {
        name: cat.name,
        units: Object.entries(cat.units).map(([unitKey, unit]) => ({
          id: unitKey,
          name: unit.name,
          label: unit.label
        }))
      };
    }
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des catégories" });
  }
});

// Convert value
app.post('/api/convert', (req, res) => {
  if (!req.is('application/json')) {
    return res.status(415).json({ error: "Le corps de la requête doit être au format JSON." });
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Un objet JSON est attendu." });
  }
  const { category, fromUnit, toUnit, value } = req.body;

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return res.status(400).json({ error: "La valeur à convertir doit être un nombre valide." });
  }

  const numValue = Number(value);

  if (typeof category !== 'string' || !Object.hasOwn(unitData, category)) {
    return res.status(400).json({ error: "Catégorie invalide ou manquante." });
  }

  const catInfo = unitData[category];

  if (typeof fromUnit !== 'string' || !Object.hasOwn(catInfo.units, fromUnit) || typeof toUnit !== 'string' || !Object.hasOwn(catInfo.units, toUnit)) {
    return res.status(400).json({ error: "Unités de départ ou d'arrivée invalides." });
  }

  // Ne pas autoriser les valeurs négatives pour tout sauf la température
  if (category !== 'temperature' && numValue < 0) {
    return res.status(400).json({ error: "La valeur ne peut pas être négative pour cette catégorie." });
  }
  if (category === 'temperature' && numValue < { C: -273.15, F: -459.67, K: 0 }[fromUnit]) {
    return res.status(400).json({ error: "La température ne peut pas être inférieure au zéro absolu." });
  }

  try {
    let result;
    let formula = "";

    if (category === 'temperature') {
      const tempResult = convertTemperature(numValue, fromUnit, toUnit);
      result = tempResult.value;
      formula = tempResult.formula;
    } else {
      const fromFactor = catInfo.units[fromUnit].factor;
      const toFactor = catInfo.units[toUnit].factor;
      
      // Convert to base unit, then convert to target unit
      const baseValue = numValue * fromFactor;
      result = baseValue / toFactor;
      
      const ratio = fromFactor / toFactor;
      formula = `valeur * ${ratio.toPrecision(6)}`;
    }

    // Arrondir le résultat à 6 décimales pour éviter les problèmes de virgule flottante
    if (!Number.isFinite(result)) {
      return res.status(400).json({ error: "La valeur est trop grande pour cette conversion." });
    }
    const roundedResult = Number(result.toFixed(6));

    res.json({
      category,
      fromUnit,
      toUnit,
      originalValue: numValue,
      convertedValue: roundedResult,
      formula
    });
  } catch (error) {
    res.status(500).json({ error: "Une erreur est survenue lors de la conversion." });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable." });
});

app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: "Le corps de la requête contient un JSON invalide." });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: "Le corps de la requête est trop volumineux." });
  }
  res.status(500).json({ error: "Une erreur interne est survenue. Veuillez réessayer." });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Serveur de conversion démarré sur le port ${PORT}`);
  });
}
