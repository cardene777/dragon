import { describe, it, expect } from "vitest";
import { replaceTextInDsl } from "./text-edit-replace";

describe("replaceTextInDsl", () => {
  it("1 箇所のみ出現 = そのまま replace", () => {
    const src = 'title: "ログイン API"\ntype: sequence';
    const result = replaceTextInDsl(src, "ログイン API", "新 title");
    expect(result).toBe('title: "新 title"\ntype: sequence');
  });

  it("actors block scope 内 1 箇所 replace = flow / animation の Client は保持 (MAJOR 1 regression detector)", () => {
    const src = `actors:
  - Client
  - API
flow:
  - Client -> API: "ログイン要求"
  - API -> Client: "認証成功"
animation:
  focus: [Client, API, "Client -> API"]`;
    const result = replaceTextInDsl(src, "Client", "Browser");
    // actors block 内の Client のみ Browser に、 flow / animation の Client は保持
    expect(result).toContain("- Browser\n  - API");
    // flow 行の 2 つの Client は保持
    expect(result).toContain("Client -> API"); // flow 側
    expect(result).toContain("API -> Client"); // flow 側
    expect(result).toContain("focus: [Client, API,"); // animation 側
    // 期待 = actors 側 1 個だけ Browser 化、 flow 2 個 + animation focus 2 個 (Client と "Client -> API") = Client 4 個保持
    const clientCount = result.split("Client").length - 1;
    expect(clientCount).toBe(4);
    const browserCount = result.split("Browser").length - 1;
    expect(browserCount).toBe(1);
  });

  it("flow が actors より前にあっても actors block 内の 1 箇所のみ replace (順序依存 regression detector)", () => {
    const src = `flow:
  - Client -> API: "ログイン要求"
actors:
  - Client
  - API`;
    const result = replaceTextInDsl(src, "Client", "Browser");
    // 期待 = flow 内 Client 保持、 actors 内 Client → Browser
    expect(result).toContain("- Client -> API"); // flow 側は保持
    expect(result).toContain("  - Browser"); // actors 側は書換
    const clientCount = result.split("Client").length - 1;
    const browserCount = result.split("Browser").length - 1;
    expect(clientCount).toBe(1);
    expect(browserCount).toBe(1);
  });

  it("複数箇所 + quoted pattern 1 箇所 = quoted のみ replace (判定段階 3 の直接 verify)", () => {
    // Client は 2 箇所 (flow line + focus line)、 "ログイン要求" は 1 箇所 (quoted)、
    // actors block なし = 判定段階 2 skip、 quoted 段階 (段階 3) 経路を通ることを確認
    const src = `flow:
  - Client -> API: "ログイン要求"
  - Client -> DB: "その他 要求"
animation:
  focus: [Client]`;
    // "ログイン要求" は 1 箇所のみ → 段階 1 (単一 occurrence) で replace
    const result = replaceTextInDsl(src, "ログイン要求", "新 要求");
    expect(result).toContain('"新 要求"');
    expect(result).not.toContain("ログイン要求");
  });

  it("複数箇所 quoted で 1 個だけの場合 quoted 経路 replace (段階 3 直接 verify)", () => {
    // "foo" が quoted 1 箇所 + foo が bare 1 箇所 = 全体 2 occurrence、 actors なし
    // 段階 1 skip (2 occurrence)、 段階 2 skip (actors 不在)、 段階 3 で quoted 1 箇所 replace
    const src = `flow:
  - a -> b: "foo"
title: foo`;
    const result = replaceTextInDsl(src, "foo", "bar");
    // 期待 = quoted の foo → bar、 bare の foo (title:) は保持
    expect(result).toContain('"bar"');
    expect(result).toContain("title: foo");
  });

  it("複数箇所 + どの pattern も一意に決まらない = 最初の 1 箇所のみ replace", () => {
    const src = `line1: Client
line2: Client
line3: Client`;
    const result = replaceTextInDsl(src, "Client", "Browser");
    // 最初の Client のみ Browser、 残 2 個は Client 保持
    expect(result.split("Client").length - 1).toBe(2);
    expect(result.split("Browser").length - 1).toBe(1);
    expect(result.startsWith("line1: Browser")).toBe(true);
  });

  it("original が 0 箇所 = 変更なし", () => {
    const src = "title: Foo";
    const result = replaceTextInDsl(src, "Bar", "Baz");
    expect(result).toBe(src);
  });

  it("newText が空文字 = 変更なし (safety guard)", () => {
    const src = "title: Foo";
    const result = replaceTextInDsl(src, "Foo", "   ");
    expect(result).toBe(src);
  });

  it("newText === originalText = 変更なし (no-op)", () => {
    const src = "title: Foo";
    const result = replaceTextInDsl(src, "Foo", "Foo");
    expect(result).toBe(src);
  });

  it("regex メタ文字を含む original が安全に escape される", () => {
    const src = "value: $1.00 (special)";
    const result = replaceTextInDsl(src, "$1.00", "$2.00");
    expect(result).toBe("value: $2.00 (special)");
  });

  it("newText に $ 展開 token を含んでも literal 保持 (MAJOR 2 regression detector)", () => {
    // JavaScript String.replace の replacement string 展開 (`$&`, `$$`, `$1`〜`$99`) が
    // 起きたら user 入力 literal が破綻する。 段階 1 (単一 occurrence) 経路の verify
    const src = "title: original_text";
    const result = replaceTextInDsl(src, "original_text", "$1$2$&$$$'");
    expect(result).toBe("title: $1$2$&$$$'");
  });

  it("actors block replace で newText に $ token を含んでも literal 保持 (段階 2 の $ escape verify)", () => {
    const src = `actors:
  - Client
  - API
flow:
  - Client -> API: "x"`;
    const result = replaceTextInDsl(src, "Client", "$&_special");
    // 期待 = actors 側の Client → $&_special (literal)、 flow 側の Client は保持
    expect(result).toContain("- $&_special\n  - API");
    expect(result).toContain("Client -> API");
  });

  it("quoted replace で newText に $ token を含んでも literal 保持 (段階 3 の $ escape verify)", () => {
    const src = `flow:
  - a -> b: "foo"
title: foo`;
    const result = replaceTextInDsl(src, "foo", "$$$1$&");
    expect(result).toContain('"$$$1$&"');
    expect(result).toContain("title: foo");
  });

  it("fallback replace で newText に $ token を含んでも literal 保持 (段階 4 の $ escape verify)", () => {
    // 全 fallback (段階 4) 経路 = actors なし + quoted 一意なし
    const src = `line1: Client
line2: Client
line3: Client`;
    const result = replaceTextInDsl(src, "Client", "$$_expanded");
    // 期待 = 最初の Client → $$_expanded (literal $$)、 残 Client は保持
    expect(result.startsWith("line1: $$_expanded")).toBe(true);
    expect(result).toContain("line2: Client");
    expect(result).toContain("line3: Client");
  });
});
