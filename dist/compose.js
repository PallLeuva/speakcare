// Pure functions are shared by the UI and tests. No generated medical advice.
export function composeMessage(ids, phrases, language, discomfort, customText = '') {
  const sentences = ids.map(id => phrases.find(p => p.id === id)?.[language]?.text).filter(Boolean);
  if (discomfort) sentences.push(discomfort);
  if (customText.trim()) sentences.push(customText.trim());
  return sentences.join(' ');
}

export function discomfortMessage({ location, feeling, intensity, timing }, language, parts, feelings, times) {
  if (!location || !parts[location]) return '';
  const part = parts[location][language];
  const sensation = feelings[feeling]?.[language];
  const time = times[timing]?.[language];
  if (language === 'es') {
    return `Siento ${sensation || 'molestias'} en ${part}.${Number.isInteger(intensity) ? ` La intensidad es ${intensity} de 10.` : ''}${time ? ` ${time}` : ''}`;
  }
  return `I feel ${sensation || 'discomfort'} in my ${part}.${Number.isInteger(intensity) ? ` The intensity is ${intensity} out of 10.` : ''}${time ? ` ${time}` : ''}`;
}

export function filterPhrases(phrases, category, query, language, favoritesOnly = false, favorites = []) {
  const normalized = query.toLowerCase().trim();
  return phrases.filter(p => (!favoritesOnly || favorites.includes(p.id)) &&
    (category === 'all' || p.category === category) &&
    (!normalized || `${p[language].label} ${p[language].text} ${p.en.label} ${p.keywords || ''}`.toLowerCase().includes(normalized)));
}
