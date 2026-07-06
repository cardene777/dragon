"use client";

import { useMemo, useState } from "react";
import { PRESETS } from "@/lib/presets";
import { PresetCard } from "@/components/PresetCard";
import { ThemePicker, useThemeSync } from "@/components/ThemePicker";
import { ThemeStrip } from "@/components/ThemeStrip";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { DiagramView } from "@/components/DiagramView";
import { Github, Rocket, Search, X } from "lucide-react";
import type { ThemeName } from "@/lib/theme";

/**
 * catalog / presets landing page (playground-next default route)。
 *
 * layout ...
 *   ┌───────────────────────────────────────┐
 *   │  header (logo + nav + theme picker)   │
 *   ├───────────────────────────────────────┤
 *   │  hero (Text DSL 10 presets)           │
 *   ├───────────────────────────────────────┤
 *   │  preset grid (2 col × 5 row)          │
 *   │   - each preset = card + click modal  │
 *   └───────────────────────────────────────┘
 */
export default function Page(): React.ReactElement {
  const [theme, setTheme] = useThemeSync();
  const [query, setQuery] = useState("");

  const filteredPresets = useMemo(() => {
    if (!query.trim()) return PRESETS;
    const q = query.toLowerCase();
    return PRESETS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.eyebrow.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div className="min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-3 focus:py-2 focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header theme={theme} setTheme={setTheme} />
      <main id="main-content">
        <Hero theme={theme} />
        <PresetGrid theme={theme} query={query} setQuery={setQuery} filtered={filteredPresets} />
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
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-5 sm:px-8 sm:py-4 md:gap-8">
        <a href="/" className="flex items-center gap-3 font-bold text-[var(--color-ink)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white shadow-sm">
            <Rocket size={17} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold">dragon</span>
            <span className="hidden sm:inline text-[10.5px] font-medium tracking-wide text-[var(--color-ink-dim)] mt-0.5">
              animated diagram DSL
            </span>
          </div>
        </a>
        <nav className="hidden md:flex flex-1 items-center gap-6 text-[14px] font-medium text-[var(--color-ink-dim)]">
          <a href="/" className="text-[var(--color-ink)]">Catalog</a>
          <a href="/editor" className="hover:text-[var(--color-ink)]">Editor</a>
          <a href="/docs" className="hover:text-[var(--color-ink)]">Docs</a>
        </nav>
        <div className="md:hidden flex-1" />
        <ThemeStrip value={theme} onChange={setTheme} className="hidden lg:flex" />
        <ThemePicker value={theme} onChange={setTheme} />
        <DarkModeToggle />
        <a
          href="https://github.com/cardene777/dragon"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg p-2 text-[var(--color-ink-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          aria-label="GitHub repository (opens in new tab)"
        >
          <Github size={17} />
        </a>
      </div>
    </header>
  );
}

function Hero({ theme }: { theme: ThemeName }): React.ReactElement {
  const heroDemo = PRESETS.find((p) => p.id === "swimlane") ?? PRESETS[0]!;
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8 sm:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)] font-mono shadow-sm">
            Catalog / Presets
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-ink)]">
            Text DSL <span className="text-[var(--color-accent)]">{PRESETS.length} presets</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--color-ink-dim)]">
            swimlane / flow / sequence / topology / er / stateMachine / classDiagram / mindMap / flowchart / pubsub。 それぞれ 1 行宣言で複数 lane / node / edge を組み立てる。 低位 API より簡潔、 手書きより早い。 各 preset をクリックで拡大表示、 theme 切替で live preview。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/editor"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              Open editor <span className="text-lg leading-none">→</span>
            </a>
            <a
              href="/docs"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-ink)] shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              Read docs
            </a>
          </div>
        </div>
        <div className="hidden lg:block rounded-2xl bg-[var(--color-surface-2)] p-6 shadow-[var(--shadow-inset)]">
          <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)] mb-2">
            Live preview · {theme}
          </div>
          <DiagramView preset={heroDemo} theme={theme} className="w-full" />
        </div>
      </div>
    </section>
  );
}

function PresetGrid({
  theme,
  query,
  setQuery,
  filtered,
}: {
  theme: ThemeName;
  query: string;
  setQuery: (v: string) => void;
  filtered: typeof PRESETS;
}): React.ReactElement {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8 sm:pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-[var(--color-ink)]">
          Presets <span className="text-[var(--color-ink-mute)] text-[15px] ml-1 font-medium">({filtered.length}{filtered.length !== PRESETS.length ? ` of ${PRESETS.length}` : ""})</span>
        </h2>
        <div className="relative flex items-center gap-2">
          <Search size={14} className="absolute left-3 text-[var(--color-ink-mute)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search preset (title / tag / eyebrow)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-full bg-[var(--color-surface)] pl-9 pr-9 py-1.5 text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-mute)] shadow-sm min-w-[280px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label="Search presets"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 rounded-full p-1 text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--color-surface)] p-12 text-center shadow-sm">
          <p className="text-[15px] font-medium text-[var(--color-ink)]">No presets match "{query}"</p>
          <p className="mt-2 text-[13px] text-[var(--color-ink-dim)]">Try clearing the search or use another keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {filtered.map((preset) => (
            <PresetCard key={preset.id} preset={preset} theme={theme} />
          ))}
        </div>
      )}
    </section>
  );
}

function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-[var(--color-border-soft)] bg-[var(--color-surface-2)]/50">
      <div className="mx-auto max-w-[1280px] px-8 py-12">
        <div className="flex items-center gap-3 text-[var(--color-ink)] font-bold mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
            <Rocket size={15} />
          </div>
          dragon
        </div>
        <p className="max-w-md text-[13px] leading-relaxed text-[var(--color-ink-dim)]">
          Text DSL × SVG animation の OSS。 mermaid 感覚で書ける、 動く図のためのツール。
        </p>
        <p className="mt-4 text-[11px] text-[var(--color-ink-mute)] font-mono">
          © 2026 cardenelabs · MIT
        </p>
      </div>
    </footer>
  );
}
