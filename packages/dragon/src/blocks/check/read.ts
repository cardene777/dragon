/**
 * `check` のブロックの読み方 (#3389)。読む処理と書き戻す処理と日英の誤りの文を、入口に置く定義 (`block.ts`) と分けて持つ。
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時に読む。
 *
 * `check <行う者>: <左> <比べ方> <右> [fail]` の行。比べ方は前後を空白で区切った最初の記号で、両側が数なら dragon が比べるので `[fail]` を断る。
 * 両側が数の時は単位をそろえ、単位の違う数を比べる行は右の値を指して止める
 */
import { inPipeStep, pipeLine, textAt } from "../../pipe-read";
import { quantityOf } from "../../pipe-run";
import { type Attr, fail, readAttrs } from "../../read-kit";
import type { BlockReading } from "../block";
import { CHECK_OP, type CheckOp, type PipeCheck } from "./block";

export interface CheckMessages {
  checkShape: string;
  /** 両側が数の確認に `[fail]` を書いた */
  failOnNumbers: string;
  /** 単位の違う数を比べた */
  unitMismatch: (left: string, right: string) => string;
}

export const reading: BlockReading<CheckMessages> = {
  read: {
    check: (source, state) => {
      const { m } = state;
      const { step } = inPipeStep(source, state);
      const { box, rest } = pipeLine(source, "check", state, m.checkShape);
      const text = source.text;
      const open = text.endsWith("]") ? text.lastIndexOf(" [") + 1 : 0;
      const marks = open > rest ? readAttrs(source, open, ["fail"], m, ["fail"]) : new Map<string, Attr>();
      const body = text.slice(rest, open > rest ? open : text.length);
      const found = CHECK_OP.exec(body);
      const left = found ? body.slice(0, found.index).trim() : "";
      const right = found ? body.slice(found.index + found[0].length).trim() : "";
      if (!found || left === "" || right === "") throw fail(source, 0, m.checkShape);
      const flag = marks.get("fail");
      const l = quantityOf(left);
      const r = quantityOf(right);
      if (l && r && flag) throw fail(source, flag.at, m.failOnNumbers);
      if (l && r && l.unit !== r.unit) throw fail(source, textAt(source, right, rest + found.index + 1), m.unitMismatch(left, right));
      const event: PipeCheck = { type: "check", box, left, op: found[1] as CheckOp, right, ...(flag ? { fail: true } : {}) };
      step.events.push(event);
    },
  },
  print: {
    events: {
      check: (e) => `check ${e.box}: ${e.left} ${e.op} ${e.right}${e.fail ? " [fail]" : ""}`,
    },
  },
  messages: {
    ja: {
      checkShape: "check は check <行う者>: <左> <比べ方> <右> の形で書く。比べ方は >= か <= か > か < か == か != で、前後に空白を置く",
      failOnNumbers: "両側が数の check は dragon が比べて通るか落ちるかを決めるので、[fail] を書かない",
      unitMismatch: (left, right) => `${left} と ${right} は単位が違うので比べられない`,
    },
    en: {
      checkShape: "Write check as check <checker>: <left> <comparison> <right>. The comparison is >=, <=, >, <, == or !=, with a space on each side",
      failOnNumbers: "A check with numbers on both sides is decided by dragon, so do not write [fail]",
      unitMismatch: (left, right) => `${left} and ${right} have different units and cannot be compared`,
    },
  },
};
