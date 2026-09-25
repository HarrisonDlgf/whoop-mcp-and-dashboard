import type { Readiness } from "@/lib/dashboard";

function verdictCopy(r: Readiness): { tone: "ok" | "warn" | "muted"; text: string } {
  switch (r.verdict) {
    case "ready":
      return {
        tone: "ok",
        text: `Long run and weekly volume are both where they need to be for ${r.raceDistanceMiles} miles.`,
      };
    case "building":
      return {
        tone: "warn",
        text: `On the way. The long run is the session that closes the gap — build it toward ${r.longRunTargetMiles} miles.`,
      };
    case "behind":
      return {
        tone: "warn",
        text: `Base is thin for ${r.raceDistanceMiles} miles. Add easy weekly mileage first, then extend the long run.`,
      };
    default:
      return { tone: "muted", text: "Not enough run history yet to judge readiness." };
  }
}

function Meter({
  label,
  pct,
  detail,
}: {
  label: string;
  pct: number;
  detail: string;
}) {
  return (
    <div className="hm-meter">
      <div className="hm-meter-head">
        <span>{label}</span>
        <span className="hm-meter-pct">{pct}%</span>
      </div>
      <div className="bar">
        <i
          style={{
            width: `${pct}%`,
            background: pct >= 85 ? "var(--good)" : pct >= 50 ? "var(--amber)" : "var(--bad)",
          }}
        />
      </div>
      <div className="hm-meter-detail">{detail}</div>
    </div>
  );
}

export function ReadinessCard({ data }: { data: Readiness }) {
  const v = verdictCopy(data);
  const volMax = Math.max(...data.weeklyVolume.map((w) => w.miles), 1);
  const gap =
    data.longestRun === null
      ? null
      : Math.max(0, data.longRunTargetMiles - data.longestRun.miles);

  return (
    <div id="race">
      <div className="section-label" style={{ marginTop: 16 }}>
        Half marathon readiness
      </div>
      <div className="card">
        <div className="hm-top">
          <div>
            <div className="hm-score">
              {data.readinessPct}
              <small>%</small>
            </div>
            <div className="hm-score-sub">
              ready for {data.raceDistanceMiles} mi
            </div>
          </div>
          <div className="hm-when">
            <div className="hm-when-val">{data.raceDateLabel}</div>
            <div className="hm-when-sub">
              {data.weeksToRace} {data.weeksToRace === 1 ? "week" : "weeks"} out
            </div>
            {data.longestRun && (
              <div className={`race-badge ${gap === 0 ? "ok" : "warn"}`}>
                {gap === 0
                  ? "Long run target hit"
                  : `${gap!.toFixed(1)} mi to long-run target`}
              </div>
            )}
          </div>
        </div>

        <div className="hm-meters">
          <Meter
            label="Long run"
            pct={data.longRunPct}
            detail={
              data.longestRun
                ? `${data.longestRun.miles} of ${data.longRunTargetMiles} mi · ${data.longestRun.date}`
                : `no long run logged · target ${data.longRunTargetMiles} mi`
            }
          />
          <Meter
            label="Weekly volume"
            pct={data.volumePct}
            detail={`${data.avgWeeklyMiles} of ${data.weeklyTargetMiles} mi average · peak ${data.peakWeekMiles} mi`}
          />
        </div>

        <div className="race-vol-head">
          <span>Weekly volume</span>
          <span className="race-vol-now">this wk {data.thisWeekMiles} mi</span>
        </div>
        <div className="vol-bars">
          {data.weeklyVolume.map((w, i) => (
            <div className="vol-col" key={i}>
              <div className="vol-val">{w.miles || ""}</div>
              <div className="vol-track">
                <div
                  className="vol-fill"
                  style={{
                    height: `${(w.miles / volMax) * 100}%`,
                    opacity: i === data.weeklyVolume.length - 1 ? 1 : 0.55,
                  }}
                />
              </div>
              <div className="vol-wk">{w.label}</div>
            </div>
          ))}
        </div>

        <div className={`hm-verdict ${v.tone}`}>{v.text}</div>
      </div>
    </div>
  );
}
