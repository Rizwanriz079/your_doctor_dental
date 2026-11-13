import "server-only";
import { getSettings } from "@/features/public/queries";
import { createClient } from "@/lib/supabase/server";

/** "YYYY-MM-DD" for a Date in the clinic's timezone. */
function dateInZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

const ACTIVE = ["pending", "confirmed", "completed"];
const STATUS_ORDER = ["pending", "confirmed", "completed", "cancelled", "rejected", "expired"] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
  expired: "Expired",
};

const APPT_SELECT =
  "id, booking_reference, patient_name, appointment_date, start_time, end_time, status, doctors(full_name), services(name)";

export type DayOverviewRow = {
  doctor_id: string;
  full_name: string;
  status: string;
  accepting_bookings: boolean;
  scheduled: boolean;
  capacity: number;
  has_override: boolean;
  booked: number;
};

export async function getDashboardData(userId: string) {
  const supabase = await createClient();
  const settings = await getSettings();
  const tz = settings.timezone;
  const today = dateInZone(new Date(), tz);
  const weekEnd = addDays(today, 7);
  const trendStart = addDays(today, -29);

  const count = (build: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => build(base()).then((r) => r.count ?? 0);
  function base() {
    return supabase.from("appointments").select("id", { count: "exact", head: true });
  }

  const [
    total,
    todayCount,
    pending,
    confirmed,
    completed,
    patients,
    activeDoctors,
    statusCounts,
    todayList,
    upcoming,
    trendRows,
    overview,
    recent,
  ] = await Promise.all([
    count((q) => q),
    count((q) => q.eq("appointment_date", today).in("status", ACTIVE)),
    count((q) => q.eq("status", "pending")),
    count((q) => q.eq("status", "confirmed")),
    count((q) => q.eq("status", "completed")),
    supabase.from("patients").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    supabase
      .from("doctors")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .then((r) => r.count ?? 0),
    Promise.all(STATUS_ORDER.map((s) => count((q) => q.eq("status", s)).then((n) => ({ status: s, label: STATUS_LABEL[s], count: n })))),
    supabase
      .from("appointments")
      .select(APPT_SELECT)
      .eq("appointment_date", today)
      .order("start_time")
      .limit(50),
    supabase
      .from("appointments")
      .select(APPT_SELECT)
      .gt("appointment_date", today)
      .lte("appointment_date", weekEnd)
      .in("status", ["pending", "confirmed"])
      .order("appointment_date")
      .order("start_time")
      .limit(8),
    supabase
      .from("appointments")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 31 * 86400000).toISOString())
      .limit(10000),
    supabase.rpc("admin_day_overview", { p_date: today }),
    supabase
      .from("notifications")
      .select("*")
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Bookings created per day (clinic timezone), last 30 days.
  const perDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) perDay.set(addDays(trendStart, i), 0);
  for (const row of trendRows.data ?? []) {
    const day = dateInZone(new Date(row.created_at), tz);
    if (perDay.has(day)) perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  const trend = Array.from(perDay, ([date, value]) => ({
    date,
    label: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`)),
    count: value,
  }));

  const dayOverview = ((overview.data as DayOverviewRow[] | null) ?? []).filter((d) => d.status === "active" || d.booked > 0);

  return {
    today,
    timezone: tz,
    stats: { total, today: todayCount, pending, confirmed, completed, patients, activeDoctors },
    statusCounts,
    todayList: todayList.data ?? [],
    upcoming: upcoming.data ?? [],
    trend,
    dayOverview,
    recentNotifications: recent.data ?? [],
    errors: [todayList.error, upcoming.error, trendRows.error, overview.error].some(Boolean),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
