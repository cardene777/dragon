/**
 * 後から読む種類の部品を、種類の名前で引く1つの口から呼ぶ (#3656)。
 *
 * scriptの1行の入口が最初に読むscriptは、描き分けの本体 (`render/draw.ts`) を持つ。
 * 本体が後から読む種類の並べ方と札の時刻の直しと描き方を種類ごとの分かれ道で呼ぶと、種類を足すたびに最初に読む量が増える。
 * 種類ごとの部品は同じ形の組にして登録簿 (`kinds/registry.ts`) に置き、本体は種類の名前で引いた組を呼ぶ。
 * 回り続ける図と表どうしの関係の図は、札が線を引き始める時に出てその段の終わりに消える時刻の直しを、1つの処理から使う。
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { KindParts } from "../src/kinds/parts";
import type { Layout } from "../src/layout/scene";
import type { DiagramModel } from "../src/schema";
import type { Timeline } from "../src/timeline";

/*
 * 描く部品の元の code を、検査の外 (この file を読む段) で先に読む。
 * 検査の中で初めて読むと、混んだ機械で変換だけで 1 件の上限を超える (#3410)。
 * 全ての種類の部品と読み方は全部入りの入口と同じく読むだけで登録する (`kinds/all`)
 */
const [, registry, { renderDiagram }, { parseNotation }, { kindOf }, cycle, er] = await Promise.all([
  import("../src/kinds/all"),
  import("../src/kinds/registry"),
  import("../src/render/draw"),
  import("../src/parser"),
  import("../src/blocks/used"),
  import("../src/kinds/cycle"),
  import("../src/kinds/er"),
]);

const ROOT = process.cwd();
const SRC = join(ROOT, "packages/dragon/src");
const EXAMPLES = join(ROOT, "packages/dragon/examples");

/** 後から読む種類。登録簿の並びから引き、手で並べない */
const LATER = [...registry.LATER_KINDS];

/** 種類ごとに、その種類で書いた最初の日本語の見本。見本の最初の行の頭の語から導く */
const SAMPLES: Readonly<Record<string, string>> = Object.fromEntries(
  readdirSync(EXAMPLES)
    .filter((file) => file.endsWith(".dragon") && !file.endsWith(".en.dragon"))
    .sort()
    .map((file) => [kindOf(readFileSync(join(EXAMPLES, file), "utf8")), file] as const)
    .reverse(),
);

/** 部品を1つも持たない置き場所。試しの種類の並べ方が返し、描き分けの本体の共通の描き方だけを通す */
const emptyLayout = (kind: Layout["kind"]): Layout => ({
  kind,
  width: 120,
  height: 80,
  regions: [],
  boxes: [],
  lifelines: [],
  edges: [],
  labels: [],
  actions: [],
  badges: [],
  paths: [],
  ends: [],
});

/** 呼ばれた部品の名前を `calls` に残す、試しの種類の部品の組。描いた物と見た目の規則に種類の名前を入れる */
const probeParts = (calls: string[]): KindParts => ({
  layout: (diagram: DiagramModel) => {
    calls.push("layout");
    return emptyLayout(diagram.kind);
  },
  times: (_diagram: DiagramModel, timeline: Timeline) => {
    calls.push("times");
    return { ...timeline };
  },
  draw: (layout: Layout) => {
    calls.push("draw");
    return { base: `<g data-probe="${layout.kind}"/>`, css: `.dg-probe-${layout.kind}{}` };
  },
});

/** 描いた SVG か、描けずに止まった時の誤りの文 */
function drawOrError(file: string): string {
  const parsed = parseNotation(readFileSync(join(EXAMPLES, file), "utf8"));
  if (!parsed.ok) return `読めない: ${parsed.errors.map((e) => e.message).join(" / ")}`;
  try {
    return renderDiagram(parsed.diagram).svg;
  } catch (error) {
    return `描けない: ${(error as Error).message}`;
  }
}

describe("描き分けの本体は登録簿から種類の名前で部品を引く (#3656)", () => {
  describe.for(LATER)("%s", (kind) => {
    it("registered-kind-draws-without-a-branch", () => {
      // 走査の空振りを避ける。後から読む種類は全て、日本語の見本を持つ
      expect(SAMPLES[kind], `${kind} で書いた見本`).toBeDefined();
      // 原本の形の検査は種類の名前を限るので、試しの種類は登録簿の中身だけを差し替えて、今ある種類の名前で置く
      const name = kind as Parameters<typeof registry.registerKind>[0];
      const real = registry.kindParts(name);
      const calls: string[] = [];
      registry.registerKind(name, { parts: probeParts(calls) } as never);
      try {
        const svg = drawOrError(SAMPLES[kind] as string);
        expect(svg, `${kind} の試しの部品の描いた物が SVG に無い`).toContain(`<g data-probe="${kind}"/>`);
        expect(svg, `${kind} の試しの部品の見た目の規則が SVG に無い`).toContain(`.dg-probe-${kind}{}`);
        expect(calls, `${kind} の試しの部品を呼んだ順`).toEqual(["layout", "times", "draw"]);
      } finally {
        registry.registerKind(name, real);
      }
    });
  });

  it("draw-names-no-later-kind", () => {
    // 注釈は種類の名前を書いてよいので外す。`//` は字の中の URL (`http://`) を残すため、行の頭か空白の後の物だけを注釈とみなす
    const code = readFileSync(join(SRC, "render/draw.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//gu, "")
      .replace(/(^|\s)\/\/.*$/gmu, "$1");
    const named = [...code.matchAll(new RegExp(`(["'\`])(${LATER.join("|")})\\1`, "gu"))].map((m) => m[0]);
    expect(named, "描き分けの本体が字で並べた、後から読む種類の名前").toEqual([]);
  });

  it("cycle-and-er-share-one-carrier-timing", () => {
    const cycleTimes = (cycle as { parts?: KindParts }).parts?.times;
    const erTimes = (er as { parts?: KindParts }).parts?.times;
    expect(cycleTimes, "回り続ける図の部品の組が持つ札の時刻の直し").toBeTypeOf("function");
    expect(erTimes, "表どうしの関係の図の札の時刻の直しが、回り続ける図と同じ処理").toBe(cycleTimes);
    if (!cycleTimes) return;
    // 札は線を引き始める時に出て、段の終わりに消える。段の終わりより後に着く札は着いた時に消える
    const steps = [{ start: 0, end: 3 }];
    const carriers = [
      { step: 0, event: 0, who: "main" as const, depart: 1, arrive: 2, start: 0, end: 5 },
      { step: 0, event: 1, who: "coin" as const, depart: 2, arrive: 4, start: 2, end: 6 },
    ];
    const timed = cycleTimes({} as DiagramModel, { steps, carriers } as unknown as Timeline);
    expect(timed.carriers.map(({ start, end }) => [start, end]), "直した札の見えている間").toEqual([
      [1, 3],
      [2, 4],
    ]);
  });
});
