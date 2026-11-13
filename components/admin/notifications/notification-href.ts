import type { Notification } from "@/lib/types";

/** Where a notification should take the admin. Plain module: usable from server and client. */
export function notificationHref(n: Pick<Notification, "appointment_id" | "doctor_id">) {
  if (n.appointment_id) return `/dentaladmincalicut/appointments/${n.appointment_id}`;
  if (n.doctor_id) return `/dentaladmincalicut/doctors/${n.doctor_id}`;
  return "/dentaladmincalicut/notifications";
}
