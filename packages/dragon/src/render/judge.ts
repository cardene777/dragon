/**
 * 判定の表 (#3879) を HTML の表で描く。SVG で描くと枠の幅へ縮めた時に字が小さくなるので、字は値の表 (`LOOK.judge`) の大きさのまま描き、
 * 枠に収まらない表は横に送る枠 (`.dg-jw`) の中を送り、例の列 (`.dg-jk`) を左に留める。携帯の幅でも同じ形にする。
 *
 * 構成は本人が選んだ見本に揃える。見出しは例、番号と名前と値を持つ規則、判定の順で、例のセルは名前の下に添え書きを、
 * ✕のセルは印の下に外れた値を、止める判定は語の下に外れた規則の番号と名前を持つ。照らせないセルは「—」にする。
 * 描いただけの表は全てのセルと判定を埋めた形で、再生の部品が段を送る時だけ、表の根に `data-play` を、照らした列のセルに `data-on` を書く (`showJudge`)。
 * 印刷の形では照らしていないセルも見せ、横に送る枠を開いて全ての列を描く。
 * 角を落とす色味 (`corner: "cut"`) では、図の箱と同じく表の枠の右上と左下を落とし、番号の丸と判定の札の角を丸めない
 */
import type { JudgeLayout, JudgeRow } from "../kinds/judge/layout";
import { FONT_VARS, LOOK, type Palette, PLAIN_TEXT, paletteVars, type Theme } from "../look/values";

const J = LOOK.judge;
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
  `.dg-judge .dg-jy{display:block;font-weight:500;font-size:${px(J.small)}}`,
  `.dg-judge .dg-jy .dg-jn{min-width:${px(J.whyBadge)};height:${px(J.whyBadge)};font-size:${px(J.whyNo)};margin-right:${px(J.whyGap)}}`,
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

/** 規則の番号と名前。見出しと、止める判定の下の外れた規則に出す */
const ruleLabel = (no: number, name: string): string => `<span class="dg-jn" data-dragon="judge-no">${no}</span><span data-dragon="judge-rule-name">${esc(name)}</span>`;

/** 判定の表を HTML の字にする。見た目の規則と色の変数を表の根に持ち、頁に置いただけで描ける */
export function judgeMarkup(layout: JudgeLayout, palette: Palette, theme: Theme): string {
  const { rules, rows, words } = layout.judge;
  const verdictCol = rules.length;
  const heads = [
    `<th class="dg-jk" scope="col" data-dragon="judge-case-head">${esc(words.case)}</th>`,
    ...rules.map(
      (rule, i) =>
        `<th class="dg-jr" scope="col" data-rule="${esc(rule.id)}" data-col="${i}">${ruleLabel(i + 1, rule.name)}${rule.value === undefined ? "" : `<span class="dg-jv" data-dragon="judge-rule-value">${esc(rule.value)}</span>`}</th>`,
    ),
    `<th class="dg-jd" scope="col" data-dragon="judge-verdict-head" data-col="${verdictCol}">${esc(words.verdict)}</th>`,
  ];
  const body = rows.map((row, i) => {
    const name = `<span class="dg-jcn" data-dragon="judge-case-name">${esc(row.name)}</span>${row.note === undefined ? "" : `<span class="dg-jcs" data-dragon="judge-note">${esc(row.note)}</span>`}`;
    const why =
      row.why.length === 0
        ? ""
        : `<span class="dg-jy" data-dragon="judge-why">${row.why.map((col) => `<span class="dg-jf" data-rule="${esc(rules[col]?.id ?? "")}">${ruleLabel(col + 1, rules[col]?.name ?? "")}</span>`).join(esc(words.sep))}</span>`;
    const word = row.verdict === "pass" ? words.pass : words.block;
    const verdict = `<td class="dg-jd" data-dragon="judge-verdict" data-col="${verdictCol}"><span class="dg-jp" data-verdict="${row.verdict}"><span data-dragon="judge-word" data-verdict="${row.verdict}">${esc(word)}</span>${why}</span></td>`;
    return `<tr data-case="${i}"><th class="dg-jk" scope="row" data-dragon="judge-case">${name}</th>${row.cells.map(cellOf).join("")}${verdict}</tr>`;
  });
  return (
    `<div class="dg-judge" data-dragon="judge" data-corner="${palette.corner}" style="${FONT_VARS.replace(/"/g, "&quot;")};${paletteVars(palette, theme)}">` +
    `<style>${JUDGE_CSS}</style>` +
    `<div class="dg-jw" data-dragon="judge-scroll"><table class="dg-jt"><thead><tr>${heads.join("")}</tr></thead><tbody>${body.join("")}</tbody></table></div></div>`
  );
}

/** 段の印を書く処理は、書き出す入口も表の描き方を読まずに使えるよう別の file に置く (#3937) */
export { showJudge } from "./judge-show";
