import type { AnimeEpisodeAppearance } from "./types";

/**
 * Curated, human-verified episode appearances.
 *
 * Intentionally EMPTY for now. Nothing here is invented: add a record only
 * after checking it against its `source`. Later this file can be swapped for a
 * JSON file, a database, or a retrieval index without changing callers,
 * because everything goes through `getAnimeAppearances`.
 */
const CURATED_EPISODES: AnimeEpisodeAppearance[] = [];

export async function getAnimeAppearances(
  pokemonSlug: string,
): Promise<AnimeEpisodeAppearance[]> {
  return CURATED_EPISODES.filter((e) => e.pokemon === pokemonSlug);
}
