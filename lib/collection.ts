/**
 * Device-only Pokémon collection, stored in the browser's localStorage.
 *
 * Privacy/trust model:
 *  - Only a VERIFIED species id and its display name are stored. Unverified
 *    AI-read card text (card name, number, set) is never saved.
 *  - Everything read back from storage is re-validated, because localStorage
 *    can be edited or corrupted. Artwork and types are always re-fetched from PokéAPI.
 *  - No account, database or sync: the data lives only in this browser profile.
 */
import { useSyncExternalStore } from "react";
import { MAX_BASE_POKEMON_ID } from "@/lib/pokeapi/format";

export const COLLECTION_KEY = "pokeverse:collection:v1";
export const MAX_COLLECTION_SIZE = 200;

export interface CollectionEntry {
  /** National Dex species id (same as PokéAPI). */
  speciesId: number;
  /** Display name, e.g. "Pikachu". */
  name: string;
}

export type CollectionState =
  | { status: "loading"; entries: [] } // server render / before hydration
  | { status: "ready"; entries: CollectionEntry[] }
  | { status: "unavailable"; entries: [] }; // storage blocked (private mode, policy, quota)

export type SaveResult = "saved" | "exists" | "full" | "error";

const LOADING: CollectionState = { status: "loading", entries: [] };
const UNAVAILABLE_RAW = "__unavailable__";

function isValidEntry(value: unknown): value is CollectionEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.speciesId === "number" &&
    Number.isInteger(v.speciesId) &&
    v.speciesId >= 1 &&
    v.speciesId < MAX_BASE_POKEMON_ID &&
    typeof v.name === "string" &&
    v.name.trim().length > 0 &&
    v.name.length <= 60
  );
}

/** Parses stored JSON defensively; anything malformed is dropped rather than thrown. */
export function parseCollection(raw: string | null): CollectionEntry[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const seen = new Set<number>();
  const entries: CollectionEntry[] = [];
  for (const item of data) {
    if (!isValidEntry(item) || seen.has(item.speciesId)) continue;
    seen.add(item.speciesId);
    entries.push({ speciesId: item.speciesId, name: item.name.trim() });
    if (entries.length >= MAX_COLLECTION_SIZE) break;
  }
  return entries;
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(COLLECTION_KEY);
  } catch {
    return UNAVAILABLE_RAW;
  }
}

// useSyncExternalStore needs a referentially stable snapshot: only re-parse when the raw string changes.
let lastRaw: string | null | undefined;
let lastState: CollectionState = LOADING;

function getSnapshot(): CollectionState {
  const raw = readRaw();
  if (raw === lastRaw) return lastState;
  lastRaw = raw;
  lastState =
    raw === UNAVAILABLE_RAW
      ? { status: "unavailable", entries: [] }
      : { status: "ready", entries: parseCollection(raw) };
  return lastState;
}

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Other tabs changing the collection fire `storage` events.
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === COLLECTION_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Live view of the collection; re-renders on changes in this or any other tab. */
export function useCollection(): CollectionState {
  return useSyncExternalStore(subscribe, getSnapshot, () => LOADING);
}

function write(entries: CollectionEntry[]): boolean {
  try {
    window.localStorage.setItem(COLLECTION_KEY, JSON.stringify(entries));
  } catch {
    return false; // blocked or quota exceeded
  }
  listeners.forEach((l) => l());
  return true;
}

/** Adds a verified Pokémon. Duplicates (same species) are ignored. */
export function saveToCollection(entry: CollectionEntry): SaveResult {
  if (!isValidEntry(entry)) return "error";
  const raw = readRaw();
  if (raw === UNAVAILABLE_RAW) return "error";
  const current = parseCollection(raw);
  if (current.some((e) => e.speciesId === entry.speciesId)) return "exists";
  if (current.length >= MAX_COLLECTION_SIZE) return "full";
  return write([...current, { speciesId: entry.speciesId, name: entry.name.trim() }]) ? "saved" : "error";
}

export function removeFromCollection(speciesId: number): boolean {
  const raw = readRaw();
  if (raw === UNAVAILABLE_RAW) return false;
  return write(parseCollection(raw).filter((e) => e.speciesId !== speciesId));
}
