import Link from "next/link";
import { StateMessage } from "@/components/StateMessage";

export default function NotFound() {
  return (
    <div className="px-5 py-20">
      <StateMessage
        tone="empty"
        title="We couldn’t find that page"
        actions={
          <Link href="/explore" className="btn-primary">
            Search Pokémon
          </Link>
        }
      >
        The Pokémon or page you’re looking for doesn’t exist. Try searching by name or Pokédex number.
      </StateMessage>
    </div>
  );
}
