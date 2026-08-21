/**
 * 記法 v0.5 が受ける日本語の範囲の検証 (#1301)。
 *
 * `keywords.ts` は「日本語・英語両対応」 を宣言しているが、v0.5 が実際に受けるのは
 * **その一部だけ**だった。 受けない語は誤りを返さず黙って消える。
 *
 * | 領域 | v0.5 | 修正前 |
 * |---|---|---|
 * | 箱の欄 8 語 (`種類` 等) | 受ける | 効く |
 * | 矢印の色名 5 語 (`成功` 等) | 受ける | 効く |
 * | 段の項目名 5 語 (`強調` 等) | 受けない | **黙って消える** |
 * | 箱の種類の値 4 語 (`人` 等) | 受けない | **黙って消える** (`actor` に潰れる) |
 *
 * 範囲は今受けている語に固定し (広げも狭めもしない)、範囲外は行番号付きの誤りにする。
 * 「広げない」 と「黙って消える」 は両立しない。
 */
import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { NODE_KIND_ALIAS, TONE_ALIAS, ANIM_SUBKEYS } from "../src/keywords";

const 頭 = `title: "t"\ntype: flow\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "x"\n`;

const 読む = (src: string) => parseTextDslV05(src);

/** 段に項目を 1 つ書いた本文 */
const 段に書く = (欄: string, 値: string) =>
  `${頭}animation:\n  - step: "s1" 1.2s\n    ${欄}: ${値}\n`;

/** 箱に種類を書いた本文 */
const 種類を書く = (値: string) =>
  `title: "t"\ntype: flow\nactors:\n  - A: { kind: ${値} }\n  - B\nflow:\n  - A -> B: "x"\n`;

/**
 * v0.5 が受けない日本語。 **`keywords.ts` の表から導く** = 表に語が増えた時、
 * 検査だけが古くなることを防ぐ。
 *
 * 段の項目名は `ANIM_SUBKEYS` の日本語、種類の値は `NODE_KIND_ALIAS` の日本語。
 */
const 範囲外の段の項目 = Object.values(ANIM_SUBKEYS)
  .flatMap((v) => [...v])
  .filter((k) => /[^\x00-\x7F]/.test(k));
const 範囲外の種類の値 = Object.keys(NODE_KIND_ALIAS).filter((k) => /[^\x00-\x7F]/.test(k));

describe("範囲外の日本語は誤りとして知らせる (#1301)", () => {
  it("範囲外の語を集められている", () => {
    // 集められていなければ、以下の走査は 1 件も回らずに通る
    expect(範囲外の段の項目.length, "段の項目名が空 (検査が空振りしている)").toBeGreaterThan(0);
    expect(範囲外の種類の値.length, "種類の値が空 (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("段の項目名は誤りになる", () => {
    const 黙って消える: string[] = [];
    let 測れた = 0;
    for (const 欄 of 範囲外の段の項目) {
      測れた += 1;
      // `ステップ` は段そのものの名前で、書く場所が違う (`- ステップ:` の形) ため
      // 段の項目としては他の語と同じく知らない項目になる
      const r = 読む(段に書く(欄, 欄 === "強調" ? "[A]" : '"x"'));
      if (r.ok) 黙って消える.push(欄);
    }
    expect(測れた, "段の項目名を 1 つも測れていない (検査が空振りしている)").toBe(
      範囲外の段の項目.length,
    );
    expect(黙って消える, "段の項目名が誤りにならず黙って消える").toEqual([]);
  });

  it("段の項目名の誤りは英語の名前を勧める", () => {
    const r = 読む(段に書く("強調", "[A]"));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const e = r.errors.find((x) => x.message.includes("強調"));
    expect(e?.hint, "英語の名前を勧めていない").toContain("focus");
  });

  it("箱の種類の値は誤りになる", () => {
    const 黙って消える: string[] = [];
    let 測れた = 0;
    for (const 値 of 範囲外の種類の値) {
      測れた += 1;
      if (読む(種類を書く(値)).ok) 黙って消える.push(値);
    }
    expect(測れた, "種類の値を 1 つも測れていない (検査が空振りしている)").toBe(
      範囲外の種類の値.length,
    );
    expect(黙って消える, "種類の値が誤りにならず黙って消える").toEqual([]);
  });

  it("箱の種類の誤りは英語の名前を勧める", () => {
    const r = 読む(種類を書く("人"));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const e = r.errors.find((x) => x.message.includes("人"));
    expect(e?.hint, "英語の名前を勧めていない").toContain("actor");
  });

  it("見本 (parts) の名前は引き続き受ける (対照)", () => {
    // 種類の値を誤りにする判定が、見本の名前まで巻き込んでいないことを見る
    const r = 読む(種類を書く("arc-gauge"));
    expect(r.ok, "見本の名前が誤りになっている").toBe(true);
    if (!r.ok) return;
    expect(r.doc.actors[0]?.partId).toBe("arc-gauge");
  });
});

describe("範囲内の日本語は引き続き効く (#1301)", () => {
  /** 箱の欄の日本語と、その値 */
  const 箱の欄: Record<string, string> = {
    種類: "service",
    補足: '"ほそく"',
    値: '"42"',
    行: "[ア, イ]",
    位置: "300,200",
    大きさ: "400,200",
    色: "success",
  };

  it("箱の欄の日本語が効く", () => {
    const 効かない: string[] = [];
    let 測れた = 0;
    for (const [欄, 値] of Object.entries(箱の欄)) {
      測れた += 1;
      const src = `title: "t"\ntype: flow\nactors:\n  - A:\n      ${欄}: ${値}\n  - B\nflow:\n  - A -> B: "x"\n`;
      const r = 読む(src);
      if (!r.ok) 効かない.push(`${欄}: 誤りになる`);
    }
    expect(測れた, "箱の欄を 1 つも測れていない (検査が空振りしている)").toBe(
      Object.keys(箱の欄).length,
    );
    expect(効かない, "受けるはずの日本語が誤りになる").toEqual([]);
  });

  it("矢印の色名の日本語が効く", () => {
    const 効かない: string[] = [];
    const 色名 = Object.keys(TONE_ALIAS).filter((k) => /[^\x00-\x7F]/.test(k));
    expect(色名.length, "色名が空 (検査が空振りしている)").toBeGreaterThan(0);
    for (const 色 of 色名) {
      const r = 読む(
        `title: "t"\ntype: flow\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "x" (${色})\n`,
      );
      if (!r.ok || r.doc.flow[0]?.tone === undefined) 効かない.push(色);
    }
    expect(効かない, "受けるはずの色名が効かない").toEqual([]);
  });
});

describe("書き方で日本語だけが落ちない (#1301)", () => {
  /**
   * 英語が中括弧で読める欄の日本語別名。
   *
   * `位置` / `大きさ` / `色` は英語側 (`pos` / `size` / `color`) も中括弧では読めないため
   * ここに載せない = **英語で出来ないことを日本語で出来るようにはしない**。
   */
  const 別名 = { 種類: "kind", 補足: "subtitle", 値: "value", 行: "rows" } as const;

  it("中括弧の形で日本語と英語が同じ結果になる", () => {
    const 食い違い: string[] = [];
    let 測れた = 0;
    for (const [日, 英] of Object.entries(別名)) {
      測れた += 1;
      const 値 = 英 === "kind" ? "service" : 英 === "rows" ? "[ア, イ]" : '"x"';
      const 組む = (k: string) =>
        `title: "t"\ntype: flow\nactors:\n  - A: { ${k}: ${値} }\n  - B\nflow:\n  - A -> B: "x"\n`;
      const a = 読む(組む(日));
      const b = 読む(組む(英));
      if (!a.ok) {
        食い違い.push(`${日}: 誤りになる (${英} は通る)`);
        continue;
      }
      if (!b.ok) continue;
      const 落とす = (x: typeof a) =>
        x.ok ? JSON.stringify({ ...x.doc.actors[0], pos: undefined }) : "ERR";
      if (落とす(a) !== 落とす(b)) 食い違い.push(`${日}: ${英} と別の箱になる`);
    }
    expect(測れた, "別名を 1 つも測れていない (検査が空振りしている)").toBe(
      Object.keys(別名).length,
    );
    expect(食い違い, "中括弧の形で日本語だけが落ちる").toEqual([]);
  });

  it("英語が中括弧で読めない欄は日本語でも読めない (対照)", () => {
    // 英語で出来ないことを日本語で出来るようにしていないことを見る
    for (const [日, 英] of [
      ["位置", "pos"],
      ["大きさ", "size"],
    ] as const) {
      const 組む = (k: string, v: string) =>
        `title: "t"\ntype: flow\nactors:\n  - A: { ${k}: ${v} }\n  - B\nflow:\n  - A -> B: "x"\n`;
      expect(読む(組む(英, "300,200")).ok, `${英} が中括弧で読めている`).toBe(false);
      expect(読む(組む(日, "300,200")).ok, `${日} だけが中括弧で読めている`).toBe(false);
    }
  });
});
