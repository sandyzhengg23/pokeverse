import { getPokemonCards } from "@/lib/pokeapi/pokemon";
import { PokemonCard } from "./PokemonCard";

/** Editorial pick of names. All the data shown is fetched live from PokéAPI. */
const FEATURED = ["pikachu", "umbreon", "bulbasaur", "squirtle", "charmander", "eevee"];

export async function FeaturedPokemon() {
  const { pokemon } = await getPokemonCards(FEATURED);

  if (pokemon.length === 0) {
    return (
      <p className="surface mx-auto max-w-md px-6 py-4 text-center text-ink-muted">
        Couldn’t reach PokéAPI just now. Featured Pokémon will be back shortly.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {pokemon.map((p, i) => (
        <li key={p.id}>
          <PokemonCard pokemon={p} delay={i * 70} />
        </li>
      ))}
    </ul>
  );
}
