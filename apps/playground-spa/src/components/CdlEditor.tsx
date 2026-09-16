import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router";
import { CdlDiagramView, type CdlDiagram, type LaidDiagram, type Violation } from "@cardenelabs/cdl";
import { PhaseChrome } from "@/components/PhaseChrome";
import {
  textDslToDiagram,
  partRenderSize,
  partScaleFactor,
  partDrawsInDiagram,
  measureActorBoxes,
  partsBaseBottom,
  writeActorPosition,
  isColorValue,
  stripExternalPaint,
  describeOversize,
  describeOversizeSource,
  countDiagramElements,
  type CompileNotice,
} from "@cardenelabs/dragon";
import CodeMirror from "@uiw/react-codemirror";
import { loadPartsItems, type CatalogItem } from "@/lib/catalog-items";
import { 部品の一覧を作る, 部品の図か } from "@/lib/parts-catalog";
import { CATEGORIES } from "@/lib/catalog";
import { SyntaxReference } from "@/components/SyntaxReference";
import { deserializePart, isPartsMarker, PARTS_MARKER } from "@/lib/parts-serializer";
// 2026-07-24 = canvas-pivot-auto-adjust / canvas-pivot-guideline / viewBoxCompensation を全削除。
// user 要求「勝手な移動全部削除」 の core、 auto 補正 / 補助線 / pan 補償の 3 経路を完全撤去。
import { 図と重ねる部品に分ける, appendActorLine, placeParts, partWorldSize, srcMayUseParts, yamlMayUseParts } from "@/lib/overlay-dsl";
import { buildAndValidate, type BuildResult } from "@/lib/render-pipeline";
import { fitBounds } from "@/lib/fit-bounds";
import { boxesRightPx, readableScaleForFrame, smallestFontWorld } from "@/lib/readable-scale";
import { axisOffset } from "@/lib/fit-anchor";
import { readDiagramScale, setDiagramScale, applyFontScale, clampFontScale } from "@/lib/diagram-scale";
import { PHASE_CHROME_BOTTOM_SPACE_PX, PHASE_CHROME_TOP_SPACE_PX } from "@/lib/phase-chrome-space";
import { stagePaperColor } from "@/lib/stage-paper";
import {
  IconShare, IconExport, IconList, IconTextDown, IconTextUp, IconShrink, IconGrow,
  IconPositions, IconGrid, IconFit, IconReset, IconActualSize, IconZoomOut, IconZoomIn,
} from "@/components/EditorBarIcons";
import { applySvgPixelSize, normalizeScale } from "@/lib/svg-pixel-size";
import { panCompensation, type ViewBoxOrigin } from "@/lib/viewbox-anchor";

/**
 * overlay div 内の「主要 shape」 を返す。
 *
 * 選択枠 / align / bg 適用の全てがこの判定を共有する。 painted 判定を入れないと
 * achievement の透明 wrapper rect (fill=none) を掴んでしまい、 実際に見えている図形より
 * 大きい bbox を主要形状とみなす (CAR-2158 Round 3 で align / bg 間の不整合として検出)。
 */
/**
 * text 編集の入力欄を「中身が全部見える幅」 に合わせる。
 *
 * 元要素の bbox に固定すると、 元の文字より長く打った途端に先頭が隠れて全文を確認できない。
 * `scrollWidth` は内容の実幅を返すので、 一度 auto に戻してから測り直す。
 * 元要素より狭くはしない (`minWidth` 相当) = 見た目の位置ずれを避ける。
 */


function findPaintedShape(div: Element): SVGGraphicsElement | null {
  const shapes = div.querySelectorAll<SVGGraphicsElement>("circle, rect, path, ellipse, polygon");
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
  return best;
}

import { EDITOR_SAMPLES, type EditorSample } from "@/data/editor-samples";
// 誤りの型と整形だけを静的に読む。 読み取りの実装 (`js-yaml` を含む) は YAML 欄を開いた時に
// 初めて読み込む (#1007)。 整形までその到着を待つと、 誤りの帯が 1 拍遅れて出る
import { formatYamlError, type YamlAdapterError } from "@/lib/yaml-error";
import { stageSvgOf } from "@/lib/stage-svg";
import { useToast } from "@/components/Toast";
import { applyOffsetsToFlow, toSourceLines, usableEdgeLines } from "@/lib/auto-fix-dsl";
import { buildAutoFixOffsets, countFixableWarnings, FIXABLE_WARNING_AXES } from "@/lib/auto-fix-offsets";
import { 直せない軸の案内, まとめて直せない案内 } from "@/lib/axis-names";
import { yaml } from "@codemirror/lang-yaml";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { 記法の色分け } from "@/lib/syntax-decoration";
import { useLocale } from "@/lib/useLocale";
import { 図に画面の言語を当てる } from "@/lib/diagram-lang";

// 記述の色分け。 値は globals.css の変数から取るので、 明暗の切替は html.dark 1 本で済む。
// 鍵は dg-1、 値と文字列は dg-2、 区切りと注記は控えめな色、 という 04 編集画面の割り当てに合わせる。
const CODE_TAG_COLORS = [
  { tag: [t.atom, t.bool, t.keyword, t.propertyName], color: "var(--d-dg-1)", fontWeight: "500" },
  { tag: [t.string, t.special(t.string)], color: "var(--d-dg-2)" },
  { tag: [t.number, t.integer, t.float], color: "var(--d-dg-2)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--d-text-muted)", fontStyle: "italic" },
  { tag: [t.operator, t.punctuation, t.separator], color: "var(--d-text-muted)" },
  { tag: [t.invalid], color: "var(--d-err)" },
];

const v4HighlightLight = HighlightStyle.define(CODE_TAG_COLORS);
const v4HighlightDark = HighlightStyle.define(CODE_TAG_COLORS);

// 明暗で同じ指定を使う。 中の色はすべて変数なので、 html.dark が付いた時点で追随する。
// dark 版を残すのは CodeMirror が明暗の別を内部の判定に使うためで、 見た目の差は変数側が持つ。
const CODE_THEME_RULES = {
  "&": {
    backgroundColor: "var(--d-code-bg)",
    color: "var(--d-text-primary)",
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace",
    fontSize: "12.5px",
    height: "100%",
  },
  ".cm-content": { padding: "18px 14px", caretColor: "var(--d-accent)" },
  ".cm-cursor": { borderLeftColor: "var(--d-accent)" },
  ".cm-line": { padding: "0 4px" },
  ".cm-gutters": {
    backgroundColor: "var(--d-code-bg)",
    color: "var(--d-text-muted)",
    border: "none",
    borderRight: "1px solid var(--d-border)",
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
    fontSize: "10.5px",
  },
  ".cm-activeLineGutter": { backgroundColor: "var(--d-accent-soft)", color: "var(--d-accent)" },
  ".cm-activeLine": { backgroundColor: "var(--d-accent-soft)" },
  ".cm-selectionBackground, ::selection": { backgroundColor: "var(--d-code-selection-bg) !important" },
  "&.cm-focused": { outline: "none" },
};

const v4EditorThemeLight = EditorView.theme(CODE_THEME_RULES, { dark: false });
const v4EditorThemeDark = EditorView.theme(CODE_THEME_RULES, { dark: true });

/**
 * Visual Editor v1.1
 *
 * 設計:
 * - 左 ... DSL textarea (monospace、 line-numbered hint)
 * - 右 ... live preview (CdlDiagramView) + pan/zoom toolbar (Mermaid Live Editor 相当)
 * - 入力 debounce 300ms で parse + render
 * - URL hash で share (`#s=<base64>`)、 起動時に hash から復元
 * - Download SVG ボタン
 * - Reset / Sample 切替ボタン (scroll 横並び)
 * - Error 表示 (parse error 時に行番号付き)
 * - pan/zoom ... wheel zoom (cursor 中心、 0.25-8x)、 drag pan、 Fit/Reset/100%/+/- toolbar
 */

/** SAMPLES の各 sample に slug (kebab-case) を持たせて、 PresetDetail の `#preset=<slug>` と一致検索する。
 *  slug は PRESETS.slug 命名規約 (kebab-case、 `lib/presets.ts` SSOT) と揃える。 複数 sample が同 slug を共有する場合
 *  (例 sequence 系 2 件) は SAMPLES 配列先頭の sample が hash match で優先される (最初の find が勝つ)。
 *
 *  実体は `@/data/editor-samples.ts` に移設済 (CAR-1659、 samples-validate test との drift 回避で shared SSOT 化)。 */
const SAMPLES = EDITOR_SAMPLES;

/** 知らせの中で分類を指す時の呼び名 (#1805)。 出どころは `CATEGORIES[].label` 1 つ (#1788) */
const 分類の呼び名 = CATEGORIES.find((c) => c.slug === "presets")?.label ?? "";

/**
 * 図に重ねる小部品の呼び名 (#1811)。 出どころは同じく `CATEGORIES[].label` 1 つ。
 *
 * この画面は一覧の見出しと知らせで 5 箇所この語を出す。 字で書くと、#1805 のように
 * カタログの側だけ呼び名が変わった時に、この画面だけ古い呼び名が残る。
 */
const 部品の呼び名 = CATEGORIES.find((c) => c.slug === "parts")?.label ?? "";

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
    // 必須の群。 取れない形は regex と噛み合っていない
    const 本体 = match?.[1];
    if (本体 === undefined) return null;
    return decodeURIComponent(escape(atob(本体)));
  } catch {
    return null;
  }
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 8;
const ZOOM_STEP = 0.2;

/*
 * 自動で直せない軸の案内文は `lib/axis-names` が組み立てる (#1796)。
 * 軸の呼び名と直し方を同じ場所に置き、画面は組み上がった 1 文を出すだけにする。
 */

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
 * 「この欄のこの中身で組み立て済み」 を表す鍵 (#1006)。
 *
 * 欄を切り替えただけで中身が変わっていないなら、 組み立て直す理由がない。 図の規模に比例して
 * 重い処理なので、 往復のたびに計算すると画面が止まる。
 *
 * パーツの数を混ぜるのは、 一覧が遅れて読み込まれるため。 本文だけを見ていると、 読み込みが
 * 終わってもやり直さず、 パーツが空の箱のまま残る (実測 = 共有 URL でパーツ入りの本文を開くと、
 * 一覧を開いた後も箱のままだった)。
 */
function buildKey(tab: "cdl" | "yaml", src: string, yamlSrc: string, partsCount: number, locale: string): string {
  // 長さを持つ形で繋ぐ。 区切り文字で繋ぐと、 その文字が本文に出た時に別の中身が同じ鍵になる
  // 画面の言語も混ぜる (#1910)。 形の絵の中の字が言語で変わるので、切り替えたのに覚えてある
  // 別の言語の図を戻すと、画面と違う言語の字が残る
  return JSON.stringify([tab, partsCount, locale, tab === "yaml" ? yamlSrc : src]);
}

/**
 * YAML の読み取りは、 YAML 欄を開いた時に初めて読み込む (#1007)。
 *
 * `js-yaml` は圧縮後 12KB あり、 editor の塊 (圧縮後 173KB) の 7% を占める。 本文欄しか
 * 使わない人も download と評価の費用を払っていた。
 *
 * 約束を module に持って使い回す。 欄を往復するたびに読み直すと、 2 回目以降に無駄な待ちが出る。
 */
let yamlAdapterPromise: Promise<typeof import("@/lib/yaml-adapter")> | null = null;
function loadYamlAdapter(): Promise<typeof import("@/lib/yaml-adapter")> {
  yamlAdapterPromise ??= import("@/lib/yaml-adapter").catch((e: unknown) => {
    // 失敗した約束は捨てる。 ただし **これだけでは取り直せない** = 読み込みに失敗した
    // module は browser 側にも失敗として記録され、 同じ名前で頼み直しても要求自体が
    // 出ない (実測 = 1 回目を落とした後に書き換えても要求は 1 回のまま)。
    // 捨てるのは、 将来 束ね方が変わって取り直せるようになった時に効かせるため。
    // 今できる案内は「頁を開き直す」 で、 それは誤りの文に書く
    yamlAdapterPromise = null;
    throw e;
  });
  return yamlAdapterPromise;
}

/** 欄ごとに覚えておく組み立ての結果 */
type BuildCacheEntry = {
  key: string;
  diagram: CdlDiagram;
  laid: LaidDiagram;
  warnings: Violation[];
  /** 書いたのに効かなかったことの知らせ。 一緒に覚えないと、 戻った時に消えたままになる */
  notices: CompileNotice[];
};

// 2026-07-24 = extractPartsFromSrc / writeOverlayPartToDsl は @/lib/overlay-dsl に抽出 (Layer 1 unit test 化)

/**
 * CAR-1678 = YAML tab の初期 buffer (multi-line YAML DSL、 dragon JSON schema と 1:1 対応)。
 * SAMPLES[0] と対等な UX を YAML 派 user にも提供、 title / actors / flow / animation の 4 block 揃え、
 * confirmReplaceIfDirty の初期比較 (yamlLastLoadedRef) にも同 default を使う。
 */
const DEFAULT_YAML_SRC = `title: "YAML tab demo"
type: sequence
actors:
  - User
  - API
flow:
  - from: User
    to: API
    label: login
  - from: API
    to: User
    label: ok
animation:
  - step: request
    duration: 1.2
    focus:
      - User
      - API
`;

/**
 * CAR-1678 = CdlEditor が accept する initial tab hint。
 * EditorPage が URL param `?format=yaml` or 拡張子 `.yml` を検知して "yaml" を渡す。
 * 未指定 (undefined) or "cdl" なら従来通り CDL tab active で起動する。
 */
export interface CdlEditorProps {
  initialTab?: "cdl" | "yaml";
}

export function CdlEditor(props: CdlEditorProps = {}): React.JSX.Element {
  const location = useLocation();
  const { toast } = useToast();
  // 図を画面の言語で描く (#1910)。 配置 (`buildAndValidate`) の前に当てる = 配置の結果が
  // 言語を持ち越して形の部品に届けるので、配置の後に当てても形の字は変わらない
  const [locale] = useLocale();
  const [src, setSrcRaw] = useState<string>(SAMPLES[0].code);
  // keydown handler から最新 src を同期的に読むための mirror
  const srcRef = useRef(src);
  useEffect(() => { srcRef.current = src; }, [src]);
  // 読み取りの実装が届いた時に「今の本文 / 今の欄」 を同期的に読むための鏡 (#1007)。
  // 届くまでの間に書き換わっていたら、 古い入力の結果で新しい図を上書きしない
  const yamlSrcRef = useRef("");
  const activeTabRef = useRef<"cdl" | "yaml">("cdl");
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
  /**
   * CAR-1678 = 編集 tab (CDL 従来経路 / YAML 新経路)。
   * initialTab prop (EditorPage 側で URL param + 拡張子から決定) を初期値に採用、
   * user が UI 経由で切替えた後は自前 state で管理する (prop 変化に追随はしない = URL param は起動 1 回のみ有効)。
   */
  const [activeTab, setActiveTab] = useState<"cdl" | "yaml">(props.initialTab ?? "cdl");
  /** CAR-1678 = YAML tab の source buffer、 CDL 側 `src` と分離。 双方向 sync なし (spec 反例 2)。 */
  const [yamlSrc, setYamlSrc] = useState<string>(DEFAULT_YAML_SRC);
  /** CAR-1678 = YAML parse / validation error、 preview 上部の error banner に表示、 null = 正常 */
  const [yamlError, setYamlError] = useState<YamlAdapterError | null>(null);
  // 遅れて届く読み取りの実装から「今の本文 / 今の欄」 を同期的に読むために鏡を保つ (#1007)
  useEffect(() => { yamlSrcRef.current = yamlSrc; }, [yamlSrc]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  // CAR-1947 = HTML div canvas feature flag (URL param `?canvas=html` opt-in、 未指定時は既存 SVG 経路)。
  // useState + initializer で mount 時 1 回だけ read、 URL 変化での re-eval は Phase 2 以降の課題。
  const [diagram, setDiagram] = useState<CdlDiagram | null>(null);
  /**
   * 配置まで済ませた図 (#1006)。
   *
   * 組み立て (`compile`) は中で配置を計算する。 その結果を捨てると、 位置関係の検査と
   * 図枠の原点でもう 2 度計算することになる (実測 = 辺 1,000 本で 1 回の描画に 5.42 秒)。
   * 上の `diagram` と必ず対で更新する = 片方だけ新しい状態を作らない。
   */
  const [laid, setLaid] = useState<LaidDiagram | null>(null);
  /** 欄ごとの組み立て結果。 中身が変わっていない欄に戻った時は、 これを載せ直すだけにする (#1006) */
  const buildCacheRef = useRef<Record<"cdl" | "yaml", BuildCacheEntry | null>>({ cdl: null, yaml: null });
  // 2026-07-24 architectural refactor = parts を cdl DSL から完全切離、 独立 overlay 化。
  // cdl は base (Client/API/DB) のみ compile、 parts は React state で管理 + 独立 SVG overlay で描画。
  // これにより cdl の auto-layout / re-routing / label 再配置が parts drop/drag で発火せず、
  // base 図の全 lane / arrow / label は 100% 静止 (user 要求「勝手な移動全部削除」 の root architecture)。
  type OverlayPart = { id: string; kind: string; posX: number; posY: number; scale: number; rotate: number; bg?: string; posW?: number; posH?: number; item: CatalogItem };
  const [overlayParts, setOverlayParts] = useState<OverlayPart[]>([]);
  // 2026-07-24 multi selection (Task #86) = 複数 element 選択 state。 overlay parts + cdl 要素 混在対応。
  // ID 命名規約: `overlay:{alias}` = parts、 `cdl-node:{id}` = cdl node、 `cdl-lane:{id}` = cdl lane、
  // `cdl-edge:{id}` = cdl edge、 `text:{content}` = arrow label 等。
  // 2026-07-25 cdl 要素 selection = `cdl:{id}` の selector を保存、 stage-level UI で bbox 再測定に使う
  // 2026-07-26 CAR-2158 = SVG text element (arrow label 等) に刻む一意 key の連番 counter
  // 2026-07-27 CAR-2156 = cdl actor drag の state。 mousedown で lane + 配下 node を snapshot し、
  // mousemove では SVG に live transform、 mouseup で全員に同 delta を書き出す。
  // 2026-07-27 CAR-2160 = 図中の文字サイズの一律倍率。 cdl の fontSize は固定値なので
  // viewport の拡大では追従しない。 CSS で属性値を上書きして一律に変える。
  const [fontScale, setFontScale] = useState(1);
  // 2026-07-25 text 編集 (double click) = 選択 text 要素の client bbox + 元テキストで stage-level input を描画。
  // Enter / blur で src.replaceAll(originalText, newText) を試みる (最小実装、 duplicate text は先出し replace)。
  // 2026-07-24 grouping (Task #88) = group id → member ids の Map。
  // Cmd+G で group 作成、 Cmd+Shift+G で解除。 group 単位で drag / hover / union bbox 表示。
  // 2026-07-24 rubber band 選択 (Task #90) = 背景 drag で area 内 全 overlay 選択。
  // 状態 = { startClientX, startClientY, currentClientX, currentClientY } を rubber band drag 中保持。
  // 2026-07-24 Undo / Redo (Feature 1) = src の history stack。 過去 50 世代保持、 Cmd+Z で戻る、 Cmd+Shift+Z で進む。
  const historyRef = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });
  const lastCommittedSrcRef = useRef<string>("");
  // 2026-07-24 clipboard (Feature 3) = 選択 overlay parts の snapshot list を保持。 paste で+30 offset 生成。
  // 2026-07-24 context menu (Feature 4) = 右クリック時 { x, y, targetOverlayId } を保持、 menu 描画 trigger。
  // 2026-07-24 color picker (Feature 2) = 選択 overlay part の色変更 popover 表示 trigger。
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<Violation[]>([]);
  /**
   * edge の id から本文の行番号を引く表と、 それを作った時の本文 (#998)。
   *
   * 本文と対で持つ。 表だけ持つと、 入力から再描画までの間 (300ms) に押した時に古い行番号で
   * 書き換える = たまたま edge 行を指していると、 別の行を直して「反映しました」 と出る。
   *
   * 表が空なら対応が取れていない = 自動修正は `from` / `to` / `label` の照合に落ちる。
   */
  const [edgeSource, setEdgeSource] = useState<{
    src: string;
    lines: ReadonlyMap<string, number>;
  }>({ src: "", lines: new Map() });
  const [autoFixMessage, setAutoFixMessage] = useState<string | null>(null);
  /** 書いたのに効かなかったことの知らせ。 判定は組み立て側が持ち、 ここは表示だけ */
  const [compileNotices, setCompileNotices] = useState<CompileNotice[]>([]);
  /**
   * 各要素が今どこに居るかを図に重ねて出すか。
   *
   * 座標を書く時、 今の値が見えないと数を当てるしかない。 出発点を見せて、 そこから
   * 直せるようにする。 常時出すと図が読めなくなるので切り替えにする。
   */
  const [showPositions, setShowPositions] = useState(false);
  /**
   * 舞台に方眼を出すか。 **既定は出さない** (#1141)。
   *
   * 方眼は設計 (`docs/design/app.pen`) に無く、 実装だけが足していた。 実画素で測ると罫が
   * 1.33、 名札の面が 1.47 で、 背景と図がほぼ同じ強さで鳴っていた。 加えて図の中身
   * (生存線 / 矢印) も線なので、 同じ種類のものが画面全体に敷き詰められる。
   *
   * 掴んで動かせる合図として要る場面はあるので、 消すのではなく切り替えにする。
   * 出す時は罫ではなく点にする = 点は線と競合しない。
   */
  const [showGrid, setShowGrid] = useState(false);

  /** 対応可 warning 数 (edge-label offset で fix 可能な 3 axis のみ)、 button state 制御用 */
  // 判定は `lib/auto-fix-offsets` に集約する。 以前は同じ判定を handleAutoFix と 2 箇所に
  // 書いており、 表示件数と実際に当たる件数がずれる余地があった (#382)。
  const fixableWarningCount = useMemo(() => countFixableWarnings(warnings), [warnings]);

  /**
   * 自動で直せるものが 0 件の時の案内を、実際に出ている直せない軸から組み立てる。
   * 固定文言にすると、別の軸の指摘が出ている時に的外れな直し方を示す (#394 sweep で検出)。
   * 文の組み立ては `lib/axis-names` が持つ (#1796)。
   */
  const unfixableAxisHint = useMemo(
    () =>
      直せない軸の案内(
        Array.from(new Set(warnings.filter((w) => !FIXABLE_WARNING_AXES.has(w.axis)).map((w) => w.axis))),
      ),
    [warnings],
  );
  const [search, setSearch] = useState("");
  const [activeSample, setActiveSample] = useState(SAMPLES[0].label);
  const [isDark, setIsDark] = useState(false);

  /**
   * sidebar tab (SAMPLES vs parts、 CAR-1646)。 default = "samples" で従来 UX 維持、
   * user が "parts" tab に切替えると loadPartsItems() が dynamic import で発火し、
   * 部品の一覧 (CdlDiagram AST) が sidebar に populate される。 drag source として
   * draggable=true を付け、 canvas 側 onDrop で parts-serializer 経由で src 置換する。
   */
  const [sidebarTab, setSidebarTab] = useState<"samples" | "parts" | "syntax">("samples");
  /**
   * 狭い画面で脇の一覧を出しているか (#1070)。
   *
   * 脇の一覧は幅 220px 固定で、狭い画面ほど本体 (記法欄と絵) だけが削られていた
   * (実測 = 375px で記法欄 155px)。 700px 以下では脇を畳んで本体に全幅を渡し、
   * この状態で出し入れする。 広い画面では常に出ているので、この値は使われない
   * (CSS 側が `@media` で畳む幅を決める)。
   */
  const [sideOpen, setSideOpen] = useState(false);
  const sideRef = useRef<HTMLElement | null>(null);
  const sideToggleRef = useRef<HTMLButtonElement | null>(null);
  /**
   * 脇の一覧を畳む。 中に focus が居たら出し入れのボタンへ戻す (#1070 Round 2)。
   *
   * 畳んだ一覧は `visibility: hidden` で触れなくなるため、 中に focus を残したまま閉じると
   * 行き先を失って body に落ちる。 そこから Tab を押すと画面の先頭からやり直しになる。
   */
  const closeSide = useCallback((): void => {
    setSideOpen(false);
    const active = document.activeElement;
    if (active instanceof HTMLElement && sideRef.current?.contains(active)) {
      sideToggleRef.current?.focus();
    }
  }, []);
  const [partsItems, setPartsItems] = useState<CatalogItem[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsLoadFailed, setPartsLoadFailed] = useState(false);
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
  /**
   * CAR-1678 = YAML tab 側の「最後に programmatic に load した src」 追跡。
   * tab 切替時の dirty 判定 (yamlSrc.trim() !== yamlLastLoadedSrcRef.current.trim()) で使う。
   * default = DEFAULT_YAML_SRC、 URL 経由の share 復元経路は本 PR 対象外 (spec § out)。
   */
  const yamlLastLoadedSrcRef = useRef<string>(DEFAULT_YAML_SRC);
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

  /**
   * CAR-1678 = YAML tab の dirty 判定 (yamlSrc.trim() !== yamlLastLoadedSrcRef.current.trim())。
   * CDL 側 confirmReplaceIfDirty と対称、 tab 切替時のみ使うので独立 callback にせず inline 呼出でも可、
   * ただし CDL / YAML 両方向で同じ「Unsaved changes will be lost. Continue?」 message を出したいので
   * 共通化しやすい形に括り出す (spec AC 2 の form SSOT)。
   */
  const confirmTabSwitchIfDirty = useCallback((): boolean => {
    const cdlDirty = src.trim() !== (lastLoadedSrcRef.current ?? "").trim();
    const yamlDirty = yamlSrc.trim() !== (yamlLastLoadedSrcRef.current ?? "").trim();
    // 切替元 tab の dirty 判定に基づき confirm を出す (切替後 tab の buffer は保持される)。
    const sourceDirty = activeTab === "cdl" ? cdlDirty : yamlDirty;
    if (!sourceDirty) return true;
    // spec AC 2 = `Unsaved changes will be lost. Continue?` の文言 SSOT。
    // native confirm dialog なので Playwright test は page.on("dialog") で捕捉する。
    return window.confirm("Unsaved changes will be lost. Continue?");
  }, [activeTab, src, yamlSrc]);

  const handleTabSwitch = useCallback((next: "cdl" | "yaml"): void => {
    if (next === activeTab) return;
    if (!confirmTabSwitchIfDirty()) return;
    setActiveTab(next);
    // 切替後 tab の error banner はリセットして clean state で再 render に入る
    if (next === "yaml") {
      setError(null);
    } else {
      setYamlError(null);
    }
  }, [activeTab, confirmTabSwitchIfDirty]);

  // parts tab 切替時に 1 回だけ dynamic import で parts を load (CategoryPage と同経路、 CAR-1613)。
  // codex-review PR #413 MAJOR fix = partsLoadFailed で終了状態を保持、 失敗後は明示的な reset
  // (samples tab に切替) までは自動再試行しない。 無限 retry loop を防ぐ。
  // cancelled guard は使わない ... dep 変化で cleanup 発火 → promise callback が cancelled=true 判定
  // で setPartsItems 呼ばない React footgun を回避するため、 単純に partsLoadFailed flag のみで制御。
  // 本文が種類を書いている時も読み込む (#1022)。 一覧を開くまで読まない形だと、共有 URL で
  // 開いた本文の見本が中身のないまま組み立てられ、別名がそのまま箱になる
  // (実測 = `achievement` を置いた本文が `ach` という名前の箱になった)。
  // 種類を書いていない本文では読み込まないので、起動の重さは変わらない
  const needsPartsForSrc = useMemo(
    () => (activeTab === "yaml" ? yamlMayUseParts(yamlSrc) : srcMayUseParts(src)),
    [activeTab, src, yamlSrc],
  );
  useEffect(() => {
    const wanted = sidebarTab === "parts" || needsPartsForSrc;
    if (!wanted || partsItems.length > 0 || partsLoading || partsLoadFailed) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPartsLoading(true);
    loadPartsItems()
      // 部品の頁には部品を箱に使う見本も並ぶ (#1973)。 部品の欄に並べるのは部品そのものだけ
      .then((items) => setPartsItems(items.filter((it) => 部品の図か(it.id))))
      .catch((e) => {
        // 失敗しても editor 本体は動かす、 sidebar のみ空表示 + hint 出す + 失敗 flag を立てて再試行禁止
        console.error("[CdlEditor] parts load failed", e);
        setPartsLoadFailed(true);
        setDropHintWithReset(
          `見本を読み込めませんでした。 ${部品の呼び名}の一覧を開き直すと再試行します。`,
          8000,
        );
      })
      .finally(() => setPartsLoading(false));
  }, [sidebarTab, needsPartsForSrc, partsItems.length, partsLoading, partsLoadFailed, setDropHintWithReset]);

  // 一覧 tab に切替えた時だけ再試行を許す (#1022)。
  //
  // 以前は samples tab で解除していたが、本文起点の読み込みは既定の samples tab で走るため、
  // 失敗 → 解除 → 再発火の輪になっていた (本文を触らなくても要求が出続ける)。
  // 一覧を開く操作は user の明示的な意思なので、そこだけで解除する
  const prevSidebarTabRef = useRef(sidebarTab);
  useEffect(() => {
    const prev = prevSidebarTabRef.current;
    prevSidebarTabRef.current = sidebarTab;
    if (sidebarTab === "parts" && prev !== "parts" && partsLoadFailed) {
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
    // 必須の群。 一致しなければ分類なし
    return label.match(/\(([^)]+)\)/)?.[1] ?? "other";
  };

  const groupedSamples = useMemo(() => {
    // 束ねた後の並びは空から始まるので、`SAMPLES` の「必ず 1 件以上」 とは別の型で持つ
    const groups: Record<string, EditorSample[]> = {};
    for (const s of filteredSamples) {
      const cat = categorize(s.label);
      const 束 = (groups[cat] ??= []);
      束.push(s);
    }
    return groups;
  }, [filteredSamples]);
  const timerRef = useRef<number | null>(null);

  // pan/zoom state
  const [transform, setTransform] = useState({ tx: 0, ty: 0, scale: 1 });
  const transformRef = useRef(transform);
  useEffect(() => { transformRef.current = transform; }, [transform]);
  // 表示合わせは初回と見本の切替でしか走らない (毎回走らせると user の拡大と移動が戻る)。
  // 依存に入れずに最新の値を読むため ref に写す
  const overlayPartsRef = useRef<OverlayPart[]>([]);
  useEffect(() => { overlayPartsRef.current = overlayParts; }, [overlayParts]);
  const worldOriginRef = useRef({ x: 0, y: 0 });

  // パーツを描く大きさ (#937)。 中で配置計算を回すので、 render のたびに数えると移動中の
  // 1 frame に載る (実測 = 80 件で 160 回 0.74ms)。 パーツが変わった時だけ数えて、
  // style と表示合わせで同じ 1 つを見る。
  //
  // ここに渡すのは **伸縮する前** の図枠。 SVG は図枠を `preserveAspectRatio="xMidYMid meet"`
  // で収めるため、縦横で違う比の枠を渡しても中身は縦横同じ率でしか伸びない (実測 =
  // `大きさ: 2000,300` で枠が 2625 になっても中身は 716 のままだった、#1018)。
  // 伸縮は下の `transform` で縦横別に掛ける
  const partSizes = useMemo(
    () => new Map(overlayParts.map((p) => [p.id, partRenderSize(p.item.diagram)])),
    [overlayParts],
  );
  // `大きさ:` と `倍率:` を合成した伸縮。 縦横で率が違うので `transform` 側で掛ける
  // (#1018 / #1026)。 上限は合成した後に 1 度だけ掛かる (組み立て側と同じ関数)
  const partScales = useMemo(
    () =>
      new Map(
        overlayParts.map((p) => [p.id, partScaleFactor(p.item.diagram, p.posW, p.posH, p.scale)]),
      ),
    [overlayParts],
  );

  // 図全体の倍率。 cdl が SVG に載せる値と同じ規則で `diagram` から出す。
  // DOM を読まないので render 中に確定し、 overlay parts と図が同じ frame で揃う。
  // 描画も座標変換もこの 1 つを使う (別々に持つと片方だけ古くなる)。
  const diagramK = normalizeScale(diagram?.viewport?.scale);

  // 図全体の倍率。 overlay parts の world 座標を client 座標へ直す時に要る。
  //
  // cdl の SVG は 1 world unit = k px で描かれる。 overlay parts は同じ world 座標に置くので、
  // parts 側も k を掛けないと図だけが伸びて parts が取り残される。 client との往復では
  // pan の拡大率と合わせた `pan × k` が world→client の係数になる。
  const diagramScaleRef = useRef(1);
  /** overlay parts の div 参照。 DSL の `bg:` を実際の図形に当てる時に使う。 */
  const overlayRefs = useRef<Record<string, HTMLDivElement | null>>({});
  // 2026-07-26 CAR-2158 correctness fix = overlay parts の bg を実 SVG shape に適用する。
  // 旧実装は DSL に bg を書くだけで canvas に反映されず、 color picker が「押しても何も起きない」 状態だった。
  // catalog 由来の diagram は共有 object なので mutate せず、 render 後の DOM に fill を上書きする経路を採る。
  //
  // 対象 shape の選び方が肝で、 「最大面積」 だけで選ぶと achievement の透明背景 rect が当たり、
  // 円形の parts が四角く塗り潰される (visual regression で実測。 baseline を採用せず本 fix に至った)。
  // そのため「実際に色を塗られている shape」 = fill 属性が none / transparent 以外のものに限定し、
  // その中で最大面積のものを主要 shape とみなす。
  // 2026-07-27 CAR-2160 = 矢印とラベルに透明な当たり判定を敷く。
  //
  // cdl の矢印は stroke 4px の線で、 正確に click するのが実質不可能。 ラベルの text も
  // 当たり判定がグリフの輪郭しかなく、 文字の隙間や周囲の余白では反応しない。
  // 描画は変えずに掴める範囲だけを広げる (詳細 = `lib/svg-hit-area.ts`)。
  /**
   * 舞台の要素。 控えと状態の 2 つで持つ。
   *
   * 控え (`previewRef`) は、舞台を測る関数と効果が依存に持たずに読むためのもの。
   * 状態 (`stageEl`) は、舞台に重ねる表示 (`PhaseChrome`) へ渡すためのもの = 控えは最初の描画で
   * `null` のままで、埋まっても描き直しが起きないので渡せない (#1143)。
   *
   * **この 3 つは、控えを読む効果より前に置く** (#2020)。 後ろに置くと、控えを読む効果が先に
   * 書かれた形になり、静的検査が「効果が読んだ後に書き換えている」 と読む。
   */
  const previewRef = useRef<HTMLDivElement>(null);
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const setStage = useCallback((el: HTMLDivElement | null) => {
    previewRef.current = el;
    setStageEl(el);
  }, []);

  // 文字倍率を SVG に反映する。 再 render で SVG が作り直されるたびに当て直す。
  useEffect(() => {
    const svg = stageSvgOf(previewRef.current);
    if (svg) applyFontScale(svg, fontScale);
  });

  const applyOverlayBg = useCallback((parts: readonly OverlayPart[]): void => {
    for (const p of parts) {
      // bg 未指定 かつ 過去にも override していない parts は触らない (走査コスト削減)
      const div = overlayRefs.current[p.id];
      if (!div) continue;
      if (!p.bg && !div.querySelector("[data-original-fill]")) continue;
      const best = findPaintedShape(div);
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
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  // 2026-07-24 fix = finalize 時に clearLiveTransform を遅延実行するための ref。
  // drag 開始時の hoveredHandle.rect を save = drag 中 rect 追従計算の基準点
  // viewBoxCompensation は「勝手な移動」 で user 意図 (drop 位置ぴったり) を破壊するため削除。

  // ref 経由で state を読む (useEffect deps 頻繁変化で listener 再登録の性能問題 + stale closure 回避)
  // DSL 本文の取り消し / やり直し。
  //
  // CodeMirror は自前の履歴を持つため、 入力欄に焦点がある間はそちらが処理する。 ここが効くのは
  // 焦点が入力欄の外にある時 (見本を読み込んだ直後など) で、 `confirmReplaceIfDirty` の確認文が
  // 案内している取り消し経路がこれにあたる。
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable || t.closest?.(".cm-content"))) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key !== "z" && e.key !== "Z") return;
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
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `setSrcSilent` は `useState` の setter をそのまま別名にしたもので書き換わらない。
    // 書いても登録し直しは起きないが、書かないと静的検査が「古い値を掴むかもしれない」 と読む
  }, [setSrcSilent]);


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
      // 必須の群。 一致した以上必ず取れる
      const presetSlug = presetMatch?.[1];
      if (presetSlug !== undefined) {
        const targetSlug = decodeURIComponent(presetSlug);
        const sample = SAMPLES.find((s) => s.slug === targetSlug);
        if (sample) {
          // hash 経路 = URL 遷移 = user 意図確定と扱い confirm skip、 lastLoadedSrcRef のみ更新
           
          setSrc(sample.code);
          lastLoadedSrcRef.current = sample.code;
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setActiveSample(sample.label);
          return;
        }
        // 対応 sample なし = user 通知 (silently default load を明示的に伝える)
         
        setAutoFixMessage(
          `${分類の呼び名}「${targetSlug}」 に対応する編集できる見本は未登録です。 既定の見本 (${SAMPLES[0].label}) で開きます。`,
        );
        window.setTimeout(() => setAutoFixMessage(null), 8000);
      }
    } catch {
      // decodeURIComponent が malformed URI で throw する可能性、 fall through で decodeShare を試す
    }

    const restored = decodeShare(hash);
    if (restored) {
       
      setSrc(restored);
      lastLoadedSrcRef.current = restored;
       
      setActiveSample("共有URL");
    }
    // `setSrc` は空の依存で作るので書き換わらない (以下 3 箇所とも同じ)
  }, [location.hash, setSrc]);

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
    const offsetByEdge = buildAutoFixOffsets(warnings);
    if (offsetByEdge.size === 0) {
      // user feedback: 対応可能な warning がない、 inline banner で表示 (alert は browser 依存)
      // unfixableAxisHint と同じ filter (非 fixable のみ列挙) で対称性を担保、 fixable axis の
      // regex mismatch は別 UI で表出させる (misleading message 回避)。
      const unsupportedAxes = Array.from(
        new Set(warnings.filter((w) => !FIXABLE_WARNING_AXES.has(w.axis)).map((w) => w.axis)),
      );
      setAutoFixMessage(まとめて直せない案内(unsupportedAxes));
      window.setTimeout(() => setAutoFixMessage(null), 10000);
      return;
    }
    // 書き戻しは `lib/auto-fix-dsl` に集約する。 component の中にあった間、 editor を丸ごと
    // 描かないと確かめられず、 経路が丸ごと壊れても判定側の test は通った (#992)。
    // 表は組み立てた時の本文に紐づく。 入力の途中で押された時は照合だけに落とす = 古い行番号で
    // 別の行を書き換えないため。
    const lines = usableEdgeLines(edgeSource, src);
    const result = applyOffsetsToFlow(src, diagram.edges, diagram.nodes, offsetByEdge, lines);
    if (result.src !== null) setSrc(result.src);

    // 件数は **実際に書けた数** で出す。 対応する行が見つからなかった分まで数えると、 本文が
    // 変わっていないのに「反映しました」 と出る (#992 の codex review)。
    const failed = result.unmatched.length;
    setAutoFixMessage(
      failed === 0
        ? `${result.applied.length} 件の線の名札の位置を記法に書き戻しました。`
        : `${result.applied.length} 件を記法に書き戻しました。 ${failed} 件は本文の該当行が見つからず書き戻せていません (記法を書き換えた直後は再描画を待ってから押してください)。`,
    );
    window.setTimeout(() => setAutoFixMessage(null), failed === 0 ? 6000 : 10000);
  }, [warnings, diagram, src, edgeSource, setSrc]);

  // test 用 side channel = src の full text を window mirror に同期 (E2E で CodeMirror virtual
  // scrolling を bypass して full buffer 検証する経路、 CAR-1646、 production では読み手なし)
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as { __cdlEditorSrc?: string }).__cdlEditorSrc = src;
  }, [src]);

  // CAR-1678 = YAML tab 側の window mirror + active tab の露出 (E2E 検証用 side channel、 production では読み手なし)
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as { __cdlEditorYamlSrc?: string }).__cdlEditorYamlSrc = yamlSrc;
    (window as unknown as { __cdlEditorActiveTab?: string }).__cdlEditorActiveTab = activeTab;
  }, [yamlSrc, activeTab]);

  // CAR-1657 = parts catalog を CdlEditor 側で load、 textDslToDiagram に inject する経路。
  // parts identifier (arc-gauge / wave-gauge 等) を kind field で書ける unified syntax の compile 時
  // lookup 用。 loadPartsItems が partsItems state を populate する useEffect と同 tab 切替 trigger 利用。
  // 一覧の作り方は、部品を箱に使う見本の file と同じ関数を通す (#1973)
  const partsCatalog = useMemo(
    () => 部品の一覧を作る(partsItems.map((item) => item.diagram)),
    [partsItems],
  );

  /**
   * 組み立てた図を画面に載せ、 位置関係を検査する (#1006)。
   *
   * 3 つの入口 (本文欄 / YAML 欄 / 埋め込み JSON) が同じことをしていた。 それぞれで
   * 組み立て → 検査 → 図枠の原点と 3 度配置を計算していたため、 1 か所にまとめて
   * 組み立ての結果を使い回す。
   *
   * 組み立てに失敗したら投げる。 図を載せる前に捕まえたいので、 ここでは握らない。
   */
  const commitBuilt = useCallback((d: CdlDiagram, built: BuildResult, notices: CompileNotice[]): void => {
    buildCacheRef.current[activeTab] = {
      key: buildKey(activeTab, src, yamlSrc, partsItems.length, locale),
      diagram: d,
      laid: built.laid,
      warnings: built.warnings,
      notices,
    };
    setLaid(built.laid);
    setDiagram(d);
    setWarnings(built.warnings);
    setCompileNotices(notices);
  }, [activeTab, src, yamlSrc, partsItems.length, locale]);

  /** 組み立てて載せるまでを 1 度に済ませる経路 (測った配置を途中で使わない入口向け) */
  // **集めた知らせをそのまま渡す**。 空配列を渡していたため、 YAML 欄で集めた知らせが捨てられ
  // ていた (review 指摘)。 呼出側が集めていないなら空でよいが、 集めたなら渡す
  const applyDiagram = useCallback((d: CdlDiagram, notices: CompileNotice[] = []): void => {
    const 言語を当てた図 = 図に画面の言語を当てる(d, locale);
    commitBuilt(言語を当てた図, buildAndValidate(言語を当てた図), notices);
  }, [commitBuilt, locale]);

  // src 変更時 debounce (CDL = 300ms 従来通り、 YAML = 500ms spec AC 3) で parse + render
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    // YAML 欄に入った時点で読み取りの取得を始める (#1007)。 待機 (500ms) の中で初めて
    // 呼ぶと、 必ず 500ms 待ってから 42KB の取得が始まる = 待機と通信が並ばない。
    // ここでの失敗は握る (実際の表示は下の経路が受け持つ)
    if (activeTab === "yaml") void loadYamlAdapter().catch(() => undefined);
    // 欄を切り替えただけで中身が変わっていないなら、 覚えてある図を戻すだけにする (#1006)。
    // 組み立ては図の規模に比例して重く、 往復のたびに計算し直すと画面が止まる
    const key = buildKey(activeTab, src, yamlSrc, partsItems.length, locale);
    const cached = buildCacheRef.current[activeTab];
    if (cached && cached.key === key) {
      setLaid(cached.laid);
      setDiagram(cached.diagram);
      setWarnings(cached.warnings);
      setCompileNotices(cached.notices);
      // 覚えてあるのは組み立てに成功した結果だけ。 誤りの表示を残すと、 図は正しいのに
      // 前の失敗の帯が出たままになる (実測 = 正しい本文 → 壊れた本文 → 元に戻す で再現)
      if (activeTab === "yaml") setYamlError(null);
      else setError(null);
      return;
    }
    const debounceMs = activeTab === "yaml" ? 500 : 300;
    timerRef.current = window.setTimeout(() => {
      if (activeTab === "yaml") {
        // CAR-1678 = YAML tab は yaml-adapter.ts (js-yaml.load → jsonToDiagram) 経由で bridge。
        // parse / validation error は preview 上部の error banner (yamlError state) に表示、
        // 前回 render (diagram) は消さない (spec AC 4 = 「前回 render は消えず維持」)。
        //
        // 読み取りの実装は初回だけ読み込む (#1007)。 戻ってきた時に本文や欄が変わっていたら
        // 何もしない = 古い入力の結果で新しい図を上書きしない。
        const requestedSrc = yamlSrc;
        void loadYamlAdapter()
          .then(({ yamlToDiagram }) => {
            // 届くまでの間に本文が変わっていたら捨てる。 待機が明けて取得を始めた後に
            // 書き換えると、 次の待機が明ける前に古い方が届く = 一瞬だけ古い図が出る
            // (実測 = 照合を外すと `onlyfirst` の図が描かれた)
            if (yamlSrcRef.current !== requestedSrc || activeTabRef.current !== "yaml") return;
            // 読めない値や捨てた矢印の知らせは、 記法欄と同じく YAML 欄でも出す
            const yamlNotices: CompileNotice[] = [];
            const result = yamlToDiagram(requestedSrc, {
              partsCatalog,
              onNotice: (n) => yamlNotices.push(n),
            });
            if (result.ok) {
              try {
                // 絞り込みは本文欄と同じ関数を通る (`applyDiagram` の中)。 別々に書くと、
                // 片方だけ直した時に同じ図なのに欄によって出る警告が変わる。
                applyDiagram(result.diagram, yamlNotices);
                setYamlError(null);
                setError(null);
              } catch (e) {
                // compile 側 throw = validation kind に丸め (jsonToDiagram 通過後の layout error)、
                // 前回 diagram は残す (spec AC 4 の spirit を compile error にも適用)。
                setYamlError({
                  kind: "validation",
                  line: null,
                  message: e instanceof Error ? e.message : String(e),
                  reason: null,
                });
              }
            } else {
              // parse or validation error = banner 更新、 diagram は残す (前回 render 保持)
              setYamlError(result.error);
            }
          })
          .catch((e: unknown) => {
            // 読み込み自体に失敗した形 (通信断など)。 黙って描かれないと故障に見える
            if (yamlSrcRef.current !== requestedSrc || activeTabRef.current !== "yaml") return;
            setYamlError({
              kind: "validation",
              line: null,
              message: `YAML の読み取りを読み込めませんでした。 頁を開き直してください (${e instanceof Error ? e.message : String(e)})`,
              reason: null,
            });
          });
        return;
      }
      try {
        // CAR-1657 = 旧 #!parts JSON escape hatch は backward compat 経路 (deprecated、 auto-convert 前提)。
        // 既 share URL / user が保存した buffer に marker が残っている可能性があり、 open 時は
        // 従来通り render 継続する (次回 drop で actors syntax に置換される)。
        // 新規 drop は parts kind syntax (actors: に kind = parts identifier) を使う。
        // 埋め込んだ図の定義は記法の解析を通らないため、 大きさの上限も通らない (#1005)。
        // 読み取る前に本文の大きさを見る
        const markerOversize = describeOversizeSource(src);
        if (markerOversize) {
          setError(markerOversize);
          return;
        }
        if (isPartsMarker(src)) {
          const part = deserializePart(src);
          if (!part) {
            setError(`${PARTS_MARKER} の印はあるが JSON が壊れています。 印を消して記法に戻すか、 JSON を直してください。`);
            return;
          }
          // 記法を通らないので要素数の上限も効かない。 図の側で数えて止める (#1005)
          const partOversize = describeOversize({ elements: countDiagramElements(part), bytes: 0 });
          if (partOversize) {
            setError(partOversize);
            return;
          }
          // 埋め込まれた図は本文にそのまま書ける = `fill` に何でも入れられる。
          // この経路は cdl の組み立てを直接呼ぶため dragon 側の出口の検査を通らないので、
          // ここで図の外を指す値を落とす (#1004)
          for (const dropped of stripExternalPaint(part)) {
            setDropHintWithReset(`図の外を指す値 (${dropped.path}) は色として使えないため外しました。`, 6000);
          }
          // 組み立てに失敗する図は描画前に捕まえる (`applyDiagram` が投げ、 外側の catch が受ける)
          applyDiagram(part);
          setError(null);
          return;
        }
        // 2026-07-24 architectural refactor = parts を cdl から切離して独立 overlay で管理。
        // extractPartsFromSrc で src から parts 行を除いた baseSrc を作り、 cdl には base のみ渡す。
        // 抽出した parts は overlayParts state に set、 独立 SVG overlay として描画する。
        // 部品しかない本文は抜かずに組み立て、重ねる部品には書いた上書きを当てる (#1973)。
        // 組み立ては呼ぶたびに知らせと矢印の行の器を作り直す = 使わなかった方の知らせを混ぜない
        const {
          built: { diagram: d, notices, edgeLines },
          parts,
          抜かずに描いた部品,
          lineMap,
        } = 図と重ねる部品に分ける(src, partsCatalog, partsItems, (本文) => {
          // 書いたのに効かなかったこと (`位置: Web の下` が順序図で効かない等) を受け取る。
          // 判定は組み立て側が持つ。 画面側は受け取って出すだけにして、 規則を二重に持たない
          const notices: CompileNotice[] = [];
          // edge が本文のどの行から来たかを受け取る (#998)。 preset によっては書いた step と
          // 生成される edge が一致しないため、 これが無いと自動修正が別の行を書き換える。
          const edgeLines = new Map<string, number>();
          const diagram = 図に画面の言語を当てる(
            textDslToDiagram(本文, {
              partsCatalog,
              onNotice: (n) => notices.push(n),
              onEdgeSource: (id, line) => edgeLines.set(id, line),
            }),
            locale,
          );
          return { diagram, notices, edgeLines };
        });
        // 組み立て側が返すのはパーツの行を抜いた本文の座標。 元の本文に戻してから持つ。
        setEdgeSource({ src, lines: toSourceLines(edgeLines, lineMap) });
        // パーツの置き場所は図が組み上がってから決まる。 相対で書いたパーツは基準の実座標が
        // 要るため、 図を測ってから置く。 位置を書いていないパーツは従来通り格子に並ぶ。
        //
        // パーツが無い図では測らない。 配置計算は 1 回 1ms 前後かかるので、 入力ごとに
        // 使わない計算を走らせない
        // 重ねるパーツは本文から抜いてから組み立てるので、 組み立て側の上限に数えられない。
        // 抜いた分を足して見ないと、 パーツを 2,000 件超置いた本文が素通りする (#1005)。
        //
        // 数えるのは **見本の中身** で、置いた件数ではない (#1015)。 件数で数えると、
        // 2,001 個の箱を持つ見本 1 件が「1 要素」 として素通りする
        const withPartsOversize = describeOversize({
          elements:
            countDiagramElements(d) +
            parts.reduce((acc, p) => acc + countDiagramElements(p.item.diagram), 0),
          bytes: 0,
        });
        if (withPartsOversize) throw new Error(withPartsOversize);
        // 実体が操作パネルの部品だけの見本は、置いても図には出ない (#1017)。 場所は確保される
        // ため「置いたのに見えない」 状態になる。 黙って置くと綴りを疑うことになるので知らせる。
        // 組み立て側で部品ごと描いた本文 (部品だけ / 縦列に置く部品がある) も同じく知らせる (#1980)
        for (const p of [...parts, ...抜かずに描いた部品]) {
          if (partDrawsInDiagram(p.item.diagram)) continue;
          notices.push({
            kind: "part-not-drawn",
            actor: p.id,
            line: 0,
            message: `"${p.id}" (${p.kind}) は図の中に描く部品を持たないため、置いても図には出ません。`,
            hint: "操作盤の部品として使う見本です",
          });
        }
        // 先に組み立てて配置を得る。 パーツの置き場所を測る `measureActorBoxes` も配置を要るので、
        // ここで作った 1 つを共有する (渡さないと中でもう一度計算する、 #1006)
        const built = buildAndValidate(d);
        setOverlayParts(
          parts.length === 0
            ? []
            : placeParts(parts, measureActorBoxes(d, built.laid), partWorldSize, partsBaseBottom(built.laid), (n) => {
                // パーツは記法の解析より前に抜き出すので組み立て側の知らせに乗らない。
                // 同じ場所に出すため、 ここで同じ形に直して混ぜる
                notices.push({
                  kind: "relative-position-ignored",
                  actor: n.part,
                  line: 0,
                  message: n.message,
                  hint: "actors: に書いた名前を基準にする",
                });
              }),
        );
        // 位置関係の検査は組み立ての中で走り、 「label が edge から遠すぎ」「node bbox に埋まる」
        // 等を editor 上部に出す。 組み立てに失敗する図は上の `buildAndValidate` が投げ、
        // 下の catch が受ける。
        commitBuilt(d, built, notices);
        setError(null);
      } catch (e) {
        setError((e as Error).message);
        setWarnings([]);
        // 図が出せない時は前回の知らせを残さない。 今の本文と対応しない行番号が出る
        setCompileNotices([]);
      }
    }, debounceMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // パーツ一覧は遅延して読み込まれる。 本文だけを見ていると、 読み込みが終わっても
    // 抽出をやり直さないため、 パーツが図の中の空の箱のまま残る (実測 = 共有 URL で
    // パーツ入りの本文を開くと、 一覧を開いた後も箱のままだった)
    //
    // `commitBuilt` が見る 5 つ (`activeTab` / `src` / `yamlSrc` / `partsItems` / `locale`) は
    // 既にこの一覧に在るので、書き足しても走る回数は増えない。
    // `setDropHintWithReset` は空の依存で作るので書き換わらない
  }, [
    src,
    yamlSrc,
    activeTab,
    partsCatalog,
    partsItems,
    locale,
    applyDiagram,
    commitBuilt,
    setDropHintWithReset,
  ]);

  /**
   * 図の world 座標の原点が、 画面上のどこに来るか。
   *
   * 図枠 (`viewBox`) は内容の外接矩形なので、 左上は原点ではない (実測 = `-20 68` から始まる)。
   * 図に重ねるもの (現在位置の札 / パーツ) は、 この分を引かないと図枠の余白だけずれる。
   *
   * 札とパーツで同じ値を使う。 別々に計算すると、 片方だけ直した時にずれが残る。
   */
  const worldOrigin = useMemo(() => {
    // 配置は組み立ての時に済んでいる。 ここで測り直すと、 同じ図に対して 2 度計算する (#1006)
    if (!laid) return { x: 0, y: 0 };
    return { x: laid.viewBox.x, y: laid.viewBox.y };
  }, [laid]);
  // 控えへ写すのは描き終えた後にする (#2020)。 読むのは `handleFit` だけで、その関数が走るのは
  // 押した時と図が変わった後の効果 = どちらも描き終えた後なので、写す時機を遅らせても同じ値を読む。
  // 控えに写すのは `handleFit` の作り直しを避けるため (作り直すと下の効果が登録し直しになる)
  useEffect(() => {
    worldOriginRef.current = worldOrigin;
  }, [worldOrigin]);

  /**
   * 各要素が今どこに居るか。 切り替えが入の時だけ測る。
   *
   * 測り方は相対指定を解く時と同じ関数を使う (`measureActorBoxes`)。 画面側で別に数え直すと、
   * 画面に出る座標と記法に書ける座標がずれる。
   */
  const positionMarks = useMemo(() => {
    // 札は押すと本文欄の `src` に座標を書く。 YAML 欄で出すと、 映していない本文の方が
    // 書き換わる = 押した相手と変わる中身が食い違うので、 本文欄の時だけ出す。
    if (activeTab !== "cdl" || !showPositions || !diagram) return [];
    try {
      const vb = worldOrigin;
      // 配置は組み立ての時に済んでいる。 渡さないと中でもう一度計算する (#1006)
      return [...measureActorBoxes(diagram, laid ?? undefined)]
        // 本文に書き戻せる相手だけに出す。 図には矢印の説明のように名前を持つが `actors:` に
        // 行を持たない要素もあり、 札を出すと押しても何も起きない。 書き込みを実際に試して、
        // 通る相手だけを対象にする (名前の見分け方を画面側で持ち直さずに済む)
        .filter(([name]) => writeActorPosition(src, name, 0, 0) !== null)
        .map(([name, box]) => ({
          name,
          cx: box.cx,
          cy: box.cy,
          left: (box.cx - vb.x) * diagramK,
          top: (box.cy - vb.y) * diagramK,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return [];
    }
  }, [activeTab, showPositions, diagram, laid, diagramK, src, worldOrigin]);

  /**
   * 今の位置を座標として本文に書く。
   *
   * 自動配置のままだと本文に座標が無く、 動かす出発点が無い。 見えている値をそのまま
   * 書き込めば、 そこから数を足し引きして調整できる。
   */
  const handleWritePosition = useCallback(
    (name: string, cx: number, cy: number): void => {
      const next = writeActorPosition(src, name, cx, cy);
      if (next === null) {
        setDropHintWithReset(`"${name}" の行が本文に見つかりませんでした。`, 4000);
        return;
      }
      setSrc(next);
      setDropHintWithReset(`"${name}" に 位置: ${Math.round(cx)},${Math.round(cy)} を書きました。`, 4000);
    },
    [src, setSrc, setDropHintWithReset],
  );

  // Fit handler ... preview 領域に SVG の bounding を合わせる。
  // SVG が render される度 + sample 切替時に自動 Fit。
  const handleFit = useCallback((): void => {
    if (!previewRef.current) return;
    const svg = stageSvgOf(previewRef.current);
    if (!svg) return;
    const previewRect = previewRef.current.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    if (!vb || vb.width === 0 || vb.height === 0) {
      setTransform({ tx: 0, ty: 0, scale: 1 });
      return;
    }
    const px = applySvgPixelSize(svg, vb, diagramK);
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
    const wrapPx = wrap ? wrap.getBoundingClientRect().height : px.h;
    const currentScale = transformRef.current.scale > 0 ? transformRef.current.scale : 1;
    const wrapUnscaled = wrapPx / currentScale;
    const headerUnscaled = Math.max(0, wrapUnscaled - px.h);
    const phaseChromeStyle = getComputedStyle(previewRef.current);
    const topSpace = Number.parseFloat(
      phaseChromeStyle.getPropertyValue("--cdl-phase-chrome-top-space"),
    );
    const bottomSpace = Number.parseFloat(
      phaseChromeStyle.getPropertyValue("--cdl-phase-chrome-bottom-space"),
    );
    // 上下は覆いが求める量を下限にする。大きい方を両側に使えば、中央配置を保ったまま
    // 札と足のどちらにも必要な空きを確保できる。
    const verticalPadding = Math.max(
      previewRect.height * PADDING_RATIO,
      Number.isFinite(topSpace) ? topSpace : PHASE_CHROME_TOP_SPACE_PX,
      Number.isFinite(bottomSpace) ? bottomSpace : PHASE_CHROME_BOTTOM_SPACE_PX,
    );
    const availableW = previewRect.width * (1 - PADDING_RATIO * 2);
    const availableH = previewRect.height - verticalPadding * 2;
    // 図の外に置いたパーツも視野に入れる。 パーツは cdl の図とは別に重ねて描くので、
    // 図の枠だけを見ると画面の外に出たまま戻せない (実測 = 自動配置のパーツが画面の下に出た)
    //
    // ただし数えるのは本文欄を映している時だけ。 パーツは本文欄の記述から作るもので、
    // YAML 欄では描いていない。 数に入れると、 見えないパーツを囲もうとして図が極端に
    // 縮む (実測 = 本文欄で遠くに置いたパーツが YAML 欄の倍率を壊した)
    const fitParts = activeTab === "cdl" ? overlayPartsRef.current : [];
    const bounds = fitBounds(
      { width: px.w, height: px.h },
      headerUnscaled,
      fitParts.map((p) => {
        const size = partWorldSize(p);
        return {
          left: (p.posX - worldOriginRef.current.x) * diagramK,
          top: (p.posY - worldOriginRef.current.y) * diagramK,
          width: size.w * diagramK,
          height: size.h * diagramK,
        };
      }),
    );
    const fitScale = Math.min(availableW / bounds.width, availableH / bounds.height);
    // 収める倍率が文字を潰す所まで下がったら、 読める大きさで止める (#1084)。
    // 横長の図では幅が上限を決めるため、 縦の空白を残したまま極端に縮む (実測 = 見本
    // 「利用者登録」 が 23%、 枠の高さ 840 のうち 97 しか使わず文字が 4.6px)。
    //
    // 下限 10px で箱が枠から出る図に限り 8px まで譲る (#1102)。 譲っても収まらないなら譲らない
    // = 文字が小さくなるだけで見えない箱は見えないままになる。 判定の詳細は
    // `readableScaleForFrame` の説明を参照
    const scale = readableScaleForFrame({
      fitScale,
      minFontWorld: smallestFontWorld(svg),
      diagramK,
      boxesRight: boxesRightPx(svg, vb.width > 0 ? px.w / vb.width : 0, vb.x),
      boundsLeft: bounds.left,
      boundsWidth: bounds.width,
      frameWidth: previewRect.width,
    });
    // 位置決めは軸ごとに独立して決める (#1088)。 収まる軸は中央、 収まらない軸は始点に寄せる。
    // 読める下限 (#1084) で収まらなくなった図を中央に置くと左右が同じだけ隠れ、 図の始まりが
    // 見えない (実測 = 見本「利用者登録」 で左右 343px ずつ)。 読む人は左から読む
    const tx = axisOffset({
      frame: previewRect.width,
      content: bounds.width * scale,
      origin: bounds.left * scale,
    });
    const ty = axisOffset({
      frame: previewRect.height,
      content: bounds.height * scale,
      origin: bounds.top * scale,
    });
    setTransform({ tx, ty, scale });
  }, [diagramK, activeTab]);

  // 図が描き直される度に表示サイズを焼き直し、 図枠が動いた分を pan で打ち消す。
  //
  // (1) 表示サイズ = `handleFit` が決めているが、 fit は初回と sample 切替でしか走らない
  //     (毎回走らせると user の pan / zoom が戻る)。 一方で図全体の倍率は fit を挟まずに
  //     変わるので、 ここで焼き直さないと倍率を変えても画面が変わらない。
  //
  // (2) 図枠の打ち消し = cdl の viewBox は内容の外接矩形に自動追従する。 要素を右へ動かすと
  //     枠の左端も右へ寄るため、 画面上では「動かした要素はその場、 他が左へずれる」 になる。
  //     枠の原点が動いた分だけ pan を逆に振ると、 触っていない要素が画面に留まり、 動かした
  //     要素だけが動く。
  //
  //     補正量の算出は `src/lib/viewbox-anchor.ts` (成立条件と不変性を test で固定)。
  const prevViewBoxRef = useRef<ViewBoxOrigin | null>(null);
  useEffect(() => {
    // 倍率は描画と同じ値 (`diagramK`) を使う。 SVG の `data-cdl-scale` からも同じ値が読めるが、
    // 2 系統あると effect が途中で return した回に ref だけ古く残る。 描画と変換で別の倍率を
    // 使うと、 部品の位置が図と合わなくなる。
    diagramScaleRef.current = diagramK;
    if (!diagram || !previewRef.current) return;
    const svg = stageSvgOf(previewRef.current);
    if (!svg) return;
    const vb = svg.viewBox.baseVal;
    if (!vb || vb.width === 0 || vb.height === 0) return;
    applySvgPixelSize(svg, vb, diagramK);

    const next: ViewBoxOrigin = { x: vb.x, y: vb.y, k: diagramK };
    const comp = panCompensation(prevViewBoxRef.current, next, transformRef.current.scale);
    prevViewBoxRef.current = next;
    if (!comp) return;
    setTransform((t) => ({ ...t, tx: t.tx + comp.dtx, ty: t.ty + comp.dty }));
  }, [diagram, diagramK]);

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
    // 別の図に切り替わるので、 前の図の枠を打ち消しの基準に使わない。
    // 直後の fit が pan を上書きするため実害は出ないが、 基準としては無意味な値になる。
    prevViewBoxRef.current = null;
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

  /**
   * 図そのものを factor 倍する。
   *
   * `viewport` の laneWidth / laneGap / nodeGap をまとめて書き換える。 この 3 つで
   * 箱の幅・横の間隔・縦の間隔が同時に動くため、 図が歪まずに拡大縮小される
   * (node の posW だけ書くと横しか変わらず縦長になる)。
   */
  const scaleWholeDiagram = (factor: number): void => {
    setSrc((prev) => setDiagramScale(prev, readDiagramScale(prev) * factor));
  };

  // 2026-07-24 全削除 = applyAutoAdjustDuringDrag / applyGuidelinesDuringDrag / clearAutoAdjustShifts
  // (auto 補正 / 補助線 / shift clear) 3 関数を削除。 user 「勝手な移動全部削除」 の core、 呼出経路 +
  // 定義本体を根絶する。 canvas-pivot-auto-adjust / canvas-pivot-guideline lib への依存も削除済。

  // 2026-07-25 double click text 編集 = SVG <text> を狙って click したら inline HTML input を開く。
  // 図の平行移動。 図そのものを触る操作 (掴んで動かす / 大きさを変える / 選ぶ) は
  // DSL 入力だけで書く方針に合わせて外したため、 stage に残るのは表示位置の移動だけ。
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    // toolbar の click は移動として扱わない
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

  const handleMouseUp = (): void => {
    setDragging(false);
  };

  const handleReset = useCallback((): void => handleFit(), [handleFit]);
  const handle100 = (): void => {
    // 図を特定できない時は何もしない。 倍率だけ 1 にして原点へ寄せると、 図がどこにあるか
    // 分からないまま表示位置だけ動く (#985 で Fit / リセットと挙動を揃えた)。
    if (!previewRef.current) return;
    // 中央寄せして scale=1.0 にする
    const svg = stageSvgOf(previewRef.current);
    const previewRect = previewRef.current.getBoundingClientRect();
    if (!svg) return;
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

  // Esc で Reset。 脇の一覧を出している間は、 まず一覧を閉じる (#1070)。
  // 出した一覧を Esc で閉じられないと、 図の位置まで戻る操作が同じ key に重なって驚く
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== "Escape") return;
      if (sideOpen) {
        closeSide();
        return;
      }
      handleReset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleReset, sideOpen, closeSide]);

  // 写した結果を知らせで出す (#1082)。 変更前は `getElementById("editor-share-btn")` を
  // 探して文字を差し替えていたが、 その id を持つ要素はどこにも無く常に `null` = 押しても
  // 画面が何も変わらなかった (実測)。 id を足す方向にはしない = このボタンは絵だけなので、
  // 中身を書き換えると絵が消える
  //
  // 写す口が無い環境 (secure context でない / 埋め込みで塞がれている) では
  // `navigator.clipboard` 自体が `undefined` で、 参照した瞬間に同期例外になる。 `.catch()` は
  // Promise が作られないため呼ばれない = 知らせも逃げ道も出ないまま無反応に戻る。 `try` の中で
  // 参照して、 同期例外と writeText の失敗を同じ道に集める
  const handleShare = async (): Promise<void> => {
    if (typeof window === "undefined") return;
    const encoded = encodeShare(src);
    const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ type: "success", title: "URL をコピーしました" });
    } catch {
      // 写せない時は知らせを出した上で URL 自体も見せる。 知らせだけだと、 写せなかった人が
      // URL を手に入れる道が残らない
      toast({ type: "error", title: "コピーに失敗しました" });
      window.prompt("共有 URL をコピーしてください:", url);
    }
  };

  const getPreviewSvg = (): SVGSVGElement | null => {
    if (typeof document === "undefined") return null;
    // 書き出しも図の `<svg>` を名指しで取る。 「最初の svg」 だと panel の widget を書き出す
    // (#985)。 見つからなければ null を返し、 誤ったものを書き出さない。
    return stageSvgOf(document.querySelector(".v4-editor-preview"));
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
    // 紙の色は **画面から読む** (#1060)。 値を書くと CSS 側を変えた時にここだけ古くなり、
    // 書き出した絵の紙だけが別の色になる (実測 = 画面の紙を `#3a2f22` に変えた後も、
    // ここは `#241c14` のままで箱との差が `ΔL* 4.7` に潰れていた)。
    ctx.fillStyle = stagePaperColor(previewRef.current);
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
    // 見本を選んだら脇を畳む (#1070)。 狭い画面では脇が本体に重なるので、 開いたままだと
    // 選んだ図が見えない。 広い画面では脇は常に出ているのでこの値は使われない
    closeSide();
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
   * 本文欄 (`src`) を書き換える操作を止めるかどうか。
   *
   * これらの操作は YAML 欄を映している間も本文欄の中身を変える。 押した人からは
   * 画面が何も変わらないように見えるのに、 見えていない方が書き換わっている
   * (実測 = YAML 欄で「新規ファイル」 を押すと本文欄だけ `untitled` に置き換わった)。
   *
   * YAML 側に同じことをする経路はまだ無いので、 押せなくして食い違いを断つ。
   */
  const cdlWriteDisabled = activeTab !== "cdl";
  /** 押せない時に出す理由。 button の `title` に入れる (無効の理由が読めないと故障に見える) */
  const cdlOnlyHint = "本文欄 (CDL) でのみ使えます";

  return (
    <div className={`v4-editor${sideOpen ? " side-open" : ""}`}>
      {/* 狭い画面で脇の一覧を出している間、 本体側を押したら閉じる (#1070)。
          畳んだ一覧の外を押して閉じられないと、 出した後に本体へ戻る道が無くなる。 */}
      {sideOpen && (
        <button
          type="button"
          className="v4-editor-side-backdrop"
          aria-label="一覧を閉じる"
          // 押しても focus を受け取らない。 受け取ると、 閉じた瞬間に自分が消えて focus が
          // 行き場を失う (実測 = body に落ちる)。 押す前の位置に残す
          onMouseDown={(e) => e.preventDefault()}
          onClick={closeSide}
          data-testid="editor-side-backdrop"
        />
      )}
      {/* ── 左 sidebar (new file + tabs = SAMPLES / parts、 CAR-1646 で parts tab 追加) ── */}
      <aside className="v4-editor-side" id="editor-side" ref={sideRef}>
        <button
          type="button"
          className="v4-editor-side-new"
          onClick={handleNewFile}
          disabled={cdlWriteDisabled}
          title={cdlWriteDisabled ? cdlOnlyHint : undefined}
          data-testid="editor-new-file"
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
            data-testid="editor-samples-tab"
          >
            見本
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sidebarTab === "parts"}
            className={`v4-editor-side-tab ${sidebarTab === "parts" ? "active" : ""}`}
            onClick={() => setSidebarTab("parts")}
            data-testid="editor-parts-tab"
          >
            {部品の呼び名}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sidebarTab === "syntax"}
            className={`v4-editor-side-tab ${sidebarTab === "syntax" ? "active" : ""}`}
            onClick={() => setSidebarTab("syntax")}
            data-testid="editor-syntax-tab"
          >
            記法
          </button>
        </div>
        {sidebarTab === "syntax" && (
          <SyntaxReference
            // YAML 欄では差し込み先が映っていないので、 一覧は読めるが押しても入らない形にする
            // (`onInsert` 未指定で click と説明書きが外れる)
            onInsert={
              cdlWriteDisabled
                ? undefined
                : (code) => {
                    // 末尾に足す。 どこに入れるかを当てるより、 足した後に user が動かす方が確実。
                    setSrc((prev) => (prev.endsWith("\n") ? `${prev}${code}\n` : `${prev}\n${code}\n`));
                  }
            }
          />
        )}
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
                      disabled={cdlWriteDisabled}
                      title={cdlWriteDisabled ? cdlOnlyHint : undefined}
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
                  ? "最初の読み込みを待っています…"
                  : `検索条件に一致する${部品の呼び名}がありません。`}
              </div>
            )}
            {/* 説明 (`subtitle`) を出す画面は、導いた動きの一文も併せて出す (#1053)。
                出さないと説明だけが単独で読まれ、動きの誤りに気付けない */}
            <div className="v4-editor-side-list">
              {filteredParts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`v4-editor-side-item v4-editor-side-part ${activeSample === p.title ? "active" : ""}`}
                  data-testid={`editor-part-item-${p.id}`}
                  data-part-id={p.id}
                  title={cdlWriteDisabled ? cdlOnlyHint : `${p.subtitle}\n${p.motionNote}`}
                  disabled={cdlWriteDisabled}
                  onClick={() => {
                    // CAR-1657 click = drop と同 semantic = actors: append (additive)。
                    // actors: block なし = REPLACE fallback (新規 diagram 作成、 confirm dialog 経由)
                    const kindValue = p.id.startsWith("parts-") ? p.id.slice(6) : p.id;
                    const aliasBase = kindValue.replace(/[^a-zA-Z0-9]/g, "");
                    const existingNames = collectActorNamesFromSrc(src);
                    // 1 件目は番号を付けない。 `achievement1: achievement` のように同じ語が
                    // 2 度並ぶのは読みにくく、 1 件しか置かない時の番号は意味を持たない。
                    let alias = aliasBase;
                    for (let i = 2; i <= 1000 && existingNames.has(alias); i++) {
                      alias = `${aliasBase}${i}`;
                    }
                    // 変えられる値を縦に並べて出す。 何を変えられるかが行から読めないと、
                    // 書く人は状態名 (`bg` / `stFill` / `v` 等) を推測できない。
                    //
                    // 色は `色:` にまとめる。 状態名はパーツごとに違うが、 書く人が覚える
                    // 理由がない (どの状態に入れるかは組み立て時に決まる)。
                    // 判定は組み立て側と同じものを使う (`isColorValue`)。 別々に持つと、
                    // 画面が色欄として出した状態を組み立て側が色扱いしない食い違いが起きる
                    const colorState = p.diagram.states.find((st) => isColorValue(st.initial));
                    const otherStates = p.diagram.states.filter((st) => !isColorValue(st.initial));
                    const detailLines: string[] = [`      kind: ${kindValue}`];
                    if (colorState && isColorValue(colorState.initial)) {
                      detailLines.push(`      色: "${colorState.initial}"`);
                    }
                    for (const st of otherStates) {
                      const v = st.initial;
                      detailLines.push(`      ${st.id}: ${typeof v === "string" ? `"${v}"` : String(v)}`);
                    }
                    // 座標は書かない。 自動配置に任せる方が、 位置を決める処理が画面上の
                    // 実寸を走査する形に戻らずに済む。 位置を変えたい時は DSL に posX / posY を書く。
                    const newActorLine = detailLines.length === 1
                      ? `  - ${alias}: ${kindValue}`
                      : [`  - ${alias}:`, ...detailLines].join("\n");
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
                      setDropHintWithReset(`部品「${p.title}」 を新しい図として読み込みました。`, 4000);
                    }
                  }}
                >
                  {p.title.replace(/^parts/, "").replace(/([A-Z])/g, " $1").trim() || p.id}
                </button>
              ))}
            </div>
            <div className="v4-editor-side-hint">
              押すと actors: に 1 行追加します。 位置は自動で決まるので、 変えたい時は記法に posX / posY を書きます。
            </div>
          </div>
        )}
      </aside>

      {/* ── 中央 DSL editor (CodeMirror) ── */}
      <section className="v4-editor-code">
        <header className="v4-editor-bar">
          {/* 脇の一覧の出し入れ (#1070)。 広い画面では CSS で隠す (常に出ているため) */}
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon v4-editor-side-toggle"
            ref={sideToggleRef}
            onClick={() => setSideOpen((v) => !v)}
            aria-label={`見本と${部品の呼び名}の一覧`}
            aria-expanded={sideOpen}
            aria-controls="editor-side"
            title={`見本と${部品の呼び名}の一覧を出す`}
            data-testid="editor-side-toggle"
          >
            <IconList />
          </button>
          {/* CAR-1678 = CDL / YAML tab 切替 (2 tab のみ、 spec § in scope の 2 tab semantics) */}
          <div className="v4-editor-tabs" role="tablist" aria-label="editor format tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "cdl"}
              className={`v4-editor-tab ${activeTab === "cdl" ? "active" : ""}`}
              onClick={() => handleTabSwitch("cdl")}
              data-testid="editor-tab-cdl"
            >
              CDL
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "yaml"}
              className={`v4-editor-tab ${activeTab === "yaml" ? "active" : ""}`}
              onClick={() => handleTabSwitch("yaml")}
              data-testid="editor-tab-yaml"
            >
              YAML
            </button>
          </div>
          {/* 名前は span で包む (#1063)。 裸の文字のままだと、 親が `inline-flex` なので
              `text-overflow: ellipsis` が効かず、 狭い画面で省略記号なしに切れる。 */}
          <span className="v4-editor-bar-file">
            <span className="v4-editor-bar-file-name">
              {activeTab === "cdl" ? `▲ ${activeSample}.dragon` : "▲ diagram.yml"}
            </span>
          </span>
          <span className="v4-editor-bar-gap" />
          {/* 共有 URL は本文欄の中身だけを載せる。 YAML 欄で押すと、 映していない本文が
              相手の画面に開く (実測) ので、 YAML を載せる経路ができるまで押せなくする */}
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon"
            onClick={() => {
              void handleShare();
            }}
            disabled={cdlWriteDisabled}
            aria-label="共有URL"
            title={cdlWriteDisabled ? cdlOnlyHint : "この図を開ける URL を作って写す"}
            data-testid="editor-share"
          >
            <IconShare />
          </button>
          <div className="v4-editor-export">
            <button
              type="button"
              className="v4-editor-bar-btn v4-editor-bar-btn-icon v4-editor-bar-btn-primary"
              disabled={!diagram}
              aria-label="書き出す"
              aria-haspopup="menu"
              data-testid="editor-export"
              title="画像として書き出す (SVG / PNG)"
            >
              <IconExport />
            </button>
            <div className="v4-editor-export-menu">
              <button type="button" onClick={handleExportAnimatedSvg} disabled={!diagram}>
                <strong>動く SVG</strong>
                <span>単一ファイルで動く / GitHub README / Notion</span>
              </button>
              <button type="button" onClick={handleExportStaticSvg} disabled={!diagram}>
                <strong>静止 SVG</strong>
                <span>今の段の静止 1 こま / Keynote / PDF</span>
              </button>
              <button type="button" onClick={() => void handleExportPng()} disabled={!diagram}>
                <strong>PNG</strong>
                <span>点で描く 2 倍の密度 / Slack / Twitter</span>
              </button>
            </div>
          </div>
        </header>
        <div className="v4-editor-code-body" data-testid={`editor-code-body-${activeTab}`}>
          <CodeMirror
            value={activeTab === "yaml" ? yamlSrc : src}
            theme={isDark ? v4EditorThemeDark : v4EditorThemeLight}
            extensions={
              // 記法のタブは記法の分解器で色を付ける (#1310)。 汎用 YAML 文法と併用すると
              // 同じ語に 2 つの色が当たって後勝ちになるため、記法では YAML 文法を外す。
              // `yaml` タブは記法ではない別形式なので従来どおり YAML 文法を使う
              activeTab === "yaml"
                ? [yaml(), syntaxHighlighting(isDark ? v4HighlightDark : v4HighlightLight)]
                : [記法の色分け]
            }
            onChange={(v) => (activeTab === "yaml" ? setYamlSrc(v) : setSrc(v))}
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
        {activeTab === "yaml" && yamlError && (
          <pre className="v4-editor-error" data-testid="editor-yaml-error">
            {formatYamlError(yamlError)}
          </pre>
        )}
        {activeTab === "cdl" && error && <pre className="v4-editor-error">{error}</pre>}
        {/* 書いたのに効かなかったこと。 誤りではない (図は出る) が、 黙って捨てると
            書いた人が理由を追えないので、 行番号と直し方を添えて出す。
            本文の行番号を指すので、 その本文を映していない YAML 欄では出さない。 */}
        {/* **欄で絞らない**。 知らせは記法欄でも YAML 欄でも同じように出す (review 指摘) */}
        {!error && !yamlError && compileNotices.length > 0 && (
          <div className="v4-editor-notices" data-testid="editor-compile-notices">
            {compileNotices.map((n, i) => (
              // 同じ名前 / 同じ行で種類だけ違う知らせが並ぶ (箱を持たない見本に効かない相対指定を
              // 書いた形)。 種類と並び順まで入れないと React が行を取り違える
              <div key={`${n.kind}-${n.actor}-${n.line}-${i}`} className="v4-editor-notice">
                {/* 行が分からない知らせ (パーツ経由) では番号を出さない */}
                {n.line > 0 && <span className="v4-editor-notice-line">L{n.line}</span>}
                <span className="v4-editor-notice-text">{n.message}</span>
                {n.hint && <span className="v4-editor-notice-hint">{n.hint}</span>}
              </div>
            ))}
          </div>
        )}
        {/* 位置関係の警告は図に対する検査なので、 どちらの欄で書いた図でも出す。 */}
        {!error && warnings.length > 0 && (
          <div className="v4-editor-warnings">
            <div className="v4-editor-warnings-head">
              <span className="v4-editor-warnings-badge">
                {warnings.filter((w) => w.severity === "error").length > 0
                  ? "位置の関係が崩れている"
                  : `位置関係の警告 ${warnings.length}件`}
              </span>
              <span className="v4-editor-warnings-hint">
                {fixableWarningCount > 0
                  ? `記法の labelOffsetX / labelOffsetY で箱との位置を調整できます (自動で直せるもの ${fixableWarningCount} 件)`
                  : unfixableAxisHint}
              </span>
              <button
                type="button"
                className="v4-editor-warnings-apply"
                onClick={handleAutoFix}
                // 書き戻し先は本文欄。 YAML 欄の図に出た警告を押すと、 その図を持たない
                // 本文の方が書き換わる (または「反映できない」 と出る) ので押せなくする
                disabled={fixableWarningCount === 0 || cdlWriteDisabled}
                data-testid="editor-auto-fix"
                title={
                  cdlWriteDisabled
                    ? cdlOnlyHint
                    : fixableWarningCount > 0
                      ? `${fixableWarningCount} 件の名札の位置を記法にまとめて書き戻す`
                      : "自動で直せる注意はありません"
                }
              >
                {fixableWarningCount > 0 ? `一括反映 (${fixableWarningCount}) ✨` : "直せるものなし"}
              </button>
            </div>
            {autoFixMessage && (
              <div
                role="status"
                style={{
                  padding: "8px 12px",
                  marginTop: "8px",
                  borderRadius: "var(--d-r-1)",
                  background: "var(--d-accent-soft)",
                  color: "var(--d-accent)",
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
            <span className="v4-editor-live" />
            {/* 名前は span で包む (#1063)。 裸の文字だと縮まず、 狭い画面で 55px を占め続ける */}
            <span className="v4-editor-bar-file-name">実況表示</span>
          </span>
          <span className="v4-editor-bar-gap" />
          {/* 2026-07-27 CAR-2160 = 図そのものの拡大縮小。
              zoom (表示倍率) と違い、 DSL に書き出されるので export / 共有にも反映される。
              文字サイズは cdl 側の固定値なので追従しない = 箱と間隔だけが変わる。 */}
          {/* アイコンだけを置く (#1063)。 文字のままだと 12 個で 811px を占め、
              操作列 (491px) から 320px はみ出して右端が押せなかった。

              **名前は `aria-label` で必ず持たせる**。 アイコンには文字が無いので、
              付けないと読み上げで「ボタン」 としか読まれず何をするか分からない。
              `title` はホバーで出る説明で、 押す前に何が起きるかを書く。 */}
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon"
            data-testid="editor-font-scale-down"
            onClick={() => setFontScale((v) => clampFontScale(v / 1.15))}
            aria-label="文字を小さく"
            title="図の中の文字を一律で小さくする"
          >
            <IconTextDown />
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon"
            data-testid="editor-font-scale-up"
            onClick={() => setFontScale((v) => clampFontScale(v * 1.15))}
            aria-label="文字を大きく"
            title="図の中の文字を一律で大きくする"
          >
            <IconTextUp />
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon"
            data-testid="editor-diagram-scale-down"
            onClick={() => scaleWholeDiagram(1 / 1.25)}
            disabled={cdlWriteDisabled}
            aria-label="図を縮小"
            title={cdlWriteDisabled ? cdlOnlyHint : "図そのものを縮める (表示倍率ではなく記法に書き戻す)"}
          >
            <IconShrink />
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon"
            data-testid="editor-diagram-scale-up"
            onClick={() => scaleWholeDiagram(1.25)}
            disabled={cdlWriteDisabled}
            aria-label="図を拡大"
            title={cdlWriteDisabled ? cdlOnlyHint : "図そのものを広げる (表示倍率ではなく記法に書き戻す)"}
          >
            <IconGrow />
          </button>
          <button
            type="button"
            className={`v4-editor-bar-btn v4-editor-bar-btn-icon ${showPositions ? "is-on" : ""}`}
            data-testid="editor-toggle-positions"
            aria-pressed={showPositions}
            onClick={() => setShowPositions((v) => !v)}
            // 札は本文欄にしか書き戻せない。 YAML 欄では押しても何も出ないので押せなくする
            disabled={cdlWriteDisabled}
            aria-label="位置を表示"
            title={cdlWriteDisabled ? cdlOnlyHint : "各要素が今どこに居るかを図に重ねて出す"}
          >
            <IconPositions />
          </button>
          <button
            type="button"
            className={`v4-editor-bar-btn v4-editor-bar-btn-icon ${showGrid ? "is-on" : ""}`}
            data-testid="editor-toggle-grid"
            aria-pressed={showGrid}
            onClick={() => setShowGrid((v) => !v)}
            aria-label="方眼を表示"
            title="舞台に点の方眼を出す (掴んで動かす時の目安)"
          >
            <IconGrid />
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon"
            data-testid="editor-fit"
            onClick={handleFit}
            aria-label="枠に合わせる"
            title="図が枠に収まるように表示を合わせる"
          >
            <IconFit />
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon"
            data-testid="editor-reset"
            onClick={handleReset}
            aria-label="表示を戻す"
            title="表示を最初の状態に戻す (Esc)"
          >
            <IconReset />
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon"
            data-testid="editor-actual-size"
            onClick={handle100}
            aria-label="等倍表示"
            title="等倍で表示する"
          >
            <IconActualSize />
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon"
            data-testid="editor-zoom-out"
            onClick={handleZoomOut}
            aria-label="縮小"
            title="表示を縮小する"
          >
            <IconZoomOut />
          </button>
          <button
            type="button"
            className="v4-editor-bar-btn v4-editor-bar-btn-icon"
            data-testid="editor-zoom-in"
            onClick={handleZoomIn}
            aria-label="拡大"
            title="表示を拡大する"
          >
            <IconZoomIn />
          </button>
          <span className="v4-editor-bar-zoom">{scaleDisplay}</span>
        </header>
        <div
          className={`v4-editor-stage ${showGrid ? "has-grid" : ""}`}
          ref={setStage}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          data-testid="editor-preview-stage"
        >
          {dropHintMessage && (
            <div className="v4-editor-drop-hint" role="status">{dropHintMessage}</div>
          )}
          <PhaseChrome stage={stageEl} phases={laid?.phases} />
          <div
            className="v4-editor-pan"
            style={{
              transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
              transformOrigin: "0 0",
            }}
          >
            {diagram ? (
              <div className="v4-editor-svg-wrap" style={{ position: "relative" }}>
                {/* 配置は組み立ての時に済んでいる。 渡さないと描画側がもう一度計算する (#1006) */}
                <CdlDiagramView hideMiniPhaseIndicator diagram={diagram} laid={laid ?? undefined} hideHeader emitGeometryWarn={import.meta.env.DEV} />
                {/* 図全体の倍率。 cdl の SVG は 1 world unit = k px で描かれるので、 同じ world 座標に
                    置く overlay parts と group 枠にも同じ k を掛ける。 掛けないと図だけが伸びて
                    parts がその場に取り残される。 倍率の丸めは cdl と同じ規則を使う。 */}
                {/* group visual = 各 group の member union bbox を 点線 border で表示 (Task #88)。
                    member が overlay parts の時 posX/Y/scale から bbox 計算、 cdl node は 別途 selector で拾う。 */}
                
                {/* parts overlay は cdl の SVG とは別に描く。 cdl は parts を知らないので base 図に
                    影響しない。 位置と大きさは world 座標を `diagramK` 倍して置く (cdl の SVG が
                    1 world unit = diagramK px で描かれるため、 上の注記を参照)。 */}
                {/* 各要素の現在位置。 押すとその座標を本文に書き込み、 調整の出発点にする。
                    図の倍率 (`diagramK`) を掛けるのは overlay parts と同じ理由で、 cdl の SVG が
                    1 world unit = diagramK px で描かれるため。 */}
                {positionMarks.map((m) => (
                  <button
                    key={`pos-${m.name}`}
                    type="button"
                    className="v4-editor-pos-mark"
                    data-testid={`editor-pos-mark-${m.name}`}
                    data-pos-name={m.name}
                    style={{
                      left: `${m.left}px`,
                      top: `${m.top}px`,
                      // 表示倍率の逆数を掛けて、 札だけは画面上の大きさを保つ。 掛けないと
                      // 図を縮めた時に札も一緒に縮んで数字が読めない (実測)
                      transform: `translate(-50%, -50%) scale(${1 / transform.scale})`,
                    }}
                    title={`"${m.name}" に 位置: ${Math.round(m.cx)},${Math.round(m.cy)} を書く`}
                    onClick={() => handleWritePosition(m.name, m.cx, m.cy)}
                  >
                    {Math.round(m.cx)},{Math.round(m.cy)}
                  </button>
                ))}
                {/* 重ねるパーツは本文欄の `src` から取り出したもの。 YAML 欄の図に重ねると、
                    その図が持たない部品が乗って見える (実測 = 本文欄でパーツを置いてから
                    欄を切り替えると残った) ので、 本文欄の時だけ出す。 */}
                {activeTab === "cdl" && overlayParts.map((p) => {
                  // 事前に数えた大きさ。 取れない形は CSS の既定値に任せる
                  const partSize = partSizes.get(p.id) ?? { w: 800, h: 600 };
                  // `大きさ:` と `倍率:` を合成した率。 上限は合成後に 1 度だけ掛かっている
                  const partScale = partScales.get(p.id) ?? { x: 1, y: 1 };
                  const k = diagramK;
                  return (
                    <div
                      key={p.id}
                      data-overlay-part={p.id}
                      ref={(el) => { overlayRefs.current[p.id] = el; }}
                      style={{
                        position: "absolute",
                        // 図枠の起点を引いてから倍率を掛ける。 引かないと図の余白の分だけ
                        // パーツが図からずれる (実測 = 縦に 68 world ぶん上へ出た)
                        left: `${(p.posX - worldOrigin.x) * diagramK}px`,
                        top: `${(p.posY - worldOrigin.y) * diagramK}px`,
                        // 描く大きさを見本の図枠に合わせる (#937)。 渡さないと CSS の
                        // 既定値 (800x600) で描かれ、 置き場所を決めた大きさと食い違う
                        ["--cdl-svg-w" as string]: `${partSize.w}px`,
                        ["--cdl-svg-h" as string]: `${partSize.h}px`,
                        // 倍率は置き場所を決めた時と同じ物差しを通す。 生の値を使うと
                        // `scale: 0` が「場所は等倍・画面では消える」 状態になる。
                        // `大きさ:` の伸縮は縦横で率が違うので 2 引数の形で掛ける (#1018)
                        transform: `rotate(${p.rotate}deg) scale(${partScale.x * k}, ${partScale.y * k})`,
                        transformOrigin: "0 0",
                        userSelect: "none",
                      }}
                    >
                      <CdlDiagramView hideMiniPhaseIndicator diagram={図に画面の言語を当てる(p.item.diagram, locale)} hideHeader emitGeometryWarn={false} />
                    </div>
                  );
                })}
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
