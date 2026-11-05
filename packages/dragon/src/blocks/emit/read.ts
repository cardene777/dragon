/**
 * `emit` のブロックの読み方 (#3389)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * `emit <出す者>: <名前>(<引数>, <引数>)` の行。引数は `,` で区切り、引数の無いイベントは `<名前>()` と書く
 */
import { faultAt, inPipeStep, pipeLine } from "../../pipe-read";
import { isFault } from "../../pipe-run";
import { fail } from "../../read-kit";
import type { BlockReading } from "../block";
import type { PipeEmit } from "./block";

/** イベントの名前と引数 */
const CALL = /^([^\s(),]+)\((.*)\)$/u;

export interface EmitMessages {
  emitShape: string;
}

export const reading: BlockReading<EmitMessages> = {
  read: {
    emit: (source, state) => {
      const { m } = state;
      const { step, run } = inPipeStep(source, state);
      const { box, rest } = pipeLine(source, "emit", state, m.emitShape);
      const found = CALL.exec(source.text.slice(rest).trim());
      const inside = found?.[2]?.trim() ?? "";
      const args = inside === "" ? [] : inside.split(",").map((arg) => arg.trim());
      if (!found?.[1] || args.includes("")) throw fail(source, 0, m.emitShape);
      const emitted = run.emit();
      if (isFault(emitted)) throw faultAt(source, emitted, state, {});
      const event: PipeEmit = { type: "emit", box, name: found[1], ...(args.length > 0 ? { args } : {}) };
      step.events.push(event);
    },
  },
  print: {
    events: {
      emit: (e) => `emit ${e.box}: ${e.name}(${(e.args ?? []).join(", ")})`,
    },
  },
  messages: {
    ja: { emitShape: "emit は emit <出す者>: <名前>(<引数>, <引数>) の形で書く。引数が無ければ <名前>() と書く" },
    en: { emitShape: "Write emit as emit <emitter>: <name>(<arg>, <arg>). Without arguments, write <name>()" },
  },
};
