import { describe, it, expect } from "vitest";
import { replaceTextInDsl } from "./text-edit-replace";

describe("replaceTextInDsl", () => {
  it("1 箇所のみ出現 = そのまま replace", () => {
    const src = 'title: "ログイン API"\ntype: sequence';
    const result = replaceTextInDsl(src, "ログイン API", "新 title");
    expect(result).toBe('title: "新 title"\ntype: sequence');
  });

  it("複数箇所 + actor list yaml pattern 1 箇所 = actor list のみ replace", () => {
    const src = `actors:
  - Client
  - API
flow:
  - Client -> API: "ログイン要求"
  - API -> Client: "認証成功"
animation:
  focus: [Client, API, "Client -> API"]`;
    const result = replaceTextInDsl(src, "Client", "Browser");
    // actor list の Client は Browser に、 flow / animation の Client は保持
    expect(result).toContain("- Browser\n  - API");
    expect(result).toContain("Client -> API"); // flow 側は保持
    expect(result).toContain("API -> Client"); // flow 側は保持
    expect(result).toContain("focus: [Client, API,"); // animation 側は保持
  });

  it("複数箇所 + quoted pattern 1 箇所 = quoted のみ replace", () => {
    const src = `flow:
  - Client -> API: "ログイン要求"
  - Client -> API: "その他 要求"`;
    // "ログイン要求" は 1 箇所のみ → 直接 replace 経路
    const result = replaceTextInDsl(src, "ログイン要求", "新 要求");
    expect(result).toContain('"新 要求"');
    expect(result).not.toContain("ログイン要求");
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
});
