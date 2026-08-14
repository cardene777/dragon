import { describe, expect, it } from "vitest";

import { textDslToDiagram } from "../src";

/**
 * 行を持つ名札の幅を、 その名札の書式で見積もる (#1147)。
 *
 * cdl の `requiredRowsWidth` は種別で書式を変える。 行を等幅の 26 で描くのは `storage` だけで、
 * それ以外は左が比例の 18 / 右が等幅の 21。 種別を渡さないと「どちらで描かれるか決められない」
 * ため、 cdl は **広い方** を返す。
 *
 * 広い方に倒れるのは安全側だが、 実際に描かれる書式より広い箱になる。 種別を渡せば実測どおりの
 * 幅で済む。
 *
 * 差が出るのは **比例の書式の方が広くなる行**。 比例は 1 字の最大が字の大きさの 1.038 倍
 * (`W`) で、 18 なら 18.7。 等幅の 26 は 1 字 15.6 なので、 `W` を並べると比例の方が広い。
 */
describe("行を持つ名札の幅が種別ごとの書式で決まる (#1147)", () => {
  const 名札の幅 = (kind: string, row: string): number | undefined => {
    const d = textDslToDiagram(`title: "t"
type: sequence

actors:
  - X: { kind: ${kind}, rows: ["${row}"] }
  - Y: actor

flow:
  - Y -> X: "x"
`);
    return d.nodes.find((n) => n.id === "x-header")?.w;
  };

  it("storage は等幅の書式で測る (比例の見積りに倒れない)", () => {
    // 等幅 26 = 1 字 15.6。 左 10 字 + 間隔 32 + 右 1 字 + 余白 26 × 2 = 256
    // 種別を渡さないと比例の見積り (左 10 字 × 18.7 = 187) に倒れて 268 になる
    expect(名札の幅("storage", "WWWWWWWWWW: 1"), "比例の見積りに倒れている").toBe(256);
  });

  it("細い字の行では書式の差が出ない", () => {
    // 比例の細い字 (`i` は 0.271 倍) は等幅より狭いので、 広い方 = 等幅。 種別の有無で
    // 値が変わらない = この行では差が観測できない
    expect(名札の幅("storage", "iiiiiiiiii: 1")).toBe(256);
  });
});
