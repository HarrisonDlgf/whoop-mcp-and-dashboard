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
    getRacePrep(6),
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
  const volMax = Math.max(...racePrep.weeklyVolume.map((w) => w.miles), 1);
  const weekDelta =
    racePrep.lastWeekMiles > 0
      ? racePrep.thisWeekMiles - racePrep.lastWeekMiles
      : null;

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
              <div className="race-top">
                <div>
                  <div className="race-weeks">
                    {racePrep.weeksToRace}
                    <small> wk</small>
                  </div>
                  <div className="race-weeks-sub">
                    to {racePrep.raceName} · {racePrep.raceDistanceMiles} mi
                  </div>
                </div>
                {racePrep.longestRun && (
                  <div className="race-ready">
                    <div className="race-ready-val">
                      {racePrep.longestRun.miles}
                      <small> mi</small>
                    </div>
                    <div className="race-ready-sub">
                      longest · {racePrep.longestRun.date}
                    </div>
                    <div
                      className={`race-badge ${racePrep.coveredRaceDistance ? "ok" : "warn"}`}
                    >
                      {racePrep.coveredRaceDistance
                        ? "Race distance covered"
                        : `${(racePrep.raceDistanceMiles - racePrep.longestRun.miles).toFixed(1)} mi to go`}
                    </div>
                  </div>
                )}
              </div>

              <div className="race-vol-head">
                <span>Weekly volume</span>
                <span className="race-vol-now">
                  this wk {racePrep.thisWeekMiles} mi
                  {weekDelta !== null && (
                    <span
                      style={{ color: weekDelta >= 0 ? "var(--good)" : "var(--bad)" }}
                    >
                      {" "}
                      {weekDelta >= 0 ? "▲" : "▼"} {Math.abs(weekDelta).toFixed(1)}
                    </span>
                  )}
                </span>
              </div>
              <div className="vol-bars">
                {racePrep.weeklyVolume.map((w, i) => (
                  <div className="vol-col" key={i}>
                    <div className="vol-val">{w.miles || ""}</div>
                    <div className="vol-track">
                      <div
                        className="vol-fill"
                        style={{
                          height: `${(w.miles / volMax) * 100}%`,
                          opacity:
                            i === racePrep.weeklyVolume.length - 1 ? 1 : 0.55,
                        }}
                      />
                    </div>
                    <div className="vol-wk">{w.label}</div>
                  </div>
                ))}
              </div>

              <div className="race-completion-head">
                <span>Long-run completion</span>
                <span className="race-completion-val">
                  {racePrep.weeksWithLongRun} of {racePrep.windowWeeks} wks
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
