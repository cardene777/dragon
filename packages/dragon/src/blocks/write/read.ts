/**
 * `write` のブロックの読み方 (#3389)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * `write <書く Contract>: <名前> <値>` の行で、書く Contract が書き込む先の値の札を書き替える。書き込む先は開いている呼び出しから決まり、
 * 処理を借りる呼び出しの内側では呼んだ側の値になる。書き替える値は `hold` で宣言しておく
 */
import { faultAt, inPipeStep, pipeLine, readValueName, valueName } from "../../pipe-read";
import { isFault } from "../../pipe-run";
import { fail } from "../../read-kit";
import type { BlockReading } from "../block";
import type { PipeWrite } from "./block";

export interface WriteMessages {
  writeShape: string;
}

export const reading: BlockReading<WriteMessages> = {
  read: {
    write: (source, state) => {
      const { m } = state;
      const { step, run } = inPipeStep(source, state);
      const { box, rest } = pipeLine(source, "write", state, m.writeShape);
      const named = readValueName(source, rest, state);
      const value = named ? source.text.slice(named.end).trim() : "";
      if (!named || value === "") throw fail(source, 0, m.writeShape);
      const event: PipeWrite = { type: "write", box, name: named.name, value };
      const owner = run.write(event);
      if (isFault(owner)) throw faultAt(source, owner, state, { noPlate: rest });
      step.events.push(event);
    },
  },
  print: {
    events: {
      write: (e) => `write ${e.box}: ${valueName(e.name)} ${e.value}`,
    },
  },
  messages: {
    ja: { writeShape: "write は write <書く Contract>: <名前> <値> の形で書く" },
    en: { writeShape: "Write write as write <contract>: <name> <value>" },
  },
};
