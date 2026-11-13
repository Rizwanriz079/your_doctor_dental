import type { MetadataRoute } from "next";
import { getActiveDoctors, getActiveServices } from "@/features/public/queries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100").replace(/\/$/, "");
  const [services, doctors] = await Promise.all([getActiveServices(), getActiveDoctors()]);
  const staticRoutes = ["", "/about", "/services", "/doctors", "/book-appointment", "/contact", "/privacy", "/terms"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  return [
    ...staticRoutes,
    ...services.map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: s.updated_at, priority: 0.6 })),
    ...doctors.map((d) => ({ url: `${base}/doctors/${d.slug}`, lastModified: d.updated_at, priority: 0.6 })),
  ];
}
