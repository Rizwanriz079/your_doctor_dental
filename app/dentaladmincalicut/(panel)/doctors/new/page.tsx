import { PageHeader } from "@/components/admin/page-header";
import { DoctorForm } from "@/components/admin/doctors/doctor-form";
import { getAssignableServices, getCapacityLimit, getSpecializations } from "@/features/doctors/queries";
import { schedulesToWeek, type DoctorFormValues } from "@/features/doctors/schema";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Add doctor" };

export default async function NewDoctorPage() {
  await requireAdmin();
  const [services, specializations, { limit }] = await Promise.all([
    getAssignableServices(),
    getSpecializations(),
    getCapacityLimit(),
  ]);

  const defaults: DoctorFormValues = {
    full_name: "",
    profile_image_path: null,
    qualification: "",
    specialization: "",
    experience_years: null,
    biography: "",
    service_ids: [],
    phone: "",
    email: "",
    default_appointment_duration_minutes: 30,
    buffer_minutes: 0,
    default_daily_capacity: Math.min(15, limit),
    week: schedulesToWeek(
      [1, 2, 3, 4, 5].map((weekday) => ({ weekday, start_time: "09:00", end_time: "17:00" })),
    ),
    status: "active",
    accepting_bookings: true,
    show_on_homepage: true,
  };

  return (
    <>
      <PageHeader
        title="Add doctor"
        description="The doctor appears on the website once saved as Active with at least one service and working day."
        breadcrumbs={[{ label: "Doctors", href: "/dentaladmincalicut/doctors" }, { label: "Add doctor" }]}
      />
      <DoctorForm defaultValues={defaults} services={services} specializations={specializations} capacityLimit={limit} />
    </>
  );
}
