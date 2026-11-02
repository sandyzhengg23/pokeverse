"use client";

import { useState } from "react";
import { AnimeFeatured } from "@/components/AnimeFeatured";
import { NUMBERING_NOTE } from "@/components/AnimeEpisodeCard";
import { AnimeTimeline } from "@/components/AnimeTimeline";
import type { AnimeEpisodeAppearance, SpoilerLevel } from "@/lib/anime/types";

const LEVELS: { value: SpoilerLevel; label: string; hint: string }[] = [
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
        <fieldset>
          <legend className="eyebrow mb-2">Spoiler setting</legend>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => (
              <label
                key={level.value}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${
                  allowed === level.value
                    ? "border-theme-ink bg-theme-ink text-white"
                    : "border-theme-ink/15 bg-white/80"
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
                {level.label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-ink-muted" aria-live="polite">
            {LEVELS.find((l) => l.value === allowed)?.hint}
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
