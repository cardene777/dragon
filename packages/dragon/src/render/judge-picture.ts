/**
 * 判定の表 (#3879) を、書き出す絵の形で描く (#3891)。頁の表 (`judge.ts`) と違い、例の名前と添え書きをその例の✓と✕の行の上の帯に置き、
 * 左の例の列を持たない。枠と地と字と✓と✕と判定の札を SVG の要素で描き、`foreignObject` を使わないので、ブラウザでない道具でも同じ絵になる。
 *
 * 絵の幅は記事の本文ほどの枠 (`LOOK.judge.picture.width`) にする。帯の形でも収まらない表は規則の列を分け、帯の形の表を縦に積む。
 * どの段にも例の帯を置き、判定の列は最後の段に置く。字は縮めずに頁の表と同じ大きさで描き、幅は同梱した字の送り幅の表で測る。
 *
 * 色は色味の値と、それを混ぜた色を塗る。段を送る時は頁の表と同じく、根に `data-play` を、照らした列に `data-on` と `data-now` を書く (`showJudge`)。
 * 切り抜きや模様のように `url(#…)` で読む物を持たず、書き出した SVG が読む物は字の file の `data:` だけにする。
 * 角を落とす色味 (`corner: "cut"`) では、頁の表と同じく枠の右上と左下を落とし、番号の丸と判定の札の角を丸めない
 */
import type { JudgeLayout, JudgeRow } from "../kinds/judge/layout";
import { textWidth } from "../layout/measure";
import {
  FONT_VARS,
  LOOK,
  type Palette,
  paletteVars,
  text,
  type TextStyle,
  type Theme,
} from "../look/values";
import { noteGlyph } from "../blocks/pop/draw";
import { judgeNoteId } from "../kinds/judge/layout";
import { wrap } from "../kinds/lineup/layout";
/** 行数を変えずに一番狭い幅で折り、最後の行に字が 1 つだけ残る形を避ける */
function balanced(s: string, style: TextStyle, width: number): string[] {
  const lines = wrap(s, style, width);
  if (lines.length < 2) return lines;
  let lo = 0;
  let hi = width;
  for (let k = 0; k < 24; k++) {
    const mid = (lo + hi) / 2;
    if (wrap(s, style, mid).length <= lines.length) hi = mid;
    else lo = mid;
  }
  return wrap(s, style, hi);
}
const PROTO = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.DRAGON_PROTO_RULE_NOTE ?? "";
import { ICON_PATHS } from "./judge";
import { esc } from "./parts";
import { r1 } from "./round";

const J = LOOK.judge;
const P = J.picture;
const L = J.line;
const CUT = LOOK.corner.cut;
const N = LOOK.note;
/** 札で見せる表 (#3890) の、名前の右の i の丸と名前の間を足した幅 */
const MARK_W = N.markGap + 2 * N.badge;

type Judge = JudgeLayout["judge"];
type Cell = JudgeRow["cells"][number];

/** 字の形。太さは頁の表の CSS と同じ */
const STYLE = {
  head: text(J.text, 700),
  no: text(J.no, 700),
  value: text(J.small, 500),
  caseName: text(J.caseName, 700),
  note: text(J.small, 500),
  mark: text(J.small, 700, "mono"),
  dash: text(J.dash, 500),
  word: text(J.verdict, 700),
} as const;

/** 字の大きさ `size` の行の高さ */
const lineOf = (size: number): number => size * P.lead;

type Rgb = [number, number, number];

/** `#` で始まる色の値の成分と濃さ。読めない値 (色の名前、関数の形) は undefined */
function rgbOf(value: string): { rgb: Rgb; alpha: number } | undefined {
  const digits = /^#([0-9a-f]+)$/iu.exec(value.trim())?.[1] ?? "";
  if (![3, 4, 6, 8].includes(digits.length)) return undefined;
  const full = digits.length <= 4 ? [...digits].map((d) => d + d).join("") : digits;
  const at = (i: number): number => Number.parseInt(full.slice(i, i + 2), 16);
  return { rgb: [at(0), at(2), at(4)], alpha: full.length === 8 ? at(6) / 255 : 1 };
}

/** 色 `color` を `amount` の割合で `base` に混ぜた色。頁の表の `color-mix(in srgb, …)` と同じ色になる */
function mix(color: string, amount: number, base: string): string {
  const c = rgbOf(color);
  const b = rgbOf(base);
  if (!c || !b || c.alpha < 1 || b.alpha < 1)
    return `color-mix(in srgb,${color} ${r1(amount * 100)}%,${base})`;
  const parts = b.rgb.map((v, i) => Math.round(v + ((c.rgb[i] as number) - v) * amount));
  return `#${parts.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** 線の色。8 桁の色の値は色と濃さに分けて書く。ブラウザでない道具は 8 桁の値を読まないことがある */
function stroke(value: string): string {
  const c = rgbOf(value);
  if (!c || c.alpha === 1) return ` stroke="${esc(value)}" stroke-width="${L}"`;
  return ` stroke="${value.slice(0, 7)}" stroke-opacity="${r1(c.alpha)}" stroke-width="${L}"`;
}

/** 字の要素。`mid` は行の真ん中で、基準線は字の大きさの割合だけ下げる。`base` は基準線を直に渡す。`cls` は段を送る時に色を替える字の印 */
function textEl(
  s: string,
  x: number,
  mid: number,
  style: TextStyle,
  fill: string,
  extra: { anchor?: "middle"; dragon?: string; cls?: string; verdict?: string; base?: number } = {},
): string {
  const attrs = [
    extra.dragon ? ` data-dragon="${extra.dragon}"` : "",
    extra.verdict ? ` data-verdict="${extra.verdict}"` : "",
    extra.cls ? ` class="${extra.cls}"` : "",
    ` x="${r1(x)}" y="${r1(extra.base ?? mid + style.size * P.mid)}"`,
    extra.anchor ? ` text-anchor="${extra.anchor}"` : "",
    ` font-size="${style.size}" font-weight="${style.weight}" fill="${esc(fill)}"`,
  ];
  return `<text${attrs.join("")}>${esc(s)}</text>`;
}

/** 四角の角のうち、表の枠の角に当たる所 */
interface Corners {
  tl?: boolean;
  tr?: boolean;
  br?: boolean;
  bl?: boolean;
}

/**
 * 四角の形。表の枠の角に当たる角は、枠の内側の丸みで丸め、角を落とす色味では右上と左下を落とす。
 * 枠の角に当たらない四角は `rect` で描く
 */
function box(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  corners: Corners,
  cut: boolean,
  attrs: string,
): string {
  const r = cut
    ? Math.min(CUT - L, (x1 - x0) / 4, (y1 - y0) / 4)
    : Math.min(J.radius - L, (x1 - x0) / 2, (y1 - y0) / 2);
  const tl = !cut && corners.tl === true;
  const br = !cut && corners.br === true;
  const tr = corners.tr === true;
  const bl = corners.bl === true;
  if (!tl && !tr && !br && !bl)
    return `<rect x="${r1(x0)}" y="${r1(y0)}" width="${r1(x1 - x0)}" height="${r1(y1 - y0)}"${attrs}/>`;
  const turn = (x: number, y: number): string =>
    cut ? `L${r1(x)} ${r1(y)}` : `A${r1(r)} ${r1(r)} 0 0 1 ${r1(x)} ${r1(y)}`;
  const d = [
    tl ? `M${r1(x0)} ${r1(y0 + r)}${turn(x0 + r, y0)}` : `M${r1(x0)} ${r1(y0)}`,
    tr ? `L${r1(x1 - r)} ${r1(y0)}${turn(x1, y0 + r)}` : `L${r1(x1)} ${r1(y0)}`,
    br ? `L${r1(x1)} ${r1(y1 - r)}${turn(x1 - r, y1)}` : `L${r1(x1)} ${r1(y1)}`,
    bl ? `L${r1(x0 + r)} ${r1(y1)}${turn(x0, y1 - r)}` : `L${r1(x0)} ${r1(y1)}`,
    "Z",
  ];
  return `<path d="${d.join("")}"${attrs}/>`;
}

/** 表の枠の形。角を落とす色味では右上と左下を落とした多角形、ほかは角を丸めた四角。`inset` だけ内側に寄せる */
function frame(
  width: number,
  top: number,
  height: number,
  inset: number,
  cut: boolean,
  attrs: string,
): string {
  const [x0, y0, x1, y1] = [inset, top + inset, width - inset, top + height - inset];
  if (!cut)
    return `<rect x="${r1(x0)}" y="${r1(y0)}" width="${r1(x1 - x0)}" height="${r1(y1 - y0)}" rx="${r1(J.radius - inset)}"${attrs}/>`;
  const points = [
    [x0, y0],
    [width - CUT, y0],
    [x1, top + CUT],
    [x1, y1],
    [CUT, y1],
    [x0, top + height - CUT],
  ];
  return `<polygon points="${points.map(([x, y]) => `${r1(x as number)},${r1(y as number)}`).join(" ")}"${attrs}/>`;
}

/** 番号の丸の幅。番号の字が長い時は左右の余白を残して広げる */
const badgeOf = (no: number, least: number, style: TextStyle): number =>
  Math.max(least, textWidth(String(no), style) + 2 * J.badgeX);

/** 判定の語 */
const wordOf = (row: JudgeRow, judge: Judge): string =>
  row.verdict === "pass" ? judge.words.pass : judge.words.block;

/** 判定の札の大きさ。札は語だけを持つ (#3890) */
function pillOf(row: JudgeRow, judge: Judge): { w: number; h: number } {
  return { w: 2 * J.pillX + textWidth(wordOf(row, judge), STYLE.word), h: 2 * J.pillY + lineOf(J.verdict) };
}

/** 印の高さ。✕は外れた値を印の下に持つ */
const markHeight = (cell: Cell): number =>
  cell.mark === "skip"
    ? lineOf(J.dash)
    : J.icon + (cell.value === undefined ? 0 : L + lineOf(J.small));

/** 描く色。色味の値と、それを混ぜた色 */
interface Ink {
  surf: string;
  sunk: string;
  ink: string;
  mute: string;
  line: string;
  blue: string;
  /** 色の地の上の字。i の丸の中の i */
  onC: string;
  green: string;
  rose: string;
  cut: boolean;
}

/** 印。✓と✕は頁の表と同じ絵柄を線で描き、✕は外れた値を下に持つ。照らせない印は「—」。`data-y` は印の真ん中 */
function markEl(cell: Cell, cx: number, mid: number, ink: Ink): string {
  if (cell.mark === "skip")
    return `<g class="jm" data-dragon="judge-mark" data-mark="skip" data-y="${r1(mid)}">${textEl("—", cx, mid, STYLE.dash, ink.mute, { anchor: "middle" })}</g>`;
  const top = mid - markHeight(cell) / 2;
  const color = cell.mark === "pass" ? ink.green : ink.rose;
  const icon = `<path transform="translate(${r1(cx - J.icon / 2)} ${r1(top)})" d="${ICON_PATHS[cell.mark]}" fill="none" stroke="${esc(color)}" stroke-width="${J.stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const value =
    cell.value === undefined
      ? ""
      : textEl(cell.value, cx, top + J.icon + L + lineOf(J.small) / 2, STYLE.mark, color, {
          anchor: "middle",
          dragon: "judge-value",
          cls: "jx",
        });
  return `<g class="jm" data-dragon="judge-mark" data-mark="${cell.mark}" data-y="${r1(top + J.icon / 2)}">${icon}${value}</g>`;
}

/** 札で見せる表 (#3890) の i の丸。真ん中を `(cx, cy)` に置き、頁の表と箱の札の印と同じ丸と字の形を描く */
function markOf(cx: number, cy: number, ink: Ink): string {
  return `<g data-dragon="note-mark"><circle class="dg-nbc" cx="${r1(cx)}" cy="${r1(cy)}" r="${N.badge}" fill="${esc(ink.blue)}"/><g fill="${esc(ink.onC)}">${noteGlyph(cx, cy, "dg-nbi")}</g></g>`;
}

/** 判定の札。語だけを持ち、外れた規則は✕のセルで読む (#3890) */
function pillEl(row: JudgeRow, judge: Judge, cx: number, mid: number, ink: Ink): string {
  const size = pillOf(row, judge);
  const color = row.verdict === "pass" ? ink.green : ink.rose;
  const fill = mix(color, 0.14, ink.surf);
  const top = mid - size.h / 2;
  const items = [
    `<rect x="${r1(cx - size.w / 2)}" y="${r1(top)}" width="${r1(size.w)}" height="${r1(size.h)}" rx="${ink.cut ? 0 : r1(Math.min(J.pill, size.h / 2))}" fill="${esc(fill)}"/>`,
    textEl(wordOf(row, judge), cx, top + J.pillY + lineOf(J.verdict) / 2, STYLE.word, color, {
      anchor: "middle",
      dragon: "judge-word",
      verdict: row.verdict,
    }),
  ];
  return `<g class="jp">${items.join("")}</g>`;
}

/** 規則の列の見出し。番号の丸と名前を 1 行に並べ、値をその下に置く。札を持つ規則 (`marked`) は名前の右に i の丸を置く */
function headEl(
  judge: Judge,
  col: number,
  left: number,
  right: number,
  top: number,
  height: number,
  lit: string,
  ink: Ink,
  marked: boolean,
  noteLines: string[] = [],
  aligned = false,
): string {
  const rule = judge.rules[col];
  if (!rule) return "";
  const cx = (left + right) / 2;
  const badge = badgeOf(col + 1, J.badge, STYLE.no);
  const lines =
    lineOf(J.text) +
    (rule.value === undefined ? 0 : lineOf(J.small)) +
    (noteLines.length > 0 ? 4 + noteLines.length * lineOf(J.small) : 0);
  const first = aligned ? top + J.padY + lineOf(J.text) / 2 : top + (height - lines) / 2 + lineOf(J.text) / 2;
  const nameW = textWidth(rule.name, STYLE.head);
  const start = cx - (badge + J.badgeGap + nameW + (marked ? MARK_W : 0)) / 2;
  const items = [
    lit,
    `<rect class="jb" x="${r1(start)}" y="${r1(first - J.badge / 2)}" width="${r1(badge)}" height="${J.badge}" rx="${ink.cut ? 0 : J.badge / 2}" fill="${esc(mix(ink.blue, 0.14, ink.sunk))}"/>`,
    textEl(String(col + 1), start + badge / 2, first, STYLE.no, ink.blue, {
      anchor: "middle",
      dragon: "judge-no",
    }),
    textEl(rule.name, start + badge + J.badgeGap, first, STYLE.head, ink.ink, {
      dragon: "judge-rule-name",
      cls: "jt",
    }),
  ];
  if (marked) items.push(markOf(start + badge + J.badgeGap + nameW + N.markGap + N.badge, first, ink));
  if (rule.value !== undefined)
    items.push(
      textEl(
        rule.value,
        cx,
        first + (lineOf(J.text) + lineOf(J.small)) / 2,
        STYLE.value,
        ink.mute,
        { anchor: "middle", dragon: "judge-rule-value", cls: "jt" },
      ),
    );
  const noteTop = first + lineOf(J.text) / 2 + (rule.value === undefined ? 0 : lineOf(J.small)) + 4;
  noteLines.forEach((line, k) =>
    items.push(
      textEl(line, cx, noteTop + (k + 0.5) * lineOf(J.small), STYLE.note, ink.mute, {
        anchor: "middle",
        dragon: "judge-rule-note",
      }),
    ),
  );
  return `<g class="jh" data-dragon="judge-head" data-rule="${esc(rule.id)}" data-col="${col}">${items.join("")}</g>`;
}

/**
 * 列を絵の幅に収まる所で段に分ける。`widths` の最後は判定の列で、最後の段に入る。
 * 判定の列だけの段にしないよう、前の段の最後の規則の列が判定の列と並んで収まる時は、その列を最後の段へ移す
 */
function split(widths: number[], limit: number): number[][] {
  const blocks: number[][] = [[]];
  let used = 0;
  widths.forEach((w, i) => {
    const current = blocks.at(-1) as number[];
    if (current.length > 0 && used + w > limit) {
      blocks.push([i]);
      used = w;
    } else {
      current.push(i);
      used += w;
    }
  });
  const last = blocks.at(-1) as number[];
  const before = blocks.at(-2);
  const moved = before?.at(-1);
  if (
    before &&
    moved !== undefined &&
    last.length === 1 &&
    before.length > 1 &&
    (widths[moved] as number) + (widths[last[0] as number] as number) <= limit
  ) {
    before.pop();
    last.unshift(moved);
  }
  return blocks;
}

/** 列の幅。規則の列は見出しと全ての行の印と外れた値が入る幅、判定の列は見出しと全ての札が入る幅に左の区切りの線を足す */
function columnWidths(judge: Judge, marked: ReadonlySet<string>): number[] {
  const rules = judge.rules.map((rule, col) => {
    const head =
      badgeOf(col + 1, J.badge, STYLE.no) +
      J.badgeGap +
      textWidth(rule.name, STYLE.head) +
      (marked.has(judgeNoteId.rule(rule.id)) ? MARK_W : 0);
    const value = rule.value === undefined ? 0 : textWidth(rule.value, STYLE.value);
    const cells = judge.rows.map(({ cells: all }) => {
      const cell = all[col];
      if (!cell) return 0;
      return cell.mark === "skip"
        ? textWidth("—", STYLE.dash)
        : Math.max(J.icon, cell.value === undefined ? 0 : textWidth(cell.value, STYLE.mark));
    });
    return Math.max(head, value, J.mark, ...cells) + 2 * J.padX;
  });
  const verdict =
    L +
    2 * J.padX +
    Math.max(
      textWidth(judge.words.verdict, STYLE.head),
      ...judge.rows.map((row) => pillOf(row, judge).w),
    );
  return [...rules, verdict];
}

/** 判定の表を、例を帯に置いた SVG の絵にする。色味の変数と、段を送る時の見た目の規則を根に持つ */
export function judgePicture(layout: JudgeLayout, palette: Palette, theme: Theme): string {
  const judge = layout.judge;
  const { rules, rows, words } = judge;
  const tone = palette[theme];
  const ink: Ink = {
    surf: tone.surf ?? "",
    sunk: tone.sunk ?? "",
    ink: tone.ink ?? "",
    mute: tone.mute ?? "",
    line: tone.line ?? "",
    blue: tone["c-blue"] ?? "",
    onC: tone["on-c"] ?? "",
    green: tone["c-green"] ?? "",
    rose: tone["c-rose"] ?? "",
    cut: palette.corner === "cut",
  };
  const verdictIndex = rules.length;

  // 段に分け、どの段も同じ幅 (絵の幅) に広げる。広げた分は列の幅の割合で配る
  // 札で見せる表 (#3890) の札を持つ規則と例。名前の右に i の丸を置く
  const marked = new Set((layout.noteCards ?? []).map((note) => note.box));
  const widths = columnWidths(judge, marked);
  const groups = split(widths, P.width - 2 * L);
  const sums = groups.map((group) => group.reduce((sum, i) => sum + (widths[i] as number), 0));
  const bands = rows.map(
    (row, i) =>
      2 * J.padX +
      textWidth(row.name, STYLE.caseName) +
      (marked.has(judgeNoteId.case(i)) ? MARK_W : 0) +
      (row.note === undefined ? 0 : P.noteGap + textWidth(row.note, STYLE.note)),
  );
  const W = Math.ceil(
    Math.max(P.width, ...sums.map((sum) => sum + 2 * L), ...bands.map((band) => band + 2 * L)),
  );

  const stretched: number[] = [];
  groups.forEach((group, b) => {
    const sum = sums[b] as number;
    const extra = W - 2 * L - sum;
    group.forEach((i) => {
      stretched[i] = (widths[i] as number) * (sum > 0 ? 1 + extra / sum : 1);
    });
  });
  const noteLines = rules.map((rule, i) =>
    PROTO === "under" && rule.note !== undefined && !judge.pop
      ? balanced(rule.note, STYLE.note, (stretched[i] ?? 0) - 2 * J.padX)
      : [],
  );
  const mosts = groups.map((group) => Math.max(0, ...group.map((i) => noteLines[i]?.length ?? 0)));
  // 行の高さ。全ての段で揃えるので、全ての列の印と札から決める。見出しは段ごとに、その段の note の行数で決める
  const headBase =
    2 * J.padY +
    lineOf(J.text) +
    (rules.some((rule) => rule.value !== undefined) ? lineOf(J.small) : 0);
  const headHs = mosts.map((most) => headBase + (most > 0 ? 4 + most * lineOf(J.small) : 0));
  // 表の下に並べる note (foot)。番号の丸と名前と note を 1 項にし、表の幅で折る
  const footRules = PROTO === "foot" && !judge.pop ? rules.flatMap((rule, i) => (rule.note === undefined ? [] : [{ rule, i }])) : [];
  const footItems = footRules.map(({ rule, i }) => {
    const badge = badgeOf(i + 1, J.badge, STYLE.no);
    const nameW = textWidth(rule.name, STYLE.head);
    const indent = badge + J.badgeGap + nameW + P.noteGap;
    const first = wrap(rule.note as string, STYLE.note, W - 2 * L - 2 * J.padX - indent);
    return { rule, i, badge, nameW, indent, lines: first };
  });
  const bandH = J.padY + lineOf(J.caseName);
  const contents = rows.map((row) =>
    Math.max(lineOf(J.text), ...row.cells.map(markHeight), pillOf(row, judge).h),
  );
  const marksH = contents.map((content) => P.markTop + content + J.padY);
  const bodyH =
    3 * L +
    rows.reduce((sum, _, i) => sum + bandH + (marksH[i] as number), 0) +
    Math.max(0, rows.length - 1) * L;

  const blocks: string[] = [];
  let top = 0;
  groups.forEach((group, b) => {
    const headH = headHs[b] as number;
    const aligned = (mosts[b] as number) > 0;
    const H = bodyH + headH;
    const sum = sums[b] as number;
    const extra = W - 2 * L - sum;
    let x = L;
    const cols = group.map((index) => {
      const w = (widths[index] as number) * (sum > 0 ? 1 + extra / sum : 1);
      const at = { index, left: index === verdictIndex ? x + L : x, right: x + w, x };
      x += w;
      return at;
    });
    const last = cols.length - 1;
    const headTop = top + L;
    const headBottom = headTop + headH;
    const parts = [
      frame(W, top, H, 0, ink.cut, ` data-dragon="judge-frame" fill="${esc(ink.surf)}"`),
      box(
        L,
        headTop,
        W - L,
        headBottom,
        { tl: true, tr: true },
        ink.cut,
        ` fill="${esc(ink.sunk)}"`,
      ),
    ];
    // 見出し。照らした列の地は、表の枠の角に当たる角を枠の内側の形に合わせる
    cols.forEach((col, k) => {
      const lit = box(
        col.left,
        headTop,
        col.right,
        headBottom,
        { tl: k === 0, tr: k === last },
        ink.cut,
        ' class="jl" fill="none"',
      );
      parts.push(
        col.index === verdictIndex
          ? `<g class="jh" data-dragon="judge-verdict-head" data-col="${verdictIndex}">${lit}${textEl(words.verdict, (col.left + col.right) / 2, aligned ? headTop + J.padY + lineOf(J.text) / 2 : headTop + headH / 2, STYLE.head, ink.ink, { anchor: "middle", cls: "jt" })}</g>`
          : headEl(judge, col.index, col.left, col.right, headTop, headH, lit, ink, marked.has(judgeNoteId.rule(rules[col.index]?.id ?? "")), noteLines[col.index], aligned),
      );
    });
    const verdict = cols.find((col) => col.index === verdictIndex);
    const lines = [`M${L} ${r1(headBottom + L / 2)}H${r1(W - L)}`];
    if (verdict) lines.push(`M${r1(verdict.x + L / 2)} ${r1(headTop)}V${r1(headBottom + L)}`);
    let y = headBottom + L;
    rows.forEach((row, i) => {
      // 帯。例の名前と添え書きを 1 行に置き、頁の表と同じく小さい添え書きも名前と同じ基準線に揃える
      const nameMid = y + J.padY + lineOf(J.caseName) / 2;
      const base = nameMid + STYLE.caseName.size * P.mid;
      const nameX = L + J.padX;
      const band = [
        textEl(row.name, nameX, nameMid, STYLE.caseName, ink.ink, { dragon: "judge-case-name" }),
      ];
      const nameW = textWidth(row.name, STYLE.caseName);
      if (marked.has(judgeNoteId.case(i)))
        band.push(markOf(nameX + nameW + N.markGap + N.badge, nameMid, ink));
      if (row.note !== undefined)
        band.push(
          textEl(
            row.note,
            nameX + textWidth(row.name, STYLE.caseName) + P.noteGap,
            nameMid,
            STYLE.note,
            ink.mute,
            { dragon: "judge-note", base },
          ),
        );
      parts.push(`<g data-dragon="judge-band" data-case="${i}">${band.join("")}</g>`);
      // 印の行
      const marksTop = y + bandH;
      const marksBottom = marksTop + (marksH[i] as number);
      const isLast = i === rows.length - 1;
      const mid = marksTop + P.markTop + (contents[i] as number) / 2;
      cols.forEach((col, k) => {
        const lit = box(
          col.left,
          marksTop,
          col.right,
          marksBottom,
          isLast ? { bl: k === 0, br: k === last } : {},
          ink.cut,
          ' class="jl" fill="none"',
        );
        const cx = (col.left + col.right) / 2;
        const cell = row.cells[col.index];
        if (col.index === verdictIndex)
          parts.push(
            `<g class="jd" data-dragon="judge-verdict" data-case="${i}" data-col="${verdictIndex}">${lit}${pillEl(row, judge, cx, mid, ink)}</g>`,
          );
        else if (cell)
          parts.push(
            `<g class="jc" data-dragon="judge-cell" data-case="${i}" data-rule="${esc(cell.rule)}" data-col="${col.index}">${lit}${markEl(cell, cx, mid, ink)}</g>`,
          );
      });
      if (verdict)
        lines.push(
          `M${r1(verdict.x + L / 2)} ${r1(marksTop)}V${r1(marksBottom + (isLast ? 0 : L))}`,
        );
      if (!isLast) lines.push(`M${L} ${r1(marksBottom + L / 2)}H${r1(W - L)}`);
      y = marksBottom + (isLast ? 0 : L);
    });
    parts.push(`<path d="${lines.join("")}" fill="none"${stroke(ink.line)}/>`);
    // 表の枠の線は中身の上に描き、照らした列の地の角を枠の内側に収める
    parts.push(frame(W, top, H, L / 2, ink.cut, ` fill="none"${stroke(ink.line)}`));
    blocks.push(`<g data-dragon="judge-block" data-block="${b}">${parts.join("")}</g>`);
    top += H + (b === groups.length - 1 ? 0 : P.blockGap);
  });
  if (footItems.length > 0) {
    let y = top + P.blockGap;
    const foot: string[] = [];
    for (const item of footItems) {
      const x = L + J.padX;
      const mid = y + lineOf(J.text) / 2;
      foot.push(
        `<rect x="${r1(x)}" y="${r1(mid - J.badge / 2)}" width="${r1(item.badge)}" height="${J.badge}" rx="${ink.cut ? 0 : J.badge / 2}" fill="${esc(mix(ink.blue, 0.14, ink.sunk))}"/>`,
        textEl(String(item.i + 1), x + item.badge / 2, mid, STYLE.no, ink.blue, { anchor: "middle" }),
        textEl(item.rule.name, x + item.badge + J.badgeGap, mid, STYLE.head, ink.ink),
      );
      item.lines.forEach((line, k) =>
        foot.push(textEl(line, x + item.indent, mid + k * lineOf(J.small), STYLE.note, ink.mute, { dragon: "judge-rule-note", base: mid + STYLE.head.size * P.mid + k * lineOf(J.small) })),
      );
      y += lineOf(J.text) + Math.max(0, item.lines.length - 1) * lineOf(J.small) + 4;
    }
    blocks.push(`<g data-dragon="judge-rule-notes">${foot.join("")}</g>`);
    top = y;
  }

  // 段を送る間は、照らす前の列の印と判定を見せず、今照らしている列を頁の表と同じ色の地で示す
  const now = mix(ink.blue, 0.16, ink.sunk);
  const css = [
    ".jx{font-family:var(--mono)}",
    "[data-play] .jc:not([data-on]) .jm,[data-play] .jd:not([data-on]) .jp{opacity:0}",
    `[data-play] .jh[data-now]>.jl{fill:${now}}`,
    `[data-play] .jh[data-now] .jt{fill:${ink.blue}}`,
    `[data-play] .jh[data-now] .jb{fill:${mix(ink.blue, 0.14, now)}}`,
    `[data-play] .jc[data-now]>.jl,[data-play] .jd[data-now]>.jl{fill:${mix(ink.blue, 0.06, ink.surf)}}`,
  ].join("");
  const height = Math.ceil(top);
  const style = esc(`${FONT_VARS};${paletteVars(palette, theme)};font-family:var(--sans)`);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" data-dragon="judge" data-corner="${palette.corner}" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" style="${style}">` +
    `<style>${css}</style>${blocks.join("")}</svg>`
  );
}
