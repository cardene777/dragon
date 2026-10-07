/**
 * catalog の suffix pair 規約 (`subtitle__<key>` / `sourceYaml__<key>` / `sourceJson__<key>`) を固定する。
 *
 * これらは export 名の綴りだけで diagram と結び付いている。 diagram の export 名を変えたり
 * `subtitle__` を打ち間違えたりすると、 **説明文が孤立して静かに `topic` へ落ちる**。
 * 隣に並べても綴りのずれは目視で気付けない (#952 で説明文を図の直後へ移した後も同じ)。
 *
 * そこで「対応する diagram の無い `subtitle__` が 1 つも無いこと」 を機械で押さえる。
 *
 * ## 群を並べず走査で読む (#2328)
 *
 * 以前は `interactive` / `parts` / `presets` の 3 群だけを回しており、群を選んだ理由も
 * 書かれていなかった。 規約は 14 群すべてに及ぶので、走査した 3 群の対 699 件に対して
 * **残り 611 件が検査の外** に居た (広げた時の孤立は 0 件)。
 */
import { describe, it, expect } from "vitest";
import { CATALOG_ITEMS, loadPartsItems } from "./catalog-items";

type Mod = Record<string, unknown>;

/**
 * カタログの群を走査で読む。
 *
 * **`import.meta.glob(...)` の形のまま書く** = 括弧で包んだり変数に入れたりすると Vite が
 * 走査の対象と見なさない。 走査した群が dir の実体と一致することは
 * `packages/dragon/test/catalog-population.test.ts` が名前で確かめる。
 */
const 群ごと: Record<string, Mod> = import.meta.glob("@/topics/catalog/*.cdl.ts", {
  eager: true,
});

const 群の名 = (path: string): string => path.slice(path.lastIndexOf("/") + 1, -".cdl.ts".length);

/**
 * 名前で 1 群を引く。
 *
 * 下の 2 件は群を名指しで要る (`subtitle__` を持つ群と持たない群を対にして見るため)。
 * 走査から引けない名前は書き間違いなので、その場で止める。
 */
const 群を引く = (名: string): Mod => {
  const 見つけた = Object.entries(群ごと).find(([p]) => 群の名(p) === 名);
  if (!見つけた) throw new Error(`群 ${名} を走査から引けない`);
  return 見つけた[1];
};

/** module から diagram export の key 集合を取る (CatalogItem.title と同じ key)。 */
const diagramKeys = (mod: Mod): Set<string> => {
  const keys = new Set<string>();
  for (const [key, value] of Object.entries(mod)) {
    if (!value || typeof value !== "object") continue;
    const d = value as { id?: unknown; nodes?: unknown };
    if (typeof d.id === "string" && Array.isArray(d.nodes)) keys.add(key);
  }
  return keys;
};

/** module から `<prefix>__<key>` 形式の string export を取る。 */
const pairedKeys = (mod: Mod, prefix: string): Map<string, string> => {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(mod)) {
    if (typeof value !== "string") continue;
    if (key.startsWith(`${prefix}__`)) out.set(key.slice(prefix.length + 2), value);
  }
  return out;
};

describe("catalog の suffix pair 規約", () => {
  const mods: Array<[string, Mod]> = Object.entries(群ごと)
    .map(([p, mod]) => [群の名(p), mod] as [string, Mod])
    .sort((a, b) => (a[0] < b[0] ? -1 : 1));

  it("群を 1 つ以上走査できている (空振り防止)", () => {
    // 0 群だと下の `describe.each` が 1 件も回らず、孤立ゼロが素通りする
    expect(mods.length, "カタログの群を 1 つも走査できていない").toBeGreaterThan(0);
    const 対 = mods.reduce(
      (s, [, mod]) =>
        s +
        ["subtitle", "sourceYaml", "sourceJson"].reduce((t, p) => t + pairedKeys(mod, p).size, 0),
      0,
    );
    expect(対, `群 ${mods.length} 件を走査したが対が 1 件も無い`).toBeGreaterThan(0);
  });

  describe.each(mods)("%s module", (_name, mod) => {
    it.each(["subtitle", "sourceYaml", "sourceJson"])(
      "%s__<key> が全て実在する diagram export に対応する (孤立ゼロ)",
      (prefix) => {
        const keys = diagramKeys(mod);
        const orphans = [...pairedKeys(mod, prefix).keys()].filter((k) => !keys.has(k));
        expect(orphans, `対応する diagram の無い ${prefix}__: ${orphans.join(", ")}`).toEqual([]);
      },
    );
  });

  it("string export が CatalogItem 化されない", () => {
    // `subtitle__` 等は string なので item にならない。 なると一覧に空 card が出る。
    // 一覧が空だと下の繰り返しが 1 度も回らずに通る
    expect(Object.values(CATALOG_ITEMS).length, "見本の一覧が空").toBeGreaterThan(0);
    for (const items of Object.values(CATALOG_ITEMS)) {
      for (const item of items) {
        expect(item.diagram, `${item.id} の diagram が object でない`).toBeTypeOf("object");
      }
    }
  });
});

describe("CatalogItem.subtitle の決まり方", () => {
  it("subtitle__ がある item はその値を使う", () => {
    const subs = pairedKeys(群を引く("interactive"), "subtitle");
    expect(subs.size, "interactive に subtitle__ が 1 つも無い").toBeGreaterThan(0);

    const items = CATALOG_ITEMS.interactive ?? [];
    let checked = 0;
    for (const item of items) {
      const declared = subs.get(item.title);
      if (declared === undefined) continue;
      expect(item.subtitle, `${item.id} の subtitle が subtitle__ と一致しない`).toBe(declared);
      checked++;
    }
    expect(checked, "subtitle__ と照合できた item が 0 件").toBe(subs.size);
  });

  it("subtitle__ が無い item は topic に落ちる", () => {
    const subs = pairedKeys(群を引く("presets"), "subtitle");
    expect(subs.size, "presets は subtitle__ を持たない前提").toBe(0);

    const items = CATALOG_ITEMS.presets ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.subtitle).toBe((item.diagram as { topic?: string }).topic ?? "");
    }
  });

  it("subtitle が空の item が無い (説明文の取りこぼし検知)", () => {
    const empty = (CATALOG_ITEMS.interactive ?? []).filter((i) => i.subtitle.length === 0);
    expect(
      empty.map((i) => i.id),
      "subtitle が空の interactive item",
    ).toEqual([]);
  });
});

describe("topic は図の題名として扱える長さに収まる", () => {
  // cdl の seo-metadata-quality axis が 60 字を上限に見る。 説明文を topic に書くと超える。
  const SEO_MAX_TOPIC = 60;

  it("static category の topic が全て 60 字以内", () => {
    const over: string[] = [];
    for (const [category, items] of Object.entries(CATALOG_ITEMS)) {
      for (const item of items) {
        const topic = (item.diagram as { topic?: string }).topic ?? "";
        if (topic.trim().length > SEO_MAX_TOPIC) {
          over.push(`[${category}] ${item.id} (${topic.trim().length} 字)`);
        }
      }
    }
    expect(over, `topic が 60 字を超える図:\n${over.join("\n")}`).toEqual([]);
  });

  it("lazy-load する parts の topic も 60 字以内", async () => {
    const items = await loadPartsItems();
    expect(items.length).toBeGreaterThan(0);
    const over = items
      .map((i) => [i.id, ((i.diagram as { topic?: string }).topic ?? "").trim()] as const)
      .filter(([, t]) => t.length > SEO_MAX_TOPIC)
      .map(([id, t]) => `${id} (${t.length} 字)`);
    expect(over, `topic が 60 字を超える図:\n${over.join("\n")}`).toEqual([]);
  });
});

describe("見本帳の階層・図表・数・工程は宅配の筋書きで揃う (#2837)", () => {
  const 宅配の見本 = {
    deliveryOfficeTree: ["営業所の階層", ["本社", "東日本", "東京", "福岡"]],
    redeliveryIdeasMind: ["再配達を減らす", ["置き配", "宅配ロッカー", "夜の便", "職場に届ける"]],
    branchParcelsBar: ["営業所ごとの取扱数", ["東京", "680", "札幌", "150"]],
    monthlyDeliveriesLine: ["月ごとの配達数", ["6月", "900", "10月", "1750"]],
    parcelStatusPie: ["荷物の状態", ["配達中", "270", "完了", "796"]],
    orderToDeliveryFunnel: ["申し込みから届くまで", ["見た", "12000", "届いた", "2750"]],
    measureEffortQuadrant: ["打ち手の手間と効き目", ["置き配", "前日に知らせる", "夜の便"]],
    onTimeRateSlope: ["営業所ごとの定時率", ["東京", "88", "大阪", "80"]],
    onTimeShareGauge: ["定時に届いた割合", ["定時に届いた", "78", "先月より +6"]],
    parcelSizeWaffle: ["荷物の大きさ", ["小さい", "52", "大きい", "17"]],
    deliveryResultStacked: ["配達の結果", ["一度で届いた", "再配達", "戻った"]],
    sortingShelfGantt: ["仕分け棚を入れ替える工程", ["調べる", "棚を作る", "本番"]],
    shipperFeelingJourney: ["荷主の気持ち", ["申し込む", "不在だった", "受け取る"]],
  } as const;

  it("charts に新しい 13 件が名前の literal で登録されている", () => {
    const charts = CATALOG_ITEMS.charts ?? [];
    const 登録 = new Map(charts.map((item) => [item.title, item]));
    expect(Object.keys(宅配の見本)).toHaveLength(13);
    expect(
      Object.keys(宅配の見本).filter((鍵) => !登録.has(鍵)),
      "宅配の見本として登録されていない鍵",
    ).toEqual([]);
  });

  it.each(Object.entries(宅配の見本))("%s の題と表示語が宅配の見本どおり", (鍵, [題, 語]) => {
    const item = (CATALOG_ITEMS.charts ?? []).find((候補) => 候補.title === 鍵);
    expect(item, `${鍵} が charts に無い`).toBeDefined();
    expect(item!.diagram.topic).toBe(題);
    const 記法 = `${item!.sourceYaml ?? ""}\n${item!.sourceJson ?? ""}`;
    for (const 一語 of 語) expect(記法, `${鍵} に ${一語} が無い`).toContain(一語);
  });

  const charts = 群を引く("charts");
  const YAML = pairedKeys(charts, "sourceYaml");
  const JSON = pairedKeys(charts, "sourceJson");
  const 記法を引く = (鍵: string): string => {
    const yaml = YAML.get(鍵);
    const json = JSON.get(鍵);
    expect(yaml, `${鍵} の YAML が無い`).toBeDefined();
    expect(json, `${鍵} の JSON が無い`).toBeDefined();
    return `${yaml ?? ""}\n${json ?? ""}`;
  };

  it.each(["sortingShelfGantt", "pattern__sortingShelfGantt__帯だけ"])(
    "%s の工程を月へ丸め、主役とそれ以外の色を分ける",
    (鍵) => {
      const 記法 = 記法を引く(鍵);
      for (const [名前, 始まり, tone] of [
        ["調べる", "6月", "info"],
        ["設計する", "7月", "accent"],
        ["棚を作る", "8月", "accent"],
        ["端末を入れる", "8月", "info"],
        ["試す", "9月", "accent"],
      ] as const) {
        expect(記法, `${鍵} の ${名前}`).toContain(名前);
        expect(記法, `${鍵} の ${名前} の始まり`).toMatch(
          new RegExp(`${名前}[^\\n]+${始まり}`, "u"),
        );
        expect(記法, `${鍵} の ${名前} の tone`).toMatch(
          new RegExp(`${名前}[^\\n]+tone["']?\\s*:\\s*["']?${tone}`, "u"),
        );
      }
      expect(記法).toMatch(/本番[^\n]+10月/u);
    },
  );

  it.each([
    "branchParcelsBar",
    "pattern__branchParcelsBar__前の値つき",
    "parcelStatusPie",
    "pattern__parcelStatusPie__前と今",
    "redeliveryIdeasMind",
    "pattern__redeliveryIdeasMind__説明つき",
    "onTimeShareGauge",
    "pattern__onTimeShareGauge__前の値つき",
    "parcelSizeWaffle",
    "deliveryResultStacked",
    "pattern__deliveryResultStacked__今だけ",
  ])("%s は系列色を意匠の並びに任せる", (鍵) => {
    expect(記法を引く(鍵), `${鍵} に tone が残っている`).not.toMatch(/\btone\s*[:=]/u);
  });

  it.each([
    "shipperFeelingJourney",
    "pattern__shipperFeelingJourney__接点つき",
    "pattern__shipperFeelingJourney__5つの気持ち",
  ])("%s の谷の札は固定幅に収まる語にする", (鍵) => {
    const 記法 = 記法を引く(鍵);
    expect(記法).toMatch(/opportunity[^\n]+不在票に気づかず/u);
    expect(記法).not.toMatch(/opportunity[^\n]+不在票に気づかなかった/u);
  });
});
