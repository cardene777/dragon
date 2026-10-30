/**
 * 書き出しの命令が字の重なりを知らせる流れ (#3197)。
 *
 * 書き出しの命令は、重なりのある図でも file を書き出したうえで、標準エラーに重なりを 1 件 1 行で段と文で出し、終わり方 0 で終える (#3178)。
 * 線の無い段の番号を箱の角に置いてから (#3187) 字の重なる図を作れないので、命令の元の code (`src/cli.ts`) をこの処理の中で読み込み、
 * 重なりを探す所 (`findOverlaps`) だけを包んで (`paired-overlap.ts`)、2 段目に図に描いた 2 つの字を組にした重なりを 1 件足す。
 * 図を読む所、file を書き出す所、標準エラーと終わり方は本物の流れを通す。
 *
 * 組み上がった命令 (`dist/cli.js`) は包まずに走らせ、重ならない図で標準エラーに何も出さないことを `overlap-notice.test.ts` が確かめる。
 */
import { mkdtempSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/render/ink", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/render/ink")>();
  const { withPairedOverlap } = await import("./paired-overlap");
  return { ...real, findOverlaps: withPairedOverlap(real.findOverlaps) };
});

/**
 * 2 段目に書き込みだけを持つ状態遷移図。通らない箱「支払い済み」を脇道の囲みに入れ、囲みの名前「脇道」と添え書き「今回は通らない」を描く。
 * 包みは 2 段目に見えている字から、描いた順に添え書きと囲みの名前を組にする
 */
const OVERLAPPING = join(process.cwd(), "packages/dragon/test/fixtures/corner-note.dragon");

/**
 * PNG は Chromium を起こして撮るので、既定の 30 秒では足りないことがある。
 * HTML は組み上がった再生の script (`dist/player.global.js`) を埋めるため、元の code から走らせるこの検査では PNG で書き出す
 */
const SLOW = 90_000;

interface Ran {
  code: number;
  stdout: string[];
  stderr: string[];
}

/**
 * 命令の元の code を、渡した引数で 1 度走らせる。
 * 命令は読み込むと走り、終わると `process.exit` を呼ぶので、読み込む前に引数を差し替え、`process.exit` で終わり方を受け取る
 */
async function runInProcess(args: string[]): Promise<Ran> {
  vi.resetModules();
  const stdout: string[] = [];
  const stderr: string[] = [];
  const argv = process.argv;
  const log = vi.spyOn(console, "log").mockImplementation((...parts: unknown[]) => void stdout.push(parts.join(" ")));
  const error = vi.spyOn(console, "error").mockImplementation((...parts: unknown[]) => void stderr.push(parts.join(" ")));
  let exited: (code: number) => void = () => {};
  const ended = new Promise<number>((done) => {
    exited = done;
  });
  const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    exited(code ?? 0);
    return undefined as never;
  }) as typeof process.exit);
  process.argv = [argv[0] ?? process.execPath, "dragon", ...args];
  try {
    await import("../src/cli");
    return { code: await ended, stdout, stderr };
  } finally {
    process.argv = argv;
    log.mockRestore();
    error.mockRestore();
    exit.mockRestore();
  }
}

describe("書き出しの命令が字の重なりを知らせる (#3197)", () => {
  it(
    "export-warns-overlaps",
    async () => {
      const out = mkdtempSync(join(tmpdir(), "dragon-overlap-cli-"));
      const ja = await runInProcess(["export", OVERLAPPING, "--format", "png", "--out", out]);
      expect(ja.code, ja.stderr.join("\n")).toBe(0);
      expect(readdirSync(out), "重なる図を書き出さなかった").toContain("corner-note.png");
      expect(statSync(join(out, "corner-note.png")).size, "書き出した file が空").toBeGreaterThan(0);
      expect(ja.stdout, "書き出した file の path を標準出力に出さない").toEqual([join(out, "corner-note.png")]);
      expect(ja.stderr, "標準エラーに重なりが 1 件 1 行で出ない").toEqual(["段 2: 「今回は通らない」と「脇道」が重なる"]);

      const en = await runInProcess(["export", OVERLAPPING, "--format", "png", "--out", out, "--lang", "en"]);
      expect(en.code, en.stderr.join("\n")).toBe(0);
      expect(en.stderr, "英語の標準エラーに重なりが 1 件 1 行で出ない").toEqual(['Step 2: "Not taken this time" and "Side path" overlap']);
    },
    SLOW,
  );
});
