import { describe, it, expect } from "vitest";
import { parseTextDsl } from "../src/parser";
import { NODE_KIND_ALIAS, TONE_ALIAS } from "../src/keywords";

/**
 * DSL の自然言語 alias 契約 (「関数」→function / 「成功」→success 等) を、
 * 各 alias entry が parseTextDsl 経由で正しく resolve されるか end-to-end で検証する。
 * alias 表は parser 内 inline 消費のため、 個別 entry の resolve は未検証だった。
 * broken / 削除された alias entry が author DSL を silent break するのを防ぐ。
 */

function parseKind(alias: string): string | undefined {
  const src = `タイトル: T\n種類: sequence\n登場人物:\n  - N (${alias})\n流れ:\n  1. N → N: ok`;
  const r = parseTextDsl(src);
  return r.ok ? r.doc.actors[0]?.kind : undefined;
}

function parseTone(alias: string): string | undefined {
  const src = `タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: ok (${alias})`;
  const r = parseTextDsl(src);
  return r.ok ? r.doc.flow[0]?.tone : undefined;
}

describe("NODE_KIND_ALIAS — 各 kind alias が parser で解決される", () => {
  it("alias 表は 1 件以上", () => {
    expect(Object.keys(NODE_KIND_ALIAS).length).toBeGreaterThan(0);
  });

  for (const [alias, expected] of Object.entries(NODE_KIND_ALIAS)) {
    it(`"${alias}" → kind "${expected}"`, () => {
      expect(parseKind(alias)).toBe(expected);
    });
  }

  it("日本語 alias 「関数」 は function に解決", () => {
    expect(parseKind("関数")).toBe("function");
  });

  it("未定義 kind は alias 解決されず素通し (partId 経路 or そのまま)", () => {
    // NODE_KIND_ALIAS に無い値は fallback、 alias 表の contract 外なので kind は "関数" にならない
    expect(parseKind("関数")).not.toBe("関数");
  });
});

describe("TONE_ALIAS — 各 tone alias が parser で解決される", () => {
  it("alias 表は 1 件以上", () => {
    expect(Object.keys(TONE_ALIAS).length).toBeGreaterThan(0);
  });

  for (const [alias, expected] of Object.entries(TONE_ALIAS)) {
    it(`"${alias}" → tone "${expected}"`, () => {
      expect(parseTone(alias)).toBe(expected);
    });
  }

  it("日本語 alias 「成功」 は success に解決", () => {
    expect(parseTone("成功")).toBe("success");
  });

  it("tone alias に一致しない () は tone にならず sub 扱い", () => {
    const src = `タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: ok (補足)`;
    const r = parseTextDsl(src);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.doc.flow[0]?.tone).toBeUndefined();
      expect(r.doc.flow[0]?.sub).toBe("補足");
    }
  });
});
