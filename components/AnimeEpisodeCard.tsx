import type { AnimeEpisodeAppearance } from "@/lib/anime/types";

interface AnimeEpisodeCardProps {
  episode: AnimeEpisodeAppearance;
  /** True only for the layout-preview card. Shows an explicit "not real data" label. */
  placeholder?: boolean;
}

const ROLE_LABEL = { main: "Starring", supporting: "Supporting", cameo: "Cameo" } as const;
const SPOILER_LABEL = {
  none: "Spoiler-free",
  mild: "Mild spoilers",
  major: "Major spoilers",
} as const;

export function AnimeEpisodeCard({ episode, placeholder = false }: AnimeEpisodeCardProps) {
  return (
    <article
      className={`rounded-3xl p-5 ${
        placeholder
          ? "border-2 border-dashed border-theme-ink/30 bg-white/40"
          : "surface"
      }`}
    >
      {placeholder && (
        <p className="mb-3 inline-block rounded-full bg-butter px-3 py-1 text-xs font-extrabold text-[#5e4a00]">
          Layout preview · placeholder, not real data
        </p>
      )}
      <p className="eyebrow">
        {episode.series}
        {!placeholder && ` · Episode ${episode.episodeNumber}`}
      </p>
      <h3 className="mt-1 text-lg font-extrabold">{episode.title}</h3>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-theme-soft px-3 py-1">{ROLE_LABEL[episode.role]}</span>
        <span className="rounded-full bg-white/80 px-3 py-1">
          {SPOILER_LABEL[episode.spoilerLevel]}
        </span>
      </div>
      {episode.summary && <p className="mt-3 text-ink-muted">{episode.summary}</p>}
      {!placeholder && (
        <p className="mt-3 text-sm">
          Source:{" "}
          <a
            href={episode.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-4"
          >
            {episode.source.name}
          </a>
        </p>
      )}
    </article>
  );
}
