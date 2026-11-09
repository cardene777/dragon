/**
 * 手順の図の判断から同じ段に書いた 2 本の線 (#3579)。
 *
 * 判断から同じ段に書いた 2 本の線は同じ時刻に走り出し、段の印の点が 2 つ同時に出る。
 * 先に書いた線が本筋で真下へ進み、後に書いた線は横へ分かれるので、箱の並びは今回は通らない道を書いた図 (`login-check`) と同じになる。
 * 横に分かれた先の箱は段で辿り着くので、本筋に無い箱の点線の縁と薄い字にしない。
 *
 * 動きを確かめる図は下の `FORK_TEXT` に書き、見本の file が同じ図であることは `fork-example-passes-layout-check` が確かめる。
 * 見本の file がまだ無い間も、図の動きの検査は描く処理の形を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { changelogEntry } from "./changelog-support";
import { api, type Json } from "./diagram-support";
import { draw, type LaidBox, type Layout, type Rendered, type Timeline } from "./render-support";

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const repoText = (path: string): string => {
  const full = join(ROOT, path);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
};

/** 見本 `login-all-paths` の図 (見本の file の、頭の説明の行を除いた本文) */
const FORK_TEXT = `flow ログインの全ての道

box input as 入力
choice pw as パスワードは正しい？
choice otp as 2FAは正しい？
box done as ログイン [color: green]
box err as エラーを出す [color: rose]

step 入力する
  say 利用者がIDとパスワードを入れる。
  start -> input

step パスワードを確かめる
  say サーバーがパスワードを照らし合わせる。
  input -> pw: 送る

step パスワードで分かれる
  say 合えば2FAへ、違えばエラーへ進む。
  pw -> otp: はい
  pw -> err: いいえ

step 2FAで分かれる
  say 合えばログインへ、違えばエラーへ進む。
  otp -> done: はい
  otp -> err: いいえ
  done -> finish
`;

interface FlowBox extends LaidBox {
  off?: true;
}

interface FlowLayout extends Layout {
  boxes: FlowBox[];
  paths: unknown[];
}

interface FlowTimeline extends Timeline {
  marks?:{ step: number; event: number; depart: number; arrive: number }[];
  states?: { box: string; lit: { start: number; end: number }[] }[];
}

interface FlowRendered extends Omit<Rendered, "layout" | "timeline"> {
  layout: FlowLayout;
  timeline: FlowTimeline;
}

/** 記法を読んだ原本。読めなければ誤りを名指して落とす */
function parsed(text: string, lang: "ja" | "en" = "ja"): Json {
  const read = api("parseNotation")(text, { lang });
  expect(read.ok, `記法が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}\n${text}`).toBe(true);
  return read.ok ? read.diagram : {};
}

const render = (text: string, lang: "ja" | "en" = "ja"): FlowRendered => draw("renderDiagram")(parsed(text, lang), { lang }) as unknown as FlowRendered;

/** 段 `step` の線の出発の時刻を、書いた順に並べた物 */
const startsOf = (t: FlowTimeline, step: number): number[] => t.edges.filter((e) => e.step === step).map((e) => e.start);

/** 箱 `id` の、最初の箱から見た置き場所と大きさ */
const placeOf = (layout: FlowLayout, id: string): number[] => {
  const first = layout.boxes.find((b) => b.id === "input") as FlowBox;
  const box = layout.boxes.find((b) => b.id === id);
  expect(box, `箱 ${id} が並べた図に無い`).toBeDefined();
  return box ? [box.x - first.x, box.y - first.y, box.w, box.h] : [];
};

describe("判断から同じ段に書いた 2 本の線 (#3579)", () => {
  it("fork-lines-start-together", () => {
    const { timeline } = render(FORK_TEXT);
    const [yes, no] = startsOf(timeline, 2);
    expect(no, "段 3 の「はい」と「いいえ」の線が同じ時刻に出ない").toBe(yes);
    const dots = (timeline.marks ?? []).filter((m) => m.step === 2).map((m) => m.depart);
    expect(dots.length, "段 3 の段の印の点が 2 つでない").toBe(2);
    expect(dots[1], "段 3 の 2 つの点が同じ時刻に出ない").toBe(dots[0]);
  });

  it("fork-keeps-box-places", () => {
    const fork = render(FORK_TEXT).layout;
    const one = render(repoText("packages/dragon/examples/login-check.dragon")).layout;
    for (const id of ["input", "pw", "otp", "done", "err"]) {
      const [x, y, w, h] = placeOf(fork, id);
      const [x1, y1, w1, h1] = placeOf(one, id);
      expect([x, y, w, h].map((v) => Math.round(v as number)), `箱 ${id} の置き場所が login-check と違う`).toEqual([x1, y1, w1, h1].map((v) => Math.round(v as number)));
    }
  });

  it("fork-side-box-is-solid", () => {
    const { layout, timeline, svg } = render(FORK_TEXT);
    const err = layout.boxes.find((b) => b.id === "err");
    expect(err?.off, "段で辿り着く箱が本筋に無い印を持つ").toBeUndefined();
    expect(svg, "段で辿り着く箱の名前が薄い字になる").not.toContain('class="dg-sn dg-sn-off"');
    expect(layout.paths, "全ての道を段で走る図に点線の道が残る").toEqual([]);
    // 点が着いた時から光る
    const lit = timeline.states?.find((s) => s.box === "err")?.lit[0];
    const arrive = (timeline.marks ?? []).find((m) => m.step === 2 && m.event === 1)?.arrive;
    expect(lit?.start, "横に分かれた箱が点の着いた時に光らない").toBe(arrive);
    expect((lit?.end ?? 0) > (lit?.start ?? 0), "横に分かれた箱の光る間が無い").toBe(true);
  });

  it("fork-example-passes-layout-check", () => {
    const check = (dragon as unknown as { checkLayoutText: (text: string, options: { lang: "ja" | "en" }) => unknown[] }).checkLayoutText;
    for (const [name, lang] of [
      ["login-all-paths.dragon", "ja"],
      ["login-all-paths.en.dragon", "en"],
    ] as const) {
      const full = join(EXAMPLES, name);
      expect(existsSync(full), `${name} が packages/dragon/examples に無い`).toBe(true);
      if (!existsSync(full)) continue;
      const text = readFileSync(full, "utf8");
      expect(check(text, { lang }), `${name} に崩れがある`).toEqual([]);
      if (lang === "ja") expect(parsed(text), `${name} が検査の図と同じでない`).toEqual(parsed(FORK_TEXT));
      expect(parsed(text, lang), `${name} から作った JSON が見本の JSON と違う`).toEqual(JSON.parse(readFileSync(full.replace(/\.dragon$/u, ".json"), "utf8")));
    }
  });

  it("fork-side-box-accepts-later-line", () => {
    const head = ["flow 後から入る線", "box input as 入力", "choice pw as 正しい？", "box next as 次", "box done as 済んだ", "box err as エラー", "", "step 分かれる", "  say 両方へ進む。", "  start -> input", "  input -> pw", "  pw -> next: はい", "  pw -> err: いいえ", "", "step 進む", "  say 本筋を進む。", "  next -> done", ""];
    // 横に分かれた箱は本筋に無いので、本筋の後ろの箱から入っても前へ戻らない
    const later = api("parseNotation")([...head, "step 入る", "  say 済んだ後にエラーへ入る。", "  done -> err"].join("\n"), { lang: "ja" });
    expect(later.ok, `横に分かれた箱へ入る線を断る: ${later.ok ? "" : JSON.stringify(later.errors)}`).toBe(true);
    // 横に分かれた箱から、そこを出した判断へ戻る線は今どおり断る
    const back = api("parseNotation")([...head, "step 戻る", "  say 判断へ戻る。", "  err -> pw"].join("\n"), { lang: "ja" });
    expect(back.ok, "横に分かれた箱から判断へ戻る線を断らない").toBe(false);
  });

  it("box-lines-keep-stagger", () => {
    const text = ["flow 箱から2本", "box input as 入力", "box a as 上", "box b as 下", "", "step 分かれる", "  say 箱から 2 本の線を引く。", "  start -> input", "  input -> a", "  input -> b"].join("\n");
    const [, first, second] = startsOf(render(text).timeline, 0);
    expect((second ?? 0) > (first ?? 0), "判断でない箱から出る 2 本の線の出発がずれない").toBe(true);
  });

  it("docs-describe-fork", () => {
    const docs = repoText("packages/dragon/src/blocks/choice/gallery/docs.ts");
    expect(docs, "使い方の頁に同じ段に 2 本書く形が日本語で無い").toContain("同じ段に 2 本");
    expect(docs, "使い方の頁に同じ段に 2 本書く形が英語で無い").toContain("in the same step");
    expect(repoText("plugins/dragon/skills/dragon/references/kinds/flow.md"), "AI の skill に同じ段に 2 本書く形が無い").toContain("in the same step");
    for (const path of ["CHANGELOG.md", "CHANGELOG.ja.md"]) expect(changelogEntry(join(ROOT, path), 3579), `${path} に #3579 の項が無い`).not.toBe("");
  });
});
