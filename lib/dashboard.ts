import { prisma, SINGLETON_USER_ID } from "@/lib/db";

const METERS_PER_MILE = 1609.344;

// Falmouth road race day
export const RACE_DAY = new Date("2026-08-16T00:00:00Z");

const LONG_RUN_METERS = 5 * METERS_PER_MILE;

function isRun(sportName: string): boolean {
  return sportName.toLowerCase().includes("run");
}

function isLift(sportName: string): boolean {
  const s = sportName.toLowerCase();
  return s.includes("weightlifting") || s.includes("strength");
}

function startOfUtcDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export type Readout = {
  date: Date;
  recoveryScore: number | null;
  hrv: number | null;
  restingHeartRate: number | null;

  dayStrain: number | null;
  sleep: {
    performancePct: number | null;
    durationMinutes: number | null;
    start: Date | null;
  } | null;
  deltas: {
    hrv: number | null;
    restingHeartRate: number | null;
    sleepMinutes: number | null;
  };
};

// run averages
function priorAverage(values: (number | null)[]): number | null {
  const prior = values.slice(1).filter((v): v is number => v !== null);
  if (prior.length === 0) return null;
  return prior.reduce((a, b) => a + b, 0) / prior.length;
}

function delta(latest: number | null, values: (number | null)[]): number | null {
  const avg = priorAverage(values);
  if (latest === null || avg === null) return null;
  return latest - avg;
}

export async function getLatestReadout(): Promise<Readout | null> {
  const recoveries = await prisma.recovery.findMany({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { date: "desc" },
    take: 8,
  });
  const recovery = recoveries[0];
  if (!recovery) return null;

  const sleeps = await prisma.sleep.findMany({
    where: { userId: SINGLETON_USER_ID, nap: false },
    orderBy: { date: "desc" },
    take: 8,
  });
  const sleep =
    sleeps.find((s) => s.date.getTime() === recovery.date.getTime()) ?? sleeps[0];

  return {
    date: recovery.date,
    recoveryScore: recovery.recoveryScore,
    hrv: recovery.hrv,
    restingHeartRate: recovery.restingHeartRate,
    dayStrain: null,
    sleep: sleep && {
      performancePct: sleep.sleepPerformancePct,
      durationMinutes: sleep.durationMinutes,
      start: sleep.sleepStart,
    },
    deltas: {
      hrv: delta(recovery.hrv, recoveries.map((r) => r.hrv)),
      restingHeartRate: delta(
        recovery.restingHeartRate,
        recoveries.map((r) => r.restingHeartRate),
      ),
      sleepMinutes: delta(
        sleep?.durationMinutes ?? null,
        sleeps.map((s) => s.durationMinutes),
      ),
    },
  };
}

export type TrendPoint = {
  date: string;
  hrv: number | null;
  rhr: number | null;
  rec: number | null;
};

export async function getTrend(days = 14): Promise<TrendPoint[]> {
  const rows = await prisma.recovery.findMany({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { date: "desc" },
    take: days,
  });
  rows.reverse();

  return rows.map((r) => ({
    date: r.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    hrv: r.hrv,
    rhr: r.restingHeartRate,
    rec: r.recoveryScore,
  }));
}

export type RunSummary = {
  date: string;
  distanceMiles: number | null;
  pacePerMile: string | null; 
  avgHr: number | null;
  isLong: boolean;
};

export async function getRecentRuns(limit = 4): Promise<RunSummary[]> {
  const rows = await prisma.workout.findMany({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { start: "desc" },
    take: 60,
  });

  return rows
    .filter((w) => isRun(w.sportName))
    .slice(0, limit)
    .map((w) => {
      const meters = w.distanceMeters;
      const minutes = (w.end.getTime() - w.start.getTime()) / 60_000;
      let pace: string | null = null;
      if (meters && meters > 0) {
        const perMile = minutes / (meters / METERS_PER_MILE);
        const m = Math.floor(perMile);
        const s = Math.round((perMile - m) * 60);
        pace = `${m}:${s.toString().padStart(2, "0")}`;
      }
      return {
        date: w.start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }),
        distanceMiles: meters ? meters / METERS_PER_MILE : null,
        pacePerMile: pace,
        avgHr: w.avgHr,
        isLong: meters ? meters >= LONG_RUN_METERS : false,
      };
    });
}

export type LiftSummary = {
  date: string;
  durationMinutes: number;
  strain: number | null;
  avgHr: number | null;
};

export async function getRecentLifts(limit = 3): Promise<LiftSummary[]> {
  const rows = await prisma.workout.findMany({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { start: "desc" },
    take: 60,
  });

  return rows
    .filter((w) => isLift(w.sportName))
    .slice(0, limit)
    .map((w) => ({
      date: w.start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      durationMinutes: Math.round((w.end.getTime() - w.start.getTime()) / 60_000),
      strain: w.strain,
      avgHr: w.avgHr,
    }));
}

export type RacePrep = {
  weeksToRace: number;
  windowWeeks: number;
  weeksWithLongRun: number;
};

export async function getRacePrep(windowWeeks = 5): Promise<RacePrep> {
  const msToRace = RACE_DAY.getTime() - Date.now();
  const weeksToRace = Math.max(0, Math.ceil(msToRace / (7 * 24 * 60 * 60 * 1000)));

  const latestWorkout = await prisma.workout.findFirst({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { start: "desc" },
    select: { start: true },
  });
  const anchor = latestWorkout?.start ?? new Date();
  const windowStart = startOfUtcDay(
    new Date(anchor.getTime() - windowWeeks * 7 * 24 * 60 * 60 * 1000),
  );

  const rows = await prisma.workout.findMany({
    where: {
      userId: SINGLETON_USER_ID,
      start: { gte: windowStart },
    },
    orderBy: { start: "desc" },
  });

  const longRunWeeks = new Set<string>();
  for (const w of rows) {
    if (!isRun(w.sportName)) continue;
    if (!w.distanceMeters || w.distanceMeters < LONG_RUN_METERS) continue;
    const weekIndex = Math.floor(w.start.getTime() / (7 * 24 * 60 * 60 * 1000));
    longRunWeeks.add(String(weekIndex));
  }

  return {
    weeksToRace,
    windowWeeks,
    weeksWithLongRun: longRunWeeks.size,
  };
}


export async function getLastSync(): Promise<Date | null> {
  const latest = await prisma.recovery.findFirst({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });
  return latest?.updatedAt ?? null;
}
