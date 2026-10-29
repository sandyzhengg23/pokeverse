import Link from "next/link";

interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  icon: string;
  /** Tailwind background class for the icon bubble, e.g. "bg-mint". */
  tint: string;
  comingSoon?: boolean;
}

export function FeatureCard({ href, title, description, icon, tint, comingSoon }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="surface group flex h-full flex-col gap-3 p-6 transition duration-300 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <span
        aria-hidden
        className={`flex size-14 items-center justify-center rounded-2xl text-2xl transition duration-300 group-hover:rotate-6 group-hover:scale-110 ${tint}`}
      >
        {icon}
      </span>
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-extrabold">{title}</h3>
        {comingSoon && (
          <span className="rounded-full bg-butter px-2.5 py-0.5 text-[11px] font-extrabold text-[#5e4a00]">
            Coming soon
          </span>
        )}
      </div>
      <p className="text-ink-muted">{description}</p>
      <span className="mt-auto pt-2 text-sm font-bold underline-offset-4 group-hover:underline">
        {comingSoon ? "Peek at the plan" : "Start exploring"} →
      </span>
    </Link>
  );
}
