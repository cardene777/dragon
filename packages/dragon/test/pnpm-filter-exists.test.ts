import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, join, relative } from "node:path";
import { いまを述べるfile } from "../../../test-support/scan-targets";

/**
 * `--filter` に渡した名前が workspace に在ることの検証 (#2248)。
 *
 * ## 当たらない指定は静かに成功する
 *
 * 速さを測る道具の冒頭が、workspace に無い package を名指ししていた。
 * その指定は `No projects matched the filters` と出して **exit 0 で終わる** ので、
 * 打った人には成功して見え、1 件も測っていないことに気付けない。
 *
 * 「拾えなかった 0 件を静かに受け入れる」 形で、#2244 で撮影の道具に対して止めた形と同じ。
 * 止め方も同じにはできない = 打つのは人なので、書いてある指定の側を先に正す。
 *
 * ## 選べる名前は実物から辿る
 *
 * `pnpm-workspace.yaml` が持つ場所の形を読み、そこに在る `package.json` の名前を集める。
 * 名前を書き写すと、package が増えた日に検査の側が古くなる。
 *
 * ## 名前以外の指定は見ない
 *
 * `--filter` は path や依存の向き (`...` を付ける形) も取れる。 それらは名前ではないので
 * 判定しない。 見分けは下の `名前の指定` が持ち、当てはまらない形は数えずに飛ばす。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

/** 走査対象 = いまの実物を述べている file の全て (置き場所を挙げない) */
const 走査したfile: string[] = いまを述べるfile(REPO);

/**
 * workspace が package を探す場所の形。
 *
 * `pnpm-workspace.yaml` の `packages:` の下に並ぶ 1 行ずつ。
 * `*` 以外の形 (`**` など) は読み方を決めていないので、出てきたら落とす。
 */
function 場所の形(): string[] {
  const 中身 = readFileSync(join(REPO, "pnpm-workspace.yaml"), "utf8");
  const 形: string[] = [];
  let 中 = false;
  for (const 行 of 中身.split("\n")) {
    if (/^packages:\s*$/.test(行)) {
      中 = true;
      continue;
    }
    if (中 && /^\S/.test(行)) 中 = false;
    if (!中) continue;
    const m = /^\s*-\s*["']?([^"'#]+?)["']?\s*$/.exec(行);
    if (m) 形.push(m[1]!);
  }
  return 形;
}

/** 場所の形を、相対 path に当てる正規表現に直す (`*` は 1 段だけ) */
function 形の正規表現(形: string): RegExp {
  const 外す = 形.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]+");
  return new RegExp(`^${外す}$`, "u");
}

/** `--filter` で選べる名前 = workspace の場所に在る `package.json` の名前 */
function 選べる名前(): Set<string> {
  const 形 = 場所の形().map(形の正規表現);
  const 名 = new Set<string>();
  for (const p of 走査したfile) {
    if (basename(p) !== "package.json") continue;
    const dir = dirname(relative(REPO, p));
    if (!形.some((r) => r.test(dir))) continue;
    const j = JSON.parse(readFileSync(p, "utf8")) as { name?: unknown };
    if (typeof j.name === "string") 名.add(j.name);
  }
  return 名;
}

/**
 * 選ぶ指定の次に来る名前を拾う。 長い書き方と短い書き方の両方、等号と空白の両方を見る。
 *
 * **拾う値を ASCII の名前の形に留める** (#2248)。 留めていなかった間、日本語の文が
 * 短い書き方の後ろに続く形 (`PR-F は independent`) を名前として拾っていた。
 * package の名前に日本語は使えないので、この形は判定の対象ではない。
 *
 * **短い書き方は、前が文字や数字でない時だけ見る**。 短い書き方は 2 文字しかないので、
 * 文中の語の末尾 (`wave 9-F v4-v7` の `9-F`) にそのまま当たる。
 * 実際の呼出では前が空白なので、前を見るだけで文中の語と分かれる。
 */
const 指定 = /(?:--filter[= ]|(?<![A-Za-z0-9])-F )([@a-zA-Z0-9][a-zA-Z0-9@._/-]*)/g;

/**
 * 判定しない file と、その理由。
 *
 * 理由が空の entry は下の検査が落とす = 「落ちたから足した」 だけの entry を残さない。
 */
const 例外: Record<string, string> = {
  "script-run-prefix.test.ts":
    "pnpm の呼出の書き方そのものを見る検査で、見本として短い仮の名前を渡す。 実在させる意味が無い",
};

/**
 * 名前として判定する指定か。
 *
 * path を渡す形 (`.` 始まり / `/` を含む) と、依存の向きを付ける形 (`...` を含む) と、
 * 範囲を絞る形 (`[` や `{` を含む) は名前ではないので判定しない。
 */
function 名前の指定(値: string): boolean {
  if (値.startsWith(".")) return false;
  if (値.includes("...")) return false;
  if (値.includes("[") || 値.includes("{")) return false;
  return true;
}

interface 当たり {
  場所: string;
  名: string;
}

function 走る(): { file数: number; 指定数: number; 当たり: 当たり[] } {
  const 選べる = 選べる名前();
  const 当たり: 当たり[] = [];
  let file数 = 0;
  let 指定数 = 0;
  for (const p of 走査したfile) {
    if (basename(p) in 例外) continue;
    const 生 = readFileSync(p);
    if (生.subarray(0, 8000).includes(0)) continue;
    file数 += 1;
    生.toString("utf8")
      .split("\n")
      .forEach((行, i) => {
        for (const m of 行.matchAll(指定)) {
          const 値 = m[1]!;
          if (!名前の指定(値)) continue;
          指定数 += 1;
          if (選べる.has(値)) continue;
          当たり.push({ 場所: `${relative(REPO, p)}:${i + 1}`, 名: 値 });
        }
      });
  }
  return { file数, 指定数, 当たり };
}

const 結果 = 走る();

describe("--filter に渡した名前が workspace に在る (#2248)", () => {
  it("走査対象を集められている", () => {
    expect(結果.file数, "走査する file を 1 件も集められていない").toBeGreaterThan(100);
  });

  it("指定を 1 つ以上拾えている", () => {
    // 0 件が「該当なし」 なのか「拾えていない」 なのかを分けるための母数
    expect(結果.指定数, "--filter の指定を 1 つも拾えていない").toBeGreaterThan(10);
  });

  it("選べる名前を実物から辿れている", () => {
    const 選べる = 選べる名前();
    expect(選べる.size, "workspace の package を 1 つも辿れていない").toBeGreaterThan(1);
    // 場所の形が読めていなければ、上の一覧はたまたま空でないだけになる
    expect(場所の形().length, "workspace の場所の形を読めていない").toBeGreaterThan(0);
  });

  it("どの指定も workspace に在る", () => {
    const 一覧 = 結果.当たり.map((h) => `${h.場所} ${h.名}`);
    expect(一覧, "workspace に無い名前を --filter に渡している").toEqual([]);
  });

  it("3 つの書き方から名前を拾える (植え込み対照)", () => {
    const 無い名 = ["not", "-a-", "workspace"].join("");
    for (const 形 of [`--filter=${無い名}`, `--filter ${無い名}`, `-F ${無い名}`]) {
      const 拾った = [...形.matchAll(指定)].map((m) => m[1]);
      expect(拾った, `拾えていない書き方: ${形}`).toEqual([無い名]);
    }
  });

  it("判定しない file に理由が書かれ、その file が実在する", () => {
    const 理由なし = Object.entries(例外).filter(([, 理由]) => 理由.trim() === "");
    expect(
      理由なし.map(([f]) => f),
      "判定しない file に理由が書かれていない",
    ).toEqual([]);
    // 消えた file の宣言が残ると、同じ名前の file が後から来た時に黙って外れる
    const 実在 = new Set(走査したfile.map((p) => basename(p)));
    expect(
      Object.keys(例外).filter((f) => !実在.has(f)),
      "宣言した file が repo に無い",
    ).toEqual([]);
  });

  it("文中の語を短い書き方と読み違えない (陰性対照)", () => {
    // 短い書き方は 2 文字なので、語の末尾に当たる。 前が文字や数字なら呼出ではない
    expect([...("wave 9-F v4-v7 は取り消し済".matchAll(指定))], "文中の語を拾っている").toEqual([]);
    const 名 = ["dragon", "-playground-spa"].join("");
    expect([...(`pnpm -F ${名} run test:e2e`.matchAll(指定))].map((m) => m[1])).toEqual([名]);
  });

  it("名前でない指定は判定しない (陰性対照)", () => {
    // path を渡す形と、依存の向きを付ける形。 名前として突き合わせると必ず落ちる
    expect(名前の指定("./apps/playground-spa"), "path を名前として判定している").toBe(false);
    expect(名前の指定("...@cardenelabs/dragon"), "依存の向きを名前として判定している").toBe(false);
    expect(名前の指定("@cardenelabs/dragon"), "名前を判定から外している").toBe(true);
  });
});
