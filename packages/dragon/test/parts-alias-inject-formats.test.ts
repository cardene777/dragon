/**
 * parts alias inject 多 format 対応 (iter50、 2026-07-19)。
 *
 * user 「テスト観点たくさんあるでしょ？」 対応 iter50。
 * parts unified syntax の alias 名に対して多様な format 対応を verify。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import { partsBadgeCount } from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";

const CATALOG: Record<string, CdlDiagram> = {
  "parts-badge-count": partsBadgeCount,
};

describe("iter50: parts alias inject 多 format 対応", () => {
  it("alias が英字のみ (badge)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - badge: { kind: badge-count }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.nodes.some((n) => n.id.startsWith("badge__"))).toBe(true);
  });

  it("alias が英字 + 数字 (b1)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - b1: { kind: badge-count }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.nodes.some((n) => n.id.startsWith("b1__"))).toBe(true);
  });

  it("alias が snake_case (my_badge)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - my_badge: { kind: badge-count }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.nodes.some((n) => n.id.startsWith("my_badge__"))).toBe(true);
  });

  it("alias が camelCase (myBadge)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - myBadge: { kind: badge-count }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.nodes.some((n) => n.id.startsWith("myBadge__"))).toBe(true);
  });

  it("alias 単一文字 (a)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - a: { kind: badge-count }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.nodes.some((n) => n.id.startsWith("a__"))).toBe(true);
  });

  it("alias 長 30 char (badgeCountLongAliasNameHere)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - badgeCountLongAliasNameHere: { kind: badge-count }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(
      compiled.nodes.some((n) => n.id.startsWith("badgeCountLongAliasNameHere__")),
    ).toBe(true);
  });

  it("alias 大文字始まり (Badge)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - Badge: { kind: badge-count }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    // slugify で小文字化される可能性ありだが sub-node は prefix + __ で保持
    const anyPrefixed = compiled.nodes.some((n) => /^[Bb]adge__/.test(n.id));
    expect(anyPrefixed).toBe(true);
  });

  it("alias が数字混合 (bg99)", () => {
    const dsl = `title: "t"
type: sequence
actors:
  - A
  - bg99: { kind: badge-count }
flow:
  - A -> A: "x"
`;
    const compiled = textDslToDiagram(dsl, { partsCatalog: CATALOG });
    expect(compiled.nodes.some((n) => n.id.startsWith("bg99__"))).toBe(true);
  });
});
