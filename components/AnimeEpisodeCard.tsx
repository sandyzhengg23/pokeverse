import { isOutcomeVisible } from "@/lib/anime/queries";
import type { AnimeEpisodeAppearance, Significance, SpoilerLevel } from "@/lib/anime/types";

interface AnimeEpisodeCardProps {
  episode: AnimeEpisodeAppearance;
  /**
   * The viewer's spoiler setting. Required on purpose: every place that shows an
   * episode must decide it, so the setting can't be silently skipped. Premise
   * text is always shown; the `outcome` appears only if its level is allowed.
   */
  allowed: SpoilerLevel;
  /** Smaller card for previews (profile page, scan results). */
  compact?: boolean;
}

const ROLE_LABEL = { main: "Starring", supporting: "Supporting", cameo: "Cameo" } as const;
/** Describes the outcome text of this episode for this Pokémon. */
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

export const NUMBERING_NOTE =
  "Episode numbers are Serebii’s overall numbering across the whole anime, not season numbers.";

export function AnimeEpisodeCard({ episode, allowed, compact = false }: AnimeEpisodeCardProps) {
  const { outcome } = episode;
  const showOutcome = outcome !== undefined && isOutcomeVisible(outcome, allowed);
  const hiddenOutcome = outcome !== undefined && !showOutcome;

  return (
    <article className="surface h-full p-5">
      <p className="eyebrow">
        {episode.series}
        {episode.episodeNumber !== null && (
          <span> · Overall episode #{episode.episodeNumber} (Serebii)</span>
        )}
      </p>
      <h3 className="mt-1 text-lg font-extrabold">{episode.title}</h3>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-theme-soft px-3 py-1">{ROLE_LABEL[episode.role]}</span>
        <span className="rounded-full bg-theme-soft px-3 py-1">{SIGNIFICANCE_LABEL[episode.significance]}</span>
        <span className="rounded-full bg-white/80 px-3 py-1">
          {hiddenOutcome ? (
            <>
              <span aria-hidden>🔒 </span>
              {outcome.level === "major" ? "Major" : "Mild"} spoiler hidden
            </>
          ) : (
            SPOILER_LABEL[outcome?.level ?? "none"]
          )}
        </span>
      </div>

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

      {showOutcome && (
        <div className="mt-3 rounded-2xl bg-theme-soft p-3">
          <p className="text-sm font-bold">Spoiler</p>
          <p className="text-sm">{outcome.text}</p>
        </div>
      )}
      {hiddenOutcome && (
        <p className="mt-3 text-sm text-ink-muted">
          <span aria-hidden>🔒 </span>What happens to this Pokémon in this episode is hidden by your spoiler setting.
        </p>
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
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </article>
  );
}
