import { z } from "zod";

export const serviceFormSchema = z
  .object({
    id: z.guid().optional(),
    name: z.string().trim().min(2, "Service name is required.").max(120),
    slug: z
      .string()
      .trim()
      .min(2, "URL slug is required.")
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens."),
    category: z.string().trim().min(2, "Category is required.").max(60),
    short_description: z.string().trim().max(300, "Keep the summary under 300 characters."),
    description: z.string().trim().max(5000),
    procedure_details: z.string().trim().max(5000),
    image_path: z.string().nullable(),
    duration_minutes: z.number().int().min(5, "At least 5 minutes.").max(480, "At most 480 minutes.").nullable(),
    price: z.number().min(0, "Price cannot be negative.").max(1_000_000).nullable(),
    show_price: z.boolean(),
    is_active: z.boolean(),
    is_featured: z.boolean(),
    sort_order: z.number({ error: "Enter a number." }).int().min(0).max(9999),
    doctor_ids: z.array(z.guid()),
  })
  .refine((v) => !v.show_price || v.price != null, { path: ["price"], message: "Enter a price or turn off “Show price”." });

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
