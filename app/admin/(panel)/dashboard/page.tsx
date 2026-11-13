import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellOff, CalendarCheck2, CalendarDays, CalendarPlus, Plus, Stethoscope } from "lucide-react";
import { BookingTrendChart, StatusChart, UtilisationChart } from "@/components/admin/dashboard/charts";
import { StatCards } from "@/components/admin/dashboard/stat-cards";
import { PageHeader } from "@/components/admin/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";
import { getDashboardData } from "@/features/dashboard/queries";
import { notificationHref } from "@/components/admin/notifications/notification-href";
import { requireAdmin } from "@/lib/auth";
import { cn, formatDate, formatTime, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

type ApptRow = {
  id: string;
  booking_reference: string;
  patient_name: string;
  appointment_date: string;
  start_time: string;
  status: string;
  doctors: { full_name: string } | null;
  services: { name: string } | null;
};

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const data = await getDashboardData(admin.userId);
  const firstName = admin.fullName.split(" ")[0];

  const utilisation = data.dayOverview
    .filter((d) => d.scheduled || d.booked > 0)
    .map((d) => ({ name: d.full_name, booked: d.booked, capacity: d.capacity }));

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={`Here's what's happening at the clinic today, ${formatDate(data.today)}.`}
        actions={
          <>
            <ButtonLink href="/admin/appointments" variant="secondary">
              <CalendarDays className="size-4" aria-hidden />
              Appointments
            </ButtonLink>
            <ButtonLink href="/admin/doctors/new" variant="navy">
              <Plus className="size-4" aria-hidden />
              Add doctor
            </ButtonLink>
          </>
        }
      />

      {data.errors && (
        <p role="alert" className="mb-4 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700">
          Some dashboard data could not be loaded. Refresh the page to try again.
        </p>
      )}

      <StatCards stats={data.stats} />

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="min-w-0 overflow-hidden">
          <SectionHead title="Today's appointments" href="/admin/appointments?range=today" />
          {data.todayList.length === 0 ? (
            <EmptyState
              icon={CalendarCheck2}
              title="No appointments today"
              description="Bookings for today will appear here as they come in."
            />
          ) : (
            <ul className="divide-y divide-line">
              {(data.todayList as ApptRow[]).map((a) => (
                <AppointmentRow key={a.id} a={a} />
              ))}
            </ul>
          )}
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <SectionHead title="Capacity remaining today" href="/admin/availability" linkLabel="Availability" />
          {data.dayOverview.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No active doctors" action={<ButtonLink href="/admin/doctors/new" size="sm">Add doctor</ButtonLink>} />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[22rem] text-sm">
                <caption className="sr-only">Remaining capacity per doctor today</caption>
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-body">
                    <th scope="col" className="px-4 py-2.5 sm:px-5">Doctor</th>
                    <th scope="col" className="px-2 py-2.5 text-right">Limit</th>
                    <th scope="col" className="px-2 py-2.5 text-right">Booked</th>
                    <th scope="col" className="px-4 py-2.5 text-right sm:px-5">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.dayOverview.map((d) => {
                    const remaining = Math.max(d.capacity - d.booked, 0);
                    return (
                      <tr key={d.doctor_id}>
                        <th scope="row" className="px-4 py-3 text-left font-semibold text-navy-800 sm:px-5">
                          <Link href={`/admin/doctors/${d.doctor_id}`} className="hover:text-brand-700">
                            {d.full_name}
                          </Link>
                          {d.has_override && <span className="ml-1.5 text-xs font-medium text-brand-700">(override)</span>}
                        </th>
                        <td className="px-2 py-3 text-right tabular-nums">{d.scheduled ? d.capacity : "—"}</td>
                        <td className="px-2 py-3 text-right tabular-nums">{d.booked}</td>
                        <td className="px-4 py-3 text-right sm:px-5">
                          {!d.scheduled ? (
                            <Badge tone="neutral">Not working</Badge>
                          ) : !d.accepting_bookings ? (
                            <Badge tone="warning">Paused</Badge>
                          ) : remaining === 0 ? (
                            <Badge tone="danger">Fully booked</Badge>
                          ) : (
                            <Badge tone="success">{remaining} left</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <BookingTrendChart data={data.trend} />
        <StatusChart data={data.statusCounts} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <UtilisationChart data={utilisation} />
        <div className="grid min-w-0 gap-6">
          <Card className="min-w-0 overflow-hidden">
            <SectionHead title="Upcoming · next 7 days" href="/admin/appointments?range=week" />
            {data.upcoming.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Nothing upcoming" description="No pending or confirmed bookings in the next week." />
            ) : (
              <ul className="divide-y divide-line">
                {(data.upcoming as ApptRow[]).map((a) => (
                  <AppointmentRow key={a.id} a={a} showDate />
                ))}
              </ul>
            )}
          </Card>
          <Card className="min-w-0 overflow-hidden">
            <SectionHead title="Recent notifications" href="/admin/notifications" />
            {data.recentNotifications.length === 0 ? (
              <EmptyState icon={BellOff} title="No notifications yet" />
            ) : (
              <ul className="divide-y divide-line">
                {data.recentNotifications.map((n) => (
                  <li key={n.id}>
                    <Link href={notificationHref(n)} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted sm:px-5">
                      <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", n.is_read ? "bg-muted text-body" : "bg-brand-50 text-brand-700")}>
                        <CalendarPlus className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block text-sm text-navy-800", !n.is_read && "font-bold")}>
                          {n.title}
                          {!n.is_read && <span className="sr-only"> (unread)</span>}
                        </span>
                        <span className="line-clamp-2 block text-sm text-body">{n.message}</span>
                        <span className="text-xs text-navy-300">{relativeTime(n.created_at)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function SectionHead({ title, href, linkLabel = "View all" }: { title: string; href: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
      <h2 className="text-base font-bold">{title}</h2>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
        {linkLabel}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

function AppointmentRow({ a, showDate }: { a: ApptRow; showDate?: boolean }) {
  return (
    <li>
      <Link
        href={`/admin/appointments/${a.id}`}
        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-muted sm:flex-nowrap sm:px-5"
      >
        <span className="w-20 shrink-0">
          <span className="block text-sm font-bold tabular-nums text-navy-800">{formatTime(a.start_time)}</span>
          {showDate && <span className="block text-xs text-body">{formatDate(a.appointment_date, "weekday")}</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-navy-800">{a.patient_name}</span>
          <span className="block truncate text-xs text-body">
            {a.doctors?.full_name ?? "—"} · {a.services?.name ?? "—"}
          </span>
        </span>
        <StatusBadge status={a.status} />
      </Link>
    </li>
  );
}
