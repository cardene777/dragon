/**
 * 2 つの入口が同じ種類 (`kind`) を受けることの検証 (#1293)。
 *
 * 記法の入口は `NODE_KIND_VALID` (cdl の `NODE_KINDS` + `DSL_ONLY_KINDS` +
 * `INFRA_KIND_ALIAS`) を見る。 JSON の入口は同じ一覧を **手で写して** 持っていたため、
 * 写した後に増えた種類が JSON 側だけ「知らない値」 になっていた。
 *
 * 知らない値は見本 (parts) の名前として扱われる。 見本帳に無ければ箱は `actor` に倒れ、
 * `console.warn` にしか残らない (`onNotice` を呼ばない) = **画面には何も出ない**。
 *
 * 公開している JSON Schema は `kind` の説明に `shape-wallet` 等を例示しているため、
 * schema を渡された LLM はこの値を書く。 書いた通りに描かれないことが既定の状態だった。
 *
 * 一覧が 2 箇所にある限り同じことが起きるので、**集合そのものを突き合わせる**。
 * 代表値を数個書く形にすると、次に種類が増えた時に検査が空振りする。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { textDslToDiagram, jsonToDiagram } from "@cardenelabs/dragon";
import { jsonToDoc, type DragonJson } from "../src/json-parser";
import { NODE_KIND_VALID } from "../src/v05/parser";

const 図 = (kind: string): DragonJson => ({
  title: "t",
  type: "flow",
  actors: [{ name: "A", kind }, { name: "B" }],
  flow: [{ from: "A", to: "B", label: "x" }],
});

describe("2 つの入口が同じ種類を受ける (#1293)", () => {
  it("記法が知る種類は JSON でも種類として読まれる", () => {
    // 母集合が空だと以下の走査は 1 件も回らずに通る
    expect(NODE_KIND_VALID.size, "種類の一覧が空 (検査が空振りしている)").toBeGreaterThan(0);

    const 見本の名前になった: string[] = [];
    let 測れた = 0;
    for (const kind of NODE_KIND_VALID) {
      const actor = jsonToDoc(図(kind)).actors[0]!;
      測れた += 1;
      if (actor.partId !== undefined || actor.kind !== kind) {
        見本の名前になった.push(`${kind} (kind: ${actor.kind}, partId: ${actor.partId ?? "-"})`);
      }
    }
    expect(測れた, "種類を 1 つも測れていない (検査が空振りしている)").toBe(NODE_KIND_VALID.size);
    expect(
      見本の名前になった,
      "記法では種類なのに JSON では見本の名前として扱われる値がある",
    ).toEqual([]);
  });

  it("一覧に無い値は従来どおり見本の名前として扱う", () => {
    // 見本 (parts) を `kind` に書く記法 (`arc-gauge` 等) を壊していないことの確認。
    // 綴りを誤った値もここに落ちる = 見本帳に無ければ箱は `actor` に倒れる
    const actor = jsonToDoc(図("arc-gauge")).actors[0]!;
    expect(actor.partId).toBe("arc-gauge");
    expect(actor.kind).toBe("actor");
    expect(actor.kindWritten).toBe(false);
  });

  it("図に組み立てるところまで種類が保たれる", () => {
    const 図に = jsonToDiagram(図("shape-wallet"));
    const node = 図に.nodes.find((n) => n.title === "A");
    expect(node?.kind).toBe("shape-wallet");
  });

  it("記法と JSON が同じ図に解決される", () => {
    // 種類ごとに組み立て後の形が変わるため、`shape-` を含む代表 3 種で端から端まで比べる
    for (const kind of ["shape-wallet", "shape-smart-contract", "cloud"]) {
      const 記法 = textDslToDiagram(
        `title: "t"\ntype: flow\nactors:\n  - A: { kind: ${kind} }\n  - B\nflow:\n  - A -> B: "x"\n`,
      );
      expect(JSON.stringify(jsonToDiagram(図(kind))), `${kind} で 2 つの入口の図が違う`).toBe(
        JSON.stringify(記法),
      );
    }
  });

  it("JSON の入口が種類の一覧を写し持っていない", () => {
    // 集合の突き合わせは「いま一致しているか」 しか見ない。 全 108 種を写した一覧でも通るため、
    // **写しを置く行為そのもの** をここで止める (次に cdl 側で種類が増えた時に再発する)
    const src = readFileSync(
      fileURLToPath(new URL("../src/json-parser.ts", import.meta.url)),
      "utf8",
    );
    expect(src).toContain("NODE_KIND_VALID");
    const 写しらしい一覧 = /new Set\(\[[^\]]*"actor"/s.test(src);
    expect(
      写しらしい一覧,
      "種類の一覧を手で写した記述が残っている (`NODE_KIND_VALID` を参照する)",
    ).toBe(false);
  });
});
