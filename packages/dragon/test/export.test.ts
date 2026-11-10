/**
 * 同じ原本の JSON から、mp4、GIF、HTML、PNG を書き出す (#2986)。
 *
 * 書き出しの命令は画面なしの Chromium で、頁と同じ描画を時刻を止めて 1 コマずつ撮る。
 * 撮ったコマは同じ Chromium の中で mp4 と GIF に詰め、HTML には図で描く字だけに削った字の file を埋める。
 * 書き出しの時間を抑えるため、小さな図とコマの数を減らした設定で回す。
 */
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
// 書き出しの部品 (1MB を超える束) を、この file を読む段で先に読む (#3410)。
// 初めて読む時の変換は、検査の中で読むと最初の件だけが 2 秒から 3 秒遅れた。変換は 1 回の実行の中で使い回す
import "@cardenelabs/dragon/export";
import { api, exampleJson, exampleText, type Json, patched, smallArchitecture, smallSequence } from "./diagram-support";
import { bundledCovers, captionLayout, captionSteps, decodeFrames, drawnText, embeddedFonts, type Exported, exporter, fontChars, formatOf, inkCentroid, miniWorld, pageLoads, playerButtons, readGif, runCliInProcess, unfoldedSteps, casesNamed } from "./export-support";
import { draw } from "./render-support";



const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-export-"));

/** 英数字 (等幅の字で描く線の名前) と日本語が混ざり、段の本文が 2 行ある図 */
function mixed(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "API と字の図",
    boxes: [
      { id: "a", name: "Web アプリ" },
      { id: "b", name: "API v2" },
    ],
    steps: [
      {
        title: "問い合わせる",
        body: "Web アプリが API に問い合わせる。\n結果は JSON で返る。",
        events: [{ type: "edge", from: "a", to: "b", label: "GET /items", carry: { kind: "envelope" } }],
      },
    ],
    sequence: { lifelines: ["a", "b"] },
  };
}

/** 3 つの箱を 2 段で順に結ぶ構成図。2 段目の番号の丸は、1 段目の止め絵には出ない */
function twoSteps(): Json {
  const link = (from: string, to: string): Json => ({ type: "edge", from, to, carry: { kind: "envelope" } });
  return {
    version: 1,
    kind: "architecture",
    title: "2 段の構成図",
    regions: [{ id: "r", name: "区画" }],
    boxes: [
      { id: "a", name: "入口", region: "r" },
      { id: "b", name: "中", region: "r" },
      { id: "c", name: "出口", region: "r" },
    ],
    steps: [
      { title: "流す", body: "入口から中へ流す。", events: [link("a", "b")] },
      { title: "渡す", body: "中から出口へ渡す。", events: [link("b", "c")] },
    ],
  };
}

/**
 * 1 秒 1 コマの mp4 と 2 秒に 1 コマの GIF を 1 回で撮る動画と、2 段の図の PNG の 2 回に分けて書き出す。同じ file の検査で 1 度ずつ撮る。
 * 既定のコマの数 (1 秒 30 コマ) で撮ると 20 秒を超え、1 件の上限 (10 秒、#3381) に収まらない。既定の数は `export-defaults.test.ts` が確かめる。
 * mp4 と GIF は 1 回で撮る。GIF は mp4 のコマを間引いて使うので、間引きのとおりのコマの数になるかを本物の書き出しで確かめる。
 * PNG まで 1 回で撮ると、最初に読む検査が混んだ機械で 1 件の上限を超えたので、PNG は分けて撮る。
 * 混んだ機械では 1 コマに 0.3 秒から 0.5 秒かかるので、コマの数は数えて比べられる最小にする (コマの数は 0 より大きい数を受ける、#3410)
 */
const RATES = { fps: 1, gifFps: 0.5 } as const;
/** 動画で撮る図。コマの数を数えるだけなので 2 段の図の最初の段だけを撮り、コマの数を半分にする (#3410) */
const oneStep = (): Json => {
  const two = twoSteps() as { steps: Json[] };
  return { ...two, steps: two.steps.slice(0, 1) };
};
type Shot = "video" | "png";
const twoStepsShots = new Map<Shot, Promise<Exported>>();
const shootTwoSteps = (shot: Shot): Promise<Exported> => {
  const seen = twoStepsShots.get(shot);
  if (seen) return seen;
  const formats = shot === "video" ? (["mp4", "gif"] as const) : (["png"] as const);
  const made = exporter().then((exportDiagram) => exportDiagram(shot === "video" ? oneStep() : twoSteps(), { outDir: scratch(), formats: [...formats], ...RATES }));
  twoStepsShots.set(shot, made);
  return made;
};

/**
 * CCIP の最初の段。図の箱と絵柄は最初の段から全て描くので、GIF の色の表は最初の段で上限まで埋まる。
 * 段を 3 つ撮ると、混んだ機械で 1 件の上限 (10 秒) を超えた (#3381、#3410)
 */
const ccipHead = (): Json => {
  const ccip = exampleJson("ccip.json") as { steps: Json[] };
  return { ...ccip, steps: ccip.steps.slice(0, 1) };
};

/** 線を 1 本だけ持つ最小の時系列図。4 つの形式を書き出すことだけを確かめる検査が使う (#3410) */
const oneEdge = (): Json => {
  const small = smallSequence() as { steps: { events: Json[] }[] };
  return { ...small, steps: small.steps.map((step) => ({ ...step, body: "送る側が受ける側へ送る。", events: step.events.slice(0, 1) })) };
};


/**
 * 帯と釦の件が確かめる、`oauth.json` を書き出した HTML。書き出した回数を数える (#3421)。
 * 最初に要った件が 1 度だけ書き出し、残りの件は同じ HTML を使う。件ごとに書き出すと、同じ図を 5 回書き出していた
 */
let oauthExports = 0;
let oauthShot: Promise<string> | undefined;
const oauthHtml = (): Promise<string> =>
  (oauthShot ??= (async () => {
    oauthExports++;
    const exportDiagram = await exporter();
    const result = await exportDiagram(exampleJson("oauth.json"), { outDir: scratch(), formats: ["html"] });
    return readFileSync(result.files.html as string, "utf8");
  })());
/** 帯と釦の件ごとに、頁を読み込んだ回数 (#3421) */
const bandLoads = new Map<string, number>();

/** 書き出した file の中身。無い時は空にして、形の判定で落とす */
function writtenBytes(file: string): Buffer {
  try {
    return readFileSync(file);
  } catch {
    return Buffer.alloc(0);
  }
}

/** 4 つの釦がそれぞれ期待どおりの大きさか。やり直しと前と次は `size`、再生は同じ高さで横に長い */
const FOUR_BUTTONS = { count: 4, restart: true, prev: true, play: true, next: true };
function fourButtons(sizes: string[], size: string): typeof FOUR_BUTTONS {
  const [w, h] = size.split("x").map(Number) as [number, number];
  const [pw, ph] = (sizes[2] ?? "0x0").split("x").map(Number) as [number, number];
  return { count: sizes.length, restart: sizes[0] === size, prev: sizes[1] === size, play: ph === h && pw > w, next: sizes[3] === size };
}

describe("書き出しのコマと形 (#3115)", () => {
  // 渡したコマの数のとおりに撮る。mp4 は 1 秒 1 コマ、GIF は 2 秒に 1 コマで、GIF の 1 コマは 2 秒。既定の数は export-defaults.test.ts が確かめる (#3381)
  describe("mp4", () => {
    it(
      "export-frame-counts-follow-rates",
      async () => {
        const result = await shootTwoSteps("video");
        const { total } = draw("renderDiagram")(oneStep()).timeline;
        expect(result.frames, `1 周 ${total} 秒の mp4 のコマの数`).toBe(Math.round(total * RATES.fps));
      },
    );
  });

  describe("GIF", () => {
    it(
      "export-frame-counts-follow-rates",
      async () => {
        const result = await shootTwoSteps("video");
        const { total } = draw("renderDiagram")(oneStep()).timeline;
        const gif = readGif(readFileSync(result.files.gif as string));
        expect(gif.frames.length, `1 周 ${total} 秒の GIF のコマの数`).toBe(Math.round(total * RATES.gifFps));
        expect([...new Set(gif.frames.map((frame) => frame.delay))], "GIF の 1 コマの長さ (1/100 秒)").toEqual([100 / RATES.gifFps]);
      },
    );
  });

  it(
    "gif-keeps-unchanged-pixels",
    async () => {
      // 2 コマ目からは変わった所だけを書き、残りは透明にするので、後始末は前のコマを残す (1) でないと絵が欠ける
      const gif = readGif(readFileSync((await shootTwoSteps("video")).files.gif as string));
      expect(gif.frames.length, "GIF のコマが 2 つ以上無い").toBeGreaterThan(1);
      gif.frames.slice(1).forEach((frame, i) => {
        expect(frame.dispose, `GIF の ${i + 2} コマ目の後始末`).toBe(1);
      });
    },
  );

  it(
    "gif-palette-fits-format",
    async () => {
      // GIF の色の表は 256 色まで。CCIP は表の上限まで色を使う。
      // 色の表は 1 コマごとに作るので、4 秒に 1 コマ (コマの数は 0 より大きい数を受ける) で撮り、コマを 3 つに絞る (#3410)
      const exportDiagram = await exporter();
      const result = await exportDiagram(ccipHead(), { outDir: scratch(), formats: ["gif"], gifFps: 0.25 });
      const gif = readGif(readFileSync(result.files.gif as string));
      expect(gif.frames.length, "CCIP の GIF にコマが無い").toBeGreaterThan(0);
      gif.frames.forEach((frame, i) => {
        expect(frame.table, `CCIP の GIF の ${i + 1} コマ目の色の表`).toBeLessThanOrEqual(256);
        if (frame.transparent !== undefined) expect(frame.transparent, `CCIP の GIF の ${i + 1} コマ目の透明の色の番号`).toBeLessThan(frame.table);
      });
    },
  );

  it(
    "png-export-shows-last-step",
    async () => {
      // PNG は最後の段の止め絵で撮る。まだ来ていない段の番号は出さないので、最初の段の止め絵には 2 段目の番号の丸が無い
      const result = await shootTwoSteps("png");
      const { layout } = draw("renderDiagram")(twoSteps());
      const png = PNG.sync.read(readFileSync(result.files.png as string));
      const scale = png.width / Math.ceil(layout.width);
      const badge = layout.badges.at(-1);
      expect(badge, "2 段の構成図に最後の段の番号の丸が無い").toBeDefined();
      if (!badge) return;
      // 丸は区画の地の上に在る。丸の 20px 下 (線の下の、箱の間の地) の色を地の色とし、
      // 丸の縁の淡い所を外した半径 (9.5px) の 8 割の内側で、地の色と離れた画素を数える
      const at = (x: number, y: number): number[] => [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 3)];
      const ground = at(Math.round(badge.x * scale), Math.round((badge.y + 20) * scale));
      const r = 9.5 * 0.8 * scale;
      let inside = 0;
      let painted = 0;
      for (let y = Math.floor(badge.y * scale - r); y <= badge.y * scale + r; y++) {
        for (let x = Math.floor(badge.x * scale - r); x <= badge.x * scale + r; x++) {
          if (Math.hypot(x + 0.5 - badge.x * scale, y + 0.5 - badge.y * scale) > r) continue;
          inside++;
          if (at(x, y).reduce((sum, v, k) => sum + Math.abs(v - (ground[k] as number)), 0) > 60) painted++;
        }
      }
      expect(painted / inside, `PNG の最後の段の番号の丸の中で、地の色 (${ground.join(", ")}) と違う画素の割合`).toBeGreaterThan(0.6);
    },
  );
});

describe("書き出し (#2986)", () => {
  // 原本の JSON と記法の file を、それぞれ 1 件 1 回の命令で書き出す (#3410)。2 つを 1 件で起こすと、混んだ機械で 1 件の上限 (10 秒) を超えた。
  // 4 つの形式を書くことは原本の JSON の件だけが確かめ、記法の file の件は HTML だけを書く (#3424)。命令で 4 つの形式を書くと混み 65 で 7.9 秒、HTML だけなら 3.7 秒だった
  it(
    "export-writes-four-formats",
    async () => {
      const dir = scratch();
      const input = join(dir, "small.json");
      writeFileSync(input, JSON.stringify(oneEdge()));
      // 書き出す先の dir はまだ無い
      const out = join(dir, "new", "small");
      // 4 つの形式に書かれることだけを見るので、2 秒に 1 コマで撮る (#3410)
      const ran = await runCliInProcess(["export", input, "--out", out, "--fps", "0.5", "--gif-fps", "0.5"]);
      expect(ran.code, `命令が落ちた: ${ran.stderr}`).toBe(0);
      for (const format of ["mp4", "gif", "html", "png"] as const) {
        const file = join(out, `small.${format}`);
        expect(formatOf(writtenBytes(file)), `${file} が ${format} として書かれていない`).toBe(format);
      }
    },
  );

  it(
    "export-notation-file-writes-html",
    async () => {
      const dir = scratch();
      const input = join(dir, "small-notation.dragon");
      writeFileSync(input, api("printNotation")(oneEdge()));
      const out = join(dir, "new", "small-notation");
      const ran = await runCliInProcess(["export", input, "--out", out, "--format", "html"]);
      expect(ran.code, `命令が落ちた: ${ran.stderr}`).toBe(0);
      const file = join(out, "small-notation.html");
      expect(formatOf(writtenBytes(file)), `${file} が html として書かれていない`).toBe("html");
    },
  );

  it(
    "export-is-deterministic",
    async () => {
      const exportDiagram = await exporter();
      const shots = [];
      for (const k of [0, 1]) {
        const outDir = join(scratch(), `run-${k}`);
        mkdirSync(outDir, { recursive: true });
        const result = await exportDiagram(smallArchitecture(), { outDir, formats: ["png"], theme: "dark" });
        expect(result.files.png, "PNG を書き出していない").toBeDefined();
        shots.push(readFileSync(result.files.png as string));
      }
      const [first, second] = shots as [Buffer, Buffer];
      const png = PNG.sync.read(first);
      expect(png.width).toBeGreaterThan(0);
      expect(first.equals(second), "同じ JSON から 2 回書き出した PNG がバイト単位で違う").toBe(true);
    },
  );

  it(
    "export-video-follows-camera",
    async () => {
      const exportDiagram = await exporter();
      // 書き手が寄って見せると決めた図。幅は指定しない
      // 全ての段を撮ると 45 秒の図になるので、見る範囲の離れた最初の段と最後の段だけを撮る (#3381)。
      // 比べるのは最初と途中の 2 コマなので、2 秒に 1 コマ (コマの数は 0 より大きい数を受ける) で撮る (#3410)。
      // 4 秒に 1 コマで撮ると、途中のコマの見る範囲が最初のコマと同じになった
      const full = exampleJson("ccip.json") as { steps: Json[] };
      const ccip = patched({ ...full, steps: [full.steps[0], full.steps.at(-1)].filter((step): step is Json => step !== undefined) }, ["view"], "follow");
      const result = await exportDiagram(ccip, { outDir: scratch(), formats: ["mp4", "html"], fps: 0.5 });
      expect(result.view).toBe("follow");
      expect(result.files.mp4, "mp4 を書き出していない").toBeDefined();

      const world = await miniWorld(readFileSync(result.files.html as string, "utf8"), result.width);
      const [first, middle] = await decodeFrames(readFileSync(result.files.mp4 as string), [0, 0.5]);
      if (!first || !middle) throw new Error("コマを読み戻せない");
      const scale = first.width / result.width;
      const a = inkCentroid(first, world, scale);
      const b = inkCentroid(middle, world, scale);
      expect(a.count, "最初のコマの全体図に今見ている所の枠が無い").toBeGreaterThan(0);
      expect(b.count, "途中のコマの全体図に今見ている所の枠が無い").toBeGreaterThan(0);
      expect(Math.hypot(a.x - b.x, a.y - b.y), "最初のコマと途中のコマで見ている範囲が同じ").toBeGreaterThan(2 * scale);
    },
  );

  it(
    "html-export-embeds-font-subset",
    async () => {
      const exportDiagram = await exporter();
      const result = await exportDiagram(mixed(), { outDir: scratch(), formats: ["html"] });
      const html = readFileSync(result.files.html as string, "utf8");
      const fonts = embeddedFonts(html);
      expect(new Set(fonts.map((font) => font.family))).toEqual(new Set(["Noto Sans JP Variable", "JetBrains Mono Variable"]));

      const drawn = new Set(await drawnText(html));
      const embedded = new Set<string>();
      for (const font of fonts) {
        const chars = await fontChars(font.woff2);
        const extra = [...chars].filter((char) => !drawn.has(char));
        expect(extra, `${font.family} の字の file に図で描かない字が入っている`).toEqual([]);
        chars.forEach((char) => embedded.add(char));
      }
      const missing = [...drawn].filter((char) => char.trim() !== "" && bundledCovers(char) && !embedded.has(char));
      expect(missing, "図で描く字が埋めた字の file に無い").toEqual([]);
    },
  );

  // 書き出した HTML に埋める script は全ての種類を持ち、部品を後から読まない (#3248)。頁の外を読めない形で全ての段を送る。
  // 種類ごとに 1 件 1 回の書き出しに分ける (#3410)。全ての種類を 1 件で書き出すと、混んだ機械で 1 件の上限 (10 秒) を超えた
  describe.for([
    { kind: "architecture", file: "ccip.dragon" },
    { kind: "git", file: "rebase.dragon" },
    { kind: "lineup", file: "auction.dragon" },
    { kind: "sequence", file: "api.dragon" },
    { kind: "state", file: "order.dragon" },
    { kind: "time", file: "finality.dragon" },
    { kind: "tree", file: "merkle.dragon" },
  ])("$kind", ({ kind, file }) => {
    it(
      "html-export-draws-every-kind",
      async () => {
        const exportDiagram = await exporter();
        const parsed = api("parseNotation")(exampleText(file));
        expect(parsed.ok, `見本 ${file} の記法を読めない`).toBe(true);
        if (!parsed.ok) return;
        const diagram = parsed.diagram as { kind?: string; steps: unknown[] };
        expect(diagram.kind ?? "architecture", `見本 ${file} の種類`).toBe(kind);
        const result = await exportDiagram(parsed.diagram, { outDir: scratch(), formats: ["html"] });
        const html = readFileSync(result.files.html as string, "utf8");
        expect(await captionSteps(html, 1280), `${kind} の書き出した HTML で送れた段の数`).toHaveLength(diagram.steps.length);
      },
    );
  });
});

describe("書き出した頁の帯と釦 (#2986、#3421)", () => {
  // 件ごとに頁を読み込んだ回数。件の名前は describe の名前から続けた全体の名前で持つ
  let loadsAtStart = 0;
  beforeEach(() => {
    loadsAtStart = pageLoads();
  });
  afterEach(() => {
    const name = expect.getState().currentTestName ?? "";
    if (!name.includes("html-export-band-")) bandLoads.set(name, pageLoads() - loadsAtStart);
  });

  it(
    "html-export-caption-bar-steady",
    async () => {
      // 段の本文の行の数で帯の高さが替わると、帯の下の中身が段ごとに上下する (#3049)
      const steps = await captionSteps(await oauthHtml(), 390);
      expect(steps.length, "書き出した HTML の段が読めない").toBeGreaterThan(1);
      const [first] = steps;
      for (const step of steps) {
        expect({ bar: step.bar, top: step.top }, `${step.step} の帯の高さか図の上端の位置が 1 段目と違う`).toEqual({ bar: first?.bar, top: first?.top });
      }
    },
  );

  // 幅ごとに 1 件 1 頁で確かめる (#3421)。600 は中身の幅が 640px より狭く、携帯の幅と同じく積む (#3398)
  describe.for([{ width: 360 }, { width: 390 }, { width: 430 }, { width: 600 }])("幅 $width", ({ width }) => {
    it(
      "html-export-narrow-caption-stacks-body",
      async () => {
        // 携帯の幅では釦と番号と題と本文を横 1 列に並べ、本文の欄が帯の幅の 4 割ほどに細って帯が高くなっていた (#3057)。
        // 帯は上から、操作の段 (釦と段ごとの進み具合)、段の番号と題、題の下の説明文の順に置き、題は番号の右から、説明文は帯の左端から帯の右端までを使う (#3398)
        const { inner, buttons, no, title, body } = await captionLayout(await oauthHtml(), width);
        const sameRow = (a: { y: number; h: number }, b: { y: number; h: number }): boolean => a.y < b.y + b.h && a.y + a.h > b.y;
        expect(
          { withTitle: sameRow(no, title), left: no.x + no.w <= title.x + 0.5, edge: Math.abs(no.x - inner.left) <= 1 },
          `幅 ${width}px で、段の番号が題と同じ段の左端に無い`,
        ).toEqual({ withTitle: true, left: true, edge: true });
        expect(body.y, `幅 ${width}px で、本文が題の下に無い`).toBeGreaterThanOrEqual(title.y + title.h - 0.5);
        expect(buttons.y + buttons.h, `幅 ${width}px で、釦が題の上に無い`).toBeLessThanOrEqual(title.y + 0.5);
        expect(Math.abs(buttons.x - inner.left), `幅 ${width}px で、釦が帯の左端から始まらない`).toBeLessThanOrEqual(1);
        expect(
          { title: Math.abs(title.x + title.w - inner.right) <= 1, body: Math.abs(body.x + body.w - inner.right) <= 1 },
          `幅 ${width}px で、題か本文が帯の中身の右端までの幅を使わない`,
        ).toEqual({ title: true, body: true });
        expect(title.w, `幅 ${width}px で、題の欄が帯の中身の幅の 8 割より細い`).toBeGreaterThanOrEqual(0.8 * (inner.right - inner.left));
      },
    );
  });

  describe.for([{ width: 800 }, { width: 1280 }])("幅 $width", ({ width }) => {
    it(
      "html-export-wide-caption-one-row",
      async () => {
        // 広い帯は釦を題の行の右に置き、進み具合を説明文の下の全幅の帯にする。縦に積むと帯が高くなり、低い画面で大きな図が寄って追う図に替わる (#3398)
        const { inner, buttons, title, body, segments } = await captionLayout(await oauthHtml(), width);
        expect(
          {
            buttonsBesideTitle: buttons.y < title.y + title.h && buttons.y + buttons.h > title.y && buttons.x >= title.x + title.w - 0.5,
            buttonsAtRight: Math.abs(buttons.x + buttons.w - inner.right) <= 1,
            bodyUnderTitle: body.y >= title.y + title.h - 0.5,
            segmentsUnder: segments.y >= Math.max(body.y + body.h, buttons.y + buttons.h) - 0.5,
            segmentsFull: Math.abs(segments.x - inner.left) <= 1 && Math.abs(segments.x + segments.w - inner.right) <= 1,
          },
          `幅 ${width}px で、釦が題の行の右に無いか、進み具合が説明文の下の全幅に無い`,
        ).toEqual({ buttonsBesideTitle: true, buttonsAtRight: true, bodyUnderTitle: true, segmentsUnder: true, segmentsFull: true });
      },
    );
  });

  describe.for([
    { width: 360, size: "44x44" },
    { width: 390, size: "44x44" },
    { width: 430, size: "44x44" },
    { width: 1440, size: "36x36" },
  ])("幅 $width", ({ width, size }) => {
    it(
      "html-export-player-buttons-touch-size",
      async () => {
        // 段を送る釦は 36px で間が 5px しか無く、携帯の幅では前と次を押し違えやすかった (#3069)。帯の中身が 440px より狭い時だけ 44px にする。
        // 釦はやり直し、前、名前の付いた再生、次の 4 つで、再生の釦だけ名前の分だけ横に長い (#3398)
        expect(fourButtons(await playerButtons(await oauthHtml(), width), size), `幅 ${width}px で、段を送る釦が ${size} でない`).toEqual(FOUR_BUTTONS);
      },
    );
  });

  it(
    "html-export-coarse-player-buttons",
    async () => {
      // 指で触るタブレットでは、広い帯の段を送る釦も 36px で押しにくかった (#3076)。指で触る時は帯の幅に関わらず 44px にする
      expect(fourButtons(await playerButtons(await oauthHtml(), 1024, true), "44x44"), "指で触る幅 1024px で、段を送る釦が 44x44 でない").toEqual(FOUR_BUTTONS);
    },
  );

  it("html-export-band-exports-oauth-once", () => {
    // 帯と釦の件は、`oauth.json` を HTML に 1 度だけ書き出して使い回す (#3421)。この describe の最後の件として、帯と釦の件の後に数える
    expect(oauthExports, "帯と釦の件が oauth.json を HTML に書き出した回数").toBe(bandLoads.size > 0 ? 1 : 0);
  });

  it("html-export-band-loads-once-per-case", () => {
    // 帯と釦の件は幅ごとの件に分かれ、件ごとにその幅の頁を 1 度だけ読み込む (#3421)。開いた後に読み直すと 2 度と数える
    expect(bandLoads.size, "帯と釦の件が 1 つも回っていない").toBeGreaterThan(0);
    expect([...bandLoads].filter(([, count]) => count !== 1), "頁を 1 度だけ読み込まない帯と釦の件 (件の名前と読み込んだ回数)").toEqual([]);
  });
});

describe("書き出しの件の分け方 (#3424)", () => {
  it("four-formats-written-once-from-json", ({ task }) => {
    // 4 つの形式を書く件は原本の JSON の 1 件だけで、記法の file は HTML だけを書く件で確かめる。命令で 4 つの形式を書くと混み 65 で 7.9 秒、HTML だけなら 3.7 秒だった
    expect(casesNamed(task.file, "export-writes-four-formats"), "4 つの形式を書く件").toHaveLength(1);
    expect(casesNamed(task.file, "export-notation-file-writes-html"), "記法の file を HTML に書き出す件").toHaveLength(1);
  });
});

describe("書き出した配管の図の畳んだ箱 (#3418)", () => {
  it(
    "export-pipe-opens-inner-steps-by-progress",
    async () => {
      // 書き出しが内側の段を 1 段にまとめた後の原本を収めると、押しても段が分かれない。進み具合の帯で確かめる。
      // 配管の図の帯は段の番号と題を出す (#3450)
      const exportDiagram = await exporter();
      const result = await exportDiagram(exampleJson("aggregator.json"), { outDir: scratch(), formats: ["html"] });
      const html = readFileSync(result.files.html as string, "utf8");
      const seen = await unfoldedSteps(html, 1280, 2);
      expect(seen.before, "畳んだ箱を押す前の進み具合の帯").toEqual({ count: 8, now: 2 });
      expect(seen.after, "畳んだ箱を押した後の進み具合の帯").toEqual({ count: 14, now: 3 });
      expect(seen.numberShown, "書き出した配管の図に段の番号が出ない").toBe(true);
    },
  );
});
