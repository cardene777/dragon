/**
 * パイプ図の取り消しの札 (#3974)。
 *
 * `check`を持たない`revert <箱>: <理由>`の段は、管が薄くなるだけで、落ちた箱に印も理由も出なかった。
 * 段の吹き出しと操作の帯を隠して図を置く頁では、落ちた理由がどこにも出なかった。
 * 落ちの連なりの元の箱に、桃色の×の印と理由の字を持つ取り消しの札を1枚置き、落ちた段だけ出す。
 * 元の箱が落ちた`check`を書いていれば、計器の×と式の札が印になるので札を描かず、今の絵のまま残す。
 *
 * 札の置き場所は置き場所 (`layout.revertTags`) から読み、見える時刻は描いた SVG の動きから読む。
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "./all-kinds";
import { describe, expect, it } from "vitest";
import { OUT, VARIANTS } from "../scripts/snapshot-examples.mjs";
import { JSDOM } from "jsdom";
import { sampler } from "./motion-support";
import type { Rendered } from "./render-support";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Party extends Rect {
  id: string;
}
interface RevertTag extends Rect {
  party: string;
  step: number;
  text: string;
}
interface Overlap {
  kind: string;
  step: number;
  spots: { text: string }[];
}
interface PipeLayout {
  parties: Party[];
  revertTags?: RevertTag[];
}
type Lang = "ja" | "en";
interface Drawn extends Rendered {
  overlaps: Overlap[];
}
interface Api {
  parseNotation: (
    text: string,
    opts: { lang: Lang },
  ) => { ok: true; diagram: unknown } | { ok: false; errors: { line: number; message: string }[] };
  renderDiagram: (diagram: unknown, opts?: Record<string, unknown>) => Drawn;
}
const api = dragon as unknown as Api;

/*
 * 描いた SVG を時刻を指して読む。検査の環境を jsdom にすると見本の指紋を取る script (`.mjs`) を読めないので、
 * node の環境で jsdom の読む部品だけを使い、時刻の値は動きの道具 (`motion-support.ts` の `sampler`) で求める
 */
const { DOMParser } = new JSDOM("").window;
interface Motion {
  doc: Document;
  /** 部品と、それを包む部品の濃さを掛けた、時刻 `t` 秒の見える濃さ (0 から 1) */
  opacity(el: Element, t: number): number;
}
function motionFrom(r: Rendered): Motion {
  const doc = new DOMParser().parseFromString(r.svg, "image/svg+xml");
  const value = sampler(r.svg, r.timeline.total);
  const opacity = (el: Element, t: number): number => {
    let o = 1;
    for (let e: Element | null = el; e; e = e.parentElement)
      o *= Math.min(1, Math.max(0, value(e, "opacity", t)?.[0] ?? 1));
    return o;
  };
  return { doc, opacity };
}

const ROOT = join(process.cwd(), "packages/dragon");
const BLOCKS = join(ROOT, "src/blocks");
const FIXTURES = join(ROOT, "test/fixtures");

/** 課題の本文の記法。Cantonが見えないコントラクトのChoiceを断る */
const IOU = `pipe Iou.Transferを実行
layout mesh
box carol as Carol
box iou as Iou
box bob as Bob
hold carol: 0 Iou
hold bob: 100 Iou
step CarolがIou #1のTransferを実行する
  say CarolがIou #1のChoice Transferを実行します。
  carol -> iou: Transfer(newOwner: carol)
step Cantonがトランザクションを断る
  say このPartyにはコントラクトが見えないので、実行できません。
  revert iou: 見えないコントラクト
`;
/** 段の吹き出しの字。図だけの絵はこの字を持たない */
const IOU_SAY = "このPartyにはコントラクトが見えないので、実行できません。";
/** 課題の記法の落ちる段の前に、落ちる`check`を足した記法 */
const IOU_CHECKED = IOU.replace(
  "  revert iou:",
  "  check iou: 見る人 == carol [fail]\n  revert iou:",
);
/** 英語の図。理由を書かない`revert` */
const IOU_EN_BARE = `pipe Run Iou.Transfer
layout mesh
box carol as Carol
box iou as Iou
box bob as Bob
hold carol: 0 Iou
hold bob: 100 Iou
step Carol runs Transfer on Iou #1
  say Carol runs the Transfer choice on Iou #1.
  carol -> iou: Transfer(newOwner: carol)
step Canton refuses the transaction
  say The party cannot see the contract.
  revert iou
`;
/** 内側の落ちを外の呼び出しが受け止め、後の段で別の理由で落ちる記法 */
const CAUGHT = `pipe 受け止めた後の落ち
box alice as Alice
box router as Router
box pool as Pool
step AliceがRouterを呼ぶ
  say AliceがRouterのswapを呼ぶ。
  alice -> router: swap()
step RouterがPoolを呼ぶ
  say RouterがPoolのswapを呼ぶ。
  router -> pool: swap()
step Poolの確かめが落ちる
  say Poolの確かめが落ち、RouterがPoolの落ちを受け止める。
  check pool: 1 >= 2
  revert pool: 足りない
step Routerが期限切れで落ちる
  say Routerが期限切れで落ちる。
  revert router: 期限切れ
`;

const langOf = (file: string): Lang => (file.includes(".en.") ? "en" : "ja");
const fileText = (path: string): string => readFileSync(path, "utf8");

function parsed(text: string, lang: Lang, where: string): unknown {
  const read = api.parseNotation(text, { lang });
  if (!read.ok)
    throw new Error(
      `${where} を読めない: ${read.errors.map((e) => `${e.line}行目 ${e.message}`).join(" / ")}`,
    );
  return read.diagram;
}
const drawn = (
  text: string,
  lang: Lang,
  where: string,
  options: Record<string, unknown> = {},
): Drawn => api.renderDiagram(parsed(text, lang, where), { lang, ...options });
const drawnFile = (path: string): Drawn => drawn(fileText(path), langOf(path), path);

const layoutOf = (r: Drawn): PipeLayout => r.layout as unknown as PipeLayout;
const tagsOf = (r: Drawn): RevertTag[] => layoutOf(r).revertTags ?? [];
function partyOf(r: Drawn, id: string): Party {
  const p = layoutOf(r).parties.find((x) => x.id === id);
  if (!p) throw new Error(`${id} の名札が無い`);
  return p;
}
/** 箱 `party` の、段 `step` の取り消しの札。無ければ落とす */
function tagOf(r: Drawn, party: string, step: number, where: string): RevertTag {
  const tag = tagsOf(r).find((t) => t.party === party && t.step === step);
  expect(
    tag,
    `${where} の段${step + 1}に ${party} の取り消しの札が無い (layout.revertTags: ${JSON.stringify(tagsOf(r).map((t) => [t.party, t.step, t.text]))})`,
  ).toBeDefined();
  return tag as RevertTag;
}
/** 札の部品。無ければ落とす */
function tagPart(m: Motion, party: string): Element {
  const g = m.doc.querySelector(`[data-pipe-revert="${party}"]`);
  expect(g, `描いた SVG に ${party} の取り消しの札 (data-pipe-revert) が無い`).not.toBeNull();
  return g as Element;
}
/** 2 つの矩形が重なる (縁が触れるだけは重ならない) */
const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
/** 2 つの矩形の縁どうしの一番近い隙間 */
const gapOf = (a: Rect, b: Rect): number =>
  Math.hypot(
    Math.max(0, b.x - (a.x + a.w), a.x - (b.x + b.w)),
    Math.max(0, b.y - (a.y + a.h), a.y - (b.y + b.h)),
  );

/*
 * 課題の記法の図は、多くの件が使うので1度だけ描く。混んだ機械で件ごとに描くと 1 件の上限 (10 秒) に近づく (#3733)
 */
let iouDrawn: Drawn | undefined;
const iou = (): Drawn => (iouDrawn ??= drawn(IOU, "ja", "課題の記法"));

describe("落ちた箱の取り消しの札 (#3974)", () => {
  it("pipe-revert-tag-sits-near-failed-box", () => {
    const r = iou();
    const tag = tagOf(r, "iou", 1, "課題の記法");
    expect(tag.text, "札の字").toBe("見えないコントラクト");
    const box = partyOf(r, "iou");
    expect(
      overlaps(tag, box),
      `札 ${JSON.stringify(tag)} が iou の箱 ${JSON.stringify(box)} に重なる`,
    ).toBe(false);
    expect(gapOf(tag, box), "札と iou の箱の隙間").toBeLessThanOrEqual(24);
  });

  it("pipe-revert-tag-carries-cross-mark", () => {
    const m = motionFrom(iou());
    const g = tagPart(m, "iou");
    expect(g.getAttribute("style") ?? "", "札の色が桃色でない").toContain("--c-rose");
    expect(g.querySelector("[data-pipe-revert-mark] circle"), "札の×の印の丸が無い").not.toBeNull();
    const cross = g.querySelector("[data-pipe-revert-mark] path")?.getAttribute("d") ?? "";
    // ×の印は2本の斜めの線 (計器の落ちた印と同じ形)
    expect(cross.match(/M /g)?.length ?? 0, `札の×の印の線 (${cross})`).toBe(2);
    expect(g.querySelector("text")?.textContent, "札の字").toBe("見えないコントラクト");
  });

  it("pipe-revert-tag-shows-in-picture-only", () => {
    const r = iou();
    // renderDiagram が返す絵は図だけで、段の吹き出しと操作の帯を持たない
    expect(r.svg.includes(IOU_SAY), "図だけの絵に段の吹き出しの字が入っている").toBe(false);
    const m = motionFrom(r);
    const g = tagPart(m, "iou");
    const t = r.timeline.stills[1] as number;
    expect(
      m.opacity(g.querySelector("text") as Element, t),
      "段2の止め絵で札の字の濃さ",
    ).toBeGreaterThan(0.9);
    expect(
      m.opacity(g.querySelector("[data-pipe-revert-mark]") as Element, t),
      "段2の止め絵で×の印の濃さ",
    ).toBeGreaterThan(0.9);
  });

  it("pipe-revert-tag-hidden-outside-failed-step", () => {
    const r = iou();
    const m = motionFrom(r);
    const g = tagPart(m, "iou");
    expect(m.opacity(g, r.timeline.stills[0] as number), "段1の止め絵で札の濃さ").toBeLessThan(0.1);
  });

  it("pipe-revert-tag-without-reason-uses-rolled-word", () => {
    const bare = IOU.replace("revert iou: 見えないコントラクト", "revert iou");
    expect(
      tagOf(drawn(bare, "ja", "理由の無い日本語の図"), "iou", 1, "理由の無い日本語の図").text,
      "日本語の図の札の字",
    ).toBe("リバート");
    expect(
      tagOf(drawn(IOU_EN_BARE, "en", "理由の無い英語の図"), "iou", 1, "理由の無い英語の図").text,
      "英語の図の札の字",
    ).toBe("Undone");
    const given = drawn(bare, "ja", "語を渡した図", {
      words: { pipe: { tags: { rolled: "Reverted" } } },
    });
    expect(
      tagOf(given, "iou", 1, "語を渡した図").text,
      "words.pipe.tags.rolled を渡した図の札の字",
    ).toBe("Reverted");
  });
});

describe("落ちの連なりと札を描く箱 (#3974)", () => {
  const FLASHLOAN = join(FIXTURES, "mesh-ticket-patterns-flashloan.dragon");
  let flash: Drawn | undefined;
  const flashloan = (): Drawn => (flash ??= drawnFile(FLASHLOAN));
  /** flashloan の記法で 3 つの箱が落ちる段 (0 から数える) */
  const FALL = 5;

  it("pipe-revert-tag-only-at-chain-origin", () => {
    const tag = tagOf(flashloan(), "usdc", FALL, "flashloan の記法");
    expect(tag.text, "連なりの元の札の字").toBe(
      "ERC20InsufficientAllowance(FlashLender, 0, 1001000000)",
    );
  });

  it("pipe-revert-tag-not-on-chain-followers", () => {
    const r = flashloan();
    tagOf(r, "usdc", FALL, "flashloan の記法");
    const followers = tagsOf(r).filter((t) => t.party === "lender" || t.party === "borrower");
    expect(
      followers.map((t) => `${t.party} 段${t.step + 1}`),
      "連なりの続きの箱の札",
    ).toEqual([]);
  });

  it("pipe-revert-tag-drawn-after-caught-failure", () => {
    const r = drawn(CAUGHT, "ja", "受け止めた後の落ちの記法");
    expect(
      tagOf(r, "router", 3, "受け止めた後の落ちの記法").text,
      "後の段で落ちた Router の札の字",
    ).toBe("期限切れ");
    expect(
      tagsOf(r)
        .filter((t) => t.party === "pool")
        .map((t) => `段${t.step + 1}`),
      "落ちた check を書いた Pool の札",
    ).toEqual([]);
  });

  it("pipe-revert-tag-text-clears-other-text", () => {
    const figures: [string, Drawn][] = [
      ["課題の記法", iou()],
      ...(["revert.pipe.dragon", "revert.pipe.en.dragon"] as const).map((file): [string, Drawn] => [
        file,
        drawnFile(join(BLOCKS, "revert/gallery", file)),
      ]),
    ];
    for (const [name, r] of figures) {
      const tags = tagsOf(r);
      expect(tags.length, `${name} に取り消しの札が無い`).toBeGreaterThan(0);
      const words = new Set(tags.map((t) => t.text));
      const hit = r.overlaps.filter((o) => o.spots.some((s) => words.has(s.text)));
      expect(
        hit.map((o) => `段${o.step + 1} ${o.spots.map((s) => s.text).join(" / ")}`),
        `${name} で札の字に重なる字`,
      ).toEqual([]);
    }
  });
});

describe("落ちた check の後の revert は今の絵のまま (#3974)", () => {
  /** 落ちた check の後に revert を書いた記法のうち、指紋を記録した物。鍵は `scripts/snapshot-examples.mjs` の形 */
  const RECORDED: { key: string; path: string }[] = [
    ...["check.pipe.dragon", "check.pipe.en.dragon"].map((file) => ({
      key: `parts/${file}`,
      path: join(BLOCKS, "check/gallery", file),
    })),
    ...["swap-revert", "swap-retry"].flatMap((name) =>
      [".dragon", ".en.dragon", ".json", ".en.json"].map((ext) => ({
        key: `examples/${name}${ext}`,
        path: join(ROOT, "examples", `${name}${ext}`),
      })),
    ),
    {
      key: "test/fixtures/side-port-patterns-swap-slipped.dragon",
      path: join(FIXTURES, "side-port-patterns-swap-slipped.dragon"),
    },
  ];
  const diagramOf = (path: string): unknown =>
    path.endsWith(".json")
      ? JSON.parse(fileText(path))
      : parsed(fileText(path), langOf(path), path);

  // 件の名前は関門が行の最後の ` > ` の後から読むので、図の名前は describe に置き、it は名前だけを持つ
  describe.for([
    ...RECORDED.map((r) => ({ name: r.key, diagram: () => diagramOf(r.path) })),
    {
      name: "課題の記法に落ちる check を足した記法",
      diagram: () => parsed(IOU_CHECKED, "ja", "課題の記法に落ちる check を足した記法"),
    },
  ])("$name", ({ name, diagram }) => {
    it("pipe-revert-tag-skipped-after-failed-check", () => {
      const r = api.renderDiagram(diagram(), {});
      expect(
        tagsOf(r).map((t) => `${t.party} 段${t.step + 1}`),
        `${name} の取り消しの札`,
      ).toEqual([]);
      expect(r.svg.includes("data-pipe-revert"), `${name} の SVG に取り消しの札の部品がある`).toBe(
        false,
      );
    });
  });

  const recorded = JSON.parse(readFileSync(OUT, "utf8")) as Record<string, string>;
  const sha = (text: string): string =>
    createHash("sha256").update(text).digest("hex").slice(0, 16);
  // 描き方の組ごとに 1 件にする。swap-retry を 3 通り描くと、混んだ機械で 1 件の上限 (10 秒) に近づく (#3733)
  describe.for(
    RECORDED.flatMap(({ key, path }) =>
      Object.entries(VARIANTS).map(([variant, options]) => ({ key, path, variant, options })),
    ),
  )("$key $variant", ({ key, path, variant, options }) => {
    it("pipe-failed-check-revert-keeps-recorded-picture", () => {
      const r = api.renderDiagram(diagramOf(path), options);
      const now: Record<string, string> = {
        svg: sha(r.svg),
        layout: sha(JSON.stringify(r.layout)),
        timeline: sha(JSON.stringify(r.timeline)),
      };
      for (const part of ["svg", "layout", "timeline"]) {
        const at = `${key}|${variant}|${part}`;
        expect(recorded[at], `${at} の指紋が記録に無い`).toBeDefined();
        expect(now[part], `${at} が記録した指紋と違う`).toBe(recorded[at]);
      }
    });
  });
});
