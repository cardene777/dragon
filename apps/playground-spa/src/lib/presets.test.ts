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
import { PRESETS, presetCatalogKey, presetName, type PresetMetadata } from "./presets";
import { ITEM_NAME_JA, ITEM_NAME_EN } from "./i18n";

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
        if (IDENTIFIER_SHAPES.some((re) => re.test(name))) shaped.push(`${preset.id} (${locale}): ${name}`);
      }
    }
    expect(shaped, `表示名が識別子の形: ${shaped.join(", ")}`).toHaveLength(0);
  });

  it("言語ごとに違う名前を返す", () => {
    // 片方の表しか引いていないと、切り替えても変わらない
    const same = PRESETS.filter((p) => presetName(p, "ja") === presetName(p, "en")).map((p) => p.id);
    expect(same, `言語を切り替えても変わらない: ${same.join(", ")}`).toHaveLength(0);
  });

  it("識別子を画面に出す経路が残っていない", () => {
    // 直す前は `title` を見出しに出していた。 field ごと外したので型が止めるが、
    // `id` / `slug` を代わりに出す形は型では止まらない
    const src = readFileSync(new URL("../pages/PresetDetailPage.tsx", import.meta.url), "utf8");
    // 括弧の中で識別子を出している箇所 (`{preset.id}` 等)。 パンくずの末尾は URL と
    // 対応する位置なので `slug` を出してよい (意図して残している)
    const uses = [...src.matchAll(/\{(?:preset|prevPreset|nextPreset)\.(id|title)\}/g)].map((m) => m[0]);
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
    expect(箱と線を書いた.length, "箱と線の数を書いた説明文が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(縦列を書いた.length, "縦列の数を書いた説明文が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
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
