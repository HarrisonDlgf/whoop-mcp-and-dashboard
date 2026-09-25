import { prisma, SINGLETON_USER_ID } from "@/lib/db";

const METERS_PER_MILE = 1609.344;

export const RACE_DAY = new Date("2027-02-14T00:00:00Z");
export const RACE_NAME = "Half marathon";
export const RACE_DISTANCE_MILES = 13.1;

const LONG_RUN_TARGET_MILES = 10;
const WEEKLY_TARGET_MILES = 20;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const LONG_RUN_METERS = 8 * METERS_PER_MILE;

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

const DAY_MS = 24 * 60 * 60 * 1000;

function weekStartMs(date: Date): number {
  const d = startOfUtcDay(date);
  const mondayIndex = (d.getUTCDay() + 6) % 7;
  return d.getTime() - mondayIndex * DAY_MS;
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

export type WeeklyVolume = {
  label: string;
  miles: number;
  longRunMiles: number;
};

export type RacePrep = {
  weeksToRace: number;
  raceName: string;
  raceDistanceMiles: number;
  longestRun: { miles: number; date: string } | null;
  coveredRaceDistance: boolean;
  windowWeeks: number;
  weeksWithLongRun: number;
  weeklyVolume: WeeklyVolume[];
  thisWeekMiles: number;
  lastWeekMiles: number;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function shortDay(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function getRacePrep(windowWeeks = 6): Promise<RacePrep> {
  const weeksToRace = Math.max(
    0,
    Math.ceil((RACE_DAY.getTime() - Date.now()) / WEEK_MS),
  );

  const latestWorkout = await prisma.workout.findFirst({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { start: "desc" },
    select: { start: true },
  });
  const anchor = latestWorkout?.start ?? new Date();
  const windowStart = startOfUtcDay(
    new Date(anchor.getTime() - windowWeeks * WEEK_MS),
  );

  const rows = await prisma.workout.findMany({
    where: { userId: SINGLETON_USER_ID, start: { gte: windowStart } },
    orderBy: { start: "desc" },
  });

  const runs = rows
    .filter((w) => isRun(w.sportName) && w.distanceMeters && w.distanceMeters > 0)
    .map((w) => ({ start: w.start, meters: w.distanceMeters as number }));

  const buckets = new Map<number, { miles: number; longRunMiles: number }>();
  for (const r of runs) {
    const wi = weekStartMs(r.start);
    const miles = r.meters / METERS_PER_MILE;
    const b = buckets.get(wi) ?? { miles: 0, longRunMiles: 0 };
    b.miles += miles;
    b.longRunMiles = Math.max(b.longRunMiles, miles);
    buckets.set(wi, b);
  }

  const anchorWeek = weekStartMs(anchor);
  const weeklyVolume: WeeklyVolume[] = [];
  for (let i = windowWeeks - 1; i >= 0; i--) {
    const wi = anchorWeek - i * WEEK_MS;
    const b = buckets.get(wi) ?? { miles: 0, longRunMiles: 0 };
    weeklyVolume.push({
      label: shortDay(wi),
      miles: round1(b.miles),
      longRunMiles: round1(b.longRunMiles),
    });
  }

  const longRunMilesThreshold = LONG_RUN_METERS / METERS_PER_MILE;
  const weeksWithLongRun = weeklyVolume.filter(
    (w) => w.longRunMiles >= longRunMilesThreshold,
  ).length;

  let longestRun: { miles: number; date: string } | null = null;
  for (const r of runs) {
    const miles = r.meters / METERS_PER_MILE;
    if (!longestRun || miles > longestRun.miles) {
      longestRun = { miles: round1(miles), date: shortDay(r.start.getTime()) };
    }
  }

  return {
    weeksToRace,
    raceName: RACE_NAME,
    raceDistanceMiles: RACE_DISTANCE_MILES,
    longestRun,
    coveredRaceDistance:
      longestRun != null && longestRun.miles >= RACE_DISTANCE_MILES,
    windowWeeks,
    weeksWithLongRun,
    weeklyVolume,
    thisWeekMiles: weeklyVolume[weeklyVolume.length - 1]?.miles ?? 0,
    lastWeekMiles: weeklyVolume[weeklyVolume.length - 2]?.miles ?? 0,
  };
}

type ZoneDurations = {
  zone_zero_milli: number;
  zone_one_milli: number;
  zone_two_milli: number;
  zone_three_milli: number;
  zone_four_milli: number;
  zone_five_milli: number;
};

const ZONE_KEYS = [
  "zone_zero_milli",
  "zone_one_milli",
  "zone_two_milli",
  "zone_three_milli",
  "zone_four_milli",
  "zone_five_milli",
] as const;

function parseZones(value: unknown): ZoneDurations | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!ZONE_KEYS.every((k) => typeof v[k] === "number")) return null;
  return Object.fromEntries(
    ZONE_KEYS.map((k) => [k, v[k] as number]),
  ) as unknown as ZoneDurations;
}

function zoneMinutes(z: ZoneDurations): number[] {
  return ZONE_KEYS.map((k) => z[k] / 60_000);
}

function easyHard(minutes: number[]): {
  easy: number;
  hard: number;
  easyPct: number | null;
} {
  const easy = minutes[1] + minutes[2];
  const hard = minutes[3] + minutes[4] + minutes[5];
  const total = easy + hard;
  return { easy, hard, easyPct: total > 0 ? (easy / total) * 100 : null };
}

export type ZoneWeek = {
  label: string;
  easyMinutes: number;
  hardMinutes: number;
  easyPct: number | null;
};

export type ZoneRun = {
  date: string;
  miles: number | null;
  minutes: number[];
  totalMinutes: number;
  easyPct: number | null;
};

export type ZoneMix = {
  weeks: ZoneWeek[];
  recentRuns: ZoneRun[];
  overallEasyPct: number | null;
  runsWithZoneData: number;
};

export async function getZoneMix(windowWeeks = 6): Promise<ZoneMix> {
  const latest = await prisma.workout.findFirst({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { start: "desc" },
    select: { start: true },
  });
  const anchor = latest?.start ?? new Date();
  const windowStart = new Date(weekStartMs(anchor) - (windowWeeks - 1) * WEEK_MS);

  const rows = await prisma.workout.findMany({
    where: { userId: SINGLETON_USER_ID, start: { gte: windowStart } },
    orderBy: { start: "desc" },
  });

  const runs = rows
    .filter((w) => isRun(w.sportName))
    .map((w) => ({ row: w, zones: parseZones(w.zoneDurations) }))
    .filter((r): r is { row: (typeof rows)[number]; zones: ZoneDurations } =>
      r.zones !== null,
    );

  const buckets = new Map<number, { easy: number; hard: number }>();
  for (const { row, zones } of runs) {
    const { easy, hard } = easyHard(zoneMinutes(zones));
    const wi = weekStartMs(row.start);
    const b = buckets.get(wi) ?? { easy: 0, hard: 0 };
    b.easy += easy;
    b.hard += hard;
    buckets.set(wi, b);
  }

  const anchorWeek = weekStartMs(anchor);
  const weeks: ZoneWeek[] = [];
  for (let i = windowWeeks - 1; i >= 0; i--) {
    const wi = anchorWeek - i * WEEK_MS;
    const b = buckets.get(wi) ?? { easy: 0, hard: 0 };
    const total = b.easy + b.hard;
    weeks.push({
      label: shortDay(wi),
      easyMinutes: Math.round(b.easy),
      hardMinutes: Math.round(b.hard),
      easyPct: total > 0 ? (b.easy / total) * 100 : null,
    });
  }

  const totals = runs.reduce(
    (acc, { zones }) => {
      const { easy, hard } = easyHard(zoneMinutes(zones));
      return { easy: acc.easy + easy, hard: acc.hard + hard };
    },
    { easy: 0, hard: 0 },
  );
  const grand = totals.easy + totals.hard;

  const recentRuns: ZoneRun[] = runs.slice(0, 5).map(({ row, zones }) => {
    const minutes = zoneMinutes(zones);
    return {
      date: shortDay(row.start.getTime()),
      miles: row.distanceMeters ? round1(row.distanceMeters / METERS_PER_MILE) : null,
      minutes,
      totalMinutes: minutes.reduce((a, b) => a + b, 0),
      easyPct: easyHard(minutes).easyPct,
    };
  });

  return {
    weeks,
    recentRuns,
    overallEasyPct: grand > 0 ? (totals.easy / grand) * 100 : null,
    runsWithZoneData: runs.length,
  };
}

export type Readiness = {
  raceName: string;
  raceDistanceMiles: number;
  raceDateLabel: string;
  daysToRace: number;
  weeksToRace: number;
  longestRun: { miles: number; date: string } | null;
  longRunTargetMiles: number;
  weeklyTargetMiles: number;
  avgWeeklyMiles: number;
  peakWeekMiles: number;
  thisWeekMiles: number;
  weeklyVolume: WeeklyVolume[];
  windowWeeks: number;
  readinessPct: number;
  longRunPct: number;
  volumePct: number;
  verdict: "ready" | "building" | "behind" | "no-data";
};

function clampFraction(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(1, Math.max(0, value / target));
}

export async function getReadiness(windowWeeks = 8): Promise<Readiness> {
  const prep = await getRacePrep(windowWeeks);

  const weeksWithMiles = prep.weeklyVolume.filter((w) => w.miles > 0);
  const avgWeeklyMiles =
    weeksWithMiles.length > 0
      ? weeksWithMiles.reduce((a, w) => a + w.miles, 0) / weeksWithMiles.length
      : 0;
  const peakWeekMiles = Math.max(...prep.weeklyVolume.map((w) => w.miles), 0);

  const longRunPct = clampFraction(
    prep.longestRun?.miles ?? 0,
    LONG_RUN_TARGET_MILES,
  );
  const volumePct = clampFraction(avgWeeklyMiles, WEEKLY_TARGET_MILES);
  const readinessPct = (longRunPct * 0.6 + volumePct * 0.4) * 100;

  const daysToRace = Math.max(
    0,
    Math.ceil((RACE_DAY.getTime() - startOfUtcDay(new Date()).getTime()) / DAY_MS),
  );

  let verdict: Readiness["verdict"];
  if (prep.longestRun === null || avgWeeklyMiles === 0) verdict = "no-data";
  else if (readinessPct >= 85) verdict = "ready";
  else if (readinessPct >= 50) verdict = "building";
  else verdict = "behind";

  return {
    raceName: RACE_NAME,
    raceDistanceMiles: RACE_DISTANCE_MILES,
    raceDateLabel: RACE_DAY.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    daysToRace,
    weeksToRace: prep.weeksToRace,
    longestRun: prep.longestRun,
    longRunTargetMiles: LONG_RUN_TARGET_MILES,
    weeklyTargetMiles: WEEKLY_TARGET_MILES,
    avgWeeklyMiles: round1(avgWeeklyMiles),
    peakWeekMiles,
    thisWeekMiles: prep.thisWeekMiles,
    weeklyVolume: prep.weeklyVolume,
    windowWeeks,
    readinessPct: Math.round(readinessPct),
    longRunPct: Math.round(longRunPct * 100),
    volumePct: Math.round(volumePct * 100),
    verdict,
  };
}

export type Taper = {
  daysToRace: number;
  daysSinceLastRun: number | null;
  raceName: string;
  raceDateLabel: string;
  raceDistanceMiles: number;
  peakWeekMiles: number;
  raceWeekMiles: number;
  reductionPct: number | null;
  hrvRecent: number | null;
  hrvBaseline: number | null;
  rhrRecent: number | null;
  rhrBaseline: number | null;
  absorbing: "yes" | "no" | "unclear";
};

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export async function getTaper(): Promise<Taper> {
  const daysToRace = Math.max(
    0,
    Math.ceil((RACE_DAY.getTime() - startOfUtcDay(new Date()).getTime()) / DAY_MS),
  );

  const prep = await getRacePrep(8);
  const peakWeekMiles = Math.max(...prep.weeklyVolume.map((w) => w.miles), 0);

  const recentWorkouts = await prisma.workout.findMany({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { start: "desc" },
    take: 60,
  });
  const lastRun = recentWorkouts.find(
    (w) => isRun(w.sportName) && w.distanceMeters && w.distanceMeters > 0,
  );
  const daysSinceLastRun = lastRun
    ? Math.floor(
        (startOfUtcDay(new Date()).getTime() - startOfUtcDay(lastRun.start).getTime()) /
          DAY_MS,
      )
    : null;

  const recoveries = await prisma.recovery.findMany({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { date: "desc" },
    take: 30,
  });
  const recent = recoveries.slice(0, 7);
  const baseline = recoveries.slice(7);

  const hrvRecent = mean(recent.map((r) => r.hrv).filter((v): v is number => v !== null));
  const hrvBaseline = mean(baseline.map((r) => r.hrv).filter((v): v is number => v !== null));
  const rhrRecent = mean(
    recent.map((r) => r.restingHeartRate).filter((v): v is number => v !== null),
  );
  const rhrBaseline = mean(
    baseline.map((r) => r.restingHeartRate).filter((v): v is number => v !== null),
  );

  let absorbing: Taper["absorbing"] = "unclear";
  if (hrvRecent !== null && hrvBaseline !== null && rhrRecent !== null && rhrBaseline !== null) {
    const hrvUp = hrvRecent >= hrvBaseline;
    const rhrDown = rhrRecent <= rhrBaseline;
    if (hrvUp && rhrDown) absorbing = "yes";
    else if (!hrvUp && !rhrDown) absorbing = "no";
  }

  return {
    daysToRace,
    daysSinceLastRun,
    raceName: RACE_NAME,
    raceDateLabel: shortDay(RACE_DAY.getTime()),
    raceDistanceMiles: RACE_DISTANCE_MILES,
    peakWeekMiles,
    raceWeekMiles: prep.thisWeekMiles,
    reductionPct:
      peakWeekMiles > 0
        ? ((peakWeekMiles - prep.thisWeekMiles) / peakWeekMiles) * 100
        : null,
    hrvRecent,
    hrvBaseline,
    rhrRecent,
    rhrBaseline,
    absorbing,
  };
}

export type EfficiencyPoint = {
  date: string;
  ef: number;
  pacePerMile: string;
  avgHr: number;
  miles: number;
  easy: boolean;
};

export type Efficiency = {
  points: EfficiencyPoint[];
  changePct: number | null;
};

export async function getEfficiency(windowWeeks = 10): Promise<Efficiency> {
  const latest = await prisma.workout.findFirst({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { start: "desc" },
    select: { start: true },
  });
  const anchor = latest?.start ?? new Date();
  const windowStart = new Date(weekStartMs(anchor) - (windowWeeks - 1) * WEEK_MS);

  const rows = await prisma.workout.findMany({
    where: { userId: SINGLETON_USER_ID, start: { gte: windowStart } },
    orderBy: { start: "asc" },
  });

  const points: EfficiencyPoint[] = [];
  for (const w of rows) {
    if (!isRun(w.sportName)) continue;
    const meters = w.distanceMeters;
    const avgHr = w.avgHr;
    const minutes = (w.end.getTime() - w.start.getTime()) / 60_000;
    if (!meters || meters <= 0 || !avgHr || avgHr <= 0 || minutes <= 0) continue;

    const metersPerMinute = meters / minutes;
    const perMile = minutes / (meters / METERS_PER_MILE);
    const paceMin = Math.floor(perMile);
    const paceSec = Math.round((perMile - paceMin) * 60);
    const zones = parseZones(w.zoneDurations);
    const easyPct = zones ? easyHard(zoneMinutes(zones)).easyPct : null;

    points.push({
      date: shortDay(w.start.getTime()),
      ef: Math.round((metersPerMinute / avgHr) * 1000) / 1000,
      pacePerMile: `${paceMin}:${paceSec.toString().padStart(2, "0")}`,
      avgHr,
      miles: round1(meters / METERS_PER_MILE),
      easy: easyPct !== null && easyPct >= 70,
    });
  }

  let changePct: number | null = null;
  if (points.length >= 4) {
    const half = Math.floor(points.length / 2);
    const first = mean(points.slice(0, half).map((p) => p.ef));
    const second = mean(points.slice(half).map((p) => p.ef));
    if (first !== null && second !== null && first > 0) {
      changePct = ((second - first) / first) * 100;
    }
  }

  return { points, changePct };
}

export async function getLastSync(): Promise<Date | null> {
  const latest = await prisma.recovery.findFirst({
    where: { userId: SINGLETON_USER_ID },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });
  return latest?.updatedAt ?? null;
}
