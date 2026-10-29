/**
 * Curated anime data model.
 *
 * PokéAPI contains NO anime information, so this layer is completely separate
 * from `lib/pokeapi`. Every record must be independently verifiable, which is
 * why `source` is required.
 */

export type AppearanceRole = "main" | "supporting" | "cameo";

/** How much of the plot a summary reveals. Used later for spoiler-aware journeys. */
export type SpoilerLevel = "none" | "mild" | "major";

export interface AnimeEpisodeAppearance {
  /** Stable unique id, e.g. "xy-044-greninja". */
  id: string;
  /** PokéAPI slug of the Pokémon ("pikachu"). Links this dataset to PokéAPI data. */
  pokemon: string;
  series: string;
  episodeNumber: number;
  title: string;
  airDate?: string; // ISO date
  role: AppearanceRole;
  summary?: string;
  spoilerLevel: SpoilerLevel;
  /** Where a human can verify this record (wiki page, official episode guide, ...). */
  source: { name: string; url: string };
}
