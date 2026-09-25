import type { ZoneMix as ZoneMixData } from "@/lib/dashboard";

const EASY_TARGET = 80;

function verdict(pct: number | null): { tone: "ok" | "warn"; text: string } {
  if (pct === null) {
    return { tone: "warn", text: "Not enough zone data yet." };
  }
  if (pct >= EASY_TARGET) {
    return { tone: "ok", text: "Easy days are staying easy. This is what builds the aerobic base." };
  }
  if (pct >= 65) {
    return { tone: "warn", text: "A little hot. Some of your easy runs are drifting into threshold." };
  }
  return { tone: "warn", text: "Most of your running is hard. That caps aerobic gains and raises injury risk." };
}

export function ZoneMix({ data }: { data: ZoneMixData }) {
  const v = verdict(data.overallEasyPct);

  if (data.runsWithZoneData === 0) {
    return (
      <div id="zones">
        <div className="section-label" style={{ marginTop: 16 }}>Easy vs hard</div>
        <div className="card">
          <div className="run-meta">No runs with zone data in range yet.</div>
        </div>
      </div>
    );
  }

  return (
    <div id="zones">
      <div className="section-label" style={{ marginTop: 16 }}>Easy vs hard</div>
      <div className="card">
        <div className="zm-top">
          <div>
            <div className="zm-big">
              {data.overallEasyPct === null ? "—" : Math.round(data.overallEasyPct)}
              <small>% easy</small>
            </div>
            <div className="zm-sub">
              across {data.runsWithZoneData} runs · target {EASY_TARGET}%
            </div>
          </div>
          <div className="zm-legend">
            <span className="legend-item">
              <i style={{ background: "var(--zone-easy)" }} /> zones 1–2
            </span>
            <span className="legend-item">
              <i style={{ background: "var(--zone-hard)" }} /> zones 3–5
            </span>
          </div>
        </div>

        <div className="zm-weeks">
          {data.weeks.map((w, i) => {
            const total = w.easyMinutes + w.hardMinutes;
            return (
              <div className="zm-week" key={i}>
                <div className="zm-week-label">{w.label}</div>
                <div className="zm-track">
                  {total > 0 && (
                    <>
                      <div
                        className="zm-seg easy"
                        style={{ width: `${(w.easyMinutes / total) * 100}%` }}
                      />
                      <div
                        className="zm-seg hard"
                        style={{ width: `${(w.hardMinutes / total) * 100}%` }}
                      />
                    </>
                  )}
                </div>
                <div className="zm-week-val">
                  {w.easyPct === null ? "—" : `${Math.round(w.easyPct)}%`}
                </div>
              </div>
            );
          })}
        </div>

        <div className={`zm-verdict ${v.tone}`}>{v.text}</div>

        <div className="zm-runs-head">Recent runs</div>
        {data.recentRuns.map((r, i) => (
          <div className="zm-run" key={i}>
            <div className="zm-run-meta">
              <b>{r.miles !== null ? `${r.miles.toFixed(1)} mi` : "Run"}</b>
              <span>{r.date}</span>
            </div>
            <div className="zm-zones" title={`${Math.round(r.totalMinutes)} min total`}>
              {r.minutes.map((m, z) => (
                <div
                  key={z}
                  className={`zm-zone z${z}`}
                  style={{
                    flexGrow: m,
                    display: m <= 0 ? "none" : undefined,
                  }}
                  title={`Zone ${z} · ${Math.round(m)} min`}
                />
              ))}
            </div>
            <div className="zm-run-pct">
              {r.easyPct === null ? "—" : `${Math.round(r.easyPct)}%`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
