/**
 * 座標を箱と縦列に載せる後処理は、知らせを 1 件も出さない (#1976 / #2006)。
 *
 * この後処理はかつて `sub-node-not-found` を出していた。 知らせが見ていた `nodes` の欄を
 * #1976 で外した時に出し所が消え、引数だけが残って静的検査の誤りになっていた (#2006)。
 *
 * 引数を外した後も「知らせる相手が居ない」 ことをここで固定する。 知らせを戻す時は
 * この検査が落ちるので、引数を足し直す判断が要ることに気付ける。
 *
 * ## 同じ本文で座標だけを変えて比べる
 *
 * 座標以外を変えると、別の後処理が出す知らせの差を座標のせいと読み違える。
 * `位置` の 1 行だけが違う 2 つの本文を組み立て、知らせの並びが一致することを見る。
 *
 * 一致だけでは、座標が 1 つも効いていない時も通る (空振り)。 座標が実際に箱へ載ったことを
 * 同じ検査の中で確かめる。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram } from "../src/index";

const 本文 = (位置の行: string): string =>
  [
    `title: "t"`,
    `type: flow`,
    ``,
    `actors:`,
    `  - 受付:`,
    `      kind: card`,
    ...(位置の行 === "" ? [] : [`      ${位置の行}`]),
    `  - 保管: { kind: card }`,
    ``,
    `flow:`,
    `  - 受付 -> 保管: 預ける`,
    ``,
  ].join("\n");

const 知らせ = (本文: string): string[] => {
  const 出: string[] = [];
  textDslToDiagram(本文, { onNotice: (n) => 出.push(`${n.kind}/${n.actor}/${n.message}`) });
  return 出.sort();
};

describe("座標を載せる後処理は知らせを出さない (#1976 / #2006)", () => {
  it("座標を書いても知らせの並びが変わらない", () => {
    expect(知らせ(本文("位置: 300,200"))).toEqual(知らせ(本文("")));
  });

  it("座標は実際に箱へ載っている (空振り防止)", () => {
    const d = textDslToDiagram(本文("位置: 300,200"));
    const 受付 = d.nodes.find((n) => n.title === "受付");
    expect(受付, "受付の箱が無い (検査が空振りしている)").toBeDefined();
    expect(受付?.posX).toBe(300);
    expect(受付?.posY).toBe(200);
  });

  it("座標を書かない本文では箱に座標が載らない (陰性対照)", () => {
    const d = textDslToDiagram(本文(""));
    const 受付 = d.nodes.find((n) => n.title === "受付");
    expect(受付, "受付の箱が無い (検査が空振りしている)").toBeDefined();
    expect(受付?.posX).toBeUndefined();
    expect(受付?.posY).toBeUndefined();
  });
});
