"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

const NAV_ITEMS = [
  { href: "/explore", label: "Explore" },
  { href: "/scan", label: "Scan" },
  { href: "/collection", label: "Collection" },
  { href: "/journey", label: "Journey" },
] as const;

function NavList({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string | null;
  onNavigate?: () => void;
  className: string;
}) {
  return (
    <ul className={className}>
      {NAV_ITEMS.map(({ href, label }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`block rounded-full px-4 py-2 text-sm font-bold transition duration-200 ${
                active ? "bg-theme-ink text-white" : "hover:bg-theme-soft"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Reads the URL, so it must sit inside <Suspense> (see Navbar). */
function ActiveNavList(props: { onNavigate?: () => void; className: string }) {
  return <NavList pathname={usePathname()} {...props} />;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  // Fallback renders the same links without the active highlight, so the
  // static shell is never missing its navigation.
  const desktopClass = "hidden items-center gap-1 md:flex";
  const mobileClass = "flex flex-col gap-1 p-3";

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <nav
        aria-label="Main"
        className="surface relative mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6"
      >
        <Link href="/" onClick={close} className="flex items-center gap-2.5 text-xl font-black">
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-blush via-lavender to-sky text-base shadow-soft"
          >
            ✦
          </span>
          PokéVerse
        </Link>

        <Suspense fallback={<NavList pathname={null} className={desktopClass} />}>
          <ActiveNavList className={desktopClass} />
        </Suspense>

        <button
          type="button"
          className="btn-secondary !min-h-10 !px-4 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>

        {open && (
          <div
            id="mobile-menu"
            className="surface absolute inset-x-0 top-full mt-2 animate-pop-in bg-white/95 md:hidden"
          >
            <Suspense fallback={<NavList pathname={null} className={mobileClass} />}>
              <ActiveNavList onNavigate={close} className={mobileClass} />
            </Suspense>
          </div>
        )}
      </nav>
    </header>
  );
}
