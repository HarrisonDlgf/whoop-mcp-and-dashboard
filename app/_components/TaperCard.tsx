import type { Taper } from "@/lib/dashboard";

function absorbingCopy(t: Taper): { tone: "ok" | "warn" | "muted"; text: string } {
  if (t.absorbing === "yes") {
    return {
      tone: "ok",
      text: "HRV is up and resting heart rate is down against your last three weeks. You are absorbing the taper.",
    };
  }
  if (t.absorbing === "no") {
    return {
      tone: "warn",
      text: "HRV is down and resting heart rate is up against your last three weeks. Take the easy days genuinely easy.",
    };
  }
  return {
    tone: "muted",
    text: "Not enough recovery history yet to say whether you are absorbing the taper.",
  };
}

function signed(n: number | null, digits = 1): string {
  if (n === null) return "—";
  return `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(digits)}`;
}

export function TaperCard({ data }: { data: Taper }) {
  const noRuns = data.raceWeekMiles === 0;
  const a = absorbingCopy(data);
  const hrvDelta =
    data.hrvRecent !== null && data.hrvBaseline !== null
      ? data.hrvRecent - data.hrvBaseline
      : null;
  const rhrDelta =
    data.rhrRecent !== null && data.rhrBaseline !== null
      ? data.rhrRecent - data.rhrBaseline
      : null;

  return (
    <div id="taper">
      <div className="section-label" style={{ marginTop: 16 }}>Taper</div>
      <div className="card">
        <div className="tp-top">
          <div>
            <div className="tp-days">
              {data.daysToRace}
              <small> {data.daysToRace === 1 ? "day" : "days"}</small>
            </div>
            <div className="tp-days-sub">
              to {data.raceName} · {data.raceDistanceMiles} mi
            </div>
          </div>
          <div className="tp-vol">
            {noRuns ? (
              <>
                <div className="tp-vol-val">
                  {data.daysSinceLastRun ?? "—"}
                  <small> d</small>
                </div>
                <div className="tp-vol-sub">since your last run</div>
                <div className="tp-vol-detail">peak week {data.peakWeekMiles} mi</div>
              </>
            ) : (
              <>
                <div className="tp-vol-val">
                  {data.reductionPct === null ? "—" : `${Math.round(data.reductionPct)}%`}
                </div>
                <div className="tp-vol-sub">below peak week</div>
                <div className="tp-vol-detail">
                  {data.raceWeekMiles} mi now · peak {data.peakWeekMiles} mi
                </div>
              </>
            )}
          </div>
        </div>

        <div className="tp-signals">
          <div className="tp-signal">
            <div className="tp-signal-label">HRV vs baseline</div>
            <div className={`tp-signal-val ${hrvDelta !== null && hrvDelta >= 0 ? "good" : "bad"}`}>
              {signed(hrvDelta)} <small>ms</small>
            </div>
          </div>
          <div className="tp-signal">
            <div className="tp-signal-label">Resting HR vs baseline</div>
            <div className={`tp-signal-val ${rhrDelta !== null && rhrDelta <= 0 ? "good" : "bad"}`}>
              {signed(rhrDelta)} <small>bpm</small>
            </div>
          </div>
        </div>

        {noRuns && data.daysSinceLastRun !== null && (
          <div className="tp-verdict warn">
            No runs logged this week. {data.daysSinceLastRun} days off with{" "}
            {data.daysToRace} to go is a gap, not a taper — a couple of short,
            easy runs will keep your legs sharp for {data.raceName}.
          </div>
        )}

        <div className={`tp-verdict ${a.tone}`}>{a.text}</div>
      </div>
    </div>
  );
}
