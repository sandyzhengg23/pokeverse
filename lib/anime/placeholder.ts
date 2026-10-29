import type { AnimeEpisodeAppearance } from "./types";

/**
 * PLACEHOLDER — NOT REAL DATA.
 *
 * Only used to preview the <AnimeEpisodeCard> layout when the curated dataset
 * has no entry for a Pokémon. The UI labels it clearly as a layout preview.
 * Never import this from `episodes.ts` or mix it with curated records.
 */
export const PLACEHOLDER_EPISODE: AnimeEpisodeAppearance = {
  id: "placeholder",
  pokemon: "placeholder",
  series: "Series name",
  episodeNumber: 0,
  title: "Episode title goes here",
  role: "main",
  summary: "A short, spoiler-aware summary will appear here once verified data is added.",
  spoilerLevel: "none",
  source: { name: "Source", url: "#" },
};
