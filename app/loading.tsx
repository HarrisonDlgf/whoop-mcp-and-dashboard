import "./dashboard.css";

export default function Loading() {
  return (
    <div className="wrap">
      <div className="inner">
        <div className="topbar">
          <div className="brand">
            <span className="brand-dot" /> WHOOP · Dashboard
          </div>
        </div>
        <div className="eyebrow">Loading your readout…</div>
        <h1 className="h1" style={{ color: "var(--muted)" }}>Good morning, Harrison</h1>
        <div className="section-label">Today</div>
        <div className="today">
          <div className="card rec-card" style={{ minHeight: 176 }} />
          <div className="tiles">
            <div className="tile" style={{ minHeight: 84 }} />
            <div className="tile" style={{ minHeight: 84 }} />
            <div className="tile" style={{ minHeight: 84 }} />
            <div className="tile" style={{ minHeight: 84 }} />
          </div>
        </div>
        <div className="card" style={{ marginTop: 24, minHeight: 220 }} />
      </div>
    </div>
  );
}
