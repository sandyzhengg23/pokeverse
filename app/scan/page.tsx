import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Scan cards" };

export default function ScanPage() {
  return (
    <ComingSoon
      icon="📸"
      title="Scan your cards"
      tagline="Point your camera at a card and find out who’s on it."
      plans={[
        "Upload or capture one or many Pokémon cards.",
        "A Meta multimodal model reads each card.",
        "Every match is verified against PokéAPI before it’s shown.",
      ]}
    />
  );
}
