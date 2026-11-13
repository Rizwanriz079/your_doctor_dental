import { History } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { AccountForm } from "@/components/admin/settings/account-form";
import { BookingSettingsForm } from "@/components/admin/settings/booking-settings-form";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Settings" };

const TABLE_LABELS: Record<string, string> = {
  doctors: "Doctor",
  doctor_private: "Doctor contact",
  services: "Service",
  doctor_schedules: "Weekly schedule",
  doctor_schedule_overrides: "Date hours",
  doctor_capacity: "Date limit",
  clinic_settings: "Settings / content",
  clinic_holidays: "Clinic closure",
  testimonials: "Testimonial",
  patients: "Patient",
};

const ACTION_TONE = { insert: "success", update: "brand", delete: "danger" } as const;

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [{ data: settings }, { data: logs }] = await Promise.all([
    supabase
      .from("clinic_settings")
      .select("timezone, booking_window_days, min_notice_minutes, pending_expiry_hours, max_daily_capacity_limit, require_email, currency")
      .eq("id", 1)
      .single(),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  const actorIds = Array.from(new Set((logs ?? []).map((l) => l.actor_id).filter((x): x is string => Boolean(x))));
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null; email: string | null }[] };
  const actorName = (id: string | null) => {
    if (!id) return "System";
    const a = actors?.find((p) => p.id === id);
    return a?.full_name || a?.email || "Unknown user";
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Booking rules for the whole clinic, and a record of recent changes."
        actions={
          <ButtonLink href="/dentaladmincalicut/content" variant="secondary">
            Edit website content
          </ButtonLink>
        }
      />
      <div className="flex flex-col gap-6">
        {settings ? (
          <BookingSettingsForm defaultValues={settings} />
        ) : (
          <Card>
            <EmptyState title="Clinic settings are missing" description="Run the database migrations and seed, then reload." />
          </Card>
        )}

        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-navy-800">Your profile</h2>
          <p className="mt-0.5 text-sm text-body">Your name and photo as shown in the dashboard. Admin roles can only be granted from the database.</p>
          <AccountForm email={admin.email} fullName={admin.fullName} avatarPath={admin.avatarPath} />
        </Card>

        <Card className="overflow-hidden">
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-navy-800">Recent changes</h2>
            <p className="mt-0.5 text-sm text-body">Who changed what and when (last 50). Field names only; values are not logged.</p>
          </div>
          {!logs || logs.length === 0 ? (
            <EmptyState icon={History} title="No changes recorded yet" className="pt-0" />
          ) : (
            <div className="relative overflow-x-auto border-t border-line">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs font-semibold text-body">
                    <th scope="col" className="px-5 py-3">When</th>
                    <th scope="col" className="px-3 py-3">Who</th>
                    <th scope="col" className="px-3 py-3">Action</th>
                    <th scope="col" className="px-3 py-3">Record</th>
                    <th scope="col" className="px-5 py-3">Fields</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {logs.map((l) => (
                    <tr key={l.id} className="align-top">
                      <td className="whitespace-nowrap px-5 py-3 text-body">{formatDateTime(l.created_at)}</td>
                      <td className="px-3 py-3 font-medium text-navy-800">{actorName(l.actor_id)}</td>
                      <td className="px-3 py-3">
                        <Badge tone={ACTION_TONE[l.action as keyof typeof ACTION_TONE] ?? "neutral"}>
                          {l.action === "insert" ? "Created" : l.action === "delete" ? "Deleted" : "Updated"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-navy-800">{TABLE_LABELS[l.table_name] ?? l.table_name}</td>
                      <td className="max-w-md px-5 py-3 text-xs text-body">
                        {l.changed_fields.length ? l.changed_fields.map((f) => f.replaceAll("_", " ")).join(", ") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
