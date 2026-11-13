import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Please enter a valid email address."));
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Password is too long.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Please enter your password."),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." });

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(100),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d+]/g, ""))
    .pipe(z.string().regex(/^(\+?\d{7,15})?$/, "Please enter a valid phone number, including the area code.")),
});

export type SignInInput = z.input<typeof signInSchema>;
export type RegisterInput = z.input<typeof registerSchema>;
export type ForgotInput = z.input<typeof forgotSchema>;
export type ResetInput = z.input<typeof resetSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
