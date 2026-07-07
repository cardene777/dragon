import { Link } from "react-router";
import { Github, Rocket } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { CATALOG_ITEMS } from "@/lib/catalog-items";
import { ThemePicker } from "@/components/ThemePicker";
import { useTheme } from "@/lib/useTheme";
import { cn } from "@/lib/cn";

/**
 * dragon Home = 旧 Astro /catalog/index 相当。
 * 7 category × 統計 + hero + CTA。
 * 個別 catalog は /catalog/:slug、 単一 preset は /preset/:id。
 */
export function HomePage(): React.ReactElement {
  const [theme, setTheme] = useTheme();

  const totalItems = Object.values(CATALOG_ITEMS).reduce((sum, arr) => sum + arr.length, 0);
  const presetsCount = CATALOG_ITEMS.presets?.length ?? 0;

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[var(--v4-brand,#2d6a8f)] focus:px-3 focus:py-2 focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Header theme={theme} setTheme={setTheme} />

      <main id="main-content">
        {/* Hero */}
        <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8 sm:py-16">
          <div className="mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)]">
            CATALOG · primitives · presets · animation · patterns
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)]">
            Text DSL ×{" "}
            <span className="text-[var(--v4-brand,#2d6a8f)]">Animated SVG</span>
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
            dragon DSL の primitives / styles / animation / patterns を {CATEGORIES.length} カテゴリで整理。 各カテゴリに小さい図を並べて、 1 概念ずつ動作確認できる。 engine 層は{" "}
            <a
              href="https://github.com/cardene777/cdl"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--v4-brand,#2d6a8f)] underline"
            >
              @cardenelabs/cdl
            </a>{" "}
            が担う。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/catalog/presets"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--v4-brand,#2d6a8f)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
            >
              Browse presets <span className="text-lg leading-none">→</span>
            </Link>
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[14px] font-semibold text-[var(--v4-ink,#1a1f2a)] shadow-sm hover:shadow-md transition-shadow"
            >
              Open editor
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section
          aria-label="dragon catalog stats"
          className="mx-auto max-w-[1280px] px-4 pb-8 sm:px-8"
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { num: CATEGORIES.length, label: "categories" },
              { num: presetsCount, label: "presets" },
              { num: totalItems, label: "items" },
              { num: 6, label: "themes" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white p-5 shadow-sm text-center"
              >
                <div className="text-3xl font-bold text-[var(--v4-ink,#1a1f2a)]">{s.num}</div>
                <div className="mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-[var(--v4-ink-dim,#5a6270)]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8 sm:pb-24">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-bold text-[var(--v4-ink,#1a1f2a)]">
              Categories{" "}
              <span className="text-[var(--v4-ink-mute,#8a8678)] text-[15px] ml-1 font-medium">
                ({CATEGORIES.length})
              </span>
            </h2>
            <p className="text-[13px] text-[var(--v4-ink-dim,#5a6270)]">
              各カテゴリはそれぞれ独立したページを持ち、 中で小さい図を並べて 1 概念ずつ動作確認できる。 basic は日常最頻使用、 extended は応用向け。
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/catalog/${cat.slug}`}
                className={cn(
                  "group flex flex-col rounded-2xl bg-white p-6 shadow-sm transition-all duration-300",
                  "hover:shadow-md hover:-translate-y-0.5",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)] focus-visible:ring-offset-2",
                )}
              >
                <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)]">
                  {cat.eyebrow}
                </div>
                <h3 className="mt-1 text-[20px] font-bold text-[var(--v4-ink,#1a1f2a)]">
                  {cat.label}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
                  {cat.desc}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {cat.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[var(--v4-canvas,#f8fafc)] px-2.5 py-0.5 text-[10.5px] font-medium text-[var(--v4-ink-dim,#5a6270)] font-mono"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-[13px] font-semibold text-[var(--v4-brand,#2d6a8f)]">
                  <span>open</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Header({
  theme,
  setTheme,
}: {
  theme: import("@/lib/theme").ThemeName;
  setTheme: (v: import("@/lib/theme").ThemeName) => void;
}): React.ReactElement {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--v4-line,#e2e8f0)] bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-5 sm:px-8 sm:py-4 md:gap-8">
        <Link to="/" className="flex items-center gap-3 font-bold text-[var(--v4-ink,#1a1f2a)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--v4-brand,#2d6a8f)] text-white shadow-sm">
            <Rocket size={17} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold">dragon</span>
            <span className="hidden sm:inline text-[10.5px] font-medium tracking-wide text-[var(--v4-ink-dim,#5a6270)] mt-0.5">
              animated diagram DSL
            </span>
          </div>
        </Link>
        <nav className="hidden md:flex flex-1 items-center gap-6 text-[14px] font-medium text-[var(--v4-ink-dim,#5a6270)]">
          <Link
            to="/"
            className="text-[var(--v4-ink,#1a1f2a)] relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--v4-brand,#2d6a8f)] after:rounded-full"
          >
            Catalog
          </Link>
          <Link to="/editor" className="hover:text-[var(--v4-ink,#1a1f2a)] transition-colors">
            Editor
          </Link>
          <Link to="/compare" className="hover:text-[var(--v4-ink,#1a1f2a)] transition-colors">
            Compare
          </Link>
          <Link to="/docs" className="hover:text-[var(--v4-ink,#1a1f2a)] transition-colors">
            Docs
          </Link>
          <a
            href="https://github.com/cardene777/cdl"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--v4-ink,#1a1f2a)] transition-colors inline-flex items-center gap-1"
            title="CDL core library (別 repo)"
          >
            CDL <span className="text-[10px]">↗</span>
          </a>
        </nav>
        <div className="md:hidden flex-1" />
        <ThemePicker value={theme} onChange={setTheme} />
        <a
          href="https://github.com/cardene777/dragon"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg p-2 text-[var(--v4-ink-dim,#5a6270)] hover:bg-[var(--v4-canvas,#f8fafc)] hover:text-[var(--v4-ink,#1a1f2a)] transition-colors"
          aria-label="GitHub repository (opens in new tab)"
        >
          <Github size={17} />
        </a>
      </div>
    </header>
  );
}

function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-[var(--v4-line,#e2e8f0)] bg-[var(--v4-canvas,#f8fafc)]">
      <div className="mx-auto max-w-[1280px] px-8 py-12">
        <div className="flex items-center gap-3 text-[var(--v4-ink,#1a1f2a)] font-bold mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--v4-brand,#2d6a8f)] text-white">
            <Rocket size={15} />
          </div>
          dragon
        </div>
        <p className="max-w-md text-[13px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
          Text DSL × SVG animation の OSS。 core:{" "}
          <a
            href="https://github.com/cardene777/cdl"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--v4-brand,#2d6a8f)] underline"
          >
            @cardenelabs/cdl
          </a>
        </p>
        <p className="mt-4 text-[11px] text-[var(--v4-ink-mute,#8a8678)] font-mono">
          © 2026 cardenelabs · MIT
        </p>
      </div>
    </footer>
  );
}
