"use client";

import { useState } from "react";
import { AnimeFeatured } from "@/components/AnimeFeatured";
import { NUMBERING_NOTE } from "@/components/AnimeEpisodeCard";
import { AnimeTimeline } from "@/components/AnimeTimeline";
import type { AnimeEpisodeAppearance, SpoilerLevel } from "@/lib/anime/types";

export const SPOILER_LEVELS: { value: SpoilerLevel; label: string; hint: string }[] = [
  { value: "none", label: "No spoilers", hint: "Premises only. How storylines turn out is hidden." },
  { value: "mild", label: "Mild spoilers", hint: "Premises plus small plot points. Major outcomes stay hidden." },
  { value: "major", label: "Everything", hint: "Every verified detail, including major outcomes." },
];

interface StoryExplorerProps {
  pokemonId: number;
  pokemonSlug: string;
  displayName: string;
  /** Featured episodes ("Start here"). */
  featured: AnimeEpisodeAppearance[];
  /** Every episode, in story order. */
  episodes: AnimeEpisodeAppearance[];
}

/**
 * Owns the spoiler setting and passes the SAME value to "Start here" and the
 * full timeline, so the two can never disagree.
 */
export function StoryExplorer({ pokemonId, pokemonSlug, displayName, featured, episodes }: StoryExplorerProps) {
  const [allowed, setAllowed] = useState<SpoilerLevel>("none");
  const hiddenCount = episodes.filter((e) => e.outcome && !isShown(e.outcome.level, allowed)).length;

  return (
    <>
      <section className="surface p-6 sm:p-8">
        <fieldset aria-describedby="spoiler-status">
          <legend className="eyebrow mb-2">Spoiler setting</legend>
          <div className="flex flex-wrap gap-2">
            {SPOILER_LEVELS.map((level) => (
              <label
                key={level.value}
                className={`chip inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition ${
                  allowed === level.value
                    ? "border-theme-ink bg-theme-ink text-white"
                    : "border-theme-ink/40 bg-white/80"
                }`}
              >
                <input
                  type="radio"
                  name="spoiler-level"
                  value={level.value}
                  checked={allowed === level.value}
                  onChange={() => setAllowed(level.value)}
                  className="sr-only"
                />
                {allowed === level.value && <span aria-hidden>✓</span>}
                {level.label}
              </label>
            ))}
          </div>
          <p id="spoiler-status" className="mt-2 text-sm text-ink-muted" aria-live="polite">
            <span className="font-bold text-theme-ink">
              Current setting: {SPOILER_LEVELS.find((l) => l.value === allowed)?.label}.
            </span>{" "}
            {SPOILER_LEVELS.find((l) => l.value === allowed)?.hint}
            {hiddenCount > 0 && ` ${hiddenCount} spoiler${hiddenCount === 1 ? " is" : "s are"} hidden.`}
          </p>
        </fieldset>
      </section>

      <section className="surface p-6 sm:p-8">
        <h2 className="text-2xl font-black">Start here</h2>
        <p className="mb-5 mt-1 text-sm text-ink-muted">
          The episodes that matter most for {displayName}, from PokéVerse’s curated dataset.
        </p>
        <AnimeFeatured
          pokemonId={pokemonId}
          pokemonSlug={pokemonSlug}
          displayName={displayName}
          episodes={featured}
          allowed={allowed}
          showLink={false}
        />
      </section>

      <section className="surface p-6 sm:p-8">
        <h2 className="text-2xl font-black">Full story timeline</h2>
        <p className="mb-6 mt-1 text-sm text-ink-muted">
          {episodes.length} verified episode{episodes.length === 1 ? "" : "s"} in broadcast order. Every card
          links to its source. {NUMBERING_NOTE}
        </p>
        <AnimeTimeline episodes={episodes} allowed={allowed} />
      </section>
    </>
  );
}

const RANK = { none: 0, mild: 1, major: 2 } as const;
function isShown(level: SpoilerLevel, allowed: SpoilerLevel) {
  return RANK[level] <= RANK[allowed];
}
