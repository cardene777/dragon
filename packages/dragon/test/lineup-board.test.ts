// @vitest-environment jsdom
/**
 * 列の図のボード (#3624)。
 *
 * 列の図の既定の見た目を、箱を淡い色の縦の帯にしたボードに作り直す。帯の見出しに箱の名前と今の段の札の数をまとめ、
 * 札は色の縁と番号を持つカードにして上から積み、空の席の枠を描かない。箱に `[limit: N]` を書いた帯は見出しに「札の数/N」と N の目盛りを出す。
 * 札が箱を書いた順で前の帯へ戻る段 (差し戻し) は、その段だけ帯の上を通る戻りの線と「差し戻し」の札を描き、札がその線を走り、
 * 戻った札に戻る印を付け、元の帯に点線の抜けた跡を残す。狭い枠では帯を図の幅にして上から積み、帯の中に札を 2 つずつ並べ、差し戻しは帯の左を上へ戻る。
 * 見た目の元は step 2 で本人が選んだ動く試作の案A (`.context/extend/lineup-look/kinds/_lineup.js` の drawA と `_narrow.js` の drawN2)。
 *
 * 置き場所は描く部品が返す値 (`layout`) で、見え方は描いた SVG の keyframes を jsdom で読み、各段の止め絵の時刻で確かめる。
 * ボードがまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type Json, type LineError, pointers } from "./diagram-support";
import {
  BOARD_CARDS,
  type BoardLayout,
  type BoardRendered,
  boardLineup,
  centersDuring,
  codeLines,
  DONE,
  DOING,
  fileText,
  inside,
  KANA,
  type Lang,
  LANGS,
  laneOf,
  lineEvent,
  overlaps,
  parsed,
  partsOf,
  type Point,
  REVIEW,
  render,
  repoText,
  ROOT,
  type Seat,
  seatsAt,
  seenOf,
  shapeOf,
  shownAt,
  type Source,
  stillOf,
  TODO,
} from "./lineup-board-support";
import { motionFrom } from "./motion-support";
import { draw, type Rect, type Rendered } from "./render-support";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む
const [, { checkText, problemLine }] = await Promise.all([import("../src/render/svg"), import("../src/check")]);

/** 受付 (順番の無い置き場) に控えを残す最小のボード。段 2 で 2 人が診察待ちへ移り、受付は書き換えない */
function traceLineup(): Json {
  return {
    version: 2,
    kind: "lineup",
    title: "受付の控え",
    blocks: {
      box: [
        { id: "受付", name: "受付", order: "none" },
        { id: "診察待ち", name: "診察待ち", color: "violet" },
      ],
      item: [{ id: "甲" }, { id: "乙" }],
    },
    steps: [
      { title: "受け付ける", body: "受付に控える。", events: [lineEvent("受付", ["甲", "乙"])] },
      { title: "待つ", body: "診察を待つ。", events: [lineEvent("診察待ち", ["甲", "乙"])] },
    ],
  };
}

/** ボードの置き場所。ボードで並べていなければ落とす */
const boardOf = (rendered: BoardRendered, where: string): BoardLayout => shapeOf(rendered, "board", where);

describe("ボードの帯 (#3624)", () => {
  it("lineup-board-lanes-are-bands", () => {
    for (const width of [undefined, 1200]) {
      const rendered = render(boardLineup(), "ja", width);
      const layout = boardOf(rendered, `幅 ${width ?? "なし"} のボード`);
      expect(layout.arrangement, `幅 ${width ?? "なし"} の並べ方`).toBe("row");
      // 帯は箱を書いた順に左から 10px 以上離して並び、上の端と高さが揃う
      expect(layout.lanes.map((l) => l.id), "帯の並び").toEqual([TODO, DOING, REVIEW, DONE]);
      layout.lanes.forEach((lane, k) => {
        const next = layout.lanes[k + 1];
        if (!next) return;
        expect(next.x, `${next.id} が ${lane.id} の右に 10px 離れて並ばない`).toBeGreaterThanOrEqual(lane.x + lane.w + 10);
        expect(next.y, `${next.id} と ${lane.id} の上の端が揃わない`).toBeCloseTo(lane.y, 6);
        expect(next.h, `${next.id} と ${lane.id} の高さが揃わない`).toBeCloseTo(lane.h, 6);
      });
      // 帯の見出しに箱の名前と今の段の札の数を出す
      const counts = layout.counts ?? [];
      BOARD_CARDS.forEach((byLane, s) => {
        for (const lane of layout.lanes) {
          expect(lane.title.text, `${lane.id} の見出しの名前`).toBe(lane.name);
          const count = counts.find((c) => c.lane === lane.id && c.step === s);
          expect(count, `段 ${s + 1} の ${lane.id} の札の数 (layout.counts)`).toBeDefined();
          if (!count) continue;
          const n = byLane[lane.id]?.length ?? -1;
          expect(count.text.text, `段 ${s + 1} の ${lane.id} の札の数の字`).toBe(lane.limit === undefined ? String(n) : `${n}/${lane.limit}`);
          expect(inside(count, lane), `段 ${s + 1} の ${lane.id} の札の数が帯の外に在る`).toBe(true);
          expect(count.y + count.h, `段 ${s + 1} の ${lane.id} の札の数が札を置く所より上に無い`).toBeLessThanOrEqual(lane.track.y);
        }
      });
      // 描いた図の札の数は、その段の止め絵で 1 つだけ見える
      const motion = motionFrom(rendered as unknown as Rendered);
      BOARD_CARDS.forEach((byLane, s) => {
        const t = stillOf(rendered, s);
        const shown = shownAt(motion, `[data-lineup-count="${DOING}"]`, t);
        expect(shown.map((el) => el.textContent), `段 ${s + 1} の止め絵の作業中の札の数`).toEqual([`${byLane[DOING]?.length}/3`]);
      });
    }
  });

  it("lineup-board-roles-sit-above-lanes", () => {
    const layout = boardOf(render(boardLineup()), "ボード");
    const roles = layout.roles ?? [];
    expect(roles.map((r) => r.id), "役の札の並び").toEqual(["開発者", "確認係"]);
    expect((roles[1]?.x ?? 0) > (roles[0]?.x ?? 0), "役の札が宣言した順に左から並ばない").toBe(true);
    const laneTop = Math.min(...layout.lanes.map((l) => l.y));
    for (const role of roles) expect(role.y + role.h + 10, `役の札 ${role.id} が帯より 10px 上に無い`).toBeLessThanOrEqual(laneTop);
    // どの段でも役の札と帯と見出しの字が 10px 以上離れる
    const texts: [string, Rect][] = layout.lanes.flatMap((l): [string, Rect][] => [[`${l.id} の名前`, l.title], ...(l.hint ? [[`${l.id} の順番なし`, l.hint] as [string, Rect]] : [])]);
    for (const role of roles) {
      for (const [name, r] of [...texts, ...layout.lanes.map((l): [string, Rect] => [l.id, l])]) {
        const gapY = Math.max(r.y - (role.y + role.h), role.y - (r.y + r.h));
        const gapX = Math.max(r.x - (role.x + role.w), role.x - (r.x + r.w));
        expect(Math.max(gapX, gapY), `役の札 ${role.id} と ${name} が 10px 離れない`).toBeGreaterThanOrEqual(10 - 1e-6);
      }
    }
  });

  it("lineup-board-cards-stack-with-numbers", () => {
    for (const lang of LANGS) {
      const rendered = render(boardLineup(), lang);
      const layout = boardOf(rendered, `${lang} のボード`);
      const motion = motionFrom(rendered as unknown as Rendered);
      BOARD_CARDS.forEach((byLane, s) => {
        for (const lane of layout.lanes) {
          const seats = seatsAt(layout, lane.id, s);
          expect(seats.map((c) => c.id), `段 ${s + 1} の ${lane.id} の札の並び`).toEqual(byLane[lane.id]);
          seats.forEach((seat, i) => {
            expect(seat.x, `段 ${s + 1} の ${lane.id} の ${seat.id} が上の札と同じ左端に無い`).toBeCloseTo(seats[0]?.x ?? Number.NaN, 6);
            const above = seats[i - 1];
            if (above) expect(seat.y, `段 ${s + 1} の ${lane.id} の ${seat.id} が上の札の下に無い`).toBeGreaterThanOrEqual(above.y + above.h);
            expect(inside(seat, lane), `段 ${s + 1} の ${lane.id} の ${seat.id} が帯の外に在る`).toBe(true);
            if (lane.pool) return;
            // 順番のある帯の札は、上から 1、2、3 と続く番号を持つ
            expect(seat.number?.text, `段 ${s + 1} の ${lane.id} の ${seat.id} の番号`).toBe(String(i + 1));
          });
        }
      });
      // 描いた札も番号の字を持つ
      const t = stillOf(rendered, 1);
      const numbers = [...motion.doc.querySelectorAll(`[data-lineup-on="${DOING}"]`)]
        .filter((el) => seenOf(motion, el, t) > 0.9)
        .map((el) => el.querySelector("[data-lineup-number]")?.textContent ?? "");
      expect(numbers.sort(), `${lang} の段 2 の作業中の描いた番号`).toEqual(["1", "2", "3"]);
    }
  });

  it("lineup-board-pool-cards-carry-no-numbers", () => {
    for (const lang of LANGS) {
      const rendered = render(boardLineup(), lang);
      const layout = boardOf(rendered, `${lang} のボード`);
      const done = laneOf(layout, DONE);
      expect(done.pool, "済みの帯が順番の無い置き場でない").toBe(true);
      expect(done.hint?.text, `${lang} の済みの見出しの順番なし`).toBe(lang === "ja" ? "順番なし" : "No order");
      for (const lane of layout.lanes.filter((l) => !l.pool)) expect(lane.hint, `順番のある ${lane.id} の帯が名前の下の字を持つ`).toBeUndefined();
      for (const seat of layout.chips.filter((c) => c.lane === DONE)) expect(seat.number, `済みの ${seat.id} が番号を持つ`).toBeUndefined();
      const motion = motionFrom(rendered as unknown as Rendered);
      expect(partsOf(motion, `[data-lineup-on="${DONE}"] [data-lineup-number]`).length, `${lang} の済みの描いた番号`).toBe(0);
    }
  });

  it("lineup-board-draws-no-empty-seats", () => {
    const rendered = render(boardLineup());
    const layout = boardOf(rendered, "ボード");
    for (const lane of layout.lanes) expect(lane.slots ?? [], `${lane.id} の空の席の枠 (layout.lanes[].slots)`).toEqual([]);
    const motion = motionFrom(rendered as unknown as Rendered);
    expect(partsOf(motion, "[data-lineup-slot]").length, "描いた空の席の枠").toBe(0);
    // どの段の止め絵でも、帯の中に見える札の枠の数はその段の札の数と同じ
    BOARD_CARDS.forEach((byLane, s) => {
      const t = stillOf(rendered, s);
      for (const lane of layout.lanes) {
        const frames = shownAt(motion, `[data-lineup-on="${lane.id}"]:not([data-lineup-trace]) [data-lineup-chip-frame]`, t);
        expect(frames.length, `段 ${s + 1} の ${lane.id} の見える札の枠の数`).toBe(byLane[lane.id]?.length ?? -1);
      }
    });
  });
});

describe("ボードの上限と値 (#3624)", () => {
  it("lineup-board-limit-shows-count-and-ticks", () => {
    const rendered = render(boardLineup());
    const layout = boardOf(rendered, "ボード");
    const doing = laneOf(layout, DOING);
    expect(doing.limit, "作業中の上限 (layout.lanes[].limit)").toBe(3);
    const ticks = (layout.ticks ?? []).filter((t) => t.lane === DOING).sort((a, b) => a.index - b.index);
    expect(ticks.length, "作業中の目盛りの数").toBe(3);
    ticks.forEach((tick, k) => {
      expect(inside(tick, doing), `作業中の ${k + 1} 番目の目盛りが帯の外に在る`).toBe(true);
      expect(tick.y + tick.h, `作業中の ${k + 1} 番目の目盛りが札を置く所より上に無い`).toBeLessThanOrEqual(doing.track.y);
      const prev = ticks[k - 1];
      if (prev) {
        expect(tick.x, `作業中の ${k + 1} 番目の目盛りが左の目盛りの右に無い`).toBeGreaterThan(prev.x + prev.w);
        expect(tick.y, `作業中の ${k + 1} 番目の目盛りの高さが揃わない`).toBeCloseTo(prev.y, 6);
      }
    });
    // 目盛りは今の段の札の数だけ塗る
    const motion = motionFrom(rendered as unknown as Rendered);
    expect(partsOf(motion, `[data-lineup-tick="${DOING}"]`).length, "作業中の描いた目盛りの下地").toBe(3);
    BOARD_CARDS.forEach((byLane, s) => {
      const filled = shownAt(motion, `[data-lineup-tick-on="${DOING}"]`, stillOf(rendered, s));
      expect(filled.length, `段 ${s + 1} の止め絵で塗った作業中の目盛り`).toBe(byLane[DOING]?.length ?? -1);
    });
  });

  it("lineup-board-no-limit-draws-no-ticks", () => {
    const rendered = render(boardLineup());
    const layout = boardOf(rendered, "ボード");
    for (const lane of layout.lanes.filter((l) => l.id !== DOING)) {
      expect(lane.limit, `${lane.id} が上限を持つ`).toBeUndefined();
      expect((layout.ticks ?? []).filter((t) => t.lane === lane.id), `${lane.id} の目盛り`).toEqual([]);
      for (const count of (layout.counts ?? []).filter((c) => c.lane === lane.id)) expect(count.text.text, `${lane.id} の札の数の字`).toMatch(/^\d+$/u);
    }
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const lane of [TODO, REVIEW, DONE]) expect(partsOf(motion, `[data-lineup-tick="${lane}"], [data-lineup-tick-on="${lane}"]`).length, `${lane} の描いた目盛り`).toBe(0);
  });

  it("lineup-board-note-shows-under-the-name", () => {
    const rendered = render(boardLineup());
    const layout = boardOf(rendered, "ボード");
    const review = laneOf(layout, REVIEW);
    const values = (layout.values ?? []).filter((v) => v.lane === REVIEW).sort((a, b) => a.step - b.step);
    // 箱の note は段 1 から、段の中の note は書いた段から出し、値が変わった段だけ変わった印を持つ
    expect(values.map((v) => [v.step, v.text.text, v.changed]), "確認待ちの値の札 (layout.values)").toEqual([
      [0, "1日", false],
      [1, "1日", false],
      [2, "2日", true],
      [3, "2日", false],
      [4, "2日", false],
      [5, "2日", false],
    ]);
    for (const v of values) {
      expect(inside(v, review), `段 ${v.step + 1} の値の札が帯の外に在る`).toBe(true);
      expect(v.y, `段 ${v.step + 1} の値の札が名前の下に無い`).toBeGreaterThanOrEqual(review.title.y + review.title.h);
      expect(v.y + v.h, `段 ${v.step + 1} の値の札が札を置く所より上に無い`).toBeLessThanOrEqual(review.track.y);
      expect(inside(v.text, v), `段 ${v.step + 1} の値の字が値の札の外に在る`).toBe(true);
    }
    expect((layout.values ?? []).filter((v) => v.lane !== REVIEW), "note を持たない帯の値の札").toEqual([]);
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const s of [1, 2, 3]) {
      const shown = shownAt(motion, `[data-lineup-value="${REVIEW}"]`, stillOf(rendered, s));
      expect(shown.map((el) => el.textContent ?? ""), `段 ${s + 1} の止め絵の確認待ちの値`).toEqual([s === 1 ? "1日" : "2日"]);
      expect(shown[0]?.hasAttribute("data-lineup-value-new"), `段 ${s + 1} の確認待ちの値の変わった印`).toBe(s === 2);
    }
  });

  it("lineup-board-ticks-point-to-the-next-lane", () => {
    const layout = boardOf(render(boardLineup()), "ボード");
    const arrows = layout.arrows ?? [];
    expect(arrows.map((a) => [a.from, a.to]), "帯の間の印 (layout.arrows)").toEqual([
      [TODO, DOING],
      [DOING, REVIEW],
      [REVIEW, DONE],
    ]);
    for (const arrow of arrows) {
      const from = laneOf(layout, arrow.from);
      const to = laneOf(layout, arrow.to);
      const xs = arrow.points.map((p) => p[0]);
      const ys = arrow.points.map((p) => p[1]);
      expect((arrow.points.at(-1)?.[0] ?? 0) > (arrow.points[0]?.[0] ?? 0), `${arrow.from} の後の印が右を向かない`).toBe(true);
      expect(Math.min(...xs), `${arrow.from} の後の印が帯の間に無い`).toBeGreaterThanOrEqual(from.x + from.w - 0.5);
      expect(Math.max(...xs), `${arrow.from} の後の印が帯の間に無い`).toBeLessThanOrEqual(to.x + 0.5);
      for (const y of ys) {
        expect(y, `${arrow.from} の後の印が見出しの高さに無い`).toBeGreaterThanOrEqual(from.y);
        expect(y, `${arrow.from} の後の印が見出しの高さに無い`).toBeLessThanOrEqual(from.track.y);
      }
    }
  });
});

describe("ボードの札の見た目 (#3624)", () => {
  it("lineup-board-cards-take-colors", () => {
    const rendered = render(boardLineup());
    const layout = boardOf(rendered, "ボード");
    const motion = motionFrom(rendered as unknown as Rendered);
    const card = (id: string, lane: string): Element | null => motion.doc.querySelector(`[data-lineup-chip="${id}"][data-lineup-on="${lane}"]`);
    // 色を付けた札は自分の色で塗って光らせ、色の無い札は居る帯の色の縁で描く
    expect(card("不具合", TODO)?.getAttribute("style") ?? "", "不具合の札の色").toContain("--c:var(--c-rose)");
    expect(card("不具合", TODO)?.hasAttribute("data-lineup-glow"), "不具合の札が光らない").toBe(true);
    expect(card("決済", DOING)?.getAttribute("style") ?? "", "作業中の色の無い札の色").toContain("--c:var(--c-violet)");
    expect(card("決済", DOING)?.hasAttribute("data-lineup-glow"), "作業中の色の無い札が光る").toBe(false);
    expect(card("検索", REVIEW)?.getAttribute("style") ?? "", "確認待ちの色の無い札の色").toContain("--c:var(--c-amber)");
    // 段で帯を移った札はその段だけ太い縁を見せ、次の段では消す
    const moved = shownAt(motion, `[data-lineup-chip="検索"][data-lineup-on="${REVIEW}"] [data-lineup-moved]`, stillOf(rendered, 2));
    expect(moved.length, "段 3 に確認待ちへ移った検索の太い縁").toBe(1);
    expect(shownAt(motion, `[data-lineup-chip="画像"][data-lineup-on="${TODO}"] [data-lineup-moved]`, stillOf(rendered, 1)).length, "移っていない画像の太い縁").toBe(0);
    expect(layout.chips.some((c) => c.id === "検索" && c.lane === REVIEW), "確認待ちに検索の席が無い").toBe(true);
  });

  it("lineup-board-marks-added-and-gone", () => {
    for (const lang of LANGS) {
      const rendered = render(boardLineup(), lang);
      const layout = boardOf(rendered, `${lang} のボード`);
      const motion = motionFrom(rendered as unknown as Rendered);
      // 前の段に居なかった色付きの札は、現れた段だけ「足した」の札を付ける
      const added = layout.chips.find((c) => c.id === "不具合" && c.lane === TODO && c.step === 4);
      expect(added?.tag, `${lang} の段 5 の不具合の印`).toBe("added");
      const tag = `[data-lineup-chip="不具合"][data-lineup-on="${TODO}"] [data-lineup-tag="added"]`;
      expect(shownAt(motion, tag, stillOf(rendered, 4)).map((el) => el.textContent), `${lang} の段 5 の足した札`).toEqual([lang === "ja" ? "足した" : "Added"]);
      expect(shownAt(motion, tag, stillOf(rendered, 5)).length, `${lang} の段 6 に足した札が残る`).toBe(0);
      // 色の無い札が初めて現れても印を付けない
      expect(layout.chips.filter((c) => c.step === 0).every((c) => c.tag === undefined), `${lang} の段 1 の札が印を持つ`).toBe(true);
      // どの帯からも外れた札は、外れた段だけ帯の札の後の席に点線の跡と「外れた」の札を残す。元の席は詰めた札が使う
      const gone = (layout.ghosts ?? []).filter((g) => g.kind === "gone");
      expect(gone.map((g) => [g.id, g.lane, g.step]), `${lang} の外れた札の跡 (layout.ghosts)`).toEqual([["決済", DOING, 5]]);
      const live = seatsAt(layout, DOING, 5);
      const below = live.at(-1);
      expect(gone[0]?.x, `${lang} の外れた跡が作業中の札と同じ左端に無い`).toBeCloseTo(below?.x ?? Number.NaN, 6);
      expect(gone[0]?.y ?? 0, `${lang} の外れた跡が段 6 の作業中の札の下に無い`).toBeGreaterThanOrEqual((below?.y ?? 0) + (below?.h ?? 0));
      for (const seat of live) expect(overlaps(seat, gone[0] as Rect), `${lang} の外れた跡が ${seat.id} に重なる`).toBe(false);
      const ghost = `[data-lineup-ghost="決済"][data-lineup-ghost-kind="gone"]`;
      expect(shownAt(motion, ghost, stillOf(rendered, 5)).map((el) => (el.textContent ?? "").includes(lang === "ja" ? "外れた" : "Gone")), `${lang} の段 6 の外れた跡`).toEqual([true]);
      expect(shownAt(motion, ghost, stillOf(rendered, 4)).length, `${lang} の段 5 に外れた跡が見える`).toBe(0);
      expect(partsOf(motion, `${ghost}[data-lineup-on]`).length, `${lang} の外れた跡が札の印 (data-lineup-on) を持つ`).toBe(0);
    }
  });

  it("lineup-board-keeps-a-trace-row", () => {
    const rendered = render(traceLineup());
    const layout = boardOf(rendered, "受付の図");
    const motion = motionFrom(rendered as unknown as Rendered);
    // 段 2 で診察待ちへ移った 2 人は、書き換えていない受付に控えの行として残る
    const traces = layout.chips.filter((c) => c.lane === "受付" && c.trace);
    expect(traces.map((c) => [c.id, c.step]), "受付の控え (layout.chips の trace)").toEqual([
      ["甲", 1],
      ["乙", 1],
    ]);
    const rows = shownAt(motion, '[data-lineup-on="受付"][data-lineup-trace]', stillOf(rendered, 1));
    expect(rows.map((el) => el.getAttribute("data-lineup-chip")), "段 2 の受付の控えの行").toEqual(["甲", "乙"]);
    for (const row of rows) {
      expect(row.querySelector("[data-lineup-chip-frame]"), `控えの行 ${row.getAttribute("data-lineup-chip")} が札の枠を持つ`).toBeNull();
      expect(row.querySelector("[data-lineup-trace-mark]"), `控えの行 ${row.getAttribute("data-lineup-chip")} が印を持たない`).not.toBeNull();
      expect(row.textContent, "控えの行の名前").toContain(row.getAttribute("data-lineup-chip") ?? "?");
    }
    // 段 1 の受付は控えでなく札で描く
    expect(shownAt(motion, '[data-lineup-on="受付"][data-lineup-trace]', stillOf(rendered, 0)).length, "段 1 の受付の控え").toBe(0);
    expect(shownAt(motion, '[data-lineup-on="受付"]:not([data-lineup-trace]) [data-lineup-chip-frame]', stillOf(rendered, 0)).length, "段 1 の受付の札").toBe(2);
  });
});

describe("ボードの差し戻し (#3624)", () => {
  it("lineup-board-send-back-draws-a-return-line", () => {
    for (const lang of LANGS) {
      const rendered = render(boardLineup(), lang);
      const layout = boardOf(rendered, `${lang} のボード`);
      const backs = layout.backs ?? [];
      expect(backs.map((b) => [b.id, b.from, b.to, b.step]), `${lang} の差し戻し (layout.backs)`).toEqual([["通知", REVIEW, DOING, 3]]);
      const back = backs[0];
      if (!back) continue;
      const from = laneOf(layout, REVIEW);
      const to = laneOf(layout, DOING);
      const [first, ...rest] = back.points;
      const end = back.points.at(-1) as Point;
      const top = Math.min(...back.points.map((p) => p[1]));
      // 元の帯の上の縁から上がり、帯の上を横に戻り、戻る帯の上の縁へ下りる
      expect(first?.[0] ?? 0, `${lang} の戻りの線が確認待ちの帯から出ない`).toBeGreaterThan(from.x);
      expect(first?.[0] ?? 0, `${lang} の戻りの線が確認待ちの帯から出ない`).toBeLessThan(from.x + from.w);
      expect(Math.abs((first?.[1] ?? 0) - from.y), `${lang} の戻りの線が確認待ちの上の縁から出ない`).toBeLessThan(4);
      expect(top, `${lang} の戻りの線が帯の上を通らない`).toBeLessThan(Math.min(from.y, to.y) - 10);
      expect(end[0], `${lang} の戻りの線が作業中の帯へ下りない`).toBeGreaterThan(to.x);
      expect(end[0], `${lang} の戻りの線が作業中の帯へ下りない`).toBeLessThan(to.x + to.w);
      expect(Math.abs(end[1] - to.y), `${lang} の戻りの線が作業中の上の縁で止まらない`).toBeLessThan(6);
      expect(rest.length, `${lang} の戻りの線の折れ目`).toBeGreaterThanOrEqual(3);
      // 線の上に「差し戻し」の札を置き、札は帯と見出しの字に掛からない
      expect(back.label.text.text, `${lang} の差し戻しの札の字`).toBe(lang === "ja" ? "差し戻し" : "Sent back");
      expect(Math.abs(back.label.y + back.label.h / 2 - top), `${lang} の差し戻しの札が線の上に無い`).toBeLessThan(1);
      for (const lane of layout.lanes) expect(overlaps(back.label, lane), `${lang} の差し戻しの札が ${lane.id} の帯に掛かる`).toBe(false);
      for (const role of layout.roles ?? []) expect(overlaps(back.label, role), `${lang} の差し戻しの札が役の札 ${role.id} に掛かる`).toBe(false);
      // 描いた線と札はその段だけ見える
      const motion = motionFrom(rendered as unknown as Rendered);
      const selector = '[data-lineup-back="通知"]';
      expect(shownAt(motion, selector, stillOf(rendered, 3)).length, `${lang} の段 4 の差し戻し`).toBe(1);
      for (const s of [2, 4]) expect(shownAt(motion, selector, stillOf(rendered, s), 0.1).length, `${lang} の段 ${s + 1} に差し戻しが見える`).toBe(0);
      expect(motion.doc.querySelector(`${selector} [data-lineup-back-label]`)?.textContent, `${lang} の描いた差し戻しの札`).toBe(lang === "ja" ? "差し戻し" : "Sent back");
    }
  });

  it("lineup-board-sent-back-card-runs-the-line", () => {
    const rendered = render(boardLineup());
    const layout = boardOf(rendered, "ボード");
    const back = (layout.backs ?? [])[0];
    expect(back, "差し戻し (layout.backs)").toBeDefined();
    const seat = layout.chips.find((c) => c.id === "通知" && c.lane === DOING && c.step === 3);
    expect(seat?.tag, "段 4 に作業中へ戻った通知の印").toBe("back");
    const before = layout.chips.find((c) => c.id === "通知" && c.lane === REVIEW && c.step === 2);
    expect(before, "段 3 の確認待ちの通知の席").toBeDefined();
    // 札が走る道は元の席から出て、戻りの線の横の区間を通り、戻る帯の席に着く
    const path = seat?.path ?? [];
    expect(path.length, "通知が走る道の点の数").toBeGreaterThanOrEqual(4);
    const top = Math.min(...(back?.points ?? []).map((p) => p[1]));
    expect(Math.abs(Math.min(...path.map((p) => p[1])) - top), "通知が戻りの線の横の区間を通らない").toBeLessThan(1);
    if (before && seat) {
      expect(path[0], "通知が元の席から走り出さない").toEqual([before.x + before.w / 2, before.y + before.h / 2]);
      expect(path.at(-1), "通知が戻る席に着かない").toEqual([seat.x + seat.w / 2, seat.y + seat.h / 2]);
    }
    // 描いた札は差し戻しの出来事の間に帯の上を通る
    const motion = motionFrom(rendered as unknown as Rendered);
    const laneTop = Math.min(...layout.lanes.map((l) => l.y));
    const highest = Math.min(...centersDuring(rendered, motion, "通知", DOING, 3).map((p) => p[1]));
    expect(highest, "通知が差し戻しの間に帯の上を通らない").toBeLessThan(laneTop);
    // 戻る印はその段だけ見え、元の席に点線の抜けた跡が残る
    const mark = `[data-lineup-chip="通知"][data-lineup-on="${DOING}"] [data-lineup-tag="back"]`;
    expect(shownAt(motion, mark, stillOf(rendered, 3)).length, "段 4 の通知の戻る印").toBe(1);
    expect(shownAt(motion, mark, stillOf(rendered, 4)).length, "段 5 に通知の戻る印が残る").toBe(0);
    // 抜けた跡は、その段の確認待ちの札の後の席 (段 4 の確認待ちは空なので一番上の席) に置く
    const from = (layout.ghosts ?? []).filter((g) => g.kind === "from");
    expect(from.map((g) => [g.id, g.lane, g.step]), "抜けた跡 (layout.ghosts)").toEqual([["通知", REVIEW, 3]]);
    const first = layout.chips.find((c) => c.id === "検索" && c.lane === REVIEW && c.step === 2);
    expect([from[0]?.x, from[0]?.y], "抜けた跡が確認待ちの一番上の席に無い").toEqual([first?.x, first?.y]);
    expect(shownAt(motion, '[data-lineup-ghost="通知"][data-lineup-ghost-kind="from"]', stillOf(rendered, 3)).length, "段 4 の抜けた跡").toBe(1);
  });

  it("lineup-board-forward-moves-draw-no-return-line", () => {
    const rendered = render(boardLineup());
    const layout = boardOf(rendered, "ボード");
    // 後ろの帯へ進む段 (段 2、段 3、段 5) と、作業中の並びだけが詰まる段 6 は差し戻しにならない
    expect((layout.backs ?? []).map((b) => b.step), "差し戻しの段").toEqual([3]);
    for (const seat of layout.chips.filter((c) => c.step !== 3)) expect(seat.tag === "back", `段 ${seat.step + 1} の ${seat.lane} の ${seat.id} が戻る印を持つ`).toBe(false);
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const s of [1, 2, 4, 5]) {
      expect(shownAt(motion, "[data-lineup-back]", stillOf(rendered, s), 0.1).length, `段 ${s + 1} の差し戻しの線`).toBe(0);
      expect(shownAt(motion, '[data-lineup-tag="back"]', stillOf(rendered, s), 0.1).length, `段 ${s + 1} の戻る印`).toBe(0);
    }
    // 差し戻しを持たない受付の図は、線も跡も描かない
    const plain = boardOf(render(traceLineup()), "受付の図");
    expect(plain.backs ?? [], "受付の図の差し戻し").toEqual([]);
    expect((plain.ghosts ?? []).filter((g) => g.kind === "from"), "受付の図の抜けた跡").toEqual([]);
  });
});

describe("狭い枠のボード (#3624)", () => {
  /** 狭い枠で確かめる見本。入札の図とかんばんの図の日本語と英語と、かんばんの形の最小のボード */
  const cases = (): { where: string; source: Json; lang: Lang }[] => {
    const out: { where: string; source: Json; lang: Lang }[] = [{ where: "最小のボード", source: boardLineup(), lang: "ja" }];
    for (const lang of LANGS) {
      const suffix = lang === "en" ? ".en" : "";
      const auction = fileText(`auction${suffix}.json`);
      expect(auction, `auction${suffix}.json が無い`).toBeDefined();
      if (auction) out.push({ where: `auction${suffix}.json`, source: JSON.parse(auction) as Json, lang });
      const kanban = fileText(`kanban${suffix}.dragon`);
      expect(kanban, `kanban${suffix}.dragon が無い`).toBeDefined();
      if (kanban) out.push({ where: `kanban${suffix}.dragon`, source: parsed(kanban, lang, `kanban${suffix}.dragon`), lang });
    }
    return out;
  };

  it("lineup-board-narrow-stacks-lanes", () => {
    for (const { where, source, lang } of cases()) {
      for (const width of [390, 324]) {
        const rendered = render(source, lang, width);
        const layout = boardOf(rendered, `${where} (幅 ${width})`);
        expect(layout.arrangement, `${where} (幅 ${width}) の並べ方`).toBe("stack");
        const boxes = ((source as unknown as Source).blocks.box ?? []).map((b) => b.id);
        expect(layout.lanes.map((l) => l.id), `${where} (幅 ${width}) の帯の並び`).toEqual(boxes);
        const left = Math.min(...layout.lanes.map((l) => l.x));
        layout.lanes.forEach((lane, k) => {
          // 帯は図の幅の帯になり、左右の端が揃い、書いた順に上から 10px 以上離して積む
          expect(lane.x, `${where} (幅 ${width}) の ${lane.id} の左の端が揃わない`).toBeCloseTo(layout.lanes[0]?.x ?? Number.NaN, 6);
          expect(lane.w, `${where} (幅 ${width}) の ${lane.id} の幅が揃わない`).toBeCloseTo(layout.lanes[0]?.w ?? Number.NaN, 6);
          expect(lane.x + lane.w, `${where} (幅 ${width}) の ${lane.id} が図からはみ出す`).toBeLessThanOrEqual(layout.width);
          expect(lane.w, `${where} (幅 ${width}) の ${lane.id} が図の幅の帯でない`).toBeGreaterThan(layout.width - left * 2 - 60);
          const above = layout.lanes[k - 1];
          if (above) expect(lane.y, `${where} (幅 ${width}) の ${lane.id} が上の帯の 10px 下に無い`).toBeGreaterThanOrEqual(above.y + above.h + 10);
        });
        // 帯の中の札は 2 つずつ並ぶ
        for (const lane of layout.lanes) {
          const bySteps = new Map<number, Seat[]>();
          for (const seat of layout.chips.filter((c) => c.lane === lane.id && !c.trace)) bySteps.set(seat.step, [...(bySteps.get(seat.step) ?? []), seat]);
          for (const [s, seats] of bySteps) {
            if (seats.length < 2) continue;
            const columns = new Set(seats.map((c) => Math.round(c.x))).size;
            expect(columns, `${where} (幅 ${width}) の段 ${s + 1} の ${lane.id} の札の列の数`).toBe(2);
            for (const seat of seats) expect(inside(seat, lane), `${where} (幅 ${width}) の ${lane.id} の ${seat.id} が帯の外に在る`).toBe(true);
          }
        }
        // 隣り合う帯の間に下を向く印を出す
        const arrows = layout.arrows ?? [];
        expect(arrows.length, `${where} (幅 ${width}) の帯の間の印の数`).toBe(layout.lanes.length - 1);
        for (const arrow of arrows) expect((arrow.points.at(-1)?.[1] ?? 0) > (arrow.points[0]?.[1] ?? 0), `${where} (幅 ${width}) の ${arrow.from} の後の印が下を向かない`).toBe(true);
        // 全体を出す見せ方で、枠に収めた字が 10.5px 以上ある
        const view = draw("chooseView")(rendered as unknown as Rendered, width);
        expect(view.mode, `${where} (幅 ${width}) の見せ方`).toBe("fixed");
        expect(view.textPx, `${where} (幅 ${width}) の枠に収めた字の大きさ`).toBeGreaterThanOrEqual(10.5);
      }
    }
  });

  it("lineup-board-narrow-send-back-runs-left", () => {
    for (const width of [390, 324]) {
      const layout = boardOf(render(boardLineup(), "ja", width), `幅 ${width} のボード`);
      const back = (layout.backs ?? [])[0];
      expect(back, `幅 ${width} の差し戻し (layout.backs)`).toBeDefined();
      if (!back) continue;
      const laneLeft = Math.min(...layout.lanes.map((l) => l.x));
      const rail = Math.min(...back.points.map((p) => p[0]));
      // 戻りの線は帯の左を上へ戻る
      expect(rail, `幅 ${width} の戻りの線が帯の左を通らない`).toBeLessThan(laneLeft);
      expect((back.points.at(-1)?.[1] ?? 0) < (back.points[0]?.[1] ?? 0), `幅 ${width} の戻りの線が上へ戻らない`).toBe(true);
      expect(back.label.x + back.label.w, `幅 ${width} の差し戻しの印が帯に掛かる`).toBeLessThanOrEqual(laneLeft);
      // 線の縦の区間は、どの段の札とも帯の字とも重ならない
      const ys = back.points.map((p) => p[1]);
      const segment = { x: rail - 1, y: Math.min(...ys), w: 2, h: Math.max(...ys) - Math.min(...ys) };
      for (const seat of layout.chips) expect(overlaps(segment, seat), `幅 ${width} の戻りの線が ${seat.lane} の ${seat.id} に重なる`).toBe(false);
      for (const lane of layout.lanes) {
        expect(overlaps(segment, lane.title), `幅 ${width} の戻りの線が ${lane.id} の名前に重なる`).toBe(false);
        for (const count of (layout.counts ?? []).filter((c) => c.lane === lane.id)) expect(overlaps(segment, count), `幅 ${width} の戻りの線が ${lane.id} の札の数に重なる`).toBe(false);
      }
    }
  });
});

describe("列の図の上限の記法 (#3624)", () => {
  const notation = (limit: string): string =>
    ["lineup 上限", `box 作業中 [color: violet, ${limit}]`, "box 済み", "item 検索, 通知", "step 取る", "  say 2件を取る。", "  line 作業中: 検索, 通知"].join("\n");

  it("lineup-limit-reads-and-roundtrips", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const validate = api("validateDiagram");
    for (const limit of [1, 3, 12]) {
      const text = notation(`limit: ${limit}`).replace("line 作業中: 検索, 通知", limit === 1 ? "line 作業中: 検索" : "line 作業中: 検索, 通知");
      const first = parse(text, { lang: "ja" });
      expect(first.ok, `limit: ${limit} が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
      if (!first.ok) continue;
      const box = ((first.diagram as unknown as Source).blocks.box ?? []).find((b) => b.id === "作業中");
      expect(box?.limit, `limit: ${limit} の原本の上限`).toBe(limit);
      const checked = validate(first.diagram);
      expect(checked.ok, `limit: ${limit} の原本が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
      const printed = print(first.diagram);
      expect(codeLines(printed), `limit: ${limit} を書き戻した記法が書いた記法と違う`).toEqual(codeLines(text));
      const second = parse(printed, { lang: "ja" });
      expect(second.ok ? second.diagram : undefined, `limit: ${limit} を往復した JSON が最初と違う`).toEqual(first.diagram);
    }
  });

  it("lineup-limit-rejects-bad-places", () => {
    const parse = api("parseNotation");
    const validate = api("validateDiagram");
    const lineupLines = (attr: string, shape = ""): string[] => [`lineup Limits${shape}`, `box Doing [${attr}]`, "box Done", "item a", "step One", "  say Takes one.", "  line Doing: a"];
    // 記法の行と、誤りの行 (0 から数える) と、その行の中の誤りを指す語
    const cases: [string, string[], number, string][] = [
      ["0", lineupLines("limit: 0"), 1, "limit"],
      ["13", lineupLines("limit: 13"), 1, "limit"],
      ["小数", lineupLines("limit: 2.5"), 1, "limit"],
      ["字", lineupLines("limit: many"), 1, "limit"],
      ["層の見た目の箱", lineupLines("limit: 2", " [shape: layers]"), 1, "limit"],
      ["時系列図の箱", ["sequence Limits", "box a [limit: 2]", "box b", "step One", "  say Sends.", "  a -> b: Send"], 1, "limit"],
    ];
    for (const [name, lines, row, token] of cases) {
      for (const lang of LANGS) {
        const read = parse(lines.join("\n"), { lang });
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first?.line, `${name} の誤りの行 (${lang}): ${first?.message ?? "誤りにならない"}`).toBe(row + 1);
        expect(first?.column, `${name} の誤りの列 (${lang}): ${first?.message ?? "誤りにならない"}`).toBe((lines[row] ?? "").indexOf(token) + 1);
        expect(KANA.test(first?.message ?? ""), `${name} の誤りの文の言葉 (${lang}): ${first?.message}`).toBe(lang === "ja");
      }
    }
    // 原本の JSON でも、上限の値と置き場所の誤りを JSON Pointer で示す
    const base = parsed(lineupLines("limit: 2").join("\n"), "ja", "上限の図") as unknown as { blocks: { box: { limit?: unknown }[] }; lineup?: unknown };
    for (const bad of [0, 13, 2.5, "2"]) {
      const diagram = JSON.parse(JSON.stringify(base)) as typeof base;
      (diagram.blocks.box[0] as { limit?: unknown }).limit = bad;
      expect(pointers(validate(diagram as unknown as Json)), `上限 ${JSON.stringify(bad)} の誤りの場所`).toContain("/blocks/box/0/limit");
    }
    const layers = JSON.parse(JSON.stringify(base)) as typeof base;
    layers.lineup = { shape: "layers" };
    expect(pointers(validate(layers as unknown as Json)), "層の見た目の箱の上限の誤りの場所").toContain("/blocks/box/0/limit");
    const sequence = parsed(["sequence Limits", "box a", "box b", "step One", "  say Sends.", "  a -> b: Send"].join("\n"), "en", "時系列図") as unknown as { blocks: { box: { limit?: unknown }[] } };
    (sequence.blocks.box[0] as { limit?: unknown }).limit = 2;
    expect(pointers(validate(sequence as unknown as Json)), "時系列図の箱の上限の誤りの場所").toContain("/blocks/box/0/limit");
    // 英語の誤りの文は仮名と漢字を含まない
    const en = validate(sequence, { lang: "en" });
    expect(en.ok, "英語で検査した時系列図の箱の上限が通る").toBe(false);
    if (!en.ok) for (const e of en.errors) expect(KANA.test(e.message), `英語の誤りの文 ${e.message}`).toBe(false);
  });

  it("lineup-limit-rejects-overfull-lines", () => {
    const parse = api("parseNotation");
    const lines = ["lineup Limits", "box Doing [limit: 2]", "item a, b, c", "step One", "  say Takes two.", "  line Doing: a, b", "step Two", "  say Takes three.", "  line Doing: a, b, c"];
    for (const lang of LANGS) {
      const read = parse(lines.join("\n"), { lang });
      const first: LineError | undefined = read.ok ? undefined : read.errors[0];
      expect(first?.line, `上限を超える line の誤りの行 (${lang}): ${first?.message ?? "誤りにならない"}`).toBe(9);
      expect(first?.column, `上限を超える line の誤りの列 (${lang})`).toBeGreaterThan(0);
      expect(KANA.test(first?.message ?? ""), `上限を超える line の誤りの文の言葉 (${lang}): ${first?.message}`).toBe(lang === "ja");
    }
    // 上限ちょうどの line は読む
    const ok = parse(lines.slice(0, 6).join("\n"));
    expect(ok.ok, `上限ちょうどの line が読めない: ${ok.ok ? "" : JSON.stringify(ok.errors)}`).toBe(true);
  });
});

describe("ボードの見本と書き方 (#3624)", () => {
  it("lineup-board-kanban-uses-limit-and-send-back", () => {
    for (const lang of LANGS) {
      const file = `kanban${lang === "en" ? ".en" : ""}.dragon`;
      const text = fileText(file);
      expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
      if (text === undefined) continue;
      expect(/^box .+\[[^\]]*limit: 3[^\]]*\]$/mu.test(text), `${file} に [limit: 3] の箱が無い`).toBe(true);
      expect(/^\s*note .+: \d+\/\d+\s*$/mu.test(text), `${file} に札の数を書き直す note の行が残る`).toBe(false);
      const source = parsed(text, lang, file);
      const layout = boardOf(render(source, lang), file);
      expect((layout.backs ?? []).length, `${file} の差し戻しの段の数`).toBeGreaterThan(0);
      const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
      expect(problems, `${file} の崩れの知らせ`).toEqual([]);
    }
  });

  it("lineup-board-docs-describe-limit-and-stations", () => {
    const extract = api("extractDiagrams");
    const parse = api("parseNotation");
    const fences = (text: string): Source[] =>
      extract(text).flatMap((fence) => {
        const read = parse(fence.source);
        return read.ok ? [read.diagram as unknown as Source] : [];
      });
    const back = { ja: /差し戻/u, en: /sen[dt] (?:a card |it )?back|back to an earlier/iu };
    for (const [path, lang] of [
      ["packages/dragon/README.md", "en"],
      ["packages/dragon/examples/quick-start.md", "ja"],
      ["packages/dragon/examples/quick-start.en.md", "en"],
    ] as const) {
      const text = repoText(path);
      expect(text, `${path} が無い`).not.toBe("");
      expect(/\[limit: \d+\]|limit: \d+/u.test(text), `${path} に [limit] の書き方が無い`).toBe(true);
      expect(/\[shape: stations\]/u.test(text), `${path} に [shape: stations] の書き方が無い`).toBe(true);
      expect(back[lang].test(text), `${path} に差し戻しの書き方が無い`).toBe(true);
      const read = fences(text);
      expect(read.some((d) => d.kind === "lineup" && d.lineup?.shape === "stations"), `${path} に流れの線として読める dragon の囲みが無い`).toBe(true);
      expect(read.some((d) => d.kind === "lineup" && (d.blocks.box ?? []).some((b) => b.limit !== undefined)), `${path} に上限を持つ列の図の囲みが無い`).toBe(true);
    }
    // 使い方の頁は節の本文 (content.ts)、節の記法の例 (docs/examples)、ブロックの段落 (gallery/docs.ts) から組む
    const content = repoText("apps/playground-spa/src/docs/content.ts");
    const sections = readdirSync(join(ROOT, "apps/playground-spa/src/docs/examples")).map((file) => repoText(`apps/playground-spa/src/docs/examples/${file}`));
    const blocks = join(ROOT, "packages/dragon/src/blocks");
    const paragraphs = readdirSync(blocks).map((name) => repoText(`packages/dragon/src/blocks/${name}/gallery/docs.ts`));
    const page = [content, ...sections, ...paragraphs].join("\n");
    expect(/\[limit: \d+\]|limit: \d+/u.test(page), "使い方の頁に [limit] の書き方が無い").toBe(true);
    expect(/\[shape: stations\]/u.test(page), "使い方の頁に [shape: stations] の書き方が無い").toBe(true);
    expect(back.ja.test(page), "使い方の頁に差し戻しの書き方が無い").toBe(true);
    // ボードの見た目 (列の帯) を書く
    expect(/ボード|board/iu.test(page), "使い方の頁にボードの見た目の説明が無い").toBe(true);
  });
});
