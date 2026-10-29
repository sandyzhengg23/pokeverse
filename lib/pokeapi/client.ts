const BASE_URL = "https://pokeapi.co/api/v2";
const REQUEST_TIMEOUT_MS = 8000;

export class PokeApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "PokeApiError";
  }
}

/** Public sprites repo used by PokéAPI. Hotlinked, never copied into this repo. */
export function officialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/**
 * Low-level GET against PokéAPI v2.
 *  - 404 → resolves to `null` ("not found" is an expected outcome)
 *  - any other failure (network, timeout, 5xx) → throws PokeApiError
 *
 * Caching is applied by the callers in `pokemon.ts` with `'use cache'`, so the
 * result of this function never needs its own cache layer.
 */
export async function pokeApiFetch<T>(path: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new PokeApiError(
      `Could not reach PokéAPI (${cause instanceof Error ? cause.message : "network error"})`,
    );
  }

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new PokeApiError(`PokéAPI responded with ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}
