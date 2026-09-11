/**
 * 画面に出る字に英語が残っていないことの検証 (#1785 / #1787)。
 *
 * 2 つの役を見る。
 *
 * | 役 | 中身 | 直した Issue |
 * |---|---|---|
 * | 分類名と札 | 見出しの上の前置き、札、通し番号 | #1785 |
 * | 日本語の文 | 説明文、釦の字、読み上げの字、知らせの字 | #1787 |
 *
 * 残してよい語の一覧は 2 つの役で 1 つだけ持つ。 役ごとに分けると片方だけ直して食い違う。
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

/** ひらがな・カタカナ・漢字 */
const 日本語の字 = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/**
 * 英字のまま残してよい語。 1 語ごとに残す理由を書く。
 *
 * 一覧を広げると英語をそのまま通す抜け道になるため、実際に画面で使う語だけを置く
 * (使っていない語が混ざっていないことも下の検査で見る)。
 */
const 残してよい語: Record<string, string> = {
  dragon: "この製品の名前",
  GitHub: "起票と取り込み依頼を受け付けている場所の名前",
  Mermaid: "別の記法の名前",
  MIT: "ライセンスの名前",
  SVG: "画像の形式の名前。 日本語の呼び名が無い",
  YAML: "記法の形式の名前",
  JSON: "記法の形式の名前",
  API: "定着した略語",
  URL: "定着した略語",
  ID: "定着した略語",
  LLM: "大きな言語モデルを指す定着した略語",
  PR: "変更の取り込み依頼を指す呼び名として定着している",
  Issue: "GitHub で起票したものの呼び名",
  ER: "実体と関係の図を指す呼び名。 日本語でも `ER図` と呼ぶ",
  type: "記法の項目の名前。 画面に出す記法と同じ綴りで書く必要がある",
};

/** file 名 (`CONTRIBUTING.md`)。 語に割らずそのまま通す */
const file名 = /[A-Za-z][A-Za-z0-9_.-]*\.(?:md|json|ts|tsx|yml|yaml|svg|png)\b/g;
/**
 * 斜線でつないだ名前 (`/editor` / `feature/<番号>-<短い説明>`)。 同じくそのまま通す。
 *
 * 読み手が画面のとおりに打ち込む相手なので、訳すと打てなくなる。
 * 語の区切りに使う斜線 (`不具合 / 提案` のように前後に空白がある形) は当たらない。
 */
const 斜線を含む名 = /[A-Za-z0-9_.-]*\/[^\s]*/g;

/** 字のうち、残してよい語に無い英字 2 文字以上の語。 2 つの役が同じ関数を使う */
export function 残る英単語(字: string): string[] {
  const 素 = 字.replace(file名, " ").replace(斜線を含む名, " ");
  return [...素.matchAll(/[A-Za-z]+/g)]
    .map((m) => m[0])
    .filter((w) => w.length >= 2 && !(w in 残してよい語));
}

// ─── 役 1 = 分類名と札 (#1785) ───

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

/** 添え字のうち、英語の語が残っているもの */
export function 英語の残る添え字(list: 添え字[]): string[] {
  const out: string[] = [];
  for (const a of list) {
    if (a.字 === null) continue;
    const 残り = 残る英単語(a.字);
    if (残り.length > 0) out.push(`${a.file} (${a.class名}): ${a.字} → ${残り.join(", ")}`);
  }
  return out;
}

// ─── 役 2 = 日本語の文 (#1787) ───

/**
 * コメントと見本のコードを外す。
 *
 * どちらも画面に出ない字で、英語が入っていて当たり前。 外さないと検査が常に落ちる。
 * 逆引用符の塊を先にではなく後に外すのは、コメントの中に逆引用符が入っているため
 * (先に外すと対が崩れてコメントを外し損ねる)。
 */
export function コメントと見本を外す(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/gm, "$1")
    .replace(/`[^`]*`/g, " ");
}

/**
 * 画面に出る日本語の文を拾う。
 *
 * **class の一覧を手で並べない**。 並べた時の数が上限になり、後から足した文が無防備に増える。
 * 中身から導く = 日本語を含む字はすべて画面に出る文とみなす。
 */
export function 日本語の文を拾う(src: string): { 文: string[]; コード風: number } {
  const s = コメントと見本を外す(src);
  const 素: string[] = [];
  for (const m of s.matchAll(/>([^<>{}]+)</g)) 素.push(m[1]!.trim());
  for (const m of s.matchAll(/"([^"\\\n]*)"/g)) 素.push(m[1]!.trim());
  const 日本語を含む = 素.filter((t) => 日本語の字.test(t));
  // 型の指定 (`useState<string | null>(null)`) が `>` と `<` に挟まれて拾われる。
  // 打ち終わりか代入を含む字はコードとみなして外し、外した件数を出す
  const 文 = 日本語を含む.filter((t) => !/[;=]/.test(t));
  return { 文, コード風: 日本語を含む.length - 文.length };
}

// ─── 走査 ───

function 画面のfile一覧(): string[] {
  return readdirSync(画面の置き場).filter((f) => f.endsWith(".tsx") && !f.includes(".test."));
}

function 全画面の添え字(): { list: 添え字[]; file数: number } {
  const files = 画面のfile一覧();
  const list = files.flatMap((f) => 添え字を拾う(readFileSync(画面の置き場 + f, "utf8"), f));
  return { list, file数: files.length };
}

function 全画面の文(): { 文: { file: string; 字: string }[]; file数: number; コード風: number } {
  const files = 画面のfile一覧();
  const 文: { file: string; 字: string }[] = [];
  let コード風 = 0;
  for (const f of files) {
    const r = 日本語の文を拾う(readFileSync(画面の置き場 + f, "utf8"));
    for (const 字 of r.文) 文.push({ file: f, 字 });
    コード風 += r.コード風;
  }
  return { 文, file数: files.length, コード風 };
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

describe("画面の日本語の文 (#1787)", () => {
  it("拾えた文の内訳を出す", () => {
    const { 文, file数, コード風 } = 全画面の文();
    expect(file数, "画面 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(5);
    console.log(`[日本語の文] file=${file数} 拾えた=${文.length} 外した(コード風)=${コード風}`);
    // 下限は空振りを止めるための値で、今の件数ではない (実数は上の行に出す)。
    // 今の件数に合わせると、字を変数に替えただけの変更で「拾えていない」 と読める形で落ちる (#1805)
    expect(文.length, "日本語の文を 1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(100);
  });

  it("日本語の文に英語の語が残っていない", () => {
    const { 文 } = 全画面の文();
    const 残る = 文
      .map((t) => ({ ...t, 語: 残る英単語(t.字) }))
      .filter((t) => t.語.length > 0)
      .map((t) => `${t.file}: ${t.字.slice(0, 60)} → ${t.語.join(", ")}`);
    expect(残る, `日本語の文に英語の語が残る:\n${残る.join("\n")}`).toEqual([]);
  });

  it("残してよい語が実際に画面で使われている", () => {
    // 使わない語を並べておくと、一覧がそのまま英語を通す抜け道になる
    const { list } = 全画面の添え字();
    const { 文 } = 全画面の文();
    const 使った = new Set(
      [...list.map((a) => a.字 ?? ""), ...文.map((t) => t.字)].flatMap((s) =>
        [...s.matchAll(/[A-Za-z]+/g)].map((m) => m[0]),
      ),
    );
    const 使わない = Object.keys(残してよい語).filter((w) => !使った.has(w));
    expect(使わない, `残してよい語に挙げたが画面で使っていない: ${使わない.join(", ")}`).toEqual([]);
  });

  it("コメントと見本のコードを外せている (対照)", () => {
    // 外し損ねると、画面に出ない字の英語で検査が常に落ちる。
    // 逆に外しすぎると、見つけるべき文を落とす。 両方向を実物で見る
    const src = readFileSync(画面の置き場 + "ContributePage.tsx", "utf8");
    const 外した = コメントと見本を外す(src);
    expect(src, "土台にコメントが無い (対照が空振りしている)").toContain("命令は実物に合わせる");
    expect(外した, "塊のコメントを外せていない").not.toContain("命令は実物に合わせる");
    const { 文 } = 日本語の文を拾う(src);
    expect(文, "画面に出る字まで外している").toContain("参加のしかた · みんなで作る");
  });

  it("英語の混ざる文を拾える (植え込み対照)", () => {
    expect(残る英単語("動くことを示せていないコードは取り込まない。"), "土台に英語が混ざっている").toEqual([]);
    expect(残る英単語("動作証明のないコードは merge の対象外。")).toEqual(["merge"]);
    // file 名と道と残してよい語は拾わない
    expect(残る英単語("くわしくは CONTRIBUTING.md を読んでほしい。")).toEqual([]);
    expect(残る英単語("ブラウザで /editor にアクセスする。")).toEqual([]);
    expect(残る英単語("枝の名前は feature/<番号>-<短い説明> で揃える。")).toEqual([]);
    expect(残る英単語("図は SVG として書き出せる。")).toEqual([]);
    // 語の区切りに使う斜線 (前後に空白) は「打ち込む名前」 とみなさない
    expect(残る英単語("不具合の報告 / feature の提案")).toEqual(["feature"]);
  });
});
