import "server-only";
import { prisma, SINGLETON_USER_ID } from "@/lib/db";
import { getRecoveries, getSleeps, getWorkouts } from "@/lib/whoop/api";
import { mapRecovery, mapSleep, mapWorkout } from "@/lib/whoop/mappers";
// pull and update
export async function syncWhoop(days: number) {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const recoveries = await getRecoveries(start);
  const sleeps = await getSleeps(start);
  const workouts = await getWorkouts(start);

  for (const record of recoveries) {
    const data = mapRecovery(record);
    await prisma.recovery.upsert({
      where: {
        source_sourceId: { source: "WHOOP", sourceId: data.sourceId },
      },
      update: data,
      create: { ...data, userId: SINGLETON_USER_ID },
    });
  }

  for (const record of sleeps) {
    const data = mapSleep(record);
    await prisma.sleep.upsert({
      where: {
        source_sourceId: { source: "WHOOP", sourceId: data.sourceId },
      },
      update: data,
      create: { ...data, userId: SINGLETON_USER_ID },
    });
  }

  for (const record of workouts) {
    const data = mapWorkout(record);
    await prisma.workout.upsert({
      where: {
        source_sourceId: { source: "WHOOP", sourceId: data.sourceId },
      },
      update: data,
      create: { ...data, userId: SINGLETON_USER_ID },
    });
  }

  return {
    days,
    recoveries: recoveries.length,
    sleeps: sleeps.length,
    workouts: workouts.length,
  };
}
