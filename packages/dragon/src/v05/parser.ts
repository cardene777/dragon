/**
 * Text DSL v0.5 parser
 *
 * 設計方針:
 * - keyword は英語のみ (title / type / actors / flow / states / animation / step / focus / tween / set / badge)
 * - 値の日本語は quote 必須 (`title: "API call"` / `step: "request" 1.5s`)
 * - YAML 風 + 短縮 keyword + 箇条書き構造
 * - Mermaid 知ってる人にもゼロ学習、 非エンジニアにも直感的
 *
 * syntax 例:
 *
 *   title: "API call"
 *   type: sequence
 *
 *   actors:
 *     - Client
 *     - API: function
 *     - DB
 *
 *   flow:
 *     - Client -> API: "GET /items"
 *     - API -> DB: "SELECT" (success)
 *
 *   states:
 *     request_count: 0
 *     row_count: 0
 *
 *   animation:
 *     - step: "request" 1.5s
 *       focus: [Client, API]
 *       tween:
 *         request_count: 0 -> 1
 *       badge: "request"
 *
 *     - step: "query" 1.5s
 *       focus: [API, DB]
 *       tween:
 *         row_count: 0 -> 20
 *       badge: "query"
 *
 * 出力は v0.4 と同じ DslDocument。 既存 compile.ts で CdlDiagram に変換できる。
 */

import type { NodeKind, Tone, EdgeStyle } from "@cardenelabs/cdl";
import { TONES, NODE_KINDS } from "@cardenelabs/cdl";
import { TONE_ALIAS, NODE_KIND_ALIAS } from "../keywords";
import { parseRelativePos, orderByDependency } from "../relative-pos";
import {
  checkValueExpression,
  isTriggerBody,
  isValueName,
  parseValueTriggerBody,
  valueNameIssue,
} from "../value-syntax";
import type {
  DslAxes,
  DslDocument,
  DslActor,
  DslDynShape,
  DslReadout,
  DslInput,
  DslActorNodeOverride,
  DslStep,
  DslAnimate,
  DslState,
  DslValue,
  DslPhase,
  DslTween,
  DslSet,
  DslError,
  PresetType,
  DslLane,
  DslGroup,
  DslViewport,
} from "../types";

export type V05ParseResult = { ok: true; doc: DslDocument } | { ok: false; errors: DslError[] };

/** 矢印を出す辺。 Text DSL / JSON validator / 公開 schema の 3 経路で同じ 4 値を使う。 */
export const EDGE_SIDE_VALUES = ["top", "right", "bottom", "left"] as const;

/**
 * 記法が受ける top-level の項目 (#1190)。
 *
 * 読めない行の案内と、記法一覧が全て載せているかの検査が、どちらもここを見る。 一覧に手で
 * 書くと、項目を足した時に案内か一覧のどちらかが取り残される (実際に `states` / `values` が
 * 一覧に 1 件も無い状態で放置されていた)。
 */
export const TOP_LEVEL_KEYS = [
  "title",
  "type",
  "actors",
  "flow",
  "states",
  "values",
  "animation",
  "viewport",
  "lanes",
  "groups",
  // 図全体を 1 箱にする図種で、 その箱の上に出す小見出し (#1247)
  "eyebrow",
  // 2 軸で仕分ける図の軸の名前 (#1251)
  "axes",
  // 値を見せる部品 (#1374)
  "readouts",
  // 読む人が動かすつまみ (#1389)
  "inputs",
] as const;

/**
 * `lanes:` / `groups:` の 1 行を読む形 (#1241)。
 *
 * **id は英数字と下線に限らない**。 組み立て側は登場人物の名前から縦列 id を作るため、
 * hyphen と日本語が入る (実測 = `type: state` で `lane-idle` / `lane-待機`、
 * `type: swimlane` で `lane-sign-up`)。 英数字と下線だけを受けていた間、
 * **自動で作られた縦列の幅や見出しを書き直す手段が無かった**。
 *
 * 受けるのは **組み立て側が作りうる字だけ** に絞る。 字と数と下線と hyphen。
 *
 * 「読み取りを壊す字以外は何でも」 にすると、`lane-idle,` のような書き間違いが
 * **別の縦列として通り**、書いた幅が黙って効かなくなる (Round 1 の指摘、実測)。
 *
 * **非 ASCII をまとめて許すのも広すぎる** (Round 2 の指摘)。 全角の読点や感嘆符、絵文字まで
 * 通ってしまう (実測 = `lane-idle、` / `lane-idle！` / `lane-idle🙂` が受かった)。
 * 字 (`\p{L}`) と数 (`\p{N}`) だけを許せば、日本語の縦列 id は通しつつ句読点は外せる。
 */
const LANE_ID_ENTRY = /^([\p{L}\p{N}_-]+)\s*:\s*\{([^}]*)\}\s*$/u;

/**
 * `id: { ... }` の 1 行を、名前と中括弧の中身に割る (#1381)。
 *
 * `LANE_ID_ENTRY` は中括弧を `[^}]*` で読むため、中身に中括弧を含む形
 * (`map: [{ value: "a" }]`) を受けられない。 部品の欄には組の並びを取るものがあるので、
 * 引用符の内側を飛ばしつつ中括弧の深さを数えて割る。
 *
 * 割れない形は `undefined` を返す。 呼び手が行番号付きで知らせる。
 */
function 名前と中括弧に割る(行: string): [string, string] | undefined {
  const t = 行.trim();
  const c = t.indexOf(":");
  if (c < 0) return undefined;
  const 名前 = t.slice(0, c).trim();
  if (!/^[\p{L}\p{N}_-]+$/u.test(名前)) return undefined;
  const 残り = t.slice(c + 1).trim();
  if (!残り.startsWith("{")) return undefined;

  let 深さ = 0;
  let 引用: string | null = null;
  let 直前: string | null = null;
  for (let i = 0; i < 残り.length; i += 1) {
    const ch = 残り[i]!;
    if (引用 !== null) {
      if (引用 === '"' && ch === "\\" && i + 1 < 残り.length) {
        i += 1;
        continue;
      }
      if (ch === 引用) 引用 = null;
      continue;
    }
    if ((ch === '"' || ch === "'") && (直前 === null || ":,{[".includes(直前))) {
      引用 = ch;
      直前 = ch;
      continue;
    }
    if (ch === "{") 深さ += 1;
    else if (ch === "}") {
      深さ -= 1;
      // 中括弧が閉じた後に文字が残る形は割らない (`{...} x`)
      if (深さ === 0) return i === 残り.length - 1 ? [名前, 残り.slice(1, i)] : undefined;
    }
    if (!/\s/u.test(ch)) 直前 = ch;
  }
  return undefined;
}

function isTopLevelKey(key: string): key is (typeof TOP_LEVEL_KEYS)[number] {
  return (TOP_LEVEL_KEYS as readonly string[]).includes(key);
}

/** 受け付ける図種。 記法一覧はここを見る。 */
export const PRESET_TYPES: ReadonlySet<PresetType> = new Set([
  "sequence",
  "flow",
  "swimlane",
  "er",
  "state",
  "topology",
  "solidity",
  "gantt",
  "class",
  "pie",
  "bar",
  "line",
  "funnel",
  "tree",
  "journey",
  "quadrant",
  "c4",
  "mind",
]);

const NODE_KIND_DEFAULT: NodeKind = "actor";

/**
 * 記法だけが持つ種類。 描画側には無いが、 図種ごとの組み立てで意味を持つ。
 *
 * `contract` / `eoa` / `multisig` / `proxy` / `library` / `interface` は Solidity 図の
 * 役割分けに、 `entity` / `state` は ER 図と状態遷移図に使う。 組み立ての段階で描画できる
 * 種類に置き換わるため、 そのまま描画側に渡ることはない。
 */
const DSL_ONLY_KINDS = [
  "entity",
  "state",
  "contract",
  "eoa",
  "multisig",
  "proxy",
  "library",
  "interface",
] as const;

/**
 * AWS などの固有名を、 同じ役割を表す汎用の種類に読み替える表。
 *
 * これらは記法が受け付けるのに描画側に無く、 書くと「kind "alb" は未対応」 とエラーになって
 * いた。 受け付けるのをやめると今度は部品名として扱われ「そんな部品はない」 と出る。 どちらも
 * 書いた人が困るだけなので、 意味の近い種類に読み替えて実際に図が出るようにする。
 *
 * 読み替え先が重なるものがある (`iam` と `kms` は権限と鍵を守る役、 `s3` と `secret` は
 * 保管する役)。 見た目が同じになるが、 役割が同じなので嘘にはならない。
 */
const INFRA_KIND_ALIAS: Record<string, NodeKind> = {
  alb: "shape-api-gateway", // 入口で振り分ける
  browser: "frontend", // 画面側
  ecs: "microservice", // コンテナ群
  iam: "admin", // 権限を守る
  kms: "admin", // 鍵を守る
  lambda: "function", // 呼ぶと動く
  rds: "database", // 表を持つ
  s3: "storage", // 置き場
  secret: "storage", // 機密の置き場
  user: "person", // 人
  container: "service", // 動かす単位 (C4 の container)
};

/**
 * 受け付ける箱の種類。 描画できる種類 (cdl の `NODE_KINDS`) に、 記法だけが持つ種類を足す。
 *
 * 以前は手書きの 31 種だった。 描画できる 90 種のうち 78 種が記法から書けず、 部品名として
 * 扱われて「そんな部品は無い」 と警告が出るだけだった。 描画側を出所に加えることで
 * 「描画できるものは書ける」 が成立する。
 */
/**
 * 記法が受理する種類の全体。 これに載っていない種類は見本 (パーツ) の候補になる。
 *
 * 画面側が「本文が見本を使っているか」 を判定するのに使う (#1022)。 手書きの一覧を
 * 別に持つと、種類が増えた時にそちらだけ取り残されて余分な読み込みが起きる。
 */
export const NODE_KIND_VALID: ReadonlySet<string> = new Set<string>([
  ...NODE_KINDS,
  ...DSL_ONLY_KINDS,
  ...Object.keys(INFRA_KIND_ALIAS),
]);

// 受理する色名は cdl 側の一覧をそのまま使う。 手書きすると cdl に色が増えた時に取り残される。
const TONE_VALID: ReadonlySet<string> = new Set<string>(TONES);

/**
 * 受理する線種。 `EdgeStyle` は型だけで実体を持たないため、 実行時の一覧はここが唯一の出どころ。
 *
 * JSON 経路も同じ集合を読む (#1304)。 別に持つと、 線種が増えた時に片方だけ取り残される。
 */
export const STYLE_VALID: ReadonlySet<string> = new Set<string>(["solid", "dotted-flow"]);

/**
 * 色の名前として書ける語の一覧 (#1304)。 知らせの `hint` に出す。
 *
 * 正規の色名 (`TONES`) と別名 (`TONE_ALIAS` の鍵) を合わせる。 手で並べると色が増えた時に
 * 取り残されるため、 どちらも実装の集合から導く。
 */
export function 書ける色名(): string[] {
  return [...new Set<string>([...TONES, ...Object.keys(TONE_ALIAS)])];
}

/**
 * 色名として読めない値を知らせる (#1304)。
 *
 * 線種を受ける場所 (矢印) と受けない場所 (箱) で hint を変える。 箱に `solid` と書いても
 * 効かないため、 使える語として案内しない。
 *
 * 矢印の丸括弧には、 説明文の一部が入り込むことがある
 * (`- A -> B: 呼び出し (非同期)` の `非同期`)。 これまでは黙って捨てられ、 **説明文から
 * 括弧の中だけが消えた図** が出ていた。 直し方が「別の語に変える」 とは限らないため、
 * 引用符で囲む道も併せて案内する。
 */
function report読めない色(
  値: string,
  line: number,
  errors: DslError[],
  opts: { 線種も受ける: boolean },
): void {
  const 語 = stripQuotes(値.trim());
  const 使える = opts.線種も受ける ? [...書ける色名(), ...STYLE_VALID] : 書ける色名();
  errors.push({
    line,
    message: opts.線種も受ける
      ? `色名か線種が読めません: "${語}"`
      : `色の名前が読めません: "${語}"`,
    hint: opts.線種も受ける
      ? `使える値 = ${使える.join(", ")}。 説明文に括弧を含めるなら \`"…"\` で囲む`
      : `使える値 = ${使える.join(", ")}`,
  });
}

type Line = {
  raw: string;
  trimmed: string;
  indent: number;
  no: number;
};

export function parseTextDslV05(src: string): V05ParseResult {
  const errors: DslError[] = [];
  const lines = tokenize(src);

  let title: string | null = null;
  let type: PresetType | null = null;
  let eyebrow: string | null = null;
  let eyebrowLine = 0;
  let axes: DslAxes | undefined = undefined;
  let axesLine = 0;
  let actors: DslActor[] = [];
  const flow: DslStep[] = [];
  let animate: DslAnimate | undefined = undefined;
  const values: DslValue[] = [];
  let viewport: DslViewport | undefined = undefined;
  let lanesMap: Record<string, DslLane> | undefined = undefined;
  let readoutsList: DslReadout[] | undefined = undefined;
  let inputsList: DslInput[] | undefined = undefined;
  let groupsMap: Record<string, DslGroup> | undefined = undefined;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trimmed || line.trimmed.startsWith("#")) {
      i += 1;
      continue;
    }
    const head = matchTopHeader(line.trimmed);
    if (!head || !isTopLevelKey(head.key)) {
      errors.push({
        line: line.no,
        message: `unknown top-level key: "${line.trimmed}"`,
        hint: `expected one of: ${TOP_LEVEL_KEYS.join(", ")}`,
      });
      i += 1;
      continue;
    }
    if (head.key === "title") {
      title = head.value ?? null;
      if (!title) {
        errors.push({ line: line.no, message: "title is required", hint: 'use `title: "..."`' });
      }
      i += 1;
      continue;
    }
    if (head.key === "eyebrow") {
      // 空で書いた形 (`eyebrow:`) は「書かなかった」 と同じにする。 空文字を残すと
      // 描画側が中身のない帯を出す
      const v = (head.value ?? "").trim();
      eyebrow = v.length > 0 ? v : null;
      eyebrowLine = line.no;
      i += 1;
      continue;
    }
    if (head.key === "type") {
      const v = (head.value ?? "").trim().toLowerCase();
      if (!PRESET_TYPES.has(v as PresetType)) {
        errors.push({
          line: line.no,
          message: `unknown type: "${v}"`,
          hint: `expected: ${Array.from(PRESET_TYPES).join(", ")}`,
        });
      } else {
        type = v as PresetType;
      }
      i += 1;
      continue;
    }
    if (head.key === "actors") {
      // 1 行で書いた形と、 続く字下げ行に項目を並べた形の両方を受け付ける
      const { items, next } = collectActorEntries(lines, i + 1, line.indent);
      actors = [];
      for (const entry of items) {
        const base = parseActor(entry[0]!, errors);
        if (base === null) {
          errors.push({
            line: entry[0]!.no,
            message: `invalid actor entry: "${entry[0]!.trimmed}"`,
            hint: "use `- Client` or `- Client: storage`",
          });
          continue;
        }
        actors.push(applyContinuationLines(base, entry.slice(1), errors));
      }
      validateRelativePositions(actors, errors);
      i = next;
      continue;
    }
    if (head.key === "flow") {
      const { items, next } = collectIndentedList(lines, i + 1, line.indent);
      let stepNo = 1;
      for (const it of items) {
        const step = parseFlowStep(it, stepNo, errors);
        if (step) {
          flow.push(step);
          stepNo += 1;
        } else {
          errors.push({
            line: it.no,
            message: `invalid flow entry: "${it.trimmed}"`,
            hint: 'use `- A -> B: "label"` or `- A -> B: "label" (success)`',
          });
        }
      }
      i = next;
      continue;
    }
    if (head.key === "states") {
      // states は inline (states: { a: 1, b: 2 }) もしくは block (states:\n  a: 1\n  b: 2)
      const inlineMatch = head.value?.trim();
      if (inlineMatch && inlineMatch.startsWith("{") && inlineMatch.endsWith("}")) {
        const inner = inlineMatch.slice(1, -1).trim();
        animate = ensureAnimate(animate, line.no);
        for (const pair of splitTopLevelCommas(inner)) {
          const st = parseStateEntry(pair, line.no);
          if (st) animate.states.push(st);
        }
        i += 1;
        continue;
      }
      const { items, next } = collectIndentedList(lines, i + 1, line.indent);
      animate = ensureAnimate(animate, line.no);
      for (const it of items) {
        const st = parseStateEntry(it.trimmed.replace(/^-\s*/, ""), it.no);
        if (st) animate.states.push(st);
        else
          errors.push({
            line: it.no,
            message: `invalid state entry: "${it.trimmed}"`,
            hint: "use `name: initial`",
          });
      }
      i = next;
      continue;
    }
    if (head.key === "values") {
      // 1 行に詰める形 (`values: { a: "..." }` / `values: a: "..."`) は受けない。 式に `,` が
      // 入る (`min({a}, {b})`) ため、 `states` が使う素朴な `,` 分割では式が壊れる。
      //
      // **`{` で始まるかを見てはいけない** (#1169)。 `values: a: "{b} + 1"` は `{` で始まらない
      // ため判定を通り抜け、 その後 `collectIndentedRaw` が次行以降しか見ないので **値が
      // 1 件も読まれずに黙って消える**。 書き間違いを黙って捨てないという `collectIndentedRaw`
      // を自前で持った理由と矛盾する。
      //
      // 同じ行に何か書いてあれば形を問わず弾く = 1 行形は全て受けないという規則そのもの。
      const inline = head.value?.trim();
      if (inline) {
        errors.push({
          line: line.no,
          message: "values は 1 行にまとめて書けない",
          hint: '式に `,` が入るため。 次の行から字下げして `waiting: "{inflow} - {done}"` の形で並べる',
        });
        i += 1;
        continue;
      }
      // `collectIndentedList` は `:` を含まない行を黙って捨てる。 捨てられると
      // 書き間違えた行が「書かなかった」 と同じになり、 値が 1 つ消えたことに気付けない
      const { items, next } = collectIndentedRaw(lines, i + 1, line.indent);
      for (const it of items) {
        const v = parseValueEntry(it.trimmed.replace(/^-\s*/, ""), it.no, errors);
        if (v) values.push(v);
      }
      i = next;
      continue;
    }
    if (head.key === "animation") {
      // animation: は step を list で並べる
      const { items: stepBlocks, next } = collectAnimationSteps(lines, i + 1, line.indent);
      animate = ensureAnimate(animate, line.no);
      for (const block of stepBlocks) {
        const ph = parsePhase(block, errors);
        if (ph) animate.phases.push(ph);
      }
      i = next;
      continue;
    }
    if (head.key === "viewport") {
      // inline mapping: viewport: { width: 1400, height: 900, laneWidth: 480, gap: 80, laneGap: 100, nodeGap: 32, labelMargin: 12 }
      const inline = head.value?.trim();
      if (inline && inline.startsWith("{") && inline.endsWith("}")) {
        const opts = parseInlineMapping(inline.slice(1, -1));
        viewport = {
          ...表で読む(VIEWPORT_VALUE_KINDS, opts, "viewport の ", line.no, errors),
          pos: { line: line.no },
        };
        i += 1;
        continue;
      }
      // block: viewport:\n  width: 1400\n  height: 900\n  ...
      const { items, next } = collectIndentedList(lines, i + 1, line.indent);
      const opts: Record<string, string> = {};
      // 知らせは **値を書いた行** を指す (#1306)。 `viewport:` の行を指すと、欄が縦に並ぶ形で
      // どの行を直せばよいか分からない
      const optLines: Record<string, number> = {};
      for (const it of items) {
        const m = it.trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.+)$/);
        if (!m) continue;
        const 欄 = m[1] ?? "";
        opts[欄] = stripQuotes((m[2] ?? "").trim());
        optLines[欄] = it.no;
      }
      viewport = {
        ...表で読む(
          VIEWPORT_VALUE_KINDS,
          opts,
          "viewport の ",
          (欄) => optLines[欄] ?? line.no,
          errors,
        ),
        pos: { line: line.no },
      };
      i = next;
      continue;
    }
    if (head.key === "axes") {
      // axes:\n  x: { left: "...", right: "..." }\n  y: { bottom: "...", top: "..." }
      //
      // **1 行にまとめて書く形は受けない** (Round 1 の指摘)。 受けないなら黙って捨てず、
      // その場で伝える = 捨てると軸を書いたつもりの本文が既定のまま描かれる (`values:` と同じ)
      if (head.value !== null && head.value.trim() !== "") {
        errors.push({
          line: line.no,
          message: "axes は 1 行にまとめて書けない",
          hint: '次の行から字下げして `x: { left: "...", right: "..." }` の形で並べる',
        });
        i += 1;
        continue;
      }
      // **`collectIndentedList` を使わない** (Round 1 の指摘)。 あちらは `:` を含まない行を
      // 黙って捨てるため、書き間違えた行が「書かなかった」 と同じになる
      const { items, next } = collectIndentedRaw(lines, i + 1, line.indent);
      axesLine = line.no;
      const 組み立て: DslAxes = {};
      for (const it of items) {
        const m = it.trimmed.match(/^(x|y)\s*:\s*\{([^}]*)\}\s*$/);
        if (!m) {
          errors.push({
            line: it.no,
            message: `invalid axes entry: "${it.trimmed}"`,
            hint: 'use `x: { left: "...", right: "..." }` or `y: { bottom: "...", top: "..." }`',
          });
          continue;
        }
        const opts = parseInlineMapping(m[2] ?? "");
        if (m[1] === "x") 組み立て.x = { left: opts.left, right: opts.right };
        else 組み立て.y = { bottom: opts.bottom, top: opts.top };
      }
      // 1 本も読めなかった形は「書かなかった」 と同じにする。 空の軸を渡すと、
      // 書いていない側の名前が空文字で描かれる
      axes = 組み立て.x !== undefined || 組み立て.y !== undefined ? 組み立て : undefined;
      i = next;
      continue;
    }
    if (head.key === "lanes") {
      // lanes:\n  l1: { x: 0, width: 320, label: "..." }\n  l2: { ... }
      const { items, next } = collectIndentedList(lines, i + 1, line.indent);
      lanesMap = {};
      for (const it of items) {
        const m = it.trimmed.match(LANE_ID_ENTRY);
        if (m) {
          const id = m[1]!;
          const opts = parseInlineMapping(m[2]!);
          lanesMap[id] = {
            id,
            ...表で読む(LANE_VALUE_KINDS, opts, `縦列 ${id} の `, it.no, errors),
            label: opts.label,
            pos: { line: it.no },
          };
        } else {
          errors.push({
            line: it.no,
            message: `invalid lane entry: "${it.trimmed}"`,
            hint: 'use `id: { x: 0, width: 320, label: "..." }`',
          });
        }
      }
      i = next;
      continue;
    }
    if (head.key === "readouts") {
      // readouts:\n  ring: { kind: percent-ring, source: total, max: 500, label: "..." }
      // 1 行にまとめた形は受けない。 黙って空の並びにすると、書いた部品が全て消えた図になる。
      if (head.value !== null && head.value.trim() !== "") {
        errors.push({
          line: line.no,
          message: "readouts は 1 行にまとめて書けない",
          hint: "次の行から字下げして `id: { kind: percent-ring, source: total, max: 100 }` の形で並べる",
        });
        i += 1;
        continue;
      }
      // `collectIndentedList` は `:` の無い行を落とす。 部品を綴り違えた行も知らせるため、
      // 字下げした行を全て読み手へ渡す。
      const { items, next } = collectIndentedRaw(lines, i + 1, line.indent);
      readoutsList = [];
      for (const it of items) {
        const m = 名前と中括弧に割る(it.trimmed);
        if (m) {
          const 読めた = 部品として読む(m[0], m[1], it.no, errors);
          if (読めた) readoutsList.push(読めた);
        } else {
          errors.push({
            line: it.no,
            message: `invalid readout entry: "${it.trimmed}"`,
            hint: "use `id: { kind: percent-ring, source: total, max: 500 }`",
          });
        }
      }
      i = next;
      continue;
    }
    if (head.key === "inputs") {
      // inputs:\n  value: { kind: slider, min: 0, max: 100, defaultValue: 50, label: "Value" }
      // 1 行にまとめた形は受けない。 黙って空の並びにすると、書いたつまみが全て消えた図になる。
      if (head.value !== null && head.value.trim() !== "") {
        errors.push({
          line: line.no,
          message: "inputs は 1 行にまとめて書けない",
          hint: "次の行から字下げして `value: { kind: slider, min: 0, max: 100, defaultValue: 50 }` の形で並べる",
        });
        i += 1;
        continue;
      }
      // `collectIndentedList` は `:` の無い行を落とす。 つまみを綴り違えた行も知らせるため、
      // 字下げした行を全て読み手へ渡す。
      const { items, next } = collectIndentedRaw(lines, i + 1, line.indent);
      inputsList = [];
      for (const it of items) {
        const m = 名前と中括弧に割る(it.trimmed);
        if (m) {
          const 読めた = つまみとして読む(m[0], m[1], it.no, errors);
          if (読めた) inputsList.push(読めた);
        } else {
          errors.push({
            line: it.no,
            message: `invalid input entry: "${it.trimmed}"`,
            hint: "use `id: { kind: slider, min: 0, max: 100, defaultValue: 50 }`",
          });
        }
      }
      i = next;
      continue;
    }
    if (head.key === "groups") {
      // groups:\n  aws: { label: "AWS", lanes: [ecs, rds] }
      const { items, next } = collectIndentedList(lines, i + 1, line.indent);
      groupsMap = {};
      for (const it of items) {
        const m = it.trimmed.match(LANE_ID_ENTRY);
        if (m) {
          const id = m[1]!;
          const opts = parseInlineMapping(m[2]!);
          const lanesList = (opts.lanes ?? "")
            .replace(/^\[|\]$/g, "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
          groupsMap[id] = {
            id,
            label: opts.label,
            lanes: lanesList,
            pos: { line: it.no },
          };
        } else {
          errors.push({
            line: it.no,
            message: `invalid group entry: "${it.trimmed}"`,
            hint: 'use `id: { label: "...", lanes: [a, b] }`',
          });
        }
      }
      i = next;
      continue;
    }
    i += 1;
  }

  if (!title)
    errors.push({ line: 1, message: "title is required", hint: 'add `title: "..."` at top' });
  if (!type)
    errors.push({
      line: 1,
      message: "type is required",
      hint: "add `type: sequence|flow|swimlane|er|state|topology|solidity|gantt|class|pie|c4|mind`",
    });

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    doc: {
      title: title!,
      type: type!,
      ...(eyebrow !== null ? { eyebrow, eyebrowPos: { line: eyebrowLine } } : {}),
      ...(axes !== undefined ? { axes, axesPos: { line: axesLine } } : {}),
      actors,
      flow,
      animate,
      ...(values.length > 0 ? { values } : {}),
      viewport,
      lanes: lanesMap,
      readouts: readoutsList,
      inputs: inputsList,
      groups: groupsMap,
      pos: { line: 1 },
    },
  };
}

function tokenize(src: string): Line[] {
  const out: Line[] = [];
  const raw = src.split("\n");
  for (let i = 0; i < raw.length; i += 1) {
    const r = raw[i] ?? "";
    const trimmed = r.trim();
    const indent = r.length - r.trimStart().length;
    out.push({ raw: r, trimmed, indent, no: i + 1 });
  }
  return out;
}

type TopHeader = { key: string; value: string | null };

function matchTopHeader(trimmed: string): TopHeader | null {
  // 形式: `key:` or `key: value`
  const m = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
  if (!m) return null;
  const value = (m[2] ?? "").trim();
  return { key: (m[1] ?? "").toLowerCase(), value: value.length ? stripQuotes(value) : null };
}

/**
 * 対応する引用符だけを外す。
 *
 * 先頭と末尾を別々に外すと、対応しない形 (`'300,200"`) が中身だけ取り出せてしまう。
 * 画面側も同じ関数を使う (#1028) = 別々に持つと、片方だけが読める本文ができる。
 */
export function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

/**
 * 引用符と角括弧の外にある最後の `:` の位置。 見つからなければ -1。
 *
 * 名前に `:` を含められるので後ろから探すが、 `["id: PK"]` のように値の中にも `:` が入る。
 * 深さを数えて、 値の中の `:` を数えない。
 */
function lastTopLevelColon(s: string): number {
  let depth = 0;
  let quote = "";
  let last = -1;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i]!;
    if (quote) {
      if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "[" || c === "{") depth += 1;
    else if (c === "]" || c === "}") depth -= 1;
    else if (c === ":" && depth === 0) last = i;
  }
  return last;
}

/**
 * 空白区切りの値を切り出す。 引用符と角括弧の中の空白では切らない。
 *
 * `service "API サーバー" 幅400` → `["service", '"API サーバー"', "幅400"]`
 */
function splitValues(s: string): string[] {
  const out: string[] = [];
  let buf = "";
  let depth = 0;
  let quote = "";
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i]!;
    if (quote) {
      buf += c;
      if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      buf += c;
      continue;
    }
    if (c === "[" || c === "{") {
      depth += 1;
      buf += c;
      continue;
    }
    if (c === "]" || c === "}") {
      depth -= 1;
      buf += c;
      continue;
    }
    if (/\s/.test(c) && depth === 0) {
      if (buf) {
        out.push(buf);
        buf = "";
      }
      continue;
    }
    buf += c;
  }
  if (buf) out.push(buf);
  return out;
}

type ActorValues = {
  kind: string;
  tone?: Tone;
  subtitle?: string;
  rows?: string[];
  value?: string;
  posX?: number;
  posY?: number;
  /** parts の状態の上書き (`v=50` の形)。 状態名は自由なので等号で示す。 */
  state?: Record<string, number | string | boolean>;
  /** 図形の倍率 (`倍率=2` / `scale=2` の形、 #1026)。 状態とは別枠で持つ。 */
  scale?: number;
  /** 書かれた倍率の名前。 値が読めない形 (`scale=x`) と書いていない形を見分ける。 */
  scaleKeys?: string[];
};

/**
 * 空白区切りで書かれた値を、 項目ごとに振り分ける。
 *
 * 振り分けは値の形で決まる。 引用符付きは補足 (2 つ目は値)、 角括弧は行、 色名は色、
 * 残りが種類。 形が違うので取り違えない。
 */
function classifyValues(values: string[], line: number, errors: DslError[]): ActorValues {
  const out: ActorValues = { kind: "" };
  /** 書かれた倍率。 同じ名前が 2 度出たら後の値で上書きする */
  const scaleWritten = new Map<string, string>();
  const kindWords: string[] = [];
  for (const v of values) {
    if (
      (v.startsWith('"') && v.endsWith('"') && v.length > 1) ||
      (v.startsWith("'") && v.endsWith("'") && v.length > 1)
    ) {
      // 1 つ目の引用符は補足、 2 つ目は値 (`storage` の右側に出る数値等)
      if (out.subtitle === undefined) out.subtitle = stripQuotes(v);
      else if (out.value === undefined) out.value = stripQuotes(v);
      continue;
    }
    if (v.startsWith("[") && v.endsWith("]")) {
      out.rows = v
        .slice(1, -1)
        .split(/,(?![^[]*\])/)
        .map((x) => stripQuotes(x.trim()))
        .filter(Boolean);
      continue;
    }
    // `@300,200` は位置。 2 つ揃わないと効かないので、 1 つの値としてまとめて書く
    const at = v.match(/^@(-?\d+(?:\.\d+)?)\s*[,、]\s*(-?\d+(?:\.\d+)?)$/);
    if (at) {
      out.posX = Number(at[1]);
      out.posY = Number(at[2]);
      continue;
    }
    // `名前=値` は parts の状態の上書き。 状態名は自由なので、 形では見分けられない。
    // 等号を書いてもらう。
    const eq = v.indexOf("=");
    if (eq > 0) {
      const key = v.slice(0, eq);
      const raw = stripQuotes(v.slice(eq + 1));
      // `倍率` だけは状態ではなく図形の倍率 (#1026)。 書かれた名前をそのまま貯めて、
      // どれが効くかは `resolveScale` が 1 箇所で決める (3 つの書き方で規則を揃えるため)
      if (SCALE_KEYS.has(key)) {
        scaleWritten.set(key, raw);
        continue;
      }
      if (/^[A-Za-z_][\w-]*$/.test(key)) {
        out.state = { ...(out.state ?? {}), [key]: coerceStateValue(raw) };
        continue;
      }
    }
    const tone = resolveTone(v);
    if (tone) {
      out.tone = tone;
      continue;
    }
    kindWords.push(v);
  }
  out.kind = kindWords.join(" ").toLowerCase();
  const s = resolveScale(scaleWritten, line, errors);
  out.scale = s.scale;
  out.scaleKeys = s.keys;
  return out;
}

/**
 * 書かれた種類名を、 描画できる種類に解決する。
 *
 * 固有名 (`lambda` / `rds` 等) は読み替え表を通す。 それ以外はそのまま返す。
 */
export function resolveNodeKind(raw: string): NodeKind {
  if (raw === "") return NODE_KIND_DEFAULT;
  // `Object.hasOwn` で引く。 素の添字だと `toString` 等の既定の持ち物が引けてしまい、
  // 種類として関数が返る。 呼ぶ前に受理集合で弾いてはいるが、 表を引く側でも閉じておく。
  return Object.hasOwn(INFRA_KIND_ALIAS, raw) ? INFRA_KIND_ALIAS[raw]! : (raw as NodeKind);
}

function numberOrUndef(s: string | undefined): number | undefined {
  if (s === undefined || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function boolOrUndef(s: string | undefined): boolean | undefined {
  if (s === undefined) return undefined;
  const lower = s.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;
  return undefined;
}

/**
 * 欄が期待する値の形 (#1306)。
 *
 * 記法の値はすべて文字列なので「型」 は無いが、**欄ごとに読める形は決まっている**
 * (`posX` は数、`overlay` は真偽)。 その形を表に並べ、読めない値を行番号付きで知らせる。
 */
type 値の形 = "数" | "真偽";

/** 表から作る、欄の名前と読んだ結果の対応 */
type 読んだ結果<T extends Record<string, 値の形>> = {
  [K in keyof T]: T[K] extends "数" ? number | undefined : boolean | undefined;
};

/**
 * 数として読む。 読めない値は行番号付きで知らせる (#1306)。
 *
 * `numberOrUndef` は読めない値を黙って `undefined` に落とすため、書いた欄が無かったことに
 * なる。 誤りも警告も出ないので、書いた人には「書いたのに図が変わらない」 としか見えない。
 *
 * 値を書かなかった形 (`posX:` の右が空) は「書かなかった」 と同じ扱いのままにする。
 * こちらは黙って消えているわけではなく、書いていないものが効かないだけ。
 */
function 数として読む(
  raw: string | undefined,
  欄: string,
  line: number,
  errors: DslError[],
): number | undefined {
  if (raw === undefined || raw === "") return undefined;
  const n = numberOrUndef(raw);
  if (n !== undefined) return n;
  errors.push({
    line,
    message: `${欄} は数で書きます: "${raw}"`,
    hint: "`300` / `-8` / `1.5` の形で書く",
  });
  return undefined;
}

/**
 * 真偽として読む。 読めない値は行番号付きで知らせる (#1306)。
 *
 * 受けるのは `true` と `false` だけ。 `yes` / `1` / `はい` は読めないため、使える値を
 * 添えて知らせる (読めない値を捨てるだけだと、別の綴りを試し続けることになる)。
 */
function 真偽として読む(
  raw: string | undefined,
  欄: string,
  line: number,
  errors: DslError[],
): boolean | undefined {
  if (raw === undefined || raw === "") return undefined;
  const b = boolOrUndef(raw);
  if (b !== undefined) return b;
  errors.push({
    line,
    message: `${欄} は true か false で書きます: "${raw}"`,
    hint: "使える値 = true, false",
  });
  return undefined;
}

/**
 * 表に並べた欄をまとめて読む (#1306)。
 *
 * **呼出側に欄名を並べない**。 並べると欄を足した時に知らせだけが漏れる (JSON 入口が
 * #1304 で踏んだ形と同じ)。 表を 1 つ置き、読む側も検査もそこから導く。
 *
 * `接頭` は知らせに出す欄の呼び名の前半 (`viewport.` / `縦列 l1 の `)。 同じ欄名が別の
 * 場所に出る (`width` は図全体と縦列、`posX` は箱と箱の中の要素) ため、どこの欄かが
 * 分かる形にする。
 */
function 表で読む<T extends Record<string, 値の形>>(
  表: T,
  opts: Record<string, string | undefined>,
  接頭: string,
  // 欄ごとに行が違う書き方 (縦に並べる形) では関数で渡す。 1 行に収まる書き方 (中括弧) は数で渡す
  line: number | ((欄: string) => number),
  errors: DslError[],
): 読んだ結果<T> {
  const out: Record<string, number | boolean | undefined> = {};
  const 行を引く = (欄: string): number => (typeof line === "number" ? line : line(欄));
  for (const [欄, 形] of Object.entries<値の形>(表)) {
    out[欄] =
      形 === "数"
        ? 数として読む(opts[欄], `${接頭}${欄}`, 行を引く(欄), errors)
        : 真偽として読む(opts[欄], `${接頭}${欄}`, 行を引く(欄), errors);
  }
  return out as 読んだ結果<T>;
}

/**
 * 図全体の大きさと間隔の欄 (#1306)。 `DslViewport` の数の欄をすべて覆う。
 *
 * `satisfies` で `DslViewport` から欄を導く = 欄を足して表に書き忘れると型検査が落ちる。
 */
export const VIEWPORT_VALUE_KINDS = {
  width: "数",
  height: "数",
  scale: "数",
  laneWidth: "数",
  gap: "数",
  laneGap: "数",
  nodeGap: "数",
  labelMargin: "数",
} as const satisfies Record<Exclude<keyof DslViewport, "pos">, 値の形>;

/**
 * 縦列の欄 (#1306)。 `label` は文字列なので表に載せない (記法の値は全て文字列で、
 * 文字列の欄には読めない値という状態が無い)。
 */
export const LANE_VALUE_KINDS = {
  x: "数",
  width: "数",
  contain: "真偽",
  lifeline: "真偽",
} as const satisfies Record<string, 値の形>;

/**
 * 箱の中に描く図形 (`shape:`) と、値を見せる部品 (`readouts:`) の欄 (#1374)。
 *
 * どちらも描画側 (`CdlDynShape` / `CdlReadout`) の形をそのまま渡す。 記法の値は全て文字列で
 * 届くため、欄ごとに「数」 「文字列」 「数か文字列」 のどれとして読むかを表で持つ。
 *
 * **「数か文字列」 は状態を追いかける欄**。 `level: 80` のように数を直接書くこともできるし、
 * `level: "{s1}"` のように状態の名前を書いて段の中で動かすこともできる。 数として読めた時
 * だけ数にし、読めなければ文字列のまま渡す。
 *
 * ## 表を持つ理由
 *
 * 表が無いと「知らない欄を黙って捨てる」 か「何でも通す」 のどちらかになる。 前者は書いた
 * 指定が消え、後者は綴り違いがそのまま描画側へ流れて別の形で失敗する。 表があれば
 * 書いた場所と使える欄を添えて知らせられる。
 */
// 欄の形と定義の型は `parser-types.ts` が持つ (#1385)。 生成した部品の表がこの型を使うため、
// `parser.ts` に置いたままだと 生成した表 → parser → 生成した表 の輪ができる
export type { 欄の形, 図形の定義 } from "./parser-types";

/** 描ける図形と、その欄 (`CdlDynShape` の全 5 種を覆う) */
export const 図形の表: Record<string, 図形の定義> = {
  rect: {
    必須: ["source", "fillMax"],
    欄: {
      source: "数か文字列",
      fillMax: "数",
      orient: "向き",
      fill: "文字列",
      stroke: "文字列",
      radius: "数",
    },
  },
  circle: {
    必須: [],
    欄: { radius: "数か文字列", fillProgress: "数か文字列", fill: "文字列", stroke: "文字列" },
  },
  arc: {
    必須: ["angle"],
    欄: {
      innerRadius: "数",
      outerRadius: "数",
      startAngle: "数",
      angle: "数か文字列",
      sweepMax: "数",
      fill: "文字列",
      stroke: "文字列",
    },
  },
  wave: {
    必須: ["level", "amplitude"],
    欄: {
      level: "数か文字列",
      amplitude: "数",
      frequency: "数",
      waveHeight: "数",
      fill: "文字列",
      stroke: "文字列",
    },
  },
  polygon: {
    必須: ["sides"],
    欄: {
      sides: "数",
      radius: "数か文字列",
      rotation: "数か文字列",
      fill: "文字列",
      stroke: "文字列",
    },
  },
};

/**
 * 記法が受ける部品と、その欄。
 *
 * **手で書かず、描画側の型定義から生成する** (#1385)。 描画側は 107 種を持ち欄は 510 個あり、
 * 手で写すと写し間違いと描画側の変更への drift が残る (`rules/quality.md § 導出可能記述は
 * 人手で書かない`)。
 *
 * 作り直す = `node packages/dragon/scripts/gen-readout-table.mjs`
 * ずれの検知 = `packages/dragon/test/readout-table-generated.test.ts`
 */
export { 部品の表, 部品の組の表 } from "./readout-table.generated";
import { 部品の表, 部品の組の表 } from "./readout-table.generated";

/**
 * 記法が受けるつまみと、その欄 (#1389)。
 *
 * **部品の表と同じく、描画側の型定義から生成する**。 14 種それぞれ欄が違い、手で写すと
 * 描画側が種類を足した時に drift が残る (`rules/quality.md § 導出可能記述は人手で書かない`)。
 *
 * 作り直す = `node packages/dragon/scripts/gen-input-table.mjs`
 * ずれの検知 = `packages/dragon/test/input-table-generated.test.ts`
 */
export { つまみの表 } from "./input-table.generated";
import { つまみの表 } from "./input-table.generated";
import type { 図形の定義 } from "./parser-types";

/** `[a, b]` の形を文字列の並びに読む */
function 並びとして読む(raw: string): string[] {
  return raw
    .replace(/^\[|\]$/g, "")
    .split(/,(?![^[]*\])/)
    .map((x) => stripQuotes(x.trim()))
    .filter((x) => x !== "");
}

/**
 * `[{ a: 1 }, { b: 2 }]` の形を、中括弧ごとの組の並びに読む (#1381)。
 *
 * `並びとして読む` は葉の値しか想定していないため、中括弧を含む形を渡すと項目の途中で
 * 割れる。 中括弧の深さを数えて、深さ 0 の位置だけで割る。
 *
 * 読めない形は捨てずに `undefined` を返す。 呼び手が行番号付きで知らせる = 黙って捨てると
 * 「書いたのに出ない」 が手掛かりなしで起きる。
 */
function 組の並びとして読む(raw: string): Record<string, string>[] | undefined {
  const 中身 = raw.trim();
  if (!中身.startsWith("[") || !中身.endsWith("]")) return undefined;
  const 本体 = 中身.slice(1, -1);

  const 塊: string[] = [];
  let i = 0;
  let 次は組 = true;
  while (i < 本体.length) {
    while (i < 本体.length && /\s/u.test(本体[i]!)) i += 1;
    if (i >= 本体.length) break;

    if (!次は組) {
      if (本体[i] !== ",") return undefined;
      次は組 = true;
      i += 1;
      continue;
    }
    if (本体[i] !== "{") return undefined;

    const 始まり = i + 1;
    let 引用: '"' | "'" | null = null;
    let 直前: string | null = "{";
    i += 1;
    for (; i < 本体.length; i += 1) {
      const c = 本体[i]!;
      if (引用 !== null) {
        if (引用 === '"' && c === "\\" && i + 1 < 本体.length) {
          i += 1;
          continue;
        }
        if (c === 引用) 引用 = null;
        continue;
      }
      if ((c === '"' || c === "'") && (直前 === null || ":,{[".includes(直前))) {
        引用 = c;
        直前 = c;
        continue;
      }
      // 組の中身は葉だけ。 引用符の外の入れ子は値の形を保てない。
      if (c === "{") return undefined;
      if (c === "}") {
        塊.push(本体.slice(始まり, i));
        i += 1;
        次は組 = false;
        break;
      }
      if (!/\s/u.test(c)) 直前 = c;
    }
    if (次は組) return undefined;
  }
  if (次は組 && 塊.length > 0) return undefined;
  if (塊.length === 0) return undefined;

  const 出: Record<string, string>[] = [];
  for (const t of 塊) {
    const 組 = parseInlineMapping(t);
    if (Object.keys(組).length === 0) return undefined;
    出.push(組);
  }
  return 出;
}

function 部品の組を検査する(
  kind: string,
  読めた: Record<string, unknown>,
  line: number,
  errors: DslError[],
): void {
  for (const [欄, 定義] of Object.entries(部品の組の表[kind] ?? {})) {
    const 並び = 読めた[欄];
    if (!Array.isArray(並び)) continue;
    並び.forEach((組, i) => {
      const o = 組 as Record<string, unknown>;
      for (const k of Object.keys(o)) {
        if (k in 定義.欄) continue;
        errors.push({
          line,
          message: `部品の ${欄}[${i}] の項目名が読めません: "${k}"`,
          hint: `使える項目 = ${Object.keys(定義.欄).join(", ")}`,
        });
      }
      for (const k of 定義.必須) {
        if (o[k] !== undefined) continue;
        errors.push({
          line,
          message: `部品の ${欄}[${i}].${k} は必ず書きます`,
          hint: `必須の項目 = ${定義.必須.join(", ")}`,
        });
      }
    });
  }
}

/**
 * 中括弧の中身を、表に従って読む (#1374)。
 *
 * 知らない欄と足りない必須欄は行番号付きで知らせる。 読めた欄だけを返すため、
 * 知らせが出た欄は描画側へ渡らない。
 */
function 表に従って読む(
  定義: 図形の定義,
  opts: Record<string, string>,
  接頭: string,
  line: number,
  errors: DslError[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [欄, 値] of Object.entries(opts)) {
    if (欄 === "kind") continue;
    const 形 = 定義.欄[欄];
    if (形 === undefined) {
      errors.push({
        line,
        message: `${接頭}の項目名が読めません: "${欄}"`,
        hint: `使える項目 = ${Object.keys(定義.欄).join(", ")}`,
      });
      continue;
    }
    /*
     * 空の値を落とすのは文字列以外だけ (#1385)。
     *
     * `unit: ""` は「単位を出さない」 という指定で、書いた人の意図がある。 落とすと
     * 書かなかった場合と同じになり、描画側の既定が出る = 書いたのに効かない。
     *
     * 値を書かなかった形 (`unit:`) はここに届かない = `parseInlineMapping` が値 1 文字以上を
     * 求めるため、名前ごと拾われない。 したがって空が来るのは引用符で明示した時だけ。
     */
    if (値 === "" && 形 !== "文字列") continue;
    if (形 === "数") {
      const n = 数として読む(値, `${接頭}${欄}`, line, errors);
      if (n !== undefined) out[欄] = n;
    } else if (形 === "数か文字列") {
      const n = numberOrUndef(値);
      out[欄] = n !== undefined ? n : 値;
    } else if (形 === "文字列の並び") {
      out[欄] = 並びとして読む(値);
    } else if (形 === "数の並び") {
      /*
       * 数の並びは、1 つでも数として読めなければ欄ごと落とす (#1389)。
       *
       * 読めた分だけ渡すと並びの長さが変わり、番号で指す欄 (`defaultSpeedIdx`) が
       * 別の要素を指す。 書き間違いが「別の値が選ばれている図」 になって出るため、
       * 数え落としを黙って通さない。
       */
      const 生 = 並びとして読む(値);
      const 数 = 生.map((x) => numberOrUndef(x));
      if (数.some((n) => n === undefined)) {
        errors.push({
          line,
          message: `${接頭}${欄} に数でない値があります: "${値}"`,
          hint: "`[0.5, 1, 2, 4]` の形で数だけを並べる",
        });
      } else {
        out[欄] = 数;
      }
    } else if (形 === "組の並び") {
      const 組 = 組の並びとして読む(値);
      if (組 !== undefined) out[欄] = 組;
      else {
        errors.push({
          line,
          message: `${接頭}${欄} の並びが読めません: "${値}"`,
          hint: '`[{ value: "online", color: "#22c55e" }]` の形で書く',
        });
      }
    } else if (形 === "真偽") {
      // 描画側は `boolean` を取る。 `"true"` / `"false"` の 2 語だけを受け、それ以外は
      // 黙って真に倒さず知らせる = `visibleIf` と違い、ここは真偽そのものを渡す欄
      if (値 === "true" || 値 === "false") out[欄] = 値 === "true";
      else {
        errors.push({
          line,
          message: `${接頭}${欄} の真偽が読めません: "${値}"`,
          hint: "使える値 = true, false",
        });
      }
    } else if (形 === "向き") {
      if (["up", "down", "left", "right"].includes(値)) out[欄] = 値;
      else {
        errors.push({
          line,
          message: `${接頭}${欄} の向きが読めません: "${値}"`,
          hint: "使える値 = up, down, left, right",
        });
      }
    } else {
      out[欄] = 値;
    }
  }
  for (const 欄 of 定義.必須) {
    if (out[欄] === undefined) {
      errors.push({
        line,
        message: `${接頭}${欄} は必ず書きます`,
        hint: `必須の項目 = ${定義.必須.join(", ")}`,
      });
    }
  }
  return out;
}

/**
 * その箱を出すかどうかの条件を読む (#1381)。
 *
 * 描画側は空文字を偽として扱うため、`visibleIf: ` と書くと「常に出ない箱」 になる。
 * 書いた本人はたいてい条件を書き忘れただけなので、空は捨てずに行番号付きで知らせる。
 */
function 出す条件として読む(
  raw: string | undefined,
  line: number,
  errors: DslError[],
): string | undefined {
  if (raw === undefined) return undefined;
  const 値 = raw.trim();
  if (値 === "") {
    errors.push({
      line,
      message: "箱の visibleIf が空です",
      hint: '`visibleIf: "{flag}"` のように条件を書く。 常に隠すなら `visibleIf: "0"`',
    });
    return undefined;
  }
  return 値;
}

/**
 * 箱の中に描く図形を読む (#1374)。 読めなければ `undefined` を返す。
 *
 * 種類が分からない形は捨てずに知らせる = 黙って捨てると、書いた図形が出ないのに
 * 手掛かりが 1 つも残らない。
 */
function 図形として読む(raw: string, line: number, errors: DslError[]): DslDynShape | undefined {
  const 中身 = raw.trim().replace(/^\{|\}$/g, "");
  const opts = parseInlineMapping(中身);
  const kind = (opts.kind ?? "").toLowerCase();
  const 定義 = 図形の表[kind];
  if (定義 === undefined) {
    errors.push({
      line,
      message: `図形の種類が読めません: "${opts.kind ?? ""}"`,
      hint: `使える種類 = ${Object.keys(図形の表).join(", ")}`,
    });
    return undefined;
  }
  const 読めた = 表に従って読む(定義, opts, `図形の `, line, errors);
  for (const 欄 of 定義.必須) if (読めた[欄] === undefined) return undefined;
  return { kind, ...読めた } as DslDynShape;
}

/**
 * 値を見せる部品を読む (#1374)。 読めなければ `undefined` を返す。
 */
function 部品として読む(
  id: string,
  raw: string,
  line: number,
  errors: DslError[],
): DslReadout | undefined {
  const opts = parseInlineMapping(raw);
  const kind = (opts.kind ?? "").toLowerCase();
  const 定義 = 部品の表[kind];
  if (定義 === undefined) {
    errors.push({
      line,
      message: `部品の種類が読めません: "${opts.kind ?? ""}"`,
      hint: `使える種類 = ${Object.keys(部品の表).join(", ")}`,
    });
    return undefined;
  }
  const 読めた = 表に従って読む(定義, opts, `部品 ${id} の `, line, errors);
  部品の組を検査する(kind, 読めた, line, errors);
  for (const 欄 of 定義.必須) if (読めた[欄] === undefined) return undefined;
  return { id, kind, ...読めた } as DslReadout;
}

/**
 * 読む人が動かすつまみを読む (#1389)。 読めなければ `undefined` を返す。
 *
 * 部品 (`readouts:`) と同じ経路で読む。 違いは組の並びを取る欄が無いことだけで、
 * 知らない欄と足りない必須欄の知らせ方は同じ。
 */
function つまみとして読む(
  id: string,
  raw: string,
  line: number,
  errors: DslError[],
): DslInput | undefined {
  const opts = parseInlineMapping(raw);
  const kind = (opts.kind ?? "").toLowerCase();
  const 定義 = つまみの表[kind];
  if (定義 === undefined) {
    errors.push({
      line,
      message: `つまみの種類が読めません: "${opts.kind ?? ""}"`,
      hint: `使える種類 = ${Object.keys(つまみの表).join(", ")}`,
    });
    return undefined;
  }
  const 読めた = 表に従って読む(定義, opts, `つまみ ${id} の `, line, errors);
  for (const 欄 of 定義.必須) if (読めた[欄] === undefined) return undefined;
  return { id, kind, ...読めた } as DslInput;
}

/** 箱の中の要素の欄 (#1306)。 `DslActorNodeOverride` の全欄を覆う */
export const ACTOR_NODE_VALUE_KINDS = {
  posX: "数",
  posY: "数",
  posW: "数",
  posH: "数",
} as const satisfies Record<keyof DslActorNodeOverride, 値の形>;

/** 中括弧の形で箱に書ける、数と真偽の欄 (#1306) */
export const ACTOR_INLINE_VALUE_KINDS = {
  stack: "数",
  initial: "真偽",
  final: "真偽",
  posX: "数",
  posY: "数",
  posW: "数",
  posH: "数",
} as const satisfies Record<string, 値の形>;

/** 縦に並べる形で箱に書ける、数と真偽の欄 (#1306)。 `posW` / `posH` は `大きさ:` が受ける */
export const ACTOR_BLOCK_VALUE_KINDS = {
  stack: "数",
  posX: "数",
  posY: "数",
} as const satisfies Record<string, 値の形>;

/** 矢印の中括弧に書ける、数と真偽の欄 (#1306) */
export const FLOW_INLINE_VALUE_KINDS = {
  labelOffsetX: "数",
  labelOffsetY: "数",
  overlay: "真偽",
} as const satisfies Record<string, 値の形>;

/**
 * 色名を解決する。 別名 (`成功` / `neutral` 等) も受け付ける。
 *
 * 未知の値は `undefined` にして既定色に落とす。 箱と矢印で同じ関数を通す。
 *
 * 別名表の参照には `Object.hasOwn` を使う。 素の添字だと `toString` / `constructor` /
 * `valueOf` / `__proto__` が JavaScript の既定の持ち物として引けてしまい、 色名として
 * 関数やオブジェクトが通る (実測)。 最後に解決結果が正規の色名かも確かめる。
 */
export function resolveTone(s: string | undefined): Tone | undefined {
  if (s === undefined) return undefined;
  const raw = stripQuotes(s.trim());
  const lower = raw.toLowerCase();
  const resolved = Object.hasOwn(TONE_ALIAS, raw)
    ? TONE_ALIAS[raw]
    : Object.hasOwn(TONE_ALIAS, lower)
      ? TONE_ALIAS[lower]
      : undefined;
  if (resolved !== undefined && TONE_VALID.has(resolved)) return resolved;
  return TONE_VALID.has(lower) ? (lower as Tone) : undefined;
}

/**
 * actor 行から `name: { inner }` を depth count で抽出。 inner 内の `{ }` (例: `value: "{count}"`) を尊重。
 */
function matchActorInlineMapping(raw: string): { name: string; inner: string } | null {
  // colon 位置を探して name と rest に分ける
  const colonIdx = raw.indexOf(":");
  if (colonIdx < 0) return null;
  const name = raw.slice(0, colonIdx);
  const rest = raw.slice(colonIdx + 1).trim();
  if (!rest.startsWith("{")) return null;
  // depth count で対応 brace 探す。 正しい引用符の中の `}` は飛ばす。
  const 終わりを探す = (引用符を見る: boolean): number => {
    let depth = 0;
    let 引用符: '"' | "'" | null = null;
    let 直前: string | null = null;
    for (let i = 0; i < rest.length; i += 1) {
      const c = rest[i]!;
      if (引用符を見る) {
        if (引用符 !== null) {
          if (引用符 === '"' && c === "\\" && i + 1 < rest.length) {
            i += 1;
            continue;
          }
          if (c === 引用符) 引用符 = null;
          continue;
        }
        if ((c === '"' || c === "'") && (直前 === null || ":,{[".includes(直前))) {
          引用符 = c;
          直前 = c;
          continue;
        }
      }
      if (c === "{") depth += 1;
      else if (c === "}") {
        depth -= 1;
        if (depth === 0) return i;
      }
      if (!/\s/u.test(c)) 直前 = c;
    }
    return -1;
  };
  let endIdx = 終わりを探す(true);
  // 閉じない引用符は従来どおり単純分割へ戻す (#1367)。
  if (endIdx < 0) endIdx = 終わりを探す(false);
  if (endIdx < 0) return null;
  const inner = rest.slice(1, endIdx);
  return { name, inner };
}

/**
 * inline mapping を parse: `subtitle: "送信元", kind: actor, stack: 0`
 * brace 内は { } で wrap してから渡す、 本関数は内部だけ受ける
 * 値が `[a, b]` 配列は文字列のまま返す (caller で split)
 */
function parseInlineMapping(inner: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of splitInlineFields(inner)) {
    // 項目名は英字だけでなく日本語も受ける (#1026)。 受けないと `{ kind: x, 倍率: 2 }` の
    // 倍率が消え、同じ意味を書いたのに中括弧の形だけ効かない (実測)。
    //
    // 読める名前を広げても、**知っている名前しか使われない**。 パーツの状態の上書きに
    // 流れるのは `ACTOR_RESERVED_FIELDS` に無い名前だけで、日本語の項目名 (`位置` / `大きさ`
    // 等) はそこに載せてあるため、これまでどおり落ちる
    const m = p.match(/^\s*([^\s:,{}[\]"']+)\s*:\s*(.+?)\s*$/);
    if (m) {
      const key = m[1]!;
      out[key] = stripQuotes(m[2]!.trim());
    }
  }
  return out;
}

/**
 * 中括弧の中身から、倍率として書かれた名前と値を拾う (#1026)。
 *
 * `parseInlineMapping` は値が 1 文字以上ある項目しか拾わない。 それをそのまま使うと、
 * 値を書かなかった形 (`{ kind: x, scale: }`) で「書いた」 ことすら残らず、
 * 予約の知らせが消える。 倍率だけは値が空でも名前を残す。
 */
function writtenScaleFields(inner: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const field of splitInlineFields(inner)) {
    const idx = field.indexOf(":");
    if (idx < 0) continue;
    const key = field.slice(0, idx).trim();
    if (!SCALE_KEYS.has(key)) continue;
    // 同じ名前を 2 度書いたら後の値を採る
    out.set(key, stripQuotes(field.slice(idx + 1).trim()));
  }
  return out;
}

/**
 * 中括弧の中身を、入れ子と引用符を保ったまま項目ごとに割る。
 *
 * `parseInlineMapping` と、倍率の「書かれた名前」 を拾う経路 (#1026) で共用する。
 * 割り方を 2 つ持つと、片方だけが拾える項目という食い違いが生まれる。
 *
 * **引用符の中のカンマでは割らない** (#1367)。 見ていなかった間、`{ subtitle: "a, b" }` の
 * 補足が `"a` に切れて図に出ていた (実測で見本 1 件が踏んでいた)。 配列
 * (`{ initial: '["入力", "確認"]' }`) が壊れていなかったのは角括弧の深さで守られていたためで、
 * 引用符だけで守られる値は守られていなかった。
 */
function splitInlineFields(inner: string): string[] {
  const 引用符を見て割る = (見る: boolean): { parts: string[]; 閉じた: boolean } => {
    let depth = 0;
    let 引用符: '"' | "'" | null = null;
    let 直前: string | null = null;
    let buf = "";
    const parts: string[] = [];
    for (let i = 0; i < inner.length; i += 1) {
      const c = inner[i]!;
      if (見る) {
        if (引用符 !== null) {
          // 二重引用の中では、逃がした引用符を終端と取り違えない
          if (引用符 === '"' && c === "\\" && i + 1 < inner.length) {
            buf += c;
            i += 1;
            buf += inner[i]!;
            continue;
          }
          // **開いた記号と同じものだけが閉じる**。 `"Guns N' Roses"` の `'` は文字として残す
          if (c === 引用符) 引用符 = null;
          buf += c;
          continue;
        }
        // 値の途中の apostrophe まで開始記号にすると、別 field まで引用内として飲み込む
        if ((c === '"' || c === "'") && (直前 === null || ":,{[".includes(直前))) {
          引用符 = c;
          直前 = c;
          buf += c;
          continue;
        }
      }
      if (c === "[" || c === "{") depth += 1;
      else if (c === "]" || c === "}") depth -= 1;
      if (c === "," && depth === 0) {
        parts.push(buf);
        buf = "";
        直前 = c;
        continue;
      }
      buf += c;
      if (c !== " " && c !== "\t") 直前 = c;
    }
    if (buf.trim()) parts.push(buf);
    return { parts, 閉じた: 引用符 === null };
  };

  const 見た = 引用符を見て割る(true);
  // **閉じない引用符が残ったらこれまでどおりに割る** (#1367)。 壊れた入力で挙動が変わると、
  // 今まで通っていた書き方が黙って別の結果になる。 実測では見本 9832 件の中括弧のうち
  // 閉じない形は 0 件で、この経路は保険
  return 見た.閉じた ? 見た.parts : 引用符を見て割る(false).parts;
}

function collectIndentedList(
  lines: Line[],
  start: number,
  parentIndent: number,
): { items: Line[]; next: number } {
  const items: Line[] = [];
  let i = start;
  while (i < lines.length) {
    const ln = lines[i]!;
    if (!ln.trimmed) {
      i += 1;
      continue;
    }
    if (ln.indent <= parentIndent) break;
    if (ln.trimmed.startsWith("- ")) {
      items.push({ ...ln, trimmed: ln.trimmed.slice(2).trim() });
    } else if (ln.trimmed.includes(":")) {
      // YAML 風 inline (key: value) は state 用 block で許容
      items.push(ln);
    }
    i += 1;
  }
  return { items, next: i };
}

/**
 * 登場人物を 1 件ずつ集める。 続く字下げ行は同じ 1 件にまとめる。
 *
 * 項目が少なければ 1 行で書け、 多ければ縦に並べられる。 縦に並べた方が、 何を指定できるかが
 * 見える。
 *
 * ```
 * - Client
 * - API: service
 * - Web:
 *     kind: service
 *     色: 失敗
 * ```
 */
/**
 * 色の指定を振り分ける。
 *
 * 書く人は「色を変えたい」 としか思わないので、 項目は `色:` 1 つにまとめる。 意味の色
 * (`失敗`) と色番号 (`#f59e0b`) は形で見分ける。 前者は箱の色、 後者はパーツの塗りになる。
 */
export function splitColorValue(raw: string): { tone?: Tone; hex?: string } {
  const v = stripQuotes(raw.trim());
  if (v.startsWith("#")) return { hex: v };
  const tone = resolveTone(v);
  return tone ? { tone } : {};
}

/**
 * v0.4 で使えた箱の種類の名前 (#1301)。
 *
 * v0.5 の受理集合 (`NODE_KIND_VALID`) に無いため、書くと見本 (parts) の名前として扱われ、
 * 見本帳に無ければ `actor` に潰れて **黙って消えていた**。 見本の名前と区別が付かないので、
 * 「v0.4 で種類として使えた語」 であることを根拠に誤りとして知らせる。
 *
 * 対応は `keywords.ts` の `NODE_KIND_ALIAS` が持つ (日本語 → 英語の種類名)。
 */
function v04の種類名(値: string): string | undefined {
  if (!Object.hasOwn(NODE_KIND_ALIAS, 値)) return undefined;
  if (NODE_KIND_VALID.has(値)) return undefined; // v0.5 でも受ける名前は対象外
  return NODE_KIND_ALIAS[値];
}

/**
 * 箱の種類に v0.4 の日本語を書いた時に知らせる (#1301)。
 *
 * 黙って見本の名前として扱うと、見本帳に無い場合に `actor` へ潰れて手掛かりが残らない。
 */
function reportV04Kind(kindRaw: string, line: number, errors: DslError[]): void {
  const 英語 = v04の種類名(kindRaw);
  if (英語 === undefined) return;
  errors.push({
    line,
    message: `箱の種類に v0.4 の名前は使えません: "${kindRaw}"`,
    hint: `v0.5 では英語で書く (\`${英語}\`)`,
  });
}

/** `色` / `color` のどちらでも書ける。 */
const COLOR_KEYS = new Set(["色", "color", "tone"]);

/**
 * 見本の倍率として予約する項目名 (#1026)。
 *
 * 予約しないと状態の名前として読まれる。 画面側は同じ語を図形の倍率として読むため、
 * 予約しない限り同じ本文が 2 経路で別の絵になる。 3 つの書き方すべてで同じ扱いにする。
 */
const SCALE_KEYS: ReadonlySet<string> = new Set(["scale", "倍率"]);

/** 別名を 2 つ書いた時に優先する順。 画面側 (`SCALE_KEYS`) と同じ並びにする。 */
const SCALE_ORDER = ["scale", "倍率"] as const;

/**
 * 書かれた倍率から、実際に効く値と書かれた名前を決める (#1026)。
 *
 * 規則は 3 つの書き方と画面側で共通にする。
 *
 * - 別名は `scale` を先に見る (両方書いた時に書き方で効く名前が変わらないようにする)
 * - 同じ名前を 2 度書いた時は後に書いた方を採る (前を採ると書き直した値が効かない)
 * - 書いた名前の値が読めなくても、もう一方の名前に降りない (綴りを誤った時だけ
 *   別の値が効く、という追いにくい形を作らない)
 *
 * `keys` は書かれた名前そのもの。 値が読めたかに関わらず入る。 見本が同じ名前の状態を
 * 持つ時の知らせ (`scale-reserved`) が、値の読めなさに左右されないようにするため。
 */
function resolveScale(
  written: Map<string, string>,
  line: number | ((key: string) => number),
  errors: DslError[],
): { scale?: number; keys: string[] } {
  const keys = [...written.keys()];
  for (const key of SCALE_ORDER) {
    const raw = written.get(key);
    // 読めない値は黙って捨てず知らせる (#1306)。 書かれた名前 (`keys`) は値の読めなさに
    // 関わらず残す = 見本が同じ名前の状態を持つ時の知らせが消えないようにするため
    if (raw !== undefined) {
      const 当該行 = typeof line === "number" ? line : line(key);
      return { scale: 数として読む(raw, `箱の ${key}`, 当該行, errors), keys };
    }
  }
  return { keys };
}

/**
 * 続く字下げ行 (`kind: service` の形) を読んで 1 件にまとめる。
 *
 * 1 行で書いた時と同じ結果になるよう、 同じ振り分けを通す。
 */
function applyContinuationLines(actor: DslActor, rest: Line[], errors: DslError[]): DslActor {
  if (rest.length === 0) return actor;
  const out: DslActor = { ...actor };
  const state: Record<string, number | string | boolean> = { ...(actor.stateOverride ?? {}) };
  let touchedState = false;
  /** 縦に並べて書かれた倍率。 同じ名前が 2 度出たら後の値で上書きする */
  const scaleWritten = new Map<string, string>();
  /** 倍率を名前ごとに最後に書いた行。 別名の優先順と行番号を取り違えないために保持する。 */
  const scaleLines = new Map<string, number>();
  /**
   * 縦に並べて書かれた体験の道筋の欄 (#1251)。
   *
   * パーツでは状態の上書きとして意味を持つため、どちらに入れるかは block を読み終わってから
   * 決める。 `kind:` の行が後ろに書かれることもあり、読んだ時点ではパーツか分からない。
   */
  const 図種ごとの欄 = new Map<string, string>();
  // パーツでなければどこにも入らない項目。 パーツかどうかは block を読み終わるまで決まらない
  const unknownKeys: Array<{ key: string; line: number }> = [];

  for (const ln of rest) {
    const idx = ln.trimmed.indexOf(":");
    if (idx < 0) continue;
    const key = ln.trimmed.slice(0, idx).trim();
    const raw = ln.trimmed.slice(idx + 1).trim();
    if (!key) continue;
    // 倍率だけは値が空でも名前を残す (#1026)。 捨てると、値を書かなかった形で
    // 予約の知らせが消え、別名 (`倍率`) に降りて別の値が効いてしまう
    if (SCALE_KEYS.has(key)) {
      scaleWritten.set(key, stripQuotes(raw));
      scaleLines.set(key, ln.no);
      unknownKeys.push({ key, line: ln.no });
      continue;
    }
    if (!raw) continue;

    if (COLOR_KEYS.has(key)) {
      const { tone, hex } = splitColorValue(raw);
      if (tone) out.tone = tone;
      // 色番号を入れる状態の名前はパーツごとに違う。 組み立て時に解決する
      if (hex) out.colorHex = hex;
      // 色名としても色番号としても読めない値は黙って捨てない (#1304)。 捨てると
      // 既定色のまま描かれ、 手掛かりが 1 つも残らない
      if (!tone && !hex) report読めない色(raw, ln.no, errors, { 線種も受ける: false });
      continue;
    }
    switch (key) {
      case "kind":
      case "種類": {
        const k = stripQuotes(raw).toLowerCase();
        reportV04Kind(k, ln.no, errors);
        const isPart = k !== "" && !NODE_KIND_VALID.has(k);
        out.kind = isPart ? NODE_KIND_DEFAULT : resolveNodeKind(k);
        // parts 候補は `kind` を既定に倒して `partId` へ退避するため、 名札に載せる種類としては
        // 「書かなかった」 と同じ扱いにする (#1058)
        out.kindWritten = k !== "" && !isPart;
        out.partId = isPart ? k : undefined;
        break;
      }
      case "subtitle":
      case "補足":
        out.subtitle = stripQuotes(raw);
        break;
      case "value":
      case "値":
        out.value = stripQuotes(raw);
        break;
      case "shape":
      case "図形":
        out.shape = 図形として読む(raw, ln.no, errors);
        break;
      case "visibleIf":
      case "出す条件":
        out.visibleIf = 出す条件として読む(stripQuotes(raw), ln.no, errors);
        break;
      case "title":
      case "題":
        out.title = stripQuotes(raw);
        break;
      case "rows":
      case "行":
        out.rows = raw
          .replace(/^\[|\]$/g, "")
          .split(/,(?![^[]*\])/)
          .map((x) => stripQuotes(x.trim()))
          .filter(Boolean);
        break;
      case "位置":
      case "pos": {
        // `位置: 300,200` の形。 posX と posY は両方揃わないと効かないので、 1 つの項目に
        // まとめて書き分けられないようにする
        const value = stripQuotes(raw);
        const m = value.match(/^(-?\d+(?:\.\d+)?)\s*[,、]\s*(-?\d+(?:\.\d+)?)$/);
        if (m) {
          out.posX = Number(m[1]);
          out.posY = Number(m[2]);
          // 座標を後から書いた時は相対の指定を捨てる。 両方残すと、 どちらが効くかが
          // 書いた順に依存して読めなくなる
          out.posRel = undefined;
          break;
        }
        // `位置: Web の右 200` の形。 座標を知らなくても位置を決められるようにする
        const rel = parseRelativePos(value);
        if (rel) {
          out.posRel = rel;
          out.posX = undefined;
          out.posY = undefined;
          break;
        }
        // どちらの形でもない値は黙って捨てない。 捨てると「書いたのに図が変わらない」 が
        // 手掛かりなしで起きる
        //
        // 負の間隔 (`Web の右 -200`) もここに来る。 向きを書いた上で裏返す指定は、
        // 書いた人の意図と図が食い違うので誤りとして返す
        const negative =
          /^(.+?)\s*(?:の\s*(?:右|左|上|下)|\s(?:right|left|above|below))\s*-\s*[\d.]/i.test(value);
        errors.push({
          line: ln.no,
          message: negative
            ? `間隔に負の数は書けません: "${value}"`
            : `位置の書き方が読めません: "${value}"`,
          hint: negative
            ? "向きを変えたい時は `右` / `左` / `上` / `下` を書き換える"
            : "`位置: 300,200` (座標) か `位置: Web の右 200` (他の登場人物からの相対)",
        });
        break;
      }
      case "posX":
        out.posX = 数として読む(raw, "箱の posX", ln.no, errors);
        break;
      case "posY":
        out.posY = 数として読む(raw, "箱の posY", ln.no, errors);
        break;
      case "大きさ":
      case "size": {
        // `大きさ: 400,200` の形。 位置と揃える
        const value = stripQuotes(raw);
        const m = value.match(/^(-?\d+(?:\.\d+)?)\s*[,、]\s*(-?\d+(?:\.\d+)?)$/);
        if (m) {
          out.posW = Number(m[1]);
          out.posH = Number(m[2]);
          break;
        }
        // 読めない値を黙って捨てると「書いたのに大きさが変わらない」 が手掛かりなしで起きる。
        // 位置と同じく行番号付きで知らせる (#1028)
        errors.push({
          line: ln.no,
          message: `大きさの書き方が読めません: "${value}"`,
          hint: "`大きさ: 400,200` (幅, 高さ) の形で書く",
        });
        break;
      }
      case "touchpoint":
      case "opportunity":
      case "owner":
      case "end":
        // **どちらに入れるかは block を読み終わるまで決まらない** (#1251 Round 1 の指摘)。
        // パーツかどうかは `kind:` の行で決まり、それが後ろに書かれることもある。
        // 倍率 (`scaleWritten`) と読めない項目名 (`unknownKeys`) が同じ理由で後回しにしている
        図種ごとの欄.set(key, stripQuotes(raw));
        break;
      case "lane":
        out.lane = stripQuotes(raw);
        break;
      case "stack":
        out.stack = 数として読む(raw, "箱の stack", ln.no, errors);
        break;
      default:
        // 残りはパーツの状態の上書き
        state[key] = coerceStateValue(stripQuotes(raw));
        touchedState = true;
        unknownKeys.push({ key, line: ln.no });
        break;
    }
  }
  // 名前の行と縦に並べた行の両方に倍率がある形では、後に書いた縦の行を採る。
  // 知らせ (`scale-reserved`) は書かれた名前をすべて見るので、名前だけは足し合わせる
  if (scaleWritten.size > 0) {
    const s = resolveScale(scaleWritten, (key) => scaleLines.get(key) ?? actor.pos.line, errors);
    out.scale = s.scale;
    out.scaleKeys = [...new Set([...(actor.scaleKeys ?? []), ...s.keys])];
  }
  // 体験の道筋の欄は、パーツなら状態の上書き、そうでなければ道筋の欄として入れる
  for (const [key, v] of 図種ごとの欄) {
    if (out.partId !== undefined) {
      state[key] = coerceStateValue(v);
      touchedState = true;
      continue;
    }
    if (key === "touchpoint") out.touchpoint = v;
    else if (key === "opportunity") out.opportunity = v;
    else if (key === "owner") out.owner = v;
    else out.end = v;
  }
  // 状態も倍率も parts でだけ意味を持つ。 パーツなら知らせずに返す
  if (out.partId !== undefined) {
    if (touchedState) out.stateOverride = state;
    return out;
  }
  // パーツでない箱に書かれた見知らぬ項目は、 どこにも入らずに消える。 黙って捨てると
  // 「書いたのに図が変わらない」 が手掛かりなしで起きるので、 綴りの誤りとして知らせる
  for (const u of unknownKeys) {
    errors.push({
      line: u.line,
      message: `項目名が読めません: "${u.key}"`,
      hint: `使える項目 = ${[...ACTOR_ITEM_KEYS].join(", ")}`,
    });
  }
  return out;
}

/**
 * 縦に並べて書ける項目名。
 *
 * 綴りを誤った時の知らせに使う。 `applyContinuationLines` の分岐と揃える。
 */
export const ACTOR_ITEM_KEYS: ReadonlySet<string> = new Set([
  ...COLOR_KEYS,
  "kind",
  "種類",
  "subtitle",
  "補足",
  "value",
  "値",
  "rows",
  "行",
  // 箱の中に描く図形 (#1374)
  "shape",
  "図形",
  // その箱を出すかどうかの条件 (#1381)
  "visibleIf",
  "出す条件",
  // 箱に出す題 (#1381)
  "title",
  "題",
  "位置",
  "pos",
  "posX",
  "posY",
  "大きさ",
  "size",
  "倍率",
  "scale",
  "lane",
  "stack",
  // 体験の道筋の欄 (#1251)
  "touchpoint",
  "opportunity",
  // 工程の並びの欄 (#1251)
  "owner",
  "end",
]);

/**
 * 相対で書かれた位置が解けるかを確かめる。
 *
 * 解けない書き方は 3 通りある。 相手が居ない / 自分を基準にした / 基準が輪になっている。
 * どれも「書いたのに図が変わらない」 形で表に出るため、 図を出す前に行番号付きで知らせる。
 *
 * 誤りを見つけた actor からは相対の指定を外す。 残したままだと、 誤りを直さずに読み込んだ
 * 経路 (error を無視する呼出) で解決できない指定が組み立てまで届く。
 */
function validateRelativePositions(actors: DslActor[], errors: DslError[]): void {
  const named = new Set(actors.map((a) => a.name));
  const broken = new Set<string>();

  for (const a of actors) {
    const rel = a.posRel;
    if (!rel) continue;
    if (rel.anchor === a.name) {
      errors.push({
        line: a.pos.line,
        message: `位置の基準が自分自身です: "${a.name}"`,
        hint: "別の登場人物の名前を書く",
      });
      broken.add(a.name);
      continue;
    }
    if (!named.has(rel.anchor)) {
      errors.push({
        line: a.pos.line,
        message: `位置の基準が見つかりません: "${rel.anchor}"`,
        hint:
          named.size > 0
            ? `actors: に書かれている名前 = ${[...named].join(", ")}`
            : "actors: に基準にする登場人物を書く",
      });
      broken.add(a.name);
    }
  }

  const { cyclic } = orderByDependency(
    actors.map((a) => ({ name: a.name, rel: broken.has(a.name) ? undefined : a.posRel })),
  );
  for (const name of cyclic) {
    const a = actors.find((x) => x.name === name);
    errors.push({
      line: a?.pos.line ?? 1,
      message: `位置の基準が互いを指しています: "${name}"`,
      hint: "どれか 1 つは座標 (`位置: 300,200`) か自動配置にする",
    });
    broken.add(name);
  }

  for (const a of actors) {
    if (broken.has(a.name)) a.posRel = undefined;
  }
}

function collectActorEntries(
  lines: Line[],
  start: number,
  parentIndent: number,
): { items: Line[][]; next: number } {
  const items: Line[][] = [];
  let cur: Line[] | null = null;
  let headIndent = -1;
  let i = start;
  while (i < lines.length) {
    const ln = lines[i]!;
    if (!ln.trimmed) {
      i += 1;
      continue;
    }
    if (ln.indent <= parentIndent) break;
    if (ln.trimmed.startsWith("- ")) {
      if (cur) items.push(cur);
      cur = [{ ...ln, trimmed: ln.trimmed.slice(2).trim() }];
      headIndent = ln.indent;
    } else if (cur && ln.indent > headIndent) {
      // 頭より深い字下げは、 直前の 1 件の続き
      cur.push(ln);
    }
    i += 1;
  }
  if (cur) items.push(cur);
  return { items, next: i };
}

function collectAnimationSteps(
  lines: Line[],
  start: number,
  parentIndent: number,
): { items: Line[][]; next: number } {
  // 各 `- step: "..."` 開始を 1 block の頭として識別、 後続の同 indent 以下を block 本文として吸収
  const out: Line[][] = [];
  let i = start;
  let cur: Line[] | null = null;
  while (i < lines.length) {
    const ln = lines[i]!;
    if (!ln.trimmed) {
      i += 1;
      continue;
    }
    if (ln.indent <= parentIndent) break;
    // v0.4 の日本語の段名も block の頭として拾い、parsePhase で英語の `step` を案内する
    // (#1301)。ここで英語だけに絞ると `- ステップ:` は block 自体が作られず、段全体が
    // 誤りなしで黙って消える。
    if (ln.trimmed.startsWith("- step") || ln.trimmed.startsWith("- ステップ")) {
      if (cur) out.push(cur);
      cur = [{ ...ln, trimmed: ln.trimmed.slice(2).trim() }];
    } else if (cur) {
      // 続く property line (focus / tween / set / badge / description)
      cur.push(ln);
    }
    i += 1;
  }
  if (cur) out.push(cur);
  return { items: out, next: i };
}

/**
 * inline option の残 field (kind + 既存 reserved 除外後) を parts state override として抽出する。
 * CAR-1657 unified syntax = `- arc1: { kind: arc-gauge, v: 50, count: 100 }` の `v` / `count` を
 * `{ v: 50, count: 100 }` state override map に集約する経路。
 * 予約語衝突時は `state: { v: 50 }` 明示 fallback を使う (別 field で処理)。
 */
const ACTOR_RESERVED_FIELDS: ReadonlySet<string> = new Set([
  "kind",
  "subtitle",
  "eyebrow",
  "value",
  "rows",
  "lane",
  "stack",
  "initial",
  "final",
  "state",
  // 体験の道筋の欄 (`touchpoint` / `opportunity`) はここに載せない (#1251 Round 1 の指摘)。
  // 載せるとパーツで同じ名前の状態を書いた時に横取りされる = 既に動いている見本が静かに変わる。
  // パーツでない箱でだけ道筋の欄として読む (`parseActor` / `applyContinuationLines` が分岐する)
  // canvas pivot 新 spec = 絶対座標 4 field (dragon canvas pivot spec §layout-role-conversion)
  "posX",
  "posY",
  "posW",
  "posH",
  // canvas pivot UX 修正 (B1) = sub-node 単位 override map (nested `nodes: { header: {...} }`)
  "nodes",
  // 図形の倍率 (#1026)。 状態の名前としては読まない
  "scale",
  "倍率",
  // 日本語の項目名 (#1026)。 中括弧の形が日本語の項目名を読めるようになったため、
  // ここに載せないと状態の名前として拾われる。 縦に並べた形での意味 (位置 / 大きさ 等) は
  // 中括弧の形では未対応なので、これまでどおり落とす方に揃える
  "種類",
  "補足",
  "値",
  "行",
  "位置",
  "大きさ",
  "色",
]);

function extractStateOverride(
  opts: Record<string, string>,
): Record<string, number | string | boolean> | undefined {
  const out: Record<string, number | string | boolean> = {};
  let count = 0;
  // 明示 `state: {...}` fallback がある場合はそちらを優先 (nested map parse)
  const explicit = opts.state;
  if (explicit && explicit.startsWith("{") && explicit.endsWith("}")) {
    const inner = parseInlineMapping(explicit.slice(1, -1));
    for (const [k, v] of Object.entries(inner)) {
      out[k] = coerceStateValue(v);
      count += 1;
    }
  }
  // inline 拡散 = 予約語以外を state override として拾う (explicit と併用時は明示 wins)
  for (const [k, v] of Object.entries(opts)) {
    if (ACTOR_RESERVED_FIELDS.has(k)) continue;
    if (k in out) continue; // explicit で set 済 skip
    out[k] = coerceStateValue(v);
    count += 1;
  }
  return count > 0 ? out : undefined;
}

/**
 * canvas pivot UX 修正 (B1) = actor entry の inline map から `nodes: { header: { posX: ..., ... }, ... }`
 * 形式の nested override を抽出する。 outer parseInlineMapping が opts.nodes を string としてそのまま
 * 保持 (value 内 nested `{ }` は depth-aware で保護済) しているので、 本 fn で「outer `{...}` を剥がして
 * key: sub-map ペアに再 split → 各 sub-map を parseInlineMapping で解いて posX/Y/W/H に coerce」 する。
 * 未 field or 空 object なら undefined 返し (caller は actor.nodes を set しない)。
 */
function parseActorNodesField(
  raw: string | undefined,
  line: number,
  errors: DslError[],
): Record<string, DslActorNodeOverride> | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return undefined;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return undefined;
  // depth-aware split (parseInlineMapping と同じ logic を local reuse、 nested `{ }` / `[ ]` 保護)
  const parts: string[] = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i]!;
    if (c === "[" || c === "{") depth += 1;
    else if (c === "]" || c === "}") depth -= 1;
    if (c === "," && depth === 0) {
      parts.push(buf);
      buf = "";
      continue;
    }
    buf += c;
  }
  if (buf.trim()) parts.push(buf);
  const out: Record<string, DslActorNodeOverride> = {};
  for (const p of parts) {
    const colonIdx = p.indexOf(":");
    if (colonIdx < 0) continue;
    const key = p.slice(0, colonIdx).trim();
    const val = p.slice(colonIdx + 1).trim();
    if (!key || !val.startsWith("{") || !val.endsWith("}")) continue;
    const nodeOpts = parseInlineMapping(val.slice(1, -1));
    out[key] = 表で読む(ACTOR_NODE_VALUE_KINDS, nodeOpts, `nodes の ${key} の `, line, errors);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function coerceStateValue(raw: string): number | string | boolean {
  const stripped = stripQuotes(raw);
  if (stripped === "true") return true;
  if (stripped === "false") return false;
  const n = Number(stripped);
  if (Number.isFinite(n) && stripped !== "" && !isNaN(n)) return n;
  return stripped;
}

/**
 * パーツでない箱に倍率を書いた時に知らせる (#1026)。
 *
 * 倍率はパーツにしか効かない。 黙って捨てると「書いたのに大きさが変わらない」 が手掛かり
 * なしで起きる。 3 つの書き方すべてで同じ知らせを出す (縦に並べた形だけ知らせて他が黙る、
 * という状態を作らない)。
 */
function reportScaleOnNonPart(
  isPart: boolean,
  key: string | undefined,
  line: number,
  errors: DslError[],
): void {
  if (isPart || key === undefined) return;
  errors.push({
    line,
    message: `項目名が読めません: "${key}"`,
    hint: `使える項目 = ${[...ACTOR_ITEM_KEYS].join(", ")}`,
  });
}

/**
 * 中括弧の形で読める項目名。
 *
 * ここに無い名前は、 パーツでない箱ではどこにも入らずに消える。 `ACTOR_ITEM_KEYS` (縦に
 * 並べた形) とは別に持つ = 中括弧の形は位置や大きさを未対応にしてあり、 同じ集合にすると
 * 「知らせない」 側がずれる。
 */
/**
 * 中括弧の形で読める日本語と、その英語名 (#1301)。
 *
 * **英語が中括弧で読める欄だけを載せる**。 `位置` / `大きさ` / `色` は英語側
 * (`pos` / `size` / `color`) も中括弧では読めないため載せない = 英語で出来ないことを
 * 日本語で出来るようにはしない。
 *
 * 載せる前は、同じ意味の語が縦書きでは通り中括弧では「項目名が読めません」 になっていた。
 * 書き方によって日本語だけが落ちる状態を無くす。
 */
export const INLINE_ACTOR_ALIASES: Record<string, string> = {
  種類: "kind",
  補足: "subtitle",
  値: "value",
  行: "rows",
};

/** 中括弧に書かれた日本語の項目名を、同じ意味の英語名に寄せる (#1301) */
function 中括弧の別名を寄せる(opts: Record<string, string>): Record<string, string> {
  let 触った = false;
  const out: Record<string, string> = { ...opts };
  for (const [日, 英] of Object.entries(INLINE_ACTOR_ALIASES)) {
    if (!(日 in out)) continue;
    触った = true;
    // 英語を併記した時は英語を優先する (縦書き形が後勝ちなのと違い、こちらは 1 行に同居する)
    if (!(英 in out)) out[英] = out[日]!;
    delete out[日];
  }
  return 触った ? out : opts;
}

export const INLINE_ACTOR_KEYS: ReadonlySet<string> = new Set([
  "kind",
  "subtitle",
  "eyebrow",
  "value",
  "rows",
  "lane",
  "stack",
  "initial",
  "final",
  "tone",
  "nodes",
  // 体験の道筋の欄 (#1251)。 他の図種では組み立て側が知らせる
  "touchpoint",
  "opportunity",
  // 工程の並びの欄 (#1251)
  "owner",
  "end",
  "posX",
  "posY",
  "posW",
  "posH",
  // 箱の中に描く図形 (#1374)
  "shape",
  // その箱を出すかどうかの条件 (#1381)
  "visibleIf",
  // 箱に出す題 (#1381)。 名前と切り離して書ける
  "title",
  // 倍率は別経路 (`reportScaleOnNonPart`) が知らせる。 ここでも読める扱いにしないと
  // 同じ名前で 2 度知らせることになる
  "scale",
  "倍率",
  // 英語が読める欄の日本語別名 (#1301)。 一覧は `INLINE_ACTOR_ALIASES` が持つ
  ...Object.keys(INLINE_ACTOR_ALIASES),
]);
// `state` はパーツでだけ意味を持つ (`extractStateOverride` がパーツの時しか作らない)。
// 通常の箱で読める扱いにすると `- A: { state: { foo: 1 } }` が黙って消え、 本 file が塞ごうと
// している経路が予約語で残る (Round 1 review の指摘、 実測で確認)。 パーツ側は `isPart` の
// 早期 return が先に効くのでここに載せる必要が無い

/**
 * 矢印の中括弧に書ける欄と、その読み方 (#1275)。
 *
 * **parser がこの表を回して読む**。 欄ごとに `opts.xxx` を並べる形だと、README や検査が
 * 持つ一覧が実装と drift する = 欄を足しても誰も気付けない。 表を唯一の出どころにして、
 * `FLOW_INLINE_KEYS` から一覧を導けるようにする。
 */
const FLOW_INLINE_READERS = {
  sub: (v: string | undefined) => v,
  guard: (v: string | undefined) => v,
  cardinality: (v: string | undefined) => v,
  // 矢印がどの辺から出るか (#1385)。 描画側は 4 方向を取り、書かなければ自動で選ぶ
  side: (v: string | undefined) =>
    v !== undefined && (EDGE_SIDE_VALUES as readonly string[]).includes(v)
      ? (v as "top" | "right" | "bottom" | "left")
      : undefined,
  // 数と真偽の欄は `FLOW_INLINE_VALUE_KINDS` の表が読む (#1306)。 ここでは名前だけを持つ =
  // 読める欄の一覧 (`FLOW_INLINE_KEYS`) は本表から導くため、載せないと欄ごと消える
  labelOffsetX: null,
  labelOffsetY: null,
  overlay: null,
} as const;

/** 矢印の中括弧に書ける欄の名前。 README の一覧と突き合わせる (#1275) */
export const FLOW_INLINE_KEYS = Object.keys(
  FLOW_INLINE_READERS,
) as readonly (keyof typeof FLOW_INLINE_READERS)[];

/**
 * 中括弧に書かれた読めない項目名を知らせる (#1090)。
 *
 * 縦に並べた形は `applyContinuationLines` が既に知らせている。 中括弧の形だけが黙って
 * 捨てていた = 同じ意味を書いても、 書き方によって知らされたりされなかったりする。
 *
 * 実測 = 見本「プロジェクト構想」 は `- root: { title: "新プロジェクト" }` と書かれており、
 * 5 つの箱すべてで題が捨てられて識別子 (`root` 等) が出ていた。 知らせも出ないため、 書いた
 * 人には「書いたのに図が変わらない」 としか見えない。
 *
 * パーツでは知らせない。 中括弧に書いた名前は状態の上書きとして意味を持つ (`extractStateOverride`)。
 */
function reportUnknownInlineKeys(
  isPart: boolean,
  inner: string,
  line: number,
  errors: DslError[],
): void {
  if (isPart) return;
  // 値が空の形 (`{ title: }`) も見る。 `parseInlineMapping` は値が 1 文字以上ある項目しか
  // 拾わないため、 その結果を走査すると空白の有無で知らせが消える (実測 = `{title:}` と
  // `{ title:}` は黙って通り、 `{ title: }` だけ知らせが出た)。 契約が入力の整形に依存する
  // (Round 1 review の指摘)。 倍率が `writtenScaleFields` で同じ境界を持つのと揃える
  for (const field of splitInlineFields(inner)) {
    const idx = field.indexOf(":");
    if (idx < 0) continue;
    const key = field.slice(0, idx).trim();
    if (!key) continue;
    if (INLINE_ACTOR_KEYS.has(key)) continue;
    errors.push({
      line,
      message: `項目名が読めません: "${key}"`,
      hint: `使える項目 = ${[...INLINE_ACTOR_KEYS].join(", ")}`,
    });
  }
}

function parseActor(line: Line, errors: DslError[]): DslActor | null {
  // 5 形式 サポート:
  // 1. `Client`                              ... name のみ、 kind=actor default
  // 2. `Client: storage`                     ... name + kind 略記
  // 3. `Client: { kind: actor, subtitle: "..." }` ... name + inline option mapping
  // 4. `"画面"` / `"画面": event`           ... 日本語 quote
  // 5. `arc1: { kind: arc-gauge, v: 50 }`   ... CAR-1657 parts kind (partId + stateOverride)
  const raw = line.trimmed.trim();
  if (!raw) return null;
  // 3 / 5. inline mapping check (`Client: { ... }`)、 nested { } を depth count で正しく抽出
  const mapMatch = matchActorInlineMapping(raw);
  if (mapMatch) {
    const namePart = stripQuotes(mapMatch.name.trim());
    if (!namePart) return null;
    // 日本語の項目名を英語名に寄せてから読む (#1301)。 寄せないと、同じ意味の語が
    // 縦書きでは通り中括弧では落ちる
    const opts = 中括弧の別名を寄せる(parseInlineMapping(mapMatch.inner));
    const kindRaw = (opts.kind ?? "").toLowerCase();
    // CAR-1657 = kind が既存 NODE_KIND_VALID に無い場合 parts identifier 候補として partId に格納、
    // kind は actor default fallback。 compile 側 partsCatalog lookup で解決する。
    const isPart = kindRaw !== "" && !NODE_KIND_VALID.has(kindRaw);
    // 倍率はパーツにしか効かない。 書いたのに効かない状態を黙って作らない (#1026)。
    // 値が空の形でも名前を残すため、`opts` ではなく中身から直接拾う
    const inlineScale = resolveScale(writtenScaleFields(mapMatch.inner), line.no, errors);
    reportScaleOnNonPart(isPart, inlineScale.keys[0], line.no, errors);
    // 中括弧に書いた読めない項目名も知らせる (#1090)。 縦に並べた形だけが知らせていた
    reportUnknownInlineKeys(isPart, mapMatch.inner, line.no, errors);
    reportV04Kind(kindRaw, line.no, errors);
    // 中括弧に書いた読めない色名も知らせる (#1304)。 パーツでは `tone` が状態の上書きとして
    // 意味を持つため対象外 = 色として読もうとしない値を色として叱らない
    if (!isPart && opts.tone !== undefined && resolveTone(opts.tone) === undefined) {
      report読めない色(opts.tone, line.no, errors, { 線種も受ける: false });
    }
    const kind = isPart
      ? NODE_KIND_DEFAULT
      : resolveNodeKind(NODE_KIND_VALID.has(kindRaw) ? kindRaw : "");
    return {
      name: namePart,
      kind,
      // parts 候補は `kind` を既定に倒して `partId` へ退避するため、 名札に載せる種類としては
      // 「書かなかった」 と同じ扱いにする (#1058)
      kindWritten: kindRaw !== "" && !isPart,
      subtitle: opts.subtitle,
      eyebrow: opts.eyebrow,
      // パーツでは状態の上書きとして意味を持つため、道筋の欄として横取りしない (#1251)
      touchpoint: isPart ? undefined : opts.touchpoint,
      opportunity: isPart ? undefined : opts.opportunity,
      // 見本では状態の上書きとして意味を持つため横取りしない (#1251)
      owner: isPart ? undefined : opts.owner,
      end: isPart ? undefined : opts.end,
      value: opts.value,
      rows: opts.rows
        ? opts.rows
            .replace(/^\[|\]$/g, "")
            .split(/,(?![^[]*\])/)
            .map((x) => stripQuotes(x.trim()))
            .filter(Boolean)
        : undefined,
      lane: opts.lane,
      // 箱の中に描く図形 (#1374)。 パーツでは状態の上書きとして意味を持つため横取りしない
      shape:
        isPart || opts.shape === undefined
          ? undefined
          : 図形として読む(opts.shape, line.no, errors),
      // 出す条件 (#1381)。 パーツでは状態の上書きとして意味を持つため横取りしない
      visibleIf: isPart ? undefined : 出す条件として読む(opts.visibleIf, line.no, errors),
      // 箱に出す題 (#1381)。 空文字も意味を持つ (題を出さない箱) ため undefined と分ける
      title: isPart ? undefined : opts.title,
      ...表で読む(ACTOR_INLINE_VALUE_KINDS, opts, "箱の ", line.no, errors),
      // parts では `tone` を状態の上書きとして従来から使えるため、 色として横取りしない
      tone: isPart ? undefined : resolveTone(opts.tone),
      partId: isPart ? kindRaw : undefined,
      stateOverride: isPart ? extractStateOverride(opts) : undefined,
      // canvas pivot 新 spec = 絶対座標 field は `ACTOR_INLINE_VALUE_KINDS` の表が読む (#1306)
      // 図形の倍率 (#1026)。 どれが効くかは `resolveScale` が 1 箇所で決める
      scale: inlineScale.scale,
      scaleKeys: inlineScale.keys.length ? inlineScale.keys : undefined,
      // canvas pivot UX 修正 (B1) = sub-node 単位 override map (`nodes: { header: {posX:..., ...}, ...}`)
      nodes: parseActorNodesField(opts.nodes, line.no, errors),
      pos: { line: line.no },
    };
  }
  // 1 / 2 / 4
  if (lastTopLevelColon(raw) >= 0) {
    const idx = lastTopLevelColon(raw);
    const namePart = stripQuotes(raw.slice(0, idx).trim());
    const rest = raw.slice(idx + 1).trim();
    if (!namePart) return null;

    // `名前: 種類 "補足" [行, 行] 色` の形。 `{ }` を書かせない。
    //
    // 値は形で見分ける。 引用符付きは補足、 角括弧は行、 色名は色、 残りが種類。
    // 種類と色は語の集合が閉じているので取り違えない。
    const v = classifyValues(splitValues(rest), line.no, errors);

    // CAR-1657 = short form (`arc1: arc-gauge`) でも parts kind 対応、 未知 kind は partId 経路
    const isPart = v.kind !== "" && !NODE_KIND_VALID.has(v.kind);
    reportV04Kind(v.kind, line.no, errors);
    // 倍率はパーツにしか効かない (#1026)
    reportScaleOnNonPart(isPart, v.scaleKeys?.[0], line.no, errors);
    const kind = isPart
      ? NODE_KIND_DEFAULT
      : resolveNodeKind(NODE_KIND_VALID.has(v.kind) ? v.kind : "");
    return {
      name: namePart,
      kind,
      // parts 候補は `kind` を既定に倒して `partId` へ退避するため、 名札に載せる種類としては
      // 「書かなかった」 と同じ扱いにする (#1058)
      kindWritten: v.kind !== "" && !isPart,
      // parts では `tone` を状態の上書きとして扱うため、 色として渡さない
      tone: isPart ? undefined : v.tone,
      subtitle: v.subtitle,
      rows: v.rows,
      value: v.value,
      posX: v.posX,
      posY: v.posY,
      scale: v.scale,
      scaleKeys: v.scaleKeys?.length ? v.scaleKeys : undefined,
      partId: isPart ? v.kind : undefined,
      stateOverride: isPart ? v.state : undefined,
      pos: { line: line.no },
    };
  }
  const namePart = stripQuotes(raw);
  if (!namePart) return null;
  return { name: namePart, kind: NODE_KIND_DEFAULT, kindWritten: false, pos: { line: line.no } };
}

function parseFlowStep(line: Line, no: number, errors: DslError[]): DslStep | null {
  // 形式 (順序自由、 部分省略可):
  // 1. `Client -> API`                            ... label / option なし
  // 2. `Client -> API: "deposit"`                 ... label
  // 3. `Client -> API: "deposit" (success)`       ... label + tone tuple
  // 4. `Client -> API: "deposit" { sub: "...", guard: "...", cardinality: "1:N", labelOffsetY: -8, overlay: true }` ... inline option
  // 5. `Client -> API: "deposit" (success) { guard: "..." }` ... 両方
  const raw = line.trimmed;
  const arrowIdx = raw.indexOf("->");
  if (arrowIdx < 0) return null;
  const from = raw.slice(0, arrowIdx).trim();
  let rest = raw.slice(arrowIdx + 2).trim();
  let label = "";
  let tone: Tone | undefined;
  let style: EdgeStyle | undefined;
  // 欄は `FLOW_INLINE_READERS` の表から読む。 個別に並べると一覧が実装と drift する
  const 中括弧: Partial<Record<keyof typeof FLOW_INLINE_READERS, unknown>> = {};
  // inline option (`{ ... }`) を末尾から抽出
  const mapMatch = rest.match(/\s*\{([^}]*)\}\s*$/);
  let 数と真偽: 読んだ結果<typeof FLOW_INLINE_VALUE_KINDS> | undefined;
  if (mapMatch) {
    const opts = parseInlineMapping(mapMatch[1]!);
    // 文字列の欄はそのまま入れ、数と真偽の欄は表が読んで読めない値を知らせる (#1306)
    for (const k of FLOW_INLINE_KEYS) {
      const 読み手 = FLOW_INLINE_READERS[k];
      if (読み手 === null) continue;
      中括弧[k] = 読み手(opts[k]);
    }
    if (opts.side !== undefined && 中括弧.side === undefined) {
      errors.push({
        line: line.no,
        message: `矢印の side が読めません: "${opts.side}"`,
        hint: `使える値 = ${EDGE_SIDE_VALUES.join(", ")}`,
      });
    }
    数と真偽 = 表で読む(FLOW_INLINE_VALUE_KINDS, opts, "矢印の ", line.no, errors);
    rest = rest.slice(0, mapMatch.index ?? 0).trim();
  }
  const sub = 中括弧.sub as string | undefined;
  const guard = 中括弧.guard as string | undefined;
  const cardinality = 中括弧.cardinality as string | undefined;
  const side = 中括弧.side as "top" | "right" | "bottom" | "left" | undefined;
  const labelOffsetX = 数と真偽?.labelOffsetX;
  const labelOffsetY = 数と真偽?.labelOffsetY;
  const overlay = 数と真偽?.overlay;
  // 色と線種を末尾から取る。 括弧 (`(成功)`) と空白区切り (`成功`) の両方を受け付ける。
  //
  // 括弧は従来の書き方で、 catalog が使っている。 空白区切りは登場人物と揃えた形。
  const optMatch = rest.match(/\s*\(([^)]*)\)\s*$/);
  if (optMatch) {
    const opts = (optMatch[1] ?? "").split(",").map((s) => s.trim());
    for (const opt of opts) {
      const resolvedTone = resolveTone(opt);
      if (resolvedTone !== undefined) tone = resolvedTone;
      else if (STYLE_VALID.has(opt.toLowerCase())) style = opt.toLowerCase() as EdgeStyle;
      // 丸括弧に書けるのは色名と線種だけ。 読めない語を黙って捨てると、 書いた人には
      // 「書いたのに色が変わらない」 としか見えない (#1304)。 空の語 (`( )` / `(a,,b)`) は
      // 書き間違いというより余分な区切りなので知らせない
      else if (opt !== "") report読めない色(opt, line.no, errors, { 線種も受ける: true });
    }
    rest = rest.slice(0, optMatch.index ?? 0).trim();
  } else {
    // 末尾から順に、 色か線種として読める語を取る。 語の集合が閉じているので、 説明文の
    // 一部を誤って取ることはない。 読めない語に当たった時点で止める。
    const words = splitValues(rest);
    while (words.length > 1) {
      const last = words[words.length - 1]!;
      // 引用符付きは説明文なので取らない
      if (last.startsWith('"') || last.startsWith("'")) break;
      const resolvedTone = resolveTone(last);
      if (resolvedTone !== undefined) {
        tone = resolvedTone;
        words.pop();
        continue;
      }
      if (STYLE_VALID.has(last.toLowerCase())) {
        style = last.toLowerCase() as EdgeStyle;
        words.pop();
        continue;
      }
      break;
    }
    rest = words.join(" ");
  }
  let to = rest;
  const labelMatch = rest.match(/^(.+?):\s*(.+)$/);
  if (labelMatch) {
    to = (labelMatch[1] ?? "").trim();
    label = stripQuotes((labelMatch[2] ?? "").trim());
  }
  if (!from || !to) return null;
  return {
    no,
    from: stripQuotes(from),
    to: stripQuotes(to),
    label,
    tone,
    style,
    sub,
    guard,
    cardinality,
    side,
    labelOffsetX,
    labelOffsetY,
    overlay,
    pos: { line: line.no },
  };
}

function parseStateEntry(text: string, lineNo: number): DslState | null {
  // `client_bal: 100` / `status: "idle"`
  const m = text.match(/^([^:]+?)\s*:\s*(.+)$/);
  if (!m) return null;
  const name = (m[1] ?? "").trim();
  if (!isValueName(name)) return null;
  const raw = (m[2] ?? "").trim();
  const stripped = stripQuotes(raw);
  const asNum = Number(stripped);
  const initial: number | string =
    Number.isFinite(asNum) && stripped !== "" && !isNaN(asNum) ? asNum : stripped;
  return { name, initial, pos: { line: lineNo } };
}

/**
 * 字下げした行を 1 行も落とさずに集める。
 *
 * `collectIndentedList` は形が合わない行を黙って捨てるが、 `values` では捨てずに
 * 読み手 (`parseValueEntry`) へ渡して書き間違いとして報告させる。
 */
function collectIndentedRaw(
  lines: Line[],
  start: number,
  parentIndent: number,
): { items: Line[]; next: number } {
  const items: Line[] = [];
  let i = start;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln || !ln.trimmed || ln.trimmed.startsWith("#")) {
      i += 1;
      continue;
    }
    if (ln.indent <= parentIndent) break;
    items.push(ln);
    i += 1;
  }
  return { items, next: i };
}

/**
 * `waiting: "{inflow} - {done}"` を 1 件の値として読む。
 *
 * 名前と式の判定は `value-syntax.ts` が持つ (#1181)。 JSON 経路も同じ判定を使うため、
 * ここでは行番号を付けて報告する形にだけ責任を持つ。
 */
function parseValueEntry(text: string, lineNo: number, errors: DslError[]): DslValue | null {
  const m = text.match(/^([^:]+?)\s*:\s*(.+)$/);
  if (!m) {
    errors.push({
      line: lineNo,
      message: `invalid value entry: "${text}"`,
      hint: '`waiting: "{inflow} - {done}"` の形で書く',
    });
    return null;
  }
  const name = (m[1] ?? "").trim();
  if (!isValueName(name)) {
    errors.push({ line: lineNo, ...valueNameIssue(name) });
    return null;
  }
  const rest = (m[2] ?? "").trim();
  // きっかけ形 (`{ trigger: ..., to: ..., dur: ... }`) を先に見る。 式として読むと中括弧の中身が
  // 値の名前として検査され、 「trigger は名前に使えない」 のような直し方の伝わらない誤りになる
  if (isTriggerBody(rest)) {
    const { spec, issues } = parseValueTriggerBody(rest.slice(1, -1), name);
    if (spec === null) {
      for (const issue of issues) errors.push({ line: lineNo, ...issue });
      return null;
    }
    return {
      name,
      trigger: spec.trigger,
      to: spec.to,
      durationMs: spec.durationMs,
      pos: { line: lineNo },
    };
  }
  const expression = stripQuotes(rest);
  if (expression === "") {
    errors.push({
      line: lineNo,
      message: `empty expression for "${name}"`,
      hint: '`"{a} + {b}"` のように式を書く',
    });
    return null;
  }
  const issues = checkValueExpression(expression, name);
  if (issues.length > 0) {
    for (const issue of issues) errors.push({ line: lineNo, ...issue });
    return null;
  }
  return { name, expression, pos: { line: lineNo } };
}

function splitTopLevelCommas(s: string): string[] {
  // brace 内を考慮 ... 今回は単純 split (動作する範囲)
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function ensureAnimate(a: DslAnimate | undefined, lineNo: number): DslAnimate {
  if (a) return a;
  return { states: [], phases: [], pos: { line: lineNo } };
}

/**
 * 段に書ける項目の英語名。 `parsePhase` が受け付ける名前の入口でも使う。
 *
 * 誤りの案内で使うほか、**見本が値の名前にこの語を使っていないか** を見るのにも使う
 * (#1330)。 段の項目と値は階層が違うので衝突しないが、同じ語が 2 つの意味で並ぶと
 * 見本を読む人が階層から意味を判断することになる。
 */
export const PHASE_ITEM_WORDS = [
  "focus",
  "badge",
  "body",
  "description",
  "tween",
  "set",
  "draw",
] as const;

const 段の項目の英語 = PHASE_ITEM_WORDS;
const 段の項目の集合: ReadonlySet<string> = new Set(PHASE_ITEM_WORDS);

function parsePhase(block: Line[], errors: DslError[]): DslPhase | null {
  // block[0]!: `step: "request" 1.5s`
  const head = block[0]!;
  const m = head.trimmed.match(/^step\s*:\s*(.+)$/);
  if (!m) {
    errors.push({
      line: head.no,
      message: `invalid step header: "${head.trimmed}"`,
      hint: 'use `- step: "name" 1.5s`',
    });
    return null;
  }
  const headRest = (m[1] ?? "").trim();
  // `"request" 1.5s` 形式 ... quote 後の duration 抽出
  const headParse = parseStepHead(headRest);
  if (!headParse) {
    errors.push({
      line: head.no,
      message: `invalid step value: "${headRest}"`,
      hint: 'use `"name" 1.5s` (duration in s)',
    });
    return null;
  }
  const phase: DslPhase = {
    name: headParse.name,
    durationMs: headParse.durationMs,
    pos: { line: head.no },
    highlight: [],
    tweens: [],
    sets: [],
  };
  // 後続 property を順次 parse
  let i = 1;
  while (i < block.length) {
    const ln = block[i]!;
    const t = ln.trimmed;
    // **英数字以外の項目名も拾う** (#1301)。 以前は `[a-zA-Z]` で始まる名前しか見ておらず、
    // 日本語の項目名 (`強調` / `説明` 等) は match そのものが外れて **黙って捨てられていた**。
    // 拾った上で、知らない名前は下で誤りとして知らせる
    const propMatch = t.match(/^([^\s:]+)\s*:\s*(.*)$/);
    if (!propMatch) {
      i += 1;
      continue;
    }
    const key = (propMatch[1] ?? "").toLowerCase();
    const value = (propMatch[2] ?? "").trim();
    // 一覧を parse の入口にも使う。 分岐だけを増やして一覧を更新し忘れると、見本の名前との
    // 重なり検査が新しい項目を見落とすため、一覧にない語は各分岐へ到達させない。
    if (!段の項目の集合.has(key)) {
      errors.push({
        line: ln.no,
        message: `段の項目名が読めません: "${propMatch[1] ?? ""}"`,
        hint: 段の項目のヒント(propMatch[1] ?? ""),
      });
      i += 1;
      continue;
    }
    if (key === "focus") {
      phase.highlight = parseFocusList(value);
      i += 1;
      continue;
    }
    if (key === "badge") {
      phase.badge = stripQuotes(value);
      i += 1;
      continue;
    }
    if (key === "draw") {
      const 語 = stripQuotes(value).trim();
      // **読めない語を黙って捨てない** (#1304 / #1306 と同じ扱い)。 受ける語は 1 つだけで、
      // 書き間違いはその段が何も描かない形になって手掛かりが残らない
      if (!DRAW_WORDS.has(語)) {
        errors.push({
          line: ln.no,
          message: `draw に書けない語です: "${語}"`,
          hint: `使える語 = ${[...DRAW_WORDS].join(", ")}`,
        });
      } else {
        phase.draw = 語;
        phase.drawPos = { line: ln.no };
      }
      i += 1;
      continue;
    }
    if (key === "description" || key === "body") {
      phase.body = stripQuotes(value);
      i += 1;
      continue;
    }
    if (key === "tween") {
      // inline (tween: client_bal 100 -> 90) or block
      if (value) {
        const tw = parseTweenLine(value, ln.no);
        if (tw) phase.tweens!.push(tw);
        else
          errors.push({
            line: ln.no,
            message: `invalid tween: "${value}"`,
            hint: "use `tween: name 100 -> 90`",
          });
        i += 1;
        continue;
      }
      // block ... 後続の同 indent + 1 以上の行を取り込む
      const baseIndent = ln.indent;
      let j = i + 1;
      while (j < block.length) {
        const nx = block[j]!;
        if (nx.indent <= baseIndent) break;
        const tw = parseTweenLine(nx.trimmed, nx.no);
        if (tw) phase.tweens!.push(tw);
        else
          errors.push({
            line: nx.no,
            message: `invalid tween entry: "${nx.trimmed}"`,
            hint: "use `name: 100 -> 90`",
          });
        j += 1;
      }
      i = j;
      continue;
    }
    if (key === "set") {
      if (value) {
        const st = parseSetLine(value, ln.no);
        if (st) phase.sets!.push(st);
        i += 1;
        continue;
      }
      const baseIndent = ln.indent;
      let j = i + 1;
      while (j < block.length) {
        const nx = block[j]!;
        if (nx.indent <= baseIndent) break;
        const st = parseSetLine(nx.trimmed, nx.no);
        if (st) phase.sets!.push(st);
        j += 1;
      }
      i = j;
      continue;
    }
    // ここに来るのは一覧へ語を足したのに処理分岐を足していない時だけ。 黙って捨てると
    // 「一覧にはあるのに段が変わらない」 が手掛かりなしで起きる。
    errors.push({
      line: ln.no,
      message: `段の項目名が読めません: "${propMatch[1] ?? ""}"`,
      hint: 段の項目のヒント(propMatch[1] ?? ""),
    });
    i += 1;
  }
  return phase;
}

/**
 * 段の項目名が読めない時のヒント (#1301)。
 *
 * 日本語の名前は v0.4 の記法では使えたため、**同じ意味の英語を勧める**。
 * 「使えません」 だけだと、書いた人は代わりに何を書けばよいか分からない。
 */
function 段の項目のヒント(書いた名前: string): string {
  const 英語 = 段の項目の日本語[書いた名前];
  return 英語 !== undefined
    ? `v0.5 では英語で書く (\`${英語}\`)`
    : `使える項目 = ${段の項目の英語.join(", ")}`;
}

/**
 * `draw:` に書ける語と、その語が効く図種 (#1312 / #1314)。
 *
 * **語と図種の対応をここ 1 箇所で持つ**。 受ける語の一覧 (`DRAW_WORDS`) も、組み立て側が見る
 * 図種の一覧 (`DRAWABLE_DOC_TYPES`) も、この表から導く。 3 つを別々に並べると、語を足した時に
 * どれかが古いまま残る (#1310 / #1304 で 3 度直した形)。
 *
 * | 語 | 図種 | 起点 |
 * |---|---|---|
 * | `line` | `line` | 左端から右へ線が伸びる |
 * | `bar` | `bar` | 横軸から上へ棒が伸びる |
 * | `pie` | `pie` | 12 時から時計回りに扇が開く |
 * | `journey` | `journey` | 左端から右へ気持ちの線が伸びる |
 * | `mind` | `mind` | 中心から外へ枝が伸びる |
 * | `tree` | `tree` | 根から下へ枝が伸びる |
 * | `gantt` | `gantt` | 各帯の始端から右へ帯が伸びる |
 * | `funnel` | `funnel` | 上端から順に段が積まれる |
 *
 * `quadrant` は入れない。 4 つの区画に項目を置く図で **項目に順序が無く**、起点を決められない
 * (順番を書いた順で決めると、動きが図の意味を持たない)。
 *
 * いまは語と図種が同じ綴りだが、**同じものとして扱わない**。 語は書き手が書く名前で、
 * 図種は `type:` が取る値。 片方だけ別名を足したくなった時に、対応が表に残っている形にする。
 */
export const DRAW_TARGETS: ReadonlyMap<string, PresetType> = new Map<string, PresetType>([
  ["line", "line"],
  ["bar", "bar"],
  ["pie", "pie"],
  ["journey", "journey"],
  ["mind", "mind"],
  ["tree", "tree"],
  ["gantt", "gantt"],
  ["funnel", "funnel"],
]);

/** `draw:` に書ける語。 表から導く (#1314) */
export const DRAW_WORDS: ReadonlySet<string> = new Set(DRAW_TARGETS.keys());

/**
 * v0.4 で使えた段の項目名と、v0.5 での書き方 (#1301)。
 *
 * **`ANIM_SUBKEYS` からは導けない**。 あの表は v0.4 の日本語と v0.4 の英語を組にしており、
 * v0.5 が使う名前とは一致しない (`強調` の相手は v0.4 では `highlight`、v0.5 では `focus`)。
 * 2 つの記法の間の翻訳なので、対応は手で書く。
 *
 * 表に語が増えた時に取り残されないよう、`ANIM_SUBKEYS` の日本語を全て覆っていることを
 * 検査が確かめる (`v05-japanese-scope.test.ts`)。
 */
export const 段の項目の日本語: Record<string, string> = {
  強調: "focus",
  説明: "body",
  バッジ: "badge",
  遷移: "tween",
  切替: "set",
  // 状態は段の中ではなく最上位に書く (`states:`)
  状態: "states (最上位に書く)",
  // 段そのものの名前
  ステップ: "step",
};

function parseStepHead(s: string): { name: string; durationMs: number } | null {
  // 例: `"request" 1.5s` / `"step1" 1500ms` / `step1 2s`
  let rest = s.trim();
  let name = "";
  if (rest.startsWith('"') || rest.startsWith("'")) {
    const q = rest[0] ?? '"';
    const end = rest.indexOf(q, 1);
    if (end < 0) return null;
    name = rest.slice(1, end);
    rest = rest.slice(end + 1).trim();
  } else {
    const spaceIdx = rest.indexOf(" ");
    if (spaceIdx < 0) return null;
    name = rest.slice(0, spaceIdx);
    rest = rest.slice(spaceIdx + 1).trim();
  }
  const dm = rest.match(/^(\d+(?:\.\d+)?)\s*(ms|s)?$/);
  if (!dm) return null;
  const n = parseFloat(dm[1] ?? "0");
  const unit = dm[2] ?? "s";
  const durationMs = unit === "ms" ? Math.round(n) : Math.round(n * 1000);
  return { name, durationMs };
}

function parseFocusList(s: string): string[] {
  // `[Client, API]` / `Client, API` / `Client API` / `[Client, API, "Client -> API"]`
  // quote 内の space / comma / arrow は保護し、 quote 外の comma でのみ split する。
  let body = s.trim();
  if (body.startsWith("[") && body.endsWith("]")) body = body.slice(1, -1);
  // **引用部分を非引用部分と分けて覚えておく** (#1192)。 区間全体に quoted flag を
  // 付けるだけだと `Client "Aave v3"` まで 1 item になり、従来の空白区切りと混在できない。
  type FocusFragment = { text: string; quoted: boolean };
  const groups: FocusFragment[][] = [];
  let group: FocusFragment[] = [];
  let buf = "";
  let quote: string | null = null;
  const pushFragment = (quoted: boolean): void => {
    if (buf.trim()) group.push({ text: buf, quoted });
    buf = "";
  };
  const pushGroup = (): void => {
    pushFragment(false);
    if (group.length > 0) groups.push(group);
    group = [];
  };
  for (const ch of body) {
    if (quote) {
      if (ch === quote) {
        pushFragment(true);
        quote = null;
        continue;
      }
      buf += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      // item の途中にある引用符は名前の一部。 空白または区切りの直後だけ囲みを開始する。
      if (!buf || /\s$/.test(buf)) {
        pushFragment(false);
        quote = ch;
        continue;
      }
    }
    if (ch === ",") {
      pushGroup();
      continue;
    }
    buf += ch;
  }
  pushFragment(quote !== null);
  if (group.length > 0) groups.push(group);
  // "User -> API" のような quote 済 item は「1 item」 として groups に入る。
  // quote 外 item は依然として space split (旧挙動、 「Client API」 が 2 item として解釈される互換維持)。
  const out: string[] = [];
  for (const fragments of groups) {
    const whole = fragments
      .map(({ text }) => text)
      .join("")
      .trim();
    if (fragments.every(({ quoted }) => !quoted) && /[-→][>]?/.test(whole) && /\s/.test(whole)) {
      // arrow を含む非引用区間は「A -> B」パターン。 空白で分割しない。
      out.push(whole);
      continue;
    }
    for (const { text, quoted } of fragments) {
      const p = text.trim();
      if (!p) continue;
      // 引用符で囲んだ item は空白があっても切らず、非引用部分だけを従来どおり空白で切る。
      if (quoted) {
        out.push(p);
      } else {
        for (const x of p.split(/\s+/)) {
          if (x) out.push(x);
        }
      }
    }
  }
  return out;
}

function parseTweenLine(s: string, lineNo: number): DslTween | null {
  // `client_bal 100 -> 90` / `client_bal: 100 -> 90`
  const cleaned = s.replace(/^-\s*/, "").trim();
  const m = cleaned.match(/^([^:\s]+)\s*[:\s]\s*(-?\d+(?:\.\d+)?)\s*->\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const state = m[1] ?? "";
  if (!isValueName(state)) return null;
  return {
    state,
    from: parseFloat(m[2] ?? "0"),
    to: parseFloat(m[3] ?? "0"),
    pos: { line: lineNo },
  };
}

function parseSetLine(s: string, lineNo: number): DslSet | null {
  // `status: "loading"` / `status loading`
  const cleaned = s.replace(/^-\s*/, "").trim();
  const m = cleaned.match(/^([^:\s]+)\s*[:\s]\s*(.+)$/);
  if (!m) return null;
  const state = m[1] ?? "";
  if (!isValueName(state)) return null;
  const raw = (m[2] ?? "").trim();
  const stripped = stripQuotes(raw);
  const asNum = Number(stripped);
  const value: number | string =
    Number.isFinite(asNum) && stripped !== "" && !isNaN(asNum) ? asNum : stripped;
  return { state, value, pos: { line: lineNo } };
}
