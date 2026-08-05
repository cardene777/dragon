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
import { ITEM_NAME_JA, ITEM_NAME_EN } from "./i18n";

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
const SCENE_WORDS: Array<{ ja: string[]; en: string[] }> = [
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
  // 英語側を持たない語。 `production` は「生成」 の意味でも使われ、場面かどうかを語だけで
  // 決められない (実測 = `Ethereum block production` が本番環境の意味で落ちた)
  { ja: ["本番"], en: [] },
];

/** 英語は語の区切りで見る (見ないと `across` の中の `oss` に当たる、実測)。 */
function hasEnglishWord(haystackLower: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`).test(haystackLower);
}

/** 名前が名乗る場面のうち、図に根拠が無いものを返す。 */
function groundlessWords(name: string, evidence: string, locale: "ja" | "en"): string[] {
  const nameLower = name.toLowerCase();
  const evidenceLower = evidence.toLowerCase();
  const out: string[] = [];
  for (const entry of SCENE_WORDS) {
    const claimed = locale === "ja"
      ? entry.ja.some((w) => name.includes(w))
      : entry.en.some((w) => hasEnglishWord(nameLower, w));
    if (!claimed) continue;
    // どちらの言い方でも図にあれば根拠あり
    const grounded = entry.ja.some((w) => evidence.includes(w))
      || entry.en.some((w) => hasEnglishWord(evidenceLower, w));
    if (!grounded) out.push(locale === "ja" ? entry.ja[0] : entry.en[0]);
  }
  return out;
}

/** 図から、名前の根拠になりうる文言を全て集める。 */
function evidenceOf(diagram: unknown): string {
  const d = diagram as {
    topic?: string;
    nodes?: Array<{ title?: string; subtitle?: string }>;
    readouts?: Array<{ label?: string }>;
    inputs?: Array<{ label?: string; options?: string[] }>;
    phases?: Array<{ title?: string; body?: string }>;
    lanes?: Array<{ label?: string }>;
  };
  const parts: string[] = [d.topic ?? ""];
  for (const lane of d.lanes ?? []) parts.push(lane.label ?? "");
  for (const node of d.nodes ?? []) parts.push(node.title ?? "", node.subtitle ?? "");
  for (const r of d.readouts ?? []) parts.push(r.label ?? "");
  for (const i of d.inputs ?? []) parts.push(i.label ?? "", ...(i.options ?? []));
  for (const p of d.phases ?? []) parts.push(p.title ?? "", p.body ?? "");
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
      const name = ITEM_NAME_JA[item.title];
      if (!name) continue;
      const groundless = groundlessWords(name, evidenceOf(item.diagram), "ja");
      if (groundless.length) bad.push(`${item.title} "${name}" → 図に無い: ${groundless.join(", ")}`);
    }
    expect(bad, `図が持たない場面を名乗る日本語名:\n${bad.join("\n")}`).toHaveLength(0);
  });

  it("英語名が図の持たない場面を名乗っていない", async () => {
    const items = await allItems();
    const bad: string[] = [];
    for (const { item } of items) {
      const name = ITEM_NAME_EN[item.title];
      if (!name) continue;
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
