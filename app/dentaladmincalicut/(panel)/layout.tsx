import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { getNotificationSnapshot } from "@/features/notifications/queries";
import { getSettings } from "@/features/public/queries";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: LayoutProps<"/dentaladmincalicut">) {
  // Server-side guard: the proxy redirect is only optimistic.
  const admin = await requireAdmin();
  const [settings, snapshot] = await Promise.all([getSettings(), getNotificationSnapshot(admin.userId)]);
  return (
    <AdminShell
      admin={admin}
      clinicName={settings.clinic_name}
      logoPath={settings.logo_path}
      initialNotifications={snapshot.items}
      initialUnread={snapshot.unread}
    >
      {children}
    </AdminShell>
  );
}
