// @vitest-environment jsdom
/**
 * 配管の図の語を呼ぶ側が渡す (#3584)。
 *
 * 槽の下に添える語 (暫定、確定、取り消し)、始めた人と受け取った人の槽の札 (入力、出力)、内側の段をまとめた枠の文は、
 * 描く言葉ごとの表 (`PIPE_TEXT`) から引く。画面を持つ側が自分の語 (成功、リバートなど) で描けるよう、
 * `renderDiagram` と `mountDiagram` の指定 (`words.pipe`) で一部だけ渡せるようにする。
 * 数と名前が入る文は `{steps}`、`{parties}`、`{name}` の所に差し込む。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { mountDiagram, parseNotation, type Rendered, type RenderOptions, renderDiagram } from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** 渡す語。描く関数の指定がまだ持たない欄なので、ここで形を書く */
interface PipeWordsInput {
  tags?: Partial<Record<"provisional" | "final" | "rolled", string>>;
  io?: Partial<Record<"in" | "out", string>>;
  fold?: string;
  open?: string;
  foldTitle?: string;
}
type Options = RenderOptions & { words?: { pipe?: PipeWordsInput } };

const json = (file: string): unknown => JSON.parse(readFileSync(join(EXAMPLES, file), "utf8"));
const notation = (file: string): unknown => {
  const read = parseNotation(readFileSync(join(EXAMPLES, file), "utf8"));
  if (!read.ok) throw new Error(`${file} を読めない`);
  return read.diagram;
};

/** 描いた図で `word` だけを中身に持つ字の数 */
const count = (svg: string, word: string): number => svg.split(`>${word}<`).length - 1;

function render(source: unknown, words?: PipeWordsInput): Rendered {
  const options: Options = { lang: "ja", ...(words ? { words: { pipe: words } } : {}) };
  return renderDiagram(source, options);
}

const TAGS = { provisional: "保留", final: "成功", rolled: "リバート" };

describe("配管の図の語を呼ぶ側が渡す (#3584)", () => {
  it("pipe-words-tags-replaced", () => {
    const swap = json("swap.json");
    const before = render(swap).svg;
    const after = render(swap, { tags: TAGS }).svg;
    expect(count(before, "暫定"), "見本の交換の図に暫定の語が無い (走査の空振り)").toBeGreaterThan(0);
    expect(count(after, "暫定"), "渡した語の図に暫定の語が残る").toBe(0);
    expect(count(after, "確定"), "渡した語の図に確定の語が残る").toBe(0);
    // 今の語が描かれていた所の全てに、渡した語が描かれる
    expect(count(after, "保留"), "暫定の語を描いた所の数だけ渡した語を描かない").toBe(count(before, "暫定"));
    expect(count(after, "成功"), "確定の語を描いた所の数だけ渡した語を描かない").toBe(count(before, "確定"));
    const revert = json("swap-revert.json");
    const rolledBefore = render(revert).svg;
    const rolledAfter = render(revert, { tags: TAGS }).svg;
    expect(count(rolledBefore, "取り消し"), "見本の取り消しの図に取り消しの語が無い (走査の空振り)").toBeGreaterThan(0);
    expect(count(rolledAfter, "取り消し"), "渡した語の図に取り消しの語が残る").toBe(0);
    expect(count(rolledAfter, "リバート"), "取り消しの語を描いた所の数だけ渡した語を描かない").toBe(count(rolledBefore, "取り消し"));
  });

  it("pipe-words-mount-keeps-words", () => {
    const source = notation("aggregator.dragon");
    const host = document.createElement("div");
    document.body.appendChild(host);
    const options: Options = { lang: "ja", words: { pipe: { tags: TAGS } } };
    const player = mountDiagram(host, source, options);
    try {
      expect(count(host.innerHTML, "保留"), "置いた図の槽の下に渡した語が無い").toBeGreaterThan(0);
      expect(count(host.innerHTML, "暫定"), "置いた図の槽の下に暫定の語が残る").toBe(0);
      const folded = host.querySelector("[data-pipe-fold]");
      expect(folded, "置いた図に畳んだ箱が無い").not.toBeNull();
      const steps = (): number => host.querySelectorAll('[data-dragon="steps"] > li').length;
      const closed = steps();
      folded?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      expect(steps(), "畳んだ箱を押しても内側の段を開いて描き直さない").toBeGreaterThan(closed);
      expect(count(host.innerHTML, "保留"), "描き直した図の槽の下に渡した語が無い").toBeGreaterThan(0);
      expect(count(host.innerHTML, "暫定"), "描き直した図の槽の下に暫定の語が戻る").toBe(0);
    } finally {
      player.destroy();
      host.remove();
    }
  });

  it("pipe-words-io-replaced", () => {
    const hops = json("swap-two-hops.json");
    const before = render(hops).svg;
    const after = render(hops, { io: { in: "送った", out: "受け取った" } }).svg;
    expect(count(before, "入力"), "見本の2回の交換の図に入力の札が無い (走査の空振り)").toBeGreaterThan(0);
    expect(count(before, "出力"), "見本の2回の交換の図に出力の札が無い (走査の空振り)").toBeGreaterThan(0);
    expect([count(after, "入力"), count(after, "出力")], "渡した語の図に入力か出力の札が残る").toEqual([0, 0]);
    expect(count(after, "送った"), "入力の札を描いた所の数だけ渡した語を描かない").toBe(count(before, "入力"));
    expect(count(after, "受け取った"), "出力の札を描いた所の数だけ渡した語を描かない").toBe(count(before, "出力"));
  });

  it("pipe-words-fold-replaced", () => {
    const source = notation("aggregator.dragon");
    const before = render(source);
    const after = render(source, { fold: "内側の{steps}ステップと{parties}人", open: "押して開く", foldTitle: "{name}の内側のステップ" });
    const folded = /内側の(\d+)段と(\d+)人/u.exec(before.svg);
    expect(folded, "見本の集約の図にまとめた枠の文が無い (走査の空振り)").not.toBeNull();
    expect(after.svg, "まとめた枠の文に数を差し込んで描かない").toContain(`内側の${folded?.[1]}ステップと${folded?.[2]}人`);
    expect(after.svg, "まとめた枠の今の文が残る").not.toMatch(/内側の\d+段と\d+人/u);
    expect(count(after.svg, "押して開く"), "押すと開くの語を渡した語で描かない").toBe(count(before.svg, "押すと開く"));
    expect(count(after.svg, "押すと開く"), "押すと開くの今の語が残る").toBe(0);
    const titles = after.diagram.steps.map((step) => step.title);
    expect(titles, "まとめた段の題に名前を差し込んで描かない").toContain("Aggregatorの内側のステップ");
    expect(titles.filter((title) => title.endsWith("の内側をまとめて進む")), "まとめた段の今の題が残る").toEqual([]);
  });

  it("pipe-words-partial-keeps-rest", () => {
    const swap = json("swap.json");
    const before = render(swap).svg;
    const after = render(swap, { tags: { final: "成功" } }).svg;
    expect(count(after, "成功"), "渡した確定の語を描かない").toBe(count(before, "確定"));
    expect(count(after, "確定"), "渡した確定の語の図に確定の語が残る").toBe(0);
    // 渡していない語は描く言葉の今の語のまま
    expect(count(after, "暫定"), "渡していない暫定の語が今の語で描かれない").toBe(count(before, "暫定"));
    expect(count(after, "入力"), "渡していない入力の札が今の語で描かれない").toBe(count(before, "入力"));
  });

  it("pipe-words-long-words-fit", () => {
    const revert = json("swap-revert.json");
    const before = render(revert);
    const long = { provisional: "まだ確定していない", rolled: "リバートされて元に戻った" };
    const after = render(revert, { tags: long });
    expect(count(after.svg, long.provisional), "長い暫定の語を切らずに描かない").toBeGreaterThan(0);
    expect(count(after.svg, long.rolled), "長い取り消しの語を切らずに描かない").toBeGreaterThan(0);
    expect(after.overlaps.length, "長い語の札が他の字か線に重なる").toBeLessThanOrEqual(before.overlaps.length);
  });

  it("pipe-words-absent-same-svg", () => {
    for (const source of [json("swap.json"), json("swap-revert.json"), notation("aggregator.dragon")]) {
      const plain = renderDiagram(source, { lang: "ja" }).svg;
      expect(count(plain, "暫定"), "語を渡さない図に暫定の語が無い").toBeGreaterThan(0);
      const empty: Options = { lang: "ja", words: {} };
      const emptyPipe: Options = { lang: "ja", words: { pipe: {} } };
      expect(renderDiagram(source, empty).svg, "空の words を渡すと図が変わる").toBe(plain);
      expect(renderDiagram(source, emptyPipe).svg, "空の words.pipe を渡すと図が変わる").toBe(plain);
    }
  });
});
