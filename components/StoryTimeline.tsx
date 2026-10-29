import type { ReactNode } from "react";

export interface TimelineItem {
  id: string;
  /** Small label above the content, e.g. "Stage 1". */
  label: string;
  content: ReactNode;
}

/**
 * Generic vertical timeline. Used for evolution lines now, and intended for
 * AI-planned viewing journeys later (each journey step becomes an item).
 */
export function StoryTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-8 border-l-2 border-dashed border-theme-accent pl-8">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden
            className="absolute -left-[41px] top-0.5 size-4 rounded-full border-4 border-theme-bg bg-theme-ink"
          />
          <p className="eyebrow mb-3">{item.label}</p>
          {item.content}
        </li>
      ))}
    </ol>
  );
}
