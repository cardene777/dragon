import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import { ChevronLeft, ExternalLink, LayoutGrid, Share2 } from "lucide-react";
import { PRESETS } from "@/lib/presets";
import { SiteHeader } from "@/components/SiteHeader";
import { useToast } from "@/components/Toast";

/**
 * /preset/:slug = 単一 preset の detail page (Neumorphism style)。
 * hero + preview + prev/next navigation。 keyboard arrow で prev/next 移動対応。
 */
export function PresetDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const preset = PRESETS.find((p) => p.slug === params.id);

  useEffect(() => {
    if (!preset) return;
    const currentIdx = PRESETS.findIndex((p) => p.slug === preset.slug);
    const prevPreset = PRESETS[(currentIdx - 1 + PRESETS.length) % PRESETS.length]!;
    const nextPreset = PRESETS[(currentIdx + 1) % PRESETS.length]!;

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
        navigate(`/preset/${prevPreset.slug}`);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate(`/preset/${nextPreset.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preset, navigate]);

  if (!preset) {
    return (
      <div>
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <p className="text-[15px] text-[var(--v4-ink-dim,#5a6270)]">Preset not found</p>
        </div>
      </div>
    );
  }

  const currentIdx = PRESETS.findIndex((p) => p.slug === preset.slug);
  const prevPreset = PRESETS[(currentIdx - 1 + PRESETS.length) % PRESETS.length]!;
  const nextPreset = PRESETS[(currentIdx + 1) % PRESETS.length]!;

  const onShare = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ type: "success", title: "URL copied" });
    } catch {
      toast({ type: "error", title: "Copy failed" });
    }
  };

  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label="パンくず" className="nm-crumb">
            <Link to="/">overview</Link>
            <span aria-hidden="true">/</span>
            <Link to="/catalog">catalog</Link>
            <span aria-hidden="true">/</span>
            <Link to="/catalog/presets">presets</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">{preset.slug}</span>
          </nav>
          <span className="nm-eyebrow">{preset.eyebrow}</span>
          <h1 className="nm-hero-title">
            {preset.title} <span className="nm-gradient-accent">preset</span>
          </h1>
          <p className="nm-hero-subtitle">{preset.subtitle}</p>
          <div className="nm-hero-actions">
            <Link to={`/editor#preset=${preset.id}`} className="nm-hero-btn nm-hero-btn-primary">
              <span>Open in editor</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">
                <ExternalLink size={14} />
              </span>
            </Link>
            <Link to={`/compare?preset=${preset.id}`} className="nm-hero-btn nm-hero-btn-secondary">
              <span>Compare 6 themes</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">
                <LayoutGrid size={14} />
              </span>
            </Link>
            <button
              type="button"
              onClick={onShare}
              className="nm-hero-btn nm-hero-btn-secondary"
            >
              <span>Share URL</span>
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

        <section className="nm-presets-section" aria-label={`${preset.title} detail`}>
          <div className="nm-preset-detail-stage">
            <CdlDiagramView diagram={preset.diagram as never} />
          </div>
          <div className="nm-preset-detail-nav">
            <Link to={`/preset/${prevPreset.slug}`} className="nm-preset-detail-nav-btn">
              <ChevronLeft size={13} />
              <span className="opacity-70">prev</span>
              <span className="font-semibold">{prevPreset.title}</span>
            </Link>
            <span className="font-mono text-[11px] text-[var(--v4-ink-mute,#8a8678)]">
              {currentIdx + 1} / {PRESETS.length}
            </span>
            <Link to={`/preset/${nextPreset.slug}`} className="nm-preset-detail-nav-btn">
              <span className="opacity-70">next</span>
              <span className="font-semibold">{nextPreset.title}</span>
              <ChevronLeft size={13} className="rotate-180" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
