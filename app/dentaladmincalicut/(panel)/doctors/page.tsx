import Link from "next/link";
import { Plus, Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { DoctorActions } from "@/components/admin/doctors/doctor-actions";
import { DoctorStatusBadges, formatWeekdays } from "@/components/admin/doctors/doctor-status";
import { UrlFilters } from "@/components/admin/doctors/url-filters";
import { ButtonLink } from "@/components/ui/button";
import { Avatar, Card, EmptyState, Pagination } from "@/components/ui/misc";
import { DOCTOR_PAGE_SIZE, getSpecializations, listDoctors } from "@/features/doctors/queries";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Doctors" };

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function ServiceChips({ services }: { services: { id: string; name: string }[] }) {
  if (services.length === 0) return <span className="text-sm text-danger-700">None assigned</span>;
  const shown = services.slice(0, 2);
  const rest = services.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((s) => (
        <span key={s.id} className="max-w-[10rem] truncate rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-navy-700">
          {s.name}
        </span>
      ))}
      {rest > 0 && (
        <span
          className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700"
          title={services.slice(2).map((s) => s.name).join(", ")}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

export default async function DoctorsPage({ searchParams }: PageProps<"/dentaladmincalicut/doctors">) {
  await requireAdmin();
  const sp = await searchParams;
  const params = {
    q: one(sp.q),
    specialization: one(sp.specialization),
    status: one(sp.status),
    sort: one(sp.sort),
    page: Number(one(sp.page)) || 1,
  };
  const [{ rows, total, page, error }, specializations] = await Promise.all([listDoctors(params), getSpecializations()]);
  const pageCount = Math.max(1, Math.ceil(total / DOCTOR_PAGE_SIZE));
  const filtered = Boolean(params.q || params.specialization || params.status);

  function hrefFor(p: number) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") qs.set(k, String(v));
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/dentaladmincalicut/doctors?${s}` : "/dentaladmincalicut/doctors";
  }

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Manage doctor profiles, services, working hours and daily booking limits."
        actions={
          <ButtonLink href="/dentaladmincalicut/doctors/new" variant="navy">
            <Plus className="size-4" aria-hidden />
            Add Doctor
          </ButtonLink>
        }
      />

      <div className="rounded-3xl bg-muted p-3 sm:p-4">
        <UrlFilters
          className="mb-4"
          searchPlaceholder="Search doctors by name"
          selects={[
            {
              name: "specialization",
              label: "Specialization",
              allLabel: "All specializations",
              options: specializations.map((s) => ({ value: s, label: s })),
            },
            {
              name: "status",
              label: "Status",
              allLabel: "All current",
              options: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "not_accepting", label: "Not accepting bookings" },
                { value: "archived", label: "Archived" },
              ],
            },
            {
              name: "sort",
              label: "Sort",
              allLabel: "Name A–Z",
              options: [
                { value: "name_desc", label: "Name Z–A" },
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
              ],
            },
          ]}
        />

        <Card className="overflow-hidden shadow-none">
          {error ? (
            <EmptyState title="Doctors could not be loaded" description="Please refresh the page. If the problem continues, check the database connection." />
          ) : rows.length === 0 ? (
            filtered ? (
              <EmptyState icon={Stethoscope} title="No doctors match these filters" description="Try a different search or clear the filters." />
            ) : (
              <EmptyState
                icon={Stethoscope}
                title="No doctors have been added yet."
                description="Add your first doctor to start accepting bookings."
                action={
                  <ButtonLink href="/dentaladmincalicut/doctors/new" variant="navy">
                    <Plus className="size-4" aria-hidden />
                    Add Doctor
                  </ButtonLink>
                }
              />
            )
          ) : (
            <>
              {/* Table: md and up */}
              <div className="hidden relative overflow-x-auto md:block">
                <table className="w-full min-w-[56rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs font-semibold text-body">
                      <th scope="col" className="px-5 py-3.5">Doctor</th>
                      <th scope="col" className="px-3 py-3.5">Specialization</th>
                      <th scope="col" className="px-3 py-3.5">Services</th>
                      <th scope="col" className="px-3 py-3.5">Working days</th>
                      <th scope="col" className="px-3 py-3.5 text-right">Daily limit</th>
                      <th scope="col" className="px-3 py-3.5">Status</th>
                      <th scope="col" className="px-5 py-3.5 text-right">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((d) => (
                      <tr key={d.id} className="transition-colors hover:bg-sky-soft/50">
                        <td className="px-5 py-3">
                          <Link href={`/dentaladmincalicut/doctors/${d.id}`} className="flex min-w-0 items-center gap-3 font-semibold text-navy-800 hover:text-brand-700">
                            <Avatar name={d.full_name} path={d.profile_image_path} size={40} />
                            <span className="truncate">{d.full_name}</span>
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-navy-800">{d.specialization}</td>
                        <td className="px-3 py-3">
                          <ServiceChips services={d.services} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-navy-800">{formatWeekdays(d.weekdays)}</td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-navy-800">{d.default_daily_capacity}</td>
                        <td className="px-3 py-3">
                          <DoctorStatusBadges status={d.status} accepting={d.accepting_bookings} />
                        </td>
                        <td className="px-5 py-3">
                          <DoctorActions doctor={d} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards: below md */}
              <ul className="divide-y divide-line md:hidden">
                {rows.map((d) => (
                  <li key={d.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar name={d.full_name} path={d.profile_image_path} size={48} />
                      <div className="min-w-0 flex-1">
                        <Link href={`/dentaladmincalicut/doctors/${d.id}`} className="block truncate font-bold text-navy-800">
                          {d.full_name}
                        </Link>
                        <p className="truncate text-sm text-body">{d.specialization}</p>
                        <div className="mt-2">
                          <DoctorStatusBadges status={d.status} accepting={d.accepting_bookings} />
                        </div>
                      </div>
                      <DoctorActions doctor={d} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-body">Working days</dt>
                        <dd className="font-medium text-navy-800">{formatWeekdays(d.weekdays)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-body">Daily limit</dt>
                        <dd className="font-medium text-navy-800">{d.default_daily_capacity} per day</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="mb-1 text-xs text-body">Services</dt>
                        <dd>
                          <ServiceChips services={d.services} />
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {rows.length > 0 && (
          <div className="mt-4">
            <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} total={total} pageSize={DOCTOR_PAGE_SIZE} />
          </div>
        )}
      </div>
    </>
  );
}
