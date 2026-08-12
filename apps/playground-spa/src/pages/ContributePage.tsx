import { Link } from "react-router";
import { SiteHeader } from "@/components/SiteHeader";
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
    ja: { title: "branch を切る", desc: "branch 名は feature/<番号>-<短い説明> で揃える。" },
    en: { title: "Cut a branch", desc: "Name it feature/<number>-<short-slug>." },
  },
  {
    id: "write",
    cmd: null,
    ja: { title: "test を先に書く", desc: "動作証明のないコードは merge の対象外。 1 つの PR で 1 つの話題に絞る。" },
    en: { title: "Write the test first", desc: "Code without proof of behavior is not merged. Keep one PR to one concern." },
  },
  {
    id: "verify",
    cmd: "pnpm verify",
    ja: { title: "検査を通す", desc: "型検査と test がどちらも通ること。 build も緑にする。" },
    en: { title: "Make the checks pass", desc: "Both typecheck and tests must pass. Keep the build green too." },
  },
  {
    id: "describe",
    cmd: "Closes #128",
    ja: { title: "説明文を書く", desc: "何を変えたか、 なぜそうしたかを分けて書く。 起票番号を必ず結ぶ。" },
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
  return (
    <div>
      <SiteHeader />
      <main>
        <section className="nm-hero">
          <nav aria-label={locale === "ja" ? "パンくずリスト" : "Breadcrumb"} className="nm-crumb">
            <Link to="/">概要</Link>
            <span aria-hidden="true">›</span>
            <span className="cur">コントリビュート</span>
          </nav>
          <span className="nm-eyebrow">CONTRIBUTE · OPEN SOURCE</span>
          <h1 className="nm-hero-title">
            <span className="nm-gradient-accent">dragon</span> にコントリビュートする
          </h1>
          <p className="nm-hero-subtitle">
            dragon は MIT License の OSS プロジェクト。 バグ報告 / 機能提案 / PR は GitHub Issues と Pull Request 経由で歓迎する。 開発ガイドライン (test / commit / branch / review) は CONTRIBUTING.md で SSOT。
          </p>
          <div className="nm-hero-actions">
            <a
              href="https://github.com/cardene777/dragon/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-primary"
            >
              <span>CONTRIBUTING.md を読む</span>
              <span className="nm-hero-btn-arrow" aria-hidden="true">↗</span>
            </a>
            <a
              href="https://github.com/cardene777/dragon/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="nm-hero-btn nm-hero-btn-secondary"
            >
              <span>Issue を起票</span>
            </a>
          </div>
        </section>

        <section className="nm-presets-section" aria-label="コントリビュート方法">
          <div className="nm-section-head">
            <h2 className="nm-section-title">コントリビュート方法</h2>
            <p className="nm-section-desc">
              3 経路で貢献可能 (バグ報告 / 機能提案 / PR)。 詳細は CONTRIBUTING.md SSOT を参照。
            </p>
          </div>
          <div className="nm-preset-grid">
            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">1. bug</div>
                <span className="nm-preset-eyebrow">BUG REPORT</span>
                <h3 className="nm-preset-title">バグ報告</h3>
                <p className="nm-preset-subtitle">
                  再現手順 + 期待動作 + 実際の挙動 を GitHub Issue (bug template) で起票。 最小再現コードが付いていれば maintainer は素早く対応できる。
                </p>
              </header>
              <footer className="nm-preset-card-foot">
                <div className="nm-preset-tags">
                  <span className="nm-preset-tag">issue</span>
                  <span className="nm-preset-tag">reproduction</span>
                </div>
                <a
                  href="https://github.com/cardene777/dragon/issues/new?template=bug-report.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nm-preset-docs"
                >
                  <span>バグを起票</span>
                  <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>

            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">2. feature</div>
                <span className="nm-preset-eyebrow">FEATURE REQUEST</span>
                <h3 className="nm-preset-title">機能提案</h3>
                <p className="nm-preset-subtitle">
                  新 DSL 構文 / 新プリセット / アニメーション機能などの提案。 用途 + 期待動作を feature template で提出。 議論 → 合意 → 実装 → PR の順で進む。
                </p>
              </header>
              <footer className="nm-preset-card-foot">
                <div className="nm-preset-tags">
                  <span className="nm-preset-tag">feature</span>
                  <span className="nm-preset-tag">discussion</span>
                </div>
                <a
                  href="https://github.com/cardene777/dragon/issues/new?template=feature-request.yml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nm-preset-docs"
                >
                  <span>機能を提案</span>
                  <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>

            <article className="nm-preset-card">
              <header className="nm-preset-card-head">
                <div className="nm-preset-id">3. PR</div>
                <span className="nm-preset-eyebrow">PULL REQUEST</span>
                <h3 className="nm-preset-title">Pull Request</h3>
                <p className="nm-preset-subtitle">
                  テスト先行 (TDD 推奨、 動作証明なし PR は merge 対象外) + typecheck / build 緑必須 + 1 PR = 1 concern。 詳細は CONTRIBUTING.md § Pull request SSOT。
                </p>
              </header>
              <footer className="nm-preset-card-foot">
                <div className="nm-preset-tags">
                  <span className="nm-preset-tag">test</span>
                  <span className="nm-preset-tag">1 PR = 1 concern</span>
                </div>
                <a
                  href="https://github.com/cardene777/dragon/pulls"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nm-preset-docs"
                >
                  <span>PR を作成</span>
                  <span className="nm-preset-docs-arrow" aria-hidden="true">↗</span>
                </a>
              </footer>
            </article>
          </div>
        </section>

        <section className="pr-steps" aria-label={locale === "ja" ? "PR を出すまでの 5 手順" : "Five steps to a pull request"}>
          <div className="nm-section-head">
            <span className="nm-eyebrow">PULL REQUEST</span>
            <h2 className="nm-section-title">
              {locale === "ja" ? "PR を出すまでの 5 手順" : "Five steps to a pull request"}
            </h2>
            <p className="nm-section-desc">
              {locale === "ja"
                ? "上の 3 経路のうち PR は手を動かす人向け。 branch を切ってから出すまでを順に置いた。 詳細は CONTRIBUTING.md § 開発フロー。"
                : "Of the three routes above, a PR is the hands-on one. Here is the path from branching to opening it. See CONTRIBUTING.md for details."}
            </p>
          </div>
          <ol className="pr-step-list">
            {PR_STEPS.map((s, i) => (
              <li key={s.id} className="pr-step">
                <div className="pr-step-num">{String(i + 1).padStart(2, "0")}</div>
                <div className="pr-step-body">
                  <h3 className="pr-step-title">{locale === "ja" ? s.ja.title : s.en.title}</h3>
                  <p className="pr-step-desc">{locale === "ja" ? s.ja.desc : s.en.desc}</p>
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
