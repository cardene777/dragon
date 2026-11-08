// @vitest-environment jsdom
/**
 * 試す図が日本語で出す字は、和文と英数字の名前や数の間に空白を置かない (#3509)。
 *
 * 送った後の段の本文、記録の番号、待ち行列の案内、関門で止まった節の行を、英字の名札を持つ図で確かめる。
 * 英語の字は語の間に空白を置くので、今の字のまま変えない。
 */
import { describe, expect, it } from "vitest";
import { TRY_TEXT } from "../src/try-text";
import { draw } from "./render-support";
import { parsedTry } from "./try-support";

/** 和文と英数字の間の空白 */
const GAP = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}] [0-9A-Za-z]|[0-9A-Za-z] [\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 英字の名札で書いた試す図。関門 gate で止まる記録と、釦 take が待ち行列 passed から集める記録を持つ */
const SOURCE = [
  "try 字を確かめる",
  "route net: you - gate - done [from: you, to: done]",
  "queue passed",
  "log rejects",
  "log taken",
  "ask name, ok [into: passed, via: net]",
  "choose ok: yes, no",
  "check gate: ok == yes [no: BAD_SIGNATURE, into: rejects]",
  "press take [from: passed, into: taken, take: 1]",
  "step start",
  "  say 始める。",
  "step stop",
  "  say 止まる。",
  "  ask a1, no",
  "step pass",
  "  say 通る。",
  "  ask a2, yes",
  "step gather",
  "  say 集める。",
  "  press take",
].join("\n");

interface Placed {
  logs: { id: string; labels: Record<number, string>; stops?: Record<number, { at: string }> }[];
}

describe("試す図の日本語の字の空白 (#3509)", () => {
  it("try-text-ja-has-no-space-around-names", () => {
    const ja = TRY_TEXT.ja;
    expect(ja.trySentBody("a2", "passed", "net"), "送った後の段の本文").toBe("a2がnetを通ってpassedに入った。");
    expect(ja.tryStoppedBody("a1", "gate", "BAD_SIGNATURE"), "関門で止まった段の本文").toBe("a1がgateの関門で止まった(BAD_SIGNATURE)。");
    expect(ja.tryGatheredRecordBody(1, ["p1", "p2"], "taken", 2), "2 つの待ち行列から集めた段の本文").toBe("p1とp2の上から1件ずつがtakenの記録2に入った。");
    const texts = [
      ja.tryBlock(3),
      ja.tryTakes(1),
      ja.tryFolded(2),
      ja.tryRecord(1),
      ja.tryFoldedRecords(4),
      ja.tryStoppedAt("Sequencer"),
      ja.tryEditField("a1", "fee"),
      ja.tryFull("pool", 5),
      ja.tryEmpty("pool", "build"),
      ja.tryRefused("pool", "me"),
      ja.tryShort("pool", "build", 2),
      ja.trySent("a1"),
      ja.trySentBody("a1", "pool", undefined),
      ja.tryPressedBody(2, "pool", 3),
      ja.tryPressedRecordBody(2, "pool", "log", 3),
      ja.tryGatheredBody(1, ["p1", "p2"], 3),
      ja.tryEdited("a1", "fee"),
      ja.tryEditedBody("fee", "2", "5"),
    ];
    for (const text of texts) expect(text, `和文と英数字の間に空白を持つ字: ${text}`).not.toMatch(GAP);
  });

  it("try-ja-draws-labels-without-space", () => {
    const rendered = draw("renderDiagram")(parsedTry(SOURCE), { lang: "ja" });
    const layout = rendered.layout as unknown as Placed;
    const rejects = layout.logs.find((l) => l.id === "rejects");
    expect(rejects?.labels[1], "記録の番号の字").toBe("記録1");
    expect(rejects?.stops?.[1]?.at, "関門で止まった節の行").toBe("gateで止まった");
    expect(rendered.svg, "待ち行列の案内").toContain("次は上から1件");
    expect(rendered.svg, "待ち行列の案内が数の前後に空白を持つ").not.toContain("次は上から 1 件");
  });

  it("try-text-en-keeps-spaces", () => {
    const en = TRY_TEXT.en;
    expect(en.tryRecord(1), "英語の記録の番号").toBe("Record 1");
    expect(en.tryTakes(1), "英語の待ち行列の案内").toBe("Top 1 go next");
    expect(en.tryStoppedAt("gate"), "英語の止まった節の行").toBe("Stopped at gate");
    expect(en.tryStoppedBody("a1", "gate", "BAD_SIGNATURE"), "英語の関門で止まった段の本文").toBe("a1 stopped at the gate on gate (BAD_SIGNATURE).");
  });
});
