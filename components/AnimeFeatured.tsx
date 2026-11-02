import Link from "next/link";
import { AnimeEpisodeCard } from "@/components/AnimeEpisodeCard";
import { getAnimeAppearances, getFeaturedEpisodes } from "@/lib/anime/queries";

interface AnimeFeaturedProps {
  /** National Dex species id. */
  pokemonId: number;
  /** PokéAPI slug, for the story link. */
  pokemonSlug: string;
  displayName: string;
  limit?: number;
  /** Link to the full story page. Turn off on that page itself. */
  showLink?: boolean;
}

/**
 * Featured episodes plus a link into the full Story Explorer. Pure (no hooks),
 * so it renders in both Server Components (profile) and Client Components (scanner).
 */
export function AnimeFeatured({ pokemonId, pokemonSlug, displayName, limit = 3, showLink = true }: AnimeFeaturedProps) {
  const featured = getFeaturedEpisodes(pokemonId, limit);
  const total = getAnimeAppearances(pokemonId).length;

  if (featured.length === 0) {
    return (
      <p className="text-ink-muted">
        No verified anime episodes for {displayName} yet. We only list episodes we can cite, so
        nothing is guessed or auto-generated.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <ul className="grid gap-4 md:grid-cols-2">
        {featured.map((episode) => (
          <li key={episode.id}>
            <AnimeEpisodeCard episode={episode} compact />
          </li>
        ))}
      </ul>
      {showLink && (
        <Link href={`/pokemon/${pokemonSlug}/story`} className="btn-primary">
          Explore {displayName}’s story ({total} episode{total === 1 ? "" : "s"}) →
        </Link>
      )}
    </div>
  );
}
