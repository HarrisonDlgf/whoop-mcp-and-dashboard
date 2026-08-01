"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  SunMoon,
  RefreshCw,
  Plug,
  Activity,
  Moon,
  Flame,
  Trophy,
} from "lucide-react";
import { toggleTheme } from "./theme";

type Command = {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ size?: number }>;
  run: () => void;
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(
    () => [
      { id: "theme", label: "Toggle light / dark", hint: "Theme", icon: SunMoon, run: () => toggleTheme() },
      { id: "sync", label: "Sync now", hint: "Pull latest from WHOOP", icon: RefreshCw, run: async () => {
          try { await fetch("/api/whoop/backfill", { method: "POST" }); } finally { location.reload(); }
        } },
      { id: "reconnect", label: "Reconnect WHOOP", hint: "Re-authorize", icon: Plug, run: () => { location.href = "/api/whoop/login"; } },
      { id: "today", label: "Jump to today", hint: "Readout", icon: Activity, run: () => scrollToId("today") },
      { id: "trends", label: "Jump to trends", hint: "14-day", icon: Moon, run: () => scrollToId("trends") },
      { id: "training", label: "Jump to training", hint: "Runs & lifts", icon: Flame, run: () => scrollToId("training") },
      { id: "race", label: "Jump to race prep", hint: "Aug 16", icon: Trophy, run: () => scrollToId("race") },
    ],
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q),
    );
  }, [commands, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const runAt = useCallback(
    (i: number) => {
      const cmd = results[i];
      if (!cmd) return;
      close();
      cmd.run();
    },
    [results, close],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-cmdk", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-cmdk", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={close} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input">
          <Search size={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command…"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); runAt(active); }
            }}
          />
          <kbd className="cmdk-esc">esc</kbd>
        </div>
        <div className="cmdk-list">
          {results.length === 0 && <div className="cmdk-empty">No matches</div>}
          {results.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                className={`cmdk-item ${i === active ? "on" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => runAt(i)}
              >
                <Icon size={16} />
                <span className="cmdk-label">{c.label}</span>
                <span className="cmdk-hint">{c.hint}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
