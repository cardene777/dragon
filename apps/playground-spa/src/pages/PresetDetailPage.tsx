import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import { ChevronLeft, ExternalLink, Share2 } from "lucide-react";
import { PRESETS, presetName } from "@/lib/presets";
import { motionNote } from "@/lib/catalog-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/useLocale";
import { PhaseChrome } from "@/components/PhaseChrome";
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
  // シーンの表示は engine が入れ物へ書く属性を読むため、要素そのものが要る (#1239)
  const [stageEl, setStageEl] = useState<HTMLElement | null>(null);

  const preset = PRESETS.find((p) => p.slug === params.id);

  useEffect(() => {
    if (!preset) return;
    const currentIdx = PRESETS.findIndex((p) => p.slug === preset.slug);
    const prevPreset = PRESETS[(currentIdx - 1 + PRESETS.length) % PRESETS.length];
    const nextPreset = PRESETS[(currentIdx + 1) % PRESETS.length];
    // `preset` は `PRESETS` から引いた要素なので添字は必ず範囲に収まる。 一覧が空なら
    // そもそも `preset` が見つからず、上で既に返している
    if (prevPreset === undefined || nextPreset === undefined) return;

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
        <div className="flex min-h-[calc(100vh-60px)] flex-col items-center justify-center gap-4 px-6">
          <p className="text-[16px] text-[var(--d-text-secondary)]">
            プリセットが見つかりません
          </p>
          <Link
            to="/catalog/presets"
            className="text-[14px] text-[var(--d-accent)] underline"
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
  // 添字が範囲に収まる根拠は上の効果と同じ。 ここは描く側なので、引けない形は
  // **その場で落とす** = 落ちる場所を原因から離さないため
  if (prevPreset === undefined || nextPreset === undefined) {
    throw new Error(`前後の見本を引けない (一覧 ${PRESETS.length} 件、 現在 ${currentIdx})`);
  }

  const onShare = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        type: "success",
        title: "URL をコピーしました",
        description: `/preset/${preset.slug}`,
      });
    } catch {
      toast({
        type: "error",
        title: "コピーできませんでした",
        description: "この画面では clipboard に触れない",
      });
    }
  };

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label={locale === "ja" ? "パンくずリスト" : "Breadcrumb"} className="nm-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">›</span>
            <Link to="/catalog">カタログ</Link>
            <span aria-hidden="true">›</span>
            <Link to="/catalog/presets">プリセット</Link>
            <span aria-hidden="true">›</span>
            <span className="cur">{preset.slug}</span>
          </nav>
          <span className="nm-eyebrow">{preset.eyebrow}</span>
          {/* 見出しは識別子ではなく言語に応じた名前を出す (#1047) */}
          <h1 className="nm-hero-title">
            {/* 名前だけを別要素にする = 検査が添えの語と分けて実名で照合できる (#1047) */}
            <span className="nm-hero-title-name">{presetName(preset, locale)}</span>{" "}
            <span className="nm-gradient-accent">{locale === "ja" ? "プリセット" : "preset"}</span>
          </h1>
          <p className="nm-hero-subtitle">{preset.subtitle}</p>
          {/* 動きの種類は人が書かず図から導く (#1043)。 動かない図にも必ず出す (#1053) */}
          <p className="nm-hero-motion">{motionNote(preset.diagram)}</p>
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

        <section className="nm-presets-section" aria-label={`${presetName(preset, locale)} 詳細`}>
          <div className="nm-preset-detail-stage" ref={setStageEl}>
            <CdlDiagramView hideMiniPhaseIndicator diagram={preset.diagram} hideHeader />
            {/* 設計 (`06 見本の詳細`) は札を左上に描いている (#1239) */}
            <PhaseChrome stage={stageEl} phases={preset.diagram.phases} />
          </div>
          <div className="nm-preset-detail-nav">
            <Link
              to={`/preset/${prevPreset.slug}`}
              className="nm-preset-detail-nav-btn"
              aria-label={`前へ: ${presetName(prevPreset, locale)}`}
            >
              <ChevronLeft size={13} />
              <span className="opacity-70">前へ</span>
              <span className="font-semibold">{presetName(prevPreset, locale)}</span>
            </Link>
            <span className="font-mono text-[11px] text-[var(--d-text-muted)]">
              {currentIdx + 1} / {PRESETS.length}
            </span>
            <Link
              to={`/preset/${nextPreset.slug}`}
              className="nm-preset-detail-nav-btn"
              aria-label={`次へ: ${presetName(nextPreset, locale)}`}
            >
              <span className="opacity-70">次へ</span>
              <span className="font-semibold">{presetName(nextPreset, locale)}</span>
              <ChevronLeft size={13} className="rotate-180" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
