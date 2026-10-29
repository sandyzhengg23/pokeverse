/** "mr-mime" → "Mr Mime", "special-attack" → "Special Attack" */
export function formatName(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** 25 → "#025" */
export function formatPokemonId(id: number): string {
  return `#${String(id).padStart(3, "0")}`;
}

/** Extracts the numeric id from a PokéAPI resource URL (".../pokemon-species/25/"). */
export function idFromUrl(url: string): number {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : NaN;
}

/** PokéAPI's alternate forms (megas, regional forms, ...) have ids ≥ 10000. */
export const MAX_BASE_POKEMON_ID = 10000;
