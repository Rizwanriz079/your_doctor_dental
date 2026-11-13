import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCog, CalendarDays, Mail, Pencil, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { DoctorActions } from "@/components/admin/doctors/doctor-actions";
import { DoctorStatusBadges } from "@/components/admin/doctors/doctor-status";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Card, EmptyState } from "@/components/ui/misc";
import { getDoctorDetail } from "@/features/doctors/queries";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatTime, WEEKDAYS } from "@/lib/utils";

export const metadata = { title: "Doctor" };

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-navy-800">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

type ApptRow = {
  id: string;
  booking_reference: string;
  patient_name: string;
  appointment_date: string;
  start_time: string;
  status: string;
  services: { name: string } | null;
};

function AppointmentList({ rows, empty }: { rows: ApptRow[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-body">{empty}</p>;
  return (
    <ul className="-mx-2 divide-y divide-line">
      {rows.map((a) => (
        <li key={a.id}>
          <Link
            href={`/admin/appointments/${a.id}`}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-muted"
          >
            <span className="w-32 shrink-0 font-semibold text-navy-800">
              {formatDate(a.appointment_date, "weekday")}
              <span className="block text-xs font-normal text-body">{formatTime(a.start_time)}</span>
            </span>
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium text-navy-800">{a.patient_name}</span>
              <span className="block truncate text-xs text-body">
                {a.services?.name} · {a.booking_reference}
              </span>
            </span>
            <StatusBadge status={a.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function DoctorDetailPage({ params }: PageProps<"/admin/doctors/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { doctor, overrides, capacity, upcoming, history } = await getDoctorDetail(id);
  if (!doctor) notFound();

  const services = (doctor.doctor_services ?? []).map((s) => s.services).filter(Boolean) as {
    id: string;
    name: string;
    is_active: boolean;
  }[];
  const schedules = doctor.doctor_schedules ?? [];
  const byDay = [1, 2, 3, 4, 5, 6, 0].map((wd) => ({
    wd,
    sessions: schedules.filter((s) => s.weekday === wd).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }));

  return (
    <>
      <PageHeader
        title={doctor.full_name}
        breadcrumbs={[{ label: "Doctors", href: "/admin/doctors" }, { label: doctor.full_name }]}
        actions={
          <>
            <ButtonLink href={`/admin/availability?doctor=${doctor.id}`} variant="secondary">
              <CalendarCog className="size-4" aria-hidden />
              Availability
            </ButtonLink>
            <ButtonLink href={`/admin/doctors/${doctor.id}/edit`} variant="navy">
              <Pencil className="size-4" aria-hidden />
              Edit
            </ButtonLink>
            <DoctorActions doctor={doctor} compact={false} afterDelete="/admin/doctors" />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Avatar name={doctor.full_name} path={doctor.profile_image_path} size={72} className="rounded-2xl" />
              <div className="min-w-0">
                <p className="font-bold text-navy-800">{doctor.specialization}</p>
                {doctor.qualification && <p className="text-sm text-body">{doctor.qualification}</p>}
                {doctor.experience_years != null && <p className="text-sm text-body">{doctor.experience_years} years experience</p>}
              </div>
            </div>
            <div className="mt-4">
              <DoctorStatusBadges status={doctor.status} accepting={doctor.accepting_bookings} />
            </div>
            {doctor.biography && <p className="mt-4 text-sm leading-relaxed">{doctor.biography}</p>}
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5 text-sm">
              <div>
                <dt className="text-xs text-body">Default daily limit</dt>
                <dd className="text-lg font-bold text-navy-800">{doctor.default_daily_capacity}</dd>
              </div>
              <div>
                <dt className="text-xs text-body">Appointment length</dt>
                <dd className="text-lg font-bold text-navy-800">
                  {doctor.default_appointment_duration_minutes}
                  <span className="text-sm font-medium"> min</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-body">Buffer</dt>
                <dd className="font-semibold text-navy-800">{doctor.buffer_minutes} min</dd>
              </div>
              <div>
                <dt className="text-xs text-body">On homepage</dt>
                <dd className="font-semibold text-navy-800">{doctor.show_on_homepage ? "Yes" : "No"}</dd>
              </div>
            </dl>
            {(doctor.doctor_private?.phone || doctor.doctor_private?.email) && (
              <div className="mt-5 flex flex-col gap-2 border-t border-line pt-5 text-sm">
                <p className="text-xs text-body">Internal contact (not public)</p>
                {doctor.doctor_private?.phone && (
                  <p className="flex items-center gap-2 text-navy-800">
                    <Phone className="size-4 text-body" aria-hidden />
                    {doctor.doctor_private.phone}
                  </p>
                )}
                {doctor.doctor_private?.email && (
                  <p className="flex items-center gap-2 break-anywhere text-navy-800">
                    <Mail className="size-4 shrink-0 text-body" aria-hidden />
                    {doctor.doctor_private.email}
                  </p>
                )}
              </div>
            )}
          </Card>

          <Panel title="Services">
            {services.length === 0 ? (
              <p className="text-sm text-danger-700">No services assigned. Patients cannot book this doctor.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <Badge key={s.id} tone={s.is_active ? "brand" : "neutral"}>
                    {s.name}
                    {!s.is_active && " (inactive)"}
                  </Badge>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Weekly schedule">
            <ul className="flex flex-col gap-2 text-sm">
              {byDay.map(({ wd, sessions }) => (
                <li key={wd} className="flex items-start justify-between gap-3">
                  <span className="font-medium text-navy-800">{WEEKDAYS[wd]}</span>
                  <span className="text-right">
                    {sessions.length === 0 ? (
                      <span className="text-body">Off</span>
                    ) : (
                      sessions.map((s, i) => (
                        <span key={i} className="block">
                          {formatTime(s.start_time)}–{formatTime(s.end_time)}
                        </span>
                      ))
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel
            title={`Upcoming bookings (${upcoming.length})`}
            action={
              <Link href={`/admin/appointments?doctor=${doctor.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                View all
              </Link>
            }
          >
            <AppointmentList rows={upcoming as ApptRow[]} empty="No upcoming bookings." />
          </Panel>

          <div className="grid gap-6 xl:grid-cols-2">
            <Panel
              title="Date overrides (hours)"
              action={
                <Link href={`/admin/availability?doctor=${doctor.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
                  Manage
                </Link>
              }
            >
              {overrides.length === 0 ? (
                <p className="text-sm text-body">No upcoming leave or special hours.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {overrides.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-navy-800">{formatDate(o.schedule_date, "weekday")}</span>
                      <span className="text-right">
                        {o.is_closed ? (
                          <Badge tone="danger">Closed</Badge>
                        ) : (
                          `${formatTime(o.start_time)}–${formatTime(o.end_time)}`
                        )}
                        {o.reason && <span className="block text-xs text-body">{o.reason}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Capacity overrides">
              {capacity.length === 0 ? (
                <p className="text-sm text-body">Every upcoming date uses the default limit of {doctor.default_daily_capacity}.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {capacity.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-navy-800">{formatDate(c.capacity_date, "weekday")}</span>
                      <span className="text-right font-semibold text-navy-800">
                        {c.max_bookings} per day
                        {c.reason && <span className="block text-xs font-normal text-body">{c.reason}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel title="Recent history">
            {history.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No past appointments" className="py-6" />
            ) : (
              <AppointmentList rows={history as ApptRow[]} empty="" />
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
