import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/services/service-form";
import { getServiceFormData } from "@/features/services/queries";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Edit service" };

export default async function EditServicePage({ params }: PageProps<"/admin/services/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const { service, doctors, categories, currency } = await getServiceFormData(id);
  if (!service) notFound();
  return (
    <>
      <PageHeader
        title={`Edit ${service.name}`}
        description={service.archived_at ? "This service is archived. Restore it from the services list to offer it again." : undefined}
        breadcrumbs={[{ label: "Services", href: "/admin/services" }, { label: service.name }]}
      />
      <ServiceForm
        doctors={doctors}
        categories={categories}
        currency={currency}
        defaultValues={{
          id: service.id,
          name: service.name,
          slug: service.slug,
          category: service.category,
          short_description: service.short_description,
          description: service.description,
          procedure_details: service.procedure_details,
          image_path: service.image_path,
          duration_minutes: service.duration_minutes,
          price: service.price,
          show_price: service.show_price,
          is_active: service.is_active,
          is_featured: service.is_featured,
          sort_order: service.sort_order,
          doctor_ids: (service.doctor_services ?? []).map((d) => d.doctor_id),
        }}
      />
    </>
  );
}
