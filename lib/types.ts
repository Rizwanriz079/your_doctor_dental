import type { Database } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];

export type ClinicSettings = Tables["clinic_settings"]["Row"];
export type Service = Tables["services"]["Row"];
export type Doctor = Tables["doctors"]["Row"];
export type DoctorSchedule = Tables["doctor_schedules"]["Row"];
export type ScheduleOverride = Tables["doctor_schedule_overrides"]["Row"];
export type CapacityOverride = Tables["doctor_capacity"]["Row"];
export type Appointment = Tables["appointments"]["Row"];
export type AppointmentEvent = Tables["appointment_events"]["Row"];
export type Patient = Tables["patients"]["Row"];
export type Notification = Tables["notifications"]["Row"];
export type Testimonial = Tables["testimonials"]["Row"];
export type Holiday = Tables["clinic_holidays"]["Row"];

export type AppointmentStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "completed" | "expired";

export type DoctorWithServices = Doctor & {
  services: Pick<Service, "id" | "name" | "slug">[];
  schedules?: Pick<DoctorSchedule, "weekday" | "start_time" | "end_time">[];
};

/** JSON returned by get_available_slots / admin_get_slots. */
export type DayAvailability = {
  date: string;
  bookable: boolean;
  reason:
    | null
    | "doctor_unavailable"
    | "service_unavailable"
    | "service_not_offered"
    | "date_in_past"
    | "beyond_booking_window"
    | "date_blocked"
    | "not_scheduled"
    | "fully_booked"
    | "no_slots_left";
  scheduled: boolean;
  blocked: boolean;
  capacity: number;
  booked: number;
  remaining: number;
  fully_booked: boolean;
  duration_minutes: number | null;
  slots: { start: string; end: string; available: boolean }[];
};

/** JSON returned by get_doctor_calendar. */
export type CalendarDay = {
  date: string;
  status: "available" | "full" | "closed" | "out_of_range" | "unavailable";
  remaining: number;
};

export type BookingResult =
  | {
      ok: true;
      reference: string;
      status: "pending";
      doctor_name: string;
      service_name: string;
      date: string;
      start_time: string;
      end_time: string;
    }
  | { ok: false; code: string; message: string };

/** Standard shape returned by server actions. */
export type ActionResult<T = undefined> =
  | ({ ok: true; message?: string } & (T extends undefined ? object : { data: T }))
  | { ok: false; message: string; code?: string; fieldErrors?: Record<string, string[] | undefined>; details?: unknown };

export type Benefit = { title: string; text: string; icon?: string };
export type Stat = { value: number; suffix?: string; label: string };
export type OpeningHour = { label: string; hours: string };
export type GalleryImage = { path: string; alt: string };
export type SocialLinks = Partial<Record<"facebook" | "instagram" | "x" | "youtube" | "linkedin" | "tiktok", string>>;
