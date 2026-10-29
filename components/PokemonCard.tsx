import Link from "next/link";
import { formatPokemonId } from "@/lib/pokeapi/format";
import type { Pokemon } from "@/lib/pokeapi/types";
import { typeThemeVars } from "@/lib/theme/type-themes";
import { PokemonArtwork } from "./PokemonArtwork";
import { PokemonTypeBadge } from "./PokemonTypeBadge";

interface PokemonCardProps {
  pokemon: Pokemon;
  priority?: boolean;
  /** Delay (ms) for the entrance animation, so grids pop in one after another. */
  delay?: number;
}

/**
 * Card tinted by the Pokémon's primary type. It re-declares the --theme-*
 * variables on its own wrapper, so every `bg-theme-*` class inside picks up
 * the card's colors, independent of the page theme.
 */
export function PokemonCard({ pokemon, priority, delay = 0 }: PokemonCardProps) {
  return (
    <Link
      href={`/pokemon/${pokemon.name}`}
      style={{ ...typeThemeVars(pokemon.types[0]), animationDelay: `${delay}ms` }}
      className="group block animate-pop-in rounded-3xl border border-white/70 bg-theme-soft p-4 text-theme-ink shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <div className="relative mx-auto aspect-square w-4/5 rounded-full bg-white/50 p-2 transition duration-300 group-hover:bg-white/70">
        <PokemonArtwork
          src={pokemon.artworkUrl}
          alt={`Official artwork of ${pokemon.displayName}`}
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
          priority={priority}
          className="p-2 group-hover:scale-110"
        />
      </div>
      <p className="mt-4 text-xs font-extrabold tracking-wider opacity-70">
        {formatPokemonId(pokemon.id)}
      </p>
      <h3 className="text-lg font-extrabold leading-tight">{pokemon.displayName}</h3>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {pokemon.types.map((type) => (
          <PokemonTypeBadge key={type} type={type} />
        ))}
      </div>
    </Link>
  );
}
