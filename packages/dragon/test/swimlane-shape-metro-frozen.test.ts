import { describe, expect, it } from "vitest";

import { sourceYaml__textDslSwimlaneMetro } from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import { compileToCdl } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

function 組み立てる(source: string): ReturnType<typeof compileToCdl> {
  const parsed = parseTextDslV05(source);
  if (!parsed.ok) throw new Error(parsed.errors.map((error) => error.message).join("\n"));
  return compileToCdl(parsed.doc, { onNotice: () => {} });
}

describe("路線図の出力を固定する (#2798)", () => {
  it("見本帳の路線図", () => {
    expect(組み立てる(sourceYaml__textDslSwimlaneMetro)).toMatchSnapshot();
  });

  it("animation を持たない小さな路線図", () => {
    expect(
      組み立てる(`title: "路線図の固定"
type: swimlane
shape: metro
actors:
  - 受付: { lane: front }
  - 確認: { lane: review }
flow:
  - 受付 -> 確認: "渡す"
`),
    ).toMatchSnapshot();
  });
});
