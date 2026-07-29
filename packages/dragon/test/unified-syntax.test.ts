import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseTextDslV05 } from "../src/v05/parser";
import type { DslActor, DslStep } from "../src/types";

/**
 * 書き方を空白区切りに揃える。
 *
 * 以前は 3 通りに割れていた。 登場人物の種類と色は空白区切り、 矢印の色は括弧、 補足と行は
 * 波括弧。 割れていたのは意味の違いではなく実装した順番の都合で、 書く人には理由が見えない。
 *
 * 測るのは「新しい書き方が parse を通るか」 ではなく、 **入れ子で書いた時と同じ結果になるか**。
 * 通るだけで中身が違えば、 書き換えた図が別物になる。
 */

const actorOf = (line: string): DslActor => {
  const src = [
    `title: "t"`, `type: flow`, ``, `actors:`,
    `  ${line}`, `  - X`, ``,
    `flow:`, `  - X -> X: "y"`,
  ].join("\n");
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(`parse 失敗: ${r.errors.map((e) => e.message).join(" / ")}`);
  return r.doc.actors[0]!;
};

const stepOf = (line: string): DslStep => {
  const src = [
    `title: "t"`, `type: flow`, ``, `actors:`, `  - A`, `  - B`, ``,
    `flow:`, `  ${line}`,
  ].join("\n");
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(`parse 失敗: ${r.errors.map((e) => e.message).join(" / ")}`);
  return r.doc.flow[0]!;
};

/** 比較に使う項目だけ取り出す (行番号は書き方で変わるので外す)。 */
const fields = (a: DslActor) => ({
  name: a.name, kind: a.kind, tone: a.tone, subtitle: a.subtitle,
  rows: a.rows, value: a.value, partId: a.partId,
});

describe("入れ子と同じ結果になる", () => {
  const SAME: Array<[string, string]> = [
    ["- API: service", "- API: { kind: service }"],
    ['- Web: service "APIサーバー"', '- Web: { kind: service, subtitle: "APIサーバー" }'],
    ["- DB: database 失敗", "- DB: { kind: database, tone: 失敗 }"],
    ['- LB: cloud "振り分け" 警告', '- LB: { kind: cloud, subtitle: "振り分け", tone: 警告 }'],
    ['- 表: storage ["id: PK", "name: 文字列"]', '- 表: { kind: storage, rows: ["id: PK", "name: 文字列"] }'],
  ];

  for (const [short, nested] of SAME) {
    it(`${short}`, () => {
      expect(fields(actorOf(short))).toEqual(fields(actorOf(nested)));
    });
  }
});

describe("値の形で振り分ける", () => {
  it("引用符付きは補足", () => {
    expect(actorOf('- A: service "本体"').subtitle).toBe("本体");
  });

  it("角括弧は行", () => {
    expect(actorOf('- A: storage ["x: 1", "y: 2"]').rows).toEqual(["x: 1", "y: 2"]);
  });

  it("色名は色", () => {
    expect(actorOf("- A: service 失敗").tone).toBe("error");
  });

  it("残りが種類", () => {
    expect(actorOf("- A: database").kind).toBe("database");
  });

  it("並べる順番は自由", () => {
    const a = actorOf('- A: 失敗 "本体" service');
    expect([a.kind, a.tone, a.subtitle]).toEqual(["service", "error", "本体"]);
  });

  it("行の中の コロン を名前の区切りと間違えない", () => {
    // `rows: ["id: PK"]` の中にも `:` がある。 後ろから探すと行の中を拾ってしまう
    const a = actorOf('- 表: storage ["id: PK", "email: 文字列"]');
    expect(a.name).toBe("表");
    expect(a.rows).toEqual(["id: PK", "email: 文字列"]);
  });

  it("補足の中の空白で切らない", () => {
    expect(actorOf('- A: service "API サーバー 本体"').subtitle).toBe("API サーバー 本体");
  });

  it("名前に空白があっても壊れない", () => {
    const a = actorOf('- 決済 API: service "本体" 失敗');
    expect([a.name, a.kind, a.subtitle, a.tone]).toEqual(["決済 API", "service", "本体", "error"]);
  });
});

describe("矢印も同じ書き方で揃う", () => {
  it("色を空白で書ける", () => {
    expect(stepOf('- A -> B: "検索" 成功').tone).toBe("success");
  });

  it("色と線の種類を空白で書ける", () => {
    const s = stepOf('- A -> B: "結果" 成功 dotted-flow');
    expect([s.tone, s.style]).toEqual(["success", "dotted-flow"]);
  });

  it("括弧で書いた時と同じ結果になる", () => {
    const space = stepOf('- A -> B: "結果" 成功 dotted-flow');
    const paren = stepOf('- A -> B: "結果" (成功, dotted-flow)');
    expect([space.label, space.tone, space.style]).toEqual([paren.label, paren.tone, paren.style]);
  });

  it("説明文に色名が入っていても色として取らない", () => {
    const s = stepOf('- A -> B: "成功したら次へ"');
    expect([s.label, s.tone]).toEqual(["成功したら次へ", undefined]);
  });

  it("説明文だけでも書ける", () => {
    expect(stepOf('- A -> B: "要求"').label).toBe("要求");
  });
});

describe("従来の書き方も動く", () => {
  it("入れ子はそのまま効く", () => {
    const a = actorOf('- A: { kind: service, subtitle: "本体", stack: 2 }');
    expect([a.kind, a.subtitle, a.stack]).toEqual(["service", "本体", 2]);
  });

  it("矢印の括弧はそのまま効く", () => {
    expect(stepOf('- A -> B: "x" (成功)').tone).toBe("success");
  });
});

describe("見本が新しい書き方で書かれている", () => {
  // 一覧から読み取って書く人が最初に見るのが見本。 そこが古い書き方だと揃えた意味がない
  const samplesPath = join(__dirname, "../../../apps/playground-spa/src/data/editor-samples.ts");

  it("登場人物に入れ子が残っていない", () => {
    const src = readFileSync(samplesPath, "utf8");
    const nested = src.split("\n").filter((l) => /^\s*- .+: \{ kind:/.test(l));
    expect(nested, nested.join(" / ")).toEqual([]);
  });
});
