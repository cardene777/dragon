/**
 * 配管の図 (`pipe`、#3418) の再生の部品の、図の下に置く呼び出しの一覧。
 *
 * 再生の部品 (`player.ts`) が見せている図の段 (畳んだ箱を開いた後は開いた図の段) を頭から当て、呼び出しを出てきた順に 1 行ずつ並べる。
 * 行は呼び出しの両端の名前、入力 (呼び出しの名前)、中で動いた値、出力の 4 つの欄を持ち、呼び出しの深さだけ最初の欄を字下げする。
 * 中で動いた値は移動と確認と計算とイベントで、起きた時にいちばん内側で開いている呼び出しの行に並べる。
 * 今の段までに開いた呼び出しと、今の段までに動いた値だけを出し、今の段で動いた値と今の段の呼び出しの行に `data-state="now"` を付ける。
 * 今の段の呼び出しは、今の段で開くか閉じる呼び出し。どちらも無い段では、段の終わりにいちばん内側で開いている呼び出し。
 * 出来事は描く部品の並べ方と同じ手順 (`PipeRun`) に当て、当てられない出来事は図と同じく一覧にも出さない。
 * 字は渡した言葉 (`FIGURE_TEXT`) で出す。この file は配管の図の描く部品と同じ塊 (`kinds/pipe.ts`) に入り、
 * 再生の部品は配管の図を描けた後に登録簿から引いて置く。見た目は一覧を置く時に頁へ 1 度だけ入れる。
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
 * 一覧の欄の余白と、呼び出しの深さ 1 つ分の字下げと、今の行の地に混ぜる呼び出しの色の割合と、入力と中で動いた値の欄の最も狭い幅。
 * 狭い枠で欄を 1 字ずつ折らず、一覧の中を横に送る
 */
const CALLS = { padX: 8, padY: 6, indent: 16, now: 10, input: 112, inside: 168 } as const;

/** 確認が通った印と、落ちた印 */
const PASS = "✓";
const FAIL = "✗";

/** 中で動いた値の種類 */
type CallKind = "move" | "check" | "calc" | "emit";

/** 呼び出しの中で動いた値。`step` は起きた段 */
interface CallItem {
  step: number;
  kind: CallKind;
  text: string;
}

/** 一覧の 1 行。`step` は呼び出しを開いた段、`depth` は開いた時に開いていた呼び出しの数、`close` は閉じた段と出力の字 */
export interface CallRow {
  step: number;
  depth: number;
  from: string;
  to: string;
  label?: string;
  items: CallItem[];
  close?: { step: number; output: string };
}

/** 呼び出しの行と、段ごとの段の終わりにいちばん内側で開いている呼び出しの行の番号 */
export interface CallList {
  rows: CallRow[];
  open: (number | undefined)[];
}

/** 図 `model` の段を頭から当て、呼び出しの行を出てきた順に作る */
export function callList(model: DiagramModel, lang: NotationLang): CallList {
  const w = FIGURE_TEXT[lang];
  const names = new Map(model.boxes.map((b) => [b.id, b.name]));
  const name = (id: string): string => names.get(id) ?? id;
  const run = new PipeRun(model.boxes, model.pipe?.holds ?? []);
  const rows: CallRow[] = [];
  /** 開いている呼び出しの行の番号。手順の開いている呼び出しと同じ順に積む */
  const stack: number[] = [];
  const open: (number | undefined)[] = [];
  const add = (step: number, kind: CallKind, text: string): void => {
    const top = stack[stack.length - 1];
    if (top !== undefined) rows[top]?.items.push({ step, kind, text });
  };
  model.steps.forEach((step, s) => {
    for (const e of step.events) {
      switch (e.type) {
        case "call":
          rows.push({ step: s, depth: stack.length, from: name(e.from), to: name(e.to), ...(e.label !== undefined ? { label: e.label } : {}), items: [] });
          if (!run.call(e)) stack.push(rows.length - 1);
          break;
        case "return":
        case "revert": {
          if (isFault(run.close(e.box, e.type))) break;
          const row = rows[stack.pop() ?? -1];
          if (row) row.close = { step: s, output: e.type === "return" ? (e.value ?? w.callNone) : w.callReverted(e.reason) };
          break;
        }
        case "move":
          if (!run.move(e)) add(s, "move", `${e.amount} ${run.tokens.get(e.box) ?? name(e.box)} ${name(e.from)} → ${name(e.to)}`);
          break;
        case "emit":
          if (!isFault(run.emit())) add(s, "emit", `${e.name}(${(e.args ?? []).join(", ")})`);
          break;
        case "check":
          add(s, "check", `${e.left} ${OP_TEXT[e.op]} ${e.right} ${checkPasses(e) ? PASS : FAIL}`);
          break;
        case "calc":
          add(s, "calc", `${e.in} → ${e.out}`);
          break;
        case "write":
          // 一覧には出さないが、後の出来事を図と同じ値の上で当てるために書き替える
          run.write(e);
          break;
        default:
          break;
      }
    }
    open.push(stack[stack.length - 1]);
  });
  return { rows, open };
}

/** 書き出した頁で呼び出しの一覧と拡大の度合いの札が出しうる字。字の file に残す */
export function pipeTexts(model: DiagramModel, lang: NotationLang): string[] {
  const w = FIGURE_TEXT[lang];
  const { rows } = callList(model, lang);
  return [
    ...Object.values(w.callHeads),
    ...Object.values(w.callKinds),
    w.callNone,
    w.callWaiting,
    ...rows.flatMap((row) => [`${row.from} → ${row.to}`, row.label ?? "", ...row.items.map((item) => item.text), row.close?.output ?? ""]),
    // 拡大の度合いの札 (`125%`)
    "0123456789%",
  ];
}

/** 呼び出しの一覧の見た目。一覧を置く時に頁へ 1 度だけ入れる */
function callsCss(): string {
  const hair = `${px(LOOK.stroke.hair)} solid var(--hair)`;
  return [
    // 狭い枠では表を縮めずに、一覧の中を横に送る
    ".dg-calls{overflow-x:auto}",
    `.dg-ct{width:100%;border-collapse:collapse;${font(TYPE.stepBodyNarrow)};color:var(--ink2)}`,
    `.dg-ct th,.dg-ct td{padding:${px(CALLS.padY)} ${px(CALLS.padX)};border-bottom:${hair};text-align:left;vertical-align:top}`,
    `.dg-ct thead th{${font(TYPE.fieldName)};color:var(--mute);white-space:nowrap}`,
    // 呼び出しの両端の名前は折らずに置き、字下げで呼び出しの深さを見せる
    `.dg-ct .dg-cw{color:var(--ink);white-space:nowrap}`,
    `.dg-ct tr[data-state="now"]>*{background:color-mix(in srgb,var(--c-blue) ${CALLS.now}%,transparent)}`,
    ".dg-ci{color:var(--mute)}",
    `.dg-ci[data-state="now"]{color:var(--ink)}`,
    `.dg-ck{${font(TYPE.tag)}}`,
    `.dg-ct .dg-cl{min-width:${px(CALLS.input)}}`,
    `.dg-ct .dg-cv{min-width:${px(CALLS.inside)}}`,
    ".dg-ct .dg-co{white-space:nowrap}",
    ".dg-ct [data-wait]{color:var(--mute)}",
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
  /** 図の下に置く一覧 */
  readonly element: HTMLElement;
  /** 図 `model` の段 `step` (0 から) までの呼び出しを出す。描き直した図を渡すと行を作り直す */
  show(model: DiagramModel, step: number): void;
}

/** 呼び出しの一覧を作る。置く所は再生の部品が決める */
export function mountPipeCalls(doc: Document, lang: NotationLang): PipeCalls {
  ensureCallsCss(doc);
  const w = FIGURE_TEXT[lang];
  const element = doc.createElement("div");
  element.className = "dg-calls";
  element.dataset.dragon = "calls";
  // 置いた頁の言葉と違っても、一覧を一覧の言葉の声で読ませる
  element.setAttribute("lang", lang);
  const table = doc.createElement("table");
  table.className = "dg-ct";
  table.setAttribute("aria-label", w.calls);
  const head = doc.createElement("thead");
  const headRow = doc.createElement("tr");
  for (const key of ["call", "input", "inside", "output"] as const) {
    const th = doc.createElement("th");
    th.scope = "col";
    th.textContent = w.callHeads[key];
    headRow.append(th);
  }
  head.append(headRow);
  const body = doc.createElement("tbody");
  table.append(head, body);
  element.append(table);

  const cell = (text: string): HTMLTableCellElement => {
    const td = doc.createElement("td");
    td.textContent = text;
    return td;
  };
  const itemOf = (item: CallItem, step: number): HTMLElement => {
    const el = doc.createElement("div");
    el.className = "dg-ci";
    el.dataset.dragon = "call-item";
    if (item.step === step) el.dataset.state = "now";
    const kind = doc.createElement("span");
    kind.className = "dg-ck";
    kind.textContent = w.callKinds[item.kind];
    el.append(kind, " ", item.text);
    return el;
  };

  let shown: DiagramModel | undefined;
  let list: CallList = { rows: [], open: [] };
  return {
    element,
    show: (model, step) => {
      if (model !== shown) {
        shown = model;
        list = callList(model, lang);
      }
      const now = new Set(list.rows.flatMap((row, i) => (row.step === step || row.close?.step === step ? [i] : [])));
      const innermost = list.open[step];
      if (now.size === 0 && innermost !== undefined) now.add(innermost);
      body.replaceChildren(
        ...list.rows.flatMap((row, i) => {
          if (row.step > step) return [];
          const tr = doc.createElement("tr");
          tr.dataset.dragon = "call";
          if (now.has(i)) tr.dataset.state = "now";
          const who = cell(`${row.from} → ${row.to}`);
          who.className = "dg-cw";
          who.style.paddingLeft = px(CALLS.padX + row.depth * CALLS.indent);
          const input = cell(row.label ?? w.callNone);
          input.className = "dg-cl";
          const items = row.items.filter((item) => item.step <= step);
          const inside = items.length > 0 ? doc.createElement("td") : cell(w.callNone);
          inside.className = "dg-cv";
          inside.append(...items.map((item) => itemOf(item, step)));
          const returned = row.close !== undefined && row.close.step <= step;
          const output = cell(returned ? (row.close?.output ?? w.callNone) : w.callWaiting);
          output.className = "dg-co";
          if (!returned) output.dataset.wait = "";
          tr.append(who, input, inside, output);
          return [tr];
        }),
      );
    },
  };
}
