import "./dashboard.css";
import {
  getLatestReadout,
  getTrend,
  getRecentRuns,
  getRecentLifts,
  getRacePrep,
  getLastSync,
} from "@/lib/dashboard";
import { TrendChart } from "./_components/TrendChart";
import { RecoveryRing } from "./_components/RecoveryRing";
import { StatTile } from "./_components/StatTile";
import { ThemeToggle } from "./_components/ThemeToggle";
import { CmdkButton } from "./_components/CmdkButton";
import { CommandPalette } from "./_components/CommandPalette";

export const dynamic = "force-dynamic";

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

export default async function Dashboard() {
  const [readout, trend, runs, lifts, racePrep, lastSync] = await Promise.all([
    getLatestReadout(),
    getTrend(14),
    getRecentRuns(4),
    getRecentLifts(3),
    getRacePrep(5),
    getLastSync(),
  ]);

  if (!readout) {
    return (
      <div className="wrap">
        <div className="inner empty">
          <h2>No WHOOP data yet</h2>
          <p>
            Connect your WHOOP account and run a first sync, then your morning
            readout, trends, and training show up here.
          </p>
          <a className="btn" href="/api/whoop/login">
            Connect WHOOP
          </a>
        </div>
      </div>
    );
  }

  const band = recoveryBand(readout.recoveryScore);
  const completion =
    racePrep.windowWeeks > 0 ? racePrep.weeksWithLongRun / racePrep.windowWeeks : 0;
  const completionSlipping = completion < 0.6;

  return (
    <div className="wrap">
      <CommandPalette />
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
            <div className="eyebrow">{racePrep.weeksToRace} weeks to race day · Aug 16</div>
            <h1 className="h1">Good morning, Harrison</h1>
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
          </div>

          <div id="race">
            <div className="section-label" style={{ marginTop: 16 }}>Race prep</div>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Long-run completion</span>
                <span style={{ fontFamily: "var(--fd)", fontWeight: 600, color: "var(--ink)" }}>
                  {racePrep.weeksWithLongRun} of {racePrep.windowWeeks} weeks
                </span>
              </div>
              <div className="bar">
                <i
                  style={{
                    width: `${completion * 100}%`,
                    background: completionSlipping ? "var(--amber)" : "var(--accent)",
                  }}
                />
              </div>
              {completionSlipping && (
                <div className="warn">
                  <span className="wt">
                    Completion is slipping. The long run is the one session that
                    builds the race. Protect this week&apos;s.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="muted-note">
          Live data from your WHOOP sync · press ⌘K for actions
        </div>
      </div>
    </div>
  );
}
