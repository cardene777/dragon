# 検知と修正の仕組み

dragon の図と画面の不具合を見つける仕組み (検知) と、図の書き方を直す仕組み (修正) の案内。
root の `README.md` はこの説明書を正として案内する。

---

## 役割の分け方 = 検知システムと修正システム

| 仕組み | 使う人 | 何のためか | 走らせ方 |
|---|---|---|---|
| 検知システム | dragon と描画エンジン (`@cardenelabs/cdl`) を作る開発者 | 実装の不具合を見つける。 取り込む前に手元で回す | `pnpm check:all` など (下の節) |
| 修正システム | 図を書く人 (`presets.cdl.ts` を書く開発者と、dragon の記法を書く外の利用者) | 読む人へ伝わらない書き方を決まった規則で指摘し、直せるものは直す | `pnpm lint:notation` / `pnpm fix:notation` |

どちらも言語モデルを使わない。
図の寸法と決まった規則だけで判定するので、同じ入力には同じ結果を返し、走らせる費用もかからない。

---

## 検知システム = 3 層の検査

| 層 | 何を見るか | 検査のファイル | 命令 |
|---|---|---|---|
| 層 1 = 画面 | 画面の検査を全て走らせる。 画面を開いて見出しが見えること、端末の誤りが出ないこと、図の字や線が重ならないことなど | `apps/playground-spa/tests/` | `pnpm check:cdl` |
| 層 2 = 図の置き方 | カタログの全ての図を描画エンジンの検査 (`visualValidateAll`) に通し、どの軸でも重さが `error` の違反が無いことを見る | `packages/dragon/test/visual-validate-sweep.test.ts` | `pnpm check:dragon` |
| 層 3 = 型ごとの描き方 | 描いた SVG の形を図の型ごとに測る (工程表の矢印の向き、絞り込み図の幅の減り方など)。 画面をわざと壊し、判定が違反を見つけることも確かめる | `apps/playground-spa/tests/kind-geometry-check.spec.ts` と `apps/playground-spa/tests/kind-geometry-check.proof.spec.ts` | `pnpm check:kind` |

`pnpm check:all` は型検査 (`pnpm typecheck`) と 3 つの層を順に走らせる。
層 1 は画面の検査を全て走らせるので層 3 の 2 本も含み、`pnpm check:all` では層 3 が 2 度走る。

画面の検査 (層 1 と層 3) は build 済の画面を見る。
走らせる前に立てる server と、見に行く先の差し替え方は `CONTRIBUTING.md` の「画面の検査 (Playwright)」 の節にある。

表の命令が表のファイルを走らせることは、画面側の検査 (`apps/playground-spa/src/lib/audit-readme-detect.test.ts`) が `package.json` を展開して照らす。
「何を見るか」 の欄は機械で照らしていないので、検査の判定を変えた時は検査のファイルと見比べて直す。

### 層 1 の中の全体の回帰検査

全体の回帰検査 (`apps/playground-spa/tests/full-regression.spec.ts`) は、画面の行き先の型 (`main.tsx` の `<Route path>`) ごとに 1 つ以上の画面と、カタログの全ての分類の画面を開く。
端末の誤りが 1 件でも出たら落ち、行き先の型に開く画面が対応していない抜けも数える (#1950)。

### 層 2 が見る図と外す図

見る図は、検査のファイルに並べたカタログの読み込み口 (`sources`) から集める。
カタログの一覧に載る図が 1 つ残らず対象に入っていることは、同じファイルの検査が確かめる (#1405)。

線が箱を貫くこと自体が図の意図である図は、図と軸の組を名指しして外す (`見逃す組の一覧`)。
名指しした組が実物でその軸の違反を出していることも確かめ、当たらなくなった組を残さない (#1730)。

### 層 3 の軸と実証

軸 (何を測ってどう判定するか) は `apps/playground-spa/tests/helpers/kind-geometry-axes.ts` の表が持つ。
本番の検査と実証の検査はどちらもこの表を回し、実証は壊した画面で本番と同じ判定が違反を見つけることを確かめる。
表の 1 行は壊し方を持たないと組めないので、実証の無い軸は作れない (#1952)。

### 層 3 を足した理由

描画エンジンに図表や工程表などの型を足した時、層 1 と層 2 はどちらも型の中の形を見られなかった。
層 1 は画面が出るかを見るだけで、層 2 は描画エンジンが置いた箱と線しか見ないため。

例は、工程表の依存の矢印の折れ方の崩れと、フローの線が面に塗られて見える崩れ。
どちらも層 1 と層 2 では見つからず、人が目で見つけた。

---

## 修正システム = 記法の検査 (`notation lint`)

### 何のためか

図の書き手 (`presets.cdl.ts` を書く開発者と、dragon の記法を書く外の利用者) が、見た目は動くのに読む人へ伝わらない図を作った時に、決まった規則で指摘する。
見るのは、図の説明に入り込んだ実装の書き方、無い部品を指す参照、値や項目が空の図表と四象限図。

例は、図の説明が `chart preset (SVG polyline + 縦軸目盛)` のように作り手の書き方になっている図、工程表の作業の `dependsOn` が無い作業を指す図、枝分かれ図の枝の `parent` が無い枝を指す図。

### 規則の一覧

| 規則 | 重さ | 自動修正 | 何を見るか |
|---|---|---|---|
| `topic-redundant-implementation-detail` | ⚠ 注意 | できる (条件は下の節) | 図の説明に実装の書き方 (`preset (…)` / `render 未実装` / `SVG` の描き方の名前 (`polyline` など) / `polygon`) が入っている |
| `chart-empty-datum` | ⚠ 注意 | できない | 図表 (`chart-line` / `chart-pie` / `chart-bar`) に値 (`datum`) が 1 件も無い |
| `chart-single-datum` | ℹ 参考 | できない | 図表の値が 1 件だけ |
| `gantt-unknown-depends-on` | ⚠ 注意 | できない | 工程表の作業の `dependsOn` が、無い作業を指している |
| `mindmap-unknown-parent` | ⚠ 注意 | できない | 枝分かれ図の枝の `parent` が、中心にも他の枝にも無い |
| `tree-unknown-parent` | ⚠ 注意 | できない | 階層図の項目の `parent` が、無い項目を指している |
| `quadrant-empty` | ⚠ 注意 | できない | 四象限図に項目 (`item`) が 1 件も無い |
| `quadrant-single-quadrant` | ℹ 参考 | できない | 四象限図の項目が 4 件以上あり、すべて 1 つの区画に入っている |
| `funnel-increasing-count` | ⚠ 注意 | できない | 絞り込み図の段階の数が、前の段階より多い (状態から取る `{名前}` の数は比べない) |

重さの呼び名は、記法の検査の道具が端末に出す呼び名と同じ。
表の規則・重さ・自動修正の 3 つの欄は、画面側の検査 (`apps/playground-spa/src/lib/audit-readme-lint.test.ts`) が記法の検査の実物と照らす。
「何を見るか」 の欄は機械で照らしていないので、規則の条件を変えた時は `packages/dragon/src/notation-lint.ts` と見比べて直す。

### 走らせ方

```bash
# カタログの図に記法の検査を当て、指摘を端末に出す (自動修正は当てない)
pnpm lint:notation

# カタログの presets.cdl.ts に自動修正を当てた結果を、隣の presets.lint-fix.json に書き出す (指摘がある時だけ)
pnpm fix:notation

# 実証用の台本。 わざと問題を入れた図に当て、全ての規則が指摘を出すことを確かめる
pnpm lint:notation:proof
```

任意の file に当てる時。

```bash
node packages/dragon/scripts/dragon-lint.mjs path/to/your.cdl.ts
node packages/dragon/scripts/dragon-lint.mjs --fix path/to/your.cdl.ts
```

### 自動修正の挙動

自動修正 (`autoFix`) が直すのは図の説明の規則だけで、他の規則は手で直す。

1. 図の説明が型の名前 (`gantt` など) で始まる時は、説明全体を「{何を示すか}を示す{カタログの名前}」 に書き換える。 型の一覧は `notation-lint.ts` の検出の正規表現が、書き換え先は書き換え先の表 (`KIND_TO_JA`) が持つ
2. 型の名前で始まらない時は、括弧の中の実装の言葉と `preset` / `render` の語だけを消す。 3 字に満たなくなった時は `図の説明` にする

例。

- `chart preset (SVG polyline + tone 別 slice)` → `項目ごとの数値を示すグラフ`
- `gantt preset (Release timeline)` → `作業の期間と前後の関係を示す工程表`
- `mindMap preset (Project ideas)` → `中心の主題から広がる発想を示す枝分かれ図`
- `ログイン (render 未実装)` → `ログイン`

括弧の外に実装の言葉がある説明 (`SVG polyline を使う`) は、自動修正を当てても字が変わらない。
この時の指摘は自動修正できる数に入れず、修正案は直し方の文になる (#1940)。

### プログラムから使う

`@cardenelabs/dragon` が書き出す。

```ts
import { lintDiagram, autoFix, type LintReport, type LintIssue } from "@cardenelabs/dragon";

const report: LintReport = lintDiagram(diagram);
console.log(report.issues); // LintIssue[]
console.log(report.autoFixableCount);

const patched = autoFix(diagram); // 自動修正できる指摘を直した新しい図を返す (元の図は変えない)
```

---

## 実装のファイル

| 何か | ファイル |
|---|---|
| 層 1 の検査の置き場所 | `apps/playground-spa/tests/` |
| 層 2 の検査 | `packages/dragon/test/visual-validate-sweep.test.ts` |
| 層 3 の軸の表 | `apps/playground-spa/tests/helpers/kind-geometry-axes.ts` |
| 記法の検査 | `packages/dragon/src/notation-lint.ts` |
| 記法の検査の道具 | `packages/dragon/scripts/dragon-lint.mjs` |
| 説明書を照らす検査 | `apps/playground-spa/src/lib/audit-readme-detect.test.ts` (検知) と `apps/playground-spa/src/lib/audit-readme-lint.test.ts` (修正) |

---

## 関連する Issue

- #1405 (層 2 の対象に全ての図を入れる)
- #1730 (層 2 の外す図を実物と照らす)
- #1948 (修正システムの節を今の挙動に合わせる)
- #1950 (全体の回帰検査が全ての行き先と分類を開く)
- #1952 (層 3 の本番と実証を 1 つの表で回す)
- #1955 (検知システムの節を実物の命令と検査のファイルに合わせる)
