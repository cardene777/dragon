# dragon に手を貸す

[English](CONTRIBUTING.md)

手を貸そうと考えてくれてありがとう。
案も不具合の報告も pull request も歓迎で、英語と日本語のどちらで書いてもよい。
参加する人は全員 [行動規範](CODE_OF_CONDUCT.md) に従う。

残作業の数え方や依存の例外の記録のような、管理者だけが使う決まりは [`docs/maintaining.md`](docs/maintaining.md) にある。
直しを送るだけなら読まなくてよい。

## 始め方

```bash
git clone https://github.com/cardene777/dragon.git
cd dragon
pnpm install
pnpm build:packages  # 検査が読む描画の package の dist を作る
pnpm test            # vitest で全ての検査を回す
pnpm dev             # http://localhost:4323 で見本帳を起動する
```

何かを変える前に、全ての検査が通ることを確かめる。

## repo の構成

| path | 中身 |
| --- | --- |
| `packages/dragon/` | 原本の JSON、行ごとの記法、描画、書き出しの命令 (`@cardenelabs/dragon`) |
| `apps/playground-spa/` | GitHub Pages に配る見本帳 (Vite と React 19)。編集画面で記法を書くと動く図になる |
| `test-support/` | vitest の前処理。package の `dist` が `src` より古くないかを見る |

描く部品は `packages/dragon` の中に持ち、別の描画の package には頼らない。

## 直しを送る流れ

1. 困りごとか案を Issue に書く。
2. repo を fork し、直しの branch を作る。
3. 検査を先に書く。動くことを示す検査の無い code は取り込まない。
4. 一式を回す。

   ```bash
   pnpm verify
   ```

5. pull request を出す。

`pnpm verify` は型の検査、build、lint、全ての検査を、短い側から順に回す。
変えた所の近くの検査だけでなく、全てを回す。
変えた file を読む検査が、その file の近くに在るとは限らない。
たとえば `packages/dragon/examples/` の例を 1 つ直すと、その例を変換する検査、描く検査、書き出す検査が影響を受ける。
build が 2 番目に回るのは、検査が build 済みの package を読むためで、詳しくは次の節にある。

## 検査

直しを送る前に通すのは `pnpm verify` の 1 つ。
ほかの命令は、落ちた所を切り分ける時に使う。

```bash
pnpm verify      # 型の検査、build、lint、検査を順に回す
pnpm test        # vitest の全ての検査 (unit と integration)
pnpm test:watch  # vitest を watch で回す
pnpm lint        # eslint
pnpm typecheck   # 全ての workspace に tsc -b
pnpm build       # 描画の package と見本帳
```

新しい機能を足す pull request には検査を添える。
置き場は `packages/dragon/test/` か `apps/playground-spa/src/lib/` のどちらか。

検査は `@cardenelabs/dragon` を package として読む (`dist` を読む)。
`pnpm test` は build をしないので、`src` を直したら `pnpm build:packages` を回してから検査を回す。
古い `dist` が残っていると、検査は始まる前に「dist が src より古い package がある」で止まる (`test-support/global-setup.ts`)。

`packages/dragon/test/export.test.ts` は画面なしの Chromium で MP4、GIF、HTML、PNG を書き出して確かめる。
Chromium を入れていない機械では、先に 1 度だけ入れる。

```bash
pnpm exec playwright install chromium
```

## 依存を変える時

依存を足すか上げた時は、lockfile に既知の脆弱性が残っていないかを確かめる。

```bash
bash scripts/check-dependency-vulnerabilities.sh
```

この script は `osv-scanner` で `pnpm-lock.yaml` を読む。
何も見つからなければ 0、見つかれば 1、走らせられなければ 2 で終わる (`osv-scanner` が入っていない時など)。
何も見つからなくても、`osv-scanner.toml` に今の依存のどれにも当たらない記録が残っていれば 3 で終わる。
期待は 0。
見つかった時は、まず `pnpm install` で入れ直す。大半はそれで消える。
入れ直しても残った時は pull request にそう書き、どう扱うかは管理者が決める。

上げた後は build と検査に加えて `pnpm dev` も起動する。
build と開発 server は code を別々に束ねるので、build が通っても開発 server だけが落ちることがある。

## pull request

- 1 つの pull request には 1 つの関心だけを入れる。機能、直し、refactor を混ぜない。
- 題の頭に種類を書く。`feat`、`fix`、`docs`、`refactor`、`test`、`chore` のどれか。
- 説明には、変えた理由、影響する所、確かめ方を書く。pull request の雛形も同じ見出しを持つ。

## commit message

絵文字と種類で始め、要点を英語か日本語で短く書く。

| 絵文字 | 用途 |
| --- | --- |
| `✨` | 新しい機能 |
| `🐛` | 不具合の直し |
| `📝` | 文書 |
| `♻️` | refactor |
| `✅` | 検査 |
| `🎨` | 見た目や整形 |
| `⚡` | 速さ |
| `🔧` | 道具や設定 |

例は `✨ feat(dragon): sequence preset を追加`。

## code style

- TypeScript は全てで strict mode にし、`any` を使わない。
- `pnpm lint` (eslint) を回す。問題を知らせるだけで、直しはしない。
- 整形は触った `.ts` と `.tsx` だけに `npx prettier --write <path>` で掛ける。設定は `.prettierrc` にある。repo 全体は整形しない。
- markdown には prettier を掛けない。表の桁を字の数で揃えるので、日本語の表がずれる。
- import は標準の lib、外部の package、自分の package、相対 path の順に並べる。
- 1 つの file には 1 つの責務だけを持たせ、大きくなる前に分ける。

## license

dragon は [MIT License](LICENSE) で配る。
手を貸した分も同じ license で配ることに同意したものとみなす。
