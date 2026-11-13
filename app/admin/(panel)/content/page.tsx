import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ContentEditor } from "@/components/admin/content/content-editor";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Website content" };

export default async function ContentPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: settings }, { data: testimonials }] = await Promise.all([
    supabase.from("clinic_settings").select("*").eq("id", 1).single(),
    supabase.from("testimonials").select("*").order("sort_order").order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <PageHeader
        title="Website content"
        description="Edit what patients see on the website. Each section is published as soon as you save it."
        actions={
          <ButtonLink href="/" target="_blank" rel="noopener" variant="secondary">
            View website
            <ExternalLink className="size-4" aria-hidden />
          </ButtonLink>
        }
      />
      {settings ? (
        <ContentEditor settings={settings} testimonials={testimonials ?? []} />
      ) : (
        <Card>
          <EmptyState title="Clinic settings are missing" description="Run the database migrations and seed, then reload this page." />
        </Card>
      )}
    </>
  );
}
