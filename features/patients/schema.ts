import { z } from "zod";

/** Shared by the admin patient form (client) and the update action (server). */
export const patientContactSchema = z.object({
  id: z.guid(),
  fullName: z.string().trim().min(2, "Enter the patient's full name.").max(100, "Name is too long."),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d+]/g, ""))
    .pipe(z.string().regex(/^\+?\d{7,15}$/, "Enter a valid phone number, including the area code.")),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address."),
});

export type PatientContactInput = z.input<typeof patientContactSchema>;
