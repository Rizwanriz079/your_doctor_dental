import Link from "next/link";
import { CalendarCog, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { AvailabilityGrid } from "@/components/admin/availability/availability-grid";
import { AvailabilityToolbar } from "@/components/admin/availability/availability-toolbar";
import { HolidaysManager } from "@/components/admin/availability/holidays-manager";
import type { DoctorDayOverview, RangeDay } from "@/components/admin/availability/types";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";
import { addDays, clinicToday, isDateOnly } from "@/features/availability/date";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Availability" };

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-bold text-navy-800">{title}</h2>
      {description && <p className="mb-4 mt-0.5 text-sm text-body">{description}</p>}
      {children}
    </Card>
  );
}

export default async function AvailabilityPage({ searchParams }: PageProps<"/dentaladmincalicut/availability">) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: settings }, { data: doctors }] = await Promise.all([
    supabase.from("clinic_settings").select("timezone").eq("id", 1).single(),
    supabase.from("doctors").select("id, full_name, status, default_daily_capacity").neq("status", "archived").order("full_name"),
  ]);
  const today = clinicToday(settings?.timezone ?? "UTC");
  const days = one(sp.days) === "28" ? 28 : 14;
  const fromParam = one(sp.from);
  const from = isDateOnly(fromParam) ? fromParam : today;
  const doctorList = doctors ?? [];
  const doctor = doctorList.find((d) => d.id === one(sp.doctor)) ?? doctorList[0];

  if (!doctor) {
    return (
      <>
        <PageHeader title="Availability & capacity" />
        <Card>
          <EmptyState
            icon={CalendarCog}
            title="No doctors have been added yet."
            description="Add a doctor with a weekly schedule to manage availability."
            action={
              <ButtonLink href="/dentaladmincalicut/doctors/new" variant="navy">
                <Plus className="size-4" aria-hidden />
                Add Doctor
              </ButtonLink>
            }
          />
        </Card>
      </>
    );
  }

  const [rangeRes, overviewRes, holidaysRes] = await Promise.all([
    supabase.rpc("admin_doctor_range", { p_doctor: doctor.id, p_from: from, p_to: addDays(from, days - 1) }),
    supabase.rpc("admin_day_overview", { p_date: today }),
    supabase.from("clinic_holidays").select("id, holiday_date, name").gte("holiday_date", today).order("holiday_date").limit(30),
  ]);
  const range = (rangeRes.data ?? []) as unknown as RangeDay[];
  const overview = ((overviewRes.data ?? []) as unknown as DoctorDayOverview[]).filter((d) => d.status === "active");

  return (
    <>
      <PageHeader
        title="Availability & capacity"
        description="Set date-specific booking limits, leave and special hours. Select a day to change it."
        actions={
          <ButtonLink href={`/dentaladmincalicut/doctors/${doctor.id}/edit`} variant="secondary">
            Edit weekly schedule
          </ButtonLink>
        }
      />

      <div className="flex flex-col gap-6">
        <Card className="p-4 sm:p-6">
          <AvailabilityToolbar doctors={doctorList} doctorId={doctor.id} from={from} days={days} today={today} />
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-body">
            <span>
              Default limit: <strong className="text-navy-800">{doctor.default_daily_capacity} per day</strong>
            </span>
            {doctor.status !== "active" && <Badge tone="neutral">Inactive: not bookable online</Badge>}
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-brand-500" aria-hidden /> Bookings so far
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-warning-500" aria-hidden /> Fully booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-danger-600" aria-hidden /> Over capacity
            </span>
          </div>
          <div className="mt-4">
            {rangeRes.error ? (
              <EmptyState title="Availability could not be loaded" description="Please refresh the page and try again." />
            ) : (
              <AvailabilityGrid
                days={range}
                doctorId={doctor.id}
                doctorName={doctor.full_name}
                defaultCapacity={doctor.default_daily_capacity}
                today={today}
              />
            )}
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
          <Section title={`Today across all doctors · ${formatDate(today, "weekday")}`} description="Effective capacity and active bookings for today.">
            {overview.length === 0 ? (
              <p className="text-sm text-body">No active doctors.</p>
            ) : (
              <div className="-mx-1 relative overflow-x-auto">
                <table className="w-full min-w-[28rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs text-body">
                      <th scope="col" className="px-1 py-2 font-semibold">Doctor</th>
                      <th scope="col" className="px-1 py-2 text-right font-semibold">Limit</th>
                      <th scope="col" className="px-1 py-2 text-right font-semibold">Booked</th>
                      <th scope="col" className="px-1 py-2 text-right font-semibold">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {overview.map((d) => {
                      const remaining = Math.max(d.capacity - d.booked, 0);
                      return (
                        <tr key={d.doctor_id}>
                          <td className="px-1 py-2.5">
                            <Link
                              href={`/dentaladmincalicut/availability?doctor=${d.doctor_id}&from=${today}&days=${days}`}
                              className="font-semibold text-navy-800 hover:text-brand-700"
                            >
                              {d.full_name}
                            </Link>
                            {!d.accepting_bookings && <span className="ml-2 text-xs text-warning-700">Paused</span>}
                          </td>
                          <td className="px-1 py-2.5 text-right tabular-nums">
                            {d.scheduled ? d.capacity : "Off"}
                            {d.has_override && <span className="ml-1 text-xs text-brand-700">*</span>}
                          </td>
                          <td className="px-1 py-2.5 text-right tabular-nums">{d.booked}</td>
                          <td className="px-1 py-2.5 text-right font-semibold tabular-nums">
                            {!d.scheduled ? (
                              <span className="text-body">—</span>
                            ) : remaining === 0 ? (
                              <span className="text-warning-700">Full</span>
                            ) : (
                              <span className="text-success-700">{remaining}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="mt-2 px-1 text-xs text-body">* date-specific limit set</p>
              </div>
            )}
          </Section>

          <Section title="Clinic closures" description="Public holidays and whole-clinic closures. No doctor can be booked on these dates.">
            <HolidaysManager holidays={holidaysRes.data ?? []} today={today} />
          </Section>
        </div>
      </div>
    </>
  );
}
