import Link from "next/link";
import { Github, Rocket, ChevronLeft, BookOpen, Zap, Palette, Code2 } from "lucide-react";
import { PRESETS } from "@/lib/presets";
import { THEMES, THEME_CONFIGS } from "@/lib/theme";

/**
 * /docs page — dragon の使い方 + preset 一覧 + theme 一覧 + API リファレンス。
 *
 * server component、 fully static、 hydrate 不要。 検索 bot にも即座に crawl 可能。
 */
export default function DocsPage(): React.ReactElement {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1000px] items-center gap-6 px-8 py-4">
          <Link href="/" className="flex items-center gap-3 font-bold text-[var(--color-ink)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white">
              <Rocket size={15} />
            </div>
            <span className="text-[14px]">dragon</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
          >
            <ChevronLeft size={14} /> Back to catalog
          </Link>
          <div className="flex-1" />
          <Link
            href="/editor"
            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-white"
          >
            Open editor →
          </Link>
          <a
            href="https://github.com/cardene777/dragon"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-[var(--color-ink-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            aria-label="GitHub"
          >
            <Github size={15} />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1000px] px-8 py-16">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)] font-mono shadow-sm">
          <BookOpen size={11} />
          Documentation
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-ink)]">Documentation</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--color-ink-dim)]">
          dragon は Text DSL で書ける animated SVG diagram library。 mermaid 感覚で記述して、 rough.js による Excalidraw 風の手描き感 / PCB 基板 / 立体感 Neumorphism など 6 theme を live 切替できる。
        </p>

        <section className="mt-16">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[var(--color-ink)]">
            <Zap size={20} className="text-[var(--color-accent)]" />
            Quick start
          </h2>
          <div className="rounded-2xl bg-[var(--color-surface)] p-6 shadow-sm">
            <ol className="space-y-4 text-[14px] leading-relaxed text-[var(--color-ink)]">
              <li>
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)] text-[12px] font-bold text-white">
                  1
                </span>
                <Link href="/" className="text-[var(--color-accent)] underline">Catalog</Link> で 10 preset を見比べ、 用途に合う 1 個を選ぶ。
              </li>
              <li>
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)] text-[12px] font-bold text-white">
                  2
                </span>
                <Link href="/editor" className="text-[var(--color-accent)] underline">Editor</Link> でその preset を base に JSON 編集、 theme を切替えて live preview。
              </li>
              <li>
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent)] text-[12px] font-bold text-white">
                  3
                </span>
                <strong>Share</strong> button で URL 生成 (diagram 全文を base64 圧縮埋込)、 team に送るか、 blog / docs に埋込む。
              </li>
            </ol>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[var(--color-ink)]">
            <Palette size={20} className="text-[var(--color-accent)]" />
            Themes ({THEMES.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {THEMES.map((t) => (
              <div key={t} className="rounded-xl bg-[var(--color-surface)] p-4 shadow-sm">
                <div className="mb-1 text-[13px] font-bold text-[var(--color-ink)]">
                  {THEME_CONFIGS[t].label}
                </div>
                <p className="text-[12.5px] leading-relaxed text-[var(--color-ink-dim)]">
                  {THEME_CONFIGS[t].description}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[10.5px] font-mono text-[var(--color-ink-mute)]">
                  <span>adapter · {THEME_CONFIGS[t].shapeAdapter}</span>
                  <span>·</span>
                  <span>title {THEME_CONFIGS[t].fontSize.title}px</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-[var(--color-ink)]">
            <Code2 size={20} className="text-[var(--color-accent)]" />
            Presets ({PRESETS.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRESETS.map((p) => (
              <div key={p.id} className="rounded-xl bg-[var(--color-surface)] p-4 shadow-sm">
                <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                  {p.eyebrow}
                </div>
                <div className="mt-1 text-[14px] font-bold text-[var(--color-ink)]">{p.title}</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-ink-dim)]">
                  {p.subtitle}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl bg-[var(--color-accent)] p-8 text-white">
          <h2 className="text-2xl font-bold">Try it now</h2>
          <p className="mt-2 text-white/85 text-[14px]">
            10 preset × 6 theme × live editor で、 1 分で最初の diagram が完成する。
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[14px] font-semibold text-[var(--color-accent)]"
            >
              Open editor →
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-[14px] font-semibold text-white"
            >
              Browse catalog
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
