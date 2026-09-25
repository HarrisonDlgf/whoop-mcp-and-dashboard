import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasValidSession } from "@/lib/auth";
import {
  getLatestReadout,
  getTrend,
  getRecentRuns,
  getRecentLifts,
  getRacePrep,
  getLastSync,
  getZoneMix,
  getTaper,
  getEfficiency,
} from "@/lib/dashboard";
import { DashboardView } from "../_components/DashboardView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function Dashboard() {
  if (!(await hasValidSession())) {
    notFound();
  }

  const [readout, trend, runs, lifts, racePrep, lastSync, zoneMix, taper, efficiency] =
    await Promise.all([
      getLatestReadout(),
      getTrend(14),
      getRecentRuns(4),
      getRecentLifts(3),
      getRacePrep(6),
      getLastSync(),
      getZoneMix(6),
      getTaper(),
      getEfficiency(10),
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

  return (
    <DashboardView
      name="Harrison"
      data={{
        readout,
        trend,
        runs,
        lifts,
        racePrep,
        lastSync,
        zoneMix,
        taper,
        efficiency,
      }}
    />
  );
}
