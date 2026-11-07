// @vitest-environment jsdom
/**
 * 試す図で、選んだ値で行き先の待ち行列を変え、鎖でない記録へまとめる (#3441)。
 *
 * `ask` の `into` に欄の名前を書くと、送ったチップはその欄の値と同じ名札の待ち行列へ入る。
 * その欄は選択肢 (`choose`) を持ち、選択肢の値ごとに同じ名札の待ち行列が要る。
 * `log <名札> [all: <欄> = <値>, yes: <印>, no: <印>]` は記録の列で、`press` の `into` に書くと待ち行列の上から `take` 件を 1 つの記録にまとめる。
 * 記録は番号と中のチップだけを持ち、機械の列 (`chain`) と違って `prev` と `hash` を持たない。
 * 記録の中のチップの `all` の欄が全てその値なら `yes` の印を、1 つでも違えば `no` の印を記録に出す。
 * 誤りの文を英語でも確かめるので、名札と値は英字にする。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { draw } from "./render-support";
import { askStrip, KANA, mountTry, parsedTry, press, releaseTry, sendButton, sessionOf, tryLayout } from "./try-support";

afterEach(releaseTry);

/** 入力の帯の行。最初の欄 name がチップの名前で、group の値で行き先の待ち行列を選ぶ */
const ASK = "ask name, group, vote, due [into: group, via: net]";
/** 記録の列の行。vote が全て yes なら commit、1 つでも違えば reject */
const LOG = "log verdicts [all: vote = yes, yes: commit, no: reject]";
/** 選択肢の行。group の値ごとに同じ名札の待ち行列 g1、g2 を置く */
const CHOOSE_GROUP = "choose group: g1, g2";

/** 部品の行。網 net が送り、待ち行列 g1 と g2 が group ごとに並べ、記録の列 verdicts が集める */
const PARTS = [
  "route net: node - seq - med [from: node, to: med]",
  "queue g1 [order: due]",
  "queue g2 [order: due]",
  LOG,
  ASK,
  CHOOSE_GROUP,
  "choose vote: yes, no",
  "press decide1 [from: g1, into: verdicts, take: 2]",
  "press decide2 [from: g2, into: verdicts, take: 2]",
] as const;
/** チップ。a と b は g1 で yes、c は g2 で no、d は g2 で yes */
const ITEMS = [
  "item a [group: g1, vote: yes, due: 3]",
  "item b [group: g1, vote: yes, due: 2]",
  "item c [group: g2, vote: no, due: 4]",
  "item d [group: g2, vote: yes, due: 1]",
] as const;
/** 最初の段。g1 に a と b、g2 に c と d を並べる */
const FIRST = ["step start", "  say 始める。", "  line g1: a, b", "  line g2: c, d"] as const;
/** 書き手の例の段。送る、g1 を決める、g2 を決める。送る me は期限 0 で g2 の一番下に並び、g2 を決めても残る */
const EXAMPLES = [
  "step send",
  "  say 送る。",
  "  ask me, g2, yes, 0",
  "step decide1",
  "  say g1 を決める。",
  "  press decide1",
  "step decide2",
  "  say g2 を決める。",
  "  press decide2",
] as const;

/** 試す図の記法。`parts` で部品の行を差し替え、`examples` を付けると書き手の例の段を足す */
function groupTry(options: { parts?: readonly string[]; examples?: boolean } = {}): string {
  return ["try group log", ...(options.parts ?? PARTS), ...ITEMS, ...FIRST, ...(options.examples ? EXAMPLES : [])].join("\n");
}

/** 記録の列の 1 つの記録 */
interface LogRecord {
  /** 1 から数える記録の番号 */
  number: number;
  /** 中のチップ (まとめた順) */
  items: string[];
  /** `all` の条件で決まった印。`all` を書かない記録の列は持たない */
  mark?: string;
}

/** ある段の終わりの、待ち行列と記録の列の中身 */
interface GroupState {
  queues: Record<string, string[]>;
  logs?: Record<string, LogRecord[]>;
}

/** 最後の段の終わりの状態 */
const finalState = (diagram: unknown): GroupState => {
  const states = tryLayout(diagram).states as unknown as GroupState[];
  return states[states.length - 1] as GroupState;
};

/** 原本の部品 */
const partsOf = (diagram: Json): { type: string; id: string; into?: string }[] =>
  (diagram as { blocks?: { part?: { type: string; id: string; into?: string }[] } }).blocks?.part ?? [];

/** 入力の帯の欄に値を入れて送る。選ぶ欄 (select) と打つ欄 (input) のどちらにも入れる */
function sendValues(host: HTMLElement, values: Record<string, string>): void {
  const strip = askStrip(host);
  expect(strip, "入力の帯 (form[data-dragon=ask]) が無い").not.toBeNull();
  for (const [field, value] of Object.entries(values)) {
    const control = strip?.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-field="${field}"]`);
    expect(control, `入力の帯に ${field} の欄が無い`).toBeTruthy();
    if (!control) continue;
    control.value = value;
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }
  const button = sendButton(host);
  expect(button, "入力の帯に送る釦が無い").not.toBeNull();
  button?.click();
}

const readRepo = (path: string): string => {
  const full = join(process.cwd(), path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

describe("into に欄を書いて行き先の待ち行列を選ぶ (#3441)", () => {
  it("interactive-into-field-round-trip", () => {
    const diagram = parsedTry(groupTry({ examples: true }));
    const ask = partsOf(diagram).find((part) => part.type === "ask");
    expect(ask?.into, "原本の入力の帯の into が欄の名前 group にならない").toBe("group");
    const checked = api("validateDiagram")(diagram);
    expect(checked.ok, `into に欄を書いた原本が原本の形の検査を通らない: ${checked.ok ? "" : JSON.stringify(checked.errors)}`).toBe(true);
    const printed = api("printNotation")(diagram);
    expect(printed.split("\n"), `書き戻した記法に入力の帯の行が元の記法のまま無い\n${printed}`).toContain(ASK);
    const again = api("parseNotation")(printed);
    expect(again.ok, `書き戻した記法が読めない: ${again.ok ? "" : JSON.stringify(again.errors)}\n${printed}`).toBe(true);
    expect(again.ok ? again.diagram : undefined, `往復した JSON が最初と違う\n${printed}`).toEqual(diagram);
  });

  it("interactive-into-field-routes-by-value", () => {
    const { host, player } = mountTry(parsedTry(groupTry()));
    const before = finalState(sessionOf(player));
    sendValues(host, { name: "me", group: "g2", vote: "yes", due: "5" });
    const after = finalState(sessionOf(player));
    expect(after.queues.g2 ?? [], "group に g2 を選んで送ったチップが待ち行列 g2 に入らない").toContain("me");
    expect(after.queues.g1 ?? [], "group に g2 を選んで送ったチップが待ち行列 g1 に入る").not.toContain("me");
    expect(after.queues.g1, "group に g2 を選んで送ると待ち行列 g1 が変わる").toEqual(before.queues.g1);
  });

  it("interactive-into-field-refuses-missing-queue", () => {
    const parse = api("parseNotation");
    const good = parse(groupTry());
    expect(good.ok, `正しい記法が読めない: ${good.ok ? "" : JSON.stringify(good.errors)}`).toBe(true);
    const cases: [string, string[], string, string][] = [
      [
        "同じ名札の待ち行列が無い選択肢",
        groupTry({ parts: PARTS.map((line) => (line === CHOOSE_GROUP ? "choose group: g1, g2, g9" : line)) }).split("\n"),
        "choose group: g1, g2, g9",
        "g9",
      ],
      [
        "選択肢を持たない欄を書いた into",
        groupTry({ parts: PARTS.filter((line) => line !== CHOOSE_GROUP) }).split("\n"),
        ASK,
        "group",
      ],
    ];
    for (const [name, lines, marker, word] of cases) {
      const row = lines.findIndex((line) => line === marker);
      expect(row, `${name} の行が記法に無い`).toBeGreaterThanOrEqual(0);
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        expect(parsed.ok, `${name} を読めてしまう (${lang})`).toBe(false);
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first?.line, `${name} の誤りの行 (${lang}): ${first?.message ?? ""}`).toBe(row + 1);
        expect(first?.column ?? 0, `${name} の誤りが列を名指さない (${lang})`).toBeGreaterThanOrEqual(1);
        expect(first?.message ?? "", `${name} の誤りの文が ${word} を名指さない (${lang})`).toContain(word);
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });
});

describe("鎖でない記録の列 log (#3441)", () => {
  it("interactive-log-round-trip", () => {
    const diagram = parsedTry(groupTry({ examples: true }));
    const log = partsOf(diagram).find((part) => part.type === "log");
    expect(log?.id, "原本の部品が記録の列 log (verdicts) を持たない").toBe("verdicts");
    const checked = api("validateDiagram")(diagram);
    expect(checked.ok, `log を持つ原本が原本の形の検査を通らない: ${checked.ok ? "" : JSON.stringify(checked.errors)}`).toBe(true);
    const printed = api("printNotation")(diagram);
    expect(printed.split("\n"), `書き戻した記法に log の行が元の記法のまま無い\n${printed}`).toContain(LOG);
    const again = api("parseNotation")(printed);
    expect(again.ok, `書き戻した記法が読めない: ${again.ok ? "" : JSON.stringify(again.errors)}\n${printed}`).toBe(true);
    expect(again.ok ? again.diagram : undefined, `往復した JSON が最初と違う\n${printed}`).toEqual(diagram);
  });

  it("interactive-log-press-groups-chips", () => {
    const { host, player } = mountTry(parsedTry(groupTry()));
    press(host, "decide1");
    const state = finalState(sessionOf(player));
    expect(state.queues.g1 ?? ["(無い)"], "決める釦を押した後も待ち行列 g1 にチップが残る").toEqual([]);
    const records = state.logs?.verdicts ?? [];
    expect(records, "決める釦を押しても記録の列 verdicts に記録が 1 つできない").toHaveLength(1);
    expect(records[0]?.number, "最初の記録の番号").toBe(1);
    expect(records[0]?.items, "待ち行列 g1 の上から 2 件 (a、b) が 1 つの記録にまとまらない").toEqual(["a", "b"]);
    expect(Object.keys(records[0] ?? {}), "記録が prev を持つ").not.toContain("prev");
    expect(Object.keys(records[0] ?? {}), "記録が hash を持つ").not.toContain("hash");
  });

  it("interactive-log-shows-verdict", () => {
    const { host, player } = mountTry(parsedTry(groupTry()));
    press(host, "decide1");
    press(host, "decide2");
    const records = finalState(sessionOf(player)).logs?.verdicts ?? [];
    expect(records.map((record) => record.items), "2 つの釦で記録が 2 つできない").toEqual([["a", "b"], ["c", "d"]]);
    expect(records[0]?.mark, "vote が全て yes の記録の印が yes の印 (commit) でない").toBe("commit");
    expect(records[1]?.mark, "vote に no を含む記録の印が no の印 (reject) でない").toBe("reject");
  });

  it("interactive-log-draws-without-hash", () => {
    const rendered = draw("renderDiagram")(parsedTry(groupTry({ examples: true })), { lang: "ja", still: true });
    const holder = document.createElement("div");
    holder.innerHTML = rendered.svg;
    const log = holder.querySelector('[data-log="verdicts"]');
    expect(log, "描いた図に記録の列 verdicts (data-log) が無い").not.toBeNull();
    const first = log?.querySelector('[data-record="1"]');
    const second = log?.querySelector('[data-record="2"]');
    expect(first && second, "描いた記録の列に記録 1 と 2 (data-record) が無い").toBeTruthy();
    const textOf = (el: Element | null | undefined): string => el?.textContent ?? "";
    for (const word of ["1", "a", "b", "yes", "commit"]) expect(textOf(first), `記録 1 に ${word} の字が無い`).toContain(word);
    for (const word of ["2", "c", "d", "no", "reject"]) expect(textOf(second), `記録 2 に ${word} の字が無い`).toContain(word);
    for (const word of ["prev", "hash", "SHA-256"]) expect(textOf(log), `記録の列に ${word} の字がある`).not.toContain(word);
  });
});

describe("書き方の文書 (#3441)", () => {
  it("docs-describe-try-log", () => {
    /** 見出し `heading` から次の同じ深さの見出しまで */
    const sectionOf = (text: string, heading: string): string => {
      const start = text.indexOf(heading);
      if (start < 0) return "";
      const next = text.indexOf("\n### ", start + heading.length);
      return text.slice(start, next < 0 ? undefined : next);
    };
    for (const [path, heading, intoField] of [
      ["packages/dragon/README.ja.md", "### 試す図", "`into` に欄"],
      ["packages/dragon/README.md", "### Try diagram", "`into` names a field"],
    ] as const) {
      const section = sectionOf(readRepo(path), heading);
      expect(section, `${path} に試す図の小節 (${heading}) が無い`).not.toBe("");
      expect(section, `${path} の試す図の小節に log の行の書き方が無い`).toContain("log <");
      expect(section, `${path} の試す図の小節に log の all の書き方が無い`).toContain("all:");
      expect(section, `${path} の試す図の小節に into に欄を書く書き方が無い`).toContain(intoField);
    }
    const docs = readRepo("apps/playground-spa/src/docs/content.ts");
    for (const words of ["log <", "all:", "`into` に欄", "`into` names a field"]) expect(docs, `使い方の頁に ${words} が無い`).toContain(words);
  });
});
