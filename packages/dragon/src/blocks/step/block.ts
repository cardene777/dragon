/**
 * 段のブロック (#3345)。
 *
 * 図は `step <段の題>` の行で段に区切り、1 段ずつ進む。段の中の行は字下げして書き、その段で起きることを語る `say` の行を必ず書く。
 * 本文を 2 行以上に分ける時は、`say` だけの行の下に、`say` より深く字下げして続ける。続きの行の間の空行は本文の空の行になる。
 * `code <命令>` の行はその段で打つ命令で、1 つの段に 1 行まで書ける。
 * 見せ方は最初の行の終わりの `[view: fixed]` か `[view: follow]` で選び、書かなければ字の大きさで選ぶ。
 * どの図の種類にも書けるコアブロックで、図に付く。
 *
 * 段を閉じる時に開いたままの区画を断り、時間軸の図の宣言を確かめるのは、それを知る parser が `closeStep` で行う。
 * 段の区切りの `step <段の題>` の行は書き戻す処理 (`printer.ts`) が段ごとに書き、このブロックは段の中の `say` と `code` の行を書く。
 */
import type { Messages } from "../../messages";
import { type Attr, fail, isOneOf, list } from "../../read-kit";
import type { Step, ViewMode } from "../../schema";
import type { SourceLine } from "../../tokenize";
import type { Block, ParseState, StepDraft } from "../block";

/** 見せ方の一覧。最初の行の `view:` に書ける値と、誤りの文に並べる値 */
export const VIEWS = Object.keys({ fixed: true, follow: true } satisfies Record<ViewMode, true>) as ViewMode[];

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

export const block: Block<StepMessages> = {
  name: "step",
  rank: 40,
  attach: { how: "attach-to-figure" },
  words: { heads: ["step", "say", "code"], attrs: { diagram: ["view"] } },
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
  // 1 行の本文は `say` の後ろに続け、2 行以上は `say` だけの行の下に字下げして書く。空の行は字下げしない
  print: {
    step: (step) => {
      const body = step.body.split("\n");
      return [
        ...(body.length === 1 ? [`say ${step.body}`] : ["say", ...body.map((line) => (line === "" ? "" : `  ${line}`))]),
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
