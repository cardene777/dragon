/**
 * ER 図の配色が意匠帳と実装で一致していることの検証 (#1553)。
 *
 * 決めた 7 色は 2 か所に書いてある。 意匠帳 (`docs/design/er/note.md`) の表と、実装
 * (`apps/playground-spa/src/styles/cdl-theme.css`) の `--er-*`。 突き合わせる経路が無いと、
 * 片方だけ直して食い違う (`palette-matches-pen.spec.ts` が設計と実装で同じことをしている)。
 *
 * ## 両方向で見る
 *
 * 値の一致だけでは、片方にしか無い色みや口を見逃す。 名前の集合が両側で同じことも見る。
 *
 * ## 意匠帳の書き方に縛りが要る
 *
 * 表は「役 / 明 / 暗」 の 3 列で、役の語は実装の口 (`ground` 等) と 1 対 1 に対応する。
 * 対応表はここが持つ = 意匠帳は人が読む文書なので日本語の役名で書き、実装は CSS の変数名で
 * 書く。 どちらかに寄せると片方が読みにくくなる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const 読む = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

/** 意匠帳の役の語と、実装の口の対応 */
const 役と口 = {
  台: "ground",
  行の面: "face",
  縞: "stripe",
  枠: "frame",
  字: "ink",
  型名: "type",
  線: "line",
} as const;

/** 意匠帳の見出しと、実装の配色の名前の対応 */
const 見出しと名前 = {
  "既定 — 生成りに茶": "kinari",
  "指定した時だけ当たる — 青磁に墨": "celadon",
} as const;

type 色 = { 明: string; 暗: string };

/**
 * 意匠帳側。 `### <見出し>` の下にある「役 / 明 / 暗」 の表を読む。
 *
 * 見出しから次の `###` までを範囲にする = 節をまたいで拾うと、別の色みの表が混ざる。
 */
function 意匠帳の配色(): Map<string, Map<string, 色>> {
  const md = 読む("../../../../docs/design/er/note.md");
  const out = new Map<string, Map<string, 色>>();
  for (const [見出し, 名前] of Object.entries(見出しと名前)) {
    const i = md.indexOf(`### ${見出し}`);
    expect(i, `意匠帳に「${見出し}」 の節が無い`).toBeGreaterThanOrEqual(0);
    const j = md.indexOf("\n### ", i + 1);
    const 節 = md.slice(i, j === -1 ? md.length : j);
    const 表 = new Map<string, 色>();
    for (const m of 節.matchAll(/^\|\s*([^|\s]+)\s*\|\s*`(#[0-9a-fA-F]{6})`\s*\|\s*`(#[0-9a-fA-F]{6})`\s*\|/gm)) {
      // 3 つとも必須の群。 一致した以上必ず取れる
      const 役 = m[1]!;
      if (!Object.hasOwn(役と口, 役)) continue;
      表.set(役と口[役 as keyof typeof 役と口], { 明: m[2]!.toLowerCase(), 暗: m[3]!.toLowerCase() });
    }
    out.set(名前, 表);
  }
  return out;
}

/**
 * 実装側。 `[data-cdl-palette="<名前>"]` の塊から `--er-*` を読む。
 *
 * `html.dark` が前に付く塊が暗い側。 付かない方が明るい側。
 */
function 実装の配色(): Map<string, Map<string, 色>> {
  const css = 読む("../styles/cdl-theme.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const 明 = new Map<string, Map<string, string>>();
  const 暗 = new Map<string, Map<string, string>>();
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const sel = m[1] ?? "";
    const body = m[2] ?? "";
    const 名前 = /\[data-cdl-palette="([^"]+)"\]/.exec(sel);
    if (!名前) continue;
    const 先 = sel.includes("html.dark") ? 暗 : 明;
    // 必須の群。 一致した以上必ず取れる
    const 表 = 先.get(名前[1]!) ?? new Map<string, string>();
    for (const v of body.matchAll(/--er-([a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
      表.set(v[1]!, v[2]!.toLowerCase());
    }
    先.set(名前[1]!, 表);
  }
  const out = new Map<string, Map<string, 色>>();
  for (const [名前, 明表] of 明) {
    const 暗表 = 暗.get(名前) ?? new Map<string, string>();
    const 表 = new Map<string, 色>();
    for (const [口, 値] of 明表) {
      const d = 暗表.get(口);
      if (d === undefined) continue;
      表.set(口, { 明: 値, 暗: d });
    }
    out.set(名前, 表);
  }
  return out;
}

describe("ER 図の配色が意匠帳と実装で一致する (#1553)", () => {
  it("色みの名前が両側で揃っている", () => {
    const 帳 = 意匠帳の配色();
    const 実 = 実装の配色();
    // 0 件だと下の照合が「対象なし」 で素通りする
    expect(帳.size, "意匠帳から色みを 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(実.size, "実装から色みを 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect([...実.keys()].sort(), "意匠帳と実装で色みの名前が違う").toEqual([...帳.keys()].sort());
  });

  it("どの色みも 7 つの口を両方で持っている", () => {
    const 口 = Object.values(役と口).sort();
    for (const [名前, 表] of 意匠帳の配色()) {
      expect([...表.keys()].sort(), `意匠帳の ${名前} が 7 つの口を埋めていない`).toEqual(口);
    }
    for (const [名前, 表] of 実装の配色()) {
      expect([...表.keys()].sort(), `実装の ${名前} が 7 つの口を埋めていない`).toEqual(口);
    }
  });

  it("色の値が明暗とも一致している", () => {
    const 帳 = 意匠帳の配色();
    const 実 = 実装の配色();
    const ずれ: string[] = [];
    let 見た = 0;
    for (const [名前, 表] of 帳) {
      const 相手 = 実.get(名前);
      if (相手 === undefined) continue; // 名前の検査が別に落とす
      for (const [口, 色] of 表) {
        const c = 相手.get(口);
        if (c === undefined) continue; // 口の検査が別に落とす
        見た += 1;
        if (色.明 !== c.明) ずれ.push(`${名前}.${口} 明: 意匠帳 ${色.明} / 実装 ${c.明}`);
        if (色.暗 !== c.暗) ずれ.push(`${名前}.${口} 暗: 意匠帳 ${色.暗} / 実装 ${c.暗}`);
      }
    }
    // 突き合わせた数を必ず見る。 0 件は「一致した」 ではなく「測っていない」
    expect(見た, "1 組も突き合わせていない (検査が空振りしている)").toBe(
      Object.keys(見出しと名前).length * Object.keys(役と口).length,
    );
    expect(ずれ, "意匠帳と実装で色が食い違う").toEqual([]);
  });
});
