"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { ImageUpload } from "@/components/admin/image-upload";
import { Field, Input, Select } from "@/components/ui/field";
import { BENEFIT_ICONS } from "@/features/content/schema";
import type { ClinicSettings, Testimonial } from "@/lib/types";
import { ListEditor, SectionCard, Tabs, TextField, useSection } from "./section-kit";
import { TestimonialsManager } from "./testimonials-manager";

type TT = { title: string; text: string };
type Benefit = TT & { icon: (typeof BENEFIT_ICONS)[number] };
type Stat = { value: number; suffix: string; label: string };
type Hour = { label: string; hours: string };
type Img = { path: string; alt: string };
type Social = Record<"facebook" | "instagram" | "x" | "youtube" | "linkedin" | "tiktok", string>;

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function BrandSection({ s }: { s: ClinicSettings }) {
  const f = useSection("brand", { clinic_name: s.clinic_name, tagline: s.tagline, logo_path: s.logo_path });
  return (
    <SectionCard title="Brand" description="Clinic name, tagline and logo used across the website." onSave={f.save} saving={f.saving} dirty={f.dirty}>
      <Grid>
        <TextField label="Clinic name" required value={f.values.clinic_name} onChange={(v) => f.set("clinic_name", v)} error={f.errors.clinic_name} />
        <TextField label="Tagline" value={f.values.tagline} onChange={(v) => f.set("tagline", v)} error={f.errors.tagline} />
      </Grid>
      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Logo</p>
        <ImageUpload value={f.values.logo_path} onChange={(p) => f.set("logo_path", p)} folder="site" label="Upload logo" />
      </div>
    </SectionCard>
  );
}

function HeroSection({ s }: { s: ClinicSettings }) {
  const f = useSection("hero", {
    hero_eyebrow: s.hero_eyebrow,
    hero_heading: s.hero_heading,
    hero_text: s.hero_text,
    hero_image_path: s.hero_image_path,
    hero_highlights: arr<TT>(s.hero_highlights),
  });
  return (
    <SectionCard title="Homepage hero" description="The first thing visitors see." onSave={f.save} saving={f.saving} dirty={f.dirty}>
      <TextField label="Small label above heading" value={f.values.hero_eyebrow} onChange={(v) => f.set("hero_eyebrow", v)} error={f.errors.hero_eyebrow} />
      <TextField label="Heading" required value={f.values.hero_heading} onChange={(v) => f.set("hero_heading", v)} error={f.errors.hero_heading} />
      <TextField label="Supporting text" multiline rows={3} value={f.values.hero_text} onChange={(v) => f.set("hero_text", v)} error={f.errors.hero_text} />
      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Hero image</p>
        <p className="mb-3 text-sm text-body">Optional. Without an image, the site shows its built-in illustration.</p>
        <ImageUpload value={f.values.hero_image_path} onChange={(p) => f.set("hero_image_path", p)} folder="site" aspect="aspect-[4/3]" />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Highlight chips</p>
        <ListEditor<TT>
          items={f.values.hero_highlights}
          onChange={(v) => f.set("hero_highlights", v)}
          newItem={() => ({ title: "", text: "" })}
          addLabel="Add highlight"
          max={4}
          itemLabel={(i) => `Highlight ${i + 1}`}
          error={f.errors.hero_highlights}
          render={(item, update, i) => (
            <Grid>
              <TextField label="Title" value={item.title} onChange={(v) => update({ title: v })} error={f.errors[`hero_highlights.${i}.title`]} />
              <TextField label="Text" value={item.text} onChange={(v) => update({ text: v })} error={f.errors[`hero_highlights.${i}.text`]} />
            </Grid>
          )}
        />
      </div>
    </SectionCard>
  );
}

function HighlightsSection({ s }: { s: ClinicSettings }) {
  const f = useSection("highlights", { benefits: arr<Benefit>(s.benefits), stats: arr<Stat>(s.stats) });
  return (
    <SectionCard
      title="Benefits & statistics"
      description="Benefits appear in the trust strip and “Why choose us”. Statistics are optional."
      onSave={f.save}
      saving={f.saving}
      dirty={f.dirty}
    >
      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Benefits</p>
        <ListEditor<Benefit>
          items={f.values.benefits}
          onChange={(v) => f.set("benefits", v)}
          newItem={() => ({ title: "", text: "", icon: "sparkles" })}
          addLabel="Add benefit"
          max={8}
          itemLabel={(i) => `Benefit ${i + 1}`}
          error={f.errors.benefits}
          render={(item, update, i) => (
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_10rem]">
              <TextField label="Title" value={item.title} onChange={(v) => update({ title: v })} error={f.errors[`benefits.${i}.title`]} />
              <TextField label="Text" value={item.text} onChange={(v) => update({ text: v })} error={f.errors[`benefits.${i}.text`]} />
              <Field label="Icon">
                {({ id }) => (
                  <Select id={id} value={item.icon} onChange={(e) => update({ icon: e.target.value as Benefit["icon"] })}>
                    {BENEFIT_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          )}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Statistics</p>
        <p role="note" className="mb-3 flex items-start gap-2 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          Only publish genuine, verifiable figures (for example, years open or patients treated from your records). Leave this
          empty if you cannot verify them; the section is hidden when there are no statistics.
        </p>
        <ListEditor<Stat>
          items={f.values.stats}
          onChange={(v) => f.set("stats", v)}
          newItem={() => ({ value: 0, suffix: "+", label: "" })}
          addLabel="Add statistic"
          max={4}
          itemLabel={(i) => `Statistic ${i + 1}`}
          error={f.errors.stats}
          render={(item, update, i) => (
            <div className="grid gap-4 sm:grid-cols-[8rem_6rem_1fr]">
              <Field label="Value" error={f.errors[`stats.${i}.value`]?.[0]}>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    aria-invalid={invalid}
                    value={Number.isFinite(item.value) ? item.value : ""}
                    onChange={(e) => update({ value: e.target.value === "" ? Number.NaN : Number(e.target.value) })}
                  />
                )}
              </Field>
              <TextField label="Suffix" value={item.suffix} maxLength={4} onChange={(v) => update({ suffix: v })} error={f.errors[`stats.${i}.suffix`]} />
              <TextField label="Label" value={item.label} onChange={(v) => update({ label: v })} error={f.errors[`stats.${i}.label`]} />
            </div>
          )}
        />
      </div>
    </SectionCard>
  );
}

function AboutSection({ s }: { s: ClinicSettings }) {
  const f = useSection("about", {
    about_heading: s.about_heading,
    about_overview: s.about_overview,
    mission: s.mission,
    clinic_values: arr<TT>(s.clinic_values),
    facilities: s.facilities,
    technology: s.technology,
  });
  return (
    <SectionCard title="About page" onSave={f.save} saving={f.saving} dirty={f.dirty}>
      <TextField label="Heading" required value={f.values.about_heading} onChange={(v) => f.set("about_heading", v)} error={f.errors.about_heading} />
      <TextField label="Clinic overview" multiline rows={5} value={f.values.about_overview} onChange={(v) => f.set("about_overview", v)} error={f.errors.about_overview} />
      <TextField label="Mission" multiline rows={3} value={f.values.mission} onChange={(v) => f.set("mission", v)} error={f.errors.mission} />
      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Values</p>
        <ListEditor<TT>
          items={f.values.clinic_values}
          onChange={(v) => f.set("clinic_values", v)}
          newItem={() => ({ title: "", text: "" })}
          addLabel="Add value"
          max={6}
          itemLabel={(i) => `Value ${i + 1}`}
          render={(item, update, i) => (
            <Grid>
              <TextField label="Title" value={item.title} onChange={(v) => update({ title: v })} error={f.errors[`clinic_values.${i}.title`]} />
              <TextField label="Text" value={item.text} onChange={(v) => update({ text: v })} error={f.errors[`clinic_values.${i}.text`]} />
            </Grid>
          )}
        />
      </div>
      <Grid>
        <TextField label="Facilities" multiline value={f.values.facilities} onChange={(v) => f.set("facilities", v)} error={f.errors.facilities} />
        <TextField label="Equipment & technology" multiline value={f.values.technology} onChange={(v) => f.set("technology", v)} error={f.errors.technology} />
      </Grid>
    </SectionCard>
  );
}

function GallerySection({ s }: { s: ClinicSettings }) {
  const f = useSection("gallery", { gallery: arr<Img>(s.gallery) });
  return (
    <SectionCard
      title="Clinic gallery"
      description="Real photos of your clinic. The gallery section is hidden when empty. Alt text is required for accessibility."
      onSave={f.save}
      saving={f.saving}
      dirty={f.dirty}
    >
      <ListEditor<Img>
        items={f.values.gallery}
        onChange={(v) => f.set("gallery", v)}
        newItem={() => ({ path: "", alt: "" })}
        addLabel="Add photo"
        max={24}
        itemLabel={(i) => `Photo ${i + 1}`}
        error={f.errors.gallery}
        render={(item, update, i) => (
          <div className="grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
            <div>
              <ImageUpload value={item.path || null} onChange={(p) => update({ path: p ?? "" })} folder="gallery" aspect="aspect-[4/3]" />
              {f.errors[`gallery.${i}.path`] && <p className="mt-1 text-sm text-danger-700">{f.errors[`gallery.${i}.path`]?.[0]}</p>}
            </div>
            <TextField
              label="Alt text"
              required
              placeholder="e.g. Bright treatment room with a dental chair"
              value={item.alt}
              onChange={(v) => update({ alt: v })}
              error={f.errors[`gallery.${i}.alt`]}
            />
          </div>
        )}
      />
    </SectionCard>
  );
}

function ContactSection({ s }: { s: ClinicSettings }) {
  const social = (s.social_links ?? {}) as Partial<Social>;
  const f = useSection("contact", {
    phone: s.phone,
    email: s.email,
    address: s.address,
    map_url: s.map_url,
    map_embed_url: s.map_embed_url,
    opening_hours: arr<Hour>(s.opening_hours),
    social_links: {
      facebook: social.facebook ?? "",
      instagram: social.instagram ?? "",
      x: social.x ?? "",
      youtube: social.youtube ?? "",
      linkedin: social.linkedin ?? "",
      tiktok: social.tiktok ?? "",
    } as Social,
    footer_text: s.footer_text,
  });
  const links = f.values.social_links;
  return (
    <SectionCard title="Contact, hours & footer" onSave={f.save} saving={f.saving} dirty={f.dirty}>
      <Grid>
        <TextField label="Phone" type="tel" value={f.values.phone} onChange={(v) => f.set("phone", v)} error={f.errors.phone} />
        <TextField label="Email" type="email" value={f.values.email} onChange={(v) => f.set("email", v)} error={f.errors.email} />
      </Grid>
      <TextField label="Address" multiline rows={2} value={f.values.address} onChange={(v) => f.set("address", v)} error={f.errors.address} />
      <Grid>
        <TextField
          label="Map link"
          hint="Opens in a new tab, e.g. a Google Maps share link."
          placeholder="https://"
          value={f.values.map_url}
          onChange={(v) => f.set("map_url", v)}
          error={f.errors.map_url}
        />
        <TextField
          label="Map embed URL"
          hint="Optional https embed URL (Google Maps → Share → Embed → src)."
          placeholder="https://www.google.com/maps/embed?..."
          value={f.values.map_embed_url}
          onChange={(v) => f.set("map_embed_url", v)}
          error={f.errors.map_embed_url}
        />
      </Grid>
      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Opening hours</p>
        <ListEditor<Hour>
          items={f.values.opening_hours}
          onChange={(v) => f.set("opening_hours", v)}
          newItem={() => ({ label: "", hours: "" })}
          addLabel="Add row"
          max={10}
          itemLabel={(i) => `Row ${i + 1}`}
          render={(item, update, i) => (
            <Grid>
              <TextField label="Day(s)" placeholder="Sunday – Thursday" value={item.label} onChange={(v) => update({ label: v })} error={f.errors[`opening_hours.${i}.label`]} />
              <TextField label="Hours" placeholder="9:00 AM – 8:00 PM or Closed" value={item.hours} onChange={(v) => update({ hours: v })} error={f.errors[`opening_hours.${i}.hours`]} />
            </Grid>
          )}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-navy-800">Social links</p>
        <Grid>
          {(Object.keys(links) as (keyof Social)[]).map((k) => (
            <TextField
              key={k}
              label={k === "x" ? "X (Twitter)" : k[0].toUpperCase() + k.slice(1)}
              placeholder="https://"
              value={links[k]}
              onChange={(v) => f.set("social_links", { ...links, [k]: v })}
              error={f.errors[`social_links.${k}`]}
            />
          ))}
        </Grid>
      </div>
      <TextField label="Footer text" multiline rows={2} value={f.values.footer_text} onChange={(v) => f.set("footer_text", v)} error={f.errors.footer_text} />
    </SectionCard>
  );
}

function LegalSection({ s }: { s: ClinicSettings }) {
  const f = useSection("legal", { privacy_text: s.privacy_text, terms_text: s.terms_text });
  return (
    <SectionCard
      title="Privacy & terms"
      description="Shown on the Privacy and Terms pages and linked from the booking form. Have these reviewed for your jurisdiction."
      onSave={f.save}
      saving={f.saving}
      dirty={f.dirty}
    >
      <TextField label="Privacy notice" multiline rows={12} value={f.values.privacy_text} onChange={(v) => f.set("privacy_text", v)} error={f.errors.privacy_text} />
      <TextField label="Terms" multiline rows={10} value={f.values.terms_text} onChange={(v) => f.set("terms_text", v)} error={f.errors.terms_text} />
    </SectionCard>
  );
}

export function ContentEditor({ settings, testimonials }: { settings: ClinicSettings; testimonials: Testimonial[] }) {
  return (
    <Tabs
      tabs={[
        { id: "brand", label: "Brand", content: <BrandSection s={settings} /> },
        { id: "hero", label: "Hero", content: <HeroSection s={settings} /> },
        { id: "highlights", label: "Benefits & stats", content: <HighlightsSection s={settings} /> },
        { id: "about", label: "About", content: <AboutSection s={settings} /> },
        { id: "gallery", label: "Gallery", content: <GallerySection s={settings} /> },
        { id: "contact", label: "Contact & footer", content: <ContactSection s={settings} /> },
        { id: "testimonials", label: "Testimonials", content: <TestimonialsManager testimonials={testimonials} /> },
        { id: "legal", label: "Privacy & terms", content: <LegalSection s={settings} /> },
      ]}
    />
  );
}
