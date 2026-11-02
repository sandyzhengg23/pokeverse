"use client";

import Image from "next/image";
import { useState } from "react";

interface PokemonArtworkProps {
  src: string | null;
  alt: string;
  /** Passed to next/image so the browser downloads an appropriately sized file. */
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * Official artwork with a graceful fallback. Falls back when PokéAPI has no
 * artwork (src is null) or the image fails to load. Fills its parent, so the
 * parent decides the size (e.g. `relative aspect-square`).
 */
export function PokemonArtwork({ src, alt, sizes, priority, className = "" }: PokemonArtworkProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    // alt="" means the artwork is decorative here (the Pokémon is named in adjacent text),
    // so the placeholder is hidden from assistive tech too.
    const decorative = alt === "";
    return (
      <div
        {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": `${alt} (artwork unavailable)` })}
        className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-full bg-white/50 text-theme-ink"
      >
        <span aria-hidden className="text-3xl font-black">
          ?
        </span>
        <span className="text-xs font-bold">Artwork unavailable</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailedSrc(src)}
      className={`object-contain drop-shadow-[0_10px_14px_rgba(63,51,88,0.18)] transition duration-300 ${className}`}
    />
  );
}
