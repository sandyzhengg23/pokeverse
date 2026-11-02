import Link from "next/link";
import type { EvolutionStage } from "@/lib/pokeapi/types";
import { PokemonArtwork } from "./PokemonArtwork";
import { StoryTimeline } from "./StoryTimeline";

/** Renders PokéAPI evolution stages through the generic StoryTimeline. */
export function EvolutionTimeline({
  stages,
  currentSpeciesId,
}: {
  stages: EvolutionStage[];
  currentSpeciesId: number;
}) {
  const items = stages.map((stage, index) => ({
    id: `stage-${index}`,
    label: index === 0 ? "Starting form" : `Evolution ${index}`,
    content: (
      <ul className="flex flex-wrap gap-4">
        {stage.members.map((member) => {
          const isCurrent = member.id === currentSpeciesId;
          return (
            <li key={member.id}>
              <Link
                href={`/pokemon/${member.name}`}
                aria-current={isCurrent ? "page" : undefined}
                className={`flex w-36 flex-col items-center rounded-3xl border p-3 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lift ${
                  isCurrent
                    ? "border-theme-ink bg-white shadow-soft"
                    : "border-white/70 bg-white/60"
                }`}
              >
                <span className="relative block size-24">
                  <PokemonArtwork
                    src={member.artworkUrl}
                    alt="" /* decorative: the link text names the Pokémon */
                    sizes="96px"
                  />
                </span>
                <span className="mt-2 font-extrabold">{member.displayName}</span>
                {member.requirement && (
                  <span className="mt-1 text-xs font-bold text-ink-muted">
                    <span className="sr-only">Evolves by: </span>
                    {member.requirement}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    ),
  }));

  return <StoryTimeline items={items} />;
}
