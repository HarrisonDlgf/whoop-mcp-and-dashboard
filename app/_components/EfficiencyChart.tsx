"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Efficiency, EfficiencyPoint } from "@/lib/dashboard";

type TooltipPayload = { payload: EfficiencyPoint }[];

function EfficiencyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload;
}) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="ef-tip">
      <div className="ef-tip-head">
        {p.miles} mi · {p.date}
      </div>
      <div className="ef-tip-row">
        {p.pacePerMile}/mi at {p.avgHr} bpm
      </div>
      <div className="ef-tip-row">
        efficiency {p.ef.toFixed(2)} {p.easy && <span className="pill long">easy run</span>}
      </div>
    </div>
  );
}

export function EfficiencyChart({ data }: { data: Efficiency }) {
  const [easyOnly, setEasyOnly] = useState(false);
  const [, forceTheme] = useState(0);

  useEffect(() => {
    const bump = () => forceTheme((n) => n + 1);
    window.addEventListener("themechange", bump);
    return () => window.removeEventListener("themechange", bump);
  }, []);

  const points = easyOnly ? data.points.filter((p) => p.easy) : data.points;
  const axisTick = { fontSize: 11, fill: "var(--axis)", fontFamily: "var(--fd)" };

  if (data.points.length === 0) {
    return (
      <section id="efficiency" className="fade-up">
        <div className="section-label" style={{ marginTop: 34 }}>Aerobic efficiency</div>
        <div className="card">
          <div className="run-meta">
            No runs with both distance and heart rate in range yet.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="efficiency" className="fade-up">
      <div className="row-between" style={{ alignItems: "center", marginTop: 34 }}>
        <div className="section-label" style={{ margin: 0 }}>
          Aerobic efficiency
        </div>
        <div className="tabs" role="tablist" aria-label="Run filter">
          <button
            role="tab"
            aria-selected={!easyOnly}
            className={`tab-btn ${!easyOnly ? "on" : ""}`}
            onClick={() => setEasyOnly(false)}
          >
            All runs
          </button>
          <button
            role="tab"
            aria-selected={easyOnly}
            className={`tab-btn ${easyOnly ? "on" : ""}`}
            onClick={() => setEasyOnly(true)}
          >
            Easy only
          </button>
        </div>
      </div>

      <div className="ef-head">
        <span className="ef-note">
          Metres per minute per heart beat. Higher means the same effort is
          buying more speed.
        </span>
        {data.changePct !== null && (
          <span
            className="ef-change"
            style={{ color: data.changePct >= 0 ? "var(--good)" : "var(--bad)" }}
          >
            {data.changePct >= 0 ? "▲" : "▼"} {Math.abs(data.changePct).toFixed(1)}% over the window
          </span>
        )}
      </div>

      <div className="card chart-card">
        {points.length === 0 ? (
          <div className="run-meta">No easy runs in range. Zone data marks a run easy at 70% or more in zones 1–2.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={points} margin={{ top: 8, right: 14, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                interval={Math.max(0, Math.ceil(points.length / 7) - 1)}
              />
              <YAxis
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={["dataMin - 0.1", "dataMax + 0.1"]}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
              <Tooltip cursor={{ stroke: "var(--border-strong)" }} content={<EfficiencyTooltip />} />
              <Line
                type="monotone"
                dataKey="ef"
                stroke="var(--chart-hrv)"
                strokeWidth={2.2}
                dot={{ r: 2.5 }}
                connectNulls
              />
              <Scatter dataKey="ef" fill="var(--accent)" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
