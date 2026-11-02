"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AnimeEpisodeCard, NUMBERING_NOTE } from "@/components/AnimeEpisodeCard";
import { PokemonArtwork } from "@/components/PokemonArtwork";
import { SPOILER_LEVELS } from "@/components/StoryExplorer";
import { StateMessage } from "@/components/StateMessage";
import { StoryTimeline } from "@/components/StoryTimeline";
import { TypeTheme } from "@/components/TypeTheme";
import {
  JOURNEY_BUDGETS,
  JOURNEY_INTERESTS,
  type JourneyBudget,
  type JourneyInterest,
  type JourneyPlan,
} from "@/lib/ai/contracts";
import type { SpoilerLevel } from "@/lib/anime/types";
import { typeThemeVars } from "@/lib/theme/type-themes";

export interface JourneyPokemon {
  id: number;
  slug: string;
  name: string;
  types: string[];
  artworkUrl: string | null;
}

const MAX_SELECTED = 5;
const BUDGET_LABEL: Record<JourneyBudget, string> = { 30: "30 minutes", 60: "1 hour", 120: "2 hours" };
const BUDGET_HINT: Record<JourneyBudget, string> = { 30: "about 1 episode", 60: "about 2 episodes", 120: "about 4 episodes" };
const INTEREST_LABEL: Record<JourneyInterest, string> = {
  character_development: "Character development",
  battles: "Battles",
  friendships: "Friendships",
  evolutions: "Evolutions",
  introductions: "Introductions",
};

type Phase = "idle" | "loading" | "done" | "error";

export function JourneyBuilder({ pokemon, initialSelected }: { pokemon: JourneyPokemon[]; initialSelected: number[] }) {
  const [selected, setSelected] = useState<number[]>(initialSelected);
  const [budget, setBudget] = useState<JourneyBudget>(60);
  const [spoiler, setSpoiler] = useState<SpoilerLevel>("none");
  const [interests, setInterests] = useState<JourneyInterest[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<JourneyPlan | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (phase === "done" || phase === "error") {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }, [phase]);

  const first = pokemon.find((p) => p.id === selected[0]);
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  async function generate() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pokemonIds: selected, budgetMinutes: budget, maxSpoilerLevel: spoiler, interests }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong while planning your journey.");
        setPhase("error");
        return;
      }
      setPlan(data as JourneyPlan);
      setPhase("done");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Couldn’t reach the journey planner. Check your connection and try again.");
      setPhase("error");
    }
  }

  const loading = phase === "loading";
  const atMax = selected.length >= MAX_SELECTED;

  // One persistent live region announces loading and success. (A region that is
  // inserted together with its text is often not announced, so this one is always mounted.)
  const announcement =
    phase === "loading"
      ? "Muse Spark is planning your journey. This can take up to a minute."
      : phase === "done" && plan
        ? `Your journey is ready: ${plan.title}. ${plan.steps.length} episode${plan.steps.length === 1 ? "" : "s"}, listed below.`
        : ""; // Errors are announced by the role="alert" panel, so they are not repeated here.

  return (
    <section className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
      {first && first.types[0] && <TypeTheme type={first.types[0]} />}
      <div className="text-center">
        <span aria-hidden className="text-5xl">🎬</span>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Build your story journey</h1>
        <p className="mt-2 text-lg text-ink-muted">
          Pick your Pokémon and Muse Spark plans a viewing path through our verified anime episodes.
        </p>
      </div>

      <div className="surface mt-8 space-y-8 p-6 sm:p-8">
        <fieldset>
          <legend className="text-xl font-black">1. Choose your Pokémon</legend>
          <p className="mb-4 mt-1 text-sm text-ink-muted">
            Pokémon with verified anime episodes.{" "}
            <span role="status" className="whitespace-nowrap font-bold">
              {selected.length} selected · Maximum {MAX_SELECTED}
              {atMax && <span className="sr-only">. Maximum reached; deselect one to choose another.</span>}
            </span>
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pokemon.map((p) => {
              const isSelected = selected.includes(p.id);
              const full = !isSelected && selected.length >= MAX_SELECTED;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-disabled={full || undefined}
                    disabled={loading}
                    onClick={() => {
                      if (!full) setSelected((s) => toggle(s, p.id));
                    }}
                    style={typeThemeVars(p.types[0])}
                    className={`relative flex min-h-11 w-full flex-col items-center rounded-3xl border-2 p-3 text-theme-ink transition duration-200 disabled:cursor-not-allowed aria-disabled:cursor-not-allowed ${
                      isSelected
                        ? "-translate-y-1 border-solid border-theme-ink bg-theme-soft shadow-lift ring-4 ring-theme-accent"
                        : "border-dashed border-theme-ink/70 bg-white/60 hover:-translate-y-0.5 hover:bg-white/90 disabled:opacity-60 aria-disabled:opacity-60"
                    }`}
                  >
                    {/* State is exposed by aria-pressed; this badge is the visual (non-color) cue only. */}
                    <span
                      aria-hidden
                      className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-extrabold ${
                        isSelected ? "bg-theme-ink text-white" : "bg-white/80 text-ink-muted"
                      }`}
                    >
                      {isSelected ? "✓ Selected" : "+ Add"}
                    </span>
                    <span className="relative mt-4 block aspect-square w-20 sm:w-24">
                      <PokemonArtwork src={p.artworkUrl} alt="" sizes="96px" />
                    </span>
                    <span className="mt-1 font-extrabold">{p.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <ChipGroup legend="2. Viewing time" hint="Estimated at about 25 minutes per episode. Real runtimes aren’t verified.">
          {JOURNEY_BUDGETS.map((b) => (
            <Chip key={b} type="radio" name="budget" checked={budget === b} disabled={loading} onChange={() => setBudget(b)}>
              {BUDGET_LABEL[b]} <span className="font-medium">({BUDGET_HINT[b]})</span>
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup
          legend="3. Spoiler preference"
          live
          hint={`Current setting: ${SPOILER_LEVELS.find((l) => l.value === spoiler)?.label}. ${SPOILER_LEVELS.find((l) => l.value === spoiler)?.hint}`}
        >
          {SPOILER_LEVELS.map((l) => (
            <Chip key={l.value} type="radio" name="spoiler" checked={spoiler === l.value} disabled={loading} onChange={() => setSpoiler(l.value)}>
              {l.label}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup legend="4. Interests (optional)" hint="Pick any that you enjoy most.">
          {JOURNEY_INTERESTS.map((i) => (
            <Chip key={i} type="checkbox" name="interest" checked={interests.includes(i)} disabled={loading} onChange={() => setInterests((s) => toggle(s, i))}>
              {INTEREST_LABEL[i]}
            </Chip>
          ))}
        </ChipGroup>

        <div className="text-center">
          {/* aria-disabled keeps keyboard focus on the button while planning runs. */}
          <button
            type="button"
            className="btn-primary !px-8"
            aria-disabled={selected.length === 0 || loading}
            aria-describedby={selected.length === 0 ? "generate-hint" : undefined}
            onClick={() => {
              if (selected.length > 0 && !loading) void generate();
            }}
          >
            {loading ? "Planning…" : <><span aria-hidden>✨</span> Generate My Journey</>}
          </button>
          {selected.length === 0 && (
            <p id="generate-hint" className="mt-2 text-sm text-ink-muted">
              Select at least one Pokémon to begin.
            </p>
          )}
        </div>
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>

      <div ref={resultRef} className="mt-10 scroll-mt-24" aria-busy={loading}>
        {loading && (
          <div className="surface flex flex-col items-center gap-4 px-6 py-12 text-center">
            <span aria-hidden className="size-10 animate-spin rounded-full border-4 border-theme-accent border-t-theme-ink" />
            <p className="font-bold">Muse Spark is planning your journey…</p>
            <p className="text-sm text-ink-muted">Choosing episodes from our verified collection. This can take up to a minute.</p>
          </div>
        )}
        {phase === "error" && error && (
          <StateMessage
            tone="error"
            title="We couldn’t build your journey"
            actions={<button type="button" className="btn-primary" onClick={() => void generate()}>Try again</button>}
          >
            {error}
          </StateMessage>
        )}
        {phase === "done" && plan && <JourneyResult plan={plan} pokemon={pokemon} />}
      </div>
    </section>
  );
}

function ChipGroup({
  legend,
  hint,
  live,
  children,
}: {
  legend: string;
  hint?: string;
  /** Announce hint changes (used for the spoiler preference). */
  live?: boolean;
  children: React.ReactNode;
}) {
  const hintId = useId();
  return (
    <fieldset aria-describedby={hint ? hintId : undefined}>
      <legend className="text-xl font-black">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
      {hint && (
        <p id={hintId} aria-live={live ? "polite" : undefined} className="mt-2 text-sm text-ink-muted">
          {hint}
        </p>
      )}
    </fieldset>
  );
}

function Chip({
  type,
  name,
  checked,
  disabled,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`chip inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 ${
        checked ? "border-theme-ink bg-theme-ink text-white" : "border-theme-ink/40 bg-white/80 hover:bg-white"
      }`}
    >
      <input type={type} name={name} checked={checked} disabled={disabled} onChange={onChange} className="sr-only" />
      {checked && <span aria-hidden>✓</span>}
      <span>{children}</span>
    </label>
  );
}

function JourneyResult({ plan, pokemon }: { plan: JourneyPlan; pokemon: JourneyPokemon[] }) {
  const name = (id: number) => pokemon.find((p) => p.id === id)?.name ?? `#${id}`;
  const spoilerLabel = SPOILER_LEVELS.find((l) => l.value === plan.request.maxSpoilerLevel)?.label;
  // Redacted outcomes arrive with empty text; they are hidden by the spoiler preference used for this plan.
  const hiddenSpoilers = plan.steps.filter((s) => s.episode.outcome && s.episode.outcome.text === "").length;

  return (
    <div className="space-y-6">
      <header className="surface p-6 text-center sm:p-8">
        <p className="eyebrow">Your journey</p>
        <h2 className="mt-1 text-3xl font-black sm:text-4xl">{plan.title}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg">{plan.introduction}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold">
          <span className="rounded-full bg-theme-soft px-3 py-1">
            {plan.steps.length} episode{plan.steps.length === 1 ? "" : "s"}
          </span>
          <span className="rounded-full bg-theme-soft px-3 py-1">≈ {plan.estimate.totalMinutes} min (estimated)</span>
          <span className="rounded-full bg-theme-soft px-3 py-1">{spoilerLabel}</span>
          <span className="rounded-full bg-white/80 px-3 py-1">Planned by Muse Spark</span>
        </div>
        <p className="mt-3 text-xs text-ink-muted">{plan.estimate.note}</p>
        <p className="mt-1 text-xs text-ink-muted">{NUMBERING_NOTE}</p>
      </header>

      {plan.notices.length > 0 && (
        <ul aria-label="Notices" className="space-y-2 rounded-3xl bg-butter/70 p-5 text-sm font-medium text-[#5e4a00]">
          {plan.notices.map((n) => (
            <li key={n}><span aria-hidden>ℹ️ </span>{n}</li>
          ))}
        </ul>
      )}

      {plan.connections.length > 0 && (
        <section className="surface p-6">
          <h3 className="text-xl font-black">Verified connections</h3>
          <p className="mb-2 text-sm text-ink-muted">Only relationships our dataset explicitly supports.</p>
          <ul className="list-inside list-disc space-y-1">
            {plan.connections.map((c) => (
              <li key={c.pokemonIds.join("-")}>{c.text}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="surface p-6 sm:p-8">
        {hiddenSpoilers > 0 && (
          <p className="mb-6 rounded-2xl bg-theme-soft p-3 text-sm">
            <span aria-hidden>🔒 </span>{hiddenSpoilers} episode{hiddenSpoilers === 1 ? " has" : "s have"} a hidden spoiler. To reveal
            {hiddenSpoilers === 1 ? " it" : " them"}, pick a higher spoiler preference above and generate again.
          </p>
        )}
        <StoryTimeline
          items={plan.steps.map((step) => ({
            id: step.episode.id,
            label: `Step ${step.order} · ≈ ${step.estimatedMinutes} min (estimated)`,
            content: (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {step.featuredPokemonIds.map((id) => (
                    <Link
                      key={id}
                      href={`/pokemon/${pokemon.find((p) => p.id === id)?.slug ?? id}`}
                      className="inline-flex min-h-11 items-center rounded-full bg-theme-soft px-4 py-1 text-xs font-extrabold underline-offset-4 hover:underline"
                    >
                      {name(id)}
                    </Link>
                  ))}
                </div>
                <div className="rounded-2xl border border-theme-ink/10 bg-white/70 p-4">
                  <p className="text-sm font-extrabold">
                    Why this episode{" "}
                    <span className="ml-1 rounded-full bg-theme-soft px-2 py-0.5 text-xs font-bold">
                      {step.reasonSource === "ai" ? <><span aria-hidden>✨ </span>AI-written</> : "From our verified dataset"}
                    </span>
                  </p>
                  <p className="mt-1">{step.reason}</p>
                  {step.linkToPrevious && (
                    <p className="mt-2 text-sm text-ink-muted">
                      <span aria-hidden>🔗 </span>
                      <span className="sr-only">Connection to the previous episode: </span>
                      {step.linkToPrevious}
                    </p>
                  )}
                </div>
                <AnimeEpisodeCard episode={step.episode} allowed={plan.request.maxSpoilerLevel} />
              </div>
            ),
          }))}
        />
      </div>
    </div>
  );
}
