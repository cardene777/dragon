/**
 * 配管の図 (`pipe`、#3418) の再生の部品の、図の下に置く段の動きと呼び出しの記録 (#3450)。
 *
 * 再生の部品 (`player.ts`) が見せている図の段 (畳んだ箱を開いた後は開いた図の段) を頭から当て、段ごとに矢印を作る。
 * 矢印は送る側、量か名前、受ける側と、何をしたかの札を持つ。値が動く段は動いた値を実線の矢印で出し、確かめた式と取り消しも出す。
 * 値が動かず確かめも取り消しも無い段は、呼び出しと返した値を点線の矢印で出し、計算と記録も出す。
 * 同じ段で戻った呼び出しは、返した側から返した値の矢印 1 本にまとめる。値が動く段で呼び出しを出すと、
 * 1 つの動きが「呼ぶ」「送る」「返す」の 3 本に割れて読めなくなるため。
 *
 * 呼び出しの記録は畳んで置き、開くと今の段までに開いた呼び出しを 1 つ 1 行で、呼び出しの深さだけ字下げして出す。
 * 戻った呼び出しの行は返した値を添え、今の段で開くか閉じる呼び出しの行に `data-state="now"` を付ける。
 * どちらも無い段では、段の終わりにいちばん内側で開いている呼び出しに付ける。
 * 出来事は描く部品の並べ方と同じ手順 (`PipeRun`) に当て、当てられない出来事は図と同じく矢印にも記録にも出さない。
 * 字は渡した言葉 (`FIGURE_TEXT`) で出す。この file は配管の図の描く部品と同じ塊 (`kinds/pipe.ts`) に入り、
 * 再生の部品は配管の図を描けた後に登録簿から引いて置く。見た目は置く時に頁へ 1 度だけ入れる。
 */
import { FIGURE_TEXT } from "./figure-text";
import { OP_TEXT } from "./kinds/pipe/layout";
import { LOOK, TYPE } from "./look/values";
import { checkPasses, isFault, PipeRun } from "./pipe-run";
import { cssFont as font } from "./render/parts";
import type { DiagramModel } from "./schema";
import type { NotationLang } from "./words";

const px = (v: number): string => `${v}px`;

/**
 * 段の動きの見た目。矢印どうしの間と矢印の上下の余白、名前と矢印の間、矢印の線の太さと先の長さ、
 * 量と線と札の間、記録の 1 行の上下の余白と呼び出しの深さ 1 つ分の字下げ、矢印の欄と記録の間、矢印の欄の最も広い幅。
 * 広い枠でも矢印を枠の全幅に伸ばさない。送る側と受ける側が離れると、どの名前がどの量に付くかを目で追えなくなるため
 */
const FLOWS = { row: 8, gap: 10, line: 2, head: 7, inner: 3, recordY: 3, indent: 14, record: 12, max: 520 } as const;

/** 矢印の種類。値が動く、確かめる、取り消す、呼ぶ、返す、計算する、記録を出す */
export type FlowKind = "move" | "check" | "revert" | "call" | "return" | "calc" | "emit";

/** 段の下に出す矢印の 1 本。`line` は実線 (値が動く) か点線 (呼び出しと返した値と取り消し) か線無し (確かめと計算と記録) */
export interface StepFlow {
  kind: FlowKind;
  line: "solid" | "dashed" | "none";
  from: string;
  amount: string;
  to: string;
  tag: string;
}

/** 記録の 1 行。`step` は呼び出しを開いた段、`depth` は開いた時に開いていた呼び出しの数、`close` は閉じた段と返した値の字 */
export interface CallRow {
  step: number;
  depth: number;
  from: string;
  to: string;
  label?: string;
  close?: { step: number; output: string };
}

/** 記録の行と、段ごとの段の終わりにいちばん内側で開いている呼び出しの行の番号と、段ごとの矢印 */
export interface CallList {
  rows: CallRow[];
  open: (number | undefined)[];
  flows: StepFlow[][];
}

/** 図 `model` の段を頭から当て、記録の行を出てきた順に作り、段ごとの矢印を作る */
export function callList(model: DiagramModel, lang: NotationLang): CallList {
  const w = FIGURE_TEXT[lang];
  const names = new Map(model.boxes.map((b) => [b.id, b.name]));
  const name = (id: string): string => names.get(id) ?? id;
  const run = new PipeRun(model.boxes, model.pipe?.holds ?? []);
  const rows: CallRow[] = [];
  /** 開いている呼び出しの行の番号。手順の開いている呼び出しと同じ順に積む */
  const stack: number[] = [];
  const open: (number | undefined)[] = [];
  const flows: StepFlow[][] = [];
  /** いちばん内側で開いている呼び出しの呼ばれた側。計算と記録をした者 */
  const actor = (): string => rows[stack[stack.length - 1] ?? -1]?.to ?? "";
  model.steps.forEach((step, s) => {
    /** 値の動きと確かめと取り消し。1 つでもあれば、この段はこれだけを出す */
    const main: StepFlow[] = [];
    /** 呼び出しと返した値と計算と記録。値が動かず確かめも取り消しも無い段に出す */
    const rest: StepFlow[] = [];
    /** この段で開いた呼び出しの行の番号から、その呼び出しの矢印の `rest` の中の位置 */
    const opened = new Map<number, number>();
    for (const e of step.events) {
      switch (e.type) {
        case "call":
          rows.push({ step: s, depth: stack.length, from: name(e.from), to: name(e.to), ...(e.label !== undefined ? { label: e.label } : {}) });
          if (!run.call(e)) {
            stack.push(rows.length - 1);
            opened.set(rows.length - 1, rest.length);
            rest.push({ kind: "call", line: "dashed", from: name(e.from), amount: e.label ?? w.callNone, to: name(e.to), tag: w.flowTags.call });
          }
          break;
        case "return":
        case "revert": {
          if (isFault(run.close(e.box, e.type))) break;
          const index = stack.pop() ?? -1;
          const row = rows[index];
          if (!row) break;
          if (e.type === "revert") {
            row.close = { step: s, output: w.callReverted(e.reason) };
            main.push({ kind: "revert", line: "dashed", from: row.to, amount: e.reason ?? w.callNone, to: row.from, tag: w.flowTags.revert });
            break;
          }
          const output = e.value ?? w.callNone;
          row.close = { step: s, output };
          const at = opened.get(index);
          const back: StepFlow = { kind: "return", line: "dashed", from: row.to, amount: output, to: row.from, tag: at === undefined ? w.flowTags.return : w.returnOf(row.label ?? w.callNone) };
          if (at === undefined) rest.push(back);
          else rest[at] = back;
          break;
        }
        case "move":
          if (!run.move(e))
            main.push({ kind: "move", line: "solid", from: name(e.from), amount: `${e.amount} ${run.tokens.get(e.box) ?? name(e.box)}`, to: name(e.to), tag: w.flowTags.move });
          break;
        case "emit":
          if (!isFault(run.emit())) rest.push({ kind: "emit", line: "none", from: actor(), amount: `${e.name}(${(e.args ?? []).join(", ")})`, to: "", tag: w.flowTags.emit });
          break;
        case "check":
          main.push({ kind: "check", line: "none", from: "", amount: `${e.left} ${OP_TEXT[e.op]} ${e.right}`, to: "", tag: checkPasses(e) ? w.checkPass : w.checkFail });
          break;
        case "calc":
          rest.push({ kind: "calc", line: "none", from: actor(), amount: `${e.in} → ${e.out}`, to: "", tag: w.flowTags.calc });
          break;
        case "write":
          // 矢印にも記録にも出さないが、後の出来事を図と同じ値の上で当てるために書き替える
          run.write(e);
          break;
        default:
          break;
      }
    }
    open.push(stack[stack.length - 1]);
    flows.push(main.length > 0 ? main : rest);
  });
  return { rows, open, flows };
}

/** 書き出した頁で段の矢印と呼び出しの記録と拡大の度合いの札が出しうる字。字の file に残す */
export function pipeTexts(model: DiagramModel, lang: NotationLang): string[] {
  const w = FIGURE_TEXT[lang];
  const { rows, flows } = callList(model, lang);
  return [
    w.calls,
    ...rows.flatMap((row) => [`${row.from} → ${row.to}`, row.label ?? "", row.close?.output ?? ""]),
    ...flows.flat().flatMap((flow) => [flow.from, flow.amount, flow.to, flow.tag]),
    // 拡大の度合いの札 (`125%`)
    "0123456789%",
  ];
}

/** 段の動きと呼び出しの記録の見た目。置く時に頁へ 1 度だけ入れる */
function callsCss(): string {
  const line = `${px(FLOWS.line)} solid var(--mute)`;
  return [
    // 矢印は送る側、量と線と札、受ける側の 3 つの欄に並べ、量が長い時は真ん中の欄の中で折る
    `.dg-fl{display:flex;flex-direction:column;max-width:${px(FLOWS.max)}}`,
    `.dg-f{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;column-gap:${px(FLOWS.gap)};padding:${px(FLOWS.row)} 0}`,
    `.dg-f+.dg-f{border-top:${px(LOOK.stroke.hair)} solid var(--hair)}`,
    `.dg-ff,.dg-ft{${font(TYPE.stepBody)};font-weight:${TYPE.button.weight};color:var(--ink);white-space:nowrap}`,
    `.dg-fm{display:flex;flex-direction:column;align-items:center;text-align:center;gap:${px(FLOWS.inner)};min-width:0}`,
    // 空白の無い長い量 (取り消しの理由など) も真ん中の欄の幅で折り、両端の名前に重ねない
    `.dg-fa{${font(TYPE.button)};color:var(--ink);overflow-wrap:anywhere}`,
    `.dg-fx{align-self:stretch;position:relative;border-top:${line};margin-right:${px(FLOWS.head)}}`,
    `.dg-fx::after{content:"";position:absolute;right:-${px(FLOWS.head)};top:-${px(FLOWS.head / 2 + FLOWS.line / 2)};border:${px(FLOWS.head / 2)} solid transparent;border-left:${px(FLOWS.head)} solid var(--mute);border-right:0}`,
    `.dg-f[data-line="dashed"] .dg-fx{border-top-style:dashed}`,
    `.dg-f[data-line="none"] .dg-fx{display:none}`,
    `.dg-fg{${font(TYPE.fieldName)};color:var(--mute)}`,
    `.dg-f[data-kind="check"] .dg-fg{${font(TYPE.tag)};color:var(--t-green)}`,
    `.dg-f[data-kind="check"][data-pass="false"] .dg-fg,.dg-f[data-kind="revert"] .dg-fg{color:var(--t-rose)}`,
    // 呼び出しの記録は畳み、開くと 1 つの呼び出しを 1 行で出す。今の段の行だけを濃くする
    `.dg-cr{margin-top:${px(FLOWS.record)};${font(TYPE.stepBodyNarrow)};color:var(--mute)}`,
    `.dg-cr>summary{cursor:pointer;color:var(--c-blue)}`,
    `.dg-crl{list-style:none;margin:${px(FLOWS.inner)} 0 0;padding:0}`,
    `.dg-crl>li{padding:${px(FLOWS.recordY)} 0}`,
    `.dg-crl>li[data-state="now"]{color:var(--ink);font-weight:${TYPE.button.weight}}`,
  ].join("");
}

function ensureCallsCss(doc: Document): void {
  if (doc.getElementById("dragon-pipe-css")) return;
  const style = doc.createElement("style");
  style.id = "dragon-pipe-css";
  style.textContent = callsCss();
  doc.head.appendChild(style);
}

export interface PipeCalls {
  /** 図の下に置く、段の矢印と呼び出しの記録の入れ物 */
  readonly element: HTMLElement;
  /** 図 `model` の段 `step` (0 から) の矢印と、その段までの呼び出しの記録を出す。描き直した図を渡すと作り直す */
  show(model: DiagramModel, step: number): void;
}

/** 段の矢印と呼び出しの記録を作る。置く所は再生の部品が決める */
export function mountPipeCalls(doc: Document, lang: NotationLang): PipeCalls {
  ensureCallsCss(doc);
  const w = FIGURE_TEXT[lang];
  const element = doc.createElement("div");
  element.className = "dg-calls";
  element.dataset.dragon = "calls";
  // 置いた頁の言葉と違っても、矢印と記録を図の言葉の声で読ませる
  element.setAttribute("lang", lang);
  const board = doc.createElement("div");
  board.className = "dg-fl";
  board.dataset.dragon = "flows";
  const record = doc.createElement("details");
  record.className = "dg-cr";
  record.dataset.dragon = "call-record";
  const summary = doc.createElement("summary");
  summary.textContent = w.calls;
  const lines = doc.createElement("ol");
  lines.className = "dg-crl";
  record.append(summary, lines);
  element.append(board, record);

  const span = (className: string, part: string, text: string): HTMLSpanElement => {
    const el = doc.createElement("span");
    el.className = className;
    el.dataset.dragon = part;
    el.textContent = text;
    return el;
  };
  const arrowOf = (flow: StepFlow): HTMLElement => {
    const row = doc.createElement("div");
    row.className = "dg-f";
    row.dataset.dragon = "flow";
    row.dataset.kind = flow.kind;
    row.dataset.line = flow.line;
    if (flow.kind === "check") row.dataset.pass = String(flow.tag === w.checkPass);
    const middle = doc.createElement("span");
    middle.className = "dg-fm";
    const line = doc.createElement("span");
    line.className = "dg-fx";
    line.setAttribute("aria-hidden", "true");
    middle.append(span("dg-fa", "flow-amount", flow.amount), line, span("dg-fg", "flow-tag", flow.tag));
    row.append(span("dg-ff", "flow-from", flow.from), middle, span("dg-ft", "flow-to", flow.to));
    return row;
  };

  let shown: DiagramModel | undefined;
  let list: CallList = { rows: [], open: [], flows: [] };
  return {
    element,
    show: (model, step) => {
      if (model !== shown) {
        shown = model;
        list = callList(model, lang);
      }
      board.replaceChildren(...(list.flows[step] ?? []).map(arrowOf));
      const now = new Set(list.rows.flatMap((row, i) => (row.step === step || row.close?.step === step ? [i] : [])));
      const innermost = list.open[step];
      if (now.size === 0 && innermost !== undefined) now.add(innermost);
      lines.replaceChildren(
        ...list.rows.flatMap((row, i) => {
          if (row.step > step) return [];
          const li = doc.createElement("li");
          li.dataset.dragon = "call";
          li.dataset.depth = String(row.depth);
          if (now.has(i)) li.dataset.state = "now";
          li.style.paddingLeft = px(row.depth * FLOWS.indent);
          const returned = row.close !== undefined && row.close.step <= step;
          li.append(`${row.from} → ${row.to} ${row.label ?? w.callNone}`, ...(returned ? [` → ${row.close?.output ?? w.callNone}`] : []));
          return [li];
        }),
      );
    },
  };
}
