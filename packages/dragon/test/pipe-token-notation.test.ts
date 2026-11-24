/**
 * 配管の図の発行と焼却とトークンの番号の書き方 (#3722)。
 *
 * 記法の決まり (親の課題 #3718 の step 2 で本人が選んだ形)
 *
 * - 発行は `mint <トークンの Contract>: <量> -> <受け手>`、焼却は `burn <トークンの Contract>: <量> <持ち主>`。
 *   ゼロのアドレスを関係者として書かず、受け手の槽だけが増え、持ち主の槽だけが減る
 * - NFT と ERC-1155 は `#` の後をトークンの番号、前を数にする (`move art: #1 alice -> bob`、`move items: 2 #1 alice -> bob`)。
 *   数を省いた `#1` は 1 つを表す。番号の付いた残高も `hold alice: #1 ART`、`hold alice: 5 #1 ITEMS` と書く
 * - `#` の後に番号の無い行は、読む時に誤りとして拒む
 * - 数を移す `move usdc: 100 alice -> bob` の原本と書き戻しと描き方は変えない
 *
 * 描いた槽は `layoutPipe` の `levels` を段ごとに読む。番号の付いた残高の槽は `<トークン> #<番号>` の名前で並ぶ
 *
 * トークンの箱の名前の下の字 (#3803 の step 2 で本人が選んだ形)
 *
 * - `box usdc as USDC [note: Holding]` の `note` を名前の下に描き、書かない箱は今どおり `balanceOf` を描く
 * - `note` はトークンの箱にだけ書け、人の箱と契約の箱に書いた行は読む時に誤りとして拒む。原本の JSON の `sub` も同じに拒む
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { layoutPipe, type PipeLayout } from "../src/kinds/pipe/layout";
import { toModel } from "../src/model";
import type { Diagram } from "../src/schema";
import { api, type Json, type LineError } from "./diagram-support";
import "../src/kind-use/pipe";

const PIPE_DOC = join(process.cwd(), "plugins/dragon/skills/dragon/references/kinds/pipe.md");

/** 記法を読み、読めた図を返す。読めなければ誤りを名指して落とす */
function read(text: string, lang: "ja" | "en" = "ja"): Json {
  const parsed = api("parseNotation")(text, { lang });
  expect(parsed.ok ? [] : parsed.errors, `記法が読めない\n${text}`).toEqual([]);
  return parsed.ok ? parsed.diagram : {};
}

/** 記法を読み、誤りを返す。読めた時は空 */
function refusal(text: string, lang: "ja" | "en" = "ja"): LineError[] {
  const parsed = api("parseNotation")(text, { lang });
  return parsed.ok ? [] : parsed.errors;
}

/** 読めた図が原本の検査を通り、書き戻した記法が同じ図に戻ることを確かめ、書き戻した記法を返す */
function roundTrip(diagram: Json): string {
  const checked = api("validateDiagram")(diagram);
  expect(checked.ok ? [] : checked.errors, "原本の検査で落ちる").toEqual([]);
  const printed = api("printNotation")(diagram);
  const again = api("parseNotation")(printed);
  expect(again.ok ? again.diagram : again.errors, `書き戻した記法が同じ図に戻らない\n${printed}`).toEqual(diagram);
  return printed;
}

/** 描いた置き場所 */
const layoutOf = (diagram: Json): PipeLayout => layoutPipe(toModel(diagram as unknown as Diagram), { lang: "ja" });

/** 段 `step` の、持ち主ごとトークンごとの槽の量 (`alice|USDC` → `150`) */
function amountsAt(layout: PipeLayout, step: number): Record<string, string> {
  return Object.fromEntries(layout.levels.filter((l) => l.step === step).map((l) => [`${l.party}|${l.token}`, l.amount]));
}

/** 最後の段の番号 */
const lastStep = (diagram: Json): number => ((diagram as { steps: unknown[] }).steps.length ?? 1) - 1;

/** 段の中の出来事 */
const eventsOf = (diagram: Json): Json[] => (diagram as { steps: { events: Json[] }[] }).steps.flatMap((s) => s.events);

/** 2 人の間の値の管が在るか。向きは問わない */
const pipeBetween = (layout: PipeLayout, a: string, b: string, token: string): boolean =>
  layout.valuePipes.some((p) => p.token === token && ((p.from === a && p.to === b) || (p.from === b && p.to === a)));

describe("発行と焼却 (#3722)", () => {
  const MINT = [
    "pipe 発行する",
    "box alice as Alice",
    "box usdc as USDC",
    "hold alice: 50 USDC",
    "step 発行する", "  say 発行する。",
    "  alice -> usdc: 発行を頼む",
    "  mint usdc: 100 -> alice",
    "  return usdc: true",
  ].join("\n");

  it("pipe-mint-fills-receiver", () => {
    const diagram = read(MINT);
    expect(amountsAt(layoutOf(diagram), lastStep(diagram))["alice|USDC"], "発行の後の Alice の USDC の槽").toBe("150");
    expect(roundTrip(diagram), "発行の行を書き戻した記法").toContain("mint usdc: 100 -> alice");
    // 受け手の槽だけが増え、発行の分を送り出す者の槽は無い
    expect(Object.keys(amountsAt(layoutOf(diagram), lastStep(diagram))), "発行の後に量を持つ槽").toEqual(["alice|USDC"]);
  });

  it("pipe-burn-drains-holder", () => {
    const text = (amount: string): string =>
      [
        "pipe 焼却する",
        "box alice as Alice",
        "box usdc as USDC",
        "hold alice: 150 USDC",
        "step 焼却する", "  say 焼却する。",
        "  alice -> usdc: 焼却を頼む",
        `  burn usdc: ${amount} alice`,
        "  return usdc: true",
      ].join("\n");
    const diagram = read(text("100"));
    expect(amountsAt(layoutOf(diagram), lastStep(diagram))["alice|USDC"], "焼却の後の Alice の USDC の槽").toBe("50");
    expect(roundTrip(diagram), "焼却の行を書き戻した記法").toContain("burn usdc: 100 alice");
    // 持っている量の全部は焼ける。1 つ多い量は、その行を名指して拒む
    const all = read(text("150"));
    expect(amountsAt(layoutOf(all), lastStep(all))["alice|USDC"], "全部を焼いた後の Alice の USDC の槽").toBe("0");
    expect(
      refusal(text("151")).map((e) => e.line),
      "持っている量より多く焼く行を拒まない",
    ).toEqual([8]);
  });

  it("pipe-mint-burn-draw-no-zero-address", () => {
    const diagram = read(
      [
        "pipe 発行して焼却する",
        "box alice as Alice",
        "box usdc as USDC",
        "box bob as Bob",
        "hold alice: 0 USDC",
        "hold bob: 30 USDC",
        "step 発行する", "  say 発行する。",
        "  alice -> usdc: 発行を頼む",
        "  mint usdc: 100 -> alice",
        "  return usdc: true",
        "step 焼却する", "  say 焼却する。",
        "  bob -> usdc: 焼却を頼む",
        "  burn usdc: 30 bob",
        "  return usdc: true",
      ].join("\n"),
    );
    const layout = layoutOf(diagram);
    expect(layout.parties.map((p) => p.id).sort(), "描いた関係者").toEqual(["alice", "bob", "usdc"]);
    expect([...new Set(layout.tanks.map((t) => `${t.party}|${t.token}`))].sort(), "描いた槽").toEqual(["alice|USDC", "bob|USDC"]);
    expect([...new Set(layout.levels.map((l) => l.party))].sort(), "量を持つ槽の持ち主").toEqual(["alice", "bob"]);
    expect(amountsAt(layout, 1), "発行と焼却の後の槽").toEqual({ "alice|USDC": "100", "bob|USDC": "0" });
    // 原本の残高も、記法に書いた 2 人の分だけを持つ
    const holds = (diagram as { blocks: { hold: { box: string }[] } }).blocks.hold.map((h) => h.box);
    expect(holds, "原本の始めの残高の持ち主").toEqual(["alice", "bob"]);
    roundTrip(diagram);
  });
});

describe("トークンの番号 (#3722)", () => {
  it("pipe-nft-move-draws-line", () => {
    const diagram = read(
      [
        "pipe NFTを移す",
        "box alice as Alice",
        "box art as ART",
        "box bob as Bob",
        "hold alice: #1 ART",
        "hold bob: 0 #1 ART",
        "step 移す", "  say 移す。",
        "  alice -> art: transferFrom",
        "  move art: #1 alice -> bob",
        "  return art: true",
      ].join("\n"),
    );
    const layout = layoutOf(diagram);
    expect(pipeBetween(layout, "alice", "bob", "ART #1"), "Alice と Bob の間の ART #1 の管").toBe(true);
    expect(
      layout.flows.filter((f) => f.step === 0 && f.fresh).map((f) => ({ from: f.from, to: f.to, token: f.token, amount: f.amount })),
      "段 1 で流れた分",
    ).toEqual([{ from: "alice", to: "bob", token: "ART #1", amount: "1" }]);
    expect(amountsAt(layout, 0), "移した後の番号 1 の持ち主").toEqual({ "alice|ART #1": "0", "bob|ART #1": "1" });
    const printed = roundTrip(diagram);
    for (const line of ["hold alice: #1 ART", "hold bob: 0 #1 ART", "move art: #1 alice -> bob"]) expect(printed, `書き戻した記法の ${line}`).toContain(line);
  });

  it("pipe-erc1155-move-draws-line", () => {
    const text = (count: string): string =>
      [
        "pipe ERC-1155を移す",
        "box alice as Alice",
        "box items as ITEMS",
        "box bob as Bob",
        "hold alice: 5 #1 ITEMS",
        "hold bob: 0 #1 ITEMS",
        "step 移す", "  say 移す。",
        "  alice -> items: safeTransferFrom",
        `  move items: ${count} #1 alice -> bob`,
        "  return items: true",
      ].join("\n");
    const diagram = read(text("2"));
    const layout = layoutOf(diagram);
    expect(pipeBetween(layout, "alice", "bob", "ITEMS #1"), "Alice と Bob の間の ITEMS #1 の管").toBe(true);
    expect(amountsAt(layout, 0), "移した後の番号 1 の数").toEqual({ "alice|ITEMS #1": "3", "bob|ITEMS #1": "2" });
    expect(roundTrip(diagram), "書き戻した記法").toContain("move items: 2 #1 alice -> bob");
    // 持っている数の全部は移せる。1 つ多い数は、その行を名指して拒む
    expect(amountsAt(layoutOf(read(text("5"))), 0), "全部を移した後の番号 1 の数").toEqual({ "alice|ITEMS #1": "0", "bob|ITEMS #1": "5" });
    expect(
      refusal(text("6")).map((e) => e.line),
      "持っている数より多く移す行を拒まない",
    ).toEqual([10]);
  });

  it("pipe-nft-mint-burn", () => {
    const diagram = read(
      [
        "pipe NFTを発行して焼却する",
        "box alice as Alice",
        "box art as ART",
        "hold alice: 0 #3 ART",
        "step 発行する", "  say 発行する。",
        "  alice -> art: mint",
        "  mint art: #3 -> alice",
        "  return art: true",
        "step 焼却する", "  say 焼却する。",
        "  alice -> art: burn",
        "  burn art: #3 alice",
        "  return art: true",
      ].join("\n"),
    );
    const layout = layoutOf(diagram);
    expect(amountsAt(layout, 0), "発行した後の番号 3 の持ち主").toEqual({ "alice|ART #3": "1" });
    expect(amountsAt(layout, 1), "焼却した後の番号 3 の持ち主").toEqual({ "alice|ART #3": "0" });
    const printed = roundTrip(diagram);
    for (const line of ["mint art: #3 -> alice", "burn art: #3 alice"]) expect(printed, `書き戻した記法の ${line}`).toContain(line);
  });

  it("pipe-nft-move-refuses-missing-id", () => {
    const head = ["pipe 番号の無いNFT", "box alice as Alice", "box art as ART", "box bob as Bob", "hold alice: #1 ART", "hold bob: 0 #1 ART", "step 移す", "  say 移す。"];
    // `#` だけの形と、`#` の後が数でない形は、どちらも番号の無い形として `#` を指して拒む
    for (const id of ["#", "#x"]) {
      const line = `  move art: ${id} alice -> bob`;
      const text = [...head, line].join("\n");
      for (const [lang, word] of [
        ["ja", "トークンの番号"],
        ["en", "token ID"],
      ] as const) {
        const errors = refusal(text, lang);
        expect(errors.map((e) => e.line), `${line} を拒まない (${lang})`).toEqual([9]);
        expect(errors[0]?.column, `${line} の誤りが # を指さない (${lang})`).toBe(line.indexOf("#") + 1);
        expect(errors[0]?.message ?? "", `${line} の誤りの文 (${lang})`).toContain(word);
      }
    }
    // 発行と残高の宣言でも同じく拒む
    expect(refusal([...head.slice(0, 4), "hold alice: 0 #1 ART", "step 発行する", "  say 発行する。", "  mint art: # -> alice"].join("\n"))[0]?.message ?? "", "番号の無い発行").toContain("トークンの番号");
    expect(refusal([...head.slice(0, 4), "hold alice: # ART"].join("\n"))[0]?.message ?? "", "番号の無い残高").toContain("トークンの番号");
  });
});

describe("数を移す move (#3722)", () => {
  it("pipe-move-amount-unchanged", () => {
    const diagram = read(
      [
        "pipe 数を移す",
        "box alice as Alice",
        "box usdc as USDC",
        "box bob as Bob",
        "hold alice: 500 USDC",
        "hold bob: 0 USDC",
        'hold usdc: "#1" alice',
        "step 移す", "  say 移す。",
        "  alice -> usdc: transfer",
        "  move usdc: 100 alice -> bob",
        "  return usdc: true",
      ].join("\n"),
    );
    expect(eventsOf(diagram)[1], "数を移す move の原本").toEqual({ type: "move", box: "usdc", amount: "100", from: "alice", to: "bob" });
    expect((diagram as { blocks: { hold: Json[] } }).blocks.hold, "始めの値の原本").toEqual([
      { box: "alice", amount: "500", token: "USDC" },
      { box: "bob", amount: "0", token: "USDC" },
      { box: "usdc", name: "#1", value: "alice" },
    ]);
    const printed = roundTrip(diagram);
    for (const line of ["hold alice: 500 USDC", "hold bob: 0 USDC", "move usdc: 100 alice -> bob"]) expect(printed, `書き戻した記法の ${line}`).toContain(line);
    const layout = layoutOf(diagram);
    expect(pipeBetween(layout, "alice", "bob", "USDC"), "Alice と Bob の間の USDC の管").toBe(true);
    expect(
      layout.flows.filter((f) => f.step === 0 && f.fresh).map((f) => ({ from: f.from, to: f.to, token: f.token, amount: f.amount })),
      "段 1 で流れた分",
    ).toEqual([{ from: "alice", to: "bob", token: "USDC", amount: "100" }]);
    expect(amountsAt(layout, 0), "移した後の槽").toEqual({ "alice|USDC": "400", "bob|USDC": "100" });
  });
});

describe("記法の説明 (#3722)", () => {
  it("pipe-notation-docs-list-mint-burn-nft", () => {
    const doc = readFileSync(PIPE_DOC, "utf8");
    // 行の表の 1 列目に、発行と焼却と番号の付いた移動の書き方が在る
    const rows = doc.split("\n").flatMap((line) => /^\| `([^`]+)` \|/u.exec(line)?.[1] ?? []);
    expect(rows.filter((row) => row.startsWith("mint ") && row.includes("->")), "発行の行の書き方").not.toEqual([]);
    expect(rows.filter((row) => row.startsWith("burn ") && !row.includes("->")), "焼却の行の書き方").not.toEqual([]);
    expect(rows.filter((row) => row.startsWith("move ") && row.includes("#")), "番号の付いた移動の書き方").not.toEqual([]);
    expect(rows.filter((row) => row.startsWith("hold ") && row.includes("#")), "番号の付いた残高の書き方").not.toEqual([]);
    // 説明の中の例は記法として読める
    for (const example of ["mint usdc: 100 -> alice", "burn usdc: 100 alice", "move art: #1 alice -> bob", "move items: 2 #1 alice -> bob"]) expect(doc, `説明の例 ${example}`).toContain(example);
  });
});

describe("トークンの箱の名前の下の字 (#3803)", () => {
  /** Alice が Router を通して USDC を Bob へ送る図。`boxes` は箱の宣言の 3 行で、`note` を書く箱を差し替える */
  const sendText = (boxes: { alice?: string; router?: string; usdc?: string } = {}): string =>
    [
      "pipe AliceがBobへ送る",
      boxes.alice ?? "box alice as Alice",
      boxes.router ?? "box router as Router",
      boxes.usdc ?? "box usdc as USDC",
      "box bob as Bob",
      "hold alice: 100 USDC",
      "hold bob: 0 USDC",
      "step 送る",
      "  say 送る。",
      "  alice -> router: send",
      "  router -> usdc: transfer",
      "  move usdc: 40 alice -> bob",
      "  return usdc: ok",
      "  return router: ok",
    ].join("\n");

  /** 描いたトークンの箱 `usdc` */
  const usdcOf = (diagram: Json) => {
    const party = layoutOf(diagram).parties.find((p) => p.id === "usdc");
    expect(party, "USDC の箱を描かない").toBeDefined();
    return party as NonNullable<typeof party>;
  };

  it("pipe-token-note-draws-under-name", () => {
    // note を書いたトークンの箱は、名前の下に balanceOf の代わりに note の字を描く
    const diagram = read(sendText({ usdc: "box usdc as USDC [note: Holding]" }));
    expect(usdcOf(diagram).sub?.text, "名前の下の字").toBe("Holding");
  });

  it("pipe-token-note-widens-box", () => {
    // balanceOf より長い字は、箱を字が収まる幅に広げ、字は箱の中に収まる
    const plain = usdcOf(read(sendText()));
    const long = usdcOf(read(sendText({ usdc: "box usdc as USDC [note: Splice.Api.Token.HoldingV1]" })));
    const sub = long.sub;
    expect(sub?.text, "名前の下の字").toBe("Splice.Api.Token.HoldingV1");
    expect(long.w, "長い字の箱の幅").toBeGreaterThan(plain.w);
    expect(sub && sub.x >= long.x && sub.x + sub.w <= long.x + long.w, `字 ${JSON.stringify(sub)} が箱 ${JSON.stringify({ x: long.x, w: long.w })} からはみ出る`).toBe(true);
  });

  it("pipe-token-note-round-trip", () => {
    // note は原本の箱の sub に入り、原本の検査を通り、記法へ書き戻すと同じ行に戻る
    const diagram = read(sendText({ usdc: "box usdc as USDC [note: Holding]" }));
    const usdc = (diagram as { blocks: { box: { id: string; sub?: string }[] } }).blocks.box.find((b) => b.id === "usdc");
    expect(usdc?.sub, "原本の箱の sub").toBe("Holding");
    expect(roundTrip(diagram), "書き戻した記法").toContain("box usdc as USDC [note: Holding]");
  });

  it("pipe-note-refuses-non-token-box", () => {
    // 人の箱と契約の箱の note は、その行の note を指して、トークンの箱にだけ書けると言って拒む
    for (const [who, line, at] of [
      ["alice", "box alice as Alice [note: Party]", 2],
      ["router", "box router as Router [note: Template]", 3],
    ] as const) {
      const text = sendText(who === "alice" ? { alice: line } : { router: line });
      for (const [lang, word] of [
        ["ja", "トークンの箱にだけ書ける"],
        ["en", "only on a token box"],
      ] as const) {
        const errors = refusal(text, lang);
        expect(errors.map((e) => e.line), `${line} を拒まない (${lang})`).toEqual([at]);
        expect(errors[0]?.column, `${line} の誤りが note を指さない (${lang})`).toBe(line.indexOf("note") + 1);
        expect(errors[0]?.message ?? "", `${line} の誤りの文 (${lang})`).toContain(word);
      }
    }
  });

  it("pipe-json-refuses-sub-on-non-token-box", () => {
    // 原本の JSON でも、トークンの箱の sub は通し、人の箱と契約の箱の sub はその欄を指して拒む
    const base = read(sendText()) as { blocks: { box: { id: string; sub?: string }[] } };
    const withSub = (id: string): Json => ({ ...base, blocks: { ...base.blocks, box: base.blocks.box.map((b) => (b.id === id ? { ...b, sub: "Holding" } : b)) } });
    const token = api("validateDiagram")(withSub("usdc"));
    expect(token.ok ? [] : token.errors, "トークンの箱の sub").toEqual([]);
    for (const id of ["alice", "router"]) {
      const at = base.blocks.box.findIndex((b) => b.id === id);
      for (const [lang, word] of [
        ["ja", "トークンの箱"],
        ["en", "token box"],
      ] as const) {
        const checked = api("validateDiagram")(withSub(id), { lang });
        const errors = checked.ok ? [] : checked.errors;
        expect(errors.map((e) => e.pointer), `${id} の sub を拒まない (${lang})`).toContain(`/blocks/box/${at}/sub`);
        expect(errors.find((e) => e.pointer === `/blocks/box/${at}/sub`)?.message ?? "", `${id} の sub の誤りの文 (${lang})`).toContain(word);
      }
    }
  });

  it("pipe-notation-docs-list-token-note", () => {
    // 記法の説明の宣言の表に、トークンの箱の note の書き方と例が在る
    const doc = readFileSync(PIPE_DOC, "utf8");
    const rows = doc.split("\n").flatMap((line) => /^\| `([^`]+)` \|/u.exec(line)?.[1] ?? []);
    expect(rows.filter((row) => row.startsWith("box ") && row.includes("[note: ")), "トークンの箱の note の行の書き方").not.toEqual([]);
    expect(doc, "説明の例").toContain("box usdc as USDC [note: Holding]");
  });

  it("pipe-token-without-note-draws-balanceOf", () => {
    // note を書かないトークンの箱は、日本語の図でも英語の図でも名前の下に balanceOf を描く
    for (const lang of ["ja", "en"] as const) {
      const party = layoutPipe(toModel(read(sendText(), lang) as unknown as Diagram), { lang }).parties.find((p) => p.id === "usdc");
      expect(party?.sub?.text, `名前の下の字 (${lang})`).toBe("balanceOf");
    }
  });
});
