"use client";

import { PRESETS } from "@/lib/presets";
import { PresetCard } from "@/components/PresetCard";
import { ThemePicker, useThemeSync } from "@/components/ThemePicker";
import { Github, Rocket } from "lucide-react";

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

  return (
    <div className="min-h-dvh">
      <Header theme={theme} setTheme={setTheme} />
      <Hero />
      <PresetGrid theme={theme} />
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
      <div className="mx-auto flex max-w-[1280px] items-center gap-8 px-8 py-4">
        <a href="/" className="flex items-center gap-3 font-bold text-[var(--color-ink)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent)] text-white shadow-sm">
            <Rocket size={17} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold">dragon</span>
            <span className="text-[10.5px] font-medium tracking-wide text-[var(--color-ink-dim)] mt-0.5">
              animated diagram DSL
            </span>
          </div>
        </a>
        <nav className="flex flex-1 items-center gap-6 text-[14px] font-medium text-[var(--color-ink-dim)]">
          <a href="/" className="text-[var(--color-ink)]">Catalog</a>
          <a href="/editor" className="hover:text-[var(--color-ink)]">Editor</a>
          <a href="/docs" className="hover:text-[var(--color-ink)]">Docs</a>
        </nav>
        <ThemePicker value={theme} onChange={setTheme} />
        <a
          href="https://github.com/cardene777/dragon"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg p-2 text-[var(--color-ink-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] transition-colors"
          aria-label="GitHub"
        >
          <Github size={17} />
        </a>
      </div>
    </header>
  );
}

function Hero(): React.ReactElement {
  return (
    <section className="mx-auto max-w-[1280px] px-8 py-16">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)] font-mono shadow-sm">
        Catalog / Presets
      </div>
      <h1 className="text-5xl font-bold tracking-tight text-[var(--color-ink)]">
        Text DSL <span className="text-[var(--color-accent)]">{PRESETS.length} presets</span>
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--color-ink-dim)]">
        swimlane / flow / sequence / topology / er / stateMachine / classDiagram / mindMap / flowchart / pubsub。 それぞれ 1 行宣言で複数 lane / node / edge を組み立てる。 低位 API より簡潔、 手書きより早い。 各 preset をクリックで拡大表示、 theme 切替で live preview。
      </p>
      <div className="mt-6 flex gap-3">
        <a
          href="/editor"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
        >
          Open editor <span className="text-lg leading-none">→</span>
        </a>
        <a
          href="/docs"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-surface)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-ink)] shadow-sm hover:shadow-md transition-shadow"
        >
          Read docs
        </a>
      </div>
    </section>
  );
}

function PresetGrid({ theme }: { theme: import("@/lib/theme").ThemeName }): React.ReactElement {
  return (
    <section className="mx-auto max-w-[1280px] px-8 pb-24">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold text-[var(--color-ink)]">Presets <span className="text-[var(--color-ink-mute)] text-[15px] ml-1 font-medium">({PRESETS.length})</span></h2>
        <p className="text-[13px] text-[var(--color-ink-dim)]">
          クリックで拡大、 theme 切替で全 preset が live 更新。
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {PRESETS.map((preset) => (
          <PresetCard key={preset.id} preset={preset} theme={theme} />
        ))}
      </div>
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
