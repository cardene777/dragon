/**
 * 画面の分類名と札に英語が残っていないことの検証 (#1785)。
 *
 * 見本帳の分類名は #1783 で日本語にしたが、見本帳以外の画面には
 * `3 steps` `BUG REPORT` `reproduction` `1 PR = 1 concern` のような英語が残っていた。
 * どれも日本語の見出しのすぐ上か、日本語の説明文のすぐ下に置かれている。
 *
 * **言語の切り替えを足した札を候補から外さない**。 直す時に `{isJa ? "…" : "…"}` の形にすると、
 * 字を直に書いた札しか見ない検査からは候補ごと消える。 消えた分だけ検査は素通りするので、
 * 切り替えの形も拾って日本語の側を見る。
 *
 * 式で書かれていて読めない札は未解決として数え、件数と中身を出す。 いま 1 件あり、
 * 見本帳の分類名 (`PresetDetailPage.tsx` の `{preset.eyebrow}`) で、`presets.test.ts` が見ている。
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** 画面 file の置き場所。 file の一覧は手で並べず、ここから導く */
const 画面の置き場 = fileURLToPath(new URL(".", import.meta.url));

/**
 * 英字のまま残してよい語。 1 語ごとに残す理由を書く。
 *
 * 一覧を広げると英語をそのまま通す抜け道になるため、実際に画面で使う語だけを置く
 * (使っていない語が混ざっていないことも下の検査で見る)。
 */
const 残してよい語: Record<string, string> = {
  SVG: "画像の形式の名前。 日本語の呼び名が無い",
  PR: "変更の取り込み依頼を指す呼び名として定着している",
  ER: "実体と関係の図を指す呼び名。 日本語でも `ER図` と呼ぶ",
  dragon: "この製品の名前",
};

/** 分類名・札・通し番号を表す class。 この 3 つが画面で「見出しの添え字」 の役 */
const 添え字の印 = /eyebrow|-tag|nm-preset-id/;

/** 言語を切り替える書き方。 日本語の側を取り出す */
const 切り替え = /^\{(?:isJa|locale === "ja") \? "([^"]*)" : "[^"]*"\}$/;

interface 添え字 {
  file: string;
  class名: string;
  /** 日本語として読む字。 式で書かれていて読めない時は `null` */
  字: string | null;
  生: string;
}

/** 画面の本文から添え字を拾う。 本番と植え込み対照が同じ関数を使う */
export function 添え字を拾う(src: string, file: string): 添え字[] {
  const out: 添え字[] = [];
  for (const m of src.matchAll(/<(span|div)\s+className="([^"]*)"\s*>([^<]*)<\/\1>/g)) {
    const class名 = m[2]!;
    if (!添え字の印.test(class名)) continue;
    const 生 = m[3]!.trim();
    if (生 === "") continue;
    const 切 = 生.match(切り替え);
    out.push({ file, class名, 字: 切 ? 切[1]! : 生.includes("{") ? null : 生, 生 });
  }
  return out;
}

/** 添え字のうち、残してよい語に無い英字 2 文字以上の語を含むもの */
export function 英語の残る添え字(list: 添え字[]): string[] {
  const out: string[] = [];
  for (const a of list) {
    if (a.字 === null) continue;
    const 語 = [...a.字.matchAll(/[A-Za-z]+/g)].map((m) => m[0]).filter((w) => w.length >= 2);
    const 残り = 語.filter((w) => !(w in 残してよい語));
    if (残り.length > 0) out.push(`${a.file} (${a.class名}): ${a.字} → ${残り.join(", ")}`);
  }
  return out;
}

function 全画面の添え字(): { list: 添え字[]; file数: number } {
  const files = readdirSync(画面の置き場).filter((f) => f.endsWith(".tsx") && !f.includes(".test."));
  const list = files.flatMap((f) => 添え字を拾う(readFileSync(画面の置き場 + f, "utf8"), f));
  return { list, file数: files.length };
}

describe("画面の分類名と札 (#1785)", () => {
  it("拾えた添え字の内訳を出す", () => {
    const { list, file数 } = 全画面の添え字();
    expect(file数, "画面 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(5);
    const 読めた = list.filter((a) => a.字 !== null);
    const 未解決 = list.filter((a) => a.字 === null);
    // 内訳を出さないと、候補から消えた札が「該当なし」 と同じに見える
    console.log(
      `[添え字] file=${file数} 拾えた=${list.length} 読めた=${読めた.length} 未解決=${未解決.length}` +
        (未解決.length > 0 ? `\n  未解決: ${未解決.map((a) => `${a.file}: ${a.生}`).join(" / ")}` : ""),
    );
    expect(list.length, "添え字を 1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(20);
  });

  it("分類名と札に英語の語が残っていない", () => {
    const { list } = 全画面の添え字();
    const 残る = 英語の残る添え字(list);
    expect(残る, `英語の語が残る添え字:\n${残る.join("\n")}`).toEqual([]);
  });

  it("残してよい語が実際に画面で使われている", () => {
    // 使わない語を並べておくと、一覧がそのまま英語を通す抜け道になる
    const { list } = 全画面の添え字();
    const 使った = new Set(
      list.flatMap((a) => [...(a.字 ?? "").matchAll(/[A-Za-z]+/g)].map((m) => m[0])),
    );
    const 使わない = Object.keys(残してよい語).filter((w) => !使った.has(w));
    expect(使わない, `残してよい語に挙げたが画面で使っていない: ${使わない.join(", ")}`).toEqual([]);
  });

  it("英語の添え字を拾える (植え込み対照)", () => {
    const 元 = `<span className="nm-eyebrow">参加のしかた</span>`;
    expect(英語の残る添え字(添え字を拾う(元, "元.tsx")), "土台に英語が混ざっている").toEqual([]);
    expect(添え字を拾う(元, "元.tsx"), "土台から添え字を拾えない").toHaveLength(1);
    const 英語 = `<span className="nm-eyebrow">BUG REPORT</span>`;
    expect(英語の残る添え字(添え字を拾う(英語, "植え.tsx"))).toHaveLength(1);
    // 残してよい語は拾わない
    const 残す = `<span className="nm-preset-tag">1 PR = 1 つの主題</span>`;
    expect(英語の残る添え字(添え字を拾う(残す, "残す.tsx"))).toEqual([]);
  });

  it("言語を切り替える形でも日本語の側を見る (植え込み対照)", () => {
    // ここが抜けると、切り替えを足した札が候補から消えて検査が素通りする
    const 直した = `<span className="eyebrow">{isJa ? "3 手順" : "3 steps"}</span>`;
    expect(添え字を拾う(直した, "切替.tsx")[0]?.字, "日本語の側を取り出せない").toBe("3 手順");
    expect(英語の残る添え字(添え字を拾う(直した, "切替.tsx"))).toEqual([]);
    const 直していない = `<span className="eyebrow">{isJa ? "use case" : "use case"}</span>`;
    expect(英語の残る添え字(添え字を拾う(直していない, "切替.tsx"))).toHaveLength(1);
    // 読めない式は英語の判定に混ぜず、未解決として数える
    const 式 = `<span className="nm-preset-tag">{TAG_NAME}</span>`;
    expect(添え字を拾う(式, "式.tsx")[0]?.字, "読めない式を字として読んでいる").toBeNull();
    expect(英語の残る添え字(添え字を拾う(式, "式.tsx"))).toEqual([]);
  });
});
