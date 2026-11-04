/** 編集画面の棚の、段の部品 (#3345、#3350)。棚の部品の id は `step`。新しい段を末尾に足し、最初の 2 つの箱の間に線を 1 本引く */
import type { Step } from "../../../schema";
import type { BlockShelf } from "../../gallery";

/** 足す段の仮の題と本文と線の名前。記法の語ではなく、書き手が書き換える前提の字 */
const WORDS = {
  ja: { newStep: "新しい段", stepBody: "この段で起きることを書く。", call: "呼ぶ" },
  en: { newStep: "New step", stepBody: "Write what happens in this step.", call: "call" },
} as const;

export const shelf = {
  step: {
    ja: "段",
    en: "Step",
    build: (d, kit) => {
      const words = WORDS[kit.lang];
      const p = kit.pair(d);
      const step: Step = { title: words.newStep, body: words.stepBody, events: [{ type: "edge", from: p.from, to: p.to, label: words.call, carry: { kind: "envelope" } }] };
      return { ...p.diagram, steps: [...p.diagram.steps, step] };
    },
  },
} satisfies BlockShelf;
