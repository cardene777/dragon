import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * script が別の script を呼ぶ時に `run` を明示していることの検証 (#1345)。
 *
 * pnpm は組込みの command と同名の script があると **組込みを優先する**。 `pnpm deploy` は
 * 組込みの `deploy` が走り、script には届かなかった (実測 = `ERR_PNPM_NOTHING_TO_DEPLOY`)。
 * 配信の cmd は一度も動いたことがなかった。
 *
 * ## 組込みの一覧は持てない
 *
 * `pnpm --help` は `deploy` を列挙しない。 help に出ない組込みがあるため、名前の一覧と
 * 突き合わせる形は作れない。
 *
 * 代わりに **`run` を挟んだか** を見る。 `run` があれば組込みかどうかに関わらず script に
 * 届くため、名前を知らなくても判定できる。
 *
 * ## 今壊れていない呼出にも課す
 *
 * 検査を書いた時点で実際に壊れていたのは `deploy` の 1 件だけだった。 それでも 20 件すべてに
 * `run` を足したのは、組込みが後から増えるため。 `pnpm` が将来 `build` の組込みを足せば、
 * 何も変えていないのに `pnpm build` が別のものを指す。
 *
 * ## 覆えていない範囲
 *
 * 本検査が見るのは `package.json` の中の呼出だけ。 **人が端末で `pnpm build` と打つ形は
 * 止められない**。 単語 1 つの script 名 (`build` / `dev` / `test` 等) は将来の組込みと
 * 衝突しうるが、`:` 付きへ一斉改名する形は打ち慣れた cmd を全て変えることになるため採らない。
 *
 * 名前の一覧をここに書き写す形も採らない。 一覧は script を足すたびに古くなり、実物と
 * ずれる (#1341 で直したのと同じ形になる)。
 */

const ROOT = join(import.meta.dirname, "../../../..");

/** 走査する `package.json` */
const 走査対象 = [
  "package.json",
  "apps/playground-spa/package.json",
  "packages/dragon/package.json",
] as const;

type Scripts = Readonly<Record<string, string>>;

function scriptsを読む(rel: string): Scripts {
  const pkg = JSON.parse(readFileSync(join(ROOT, rel), "utf8")) as { scripts?: Scripts };
  return pkg.scripts ?? {};
}

/** `run` を挟まずに呼んでよい pnpm の語 (組込みをそのまま使う形) */
const runが要らない = new Set(["run", "exec", "install", "add", "dlx"]);

/**
 * `pnpm ... <語>` の形を拾う。
 *
 * `--filter <pkg>` / `--filter=<pkg>` / `-F <pkg>` が間に入る形も同じ扱い。 `<語>` が
 * script 名なら、`run` を挟まないと組込みに食われうる。
 */
export function runを省いた呼出(本文: string, script名: ReadonlySet<string>): string[] {
  const 出: string[] = [];
  for (const m of 本文.matchAll(/pnpm\s+(?:(?:--filter|-F)(?:\s+|=)\S+\s+)?([a-zA-Z][\w:.-]*)/gu)) {
    // 必須の群。 取れない形は regex と噛み合っていないので捨てる
    const 語 = m[1];
    if (語 === undefined) continue;
    if (runが要らない.has(語)) continue;
    if (!script名.has(語)) continue;
    出.push(m[0]);
  }
  return 出;
}

const 全script名: ReadonlySet<string> = new Set(
  走査対象.flatMap((rel) => Object.keys(scriptsを読む(rel))),
);

describe("script から script を呼ぶ時は run を明示する (#1345)", () => {
  it("script を集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(
      全script名.size,
      "script を 1 つも集められていない (検査が空振りしている)",
    ).toBeGreaterThan(0);
  });

  it("script から script を呼ぶ箇所を拾えている", () => {
    // 拾えていなければ「省略 0 件」 は自明に通る
    const 総数 = 走査対象.reduce((n, rel) => {
      const scripts = scriptsを読む(rel);
      return (
        n +
        Object.values(scripts).filter((v) => /pnpm\s+(?:--filter\s+\S+\s+)?run\s/u.test(v)).length
      );
    }, 0);
    expect(総数, "run 付きの呼出を 1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("run を省いた呼出が無い", () => {
    const 省略: string[] = [];
    for (const rel of 走査対象) {
      for (const [名, 本文] of Object.entries(scriptsを読む(rel))) {
        for (const frag of runを省いた呼出(本文, 全script名)) {
          省略.push(`${rel} :: ${名} → \`${frag}\``);
        }
      }
    }
    expect(省略, "script から script を run 無しで呼んでいる (組込みに食われうる)").toEqual([]);
  });

  it("run 付きの呼出を誤検出しない (陰性対照)", () => {
    // 何でも拾う実装だと、上の検査は run の有無に関わらず落ちる
    expect(runを省いた呼出("pnpm run build", new Set(["build"])), "run 付きを拾っている").toEqual(
      [],
    );
    expect(
      runを省いた呼出("pnpm --filter x run build", new Set(["build"])),
      "filter 付き run を拾っている",
    ).toEqual([]);
    expect(
      runを省いた呼出("pnpm build", new Set(["build"])),
      "run 無しを拾えていない",
    ).toHaveLength(1);
    expect(
      runを省いた呼出("pnpm -F x build", new Set(["build"])),
      "短縮 filter 付きの run 無しを拾えていない",
    ).toHaveLength(1);
    expect(
      runを省いた呼出("pnpm --filter=x build", new Set(["build"])),
      "等号 filter 付きの run 無しを拾えていない",
    ).toHaveLength(1);
  });
});
