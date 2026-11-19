// @vitest-environment jsdom
/**
 * 配管の図 (#3389)。
 *
 * Solidity の関数を呼んだ時に中で何が起きたかを、関係者の列と上の呼び出しの管と下の槽と管で段ごとに見せる図。
 * 原本の JSON の `kind` は `pipe`。見た目の元は step 2 で本人が選んだ Tracelyth の第8回の試作 (`pipes2`) で、色は dragon の値の表で描く。
 *
 * 原本の JSON の形 (版2)
 *
 * - `blocks.box`: 関係者。`{ id, name, icon? }`。種類 (送り手、Contract、トークンの Contract、口座) は書かず、行から導く
 * - `blocks.hold`: 始めの値。残高は `{ box, amount, token }` (`hold pool: 2000 USDC, 10 WETH` は 2 つに分ける)、
 *   残高でない値は `{ box, name, value }` (`hold usdc: "allowance[alice][router]" 100`)。量は書いた字のまま持つ (`"0.05"`)。
 *   `token` はトークンの Contract の名前 (`box usdc as USDC` の `USDC`) か、宣言しない決まった名前の `ETH`
 * - 段の中の出来事 (`steps[].events`)
 *   - 呼び出し `a -> b: <字>` は `{ type: "call", from, to, label?, value?, call?, fold? }`。
 *     `[value: 1 ETH]` は `value: "1"`、`[call: delegate]` と `[call: static]` は `call`、`[fold]` は `fold: true`
 *   - `return <者>: <値>` は `{ type: "return", box, value? }`、`revert <者>: <理由>` は `{ type: "revert", box, reason? }`
 *   - `move <動かす者>: <量> <送り手> -> <受け手>` は `{ type: "move", box, amount, from, to }`
 *   - `write <者>: <名前> <値>` は `{ type: "write", box, name, value }`
 *   - `check <者>: <左> <比べ方> <右>` は `{ type: "check", box, left, op, right, fail? }`。`[fail]` は `fail: true`
 *   - `emit <者>: <名前>(<引数>, …)` は `{ type: "emit", box, name, args? }`。引数が無ければ `args` を持たない
 *   - `calc <者>: <入る値> -> <出る値>` は `{ type: "calc", box, in, out }`
 *
 * 記法の決まり (この file の検査が名指す所)
 *
 * - `return` と `revert` は、今いちばん内側で開いている呼び出しの呼ばれた者を名指す。ほかの者を名指した行は、その名前を指して止まる
 * - 閉じない呼び出しは、その呼び出しの行の頭を指して止まる。量が足りない行は量を、印の誤りは印の鍵か値を指して止まる
 * - 名前に `[` を持つ値の名前は、記法の決まり 3 のとおり `"` で囲む
 *
 * 描いた図の置き場所 (`renderDiagram` の `layout`、`kind` は `pipe`)
 *
 * 段ごとに変わる物は、見える段ごとに 1 つずつ持ち、`step` はその段の番号 (畳んだ図では畳んだ後の段の番号)。
 * `event` は原本のその段の `events` の何番目か。`state` は `none` (変わっていない)、`provisional` (暫定)、`final` (確定)、`rolled` (取り消し)。
 *
 * - `parties`: 関係者の名札の枠。出てきた順に左から。`role` は `sender` / `contract` / `token` / `account`、`icon` は `box` に書いた形
 * - `columns`: 段ごとの関係者の列の帯。畳んだ列は `folded` が真
 * - `tanks`: 槽のガラスの枠と、上のトークンの名前の字 (`title`)。`levels`: 段ごとの水の四角 (高さが水位) と量の字 (`text`) と前の量の字 (`was`)
 * - `buses`: トークンごとの管。`valve` はトークンの Contract の弁 (`ETH` は持たない)。`flows`: 段ごとの、管を流れた分 (`move` と `[value]` ごと)
 * - `calls`: 呼び出しの管。`index` は出てきた順、`depth` は深さ、`y` は横に走る高さ、`kind` は `call` / `delegate` / `static`、`width` は太さ、`close` は閉じた段と閉じ方
 * - `returns`: `return` の値の札。`call` は閉じた呼び出しの `index`
 * - `plates`: 段ごとの値の札。前の値の字 (`was`) と消し線 (`strike`) を持つ。`writes`: 書き込む管。`from` は書いた者、`to` は書き替えた札の持ち主
 * - `gauges`: その段だけの計器。`lamps`: 段ごとの行う者の確認の印。`checks`: 段ごとの図の上の確認の印
 * - `events`: 段ごとの図の上の端のイベントの札。`emitted` は出した段、`args` は出した段だけ持つ引数の字
 * - `converters`: 段ごとの換算の札。`calc` は換算した段
 * - `folds`: `[fold]` の呼び出しを畳んだ箱。`steps` は内側の段の数、`parties` は箱に畳んだ関係者の数
 *   (内側の段は畳んだ呼び出しを開いた段の次の段から閉じた段の前の段まで。箱に畳んだ関係者は、内側の段で呼ぶか呼ばれるか行の頭か `move` の両端に名指され、
 *   畳まなかった段には出ない者。畳んだ間は、その関係者の列と名札と槽と値の札と、内側にしか出ないトークンの管を描かない)
 * - `pills`: 段ごとの関係者の名札。`glasses`: 段ごとの槽のガラス。`pipes`: 段ごとのトークンの管
 *
 * 描いた SVG の印
 *
 * `data-pipe-step` を持つ部品はその段の止め絵でだけ見え、`data-pipe-state` は上の `state` を持つ。
 * 関係者は `data-pipe-party` と `data-pipe-role`、呼び出しの管は `data-pipe-call` (`index`) と `data-pipe-pipe` (`open` が開いている間の実線、`closed` が閉じた後の点線)、
 * 水は `data-pipe-level` (持ち主) と `data-pipe-token`、流れた分は `data-pipe-flow`、値の札は `data-pipe-plate` (持ち主) と `data-pipe-name`、
 * 計器は `data-pipe-gauge`、イベントを出した印は `data-pipe-ring`、イベントの札は `data-pipe-event` と中の引数の `data-pipe-args`、
 * 換算の札は `data-pipe-converter`、畳んだ箱は `data-pipe-fold` (`index`、押すと開く)。
 * 色の役は部品か包む部品の `--c:var(--c-<役>)` で読む。呼び出しは青 (`blue`)、確定は緑 (`green`)、イベントは桃色 (`rose`)。
 *
 * 見本の file と配管の図の入口がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { api, type Json, type LineError, patched, pointers, smallArchitecture, smallSequence } from "./diagram-support";
import { motionFrom } from "./motion-support";
import { covers, draw, figureClass, type Rendered, sampleTimes } from "./render-support";
import { ROOT, EXAMPLES, SAMPLES, PIPE_WORDS, KANA, FLOW_WIDTH, BAND_LEAST, type Point, type State, type Flow, type Source, bal, val, call, ret, rev, move, write, check, emit, calc, fullPipe, kindsPipe, callKindsPipe, movePipe, innerPipe, foldPipe, fileText, exampleJson, repoText, render, partyOf, levelOf, tankOf, plateOf, callAt, center, within, lastStep, stillOf, partsOf, seen, roleOf, strokeWidthOf, hatched, initialsOf, shape, SAMPLE_FILES, SAMPLE_JSON, langOf, tankCount, countsFromTo } from "./pipe-diagram-support";

describe("配管の図の原本の JSON (#3389)", () => {
  it("schema-accepts-pipe-diagram", () => {
    const validate = api("validateDiagram");
    const checked = validate(fullPipe());
    expect(checked.ok, `全部の語の配管の図が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    for (const file of SAMPLE_JSON) {
      const sample = validate(exampleJson(file));
      expect(sample.ok, `${file} が検査で落ちる: ${JSON.stringify(sample.ok ? [] : sample.errors)}`).toBe(true);
    }
  });

  it("schema-rejects-misplaced-pipe-events", () => {
    const validate = api("validateDiagram");
    const read = api("readDiagram");
    const toV2 = (d: Json): Json => {
      const r = read(d);
      expect(r.ok, "小さな図を版2の形で読めない").toBe(true);
      return r.ok ? r.diagram : {};
    };
    const sequence = toV2(smallSequence());
    const architecture = toV2(smallArchitecture());
    const events: [string, Json][] = [
      ["call", call("a", "b", "呼ぶ")],
      ["move", move("a", "1", "a", "b")],
      ["write", write("a", "名前", "1")],
      ["check", check("a", "1", "==", "1")],
      ["return", ret("a", "済み")],
      ["revert", rev("a", "失敗")],
      ["emit", emit("a", "Done")],
      ["calc", calc("a", "1 USDC", "2 WETH")],
    ];
    const edge: Json = { type: "edge", from: "alice", to: "router", carry: { kind: "envelope" } };
    const cases: [string, Json, string][] = [
      ...events.map(([type, event]): [string, Json, string] => [`時系列図に ${type} の出来事`, patched(sequence, ["steps", 0, "events"], [event]), "/steps/0/events/0/type"]),
      ...events.map(([type, event]): [string, Json, string] => [`構成図に ${type} の出来事`, patched(architecture, ["steps", 0, "events"], [event]), "/steps/0/events/0/type"]),
      ["時系列図に hold の欄", patched(sequence, ["blocks", "hold"], [bal("a", "1", "USDC")]), "/blocks/hold"],
      ["構成図に hold の欄", patched(architecture, ["blocks", "hold"], [val("a", "名前", "1")]), "/blocks/hold"],
      ["配管の図に枝の欄", patched(fullPipe(), ["blocks", "branch"], [{ id: "main" }]), "/blocks/branch"],
      ["配管の図にチップの欄", patched(fullPipe(), ["blocks", "item"], [{ id: "a" }]), "/blocks/item"],
      ["配管の図に区画の欄", patched(fullPipe(), ["blocks", "group"], [{ id: "g", name: "区画" }]), "/blocks/group"],
      ["配管の図に線の出来事", patched(fullPipe(), ["steps", 0, "events"], [edge]), "/steps/0/events/0/type"],
      ["配管の図に処理の出来事", patched(fullPipe(), ["steps", 0, "events"], [{ type: "action", box: "alice", label: "処理" }]), "/steps/0/events/0/type"],
      ["配管の図に列の並びの出来事", patched(fullPipe(), ["steps", 0, "events"], [{ type: "line", box: "alice", items: ["a"] }]), "/steps/0/events/0/type"],
    ];
    for (const [name, input, pointer] of cases) {
      expect(pointers(validate(input)), `${name} の誤りの場所`).toContain(pointer);
      const en = validate(input, { lang: "en" });
      expect(pointers(en), `${name} の英語の誤りの場所`).toContain(pointer);
      expect(
        (en.ok ? [] : en.errors.map((e) => e.message)).filter((m) => KANA.test(m)),
        `${name} の英語の誤りの文に仮名か漢字がある`,
      ).toEqual([]);
    }
  });
});

describe("配管の図の記法 (#3389)", () => {
  it("notation-compiles-pipe-examples-to-json", () => {
    const parse = api("parseNotation");
    for (const file of SAMPLE_FILES) {
      const text = fileText(file);
      expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
      const parsed = parse(text ?? "", { lang: langOf(file) });
      expect(parsed.ok, `${file} が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const json = file.replace(/\.dragon$/u, ".json");
      expect(parsed.ok ? parsed.diagram : undefined, `${file} から作った JSON が ${json} と違う`).toEqual(exampleJson(json));
    }
    // 1 行に並べた残高は 1 つずつに分け、名前に [ を持つ値は囲みを外して持つ。印は呼び出しと確認の欄になる
    const small = parse(
      [
        "pipe 印",
        "box alice",
        "box router",
        "box usdc as USDC",
        "box pool",
        "hold alice: 1000 USDC, 2 ETH",
        "hold router: 0 ETH",
        'hold usdc: "allowance[alice][router]" 100',
        "step 頼む",
        "  say 頼む。",
        "  alice -> router: 預ける [value: 1 ETH]",
        "  router -> pool: 読む [call: static]",
        "  return pool: 7",
        "  router -> pool: 借りる [call: delegate]",
        "  return pool: ok",
        "  router -> pool: まとめる [fold]",
        "  check pool: owner == alice [fail]",
        "  emit pool: Done()",
        "  return pool: ok",
        "  return router: 済み",
      ].join("\n"),
    );
    expect(small.ok, `印を持つ配管の図が読めない: ${small.ok ? "" : JSON.stringify(small.errors)}`).toBe(true);
    const diagram = (small.ok ? small.diagram : {}) as unknown as Source & { steps: { events: Json[] }[] };
    expect(diagram.blocks?.hold, "hold の行が宣言する始めの値").toEqual([
      bal("alice", "1000", "USDC"),
      bal("alice", "2", "ETH"),
      bal("router", "0", "ETH"),
      val("usdc", "allowance[alice][router]", "100"),
    ]);
    expect(diagram.steps?.[0]?.events, "段の中の呼び出しと印と行").toEqual([
      call("alice", "router", "預ける", { value: "1" }),
      call("router", "pool", "読む", { call: "static" }),
      ret("pool", "7"),
      call("router", "pool", "借りる", { call: "delegate" }),
      ret("pool", "ok"),
      call("router", "pool", "まとめる", { fold: true }),
      check("pool", "owner", "==", "alice", true),
      emit("pool", "Done"),
      ret("pool", "ok"),
      ret("router", "済み"),
    ]);
  });

  it("notation-rejects-misused-pipe-lines", () => {
    const parse = api("parseNotation");
    // 誤りの文は書き手の名札をそのまま引くので、英語の文を確かめるこの検査の名札は英字にする
    const head = [
      "pipe small",
      "box alice",
      "box router",
      "box usdc as USDC",
      "box pool",
      "hold alice: 100 USDC, 2 ETH",
      "hold router: 5 ETH",
      "hold pool: 50 USDC, 0 ETH",
      "hold router: paused false",
    ];
    const step = ["step go", "  say go."];
    const open = [...step, "  alice -> router: swap"];
    const close = ["  return router: done"];
    const staticOpen = [...step, "  alice -> router: read [call: static]"];
    // 誤りの行 (0 から数える) と、その行の中の誤りを指す語の位置 (0 から数える)
    const at = (line: string, token: string): number => line.indexOf(token);
    const body = head.length + open.length;
    const inner = (line: string): [string[], number, number] => [[...head, ...open, line, ...close], body, at(line, line.trim())];
    const cases: [string, string[], number, number][] = [
      ["宣言していない関係者を書いた行", [...head, ...open, "  check nobody: 1 == 1", ...close], body, at("  check nobody: 1 == 1", "nobody")],
      ["box の行が無い図", ["pipe small", ...step], 0, 0],
      ["最初の step より前の move", [...head, "move usdc: 10 alice -> pool", ...open, ...close], head.length, 0],
      ["最初の step より前の write", [...head, "write router: paused true", ...open, ...close], head.length, 0],
      ["最初の step より前の emit", [...head, "emit usdc: Transfer(alice, pool, 10)", ...open, ...close], head.length, 0],
      ["開いていない呼び出しの return", [...head, ...open, "  return pool: no", ...close], body, at("  return pool: no", "pool")],
      ["開いていない呼び出しの revert", [...head, ...open, "  revert pool: no", ...close], body, at("  revert pool: no", "pool")],
      ["最後まで閉じない呼び出し", [...head, ...open], body - 1, 2],
      ["持っている量より多い move", [...head, ...open, "  move usdc: 101 alice -> pool", ...close], body, at("  move usdc: 101 alice -> pool", "101")],
      ["持っている量より多い [value]", [...head, ...step, "  alice -> router: pay [value: 3 ETH]", ...close], body - 1, at("  alice -> router: pay [value: 3 ETH]", "3 ETH")],
      ["トークンの Contract でない者の move", [...head, ...open, "  move router: 10 alice -> pool", ...close], body, at("  move router: 10 alice -> pool", "router")],
      ["ETH の move", [...head, ...open, "  move ETH: 1 alice -> router", ...close], body, at("  move ETH: 1 alice -> router", "ETH")],
      ["両側が数の check の [fail]", [...head, ...open, "  check router: 1 >= 2 [fail]", ...close], body, at("  check router: 1 >= 2 [fail]", "fail")],
      ["単位の違う数を比べる check", [...head, ...open, "  check router: 1 USDC >= 2 ETH", ...close], body, at("  check router: 1 USDC >= 2 ETH", "2 ETH")],
      ["両側が数でない calc", [...head, ...open, "  calc router: lots -> 2 ETH", ...close], body, at("  calc router: lots -> 2 ETH", "lots")],
      ["呼び出しでない行の [fold]", [...head, ...open, "  move usdc: 10 alice -> pool [fold]", ...close], body, at("  move usdc: 10 alice -> pool [fold]", "fold")],
      ["[call: static] の内側の move", [...head, ...staticOpen, "  move usdc: 10 alice -> pool", ...close], body, 2],
      ["[call: static] の内側の write", [...head, ...staticOpen, "  write router: paused true", ...close], body, 2],
      ["[call: static] の内側の emit", [...head, ...staticOpen, "  emit router: Read()", ...close], body, 2],
      [
        "[call: static] の内側の [value]",
        [...head, ...staticOpen, "  router -> pool: pay [value: 1 ETH]", "  return pool: ok", ...close],
        body,
        at("  router -> pool: pay [value: 1 ETH]", "value"),
      ],
      [
        "[call: delegate] に付けた [value]",
        [...head, ...open, "  router -> pool: run [call: delegate, value: 1 ETH]", "  return pool: ok", ...close],
        body,
        at("  router -> pool: run [call: delegate, value: 1 ETH]", "value"),
      ],
      ["[call: create]", [...head, ...step, "  alice -> router: make [call: create]", ...close], body - 1, at("  alice -> router: make [call: create]", "create")],
      ["group の行", ["pipe small", "group g", "  box alice", "end", ...step], 1, 0],
      ["item の行", [...head, "item a", ...open, ...close], head.length, 0],
      ["act の行", ...inner("  act router: work")],
      ["line の行", ...inner("  line router: a")],
    ];
    for (const [name, lines, row, column] of cases) {
      const want = { line: row + 1, column: column + 1 };
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first && { line: first.line, column: first.column }, `${name} の誤りの行と列 (${lang})`).toEqual(want);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });

  it("notation-limits-pipe-lines-to-pipe", () => {
    const parse = api("parseNotation");
    const heads: [string, string[]][] = [
      ["時系列図", ["sequence 配管の行", "box a", "step 送る", "  say 送る。"]],
      ["構成図", ["architecture 配管の行", "box a", "step 送る", "  say 送る。"]],
      ["状態遷移図", ["state 配管の行", "box a", "step 送る", "  say 送る。"]],
      ["枝分かれの図", ["git 配管の行", "branch main", "step 積む", "  say 積む。"]],
      ["時間軸の図", ["time 配管の行", "scale slot 12s 4", "row a", "step 進む", "  say 進む。"]],
      ["木の図", ["tree 配管の行", "step 葉", "  say 葉。", "  leaf x1"]],
      ["列の図", ["lineup 配管の行", "box a", "item x", "step 並べる", "  say 並べる。"]],
      ["試す図", ["try 配管の行", "queue q [order: f]", "ask n, f [into: q]", "item x [f: 1]", "step 送る", "  say 送る。"]],
    ];
    const lines = [
      "hold a: 1 USDC",
      "move usdc: 100 alice -> pool",
      "write a: owner bob",
      "check a: 1 == 1",
      "return a: done",
      "revert a: failed",
      "emit a: Done()",
      "calc a: 1 USDC -> 2 WETH",
    ];
    for (const [name, head] of heads) {
      for (const line of lines) {
        for (const lang of ["ja", "en"] as const) {
          const parsed = parse([...head, `  ${line}`].join("\n"), { lang });
          const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
          expect(first?.line, `${name} の ${line} が ${head.length + 1} 行目の誤りにならない (${lang})`).toBe(head.length + 1);
          // 配管の図の頭の語を名指して、その図でしか書けないことを示す
          expect(first?.message ?? "", `${name} の ${line} の誤りの文が配管の図 (pipe) を名指さない (${lang})`).toContain("pipe");
          if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の ${line} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
        }
      }
    }
  });

  it("notation-keeps-pipe-words-plain-outside-pipe", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture", "state"] as const) {
      const text = [
        `${kind} 配管の語の名札`,
        ...PIPE_WORDS.map((word) => `box ${word}`),
        "box db",
        "step 送る",
        "  say 送る。",
        ...PIPE_WORDS.map((word) => `  ${word} -> db: 送る`),
      ].join("\n");
      const parsed = parse(text);
      expect(parsed.ok, `${kind} で配管の図の語を名札にした箱が読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      const diagram = (parsed.ok ? parsed.diagram : {}) as unknown as {
        blocks?: { box?: { id: string }[] };
        steps?: { events: { type: string; from?: string; to?: string }[] }[];
      };
      expect(
        diagram.blocks?.box?.map((b) => b.id),
        `${kind} の箱の名札`,
      ).toEqual([...PIPE_WORDS, "db"]);
      expect(
        diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })),
        `${kind} の配管の図の語の箱から出る線`,
      ).toEqual(PIPE_WORDS.map((word) => ({ type: "edge", from: word, to: "db" })));
    }
  });

  it("pipe-roundtrip-keeps-json-identical", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const file of SAMPLE_FILES) {
      const text = fileText(file);
      expect(text, `${file} が無い`).toBeDefined();
      const lang = langOf(file);
      const first = parse(text ?? "", { lang });
      expect(first.ok, `${file} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
      if (!first.ok) continue;
      const printed = print(first.diagram);
      const second = parse(printed, { lang });
      expect(second.ok, `${file} を書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`).toBe(true);
      expect(second.ok ? second.diagram : undefined, `${file} を往復した JSON が最初と違う`).toEqual(first.diagram);
    }
    // JSON から書いた全部の語の図も、記法を経て同じ JSON に戻る
    const source = fullPipe();
    const printed = print(source);
    const again = parse(printed);
    expect(again.ok ? again.diagram : again.errors, `全部の語の図を往復した JSON が最初と違う\n${printed}`).toEqual(source);
  });
});

// 動かす段を持つ図と、箱を開いた Aggregator の図を件の中で描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。
// file を読み込む段で描き、件は描いた物を読む
const MOVED = await atLoad("動かす段を持つ図と、箱を開いた Aggregator の図を描く", () => ({
  moved: render(movePipe()),
  crowded: render(exampleJson("aggregator.json"), "ja", undefined, [2]).layout,
}));

/** 色味を比べる元の、見本 swap を既定の色味で描いた物 */
const SWAP_BASE = await atLoad("見本 swap を既定の色味で描く", () => {
  const source = exampleJson("swap.json");
  return { source, base: render(source) };
});

/**
 * 色味を替えても変わらない SVG の形。図の名前 (class と動きの名前) は色の値からも作るので、同じ名前に揃え、色と字の変数を書く最初の規則を外す。
 * 薄く描く組の不透明度は、暗い色味で背景との明るさの比を保つために明暗で変える (#3721) ので、色の値と同じく比べない
 */
const shapeOf = (svg: string): string => {
  const hash = figureClass(svg)?.slice("dg-".length) ?? "";
  return svg
    .split(hash)
    .join("figure")
    .replace(/<style>\.dg-figure\{[^}]*\}/u, "<style>")
    .replace(/<g opacity="[\d.]+" style="filter:grayscale\(1\)">/gu, '<g opacity="dim" style="filter:grayscale(1)">');
};

describe("配管の図の関係者と並べ方 (#3389)", () => {
  it("pipe-derives-party-kinds-from-lines", () => {
    const rendered = render(kindsPipe());
    const { layout } = rendered;
    expect(
      Object.fromEntries(layout.parties.map((p) => [p.id, p.role])),
      "行から導いた関係者の種類",
    ).toEqual({ alice: "sender", router: "contract", usdc: "token", bob: "account", vault: "contract", weth: "token" });
    expect(
      layout.parties.map((p) => p.id),
      "ETH を関係者として並べている",
    ).not.toContain("ETH");
    // トークンの Contract はそのトークンの管の弁になり、ETH の管は弁を持たない
    for (const [token, party] of [
      ["USDC", "usdc"],
      ["WETH", "weth"],
    ] as const) {
      const bus = layout.buses.find((b) => b.token === token);
      expect(bus?.valve?.party, `${token} の管の弁`).toBe(party);
      expect(Math.abs((bus?.valve?.x ?? Number.NaN) - center(partyOf(layout, party))), `${token} の弁が ${party} の列に無い`).toBeLessThan(1);
    }
    const eth = layout.buses.find((b) => b.token === "ETH");
    expect(eth, "ETH の管が無い").toBeDefined();
    expect(eth?.valve, "ETH の管が弁を持つ").toBeUndefined();
    // icon を書いた関係者は、その形で描く
    expect(partyOf(layout, "vault").icon, "vault の形").toBe("shield");
    const shield = (dragon as unknown as { ICONS?: Record<string, string> }).ICONS?.shield;
    expect(shield, "形 shield の線が @cardenelabs/dragon の ICONS に無い").toBeDefined();
    const motion = motionFrom(rendered as unknown as Rendered);
    const vault = partsOf(motion, '[data-pipe-party="vault"]')[0] as Element;
    expect(
      [...vault.querySelectorAll("path")].some((p) => p.getAttribute("d") === shield),
      "vault の名札が shield の形を描かない",
    ).toBe(true);
    for (const party of layout.parties)
      expect(partsOf(motion, `[data-pipe-party="${party.id}"]`)[0]?.getAttribute("data-pipe-role"), `描いた ${party.id} の種類`).toBe(party.role);
  });

  it("pipe-call-kinds-draw-their-pipes", () => {
    const rendered = render(callKindsPipe());
    const { layout, svg } = rendered;
    expect(
      layout.calls.map((c) => [c.from, c.to, c.kind]),
      "呼び出しの種類",
    ).toEqual([
      ["alice", "proxy", "call"],
      ["proxy", "logic", "delegate"],
      ["logic", "oracle", "static"],
    ]);
    // 処理を借りる呼び出しの内側の write は、呼んだ側の値の札を書き替え、書き込む管を呼んだ側の札へ向ける
    const count = plateOf(layout, "proxy", "count", 2);
    expect(count.value, "段 3 の Proxy の count").toBe("1");
    expect(count.state, "段 3 の Proxy の count の印").toBe("provisional");
    expect(
      layout.plates.filter((p) => p.party === "logic"),
      "Logic に値の札を描く",
    ).toEqual([]);
    const borrowed = layout.writes.find((w) => w.step === 2);
    expect(borrowed && { from: borrowed.from, to: borrowed.to, name: borrowed.name }, "段 3 の書き込む管").toEqual({ from: "logic", to: "proxy", name: "count" });
    const [ex, ey] = borrowed?.points[borrowed.points.length - 1] ?? [Number.NaN, Number.NaN];
    expect(within(ex, count) && ey >= count.y - 1 && ey <= count.y + count.h + 1, "段 3 の書き込む管が Proxy の count の札へ向かない").toBe(true);
    const own = layout.writes.find((w) => w.step === 5);
    expect(own && { from: own.from, to: own.to, name: own.name }, "段 6 の書き込む管").toEqual({ from: "proxy", to: "proxy", name: "owner" });
    // 書き込めない呼び出しの管は、普通の呼び出しの管の半分の太さ
    const normal = callAt(layout, 0);
    const readOnly = callAt(layout, 2);
    expect(readOnly.width / normal.width, "書き込めない呼び出しの管の太さ").toBeCloseTo(0.5, 2);
    // 開いた管は、呼び出しの種類を問わず淡く太い帯の中を筋が流れる形で描く (Tracelyth #168、#3720)。処理を借りる呼び出しだけが帯の中に芯を持つ
    const motion = motionFrom(rendered as unknown as Rendered);
    const streamOf = (index: number): Element[] => partsOf(motion, `[data-pipe-call="${index}"][data-pipe-pipe="open"]`).filter((el) => el.classList.contains("dg-pp-cstream"));
    for (const index of [0, 1, 2]) expect(streamOf(index).length, `${index + 1} 番目の呼び出しの開いた管を流れる帯で描かない`).toBeGreaterThan(0);
    expect(strokeWidthOf(svg, streamOf(2)[0]?.querySelector(".dg-pp-ctrack") as Element), "描いた書き込めない呼び出しの管の帯の太さ").toBe(strokeWidthOf(svg, streamOf(0)[0]?.querySelector(".dg-pp-ctrack") as Element));
  });

  it("pipe-move-shifts-tank-levels", () => {
    const { moved: rendered, crowded } = MOVED.get();
    const { layout, svg } = rendered;
    // 水位はトークンごとに量に比例し、0 より多い量は最小の帯より低くならない。0 の槽は空
    for (let s = 0; s <= 3; s++) {
      const alice = levelOf(layout, "alice", "USDC", s);
      const pool = levelOf(layout, "pool", "USDC", s);
      expect(alice.h / pool.h / (Number(alice.amount) / Number(pool.amount)), `段 ${s + 1} の Alice と Pool の水位が量に比例しない`).toBeCloseTo(1, 1);
      const dust = levelOf(layout, "bob", "USDC", s);
      expect(dust.h, `段 ${s + 1} のごく少ない Bob の水位が最小の帯より低い`).toBeGreaterThanOrEqual(BAND_LEAST);
      expect(dust.h, `段 ${s + 1} のごく少ない Bob の水位が Alice より高い`).toBeLessThan(alice.h);
      expect(levelOf(layout, "carol", "USDC", s).h, `段 ${s + 1} の空の Carol の槽に水がある`).toBe(0);
      for (const level of [alice, pool, dust]) {
        const tank = tankOf(layout, level.party, level.token);
        expect(level.y >= tank.y && level.y + level.h <= tank.y + tank.h, `段 ${s + 1} の ${level.party} の水が槽からはみ出す`).toBe(true);
      }
    }
    // move の段で、送り手の槽が下がって受け手の槽が上がる
    const before = { alice: levelOf(layout, "alice", "USDC", 0), pool: levelOf(layout, "pool", "USDC", 0) };
    const after = { alice: levelOf(layout, "alice", "USDC", 1), pool: levelOf(layout, "pool", "USDC", 1) };
    expect(after.alice.h, "move の段で Alice の槽が下がらない").toBeLessThan(before.alice.h);
    expect(after.pool.h, "move の段で Pool の槽が上がらない").toBeGreaterThan(before.pool.h);
    // 前の量は書かず、残高の下に増えた分か減った分を単位つきで書く (#3418)
    expect([after.alice.amount, after.alice.delta?.text, after.pool.amount, after.pool.delta?.text], "move の段の量と増減").toEqual(["900", "−100 USDC", "2100", "+100 USDC"]);
    expect([after.alice.state, after.pool.state, levelOf(layout, "bob", "USDC", 1).state], "move の段の槽の印").toEqual(["provisional", "provisional", "none"]);
    // 管を流れた分は、確定するまで斜線の暫定で描く
    expect(
      layout.flows.map((f) => [f.step, f.token, f.from, f.to, f.amount, f.state]),
      "管を流れた分",
    ).toEqual([
      [1, "USDC", "alice", "pool", "100", "provisional"],
      [2, "USDC", "alice", "pool", "100", "provisional"],
      [3, "USDC", "alice", "pool", "100", "final"],
    ]);
    // 同じ段に描く流れた分は、横の線どうしも縦の線どうしも少しずれて並ばない (Aggregator の箱を開いた図は、同じトークンの流れを 1 段に 3 本より多く描く)。
    // 同じトークンで同じ持ち主の槽を端に持つ流れは、向きを問わず 1 本の幹を共に通るため、同じ筋の上で重なる所だけは数えない (#3418)
    const segmentsOf = (f: Flow): { flat: boolean; at: number; lo: number; hi: number }[] =>
      f.points.slice(1).map((b, i) => {
        const a = f.points[i] as Point;
        const flat = Math.abs(a[1] - b[1]) < 0.5;
        return flat ? { flat, at: a[1], lo: Math.min(a[0], b[0]), hi: Math.max(a[0], b[0]) } : { flat, at: a[0], lo: Math.min(a[1], b[1]), hi: Math.max(a[1], b[1]) };
      });
    const busiest = Math.max(
      ...crowded.flows.map((f) => crowded.flows.filter((g) => g.step === f.step && g.token === f.token).length),
    );
    expect(busiest, "Aggregator の箱を開いた図で、1 段に同じトークンの流れを描く数").toBeGreaterThan(3);
    for (const [k, f] of crowded.flows.entries())
      for (const g of crowded.flows.slice(k + 1).filter((x) => x.step === f.step)) {
        const trunk = f.token === g.token && [f.from, f.to].some((end) => end === g.from || end === g.to);
        for (const a of segmentsOf(f))
          for (const b of segmentsOf(g)) {
            const touches = a.flat === b.flat && Math.abs(a.at - b.at) < FLOW_WIDTH && a.lo < b.hi && b.lo < a.hi && !(trunk && Math.abs(a.at - b.at) < 0.5);
            expect(touches, `段 ${f.step + 1} の ${f.from}→${f.to} と ${g.from}→${g.to} の流れの線が重なる`).toBe(false);
          }
      }
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const s of [1, 2]) {
      const sel = `[data-pipe-flow][data-pipe-step="${s}"]`;
      expect(seen(motion, sel, stillOf(rendered, s)), `段 ${s + 1} に流れた分が見えない`).toBeGreaterThan(0.9);
    }
    // 管を流れた分は、流れた段に両端の槽の数が前の額から次の額へ数えて見せ (Tracelyth #221、#3761)、確定するまでの斜線は受け手の槽が持つ。管には斜線を残さない (試作の4配管と同じ、#3398)
    expect(countsFromTo(tankCount(rendered, motion, 1, "pool", "USDC"), "2,000", "2,100"), "段 2 で Pool の USDC の槽の数が 2,000 から 2,100 へ数えない").toBe(true);
    expect(countsFromTo(tankCount(rendered, motion, 1, "alice", "USDC"), "1,000", "900"), "段 2 で Alice の USDC の槽の数が 1,000 から 900 へ数えない").toBe(true);
    expect(
      partsOf(motion, '[data-pipe-flow][data-pipe-step="2"]').some((el) => hatched(svg, el)),
      "段 3 の管に流れた分の斜線が残る",
    ).toBe(false);
    const poolAt = (s: number): string => `[data-pipe-level="pool"][data-pipe-token="USDC"][data-pipe-step="${s}"]`;
    expect(
      partsOf(motion, poolAt(2)).some((el) => hatched(svg, el)),
      "確定する前の段 3 の Pool の上がった分が斜線でない",
    ).toBe(true);
    expect(partsOf(motion, poolAt(1))[0]?.getAttribute("data-pipe-state"), "move の段の Pool の水の印").toBe("provisional");
    expect(
      partsOf(motion, poolAt(1)).some((el) => hatched(svg, el)),
      "move の段の Pool の上がった分が斜線でない",
    ).toBe(true);
    expect(seen(motion, poolAt(1), stillOf(rendered, 1)), "move の段の Pool の水が見えない").toBeGreaterThan(0.9);
    expect(seen(motion, poolAt(1), stillOf(rendered, 3)), "段 2 の Pool の水が段 4 に見える").toBeLessThan(0.1);
    expect(
      partsOf(motion, poolAt(3)).some((el) => hatched(svg, el)),
      "確定した Pool の水が斜線のまま",
    ).toBe(false);
  });

});

describe("配管の図の確定と取り消し (#3389)", () => {
  it("pipe-outer-return-finalizes-changes", () => {
    const source = exampleJson("swap.json");
    const rendered = render(source);
    const { layout, svg } = rendered;
    const last = lastStep(source);
    // 内側の呼び出しの return では暫定のまま
    const inner = last - 1;
    const statesAt = (s: number): State[] => [
      ...layout.levels.filter((l) => l.step === s).map((l) => l.state),
      ...layout.plates.filter((p) => p.step === s).map((p) => p.state),
      ...layout.events.filter((e) => e.step === s).map((e) => e.state),
      ...layout.flows.filter((f) => f.step === s).map((f) => f.state),
    ];
    expect(statesAt(inner), "内側の呼び出しが戻った段に暫定の物が無い").toContain("provisional");
    for (let s = 0; s < last; s++) expect(statesAt(s), `一番外が戻る前の段 ${s + 1} に確定した物がある`).not.toContain("final");
    // 一番外の呼び出しが return した段で、暫定だった槽と値の札とイベントが全て確定の緑に替わる
    expect(statesAt(last), "一番外が戻った段に暫定の物が残る").not.toContain("provisional");
    for (const key of ["alice|USDC", "pool|USDC", "pool|WETH", "bob|WETH"]) {
      const [party = "", token = ""] = key.split("|");
      expect(levelOf(layout, party, token, last).state, `最後の段の ${party} の ${token} の槽`).toBe("final");
    }
    expect(plateOf(layout, "usdc", "allowance[alice][router]", last).state, "最後の段の許可額の札").toBe("final");
    expect(
      layout.events.filter((e) => e.step === last).map((e) => e.state),
      "最後の段のイベントの札",
    ).toEqual(["final", "final"]);
    const motion = motionFrom(rendered as unknown as Rendered);
    const finals = ["data-pipe-level", "data-pipe-plate", "data-pipe-event"].flatMap((attr) => partsOf(motion, `[${attr}][data-pipe-step="${last}"][data-pipe-state="final"]`));
    expect(
      finals.filter((el) => roleOf(svg, el) !== "green").map((el) => el.outerHTML.slice(0, 120)),
      "最後の段の確定した槽と値の札とイベントが確定の緑 (c-green) でない",
    ).toEqual([]);
  });

  it("pipe-outer-revert-undoes-everything", () => {
    const source = exampleJson("swap-revert.json");
    const rendered = render(source);
    const { layout } = rendered;
    const last = lastStep(source);
    const initials = initialsOf(source as unknown as Source);
    // 一番外の呼び出しが revert した段で、全ての槽と値の札が元の値へ戻る
    for (const level of layout.levels.filter((l) => l.step === last))
      expect(level.amount, `最後の段の ${level.party} の ${level.token} の量が元へ戻らない`).toBe(initials.get(`${level.party}|${level.token}`));
    // トークンの箱の残高の行の札 (`balanceOf[<持ち主>]`、Tracelyth #171、#175、#3720) は、持ち主のそのトークンの槽の始めの量へ戻る
    const boxes = (source as unknown as Source).blocks.box ?? [];
    const idOf = new Map(boxes.map((b) => [b.name, b.id]));
    const nameOf = new Map(boxes.map((b) => [b.id, b.name]));
    const initialOf = (party: string, name: string): string | undefined => {
      const holder = /^balanceOf\[(.+)\]$/u.exec(name)?.[1];
      return holder === undefined ? initials.get(`${party}|${name}`) : initials.get(`${idOf.get(holder) ?? holder}|${nameOf.get(party) ?? party}`);
    };
    for (const plate of layout.plates.filter((p) => p.step === last))
      expect(plate.value, `最後の段の ${plate.party} の ${plate.name} の札が元へ戻らない`).toBe(initialOf(plate.party, plate.name));
    expect([levelOf(layout, "alice", "USDC", last).state, levelOf(layout, "pool", "USDC", last).state], "移した槽の取り消しの印").toEqual(["rolled", "rolled"]);
    expect(plateOf(layout, "usdc", "allowance[alice][router]", last).state, "書き替えた札の取り消しの印").toBe("rolled");
    // 移した分とイベントが取り消しの印で描かれる
    const flows = layout.flows.filter((f) => f.step === last);
    expect(flows.length, "最後の段に移した分が無い").toBeGreaterThan(0);
    expect(new Set(flows.map((f) => f.state)), "最後の段の移した分の印").toEqual(new Set(["rolled"]));
    expect(
      layout.events.filter((e) => e.step === last).map((e) => e.state),
      "最後の段のイベントの札の印",
    ).toEqual(["rolled"]);
    const motion = motionFrom(rendered as unknown as Rendered);
    expect(
      partsOf(motion, `[data-pipe-flow][data-pipe-step="${last}"]`).map((el) => el.getAttribute("data-pipe-state")),
      "描いた最後の段の移した分の印",
    ).not.toContain("provisional");
    expect(seen(motion, `[data-pipe-event][data-pipe-step="${last}"][data-pipe-state="rolled"]`, stillOf(rendered, last)), "最後の段に取り消したイベントの札が見えない").toBeGreaterThan(0.9);
  });

  it("pipe-inner-revert-undoes-only-inside", () => {
    const rendered = render(innerPipe());
    const { layout } = rendered;
    // 落ちた呼び出しの内側の変更 (槽、値の札、イベント) だけが元へ戻る
    expect([plateOf(layout, "pool1", "locked", 3).value, plateOf(layout, "pool1", "locked", 3).state], "落ちる前の段の Pool1 の札").toEqual(["true", "provisional"]);
    expect([plateOf(layout, "pool1", "locked", 4).value, plateOf(layout, "pool1", "locked", 4).state], "落ちた段の Pool1 の札").toEqual(["false", "rolled"]);
    expect([levelOf(layout, "alice", "USDC", 4).amount, levelOf(layout, "alice", "USDC", 4).state], "落ちた段の Alice の USDC").toEqual(["100", "rolled"]);
    expect([levelOf(layout, "pool1", "USDC", 4).amount, levelOf(layout, "pool1", "USDC", 4).state], "落ちた段の Pool1 の USDC").toEqual(["0", "rolled"]);
    expect(
      layout.events.filter((e) => e.step === 4).map((e) => [e.text.text, e.state]),
      "落ちた段のイベントの札",
    ).toEqual([["USDC.Transfer", "rolled"]]);
    expect(
      layout.flows.filter((f) => f.step === 4).map((f) => [f.from, f.to, f.state]),
      "落ちた段の流れた分",
    ).toEqual([["alice", "pool1", "rolled"]]);
    // 呼んだ側の変更は暫定のまま残る
    expect([plateOf(layout, "router", "tries", 4).value, plateOf(layout, "router", "tries", 4).state], "落ちた段の Router の札").toEqual(["1", "provisional"]);
    // 落ちた呼び出しの管は閉じ、呼んだ側の呼び出しは開いたまま
    expect(
      layout.calls.map((c) => [c.from, c.to, c.close?.step, c.close?.how]),
      "呼び出しを閉じた段と閉じ方",
    ).toEqual([
      ["alice", "router", 6, "return"],
      ["router", "pool1", 4, "revert"],
      ["pool1", "usdc", 2, "return"],
      ["pool1", "weth", 4, "revert"],
      ["router", "pool2", 5, "return"],
      ["pool2", "usdc", 5, "return"],
      ["pool2", "weth", 5, "return"],
    ]);
    // 呼んだ側の次の行から続けて描く
    expect(callAt(layout, 4).depth, "やり直しの呼び出しの深さが落ちた呼び出しと違う").toBe(callAt(layout, 1).depth);
    expect([levelOf(layout, "alice", "USDC", 5).amount, levelOf(layout, "alice", "USDC", 5).state], "やり直した段の Alice の USDC").toEqual(["0", "provisional"]);
    expect([levelOf(layout, "pool2", "USDC", 5).amount, levelOf(layout, "pool2", "USDC", 5).state], "やり直した段の Pool2 の USDC").toEqual(["100", "provisional"]);
    expect(plateOf(layout, "router", "tries", 5).state, "やり直した段の Router の札").toBe("provisional");
    expect(
      [plateOf(layout, "router", "tries", 6).state, levelOf(layout, "alice", "WETH", 6).state, levelOf(layout, "alice", "WETH", 6).amount],
      "一番外が戻った段の Router の札と Alice の WETH",
    ).toEqual(["final", "final", "0.05"]);
  });
});

describe("大きな Trace の縮め方 (#3389)", () => {
  it("pipe-fold-collapses-inner-calls", () => {
    const source = foldPipe();
    const rendered = render(source, "ja");
    const { layout, timeline } = rendered;
    // [fold] の呼び出しの内側 (段 3 から段 5) を 1 つの箱にまとめ、内側の段の数と関係者の数を出す
    expect(timeline.steps.length, "畳んだ図の段の数").toBe(5);
    expect(
      layout.folds.map((f) => [f.call, f.step, f.steps, f.parties]),
      "畳んだ箱",
    ).toEqual([[1, 2, 3, 4]]);
    expect(callAt(layout, 1).to, "畳んだ呼び出しの呼ばれた者").toBe("agg");
    const text = layout.folds[0]?.text.text ?? "";
    expect(text, "畳んだ箱の字が内側の段の数を出さない").toContain("3段");
    expect(text, "畳んだ箱の字が内側の関係者の数を出さない").toContain("4人");
    const english = render(source, "en").layout.folds[0]?.text.text ?? "";
    expect(english, "英語の畳んだ箱の字が内側の段の数と関係者の数を出さない").toMatch(/3[^\d]+4|4[^\d]+3/u);
    expect(KANA.test(english), `英語の畳んだ箱の字に仮名か漢字がある: ${english}`).toBe(false);
    // 畳んだ間は、内側にしか出ない関係者 (USDC、Pool、WETH、Vault) の列と名札と槽と値の札と、内側にしか出ないトークンの Contract の弁を描かない
    const inner = ["usdc", "pool", "weth", "vault"];
    expect(
      layout.parties.map((p) => p.id),
      "畳んだ図の関係者の並び",
    ).toEqual(["alice", "router", "agg"]);
    for (const [what, owners] of [
      ["列", layout.columns.map((c) => c.party)],
      ["名札", layout.pills.map((p) => p.party)],
      ["槽", layout.tanks.map((t) => t.party)],
      ["段ごとの槽", layout.glasses.map((g) => g.party)],
      ["水位", layout.levels.map((l) => l.party)],
      ["値の札", layout.plates.map((p) => p.party)],
      ["管の弁", [...layout.buses, ...layout.pipes].flatMap((b) => (b.valve ? [b.valve.party] : []))],
      ["流れた分", layout.flows.flatMap((f) => [f.from, f.to])],
    ] as const)
      expect(
        owners.filter((id) => inner.includes(id)),
        `畳んだ図に内側にしか出ない関係者の${what}がある`,
      ).toEqual([]);
    // 見えている Alice の量が内側で変わるトークンの管は残し、内側の流れは描かない
    expect(layout.buses.map((b) => b.token).sort(), "畳んだ図の管のトークン").toEqual(["USDC", "WETH"]);
    expect(
      layout.flows.filter((f) => f.step === 2),
      "畳んだ箱の段に内側の流れを描く",
    ).toEqual([]);
    // 畳んだ箱の段では、内側の move をまとめて、見えている関係者の量の差し引きだけを 1 段で槽に出す
    const aliceAt = (s: number): [string, string, string | undefined][] =>
      ["USDC", "WETH"].map((token) => {
        const level = levelOf(layout, "alice", token, s);
        return [level.amount, level.state, level.delta?.text];
      });
    expect(aliceAt(1), "畳んだ箱の前の段の Alice の槽").toEqual([
      ["100", "none", undefined],
      ["0", "none", undefined],
    ]);
    expect(aliceAt(2), "畳んだ箱の段の Alice の槽").toEqual([
      ["0", "provisional", "−100 USDC"],
      ["1", "provisional", "+1 WETH"],
    ]);
    // 箱を開いた図は、内側の関係者の列と槽と値の札を今まで通りに描き、内側の最後の段の量が畳んだ箱の段の量と同じになる
    const opened = render(source, "ja", undefined, [1]).layout;
    expect(opened.folds, "開いた図に畳んだ箱がある").toEqual([]);
    expect(
      opened.parties.map((p) => p.id),
      "開いた図の関係者の並び",
    ).toEqual(["alice", "router", "agg", "usdc", "pool", "weth", "vault"]);
    expect(
      [levelOf(opened, "pool", "USDC", 1).amount, levelOf(opened, "pool", "WETH", 1).amount],
      "開いた図の、内側の前の段の Pool の槽",
    ).toEqual(["0", "10"]);
    const lastInner = ["alice|USDC", "pool|USDC", "pool|WETH", "alice|WETH"].map((key) => {
      const [party = "", token = ""] = key.split("|");
      const level = levelOf(opened, party, token, 4);
      return [level.amount, level.state];
    });
    expect(lastInner, "開いた図の内側の最後の段の槽").toEqual([
      ["0", "provisional"],
      ["100", "provisional"],
      ["9", "provisional"],
      ["1", "provisional"],
    ]);
    expect(plateOf(opened, "vault", "count", 4).value, "開いた図の内側の最後の段の Vault の値の札").toBe("1");
    expect(
      ["USDC", "WETH"].map((token) => levelOf(opened, "alice", token, 4).amount),
      "開いた図の内側の最後の段の Alice の量が、畳んだ箱の段の量と違う",
    ).toEqual(aliceAt(2).map(([amount]) => amount));
    const motion = motionFrom(rendered as unknown as Rendered);
    expect(seen(motion, '[data-pipe-fold="1"]', stillOf(rendered, 2)), "畳んだ箱が見えない").toBeGreaterThan(0.9);
    // 箱を押すと、内側の段を開いて描く
    const host = document.createElement("div");
    document.body.appendChild(host);
    let player: { destroy(): void } | undefined;
    let refusal = "";
    try {
      player = draw("mountDiagram")(host, source);
    } catch (error) {
      refusal = String(error);
    }
    try {
      expect(refusal, "配管の図を再生の部品に置けない").toBe("");
      const count = (): number => host.querySelectorAll('[data-dragon="steps"] > li').length;
      expect(count(), "再生の部品に置いた畳んだ図の段の数").toBe(5);
      const folded = host.querySelector('[data-pipe-fold="1"]');
      expect(folded, "再生の部品に置いた図に畳んだ箱が無い").not.toBeNull();
      expect(host.querySelector('[data-pipe-party="pool"]'), "再生の部品に置いた畳んだ図に内側にしか出ない Pool の名札がある").toBeNull();
      folded?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(count(), "畳んだ箱を押しても内側の段を開かない").toBe(7);
      expect(host.querySelector('[data-pipe-party="pool"]'), "畳んだ箱を押しても内側の Pool の名札を描かない").not.toBeNull();
    } finally {
      player?.destroy();
      host.remove();
    }
  });
});

describe("配管の図の見本 (#3389)", () => {
  it("swap-renders-every-step", () => {
    for (const [file, outcome] of [
      ["swap.json", "final"],
      ["swap-revert.json", "rolled"],
    ] as const) {
      const source = exampleJson(file);
      const steps = (source as unknown as Source).steps.length;
      const rendered = render(source);
      const { layout, timeline, svg } = rendered;
      // 原本の段の数だけ順に動く
      expect(timeline.steps, `${file} の時刻の表の段の数`).toHaveLength(steps);
      timeline.steps.forEach((step, i) => {
        expect(step.end, `${file} の段 ${i + 1} の長さ`).toBeGreaterThan(step.start);
        if (i > 0) expect(step.start, `${file} の段 ${i + 1} の始まり`).toBeGreaterThanOrEqual((timeline.steps[i - 1]?.end ?? Number.POSITIVE_INFINITY) - 1e-9);
        expect(covers(step, stillOf(rendered, i)), `${file} の段 ${i + 1} の止め絵がその段の間に無い`).toBe(true);
      });
      const last = steps - 1;
      const changed = layout.levels.filter((l) => l.step === last - 1 && l.state === "provisional").map((l) => `${l.party}|${l.token}`);
      expect(changed.length, `${file} の最後の 1 つ前の段に暫定の槽が無い`).toBeGreaterThan(0);
      const motion = motionFrom(rendered as unknown as Rendered);
      if (outcome === "final") {
        // 成功の図は最後の段で全てが確定の緑になる
        for (const key of changed) {
          const [party = "", token = ""] = key.split("|");
          expect(levelOf(layout, party, token, last).state, `${file} の最後の段の ${party} の ${token}`).toBe("final");
          const sel = `[data-pipe-level="${party}"][data-pipe-token="${token}"][data-pipe-step="${last}"]`;
          expect(seen(motion, sel, stillOf(rendered, last)), `${file} の最後の段の ${party} の ${token} の水が見えない`).toBeGreaterThan(0.9);
          expect(roleOf(svg, partsOf(motion, sel)[0] as Element), `${file} の最後の段の ${party} の ${token} が確定の緑でない`).toBe("green");
        }
      } else {
        // 取り消しの図は最後の段で全てが元へ戻る
        const initials = initialsOf(source as unknown as Source);
        for (const key of changed) {
          const [party = "", token = ""] = key.split("|");
          const level = levelOf(layout, party, token, last);
          expect([level.amount, level.state], `${file} の最後の段の ${party} の ${token}`).toEqual([initials.get(key), "rolled"]);
          const sel = `[data-pipe-level="${party}"][data-pipe-token="${token}"][data-pipe-step="${last}"][data-pipe-state="rolled"]`;
          expect(seen(motion, sel, stillOf(rendered, last)), `${file} の最後の段の ${party} の ${token} の取り消しが見えない`).toBeGreaterThan(0.9);
        }
      }
    }
  });

  it("pipe-keeps-motion-rules", () => {
    const { timeline } = render(exampleJson("swap.json"));
    expect(sampleTimes(timeline).length, "交換の図を 0.25 秒ごとに数えた時刻").toBeGreaterThan(0);
    expect(
      timeline.badges.map((b) => b.step),
      "交換の図の段の番号",
    ).toEqual(timeline.steps.map((_, i) => i));
    for (const badge of timeline.badges) {
      const step = timeline.steps[badge.step];
      expect(badge.appears, `交換の図の段 ${badge.step + 1} の番号が段より前に出る`).toBeGreaterThanOrEqual(step?.start ?? Number.POSITIVE_INFINITY);
    }
    for (const t of sampleTimes(timeline)) {
      const early = timeline.badges.filter((b) => b.appears <= t && (timeline.steps[b.step]?.start ?? Number.POSITIVE_INFINITY) > t).map((b) => b.step + 1);
      expect(early, `交換の図の ${t} 秒に、始まっていない段の番号が出る`).toEqual([]);
    }
  });

  // 全ての色味と明暗を 1 件で描くと、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。色味と明暗ごとの件に分ける
  describe.for(Object.keys(draw("PALETTES")).flatMap((palette) => (["light", "dark"] as const).map((theme) => [`${palette} ${theme}`, palette, theme] as const)))("%s", ([, palette, theme]) => {
    it("pipe-layout-same-in-every-palette", () => {
      const { source, base } = SWAP_BASE.get();
      const palettes = draw("PALETTES");
      const rendered = draw("renderDiagram")(source, { palette, theme });
      expect(rendered.layout, `色味 ${palette} (${theme}) の置き場所が既定の色味と違う`).toEqual(base.layout);
      // 角を落とす色味 (#3344) は箱の形を変えるため、SVG は既定の色味と同じ角の形の色味だけで比べる
      if (palettes[palette]?.corner !== palettes.paper?.corner) return;
      expect(shapeOf(rendered.svg), `色味 ${palette} (${theme}) の SVG が色の値の外で既定の色味と違う`).toBe(shapeOf(base.svg));
    });
  });

  it("pipe-example-files-match", () => {
    const parse = api("parseNotation");
    for (const name of SAMPLES) {
      for (const file of [`${name}.dragon`, `${name}.en.dragon`, `${name}.json`, `${name}.en.json`])
        expect(existsSync(join(EXAMPLES, file)), `${file} が packages/dragon/examples に無い`).toBe(true);
      const ja = parse(fileText(`${name}.dragon`) ?? "", { lang: "ja" });
      const en = parse(fileText(`${name}.en.dragon`) ?? "", { lang: "en" });
      expect(ja.ok && en.ok, `${name} の見本の記法が読めない: ${JSON.stringify([ja.ok || ja.errors, en.ok || en.errors])}`).toBe(true);
      if (!ja.ok || !en.ok) continue;
      expect((ja.diagram as unknown as Source).kind, `${name} の見本の図の種類`).toBe("pipe");
      expect(shape(en.diagram as unknown as Source), `${name} の英語版の関係者と段と出来事の数が日本語版と違う`).toEqual(shape(ja.diagram as unknown as Source));
    }
  });
});

describe("配管の図の書き方の文書 (#3389)", () => {
  it("docs-describe-pipe-diagram", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    /** 頭の語 `pipe` と、行の形 (`hold <持ち主>: …` か `hold alice: …`) */
    const forms: [string, RegExp][] = [
      ["pipe", /(^|[\s`])pipe [^\s`]/mu],
      ...PIPE_WORDS.map((word): [string, RegExp] => [word, new RegExp(`(^|[\\s\`])${word} (<[^>]+>|[^\\s:\`]+):`, "mu")]),
    ];
    const marks = ["[value: ", "[call: ", "[fold]", "[fail]"];
    const describes = (where: string, text: string): void => {
      for (const [word, form] of forms) expect(form.test(text), `${where} に ${word} の行の書き方が無い`).toBe(true);
      for (const mark of marks) expect(text, `${where} に印 ${mark.trim()} の書き方が無い`).toContain(mark);
    };
    const pipeFences = (text: string): number =>
      extract(text).filter((fence) => {
        const parsed = parse(fence.source);
        return parsed.ok && (parsed.diagram as unknown as Source).kind === "pipe";
      }).length;
    for (const path of ["README.md", "packages/dragon/README.md", "packages/dragon/examples/quick-start.md", "packages/dragon/examples/quick-start.en.md"]) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      describes(path, text);
      if (path !== "README.md") expect(pipeFences(text), `${path} に配管の図として読める dragon の囲みが無い`).toBeGreaterThan(0);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    expect(/SECTIONS = \[[^\]]*"pipe"/u.test(content), "使い方の頁の節に配管の図 (pipe) が無い").toBe(true);
    const sections = ["pipe.dragon", "pipe.en.dragon"].map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    for (const [i, text] of sections.entries()) {
      const parsed = parse(text, { lang: i === 0 ? "ja" : "en" });
      expect(parsed.ok && (parsed.diagram as unknown as Source).kind, `使い方の頁の配管の図の節の例 (${i === 0 ? "pipe.dragon" : "pipe.en.dragon"}) が配管の図として読めない`).toBe("pipe");
    }
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    describes("使い方の頁", [content, ...sections, ...paragraphs].join("\n"));
  });
});

describe("段の要点 (#3464)", () => {
  /** 配管の図の小さな記法。段 1 に要点の行 `gist` を足せる。記法を読んで書き戻した決まった形で書く */
  const smallPipe = (gists: string[] = []): string =>
    [
      "pipe small",
      "",
      "box alice",
      "box router",
      "",
      "hold alice: 2 ETH",
      "",
      "step go",
      "  say go.",
      ...gists,
      "  alice -> router: swap",
      "  return router: done",
      "",
      "step end",
      "  say end.",
      "  alice -> router: ping",
      "  return router: pong",
      "",
    ].join("\n");
  const readRepo = (path: string): string => readFileSync(join(ROOT, path), "utf8");

  it("pipe-step-gist-roundtrip", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const validate = api("validateDiagram");
    for (const [lang, gist] of [
      ["ja", "全ての変更がここで確定する"],
      ["en", "Every change becomes final here"],
    ] as const) {
      const text = smallPipe([`  gist ${gist}`]);
      const parsed = parse(text, { lang });
      expect(parsed.ok, `要点の行を書いた配管の図が読めない (${lang}): ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
      if (!parsed.ok) continue;
      // 要点を書いた段だけが要点の欄を持つ
      const steps = (parsed.diagram as unknown as { steps: { gist?: string }[] }).steps;
      expect(steps.map((step) => step.gist), `段の要点 (${lang})`).toEqual([gist, undefined]);
      expect(validate(parsed.diagram, { lang }), `要点を持つ配管の図の原本 (${lang})`).toEqual({ ok: true });
      expect(print(parsed.diagram), `書き戻した記法 (${lang})`).toBe(text);
    }
  });

  it("pipe-gist-only-in-pipe", () => {
    const parse = api("parseNotation");
    const validate = api("validateDiagram");
    const heads: [string, string[]][] = [
      ["時系列図", ["sequence 要点の行", "box a", "step 送る", "  say 送る。"]],
      ["構成図", ["architecture 要点の行", "box a", "step 送る", "  say 送る。"]],
      ["状態遷移図", ["state 要点の行", "box a", "step 送る", "  say 送る。"]],
      ["枝分かれの図", ["git 要点の行", "branch main", "step 積む", "  say 積む。"]],
      ["時間軸の図", ["time 要点の行", "scale slot 12s 4", "row a", "step 進む", "  say 進む。"]],
      ["木の図", ["tree 要点の行", "step 葉", "  say 葉。", "  leaf x1"]],
      ["列の図", ["lineup 要点の行", "box a", "item x", "step 並べる", "  say 並べる。"]],
      ["試す図", ["try 要点の行", "queue q [order: f]", "ask n, f [into: q]", "item x [f: 1]", "step 送る", "  say 送る。"]],
    ];
    for (const lang of ["ja", "en"] as const) {
      /** 記法 `lines` を読んだ最初の誤り */
      const firstError = (lines: string[]): LineError | undefined => {
        const parsed = parse(lines.join("\n"), { lang });
        return parsed.ok ? undefined : parsed.errors[0];
      };
      const englishOnly = (message: string, name: string): void => {
        if (lang === "en") expect(KANA.test(message), `${name} の英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
      };
      // 配管の図でない図では、行を名指して配管の図だけで書けると知らせる
      for (const [name, head] of heads) {
        const first = firstError([...head, "  gist 要点"]);
        expect(first?.line, `${name} の gist の行が ${head.length + 1} 行目の誤りにならない (${lang})`).toBe(head.length + 1);
        expect(first?.column, `${name} の gist の行の誤りが列を名指さない (${lang})`).toBeGreaterThan(0);
        expect(first?.message ?? "", `${name} の gist の誤りの文が配管の図 (pipe) を名指さない (${lang})`).toContain("pipe");
        englishOnly(first?.message ?? "", `${name} の gist`);
      }
      // 1 つの段に 2 行書いた時と、要点の文が空の時も、その行を名指して止まる
      const lines = smallPipe().split("\n");
      const say = lines.indexOf("  say go.");
      for (const [name, gists] of [
        ["2 行目の gist", ["  gist 一つ目", "  gist 二つ目"]],
        ["空の gist", ["  gist"]],
      ] as const) {
        const first = firstError([...lines.slice(0, say + 1), ...gists, ...lines.slice(say + 1)]);
        expect(first?.line, `${name} の行が誤りにならない (${lang})`).toBe(say + 1 + gists.length);
        expect(first?.column, `${name} の誤りが列を名指さない (${lang})`).toBeGreaterThan(0);
        englishOnly(first?.message ?? "", name);
      }
      // 原本の JSON で配管の図でない図の段が要点の欄を持つと、その欄の場所を名指して断る
      const result = validate(patched(smallSequence(), ["steps", 0, "gist"], "要点"), { lang });
      expect(pointers(result), `時系列図の段の要点の欄 (${lang})`).toEqual(["/steps/0/gist"]);
      englishOnly(result.ok ? "" : (result.errors[0]?.message ?? ""), "時系列図の段の要点の欄");
    }
  });

  it("pipe-examples-carry-gists", () => {
    /** 見本ごとの、要点を持つ段 (1 から) と、要点の文が含む語 (日本語版、英語版) */
    const want: Record<(typeof SAMPLES)[number], Record<number, [string[], string[]]>> = {
      swap: { 6: [["暫定"], ["provisional"]], 13: [["暫定"], ["provisional"]], 14: [["確定"], ["final"]] },
      "swap-revert": {},
      "swap-two-hops": { 13: [["確定"], ["final"]] },
      "swap-retry": { 7: [["Pool1", "内側"], ["pool 1", "inside"]], 11: [["確定"], ["final"]] },
      "vault-proxy": { 2: [["Proxyの値"], ["proxy"]], 4: [["書き込めない"], ["written"]], 9: [["確定"], ["final"]] },
      aggregator: { 3: [["押すと開く"], ["press"]], 14: [["確定"], ["final"]] },
    };
    for (const sample of SAMPLES) {
      for (const lang of ["ja", "en"] as const) {
        const file = lang === "ja" ? `${sample}.json` : `${sample}.en.json`;
        const steps = (JSON.parse(readFileSync(join(EXAMPLES, file), "utf8")) as { steps: { gist?: string }[] }).steps;
        steps.forEach((step, i) => {
          const words = want[sample][i + 1];
          if (!words) {
            expect(step.gist, `${file} の段 ${i + 1} が要点を持つ`).toBeUndefined();
            return;
          }
          const gist = step.gist ?? "";
          expect(gist, `${file} の段 ${i + 1} が要点を持たない`).not.toBe("");
          for (const word of words[lang === "ja" ? 0 : 1]) expect(gist.toLowerCase(), `${file} の段 ${i + 1} の要点`).toContain(word.toLowerCase());
        });
      }
    }
  });

  it("docs-describe-gist", () => {
    /** 見出し `heading` から、次の同じ深さの見出し `next` まで */
    const sectionOf = (text: string, heading: string, next: string): string => {
      const start = text.indexOf(heading);
      if (start < 0) return "";
      const end = text.indexOf(next, start + heading.length);
      return text.slice(start, end < 0 ? undefined : end);
    };
    for (const [path, heading, form] of [
      ["packages/dragon/README.ja.md", "### 配管の図", "gist <要点>"],
      ["packages/dragon/README.md", "### Pipe diagram", "gist <key point>"],
    ] as const) {
      const section = sectionOf(readRepo(path), heading, "\n### ");
      expect(section, `${path} に配管の図の小節 (${heading}) が無い`).not.toBe("");
      expect(section, `${path} の配管の図の小節に gist の書き方が無い`).toContain(form);
    }
    const skill = "plugins/dragon/skills/dragon/references/kinds/pipe.md";
    const table = sectionOf(readRepo(skill), "## Lines in a step", "\n## ");
    expect(table, `${skill} に段の行の表が無い`).not.toBe("");
    expect(table, `${skill} の段の行の表に gist の書き方が無い`).toContain("`gist <key point>`");
  });
});
