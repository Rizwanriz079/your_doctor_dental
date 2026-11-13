import { z } from "zod";

export const bookingSettingsSchema = z.object({
  timezone: z
    .string()
    .min(1, "Choose a time zone.")
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    }, "Choose a valid time zone."),
  booking_window_days: z.number({ error: "Enter a number." }).int().min(1, "At least 1 day.").max(365, "At most 365 days."),
  min_notice_minutes: z.number({ error: "Enter a number." }).int().min(0).max(10080, "At most 7 days (10080 minutes)."),
  pending_expiry_hours: z.number().int().min(1, "At least 1 hour.").max(720, "At most 720 hours (30 days).").nullable(),
  max_daily_capacity_limit: z.number({ error: "Enter a number." }).int().min(1).max(1000, "At most 1000."),
  require_email: z.boolean(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Use a 3-letter ISO code such as INR, USD or EUR."),
});

export type BookingSettingsValues = z.input<typeof bookingSettingsSchema>;
