import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { basename, dirname, join, relative } from "node:path";
import { いまを述べるfile } from "../../../test-support/scan-targets";

/**
 * 書いた package 名が実在することの検証 (#2246)。
 *
 * ## 用紙が無い名前の版を聞いていた
 *
 * bug を報告する人が最初に埋める必須の欄が、分離前の scope の版を求めていた。
 * 再現手順の見本の `import` 文も、影響範囲の選択肢 2 つも同じ scope で書かれており、
 * 実測では 3 つとも npm に無い。 根の README も、engine 側が配る package として
 * 実在しない名前を 1 つ並べていた (分かれていたのは分離前の時代で、いまは 1 つに入っている)。
 *
 * ## 見ていなかったのは場所ではなく判定
 *
 * 用紙は `.github/**` の YAML で、説明書を見る集合 (`*.md`) にも
 * 注釈を見る集合 (`*.ts` / `*.tsx` / `*.mts` / `*.mjs`) にも入らない。
 * 根の README は説明書の集合に入っていたが、**書いた package 名が実在するかを見る判定が
 * 1 つも無かった**。 走査を広げるだけでは足りず、判定の側も要る (#2236 と同じ形)。
 *
 * ## 実在は repo の中だけで決める
 *
 * npm には問い合わせない。 外の状態に依存すると、繋がらない回に落ちる検査になる。
 * repo の全 `package.json` から自分の `name` と 4 種の依存欄の鍵を集め、その集合で判定する。
 *
 * ## 綴りをそのまま書かない
 *
 * この file 自身が走査の母数に入るので、実在しない綴りを説明文にも対照にも literal で書けない
 * (書けば自分を落とす、 #2092 / #2244 で 2 回踏んだ)。 対照の綴りは繋いで作る。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

/**
 * 実在の一覧に無くても落とさない綴りと、その理由。
 *
 * **前方一致で外す**。 rule 名のように scope の下が開いている形を 1 行で書けるようにする。
 * 理由が空の entry は下の検査が落とす = 「落ちたから足した」 だけの entry を残さない。
 */
const 例外: Record<string, string> = {
  "@typescript-eslint/":
    "eslint の rule 名で package ではない。 依存に持っているのは scope を持たない `typescript-eslint`",
  "@x/y": "新しさを見る検査 (`dist-freshness`) が使う仮の名前。 実在させる意味が無い",
  "@anthropic-ai/sdk":
    "使う側が入れる package。 この repo は依存に持たないが、LLM に書かせる見本で名前を出す",
};

/**
 * scope 付きの名前の綴り。 出口の path を後ろに足した形は、2 つ目の区切りから先を落として見る。
 *
 * **仮の綴りを注釈に書かない**。 書くとこの file 自身が「実在しない名前」 として落ちる。
 */
const 綴り = /@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*/g;

/** 走査対象 = いまの実物を述べている file の全て (追跡と未追跡の両方、置き場所を挙げない) */
const 走査したfile: string[] = いまを述べるfile(REPO);

/**
 * repo が知っている package 名。
 *
 * 全 `package.json` の自分の `name` と、4 種の依存欄の鍵。
 * 依存欄を 4 種すべて見るのは、`devDependencies` だけに在る package 名も文中に出るため。
 */
function 実在する名前(): Set<string> {
  const 名 = new Set<string>();
  for (const p of 走査したfile) {
    if (basename(p) !== "package.json") continue;
    const j = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
    if (typeof j.name === "string") 名.add(j.name);
    for (const 欄 of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      const 表 = j[欄];
      if (表 && typeof 表 === "object") for (const n of Object.keys(表)) 名.add(n);
    }
  }
  return 名;
}

/** 中身が文字かどうか。 先頭 8000 byte に 0 byte があれば文字ではない (git と同じ見方) */
function 文字のfile(中身: Buffer): boolean {
  return !中身.subarray(0, 8000).includes(0);
}

/** 1 行から拾った綴りのうち、実在の一覧にも例外にも無いもの */
function 実在しない綴り(行: string, 実在: ReadonlySet<string>): string[] {
  const 出た: string[] = [];
  for (const m of 行.matchAll(綴り)) {
    const 名 = m[0].split("/").slice(0, 2).join("/");
    if (実在.has(名)) continue;
    if (Object.keys(例外).some((e) => 名.startsWith(e))) continue;
    出た.push(名);
  }
  return 出た;
}

interface 当たり {
  場所: string;
  名: string;
}

/** 走査した file 数と、拾った綴りの総数と、実在しなかった当たり */
function 走る(): { file数: number; 綴り数: number; 当たり: 当たり[] } {
  const 実在 = 実在する名前();
  const 当たり: 当たり[] = [];
  let file数 = 0;
  let 綴り数 = 0;
  for (const p of 走査したfile) {
    const 生 = readFileSync(p);
    if (!文字のfile(生)) continue;
    file数 += 1;
    生.toString("utf8")
      .split("\n")
      .forEach((行, i) => {
        綴り数 += [...行.matchAll(綴り)].length;
        for (const 名 of 実在しない綴り(行, 実在)) {
          当たり.push({ 場所: `${relative(REPO, p)}:${i + 1}`, 名 });
        }
      });
  }
  return { file数, 綴り数, 当たり };
}

const 結果 = 走る();

describe("書いた package 名が実在する (#2246)", () => {
  it("走査対象を集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(結果.file数, "走査する file を 1 件も集められていない").toBeGreaterThan(100);
  });

  it("綴りを 1 つ以上拾えている", () => {
    // 0 件が「該当なし」 なのか「拾えていない」 なのかを分けるための母数
    expect(結果.綴り数, "scope 付きの名前を 1 つも拾えていない").toBeGreaterThan(100);
  });

  it("用紙と根の説明書を走査している", () => {
    // 実際に古い名前が残っていた 2 か所。 片方だけを見る形だと、もう片方に戻っても通る
    const 相対 = 走査したfile.map((p) => relative(REPO, p));
    expect(
      相対.filter((p) => p.startsWith(".github/ISSUE_TEMPLATE/")).length,
      "問い合わせの用紙を走査していない",
    ).toBeGreaterThan(0);
    expect(相対.includes("README.md"), "根の説明書を走査していない").toBe(true);
  });

  it("どの綴りも実在する", () => {
    const 一覧 = 結果.当たり.map((h) => `${h.場所} ${h.名}`);
    expect(一覧, "実在しない package 名が書かれている").toEqual([]);
  });

  it("実在しない綴りを拾える (植え込み対照)", () => {
    // 拾えない判定だと、上の検査は残っていても通る。
    // 綴りは繋いで作る = literal で書くとこの file 自身が落ちる
    const 無い名 = ["@", "scope-that-is-not-installed", "/", "nothing"].join("");
    expect(
      実在しない綴り(`import x from "${無い名}";`, new Set(["@cardenelabs/dragon"])),
      "実在しない綴りを拾えていない",
    ).toEqual([無い名]);
  });

  it("実在する綴りと出口の path は拾わない (陰性対照)", () => {
    const 実在 = new Set(["@cardenelabs/cdl"]);
    expect(実在しない綴り(`import { a } from "@cardenelabs/cdl";`, 実在)).toEqual([]);
    // 出口の path は名前の後ろを落として見る
    expect(実在しない綴り(`import { b } from "@cardenelabs/cdl/react";`, 実在)).toEqual([]);
  });

  it("例外は前方一致で外れ、理由が書かれている", () => {
    const 空 = Object.entries(例外).filter(([, 理由]) => 理由.trim() === "");
    expect(空.map(([e]) => e), "例外に理由が書かれていない").toEqual([]);
    // 前方一致で外れること自体も見る (rule 名は scope の下が開いている)
    const rule = ["@typescript", "-eslint/", "no-something"].join("");
    expect(実在しない綴り(`"${rule}": "off"`, new Set())).toEqual([]);
  });
});
