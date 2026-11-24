/**
 * 判定の表 (#3879) を HTML の表で描く。SVG で描くと枠の幅へ縮めた時に字が小さくなるので、字は px の大きさのまま描き、
 * 枠に収まらない表は横に送る枠 (`.dg-jw`) の中を送り、例の列 (`.dg-jk`) を左に留める。携帯の幅でも同じ形にする。
 *
 * 構成は本人が選んだ見本に揃える。見出しは例、番号と名前と値を持つ規則、判定の順で、例のセルは名前の下に添え書きを、
 * ✕のセルは印の下に外れた値を、止める判定は語の下に外れた規則の番号と名前を持つ。照らせないセルは「—」にする。
 * 描いただけの表は全てのセルと判定を埋めた形で、再生の部品が段を送る時だけ、表の根に `data-play` を、照らした列のセルに `data-on` を書く (`showJudge`)。
 * 印刷の形では照らしていないセルも見せ、横に送る枠を開いて全ての列を描く
 */
import type { JudgeLayout, JudgeRow } from "../kinds/judge/layout";
import { FONT_VARS, type Palette, PLAIN_TEXT, paletteVars, type Theme } from "../look/values";

const esc = (s: string): string => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** ✓と✕の絵柄。20px の升に描き、枠の幅で縮めないので viewBox を持たない */
const ICONS = {
  pass: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="✓"><path d="M4.5 10.5l3.5 3.5 7.5-8"/></svg>',
  fail: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" role="img" aria-label="✕"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9"/></svg>',
} as const;

/** 青の印の地。規則の番号の丸と、今照らしている列の見出しに使う */
const BLUE = (amount: number, base = "transparent"): string => `color-mix(in srgb,var(--c-blue) ${amount}%,${base})`;

/** 判定の表の見た目。字の大きさはどれも px で書き、読める大きさ (`READABLE_PX`) を下回らない */
export const JUDGE_CSS = [
  `.dg-judge{display:block;width:100%;color:var(--ink);font-family:var(--sans);${PLAIN_TEXT}}`,
  ".dg-judge .dg-jw{overflow-x:auto;overscroll-behavior-x:contain;border:1px solid var(--line);border-radius:10px;background:var(--surf)}",
  ".dg-judge .dg-jt{border-collapse:separate;border-spacing:0;width:100%;font-size:14px;line-height:1.5}",
  ".dg-judge th,.dg-judge td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:center;vertical-align:middle;white-space:nowrap;font-weight:500}",
  ".dg-judge tbody tr:last-child>*{border-bottom:0}",
  ".dg-judge thead th{background:var(--sunk);font-weight:700;font-size:14px}",
  // 例の列は左に留める。横に送っても、どの例の行かを見失わない
  ".dg-judge .dg-jk{position:sticky;left:0;z-index:1;text-align:left;background:var(--surf);border-right:1px solid var(--line)}",
  ".dg-judge thead .dg-jk{background:var(--sunk)}",
  `.dg-judge .dg-jn{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;box-sizing:border-box;border-radius:10px;background:${BLUE(14)};color:var(--c-blue);font-size:12px;font-weight:700;margin-right:5px}`,
  ".dg-judge .dg-jv{display:block;font-weight:500;font-size:12px;color:var(--mute)}",
  ".dg-judge .dg-jcn{display:block;font-weight:700;font-size:13.5px}",
  ".dg-judge .dg-jcs{display:block;font-size:12px;color:var(--mute)}",
  ".dg-judge .dg-jd{border-left:1px solid var(--line)}",
  ".dg-judge .dg-jm{display:inline-flex;flex-direction:column;align-items:center;gap:1px;min-width:28px;transition:opacity .25s}",
  ".dg-judge .dg-jm svg{display:block;width:20px;height:20px}",
  '.dg-judge .dg-jm[data-mark="pass"]{color:var(--c-green)}',
  '.dg-judge .dg-jm[data-mark="fail"]{color:var(--c-rose)}',
  '.dg-judge .dg-jm[data-mark="skip"]{color:var(--mute);font-size:16px}',
  ".dg-judge .dg-jx{font-size:12px;font-weight:700;font-family:var(--mono)}",
  ".dg-judge .dg-jp{display:inline-block;border-radius:999px;padding:3px 12px;font-size:13px;font-weight:700;transition:opacity .3s}",
  '.dg-judge .dg-jp[data-verdict="pass"]{background:color-mix(in srgb,var(--c-green) 14%,transparent);color:var(--c-green)}',
  '.dg-judge .dg-jp[data-verdict="block"]{background:color-mix(in srgb,var(--c-rose) 14%,transparent);color:var(--c-rose)}',
  ".dg-judge .dg-jy{display:block;font-weight:500;font-size:12px}",
  ".dg-judge .dg-jy .dg-jn{min-width:18px;height:18px;font-size:11px;margin-right:2px}",
  // 再生の部品が段を送る間は、照らす前の列のセルの印と判定を見せず、今照らしている列を青の地で示す
  ".dg-judge[data-play] .dg-jc:not([data-on]) .dg-jm,.dg-judge[data-play] .dg-jd:not([data-on]) .dg-jp{opacity:0}",
  `.dg-judge[data-play] th[data-now]{background:${BLUE(16, "var(--sunk)")};color:var(--c-blue)}`,
  `.dg-judge[data-play] td[data-now]{background:${BLUE(6)}}`,
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
        : `<span class="dg-jy" data-dragon="judge-why">${row.why.map((col) => `<span class="dg-jf" data-rule="${esc(rules[col]?.id ?? "")}">${ruleLabel(col + 1, rules[col]?.name ?? "")}</span>`).join("、")}</span>`;
    const word = row.verdict === "pass" ? words.pass : words.block;
    const verdict = `<td class="dg-jd" data-dragon="judge-verdict" data-col="${verdictCol}"><span class="dg-jp" data-verdict="${row.verdict}"><span data-dragon="judge-word" data-verdict="${row.verdict}">${esc(word)}</span>${why}</span></td>`;
    return `<tr data-case="${i}"><th class="dg-jk" scope="row" data-dragon="judge-case">${name}</th>${row.cells.map(cellOf).join("")}${verdict}</tr>`;
  });
  return (
    `<div class="dg-judge" data-dragon="judge" style="${FONT_VARS.replace(/"/g, "&quot;")};${paletteVars(palette, theme)}">` +
    `<style>${JUDGE_CSS}</style>` +
    `<div class="dg-jw" data-dragon="judge-scroll"><table class="dg-jt"><thead><tr>${heads.join("")}</tr></thead><tbody>${body.join("")}</tbody></table></div></div>`
  );
}

/** 段 `step` までの列を照らす。段は規則の列ごとに 1 つで、最後の段は判定の列。再生の部品が段を送るたびに呼ぶ */
export function showJudge(figure: HTMLElement, step: number): void {
  figure.dataset.play = "";
  for (const cell of figure.querySelectorAll<HTMLElement>("[data-col]")) {
    const col = Number(cell.dataset.col);
    cell.toggleAttribute("data-on", col <= step);
    cell.toggleAttribute("data-now", col === step);
  }
}
