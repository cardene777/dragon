/**
 * 記法が知っている名前を集める (#1825 で作り、#1830 で 2 つ目の引き手ができたので切り出した)。
 *
 * 画面に綴りのまま残す英語が「記法に実在するか」 を照合する時の相手。
 * **この file は検査からしか引かれない** (`lib/screen-words.ts` と同じ扱い) が、
 * 配られた package の中身を読むので `node:fs` に依存する。 画面の実装からは引かない。
 *
 * 引き手は 2 つ。
 *
 * | 引き手 | 何を照合するか |
 * |---|---|
 * | `lib/screen-words.test.ts` | 画面に残す記法の綴り 16 語 (#1825) と、記法の説明文 66 種 (#1827)、編集画面の見本の英語 (#1842) |
 * | `topics/subtitle-words.test.ts` | 図の説明に残る英語が増えていないか (#1830) |
 */
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import * as 記法 from "@cardenelabs/dragon";

/**
 * 配られた型宣言の中身を、読んだ順に返す (#1863)。
 *
 * 引き手は **対照を組む検査** だけ。 覚書の中にしか無い名前を通していないかを見る時、
 * 検査の側が生の字を読めないと「その語が本当に覚書の中にあるのか」 を確かめられず、
 * 対照が古くなっても気付けない。
 *
 * 配られる file 名は hash を含む (`render-Cp41meYv.d.ts`) ので名前で名指しせず、
 * 入口の dir を走査する。
 */
export function 型宣言の中身(): string[] {
  const require_ = createRequire(import.meta.url);
  const dist = dirname(require_.resolve("@cardenelabs/cdl"));
  return readdirSync(dist)
    .filter((f) => f.endsWith(".d.ts"))
    .map((f) => readFileSync(`${dist}/${f}`, "utf8"));
}

/**
 * 書き手の覚書 (JSDoc) を外す (#1863)。
 *
 * **覚書の中の例示は記法の綴りではない**。 配られる型宣言はほぼ全行に説明が付いており、
 * その中に `.step({ id: "user", title: "User" })` のような作り話の名前が書かれている。
 * 外さずに拾うと `User` / `Browser` / `Admin` が「記法が知る綴り」 として照合を通り、
 * 画面にその字が残っていても開く対象から外れる (実測で 151 語が覚書の中にしか無かった)。
 *
 * **`//` の形の注記は外さない**。 型宣言は TypeScript が書き出す file で、書き出す時に
 * 残るのは `/** *` の形だけ。 実測でも 3 file に `//` の行は 0 件で、外す分岐を足しても
 * 何も落ちなかった (変異で確かめた = 外す形にしても検査が 1 件も動かない)。
 * 動かない分岐を置くと、壊れても気付けない守りが 1 つ増える。
 */
function 覚書を外す(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ");
}

/**
 * 記法が知っている名前。 **4 経路** (#1825 で 2 つ、#1827 で 2 つ足した)。
 *
 * | 経路 | 何を集めるか |
 * |---|---|
 * | `cdl が配る名前` | `Object.keys(cdl)` |
 * | `cdl の型の項目` | `dist/*.d.ts` の項目 (`name?: T`) と method (`name(...)`) の宣言 |
 * | `cdl の型の値` | 同じ file の文字列 (`"heat-cell"` のような値の union)。 **覚書の中は見ない** (#1863) |
 * | `記法が配る一覧` | `@cardenelabs/dragon` が配る一覧 (`TOP_LEVEL_KEYS` 等) の中身 |
 *
 * **組み立て口 (`diagram()` が返す物の名前) は入れない** = 実測で 150 件を集めたが、
 * そこでしか覆えない綴りが 0 件だった (8 語を覆う一方、その 8 語は型も覆う)。
 * 経路を増やしても守りが増えないので落とした。
 *
 * **経路の専有は照合する相手ごとに変わる** = `cdl が配る名前` は #1825 の 16 語に対して
 * `signal` を専有するが、#1827 の説明文 66 種に対しては 0 件。 どちらか一方だけを見て
 * 落とすと、もう片方の守りが消える。
 *
 * 型まで見るのは、箱や図に渡す指定が **実行時の名前として 1 度も現れない** ため。
 * 受け取る側の型にしか綴りが無い。
 */
export function 記法が知る名前(): { 経路: Map<string, Set<string>>; 型file: number } {
  const require_ = createRequire(import.meta.url);
  const 型の項目 = new Set<string>();
  const 型の値 = new Set<string>();
  let 型file = 0;
  for (const 生 of 型宣言の中身()) {
    型file += 1;
    const s = 覚書を外す(生);
    for (const m of s.matchAll(/^\s*(?:readonly\s+)?([A-Za-z][A-Za-z0-9]*)\??\s*[:(]/gm)) {
      型の項目.add(m[1]!);
    }
    for (const m of s.matchAll(/"([A-Za-z][A-Za-z0-9_-]*)"/g)) 型の値.add(m[1]!);
  }
  return {
    経路: new Map<string, Set<string>>([
      [
        "cdl が配る名前",
        new Set(Object.keys(require_("@cardenelabs/cdl") as Record<string, unknown>)),
      ],
      ["cdl の型の項目", 型の項目],
      ["cdl の型の値", 型の値],
      ["記法が配る一覧", 記法が配る一覧()],
    ]),
    型file,
  };
}

/**
 * 記法が配る **図の型** の一覧 (#1842)。
 *
 * `記法が知る名前()` の 4 経路では型の名前を引けない。 経路は `Object.entries()` で
 * 中身を数える形なので、集合 (`Set`) で配られた一覧が 1 件も入らない
 * (実測 = `mind` / `stacked` / `solidity` / `journey` / `c4` が 4 経路のどれにも無く、
 * `flow` が当たっていたのは同名の関数を配っているという偶然だった)。
 *
 * **4 経路を広げず、型の一覧だけを別に配る**。 経路を広げると `NODE_KIND_VALID` の
 * 117 件まで一緒に入り、記法の綴りの照合が「何でも通る」 方へ緩む。
 *
 * 引き手は編集画面の見本 (`data/editor-samples.ts`) を見る検査だけ。 その file の英語は
 * 見本の名前の括弧の中 (`ログインAPI呼び出し (sequence)`) で、中身が図の型そのもの。
 */
export function 記法が配る図の型(): Set<string> {
  return new Set(記法.PRESET_TYPES);
}

/**
 * 記法 (`@cardenelabs/dragon`) が配る一覧の中身を集める (#1827)。
 *
 * `TOP_LEVEL_KEYS` (最上位の項目 22 件) のように、配列や表の形で名前を配っている。
 * **名前で名指ししない** = 一覧が増えた日に自動で追従する。
 *
 * **深さは 1 段まで**。 際限なく潜ると図の仕様の内部 (説明文や値の断片) まで集まり、
 * 照合が「何でも通る」 方へ緩む (実測で 64 件 → 587 件に膨らみ、記法が一覧を配っていない
 * `vertical` / `horizontal` まで通った)。 見るのは名前の一覧として配っているものだけ。
 */
function 記法が配る一覧(): Set<string> {
  const out = new Set<string>();
  const 文字列を足す = (v: unknown): void => {
    if (typeof v === "string") out.add(v);
    else if (Array.isArray(v)) for (const x of v) if (typeof x === "string") out.add(x);
  };
  for (const v of Object.values(記法)) {
    if (Array.isArray(v)) 文字列を足す(v);
    else if (v !== null && typeof v === "object") {
      for (const [k, vv] of Object.entries(v)) {
        out.add(k);
        文字列を足す(vv);
      }
    }
  }
  return out;
}

/**
 * 綴りが記法に実在するかを照合する (#1825、#1827 で経路を表で受ける形にした)。
 *
 * **前置き一致にしない**。 `renderOffset` が `renderOffsetX` の前置きだからといって
 * 緩めると、2 文字の語を足した日に記法の適当な名前に当たって素通りする
 * (`si` が `signal` に当たる形)。 画面の字と実物のずれは表の `綴り` に書く。
 *
 * 知っている名前を引数で受けるのは、**探し方を本番と対照で 2 度書かない** ため。
 * 経路を 1 つずつ空にした対照は、同じ関数に別の表を渡して作る。
 */
export function 綴りの照合(
  綴りたち: { 元: string; 綴り: string }[],
  経路: Map<string, Set<string>>,
): { 対象: { 元: string; 綴り: string; 経路: string[] }[]; 無い: string[] } {
  const 対象: { 元: string; 綴り: string; 経路: string[] }[] = [];
  const 無い: string[] = [];
  for (const { 元, 綴り } of 綴りたち) {
    const 当たり = [...経路].filter(([, 集合]) => 集合.has(綴り)).map(([名]) => 名);
    if (当たり.length === 0) 無い.push(元 === 綴り ? 綴り : `${元}: ${綴り}`);
    else 対象.push({ 元, 綴り, 経路: 当たり });
  }
  return { 対象, 無い };
}

/**
 * 経路を 1 つずつ抜いて、**そこでしか覆えない綴り** を数える (#1827)。
 *
 * 抜いて何も落ちない経路は、その相手に対して守りを 1 つも足していない。
 * 探し方は本番と同じ `綴りの照合()` に別の表を渡して作る。
 */
export function 経路ごとの専有(
  綴りたち: { 元: string; 綴り: string }[],
  経路: Map<string, Set<string>>,
): Map<string, string[]> {
  return new Map(
    [...経路].map(([名]) => [
      名,
      綴りの照合(綴りたち, new Map([...経路].filter(([n]) => n !== 名))).無い,
    ]),
  );
}
