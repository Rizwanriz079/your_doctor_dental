import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, Clock3 } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import type { DoctorWithServices, Service } from "@/lib/types";
import { cn, formatPrice, initials, mediaUrl } from "@/lib/utils";

const CATEGORY_TINTS: Record<string, string> = {
  Preventive: "from-brand-100 via-sky-soft to-white",
  Cosmetic: "from-[#e4eefb] via-sky-soft to-white",
  Restorative: "from-navy-100 via-sky-soft to-white",
  Orthodontic: "from-[#def3ee] via-sky-soft to-white",
};

/** Illustrated fallback when a service has no uploaded image. */
export function ServiceVisual({ service, className }: { service: Pick<Service, "name" | "category" | "image_path">; className?: string }) {
  const src = mediaUrl(service.image_path);
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
        className={cn("object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-br transition-transform duration-500 ease-out group-hover:scale-[1.05]",
        CATEGORY_TINTS[service.category] ?? "from-brand-100 via-sky-soft to-white",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice">
        <circle cx="160" cy="20" r="60" fill="#ffffff" opacity="0.55" />
        <path
          d="M84 30c8-4 16-1 20 2 4-3 12-6 20-2 10 5 12 18 9 30-2 9-6 15-7 25-2 11-4 20-10 20-7 0-7-16-11-24-2-3-4-3-6 0-4 8-4 24-11 24-6 0-8-9-10-20-1-10-5-16-7-25-3-12-1-25 13-30Z"
          fill="#ffffff"
          stroke="#0f8b8d"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />
        <path d="M88 40c4-2 8-2 12 0" stroke="#9fd7d8" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function ServiceCard({ service, currency }: { service: Service; currency: string }) {
  const price = service.show_price ? formatPrice(service.price, currency) : null;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-line transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:shadow-lift focus-within:shadow-lift">
      <div className="relative aspect-[16/10] overflow-hidden">
        <ServiceVisual service={service} />
        <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-navy-800 backdrop-blur">
          {service.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-bold">
          <Link href={`/services/${service.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {service.name}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-body">{service.short_description}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="flex flex-wrap items-center gap-3 text-navy-700">
            {service.duration_minutes && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4 text-brand-600" aria-hidden />
                {service.duration_minutes} min
              </span>
            )}
            {price && <span className="font-semibold text-navy-800">From {price}</span>}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
            Learn more
            <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
      {/* group-focus-within ring for keyboard users */}
      <span className="pointer-events-none absolute inset-0 rounded-3xl ring-brand-400 group-has-[:focus-visible]:ring-3" aria-hidden />
    </article>
  );
}

export function DoctorCard({ doctor }: { doctor: DoctorWithServices }) {
  const photo = mediaUrl(doctor.profile_image_path);
  const bookHref = `/book-appointment?doctor=${doctor.id}${doctor.services.length === 1 ? `&service=${doctor.services[0].id}` : ""}`;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-line transition-[box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-brand-50 via-sky-soft to-navy-50">
        {photo ? (
          <Image
            src={photo}
            alt={`Portrait of ${doctor.full_name}`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 92vw"
            className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="grid h-full place-items-center" aria-hidden>
            <span className="grid size-28 place-items-center rounded-[2rem] bg-white/80 text-3xl font-bold text-brand-700 shadow-soft ring-1 ring-white">
              {initials(doctor.full_name)}
            </span>
          </div>
        )}
        {!doctor.accepting_bookings && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-warning-700">
            Not taking new bookings
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{doctor.specialization}</p>
        <h3 className="mt-1.5 text-lg font-bold break-anywhere">{doctor.full_name}</h3>
        {doctor.qualification && <p className="mt-0.5 text-sm text-navy-700">{doctor.qualification}</p>}
        {doctor.experience_years != null && doctor.experience_years > 0 && (
          <p className="mt-2 text-sm text-body">{doctor.experience_years}+ years of experience</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Link
            href={`/doctors/${doctor.slug}`}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold text-navy-800 ring-1 ring-line transition-colors hover:bg-muted"
          >
            View profile
          </Link>
          {doctor.accepting_bookings && (
            <Link
              href={bookHref}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-brand-700 active:scale-[0.97]"
              aria-label={`Book an appointment with ${doctor.full_name}`}
            >
              <CalendarCheck className="size-4" aria-hidden />
              Book
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export function DoctorChip({ doctor }: { doctor: DoctorWithServices }) {
  return (
    <Link
      href={`/doctors/${doctor.slug}`}
      className="flex min-w-0 items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line transition-shadow hover:shadow-soft"
    >
      <Avatar name={doctor.full_name} path={doctor.profile_image_path} size={48} />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-navy-800">{doctor.full_name}</span>
        <span className="block truncate text-sm text-body">{doctor.specialization}</span>
      </span>
    </Link>
  );
}
