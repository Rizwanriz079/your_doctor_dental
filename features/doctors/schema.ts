import { z } from "zod";

const time = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");

export const sessionSchema = z.object({ start_time: time, end_time: time });

export const weekDaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  enabled: z.boolean(),
  sessions: z.array(sessionSchema),
});

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address.");

export const doctorFormSchema = z
  .object({
    id: z.guid().optional(),
    full_name: z.string().trim().min(2, "Full name is required.").max(120),
    profile_image_path: z.string().nullable(),
    qualification: z.string().trim().max(200),
    specialization: z.string().trim().min(2, "Specialization is required.").max(120),
    experience_years: z.number().int().min(0, "Must be 0 or more.").max(70, "Must be 70 or less.").nullable(),
    biography: z.string().trim().max(2000, "Keep the biography under 2000 characters."),
    service_ids: z.array(z.guid()).min(1, "Assign at least one service."),
    phone: z.string().trim().max(40),
    email: optionalEmail,
    default_appointment_duration_minutes: z
      .number({ error: "Enter a duration." })
      .int()
      .min(5, "At least 5 minutes.")
      .max(240, "At most 240 minutes."),
    buffer_minutes: z.number({ error: "Enter a buffer (0 for none)." }).int().min(0).max(120, "At most 120 minutes."),
    default_daily_capacity: z
      .number({ error: "Enter a daily limit." })
      .int("Use a whole number.")
      .min(1, "Must be at least 1."),
    week: z.array(weekDaySchema).length(7),
    status: z.enum(["active", "inactive"]),
    accepting_bookings: z.boolean(),
    show_on_homepage: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const enabled = v.week.filter((d) => d.enabled);
    if (enabled.length === 0) {
      ctx.addIssue({ code: "custom", path: ["week"], message: "Select at least one working day." });
    }
    v.week.forEach((day, di) => {
      if (!day.enabled) return;
      if (day.sessions.length === 0) {
        ctx.addIssue({ code: "custom", path: ["week", di, "sessions"], message: "Add at least one session." });
      }
      const sorted = [...day.sessions].map((s, i) => ({ ...s, i })).sort((a, b) => a.start_time.localeCompare(b.start_time));
      sorted.forEach((s, k) => {
        if (s.end_time <= s.start_time) {
          ctx.addIssue({ code: "custom", path: ["week", di, "sessions", s.i, "end_time"], message: "End must be after start." });
        }
        const prev = sorted[k - 1];
        if (prev && s.start_time < prev.end_time) {
          ctx.addIssue({ code: "custom", path: ["week", di, "sessions", s.i, "start_time"], message: "Sessions overlap." });
        }
      });
    });
  });

export type DoctorFormValues = z.infer<typeof doctorFormSchema>;

export function weekToSchedules(week: DoctorFormValues["week"]) {
  return week
    .filter((d) => d.enabled)
    .flatMap((d) => d.sessions.map((s) => ({ weekday: d.weekday, start_time: s.start_time, end_time: s.end_time })));
}

export function schedulesToWeek(rows: { weekday: number; start_time: string; end_time: string }[]): DoctorFormValues["week"] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const sessions = rows
      .filter((r) => r.weekday === weekday)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((r) => ({ start_time: r.start_time.slice(0, 5), end_time: r.end_time.slice(0, 5) }));
    return { weekday, enabled: sessions.length > 0, sessions };
  });
}

export type DoctorImpact = {
  has_impact: boolean;
  appointments_outside: { id: string; reference: string; date: string; start_time: string; patient_name: string }[];
  over_capacity_dates: { date: string; booked: number }[];
};
