import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl } from "../src/compile";
import type { DslActor } from "../src/types";

/**
 * 登場人物を入れ子なしで書けるようにする。
 *
 * 種類だけなら `名前: 種類` で書けたが、 色を足した途端に `名前: { kind: 種類, tone: 色 }`
 * が必要だった。 色は語の集合が閉じている (`TONES` + 別名) ので、 種類名と取り違えずに
 * 空白区切りで受け取れる。
 *
 * 測るのは「parse が通ったか」 ではなく、 **種類と色が意図通り取れているか**。
 * 誤って部品名 (`partId`) に落ちる形は、 後から「そんな部品はない」 と警告が出るだけで
 * 図としては何も起きないため、 その分岐も個別に見る。
 */

const parseActor = (line: string): DslActor => {
  const src = [
    `title: "t"`,
    `type: flow`,
    ``,
    `actors:`,
    `  ${line}`,
    `  - API`,
    ``,
    `flow:`,
    `  - Client -> API: "x"`,
  ].join("\n");
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(`parse 失敗: ${r.errors.map((e) => e.message).join(" / ")}`);
  return r.doc.actors[0]!;
};

describe("入れ子なしで書ける", () => {
  it("名前だけ", () => {
    const a = parseActor("- Client");
    expect([a.kind, a.tone, a.partId]).toEqual(["actor", undefined, undefined]);
  });

  it("名前と種類", () => {
    const a = parseActor("- Client: service");
    expect([a.kind, a.tone, a.partId]).toEqual(["service", undefined, undefined]);
  });

  it("名前と種類と色", () => {
    const a = parseActor("- Client: service 失敗");
    expect([a.kind, a.tone, a.partId]).toEqual(["service", "error", undefined]);
  });

  it("色だけ", () => {
    const a = parseActor("- Client: 失敗");
    expect([a.kind, a.tone, a.partId]).toEqual(["actor", "error", undefined]);
  });

  it("英語の色名でも書ける", () => {
    expect(parseActor("- Client: service error").tone).toBe("error");
    expect(parseActor("- Client: database info").tone).toBe("info");
  });

  it("入れ子と同じ結果になる", () => {
    const short = parseActor("- Client: service 失敗");
    const nested = parseActor("- Client: { kind: service, tone: 失敗 }");
    expect([short.kind, short.tone]).toEqual([nested.kind, nested.tone]);
  });

  it("色が実際に箱に届く", () => {
    // parse だけ通って compile で落ちる形を避ける
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - Client: service 失敗`, `  - API`, ``,
      `flow:`, `  - Client -> API: "x"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    const d = compileToCdl(r.doc);
    const client = d.nodes.find((n) => n.title === "Client");
    expect(client?.tone).toBe("error");
  });
});

describe("取り違えない", () => {
  it("色に見えない語は種類として扱う", () => {
    // `service` は色名ではないので、 種類として取る
    const a = parseActor("- Client: service");
    expect(a.tone).toBeUndefined();
    expect(a.kind).toBe("service");
  });

  it("部品名を色と間違えない", () => {
    // 未知の語は従来どおり部品名になる
    const a = parseActor("- g1: arc-gauge");
    expect(a.partId).toBe("arc-gauge");
    expect(a.tone).toBeUndefined();
  });

  it("部品に色を書いても状態の上書きとして扱う", () => {
    // parts の `tone` は以前から状態の名前として使える
    const a = parseActor("- g1: arc-gauge 失敗");
    expect(a.partId).toBe("arc-gauge");
    expect(a.tone, "色としては解釈しない").toBeUndefined();
  });

  it("名前に空白があっても壊れない", () => {
    const a = parseActor("- 決済 API: service 失敗");
    expect([a.name, a.kind, a.tone]).toEqual(["決済 API", "service", "error"]);
  });

  it("未知の色名は種類の一部として扱う", () => {
    // `purple` は色名ではないので、 `service purple` 全体が種類名 = 未知なので部品名になる
    const a = parseActor("- Client: service purple");
    expect(a.tone).toBeUndefined();
    expect(a.partId).toBe("service purple");
  });
});

describe("既存の書き方が変わらない", () => {
  it("入れ子はそのまま効く", () => {
    const a = parseActor("- Client: { kind: service, subtitle: \"API サーバー\" }");
    expect([a.kind, a.subtitle]).toEqual(["service", "API サーバー"]);
  });

  it("引用符で囲んだ名前", () => {
    const a = parseActor('- "画面 A": card');
    expect([a.name, a.kind]).toEqual(["画面 A", "card"]);
  });
});
