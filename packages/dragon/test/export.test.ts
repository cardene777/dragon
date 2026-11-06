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
import { describe, expect, it } from "vitest";
import { api, exampleJson, exampleText, type Json, patched, smallArchitecture, smallSequence } from "./diagram-support";
import { bundledCovers, captionLayout, captionSteps, decodeFrames, drawnText, embeddedFonts, type Exported, exporter, fontChars, formatOf, inkCentroid, miniWorld, playerButtons, readGif, runCli, unfoldedSteps } from "./export-support";
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

/** 2 段の構成図を、コマの数を指定せずに mp4、GIF、PNG に書き出した物。3 つの検査が同じ書き出しを読む */
/**
 * 2 段の図を 1 秒 2 コマの mp4 と 1 秒 1 コマの GIF と PNG に書き出す。同じ file の検査で 1 度だけ撮る。
 * 既定のコマの数 (1 秒 30 コマ) で撮ると 20 秒を超え、1 件の上限 (10 秒、#3381) に収まらない。既定の数は `export-defaults.test.ts` が確かめる
 */
const RATES = { fps: 2, gifFps: 1 } as const;
let twoStepsShot: Promise<Exported> | undefined;
const shootTwoSteps = (): Promise<Exported> => {
  twoStepsShot ??= exporter().then((exportDiagram) => exportDiagram(twoSteps(), { outDir: scratch(), formats: ["mp4", "gif", "png"], ...RATES }));
  return twoStepsShot;
};

/** CCIP の最初の 3 段。全ての段を撮ると 45 秒の図になり、1 件の上限 (10 秒、#3381) の中で撮れない */
const ccipHead = (): Json => {
  const ccip = exampleJson("ccip.json") as { steps: Json[] };
  return { ...ccip, steps: ccip.steps.slice(0, 3) };
};

describe("書き出しのコマと形 (#3115)", () => {
  it(
    "export-frame-counts-follow-rates",
    async () => {
      // 渡したコマの数のとおりに撮る。mp4 は 1 秒 2 コマ、GIF は 1 秒 1 コマで、GIF の 1 コマは 1 秒。既定の数は export-defaults.test.ts が確かめる (#3381)
      const result = await shootTwoSteps();
      const { total } = draw("renderDiagram")(twoSteps()).timeline;
      expect(result.frames, `1 周 ${total} 秒の mp4 のコマの数`).toBe(Math.round(total * RATES.fps));
      const gif = readGif(readFileSync(result.files.gif as string));
      expect(gif.frames.length, `1 周 ${total} 秒の GIF のコマの数`).toBe(Math.round(total * RATES.gifFps));
      expect([...new Set(gif.frames.map((frame) => frame.delay))], "GIF の 1 コマの長さ (1/100 秒)").toEqual([100 / RATES.gifFps]);
    },
  );

  it(
    "gif-keeps-unchanged-pixels",
    async () => {
      // 2 コマ目からは変わった所だけを書き、残りは透明にするので、後始末は前のコマを残す (1) でないと絵が欠ける
      const gif = readGif(readFileSync((await shootTwoSteps()).files.gif as string));
      expect(gif.frames.length, "GIF のコマが 2 つ以上無い").toBeGreaterThan(1);
      gif.frames.slice(1).forEach((frame, i) => {
        expect(frame.dispose, `GIF の ${i + 2} コマ目の後始末`).toBe(1);
      });
    },
  );

  it(
    "gif-palette-fits-format",
    async () => {
      // GIF の色の表は 256 色まで。CCIP は表の上限まで色を使う
      const exportDiagram = await exporter();
      const result = await exportDiagram(ccipHead(), { outDir: scratch(), formats: ["gif"], gifFps: 1 });
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
      const result = await shootTwoSteps();
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
  it(
    "export-writes-four-formats",
    async () => {
      const dir = scratch();
      const json = join(dir, "small.json");
      writeFileSync(json, JSON.stringify(smallSequence()));
      const notation = join(dir, "small-notation.dragon");
      writeFileSync(notation, api("printNotation")(smallSequence()));

      // 書き出す先の dir はまだ無い。2 つの命令は互いに独立しているので、並べて起こす (#3381)
      const cases = [
        [json, join(dir, "new", "from-json"), "small"],
        [notation, join(dir, "new", "from-notation"), "small-notation"],
      ] as const;
      await Promise.all(
        cases.map(async ([input, out, name]) => {
          const ran = await runCli(["export", input, "--out", out, "--fps", "2", "--gif-fps", "1"]);
          expect(ran.code, `命令が落ちた: ${ran.stderr}`).toBe(0);
          for (const format of ["mp4", "gif", "html", "png"] as const) {
            const file = join(out, `${name}.${format}`);
            let bytes = Buffer.alloc(0);
            try {
              bytes = readFileSync(file);
            } catch {
              // 無い時は下の判定で落とす
            }
            expect(formatOf(bytes), `${file} が ${format} として書かれていない`).toBe(format);
          }
        }),
      );
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
      // 全ての段を撮ると 45 秒の図になるので、見る範囲の離れた最初の段と最後の段だけを撮る (#3381)
      const full = exampleJson("ccip.json") as { steps: Json[] };
      const ccip = patched({ ...full, steps: [full.steps[0], full.steps.at(-1)].filter((step): step is Json => step !== undefined) }, ["view"], "follow");
      const result = await exportDiagram(ccip, { outDir: scratch(), formats: ["mp4", "html"], fps: 2 });
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

  it(
    "html-export-caption-bar-steady",
    async () => {
      // 段の本文の行の数で帯の高さが替わると、帯の下の中身が段ごとに上下する (#3049)
      const exportDiagram = await exporter();
      const result = await exportDiagram(exampleJson("oauth.json"), { outDir: scratch(), formats: ["html"] });
      const steps = await captionSteps(readFileSync(result.files.html as string, "utf8"), 390);
      expect(steps.length, "書き出した HTML の段が読めない").toBeGreaterThan(1);
      const [first] = steps;
      for (const step of steps) {
        expect({ bar: step.bar, top: step.top }, `${step.step} の帯の高さか図の上端の位置が 1 段目と違う`).toEqual({ bar: first?.bar, top: first?.top });
      }
    },
  );

  it(
    "html-export-narrow-caption-stacks-body",
    async () => {
      // 携帯の幅では釦と番号と題と本文を横 1 列に並べ、本文の欄が帯の幅の 4 割ほどに細って帯が高くなっていた (#3057)。
      // 釦を指で押せる 44px にすると題に回る幅が減って題が細かく折れるので、題を釦の下の段の全幅に置く (#3069)
      const exportDiagram = await exporter();
      const result = await exportDiagram(exampleJson("oauth.json"), { outDir: scratch(), formats: ["html"] });
      const html = readFileSync(result.files.html as string, "utf8");
      for (const width of [360, 390, 430]) {
        const { inner, buttons, no, title, body } = await captionLayout(html, width);
        const sameRow = (r: { y: number; h: number }): boolean => r.y < buttons.y + buttons.h && r.y + r.h > buttons.y;
        const full = (r: { x: number; w: number }): { left: boolean; right: boolean } => ({ left: Math.abs(r.x - buttons.x) <= 1, right: Math.abs(r.x + r.w - inner.right) <= 1 });
        expect({ no: sameRow(no), title: sameRow(title) }, `幅 ${width}px で、段の番号が釦と同じ段に無いか、題が釦と同じ段にある`).toEqual({ no: true, title: false });
        expect(title.y, `幅 ${width}px で、題が釦の段の下に無い`).toBeGreaterThanOrEqual(buttons.y + buttons.h - 0.5);
        expect(body.y, `幅 ${width}px で、本文が題の下に無い`).toBeGreaterThanOrEqual(title.y + title.h - 0.5);
        // 番号の箱は釦と同じ高さで上端も釦にそろい、題は釦の段の下の間 (5px) の後に始まる。番号の箱が伸びると帯が高くなる (#3097、#3099)。
        // 本文は題のすぐ下に置き、間を空けない (#3101)。題の段の高さは最も高い題で決まるので、この比べは今の段の題が最も高いこの見本で成り立つ
        expect(
          {
            no: Math.round(no.h),
            top: Math.round(no.y) - Math.round(buttons.y),
            gap: Math.round(title.y - (buttons.y + buttons.h)),
            body: Math.round(body.y) - Math.round(title.y + title.h),
          },
          `幅 ${width}px で、段の番号の箱が釦と同じ 44px でないか、上端が釦とそろわないか、題が釦の下端から 5px の所に無いか、本文が題のすぐ下に無い`,
        ).toEqual({ no: 44, top: 0, gap: 5, body: 0 });
        expect({ title: full(title), body: full(body) }, `幅 ${width}px で、題か本文が釦の左端から帯の中身の右端までの幅を使わない`).toEqual({
          title: { left: true, right: true },
          body: { left: true, right: true },
        });
      }
    },
  );

  it(
    "html-export-player-buttons-touch-size",
    async () => {
      // 段を送る釦は 36px で間が 5px しか無く、携帯の幅では前と次を押し違えやすかった (#3069)。帯の中身が 440px より狭い時だけ 44px にする
      const exportDiagram = await exporter();
      const result = await exportDiagram(exampleJson("oauth.json"), { outDir: scratch(), formats: ["html"] });
      const html = readFileSync(result.files.html as string, "utf8");
      for (const [width, size] of [
        [360, "44x44"],
        [390, "44x44"],
        [430, "44x44"],
        [1440, "36x36"],
      ] as const) {
        expect(await playerButtons(html, width), `幅 ${width}px で、段を送る釦が ${size} でない`).toEqual([size, size, size]);
      }
    },
  );

  it(
    "html-export-coarse-player-buttons",
    async () => {
      // 指で触るタブレットでは、広い帯の段を送る釦も 36px で押しにくかった (#3076)。指で触る時は帯の幅に関わらず 44px にする
      const exportDiagram = await exporter();
      const result = await exportDiagram(exampleJson("oauth.json"), { outDir: scratch(), formats: ["html"] });
      const html = readFileSync(result.files.html as string, "utf8");
      expect(await playerButtons(html, 1024, true), "指で触る幅 1024px で、段を送る釦が 44x44 でない").toEqual(["44x44", "44x44", "44x44"]);
    },
  );

  it(
    "html-export-draws-every-kind",
    async () => {
      // 書き出した HTML に埋める script は全ての種類を持ち、部品を後から読まない (#3248)。頁の外を読めない形で全ての段を送る
      const exportDiagram = await exporter();
      const parse = api("parseNotation");
      const kinds: Record<string, string> = {
        architecture: "ccip.dragon",
        git: "rebase.dragon",
        lineup: "auction.dragon",
        sequence: "api.dragon",
        state: "order.dragon",
        time: "finality.dragon",
        tree: "merkle.dragon",
      };
      // 種類ごとの書き出しは互いに独立しているので、並べて回す (#3381)
      await Promise.all(
        Object.entries(kinds).map(async ([kind, file]) => {
          const parsed = parse(exampleText(file));
          expect(parsed.ok, `見本 ${file} の記法を読めない`).toBe(true);
          if (!parsed.ok) return;
          const diagram = parsed.diagram as { kind?: string; steps: unknown[] };
          expect(diagram.kind ?? "architecture", `見本 ${file} の種類`).toBe(kind);
          const result = await exportDiagram(parsed.diagram, { outDir: scratch(), formats: ["html"] });
          const html = readFileSync(result.files.html as string, "utf8");
          expect(await captionSteps(html, 1280), `${kind} の書き出した HTML で送れた段の数`).toHaveLength(diagram.steps.length);
        }),
      );
    },
  );
});

describe("書き出した配管の図の畳んだ箱 (#3398)", () => {
  it(
    "export-pipe-opens-inner-steps",
    async () => {
      // 書き出しが内側の段を 1 段にまとめた後の原本を収めると、押しても段が分かれない
      const exportDiagram = await exporter();
      const result = await exportDiagram(exampleJson("aggregator.json"), { outDir: scratch(), formats: ["html"] });
      const html = readFileSync(result.files.html as string, "utf8");
      const seen = await unfoldedSteps(html, 1280, "03/08");
      expect(seen.before, "畳んだ箱の段の番号").toBe("03/08");
      expect(seen.after, "畳んだ箱を押した後の段の番号").toBe("04/14");
      expect(seen.steps, "畳んだ箱を押した後の段の数").toBe(14);
    },
  );
});
