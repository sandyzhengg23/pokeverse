/**
 * Pastel color theme for each of the 18 Pokémon types.
 *
 * This is the single source of truth for type colors. It is consumed by:
 *  - <TypeTheme>        → sets the page-wide CSS variables (background, accent)
 *  - <PokemonTypeBadge> → badge colors
 *  - <PokemonCard>      → per-card tint
 *
 * Roles:
 *  bg     very light page background
 *  soft   light tint for cards, badges and chips
 *  accent mid-tone pastel for decorative shapes and borders
 *  ink    dark shade of the same hue, used for text (≥ 4.5:1 on bg and soft)
 */
export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonTypeName = (typeof POKEMON_TYPES)[number];

export interface TypeTheme {
  bg: string;
  soft: string;
  accent: string;
  ink: string;
}

export const TYPE_THEMES: Record<PokemonTypeName, TypeTheme> = {
  normal: { bg: "#F7F3EB", soft: "#EBE3D3", accent: "#CFC4AA", ink: "#4A4232" },
  fire: { bg: "#FFF0E7", soft: "#FFD9C2", accent: "#FFB48A", ink: "#7A2E10" }, // peach
  water: { bg: "#EAF4FF", soft: "#CFE5FF", accent: "#9CC9F5", ink: "#1D4A7A" }, // baby blue
  electric: { bg: "#FFF9DE", soft: "#FFEEA6", accent: "#FFD94D", ink: "#5E4A00" }, // butter yellow
  grass: { bg: "#E9F8EE", soft: "#CDEFD6", accent: "#94D8A8", ink: "#1F5A33" }, // mint
  ice: { bg: "#E7F9FB", soft: "#C8EEF2", accent: "#8FD8E3", ink: "#14585F" },
  fighting: { bg: "#FCEAE7", soft: "#F6CCC5", accent: "#E89A8D", ink: "#7A2218" },
  poison: { bg: "#F4E9FA", soft: "#E3CCF2", accent: "#C79BE3", ink: "#542070" },
  ground: { bg: "#F8EFDD", soft: "#EBD9B2", accent: "#D6B877", ink: "#5E4310" },
  flying: { bg: "#EDF0FD", soft: "#D5DBF8", accent: "#A9B7F0", ink: "#2E3B8A" },
  psychic: { bg: "#FEE9F2", soft: "#F9CADF", accent: "#F29BC0", ink: "#80214F" },
  bug: { bg: "#F2F8DE", soft: "#E0EDB5", accent: "#BFD878", ink: "#46570F" },
  rock: { bg: "#F3EFE5", soft: "#E2DAC4", accent: "#C2B58D", ink: "#53491F" },
  ghost: { bg: "#EFEAF9", soft: "#D9CFF0", accent: "#B3A1DE", ink: "#43307A" },
  dragon: { bg: "#EAE9FE", soft: "#D2D0FA", accent: "#A29BF2", ink: "#342D91" },
  dark: { bg: "#EFE9F8", soft: "#D8CCEB", accent: "#B5A2D6", ink: "#3B2B5E" }, // lavender
  steel: { bg: "#EEF2F6", soft: "#D6DFE8", accent: "#AEBFCF", ink: "#34485B" },
  fairy: { bg: "#FEEBF4", soft: "#FBCFE4", accent: "#F5A6CB", ink: "#86285A" },
};

export function isPokemonType(value: string): value is PokemonTypeName {
  return (POKEMON_TYPES as readonly string[]).includes(value);
}

/** Falls back to "normal" for non-standard types (e.g. "stellar", "unknown"). */
export function getTypeTheme(type: string | undefined): TypeTheme {
  return type && isPokemonType(type) ? TYPE_THEMES[type] : TYPE_THEMES.normal;
}

/** CSS custom properties for a type, usable as an inline `style` object. */
export function typeThemeVars(type: string | undefined): Record<string, string> {
  const t = getTypeTheme(type);
  return {
    "--theme-bg": t.bg,
    "--theme-soft": t.soft,
    "--theme-accent": t.accent,
    "--theme-ink": t.ink,
  };
}
