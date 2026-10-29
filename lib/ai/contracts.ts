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

export interface JourneyRequest {
  /** PokéAPI slugs from the user's collection. */
  collection: string[];
  interests?: string[];
  maxSpoilerLevel: SpoilerLevel;
}

export interface JourneyStep {
  title: string;
  /** Explanation grounded ONLY in the cited episodes and PokéAPI facts. */
  rationale: string;
  episodes: AnimeEpisodeAppearance[];
}

export interface JourneyPlanner {
  plan(request: JourneyRequest): Promise<JourneyStep[]>;
}
