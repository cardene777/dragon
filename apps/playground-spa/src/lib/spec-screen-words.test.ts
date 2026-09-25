// @vitest-environment node
/**
 * 画面を動かす検査 (`tests/*.spec.ts`) が名指しする字が、実物に出ることの検証 (#1834)。
 *
 * 画面の呼び名を日本語に開く作業を続けているが、**その語を literal で持つ検査が置き去りに
 * なる**。 実測で 5 件が赤いまま残っており、いずれも呼び名を変えた日から気付かれていない。
 *
 * | 検査 | 期待していた字 | 画面の今の字 |
 * |---|---|---|
 * | `preset-detail-name` | プリセット | ひな形 (#1805 / #1807) |
 * | `interactive-catalog` | スクロール駆動のフェーズ進行 | スクロール進行に 3 つの段が同時に追随する (#1821) |
 * | `editor-auto-fix` | 対応可なし | 直せるものなし |
 *
 * ## なぜ vitest 側に置くか
 *
 * 画面を動かす検査は全件で 11 分かかり、`pnpm verify` (型検査 + テスト) に入っていない。
 * 明示的に叩いた時しか走らないので、赤くなってから気付くまでの間隔に上限が無い。
 * ここは字を静的に読むだけなので、普段の流れで回る側に置ける。
 *
 * ## 何を名指しとみなすか
 *
 * **画面の字を名指しする呼び出しに絞る**。 検査 file の日本語を全部見ると、検査の題と
 * 落ちた時の文まで拾って実測 1434 件中 1025 件 (71%) が「出ない」 に落ちる。
 *
 * 引数に literal が出ない形も 2 つ拾う。 一覧に置いてから回す形
 * (`for (const 名 of ["…", "…"])`) と、名前に置いてから渡す形 (`const 添えの語 = "…"`)。
 * 引数だけを見ると前者で `interactive-catalog` の 2 件を取りこぼし、後者は
 * **字を 1 度 `const` に移すだけで逃げられる** (変異試験で実測)。
 *
 * 一覧と置き場は、その file が字を合わせる呼び出しを持つ時だけ見る。
 * 持たない file まで見ると、見本の本文や識別子の並びを画面の字と読んでしまう。
 *
 * ## 取りこぼす形
 *
 * 字を組み立ててから渡す形 (`getByText(\`前 ${値}\`)`) と、字を別 file から読む形は見えない。
 * 否定の照合 (`not.toContain("プリセット")`) も、語が無いのが正しいので同じ規則では
 * 判定できない。 静的に追うには検査の呼び出し木を辿る必要があり、収束しない。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { file一覧 } from "./walk-files";
import { 日本語の字 } from "./screen-words";

const src根 = fileURLToPath(new URL("../", import.meta.url));
const 検査根 = fileURLToPath(new URL("../../tests/", import.meta.url));
const 記法根 = fileURLToPath(new URL("../../../../packages/dragon/src/", import.meta.url));

/**
 * 画面へ字を渡しうる側。
 *
 * 記法の package を入れるのは、編集画面に出る知らせの文がそちらで作られるため
 * (`効きません` は `packages/dragon/src/compile.ts` が持つ)。 入れないと、
 * 記法が出す文を照合する検査が全部偽陽性になる。
 *
 * 検査 file は外す = 植え込み対照に置いた古い字を「実物に出ている」 と読んでしまう
 * (実測で `プリセット` が 3 つの検査 file にだけ残っていた)。
 */
function 実物の字(): { 文: string; 走査: number } {
  const files = [
    ...file一覧(src根, /\.tsx?$/, false),
    ...file一覧(記法根, /\.tsx?$/, false),
  ];
  return { 文: files.map((f) => readFileSync(f, "utf8")).join("\n"), 走査: files.length };
}

/**
 * 画面の字を名指しする呼び出し。 第 1 引数が字そのものの形だけを見る。
 *
 * `toContain` / `toBe` も入れる。 これを外すと、画面から読んだ字を素の文字列として
 * 照合する形 (`expect(await 見出し(page)).toContain("ひな形")`) が丸ごと見えない =
 * 実際に赤かった `preset-detail-name` がこの形だった。
 *
 * 代わりに **検査が自分で打ち込む字と自分で作る字** が混ざるので、下の宣言で外す。
 * 実測で 84 件中 8 件が宣言側に落ちる。
 */
const 名指し =
  /\b(getByText|toContainText|toHaveText|getByLabel|getByPlaceholder|getByTitle|getByAltText|toContain|toBe|toHaveValue)\(\s*(?:"([^"\\\n]+)"|'([^'\\\n]+)')/g;

/** 1 行に収まる字の一覧。 2 件以上並ぶものだけを見る (1 件なら呼び出しに直接書ける)。 */
const 字の一覧 = /\[\s*("(?:[^"\\\n]+)"(?:\s*,\s*"(?:[^"\\\n]+)")+)\s*,?\s*\]/g;
const 一覧の中身 = /"([^"\\\n]+)"/g;
/**
 * 字を名前に置いてから渡す形。 呼び出しの引数には literal が出ない。
 *
 * 実測 2 件で偽陽性 0 件。 拾わないと、字を 1 度 `const` に移すだけで検査から逃げられる
 * (変異試験で実測 = `const 添えの語 = "プリセット";` が 0 件 FAIL だった)。
 */
const 字の置き場 = /\bconst\s+[A-Za-z_$぀-ヿ一-鿿][\w$぀-ヿ一-鿿]*\s*=\s*"([^"\\\n]+)"/g;

/**
 * 一覧の字を画面の字として使っている合図。 **場所を指す呼び出しに絞る**。
 *
 * 照合 (`toContain` / `toBe`) まで広げると、検査が自分で作る見出しの一覧
 * (`dark-ground-step.spec.ts` の報告用の名前 3 件) まで拾う (実測 19 件中 5 件)。
 */
const 場所を指す = /\b(getByText|toContainText|toHaveText|getByLabel|getByTitle)\b/;

/**
 * 置き場の字を画面の字として使っている合図。 **照合まで広げる**。
 *
 * 1 つの名前に置いた字は、ほぼ画面から読んだ値との照合に使われる。 実測 2 件で偽陽性 0 件。
 * 絞ると `preset-detail-name` のように場所を指す呼び出しを持たない file が丸ごと外れ、
 * 字を `const` に移すだけで逃げられる (変異試験で実測)。
 */
const 字を照合する = /\b(getByText|toContainText|toHaveText|getByLabel|getByTitle|toContain|toBe|toHaveValue)\b/;

function コメントを外す(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/gm, "$1");
}

/**
 * 実物に出ないと分かっている字。 1 件ずつ理由を書く。
 *
 * ここに無い字が出たら落ちる = 呼び名を変えて検査を置き去りにした形を検知する。
 * 逆に **宣言した字が実物に現れても落ちる** = 宣言が古くなったまま残らないように。
 *
 * 中身は 2 種類しかない。 差し込みで組み立てる字と、検査が自分で作って自分で読む字
 * (打ち込む本文 / 植え込み対照の見本 / 検査自身が組む文)。
 */
export const 実物に出ない字: Record<string, string> = {
  "前 38":
    "`前 ${前の値}` の形で組み立てる (StatCard.tsx)。 字そのものは source に無く、数は図の値で決まる",
  "02 忘れた頁 / Light":
    "設計の frame 構成の植え込み対照。 目印を付け忘れた画面を検査が自分で作って、未分類に落ちることを見る",
  とてもとてもながいラベルの文字列テスト:
    "編集画面に打ち込む本文。 画面から読む字ではなく、検査が入力として与える字",
  とてもとてもながいラベルの文字列テストです:
    "同上 (書き戻した後の本文が消えていないことを見る側)",
  "注文-api": "編集画面に打ち込む本文の識別子。 同上",
  '名札 "注文 API"':
    "知らせの文を検査が組み立てた形。 実物は `packages/dragon` が値を差し込んで作る",
  測れなかった:
    "検査が自分で作る落ちた時の文 (`rendered-contrast.spec.ts` の `judge()`)。 画面には出ない",
  植えた例外:
    "画面の script 例外を拾えるかの植え込み対照。 検査が投げて検査が拾う",
  植えた字:
    "小さすぎる文字を拾えるかの植え込み対照 (`phone-diagram-legibility.spec.ts`)。 検査が図に置いて検査が拾う",
  帯の折りたたみ:
    "開く口に検査が付けた呼び名 (`phone-openers.ts` の `名`)。 画面に出る字ではなく、どの口を押せたかを落ちた時の文に出すための名前",
};

type 形 = "呼び出し" | "一覧" | "置き場";

/** 検査 1 file ぶんの字から、名指しを拾う。 実 file と植え込み対照の両方が引く */
export function 名指しを拾う(src: string): { 字: string; 形: 形 }[] {
  const s = コメントを外す(src);
  const out: { 字: string; 形: 形 }[] = [];
  for (const m of s.matchAll(名指し)) {
    const t = (m[2] ?? m[3] ?? "").trim();
    if (日本語の字.test(t)) out.push({ 字: t, 形: "呼び出し" });
  }
  if (場所を指す.test(s)) {
    for (const m of s.matchAll(字の一覧)) {
      for (const c of m[1]!.matchAll(一覧の中身)) {
        const t = c[1]!.trim();
        if (日本語の字.test(t)) out.push({ 字: t, 形: "一覧" });
      }
    }
  }
  if (字を照合する.test(s)) {
    for (const m of s.matchAll(字の置き場)) {
      const t = m[1]!.trim();
      if (日本語の字.test(t)) out.push({ 字: t, 形: "置き場" });
    }
  }
  return out;
}

export function 名指しした字(): {
  字: { 検査: string; 字: string; 形: 形 }[];
  走査: { 検査file: number; 呼び出し: number; 一覧: number; 置き場: number };
} {
  const out: { 検査: string; 字: string; 形: 形 }[] = [];
  const files = file一覧(検査根, /\.spec\.ts$/, true);
  for (const f of files) {
    const 名 = f.slice(検査根.length);
    for (const r of 名指しを拾う(readFileSync(f, "utf8"))) out.push({ 検査: 名, ...r });
  }
  const 数 = (k: 形): number => out.filter((r) => r.形 === k).length;
  return {
    字: out,
    走査: {
      検査file: files.length,
      呼び出し: 数("呼び出し"),
      一覧: 数("一覧"),
      置き場: 数("置き場"),
    },
  };
}

describe("検査が名指しする画面の字 (#1834)", () => {
  it("名指しした字が実物に出ている", () => {
    const { 字, 走査 } = 名指しした字();
    const { 文, 走査: 実物 } = 実物の字();
    const 出ない = 字
      .filter((r) => !(r.字 in 実物に出ない字) && !文.includes(r.字))
      .map((r) => `${r.検査} [${r.形}] ${r.字}`);
    console.log(
      `[検査の名指し] 検査 file=${走査.検査file} 呼び出し=${走査.呼び出し} 一覧=${走査.一覧}` +
        ` 置き場=${走査.置き場} / 実物の file=${実物}` +
        ` 宣言=${Object.keys(実物に出ない字).length} 出ない=${出ない.length}`,
    );
    expect(走査.検査file, "検査 file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(50);
    expect(走査.呼び出し, "呼び出しの形を 1 件も拾えていない").toBeGreaterThan(20);
    expect(実物, "実物の file を 1 つも読めていない").toBeGreaterThan(50);
    expect(出ない, `検査が名指しする字が実物に出ていない:\n${出ない.join("\n")}`).toEqual([]);
  });

  it("宣言した字が実物に現れたら知らせる (宣言が古くなる形)", () => {
    const { 文 } = 実物の字();
    const 現れた = Object.keys(実物に出ない字).filter((t) => 文.includes(t));
    expect(現れた, `宣言が古い (実物に出るようになった): ${現れた.join(", ")}`).toEqual([]);
  });

  it("宣言が理由を持っている", () => {
    const 理由なし = Object.entries(実物に出ない字)
      .filter(([, 理由]) => 理由.trim().length < 10)
      .map(([字]) => 字);
    expect(理由なし, `理由を書いていない宣言: ${理由なし.join(", ")}`).toEqual([]);
  });

  it("3 つの形を拾える (植え込み対照 + 対象外の対照)", () => {
    // **植え込む字を実 file から作らない**。 実 file の形が 1 つ減った日に、この検査が
    // 静かに片方の形を見なくなる (実測 = 一覧の形を実物から数えていた時、名前を実物から
    // 導く直しを入れた瞬間に 11 件から 3 件へ落ちた)
    const 呼び出しの形 = `await expect(page.getByText("更新履歴").first()).toBeVisible();`;
    expect(名指しを拾う(呼び出しの形)).toEqual([{ 字: "更新履歴", 形: "呼び出し" }]);

    const 一覧の形 = [
      `const 名前 = ["参加方法", "更新履歴"];`,
      `for (const n of 名前) await expect(page.getByText(n)).toBeVisible();`,
    ].join("\n");
    expect(名指しを拾う(一覧の形)).toEqual([
      { 字: "参加方法", 形: "一覧" },
      { 字: "更新履歴", 形: "一覧" },
    ]);

    const 置き場の形 = [
      `const 添えの語 = "ひな形";`,
      `await expect(page.getByText(添えの語)).toBeVisible();`,
    ].join("\n");
    expect(名指しを拾う(置き場の形)).toEqual([{ 字: "ひな形", 形: "置き場" }]);

    // 合図を持たない file の一覧と置き場は見ない = 見本の本文まで拾う
    expect(名指しを拾う(`const 名前 = ["参加方法", "更新履歴"];`)).toEqual([]);
    expect(名指しを拾う(`const 添えの語 = "ひな形";`)).toEqual([]);

    // 一覧と置き場で合図が違う。 照合しか持たない file の一覧は見ず、置き場は見る
    const 照合だけ = [
      `const 添えの語 = "ひな形";`,
      `const 見本 = ["あ", "い"];`,
      `expect(await 見出し(page)).toContain(添えの語);`,
    ].join("\n");
    expect(名指しを拾う(照合だけ)).toEqual([{ 字: "ひな形", 形: "置き場" }]);
    // 英語だけの名指しは見ない = 画面の字の英語は `screen-words.test.ts` が見る
    expect(名指しを拾う(`page.getByText("releases")`)).toEqual([]);
    // 検査の題と落ちた時の文は名指しではない
    expect(名指しを拾う(`test("更新履歴が出る", async () => {});`)).toEqual([]);

    const { 字 } = 名指しした字();
    expect(字.every((r) => 日本語の字.test(r.字)), "日本語を含まない字が混ざっている").toBe(true);
  });
});
