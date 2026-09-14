/**
 * 組 (`groups:`) の枠が、束ねた縦列とその中の箱を囲む位置と大きさに置かれることの検証 (#1972)。
 *
 * 組み立ては枠の縦列を 1 本足すだけで、束ねた縦列の位置を読まなかった。 枠は全ての縦列の右
 * (流れ図で左端 1915) に高さ 40 の見出しだけで描かれ、図の横幅も枠の分だけ広がっていた。
 *
 * ## 期待値は同じ図の配置から取る
 *
 * 座標を固定値で書くと、描画側の間隔が変わった時に検査だけが古くなる。 束ねた縦列と箱の位置を
 * その図の配置から測り、枠がそれを含むかで比べる。
 */
import { describe, it, expect } from "vitest";
import { layout, visualValidateAll, type CdlDiagram } from "@cardenelabs/cdl";
import { jsonToDiagram, textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/compile";

type 枠 = { x: number; y: number; 右: number; 下: number };

/** 3 本の縦列に 1 つずつ箱を置き、`組の縦列` を 1 つの組で束ねる図 */
const 図 = (
  組の縦列: string | null,
  o: { type?: string; 縦列の欄?: Record<string, string> } = {},
): string => {
  const 欄 = o.縦列の欄 ?? {};
  const 縦列 = (id: string, 名: string) =>
    `  ${id}: { label: "${名}"${欄[id] ? `, ${欄[id]}` : ""} }`;
  return `title: "t"
type: ${o.type ?? "flow"}

lanes:
${縦列("web", "受付の層")}
${縦列("app", "処理の層")}
${縦列("db", "保存の層")}
${組の縦列 === null ? "" : `\ngroups:\n  inside: { label: "社内の網", lanes: [${組の縦列}] }\n`}
actors:
  - 利用者: { kind: actor, lane: web }
  - 注文の処理: { kind: function, lane: app }
  - 注文の台帳: { kind: storage, lane: db }

flow:
  - 利用者 -> 注文の処理: "注文"
  - 注文の処理 -> 注文の台帳: "書き込み"
`;
};

const 組む = (記法: string, 知らせ?: CompileNotice[]): CdlDiagram =>
  textDslToDiagram(記法, 知らせ ? { onNotice: (n) => 知らせ.push(n) } : undefined);

const 縦列の枠 = (d: CdlDiagram, id: string): 枠 => {
  const l = layout(d).lanes.find((x) => x.id === id);
  if (!l) throw new Error(`縦列 ${id} が配置に無い`);
  return { x: l.x ?? 0, y: l.y ?? 0, 右: (l.x ?? 0) + l.width, 下: (l.y ?? 0) + (l.height ?? 0) };
};

const 箱の枠たち = (d: CdlDiagram, 縦列: readonly string[]): 枠[] =>
  layout(d)
    .nodes.filter((n) => 縦列.includes(n.lane))
    .map((n) => ({ x: n.cx - n.w / 2, y: n.cy - n.h / 2, 右: n.cx + n.w / 2, 下: n.cy + n.h / 2 }));

/** 枠 `外` が `内` を全て含むか */
const 含む = (外: 枠, 内: 枠): boolean =>
  外.x <= 内.x && 外.y <= 内.y && 外.右 >= 内.右 && 外.下 >= 内.下;

describe("組の枠が束ねた縦列と箱を囲む (#1972)", () => {
  for (const type of ["flow", "topology"] as const) {
    it(`type: ${type} で lanes: [app, db] の枠が app の左端から db の右端までと、中の箱を全て含む`, () => {
      const d = 組む(図("app, db", { type }));
      const 組 = 縦列の枠(d, "group-inside");
      const app = 縦列の枠(d, "app");
      const db = 縦列の枠(d, "db");
      expect(組.x, "枠の左端が app の左端より右にある").toBeLessThanOrEqual(app.x);
      expect(組.右, "枠の右端が db の右端より左にある").toBeGreaterThanOrEqual(db.右);
      const 箱 = 箱の枠たち(d, ["app", "db"]);
      expect(箱.length, "束ねた縦列の箱を測れていない (検査が空振りしている)").toBe(2);
      for (const b of 箱)
        expect(含む(組, b), `枠 ${JSON.stringify(組)} が箱 ${JSON.stringify(b)} を含まない`).toBe(
          true,
        );
      expect(含む(組, app) && 含む(組, db), "枠が束ねた縦列の見出しを含まない").toBe(true);
    });

    it(`type: ${type} で束ねない web の縦列と箱は枠の外にある`, () => {
      const d = 組む(図("app, db", { type }));
      const 組 = 縦列の枠(d, "group-inside");
      const web = 縦列の枠(d, "web");
      expect(web.右, "束ねない縦列が枠に食い込む").toBeLessThanOrEqual(組.x);
    });

    it(`type: ${type} で枠を置いても縦列と箱と矢印の位置は変わらず、図の横幅は枠の余白の分しか広がらない`, () => {
      // 枠が縦列の並びに加わると他の縦列の間隔が広がる (実測 = 2 本目が 666 から 710 へ動いた)。
      // 横幅は、束ねた db が最後の縦列なので、枠の横の余白 (囲いの無い flow は 0、topology は 20) の分だけ広がる
      const 無し = layout(組む(図(null, { type })));
      const 有り = layout(組む(図("app, db", { type })));
      expect(有り.lanes.filter((l) => l.id !== "group-inside")).toEqual(無し.lanes);
      expect(有り.nodes).toEqual(無し.nodes);
      expect(有り.edges).toEqual(無し.edges);
      expect(有り.viewBox.w - 無し.viewBox.w, "枠の余白より図の横幅が広がった").toBe(
        type === "flow" ? 0 : 20,
      );
    });

    it(`type: ${type} で枠の名札が束ねた縦列の名札と重ならない`, () => {
      const r = visualValidateAll([組む(図("app, db", { type }))], { container: { width: 874 } });
      const 重なり = r.reports.flatMap((x) =>
        x.violations.filter(
          (v) => v.axis === "lane-label-overlap" || v.axis === "lane-border-clearance",
        ),
      );
      expect(
        r.reports.length,
        "検査の報告を受け取れていない (検査が空振りしている)",
      ).toBeGreaterThan(0);
      expect(重なり.map((v) => v.detail)).toEqual([]);
    });
  }

  it("囲いを持つ縦列 (topology) は枠を横に 20 離し、囲いの無い縦列 (flow) は縦列の端に合わせる", () => {
    const 囲い = 組む(図("app, db", { type: "topology" }));
    expect(縦列の枠(囲い, "app").x - 縦列の枠(囲い, "group-inside").x).toBeCloseTo(20, 0);
    const 無い = 組む(図("app, db"));
    expect(縦列の枠(無い, "app").x - 縦列の枠(無い, "group-inside").x).toBeCloseTo(0, 0);
  });

  it("縦列をずらした図 (#1971) でも、ずらした後の縦列と箱を囲む", () => {
    const d = 組む(図("app, db", { 縦列の欄: { db: "offsetX: 100, offsetY: 40" } }));
    const 組 = 縦列の枠(d, "group-inside");
    const db = 縦列の枠(d, "db");
    const 前 = 縦列の枠(組む(図("app, db")), "db");
    expect(db.x - 前.x, "縦列のずらしが効いていない (前提が崩れた)").toBeCloseTo(100, 0);
    expect(含む(組, db), "ずらした縦列を囲まない").toBe(true);
    for (const b of 箱の枠たち(d, ["app", "db"])) expect(含む(組, b)).toBe(true);
  });

  it("JSON の groups でも記法と同じ図になる", () => {
    const 記法 = 組む(図("app, db"));
    const json = jsonToDiagram({
      title: "t",
      type: "flow",
      lanes: {
        web: { label: "受付の層" },
        app: { label: "処理の層" },
        db: { label: "保存の層" },
      },
      groups: { inside: { label: "社内の網", lanes: ["app", "db"] } },
      actors: [
        { name: "利用者", kind: "actor", lane: "web" },
        { name: "注文の処理", kind: "function", lane: "app" },
        { name: "注文の台帳", kind: "storage", lane: "db" },
      ],
      flow: [
        { from: "利用者", to: "注文の処理", label: "注文" },
        { from: "注文の処理", to: "注文の台帳", label: "書き込み" },
      ],
    });
    expect(layout(json).lanes).toEqual(layout(記法).lanes);
  });
});

describe("束ねた縦列が並びどおりでない組 (#1972)", () => {
  for (const type of ["flow", "topology"] as const)
    it(`type: ${type} で間に束ねない縦列を挟むと、間の縦列ごと囲み、挟んだ縦列を知らせる`, () => {
      // 間の縦列の箱を下の段に置く。 束ねた縦列の箱と同じ高さだと、間の縦列を囲まなくても
      // 枠の大きさが同じになり、囲んだかを見分けられない (変異で実測)。 topology は縦列の囲いが
      // 箱より下へ伸びるので、間の縦列の枠そのものを囲むかも分けて見られる
      const 知らせ: CompileNotice[] = [];
      const d = 組む(
        図("web, db", { type }).replace("lane: app }", "lane: app, stack: 2 }"),
        知らせ,
      );
      const 組 = 縦列の枠(d, "group-inside");
      for (const id of ["web", "app", "db"])
        expect(含む(組, 縦列の枠(d, id)), `${id} を囲まない`).toBe(true);
      const 間の箱 = 箱の枠たち(d, ["app"]);
      const 束ねた箱 = 箱の枠たち(d, ["web", "db"]);
      expect(間の箱.length, "間の縦列の箱を測れていない (検査が空振りしている)").toBe(1);
      expect(間の箱[0]!.下, "間の箱が束ねた箱より下にない (前提が崩れた)").toBeGreaterThan(
        Math.max(...束ねた箱.map((b) => b.下)),
      );
      expect(含む(組, 間の箱[0]!), "間の縦列の箱を囲まない").toBe(true);
      const 挟む = 知らせ.filter((n) => n.kind === "group-lanes-apart");
      expect(挟む).toHaveLength(1);
      expect(挟む[0]!.message).toContain('"app"');
      expect(挟む[0]!.actor).toBe("inside");
    });

  it("隣り合う縦列だけを束ねた組では知らせない", () => {
    const 知らせ: CompileNotice[] = [];
    組む(図("app, db"), 知らせ);
    expect(知らせ.filter((n) => n.kind.startsWith("group-"))).toEqual([]);
  });

  it("図に無い縦列を書くと、残りの縦列だけを囲み、無い縦列を知らせる", () => {
    const 知らせ: CompileNotice[] = [];
    const d = 組む(図("app, zz"), 知らせ);
    const 組 = 縦列の枠(d, "group-inside");
    expect(含む(組, 縦列の枠(d, "app"))).toBe(true);
    expect(組.右, "無い縦列の分まで広がった").toBeLessThanOrEqual(縦列の枠(d, "db").x);
    const 無い = 知らせ.filter((n) => n.kind === "group-lane-missing");
    expect(無い).toHaveLength(1);
    expect(無い[0]!.message).toContain('"zz"');
    expect(無い[0]!.message).toContain("残りの縦列だけを囲みます");
  });

  it("束ねる縦列が 1 本も図に無い組は枠を描かず、知らせる", () => {
    const 知らせ: CompileNotice[] = [];
    const d = 組む(図("zz"), 知らせ);
    expect(
      d.lanes.some((l) => l.id === "group-inside"),
      "何も囲まない枠が残った",
    ).toBe(false);
    const 無い = 知らせ.filter((n) => n.kind === "group-lane-missing");
    expect(無い).toHaveLength(1);
    expect(無い[0]!.message).toContain("枠を描きません");
  });

  it("組を書かない図は枠の縦列を持たず、座標を書いた縦列も無い", () => {
    const d = 組む(図(null));
    expect(d.lanes.some((l) => l.id.startsWith("group-"))).toBe(false);
    expect(d.lanes.filter((l) => l.posX !== undefined)).toEqual([]);
  });
});
