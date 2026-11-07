// @vitest-environment jsdom
/**
 * 試す図で、網の節に関門を置き、送ったチップの欄の値を確かめてその節で止める (#3476)。
 *
 * 配管の図の `check` の行を、試す図では最初の `step` より前でも読む。
 * `check <網の節>: <欄> <比べ方> <値> [no: <エラーの名前>, retry, into: <記録の列>]` の行で、その節を通る条件を書く。
 * 比べ方は配管の図と同じ `>=`、`<=`、`>`、`<`、`==`、`!=` で、条件は通るために成り立つべきこと。
 * 関門の値が数なら、チップの欄の値も数として比べ (`85134 <= 27000` は合わず `12000 <= 27000` は合う)、数でない欄の値は合わない。
 * 関門の値が数でない時は `==` と `!=` で字として比べ、`>=`、`<=`、`>`、`<` を使う行は読む時の誤りにする。
 * 入力の帯 (`ask ... [into: <待ち行列>, via: <網>]`) が送ったチップは、網の `from` から最短の道を辿り、着いた節の関門を書いた順に確かめる。
 * 最初に合わない関門で止まり、どの待ち行列にも入らない。網の道はその節で切れ、関門の `into` の記録の列に記録が 1 件増える。
 * どの関門にも合うチップは今どおり `into` の待ち行列へ入り、記録の列は変わらない。段の中の書き手の例の `ask` も同じ関門を通る。
 *
 * この検査が決める原本の形。
 * - 関門は原本の `blocks.check` に、書いた順の配列で持つ。1 つの関門は
 *   `{ node, field, op, value, no, retry?: true, into }` で、`value` は書いたままの字、`retry` は書いた時だけ `true` を持つ。
 * - 書き戻す時は、関門の行を部品の行の塊の次の塊 (チップの行の前) に、書いた順のまま書く。
 * - 関門で止まった記録 (`layout.states[].logs[<into>][]`) は、今の記録の欄 (`number`、`items`、`shown`) に加えて、
 *   止まった節 `node`、エラーの名前 `error`、再試行できるか `retry` (`true` か `false`) を持つ。`items` は止まったチップ 1 つ。
 * - 止まったチップの網の道 (`trips[].path`) は、`from` から止まった節までで切れる。
 * - 頁の図 (SVG) では、止まった節に `[data-route="<網>"] [data-stop="<節>"]` の印を描き、記録 (`[data-log] [data-record]`) の字に
 *   止まった節とエラーの名前と、`retry` の関門なら「再試行できる」(英語は `retryable`)、書かない関門なら「直して送り直す」(英語は `fix and resend`) の印を出す。
 *
 * 誤りの文を英語でも確かめるので、名札と値は英字にする。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { askStrip, figureOf, KANA, mountTry, parsedTry, releaseTry, sendButton, sessionOf, stepsOf, tryLayout } from "./try-support";

afterEach(releaseTry);

/** 網の行。最短の道は you - pn - seq - med。alt、far、deep は網の節だが最短の道に無い */
const ROUTE = "route net: you - pn - seq - med, you - alt - far - deep - med [from: you, to: med]";
/** 部品の行。入力の帯は待ち行列 pool へ網 net を通って送る。記録の列 rejects は関門の記録、verdicts は all を持つ */
const PARTS = [
  ROUTE,
  "queue pool",
  "log rejects",
  "log verdicts [all: sig = ok, yes: commit, no: reject]",
  "ask name, sig, size, load [into: pool, via: net]",
  "choose sig: ok, bad",
  "press decide [from: pool, into: verdicts, take: 1]",
] as const;

/** seq の関門 1 つ目。size が 27000 以下なら通る。retry を書かない */
const SEQ_SIZE = "check seq: size <= 27000 [no: TOO_LARGE, into: rejects]";
/** seq の関門 2 つ目。load が 80 より小さければ通る。retry を書く */
const SEQ_LOAD = "check seq: load < 80 [no: OVERLOADED, retry, into: rejects]";
/** pn の関門。sig が ok なら通る。数でない値を字として比べる */
const PN_SIG = "check pn: sig == ok [no: BAD_SIGNATURE, into: rejects]";
/** 関門の行。網の道で後に着く seq の関門を、先に着く pn の関門より前に書く */
const GATES = [SEQ_SIZE, SEQ_LOAD, PN_SIG] as const;

/** チップ。どちらも全ての関門に合う */
const ITEMS = ["item t1 [sig: ok, size: 12000, load: 10]", "item t2 [sig: ok, size: 9000, load: 20]"] as const;
/** 最初の段。待ち行列 pool に t1 と t2 を並べる */
const FIRST = ["step start", "  say 始める。", "  line pool: t1, t2"] as const;

/** 試す図の記法。部品、関門、チップ、段の塊を空の行で区切って並べる (書き戻した記法と同じ形)。`examples` の段を後ろに足す */
function gateTry(options: { parts?: readonly string[]; gates?: readonly string[]; examples?: readonly (readonly string[])[] } = {}): string {
  const gates = options.gates ?? GATES;
  const blocks = [
    "try gate",
    (options.parts ?? PARTS).join("\n"),
    ...(gates.length > 0 ? [gates.join("\n")] : []),
    ITEMS.join("\n"),
    FIRST.join("\n"),
    ...(options.examples ?? []).map((step) => step.join("\n")),
  ];
  return `${blocks.join("\n\n")}\n`;
}

/** 関門の行の 1 つを差し替えた並び */
const gatesReplaced = (from: string, to: string): string[] => GATES.map((line) => (line === from ? to : line));

/** 記録の列の 1 つの記録。関門で止まった記録は止まった節とエラーの名前と再試行できるかを持つ */
interface GateRecord {
  number: number;
  items: string[];
  mark?: string;
  node?: string;
  error?: string;
  retry?: boolean;
}

/** 網を運ばれたチップと通った節 */
interface GateTrip {
  route: string;
  item: string;
  path: string[];
}

/** ある段の終わりの状態 */
interface GateState {
  queues: Record<string, string[]>;
  logs?: Record<string, GateRecord[]>;
  items: Record<string, string[]>;
  trips: GateTrip[];
}

/** 段ごとの状態 */
const statesOf = (diagram: unknown) => tryLayout(diagram).states as unknown as GateState[];

/** 最後の段の終わりの状態 */
const finalState = (diagram: unknown): GateState => {
  const states = statesOf(diagram);
  return states[states.length - 1] as GateState;
};

/** 状態の中の、チップ `item` が網を運ばれた道 */
const tripOf = (state: GateState, item: string): string[] | undefined => state.trips.find((trip) => trip.item === item)?.path;

/** どの待ち行列にもチップ `item` が無いか */
const inNoQueue = (state: GateState, item: string): boolean => Object.values(state.queues).every((queue) => !queue.includes(item));

/** 原本の最後に、出来事 `event` だけを持つ段を足した原本 */
function withStep(diagram: Json, event: Json): Json {
  const steps = (diagram as { steps: Json[] }).steps;
  return { ...(diagram as Record<string, Json>), steps: [...steps, { title: "added", body: "足した段。", events: [event] }] };
}

/** 関門の行 `gates` を持つ図へ、入力の帯の欄の順の値 `values` を送る段を足した、最後の段の終わりの状態 */
const sentThrough = (gates: readonly string[], values: readonly string[]): GateState =>
  finalState(withStep(parsedTry(gateTry({ gates })), { type: "ask", values: [...values] }));

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

/** 入力の帯に値を入れて送る。関門で止まる値でも送る釦は押せる */
function sendValues(host: HTMLElement, values: Record<string, string>, label: string): void {
  fill(host, values);
  const button = sendButton(host);
  expect(button, "入力の帯に送る釦が無い").not.toBeNull();
  expect(button?.disabled, `${label} を送る釦が押せない (関門で止まる値も送れる)`).toBe(false);
  button?.click();
}

/**
 * 記法を読んで、最初の誤りが行 `line` の `word` の列を名指し、文が `words` を全て含むかを確かめる。英語の文は仮名と漢字を含まない
 */
function expectRefused(name: string, text: string, line: string, word: string, words: readonly string[]): void {
  const row = text.split("\n").indexOf(line);
  expect(row, `${name} の行が記法に無い`).toBeGreaterThanOrEqual(0);
  const at = line.indexOf(word);
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

/** 再試行できるかの印。`retry` を書いた関門と書かない関門 */
const MARKS = {
  ja: { retry: "再試行できる", fix: "直して送り直す" },
  en: { retry: "retryable", fix: "fix and resend" },
} as const;

/** 描いた図の記録の列 `log` の `n` 番の記録の字 */
const recordText = (host: HTMLElement, log: string, n: number): string =>
  figureOf(host)?.querySelector(`[data-log="${log}"] [data-record="${n}"]`)?.textContent ?? "";

const readRepo = (path: string): string => {
  const full = join(process.cwd(), path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

describe("網の節の関門 check (#3476)", () => {
  it("interactive-gate-round-trip", () => {
    const text = gateTry({ examples: [["step send", "  say 送る。", "  ask me, ok, 85134, 10"]] });
    const diagram = parsedTry(text);
    const gates = (diagram as { blocks?: { check?: Json } }).blocks?.check;
    expect(gates, "原本の試す図が関門 (blocks.check) を書いた順に持たない").toEqual([
      { node: "seq", field: "size", op: "<=", value: "27000", no: "TOO_LARGE", into: "rejects" },
      { node: "seq", field: "load", op: "<", value: "80", no: "OVERLOADED", retry: true, into: "rejects" },
      { node: "pn", field: "sig", op: "==", value: "ok", no: "BAD_SIGNATURE", into: "rejects" },
    ]);
    const checked = api("validateDiagram")(diagram);
    expect(checked.ok, `関門を持つ原本が原本の形の検査を通らない: ${checked.ok ? "" : JSON.stringify(checked.errors)}`).toBe(true);
    // 原本の形の検査は関門の形を見る。比べ方に無い記号は通さない
    const badOp = structuredClone(diagram) as { blocks: { check: { op: string }[] } };
    const gate = badOp.blocks.check[0];
    if (gate) gate.op = "=~";
    expect(api("validateDiagram")(badOp as unknown as Json).ok, "比べ方に無い記号 =~ の関門を原本の形の検査が通す").toBe(false);

    const printed = api("printNotation")(diagram);
    const lines = printed.split("\n");
    const at = GATES.map((line) => lines.indexOf(line));
    expect(at.every((i) => i >= 0), `書き戻した記法に関門の行が元の記法のまま無い\n${printed}`).toBe(true);
    expect([...at].sort((a, b) => a - b), `書き戻した記法の関門の行が書いた順でない\n${printed}`).toEqual(at);
    expect(printed, "書き戻した記法が元の記法と同じ文字列に戻らない").toBe(text);
    const again = api("parseNotation")(printed);
    expect(again.ok, `書き戻した記法が読めない: ${again.ok ? "" : JSON.stringify(again.errors)}\n${printed}`).toBe(true);
    expect(again.ok ? again.diagram : undefined, `往復した JSON が最初と違う\n${printed}`).toEqual(diagram);
  });

  it("interactive-gate-stops-at-node", () => {
    const { host, player } = mountTry(parsedTry(gateTry()), 720, { lang: "ja" });
    const steps = stepsOf(player);
    const before = finalState(sessionOf(player));
    expect(before.logs?.rejects, "送る前の記録の列 rejects が空でない").toEqual([]);

    // size が 27000 を超えるチップは seq の 1 つ目の関門で止まる。retry を書かない関門
    sendValues(host, { name: "me", sig: "ok", size: "85134", load: "10" }, "size 85134");
    expect(stepsOf(player), "関門で止まるチップを送っても段が増えない").toBe(steps + 1);
    const first = finalState(sessionOf(player));
    expect(first.items.me, "関門で止まったチップ me が作られない").toEqual(["me", "ok", "85134", "10"]);
    expect(inNoQueue(first, "me"), `関門で止まったチップ me が待ち行列に入る: ${JSON.stringify(first.queues)}`).toBe(true);
    expect(first.queues, "関門で止まったチップを送ると待ち行列が変わる").toEqual(before.queues);
    expect(tripOf(first, "me"), "関門で止まったチップの網の道が止まった節 seq で切れない").toEqual(["you", "pn", "seq"]);
    expect(first.logs?.rejects, "記録の列 rejects に、止まったチップと節とエラーの名前を持つ記録が 1 件増えない").toMatchObject([
      { number: 1, items: ["me"], node: "seq", error: "TOO_LARGE", retry: false },
    ]);
    expect(first.logs?.verdicts, "関門の into でない記録の列 verdicts が変わる").toEqual(before.logs?.verdicts);
    expect(recordText(host, "rejects", 1), "retry を書かない関門の記録に「直して送り直す」の印が出ない").toContain(MARKS.ja.fix);

    // load が 80 以上のチップは seq の 2 つ目の関門で止まる。retry を書いた関門。前に送った結果は残る
    sendValues(host, { name: "me", sig: "ok", size: "12000", load: "95" }, "load 95");
    const second = finalState(sessionOf(player));
    expect(inNoQueue(second, "me-2"), "2 度目に関門で止まったチップ me-2 が待ち行列に入る").toBe(true);
    expect(tripOf(second, "me-2"), "2 度目に止まったチップの網の道が seq で切れない").toEqual(["you", "pn", "seq"]);
    expect(second.logs?.rejects, "2 度目に止まった記録が前の記録の後ろに並ばない").toMatchObject([
      { number: 1, items: ["me"], node: "seq", error: "TOO_LARGE", retry: false },
      { number: 2, items: ["me-2"], node: "seq", error: "OVERLOADED", retry: true },
    ]);
    expect(recordText(host, "rejects", 2), "retry を書いた関門の記録に「再試行できる」の印が出ない").toContain(MARKS.ja.retry);
  });

  it("interactive-gate-first-on-path", () => {
    // 3 つの関門の全てに合わない。網の道で先に着く pn の関門で止まる (書いた順は seq の関門が先)
    const all = sentThrough(GATES, ["me", "bad", "85134", "95"]);
    expect(all.logs?.rejects, "3 つの関門に合わないチップが、網の道で最初に着く pn で止まらない").toMatchObject([
      { items: ["me"], node: "pn", error: "BAD_SIGNATURE", retry: false },
    ]);
    expect(tripOf(all, "me"), "pn で止まったチップの網の道が pn で切れない").toEqual(["you", "pn"]);
    expect(inNoQueue(all, "me"), "pn で止まったチップが待ち行列に入る").toBe(true);
    // seq の 2 つの関門に合わない。同じ節では書いた順で最初の TOO_LARGE で止まり、記録は 1 件だけ
    const both = sentThrough(GATES, ["me", "ok", "85134", "95"]);
    expect(both.logs?.rejects, "seq の 2 つの関門に合わないチップが、書いた順で最初の関門 TOO_LARGE で止まらない").toMatchObject([
      { items: ["me"], node: "seq", error: "TOO_LARGE", retry: false },
    ]);
    expect(both.logs?.rejects, "1 つのチップが合わない関門の数だけ記録を作る").toHaveLength(1);
    // 書く順を入れ替えると、同じ節で先に確かめる関門も替わる
    const swapped = sentThrough([SEQ_LOAD, SEQ_SIZE, PN_SIG], ["me", "ok", "85134", "95"]);
    expect(swapped.logs?.rejects, "seq の関門を load、size の順に書いても、書いた順で最初の OVERLOADED で止まらない").toMatchObject([
      { items: ["me"], node: "seq", error: "OVERLOADED", retry: true },
    ]);
    expect(tripOf(swapped, "me"), "seq で止まったチップの網の道が seq で切れない").toEqual(["you", "pn", "seq"]);
  });

  it("interactive-gate-compares-values", () => {
    /** [関門の条件, size の値か sig の値, 通るか] */
    const cases: [string, { sig?: string; size?: string }, boolean][] = [
      // 関門の値が数の時は、欄の値も数として比べる
      ["size <= 27000", { size: "85134" }, false],
      ["size <= 27000", { size: "12000" }, true],
      ["size <= 27000", { size: "27000" }, true],
      // 字として比べると "9000" は "27000" より後ろ、"100000" は前に並ぶ。数として比べる
      ["size <= 27000", { size: "9000" }, true],
      ["size <= 27000", { size: "100000" }, false],
      ["size >= 100", { size: "99" }, false],
      ["size >= 100", { size: "100" }, true],
      ["size > 100", { size: "100" }, false],
      ["size > 100", { size: "101" }, true],
      ["size < 100", { size: "100" }, false],
      ["size < 100", { size: "99" }, true],
      ["size == 100", { size: "100.0" }, true],
      ["size == 100", { size: "101" }, false],
      ["size != 100", { size: "100" }, false],
      ["size != 100", { size: "7" }, true],
      // 関門の値が数の時、数でない欄の値はどの比べ方でも合わない
      ["size <= 27000", { size: "big" }, false],
      ["size == 100", { size: "big" }, false],
      ["size != 100", { size: "big" }, false],
      // 関門の値が数でない時は、== と != で字として比べる
      ["sig == ok", { sig: "ok" }, true],
      ["sig == ok", { sig: "bad" }, false],
      ["sig != bad", { sig: "ok" }, true],
      ["sig != bad", { sig: "bad" }, false],
    ];
    for (const [rule, values, passes] of cases) {
      const gate = `check seq: ${rule} [no: NG, into: rejects]`;
      const sent = values.size ?? values.sig ?? "";
      const state = sentThrough([gate], ["me", values.sig ?? "ok", values.size ?? "10", "10"]);
      const records = state.logs?.rejects ?? [];
      if (passes) {
        expect(records, `${rule} の関門に ${sent} のチップが合わずに止まる`).toEqual([]);
        expect(state.queues.pool ?? [], `${rule} の関門に合う ${sent} のチップが待ち行列 pool に入らない`).toContain("me");
      } else {
        expect(records, `${rule} の関門に ${sent} のチップが合ってしまい止まらない`).toMatchObject([{ items: ["me"], node: "seq", error: "NG" }]);
        expect(inNoQueue(state, "me"), `${rule} の関門で止まる ${sent} のチップが待ち行列に入る`).toBe(true);
      }
    }
  });

  it("interactive-gate-passes-matching-chips", () => {
    const { host, player } = mountTry(parsedTry(gateTry()), 720, { lang: "ja" });
    const steps = stepsOf(player);
    const before = finalState(sessionOf(player));
    sendValues(host, { name: "me", sig: "ok", size: "12000", load: "10" }, "全ての関門に合う値");
    expect(stepsOf(player), "全ての関門に合うチップを送っても段が増えない").toBe(steps + 1);
    const after = finalState(sessionOf(player));
    expect(after.queues.pool ?? [], "全ての関門に合うチップが into の待ち行列 pool に入らない").toContain("me");
    expect(tripOf(after, "me"), "全ての関門に合うチップの網の道が from から to まで続かない").toEqual(["you", "pn", "seq", "med"]);
    expect(after.logs, "全ての関門に合うチップを送ると記録の列が変わる").toEqual(before.logs);
    expect(figureOf(host)?.querySelector("[data-stop]") ?? null, "全ての関門に合うチップを送ると止まった印が出る").toBeNull();
  });

  it("interactive-gate-refuses-bad-lines", () => {
    const parse = api("parseNotation");
    const good = parse(gateTry());
    expect(good.ok, `正しい記法が読めない: ${good.ok ? "" : JSON.stringify(good.errors)}`).toBe(true);
    // 関門の節は網の from から to への最短の道の節
    const offPath = "check alt: size <= 27000 [no: TOO_LARGE, into: rejects]";
    expectRefused("最短の道に無い網の節の関門", gateTry({ gates: gatesReplaced(SEQ_SIZE, offPath) }), offPath, "alt", ["alt", "net"]);
    const noNode = "check zzz: size <= 27000 [no: TOO_LARGE, into: rejects]";
    expectRefused("網の節でない名前の関門", gateTry({ gates: gatesReplaced(SEQ_SIZE, noNode) }), noNode, "zzz", ["zzz"]);
    // 欄は入力の帯の欄
    const noField = "check seq: weight <= 27000 [no: TOO_LARGE, into: rejects]";
    expectRefused("入力の帯に無い欄の関門", gateTry({ gates: gatesReplaced(SEQ_SIZE, noField) }), noField, "weight", ["weight"]);
    // into は記録の列で、all を持たない
    const intoQueue = "check seq: size <= 27000 [no: TOO_LARGE, into: pool]";
    expectRefused("記録の列でない into の関門", gateTry({ gates: gatesReplaced(SEQ_SIZE, intoQueue) }), intoQueue, "pool", ["pool", "log"]);
    const intoAll = "check seq: size <= 27000 [no: TOO_LARGE, into: verdicts]";
    expectRefused("all を持つ記録の列を into に書いた関門", gateTry({ gates: gatesReplaced(SEQ_SIZE, intoAll) }), intoAll, "verdicts", ["verdicts", "all"]);
    // 数でない値は == と != でだけ比べる
    for (const op of [">=", "<=", ">", "<"] as const) {
      const ordered = `check pn: sig ${op} ok [no: BAD_SIGNATURE, into: rejects]`;
      expectRefused(`数でない値を ${op} で比べる関門`, gateTry({ gates: gatesReplaced(PN_SIG, ordered) }), ordered, "ok", ["ok", "==", "!="]);
    }
    // 段の中の check は、試す図でも今どおり配管の図 (pipe) を名指した誤りで止まる
    const inStep = gateTry({ examples: [["step send", "  say 送る。", `  ${SEQ_SIZE}`]] });
    for (const lang of ["ja", "en"] as const) {
      const parsed = parse(inStep, { lang });
      const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
      expect(first?.line, `段の中の check が誤りにならない (${lang})`).toBe(inStep.split("\n").indexOf(`  ${SEQ_SIZE}`) + 1);
      expect(first?.message ?? "", `段の中の check の誤りの文が配管の図 (pipe) を名指さない (${lang})`).toContain("pipe");
    }
  });

  it("interactive-gate-applies-to-step-ask", () => {
    const text = gateTry({
      examples: [
        ["step send", "  say 送る。", "  ask me, ok, 85134, 10"],
        ["step again", "  say 直して送る。", "  ask me, ok, 12000, 10"],
      ],
    });
    for (const lang of ["ja", "en"] as const) {
      const parsed = api("parseNotation")(text, { lang });
      expect(parsed.ok, `関門で止まる書き手の例の ask を読めない (${lang}): ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
    }
    const states = statesOf(parsedTry(text));
    expect(states, "書き手の例の 2 つの段を足した図の段の数").toHaveLength(3);
    const sent = states[1] as GateState;
    expect(inNoQueue(sent, "me"), "書き手の例で関門に合わない値のチップが待ち行列に入る").toBe(true);
    expect(tripOf(sent, "me"), "書き手の例で止まったチップの網の道が seq で切れない").toEqual(["you", "pn", "seq"]);
    expect(sent.logs?.rejects, "書き手の例で関門に合わない値を送っても、記録の列 rejects に記録が増えない").toMatchObject([
      { number: 1, items: ["me"], node: "seq", error: "TOO_LARGE", retry: false },
    ]);
    const again = states[2] as GateState;
    expect(again.queues.pool ?? [], "書き手の例で関門に合う値を送ったチップ me-2 が待ち行列 pool に入らない").toContain("me-2");
    expect(again.logs?.rejects, "関門に合うチップを送ると記録の列 rejects が変わる").toEqual(sent.logs?.rejects);
  });

  it("interactive-gate-player-shows-record", () => {
    for (const lang of ["ja", "en"] as const) {
      const { host } = mountTry(parsedTry(gateTry(), lang), 720, { lang });
      expect(figureOf(host)?.querySelector("[data-stop]") ?? null, `送る前に止まった印が出る (${lang})`).toBeNull();
      sendValues(host, { name: "me", sig: "ok", size: "85134", load: "10" }, `size 85134 (${lang})`);
      expect(figureOf(host)?.querySelector('[data-route="net"] [data-stop="seq"]') ?? null, `関門で止まった網の節 seq に止まった印 (data-stop) が出ない (${lang})`).not.toBeNull();
      const fix = recordText(host, "rejects", 1);
      for (const word of ["seq", "TOO_LARGE", MARKS[lang].fix]) expect(fix, `retry を書かない関門の記録が ${word} を出さない (${lang}): ${fix}`).toContain(word);
      expect(fix, `retry を書かない関門の記録に再試行できる印が出る (${lang})`).not.toContain(MARKS[lang].retry);
      sendValues(host, { name: "me", sig: "ok", size: "12000", load: "95" }, `load 95 (${lang})`);
      const retry = recordText(host, "rejects", 2);
      for (const word of ["seq", "OVERLOADED", MARKS[lang].retry]) expect(retry, `retry を書いた関門の記録が ${word} を出さない (${lang}): ${retry}`).toContain(word);
      if (lang === "en") for (const text of [fix, retry]) expect(KANA.test(text), `英語の図の記録に仮名か漢字がある: ${text}`).toBe(false);
      releaseTry();
    }
  });
});

describe("書き方の文書 (#3476)", () => {
  it("docs-describe-try-gate", () => {
    /** 見出し `heading` から次の同じ深さの見出しまで */
    const sectionOf = (text: string, heading: string): string => {
      const start = text.indexOf(heading);
      if (start < 0) return "";
      const next = text.indexOf("\n### ", start + heading.length);
      return text.slice(start, next < 0 ? undefined : next);
    };
    const forms = {
      ja: "check <節>: <欄> <比べ方> <値> [no: <エラーの名前>, retry, into: <記録の列>]",
      en: "check <node>: <field> <op> <value> [no: <error>, retry, into: <log>]",
    } as const;
    for (const [path, heading, form] of [
      ["packages/dragon/README.ja.md", "### 試す図", forms.ja],
      ["packages/dragon/README.md", "### Try diagram", forms.en],
    ] as const) {
      const section = sectionOf(readRepo(path), heading);
      expect(section, `${path} に試す図の小節 (${heading}) が無い`).not.toBe("");
      expect(section, `${path} の試す図の小節に check で関門を書く書き方 (${form}) が無い`).toContain(form);
    }
    const docs = readRepo("apps/playground-spa/src/docs/content.ts");
    for (const form of Object.values(forms)) expect(docs, `使い方の頁に check で関門を書く書き方 (${form}) が無い`).toContain(form);
  });
});
