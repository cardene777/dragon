/**
 * 判定の表 (#3879) の描く部品の組。記法を読む処理と書き戻す処理と原本の形との行き来は `judge/read.ts`、並べ方は `kinds/judge/layout.ts`、
 * HTML の表の描き方と段ごとに列を照らす処理は `judge/draw.ts` が持つ。
 * 表は SVG でなく HTML で描くので (`html`)、描く本体は SVG を描かず、再生の部品は表を縮めずに枠へ置く
 */
import { judgeMarkup, showJudge } from "../judge/draw";
import { isJudgeNotation, judgeDiagram, judgeErrors, judgeModel, printJudge, readJudge } from "../judge/read";
import { JUDGE_WORDS, type JudgeLayout, layoutJudge } from "./judge/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<JudgeLayout> = {
  model: { from: judgeDiagram, to: judgeModel },
  validate: (diagram) => judgeErrors(diagram),
  notation: { matches: isJudgeNotation, print: printJudge, read: readJudge },
  // 原本の段は言葉に依らない形で持つので、再生の帯に出す段の題と説明文を頁の言葉と判定の語で書き直す。段の数は変えない
  fold: (model, _options, lang) => {
    const words = JUDGE_WORDS[lang];
    const spec = model.judge;
    if (!spec) return model;
    const pass = spec.pass ?? words.pass;
    const block = spec.block ?? words.block;
    const steps = model.steps.map((step, i) => {
      const rule = spec.rules[i];
      return rule ? { ...step, title: rule.name, body: rule.value ?? "" } : { ...step, title: words.verdict, body: words.verdictBody(pass, block) };
    });
    return { ...model, steps };
  },
  layout: layoutJudge,
  html: { markup: judgeMarkup, show: showJudge },
};

// 登録簿の型にこの種類の行を足す。登録簿はこの file を読まない (#3763)
declare module "./registry" {
  interface LaterKinds {
    judge: typeof import("./judge");
  }
}
