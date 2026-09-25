import type { Metadata } from "next";
import { DashboardView } from "./_components/DashboardView";
import { demoData, demoName } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "WHOOP dashboard",
  description:
    "A sample of the WHOOP dashboard rendered with invented data. No real health data is shown.",
};

function DemoBanner() {
  return (
    <div className="demo-banner">
      <span className="demo-badge">Demo</span>
      <span className="demo-text">
        Sample data, not a real person. The live dashboard reads a private WHOOP
        account through the same components.
      </span>
      <a
        className="demo-link"
        href="https://github.com/HarrisonDlgf/whoop-mcp-and-dashboard"
        target="_blank"
        rel="noreferrer"
      >
        Source ↗
      </a>
    </div>
  );
}

export default function DemoDashboard() {
  return (
    <DashboardView data={demoData} name={demoName} banner={<DemoBanner />} demo />
  );
}
