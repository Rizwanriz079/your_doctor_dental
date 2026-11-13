import { UserX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        icon={UserX}
        title="Patient not found"
        description="The patient record may not exist, or the link is incorrect."
        action={<ButtonLink href="/admin/patients" variant="secondary">Back to patients</ButtonLink>}
      />
    </Card>
  );
}
