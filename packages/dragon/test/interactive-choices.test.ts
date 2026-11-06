// @vitest-environment jsdom
/**
 * 試す図の入力の帯の欄に選択肢を書く行 (`choose`、#3422)。
 *
 * 最初の段より前に `choose <欄>: <値>, <値>` を欄ごとに書くと、その欄は選択肢から選ぶ欄 (`select`) で描かれ、読み手は値を打たずに選んで送れる。
 * 最初の欄 (チップの名前) にも書け、開いた時は最初の選択肢を選んでいる。ブロックの中のチップを書き換える欄も、同じ選択肢から選ぶ。
 * 選択肢を書かない欄は今どおり自由入力の欄で描く。
 * 誤りの文を英語でも確かめるので、名札と値は英字にする。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { askStrip, KANA, mountTry, parsedTry, releaseTry, send, sendButton, sessionOf } from "./try-support";

afterEach(releaseTry);

/** 部品の行。入力の帯の欄は名前 (node)、判定 (verdict)、手数料 (fee) で、機械の列は判定を書き換えさせる */
const PARTS = ["queue pool [order: fee]", "chain blocks [edit: verdict]", "ask node, verdict, fee [into: pool]"] as const;
/** 選択肢の行。最初の欄と判定に書き、手数料には書かない */
const CHOOSE = ["choose node: alice, bob", "choose verdict: approve, reject"] as const;
const PRESS = "press build [from: pool, into: blocks, take: 2]";
const ITEMS = ["item o1 [verdict: approve, fee: 4]", "item o2 [verdict: reject, fee: 2]"] as const;
/** 最初の段。機械の列にブロック 1 (o1) を置き、待ち行列に o2 を並べる */
const FIRST = ["step start", "  say 始める。", "  line blocks: o1", "  line pool: o2"] as const;

/** 選択肢を書いた試す図の記法。`choose` で選択肢の行を、`items` でチップの行を差し替え、`examples` を最後に足す */
function choiceTry(options: { choose?: readonly string[]; items?: readonly string[]; examples?: readonly string[] } = {}): string {
  return ["try choices", ...PARTS, ...(options.choose ?? CHOOSE), PRESS, ...(options.items ?? ITEMS), ...FIRST, ...(options.examples ?? [])].join(
    "\n",
  );
}

interface AskPart {
  type?: string;
  fields?: string[];
  choices?: Record<string, string[]>;
}

/** 原本の入力の帯の部品 */
const askOf = (diagram: Json): AskPart | undefined =>
  ((diagram as { blocks?: { part?: AskPart[] } }).blocks?.part ?? []).find((p) => p.type === "ask");

/** 入力の帯の欄。欄が無ければ `null` */
const fieldOf = (host: HTMLElement, field: string): HTMLInputElement | HTMLSelectElement | null =>
  askStrip(host)?.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-field="${field}"]`) ?? null;

/** 選ぶ欄の選択肢の値 (並んだ順) */
const optionsOf = (select: Element | null | undefined): string[] =>
  select instanceof HTMLSelectElement ? [...select.options].map((o) => o.value) : [];

/** 選ぶ欄で値を選ぶ。読み手が選んだ時と同じく input と change を起こす */
function choose(select: Element | null | undefined, value: string): void {
  expect(select instanceof HTMLSelectElement, "選ぶ欄 (select) が無い").toBe(true);
  if (!(select instanceof HTMLSelectElement)) return;
  select.value = value;
  select.dispatchEvent(new Event("input", { bubbles: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

/** 原本の最後の段 */
const lastStep = (diagram: unknown): Json | undefined => {
  const steps = (diagram as { steps?: Json[] } | undefined)?.steps ?? [];
  return steps[steps.length - 1];
};

const readRepo = (path: string): string => {
  const full = join(process.cwd(), path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

describe("試す図の選択肢の記法 (#3422)", () => {
  it("interactive-choose-parses-choices", () => {
    const diagram = parsedTry(choiceTry());
    const ask = askOf(diagram);
    expect(ask?.choices, "原本の入力の帯の部品が選択肢 (choices) を持たない").toEqual({
      node: ["alice", "bob"],
      verdict: ["approve", "reject"],
    });
    expect(Object.keys(ask?.choices ?? {}), "選択肢の欄が choose を書いた順に並ばない").toEqual(["node", "verdict"]);
    expect(ask?.choices?.verdict, "選択肢が書いた順に並ばない").toEqual(["approve", "reject"]);
    const checked = api("validateDiagram")(diagram);
    expect(checked.ok, `選択肢を持つ原本が原本の形の検査を通らない: ${checked.ok ? "" : JSON.stringify(checked.errors)}`).toBe(true);
  });

  it("interactive-choose-round-trip-keeps-notation", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const choose = ["choose node: alice, bob", 'choose verdict: "approve, now", reject'];
    const text = choiceTry({
      choose,
      items: ['item o1 [verdict: "approve, now", fee: 4]', "item o2 [verdict: reject, fee: 2]"],
      examples: ["step send", "  say 送る。", "  ask bob, reject, 5"],
    });
    const first = parse(text);
    expect(first.ok, `選択肢を書いた記法が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
    if (!first.ok) return;
    const printed = print(first.diagram);
    const lines = printed.split("\n");
    const at = lines.findIndex((line) => line.startsWith("ask "));
    expect(at, `書き戻した記法に ask の行が無い\n${printed}`).toBeGreaterThanOrEqual(0);
    expect(lines.slice(at + 1, at + 1 + choose.length), `ask の行の後ろに choose の行が元の記法のまま並ばない\n${printed}`).toEqual(choose);
    const second = parse(printed);
    expect(second.ok, `書き戻した記法が読めない: ${second.ok ? "" : JSON.stringify(second.errors)}\n${printed}`).toBe(true);
    expect(second.ok ? second.diagram : undefined, `往復した JSON が最初と違う\n${printed}`).toEqual(first.diagram);
  });

  it("interactive-choose-refuses-bad-lines", () => {
    const parse = api("parseNotation");
    const base = choiceTry().split("\n");
    const replaced = (from: string, to: string): string[] => base.map((line) => (line === from ? to : line));
    const cases: [string, string[], string][] = [
      ["ask の欄に無い欄の choose", replaced("choose verdict: approve, reject", "choose color: red, blue"), "choose color"],
      ["同じ欄の 2 度目の choose", [...base.slice(0, base.indexOf(PRESS)), "choose verdict: approve, hold", ...base.slice(base.indexOf(PRESS))], "choose verdict: approve, hold"],
      ["選択肢が 1 つの choose", replaced("choose verdict: approve, reject", "choose verdict: approve"), "choose verdict: approve"],
      ["選択肢に無い値を書いたチップ", replaced("item o1 [verdict: approve, fee: 4]", "item o1 [verdict: maybe, fee: 4]"), "item o1 [verdict: maybe"],
      ["選択肢に無い名前を送る段の中の ask", [...base, "step send", "  say 送る。", "  ask carol, approve, 5"], "  ask carol"],
      ["選択肢に無い値へ書き換える段の中の item", [...base, "step edit", "  say 書き換える。", "  item o1 [verdict: maybe]"], "  item o1 [verdict: maybe]"],
    ];
    for (const [name, lines, marker] of cases) {
      const row = lines.findIndex((line) => line.startsWith(marker));
      expect(row, `${name} の行が記法に無い`).toBeGreaterThanOrEqual(0);
      for (const lang of ["ja", "en"] as const) {
        const parsed = parse(lines.join("\n"), { lang });
        expect(parsed.ok, `${name} を読めてしまう (${lang})`).toBe(false);
        const first: LineError | undefined = parsed.ok ? undefined : parsed.errors[0];
        expect(first?.line, `${name} の誤りの行 (${lang}): ${first?.message ?? ""}`).toBe(row + 1);
        expect(first?.column ?? 0, `${name} の誤りが列を名指さない (${lang})`).toBeGreaterThanOrEqual(1);
        expect(first?.message ?? "", `${name} の誤りの文 (${lang})`).not.toBe("");
        if (lang === "en") expect(KANA.test(first?.message ?? ""), `${name} の英語の誤りの文に仮名か漢字がある: ${first?.message}`).toBe(false);
      }
    }
  });
});

describe("試す図の選ぶ欄 (#3422)", () => {
  it("interactive-choose-draws-select-in-order", () => {
    const { host } = mountTry(parsedTry(choiceTry()));
    for (const [field, values] of [
      ["node", ["alice", "bob"]],
      ["verdict", ["approve", "reject"]],
    ] as const) {
      const select = fieldOf(host, field);
      expect(select?.tagName, `選択肢を持つ ${field} の欄が選ぶ欄 (select) で描かれない`).toBe("SELECT");
      expect(optionsOf(select), `${field} の選択肢が書いた順に並ばない`).toEqual(values);
      expect(select?.value, `${field} の欄が最初の選択肢を選んだ状態で開かない`).toBe(values[0]);
    }
    const fee = fieldOf(host, "fee");
    expect(fee?.tagName, "選択肢を持たない fee の欄が自由入力の欄で描かれない").toBe("INPUT");
    expect((fee as HTMLInputElement | null)?.type, "選択肢を持たない fee の欄が文字の欄でない").toBe("text");
  });

  it("interactive-choose-keeps-text-without-choices", () => {
    const { host } = mountTry(parsedTry(choiceTry({ choose: [] })));
    for (const field of ["node", "verdict", "fee"]) {
      const input = fieldOf(host, field);
      expect(input?.tagName, `選択肢を持たない ${field} の欄が自由入力の欄 (input) で描かれない`).toBe("INPUT");
      expect((input as HTMLInputElement | null)?.type, `${field} の欄が文字の欄でない`).toBe("text");
    }
  });

  it("interactive-choose-send-matches-typed-send", () => {
    const picked = mountTry(parsedTry(choiceTry()));
    choose(fieldOf(picked.host, "node"), "bob");
    choose(fieldOf(picked.host, "verdict"), "reject");
    const fee = fieldOf(picked.host, "fee") as HTMLInputElement | null;
    expect(fee, "fee の欄が無い").not.toBeNull();
    if (fee) {
      fee.value = "5";
      fee.dispatchEvent(new Event("input", { bubbles: true }));
    }
    sendButton(picked.host)?.click();
    const typed = mountTry(parsedTry(choiceTry({ choose: [] })));
    send(typed.host, { node: "bob", verdict: "reject", fee: "5" });
    const pickedStep = lastStep(sessionOf(picked.player));
    expect((pickedStep as { events?: Json[] } | undefined)?.events, "選んで送っても段が足されない").toEqual([{ type: "ask", values: ["bob", "reject", "5"] }]);
    expect(pickedStep, "選んで送った段が、同じ値を打って送った段と違う").toEqual(lastStep(sessionOf(typed.player)));
  });

  it("interactive-choose-edit-uses-select", () => {
    const { host, player } = mountTry(parsedTry(choiceTry()));
    const chip = host.querySelector('svg [data-chip="o1"]');
    expect(chip, "ブロックの中にチップ o1 (data-chip) が無い").not.toBeNull();
    chip?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const form = host.querySelector<HTMLFormElement>('form[data-dragon="edit"]');
    expect(form, "チップ o1 を押しても書き換える欄 (form[data-dragon=edit]) が出ない").not.toBeNull();
    const select = form?.querySelector('[data-field="verdict"]');
    expect(select?.tagName, "選択肢を持つ verdict の書き換えの欄が選ぶ欄 (select) で描かれない").toBe("SELECT");
    expect(optionsOf(select), "書き換えの欄の選択肢が書いた順に並ばない").toEqual(["approve", "reject"]);
    expect((select as HTMLSelectElement | null)?.value, "書き換えの欄がチップの今の値を選んだ状態で開かない").toBe("approve");
    choose(select, "reject");
    form?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
    expect((lastStep(sessionOf(player)) as { events?: Json[] } | undefined)?.events, "選んで書き換えた段が足されない").toEqual([
      { type: "item", item: "o1", values: { verdict: "reject" } },
    ]);
  });
});

describe("試す図の選択肢の書き方の文書 (#3422)", () => {
  it("docs-describe-try-choices", () => {
    /** 見出し `heading` から次の同じ深さの見出しまで */
    const sectionOf = (text: string, heading: string): string => {
      const start = text.indexOf(heading);
      if (start < 0) return "";
      const next = text.indexOf("\n### ", start + heading.length);
      return text.slice(start, next < 0 ? undefined : next);
    };
    for (const [path, heading] of [
      ["packages/dragon/README.ja.md", "### 試す図"],
      ["packages/dragon/README.md", "### Try diagram"],
    ] as const) {
      const section = sectionOf(readRepo(path), heading);
      expect(section, `${path} に試す図の小節 (${heading}) が無い`).not.toBe("");
      expect(section, `${path} の試す図の小節に choose の行の書き方が無い`).toContain("choose ");
    }
    expect(readRepo("apps/playground-spa/src/docs/content.ts"), "使い方の頁に choose の行が無い").toContain("choose ");
  });
});
