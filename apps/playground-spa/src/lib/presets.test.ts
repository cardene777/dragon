/** @vitest-environment node */

/**
 * preset の表示名が、catalog と同じ名前の表から引けることの検証 (#1047)。
 *
 * preset 詳細ページは `PRESETS` という別の入れ物を持ち、見出しに `stateMachine2` の
 * ような **識別子風の文字列** をそのまま出していた。 言語を切り替えても変わらなかった。
 *
 * 表示名は catalog の名前の表を引いて出す。 引く鍵は `id` から導くため、
 * **導けなくなった時に静かに外れる**。 それをここで止める。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { CdlDiagramView, type CdlDiagram } from "@cardenelabs/cdl";
import { jsonToDiagram, parseTextDslV05, textDslToDiagram } from "@cardenelabs/dragon";
import * as presetCatalog from "@/topics/catalog/presets.cdl";
import { PRESETS, presetCatalogKey, presetName, type PresetMetadata } from "./presets";
import { ITEM_NAME_JA, ITEM_NAME_EN } from "./i18n";
import { ITEM_SUBTITLE_EN } from "./catalog-item-en";
import { PHASE_TITLE_EN } from "./catalog-phase-en";

/** 英語の小文字の語 (2 字以上)。 大文字の略語 (UML / ER / API) は固有の呼び名なので当たらない */
const 英小文字の語 = /[a-z]{2,}/;

/** ひらがな・カタカナ・漢字 */
const 日本語の字 = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 説明文と札のうち、英語の小文字の語を含むもの。 本番と植え込み対照が同じ関数を使う */
function 英語の混ざる所(p: PresetMetadata): string[] {
  const out: string[] = [];
  if (英小文字の語.test(p.subtitle)) out.push(`${p.id}.subtitle: ${p.subtitle}`);
  for (const t of p.tags) if (英小文字の語.test(t)) out.push(`${p.id}.tags: ${t}`);
  return out;
}

/**
 * 分類名 (`eyebrow`) のうち、直っていないもの。 本番と植え込み対照が同じ関数を使う。
 *
 * 分類名は名前のすぐ上に出るため、名前や札の言い換えだと同じことを 2 度読ませる。
 * 英字が残っていないことと、名前・札をなぞっていないことの両方を見る。
 */
function 分類名の難あり(p: PresetMetadata): string[] {
  const out: string[] = [];
  if (/[A-Za-z]/.test(p.eyebrow)) out.push(`${p.id}.eyebrow に英字: ${p.eyebrow}`);
  if (!日本語の字.test(p.eyebrow)) out.push(`${p.id}.eyebrow に日本語が無い: ${p.eyebrow}`);
  const 名前 = [presetName(p, "ja"), presetName(p, "en")];
  for (const 語 of p.eyebrow.split("/").map((s) => s.trim())) {
    if (名前.includes(語)) out.push(`${p.id}.eyebrow が図の名前と同じ: ${語}`);
    if (p.tags.includes(語)) out.push(`${p.id}.eyebrow が札と同じ: ${語}`);
  }
  return out;
}

/**
 * 説明文が書く数の形。 箱と線の数 (ER 図とクラス図) と、縦列の数。
 *
 * 縦列は #1929 で `3 レーン` から `3 つの縦列` に書き換えた。 形を変えずに残すと、書き換えた
 * 説明文がこの照合に 1 件も当たらなくなり、数が図と食い違っても通る。
 */
const 箱と線の数 = /(\d+) (?:表|クラス) × (\d+) 関係/;
const 縦列の数 = /(\d+) つの縦列/;

/** 説明文に書いた数のうち、図の実物と合わないもの */
function 数の食い違い(p: PresetMetadata): string[] {
  const out: string[] = [];
  const 箱 = p.diagram.nodes?.length ?? 0;
  const 線 = p.diagram.edges?.length ?? 0;
  const レーン = p.diagram.lanes?.length ?? 0;
  const m = p.subtitle.match(箱と線の数);
  if (m && Number(m[1]) !== 箱) out.push(`${p.id}: 箱を ${m[1]} と書いたが図は ${箱}`);
  if (m && Number(m[2]) !== 線) out.push(`${p.id}: 関係を ${m[2]} と書いたが図は ${線}`);
  const l = p.subtitle.match(縦列の数);
  if (l && Number(l[1]) !== レーン) out.push(`${p.id}: 縦列を ${l[1]} と書いたが図は ${レーン}`);
  return out;
}

describe("preset の表示名 (#1047)", () => {
  it("全ての preset が両言語の名前を持つ", () => {
    expect(PRESETS.length, "preset が 1 件も無い").toBeGreaterThan(15);
    const missing: string[] = [];
    for (const preset of PRESETS) {
      const key = presetCatalogKey(preset);
      if (!ITEM_NAME_JA[key]) missing.push(`${preset.id} → ${key} の日本語名が無い`);
      if (!ITEM_NAME_EN[key]) missing.push(`${preset.id} → ${key} の英語名が無い`);
    }
    expect(missing, `名前を引けない preset:\n${missing.join("\n")}`).toHaveLength(0);
  });

  it("表示名がこの図の識別子と一致しない", () => {
    // **形ではなく値で見る**。 形だけで見ると、識別子の書き方が変わった時
    // (kebab / snake / 数字始まり) にすり抜ける
    const identifierLike: string[] = [];
    for (const preset of PRESETS) {
      const identifiers = [preset.id, preset.slug, presetCatalogKey(preset)];
      for (const locale of ["ja", "en"] as const) {
        const name = presetName(preset, locale);
        if (identifiers.includes(name)) identifierLike.push(`${preset.id} (${locale}): ${name}`);
      }
    }
    expect(identifierLike, `表示名が識別子と同じ: ${identifierLike.join(", ")}`).toHaveLength(0);
  });

  it("表示名が識別子の形をしていない", () => {
    // 値の一致だけでは、別の識別子 (他の図の `id` 等) が出る形を捕まえられない。
    // 識別子の書き方を 3 種まとめて見る
    const IDENTIFIER_SHAPES = [
      /^[a-z][A-Za-z0-9]*$/, // camelCase / 小文字 1 語
      /^[a-z0-9]+([-_][a-z0-9]+)+$/, // kebab-case / snake_case
      /^[0-9]/, // 数字始まり
    ];
    const shaped: string[] = [];
    for (const preset of PRESETS) {
      for (const locale of ["ja", "en"] as const) {
        const name = presetName(preset, locale);
        if (IDENTIFIER_SHAPES.some((re) => re.test(name)))
          shaped.push(`${preset.id} (${locale}): ${name}`);
      }
    }
    expect(shaped, `表示名が識別子の形: ${shaped.join(", ")}`).toHaveLength(0);
  });

  it("言語ごとに違う名前を返す", () => {
    // 片方の表しか引いていないと、切り替えても変わらない
    const same = PRESETS.filter((p) => presetName(p, "ja") === presetName(p, "en")).map(
      (p) => p.id,
    );
    expect(same, `言語を切り替えても変わらない: ${same.join(", ")}`).toHaveLength(0);
  });

  it("識別子を画面に出す経路が残っていない", () => {
    // 直す前は `title` を見出しに出していた。 field ごと外したので型が止めるが、
    // `id` / `slug` を代わりに出す形は型では止まらない
    const src = readFileSync(new URL("../pages/PresetDetailPage.tsx", import.meta.url), "utf8");
    // 括弧の中で識別子を出している箇所 (`{preset.id}` 等)。 パンくずの末尾は URL と
    // 対応する位置なので `slug` を出してよい (意図して残している)
    const uses = [...src.matchAll(/\{(?:preset|prevPreset|nextPreset)\.(id|title)\}/g)].map(
      (m) => m[0],
    );
    expect(uses, `識別子を画面に出している: ${uses.join(", ")}`).toHaveLength(0);
  });
});

/**
 * 詳細画面の説明文と札 (#1777)。
 *
 * 説明文が作った側の覚え書き (「3 lane 自動配置。 laneId(label) で slug 参照、…」) のまま出ており、
 * 図が何を示すかを言っていなかった。 札も `auto layout` `saas` のような英語の小文字だった。
 */
describe("詳細画面の説明文と札 (#1777)", () => {
  it("説明文と札に英語の小文字の語が無い", () => {
    expect(PRESETS.length, "preset が 1 件も無い (検査が空振りしている)").toBeGreaterThan(15);
    const 混ざる = PRESETS.flatMap(英語の混ざる所);
    expect(混ざる, `英語の小文字の語が混ざる:\n${混ざる.join("\n")}`).toEqual([]);
  });

  it("英語の小文字の語を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上は必ず通る。 土台は本番の字に依らない形にする
    const 元 = { ...PRESETS[0]!, subtitle: "役割ごとに分けた図。", tags: ["縦列"] };
    expect(英語の混ざる所(元), "土台に英語が混ざっている").toEqual([]);
    expect(英語の混ざる所({ ...元, subtitle: "3 lane 自動配置。" })).toHaveLength(1);
    expect(英語の混ざる所({ ...元, tags: ["auto layout"] })).toHaveLength(1);
    // 大文字の略語は固有の呼び名なので拾わない
    expect(英語の混ざる所({ ...元, subtitle: "UML の図。", tags: ["UML"] })).toEqual([]);
  });

  it("見出しの上の分類名が日本語で、名前や札をなぞらない (#1783)", () => {
    // 直す前は `SWIMLANE / LAYOUT` のような英語の大文字で、名前と説明文の間に
    // 英語の 1 行だけが挟まっていた
    const 走査 = PRESETS.map(分類名の難あり);
    expect(走査.length, "分類名を 1 件も見ていない (検査が空振りしている)").toBe(PRESETS.length);
    const 難あり = 走査.flat();
    expect(難あり, `分類名が直っていない:\n${難あり.join("\n")}`).toEqual([]);
  });

  it("分類名の難を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上は必ず通る。 4 つの難を 1 つずつ植える
    const 元 = PRESETS.find((p) => p.id === "swimlane")!;
    expect(分類名の難あり(元), "直したままの分類名を難と読む").toEqual([]);
    expect(分類名の難あり({ ...元, eyebrow: "SWIMLANE / LAYOUT" })).toHaveLength(2);
    expect(分類名の難あり({ ...元, eyebrow: "スイムレーン / 担当の切り分け" })).toHaveLength(1);
    expect(分類名の難あり({ ...元, eyebrow: "流れの図 / 縦列" })).toHaveLength(1);
    expect(分類名の難あり({ ...元, eyebrow: "123 / 456" })).toHaveLength(1);
  });

  it("説明文に書いた数が図の数と合う", () => {
    // **形ごとに下限を置く** = 合わせて 1 件以上だと、片方の形が書き換えで 1 件も当たらなく
    // なっても もう片方だけで通る (#1929 で縦列の側が実際にそうなりかけた)
    const 箱と線を書いた = PRESETS.filter((p) => 箱と線の数.test(p.subtitle));
    const 縦列を書いた = PRESETS.filter((p) => 縦列の数.test(p.subtitle));
    expect(
      箱と線を書いた.length,
      "箱と線の数を書いた説明文が 1 つも無い (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(
      縦列を書いた.length,
      "縦列の数を書いた説明文が 1 つも無い (検査が空振りしている)",
    ).toBeGreaterThan(0);
    const 食い違う = PRESETS.flatMap(数の食い違い);
    expect(食い違う, `説明文の数が図と合わない:\n${食い違う.join("\n")}`).toEqual([]);
  });

  it("数の食い違いを拾える (植え込み対照)", () => {
    // 箱・線・縦列の 3 つを 1 つずつずらす = どれか 1 つの照合が死んでいれば、その行が落ちる
    const クラス図 = PRESETS.find((p) => p.id === "classDiagram")!;
    const 泳ぎ線 = PRESETS.find((p) => p.id === "swimlane")!;
    expect(数の食い違い(クラス図), "直したままの説明文を食い違いと読む").toEqual([]);
    expect(数の食い違い({ ...クラス図, subtitle: "8 クラス × 6 関係。" })).toHaveLength(1);
    expect(数の食い違い({ ...クラス図, subtitle: "7 クラス × 5 関係。" })).toHaveLength(1);
    expect(数の食い違い(泳ぎ線), "直したままの説明文を食い違いと読む").toEqual([]);
    expect(数の食い違い({ ...泳ぎ線, subtitle: "4 つの縦列で分ける図。" })).toHaveLength(1);
  });
});
const 宅配のひな形 = [
  {
    key: "presetDeliveryFlow",
    id: "deliveryFlow",
    slug: "delivery-flow",
    diagramId: "delivery-flow-demo",
    title: "荷物を届ける流れ",
    ja: "荷物を届けるフローチャート",
    en: "Parcel delivery flowchart",
  },
  {
    key: "presetDeliveryStages",
    id: "deliveryStages",
    slug: "delivery-stages",
    diagramId: "delivery-stages-demo",
    title: "荷物を届ける段階",
    ja: "荷物を届ける段の箱",
    en: "Parcel delivery stages",
  },
  {
    key: "presetDeliveryMetro",
    id: "deliveryMetro",
    slug: "delivery-metro",
    diagramId: "delivery-metro-demo",
    title: "荷物を届ける路線",
    ja: "荷物を届ける路線図",
    en: "Parcel delivery metro map",
  },
  {
    key: "presetDeliveryTimeline",
    id: "deliveryTimeline",
    slug: "delivery-timeline",
    diagramId: "delivery-timeline-demo",
    title: "荷物を届ける順番",
    ja: "荷物を届ける時間軸",
    en: "Parcel delivery timeline",
  },
] as const;

type 宅配の鍵 = (typeof 宅配のひな形)[number]["key"];

function exportを引く(name: string): unknown {
  return presetCatalog[name as keyof typeof presetCatalog];
}

function 記法を引く(key: 宅配の鍵): { yaml: string; json: string; diagram: CdlDiagram } {
  const yaml = exportを引く(`sourceYaml__${key}`);
  const json = exportを引く(`sourceJson__${key}`);
  const diagram = exportを引く(key);
  expect(yaml, `${key} の YAML が無い`).toEqual(expect.any(String));
  expect(json, `${key} の JSON が無い`).toEqual(expect.any(String));
  expect(diagram, `${key} の図が無い`).toBeDefined();
  return { yaml: yaml as string, json: json as string, diagram: diagram as CdlDiagram };
}

describe("宅配のひな形 4 件 (#2835)", () => {
  it.each(宅配のひな形)("$key が id / slug と YAML・JSON の対を持つ", (item) => {
    const preset = PRESETS.find((p) => p.id === item.id);
    expect(preset?.slug).toBe(item.slug);

    const { yaml, json, diagram } = 記法を引く(item.key);
    expect(diagram).toEqual({ ...textDslToDiagram(yaml), id: item.diagramId });
    expect({ ...jsonToDiagram(JSON.parse(json)), id: item.diagramId }).toEqual(diagram);
    expect(diagram.topic).toBe(item.title);
  });

  it.each(宅配のひな形)("$key が宅配の担当 3 つ・印を除く段 8 つ・分かれ道 1 つを持つ", (item) => {
    const { yaml } = 記法を引く(item.key);
    const parsed = parseTextDslV05(yaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect([
      ...new Set(
        parsed.doc.actors.map((actor) =>
          actor.lane === undefined
            ? undefined
            : (parsed.doc.lanes?.[actor.lane]?.label ?? actor.lane),
        ),
      ),
    ]).toEqual(["荷主", "営業所", "配送便"]);
    expect(
      parsed.doc.actors.filter((actor) => actor.kind !== "mark-start" && actor.kind !== "mark-end"),
    ).toHaveLength(8);
    expect(parsed.doc.actors.filter((actor) => actor.kind === "decision")).toHaveLength(1);
  });

  it.each(宅配のひな形)("$key の日本語名・英語名・説明・段の題を英語表から引ける", (item) => {
    expect(ITEM_NAME_JA[item.key]).toBe(item.ja);
    expect(ITEM_NAME_EN[item.key]).toBe(item.en);
    expect(ITEM_SUBTITLE_EN[item.key]).toEqual(expect.any(String));

    const { diagram } = 記法を引く(item.key);
    for (const phase of diagram.phases) {
      expect(PHASE_TITLE_EN[phase.title], `${item.key} の段「${phase.title}」の英訳が無い`).toEqual(
        expect.any(String),
      );
    }
  });
});

type 要素の照合 = {
  key: 宅配の鍵;
  element: string;
  expected: number;
  selector: string;
  drawable: boolean;
  reason?: string;
};

/**
 * 見本の要素を最終段の DOM と照合する表。
 *
 * 描けない行は専用の selector が 0 件である間だけ残せる。描画側が対応して 1 件でも現れたら
 * 検査が落ち、この宣言を外して通常の件数照合へ移すよう知らせる。
 */
const 宅配の要素: readonly 要素の照合[] = [
  {
    key: "presetDeliveryFlow",
    element: "縦列の見出し",
    expected: 3,
    selector: '[data-cdl-role="flow-lane-heading"]',
    drawable: false,
    reason: "流れ図の縦列の見出しは描く側 (cdl) で直す",
  },
  {
    key: "presetDeliveryFlow",
    element: "縦列の区切り",
    expected: 2,
    selector: '[data-cdl-role="flow-lane-divider"]',
    drawable: false,
    reason: "流れ図の縦列の区切りは描く側 (cdl) で直す",
  },
  {
    key: "presetDeliveryFlow",
    element: "段階の列",
    expected: 0,
    selector: '[data-cdl-role="stage-column"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "段",
    expected: 7,
    selector: '[data-cdl-kind="function"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "札の右の小さな字",
    expected: 0,
    selector: '[data-cdl-role="stage-note"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "分かれ道",
    expected: 1,
    selector: '[data-cdl-kind="decision"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "始まりの印",
    expected: 1,
    selector: '[data-cdl-kind="mark-start"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "終わりの印",
    expected: 1,
    selector: '[data-cdl-kind="mark-end"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "はい / いいえの札",
    expected: 2,
    selector: '[data-cdl-role="edge-label"]:はい|いいえ',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "戻る点線と札",
    expected: 1,
    selector: '[data-cdl-edge-label="翌日もう一度"] [data-cdl-role="edge-line"][stroke-dasharray]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "札と丸を繋ぐ細い点線",
    expected: 0,
    selector: '[data-cdl-role="timeline-leader"]',
    drawable: true,
  },
  {
    key: "presetDeliveryFlow",
    element: "凡例の項目",
    expected: 4,
    selector: '[data-cdl-role="legend-item"]',
    drawable: true,
  },

  {
    key: "presetDeliveryStages",
    element: "縦列の見出し",
    expected: 0,
    selector: '[data-cdl-role="metro-lane-badge"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "縦列の区切り",
    expected: 0,
    selector: '[data-cdl-role="metro-lane-guide"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "段階の列",
    expected: 4,
    selector: '[data-cdl-role="stage-column"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "段",
    expected: 8,
    selector: '[data-cdl-kind="card"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "札の右の小さな字",
    expected: 8,
    selector: '[data-cdl-role="stage-note"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "分かれ道",
    expected: 1,
    selector: '[data-cdl-role="stage-note"]:分かれ道',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "始まりの印",
    expected: 0,
    selector: '[data-cdl-kind="mark-start"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "終わりの印",
    expected: 0,
    selector: '[data-cdl-kind="mark-end"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "はい / いいえの札",
    expected: 2,
    selector: '[data-cdl-role="edge-label"]:はい|いいえ',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "戻る点線と札",
    expected: 1,
    selector: '[data-cdl-edge-label="翌日もう一度"] [data-cdl-role="edge-line"][stroke-dasharray]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "札と丸を繋ぐ細い点線",
    expected: 0,
    selector: '[data-cdl-role="timeline-leader"]',
    drawable: true,
  },
  {
    key: "presetDeliveryStages",
    element: "凡例の項目",
    expected: 3,
    selector: '[data-cdl-role="legend-item"]',
    drawable: true,
  },

  {
    key: "presetDeliveryMetro",
    element: "縦列の見出し",
    expected: 3,
    selector: '[data-cdl-role="metro-lane-badge"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "縦列の区切り",
    expected: 3,
    selector: '[data-cdl-role="metro-lane-guide"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "段階の列",
    expected: 0,
    selector: '[data-cdl-role="stage-column"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "段",
    expected: 7,
    selector: '[data-cdl-kind="station"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "札の右の小さな字",
    expected: 0,
    selector: '[data-cdl-role="stage-note"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "分かれ道",
    expected: 1,
    selector: '[data-cdl-kind="decision"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "始まりの印",
    expected: 1,
    selector: '[data-cdl-kind="mark-start"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "終わりの印",
    expected: 1,
    selector: '[data-cdl-kind="mark-end"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "はい / いいえの札",
    expected: 2,
    selector: '[data-cdl-role="edge-label"]:はい|いいえ',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "戻る点線と札",
    expected: 1,
    selector: '[data-cdl-edge-label="翌日もう一度"] [data-cdl-role="edge-line"][stroke-dasharray]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "札と丸を繋ぐ細い点線",
    expected: 0,
    selector: '[data-cdl-role="timeline-leader"]',
    drawable: true,
  },
  {
    key: "presetDeliveryMetro",
    element: "凡例の項目",
    expected: 4,
    selector: '[data-cdl-role="legend-item"]',
    drawable: true,
  },

  {
    key: "presetDeliveryTimeline",
    element: "縦列の見出し",
    expected: 0,
    selector: '[data-cdl-role="metro-lane-badge"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "縦列の区切り",
    expected: 0,
    selector: '[data-cdl-role="metro-lane-guide"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "段階の列",
    expected: 0,
    selector: '[data-cdl-role="stage-column"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "段",
    expected: 13,
    selector: '[data-cdl-kind="timeline-number"], [data-cdl-kind="card"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "札の右の小さな字",
    expected: 7,
    selector: '[data-cdl-role="stage-note"], [data-cdl-node="持ち戻る"] [data-cdl-role="node-subtitle"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "分かれ道",
    expected: 1,
    selector: '[data-cdl-kind="decision"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "始まりの印",
    expected: 0,
    selector: '[data-cdl-kind="mark-start"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "終わりの印",
    expected: 1,
    selector: '[data-cdl-kind="mark-end"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "はい / いいえの札",
    expected: 2,
    selector: '[data-cdl-role="edge-label"]:はい|いいえ',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "戻る点線と札",
    expected: 1,
    selector: '[data-cdl-edge-label="翌日もう一度"] [data-cdl-role="edge-line"][stroke-dasharray]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "札と丸を繋ぐ細い点線",
    expected: 6,
    selector: '[data-cdl-role="timeline-leader"]',
    drawable: true,
  },
  {
    key: "presetDeliveryTimeline",
    element: "凡例の項目",
    expected: 3,
    selector: '[data-cdl-role="legend-item"]',
    drawable: true,
  },
];

function selectorで数える(svgDocument: Document, selector: string): number {
  const 文字条件 = selector.match(/:(はい\|いいえ|分かれ道)$/);
  if (!文字条件) return svgDocument.querySelectorAll(selector).length;

  const css = selector.slice(0, -文字条件[0].length);
  const nodes = [...svgDocument.querySelectorAll(css)];
  const choices = 文字条件[1]?.split("|") ?? [];
  return nodes.filter((node) => choices.includes(node.textContent?.trim() ?? "")).length;
}

describe("宅配のひな形と見本の形の要素 (#2835)", () => {
  for (const item of 宅配のひな形) {
    const rows = 宅配の要素.filter((row) => row.key === item.key);
    it(`${item.key} の表が 12 要素を漏れなく持つ`, () => {
      expect(rows).toHaveLength(12);
    });

    it(`${item.key} の最終段に描ける要素が見本と同じ数だけある`, () => {
      const { diagram } = 記法を引く(item.key);
      const markup = renderToStaticMarkup(
        createElement(CdlDiagramView, {
          diagram,
          focusPhaseId: diagram.phases.at(-1)?.id,
        }),
      );
      const svgDocument = new JSDOM(markup).window.document;
      const 描ける = rows.filter((entry) => entry.drawable);
      expect(描ける.length, "描ける要素を 1 件も照合していない").toBeGreaterThan(0);
      for (const row of 描ける) {
        expect(
          selectorで数える(svgDocument, row.selector),
          `${row.element}: ${row.selector}`,
        ).toBe(row.expected);
      }
    });
  }

  it("流れの送り状を起こすから便に積むまでを段差の無い横線で結ぶ", () => {
    const { diagram } = 記法を引く("presetDeliveryFlow");
    const markup = renderToStaticMarkup(
      createElement(CdlDiagramView, {
        diagram,
        focusPhaseId: diagram.phases.at(-1)?.id,
      }),
    );
    const svgDocument = new JSDOM(markup).window.document;
    const path = svgDocument.querySelector(
      '[data-cdl-edge][data-cdl-from="送り状を起こす"][data-cdl-to="便に積む"]',
    );
    const d = path?.getAttribute("data-cdl-path-d") ?? "";
    const 点 = [...d.matchAll(/[ML]\s*(-?[\d.]+)\s*(-?[\d.]+)/g)].map((match) => ({
      x: Number(match[1]),
      y: Number(match[2]),
    }));

    expect(d, "対象の path を読めない").not.toBe("");
    expect(点).toHaveLength(2);
    expect(点[0]?.y).toBe(点[1]?.y);
  });

  it("描けない宣言は理由を持ち、DOM が現れたら外す", () => {
    const 描けない = 宅配の要素.filter((entry) => !entry.drawable);
    expect(描けない.length, "描けない宣言を 1 件も照合していない").toBeGreaterThan(0);
    for (const row of 描けない) {
      const { diagram } = 記法を引く(row.key);
      const markup = renderToStaticMarkup(
        createElement(CdlDiagramView, {
          diagram,
          focusPhaseId: diagram.phases.at(-1)?.id,
        }),
      );
      const svgDocument = new JSDOM(markup).window.document;
      expect(row.reason).toEqual(expect.any(String));
      expect(row.reason).toContain("描く側 (cdl) で直す");
      expect(
        selectorで数える(svgDocument, row.selector),
        `${row.element} を描く DOM が現れたため、描けない宣言を外して ${row.expected} 件を照合する`,
      ).toBe(0);
    }
  });
});
