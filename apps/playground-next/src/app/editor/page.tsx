"use client";

import { useEffect, useMemo, useState } from "react";
import { CdlDiagramThumbnail } from "@cardenelabs/cdl";
import { PRESETS } from "@/lib/presets";
import { ThemePicker, useThemeSync } from "@/components/ThemePicker";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { useToast } from "@/components/Toast";
import { Github, Rocket, Share2, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * /editor page — preset dropdown で選択 + live preview + theme switch + share URL。
 *
 * cdl の CdlDiagram は 関数 builder で構築されるため JSON edit 不可、
 * 代わりに 20 preset dropdown で quick preview を可能にする。
 * share URL は preset id を hash に埋める簡易実装。
 */
export default function EditorPage(): React.ReactElement {
  const { toast } = useToast();
  const [theme, setTheme] = useThemeSync();
  const [presetId, setPresetId] = useState<string>(PRESETS[0]!.id);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

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
    const url = `${window.location.origin}${window.location.pathname}#preset=${presetId}`;
    try {
      await navigator.clipboard.writeText(url);
      window.history.replaceState({}, "", `${window.location.pathname}#preset=${presetId}`);
      setShareState("copied");
      toast({ type: "success", title: "URL copied", description: url });
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      toast({ type: "error", title: "Copy failed" });
    }
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--v4-line,#e2e8f0)] bg-[var(--v4-canvas,#f8fafc)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] items-center gap-6 px-6 py-3">
          <Link
            href="/"
            className="flex items-center gap-3 font-bold text-[var(--v4-ink,#1a1f2a)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--v4-brand,#2d6a8f)] text-white">
              <Rocket size={15} />
            </div>
            <span className="text-[14px]">dragon</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-[13px] font-medium text-[var(--v4-ink-dim,#5a6270)] hover:text-[var(--v4-ink,#1a1f2a)]"
          >
            <ChevronLeft size={14} /> Back to catalog
          </Link>
          <div className="flex-1" />
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="rounded-lg bg-[var(--nm-bg-base,#e8ecf1)] px-3 py-1.5 text-[13px] font-medium text-[var(--v4-ink,#1a1f2a)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v4-brand,#2d6a8f)]"
            aria-label="Preset"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <ThemePicker value={theme} onChange={setTheme} />
          <DarkModeToggle />
          <button
            type="button"
            onClick={onShare}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all",
              shareState === "copied"
                ? "bg-green-100 text-green-700"
                : "bg-[var(--v4-brand,#2d6a8f)] text-white hover:brightness-110",
            )}
          >
            {shareState === "copied" ? (
              <>
                <Check size={13} /> Copied
              </>
            ) : (
              <>
                <Share2 size={13} /> Share
              </>
            )}
          </button>
          <a
            href="https://github.com/cardene777/dragon"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-[var(--v4-ink-dim,#5a6270)] hover:bg-[var(--nm-bg-base,#e8ecf1)] hover:text-[var(--v4-ink,#1a1f2a)]"
            aria-label="GitHub"
          >
            <Github size={15} />
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-[var(--nm-bg-base,#e8ecf1)]/40 p-6">
        <div className="mx-auto max-w-[1400px] rounded-2xl bg-[var(--v4-canvas,#f8fafc)] p-6 shadow-sm h-full overflow-auto">
          <div className="mb-4">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[var(--v4-brand,#2d6a8f)]">
              {preset.eyebrow}
            </div>
            <h1 className="mt-1 text-2xl font-bold text-[var(--v4-ink,#1a1f2a)]">
              {preset.title}
            </h1>
            <p className="mt-1 text-[13.5px] text-[var(--v4-ink-dim,#5a6270)]">
              {preset.subtitle}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--nm-bg-base,#e8ecf1)] p-4">
            <CdlDiagramThumbnail diagram={preset.diagram as never} />
          </div>
        </div>
      </main>
      <CommandPalette theme={theme} onThemeChange={setTheme} />
    </div>
  );
}
