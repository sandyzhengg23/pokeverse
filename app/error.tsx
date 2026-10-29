"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StateMessage } from "@/components/StateMessage";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="px-5 py-20">
      <StateMessage
        tone="error"
        title="Something went wrong"
        actions={
          <>
            <button type="button" onClick={() => retry()} className="btn-primary">
              Try again
            </button>
            <Link href="/" className="btn-secondary">
              Go home
            </Link>
          </>
        }
      >
        We couldn’t load this page. PokéAPI may be busy or unreachable. Please try again in a moment.
      </StateMessage>
    </div>
  );
}
