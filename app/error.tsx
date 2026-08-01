"use client";

import { useEffect } from "react";
import "./dashboard.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard failed to render:", error);
  }, [error]);

  return (
    <div className="wrap">
      <div className="inner empty">
        <h2>Couldn&apos;t load your dashboard</h2>
        <p>
          The data didn&apos;t come back. Usually that means the database was
          briefly unreachable or your WHOOP connection needs re-authorizing.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn" onClick={reset}>
            Try again
          </button>
          <a
            className="btn"
            style={{ background: "var(--ink-soft)" }}
            href="/api/whoop/login"
          >
            Reconnect WHOOP
          </a>
        </div>
      </div>
    </div>
  );
}
