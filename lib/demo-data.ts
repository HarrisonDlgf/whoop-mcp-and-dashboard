import type { DashboardData } from "@/app/_components/DashboardView";

const DEMO_NAME = "Alex";

const TODAY = new Date("2026-05-17T00:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number): Date {
  return new Date(TODAY.getTime() - n * DAY);
}

function label(n: number): string {
  return daysAgo(n).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const HRV = [72, 68, 74, 79, 71, 66, 70, 77, 81, 75, 73, 80, 84, 86];
const RHR = [50, 51, 50, 48, 51, 53, 52, 49, 47, 49, 50, 48, 47, 46];
const REC = [64, 58, 69, 78, 62, 51, 60, 74, 83, 70, 67, 79, 86, 88];

export const demoName = DEMO_NAME;

export const demoData: DashboardData = {
  readout: {
    date: TODAY,
    recoveryScore: 88,
    hrv: 86,
    restingHeartRate: 46,
    dayStrain: 8.4,
    sleep: {
      performancePct: 94,
      durationMinutes: 468,
      start: new Date("2026-05-16T22:41:00Z"),
    },
    deltas: { hrv: 9.4, restingHeartRate: -2.1, sleepMinutes: 37 },
  },

  trend: HRV.map((hrv, i) => ({
    date: label(HRV.length - 1 - i),
    hrv,
    rhr: RHR[i],
    rec: REC[i],
  })),

  runs: [
    { date: label(1), distanceMiles: 6.2, pacePerMile: "8:34", avgHr: 141, isLong: true },
    { date: label(3), distanceMiles: 4.1, pacePerMile: "8:52", avgHr: 136, isLong: false },
    { date: label(5), distanceMiles: 3.4, pacePerMile: "7:19", avgHr: 168, isLong: false },
    { date: label(7), distanceMiles: 5.0, pacePerMile: "8:47", avgHr: 138, isLong: true },
  ],

  lifts: [
    { date: label(2), durationMinutes: 52, strain: 10.8, avgHr: 118 },
    { date: label(4), durationMinutes: 64, strain: 12.3, avgHr: 124 },
    { date: label(9), durationMinutes: 47, strain: 9.6, avgHr: 115 },
  ],

  readiness: {
    raceName: "Half marathon",
    raceDistanceMiles: 13.1,
    raceDateLabel: "June 2026",
    daysToRace: 18,
    weeksToRace: 3,
    longestRun: { miles: 8.2, date: label(12) },
    longRunTargetMiles: 10,
    weeklyTargetMiles: 20,
    avgWeeklyMiles: 20,
    peakWeekMiles: 24.8,
    thisWeekMiles: 18.7,
    weeklyVolume: [
      { label: label(38), miles: 14.2, longRunMiles: 5.1 },
      { label: label(31), miles: 18.6, longRunMiles: 6.4 },
      { label: label(24), miles: 21.3, longRunMiles: 7.5 },
      { label: label(17), miles: 24.8, longRunMiles: 8.2 },
      { label: label(10), miles: 22.1, longRunMiles: 7.0 },
      { label: label(3), miles: 18.7, longRunMiles: 6.2 },
    ],
    windowWeeks: 6,
    readinessPct: 89,
    longRunPct: 82,
    volumePct: 100,
    verdict: "ready",
  },

  lastSync: new Date("2026-05-17T06:12:00Z"),

  zoneMix: {
    weeks: [
      { label: label(38), easyMinutes: 118, hardMinutes: 34, easyPct: 77.6 },
      { label: label(31), easyMinutes: 146, hardMinutes: 31, easyPct: 82.5 },
      { label: label(24), easyMinutes: 171, hardMinutes: 38, easyPct: 81.8 },
      { label: label(17), easyMinutes: 194, hardMinutes: 41, easyPct: 82.6 },
      { label: label(10), easyMinutes: 178, hardMinutes: 47, easyPct: 79.1 },
      { label: label(3), easyMinutes: 152, hardMinutes: 33, easyPct: 82.2 },
    ],
    recentRuns: [
      { date: label(1), miles: 6.2, minutes: [2, 14, 26, 8, 3, 0], totalMinutes: 53, easyPct: 78.4 },
      { date: label(3), miles: 4.1, minutes: [1, 12, 19, 4, 0, 0], totalMinutes: 36, easyPct: 88.6 },
      { date: label(5), miles: 3.4, minutes: [1, 4, 5, 6, 7, 2], totalMinutes: 25, easyPct: 37.5 },
      { date: label(7), miles: 5.0, minutes: [2, 13, 22, 6, 1, 0], totalMinutes: 44, easyPct: 83.3 },
      { date: label(9), miles: 4.6, minutes: [1, 11, 21, 5, 1, 0], totalMinutes: 39, easyPct: 84.2 },
    ],
    overallEasyPct: 81.3,
    runsWithZoneData: 18,
  },

  taper: {
    daysToRace: 18,
    daysSinceLastRun: 1,
    raceName: "Half marathon",
    raceDateLabel: "Jun 4",
    raceDistanceMiles: 13.1,
    peakWeekMiles: 24.8,
    raceWeekMiles: 18.7,
    reductionPct: 24.6,
    hrvRecent: 79.9,
    hrvBaseline: 71.4,
    rhrRecent: 47.9,
    rhrBaseline: 50.6,
    absorbing: "yes",
  },

  efficiency: {
    points: [
      { date: label(40), ef: 1.02, pacePerMile: "9:41", avgHr: 139, miles: 3.2, easy: true },
      { date: label(36), ef: 1.04, pacePerMile: "9:32", avgHr: 138, miles: 4.0, easy: true },
      { date: label(33), ef: 1.01, pacePerMile: "8:14", avgHr: 165, miles: 3.1, easy: false },
      { date: label(29), ef: 1.07, pacePerMile: "9:18", avgHr: 137, miles: 5.2, easy: true },
      { date: label(26), ef: 1.09, pacePerMile: "9:11", avgHr: 136, miles: 4.4, easy: true },
      { date: label(22), ef: 1.06, pacePerMile: "7:52", avgHr: 170, miles: 3.6, easy: false },
      { date: label(19), ef: 1.12, pacePerMile: "9:02", avgHr: 134, miles: 6.1, easy: true },
      { date: label(15), ef: 1.14, pacePerMile: "8:54", avgHr: 133, miles: 5.4, easy: true },
      { date: label(12), ef: 1.13, pacePerMile: "8:58", avgHr: 134, miles: 8.2, easy: true },
      { date: label(9), ef: 1.16, pacePerMile: "8:46", avgHr: 132, miles: 4.6, easy: true },
      { date: label(7), ef: 1.18, pacePerMile: "8:47", avgHr: 138, miles: 5.0, easy: true },
      { date: label(5), ef: 1.11, pacePerMile: "7:19", avgHr: 168, miles: 3.4, easy: false },
      { date: label(3), ef: 1.19, pacePerMile: "8:52", avgHr: 136, miles: 4.1, easy: true },
      { date: label(1), ef: 1.22, pacePerMile: "8:34", avgHr: 141, miles: 6.2, easy: true },
    ],
    changePct: 11.8,
  },
};
