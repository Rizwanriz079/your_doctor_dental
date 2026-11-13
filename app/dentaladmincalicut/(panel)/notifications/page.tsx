import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { NotificationsList } from "@/components/admin/notifications/notifications-list";
import { Card, Pagination } from "@/components/ui/misc";
import { listNotifications, NOTIFICATIONS_PAGE_SIZE } from "@/features/notifications/queries";
import { requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage({ searchParams }: PageProps<"/dentaladmincalicut/notifications">) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const unreadOnly = params.filter === "unread";
  const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
  const { items, total, error } = await listNotifications(admin.userId, { page, unreadOnly });
  const pageCount = Math.max(1, Math.ceil(total / NOTIFICATIONS_PAGE_SIZE));

  const hrefFor = (p: number) => `/dentaladmincalicut/notifications?${new URLSearchParams({ ...(unreadOnly ? { filter: "unread" } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Notifications" description="New bookings and items that need your attention." />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Filter notifications" className="inline-flex rounded-full bg-muted p-1">
            {[
              { label: "All", value: null },
              { label: "Unread", value: "unread" },
            ].map((tab) => {
              const active = (tab.value === "unread") === unreadOnly;
              return (
                <Link
                  key={tab.label}
                  role="tab"
                  aria-selected={active}
                  href={tab.value ? "/dentaladmincalicut/notifications?filter=unread" : "/dentaladmincalicut/notifications"}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                    active ? "bg-white text-navy-800 shadow-soft" : "text-body hover:text-navy-800",
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
        {error ? (
          <p role="alert" className="p-6 text-sm text-danger-700">
            {error}
          </p>
        ) : (
          <NotificationsList items={items} unreadOnly={unreadOnly} />
        )}
      </Card>
      {pageCount > 1 && (
        <div className="mt-5">
          <Pagination page={page} pageCount={pageCount} total={total} pageSize={NOTIFICATIONS_PAGE_SIZE} hrefFor={hrefFor} />
        </div>
      )}
    </>
  );
}
