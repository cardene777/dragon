/**
 * 画面で色分けするための分解器の検証 (#1310)。
 *
 * 記述を見せる場所が 5 つあり、色の割り当てが 3 通りに割れていた (カタログ 0 色 /
 * エディタ 3 色 / ホームは手書き 5 役)。 分解器を 1 つにして全箇所が共有する。
 *
 * ## 何を測るか
 *
 * | 向き | 見ること |
 * |---|---|
 * | 語彙 | `keywords.ts` の全語が分解できる (写しを持たない) |
 * | 覆い | 返す区間を連結すると元の本文に戻る (文字が消えない) |
 * | 重なり | 返す並びが互いに重ならない (使う側が解決を持たなくてよい) |
 */
import { describe, it, expect } from "vitest";
import { EDGE_STYLES } from "@cardenelabs/cdl";
import { TONES } from "@cardenelabs/cdl";
import { 記法を分解する, JSONを分解する, 区間に広げる, type トークン } from "../src/tokenize";
import { TONE_ALIAS, ARROW_PATTERNS } from "../src/keywords";
import { NODE_KIND_VALID } from "../src/v05/parser";

const 種類 = (src: string, t: トークン): string => `${t.種類}:${src.slice(t.開始, t.終わり)}`;
const 一覧 = (src: string): string[] => 記法を分解する(src).map((t) => 種類(src, t));

describe("分解器が本文を壊さない (#1310)", () => {
  const 見本 = [
    `title: "ログイン"`,
    `type: sequence`,
    ``,
    `# 注記の行`,
    `actors:`,
    `  - Web: service "本体"`,
    `  - DB: database`,
    ``,
    `states:`,
    `  bal: 100`,
    ``,
    `flow:`,
    `  - Web -> DB: "検索 {bal}" (success)`,
    `  - DB -> Web: "結果" (失敗, dotted-flow)`,
  ].join("\n");

  it("区間を連結すると元の本文に戻る", () => {
    const 区間 = 区間に広げる(見本, 記法を分解する(見本));
    expect(区間.length, "区間が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(区間.map((s) => s.文字).join("")).toBe(見本);
  });

  it("返す並びは重ならず、開始位置の昇順", () => {
    const ts = 記法を分解する(見本);
    expect(ts.length, "1 つも分解できていない (検査が空振りしている)").toBeGreaterThan(0);
    for (let i = 1; i < ts.length; i += 1) {
      expect(ts[i]!.開始, `${i} 番目が前と重なる`).toBeGreaterThanOrEqual(ts[i - 1]!.終わり);
    }
    for (const t of ts) expect(t.終わり, "空の区間がある").toBeGreaterThan(t.開始);
  });

  it("JSON でも区間を連結すると元に戻る", () => {
    const src = JSON.stringify(
      { title: "t", type: "flow", actors: [{ name: "A", tone: "success" }], flow: [] },
      null,
      2,
    );
    const 区間 = 区間に広げる(src, JSONを分解する(src));
    expect(区間.length, "区間が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(区間.map((s) => s.文字).join("")).toBe(src);
  });
});

describe("語彙は keywords.ts から導く (#1310)", () => {
  it("正規の色名がすべて色名として分解される", () => {
    let 測れた = 0;
    const 落ちた: string[] = [];
    for (const tone of TONES) {
      測れた += 1;
      const src = `flow:\n  - A -> B: "x" (${tone})`;
      const t = 記法を分解する(src).find((x) => src.slice(x.開始, x.終わり) === tone);
      if (t?.種類 !== "色名" || t.色 !== tone) 落ちた.push(`${tone} → ${t?.種類}/${t?.色}`);
    }
    expect(測れた, "色名を 1 つも測れていない (検査が空振りしている)").toBe(TONES.length);
    expect(落ちた, "色名として分解できない語がある").toEqual([]);
  });

  it("色名の別名がすべて解決後の名前を持つ", () => {
    let 測れた = 0;
    const 落ちた: string[] = [];
    for (const [別名, 解決後] of Object.entries(TONE_ALIAS)) {
      測れた += 1;
      const src = `flow:\n  - A -> B: "x" (${別名})`;
      const t = 記法を分解する(src).find((x) => src.slice(x.開始, x.終わり) === 別名);
      if (t?.種類 !== "色名" || t.色 !== 解決後) 落ちた.push(`${別名} → ${t?.種類}/${t?.色}`);
    }
    expect(測れた, "別名を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(落ちた, "別名を解決できていない").toEqual([]);
  });

  it("矢印の書き方がすべて矢印として分解される", () => {
    const 書き方 = [...new Set(ARROW_PATTERNS)];
    let 測れた = 0;
    const 落ちた: string[] = [];
    for (const 記号 of 書き方) {
      測れた += 1;
      const src = `flow:\n  - A ${記号} B: "x"`;
      const ts = 記法を分解する(src).filter((x) => x.種類 === "矢印");
      // 長い書き方が短い書き方に食われていないこと = 1 本の矢印は 1 つに分解される
      if (ts.length !== 1 || src.slice(ts[0]!.開始, ts[0]!.終わり) !== 記号) {
        落ちた.push(`${記号} → ${ts.map((x) => src.slice(x.開始, x.終わり)).join("|")}`);
      }
    }
    expect(測れた, "矢印を 1 つも測れていない (検査が空振りしている)").toBe(書き方.length);
    expect(落ちた, "矢印として分解できない書き方がある").toEqual([]);
  });

  it("線種の一覧が描画側と一致する", () => {
    // 分解器も parser も描画側 (`EDGE_STYLES`) から導く (#1466)。 手で並べていた頃は
    // 3 箇所のうち 2 箇所が古いままになっていた
    const 通る = (語: string): boolean => {
      const src = `flow:\n  - A -> B: "x" (${語})`;
      return 記法を分解する(src).some(
        (t) => t.種類 === "色名" && src.slice(t.開始, t.終わり) === 語,
      );
    };
    let 測れた = 0;
    for (const 語 of EDGE_STYLES) {
      expect(通る(語), `${語} を線種として分解できない`).toBe(true);
      測れた += 1;
    }
    expect(測れた, "線種を 1 つも測れていない (検査が空振りしている)").toBe(EDGE_STYLES.length);
    expect(通る("dotted"), "描画側に無い語を分解している").toBe(false);
  });

  it("箱の種類は色分けしない (箱の名前と衝突するため)", () => {
    // 受理する 108 種には `user` / `api` / `actor` / `card` / `state` / `service` が
    // 含まれ、`- User` や `- API` のような普通の名前と衝突する。 語だけでは
    // 「種類として書かれたか」 を判定できないため色分けしない (#1310 review r1-f1)
    const 衝突する語 = ["user", "api", "actor", "card", "state", "service"].filter((w) =>
      NODE_KIND_VALID.has(w),
    );
    expect(衝突する語.length, "衝突する語が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);

    const src = `actors:\n  - User\n  - API: service`;
    const 名前 = 記法を分解する(src).filter((t) => {
      const 語 = src.slice(t.開始, t.終わり);
      return 語 === "User" || 語 === "service";
    });
    expect(名前, "箱の名前や種類に色が付いている").toEqual([]);
  });
});

describe("記法の 5 種を切り分ける (#1310)", () => {
  it("項目名 / 説明文 / 矢印 / 色名 / 値の参照 が出る", () => {
    const src = `title: "t"\nflow:\n  - Web -> DB: "検索 {bal}" (success)`;
    const 出た = new Set(記法を分解する(src).map((t) => t.種類));
    for (const k of ["項目名", "説明文", "矢印", "色名", "値の参照"] as const) {
      expect(出た, `${k} が 1 つも出ていない`).toContain(k);
    }
  });

  it("説明文の中の値の参照は別の区間になる", () => {
    // 割らないと `value: "{count}"` の参照に色を当てられない
    const src = `actors:\n  - A: { value: "{count}" }`;
    const ts = 記法を分解する(src);
    const 参照 = ts.find((t) => t.種類 === "値の参照");
    expect(参照, "参照が分解されていない").toBeDefined();
    expect(src.slice(参照!.開始, 参照!.終わり)).toBe("{count}");
    // 参照の前後が説明文として残る (引用符が消えない)
    expect(区間に広げる(src, ts).map((s) => s.文字).join("")).toBe(src);
  });

  it("注記は行ごと 1 つになる", () => {
    const src = `# これは注記 -> success\ntitle: "t"`;
    const ts = 記法を分解する(src);
    expect(ts[0]?.種類).toBe("注記");
    // 注記の中の矢印や色名を拾わない
    expect(ts.filter((t) => t.開始 < src.indexOf("\n")).map((t) => t.種類)).toEqual(["注記"]);
  });

  it("色番号は注記にしない", () => {
    // `#` で始まる行だけを注記にする。 色番号は行の途中に出る
    const src = `actors:\n  - A: { 色: "#f59e0b" }`;
    expect(記法を分解する(src).some((t) => t.種類 === "注記")).toBe(false);
  });

  it("引用符の中の矢印と色名は拾わない", () => {
    const src = `flow:\n  - A -> B: "success -> の話"`;
    const 語 = 一覧(src);
    // 引用符の中は説明文 1 つにまとまる (中の success / -> を別に拾わない)
    expect(語.filter((x) => x.startsWith("色名:"))).toEqual([]);
    expect(語.filter((x) => x.startsWith("矢印:")).length, "矢印は行の 1 本だけ").toBe(1);
  });
});

describe("JSON は鍵と文字列を分け、色の欄だけ意味色にする (#1310)", () => {
  const src = `{
  "title": "t",
  "actors": [{ "name": "A", "tone": "success", "subtitle": "success" }]
}`;

  it("鍵は項目名になる", () => {
    const ts = JSONを分解する(src);
    const 鍵 = ts.filter((t) => t.種類 === "項目名").map((t) => src.slice(t.開始, t.終わり));
    expect(鍵.length, "鍵が 1 つも出ていない (検査が空振りしている)").toBeGreaterThan(0);
    for (const k of 鍵) expect(k, `${k} が鍵の形でない`).toMatch(/^"[^"]*"\s*:$/);
  });

  it("tone の値だけ色名になり、同じ語でも別の欄なら説明文のまま", () => {
    const ts = JSONを分解する(src);
    const 色名 = ts.filter((t) => t.種類 === "色名");
    expect(色名.length, "色名が 1 つも出ていない").toBe(1);
    expect(色名[0]?.色).toBe("success");
    // `subtitle` の `"success"` は色名にしない (欄が違えば意味が違う)
    const subtitleの値 = src.lastIndexOf('"success"');
    expect(色名[0]?.開始, "subtitle の値まで色名にしている").not.toBe(subtitleの値);
  });

  it("数値は符号・小数・指数を含めて値として分解する", () => {
    const 数を含むsrc = `{ "zero": 0, "negative": -12.5, "exponent": 1e+3, "text": "42" }`;
    const 値 = JSONを分解する(数を含むsrc)
      .filter((t) => t.種類 === "説明文")
      .map((t) => 数を含むsrc.slice(t.開始, t.終わり));
    expect(値).toEqual(expect.arrayContaining(["0", "-12.5", "1e+3", '"42"']));
    expect(値, "文字列内の数字を別トークンにしている").not.toContain("42");
  });
});
