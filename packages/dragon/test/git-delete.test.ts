/**
 * 枝分かれの図で枝を消す行 `delete <枝>` (#3632)。
 *
 * #3615 で見本 `squash` を書いた時、機能の枝を squash で取り込んだ後に枝を消す所を図で描けなかった。
 * 枝分かれの図の記法は枝を消す出来事を持たず、消した後も枝の札が残り、どの枝からも辿れなくなった commit も点線の丸にならなかった。
 * 段の中の `delete <枝>` で枝を消す (step 2 で本人が選んだ。git の枝を消す命令 `git branch --delete` と同じ語)。
 * 消した段から後はその枝の札を描かず、どの枝からも辿れなくなった commit は今の決まりのとおり点線の丸で描く。
 * 宣言していない枝、`HEAD` が指している枝を消す行と、消した枝へ commit を足す行は、読む時に誤りで止める。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { draw, type Rendered } from "./render-support";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const BLOCKS = join(ROOT, "packages/dragon/src/blocks");

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

interface GitCommit {
  id: string;
  /** どの枝の札からも辿れなくなった段 (0 から数える) */
  orphan?: number;
}

interface GitTag {
  ref: string;
  step: number;
}

interface GitRef {
  name: string;
  at: (string | null)[];
}

interface GitRendered {
  svg: string;
  layout: { commits: GitCommit[]; tags: GitTag[]; refs: GitRef[] };
}

interface SourceEvent {
  type: string;
  branch?: string;
  field?: string;
  value?: string;
}

interface Source {
  kind: string;
  steps: { title: string; events: SourceEvent[] }[];
}

const repoText = (path: string): string => (existsSync(join(ROOT, path)) ? readFileSync(join(ROOT, path), "utf8") : "");

/** 読んだ原本の JSON。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: "ja" | "en" = "ja"): Source {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return (read.ok ? read.diagram : { kind: "", steps: [] }) as unknown as Source;
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json): GitRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "枝分かれの図を描けない").toBe("");
  return rendered as unknown as GitRendered;
}

/**
 * main に A を積み、A から topic を切って C と D を積み、C から fix を切って F を積み、段3で topic を消す図。
 * 消す時の HEAD は fix を指す。topic を消すと D はどの枝からも辿れなくなり、C は fix の F から辿れる
 */
const DELETES_TOPIC = `git 枝を消す

branch main
branch topic
branch fix

step 積む
  say mainにAを積む。
  commit A on main

step 枝を切る
  say topicを切ってCとDを積み、Cからfixを切ってFを積む。
  topic from A
  commit C on topic
  commit D on topic
  fix from C
  commit F on fix

step 消す
  say topicを消す。
  delete topic
`;

/** `DELETES_TOPIC` と同じ図の原本の JSON。段3が枝を消す出来事を持つ */
function deletesTopicJson(): Json {
  const commit = (id: string, branch: string): Json => ({ type: "commit", id, branch });
  return {
    version: 1,
    kind: "git",
    title: "枝を消す",
    boxes: [],
    git: { branches: [{ id: "main" }, { id: "topic" }, { id: "fix" }] },
    steps: [
      { title: "積む", body: "mainにAを積む。", events: [commit("A", "main")] },
      {
        title: "枝を切る",
        body: "topicを切ってCとDを積み、Cからfixを切ってFを積む。",
        events: [{ type: "branch", branch: "topic", from: "A" }, commit("C", "topic"), commit("D", "topic"), { type: "branch", branch: "fix", from: "C" }, commit("F", "fix")],
      },
      { title: "消す", body: "topicを消す。", events: [{ type: "delete", branch: "topic" }] },
    ],
  };
}

/** 読む時の最初の誤り。読めた時は `undefined` */
function firstError(lines: string[], lang: "ja" | "en"): LineError | undefined {
  const read = api("parseNotation")(lines.join("\n"), { lang });
  return read.ok ? undefined : read.errors[0];
}

/**
 * 誤りの行 `at` (0 から数える) の語 `token` を、誤りの行と列で名指すか。日本語と英語の両方で、文が空でなく、英語の文に仮名と漢字が無いかも見る。
 * `mentions` を渡した時は、両方の文がその語を含むかも見る
 */
function expectRefused(name: string, lines: string[], at: number, token: string, mentions?: string): void {
  const want = { line: at + 1, column: (lines[at] ?? "").indexOf(token) + 1 };
  for (const lang of ["ja", "en"] as const) {
    const first = firstError(lines, lang);
    expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang})`).toEqual(want);
    expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
    if (mentions !== undefined) expect(first?.message ?? "", `${name} の誤りの文が ${mentions} を名指さない (${lang})`).toContain(mentions);
    if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
  }
}

describe("枝を消す出来事の原本の JSON (#3632)", () => {
  it("schema-accepts-git-delete-event", () => {
    const validate = api("validateDiagram");
    const checked = validate(deletesTopicJson());
    expect(checked.ok, `枝を消す出来事を持つ枝分かれの図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
  });
});

describe("枝を消す行の記法 (#3632)", () => {
  it("git-delete-roundtrip-keeps-notation", () => {
    const diagram = parsed(DELETES_TOPIC);
    expect(diagram.steps[2]?.events, "段3の delete topic の行が、枝を消す出来事にならない").toEqual([{ type: "delete", branch: "topic" }]);
    const printed = api("printNotation")(diagram);
    expect(printed, "読んで書き戻した記法が最初の記法と違う").toBe(DELETES_TOPIC);
  });

  it("git-delete-rejects-an-unknown-branch", () => {
    const lines = DELETES_TOPIC.trimEnd().split("\n");
    const at = lines.indexOf("  delete topic");
    lines[at] = "  delete zzz";
    expectRefused("宣言していない枝を消す行", lines, at, "zzz", "zzz");
  });

  it("git-delete-rejects-the-head-branch", () => {
    // fix を切った後の HEAD は fix を指すので、fix を消す行は断る
    const lines = DELETES_TOPIC.trimEnd().split("\n");
    const at = lines.indexOf("  delete topic");
    lines[at] = "  delete fix";
    expectRefused("HEAD が指している枝を消す行", lines, at, "fix", "HEAD");
  });

  it("git-delete-rejects-commits-on-a-deleted-branch", () => {
    const lines = [...DELETES_TOPIC.trimEnd().split("\n"), "  commit E on topic"];
    expectRefused("消した枝へ commit を足す行", lines, lines.length - 1, "topic", "topic");
  });

  it("notation-keeps-delete-plain-outside-git", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture"] as const) {
      const text = [`${kind} 消す語の名札`, "box delete as 消す係", "box db", "step 送る", "  say 送る。", "  delete -> db: 消す"].join("\n");
      const read = parse(text);
      expect(read.ok, `${kind} で delete を名札にした箱が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
      const diagram = (read.ok ? read.diagram : {}) as unknown as { blocks?: { box?: { id: string }[] }; steps?: { events: { type: string; from?: string; to?: string }[] }[] };
      expect(diagram.blocks?.box?.map((b) => b.id), `${kind} の箱の名札`).toEqual(["delete", "db"]);
      const line = diagram.steps?.[0]?.events?.[0];
      expect(line && { type: line.type, from: line.from, to: line.to }, `${kind} の delete から db への線`).toEqual({ type: "edge", from: "delete", to: "db" });
    }
  });
});

describe("枝を消した後の絵 (#3632)", () => {
  it("git-delete-hides-the-branch-ref-from-its-step", () => {
    const { layout } = render(deletesTopicJson());
    const topic = layout.refs.find((r) => r.name === "topic");
    expect(topic?.at, "topic の札が段の終わりに指す commit。消した段3からは何も指さない").toEqual([null, "D", null]);
    expect(
      layout.tags.filter((t) => t.ref === "topic").map((t) => t.step),
      "topic の札が留まる段。消す前の段2には在り、消した段3には無い",
    ).toEqual([1]);
    // 消さない枝の札は消した段にも残る
    for (const ref of ["main", "fix"]) expect(layout.tags.some((t) => t.ref === ref && t.step === 2), `消した段3に ${ref} の札が無い`).toBe(true);
  });

  it("git-delete-dims-only-unreachable-commits", () => {
    const { layout, svg } = render(deletesTopicJson());
    const orphans = Object.fromEntries(layout.commits.filter((c) => c.orphan !== undefined).map((c) => [c.id, c.orphan]));
    // D は topic からしか辿れず、C は fix の F から、A は main から辿れる
    expect(orphans, "点線の丸に変わる commit と段 (0 から数える)").toEqual({ D: 2 });
    expect((svg.match(/data-orphan="/gu) ?? []).length, "点線の丸の印 (data-orphan) の数").toBe(1);
  });
});

describe("見本と書き方の文書 (#3632)", () => {
  it("squash-example-deletes-the-feature-branch", () => {
    for (const [file, lang, gone] of [
      ["squash.dragon", "ja", "消した"],
      ["squash.en.dragon", "en", "deleted"],
    ] as const) {
      const text = readFileSync(join(EXAMPLES, file), "utf8");
      const diagram = parsed(text, lang);
      const deletes = diagram.steps.flatMap((step) => step.events.filter((e) => e.type === "delete").map((e) => e.branch));
      expect(deletes, `${file} が delete feature の行で枝を消さない`).toEqual(["feature"]);
      const said = diagram.steps.flatMap((step) => step.events.filter((e) => e.type === "strip" && e.field === "feature" && e.value === gone));
      expect(said, `${file} が帯の feature: ${gone} で枝を消したことを伝える`).toEqual([]);
      expect(text.includes(`feature: ${gone}`), `${file} に帯の feature: ${gone} の字が残る`).toBe(false);
    }
  });

  it("git-delete-docs-describe-the-line", () => {
    // 使い方の頁の枝分かれの図の節は、節の本文と、git の節に置くブロックの段落 (gallery/docs.ts) から組む
    const paragraphs = readdirSync(BLOCKS)
      .map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`))
      .filter((text) => text.includes('section: "git"'));
    expect(paragraphs.length, "使い方の頁の git の節に置くブロックの段落を数えられない").toBeGreaterThan(0);
    expect(paragraphs.some((text) => text.includes("`delete <枝>`")), "使い方の頁の枝分かれの図の日本語の段落に delete <枝> の行が無い").toBe(true);
    expect(paragraphs.some((text) => text.includes("`delete <branch>`")), "使い方の頁の枝分かれの図の英語の段落に delete <branch> の行が無い").toBe(true);

    const readme = repoText("packages/dragon/README.md");
    const git = readme.slice(readme.indexOf("### Git graph"), readme.indexOf("### Time diagram"));
    expect(git.length, "packages/dragon/README.md に枝分かれの図の節が無い").toBeGreaterThan(0);
    expect(git, "packages/dragon/README.md の枝分かれの図の節に delete <branch> の行が無い").toContain("`delete <branch>`");

    // 見本帳の部品の図は、ブロックの置き場の gallery に置いた枝分かれの図の記法
    const figures = readdirSync(BLOCKS).flatMap((name) => {
      const dir = join(BLOCKS, name, "gallery");
      return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".git.dragon") || f.endsWith(".git.en.dragon")).map((f) => join(dir, f)) : [];
    });
    expect(figures.length, "見本帳の枝分かれの図の部品の図を数えられない").toBeGreaterThan(0);
    for (const lang of ["ja", "en"] as const) {
      const deleting = figures
        .filter((f) => f.endsWith(".en.dragon") === (lang === "en"))
        .filter((f) => parsed(readFileSync(f, "utf8"), lang).steps.some((step) => step.events.some((e) => e.type === "delete")));
      expect(deleting.length, `見本帳の部品の図 (${lang}) に delete の行を持つ枝分かれの図が無い`).toBeGreaterThan(0);
    }
  });
});
