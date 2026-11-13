"use client";

import { BarChart3 } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/misc";

const COLORS = {
  brand: "#0b7a7c",
  brandSoft: "#cdebec",
  navy: "#17324d",
  grid: "#e3e9ed",
  axis: "#52616b",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#d64545",
  confirmed: "#0b7a7c",
  completed: "#16865b",
  cancelled: "#8ea6bf",
  rejected: "#7a2e2e",
  expired: "#b8c4ce",
};

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e3e9ed",
  boxShadow: "0 18px 40px -12px rgb(23 50 77 / 0.18)",
  fontSize: 13,
};

/** Charts render after mount (ResponsiveContainer needs a measured box) with a skeleton meanwhile. */
const noopSubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

function ChartFrame({
  title,
  description,
  empty,
  height = 260,
  children,
}: {
  title: string;
  description: string;
  empty: boolean;
  height?: number;
  children: ReactNode;
}) {
  const mounted = useMounted();
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-white p-4 shadow-soft sm:p-5">
      <h2 className="text-base font-bold">{title}</h2>
      <p className="mb-4 text-sm text-body">{description}</p>
      <div style={{ height }} className="min-w-0">
        {!mounted ? (
          <Skeleton className="h-full w-full" />
        ) : empty ? (
          <div className="grid h-full place-items-center rounded-xl bg-muted text-center">
            <div>
              <BarChart3 className="mx-auto size-6 text-navy-300" aria-hidden />
              <p className="mt-2 text-sm text-body">No data to show yet.</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

export function BookingTrendChart({ data }: { data: { date: string; label: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <ChartFrame
      title="Booking trend"
      description={`Appointments booked per day · last 30 days · ${total} total`}
      empty={total === 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.28} />
              <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: COLORS.axis, fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis allowDecimals={false} tick={{ fill: COLORS.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Bookings"]} />
          <Area
            type="monotone"
            dataKey="count"
            name="Bookings"
            stroke={COLORS.brand}
            strokeWidth={2.5}
            fill="url(#trendFill)"
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function StatusChart({ data }: { data: { status: string; label: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <ChartFrame title="Appointment status" description={`All appointments by status · ${total} total`} empty={total === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 8, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: COLORS.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" tick={{ fill: COLORS.navy, fontSize: 13 }} tickLine={false} axisLine={false} width={84} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f5f7f8" }} formatter={(v) => [v, "Appointments"]} />
          <Bar
            dataKey="count"
            name="Appointments"
            radius={[0, 8, 8, 0]}
            animationDuration={600}
            shape={(props: unknown) => {
              const p = props as { x: number; y: number; width: number; height: number; payload: { status: string } };
              return (
                <rect x={p.x} y={p.y} width={Math.max(p.width, 0)} height={p.height} rx={6} fill={STATUS_COLORS[p.payload.status] ?? COLORS.brand} />
              );
            }}
          >
            <LabelList dataKey="count" position="right" fill={COLORS.navy} fontSize={12} fontWeight={700} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function UtilisationChart({ data }: { data: { name: string; booked: number; capacity: number }[] }) {
  const height = Math.max(220, data.length * 44 + 60);
  return (
    <ChartFrame
      title="Doctor utilisation today"
      description="Counted bookings compared with each doctor's effective capacity"
      empty={data.length === 0}
      height={height}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 8, bottom: 0 }} barGap={2} barCategoryGap={10}>
          <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: COLORS.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: COLORS.navy, fontSize: 12 }} tickLine={false} axisLine={false} width={120} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f5f7f8" }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="booked" name="Booked" fill={COLORS.brand} radius={[0, 6, 6, 0]} animationDuration={600}>
            <LabelList dataKey="booked" position="right" fill={COLORS.navy} fontSize={11} fontWeight={700} />
          </Bar>
          <Bar dataKey="capacity" name="Capacity" fill={COLORS.brandSoft} radius={[0, 6, 6, 0]} animationDuration={600}>
            <LabelList dataKey="capacity" position="right" fill={COLORS.axis} fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
