// @vitest-environment jsdom
/**
 * 試す図の関門の記録で、止まった節の行とエラーの名前の行を分ける (#3478)。
 *
 * 0.65.0 (#3476) の関門の記録は、止まった節 (`<節> で止まった`) とエラーの名前を 1 行に並べ、記録の幅をその行の字の幅で決めていた。
 * エラーの名前が長いと記録が広がり、記録を 3 つ横に並べる広い組みは幅 740 を、記録を縦に積む細い組みは幅 324 を超える。
 * 頁では 1 回目に送った所で図の幅が 740 から広がって組みが変わり、携帯の幅の頁では部品が置かれなかった。
 * 関門の記録は止まった節の行とエラーの名前の行を別の行に持ち、記録の幅は 2 つの行の長い方の字の幅で決める。
 * 記録が増えても試す図は広い組みで幅 740、細い組みで幅 324 に収まり、頁で送って記録が増えても図の幅は変わらない。
 *
 * 図は bitsumi の Canton の図解の試す図 (トランザクションが拒否される段) で、網の 4 つの節に 6 つの関門を置き、
 * エラーの名前は書き手の頁の解説のまま使う。英語の言葉 (`Stopped at <node>`) でも確かめるので、英字だけの図も足す。
 * 置き場所は描く部品が返す値 (`layout`) で、行の位置は描いた SVG の字の位置で確かめる。
 */
import { afterEach, describe, expect, it } from "vitest";
import { textWidth } from "../src/layout/measure";
import { TYPE } from "../src/look/values";
import { draw, type Rendered } from "./render-support";
import { askStrip, figureOf, mountTry, parsedTry, releaseTry, sendButton, tryLayout } from "./try-support";

afterEach(releaseTry);

/** 広い組みの図の幅の上限。関門の記録が無い試す図はこの幅で描く */
const WIDE = 740;
/** 携帯の幅の頁で図を置く枠の幅 (幅 390 の頁から余白を除いた幅) */
const PHONE = 324;
/** 広い頁の枠の幅 */
const DESK = 1440;

/** Canton の図の記録の列 */
const CANTON_LOG = "拒否の記録";

/** Canton の図の段。[題, 説明, 送る値]。送る値の段は、それぞれ 1 つの関門で止まるトランザクションを送る */
const CANTON_STEPS: readonly (readonly [string, string, string?])[] = [
  ["段ごとの関門を順に通る", "トランザクションは送る Participant Node、Sequencer、確かめる Participant Node、Mediator の順に関門を通ります。"],
  ["署名が無効だと送る前に止まる", "署名が無効なトランザクションは、送る Participant Node で止まります。", "送金A, 無効, 12000, 空き, 整合, 間に合う"],
  ["混んだ Sequencer は受け付けを待たせる", "Sequencer が混雑していると、Sequencer で止まります。", "送金B, 有効, 12000, 混雑, 整合, 間に合う"],
  ["27,000 byte を超える batch は受け付けない", "85,134 byte の batch は、Sequencer で止まります。", "送金C, 有効, 85134, 空き, 整合, 間に合う"],
  ["View が合わないと Reject が返る", "View が合わないと、確かめる Participant Node が Reject を返します。", "送金D, 有効, 12000, 空き, 不整合, 間に合う"],
  ["順序付けが遅れると timeout になる", "順序付けが遅れると、Sequencer で止まります。", "送金E, 有効, 12000, 空き, 整合, 順序付けの遅れ"],
  ["応答が遅れると ABORTED になる", "応答が遅れると、Mediator で止まります。", "送金F, 有効, 12000, 空き, 整合, 応答の遅れ"],
  ["全ての関門を通るとコミットする", "全ての関門に合うトランザクションだけがコミットされます。", "送金G, 有効, 12000, 空き, 整合, 間に合う"],
];

/** Canton の図の記法。部品、関門、段の塊を空の行で区切って並べる */
const CANTON = [
  "try トランザクションが拒否される段",
  [
    "route 送信経路: アプリ - 送るNode - Sequencer - 確かめるNode - Mediator [from: アプリ, to: Mediator]",
    "queue コミットした",
    `log ${CANTON_LOG}`,
    "ask トランザクション, 署名, 大きさ, 混み具合, View, 期限 [into: コミットした, via: 送信経路]",
    "choose 署名: 有効, 無効",
    "choose 大きさ: 12000, 85134",
    "choose 混み具合: 空き, 混雑",
    "choose View: 整合, 不整合",
    "choose 期限: 間に合う, 順序付けの遅れ, 応答の遅れ",
    `check 送るNode: 署名 == 有効 [no: INVALID_EXTERNAL_SIGNATURE, into: ${CANTON_LOG}]`,
    `check Sequencer: 混み具合 == 空き [no: SEQUENCER_BACKPRESSURE, retry, into: ${CANTON_LOG}]`,
    `check Sequencer: 大きさ <= 27000 [no: SEQUENCER_REQUEST_FAILED, into: ${CANTON_LOG}]`,
    `check Sequencer: 期限 != 順序付けの遅れ [no: NOT_SEQUENCED_TIMEOUT, retry, into: ${CANTON_LOG}]`,
    `check 確かめるNode: View == 整合 [no: Reject, into: ${CANTON_LOG}]`,
    `check Mediator: 期限 != 応答の遅れ [no: ABORTED, retry, into: ${CANTON_LOG}]`,
  ].join("\n"),
  ...CANTON_STEPS.map(([title, say, ask]) => [`step ${title}`, `  say ${say}`, ...(ask ? [`  ask ${ask}`] : [])].join("\n")),
].join("\n\n");

/** 英字だけの図の記録の列 */
const PLAIN_LOG = "rejects";

/** 英字だけの図の記法。網の 3 つの節に 4 つの関門を置き、段ごとに 1 つの関門で止まるチップを送る */
const PLAIN = [
  "try gate records",
  "route path: app - sender - Sequencer - checker - Mediator [from: app, to: Mediator]",
  "queue committed",
  `log ${PLAIN_LOG}`,
  "ask tx, sig, size, load, view [into: committed, via: path]",
  "choose sig: ok, bad",
  "choose size: 12000, 85134",
  "choose load: idle, busy",
  "choose view: match, mismatch",
  `check sender: sig == ok [no: BAD_SIGNATURE, into: ${PLAIN_LOG}]`,
  `check Sequencer: load == idle [no: SEQUENCER_BACKPRESSURE, retry, into: ${PLAIN_LOG}]`,
  `check Sequencer: size <= 27000 [no: SEQUENCER_REQUEST_FAILED, into: ${PLAIN_LOG}]`,
  `check checker: view == match [no: Reject, into: ${PLAIN_LOG}]`,
  "step start",
  "  say Each stage checks the chip.",
  "step bad signature",
  "  say A bad signature stops at the sender.",
  "  ask t1, bad, 12000, idle, match",
  "step busy",
  "  say A busy Sequencer stops the chip.",
  "  ask t2, ok, 12000, busy, match",
  "step too large",
  "  say A large batch stops at the Sequencer.",
  "  ask t3, ok, 85134, idle, match",
  "step mismatch",
  "  say A view mismatch stops at the checker.",
  "  ask t4, ok, 12000, idle, mismatch",
].join("\n");

/** 確かめる図。記法、描く言葉、関門の記録の列 */
const FIGURES = [
  { name: "Canton の図", text: CANTON, lang: "ja", log: CANTON_LOG },
  { name: "英字だけの図", text: PLAIN, lang: "en", log: PLAIN_LOG },
] as const;

/** 確かめる組み。枠の幅を渡さない広い組みと、携帯の幅の枠の細い組み */
const FRAMES = [
  { name: "枠の幅を渡さない図", width: undefined, most: WIDE },
  { name: `枠 ${PHONE}px の図`, width: PHONE, most: PHONE },
] as const;

/** 記録の列の 1 つの記録。関門で止まった記録は止まった節とエラーの名前を持つ */
interface GateRecord {
  number: number;
  items: string[];
  node?: string;
  error?: string;
}

/** 描いた記録の列の置き場所。`w` は 1 つの記録の枠の幅 */
interface LogPlaced {
  id: string;
  w: number;
}

/** 原本の最後の段の終わりの、記録の列 `log` の関門で止まった記録 */
function gateRecords(diagram: unknown, log: string): GateRecord[] {
  const states = tryLayout(diagram).states as unknown as { logs?: Record<string, GateRecord[]> }[];
  return (states[states.length - 1]?.logs?.[log] ?? []).filter((r) => r.node !== undefined);
}

/** 枠の幅 `width` で描いた図 */
const rendered = (diagram: unknown, lang: "ja" | "en", width: number | undefined): Rendered =>
  draw("renderDiagram")(diagram, { lang, ...(width === undefined ? {} : { width }) });

/** 描いた図の SVG を置いた要素 */
function holderOf(r: Rendered): HTMLElement {
  const holder = document.createElement("div");
  holder.innerHTML = r.svg;
  return holder;
}

/** SVG の描いた幅 (`viewBox` の幅) */
const drawnWidth = (svg: Element | null | undefined): number => Number((svg?.getAttribute("viewBox") ?? "").split(" ")[2]);

/** 字の左の端。`text-anchor` が `end` なら右の端から、`middle` なら真ん中から字の幅で戻す */
function leftOf(text: Element, width: number): number {
  const x = Number(text.getAttribute("x"));
  const anchor = text.getAttribute("text-anchor");
  return anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;
}

/** 入力の帯の欄に値を入れて送る。選ぶ欄 (select) と打つ欄 (input) のどちらにも入れる */
function sendValues(host: HTMLElement, values: Record<string, string>, label: string): void {
  const strip = askStrip(host);
  expect(strip, `${label}: 入力の帯 (form[data-dragon=ask]) が無い`).not.toBeNull();
  for (const [field, value] of Object.entries(values)) {
    const control = strip?.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-field="${field}"]`);
    expect(control, `${label}: 入力の帯に ${field} の欄が無い`).toBeTruthy();
    if (!control) continue;
    control.value = value;
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }
  const button = sendButton(host);
  expect(button, `${label}: 入力の帯に送る釦が無い`).not.toBeNull();
  expect(button?.disabled, `${label}: 送る釦が押せない (関門で止まる値も送れる)`).toBe(false);
  button?.click();
}

/** Canton の図の入力の帯から送る値。どれも Sequencer の関門で止まる */
const SENDS = [
  {
    label: "85134 byte のトランザクション",
    values: { トランザクション: "送金X", 署名: "有効", 大きさ: "85134", 混み具合: "空き", View: "整合", 期限: "間に合う" },
    error: "SEQUENCER_REQUEST_FAILED",
  },
  {
    label: "混雑した時のトランザクション",
    values: { トランザクション: "送金Y", 署名: "有効", 大きさ: "12000", 混み具合: "混雑", View: "整合", 期限: "間に合う" },
    error: "SEQUENCER_BACKPRESSURE",
  },
] as const;

describe("関門の記録 (#3478)", () => {
  it("try-gate-record-fits-widths", () => {
    for (const figure of FIGURES) {
      const diagram = parsedTry(figure.text, figure.lang);
      const records = gateRecords(diagram, figure.log);
      expect(records.length, `${figure.name} の関門で止まった記録の数`).toBeGreaterThanOrEqual(3);
      expect(
        records.some((r) => r.node === "Sequencer" && r.error === "SEQUENCER_REQUEST_FAILED"),
        `${figure.name} が Sequencer で SEQUENCER_REQUEST_FAILED で止まった記録を持たない: ${JSON.stringify(records)}`,
      ).toBe(true);
      for (const frame of FRAMES) {
        const svg = holderOf(rendered(diagram, figure.lang, frame.width)).querySelector("svg");
        expect(drawnWidth(svg), `${figure.name} を${frame.name}で描いた viewBox の幅が ${frame.most} を超える`).toBeLessThanOrEqual(frame.most);
      }
    }
  });

  it("try-gate-record-splits-rows", () => {
    for (const figure of FIGURES) {
      const diagram = parsedTry(figure.text, figure.lang);
      const records = gateRecords(diagram, figure.log);
      expect(records.length, `${figure.name} の関門で止まった記録の数`).toBeGreaterThanOrEqual(3);
      for (const frame of FRAMES) {
        const r = rendered(diagram, figure.lang, frame.width);
        const where = `${figure.name} を${frame.name}で描いた`;
        const placed = ((r.layout as unknown as { logs?: LogPlaced[] }).logs ?? []).find((l) => l.id === figure.log);
        expect(placed, `${where}置き場所に記録の列 ${figure.log} が無い`).toBeDefined();
        const frameW = placed?.w ?? 0;
        const holder = holderOf(r);
        for (const record of records) {
          const node = record.node ?? "";
          const error = record.error ?? "";
          const label = `${where}記録 ${record.number} (${node}、${error})`;
          const box = holder.querySelector(`[data-log="${figure.log}"] [data-record="${record.number}"]`);
          expect(box, `${label} が SVG に無い (data-record)`).not.toBeNull();
          const texts = [...(box?.querySelectorAll("text") ?? [])];
          const at = texts.find((t) => (t.textContent ?? "").includes(node) && t.textContent !== error);
          const name = texts.find((t) => t.textContent === error);
          expect(at, `${label} に止まった節 ${node} の字が無い`).toBeDefined();
          expect(name, `${label} にエラーの名前 ${error} だけの字が無い`).toBeDefined();
          if (!at || !name) continue;
          const atY = Number(at.getAttribute("y"));
          const nameY = Number(name.getAttribute("y"));
          expect(
            Math.abs(nameY - atY),
            `${label} の止まった節の字 (y ${atY}) とエラーの名前の字 (y ${nameY}) が同じ行に並ぶ`,
          ).toBeGreaterThanOrEqual(TYPE.tryChipValue.size);
          for (const [text, style] of [
            [at, TYPE.tryChip],
            [name, TYPE.tryChipValue],
          ] as const) {
            const content = text.textContent ?? "";
            const w = textWidth(content, style);
            expect(w, `${label} の字 ${content} の幅が記録の枠の幅 ${frameW} より狭くない`).toBeLessThan(frameW);
            const left = leftOf(text, w);
            expect(left, `${label} の字 ${content} の左の端が記録の枠の左からはみ出す`).toBeGreaterThanOrEqual(0);
            expect(left + w, `${label} の字 ${content} の右の端が記録の枠 (幅 ${frameW}) の右からはみ出す`).toBeLessThanOrEqual(frameW);
          }
        }
        expect((r as unknown as { overlaps?: unknown[] }).overlaps ?? [], `${where}図の字の重なり`).toEqual([]);
      }
    }
  });

  it("try-gate-record-keeps-figure-width", () => {
    const diagram = parsedTry(CANTON);
    for (const width of [DESK, PHONE]) {
      const { host } = mountTry(diagram, width, { lang: "ja" });
      const before = drawnWidth(figureOf(host));
      expect(before, `枠 ${width}px に置いた図の viewBox の幅が読めない`).toBeGreaterThan(0);
      SENDS.forEach((send, i) => {
        sendValues(host, send.values, `枠 ${width}px で ${send.label}`);
        const record = figureOf(host)?.querySelector(`[data-log="${CANTON_LOG}"] [data-record="${i + 1}"]`);
        expect(record?.textContent ?? "", `枠 ${width}px で ${send.label} を送っても記録 ${i + 1} に ${send.error} が出ない`).toContain(send.error);
        expect(drawnWidth(figureOf(host)), `枠 ${width}px で ${send.label} を送った後の図の viewBox の幅が送る前 (${before}) と違う`).toBe(before);
      });
      releaseTry();
    }
  });
});
