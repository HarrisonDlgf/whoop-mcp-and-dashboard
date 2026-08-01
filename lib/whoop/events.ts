import "server-only";
import { prisma, SINGLETON_USER_ID } from "@/lib/db";
import { getRecoveries, getSleepById, getWorkoutById } from "@/lib/whoop/api";
import { mapRecovery, mapSleep, mapWorkout } from "@/lib/whoop/mappers";

export type WhoopWebhookEvent = {
  user_id: number;
  id: string;
  type: string;
  trace_id: string;
};

export async function processWhoopEvent(event: WhoopWebhookEvent): Promise<void> {
  const { type, id } = event;

  switch (type) {
    case "sleep.updated": {
      const data = mapSleep(await getSleepById(id));
      await prisma.sleep.upsert({
        where: { source_sourceId: { source: "WHOOP", sourceId: data.sourceId } },
        update: data,
        create: { ...data, userId: SINGLETON_USER_ID },
      });
      return;
    }
    case "workout.updated": {
      const data = mapWorkout(await getWorkoutById(id));
      await prisma.workout.upsert({
        where: { source_sourceId: { source: "WHOOP", sourceId: data.sourceId } },
        update: data,
        create: { ...data, userId: SINGLETON_USER_ID },
      });
      return;
    }
    case "recovery.updated": {
      const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const match = (await getRecoveries(since)).find((r) => r.sleep_id === id);
      if (!match) return;
      const data = mapRecovery(match);
      await prisma.recovery.upsert({
        where: { source_sourceId: { source: "WHOOP", sourceId: data.sourceId } },
        update: data,
        create: { ...data, userId: SINGLETON_USER_ID },
      });
      return;
    }
    case "sleep.deleted":
      await prisma.sleep.deleteMany({ where: { source: "WHOOP", sourceId: id } });
      return;
    case "workout.deleted":
      await prisma.workout.deleteMany({ where: { source: "WHOOP", sourceId: id } });
      return;
    case "recovery.deleted":
      await prisma.recovery.deleteMany({
        where: { source: "WHOOP", raw: { path: ["sleep_id"], equals: id } },
      });
      return;
  }
}
