import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import { ChevronLeft, ExternalLink, LayoutGrid, Rocket, Share2 } from "lucide-react";
import { PRESETS } from "@/lib/presets";
import { ThemePicker } from "@/components/ThemePicker";
import { useTheme } from "@/lib/useTheme";
import { useToast } from "@/components/Toast";

export function PresetDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useTheme();

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
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-[15px] text-[var(--v4-ink-dim,#5a6270)]">Preset not found</p>
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
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[var(--v4-line,#e2e8f0)] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:gap-6 sm:px-8 sm:py-4">
          <Link to="/" className="flex items-center gap-3 font-bold text-[var(--v4-ink,#1a1f2a)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--v4-brand,#2d6a8f)] text-white">
              <Rocket size={17} />
            </div>
            <span className="text-[15px]">dragon</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)]"
          >
            <ChevronLeft size={14} /> Back
          </Link>
          <div className="flex-1" />
          <ThemePicker value={theme} onChange={setTheme} />
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v4-canvas,#f8fafc)] px-3 py-1.5 text-[13px] font-semibold text-[var(--v4-ink,#1a1f2a)]"
          >
            <Share2 size={13} /> Share
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)] font-mono">
            {preset.eyebrow}
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--v4-ink,#1a1f2a)]">
            {preset.title}
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--v4-ink-dim,#5a6270)]">
            {preset.subtitle}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {preset.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--v4-canvas,#f8fafc)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--v4-ink-dim,#5a6270)] font-mono"
              >
                {t}
              </span>
            ))}
            <div className="h-4 w-px bg-[var(--v4-line,#e2e8f0)] mx-2" />
            <Link
              to={`/editor#preset=${preset.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v4-brand,#2d6a8f)] px-3 py-1.5 text-[13px] font-semibold text-white hover:brightness-110"
            >
              <ExternalLink size={13} /> Open in editor
            </Link>
            <Link
              to={`/compare?preset=${preset.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v4-canvas,#f8fafc)] px-3 py-1.5 text-[13px] font-semibold text-[var(--v4-ink,#1a1f2a)]"
            >
              <LayoutGrid size={13} /> Compare themes
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--v4-canvas,#f8fafc)] p-6 shadow-inner">
          <CdlDiagramView diagram={preset.diagram as never} />
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link
            to={`/preset/${prevPreset.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)] shadow-sm"
          >
            <ChevronLeft size={13} />
            <span className="opacity-70">prev</span>
            <span className="font-semibold">{prevPreset.title}</span>
          </Link>
          <span className="font-mono text-[11px] text-[var(--v4-ink-mute,#8a8678)]">
            {currentIdx + 1} / {PRESETS.length}
          </span>
          <Link
            to={`/preset/${nextPreset.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)] shadow-sm"
          >
            <span className="opacity-70">next</span>
            <span className="font-semibold">{nextPreset.title}</span>
            <ChevronLeft size={13} className="rotate-180" />
          </Link>
        </div>
      </main>
    </div>
  );
}
