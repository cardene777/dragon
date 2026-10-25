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
import { api, exampleJson, type Json, patched, smallArchitecture, smallSequence } from "./diagram-support";
import { bundledCovers, captionLayout, captionSteps, decodeFrames, drawnText, embeddedFonts, exporter, fontChars, formatOf, inkCentroid, miniWorld, playerButtons, runCli } from "./export-support";

/** 書き出し 1 回に許す時間。Chromium の起動とコマを撮る時間を含む */
const SLOW = 180_000;

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

describe("書き出し (#2986)", () => {
  it(
    "export-writes-four-formats",
    async () => {
      const dir = scratch();
      const json = join(dir, "small.json");
      writeFileSync(json, JSON.stringify(smallSequence()));
      const notation = join(dir, "small-notation.dragon");
      writeFileSync(notation, api("printNotation")(smallSequence()));

      // 書き出す先の dir はまだ無い
      for (const [input, out, name] of [
        [json, join(dir, "new", "from-json"), "small"],
        [notation, join(dir, "new", "from-notation"), "small-notation"],
      ] as const) {
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
      }
    },
    SLOW,
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
    SLOW,
  );

  it(
    "export-video-follows-camera",
    async () => {
      const exportDiagram = await exporter();
      // 書き手が寄って見せると決めた図。幅は指定しない
      const ccip = patched(exampleJson("ccip.json"), ["view"], "follow");
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
    SLOW,
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
    SLOW,
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
    SLOW,
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
        // 番号の箱は釦と同じ高さで上端も釦にそろい、題は釦の段の下の間 (5px) の後に始まる。番号の箱が伸びると帯が高くなる (#3097、#3099)
        expect(
          { no: Math.round(no.h), top: Math.round(no.y) - Math.round(buttons.y), gap: Math.round(title.y - (buttons.y + buttons.h)) },
          `幅 ${width}px で、段の番号の箱が釦と同じ 44px でないか、上端が釦とそろわないか、題が釦の下端から 5px の所に無い`,
        ).toEqual({ no: 44, top: 0, gap: 5 });
        expect({ title: full(title), body: full(body) }, `幅 ${width}px で、題か本文が釦の左端から帯の中身の右端までの幅を使わない`).toEqual({
          title: { left: true, right: true },
          body: { left: true, right: true },
        });
      }
    },
    SLOW,
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
    SLOW,
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
    SLOW,
  );
});
