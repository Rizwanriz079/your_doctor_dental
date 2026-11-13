import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { DoctorForm } from "@/components/admin/doctors/doctor-form";
import { getAssignableServices, getCapacityLimit, getDoctorForEdit, getSpecializations } from "@/features/doctors/queries";
import { schedulesToWeek, type DoctorFormValues } from "@/features/doctors/schema";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Edit doctor" };

export default async function EditDoctorPage({ params }: PageProps<"/dentaladmincalicut/doctors/[id]/edit">) {
  await requireAdmin();
  const { id } = await params;
  const [doctor, services, specializations, { limit }] = await Promise.all([
    getDoctorForEdit(id),
    getAssignableServices(),
    getSpecializations(),
    getCapacityLimit(),
  ]);
  if (!doctor) notFound();

  const assigned = new Set((doctor.doctor_services ?? []).map((s) => s.service_id));
  const defaults: DoctorFormValues = {
    id: doctor.id,
    full_name: doctor.full_name,
    profile_image_path: doctor.profile_image_path,
    qualification: doctor.qualification,
    specialization: doctor.specialization,
    experience_years: doctor.experience_years,
    biography: doctor.biography,
    service_ids: [...assigned],
    phone: doctor.doctor_private?.phone ?? "",
    email: doctor.doctor_private?.email ?? "",
    default_appointment_duration_minutes: doctor.default_appointment_duration_minutes,
    buffer_minutes: doctor.buffer_minutes,
    default_daily_capacity: doctor.default_daily_capacity,
    week: schedulesToWeek(doctor.doctor_schedules ?? []),
    status: doctor.status === "inactive" ? "inactive" : "active",
    accepting_bookings: doctor.accepting_bookings,
    show_on_homepage: doctor.show_on_homepage,
  };

  return (
    <>
      <PageHeader
        title={`Edit ${doctor.full_name}`}
        description={
          doctor.status === "archived"
            ? "This doctor is archived. Restore them from the doctor page to make them available again."
            : "Changes appear on the public website as soon as they are saved."
        }
        breadcrumbs={[
          { label: "Doctors", href: "/dentaladmincalicut/doctors" },
          { label: doctor.full_name, href: `/dentaladmincalicut/doctors/${doctor.id}` },
          { label: "Edit" },
        ]}
      />
      {/* Archived doctors' assigned services may include archived ones: keep them selectable. */}
      <DoctorForm
        defaultValues={defaults}
        services={services.concat(
          [...assigned]
            .filter((sid) => !services.some((s) => s.id === sid))
            .map((sid) => ({ id: sid, name: "Archived service", category: "", is_active: false })),
        )}
        specializations={specializations}
        capacityLimit={limit}
      />
    </>
  );
}
