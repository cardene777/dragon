/** 使い方の頁の「配管の図」の節の、槽の段落 (#3389) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "pipe",
  ja: [
    "Solidity の関数を呼んだ時に中で何が起きたかを段ごとに追う時は、最初の行を `pipe <題>` にする。関係者は `box` で宣言し、種類 (送り手、Contract、トークンの Contract、口座) は書かずに行から決まる。最初の step より前に `hold <持ち主>: <量> <トークン>, <量> <トークン>` で残高を、`hold <持つ Contract>: <名前> <値>` で残高でない値を宣言する。トークンは `box usdc as USDC` のように宣言した関係者の名前で書き、ETH は宣言せずに書ける。量として読める名前と `[` を含む名前は `\"` で囲む。",
    "段の中の `move <トークンの Contract>: <量> <送り手> -> <受け手>` は、トークンの管を通して残高を移す。槽の水位はトークンごとに量に比例し、移した分は一番外の呼び出しが戻るまで斜線の暫定で描く。持っている量より多く移す行は、その量を指して止まる。",
  ],
  en: [
    "To follow, step by step, what happens inside a call to a Solidity function, start the first line with `pipe <title>`. Declare parties with `box`; their kind (sender, contract, token contract, account) is not written but derived from the lines. Before the first step, `hold <owner>: <amount> <token>, <amount> <token>` declares balances and `hold <contract>: <name> <value>` declares a value that is not a balance. A token is written as the name of a declared party, as in `box usdc as USDC`, and ETH needs no declaration. Quote a name that reads as an amount or holds `[`.",
    "In a step, `move <token contract>: <amount> <from> -> <to>` moves a balance through the token's pipe. Tank levels are true to scale per token, and the moved amount stays hatched as pending until the outermost call returns. A line that moves more than the sender holds stops at that amount.",
  ],
};
