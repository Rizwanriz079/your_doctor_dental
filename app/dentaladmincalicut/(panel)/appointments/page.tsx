import { CalendarX2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { AppointmentFilters } from "@/components/admin/appointments/appointment-filters";
import { AppointmentTable } from "@/components/admin/appointments/appointment-table";
import { AppointmentsLiveRefresh } from "@/components/admin/appointments/live-refresh";
import { Card, EmptyState, Pagination } from "@/components/ui/misc";
import {
  APPOINTMENTS_PAGE_SIZE,
  getClinicTimezone,
  getFilterOptions,
  listAppointments,
  parseAppointmentFilters,
  resolveRange,
  todayInTimezone,
} from "@/features/appointments/queries";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Appointments" };

export default async function AppointmentsPage({ searchParams }: PageProps<"/dentaladmincalicut/appointments">) {
  await requireAdmin();
  const sp = await searchParams;
  const filters = parseAppointmentFilters(sp);
  const timezone = await getClinicTimezone();
  const today = todayInTimezone(timezone);
  const [{ rows, total, error }, options] = await Promise.all([listAppointments(filters, today), getFilterOptions()]);
  const { from, to } = resolveRange(filters, today);
  const pageCount = Math.max(1, Math.ceil(total / APPOINTMENTS_PAGE_SIZE));

  const rangeLabel =
    from && to
      ? from === to
        ? formatDate(from)
        : `${formatDate(from, "short")} – ${formatDate(to, "short")}`
      : from
        ? `From ${formatDate(from, "short")}`
        : "All dates";

  function hrefFor(page: number) {
    const next = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      const value = Array.isArray(v) ? v[0] : v;
      if (value && k !== "page") next.set(k, value);
    });
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    return `/dentaladmincalicut/appointments${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      <PageHeader title="Appointments" description="Review, confirm and manage patient bookings. New bookings appear automatically." />
      <AppointmentsLiveRefresh />
      <Card className="bg-muted/50 p-3 sm:p-5">
        <Suspense>
          <AppointmentFilters doctors={options.doctors} services={options.services} />
        </Suspense>

        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-navy-800">{rangeLabel}</p>
            <p className="text-sm text-body">
              {total} appointment{total === 1 ? "" : "s"}
            </p>
          </div>
          {error ? (
            <EmptyState icon={CalendarX2} title="Something went wrong" description={error} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={CalendarX2}
              title="No appointments found"
              description="No appointments match these filters. Try a different date range or clear the filters."
            />
          ) : (
            <AppointmentTable
              rows={rows.map((r) => ({
                id: r.id,
                booking_reference: r.booking_reference,
                patient_name: r.patient_name,
                appointment_date: r.appointment_date,
                start_time: r.start_time,
                end_time: r.end_time,
                status: r.status,
                created_at: r.created_at,
                doctor_name: r.doctors?.full_name ?? "—",
                service_name: r.services?.name ?? "—",
              }))}
            />
          )}
        </div>

        <div className="mt-4">
          <Pagination page={Math.min(filters.page, pageCount)} pageCount={pageCount} total={total} pageSize={APPOINTMENTS_PAGE_SIZE} hrefFor={hrefFor} />
        </div>
      </Card>
    </>
  );
}
