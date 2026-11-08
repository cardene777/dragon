/**
 * 端の箱へ向かう線の札が、図の枠の外へはみ出して切れる (#3515)。
 *
 * 運ぶ物は着いた生存線の向こう側に留まり、出る生存線の手前側で走り出しを待つ (#3176)。
 * 一番左か一番右の箱では、その所が箱の外側になり、図の幅が運ぶ物の留まる所を数えていなかったので、札が図の枠で切れていた。
 * 図の幅は、運ぶ物の留まる所にも箱や線の名前と同じ余白を取る。
 * 枠を広げても直らない形が残った時のため、`dragon check --layout` は図の枠からはみ出す部品を段と部品と枠の端で名指す。
 * 直した後の図ははみ出さないので、知らせを確かめる検査は、時系列図の置き場所を描いた後にずらしてはみ出す形を作る。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Layout } from "../src/layout/scene";
import { runCli } from "./export-support";

/** 時系列図の置き場所を決めた後に、検査が頼んだ時だけ置き場所を書き換える。頼まない検査には今の置き場所を返す */
const tamper = vi.hoisted(() => ({ move: undefined as ((layout: Layout) => void) | undefined }));
vi.mock("../src/kinds/sequence/layout", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/kinds/sequence/layout")>();
  return {
    ...real,
    layoutSequence: (...args: Parameters<typeof real.layoutSequence>) => {
      const layout = real.layoutSequence(...args);
      tamper.move?.(layout);
      return layout;
    },
  };
});

/*
 * 描く部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械で変換だけで 1 件の上限を超える (#3410)。
 * 状態遷移図の部品は全部入りの入口と同じく読むだけで登録する (`kinds/all`)
 */
const [, { drawDiagram }, { parseNotation }, { checkText, problemLine }, { LOOK }] = await Promise.all([
  import("../src/kinds/all"),
  import("../src/render/draw"),
  import("../src/parser"),
  import("../src/check"),
  import("../src/look/values"),
]);
type DrawnFigure = import("../src/render/breaks").DrawnFigure;
type Ink = DrawnFigure["inks"][number];

const ROOT = process.cwd();
/** 段 5 の札「session id」が一番左の箱へ向かう線の先に留まり、段 1 の札「email + password」が一番左の箱の左で待つ図 */
const LOGIN = join(ROOT, "packages/dragon/test/fixtures/layout/login.dragon");
const LOGIN_TEXT = readFileSync(LOGIN, "utf8");

/** 一番右の箱 (DB) へ向かう線に札を付けた時系列図 */
const TO_RIGHTMOST = `sequence 右端の箱へ向かう札

box browser as ブラウザ
box api as APIサーバー
box db as DB

step 書き込む
  say APIサーバーが利用者の記録をDBに書く。
  api -> db: 書く [tag: user record row]
`;

/** 始まりの印から出る線に長い札を付けた状態遷移図 */
const STATE_FROM_START = `state 長い札で受け付ける注文

box 受付 [note: 番号を付ける]
box 完了 [note: 閉じる]

step 受け付ける
  say 注文を確定すると受付から始まる。
  start -> 受付: 確定 [tag: order number 1042 long tag]

step 閉じる
  say 受付を終えて閉じる。
  受付 -> 完了: 閉じる
`;

/** 記法 `text` を描き、図の大きさと、描く処理が記録した字と、置き場所を返す */
function draw(text: string): { width: number; layout: Layout; inks: Ink[] } {
  const parsed = parseNotation(text, { lang: "ja" });
  if (!parsed.ok) throw new Error(`図を読めない: ${JSON.stringify(parsed.errors)}`);
  let figure: DrawnFigure | undefined;
  const rendered = drawDiagram(parsed.diagram, {
    lang: "ja",
    findBreaks: (drawn) => {
      figure = drawn;
      return [];
    },
  });
  if (!figure) throw new Error("描く処理が描いた物を渡さない");
  return { width: rendered.layout.width, layout: rendered.layout, inks: figure.inks };
}

/** 中心が `seat` にある札 `text` の記録。運ぶ物は留まる所ごとに 1 件記録される */
function inkAt(inks: Ink[], text: string, seat: [number, number] | undefined): Ink {
  expect(seat, `札「${text}」の留まる所が置き場所に無い`).toBeDefined();
  const [sx, sy] = seat ?? [Number.NaN, Number.NaN];
  const found = inks.find((ink) => ink.text === text && Math.abs(ink.rect.x + ink.rect.w / 2 - sx) < 0.5 && Math.abs(ink.rect.y + ink.rect.h / 2 - sy) < 0.5);
  expect(found, `札「${text}」が留まる所に記録されていない`).toBeDefined();
  return found as Ink;
}

/** 浮動小数の足し引きで余白が 1/1000 px 欠けても、余白を取ったと数える */
const EPS = 0.001;

describe("端の箱へ向かう線と出る線の札は図の枠の内側に余白を取る (#3515)", () => {
  it("sequence-tag-to-leftmost-box-inside-frame", async () => {
    const { layout, inks } = draw(LOGIN_TEXT);
    const edge = layout.edges.find((e) => e.step === 4);
    const tag = inkAt(inks, "session id", edge?.settle);
    expect(tag.rect.x, "段 5 で一番左の箱へ着いた札「session id」の左端と図の枠の左端の間").toBeGreaterThanOrEqual(LOOK.margin - EPS);
    const ran = await runCli(["check", LOGIN, "--layout", "--json", "--lang", "ja"]);
    expect(ran.code, ran.stderr).toBe(0);
    const problems = JSON.parse(ran.stdout || "[]") as { layout?: unknown }[];
    expect(problems.filter((p) => p.layout !== undefined), "ログインの図に崩れを出す").toEqual([]);
  });

  it("sequence-tag-to-rightmost-box-inside-frame", () => {
    const { width, layout, inks } = draw(TO_RIGHTMOST);
    const tag = inkAt(inks, "user record row", layout.edges[0]?.settle);
    expect(width - (tag.rect.x + tag.rect.w), "一番右の箱へ着いた札の右端と図の枠の右端の間").toBeGreaterThanOrEqual(LOOK.margin - EPS);
  });

  it("sequence-tag-waiting-at-leftmost-box-inside-frame", () => {
    const { layout, inks } = draw(LOGIN_TEXT);
    const edge = layout.edges.find((e) => e.step === 0);
    const tag = inkAt(inks, "email + password", edge?.wait);
    expect(tag.rect.x, "段 1 で一番左の箱の左で走り出しを待つ札「email + password」の左端と図の枠の左端の間").toBeGreaterThanOrEqual(LOOK.margin - EPS);
  });

  it("state-tag-waiting-at-start-inside-frame", () => {
    const { layout, inks } = draw(STATE_FROM_START);
    const edge = layout.edges.find((e) => e.from === "start");
    const tag = inkAt(inks, "order number 1042 long tag", edge?.wait);
    expect(tag.rect.x, "始まりの印の左で走り出しを待つ札の左端と図の枠の左端の間").toBeGreaterThanOrEqual(LOOK.margin - EPS);
  });
});

/** 段 `step` (0 から数える) の線の運ぶ物の、着いた先 (`settle`) か待つ所 (`wait`) を枠の左端の外へ動かす */
function pushOut(step: number, seat: "settle" | "wait"): (layout: Layout) => void {
  return (layout) => {
    const edge = layout.edges.find((e) => e.step === step);
    const at = edge?.[seat];
    if (edge && at) edge[seat] = [-40, at[1]];
  };
}

/** ログインの図を、置き場所を `move` で書き換えて `dragon check --layout` の中身で確かめる */
function checkTampered(move: (layout: Layout) => void, lang: "ja" | "en") {
  tamper.move = move;
  try {
    return checkText(LOGIN, LOGIN_TEXT, "notation", lang, { layout: (step, text) => (lang === "ja" ? `段 ${step}: ${text}` : `Step ${step}: ${text}`) });
  } finally {
    tamper.move = undefined;
  }
}

/** file の中で、段 `step` (1 から数える) を始める `step` の行の番号 */
function stepLine(step: number): number {
  const at = LOGIN_TEXT.split("\n")
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => /^step\b/u.test(line))[step - 1];
  return (at?.i ?? -1) + 1;
}

describe("dragon check --layout が図の枠からはみ出す部品を知らせる (#3515)", () => {
  it("layout-check-finds-part-outside-frame", () => {
    const ja = checkTampered(pushOut(4, "settle"), "ja");
    const outside = ja.filter((p) => p.layout?.kind === "part-outside-frame");
    expect(outside, `枠からはみ出す札を 1 件で出さない\n${ja.map(problemLine).join("\n")}`).toHaveLength(1);
    const [found] = outside;
    expect(found?.severity).toBe("warning");
    expect(found?.line, "はみ出しが見え始める段の step の行").toBe(stepLine(5));
    expect(found?.layout?.step).toBe(5);
    expect(found?.layout?.parts, "崩れに関わる 2 つの物").toEqual([
      { kind: "text", text: "session id" },
      { kind: "frame", side: "left" },
    ]);
    expect(found && problemLine(found)).toBe(`${LOGIN}:${stepLine(5)}:1 warning 段 5: 「session id」が図の枠の左端からはみ出す`);
    const en = checkTampered(pushOut(4, "settle"), "en").filter((p) => p.layout?.kind === "part-outside-frame");
    expect(en.map((p) => p.message)).toEqual(['Step 5: "session id" sticks out of the left edge of the diagram frame']);
  });

  it("layout-check-finds-waiting-part-outside-frame", () => {
    // 走り出しを待つ札は段の止め絵に映らず、段 1 の動きの途中だけ見える
    const found = checkTampered(pushOut(0, "wait"), "ja").filter((p) => p.layout?.kind === "part-outside-frame");
    expect(found.map((p) => [p.layout?.step, p.layout?.parts]), "待つ札のはみ出しを段 1 で出さない").toEqual([
      [
        1,
        [
          { kind: "text", text: "email + password" },
          { kind: "frame", side: "left" },
        ],
      ],
    ]);
  });
});
