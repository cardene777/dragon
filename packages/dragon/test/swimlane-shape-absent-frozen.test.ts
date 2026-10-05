import { describe, expect, it } from "vitest";

import { sourceYaml__presetSwimlane } from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import { compileToCdl } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

function 組み立てる(source: string): ReturnType<typeof compileToCdl> {
  const parsed = parseTextDslV05(source);
  if (!parsed.ok) throw new Error(parsed.errors.map((error) => error.message).join("\n"));
  return compileToCdl(parsed.doc, { onNotice: () => {} });
}

describe("shape を書かない泳法図の出力を固定する (#2797)", () => {
  it("見本帳の泳法図", () => {
    expect(組み立てる(sourceYaml__presetSwimlane)).toMatchSnapshot();
  });

  it("動きを持つ泳法図", () => {
    expect(
      組み立てる(`title: "動く泳法図"
type: swimlane
actors:
  - 受付: { lane: front }
  - 審査: { lane: back }
flow:
  1. 受付 -> 審査: 渡す
animation:
  - step: "受け付ける" 1s
    focus: [受付]
  - step: "審査する" 1s
    focus: [審査]
`),
    ).toMatchSnapshot();
  });

  it("縦列の宣言を持つ泳法図", () => {
    expect(
      組み立てる(`title: "縦列のある泳法図"
type: swimlane
lanes:
  front: { label: 受付 }
  back: { label: 審査 }
actors:
  - 申請: { lane: front }
  - 確認: { lane: back }
flow:
  1. 申請 -> 確認: 渡す
`),
    ).toMatchSnapshot();
  });

  it("向きを持つ泳法図", () => {
    expect(
      組み立てる(`title: "向きのある泳法図"
type: swimlane
direction: 縦
actors:
  - 受付: { lane: front }
  - 審査: { lane: back }
flow:
  1. 受付 -> 審査: 渡す
`),
    ).toMatchSnapshot();
  });
});
