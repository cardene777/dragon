import { describe, expect, it } from "vitest";

import { sourceYaml__textDslSwimlaneStages } from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import { compileToCdl } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

function 組み立てる(source: string): ReturnType<typeof compileToCdl> {
  const parsed = parseTextDslV05(source);
  if (!parsed.ok) throw new Error(parsed.errors.map((error) => error.message).join("\n"));
  return compileToCdl(parsed.doc, { onNotice: () => {} });
}

describe("段階ごとの箱の出力を固定する (#2799)", () => {
  it("見本帳の段階ごとの箱", () => {
    expect(組み立てる(sourceYaml__textDslSwimlaneStages)).toMatchSnapshot();
  });

  it("animation を持たない小さな段階ごとの箱", () => {
    expect(
      組み立てる(`title: "段階の固定"
type: swimlane
shape: stages
actors:
  - 受付: { stage: 申請, lane: front }
  - 確認: { stage: 審査, lane: review }
flow:
  - 受付 -> 確認: "渡す"
`),
    ).toMatchSnapshot();
  });
});
