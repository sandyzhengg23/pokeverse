/**
 * Server-side card scanner: Muse Spark reads the image, PokéAPI verifies the species.
 */
import { PokeApiError } from "@/lib/pokeapi/client";
import { getPokemon } from "@/lib/pokeapi/pokemon";
import { generateTextFromImage, MetaAIError } from "./meta-client";
import {
  parseModelReading,
  PROMPT,
  toPokeApiSlug,
  type ScanResult,
  type SpeciesVerification,
} from "./card-scan";
import type { Pokemon } from "@/lib/pokeapi/types";

export async function scanCard(image: { mimeType: string; bytes: Uint8Array }): Promise<ScanResult> {
  const reply = await generateTextFromImage(PROMPT, image, { timeoutMs: 45_000, maxOutputTokens: 2000 });

  const reading = parseModelReading(reply.text);
  if (!reading) {
    throw new MetaAIError("The model's answer couldn't be understood.", 502, "empty_response");
  }

  let verification: SpeciesVerification = "none";
  let pokemon: Pokemon | null = null;

  if (reading.pokemonName) {
    const slug = toPokeApiSlug(reading.pokemonName);
    try {
      pokemon = slug ? await getPokemon(slug) : null;
      verification = pokemon ? "verified" : "not_found";
    } catch (err) {
      if (!(err instanceof PokeApiError)) throw err;
      verification = "unavailable";
    }
  }

  return {
    isPokemonCard: reading.isPokemonCard,
    confidence: reading.confidence,
    modelGuess: reading.pokemonName,
    verification,
    pokemon,
    card: { cardName: reading.cardName, cardNumber: reading.cardNumber, setName: reading.setName },
  };
}
