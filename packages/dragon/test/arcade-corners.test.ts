// @vitest-environment jsdom
/**
 * arcade の色味で描いた図の箱の角を、bitsumi の頁と同じ形にする (#3344)。
 *
 * arcade では図の箱と囲みと図の枠の右上と左下を 8 落とし、形の幅か高さの 4 分の 1 が 8 より小さい時はその 4 分の 1 に縮める。
 * 絵柄の枠やチップや札などの小さな部品は角の無い四角で描き、丸い角を 1 つも残さない。
 * 書き出した HTML の再生の枠も同じ形で切り抜き、再生の釦と見どころの印は四角にする。
 * clear、paper、night は今の丸い角のまま変えない。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { draw, type Player, type Rect, type Theme } from "./render-support";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const THEMES: readonly Theme[] = ["light", "dark"];
const OTHERS = ["clear", "paper", "night"] as const;
/** 落とす幅 */
const CUT = 8;
/** 位置を 0.1 の位で丸めて描くため、比べる時に許す差 */
const NEAR = 0.06;

/** 角を落とす形 (図の箱とその光と選んだ印、囲み、図の枠) の class。窓を切り抜く形は class を持たず、`clipPath` の子で見分ける */
const FRAMES = [
  "dg-st",
  "dg-halo",
  "dg-on",
  "dg-ghost",
  "dg-tm-ph",
  "dg-tm-ex",
  "dg-ln-card",
  "dg-ln-pool",
  "dg-ln-role",
  "dg-ln-lit",
  "dg-try-blk",
  "dg-try-q",
  "dg-band",
  "dg-strip",
  "dg-side",
  "dg-bg",
  "dg-vp-frame",
  "dg-mm-bg",
  // 配管の図の箱と囲み (#3398)。槽、トークンの箱、Contract の箱、槽の囲い、値の札、吹き出し
  "dg-pp-glass",
  "dg-pp-act",
  "dg-pp-cabr",
  "dg-pp-housing",
  "dg-pp-pbox",
  "dg-pp-cbr",
  // 表どうしの関係の図の表の光る枠と式の札 (#3618)
  "dg-er-frame",
  "dg-er-note",
  // 集合の重なりの図のどれにも入らない数の枠 (#3620)
  "dg-vn-frame",
  // 列の図の列の帯と、段で光る帯の縁 (#3624)
  "dg-lb-band",
  "dg-lb-lit",
];

/**
 * 角を確かめる見本。英語の見本 (`*.en.json`) は日本語の見本と同じ箱と囲みを、字の言葉だけ替えて描くので外す (#3381)。
 * 全ての見本を全ての色味で描いて読むと、1 件の上限 (10 秒) に収まらない。
 * 検査は見本ごとに分ける (#3410)。全ての見本を 1 件で描くと、混んだ機械で 1 件の上限を超えた
 */
const FILES = readdirSync(EXAMPLES)
  .filter((file) => file.endsWith(".json") && !file.endsWith(".en.json"))
  .sort();
const diagramOf = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(join(EXAMPLES, file), "utf8")) as Record<string, unknown>;

/** 描いて読んだ SVG。同じ見本と色味を、検査ごとに描き直さない (#3381) */
const figures = new Map<string, Element>();

/** 見本を描いた SVG を読む */
function figureOf(file: string, palette: string, theme: Theme): Element {
  const key = `${file} ${palette} ${theme}`;
  const seen = figures.get(key);
  if (seen) return seen;
  const svg = draw("renderDiagram")(diagramOf(file), { palette, theme }).svg;
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  expect(doc.querySelector("parsererror"), `${file} の SVG を読めない`).toBeNull();
  figures.set(key, doc.documentElement);
  return doc.documentElement;
}

/**
 * 窓を切り抜く形か。工程表の棒 (`data-task`、#3562) の切り抜きは窓でなく、棒の塗りと字を棒の形で切る小さな部品なので、
 * arcade では棒と同じ角の無い四角のまま描く (`arcade-draws-no-rounded-corner` が丸い角の無いことを確かめる)
 */
const isWindowClip = (el: Element): boolean => el.parentElement?.localName === "clipPath" && el.closest("[data-task]") === null;
const isFrame = (el: Element): boolean => FRAMES.some((c) => el.classList.contains(c)) || isWindowClip(el);
const num = (el: Element, name: string): number => Number(el.getAttribute(name) ?? 0) || 0;
const boxOf = (rect: Element): Rect => ({
  x: num(rect, "x"),
  y: num(rect, "y"),
  w: num(rect, "width"),
  h: num(rect, "height"),
});
const where = (el: Element): string =>
  `${el.localName}.${el.getAttribute("class") ?? (el.parentElement?.localName === "clipPath" ? "(窓を切り抜く形)" : "(class 無し)")}`;

type Point = [number, number];

/** path の `d` を頂点の列にする。絶対の M、L、H、V、Z だけを読み、ほかの命令を含む時は読めない印を返す */
function ring(d: string): Point[] | undefined {
  const tokens = d.match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const points: Point[] = [];
  let [x, y] = [0, 0];
  let cmd = "";
  for (let i = 0; i < tokens.length;) {
    const token = tokens[i] as string;
    if (/[A-Za-z]/.test(token)) {
      cmd = token;
      i++;
      continue;
    }
    if (cmd === "M" || cmd === "L") [x, y, i] = [Number(token), Number(tokens[i + 1]), i + 2];
    else if (cmd === "H") [x, i] = [Number(token), i + 1];
    else if (cmd === "V") [y, i] = [Number(token), i + 1];
    else return undefined;
    points.push([x, y]);
  }
  const [first, last] = [points[0], points[points.length - 1]];
  if (
    points.length > 1 &&
    first &&
    last &&
    Math.abs(first[0] - last[0]) < NEAR &&
    Math.abs(first[1] - last[1]) < NEAR
  )
    points.pop();
  return points;
}

/** 右上と左下を `cut` 落とした形の頂点 (左上から時計回り) */
const cutRing = ({ x, y, w, h }: Rect, cut: number): Point[] => [
  [x, y],
  [x + w - cut, y],
  [x + w, y + cut],
  [x + w, y + h],
  [x + cut, y + h],
  [x, y + h - cut],
];

const near = (a: Point, b: Point): boolean =>
  Math.abs(a[0] - b[0]) < NEAR && Math.abs(a[1] - b[1]) < NEAR;

/** 2 つの頂点の列が、始まりの頂点をずらせば同じ順に並ぶか */
function sameRing(actual: Point[] | undefined, expected: Point[]): boolean {
  if (!actual || actual.length !== expected.length) return false;
  return actual.some((_, k) =>
    expected.every((p, i) => near(actual[(k + i) % actual.length] as Point, p)),
  );
}

/** 形の幅か高さの 4 分の 1 が 8 より小さい時は、その 4 分の 1 に縮めた落とす幅 */
const cutOf = ({ w, h }: Rect): number => Math.min(CUT, w / 4, h / 4);

/** 丸い角 (0 より大きい `rx` か `ry`) を持つ形 */
const roundedIn = (root: Element): Element[] =>
  [...root.querySelectorAll("[rx], [ry]")].filter((el) => num(el, "rx") > 0 || num(el, "ry") > 0);

/** class ごとの、四角と path の形の数 */
function shapeCounts(root: Element): Record<string, number> {
  const out: Record<string, number> = {};
  for (const el of root.querySelectorAll("rect, path")) {
    const key = `${el.getAttribute("class") ?? "(class 無し)"}${isFrame(el) ? "" : ` ${el.localName}`}`;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/** paper で描いた角を落とす形と、arcade で描いた同じ順の形の組 */
function framePairs(file: string, theme: Theme): { paper: Element; arcade: Element }[] {
  const paper = [...figureOf(file, "paper", theme).querySelectorAll("rect")].filter(isFrame);
  const arcade = [...figureOf(file, "arcade", theme).querySelectorAll("rect, path")].filter(
    isFrame,
  );
  expect(arcade.length, `${file} の ${theme} を arcade で描いた角を落とす形の数`).toBe(
    paper.length,
  );
  return paper.map((el, i) => ({ paper: el, arcade: arcade[i] as Element }));
}

describe("arcade の角の見本 (#3410)", () => {
  it("arcade-corner-examples-found", () => {
    // 見本ごとの検査は見本が 1 つも無いと 1 件も走らず、落ちずに素通りする
    expect(FILES.length, "角を確かめる見本が無い (走査の空振り)").toBeGreaterThan(0);
  });
});

describe.for(FILES)("arcade の角 (#3344) %s", (file) => {
  it("arcade-cuts-box-region-frame-corners", () => {
    const wrong: string[] = [];
    let seen = 0;
    for (const theme of THEMES) {
      for (const { paper, arcade } of framePairs(file, theme)) {
        seen++;
        const box = boxOf(paper);
        const points =
          arcade.localName === "path" ? ring(arcade.getAttribute("d") ?? "") : undefined;
        const corners: Point[] = [
          [box.x, box.y],
          [box.x + box.w, box.y + box.h],
        ];
        const cutAway: Point[] = [
          [box.x + box.w, box.y],
          [box.x, box.y + box.h],
        ];
        const ok =
          points?.length === 6 &&
          corners.every((p) => points.some((q) => near(p, q))) &&
          cutAway.every((p) => !points.some((q) => near(p, q)));
        if (!ok)
          wrong.push(
            `${file} の ${theme} の ${where(arcade)} が右上と左下を落とした 6 つの頂点の形でない`,
          );
      }
    }
    expect(seen, `${file} に角を落とす形を 1 つも描いていない`).toBeGreaterThan(0);
    expect(wrong).toEqual([]);
  });

  it("arcade-draws-no-rounded-corner", () => {
    const wrong: string[] = [];
    for (const theme of THEMES) {
      const arcade = figureOf(file, "arcade", theme);
      for (const el of roundedIn(arcade))
        wrong.push(
          `${file} の ${theme} の ${where(el)} が丸い角 (rx=${el.getAttribute("rx")}) を持つ`,
        );
      // 小さな部品は消さずに四角で描く。角を落とす形のほかは、paper と同じ数の四角が在る
      const paper = shapeCounts(figureOf(file, "paper", theme));
      expect(shapeCounts(arcade), `${file} の ${theme} を arcade で描いた形の数`).toEqual(paper);
    }
    expect(wrong).toEqual([]);
  });
});

describe("arcade の角 (#3344)", () => {

  it("arcade-cut-is-8-or-a-quarter", async () => {
    const wrong: string[] = [];
    for (const file of FILES) {
      for (const theme of THEMES) {
        for (const { paper, arcade } of framePairs(file, theme)) {
          const box = boxOf(paper);
          if (!sameRing(ring(arcade.getAttribute("d") ?? ""), cutRing(box, cutOf(box))))
            wrong.push(`${file} の ${theme} の ${where(arcade)} を ${cutOf(box)} 落としていない`);
        }
      }
    }
    expect(wrong).toEqual([]);

    // 見本の箱はどれも幅と高さが 32 以上で 8 落とすため、小さい形を縮める所は形を作る関数で確かめる
    // 関数がまだ無い時もこの file の他の検査を走らせるため、置き場を変数で渡して読めない時は無いと判定する
    const modulePath = "../src/render/corner";
    const corner = (await import(/* @vite-ignore */ modulePath).catch(() => undefined)) as
      { cutCorners?: (rect: Rect) => string } | undefined;
    expect(
      corner?.cutCorners,
      "角を落とした形を作る関数 (src/render/corner.ts の cutCorners) が無い",
    ).toBeTypeOf("function");
    const cut = corner?.cutCorners as (rect: Rect) => string;
    for (const [w, h] of [
      [200, 100],
      [32, 32],
      [20, 100],
      [100, 24],
      [16, 16],
    ] as const) {
      const box = { x: 3, y: 5, w, h };
      expect(
        sameRing(ring(cut(box)), cutRing(box, cutOf(box))),
        `${w} × ${h} の形を ${cutOf(box)} 落としていない`,
      ).toBe(true);
    }
  });
});

describe("arcade の再生の枠 (#3344)", () => {
  const placed: Player[] = [];
  afterEach(() => {
    for (const player of placed.splice(0)) player.destroy();
    document.body.innerHTML = "";
  });

  it("arcade-player-has-no-rounded-corner", () => {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    });
    const host = document.createElement("div");
    Object.defineProperty(host, "clientWidth", { value: 720 });
    document.body.appendChild(host);
    // 寄って追う図で置き、窓の枠と全体図の地と、窓と全体図を切り抜く形も確かめる。幅 720 の枠は全体図を窓の下に出す
    const player = draw("mountDiagram")(
      host,
      { ...diagramOf("ccip.json"), view: "follow" },
      { palette: "arcade", pausedAt: 0 },
    ) as Player & { mark(rects: readonly Rect[]): void };
    placed.push(player);
    const figure = host.querySelector('svg[data-dragon="figure"]');
    expect(figure?.getAttribute("data-view"), "幅 720 の枠で寄って追う図にならない").toBe("follow");

    player.mark([{ x: 10, y: 10, w: 40, h: 20 }]);
    expect(host.querySelector(".dg-spot"), "見どころの印を描いていない").not.toBeNull();
    expect(roundedIn(host).map(where), "再生の枠の中の丸い角").toEqual([]);

    const frames = [...host.querySelectorAll("rect, path")].filter(
      (el) =>
        ["dg-vp-frame", "dg-mm-bg"].some((c) => el.classList.contains(c)) ||
        el.parentElement?.localName === "clipPath",
    );
    expect(
      frames.map((el) => el.getAttribute("class") ?? "(切り抜く形)").sort(),
      "窓の枠と全体図の地と、窓と全体図を切り抜く形",
    ).toEqual(["(切り抜く形)", "(切り抜く形)", "dg-mm-bg", "dg-vp-frame"]);
    for (const el of frames)
      expect(
        el.localName === "path" && ring(el.getAttribute("d") ?? "")?.length === 6,
        `${where(el)} が右上と左下を落とした形でない`,
      ).toBe(true);

    const frame = host.querySelector(".dg-frame") as HTMLElement;
    const css = getComputedStyle(frame);
    expect(
      Number.parseFloat(css.getPropertyValue("border-radius")) || 0,
      "再生の枠の角の丸み",
    ).toBe(0);
    expect(
      css.getPropertyValue("clip-path").replace(/\s+/g, ""),
      "再生の枠を右上と左下を 8 落とした形で切り抜かない",
    ).toBe(
      `polygon(00,calc(100%-${CUT}px)0,100%${CUT}px,100%100%,${CUT}px100%,0calc(100%-${CUT}px))`,
    );
    const buttons = [...host.querySelectorAll<HTMLElement>(".dg-btn")];
    expect(buttons.length, "再生の釦が無い").toBeGreaterThan(0);
    for (const button of buttons)
      expect(
        Number.parseFloat(getComputedStyle(button).getPropertyValue("border-radius")) || 0,
        `釦 ${button.textContent} の角の丸み`,
      ).toBe(0);
  });
});

/** 角の形を足す前に、今の色味で描いた丸い角の数と半径の記録 */
const before = JSON.parse(
  readFileSync(join(ROOT, "packages/dragon/test/fixtures/corners-before-arcade.json"), "utf8"),
) as Record<string, Record<string, number>>;

describe.for(FILES)("今の色味の角 (#3344) %s", (file) => {
  it("other-palettes-keep-rounded-corners", () => {
    // 記録は英語の見本も持つ。英語の見本は日本語の見本と同じ形なので、日本語の見本だけを比べる
    expect(Object.keys(before).filter((name) => !name.endsWith(".en.json")).sort(), "角の形を足す前の記録と見本の file").toEqual(FILES);
    // 明暗は色だけを替え、角の形を替えない。ほかの色味は明るい表示だけで確かめる (#3381)
    for (const palette of OTHERS) {
      for (const theme of ["light"] as const) {
        const figure = figureOf(file, palette, theme);
        const rounded: Record<string, number> = {};
        for (const el of roundedIn(figure)) {
          const key = `${el.getAttribute("class") ?? "(none)"} rx=${num(el, "rx")}`;
          rounded[key] = (rounded[key] ?? 0) + 1;
        }
        expect(rounded, `${file} を ${palette} の ${theme} で描いた丸い角の数と半径`).toEqual(
          before[file],
        );
        expect(
          [...figure.querySelectorAll("path")].filter(isFrame).map(where),
          `${file} を ${palette} の ${theme} で描いて角を落とした形`,
        ).toEqual([]);
      }
    }
  });
});

describe("変更の一覧 (#3344)", () => {
  it("changelog-lists-arcade-corners", () => {
    for (const file of ["CHANGELOG.md", "CHANGELOG.ja.md"])
      expect(changelogEntry(join(ROOT, file), 3344), `${file} に arcade の角の項 (#3344) が無い`).not.toBe("");
  });
});
