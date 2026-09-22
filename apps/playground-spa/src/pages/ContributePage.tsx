import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumb } from "@/components/Breadcrumb";
import { 画面の名前を引く } from "@/lib/site-destinations";
import { useLocale } from "@/lib/useLocale";
import "@/styles/compare.css";

/**
 * PR を出すまでの 5 手順 (#1126)。
 *
 * 設計 (`docs/design/app.pen` の「08 参加方法」) が持っていた節を実装に足したもの。
 *
 * **命令は実物に合わせる**。 設計は `bun` 前提の検査を置いていたが、 この repo には無い。
 * `CONTRIBUTING.md § 開発フロー` と `package.json` の scripts が正で、 食い違うと
 * 読んだ人がそのまま打って失敗する。 一致は `contribute-pr-steps.spec.ts` が見る。
 */
const PR_STEPS = [
  {
    id: "branch",
    cmd: "git switch -c feature/128-er-labels",
    ja: { title: "作業用の枝を切る", desc: "枝の名前は feature/<番号>-<短い説明> で揃える。" },
    en: { title: "Cut a branch", desc: "Name it feature/<number>-<short-slug>." },
  },
  {
    id: "write",
    cmd: null,
    ja: { title: "テストを先に書く", desc: "動くことを示せていないコードは取り込まない。 1 つの PR で 1 つの話題に絞る。" },
    en: { title: "Write the test first", desc: "Code without proof of behavior is not merged. Keep one PR to one concern." },
  },
  {
    id: "verify",
    cmd: "pnpm verify",
    ja: { title: "検査を通す", desc: "型検査とテストがどちらも通ること。 組み立ても通す。" },
    en: { title: "Make the checks pass", desc: "Both typecheck and tests must pass. Keep the build green too." },
  },
  {
    id: "describe",
    cmd: "Closes #128",
    ja: { title: "説明文を書く", desc: "何を変えたか、 なぜそうしたかを分けて書く。 起票番号を必ず書き添える。" },
    en: { title: "Write the description", desc: "Separate what changed from why. Always link the issue number." },
  },
  {
    id: "open",
    cmd: "gh pr create",
    ja: { title: "出す", desc: "下書きで出しても構わない。 迷った時点で相談してほしい。" },
    en: { title: "Open it", desc: "A draft is fine. Ask as soon as you are unsure." },
  },
] as const;

/**
 * /contribute = 旧 contribute.astro placeholder。 旧版は build 時に CONTRIBUTING.md を fs.read で
 * markdown 変換、 SPA では GitHub 上の CONTRIBUTING.md 直リンクで代替。
 */
export function ContributePage(): React.ReactElement {
  const [locale] = useLocale();
  const isJa = locale === "ja";
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <Breadcrumb 段={[{ 行き先: "/" }, { 字: 画面の名前を引く("/contribute", locale) }]} />
          {/* 区切りの中黒は英語の側で `•` にする (#2455)。 `·` は片仮名の中黒の代わりに
              使われる字なので、画面を描く browser は日本語として数える */}
          <span className="nm-eyebrow">
            {isJa ? "参加のしかた · みんなで作る" : "How to take part • built together"}
          </span>
          {/* 名前の位置が言語で前後する。 色を付ける範囲は名前だけなので、並びごと分ける */}
          <h1 className="nm-hero-title">
            {isJa ? (
              <>
                <span className="nm-gradient-accent">dragon</span> に参加する
              </>
            ) : (
              <>
                Contribute to <span className="nm-gradient-accent">dragon</span>
              </>
            )}
          </h1>
          <p className="nm-hero-subtitle">
            {isJa
              ? "dragon は MIT ライセンスで公開している。 不具合の報告・機能の提案・直したものを送ることのいずれも GitHub 上で受け付けている。 進め方の決まり (テストの書き方、記録の残し方、枝の切り方、見直しの仕方) は CONTRIBUTING.md にまとめてある。"
              : "dragon is published under the MIT license. Bug reports, feature proposals and patches are all accepted on GitHub. The working rules — how to write tests, how to keep records, how to name branches, how reviews run — are collected in CONTRIBUTING.md."}
          </p>
          <div className="nm-hero-actions">
            <a
              href="https://github.com/cardene777/dragon/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-primary"
            >
              <span>{isJa ? "CONTRIBUTING.md を読む" : "Read CONTRIBUTING.md"}</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a
              href="https://github.com/cardene777/dragon/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-secondary"
            >
              <span>{isJa ? "Issue を起票" : "Open an issue"}</span>
            </a>
          </div>
        </section>

        <section className="nm-presets-section" aria-label={isJa ? "参加方法" : "Ways to take part"}>
          <div className="nm-section-head">
            <h2 className="nm-section-title">{isJa ? "参加方法" : "Ways to take part"}</h2>
            <p className="nm-section-desc">
              {isJa
                ? "関わり方は 3 通り (不具合の報告・機能の提案・直したものを送る)。 くわしくは CONTRIBUTING.md を読んでほしい。"
                : "There are three ways in — report a bug, propose a feature, or send a patch. See CONTRIBUTING.md for the details."}
            </p>
          </div>
          {/* 3 枚は組み立てを分けずに並べて書く (#2455)。 一覧から回すと、札の字が式になって
              「画面の札に英語が残っていないか」 を見る検査 (`screen-text`) から読めなくなる */}
          <div className="nm-preset-grid">
            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">{isJa ? "1. 不具合" : "1. Bugs"}</div>
                <span className="nm-preset-eyebrow">{isJa ? "見つけたら伝える" : "Tell us when you find one"}</span>
                <h3 className="nm-preset-title">{isJa ? "不具合の報告" : "Bug report"}</h3>
                <p className="nm-preset-subtitle">
                  {isJa
                    ? "再現の手順・期待した動き・実際に起きたことの 3 つを、GitHub の Issue (不具合の型) で起票する。 いちばん短い再現用のコードが付いていれば、直す側はすぐ動ける。"
                    : "File three things on a GitHub issue with the bug template — the steps to reproduce, the behavior you expected, and what actually happened. With the shortest reproducing snippet attached, whoever fixes it can start at once."}
                </p>
              </header>
              <footer className="nm-preset-card-foot">
                <div className="nm-preset-tags">
                  <span className="nm-preset-tag">{isJa ? "起票" : "Filing"}</span>
                  <span className="nm-preset-tag">{isJa ? "再現手順" : "Repro steps"}</span>
                </div>
                <a
                  href="https://github.com/cardene777/dragon/issues/new?template=bug-report.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nm-preset-docs"
                >
                  <span>{isJa ? "不具合を起票" : "Report a bug"}</span>
                  <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>

            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">{isJa ? "2. 提案" : "2. Ideas"}</div>
                <span className="nm-preset-eyebrow">{isJa ? "欲しいものを出す" : "Ask for what you want"}</span>
                <h3 className="nm-preset-title">{isJa ? "機能提案" : "Feature proposal"}</h3>
                <p className="nm-preset-subtitle">
                  {isJa
                    ? "新しい記法・新しい見本・動きの機能などの提案。 何に使いたいかと期待する動きを、提案の型で出す。 話し合い → 合意 → 実装 → 取り込み依頼 の順で進む。"
                    : "Proposals for new notation, new samples or motion features. Send what you want to use it for and the behavior you expect, using the proposal template. It runs discussion → agreement → implementation → pull request."}
                </p>
              </header>
              <footer className="nm-preset-card-foot">
                <div className="nm-preset-tags">
                  <span className="nm-preset-tag">{isJa ? "機能の追加" : "New features"}</span>
                  <span className="nm-preset-tag">{isJa ? "話し合い" : "Discussion"}</span>
                </div>
                <a
                  href="https://github.com/cardene777/dragon/issues/new?template=feature-request.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nm-preset-docs"
                >
                  <span>{isJa ? "機能を提案" : "Propose a feature"}</span>
                  <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>

            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">3. PR</div>
                <span className="nm-preset-eyebrow">{isJa ? "直したものを送る" : "Send what you fixed"}</span>
                <h3 className="nm-preset-title">Pull Request</h3>
                <p className="nm-preset-subtitle">
                  {isJa
                    ? "テストを先に書く (動くことを示せていない変更は取り込まない)。 型検査と組み立てがどちらも通っていること。 1 つの PR で扱う主題は 1 つに絞る。 くわしくは CONTRIBUTING.md の取り込み依頼の節を読んでほしい。"
                    : "Write the test first; a change with no proof of behavior is not merged. Typecheck and build must both pass. Keep one PR to one topic. See the pull request section of CONTRIBUTING.md for the details."}
                </p>
              </header>
              <footer className="nm-preset-card-foot">
                <div className="nm-preset-tags">
                  <span className="nm-preset-tag">{isJa ? "テスト" : "Tests"}</span>
                  <span className="nm-preset-tag">{isJa ? "1 PR = 1 つの主題" : "One topic per PR"}</span>
                </div>
                <a
                  href="https://github.com/cardene777/dragon/pulls"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nm-preset-docs"
                >
                  <span>{isJa ? "PR を作成" : "Open a pull request"}</span>
                  <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>
          </div>
        </section>

        <section className="pr-steps" aria-label={isJa ? "PR を出すまでの 5 手順" : "Five steps to a pull request"}>
          <div className="nm-section-head">
            <span className="nm-eyebrow">{isJa ? "変更を届ける" : "PULL REQUEST"}</span>
            <h2 className="nm-section-title">
              {isJa ? "PR を出すまでの 5 手順" : "Five steps to a pull request"}
            </h2>
            <p className="nm-section-desc">
              {isJa
                ? "上の 3 通りのうち、直したものを送る道は手を動かす人向け。 枝を切ってから出すまでを順に置いた。 くわしくは CONTRIBUTING.md の開発の流れの節。"
                : "Of the three routes above, a PR is the hands-on one. Here is the path from branching to opening it. See CONTRIBUTING.md for details."}
            </p>
          </div>
          <ol className="pr-step-list">
            {PR_STEPS.map((s, i) => (
              <li key={s.id} className="pr-step">
                <div className="pr-step-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="pr-step-body">
                  <h3 className="pr-step-title">{isJa ? s.ja.title : s.en.title}</h3>
                  <p className="pr-step-desc">{isJa ? s.ja.desc : s.en.desc}</p>
                </div>
                {s.cmd === null ? (
                  <div className="pr-step-cmd is-empty" aria-hidden="true">
                    —
                  </div>
                ) : (
                  <code className="pr-step-cmd">{s.cmd}</code>
                )}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
