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
 * 表のセルに割る。 前後の `|` を落としてから区切る。
 *
 * **`\|` は区切りではなく字としての縦棒**。 markdown はセルの中の縦棒をこの形で書く。
 * 素朴に `|` で割ると、 正しい表を「列が増えた」 と誤って読む (review 指摘)。
 */
const セルに割る = (行: string): string[] => {
  const 中 = 行.trim().slice(1, -1);
  const out: string[] = [];
  let 今 = "";
  for (let i = 0; i < 中.length; i++) {
    const c = 中[i];
    if (c === "\\" && 中[i + 1] === "|") {
      今 += "|";
      i++;
      continue;
    }
    if (c === "|") {
      out.push(今.trim());
      今 = "";
      continue;
    }
    今 += c;
  }
  out.push(今.trim());
  return out;
};

/**
 * 節の見出しの直後にある最初の表を、 行ごとのセル配列で返す。
 *
 * **見出しは完全一致で探す**。 前方一致にすると、 対象名を接頭辞に持つ別の節
 * (`## 5. ドキュメント (旧版)` を前に置く等) を対象として受理してしまう (review 指摘)。
 *
 * **表は「見出し行 + 区切り行」 の対で始まる形しか認めない**。 区切り行だけで開始と判定すると、
 * 見出し行を消して表が壊れても中身の行を返し、 実装と一致して通ってしまう (review 指摘)。
 * 列の数も見出し行と揃っていることを求める。
 *
 * 見つからない / 形が違う場合は空配列を返す。 呼出側が件数を検査するので、 黙って 0 件で通る
 * ことはない。
 */
function 表を読む(見出し: string): string[][] {
  const 行 = 仕様書().split("\n");
  const 始まり = 行.findIndex((l) => l.trim() === 見出し);
  if (始まり < 0) return [];

  const out: string[][] = [];
  let 列数 = 0;
  let 表の中 = false;
  const 続き = 行.slice(始まり + 1);
  for (let i = 0; i < 続き.length; i++) {
    const t = 続き[i].trim();
    // 次の節 (`## ` / `### `) に入ったら打ち切る。 別の節の表を拾わない
    if (/^#{2,6}\s/u.test(t)) break;
    if (!t.startsWith("|")) {
      if (表の中) break;
      continue;
    }
    if (!表の中) {
      // 見出し行の直後が区切り行になっている対だけを表の始まりとみなす
      const 次 = (続き[i + 1] ?? "").trim();
      if (!/^\|[\s\-|:]+\|$/u.test(次)) continue;
      const 見出し行 = セルに割る(t).length;
      // 区切り行の列数も見出し行と揃っていること。 揃わない形は表として壊れている (review 指摘)
      if (セルに割る(次).length !== 見出し行) break;
      列数 = 見出し行;
      表の中 = true;
      i++;
      continue;
    }
    const セル = セルに割る(t);
    // 列の数が見出し行と違う行が出たら、 表として読めていないので打ち切る
    if (セル.length !== 列数) break;
    out.push(セル);
  }
  return out;
}

/**
 * 実装の画面から、 指定した見出しの字を集める。
 *
 * **見えない見出しは数えない**。 `display` と `visibility` と寸法だけでは、 `opacity: 0` と
 * 横に押し出した配置 (`left: -9999px`) が残る = 画面に出ていない古い見出しを置くだけで仕様書と
 * 一致させられる (review 指摘)。 親から継承する `opacity` も見る。
 *
 * 縦の画面外は数える。 長い頁では下の見出しが画面外にあるのが普通で、 これを外すと巻き取り
 * 位置で結果が変わる。
 */
async function 実装の見出し(page: Page, path: string, 選ぶ: string): Promise<string[]> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  return await page.evaluate((sel) => {
    const 透けている = (e: Element): boolean => {
      for (let n: Element | null = e; n !== null; n = n.parentElement) {
        if (Number(getComputedStyle(n).opacity) === 0) return true;
      }
      return false;
    };
    const out: string[] = [];
    for (const e of document.querySelectorAll(sel)) {
      const c = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      if (c.display === "none" || c.visibility === "hidden") continue;
      if (r.width < 2 || r.height < 2) continue;
      if (透けている(e)) continue;
      // 横に押し出された配置は画面に出ていない
      if (r.right <= 0 || r.left >= window.innerWidth) continue;
      const t = (e.textContent ?? "").trim();
      if (t !== "") out.push(t);
    }
    return out;
  }, 選ぶ);
}

/**
 * 見る節の見出し。 **完全一致で探すので、 括弧の中まで含めて書く**。
 *
 * 見出しを変えたら検査が「節が無い」 で落ちる。 表の位置を見出しで決めている以上、 見出しの
 * 変更は検査の対象が変わることと同じなので、 落として気付かせる。
 */
const 節 = {
  描く範囲: "## 描く範囲",
  帯: "## 全画面に共通する上部の帯",
  カタログ: "## 2. カタログ一覧 (`/catalog`)",
  ドキュメント: "## 5. ドキュメント (`/docs`)",
  参加方法: "## 8. 参加方法 (`/contribute`)",
  手順: "### 8-1. `PR` を出すまでの 5 手順",
} as const;

/**
 * 仕様書が数を書いている箇所と、 その数が指す表の対応。
 *
 * 「行き先 6 つ」 と書いて 5 つしか並べない形を落とす。 実際に起きていた (#1135)。
 */
const 数の主張 = [
  { 節: 節.カタログ, 文: /分類の札を (\d+) 枚/u },
  { 節: 節.ドキュメント, 文: /本文の節は次の (\d+) つ/u },
  { 節: 節.参加方法, 文: /手段の札を (\d+) 枚/u },
] as const;

/**
 * 仕様書の節から、 次の節の手前までを切り出す。
 *
 * 見出しは `表を読む` と同じく完全一致で探す。 前方一致だと接頭辞を共有する別の節を拾う。
 */
function 節の本文(見出し: string): string {
  const 行 = 仕様書().split("\n");
  const 始まり = 行.findIndex((l) => l.trim() === 見出し);
  if (始まり < 0) return "";
  const out: string[] = [];
  for (const l of 行.slice(始まり + 1)) {
    if (/^#{2,6}\s/u.test(l.trim())) break;
    out.push(l);
  }
  return out.join("\n");
}

test("仕様書の中の数の主張と表の行数が一致する", () => {
  for (const x of 数の主張) {
    const 本文 = 節の本文(x.節);
    expect(本文, `仕様書に「${x.節}」 が無い`).not.toEqual("");
    const m = x.文.exec(本文);
    expect(m, `「${x.節}」 に数の主張 (${String(x.文)}) が無い`).not.toBeNull();

    const 表 = 表を読む(x.節);
    expect(表.length, `「${x.節}」 の表を読めていない`).toBeGreaterThan(0);
    expect(表.length, `「${x.節}」 は ${m![1]} と書いているのに表は ${表.length} 行`).toBe(
      Number(m![1]),
    );
  }
});

test("上部の帯の行き先が実装と揃っている", async ({ page }) => {
  const 表 = 表を読む(節.帯);
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
  const 表 = 表を読む(節.カタログ);
  expect(表.length, "カタログ一覧の表を読めていない").toBeGreaterThan(0);

  const 仕様 = 表.map((r) => 正規化(r[0]));
  const 実装 = (await 実装の見出し(page, "/catalog", "h2")).map(正規化);
  expect(実装.length, "/catalog から見出しを 1 つも読めていない").toBeGreaterThan(0);
  expect(仕様, "仕様書の分類と実装の分類が違う").toEqual(実装);
});

test("ドキュメントの節が実装と揃っている", async ({ page }) => {
  const 表 = 表を読む(節.ドキュメント);
  expect(表.length, "ドキュメントの節の表を読めていない").toBeGreaterThan(0);

  const 仕様 = 表.map((r) => 正規化(r[0]));
  const 実装 = (await 実装の見出し(page, "/docs", "h2")).map(正規化);
  expect(実装.length, "/docs から見出しを 1 つも読めていない").toBeGreaterThan(0);
  // 並び順は問わない = 仕様書は読む順、 実装は画面上の配置順で、 どちらも正しい
  expect([...仕様].sort(), "仕様書のドキュメントの節と実装の節が違う").toEqual([...実装].sort());
});

test("参加方法の項目が実装と揃っている", async ({ page }) => {
  const 手段 = 表を読む(節.参加方法);
  expect(手段.length, "参加方法の手段の表を読めていない").toBeGreaterThan(0);

  const 手順 = 表を読む(節.手順);
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

test("トップの版の札が package.json と一致する", async ({ page }) => {
  // 札は手で書いた文字列で、 版を上げても自動では追随しない。 実際に 2 版分古いまま
  // 残っていた (`v0.5` に対して package は `0.7.0`、 #1139 の review 指摘)。
  const pkg = JSON.parse(読む("../../../packages/dragon/package.json")) as { version?: string };
  expect(pkg.version, "package.json に version が無い").toBeDefined();
  const 期待 = `v${pkg.version!.split(".").slice(0, 2).join(".")}`;

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const 札 = await page.$$eval(".hero-eyebrow .chip", (els) =>
    els.map((e) => (e.textContent ?? "").trim()),
  );
  expect(札.length, "トップに前置きの札が無い").toBeGreaterThan(0);
  // 版を表す札は 1 枚だけ。 `v` + 数字の形のものを探す
  const 版 = 札.filter((t) => /^v[\d.]+$/u.test(t));
  expect(版, "版の札が 1 枚に定まらない").toHaveLength(1);
  expect(版[0], `札が ${版[0]} だが package.json は ${pkg.version}`).toBe(期待);
});

/**
 * `main.tsx` の `<Route>` から経路を取り出す。
 *
 * **`<Route` を先に全件数え、 1 つずつ `path` を取る**。 `<Route\s+path="..."` の 1 つの形だけを
 * 拾う書き方だと、 属性の並びを変える / 単引用符にする / 式で渡す のいずれでも取り逃がし、
 * 実装にだけ経路を足しても「未宣言」 に出ない (review 指摘)。
 *
 * 取り出せない形は **例外にして落とす**。 取りこぼしを 0 件として黙って通すと、 検査が
 * 「一致した」 と報告しながら実際には見ていない状態になる。
 *
 * 属性の並びの終わりは `{}` の深さと引用符を数えて決める。 `element={<Page />}` の中の `>` で
 * 切ってしまうと、 その後ろに置いた `path` を読み落とす。
 */
function 実装の経路(src: string): string[] {
  const out: string[] = [];
  // 名前の続きを持つ tag (`<Routes` / `<Route2`) は別物。 数字と `_` も名前の続きに含める
  for (const m of src.matchAll(/<Route(?![\p{L}\p{N}_])/gu)) {
    const 始まり = m.index;
    let 深さ = 0;
    let 引用: string | null = null;
    let i = 始まり + "<Route".length;
    for (; i < src.length; i++) {
      const c = src[i];
      if (引用 !== null) {
        // 引用の中の `\` は次の 1 文字を字として読む。 数えないと `{"a\"b"}` で引用が閉じたと
        // 誤り、 走査が次の tag まで伸びて別の route の `path` を拾う (review 指摘)
        if (c === "\\") {
          i++;
          continue;
        }
        if (c === 引用) 引用 = null;
        continue;
      }
      if (c === '"' || c === "'") {
        引用 = c;
        continue;
      }
      if (c === "{") 深さ++;
      else if (c === "}") 深さ--;
      else if (深さ === 0 && c === ">") break;
    }
    // 終わりを見つけられない = 読めていない。 その先の字を拾って別の route の値にしない
    if (i >= src.length) {
      throw new Error(`route の属性の終わりを読めない: ${src.slice(始まり, 始まり + 80)}`);
    }
    const 断片 = src.slice(始まり, i);
    const p = /\spath=(?:"([^"]*)"|'([^']*)')/u.exec(断片);
    if (p === null) {
      throw new Error(
        `route の path を字として読めない (式や変数で渡さず literal で書くこと): ${断片.trim()}`,
      );
    }
    out.push(p[1] ?? p[2]);
  }
  return out;
}

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
  const 表 = 表を読む(節.描く範囲);
  expect(表.length, "描く範囲の表を読めていない").toBeGreaterThan(0);

  const 仕様 = 表.map((r) => {
    const 生 = r[2].replace(/`/gu, "").trim();
    return 経路の言い換え.get(生) ?? 生;
  });

  const 実装 = 実装の経路(読む("../src/main.tsx"));
  expect(実装.length, "main.tsx から route を 1 つも読めていない").toBeGreaterThan(0);

  const 宣言 = new Set<string>(経路の除外.map((x) => x.path));
  const 未宣言 = 実装.filter((p) => !仕様.includes(p) && !宣言.has(p));
  expect(未宣言, "実装にあって仕様書に無い経路 (除外に宣言が無い)").toEqual([]);

  const 消えた = 仕様.filter((p) => !実装.includes(p));
  expect(消えた, "仕様書にあって実装に無い経路").toEqual([]);

  const 余り = [...宣言].filter((p) => 仕様.includes(p) || !実装.includes(p));
  expect(余り, "除外に宣言されているが仕様書に書かれた / 実装から消えた経路").toEqual([]);
});
