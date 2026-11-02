// Automated WCAG 2.2 contrast check for every Pokémon type theme.
// Usage: npm run test:contrast   (exits 1 if any pair fails)
//
// It checks the colour pairs the UI actually renders (see globals.css and the
// components), blending translucent layers like `bg-white/70` over the theme
// background first. This verifies colour values only; it cannot see real
// rendered pages, so it complements (not replaces) the axe browser tests.
import { TYPE_THEMES } from "../lib/theme/type-themes.ts";

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const WHITE = [255, 255, 255];
const MUTED = hex("#5b5373"); // --ink-muted (fixed, used on every theme)
const BUTTER = hex("#fff0b3");
const BUTTER_INK = hex("#5e4a00");

const failures = [];
let checked = 0;
function check(theme, label, fg, bg, min = 4.5) {
  const r = ratio(fg, bg);
  checked++;
  if (r < min) failures.push(`${theme.padEnd(9)} ${label.padEnd(52)} ${r.toFixed(2)} < ${min}`);
}

for (const [name, t] of Object.entries(TYPE_THEMES)) {
  const bg = hex(t.bg), soft = hex(t.soft), ink = hex(t.ink);
  const card = mix(WHITE, bg, 0.7); // .surface (bg-white/70)
  const pill = mix(WHITE, bg, 0.8); // bg-white/80 chips
  const butterOnBg = mix(BUTTER, bg, 0.7);

  // Body text
  check(name, "ink on page bg", ink, bg);
  check(name, "ink on soft", ink, soft);
  check(name, "ink on surface card", ink, card);
  check(name, "ink on white chip", ink, pill);
  // Muted text (--ink-muted is theme-independent)
  check(name, "muted on page bg", MUTED, bg);
  check(name, "muted on soft", MUTED, soft);
  check(name, "muted on surface card", MUTED, card);
  check(name, "muted on white chip", MUTED, pill);
  check(name, "muted on white/60 tile", MUTED, mix(WHITE, bg, 0.6));
  // Inverted (primary buttons, selected chips)
  check(name, "white on ink (btn-primary, selected chip)", WHITE, ink);
  // Card id label (opacity-70 in PokemonCard) on soft
  check(name, "ink on soft (card #id label, full opacity)", ink, soft);
  // Badge
  check(name, "badge ink on soft", ink, soft);
  // Non-text contrast (1.4.11, 3:1): text-input boundary, focus ring, selected border
  check(name, "input border ink/70 on white", mix(ink, WHITE, 0.7), WHITE, 3);
  check(name, "search field border ink/70 on bg", mix(ink, bg, 0.7), bg, 3);
  check(name, "focus outline ink on page bg", ink, bg, 3);
  check(name, "focus outline ink on soft", ink, soft, 3);
  check(name, "unselected tile dashed border ink/70 on bg", mix(ink, bg, 0.7), bg, 3);
  // Fixed-colour notices
  check(name, "notice #5e4a00 on butter/70", BUTTER_INK, butterOnBg);
}
check("fixed", "#5e4a00 on butter (Coming soon / Legendary badge)", BUTTER_INK, BUTTER);
check("fixed", "#3f3358 on white (skip link)", hex("#3f3358"), WHITE);

if (failures.length) {
  console.error(`✗ ${failures.length} contrast failure(s) of ${checked} checks:\n` + failures.join("\n"));
  process.exit(1);
}
console.log(`✓ All ${checked} contrast checks pass across ${Object.keys(TYPE_THEMES).length} type themes.`);
