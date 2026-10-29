import { getTypeTheme } from "@/lib/theme/type-themes";

/**
 * Re-themes the whole page for a Pokémon type. Render it anywhere in a page:
 *
 *   <TypeTheme type="electric" />
 *
 * It emits a <style> that overrides the --theme-* variables on :root. They are
 * server-rendered (no flash of the default theme), and removed again when the
 * user navigates to a page that doesn't render <TypeTheme>. The body's CSS
 * transition (globals.css) turns each change into a smooth color fade.
 */
export function TypeTheme({ type }: { type: string | undefined }) {
  const t = getTypeTheme(type);
  return (
    <style>{`:root{--theme-bg:${t.bg};--theme-soft:${t.soft};--theme-accent:${t.accent};--theme-ink:${t.ink};}`}</style>
  );
}
