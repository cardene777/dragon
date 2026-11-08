// @vitest-environment jsdom
/**
 * 読み手が値を入れて動かせる図の再生 (#3337)。
 *
 * 試す図 (`try`) は置いた時に最初の段で止まり、読み手が押すまで段を進めない。書き手が例として書いた 2 段目より後は流さない。
 * 読み手が入力の帯で送るか釦を押すか、機械の列のチップを書き換えるたびに、再生の部品が段を 1 つ作って原本の最後に足し、その段を流す。
 * 足した後の原本は `player.diagram` に持ち、段ごとの状態は描く部品が返す置き場所 (`layout.states`) で確かめる。
 * jsdom は配置を測れないので、釦の大きさと幅 390px の並びは `interactive-browser.test.ts` が実際の Chromium で確かめる。
 */
import { afterEach, describe, expect, it } from "vitest";
import { textWidth } from "../src/layout/measure";
import { LOOK, TYPE } from "../src/look/values";
import {
  blockHash,
  edit,
  figureOf,
  GENESIS,
  lastState,
  mountTry,
  parsedTry,
  press,
  pressButton,
  releaseTry,
  SHORTEST,
  SMALL_PARTS,
  SMALL_VALUES,
  send,
  sendButton,
  sessionOf,
  smallTry,
  stepsOf,
  type TryBlock,
  tryLayout,
  txBlock,
  labeledAskTry,
  WIDE_ASK_LONGEST,
  wideAskTry,
} from "./try-support";

/** 読み手が送るチップ */
const ME = { sender: "me", to: "bob", amount: "2", fee: "6" } as const;

afterEach(() => {
  releaseTry();
  delete (window as { matchMedia?: unknown }).matchMedia;
});

/** 動きを嫌う設定を模す */
function reduceMotion(reduce: boolean): void {
  window.matchMedia = (query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

/** 機械の列 `blocks` の、押した後の最後の段のブロック */
const blocksAfter = (diagram: unknown): TryBlock[] =>
  lastState(tryLayout(diagram)).chains.blocks ?? [];

/** 1 件ずつ取り出す釦の小さな図 */
const oneByOne = (): string =>
  smallTry({
    parts: SMALL_PARTS.map((line) =>
      line.startsWith("press ") ? "press build [from: pool, into: blocks, take: 1]" : line,
    ),
  });

describe("試す図は読み手を待つ (#3337)", () => {
  it("interactive-waits-for-the-reader", () => {
    const { player } = mountTry(txBlock());
    expect(player.step, "置いた時の段").toBe(0);
    expect(player.playing, "置いた時から流れている").toBe(false);
    // 書き手が例として書いた 2 段目より後へは、読み手が押すまで進めない
    player.next();
    expect(player.step, "次の段へ送ると、書き手の例の段へ進んだ").toBe(0);
    player.goTo(99);
    expect(player.step, "最後の段へ移ると、書き手の例の段へ進んだ").toBe(0);
    player.play();
    expect(player.step, "流すと、書き手の例の段へ進んだ").toBe(0);
    expect(stepsOf(player), "押す前の原本の段の数").toBe(1);
  });
});

describe("段の説明とゲージの帯は図の枠のすぐ下に置く (#3437)", () => {
  it("interactive-caption-sits-under-frame", () => {
    const { host } = mountTry(parsedTry(smallTry()));
    const frame = host.querySelector(".dg-frame");
    const bar = host.querySelector(".dg-bar");
    const tools = host.querySelector(".dg-try");
    expect(frame && bar && tools, "図の枠か段の説明の帯か入力の帯が無い").toBeTruthy();
    expect(bar?.querySelector('[data-dragon="progress"]'), "ゲージが段の説明の帯の中に無い").toBeTruthy();
    expect(frame?.nextElementSibling, "図の枠の次が段の説明とゲージの帯でない").toBe(bar);
    expect(bar?.nextElementSibling, "段の説明とゲージの帯の次が入力の帯でない").toBe(tools);
  });
});

describe("入力の帯で送る (#3337)", () => {
  it("interactive-send-adds-chip-and-step", () => {
    const { host, player } = mountTry(parsedTry(smallTry()));
    send(host, ME);
    expect(stepsOf(player), "送った後の原本の段の数").toBe(2);
    expect(player.step, "送った後に今の段が足した段にならない").toBe(1);
    const state = lastState(tryLayout(sessionOf(player)));
    const pool = state.queues.pool ?? [];
    expect(pool, "送った後の待ち行列のチップの数").toHaveLength(4);
    const sent = pool.filter((id) => !(id in SMALL_VALUES));
    expect(sent, "送った後に待ち行列に増えたチップ").toHaveLength(1);
    expect(state.items[sent[0] ?? ""], "送ったチップの欄の値").toEqual(["me", "bob", "2", "6"]);
  });

  it("interactive-net-takes-the-shortest-path", () => {
    const { host, player } = mountTry(parsedTry(smallTry()));
    send(host, ME);
    const state = lastState(tryLayout(sessionOf(player)));
    expect(state.trips, "送った段で網を運ばれたチップの数").toHaveLength(1);
    expect(state.trips[0]?.route, "チップを運んだ網").toBe("net");
    expect(state.items[state.trips[0]?.item ?? ""]?.[0], "網を運ばれたチップの名前").toBe("me");
    expect(state.trips[0]?.path, "網を運ばれた道が、送り手から作る人までの最短の道でない").toEqual([
      ...SHORTEST,
    ]);
  });
});

describe("釦でブロックを作る (#3337)", () => {
  it("interactive-build-moves-top-n-by-field", () => {
    const { host, player } = mountTry(parsedTry(smallTry()));
    send(host, ME);
    press(host, "build");
    expect(stepsOf(player), "送って作った後の原本の段の数").toBe(3);
    const state = lastState(tryLayout(sessionOf(player)));
    const blocks = state.chains.blocks ?? [];
    expect(blocks, "作った後のブロックの数").toHaveLength(2);
    // 手数料の高い順に 3 件。o3 (9)、送ったチップ (6)、o4 (4) が移り、o2 (2) が残る
    const fees = (blocks[1]?.items ?? []).map((id) => state.items[id]?.[3]);
    expect(fees, "新しいブロックに移ったチップの手数料").toEqual(["9", "6", "4"]);
    expect(state.queues.pool, "作った後に待ち行列に残ったチップ").toEqual(["o2"]);
  });

  it("interactive-build-disabled-when-queue-empty", () => {
    const { host } = mountTry(parsedTry(smallTry()));
    expect(pressButton(host, "build")?.disabled, "待ち行列にチップがあるのに作る釦が押せない").toBe(
      false,
    );
    press(host, "build");
    // 3 件を取り出して待ち行列が空になる
    expect(pressButton(host, "build"), "作った後に作る釦が消えた").not.toBeNull();
    expect(pressButton(host, "build")?.disabled, "待ち行列が空なのに作る釦が押せる").toBe(true);
  });
});

describe("ブロックを hash でつなぐ (#3337)", () => {
  it("interactive-prev-matches-previous-hash", () => {
    const { host, player } = mountTry(parsedTry(oneByOne()));
    press(host, "build");
    press(host, "build");
    const blocks = blocksAfter(sessionOf(player));
    expect(
      blocks.map((b) => b.number),
      "作った後のブロックの番号",
    ).toEqual([1, 2, 3]);
    expect(blocks[0]?.prev, "最初のブロックの prev").toBe(GENESIS);
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i]?.prev, `ブロック ${i + 1} の prev がブロック ${i} の hash と違う`).toBe(
        blocks[i - 1]?.hash,
      );
      expect(blocks[i]?.link, `ブロック ${i + 1} とブロック ${i} のつながり`).toBe("ok");
    }
  });

  it("interactive-hash-is-sha256-of-contents", () => {
    const { host, player } = mountTry(parsedTry(smallTry()));
    send(host, ME);
    press(host, "build");
    const state = lastState(tryLayout(sessionOf(player)));
    const blocks = state.chains.blocks ?? [];
    expect(blocks.length, "作った後のブロックの数").toBe(2);
    const figure = figureOf(host);
    for (const block of blocks) {
      const rows = block.items.map((id) => state.items[id] ?? []);
      expect(block.hash, `ブロック ${block.number} の hash が中身の SHA-256 と違う`).toBe(
        blockHash(block.number, block.prev, rows),
      );
      // 図には hash の頭の 4 字を出す
      const drawn = figure?.querySelector(`[data-block="${block.number}"]`)?.textContent ?? "";
      expect(drawn, `図のブロック ${block.number} に hash の頭の 4 字が無い`).toContain(
        block.hash.slice(0, 4),
      );
    }
  });

  it("interactive-edit-breaks-next-link", () => {
    const { host, player } = mountTry(parsedTry(smallTry()));
    press(host, "build");
    const before = blocksAfter(sessionOf(player));
    expect(before[1]?.link, "書き換える前のブロック 2 のつながり").toBe("ok");
    edit(host, "o1", "amount", "30");
    const after = blocksAfter(sessionOf(player));
    expect(after[0]?.hash, "ブロック 1 の中身を書き換えても hash が変わらない").not.toBe(
      before[0]?.hash,
    );
    expect(after[1]?.prev, "ブロック 1 を書き換えると、ブロック 2 の prev が変わった").toBe(
      before[1]?.prev,
    );
    expect(after[1]?.link, "ブロック 1 を書き換えても、ブロック 2 とのつながりが切れない").toBe(
      "broken",
    );
    expect(
      figureOf(host)?.textContent ?? "",
      "書き換えた後の図に食い違いの印 (≠) が無い",
    ).toContain("≠");
  });

  it("interactive-restore-heals-link", () => {
    const { host, player } = mountTry(parsedTry(smallTry()));
    press(host, "build");
    const before = blocksAfter(sessionOf(player));
    edit(host, "o1", "amount", "30");
    edit(host, "o1", "amount", "3");
    const after = blocksAfter(sessionOf(player));
    expect(after[0]?.hash, "元の値に戻しても、ブロック 1 の hash が元に戻らない").toBe(
      before[0]?.hash,
    );
    expect(after[1]?.link, "元の値に戻しても、ブロック 2 とのつながりが戻らない").toBe("ok");
  });
});

describe("箱に収まる数 (#3337)", () => {
  it("interactive-queue-full-disables-send", () => {
    const diagram = parsedTry(smallTry());
    const most = tryLayout(diagram).parts.find((part) => part.id === "pool")?.most;
    expect(most, "待ち行列に縦に収まる数 (most) が無い").toBeDefined();
    expect(most ?? 0, "待ち行列に縦に収まる数が最初のチップの数以下").toBeGreaterThan(3);
    expect(most ?? 99, "待ち行列に縦に収まる数が 1 列の上限の 12 を超える").toBeLessThanOrEqual(12);
    const { host, player } = mountTry(diagram);
    for (let n = 3; n < (most ?? 0); n++) {
      expect(sendButton(host)?.disabled, `待ち行列が ${n} 枚の時に送る釦が押せない`).toBe(false);
      send(host, { sender: `m${n}`, to: "bob", amount: "1", fee: String(n) });
    }
    expect(
      lastState(tryLayout(sessionOf(player))).queues.pool,
      "送った後の待ち行列のチップの数",
    ).toHaveLength(most ?? 0);
    expect(sendButton(host)?.disabled, `待ち行列が ${most} 枚に達しても送る釦が押せる`).toBe(true);
    const reason = host.querySelector('[data-dragon="reason"]')?.textContent?.trim() ?? "";
    expect(reason, "送る釦が押せない理由が出ない").not.toBe("");
  });

  it("interactive-chain-shows-latest-three", () => {
    const { host, player } = mountTry(parsedTry(oneByOne()));
    press(host, "build");
    press(host, "build");
    press(host, "build");
    send(host, ME);
    press(host, "build");
    const blocks = blocksAfter(sessionOf(player));
    expect(
      blocks.map((b) => b.number),
      "作った後のブロックの番号",
    ).toEqual([1, 2, 3, 4, 5]);
    expect(
      blocks.map((b) => b.shown),
      "新しい方から 3 つのブロックだけを出さない",
    ).toEqual([false, false, true, true, true]);
    expect(
      figureOf(host)?.querySelector('[data-fold="blocks"]'),
      "古いブロックを畳んだ印 (data-fold) が図に無い",
    ).not.toBeNull();
  });
});

describe("動きと描き直し (#3337)", () => {
  it("interactive-reduced-motion-jumps-to-result", () => {
    reduceMotion(false);
    const moving = mountTry(parsedTry(smallTry()));
    send(moving.host, ME);
    expect(moving.player.playing, "動きを減らさない設定で送った段を流さない").toBe(true);
    expect(figureOf(moving.host)?.dataset.motion, "動きを減らさない設定で送った段の動き").toBe(
      "play",
    );
    releaseTry();

    reduceMotion(true);
    const still = mountTry(parsedTry(smallTry()));
    send(still.host, ME);
    expect(still.player.step, "動きを減らす設定で送った後の段").toBe(1);
    expect(still.player.playing, "動きを減らす設定で送った段を流した").toBe(false);
    expect(
      figureOf(still.host)?.dataset.motion,
      "動きを減らす設定で送った後に止め絵にならない",
    ).toBe("still");
    expect(
      lastState(tryLayout(sessionOf(still.player))).queues.pool,
      "動きを減らす設定で送った結果",
    ).toHaveLength(4);
  });

  it("interactive-remount-keeps-nothing", () => {
    const diagram = parsedTry(smallTry());
    const first = mountTry(diagram);
    send(first.host, ME);
    press(first.host, "build");
    expect(stepsOf(first.player), "押した後の原本の段の数").toBe(3);
    releaseTry();

    const again = mountTry(diagram);
    expect(stepsOf(again.player), "置き直した後に、前に足した段が残る").toBe(1);
    again.player.goTo(99);
    expect(again.player.step, "置き直した後に、前に足した段へ進める").toBe(0);
    expect(
      lastState(tryLayout(sessionOf(again.player))).queues.pool,
      "置き直した後の待ち行列",
    ).toEqual(["o3", "o4", "o2"]);
    const typed = [
      ...again.host.querySelectorAll<HTMLInputElement>('form[data-dragon="ask"] input'),
    ].map((input) => input.value);
    expect(
      typed.filter((value) => value !== ""),
      "置き直した後の入力の帯に前の値が残る",
    ).toEqual([]);
  });
});

// 入力の帯は欄を 1 行に並べて同じ基準の幅で縮めるので、長い候補を持つ選ぶ欄で選んだ値の字が切れていた (#3485)。
// 候補を持つ欄は一番長い候補の字の幅に左右の内側の余白と矢印の幅を足した値を欄の幅の下限 (`--dg-field-min`) に持ち、
// 帯の CSS がその値を欄の最小の幅にする。jsdom は配置を測れないので、並んだ幅は interactive-browser.test.ts が Chromium で測る
describe("入力の帯の欄の幅 (#3485)", () => {
  // 候補を持つ欄が一番長い候補の字の幅に余白と矢印を足した幅を下限に持ち、打つ欄は持たない
  it("try-ask-field-min-from-longest-choice", () => {
    const { host } = mountTry(parsedTry(wideAskTry()), 740);
    const A = LOOK.player.ask as typeof LOOK.player.ask & { arrow?: number };
    expect(A.arrow, "入力の帯の見た目 (LOOK.player.ask) が選ぶ欄の矢印の幅 (arrow) を持たない").toBeGreaterThan(0);
    const arrow = A.arrow ?? 0;
    const minOf = (field: string): string =>
      host.querySelector(`[data-field="${field}"]`)?.closest<HTMLElement>(".dg-field")?.style.getPropertyValue("--dg-field-min") ?? "";
    const longest: Record<string, string> = { 署名: "有効", 大きさ: "85134", 混み具合: "混雑", View: "不整合", 期限: WIDE_ASK_LONGEST };
    for (const [field, text] of Object.entries(longest)) {
      const floor = textWidth(text, TYPE.askInput) + 2 * A.inset + arrow;
      const min = Number.parseFloat(minOf(field));
      expect(min, `選ぶ欄 ${field} の幅の下限 (--dg-field-min) が無いか、一番長い候補「${text}」の字の幅に余白と矢印を足した ${floor} より狭い`).toBeGreaterThanOrEqual(floor);
    }
    const first = textWidth("間に合う", TYPE.askInput) + 2 * A.inset + arrow;
    expect(Number.parseFloat(minOf("期限")), "期限の欄の下限が最初の候補「間に合う」の幅で決まり、一番長い候補を見ていない").toBeGreaterThan(first);
    expect(minOf("トランザクション"), "候補を持たない打つ欄が幅の下限を持つ").toBe("");
    const css = [...document.querySelectorAll("style")].map((style) => style.textContent ?? "").join("");
    expect(css, "入力の帯の CSS が欄 (.dg-field) の最小の幅に下限 (--dg-field-min) を使わない").toMatch(/\.dg-field\{[^}]*min-width:var\(--dg-field-min/u);
  });

  // 選ぶ欄の幅の下限は、欄の名前の字の幅も下回らない。名前を「…」で切らない (#3492)
  it("try-ask-field-min-covers-label", () => {
    const { host } = mountTry(parsedTry(labeledAskTry()), 740);
    const boxes = [...host.querySelectorAll<HTMLElement>('form[data-dragon="ask"] .dg-field')];
    const selects = boxes.filter((box) => box.querySelector("select"));
    expect(selects, "選ぶ欄の数").toHaveLength(7);
    for (const box of selects) {
      const label = box.querySelector(".dg-fl")?.textContent ?? "";
      const min = Number.parseFloat(box.style.getPropertyValue("--dg-field-min"));
      const need = textWidth(label, TYPE.askLabel);
      expect(min, `選ぶ欄「${label}」の幅の下限 ${min} が、欄の名前の字の幅 ${need} より狭い`).toBeGreaterThanOrEqual(need);
    }
  });

  // 選ぶ欄の矢印は svg で描かない。図を置いた頁が svg に当てる幅や高さの規則で膨らまない (#3499)
  it("try-ask-caret-not-svg", () => {
    const { host } = mountTry(parsedTry(labeledAskTry()), 740);
    const form = host.querySelector<HTMLFormElement>('form[data-dragon="ask"]');
    expect(form, "入力の帯").not.toBeNull();
    expect(form?.querySelectorAll("svg").length, "入力の帯が svg の要素を持つ").toBe(0);
    const selects = [...(form?.querySelectorAll<HTMLElement>(".dg-field") ?? [])].filter((box) => box.querySelector("select"));
    expect(selects, "選ぶ欄の数").toHaveLength(7);
    for (const box of selects) expect(box.querySelectorAll(".dg-caret"), `選ぶ欄「${box.querySelector(".dg-fl")?.textContent ?? ""}」の矢印の数`).toHaveLength(1);
  });
});
