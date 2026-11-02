import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 px-5 pb-10">
      <div className="mx-auto max-w-6xl border-t border-theme-ink/10 pt-8 text-sm text-ink-muted">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-lg font-black text-theme-ink">PokéVerse</p>
            <p>Every card has a story.</p>
          </div>
          <ul className="flex flex-wrap gap-x-6 font-bold text-theme-ink">
            <li>
              <Link href="/explore" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                Explore
              </Link>
            </li>
            <li>
              <Link href="/scan" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                Scan
              </Link>
            </li>
            <li>
              <Link href="/collection" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                Collection
              </Link>
            </li>
            <li>
              <Link href="/journey" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                Journey
              </Link>
            </li>
          </ul>
        </div>
        <p className="mt-8 max-w-3xl leading-relaxed">
          PokéVerse is an unofficial fan project and is not affiliated with Nintendo, Creatures
          Inc., GAME FREAK, or The Pokémon Company. Pokémon and Pokémon character names are
          trademarks of their respective owners. Pokémon data and artwork links are provided by{" "}
          <a
            href="https://pokeapi.co"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-theme-ink underline underline-offset-4"
          >
            PokéAPI
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
