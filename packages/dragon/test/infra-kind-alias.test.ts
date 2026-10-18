import { describe, it, expect } from "vitest";
import { NODE_KINDS } from "@cardenelabs/cdl";
import { parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl } from "../src/compile";

/**
 * 一般の語を、 同じ役割を表す描画できる種類に読み替える。
 *
 * これらは記法が受け付けるのに描画側に無く、 書くと「未対応」 とエラーになっていた。
 * 書いた人から見れば「受け付けたのに動かない」 で、 何が悪いか分からない。
 *
 * 測るのは「読み替え表に載っているか」 ではなく、 **書いた結果が描画できる種類になるか**。
 * 表に書いても読み替えを通していなければ、 実際には動かないまま。
 *
 * AWS の名前 (`alb` / `lambda` / `s3` など) は #2947 で外した。 書いた時に置き換え先を
 * 知らせることは `removed-syntax.test.ts` が見る。
 */

const INFRA_NAMES = ["browser", "secret", "user", "container"] as const;

const kindOf = (written: string): string => {
  const src = [
    `title: "t"`,
    `type: flow`,
    ``,
    `actors:`,
    `  - N: ${written}`,
    `  - B`,
    ``,
    `flow:`,
    `  - N -> B: "x"`,
    ``,
    `animation:`,
    `  - step: "s" 1.0s`,
    `    focus: [N, B]`,
  ].join("\n");
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(`parse 失敗: ${r.errors.map((e) => e.message).join(" / ")}`);
  const d = compileToCdl(r.doc);
  const node = d.nodes.find((n) => n.title === "N");
  if (!node) throw new Error("箱が無い");
  return node.kind;
};

describe("一般の語で書いても図が出る", () => {
  for (const name of INFRA_NAMES) {
    it(`${name} が描画できる種類になる`, () => {
      const kind = kindOf(name);
      expect(NODE_KINDS as readonly string[], `${name} → ${kind} が描画できない`).toContain(kind);
    });
  }

  it("部品名として扱われない", () => {
    // 読み替えを外すと部品名に落ちて「そんな部品はない」 になる
    for (const name of INFRA_NAMES) {
      const src = `title: "t"\ntype: flow\n\nactors:\n  - N: ${name}\n  - B\n\nflow:\n  - N -> B: "x"\n`;
      const r = parseTextDslV05(src);
      if (!r.ok) throw new Error("parse 失敗");
      expect(r.doc.actors[0]!.partId, `${name} が部品名になった`).toBeUndefined();
    }
  });

  it("役割の近い種類に寄せている", () => {
    // 読み替え先を固定する。 変えると図の見た目が変わるので、 変えたことに気付ける形にする
    expect(kindOf("user")).toBe("person");
    expect(kindOf("browser")).toBe("frontend");
    expect(kindOf("container")).toBe("service");
    expect(kindOf("secret")).toBe("storage");
  });

  it("短い記法でも色と一緒に書ける", () => {
    const src = `title: "t"\ntype: flow\n\nactors:\n  - N: secret 失敗\n  - B\n\nflow:\n  - N -> B: "x"\n`;
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    const a = r.doc.actors[0]!;
    expect([a.kind, a.tone]).toEqual(["storage", "error"]);
  });
});

describe("描画できる種類はそのまま通る", () => {
  it("読み替え表に無い種類は変わらない", () => {
    expect(kindOf("service")).toBe("service");
    expect(kindOf("database")).toBe("database");
    expect(kindOf("shape-cloud")).toBe("shape-cloud");
  });

  it("JavaScript が既定で持つ名前は種類にならない", () => {
    // 読み替え表を素の添字で引くと、 どの object も持っている `toString` 等が引けてしまう
    for (const name of ["toString", "constructor", "valueOf", "hasOwnProperty", "__proto__"]) {
      const src = `title: "t"\ntype: flow\n\nactors:\n  - N: ${name}\n  - B\n\nflow:\n  - N -> B: "x"\n`;
      const r = parseTextDslV05(src);
      if (!r.ok) throw new Error("parse 失敗");
      const a = r.doc.actors[0]!;
      expect(typeof a.kind, name).toBe("string");
      expect(a.kind, name).toBe("actor");
    }
  });

  it("未知の名前は部品名のまま", () => {
    const src = `title: "t"\ntype: flow\n\nactors:\n  - g1: arc-gauge\n  - B\n\nflow:\n  - g1 -> B: "x"\n`;
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    expect(r.doc.actors[0]!.partId).toBe("arc-gauge");
  });
});
