import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { CdlDiagramView } from "@cardenelabs/cdl";
import { ChevronLeft, Rocket, Share2 } from "lucide-react";
import { PRESETS } from "@/lib/presets";
import { ThemePicker } from "@/components/ThemePicker";
import { useTheme } from "@/lib/useTheme";
import { useToast } from "@/components/Toast";

export function EditorPage(): React.ReactElement {
  const { toast } = useToast();
  const [theme, setTheme] = useTheme();
  const [presetId, setPresetId] = useState<string>(PRESETS[0]!.id);

  const preset = useMemo(
    () => PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!,
    [presetId],
  );

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#preset=")) {
      const id = hash.slice(8);
      if (PRESETS.some((p) => p.id === id)) setPresetId(id);
    }
  }, []);

  const onShare = async (): Promise<void> => {
    const url = `${window.location.origin}/editor#preset=${presetId}`;
    try {
      await navigator.clipboard.writeText(url);
      window.history.replaceState({}, "", `/editor#preset=${presetId}`);
      toast({ type: "success", title: "URL copied", description: url });
    } catch {
      toast({ type: "error", title: "Copy failed" });
    }
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--v4-line,#e2e8f0)] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] items-center gap-6 px-6 py-3">
          <Link to="/" className="flex items-center gap-3 font-bold text-[var(--v4-ink,#1a1f2a)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--v4-brand,#2d6a8f)] text-white">
              <Rocket size={15} />
            </div>
            <span className="text-[14px]">dragon</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)]"
          >
            <ChevronLeft size={14} /> Back
          </Link>
          <div className="flex-1" />
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="rounded-lg bg-[var(--v4-canvas,#f8fafc)] px-3 py-1.5 text-[13px] font-medium text-[var(--v4-ink,#1a1f2a)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)]"
            aria-label="Preset"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <ThemePicker value={theme} onChange={setTheme} />
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v4-brand,#2d6a8f)] px-3 py-1.5 text-[13px] font-semibold text-white hover:brightness-110"
          >
            <Share2 size={13} /> Share
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-[var(--v4-canvas,#f8fafc)] p-6">
        <div className="mx-auto max-w-[1400px] rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)]">
              {preset.eyebrow}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--v4-ink,#1a1f2a)]">{preset.title}</h1>
            <p className="mt-1 text-[13.5px] text-[var(--v4-ink-dim,#5a6270)]">{preset.subtitle}</p>
          </div>
          <div className="rounded-xl bg-[var(--v4-canvas,#f8fafc)] p-4">
            <CdlDiagramView diagram={preset.diagram as never} />
          </div>
        </div>
      </main>
    </div>
  );
}
