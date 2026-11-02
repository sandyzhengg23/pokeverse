"use server";

import { PokeApiError } from "@/lib/pokeapi/client";
import { getPokemonCards, getPokemonIndex, searchPokemonIndex } from "@/lib/pokeapi/pokemon";
import type { Pokemon } from "@/lib/pokeapi/types";

export type PokemonSearchResult = { pokemon: Pokemon[] } | { error: string };

/** Lets the user fix a wrong scan by searching PokéAPI by name or Pokédex number. */
export async function searchPokemonForCorrection(query: string): Promise<PokemonSearchResult> {
  if (typeof query !== "string" || query.trim().length === 0 || query.length > 40) {
    return { pokemon: [] };
  }
  try {
    const matches = searchPokemonIndex(await getPokemonIndex(), query).slice(0, 6);
    const { pokemon } = await getPokemonCards(matches.map((m) => m.name));
    return { pokemon };
  } catch (err) {
    if (err instanceof PokeApiError) return { error: "Couldn't reach PokéAPI. Please try again." };
    throw err;
  }
}
