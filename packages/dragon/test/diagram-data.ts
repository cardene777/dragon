/**
 * 原本の JSON と記法の見本を読む道具と、最小の図 (#3734)。
 *
 * 件の検査 (`diagram-support.ts` が書き出し直す) と、1 回の実行の準備の段 (`<名前>.prepare.ts`) が共に使う。
 * 準備の段は vitest の件の外で動くので、この file は vitest を読まない。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

// 例の置き場は repo の根 (vitest を回す場所) から引く。
// jsdom の環境で回す検査では `import.meta.url` が `file:` の URL にならず、そこから file を開けないため
const examples = join(process.cwd(), "packages/dragon/examples");

export function exampleText(file: string): string {
  return readFileSync(join(examples, file), "utf8");
}

export function exampleJson(file: string): Json {
  return JSON.parse(exampleText(file)) as Json;
}

/** `base` を写し、`path` の場所を `value` に置き換える。`value` が `undefined` なら欄を消す。 */
export function patched(base: Json, path: (string | number)[], value: Json | undefined): Json {
  const copy = structuredClone(base);
  let node = copy as Record<string | number, Json>;
  for (const key of path.slice(0, -1)) node = node[key] as Record<string | number, Json>;
  const last = path[path.length - 1] as string | number;
  if (value === undefined) delete node[last];
  else node[last] = value;
  return copy;
}

const edge = (from: string, to: string): Json => ({ type: "edge", from, to, carry: { kind: "envelope" } });

/** 共通の骨組みに、時系列図の種類の欄 (生存線) を足した最小の図。線を 4 本持つ。 */
export function smallSequence(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "最小の時系列図",
    boxes: [
      { id: "a", name: "送る側" },
      { id: "b", name: "受ける側" },
    ],
    strip: { title: "持つ値", fields: ["値"] },
    steps: [
      {
        title: "送る",
        body: "送る側が受ける側へ 2 往復する。",
        events: [edge("a", "b"), edge("b", "a"), edge("a", "b"), edge("b", "a")],
      },
    ],
    sequence: { lifelines: ["a", "b"] },
  };
}

/** 区画を持ち、種類の欄を持たない最小の構成図。 */
export function smallArchitecture(): Json {
  return {
    version: 1,
    kind: "architecture",
    title: "最小の構成図",
    regions: [{ id: "r", name: "区画" }],
    boxes: [
      { id: "a", name: "入口", region: "r" },
      { id: "b", name: "出口", region: "r" },
    ],
    steps: [{ title: "流す", body: "入口から出口へ流す。", events: [edge("a", "b")] }],
  };
}
