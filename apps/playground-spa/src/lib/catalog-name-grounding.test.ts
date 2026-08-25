/**
 * 一覧の名前が「図の持たない題材」 を名乗っていないことの検証 (#1048)。
 *
 * 名前は「探す時の見出し」 なので、図の題名と一致する必要は無い。 言い換え
 * (「スイムレーン」 と「役割ごとに縦レーン分け」) も食い違いではない。
 *
 * **食い違うのは場面を名乗った時だけ**。 図が「通知 4 種を情報 / 注意 / 異常 / 成功で分ける」
 * しか持たないのに名前が「本番デプロイ障害エスカレーション」 と名乗ると、探して開いた人は
 * 別の図に来たと受け取る。 #1046 の review で 9 件、本 検査で更に 24 件見つかった。
 *
 * 語の一致では判定できない (実測 = 名前の語が図に無い件は 412 件中 274 件で、大半は言い換え)。
 * そこで **場面を名乗る語だけ** を対象にする。 人物 / 時期 / 媒体 / 業種の 4 種で、
 * これらは図が持っていなければ名乗れない性質を持つ。
 *
 * 検査の語彙は塞ぎ切れない (#1043 で扱う)。 ここが受け持つのは、
 * **一度見つけた型を同じ形で持ち込ませない** ところまで。
 */
import { describe, it, expect } from "vitest";
import { CATALOG_ITEMS, loadPartsItems, type CatalogItem } from "./catalog-items";
import { ITEM_NAME_JA, ITEM_NAME_EN, itemNameJa, itemNameEn } from "./i18n";

/**
 * 場面を名乗る語。 図が持たないのに名前が名乗ると、見出しが別の図を約束する。
 *
 * 言い換えでは出てこない語だけを入れる。 「一覧」 「比較」 のような図の形を指す語は
 * 入れない (言い換えで普通に出るため、入れると誤検出が増えて検査が読まれなくなる)。
 *
 * **日本語と英語を対で持つ**。 図の文言はほとんどが日本語なので、英語名を英語のまま探すと
 * 根拠があっても見つからない (実測 = 「四半期」 を持つ図に対して `Quarterly roadmap` が落ちた)。
 * どちらか一方の言い方が図にあれば根拠ありとする。
 */
// `ja` / `en` は **必ず 1 語以上持つ**。 先頭を代表として報告に使うため、
// 空の側を書くと報告が `undefined` になる。 型で表しておくと書いた時点で落ちる
const SCENE_WORDS: Array<{
  ja: [string, ...string[]];
  en: [string, ...string[]];
  notScene?: string[];
}> = [
  // 人物 / 役割
  { ja: ["エンジニア"], en: ["engineer"] },
  { ja: ["デザイナー"], en: ["designer"] },
  { ja: ["マネージャー"], en: ["manager"] },
  { ja: ["開発者"], en: ["developer"] },
  { ja: ["投資家"], en: ["trader", "investor"] },
  { ja: ["クリエイター"], en: ["creator"] },
  { ja: ["教育"], en: ["educator"] },
  { ja: ["CEO"], en: ["ceo"] },
  { ja: ["CFO"], en: ["cfo"] },
  { ja: ["CTO"], en: ["cto"] },
  { ja: ["フリーランス"], en: ["freelance"] },
  { ja: ["マーケ"], en: ["marketing"] },
  { ja: ["カスタマーサクセス"], en: ["customer success"] },
  // 時期 / 頻度
  { ja: ["朝"], en: ["morning"] },
  { ja: ["夜"], en: ["night"] },
  { ja: ["日次"], en: ["daily"] },
  { ja: ["週次", "週間"], en: ["weekly"] },
  { ja: ["月次"], en: ["monthly"] },
  { ja: ["四半期"], en: ["quarterly"] },
  { ja: ["半年"], en: ["half-year"] },
  { ja: ["年間"], en: ["annual"] },
  // 媒体 / 業種
  { ja: ["YouTube"], en: ["youtube"] },
  { ja: ["OSS"], en: ["oss"] },
  { ja: ["SaaS"], en: ["saas"] },
  { ja: ["DeFi"], en: ["defi"] },
  { ja: ["EC"], en: ["e-commerce"] },
  { ja: ["スタートアップ"], en: ["startup"] },
  { ja: ["リモート"], en: ["remote"] },
  { ja: ["ポッドキャスト"], en: ["podcast"] },
  { ja: ["通勤"], en: ["commute"] },
  { ja: ["ブラックフライデー"], en: ["black friday"] },
  // `production` は「生成」 の意味でも使われるため、その言い回しだけを名乗りから外す。
  // 語ごと外すと、この検査が直したはずの `Production deploy incident escalation` を
  // 戻しても通ってしまう (Round 1 の指摘)
  { ja: ["本番"], en: ["production"], notScene: ["block production"] },
];

/**
 * 語が入っているかを見る。 **英字を含む語は語の区切りで、含まない語はそのまま** 探す。
 *
 * 区切りを見ないと `across` の中の `oss`、`SELECT` の中の `EC` に当たる (どちらも実測)。
 * 逆に日本語は語の区切りを持たないため、区切りを求めると「四半期ごと」 が引けなくなる。
 *
 * 区切りには **数字も含める**。 英字だけを区切りにすると `EC2` / `SaaS2` のような識別子の中の
 * `EC` / `SaaS` に当たる。
 */
function hasWord(haystack: string, word: string): boolean {
  if (!/[a-z]/i.test(word)) return haystack.includes(word);
  const escaped = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(haystack.toLowerCase());
}

/** 場面を指さない言い回しを取り除く。 残りだけを名乗り / 根拠として見る。 */
function withoutPhrases(text: string, phrases: string[] | undefined): string {
  if (!phrases?.length) return text;
  return phrases.reduce((current, phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return current.replace(new RegExp(escaped, "gi"), " ");
  }, text);
}

/** 名前が名乗る場面のうち、図に根拠が無いものを返す。 */
function groundlessWords(name: string, evidence: string, locale: "ja" | "en"): string[] {
  const out: string[] = [];
  for (const entry of SCENE_WORDS) {
    // 場面を指さない言い回しは **名前と図の両方から** 取り除く。
    // 図の側に残すと、「生成」 の意味で使われた語が場面の根拠に化ける
    // (`Ethereum block production` を持つ図が、`Production deploy incident` を通してしまう)。
    // 名前の側で打ち切らないのは、同じ名前が別の場面も名乗っている場合に検査を続けるため
    const claimText = withoutPhrases(name, entry.notScene);
    const evidenceText = withoutPhrases(evidence, entry.notScene);
    const claimed = (locale === "ja" ? entry.ja : entry.en).some((w) => hasWord(claimText, w));
    if (!claimed) continue;
    // どちらの言い方でも図にあれば根拠あり
    const grounded = [...entry.ja, ...entry.en].some((w) => hasWord(evidenceText, w));
    if (!grounded) out.push(locale === "ja" ? entry.ja[0] : entry.en[0]);
  }
  return out;
}

/**
 * 画面に出ない値が入っている key。 これらの下は根拠として数えない。
 *
 * **数えると識別子が根拠になる**。 図の id は `interactive-saas-pricing-tier` のように
 * 名前と同じ語を持つため、`SaaS` を名乗る名前が id を根拠に通ってしまう (実測)。
 * 他の図を指す `dependsOn` / `stateId` も同じで、そこにある語は画面に出ない。
 */
const NON_VISIBLE_KEYS = new Set([
  // 識別子と、他の要素を指す参照
  "id", "from", "to", "source", "sourceA", "sourceB", "target", "lane", "parent",
  "dependsOn", "activate", "handlerId", "event", "map",
  // 見た目の指定
  "kind", "shape", "style", "tone", "fill", "stroke", "color", "colors", "accent",
  "theme", "orient", "routing", "align", "side", "fromSide", "toSide", "labelAnchor",
  "format", "variant", "preset",
  // 計算式と表示条件 (画面に出るのは結果の値で、式そのものではない)
  "expression", "formula", "formulas", "guard", "visibleIf",
  // 図の外側の仕掛け
  "scroll", "scrollTriggers", "interactiveHandlers",
]);

/**
 * 画面に出ない値が入っている key の形。 個別に並べるより取りこぼしが少ない。
 *
 * `<何か>Source` は値の出どころ (state の名前) を指し、`<何か>Id` は要素を指し、
 * `<何か>Bind` は結び付け先を指す。 `color<何か>` は色の指定で、いずれも画面には出ない。
 */
const NON_VISIBLE_KEY_PATTERNS = [/Source$/, /Id$/, /Bind$/, /^color[A-Z]/];

function isNonVisibleKey(key: string): boolean {
  return NON_VISIBLE_KEYS.has(key) || NON_VISIBLE_KEY_PATTERNS.some((p) => p.test(key));
}

/**
 * 図から、名前の根拠になりうる文言を全て集める。
 *
 * **表示される field を数え上げず、表示されない key を除く**。 数え上げる形は、拾い漏れた
 * field に根拠がある正しい名前を落とす (実測 = `presetTree` の項目名にある `CEO` / `CTO`、
 * `presetGantt` の担当者名にある `Designer` が漏れていた)。 除く形なら、図に field が
 * 増えても既定で根拠に入る。
 */
function evidenceOf(diagram: unknown): string {
  const parts: string[] = [];
  const seen = new Set<object>();
  const walk = (value: unknown): void => {
    if (typeof value === "string") { parts.push(value); return; }
    if (typeof value !== "object" || value === null) return;
    // 図は同じ節を複数の箱から指すことがあるため、辿った先を覚えて巡回を止める
    if (seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) { for (const child of value) walk(child); return; }
    for (const [key, child] of Object.entries(value)) {
      if (isNonVisibleKey(key)) continue;
      walk(child);
    }
  };
  walk(diagram);
  return parts.join(" ");
}

/** 全 category の図を集める (`parts` は画面側で後から読み込む形なので明示的に足す)。 */
async function allItems(): Promise<Array<{ category: string; item: CatalogItem }>> {
  const out: Array<{ category: string; item: CatalogItem }> = [];
  const byCategory: Record<string, CatalogItem[]> = {
    ...CATALOG_ITEMS,
    parts: await loadPartsItems(),
  };
  for (const [category, items] of Object.entries(byCategory)) {
    for (const item of items) out.push({ category, item });
  }
  return out;
}

describe("一覧の名前の根拠 (#1048)", () => {
  it("日本語名が図の持たない場面を名乗っていない", async () => {
    const items = await allItems();
    // 検査が空振りしていないこと (図を読めていないと 0 件で通ってしまう)
    expect(items.length, "図が 1 件も見つからない").toBeGreaterThan(400);

    const bad: string[] = [];
    for (const { item } of items) {
      // **画面と同じ経路で名前を引く**。 表を直に読むと、表に無い図を検査せず飛ばしてしまう。
      // 画面は表に無い図に export 名をそのまま出すため、そこに場面語があれば見逃す
      const name = itemNameJa(item.title);
      const groundless = groundlessWords(name, evidenceOf(item.diagram), "ja");
      if (groundless.length) bad.push(`${item.title} "${name}" → 図に無い: ${groundless.join(", ")}`);
    }
    expect(bad, `図が持たない場面を名乗る日本語名:\n${bad.join("\n")}`).toHaveLength(0);
  });

  it("英語名が図の持たない場面を名乗っていない", async () => {
    const items = await allItems();
    const bad: string[] = [];
    for (const { item } of items) {
      const name = itemNameEn(item.title);
      const groundless = groundlessWords(name, evidenceOf(item.diagram), "en");
      if (groundless.length) bad.push(`${item.title} "${name}" → 図に無い: ${groundless.join(", ")}`);
    }
    expect(bad, `図が持たない場面を名乗る英語名:\n${bad.join("\n")}`).toHaveLength(0);
  });

  it("画面に出ない値を根拠にしない", () => {
    // 図の識別子や参照は画面に出ないため、そこに語があっても名乗りの根拠にならない。
    // 数えると `interactive-saas-pricing-tier` のような id で `SaaS` の名乗りが通る (実測)
    const hidden = {
      id: "interactive-cto-board",
      topic: "3 人の担当を並べる",
      nodes: [{ id: "a", title: "担当", dependsOn: "CTO" }],
      states: [{ stateId: "CFO", initial: 0 }],
    };
    expect(groundlessWords("CTOの決定", evidenceOf(hidden), "ja"), "参照を根拠にしている").toEqual(["CTO"]);

    // 画面に出る値なら根拠になる (除き過ぎると正しい名前が落ちる)
    const shown = { id: "x", topic: "決めるのは CTO", nodes: [{ id: "a", title: "担当" }] };
    expect(groundlessWords("CTOの決定", evidenceOf(shown), "ja"), "表示される語を落としている").toEqual([]);
  });

  it("語の区切りに数字を含める", () => {
    // 英字だけを区切りにすると `EC2` の中の `EC` に当たる
    expect(groundlessWords("EC注文の一覧", "AWS EC2 instance", "ja")).toEqual(["EC"]);
    expect(groundlessWords("EC注文の一覧", "scene: EC 注文", "ja")).toEqual([]);
  });

  it("場面を指さない言い回しは図の側でも根拠にしない", () => {
    // 図に残すと「生成」 の意味で使われた語が場面の根拠に化ける
    expect(groundlessWords("Production deploy incident", "Ethereum block production", "en")).toEqual(["production"]);
    expect(groundlessWords("Production deploy incident", "Building v1.2.3 for production", "en")).toEqual([]);
    // 名前が非場面の言い回しを含むだけなら名乗りにしない
    expect(groundlessWords("Ethereum block production", "ブロックができるまで", "en")).toEqual([]);
  });

  it("両言語が同じ図に対して同じ判定になる", async () => {
    // 片方だけ直すと、その言語でだけ場面を名乗る名前が残る (#1035 で実際に起きた)
    const items = await allItems();
    const onlyOne = items
      .filter(({ item }) => Boolean(ITEM_NAME_JA[item.title]) !== Boolean(ITEM_NAME_EN[item.title]))
      .map(({ item }) => item.title);
    expect(onlyOne, `片方の言語にしか名前が無い: ${onlyOne.join(", ")}`).toHaveLength(0);
  });
});
