import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Collection" };

export default function CollectionPage() {
  return (
    <ComingSoon
      icon="📒"
      title="Your collection"
      tagline="A scrapbook of every Pokémon you’ve found."
      plans={[
        "Save identified Pokémon to your personal collection.",
        "Explore how your characters relate to each other.",
        "Stored on your device first; accounts come later.",
      ]}
    />
  );
}
