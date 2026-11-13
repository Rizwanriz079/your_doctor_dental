import { Reveal } from "@/components/animations/reveal";
import { PageIntro } from "./sections";

/** Renders admin-managed legal text (plain text, paragraphs separated by blank lines). */
export function LegalPage({ title, text, fallback, updatedAt }: { title: string; text: string; fallback: string[]; updatedAt: string }) {
  const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/) : fallback;
  return (
    <>
      <PageIntro eyebrow="Legal" title={title} description={`Last updated ${new Date(updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`} />
      <section className="pb-20 pt-2">
        <Reveal className="container-page max-w-3xl space-y-5 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </Reveal>
      </section>
    </>
  );
}
