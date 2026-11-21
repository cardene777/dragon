/**
 * 1 件の上限に近い件を、実行の終わりに名前と秒数で出す vitest の報告の部品 (#3740)。
 *
 * 新しく足した見本や件が負荷の下で 1 件の上限 (10 秒) を超えても、関門が時間切れで落ちるまで気付けなかった。
 * 上限の 4 割以上かかった件を、秒数の長い順に `file > 組 > 件` の名前と秒数で並べ、その時の負荷平均を 1 回添える。
 * 件の秒数は vitest が測るとおりで、`beforeEach` と `afterEach` を含み、`beforeAll` と `afterAll` を含まない。
 *
 * 上限は設定の `testTimeout` から読む。`test-support/limits.ts` が持つ上限と、それを下げる環境変数 (`DRAGON_TEST_LIMIT_MS`) が決めた値で、
 * 上限を下げると目安も一緒に下がる。上限と目安を変える環境変数は足さない。
 * 知らせるだけで、実行の終わり方は変えない。負荷で延びただけの回に関門を落とさないため。
 *
 * 関係する検査を回す命令 (`scripts/test-related.mjs`) と、`.ikkan/checks.md` の一式と配る前のテストが `--reporter` で渡す。
 * 設定 (`vitest.config.ts`) に書くと、関係する検査を選ぶ命令が全ての検査を選ぶので、設定には書かない。
 */
import { loadavg } from "node:os";
import { relative } from "node:path";

/** 目安は 1 件の上限のこの割合。負荷の下で軽くした件の線 (4 秒、#3738) と揃える */
export const NEAR_LIMIT_RATIO = 0.4;

/** ms を、小数 1 桁までの秒の字にする (`1200` は `1.2`、`3000` は `3`) */
const seconds = (ms) => String(Math.round(ms / 100) / 10);

export default class NearLimitReporter {
  onInit(vitest) {
    this.vitest = vitest;
  }

  onTestRunEnd(testModules) {
    const { root, testTimeout } = this.vitest.config;
    const threshold = testTimeout * NEAR_LIMIT_RATIO;
    const near = [];
    for (const module of testModules) {
      for (const test of module.children.allTests()) {
        const duration = test.diagnostic()?.duration;
        if (duration !== undefined && duration >= threshold)
          near.push({ name: `${relative(root, module.moduleId)} > ${test.fullName}`, duration });
      }
    }
    if (near.length === 0) return;
    near.sort((a, b) => b.duration - a.duration);
    const heading = `1件の上限${seconds(testTimeout)}秒の${NEAR_LIMIT_RATIO * 10}割 (${seconds(threshold)}秒) 以上かかった件が${near.length}件ある。負荷平均は${loadavg()[0].toFixed(2)}`;
    this.vitest.logger.log(
      `\n${heading}\n${near.map(({ name, duration }) => `  ${seconds(duration)}秒 ${name}`).join("\n")}\n`,
    );
  }
}
