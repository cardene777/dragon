/**
 * 場面を選ぶとやり取りの順が替わる選べる図 (`try` の `[shape: scenes]`、#3873)。
 *
 * bitsumi の型の記法 (cardene777/bitsumi. の #878) を書き直さずに読み、場面を選ぶと、その場面のやり取りだけを書いた順に返す。
 * 描けない原本は `dragon check` が行の番号付きの誤りを出す。
 * `dragon check` と書き出しは重いので、file を読み込む段 (`at-load.ts`) で 1 回ずつ済ませ、件はその結果を読む。
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { changelogEntry } from "./changelog-support";
import { api } from "./diagram-support";
import { exporter, runCliInProcess } from "./export-support";
import { KANA, parsedTry } from "./try-support";
import {
  BAD_SOURCES,
  badMarkdown,
  checkLines,
  englishOf,
  GOOD_SOURCE,
  SAMPLE,
  SAMPLE_ANSWERS,
  SAMPLE_LANES,
  SAMPLE_PLAIN,
  SAMPLE_ROWS,
  SAMPLE_SCENES,
  scenesModule,
  toEnglish,
} from "./try-scenes-support";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
/** 見本の名前 (見本帳の見本の鍵と同じ) */
const EXAMPLE = "reply-ways";

/** 描けない原本と描ける原本を 1 つずつ図の囲いに入れた Markdown を、日本語と英語で書いて `dragon check` を回す */
const CHECKED = await atLoad("描けない原本を日本語と英語で dragon check に掛ける", async () => {
  const dir = mkdtempSync(join(tmpdir(), "dragon-try-scenes-check-"));
  const run = async (lang: "ja" | "en") => {
    const sources = [{ name: "good", text: GOOD_SOURCE }, ...BAD_SOURCES].map((source) => ({
      name: source.name,
      text: lang === "ja" ? source.text : toEnglish(source.text),
    }));
    const { markdown, startOf } = badMarkdown(sources);
    const file = join(dir, `bad-${lang}.md`);
    writeFileSync(file, markdown);
    const ran = await runCliInProcess(["check", file, "--lang", lang]);
    return { ran, startOf, sources };
  };
  return { ja: await run("ja"), en: await run("en") };
});

/** 見本の日本語と英語の原本を dragon check に掛ける */
const EXAMPLE_CHECKED = await atLoad("見本の日本語と英語の原本を dragon check に掛ける", () =>
  runCliInProcess([
    "check",
    join(EXAMPLES, `${EXAMPLE}.dragon`),
    join(EXAMPLES, `${EXAMPLE}.en.dragon`),
  ]),
);

/** 原本を SVG に書き出した中身 */
async function svgOf(text: string, name: string): Promise<string> {
  const exportDiagram = await exporter();
  const outDir = mkdtempSync(join(tmpdir(), "dragon-try-scenes-svg-"));
  const exported = await exportDiagram(parsedTry(text), {
    outDir,
    name,
    formats: ["svg"],
    lang: "ja",
  });
  expect(exported.files.svg, `${name} を SVG に書き出していない`).toBeDefined();
  return readFileSync(exported.files.svg ?? "", "utf8");
}

// 2 つの見た目を別の仕事で書き出す。1 つの仕事にすると、場面の見た目が描けない時に今の見た目を確かめる件まで落ちる
/** 見本の原本を `[shape: scenes]` を書いた形で SVG に書き出す */
const SCENES_SVG = await atLoad("見本の原本を場面の見た目で SVG に書き出す", () =>
  svgOf(SAMPLE, "scenes"),
);
/** 見本の原本を `[shape: scenes]` を書かない形で SVG に書き出す */
const PLAIN_SVG = await atLoad("見本の原本を今の見た目で SVG に書き出す", () =>
  svgOf(SAMPLE_PLAIN, "plain"),
);

const firstLine = (text: string): string => text.split("\n")[0] ?? "";

describe("場面の見た目を選ぶ書き方 (#3873)", () => {
  it("try-scenes-shape-round-trip", () => {
    const parse = api("parseNotation");
    const first = parse(SAMPLE, { lang: "ja" });
    expect(
      first.ok,
      `[shape: scenes] を書いた try が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`,
    ).toBe(true);
    if (!first.ok) return;
    const diagram = first.diagram as { try?: { shape?: string } };
    expect(diagram.try?.shape, "読んだ原本の try に見た目 (shape) の scenes が無い").toBe("scenes");
    // 記法から描く道だけでなく、原本の形を検査してから描く書き出しの頁でも描けるよう、原本の形の検査も通す (#4040 の学び)
    const checked = api("validateDiagram")(first.diagram);
    expect(
      checked.ok,
      `原本の形の検査が [shape: scenes] の try を断る: ${JSON.stringify(checked)}`,
    ).toBe(true);
    const printed = api("printNotation")(first.diagram);
    expect(firstLine(printed), "書き戻した記法の 1 行目に [shape: scenes] が戻らない").toBe(
      firstLine(SAMPLE),
    );
    const again = parse(printed, { lang: "ja" });
    expect(
      again.ok,
      `書き戻した記法が読めない: ${again.ok ? "" : JSON.stringify(again.errors)}`,
    ).toBe(true);
    if (again.ok)
      expect(again.diagram, "書き戻して読み直した原本が元の原本と違う").toEqual(first.diagram);
  });

  it("try-scenes-refuses-other-shapes", () => {
    const parse = api("parseNotation");
    for (const shape of ["stations", "pipe"]) {
      const text = SAMPLE.replace("[shape: scenes]", `[shape: ${shape}]`);
      const parsed = parse(text, { lang: "ja" });
      expect(parsed.ok, `try の行の [shape: ${shape}] を断らない`).toBe(false);
      if (parsed.ok) continue;
      const error = parsed.errors[0];
      expect(error?.line, `[shape: ${shape}] の誤りが try の行を名指さない`).toBe(1);
      expect(error?.message, `[shape: ${shape}] の誤りの文が書ける値 scenes を挙げない`).toContain(
        "scenes",
      );
    }
  });
});

describe("場面の判定 (#3873)", () => {
  it("try-scenes-reads-bitsumi-sample", async () => {
    const { readScenes } = await scenesModule();
    const scenes = readScenes(parsedTry(SAMPLE));
    expect(scenes.lanes, "物を道の順に並べない").toEqual(SAMPLE_LANES);
    expect(scenes.scenes, "場面を choose の順に並べない").toEqual(SAMPLE_SCENES);
    for (const scene of SAMPLE_SCENES)
      expect(
        scenes.rows.filter((row) => row.scene === scene).map((row) => row.id),
        `場面 ${scene} のやり取りを書いた順に持たない`,
      ).toEqual(SAMPLE_ROWS[scene]);
  });

  it("try-scenes-plays-chosen-only", async () => {
    const { readScenes, pickScene } = await scenesModule();
    const scenes = readScenes(parsedTry(SAMPLE));
    for (const scene of SAMPLE_SCENES) {
      const picked = pickScene(scenes, scene);
      expect(
        picked.rows.map((row) => row.id),
        `場面 ${scene} を選んだ時のやり取りが、その場面の書いた順と違う`,
      ).toEqual(SAMPLE_ROWS[scene]);
      expect(
        picked.rows.every((row) => row.scene === scene),
        `場面 ${scene} を選んだ時に、ほかの場面のやり取りを返す`,
      ).toBe(true);
    }
    const later = pickScene(scenes, "後で知らせる").rows.find((row) => row.id === "知らせる3");
    expect(later, "知らせる3 のやり取りが無い").toMatchObject({
      from: "サーバ",
      to: "画面",
      label: "受け付けた印と問い合わせの番号を返す",
    });
  });

  it("try-scenes-same-lane-is-note", async () => {
    const { readScenes, pickScene } = await scenesModule();
    const rows = pickScene(readScenes(parsedTry(SAMPLE)), "その場で返す").rows;
    expect(
      rows.filter((row) => row.note).map((row) => row.id),
      "送り手と受け手が同じやり取り (返す3) だけを注記にしない",
    ).toEqual(["返す3"]);
  });

  it("try-scenes-answer-per-scene", async () => {
    const { readScenes, pickScene } = await scenesModule();
    const scenes = readScenes(parsedTry(SAMPLE));
    for (const scene of SAMPLE_SCENES)
      expect(
        pickScene(scenes, scene).answer,
        `場面 ${scene} の答えの一文と理由が答えの item の中身と違う`,
      ).toEqual(SAMPLE_ANSWERS[scene]);
    // 英語の答えは最初の「. 」までを答えの一文にする
    const english = readScenes(parsedTry(toEnglish(GOOD_SOURCE), "en"));
    expect(pickScene(english, "wait").answer, "英語の答えの一文と理由を分けない").toEqual({
      head: "The screen waits.",
      why: "The server returns only after it finishes.",
    });
  });
});

describe("描けない原本 (#3873)", () => {
  it("try-scenes-check-refuses-bad-sources", () => {
    const { ran, startOf } = CHECKED.get().ja;
    const found = checkLines(`${ran.stdout}\n${ran.stderr}`);
    expect(ran.code, "描けない原本を dragon check が 0 で通す").not.toBe(0);
    const goodStart = startOf.good ?? 0;
    expect(
      found.filter(
        (line) =>
          line.severity === "error" &&
          line.line >= goodStart &&
          line.line < goodStart + GOOD_SOURCE.split("\n").length,
      ),
      "描ける小さな場面の図に dragon check が誤りを出す",
    ).toEqual([]);
    const messages = new Map<string, string>();
    for (const source of BAD_SOURCES) {
      const line = (startOf[source.name] ?? 0) + source.at - 1;
      const error = found.find((one) => one.severity === "error" && one.line === line);
      expect(
        error,
        `${source.name} の原本で、dragon check が ${source.at} 行目 (file の ${line} 行目) を名指す誤りを出さない`,
      ).toBeDefined();
      if (!error) continue;
      if (source.names)
        expect(error.message, `${source.name} の誤りの文が ${source.names} を名指さない`).toContain(
          source.names,
        );
      messages.set(source.name, error.message);
    }
    const seen = new Map<string, string>();
    for (const [name, message] of messages) {
      expect(
        seen.get(message),
        `${name} と ${seen.get(message)} の誤りの文が同じで、形を見分けられない`,
      ).toBeUndefined();
      seen.set(message, name);
    }
  });

  it("try-scenes-errors-in-both-languages", () => {
    const checked = CHECKED.get();
    for (const lang of ["ja", "en"] as const) {
      const { ran, startOf, sources } = checked[lang];
      const found = checkLines(`${ran.stdout}\n${ran.stderr}`);
      for (const source of sources) {
        if (source.name === "good") continue;
        if (lang === "en")
          expect(
            KANA.test(source.text),
            `${source.name} の英語の原本に仮名か漢字が残る: ${source.text}`,
          ).toBe(false);
        const at = BAD_SOURCES.find((bad) => bad.name === source.name)?.at ?? 0;
        const error = found.find(
          (one) => one.severity === "error" && one.line === (startOf[source.name] ?? 0) + at - 1,
        );
        expect(error, `${lang} の ${source.name} の原本に誤りの文が無い`).toBeDefined();
        if (!error) continue;
        if (lang === "en") {
          expect(
            KANA.test(error.message),
            `${source.name} の英語の誤りの文が仮名か漢字を含む: ${error.message}`,
          ).toBe(false);
          const names = BAD_SOURCES.find((bad) => bad.name === source.name)?.names;
          if (names)
            expect(
              error.message,
              `${source.name} の英語の誤りの文が ${englishOf(names)} を名指さない`,
            ).toContain(englishOf(names));
        } else
          expect(
            KANA.test(error.message),
            `${source.name} の日本語の誤りの文が仮名か漢字を持たない: ${error.message}`,
          ).toBe(true);
      }
    }
  });
});

describe("描いた形 (#3873)", () => {
  it("try-without-shape-keeps-route-look", () => {
    const plain = PLAIN_SVG.get();
    expect(plain, "[shape: scenes] を書かない try が網 (dg-try-net) を描かない").toContain(
      "dg-try-net",
    );
    expect(plain, "[shape: scenes] を書かない try が待ち列 (dg-try-q) を描かない").toContain(
      "dg-try-q",
    );
    expect(plain, "[shape: scenes] を書かない try が場面のやり取りを描く").not.toContain(
      "data-scene-row",
    );
  });

  it("try-scenes-export-draws-author-scene", () => {
    const scenes = SCENES_SVG.get();
    // 最後の段は 聞く7 (画面が聞きに行く) を選ぶ
    for (const label of ["受け付けた印を返す", "終わったかを聞く", "まだと返す", "もう一度聞く"])
      expect(
        scenes,
        `書き出しの静止画が、最後の段の場面 (画面が聞きに行く) のやり取り ${label} を描かない`,
      ).toContain(label);
    for (const label of [
      "処理を渡す",
      "受け付けた印と問い合わせの番号を返す",
      "終わったと知らせる",
    ])
      expect(
        scenes,
        `書き出しの静止画が、最後の段で選ばない場面のやり取り ${label} を描く`,
      ).not.toContain(label);
    expect(
      scenes.match(/data-scene-row="/gu)?.length ?? 0,
      "書き出しの静止画のやり取りの数が、画面が聞きに行く場面の 8 本と違う",
    ).toBe(8);
    expect(scenes, "書き出しの静止画が最後の段の場面の答えの一文を描かない").toContain(
      SAMPLE_ANSWERS["画面が聞きに行く"]?.head ?? "-",
    );
  });
});

describe("見本と文書 (#3873)", () => {
  it("try-scenes-example-in-gallery-and-shelf", () => {
    for (const file of [`${EXAMPLE}.dragon`, `${EXAMPLE}.en.dragon`]) {
      const path = join(EXAMPLES, file);
      expect(existsSync(path), `見本 ${file} が packages/dragon/examples に無い`).toBe(true);
      if (!existsSync(path)) continue;
      const text = readFileSync(path, "utf8");
      const parsed = api("parseNotation")(text, {
        lang: file.endsWith(".en.dragon") ? "en" : "ja",
      });
      expect(
        parsed.ok,
        `見本 ${file} が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`,
      ).toBe(true);
      if (parsed.ok)
        expect(
          (parsed.diagram as { try?: { shape?: string } }).try?.shape,
          `見本 ${file} が場面の見た目で書かれていない`,
        ).toBe("scenes");
    }
    const checked = EXAMPLE_CHECKED.get();
    expect(checked.code, `見本を dragon check が通さない: ${checked.stdout}${checked.stderr}`).toBe(
      0,
    );
    const keys = readFileSync(join(ROOT, "apps/playground-spa/src/examples.ts"), "utf8");
    expect(keys, `見本帳の見本の一覧 (EXAMPLE_KEYS) に ${EXAMPLE} が無い`).toContain(
      `"${EXAMPLE}"`,
    );
    const shelf = readFileSync(join(ROOT, "apps/playground-spa/src/editor/shelf-items.ts"), "utf8");
    expect(shelf, "編集画面の棚に場面の見た目 (try の shape: scenes) の書き始めが無い").toMatch(
      /try: \{[^}]*shape: "scenes"/u,
    );
  });

  it("try-scenes-docs-and-changelog", () => {
    const docs = [
      "apps/playground-spa/src/docs/content.ts",
      "README.md",
      "packages/dragon/README.md",
      "packages/dragon/examples/quick-start.md",
      "packages/dragon/examples/quick-start.en.md",
      "docs/design/base/GRAMMAR.md",
    ];
    for (const path of docs)
      expect(
        readFileSync(join(ROOT, path), "utf8"),
        `${path} に [shape: scenes] の書き方が無い`,
      ).toContain("[shape: scenes]");
    const content = readFileSync(join(ROOT, "apps/playground-spa/src/docs/content.ts"), "utf8");
    expect(
      content.split("[shape: scenes]").length - 1,
      "使い方の頁の日本語と英語の両方に [shape: scenes] の書き方が無い",
    ).toBeGreaterThanOrEqual(2);
    for (const path of ["CHANGELOG.md", "CHANGELOG.ja.md"]) {
      const entry = changelogEntry(join(ROOT, path), 3873);
      expect(entry, `${path} にこの課題 (#3873) の項が無い`).not.toBe("");
      expect(entry, `${path} の #3873 の項を持つ節に [shape: scenes] が無い`).toContain(
        "[shape: scenes]",
      );
    }
  });
});
