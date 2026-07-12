import type { WhoopRecovery, WhoopSleep, WhoopWorkout } from "@/lib/whoop/types";

// the day the data was filed
function calendarDay(iso: string, timezoneOffset?: string): Date {
  let ms = new Date(iso).getTime();

  const match = timezoneOffset?.match(/^([+-])(\d{2}):(\d{2})$/);
  if (match) {
    const sign = match[1] === "-" ? -1 : 1;
    ms += sign * (Number(match[2]) * 60 + Number(match[3])) * 60_000;
  }

  const shifted = new Date(ms);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
    ),
  );
}

export function mapRecovery(rec: WhoopRecovery) {
 // checks for non scored days
  const score = rec.score_state === "SCORED" ? (rec.score ?? null) : null;

  return {
    sourceId: String(rec.cycle_id),
    date: calendarDay(rec.created_at),
    recoveryScore: score?.recovery_score ?? null,
    hrv: score?.hrv_rmssd_milli ?? null,
    restingHeartRate: score?.resting_heart_rate ?? null,
    raw: rec,
  };
}

export function mapSleep(sleep: WhoopSleep) {
  const score = sleep.score_state === "SCORED" ? (sleep.score ?? null) : null;
  const stages = score?.stage_summary;
  const asleepMilli = stages
    ? stages.total_light_sleep_time_milli +
      stages.total_slow_wave_sleep_time_milli +
      stages.total_rem_sleep_time_milli
    : null;

  return {
    sourceId: sleep.id,
    date: calendarDay(sleep.end, sleep.timezone_offset),
    sleepPerformancePct: score?.sleep_performance_percentage ?? null,
    durationMinutes: asleepMilli === null ? null : Math.round(asleepMilli / 60_000),
    sleepStart: new Date(sleep.start),
    nap: sleep.nap,
    raw: sleep,
  };
}

export function mapWorkout(workout: WhoopWorkout) {
  const score = workout.score_state === "SCORED" ? (workout.score ?? null) : null;

  return {
    sourceId: workout.id,
    start: new Date(workout.start),
    end: new Date(workout.end),
    sportName: workout.sport_name,
    strain: score?.strain ?? null,
    avgHr: score?.average_heart_rate ?? null,
    maxHr: score?.max_heart_rate ?? null,
    distanceMeters: score?.distance_meter ?? null,
    zoneDurations: score?.zone_durations ?? undefined,
    raw: workout,
  };
}
