"use server";

import { MAX_BASE_POKEMON_ID } from "@/lib/pokeapi/format";
import { getPokemon } from "@/lib/pokeapi/pokemon";
import type { Pokemon } from "@/lib/pokeapi/types";

const MAX_IDS = 200;

/**
 * Loads PokéAPI data (artwork, types) for the species ids saved in the browser.
 * The ids come from localStorage, which the user can edit, so they are
 * validated, de-duplicated and capped here. Read-only; nothing is stored server-side.
 */
export async function getCollectionPokemon(
  speciesIds: number[],
): Promise<{ pokemon: Pokemon[]; failedIds: number[] }> {
  if (!Array.isArray(speciesIds)) return { pokemon: [], failedIds: [] };
  const ids = [
    ...new Set(speciesIds.filter((id) => Number.isInteger(id) && id >= 1 && id < MAX_BASE_POKEMON_ID)),
  ].slice(0, MAX_IDS);

  const settled = await Promise.allSettled(ids.map((id) => getPokemon(String(id))));
  const pokemon: Pokemon[] = [];
  const failedIds: number[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value) pokemon.push(result.value);
    else failedIds.push(ids[i]);
  });
  return { pokemon, failedIds };
}
