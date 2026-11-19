/**
 * `lineup-stations.test.ts` から移した見本帳の確かめ (#3763)。
 * 見本帳のappのfileを読み、appが軽い入口を通して全ての種類へ届くので、種類の検査のfileから外し、`kind-playground.test.ts` が読む
 */
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { type Json } from "./diagram-support";
import { type BoardLayout, type BoardRendered, fileText, type Lang, LANGS, parsed, render, ROOT, shapeOf, type Source } from "./lineup-board-support";
import "../src/kinds/basics";
import "../src/kind-use/lineup";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む
const [, { checkText, problemLine }] = await Promise.all([import("../src/render/draw"), import("../src/check")]);

/** 見本帳の見本の一覧と、棚の見本の束と記法の早見と、カタログの種類の頁の見本 */
interface Playground {
  EXAMPLE_KEYS: readonly string[];
  exampleText: (key: string, lang: Lang) => string | undefined;
  LATER_EXAMPLES: { start: () => void; state: () => { status: string } };
  sampleGroups: (lang: Lang, arrived: boolean) => { kind: string; samples: { key: string }[] }[];
  syntaxLines: (lang: Lang) => { id: string; lines: string[] }[];
  samplesOf: (kind: string) => string[];
}

const playgroundFile = (path: string): Promise<object> => import(/* @vite-ignore */ join(ROOT, "apps/playground-spa/src", path));

const { EXAMPLE_KEYS, exampleText, LATER_EXAMPLES, sampleGroups, syntaxLines, samplesOf } = Object.assign(
  {},
  ...(await Promise.all(["examples.ts", "editor/shelf-first.ts", "editor/shelf-items.ts", "catalog/catalog.ts"].map(playgroundFile))),
) as Playground;

/** 流れの線の見本。一般の版を出すまでの流れと、Web3 のコントラクトを監査して配るまでの流れ */
const SAMPLES = ["release-flow", "contract-audit"] as const;

/** 流れの線の置き場所。流れの線で並べていなければ落とす */
const stationsOf = (rendered: BoardRendered, where: string): BoardLayout => shapeOf(rendered, "stations", where);

/** 原本の箱と札と段と段ごとの出来事の数 */
const shapeOfSource = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.lineup?.shape,
  boxes: (d.blocks.box ?? []).map((b) => b.id),
  limits: (d.blocks.box ?? []).map((b) => b.limit ?? null),
  items: (d.blocks.item ?? []).length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.map((e) => e.type)),
});

// 後から読む塊は file を読み込む段で待つ。前処理で 25 ミリ秒ずつ見て待つと、混んだ機械で 1 件 10 秒の上限を超えた (#3759)
const EXAMPLES_READY = await atLoad("見本帳の後から読む見本の塊を待つ", async () => {
  const { whenReady } = (await playgroundFile("site/later.ts")) as { whenReady: (chunk: typeof LATER_EXAMPLES) => Promise<unknown> };
  return whenReady(LATER_EXAMPLES);
});

beforeAll(() => {
  EXAMPLES_READY.get();
});


describe("流れの線の見本と棚 (#3624)", () => {
  it("lineup-stations-examples-in-both-langs-have-no-breaks", () => {
    let backs = 0;
    for (const name of SAMPLES) {
      const sources: Partial<Record<Lang, Source>> = {};
      for (const lang of LANGS) {
        const file = `${name}${lang === "en" ? ".en" : ""}.dragon`;
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        expect(text.split("\n")[0] ?? "", `${file} の最初の行`).toMatch(/^\/\/ /u);
        expect(/#\d+/u.test(text.split("\n")[0] ?? ""), `${file} の最初の注釈の行に作業の番号がある`).toBe(false);
        const source = parsed(text, lang, file) as unknown as Source;
        sources[lang] = source;
        expect(source.lineup?.shape, `${file} の見た目`).toBe("stations");
        const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
        expect(problems, `${file} の崩れの知らせ`).toEqual([]);
        for (const width of [undefined, 390]) {
          const layout = stationsOf(render(source as unknown as Json, lang, width), `${file} (幅 ${width ?? "既定"})`);
          expect(layout.stations?.stops.length, `${file} を幅 ${width ?? "既定"} で描いた駅の数`).toBe(source.blocks.box?.length ?? -1);
          if (lang === "ja" && width === undefined) backs += (layout.backs ?? []).length;
        }
      }
      if (sources.ja && sources.en) expect(shapeOfSource(sources.en), `${name} の英語版の形が日本語版と違う`).toEqual(shapeOfSource(sources.ja));
      expect(EXAMPLE_KEYS.includes(name), `${name} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
      expect(samplesOf("lineup"), `見本帳の列の図の頁に ${name} が無い`).toContain(name);
      for (const lang of LANGS) expect(exampleText(name, lang), `見本帳の ${name} の ${lang} の記法が見本の file と違う`).toBe((fileText(`${name}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
    }
    expect(backs, "流れの線の見本の差し戻しの段の数").toBeGreaterThan(0);
  });

  it("lineup-stations-shelf-template-reads", () => {
    for (const lang of LANGS) {
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(kinds.some((line) => /^lineup <[^>]+> \[shape: stations\]$/u.test(line)), `棚の記法の早見 (${lang}) に lineup の流れの線の頭の行が無い: ${kinds.join(" / ")}`).toBe(true);
      const group = sampleGroups(lang, true).find((g) => g.kind === "lineup");
      expect(group, `棚の見本の束 (${lang}) に列の図の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      for (const name of SAMPLES) {
        expect(keys, `棚の列の図の束 (${lang}) に ${name} が無い`).toContain(name);
        if (!keys.includes(name)) continue;
        expect((parsed(exampleText(name, lang) ?? "", lang, `棚の雛形 ${name} (${lang})`) as unknown as Source).lineup?.shape, `棚の雛形 ${name} (${lang}) の見た目`).toBe("stations");
      }
    }
  });
});
