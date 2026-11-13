import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);
const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/i.test(v), "Use a full https:// link.");

export const BENEFIT_ICONS = ["stethoscope", "scan", "calendar", "heart", "shield", "sparkles", "clock", "smile"] as const;

const titleText = z.object({ title: z.string().trim().min(1, "Title is required.").max(60), text: text(240) });

export const contentSchemas = {
  brand: z.object({
    clinic_name: z.string().trim().min(2, "Clinic name is required.").max(80),
    tagline: text(120),
    logo_path: z.string().nullable(),
  }),
  hero: z.object({
    hero_eyebrow: text(80),
    hero_heading: z.string().trim().min(5, "Heading is required.").max(120),
    hero_text: text(400),
    hero_image_path: z.string().nullable(),
    hero_highlights: z.array(z.object({ title: z.string().trim().min(1, "Title is required.").max(40), text: text(80) })).max(4, "Up to 4 highlights."),
  }),
  highlights: z.object({
    benefits: z
      .array(titleText.extend({ icon: z.enum(BENEFIT_ICONS) }))
      .max(8, "Up to 8 benefits."),
    stats: z
      .array(
        z.object({
          value: z.number({ error: "Enter a number." }).min(0).max(10_000_000),
          suffix: text(4),
          label: z.string().trim().min(1, "Label is required.").max(60),
        }),
      )
      .max(4, "Up to 4 statistics."),
  }),
  about: z.object({
    about_heading: z.string().trim().min(2, "Heading is required.").max(120),
    about_overview: text(3000),
    mission: text(1500),
    clinic_values: z.array(titleText).max(6, "Up to 6 values."),
    facilities: text(2000),
    technology: text(2000),
  }),
  gallery: z.object({
    gallery: z
      .array(z.object({ path: z.string().min(1, "Upload an image."), alt: z.string().trim().min(3, "Describe the image for screen readers.").max(160) }))
      .max(24, "Up to 24 images."),
  }),
  contact: z.object({
    phone: text(40),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address."),
    address: text(300),
    map_url: url,
    map_embed_url: url,
    opening_hours: z
      .array(z.object({ label: z.string().trim().min(1, "Day(s) required.").max(40), hours: z.string().trim().min(1, "Hours required.").max(60) }))
      .max(10),
    social_links: z.object({
      facebook: url.optional().default(""),
      instagram: url.optional().default(""),
      x: url.optional().default(""),
      youtube: url.optional().default(""),
      linkedin: url.optional().default(""),
      tiktok: url.optional().default(""),
    }),
    footer_text: text(300),
  }),
  legal: z.object({
    privacy_text: text(20000),
    terms_text: text(20000),
  }),
} as const;

export type ContentSection = keyof typeof contentSchemas;
export type ContentValues<S extends ContentSection> = z.input<(typeof contentSchemas)[S]>;

export const testimonialSchema = z
  .object({
    id: z.guid().optional(),
    author_display: z.string().trim().min(1, "Name or initials are required.").max(80),
    content: z.string().trim().min(5, "Testimonial text is required.").max(1200),
    rating: z.number().int().min(1).max(5).nullable(),
    consent_confirmed: z.boolean(),
    is_approved: z.boolean(),
    sort_order: z.number().int().min(0).max(9999),
  })
  .refine((v) => !v.is_approved || v.consent_confirmed, {
    path: ["is_approved"],
    message: "Confirm the patient's consent before approving.",
  });

export type TestimonialValues = z.infer<typeof testimonialSchema>;
