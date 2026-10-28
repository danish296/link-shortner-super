import Link from "next/link";

export interface LegalSection {
  heading: string;
  body: string[];
  bullets?: string[];
}

export function LegalDoc({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="container-x max-w-3xl py-12">
      <span className="badge badge-muted">Last updated {updated}</span>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">{intro}</p>

      <div className="mt-10 space-y-8">
        {sections.map((section, index) => (
          <section key={section.heading} id={`s${index + 1}`}>
            <h2 className="font-display text-lg font-bold">
              <span className="mr-2 text-muted/60">{index + 1}.</span>
              {section.heading}
            </h2>
            <div className="mt-2 space-y-3">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
            {section.bullets ? (
              <ul className="mt-3 space-y-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-muted">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted/60" />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-3 rounded-xl border border-line bg-card px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>Questions about this document? Email legal@linkshort.app.</p>
        <div className="flex gap-3">
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/cookies" className="hover:text-ink">Cookies</Link>
        </div>
      </div>
    </div>
  );
}
