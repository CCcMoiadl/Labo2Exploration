export function validateConversion(value, category, from, to, categories) {
  if (typeof value !== 'string' || value.trim() === '') return 'Veuillez saisir une valeur à convertir.';
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Veuillez saisir un nombre fini valide.';
  if (!Object.hasOwn(categories, category)) return 'Veuillez choisir une catégorie valide.';
  const units = categories[category].units;
  if (!units.some((unit) => unit.id === from) || !units.some((unit) => unit.id === to)) return 'Veuillez choisir des unités valides.';
  if (category !== 'temperature' && number < 0) return 'Les valeurs négatives ne sont pas autorisées pour cette catégorie.';
  if (category === 'temperature' && number < { C: -273.15, F: -459.67, K: 0 }[from]) return 'La température ne peut pas être inférieure au zéro absolu.';
  return '';
}

export async function requestConversion(payload, signal) {
  let response;
  try {
    response = await fetch('/api/convert', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Impossible de joindre le serveur. Veuillez réessayer.');
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error('Le serveur a envoyé une réponse invalide. Veuillez réessayer.'); }
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'La conversion a échoué. Veuillez réessayer.');
  if (!Number.isFinite(data?.convertedValue) || typeof data?.formula !== 'string') throw new Error('Le serveur a envoyé une réponse invalide. Veuillez réessayer.');
  return data;
}
