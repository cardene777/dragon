/**
 * 時系列図でよく描く形の見本 4 つ (#3167)。
 *
 * API の往復 (`api`)、失敗とやり直し (`retry`)、支払いと後から届く知らせ (`payment`)、ウォレットの署名 (`wallet`) を、
 * `packages/dragon/examples` に日本語と英語の記法と、その記法から作った原本の JSON で置く。
 * 各見本は主に見せる部品の語を使う。どの語を使ったかは記法の字ではなく、記法から作った原本の JSON の形で数える。
 * file が無い間も、この file を読み込んだ所で落とさず、無い file を名指して落とす。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Diagram } from "../src/schema";
import { api } from "./diagram-support";

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

/** 足す見本。並びは見本帳の時系列図の頁の並び */
const ADDED = ["api", "retry", "payment", "wallet"] as const;
type Added = (typeof ADDED)[number];

/** 見本の file の中身。無ければ `undefined` */
const fileText = (name: string): string | undefined => {
  const path = join(EXAMPLES, name);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
};

/** 見本の記法を読んだ図。file が無いか記法として読めなければ落とす */
function diagramOf(name: string): Diagram {
  const text = fileText(name);
  expect(text, `${name} が無い`).toBeDefined();
  const parsed = api("parseNotation")(text ?? "");
  expect(parsed.ok, `${name} が記法として読めない: ${parsed.ok ? "" : JSON.stringify(parsed.errors)}`).toBe(true);
  return (parsed.ok ? parsed.diagram : {}) as unknown as Diagram;
}

const edges = (d: Diagram) => d.steps.flatMap((step, s) => step.events.flatMap((e) => (e.type === "edge" ? [{ ...e, step: s }] : [])));

/** 見本ごとの、主に見せる部品の語を使ったか。名前は人に見せる理由 */
const PARTS: Record<Added, (d: Diagram) => Record<string, boolean>> = {
  api: (d) => {
    const all = edges(d);
    return {
      "行きの線と、同じ 2 つの箱の間を逆向きに引く戻りの線": all.some((a) => all.some((b) => b.step >= a.step && b.from === a.to && b.to === a.from)),
      "線の名前を置く側 (side)": all.some((e) => e.labelSide !== undefined),
    };
  },
  retry: (d) => {
    const all = edges(d);
    return {
      "箱の中の処理 (act)": d.steps.some((step) => step.events.some((e) => e.type === "action")),
      "小さな字の書き換え (note)": d.steps.some((step) => step.events.some((e) => e.type === "swap")),
      "同じ 2 つの箱の間の同じ向きの線を 2 つの段で引く": all.some((a) => all.some((b) => b.step !== a.step && b.from === a.from && b.to === a.to)),
    };
  },
  payment: (d) => ({
    "硬貨を運ぶ線 (carry: coin)": edges(d).some((e) => e.carry.kind === "coin"),
    "中身の帯 (strip)": (d.strip?.fields.length ?? 0) > 0,
    "欄の値 (set)": d.steps.some((step) => step.events.some((e) => e.type === "strip")),
  }),
  wallet: (d) => ({
    "札を運ぶ線 (tag)": edges(d).some((e) => e.carry.kind === "tag"),
    "段で打つ命令 (code)": d.steps.some((step) => (step.code ?? "") !== ""),
  }),
};

/** 図の形。箱と段の数と、段ごとの出来事の種類の並び */
const shape = (d: Diagram): Record<string, unknown> => ({
  kind: d.kind,
  boxes: d.boxes.length,
  steps: d.steps.length,
  events: d.steps.map((step) => step.events.map((e) => (e.type === "edge" ? `edge:${e.carry.kind}` : e.type))),
  strip: d.strip?.fields.length ?? 0,
  code: d.steps.map((step) => step.code !== undefined),
});

const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

describe("時系列図の見本 4 つ (#3167)", () => {
  it("sequence-examples-compile-to-stored-json", () => {
    const validate = api("validateDiagram");
    for (const name of ADDED.flatMap((key) => [key, `${key}.en`])) {
      const diagram = diagramOf(`${name}.dragon`);
      expect(diagram.kind, `${name} が時系列図でない`).toBe("sequence");
      const stored = fileText(`${name}.json`);
      expect(stored, `${name}.json が無い`).toBeDefined();
      expect(diagram, `${name}.dragon から作った JSON が ${name}.json と違う`).toEqual(JSON.parse(stored ?? "null"));
      expect(validate(diagram), `${name} が JSON Schema の検査で落ちる`).toEqual({ ok: true });
    }
  });

  it("sequence-examples-roundtrip", () => {
    const parse = api("parseNotation");
    const print = api("printNotation");
    for (const name of ADDED.flatMap((key) => [key, `${key}.en`])) {
      const first = diagramOf(`${name}.dragon`);
      const again = parse(print(first));
      expect(again, `${name} を記法に書き戻して読むと、最初の JSON に戻らない`).toEqual({ ok: true, diagram: first });
    }
  });

  it("sequence-examples-use-their-parts", () => {
    const missing: string[] = [];
    for (const key of ADDED) {
      for (const [part, used] of Object.entries(PARTS[key](diagramOf(`${key}.dragon`)))) {
        if (!used) missing.push(`${key} が ${part} を使わない`);
      }
    }
    expect(missing, "主に見せる部品を使わない見本がある").toEqual([]);
  });

  it("sequence-examples-english-match", () => {
    for (const key of ADDED) {
      const ja = diagramOf(`${key}.dragon`);
      const en = diagramOf(`${key}.en.dragon`);
      expect(shape(en), `${key} の英語版の形が日本語版と違う`).toEqual(shape(ja));
      expect(fileText(`${key}.en.dragon`)?.match(KANA_KANJI)?.[0], `${key} の英語版に仮名か漢字がある`).toBeUndefined();
    }
  });
});
