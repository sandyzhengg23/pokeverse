import Link from "next/link";
import { Suspense } from "react";
import { FeatureCard } from "@/components/FeatureCard";
import { FeaturedPokemon } from "@/components/FeaturedPokemon";
import { PokemonGridSkeleton } from "@/components/PokemonCardSkeleton";

const STEPS = [
  { title: "Scan your card", body: "Take a photo or upload a picture of a Pokémon card." },
  { title: "Identify with AI", body: "Muse Spark reads the card, and PokéAPI verifies the Pokémon." },
  { title: "Connect the stories", body: "See verified, source-linked anime episodes for that Pokémon." },
  { title: "Follow a journey", body: "Get a spoiler-aware watch plan, made for you." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-5 pb-16 pt-16 text-center sm:pt-24">
        <span
          aria-hidden
          className="absolute left-2 top-10 hidden size-16 animate-float rounded-full bg-blush sm:block"
        />
        <span
          aria-hidden
          className="absolute right-6 top-24 hidden size-10 animate-float rounded-full bg-mint [animation-delay:-2s] sm:block"
        />
        <span
          aria-hidden
          className="absolute bottom-6 right-20 hidden size-14 animate-float rounded-full bg-butter [animation-delay:-4s] sm:block"
        />

        <p className="eyebrow">Your Pokémon universe</p>
        <h1 className="mt-4 text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
          Every Card Has a <span className="rounded-3xl bg-lavender px-3">Story.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted sm:text-xl">
          Scan a Pokémon card, find the anime episodes behind the Pokémon on it, and follow a
          spoiler-aware viewing journey planned by AI.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/explore" className="btn-primary px-8 py-3 text-base">
            Explore Pokémon
          </Link>
          <Link href="/scan" className="btn-secondary px-8 py-3 text-base">
            Scan a card
          </Link>
        </div>
      </section>

      {/* Featured Pokémon (live from PokéAPI) */}
      <section aria-labelledby="featured-heading" className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Fresh from PokéAPI</p>
            <h2 id="featured-heading" className="text-2xl font-black sm:text-3xl">
              Meet a few friends
            </h2>
          </div>
          <Link href="/explore" className="text-sm font-bold underline underline-offset-4">
            Browse all →
          </Link>
        </div>
        <Suspense fallback={<PokemonGridSkeleton count={6} />}>
          <FeaturedPokemon />
        </Suspense>
      </section>

      {/* Discovery options */}
      <section aria-labelledby="discover-heading" className="mx-auto max-w-6xl px-5 py-14">
        <p className="eyebrow">Ways to discover</p>
        <h2 id="discover-heading" className="mb-6 text-2xl font-black sm:text-3xl">
          Pick your adventure
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <FeatureCard
              href="/explore"
              icon="🌿"
              tint="bg-mint"
              title="Explore"
              description="Search every Pokémon with official artwork, types and Pokédex entries."
            />
          </li>
          <li>
            <FeatureCard
              href="/scan"
              icon="📸"
              tint="bg-sky"
              title="Scan cards"
              description="Snap your trading cards and let AI recognize who’s inside."
              cta="Scan a card"
            />
          </li>
          <li>
            <FeatureCard
              href="/collection"
              icon="📒"
              tint="bg-blush"
              title="Collection"
              description="Save the Pokémon you scan, then turn them into a story journey."
              cta="Open your collection"
            />
          </li>
          <li>
            <FeatureCard
              href="/journey"
              icon="🎬"
              tint="bg-butter"
              title="Journeys"
              description="Spoiler-aware anime viewing paths built around the Pokémon you pick."
              cta="Build a journey"
            />
          </li>
        </ul>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="how-it-works-heading" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-14">
        <p className="eyebrow">How it works</p>
        <h2 id="how-it-works-heading" className="mb-6 text-2xl font-black sm:text-3xl">
          From card to story
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="surface p-5">
              <span className="flex size-9 items-center justify-center rounded-full bg-lavender font-black">
                {i + 1}
              </span>
              <h3 className="mt-3 font-extrabold">{step.title}</h3>
              <p className="mt-1 text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
