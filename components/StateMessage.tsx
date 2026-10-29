import type { ReactNode } from "react";

interface StateMessageProps {
  tone: "empty" | "error";
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}

/** Shared empty / error panel so every page reports problems the same way. */
export function StateMessage({ tone, title, children, actions }: StateMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="surface mx-auto flex max-w-lg flex-col items-center gap-3 px-6 py-10 text-center"
    >
      <span aria-hidden className="text-4xl">
        {tone === "error" ? "🫧" : "🔍"}
      </span>
      <h2 className="text-xl font-extrabold">{title}</h2>
      {children && <div className="text-ink-muted">{children}</div>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}
