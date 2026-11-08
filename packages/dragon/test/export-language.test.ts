/**
 * 書き出しの部品と `dragon export` の命令が、図の中の字を選んだ言葉で書き出す (#3001)。
 *
 * 命令は `--lang` で言葉を選ぶ。渡さなければ、記法の file も JSON の原本も、図の題か `say` に仮名か漢字があれば日本語、無ければ英語で書き出す (#3516)。
 * 図の中の字は、全体図の札、書き出した HTML の読み上げの名前と `lang` 属性。描けない時の断りの文は命令の文と同じく `--lang` の言葉で、無ければ英語 (#3338)。
 * 書き出しの時間を抑えるため、HTML だけを書き出して Chromium で開いて読む。PNG は同じ図を言葉の渡し方を替えて 2 回書き出し、バイトで比べる。
 */
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { launch, stage } from "../src/export/capture";
import { api, exampleJson, exampleText, type Json } from "./diagram-support";
import { cliRunCount, drawnText, embeddedFonts, exporter, fontChars, formatOf, isBlank, type PlayerWords, playerWords, runCli } from "./export-support";

/** 寄って見せる見せ方になり、縦長の全体図を出す枠の幅。440px より狭い枠は縦長の全体図を出さない (#3055) */
const NARROW = 440;

const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-export-lang-"));

/** 英語と日本語のそれぞれで、書き出した HTML を開いた時に読める言葉と名前 */
function expected(lang: "ja" | "en", title: string): Omit<PlayerWords, "overviewFits"> {
  return lang === "en"
    ? { htmlLang: "en", prev: "Previous step", pause: "Pause", play: "Play", next: "Next step", steps: `Steps of ${title}`, overview: "Overview" }
    : { htmlLang: "ja", prev: "前の段", pause: "止める", play: "動かす", next: "次の段", steps: `${title}の段`, overview: "全体図" };
}

/** 命令で HTML だけを書き出し、書き出した HTML を狭い枠で開いて読む */
async function exported(input: string, extra: string[] = []): Promise<PlayerWords> {
  const out = scratch();
  const ran = await runCli(["export", input, "--out", out, "--format", "html", ...extra]);
  expect(ran.code, `書き出しが終了 0 で終わらない: ${ran.stderr}`).toBe(0);
  const html = readdirSync(out).find((name) => name.endsWith(".html"));
  expect(html, "HTML が書き出されない").toBeDefined();
  return playerWords(readFileSync(join(out, html as string), "utf8"), NARROW);
}

const titleOf = (file: string): string => String((exampleJson(file) as { title: string }).title);

/** 箱 2 つで段 30 の、高さが幅の 6 倍ほどある縦に長い図。寄って動かす見せ方で置く */
function tall(): Json {
  const edge: Json = { type: "edge", from: "a", to: "b", carry: { kind: "envelope" } };
  return {
    version: 1,
    kind: "sequence",
    title: "Tall diagram",
    view: "follow",
    boxes: [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ],
    steps: Array.from({ length: 30 }, (_, i) => ({ title: `Step ${i + 1}`, body: "Send.", events: [edge] })),
    sequence: { lifelines: ["a", "b"] },
  };
}

/** 英字だけで書き、大文字の O と小文字の r と w を持たない図。全体図の札 `Overview` の字が図の字から入らない */
function english(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "Small API",
    boxes: [
      { id: "a", name: "Web app" },
      { id: "b", name: "API v2" },
    ],
    steps: [{ title: "Call", body: "The app calls the API.", events: [{ type: "edge", from: "a", to: "b", label: "GET /items", carry: { kind: "envelope" } }] }],
    sequence: { lifelines: ["a", "b"] },
  };
}

/** 件ごとに、命令を起こした回数 (#3424) */
const cliRuns = new Map<string, number>();

describe("書き出しの図の中の字の言葉 (#3001)", () => {
  let runsAtStart = 0;
  beforeEach(() => {
    runsAtStart = cliRunCount();
  });
  afterEach(() => {
    const name = expect.getState().currentTestName ?? "";
    if (!name.includes("language-cases-run-cli-once")) cliRuns.set(name, cliRunCount() - runsAtStart);
  });

  it(
    "overview-label-fits-minimap",
    async () => {
      const exportDiagram = await exporter();
      for (const lang of ["ja", "en"] as const) {
        const result = await exportDiagram(tall(), { outDir: scratch(), formats: ["html"], lang });
        const words = await playerWords(readFileSync(result.files.html as string, "utf8"), NARROW);
        expect(words.overview, `${lang} の全体図の札`).toBe(expected(lang, "").overview);
        expect(words.overviewFits, `${lang} の全体図の札 (${words.overview}) が縦に長い図の全体図の地からはみ出す`).toBe(true);
      }
    },
  );

  // 見本ごとに 1 件 1 回の命令で書き出す (#3424)。2 回の命令を 1 件で起こすと、混んだ機械で 1 件の上限 (10 秒) を超えた
  it(
    "export-without-lang-is-english",
    async () => {
      // 題と `say` が英語の図は、`--lang` が無ければ英語で書き出す (#3338、#3516)
      expect(await exported(join(EXAMPLES, "oauth.en.dragon"))).toEqual({ ...expected("en", titleOf("oauth.en.json")), overviewFits: true });
    },
  );

  // 題と `say` に仮名か漢字がある図は、`--lang` が無ければ図に足す字を日本語で書き出す (#3516)。記法の file も JSON の原本も同じ
  describe.for([
    { what: "日本語の記法", file: "oauth.dragon" },
    { what: "日本語の JSON", file: "oauth.json" },
  ])("$what", ({ file }) => {
    it(
      "export-without-lang-follows-japanese-text",
      async () => {
        expect(await exported(join(EXAMPLES, file))).toEqual({ ...expected("ja", titleOf("oauth.json")), overviewFits: true });
      },
    );
  });

  // 渡し方ごとに 1 件 1 回の命令に分ける (#3410)。4 回の命令を 1 件で起こすと、混んだ機械で 1 件の上限 (10 秒) を超えた。
  // --lang を渡した時は、図の字の言葉に関わらず渡した言葉で書き出す (#3516)
  describe.for([
    { what: "JSON に --lang en を渡した時", file: "oauth.en.json", source: "oauth.en.json", extra: ["--lang", "en"], lang: "en" },
    { what: "JSON に --lang を渡さない時", file: "oauth.en.json", source: "oauth.en.json", extra: [], lang: "en" },
    { what: "JSON に --lang ja を渡した時", file: "oauth.en.json", source: "oauth.en.json", extra: ["--lang", "ja"], lang: "ja" },
    { what: "英語の記法に --lang ja を渡した時", file: "oauth.en.dragon", source: "oauth.en.json", extra: ["--lang", "ja"], lang: "ja" },
    { what: "日本語の記法に --lang en を渡した時", file: "oauth.dragon", source: "oauth.json", extra: ["--lang", "en"], lang: "en" },
  ] as const)("$what", ({ what, file, source, extra, lang }) => {
    it(
      "export-lang-flag",
      async () => {
        expect(await exported(join(EXAMPLES, file), [...extra]), what).toEqual({ ...expected(lang, titleOf(source)), overviewFits: true });
      },
    );
  });

  it(
    "export-diagram-without-lang-follows-japanese-text",
    async () => {
      // 部品も、`lang` を渡さなければ図の題と `say` から図に足す字の言葉を決め、頁の `lang` 属性と頁に渡す言葉にする (#3516)
      const exportDiagram = await exporter();
      const result = await exportDiagram(exampleJson("oauth.json"), { outDir: scratch(), formats: ["html"] });
      const html = readFileSync(result.files.html as string, "utf8");
      expect(html, "頁の lang 属性が ja でない").toMatch(/<html lang="ja">/u);
      expect(html, "頁に渡す言葉が ja でない").toMatch(/"lang":"ja"\}\);<\/script>/u);
    },
  );

  it(
    "export-refusal-follows-language",
    async () => {
      const dir = scratch();
      const bad = exampleJson("oauth.json") as { blocks: { box: { [key: string]: Json }[] } };
      (bad.blocks.box[0] as { [key: string]: Json }).colour = "blue";
      const input = join(dir, "bad.json");
      writeFileSync(input, JSON.stringify(bad));
      const out = join(dir, "out");
      const ran = await runCli(["export", input, "--out", out, "--format", "html", "--lang", "en"]);
      expect(ran.code, "描けない原本で終了 1 にならない").toBe(1);
      expect(readdirSync(dir), "描けない原本で何かを書き出した").toEqual(["bad.json"]);
      const message = ran.stderr.trim();
      expect(message, "断りの文の頭").toMatch(/^Cannot draw the diagram: /u);
      expect(message, "断りの文に誤りの場所が無い").toContain("/blocks/box/0/colour");
      expect(message, "英語の断りの文に仮名か漢字がある").not.toMatch(KANA_KANJI);
    },
  );

  it(
    "export-refusal-default-english",
    async () => {
      // 題と `say` が日本語の図でも、`--lang` が無ければ描けない時の断りは今どおり英語で出す (#3338、#3516)
      const dir = scratch();
      const bad = exampleJson("oauth.json") as { blocks: { box: { [key: string]: Json }[] } };
      (bad.blocks.box[0] as { [key: string]: Json }).colour = "blue";
      const input = join(dir, "bad.json");
      writeFileSync(input, JSON.stringify(bad));
      const ran = await runCli(["export", input, "--out", join(dir, "out"), "--format", "html"]);
      expect(ran.code, "描けない原本で終了 1 にならない").toBe(1);
      expect(readdirSync(dir), "描けない原本で何かを書き出した").toEqual(["bad.json"]);
      const message = ran.stderr.trim();
      expect(message, "断りの文の頭").toMatch(/^Cannot draw the diagram: /u);
      expect(message, "断りの文に誤りの場所が無い").toContain("/blocks/box/0/colour");
      expect(message, "英語の断りの文に仮名か漢字がある").not.toMatch(KANA_KANJI);
    },
  );

  it(
    "export-rejects-unknown-lang",
    async () => {
      const dir = scratch();
      const out = join(dir, "out");
      const ran = await runCli(["export", join(EXAMPLES, "oauth.json"), "--out", out, "--format", "html", "--lang", "fr"]);
      expect(ran.code, "知らない言葉で終了 2 にならない").toBe(2);
      expect(readdirSync(dir), "知らない言葉で何かを書き出した").toEqual([]);
      // 知らない言葉では言葉が決まらないので、既定の英語の使い方を出す (#3338)
      expect(ran.stderr, "使い方を出さない").toContain("Usage: dragon export");
      expect(ran.stderr, "使い方に --lang の行が無い").toMatch(/^\s+--lang\s/mu);
    },
  );

  it(
    "html-export-font-subset-follows-language",
    async () => {
      const exportDiagram = await exporter();
      const result = await exportDiagram(english(), { outDir: scratch(), formats: ["html"], lang: "en" });
      const html = readFileSync(result.files.html as string, "utf8");
      const embedded = new Set<string>();
      // 空白の類だけが入る file は、読める形にするために範囲に載せない字を 1 つ足すので、図で描かない字を数える対象から外す (#3212)
      const shaped = new Set<string>();
      for (const font of embeddedFonts(html)) {
        const chars = await fontChars(font.woff2);
        chars.forEach((char) => embedded.add(char));
        if (!font.range.every(isBlank)) chars.forEach((char) => shaped.add(char));
      }
      const missing = [..."Overview"].filter((char) => !embedded.has(char));
      expect(missing, "英語の全体図の札の字が埋めた字の file に無い").toEqual([]);
      const japanese = [..."全体図"].filter((char) => embedded.has(char));
      expect(japanese, "英語で書き出したのに日本語の全体図の札の字を埋めた").toEqual([]);
      const drawn = new Set(await drawnText(html));
      const extra = [...shaped].filter((char) => !drawn.has(char));
      expect(extra, "形のある字が入る字の file に図で描かない字を埋めた").toEqual([]);
    },
  );

  it(
    "export-english-only-png",
    async () => {
      const out = scratch();
      const ran = await runCli(["export", join(EXAMPLES, "order.en.json"), "--out", out, "--format", "png", "--lang", "en"]);
      expect(ran.code, `英語の見本を PNG に書き出すと終了 0 で終わらない: ${ran.stderr}`).toBe(0);
      expect(readdirSync(out)).toEqual(["order.en.png"]);
      expect(formatOf(readFileSync(join(out, "order.en.png")))).toBe("png");
    },
  );

  it(
    "export-names-unreadable-font",
    async () => {
      // 中身の壊れた字の file。Chromium は読めずに字の読み込みを断る
      const broken = '@font-face{font-family:"Broken Font";src:url(data:font/woff2;base64,AAAA) format("woff2");unicode-range:U+41}';
      for (const lang of ["ja", "en"] as const) {
        const browser = await launch(lang);
        try {
          const failed = await stage(browser, '<svg width="10" height="10"></svg>', broken, "", lang).then(
            () => undefined,
            (error: unknown) => error,
          );
          expect(failed, `${lang} で読めない字の file を置いても撮る頁が止まらない`).toBeInstanceOf(Error);
          const message = (failed as Error).message;
          expect(message, `${lang} の断りの文が読めない字の file の字の名前を名指さない`).toContain("Broken Font");
          expect(message, `${lang} の断りの文が読めない字の file の字の範囲を名指さない`).toContain("U+41");
          if (lang === "en") expect(message, "英語の断りの文が仮名か漢字を含む").not.toMatch(KANA_KANJI);
          else expect(message, "日本語の断りの文が日本語で書かれていない").toMatch(KANA_KANJI);
        } finally {
          await browser.close();
        }
      }
    },
  );

  /**
   * 状態の図の見本を、命令で `--lang` を渡さずに PNG に書き出した中身と、`--lang` の言葉を渡した部品で書き出した中身 (#3516)。
   * `dragon export --lang <言葉>` は記法を読んで同じ部品にその言葉を渡すので、部品の PNG を `--lang` を渡した書き出しとして比べる。
   * 命令は 1 件 1 回だけ起こし (#3424)、部品の書き出しと並べて走らせる
   */
  async function statePngs(file: string, lang: "ja" | "en"): Promise<{ plain: Buffer; given: Buffer }> {
    const parsed = api("parseNotation")(exampleText(file));
    expect(parsed.ok, `見本 ${file} の記法を読めない`).toBe(true);
    if (!parsed.ok) throw new Error(`見本 ${file} の記法を読めない`);
    const out = scratch();
    const exportDiagram = await exporter();
    const [ran, result] = await Promise.all([runCli(["export", join(EXAMPLES, file), "--out", out, "--format", "png"]), exportDiagram(parsed.diagram, { outDir: scratch(), formats: ["png"], lang })]);
    expect(ran.code, `--lang なしの書き出しが終了 0 で終わらない: ${ran.stderr}`).toBe(0);
    const png = readdirSync(out).find((name) => name.endsWith(".png"));
    expect(png, "--lang なしで PNG が書き出されない").toBeDefined();
    return { plain: readFileSync(join(out, png as string)), given: readFileSync(result.files.png as string) };
  }

  it(
    "export-png-without-lang-follows-japanese-text",
    async () => {
      // 題と `say` が日本語の注文の状態の図。脇道の囲みと始まりと終わりの印を描く
      const { plain, given } = await statePngs("order.dragon", "ja");
      expect(plain.equals(given), "--lang なしの PNG が --lang ja の PNG とバイト単位で違う (図に足す字が日本語でない)").toBe(true);
    },
  );

  it(
    "export-png-without-lang-keeps-english-text",
    async () => {
      const { plain, given } = await statePngs("order.en.dragon", "en");
      expect(plain.equals(given), "--lang なしの PNG が --lang en の PNG とバイト単位で違う").toBe(true);
    },
  );

  it("language-cases-run-cli-once", () => {
    // どの件も命令を 1 回までしか起こさない (#3424)。命令は起こすだけで混み 65 で 1.2 秒かかり、2 回起こす件は混んだ機械で 1 件の上限 (10 秒) を超えた。この describe の最後の件として数える
    expect(cliRuns.size, "書き出しの言葉の件が 1 つも回っていない").toBeGreaterThan(0);
    expect([...cliRuns].filter(([, count]) => count > 1), "命令を 2 回以上起こした件 (件の名前と回数)").toEqual([]);
  });
});
