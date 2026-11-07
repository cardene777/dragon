/**
 * `step` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import type { Messages } from "../../messages";
import { type Attr, fail, isOneOf, list } from "../../read-kit";
import type { Step, ViewMode } from "../../schema";
import type { SourceLine } from "../../tokenize";
import type { BlockReading, ParseState, StepDraft } from "../block";
import { VIEWS } from "./block";

export interface StepMessages {
  noBody: (title: string) => string;
  emptyStepTitle: string;
  noSteps: string;
  emptySay: string;
  sayTwice: string;
  codeTwice: string;
  emptyCode: string;
  badView: string;
}

/** 最初の行の `view:` の値。知らない見せ方は誤りで止める */
export function viewOf(head: SourceLine, shown: Attr | undefined, m: Messages): ViewMode | undefined {
  if (shown && !isOneOf(VIEWS, shown.value)) throw fail(head, shown.at, m.badView);
  return shown?.value as ViewMode | undefined;
}

/** 読み終えた段。本文 (`say` の行) の無い段は、段の行を示して誤りで止める */
export function stepOf(draft: StepDraft, m: Messages): Step {
  if (draft.body === undefined) throw fail(draft.source, 0, m.noBody(draft.title));
  return {
    title: draft.title,
    body: draft.body.join("\n"),
    ...(draft.code !== undefined ? { code: draft.code } : {}),
    ...(draft.sources.length > 0 ? { sources: draft.sources } : {}),
    ...(draft.gist !== undefined ? { gist: draft.gist } : {}),
    events: draft.events,
  };
}

/**
 * `say` の行と、その下に `say` より深く字下げして続けた行を段の本文にする。
 * 続きの行の間の空行は本文の空の行になる。返すのは読み終えた続きの行の数 (最後の本文の行まで)
 */
function readSay(source: SourceLine, state: ParseState, after: (offset: number) => SourceLine | undefined): number {
  const step = state.inStep(source);
  if (step.body !== undefined) throw fail(source, 0, state.m.sayTwice);
  const inline = source.text.slice("say".length).trim();
  const body = inline === "" ? [] : [inline];
  let blanks = 0;
  let read = 0;
  for (let offset = 1; ; offset++) {
    const next = after(offset);
    if (!next) break;
    if (next.text === "") {
      blanks++;
      continue;
    }
    if (next.indent <= source.indent) break;
    body.push(...Array.from({ length: blanks }, () => ""), next.text);
    blanks = 0;
    read = offset;
  }
  if (body.length === 0) throw fail(source, 0, state.m.emptySay);
  step.body = body;
  return read;
}

export const reading: BlockReading<StepMessages> = {
  read: {
    // 前の段を閉じてから、題を確かめて次の段を書き始める
    step: (source, state) => {
      state.closeStep();
      const title = source.text.slice("step".length).trim();
      if (title === "") throw fail(source, 0, state.m.emptyStepTitle);
      state.openStep({ source, title, sources: [], events: [] });
    },
    say: readSay,
    code: (source, state) => {
      const step = state.inStep(source);
      if (step.code !== undefined) throw fail(source, 0, state.m.codeTwice);
      const command = source.text.slice("code".length).trim();
      if (command === "") throw fail(source, 0, state.m.emptyCode);
      step.code = command;
    },
  },
  print: {
    // 本文が空の段は `say` を書かない。原本の本文は空にできず、書き戻す処理が線から導ける本文を省く時だけ空にして渡す (#3438)
    step: (step) => {
      const body = step.body.split("\n");
      return [
        ...(step.body === "" ? [] : body.length === 1 ? [`say ${step.body}`] : ["say", ...body.map((line) => (line === "" ? "" : `  ${line}`))]),
        ...(step.code === undefined ? [] : [`code ${step.code}`]),
      ];
    },
  },
  messages: {
    ja: {
      noBody: (title) => `段「${title}」に本文 (say の行) が要る`,
      emptyStepTitle: "step の後ろに段の題を書く",
      noSteps: "段 (step の行) を 1 つ以上書く",
      emptySay: "say の後ろか、その下に字下げした行に段の本文を書く",
      sayTwice: "1 つの段に say は 1 つまで。長い本文は say の下に字下げして続ける",
      codeTwice: "1 つの段に code は 1 行まで",
      emptyCode: "code の後ろに命令を書く",
      badView: `view は ${list(VIEWS)} のどれか`,
    },
    en: {
      noBody: (title) => `Step "${title}" needs a body (a say line)`,
      emptyStepTitle: "Write a title after step",
      noSteps: "Write at least one step (a step line)",
      emptySay: "Write the step body after say, or on indented lines below it",
      sayTwice: "A step takes one say. Continue a long body on indented lines below it",
      codeTwice: "A step takes at most one code line",
      emptyCode: "Write the command after code",
      badView: `view is one of ${list(VIEWS)}`,
    },
  },
};
