/**
 * 書き出しの部品と `dragon export` の命令が、図の中の字を選んだ言葉で書き出す (#3001)。
 *
 * 命令は `--lang` で言葉を選ぶ。渡さなければ、記法の file はその file の言葉、JSON の原本は日本語で書き出す。
 * 図の中の字は、全体図の札、書き出した HTML の読み上げの名前と `lang` 属性、描けない時の断りの文。
 * 書き出しの時間を抑えるため、HTML だけを書き出して Chromium で開いて読む。
 */
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exampleJson, type Json } from "./diagram-support";
import { drawnText, embeddedFonts, exporter, fontChars, type PlayerWords, playerWords, runCli } from "./export-support";

/** 書き出し 1 回に許す時間。Chromium の起動を含む */
const SLOW = 180_000;
/** 寄って見せる見せ方になる、狭い枠の幅 */
const NARROW = 200;

const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-export-lang-"));

/** 英語と日本語のそれぞれで、書き出した HTML を開いた時に読める言葉と名前 */
function expected(lang: "ja" | "en", title: string): Omit<PlayerWords, "overviewFits"> {
  return lang === "en"
    ? { htmlLang: "en", prev: "Previous step", pause: "Pause", play: "Play", next: "Next step", steps: `Steps of ${title}`, overview: "Overview" }
    : { htmlLang: "ja", prev: "前の段", pause: "止める", play: "動かす", next: "次の段", steps: `${title} の段`, overview: "全体図" };
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

describe("書き出しの図の中の字の言葉 (#3001)", () => {
  it(
    "overview-label-fits-minimap",
    async () => {
      const exportDiagram = await exporter();
      for (const lang of ["ja", "en"] as const) {
        const result = await exportDiagram(tall(), { outDir: scratch(), formats: ["html"], lang });
        const words = await playerWords(readFileSync(result.files.html as string, "utf8"), 375);
        expect(words.overview, `${lang} の全体図の札`).toBe(expected(lang, "").overview);
        expect(words.overviewFits, `${lang} の全体図の札 (${words.overview}) が縦に長い図の全体図の地からはみ出す`).toBe(true);
      }
    },
    SLOW,
  );

  it(
    "export-follows-notation-language",
    async () => {
      const en = await exported(join(EXAMPLES, "oauth.en.dragon"));
      expect(en).toEqual({ ...expected("en", titleOf("oauth.en.json")), overviewFits: true });
      const ja = await exported(join(EXAMPLES, "oauth.dragon"));
      expect(ja).toEqual({ ...expected("ja", titleOf("oauth.json")), overviewFits: true });
    },
    SLOW,
  );

  it(
    "export-lang-flag",
    async () => {
      const json = join(EXAMPLES, "oauth.en.json");
      const title = titleOf("oauth.en.json");
      expect(await exported(json, ["--lang", "en"]), "JSON に --lang en を渡した時").toEqual({ ...expected("en", title), overviewFits: true });
      expect(await exported(json), "JSON に --lang を渡さない時").toEqual({ ...expected("ja", title), overviewFits: true });
      expect(await exported(join(EXAMPLES, "oauth.en.dragon"), ["--lang", "ja"]), "英語の記法に --lang ja を渡した時").toEqual({
        ...expected("ja", title),
        overviewFits: true,
      });
    },
    SLOW,
  );

  it(
    "export-refusal-follows-language",
    async () => {
      const dir = scratch();
      const bad = exampleJson("oauth.json") as { boxes: { [key: string]: Json }[] };
      (bad.boxes[0] as { [key: string]: Json }).colour = "blue";
      const input = join(dir, "bad.json");
      writeFileSync(input, JSON.stringify(bad));
      const out = join(dir, "out");
      const ran = await runCli(["export", input, "--out", out, "--format", "html", "--lang", "en"]);
      expect(ran.code, "描けない原本で終了 1 にならない").toBe(1);
      expect(readdirSync(dir), "描けない原本で何かを書き出した").toEqual(["bad.json"]);
      const message = ran.stderr.trim();
      expect(message, "断りの文の頭").toMatch(/^Cannot draw the diagram: /u);
      expect(message, "断りの文に誤りの場所が無い").toContain("/boxes/0/colour");
      expect(message, "英語の断りの文に仮名か漢字がある").not.toMatch(KANA_KANJI);
    },
    SLOW,
  );

  it(
    "export-rejects-unknown-lang",
    async () => {
      const dir = scratch();
      const out = join(dir, "out");
      const ran = await runCli(["export", join(EXAMPLES, "oauth.json"), "--out", out, "--format", "html", "--lang", "fr"]);
      expect(ran.code, "知らない言葉で終了 2 にならない").toBe(2);
      expect(readdirSync(dir), "知らない言葉で何かを書き出した").toEqual([]);
      expect(ran.stderr, "使い方を出さない").toContain("使い方: dragon export");
      expect(ran.stderr, "使い方に --lang の行が無い").toMatch(/^\s+--lang\s/mu);
    },
    SLOW,
  );

  it(
    "html-export-font-subset-follows-language",
    async () => {
      const exportDiagram = await exporter();
      const result = await exportDiagram(english(), { outDir: scratch(), formats: ["html"], lang: "en" });
      const html = readFileSync(result.files.html as string, "utf8");
      const embedded = new Set<string>();
      for (const font of embeddedFonts(html)) for (const char of await fontChars(font.woff2)) embedded.add(char);
      const missing = [..."Overview"].filter((char) => !embedded.has(char));
      expect(missing, "英語の全体図の札の字が埋めた字の file に無い").toEqual([]);
      const japanese = [..."全体図"].filter((char) => embedded.has(char));
      expect(japanese, "英語で書き出したのに日本語の全体図の札の字を埋めた").toEqual([]);
      const drawn = new Set(await drawnText(html));
      const extra = [...embedded].filter((char) => !drawn.has(char));
      expect(extra, "図で描かない字を埋めた").toEqual([]);
    },
    SLOW,
  );
});
