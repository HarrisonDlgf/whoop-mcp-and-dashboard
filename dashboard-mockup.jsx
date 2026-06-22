import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Heart, Moon, Flame, Activity, Check, Plus, AlertTriangle, RefreshCw,
} from "lucide-react";

// ---- sample data (mockup only; the real app pulls this from Postgres) ----
const TREND = [
  { d: "Jun 1", hrv: 108, rhr: 48, rec: 66 },
  { d: "Jun 2", hrv: 121, rhr: 46, rec: 78 },
  { d: "Jun 3", hrv: 98,  rhr: 52, rec: 50 },
  { d: "Jun 4", hrv: 115, rhr: 49, rec: 68 },
  { d: "Jun 5", hrv: 127, rhr: 46, rec: 82 },
  { d: "Jun 6", hrv: 102, rhr: 50, rec: 58 },
  { d: "Jun 7", hrv: 118, rhr: 47, rec: 71 },
  { d: "Jun 8", hrv: 121, rhr: 45, rec: 71 },
];

const RUNS = [
  { date: "Jun 7", dist: "3.1 mi", pace: "13:42/mi", hr: 141, zone: "Zone 2", tag: "easy" },
  { date: "Jun 4", dist: "2.0 mi", pace: "14:05/mi", hr: 137, zone: "Zone 2", tag: "easy" },
  { date: "Jun 1", dist: "4.2 mi", pace: "13:30/mi", hr: 144, zone: "Zone 2-3", tag: "long" },
];

const LIFTS = [
  { type: "Push", tonnage: "12,290", reps: 222 },
  { type: "Pull", tonnage: "11,595", reps: 138 },
  { type: "Legs", tonnage: "22,140", reps: 136 },
];

const PROGRESS = [
  { wk: "W3", plan: 4.5, actual: 4.2 },
  { wk: "W4", plan: 3.5, actual: 3.6 },
  { wk: "W5", plan: 5.0, actual: 0 },
  { wk: "W6", plan: 5.5, actual: 0 },
];

const INITIAL_TODOS = [
  { id: 1, text: "Long run (4.5 mi) — priority", done: false, group: "Training" },
  { id: 2, text: "Push day", done: true, group: "Training" },
  { id: 3, text: "Pull day", done: true, group: "Training" },
  { id: 4, text: "Legs day", done: false, group: "Training" },
  { id: 5, text: "Easy run x2", done: false, group: "Training" },
  { id: 6, text: "Hit protein (165g) 5 of 7 days", done: false, group: "Habits" },
  { id: 7, text: "In bed before midnight 5 of 7", done: false, group: "Habits" },
];

function recoveryColor(score) {
  if (score >= 80) return { key: "green", label: "High" };
  if (score >= 60) return { key: "amber", label: "Moderate" };
  return { key: "red", label: "Low" };
}

const TODAY = { recovery: 71, hrv: 121, rhr: 45, sleepPct: 83, sleepDur: "7:24", strain: 10.2 };

export default function Dashboard() {
  const [tab, setTab] = useState("hrv");
  const [todos, setTodos] = useState(INITIAL_TODOS);
  const rec = recoveryColor(TODAY.recovery);

  const toggle = (id) =>
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const groups = ["Training", "Habits"];
  const doneCount = todos.filter((t) => t.done).length;

  const call =
    rec.key === "green"
      ? "Green light. Good day for your long run or a hard lift."
      : rec.key === "amber"
      ? "Moderate. An easy Zone 2 run or a lighter lift fits. Hold off on max efforts."
      : "Low. Keep it to a walk or full rest and protect tonight's sleep.";

  return (
    <div className="wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        :root{
          --paper:#FBFBFA; --surface:#FFFFFF; --ink:#2E2C28; --ink-soft:#6B6862;
          --muted:#9B9893; --line:#ECEBE7; --line-strong:#E0DED9;
          --accent:#2F6F5E;
          --green:#4F9D69; --amber:#C8932E; --red:#C0584B;
          --green-bg:#EAF3ED; --amber-bg:#F7EFDB; --red-bg:#F6E9E6;
          --fb:'Inter',system-ui,sans-serif; --fd:'JetBrains Mono',ui-monospace,monospace;
        }
        *{box-sizing:border-box}
        .wrap{background:var(--paper);color:var(--ink);font-family:var(--fb);
          padding:28px 22px 48px;min-height:100%;}
        .inner{max-width:940px;margin:0 auto;}
        .eyebrow{font-family:var(--fd);font-size:11px;letter-spacing:.08em;
          text-transform:uppercase;color:var(--accent);font-weight:600;}
        .h1{font-size:26px;font-weight:700;letter-spacing:-.01em;margin:6px 0 0;}
        .sub{color:var(--ink-soft);font-size:13.5px;margin-top:3px;}
        .row-between{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;}
        .chip{display:inline-flex;align-items:center;gap:6px;font-family:var(--fd);
          font-size:11px;color:var(--ink-soft);background:var(--surface);
          border:1px solid var(--line-strong);border-radius:999px;padding:5px 10px;}
        .dot{width:6px;height:6px;border-radius:50%;background:var(--green);}
        .section-label{font-family:var(--fd);font-size:11px;letter-spacing:.08em;
          text-transform:uppercase;color:var(--muted);font-weight:600;margin:30px 0 12px;}
        .card{background:var(--surface);border:1px solid var(--line);
          border-radius:14px;padding:18px;}
        .today{display:grid;grid-template-columns:minmax(190px,1fr) 2fr;gap:14px;}
        .rec-block{display:flex;flex-direction:column;justify-content:space-between;}
        .rec-state{font-family:var(--fd);font-size:12px;font-weight:600;
          letter-spacing:.04em;text-transform:uppercase;}
        .rec-num{font-family:var(--fd);font-size:54px;font-weight:600;line-height:1;
          letter-spacing:-.02em;margin-top:8px;}
        .rec-num small{font-size:20px;color:var(--muted);}
        .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        .tile{background:var(--surface);border:1px solid var(--line);border-radius:14px;
          padding:14px;display:flex;flex-direction:column;gap:8px;}
        .tile .lab{display:flex;align-items:center;gap:6px;color:var(--ink-soft);font-size:12px;}
        .tile .val{font-family:var(--fd);font-size:24px;font-weight:600;letter-spacing:-.01em;}
        .tile .val small{font-size:13px;color:var(--muted);font-weight:500;}
        .call{margin-top:12px;border-left:3px solid var(--accent);background:var(--surface);
          border-radius:8px;padding:11px 14px;font-size:13.5px;color:var(--ink);}
        .call b{color:var(--accent);}
        .tabs{display:inline-flex;gap:2px;background:#F0EFEC;border-radius:9px;padding:3px;}
        .tab-btn{border:0;background:transparent;font-family:var(--fb);font-size:12.5px;
          font-weight:500;color:var(--ink-soft);padding:5px 12px;border-radius:7px;cursor:pointer;}
        .tab-btn.on{background:var(--surface);color:var(--ink);
          box-shadow:0 1px 2px rgba(0,0,0,.06);}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .list-row{display:flex;justify-content:space-between;align-items:center;
          padding:10px 0;border-bottom:1px solid var(--line);}
        .list-row:last-child{border-bottom:0;}
        .run-meta{font-family:var(--fd);font-size:12px;color:var(--ink-soft);}
        .pill{font-family:var(--fd);font-size:10.5px;padding:2px 7px;border-radius:5px;
          color:var(--accent);background:var(--green-bg);}
        .pill.long{color:#7A5AA8;background:#F0EBF7;}
        .lift{display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;
          border-bottom:1px solid var(--line);}
        .lift:last-child{border-bottom:0;}
        .lift .t{font-weight:600;font-size:13.5px;}
        .lift .n{font-family:var(--fd);font-size:13px;}
        .lift .n small{color:var(--muted);}
        .warn{display:flex;gap:9px;align-items:flex-start;background:var(--amber-bg);
          border:1px solid #EAD9AE;border-radius:10px;padding:10px 12px;margin-top:12px;}
        .warn .wt{font-size:12.5px;color:#7A5A12;line-height:1.45;}
        .bar{height:6px;border-radius:4px;background:var(--line);overflow:hidden;margin-top:6px;}
        .bar > i{display:block;height:100%;background:var(--accent);}
        .prog-row{display:flex;align-items:center;gap:10px;padding:7px 0;}
        .prog-row .wk{font-family:var(--fd);font-size:11px;color:var(--muted);width:26px;}
        .prog-track{flex:1;height:18px;background:var(--line);border-radius:5px;position:relative;}
        .prog-fill{position:absolute;top:0;left:0;bottom:0;border-radius:5px;background:var(--accent);}
        .prog-plan{position:absolute;top:0;bottom:0;width:2px;background:var(--ink);opacity:.45;}
        .prog-val{font-family:var(--fd);font-size:11px;width:62px;text-align:right;color:var(--ink-soft);}
        .todo-head{display:flex;justify-content:space-between;align-items:center;}
        .todo-count{font-family:var(--fd);font-size:11px;color:var(--muted);}
        .todo-group{font-family:var(--fd);font-size:10.5px;letter-spacing:.06em;
          text-transform:uppercase;color:var(--muted);margin:14px 0 4px;}
        .todo{display:flex;align-items:center;gap:10px;padding:7px 0;cursor:pointer;
          border-bottom:1px solid var(--line);}
        .todo:last-child{border-bottom:0;}
        .box{width:17px;height:17px;border-radius:5px;border:1.5px solid var(--line-strong);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
          transition:background .12s,border-color .12s;}
        .box.on{background:var(--accent);border-color:var(--accent);}
        .todo span{font-size:13.5px;}
        .todo.done span{color:var(--muted);text-decoration:line-through;}
        .add{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:13px;
          padding:9px 0;cursor:pointer;}
        .add:hover{color:var(--accent);}
        .todo:focus-visible,.tab-btn:focus-visible,.add:focus-visible{outline:2px solid var(--accent);
          outline-offset:2px;border-radius:6px;}
        @media (max-width:720px){
          .today{grid-template-columns:1fr;}
          .tiles{grid-template-columns:repeat(2,1fr);}
          .two{grid-template-columns:1fr;}
        }
        @media (prefers-reduced-motion:reduce){*{transition:none!important;}}
      `}</style>

      <div className="inner">
        {/* header */}
        <div className="row-between">
          <div>
            <div className="eyebrow">10 weeks to race day · Aug 16</div>
            <h1 className="h1">Good morning, Harrison</h1>
            <div className="sub">Monday, June 8 · 7-mile race build, week 5</div>
          </div>
          <div className="chip"><span className="dot" /> Synced 6:42 AM</div>
        </div>

        {/* today */}
        <div className="section-label">Today</div>
        <div className="today">
          <div
            className="card rec-block"
            style={{
              background: rec.key === "green" ? "var(--green-bg)" : rec.key === "amber" ? "var(--amber-bg)" : "var(--red-bg)",
              borderColor: rec.key === "green" ? "#CFE6D8" : rec.key === "amber" ? "#EAD9AE" : "#EAC9C2",
            }}
          >
            <div
              className="rec-state"
              style={{ color: `var(--${rec.key})` }}
            >
              Recovery · {rec.label}
            </div>
            <div className="rec-num" style={{ color: `var(--${rec.key})` }}>
              {TODAY.recovery}<small>%</small>
            </div>
          </div>

          <div className="tiles">
            <div className="tile">
              <div className="lab"><Heart size={14} /> HRV</div>
              <div className="val">{TODAY.hrv}<small> ms</small></div>
            </div>
            <div className="tile">
              <div className="lab"><Activity size={14} /> Resting HR</div>
              <div className="val">{TODAY.rhr}<small> bpm</small></div>
            </div>
            <div className="tile">
              <div className="lab"><Moon size={14} /> Sleep</div>
              <div className="val">{TODAY.sleepDur}<small> · {TODAY.sleepPct}%</small></div>
            </div>
            <div className="tile">
              <div className="lab"><Flame size={14} /> Strain</div>
              <div className="val">{TODAY.strain}</div>
            </div>
          </div>
        </div>

        <div className="call"><b>Today's call.</b> {call}</div>

        {/* trends */}
        <div className="row-between" style={{ alignItems: "center", marginTop: 30 }}>
          <div className="section-label" style={{ margin: 0 }}>14-day trend</div>
          <div className="tabs">
            <button className={`tab-btn ${tab === "hrv" ? "on" : ""}`} onClick={() => setTab("hrv")}>HRV &amp; RHR</button>
            <button className={`tab-btn ${tab === "rec" ? "on" : ""}`} onClick={() => setTab("rec")}>Recovery</button>
          </div>
        </div>
        <div className="card" style={{ marginTop: 12, paddingLeft: 6 }}>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={TREND} margin={{ top: 8, right: 14, bottom: 0, left: -8 }}>
              <CartesianGrid stroke="#F0EFEC" vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 11, fill: "#9B9893", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={{ stroke: "#ECEBE7" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9B9893", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} width={34} />
              <Tooltip contentStyle={{ fontFamily: "JetBrains Mono", fontSize: 12, borderRadius: 10, border: "1px solid #ECEBE7" }} />
              {tab === "hrv" ? (
                <>
                  <Line type="monotone" dataKey="hrv" name="HRV" stroke="#2F6F5E" strokeWidth={2.2} dot={{ r: 2.5 }} />
                  <Line type="monotone" dataKey="rhr" name="RHR" stroke="#C8932E" strokeWidth={2.2} dot={{ r: 2.5 }} />
                </>
              ) : (
                <Line type="monotone" dataKey="rec" name="Recovery" stroke="#2F6F5E" strokeWidth={2.4} dot={{ r: 2.5 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* training + race prep */}
        <div className="two" style={{ marginTop: 14 }}>
          <div>
            <div className="section-label" style={{ marginTop: 16 }}>Recent runs</div>
            <div className="card">
              {RUNS.map((r, i) => (
                <div className="list-row" key={i}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.dist} <span className={`pill ${r.tag === "long" ? "long" : ""}`}>{r.tag}</span></div>
                    <div className="run-meta">{r.date} · {r.pace} · {r.hr} bpm</div>
                  </div>
                  <div className="run-meta">{r.zone}</div>
                </div>
              ))}
            </div>

            <div className="section-label">Lift tonnage</div>
            <div className="card">
              {LIFTS.map((l, i) => (
                <div className="lift" key={i}>
                  <div className="t">{l.type}</div>
                  <div className="n">{l.tonnage} lbs <small>· {l.reps} reps</small></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="section-label" style={{ marginTop: 16 }}>Race prep</div>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>Long-run completion</span>
                <span style={{ fontFamily: "var(--fd)", fontWeight: 600 }}>2 of 5 weeks</span>
              </div>
              <div className="bar"><i style={{ width: "40%", background: "var(--amber)" }} /></div>
              <div className="warn">
                <AlertTriangle size={15} color="#C8932E" style={{ flexShrink: 0, marginTop: 1 }} />
                <div className="wt">Completion is slipping. The long run is the one session that builds the race. Protect Saturday.</div>
              </div>

              <div style={{ fontFamily: "var(--fd)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", margin: "18px 0 4px" }}>
                Progression vs plan
              </div>
              {PROGRESS.map((p, i) => {
                const max = 6;
                return (
                  <div className="prog-row" key={i}>
                    <span className="wk">{p.wk}</span>
                    <div className="prog-track">
                      <div className="prog-fill" style={{ width: `${(p.actual / max) * 100}%` }} />
                      <div className="prog-plan" style={{ left: `${(p.plan / max) * 100}%` }} />
                    </div>
                    <span className="prog-val">{p.actual ? `${p.actual}` : "—"} / {p.plan} mi</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* this week */}
        <div className="section-label">This week</div>
        <div className="card">
          <div className="todo-head">
            <span style={{ fontWeight: 600, fontSize: 14 }}>Sunday reset checklist</span>
            <span className="todo-count">{doneCount}/{todos.length} done</span>
          </div>
          {groups.map((g) => (
            <div key={g}>
              <div className="todo-group">{g}</div>
              {todos.filter((t) => t.group === g).map((t) => (
                <div
                  className={`todo ${t.done ? "done" : ""}`}
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  role="checkbox"
                  aria-checked={t.done}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(t.id); } }}
                >
                  <span className={`box ${t.done ? "on" : ""}`}>{t.done && <Check size={12} color="#fff" />}</span>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="add"><Plus size={15} /> Add item</div>
        </div>

        <div style={{ textAlign: "center", marginTop: 22, fontFamily: "var(--fd)", fontSize: 11, color: "var(--muted)" }}>
          Sample data for layout review · real app pulls from your WHOOP sync
        </div>
      </div>
    </div>
  );
}
