/**
 * 試す図 (`try`、#3337) の描く部品と再生の部品が出す字。
 *
 * 試す図を描く部品と再生の部品の操作は、軽い入口では試す図の塊 (`kinds/try.ts`) と一緒に後から読む。
 * 字もその塊にだけ入るよう、どの図でも使う字 (`figure-text.ts`) と分けて持つ。言葉の渡し方は `figure-text.ts` と同じ。
 */
import type { NotationLang } from "./words";

export interface TryText {
  /**
   * 試す図 (#3337)。ブロックの番号の字、待ち行列の取り出し方 (釦が上から何件を取り出すか)、畳んだ古いブロックの数。
   * prev と hash と SHA-256 は語の名前のまま、どちらの言葉でも書き換えない
   */
  tryBlock: (n: number) => string;
  tryTakes: (n: number) => string;
  tryFolded: (n: number) => string;
  /** 記録の列の記録の番号の字 (#3441) */
  tryRecord: (n: number) => string;
  /** 記録の列で畳んだ記録の数の字 (#3441) */
  tryFoldedRecords: (n: number) => string;
  /**
   * 関門で止まった記録 (#3476) の字。止まった節の字と、`retry` を書いた関門の「再試行できる」の印と、書かない関門の「直して送り直す」の印。
   * 送ったチップが関門で止まった段の本文
   */
  tryStoppedAt: (node: string) => string;
  tryRetry: string;
  tryResend: string;
  tryStoppedBody: (name: string, node: string, error: string) => string;
  /**
   * 試す図の再生の部品 (#3337)。入力の帯と書き換える欄の読み上げの名前、送る釦と決める釦と閉じる釦の字、書き換える欄の名前。
   * 押せない訳は、満杯の待ち行列へ送れないこと、空の待ち行列から取り出せないこと、待ち行列が受け入れない名前、
   * 集める待ち行列が足りないこと、空の欄、チップの名前に使えない字、空の書き換え。
   * 読み手が足した段の題と本文は、送った、釦を押した、書き換えたの 3 つ
   */
  tryAsk: string;
  tryEditForm: string;
  trySend: string;
  tryApply: string;
  tryClose: string;
  tryEditField: (item: string, field: string) => string;
  tryFull: (queue: string, most: number) => string;
  tryEmpty: (queue: string, press: string) => string;
  /** 待ち行列 `queue` が名前 `name` のチップを受け入れないので送れない (#3453) */
  tryRefused: (queue: string, name: string) => string;
  /** 2 つ以上の待ち行列から集める釦 `press` を、待ち行列 `queue` が `take` 件に満たないので押せない (#3453) */
  tryShort: (queue: string, press: string, take: number) => string;
  tryBlank: string;
  tryBadName: (field: string) => string;
  tryBlankEdit: string;
  trySent: (name: string) => string;
  trySentBody: (name: string, into: string, via?: string) => string;
  tryPressed: (press: string) => string;
  tryPressedBody: (count: number, from: string, block: number) => string;
  /** 釦が記録の列 `log` の記録 `record` に `from` の上から `count` 件を入れた時の段の本文 (#3441) */
  tryPressedRecordBody: (count: number, from: string, log: string, record: number) => string;
  /** 釦が 2 つ以上の待ち行列 `froms` のそれぞれの上から `count` 件ずつをブロック `block` に入れた時の段の本文 (#3453) */
  tryGatheredBody: (count: number, froms: readonly string[], block: number) => string;
  /** 釦が 2 つ以上の待ち行列 `froms` のそれぞれの上から `count` 件ずつを記録の列 `log` の記録 `record` に入れた時の段の本文 (#3453) */
  tryGatheredRecordBody: (count: number, froms: readonly string[], log: string, record: number) => string;
  tryEdited: (item: string, field: string) => string;
  tryEditedBody: (field: string, from: string, to: string) => string;
}

/** 英語の文で、名札を `,` と and でつなぐ */
const enList = (names: readonly string[]): string =>
  names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1] ?? ""}`;

export const TRY_TEXT: Record<NotationLang, TryText> = {
  ja: {
    tryBlock: (n) => `ブロック${n}`,
    tryTakes: (n) => `次は上から${n}件`,
    tryFolded: (n) => `古いブロック${n}つ`,
    tryRecord: (n) => `記録${n}`,
    tryFoldedRecords: (n) => `古い記録${n}つ`,
    tryStoppedAt: (node) => `${node}で止まった`,
    tryRetry: "再試行できる",
    tryResend: "直して送り直す",
    tryStoppedBody: (name, node, error) => `${name}が${node}の関門で止まった(${error})。`,
    tryAsk: "送る値",
    tryEditForm: "チップを書き換える",
    trySend: "送る",
    tryApply: "決める",
    tryClose: "閉じる",
    tryEditField: (item, field) => `${item}の${field}`,
    tryFull: (queue, most) => `${queue}が満杯(${most}件)なので送れない`,
    tryEmpty: (queue, press) => `${queue}が空なので「${press}」を押せない`,
    tryRefused: (queue, name) => `${queue}は${name}を受け入れないので送れない`,
    tryShort: (queue, press, take) => `${queue}のチップが${take}件に満たないので「${press}」を押せない`,
    tryBlank: "全ての欄を埋めてから送る",
    tryBadName: (field) => `${field}に空白と [ ] 「 」 = : は使えない`,
    tryBlankEdit: "値を入れてから決める",
    trySent: (name) => `${name}を送った`,
    trySentBody: (name, into, via) =>
      via === undefined
        ? `${name}が${into}に入った。`
        : `${name}が${via}を通って${into}に入った。`,
    tryPressed: (press) => `「${press}」を押した`,
    tryPressedBody: (count, from, block) =>
      `${from}の上から${count}件がブロック${block}に入った。`,
    tryPressedRecordBody: (count, from, log, record) =>
      `${from}の上から${count}件が${log}の記録${record}に入った。`,
    tryGatheredBody: (count, froms, block) => `${froms.join("と")}の上から${count}件ずつがブロック${block}に入った。`,
    tryGatheredRecordBody: (count, froms, log, record) =>
      `${froms.join("と")}の上から${count}件ずつが${log}の記録${record}に入った。`,
    tryEdited: (item, field) => `${item}の${field}を書き換えた`,
    tryEditedBody: (field, from, to) =>
      `${field}を${from}から${to}にした。ブロックのhashを出し直す。`,
  },
  en: {
    tryBlock: (n) => `Block ${n}`,
    tryTakes: (n) => `Top ${n} go next`,
    tryFolded: (n) => `${n} older ${n === 1 ? "block" : "blocks"}`,
    tryRecord: (n) => `Record ${n}`,
    tryFoldedRecords: (n) => `${n} older ${n === 1 ? "record" : "records"}`,
    tryStoppedAt: (node) => `Stopped at ${node}`,
    tryRetry: "retryable",
    tryResend: "fix and resend",
    tryStoppedBody: (name, node, error) => `${name} stopped at the gate on ${node} (${error}).`,
    tryAsk: "Values to send",
    tryEditForm: "Edit a chip",
    trySend: "Send",
    tryApply: "Apply",
    tryClose: "Close",
    tryEditField: (item, field) => `${field} of ${item}`,
    tryFull: (queue, most) => `${queue} is full (${most}), so nothing more can be sent`,
    tryEmpty: (queue, press) => `${queue} is empty, so "${press}" cannot be pressed`,
    tryRefused: (queue, name) => `${queue} does not accept ${name}, so it cannot be sent`,
    tryShort: (queue, press, take) => `${queue} holds fewer than ${take} chips, so "${press}" cannot be pressed`,
    tryBlank: "Fill in every field before sending",
    tryBadName: (field) => `${field} cannot contain spaces, brackets, "=" or ":"`,
    tryBlankEdit: "Enter a value before applying",
    trySent: (name) => `Sent ${name}`,
    trySentBody: (name, into, via) =>
      via === undefined
        ? `${name} went into ${into}.`
        : `${name} traveled through ${via} into ${into}.`,
    tryPressed: (press) => `Pressed "${press}"`,
    tryPressedBody: (count, from, block) =>
      `The top ${count === 1 ? "item" : `${count} items`} of ${from} went into block ${block}.`,
    tryPressedRecordBody: (count, from, log, record) =>
      `The top ${count === 1 ? "item" : `${count} items`} of ${from} went into record ${record} of ${log}.`,
    tryGatheredBody: (count, froms, block) =>
      `The top ${count === 1 ? "item" : `${count} items`} of each of ${enList(froms)} went into block ${block}.`,
    tryGatheredRecordBody: (count, froms, log, record) =>
      `The top ${count === 1 ? "item" : `${count} items`} of each of ${enList(froms)} went into record ${record} of ${log}.`,
    tryEdited: (item, field) => `Changed ${field} of ${item}`,
    tryEditedBody: (field, from, to) =>
      `Set ${field} from ${from} to ${to}. The block hash is computed again.`,
  },
};
