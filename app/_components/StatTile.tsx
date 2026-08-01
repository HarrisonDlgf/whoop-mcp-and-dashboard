"use client";

import { Heart, Activity, Moon, Flame, type LucideIcon } from "lucide-react";
import { useCountUp } from "./useCountUp";

const ICONS: Record<string, LucideIcon> = {
  heart: Heart,
  activity: Activity,
  moon: Moon,
  flame: Flame,
};

type Kind = "int" | "duration" | "decimal1";

function format(value: number, kind: Kind): string {
  if (kind === "duration") {
    const h = Math.floor(value / 60);
    const m = Math.round(value % 60);
    return `${h}:${m.toString().padStart(2, "0")}`;
  }
  if (kind === "decimal1") return value.toFixed(1);
  return Math.round(value).toString();
}

export function StatTile({
  icon,
  label,
  value,
  kind = "int",
  unit,
  secondary,
  delta,
  deltaKind = "int",
  higherIsBetter = true,
  index = 0,
}: {
  icon: keyof typeof ICONS;
  label: string;
  value: number | null;
  kind?: Kind;
  unit?: string;
  secondary?: string | null;
  delta?: number | null;
  deltaKind?: Kind;
  higherIsBetter?: boolean;
  index?: number;
}) {
  const Icon = ICONS[icon];
  const counted = useCountUp(value, { decimals: kind === "decimal1" ? 1 : 0 });

  const hasDelta = delta != null && Math.abs(delta) >= (kind === "int" ? 1 : 0.05);
  const positive = (delta ?? 0) > 0;
  const good = positive === higherIsBetter;

  return (
    <div className="tile fade-up" style={{ animationDelay: `${index * 45}ms` }}>
      <div className="lab">
        <Icon size={14} /> {label}
      </div>
      <div className="val">
        {counted !== null ? format(counted, kind) : "—"}
        {value !== null && unit && <small> {unit}</small>}
        {value !== null && secondary && <small> · {secondary}</small>}
      </div>
      {hasDelta && (
        <div
          className="delta"
          style={{ color: good ? "var(--good)" : "var(--bad)" }}
          title="vs 7-day average"
        >
          {positive ? "▲" : "▼"} {format(Math.abs(delta as number), deltaKind)}
          {deltaKind === "duration" ? "" : unit ? ` ${unit}` : ""}
          <span className="delta-note">7d</span>
        </div>
      )}
    </div>
  );
}
