/** Every scored WHOOP resource carries one of these. `score` is only
 * meaningful when this is "SCORED". */
export type ScoreState = "SCORED" | "PENDING_SCORE" | "UNSCORABLE";

export type CollectionPage<T> = {
  records: T[];
  next_token: string | null;
};

export type WhoopRecovery = {
  cycle_id: number;
  sleep_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: ScoreState;
  score?: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number | null;
    skin_temp_celsius: number | null;
  } | null;
};

export type WhoopSleep = {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string; // e.g. "-05:00"
  nap: boolean;
  score_state: ScoreState;
  score?: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  } | null;
};

export type WhoopWorkout = {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_name: string;
  score_state: ScoreState;
  score?: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter: number;
    altitude_gain_meter: number;
    altitude_change_meter: number;
    zone_durations: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  } | null;
};
