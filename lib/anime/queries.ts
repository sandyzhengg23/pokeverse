import { ANIME_EPISODES } from "@/data/anime/episodes";
import type {
  AnimeEpisode,
  AnimeEpisodeAppearance,
  AppearanceRole,
  Significance,
  SpoilerLevel,
} from "./types";

/*
 * Read API over the curated dataset. Pure and synchronous (the data is a
 * static module), so it can be used from Server and Client Components alike.
 * If the data later moves to a database, make these async; callers stay the same.
 *
 * `pokemonId` is always the National Dex SPECIES id (PokéAPI `speciesId`).
 */

const ROLE_SCORE: Record<AppearanceRole, number> = { main: 3, supporting: 2, cameo: 0 };
const SIGNIFICANCE_SCORE: Record<Significance, number> = {
  introduction: 3,
  evolution: 3,
  character_development: 2,
  major_battle: 2,
  notable_appearance: 0,
};
const SPOILER_RANK: Record<SpoilerLevel, number> = { none: 0, mild: 1, major: 2 };

/** True if an episode at `level` may be shown to someone who allows up to `allowed`. */
export function isWithinSpoilerLevel(level: SpoilerLevel, allowed: SpoilerLevel): boolean {
  return SPOILER_RANK[level] <= SPOILER_RANK[allowed];
}

function byBroadcastOrder(a: AnimeEpisode, b: AnimeEpisode): number {
  return (a.episodeNumber ?? Infinity) - (b.episodeNumber ?? Infinity);
}

/** Every curated episode a Pokémon appears in, in story order. */
export function getAnimeAppearances(pokemonId: number): AnimeEpisodeAppearance[] {
  return ANIME_EPISODES.flatMap((episode) => {
    const entry = episode.pokemon.find((p) => p.pokemonId === pokemonId);
    return entry ? [{ ...episode, ...entry }] : [];
  }).sort(byBroadcastOrder);
}

/**
 * The most worthwhile episodes to show first: starring roles, introductions
 * and character moments rank above cameos; spoiler-free episodes win ties.
 */
export function getFeaturedEpisodes(pokemonId: number, limit = 3): AnimeEpisodeAppearance[] {
  const score = (e: AnimeEpisodeAppearance) =>
    ROLE_SCORE[e.role] + SIGNIFICANCE_SCORE[e.significance] + (e.spoilerLevel === "none" ? 1 : 0);
  return getAnimeAppearances(pokemonId)
    .sort((a, b) => score(b) - score(a) || byBroadcastOrder(a, b))
    .slice(0, limit);
}

export interface RelatedPokemon {
  pokemonId: number;
  /** Episodes in which both Pokémon appear. */
  sharedEpisodes: AnimeEpisodeAppearance[];
}

/** Other Pokémon that share curated episodes with this one, most shared first. */
export function getRelatedPokemon(pokemonId: number): RelatedPokemon[] {
  const related = new Map<number, AnimeEpisodeAppearance[]>();
  for (const episode of getAnimeAppearances(pokemonId)) {
    for (const other of episode.pokemon) {
      if (other.pokemonId === pokemonId) continue;
      related.set(other.pokemonId, [...(related.get(other.pokemonId) ?? []), episode]);
    }
  }
  return [...related]
    .map(([id, sharedEpisodes]) => ({ pokemonId: id, sharedEpisodes }))
    .sort((a, b) => b.sharedEpisodes.length - a.sharedEpisodes.length || a.pokemonId - b.pokemonId);
}

export function hasAnimeAppearances(pokemonId: number): boolean {
  return ANIME_EPISODES.some((e) => e.pokemon.some((p) => p.pokemonId === pokemonId));
}
