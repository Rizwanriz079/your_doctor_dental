import { CalendarX2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        icon={CalendarX2}
        title="Appointment not found"
        description="It may have been removed, or the link is incorrect."
        action={<ButtonLink href="/dentaladmincalicut/appointments" variant="secondary">Back to appointments</ButtonLink>}
      />
    </Card>
  );
}
