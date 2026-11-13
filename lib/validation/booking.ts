import { z } from "zod";

/** Shared by the booking form (client) and the booking server action. The database re-validates. */
export const patientDetailsSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100, "Name is too long."),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d+]/g, ""))
    .pipe(z.string().regex(/^\+?\d{7,15}$/, "Please enter a valid phone number, including the area code.")),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Please enter a valid email address.")
    .optional()
    .default(""),
  message: z.string().trim().max(1000, "Please keep your message under 1000 characters.").optional().default(""),
  consent: z.literal(true, { error: "Please confirm you have read the privacy notice." }),
});

export const bookingSchema = patientDetailsSchema.extend({
  serviceId: z.guid("Please choose a service."),
  doctorId: z.guid("Please choose a doctor."),
  date: z.iso.date("Please choose a date."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Please choose a time."),
});

export type PatientDetailsInput = z.input<typeof patientDetailsSchema>;
export type BookingInput = z.infer<typeof bookingSchema>;

export const lookupSchema = z.object({
  reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^(YD|LD)-[A-F0-9]{8}$/, "Enter the reference from your confirmation, e.g. YD-1A2B3C4D."),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d+]/g, ""))
    .pipe(z.string().regex(/^\+?\d{7,15}$/, "Enter the phone number used for the booking.")),
});
