"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { PRESETS, type PresetDoc } from "@/lib/presets";
import { DiagramView } from "@/components/DiagramView";
import { ThemePicker, useThemeSync } from "@/components/ThemePicker";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { useToast } from "@/components/Toast";
import { encodeShare, decodeShare } from "@/lib/share-url";
import { Github, Rocket, Share2, Check, ChevronLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[var(--color-ink-dim)]">
      Loading editor…
    </div>
  ),
});

/**
 * /editor page — Monaco editor + live preview + theme switch + share URL。
 * mermaid.live 相当の interactive playground。
 *
 * left column ... Monaco で JSON edit (PresetDoc)
 * right column ... DiagramView で live preview
 * top toolbar ... preset dropdown / theme picker / share button / GitHub link
 */
export default function EditorPage(): React.ReactElement {
  const { toast } = useToast();
  const [theme, setTheme] = useThemeSync();
  const [preset, setPreset] = useState<PresetDoc>(PRESETS[0]!);
  const [code, setCode] = useState<string>(() => JSON.stringify(PRESETS[0], null, 2));
  const [shareState, setShareState] = useState<"idle" | "copying" | "copied">("idle");
  const [parseError, setParseError] = useState<string | null>(null);

  const parsedPreset = useMemo(() => {
    try {
      const p = JSON.parse(code) as PresetDoc;
      setParseError(null);
      return p;
    } catch (e) {
      setParseError((e as Error).message);
      return preset;
    }
  }, [code, preset]);

  useEffect(() => {
    // load from URL hash on mount
    // 1. #s=<base64> = shared preset (share URL)
    // 2. #preset=<id> = preset id direct link (catalog click 経路)
    const hash = window.location.hash;
    if (hash.startsWith("#s=")) {
      void decodeShare<PresetDoc>(hash).then((decoded) => {
        if (decoded) {
          setPreset(decoded);
          setCode(JSON.stringify(decoded, null, 2));
        }
      });
    } else if (hash.startsWith("#preset=")) {
      const id = hash.slice(8);
      const found = PRESETS.find((p) => p.id === id);
      if (found) {
        setPreset(found);
        setCode(JSON.stringify(found, null, 2));
      }
    }
  }, []);

  const onShare = async (): Promise<void> => {
    if (parseError) {
      toast({
        type: "error",
        title: "Invalid JSON",
        description: "Fix the JSON syntax before sharing.",
      });
      return;
    }
    setShareState("copying");
    try {
      const hash = await encodeShare(parsedPreset);
      const url = `${window.location.origin}${window.location.pathname}#${hash}`;
      await navigator.clipboard.writeText(url);
      window.history.replaceState({}, "", `${window.location.pathname}#${hash}`);
      setShareState("copied");
      toast({
        type: "success",
        title: "URL copied",
        description: "Share URL is now in your clipboard.",
      });
      setTimeout(() => setShareState("idle"), 2000);
    } catch {
      setShareState("idle");
      toast({
        type: "error",
        title: "Share failed",
        description: "Could not copy URL to clipboard.",
      });
    }
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border-soft)] bg-[var(--color-surface)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1800px] items-center gap-6 px-6 py-3">
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
          <select
            value={preset.id}
            onChange={(e) => {
              const p = PRESETS.find((x) => x.id === e.target.value) ?? PRESETS[0]!;
              setPreset(p);
              setCode(JSON.stringify(p, null, 2));
            }}
            className="rounded-lg bg-[var(--color-surface-2)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
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
            onClick={() => setCode(JSON.stringify(preset, null, 2))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-2)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-ink)] hover:brightness-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label="Reset code to preset default"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            type="button"
            onClick={onShare}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all",
              shareState === "copied"
                ? "bg-green-100 text-green-700"
                : "bg-[var(--color-accent)] text-white hover:brightness-110",
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
            className="rounded-lg p-2 text-[var(--color-ink-dim)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
            aria-label="GitHub"
          >
            <Github size={15} />
          </a>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex h-1/2 w-full flex-col border-b border-[var(--color-border-soft)] md:h-full md:w-1/2 md:border-b-0 md:border-r">
          <div className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-2)] px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-dim)]">
            Editor · preset.json
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language="json"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>
        </div>
        <div className="flex h-1/2 w-full flex-col md:h-full md:w-1/2">
          <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] bg-[var(--color-surface-2)] px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-dim)]">
            <span>Preview · {theme} theme</span>
            {parseError && (
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-500 lowercase" title={parseError}>
                ⚠ parse error
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-6">
            <DiagramView preset={parsedPreset} theme={theme} interactive className="w-full h-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
