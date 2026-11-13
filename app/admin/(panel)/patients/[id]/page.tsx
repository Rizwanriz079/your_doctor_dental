import { CalendarX2, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { PatientForm } from "@/components/admin/patients/patient-form";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar, Card, EmptyState } from "@/components/ui/misc";
import { getClinicTimezone, todayInTimezone } from "@/features/appointments/queries";
import { getPatientDetail } from "@/features/patients/queries";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Patient details" };

const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-body";

export default async function PatientDetailPage({ params }: PageProps<"/admin/patients/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getPatientDetail(id);
  if (!detail) notFound();
  const { patient, appointments } = detail;
  const today = todayInTimezone(await getClinicTimezone());

  const upcoming = appointments.filter((a) => a.appointment_date >= today && (a.status === "pending" || a.status === "confirmed")).length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => ["cancelled", "rejected", "expired"].includes(a.status)).length;
  const stats = [
    { label: "Total", value: appointments.length },
    { label: "Upcoming", value: upcoming },
    { label: "Completed", value: completed },
    { label: "Cancelled / rejected", value: cancelled },
  ];

  return (
    <>
      <PageHeader title={patient.full_name} breadcrumbs={[{ label: "Patients", href: "/admin/patients" }, { label: patient.full_name }]} />

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <Avatar name={patient.full_name} size={56} className="rounded-2xl" />
              <div className="min-w-0">
                <p className="text-lg font-bold text-navy-800 break-anywhere">{patient.full_name}</p>
                <p className="text-sm">Registered {formatDate(patient.created_at, "short")}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-body">Phone</dt>
                <dd>
                  <a href={`tel:${patient.phone}`} className="font-semibold text-brand-700 hover:underline">
                    {patient.phone}
                  </a>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-body">Email</dt>
                <dd className="min-w-0 text-right break-anywhere">
                  {patient.email ? (
                    <a href={`mailto:${patient.email}`} className="font-semibold text-brand-700 hover:underline">
                      {patient.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-body">Last booking</dt>
                <dd className="font-semibold text-navy-800">{formatDateTime(patient.last_booking_at)}</dd>
              </div>
            </dl>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-base font-bold text-navy-800">Contact details</h2>
            <PatientForm patient={patient} />
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-2xl font-bold text-navy-800">{s.value}</p>
                <p className="text-sm">{s.label}</p>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 text-base font-bold text-navy-800">Appointment history</h2>
            {appointments.length === 0 ? (
              <EmptyState icon={CalendarX2} title="No appointments" description="This patient has no bookings on record." />
            ) : (
              <>
                <div className="hidden relative overflow-x-auto md:block">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-line">
                        <th scope="col" className={th}>Date</th>
                        <th scope="col" className={th}>Time</th>
                        <th scope="col" className={th}>Doctor</th>
                        <th scope="col" className={th}>Service</th>
                        <th scope="col" className={th}>Status</th>
                        <th scope="col" className={th}><span className="sr-only">View</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((a) => (
                        <tr key={a.id} className="border-b border-line last:border-0 hover:bg-muted/60">
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-navy-800">{formatDate(a.appointment_date, "short")}</td>
                          <td className="whitespace-nowrap px-4 py-3">{formatTime(a.start_time)}</td>
                          <td className="px-4 py-3">{a.doctors?.full_name ?? "—"}</td>
                          <td className="px-4 py-3">{a.services?.name ?? "—"}</td>
                          <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/admin/appointments/${a.id}`}
                              className="inline-grid size-9 place-items-center rounded-lg text-navy-700 hover:bg-navy-50"
                              aria-label={`View appointment ${a.booking_reference}`}
                            >
                              <Eye className="size-4" aria-hidden />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="divide-y divide-line md:hidden">
                  {appointments.map((a) => (
                    <li key={a.id}>
                      <Link href={`/admin/appointments/${a.id}`} className="block p-4 hover:bg-muted/60">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-navy-800">
                            {formatDate(a.appointment_date, "short")} · {formatTime(a.start_time)}
                          </p>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="mt-1 text-sm">
                          {a.doctors?.full_name ?? "—"} · {a.services?.name ?? "—"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
