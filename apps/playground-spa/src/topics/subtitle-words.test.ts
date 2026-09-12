// @vitest-environment node
/**
 * 図の説明 (`topics/catalog/*.cdl.ts` の `subtitle__*`) に残る英語の歯止め (#1830)。
 *
 * 説明は見本帳の一覧と拡大の窓に出る (`CategoryPage.tsx` が描く) が、
 * **字の検査の母集団には入っていない**。 記法の語彙をそのまま書いた技術メモのままで、
 * 日本語に開く作業は呼び名の決め方に判断が要るので #1829 で待ちにした。
 *
 * 待っている間に増えても誰も気付かないので、**いまの数を天井として置く**。
 * 新しい見本を足した日に同じ形の説明が増えれば、この検査が落ちる。
 *
 * **判定は自前で持たない** = 画面の字の判定 (`残る英単語()`、#1817 で 1 つに寄せた) と
 * 記法が知る名前 (#1827 の 4 経路) をそのまま引く。 一覧に語を足した日に、
 * この歯止めの数も同じ向きに動く。
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { 残る英単語, 日本語の字 } from "@/lib/screen-words";
import { 記法が知る名前, 綴りの照合 } from "@/lib/notation-names";

const 見本の置き場 = fileURLToPath(new URL("./catalog/", import.meta.url));

/**
 * いまの数。 **減った時も落とす** = 下回ったまま通すと、一度直した分がまた増えても
 * 気付けない (天井が緩みっぱなしになる)。 落ちた時の文で下げる先の数を出す。
 *
 * **延べを数えるのが要る**。 説明の件数と語の種類だけでは、
 * *既に英語を含む説明に、既に出ている語を足す* 形が素通りする
 * (変異試験で実測 = `pipeline` を 1 語足しても 3 つの数が 1 つも動かなかった)。
 * 延べなら 1 語足すたびに 1 増える。
 */
const 天井 = { 説明: 122, 語: 395, 延べ: 556 };

/**
 * 図の説明を集める。
 *
 * `宣言` と `読めた` を分けて返すのは、**書き方が変わった日に気付くため**。
 * 値が複数行に分かれる形に変えると `読めた` だけが減り、差が出る。
 */
function 図の説明(): { 件: { file: string; 鍵: string; 文: string }[]; 宣言: number; file数: number } {
  const 件: { file: string; 鍵: string; 文: string }[] = [];
  let 宣言 = 0;
  let file数 = 0;
  for (const f of readdirSync(見本の置き場)) {
    if (!f.endsWith(".cdl.ts")) continue;
    file数 += 1;
    const s = readFileSync(見本の置き場 + f, "utf8");
    宣言 += [...s.matchAll(/export const subtitle__/g)].length;
    for (const m of s.matchAll(/export const subtitle__(\w+)\s*(?::\s*string\s*)?=\s*\n?\s*"([^"\\]*)"/g)) {
      件.push({ file: f, 鍵: m[1]!, 文: m[2]! });
    }
  }
  return { 件, 宣言, file数 };
}

/**
 * 説明 1 件に残る「開くべき英語」。
 *
 * 一覧が許す語 (`残る英単語()` が落とす) でも、記法が知る綴り (#1827) でもない語。
 * 記法の綴りを外すのは、それが **打ち込む字で訳せない** ため (#1825 と同じ線引き)。
 */
function 開くべき英語(文: string, 経路: Map<string, Set<string>>): string[] {
  const 残る = 残る英単語(文);
  return 綴りの照合(残る.map((w) => ({ 元: w, 綴り: w })), 経路).無い;
}

/**
 * 開くべき英語を含む説明と、語の種類と、延べの回数を数える。
 *
 * **3 つとも要る**。 説明の件数は「どれだけの説明が残っているか」、語の種類は
 * 「何通りの呼び名を決めないといけないか」、延べは「1 語ずつ足す形を止める」。
 * 延べが無いと、既に英語を含む説明に既出の語を足す形が素通りする。
 */
function 数える(
  件: { file: string; 鍵: string; 文: string }[],
  経路: Map<string, Set<string>>,
): { 説明: { 鍵: string; 語: string[] }[]; 語: string[]; 延べ: number } {
  const 説明: { 鍵: string; 語: string[] }[] = [];
  const 語 = new Set<string>();
  let 延べ = 0;
  for (const r of 件) {
    if (!日本語の字.test(r.文)) continue;
    const w = 開くべき英語(r.文, 経路);
    if (w.length === 0) continue;
    説明.push({ 鍵: r.鍵, 語: w });
    延べ += w.length;
    for (const x of w) 語.add(x);
  }
  return { 説明, 語: [...語], 延べ };
}

describe("図の説明に残る英語の歯止め (#1830)", () => {
  it("いまの天井を超えていない、下回ってもいない", () => {
    const { 件, 宣言, file数 } = 図の説明();
    const { 経路 } = 記法が知る名前();
    const { 説明, 語, 延べ } = 数える(件, 経路);
    console.log(
      `[図の説明] file=${file数} 宣言=${宣言} 読めた=${件.length}` +
        ` / 開くべき英語を含む説明=${説明.length} (天井 ${天井.説明})` +
        ` 語=${語.length} 種 (天井 ${天井.語}) 延べ=${延べ} 回 (天井 ${天井.延べ})`,
    );
    expect(file数, "見本の file を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(5);
    expect(宣言, "説明の宣言を 1 件も見つけていない (検査が空振りしている)").toBeGreaterThan(100);
    expect(件.length, "説明の値を 1 件も読めていない (書き方が変わった)").toBe(宣言);
    for (const [名, いま, 上] of [
      ["説明", 説明.length, 天井.説明],
      ["語", 語.length, 天井.語],
      ["延べ", 延べ, 天井.延べ],
    ] as const) {
      expect(
        いま,
        `${名} が天井を超えた。 直すか、直せない理由を #1829 に足す (${上} → ${いま})`,
      ).toBeLessThanOrEqual(上);
      expect(いま, `減ったので天井を下げる (${名}: ${上} → ${いま})`).toBeGreaterThanOrEqual(上);
    }
  });

  it("開くべき英語を見つける (植え込み対照 + 対象外の対照)", () => {
    const { 経路 } = 記法が知る名前();
    // 植え込み対照 = 記法が知らない普通の英語を混ぜて、見つけること
    expect(開くべき英語("読む人が値を入れる pipeline の説明", 経路)).toEqual(["pipeline"]);
    // 対象外の対照 = 記法の綴りは打ち込む字なので咎めない
    expect(開くべき英語("readout で値を字に出す", 経路), "記法の綴りを咎めている").toEqual([]);
    expect(開くべき英語("signal を図へ繋ぐ", 経路)).toEqual([]);
    // 一覧が許す語も咎めない
    expect(開くべき英語("図は SVG として書き出せる", 経路)).toEqual([]);
    // 日本語だけの説明は 0 件
    expect(開くべき英語("読む人が値を入れる口の見本", 経路)).toEqual([]);
  });

  it("説明を 1 件も落とさずに走査している (収容対照)", () => {
    const { 件, file数 } = 図の説明();
    const files = new Set(件.map((r) => r.file));
    console.log(`[走査] ${[...files].map((f) => `${f}=${件.filter((r) => r.file === f).length}`).join(" ")}`);
    expect(file数, "見本の file を 1 つも見ていない").toBeGreaterThan(5);
    expect(files.size, "説明を持つ file が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    // 鍵が重複していない = 同じ説明を 2 度数えていない
    const 鍵 = 件.map((r) => r.鍵);
    expect(new Set(鍵).size, "同じ説明を 2 度数えている").toBe(鍵.length);
  });

  it("天井が実数とかけ離れていない (境界)", () => {
    // 天井を実数より大きく置くと、増えても落ちない。 **ちょうどに置く** ことを固定する
    const { 件 } = 図の説明();
    const { 経路 } = 記法が知る名前();
    const { 説明, 語, 延べ } = 数える(件, 経路);
    expect(天井.説明, "天井が実数とずれている").toBe(説明.length);
    expect(天井.語, "天井が実数とずれている").toBe(語.length);
    expect(天井.延べ, "天井が実数とずれている").toBe(延べ);
  });
});
