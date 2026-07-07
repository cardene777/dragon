import { Link } from "react-router";
import { PRESETS } from "@/lib/presets";
import { THEMES, THEME_CONFIGS } from "@/lib/theme";
import { SiteHeader } from "@/components/SiteHeader";

export function DocsPage(): React.ReactElement {
  return (
    <div>
      <SiteHeader />
      <main className="mx-auto max-w-[1000px] px-4 py-10 sm:px-8 sm:py-16">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)]">
          Documentation
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
          dragon は Text DSL で書ける animated SVG diagram library。 mermaid 感覚で記述して、 rough.js
          / gsap による 動く図が 1 分で。
        </p>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border-l-4 border-[var(--v4-brand,#2d6a8f)]">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)] mb-1">
            About the core library
          </div>
          <p className="text-[13px] leading-relaxed text-[var(--v4-ink,#1a1f2a)]">
            dragon は playground app。 core library は{" "}
            <a
              href="https://github.com/cardene777/cdl"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[var(--v4-brand,#2d6a8f)] underline"
            >
              CDL (Chainome Diagram Language)
            </a>{" "}
            として別 repo に公開。 npm package =
            {" "}
            <code className="rounded bg-[var(--v4-canvas,#f8fafc)] px-1.5 py-0.5 font-mono text-[11.5px]">
              @cardenelabs/cdl
            </code>{" "}
            +{" "}
            <code className="rounded bg-[var(--v4-canvas,#f8fafc)] px-1.5 py-0.5 font-mono text-[11.5px]">
              @cardenelabs/anim
            </code>
            。
          </p>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-[var(--v4-ink,#1a1f2a)]">
            Themes ({THEMES.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {THEMES.map((t) => (
              <div key={t} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="text-[13px] font-bold text-[var(--v4-ink,#1a1f2a)]">
                  {THEME_CONFIGS[t].label}
                </div>
                <p className="mt-1 text-[12.5px] text-[var(--v4-ink-dim,#5a6270)]">
                  {THEME_CONFIGS[t].description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-[var(--v4-ink,#1a1f2a)]">
            Presets ({PRESETS.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRESETS.map((p) => (
              <Link
                key={p.id}
                to={`/preset/${p.slug}`}
                className="rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)]">
                  {p.eyebrow}
                </div>
                <div className="mt-1 text-[14px] font-bold text-[var(--v4-ink,#1a1f2a)]">
                  {p.title}
                </div>
                <p className="mt-1 text-[12.5px] text-[var(--v4-ink-dim,#5a6270)]">{p.subtitle}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
