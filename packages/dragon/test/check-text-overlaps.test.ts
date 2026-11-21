/**
 * `dragon check --layout`と`checkLayoutText`が、字どうしの重なりも崩れとして知らせる (#3790)。
 *
 * 字どうしの重なりは描いた結果の`overlaps`に入るが、崩れを確かめる処理は`breaks`だけを返し、`overlaps`を捨てていた。
 * そのため書き出しの命令 (`dragon export`) だけが重なりを知らせ、崩れを確かめる命令は何も出さずに終わり方0で終えていた。
 *
 * 今のエンジンは字の重なる図を作らない (`paired-overlap.ts`の注) ので、書き出しの命令の検査 (`overlap-cli.test.ts`) と同じく、
 * 重なりを探す所 (`findOverlaps`) を包んで、2段目に見えている2つの字を組にした重なりを1件足す。
 * 図を読む所、描く所、崩れを数える所、命令の行と終わり方は本物の流れを通す。
 * 命令は元の code (`src/cli.ts`) をこの処理の中で読み込み、包みが命令の中の描く処理にも届くようにする。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/render/ink", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/render/ink")>();
  const { withPairedOverlap } = await import("./paired-overlap");
  return { ...real, findOverlaps: withPairedOverlap(real.findOverlaps) };
});

/*
 * 命令と描く処理の元の code を、検査の外 (この file を読む段) で先に読む。
 * 元の code は多くの file を読み、検査の中で初めて読むと混んだ機械で変換だけで1件の上限 (10秒) に近づく (#3410)
 */
// 包んだ部品 (`src/render/ink`) を描く部品と並べて同時に読み込むと、描く部品が包む前の部品を読む回があった。
// 全ての種類を先に読み、包んだ部品は描く部品を通して読ませる。重なりを知らせる文は既定の入口から引く
const { describeOverlap } = await import("./all-kinds");
const [{ checkLayoutText, describeBreak, stepLines }, { renderDiagram }, { parseNotation }] = await Promise.all([
  import("../src/render/layout-check"),
  import("../src/render/draw"),
  import("../src/parser"),
]);

/** 字どうしの重なりの崩れの種類。種類の名前は文字で比べ、種類を足す前の型でも検査の型を通す */
const TEXTS_OVERLAP: string = "texts-overlap";

/**
 * 2段目に書き込みだけを持つ状態遷移図。通らない箱「支払い済み」を脇道の囲みに入れ、囲みの名前「脇道」と添え書き「今回は通らない」を描く。
 * 包みは2段目に見えている字から、描いた順に添え書きと囲みの名前を組にする
 */
const OVERLAPPING = join(process.cwd(), "packages/dragon/test/fixtures/corner-note.dragon");

interface Ran {
  code: number;
  stdout: string[];
  stderr: string[];
}

/**
 * 命令の元の code を、渡した引数で1度走らせる。
 * 命令は読み込むと走り、終わると`process.exit`を呼ぶので、読み込む前に引数を差し替え、`process.exit`で終わり方を受け取る
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

/** 記法の`step`の行の番号。`at`は段の番号 (1から数える) */
const stepLine = (file: string, at: number): number | undefined => stepLines(readFileSync(file, "utf8"))[at - 1];

// 言葉ごとに1件1回の命令に分ける (#3410)。2回の命令を1件で起こすと、混んだ機械で1件の上限 (10秒) を超えた
describe.for([
  { lang: "ja", said: "段 2: 「今回は通らない」と「脇道」が重なる" },
  { lang: "en", said: 'Step 2: "Not taken this time" and "Side path" overlap' },
] as const)("崩れを確かめる命令が字どうしの重なりを知らせる $lang", ({ lang, said }) => {
  it("check-layout-reports-text-overlaps", async () => {
    const ran = await runInProcess(["check", OVERLAPPING, "--layout", "--lang", lang]);
    expect(ran.code, `崩れだけの図で終わり方0にならない ${ran.stderr.join("\n")}`).toBe(0);
    // 行は崩れの知らせと同じく、重なりが見え始める段のstepの行を頭に書き、重なる2つの字を名指す
    const line = stepLine(OVERLAPPING, 2);
    expect(line, "重なる図の2段目のstepの行を数えられない").toBeDefined();
    expect(ran.stdout, `字どうしの重なりを段の行で知らせない\n${ran.stdout.join("\n")}`).toContain(`${OVERLAPPING}:${line}:1 warning ${said}`);
  });
});

describe("崩れを確かめる処理が字どうしの重なりを返す", () => {
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
] as const)("崩れを確かめる命令の使い方 $lang", ({ lang, words }) => {
  it("check-layout-usage-names-text-overlaps", async () => {
    // 知らない設定を渡すと、命令は使い方を出して終わる
    const ran = await runInProcess(["check", "--help", "--lang", lang]);
    const layout = [...ran.stderr, ...ran.stdout].join("\n").split("\n").find((line) => line.trimStart().startsWith("--layout"));
    expect(layout, `使い方に --layout の行が無い\n${ran.stderr.join("\n")}`).toBeDefined();
    expect(layout, "--layout の説明が知らせる崩れに字どうしの重なりを挙げない").toContain(words);
  });
});
