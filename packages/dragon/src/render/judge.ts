/**
 * 判定の表 (#3879) を HTML の表で描く。SVG で描くと枠の幅へ縮めた時に字が小さくなるので、字は値の表 (`LOOK.judge`) の大きさのまま描き、
 * 枠に収まらない表は横に送る枠 (`.dg-jw`) の中を送り、例の列 (`.dg-jk`) を左に留める。携帯の幅でも同じ形にする。
 *
 * 構成は本人が選んだ見本に揃える。見出しは例、番号と名前と値を持つ規則、判定の順で、例のセルは名前の下に添え書きを、
 * ✕のセルは印の下に外れた値を持つ。判定の札は語だけを持ち、どこで止まったかは✕のセルで読む (#3890)。照らせないセルは「—」にする。
 * 規則の `note` は値の下に小さな字で描く。1 行目に `[note: pop]` を書いた表 (#3890) は、`note` を持つ規則の見出しと例の名前のセルを押せる所
 * (`data-note`) にし、名前のすぐ右に箱の札と同じ i の丸を置き、規則と例の `note` を描かずに押すと出る札 (`blocks/pop/cards.ts`) で見せる。
 * 描いただけの表は全てのセルと判定を埋めた形で、再生の部品が段を送る時だけ、表の根に `data-play` を、照らした列のセルに `data-on` を書く (`showJudge`)。
 * 印刷の形では照らしていないセルも見せ、横に送る枠を開いて全ての列を描く。
 * 角を落とす色味 (`corner: "cut"`) では、図の箱と同じく表の枠の右上と左下を落とし、番号の丸と判定の札の角を丸めない
 */
import type { JudgeLayout, JudgeRow } from "../kinds/judge/layout";
import { noteGlyph } from "../blocks/pop/draw";
import { judgeNoteId } from "../kinds/judge/layout";
import { FONT_VARS, LOOK, type Palette, PLAIN_TEXT, paletteVars, type Theme } from "../look/values";

const J = LOOK.judge;
const N = LOOK.note;
const px = (v: number): string => `${v}px`;
const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** ✓と✕の線の形。縦横 `J.icon` の升の中に描く。書き出す絵の形 (`judge-picture.ts`) も同じ形を描く */
export const ICON_PATHS = { pass: "M4.5 10.5l3.5 3.5 7.5-8", fail: "M5.5 5.5l9 9M14.5 5.5l-9 9" } as const;

/** ✓と✕の絵柄。印の升に描き、枠の幅で縮めないので viewBox を持たない */
const ICONS = {
  pass: `<svg width="${J.icon}" height="${J.icon}" fill="none" stroke="currentColor" stroke-width="${J.stroke}" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="✓"><path d="${ICON_PATHS.pass}"/></svg>`,
  fail: `<svg width="${J.icon}" height="${J.icon}" fill="none" stroke="currentColor" stroke-width="${J.stroke}" stroke-linecap="round" role="img" aria-label="✕"><path d="${ICON_PATHS.fail}"/></svg>`,
} as const;

/** 色の変数 `color` を `amount` % だけ `base` に混ぜた色。印の地と、今照らしている列の地に使う */
const MIX = (color: string, amount: number, base = "transparent"): string => `color-mix(in srgb,var(--${color}) ${amount}%,${base})`;

/** 表の枠の線 */
const LINE = `${px(J.line)} solid var(--line)`;

/** 角を落とす色味の、表の枠の右上と左下を落とす形 */
const CUT = LOOK.corner.cut;
const CUT_FRAME = `polygon(0 0,calc(100% - ${px(CUT)}) 0,100% ${px(CUT)},100% 100%,${px(CUT)} 100%,0 calc(100% - ${px(CUT)}))`;

/** 判定の表の見た目。字の大きさはどれも値の表から取り、読める大きさ (`READABLE_PX`) を下回らない */
export const JUDGE_CSS = [
  `.dg-judge{display:block;width:100%;color:var(--ink);font-family:var(--sans);${PLAIN_TEXT}}`,
  `.dg-judge .dg-jw{overflow-x:auto;overscroll-behavior-x:contain;border:${LINE};border-radius:${px(J.radius)};background:var(--surf)}`,
  `.dg-judge .dg-jt{border-collapse:separate;border-spacing:0;width:100%;font-size:${px(J.text)};line-height:1.5}`,
  `.dg-judge th,.dg-judge td{padding:${px(J.padY)} ${px(J.padX)};border-bottom:${LINE};text-align:center;vertical-align:middle;white-space:nowrap;font-weight:500}`,
  ".dg-judge tbody tr:last-child>*{border-bottom:0}",
  `.dg-judge thead th{background:var(--sunk);font-weight:700;font-size:${px(J.text)}}`,
  // 例の列は左に留める。横に送っても、どの例の行かを見失わない
  `.dg-judge .dg-jk{position:sticky;left:0;z-index:1;text-align:left;background:var(--surf);border-right:${LINE}}`,
  ".dg-judge thead .dg-jk{background:var(--sunk)}",
  `.dg-judge .dg-jn{display:inline-grid;place-items:center;min-width:${px(J.badge)};height:${px(J.badge)};padding:0 ${px(J.badgeX)};box-sizing:border-box;border-radius:${px(J.badge / 2)};background:${MIX("c-blue", 14)};color:var(--c-blue);font-size:${px(J.no)};font-weight:700;margin-right:${px(J.badgeGap)}}`,
  `.dg-judge .dg-jv{display:block;font-weight:500;font-size:${px(J.small)};color:var(--mute)}`,
  `.dg-judge .dg-jcn{display:block;font-weight:700;font-size:${px(J.caseName)}}`,
  `.dg-judge .dg-jcs{display:block;font-size:${px(J.small)};color:var(--mute)}`,
  `.dg-judge .dg-jd{border-left:${LINE}}`,
  `.dg-judge .dg-jm{display:inline-flex;flex-direction:column;align-items:center;gap:${px(J.line)};min-width:${px(J.mark)};transition:opacity .25s}`,
  `.dg-judge .dg-jm svg{display:block;width:${px(J.icon)};height:${px(J.icon)}}`,
  '.dg-judge .dg-jm[data-mark="pass"]{color:var(--c-green)}',
  '.dg-judge .dg-jm[data-mark="fail"]{color:var(--c-rose)}',
  `.dg-judge .dg-jm[data-mark="skip"]{color:var(--mute);font-size:${px(J.dash)}}`,
  `.dg-judge .dg-jx{font-size:${px(J.small)};font-weight:700;font-family:var(--mono)}`,
  `.dg-judge .dg-jp{display:inline-block;border-radius:${px(J.pill)};padding:${px(J.pillY)} ${px(J.pillX)};font-size:${px(J.verdict)};font-weight:700;transition:opacity .3s}`,
  `.dg-judge .dg-jp[data-verdict="pass"]{background:${MIX("c-green", 14)};color:var(--c-green)}`,
  `.dg-judge .dg-jp[data-verdict="block"]{background:${MIX("c-rose", 14)};color:var(--c-rose)}`,
  // 規則の note は、札で見せない表では値の下に小さな字で描く (#3890)。長い説明でも見出しの列を広げすぎないよう折り返す
  `.dg-judge .dg-jrn{display:block;font-weight:500;font-size:${px(J.small)};color:var(--mute);white-space:normal}`,
  // 札で見せる表の押せるセル。名前と i の丸は行の高さの真ん中で揃え、間を空ける (#3890)
  ".dg-judge th[data-note]{cursor:pointer}",
  `.dg-judge th[data-note]:hover{background:${MIX("c-blue", 7, "var(--surf)")}}`,
  ".dg-judge thead th[data-note]:hover{background:" + MIX("c-blue", 9, "var(--sunk)") + "}",
  `.dg-judge th[data-note]:focus-visible{outline:${px(2)} solid var(--c-blue);outline-offset:-${px(2)}}`,
  `.dg-judge .dg-jnm{display:inline-flex;align-items:center;gap:${px(N.markGap)}}`,
  ".dg-judge .dg-jmk{display:block;flex:none}",
  ".dg-judge .dg-nbc{fill:var(--c-blue)}.dg-judge .dg-nbi{fill:var(--on-c)}",
  // 角を落とす色味では、表の枠の右上と左下を落とし、小さな部品の角を丸めない
  `.dg-judge[data-corner="cut"] .dg-jw{border-radius:0;clip-path:${CUT_FRAME}}`,
  '.dg-judge[data-corner="cut"] .dg-jn,.dg-judge[data-corner="cut"] .dg-jp{border-radius:0}',
  // 再生の部品が段を送る間は、照らす前の列のセルの印と判定を見せず、今照らしている列を青の地で示す
  ".dg-judge[data-play] .dg-jc:not([data-on]) .dg-jm,.dg-judge[data-play] .dg-jd:not([data-on]) .dg-jp{opacity:0}",
  `.dg-judge[data-play] th[data-now]{background:${MIX("c-blue", 16, "var(--sunk)")};color:var(--c-blue)}`,
  `.dg-judge[data-play] td[data-now]{background:${MIX("c-blue", 6)}}`,
  // 印刷の形では、照らしていないセルも見せ、横に送る枠を開いて全ての列を紙に描く
  "@media print{.dg-judge[data-play] .dg-jm,.dg-judge[data-play] .dg-jp{opacity:1}.dg-judge .dg-jw{overflow:visible}.dg-judge[data-play] [data-now]{background:inherit;color:inherit}}",
].join("");

/** 規則のセル */
function cellOf(cell: JudgeRow["cells"][number]): string {
  const mark =
    cell.mark === "skip"
      ? '<span class="dg-jm" data-dragon="judge-mark" data-mark="skip">—</span>'
      : `<span class="dg-jm" data-dragon="judge-mark" data-mark="${cell.mark}">${ICONS[cell.mark]}${cell.value === undefined ? "" : `<span class="dg-jx" data-dragon="judge-value">${esc(cell.value)}</span>`}</span>`;
  return `<td class="dg-jc" data-rule="${esc(cell.rule)}" data-col="${cell.col}">${mark}</td>`;
}

/** 札で見せる表 (#3890) の i の丸。箱の札の印と同じ丸と字の形を、名前の字の行に置く大きさで描く */
const MARK =
  `<svg class="dg-jmk" data-dragon="note-mark" width="${N.badge * 2}" height="${N.badge * 2}" viewBox="0 0 ${N.badge * 2} ${N.badge * 2}" aria-hidden="true" focusable="false">` +
  `<circle class="dg-nbc" cx="${N.badge}" cy="${N.badge}" r="${N.badge}"/>${noteGlyph(N.badge, N.badge, "dg-nbi")}</svg>`;

/** 名前 `name` の部品 `part`。`cls` は名前の字の見た目の名前。札を持つ名前 (`noted`) は、名前のすぐ右に i の丸を並べる組で包む */
const named = (part: string, name: string, noted: boolean, cls?: string): string => {
  const label = `<span${cls === undefined ? "" : ` class="${cls}"`} data-dragon="${part}">${esc(name)}</span>`;
  return noted ? `<span class="dg-jnm">${label}${MARK}</span>` : label;
};

/** 規則の番号と名前。見出しに出す */
const ruleLabel = (no: number, name: string, noted: boolean): string => `<span class="dg-jn" data-dragon="judge-no">${no}</span>${named("judge-rule-name", name, noted)}`;

/** 札で見せる表の押せるセルの印。札を持たないセルは何も書かない */
const noteAttr = (id: string | undefined): string => (id === undefined ? "" : ` data-note="${esc(id)}"`);

/** 判定の表を HTML の字にする。見た目の規則と色の変数を表の根に持ち、頁に置いただけで描ける */
export function judgeMarkup(layout: JudgeLayout, palette: Palette, theme: Theme): string {
  const { pop, rules, rows, words } = layout.judge;
  const verdictCol = rules.length;
  const cards = new Set((layout.noteCards ?? []).map((note) => note.box));
  /** 札を持つ名前のセルの札の名札。札で見せない表と、note を持たない規則と例は持たない */
  const cardOf = (id: string): string | undefined => (cards.has(id) ? id : undefined);
  const heads = [
    `<th class="dg-jk" scope="col" data-dragon="judge-case-head">${esc(words.case)}</th>`,
    ...rules.map((rule, i) => {
      const card = cardOf(judgeNoteId.rule(rule.id));
      const value = rule.value === undefined ? "" : `<span class="dg-jv" data-dragon="judge-rule-value">${esc(rule.value)}</span>`;
      // 札で見せない表は、規則の note を値の下に描く
      const note = rule.note === undefined || pop ? "" : `<span class="dg-jrn" data-dragon="judge-rule-note">${esc(rule.note)}</span>`;
      return `<th class="dg-jr" scope="col" data-rule="${esc(rule.id)}" data-col="${i}"${noteAttr(card)}>${ruleLabel(i + 1, rule.name, card !== undefined)}${value}${note}</th>`;
    }),
    `<th class="dg-jd" scope="col" data-dragon="judge-verdict-head" data-col="${verdictCol}">${esc(words.verdict)}</th>`,
  ];
  const body = rows.map((row, i) => {
    const card = cardOf(judgeNoteId.case(i));
    const name = `${named("judge-case-name", row.name, card !== undefined, "dg-jcn")}${row.note === undefined ? "" : `<span class="dg-jcs" data-dragon="judge-note">${esc(row.note)}</span>`}`;
    const word = row.verdict === "pass" ? words.pass : words.block;
    // 判定の札は語だけを持つ。外れた規則は✕のセルで読む (#3890)
    const verdict = `<td class="dg-jd" data-dragon="judge-verdict" data-col="${verdictCol}"><span class="dg-jp" data-verdict="${row.verdict}"><span data-dragon="judge-word" data-verdict="${row.verdict}">${esc(word)}</span></span></td>`;
    return `<tr data-case="${i}"><th class="dg-jk" scope="row" data-dragon="judge-case"${noteAttr(card)}>${name}</th>${row.cells.map(cellOf).join("")}${verdict}</tr>`;
  });
  return (
    `<div class="dg-judge" data-dragon="judge" data-corner="${palette.corner}" style="${FONT_VARS.replace(/"/g, "&quot;")};${paletteVars(palette, theme)}">` +
    `<style>${JUDGE_CSS}</style>` +
    `<div class="dg-jw" data-dragon="judge-scroll"><table class="dg-jt"><thead><tr>${heads.join("")}</tr></thead><tbody>${body.join("")}</tbody></table></div></div>`
  );
}

/** 段の印を書く処理は、書き出す入口も表の描き方を読まずに使えるよう別の file に置く (#3937) */
export { showJudge } from "./judge-show";
