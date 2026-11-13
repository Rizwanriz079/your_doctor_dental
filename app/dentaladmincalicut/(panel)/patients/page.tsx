import { ChevronRight, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { PatientSearch } from "@/components/admin/patients/patient-search";
import { Avatar, Card, EmptyState, Pagination } from "@/components/ui/misc";
import { PATIENTS_PAGE_SIZE, listPatients } from "@/features/patients/queries";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Patients" };

const th = "px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-body";

export default async function PatientsPage({ searchParams }: PageProps<"/dentaladmincalicut/patients">) {
  await requireAdmin();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const q = one(sp.q);
  const sortRaw = one(sp.sort);
  const sort = sortRaw === "name" || sortRaw === "registered" ? sortRaw : "recent";
  const page = Math.max(1, Number.parseInt(one(sp.page) ?? "1", 10) || 1);
  const { rows, total, error } = await listPatients({ q, page, sort });
  const pageCount = Math.max(1, Math.ceil(total / PATIENTS_PAGE_SIZE));

  const hrefFor = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (sort !== "recent") next.set("sort", sort);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return `/dentaladmincalicut/patients${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Patients" description="Patients are created automatically from bookings and matched by phone number." />
      <Card className="bg-muted/50 p-3 sm:p-5">
        <Suspense>
          <PatientSearch />
        </Suspense>
        <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white">
          {error ? (
            <EmptyState icon={Users} title="Something went wrong" description={error} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title={q ? "No patients match your search" : "No patients yet"}
              description={q ? "Try a different name, phone number or email." : "Patients appear here after their first booking."}
            />
          ) : (
            <>
              <div className="hidden relative overflow-x-auto md:block">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      <th scope="col" className={th}>Patient</th>
                      <th scope="col" className={th}>Phone</th>
                      <th scope="col" className={th}>Email</th>
                      <th scope="col" className={th}>Appointments</th>
                      <th scope="col" className={th}>Last booking</th>
                      <th scope="col" className={th}>Registered</th>
                      <th scope="col" className={th}><span className="sr-only">Open</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.id} className="border-b border-line transition-colors last:border-0 hover:bg-muted/60">
                        <td className="px-4 py-3">
                          <Link href={`/dentaladmincalicut/patients/${p.id}`} className="flex items-center gap-3 font-semibold text-navy-800 hover:text-brand-700">
                            <Avatar name={p.full_name} size={36} />
                            <span className="break-anywhere">{p.full_name}</span>
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-navy-800">{p.phone}</td>
                        <td className="max-w-[14rem] px-4 py-3 break-anywhere">{p.email ?? "—"}</td>
                        <td className="px-4 py-3 font-semibold text-navy-800">{p.appointment_count}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatDateTime(p.last_booking_at)}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatDate(p.created_at, "short")}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dentaladmincalicut/patients/${p.id}`}
                            className="inline-grid size-9 place-items-center rounded-lg text-navy-700 hover:bg-navy-50"
                            aria-label={`Open ${p.full_name}`}
                          >
                            <ChevronRight className="size-4" aria-hidden />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line md:hidden">
                {rows.map((p) => (
                  <li key={p.id}>
                    <Link href={`/dentaladmincalicut/patients/${p.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/60">
                      <Avatar name={p.full_name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-navy-800 break-anywhere">{p.full_name}</p>
                        <p className="text-sm">{p.phone}</p>
                        <p className="text-xs text-body">
                          {p.appointment_count} appointment{p.appointment_count === 1 ? "" : "s"} · since {formatDate(p.created_at, "short")}
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-body" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="mt-4">
          <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} total={total} pageSize={PATIENTS_PAGE_SIZE} hrefFor={hrefFor} />
        </div>
      </Card>
    </>
  );
}
