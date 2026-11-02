"use client";

import { useState } from "react";
import { AnimeTimeline } from "@/components/AnimeTimeline";
import { isWithinSpoilerLevel } from "@/lib/anime/queries";
import type { AnimeEpisodeAppearance, SpoilerLevel } from "@/lib/anime/types";

const LEVELS: { value: SpoilerLevel; label: string; hint: string }[] = [
  { value: "none", label: "No spoilers", hint: "Only spoiler-free episodes are explained." },
  { value: "mild", label: "Mild spoilers", hint: "Small plot points may be revealed." },
  { value: "major", label: "Everything", hint: "Show all details." },
];

/** Story timeline with a spoiler setting. Hidden episodes keep their title and source link. */
export function StoryExplorer({ episodes }: { episodes: AnimeEpisodeAppearance[] }) {
  const [allowed, setAllowed] = useState<SpoilerLevel>("mild");
  const concealed = new Set(
    episodes.filter((e) => !isWithinSpoilerLevel(e.spoilerLevel, allowed)).map((e) => e.id),
  );

  return (
    <div>
      <fieldset className="mb-8">
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
          {concealed.size > 0 && ` ${concealed.size} episode${concealed.size === 1 ? " is" : "s are"} hidden.`}
        </p>
      </fieldset>
      <AnimeTimeline episodes={episodes} concealedIds={concealed} />
    </div>
  );
}
