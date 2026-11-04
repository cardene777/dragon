// packages/dragon/scripts/build-validator.mjs がブロックの形の欠片から書き出した。手で直さない

/** 段の中で起きることの種類ごとの、その形の枝を持つブロックの名前 (#3349)。軽い入口が原本から書いた図が使うブロックを引く時に読む */
export const EVENT_OWNERS: Readonly<Record<string, string>> = {
  "action": "act",
  "ask": "ask",
  "branch": "branch",
  "commit": "commit",
  "edge": "edge",
  "item": "ask",
  "leaf": "leaf",
  "line": "line",
  "mark": "row",
  "node": "node",
  "now": "scale",
  "open": "seal",
  "pick": "pick",
  "press": "press",
  "role": "role",
  "seal": "seal",
  "span": "scale",
  "stamp": "stamp",
  "strip": "strip",
  "swap": "note",
};
