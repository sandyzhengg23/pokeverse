"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getCollectionPokemon } from "@/app/collection/actions";
import { Announce } from "@/components/Announce";
import { PokemonCard } from "@/components/PokemonCard";
import { StateMessage } from "@/components/StateMessage";
import { hasAnimeAppearances } from "@/lib/anime/queries";
import { removeFromCollection, useCollection } from "@/lib/collection";
import type { Pokemon } from "@/lib/pokeapi/types";

const MAX_JOURNEY_POKEMON = 5;

export function CollectionView() {
  const collection = useCollection();
  const { entries } = collection;

  // PokéAPI data (artwork, types) keyed by species id. Failed ids are remembered so they aren't retried in a loop.
  const [details, setDetails] = useState<Record<number, Pokemon>>({});
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [announcement, setAnnouncement] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  const idsKey = entries.map((e) => e.speciesId).join(",");
  useEffect(() => {
    const missing = entries.map((e) => e.speciesId).filter((id) => !(id in details) && !failed.has(id));
    if (missing.length === 0) return;
    let cancelled = false;
    getCollectionPokemon(missing)
      .then(({ pokemon, failedIds }) => {
        if (cancelled) return;
        setDetails((d) => ({ ...d, ...Object.fromEntries(pokemon.map((p) => [p.speciesId, p])) }));
        setFailed((f) => new Set([...f, ...failedIds]));
      })
      .catch(() => {
        if (!cancelled) setFailed((f) => new Set([...f, ...missing]));
      });
    return () => {
      cancelled = true;
    };
    // `idsKey` stands in for `entries`; `details`/`failed` are intentionally not dependencies (they are what this effect fills in).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  if (collection.status === "loading") {
    return (
      <p role="status" className="py-10 text-center text-ink-muted">
        Loading your collection…
      </p>
    );
  }

  if (collection.status === "unavailable") {
    return (
      <StateMessage tone="error" title="Collection isn’t available in this browser">
        Your browser is blocking local storage (private browsing and some privacy settings do this), so PokéVerse
        can’t save or show your collection here. Try a regular browser window.
      </StateMessage>
    );
  }

  const journeyIds = entries.map((e) => e.speciesId).filter((id) => hasAnimeAppearances(id));
  const journeyHref = `/journey?pokemon=${journeyIds.slice(0, MAX_JOURNEY_POKEMON).join(",")}`;

  function remove(speciesId: number, name: string) {
    if (removeFromCollection(speciesId)) {
      setAnnouncement(`${name} removed from your collection.`);
      // The Remove button disappears with its card; keep keyboard focus in a sensible place.
      headingRef.current?.focus();
    } else {
      setAnnouncement(`Couldn’t remove ${name}. Your browser may be blocking local storage.`);
    }
  }

  return (
    <div className="space-y-8">
      <Announce message={announcement} />

      <p className="surface mx-auto max-w-2xl px-5 py-4 text-center text-sm">
        <span aria-hidden>🔒 </span>
        <strong>Stored only in this browser.</strong> Your collection lives in this browser on this device. It won’t
        sync to your other devices, and clearing your browser data will erase it.
      </p>

      <section aria-labelledby="saved-heading">
        <h2 id="saved-heading" ref={headingRef} tabIndex={-1} className="mb-4 text-2xl font-black focus:outline-none">
          Saved Pokémon ({entries.length})
        </h2>

        {entries.length === 0 ? (
          <StateMessage
            tone="empty"
            title="Your collection is empty"
            actions={
              <>
                <Link href="/scan" className="btn-primary">
                  Scan a card
                </Link>
                <Link href="/explore" className="btn-secondary">
                  Explore Pokémon
                </Link>
              </>
            }
          >
            Scan a Pokémon card and choose “Save to Collection” to add the Pokémon here.
          </StateMessage>
        ) : (
          <>
            <div className="surface mb-6 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              {journeyIds.length > 0 ? (
                <>
                  <p className="text-sm">
                    {journeyIds.length} saved Pokémon {journeyIds.length === 1 ? "has" : "have"} verified anime episodes.
                    {journeyIds.length > MAX_JOURNEY_POKEMON &&
                      ` Journeys take up to ${MAX_JOURNEY_POKEMON}, so the first ${MAX_JOURNEY_POKEMON} saved will be preselected.`}
                  </p>
                  <Link href={journeyHref} className="btn-primary shrink-0">
                    <span aria-hidden>🎬</span> Build a Story Journey
                  </Link>
                </>
              ) : (
                <p className="text-sm text-ink-muted">
                  None of your saved Pokémon have verified anime episodes yet, so a Story Journey isn’t available.
                  Journeys currently cover Pikachu, Eevee and its evolutions, and the Gastly line.
                </p>
              )}
            </div>

            <ul aria-label="Saved Pokémon" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {entries.map(({ speciesId, name }) => {
                const pokemon = details[speciesId];
                return (
                  <li key={speciesId} className="flex flex-col gap-2">
                    {pokemon ? (
                      <PokemonCard pokemon={pokemon} />
                    ) : (
                      <div className="surface flex flex-1 flex-col justify-center p-4 text-center">
                        <p className="text-lg font-extrabold">{name}</p>
                        <p className="mt-1 text-sm text-ink-muted" role={failed.has(speciesId) ? undefined : "status"}>
                          {failed.has(speciesId) ? "Artwork and types couldn’t be loaded from PokéAPI." : "Loading…"}
                        </p>
                        {failed.has(speciesId) && (
                          <Link href={`/pokemon/${speciesId}`} className="mt-2 text-sm font-bold underline underline-offset-4">
                            Open profile
                          </Link>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn-secondary w-full"
                      aria-label={`Remove ${name} from collection`}
                      onClick={() => remove(speciesId, name)}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
