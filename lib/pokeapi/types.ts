import type { PokemonTypeName } from "@/lib/theme/type-themes";

/* -------------------------------------------------------------------------- */
/* Raw PokéAPI v2 responses (only the fields we read)                         */
/* -------------------------------------------------------------------------- */

export interface NamedResource {
  name: string;
  url: string;
}

export interface RawPokemonList {
  count: number;
  results: NamedResource[];
}

export interface RawPokemon {
  id: number;
  name: string;
  height: number; // decimetres
  weight: number; // hectograms
  types: { slot: number; type: NamedResource }[];
  abilities: { ability: NamedResource; is_hidden: boolean }[];
  stats: { base_stat: number; stat: NamedResource }[];
  species: NamedResource;
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default: string | null };
    };
  };
}

export interface RawSpecies {
  id: number;
  name: string;
  is_legendary: boolean;
  is_mythical: boolean;
  color: NamedResource | null;
  habitat: NamedResource | null;
  generation: NamedResource;
  evolution_chain: { url: string } | null;
  varieties: { is_default: boolean; pokemon: NamedResource }[];
  genera: { genus: string; language: NamedResource }[];
  flavor_text_entries: {
    flavor_text: string;
    language: NamedResource;
    version: NamedResource;
  }[];
}

export interface RawEvolutionDetail {
  trigger: NamedResource | null;
  min_level: number | null;
  item: NamedResource | null;
  min_happiness: number | null;
  known_move: NamedResource | null;
  location: NamedResource | null;
  time_of_day: string;
}

export interface RawChainLink {
  species: NamedResource;
  evolution_details: RawEvolutionDetail[];
  evolves_to: RawChainLink[];
}

export interface RawEvolutionChain {
  id: number;
  chain: RawChainLink;
}

/* -------------------------------------------------------------------------- */
/* App-level domain types (what components consume)                           */
/* -------------------------------------------------------------------------- */

export interface PokemonStat {
  name: string;
  value: number;
}

export interface Pokemon {
  id: number;
  /** API slug, e.g. "mr-mime". Use for URLs. */
  name: string;
  /** Human-readable, e.g. "Mr Mime". */
  displayName: string;
  types: PokemonTypeName[];
  /** Official artwork URL, or null when PokéAPI has none. */
  artworkUrl: string | null;
  heightM: number;
  weightKg: number;
  abilities: { name: string; isHidden: boolean }[];
  stats: PokemonStat[];
  speciesId: number;
}

export interface PokemonSpecies {
  id: number;
  genus: string | null;
  description: string | null;
  color: string | null;
  habitat: string | null;
  generation: string | null;
  isLegendary: boolean;
  isMythical: boolean;
  evolutionChainId: number | null;
}

export interface EvolutionMember {
  id: number;
  name: string;
  displayName: string;
  artworkUrl: string;
  /** Short human summary of how this member is reached, e.g. "Level 16". */
  requirement: string | null;
}

/** One step of the evolution line. Branching evolutions (Eevee) have several members. */
export interface EvolutionStage {
  members: EvolutionMember[];
}

/** Lightweight index entry used for searching names. */
export interface PokemonIndexEntry {
  id: number;
  name: string;
}
