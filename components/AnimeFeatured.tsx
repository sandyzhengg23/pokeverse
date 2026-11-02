import Link from "next/link";
import { AnimeEpisodeCard, NUMBERING_NOTE } from "@/components/AnimeEpisodeCard";
import { getAnimeAppearances, getFeaturedEpisodes } from "@/lib/anime/queries";
import type { AnimeEpisodeAppearance, SpoilerLevel } from "@/lib/anime/types";

interface AnimeFeaturedProps {
  /** National Dex species id. */
  pokemonId: number;
  /** PokéAPI slug, for the story link. */
  pokemonSlug: string;
  displayName: string;
  limit?: number;
  /** Link to the full story page. Turn off on that page itself. */
  showLink?: boolean;
  /**
   * Spoiler setting. Previews (profile, scanner) have no setting control, so they
   * default to "none"; the story page passes the viewer's choice.
   */
  allowed?: SpoilerLevel;
  /** Pre-selected episodes; defaults to the featured episodes for `pokemonId`. */
  episodes?: AnimeEpisodeAppearance[];
}

/**
 * Featured episodes plus a link into the full Story Explorer. Pure (no hooks),
 * so it renders in both Server Components (profile) and Client Components (scanner, story).
 */
export function AnimeFeatured({
  pokemonId,
  pokemonSlug,
  displayName,
  limit = 3,
  showLink = true,
  allowed = "none",
  episodes,
}: AnimeFeaturedProps) {
  const featured = episodes ?? getFeaturedEpisodes(pokemonId, limit);
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
            <AnimeEpisodeCard episode={episode} allowed={allowed} compact />
          </li>
        ))}
      </ul>
      <p className="text-xs text-ink-muted">
        {NUMBERING_NOTE}
        {showLink && " Plot outcomes are hidden here; open the story page to choose your spoiler setting."}
      </p>
      {showLink && (
        <Link href={`/pokemon/${pokemonSlug}/story`} className="btn-primary">
          Explore {displayName}’s story ({total} episode{total === 1 ? "" : "s"}) →
        </Link>
      )}
    </div>
  );
}
