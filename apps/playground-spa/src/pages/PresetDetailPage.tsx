import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import { ChevronLeft, ExternalLink, Share2 } from "lucide-react";
import { PRESETS } from "@/lib/presets";
import { SiteHeader } from "@/components/SiteHeader";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/useLocale";
import "@/styles/compare.css";

/**
 * /preset/:slug = 単一 preset の detail page (Neumorphism style)。
 * hero + preview + prev/next navigation。 keyboard arrow で prev/next 移動対応。
 */
export function PresetDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locale] = useLocale();

  const preset = PRESETS.find((p) => p.slug === params.id);

  useEffect(() => {
    if (!preset) return;
    const currentIdx = PRESETS.findIndex((p) => p.slug === preset.slug);
    const prevPreset = PRESETS[(currentIdx - 1 + PRESETS.length) % PRESETS.length];
    const nextPreset = PRESETS[(currentIdx + 1) % PRESETS.length];

    const onKey = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        void navigate(`/preset/${prevPreset.slug}`);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        void navigate(`/preset/${nextPreset.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preset, navigate]);

  if (!preset) {
    return (
      <div>
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center gap-4 px-6">
          <p className="text-[16px] text-[var(--v4-ink-dim,#5a6270)]">
            プリセットが見つかりません
          </p>
          <Link
            to="/catalog/presets"
            className="text-[14px] text-[var(--v4-brand,#8a5a2a)] underline"
          >
            プリセット一覧に戻る →
          </Link>
        </div>
      </div>
    );
  }

  const currentIdx = PRESETS.findIndex((p) => p.slug === preset.slug);
  const prevPreset = PRESETS[(currentIdx - 1 + PRESETS.length) % PRESETS.length];
  const nextPreset = PRESETS[(currentIdx + 1) % PRESETS.length];

  const onShare = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ type: "success", title: "URL をコピーしました" });
    } catch {
      toast({ type: "error", title: "コピーに失敗しました" });
    }
  };

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label={locale === "ja" ? "パンくずリスト" : "Breadcrumb"} className="nm-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">/</span>
            <Link to="/catalog">カタログ</Link>
            <span aria-hidden="true">/</span>
            <Link to="/catalog/presets">プリセット</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">{preset.slug}</span>
          </nav>
          <span className="nm-eyebrow">{preset.eyebrow}</span>
          <h1 className="nm-hero-title">
            {preset.title} <span className="nm-gradient-accent">プリセット</span>
          </h1>
          <p className="nm-hero-subtitle">{preset.subtitle}</p>
          <div className="nm-hero-actions">
            <Link to={`/editor#preset=${preset.slug}`} className="nm-hero-btn nm-hero-btn-primary">
              <span>エディタで開く</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">
                <ExternalLink size={14} />
              </span>
            </Link>
            <button
              type="button"
              onClick={() => {
                void onShare();
              }}
              className="nm-hero-btn nm-hero-btn-secondary"
            >
              <span>URL コピー</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">
                <Share2 size={14} />
              </span>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {preset.tags.map((t) => (
              <span key={t} className="nm-preset-tag">
                {t}
              </span>
            ))}
          </div>
        </section>

        <section className="nm-presets-section" aria-label={`${preset.title} 詳細`}>
          <div className="nm-preset-detail-stage">
            <CdlDiagramView diagram={preset.diagram} hideHeader />
          </div>
          <div className="nm-preset-detail-nav">
            <Link
              to={`/preset/${prevPreset.slug}`}
              className="nm-preset-detail-nav-btn"
              aria-label={`前へ: ${prevPreset.title}`}
            >
              <ChevronLeft size={13} />
              <span className="opacity-70">前へ</span>
              <span className="font-semibold">{prevPreset.title}</span>
            </Link>
            <span className="font-mono text-[11px] text-[var(--v4-ink-mute,#8a8678)]">
              {currentIdx + 1} / {PRESETS.length}
            </span>
            <Link
              to={`/preset/${nextPreset.slug}`}
              className="nm-preset-detail-nav-btn"
              aria-label={`次へ: ${nextPreset.title}`}
            >
              <span className="opacity-70">次へ</span>
              <span className="font-semibold">{nextPreset.title}</span>
              <ChevronLeft size={13} className="rotate-180" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
