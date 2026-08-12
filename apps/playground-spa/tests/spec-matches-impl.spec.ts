/**
 * 仕様書 (`docs/design/specs/screens.md`) と実装が揃っていることの検証 (#1135)。
 *
 * 設計 (`docs/design/app.pen`) と実装は `#1128` / `#1132` で突き合わせを機械化した。
 * **仕様書はその外に置かれたまま** で、 実測すると 5 件が食い違っていた。
 *
 * | 箇所 | 仕様書 | 実装 |
 * |---|---|---|
 * | 上部の帯 | 「行き先 6 つ」 と書いて 5 つしか並べていない | リリースノートを含む 6 つ |
 * | ドキュメントの節 | `Mermaid からの移行` | `Mermaid から移行` |
 * | ドキュメントの節 | 「目」 による自動検証 | 「目」 が検証する |
 * | 参加方法の項目 | `PR` を作成 | `Pull Request` |
 * | 参加方法の節 | (無い) | `PR を出すまでの 5 手順` |
 *
 * 2 と 3 は `#1130` が `.pen` を実装に合わせた時に仕様書を直し忘れた形、 5 は `#1126` で画面に
 * 節を足した時に仕様書へ戻していない形。 **仕様書を見ている検査が無いから気付けなかった**。
 *
 * ## 何を比べるか
 *
 * 仕様書のうち **表になっている箇所だけ** を比べる。 散文 (「この製品が何か」 等) は機械で
 * 突き合わせられないため対象外で、 これは検査で守られていない範囲として残る。
 *
 * 実装側は **描画結果 (見出し) を優先** する。 source を読むと「書いてあるが出ていない」 形を
 * 見逃すため。 経路だけは描画結果に現れないので source を読む。
 *
 * ## 表が読めなければ落ちる
 *
 * 節の見出しを起点に表の位置を決める。 見出しか表の形が変わって読めなくなったら落とす =
 * 「0 件と一致した」 で素通りさせない。
 */
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const 読む = (rel: string): string => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const 仕様書 = (): string => 読む("../../../docs/design/specs/screens.md");

/** backtick / 全角半角 / 空白の差を吸収する。 語そのものの違いは残す。 */
const 正規化 = (s: string): string => s.replace(/`/gu, "").normalize("NFKC").replace(/\s+/gu, "");

/**
 * 節の見出しの直後にある最初の表を、 行ごとのセル配列で返す。
 *
 * 表が見つからなければ空配列を返す。 呼出側が件数を検査するので、 黙って 0 件で通ることはない。
 */
function 表を読む(見出し: string): string[][] {
  const 行 = 仕様書().split("\n");
  const 始まり = 行.findIndex((l) => l.trim().startsWith(見出し));
  if (始まり < 0) return [];

  const out: string[][] = [];
  let 表の中 = false;
  for (const l of 行.slice(始まり + 1)) {
    const t = l.trim();
    // 次の節に入ったら打ち切る。 別の節の表を拾わない
    if (t.startsWith("## ")) break;
    if (!t.startsWith("|")) {
      if (表の中) break;
      continue;
    }
    // 区切り行 (`|---|---|`) は飛ばし、 それ以降を中身とみなす
    if (/^\|[\s\-|:]+\|$/u.test(t)) {
      表の中 = true;
      continue;
    }
    if (!表の中) continue;
    out.push(
      t
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim()),
    );
  }
  return out;
}

/** 実装の画面から、 指定した見出しの字を集める。 */
async function 実装の見出し(page: Page, path: string, 選ぶ: string): Promise<string[]> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  return await page.evaluate((sel) => {
    const out: string[] = [];
    for (const e of document.querySelectorAll(sel)) {
      const c = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      if (c.display === "none" || c.visibility === "hidden") continue;
      if (r.width < 2 || r.height < 2) continue;
      const t = (e.textContent ?? "").trim();
      if (t !== "") out.push(t);
    }
    return out;
  }, 選ぶ);
}

/**
 * 仕様書が数を書いている箇所と、 その数が指す表の対応。
 *
 * 「行き先 6 つ」 と書いて 5 つしか並べない形を落とす。 実際に起きていた (#1135)。
 */
const 数の主張 = [
  { 節: "## 2. カタログ一覧", 文: /分類の札を (\d+) 枚/u, 表: "## 2. カタログ一覧" },
  { 節: "## 5. ドキュメント", 文: /本文の節は次の (\d+) つ/u, 表: "## 5. ドキュメント" },
  { 節: "## 8. 参加方法", 文: /手段の札を (\d+) 枚/u, 表: "## 8. 参加方法" },
] as const;

/** 仕様書の節から、 次の節の手前までを切り出す。 */
function 節の本文(見出し: string): string {
  const 全文 = 仕様書();
  const 始まり = 全文.indexOf(見出し);
  if (始まり < 0) return "";
  const 続き = 全文.slice(始まり + 見出し.length);
  const 次 = 続き.indexOf("\n## ");
  return 次 < 0 ? 続き : 続き.slice(0, 次);
}

test("仕様書の中の数の主張と表の行数が一致する", () => {
  for (const x of 数の主張) {
    const 本文 = 節の本文(x.節);
    expect(本文, `仕様書に「${x.節}」 が無い`).not.toEqual("");
    const m = x.文.exec(本文);
    expect(m, `「${x.節}」 に数の主張 (${String(x.文)}) が無い`).not.toBeNull();

    const 表 = 表を読む(x.表);
    expect(表.length, `「${x.表}」 の表を読めていない`).toBeGreaterThan(0);
    expect(表.length, `「${x.節}」 は ${m![1]} と書いているのに表は ${表.length} 行`).toBe(
      Number(m![1]),
    );
  }
});

test("上部の帯の行き先が実装と揃っている", async ({ page }) => {
  const 表 = 表を読む("## 全画面に共通する上部の帯");
  expect(表.length, "上部の帯の表を読めていない").toBeGreaterThan(0);

  const 中央 = 表.find((r) => r[0] === "中央");
  expect(中央, "上部の帯の表に「中央」 の行が無い").toBeDefined();

  const m = /行き先 (\d+) つ = (.+)$/u.exec(中央![1]);
  expect(m, "「中央」 の行が『行き先 N つ = A / B / ...』 の形になっていない").not.toBeNull();

  const 仕様 = m![2].split(" / ").map((s) => 正規化(s));
  // 数の主張と列挙の数が食い違う形を落とす (「6 つ」 と書いて 5 つ並べていた、 #1135)
  expect(仕様.length, `「行き先 ${m![1]} つ」 と書いて ${仕様.length} つしか並べていない`).toBe(
    Number(m![1]),
  );

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const 実装 = (
    await page.$$eval(".v4-nav-links a", (els) => els.map((e) => (e.textContent ?? "").trim()))
  ).map(正規化);
  expect(実装.length, "実装の帯から行き先を 1 つも読めていない").toBeGreaterThan(0);

  // 並び順まで揃える。 順序が変わるのは画面の変更なので、 仕様書にも反映されるべき
  expect(仕様, "仕様書の行き先と実装の帯が違う").toEqual(実装);
});

test("カタログの分類が実装と揃っている", async ({ page }) => {
  const 表 = 表を読む("## 2. カタログ一覧");
  expect(表.length, "カタログ一覧の表を読めていない").toBeGreaterThan(0);

  const 仕様 = 表.map((r) => 正規化(r[0]));
  const 実装 = (await 実装の見出し(page, "/catalog", "h2")).map(正規化);
  expect(実装.length, "/catalog から見出しを 1 つも読めていない").toBeGreaterThan(0);
  expect(仕様, "仕様書の分類と実装の分類が違う").toEqual(実装);
});

test("ドキュメントの節が実装と揃っている", async ({ page }) => {
  const 表 = 表を読む("## 5. ドキュメント");
  expect(表.length, "ドキュメントの節の表を読めていない").toBeGreaterThan(0);

  const 仕様 = 表.map((r) => 正規化(r[0]));
  const 実装 = (await 実装の見出し(page, "/docs", "h2")).map(正規化);
  expect(実装.length, "/docs から見出しを 1 つも読めていない").toBeGreaterThan(0);
  // 並び順は問わない = 仕様書は読む順、 実装は画面上の配置順で、 どちらも正しい
  expect([...仕様].sort(), "仕様書のドキュメントの節と実装の節が違う").toEqual([...実装].sort());
});

test("参加方法の項目が実装と揃っている", async ({ page }) => {
  const 手段 = 表を読む("## 8. 参加方法");
  expect(手段.length, "参加方法の手段の表を読めていない").toBeGreaterThan(0);

  const 手順 = 表を読む("### 8-1. `PR` を出すまでの 5 手順");
  expect(手順.length, "参加方法の手順の表を読めていない").toBeGreaterThan(0);

  const 仕様 = [...手段, ...手順].map((r) => 正規化(r[0]));
  const 実装 = (await 実装の見出し(page, "/contribute", "h3")).map(正規化);
  expect(実装.length, "/contribute から見出しを 1 つも読めていない").toBeGreaterThan(0);
  expect([...仕様].sort(), "仕様書の参加方法の項目と実装の項目が違う").toEqual([...実装].sort());
});

/**
 * 仕様書が経路を散文で書いている行の言い換え。
 *
 * 「上記以外すべて」 は router の `*` に当たる。 仕様書側を `*` に書き換えると人が読む時に
 * 意味が伝わらないので、 対応をここに書く。
 */
const 経路の言い換え = new Map<string, string>([["上記以外すべて", "*"]]);

/**
 * 実装にあって仕様書に無い経路。 1 件ずつ理由を書く。 ここに無い経路が出たら落ちる。
 *
 * 逆に **宣言した経路が仕様書に現れても落ちる**。 宣言が古くなったまま残ると、 仕様書に
 * 書いた経路をいつまでも「書いていない」 ものとして無視し続けることになる。
 */
const 経路の除外 = [
  // エディタと同じ画面。 末尾の拡張子で最初に開く欄を決めるためだけの経路
  { path: "/editor/:filename", 理由: "エディタと同じ画面" },
  // 開発時にしか出ない検査用の頁。 仕様書も「対象外」 と明記している
  { path: "/__render", 理由: "開発時のみ (仕様書が対象外と明記)" },
] as const;

test("画面の経路が実装の route と揃っている", () => {
  const 表 = 表を読む("## 描く範囲");
  expect(表.length, "描く範囲の表を読めていない").toBeGreaterThan(0);

  const 仕様 = 表.map((r) => {
    const 生 = r[2].replace(/`/gu, "").trim();
    return 経路の言い換え.get(生) ?? 生;
  });

  const src = 読む("../src/main.tsx");
  const 実装 = [...src.matchAll(/<Route\s+path="([^"]+)"/gu)].map((m) => m[1]);
  expect(実装.length, "main.tsx から route を 1 つも読めていない").toBeGreaterThan(0);

  const 宣言 = new Set<string>(経路の除外.map((x) => x.path));
  const 未宣言 = 実装.filter((p) => !仕様.includes(p) && !宣言.has(p));
  expect(未宣言, "実装にあって仕様書に無い経路 (除外に宣言が無い)").toEqual([]);

  const 消えた = 仕様.filter((p) => !実装.includes(p));
  expect(消えた, "仕様書にあって実装に無い経路").toEqual([]);

  const 余り = [...宣言].filter((p) => 仕様.includes(p) || !実装.includes(p));
  expect(余り, "除外に宣言されているが仕様書に書かれた / 実装から消えた経路").toEqual([]);
});
