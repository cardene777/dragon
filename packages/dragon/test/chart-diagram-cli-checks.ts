/**
 * `chart-diagram.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { type Json } from "./diagram-support";
import { captionSteps, formatOf } from "./export-support";
import { exportInThread, threadStats, warmThread } from "./export-thread";
import "../src/kinds/basics";
import "../src/kind-use/architecture";
import "../src/kind-use/chart";
import "../src/kind-use/git";
import "../src/kind-use/lineup";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/kind-use/time";
import "../src/kind-use/try";

const ROOT = process.cwd();

const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** ドーナツの見本と横棒の見本 */
const DONUT = "os-share";

const BAR = "tickets";

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

const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-chart-export-"));

/** 書き出した file の中身。無い時は空にして、形の判定で落とす */
function writtenBytes(file: string): Buffer {
  try {
    return readFileSync(file);
  } catch {
    return Buffer.alloc(0);
  }
}

/** 見本の最初の段だけの原本。動画のコマを減らす */
const firstStep = (name: string): Json => {
  const sample = exampleJson(`${name}.json`) as { steps: Json[] };
  return { ...sample, steps: sample.steps.slice(0, 1) };
};

/**
 * 4 つの形式の書き出しを 1 件ずつに分ける。1 件で全てを書き出すと、混んだ機械で 1 件の上限 (10 秒) を超える。
 * 動画は 1 秒 1 コマと 2 秒に 1 コマで最初の段だけを撮り、PNG は同じ JSON を 2 回書き出してバイトで比べ、HTML は全ての段を送る
 */
const SHOTS = [
  { shot: "video", name: DONUT },
  { shot: "png", name: BAR },
  { shot: "html", name: DONUT },
  { shot: "html", name: BAR },
] as const;

/** 書き出した物。動画は 2 つの形式の中身、PNG は 2 回書き出した中身、HTML は中身と図の段の数と頁で送れた段の数 */
type Exported =
  | { shot: "video"; files: Record<"mp4" | "gif", Buffer> }
  | { shot: "png"; shots: Buffer[] }
  | { shot: "html"; html: Buffer; steps: number; sent: number };

// 1 つの形式でも、書き出して頁で段を送ると、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。
// 4 つの書き出しを file を読み込む段で順に済ませ、件はその結果を読む。キーは `形式 見本`
const EXPORTED = await atLoad("量の図を 4 つの形式で書き出す", async () => {
  // thread を作り Chromium を起こす段を先に済ませる (#3602)。2 回目からの書き出しは用意済みで待たない
  await warmThread();
  const done = new Map<string, Exported>();
  for (const { shot, name } of SHOTS) {
    if (shot === "video") {
      const files = await exportInThread(firstStep(name), { outDir: scratch(), formats: ["mp4", "gif"], fps: 1, gifFps: 0.5 });
      done.set(`${shot} ${name}`, { shot, files: { mp4: writtenBytes(files.mp4 ?? ""), gif: writtenBytes(files.gif ?? "") } });
      continue;
    }
    const diagram = exampleJson(`${name}.json`);
    if (shot === "png") {
      const shots: Buffer[] = [];
      for (let k = 0; k < 2; k++) shots.push(writtenBytes((await exportInThread(diagram, { outDir: scratch(), formats: ["png"] })).png ?? ""));
      done.set(`${shot} ${name}`, { shot, shots });
      continue;
    }
    const html = writtenBytes((await exportInThread(diagram, { outDir: scratch(), formats: ["html"] })).html ?? "");
    const sent = formatOf(html) === "html" ? (await captionSteps(html.toString("utf8"), 1280)).length : 0;
    done.set(`${shot} ${name}`, { shot, html, steps: (diagram as { steps: Json[] }).steps.length, sent });
  }
  return done;
});

describe.for(SHOTS)("量の図の書き出し (#3560) $shot $name", ({ shot, name }) => {
  it("chart-exports-every-format", () => {
    const done = EXPORTED.get().get(`${shot} ${name}`);
    expect(done?.shot, `${name} を ${shot} で書き出していない`).toBe(shot);
    if (done?.shot === "video") {
      for (const format of ["mp4", "gif"] as const) expect(formatOf(done.files[format]), `${name} が ${format} に書き出されない`).toBe(format);
    } else if (done?.shot === "png") {
      expect(formatOf(done.shots[0] as Buffer), `${name} が PNG に書き出されない`).toBe("png");
      expect((done.shots[0] as Buffer).equals(done.shots[1] as Buffer), `${name} を 2 回書き出した PNG がバイト単位で違う`).toBe(true);
    } else if (done?.shot === "html") {
      expect(formatOf(done.html), `${name} が HTML に書き出されない`).toBe("html");
      expect(done.sent, `${name} の書き出した HTML で送れた段の数`).toBe(done.steps);
    }
  });
});


/**
 * 書き出しの thread は Chromium を 1 度だけ起こし、2 回目からの書き出しは同じ Chromium を借りる (#3602)。
 * 書き出すたびに起こすと、混んだ機械で PNG を 2 回書き出す件が 1 件の上限 (10 秒) を超えた
 */
describe("量の図の書き出しの thread (#3602)", () => {
  it("chart-export-thread-launches-once", async () => {
    const { launches, exports } = await threadStats();
    expect(exports, "書き出しの件より後に回し、thread で 2 回以上書き出している").toBeGreaterThanOrEqual(2);
    expect(launches, `thread で ${exports} 回書き出す間に Chromium を起こした回数`).toBe(1);
  });
});
