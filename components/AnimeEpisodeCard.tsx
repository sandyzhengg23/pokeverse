import type { AnimeEpisodeAppearance, Significance, SpoilerLevel } from "@/lib/anime/types";

interface AnimeEpisodeCardProps {
  episode: AnimeEpisodeAppearance;
  /** Hide the summary/why text (spoiler filter). Title and source stay visible. */
  concealed?: boolean;
  /** Smaller card for previews (profile page, scan results). */
  compact?: boolean;
}

const ROLE_LABEL = { main: "Starring", supporting: "Supporting", cameo: "Cameo" } as const;
const SPOILER_LABEL: Record<SpoilerLevel, string> = {
  none: "Spoiler-free",
  mild: "Mild spoilers",
  major: "Major spoilers",
};
export const SIGNIFICANCE_LABEL: Record<Significance, string> = {
  introduction: "Introduction",
  character_development: "Character moment",
  evolution: "Evolution",
  major_battle: "Major battle",
  notable_appearance: "Notable appearance",
};

export function AnimeEpisodeCard({ episode, concealed = false, compact = false }: AnimeEpisodeCardProps) {
  return (
    <article className="surface h-full p-5">
      <p className="eyebrow">
        {episode.series}
        {episode.episodeNumber !== null && ` · Episode ${episode.episodeNumber}`}
      </p>
      <h3 className="mt-1 text-lg font-extrabold">{episode.title}</h3>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-theme-soft px-3 py-1">{ROLE_LABEL[episode.role]}</span>
        <span className="rounded-full bg-theme-soft px-3 py-1">{SIGNIFICANCE_LABEL[episode.significance]}</span>
        <span className="rounded-full bg-white/80 px-3 py-1">{SPOILER_LABEL[episode.spoilerLevel]}</span>
      </div>

      {concealed ? (
        <p className="mt-3 text-ink-muted">
          Details hidden to avoid spoilers. Raise the spoiler setting to read them.
        </p>
      ) : (
        <>
          <p className="mt-3 font-bold">Why it matters</p>
          <p className="text-ink-muted">{episode.why}</p>
          {!compact && (
            <>
              <p className="mt-3 font-bold">What happens</p>
              <p className="text-ink-muted">{episode.summary}</p>
              {episode.characters.length > 0 && (
                <p className="mt-3 text-sm">
                  <span className="font-bold">Featuring:</span> {episode.characters.join(", ")}
                </p>
              )}
            </>
          )}
        </>
      )}

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
    </article>
  );
}
