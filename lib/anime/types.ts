/**
 * Curated anime data model.
 *
 * PokéAPI contains NO anime information, so this layer is completely separate
 * from `lib/pokeapi`. Every record must be independently verifiable, which is
 * why `source` is required. Pokémon are linked by National Dex SPECIES id (the
 * same id PokéAPI uses), never by display name.
 */

export type AppearanceRole = "main" | "supporting" | "cameo";

/** How much of the plot a summary reveals. Used for spoiler-aware browsing and journeys. */
export type SpoilerLevel = "none" | "mild" | "major";

export type Significance =
  | "introduction"
  | "character_development"
  | "evolution"
  | "major_battle"
  | "notable_appearance";

/** One Pokémon's part in one episode. */
export interface PokemonInEpisode {
  /** National Dex species id (matches PokéAPI `pokemon-species` ids). */
  pokemonId: number;
  role: AppearanceRole;
  significance: Significance;
  /** Why this episode matters for this Pokémon. Only states what the source page supports. */
  why: string;
}

export interface AnimeEpisode {
  /** Stable unique id, e.g. "indigo-023-the-tower-of-terror". Never change once published. */
  id: string;
  title: string;
  /** Series/saga label as used by the source. */
  series: string;
  /** Overall episode number as numbered by the source. null if not verified. */
  episodeNumber: number | null;
  /** ISO date, or null if the source page doesn't state it. */
  airDate: string | null;
  /** Original, concise summary (not copied from the source). */
  summary: string;
  /** Featured characters/trainers named on the source page. */
  characters: string[];
  pokemon: PokemonInEpisode[];
  spoilerLevel: SpoilerLevel;
  /** Where a human can verify this record. */
  source: { name: string; url: string };
  /** ISO date this record was last checked against `source`. */
  verifiedOn: string;
}

/** One episode seen from one Pokémon's point of view. */
export interface AnimeEpisodeAppearance extends AnimeEpisode {
  pokemonId: number;
  role: AppearanceRole;
  significance: Significance;
  why: string;
}
