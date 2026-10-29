function SkeletonCard() {
  return (
    <div className="surface animate-pulse p-4" aria-hidden>
      <div className="mx-auto aspect-square w-3/4 rounded-full bg-theme-soft/70" />
      <div className="mt-4 h-3 w-12 rounded-full bg-theme-soft" />
      <div className="mt-2 h-5 w-28 rounded-full bg-theme-soft" />
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-theme-soft" />
        <div className="h-6 w-16 rounded-full bg-theme-soft" />
      </div>
    </div>
  );
}

export function PokemonGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading Pokémon">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <SkeletonCard />
          </li>
        ))}
      </ul>
    </div>
  );
}
