import { textDslToDiagram } from "@cardenelabs/dragon";
import { expect, it } from "vitest";

import { 記法つき } from "./catalog-source-cases";

it("記法を持つ見本は、記法から作っても種類を失わない", () => {
  const 対象 = 記法つき();
  expect(
    対象.length,
    "記法を持つ見本を 1 件も集められていない (検査が空振りしている)",
  ).toBeGreaterThan(0);

  const 種類なし = 対象
    .filter(({ yaml }) => textDslToDiagram(yaml).type == null)
    .map(({ key }) => key);
  expect(種類なし, `記法から作った図に種類が乗っていない: ${種類なし.join(", ")}`).toEqual([]);
});
