import type { Metadata } from "next";
import { CollectionView } from "@/components/CollectionView";

export const metadata: Metadata = { title: "Collection" };

export default function CollectionPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <header className="mb-10 text-center">
        <span aria-hidden className="text-5xl">
          📒
        </span>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Your collection</h1>
        <p className="mx-auto mt-2 max-w-xl text-lg text-ink-muted">
          The Pokémon you’ve found by scanning cards, ready to turn into a story journey.
        </p>
      </header>
      <CollectionView />
    </div>
  );
}
