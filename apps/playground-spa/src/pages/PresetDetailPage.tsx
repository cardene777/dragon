import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import { ChevronLeft, ExternalLink, Share2 } from "lucide-react";
import { PRESETS, presetName } from "@/lib/presets";
import { CATEGORIES } from "@/lib/catalog";
import { motionNote } from "@/lib/catalog-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { useToast } from "@/components/Toast";
import { useLocale } from "@/lib/useLocale";
import { 図に画面の言語を当てる } from "@/lib/diagram-lang";
import { PhaseChrome } from "@/components/PhaseChrome";
import { DiagramZoomControls } from "@/components/DiagramZoomControls";
import { useDiagramPanZoom } from "@/components/useDiagramPanZoom";
import { useScrollEdges } from "@/components/useScrollEdges";
import { 収める, 次の倍率, svgの幅, type 倍率の指定 } from "@/lib/diagram-zoom";
import "@/styles/compare.css";

/**
 * 台の中で巻き取る要素 (#1964)。 台 (`.nm-preset-detail-stage`) は段の札を置く基準なので巻き取らせない =
 * 台に巻き取らせると札も図と一緒に流れる (カタログの並べて見る側と同じ理由、#1749)
 */
function 台の巻き取りを探す(台: HTMLElement): HTMLElement | null {
  const 内側 = 台.querySelector(".nm-preset-detail-stage-inner");
  return 内側 instanceof HTMLElement ? 内側 : null;
}

/**
 * この画面が属する分類の呼び名 (#1805)。
 *
 * 出どころは `CATEGORIES[].label` 1 つ (#1788)。 画面側に字で持つと、呼び名を変えた日に
 * 見本の詳細だけが古い呼び名で分類を指す。
 */
const 分類の呼び名 = CATEGORIES.find((c) => c.slug === "presets")?.label ?? "";

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

  // 描く図は描画のたびに作り直さない。 作り直すと、倍率を測る部品が図が替わったとみなして測り直し続ける
  const 描く図 = useMemo(
    () => (preset ? 図に画面の言語を当てる(preset.diagram, locale) : null),
    [preset, locale],
  );
  // 図の倍率 (#1964)。 台は幅に合わせて描くので、カタログの並べて見る側と同じく広い図は縮み細い図は伸びる。
  // どのひな形に対する倍率かを一緒に持つ = 前へ / 次へで移ったら、効果で戻さなくても幅に合わせる側へ戻る
  const [倍率の状態, set倍率の状態] = useState<{ 図: string | null; 値: 倍率の指定 }>({
    図: null,
    値: 収める,
  });
  const 見ている図 = preset?.slug ?? null;
  const 倍率 = 倍率の状態.図 === 見ている図 ? 倍率の状態.値 : 収める;
  const viewBox幅 = useMemo(() => {
    if (!描く図) return undefined;
    try {
      return layout(描く図).viewBox.w;
    } catch {
      return undefined;
    }
  }, [描く図]);
  // ホイール・つまみ・ドラッグ。 この画面は縦に送って読む画面なので、修飾キー無しのホイールは奪わない
  const 操作 = useDiagramPanZoom({
    器: stageEl,
    巻き取りを探す: 台の巻き取りを探す,
    倍率,
    倍率を置く(値) {
      set倍率の状態({ 図: 見ている図, 値 });
    },
    viewBox幅,
    修飾キー無しで拡大: false,
    頁も送る: true,
    図の鍵: 描く図,
    // ここは見本を読む面。 携帯の幅では台が狭く、幅に合わせるだけだと箱の名前が 2.0px まで
    // 縮んで 1 文字も読めない (#2268 で実測)。 下限まで拡げ、器から出た分はドラッグで辿る
    読める下限を課す: true,
  });
  // 幅に合わせる指定でも、読める下限を割る図は下限の倍率で描く (#2269)
  const 指定した幅 = svgの幅(倍率, viewBox幅) ?? svgの幅(操作.読める下限の倍率 ?? 収める, viewBox幅);
  // 続きが隠れている端 (#2427)。 掴める形のカーソルは触れないと出ず、どちら側に続くかも言わない
  const 隠れた端 = useScrollEdges({ 器: stageEl, 巻き取りを探す: 台の巻き取りを探す, 図の鍵: 描く図 });
  function 倍率を動かす(向き: "上げる" | "下げる"): void {
    set倍率の状態({ 図: 見ている図, 値: 次の倍率(倍率, 向き, 操作.収めた倍率) });
  }
  function 器に合わせる(): void {
    set倍率の状態({ 図: 見ている図, 値: 収める });
  }

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
            {分類の呼び名}が見つかりません
          </p>
          <Link
            to="/catalog/presets"
            className="text-[14px] text-[var(--d-accent)] underline"
          >
            {分類の呼び名}の一覧に戻る →
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
        description: "この画面からは書き写し先に触れません",
      });
    }
  };

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label={locale === "ja" ? "道筋" : "Breadcrumb"} className="nm-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">›</span>
            <Link to="/catalog">カタログ</Link>
            <span aria-hidden="true">›</span>
            <Link to="/catalog/presets">{分類の呼び名}</Link>
            <span aria-hidden="true">›</span>
            <span className="cur">{preset.slug}</span>
          </nav>
          <span className="nm-eyebrow">{preset.eyebrow}</span>
          {/* 見出しは識別子ではなく言語に応じた名前を出す (#1047) */}
          <h1 className="nm-hero-title">
            {/* 名前だけを別要素にする = 検査が添えの語と分けて実名で照合できる (#1047) */}
            <span className="nm-hero-title-name">{presetName(preset, locale)}</span>{" "}
            <span className="nm-gradient-accent">{locale === "ja" ? 分類の呼び名 : "preset"}</span>
          </h1>
          <p className="nm-hero-subtitle">{preset.subtitle}</p>
          {/* 動きの種類は人が書かず図から導く (#1043)。 動かない図にも必ず出す (#1053) */}
          <p className="nm-hero-motion">{motionNote(preset.diagram)}</p>
          <div className="nm-hero-actions">
            <Link to={`/editor#preset=${preset.slug}`} className="nm-hero-btn nm-hero-btn-primary">
              <span>編集画面で開く</span>
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
          <div className="nm-preset-detail-tools">
            <DiagramZoomControls
              場所="詳細"
              倍率={倍率}
              収めた倍率={操作.収めた倍率}
              使える={viewBox幅 !== undefined}
              倍率を動かす={倍率を動かす}
              器に合わせる={器に合わせる}
            />
          </div>
          <div
            className="nm-preset-detail-stage"
            ref={setStageEl}
            data-cdl-zoom={指定した幅 === undefined ? undefined : "on"}
            data-cdl-pannable={操作.動かせる ? "" : undefined}
            data-cdl-panning={操作.移動中 ? "" : undefined}
            data-cdl-more={隠れた端 === "無し" ? undefined : 隠れた端}
            style={
              指定した幅 === undefined
                ? undefined
                : ({ "--cdl-zoom-width": `${指定した幅}px` } as React.CSSProperties)
            }
          >
            <div className="nm-preset-detail-stage-inner">
              <CdlDiagramView hideMiniPhaseIndicator diagram={描く図 ?? preset.diagram} hideHeader />
            </div>
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
