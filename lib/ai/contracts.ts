/**
 * Contracts for the future Meta model integration (types only, no behavior).
 *
 * Planned shape: each capability becomes a server-only module (and, where the
 * browser must call it, a Route Handler under `app/api/...`) that implements
 * one of these interfaces. Components only depend on these types, so swapping
 * or adding model providers never touches UI code.
 *
 * Security: the Meta API key must live in a server-only env var (no
 * NEXT_PUBLIC_ prefix) and only be read inside those server modules.
 *
 * Nothing here returns canned model output. Until an implementation exists,
 * the /scan and /journey pages say so honestly.
 */
import type { AnimeEpisodeAppearance, SpoilerLevel } from "@/lib/anime/types";

/* 1. Multimodal card identification (/scan) ------------------------------- */

export interface CardIdentificationRequest {
  /** One entry per uploaded card photo. */
  images: { mimeType: string; data: Uint8Array }[];
}

export interface CardIdentification {
  imageIndex: number;
  /** PokéAPI slug the model believes the card shows; MUST be verified against PokéAPI. */
  pokemonSlug: string | null;
  /** Free-form card details read by the model (set name, number, ...). */
  cardText: string[];
  confidence: number; // 0..1
}

export interface CardIdentifier {
  identify(request: CardIdentificationRequest): Promise<CardIdentification[]>;
}

/* 2. Spoiler-aware viewing journeys (/journey) ---------------------------- */

export const JOURNEY_BUDGETS = [30, 60, 120] as const;
export type JourneyBudget = (typeof JOURNEY_BUDGETS)[number];

export const JOURNEY_INTERESTS = [
  "character_development",
  "battles",
  "friendships",
  "evolutions",
  "introductions",
] as const;
export type JourneyInterest = (typeof JOURNEY_INTERESTS)[number];

export interface JourneyRequest {
  /** National Dex species ids that have curated anime episodes (verified species ids, never card text). */
  pokemonIds: number[];
  budgetMinutes: JourneyBudget;
  /** Plot outcomes above this level are never sent to the model or the browser. */
  maxSpoilerLevel: SpoilerLevel;
  interests: JourneyInterest[];
}

export interface JourneyStep {
  /** 1-based position in watching (broadcast) order. */
  order: number;
  /**
   * The episode as stored in our dataset, shown from the point of view of
   * `featuredPokemonIds[0]`. Outcomes above the spoiler setting are redacted
   * (empty text) before leaving the server. Every title, number and source
   * comes from here, never from model output.
   */
  episode: AnimeEpisodeAppearance;
  /** Selected Pokémon that appear in this episode (each episode is listed once). */
  featuredPokemonIds: number[];
  /** Why this episode was chosen. Spoiler-checked model text, or the dataset's own premise text. */
  reason: string;
  reasonSource: "ai" | "dataset";
  /** Locally derived (dataset-backed) link to the previous step, or null. */
  linkToPrevious: string | null;
  /** PLANNING ESTIMATE only; we have no verified runtimes. */
  estimatedMinutes: number;
}

/** A relationship between selected Pokémon that the dataset explicitly supports. */
export interface JourneyConnection {
  pokemonIds: [number, number];
  episodeIds: string[];
  text: string;
}

export interface JourneyPlan {
  title: string;
  introduction: string;
  /** False when the model's text failed validation and a deterministic fallback was used. */
  titleSource: "ai" | "dataset";
  introductionSource: "ai" | "dataset";
  request: JourneyRequest;
  steps: JourneyStep[];
  connections: JourneyConnection[];
  estimate: { minutesPerEpisode: number; totalMinutes: number; note: string };
  /** Plain-language notes: shorter journey, uncovered Pokémon, rejected model picks, fallbacks. */
  notices: string[];
  model: string;
}

export interface JourneyPlanner {
  plan(request: JourneyRequest): Promise<JourneyPlan>;
}
