/**
 * `calc` のブロックの読み方 (#3389)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * `calc <行う者>: <入る値> -> <出る値>` の行。両側は数 (単位を添えてよい) で書き、数として読めない側を指して止める
 */
import { inPipeStep, pipeLine, textAt } from "../../pipe-read";
import { quantityOf } from "../../pipe-run";
import { fail } from "../../read-kit";
import type { BlockReading } from "../block";
import type { PipeCalc } from "./block";

export interface CalcMessages {
  calcShape: string;
  /** 換算の片側が数として読めない */
  calcNumber: (text: string) => string;
}

export const reading: BlockReading<CalcMessages> = {
  read: {
    calc: (source, state) => {
      const { m } = state;
      const { step } = inPipeStep(source, state);
      const { box, rest } = pipeLine(source, "calc", state, m.calcShape);
      const body = source.text.slice(rest);
      const arrow = body.indexOf("->");
      const input = arrow < 0 ? "" : body.slice(0, arrow).trim();
      const output = arrow < 0 ? "" : body.slice(arrow + 2).trim();
      if (input === "" || output === "") throw fail(source, 0, m.calcShape);
      if (!quantityOf(input)) throw fail(source, textAt(source, input, rest), m.calcNumber(input));
      if (!quantityOf(output)) throw fail(source, textAt(source, output, rest + arrow + 2), m.calcNumber(output));
      const event: PipeCalc = { type: "calc", box, in: input, out: output };
      step.events.push(event);
    },
  },
  print: {
    events: {
      calc: (e) => `calc ${e.box}: ${e.in} -> ${e.out}`,
    },
  },
  messages: {
    ja: {
      calcShape: "calc は calc <行う者>: <入る値> -> <出る値> の形で書く",
      calcNumber: (text) => `${text} は数として読めない。calc は両側に <数> <単位> を書く`,
    },
    en: {
      calcShape: "Write calc as calc <calculator>: <input> -> <output>",
      calcNumber: (text) => `${text} cannot be read as a number. Write <number> <unit> on both sides of calc`,
    },
  },
};
