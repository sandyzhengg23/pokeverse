import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnimeFeatured } from "@/components/AnimeFeatured";
import { PokemonArtwork } from "@/components/PokemonArtwork";
import { PokemonTypeBadge } from "@/components/PokemonTypeBadge";
import { StoryExplorer } from "@/components/StoryExplorer";
import { TypeTheme } from "@/components/TypeTheme";
import { getAnimeAppearances, getRelatedPokemon, hasAnimeAppearances } from "@/lib/anime/queries";
import { formatPokemonId } from "@/lib/pokeapi/format";
import { getPokemon } from "@/lib/pokeapi/pokemon";

export async function generateMetadata({ params }: PageProps<"/pokemon/[name]/story">): Promise<Metadata> {
  const { name } = await params;
  try {
    const pokemon = await getPokemon(name);
    if (pokemon) return { title: `${pokemon.displayName}’s anime story` };
  } catch {
    // The page itself reports the failure.
  }
  return { title: "Anime story" };
}

export default function StoryPage({ params }: PageProps<"/pokemon/[name]/story">) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <Suspense fallback={<p className="text-ink-muted">Loading story…</p>}>
        <Story params={params} />
      </Suspense>
    </div>
  );
}

async function Story({ params }: { params: PageProps<"/pokemon/[name]/story">["params"] }) {
  const { name } = await params;
  const pokemon = await getPokemon(name);
  if (!pokemon) notFound();

  const episodes = getAnimeAppearances(pokemon.speciesId);
  const related = getRelatedPokemon(pokemon.speciesId).slice(0, 8);
  // Names/artwork for related Pokémon come from PokéAPI; a failure just hides that Pokémon.
  const relatedPokemon = (
    await Promise.all(
      related.map(async (r) => {
        const p = await getPokemon(String(r.pokemonId)).catch(() => null);
        return p ? { pokemon: p, shared: r.sharedEpisodes } : null;
      }),
    )
  ).filter((r) => r !== null);

  return (
    <div className="space-y-10">
      <TypeTheme type={pokemon.types[0]} />
      <Link href={`/pokemon/${pokemon.name}`} className="btn-secondary !min-h-10">
        ← {pokemon.displayName}’s profile
      </Link>

      <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
        <div className="relative aspect-square w-40 shrink-0 rounded-full bg-white/50 p-3 shadow-soft">
          <PokemonArtwork src={pokemon.artworkUrl} alt={pokemon.displayName} sizes="160px" priority />
        </div>
        <div>
          <p className="eyebrow">Anime story · {formatPokemonId(pokemon.id)}</p>
          <h1 className="mt-1 text-4xl font-black sm:text-5xl">{pokemon.displayName}</h1>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {pokemon.types.map((t) => (
              <PokemonTypeBadge key={t} type={t} />
            ))}
          </div>
        </div>
      </header>

      {episodes.length === 0 ? (
        <section className="surface p-6 sm:p-8">
          <AnimeFeatured pokemonId={pokemon.speciesId} pokemonSlug={pokemon.name} displayName={pokemon.displayName} />
        </section>
      ) : (
        <>
          <section className="surface p-6 sm:p-8">
            <h2 className="text-2xl font-black">Start here</h2>
            <p className="mb-5 mt-1 text-sm text-ink-muted">
              The episodes that matter most for {pokemon.displayName}, from PokéVerse’s curated dataset.
            </p>
            <AnimeFeatured
              pokemonId={pokemon.speciesId}
              pokemonSlug={pokemon.name}
              displayName={pokemon.displayName}
              showLink={false}
            />
          </section>

          <section className="surface p-6 sm:p-8">
            <h2 className="text-2xl font-black">Full story timeline</h2>
            <p className="mb-6 mt-1 text-sm text-ink-muted">
              {episodes.length} verified episode{episodes.length === 1 ? "" : "s"} in broadcast order. Every
              card links to its source.
            </p>
            <StoryExplorer episodes={episodes} />
          </section>

          {relatedPokemon.length > 0 && (
            <section className="surface p-6 sm:p-8">
              <h2 className="text-2xl font-black">Connected Pokémon</h2>
              <p className="mb-5 mt-1 text-sm text-ink-muted">
                Pokémon who share curated episodes with {pokemon.displayName}.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {relatedPokemon.map(({ pokemon: p, shared }) => (
                  <li key={p.id}>
                    <Link
                      href={hasAnimeAppearances(p.speciesId) ? `/pokemon/${p.name}/story` : `/pokemon/${p.name}`}
                      className="flex items-center gap-4 rounded-2xl border border-theme-ink/10 bg-white/70 p-3 transition hover:-translate-y-0.5 hover:bg-white"
                    >
                      <span className="relative block size-16 shrink-0">
                        <PokemonArtwork src={p.artworkUrl} alt="" sizes="64px" />
                      </span>
                      <span>
                        <span className="block font-extrabold">{p.displayName}</span>
                        <span className="block text-sm text-ink-muted">
                          {shared.length} shared episode{shared.length === 1 ? "" : "s"}:{" "}
                          {shared.map((e) => e.title).join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
