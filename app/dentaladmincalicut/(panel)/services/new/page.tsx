import { PageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/services/service-form";
import { getServiceFormData } from "@/features/services/queries";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Add service" };

export default async function NewServicePage() {
  await requireAdmin();
  const { doctors, categories, currency } = await getServiceFormData();
  return (
    <>
      <PageHeader title="Add service" breadcrumbs={[{ label: "Services", href: "/dentaladmincalicut/services" }, { label: "Add service" }]} />
      <ServiceForm
        doctors={doctors}
        categories={categories}
        currency={currency}
        defaultValues={{
          name: "",
          slug: "",
          category: categories[0] ?? "General",
          short_description: "",
          description: "",
          procedure_details: "",
          image_path: null,
          duration_minutes: 30,
          price: null,
          show_price: false,
          is_active: true,
          is_featured: false,
          sort_order: 0,
          doctor_ids: [],
        }}
      />
    </>
  );
}
