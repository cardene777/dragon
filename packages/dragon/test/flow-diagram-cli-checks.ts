/**
 * `flow-diagram.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { type Json } from "./diagram-support";
import { captionSteps, exporter, formatOf } from "./export-support";
import "../src/kinds/basics";
import "../src/kind-use/architecture";
import "../src/kind-use/chart";
import "../src/kind-use/flow";
import "../src/kind-use/git";
import "../src/kind-use/lineup";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/kind-use/time";
import "../src/kind-use/tree";

const ROOT = process.cwd();

const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** ログインの判断の 4 段の題 (step 4 で決めた) */
const LOGIN_STEPS = ["入力する", "パスワードを確かめる", "2FAを確かめる", "ログインする"] as const;

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** 見本の原本の JSON。無ければ落とす */
function exampleJson(name: string): Json {
  const text = fileText(name);
  expect(text, `${name} が packages/dragon/examples に無い`).toBeDefined();
  return JSON.parse(text ?? "{}") as Json;
}

/**
 * 書き出しの件は 1 件の上限 (10 秒) に収めるため、形式ごとに分ける (#3410)。
 * 書き出す部品は検査の外 (この file を読む段) で先に読む。最初の件が読むと、混んだ機械で読むだけで上限に近づく
 */
const exportDiagram = await exporter();

// 形式ごとに分けても、書き出して頁で段を送る件が混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。
// 3 つの形式の書き出しと、書き出した HTML で段を送る所を file を読み込む段で順に済ませ、件は書き出した file と送れた段を読む
const FLOW_EXPORTED = await atLoad("手順の図を 3 つの形式で書き出す", async () => {
  const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-flow-"));
  const login = exampleJson("login-check.json") as { steps: Json[] };
  /** 動画と PNG で撮る図。コマの数とバイトの一致を比べるだけなので最初の段だけを撮る。4 段を 2 回撮ると、混んだ機械で上限を超えた */
  const firstStep = { ...login, steps: login.steps.slice(0, 1) };
  const video = await exportDiagram(firstStep, { outDir: scratch(), formats: ["mp4", "gif"], fps: 1, gifFps: 0.5 });
  const pngs: Awaited<ReturnType<typeof exportDiagram>>[] = [];
  for (const k of [0, 1]) pngs.push(await exportDiagram(firstStep, { outDir: join(scratch(), `run-${k}`), formats: ["png"] }));
  const html = await exportDiagram(login, { outDir: scratch(), formats: ["html"] });
  // 書き出した HTML で全ての段を送る
  const sent = html.files.html === undefined ? [] : await captionSteps(readFileSync(html.files.html, "utf8"), 1280);
  return { video, pngs, html, sent };
});

describe("手順の図の書き出し (#3561)", () => {
  it("flow-exports-every-format", () => {
    const { video } = FLOW_EXPORTED.get();
    for (const format of ["mp4", "gif"] as const) expect(formatOf(readFileSync(video.files[format] ?? "")), `手順の図の ${format} の書き出し`).toBe(format);
  });

  it("flow-exports-every-format", () => {
    const { pngs } = FLOW_EXPORTED.get();
    for (const result of pngs) expect(result.files.png, "手順の図の PNG を書き出していない").toBeDefined();
    const shots = pngs.map((result) => readFileSync(result.files.png ?? ""));
    expect(formatOf(shots[0] as Buffer), "手順の図の png の書き出し").toBe("png");
    expect((shots[0] as Buffer).equals(shots[1] as Buffer), "同じ手順の図を 2 回書き出した PNG がバイト単位で一致しない").toBe(true);
  });

  it("flow-exports-every-format", () => {
    const { html, sent } = FLOW_EXPORTED.get();
    expect(formatOf(readFileSync(html.files.html ?? "")), "手順の図の html の書き出し").toBe("html");
    expect(sent.map((s) => s.step), "書き出した HTML で送れた段").toEqual(LOGIN_STEPS.map((_, i) => `0${i + 1}/04`));
  });
});
