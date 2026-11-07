/**
 * 宣言と段を省いた短い記法 (#3438)。
 *
 * 時系列図と構成図と状態遷移図は、1 行目に図の種類の語だけを書き、箱を線で結ぶ行を並べるだけで図になる。
 * 段を 1 つも書かない図は線 1 本を 1 段にし、本文 (`say`) の無い段は線の名前を本文にする。
 * 箱を 1 つも宣言しない図は、線に出た名前を出た順に箱にし、1 字違いの似た名前を図を描いたまま知らせる。
 * 段か箱を 1 つでも書いた図は、今と同じく段の外の線と宣言の無い名前を断る。
 * 原本の JSON の形 (版 2) は変えず、記法へ書き戻す時は省ける物を省いて書く。
 */
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError, type NotationLang, type Parsed } from "./diagram-support";
import { runCli } from "./export-support";

/** 短い記法を読む図の種類。箱を線で結ぶ図だけで、矢印の意味が違う種類 (枝分かれの図、木の図、配管の図など) は含めない */
const SHORT_KINDS = ["sequence", "architecture", "state"] as const;

const parse = (text: string, lang: NotationLang = "ja"): Parsed => api("parseNotation")(text, { lang });
/** 行を改行で繋ぎ、file の終わりの改行を足す */
const lines = (...rows: string[]): string => `${rows.join("\n")}\n`;
const firstError = (parsed: Parsed): LineError | undefined => (parsed.ok ? undefined : parsed.errors[0]);
const noticesOf = (parsed: Parsed): LineError[] => (parsed.ok ? (parsed.notices ?? []) : []);
const edge = (from: string, to: string, extra: Record<string, Json> = {}): Json => ({ type: "edge", from, to, carry: { kind: "envelope" }, ...extra });
/** 名前が名札と同じ箱 */
const named = (...ids: string[]): Json[] => ids.map((id) => ({ id, name: id }));
/** 線 1 本の段。題と本文は同じ字 */
const lineStep = (text: string, from: string, to: string, extra: Record<string, Json> = {}): Json => ({ title: text, body: text, events: [edge(from, to, extra)] });

type Diagram = { kind?: string; title?: string; blocks?: { box?: { id: string; name: string }[] }; steps?: { title: string; body: string }[] };
const diagramOf = (parsed: Parsed): Diagram | undefined => (parsed.ok ? (parsed.diagram as Diagram) : undefined);
const boxIds = (parsed: Parsed): string[] => (diagramOf(parsed)?.blocks?.box ?? []).map((box) => box.id);

/** 宣言と段を省いた時系列図。最初の図の節と書き戻す検査が使う */
const SHORT = lines("sequence", "", "ブラウザ -> アプリ: GET /login", "アプリ -> ブラウザ: 認可の頁へ送る");
/** 1 字違いの「アプリ」と「アプル」を持つ図。「アプル」は 4 行目の頭に初めて出る */
const SIMILAR = lines("sequence", "", "ブラウザ -> アプリ: GET /login", "アプル -> ブラウザ: 戻す");

/** 記法の行のうち、空の行と注釈の行を除いた行 */
const writtenRows = (source: string): string[] =>
  source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("//"));
/** 宣言と段を書く行の頭の語 */
const DECLARING = /^(box|group|end|step|say)(\s|$)/u;
/** 1 行目が図の種類の語だけで、宣言と段の行を持たない記法か */
const isShortForm = (source: string): boolean => {
  const [head = "", ...rest] = writtenRows(source);
  return (SHORT_KINDS as readonly string[]).includes(head) && rest.every((row) => !DECLARING.test(row));
};

describe("宣言と段を省いた短い記法 (#3438)", () => {
  it("short-reads-kind-without-title", () => {
    // 1 行目が図の種類の語だけの図は、題の無い図として読む。原本は題を空にできないので、題を図の種類の語にする
    for (const kind of SHORT_KINDS) {
      const parsed = parse(lines(kind, "", "ブラウザ -> アプリ: GET /login"));
      expect(parsed.ok, `${kind} の語だけの 1 行目を読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
      expect(diagramOf(parsed), `${kind} の語だけの 1 行目の図の種類か題が違う`).toMatchObject({ kind, title: kind });
    }
    // 題を書いた 1 行目は今のまま題を読む
    expect(diagramOf(parse(lines("sequence ログイン", "", "ブラウザ -> アプリ: GET /login")))?.title, "題を書いた 1 行目の題を読まない").toBe("ログイン");
  });

  it("short-lines-become-steps", () => {
    // 段を 1 つも書かない図は、線 1 本を 1 段にし、書いた順に段を並べる
    expect(parse(lines("sequence", "", "ブラウザ -> アプリ: GET /login", "アプリ -> 認可: 認可の頁へ送る", "認可 -> ブラウザ: 頁を返す"))).toEqual({
      ok: true,
      diagram: {
        version: 2,
        kind: "sequence",
        title: "sequence",
        blocks: { box: named("ブラウザ", "アプリ", "認可") },
        steps: [
          lineStep("GET /login", "ブラウザ", "アプリ", { label: "GET /login" }),
          lineStep("認可の頁へ送る", "アプリ", "認可", { label: "認可の頁へ送る" }),
          lineStep("頁を返す", "認可", "ブラウザ", { label: "頁を返す" }),
        ],
      },
    });
    // 箱を宣言した図でも、段を書かなければ線 1 本を 1 段にする
    expect(parse(lines("architecture 配り方", "", "box app as アプリ", "box cdn as 配る所", "", "app -> cdn: 読む", "cdn -> app: 返す"))).toEqual({
      ok: true,
      diagram: {
        version: 2,
        kind: "architecture",
        title: "配り方",
        blocks: {
          box: [
            { id: "app", name: "アプリ" },
            { id: "cdn", name: "配る所" },
          ],
        },
        steps: [lineStep("読む", "app", "cdn", { label: "読む" }), lineStep("返す", "cdn", "app", { label: "返す" })],
      },
    });
  });

  it("short-step-says-line-label", () => {
    // 段を書かない図の名前の無い線は、箱の名前を「→」で結んだ字を段の題と本文にする
    expect(diagramOf(parse(lines("sequence", "", "ブラウザ -> アプリ")))?.steps, "名前の無い線の段の題と本文が「A → B」でない").toEqual([lineStep("ブラウザ → アプリ", "ブラウザ", "アプリ")]);

    // 段を書いた図も `say` を省ける。本文は段の線の名前で、名前の無い線は箱の名前を「→」で結び、線が 2 本以上なら 1 本を 1 行にする
    const parsed = parse(
      lines("sequence ログイン", "", "box browser as ブラウザ", "box app as アプリ", "", "step 押す", "  browser -> app: GET /login", "", "step 返す", "  app -> browser", "", "step 往復", "  browser -> app: 頼む", "  app -> browser: 返す"),
    );
    expect(parsed.ok, `say を省いた段を読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
    expect(
      diagramOf(parsed)?.steps?.map((s) => ({ title: s.title, body: s.body })),
      "say を省いた段の本文が線の名前から導いた字でない",
    ).toEqual([
      { title: "押す", body: "GET /login" },
      { title: "返す", body: "アプリ → ブラウザ" },
      { title: "往復", body: "頼む\n返す" },
    ]);

    // 線も `say` も無い段は、今と同じく本文が無い段として断る
    const empty = firstError(parse(lines("sequence ログイン", "", "box 甲", "", "step 待つ")));
    expect(empty, "線も say も無い段を断らない").toMatchObject({ line: 5, column: 1 });
    expect(empty?.message).toContain("待つ");
  });

  it("short-infers-boxes-in-order", () => {
    // 箱を 1 つも宣言しない図は、線に出た名前を出た順に箱にする
    expect(boxIds(parse(lines("architecture", "", "店 -> 倉庫: 頼む", "客 -> 店: 買う", "倉庫 -> 客: 届ける"))), "線に出た名前を出た順に箱にしない").toEqual(["店", "倉庫", "客"]);
    // 段を書いた図でも、箱を宣言しなければ線から箱を導く
    const stepped = parse(lines("sequence 頼む", "", "step 一", "  say 頼む。", "  甲 -> 乙: 頼む", "  乙 -> 丙"));
    expect(boxIds(stepped), `段を書いた図で線から箱を導かない ${JSON.stringify(firstError(stepped))}`).toEqual(["甲", "乙", "丙"]);
    // 導いた箱の名前は名札と同じ
    expect(diagramOf(stepped)?.blocks?.box, "導いた箱の名前が名札と違う").toEqual(named("甲", "乙", "丙"));
    // 状態遷移図の始まりと終わり (`start` と `finish`) は箱にしない
    const state = parse(lines("state", "", "start -> 受付", "受付 -> 発送: 送る", "発送 -> finish"));
    expect(boxIds(state), `状態遷移図の始まりと終わりを箱にした ${JSON.stringify(firstError(state))}`).toEqual(["受付", "発送"]);
    expect(diagramOf(state)?.steps?.length, "状態遷移図の線 1 本を 1 段にしない").toBe(3);
  });

  it("short-notices-similar-box-names", () => {
    // 1 字違いの似た名前の箱が出たら、図を描いたまま、後に出た名前の位置で前に出た名前を示して知らせる
    for (const lang of ["ja", "en"] as const) {
      const parsed = parse(SIMILAR, lang);
      expect(parsed.ok, `${lang}: 似た名前の箱を持つ図を断った ${JSON.stringify(firstError(parsed))}`).toBe(true);
      expect(boxIds(parsed), `${lang}: 似た名前の箱を別の箱にしない`).toEqual(["ブラウザ", "アプリ", "アプル"]);
      const notices = noticesOf(parsed);
      expect(notices, `${lang}: 似た名前の知らせが 1 件でない`).toHaveLength(1);
      expect(notices[0], `${lang}: 知らせが後に出た名前の位置を示さない`).toMatchObject({ line: 4, column: 1 });
      expect(notices[0]?.message, `${lang}: 知らせが 2 つの名前を示さない`).toContain("アプル");
      expect(notices[0]?.message, `${lang}: 知らせが 2 つの名前を示さない`).toContain("アプリ");
    }
    // 数字だけが違う名前と、1 字の名前どうしは知らせない
    for (const quiet of [
      lines("sequence", "", "node1 -> node2: 送る", "node2 -> node3"),
      lines("architecture", "", "箱1 -> 箱2", "箱2 -> 箱10"),
      lines("sequence", "", "A -> B", "B -> C"),
    ]) {
      const parsed = parse(quiet);
      expect(parsed.ok, `${quiet} を読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
      expect(noticesOf(parsed), `${quiet} で知らせを出した`).toEqual([]);
    }
    // 知らせの無い図は、知らせの欄を持たない
    expect(parse(SHORT), "知らせの無い図が知らせの欄を持つ").not.toHaveProperty("notices");
  });

  it("short-cli-prints-similar-names", async () => {
    // 書き出しの命令は、似た名前の知らせを `<file>:<行> <文>` の形で標準エラーに出し、書き出したうえで終わり方 0 で終わる
    const notice = noticesOf(parse(SIMILAR, "ja"))[0];
    expect(notice, "読む処理が似た名前を知らせない").toBeDefined();
    const out = mkdtempSync(join(tmpdir(), "dragon-short-cli-"));
    const file = join(out, "similar.dragon");
    writeFileSync(file, SIMILAR);
    const ran = await runCli(["export", file, "--format", "html", "--out", out, "--lang", "ja"]);
    expect(ran.code, ran.stderr).toBe(0);
    expect(ran.stdout.trim(), "書き出した file の path を標準出力に出さない").toBe(join(out, "similar.html"));
    expect(ran.stderr.trimEnd().split("\n"), "標準エラーに似た名前の知らせが 1 件 1 行で出ない").toEqual([`${file}:${notice?.line} ${notice?.message}`]);
  });

  it("short-applies-to-box-line-kinds", () => {
    // 箱を線で結ぶ 3 つの種類は、同じ省き方を読む
    for (const kind of SHORT_KINDS) {
      const parsed = parse(lines(kind, "", "甲 -> 乙: 頼む", "乙 -> 甲"));
      expect(parsed.ok, `${kind} が短い記法を読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
      expect(boxIds(parsed), `${kind} が線から箱を導かない`).toEqual(["甲", "乙"]);
      expect(diagramOf(parsed)?.steps?.map((s) => s.body), `${kind} が線 1 本を 1 段にしない`).toEqual(["頼む", "乙 → 甲"]);
    }
    // ほかの種類は、段の外の線と宣言の無い名前を今と同じく断る
    for (const kind of ["git", "tree", "pipe"]) {
      expect(firstError(parse(lines(`${kind} 題`, "", "甲 -> 乙: 頼む"))), `${kind} が段の外の線を断らない`).toMatchObject({ line: 3, column: 1 });
      expect(firstError(parse(lines(`${kind} 題`, "", "step 一", "  say あ。", "  甲 -> 乙: 頼む"))), `${kind} が宣言の無い名前を断らない`).toMatchObject({ line: 5, column: 3 });
    }
  });

  it("short-prints-back-short", () => {
    const print = api("printNotation");
    const printBack = (text: string): string => {
      const parsed = parse(text);
      expect(parsed.ok, `${text} を読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
      return parsed.ok ? print(parsed.diagram) : "";
    };
    // 名前だけの箱が線に出た順に並び、段が線 1 本で題と本文が線から導いた字なら、宣言と段を書かない
    expect(printBack(SHORT), "省ける図を省いた形で書き戻さない").toBe(SHORT);
    // 段の本文が線から導いた字なら `say` を書かない。名前を持つ箱は宣言を書く
    const stepped = lines("sequence ログイン", "", "box browser as ブラウザ", "box app as アプリ", "", "step 押す", "  browser -> app: GET /login");
    expect(printBack(stepped), "線から導いた本文の say を書き戻した").toBe(stepped);
    // 箱の並びが線に出た順と違う時は、宣言を書いて並びを残す
    const reordered = lines("sequence", "", "box アプリ", "box ブラウザ", "", "ブラウザ -> アプリ: GET /login");
    expect(printBack(reordered), "線に出た順と違う箱の並びを残さない").toBe(reordered);
    // 省かずに書く指定 (`short: false`) を渡すと、題と箱の宣言と段と本文を全て書く。見本帳の棚は、この形で足す前と後の行の差を取る
    const full = parse(SHORT);
    expect(full.ok ? print(full.diagram, { short: false }) : "", "省かずに書く指定で、宣言と段を書かない").toBe(
      lines("sequence sequence", "", "box ブラウザ", "box アプリ", "", "step GET /login", "  say GET /login", "  ブラウザ -> アプリ: GET /login", "", "step 認可の頁へ送る", "  say 認可の頁へ送る", "  アプリ -> ブラウザ: 認可の頁へ送る"),
    );
    // 書き戻した記法を読み直すと、同じ原本になる
    for (const text of [SHORT, SIMILAR, stepped, reordered]) {
      const first = parse(text);
      expect(first.ok, text).toBe(true);
      if (!first.ok) continue;
      const again = parse(print(first.diagram));
      expect(again.ok ? again.diagram : firstError(again), `${text} を書き戻して読み直すと原本が変わる`).toEqual(first.diagram);
    }
  });

  it("short-keeps-errors-when-written", () => {
    // 段を書いた図の段の外の線は、今と同じく段の外に書いた行として、その行を示して断る
    for (const kind of ["sequence", "architecture"]) {
      const outside = firstError(parse(lines(`${kind} 頼む`, "", "box 甲", "box 乙", "", "甲 -> 乙: 頼む", "", "step 一", "  say あ。", "  甲 -> 乙")));
      expect(outside, `${kind} の段を書いた図で段の外の線を断らない`).toMatchObject({ line: 6, column: 1 });
    }
    // 箱を 1 つでも宣言した図の宣言の無い名前は、今と同じくその名前の位置を示して断る
    const undeclared = firstError(parse(lines("sequence 頼む", "", "box 甲", "box 乙", "", "step 一", "  say あ。", "  甲 -> 丙: 頼む")));
    expect(undeclared, "箱を宣言した図で宣言の無い名前を断らない").toMatchObject({ line: 8, column: 8 });
    expect(undeclared?.message).toContain("丙");
  });
});

/** README と書き方の手引きの最初の図の節。節の最初の dragon の囲みが短い書き方を示す */
const FIRST_DIAGRAMS = [
  { path: "README.ja.md", heading: "最初の図" },
  { path: "README.md", heading: "A first diagram" },
  { path: "packages/dragon/README.ja.md", heading: "最初の図" },
  { path: "packages/dragon/README.md", heading: "A first diagram" },
] as const;
const QUICK_STARTS = [
  { path: "packages/dragon/examples/quick-start.md", heading: "最小の図" },
  { path: "packages/dragon/examples/quick-start.en.md", heading: "The smallest diagram" },
] as const;

const sectionOf = (text: string, heading: string): string => text.split(new RegExp(`^## ${heading}$`, "mu"))[1]?.split(/^## /mu)[0] ?? "";

/** 節の最初の dragon の囲みが短い書き方で、読めて、箱 2 つ以上と段 1 つ以上の図になるかを確かめる */
function expectShortFirstFence(path: string, heading: string): void {
  const section = sectionOf(readFileSync(join(process.cwd(), path), "utf8"), heading);
  expect(section, `${path} に ## ${heading} の節が無い`).not.toBe("");
  const fence = api("extractDiagrams")(section)[0];
  expect(fence, `${path} の ${heading} の節に dragon の囲みが無い`).toBeDefined();
  if (!fence) return;
  expect(isShortForm(fence.source), `${path} の ${heading} の節の最初の囲みが、図の種類の語だけの 1 行目と線の行だけの短い書き方でない`).toBe(true);
  const parsed = parse(fence.source);
  expect(parsed.ok, `${path} の ${heading} の節の最初の囲みが読めない ${JSON.stringify(firstError(parsed))}`).toBe(true);
  expect(boxIds(parsed).length, `${path} の ${heading} の節の最初の囲みが箱 2 つ以上の図にならない`).toBeGreaterThanOrEqual(2);
  expect(diagramOf(parsed)?.steps?.length ?? 0, `${path} の ${heading} の節の最初の囲みが段を持たない`).toBeGreaterThanOrEqual(1);
}

describe("最初の図の節が短い書き方を示す (#3438)", () => {
  it("readme-first-diagram-shows-short-form", () => {
    for (const { path, heading } of FIRST_DIAGRAMS) expectShortFirstFence(path, heading);
  });

  it("quick-start-shows-short-form", () => {
    for (const { path, heading } of QUICK_STARTS) expectShortFirstFence(path, heading);
  });
});
