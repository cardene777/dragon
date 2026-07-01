import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { compile, CdlDiagramView, type CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// v4 syntax highlight (light) ... yaml key teal, string olive-green, number orange, comment muted
const v4HighlightLight = HighlightStyle.define([
  { tag: [t.atom, t.bool, t.keyword, t.propertyName], color: "#1f4d6e", fontWeight: "500" },
  { tag: [t.string, t.special(t.string)], color: "#6a8a3a" },
  { tag: [t.number, t.integer, t.float], color: "#c2410c" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#8a8678", fontStyle: "italic" },
  { tag: [t.operator, t.punctuation, t.separator], color: "#5a6270" },
  { tag: [t.invalid], color: "#c15a4a" },
]);

// v4 syntax highlight (dark) ... teal-glow / mint / amber-glow
const v4HighlightDark = HighlightStyle.define([
  { tag: [t.atom, t.bool, t.keyword, t.propertyName], color: "#7dc7e8", fontWeight: "500" },
  { tag: [t.string, t.special(t.string)], color: "#93e0a1" },
  { tag: [t.number, t.integer, t.float], color: "#f0b75e" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#6b7785", fontStyle: "italic" },
  { tag: [t.operator, t.punctuation, t.separator], color: "#99a3b3" },
  { tag: [t.invalid], color: "#e8807d" },
]);

// dragon DSL は YAML 互換、 yaml mode を流用 + v4 palette で theme override
const v4EditorThemeLight = EditorView.theme(
  {
    "&": {
      backgroundColor: "#fcf8ee",
      color: "#1a1f2a",
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: "13px",
      height: "100%",
    },
    ".cm-content": { padding: "18px 14px", caretColor: "#2d6a8f" },
    ".cm-cursor": { borderLeftColor: "#2d6a8f" },
    ".cm-line": { padding: "0 4px" },
    ".cm-gutters": {
      backgroundColor: "#fcf8ee",
      color: "#8a8678",
      border: "none",
      borderRight: "1px solid #e0d9c8",
      fontFamily: "'JetBrains Mono', monospace",
    },
    ".cm-activeLineGutter": { backgroundColor: "rgba(45,106,143,0.06)", color: "#2d6a8f" },
    ".cm-activeLine": { backgroundColor: "rgba(45,106,143,0.04)" },
    ".cm-selectionBackground, ::selection": { backgroundColor: "rgba(45,106,143,0.18) !important" },
    "&.cm-focused": { outline: "none" },
  },
  { dark: false }
);

const v4EditorThemeDark = EditorView.theme(
  {
    "&": {
      backgroundColor: "#161b22",
      color: "#f0f3f8",
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: "13px",
      height: "100%",
    },
    ".cm-content": { padding: "18px 14px", caretColor: "#5ec4e8" },
    ".cm-cursor": { borderLeftColor: "#5ec4e8" },
    ".cm-line": { padding: "0 4px" },
    ".cm-gutters": {
      backgroundColor: "#161b22",
      color: "#6b7785",
      border: "none",
      borderRight: "1px solid #2a3340",
      fontFamily: "'JetBrains Mono', monospace",
    },
    ".cm-activeLineGutter": { backgroundColor: "rgba(94,196,232,0.1)", color: "#5ec4e8" },
    ".cm-activeLine": { backgroundColor: "rgba(94,196,232,0.06)" },
    ".cm-selectionBackground, ::selection": { backgroundColor: "rgba(94,196,232,0.25) !important" },
    "&.cm-focused": { outline: "none" },
  },
  { dark: true }
);

/**
 * Visual Editor v1.1
 *
 * 設計:
 * - 左 ... DSL textarea (monospace、 line-numbered hint)
 * - 右 ... live preview (CdlDiagramView) + pan/zoom toolbar (Mermaid Live Editor 相当)
 * - 入力 debounce 300ms で parse + render
 * - URL hash で share (`#s=<base64>`)、 起動時に hash から復元
 * - Download SVG ボタン
 * - Reset / Sample 切替ボタン (12 件 scroll 横並び)
 * - Error 表示 (parse error 時に行番号付き)
 * - pan/zoom ... wheel zoom (cursor 中心、 0.25-8x)、 drag pan、 Fit/Reset/100%/+/- toolbar
 */

const SAMPLES: { label: string; code: string }[] = [
  {
    label: "ログインAPI呼び出し (sequence)",
    code: `title: "ログインAPI"
type: sequence

actors:
  - ユーザー
  - API
  - データベース

flow:
  - ユーザー -> API: "ログイン要求"
  - API -> データベース: "ユーザー検索"
  - データベース -> API: "結果"
  - API -> ユーザー: "認証成功" (success)

animation:
  - step: "call" 1.4s
    focus: [ユーザー, API, "ユーザー -> API"]
  - step: "query" 1.4s
    focus: [API, データベース, "API -> データベース"]
  - step: "return" 1.4s
    focus: [API, データベース, "データベース -> API"]
  - step: "ok" 1.4s
    focus: [ユーザー, API, "API -> ユーザー"]
`,
  },
  {
    label: "注文チェックアウト (sequence)",
    code: `title: "注文チェックアウト"
type: sequence

actors:
  - ユーザー
  - カート
  - 決済

flow:
  - ユーザー -> カート: "商品追加"
  - カート -> 決済: "課金"
  - 決済 -> ユーザー: "領収書" (success)

animation:
  - step: "add" 1.2s
    focus: [ユーザー, カート, "ユーザー -> カート"]
  - step: "charge" 1.5s
    focus: [カート, 決済, "カート -> 決済"]
  - step: "receipt" 1.2s
    focus: [ユーザー, 決済, "決済 -> ユーザー"]
`,
  },
  {
    label: "CIパイプライン (flow)",
    code: `title: "CIパイプライン"
type: flow

actors:
  - Push: { kind: event }
  - ビルド: { kind: function }
  - テスト: { kind: function }
  - デプロイ: { kind: function }

flow:
  - Push -> ビルド: "トリガー"
  - ビルド -> テスト: "成果物"
  - テスト -> デプロイ: "合格" (success)

animation:
  - step: "trigger" 1.2s
    focus: [Push, ビルド, "Push -> ビルド"]
  - step: "build" 1.5s
    focus: [ビルド, テスト, "ビルド -> テスト"]
  - step: "test" 1.5s
    focus: [テスト, デプロイ, "テスト -> デプロイ"]
  - step: "deploy" 1.2s
    focus: [デプロイ]
`,
  },
  {
    label: "ユーザー登録 (swimlane)",
    code: `title: "ユーザー登録"
type: swimlane

actors:
  - ユーザー
  - 認証: { kind: service }
  - データベース: { kind: database }
  - メール: { kind: service }

flow:
  - ユーザー -> 認証: "登録要求"
  - 認証 -> データベース: "ユーザー保存"
  - 認証 -> メール: "歓迎メール送信" { labelOffsetY: 160 }
  - メール -> ユーザー: "メール到着" { labelOffsetY: 160 }

animation:
  - step: "register" 1.4s
    focus: [ユーザー, 認証, "ユーザー -> 認証"]
  - step: "persist" 1.4s
    focus: [認証, データベース, "認証 -> データベース"]
  - step: "notify" 1.4s
    focus: [認証, メール, "認証 -> メール"]
  - step: "deliver" 1.4s
    focus: [メール, ユーザー, "メール -> ユーザー"]
`,
  },
  {
    label: "システム構成 (topology)",
    code: `title: "システム構成"
type: topology

actors:
  - LB: { kind: cloud, subtitle: "ロードバランサー" }
  - Web: { kind: service, subtitle: "APIサーバー" }
  - キャッシュ: { kind: cache, subtitle: "Redis" }
  - データベース: { kind: database, subtitle: "Postgres" }

flow:
  - LB -> Web: "振り分け"
  - Web -> キャッシュ: "参照" { labelOffsetX: -160 }
  - Web -> データベース: "問い合わせ" { labelOffsetX: -160 }

animation:
  - step: "ingress" 1.2s
    focus: [LB, Web, "LB -> Web"]
  - step: "cache" 1.2s
    focus: [Web, キャッシュ, "Web -> キャッシュ"]
  - step: "fallback" 1.5s
    focus: [Web, データベース, "Web -> データベース"]
`,
  },
  {
    label: "ユーザーと投稿のスキーマ (er)",
    code: `title: "ユーザー投稿スキーマ"
type: er

actors:
  - ユーザー: { kind: storage, rows: ["id: PK", "email: string", "name: string"] }
  - 投稿: { kind: storage, rows: ["id: PK", "userId: FK", "title: string", "body: text"] }
  - コメント: { kind: storage, rows: ["id: PK", "postId: FK", "body: text"] }

flow:
  - ユーザー -> 投稿: "投稿する" { cardinality: "1:N" }
  - 投稿 -> コメント: "コメント持つ" { cardinality: "1:N" }

animation:
  - step: "reveal" 2.0s
    focus: [ユーザー, 投稿, コメント, "ユーザー -> 投稿", "投稿 -> コメント"]
`,
  },
  {
    label: "認証状態遷移 (state-machine)",
    code: `title: "認証状態遷移"
type: state

actors:
  - 待機: { kind: card }
  - 検証中: { kind: card }
  - 完了: { kind: card }
  - 失敗: { kind: card }

flow:
  - 待機 -> 検証中: "送信"
  - 検証中 -> 完了: "認証成功" (success)
  - 検証中 -> 失敗: "認証失敗"
  - 失敗 -> 待機: "再試行"

animation:
  - step: "idle" 1.0s
    focus: [待機]
  - step: "submit" 1.2s
    focus: [検証中, "待機 -> 検証中"]
  - step: "success" 1.0s
    focus: [完了, "検証中 -> 完了"]
  - step: "fail" 1.0s
    focus: [失敗, "検証中 -> 失敗"]
`,
  },
  {
    label: "OOP クラス階層 (class)",
    code: `title: "動物クラス階層"
type: class

actors:
  - 動物: { kind: storage, rows: ["+name: string", "+age: int", "+speak(): void"] }
  - 犬: { kind: storage, rows: ["+breed: string", "+bark(): void"] }
  - 猫: { kind: storage, rows: ["+indoor: boolean", "+meow(): void"] }

flow:
  - 犬 -> 動物: "extends"
  - 猫 -> 動物: "extends"

animation:
  - step: "reveal" 2.0s
    focus: [動物, 犬, 猫, "犬 -> 動物", "猫 -> 動物"]
`,
  },
  {
    label: "スプリントロードマップ (gantt)",
    code: `title: "Q1-Q4ロードマップ"
type: gantt

actors:
  - 設計: { subtitle: "Q1" }
  - 実装: { subtitle: "Q2" }
  - テスト: { subtitle: "Q3" }
  - リリース: { subtitle: "Q4" }

animation:
  - step: "Q1" 1.0s
    focus: [設計]
  - step: "Q2" 1.0s
    focus: [実装]
  - step: "Q3" 1.0s
    focus: [テスト]
  - step: "Q4" 1.0s
    focus: [リリース]
`,
  },
  {
    label: "プロジェクト構想 (mind)",
    code: `title: "プロジェクト構想"
type: mind

actors:
  - root: { title: "新プロジェクト" }
  - features: { title: "機能" }
  - design: { title: "デザイン" }
  - launch: { title: "リリース" }
  - market: { title: "マーケット" }

animation:
  - step: "reveal" 2.0s
    focus: [root, features, design, launch, market]
`,
  },
  {
    label: "言語シェア (pie)",
    code: `title: "言語シェア"
type: pie

actors:
  - TypeScript: { value: "45%" }
  - Python: { value: "30%" }
  - Rust: { value: "15%" }
  - Go: { value: "10%" }

animation:
  - step: "reveal" 2.0s
    focus: [TypeScript, Python, Rust, Go]
`,
  },
  {
    label: "C4コンテキスト (c4)",
    code: `title: "C4コンテキストモデル"
type: c4

actors:
  - ユーザー: { kind: person, subtitle: "L1" }
  - システム: { kind: service, subtitle: "L1: system" }
  - API: { kind: service, subtitle: "L2: container" }
  - データベース: { kind: database, subtitle: "L2: container" }

flow:
  - ユーザー -> システム: "利用"
  - システム -> API: "要求"
  - API -> データベース: "問い合わせ"

animation:
  - step: "use" 1.2s
    focus: [ユーザー, システム, "ユーザー -> システム"]
  - step: "request" 1.2s
    focus: [システム, API, "システム -> API"]
  - step: "query" 1.2s
    focus: [API, データベース, "API -> データベース"]
`,
  },
];

function encodeShare(src: string): string {
  try {
    return btoa(unescape(encodeURIComponent(src)));
  } catch {
    return "";
  }
}

function decodeShare(hash: string): string | null {
  try {
    const match = hash.match(/[#&]s=([^&]+)/);
    if (!match) return null;
    return decodeURIComponent(escape(atob(match[1]!)));
  } catch {
    return null;
  }
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 8;
const ZOOM_STEP = 0.2;

export function CdlEditor(): React.JSX.Element {
  const [src, setSrc] = useState<string>(SAMPLES[0]!.code);
  const [diagram, setDiagram] = useState<CdlDiagram | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeSample, setActiveSample] = useState(SAMPLES[0]!.label);
  const [isDark, setIsDark] = useState(false);

  // html.dark の変化を監視して CodeMirror theme を切替
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = (): void => setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const filteredSamples = useMemo(() => {
    if (!search.trim()) return SAMPLES;
    const q = search.toLowerCase();
    return SAMPLES.filter((s) => s.label.toLowerCase().includes(q));
  }, [search]);

  const categorize = (label: string): string => {
    const m = label.match(/\(([^)]+)\)/);
    return m ? m[1]! : "other";
  };

  const groupedSamples = useMemo(() => {
    const groups: Record<string, typeof SAMPLES> = {};
    for (const s of filteredSamples) {
      const cat = categorize(s.label);
      if (!groups[cat]) groups[cat] = [];
      groups[cat]!.push(s);
    }
    return groups;
  }, [filteredSamples]);
  const timerRef = useRef<number | null>(null);

  // pan/zoom state
  const [transform, setTransform] = useState({ tx: 0, ty: 0, scale: 1 });
  const previewRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // URL hash から復元 (起動時 1 回のみ)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const restored = decodeShare(window.location.hash);
    if (restored) setSrc(restored);
  }, []);

  // src 変更時 debounce 300ms で parse + render
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      try {
        const d = textDslToDiagram(src);
        // compile を pre-check して validate/layout の throw を CdlDiagramView 描画前に捕捉する。
        // ここで catch しないと CdlDiagramView 内 useMemo の throw が React island 全体を unmount し、
        // .cdl-editor-textarea / .cdl-editor-error 等の UI も丸ごと消える (e.g. self-loop edge)。
        compile(d);
        setDiagram(d);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
        // diagram は前回のまま (preview を残す)
      }
    }, 300);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [src]);

  // Fit handler ... preview 領域に SVG の bounding を合わせる。
  // SVG が render される度 + sample 切替時に自動 Fit。
  const handleFit = useCallback((): void => {
    if (!previewRef.current) return;
    const svg = previewRef.current.querySelector("svg");
    if (!svg) return;
    const previewRect = previewRef.current.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    if (!vb || vb.width === 0 || vb.height === 0) {
      setTransform({ tx: 0, ty: 0, scale: 1 });
      return;
    }
    // SVG の CSS width / height を viewBox 実 pixel 値に強制する。
    // CdlDiagramView は className="w-full h-auto" で親幅を欲しがるが、 pan は inline-block で
    // 循環参照になり svg が default 300x150 に潰れる。 明示 pixel を渡して回避する。
    svg.style.setProperty("width", `${vb.width}px`, "important");
    svg.style.setProperty("height", `${vb.height}px`, "important");
    svg.style.setProperty("max-width", "none", "important");
    // preview stage の 92% を使い、 4% 余白 (16-32px 程度) を上下左右に確保する。
    const PADDING_RATIO = 0.04;
    const availableW = previewRect.width * (1 - PADDING_RATIO * 2);
    const availableH = previewRect.height * (1 - PADDING_RATIO * 2);
    const scaleX = availableW / vb.width;
    const scaleY = availableH / vb.height;
    const scale = Math.min(scaleX, scaleY);
    // SVG 中心と stage 中心を一致させる (左寄り解消の core)。
    const tx = (previewRect.width - vb.width * scale) / 2;
    const ty = (previewRect.height - vb.height * scale) / 2;
    setTransform({ tx, ty, scale });
  }, []);

  // diagram 切替時 / stage リサイズ時に自動 Fit
  useEffect(() => {
    if (!diagram || !previewRef.current) return;
    let cancelled = false;
    let lastFitAt = 0;
    const runFit = () => {
      if (cancelled) return;
      const now = Date.now();
      if (now - lastFitAt < 50) return; // 50ms rate limit
      lastFitAt = now;
      handleFit();
    };
    // 初回 rAF + 100ms fallback で SVG layout 反映を待つ
    const r1 = window.requestAnimationFrame(() => {
      if (cancelled) return;
      window.requestAnimationFrame(runFit);
    });
    const t1 = window.setTimeout(runFit, 100);
    const t2 = window.setTimeout(runFit, 400); // hydration 遅延 fallback
    // stage リサイズを検知して再 fit (window resize / sidebar 折畳等)
    const ro = new ResizeObserver(() => runFit());
    ro.observe(previewRef.current);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(r1);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
    };
  }, [diagram, handleFit]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setTransform((t) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale + delta));
      const factor = newScale / t.scale;
      const newTx = mx - (mx - t.tx) * factor;
      const newTy = my - (my - t.ty) * factor;
      return { tx: newTx, ty: newTy, scale: newScale };
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // toolbar クリックは pan させない
    if ((e.target as HTMLElement).closest(".cdl-editor-zoom-toolbar")) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.tx, ty: transform.ty };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!dragging) return;
    setTransform((t) => ({
      ...t,
      tx: dragStart.current.tx + (e.clientX - dragStart.current.x),
      ty: dragStart.current.ty + (e.clientY - dragStart.current.y),
    }));
  };

  const handleMouseUp = (): void => setDragging(false);

  const handleReset = (): void => handleFit();
  const handle100 = (): void => {
    if (!previewRef.current) {
      setTransform({ tx: 0, ty: 0, scale: 1 });
      return;
    }
    // 中央寄せして scale=1.0 にする
    const svg = previewRef.current.querySelector("svg");
    const previewRect = previewRef.current.getBoundingClientRect();
    if (!svg) {
      setTransform({ tx: 0, ty: 0, scale: 1 });
      return;
    }
    const vb = svg.viewBox.baseVal;
    const tx = (previewRect.width - vb.width) / 2;
    const ty = (previewRect.height - vb.height) / 2;
    setTransform({ tx, ty, scale: 1 });
  };

  const zoomAtCenter = (delta: number): void => {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) {
      setTransform((t) => ({ ...t, scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale + delta)) }));
      return;
    }
    const mx = rect.width / 2;
    const my = rect.height / 2;
    setTransform((t) => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, t.scale + delta));
      const factor = newScale / t.scale;
      const newTx = mx - (mx - t.tx) * factor;
      const newTy = my - (my - t.ty) * factor;
      return { tx: newTx, ty: newTy, scale: newScale };
    });
  };

  const handleZoomIn = (): void => zoomAtCenter(ZOOM_STEP);
  const handleZoomOut = (): void => zoomAtCenter(-ZOOM_STEP);

  // Esc で Reset
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") handleReset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleFit]);

  const handleShare = (): void => {
    if (typeof window === "undefined") return;
    const encoded = encodeShare(src);
    const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;
    void navigator.clipboard.writeText(url).catch(() => {
      // clipboard 失敗時 fallback ... URL を window.prompt で表示
      window.prompt("共有 URL をコピーしてください:", url);
    });
    const button = document.getElementById("editor-share-btn");
    if (button) {
      const orig = button.textContent;
      button.textContent = "コピーしました ✔";
      setTimeout(() => {
        if (button) button.textContent = orig;
      }, 1500);
    }
  };

  const getPreviewSvg = (): SVGSVGElement | null => {
    if (typeof document === "undefined") return null;
    return document.querySelector(".v4-editor-preview svg") as SVGSVGElement | null;
  };

  const downloadBlob = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** SMIL <animate> / <animateMotion> を含む animated SVG 全体を serialize */
  const handleExportAnimatedSvg = (): void => {
    const svg = getPreviewSvg();
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    // ns 明示 (単独 file として開いた時に SVG 表示崩れないよう)
    if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!clone.getAttribute("xmlns:xlink")) clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    const svgStr = new XMLSerializer().serializeToString(clone);
    downloadBlob(new Blob([svgStr], { type: "image/svg+xml" }), `${diagram?.id ?? "diagram"}.svg`);
  };

  /** 現 phase の static frame (animation 要素を全部除去 + inactive → active を data で確定) */
  const handleExportStaticSvg = (): void => {
    const svg = getPreviewSvg();
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!clone.getAttribute("xmlns:xlink")) clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    // animation element を全除去 (static frame にする)
    for (const el of Array.from(clone.querySelectorAll("animate, animateMotion, animateTransform, set"))) {
      el.remove();
    }
    const svgStr = new XMLSerializer().serializeToString(clone);
    downloadBlob(new Blob([svgStr], { type: "image/svg+xml" }), `${diagram?.id ?? "diagram"}-static.svg`);
  };

  /** 現 phase を canvas 経由で PNG (2x DPR で高解像度) */
  const handleExportPng = async (): Promise<void> => {
    const svg = getPreviewSvg();
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    if (!clone.getAttribute("xmlns:xlink")) clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    for (const el of Array.from(clone.querySelectorAll("animate, animateMotion, animateTransform, set"))) {
      el.remove();
    }
    // viewBox から実寸を決定 (2x DPR で高解像度出力)
    const vb = clone.viewBox.baseVal;
    const scale = 2;
    const w = vb.width * scale;
    const h = vb.height * scale;
    const svgStr = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.width = w;
    img.height = h;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("SVG image load failed"));
      img.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(svgUrl);
      return;
    }
    // dark mode 対応 = 現在の theme に応じた stage bg を塗る
    const isDark = document.documentElement.classList.contains("dark");
    ctx.fillStyle = isDark ? "#1e293b" : "#f1f5f9";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(svgUrl);
    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) return;
    downloadBlob(pngBlob, `${diagram?.id ?? "diagram"}.png`);
  };

  const scaleDisplay = useMemo(() => `${Math.round(transform.scale * 100)}%`, [transform.scale]);

  const handleSelectSample = (s: { label: string; code: string }): void => {
    setSrc(s.code);
    setActiveSample(s.label);
  };

  const handleNewFile = (): void => {
    const blank = `title: "untitled"
type: sequence

actors:
  - A
  - B

flow:
  - A -> B: "msg"

animation:
  - step: "step 1" 1.2s
    focus: [A, B]
`;
    setSrc(blank);
    setActiveSample("new");
  };

  return (
    <div className="v4-editor">
      {/* ── 左 sidebar (new file 主体) ── */}
      <aside className="v4-editor-side">
        <button
          type="button"
          className="v4-editor-side-new"
          onClick={handleNewFile}
        >
          <span className="v4-editor-side-new-plus">+</span>
          <span>new file</span>
        </button>
        <details className="v4-editor-side-samples" open={false}>
          <summary className="v4-editor-side-samples-summary">
            <span className="v4-editor-side-samples-label">samples</span>
            <span className="v4-editor-side-samples-count">{filteredSamples.length}</span>
            <span className="v4-editor-side-samples-caret">›</span>
          </summary>
          <div className="v4-editor-side-samples-body">
            <input
              className="v4-editor-search"
              type="text"
              placeholder="🔍 search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="v4-editor-side-list">
              {Object.entries(groupedSamples).map(([cat, list]) => (
                <div key={cat} className="v4-editor-side-group">
                  <div className="v4-editor-side-group-title">{cat}</div>
                  {list.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      className={`v4-editor-side-item ${activeSample === s.label ? "active" : ""}`}
                      onClick={() => handleSelectSample(s)}
                    >
                      {s.label.replace(/\s*\([^)]*\)\s*$/, "")}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </details>
      </aside>

      {/* ── 中央 DSL editor (CodeMirror) ── */}
      <section className="v4-editor-code">
        <header className="v4-editor-bar">
          <span className="v4-editor-bar-file">▲ {activeSample}.dragon</span>
          <span className="v4-editor-bar-gap" />
          <button type="button" className="v4-editor-bar-btn" onClick={handleShare}>
            共有URL
          </button>
          <div className="v4-editor-export">
            <button type="button" className="v4-editor-bar-btn v4-editor-bar-btn-primary" disabled={!diagram}>
              export ↓
            </button>
            <div className="v4-editor-export-menu">
              <button type="button" onClick={handleExportAnimatedSvg} disabled={!diagram}>
                <strong>animated SVG</strong>
                <span>単一fileで動く / GitHub README / Notion</span>
              </button>
              <button type="button" onClick={handleExportStaticSvg} disabled={!diagram}>
                <strong>static SVG</strong>
                <span>現phaseの静止1frame / Keynote / PDF</span>
              </button>
              <button type="button" onClick={() => void handleExportPng()} disabled={!diagram}>
                <strong>PNG</strong>
                <span>ラスター2x DPR / Slack / Twitter</span>
              </button>
            </div>
          </div>
        </header>
        <div className="v4-editor-code-body">
          <CodeMirror
            value={src}
            theme={isDark ? v4EditorThemeDark : v4EditorThemeLight}
            extensions={[yaml(), syntaxHighlighting(isDark ? v4HighlightDark : v4HighlightLight)]}
            onChange={(v) => setSrc(v)}
            height="100%"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              dropCursor: false,
              highlightActiveLine: true,
              highlightActiveLineGutter: true,
              autocompletion: false,
              indentOnInput: true,
            }}
          />
        </div>
        {error && <pre className="v4-editor-error">{error}</pre>}
      </section>

      {/* ── 右 preview pane (full-bleed) ── */}
      <section className="v4-editor-preview">
        <header className="v4-editor-bar">
          <span className="v4-editor-bar-file">
            <span className="v4-editor-live" /> live preview
          </span>
          <span className="v4-editor-bar-gap" />
          <button type="button" className="v4-editor-bar-btn" onClick={handleFit}>
            fit
          </button>
          <button type="button" className="v4-editor-bar-btn" onClick={handleReset}>
            reset
          </button>
          <button type="button" className="v4-editor-bar-btn" onClick={handle100}>
            100%
          </button>
          <button type="button" className="v4-editor-bar-btn" onClick={handleZoomOut}>
            −
          </button>
          <button type="button" className="v4-editor-bar-btn" onClick={handleZoomIn}>
            +
          </button>
          <span className="v4-editor-bar-zoom">{scaleDisplay}</span>
        </header>
        <div
          className="v4-editor-stage"
          ref={previewRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="v4-editor-pan"
            style={{
              transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
            }}
          >
            {diagram ? (
              <div className="v4-editor-svg-wrap">
                <CdlDiagramView diagram={diagram} />
              </div>
            ) : (
              <div className="v4-editor-empty">読み込み中...</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
