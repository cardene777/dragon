import { useEffect, useMemo, useState } from "react";
import { CdlDiagramView } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { Share2 } from "lucide-react";
import { PRESETS } from "@/lib/presets";
import { CATALOG_ITEMS } from "@/lib/catalog-items";
import { SiteHeader } from "@/components/SiteHeader";
import { useToast } from "@/components/Toast";

interface EditorEntry {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  diagram: CdlDiagram;
}

/**
 * PRESETS (20) は主軸 preset、 CATALOG_ITEMS の全 diagram (100+) も同じ id で lookup 可能。
 * hash `#preset=<id>` に対応、 見つからない場合は PRESETS[0] fallback。
 */
function lookupDiagram(id: string): EditorEntry | null {
  const p = PRESETS.find((x) => x.id === id);
  if (p) return { id: p.id, eyebrow: p.eyebrow, title: p.title, subtitle: p.subtitle, diagram: p.diagram };
  for (const [slug, items] of Object.entries(CATALOG_ITEMS)) {
    const hit = items.find((x) => x.id === id);
    if (hit) return { id: hit.id, eyebrow: slug.toUpperCase(), title: hit.title, subtitle: hit.subtitle, diagram: hit.diagram };
  }
  return null;
}

const FALLBACK: EditorEntry = {
  id: PRESETS[0]!.id,
  eyebrow: PRESETS[0]!.eyebrow,
  title: PRESETS[0]!.title,
  subtitle: PRESETS[0]!.subtitle,
  diagram: PRESETS[0]!.diagram,
};

export function EditorPage(): React.ReactElement {
  const { toast } = useToast();
  const [presetId, setPresetId] = useState<string>(PRESETS[0]!.id);

  const preset = useMemo(() => lookupDiagram(presetId) ?? FALLBACK, [presetId]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#preset=")) {
      const id = hash.slice(8);
      if (lookupDiagram(id)) setPresetId(id);
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
    <div>
      <SiteHeader />
      <div className="mx-auto flex max-w-[1800px] items-center gap-6 px-6 py-3 border-b border-[var(--v4-line,#e2e8f0)]">
        <span className="text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)]">Preset:</span>
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
        <div className="flex-1" />
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--v4-brand,#2d6a8f)] px-3 py-1.5 text-[13px] font-semibold text-white hover:brightness-110"
        >
          <Share2 size={13} /> Share
        </button>
      </div>
      <main className="bg-[var(--v4-canvas,#f8fafc)] p-6">
        <div className="mx-auto max-w-[1400px] rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)]">
              {preset.eyebrow}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--v4-ink,#1a1f2a)]">{preset.title}</h1>
            <p className="mt-1 text-[13.5px] text-[var(--v4-ink-dim,#5a6270)]">{preset.subtitle}</p>
          </div>
          <div className="rounded-xl bg-[var(--v4-canvas,#f8fafc)] p-4 overflow-auto max-h-[calc(100vh-320px)] [&_svg]:!max-w-full [&_svg]:!h-auto">
            <CdlDiagramView diagram={preset.diagram as never} />
          </div>
        </div>
      </main>
    </div>
  );
}
