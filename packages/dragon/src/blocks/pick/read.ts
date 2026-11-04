/**
 * `pick` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { type BlockReading, none } from "../block";
import { laneAt } from "../seal/read";

export const reading: BlockReading = {
  read: {
    pick: (source, state) => {
      const step = state.inStep(source);
      step.events.push({ type: "pick", box: laneAt(source, "pick", state).box });
    },
  },
  print: {
    events: {
      pick: (e) => `${e.type} ${e.box}`,
    },
  },
  messages: none("列を名指す行の形の誤りの文は、封のブロックが持つ"),
};
