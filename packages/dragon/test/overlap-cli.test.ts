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

/*
 * 命令の元の code が読む部品を、検査の外 (この file を読む段) で先に読む (#3410)。
 * 元の code は 500 を超える file を読み、初めて読む時に 1 つずつ変換する。検査の中で初めて読むと、混んだ機械で変換だけで 9 秒かかった。
 * 変換は 1 回の実行の中で使い回すので、検査の中で命令を読み直す (`vi.resetModules`) 時は変換し直さない。命令そのもの (`src/cli.ts`) は読むと走るので、ここでは読まない。
 * Chromium を起こす部品 (`playwright-core`) は書き出す時に初めて読むので、これも先に読む
 */
await Promise.all([
  import("../src/export/embed"),
  import("../src/export/index"),
  import("../src/look/values"),
  import("../src/parser"),
  import("../src/render/ink"),
  import("../src/words"),
  import("playwright-core"),
]);

/**
 * 2 段目に書き込みだけを持つ状態遷移図。通らない箱「支払い済み」を脇道の囲みに入れ、囲みの名前「脇道」と添え書き「今回は通らない」を描く。
 * 包みは 2 段目に見えている字から、描いた順に添え書きと囲みの名前を組にする
 */
const OVERLAPPING = join(process.cwd(), "packages/dragon/test/fixtures/corner-note.dragon");


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

// 言葉ごとに 1 件 1 回の命令に分ける (#3410)。2 回の命令を 1 件で起こすと、混んだ機械で 1 件の上限 (10 秒) を超えた。
// 既定は英語なので、日本語の重なりの文は --lang ja を渡して確かめる (#3338)
describe.for([
  { lang: "ja", line: "段 2: 「今回は通らない」と「脇道」が重なる" },
  { lang: "en", line: 'Step 2: "Not taken this time" and "Side path" overlap' },
] as const)("書き出しの命令が字の重なりを知らせる (#3197) $lang", ({ lang, line }) => {
  it(
    "export-warns-overlaps",
    async () => {
      const out = mkdtempSync(join(tmpdir(), "dragon-overlap-cli-"));
      const ran = await runInProcess(["export", OVERLAPPING, "--format", "png", "--out", out, "--lang", lang]);
      expect(ran.code, ran.stderr.join("\n")).toBe(0);
      expect(readdirSync(out), "重なる図を書き出さなかった").toContain("corner-note.png");
      expect(statSync(join(out, "corner-note.png")).size, "書き出した file が空").toBeGreaterThan(0);
      expect(ran.stdout, "書き出した file の path を標準出力に出さない").toEqual([join(out, "corner-note.png")]);
      expect(ran.stderr, `${lang} の標準エラーに重なりが 1 件 1 行で出ない`).toEqual([line]);
    },
  );
});

describe("言葉を渡さない書き出しの重なりの行 (#3516)", () => {
  it(
    "export-warns-overlaps-without-lang",
    async () => {
      // 題と `say` が日本語の図は、`--lang` が無ければ図に足す字を日本語で描く。重なりの行の文は命令の文なので今どおり英語の形で、引用する字は描いた字になる
      const out = mkdtempSync(join(tmpdir(), "dragon-overlap-cli-"));
      const ran = await runInProcess(["export", OVERLAPPING, "--format", "png", "--out", out]);
      expect(ran.code, ran.stderr.join("\n")).toBe(0);
      expect(ran.stderr, "--lang なしの標準エラーの重なりの行が、英語の文の形で日本語の描いた字を引かない").toEqual(['Step 2: "今回は通らない" and "脇道" overlap']);
    },
  );
});
