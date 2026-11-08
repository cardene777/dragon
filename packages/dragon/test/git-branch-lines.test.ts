/**
 * 同じ commit から分かれる枝の線と、その線に置く段の番号 (#3547)。
 *
 * 見本`merge`では、コミットBから分かれる`fix`と`feature`の2本の枝の線が、Bの真下で同じ所を通って重なっていた。
 * 同じ線の上に段2、段3、段4の番号が縦に詰まって並び、`dragon check --layout`が近すぎる番号を知らせていた。
 * 見本`rebase`でも、段の番号を崩れの検査の下限より近くに置いていた。
 * 同じ commit から別の枝へ分かれる線は、出口を横に離して別々の道を通し、段の番号は検査と同じ下限で離して置く。
 * 検査は、同じ所から出て重なって走り、その先で分かれる2本の線を、段と2本の線を名指して知らせる。
 * 描き方を直した後は見本の図も手で書いた図も線を重ねないので、重なる線の知らせは、置き場所を決めた後の線の出口を丸の真ん中へ戻して確かめる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

/** 枝分かれの図の置き場所を決めた後に、分かれる線の出口を丸の真ん中へ戻すか。重なる線の知らせを確かめる検査だけが立てる */
const overlap = vi.hoisted(() => ({ on: false }));

vi.mock("../src/kinds/git/layout", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/kinds/git/layout")>();
  return {
    ...real,
    layoutGit: (...args: Parameters<typeof real.layoutGit>) => {
      const layout = real.layoutGit(...args);
      if (!overlap.on) return layout;
      // 丸の上か下から出る線 (分かれる線) だけを、出口が丸の真ん中の真上か真下に来るよう横へ戻す。同じ帯の線と当て直しの線は動かさない
      for (const link of layout.links) {
        const from = layout.commits.find((c) => c.id === link.from);
        const start = link.points[0];
        if (!from || !start || link.kind === "copy" || Math.abs(start[1] - from.cy) < 0.5) continue;
        const dx = from.cx - start[0];
        link.points = link.points.map(([x, y]): [number, number] => [x + dx, y]);
      }
      return layout;
    },
  };
});

/*
 * 描く部品と崩れを数える部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械では変換だけで 1 件の上限 (10 秒) に近づく (#3410)
 */
const [{ renderDiagram }, { parseNotation }, { checkLayoutText }, { checkText, problemLine }, { APART, LOOK }] = await Promise.all([
  // 全ての図の種類の部品と個別ブロックの読み方を持つ入口から読む。描く本体だけを読むと、枝分かれの図の記法を読めない
  import("../src/render/svg"),
  import("../src/parser"),
  import("../src/render/layout-check"),
  import("../src/check"),
  import("../src/look/values"),
]);

type Point = [number, number];
interface Link {
  kind: "parent" | "copy" | "branch";
  from: string;
  to: string;
  step: number;
  points: Point[];
}
interface GitLaid {
  links: Link[];
  commits: { id: string; branch: string; cx: number; cy: number }[];
}

const ROOT = process.cwd();
const EXAMPLES = join(ROOT, "packages/dragon/examples");
const RECORDED = join(ROOT, "packages/dragon/test/fixtures/layout-breaks.json");

/** 同じ commit B から 3 本の枝を切り、それぞれに commit を積む図 */
const THREE_BRANCHES = [
  "git 1 つの commit から 3 本の枝を切る",
  "",
  "branch main [note: 取り込む先]",
  "branch fix [note: 直しの枝]",
  "branch feature [note: 作業の枝]",
  "branch docs [note: 文書の枝]",
  "",
  "step main にある",
  "  say main に commit A と B がある。",
  "  commit A on main [hash: 3fa0c19, note: 最初の形]",
  "  commit B on main [hash: 8b04f71, note: 一覧を足す]",
  "",
  "step 枝を 3 本切る",
  "  say B から fix と feature と docs を切る。",
  "  fix from B",
  "  feature from B",
  "  docs from B",
  "",
  "step 直しを積む",
  "  say fix に F を積む。",
  "  commit F on fix [hash: 5b2e7a1, note: 誤字を直す]",
  "",
  "step 作業を積む",
  "  say feature に C を積む。",
  "  commit C on feature [hash: c41d0e5, note: 価格を丸める]",
  "",
  "step 文書を積む",
  "  say docs に W を積む。",
  "  commit W on docs [hash: 9d3e2f0, note: 使い方を書く]",
].join("\n");

const read = (name: string): string => readFileSync(join(EXAMPLES, name), "utf8");
const langOf = (name: string): "ja" | "en" => (name.includes(".en.") ? "en" : "ja");

/** 見本の並んで近すぎる線の崩れ。記法を読めない時は落とし、崩れを数えなかった回を崩れの無い回と取り違えない */
function closeLines(name: string): unknown[] {
  const text = read(name);
  const parsed = parseNotation(text, { lang: langOf(name) });
  expect(parsed.ok ? [] : parsed.errors.map((e) => e.message), `${name} を読めない`).toEqual([]);
  return checkLayoutText(text, { lang: langOf(name) }).filter((b) => b.kind === "lines-close");
}

function laid(text: string, lang: "ja" | "en" = "ja"): GitLaid {
  const parsed = parseNotation(text, { lang });
  if (!parsed.ok) throw new Error(`記法を読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`);
  return renderDiagram(parsed.diagram, { lang }).layout as unknown as GitLaid;
}

/**
 * `dragon check --layout` と同じ形で、記法の誤りと崩れの知らせの行を返す。段の頭は命令と同じ形にする。
 * 誤りの行も返し、記法を読めずに崩れを数えなかった回を、崩れの無い回と取り違えない
 */
function problems(file: string, text: string, lang: "ja" | "en"): string[] {
  const head = (step: number, said: string): string => (lang === "ja" ? `段 ${step}: ${said}` : `Step ${step}: ${said}`);
  return checkText(file, text, "notation", lang, { layout: head }).map(problemLine);
}

/** 点から線分 a-b までの距離 */
function toSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / length));
  return Math.hypot(ax + t * dx - px, ay + t * dy - py);
}

/** 折れ線を 1px ごとに区切った点 */
function samples(points: Point[]): Point[] {
  return points.slice(1).flatMap((q, k) => {
    const p = points[k] as Point;
    const n = Math.max(1, Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])));
    return Array.from({ length: n + 1 }, (_, i): Point => [p[0] + ((q[0] - p[0]) * i) / n, p[1] + ((q[1] - p[1]) * i) / n]);
  });
}

/** 2 本の折れ線の間の最も近い所の距離 */
function closest(a: Point[], b: Point[]): number {
  return Math.min(...samples(a).map((p) => Math.min(...b.slice(1).map((q, k) => toSegment(p, b[k] as Point, q)))));
}

/** commit `from` から、枝 `branch` の帯へ分かれる線 (枝を切る線と、その枝の commit への線) */
function branchLines(layout: GitLaid, from: string, branch: string): Link[] {
  const on = new Set(layout.commits.filter((c) => c.branch === branch).map((c) => c.id));
  return layout.links.filter((l) => l.from === from && l.kind !== "copy" && (l.to === branch || on.has(l.to)));
}

describe("同じ commit から分かれる枝の線は別々の道を通る (#3547)", () => {
  it("merge-examples-warn-nothing", () => {
    for (const name of ["merge.dragon", "merge.en.dragon"])
      expect(problems(join(EXAMPLES, name), read(name), langOf(name)), `${name} の崩れの知らせ`).toEqual([]);
  });

  it("rebase-examples-warn-nothing", () => {
    for (const name of ["rebase.dragon", "rebase.en.dragon"])
      expect(problems(join(EXAMPLES, name), read(name), langOf(name)), `${name} の崩れの知らせ`).toEqual([]);
  });

  it("merge-branch-lines-leave-apart", () => {
    const layout = laid(read("merge.dragon"));
    const fix = branchLines(layout, "B", "fix");
    const feature = branchLines(layout, "B", "feature");
    expect(fix.map((l) => l.to).sort(), "B から fix へ分かれる線").toEqual(["F", "fix"]);
    expect(feature.map((l) => l.to).sort(), "B から feature へ分かれる線").toEqual(["C", "feature"]);
    // 出口の間は、崩れの検査が並んだ線に求める間に線の太さを足した値
    const [fixStart, featureStart] = [fix[0]?.points[0] as Point, feature[0]?.points[0] as Point];
    expect(Math.abs(fixStart[0] - featureStart[0]), "fix と feature の線の出口の間").toBeCloseTo(APART.line + LOOK.stroke.git, 5);
    for (const a of fix)
      for (const b of feature)
        expect(closest(a.points, b.points), `線 B → ${a.to} と線 B → ${b.to} の最も近い所`).toBeGreaterThanOrEqual(APART.line);
  });

  it("three-branch-lines-leave-apart", () => {
    const layout = laid(THREE_BRANCHES);
    const lines = ["fix", "feature", "docs"].map((branch) => ({ branch, lines: branchLines(layout, "B", branch) }));
    for (const { branch, lines: each } of lines) expect(each.length, `B から ${branch} へ分かれる線の数`).toBe(2);
    lines.forEach(({ branch: a, lines: as }, i) => {
      for (const { branch: b, lines: bs } of lines.slice(i + 1))
        for (const x of as)
          for (const y of bs) expect(closest(x.points, y.points), `${a} の線 B → ${x.to} と ${b} の線 B → ${y.to} の最も近い所`).toBeGreaterThanOrEqual(APART.line);
    });
    expect(problems("three.dragon", THREE_BRANCHES, "ja"), "3 本の枝の図の崩れの知らせ").toEqual([]);
  });

  it("layout-breaks-record-is-empty", () => {
    expect(JSON.parse(readFileSync(RECORDED, "utf8")), "見本の崩れの記録に残る行").toEqual({});
  });
});

describe("重なる枝の線を名指して知らせる (#3547)", () => {
  it("layout-check-names-overlapping-branch-lines", () => {
    const file = join(EXAMPLES, "merge.dragon");
    const text = read("merge.dragon");
    overlap.on = true;
    let ja: string[];
    let en: string[];
    let moved: GitLaid;
    try {
      moved = laid(text);
      ja = problems(file, text, "ja");
      en = problems(join(EXAMPLES, "merge.en.dragon"), read("merge.en.dragon"), "en");
    } finally {
      overlap.on = false;
    }
    // 戻した線は、fix と feature の線が B の真下の同じ所から出る
    const [fix, feature] = [branchLines(moved, "B", "fix")[0]?.points[0], branchLines(moved, "B", "feature")[0]?.points[0]];
    expect(fix && feature ? Math.hypot(fix[0] - feature[0], fix[1] - feature[1]) : undefined, "戻した fix と feature の線の出口の間").toBeLessThan(0.5);
    const hit = ja.find((line) => line.includes("線 B → fix (段 2)") && line.includes("線 B → feature (段 2)"));
    expect(hit, `段 2 で重なる B → fix と B → feature の線を名指す行が無い\n${ja.join("\n")}`).toBeDefined();
    expect(hit, "重なる線の知らせの行の形").toMatch(/^.+merge\.dragon:\d+:1 warning 段 2: /u);
    const hitEn = en.find((line) => line.includes("the line B → fix (step 2)") && line.includes("the line B → feature (step 2)"));
    expect(hitEn, `英語の行が重なる線を名指さない\n${en.join("\n")}`).toMatch(/warning Step 2: /u);
  });

  it("layout-check-skips-redrawn-branch-line", () => {
    // rebase では、B から feature を切る線と、feature に最初に積む C への線が、同じ道を通る
    const layout = laid(read("rebase.dragon"));
    const cut = layout.links.find((l) => l.kind === "branch" && l.from === "B" && l.to === "feature");
    const first = layout.links.find((l) => l.kind === "parent" && l.from === "B" && l.to === "C");
    expect(cut && first, "B から feature を切る線と C への線").toBeTruthy();
    const off = Math.max(...samples(cut?.points ?? []).map((p) => Math.min(...(first?.points ?? []).slice(1).map((q, k) => toSegment(p, (first?.points ?? [])[k] as Point, q)))));
    expect(off, "枝を切る線が C への線の上から外れる").toBeLessThan(0.5);
    for (const name of ["rebase.dragon", "rebase.en.dragon"]) expect(closeLines(name), `${name} の同じ道の線を重なる線に数える`).toEqual([]);
  });

  it("layout-check-skips-fanning-lines", () => {
    // 試す図の網では、あなたのノードから node-1 と node-2 へ 2 本の線が別々の向きに広がる
    const text = read("tx-block.dragon");
    expect(text, "網があなたから 2 つのノードへ線を出さない (確かめる相手が無い)").toMatch(/あなた - node-1.*あなた - node-2/u);
    for (const name of ["tx-block.dragon", "tx-block.en.dragon"]) expect(closeLines(name), `${name} の広がる線を重なる線に数える`).toEqual([]);
  });
});
