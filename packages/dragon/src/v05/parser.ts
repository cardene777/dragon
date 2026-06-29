/**
 * Text DSL v0.5 parser
 *
 * 設計方針:
 * - keyword は英語のみ (title / type / actors / flow / states / animation / step / focus / tween / set / badge)
 * - 値の日本語は quote 必須 (`title: "送金"` / `step: "送金開始" 1.5s`)
 * - YAML 風 + 短縮 keyword + 箇条書き構造
 * - Mermaid 知ってる人にもゼロ学習、 非エンジニアにも直感的
 *
 * syntax 例:
 *
 *   title: "送金フロー"
 *   type: sequence
 *
 *   actors:
 *     - Alice
 *     - Vault: storage
 *     - Bob
 *
 *   flow:
 *     - Alice -> Vault: "deposit"
 *     - Vault -> Bob: "send" (success)
 *
 *   states:
 *     alice_bal: 100
 *     bob_bal: 0
 *
 *   animation:
 *     - step: "送金開始" 1.5s
 *       focus: [Alice, Vault]
 *       tween:
 *         alice_bal: 100 -> 90
 *       badge: "送金開始"
 *
 *     - step: "送金完了" 1.5s
 *       focus: [Vault, Bob]
 *       tween:
 *         bob_bal: 0 -> 10
 *       badge: "送金完了"
 *
 * 出力は v0.4 と同じ DslDocument。 既存 compile.ts で CdlDiagram に変換できる。
 */

import type { NodeKind, Tone, EdgeStyle } from "@cardenelabs/cdl";
import type {
  DslDocument,
  DslActor,
  DslStep,
  DslAnimate,
  DslState,
  DslPhase,
  DslTween,
  DslSet,
  DslError,
  PresetType,
  Position,
  DslLane,
  DslGroup,
  DslViewport,
} from "../types";

export type V05ParseResult =
  | { ok: true; doc: DslDocument }
  | { ok: false; errors: DslError[] };

const PRESET_TYPES: ReadonlySet<PresetType> = new Set([
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
  "c4",
  "mind",
]);

const NODE_KIND_DEFAULT: NodeKind = "actor";

const NODE_KIND_VALID: ReadonlySet<string> = new Set([
  "actor",
  "function",
  "storage",
  "event",
  "cdn",
  "service",
  "database",
  "cache",
  "queue",
  "api",
  "person",
  "entity",
  "state",
  "container",
  "card",
  "lambda",
  "kms",
  "secret",
  "alb",
  "ecs",
  "rds",
  "s3",
  "iam",
  "user",
  "browser",
  // Solidity 専用 6 種
  "contract",
  "eoa",
  "multisig",
  "proxy",
  "library",
  "interface",
]);

const TONE_VALID: ReadonlySet<string> = new Set<string>([
  "success",
  "error",
  "warning",
  "info",
  "accent",
  "teal",
]);

const STYLE_VALID: ReadonlySet<string> = new Set<string>(["solid", "dotted-flow"]);

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
  let actors: DslActor[] = [];
  let flow: DslStep[] = [];
  let animate: DslAnimate | undefined = undefined;
  let viewport: DslViewport | undefined = undefined;
  let lanesMap: Record<string, DslLane> | undefined = undefined;
  let groupsMap: Record<string, DslGroup> | undefined = undefined;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trimmed || line.trimmed.startsWith("#")) {
      i += 1;
      continue;
    }
    const head = matchTopHeader(line.trimmed);
    if (!head) {
      errors.push({
        line: line.no,
        message: `unknown top-level key: "${line.trimmed}"`,
        hint: "expected one of: title, type, actors, flow, states, animation, viewport, lanes, groups",
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
      const { items, next } = collectIndentedList(lines, i + 1, line.indent);
      actors = items
        .map((it) => parseActor(it))
        .filter((a): a is DslActor => a !== null);
      for (const it of items) {
        if (parseActor(it) === null) {
          errors.push({
            line: it.no,
            message: `invalid actor entry: "${it.trimmed}"`,
            hint: 'use `- Alice` or `- Alice: storage`',
          });
        }
      }
      i = next;
      continue;
    }
    if (head.key === "flow") {
      const { items, next } = collectIndentedList(lines, i + 1, line.indent);
      let stepNo = 1;
      for (const it of items) {
        const step = parseFlowStep(it, stepNo);
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
        else errors.push({ line: it.no, message: `invalid state entry: "${it.trimmed}"`, hint: "use `name: initial`" });
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
          width: numberOrUndef(opts.width),
          height: numberOrUndef(opts.height),
          laneWidth: numberOrUndef(opts.laneWidth),
          gap: numberOrUndef(opts.gap),
          laneGap: numberOrUndef(opts.laneGap),
          nodeGap: numberOrUndef(opts.nodeGap),
          labelMargin: numberOrUndef(opts.labelMargin),
          pos: { line: line.no },
        };
        i += 1;
        continue;
      }
      // block: viewport:\n  width: 1400\n  height: 900\n  ...
      const { items, next } = collectIndentedList(lines, i + 1, line.indent);
      const opts: Record<string, string> = {};
      for (const it of items) {
        const m = it.trimmed.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.+)$/);
        if (m) opts[m[1]!] = stripQuotes(m[2]!.trim());
      }
      viewport = {
        width: numberOrUndef(opts.width),
        height: numberOrUndef(opts.height),
        laneWidth: numberOrUndef(opts.laneWidth),
        gap: numberOrUndef(opts.gap),
        laneGap: numberOrUndef(opts.laneGap),
        nodeGap: numberOrUndef(opts.nodeGap),
        labelMargin: numberOrUndef(opts.labelMargin),
        pos: { line: line.no },
      };
      i = next;
      continue;
    }
    if (head.key === "lanes") {
      // lanes:\n  l1: { x: 0, width: 320, label: "..." }\n  l2: { ... }
      const { items, next } = collectIndentedList(lines, i + 1, line.indent);
      lanesMap = {};
      for (const it of items) {
        const m = it.trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{([^}]*)\}\s*$/);
        if (m) {
          const id = m[1]!;
          const opts = parseInlineMapping(m[2]!);
          lanesMap[id] = {
            id,
            x: numberOrUndef(opts.x),
            width: numberOrUndef(opts.width),
            label: opts.label,
            contain: boolOrUndef(opts.contain),
            lifeline: boolOrUndef(opts.lifeline),
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
    if (head.key === "groups") {
      // groups:\n  aws: { label: "AWS", lanes: [ecs, rds] }
      const { items, next } = collectIndentedList(lines, i + 1, line.indent);
      groupsMap = {};
      for (const it of items) {
        const m = it.trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*\{([^}]*)\}\s*$/);
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

  if (!title) errors.push({ line: 1, message: "title is required", hint: 'add `title: "..."` at top' });
  if (!type) errors.push({ line: 1, message: "type is required", hint: "add `type: sequence|flow|swimlane|er|state|topology|solidity|gantt|class|pie|c4|mind`" });

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    doc: {
      title: title!,
      type: type!,
      actors,
      flow,
      animate,
      viewport,
      lanes: lanesMap,
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

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
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
 * actor 行から `name: { inner }` を depth count で抽出。 inner 内の `{ }` (例: `value: "{count}"`) を尊重。
 */
function matchActorInlineMapping(raw: string): { name: string; inner: string } | null {
  // colon 位置を探して name と rest に分ける
  const colonIdx = raw.indexOf(":");
  if (colonIdx < 0) return null;
  const name = raw.slice(0, colonIdx);
  let rest = raw.slice(colonIdx + 1).trim();
  if (!rest.startsWith("{")) return null;
  // depth count で対応 brace 探す
  let depth = 0;
  let endIdx = -1;
  for (let i = 0; i < rest.length; i += 1) {
    const c = rest[i]!;
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx < 0) return null;
  const inner = rest.slice(1, endIdx);
  return { name, inner };
}

/**
 * inline mapping を parse: `subtitle: "送り手", kind: actor, stack: 0`
 * brace 内は { } で wrap してから渡す、 本関数は内部だけ受ける
 * 値が `[a, b]` 配列は文字列のまま返す (caller で split)
 */
function parseInlineMapping(inner: string): Record<string, string> {
  const out: Record<string, string> = {};
  let depth = 0;
  let buf = "";
  const parts: string[] = [];
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
  for (const p of parts) {
    const m = p.match(/^\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.+?)\s*$/);
    if (m) {
      const key = m[1]!;
      let value = m[2]!.trim();
      value = stripQuotes(value);
      out[key] = value;
    }
  }
  return out;
}

function collectIndentedList(lines: Line[], start: number, parentIndent: number): { items: Line[]; next: number } {
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

function collectAnimationSteps(lines: Line[], start: number, parentIndent: number): { items: Line[][]; next: number } {
  // 各 `- step: "..."` 開始を 1 block の頭として識別、 後続の同 indent 以下を block 本文として吸収
  const out: Line[][] = [];
  let i = start;
  let cur: Line[] | null = null;
  let curBaseIndent = -1;
  while (i < lines.length) {
    const ln = lines[i]!;
    if (!ln.trimmed) {
      i += 1;
      continue;
    }
    if (ln.indent <= parentIndent) break;
    if (ln.trimmed.startsWith("- step")) {
      if (cur) out.push(cur);
      cur = [{ ...ln, trimmed: ln.trimmed.slice(2).trim() }];
      curBaseIndent = ln.indent;
    } else if (cur) {
      // 続く property line (focus / tween / set / badge / description)
      cur.push(ln);
    }
    i += 1;
  }
  if (cur) out.push(cur);
  return { items: out, next: i };
}

function parseActor(line: Line): DslActor | null {
  // 4 形式 サポート:
  // 1. `Alice`                              ... name のみ、 kind=actor default
  // 2. `Alice: storage`                     ... name + kind 略記
  // 3. `Alice: { kind: actor, subtitle: "送り手", value: "{x}" }` ... name + inline option mapping
  // 4. `"画面"` / `"画面": event`           ... 日本語 quote
  const raw = line.trimmed.trim();
  if (!raw) return null;
  // 3. inline mapping check (`Alice: { ... }`)、 nested { } を depth count で正しく抽出
  const mapMatch = matchActorInlineMapping(raw);
  if (mapMatch) {
    const namePart = stripQuotes(mapMatch.name.trim());
    if (!namePart) return null;
    const opts = parseInlineMapping(mapMatch.inner);
    const kindRaw = (opts.kind ?? "").toLowerCase();
    const kind = NODE_KIND_VALID.has(kindRaw) ? (kindRaw as NodeKind) : NODE_KIND_DEFAULT;
    return {
      name: namePart,
      kind,
      subtitle: opts.subtitle,
      eyebrow: opts.eyebrow,
      value: opts.value,
      rows: opts.rows
        ? opts.rows
            .replace(/^\[|\]$/g, "")
            .split(/,(?![^\[]*\])/)
            .map((x) => stripQuotes(x.trim()))
            .filter(Boolean)
        : undefined,
      lane: opts.lane,
      stack: numberOrUndef(opts.stack),
      initial: boolOrUndef(opts.initial),
      final: boolOrUndef(opts.final),
      pos: { line: line.no },
    };
  }
  // 1 / 2 / 4
  if (raw.includes(":")) {
    const idx = raw.lastIndexOf(":");
    const namePart = stripQuotes(raw.slice(0, idx).trim());
    const kindPart = raw.slice(idx + 1).trim().toLowerCase();
    if (!namePart) return null;
    const kind = NODE_KIND_VALID.has(kindPart) ? (kindPart as NodeKind) : NODE_KIND_DEFAULT;
    return { name: namePart, kind, pos: { line: line.no } };
  }
  const namePart = stripQuotes(raw);
  if (!namePart) return null;
  return { name: namePart, kind: NODE_KIND_DEFAULT, pos: { line: line.no } };
}

function parseFlowStep(line: Line, no: number): DslStep | null {
  // 形式 (順序自由、 部分省略可):
  // 1. `Alice -> Vault`                            ... label / option なし
  // 2. `Alice -> Vault: "deposit"`                 ... label
  // 3. `Alice -> Vault: "deposit" (success)`       ... label + tone tuple
  // 4. `Alice -> Vault: "deposit" { sub: "...", guard: "...", cardinality: "1:N", labelOffsetY: -8 }` ... inline option
  // 5. `Alice -> Vault: "deposit" (success) { guard: "..." }` ... 両方
  let raw = line.trimmed;
  const arrowIdx = raw.indexOf("->");
  if (arrowIdx < 0) return null;
  const from = raw.slice(0, arrowIdx).trim();
  let rest = raw.slice(arrowIdx + 2).trim();
  let label = "";
  let tone: Tone | undefined;
  let style: EdgeStyle | undefined;
  let sub: string | undefined;
  let guard: string | undefined;
  let cardinality: string | undefined;
  let labelOffsetX: number | undefined;
  let labelOffsetY: number | undefined;
  // inline option (`{ ... }`) を末尾から抽出
  const mapMatch = rest.match(/\s*\{([^}]*)\}\s*$/);
  if (mapMatch) {
    const opts = parseInlineMapping(mapMatch[1]!);
    sub = opts.sub;
    guard = opts.guard;
    cardinality = opts.cardinality;
    labelOffsetX = numberOrUndef(opts.labelOffsetX);
    labelOffsetY = numberOrUndef(opts.labelOffsetY);
    rest = rest.slice(0, mapMatch.index ?? 0).trim();
  }
  // tone / style 抽出 (末尾 `(...)`)
  const optMatch = rest.match(/\s*\(([^)]*)\)\s*$/);
  if (optMatch) {
    const opts = (optMatch[1] ?? "").split(",").map((s) => s.trim().toLowerCase());
    for (const opt of opts) {
      if (TONE_VALID.has(opt)) tone = opt as Tone;
      else if (STYLE_VALID.has(opt)) style = opt as EdgeStyle;
    }
    rest = rest.slice(0, optMatch.index ?? 0).trim();
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
    labelOffsetX,
    labelOffsetY,
    pos: { line: line.no },
  };
}

function parseStateEntry(text: string, lineNo: number): DslState | null {
  // `alice_bal: 100` / `status: "idle"`
  const m = text.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+)$/);
  if (!m) return null;
  const name = m[1] ?? "";
  const raw = (m[2] ?? "").trim();
  const stripped = stripQuotes(raw);
  const asNum = Number(stripped);
  const initial: number | string = Number.isFinite(asNum) && stripped !== "" && !isNaN(asNum) ? asNum : stripped;
  return { name, initial, pos: { line: lineNo } };
}

function splitTopLevelCommas(s: string): string[] {
  // brace 内を考慮 ... 今回は単純 split (動作する範囲)
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function ensureAnimate(a: DslAnimate | undefined, lineNo: number): DslAnimate {
  if (a) return a;
  return { states: [], phases: [], pos: { line: lineNo } };
}

function parsePhase(block: Line[], errors: DslError[]): DslPhase | null {
  // block[0]!: `step: "送金開始" 1.5s`
  const head = block[0]!;
  const m = head.trimmed.match(/^step\s*:\s*(.+)$/);
  if (!m) {
    errors.push({ line: head.no, message: `invalid step header: "${head.trimmed}"`, hint: 'use `- step: "name" 1.5s`' });
    return null;
  }
  const headRest = (m[1] ?? "").trim();
  // `"送金開始" 1.5s` 形式 ... quote 後の duration 抽出
  const headParse = parseStepHead(headRest);
  if (!headParse) {
    errors.push({ line: head.no, message: `invalid step value: "${headRest}"`, hint: 'use `"name" 1.5s` (duration in s)' });
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
    const propMatch = t.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (!propMatch) {
      i += 1;
      continue;
    }
    const key = (propMatch[1] ?? "").toLowerCase();
    const value = (propMatch[2] ?? "").trim();
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
    if (key === "description" || key === "body") {
      phase.body = stripQuotes(value);
      i += 1;
      continue;
    }
    if (key === "tween") {
      // inline (tween: alice_bal 100 -> 90) or block
      if (value) {
        const tw = parseTweenLine(value, ln.no);
        if (tw) phase.tweens!.push(tw);
        else errors.push({ line: ln.no, message: `invalid tween: "${value}"`, hint: "use `tween: name 100 -> 90`" });
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
        else errors.push({ line: nx.no, message: `invalid tween entry: "${nx.trimmed}"`, hint: "use `name: 100 -> 90`" });
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
    i += 1;
  }
  return phase;
}

function parseStepHead(s: string): { name: string; durationMs: number } | null {
  // 例: `"送金開始" 1.5s` / `"step1" 1500ms` / `step1 2s`
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
  // `[Alice, Vault]` / `Alice, Vault` / `Alice Vault`
  let body = s.trim();
  if (body.startsWith("[") && body.endsWith("]")) body = body.slice(1, -1);
  const parts = body.split(/[,\s]+/).map((x) => stripQuotes(x.trim())).filter(Boolean);
  return parts;
}

function parseTweenLine(s: string, lineNo: number): DslTween | null {
  // `alice_bal 100 -> 90` / `alice_bal: 100 -> 90`
  const cleaned = s.replace(/^-\s*/, "").trim();
  const m = cleaned.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*[:\s]\s*(-?\d+(?:\.\d+)?)\s*->\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  return {
    state: m[1] ?? "",
    from: parseFloat(m[2] ?? "0"),
    to: parseFloat(m[3] ?? "0"),
    pos: { line: lineNo },
  };
}

function parseSetLine(s: string, lineNo: number): DslSet | null {
  // `status: "loading"` / `status loading`
  const cleaned = s.replace(/^-\s*/, "").trim();
  const m = cleaned.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*[:\s]\s*(.+)$/);
  if (!m) return null;
  const raw = (m[2] ?? "").trim();
  const stripped = stripQuotes(raw);
  const asNum = Number(stripped);
  const value: number | string = Number.isFinite(asNum) && stripped !== "" && !isNaN(asNum) ? asNum : stripped;
  return { state: m[1] ?? "", value, pos: { line: lineNo } };
}
