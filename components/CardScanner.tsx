"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { searchPokemonForCorrection } from "@/app/scan/actions";
import { AnimeFeatured } from "@/components/AnimeFeatured";
import { PokemonArtwork } from "@/components/PokemonArtwork";
import { PokemonTypeBadge } from "@/components/PokemonTypeBadge";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { StateMessage } from "@/components/StateMessage";
import { TypeTheme } from "@/components/TypeTheme";
import { MAX_UPLOAD_BYTES, type ScanResult } from "@/lib/ai/card-scan";
import { hasAnimeAppearances } from "@/lib/anime/queries";
import { formatPokemonId } from "@/lib/pokeapi/format";
import type { Pokemon } from "@/lib/pokeapi/types";

const MAX_PICKED_BYTES = 25 * 1024 * 1024; // before client-side downscaling
const MAX_EDGE_PX = 1600;

type Phase = "idle" | "preparing" | "scanning" | "done" | "error";

/** Downscales large phone photos to a JPEG so uploads are fast and under the server limit. */
async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) throw new Error("encode failed");
  return blob;
}

export function CardScanner() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  /** Set when the user picks a different Pokémon than the scan found. */
  const [corrected, setCorrected] = useState<Pokemon | null>(null);
  const [dragging, setDragging] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraButton = useRef<HTMLButtonElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function fail(message: string) {
    setError(message);
    setPhase("error");
  }

  function reset() {
    abortRef.current?.abort();
    setPhase("idle");
    setError(null);
    setPreviewUrl(null);
    setResult(null);
    setCorrected(null);
    // The "Start over"/"Cancel" button unmounts; keep keyboard focus somewhere sensible.
    cameraButton.current?.focus();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    abortRef.current?.abort();
    setResult(null);
    setCorrected(null);
    setError(null);

    if (!file.type.startsWith("image/")) {
      return fail("That doesn’t look like an image. Please choose a JPEG, PNG or WebP photo.");
    }
    if (file.size > MAX_PICKED_BYTES) {
      return fail("That image is too large. Please choose one under 25 MB.");
    }
    setPreviewUrl(URL.createObjectURL(file));

    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("preparing");
    let upload: Blob;
    try {
      upload = await prepareImage(file);
    } catch {
      return fail("We couldn’t open that image. Try a JPEG, PNG or WebP photo.");
    }
    if (upload.size > MAX_UPLOAD_BYTES) return fail("That image is still too large. Try a smaller photo.");
    if (controller.signal.aborted) return;

    setPhase("scanning");
    try {
      const body = new FormData();
      body.append("image", upload, "card.jpg");
      const res = await fetch("/api/scan", { method: "POST", body, signal: controller.signal });
      const data = await res.json().catch(() => null);
      if (!res.ok) return fail(data?.error ?? "Something went wrong while scanning.");
      setResult(data as ScanResult);
      setPhase("done");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      fail("Couldn’t reach the scanner. Check your connection and try again.");
    }
  }

  const busy = phase === "preparing" || phase === "scanning";
  const pokemon = corrected ?? result?.pokemon ?? null;

  // One persistent live region announces every state change (see also the error alert below).
  const statusMessage =
    phase === "preparing"
      ? "Preparing your photo…"
      : phase === "scanning"
        ? "Reading your card with Muse Spark…"
        : phase === "done" && result
          ? pokemon
            ? `Scan complete. ${corrected ? "You chose" : "Found"} ${pokemon.displayName}. Results are below.`
            : "Scan complete, but we couldn’t identify the Pokémon. Options are below."
          : "";

  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      {pokemon && <TypeTheme type={pokemon.types[0]} />}
      <div className="text-center">
        <span aria-hidden className="text-5xl">📸</span>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Scan your card</h1>
        <p className="mt-2 text-lg text-ink-muted">
          Snap or upload a Pokémon card and we’ll find out who’s on it.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) void handleFile(e.dataTransfer.files[0]); }}
        className={`surface mt-8 p-6 text-center transition ${dragging ? "ring-4 ring-theme-accent" : ""}`}
      >
        {previewUrl ? (
          <div className="relative mx-auto w-fit">
            {/* Local blob preview: next/image can't optimize object URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview of the Pokémon card photo you chose"
              className={`max-h-80 rounded-2xl object-contain shadow-soft ${busy ? "opacity-60" : ""}`}
            />
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span aria-hidden className="size-10 animate-spin rounded-full border-4 border-theme-accent border-t-theme-ink" />
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-ink-muted">Drop a card photo here, or use a button below.</p>
        )}

        <p role="status" aria-live="polite" className="mt-4 min-h-6 font-bold">
          {phase === "preparing" || phase === "scanning" ? statusMessage : <span className="sr-only">{statusMessage}</span>}
        </p>

        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {/* `capture` opens the camera on phones; the second input allows picking from the gallery/files. */}
          <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden aria-label="Take a photo of a card" tabIndex={-1}
            onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ""; }} />
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden aria-label="Choose a card image" tabIndex={-1}
            onChange={(e) => { void handleFile(e.target.files?.[0]); e.target.value = ""; }} />
          {/* aria-disabled (not disabled) keeps keyboard focus on the button while a scan runs. */}
          <button ref={cameraButton} type="button" className="btn-primary" aria-disabled={busy} onClick={() => { if (!busy) cameraInput.current?.click(); }}>
            <span aria-hidden>📷</span> Take a photo
          </button>
          <button type="button" className="btn-secondary" aria-disabled={busy} onClick={() => { if (!busy) fileInput.current?.click(); }}>
            Choose an image
          </button>
          {phase !== "idle" && (
            <button type="button" className="btn-secondary" onClick={reset}>
              {busy ? "Cancel" : "Start over"}
            </button>
          )}
        </div>
        <p className="mt-4 text-xs text-ink-muted">
          Photos are sent to Meta’s Muse Spark model to read the card and are never stored by PokéVerse.
        </p>
      </div>

      {phase === "error" && error && (
        <div className="mt-8">
          <StateMessage tone="error" title="Scan didn’t work">{error}</StateMessage>
        </div>
      )}

      {phase === "done" && result && (
        <ResultPanel result={result} pokemon={pokemon} isCorrected={corrected !== null} onCorrect={setCorrected} />
      )}
    </section>
  );
}

function ResultPanel({
  result,
  pokemon,
  isCorrected,
  onCorrect,
}: {
  result: ScanResult;
  pokemon: Pokemon | null;
  isCorrected: boolean;
  onCorrect: (p: Pokemon) => void;
}) {
  const [correcting, setCorrecting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Picking a Pokémon unmounts the search form; move focus to the new result instead of losing it.
  useEffect(() => {
    if (isCorrected) headingRef.current?.focus();
  }, [isCorrected]);

  if (!pokemon && !correcting) {
    const title = !result.isPokemonCard ? "That doesn’t look like a Pokémon card" : "We couldn’t identify the Pokémon";
    return (
      <div className="mt-8">
        <StateMessage
          tone="empty"
          title={title}
          actions={<button type="button" className="btn-primary" onClick={() => setCorrecting(true)}>Search by name instead</button>}
        >
          {result.verification === "not_found" && result.modelGuess
            ? `The scanner suggested “${result.modelGuess}”, but PokéAPI has no Pokémon by that name.`
            : result.verification === "unavailable"
              ? "We couldn’t reach PokéAPI to verify the result. Please try again."
              : "Try a sharper, well-lit photo with the whole card in frame."}
        </StateMessage>
      </div>
    );
  }

  const { card } = result;
  const rows: [string, string | null][] = [
    ["Card name", card.cardName],
    ["Card number", card.cardNumber],
    ["Set", card.setName],
  ];

  return (
    <div className="mt-8 space-y-4">
      {pokemon && (
        <div className="surface p-6 sm:flex sm:items-center sm:gap-8">
          <div className="relative mx-auto aspect-square w-48 shrink-0 sm:mx-0">
            <PokemonArtwork src={pokemon.artworkUrl} alt={`Official artwork of ${pokemon.displayName}`} sizes="192px" priority />
          </div>
          <div className="mt-4 text-center sm:mt-0 sm:text-left">
            <p className="eyebrow">{formatPokemonId(pokemon.id)}</p>
            <h2 ref={headingRef} tabIndex={-1} className="text-3xl font-black focus:outline-none">{pokemon.displayName}</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              {pokemon.types.map((t) => <PokemonTypeBadge key={t} type={t} />)}
            </div>
            <p className="mt-3 text-sm font-bold text-theme-ink">
              <span aria-hidden>✓ </span>{isCorrected ? "Chosen by you · data from PokéAPI" : "Species verified with PokéAPI"}
            </p>
            {!isCorrected && result.confidence !== "high" && (
              <p className="mt-1 text-sm text-ink-muted">
                The scanner wasn’t fully sure ({result.confidence} confidence). Please double-check.
              </p>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Link href={`/pokemon/${pokemon.name}`} className="btn-primary">View {pokemon.displayName}’s profile</Link>
              {hasAnimeAppearances(pokemon.speciesId) && (
                <Link href={`/journey?pokemon=${pokemon.speciesId}`} className="btn-primary">
                  <span aria-hidden>🎬</span> Build a Story Journey
                </Link>
              )}
              <SaveToCollectionButton key={pokemon.speciesId} speciesId={pokemon.speciesId} name={pokemon.displayName} />
              <button
                type="button"
                className="btn-secondary"
                aria-expanded={correcting}
                aria-controls="correction-form"
                onClick={() => setCorrecting((v) => !v)}
              >
                Not right?
              </button>
            </div>
          </div>
        </div>
      )}

      {pokemon && (
        <div className="surface p-6">
          <h3 className="text-xl font-black">{pokemon.displayName} in the anime</h3>
          <p className="mb-4 mt-1 text-sm text-ink-muted">Verified episodes from our curated, source-linked dataset.</p>
          <AnimeFeatured
            pokemonId={pokemon.speciesId}
            pokemonSlug={pokemon.name}
            displayName={pokemon.displayName}
            limit={2}
            showJourneyLink={false}
          />
        </div>
      )}

      {correcting && <CorrectionForm onPick={(p) => { onCorrect(p); setCorrecting(false); }} />}

      {!isCorrected && rows.some(([, v]) => v) && (
        <div className="surface p-6">
          <h3 className="font-extrabold">Read from the card</h3>
          <p className="text-sm text-ink-muted">Unverified: read by AI from your photo and may contain mistakes.</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="font-bold">{value ?? <span className="font-normal text-ink-muted">Not readable</span>}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function CorrectionForm({ onPick }: { onPick: (p: Pokemon) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Pokemon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // The form opens on user request ("Not right?"), so move focus into it.
  useEffect(() => inputRef.current?.focus(), []);

  function search(e: React.FormEvent) {
    e.preventDefault();
    setSearched(query);
    startTransition(async () => {
      const res = await searchPokemonForCorrection(query);
      if ("error" in res) { setError(res.error); setResults(null); }
      else { setError(null); setResults(res.pokemon); }
    });
  }

  return (
    <div id="correction-form" className="surface p-6">
      <h3 className="font-extrabold">Which Pokémon is it?</h3>
      <form onSubmit={search} role="search" aria-label="Correct the Pokémon" className="mt-3 flex flex-wrap gap-3">
        <input
          ref={inputRef}
          name="pokemon"
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={40}
          placeholder="Name or Pokédex number"
          aria-label="Pokémon name or Pokédex number"
          className="field min-w-[10rem] flex-1"
        />
        <button type="submit" className="btn-primary" disabled={pending || !query.trim()}>
          {pending ? "Searching…" : "Search"}
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
      <p role="status" className={results ? "mt-3 text-sm text-ink-muted" : "sr-only"}>
        {results ? (results.length === 0 ? `No Pokémon found for “${searched}”.` : `${results.length} Pokémon found. Choose one below.`) : ""}
      </p>
      {results && results.length > 0 && (
        <ul aria-label="Search results" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((p) => (
            <li key={p.name}>
              <button type="button" onClick={() => onPick(p)}
                className="surface flex min-h-11 w-full flex-col items-center p-3 transition hover:-translate-y-0.5 hover:shadow-lift">
                <span className="relative block aspect-square w-20">
                  <PokemonArtwork src={p.artworkUrl} alt="" sizes="80px" />
                </span>
                <span className="mt-1 text-sm font-bold">{p.displayName}</span>
                <span className="text-xs text-ink-muted">{formatPokemonId(p.id)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
