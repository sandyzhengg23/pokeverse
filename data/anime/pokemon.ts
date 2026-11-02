/**
 * Display names for the species that appear in `episodes.ts` (National Dex
 * species ids, same as PokéAPI). Used for AI prompts and deterministic text so
 * they never depend on a network call. Add an entry when an episode record
 * features a new species.
 */
export const ANIME_POKEMON_NAMES: Readonly<Record<number, { name: string; slug: string }>> = {
  25: { name: "Pikachu", slug: "pikachu" },
  92: { name: "Gastly", slug: "gastly" },
  93: { name: "Haunter", slug: "haunter" },
  94: { name: "Gengar", slug: "gengar" },
  133: { name: "Eevee", slug: "eevee" },
  134: { name: "Vaporeon", slug: "vaporeon" },
  135: { name: "Jolteon", slug: "jolteon" },
  136: { name: "Flareon", slug: "flareon" },
  196: { name: "Espeon", slug: "espeon" },
  197: { name: "Umbreon", slug: "umbreon" },
  470: { name: "Leafeon", slug: "leafeon" },
  471: { name: "Glaceon", slug: "glaceon" },
};
