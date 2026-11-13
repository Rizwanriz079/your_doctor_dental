"use client";

import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn, mediaUrl } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads an image to the `media` bucket (admin-only write policy) and returns its storage path.
 * Type and size are validated here and again by the bucket configuration.
 */
export function ImageUpload({
  value,
  onChange,
  folder,
  label = "Upload image",
  aspect = "aspect-square",
  className,
}: {
  value: string | null | undefined;
  onChange: (path: string | null) => void;
  folder: "doctors" | "services" | "site" | "gallery";
  label?: string;
  aspect?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const id = useId();
  const src = mediaUrl(value);

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Please choose a JPG, PNG, WebP or AVIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Images must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const { error } = await supabase.storage.from("media").upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      onChange(path);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className={cn("relative w-28 shrink-0 overflow-hidden rounded-2xl border border-dashed border-navy-100 bg-muted", aspect)}>
        {src ? (
          <Image src={src} alt="Selected image preview" fill sizes="112px" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-navy-300">
            <ImagePlus className="size-7" aria-hidden />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Uploading" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <label
          htmlFor={id}
          className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-navy-800 ring-1 ring-line transition-colors hover:bg-muted focus-within:outline-3"
        >
          <ImagePlus className="size-4" aria-hidden />
          {src ? "Replace image" : label}
        </label>
        {src && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-danger-700 transition-colors hover:bg-danger-50"
          >
            <Trash2 className="size-4" aria-hidden />
            Remove
          </button>
        )}
        <p className="text-xs text-body">JPG, PNG, WebP or AVIF · max 5 MB</p>
      </div>
    </div>
  );
}
