import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Journeys" };

export default function JourneyPage() {
  return (
    <ComingSoon
      icon="🎬"
      title="Anime journeys"
      tagline="A watch plan that starts from the cards in your hands."
      plans={[
        "An AI agent plans a multi-step path through verified anime appearances.",
        "Spoiler-aware: you choose how much you want to know.",
        "Every recommendation is explained using grounded, cited data.",
      ]}
    />
  );
}
