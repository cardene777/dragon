/**
 * 配管の図 (`pipe`、#3418) の再生の部品の、図の下に置く段の動きと呼び出しの結果 (#3450)。
 *
 * 再生の部品 (`player.ts`) が見せている図の段 (畳んだ箱を開いた後は開いた図の段) を頭から当て、段ごとに矢印を作る。
 * 矢印は送る側、量か名前、受ける側と、何をしたかの札を持つ。値が動く段は動いた値を実線の矢印で出し、確かめた式と取り消しも出す。
 * 値が動かず確かめも取り消しも無い段は、呼び出しと返した値を点線の矢印で出し、計算と記録も出す。
 * 同じ段で戻った呼び出しは、返した側から返した値の矢印 1 本にまとめる。値が動く段で呼び出しを出すと、
 * 1 つの動きが「呼ぶ」「送る」「返す」の 3 本に割れて読めなくなるため。
 * 確かめは満たすかの札を式の前に置いた 1 行の枠にする。同じ理由で続けて取り消した呼び出しは、取り消した側から戻る先までの
 * 道 1 本の枠にまとめ、理由を 1 回だけ小さく出す。取り消しを矢印ごとに分けて理由を大きく出すと、携帯の幅で枠が詰まるため。
 *
 * 呼び出しの結果は畳んで置き、開くと先頭にいちばん外の呼び出し (取引) を、その下に今の段までに戻った内側の呼び出しを、
 * 呼ばれた側、中身、返した値の 3 列で出す。返した値が無いか `true` だけの呼び出しは、その段の矢印に値の動きとして出ているため出さない。
 * 今の段で戻った行に `data-state="now"` を付ける。
 * 出来事は描く部品の並べ方と同じ手順 (`PipeRun`) に当て、当てられない出来事は図と同じく矢印にも結果にも出さない。
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
 * 段の動きの見た目。矢印どうしの間と矢印の上下の余白、名前と矢印の間、矢印の線の太さと先の長さ、量と線と札の間、
 * 矢印の欄と結果の間、矢印の欄と結果の最も広い幅、確かめと取り消しの枠の左右と上下の余白と角の丸みと枠どうしの間、
 * 取り消しの道の矢印の長さと名前との間、結果の 1 つの欄の上下と左右の余白、今の段の行の左の印の太さ。
 * 広い枠でも矢印と結果を枠の全幅に伸ばさない。送る側と受ける側が離れると、どの名前がどの量に付くかを目で追えなくなるため
 */
const FLOWS = {
  row: 8,
  gap: 10,
  line: 2,
  head: 7,
  inner: 3,
  record: 12,
  max: 520,
  boxX: 10,
  boxY: 8,
  round: 6,
  boxGap: 4,
  link: 16,
  linkGap: 6,
  cellY: 6,
  cellX: 10,
  mark: 3,
} as const;

/** 枠と行に敷く色の濃さ (%)。確かめを満たした枠、満たさない枠と取り消しの枠、取引の枠、今の段の行 */
const TINT = { pass: 9, fail: 9, deal: 10, now: 8 } as const;

/** 矢印の種類。値が動く、確かめる、取り消す、呼ぶ、返す、計算する、記録を出す */
export type FlowKind = "move" | "check" | "revert" | "call" | "return" | "calc" | "emit";

/**
 * 段の下に出す矢印の 1 本。`line` は実線 (値が動く) か点線 (呼び出しと返した値と取り消し) か線無し (確かめと計算と記録)。
 * 取り消しは `from` が取り消した側、`to` が戻る先、`via` が道の途中で取り消しを伝えた関係者、`amount` が理由 (無い時は空)
 */
export interface StepFlow {
  kind: FlowKind;
  line: "solid" | "dashed" | "none";
  from: string;
  amount: string;
  to: string;
  tag: string;
  via?: string[];
}

/** 記録の 1 行。`step` は呼び出しを開いた段、`depth` は開いた時に開いていた呼び出しの数、`close` は閉じた段と返した値か取り消したか */
export interface CallRow {
  step: number;
  depth: number;
  from: string;
  to: string;
  label?: string;
  close?: { step: number; value?: string; reverted: boolean };
}

/** 記録の行と、段ごとの矢印 */
export interface CallList {
  rows: CallRow[];
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
            row.close = { step: s, reverted: true };
            const reason = e.reason ?? "";
            const last = main[main.length - 1];
            // 1 つ内側の取り消しが戻った先が、同じ理由で続けて取り消した時は、道を 1 人分延ばす
            if (last?.kind === "revert" && last.amount === reason && last.to === row.to) {
              last.via = [...(last.via ?? []), last.to];
              last.to = row.from;
            } else main.push({ kind: "revert", line: "dashed", from: row.to, amount: reason, to: row.from, tag: w.reverted, via: [] });
            break;
          }
          row.close = { step: s, ...(e.value !== undefined ? { value: e.value } : {}), reverted: false };
          const output = e.value ?? w.callNone;
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
          // 矢印にも結果にも出さないが、後の出来事を図と同じ値の上で当てるために書き替える
          run.write(e);
          break;
        default:
          break;
      }
    }
    flows.push(main.length > 0 ? main : rest);
  });
  return { rows, flows };
}

/**
 * 結果の一覧に出す内側の呼び出しか。取り消したか、`true` 以外の値を返した呼び出しを出す。
 * 返した値が無いか `true` だけの呼び出し (トークンを送るなど) は、その段の矢印に値の動きとして出ている
 */
const hasResult = (row: CallRow): boolean => row.close !== undefined && (row.close.reverted || (row.close.value !== undefined && row.close.value !== "true"));

/** 書き出した頁で段の矢印と呼び出しの結果と拡大の度合いの札が出しうる字。字の file に残す */
export function pipeTexts(model: DiagramModel, lang: NotationLang): string[] {
  const w = FIGURE_TEXT[lang];
  const { rows, flows } = callList(model, lang);
  return [
    w.calls,
    w.deal,
    w.waiting,
    w.reverted,
    "→",
    ...rows.flatMap((row) => [row.from, row.to, row.label ?? w.callNone, row.close?.value ?? ""]),
    ...flows.flat().flatMap((flow) => [flow.from, flow.amount, flow.to, flow.tag, ...(flow.via ?? [])]),
    // 拡大の度合いの札 (`125%`)
    "0123456789%",
  ];
}

/** 段の動きと呼び出しの結果の見た目。置く時に頁へ 1 度だけ入れる */
function callsCss(): string {
  const line = `${px(FLOWS.line)} solid var(--mute)`;
  const tint = (color: string, percent: number): string => `color-mix(in srgb,var(${color}) ${percent}%,transparent)`;
  const strong = TYPE.button.weight;
  const name = TYPE.boxName.weight;
  return [
    // 矢印は送る側、量と線と札、受ける側の 3 つの欄に並べ、量が長い時は真ん中の欄の中で折る
    `.dg-fl{display:flex;flex-direction:column;max-width:${px(FLOWS.max)}}`,
    `.dg-f{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;column-gap:${px(FLOWS.gap)};padding:${px(FLOWS.row)} 0}`,
    `.dg-f+.dg-f{border-top:${px(LOOK.stroke.hair)} solid var(--hair)}`,
    `.dg-ff,.dg-ft{${font(TYPE.stepBody)};font-weight:${strong};color:var(--ink);white-space:nowrap}`,
    `.dg-fm{display:flex;flex-direction:column;align-items:center;text-align:center;gap:${px(FLOWS.inner)};min-width:0}`,
    `.dg-fa{${font(TYPE.button)};color:var(--ink);overflow-wrap:anywhere}`,
    `.dg-fx{align-self:stretch;position:relative;border-top:${line};margin-right:${px(FLOWS.head)}}`,
    `.dg-fx::after{content:"";position:absolute;right:-${px(FLOWS.head)};top:-${px(FLOWS.head / 2 + FLOWS.line / 2)};border:${px(FLOWS.head / 2)} solid transparent;border-left:${px(FLOWS.head)} solid var(--mute);border-right:0}`,
    `.dg-f[data-line="dashed"] .dg-fx{border-top-style:dashed}`,
    `.dg-f[data-line="none"] .dg-fx{display:none}`,
    `.dg-fg{${font(TYPE.fieldName)};color:var(--mute)}`,
    // 確かめと取り消しは色を薄く敷いた枠に入れ、満たすかと取り消しの札を先に置く
    `.dg-f[data-kind="check"],.dg-f[data-kind="revert"]{border-top:0;border-radius:${px(FLOWS.round)};padding:${px(FLOWS.boxY)} ${px(FLOWS.boxX)};margin:${px(FLOWS.boxGap)} 0}`,
    `.dg-f[data-kind="check"]{display:flex;align-items:center;justify-content:space-between;gap:${px(FLOWS.gap)};background:${tint("--t-green", TINT.pass)}}`,
    `.dg-f[data-kind="check"][data-pass="false"],.dg-f[data-kind="revert"]{background:${tint("--t-rose", TINT.fail)}}`,
    `.dg-f[data-kind="check"] .dg-fg,.dg-f[data-kind="revert"] .dg-fg{${font(TYPE.stripTitle)};color:var(--t-green);white-space:nowrap}`,
    `.dg-f[data-kind="check"][data-pass="false"] .dg-fg,.dg-f[data-kind="revert"] .dg-fg{color:var(--t-rose)}`,
    `.dg-f[data-kind="check"] .dg-fa{text-align:right;font-variant-numeric:tabular-nums}`,
    // 取り消しは札と理由を 1 行に、理由は等幅の小さな字で 1 回だけ出し、その下に取り消しが伝わった道を出す
    `.dg-f[data-kind="revert"]{display:block}`,
    `.dg-fh{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:${px(FLOWS.gap)}}`,
    `.dg-f[data-kind="revert"] .dg-fa{${font(TYPE.label)};color:var(--t-rose);overflow-wrap:anywhere}`,
    // 道は矢印と次の名前を組にして折り、名前の途中では折らない
    `.dg-fp{display:flex;flex-wrap:wrap;align-items:center;column-gap:${px(FLOWS.linkGap)};row-gap:${px(FLOWS.inner)};margin-top:${px(FLOWS.linkGap)};${font(TYPE.stepBodyNarrow)};font-weight:${name};color:var(--ink)}`,
    `.dg-fs{display:inline-flex;align-items:center;gap:${px(FLOWS.linkGap)};white-space:nowrap}`,
    `.dg-fk{display:inline-block;position:relative;width:${px(FLOWS.link)};border-top:${px(FLOWS.line)} dashed var(--t-rose);margin-right:${px(FLOWS.head)}}`,
    `.dg-fk::after{content:"";position:absolute;right:-${px(FLOWS.head)};top:-${px(FLOWS.head / 2 + FLOWS.line / 2)};border:${px(FLOWS.head / 2)} solid transparent;border-left:${px(FLOWS.head)} solid var(--t-rose);border-right:0}`,
    // 呼び出しの結果は畳み、開くと取引の枠と、戻った内側の呼び出しを 3 列で揃えて出す
    `.dg-cr{margin-top:${px(FLOWS.record)};max-width:${px(FLOWS.max)};${font(TYPE.stepBodyNarrow)};color:var(--ink)}`,
    `.dg-cr>summary{cursor:pointer;color:var(--c-blue)}`,
    `.dg-ctx{margin-top:${px(FLOWS.linkGap)};padding:${px(FLOWS.boxY)} ${px(FLOWS.boxX)};border-radius:${px(FLOWS.round)};background:${tint("--mute", TINT.deal)}}`,
    `.dg-ctx[data-state="now"]{box-shadow:inset ${px(FLOWS.mark)} 0 0 var(--c-blue)}`,
    `.dg-ctt{display:flex;justify-content:space-between;align-items:baseline;gap:${px(FLOWS.gap)}}`,
    `.dg-cdl{${font(TYPE.fieldName)};color:var(--mute);margin-right:${px(FLOWS.linkGap)}}`,
    `.dg-cn{font-weight:${name}}`,
    `.dg-ctv{color:var(--mute);white-space:nowrap}`,
    `.dg-ctx[data-result] .dg-ctv{color:var(--ink);font-weight:${strong}}`,
    `.dg-crg{display:grid;grid-template-columns:max-content minmax(0,1fr) max-content;margin-top:${px(FLOWS.linkGap)}}`,
    `.dg-crg>[data-dragon="call"]{display:contents}`,
    `.dg-crg>[data-dragon="call"]>span{padding:${px(FLOWS.cellY)} ${px(FLOWS.cellX)};border-top:${px(LOOK.stroke.hair)} solid var(--hair)}`,
    `.dg-crg>[data-dragon="call"]:first-child>span{border-top:0}`,
    `.dg-crg>[data-dragon="call"]>span:first-child{border-left:${px(FLOWS.mark)} solid transparent}`,
    `.dg-crg .dg-cw{color:var(--mute);overflow-wrap:anywhere}`,
    `.dg-crg .dg-cv{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}`,
    `.dg-crg>[data-state="now"]>span{background:${tint("--c-blue", TINT.now)}}`,
    `.dg-crg>[data-state="now"]>span:first-child{border-left-color:var(--c-blue)}`,
    `.dg-crg>[data-state="now"] .dg-cw{color:var(--ink)}`,
    `.dg-crg>[data-state="now"] .dg-cv{font-weight:${strong}}`,
    `.dg-ctx[data-result="reverted"] .dg-ctv,.dg-crg>[data-result="reverted"] .dg-cv{color:var(--t-rose)}`,
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
  /** 図の下に置く、段の矢印と呼び出しの結果の入れ物 */
  readonly element: HTMLElement;
  /** 図 `model` の段 `step` (0 から) の矢印と、その段までの呼び出しの結果を出す。描き直した図を渡すと作り直す */
  show(model: DiagramModel, step: number): void;
}

/** 段の矢印と呼び出しの結果を作る。置く所は再生の部品が決める */
export function mountPipeCalls(doc: Document, lang: NotationLang): PipeCalls {
  ensureCallsCss(doc);
  const w = FIGURE_TEXT[lang];
  const element = doc.createElement("div");
  element.className = "dg-calls";
  element.dataset.dragon = "calls";
  // 置いた頁の言葉と違っても、矢印と結果を図の言葉の声で読ませる
  element.setAttribute("lang", lang);
  const board = doc.createElement("div");
  board.className = "dg-fl";
  board.dataset.dragon = "flows";
  const record = doc.createElement("details");
  record.className = "dg-cr";
  record.dataset.dragon = "call-record";
  const summary = doc.createElement("summary");
  summary.textContent = w.calls;
  const lines = doc.createElement("div");
  lines.className = "dg-crl";
  record.append(summary, lines);
  element.append(board, record);

  const span = (className: string, part: string | undefined, text: string): HTMLSpanElement => {
    const el = doc.createElement("span");
    el.className = className;
    if (part !== undefined) el.dataset.dragon = part;
    el.textContent = text;
    return el;
  };
  /** 取り消しの道と矢印の印。読み上げでは名前だけを読ませる */
  const link = (): HTMLElement => {
    const el = doc.createElement("span");
    el.className = "dg-fk";
    el.setAttribute("aria-hidden", "true");
    return el;
  };
  const arrowOf = (flow: StepFlow): HTMLElement => {
    const row = doc.createElement("div");
    row.className = "dg-f";
    row.dataset.dragon = "flow";
    row.dataset.kind = flow.kind;
    row.dataset.line = flow.line;
    if (flow.kind === "check") {
      row.dataset.pass = String(flow.tag === w.checkPass);
      row.append(span("dg-fg", "flow-tag", flow.tag), span("dg-fa", "flow-amount", flow.amount));
      return row;
    }
    if (flow.kind === "revert") {
      const head = doc.createElement("div");
      head.className = "dg-fh";
      head.append(span("dg-fg", "flow-tag", flow.tag), ...(flow.amount === "" ? [] : [span("dg-fa", "flow-amount", flow.amount)]));
      const path = doc.createElement("div");
      path.className = "dg-fp";
      const hop = (part: string, who: string): HTMLElement => {
        const unit = span("dg-fs", undefined, "");
        unit.append(link(), span("", part, who));
        return unit;
      };
      path.append(span("", "flow-from", flow.from), ...(flow.via ?? []).map((who) => hop("flow-via", who)), hop("flow-to", flow.to));
      row.append(head, path);
      return row;
    }
    const middle = doc.createElement("span");
    middle.className = "dg-fm";
    const line = doc.createElement("span");
    line.className = "dg-fx";
    line.setAttribute("aria-hidden", "true");
    middle.append(span("dg-fa", "flow-amount", flow.amount), line, span("dg-fg", "flow-tag", flow.tag));
    row.append(span("dg-ff", "flow-from", flow.from), middle, span("dg-ft", "flow-to", flow.to));
    return row;
  };
  /** 戻った呼び出しの返した値の欄の字。取り消した呼び出しは取り消しと出す */
  const valueOf = (row: CallRow): string => (row.close?.reverted ? w.reverted : (row.close?.value ?? w.callNone));
  /** いちばん外の呼び出し (取引) の枠。呼んだ側、呼ばれた側、返した値か返り待ちと、その下に中身 */
  const dealOf = (row: CallRow, returned: boolean, now: boolean): HTMLElement => {
    const el = doc.createElement("div");
    el.className = "dg-ctx";
    el.dataset.dragon = "call-tx";
    if (now) el.dataset.state = "now";
    if (returned) el.dataset.result = row.close?.reverted ? "reverted" : "returned";
    const top = doc.createElement("div");
    top.className = "dg-ctt";
    const who = doc.createElement("span");
    who.append(span("dg-cdl", undefined, w.deal), span("dg-cn", "call-from", row.from), " → ", span("dg-cn", "call-to", row.to));
    top.append(who, span("dg-ctv", "call-value", returned ? valueOf(row) : w.waiting));
    const what = doc.createElement("div");
    what.dataset.dragon = "call-what";
    what.textContent = row.label ?? w.callNone;
    el.append(top, what);
    return el;
  };
  /** 戻った内側の呼び出しの行。呼ばれた側、中身、返した値の 3 列 */
  const resultOf = (row: CallRow, now: boolean): HTMLElement => {
    const el = doc.createElement("div");
    el.dataset.dragon = "call";
    if (now) el.dataset.state = "now";
    if (row.close?.reverted) el.dataset.result = "reverted";
    el.append(span("dg-cn", "call-to", row.to), span("dg-cw", "call-what", row.label ?? w.callNone), span("dg-cv", "call-value", valueOf(row)));
    return el;
  };

  let shown: DiagramModel | undefined;
  let list: CallList = { rows: [], flows: [] };
  return {
    element,
    show: (model, step) => {
      if (model !== shown) {
        shown = model;
        list = callList(model, lang);
      }
      board.replaceChildren(...(list.flows[step] ?? []).map(arrowOf));
      // 取引ごとに枠を置き、その下にその取引の中で戻った呼び出しを並べる
      const parts: HTMLElement[] = [];
      let grid: HTMLElement | undefined;
      for (const row of list.rows) {
        if (row.step > step) continue;
        const returned = row.close !== undefined && row.close.step <= step;
        const now = returned && row.close?.step === step;
        if (row.depth === 0) {
          parts.push(dealOf(row, returned, now));
          grid = undefined;
          continue;
        }
        if (!returned || !hasResult(row)) continue;
        if (grid === undefined) {
          grid = doc.createElement("div");
          grid.className = "dg-crg";
          parts.push(grid);
        }
        grid.append(resultOf(row, now));
      }
      lines.replaceChildren(...parts);
    },
  };
}
