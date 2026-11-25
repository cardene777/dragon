// @vitest-environment jsdom
/**
 * 持ち主ごとのカードの図 (#3846)。
 *
 * 持ち主ごとの縦の列を横に並べ、カードを列の中に上から積み、段でカードができ、消え、動き、断られる様子を追う図。原本のJSONの`kind`は`cards`。
 * `box`が列で、書いた順に左から並ぶ。`item <id> as <名前> in <列>, <列>`がカードで、`in`に書いた全ての列に1枚ずつ写しが載る。
 * 段の中の`item`はその段でできたカード、在るカードの`item <id> in <列>`は動かす行、`delete`は消す行 (消し線で残る)、`refuse`は何も変えずに断る行。
 * 列ごとの合計は、消えていないカードの量を単位ごとに足し (`[total: none]`のカードは足さない)、段で変わった合計は前の量を添える。
 * 見た目の元はstep 2で本人が選んだ動く試作の案A (持ち主の縦の列を横に並べた板)。
 *
 * 並べた所 (`layout`) と時刻の表 (`timeline`) は描く部品が返す値で確かめる。
 * 段ごとの見え方は、jsdomの頁に置いた図の`data-dragon`の印 (Tracelythと約束した印) で確かめる。隠した要素 (`hidden`を持つ要素の中) は見えていない物と数える。
 * 種類の登録のfile (`src/kind-use/cards.ts`) と見本のfileがまだ無い間も、このfileを読み込んだ所で落とさず、無い物を名指して落とす。
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { api, type Json, type LineError } from "./diagram-support";
import { draw, type Layout, type Player, type Rect, type Rendered } from "./render-support";
import "../src/kind-use/architecture";
import "../src/kind-use/sequence";
import "../src/kind-use/state";

/** 持ち主ごとのカードの図の種類の登録のfile。まだ無い間もこのfileを読み込めるよう、名前を字で持って読む */
const CARDS_USE = "../src/kind-use/cards";
await import(/* @vite-ignore */ CARDS_USE).catch(() => undefined);

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** 持ち主ごとのカードの図の見本 */
const CARDS_EXAMPLES = ["note-transfer"] as const;

/** 仮名と漢字 */
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

type Lang = "ja" | "en";
type Point = [number, number];

/** 列。`head`は列の見出しの四角 */
interface CardColumn extends Rect {
  id: string;
  head: Rect;
}

/** 段`step`でのカードの写し。`column`は写しが載る列。消し線で残るカードも、その段の写しを持つ */
interface CardSeat extends Rect {
  id: string;
  column: string;
  step: number;
}

interface CardsLayout extends Omit<Layout, "boxes"> {
  kind: string;
  columns?: CardColumn[];
  cards?: CardSeat[];
  /** 合計の帯の場所。合計に足すカードが無い図は持たない */
  band?: Rect;
  /** 段ごとの列の合計 */
  totals?: unknown[];
}

interface CardsRendered extends Omit<Rendered, "layout"> {
  layout: CardsLayout;
}

/** 証書で100 USDCを送る図。課題で決めた記法の例を、書き戻した形で書く */
const NOTE = [
  "cards 証書で100 USDCを送る",
  "",
  "box alice as Alice",
  "box bob as Bob",
  "box carol as Carol",
  "box usdc as USDC [mark: 署名]",
  "",
  "item n1 as 証書#1 in alice, usdc [amount: 1000 USDC, mark: usdc]",
  "item n2 as 証書#2 in bob, usdc [amount: 200 USDC, mark: usdc]",
  "",
  "step AliceがBobへ100を送る",
  "  say 証書#1を使い切り、新しい証書2枚に替わる。",
  "  alice -> n1: 100を送る",
  "  delete n1",
  "  item n3 as 証書#3 in alice, usdc [amount: 900 USDC, mark: usdc]",
  "  item n4 as 証書#4 in bob, usdc [amount: 100 USDC, mark: usdc]",
  "",
  "step Bobが500を送ろうとする",
  "  say 残高が足りないので、何も変わらない。",
  "  bob -> n2: 500を送る",
  "  refuse n2: 残高が足りない",
  "",
].join("\n");

/** NOTEの列の名札と名前。書いた順 */
const COLUMNS = ["alice", "bob", "carol", "usdc"] as const;
const COLUMN_NAMES = ["Alice", "Bob", "Carol", "USDC"] as const;
/** NOTEのカードの名前と量 */
const CARD_NAMES: Readonly<Record<string, string>> = { n1: "証書#1", n2: "証書#2", n3: "証書#3", n4: "証書#4" };
const CARD_AMOUNTS: Readonly<Record<string, string>> = { n1: "1000 USDC", n2: "200 USDC", n3: "900 USDC", n4: "100 USDC" };

/** 記法の語を全て使う、書き戻した形の記法。列の印、印の繰り返し、合計に足さない量、動かす行、呼ぶ行、断る行、消す行を持つ */
const FULL = [
  "cards 許可と送り",
  "",
  "box alice as Alice [mark: 持ち主]",
  "box bob as Bob",
  "box usdc as USDC [mark: 署名]",
  "",
  "item n1 as 証書#1 in alice, usdc [amount: 1000 USDC, mark: alice, mark: usdc]",
  "item p1 as 許可#1 in bob [amount: 50 USDC, total: none]",
  "",
  "step 渡す",
  "  say Aliceが証書#1をBobへ渡す。",
  "  alice -> n1: 渡す",
  "  item n1 in bob, usdc",
  "",
  "step 断る",
  "  say 許可を越えるので、何も変わらない。",
  "  bob -> p1: 80を使う",
  "  refuse p1: 許可を越える",
  "",
  "step 消す",
  "  say 許可を消す。",
  "  delete p1",
  "",
].join("\n");

/** 段2でカードを作り、初めから在るカードを消し、段3で何もしない図 */
const CREATE = [
  "cards 作って消す",
  "",
  "box a as A",
  "box b as B",
  "",
  "item k1 as 券1 in a, b [amount: 10 USDC]",
  "",
  "step 置く",
  "  say まだ何も変えない。",
  "",
  "step 作って消す",
  "  say 券2を作り、券1を消す。",
  "  item k2 as 券2 in a, b [amount: 5 USDC]",
  "  delete k1",
  "",
  "step 後の段",
  "  say 消した券は消し線で残る。",
  "",
].join("\n");

/** 段2で券1をAの列からBの列へ動かす図。Cの列には残す */
const MOVE = [
  "cards 動かす",
  "",
  "box a as A",
  "box b as B",
  "box c as C",
  "",
  "item k1 as 券1 in a, c [amount: 10 USDC]",
  "item k2 as 券2 in a [amount: 3 USDC]",
  "",
  "step 置く",
  "  say まだ動かさない。",
  "",
  "step 動かす",
  "  say 券1をBへ動かす。",
  "  item k1 in b, c",
  "",
  "step 後の段",
  "  say 動いた先に残る。",
  "",
].join("\n");

/** 2つの単位の量を持ち、段2で量を消して足す図 */
const TOTALS = [
  "cards 単位ごとの合計",
  "",
  "box a as A",
  "box b as B",
  "",
  "item k1 as 券1 in a [amount: 100 USDC]",
  "item k2 as 券2 in a [amount: 2 ETH]",
  "item k3 as 券3 in a, b [amount: 50 USDC]",
  "",
  "step 置く",
  "  say まだ変えない。",
  "",
  "step 消して足す",
  "  say 券1を消し、券4を足す。",
  "  delete k1",
  "  item k4 as 券4 in b [amount: 30 USDC]",
  "",
  "step 変えない",
  "  say 合計は変わらない。",
  "",
].join("\n");

/** 合計に足さない量のカード (許可) を持つ図。段1で合計に足さないカードを足す */
const NONE = [
  "cards 合計に足さない量",
  "",
  "box a as A",
  "box b as B",
  "",
  "item k1 as 証書#1 in a [amount: 100 USDC]",
  "item p1 as 許可#1 in a, b [amount: 40 USDC, total: none]",
  "",
  "step 許す",
  "  say 許可は量を持つが、合計に足さない。",
  "  item p2 as 許可#2 in a [amount: 5 USDC, total: none]",
  "",
].join("\n");

/** 量を持つ全てのカードが合計に足さないカード (`total: none`) の図。課題 (#3944) の記法に段を1つ足し、段の中でも足さないカードを作る */
const ALL_NONE = [
  "cards 足さない量だけ",
  "",
  "box alice as Alice",
  "box bob as Bob",
  "",
  "item c1 as 券#1 in alice, bob [amount: 100 USDC, total: none]",
  "",
  "step 見る",
  "  say 足すカードは無い。",
  "  item c2 as 券#2 in bob [amount: 5 USDC, total: none]",
  "",
].join("\n");

/** 量を持つカードが1枚も無い図 */
const NO_AMOUNT = [
  "cards 量の無いカード",
  "",
  "box alice as Alice",
  "box bob as Bob",
  "",
  "item c1 as 券#1 in alice, bob",
  "",
  "step 見る",
  "  say 量を持つカードは無い。",
  "",
].join("\n");

/** 合計に足すカードを1枚だけ持つ図。足さないカードも載せ、足すカードの載らない列を持つ */
const ONE_COUNTED = [
  "cards 足すカードが1枚",
  "",
  "box alice as Alice",
  "box bob as Bob",
  "",
  "item c1 as 券#1 in alice [amount: 100 USDC]",
  "item p1 as 許可#1 in alice, bob [amount: 40 USDC, total: none]",
  "",
  "step 見る",
  "  say 券#1だけを足す。",
  "",
].join("\n");

/** 最初の段より前のカードは全て合計に足さず、段2で合計に足すカードを作る図 */
const COUNTED_LATER = [
  "cards 後から足す",
  "",
  "box alice as Alice",
  "box bob as Bob",
  "",
  "item p1 as 許可#1 in alice, bob [amount: 40 USDC, total: none]",
  "",
  "step 置く",
  "  say まだ足すカードは無い。",
  "",
  "step 作る",
  "  say 足すカードを作る。",
  "  item c1 as 券#1 in alice [amount: 100 USDC]",
  "",
].join("\n");

/** 最初の量のカードが合計に足さないETHのカードで、合計に足すカードがUSDCだけの図。Bの列には合計に足すカードが載らない */
const ZERO_UNIT = [
  "cards 足す単位の0",
  "",
  "box a as A",
  "box b as B",
  "",
  "item p1 as 許可#1 in a, b [amount: 2 ETH, total: none]",
  "item c1 as 券#1 in a [amount: 50 USDC]",
  "",
  "step 見る",
  "  say Bの列に足すカードは無い。",
  "",
].join("\n");

/** 列ごとに印の語を持ち、カードごとに印を出す列を選ぶ図。印を2つの列に出すカードと、印を持たないカードを持つ */
const MARKS = [
  "cards 印を出す列",
  "",
  "box alice as Alice [mark: 持ち主]",
  "box bob as Bob",
  "box usdc as USDC [mark: 署名]",
  "",
  "item n1 as 証書#1 in alice, usdc [amount: 10 USDC, mark: usdc]",
  "item n2 as 証書#2 in alice, bob, usdc [amount: 20 USDC, mark: alice, mark: usdc]",
  "item n3 as 証書#3 in alice, usdc [amount: 30 USDC]",
  "",
  "step 見る",
  "  say 印は選んだ列にだけ出る。",
  "  item n4 as 証書#4 in bob, usdc [amount: 5 USDC, mark: usdc]",
  "",
].join("\n");

/** 列を断る図。段2でカードを持たないCarolの列を断り、段3でカードを持つAliceの列を断る。どちらもカードを変えない */
const REFUSE_COLUMN = [
  "cards 列で断る",
  "",
  "box alice as Alice",
  "box bob as Bob",
  "box carol as Carol",
  "",
  "item n1 as 証書#1 in alice, bob [amount: 100 USDC]",
  "",
  "step 置く",
  "  say まだ断らない。",
  "",
  "step Carolを断る",
  "  say Carolはまだ証書を持てない。",
  "  refuse carol: 口座が無い",
  "",
  "step Aliceを断る",
  "  say Aliceの送りを止める。",
  "  refuse alice: 止めている",
  "",
].join("\n");

/** 見本のfileの中身。無ければ`undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** 見本のfileから、最初の注釈の行と、その後ろの空の行を外した記法 */
const withoutComments = (text: string): string => text.replace(/^(?:\/\/[^\n]*\n)+\n*/u, "");

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: Lang = "ja"): Json {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `持ち主ごとのカードの図の記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
  return read.ok ? read.diagram : {};
}

/** 描いた図。描けなければ断りの文を名指して落とす */
function render(diagram: Json, lang?: Lang): CardsRendered {
  let rendered: Rendered | undefined;
  let refusal = "";
  try {
    rendered = draw("renderDiagram")(diagram, lang ? { lang } : {});
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "持ち主ごとのカードの図を描けない").toBe("");
  const layout = (rendered as unknown as CardsRendered | undefined)?.layout;
  expect(layout?.kind, "描いた図が持ち主ごとのカードの図 (cards) でない").toBe("cards");
  expect(layout?.columns, "並べた図に列 (layout.columns) が無い").toBeDefined();
  expect(layout?.cards, "並べた図にカードの写し (layout.cards) が無い").toBeDefined();
  return rendered as unknown as CardsRendered;
}

const columnOf = (layout: CardsLayout, id: string): CardColumn => {
  const column = (layout.columns ?? []).find((c) => c.id === id);
  expect(column, `${id}の列が並べた図に無い`).toBeDefined();
  return column as CardColumn;
};

/** 段`step`で列`column`に載る写しを、上から並べた物 */
const seatsAt = (layout: CardsLayout, step: number, column: string): CardSeat[] =>
  (layout.cards ?? []).filter((s) => s.step === step && s.column === column).sort((a, b) => a.y - b.y);

/** 点`p`が四角`r`を`pad`だけ広げた中に在るか */
const near = (p: Point | undefined, r: Rect, pad = 8): boolean =>
  p !== undefined && p[0] >= r.x - pad && p[0] <= r.x + r.w + pad && p[1] >= r.y - pad && p[1] <= r.y + r.h + pad;

const players: Player[] = [];
afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  document.body.innerHTML = "";
});

/** 図を頁に置き、段1の止め絵で止める。置けなければ断りの文を名指して落とす */
function mount(diagram: Json, lang: Lang = "ja"): { host: HTMLElement; player: Player } {
  const host = document.createElement("div");
  document.body.appendChild(host);
  let player: Player | undefined;
  let refusal = "";
  try {
    player = draw("mountDiagram")(host, diagram, { lang, pausedAt: 0 });
  } catch (error) {
    refusal = String(error);
  }
  expect(refusal, "持ち主ごとのカードの図を頁に置けない").toBe("");
  if (player) players.push(player);
  return { host, player: player as Player };
}

/** 見えている要素か。`hidden`を持つ要素の中の要素は見えていない */
const shown = (el: Element): boolean => el.closest("[hidden]") === null;

/** 要素の見えている字。隠した要素の中の字を除き、字の塊どうしを空白で繋ぐ */
function shownText(el: Element | null | undefined): string {
  if (!el) return "";
  const parts: string[] = [];
  const walk = (node: Node): void => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) parts.push(child.textContent ?? "");
      else if (child.nodeType === 1 && !(child as Element).hasAttribute("hidden")) walk(child);
    }
  };
  walk(el);
  return parts.join(" ").replace(/\s+/gu, " ").trim();
}

/** 字の中の量。桁の区切りの`,`を外し、`<数> <単位>`の形にして並べ替える */
function amounts(text: string): string[] {
  const plain = text.replace(/(?<=\d),(?=\d{3})/gu, "");
  return [...plain.matchAll(/(?<![\d.])(\d+(?:\.\d+)?)\s*(USDC|ETH)/gu)].map((m) => `${Number(m[1])} ${m[2]}`).sort();
}

/** 列に載ったカードの写し1枚 */
interface Copy {
  column: string;
  card: string;
  state: string | null;
  mark: string | null;
  name: string;
  amount: string;
}

/** 今の段で頁に見えている板 */
interface Board {
  columns: string[];
  copies: Copy[];
  /** 列の外に出ているカードの数 */
  loose: number;
  /** 列ごとの合計に出ている量 */
  totals: Record<string, string[]>;
  /** 理由の札。`column`は札が載る列、`note`は札か札を包む要素が箱の注釈の印 (`data-note`) を持つか */
  reasons: { text: string; column: string | null; note: boolean }[];
  /** 列の中の見えている字 */
  columnText: string;
  /** 列ごとの、列の中の見えている字 */
  columnTexts: Record<string, string>;
}

function board(host: HTMLElement): Board {
  const scope = host.querySelector('[data-dragon="player"]') ?? host;
  const all = (selector: string): Element[] => [...scope.querySelectorAll(selector)].filter(shown);
  const first = (el: Element, selector: string): Element | undefined => [...el.querySelectorAll(selector)].find(shown);
  const columns = all('[data-dragon="column"]');
  const copies = columns.flatMap((column) =>
    [...column.querySelectorAll('[data-dragon="card"]')].filter(shown).map((card) => ({
      column: column.getAttribute("data-node") ?? "",
      card: card.getAttribute("data-card") ?? "",
      state: card.getAttribute("data-state"),
      mark: card.getAttribute("data-mark"),
      name: shownText(first(card, '[data-dragon="card-name"]')),
      amount: shownText(first(card, '[data-dragon="amount"]')),
    })),
  );
  return {
    columns: columns.map((c) => c.getAttribute("data-node") ?? ""),
    copies,
    loose: all('[data-dragon="card"]').filter((card) => card.closest('[data-dragon="column"]') === null).length,
    totals: Object.fromEntries(all('[data-dragon="total"]').map((total) => [total.getAttribute("data-node") ?? "", amounts(shownText(total))])),
    reasons: all('[data-dragon="reason"]').map((reason) => ({
      text: shownText(reason),
      column: reason.closest('[data-dragon="column"]')?.getAttribute("data-node") ?? null,
      note: reason.closest("[data-note]") !== null,
    })),
    columnText: columns.map((c) => shownText(c)).join(" "),
    columnTexts: Object.fromEntries(columns.map((c) => [c.getAttribute("data-node") ?? "", shownText(c)])),
  };
}

/** 列ごとの、上から並んだカードの名札。カードの無い列は空 */
const stacks = (b: Board): Record<string, string[]> =>
  Object.fromEntries(b.columns.map((column) => [column, b.copies.filter((c) => c.column === column).map((c) => c.card)]));

/** 写しごとの`data-state` */
const states = (b: Board): Record<string, string | null> => Object.fromEntries(b.copies.map((c) => [`${c.column}/${c.card}`, c.state]));

/** 写しごとの`data-mark` */
const marks = (b: Board): Record<string, string | null> => Object.fromEntries(b.copies.map((c) => [`${c.column}/${c.card}`, c.mark]));

/** `record`のうち`keys`の欄だけ */
const pick = <T>(record: Record<string, T>, keys: readonly string[]): Record<string, T | undefined> => Object.fromEntries(keys.map((key) => [key, record[key]]));

/** 誤りを返して読まないことを確かめ、最初の誤りを返す。日本語と英語の両方で確かめる */
function refused(text: string, what: string): Record<Lang, LineError | undefined> {
  const parse = api("parseNotation");
  const out = { ja: undefined, en: undefined } as Record<Lang, LineError | undefined>;
  for (const lang of ["ja", "en"] as const) {
    const read = parse(text, { lang });
    expect(read.ok, `${what}を書いた持ち主ごとのカードの図が読めてしまう (${lang})`).toBe(false);
    const got: LineError | undefined = read.ok ? undefined : read.errors[0];
    const message = got?.message ?? "";
    expect(message, `${what}の誤りの文 (${lang})`).not.toBe("");
    if (lang === "en") expect(KANA.test(message), `${what}の英語の誤りの文に仮名か漢字がある: ${message}`).toBe(false);
    else expect(KANA.test(message), `${what}の日本語の誤りの文が日本語でない: ${message}`).toBe(true);
    out[lang] = got;
  }
  return out;
}

describe("持ち主ごとのカードの図の原本のJSON (#3846)", () => {
  it("schema-accepts-cards-diagram", () => {
    const validate = api("validateDiagram");
    const readDiagram = api("readDiagram");
    for (const [name, text] of [
      ["NOTE", NOTE],
      ["FULL", FULL],
    ] as const) {
      const diagram = parsed(text);
      const source = diagram as unknown as { kind?: string; blocks?: { box?: { id: string }[] } };
      expect(source.kind, `${name}の原本の種類`).toBe("cards");
      for (const lang of ["ja", "en"] as const) {
        const checked = validate(diagram, { lang });
        expect(checked.ok, `${name}の原本が形の検査で落ちる (${lang}): ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
      }
      // JSONの字にして読み直した原本も受け付ける
      const read = readDiagram(JSON.parse(JSON.stringify(diagram)));
      expect(read.ok, `${name}をJSONの字にして読み直した原本が読めない: ${JSON.stringify(read.ok ? [] : read.errors)}`).toBe(true);
    }
    // 列は原本の箱 (blocks.box) で、書いた順に並ぶ
    const note = parsed(NOTE) as unknown as { blocks?: { box?: { id: string }[] } };
    expect(note.blocks?.box?.map((b) => b.id), "NOTEの原本の箱").toEqual([...COLUMNS]);
    // 持ち主ごとのカードの図でも形の検査は箱の欄を確かめ、知らない欄を持つ箱は通さない
    const bad = structuredClone(parsed(NOTE)) as unknown as { blocks?: { box?: Record<string, unknown>[] } };
    const first = bad.blocks?.box?.[0];
    if (first) first.bogus = 1;
    expect(validate(bad as unknown as Json).ok, "知らない欄を持つ箱の持ち主ごとのカードの図が形の検査を通る").toBe(false);
  });
});

describe("持ち主ごとのカードの図の記法 (#3846)", () => {
  it("cards-roundtrip-keeps-notation", () => {
    const print = api("printNotation");
    for (const [name, text] of [
      ["NOTE", NOTE],
      ["FULL", FULL],
    ] as const) {
      const diagram = parsed(text);
      // 書き戻した形の記法は、読んで書き戻すと1字も変わらない
      expect(print(diagram), `${name}を読んで書き戻した記法が元と違う`).toBe(text);
      // 書き戻した記法から読んだ原本は、元の原本と同じ
      expect(parsed(print(diagram)), `${name}を書き戻した記法から読んだ原本が元と違う`).toEqual(diagram);
    }
    for (const key of CARDS_EXAMPLES) {
      for (const [file, lang] of [
        [`${key}.dragon`, "ja"],
        [`${key}.en.dragon`, "en"],
      ] as const) {
        const text = fileText(file);
        expect(text, `${file}がpackages/dragon/examplesに無い`).toBeDefined();
        if (text === undefined) continue;
        const diagram = parsed(text, lang);
        expect((diagram as unknown as { kind?: string }).kind, `${file}の図の種類`).toBe("cards");
        expect(print(diagram), `${file}を読んで書き戻した記法が元 (最初の注釈を除く) と違う`).toBe(withoutComments(text));
      }
    }
  });

  it("cards-rejects-unknown-names", () => {
    const parse = api("parseNotation");
    /** 列aとbと、aに載るカードk1を持ち、段を1つ書いた記法。誤りの行は、段より前の行はk1の後ろに、段の行は最後に足す */
    const base = ["cards 知らない名札", "", "box a as A", "box b as B", "", "item k1 as 券1 in a [amount: 1 USDC]", "", "step 動かす", "  say 動かす。"];
    const read = parse(base.join("\n"));
    expect(read.ok, `知らない名札を書かない記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    // refuseはカードも列も断れる
    for (const target of ["k1", "b"]) {
      const known = parse([...base, `  refuse ${target}: 足りない`].join("\n"));
      expect(known.ok, `在る名札${target}を断る行が読めない: ${known.ok ? "" : JSON.stringify(known.errors)}`).toBe(true);
    }
    /** 段より前に書く行と、段の中に書く行。どちらも知らない名札 zz を書く */
    const cases: [string, string, boolean][] = [
      ["知らない列に置くカード", "item k2 as 券2 in a, zz [amount: 1 USDC]", false],
      ["段の中で知らない列に置くカード", "item k2 as 券2 in zz", true],
      ["知らないカードを消す行", "delete zz", true],
      ["知らないカードを動かす行", "item zz in b", true],
      ["カードでも列でもない名札を断る行", "refuse zz: 足りない", true],
      ["知らないカードを呼ぶ行", "a -> zz: 呼ぶ", true],
    ];
    for (const [name, bad, inStep] of cases) {
      const line = inStep ? `  ${bad}` : bad;
      const lines = inStep ? [...base, line] : [...base.slice(0, 6), line, ...base.slice(6)];
      const want = { line: lines.indexOf(line) + 1, column: line.indexOf("zz") + 1 };
      const first = refused(lines.join("\n"), name);
      for (const lang of ["ja", "en"] as const) {
        const got = first[lang];
        expect(got && { line: got.line, column: got.column }, `${name}の誤りの行と列 (${lang}): ${got?.message}`).toEqual(want);
        expect(got?.message ?? "", `${name}の誤りの文 (${lang}) が知らない名札zzを示さない`).toContain("zz");
      }
    }
  });

  it("cards-rejects-a-mark-without-a-word", () => {
    const parse = api("parseNotation");
    /** 印の語を持たない列aと、印の語を持つ列b */
    const base = ["cards 印の無い列", "", "box a as A", "box b as B [mark: 署名]", ""];
    const tail = ["", "step 見る", "  say 見る。"];
    // 印の語を持つ列を選ぶカードは読める
    const good = parse([...base, "item k1 as 券1 in a, b [amount: 1 USDC, mark: b]", ...tail].join("\n"));
    expect(good.ok, `印の語を持つ列をmarkに選んだカードが読めない: ${good.ok ? "" : JSON.stringify(good.errors)}`).toBe(true);
    // 印の語を持たない列を選ぶカードは、段より前でも段の中でも、選んだ列の名札を指して止める
    const cases: [string, string[]][] = [
      ["段より前のカード", [...base, "item k1 as 券1 in a, b [amount: 1 USDC, mark: a]", ...tail]],
      ["段の中のカード", [...base, "item k1 as 券1 in b [amount: 1 USDC]", ...tail, "  item k2 as 券2 in a, b [amount: 2 USDC, mark: b, mark: a]"]],
    ];
    for (const [name, lines] of cases) {
      const index = lines.findIndex((l) => l.includes("mark: a"));
      const line = lines[index] as string;
      const want = { line: index + 1, column: line.indexOf("a", line.indexOf("mark: a") + "mark: ".length) + 1 };
      const first = refused(lines.join("\n"), `印の語を持たない列をmarkに選んだ${name}`);
      for (const lang of ["ja", "en"] as const) {
        const got = first[lang];
        expect(got && { line: got.line, column: got.column }, `印の語を持たない列をmarkに選んだ${name}の誤りの行と列 (${lang}): ${got?.message}`).toEqual(want);
      }
    }
  });

  it("notation-keeps-cards-words-plain-outside-cards", () => {
    const parse = api("parseNotation");
    for (const kind of ["sequence", "architecture", "state"] as const) {
      const text = [`${kind} カードの語の名札`, "box cards as カード", "box refuse as 断る", "box db", "step 送る", "  say 送る。", "  cards -> refuse: 送る", "  refuse -> db: 戻す"].join("\n");
      const read = parse(text);
      expect(read.ok, `${kind}でcardsとrefuseを名札にした箱が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
      const diagram = (read.ok ? read.diagram : {}) as unknown as { blocks?: { box?: { id: string }[] }; steps?: { events: { type: string; from?: string; to?: string }[] }[] };
      expect(diagram.blocks?.box?.map((b) => b.id), `${kind}の箱の名札`).toEqual(["cards", "refuse", "db"]);
      expect(diagram.steps?.[0]?.events.map((e) => ({ type: e.type, from: e.from, to: e.to })), `${kind}のcardsとrefuseから出る線`).toEqual([
        { type: "edge", from: "cards", to: "refuse" },
        { type: "edge", from: "refuse", to: "db" },
      ]);
    }
    // 持ち主ごとのカードの図の中では、段の中のrefuseは断る行で、refuseという名札への線ではない
    const note = parse(NOTE);
    expect(note.ok, `持ち主ごとのカードの図のrefuseの行が読めない: ${note.ok ? "" : JSON.stringify(note.errors)}`).toBe(true);
    if (!note.ok) return;
    const events = (note.diagram as unknown as { steps: { events: { from?: string; to?: string }[] }[] }).steps[1]?.events ?? [];
    expect(events.filter((e) => e.from === "refuse" || e.to === "refuse"), "持ち主ごとのカードの図でrefuseを名札として読んだ行").toEqual([]);
    expect(api("printNotation")(note.diagram), "持ち主ごとのカードの図を書き戻した記法にrefuseの行が無い").toContain("\n  refuse n2: 残高が足りない\n");
  });
});

describe("持ち主ごとのカードの図の並べ方と段 (#3846)", () => {
  it("cards-stack-in-every-listed-column", () => {
    const diagram = parsed(NOTE);
    const { layout } = render(diagram);
    // 列は箱を書いた順に左から並び、カードの無い列 (Carol) も列として残る
    const columns = layout.columns ?? [];
    expect(columns.map((c) => c.id), "並べた図の列の並び").toEqual([...COLUMNS]);
    for (const [i, column] of columns.entries()) {
      expect(column.w > 0 && column.h > 0, `${column.id}の列の四角が空`).toBe(true);
      expect(column.head.y >= column.y - 0.5 && column.head.y + column.head.h <= column.y + column.h + 0.5, `${column.id}の列の見出しが列の中に無い`).toBe(true);
      const left = columns[i - 1];
      if (left) expect(column.x, `${column.id}の列が${left.id}の列の右に無い`).toBeGreaterThanOrEqual(left.x + left.w - 0.5);
    }
    /** 段ごとの、列の上から並ぶカード。書いた全ての列に1枚ずつ載り、段でできたカードは列の下に足す */
    const want: Record<string, string[]>[] = [
      { alice: ["n1", "n3"], bob: ["n2", "n4"], carol: [], usdc: ["n1", "n2", "n3", "n4"] },
      { alice: ["n1", "n3"], bob: ["n2", "n4"], carol: [], usdc: ["n1", "n2", "n3", "n4"] },
    ];
    for (const [step, stack] of want.entries()) {
      for (const column of columns) {
        const seats = seatsAt(layout, step, column.id);
        expect(seats.map((s) => s.id), `段${step + 1}の${column.id}の列に上から並ぶカード`).toEqual(stack[column.id]);
        for (const [k, seat] of seats.entries()) {
          expect(seat.x >= column.x - 0.5 && seat.x + seat.w <= column.x + column.w + 0.5, `段${step + 1}の${column.id}の列の${seat.id}が列の幅からはみ出す`).toBe(true);
          expect(seat.y, `段${step + 1}の${column.id}の列の${seat.id}が見出しの下に無い`).toBeGreaterThanOrEqual(column.head.y + column.head.h - 0.5);
          const above = seats[k - 1];
          if (above) expect(seat.y, `段${step + 1}の${column.id}の列の${seat.id}が${above.id}に重なる`).toBeGreaterThanOrEqual(above.y + above.h - 0.5);
        }
      }
    }
    // 頁に置いた図も、列を書いた順に並べ、写し1枚ごとに1つのカードの要素を列の中に置く
    const { host, player } = mount(diagram);
    for (const [step, stack] of want.entries()) {
      player.goTo(step);
      const now = board(host);
      expect(now.columns, `段${step + 1}の頁の列の並び`).toEqual([...COLUMNS]);
      expect(stacks(now), `段${step + 1}の頁の列ごとのカード`).toEqual(stack);
      expect(now.loose, `段${step + 1}の頁で列の外に出ているカード`).toBe(0);
    }
  });

  it("cards-step-creates-and-deletes", () => {
    const { host, player } = mount(parsed(CREATE));
    /** 段ごとの写しの状態。初めから在るカードは段1でkept、段の中で作ったカードはその段でcreated、消したカードはその段から後もremoved */
    const want: Record<string, string>[] = [
      { "a/k1": "kept", "b/k1": "kept" },
      { "a/k1": "removed", "a/k2": "created", "b/k1": "removed", "b/k2": "created" },
      { "a/k1": "removed", "a/k2": "kept", "b/k1": "removed", "b/k2": "kept" },
    ];
    for (const [step, expected] of want.entries()) {
      player.goTo(step);
      const now = board(host);
      expect(states(now), `段${step + 1}の写しの状態 (data-state)`).toEqual(expected);
      // 消したカードは名前と量を消し線のまま残す
      for (const copy of now.copies.filter((c) => c.card === "k1")) {
        expect(copy.name, `段${step + 1}の${copy.column}の列の券1の名前`).toBe("券1");
        expect(amounts(copy.amount), `段${step + 1}の${copy.column}の列の券1の量`).toEqual(["10 USDC"]);
      }
    }
  });

  it("cards-step-moves-a-card", () => {
    const diagram = parsed(MOVE);
    const want: Record<string, string[]>[] = [
      { a: ["k1", "k2"], b: [], c: ["k1"] },
      { a: ["k2"], b: ["k1"], c: ["k1"] },
      { a: ["k2"], b: ["k1"], c: ["k1"] },
    ];
    const { host, player } = mount(diagram);
    for (const [step, stack] of want.entries()) {
      player.goTo(step);
      const now = board(host);
      expect(stacks(now), `段${step + 1}の列ごとのカード`).toEqual(stack);
      // 動いたカードは消えず、名前と量を持ったまま動く
      for (const copy of now.copies.filter((c) => c.card === "k1")) {
        expect(copy.state, `段${step + 1}の${copy.column}の列の券1が消えた物として出る`).not.toBe("removed");
        expect(copy.name, `段${step + 1}の${copy.column}の列の券1の名前`).toBe("券1");
        expect(amounts(copy.amount), `段${step + 1}の${copy.column}の列の券1の量`).toEqual(["10 USDC"]);
      }
    }
    // 並べた図でも、動かした段から券1の写しは書き直した列に載る
    const { layout } = render(diagram);
    for (const [step, stack] of want.entries()) {
      for (const column of ["a", "b", "c"]) {
        expect(seatsAt(layout, step, column).map((s) => s.id), `段${step + 1}の並べた図の${column}の列のカード`).toEqual(stack[column]);
      }
    }
  });

  it("cards-call-runs-from-column-head-to-card", () => {
    const rendered = render(parsed(NOTE));
    const { layout, timeline } = rendered;
    const calls = [
      { step: 0, from: "alice", to: "n1", label: "100を送る" },
      { step: 1, from: "bob", to: "n2", label: "500を送る" },
    ];
    for (const call of calls) {
      const what = `段${call.step + 1}の${call.from} -> ${call.to}`;
      // 段の最初に書いた行なので、段の出来事の0番目
      const edge = layout.edges.find((e) => e.step === call.step && e.event === 0);
      expect(edge && { from: edge.from, to: edge.to }, `${what}の呼び出しの線が並べた図に無い`).toEqual({ from: call.from, to: call.to });
      const points = (edge?.points ?? []) as Point[];
      expect(points.length, `${what}の呼び出しの線の点の数`).toBeGreaterThanOrEqual(2);
      // 線は列の見出しから出て、同じ列に載るそのカードで終わる
      const head = columnOf(layout, call.from).head;
      expect(near(points[0], head), `${what}の線が${call.from}の列の見出しから出ない: ${JSON.stringify(points[0])} / ${JSON.stringify(head)}`).toBe(true);
      const seat = seatsAt(layout, call.step, call.from).find((s) => s.id === call.to);
      expect(seat, `${what}の行き先のカードが段${call.step + 1}の${call.from}の列に無い`).toBeDefined();
      if (seat) expect(near(points[points.length - 1], seat), `${what}の線が${call.to}のカードで終わらない: ${JSON.stringify(points[points.length - 1])} / ${JSON.stringify(seat)}`).toBe(true);
      // 線はその段の間に引き、線の名前を描く
      const span = timeline.steps[call.step];
      const drawn = timeline.edges.find((e) => e.step === call.step && e.event === 0);
      expect(drawn, `${what}の線を引く時刻が無い`).toBeDefined();
      if (drawn && span) expect(drawn.start >= span.start - 1e-9 && drawn.drawn <= span.end + 1e-9, `${what}の線がその段の間に引かれない`).toBe(true);
      expect(rendered.svg.includes(call.label), `${what}の線の名前「${call.label}」が描いた図に無い`).toBe(true);
    }
  });

  it("cards-refuse-changes-nothing", () => {
    /** 写しごとの名前と量と状態。断る前の段でできたカードは、断った段では在り続けるカード (kept) として比べる */
    const cardsOf = (b: Board): Record<string, unknown> =>
      Object.fromEntries(b.copies.map((c) => [`${c.column}/${c.card}`, { state: c.state === "created" ? "kept" : c.state, name: c.name, amount: amounts(c.amount) }]));
    for (const [lang, word] of [
      ["ja", /断られた/u],
      ["en", /refused/iu],
    ] as const) {
      const { host, player } = mount(parsed(NOTE), lang);
      player.goTo(0);
      const before = board(host);
      player.goTo(1);
      const after = board(host);
      // 断った段はカードを1枚も作らず、消さず、動かさない
      expect(stacks(after), `断った段 (${lang}) の列ごとのカード`).toEqual(stacks(before));
      expect(cardsOf(after), `断った段 (${lang}) の写しの名前と量と状態`).toEqual(cardsOf(before));
      expect(after.copies.filter((c) => c.state === "created").map((c) => `${c.column}/${c.card}`), `断った段 (${lang}) でできたカード`).toEqual([]);
      // 合計も変わらず、前の量を添えない
      expect(pick(after.totals, ["alice", "bob", "usdc"]), `断った段 (${lang}) の合計`).toEqual({ alice: ["900 USDC"], bob: ["300 USDC"], usdc: ["1200 USDC"] });
      // 断られたカードの下に、断られた札と理由の札を出す。断る前の段には出さない
      expect(before.reasons, `断る前の段 (${lang}) に出た理由の札`).toEqual([]);
      expect(word.test(before.columnText), `断る前の段 (${lang}) に断られた札が出ている`).toBe(false);
      expect(after.reasons.length, `断った段 (${lang}) に理由の札が無い`).toBeGreaterThan(0);
      for (const reason of after.reasons) {
        expect(reason.text, `断った段 (${lang}) の理由の札の字`).toBe("残高が足りない");
        expect(["bob", "usdc"], `断った段 (${lang}) の理由の札が、断られた証書#2の載る列に無い`).toContain(reason.column);
      }
      expect(word.test(after.columnText), `断った段 (${lang}) に断られた札が無い: ${after.columnText}`).toBe(true);
    }
    // 列を断る行 (`refuse <列>: <理由>`) も、カードを1枚も変えず、合計も変えず、断られた札と理由の札をその列の中に出す。
    // カードを持たない列 (まだカードができる前の断り) とカードを持つ列の両方で確かめる
    const refusals = [
      { step: 1, column: "carol", reason: "口座が無い" },
      { step: 2, column: "alice", reason: "止めている" },
    ];
    for (const [lang, word] of [
      ["ja", /断られた/u],
      ["en", /refused/iu],
    ] as const) {
      const { host, player } = mount(parsed(REFUSE_COLUMN), lang);
      player.goTo(0);
      const first = board(host);
      expect(stacks(first), `列を断る図の段1 (${lang}) の列ごとのカード`).toEqual({ alice: ["n1"], bob: ["n1"], carol: [] });
      expect(first.reasons, `列を断る前の段 (${lang}) に出た理由の札`).toEqual([]);
      expect(word.test(first.columnText), `列を断る前の段 (${lang}) に断られた札が出ている`).toBe(false);
      for (const refusal of refusals) {
        const what = `段${refusal.step + 1}で${refusal.column}の列を断った図 (${lang})`;
        player.goTo(refusal.step - 1);
        const before = board(host);
        player.goTo(refusal.step);
        const after = board(host);
        expect(stacks(after), `${what}の列ごとのカード`).toEqual(stacks(first));
        expect(states(after), `${what}の写しの状態 (data-state)`).toEqual(states(before));
        expect(cardsOf(after), `${what}の写しの名前と量と状態`).toEqual(cardsOf(before));
        expect(pick(after.totals, ["alice", "bob"]), `${what}の合計`).toEqual({ alice: ["100 USDC"], bob: ["100 USDC"] });
        const own = after.reasons.filter((r) => r.text === refusal.reason);
        expect(own.length, `${what}に理由の札「${refusal.reason}」が無い`).toBeGreaterThan(0);
        for (const reason of own) expect(reason.column, `${what}の理由の札が断った列の中に無い`).toBe(refusal.column);
        expect(word.test(after.columnTexts[refusal.column] ?? ""), `${what}の断られた札が断った列の中に無い: ${after.columnTexts[refusal.column] ?? ""}`).toBe(true);
      }
    }
  });

  it("cards-total-sums-live-cards-by-unit", () => {
    const { host, player } = mount(parsed(TOTALS));
    /** 段ごとの列の合計に出る量。段2のAの列はUSDCが150から50に変わり前の量を添え、変わらないETHは添えない。Bの列は50から80に変わる */
    const want: Record<string, string[]>[] = [
      { a: ["150 USDC", "2 ETH"], b: ["50 USDC"] },
      { a: ["150 USDC", "2 ETH", "50 USDC"], b: ["50 USDC", "80 USDC"] },
      { a: ["2 ETH", "50 USDC"], b: ["80 USDC"] },
    ];
    for (const [step, expected] of want.entries()) {
      player.goTo(step);
      const now = board(host);
      const sorted = Object.fromEntries(Object.entries(expected).map(([column, list]) => [column, [...list].sort()]));
      expect(pick(now.totals, ["a", "b"]), `段${step + 1}の列ごとの合計`).toEqual(sorted);
    }
  });

  it("cards-total-skips-total-none-cards", () => {
    const { host } = mount(parsed(NONE));
    const now = board(host);
    // 合計に足さない量のカードは、量をカードに出す
    const amountOf = Object.fromEntries(now.copies.map((c) => [`${c.column}/${c.card}`, amounts(c.amount)]));
    expect(amountOf, "カードに出る量").toEqual({ "a/k1": ["100 USDC"], "a/p1": ["40 USDC"], "a/p2": ["5 USDC"], "b/p1": ["40 USDC"] });
    // Aの列の合計は証書#1の量だけで、許可を足した段でも変わらないので前の量を添えない
    expect(now.totals.a, "Aの列の合計").toEqual(["100 USDC"]);
    // 許可だけが載るBの列の合計は、許可の量を足さない
    expect((now.totals.b ?? []).filter((amount) => amount !== "0 USDC"), "許可だけが載るBの列の合計").toEqual([]);
  });

  /** 頁に置いた図の合計の帯 (`.dg-cd-band`) と合計の印 (`data-dragon="total"`) の数。隠した段の組の印も数える */
  const bandMarks = (host: HTMLElement): { band: number; totals: number } => ({
    band: host.querySelectorAll(".dg-cd-band").length,
    totals: host.querySelectorAll('[data-dragon="total"]').length,
  });

  it("cards-total-band-absent-when-no-card-counts", () => {
    const diagram = parsed(ALL_NONE);
    for (const lang of ["ja", "en"] as const) {
      const { layout } = render(diagram, lang);
      expect(layout.band, `全てのカードが合計に足さない図 (${lang}) が合計の帯の場所 (layout.band) を持つ`).toBeUndefined();
      expect(layout.totals ?? [], `全てのカードが合計に足さない図 (${lang}) の列の合計 (layout.totals)`).toEqual([]);
      const { host, player } = mount(diagram, lang);
      expect(bandMarks(host), `全てのカードが合計に足さない図 (${lang}) の合計の帯と合計の印の数`).toEqual({ band: 0, totals: 0 });
      for (const step of [0, 1]) {
        player.goTo(step);
        expect(board(host).totals, `全てのカードが合計に足さない図 (${lang}) の段${step + 1}に見える合計`).toEqual({});
      }
    }
  });

  it("cards-total-band-absent-without-amounts", () => {
    const diagram = parsed(NO_AMOUNT);
    const { layout } = render(diagram);
    expect(layout.band, "量を持つカードが無い図が合計の帯の場所 (layout.band) を持つ").toBeUndefined();
    const { host } = mount(diagram);
    expect(bandMarks(host), "量を持つカードが無い図の合計の帯と合計の印の数").toEqual({ band: 0, totals: 0 });
  });

  it("cards-total-band-drawn-for-one-counted-card", () => {
    const diagram = parsed(ONE_COUNTED);
    for (const lang of ["ja", "en"] as const) {
      const { layout } = render(diagram, lang);
      expect(layout.band, `足すカードを1枚持つ図 (${lang}) に合計の帯の場所 (layout.band) が無い`).toBeDefined();
      const { host } = mount(diagram, lang);
      expect(bandMarks(host).band, `足すカードを1枚持つ図 (${lang}) の合計の帯の数`).toBe(1);
      // 足すカードの載らないBobの列も合計を出し、足さない許可の量は足さない
      expect(pick(board(host).totals, ["alice", "bob"]), `足すカードを1枚持つ図 (${lang}) の列ごとの合計`).toEqual({ alice: ["100 USDC"], bob: ["0 USDC"] });
    }
  });

  it("cards-total-band-stays-when-a-step-makes-a-counted-card", () => {
    const diagram = parsed(COUNTED_LATER);
    const { layout } = render(diagram);
    expect(layout.band, "段の中で足すカードを作る図に合計の帯の場所 (layout.band) が無い").toBeDefined();
    const { host, player } = mount(diagram);
    expect(bandMarks(host).band, "段の中で足すカードを作る図の合計の帯の数").toBe(1);
    // 帯は全ての段で同じ場所に1つだけ在り、足すカードを作る前の段も列ごとの合計を出す
    const want: Record<string, string[]>[] = [
      { alice: ["0 USDC"], bob: ["0 USDC"] },
      { alice: ["100 USDC"], bob: ["0 USDC"] },
    ];
    for (const [step, expected] of want.entries()) {
      player.goTo(step);
      expect(pick(board(host).totals, ["alice", "bob"]), `段の中で足すカードを作る図の段${step + 1}の列ごとの合計`).toEqual(expected);
    }
  });

  it("cards-total-zero-takes-first-counted-unit", () => {
    const diagram = parsed(ZERO_UNIT);
    for (const lang of ["ja", "en"] as const) {
      const { host } = mount(diagram, lang);
      // Bの列は合計に足すカードを持たないので、足すカードの単位 (USDC) で0を出し、足さない許可の単位 (ETH) では出さない
      expect(pick(board(host).totals, ["a", "b"]), `足さないカードが最初に在る図 (${lang}) の列ごとの合計`).toEqual({ a: ["50 USDC"], b: ["0 USDC"] });
    }
  });

  it("cards-mark-shows-only-on-named-columns", () => {
    const diagram = parsed(MARKS);
    /** 写しごとの印。カードのmarkに選んだ列の写しにだけ、その列の印の語を出す。markを繰り返したカードは選んだ全ての列に出す */
    const want = {
      "alice/n1": null,
      "alice/n2": "持ち主",
      "alice/n3": null,
      "bob/n2": null,
      "bob/n4": null,
      "usdc/n1": "署名",
      "usdc/n2": "署名",
      "usdc/n3": null,
      "usdc/n4": "署名",
    };
    for (const lang of ["ja", "en"] as const) {
      const { host } = mount(diagram, lang);
      expect(marks(board(host)), `写しごとの印 (data-mark、${lang})`).toEqual(want);
    }
  });

  it("cards-dom-carries-the-promised-marks", () => {
    const { host } = mount(parsed(NOTE));
    const root = host.querySelector('[data-dragon="player"]');
    expect(root, '図の根 ([data-dragon="player"]) が無い').not.toBeNull();
    if (!root) return;
    expect(root.matches('[data-diagram="cards"]') || root.querySelector('[data-diagram="cards"]') !== null, '図に data-diagram="cards" が無い').toBe(true);
    // 列と列の見出し
    const columns = [...root.querySelectorAll('[data-dragon="column"]')];
    expect(columns.map((c) => c.getAttribute("data-node")), '列 ([data-dragon="column"]) の data-node').toEqual([...COLUMNS]);
    for (const [i, column] of columns.entries()) {
      const heads = [...column.querySelectorAll('[data-dragon="column-head"]')];
      expect(heads.length, `${COLUMNS[i]}の列の見出し ([data-dragon="column-head"]) の数`).toBe(1);
      expect(shownText(heads[0]), `${COLUMNS[i]}の列の見出しの字`).toContain(COLUMN_NAMES[i]);
    }
    // カードとカードの名と量と印
    const now = board(host);
    expect(now.copies.length, '列の中のカード ([data-dragon="card"])').toBe(8);
    expect(now.loose, "列の外に出ているカード").toBe(0);
    for (const copy of now.copies) {
      const what = `${copy.column}の列の${copy.card}`;
      expect(["created", "removed", "kept"], `${what}の data-state`).toContain(copy.state);
      expect(copy.name, `${what}の名 ([data-dragon="card-name"])`).toBe(CARD_NAMES[copy.card]);
      expect(amounts(copy.amount), `${what}の量 ([data-dragon="amount"])`).toEqual([CARD_AMOUNTS[copy.card]]);
    }
    expect(marks(now), "印の出ている写しの data-mark").toEqual({
      "alice/n1": null,
      "alice/n3": null,
      "bob/n2": null,
      "bob/n4": null,
      "usdc/n1": "署名",
      "usdc/n2": "署名",
      "usdc/n3": "署名",
      "usdc/n4": "署名",
    });
    // 合計
    expect(Object.keys(now.totals).sort(), '合計 ([data-dragon="total"]) の data-node').toEqual(expect.arrayContaining(["alice", "bob", "usdc"]));
    // 段の番号と送りのボタン
    const no = root.querySelector('[data-dragon="step-no"]');
    const next = root.querySelector<HTMLButtonElement>('button[data-dragon="next"]');
    const prev = root.querySelector<HTMLButtonElement>('button[data-dragon="prev"]');
    expect(no?.textContent, '段の番号 ([data-dragon="step-no"])').toBe("01/02");
    expect(next, '送りのボタン (button[data-dragon="next"]) が無い').not.toBeNull();
    expect(prev, '戻りのボタン (button[data-dragon="prev"]) が無い').not.toBeNull();
    expect(now.reasons, "段1に出た理由の札").toEqual([]);
    next?.click();
    expect(no?.textContent, "送りのボタンを押した後の段の番号").toBe("02/02");
    const later = board(host);
    expect(states(later)["alice/n3"], "送りのボタンを押した後の、前の段でできたカードの data-state").toBe("kept");
    // 理由の札は data-dragon="reason" で、箱の注釈の印 (data-note) を使わない
    expect(later.reasons.length, '段2の理由の札 ([data-dragon="reason"]) が無い').toBeGreaterThan(0);
    for (const reason of later.reasons) {
      expect(reason.text, "理由の札の字").toBe("残高が足りない");
      expect(reason.note, "理由の札が箱の注釈の印 (data-note) を使う").toBe(false);
    }
    prev?.click();
    expect(no?.textContent, "戻りのボタンを押した後の段の番号").toBe("01/02");
    expect(board(host).reasons, "戻りのボタンを押した後に残る理由の札").toEqual([]);
  });
});
