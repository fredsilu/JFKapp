export function normalizeText(text: string): string {
  return text
    .normalize('NFD')                // sépare lettres + accents
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .toLowerCase()
    .trim();
}
