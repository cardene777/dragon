// @vitest-environment jsdom
/**
 * 試す図で、待ち行列に入れてよいチップの名前を限り、釦が 2 つ以上の待ち行列から 1 件ずつ集める (#3453)。
 *
 * `queue <名札> [order: <欄>, accept: <名前>]` の `accept` は入れてよいチップの名前で、2 つ以上は `"` で囲んで `,` で並べる。
 * 書いていない名前のチップを送ると断り、どの待ち行列も変えない。頁では送る釦を押せなくし、押せない訳を出す。
 * 最初の欄が選択肢 (`choose`) を持つ時、`accept` の名前はその選択肢のどれか。
 * `press` の `from` に 2 つ以上の待ち行列を `"` で囲んで並べると、押した時に書いた順にそれぞれの上から `take` 件ずつを 1 つの記録かブロックにまとめる。
 * どれかの待ち行列が `take` 件に満たない間は押せない。待ち行列が 1 つの `from` は今どおり 1 つの名札を持つ。
 * 誤りの文を英語でも確かめるので、名札と値は英字にする。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { TryItem, TryPart } from "../src/schema";
import { TryRun } from "../src/try-state";
import { api, type Json, type LineError } from "./diagram-support";
import { askStrip, KANA, mountTry, parsedTry, press, pressButton, releaseTry, sendButton, sessionOf, stepsOf, tryLayout } from "./try-support";

afterEach(releaseTry);

/** 待ち行列 viewA の行。受け入れる 2 つの名前を `"` で囲んで `,` で並べる */
const QUEUE_A = 'queue viewA [order: due, accept: "alice, bob"]';
/** 待ち行列 viewB の行。受け入れる名前が 1 つなら囲まない */
const QUEUE_B = "queue viewB [order: due, accept: carol]";
/** 2 つの待ち行列から 1 件ずつを記録の列 verdicts にまとめる釦の行 */
const GATHER = 'press decide [from: "viewA, viewB", into: verdicts, take: 1]';
/** 1 つの待ち行列から取り出す釦の行。`from` は今どおり 1 つの名札 */
const SINGLE = "press single [from: viewA, into: verdicts, take: 1]";
/** 最初の欄 name の選択肢。dave はどの待ち行列も受け入れない */
const CHOOSE_NAME = "choose name: alice, bob, carol, dave";

/** 部品の行。入力の帯は view で選んだ待ち行列へ送り、記録の列 verdicts は vote が全て yes なら commit、1 つでも違えば reject を出す */
const PARTS = [
  QUEUE_A,
  QUEUE_B,
  "log verdicts [all: vote = yes, yes: commit, no: reject]",
  "ask name, view, vote, due [into: view]",
  CHOOSE_NAME,
  "choose view: viewA, viewB",
  "choose vote: yes, no",
  GATHER,
  SINGLE,
] as const;
/** チップ。viewA の上から a1、a2、viewB の上から b1、b2 に並ぶ。b1 だけが vote に no を持つ */
const ITEMS = [
  "item a1 [view: viewA, vote: yes, due: 3]",
  "item a2 [view: viewA, vote: yes, due: 2]",
  "item b1 [view: viewB, vote: no, due: 4]",
  "item b2 [view: viewB, vote: yes, due: 1]",
] as const;
/** 最初の段。viewA に a1 と a2、viewB に b1 と b2 を並べる */
const FIRST = ["step start", "  say 始める。", "  line viewA: a1, a2", "  line viewB: b1, b2"] as const;
/** viewB を空のまま始める最初の段 */
const FIRST_SHORT = ["step start", "  say 始める。", "  line viewA: a1, a2"] as const;
/** 書き手の例の段。受け入れられる名前を送り、2 つの待ち行列から集める */
const EXAMPLES = ["step send", "  say 送る。", "  ask alice, viewA, yes, 0", "step decide", "  say 集める。", "  press decide"] as const;

/** 部品の行の 1 つを差し替えた並び */
const replaced = (from: string, to: string, base: readonly string[] = PARTS): string[] => base.map((line) => (line === from ? to : line));

/** 集める釦を確かめる部品の行。accept を書かない待ち行列に替え、集める釦だけを確かめる */
const GATHER_PARTS = replaced(QUEUE_B, "queue viewB [order: due]", replaced(QUEUE_A, "queue viewA [order: due]"));

/** 試す図の記法。`parts` で部品の行を、`first` で最初の段を差し替え、`examples` の段を後ろに足す */
function acceptTry(options: { parts?: readonly string[]; first?: readonly string[]; examples?: readonly string[] } = {}): string {
  return ["try accept gather", ...(options.parts ?? PARTS), ...ITEMS, ...(options.first ?? FIRST), ...(options.examples ?? [])].join("\n");
}

/** 集める釦を確かめる試す図の記法。部品の行の既定が accept を持たない */
const gatherTry = (options: { parts?: readonly string[]; first?: readonly string[]; examples?: readonly string[] } = {}): string =>
  acceptTry({ ...options, parts: options.parts ?? GATHER_PARTS });

/** 集める釦を確かめる部品の行の 1 つを差し替えた並び */
const gatherReplaced = (from: string, to: string): string[] => replaced(from, to, GATHER_PARTS);

/** 記録の列の 1 つの記録 */
interface LogRecord {
  number: number;
  items: string[];
  mark?: string;
}

/** 機械の列の 1 つのブロック */
interface ChainBlock {
  number: number;
  items: string[];
}

/** ある段の終わりの、待ち行列と機械の列と記録の列の中身 */
interface GatherState {
  queues: Record<string, string[]>;
  chains: Record<string, ChainBlock[]>;
  logs?: Record<string, LogRecord[]>;
}

/** 最後の段の終わりの状態 */
const finalState = (diagram: unknown): GatherState => {
  const states = tryLayout(diagram).states as unknown as GatherState[];
  return states[states.length - 1] as GatherState;
};

/** 原本の部品 */
interface PartJson {
  type: string;
  id: string;
  accept?: string[];
  from?: string | string[];
}
const partsOf = (diagram: Json): PartJson[] => (diagram as { blocks?: { part?: PartJson[] } }).blocks?.part ?? [];

/** 原本の部品とチップで、段の中の出来事を 1 つずつ当てる状態。宣言したチップだけを持ち、待ち行列は空で始まる */
function runOf(diagram: Json): TryRun {
  const blocks = (diagram as { blocks?: { part?: unknown[]; item?: unknown[] } }).blocks;
  return new TryRun({ parts: (blocks?.part ?? []) as TryPart[], items: (blocks?.item ?? []) as TryItem[] });
}

/** 原本の最後に、出来事 `event` だけを持つ段を足した原本 */
function withStep(diagram: Json, event: Json): Json {
  const steps = (diagram as { steps: Json[] }).steps;
  return { ...(diagram as Record<string, Json>), steps: [...steps, { title: "added", body: "足した段。", events: [event] }] };
}

/** 入力の帯の欄に値を入れる。選ぶ欄 (select) と打つ欄 (input) のどちらにも入れる */
function fill(host: HTMLElement, values: Record<string, string>): void {
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
}

/** 押せない訳の字 */
const reasonOf = (host: HTMLElement): string => host.querySelector('[data-dragon="reason"]')?.textContent ?? "";

/**
 * 記法を読んで、最初の誤りが行 `row` (0 から数える) の `word` の列を名指し、文が `words` を全て含むかを確かめる。英語の文は仮名と漢字を含まない。
 * `last` を立てると、行の中で最後に現れる `word` の列を名指すかを確かめる (2 度書いた名前の 2 つ目)
 */
function expectRefused(name: string, text: string, row: number, word: string, words: readonly string[], last = false): void {
  const raw = text.split("\n")[row] ?? "";
  expect(raw, `${name} の行が記法に無い`).not.toBe("");
  const at = last ? raw.lastIndexOf(word) : raw.indexOf(word);
  expect(at, `${name} の行に ${word} が無い`).toBeGreaterThanOrEqual(0);
  for (const lang of ["ja", "en"] as const) {
    const parsed = api("parseNotation")(text, { lang });
    expect(parsed.ok, `${name} を読めてしまう (${lang})`).toBe(false);
    const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
    expect(first?.line, `${name} の誤りの行 (${lang}): ${first?.message ?? ""}`).toBe(row + 1);
    expect(first?.column, `${name} の誤りが ${word} の列を名指さない (${lang}): ${first?.message ?? ""}`).toBe(at + 1);
    for (const w of words) expect(first?.message ?? "", `${name} の誤りの文が ${w} を名指さない (${lang})`).toContain(w);
    if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
  }
}

const readRepo = (path: string): string => {
  const full = join(process.cwd(), path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

describe("待ち行列に入れてよい名前 accept (#3453)", () => {
  it("interactive-accept-round-trip", () => {
    const diagram = parsedTry(acceptTry({ examples: EXAMPLES }));
    const queues = partsOf(diagram).filter((part) => part.type === "queue");
    expect(queues.find((q) => q.id === "viewA")?.accept, "原本の待ち行列 viewA が受け入れる名前の並び (alice、bob) を持たない").toEqual(["alice", "bob"]);
    expect(queues.find((q) => q.id === "viewB")?.accept, "原本の待ち行列 viewB が受け入れる名前の並び (carol) を持たない").toEqual(["carol"]);
    const checked = api("validateDiagram")(diagram);
    expect(checked.ok, `accept を持つ原本が原本の形の検査を通らない: ${checked.ok ? "" : JSON.stringify(checked.errors)}`).toBe(true);
    const printed = api("printNotation")(diagram);
    for (const line of [QUEUE_A, QUEUE_B]) expect(printed.split("\n"), `書き戻した記法に ${line} の行が元の記法のまま無い\n${printed}`).toContain(line);
    const again = api("parseNotation")(printed);
    expect(again.ok, `書き戻した記法が読めない: ${again.ok ? "" : JSON.stringify(again.errors)}\n${printed}`).toBe(true);
    expect(again.ok ? again.diagram : undefined, `往復した JSON が最初と違う\n${printed}`).toEqual(diagram);
  });

  it("interactive-accept-refuses-other-names", () => {
    const diagram = parsedTry(acceptTry());
    // 出来事を当てる状態は、受け入れない名前のチップを送ると受け入れない訳を返し、どの待ち行列も変えない
    const run = runOf(diagram);
    const before = run.state().queues;
    const refused = run.ask(["dave", "viewA", "yes", "5"]);
    expect(refused.fault, "viewA に dave を送っても受け入れない訳が返らない").toEqual({ kind: "refused", part: "viewA", item: "dave" });
    expect(refused.chip, "受け入れない名前のチップが作られる").toBeUndefined();
    expect(run.state().queues, "受け入れない名前のチップを送ると待ち行列が変わる").toEqual(before);
    // carol は viewB だけが受け入れる
    expect(run.ask(["carol", "viewA", "yes", "5"]).fault, "viewA に carol を送っても受け入れない訳が返らない").toEqual({ kind: "refused", part: "viewA", item: "carol" });
    expect(run.state().queues, "viewA に carol を送ると待ち行列が変わる").toEqual(before);
    const alice = run.ask(["alice", "viewA", "yes", "5"]);
    expect(alice.fault, "viewA が受け入れる alice を送ると断られる").toBeUndefined();
    expect(run.state().queues.viewA ?? [], "viewA が受け入れる alice が viewA に入らない").toContain(alice.chip);
    const carol = run.ask(["carol", "viewB", "no", "1"]);
    expect(carol.fault, "viewB が受け入れる carol を送ると断られる").toBeUndefined();
    expect(run.state().queues.viewB ?? [], "viewB が受け入れる carol が viewB に入らない").toContain(carol.chip);

    // 原本の段に受け入れない名前の ask を書いても、描く時の状態は変わらない
    const start = finalState(diagram);
    expect(finalState(withStep(diagram, { type: "ask", values: ["dave", "viewA", "yes", "5"] })).queues, "受け入れない名前の ask の段で待ち行列が変わる").toEqual(start.queues);

    // 頁で受け入れない名前を選んで送っても段は増えず、受け入れる名前は今どおり入る
    const { host, player } = mountTry(diagram);
    const steps = stepsOf(player);
    fill(host, { name: "dave", view: "viewA", vote: "yes", due: "5" });
    sendButton(host)?.click();
    expect(stepsOf(player), "受け入れない名前を送ると段が増える").toBe(steps);
    expect(finalState(sessionOf(player)).queues, "受け入れない名前を送ると待ち行列が変わる").toEqual(start.queues);
    fill(host, { name: "alice" });
    sendButton(host)?.click();
    expect(stepsOf(player), "受け入れる名前を送っても段が増えない").toBe(steps + 1);
    const after = finalState(sessionOf(player)).queues;
    expect(after.viewA ?? [], "受け入れる名前 alice を送っても viewA に入らない").toContain("alice");
    expect(after.viewB, "viewA へ送ると viewB が変わる").toEqual(start.queues.viewB);
  });

  it("interactive-accept-refuses-bad-names", () => {
    const parse = api("parseNotation");
    const good = parse(acceptTry({ examples: EXAMPLES }));
    expect(good.ok, `正しい記法が読めない: ${good.ok ? "" : JSON.stringify(good.errors)}`).toBe(true);
    // 最初の欄が選択肢を持つ時、accept の名前はその選択肢のどれか
    const notChoice = acceptTry({ parts: replaced(QUEUE_A, 'queue viewA [order: due, accept: "alice, eve"]') });
    expectRefused("最初の欄の選択肢に無い accept の名前", notChoice, 1, "eve", ["eve", "name"]);
    // accept に同じ名前を 2 度書かない
    const twice = acceptTry({ parts: replaced(QUEUE_A, 'queue viewA [order: due, accept: "alice, bob, alice"]') });
    expectRefused("accept に 2 度書いた名前", twice, 1, "alice", ["alice"], true);
    // 書き手の例の ask が受け入れられない名前を送る
    const lines = acceptTry({ examples: ["step send", "  say 送る。", "  ask dave, viewA, yes, 0"] }).split("\n");
    expectRefused("受け入れない名前を送る書き手の例", lines.join("\n"), lines.length - 1, "dave", ["dave", "viewA"]);
  });

  it("interactive-accept-explains-refusal", () => {
    const words = { ja: "受け入れない", en: "does not accept" } as const;
    for (const lang of ["ja", "en"] as const) {
      const { host } = mountTry(parsedTry(acceptTry()), 720, { lang });
      expect(sendButton(host)?.disabled, `受け入れる名前 alice を選んだ帯の送る釦が押せない (${lang})`).toBe(false);
      fill(host, { name: "dave", view: "viewA" });
      expect(sendButton(host)?.disabled, `viewA が受け入れない dave を選んでも送る釦が押せる (${lang})`).toBe(true);
      const refused = reasonOf(host);
      for (const word of ["viewA", "dave", words[lang]]) expect(refused, `送れない訳が ${word} を名指さない (${lang}): ${refused}`).toContain(word);
      if (lang === "en") expect(KANA.test(refused), `英語の送れない訳に仮名か漢字がある: ${refused}`).toBe(false);
      fill(host, { name: "alice" });
      expect(sendButton(host)?.disabled, `受け入れる名前に選び直しても送る釦が押せない (${lang})`).toBe(false);
      expect(reasonOf(host), `受け入れる名前に選び直しても送れない訳が残る (${lang})`).not.toContain("dave");
      fill(host, { view: "viewB" });
      expect(sendButton(host)?.disabled, `viewB が受け入れない alice を選んでも送る釦が押せる (${lang})`).toBe(true);
      for (const word of ["viewB", "alice"]) expect(reasonOf(host), `送る先を選び直した時の送れない訳が ${word} を名指さない (${lang})`).toContain(word);
      releaseTry();
    }
  });
});

describe("2 つ以上の待ち行列から集める釦 (#3453)", () => {
  it("interactive-gather-round-trip", () => {
    const diagram = parsedTry(gatherTry({ examples: EXAMPLES }));
    const presses = partsOf(diagram).filter((part) => part.type === "press");
    expect(presses.find((p) => p.id === "decide")?.from, "原本の釦 decide の from が待ち行列の配列 (viewA、viewB) にならない").toEqual(["viewA", "viewB"]);
    expect(presses.find((p) => p.id === "single")?.from, "待ち行列が 1 つの釦 single の from が今どおりの字でない").toBe("viewA");
    const checked = api("validateDiagram")(diagram);
    expect(checked.ok, `from に配列を持つ原本が原本の形の検査を通らない: ${checked.ok ? "" : JSON.stringify(checked.errors)}`).toBe(true);
    const printed = api("printNotation")(diagram);
    for (const line of [GATHER, SINGLE]) expect(printed.split("\n"), `書き戻した記法に ${line} の行が元の記法のまま無い\n${printed}`).toContain(line);
    const again = api("parseNotation")(printed);
    expect(again.ok, `書き戻した記法が読めない: ${again.ok ? "" : JSON.stringify(again.errors)}\n${printed}`).toBe(true);
    expect(again.ok ? again.diagram : undefined, `往復した JSON が最初と違う\n${printed}`).toEqual(diagram);
    // from に並べる名前は待ち行列で、同じ待ち行列を 2 度書かない
    expectRefused("from に 2 度書いた待ち行列", gatherTry({ parts: gatherReplaced(GATHER, 'press decide [from: "viewA, viewB, viewA", into: verdicts, take: 1]') }), 8, "viewA", ["viewA"], true);
    expectRefused("from に書いた待ち行列でない部品", gatherTry({ parts: gatherReplaced(GATHER, 'press decide [from: "viewA, verdicts", into: verdicts, take: 1]') }), 8, "verdicts", ["verdicts"]);
  });

  it("interactive-gather-takes-from-each", () => {
    const { host, player } = mountTry(parsedTry(gatherTry()));
    press(host, "decide");
    const first = finalState(sessionOf(player));
    expect(first.queues.viewA, "viewA の上の a1 が外れない").toEqual(["a2"]);
    expect(first.queues.viewB, "viewB の上の b1 が外れない").toEqual(["b2"]);
    expect((first.logs?.verdicts ?? []).map((r) => r.items), "viewA と viewB の上から 1 件ずつが 1 つの記録にまとまらない").toEqual([["a1", "b1"]]);
    expect(first.logs?.verdicts?.[0]?.mark, "vote に no を含む b1 をまとめた記録の印が reject でない").toBe("reject");
    press(host, "decide");
    const second = finalState(sessionOf(player));
    expect([second.queues.viewA, second.queues.viewB], "2 度押した後も待ち行列にチップが残る").toEqual([[], []]);
    expect((second.logs?.verdicts ?? []).map((r) => r.items), "2 度押した記録").toEqual([["a1", "b1"], ["a2", "b2"]]);
    expect(second.logs?.verdicts?.[1]?.mark, "vote が全て yes の記録の印が commit でない").toBe("commit");

    // 機械の列へ集める釦は、書いた順にそれぞれの上から take 件ずつを 1 つのブロックにまとめる
    const chained = gatherTry({ parts: [...gatherReplaced(GATHER, 'press decide [from: "viewB, viewA", into: blocks, take: 2]'), "chain blocks"] });
    const placed = mountTry(parsedTry(chained));
    press(placed.host, "decide");
    const built = finalState(sessionOf(placed.player));
    expect((built.chains.blocks ?? []).map((b) => b.items), "viewB、viewA の順にそれぞれの上から 2 件ずつが 1 つのブロックにまとまらない").toEqual([["b1", "b2", "a1", "a2"]]);
    expect([built.queues.viewA, built.queues.viewB], "ブロックにまとめた後も待ち行列にチップが残る").toEqual([[], []]);
  });

  it("interactive-gather-waits-for-every-queue", () => {
    const short = parsedTry(gatherTry({ first: FIRST_SHORT }));
    // 頁では、viewB が空の間は集める釦を押せず、viewB を名指した訳を出す。1 つの待ち行列から取り出す釦は今どおり押せる
    const { host, player } = mountTry(short);
    const button = pressButton(host, "decide");
    expect(button?.disabled, "viewB が空なのに集める釦が押せる").toBe(true);
    expect(reasonOf(host), "集める釦を押せない訳が viewB を名指さない").toContain("viewB");
    expect(pressButton(host, "single")?.disabled, "viewA にチップがあるのに 1 つの待ち行列から取り出す釦が押せない").toBe(false);
    const steps = stepsOf(player);
    const start = finalState(sessionOf(player));
    button?.click();
    expect(stepsOf(player), "押せない集める釦を押すと段が増える").toBe(steps);
    expect(finalState(sessionOf(player)), "押せない集める釦を押すと待ち行列か記録が変わる").toEqual(start);

    // 出来事を当てる状態は、足りない待ち行列を名指した訳を返し、どの待ち行列も記録も変えない
    const run = runOf(short);
    run.line("viewA", ["a1", "a2"]);
    const before = run.state();
    expect(run.press("decide").fault, "viewB が空の時に集める釦が viewB を名指した訳を返さない").toMatchObject({ kind: "empty", part: "viewB" });
    expect(run.state(), "集める釦を断った後に状態が変わる").toEqual(before);
    const pair = runOf(parsedTry(gatherTry({ parts: gatherReplaced(GATHER, 'press decide [from: "viewA, viewB", into: verdicts, take: 2]'), first: FIRST_SHORT })));
    pair.line("viewA", ["a1", "a2"]);
    pair.line("viewB", ["b1"]);
    const held = pair.state();
    expect(pair.press("decide").fault, "viewB が take の 2 件に満たない時に viewB を名指した訳を返さない").toMatchObject({ kind: "empty", part: "viewB" });
    expect(pair.state(), "take 件に満たない待ち行列から集める釦を断った後に状態が変わる").toEqual(held);

    // 書き手の例の段で押すと、足りない待ち行列を名指した読む時の誤りで止まる
    const lines = gatherTry({ first: FIRST_SHORT, examples: ["step decide", "  say 集める。", "  press decide"] }).split("\n");
    for (const lang of ["ja", "en"] as const) {
      const parsed = api("parseNotation")(lines.join("\n"), { lang });
      expect(parsed.ok, `viewB が空なのに集める釦を押す書き手の例を読めてしまう (${lang})`).toBe(false);
      const error: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
      expect(error?.line, `集める釦を押せない誤りの行 (${lang}): ${error?.message ?? ""}`).toBe(lines.length);
      expect(error?.message ?? "", `集める釦を押せない誤りが viewB を名指さない (${lang})`).toContain("viewB");
      if (lang === "en") expect(KANA.test(error?.message ?? ""), `英語の誤りの文に仮名か漢字がある: ${error?.message}`).toBe(false);
    }
  });
});

describe("書き方の文書 (#3453)", () => {
  it("docs-describe-try-accept-gather", () => {
    /** 見出し `heading` から次の同じ深さの見出しまで */
    const sectionOf = (text: string, heading: string): string => {
      const start = text.indexOf(heading);
      if (start < 0) return "";
      const next = text.indexOf("\n### ", start + heading.length);
      return text.slice(start, next < 0 ? undefined : next);
    };
    for (const [path, heading, accept, gather] of [
      ["packages/dragon/README.ja.md", "### 試す図", "accept: <名前>", 'from: "<待ち行列>, <待ち行列>"'],
      ["packages/dragon/README.md", "### Try diagram", "accept: <name>", 'from: "<queue>, <queue>"'],
    ] as const) {
      const section = sectionOf(readRepo(path), heading);
      expect(section, `${path} に試す図の小節 (${heading}) が無い`).not.toBe("");
      expect(section, `${path} の試す図の小節に accept の書き方が無い`).toContain(accept);
      expect(section, `${path} の試す図の小節に from に 2 つ以上の待ち行列を書く書き方が無い`).toContain(gather);
    }
    // 使い方の頁の文は JS の字の中に書くので、`"` の前に `\` が付いていてもよい
    const docs = readRepo("apps/playground-spa/src/docs/content.ts");
    for (const words of ["accept: <名前>", "accept: <name>"]) expect(docs, `使い方の頁に ${words} が無い`).toContain(words);
    for (const [queue, form] of [["待ち行列", /from: \\?"<待ち行列>, <待ち行列>\\?"/u], ["queue", /from: \\?"<queue>, <queue>\\?"/u]] as const)
      expect(docs, `使い方の頁に from: "<${queue}>, <${queue}>" が無い`).toMatch(form);
  });
});
