"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { TrendPoint } from "@/lib/dashboard";

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [tab, setTab] = useState<"hrv" | "rec">("hrv");
  const [, forceTheme] = useState(0);

  useEffect(() => {
    const bump = () => forceTheme((n) => n + 1);
    window.addEventListener("themechange", bump);
    return () => window.removeEventListener("themechange", bump);
  }, []);

  const axisTick = { fontSize: 11, fill: "var(--axis)", fontFamily: "var(--fd)" };

  return (
    <section id="trends" className="fade-up">
      <div className="row-between" style={{ alignItems: "center", marginTop: 34 }}>
        <div className="section-label" style={{ margin: 0 }}>
          14-day trend
        </div>
        <div className="tabs" role="tablist" aria-label="Trend metric">
          <button
            role="tab"
            aria-selected={tab === "hrv"}
            className={`tab-btn ${tab === "hrv" ? "on" : ""}`}
            onClick={() => setTab("hrv")}
          >
            HRV &amp; RHR
          </button>
          <button
            role="tab"
            aria-selected={tab === "rec"}
            className={`tab-btn ${tab === "rec" ? "on" : ""}`}
            onClick={() => setTab("rec")}
          >
            Recovery
          </button>
        </div>
      </div>

      <div className="legend">
        {tab === "hrv" ? (
          <>
            <span className="legend-item">
              <i style={{ background: "var(--chart-hrv)" }} /> HRV
            </span>
            <span className="legend-item">
              <i style={{ background: "var(--chart-rhr)" }} /> Resting HR
            </span>
          </>
        ) : (
          <span className="legend-item">
            <i style={{ background: "var(--chart-rec)" }} /> Recovery %
          </span>
        )}
      </div>

      <div className="card chart-card">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 8, right: 14, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="date" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis tick={axisTick} tickLine={false} axisLine={false} width={34} />
            <Tooltip
              cursor={{ stroke: "var(--border-strong)" }}
              contentStyle={{
                fontFamily: "var(--fd)",
                fontSize: 12,
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--surface-solid)",
                color: "var(--ink)",
              }}
            />
            {tab === "hrv" ? (
              <>
                <Line type="monotone" dataKey="hrv" name="HRV" stroke="var(--chart-hrv)" strokeWidth={2.2} dot={{ r: 2.5 }} connectNulls />
                <Line type="monotone" dataKey="rhr" name="RHR" stroke="var(--chart-rhr)" strokeWidth={2.2} dot={{ r: 2.5 }} connectNulls />
              </>
            ) : (
              <Line type="monotone" dataKey="rec" name="Recovery" stroke="var(--chart-rec)" strokeWidth={2.4} dot={{ r: 2.5 }} connectNulls />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
