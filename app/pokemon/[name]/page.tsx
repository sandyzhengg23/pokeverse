import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnimeFeatured } from "@/components/AnimeFeatured";
import { EvolutionTimeline } from "@/components/EvolutionTimeline";
import { PokemonArtwork } from "@/components/PokemonArtwork";
import { PokemonTypeBadge } from "@/components/PokemonTypeBadge";
import { TypeTheme } from "@/components/TypeTheme";
import { formatPokemonId } from "@/lib/pokeapi/format";
import { getEvolutionStages, getPokemon, getPokemonSpecies } from "@/lib/pokeapi/pokemon";
import type { Pokemon } from "@/lib/pokeapi/types";

export async function generateMetadata({ params }: PageProps<"/pokemon/[name]">): Promise<Metadata> {
  const { name } = await params;
  try {
    const pokemon = await getPokemon(name);
    if (pokemon) {
      return { title: `${pokemon.displayName} ${formatPokemonId(pokemon.id)}` };
    }
  } catch {
    // The page itself reports the failure; metadata just falls back.
  }
  return { title: "Pokémon" };
}

export default function PokemonPage({ params }: PageProps<"/pokemon/[name]">) {
  // `params` is request-time data, so the profile streams in behind Suspense.
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <Link href="/explore" className="btn-secondary mb-8 !min-h-10">
        ← Back to Explore
      </Link>
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile params={params} />
      </Suspense>
    </div>
  );
}

async function Profile({ params }: { params: PageProps<"/pokemon/[name]">["params"] }) {
  const { name } = await params;

  // Throws if PokéAPI is unreachable (→ app/error.tsx); null means "no such Pokémon".
  const pokemon = await getPokemon(name);
  if (!pokemon) notFound();

  // Species and evolution are enrichments: if they fail, show the rest of the page.
  const species = await getPokemonSpecies(pokemon.speciesId).catch(() => undefined);
  const stages =
    species?.evolutionChainId != null
      ? await getEvolutionStages(species.evolutionChainId).catch(() => undefined)
      : null;

  const description = species?.description;
  const facts = [
    { label: "Height", value: `${pokemon.heightM} m` },
    { label: "Weight", value: `${pokemon.weightKg} kg` },
    species?.generation ? { label: "Generation", value: species.generation } : null,
    species?.habitat ? { label: "Habitat", value: species.habitat } : null,
  ].filter((f) => f !== null);

  return (
    <article className="space-y-12">
      <TypeTheme type={pokemon.types[0]} />

      {/* Hero */}
      <header className="grid items-center gap-8 md:grid-cols-[minmax(0,2fr)_3fr]">
        <div className="relative mx-auto aspect-square w-full max-w-sm rounded-full bg-white/50 p-6 shadow-soft">
          <PokemonArtwork
            src={pokemon.artworkUrl}
            alt={`Official artwork of ${pokemon.displayName}`}
            sizes="(min-width: 768px) 384px, 90vw"
            priority
            className="animate-float p-4"
          />
        </div>
        <div>
          <p className="eyebrow">
            {formatPokemonId(pokemon.id)}
            {species?.genus && ` · ${species.genus}`}
          </p>
          <h1 className="mt-1 text-5xl font-black leading-tight sm:text-6xl">{pokemon.displayName}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {pokemon.types.map((t) => (
              <PokemonTypeBadge key={t} type={t} />
            ))}
            {species?.isLegendary && <Flag>Legendary</Flag>}
            {species?.isMythical && <Flag>Mythical</Flag>}
          </div>
          {description ? (
            <p className="mt-6 text-lg leading-relaxed">{description}</p>
          ) : (
            <p className="mt-6 text-ink-muted">
              {species === undefined
                ? "Species details couldn’t be loaded from PokéAPI right now."
                : "PokéAPI has no Pokédex entry for this Pokémon."}
            </p>
          )}
        </div>
      </header>

      {/* Facts + stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Quick facts">
          <dl className="grid grid-cols-2 gap-4">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="eyebrow">{f.label}</dt>
                <dd className="text-lg font-extrabold">{f.value}</dd>
              </div>
            ))}
            <div className="col-span-2">
              <dt className="eyebrow">Abilities</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {pokemon.abilities.map((a) => (
                  <span key={a.name} className="rounded-full bg-theme-soft px-3 py-1 text-sm font-bold">
                    {a.name}
                    {a.isHidden && <span className="font-medium opacity-70"> (hidden)</span>}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="Base stats">
          <StatBars stats={pokemon.stats} />
        </Section>
      </div>

      {/* Evolution (PokéAPI) */}
      <Section title="Evolution">
        <EvolutionContent stages={stages} pokemon={pokemon} speciesId={species?.id ?? pokemon.speciesId} />
      </Section>

      {/* Anime (curated dataset, NOT PokéAPI) */}
      <Section
        title="Anime appearances"
        note="From PokéVerse’s own curated, source-linked dataset. PokéAPI does not provide anime data."
      >
        <AnimeFeatured
          pokemonId={pokemon.speciesId}
          pokemonSlug={pokemon.name}
          displayName={pokemon.displayName}
        />
      </Section>
    </article>
  );
}

function EvolutionContent({
  stages,
  pokemon,
  speciesId,
}: {
  stages: Awaited<ReturnType<typeof getEvolutionStages>> | undefined;
  pokemon: Pokemon;
  speciesId: number;
}) {
  if (stages === undefined) {
    return <p className="text-ink-muted">Evolution data couldn’t be loaded from PokéAPI right now.</p>;
  }
  if (!stages || stages.length <= 1) {
    return <p>{pokemon.displayName} doesn’t evolve.</p>;
  }
  return <EvolutionTimeline stages={stages} currentSpeciesId={speciesId} />;
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface p-6 sm:p-8">
      <h2 className="text-2xl font-black">{title}</h2>
      {note && <p className="mb-1 mt-1 text-sm text-ink-muted">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Flag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-butter px-3 py-1 text-xs font-extrabold text-[#5e4a00]">
      {children}
    </span>
  );
}

function StatBars({ stats }: { stats: Pokemon["stats"] }) {
  const MAX_STAT = 255;
  return (
    <dl className="space-y-3">
      {stats.map((s) => (
        <div key={s.name} className="grid grid-cols-[6.5rem_2.5rem_1fr] items-center gap-3">
          <dt className="text-sm font-bold">{s.name}</dt>
          <dd className="text-sm font-extrabold tabular-nums">{s.value}</dd>
          <div aria-hidden className="h-2.5 overflow-hidden rounded-full bg-theme-soft">
            <div
              className="h-full rounded-full bg-theme-accent transition-[width] duration-700"
              style={{ width: `${Math.min(100, (s.value / MAX_STAT) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </dl>
  );
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading Pokémon profile" className="animate-pulse space-y-8">
      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,2fr)_3fr]">
        <div className="mx-auto aspect-square w-full max-w-sm rounded-full bg-theme-soft" />
        <div className="space-y-4">
          <div className="h-3 w-24 rounded-full bg-theme-soft" />
          <div className="h-12 w-3/4 rounded-full bg-theme-soft" />
          <div className="h-7 w-40 rounded-full bg-theme-soft" />
          <div className="h-20 rounded-3xl bg-theme-soft" />
        </div>
      </div>
      <div className="h-48 rounded-3xl bg-theme-soft" />
    </div>
  );
}
