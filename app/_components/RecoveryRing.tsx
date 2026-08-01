"use client";

import { useEffect, useState } from "react";
import { useCountUp } from "./useCountUp";

type Band = "green" | "amber" | "red" | "muted";

export function RecoveryRing({
  score,
  band,
  label,
}: {
  score: number | null;
  band: Band;
  label: string;
}) {
  const size = 176;
  const stroke = 12;
  const c = size / 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  const color = band === "muted" ? "var(--muted)" : `var(--${band})`;
  const pct = score ?? 0;

  const [swept, setSwept] = useState(false);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSwept(true);
      return;
    }
    const id = requestAnimationFrame(() => setSwept(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const shown = useCountUp(score, { duration: 1000 });
  const offset = circumference * (1 - (swept ? pct : 0) / 100);

  return (
    <svg
      className="rec-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Recovery ${score ?? "unknown"} percent, ${label}`}
    >
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
      />
      <text x={c} y={c - 2} textAnchor="middle" className="ring-num" fill={color}>
        {shown ?? "—"}
        {score !== null && <tspan className="ring-pct">%</tspan>}
      </text>
      <text x={c} y={c + 24} textAnchor="middle" className="ring-label" fill={color}>
        {label}
      </text>
    </svg>
  );
}
