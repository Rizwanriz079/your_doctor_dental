import Image from "next/image";
import Link from "next/link";
import { Archive, CheckCircle2, ClipboardList, PauseCircle, Plus, Star } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { UrlFilters } from "@/components/admin/doctors/url-filters";
import { ServiceActions } from "@/components/admin/services/service-actions";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";
import { listServices } from "@/features/services/queries";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, mediaUrl } from "@/lib/utils";

export const metadata = { title: "Services" };

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function Thumb({ path, name }: { path: string | null; name: string }) {
  const src = mediaUrl(path);
  return (
    <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 to-sky-soft text-brand-600">
      {src ? <Image src={src} alt="" fill sizes="44px" className="object-cover" /> : <ClipboardList className="size-5" aria-label={name} />}
    </span>
  );
}

function StatusBadges({ s }: { s: { is_active: boolean; is_featured: boolean; archived_at: string | null } }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {s.archived_at ? (
        <Badge tone="navy" icon={Archive}>
          Archived
        </Badge>
      ) : s.is_active ? (
        <Badge tone="success" icon={CheckCircle2}>
          Active
        </Badge>
      ) : (
        <Badge tone="neutral" icon={PauseCircle}>
          Inactive
        </Badge>
      )}
      {s.is_featured && !s.archived_at && (
        <Badge tone="brand" icon={Star}>
          Featured
        </Badge>
      )}
    </div>
  );
}

export default async function ServicesPage({ searchParams }: PageProps<"/dentaladmincalicut/services">) {
  await requireAdmin();
  const sp = await searchParams;
  const params = { q: one(sp.q), status: one(sp.status) };
  const supabase = await createClient();
  const [{ rows, error }, { data: settings }] = await Promise.all([
    listServices(params),
    supabase.from("clinic_settings").select("currency").eq("id", 1).single(),
  ]);
  const currency = settings?.currency ?? "INR";
  const filtered = Boolean(params.q || params.status);
  const price = (s: (typeof rows)[number]) =>
    s.price == null ? <span className="text-body">—</span> : (
      <>
        {formatPrice(s.price, currency)}
        {!s.show_price && <span className="block text-xs font-normal text-body">hidden</span>}
      </>
    );

  return (
    <>
      <PageHeader
        title="Services"
        description="Treatments patients can book. Only active services appear on the website."
        actions={
          <ButtonLink href="/dentaladmincalicut/services/new" variant="navy">
            <Plus className="size-4" aria-hidden />
            Add Service
          </ButtonLink>
        }
      />
      <div className="rounded-3xl bg-muted p-3 sm:p-4">
        <UrlFilters
          className="mb-4"
          searchPlaceholder="Search services"
          selects={[
            {
              name: "status",
              label: "Status",
              allLabel: "All current",
              options: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "featured", label: "Featured" },
                { value: "archived", label: "Archived" },
              ],
            },
          ]}
        />
        <Card className="overflow-hidden shadow-none">
          {error ? (
            <EmptyState title="Services could not be loaded" description="Please refresh the page and try again." />
          ) : rows.length === 0 ? (
            filtered ? (
              <EmptyState icon={ClipboardList} title="No services match these filters" description="Try a different search or clear the filters." />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No services have been added yet."
                description="Add the treatments your clinic offers so patients can book them."
                action={
                  <ButtonLink href="/dentaladmincalicut/services/new" variant="navy">
                    <Plus className="size-4" aria-hidden />
                    Add Service
                  </ButtonLink>
                }
              />
            )
          ) : (
            <>
              <div className="hidden relative overflow-x-auto md:block">
                <table className="w-full min-w-[48rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs font-semibold text-body">
                      <th scope="col" className="px-5 py-3.5">Service</th>
                      <th scope="col" className="px-3 py-3.5">Category</th>
                      <th scope="col" className="px-3 py-3.5 text-right">Length</th>
                      <th scope="col" className="px-3 py-3.5 text-right">Price</th>
                      <th scope="col" className="px-3 py-3.5 text-right">Doctors</th>
                      <th scope="col" className="px-3 py-3.5">Status</th>
                      <th scope="col" className="px-5 py-3.5">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((s) => (
                      <tr key={s.id} className="transition-colors hover:bg-sky-soft/50">
                        <td className="px-5 py-3">
                          <Link href={`/dentaladmincalicut/services/${s.id}/edit`} className="flex min-w-0 items-center gap-3 font-semibold text-navy-800 hover:text-brand-700">
                            <Thumb path={s.image_path} name={s.name} />
                            <span className="truncate">{s.name}</span>
                          </Link>
                        </td>
                        <td className="px-3 py-3">{s.category}</td>
                        <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">
                          {s.duration_minutes ? `${s.duration_minutes} min` : <span className="text-body">Doctor default</span>}
                        </td>
                        <td className="px-3 py-3 text-right font-medium tabular-nums text-navy-800">{price(s)}</td>
                        <td className={`px-3 py-3 text-right tabular-nums ${s.doctor_count === 0 ? "font-semibold text-danger-700" : ""}`}>
                          {s.doctor_count}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadges s={s} />
                        </td>
                        <td className="px-5 py-3">
                          <ServiceActions service={s} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-line md:hidden">
                {rows.map((s) => (
                  <li key={s.id} className="flex items-start gap-3 p-4">
                    <Thumb path={s.image_path} name={s.name} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/dentaladmincalicut/services/${s.id}/edit`} className="block truncate font-bold text-navy-800">
                        {s.name}
                      </Link>
                      <p className="text-sm text-body">
                        {s.category}
                        {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""} · {s.doctor_count} doctor(s)
                      </p>
                      <div className="mt-2">
                        <StatusBadges s={s} />
                      </div>
                    </div>
                    <ServiceActions service={s} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
        {rows.length > 0 && (
          <p className="mt-3 px-1 text-sm text-body">
            {rows.length} service{rows.length === 1 ? "" : "s"}
            {rows.some((s) => s.doctor_count === 0 && !s.archived_at) && " · Services with 0 doctors cannot be booked."}
          </p>
        )}
      </div>
    </>
  );
}
