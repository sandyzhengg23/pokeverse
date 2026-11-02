import type { Metadata } from "next";
import { Suspense } from "react";
import { JourneyBuilder, type JourneyPokemon } from "@/components/JourneyBuilder";
import { ANIME_POKEMON_NAMES } from "@/data/anime/pokemon";
import { getSupportedPokemonIds } from "@/lib/ai/journey";
import { officialArtworkUrl } from "@/lib/pokeapi/client";
import { getPokemon } from "@/lib/pokeapi/pokemon";

export const metadata: Metadata = { title: "Story journeys" };

export default function JourneyPage({ searchParams }: PageProps<"/journey">) {
  // `searchParams` is request-time data, so it is read behind Suspense.
  return (
    <Suspense fallback={<p className="px-5 py-16 text-center text-ink-muted">Loading…</p>}>
      <Journey searchParams={searchParams} />
    </Suspense>
  );
}

async function Journey({ searchParams }: { searchParams: PageProps<"/journey">["searchParams"] }) {
  const supported = getSupportedPokemonIds();

  // Types/artwork come from PokéAPI; if it's down the tile still works with a fallback.
  const pokemon: JourneyPokemon[] = await Promise.all(
    supported.map(async (id) => {
      const known = ANIME_POKEMON_NAMES[id];
      const data = await getPokemon(String(id)).catch(() => null);
      return {
        id,
        slug: data?.name ?? known?.slug ?? String(id),
        name: data?.displayName ?? known?.name ?? `#${id}`,
        types: data?.types ?? [],
        artworkUrl: data?.artworkUrl ?? officialArtworkUrl(id),
      };
    }),
  );

  // ?pokemon=94,197 — only verified, supported species ids are honoured.
  const raw = (await searchParams).pokemon;
  const initialSelected = [...new Set((Array.isArray(raw) ? raw.join(",") : (raw ?? "")).split(",").map(Number))]
    .filter((id) => supported.includes(id))
    .slice(0, 5);

  return <JourneyBuilder pokemon={pokemon} initialSelected={initialSelected} />;
}
