"use client";

import Link from "next/link";
import { useState } from "react";
import { saveToCollection, useCollection, type SaveResult } from "@/lib/collection";

const FAILURE: Partial<Record<SaveResult, string>> = {
  full: "Your collection is full. Remove a Pokémon on the Collection page to make room.",
  error: "Couldn’t save. Your browser may be blocking local storage (for example in private mode).",
};

/** Saves the VERIFIED species (id + name) to this browser's collection. */
export function SaveToCollectionButton({ speciesId, name }: { speciesId: number; name: string }) {
  const collection = useCollection();
  const [failure, setFailure] = useState<SaveResult | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const saved = collection.entries.some((e) => e.speciesId === speciesId);

  function save() {
    if (saved) return;
    const result = saveToCollection({ speciesId, name });
    setFailure(result === "saved" || result === "exists" ? null : result);
    setJustSaved(result === "saved");
  }

  return (
    <>
      {/* aria-disabled (not disabled) keeps keyboard focus on the button after saving. */}
      <button type="button" className="btn-secondary" aria-disabled={saved} onClick={save}>
        {saved ? <><span aria-hidden>✓</span> Saved to Collection</> : <>Save to Collection</>}
      </button>
      {saved && (
        <Link href="/collection" className="btn-secondary">
          View Collection
        </Link>
      )}
      <p role="status" className="sr-only">
        {justSaved && saved ? `${name} saved to your collection.` : ""}
      </p>
      {failure && FAILURE[failure] && (
        <p role="alert" className="w-full text-center text-sm font-bold sm:text-left">
          {FAILURE[failure]}
        </p>
      )}
    </>
  );
}
