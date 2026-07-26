import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router";
import { compile, CdlDiagramView, visualValidate, type CdlDiagram, type LaidDiagram, type Violation } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import CodeMirror from "@uiw/react-codemirror";
import { loadPartsItems, type CatalogItem } from "@/lib/catalog-items";
import { deserializePart, isPartsMarker, PARTS_MARKER } from "@/lib/parts-serializer";
import { HtmlDivCanvasEditor, canvasHtmlFeatureFlag, type HtmlDivCanvasEditorHandle } from "@/components/HtmlDivCanvasEditor";
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
  resolveClickPlacement,
  toWorldOrNull,
  type DragState,
  type ResizeCorner,
  type WorldRect,
} from "@/lib/canvas-pivot-interaction";
// 2026-07-24 = canvas-pivot-auto-adjust / canvas-pivot-guideline / viewBoxCompensation を全削除。
// user 要求「勝手な移動全部削除」 の core、 auto 補正 / 補助線 / pan 補償の 3 経路を完全撤去。
import { extractPartsFromSrc, writeOverlayPartToDsl } from "@/lib/overlay-dsl";
import { replaceTextInDsl } from "@/lib/text-edit-replace";
import { aliasBaseName, buildDuplicateLine, nextAvailableAlias } from "@/lib/overlay-duplicate";
import { alignOverlayParts, type AlignMode } from "@/lib/overlay-align";
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
// 2026-07-24 = extractPartsFromSrc / writeOverlayPartToDsl は @/lib/overlay-dsl に抽出 (Layer 1 unit test 化)

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
    // decision-log 2026-07-24-dragon-editor-full-revert-simplify = user 意図「auto 補正全 disable」 の
    // core fix。 従来は posX/Y のみ pin していたが、 achievement drop で lane 幅再計算により Client
    // lane が 252px shift する root cause だった。 posW/posH も同 attribute から snapshot して pin、
    // 全 lane 完全固定で「独立要素として存在」 の思想を実現。
    const rw = el.getAttribute("data-cdl-lane-w");
    const rh = el.getAttribute("data-cdl-lane-h");
    const pw = rw && Number.isFinite(parseFloat(rw)) ? parseFloat(rw) : undefined;
    const ph = rh && Number.isFinite(parseFloat(rh)) ? parseFloat(rh) : undefined;
    // 既書出し検出 = 行ごとの regex で actor entry を探し `posX:` が既にあれば skip
    if (hasPosXInActorEntry(next, name)) continue;
    next = injectActorPosXY(next, name, px, py, pw, ph);
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
 * 対象 actor に posX/posY (+ optional posW/posH) を注入する。 既存 inline map があれば merge、
 * bare / short form なら inline map 化。 posW/posH が渡された場合は追加 pin (2026-07-24 fix、
 * decision-log dragon-editor-full-revert-simplify、 achievement drop で lane 幅再計算 → 他 lane
 * 252px shift の root cause 対応)。
 */
function injectActorPosXY(src: string, targetName: string, posX: number, posY: number, posW?: number, posH?: number): string {
  const rx = Math.round(posX);
  const ry = Math.round(posY);
  const parts: string[] = [`posX: ${rx}`, `posY: ${ry}`];
  if (posW !== undefined && Number.isFinite(posW)) parts.push(`posW: ${Math.round(posW)}`);
  if (posH !== undefined && Number.isFinite(posH)) parts.push(`posH: ${Math.round(posH)}`);
  const extra = parts.join(", ");
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
  const [src, setSrcRaw] = useState<string>(SAMPLES[0].code);
  // 2026-07-24 setSrc wrapper = history stack に previous src を push (Undo/Redo 用、 Feature 1)。
  // pop 経路 (undo / redo) からの setSrc は setSrcSilent を使う (history 巻き添え防止)。
  const setSrc = useCallback((updater: string | ((prev: string) => string)): void => {
    setSrcRaw((prev) => {
      const nextSrc = typeof updater === "function" ? updater(prev) : updater;
      if (nextSrc !== prev) {
        historyRef.current.past.push(prev);
        if (historyRef.current.past.length > 50) historyRef.current.past.shift();
        historyRef.current.future = []; // 新 edit で redo 消去
        lastCommittedSrcRef.current = nextSrc;
      }
      return nextSrc;
    });
  }, []);
  const setSrcSilent = setSrcRaw; // undo / redo 経路用 (history に push しない)
  // CAR-1947 = HTML div canvas feature flag (URL param `?canvas=html` opt-in、 未指定時は既存 SVG 経路)。
  // useState + initializer で mount 時 1 回だけ read、 URL 変化での re-eval は Phase 2 以降の課題。
  const [useHtmlCanvas] = useState<boolean>(() => canvasHtmlFeatureFlag.isEnabled());
  const htmlCanvasRef = useRef<HtmlDivCanvasEditorHandle | null>(null);
  const [diagram, setDiagram] = useState<CdlDiagram | null>(null);
  // 2026-07-24 architectural refactor = parts を cdl DSL から完全切離、 独立 overlay 化。
  // cdl は base (Client/API/DB) のみ compile、 parts は React state で管理 + 独立 SVG overlay で描画。
  // これにより cdl の auto-layout / re-routing / label 再配置が parts drop/drag で発火せず、
  // base 図の全 lane / arrow / label は 100% 静止 (user 要求「勝手な移動全部削除」 の root architecture)。
  type OverlayPart = { id: string; kind: string; posX: number; posY: number; scale: number; rotate: number; bg?: string; item: CatalogItem };
  const [overlayParts, setOverlayParts] = useState<OverlayPart[]>([]);
  const [hoveredOverlayId, setHoveredOverlayId] = useState<string | null>(null);
  // 2026-07-24 multi selection (Task #86) = 複数 element 選択 state。 overlay parts + cdl 要素 混在対応。
  // ID 命名規約: `overlay:{alias}` = parts、 `cdl-node:{id}` = cdl node、 `cdl-lane:{id}` = cdl lane、
  // `cdl-edge:{id}` = cdl edge、 `text:{content}` = arrow label 等。
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // 2026-07-25 cdl 要素 selection = `cdl:{id}` の selector を保存、 stage-level UI で bbox 再測定に使う
  const [cdlSelectorMap, setCdlSelectorMap] = useState<Record<string, string>>({});
  // 2026-07-26 CAR-2158 = SVG text element (arrow label 等) に刻む一意 key の連番 counter
  const textKeySeqRef = useRef(0);
  // 2026-07-26 CAR-2158 = 矢印キー nudge の累積管理。
  // base = nudge 開始時点の座標、 accum = そこからの累積 delta。 どちらも同期 ref なので、
  // キーリピートで同一 commit に複数 keydown が入っても押下回数分が正しく積算される
  // (state / useEffect mirror 経由だと全押下が同じ古い base を読んで 1 回分しか進まない)。
  const nudgeBaseRef = useRef<Map<string, { posX: number; posY: number; scale: number; rotate: number }>>(new Map());
  const nudgeAccumRef = useRef<Map<string, { dx: number; dy: number }>>(new Map());
  const [cdlClientBboxes, setCdlClientBboxes] = useState<Record<string, { left: number; top: number; width: number; height: number }>>({});
  // 2026-07-25 text 編集 (double click) = 選択 text 要素の client bbox + 元テキストで stage-level input を描画。
  // Enter / blur で src.replaceAll(originalText, newText) を試みる (最小実装、 duplicate text は先出し replace)。
  const [textEditing, setTextEditing] = useState<{ originalText: string; bbox: { left: number; top: number; width: number; height: number }; fontSize: number } | null>(null);
  // 2026-07-24 grouping (Task #88) = group id → member ids の Map。
  // Cmd+G で group 作成、 Cmd+Shift+G で解除。 group 単位で drag / hover / union bbox 表示。
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  // 2026-07-24 rubber band 選択 (Task #90) = 背景 drag で area 内 全 overlay 選択。
  // 状態 = { startClientX, startClientY, currentClientX, currentClientY } を rubber band drag 中保持。
  const [rubberBand, setRubberBand] = useState<{ sx: number; sy: number; cx: number; cy: number } | null>(null);
  // 2026-07-24 Undo / Redo (Feature 1) = src の history stack。 過去 50 世代保持、 Cmd+Z で戻る、 Cmd+Shift+Z で進む。
  const historyRef = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });
  const lastCommittedSrcRef = useRef<string>("");
  // 2026-07-24 clipboard (Feature 3) = 選択 overlay parts の snapshot list を保持。 paste で+30 offset 生成。
  const clipboardRef = useRef<Array<{ kind: string; posX: number; posY: number; scale: number; rotate: number; bg?: string }>>([]);
  // 2026-07-24 context menu (Feature 4) = 右クリック時 { x, y, targetOverlayId } を保持、 menu 描画 trigger。
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; overlayId: string | null } | null>(null);
  // 2026-07-24 color picker (Feature 2) = 選択 overlay part の色変更 popover 表示 trigger。
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  // 2026-07-25 shape client bbox measure (stage-local client px)。
  // 「囲いサイズぐちゃぐちゃ」 root cause = pan.scale factor 抜けの座標系変換 bug、 全経路を client 空間に統一。
  // 用途 = 選択 UI (border/handle/toolbar) を stage-level に portal render するための実 client bbox。
  const overlayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [shapeClientBboxes, setShapeClientBboxes] = useState<Record<string, { left: number; top: number; width: number; height: number }>>({});
  // keydown handler (align 等) から最新 bbox を読むための同期 mirror
  const shapeClientBboxesRef = useRef(shapeClientBboxes);
  useEffect(() => { shapeClientBboxesRef.current = shapeClientBboxes; }, [shapeClientBboxes]);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const stageRect = previewRef.current?.getBoundingClientRect();
      if (!stageRect) return;
      const next: Record<string, { left: number; top: number; width: number; height: number }> = {};
      // 2026-07-26 CAR-2158 performance fix = 測定対象を「選択中 + hover 中」 に絞る。
      // 旧実装は overlayParts 全件 × 各 div 内の全 shape を毎 state 変化で測定していたため、
      // parts が増えるほど drag 中の 1 frame コストが線形に増えていた (実質 O(parts × shapes))。
      // bbox を実際に使うのは stage-level 選択 UI (border / handle / toolbar) だけなので、
      // 選択中と hover 中の parts に限定すれば描画結果は同一のまま測定量が定数近くに収まる。
      const measureTargets = new Set<string>();
      for (const sid of selectedIds) {
        if (sid.startsWith("overlay:")) measureTargets.add(sid.slice("overlay:".length));
      }
      if (hoveredOverlayId) measureTargets.add(hoveredOverlayId);
      for (const p of overlayParts) {
        if (!measureTargets.has(p.id)) continue;
        const div = overlayRefs.current[p.id];
        if (!div) continue;
        const shapes = div.querySelectorAll("circle, rect, path, ellipse, polygon");
        if (shapes.length === 0) continue;
        let maxArea = 0;
        let best: DOMRect | null = null;
        for (const s of Array.from(shapes)) {
          const r = (s as SVGGraphicsElement).getBoundingClientRect();
          if (r.width < 3 || r.height < 3) continue;
          const a = r.width * r.height;
          if (a > maxArea) { maxArea = a; best = r; }
        }
        if (!best) continue;
        // stage 相対 client px = stage 内 absolute で render 可能な bbox
        next[p.id] = {
          left: best.left - stageRect.left,
          top: best.top - stageRect.top,
          width: best.width,
          height: best.height,
        };
      }
      const changed = Object.keys(next).length !== Object.keys(shapeClientBboxes).length ||
        Object.entries(next).some(([id, b]) => {
          const prev = shapeClientBboxes[id];
          return !prev || Math.abs(prev.left - b.left) > 0.5 || Math.abs(prev.top - b.top) > 0.5 || Math.abs(prev.width - b.width) > 0.5 || Math.abs(prev.height - b.height) > 0.5;
        });
      if (changed) setShapeClientBboxes(next);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayParts, selectedIds, hoveredOverlayId]);

  const overlayDragRef = useRef<{ id: string; startPosX: number; startPosY: number; startClientX: number; startClientY: number } | null>(null);
  // multi drag = drag 開始時に selection 内 全 overlay parts の start pos を snapshot、 mousemove で全員 shift
  const multiDragStartsRef = useRef<Map<string, { x: number; y: number }> | null>(null);
  // overlay resize = 4 隅 handle drag で幅高 scale。 startScale + startClient + corner を capture、
  // mousemove で diagonal delta から新 scale を計算。
  const overlayResizeRef = useRef<{ id: string; corner: "nw" | "ne" | "sw" | "se"; startScale: number; startClientX: number; startClientY: number; startPosX: number; startPosY: number; startClientW: number; startClientH: number; startBboxLeft: number; startBboxTop: number; panScale: number; panTx: number; panTy: number } | null>(null);
  // rotate ref = Alt + corner drag で回転、 overlay div の中心 client 座標基準で角度計算
  const overlayRotateRef = useRef<{ id: string; startRotate: number; centerClientX: number; centerClientY: number; startAngleRad: number } | null>(null);
  // CAR-1947 Round 2 F5 = 親 compile 結果 (LaidDiagram) を HTML canvas に受渡す SSOT。
  // useHtmlCanvas false 時は setLaid されず、 SVG 経路は従来通り CdlDiagramView 内部で layout する。
  const [laid, setLaid] = useState<LaidDiagram | null>(null);
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
  // 2026-07-25 pan / zoom 変化時に shape client bbox re-measure = 選択 UI 追従
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const stageRect = previewRef.current?.getBoundingClientRect();
      if (!stageRect) return;
      const next: Record<string, { left: number; top: number; width: number; height: number }> = {};
      // CAR-2158 performance fix = 選択 UI が使う分だけ測定 (全 overlay 走査を廃止)
      const measureTargets = new Set<string>();
      for (const sid of selectedIdsRef.current) {
        if (sid.startsWith("overlay:")) measureTargets.add(sid.slice("overlay:".length));
      }
      if (hoveredOverlayId) measureTargets.add(hoveredOverlayId);
      for (const id of measureTargets) {
        const div = overlayRefs.current[id];
        if (!div) continue;
        const shapes = div.querySelectorAll("circle, rect, path, ellipse, polygon");
        if (shapes.length === 0) continue;
        let maxArea = 0;
        let best: DOMRect | null = null;
        for (const s of Array.from(shapes)) {
          const r = (s as SVGGraphicsElement).getBoundingClientRect();
          if (r.width < 3 || r.height < 3) continue;
          const a = r.width * r.height;
          if (a > maxArea) { maxArea = a; best = r; }
        }
        if (!best) continue;
        next[id] = { left: best.left - stageRect.left, top: best.top - stageRect.top, width: best.width, height: best.height };
      }
      setShapeClientBboxes(next);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transform, hoveredOverlayId]);
  // 2026-07-26 CAR-2158 correctness fix = overlay parts の bg を実 SVG shape に適用する。
  // 旧実装は DSL に bg を書くだけで canvas に反映されず、 color picker が「押しても何も起きない」 状態だった。
  // catalog 由来の diagram は共有 object なので mutate せず、 render 後の DOM に fill を上書きする経路を採る。
  //
  // 対象 shape の選び方が肝で、 「最大面積」 だけで選ぶと achievement の透明背景 rect が当たり、
  // 円形の parts が四角く塗り潰される (visual regression で実測。 baseline を採用せず本 fix に至った)。
  // そのため「実際に色を塗られている shape」 = fill 属性が none / transparent 以外のものに限定し、
  // その中で最大面積のものを主要 shape とみなす。
  const applyOverlayBg = useCallback((parts: readonly OverlayPart[]): void => {
    for (const p of parts) {
      // bg 未指定 かつ 過去にも override していない parts は触らない (走査コスト削減)
      const div = overlayRefs.current[p.id];
      if (!div) continue;
      if (!p.bg && !div.querySelector("[data-original-fill]")) continue;
      const shapes = div.querySelectorAll<SVGGraphicsElement>("circle, rect, path, ellipse, polygon");
      if (shapes.length === 0) continue;
      let maxArea = 0;
      let best: SVGGraphicsElement | null = null;
      for (const s of Array.from(shapes)) {
        const r = s.getBoundingClientRect();
        if (r.width < 3 || r.height < 3) continue;
        // override 済 shape は data-original-fill 側が元の色を持つ (現 fill は override 色)
        const orig = s.getAttribute("data-original-fill");
        const fill = orig !== null ? orig : (s.getAttribute("fill") ?? window.getComputedStyle(s).fill ?? "");
        const painted = fill !== "" && fill !== "none" && fill !== "transparent" && !fill.startsWith("rgba(0, 0, 0, 0)");
        if (!painted) continue;
        const area = r.width * r.height;
        if (area > maxArea) { maxArea = area; best = s; }
      }
      if (!best) continue;
      if (p.bg) {
        // 元 fill を保存しておき、 bg 解除時に復元できるようにする
        if (!best.hasAttribute("data-original-fill")) {
          best.setAttribute("data-original-fill", best.getAttribute("fill") ?? "");
        }
        if (best.getAttribute("fill") !== p.bg) best.setAttribute("fill", p.bg);
      } else if (best.hasAttribute("data-original-fill")) {
        const orig = best.getAttribute("data-original-fill")!;
        if (orig) best.setAttribute("fill", orig);
        else best.removeAttribute("fill");
        best.removeAttribute("data-original-fill");
      }
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => applyOverlayBg(overlayParts));
    return () => cancelAnimationFrame(raf);
  }, [overlayParts, applyOverlayBg]);

  // 2026-07-26 CAR-2158 Round 2 = animation で shape が差し替わると DOM 直書きの fill が失われる。
  //
  // parts の SVG は cdl 側の animation (rAF / setInterval 駆動) で属性が書き換わったり
  // node ごと再生成されたりする。 bg は React 管理外の DOM 属性なので、 その度に override が消えて
  // 色が元に戻ってしまう。 MutationObserver で対象 subtree の変化を拾い、 その都度 再適用する。
  //
  // 自分の書込みで再帰しないよう、 適用時は「現在値と違う時だけ」 setAttribute する (上の実装)。
  useEffect(() => {
    const withBg = overlayParts.filter((p) => p.bg);
    if (withBg.length === 0) return;
    const observers: MutationObserver[] = [];
    for (const p of withBg) {
      const div = overlayRefs.current[p.id];
      if (!div) continue;
      const observer = new MutationObserver(() => applyOverlayBg([p]));
      observer.observe(div, { childList: true, subtree: true, attributes: true, attributeFilter: ["fill"] });
      observers.push(observer);
    }
    return () => { for (const o of observers) o.disconnect(); };
  }, [overlayParts, applyOverlayBg]);
  // 2026-07-25 cdl 要素 selection UI の bbox 再測定 = selectedIds / transform / cdlSelectorMap 変化時
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const stageRect = previewRef.current?.getBoundingClientRect();
      if (!stageRect) return;
      const next: Record<string, { left: number; top: number; width: number; height: number }> = {};
      // 2026-07-26 CAR-2158 fix = 選択対象の element が DOM から消えていたら selection ごと解除する。
      // text selection は DOM attribute (data-editor-text-key) を selector の SSOT にしているため、
      // label 編集による再 compile で React が text node を差し替えると attribute ごと消える。
      // 旧実装は selector が null になっても selection state を残していたので、
      // 実体のない選択枠が古い bbox のまま残り続けていた。
      const staleKeys: string[] = [];
      for (const sid of selectedIds) {
        if (!sid.startsWith("cdl:")) continue;
        const key = sid.slice("cdl:".length);
        const selector = cdlSelectorMap[key];
        if (!selector || !previewRef.current) continue;
        const el = previewRef.current.querySelector(selector) as SVGGraphicsElement | null;
        if (!el || typeof el.getBoundingClientRect !== "function") { staleKeys.push(key); continue; }
        const r = el.getBoundingClientRect();
        if (r.width < 3 || r.height < 3) { staleKeys.push(key); continue; }
        next[key] = { left: r.left - stageRect.left, top: r.top - stageRect.top, width: r.width, height: r.height };
      }
      if (staleKeys.length > 0) {
        setSelectedIds((prev) => prev.filter((sid) => !staleKeys.includes(sid.replace(/^cdl:/, ""))));
        setCdlSelectorMap((prev) => {
          const cleaned = { ...prev };
          for (const k of staleKeys) delete cleaned[k];
          return cleaned;
        });
      }
      setCdlClientBboxes(next);
    });
    return () => cancelAnimationFrame(raf);
    // diagram を依存に含める = 再 compile で text の位置 / 幅が変わった時に選択枠を追従させる
    // (含めないと label 編集後に古い bbox の枠が残る)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, transform, cdlSelectorMap, diagram]);
  const previewRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  // 2026-07-24 fix = finalize 時に clearLiveTransform を遅延実行するための ref。
  const pendingClearRef = useRef<string | null>(null);
  // drag 開始時の hoveredHandle.rect を save = drag 中 rect 追従計算の基準点
  const hoveredHandleInitRectRef = useRef<DOMRect | null>(null);
  // viewBoxCompensation は「勝手な移動」 で user 意図 (drop 位置ぴったり) を破壊するため削除。

  // ref 経由で state を読む (useEffect deps 頻繁変化で listener 再登録の性能問題 + stale closure 回避)
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);
  const overlayPartsRef = useRef(overlayParts);
  useEffect(() => { overlayPartsRef.current = overlayParts; }, [overlayParts]);

  // 2026-07-24 Miro 相当 keyboard shortcut (Task #88 + #91):
  //   Cmd+G / Ctrl+G           = group 作成
  //   Cmd+Shift+G              = ungroup
  //   Delete / Backspace       = selection 削除
  //   Cmd+A                    = 全 overlay select
  //   Cmd+D                    = duplicate (posX/Y に +30 offset で複製)
  //   Escape                   = selection clear
  //   矢印キー                 = 1px nudge (shift 併用で 10px)
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const ctrlOrCmd = e.metaKey || e.ctrlKey;
      // 入力 field 上では 発火しない (CodeMirror / input 等)
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || t.closest?.(".cm-content"))) return;
      // Escape = selection clear + context menu / color picker close
      if (e.key === "Escape") {
        setSelectedIds([]);
        setContextMenu(null);
        setColorPickerFor(null);
        return;
      }
      // Cmd+Z = Undo、 Cmd+Shift+Z (or Cmd+Y) = Redo (Feature 1)
      if (ctrlOrCmd && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) {
          const future = historyRef.current.future;
          if (future.length === 0) return;
          const next = future.pop()!;
          historyRef.current.past.push(lastCommittedSrcRef.current);
          lastCommittedSrcRef.current = next;
          setSrcSilent(next);
        } else {
          const past = historyRef.current.past;
          if (past.length === 0) return;
          const prev = past.pop()!;
          historyRef.current.future.push(lastCommittedSrcRef.current);
          lastCommittedSrcRef.current = prev;
          setSrcSilent(prev);
        }
        return;
      }
      // Cmd+C = clipboard に selection の overlay parts snapshot、 Cmd+V = paste (Feature 3)
      if (ctrlOrCmd && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        const overlayIds = selectedIdsRef.current.filter((s) => s.startsWith("overlay:")).map((s) => s.slice("overlay:".length));
        clipboardRef.current = overlayIds
          .map((oid) => overlayPartsRef.current.find((p) => p.id === oid))
          .filter((p): p is NonNullable<typeof p> => !!p)
          // 2026-07-26 CAR-2158 correctness fix = copy に rotate / bg も含める (paste で失われないように)
          .map((p) => ({ kind: p.kind, posX: p.posX, posY: p.posY, scale: p.scale, rotate: p.rotate, bg: p.bg }));
        return;
      }
      if (ctrlOrCmd && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        if (clipboardRef.current.length === 0) return;
        setSrc((prev) => {
          let next = prev;
          for (const clip of clipboardRef.current) {
            const newAlias = nextAvailableAlias(next, clip.kind.replace(/-/g, ""));
            const newLine = buildDuplicateLine(clip, newAlias);
            const appended = appendActorLine(next, newLine);
            if (appended !== null) next = appended;
          }
          return next;
        });
        return;
      }
      // Alt+{L/R/E/T/B/M/H/V} = alignment (Feature 6)
      if (e.altKey && ["l", "L", "r", "R", "e", "E", "t", "T", "b", "B", "m", "M", "h", "H", "v", "V"].includes(e.key)) {
        const overlayIds = selectedIdsRef.current.filter((s) => s.startsWith("overlay:")).map((s) => s.slice("overlay:".length));
        if (overlayIds.length < 2) return;
        e.preventDefault();
        const mode: AlignMode =
          e.key === "l" || e.key === "L" ? "left" :
          e.key === "r" || e.key === "R" ? "right" :
          e.key === "e" || e.key === "E" ? "center-h" :
          e.key === "t" || e.key === "T" ? "top" :
          e.key === "b" || e.key === "B" ? "bottom" :
          e.key === "m" || e.key === "M" ? "middle-v" :
          e.key === "h" || e.key === "H" ? "distribute-h" :
          "distribute-v";
        // 2026-07-26 CAR-2158 consistency fix = align 幅高を実測値から算出する。
        // 旧実装は width/height を 380 固定にしていたため、 実 shape が 380 でない parts (arc-gauge 等) で
        // right / center / bottom / distribute 系の揃え位置が実際の見た目とずれていた。
        // 実測 client bbox を world 単位 (pan.scale 除算) に戻し、 未測定なら 380 に fallback する。
        const panScaleForAlign = transformRef.current.scale || 1;
        const parts = overlayIds
          .map((oid) => overlayPartsRef.current.find((p) => p.id === oid))
          .filter((p): p is NonNullable<typeof p> => !!p)
          .map((p) => {
            const bbox = shapeClientBboxesRef.current[p.id];
            const safeScale = Math.abs(p.scale) > 0.001 ? p.scale : 1;
            if (!bbox) {
              // 未測定 = 従来の近似 (posX/posY を左上、 380px 四方) で計算する
              return { id: p.id, posX: p.posX, posY: p.posY, scale: p.scale, width: 380, height: 380 };
            }
            // 実測 client bbox を world に直して bounds として渡す。
            // rotate 済 parts では AABB の左上が posX / posY と一致しないため、
            // width / height からの逆算ではなく実 bounds を渡して delta 方式で揃える。
            const left = (bbox.left - transformRef.current.tx) / panScaleForAlign;
            const top = (bbox.top - transformRef.current.ty) / panScaleForAlign;
            const worldW = bbox.width / panScaleForAlign;
            const worldH = bbox.height / panScaleForAlign;
            return {
              id: p.id,
              posX: p.posX,
              posY: p.posY,
              scale: p.scale,
              width: worldW / safeScale,
              height: worldH / safeScale,
              bounds: { left, top, right: left + worldW, bottom: top + worldH },
            };
          });
        const result = alignOverlayParts(parts, mode);
        if (result.size === 0) return;
        setSrc((prev) => {
          let next = prev;
          for (const [id, pos] of result) {
            const p = overlayPartsRef.current.find((x) => x.id === id);
            if (p) next = writeOverlayPartToDsl(next, id, pos.posX, pos.posY, p.scale, p.rotate);
          }
          return next;
        });
        return;
      }
      // Cmd+] = bring forward (z-order 内で 1 個上)、 Cmd+[ = send backward (Feature 5)
      // 実装 = DSL 内の actor 行順序を上下入替 (下 = 前面、 上 = 背面 = SVG 描画順)
      if (ctrlOrCmd && (e.key === "]" || e.key === "[")) {
        e.preventDefault();
        const overlayIds = selectedIdsRef.current.filter((s) => s.startsWith("overlay:")).map((s) => s.slice("overlay:".length));
        if (overlayIds.length === 0) return;
        const forward = e.key === "]";
        setSrc((prev) => {
          const lines = prev.split("\n");
          const partsIndices = new Map<string, number>();
          lines.forEach((line, i) => {
            for (const oid of overlayIds) {
              if (new RegExp(`^\\s*-\\s*${oid}\\s*:`).test(line)) partsIndices.set(oid, i);
            }
          });
          const sorted = Array.from(partsIndices.entries()).sort((a, b) => forward ? b[1] - a[1] : a[1] - b[1]);
          for (const [_oid, idx] of sorted) {
            const swap = forward ? idx + 1 : idx - 1;
            if (swap < 0 || swap >= lines.length) continue;
            // 次/前 行も actor 行かチェック
            if (!/^\s*-\s*\S+?\s*:\s*\{/.test(lines[swap]!)) continue;
            [lines[idx], lines[swap]] = [lines[swap]!, lines[idx]!];
          }
          return lines.join("\n");
        });
        return;
      }
      // Delete / Backspace = selection 削除
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const overlayIdsToDelete = selectedIdsRef.current.filter((s) => s.startsWith("overlay:")).map((s) => s.slice("overlay:".length));
        if (overlayIdsToDelete.length === 0) return;
        setSrc((prev) => {
          let next = prev;
          for (const oid of overlayIdsToDelete) {
            // actor 行を丸ごと削除。 inner は greedy (.+) にする = nested brace (`state: { ... }`) を
            // 持つ行を `[^}]*` だと最初の `}` で打ち切って消せない (CAR-2158 で同種の bug を修正済)。
            const re = new RegExp(`^\\s*-\\s*${oid.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s*:\\s*\\{.+\\}\\s*\\n`, "m");
            next = next.replace(re, "");
          }
          return next;
        });
        setSelectedIds([]);
        return;
      }
      if (ctrlOrCmd && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        // 全 overlay select
        setSelectedIds(overlayPartsRef.current.map((p) => `overlay:${p.id}`));
        return;
      }
      if (ctrlOrCmd && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        const overlayIdsToDupe = selectedIdsRef.current.filter((s) => s.startsWith("overlay:")).map((s) => s.slice("overlay:".length));
        if (overlayIdsToDupe.length === 0) return;
        setSrc((prev) => {
          let next = prev;
          for (const oid of overlayIdsToDupe) {
            const orig = overlayPartsRef.current.find((p) => p.id === oid);
            if (!orig) continue;
            const newAlias = nextAvailableAlias(next, aliasBaseName(oid));
            const newLine = buildDuplicateLine(orig, newAlias);
            const appended = appendActorLine(next, newLine);
            if (appended !== null) next = appended;
          }
          return next;
        });
        return;
      }
      // 矢印キー nudge (selection がある場合)
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        const overlayIdsToNudge = selectedIdsRef.current.filter((s) => s.startsWith("overlay:")).map((s) => s.slice("overlay:".length));
        if (overlayIdsToNudge.length === 0) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        // 2026-07-26 CAR-2158 correctness fix = nudge 後に DSL へ書き出す。
        // 旧実装は overlayParts state のみ更新していたため、 reload / 再 compile で nudge 分が消えていた
        // (drag / resize は mouseup で writeOverlayPartToDsl を呼ぶが nudge には同経路がなかった)。
        //
        // 座標の累積は必ず前回値からの相対で行う。
        //
        // ref (useEffect mirror) から読むと、 キーリピートで同一 commit 内に複数 keydown が入った時に
        // 全て同じ古い base から計算してしまう (5 連打で 50px 進むべきところ 10px になる)。
        // かといって setOverlayParts の updater 内で集めた値を setSrc に渡すのも成立しない
        // = updater の実行順は render 時で、 setSrc の updater が先に評価されうるため空になる。
        //
        // そこで「累積 delta」 を同期 ref で持ち、 state と DSL の双方をその delta から導く。
        // ref の更新は同期なので、 同一 commit 内の連打でも押下回数分が正しく積算される。
        for (const id of overlayIdsToNudge) {
          if (!nudgeBaseRef.current.has(id)) {
            const cur = overlayPartsRef.current.find((p) => p.id === id);
            if (!cur) continue;
            nudgeBaseRef.current.set(id, { posX: cur.posX, posY: cur.posY, scale: cur.scale, rotate: cur.rotate });
          }
          const prevDelta = nudgeAccumRef.current.get(id) ?? { dx: 0, dy: 0 };
          nudgeAccumRef.current.set(id, { dx: prevDelta.dx + dx, dy: prevDelta.dy + dy });
        }
        setOverlayParts((prev) => prev.map((p) => {
          if (!overlayIdsToNudge.includes(p.id)) return p;
          return { ...p, posX: p.posX + dx, posY: p.posY + dy };
        }));
        setSrc((prevSrc) => {
          let out = prevSrc;
          for (const id of overlayIdsToNudge) {
            const base = nudgeBaseRef.current.get(id);
            const accum = nudgeAccumRef.current.get(id);
            if (!base || !accum) continue;
            out = writeOverlayPartToDsl(out, id, base.posX + accum.dx, base.posY + accum.dy, base.scale, base.rotate);
          }
          return out;
        });
        return;
      }
      if (ctrlOrCmd && (e.key === "g" || e.key === "G")) {
        e.preventDefault();
        if (e.shiftKey) {
          setGroups((prev) => {
            const next: Record<string, string[]> = { ...prev };
            for (const sid of selectedIdsRef.current) {
              if (sid.startsWith("group:")) {
                const gid = sid.slice("group:".length);
                delete next[gid];
              }
            }
            return next;
          });
          setSelectedIds((prev) => prev.filter((s) => !s.startsWith("group:")));
        } else {
          if (selectedIdsRef.current.length < 2) return;
          const members = selectedIdsRef.current.filter((s) => !s.startsWith("group:"));
          if (members.length < 2) return;
          const gid = `g${Date.now().toString(36)}`;
          setGroups((prev) => ({ ...prev, [gid]: members }));
          setSelectedIds([`group:${gid}`]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // ref 経由で state 参照 = deps 空で 1 回だけ register (性能 + stale closure 両方対策)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2026-07-24 fix = pending clearLiveTransform を diagram 更新後に実行 (snap back gap 解消)
  useEffect(() => {
    const pending = pendingClearRef.current;
    if (!pending) return;
    pendingClearRef.current = null;
    // rAF 2 段 = React commit → paint → rAF1 = DOM 反映後 → rAF2 = paint 完了後
    // paint 完了前に CSS 消すと snap back 見える。 2 frame 待って新 SVG が完全描画されてから消す。
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        clearLiveTransform(pending);
      });
      pendingClearRef.current = null;
      void raf2;
    });
    return () => cancelAnimationFrame(raf1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagram]);

  /**
   * viewBox 固定 (2026-07-24 fix、 user feedback「画面全体 pan する」「矢印変形」 の core fix)。
   *
   * cdl auto-fit viewBox = content bounding box を毎 render 再計算 → user が achievement を drag すると
   * trophy world 座標が変わり viewBox が拡大 → 全 content が client px で縮小 → Client / API / DB / arrow
   * 全部 shrink して「画面全体が pan / 変形」 に見える root cause。
   *
   * fix = 初回 render 時 viewBox を capture、 以後 render で svg.viewBox を強制 override して固定。
   * achievement drag → posX/posY 書出し → cdl re-compile → CdlDiagramView が新 viewBox 生成しても、
   * この useEffect が override して初回値に戻す = 全 lane / arrow の client px 位置が完全 static。
   *
   * trade-off = achievement を viewBox 外に drag すると clip される (spec 上意図的、 user が pan/zoom で
   * 追跡可能)。 sample 切替時は viewBox 再取得が必要なので initialViewBoxRef を activeSample deps でリセット。
   */
  // 2026-07-24 architectural refactor で freeze useEffect / captureFrozenState / frozen*Ref 全削除。
  // parts を cdl DSL から切離して独立 overlay 化したため、 cdl SVG は base のみ描画 =
  // achievement drop/drag で cdl re-compile が発火しない = viewBox / edge / text の auto-adjust が起きない。
  // よって MutationObserver 経由の DOM override 経路は原理的に不要になった。 freeze による副作用 (未完成
  // path capture / z-order 強制移動 / DOM 上書き) も同時に消える = クリーンな architecture 実現。
  // pin machinery も同 architecture で不要 (cdl は base しか見ない → parts drop で lane 位置変化なし)。

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
          // CAR-1947 Round 2 F5 refinement = parts marker 経路でも HTML canvas mode 時は laid SSOT を更新。
          // これで parts-only diagram 切替時に子側が旧 lane を表示する false positive を防止。
          const laidPart = compile(part);
          setDiagram(part);
          if (useHtmlCanvas) setLaid(laidPart);
          setError(null);
          try {
            const report = visualValidate(part);
            setWarnings(report.violations.filter((v) => !HIDDEN_WARNING_AXES.has(v.axis)));
          } catch {
            setWarnings([]);
          }
          return;
        }
        // 2026-07-24 architectural refactor = parts を cdl から切離して独立 overlay で管理。
        // extractPartsFromSrc で src から parts 行を除いた baseSrc を作り、 cdl には base のみ渡す。
        // 抽出した parts は overlayParts state に set、 独立 SVG overlay として描画する。
        const { baseSrc, parts } = extractPartsFromSrc(src, partsCatalog, partsItems);
        setOverlayParts(parts);
        const d = textDslToDiagram(baseSrc, { partsCatalog });
        // compile を pre-check して validate/layout の throw を CdlDiagramView 描画前に捕捉する。
        // CAR-1947 Round 2 F5 = HTML canvas mode 時は compile 結果 (LaidDiagram) を SSOT として保持、
        // 子側の重複 compile を排除。 SVG mode 時は compile 結果を捨てて既存挙動維持 (setLaid 呼ばず)。
        const laidResult = compile(d);
        setDiagram(d);
        if (useHtmlCanvas) setLaid(laidResult);
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

  // 初回 diagram load 時のみ自動 Fit、 以降の diagram 変化 (drag / resize / drop) では
  // viewport 維持 = user 編集動作が正しく viewport に反映される (拡大したら拡大される)。
  // = user 目視 bug 「拡大したら図がぐっちゃぐちゃ = auto fit で全体縮小」 の root fix。
  // sample 切替 (activeSample 変化) では明示的に fit 再実行、 それ以外は user 編集動作を尊重。
  const initialFitDoneRef = useRef(false);
  useEffect(() => {
    if (!diagram || !previewRef.current) return;
    let cancelled = false;
    let lastFitAt = 0;
    const runFit = () => {
      if (cancelled) return;
      const now = Date.now();
      if (now - lastFitAt < 50) return;
      lastFitAt = now;
      handleFit();
      initialFitDoneRef.current = true;
    };
    // 初回 diagram load or sample 切替時のみ fit、 以降の diagram 変化 (drag / resize / drop) は skip
    if (!initialFitDoneRef.current) {
      const r1 = window.requestAnimationFrame(() => {
        if (cancelled) return;
        window.requestAnimationFrame(runFit);
      });
      const t1 = window.setTimeout(runFit, 100);
      const t2 = window.setTimeout(runFit, 400);
      // stage リサイズ (window resize / sidebar 折畳) でも fit する (viewport 追随)
      const ro = new ResizeObserver(() => {
        if (initialFitDoneRef.current) return; // 初回 fit 後は stage リサイズでも fit しない
        runFit();
      });
      ro.observe(previewRef.current);
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(r1);
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        ro.disconnect();
      };
    }
    return () => { cancelled = true; };
  }, [diagram, handleFit]);
  // activeSample 変化 (sample 切替) 時に initialFitDoneRef をリセットして次 diagram load で fit
  useEffect(() => {
    initialFitDoneRef.current = false;
  }, [activeSample]);

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
  // zoom / pan 変更時に hoveredHandle.rect を re-query (transform 変更で図が scale されるが outline は
  // client px absolute で pan/scale の外側に描画されるため、 rect が古いままだと図と outline が乖離する
  // = user 目視 bug 「点線の四角の囲いは拡大しない」 の root fix)。 rect 変化が閾値以上なら update、
  // 微小変化 (float 誤差) は無視して無限 loop 回避。
  useEffect(() => {
    if (!hoveredHandle || !previewRef.current) return;
    // parts 用の union bbox 経路 = elementSelector が prefix match `^=` 形式なら全 sub-node の union
    const isPartsPrefixSelector = hoveredHandle.elementSelector.includes('^="');
    let rect: DOMRect;
    if (isPartsPrefixSelector) {
      const els = previewRef.current.querySelectorAll(hoveredHandle.elementSelector);
      if (els.length === 0) return;
      let minL = Infinity, minT = Infinity, maxR = -Infinity, maxB = -Infinity;
      for (const el of Array.from(els)) {
        const r = (el as SVGGraphicsElement).getBoundingClientRect();
        if (r.left < minL) minL = r.left;
        if (r.top < minT) minT = r.top;
        if (r.right > maxR) maxR = r.right;
        if (r.bottom > maxB) maxB = r.bottom;
      }
      rect = new DOMRect(minL, minT, maxR - minL, maxB - minT);
    } else {
      const el = previewRef.current.querySelector(hoveredHandle.elementSelector) as SVGGraphicsElement | null;
      if (!el) return;
      rect = el.getBoundingClientRect();
    }
    const old = hoveredHandle.rect;
    const diff = Math.abs(rect.left - old.left) + Math.abs(rect.top - old.top) + Math.abs(rect.width - old.width) + Math.abs(rect.height - old.height);
    if (diff > 0.5) {
      setHoveredHandle({ ...hoveredHandle, rect });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transform.scale, transform.tx, transform.ty]);
  // activeGuidelines state 削除 (guideline 機能全撤去)

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
        // sub-node init 座標が DSL 未書出しなら hover 中 rect の SVG 座標系変換で拾う。
        // initW / initH は必ず SVG world 単位で計測する (client px → world 変換必須)、
        // client 単位のまま書出すと zoom 縮小で actor.posW が client 74px 相当の小 world 値 (~370)
        // になり compile 側で parts が縮小されて描画される bug (I2-forensic の Phase 4 検出済)。
        let initX = cur?.posX;
        let initY = cur?.posY;
        let initW = cur?.posW;
        let initH = cur?.posH;
        {
          const rect = hoveredHandle.rect;
          const tlPt = clientToSvg(svg, rect.left, rect.top);
          const brPt = clientToSvg(svg, rect.right, rect.bottom);
          const wSvg = brPt.x - tlPt.x;
          const hSvg = brPt.y - tlPt.y;
          if (initX === undefined || initY === undefined) {
            initX = tlPt.x + wSvg / 2;
            initY = tlPt.y + hSvg / 2;
          }
          // initW / initH は DSL 未書出しなら world 単位の hover rect size を使う
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

    const actorNamesForHit = extractAllActorNames(src);
    const dragInfo = findDragTarget(target, actorNamesForHit);
    // parts は overlay drop 経路 (React state 独立管理) で drag するため cdl SVG hit fallback は不要。
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
    // drag 開始時の hoveredHandle.rect を save = drag 中選択枠の追従計算基準
    if (hoveredHandle) {
      hoveredHandleInitRectRef.current = new DOMRect(hoveredHandle.rect.left, hoveredHandle.rect.top, hoveredHandle.rect.width, hoveredHandle.rect.height);
    }
    document.body.style.cursor = "grabbing";
    return true;
  };

  // 2026-07-25 Phase 4 = cdl 要素 stage-level selection UI から drag / resize を発火。
  // 既存 elementDrag 経路を再利用、 selector map から実 SVG element を find して synthetic hoveredHandle を組立てる。
  const startCdlHandleAction = (
    e: React.MouseEvent<HTMLDivElement>,
    key: string,
    mode: "drag" | "resize",
    corner?: "nw" | "ne" | "sw" | "se",
  ): void => {
    e.stopPropagation();
    e.preventDefault();
    const selector = cdlSelectorMap[key];
    if (!selector || !previewRef.current) return;
    const svg = previewRef.current.querySelector("svg") as SVGSVGElement | null;
    const el = previewRef.current.querySelector(selector) as SVGGraphicsElement | null;
    if (!svg || !el || typeof el.getBoundingClientRect !== "function") return;
    const rect = el.getBoundingClientRect();
    const svgPt = clientToSvg(svg, e.clientX, e.clientY);
    const cur = extractActorPosition(src, key);
    let initX = cur?.posX;
    let initY = cur?.posY;
    let initW = cur?.posW;
    let initH = cur?.posH;
    const tlPt = clientToSvg(svg, rect.left, rect.top);
    const brPt = clientToSvg(svg, rect.right, rect.bottom);
    const wSvg = brPt.x - tlPt.x;
    const hSvg = brPt.y - tlPt.y;
    if (initX === undefined || initY === undefined) {
      initX = tlPt.x;
      initY = tlPt.y;
    }
    initW = initW ?? wSvg;
    initH = initH ?? hSvg;
    elementDrag.current = {
      mode,
      targetName: key,
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
      hoveredSelector: selector,
      subNodeKey: undefined,
    };
    hoveredHandleInitRectRef.current = new DOMRect(rect.left, rect.top, rect.width, rect.height);
    document.body.style.cursor = mode === "resize" && corner ? cornerToCursor(corner) : "grabbing";
  };
  const startCdlDrag = (e: React.MouseEvent<HTMLDivElement>, key: string): void => {
    startCdlHandleAction(e, key, "drag");
  };
  const startCdlResize = (e: React.MouseEvent<HTMLDivElement>, key: string, corner: "nw" | "ne" | "sw" | "se"): void => {
    startCdlHandleAction(e, key, "resize", corner);
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
      // 2026-07-24 fix (user 明示要求「勝手に移動する機能全部削除」) = auto-adjust + guideline を drag
      // 中に呼ばない。 元 impl は他 preset element を transient shift + 整列補助線発火だったが、
      // user 意図「Miro / Google スライド相当 = 個別独立要素、 auto 補正なし」 に反するため経路削除。
      // 併せて hoveredHandle.rect を drag delta 分 shift = 選択枠が trophy 追従 (「枠が追いつかない」 fix)。
      if (hoveredHandle) {
        const svgScale = st.svgScale || 1;
        const clientDx = (newX - st.initPosX) * svgScale;
        const clientDy = (newY - st.initPosY) * svgScale;
        const initRect = hoveredHandleInitRectRef.current;
        if (initRect) {
          setHoveredHandle((prev) => prev ? { ...prev, rect: new DOMRect(initRect.left + clientDx, initRect.top + clientDy, initRect.width, initRect.height) } : prev);
        }
      }
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
      // architectural refactor で pin loop 削除 = 対象 actor の posX/Y のみ更新。
      setSrc((prev) => updateActorPosition(prev, st.targetName, newX, newY, st.initPosW, st.initPosH));
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
    // 2026-07-24 fix (user 苦情「離すと一瞬元位置に戻る」 対応) = live CSS transform を即 clear せず、
    // setSrc → 300ms debounce → cdl re-compile → SVG 反映 完了後 (diagram useEffect) に clear する。
    // 元 impl は finalize で即 clearLiveTransform し、 DSL 反映まで 300ms 空白時間で trophy が元位置に
    // snap back 見える bug 発生。 pendingClearRef に target 名を保持、 diagram 更新 useEffect で clear。
    pendingClearRef.current = st.targetName;
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

  // 2026-07-24 全削除 = applyAutoAdjustDuringDrag / applyGuidelinesDuringDrag / clearAutoAdjustShifts
  // (auto 補正 / 補助線 / shift clear) 3 関数を削除。 user 「勝手な移動全部削除」 の core、 呼出経路 +
  // 定義本体を根絶する。 canvas-pivot-auto-adjust / canvas-pivot-guideline lib への依存も削除済。

  // 2026-07-25 double click text 編集 = SVG <text> を狙って click したら inline HTML input を開く。
  const handleStageDoubleClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    let el = e.target as SVGElement | HTMLElement | null;
    // nearest text 要素を辿る (child tspan / foreignObject 対応)
    while (el && el !== previewRef.current && el.tagName !== "text") el = el.parentElement as HTMLElement | null;
    if (!el || el.tagName !== "text" || !previewRef.current) return;
    const stageRect = previewRef.current.getBoundingClientRect();
    const rect = (el as unknown as SVGGraphicsElement).getBoundingClientRect();
    const original = (el.textContent ?? "").trim();
    if (!original) return;
    const fontSize = parseFloat(window.getComputedStyle(el as unknown as HTMLElement).fontSize) || 14;
    setTextEditing({
      originalText: original,
      bbox: { left: rect.left - stageRect.left, top: rect.top - stageRect.top, width: Math.max(80, rect.width + 20), height: Math.max(24, rect.height + 8) },
      fontSize,
    });
    e.stopPropagation();
  };
  const commitTextEdit = (newText: string): void => {
    if (!textEditing) return;
    const original = textEditing.originalText;
    setTextEditing(null);
    // 2026-07-25 text 編集 DSL 精緻化 (CAR-2139 scope-out fix)
    // 重複 text (Client が 4 箇所等) の全置換副作用を回避、 field scope 別に 1 箇所置換を試みる。
    // SSOT = src/lib/text-edit-replace.ts (pure helper、 8 unit test)
    setSrc((prev) => replaceTextInDsl(prev, original, newText));
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // toolbar クリックは pan させない
    if ((e.target as HTMLElement).closest(".cdl-editor-zoom-toolbar")) return;
    // mouse 操作が入ると座標が nudge 以外の経路で変わるため、 nudge の累積 base を破棄する
    nudgeBaseRef.current.clear();
    nudgeAccumRef.current.clear();
    // context menu / color picker 表示中の click は close
    if (contextMenu) setContextMenu(null);
    if (colorPickerFor) setColorPickerFor(null);
    // cdl element selection = hover 中の element があれば selection state を更新する。
    // 2026-07-26 CAR-2158 fix = 旧実装は startElementInteraction(e) が true の時だけ selection したが、
    // arrow label 等 findDragTarget が actor 名を解決できない element では false になり選択不能だった。
    const applyCdlSelection = (): void => {
      if (!hoveredHandle) return;
      const selId = `cdl:${hoveredHandle.id}`;
      // selector を保存 = stage-level UI の bbox 再測定で使う
      setCdlSelectorMap((prev) => ({ ...prev, [hoveredHandle.id]: hoveredHandle.elementSelector }));
      if (e.shiftKey || e.metaKey) {
        setSelectedIds((prev) => prev.includes(selId) ? prev.filter((x) => x !== selId) : [...prev, selId]);
      } else {
        setSelectedIds([selId]);
      }
    };
    // 2026-07-26 CAR-2158 fix = hoveredHandle の有無ではなく e.target を再 hit-test して判定する。
    //
    // 旧実装は hoveredHandle があれば無条件に selection して return していた。 hover state は
    // element から 100px 離れるまで保持される (handleMouseMove の buffer) ため、 element 近傍の背景を
    // click しても旧 element を再選択して return し、 背景 click による選択解除と rubber band が
    // 起動しなくなっていた (codex review で再現条件を実測)。
    const targetEl = e.target as Element | null;
    const onCdlElement = !!targetEl && !!targetEl.closest?.("svg") &&
      (targetEl.tagName === "text" || !!targetEl.closest?.("[data-cdl-node], [data-cdl-lane], [data-cdl-edge]"));
    if (onCdlElement) {
      // 2026-07-26 CAR-2158 fix = cdl 要素の実 drag / resize は起動しない。
      //
      // Phase 4 revert (4523bf9) で「cdl の drag/resize は CAR-2156 の core 再設計まで無効」 と決めたが、
      // 実際は selection UI を pointerEvents: none にしただけで、 stage の hit-test から
      // startElementInteraction → elementDrag → updateActorPosition の DSL 書換経路が生きていた。
      // つまり SVG node 本体を drag すれば撤去したはずの actor 分裂 / 順序入替を再発できる状態だった。
      // ここで interaction を起動せず selection のみ行うことで、 撤去の意図を実装として成立させる。
      applyCdlSelection();
      return;
    }
    // 背景 click = stale hover を明示 clear してから通常経路 (選択解除 / rubber band) へ進む
    if (hoveredHandle) setHoveredHandle(null);
    // 背景 mousedown = rubber band 選択開始 (Miro 相当)。 shift 押下併用時は selection 保持。
    // space+drag / middle button = pan mode (rubber band と分離、 後日実装)。 現状 通常 drag は rubber band。
    if (!e.shiftKey && !e.metaKey) setSelectedIds([]);
    setRubberBand({ sx: e.clientX, sy: e.clientY, cx: e.clientX, cy: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    // 2026-07-24 overlay parts drag = React state 更新のみ (setSrc せず即時反映、 real-time UX)。
    // scale で client delta を world delta に変換、 overlayParts[id].posX/Y を直接更新 = ラグゼロ。
    // Step 3 (multi drag) = drag ref に multi selection の全 overlay start pos を保持 (下 handleMouseDown 参照)
    if (overlayDragRef.current) {
      const { id, startPosX, startPosY, startClientX, startClientY } = overlayDragRef.current;
      const panScale = transformRef.current.scale || 1;
      let dx = (e.clientX - startClientX) / panScale;
      let dy = (e.clientY - startClientY) / panScale;
      // 2026-07-24 snap to grid (Task #93) = shift 押下で無効、 通常時は 20px grid に snap。
      // primary target の新 pos が grid 交点になるように delta を丸める → 全 member 同 delta 適用で相対 pos 保持。
      const GRID = 20;
      if (!e.shiftKey) {
        const targetX = Math.round((startPosX + dx) / GRID) * GRID;
        const targetY = Math.round((startPosY + dy) / GRID) * GRID;
        dx = targetX - startPosX;
        dy = targetY - startPosY;
      }
      const selectedOverlayIds = new Set(
        selectedIds.filter((s) => s.startsWith("overlay:")).map((s) => s.slice("overlay:".length)),
      );
      const groupStartsRef = multiDragStartsRef.current;
      setOverlayParts((prev) =>
        prev.map((p) => {
          if (p.id === id) return { ...p, posX: startPosX + dx, posY: startPosY + dy };
          if (groupStartsRef && groupStartsRef.has(p.id) && selectedOverlayIds.has(p.id)) {
            const s = groupStartsRef.get(p.id)!;
            return { ...p, posX: s.x + dx, posY: s.y + dy };
          }
          return p;
        }),
      );
      return;
    }
    // overlay rotate = Alt + corner drag、 center 基準の angle 差で rotate 更新 (Feature 7)
    if (overlayRotateRef.current) {
      const st = overlayRotateRef.current;
      const currentAngle = Math.atan2(e.clientY - st.centerClientY, e.clientX - st.centerClientX);
      const deltaDeg = ((currentAngle - st.startAngleRad) * 180) / Math.PI;
      const newRotate = st.startRotate + deltaDeg;
      setOverlayParts((prev) => prev.map((p) => p.id === st.id ? { ...p, rotate: newRotate } : p));
      return;
    }
    // overlay parts resize = corner drag で uniform scale + opposite corner を client 座標で invariant に。
    // Miro/Figma 挙動 = SE drag → NW 固定 / NW drag → SE 固定 / NE drag → SW 固定 / SW drag → NE 固定。
    // shape offset in div は scale 倍されるため posX/posY を単純に足し引きすると shape 全体が動く。
    // anchor client 座標 (stage-local) を invariant 化する posX/posY を毎 frame 逆算する。
    if (overlayResizeRef.current) {
      const st = overlayResizeRef.current;
      const dxClient = e.clientX - st.startClientX;
      const dyClient = e.clientY - st.startClientY;
      const signX = st.corner === "ne" || st.corner === "se" ? 1 : -1;
      const signY = st.corner === "sw" || st.corner === "se" ? 1 : -1;
      const deltaW = dxClient * signX;
      const deltaH = dyClient * signY;
      const deltaMax = Math.max(deltaW, deltaH);
      const newClientW = Math.max(20, st.startClientW + deltaMax);
      const scaleRatio = newClientW / st.startClientW;
      const newScale = Math.max(0.1, st.startScale * scaleRatio);
      // anchor = drag corner の対角、 stage-local client 座標
      let anchorClientX = st.startBboxLeft;
      let anchorClientY = st.startBboxTop;
      if (st.corner === "nw") { anchorClientX += st.startClientW; anchorClientY += st.startClientH; }
      else if (st.corner === "ne") { anchorClientY += st.startClientH; }
      else if (st.corner === "sw") { anchorClientX += st.startClientW; }
      // stage-local client → world 変換 = (client - panTx) / panScale (pan container transform 逆変換)
      const anchorWorldX = (anchorClientX - st.panTx) / st.panScale;
      const anchorWorldY = (anchorClientY - st.panTy) / st.panScale;
      // shape-local raw offset (unscaled world unit) = anchor が div 原点から見た元 shape 座標
      const anchorRawOffsetX = (anchorWorldX - st.startPosX) / st.startScale;
      const anchorRawOffsetY = (anchorWorldY - st.startPosY) / st.startScale;
      // 新 scale で anchor client 座標を invariant に保つ posX/posY を逆算
      const newPosX = anchorWorldX - anchorRawOffsetX * newScale;
      const newPosY = anchorWorldY - anchorRawOffsetY * newScale;
      setOverlayParts((prev) => prev.map((p) => (p.id === st.id ? { ...p, scale: newScale, posX: newPosX, posY: newPosY } : p)));
      return;
    }
    // element drag / resize 中は pan せず interaction pass に流す
    if (updateElementInteraction(e)) return;
    // zoom toolbar / share / export 等の UI 上 mouse.move は hover 状態を保持 (I3 forensic fix)。
    // toolbar 上 mouse.move で hoveredHandle が rect 外 buffer 判定で null 化すると zoom 直後に
    // outline が消える bug になる。 UI element は data-preserve-hover attribute or 特定 class で判定。
    const targetEl = e.target as HTMLElement;
    if (targetEl.closest?.(".cdl-editor-zoom-toolbar, .v4-editor-bar, .v4-editor-side, .v4-editor-code")) return;
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
      const actorNamesForHover = extractAllActorNames(src);
      const dragInfo = findDragTarget(target, actorNamesForHover);
      // parts hover fallback は overlay 化で不要 (parts は cdl SVG 外の別 div、 hover は onMouseEnter で個別処理)
      // 2026-07-24 fix (user 苦情「1つずつをパーツとしても扱って」 対応) = data-cdl-* 未紐付きの text 要素
      // (arrow label 等) を独立 hover target として扱う fallback。 label の親 group に data-cdl-edge が
      // 付いていない cdl 側 SVG 構造への 対応。
      if (!dragInfo && target.tagName === "text") {
        const textRect = (target as SVGGraphicsElement).getBoundingClientRect();
        if (textRect.width > 0 && textRect.height > 0) {
          // 2026-07-26 CAR-2158 fix = 旧実装は elementSelector: "" で、 selection UI の bbox 再測定
          // useEffect が空 selector を skip して handle 描画 0 件になっていた (arrow label が選択不能)。
          // text element に data attribute を刻んで一意 selector を確立する (nth-of-type は
          // parent 内 index のため stage 全体走査の index と一致せず不採用)。
          let textKey = target.getAttribute("data-editor-text-key");
          if (!textKey) {
            textKey = `t${textKeySeqRef.current++}`;
            target.setAttribute("data-editor-text-key", textKey);
          }
          const elementSelector = `[data-editor-text-key="${textKey}"]`;
          // selection ID も textKey ベースにする。 text 内容 (先頭 32 文字) を ID にすると、
          // 同一文言の label が複数ある図で ID が衝突し、 shift+click が 2 要素選択ではなく
          // 同一 ID の toggle になって selector も相互に上書きされていた。
          const id = `text:${textKey}`;
          setHoveredHandle({ id, elementSelector, rect: textRect, subNodeKey: undefined });
          return;
        }
      }
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
        // parts sub-node 判定 = data-cdl-node id が `{alias}__{subId}` 形式 (CAR-1657 unified syntax、
        // parts merge 経路で prefix された node) の場合、 hover rect と elementSelector を
        // parts 全 sub-node の union に置換 = user が hover した時に parts 全体が「1 unit」 として
        // 点線 outline + 4 隅 handle で示される (Miro 相当の UX)。 sub-node 個別を掴む挙動は禁止、
        // 一体として drag / resize する仕様。
        let rect: DOMRect | null = cur ? (cur as Element).getBoundingClientRect() : null;
        const nodeIdForCur = cur?.getAttribute?.("data-cdl-node") ?? "";
        const isPartsSubNode = nodeIdForCur.includes("__");
        if (isPartsSubNode && previewRef.current) {
          const alias = nodeIdForCur.split("__")[0]!;
          const partsEls = previewRef.current.querySelectorAll(`[data-cdl-node^="${alias}__"]`);
          if (partsEls.length > 0) {
            // 2026-07-24 fix (user 苦情「囲いおかしい」 対応) = shape element (circle / rect / path /
            // ellipse) のみ union bbox 対象、 text (title / subtitle) は除外して tight fit する。
            // 元 impl は group 全体の getBoundingClientRect で text 領域も含めて上下延び bug。
            let minL = Infinity, minT = Infinity, maxR = -Infinity, maxB = -Infinity;
            for (const el of Array.from(partsEls)) {
              const shapes = (el as Element).querySelectorAll("circle, rect, path, ellipse, polygon");
              const targets = shapes.length > 0 ? Array.from(shapes) : [el];
              for (const s of targets) {
                const r = (s as SVGGraphicsElement).getBoundingClientRect();
                if (r.width <= 0 || r.height <= 0) continue;
                if (r.left < minL) minL = r.left;
                if (r.top < minT) minT = r.top;
                if (r.right > maxR) maxR = r.right;
                if (r.bottom > maxB) maxB = r.bottom;
              }
            }
            if (minL !== Infinity) {
              rect = new DOMRect(minL, minT, maxR - minL, maxB - minT);
              elementSelector = `[data-cdl-node^="${alias}__"]`;
            }
          }
        }
        if (rect && elementSelector) {
          // parts (isPartsSubNode) なら subNodeKey を undefined に強制 = actor 全体経路
          // (updateActorPosition で actor.posX/posY/posW/posH 書出し、 compile 側で parts 全 sub-node に scale 反映)
          if (isPartsSubNode) {
            dragInfo.subNodeKey = undefined;
          }
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
        // element 外に mouse が出ても hoveredHandle は維持 (I3 fix、 zoom button 移動時の軌跡で
        // preview 内空き area 通過しても outline 消えない大 buffer 経路)。 100 px buffer で
        // user が明示的に別 element hover しない限り hover 維持する Miro 相当の粘着 UX。
        const r = hoveredHandle.rect;
        const buffer = 100;
        if (e.clientX < r.left - buffer || e.clientX > r.right + buffer || e.clientY < r.top - buffer || e.clientY > r.bottom + buffer) {
          setHoveredHandle(null);
        }
      }
    }
    if (rubberBand) {
      setRubberBand({ ...rubberBand, cx: e.clientX, cy: e.clientY });
      return;
    }
    if (!dragging) return;
    setTransform((t) => ({
      ...t,
      tx: dragStart.current.tx + (e.clientX - dragStart.current.x),
      ty: dragStart.current.ty + (e.clientY - dragStart.current.y),
    }));
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>): void => {
    // 2026-07-24 overlay parts drag finalize = 現 overlayParts state から新 posX/Y を DSL に書出す。
    // drag 中は setSrc せず state 直接更新なので snap back なし、 mouseup で 1 回だけ DSL sync。
    // multi drag = groupStartsRef に含まれる 全 overlay 分を 1 setSrc で reduce sync。
    if (overlayDragRef.current) {
      const { id } = overlayDragRef.current;
      const groupStarts = multiDragStartsRef.current;
      overlayDragRef.current = null;
      multiDragStartsRef.current = null;
      document.body.style.cursor = "";
      setSrc((prev) => {
        let next = prev;
        // primary drag target を先に書出し
        const primary = overlayParts.find((p) => p.id === id);
        if (primary) next = writeOverlayPartToDsl(next, id, primary.posX, primary.posY, primary.scale, primary.rotate);
        // multi drag = selection の全 overlay も同 setSrc 内で 順次書出し
        if (groupStarts) {
          for (const [oid] of groupStarts) {
            if (oid === id) continue;
            const p = overlayParts.find((x) => x.id === oid);
            if (p) next = writeOverlayPartToDsl(next, oid, p.posX, p.posY, p.scale, p.rotate);
          }
        }
        return next;
      });
      return;
    }
    // overlay rotate finalize (Feature 7)
    if (overlayRotateRef.current) {
      const { id } = overlayRotateRef.current;
      overlayRotateRef.current = null;
      document.body.style.cursor = "";
      const part = overlayParts.find((p) => p.id === id);
      if (part) {
        setSrc((prev) => writeOverlayPartToDsl(prev, id, part.posX, part.posY, part.scale, part.rotate));
      }
      return;
    }
    // overlay parts resize finalize = 現 scale + posX/Y を DSL に書出す。
    if (overlayResizeRef.current) {
      const { id } = overlayResizeRef.current;
      overlayResizeRef.current = null;
      document.body.style.cursor = "";
      const part = overlayParts.find((p) => p.id === id);
      if (part) {
        setSrc((prev) => writeOverlayPartToDsl(prev, id, part.posX, part.posY, part.scale));
      }
      return;
    }
    if (rubberBand) {
      const rect = {
        left: Math.min(rubberBand.sx, rubberBand.cx),
        top: Math.min(rubberBand.sy, rubberBand.cy),
        right: Math.max(rubberBand.sx, rubberBand.cx),
        bottom: Math.max(rubberBand.sy, rubberBand.cy),
      };
      const isClickOnly = Math.abs(rect.right - rect.left) < 5 && Math.abs(rect.bottom - rect.top) < 5;
      if (!isClickOnly && previewRef.current) {
        // overlay parts の client bbox が rect と重なる parts を selection に追加
        const overlayEls = previewRef.current.querySelectorAll("[data-overlay-part]");
        const additions: string[] = [];
        overlayEls.forEach((el) => {
          const id = el.getAttribute("data-overlay-part") || "";
          if (!id) return;
          const r = (el as HTMLElement).getBoundingClientRect();
          const intersects = r.left < rect.right && r.right > rect.left && r.top < rect.bottom && r.bottom > rect.top;
          if (intersects) additions.push(`overlay:${id}`);
        });
        if (additions.length > 0) {
          setSelectedIds((prev) => Array.from(new Set([...prev, ...additions])));
        }
      }
      setRubberBand(null);
      return;
    }
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
    // parts drop 位置 fix (D1 forensic 対応) = drop 座標を SVG viewBox に変換し posX/posY 明示。
    // compile 側 (mergePartIntoDiagram) が offsetX/Y として parts の lane / node に反映、 drop 位置
    // に parts が中心配置される。 座標変換 = clientToSvg (getCTM inverse) で client → SVG world unit。
    // getScreenCTM null (SVG 非表示 / detached) 時は toWorldOrNull が null を返す = posX/posY を書かず
    // compile 側 fallback に委ねる (world 変換不能な raw client 座標の永続化を防ぐ、 #876)。
    const svgEl = previewRef.current?.querySelector("svg") as SVGSVGElement | null;
    const dropSvg = svgEl ? toWorldOrNull(svgEl, e.clientX, e.clientY) : null;
    const posFields: string[] = [];
    if (dropSvg) {
      posFields.push(`posX: ${Math.round(dropSvg.x)}`);
      posFields.push(`posY: ${Math.round(dropSvg.y)}`);
    }
    const inlineFields = [`kind: ${kindValue}`, ...posFields, ...stateInits].join(", ");
    const newActorLine = `  - ${alias}: { ${inlineFields} }`;
    // 2026-07-24 architectural refactor = pin / freeze 経路削除。 parts は overlay 独立管理で
    // cdl 側は base のみ compile するため、 pin (勝手な DSL 書換) も freeze (DOM override) も不要。
    void svgEl;
    const newSrc = appendActorLine(src, newActorLine);
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
                    // parts click 追加 = カーソル位置が無いため、 viewport 中央付近の「空いた場所」 に
                    // 配置する (2026-07-21 user 決定)。 素朴に viewport 中央へ置くと中央にある既存 sequence
                    // (Client/API/DB) の上に重なり、 過去報告の「図の上に parts が重なる」 目視 bug を再現し
                    // resize handle も occlude されるため、 既存 content の world bbox 下端の下 (横は viewport
                    // 中央 X を content 範囲に clamp) に置いて重なりを回避する。 従来の「図の右外 (maxLaneX +
                    // 600)」 は画面外に飛んで見つけにくいため廃止済。
                    const svgElClick = previewRef.current?.querySelector("svg") as SVGSVGElement | null;
                    let posFields: string[] = [];
                    if (svgElClick && previewRef.current) {
                      const containerRect = previewRef.current.getBoundingClientRect();
                      // getScreenCTM null (SVG 非表示 / detached) 時は toWorldOrNull が null を返す =
                      // posX/posY を書かず compile 側 fallback に委ねる (raw client 座標の永続化を防ぐ)。
                      const center = toWorldOrNull(
                        svgElClick,
                        containerRect.left + containerRect.width / 2,
                        containerRect.top + containerRect.height / 2,
                      );
                      if (center) {
                        // 描画済 element の world bbox 列を集める。 parts merge 由来 (`__` 付き) も含める =
                        // parts-only diagram で 2 個目以降を既存 parts の下に積んで重なりを避ける (#876)。
                        const rects: WorldRect[] = [];
                        for (const el of Array.from(svgElClick.querySelectorAll("[data-cdl-node], [data-cdl-lane]"))) {
                          const id = el.getAttribute("data-cdl-node") ?? el.getAttribute("data-cdl-lane") ?? "";
                          const r = (el as SVGGraphicsElement).getBoundingClientRect();
                          const tl = toWorldOrNull(svgElClick, r.left, r.top);
                          const br = toWorldOrNull(svgElClick, r.right, r.bottom);
                          if (!tl || !br) continue;
                          rects.push({ id, minX: tl.x, maxX: br.x, maxY: br.y });
                        }
                        // part の world 高さ ≈ stack span × STACK_PITCH_APPROX (compile と同係数 220)
                        const stacks = p.diagram.nodes.map((n) => n.stack ?? 0);
                        const partSpan = stacks.length > 0 ? Math.max(...stacks) - Math.min(...stacks) + 1 : 1;
                        const placement = resolveClickPlacement(rects, center, partSpan * 220);
                        posFields = [
                          `posX: ${Math.round(placement.x)}`,
                          `posY: ${Math.round(placement.y)}`,
                        ];
                      }
                    }
                    const inlineFields = [`kind: ${kindValue}`, ...posFields, ...stateInits].join(", ");
                    const newActorLine = `  - ${alias}: { ${inlineFields} }`;
                    // architectural refactor で pin 削除 = parts は overlay 独立管理で cdl 影響なし
                    void svgElClick;
                    const appended = appendActorLine(src, newActorLine);
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
            onClick={useHtmlCanvas ? () => htmlCanvasRef.current?.fit() : handleFit}
            title="表示を preview 領域に合わせる"
          >
            フィット
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn"
            onClick={useHtmlCanvas ? () => htmlCanvasRef.current?.reset() : handleReset}
            title="表示を初期状態に戻す (Esc)"
          >
            リセット
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn"
            onClick={handle100}
            title={useHtmlCanvas ? "HTML canvas mode では未対応 (Phase 2 で拡張)" : "等倍表示"}
            disabled={useHtmlCanvas}
          >
            100%
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn"
            onClick={handleZoomOut}
            title={useHtmlCanvas ? "HTML canvas mode では未対応 (Phase 2 で拡張)" : "縮小"}
            aria-label="縮小"
            disabled={useHtmlCanvas}
          >
            −
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn"
            onClick={handleZoomIn}
            title={useHtmlCanvas ? "HTML canvas mode では未対応 (Phase 2 で拡張)" : "拡大"}
            aria-label="拡大"
            disabled={useHtmlCanvas}
          >
            +
          </button>
          <span className="v4-editor-bar-zoom">{scaleDisplay}</span>
        </header>
        {useHtmlCanvas ? (
          <HtmlDivCanvasEditor
            ref={htmlCanvasRef}
            src={src}
            onSrcChange={setSrc}
            laid={laid}
            testId="editor-preview-stage"
          />
        ) : (
        <div
          className={`v4-editor-stage ${dropOver ? "drop-over" : ""}`}
          ref={previewRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleStageDoubleClick}
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
              <div className="v4-editor-svg-wrap" style={{ position: "relative" }}>
                <CdlDiagramView diagram={diagram} hideHeader emitGeometryWarn={import.meta.env.DEV} />
                {/* group visual = 各 group の member union bbox を 点線 border で表示 (Task #88)。
                    member が overlay parts の時 posX/Y/scale から bbox 計算、 cdl node は 別途 selector で拾う。 */}
                {Object.entries(groups).map(([gid, memberIds]) => {
                  const isGroupSelected = selectedIds.includes(`group:${gid}`);
                  let minL = Infinity, minT = Infinity, maxR = -Infinity, maxB = -Infinity;
                  for (const sid of memberIds) {
                    if (sid.startsWith("overlay:")) {
                      const oid = sid.slice("overlay:".length);
                      const p = overlayParts.find((x) => x.id === oid);
                      if (!p) continue;
                      const w = 380 * p.scale;
                      const h = 380 * p.scale;
                      minL = Math.min(minL, p.posX);
                      minT = Math.min(minT, p.posY);
                      maxR = Math.max(maxR, p.posX + w);
                      maxB = Math.max(maxB, p.posY + h);
                    }
                  }
                  if (minL === Infinity) return null;
                  return (
                    <div
                      key={gid}
                      data-group={gid}
                      style={{
                        position: "absolute",
                        left: `${minL - 8}px`,
                        top: `${minT - 8}px`,
                        width: `${maxR - minL + 16}px`,
                        height: `${maxB - minT + 16}px`,
                        border: isGroupSelected ? "2px dashed rgba(59, 130, 246, 0.7)" : "1.5px dashed rgba(138, 90, 42, 0.4)",
                        pointerEvents: isGroupSelected ? "auto" : "none",
                        borderRadius: "4px",
                        zIndex: 50,
                        cursor: isGroupSelected ? "grab" : "default",
                        background: isGroupSelected ? "rgba(59, 130, 246, 0.03)" : "transparent",
                      }}
                      onMouseDown={(e) => {
                        if (!isGroupSelected) return;
                        e.stopPropagation();
                        // group drag = 全 member を selectedIds に反映 (既 multi drag 経路発火)
                        setSelectedIds(memberIds);
                        // multi drag の primary target = first member
                        const primaryMemberId = memberIds.find((s) => s.startsWith("overlay:"));
                        if (!primaryMemberId) return;
                        const oid = primaryMemberId.slice("overlay:".length);
                        const primary = overlayParts.find((x) => x.id === oid);
                        if (!primary) return;
                        overlayDragRef.current = {
                          id: oid,
                          startPosX: primary.posX,
                          startPosY: primary.posY,
                          startClientX: e.clientX,
                          startClientY: e.clientY,
                        };
                        // multi drag ref = 全 member の start pos
                        const partsStart = new Map<string, { x: number; y: number }>();
                        for (const sid of memberIds) {
                          if (!sid.startsWith("overlay:")) continue;
                          const mid = sid.slice("overlay:".length);
                          const mp = overlayParts.find((x) => x.id === mid);
                          if (mp) partsStart.set(mid, { x: mp.posX, y: mp.posY });
                        }
                        multiDragStartsRef.current = partsStart;
                        document.body.style.cursor = "grabbing";
                      }}
                      onClick={(e) => {
                        // group click = 選択 (member を selection として指定するか group id で保持)
                        if (isGroupSelected) return;
                        e.stopPropagation();
                        setSelectedIds([`group:${gid}`]);
                      }}
                    />
                  );
                })}
                {/* 2026-07-24 architectural refactor = parts overlay 独立描画。 pan/scale 済 container 内
                    に位置するため、 posX/posY (world 座標) をそのまま left/top に指定するだけで cdl SVG と
                    同 座標系で表示される。 cdl は parts を知らないので base 図に影響なし。 */}
                {overlayParts.map((p) => {
                  const isHovered = hoveredOverlayId === p.id;
                  const isSelected = selectedIds.includes(`overlay:${p.id}`);
                  return (
                    <div
                      key={p.id}
                      data-overlay-part={p.id}
                      data-selected={isSelected ? "1" : undefined}
                      ref={(el) => { overlayRefs.current[p.id] = el; }}
                      style={{
                        position: "absolute",
                        left: `${p.posX}px`,
                        top: `${p.posY}px`,
                        transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
                        transformOrigin: "0 0",
                        cursor: "grab",
                        userSelect: "none",
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedIds([`overlay:${p.id}`]);
                        setContextMenu({ x: e.clientX, y: e.clientY, overlayId: p.id });
                      }}
                      onMouseEnter={() => setHoveredOverlayId(p.id)}
                      onMouseLeave={() => {
                        if (!overlayDragRef.current && !overlayResizeRef.current) setHoveredOverlayId(null);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        overlayDragRef.current = {
                          id: p.id,
                          startPosX: p.posX,
                          startPosY: p.posY,
                          startClientX: e.clientX,
                          startClientY: e.clientY,
                        };
                        setHoveredOverlayId(p.id);
                        // multi selection = shift/meta 押下で追加、 通常 click で置換 (但し既 selection に居る parts は保持)
                        const selId = `overlay:${p.id}`;
                        const wasSelected = selectedIds.includes(selId);
                        if (e.shiftKey || e.metaKey) {
                          setSelectedIds((prev) => prev.includes(selId) ? prev.filter((x) => x !== selId) : [...prev, selId]);
                        } else if (!wasSelected) {
                          setSelectedIds([selId]);
                        }
                        // multi drag = 現 selection の全 overlay parts の start pos snapshot
                        const currentSelection = wasSelected || e.shiftKey || e.metaKey ? selectedIds : [selId];
                        const partsStart = new Map<string, { x: number; y: number }>();
                        for (const sid of currentSelection) {
                          if (!sid.startsWith("overlay:")) continue;
                          const targetId = sid.slice("overlay:".length);
                          const tp = overlayParts.find((x) => x.id === targetId);
                          if (tp) partsStart.set(targetId, { x: tp.posX, y: tp.posY });
                        }
                        multiDragStartsRef.current = partsStart;
                        document.body.style.cursor = "grabbing";
                      }}
                    >
                      <CdlDiagramView diagram={p.item.diagram} hideHeader emitGeometryWarn={false} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="v4-editor-empty">読み込み中...</div>
            )}
          </div>
          {/* activeGuidelines 描画削除 (guideline 機能全撤去、 2026-07-24) */}
          {contextMenu && contextMenu.overlayId && (() => {
            const target = contextMenu.overlayId;
            const actions: Array<{ label: string; onClick: () => void }> = [
              { label: "🎨 色を変える", onClick: () => { setColorPickerFor(target); setContextMenu(null); } },
              { label: "📋 複製 (Cmd+D)", onClick: () => {
                const orig = overlayParts.find((p) => p.id === target);
                if (orig) {
                  setSrc((prev) => {
                    const newAlias = nextAvailableAlias(prev, aliasBaseName(target));
                    const newLine = buildDuplicateLine(orig, newAlias);
                    return appendActorLine(prev, newLine) ?? prev;
                  });
                }
                setContextMenu(null);
              }},
              { label: "⬆️ 前面へ (Cmd+])", onClick: () => {
                setSrc((prev) => {
                  const lines = prev.split("\n");
                  const idx = lines.findIndex((l) => new RegExp(`^\\s*-\\s*${target}\\s*:`).test(l));
                  if (idx >= 0 && idx + 1 < lines.length && /^\s*-\s*\S+?\s*:\s*\{/.test(lines[idx + 1]!)) {
                    [lines[idx], lines[idx + 1]] = [lines[idx + 1]!, lines[idx]!];
                  }
                  return lines.join("\n");
                });
                setContextMenu(null);
              }},
              { label: "⬇️ 背面へ (Cmd+[)", onClick: () => {
                setSrc((prev) => {
                  const lines = prev.split("\n");
                  const idx = lines.findIndex((l) => new RegExp(`^\\s*-\\s*${target}\\s*:`).test(l));
                  if (idx > 0 && /^\s*-\s*\S+?\s*:\s*\{/.test(lines[idx - 1]!)) {
                    [lines[idx], lines[idx - 1]] = [lines[idx - 1]!, lines[idx]!];
                  }
                  return lines.join("\n");
                });
                setContextMenu(null);
              }},
              { label: "🗑 削除 (Delete)", onClick: () => {
                setSrc((prev) => {
                  const re = new RegExp(`^\\s*-\\s*${target}\\s*:\\s*\\{[^}]*\\}\\s*\\n`, "m");
                  return prev.replace(re, "");
                });
                setSelectedIds([]);
                setContextMenu(null);
              }},
            ];
            return (
              <div
                data-context-menu="1"
                style={{
                  position: "fixed",
                  left: `${contextMenu.x}px`,
                  top: `${contextMenu.y}px`,
                  background: "#fff",
                  border: "1px solid #8a5a2a",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  borderRadius: "6px",
                  padding: "4px 0",
                  zIndex: 500,
                  minWidth: "180px",
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onContextMenu={(e) => e.preventDefault()}
              >
                {actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    data-context-action={a.label}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 12px",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                    }}
                    onClick={(e) => { e.stopPropagation(); a.onClick(); }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            );
          })()}
          {rubberBand && (() => {
            const stageRect = previewRef.current?.getBoundingClientRect();
            if (!stageRect) return null;
            const left = Math.min(rubberBand.sx, rubberBand.cx) - stageRect.left;
            const top = Math.min(rubberBand.sy, rubberBand.cy) - stageRect.top;
            const width = Math.abs(rubberBand.cx - rubberBand.sx);
            const height = Math.abs(rubberBand.cy - rubberBand.sy);
            return (
              <div
                data-rubber-band="1"
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  border: "1.5px dashed rgba(59, 130, 246, 0.8)",
                  background: "rgba(59, 130, 246, 0.1)",
                  pointerEvents: "none",
                  zIndex: 200,
                }}
              />
            );
          })()}
          {/* 2026-07-25 overlay selection UI = stage-level portal render (transformed div 外)。
              shapeClientBboxes を使って stage 相対 client px 座標に配置 = pan / scale / rotate 影響なし、
              icon sharp、 resize / border position が visible shape に完全一致。 */}
          {overlayParts.filter((p) => selectedIds.includes(`overlay:${p.id}`) || hoveredOverlayId === p.id).map((p) => {
            const bbox = shapeClientBboxes[p.id];
            if (!bbox) return null;
            const isSelected = selectedIds.includes(`overlay:${p.id}`);
            const isHovered = hoveredOverlayId === p.id;
            const BORDER = "#2563eb";
            const HANDLE = 10;
            const changeColor = (c: string): void => {
              setSrc((prev) => {
                const lines = prev.split("\n");
                const next = lines.map((line) => {
                  const m = line.match(/^(\s*-\s*)("[^"]+"|\S+?)(\s*:\s*)\{(.+)\}\s*$/);
                  if (!m) return line;
                  const rawName = m[2]!.replace(/^"(.+)"$/, "$1");
                  if (rawName !== p.id) return line;
                  const prefix = m[1]! + m[2]! + m[3]!;
                  let inner = m[4]!;
                  inner = inner.replace(/,?\s*bg\s*:\s*"[^"]*"/g, "").replace(/^\s*,\s*/, "").replace(/\s*,\s*$/, "").trim();
                  const merged = inner.length > 0 ? `${inner}, bg: "${c}"` : `bg: "${c}"`;
                  return `${prefix}{ ${merged} }`;
                });
                return next.join("\n");
              });
              setColorPickerFor(null);
            };
            const iconStyle: React.CSSProperties = {
              width: "32px", height: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "none", cursor: "pointer", borderRadius: "6px", padding: 0,
            };
            return (
              <div key={p.id} data-overlay-selection-ui={p.id}>
                {/* 選択枠 = shape client bbox に完全 fit (padding なし)、 点線 */}
                <div
                  data-overlay-outline={p.id}
                  data-shape-bbox-left={bbox.left.toFixed(2)}
                  data-shape-bbox-top={bbox.top.toFixed(2)}
                  data-shape-bbox-width={bbox.width.toFixed(2)}
                  data-shape-bbox-height={bbox.height.toFixed(2)}
                  style={{
                    position: "absolute", left: `${bbox.left}px`, top: `${bbox.top}px`,
                    width: `${bbox.width}px`, height: `${bbox.height}px`,
                    border: `1.5px dashed ${BORDER}`, pointerEvents: "none", boxSizing: "border-box",
                    borderRadius: "2px", zIndex: 90,
                  }}
                />
                {/* 4 隅 handle = shape bbox 4 隅 に配置、 client px 直接指定 = pan/scale 影響なし */}
                {(["nw", "ne", "sw", "se"] as const).map((corner) => {
                  const cx = corner === "nw" || corner === "sw" ? bbox.left : bbox.left + bbox.width;
                  const cy = corner === "nw" || corner === "ne" ? bbox.top : bbox.top + bbox.height;
                  return (
                    <div
                      key={corner}
                      data-overlay-handle={corner}
                      data-overlay-handle-for={p.id}
                      style={{
                        position: "absolute",
                        left: `${cx - HANDLE / 2}px`, top: `${cy - HANDLE / 2}px`,
                        width: `${HANDLE}px`, height: `${HANDLE}px`,
                        background: "#fff", border: `2px solid ${BORDER}`, borderRadius: "3px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize",
                        zIndex: 100, transition: "transform 0.1s ease-out",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.4)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        // Alt = rotate (shape bbox 中心 基準)
                        if (e.altKey) {
                          const stageRect2 = previewRef.current?.getBoundingClientRect();
                          if (!stageRect2) return;
                          const rcx = stageRect2.left + bbox.left + bbox.width / 2;
                          const rcy = stageRect2.top + bbox.top + bbox.height / 2;
                          overlayRotateRef.current = {
                            id: p.id, startRotate: p.rotate,
                            centerClientX: rcx, centerClientY: rcy,
                            startAngleRad: Math.atan2(e.clientY - rcy, e.clientX - rcx),
                          };
                          document.body.style.cursor = "grab";
                          return;
                        }
                        // resize = shape client bbox 基準 (Miro 相当 = 引っ張った方向に visible shape が拡大 + opposite corner 固定)
                        overlayResizeRef.current = {
                          id: p.id, corner, startScale: p.scale,
                          startClientX: e.clientX, startClientY: e.clientY,
                          startPosX: p.posX, startPosY: p.posY,
                          startClientW: bbox.width, startClientH: bbox.height,
                          startBboxLeft: bbox.left, startBboxTop: bbox.top,
                          panScale: transformRef.current.scale || 1,
                          panTx: transformRef.current.tx, panTy: transformRef.current.ty,
                        };
                        document.body.style.cursor = corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize";
                      }}
                    />
                  );
                })}
                {/* Toolbar = 選択時のみ、 shape 上方に配置。 sharp SVG icon (transform 外 = 縮小 blur なし) */}
                {isSelected && (
                  <div
                    data-overlay-toolbar={p.id}
                    style={{
                      position: "absolute", left: `${bbox.left}px`, top: `${bbox.top - 44}px`,
                      background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.08)",
                      padding: "4px", display: "flex", gap: "2px", zIndex: 200, whiteSpace: "nowrap",
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button type="button" data-overlay-toolbar-btn="color" title="色を変更" style={iconStyle}
                      onClick={(e) => { e.stopPropagation(); setColorPickerFor((prev) => prev === p.id ? null : p.id); }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2c-4.4 0-8 3.6-8 8s3.6 8 8 8c.6 0 1-.4 1-1s-.4-1-1-1c-.5 0-1-.4-1-1s.5-1 1-1c1.1 0 2-.9 2-2s-.9-2-2-2c-1.1 0-2-.9-2-2s.9-2 2-2c1.7 0 3 1.3 3 3 0 .6.4 1 1 1s1-.4 1-1c0-3.9-3.1-7-7-7z" fill="#374151"/>
                        <circle cx="6" cy="10" r="1.2" fill="#ef4444"/>
                        <circle cx="9" cy="6" r="1.2" fill="#3b82f6"/>
                        <circle cx="14" cy="10" r="1.2" fill="#22c55e"/>
                      </svg>
                    </button>
                    <button type="button" data-overlay-toolbar-btn="duplicate" title="複製 (Cmd+D)" style={iconStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSrc((prev) => {
                          const newAlias = nextAvailableAlias(prev, aliasBaseName(p.id));
                          const newLine = buildDuplicateLine(p, newAlias);
                          return appendActorLine(prev, newLine) ?? prev;
                        });
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#374151" strokeWidth="1.5">
                        <rect x="3" y="3" width="10" height="10" rx="1.5"/>
                        <rect x="7" y="7" width="10" height="10" rx="1.5" fill="#fff"/>
                      </svg>
                    </button>
                    <button type="button" data-overlay-toolbar-btn="bring-front" title="前面へ (Cmd+])" style={iconStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSrc((prev) => {
                          const lines = prev.split("\n");
                          const idx = lines.findIndex((l) => new RegExp(`^\\s*-\\s*${p.id}\\s*:`).test(l));
                          if (idx >= 0 && idx + 1 < lines.length && /^\s*-\s*\S+?\s*:\s*\{/.test(lines[idx + 1]!)) {
                            [lines[idx], lines[idx + 1]] = [lines[idx + 1]!, lines[idx]!];
                          }
                          return lines.join("\n");
                        });
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <rect x="6" y="6" width="10" height="10" rx="1.5" fill="#fff" stroke="#374151" strokeWidth="1.5"/>
                        <rect x="3" y="3" width="10" height="10" rx="1.5" fill="#374151"/>
                      </svg>
                    </button>
                    <button type="button" data-overlay-toolbar-btn="send-back" title="背面へ (Cmd+[)" style={iconStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSrc((prev) => {
                          const lines = prev.split("\n");
                          const idx = lines.findIndex((l) => new RegExp(`^\\s*-\\s*${p.id}\\s*:`).test(l));
                          if (idx > 0 && /^\s*-\s*\S+?\s*:\s*\{/.test(lines[idx - 1]!)) {
                            [lines[idx], lines[idx - 1]] = [lines[idx - 1]!, lines[idx]!];
                          }
                          return lines.join("\n");
                        });
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="3" width="10" height="10" rx="1.5" fill="#fff" stroke="#374151" strokeWidth="1.5"/>
                        <rect x="6" y="6" width="10" height="10" rx="1.5" fill="#374151"/>
                      </svg>
                    </button>
                    <div style={{ width: "1px", background: "#e5e7eb", margin: "4px 2px" }} />
                    <button type="button" data-overlay-toolbar-btn="delete" title="削除 (Delete)" style={iconStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSrc((prev) => {
                          const re = new RegExp(`^\\s*-\\s*${p.id}\\s*:\\s*\\{[^}]*\\}\\s*\\n`, "m");
                          return prev.replace(re, "");
                        });
                        setSelectedIds([]);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10"/>
                      </svg>
                    </button>
                  </div>
                )}
                {/* Color picker popover */}
                {isSelected && colorPickerFor === p.id && (
                  <div data-overlay-color-picker={p.id}
                    style={{
                      position: "absolute", left: `${bbox.left}px`, top: `${bbox.top}px`,
                      background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.12)", padding: "10px",
                      display: "grid", gridTemplateColumns: "repeat(6, 30px)", gap: "8px", zIndex: 210,
                    }}
                    onMouseDown={(e) => e.stopPropagation()}>
                    {["#f59e0b", "#ef4444", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
                      "#0891b2", "#78716c", "#f97316", "#84cc16", "#06b6d4", "#a855f7"].map((c) => (
                      <button key={c} type="button" data-overlay-color-swatch={c}
                        style={{
                          width: "30px", height: "30px", background: c,
                          border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "6px",
                          cursor: "pointer", padding: 0, transition: "transform 0.1s ease-out",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                        onClick={(e) => { e.stopPropagation(); changeColor(c); }} />
                    ))}
                  </div>
                )}
                {/* hover only (未選択) は border だけ subtle 表示 */}
                {!isSelected && isHovered && (
                  <div style={{
                    position: "absolute", left: `${bbox.left - 1}px`, top: `${bbox.top - 1}px`,
                    width: `${bbox.width + 2}px`, height: `${bbox.height + 2}px`,
                    border: `1px dashed ${BORDER}`, pointerEvents: "none", boxSizing: "border-box",
                    borderRadius: "2px", zIndex: 89, opacity: 0.5,
                  }} />
                )}
              </div>
            );
          })}
          {hoveredHandle && !selectedIds.includes(`cdl:${hoveredHandle.id}`) && (() => {
            // 2026-07-25 hover UI 簡素化 = hover は 薄 border indicator のみ (Miro/Figma 相当)、 handle 削除。
            // selection 済 cdl 要素は cdl selection UI が濃 border + handle を出すので hover UI 抑止。
            const stageRect = previewRef.current?.getBoundingClientRect();
            if (!stageRect) return null;
            const r = hoveredHandle.rect;
            const left = r.left - stageRect.left;
            const top = r.top - stageRect.top;
            return (
              <div
                // 2026-07-26 CAR-2158 = test が inline style の substring ではなく semantic hook で
                // 対象を特定できるようにする (別の dashed div が増えても誤検出しない)
                data-cdl-hover-outline={hoveredHandle.id}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${r.width}px`,
                  height: `${r.height}px`,
                  border: "1px dashed rgba(37, 99, 235, 0.35)",
                  pointerEvents: "none",
                  zIndex: 99,
                  boxSizing: "border-box",
                }}
              />
            );
          })()}
          {/* 2026-07-25 text 編集 overlay = double click 起動、 Enter / blur で src.replaceAll */}
          {textEditing && (
            <input
              autoFocus
              data-testid="editor-text-edit-input"
              defaultValue={textEditing.originalText}
              style={{
                position: "absolute",
                left: `${textEditing.bbox.left}px`,
                top: `${textEditing.bbox.top}px`,
                width: `${textEditing.bbox.width}px`,
                height: `${textEditing.bbox.height}px`,
                fontSize: `${textEditing.fontSize}px`,
                padding: "2px 6px", border: "2px solid #2563eb", borderRadius: "4px",
                background: "#fff", zIndex: 300, boxSizing: "border-box",
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitTextEdit((e.target as HTMLInputElement).value); }
                else if (e.key === "Escape") { e.preventDefault(); setTextEditing(null); }
              }}
              onBlur={(e) => commitTextEdit(e.target.value)}
            />
          )}
          {/* 2026-07-25 cdl 要素 selection UI = 点線 border + 10px 4 隅 handle、 stage-level portal
              Phase 4 revert = 実 drag/resize は cdl actor の header/spacer/footer 複合構造で分裂 bug、
              core 再設計が必要 (別 issue)。 現状は selection UI 表示のみ = user が「何が選ばれているか」 を確認可能。
              handle は視覚 indicator のみ (pointerEvents: none)、 実操作は overlay parts のみ現時点で対応。 */}
          {selectedIds.filter((s) => s.startsWith("cdl:")).map((sid) => {
            const key = sid.slice("cdl:".length);
            const bbox = cdlClientBboxes[key];
            if (!bbox) return null;
            const BORDER = "#2563eb";
            const HANDLE = 10;
            return (
              <div key={sid} data-cdl-selection-ui={key}>
                <div
                  data-cdl-outline={key}
                  style={{
                    position: "absolute", left: `${bbox.left}px`, top: `${bbox.top}px`,
                    width: `${bbox.width}px`, height: `${bbox.height}px`,
                    border: `1.5px dashed ${BORDER}`, pointerEvents: "none", boxSizing: "border-box",
                    borderRadius: "2px", zIndex: 90,
                  }}
                />
                {(["nw", "ne", "sw", "se"] as const).map((corner) => {
                  const cx = corner === "nw" || corner === "sw" ? bbox.left : bbox.left + bbox.width;
                  const cy = corner === "nw" || corner === "ne" ? bbox.top : bbox.top + bbox.height;
                  return (
                    <div
                      key={corner}
                      data-cdl-handle={corner}
                      data-cdl-handle-for={key}
                      style={{
                        position: "absolute",
                        left: `${cx - HANDLE / 2}px`, top: `${cy - HANDLE / 2}px`,
                        width: `${HANDLE}px`, height: `${HANDLE}px`,
                        background: "#fff", border: `2px solid ${BORDER}`, borderRadius: "3px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize",
                        zIndex: 100, pointerEvents: "none",
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        )}
      </section>
    </div>
  );
}
