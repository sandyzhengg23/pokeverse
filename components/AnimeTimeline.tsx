import { AnimeEpisodeCard } from "@/components/AnimeEpisodeCard";
import { StoryTimeline } from "@/components/StoryTimeline";
import type { AnimeEpisodeAppearance } from "@/lib/anime/types";

/** A Pokémon's anime story in watching order. `concealedIds` hides spoiler details. */
export function AnimeTimeline({
  episodes,
  concealedIds = new Set<string>(),
}: {
  episodes: AnimeEpisodeAppearance[];
  concealedIds?: ReadonlySet<string>;
}) {
  return (
    <StoryTimeline
      items={episodes.map((episode, i) => ({
        id: episode.id,
        label: `Chapter ${i + 1} · ${episode.series}`,
        content: <AnimeEpisodeCard episode={episode} concealed={concealedIds.has(episode.id)} />,
      }))}
    />
  );
}
