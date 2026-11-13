/** One entry of rpc admin_doctor_range. */
export type RangeDay = {
  date: string;
  weekday: number;
  scheduled: boolean;
  intervals: { start: string; end: string }[];
  capacity: number;
  booked: number;
  remaining: number;
  over_capacity: boolean;
  capacity_override: { max_bookings: number; reason: string } | null;
  schedule_override: { is_closed: boolean; start_time: string | null; end_time: string | null; reason: string } | null;
  holiday: string | null;
};

/** One entry of rpc admin_day_overview. */
export type DoctorDayOverview = {
  doctor_id: string;
  full_name: string;
  status: string;
  accepting_bookings: boolean;
  scheduled: boolean;
  capacity: number;
  has_override: boolean;
  booked: number;
};
