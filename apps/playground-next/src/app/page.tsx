"use client";

import { useMemo, useState } from "react";
import { PRESETS } from "@/lib/presets";
import { PresetCard } from "@/components/PresetCard";
import { ThemePicker, useThemeSync } from "@/components/ThemePicker";
import { ThemeStrip } from "@/components/ThemeStrip";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { CommandPalette } from "@/components/CommandPalette";
import { Github, Rocket, Search, X } from "lucide-react";
import type { ThemeName } from "@/lib/theme";

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
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[var(--v4-brand,#2d6a8f)] focus:px-3 focus:py-2 focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header theme={theme} setTheme={setTheme} />
      <main id="main-content">
        <Hero />
        <PresetGrid query={query} setQuery={setQuery} filtered={filteredPresets} />
      </main>
      <Footer />
      <KeyboardShortcuts theme={theme} onThemeChange={setTheme} />
      <CommandPalette theme={theme} onThemeChange={setTheme} />
    </div>
  );
}

function Header({
  theme,
  setTheme,
}: {
  theme: ThemeName;
  setTheme: (v: ThemeName) => void;
}): React.ReactElement {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--v4-line,#e2e8f0)] bg-[var(--v4-canvas,#f8fafc)]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-5 sm:px-8 sm:py-4 md:gap-8">
        <a href="/" className="flex items-center gap-3 font-bold text-[var(--v4-ink,#1a1f2a)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--v4-brand,#2d6a8f)] text-white shadow-sm">
            <Rocket size={17} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold">dragon</span>
            <span className="hidden sm:inline text-[10.5px] font-medium tracking-wide text-[var(--v4-ink-dim,#5a6270)] mt-0.5">
              animated diagram DSL
            </span>
          </div>
        </a>
        <nav className="hidden md:flex flex-1 items-center gap-6 text-[14px] font-medium text-[var(--v4-ink-dim,#5a6270)]">
          <a
            href="/"
            className="text-[var(--v4-ink,#1a1f2a)] relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--v4-brand,#2d6a8f)] after:rounded-full"
          >
            Catalog
          </a>
          <a href="/editor" className="hover:text-[var(--v4-ink,#1a1f2a)] transition-colors">
            Editor
          </a>
          <a href="/compare" className="hover:text-[var(--v4-ink,#1a1f2a)] transition-colors">
            Compare
          </a>
          <a href="/docs" className="hover:text-[var(--v4-ink,#1a1f2a)] transition-colors">
            Docs
          </a>
          <a
            href="https://github.com/cardene777/cdl"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--v4-ink,#1a1f2a)] transition-colors inline-flex items-center gap-1"
            title="CDL core library (別 repo)"
          >
            CDL
            <span className="text-[10px]">↗</span>
          </a>
        </nav>
        <div className="md:hidden flex-1" />
        <ThemeStrip value={theme} onChange={setTheme} className="hidden lg:flex" />
        <ThemePicker value={theme} onChange={setTheme} />
        <DarkModeToggle />
        <a
          href="https://github.com/cardene777/dragon"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg p-2 text-[var(--v4-ink-dim,#5a6270)] hover:bg-[var(--nm-bg-base,#e8ecf1)] hover:text-[var(--v4-ink,#1a1f2a)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)] focus-visible:ring-offset-2"
          aria-label="GitHub repository (opens in new tab)"
        >
          <Github size={17} />
        </a>
      </div>
    </header>
  );
}

function Hero(): React.ReactElement {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-10 sm:px-8 sm:py-16">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--v4-canvas,#f8fafc)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)] font-mono shadow-sm fade-up">
        Catalog / Presets
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)] fade-up-delay-1">
        Text DSL{" "}
        <span className="text-[var(--v4-brand,#2d6a8f)]">{PRESETS.length} presets</span>
      </h1>
      <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)] fade-up-delay-2">
        swimlane / flow / sequence / topology / er / stateMachine / classDiagram / mindMap / flowchart / pubsub / infrastructure / tree / userJourney / funnel / quadrant / chart / gantt / network 等の 20 preset。 それぞれ 1 行宣言で複数 lane / node / edge を組み立てる。 各 preset をクリックで拡大表示、 phase 進行 + tween 差分 で 「動く図」 を live 確認。
      </p>
      <div className="mt-6 flex flex-wrap gap-3 fade-up-delay-3">
        <a
          href="/editor"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--v4-brand,#2d6a8f)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)] focus-visible:ring-offset-2"
        >
          Open editor <span className="text-lg leading-none">→</span>
        </a>
        <a
          href="/docs"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--v4-canvas,#f8fafc)] px-5 py-2.5 text-[14px] font-semibold text-[var(--v4-ink,#1a1f2a)] shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)] focus-visible:ring-offset-2"
        >
          Read docs
        </a>
      </div>
    </section>
  );
}

function PresetGrid({
  query,
  setQuery,
  filtered,
}: {
  query: string;
  setQuery: (v: string) => void;
  filtered: typeof PRESETS;
}): React.ReactElement {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-8 sm:pb-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-[var(--v4-ink,#1a1f2a)]">
          Presets{" "}
          <span className="text-[var(--v4-ink-mute,#99a3b3)] text-[15px] ml-1 font-medium">
            ({filtered.length}
            {filtered.length !== PRESETS.length ? ` of ${PRESETS.length}` : ""})
          </span>
        </h2>
        <div className="relative flex items-center gap-2">
          <Search
            size={14}
            className="absolute left-3 text-[var(--v4-ink-mute,#99a3b3)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search preset (title / tag / eyebrow)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-full bg-[var(--v4-canvas,#f8fafc)] pl-9 pr-9 py-1.5 text-[13px] text-[var(--v4-ink,#1a1f2a)] placeholder:text-[var(--v4-ink-mute,#99a3b3)] shadow-sm min-w-[280px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)]"
            aria-label="Search presets"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 rounded-full p-1 text-[var(--v4-ink-mute,#99a3b3)] hover:text-[var(--v4-ink,#1a1f2a)] hover:bg-[var(--nm-bg-base,#e8ecf1)]"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[var(--v4-canvas,#f8fafc)] p-12 text-center shadow-sm">
          <p className="text-[15px] font-medium text-[var(--v4-ink,#1a1f2a)]">
            No presets match "{query}"
          </p>
          <p className="mt-2 text-[13px] text-[var(--v4-ink-dim,#5a6270)]">
            Try clearing the search or use another keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {filtered.map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </div>
      )}
    </section>
  );
}

function Footer(): React.ReactElement {
  return (
    <footer className="border-t border-[var(--v4-line,#e2e8f0)] bg-[var(--nm-bg-base,#e8ecf1)]/50">
      <div className="mx-auto max-w-[1280px] px-8 py-12">
        <div className="flex items-center gap-3 text-[var(--v4-ink,#1a1f2a)] font-bold mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--v4-brand,#2d6a8f)] text-white">
            <Rocket size={15} />
          </div>
          dragon
        </div>
        <p className="max-w-md text-[13px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
          Text DSL × SVG animation の OSS。 mermaid 感覚で書ける、 動く図のためのツール。 core library:{" "}
          <a
            href="https://github.com/cardene777/cdl"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--v4-brand,#2d6a8f)] underline"
          >
            @cardenelabs/cdl
          </a>
          。
        </p>
        <p className="mt-4 text-[11px] text-[var(--v4-ink-mute,#99a3b3)] font-mono">
          © 2026 cardenelabs · MIT
        </p>
      </div>
    </footer>
  );
}
