import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
  const { category, fromUnit, toUnit, value } = req.body;

  if (value === undefined || isNaN(value)) {
    return res.status(400).json({ error: "La valeur à convertir doit être un nombre valide." });
  }

  const numValue = Number(value);

  if (!category || !unitData[category]) {
    return res.status(400).json({ error: "Catégorie invalide ou manquante." });
  }

  const catInfo = unitData[category];

  if (!fromUnit || !catInfo.units[fromUnit] || !toUnit || !catInfo.units[toUnit]) {
    return res.status(400).json({ error: "Unités de départ ou d'arrivée invalides." });
  }

  // Ne pas autoriser les valeurs négatives pour tout sauf la température
  if (category !== 'temperature' && numValue < 0) {
    return res.status(400).json({ error: "La valeur ne peut pas être négative pour cette catégorie." });
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
    const roundedResult = Math.round(result * 1000000) / 1000000;

    res.json({
      category,
      fromUnit,
      toUnit,
      originalValue: numValue,
      convertedValue: roundedResult,
      formula
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Une erreur est survenue lors de la conversion." });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur de conversion démarré sur le port ${PORT}`);
});
// Serveur de conversion prêt et optimisé
