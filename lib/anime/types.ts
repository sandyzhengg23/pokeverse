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

/** A plot development that is hidden until the viewer's spoiler setting allows it. */
export interface SpoilerOutcome {
  level: Exclude<SpoilerLevel, "none">;
  text: string;
}

/** One Pokémon's part in one episode. */
export interface PokemonInEpisode {
  /** National Dex species id (matches PokéAPI `pokemon-species` ids). */
  pokemonId: number;
  role: AppearanceRole;
  significance: Significance;
  /**
   * Why this episode matters for this Pokémon. PREMISE ONLY: never state how a
   * storyline resolves (captures, power-ups, battle results, reveals). Put those in `outcome`.
   */
  why: string;
  /** What happens to this Pokémon, shown only when the spoiler setting allows `outcome.level`. */
  outcome?: SpoilerOutcome;
}

export interface AnimeEpisode {
  /** Stable unique id, e.g. "indigo-023-the-tower-of-terror". Never change once published. */
  id: string;
  title: string;
  /** Series/saga label as used by the source. */
  series: string;
  /** Serebii's OVERALL episode number across the whole anime (not per-season). null if not verified. */
  episodeNumber: number | null;
  /** ISO date, or null if the source page doesn't state it. */
  airDate: string | null;
  /** Original, concise PREMISE summary (not copied from the source). Must not reveal outcomes. */
  summary: string;
  /** Featured characters/trainers named on the source page. */
  characters: string[];
  pokemon: PokemonInEpisode[];
  /** The most severe `outcome` level among `pokemon` ("none" if there are no outcomes). */
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
  outcome?: SpoilerOutcome;
}
