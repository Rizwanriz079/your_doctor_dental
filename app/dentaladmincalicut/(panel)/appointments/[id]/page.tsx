import { CalendarDays, Clock, Hourglass, Mail, MessageSquareText, Phone, Stethoscope, Tag, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { AppointmentActions } from "@/components/admin/appointments/appointment-actions";
import { AppointmentsLiveRefresh } from "@/components/admin/appointments/live-refresh";
import { NoteForm } from "@/components/admin/appointments/note-form";
import { AppointmentTimeline } from "@/components/admin/appointments/timeline";
import { WhatsAppPanel } from "@/components/admin/appointments/whatsapp-panel";
import { getSettings } from "@/features/public/queries";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/misc";
import { getAppointmentDetail, getClinicTimezone, todayInTimezone } from "@/features/appointments/queries";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Appointment details" };

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-body">{label}</dt>
        <dd className="mt-0.5 font-semibold text-navy-800 break-anywhere">{children}</dd>
      </div>
    </div>
  );
}

export default async function AppointmentDetailPage({ params }: PageProps<"/dentaladmincalicut/appointments/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getAppointmentDetail(id);
  if (!detail) notFound();
  const { appointment: a, events } = detail;
  const [timezone, settings] = await Promise.all([getClinicTimezone(), getSettings()]);
  const today = todayInTimezone(timezone);
  const notes = events.filter((e) => e.event_type === "note");
  const history = events.filter((e) => e.event_type !== "note");

  return (
    <>
      <PageHeader
        title={`Appointment ${a.booking_reference}`}
        breadcrumbs={[{ label: "Appointments", href: "/dentaladmincalicut/appointments" }, { label: a.booking_reference }]}
        actions={<StatusBadge status={a.status} className="px-3 py-1.5 text-sm" />}
      />
      <AppointmentsLiveRefresh appointmentId={a.id} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy-800">Booking</h2>
            <dl className="mt-2 grid divide-line sm:grid-cols-2 sm:gap-x-6">
              <Row icon={<CalendarDays className="size-4" />} label="Date">
                {formatDate(a.appointment_date)}
              </Row>
              <Row icon={<Clock className="size-4" />} label="Time">
                {formatTime(a.start_time)} – {formatTime(a.end_time)}
              </Row>
              <Row icon={<Stethoscope className="size-4" />} label="Doctor">
                {a.doctors?.full_name ?? "—"}
                {a.doctors?.specialization && <span className="block text-sm font-normal text-body">{a.doctors.specialization}</span>}
              </Row>
              <Row icon={<Tag className="size-4" />} label="Service">
                {a.services?.name ?? "—"}
              </Row>
            </dl>
            <div className="mt-3 grid gap-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
              <p>
                <span className="text-body">Booked: </span>
                <span className="font-semibold text-navy-800">{formatDateTime(a.created_at)}</span>
              </p>
              {a.confirmed_at && (
                <p>
                  <span className="text-body">Confirmed: </span>
                  <span className="font-semibold text-navy-800">{formatDateTime(a.confirmed_at)}</span>
                </p>
              )}
              {a.status === "pending" && a.hold_expires_at && (
                <p className="flex items-center gap-1.5 text-warning-700 sm:col-span-2">
                  <Hourglass className="size-4" aria-hidden />
                  Pending hold expires {formatDateTime(a.hold_expires_at)} unless confirmed.
                </p>
              )}
            </div>
            {a.status_reason && (
              <div className="mt-4 rounded-xl bg-muted p-4 text-sm">
                <p className="font-semibold text-navy-800">Status reason</p>
                <p className="mt-1 whitespace-pre-line break-anywhere">{a.status_reason}</p>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy-800">Patient</h2>
            <dl className="mt-2 grid sm:grid-cols-2 sm:gap-x-6">
              <Row icon={<UserRound className="size-4" />} label="Name">
                {a.patient_id ? (
                  <Link href={`/dentaladmincalicut/patients/${a.patient_id}`} className="text-brand-700 underline-offset-2 hover:underline">
                    {a.patient_name}
                  </Link>
                ) : (
                  a.patient_name
                )}
              </Row>
              <Row icon={<Phone className="size-4" />} label="Phone">
                <a href={`tel:${a.patient_phone}`} className="text-brand-700 underline-offset-2 hover:underline">
                  {a.patient_phone}
                </a>
              </Row>
              <Row icon={<Mail className="size-4" />} label="Email">
                {a.patient_email ? (
                  <a href={`mailto:${a.patient_email}`} className="text-brand-700 underline-offset-2 hover:underline">
                    {a.patient_email}
                  </a>
                ) : (
                  <span className="font-normal text-body">Not provided</span>
                )}
              </Row>
            </dl>
            {a.patient_message && (
              <div className="mt-3 rounded-xl border border-line bg-sky-soft/60 p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold text-navy-800">
                  <MessageSquareText className="size-4 text-brand-700" aria-hidden /> Message from patient
                </p>
                <p className="mt-1.5 whitespace-pre-line break-anywhere">{a.patient_message}</p>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy-800">Status history</h2>
            <AppointmentTimeline events={history} />
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-base font-bold text-navy-800">Actions</h2>
            <AppointmentActions
              appointment={{
                id: a.id,
                status: a.status,
                doctor_id: a.doctor_id,
                service_id: a.service_id,
                appointment_date: a.appointment_date,
                start_time: a.start_time,
                today,
              }}
            />
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-2 text-base font-bold text-navy-800">Message patient</h2>
            <WhatsAppPanel
              appointment={{
                id: a.id,
                status: a.status,
                reference: a.booking_reference,
                patientName: a.patient_name,
                patientPhone: a.patient_phone,
                doctorName: a.doctors?.full_name ?? "your dentist",
                serviceName: a.services?.name ?? "your appointment",
                date: a.appointment_date,
                startTime: a.start_time,
                reason: a.status_reason,
              }}
              clinic={{ name: settings.clinic_name, phone: settings.phone, address: settings.address }}
              siteUrl={(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}
            />
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-base font-bold text-navy-800">Internal notes</h2>
            {notes.length > 0 && (
              <ul className="mb-5 space-y-3">
                {notes
                  .slice()
                  .reverse()
                  .map((n) => (
                    <li key={n.id} className="rounded-xl bg-muted p-3 text-sm">
                      <p className="whitespace-pre-line text-navy-800 break-anywhere">{n.note}</p>
                      <p className="mt-1.5 text-xs text-body">
                        {n.actor_name ?? "System"} · {formatDateTime(n.created_at)}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
            <NoteForm appointmentId={a.id} />
          </Card>
        </div>
      </div>
    </>
  );
}
