import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { all, get, run } from "@/lib/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PublicPage {
  id: string;
  slug: string;
  title: string;
  bio: string | null;
  avatar: string | null;
  theme: string;
  accent: string;
  is_published: number;
}

function loadPage(slug: string): PublicPage | undefined {
  return get<PublicPage>(
    "SELECT id, slug, title, bio, avatar, theme, accent, is_published FROM pages WHERE slug = ?",
    slug
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = loadPage(slug);
  if (!page) return { title: "Page not found" };
  return {
    title: page.title,
    description: page.bio ?? `Links from ${page.title}, powered by LinkShort.`,
    openGraph: {
      title: page.title,
      description: page.bio ?? undefined,
      type: "profile",
    },
  };
}

export default async function PublicBioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = loadPage(slug);
  if (!page) notFound();

  const blocks = all<{ id: string; type: string; title: string | null; subtitle: string | null; url: string | null; clicks: number }>(
    "SELECT id, type, title, subtitle, url, clicks FROM page_blocks WHERE page_id = ? ORDER BY sort ASC",
    page.id
  );

  if (page.is_published) {
    run("UPDATE pages SET views = views + 1 WHERE id = ?", page.id);
  }

  const avatar = page.avatar || page.title.slice(0, 2).toUpperCase();
  const themeClass = `page-theme-${/^(midnight|aurora|sunset|ocean|mono|candy)$/.test(page.theme) ? page.theme : "midnight"}`;

  return (
    <div className={cn("flex min-h-screen flex-col items-center justify-center px-4 py-12", themeClass)}>
      <main className="w-full max-w-md">
        <div className="text-center">
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-xl font-bold text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]"
            style={{ background: page.accent }}
          >
            {avatar}
          </div>
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight">{page.title}</h1>
          {page.bio ? <p className="mx-auto mt-2 max-w-xs whitespace-pre-line text-sm leading-relaxed opacity-70">{page.bio}</p> : null}
        </div>

        {!page.is_published ? (
          <div className="mt-8 rounded-2xl border border-current/15 px-4 py-8 text-center">
            <div className="text-sm font-semibold">This page is paused</div>
            <p className="mt-1 text-xs opacity-60">The owner has temporarily hidden their links. Check back soon.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {blocks.map((block) => {
              if (block.type === "heading") {
                return (
                  <div key={block.id} className="pt-3 text-center text-xs font-bold uppercase tracking-widest opacity-60">
                    {block.title}
                  </div>
                );
              }
              if (block.type === "text") {
                return (
                  <p key={block.id} className="whitespace-pre-line px-2 text-center text-xs leading-relaxed opacity-65">
                    {block.subtitle || block.title}
                  </p>
                );
              }
              const isSocial = block.type === "social";
              return (
                <a
                  key={block.id}
                  href={`/api/pages/track?b=${block.id}`}
                  rel="nofollow"
                  className="block rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
                  style={
                    isSocial
                      ? { borderColor: `${page.accent}66`, color: page.accent, background: `${page.accent}12` }
                      : { background: page.accent, borderColor: page.accent, color: "#fff", boxShadow: `0 12px 30px -12px ${page.accent}99` }
                  }
                >
                  <span className="block truncate">{block.title}</span>
                  {block.subtitle ? <span className="mt-0.5 block truncate text-xs font-normal opacity-80">{block.subtitle}</span> : null}
                </a>
              );
            })}

            {blocks.length === 0 ? <p className="py-6 text-center text-xs opacity-50">No links yet — check back soon.</p> : null}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 text-xs uppercase tracking-widest opacity-40">
          <Link href="/" className="transition hover:opacity-100">
            Made with LinkShort
          </Link>
        </div>
      </main>
    </div>
  );
}
