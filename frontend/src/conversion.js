import { messages } from './i18n.js';

export function validateConversion(value, category, from, to, categories, language = 'fr') {
  const t = messages[language];
  if (typeof value !== 'string' || value.trim() === '') return t.invalidValue;
  const number = Number(value);
  if (!Number.isFinite(number)) return t.finite;
  if (!Object.hasOwn(categories, category)) return t.invalidCategory;
  const units = categories[category].units;
  if (!units.some((unit) => unit.id === from) || !units.some((unit) => unit.id === to)) return t.invalidUnits;
  if (category !== 'temperature' && number < 0) return t.negative;
  if (category === 'temperature' && number < { C: -273.15, F: -459.67, K: 0 }[from]) return t.absoluteZero;
  return '';
}

export async function requestConversion(payload, signal, language = 'fr') {
  const t = messages[language];
  let response;
  try {
    response = await fetch('/api/convert', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error(t.connection);
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error(t.invalidResponse); }
  if (!response.ok) {
    const serverError = typeof data?.error === 'string' ? data.error : '';
    if (language === 'fr') throw new Error(serverError || t.conversionFailed);
    const translatedError = [
      ['Catégorie invalide', t.invalidApiCategory], ['Unités de départ', t.invalidApiUnits],
      ['nombre valide', t.invalidNumber], ['ne peut pas être négative', t.apiNegative],
      ['zéro absolu', t.absoluteZero], ['trop grande', t.tooLarge],
      ['objet JSON', t.invalidObject], ['format JSON', t.invalidRequest],
    ].find(([phrase]) => serverError.includes(phrase))?.[1];
    throw new Error(translatedError || t.conversionFailed);
  }
  if (!Number.isFinite(data?.convertedValue) || typeof data?.formula !== 'string') throw new Error(t.invalidResponse);
  return data;
}
