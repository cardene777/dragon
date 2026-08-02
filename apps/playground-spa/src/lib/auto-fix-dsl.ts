import type { EdgeOffset } from "./auto-fix-offsets";

/**
 * 自動修正で得た offset を DSL の `flow:` 行に書き戻す (#992)。
 *
 * `CdlEditor.handleAutoFix` の中に直接書かれており、 editor を丸ごと描かないと確かめられ
 * なかった。 判定側 (`auto-fix-offsets`) は #382 で外に出したが、 **書き戻す側は覆えていない**
 * ままで、 経路が丸ごと壊れても判定側の test は通った。
 */

/** 対応付けに要る edge の情報。 */
export interface EdgeRef {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly label?: string;
}

/** 対応付けに要る node の情報。 DSL は名前で書き、 edge は id を持つ。 */
export interface NodeRef {
  readonly id: string;
  readonly title?: string;
}

/** `flow:` 配下の範囲。 */
export interface FlowRange {
  /** `flow:` の行番号。 */
  readonly start: number;
  /** 範囲の終わり (この行は含まない)。 */
  readonly end: number;
}

/** DSL の edge 行から読み取った内容。 */
export interface ParsedEdgeLine {
  readonly from: string;
  readonly to: string;
  readonly label: string;
}

/**
 * `flow:` の範囲を返す。 見つからなければ `null`。
 *
 * 次の top-level key (`^\w`) か文書末までを範囲とする。
 */
export function findFlowRange(lines: readonly string[]): FlowRange | null {
  const start = lines.findIndex((l) => /^\s*flow:\s*$/.test(l));
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[a-zA-Z]/.test(lines[i] ?? "")) {
      end = i;
      break;
    }
  }
  return { start, end };
}

/** 行が edge を書いた行か (`- a -> b` の形)。 */
export function isEdgeLine(line: string): boolean {
  return /^\s*-\s.+->/.test(line);
}

/** 行を「inline の手前」 と「inline の中身」 に分ける。 inline が無ければ中身は空。 */
function splitInline(line: string): { head: string; inner: string } {
  const m = line.match(/^(.*?)(\s*\{([^}]*)\})?\s*$/);
  return { head: m?.[1] ?? line, inner: m?.[3] ?? "" };
}

/**
 * inline の中身を field ごとに分ける。 引用符の中の `,` では切らない。
 *
 * 正規表現で `labelOffset[XY]: <数字>` を消す形は、 引用符の中に同じ文字列があると壊す
 * (実測 = `sub: "labelOffsetY: 4"` が `sub: ""` になる、 codex review Round 1 の指摘)。
 */
export function splitFields(inner: string): string[] {
  const out: string[] = [];
  let buf = "";
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (quote !== null) {
      buf += c;
      if (c === "\\" && i + 1 < inner.length) {
        buf += inner[++i];
        continue;
      }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      buf += c;
      continue;
    }
    if (c === ",") {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
      continue;
    }
    buf += c;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** field の key。 `key: value` の `key` を返す (引用符は外す)。 */
function keyOf(field: string): string {
  const k = field.slice(0, field.indexOf(":")).trim();
  return k.replace(/^["']|["']$/g, "");
}

/**
 * edge の行に offset を書く。 既にある `labelOffsetX` / `labelOffsetY` は消してから足す。
 *
 * 既存の inline を丸ごと捨てない。 捨てると `tone` 等の指定まで消える。 key が完全一致する
 * field だけを外すので、 引用符の中に同じ文字列があっても壊さない。
 */
export function writeOffsetToEdgeLine(line: string, offset: EdgeOffset): string {
  const { head, inner } = splitInline(line);
  const kept = splitFields(inner).filter((f) => {
    const k = keyOf(f);
    return k !== "labelOffsetX" && k !== "labelOffsetY";
  });
  if (offset.offsetY !== undefined) kept.push(`labelOffsetY: ${offset.offsetY}`);
  if (offset.offsetX !== undefined) kept.push(`labelOffsetX: ${offset.offsetX}`);
  return kept.length > 0 ? `${head} { ${kept.join(", ")} }` : head;
}

/**
 * edge 行から `from` / `to` / `label` を読む。 読めなければ `null`。
 *
 * inline は先に外す。 label に `{` が現れる形と区別できないため。
 */
export function parseEdgeLine(line: string): ParsedEdgeLine | null {
  const { head } = splitInline(line);
  const m = head.match(/^\s*-\s+(.+?)\s*->\s*([^:]+?)\s*(?::\s*(.*))?$/);
  if (!m) return null;
  const strip = (s: string): string => s.trim().replace(/^["']|["']$/g, "");
  return { from: strip(m[1]), to: strip(m[2]), label: strip(m[3] ?? "") };
}

/** DSL に書かれた名前から node の id を引く表を作る。 名前は title と id の両方を受ける。 */
function nodeIdIndex(nodes: readonly NodeRef[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const n of nodes) {
    out.set(n.id, n.id);
    if (n.title !== undefined && !out.has(n.title)) out.set(n.title, n.id);
  }
  return out;
}

/**
 * `applyOffsetsToFlow` の結果。
 *
 * 当てられなかった edge を分けて返す。 順番だけで対応付けていた頃は、 当たらなかった分も
 * 「反映しました」 と数えていた (codex review Round 1 の指摘)。
 */
export interface ApplyResult {
  /** 書き換えた後の source。 変わらなければ `null`。 */
  readonly src: string | null;
  /** 実際に書き込めた edge の id。 */
  readonly applied: readonly string[];
  /** 対応する行が見つからず書き込めなかった edge の id。 */
  readonly unmatched: readonly string[];
}

/**
 * offset を DSL に書き戻す。
 *
 * **順番では対応付けない**。 compiler は DSL の行順どおりに edge を作らない (実測 =
 * `a -> c` / `c -> b` と書くと `e-a-b` / `e-b-c` の順で、 label も入れ替わる)。 順番で当てると
 * 別の行に offset が入り、 それでも「反映しました」 と出る。
 *
 * 代わりに行から読んだ `from` / `to` / `label` を edge と照合する。 対応は **offset の対象に
 * 関わらず全 edge について先に確定する**。 対象だけを走査すると、 同じ 3 つ組の行が複数あって
 * 後ろの edge だけが対象の時に前の行へ当ててしまう。
 *
 * @param src 現在の source
 * @param edges `diagram.edges`
 * @param nodes `diagram.nodes` (DSL の名前から id を引くため)
 * @param offsetByEdge edge の id から当てる offset
 */
export function applyOffsetsToFlow(
  src: string,
  edges: readonly EdgeRef[],
  nodes: readonly NodeRef[],
  offsetByEdge: ReadonlyMap<string, EdgeOffset>,
): ApplyResult {
  if (offsetByEdge.size === 0) return { src: null, applied: [], unmatched: [] };
  const lines = src.split("\n");
  const range = findFlowRange(lines);
  if (range === null) return { src: null, applied: [], unmatched: [...offsetByEdge.keys()] };

  const idOf = nodeIdIndex(nodes);

  // **全 edge の対応を先に確定する**。 offset の対象だけを走査すると、 同じ 3 つ組の行が複数
  // あって後ろの edge だけが対象の時に、 前の行へ当ててしまう (codex review Round 2 の指摘)。
  // 対応は `diagram.edges` の順に取る = 同じ 3 つ組なら前の edge が前の行を取る。
  const lineOf = new Map<string, number>();
  const used = new Set<number>();
  for (const e of edges) {
    for (let i = range.start + 1; i < range.end; i++) {
      if (used.has(i)) continue;
      const line = lines[i] ?? "";
      if (!isEdgeLine(line)) continue;
      const p = parseEdgeLine(line);
      if (p === null) continue;
      if ((idOf.get(p.from) ?? p.from) !== e.from) continue;
      if ((idOf.get(p.to) ?? p.to) !== e.to) continue;
      if (p.label !== (e.label ?? "")) continue;
      used.add(i);
      lineOf.set(e.id, i);
      break;
    }
  }

  const applied: string[] = [];
  const unmatched: string[] = [];
  let changed = false;
  for (const [id, offset] of offsetByEdge) {
    const i = lineOf.get(id);
    if (i === undefined) {
      unmatched.push(id);
      continue;
    }
    const next = writeOffsetToEdgeLine(lines[i] ?? "", offset);
    if (next !== lines[i]) {
      lines[i] = next;
      changed = true;
    }
    applied.push(id);
  }
  return { src: changed ? lines.join("\n") : null, applied, unmatched };
}
