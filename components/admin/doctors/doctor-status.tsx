import { Archive, CalendarOff, CheckCircle2, PauseCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WEEKDAYS_SHORT } from "@/lib/utils";

export function DoctorStatusBadges({ status, accepting }: { status: string; accepting: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "active" && (
        <Badge tone="success" icon={CheckCircle2}>
          Active
        </Badge>
      )}
      {status === "inactive" && (
        <Badge tone="neutral" icon={PauseCircle}>
          Inactive
        </Badge>
      )}
      {status === "archived" && (
        <Badge tone="navy" icon={Archive}>
          Archived
        </Badge>
      )}
      {status !== "archived" && !accepting && (
        <Badge tone="warning" icon={CalendarOff}>
          Not accepting
        </Badge>
      )}
    </div>
  );
}

/** [1,2,3,4,5] -> "Mon–Fri"; [1,3,6] -> "Mon, Wed, Sat". */
export function formatWeekdays(days: number[]) {
  if (days.length === 0) return "No working days";
  if (days.length === 7) return "Every day";
  const sorted = [...days].sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const d of sorted) {
    const g = groups[groups.length - 1];
    if (g && d === g[g.length - 1] + 1) g.push(d);
    else groups.push([d]);
  }
  return groups
    .map((g) => (g.length >= 3 ? `${WEEKDAYS_SHORT[g[0]]}–${WEEKDAYS_SHORT[g[g.length - 1]]}` : g.map((d) => WEEKDAYS_SHORT[d]).join(", ")))
    .join(", ");
}
