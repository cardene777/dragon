// @vitest-environment jsdom
/**
 * 試す図のチップの名前を切らずに出し、入力の帯の打つ欄を 12 字までにする (#3458)。
 *
 * 試す図はチップの名前 (最初の欄の値) を、列の図の `item` の `label` の上限 (`LABEL_MOST`、4 字) で切って図に出していた。
 * 書き手が書いた値 (`choose` の選択肢、`item` の行、段の例の `ask` の行) は切らずに出し、チップの幅と待ち行列の幅を名前に合わせて広げる。
 * 読み手が打つ欄 (`choose` を持たない欄) は 12 字までしか打てず、打った名前も切らずに出す。`choose` を持つ欄は今どおり選ぶ欄で描く。
 * 列の図の `item` の `label` の 4 字の上限は変えない。
 * 名前は 5 字以上の英字の名前にし、幅を確かめる名前には仮名と漢字の名前も足す。
 */
import { afterEach, describe, expect, it } from "vitest";
import { textWidth } from "../src/layout/measure";
import { TRY_LOOK } from "../src/look/try";
import { TYPE } from "../src/look/values";
import { draw, type Rect } from "./render-support";
import { askStrip, figureOf, lastState, mountTry, parsedTry, releaseTry, send, sessionOf, tryLayout } from "./try-support";

afterEach(releaseTry);

/** 入力の帯の打つ欄に打てる字数 */
const FREE_MOST = 12;
/** 読み手が打てる最も長い 12 字の英字の名前 */
const LONG = "Christabella";
/** 12 字の仮名と漢字の名前。英字より 1 字の幅が広い */
const WIDE = "十二字の長い名前を持つ人";

/** 部品の行。入力の帯は名前 (name)、判定 (vote)、手数料 (fee) を聞き、判定だけが選択肢を持つ。釦は待ち行列 pool の上から 2 件を記録の列 records にまとめる */
const PARTS = [
  "queue pool [order: fee]",
  "log records",
  "ask name, vote, fee [into: pool]",
  "choose vote: yes, no",
  "press decide [from: pool, into: records, take: 2]",
] as const;
/** 5 字の名前のチップ。手数料の高い Alice が上に並ぶ */
const ITEMS = ["item Alice [vote: yes, fee: 3]", "item Carol [vote: no, fee: 2]"] as const;
/** 最初の段。待ち行列 pool に Alice と Carol を並べる */
const FIRST = ["step start", "  say 始める。", "  line pool: Alice, Carol"] as const;
/** 書き手の例の段。7 字の名前 Dorothy を送り、手数料の高い Dorothy と Alice を記録 1 にまとめる。Carol は待ち行列に残る */
const EXAMPLES = ["step send", "  say 送る。", "  ask Dorothy, yes, 5", "step decide", "  say まとめる。", "  press decide"] as const;
/** 12 字の名前のチップ */
const LONG_ITEMS = [`item ${LONG} [vote: yes, fee: 3]`, `item ${WIDE} [vote: no, fee: 2]`] as const;
const LONG_FIRST = ["step start", "  say 始める。", `  line pool: ${LONG}, ${WIDE}`] as const;

/** 試す図の記法。`items` でチップの行を、`first` で最初の段を差し替え、`examples` の段を後ろに足す */
function chipTry(options: { items?: readonly string[]; first?: readonly string[]; examples?: readonly string[] } = {}): string {
  return ["try chip names", ...PARTS, ...(options.items ?? ITEMS), ...(options.first ?? FIRST), ...(options.examples ?? [])].join("\n");
}

/** 置き場所のうち、チップの大きさと待ち行列の枠と席 */
interface ChipLayout {
  width: number;
  height: number;
  chip: { w: number; h: number };
  queues: { id: string; box: Rect; slots: Rect[] }[];
}

/** 四角 `inner` が四角 `outer` の中に収まるか */
const within = (inner: Rect, outer: Rect): boolean =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;

/** チップの名前の字 */
const nameOf = (chip: Element | null | undefined): string | undefined => chip?.querySelector(".dg-try-cn")?.textContent ?? undefined;

describe("試す図のチップの名前 (#3458)", () => {
  it("try-chip-keeps-author-name", () => {
    const holder = document.createElement("div");
    holder.innerHTML = draw("renderDiagram")(parsedTry(chipTry({ examples: EXAMPLES })), { lang: "ja" }).svg;
    // item の行の名前と、書き手の例の ask の行の名前を、待ち行列のチップに切らずに出す
    for (const name of ["Alice", "Carol", "Dorothy"]) {
      const chip = holder.querySelector(`[data-chip="${name}"]`);
      expect(chip, `描いた図にチップ ${name} (data-chip) が無い`).not.toBeNull();
      expect(nameOf(chip), `待ち行列のチップ ${name} の字が名前を切る`).toBe(name);
    }
    // 釦が記録へ移したチップの行も、名前を切らずに出す
    const record = holder.querySelector('[data-log="records"] [data-record="1"]');
    expect(record, "描いた図の記録の列 records に記録 1 (data-record) が無い").not.toBeNull();
    for (const name of ["Dorothy", "Alice"]) {
      const row = record?.querySelector(`[data-item="${name}"]`);
      expect(row, `記録 1 に ${name} の行 (data-item) が無い`).not.toBeNull();
      expect(nameOf(row), `記録 1 の ${name} の行の字が名前を切る`).toBe(name);
    }
  });

  it("try-chip-fits-long-name", () => {
    const diagram = parsedTry(chipTry({ items: LONG_ITEMS, first: LONG_FIRST }));
    for (const width of [1440, 324]) {
      const layout = draw("renderDiagram")(diagram, { lang: "ja", width }).layout as unknown as ChipLayout;
      for (const name of [LONG, WIDE])
        expect(layout.chip.w, `枠 ${width}px のチップの幅が ${name} の字の幅と左右の余白より狭い`).toBeGreaterThanOrEqual(
          textWidth(name, TYPE.tryChip) + TRY_LOOK.chip.padX * 2,
        );
      const queue = layout.queues.find((q) => q.id === "pool");
      expect(queue, `枠 ${width}px で待ち行列 pool の置き場所が無い`).toBeDefined();
      for (const slot of queue?.slots ?? []) {
        const chip = { x: slot.x, y: slot.y, w: layout.chip.w, h: layout.chip.h };
        expect(within(chip, queue?.box ?? chip), `枠 ${width}px のチップ ${JSON.stringify(chip)} が待ち行列 pool の枠 ${JSON.stringify(queue?.box)} からはみ出す`).toBe(true);
      }
      const figure = { x: 0, y: 0, w: layout.width, h: layout.height };
      expect(within(queue?.box ?? figure, figure), `枠 ${width}px の待ち行列 pool の枠 ${JSON.stringify(queue?.box)} が図 ${JSON.stringify(figure)} からはみ出す`).toBe(true);
    }
  });
});

describe("入力の帯の打つ欄 (#3458)", () => {
  it("try-free-field-limits-twelve", () => {
    const { host } = mountTry(parsedTry(chipTry()));
    for (const field of ["name", "fee"]) {
      const input = askStrip(host)?.querySelector(`[data-field="${field}"]`);
      expect(input instanceof HTMLInputElement, `choose を持たない欄 ${field} が打つ欄 (input) でない`).toBe(true);
      expect(input instanceof HTMLInputElement ? input.maxLength : undefined, `打つ欄 ${field} に打てる字数が 12 字でない`).toBe(FREE_MOST);
    }
    const vote = askStrip(host)?.querySelector('[data-field="vote"]');
    expect(vote instanceof HTMLSelectElement, "choose を持つ欄 vote が選ぶ欄 (select) でない").toBe(true);
    expect(vote instanceof HTMLSelectElement ? [...vote.options].map((o) => o.value) : [], "選ぶ欄 vote の選択肢が choose の行と違う").toEqual(["yes", "no"]);
  });

  it("try-reader-name-shown-whole", () => {
    const { host, player } = mountTry(parsedTry(chipTry()));
    send(host, { name: LONG, fee: "9" });
    expect(lastState(tryLayout(sessionOf(player))).queues.pool ?? [], `打った 12 字の名前 ${LONG} のチップが待ち行列 pool に入らない`).toContain(LONG);
    const chip = figureOf(host)?.querySelector(`[data-chip="${LONG}"]`);
    expect(chip, `図にチップ ${LONG} (data-chip) が無い`).not.toBeNull();
    expect(nameOf(chip), "読み手が打った 12 字の名前のチップの字が名前を切る").toBe(LONG);
  });
});
