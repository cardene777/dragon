/**
 * catalog primitives の source 記法 pair (sourceYaml__* / sourceJson__*) の回帰 test。
 *
 * catalog UI の YAML / JSON tab は、 primitives.cdl.ts / primitives-extra.cdl.ts が export する
 * `sourceYaml__<key>` / `sourceJson__<key>` の suffix pair convention に依存する。
 * 図を足して source を書き忘れる / JSON を壊す事故を防ぐため、 以下を固定する。
 *
 * 1. 全 diagram に YAML / JSON pair が揃っている (missing / orphan ゼロ)
 * 2. 各 JSON source が JSON.parse できる
 * 3. 各 JSON source が validateDragonJson を通る
 * 4. YAML / JSON source がどちらも CdlDiagram になり、対応 scene と同じ段を持つ
 * 5. JSON の actor kind が対応する diagram の node kind と一致する
 */
import { describe, it, expect } from "vitest";
import { validateDragonJson, jsonToDiagram, textDslToDiagram } from "../src/index";
import * as PrimExtMod from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as PrimMod from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";

type AnyRecord = Record<string, unknown>;

/**
 * 2 module を 1 つに畳んで見る。 catalog はこの 2 つを 1 ページ (`primitives`) に並べる。
 *
 * **畳むと同名の export が片方に潰れる**。 潰れた側は検査を素通りするので、
 * 衝突が無いことを下の検査で固定する (`catalog-source-parity.test.tsx` も同じ理由で
 * ページをまたぐ同名を落としている)。
 */
const mod: AnyRecord = { ...PrimMod, ...PrimExtMod };

type SceneDiagram = {
  nodes: Array<{ id: string; title?: string }>;
  phases: Array<{ title?: string; activate?: string[] }>;
};

/** 経路ごとに異なる node id を、画面で同じ意味を持つ actor 名へ戻す。 */
function activatedActors(diagram: SceneDiagram, phase: SceneDiagram["phases"][number]): string[] {
  const names = new Map(diagram.nodes.map((node) => [node.id, node.title ?? node.id]));
  return (phase.activate ?? []).map((id) => names.get(id) ?? `<unknown:${id}>`).sort();
}

/**
 * 図の export key 一覧 (種類を問わない、#1376)。
 *
 * **記法を持つのは `scene*` だけではなくなった**。 2 module に分かれたこのページの
 * 110 件すべてを集めないと、非 scene や primitives-extra の壊れた記法が検査を素通りする。
 */
function diagramKeys(): string[] {
  return Object.entries(mod)
    .filter(([, v]) => v && typeof v === "object" && "nodes" in (v as AnyRecord))
    .map(([k]) => k);
}

/** scene diagram の export key 一覧 (`scene` prefix + diagram object) */
function sceneKeys(): string[] {
  return Object.entries(mod)
    .filter(
      ([k, v]) =>
        k.startsWith("scene") && v && typeof v === "object" && "nodes" in (v as AnyRecord),
    )
    .map(([k]) => k);
}

function sourceKeys(prefix: "sourceYaml__" | "sourceJson__"): string[] {
  return Object.entries(mod)
    .filter(([k, v]) => k.startsWith(prefix) && typeof v === "string")
    .map(([k]) => k.slice(prefix.length));
}

describe("catalog source pairs (YAML / JSON tab の供給元)", () => {
  it("scene が 1 件以上 export されている (import 経路の健全性)", () => {
    expect(sceneKeys().length).toBeGreaterThan(0);
  });

  it("2 module に同名の export が無い (畳んだ時に潰れない)", () => {
    // 畳む形にした以上、同名があると片方が黙って消えて検査を素通りする
    const 片方 = new Set(Object.keys(PrimMod as unknown as AnyRecord));
    const 衝突 = Object.keys(PrimExtMod as unknown as AnyRecord).filter((k) => 片方.has(k));
    expect(
      片方.size,
      "primitives を 1 件も集められていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
    expect(衝突, "primitives と primitives-extra で export 名が重複している").toEqual([]);
  });

  it("全 diagram に sourceYaml pair がある (missing ゼロ)", () => {
    const yamls = new Set(sourceKeys("sourceYaml__"));
    const missing = diagramKeys().filter((k) => !yamls.has(k));
    expect(missing).toEqual([]);
  });

  it("全 diagram に sourceJson pair がある (missing ゼロ)", () => {
    const jsons = new Set(sourceKeys("sourceJson__"));
    const missing = diagramKeys().filter((k) => !jsons.has(k));
    expect(missing).toEqual([]);
  });

  it("source pair に orphan がない (図の削除後の残骸検知)", () => {
    // **判定は図の有無で行う** (#1376)。 `scene*` に限ると、種別 / 縦列 / 段 / 図形の
    // 見本に足した記法が残骸として落ちる
    const 図 = new Set(diagramKeys());
    expect(図.size, "図を 1 件も集められていない (検査が空振りしている)").toBeGreaterThan(0);
    const orphanYaml = sourceKeys("sourceYaml__").filter((k) => !図.has(k));
    const orphanJson = sourceKeys("sourceJson__").filter((k) => !図.has(k));
    expect(orphanYaml).toEqual([]);
    expect(orphanJson).toEqual([]);
  });

  it("全 sourceJson が JSON.parse + validateDragonJson + jsonToDiagram を通る", () => {
    const failures: string[] = [];
    for (const key of diagramKeys()) {
      const raw = mod[`sourceJson__${key}`];
      if (typeof raw !== "string") {
        failures.push(`${key}: sourceJson missing`);
        continue;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        failures.push(`${key}: JSON.parse failed (${(e as Error).message})`);
        continue;
      }
      const v = validateDragonJson(parsed);
      if (!v.ok) {
        failures.push(`${key}: validate failed (${v.errors.map((e) => e.path).join(",")})`);
        continue;
      }
      const diagram = jsonToDiagram(parsed);
      if (!diagram.nodes.length) failures.push(`${key}: jsonToDiagram produced 0 nodes`);
    }
    expect(failures).toEqual([]);
  });

  it("sourceJson の actor kind が対応 diagram の node kind と一致する", () => {
    const failures: string[] = [];
    for (const key of diagramKeys()) {
      const raw = mod[`sourceJson__${key}`];
      if (typeof raw !== "string") continue;
      const parsed = JSON.parse(raw) as { actors: { name: string; kind?: string }[] };
      const diagram = mod[key] as { nodes: { title?: string; kind: string }[] };

      const diagramKinds = new Set(diagram.nodes.map((n) => n.kind));
      for (const a of parsed.actors) {
        if (!a.kind) continue;
        if (!diagramKinds.has(a.kind)) {
          failures.push(`${key}: actor "${a.name}" kind "${a.kind}" not in diagram kinds`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("sourceYaml が空文字でなく title / actors / flow の 3 block を含む", () => {
    const failures: string[] = [];
    for (const key of sceneKeys()) {
      const yaml = mod[`sourceYaml__${key}`];
      if (typeof yaml !== "string" || yaml.trim().length === 0) {
        failures.push(`${key}: sourceYaml empty`);
        continue;
      }
      for (const block of ["title:", "actors:", "flow:"]) {
        if (!yaml.includes(block)) failures.push(`${key}: sourceYaml missing "${block}"`);
      }
    }
    expect(failures).toEqual([]);
  });
});

/**
 * 段まで一致することを見る (#1192)。
 *
 * 既存の検査は actors / flow だけを突き合わせていたため、図の段を割った時に source 側が
 * 1 段のまま取り残されても通っていた (実際に起きた)。 画面は source を「この記法で この図に
 * なる」 として見せるので、段がずれると嘘になる。
 */
describe("source の段が図の段と一致する (#1192)", () => {
  const 場面 = sceneKeys().filter((k) => k.startsWith("scene"));

  it("対象が 30 件ある", () => {
    expect(場面.length).toBe(30);
  });

  it("YAML / JSON source から作った図の段が、catalog の図の段と一致する", () => {
    const 違う: string[] = [];
    for (const key of 場面) {
      const 図 = mod[key] as SceneDiagram;
      const sources = [
        ["YAML", mod[`sourceYaml__${key}`], (src: string) => textDslToDiagram(src)],
        ["JSON", mod[`sourceJson__${key}`], (src: string) => jsonToDiagram(JSON.parse(src))],
      ] as const;
      for (const [形式, src, compile] of sources) {
        if (typeof src !== "string") {
          違う.push(`${key}: ${形式} source が無い`);
          continue;
        }
        const 作った = compile(src) as unknown as SceneDiagram;
        if (作った.phases.length !== 図.phases.length) {
          違う.push(`${key}/${形式}: 段の数 ${作った.phases.length} ≠ ${図.phases.length}`);
          continue;
        }
        for (const [i, p] of 図.phases.entries()) {
          const q = 作った.phases[i]!;
          if (q.title !== p.title)
            違う.push(`${key}/${形式}[${i}]: 題 "${q.title}" ≠ "${p.title}"`);
          const 実際 = activatedActors(作った, q);
          const 期待 = activatedActors(図, p);
          if (実際.join("\0") !== 期待.join("\0")) {
            違う.push(`${key}/${形式}[${i}]: 光る箱 ${実際.join(", ")} ≠ ${期待.join(", ")}`);
          }
        }
      }
    }
    expect(違う, `source と図の段が食い違う:\n${違う.slice(0, 8).join("\n")}`).toHaveLength(0);
  });
});
