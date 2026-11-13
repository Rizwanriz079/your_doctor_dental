"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { updateAdminProfile } from "@/features/settings/actions";

/** Lets the signed-in super admin change the name and photo shown in the dashboard. */
export function AccountForm({ email, fullName, avatarPath }: { email: string; fullName: string; avatarPath: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [photo, setPhoto] = useState<string | null>(avatarPath);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const dirty = name.trim() !== fullName || photo !== avatarPath;

  const save = () =>
    start(async () => {
      setError(undefined);
      const res = await updateAdminProfile({ fullName: name, avatarPath: photo });
      if (!res.ok) {
        setError(res.fieldErrors?.fullName?.[0] ?? res.message);
        return;
      }
      toast.success("Profile updated");
      router.refresh();
    });

  return (
    <div className="mt-4 grid gap-6 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <div className="w-36">
        <ImageUpload value={photo} onChange={setPhoto} folder="avatars" label="Upload photo" />
      </div>
      <div className="min-w-0 space-y-4">
        <Field label="Your name" error={error} required>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs text-body">Email</dt>
            <dd className="break-anywhere font-semibold text-navy-800">{email}</dd>
          </div>
          <div>
            <dt className="text-xs text-body">Role</dt>
            <dd>
              <Badge tone="navy">Super Admin</Badge>
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={save} loading={pending} disabled={!dirty}>
            Save profile
          </Button>
          {dirty && <span className="text-sm text-warning-700">Unsaved changes</span>}
        </div>
      </div>
    </div>
  );
}
