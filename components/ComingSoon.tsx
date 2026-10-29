import Link from "next/link";

interface ComingSoonProps {
  icon: string;
  title: string;
  tagline: string;
  /** What this page will do. Honest roadmap items, not fake output. */
  plans: string[];
}

export function ComingSoon({ icon, title, tagline, plans }: ComingSoonProps) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
      <div className="surface px-6 py-12 text-center sm:px-12">
        <span aria-hidden className="text-5xl">
          {icon}
        </span>
        <p className="eyebrow mt-4">Coming in a later phase</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h1>
        <p className="mt-3 text-lg text-ink-muted">{tagline}</p>
        <ul className="mx-auto mt-8 max-w-md space-y-3 text-left">
          {plans.map((plan) => (
            <li key={plan} className="flex gap-3">
              <span aria-hidden className="mt-0.5 text-theme-ink/60">
                ✦
              </span>
              <span>{plan}</span>
            </li>
          ))}
        </ul>
        <Link href="/explore" className="btn-primary mt-10">
          Explore Pokémon meanwhile
        </Link>
      </div>
    </section>
  );
}
