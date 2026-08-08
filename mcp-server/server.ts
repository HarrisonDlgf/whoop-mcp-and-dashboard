import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prisma, SINGLETON_USER_ID } from "./db";

function day(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function json(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function since(days: number): Date {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  cutoff.setUTCHours(0, 0, 0, 0);
  return cutoff;
}

function safe<Args extends unknown[]>(
  handler: (...args: Args) => Promise<ReturnType<typeof json>>,
) {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("whoop-data tool failed:", error);
      return {
        ...json({
          error:
            "Could not read from the WHOOP database. The database may be " +
            "unreachable or DATABASE_URL may be wrong.",
        }),
        isError: true,
      };
    }
  };
}

export function createWhoopServer(): McpServer {
  const server = new McpServer({ name: "whoop-data", version: "0.2.0" });

  server.registerTool(
    "get_latest_readout",
    {
      title: "Latest readout",
      description:
        "Harrison's most recent WHOOP morning readout: recovery score, HRV, " +
        "resting heart rate, and last night's sleep. Start here for 'how am I " +
        "doing today?' questions.",
      inputSchema: {},
    },
    safe(async () => {
      const recovery = await prisma.recovery.findFirst({
        where: { userId: SINGLETON_USER_ID },
        orderBy: { date: "desc" },
      });
      if (!recovery) {
        return json({ error: "No recovery data synced yet." });
      }

      const sleep = await prisma.sleep.findFirst({
        where: { userId: SINGLETON_USER_ID, date: recovery.date, nap: false },
      });

      return json({
        date: day(recovery.date),
        recoveryScore: recovery.recoveryScore,
        hrv: recovery.hrv,
        restingHeartRate: recovery.restingHeartRate,
        sleep: sleep && {
          performancePct: sleep.sleepPerformancePct,
          durationMinutes: sleep.durationMinutes,
          start: sleep.sleepStart?.toISOString() ?? null,
        },
      });
    }),
  );

  server.registerTool(
    "get_recovery_trends",
    {
      title: "Recovery trends",
      description:
        "Daily recovery score, HRV (ms), and resting heart rate for the last N " +
        "days, oldest first. Use for trend and pattern questions.",
      inputSchema: {
        days: z.number().int().min(1).max(180).default(14),
      },
    },
    safe(async ({ days }) => {
      const rows = await prisma.recovery.findMany({
        where: { userId: SINGLETON_USER_ID, date: { gte: since(days) } },
        orderBy: { date: "asc" },
      });

      return json(
        rows.map((r) => ({
          date: day(r.date),
          recoveryScore: r.recoveryScore,
          hrv: r.hrv,
          restingHeartRate: r.restingHeartRate,
        })),
      );
    }),
  );

  server.registerTool(
    "get_sleeps",
    {
      title: "Sleep history",
      description:
        "Sleep records for the last N days, newest first: performance %, time " +
        "asleep in minutes, bedtime, and whether it was a nap.",
      inputSchema: {
        days: z.number().int().min(1).max(180).default(7),
      },
    },
    safe(async ({ days }) => {
      const rows = await prisma.sleep.findMany({
        where: { userId: SINGLETON_USER_ID, date: { gte: since(days) } },
        orderBy: { date: "desc" },
      });

      return json(
        rows.map((s) => ({
          date: day(s.date),
          performancePct: s.sleepPerformancePct,
          durationMinutes: s.durationMinutes,
          start: s.sleepStart?.toISOString() ?? null,
          nap: s.nap,
        })),
      );
    }),
  );

  server.registerTool(
    "get_workouts",
    {
      title: "Workout history",
      description:
        "Workouts for the last N days, newest first: sport, strain, heart " +
        "rate, distance (meters), and duration. Optionally filter by sport " +
        "name (e.g. 'running', 'weightlifting').",
      inputSchema: {
        days: z.number().int().min(1).max(180).default(7),
        sport: z.string().optional(),
      },
    },
    safe(async ({ days, sport }) => {
      const rows = await prisma.workout.findMany({
        where: {
          userId: SINGLETON_USER_ID,
          start: { gte: since(days) },
          ...(sport
            ? { sportName: { contains: sport, mode: "insensitive" } }
            : {}),
        },
        orderBy: { start: "desc" },
      });

      return json(
        rows.map((w) => ({
          start: w.start.toISOString(),
          sport: w.sportName,
          durationMinutes: Math.round(
            (w.end.getTime() - w.start.getTime()) / 60_000,
          ),
          strain: w.strain,
          avgHr: w.avgHr,
          maxHr: w.maxHr,
          distanceMeters: w.distanceMeters,
        })),
      );
    }),
  );

  return server;
}

export function disconnectOnExit(): void {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      void prisma.$disconnect().finally(() => process.exit(0));
    });
  }
}
