/**
 * `gist` のブロックの読み方 (#3464)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * `gist <要点>` の行。1 つの段に 1 行まで書け、要点の文が空の行と 2 行目は、その行を名指して止める。
 * 書き戻す時は段のブロックの `say` と `code` の行と、出典の行の後ろに書く (ブロックの並びの順)
 */
import { fail } from "../../read-kit";
import type { BlockReading } from "../block";

export interface GistMessages {
  /** 1 つの段に 2 行目の `gist` を書いた */
  gistTwice: string;
  /** `gist` の後ろに要点の文が無い */
  emptyGist: string;
}

export const reading: BlockReading<GistMessages> = {
  read: {
    gist: (source, state) => {
      const step = state.inStep(source);
      if (step.gist !== undefined) throw fail(source, 0, state.m.gistTwice);
      const text = source.text.slice("gist".length).trim();
      if (text === "") throw fail(source, 0, state.m.emptyGist);
      step.gist = text;
    },
  },
  print: { step: (step) => (step.gist === undefined ? [] : [`gist ${step.gist}`]) },
  messages: {
    ja: {
      gistTwice: "1 つの段に gist は 1 行まで",
      emptyGist: "gist の後ろにその段の要点を書く",
    },
    en: {
      gistTwice: "A step takes at most one gist line",
      emptyGist: "Write the key point of the step after gist",
    },
  },
};
