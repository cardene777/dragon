import { describe, it, expect } from "vitest";
import { buildDuplicateLine, nextAvailableAlias, collectActorAliases, aliasBaseName, removeActorLine } from "./overlay-duplicate";

describe("buildDuplicateLine", () => {
  it("rotate / bg を引き継ぐ (CAR-2158 Round 2 = 全 duplicate 経路で共通)", () => {
    const line = buildDuplicateLine(
      { kind: "achievement", posX: 100, posY: 200, scale: 1.5, rotate: 45, bg: "#8b5cf6" },
      "achievement2",
    );
    expect(line).toContain("kind: achievement");
    expect(line).toContain('bg: "#8b5cf6"');
    expect(line).toContain("posX: 130"); // 100 + 30
    expect(line).toContain("posY: 230");
    expect(line).toContain("scale: 1.5");
    expect(line).toContain("rotate: 45");
  });

  it("scale 1 / rotate 0 / bg なしなら該当 field を書かない", () => {
    const line = buildDuplicateLine({ kind: "achievement", posX: 0, posY: 0, scale: 1 }, "a1");
    expect(line).not.toContain("scale:");
    expect(line).not.toContain("rotate:");
    expect(line).not.toContain("bg:");
  });

  it("rotate 未指定 (undefined) でも壊れない", () => {
    const line = buildDuplicateLine({ kind: "achievement", posX: 10, posY: 20, scale: 1 }, "a1");
    expect(line).toContain("posX: 40");
    expect(line).not.toContain("rotate:");
  });
});

describe("nextAvailableAlias", () => {
  it("既存 alias と衝突しない番号を返す", () => {
    const src = `actors:
  - achievement1: { kind: achievement }
  - achievement2: { kind: achievement }
`;
    expect(nextAvailableAlias(src, "achievement")).toBe("achievement3");
  });

  it("prefix 衝突で誤判定しない (achievement10 があっても achievement1 は使用済と見なす)", () => {
    // substring 検索の実装は `- achievement1:` を `- achievement10:` の一部として拾えず、
    // achievement1 が空いていると誤判定していた。 行単位の厳密比較で防ぐ。
    const src = `actors:
  - achievement1: { kind: achievement }
  - achievement10: { kind: achievement }
`;
    expect(nextAvailableAlias(src, "achievement")).toBe("achievement2");
  });

  it("quoted alias も使用済として数える", () => {
    const src = `actors:
  - "achievement1": { kind: achievement }
`;
    expect(nextAvailableAlias(src, "achievement")).toBe("achievement2");
  });

  it("空き番号がなければ連番を進める", () => {
    const src = `actors:
  - a1: { kind: achievement }
  - a2: { kind: achievement }
  - a3: { kind: achievement }
`;
    expect(nextAvailableAlias(src, "a")).toBe("a4");
  });
});

describe("collectActorAliases", () => {
  it("short form / inline map / quoted の 3 形式を集める", () => {
    const src = `actors:
  - Client
  - API: { posX: 1 }
  - "My Part": { kind: achievement }
`;
    const aliases = collectActorAliases(src);
    expect(aliases).toContain("Client");
    expect(aliases).toContain("API");
    expect(aliases).toContain("My Part");
  });

  it("flow 行の矢印は alias として拾わない形で name を切る", () => {
    const src = `flow:
  - Client -> API: "req"
`;
    const aliases = collectActorAliases(src);
    // `Client -> API` が 1 entry として入る (actors block でないため実害はない)
    expect(aliases[0]).toBe("Client -> API");
  });
});

describe("aliasBaseName", () => {
  it("末尾連番を落とす", () => {
    expect(aliasBaseName("achievement3")).toBe("achievement");
    expect(aliasBaseName("arcgauge12")).toBe("arcgauge");
  });

  it("連番がなければそのまま", () => {
    expect(aliasBaseName("client")).toBe("client");
  });

  it("数字のみの alias は空にせず元を返す", () => {
    expect(aliasBaseName("123")).toBe("123");
  });
});

describe("removeActorLine (CAR-2158 Round 3 = 削除 3 経路の共通化)", () => {
  it("inline map 行を削除する", () => {
    const src = `actors:
  - a: { kind: achievement, posX: 1 }
  - b: { kind: achievement, posX: 2 }
`;
    const out = removeActorLine(src, "a");
    expect(out).not.toContain("- a:");
    expect(out).toContain("- b:");
  });

  it("nested map を持つ行も削除できる (旧 [^}]* は最初の } で打ち切って消せない)", () => {
    const src = `actors:
  - a: { kind: achievement, nodes: { header: { posX: 1 } }, posX: 10 }
  - b: { kind: achievement }
`;
    const out = removeActorLine(src, "a");
    expect(out).not.toContain("- a:");
    expect(out).toContain("- b:");
  });

  it("quoted alias も削除できる", () => {
    const src = `actors:
  - "my part": { kind: achievement }
  - b: { kind: achievement }
`;
    const out = removeActorLine(src, "my part");
    expect(out).not.toContain("my part");
    expect(out).toContain("- b:");
  });

  it("short form (inline map なし) も削除できる", () => {
    const src = `actors:
  - Client
  - API
`;
    const out = removeActorLine(src, "Client");
    expect(out).not.toMatch(/^\s*- Client\s*$/m);
    expect(out).toContain("- API");
  });

  it("存在しない alias では何も変わらない", () => {
    const src = `actors:
  - a: { kind: achievement }
`;
    expect(removeActorLine(src, "zzz")).toBe(src);
  });
});

describe("removeActorLine の改行処理 (CAR-2158 Round 4 CRITICAL detector)", () => {
  it("CRLF の DSL で前後の行を結合しない", () => {
    // `\s` は改行を含むため、 CRLF の `\r` を跨いで隣接行を巻き込む。
    const src = 'actors:\r\n  - a: { kind: achievement }\r\n  - b: { kind: achievement }\r\n';
    const out = removeActorLine(src, "a");
    expect(out).toBe('actors:\r\n  - b: { kind: achievement }\r\n');
  });

  it("CRLF の short form でも行構造を保つ", () => {
    const src = 'actors:\r\n  - Client\r\n  - API\r\n';
    const out = removeActorLine(src, "Client");
    expect(out).toBe('actors:\r\n  - API\r\n');
  });

  it("末尾改行なしの最終行も削除できる", () => {
    const src = 'actors:\n  - a: { kind: achievement }';
    const out = removeActorLine(src, "a");
    expect(out).toBe("actors:\n");
  });
});
