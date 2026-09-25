import "../dashboard.css";
import type {
  Readout,
  TrendPoint,
  RunSummary,
  LiftSummary,
  Readiness,
  ZoneMix as ZoneMixData,
  Taper,
  Efficiency,
} from "@/lib/dashboard";
import { TrendChart } from "./TrendChart";
import { RecoveryRing } from "./RecoveryRing";
import { StatTile } from "./StatTile";
import { ThemeToggle } from "./ThemeToggle";
import { CmdkButton } from "./CmdkButton";
import { CommandPalette } from "./CommandPalette";
import { ZoneMix } from "./ZoneMix";
import { TaperCard } from "./TaperCard";
import { ReadinessCard } from "./ReadinessCard";
import { EfficiencyChart } from "./EfficiencyChart";

export type DashboardData = {
  readout: Readout;
  trend: TrendPoint[];
  runs: RunSummary[];
  lifts: LiftSummary[];
  readiness: Readiness;
  lastSync: Date | null;
  zoneMix: ZoneMixData;
  taper: Taper;
  efficiency: Efficiency;
};

function recoveryBand(score: number | null): {
  key: "green" | "amber" | "red" | "muted";
  label: string;
} {
  if (score === null) return { key: "muted", label: "No score" };
  if (score >= 80) return { key: "green", label: "High" };
  if (score >= 60) return { key: "amber", label: "Moderate" };
  return { key: "red", label: "Low" };
}

function todaysCall(key: string): string {
  if (key === "green") return "Green light. Good day for your long run or a hard lift.";
  if (key === "amber") return "Moderate. An easy Zone 2 run or a lighter lift fits. Hold off on max efforts.";
  if (key === "red") return "Low. Keep it to a walk or full rest and protect tonight's sleep.";
  return "No recovery score yet for today. Check back after your next sync.";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

const TAPER_WINDOW_DAYS = 21;

export function DashboardView({
  data,
  name,
  banner,
  demo = false,
}: {
  data: DashboardData;
  name: string;
  banner?: React.ReactNode;
  demo?: boolean;
}) {
  const { readout, trend, runs, lifts, readiness, lastSync, zoneMix, taper, efficiency } =
    data;

  const band = recoveryBand(readout.recoveryScore);

  return (
    <div className="wrap">
      <CommandPalette demo={demo} />
      {banner}
      <div className="inner">
        <div className="topbar">
          <div className="brand">
            <span className="brand-dot" /> WHOOP · Dashboard
          </div>
          <div className="topbar-actions">
            <CmdkButton />
            <ThemeToggle />
          </div>
        </div>

        <div className="row-between">
          <div>
            <div className="eyebrow">
              {taper.daysToRace <= 21
                ? `${taper.daysToRace} ${taper.daysToRace === 1 ? "day" : "days"} to race day`
                : `${readiness.weeksToRace} weeks to race day`}{" "}
              · {taper.raceDateLabel}
            </div>
            <h1 className="h1">Good morning, {name}</h1>
            <div className="sub">Data through {formatDate(readout.date)}</div>
          </div>
          {lastSync && (
            <div className="chip">
              <span className="dot" /> Synced{" "}
              {lastSync.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>

        <div id="today" className="section-label">Today</div>
        <div className="today">
          <div className="card rec-card fade-up">
            <RecoveryRing
              score={readout.recoveryScore}
              band={band.key}
              label={band.label}
            />
          </div>

          <div className="tiles">
            <StatTile
              icon="heart"
              label="HRV"
              value={readout.hrv}
              unit="ms"
              delta={readout.deltas.hrv}
              higherIsBetter
              index={0}
            />
            <StatTile
              icon="activity"
              label="Resting HR"
              value={readout.restingHeartRate}
              unit="bpm"
              delta={readout.deltas.restingHeartRate}
              higherIsBetter={false}
              index={1}
            />
            <StatTile
              icon="moon"
              label="Sleep"
              value={readout.sleep?.durationMinutes ?? null}
              kind="duration"
              secondary={
                readout.sleep?.performancePct != null
                  ? `${readout.sleep.performancePct}%`
                  : null
              }
              delta={readout.deltas.sleepMinutes}
              deltaKind="duration"
              higherIsBetter
              index={2}
            />
            <StatTile
              icon="flame"
              label="Strain"
              value={readout.dayStrain}
              kind="decimal1"
              index={3}
            />
          </div>
        </div>

        <div className="call fade-up">
          <b>Today&apos;s call.</b> {todaysCall(band.key)}
        </div>

        <TrendChart data={trend} />

        <EfficiencyChart data={efficiency} />

        <div id="training" className="two" style={{ marginTop: 14 }}>
          <div>
            <div className="section-label" style={{ marginTop: 16 }}>Recent runs</div>
            <div className="card">
              {runs.length === 0 ? (
                <div className="run-meta">No runs in range yet.</div>
              ) : (
                runs.map((r, i) => (
                  <div className="list-row" key={i}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)" }}>
                        {r.distanceMiles !== null ? `${r.distanceMiles.toFixed(1)} mi` : "Run"}{" "}
                        {r.isLong && <span className="pill long">long</span>}
                      </div>
                      <div className="run-meta">
                        {r.date}
                        {r.pacePerMile && ` · ${r.pacePerMile}/mi`}
                        {r.avgHr && ` · ${r.avgHr} bpm`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="section-label">Recent lifts</div>
            <div className="card">
              {lifts.length === 0 ? (
                <div className="run-meta">No lifts in range yet.</div>
              ) : (
                lifts.map((l, i) => (
                  <div className="lift" key={i}>
                    <div className="t">{l.date}</div>
                    <div className="n">
                      {l.durationMinutes} min
                      {l.strain !== null && <small> · strain {l.strain.toFixed(1)}</small>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <ZoneMix data={zoneMix} />
          </div>

          <div id="race">
            {taper.daysToRace <= TAPER_WINDOW_DAYS && <TaperCard data={taper} />}

            <ReadinessCard data={readiness} />
          </div>
        </div>

        <div className="muted-note">
          Live data from your WHOOP sync · press ⌘K for actions
        </div>
      </div>
    </div>
  );
}
