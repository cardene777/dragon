/**
 * `player.test.ts` が置いた図と比べる側の配置と時刻の表を、1 回の実行の準備の段で描いて済ませる (#3734)。
 *
 * 箱を開いた配管の図 (aggregator) は 1 回描くだけで CPU を 0.8 秒から 1.8 秒使い、jsdom で置く仕事と比べる側を描く仕事を 1 件で行うと、
 * 混んだ機械で 1 件の上限 (10 秒) を超えた。件の中には、確かめる中身である jsdom で図を置く仕事だけを残す。
 * 比べる側は、件の中で描いていた時と同じ原本と設定で描く。件と準備で同じ物を使う値はここに置く。
 */
import * as dragon from "../src/core";
import { pipeTexts } from "../src/pipe-player";
import { exampleJson } from "./diagram-data";
import "../src/kind-use/pipe";
import "../src/kind-use/sequence";
// 組み立てが本体に埋める共有のブロック集と絵柄集を、src を読む検査にも置く (#3763)
import "./built-globals";

/** 携帯の幅 */
export const PHONE = 390;
/** 横に送る図を置く広い枠の幅 (`player-pans-wide-figure`) */
export const PAN_FRAME = 1200;
/** 携帯の幅で字を読める大きさに置く、箱を開いた配管の図 (#3450) */
export const NARROW_SOURCES = { ja: "aggregator.json", en: "aggregator.en.json" } as const;
/** 配管の図は電話の幅でも広い枠と同じ並びで描く見本 (Tracelyth #87、#3720) */
export const FITTING = ["swap.json", "swap-revert.json", "swap-two-hops.json", "swap-retry.json", "vault-proxy.json", "aggregator.json"] as const;
/** 図の下の字が書き出した頁の字の file に残るかを確かめる見本と言葉 */
export const PIPE_TEXT_SOURCES = [
  ["swap-two-hops.json", "ja"],
  ["swap-revert.json", "ja"],
  ["vault-proxy.en.json", "en"],
] as const;
/** 箱の名前が読める大きさから始める見本と、並べる幅 (#3483) */
export const READABLE_SOURCE = "swap.json";
export const READABLE_WIDTHS = [600, 800, 1200] as const;

interface Rendered {
  timeline: { total: number; steps: { start: number }[]; stills: number[] };
  layout: Record<string, unknown>;
  diagram: Record<string, unknown>;
}

const render = (source: unknown, options: Record<string, unknown> = {}): Rendered => dragon.renderDiagram(source, options) as unknown as Rendered;

/** 携帯の幅で並べた配管の図の幅と、最初の槽の残高の字の高さ */
function phoneLaid(file: string, lang: "ja" | "en", open?: number[]): { width: number; levelH?: number } {
  const { layout } = render(exampleJson(file), { lang, width: PHONE, ...(open ? { open } : {}) }) as unknown as { layout: { width: number; levels: { text: { h: number } }[] } };
  const h = layout.levels[0]?.text.h;
  return { width: layout.width, ...(h === undefined ? {} : { levelH: h }) };
}

export default function prepare() {
  const oauth = exampleJson("oauth.json");
  const still = render(oauth, { still: true });
  const wide = render(exampleJson("aggregator.json"), { open: [2], width: PAN_FRAME }) as unknown as {
    layout: { width: number; parties: { id: string; x: number; w: number }[] };
    diagram: { steps: { events: { from?: string; to?: string; box?: string }[] }[] };
  };
  return {
    /** OAuth の見本の時刻の表 */
    oauthTimeline: render(oauth).timeline,
    /** OAuth の見本を止め絵で描いた時刻の表と、線の名前と処理の札の置き場所 */
    oauthStill: { timeline: still.timeline, layout: { labels: still.layout.labels, actions: still.layout.actions } },
    /** 箱 2 を開いて広い枠で並べた aggregator の幅と関係者と段の出来事 */
    wide: {
      width: wide.layout.width,
      parties: wide.layout.parties.map(({ id, x, w }) => ({ id, x, w })),
      steps: wide.diagram.steps.map((step) => ({ events: step.events.map(({ from, to, box }) => ({ from, to, box })) })),
    },
    narrow: { ja: phoneLaid(NARROW_SOURCES.ja, "ja", [2]), en: phoneLaid(NARROW_SOURCES.en, "en", [2]) },
    fitting: Object.fromEntries(FITTING.map((file) => [file, phoneLaid(file, "ja")])),
    /** 見本ごとの、書き出した頁の字の file に残る字 */
    pipeTexts: Object.fromEntries(
      PIPE_TEXT_SOURCES.map(([file, lang]) => {
        const model = (render(exampleJson(file), { lang }) as unknown as { diagram: Parameters<typeof pipeTexts>[0] }).diagram;
        return [file, pipeTexts(model, lang).join("")];
      }),
    ),
    /** 幅ごとに並べた、箱の名前が読める大きさから始める見本の幅と高さと段に関わる関係者の所 */
    readable: Object.fromEntries(
      READABLE_WIDTHS.map((width) => {
        const { layout } = render(exampleJson(READABLE_SOURCE), { lang: "ja", width }) as unknown as { layout: { width: number; height: number; focus: { step: number; x: number; y: number; w: number; h: number }[] } };
        return [width, { width: layout.width, height: layout.height, focus: layout.focus }];
      }),
    ) as Record<(typeof READABLE_WIDTHS)[number], { width: number; height: number; focus: { step: number; x: number; y: number; w: number; h: number }[] }>,
  };
}
