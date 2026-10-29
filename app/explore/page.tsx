import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PokemonCard } from "@/components/PokemonCard";
import { PokemonGridSkeleton } from "@/components/PokemonCardSkeleton";
import { PokemonSearch } from "@/components/PokemonSearch";
import { StateMessage } from "@/components/StateMessage";
import { TypeTheme } from "@/components/TypeTheme";
import { getPokemonCards, getPokemonIndex, searchPokemonIndex } from "@/lib/pokeapi/pokemon";

export const metadata: Metadata = { title: "Explore" };

const PAGE_SIZE = 12;
const SUGGESTIONS = ["pikachu", "umbreon", "eevee", "dragon", "25"];

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function hrefFor(q: string, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

export default function ExplorePage({ searchParams }: PageProps<"/explore">) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <header className="mb-10 text-center">
        <p className="eyebrow">Pokédex</p>
        <h1 className="mt-2 text-4xl font-black sm:text-5xl">Explore Pokémon</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink-muted">
          Search by name or Pokédex number. The page takes on the color of the Pokémon you find.
        </p>
      </header>

      <PokemonSearch />

      <div className="mt-12">
        {/* searchParams is request-time data, so the results stream in behind Suspense. */}
        <Suspense fallback={<PokemonGridSkeleton count={PAGE_SIZE} />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/explore">["searchParams"] }) {
  const params = await searchParams;
  const q = firstParam(params.q).trim().slice(0, 60);
  const requestedPage = Math.max(1, Number.parseInt(firstParam(params.page), 10) || 1);

  // A failure here (PokéAPI down) throws and is handled by app/error.tsx.
  const index = await getPokemonIndex();
  const matches = searchPokemonIndex(index, q);

  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageEntries = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (matches.length === 0) {
    return (
      <StateMessage
        tone="empty"
        title={`No Pokémon found for “${q}”`}
        actions={SUGGESTIONS.map((s) => (
          <Link key={s} href={hrefFor(s, 1)} className="btn-secondary">
            {s}
          </Link>
        ))}
      >
        Check the spelling, or try a name fragment or Pokédex number.
      </StateMessage>
    );
  }

  const { pokemon, failed } = await getPokemonCards(pageEntries.map((e) => e.name));

  if (pokemon.length === 0) {
    throw new Error("Could not load any Pokémon details from PokéAPI.");
  }

  // Theme the whole page when the search clearly points at one Pokémon.
  const slug = q.toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
  const top = matches[0];
  const isClearWinner =
    q !== "" && page === 1 && (matches.length === 1 || top.name === slug || String(top.id) === slug);
  const themed = isClearWinner ? pokemon.find((p) => p.name === top.name) : undefined;

  return (
    <>
      {themed && <TypeTheme type={themed.types[0]} />}

      <p aria-live="polite" className="mb-5 text-center font-bold text-ink-muted">
        {q ? `${matches.length} result${matches.length === 1 ? "" : "s"} for “${q}”` : "Kanto to Paldea and beyond"}
        {pageCount > 1 && ` · page ${page} of ${pageCount}`}
      </p>

      {failed > 0 && (
        <p role="status" className="surface mx-auto mb-6 max-w-lg px-5 py-3 text-center text-sm font-bold">
          {failed} Pokémon couldn’t be loaded from PokéAPI. Reload the page to try again.
        </p>
      )}

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {pokemon.map((p, i) => (
          <li key={p.id}>
            <PokemonCard pokemon={p} priority={i < 4} delay={i * 45} />
          </li>
        ))}
      </ul>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link href={hrefFor(q, page - 1)} className="btn-secondary">
              ← Previous
            </Link>
          ) : (
            <span className="btn-secondary pointer-events-none opacity-40" aria-disabled>
              ← Previous
            </span>
          )}
          {page < pageCount ? (
            <Link href={hrefFor(q, page + 1)} className="btn-primary">
              Next →
            </Link>
          ) : (
            <span className="btn-primary pointer-events-none opacity-40" aria-disabled>
              Next →
            </span>
          )}
        </nav>
      )}
    </>
  );
}
