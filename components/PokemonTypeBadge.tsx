import { getTypeTheme } from "@/lib/theme/type-themes";

export function PokemonTypeBadge({ type }: { type: string }) {
  const t = getTypeTheme(type);
  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold tracking-wide capitalize"
      style={{ backgroundColor: t.soft, color: t.ink, borderColor: t.accent }}
    >
      <span className="sr-only">Type: </span>
      {type}
    </span>
  );
}
