// @vitest-environment jsdom
/**
 * 列の図の流れの線の見た目 (#3624)。
 *
 * 列の図 (`lineup`) の見た目に `[shape: stations]` を足す。箱を書いた順に 1 本の横の線の上の駅にし、札を駅の下に上から積み、
 * `[limit: N]` を書いた駅だけに札の居ない席の点線の受け口を描く。札が後ろの駅へ移る段は札が線の上を走り、通った区間を移った先の色で描く。
 * 札が前の駅へ戻る段 (差し戻し) は、流れの線の下を逆向きに戻る戻りの線と「差し戻し」の札を描き、札がその線を走る。
 * 封 (`seal`、`open`) と選ぶ印 (`pick`) と押す印 (`stamp`) は流れの線で描かないので、読む時に断る (本人が 2026-11-12 に選んだ)。
 * 狭い枠では線を図の左に縦に引き、駅を上から並べ、駅の名前の下に札を 2 つずつ並べる。
 * 見た目の元は step 2 で本人が選んだ動く試作の案B (`.context/extend/lineup-look/kinds/_lineup.js` の drawB と `_narrow.js` の drawSN)。
 *
 * 置き場所は描く部品が返す値 (`layout.stations` と `layout.lanes`) で、見え方は描いた SVG の keyframes を jsdom で読んで確かめる。
 * 流れの線がまだ無い間も、この file を読み込んだ所で落とさず、無い物を名指して落とす。
 */
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { api, type Json, type LineError, pointers } from "./diagram-support";
import {
  BOARD_CARDS,
  type BoardLayout,
  type BoardRendered,
  boardLineup,
  centersDuring,
  codeLines,
  DOING,
  DONE,
  fileText,
  inside,
  KANA,
  type Lang,
  LANGS,
  laneOf,
  overlaps,
  parsed,
  partsOf,
  REVIEW,
  render,
  ROOT,
  seatsAt,
  shapeOf,
  shownAt,
  type Source,
  stillOf,
  TODO,
} from "./lineup-board-support";
import { motionFrom } from "./motion-support";
import { draw, type Rendered } from "./render-support";

// 崩れの検査は src から読む。読む時間を検査の上限 (10 秒) に数えないよう、検査の中でなく file を読む時に読む
const [, { checkText, problemLine }] = await Promise.all([import("../src/render/svg"), import("../src/check")]);

/** 見本帳の見本の一覧と、棚の見本の束と記法の早見と、カタログの種類の頁の見本 */
interface Playground {
  EXAMPLE_KEYS: readonly string[];
  exampleText: (key: string, lang: Lang) => string | undefined;
  LATER_EXAMPLES: { start: () => void; state: () => { status: string } };
  sampleGroups: (lang: Lang, arrived: boolean) => { kind: string; samples: { key: string }[] }[];
  syntaxLines: (lang: Lang) => { id: string; lines: string[] }[];
  samplesOf: (kind: string) => string[];
}

const playgroundFile = (path: string): Promise<object> => import(/* @vite-ignore */ join(ROOT, "apps/playground-spa/src", path));
const { EXAMPLE_KEYS, exampleText, LATER_EXAMPLES, sampleGroups, syntaxLines, samplesOf } = Object.assign(
  {},
  ...(await Promise.all(["examples.ts", "editor/shelf-first.ts", "editor/shelf-items.ts", "catalog/catalog.ts"].map(playgroundFile))),
) as Playground;

/** 流れの線の見本。一般の版を出すまでの流れと、Web3 のコントラクトを監査して配るまでの流れ */
const SAMPLES = ["release-flow", "contract-audit"] as const;

/** 流れの線の置き場所。流れの線で並べていなければ落とす */
const stationsOf = (rendered: BoardRendered, where: string): BoardLayout => shapeOf(rendered, "stations", where);

/** 流れの線の最小の図 (かんばんの形の図を流れの線で描く) */
const stationsLineup = (): Json => boardLineup("stations");

/** 原本の箱と札と段と段ごとの出来事の数 */
const shapeOfSource = (d: Source): Record<string, unknown> => ({
  kind: d.kind,
  shape: d.lineup?.shape,
  boxes: (d.blocks.box ?? []).map((b) => b.id),
  limits: (d.blocks.box ?? []).map((b) => b.limit ?? null),
  items: (d.blocks.item ?? []).length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.map((e) => e.type)),
});

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "見本帳の後から読む見本の塊が届かない").toBe("ready");
});

describe("流れの線の記法 (#3624)", () => {
  it("lineup-stations-reads-and-roundtrips", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    const validate = api("validateDiagram");
    const text = ["lineup 流れ [shape: stations]", "box 作業 [limit: 2]", "box 確認 [color: amber]", "item 検索, 通知", "step 取る", "  say 2件を取る。", "  line 作業: 検索, 通知"].join("\n");
    const first = parse(text, { lang: "ja" });
    expect(first.ok, `流れの線の記法が読めない: ${first.ok ? "" : JSON.stringify(first.errors)}`).toBe(true);
    if (!first.ok) return;
    expect((first.diagram as unknown as Source).lineup?.shape, "流れの線の原本の見た目").toBe("stations");
    const checked = validate(first.diagram);
    expect(checked.ok, `流れの線の原本が検査で落ちる: ${JSON.stringify(checked.ok ? [] : checked.errors)}`).toBe(true);
    const printed = print(first.diagram);
    expect(codeLines(printed), "流れの線を書き戻した記法が書いた記法と違う").toEqual(codeLines(text));
    const second = parse(printed, { lang: "ja" });
    expect(second.ok ? second.diagram : undefined, "流れの線を往復した JSON が最初と違う").toEqual(first.diagram);
    // 原本の JSON から書き戻しても、頭の行に見た目を書く
    const read = api("readDiagram")(stationsLineup());
    expect(read.ok, `最小の流れの線が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
    if (read.ok) expect(print(read.diagram).split("\n")[0], "最小の流れの線を書き戻した頭の行").toBe("lineup 作業中を3件に絞る [shape: stations]");
  });

  it("lineup-shape-rejects-unknown-looks", () => {
    const parse = api("parseNotation");
    for (const lang of LANGS) {
      const read = parse(["lineup Lanes [shape: metro]", "box A", "item a", "step One", "  say Goes.", "  line A: a"].join("\n"), { lang });
      const first: LineError | undefined = read.ok ? undefined : read.errors[0];
      expect(first?.line, `ほかの綴りの見た目の誤りの行 (${lang}): ${first?.message ?? "誤りにならない"}`).toBe(1);
      expect(first?.message ?? "", `ほかの綴りの見た目の誤りの文 (${lang}) が layers を挙げない`).toContain("layers");
      expect(first?.message ?? "", `ほかの綴りの見た目の誤りの文 (${lang}) が stations を挙げない`).toContain("stations");
      expect(KANA.test(first?.message ?? ""), `ほかの綴りの見た目の誤りの文の言葉 (${lang})`).toBe(lang === "ja");
    }
    // 原本の JSON でも見た目の欄を指して断る
    const wrong = JSON.parse(JSON.stringify(stationsLineup())) as { lineup: { shape: string } };
    wrong.lineup.shape = "metro";
    expect(pointers(api("validateDiagram")(wrong as unknown as Json)), "ほかの綴りの見た目の誤りの場所").toContain("/lineup/shape");
  });

  it("lineup-stations-rejects-undrawn-lines", () => {
    const parse = api("parseNotation");
    const head = ["lineup Stations [shape: stations]", "box A", "box B", "item a", "step One", "  say Goes.", "  line A: a"];
    const cases: [string, string][] = [
      ["封", "  seal A"],
      ["開ける", "  open A"],
      ["選ぶ", "  pick A"],
      ["札", "  stamp A: Done"],
    ];
    for (const [name, line] of cases) {
      for (const lang of LANGS) {
        const read = parse([...head, line].join("\n"), { lang });
        const first: LineError | undefined = read.ok ? undefined : read.errors[0];
        expect(first?.line, `流れの線の${name}の誤りの行 (${lang}): ${first?.message ?? "誤りにならない"}`).toBe(head.length + 1);
        expect(first?.column, `流れの線の${name}の誤りの列 (${lang})`).toBe(line.indexOf(line.trim().split(" ")[0] ?? "") + 1);
        expect(first?.message ?? "", `流れの線の${name}の誤りの文 (${lang}) が見た目を挙げない`).toContain("stations");
        expect(KANA.test(first?.message ?? ""), `流れの線の${name}の誤りの文の言葉 (${lang}): ${first?.message}`).toBe(lang === "ja");
      }
    }
    // 原本の JSON でも、流れの線の封と選ぶ印と押す印の出来事を断る
    const validate = api("validateDiagram");
    for (const event of [{ type: "seal", box: DOING }, { type: "pick", box: DOING }, { type: "stamp", box: DOING, text: "済み" }] as Json[]) {
      const diagram = JSON.parse(JSON.stringify(stationsLineup())) as { steps: { events: Json[] }[] };
      diagram.steps[1]?.events.push(event);
      expect(pointers(validate(diagram as unknown as Json)).some((p) => p.startsWith("/steps/1/events/")), `流れの線の ${JSON.stringify(event)} の誤りの場所`).toBe(true);
    }
    // ボードでは同じ行を今どおり読む
    const board = parse([...head.map((l) => l.replace(" [shape: stations]", "")), "  seal A"].join("\n"));
    expect(board.ok, `ボードの封が読めない: ${board.ok ? "" : JSON.stringify(board.errors)}`).toBe(true);
  });
});

describe("流れの線の描き方 (#3624)", () => {
  it("lineup-stations-put-lanes-on-one-line", () => {
    const rendered = render(stationsLineup());
    const layout = stationsOf(rendered, "最小の流れの線");
    expect(layout.arrangement, "流れの線の並べ方").toBe("row");
    const stations = layout.stations;
    expect(stations, "流れの線の線と駅 (layout.stations)").toBeDefined();
    if (!stations) return;
    // 駅は箱を書いた順に左から 1 本の横の線の上に並ぶ
    expect(stations.stops.map((s) => s.lane), "駅の並び").toEqual([TODO, DOING, REVIEW, DONE]);
    const lineY = stations.line.y + stations.line.h / 2;
    stations.stops.forEach((stop, k) => {
      expect(Math.abs(stop.cy - lineY), `${stop.lane} の駅が線の上に無い`).toBeLessThan(0.5);
      const prev = stations.stops[k - 1];
      if (prev) expect(stop.cx, `${stop.lane} の駅が ${prev.lane} の右に無い`).toBeGreaterThan(prev.cx + prev.r * 2);
      expect(stop.cx, `${stop.lane} の駅が線の外に在る`).toBeGreaterThan(stations.line.x);
      expect(stop.cx, `${stop.lane} の駅が線の外に在る`).toBeLessThan(stations.line.x + stations.line.w);
    });
    // 線の終わりに右を向く三角を描く (線と三角は 1 つの面)
    const motion = motionFrom(rendered as unknown as Rendered);
    const line = partsOf(motion, "[data-lineup-line]");
    expect(line.length, "描いた流れの線").toBe(1);
    expect(stations.line.x + stations.line.w, "線が最後の駅の右まで伸びない").toBeGreaterThan(Math.max(...stations.stops.map((s) => s.cx)));
    // 駅の上に名前と札の数を出し、札を駅の下に上から積む
    BOARD_CARDS.forEach((byLane, s) => {
      for (const stop of stations.stops) {
        const lane = laneOf(layout, stop.lane);
        expect(lane.title.y + lane.title.h, `${stop.lane} の名前が駅の上に無い`).toBeLessThanOrEqual(stop.cy - stop.r);
        const count = (layout.counts ?? []).find((c) => c.lane === stop.lane && c.step === s);
        expect(count?.text.text, `段 ${s + 1} の ${stop.lane} の札の数`).toBe(lane.limit === undefined ? String(byLane[stop.lane]?.length) : `${byLane[stop.lane]?.length}/${lane.limit}`);
        expect((count?.y ?? 0) + (count?.h ?? 0), `段 ${s + 1} の ${stop.lane} の札の数が駅の上に無い`).toBeLessThanOrEqual(stop.cy - stop.r);
        const seats = seatsAt(layout, stop.lane, s);
        expect(seats.map((c) => c.id), `段 ${s + 1} の ${stop.lane} の札`).toEqual(byLane[stop.lane]);
        seats.forEach((seat, i) => {
          expect(Math.abs(seat.x + seat.w / 2 - stop.cx), `段 ${s + 1} の ${stop.lane} の ${seat.id} が駅の真下に無い`).toBeLessThan(0.5);
          expect(seat.y, `段 ${s + 1} の ${stop.lane} の ${seat.id} が駅の下に無い`).toBeGreaterThan(stop.cy + stop.r);
          const above = seats[i - 1];
          if (above) expect(seat.y, `段 ${s + 1} の ${stop.lane} の ${seat.id} が上の札の下に無い`).toBeGreaterThanOrEqual(above.y + above.h);
        });
      }
    });
  });

  it("lineup-stations-limit-draws-open-slots", () => {
    const rendered = render(stationsLineup());
    const layout = stationsOf(rendered, "最小の流れの線");
    const doing = laneOf(layout, DOING);
    expect(doing.limit, "作業中の上限").toBe(3);
    const slots = doing.slots ?? [];
    expect(slots.length, "作業中の受け口の数").toBe(3);
    // 受け口は札の席と同じ所に在り、札の居ない席だけが見える
    const motion = motionFrom(rendered as unknown as Rendered);
    BOARD_CARDS.forEach((byLane, s) => {
      const seats = seatsAt(layout, DOING, s);
      seats.forEach((seat, i) => expect([seat.x, seat.y], `段 ${s + 1} の作業中の ${seat.id} が受け口の席に無い`).toEqual([slots[i]?.x, slots[i]?.y]));
      const open = shownAt(motion, `[data-lineup-slot="${DOING}"]`, stillOf(rendered, s));
      expect(open.length, `段 ${s + 1} の止め絵の作業中の見える受け口`).toBe(3 - (byLane[DOING]?.length ?? 0));
      for (const el of open) expect(el.getAttribute("stroke-dasharray") ?? el.querySelector("[stroke-dasharray]")?.getAttribute("stroke-dasharray") ?? "", "受け口が点線でない").not.toBe("");
    });
  });

  it("lineup-stations-no-limit-draws-no-slots", () => {
    const rendered = render(stationsLineup());
    const layout = stationsOf(rendered, "最小の流れの線");
    const motion = motionFrom(rendered as unknown as Rendered);
    for (const id of [TODO, REVIEW, DONE]) {
      expect(laneOf(layout, id).slots ?? [], `${id} の受け口`).toEqual([]);
      expect(partsOf(motion, `[data-lineup-slot="${id}"]`).length, `${id} の描いた受け口`).toBe(0);
    }
  });

  it("lineup-stations-cards-run-along-the-line", () => {
    const rendered = render(stationsLineup());
    const layout = stationsOf(rendered, "最小の流れの線");
    const lineY = (layout.stations?.line.y ?? 0) + (layout.stations?.line.h ?? 0) / 2;
    const motion = motionFrom(rendered as unknown as Rendered);
    // 段 2 にやることから作業中へ移る検索は、移る間に線の上まで上がる
    const centers = centersDuring(rendered, motion, "検索", DOING, 1);
    expect(Math.min(...centers.map((p) => Math.abs(p[1] - lineY))), "検索が移る間に流れの線を走らない").toBeLessThan(2);
    // その段で通った区間を移った先の駅の色で描き、次の段では消す
    const runs = (layout.stations?.runs ?? []).filter((r) => r.step === 1);
    expect(runs.map((r) => [r.from, r.to]), "段 2 の通った区間 (layout.stations.runs)").toEqual([[TODO, DOING]]);
    const stops = new Map((layout.stations?.stops ?? []).map((s) => [s.lane, s]));
    const run = runs[0];
    if (run) {
      const xs = run.points.map((p) => p[0]);
      expect([Math.min(...xs), Math.max(...xs)], "段 2 の区間の両端が駅に無い").toEqual([stops.get(TODO)?.cx, stops.get(DOING)?.cx]);
      for (const p of run.points) expect(Math.abs(p[1] - lineY), "段 2 の区間が線の上に無い").toBeLessThan(0.5);
    }
    const shown = shownAt(motion, "[data-lineup-run]", stillOf(rendered, 1));
    expect(shown.length, "段 2 の止め絵の通った区間").toBe(1);
    expect(shown[0]?.getAttribute("style") ?? "", "段 2 の通った区間の色").toContain("--c-violet");
    expect(shownAt(motion, "[data-lineup-run]", stillOf(rendered, 0), 0.1).length, "段 1 に通った区間が見える").toBe(0);
    // 差し戻しは通った区間を描かない。同じ段に後ろの駅へ進む札 (確認待ちから済みへ進む検索) の区間は描く
    const back = (layout.stations?.runs ?? []).filter((r) => r.step === 3);
    expect(back.filter((r) => r.from === REVIEW && r.to === DOING), "差し戻しの通った区間").toEqual([]);
    expect(back.map((r) => [r.from, r.to]), "段 4 の通った区間").toEqual([[REVIEW, DONE]]);
  });

  it("lineup-stations-send-back-runs-under-the-line", () => {
    for (const lang of LANGS) {
      const rendered = render(stationsLineup(), lang);
      const layout = stationsOf(rendered, `${lang} の最小の流れの線`);
      const stations = layout.stations;
      const lineY = (stations?.line.y ?? 0) + (stations?.line.h ?? 0) / 2;
      const backs = layout.backs ?? [];
      expect(backs.map((b) => [b.id, b.from, b.to, b.step]), `${lang} の差し戻し (layout.backs)`).toEqual([["通知", REVIEW, DOING, 3]]);
      const back = backs[0];
      if (!back) continue;
      const stops = new Map((stations?.stops ?? []).map((s) => [s.lane, s]));
      // 戻りの線は流れの線の下を逆向きに戻り、札の上で止まる
      const xs = back.points.map((p) => p[0]);
      const ys = back.points.map((p) => p[1]);
      expect(back.points[0]?.[0], `${lang} の戻りの線が確認待ちの駅から出ない`).toBeCloseTo(stops.get(REVIEW)?.cx ?? Number.NaN, 1);
      expect(back.points.at(-1)?.[0], `${lang} の戻りの線が作業中の駅へ戻らない`).toBeCloseTo(stops.get(DOING)?.cx ?? Number.NaN, 1);
      expect(Math.min(...ys), `${lang} の戻りの線が流れの線の下に無い`).toBeGreaterThan(lineY + (stops.get(DOING)?.r ?? 0));
      const firstCard = Math.min(...layout.chips.filter((c) => !c.trace).map((c) => c.y));
      const level = Math.min(...ys);
      expect(level, `${lang} の戻りの線の横の区間が札に掛かる`).toBeLessThan(firstCard);
      expect(Math.max(...xs) - Math.min(...xs), `${lang} の戻りの線の横の区間`).toBeGreaterThan(0);
      expect(back.label.text.text, `${lang} の差し戻しの札の字`).toBe(lang === "ja" ? "差し戻し" : "Sent back");
      expect(Math.abs(back.label.y + back.label.h / 2 - level), `${lang} の差し戻しの札が線の上に無い`).toBeLessThan(1);
      // 戻った札はその線を走り、その段だけ戻る印を持ち、元の駅の席に点線の抜けた跡が残る
      const motion = motionFrom(rendered as unknown as Rendered);
      const centers = centersDuring(rendered, motion, "通知", DOING, 3);
      expect(Math.min(...centers.map((p) => Math.abs(p[1] - level))), `${lang} の通知が戻りの線を走らない`).toBeLessThan(2);
      expect(Math.min(...centers.map((p) => p[1])), `${lang} の通知が流れの線の上を走る`).toBeGreaterThan(lineY);
      const mark = `[data-lineup-chip="通知"][data-lineup-on="${DOING}"] [data-lineup-tag="back"]`;
      expect(shownAt(motion, mark, stillOf(rendered, 3)).length, `${lang} の段 4 の通知の戻る印`).toBe(1);
      expect(shownAt(motion, mark, stillOf(rendered, 4)).length, `${lang} の段 5 に通知の戻る印が残る`).toBe(0);
      expect((layout.ghosts ?? []).filter((g) => g.kind === "from").map((g) => [g.id, g.lane, g.step]), `${lang} の抜けた跡`).toEqual([["通知", REVIEW, 3]]);
      expect(shownAt(motion, '[data-lineup-back="通知"]', stillOf(rendered, 3)).length, `${lang} の段 4 の差し戻し`).toBe(1);
      expect(shownAt(motion, '[data-lineup-back="通知"]', stillOf(rendered, 4), 0.1).length, `${lang} の段 5 に差し戻しが見える`).toBe(0);
    }
  });

  it("lineup-stations-draws-every-accepted-word", () => {
    for (const lang of LANGS) {
      const rendered = render(stationsLineup(), lang);
      const layout = stationsOf(rendered, `${lang} の最小の流れの線`);
      const motion = motionFrom(rendered as unknown as Rendered);
      const style = (selector: string): string => partsOf(motion, selector)[0]?.getAttribute("style") ?? "";
      // box の color は駅の色に、note は駅の値の札に、order: none は「順番なし」に、limit は札の数と受け口になる
      expect(style(`[data-lineup-station="${DOING}"]`), `${lang} の作業中の駅の色`).toContain("--c-violet");
      expect((layout.values ?? []).filter((v) => v.lane === REVIEW).map((v) => v.text.text)[0], `${lang} の確認待ちの値`).toBe("1日");
      expect(laneOf(layout, DONE).hint?.text, `${lang} の済みの順番なし`).toBe(lang === "ja" ? "順番なし" : "No order");
      expect(laneOf(layout, DOING).limit, `${lang} の作業中の上限`).toBe(3);
      // item の color は札の色に、note は凡例に、label は札の字になる
      expect(style('[data-lineup-chip="不具合"]'), `${lang} の不具合の札の色`).toContain("--c:var(--c-rose)");
      expect((layout.legend ?? []).map((r) => r.text.text), `${lang} の凡例`).toEqual(["急ぎの不具合"]);
      // role は役の札に、step と say は段の題と文になる
      expect((layout.roles ?? []).map((r) => r.id), `${lang} の役の札`).toEqual(["開発者", "確認係"]);
      expect(partsOf(motion, '[data-lineup-role="確認係"]').length, `${lang} の描いた確認係の札`).toBe(1);
      expect((layout.headlines ?? []).map((h) => h.title.text), `${lang} の段の題`).toEqual(["並べる", "3件を取る", "確認へ回す", "差し戻す", "次を取る", "取りやめる"]);
    }
    // label を持つ札は label を札の字にする
    const labeled = JSON.parse(JSON.stringify(stationsLineup())) as { blocks: { item: { id: string; label?: string }[] } };
    (labeled.blocks.item[0] as { label?: string }).label = "検";
    const motion = motionFrom(render(labeled) as unknown as Rendered);
    expect(partsOf(motion, '[data-lineup-chip="検索"] text').map((el) => el.textContent), "label を持つ札の字").toContain("検");
  });
});

describe("狭い枠の流れの線 (#3624)", () => {
  it("lineup-stations-narrow-runs-down", () => {
    for (const width of [390, 324]) {
      const rendered = render(stationsLineup(), "ja", width);
      const layout = stationsOf(rendered, `幅 ${width} の流れの線`);
      expect(layout.arrangement, `幅 ${width} の並べ方`).toBe("stack");
      const stations = layout.stations;
      expect(stations, `幅 ${width} の線と駅`).toBeDefined();
      if (!stations) continue;
      // 線は図の左に縦に引き、駅を上から並べる
      expect(stations.line.h, `幅 ${width} の線が縦でない`).toBeGreaterThan(stations.line.w);
      expect(stations.line.x + stations.line.w, `幅 ${width} の線が図の左に無い`).toBeLessThan(layout.width / 4);
      expect(stations.stops.map((s) => s.lane), `幅 ${width} の駅の並び`).toEqual([TODO, DOING, REVIEW, DONE]);
      const lineX = stations.line.x + stations.line.w / 2;
      stations.stops.forEach((stop, k) => {
        expect(Math.abs(stop.cx - lineX), `幅 ${width} の ${stop.lane} の駅が線の上に無い`).toBeLessThan(0.5);
        const prev = stations.stops[k - 1];
        if (prev) expect(stop.cy, `幅 ${width} の ${stop.lane} の駅が ${prev.lane} の下に無い`).toBeGreaterThan(prev.cy);
      });
      // 駅の名前の下に札を 2 つずつ並べ、札は線の右に在る
      for (const stop of stations.stops) {
        const lane = laneOf(layout, stop.lane);
        BOARD_CARDS.forEach((_, s) => {
          const seats = seatsAt(layout, stop.lane, s);
          for (const seat of seats) {
            expect(seat.y, `幅 ${width} の段 ${s + 1} の ${stop.lane} の ${seat.id} が名前の下に無い`).toBeGreaterThanOrEqual(lane.title.y + lane.title.h);
            expect(seat.x, `幅 ${width} の段 ${s + 1} の ${stop.lane} の ${seat.id} が線の右に無い`).toBeGreaterThan(lineX + stop.r);
            expect(seat.x + seat.w, `幅 ${width} の ${seat.id} が図からはみ出す`).toBeLessThanOrEqual(layout.width);
          }
          if (seats.length >= 2) expect(new Set(seats.map((c) => Math.round(c.x))).size, `幅 ${width} の段 ${s + 1} の ${stop.lane} の札の列の数`).toBe(2);
        });
      }
      // 差し戻しの線は線の左を上へ戻る
      const back = (layout.backs ?? [])[0];
      expect(back, `幅 ${width} の差し戻し`).toBeDefined();
      if (back) {
        expect(Math.min(...back.points.map((p) => p[0])), `幅 ${width} の戻りの線が線の左を通らない`).toBeLessThan(stations.line.x);
        expect((back.points.at(-1)?.[1] ?? 0) < (back.points[0]?.[1] ?? 0), `幅 ${width} の戻りの線が上へ戻らない`).toBe(true);
        for (const seat of layout.chips) expect(overlaps(back.label, seat), `幅 ${width} の差し戻しの札が ${seat.id} に重なる`).toBe(false);
      }
      // 全体を出す見せ方で、枠に収めた字が 10.5px 以上ある
      const view = draw("chooseView")(rendered as unknown as Rendered, width);
      expect(view.mode, `幅 ${width} の見せ方`).toBe("fixed");
      expect(view.textPx, `幅 ${width} の枠に収めた字の大きさ`).toBeGreaterThanOrEqual(10.5);
      for (const lane of layout.lanes) expect(inside(lane.title, { x: 0, y: 0, w: layout.width, h: layout.height }), `幅 ${width} の ${lane.id} の名前が図の外に在る`).toBe(true);
    }
  });
});

describe("流れの線の見本と棚 (#3624)", () => {
  it("lineup-stations-examples-in-both-langs-have-no-breaks", () => {
    let backs = 0;
    for (const name of SAMPLES) {
      const sources: Partial<Record<Lang, Source>> = {};
      for (const lang of LANGS) {
        const file = `${name}${lang === "en" ? ".en" : ""}.dragon`;
        const text = fileText(file);
        expect(text, `${file} が packages/dragon/examples に無い`).toBeDefined();
        if (text === undefined) continue;
        expect(text.split("\n")[0] ?? "", `${file} の最初の行`).toMatch(/^\/\/ /u);
        expect(/#\d+/u.test(text.split("\n")[0] ?? ""), `${file} の最初の注釈の行に作業の番号がある`).toBe(false);
        const source = parsed(text, lang, file) as unknown as Source;
        sources[lang] = source;
        expect(source.lineup?.shape, `${file} の見た目`).toBe("stations");
        const problems = checkText(file, text, "notation", lang, { layout: (step, said) => `段 ${step}: ${said}` }).map(problemLine);
        expect(problems, `${file} の崩れの知らせ`).toEqual([]);
        for (const width of [undefined, 390]) {
          const layout = stationsOf(render(source as unknown as Json, lang, width), `${file} (幅 ${width ?? "既定"})`);
          expect(layout.stations?.stops.length, `${file} を幅 ${width ?? "既定"} で描いた駅の数`).toBe(source.blocks.box?.length ?? -1);
          if (lang === "ja" && width === undefined) backs += (layout.backs ?? []).length;
        }
      }
      if (sources.ja && sources.en) expect(shapeOfSource(sources.en), `${name} の英語版の形が日本語版と違う`).toEqual(shapeOfSource(sources.ja));
      expect(EXAMPLE_KEYS.includes(name), `${name} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
      expect(samplesOf("lineup"), `見本帳の列の図の頁に ${name} が無い`).toContain(name);
      for (const lang of LANGS) expect(exampleText(name, lang), `見本帳の ${name} の ${lang} の記法が見本の file と違う`).toBe((fileText(`${name}${lang === "en" ? ".en" : ""}.dragon`) ?? "").trimEnd());
    }
    expect(backs, "流れの線の見本の差し戻しの段の数").toBeGreaterThan(0);
  });

  it("lineup-stations-shelf-template-reads", () => {
    for (const lang of LANGS) {
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(kinds.some((line) => /^lineup <[^>]+> \[shape: stations\]$/u.test(line)), `棚の記法の早見 (${lang}) に lineup の流れの線の頭の行が無い: ${kinds.join(" / ")}`).toBe(true);
      const group = sampleGroups(lang, true).find((g) => g.kind === "lineup");
      expect(group, `棚の見本の束 (${lang}) に列の図の束が無い`).toBeDefined();
      const keys = group?.samples.map((s) => s.key) ?? [];
      for (const name of SAMPLES) {
        expect(keys, `棚の列の図の束 (${lang}) に ${name} が無い`).toContain(name);
        if (!keys.includes(name)) continue;
        expect((parsed(exampleText(name, lang) ?? "", lang, `棚の雛形 ${name} (${lang})`) as unknown as Source).lineup?.shape, `棚の雛形 ${name} (${lang}) の見た目`).toBe("stations");
      }
    }
  });
});
