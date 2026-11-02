import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ANNOUNCER_ID } from "@/components/Announce";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PokéVerse — Every Card Has a Story",
    template: "%s · PokéVerse",
  },
  description:
    "Discover the stories behind your Pokémon cards: scan a card to find the verified anime episodes behind the Pokémon on it, and follow an AI-planned, spoiler-aware viewing journey.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-white px-4 py-2 font-bold text-[#3f3358] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>

        {/* Soft decorative blobs. They use the theme accent, so they re-tint with the page. */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 top-24 size-80 rounded-full bg-theme-accent/30 blur-3xl transition-colors duration-700" />
          <div className="absolute -right-24 top-1/2 size-96 rounded-full bg-theme-accent/25 blur-3xl transition-colors duration-700" />
          <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-theme-soft/60 blur-3xl transition-colors duration-700" />
        </div>

        <div id={ANNOUNCER_ID} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />

        <Navbar />
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
