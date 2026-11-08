/**
 * 描いた図の崩れを数えて知らせる `dragon check --layout` (#3484)。
 *
 * skill を入れた Claude が描いた図は、記法が正しく `dragon check` も通るのに、書き出すと番号の丸や線が詰まり、
 * 形を持つブロック (`+bridge` のアーチ) から硬貨の枠や字がはみ出していた。
 * `--layout` を付けた時だけ図を描き、全部の段を既定の幅と幅 390 で見て、崩れを段の番号と関わる 2 つの物で 1 件 1 行ずつ出す。
 * 崩れは描ける図の知らせなので、終わり方は 0 のまま (字の重なり #3178 と同じ扱い)。
 * 線とその両端の箱、グループとその中の箱、箱の角と線の始まりの番号の丸のように、重なって当然の組は数えない。
 * 見本に今ある崩れは数えた一覧 (`fixtures/layout-breaks.json`) に残し、一覧に無い崩れが出たら落とす。
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it, vi } from "vitest";
import { runCli } from "./export-support";

// 書き出しの撮る所だけを差し替え、撮った止め絵の時刻を PNG の中身にする。段の選び方を Chromium を起こさずに確かめる。
// Chromium を起こす書き出しは 1 回で 8 秒かかり、3 回撮って比べると 1 件の上限 (10 秒) を超える
vi.mock("../src/export/capture", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/export/capture")>();
  return {
    ...real,
    launch: () => Promise.resolve({ close: () => Promise.resolve() }),
    stage: () => Promise.resolve({}),
    still: (_stage: unknown, t: number) => Promise.resolve(Buffer.from(`still at ${t}`)),
  };
});

/*
 * 描く部品と書き出す部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 元の code は 500 を超える file を読み、検査の中で初めて読むと混んだ機械で変換だけで 9 秒かかる (#3410)
 */
const [{ checkLayout }, { exportDiagram, NoSuchStep }, { renderDiagram }, { parseNotation }] = await Promise.all([
  import("../src/render/layout-check"),
  import("../src/export/index"),
  import("../src/render/draw"),
  import("../src/parser"),
]);

const ROOT = process.cwd();
const FIXTURES = join(ROOT, "packages/dragon/test/fixtures/layout");
/**
 * 図の頭にアーチの形の `+arch` を定義し、段 3 の丸と硬貨の枠と下の字がアーチからはみ出す図。
 * 共有の `+bridge` は #3489 で角丸の箱になったので、崩れを持つ形を図の頭に残す
 */
const BRIDGE = join(FIXTURES, "bridge.dragon");
/** 自分で定義した `+oracle` (六角形) と `+price` (点線) を使い、段 2 と段 3 の線と丸が詰まる図 */
const PAYMENT = join(FIXTURES, "payment.dragon");
/** 重なって当然の組だけを持つ図 */
const INTENDED = join(FIXTURES, "intended.dragon");
/** 見本に今ある崩れの一覧。見本の file ごとに崩れを並べる */
const RECORDED = join(ROOT, "packages/dragon/test/fixtures/layout-breaks.json");
/** 崩れを数える見本の置き場 */
const EXAMPLE_DIRS = ["packages/dragon/examples", "packages/dragon/blocks/examples"].map((dir) => join(ROOT, dir));

type Part =
  | { kind: "badge"; step: number }
  | { kind: "box"; name: string }
  | { kind: "slot"; box: string }
  | { kind: "text"; text: string; box?: string }
  | { kind: "line"; from: string; to: string; step: number };

interface LayoutBreak {
  kind: string;
  step: number;
  width?: number;
  parts: Part[];
}

interface Problem {
  file: string;
  line: number;
  column: number;
  severity: string;
  message: string;
  layout?: LayoutBreak;
}

/** `dragon check --layout --json` を打ち、終わり方と崩れの知らせを返す */
async function layoutOf(file: string, lang: "ja" | "en" = "ja"): Promise<{ code: number; found: LayoutBreak[]; problems: Problem[]; stderr: string }> {
  const ran = await runCli(["check", file, "--layout", "--json", "--lang", lang]);
  let problems: Problem[] = [];
  try {
    problems = JSON.parse(ran.stdout) as Problem[];
  } catch {
    problems = [];
  }
  return { code: ran.code, found: problems.flatMap((p) => (p.layout ? [p.layout] : [])), problems, stderr: ran.stderr };
}

const hasBadge = (b: LayoutBreak, step: number): boolean => b.parts.some((p) => p.kind === "badge" && p.step === step);
const hasBox = (b: LayoutBreak, name: string): boolean => b.parts.some((p) => (p.kind === "box" && p.name === name) || (p.kind === "slot" && p.box === name) || (p.kind === "text" && p.box === name));
const hasLine = (b: LayoutBreak, from: string, to: string, step: number): boolean =>
  b.parts.some((p) => p.kind === "line" && p.from === from && p.to === to && p.step === step);

/** file の中で、段 `step` (1 から数える) を始める `step` の行の番号 */
function stepLine(file: string, step: number): number {
  const lines = readFileSync(file, "utf8").split("\n");
  const at = lines.map((line, i) => ({ line, i })).filter(({ line }) => /^step\b/u.test(line))[step - 1];
  return (at?.i ?? -1) + 1;
}

describe("dragon check --layout が崩れを見つける (#3484)", () => {
  it("layout-check-finds-badge-off-shape", async () => {
    const { code, found, stderr } = await layoutOf(BRIDGE);
    expect(code, `崩れだけの図で終わり方 0 にならない ${stderr}`).toBe(0);
    const hits = found.filter((b) => b.kind === "badge-off-shape" && hasBadge(b, 3) && hasBox(b, "ブリッジ"));
    expect(hits, "段 3 の丸がアーチから浮くことを 1 件で出さない").toHaveLength(1);
    expect(hits[0]?.step, "浮いた丸の崩れの段").toBe(3);
  });

  it("layout-check-finds-slot-outside-shape", async () => {
    const { found } = await layoutOf(BRIDGE);
    const hits = found.filter((b) => b.kind === "slot-outside-shape" && hasBox(b, "ブリッジ"));
    expect(hits, "硬貨の枠がアーチからはみ出すことを 1 件で出さない").toHaveLength(1);
  });

  it("layout-check-finds-text-outside-shape", async () => {
    const { found } = await layoutOf(BRIDGE);
    const hits = found.filter((b) => b.kind === "text-outside-shape" && b.parts.some((p) => p.kind === "text" && p.text === "100 USDC を預かり中" && p.box === "ブリッジ"));
    expect(hits, "段 3 の下の字がアーチの外へはみ出すことを 1 件で出さない").toHaveLength(1);
    expect(hits[0]?.step, "はみ出した下の字の崩れの段").toBe(3);
  });

  it("layout-check-finds-close-badges", async () => {
    const { found } = await layoutOf(PAYMENT);
    const hits = found.filter((b) => b.kind === "badges-close" && hasBadge(b, 2) && hasBadge(b, 3));
    expect(hits, "段 2 と段 3 の丸が近すぎることを 1 件で出さない").toHaveLength(1);
    expect(hits[0]?.step, "2 つの丸が揃って見える最初の段").toBe(3);
  });

  it("layout-check-finds-crowded-lines", async () => {
    const { found } = await layoutOf(PAYMENT);
    const hits = found.filter((b) => b.kind === "lines-close" && hasLine(b, "APIサーバー", "価格オラクル", 2) && hasLine(b, "価格オラクル", "APIサーバー", 3));
    expect(hits, "段 2 と段 3 の線が並んで近すぎることを 1 件で出さない").toHaveLength(1);
  });

  it("layout-check-line-names-step-and-parts", async () => {
    const ja = await runCli(["check", PAYMENT, "--layout", "--lang", "ja"]);
    expect(ja.code, ja.stderr).toBe(0);
    const lines = ja.stdout.trimEnd().split("\n");
    const badges = lines.find((line) => line.includes("段の番号 2") && line.includes("段の番号 3"));
    expect(badges, `段 2 と段 3 の丸を名指す行が無い\n${ja.stdout}`).toBeDefined();
    // 行は `<file>:<段の step の行>:1 warning 段 <N>: <文>` の形で、崩れが見え始める段の行を名指す
    expect(badges, "丸の崩れの行の頭").toMatch(new RegExp(`^${PAYMENT.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}:${stepLine(PAYMENT, 3)}:1 warning 段 3: `, "u"));
    const crowded = lines.find((line) => line.includes("APIサーバー") && line.includes("価格オラクル"));
    expect(crowded, `段 2 と段 3 の線を名指す行が無い\n${ja.stdout}`).toBeDefined();
    const bridge = await runCli(["check", BRIDGE, "--layout", "--lang", "en"]);
    const text = bridge.stdout.trimEnd().split("\n").find((line) => line.includes('"100 USDC を預かり中"'));
    expect(text, `英語の行がはみ出した字と箱を名指さない\n${bridge.stdout}`).toMatch(/warning Step 3: .*"ブリッジ"/u);
  });

  it("layout-check-prints-json", async () => {
    const { code, problems } = await layoutOf(PAYMENT);
    expect(code).toBe(0);
    const layout = problems.filter((p) => p.layout !== undefined);
    expect(layout.length, "JSON に崩れが無い").toBeGreaterThan(0);
    for (const p of layout) {
      expect(p.severity, "崩れの重さ").toBe("warning");
      expect(p.file).toBe(PAYMENT);
      expect(p.line, "崩れの段の step の行").toBe(stepLine(PAYMENT, p.layout?.step ?? 0));
      expect(p.layout?.parts, "崩れに関わる物").toHaveLength(2);
      expect(Number.isInteger(p.layout?.step), "崩れの段").toBe(true);
    }
  });

  it("layout-check-merges-repeated-steps", async () => {
    const { found } = await layoutOf(BRIDGE);
    // 硬貨の枠は段 1 から最後の段までアーチからはみ出したまま見えている
    const slots = found.filter((b) => b.kind === "slot-outside-shape");
    expect(slots.map((b) => b.step), "続く段の同じ崩れを最初の段の 1 件にまとめない").toEqual([1]);
  });

  it("layout-check-names-narrow-width", async () => {
    const seen: (number | undefined)[] = [];
    const both = { kind: "badges-close", step: 2, parts: [{ kind: "badge", step: 1 }, { kind: "badge", step: 2 }] };
    const narrowOnly = { kind: "lines-close", step: 3, parts: [{ kind: "line", from: "a", to: "b", step: 2 }, { kind: "line", from: "b", to: "a", step: 3 }] };
    // 描く所を差し替え、幅 390 で描いた時だけ線の詰まりが出る図にする
    const render = (width: number | undefined) => {
      seen.push(width);
      return width === 390 ? [both, narrowOnly] : [both];
    };
    const merged = checkLayout(render as never);
    expect(seen, "既定の幅と幅 390 の両方で描かない").toEqual([undefined, 390]);
    expect(merged, "両方の幅で出る崩れは幅を持たず、幅 390 でだけ出る崩れは幅を持つ").toEqual([both, { ...narrowOnly, width: 390 }]);
    const lines = await runCli(["check", PAYMENT, "--layout", "--json"]);
    const widths = (JSON.parse(lines.stdout || "[]") as Problem[]).flatMap((p) => (p.layout?.width === undefined ? [] : [p.layout.width]));
    expect(widths, "幅で変わらない図で幅を名指す").toEqual([]);
  });

  it("layout-check-skips-intended-overlaps", async () => {
    const intended = await layoutOf(INTENDED);
    expect(intended.code, intended.stderr).toBe(0);
    expect(intended.problems, "重なって当然の組だけの図で崩れを出す").toEqual([]);
    // 決済の図の段 3 の丸は、線の始まりに置く丸で、六角形の上の辺との 1px の間は崩れでない
    const { found } = await layoutOf(PAYMENT);
    expect(found.length, "決済の図の崩れを数えない").toBeGreaterThan(0);
    const oracleBadge = found.filter((b) => hasBadge(b, 3) && hasBox(b, "価格オラクル"));
    expect(oracleBadge, "線の始まりの丸と、その線を出す箱を崩れに数える").toEqual([]);
  });
});

/** 見本の置き場の `.dragon` を全て。見本の file の名前は repo の根からの path にする */
function exampleFiles(): string[] {
  return EXAMPLE_DIRS.flatMap((dir) =>
    existsSync(dir)
      ? readdirSync(dir)
          .filter((name) => name.endsWith(".dragon") && statSync(join(dir, name)).isFile())
          .map((name) => join(dir, name))
      : [],
  ).sort();
}

describe("共有の橋のブロックは形の崩れを出さない (#3489)", () => {
  it("layout-check-shared-bridge-has-no-shape-breaks", () => {
    const checkLayoutText = (dragon as unknown as { checkLayoutText?: (text: string, options: { lang: "ja" | "en" }) => LayoutBreak[] }).checkLayoutText;
    expect(checkLayoutText, "checkLayoutText が @cardenelabs/dragon から出ていない").toBeDefined();
    if (checkLayoutText === undefined) return;
    const text = readFileSync(BRIDGE, "utf8");
    // 図の頭のアーチの定義を外し、同じ箱を共有の橋のブロックで描く
    const shared = text.replace(/^blocks 1\n(?:.*\n)*?end\n\n?/mu, "").replaceAll("+arch ", "+bridge ");
    expect(shared, "背景のブリッジの図から図の頭の定義を外せない").not.toMatch(/^block \+arch/mu);
    expect(shared, "背景のブリッジの図に共有の橋の行が無い").toMatch(/^\+bridge /mu);
    // 比べる相手の、アーチの形の見本が形の崩れを持つことを先に確かめる。無ければ 0 件は当たり前になる
    const shapeKinds = ["slot-outside-shape", "text-outside-shape", "badge-off-shape"];
    expect(checkLayoutText(text, { lang: "ja" }).filter((b) => shapeKinds.includes(b.kind)).length, "アーチの見本が形の崩れを持たない").toBeGreaterThan(0);
    expect(checkLayoutText(shared, { lang: "ja" }).filter((b) => shapeKinds.includes(b.kind)), "共有の橋の図が出した形の崩れ").toEqual([]);
  });
});

describe("見本に今ある崩れ (#3484)", () => {
  it("layout-check-examples-match-recorded", () => {
    const checkLayoutText = (dragon as unknown as { checkLayoutText?: (text: string, options: { lang: "ja" | "en" }) => LayoutBreak[] }).checkLayoutText;
    expect(checkLayoutText, "checkLayoutText が @cardenelabs/dragon から出ていない").toBeDefined();
    if (checkLayoutText === undefined) return;
    expect(existsSync(RECORDED), `${relative(ROOT, RECORDED)} が無い`).toBe(true);
    const recorded = existsSync(RECORDED) ? (JSON.parse(readFileSync(RECORDED, "utf8")) as Record<string, LayoutBreak[]>) : {};
    const files = exampleFiles();
    // 走査の空振りを避ける。見本は 2 つの置き場に 1 つ以上ずつある
    expect(files.length, "見本を数えられない").toBeGreaterThan(EXAMPLE_DIRS.length);
    const key = (b: LayoutBreak): string => JSON.stringify(b);
    const grown = files.flatMap((file) => {
      const name = relative(ROOT, file);
      const lang = file.includes(".en.") ? "en" : "ja";
      const known = new Set((recorded[name] ?? []).map(key));
      return checkLayoutText(readFileSync(file, "utf8"), { lang })
        .filter((b) => !known.has(key(b)))
        .map((b) => `${name}: ${key(b)}`);
    });
    expect(grown, "一覧に無い崩れが見本に出た").toEqual([]);
  });
});

describe("dragon export --step (#3484)", () => {
  it("export-png-at-step", async () => {
    const parsed = parseNotation(readFileSync(PAYMENT, "utf8"), { lang: "ja" });
    if (!parsed.ok) throw new Error(`決済の図を読めない: ${JSON.stringify(parsed.errors)}`);
    const { stills } = renderDiagram(parsed.diagram, { lang: "ja" }).timeline;
    expect(stills, "決済の図の段").toHaveLength(4);
    const out = mkdtempSync(join(tmpdir(), "dragon-step-"));
    const png = async (dir: string, step?: number): Promise<string> => {
      await exportDiagram(parsed.diagram, { outDir: join(out, dir), name: "payment", formats: ["png"], lang: "ja", ...(step === undefined ? {} : { step }) });
      return readFileSync(join(out, dir, "payment.png"), "utf8");
    };
    // 段 1 の止め絵は最後の段の止め絵と違う時刻に撮る。段 1 には段 2 から先の線と丸が無い
    expect(await png("first", 1), "段 1 を選んでも段 1 の止め絵を撮らない").toBe(`still at ${stills[0]}`);
    expect(await png("last"), "既定で最後の段の止め絵を撮らない").toBe(`still at ${stills[3]}`);
    expect(await png("four", 4), "最後の段を選んだ PNG が既定の PNG と違う").toBe(`still at ${stills[3]}`);
    await expect(png("bad", 9), "図に無い段を選んでも断らない").rejects.toBeInstanceOf(NoSuchStep);
    expect(existsSync(join(out, "bad")), "図に無い段を選んだ時に書き出し先を作る").toBe(false);
  });

  it("export-step-cli-rejects-missing-step", async () => {
    // 命令は段を数えずに書き出しへ渡し、書き出しが撮る前に断る。図に無い段で終わり方 2 になれば、命令が段を書き出しへ渡している
    const out = mkdtempSync(join(tmpdir(), "dragon-step-cli-"));
    const missing = await runCli(["export", PAYMENT, "--format", "png", "--step", "9", "--out", join(out, "missing")]);
    expect(missing.code, `図に無い段を選んでも断らない ${missing.stderr}`).toBe(2);
    expect(missing.stderr, "断りの文が段と図の段の数を名指さない").toContain("--step 9 (the diagram has steps 1 to 4)");
    const zero = await runCli(["export", PAYMENT, "--format", "png", "--step", "0", "--out", join(out, "zero")]);
    expect(zero.code, `0 の段を断らない ${zero.stderr}`).toBe(2);
  });
});
