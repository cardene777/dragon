import { CdlDiagramView } from "@cardenelabs/cdl";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { compileToCdl, type CompileNotice } from "../src/compile";
import { parseTextDslV05 } from "../src/v05/parser";

function 組み立てる(source: string): {
  diagram: ReturnType<typeof compileToCdl>;
  markup: string;
  notices: CompileNotice[];
} {
  const parsed = parseTextDslV05(source);
  if (!parsed.ok) throw new Error(parsed.errors.map((error) => `${error.message} ${error.hint ?? ""}`).join("\n"));
  const notices: CompileNotice[] = [];
  const diagram = compileToCdl(parsed.doc, { onNotice: (notice) => notices.push(notice) });
  return {
    diagram,
    markup: renderToStaticMarkup(createElement(CdlDiagramView, { diagram })),
    notices,
  };
}

const 本文 = (actors: string, extra = "", flow = '  - 受付 -> 完了: "渡す"'): string => `title: "申請の流れ"
shape: stages
type: swimlane
${extra}actors:
${actors}
flow:
${flow}
`;

/** 段階の列の面を数える。列は `stage-` で始まる縦列の中にだけ描かれる (#2831) */
const 段階の箱の数 = (markup: string): number =>
  (
    markup.match(
      /<g data-cdl-lane="stage-[^"]+" data-cdl-lane-x=[^>]*>[\s\S]*?<rect data-cdl-role="stage-column"/g,
    ) ?? []
  ).length;
const 役割の数 = (markup: string, role: string): number =>
  (markup.match(new RegExp(`data-cdl-role="${role}"`, "g")) ?? []).length;
/** 指定した role の字を書いた順に並べる */
const 役割の字 = (markup: string, role: string): string[] =>
  [...markup.matchAll(new RegExp(`<text data-cdl-role="${role}"[^>]*>([^<]*)</text>`, "g"))].map(
    (match) => match[1] ?? "",
  );

/** 線の id ごとに、描く側が決めた道筋 (`data-cdl-path-d`) を引く */
function 線の道筋(markup: string): Map<string, string> {
  return new Map(
    [...markup.matchAll(/<g data-cdl-edge="([^"]+)"[^>]*\sdata-cdl-path-d="([^"]+)"/g)].map((match) => [
      match[1] ?? "",
      match[2] ?? "",
    ]),
  );
}

/** 道筋の座標を x と y の組に分ける。曲線の制御点も含む */
function 道筋の点(d: string): Array<{ x: number; y: number }> {
  const 数 = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  const 点: Array<{ x: number; y: number }> = [];
  for (let index = 0; index + 1 < 数.length; index += 2) 点.push({ x: 数[index]!, y: 数[index + 1]! });
  return 点;
}

/** 列の面の位置と大きさ */
function 列の面(markup: string): Array<{ x: number; y: number; width: number; height: number }> {
  return [...markup.matchAll(/<rect data-cdl-role="stage-column"([^>]*)>/g)].map((match) => {
    const 属性 = (name: string): number => Number(new RegExp(`\\s${name}="([^"]+)"`).exec(match[1] ?? "")?.[1]);
    return { x: 属性("x"), y: 属性("y"), width: 属性("width"), height: 属性("height") };
  });
}

describe("段階ごとの箱を並べる泳法図 (#2797)", () => {
  it("英語の stage を縦に書いた数だけ段階の箱を作る", () => {
    const { markup } = 組み立てる(
      本文(`  - 受付:
    stage: 申請
    lane: front
  - 確認:
    stage: 審査
    lane: review
  - 完了:
    stage: 完了
    lane: front`),
    );
    expect(段階の箱の数(markup)).toBe(3);
  });

  it("和名の 段階 を縦に書いた数だけ段階の箱を作る", () => {
    const { markup } = 組み立てる(
      本文(`  - 受付:
    段階: 申請
    lane: front
  - 確認:
    段階: 審査
    lane: review
  - 完了:
    段階: 完了
    lane: front`),
    );
    expect(段階の箱の数(markup)).toBe(3);
  });

  it("中括弧の stage と 段階 を読める", () => {
    const { markup } = 組み立てる(
      本文(`  - 受付: { stage: 申請, lane: front }
  - 確認: { 段階: 審査, lane: review }
  - 完了: { stage: 完了, lane: front }`),
    );
    expect(段階の箱の数(markup)).toBe(3);
  });

  it("札の右へ宣言した担当名を添える", () => {
    const { diagram, markup } = 組み立てる(
      本文(
        `  - 受付: { stage: 申請, lane: front }
  - 入力: { stage: 申請, lane: front }
  - 確認: { stage: 申請, lane: review }
  - 完了: { stage: 完了, lane: front }`,
        `lanes:
  front: { label: 窓口 }
  review: { label: 審査係 }
`,
        '  - 受付 -> 入力: "書く"\n  - 入力 -> 確認: "渡す"\n  - 確認 -> 完了: "返す"',
      ),
    );
    expect(diagram.nodes.map((node) => [node.title, node.subtitle])).toEqual([
      ["受付", "窓口"],
      ["入力", "窓口"],
      ["確認", "審査係"],
      ["完了", "窓口"],
    ]);
    expect(役割の字(markup, "stage-note")).toEqual(["窓口", "窓口", "審査係", "窓口"]);
    // 担当は列の見出しへまとめず、札ごとに右へ添える (#2831)
    expect(diagram.lanes.every((lane) => lane.label === undefined)).toBe(true);
    expect(役割の数(markup, "lane-label")).toBe(0);
  });

  it("stack を書いた列は書いた段を使い、書かない列は左の列から真横に入る段に置く", () => {
    const { diagram } = 組み立てる(
      本文(
        `  - 後: { stage: 申請, lane: front, stack: 1 }
  - 先: { stage: 申請, lane: front, stack: 0 }
  - 完了: { stage: 完了, lane: front }`,
        "",
        '  - 先 -> 後: "続ける"\n  - 後 -> 完了: "渡す"',
      ),
    );
    // 完了の列は段を書いていないので、入ってくる「後」と同じ段 1 に置いて線を真横に通す (#2831)
    expect(diagram.nodes.map((node) => [node.title, node.stack])).toEqual([
      ["後", 1],
      ["先", 0],
      ["完了", 1],
    ]);
  });

  it("stage が無い箱は lane と箱名を段階に使い、知らせを図全体で1件だけ出す", () => {
    const { diagram, markup, notices } = 組み立てる(
      本文(`  - 受付: { lane: front }
  - 確認: { lane: review }
  - 完了`),
    );
    expect(段階の箱の数(markup)).toBe(3);
    expect(diagram.lanes.map((lane) => lane.stage?.name)).toEqual(["front", "review", "完了"]);
    // 担当を段階に使った札は、見出しと同じ字を右に重ねない
    expect(diagram.nodes.map((node) => node.subtitle)).toEqual([undefined, undefined, undefined]);
    const fallback = notices.filter((notice) => (notice.kind as string) === "stage-from-lane");
    expect(fallback).toHaveLength(1);
    expect(fallback[0]?.message).toContain("受付");
    expect(fallback[0]?.message).toContain("確認");
    expect(fallback[0]?.message).toContain("完了");
  });

  it("stage が1つも無い時は同じ担当の箱を同じ段階へまとめる", () => {
    const { diagram, markup, notices } = 組み立てる(
      本文(
        `  - 受付: { lane: front }
  - 入力: { lane: front }
  - 確認: { lane: review }`,
        "",
        '  - 受付 -> 入力: "書く"\n  - 入力 -> 確認: "渡す"',
      ),
    );
    expect(段階の箱の数(markup)).toBe(2);
    expect(diagram.lanes.map((lane) => lane.stage?.name)).toEqual(["front", "review"]);
    expect(notices.filter((notice) => notice.kind === "stage-from-lane")).toHaveLength(1);
  });

  it("animation があっても段階の箱の数を保つ", () => {
    const { markup } = 組み立てる(
      本文(
        `  - 受付: { stage: 申請, lane: front }
  - 確認: { stage: 審査, lane: review }
  - 完了: { stage: 完了, lane: front }`,
        `animation:
  - step: "受け付ける" 1s
    focus: [受付]
  - step: "確認する" 1s
    focus: [確認]
`,
      ),
    );
    expect(段階の箱の数(markup)).toBe(3);
  });

  it("lanes は担当の宣言に使い、空の縦列を増やさない", () => {
    const { diagram, markup, notices } = 組み立てる(
      本文(
        `  - 受付: { stage: 申請, lane: front }
  - 確認: { stage: 審査, lane: review }
  - 完了: { stage: 完了, lane: front }`,
        `lanes:
  front: { label: 窓口 }
  review: { label: 審査係 }
`,
      ),
    );
    expect(段階の箱の数(markup)).toBe(3);
    expect(diagram.lanes).toHaveLength(3);
    expect(diagram.lanes.every((lane) => lane.id.startsWith("stage-"))).toBe(true);
    expect(notices.filter((notice) => notice.kind === "lane-declared-empty")).toEqual([]);
  });

  it("direction は配置を変えず、向きの知らせを1件だけ出す", () => {
    const { markup, notices } = 組み立てる(
      本文(
        `  - 受付: { stage: 申請, lane: front }
  - 確認: { stage: 審査, lane: review }
  - 完了: { stage: 完了, lane: front }`,
        "direction: 縦\n",
      ),
    );
    expect(段階の箱の数(markup)).toBe(3);
    expect(
      notices.filter((notice) =>
        ["direction-not-honored", "direction-same-as-default"].includes(notice.kind),
      ),
    ).toHaveLength(1);
  });

  it("段階をまたぐ線だけを curve にし、段が違う時は3次曲線で描く", () => {
    const { diagram, markup } = 組み立てる(
      本文(
        `  - 受付: { stage: 申請, lane: front }
  - 入力: { stage: 申請, lane: front }
  - 確認: { stage: 審査, lane: review }
  - 差し戻す: { stage: 審査, lane: review }`,
        `animation:
  - step: "確認する" 1s
    focus: [受付, 入力, 確認]
`,
        '  - 受付 -> 入力: "書く"\n  - 入力 -> 確認: "渡す"\n  - 受付 -> 差し戻す: "戻す"',
      ),
    );
    expect(diagram.edges.map((edge) => edge.routing)).toEqual([undefined, "curve", "curve"]);
    const paths = 線の道筋(markup);
    expect(paths.size).toBe(3);
    // 列の中は真下、段が同じ列間は真横、段が違う列間は3次曲線
    expect(paths.get("e0-受付-入力")).not.toMatch(/\bC\b/);
    expect(paths.get("e1-入力-確認")).not.toMatch(/\bC\b/);
    expect(paths.get("e2-受付-差し戻す")).toMatch(/\bC\b/);
  });

  it("段階の列と見出しと札の右の字に描画側の role が付き、縦列の囲みを残さない", () => {
    const { markup } = 組み立てる(
      本文(`  - 受付: { stage: 申請, lane: front }
  - 完了: { stage: 完了, lane: front }`),
    );
    expect(役割の数(markup, "stage-column")).toBe(2);
    expect(役割の数(markup, "stage-number")).toBe(2);
    expect(役割の数(markup, "stage-name")).toBe(2);
    expect(役割の数(markup, "stage-note")).toBe(2);
    expect(役割の数(markup, "lane-container")).toBe(0);
    expect(役割の数(markup, "lane-label")).toBe(0);
  });

  it.each([
    ["flow", "stage: 申請"],
    ["swimlane", "stage: 申請"],
  ])("stage が効かない %s では箱の欄の知らせに段階を出す", (type, field) => {
    const source = `title: "効かない段階"
type: ${type}
actors:
  - 受付:
    ${field}
  - 完了
flow:
  - 受付 -> 完了: "渡す"
`;
    const { notices } = 組み立てる(source);
    const actorNotices = notices.filter((notice) => notice.kind === "actor-option-not-honored");
    expect(actorNotices).toHaveLength(1);
    expect(actorNotices[0]?.message).toContain("段階");
  });
});

describe("段の箱を見本と同じ段階の列で描く (#2831)", () => {
  const 宅配 = (書き方: "stage" | "段階" = "stage"): string => `title: "荷物を届ける"
type: swimlane
shape: stages
lanes:
  shipper: { label: 荷主 }
  office: { label: 営業所 }
  courier: { label: 配送便 }
actors:
  - 始まり: { kind: mark-start, lane: shipper }
  - 集荷を頼む: { ${書き方}: 申し込み, lane: shipper }
  - 受け付ける: { ${書き方}: 受付, lane: office }
  - 送り状を起こす: { ${書き方}: 受付, lane: office }
  - 便に積む: { ${書き方}: 配送, lane: courier }
  - 届けに行く: { ${書き方}: 配送, lane: courier }
  - 在宅?: { kind: decision, ${書き方}: 配送, lane: courier }
  - 受け取る: { ${書き方}: 結果, lane: shipper }
  - 持ち戻る: { ${書き方}: 結果, lane: courier }
  - 終わり: { kind: mark-end, lane: shipper }
flow:
  - 始まり -> 集荷を頼む
  - 集荷を頼む -> 受け付ける
  - 受け付ける -> 送り状を起こす
  - 送り状を起こす -> 便に積む
  - 便に積む -> 届けに行く
  - 届けに行く -> 在宅?
  - 在宅? -> 受け取る: "はい"
  - 在宅? -> 持ち戻る: "いいえ"
  - 持ち戻る -> 便に積む: "翌日もう一度" (dashed)
  - 受け取る -> 終わり
`;
  const { diagram, markup, notices } = 組み立てる(宅配());

  it("列が4本、見出しが4組、札が8つ、札の右の字が8つあり、菱形と始まりと終わりの印が無い", () => {
    expect(役割の数(markup, "stage-column")).toBe(4);
    expect(役割の字(markup, "stage-number")).toEqual(["段階 1", "段階 2", "段階 3", "段階 4"]);
    expect(役割の字(markup, "stage-name")).toEqual(["申し込み", "受付", "配送", "結果"]);
    expect((markup.match(/<g data-cdl-node="[^"]+" data-cdl-kind="card"/g) ?? []).length).toBe(8);
    expect(役割の字(markup, "stage-note")).toEqual([
      "荷主",
      "営業所",
      "営業所",
      "配送便",
      "配送便",
      "分かれ道",
      "荷主",
      "配送便",
    ]);
    expect(markup).not.toContain('data-cdl-kind="decision"');
    expect(markup).not.toContain('data-cdl-mark="start"');
    expect(markup).not.toContain('data-cdl-mark="end"');
    expect(notices).toEqual([]);
  });

  it("4本の列の上端と高さが同じで、札が列の面に収まる", () => {
    const 列 = 列の面(markup);
    expect(列).toHaveLength(4);
    expect(new Set(列.map((面) => 面.y)).size).toBe(1);
    expect(new Set(列.map((面) => 面.height)).size).toBe(1);
    expect(列.slice(1).map((面, index) => 面.x - (列[index]!.x + 列[index]!.width))).toEqual([
      64, 64, 64,
    ]);
    const 札 = [
      ...markup.matchAll(
        /<g data-cdl-node="([^"]+)"[^>]*\sdata-cdl-cx="([^"]+)" data-cdl-cy="([^"]+)" data-cdl-w="([^"]+)" data-cdl-h="([^"]+)"/g,
      ),
    ];
    expect(札).toHaveLength(8);
    for (const [, id, cx, cy, w, h] of 札) {
      const 左 = Number(cx) - Number(w) / 2;
      const 上 = Number(cy) - Number(h) / 2;
      const 面 = 列.find((候補) => 候補.x <= 左 && 左 + Number(w) <= 候補.x + 候補.width);
      expect(面, `${id} を収める列が無い`).toBeDefined();
      expect(左 - 面!.x, `${id} の左の余白`).toBe(32);
      expect(面!.x + 面!.width - (左 + Number(w)), `${id} の右の余白`).toBe(32);
      expect(上, `${id} が列の上端より上にある`).toBeGreaterThanOrEqual(面!.y);
      expect(上 + Number(h), `${id} が列の下端からはみ出す`).toBeLessThanOrEqual(面!.y + 面!.height);
    }

    // 「いいえ」の線の札は、描かれた位置で列 4 の内側に収める。
    const いいえ = /<g transform="translate\([^ ]+ ([^)]+)\)" data-cdl-edge-label-for="e6-在宅-持ち戻る"[^>]*><rect data-cdl-role="edge-label-bg"[^>]*\sy="([^"]+)"[^>]*\sheight="([^"]+)"/.exec(markup);
    expect(いいえ, "いいえ の線の札").not.toBeNull();
    const 結果の列 = 列[3]!;
    const いいえの線 = diagram.edges.find((edge) => edge.id === "e6-在宅-持ち戻る");
    expect(いいえの線?.labelOffsetY).toBe(36);
    const 札の中心 = Number(いいえ?.[1]);
    const 札の上端 = 札の中心 + Number(いいえ?.[2]);
    const 札の下端 = 札の中心 + Number(いいえ?.[2]) + Number(いいえ?.[3]);
    expect(札の上端).toBeGreaterThanOrEqual(結果の列.y);
    expect(札の下端).toBeLessThanOrEqual(結果の列.y + 結果の列.height);

    const 最初の札の上端 = Math.min(...札.map(([, , , cy, , h]) => Number(cy) - Number(h) / 2));
    expect(最初の札の上端 - 列[0]!.y, "列の上端から 1 段目まで").toBe(170);
  });

  it("高さ48の札で名前と右の字を上下の中央へ置く", () => {
    const center = Number(/data-cdl-node="集荷を頼む"[^>]*\sdata-cdl-cy="([^"]+)"/.exec(markup)?.[1]);
    const title = /<g transform="translate\([^ ]+ ([^)]+)\)"><rect data-cdl-role="node-body"[^>]*\sheight="48"[^>]*><\/rect><text data-cdl-role="node-label"[^>]*\sy="([^"]+)"[^>]*>集荷を頼む<\/text>/.exec(markup);
    const note = Number(/<text data-cdl-role="stage-note" data-cdl-stage-node="集荷を頼む"[^>]*\sy="([^"]+)"/.exec(markup)?.[1]);
    expect(Number(title?.[1]) + Number(title?.[2]) - center).toBe(8);
    expect(note - center).toBe(1);
  });

  it("札の名前と右の字を重ねずに 268 の幅へ収める", () => {
    const 右の字を持つ札 = diagram.nodes.filter(
      (node): node is (typeof diagram.nodes)[number] & { subtitle: string } =>
        node.subtitle !== undefined,
    );
    expect(右の字を持つ札.length).toBeGreaterThan(0);

    for (const node of 右の字を持つ札) {
      const geometry = new RegExp(
        `<g data-cdl-node="${node.id}"[^>]*\\sdata-cdl-cx="([^"]+)"[^>]*\\sdata-cdl-w="([^"]+)"`,
      ).exec(markup);
      const title = new RegExp(
        `<text data-cdl-role="node-label" x="([^"]+)"[^>]*font-size="([^"]+)"[^>]*>${node.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</text>`,
      ).exec(markup);
      const note = new RegExp(
        `<text data-cdl-role="stage-note" data-cdl-stage-node="${node.id}" x="([^"]+)"[^>]*font-size="([^"]+)"[^>]*>${node.subtitle}</text>`,
      ).exec(markup);
      expect(geometry, `${node.title} の札`).not.toBeNull();
      expect(title, `${node.title} の名前`).not.toBeNull();
      expect(note, `${node.title} の右の字`).not.toBeNull();

      const cardWidth = Number(geometry?.[2]);
      const cardLeft = Number(geometry?.[1]) - cardWidth / 2;
      const titleRight = cardLeft + Number(title?.[1]) + [...node.title].length * Number(title?.[2]);
      const noteLeft = Number(note?.[1]) - [...node.subtitle].length * Number(note?.[2]);
      expect(cardWidth, `${node.title} の札幅`).toBe(268);
      expect(titleRight, `${node.title} の名前が右の字へ重なる`).toBeLessThan(noteLeft);
    }
  });

  it("札は見本と同じ段に積み、列をまたいで真横に渡れる線を曲げない", () => {
    expect(diagram.nodes.map((node) => [node.title, node.stack])).toEqual([
      ["集荷を頼む", 0],
      ["受け付ける", 0],
      ["送り状を起こす", 1],
      ["便に積む", 1],
      ["届けに行く", 2],
      ["在宅?", 3],
      ["受け取る", 2],
      ["持ち戻る", 3],
    ]);
  });

  it("列の中の線は真下へ、列をまたぐ線は曲線で、段が違えば3次曲線で描く", () => {
    const paths = 線の道筋(markup);
    for (const id of ["e1-受け付ける-送り状を起こす", "e3-便に積む-届けに行く", "e4-届けに行く-在宅"]) {
      const d = paths.get(id);
      expect(d, id).toBeDefined();
      expect(d, id).not.toMatch(/[CQ]/);
      expect(new Set(道筋の点(d ?? "").map((点) => 点.x)).size, `${id} が真下へ下りていない`).toBe(1);
    }
    for (const id of ["e0-集荷を頼む-受け付ける", "e2-送り状を起こす-便に積む", "e5-在宅-受け取る", "e6-在宅-持ち戻る"]) {
      expect(diagram.edges.find((edge) => edge.id === id)?.routing, id).toBe("curve");
    }
    expect(paths.get("e5-在宅-受け取る")).toMatch(/\bC\b/);
    expect(new Set(道筋の点(paths.get("e6-在宅-持ち戻る") ?? "").map((点) => 点.y)).size).toBe(1);
  });

  it("前の段へ戻る点線は列の見出しより上を通る", () => {
    const 戻り線 = diagram.edges.find((edge) => edge.id === "e7-持ち戻る-便に積む");
    expect(戻り線).toMatchObject({ routing: "back-detour", style: "dashed", label: "翌日もう一度" });
    const 列の上端 = Math.min(...列の面(markup).map((面) => 面.y));
    const 点 = 道筋の点(線の道筋(markup).get("e7-持ち戻る-便に積む") ?? "");
    expect(点.length).toBeGreaterThan(0);
    expect(Math.min(...点.map((p) => p.y))).toBeLessThan(列の上端);
  });

  it("stage と 段階 のどちらで書いても列の順と札の順と札の右の字が同じになる", () => {
    const 形 = (doc: ReturnType<typeof compileToCdl>) => ({
      lanes: doc.lanes.map((lane) => [lane.id, lane.stage]),
      nodes: doc.nodes.map((node) => [node.id, node.lane, node.stack, node.kind, node.subtitle]),
      edges: doc.edges.map((edge) => [edge.id, edge.routing]),
    });
    expect(形(組み立てる(宅配("段階")).diagram)).toEqual(形(diagram));
  });

  it("書いた種類は札で固定し、効かないことを知らせる", () => {
    const { diagram: 書いた, notices: 知らせ } = 組み立てる(
      本文(`  - 受付: { stage: 申請, lane: front, kind: service }
  - 完了: { stage: 完了, lane: front }`),
    );
    expect(書いた.nodes.map((node) => node.kind)).toEqual(["card", "card"]);
    const 種類 = 知らせ.filter((notice) => notice.kind === "actor-option-not-honored");
    expect(種類).toHaveLength(1);
    expect(種類[0]?.actor).toBe("受付");
    expect(種類[0]?.hint).toContain("card で固定");
  });
});
