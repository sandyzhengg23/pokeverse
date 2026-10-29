import { cacheLife } from "next/cache";
import { isPokemonType, type PokemonTypeName } from "@/lib/theme/type-themes";
import { officialArtworkUrl, pokeApiFetch } from "./client";
import {
  formatName,
  idFromUrl,
  MAX_BASE_POKEMON_ID,
} from "./format";
import type {
  EvolutionMember,
  EvolutionStage,
  Pokemon,
  PokemonIndexEntry,
  PokemonSpecies,
  RawChainLink,
  RawEvolutionChain,
  RawEvolutionDetail,
  RawPokemon,
  RawPokemonList,
  RawSpecies,
} from "./types";

/*
 * Data access for PokéAPI. Each exported async function is cached with
 * `'use cache'` (PokéAPI data barely changes), so repeated visits and the
 * 12-card search grid don't hammer the public API.
 *
 * Error contract:
 *   - "doesn't exist"  → resolves to null
 *   - "API unreachable" → throws PokeApiError (callers show an error state)
 */

/* ------------------------------ mapping ---------------------------------- */

function mapPokemon(raw: RawPokemon): Pokemon {
  const types = raw.types
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name)
    .filter((name): name is PokemonTypeName => isPokemonType(name));

  return {
    id: raw.id,
    name: raw.name,
    displayName: formatName(raw.name),
    types: types.length > 0 ? types : ["normal"],
    artworkUrl:
      raw.sprites.other?.["official-artwork"]?.front_default ??
      raw.sprites.front_default ??
      null,
    heightM: raw.height / 10,
    weightKg: raw.weight / 10,
    abilities: raw.abilities.map((a) => ({
      name: formatName(a.ability.name),
      isHidden: a.is_hidden,
    })),
    stats: raw.stats.map((s) => ({
      name: s.stat.name === "hp" ? "HP" : formatName(s.stat.name),
      value: s.base_stat,
    })),
    speciesId: idFromUrl(raw.species.url),
  };
}

function cleanFlavorText(text: string): string {
  return text.replace(/[\n\f\r]+/g, " ").replace(/\s+/g, " ").trim();
}

function mapSpecies(raw: RawSpecies): PokemonSpecies {
  const english = raw.flavor_text_entries.filter((e) => e.language.name === "en");
  const genus = raw.genera.find((g) => g.language.name === "en")?.genus;

  return {
    id: raw.id,
    genus: genus ?? null,
    // Entries are ordered oldest → newest game version; use the most recent.
    description: english.length
      ? cleanFlavorText(english[english.length - 1].flavor_text)
      : null,
    color: raw.color?.name ?? null,
    habitat: raw.habitat ? formatName(raw.habitat.name) : null,
    generation: raw.generation.name.replace("generation-", "").toUpperCase(),
    isLegendary: raw.is_legendary,
    isMythical: raw.is_mythical,
    evolutionChainId: raw.evolution_chain ? idFromUrl(raw.evolution_chain.url) : null,
  };
}

function describeRequirement(details: RawEvolutionDetail[]): string | null {
  const d = details[0];
  if (!d) return null;

  const parts: string[] = [];
  if (d.min_level) parts.push(`Level ${d.min_level}`);
  if (d.item) parts.push(`Use ${formatName(d.item.name)}`);
  if (d.min_happiness) parts.push("High friendship");
  if (d.known_move) parts.push(`Knows ${formatName(d.known_move.name)}`);
  if (d.location) parts.push(`At ${formatName(d.location.name)}`);
  if (d.time_of_day) parts.push(formatName(d.time_of_day));
  if (parts.length === 0 && d.trigger) parts.push(formatName(d.trigger.name));
  return parts.length ? parts.join(" · ") : null;
}

/** Breadth-first flatten of the evolution tree into ordered stages. */
function mapEvolutionChain(root: RawChainLink): EvolutionStage[] {
  const stages: EvolutionStage[] = [];
  let level: RawChainLink[] = [root];

  while (level.length > 0) {
    stages.push({
      members: level.map((link): EvolutionMember => {
        const id = idFromUrl(link.species.url);
        return {
          id,
          name: link.species.name,
          displayName: formatName(link.species.name),
          artworkUrl: officialArtworkUrl(id),
          requirement: describeRequirement(link.evolution_details),
        };
      }),
    });
    level = level.flatMap((link) => link.evolves_to);
  }
  return stages;
}

/* ------------------------------- queries ---------------------------------- */

/** Fetch one Pokémon by name or numeric id. Returns null if it doesn't exist. */
export async function getPokemon(nameOrId: string): Promise<Pokemon | null> {
  "use cache";
  cacheLife("days");

  const key = encodeURIComponent(nameOrId.trim().toLowerCase());
  let raw = await pokeApiFetch<RawPokemon>(`/pokemon/${key}`);

  // Some species slugs differ from their default form ("deoxys" → "deoxys-normal").
  if (!raw) {
    const species = await pokeApiFetch<RawSpecies>(`/pokemon-species/${key}`);
    const defaultVariety = species?.varieties.find((v) => v.is_default);
    if (defaultVariety) {
      raw = await pokeApiFetch<RawPokemon>(`/pokemon/${defaultVariety.pokemon.name}`);
    }
  }
  return raw ? mapPokemon(raw) : null;
}

export async function getPokemonSpecies(speciesId: number): Promise<PokemonSpecies | null> {
  "use cache";
  cacheLife("days");

  const raw = await pokeApiFetch<RawSpecies>(`/pokemon-species/${speciesId}`);
  return raw ? mapSpecies(raw) : null;
}

export async function getEvolutionStages(chainId: number): Promise<EvolutionStage[] | null> {
  "use cache";
  cacheLife("days");

  const raw = await pokeApiFetch<RawEvolutionChain>(`/evolution-chain/${chainId}`);
  return raw ? mapEvolutionChain(raw.chain) : null;
}

/** Every Pokémon name + id (~1,300 entries). Used for name search; PokéAPI has no search endpoint. */
export async function getPokemonIndex(): Promise<PokemonIndexEntry[]> {
  "use cache";
  cacheLife("days");

  const raw = await pokeApiFetch<RawPokemonList>("/pokemon?limit=2000");
  if (!raw) return [];
  return raw.results.map((r) => ({ id: idFromUrl(r.url), name: r.name }));
}

/* ------------------------- pure helpers (not cached) ---------------------- */

/**
 * Filters the index by a user query. Matches names containing the query or an
 * exact Pokédex number ("pika", "025", "#25"). With no query, returns the
 * base Pokédex in order (alternate forms are only reachable by searching).
 */
export function searchPokemonIndex(
  index: PokemonIndexEntry[],
  query: string,
): PokemonIndexEntry[] {
  const q = query.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");

  if (!q) {
    return index.filter((e) => e.id < MAX_BASE_POKEMON_ID).sort((a, b) => a.id - b.id);
  }

  const rank = (e: PokemonIndexEntry): number => {
    if (/^\d+$/.test(q) && e.id === Number(q)) return 0;
    if (e.name === q) return 0;
    if (e.name.startsWith(q)) return 1;
    if (e.name.includes(q)) return 2;
    return -1;
  };

  return index
    .map((entry) => ({ entry, score: rank(entry) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => a.score - b.score || a.entry.id - b.entry.id)
    .map((r) => r.entry);
}

/**
 * Loads full Pokémon data for a list of names. One failed card must not blank
 * the whole grid, so failures are counted instead of thrown.
 */
export async function getPokemonCards(
  names: string[],
): Promise<{ pokemon: Pokemon[]; failed: number }> {
  const settled = await Promise.allSettled(names.map((name) => getPokemon(name)));
  const pokemon: Pokemon[] = [];
  let failed = 0;
  for (const result of settled) {
    if (result.status === "fulfilled" && result.value) pokemon.push(result.value);
    else failed += 1;
  }
  return { pokemon, failed };
}
