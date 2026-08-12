/**
 * 設計 (`docs/design/app.pen`) と実装の構成が揃っていることの検証 (#1128)。
 *
 * 配色は `palette-matches-pen.spec.ts` が見る (#1124)。 こちらは **節の有無** を見る。
 *
 * 突き合わせを手でやった時、 節の欠け 15 件のうち 14 件が設計の見本データ由来の雑音だった
 * (#1126 の調査)。 選別を手でやると次に比べる人が同じ選別をやり直すので、 機械化して
 * **除外を 1 件ずつ理由つきで宣言する**。
 *
 * ## 除外は宣言に無いと通らない
 *
 * 宣言に無い欠けが出たら落ちる = 設計に節を足して実装し忘れた形を検知する。
 *
 * 逆に **除外した節が実装に現れても落ちる**。 宣言が古くなったまま残ると、 本当に実装された
 * 節をいつまでも「雑音」 として無視し続けることになる。
 *
 * ## 見本データを実データに寄せない
 *
 * 設計が満杯の状態を描くのは意図的で、 実装が今そう見えないのは中身の量の違い。
 * 寄せると設計の役目 (どう見えるかを先に決める) が減り、 見本が増減するたびに設計が古くなる。
 * 雑音は消えず遅れて戻る。 だから寄せずに、 除外として宣言する。
 */
import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const 読む = (rel: string): string => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

/** 節の見出しとみなす字の大きさ。 */
const 節の大きさ = 24;

/**
 * 大きい字でも節ではないもの = **数字だけの字**。
 *
 * 設計は装飾の数字にも大きい字を使う (`01/02/03` の段の番号、 `404` の桁、 版の番号、
 * 統計の値)。 これらは節の見出しではなく、 隣に本当の見出しがある。
 *
 * 節かどうかを大きさだけで決めると装飾を節と誤認するので、 数字だけの字は先に外す。
 * 判定を 1 件ずつの除外に書くと、 装飾が増えるたびに宣言が伸びて中身が薄まる。
 */
const 数字だけ = (s: string): boolean => /^v?[\d.]+x?$/u.test(s);

/** 画面ごとの対応。 `設計` は `.pen` の frame 名から `/ Light` を除いたもの。 */
const 画面 = [
  { 設計: "01 トップ", path: "/" },
  { 設計: "02 カタログ一覧", path: "/catalog" },
  { 設計: "03 カタログの分類", path: "/catalog/presets" },
  { 設計: "04 エディタ", path: "/editor" },
  { 設計: "05 ドキュメント", path: "/docs" },
  { 設計: "06 見本の詳細", path: "/preset/sequence" },
  { 設計: "07 更新履歴", path: "/release-notes" },
  { 設計: "08 参加方法", path: "/contribute" },
  { 設計: "09 見つからない頁", path: "/no-such-page" },
] as const;

/**
 * 実装に無くてよい節。 **すべて設計の見本データ由来** で、 画面の作りの差ではない。
 *
 * 1 件ずつ画面と理由を書く。 ここに無い欠けが出たら落ちる。
 */
const 除外 = [
  // 設計は「アニメーション」 の分類を選んだ状態を描く。 実装は既定で「プリセット」 を開くため、
  // 別の分類の節は出ない。 どの分類を選んでも作りは同じ。
  { 画面: "03 カタログの分類", 節: "アニメーション" },
  { 画面: "03 カタログの分類", 節: "局面での推移" },
  { 画面: "03 カタログの分類", 節: "数値の補間" },
  { 画面: "03 カタログの分類", 節: "名札での局面表示" },

  // 設計の見本は送金と手数料の図。 実装で開くのはシーケンス図なので、 図の題が違う。
  { 画面: "06 見本の詳細", 節: "送金と手数料" },

  // 同じ節を指すが言い回しが違う。 **実装の文言が正**。 設計を起こす時に `specs/screens.md`
  // から書き直したため、 設計側だけ別の言い方になっている。
  { 画面: "05 ドキュメント", 節: "Mermaid からの移行" },
  { 画面: "05 ドキュメント", 節: "「目」 による自動検証" },
  // 設計は頁の題を「コントリビュート」、 実装は「dragon にコントリビュートする」 と書く。
  { 画面: "08 参加方法", 節: "コントリビュート" },
] as const;

type Node = {
  type?: string;
  id?: string;
  name?: string;
  content?: string;
  fontSize?: number;
  reusable?: boolean;
  ref?: string;
  descendants?: Record<string, { content?: string }>;
  children?: Node[];
};

/** 設計の節の見出しを画面ごとに集める。 */
function 設計の節(): Map<string, string[]> {
  const doc = JSON.parse(読む("../../../docs/design/app.pen")) as { children?: Node[] };
  const 部品 = new Map<string, Node>();
  const 探す = (n: Node): void => {
    if (n.reusable === true && n.id !== undefined) 部品.set(n.id, n);
    for (const c of n.children ?? []) 探す(c);
  };
  for (const c of doc.children ?? []) 探す(c);

  /**
   * 節の見出しを集める。 **隣り合う同じ大きさの字は 1 つに繋ぐ**。
   *
   * 設計は 1 つの見出しを色分けのために複数の字に割ることがある
   * (トップの `書くと、` / `動く` / `。` は 74px の 3 つで 1 つの見出し)。
   * 割れたまま比べると、 実装の 1 つの見出しと突き合わせられない。
   */
  const 集める = (
    n: Node,
    群: { 字: string; px: number }[][],
    差?: Record<string, { content?: string }>,
  ): void => {
    if (n.type === "ref" && n.ref !== undefined && 部品.has(n.ref)) {
      集める(部品.get(n.ref)!, 群, n.descendants);
      return;
    }
    // 直下の字だけを 1 つの群にまとめる。 子 frame は別の群として辿る
    const 直下: { 字: string; px: number }[] = [];
    for (const c of n.children ?? []) {
      if (c.type === "text") {
        const t = String(差?.[c.id ?? ""]?.content ?? c.content ?? "").trim();
        const px = typeof c.fontSize === "number" ? c.fontSize : 0;
        if (t !== "" && px >= 節の大きさ) 直下.push({ 字: t, px });
        continue;
      }
      集める(c, 群, 差);
    }
    if (直下.length > 0) 群.push(直下);
  };

  /**
   * 同じ親の直下で隣り合う同じ大きさの字を 1 つに繋ぎ、 数字だけの字を落とす。
   *
   * **親が違えば繋がない**。 同じ大きさの別々の節 (`5 分で動かす` と `9 実用例` 等) を
   * 繋いでしまい、 実装のどの見出しとも一致しなくなる。
   */
  const 繋ぐ = (群: { 字: string; px: number }[][]): string[] => {
    const out: string[] = [];
    for (const a of 群) {
      let 束: { 字: string; px: number } | null = null;
      for (const x of a) {
        if (束 !== null && 束.px === x.px) {
          束 = { 字: 束.字 + x.字, px: x.px };
          continue;
        }
        if (束 !== null) out.push(束.字);
        束 = x;
      }
      if (束 !== null) out.push(束.字);
    }
    return out.filter((t) => !数字だけ(t));
  };

  const out = new Map<string, string[]>();
  for (const f of doc.children ?? []) {
    const nm = f.name ?? "";
    if (!nm.endsWith(" / Light")) continue;
    const 群: { 字: string; px: number }[][] = [];
    集める(f, 群);
    out.set(nm.slice(0, -" / Light".length), [...new Set(繋ぐ(群))]);
  }
  return out;
}

/**
 * 実装の画面の **見出し** を集める。
 *
 * **画面全体の字と照合してはいけない**。 節の見出しが消えても、 上の帯や本文に同じ語が
 * 残っていれば通ってしまう (review 指摘)。 節が節として立っているかを見る。
 *
 * `h1`-`h3` に加えて、 見出しの役目を持つ要素 (`.step-num` の隣の見出し等) も拾えるよう
 * `role="heading"` も見る。
 */
async function 実装の見出し(page: Page, path: string): Promise<string[]> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  return await page.evaluate(() => {
    const out: string[] = [];
    for (const e of document.querySelectorAll('h1, h2, h3, h4, [role="heading"]')) {
      const c = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      if (c.display === "none" || c.visibility === "hidden") continue;
      if (r.width < 2 || r.height < 2) continue;
      const t = (e.textContent ?? "").trim();
      if (t !== "") out.push(t);
    }
    return out;
  });
}

const 正規化 = (s: string): string => s.normalize("NFKC").replace(/\s+/gu, "");

test("設計の節が実装にある (除外は宣言したものだけ)", async ({ page }) => {
  const 設計 = 設計の節();
  expect(設計.size, "`.pen` から画面を 1 つも読めていない").toBeGreaterThan(5);

  const 宣言 = new Set(除外.map((x) => `${x.画面} / ${正規化(x.節)}`));
  const 未宣言: string[] = [];
  const 使われた = new Set<string>();

  for (const { 設計: 名, path } of 画面) {
    const 節 = 設計.get(名);
    expect(節, `設計に「${名}」 の frame が無い`).toBeDefined();
    // 設計が節を 1 つも持たない画面 (エディタは道具が並ぶだけで節が無い) は照合しない
    if (節!.length === 0) continue;

    const 見出し = (await 実装の見出し(page, path)).map(正規化);
    expect(
      見出し.length,
      `${path} から見出しを 1 つも読めていない (設計は節を ${節!.length} 件持つ)`,
    ).toBeGreaterThan(0);

    for (const s of 節!) {
      const key = `${名} / ${正規化(s)}`;
      // **完全一致で照合する**。 部分一致にすると、 設計の 1 節に実装の複数の見出しが
      // 当たり、 片方を消しても通る (review 指摘 = 「コントリビュート」 が
      // 「dragon にコントリビュートする」 と「コントリビュート方法」 の両方に当たった)。
      //
      // 言い回しが違う節は下の `除外` に宣言する。 許す差を宣言に集めることで、
      // 「なぜ揃っていないか」 が 1 箇所に残る。
      const n = 正規化(s);
      if (見出し.includes(n)) {
        // 実装に出ている。 除外に宣言されていたなら、 その宣言はもう古い
        if (宣言.has(key)) 使われた.add(key);
        continue;
      }
      if (宣言.has(key)) { 使われた.add(key); continue; }
      未宣言.push(`${名}: 「${s}」`);
    }
  }

  expect(未宣言, "設計にあって実装に無い節 (除外に宣言が無い)").toEqual([]);

  // 宣言したのに設計から消えた節。 宣言が実態とずれた合図
  const 余り = [...宣言].filter((k) => !使われた.has(k)).map((k) => k.replace(" / ", ": "));
  expect(余り, "除外に宣言されているが設計に無い節 (宣言が古い)").toEqual([]);
});

test("除外した節が実装に現れたら知らせる", async ({ page }) => {
  // 宣言が古くなったまま残ると、 本当に実装された節をいつまでも雑音として無視し続ける。
  const 現れた: string[] = [];
  const 見出しごと = new Map<string, string[]>();
  for (const x of 除外) {
    const 対応 = 画面.find((p) => p.設計 === x.画面);
    expect(対応, `除外の「${x.画面}」 に対応する画面が無い`).toBeDefined();
    if (!見出しごと.has(x.画面)) {
      見出しごと.set(x.画面, (await 実装の見出し(page, 対応!.path)).map(正規化));
    }
    // 短い節 (数字だけ等) が本文に出ることはあるので、 **見出しとして** 出ているかを見る
    if (見出しごと.get(x.画面)!.some((h) => h === 正規化(x.節))) 現れた.push(`${x.画面}: 「${x.節}」`);
  }
  expect(現れた, "除外に宣言した節が実装に現れている (宣言を消すこと)").toEqual([]);
});
