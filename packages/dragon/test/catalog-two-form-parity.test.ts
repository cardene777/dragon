/**
 * 記法と JSON が同じ図になる (#2625)。
 *
 * 見本帳の図は同じ図を 2 つの形で持つ。 記法 (`sourceYaml__<key>`) と、同じ構造の JSON
 * (`sourceJson__<key>`) で、画面はこの 2 つをタブで並べる。 **どちらも人が書くので、片方を
 * 直してもう片方を忘れると 2 つのタブが別の図を見せる**。
 *
 * 突き合わせは 2 本あったが、どちらも一部しか見ていなかった。 記法帳は 26 件
 * (`textdsl-source-1365`)、基本パーツは 2 module (`catalog-source-pairs`) で、残りの module は
 * **JSON が読める形かどうかしか見ていない**。 #2623 で 178 段の説明を 2 形へ入れた時、
 * 使い捨ての道具で全件を比べてずれ 0 件を確かめたが、その確認は 1 度きりで残らない。
 * #2621 は同じ形の穴で、記法は `description` を受けるのに JSON は弾く状態を 1 度も落とさなかった。
 *
 * ## 組み立て済みの図とは比べない
 *
 * export した図は module ごとに違う引数で組み立てている (`parts-in-box` は部品の一覧を渡し、
 * 渡さないと部品の箱が既定の箱になる)。 引数を揃えずに比べると **引数の違いを中身の違いとして
 * 読む** (#2623 で 5 図がずれて見え、実体は道具の誤りだった)。
 *
 * ここは 2 形をどちらも同じ引数で組み立てて比べる = 左右対称なので、引数の違いが差に化けない。
 * 見るのは「2 つの元が同じ図を書いているか」 で、export と一致するかは上の 2 本が見る。
 *
 * ## 除外している欄は無い
 *
 * 実測で全ての組の全ての欄が一致する (組の数は検査が母数として出す)。 **欄を除外する時は、その欄を下の `除外` に足して
 * 理由を 1 行書く** = 理由を書かずに除外を足すと、実物の誤りを除外で隠せる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { textDslToDiagram, jsonToDiagram } from "../src/index";

const 置き場 = join(__dirname, "../../../apps/playground-spa/src/topics/catalog");

/**
 * 頁の module を glob で読む (手で並べない)。
 *
 * `*.cdl.ts` だけを読むのは、画面が頁として読み込む単位がこれだから。 別 file に置いた図
 * (`er-shapes.ts`) は頁の module が再輸出しており、ここから辿れる。 辿れない位置に
 * 置いた分は下の「宣言を取りこぼさない」 が落とす。
 */
const 頁 = import.meta.glob("../../../apps/playground-spa/src/topics/catalog/*.cdl.ts", {
  eager: true,
}) as Record<string, Record<string, unknown>>;

/** 突き合わせから外す欄 (名前 -> なぜ外すか)。 いまは 0 件 */
const 除外: Record<string, string> = {};

type 組 = { 頁: string; 記法: string; JSON: string };

const 組を集める = (): { 一覧: Map<string, 組>; 同名: string[] } => {
  const 一覧 = new Map<string, 組>();
  const 同名: string[] = [];
  for (const [path, mod] of Object.entries(頁)) {
    const 頁名 = (path.split("/").pop() ?? "").replace(/\.cdl\.ts$/, "");
    for (const [key, v] of Object.entries(mod)) {
      if (!key.startsWith("sourceYaml__")) continue;
      const 素 = key.slice("sourceYaml__".length);
      const json = mod[`sourceJson__${素}`];
      if (typeof v !== "string" || typeof json !== "string") continue;
      const 既に = 一覧.get(素);
      if (既に) {
        // 再輸出で同じ組が 2 頁から見える分は数えない。 中身が違う同名は落とす
        if (既に.記法 !== v || 既に.JSON !== json) 同名.push(`${素} (${既に.頁} と ${頁名})`);
        continue;
      }
      一覧.set(素, { 頁: 頁名, 記法: v, JSON: json });
    }
  }
  return { 一覧, 同名 };
};

describe("記法と JSON の突き合わせ (#2625)", () => {
  it("置き場が持つ 2 形の宣言を 1 つも取りこぼさない", () => {
    // **走査できた数を、実物の宣言の数と突き合わせる** (#824 の経路 1)。 頁から辿れない
    // 位置に組を置くと、比べた数が宣言の数に届かず落ちる。
    let 記法の宣言 = 0;
    let JSONの宣言 = 0;
    for (const f of readdirSync(置き場)) {
      if (!f.endsWith(".ts") || f.endsWith(".test.ts") || f.endsWith(".test.tsx")) continue;
      const t = readFileSync(join(置き場, f), "utf8");
      記法の宣言 += (t.match(/^export const sourceYaml__\S+ =/gm) ?? []).length;
      JSONの宣言 += (t.match(/^export const sourceJson__\S+ =/gm) ?? []).length;
    }
    const { 一覧, 同名 } = 組を集める();
    expect(同名, `同じ名前で中身の違う組がある\n  ${同名.join("\n  ")}`).toHaveLength(0);
    expect(記法の宣言, "置き場に記法の宣言が 1 件も無い (走査が壊れている)").toBeGreaterThan(0);
    expect(JSONの宣言, "記法と JSON の宣言の数が違う").toBe(記法の宣言);
    expect(
      一覧.size,
      `頁から辿れた組 ${一覧.size} が置き場の宣言 ${記法の宣言} に届いていない (頁が再輸出していない file がある)`,
    ).toBe(記法の宣言);
  });

  it("2 形から組み上げた図が一致する", () => {
    const ずれ: string[] = [];
    const { 一覧 } = 組を集める();
    for (const [素, x] of 一覧) {
      let y: Record<string, unknown>;
      let j: Record<string, unknown>;
      try {
        y = textDslToDiagram(x.記法);
      } catch (e) {
        ずれ.push(`${x.頁}/${素} 記法が読めない ${String(e).slice(0, 120)}`);
        continue;
      }
      try {
        j = jsonToDiagram(JSON.parse(x.JSON) as unknown);
      } catch (e) {
        ずれ.push(`${x.頁}/${素} JSON が読めない ${String(e).slice(0, 120)}`);
        continue;
      }
      for (const 欄 of new Set([...Object.keys(y), ...Object.keys(j)])) {
        if (欄 in 除外) continue;
        if (JSON.stringify(y[欄]) === JSON.stringify(j[欄])) continue;
        ずれ.push(
          `${x.頁}/${素} 欄=${欄}\n    記法 ${JSON.stringify(y[欄]).slice(0, 200)}\n    JSON ${JSON.stringify(j[欄]).slice(0, 200)}`,
        );
      }
    }
    // **0 件の報告には母数を書く** = 走査が空振りして 0 件になった状態と区別が付かない。
    expect(一覧.size, "2 形を持つ組が 1 件も取れていない (glob か走査が壊れている)").toBeGreaterThan(0);
    expect(
      ずれ,
      `記法と JSON が別の図になる組がある (母数 ${一覧.size} 組)\n  ${ずれ.join("\n  ")}`,
    ).toHaveLength(0);
  });
});
