/**
 * `chain` のブロックの読み方 (#3349)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む
 */
import { attrs } from "../../print-kit";
import { fail, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import { fieldAt, valueAt } from "../../try-read";
import type { BlockReading, ParseState } from "../block";

export interface ChainMessages {
  chainShape: string;
}

/** `chain <名札> [edit: <欄>]` の行。欄は入力の帯の欄 (最初の欄を除く) */
function readChain(source: SourceLine, state: ParseState): void {
  const { m } = state;
  if (state.current()) throw fail(source, 0, m.tryPartInStep("chain"));
  const declared = readDeclared(source, "chain", state.attrs.chain ?? [], m);
  if (declared.name !== undefined) throw fail(source, 0, m.chainShape);
  state.declare(source, declared.id, declared.idAt);
  const field = declared.attrs.get("edit");
  if (field) state.figure.try.pending.push(() => fieldAt(source, field.value, valueAt(source, field), state));
  state.figure.try.parts.push({ type: "chain", id: declared.id, ...(field ? { edit: field.value } : {}) });
}

export const reading: BlockReading<ChainMessages> = {
  read: { chain: readChain },
  print: {
    part: (part) => (part.type === "chain" ? `chain ${part.id}${attrs([["edit", part.edit]])}` : ""),
  },
  messages: {
    ja: {
      chainShape: "chain は chain <名札> [edit: <欄>] の形で書く",
    },
    en: {
      chainShape: "Write a chain as chain <id> [edit: <field>]",
    },
  },
};
