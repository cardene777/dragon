/**
 * 書き出しの命令が字の重なりを知らせる流れ (#3197)。
 *
 * 書き出しの命令は、重なりのある図でも file を書き出したうえで、標準エラーに重なりを 1 件 1 行で段と文で出し、終わり方 0 で終える (#3178)。
 * 崩れを確かめる命令 (`dragon check --layout`) と`checkLayoutText`も、字どうしの重なりを崩れとして知らせる (#3790)。
 * 線の無い段の番号を箱の角に置いてから (#3187) 字の重なる図を作れないので、命令の元の code (`src/cli.ts`) をこの処理の中で読み込み、
 * 重なりを探す所 (`findOverlaps`) だけを包んで (`paired-overlap.ts`)、2 段目に図に描いた 2 つの字を組にした重なりを 1 件足す。
 * 図を読む所、描く所、崩れを数える所、file を書き出す所、標準出力と標準エラーと終わり方は本物の流れを通す。
 * 重なりは図を描いた時に決まり、書き出す形に依らないので、Chromium を起こさない HTML で書き出して確かめる (#3599)。
 *
 * 命令を包んで走らせる検査は、この file に集める (#3837)。
 * 命令は書き出しから時系列図の登録まで読むので、命令を読む検査の file を別に足すと、時系列図の描く所を変えた時に選ぶ検査の上限 (`related-by-kind.test.ts`) を超える。
 *
 * 組み上がった命令 (`dist/cli.js`) は包まずに走らせ、重ならない図で標準エラーに何も出さないことを `overlap-notice.test.ts` が確かめる。
 */
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/render/ink", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/render/ink")>();
  const { withPairedOverlap } = await import("./paired-overlap");
  return { ...real, findOverlaps: withPairedOverlap(real.findOverlaps) };
});

/*
 * 元の code の書き出し (`src/export/index.ts`) は、組み上げた再生の部品 (`player.global.js`) を自分と同じ dir から読む。
 * 部品は build が `dist` にだけ置くので、その 1 つの file を読む所だけを `dist` の物に向ける (#3599)。頁の中身は本物の部品で組む
 */
vi.mock("node:fs", async (importOriginal) => {
  const fs = await importOriginal<typeof import("node:fs")>();
  const PLAYER = "/packages/dragon/src/export/player.global.js";
  const built = (path: unknown): unknown =>
    path instanceof URL && path.pathname.endsWith(PLAYER) ? new URL(path.href.replace(PLAYER, "/packages/dragon/dist/player.global.js")) : path;
  const readFileSync = ((path: unknown, ...rest: unknown[]) => (fs.readFileSync as (...args: unknown[]) => unknown)(built(path), ...rest)) as typeof fs.readFileSync;
  return { ...fs, readFileSync, default: { ...fs, readFileSync } };
});

/*
 * 命令の元の code が読む部品を、検査の外 (この file を読む段) で先に読む (#3410)。
 * 元の code は 500 を超える file を読み、初めて読む時に 1 つずつ変換する。検査の中で初めて読むと、混んだ機械で変換だけで 9 秒かかった。
 * 変換は 1 回の実行の中で使い回すので、検査の中で命令を読み直す (`vi.resetModules`) 時は変換し直さない。命令そのもの (`src/cli.ts`) は読むと走るので、ここでは読まない。
 * Chromium を起こす部品 (`playwright-core`) は、書き出しが Chromium を起こさないかを見張るために読むので、これも先に読む
 */
// 包んだ部品 (`src/render/ink`) を描く部品と並べて同時に読み込むと、描く部品が包む前の部品を読む回があった (#3790)。
// 全ての種類を先に読み、包んだ部品は描く部品を通して読ませる。重なりを知らせる文は既定の入口から引く
const { describeOverlap } = await import("./all-kinds");
const [{ checkLayoutText, describeBreak, stepLines }, { renderDiagram }, { parseNotation }] = await Promise.all([
  import("../src/render/layout-check"),
  import("../src/render/draw"),
  import("../src/parser"),
  import("../src/export/embed"),
  import("../src/export/index"),
  import("../src/look/values"),
  import("../src/words"),
  import("playwright-core"),
]);

/** 字どうしの重なりの崩れの種類。種類の名前は文字で比べ、種類を足す前の型でも検査の型を通す */
const TEXTS_OVERLAP: string = "texts-overlap";

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

/**
 * 書き出しが Chromium を起こすかを見張る (#3599)。重なりの警告は図を描いた時に決まるので、確かめるのに Chromium は要らない。
 * 命令を読み直しても (`vi.resetModules`) `playwright-core` は Node が持つ 1 つなので、見張りは命令の中の起動にも届く
 */
async function watchLaunch() {
  const { chromium } = await import("playwright-core");
  return vi.spyOn(chromium, "launch");
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
      const launch = await watchLaunch();
      try {
        const ran = await runInProcess(["export", OVERLAPPING, "--format", "html", "--out", out, "--lang", lang]);
        expect(ran.code, ran.stderr.join("\n")).toBe(0);
        expect(readdirSync(out), "重なる図を書き出さなかった").toContain("corner-note.html");
        expect(statSync(join(out, "corner-note.html")).size, "書き出した file が空").toBeGreaterThan(0);
        expect(ran.stdout, "書き出した file の path を標準出力に出さない").toEqual([join(out, "corner-note.html")]);
        expect(ran.stderr, `${lang} の標準エラーに重なりが 1 件 1 行で出ない`).toEqual([line]);
        expect(launch, "重なりの警告の文を確かめるのに Chromium を起こした").not.toHaveBeenCalled();
      } finally {
        launch.mockRestore();
      }
    },
  );
});

describe("言葉を渡さない書き出しの重なりの行 (#3516)", () => {
  it(
    "export-warns-overlaps-without-lang",
    async () => {
      // 題と `say` が日本語の図は、`--lang` が無ければ図に足す字を日本語で描く。重なりの行の文は命令の文なので今どおり英語の形で、引用する字は描いた字になる
      const out = mkdtempSync(join(tmpdir(), "dragon-overlap-cli-"));
      const launch = await watchLaunch();
      try {
        const ran = await runInProcess(["export", OVERLAPPING, "--format", "html", "--out", out]);
        expect(ran.code, ran.stderr.join("\n")).toBe(0);
        expect(ran.stderr, "--lang なしの標準エラーの重なりの行が、英語の文の形で日本語の描いた字を引かない").toEqual(['Step 2: "今回は通らない" and "脇道" overlap']);
        expect(launch, "重なりの警告の文を確かめるのに Chromium を起こした").not.toHaveBeenCalled();
      } finally {
        launch.mockRestore();
      }
    },
  );
});

/** 記法の`step`の行の番号。`at`は段の番号 (1から数える) */
const stepLine = (file: string, at: number): number | undefined => stepLines(readFileSync(file, "utf8"))[at - 1];

// 言葉ごとに1件1回の命令に分ける (#3410)。2回の命令を1件で起こすと、混んだ機械で1件の上限 (10秒) を超えた
describe.for([
  { lang: "ja", said: "段 2: 「今回は通らない」と「脇道」が重なる" },
  { lang: "en", said: 'Step 2: "Not taken this time" and "Side path" overlap' },
] as const)("崩れを確かめる命令が字どうしの重なりを知らせる (#3790) $lang", ({ lang, said }) => {
  it("check-layout-reports-text-overlaps", async () => {
    const ran = await runInProcess(["check", OVERLAPPING, "--layout", "--lang", lang]);
    expect(ran.code, `崩れだけの図で終わり方0にならない ${ran.stderr.join("\n")}`).toBe(0);
    // 行は崩れの知らせと同じく、重なりが見え始める段のstepの行を頭に書き、重なる2つの字を名指す
    const line = stepLine(OVERLAPPING, 2);
    expect(line, "重なる図の2段目のstepの行を数えられない").toBeDefined();
    expect(ran.stdout, `字どうしの重なりを段の行で知らせない\n${ran.stdout.join("\n")}`).toContain(`${OVERLAPPING}:${line}:1 warning ${said}`);
  });
});

describe("崩れを確かめる処理が字どうしの重なりを返す (#3790)", () => {
  it("layout-check-reports-text-overlaps", () => {
    const text = readFileSync(OVERLAPPING, "utf8");
    const parsed = parseNotation(text, { lang: "ja" });
    expect(parsed.ok, `重なる図を読めない ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
    if (!parsed.ok) return;
    // 書き出しの命令が知らせる重なりは、描いた結果の`overlaps`のうち字どうしの重なり
    const overlaps = renderDiagram(parsed.diagram, { lang: "ja" }).overlaps.filter((o) => o.kind === "texts");
    const told = overlaps.map((o) => ({ step: o.step + 1, said: describeOverlap(o, "ja") }));
    expect(told, "包みが字どうしの重なりを足していない").toEqual([{ step: 2, said: "「今回は通らない」と「脇道」が重なる" }]);
    const found = checkLayoutText(text, { lang: "ja" }).filter((b) => b.kind === TEXTS_OVERLAP);
    expect(found, `字どうしの重なりを崩れとして返さない ${JSON.stringify(checkLayoutText(text, { lang: "ja" }))}`).toHaveLength(1);
    expect(found[0]?.step, "字どうしの重なりの崩れの段").toBe(2);
    expect(found[0]?.width, "既定の幅で出る重なりに幅を付けた").toBeUndefined();
    expect(found[0]?.parts, "崩れに関わる2つの物").toEqual([
      { kind: "text", text: "今回は通らない" },
      { kind: "text", text: "脇道" },
    ]);
    // 知らせる文は、書き出しの命令が同じ重なりに出す文と同じ
    expect(found.map((b) => ({ step: b.step, said: describeBreak(b, "ja") })), "書き出しの命令と違う文で知らせる").toEqual(told);
    expect(found.map((b) => describeBreak(b, "en")), "英語の文").toEqual(overlaps.map((o) => describeOverlap(o, "en")));
  });
});

// 言葉ごとに1件1回の命令に分ける (#3410)
describe.for([
  { lang: "ja", words: "字どうしの重なり" },
  { lang: "en", words: "overlapping texts" },
] as const)("崩れを確かめる命令の使い方 (#3790) $lang", ({ lang, words }) => {
  it("check-layout-usage-names-text-overlaps", async () => {
    // 知らない設定を渡すと、命令は使い方を出して終わる
    const ran = await runInProcess(["check", "--help", "--lang", lang]);
    const layout = [...ran.stderr, ...ran.stdout].join("\n").split("\n").find((line) => line.trimStart().startsWith("--layout"));
    expect(layout, `使い方に --layout の行が無い\n${ran.stderr.join("\n")}`).toBeDefined();
    expect(layout, "--layout の説明が知らせる崩れに字どうしの重なりを挙げない").toContain(words);
  });
});
