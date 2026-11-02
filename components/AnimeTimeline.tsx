import { AnimeEpisodeCard } from "@/components/AnimeEpisodeCard";
import { StoryTimeline } from "@/components/StoryTimeline";
import type { AnimeEpisodeAppearance, SpoilerLevel } from "@/lib/anime/types";

/** A Pokémon's anime story in watching order, filtered by the viewer's spoiler setting. */
export function AnimeTimeline({
  episodes,
  allowed,
}: {
  episodes: AnimeEpisodeAppearance[];
  allowed: SpoilerLevel;
}) {
  return (
    <StoryTimeline
      items={episodes.map((episode, i) => ({
        id: episode.id,
        label: `Chapter ${i + 1} · ${episode.series}`,
        content: <AnimeEpisodeCard episode={episode} allowed={allowed} />,
      }))}
    />
  );
}
