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
const SCENE_WORDS: Array<{ ja: string[]; en: string[]; notScene?: string[] }> = [
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
 */
function hasWord(haystack: string, word: string): boolean {
  if (!/[a-z]/i.test(word)) return haystack.includes(word);
  const escaped = word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`).test(haystack.toLowerCase());
}

/** 名前が名乗る場面のうち、図に根拠が無いものを返す。 */
function groundlessWords(name: string, evidence: string, locale: "ja" | "en"): string[] {
  const out: string[] = [];
  for (const entry of SCENE_WORDS) {
    // 場面を指さない言い回しは名乗りとみなさない (`block production` は「生成」 の意味)
    if (entry.notScene?.some((phrase) => hasWord(name, phrase))) continue;
    const claimed = (locale === "ja" ? entry.ja : entry.en).some((w) => hasWord(name, w));
    if (!claimed) continue;
    // どちらの言い方でも図にあれば根拠あり
    const grounded = [...entry.ja, ...entry.en].some((w) => hasWord(evidence, w));
    if (!grounded) out.push(locale === "ja" ? entry.ja[0] : entry.en[0]);
  }
  return out;
}

/**
 * 画面に出ない値が入っている key。 これらの下は根拠として数えない。
 *
 * **数えると識別子が根拠になる**。 図の id は `interactive-saas-pricing-tier` のように
 * 名前と同じ語を持つため、`SaaS` を名乗る名前が id を根拠に通ってしまう (実測)。
 */
const NON_VISIBLE_KEYS = new Set([
  "id", "kind", "shape", "style", "tone", "fill", "stroke", "color", "accent",
  "from", "to", "source", "target", "lane", "parent", "handlerId", "event",
  "format", "align", "side", "variant", "preset",
]);

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
      if (NON_VISIBLE_KEYS.has(key)) continue;
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

  it("両言語が同じ図に対して同じ判定になる", async () => {
    // 片方だけ直すと、その言語でだけ場面を名乗る名前が残る (#1035 で実際に起きた)
    const items = await allItems();
    const onlyOne = items
      .filter(({ item }) => Boolean(ITEM_NAME_JA[item.title]) !== Boolean(ITEM_NAME_EN[item.title]))
      .map(({ item }) => item.title);
    expect(onlyOne, `片方の言語にしか名前が無い: ${onlyOne.join(", ")}`).toHaveLength(0);
  });
});
