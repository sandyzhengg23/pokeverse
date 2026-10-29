"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useTransition } from "react";

const DEBOUNCE_MS = 350;

function SearchField({ pending, children }: { pending?: boolean; children: React.ReactNode }) {
  return (
    <div
      role="search"
      aria-busy={pending}
      className="surface relative mx-auto flex max-w-xl items-center gap-2 p-2 pl-5 focus-within:ring-4 focus-within:ring-theme-accent/60"
    >
      {children}
    </div>
  );
}

function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const urlQuery = useSearchParams().get("q") ?? "";

  const [value, setValue] = useState(urlQuery);
  const [focused, setFocused] = useState(false);
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keep the box in sync when the URL changes from outside (back/forward, a
  // "clear search" link) — but never overwrite what the user is typing.
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    if (!focused) setValue(urlQuery);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function go(next: string) {
    clearTimeout(timer.current);
    const q = next.trim();
    startTransition(() => {
      router.replace(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false });
    });
  }

  function onChange(next: string) {
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => go(next), DEBOUNCE_MS);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
    >
      <SearchField pending={isPending}>
        <label htmlFor="pokemon-search" className="sr-only">
          Search Pokémon by name or Pokédex number
        </label>
        <span aria-hidden>🔎</span>
        <input
          id="pokemon-search"
          name="q"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Try “pikachu”, “eevee” or 25"
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent py-2 text-base font-semibold text-theme-ink outline-none placeholder:font-medium placeholder:text-ink-muted/70"
        />
        {isPending && (
          <span
            aria-hidden
            className="size-5 animate-spin rounded-full border-2 border-theme-ink/20 border-t-theme-ink"
          />
        )}
        {value && (
          <button
            type="button"
            className="btn-secondary !min-h-10 !px-4"
            onClick={() => {
              setValue("");
              go("");
            }}
          >
            Clear
          </button>
        )}
        <button type="submit" className="btn-primary !min-h-10">
          Search
        </button>
      </SearchField>
    </form>
  );
}

/**
 * Search box that stores the query in the URL (`/explore?q=pika`), so results
 * are shareable and the server page can render them. Typing updates the URL
 * after a short pause; Enter / "Search" updates it immediately.
 */
export function PokemonSearch() {
  return (
    <Suspense
      fallback={
        <SearchField>
          <span aria-hidden>🔎</span>
          <span className="flex-1 py-2 font-medium text-ink-muted/70">Loading search…</span>
        </SearchField>
      }
    >
      <SearchInput />
    </Suspense>
  );
}
