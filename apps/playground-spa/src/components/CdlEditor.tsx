import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router";
import { compile, CdlDiagramView, visualValidate, type CdlDiagram, type Violation } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import CodeMirror from "@uiw/react-codemirror";
import { loadPartsItems, type CatalogItem } from "@/lib/catalog-items";
import { deserializePart, isPartsMarker, PARTS_MARKER } from "@/lib/parts-serializer";
import {
  findDragTarget,
  clientToSvg,
  hitResizeHandle,
  updateActorPosition,
  updateActorNodePosition,
  extractActorPosition,
  extractActorNodePosition,
  extractAllActorNames,
  slugify as slugifyActorName,
  type DragState,
  type ResizeCorner,
} from "@/lib/canvas-pivot-interaction";
import { computeCollisionShift, type PresetType } from "@/lib/canvas-pivot-auto-adjust";
import { detectGuidelines, type Guideline } from "@/lib/canvas-pivot-guideline";
import { EDITOR_SAMPLES } from "@/data/editor-samples";
import { yaml } from "@codemirror/lang-yaml";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// v4 syntax highlight (light) ... yaml key warm-brown, string olive-green, number orange, comment muted
const v4HighlightLight = HighlightStyle.define([
  { tag: [t.atom, t.bool, t.keyword, t.propertyName], color: "#8a5a2a", fontWeight: "500" },
  { tag: [t.string, t.special(t.string)], color: "#6a8a3a" },
  { tag: [t.number, t.integer, t.float], color: "#c2410c" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#8a8678", fontStyle: "italic" },
  { tag: [t.operator, t.punctuation, t.separator], color: "#6d5a3a" },
  { tag: [t.invalid], color: "#c15a4a" },
]);

// v4 syntax highlight (dark) ... gold-glow / mint / amber-glow (龍鱗ゴールド warm palette)
const v4HighlightDark = HighlightStyle.define([
  { tag: [t.atom, t.bool, t.keyword, t.propertyName], color: "#f0b840", fontWeight: "500" },
  { tag: [t.string, t.special(t.string)], color: "#93e0a1" },
  { tag: [t.number, t.integer, t.float], color: "#ff8c42" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "#a08870", fontStyle: "italic" },
  { tag: [t.operator, t.punctuation, t.separator], color: "#c0a880" },
  { tag: [t.invalid], color: "#e8807d" },
]);

// dragon DSL は YAML 互換、 yaml mode を流用 + v4 palette で theme override
const v4EditorThemeLight = EditorView.theme(
  {
    "&": {
      backgroundColor: "#fcf8ee",
      color: "#1a1410",
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: "13px",
      height: "100%",
    },
    ".cm-content": { padding: "18px 14px", caretColor: "#8a5a2a" },
    ".cm-cursor": { borderLeftColor: "#8a5a2a" },
    ".cm-line": { padding: "0 4px" },
    ".cm-gutters": {
      backgroundColor: "#fcf8ee",
      color: "#8a8678",
      border: "none",
      borderRight: "1px solid #e0d9c8",
      fontFamily: "'JetBrains Mono', monospace",
    },
    ".cm-activeLineGutter": { backgroundColor: "rgba(184,134,42,0.06)", color: "#8a5a2a" },
    ".cm-activeLine": { backgroundColor: "rgba(184,134,42,0.04)" },
    ".cm-selectionBackground, ::selection": { backgroundColor: "rgba(184,134,42,0.18) !important" },
    "&.cm-focused": { outline: "none" },
  },
  { dark: false }
);

const v4EditorThemeDark = EditorView.theme(
  {
    "&": {
      backgroundColor: "#1a1408",
      color: "#f0e0b8",
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: "13px",
      height: "100%",
    },
    ".cm-content": { padding: "18px 14px", caretColor: "#f0b840" },
    ".cm-cursor": { borderLeftColor: "#f0b840" },
    ".cm-line": { padding: "0 4px" },
    ".cm-gutters": {
      backgroundColor: "#1a1408",
      color: "#a08870",
      border: "none",
      borderRight: "1px solid #3d322a",
      fontFamily: "'JetBrains Mono', monospace",
    },
    ".cm-activeLineGutter": { backgroundColor: "rgba(240,184,64,0.1)", color: "#f0b840" },
    ".cm-activeLine": { backgroundColor: "rgba(240,184,64,0.06)" },
    ".cm-selectionBackground, ::selection": { backgroundColor: "rgba(240,184,64,0.25) !important" },
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

/** SAMPLES の各 sample に slug (kebab-case) を持たせて、 PresetDetail の `#preset=<slug>` と一致検索する。
 *  slug は PRESETS.slug 命名規約 (kebab-case、 `lib/presets.ts` SSOT) と揃える。 複数 sample が同 slug を共有する場合
 *  (例 sequence 系 2 件) は SAMPLES 配列先頭の sample が hash match で優先される (最初の find が勝つ)。
 *
 *  実体は `@/data/editor-samples.ts` に移設済 (CAR-1659、 samples-validate test との drift 回避で shared SSOT 化)。 */
const SAMPLES = EDITOR_SAMPLES;

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
    return decodeURIComponent(escape(atob(match[1])));
  } catch {
    return null;
  }
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 8;
const ZOOM_STEP = 0.2;

/** handleAutoFix と fixableWarningCount で共有する axis whitelist (drift 防止 SSOT) */
const FIXABLE_WARNING_AXES = new Set([
  "edge-label-overlap",
  "clearance",
  "edge-label-proximity",
]);

/**
 * UI 表示から除外する非致命 axis。
 * subpixel-precision = 座標小数点 (e.g. 832.56) の subpixel blur risk 検知、 実描画で
 * browser 側 anti-alias 済で人間の目視には影響ゼロ、 auto-fix logic も未実装。
 * 「修正できない warning を出すのは論外」 という UX 原則で silent 化する。
 * validate output 自体は残し、 golden test / benchmark 用途は継続利用可能。
 */
const HIDDEN_WARNING_AXES = new Set([
  "subpixel-precision",
]);

/**
 * 未 register axis の default action guidance (SSOT 統一のため module-scope const 化)。
 * unfixableAxisHint / handleAutoFix message の 2 箇所で同一値を参照する。
 */
const UNFIXABLE_AXIS_FALLBACK = "DSL 側で調整";

/**
 * 非 auto-fix axis 向けの action guidance (hint text 生成用)。
 * key = axis 名、 value = 「対応可 0 件」 時に user に示す 1 文の action guidance。
 * 未 register axis は UNFIXABLE_AXIS_FALLBACK に fallback。
 * fan-origin-single-point 等 layout auto-fix 対象は別 Issue で解消予定、 現状は DSL 調整 or
 * layout engine 側 fix 待ち guidance を明示する。
 */
const UNFIXABLE_AXIS_HINT: Record<string, string> = {
  "text-readability": "title 短縮 or node w 明示指定",
  "fan-origin-single-point": "同一 node fan の out edge Y を DSL で揃える (layout engine の auto-align 待ち)",
  "marker-gradient-def-integrity": "edge tone を TONE_COLORS 定義済 value に修正",
  "dom-complexity-budget": "diagram を分割 or 不要 node/edge 削減",
};

/**
 * CAR-1657 = src YAML の actors: block から既存 actor 名を全 collect する helper。
 * drop 時の alias 連番生成 (`arc1` → `arc2`) で衝突回避に使う。
 */
function collectActorNamesFromSrc(src: string): Set<string> {
  const names = new Set<string>();
  const lines = src.split("\n");
  let inActors = false;
  for (const ln of lines) {
    if (/^actors\s*:\s*$/.test(ln)) { inActors = true; continue; }
    if (inActors) {
      if (/^[a-zA-Z]/.test(ln)) { inActors = false; continue; }
      const m = ln.match(/^\s*-\s+"?([^\s":{}]+)"?/);
      if (m) names.add(m[1]!);
    }
  }
  return names;
}

/**
 * canvas pivot UX 修正 (B2 parts add layout shift 防止) = parts 追加前に既存 actors の現 lane 位置を
 * SVG DOM (data-cdl-lane-x/y attribute) から snapshot、 各 actor entry に posX/Y を injection して
 * auto layout を固定する。 これで新 parts actor 追加で全体 lane 再配置が起きず、 既存 header 等の
 * 位置が保持される。 既に posX/Y が書出済の actor は skip、 SVG 上に lane element が無い actor も skip。
 */
function pinExistingActorLayoutFromSvg(src: string, svg: SVGSVGElement | null): string {
  if (!svg) return src;
  let next = src;
  for (const name of Array.from(collectActorNamesFromSrc(src))) {
    // 既に posX/Y 明示済 actor は skip (extractActorPosition が null 以外を返す)
    // note: helper import は component 内でしか使えないため、 本 fn は import 経路対応のため CdlEditor 側から呼ぶ
    const slug = slugifyForLane(name);
    const el = svg.querySelector(`[data-cdl-lane="${slug}"]`) as SVGGraphicsElement | null;
    if (!el) continue;
    const rx = el.getAttribute("data-cdl-lane-x");
    const ry = el.getAttribute("data-cdl-lane-y");
    if (!rx || !ry) continue;
    const px = parseFloat(rx);
    const py = parseFloat(ry);
    if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
    // 既書出し検出 = 行ごとの regex で actor entry を探し `posX:` が既にあれば skip
    if (hasPosXInActorEntry(next, name)) continue;
    next = injectActorPosXY(next, name, px, py);
  }
  return next;
}

/**
 * DSL src 中の対象 actor entry に既に posX field が書出済かを判定する軽量 grep。
 * `- name: { ... posX: ... }` 形式のみ検出、 nested `nodes: { subKey: { posX } }` は無視 (top-level posX が対象)。
 */
function hasPosXInActorEntry(src: string, targetName: string): boolean {
  for (const line of src.split("\n")) {
    const inlineMatch = line.match(/^\s*-\s*("[^"]+"|\S+?)\s*:\s*\{/);
    if (!inlineMatch) continue;
    const raw = inlineMatch[1]!.replace(/^"(.+)"$/, "$1");
    if (raw !== targetName) continue;
    // top-level posX 判定 = actor 行の brace 内で `posX:` が (nested { } 外に) 存在するか
    const braceStart = line.indexOf("{");
    if (braceStart < 0) continue;
    let depth = 0;
    let inner = "";
    for (let i = braceStart; i < line.length; i += 1) {
      const c = line[i]!;
      if (c === "{") depth += 1;
      if (depth === 1 && c !== "{") inner += c;
      if (c === "}") depth -= 1;
    }
    return /(?:^|,)\s*posX\s*:/.test(inner);
  }
  return false;
}

/**
 * 対象 actor に posX/posY (top-level) を注入する。 既存 inline map があれば merge、 bare / short form
 * なら inline map 化。 updateActorPosition と semantic 同じだが posW/posH 未指定に留める (auto layout 幅維持)。
 */
function injectActorPosXY(src: string, targetName: string, posX: number, posY: number): string {
  const rx = Math.round(posX);
  const ry = Math.round(posY);
  const extra = `posX: ${rx}, posY: ${ry}`;
  const lines = src.split("\n");
  const next = lines.map((line) => {
    // inline mapping (depth-aware)
    const headMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+?)(\s*:\s*)\{/);
    if (headMatch) {
      const rawName = headMatch[2]!.replace(/^"(.+)"$/, "$1");
      if (rawName === targetName) {
        const braceStart = headMatch[0]!.length - 1;
        let depth = 0;
        let endIdx = -1;
        for (let i = braceStart; i < line.length; i += 1) {
          const c = line[i]!;
          if (c === "{") depth += 1;
          else if (c === "}") {
            depth -= 1;
            if (depth === 0) { endIdx = i; break; }
          }
        }
        if (endIdx < 0) return line;
        const inner = line.slice(braceStart + 1, endIdx).trim();
        const merged = inner ? `${inner}, ${extra}` : extra;
        return `${line.slice(0, braceStart)}{ ${merged} }${line.slice(endIdx + 1)}`;
      }
    }
    // short form: `- name: kind`
    const shortMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+?)(\s*:\s*)([^\s{][^\n]*)$/);
    if (shortMatch && shortMatch[2]!.replace(/^"(.+)"$/, "$1") === targetName) {
      return `${shortMatch[1]}${shortMatch[2]}${shortMatch[3]}{ kind: ${shortMatch[4]!.trim()}, ${extra} }`;
    }
    // bare: `- name`
    const bareMatch = line.match(/^(\s*-\s*)("[^"]+"|\S+)\s*$/);
    if (bareMatch && bareMatch[2]!.replace(/^"(.+)"$/, "$1") === targetName) {
      return `${bareMatch[1]}${bareMatch[2]}: { ${extra} }`;
    }
    return line;
  });
  return next.join("\n");
}

/** slugify を canvas-pivot-interaction と同一 logic で local reuse (import cycle 回避)。 */
function slugifyForLane(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKC")
      .replace(/[^a-z0-9ぁ-んァ-ヶ一-龯\-_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "n"
  );
}

/**
 * CAR-1657 = src YAML の actors: block 末尾に 1 line append する helper。
 * actors: block が見つからない場合は null 返却 (caller が REPLACE fallback で新規 diagram を作る経路)。
 */
function appendActorLine(src: string, newLine: string): string | null {
  const lines = src.split("\n");
  const actorsIdx = lines.findIndex((l) => /^actors\s*:\s*$/.test(l));
  if (actorsIdx < 0) return null;
  let insertIdx = lines.length;
  for (let i = actorsIdx + 1; i < lines.length; i++) {
    if (/^[a-zA-Z]/.test(lines[i] ?? "")) {
      insertIdx = i;
      break;
    }
  }
  while (insertIdx > actorsIdx + 1 && (lines[insertIdx - 1] ?? "").trim() === "") {
    insertIdx -= 1;
  }
  const before = lines.slice(0, insertIdx);
  const after = lines.slice(insertIdx);
  return [...before, newLine, ...after].join("\n");
}

export function CdlEditor(): React.JSX.Element {
  const location = useLocation();
  const [src, setSrc] = useState<string>(SAMPLES[0].code);
  const [diagram, setDiagram] = useState<CdlDiagram | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Violation[]>([]);
  const [autoFixMessage, setAutoFixMessage] = useState<string | null>(null);

  /** 対応可 warning 数 (edge-label offset で fix 可能な 3 axis のみ)、 button state 制御用 */
  const fixableWarningCount = useMemo(() => {
    return warnings.filter((w) => {
      if (!FIXABLE_WARNING_AXES.has(w.axis)) return false;
      const m1 = w.detail.match(/edge "([^"]+)"/);
      const m2 = w.detail.match(/edge-label:([^\s↔"]+)/);
      const edgeId = m1?.[1] ?? m2?.[1];
      return edgeId !== undefined;
    }).length;
  }, [warnings]);

  /**
   * 対応可 0 件時の hint text を、 実際に active な非 fixable axis で dynamic 生成する。
   * 従来は「text-readability = title 短縮」 の固定文言だったが、 fan-origin-single-point 等
   * 別 axis の warning 時に misleading になる問題 (#394 sweep で検出)。 unique axis 群を
   * UNFIXABLE_AXIS_HINT map で lookup し、 「axis = action」 の並列で 1 文にまとめる。
   */
  const unfixableAxisHint = useMemo(() => {
    const unfixableAxes = Array.from(
      new Set(warnings.filter((w) => !FIXABLE_WARNING_AXES.has(w.axis)).map((w) => w.axis)),
    );
    if (unfixableAxes.length === 0) return "対応可 0 件";
    const parts = unfixableAxes.map((ax) => {
      const action = UNFIXABLE_AXIS_HINT[ax] ?? UNFIXABLE_AXIS_FALLBACK;
      return `${ax} = ${action}`;
    });
    return `対応可 0 件 (${parts.join("、 ")})`;
  }, [warnings]);
  const [search, setSearch] = useState("");
  const [activeSample, setActiveSample] = useState(SAMPLES[0].label);
  const [isDark, setIsDark] = useState(false);

  /**
   * sidebar tab (SAMPLES vs parts、 CAR-1646)。 default = "samples" で従来 UX 維持、
   * user が "parts" tab に切替えると loadPartsItems() が dynamic import で発火し、
   * 60 parts (CdlDiagram AST) が sidebar に populate される。 drag source として
   * draggable=true を付け、 canvas 側 onDrop で parts-serializer 経由で src 置換する。
   */
  const [sidebarTab, setSidebarTab] = useState<"samples" | "parts">("samples");
  const [partsItems, setPartsItems] = useState<CatalogItem[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsLoadFailed, setPartsLoadFailed] = useState(false);
  const [dropOver, setDropOver] = useState(false);
  const [dropHintMessage, setDropHintMessage] = useState<string | null>(null);
  const dropHintTimerRef = useRef<number | null>(null);

  /**
   * drop hint message を単一 timer で表示、 直前 timer は必ず clear する。
   * codex-review PR #413 MINOR = 6 秒以内に 2 回 drop で旧 timer が新 message を早期に消す競合を回避。
   */
  const setDropHintWithReset = useCallback((msg: string | null, ttlMs = 6000): void => {
    if (dropHintTimerRef.current !== null) {
      window.clearTimeout(dropHintTimerRef.current);
      dropHintTimerRef.current = null;
    }
    setDropHintMessage(msg);
    if (msg !== null && ttlMs > 0) {
      dropHintTimerRef.current = window.setTimeout(() => {
        setDropHintMessage(null);
        dropHintTimerRef.current = null;
      }, ttlMs);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (dropHintTimerRef.current !== null) {
        window.clearTimeout(dropHintTimerRef.current);
      }
    };
  }, []);

  /**
   * REPLACE 経路 (parts drop / click / samples click / hash preset) 前に user 確認する guard。
   * user report (CAR-1657) = drag drop で前の編集内容が予告なく消える surprise。
   * lastLoadedSrcRef で「最後に programmatic に load した src」 を追跡、 current src が異なる = user
   * 編集済と判定して window.confirm を出す。 一致 = user 未編集で silent replace 継続。
   */
  const lastLoadedSrcRef = useRef<string>(SAMPLES[0].code);
  const confirmReplaceIfDirty = useCallback((newSrcPreviewLabel: string): boolean => {
    // codex-review CAR-1659 CRITICAL fix = length > 20 guard 削除、 strict 比較のみで dirty 判定。
    // 短い編集 (削除 / 部分修正) でも user 意図した変更なら必ず confirm すべき、 length 閾値は
    // silent data loss の抜け穴。
    const userEdited = src.trim() !== (lastLoadedSrcRef.current ?? "").trim();
    if (!userEdited) return true;
    const ok = window.confirm(
      `編集中の内容が「${newSrcPreviewLabel}」 に置き換わります。 元に戻すには Cmd+Z で undo 可能。\n\n続けますか？`,
    );
    return ok;
  }, [src]);

  // parts tab 切替時に 1 回だけ dynamic import で parts を load (CategoryPage と同経路、 CAR-1613)。
  // codex-review PR #413 MAJOR fix = partsLoadFailed で終了状態を保持、 失敗後は明示的な reset
  // (samples tab に切替) までは自動再試行しない。 無限 retry loop を防ぐ。
  // cancelled guard は使わない ... dep 変化で cleanup 発火 → promise callback が cancelled=true 判定
  // で setPartsItems 呼ばない React footgun を回避するため、 単純に partsLoadFailed flag のみで制御。
  useEffect(() => {
    if (sidebarTab !== "parts" || partsItems.length > 0 || partsLoading || partsLoadFailed) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPartsLoading(true);
    loadPartsItems()
      .then((items) => setPartsItems(items))
      .catch((e) => {
        // 失敗しても editor 本体は動かす、 sidebar のみ空表示 + hint 出す + 失敗 flag を立てて再試行禁止
        console.error("[CdlEditor] parts load failed", e);
        setPartsLoadFailed(true);
        setDropHintWithReset("parts の load に失敗しました。 samples tab に切替後 parts tab を再表示すると再試行します。", 8000);
      })
      .finally(() => setPartsLoading(false));
  }, [sidebarTab, partsItems.length, partsLoading, partsLoadFailed, setDropHintWithReset]);

  // samples tab に切替時 = 次に parts tab に戻った時の再試行を許可する経路 (partsLoadFailed をリセット)
  useEffect(() => {
    if (sidebarTab === "samples" && partsLoadFailed) {
      setPartsLoadFailed(false);
    }
  }, [sidebarTab, partsLoadFailed]);

  const filteredParts = useMemo(() => {
    if (!search.trim()) return partsItems;
    const q = search.toLowerCase();
    return partsItems.filter((p) => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q));
  }, [partsItems, search]);

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
    return m ? m[1] : "other";
  };

  const groupedSamples = useMemo(() => {
    const groups: Record<string, typeof SAMPLES> = {};
    for (const s of filteredSamples) {
      const cat = categorize(s.label);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    }
    return groups;
  }, [filteredSamples]);
  const timerRef = useRef<number | null>(null);

  // pan/zoom state
  const [transform, setTransform] = useState({ tx: 0, ty: 0, scale: 1 });
  const transformRef = useRef(transform);
  useEffect(() => { transformRef.current = transform; }, [transform]);
  const previewRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  // URL hash から復元。 2 pattern を処理する。
  // 1. #s=<base64> = share URL 経由の DSL 復元 (decodeShare、 起動時 1 回のみ)
  // 2. #preset=<slug> = catalog / preset detail からの sample 直接 open
  //    SPA navigation で hash 変更した場合も反映するため location.hash を deps に含める
  //    slug 一致がない場合は toast で通知して default sample のまま維持 (silently load 防止)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = location.hash;

    try {
      const presetMatch = hash.match(/^#preset=(.+)$/);
      if (presetMatch) {
        const targetSlug = decodeURIComponent(presetMatch[1]);
        const sample = SAMPLES.find((s) => s.slug === targetSlug);
        if (sample) {
          // hash 経路 = URL 遷移 = user 意図確定と扱い confirm skip、 lastLoadedSrcRef のみ更新
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSrc(sample.code);
          lastLoadedSrcRef.current = sample.code;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setActiveSample(sample.label);
          return;
        }
        // 対応 sample なし = user 通知 (silently default load を明示的に伝える)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAutoFixMessage(
          `プリセット「${targetSlug}」 に対応する編集可能サンプルは未登録です。 default サンプル (${SAMPLES[0].label}) で開きます。`,
        );
        window.setTimeout(() => setAutoFixMessage(null), 8000);
      }
    } catch {
      // decodeURIComponent が malformed URI で throw する可能性、 fall through で decodeShare を試す
    }

    const restored = decodeShare(hash);
    if (restored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSrc(restored);
      lastLoadedSrcRef.current = restored;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSample("共有URL");
    }
  }, [location.hash]);

  /**
   * warning 群から DSL を自動修正する。
   *
   * 対応 axis と補正戦略。
   * - edge-label-overlap ... label が node と AABB overlap → offsetY を node h/2 + 32 に上方 shift
   * - edge-label-proximity ... label が path から離れすぎ → offset を 0 に戻す (default 位置に近づける)
   * - clearance ... label が node と近接 → offsetY を +40 増加
   *
   * detail 文字列から edge id を抽出、 DSL text の該当 flow 行に inline { labelOffsetY: N } を追記 / 上書き。
   * 複数 warning が同 edge を指す場合は最後の warning が勝つ。
   */
  const handleAutoFix = useCallback((): void => {
    if (warnings.length === 0 || !diagram) return;
    // edge id → 推奨 offset (Y) の map を構築。 warning detail 内の edge id は複数 pattern。
    // - `edge "e0-user-post" label が path segment から ...` (proximity)
    // - `node:X ↔ edge-label:e0-user-post overlap=...` (overlap)
    // - `X:Y ↔ Z:W gap=...` (clearance、 node と edge-label のケース)
    const offsetByEdge = new Map<string, { offsetY?: number; offsetX?: number }>();
    // axis whitelist は module scope の FIXABLE_WARNING_AXES を共有 (fixableWarningCount と drift 防止 SSOT)。
    for (const w of warnings) {
      if (!FIXABLE_WARNING_AXES.has(w.axis)) continue;
      const m1 = w.detail.match(/edge "([^"]+)"/);
      const m2 = w.detail.match(/edge-label:([^\s↔"]+)/);
      const edgeId = m1?.[1] ?? m2?.[1];
      if (!edgeId) continue;
      const cur = offsetByEdge.get(edgeId) ?? {};
      if (w.axis === "edge-label-overlap") {
        // node × edge-label overlap = label が node 中に埋まる、 上方 shift で回避
        cur.offsetY = -140;
      } else if (w.axis === "clearance") {
        // 隣接不足 = 更に離す
        cur.offsetY = (cur.offsetY ?? -40) - 40;
      } else if (w.axis === "edge-label-proximity") {
        // label が path から離れすぎ、 detail から実 distance を抽出して逆方向に補正
        const distMatch = w.detail.match(/(\d+)px 離れている/);
        const dist = distMatch ? parseInt(distMatch[1], 10) : 0;
        if (dist > 0) {
          // 現 offset を「path 近接方向」 に半分縮める (offsetY 正/負符号は edge 側 default に依存)
          // 直前の shift 探索で上方に置かれているケースが多いので +dist/2 で下方に寄せる
          const cur_off = cur.offsetY ?? 0;
          cur.offsetY = cur_off + Math.floor(dist / 2);
        }
      }
      // text-readability は node 幅/title の話で label offset で解決しないため skip
      offsetByEdge.set(edgeId, cur);
    }
    if (offsetByEdge.size === 0) {
      // user feedback: 対応可能な warning がない、 inline banner で表示 (alert は browser 依存)
      // unfixableAxisHint と同じ filter (非 fixable のみ列挙) で対称性を担保、 fixable axis の
      // regex mismatch は別 UI で表出させる (misleading message 回避)。
      const unsupportedAxes = Array.from(
        new Set(warnings.filter((w) => !FIXABLE_WARNING_AXES.has(w.axis)).map((w) => w.axis)),
      );
      const actions = unsupportedAxes.map((ax) => {
        const action = UNFIXABLE_AXIS_HINT[ax] ?? UNFIXABLE_AXIS_FALLBACK;
        return `${ax} = ${action}`;
      });
      const suffix = actions.length > 0 ? ` (${actions.join("、 ")})` : "";
      setAutoFixMessage(`自動修正対応外です。 一括反映は edge-label offset (overlap / clearance / proximity) のみ、 他 axis は DSL 側対応が必要${suffix}。`);
      window.setTimeout(() => setAutoFixMessage(null), 10000);
      return;
    }
    // 成功時も message
    setAutoFixMessage(`${offsetByEdge.size} 件の edge-label offset を DSL に反映しました。`);
    window.setTimeout(() => setAutoFixMessage(null), 6000);

    // diagram.edges を「順番」 で DSL の flow 行と対応させる (id 直接検索は slugify で難しい)。
    // v05 parser は flow: 配下 の each item を配列順に edge に変換、 DSL flow 行順 = diagram.edges 順。
    // 実装 ... 全行 split → "flow:" 出現後の region を「flow-lines」 とみなし、 次の top-level key
    // (`^\w`) or 文書末までを対象範囲にする。
    const allLines = src.split("\n");
    const flowStart = allLines.findIndex((l) => /^\s*flow:\s*$/.test(l));
    if (flowStart < 0) return;
    let flowEnd = allLines.length;
    for (let i = flowStart + 1; i < allLines.length; i++) {
      if (/^[a-zA-Z]/.test(allLines[i] ?? "")) { flowEnd = i; break; }
    }
    let edgeIdx = 0;
    let changed = false;
    for (let i = flowStart + 1; i < flowEnd; i++) {
      const line = allLines[i] ?? "";
      if (!/^\s*-\s.+->/.test(line)) continue;
      const e = diagram.edges[edgeIdx];
      edgeIdx += 1;
      if (!e) continue;
      const offset = offsetByEdge.get(e.id);
      if (!offset) continue;
      const braceMatch = line.match(/^(.*?)(\s*\{([^}]*)\})?\s*$/);
      const prefix = braceMatch?.[1] ?? line;
      const inner = (braceMatch?.[3] ?? "")
        .replace(/labelOffset[XY]\s*:\s*-?\d+\s*,?\s*/g, "")
        .replace(/,\s*,/g, ",")
        .replace(/^\s*,\s*|\s*,\s*$/g, "")
        .trim();
      const parts: string[] = [];
      if (inner) parts.push(inner);
      if (offset.offsetY !== undefined) parts.push(`labelOffsetY: ${offset.offsetY}`);
      if (offset.offsetX !== undefined) parts.push(`labelOffsetX: ${offset.offsetX}`);
      const newInline = parts.length > 0 ? ` { ${parts.join(", ")} }` : "";
      const newLine = `${prefix}${newInline}`;
      if (newLine !== line) {
        allLines[i] = newLine;
        changed = true;
      }
    }
    if (changed) setSrc(allLines.join("\n"));
  }, [warnings, diagram, src]);

  // test 用 side channel = src の full text を window mirror に同期 (E2E で CodeMirror virtual
  // scrolling を bypass して full buffer 検証する経路、 CAR-1646、 production では読み手なし)
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as { __cdlEditorSrc?: string }).__cdlEditorSrc = src;
  }, [src]);

  // CAR-1657 = parts catalog を CdlEditor 側で load、 textDslToDiagram に inject する経路。
  // parts identifier (arc-gauge / wave-gauge 等) を kind field で書ける unified syntax の compile 時
  // lookup 用。 loadPartsItems が partsItems state を populate する useEffect と同 tab 切替 trigger 利用。
  const partsCatalog = useMemo(() => {
    const map: Record<string, CdlDiagram> = {};
    for (const item of partsItems) {
      // parts.cdl.ts の id = 'parts-arc-gauge'、 user が syntax で書く時は prefix なし ('arc-gauge')。
      // 両方を key で登録して parser 側の任意判定に対応。
      map[item.id] = item.diagram;
      const stripped = item.id.startsWith("parts-") ? item.id.slice(6) : item.id;
      map[stripped] = item.diagram;
    }
    return map;
  }, [partsItems]);

  // src 変更時 debounce 300ms で parse + render
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      try {
        // CAR-1657 = 旧 #!parts JSON escape hatch は backward compat 経路 (deprecated、 auto-convert 前提)。
        // 既 share URL / user が保存した buffer に marker が残っている可能性があり、 open 時は
        // 従来通り render 継続する (次回 drop で actors syntax に置換される)。
        // 新規 drop は parts kind syntax (actors: に kind = parts identifier) を使う。
        if (isPartsMarker(src)) {
          const part = deserializePart(src);
          if (!part) {
            setError(`${PARTS_MARKER} marker があるが JSON が invalid です。 marker を消して text DSL に戻すか、 JSON を修正してください。`);
            return;
          }
          compile(part);
          setDiagram(part);
          setError(null);
          try {
            const report = visualValidate(part);
            setWarnings(report.violations.filter((v) => !HIDDEN_WARNING_AXES.has(v.axis)));
          } catch {
            setWarnings([]);
          }
          return;
        }
        // CAR-1657 = partsCatalog を渡して parts kind actor を merge 展開させる経路
        const d = textDslToDiagram(src, { partsCatalog });
        // compile を pre-check して validate/layout の throw を CdlDiagramView 描画前に捕捉する。
        compile(d);
        setDiagram(d);
        setError(null);
        // visualValidate で位置関係を機械検証、 warn / error を editor 上部に表示。
        // 「label が edge から遠すぎ」「node bbox に埋まる」 等をユーザーが DSL 書きながら把握可能に。
        try {
          const report = visualValidate(d);
          setWarnings(report.violations.filter((v) => !HIDDEN_WARNING_AXES.has(v.axis)));
        } catch {
          setWarnings([]);
        }
      } catch (e) {
        setError((e as Error).message);
        setWarnings([]);
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
    // 追加 = CdlDiagramView は SVG の上に CdlHeader (phase progress / topic) を並べて描画するため、
    // pan 内の高さは (SVG 高) + (Header 高)。 SVG element の外に兄弟 element がある場合、
    // svg 単独の scale で fit しても header 分が overflow する。 wrap element の unscaled 高さと
    // svg unscaled 高さの差分を header 分として availableH から差し引く。
    const PADDING_RATIO = 0.04;
    const wrap = previewRef.current.querySelector(".v4-editor-svg-wrap");
    // wrap の実 pixel 高さ (transform 後) を測り、 現行 scale (直前 setTransform 値) で
    // 逆算して unscaled 高さを推定。 初回 render 時 transform.scale = 1 で不正確でも、
    // useEffect 内 2 回呼出で settle する (既存 fallback pattern)。
    const wrapPx = wrap ? wrap.getBoundingClientRect().height : vb.height;
    const currentScale = transformRef.current.scale > 0 ? transformRef.current.scale : 1;
    const wrapUnscaled = wrapPx / currentScale;
    const headerUnscaled = Math.max(0, wrapUnscaled - vb.height);
    const availableW = previewRect.width * (1 - PADDING_RATIO * 2);
    const availableH = previewRect.height * (1 - PADDING_RATIO * 2);
    const contentUnscaledH = vb.height + headerUnscaled;
    const scaleX = availableW / vb.width;
    const scaleY = availableH / contentUnscaledH;
    const scale = Math.min(scaleX, scaleY);
    // SVG 中心と stage 中心を一致させる (左寄り解消の core)。
    const tx = (previewRect.width - vb.width * scale) / 2;
    const ty = (previewRect.height - contentUnscaledH * scale) / 2;
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

  // canvas pivot 新 spec PR-B = element drag / resize state。 SVG 上の element を drag 時は
  // pan せず該当 element の位置 / サイズを DSL の posX/Y/W/H field に書き戻す。
  const elementDrag = useRef<DragState | null>(null);
  // hoveredHandle = hover 中パーツの「実 SVG element」 の rect と DSL actor 名。
  // id = DSL 書出し用 actor 名 (lane hover なら actor 名、 node hover でも該当 actor 名 = lane / node は同じ actor に紐づく)。
  // elementSelector = 実 target SVG element の CSS selector (individual element 判定用)。
  // rect = element bounding rect (client coord、 outline 描画用 SSOT)。
  const [hoveredHandle, setHoveredHandle] = useState<{
    id: string;
    elementSelector: string;
    rect: DOMRect;
    // canvas pivot UX 修正 (B1) = 対象 sub-node key (findDragTarget が data-cdl-node の suffix / prefix
    // pattern から抽出、 undefined なら actor 全体経路 = 単一 node preset / lane hover)。
    subNodeKey?: string;
  } | null>(null);
  const [activeGuidelines, setActiveGuidelines] = useState<Guideline[]>([]);

  const startElementInteraction = (e: React.MouseEvent<HTMLDivElement>): boolean => {
    const svg = previewRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return false;
    const target = e.target as Element;

    // hover 中 handle への hit test を先に判定 (element より優先)
    if (hoveredHandle) {
      const corner = hitResizeHandle(e.clientX, e.clientY, hoveredHandle.rect);
      if (corner) {
        const svgPt = clientToSvg(svg, e.clientX, e.clientY);
        // canvas pivot UX 修正 (B1) = subNodeKey 有無で init pos の抽出経路を分岐
        // (nested `nodes: { subKey: {...} }` から読出 vs actor 全体 posX 読出)
        const subKey = hoveredHandle.subNodeKey;
        const cur = subKey
          ? extractActorNodePosition(src, hoveredHandle.id, subKey)
          : extractActorPosition(src, hoveredHandle.id);
        // sub-node init 座標が DSL 未書出しなら hover 中 rect の SVG 座標系変換で拾う
        let initX = cur?.posX;
        let initY = cur?.posY;
        let initW = cur?.posW;
        let initH = cur?.posH;
        if (initX === undefined || initY === undefined) {
          // hover rect (client coord) → SVG viewBox 座標変換で個別 element の cx / cy / w / h を抽出
          const rect = hoveredHandle.rect;
          const tlPt = clientToSvg(svg, rect.left, rect.top);
          const brPt = clientToSvg(svg, rect.right, rect.bottom);
          const wSvg = brPt.x - tlPt.x;
          const hSvg = brPt.y - tlPt.y;
          // sub-node の posX/posY は「node 中心」 (CDL 側の cx / cy に直行) として書出す
          initX = tlPt.x + wSvg / 2;
          initY = tlPt.y + hSvg / 2;
          initW = initW ?? wSvg;
          initH = initH ?? hSvg;
        }
        elementDrag.current = {
          mode: "resize",
          targetName: hoveredHandle.id,
          startClientX: e.clientX,
          startClientY: e.clientY,
          startSvgX: svgPt.x,
          startSvgY: svgPt.y,
          initPosX: initX,
          initPosY: initY,
          initPosW: initW,
          initPosH: initH,
          corner,
          svgScale: svgPt.scale,
          commandBypass: e.metaKey || e.ctrlKey,
          // canvas pivot UX 修正 = resize は hover した individual element 単一のみに適用するため
          // hoveredHandle.elementSelector を DragState に転写する
          hoveredSelector: hoveredHandle.elementSelector,
          subNodeKey: subKey,
        };
        document.body.style.cursor = cornerToCursor(corner);
        return true;
      }
    }

    const dragInfo = findDragTarget(target, extractAllActorNames(src));
    if (!dragInfo) return false;
    const svgPt = clientToSvg(svg, e.clientX, e.clientY);
    const cur = extractActorPosition(src, dragInfo.name);
    // DSL に posX 未書出しなら、 現状 lane の SVG 座標を initPosX/Y として拾う (drag delta 経路で書出し)。
    // CdlLane の semantic = posX/posY は lane 左上 corner の絶対座標 (SVG unit)、 lane 中心ではない。
    let initPosX = cur?.posX;
    let initPosY = cur?.posY;
    if (initPosX === undefined || initPosY === undefined) {
      const slug = slugifyActorName(dragInfo.name);
      const laneEl = svg.querySelector(`[data-cdl-lane="${slug}"]`) as SVGGraphicsElement | null;
      if (laneEl) {
        // data-cdl-lane-x / data-cdl-lane-y attribute で「left-top corner の SVG unit 座標」 が取れる (CDL render 経由)
        const rawX = laneEl.getAttribute("data-cdl-lane-x");
        const rawY = laneEl.getAttribute("data-cdl-lane-y");
        initPosX = rawX ? parseFloat(rawX) : svgPt.x;
        initPosY = rawY ? parseFloat(rawY) : svgPt.y;
      } else {
        initPosX = svgPt.x;
        initPosY = svgPt.y;
      }
    }
    elementDrag.current = {
      mode: "drag",
      targetName: dragInfo.name,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startSvgX: svgPt.x,
      startSvgY: svgPt.y,
      initPosX,
      initPosY,
      initPosW: cur?.posW,
      initPosH: cur?.posH,
      svgScale: svgPt.scale,
      commandBypass: e.metaKey || e.ctrlKey,
    };
    document.body.style.cursor = "grabbing";
    return true;
  };

  const updateElementInteraction = (e: React.MouseEvent<HTMLDivElement>): boolean => {
    const st = elementDrag.current;
    if (!st) return false;
    const svg = previewRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return false;
    const svgPt = clientToSvg(svg, e.clientX, e.clientY);
    const dx = svgPt.x - st.startSvgX;
    const dy = svgPt.y - st.startSvgY;

    if (st.mode === "drag") {
      const newX = st.initPosX + dx;
      const newY = st.initPosY + dy;
      applyLiveTransform(st.targetName, newX - st.initPosX, newY - st.initPosY);
      // canvas pivot 新 spec §4 = 図内 drag で他 preset element を transient shift (Command bypass 対応)
      applyAutoAdjustDuringDrag(st.targetName, e.metaKey || e.ctrlKey || st.commandBypass, svg);
      // canvas pivot 新 spec §6 = 整列補助線 (Command bypass 中は無効)
      applyGuidelinesDuringDrag(st.targetName, e.metaKey || e.ctrlKey || st.commandBypass, svg);
    } else if (st.mode === "resize" && st.corner) {
      const initW = st.initPosW ?? 100;
      const initH = st.initPosH ?? 100;
      // aspect 固定 = corner drag delta の大きい方に合わせる
      let signX = 1;
      let signY = 1;
      if (st.corner === "nw") { signX = -1; signY = -1; }
      if (st.corner === "ne") { signX = 1; signY = -1; }
      if (st.corner === "sw") { signX = -1; signY = 1; }
      const dW = dx * signX;
      const dH = dy * signY;
      const delta = Math.max(dW, dH);
      const newW = Math.max(20, initW + delta);
      const newH = Math.max(20, initH * (newW / initW));
      // NW = 左上を掴んで拡大縮小 = 右下固定、 SE = 逆
      let anchorX = st.initPosX;
      let anchorY = st.initPosY;
      if (st.corner === "nw" || st.corner === "sw") anchorX = st.initPosX + initW - newW;
      if (st.corner === "nw" || st.corner === "ne") anchorY = st.initPosY + initH - newH;
      applyLiveResize(st.targetName, anchorX - st.initPosX, anchorY - st.initPosY, newW / initW, newH / initH);
    }
    return true;
  };

  const finalizeElementInteraction = (e: React.MouseEvent<HTMLDivElement>): boolean => {
    const st = elementDrag.current;
    if (!st) return false;
    document.body.style.cursor = "";
    elementDrag.current = null;
    const svg = previewRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!svg) return true;
    const svgPt = clientToSvg(svg, e.clientX, e.clientY);
    const dx = svgPt.x - st.startSvgX;
    const dy = svgPt.y - st.startSvgY;
    if (st.mode === "drag") {
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return true;
      const newX = st.initPosX + dx;
      const newY = st.initPosY + dy;
      // canvas pivot 新 spec = drag 対象以外の lane も現在位置で posX/Y 固定して layout 再計算で
      // 引きずられないよう「全 lane 座標 pinning」 する。 sequence preset で drag 対象 1 lane だけ
      // posX 設定すると残 lane の pitch 均一化で shift 発生する root cause の対策。
      const svgEl = previewRef.current?.querySelector("svg") as SVGSVGElement | null;
      setSrc((prev) => {
        let next = updateActorPosition(prev, st.targetName, newX, newY, st.initPosW, st.initPosH);
        if (svgEl) {
          for (const name of extractAllActorNames(prev)) {
            if (name === st.targetName) continue;
            const cur2 = extractActorPosition(next, name);
            if (cur2) continue; // 既に固定済 skip
            const slug2 = slugifyActorName(name);
            const el2 = svgEl.querySelector(`[data-cdl-lane="${slug2}"]`) as SVGGraphicsElement | null;
            if (!el2) continue;
            const rx = el2.getAttribute("data-cdl-lane-x");
            const ry = el2.getAttribute("data-cdl-lane-y");
            if (rx && ry) {
              next = updateActorPosition(next, name, parseFloat(rx), parseFloat(ry));
            }
          }
        }
        return next;
      });
    } else if (st.mode === "resize" && st.corner) {
      const initW = st.initPosW ?? 100;
      const initH = st.initPosH ?? 100;
      let signX = 1;
      let signY = 1;
      if (st.corner === "nw") { signX = -1; signY = -1; }
      if (st.corner === "ne") { signX = 1; signY = -1; }
      if (st.corner === "sw") { signX = -1; signY = 1; }
      const dW = dx * signX;
      const dH = dy * signY;
      const delta = Math.max(dW, dH);
      const newW = Math.max(20, initW + delta);
      const newH = Math.max(20, initH * (newW / initW));
      let anchorX = st.initPosX;
      let anchorY = st.initPosY;
      if (st.corner === "nw" || st.corner === "sw") anchorX = st.initPosX + initW - newW;
      if (st.corner === "nw" || st.corner === "ne") anchorY = st.initPosY + initH - newH;
      // canvas pivot UX 修正 (B1) = subNodeKey 有時は nested nodes 書出し (個別 sub-node 経路)、
      // 未 set 時は actor 全体経路 (単一 node preset / 図単位 resize)。 lane 全体を触らない = 他 sub-node の
      // auto layout 保持で spacer / footer 等が引きずられない。
      if (st.subNodeKey) {
        setSrc((prev) => updateActorNodePosition(prev, st.targetName, st.subNodeKey!, anchorX, anchorY, newW, newH));
      } else {
        setSrc((prev) => updateActorPosition(prev, st.targetName, anchorX, anchorY, newW, newH));
      }
    }
    // live CSS transform を clear (post-render で真の DSL 値が適用される)
    clearLiveTransform(st.targetName);
    // auto-adjust transient shift も全 clear (drop で消える spec §4)
    if (svg) clearAutoAdjustShifts(svg);
    // guideline も全 clear
    setActiveGuidelines([]);
    return true;
  };

  const targetBelongsTo = (id: string, targetName: string): boolean => {
    const slug = slugifyActorName(targetName);
    // 空 slug (日本語 only 等で英数字ゼロ) は startsWith が全 match するため raw name match のみに絞る
    if (!slug) {
      return (
        id === targetName ||
        id.startsWith(`${targetName}-`) ||
        id.startsWith(`${targetName}__`)
      );
    }
    return (
      id === targetName ||
      id === slug ||
      id.startsWith(`${targetName}-`) ||
      id.startsWith(`${slug}-`) ||
      id.startsWith(`${targetName}__`) ||
      id.startsWith(`${slug}__`) ||
      (/^s\d+-/.test(id) && (id.endsWith(`-${targetName}`) || id.endsWith(`-${slug}`)))
    );
  };

  const applyLiveTransform = (targetName: string, dx: number, dy: number): void => {
    const svg = previewRef.current?.querySelector("svg");
    if (!svg) return;
    svg.querySelectorAll(`[data-cdl-lane], [data-cdl-node], [data-cdl-edge]`).forEach((el) => {
      const id = el.getAttribute("data-cdl-lane") || el.getAttribute("data-cdl-node") || el.getAttribute("data-cdl-edge") || "";
      if (targetBelongsTo(id, targetName)) {
        (el as SVGGraphicsElement).style.transform = `translate(${dx}px, ${dy}px)`;
      }
    });
  };

  const applyLiveResize = (targetName: string, dx: number, dy: number, sx: number, sy: number): void => {
    const svg = previewRef.current?.querySelector("svg");
    if (!svg) return;
    // canvas pivot UX 修正 = resize は hover した individual element 単一のみに適用 (bug 1 root cause 修正)。
    // 旧実装は「target 名 prefix / suffix にマッチする全 element に scale 適用」 で lane 全体が拡大していた。
    // hoveredHandle.elementSelector は「実 hit した SVG element」 の selector なので個別 element を掴む。
    void targetName;
    const selector = elementDrag.current?.hoveredSelector;
    if (selector) {
      const el = svg.querySelector(selector) as SVGGraphicsElement | null;
      if (el) {
        el.style.transformOrigin = "0 0";
        el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      }
    }
  };

  const clearLiveTransform = (targetName: string): void => {
    const svg = previewRef.current?.querySelector("svg");
    if (!svg) return;
    // resize 経路の individual element selector も clear + drag 経路の bulk 経路も clear (両対応)
    const selector = elementDrag.current?.hoveredSelector;
    if (selector) {
      const el = svg.querySelector(selector) as SVGGraphicsElement | null;
      if (el) {
        el.style.transform = "";
        el.style.transformOrigin = "";
      }
    }
    svg.querySelectorAll(`[data-cdl-lane], [data-cdl-node], [data-cdl-edge]`).forEach((el) => {
      const id = el.getAttribute("data-cdl-lane") || el.getAttribute("data-cdl-node") || el.getAttribute("data-cdl-edge") || "";
      if (targetBelongsTo(id, targetName)) {
        (el as SVGGraphicsElement).style.transform = "";
      }
    });
  };

  const cornerToCursor = (corner: ResizeCorner): string => {
    if (corner === "nw" || corner === "se") return "nwse-resize";
    return "nesw-resize";
  };

  const clearAutoAdjustShifts = useCallback((svg: SVGSVGElement): void => {
    svg.querySelectorAll<SVGGraphicsElement>('[data-auto-adjust-shift="1"]').forEach((el) => {
      el.style.transform = "";
      el.removeAttribute("data-auto-adjust-shift");
    });
  }, []);

  const applyGuidelinesDuringDrag = useCallback((draggedName: string, commandBypass: boolean, svg: SVGSVGElement): void => {
    if (commandBypass) {
      setActiveGuidelines([]);
      return;
    }
    const draggedSlug = slugifyActorName(draggedName);
    const draggedEls = svg.querySelectorAll(`[data-cdl-lane="${draggedSlug}"], [data-cdl-lane="${draggedName}"]`);
    if (draggedEls.length === 0) {
      setActiveGuidelines([]);
      return;
    }
    const dragBB = (draggedEls[0] as SVGGraphicsElement).getBoundingClientRect();
    const targets: Array<{ id: string; rect: DOMRect }> = [];
    svg.querySelectorAll<SVGGraphicsElement>("[data-cdl-lane]").forEach((el) => {
      const id = el.getAttribute("data-cdl-lane") || "";
      if (id === draggedSlug || id === draggedName) return;
      targets.push({ id, rect: el.getBoundingClientRect() });
    });
    const stageRect = previewRef.current?.getBoundingClientRect();
    if (!stageRect) {
      setActiveGuidelines([]);
      return;
    }
    // stage 相対座標に変換
    const dragBBRel = {
      x: dragBB.left - stageRect.left,
      y: dragBB.top - stageRect.top,
      width: dragBB.width,
      height: dragBB.height,
    };
    const targetsRel = targets.map((t) => ({
      id: t.id,
      rect: {
        x: t.rect.left - stageRect.left,
        y: t.rect.top - stageRect.top,
        width: t.rect.width,
        height: t.rect.height,
      },
    }));
    const guides = detectGuidelines(dragBBRel, targetsRel);
    setActiveGuidelines(guides);
  }, []);

  const applyAutoAdjustDuringDrag = useCallback((draggedName: string, commandBypass: boolean, svg: SVGSVGElement): void => {
    // preset type を DSL の type: 行から抽出
    const typeMatch = src.match(/^\s*type\s*:\s*(\w+)/m);
    const preset = (typeMatch?.[1] as PresetType | undefined) ?? "sequence";
    // まず前回 tick の shift を全 clear
    clearAutoAdjustShifts(svg);
    if (commandBypass) return; // Command bypass = 何もしない

    // drag 対象の rect を取得
    const draggedSlug = slugifyActorName(draggedName);
    const draggedEls = svg.querySelectorAll(`[data-cdl-lane="${draggedSlug}"], [data-cdl-lane="${draggedName}"], [data-cdl-node="${draggedSlug}"]`);
    if (draggedEls.length === 0) return;
    const draggedRect = (draggedEls[0] as SVGGraphicsElement).getBoundingClientRect();

    // 他 lane / node に対して collision shift を計算 + CSS transform 適用
    svg.querySelectorAll<SVGGraphicsElement>("[data-cdl-lane], [data-cdl-node]").forEach((el) => {
      const id = el.getAttribute("data-cdl-lane") || el.getAttribute("data-cdl-node") || "";
      // drag 対象パーツは対象外 (自分自身を shift しない)
      if (id === draggedSlug || id === draggedName || id.startsWith(`${draggedSlug}-`) || id.startsWith(`${draggedName}-`)) return;
      const rect = el.getBoundingClientRect();
      const shift = computeCollisionShift(
        { x: draggedRect.left, y: draggedRect.top, width: draggedRect.width, height: draggedRect.height },
        { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        preset,
        false,
      );
      if (shift.dx !== 0 || shift.dy !== 0) {
        el.style.transform = `translate(${shift.dx}px, ${shift.dy}px)`;
        el.style.transition = "transform 200ms ease-out";
        el.setAttribute("data-auto-adjust-shift", "1");
      }
    });
  }, [src, clearAutoAdjustShifts]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // toolbar クリックは pan させない
    if ((e.target as HTMLElement).closest(".cdl-editor-zoom-toolbar")) return;
    // canvas pivot 新 spec = SVG element 上なら element interaction を優先、 それ以外は pan
    if (startElementInteraction(e)) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.tx, ty: transform.ty };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    // element drag / resize 中は pan せず interaction pass に流す
    if (updateElementInteraction(e)) return;
    // hover 中の element を追跡して handle 表示用 state 更新
    if (!elementDrag.current) {
      // canvas pivot UX 修正 (B1) = 既存 hoveredHandle の handle 4 隅境界 + buffer 内なら hover 更新を
      // skip して subNodeKey / elementSelector を維持する。 SE corner まで mouse.move すると findDragTarget
      // が親 lane 等別 target を返すことで hoveredHandle が上書きされ subNodeKey が消失し、 resize が actor
      // 全体経路 (lane 全体 posX 書出し) に fallback → spacer / footer が引きずられる bug 修正。
      if (hoveredHandle) {
        const r = hoveredHandle.rect;
        const handleBuffer = 16;
        if (
          e.clientX >= r.left - handleBuffer &&
          e.clientX <= r.right + handleBuffer &&
          e.clientY >= r.top - handleBuffer &&
          e.clientY <= r.bottom + handleBuffer
        ) {
          // handle boundary 内 → hover 追跡は変えず既存 subNodeKey を保持
          if (!dragging) return;
          setTransform((t) => ({
            ...t,
            tx: dragStart.current.tx + (e.clientX - dragStart.current.x),
            ty: dragStart.current.ty + (e.clientY - dragStart.current.y),
          }));
          return;
        }
      }
      const target = e.target as Element;
      const dragInfo = findDragTarget(target, extractAllActorNames(src));
      if (dragInfo) {
        // canvas pivot UX 修正 = hover 対象は「target が実 hit した SVG element」 = 個別 element の rect を SSOT にする
        // (旧実装は parent lane の rect を採用していたため lane 全体を囲む枠が出る bug)
        let elementSelector = "";
        let cur: Element | null = target;
        while (cur) {
          const laneAttr = cur.getAttribute?.("data-cdl-lane");
          const nodeAttr = cur.getAttribute?.("data-cdl-node");
          const edgeAttr = cur.getAttribute?.("data-cdl-edge");
          if (nodeAttr) {
            elementSelector = `[data-cdl-node="${nodeAttr}"]`;
            break;
          }
          if (edgeAttr) {
            elementSelector = `[data-cdl-edge="${edgeAttr}"]`;
            break;
          }
          if (laneAttr) {
            elementSelector = `[data-cdl-lane="${laneAttr}"]`;
            break;
          }
          cur = cur.parentElement;
        }
        const rect = cur ? (cur as Element).getBoundingClientRect() : null;
        if (rect && elementSelector) {
          // canvas pivot UX 修正 (B1) = data-cdl-node の subNodeKey (`header` / `footer` / `spacer` / `s0` 等)
          // を hoveredHandle に転写、 startElementInteraction で subNodeKey 経由 individual sub-node 経路に流す。
          // subNodeKey undefined 時 (findDragTarget が親 lane / raw actor を返した場合) は前回の subNodeKey を
          // 継承して subNodeKey 消失を防ぐ (SE 境界 mouse.move で親 lane に上がっても sub-node 経路を維持)。
          const inheritedSubKey =
            dragInfo.subNodeKey ??
            (hoveredHandle && hoveredHandle.id === dragInfo.name ? hoveredHandle.subNodeKey : undefined);
          setHoveredHandle({ id: dragInfo.name, elementSelector, rect, subNodeKey: inheritedSubKey });
        }
      } else if (hoveredHandle) {
        // element 外に mouse が出たら handle を消す (only if outside the rect + some buffer)
        const r = hoveredHandle.rect;
        const buffer = 16;
        if (e.clientX < r.left - buffer || e.clientX > r.right + buffer || e.clientY < r.top - buffer || e.clientY > r.bottom + buffer) {
          setHoveredHandle(null);
        }
      }
    }
    if (!dragging) return;
    setTransform((t) => ({
      ...t,
      tx: dragStart.current.tx + (e.clientX - dragStart.current.x),
      ty: dragStart.current.ty + (e.clientY - dragStart.current.y),
    }));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (finalizeElementInteraction(e)) return;
    setDragging(false);
  };

  const handleReset = useCallback((): void => handleFit(), [handleFit]);
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
  }, [handleReset]);

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
    return document.querySelector(".v4-editor-preview svg");
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
    ctx.fillStyle = isDark ? "#241c14" : "#f0e8d4";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(svgUrl);
    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) return;
    downloadBlob(pngBlob, `${diagram?.id ?? "diagram"}.png`);
  };

  const scaleDisplay = useMemo(() => `${Math.round(transform.scale * 100)}%`, [transform.scale]);

  const handleSelectSample = (s: { label: string; code: string }): void => {
    // CAR-1657 = user 編集中は confirm、 SAMPLES click も REPLACE 経路の 1 種として同 guard 適用
    if (!confirmReplaceIfDirty(s.label)) return;
    setSrc(s.code);
    lastLoadedSrcRef.current = s.code;
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
    if (!confirmReplaceIfDirty("新規ファイル")) return;
    setSrc(blank);
    lastLoadedSrcRef.current = blank;
    setActiveSample("new");
  };

  /**
   * sidebar parts item を drag 開始した時に partId (CdlDiagram.id) を dataTransfer に載せる。
   * native HTML5 drag events を採用 (dnd-kit 30KB 依存追加を避けた、
   * decision-log 2026-07-16-dragon-editor-drag-patch-strategy-and-lib)。
   * MIME は独自 `application/dragon-part` + text/plain fallback で Safari 互換を担保する。
   */
  const handleDragStartPart = useCallback((partId: string) => (e: React.DragEvent<HTMLButtonElement>): void => {
    e.dataTransfer.setData("application/dragon-part", partId);
    e.dataTransfer.setData("text/plain", partId);
    e.dataTransfer.effectAllowed = "copy";
  }, []);

  const handlePreviewDragOver = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    // preventDefault しないと onDrop が発火しない (native drag API 仕様)
    if (e.dataTransfer.types.includes("application/dragon-part") || e.dataTransfer.types.includes("text/plain")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      if (!dropOver) setDropOver(true);
    }
  }, [dropOver]);

  const handlePreviewDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    // drag 元 element の入れ子で dragleave が誤発火するため、 currentTarget 外にした時のみ off
    const rel = e.relatedTarget as Node | null;
    if (rel && (e.currentTarget as Node).contains(rel)) return;
    setDropOver(false);
  }, []);

  const handlePreviewDrop = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDropOver(false);
    const partId = e.dataTransfer.getData("application/dragon-part") || e.dataTransfer.getData("text/plain");
    if (!partId) return;
    const item = partsItems.find((p) => p.id === partId);
    if (!item) {
      setDropHintWithReset(`parts "${partId}" が見つかりません。 sidebar を再読込してください。`, 6000);
      return;
    }
    // CAR-1657 unified syntax = drop で REPLACE ではなく既存 actors: に `- {alias}: { kind: {partId} }` を append する。
    // parts.cdl.ts の id ('parts-arc-gauge') → syntax kind 値 ('arc-gauge') に strip prefix、
    // alias は既 actor 名衝突回避で連番生成 ('arc1' → 'arc2')、 lane 指定は default なし (compile 側で内部 lane 生成)。
    const kindValue = item.id.startsWith("parts-") ? item.id.slice(6) : item.id;
    const aliasBase = kindValue.replace(/[^a-zA-Z0-9]/g, "");
    const existingActorNames = collectActorNamesFromSrc(src);
    let alias = `${aliasBase}1`;
    for (let i = 1; i <= 1000 && existingActorNames.has(alias); i++) {
      alias = `${aliasBase}${i + 1}`;
    }
    // parts state の initial 値を inline state override として展開 (parts に state 0 個ならなし)
    const stateInits: string[] = item.diagram.states.map((s) => {
      const v = s.initial;
      const rendered = typeof v === "string" ? `"${v}"` : String(v);
      return `${s.id}: ${rendered}`;
    });
    const inlineFields = [`kind: ${kindValue}`, ...stateInits].join(", ");
    const newActorLine = `  - ${alias}: { ${inlineFields} }`;
    // canvas pivot UX 修正 (B2) = parts 追加前に既存 actors の現 lane 位置を pinning、
    // 全 lane 再配置による既存 header shift を防ぐ
    const svgEl = previewRef.current?.querySelector("svg") as SVGSVGElement | null;
    const pinnedSrc = pinExistingActorLayoutFromSvg(src, svgEl);
    const newSrc = appendActorLine(pinnedSrc, newActorLine);
    if (newSrc === null) {
      // src に actors: block が見つからない = new file or 別 preset、 confirm dialog 経路 (REPLACE fallback)
      if (!confirmReplaceIfDirty(item.title)) {
        setDropHintWithReset("drop をキャンセルしました。 編集内容は保持されています。", 4000);
        return;
      }
      const replaceSrc = `title: "${item.title}"
type: sequence

actors:
${newActorLine}
`;
      setSrc(replaceSrc);
      lastLoadedSrcRef.current = replaceSrc;
      setActiveSample(item.title);
      setDropHintWithReset(`parts "${item.title}" を新規 diagram として読み込みました。 元に戻すには Cmd+Z。`, 6000);
      return;
    }
    // additive path = 既存 diagram に append、 confirm dialog 不要 (destructive でない)
    setSrc(newSrc);
    lastLoadedSrcRef.current = newSrc;
    setDropHintWithReset(`actors: に "${alias}" (${kindValue}) を追加しました。 元に戻すには Cmd+Z。`, 6000);
  }, [partsItems, setDropHintWithReset, confirmReplaceIfDirty, src]);

  return (
    <div className="v4-editor">
      {/* ── 左 sidebar (new file + tabs = SAMPLES / parts、 CAR-1646 で parts tab 追加) ── */}
      <aside className="v4-editor-side">
        <button
          type="button"
          className="v4-editor-side-new"
          onClick={handleNewFile}
        >
          <span className="v4-editor-side-new-plus">+</span>
          <span>新規ファイル</span>
        </button>
        <div className="v4-editor-side-tabs" role="tablist" aria-label="sidebar tabs">
          <button
            type="button"
            role="tab"
            aria-selected={sidebarTab === "samples"}
            className={`v4-editor-side-tab ${sidebarTab === "samples" ? "active" : ""}`}
            onClick={() => setSidebarTab("samples")}
          >
            サンプル
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sidebarTab === "parts"}
            className={`v4-editor-side-tab ${sidebarTab === "parts" ? "active" : ""}`}
            onClick={() => setSidebarTab("parts")}
            data-testid="editor-parts-tab"
          >
            パーツ
          </button>
        </div>
        {sidebarTab === "samples" && (
          <div className="v4-editor-side-samples-body">
            <input
              className="v4-editor-search"
              type="text"
              placeholder="🔍 検索…"
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
                      data-testid={`editor-sample-${s.slug}`}
                      data-sample-label={s.label}
                      onClick={() => handleSelectSample(s)}
                    >
                      {s.label.replace(/\s*\([^)]*\)\s*$/, "")}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {sidebarTab === "parts" && (
          <div className="v4-editor-side-samples-body" data-testid="editor-parts-panel">
            <input
              className="v4-editor-search"
              type="text"
              placeholder="🔍 検索…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {partsLoading && <div className="v4-editor-side-loading">読み込み中… ({filteredParts.length} 件)</div>}
            {!partsLoading && filteredParts.length === 0 && (
              <div className="v4-editor-side-loading">
                {partsItems.length === 0
                  ? "初回 load 待ち…"
                  : "検索条件に一致するパーツがありません。"}
              </div>
            )}
            <div className="v4-editor-side-list">
              {filteredParts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  draggable
                  onDragStart={handleDragStartPart(p.id)}
                  className={`v4-editor-side-item v4-editor-side-part ${activeSample === p.title ? "active" : ""}`}
                  data-testid={`editor-part-item-${p.id}`}
                  data-part-id={p.id}
                  title={`${p.subtitle} (drag してプレビューに drop)`}
                  onClick={() => {
                    // CAR-1657 click = drop と同 semantic = actors: append (additive)。
                    // actors: block なし = REPLACE fallback (新規 diagram 作成、 confirm dialog 経由)
                    const kindValue = p.id.startsWith("parts-") ? p.id.slice(6) : p.id;
                    const aliasBase = kindValue.replace(/[^a-zA-Z0-9]/g, "");
                    const existingNames = collectActorNamesFromSrc(src);
                    let alias = `${aliasBase}1`;
                    for (let i = 1; i <= 1000 && existingNames.has(alias); i++) {
                      alias = `${aliasBase}${i + 1}`;
                    }
                    const stateInits: string[] = p.diagram.states.map((s) => {
                      const v = s.initial;
                      const rendered = typeof v === "string" ? `"${v}"` : String(v);
                      return `${s.id}: ${rendered}`;
                    });
                    const inlineFields = [`kind: ${kindValue}`, ...stateInits].join(", ");
                    const newActorLine = `  - ${alias}: { ${inlineFields} }`;
                    // canvas pivot UX 修正 (B2) = parts click 追加前に既存 actors の現 lane 位置を pinning
                    const svgElClick = previewRef.current?.querySelector("svg") as SVGSVGElement | null;
                    const pinnedSrcClick = pinExistingActorLayoutFromSvg(src, svgElClick);
                    const appended = appendActorLine(pinnedSrcClick, newActorLine);
                    if (appended !== null) {
                      setSrc(appended);
                      lastLoadedSrcRef.current = appended;
                      setDropHintWithReset(`actors: に "${alias}" (${kindValue}) を追加しました。`, 4000);
                    } else {
                      // REPLACE fallback with confirm
                      if (!confirmReplaceIfDirty(p.title)) return;
                      const replaceSrc = `title: "${p.title}"\ntype: sequence\n\nactors:\n${newActorLine}\n`;
                      setSrc(replaceSrc);
                      lastLoadedSrcRef.current = replaceSrc;
                      setActiveSample(p.title);
                      setDropHintWithReset(`parts "${p.title}" を新規 diagram として読み込みました。`, 4000);
                    }
                  }}
                >
                  {p.title.replace(/^parts/, "").replace(/([A-Z])/g, " $1").trim() || p.id}
                </button>
              ))}
            </div>
            <div className="v4-editor-side-hint">
              パーツを右のプレビューに drag するか、 クリックで既存 diagram の actors: に追加します。 Cmd+Z で undo 可、 既存内容は消えません。
            </div>
          </div>
        )}
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
              エクスポート ↓
            </button>
            <div className="v4-editor-export-menu">
              <button type="button" onClick={handleExportAnimatedSvg} disabled={!diagram}>
                <strong>アニメーション SVG</strong>
                <span>単一ファイルで動く / GitHub README / Notion</span>
              </button>
              <button type="button" onClick={handleExportStaticSvg} disabled={!diagram}>
                <strong>静止 SVG</strong>
                <span>現 phase の静止 1 frame / Keynote / PDF</span>
              </button>
              <button type="button" onClick={() => void handleExportPng()} disabled={!diagram}>
                <strong>PNG</strong>
                <span>ラスター 2x DPR / Slack / Twitter</span>
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
        {!error && warnings.length > 0 && (
          <div className="v4-editor-warnings">
            <div className="v4-editor-warnings-head">
              <span className="v4-editor-warnings-badge">
                {warnings.filter((w) => w.severity === "error").length > 0
                  ? "位置関係NG"
                  : `位置関係の警告 ${warnings.length}件`}
              </span>
              <span className="v4-editor-warnings-hint">
                {fixableWarningCount > 0
                  ? `DSLの labelOffsetX/Y でnodeとの位置を調整できます (対応可 ${fixableWarningCount} 件)`
                  : unfixableAxisHint}
              </span>
              <button
                type="button"
                className="v4-editor-warnings-apply"
                onClick={handleAutoFix}
                disabled={fixableWarningCount === 0}
                title={
                  fixableWarningCount > 0
                    ? `${fixableWarningCount} 件の edge-label offset を DSL に一括反映`
                    : "対応可 warning がありません"
                }
              >
                {fixableWarningCount > 0 ? `一括反映 (${fixableWarningCount}) ✨` : "対応可なし"}
              </button>
            </div>
            {autoFixMessage && (
              <div
                role="status"
                style={{
                  padding: "8px 12px",
                  marginTop: "8px",
                  borderRadius: "6px",
                  background: "var(--v4-brand-soft, #f8ecd8)",
                  color: "var(--v4-brand-deep, #8a5a2a)",
                  fontSize: "12px",
                  lineHeight: 1.5,
                }}
              >
                {autoFixMessage}
              </div>
            )}
            <ul className="v4-editor-warnings-list">
              {warnings.slice(0, 6).map((w, i) => (
                <li key={i} className={`v4-editor-warning-item v4-editor-warning-${w.severity}`}>
                  <span className="v4-editor-warning-axis">{w.axis}</span>
                  <span className="v4-editor-warning-detail">{w.detail}</span>
                </li>
              ))}
              {warnings.length > 6 && (
                <li className="v4-editor-warning-more">…他 {warnings.length - 6} 件</li>
              )}
            </ul>
          </div>
        )}
      </section>

      {/* ── 右 preview pane (full-bleed) ── */}
      <section className="v4-editor-preview">
        <header className="v4-editor-bar">
          <span className="v4-editor-bar-file">
            <span className="v4-editor-live" /> ライブプレビュー
          </span>
          <span className="v4-editor-bar-gap" />
          <button
            type="button"
            className="v4-editor-bar-btn"
            onClick={handleFit}
            title="表示を preview 領域に合わせる"
          >
            フィット
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn"
            onClick={handleReset}
            title="表示を初期状態に戻す (Esc)"
          >
            リセット
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn"
            onClick={handle100}
            title="等倍表示"
          >
            100%
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn"
            onClick={handleZoomOut}
            title="縮小"
            aria-label="縮小"
          >
            −
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn"
            onClick={handleZoomIn}
            title="拡大"
            aria-label="拡大"
          >
            +
          </button>
          <span className="v4-editor-bar-zoom">{scaleDisplay}</span>
        </header>
        <div
          className={`v4-editor-stage ${dropOver ? "drop-over" : ""}`}
          ref={previewRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDragOver={handlePreviewDragOver}
          onDragLeave={handlePreviewDragLeave}
          onDrop={handlePreviewDrop}
          data-testid="editor-preview-stage"
        >
          {dropOver && (
            <div className="v4-editor-drop-overlay" aria-hidden>
              ここにドロップして読み込む
            </div>
          )}
          {dropHintMessage && (
            <div className="v4-editor-drop-hint" role="status">{dropHintMessage}</div>
          )}
          <div
            className="v4-editor-pan"
            style={{
              transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
            }}
          >
            {diagram ? (
              <div className="v4-editor-svg-wrap">
                <CdlDiagramView diagram={diagram} hideHeader emitGeometryWarn={import.meta.env.DEV} />
              </div>
            ) : (
              <div className="v4-editor-empty">読み込み中...</div>
            )}
          </div>
          {activeGuidelines.length > 0 && (() => {
            const stageRect = previewRef.current?.getBoundingClientRect();
            if (!stageRect) return null;
            return activeGuidelines.map((g, i) => {
              if (g.axis === "horizontal") {
                return (
                  <div
                    key={`gl-h-${i}`}
                    data-guideline="horizontal"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${g.coord}px`,
                      height: "0px",
                      borderTop: "1px dashed #d97706",
                      pointerEvents: "none",
                      zIndex: 105,
                    }}
                  />
                );
              }
              return (
                <div
                  key={`gl-v-${i}`}
                  data-guideline="vertical"
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${g.coord}px`,
                    width: "0px",
                    borderLeft: "1px dashed #d97706",
                    pointerEvents: "none",
                    zIndex: 105,
                  }}
                />
              );
            });
          })()}
          {hoveredHandle && (() => {
            // canvas pivot 新 spec = hover 中パーツの 4 隅 handle overlay (spec 項目 2 resize 用)
            const stageRect = previewRef.current?.getBoundingClientRect();
            if (!stageRect) return null;
            const r = hoveredHandle.rect;
            const left = r.left - stageRect.left;
            const top = r.top - stageRect.top;
            const HANDLE = 10;
            const style = (x: number, y: number, cursor: string) => ({
              position: "absolute" as const,
              left: `${x - HANDLE / 2}px`,
              top: `${y - HANDLE / 2}px`,
              width: `${HANDLE}px`,
              height: `${HANDLE}px`,
              background: "#fff",
              border: "1.5px solid #8a5a2a",
              borderRadius: "2px",
              cursor,
              zIndex: 100,
              pointerEvents: "none" as const,
            });
            return (
              <>
                <div style={style(left, top, "nwse-resize")} data-corner="nw" />
                <div style={style(left + r.width, top, "nesw-resize")} data-corner="ne" />
                <div style={style(left, top + r.height, "nesw-resize")} data-corner="sw" />
                <div style={style(left + r.width, top + r.height, "nwse-resize")} data-corner="se" />
                <div
                  style={{
                    position: "absolute",
                    left: `${left}px`,
                    top: `${top}px`,
                    width: `${r.width}px`,
                    height: `${r.height}px`,
                    border: "1.5px dashed rgba(138, 90, 42, 0.5)",
                    pointerEvents: "none",
                    zIndex: 99,
                  }}
                />
              </>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
