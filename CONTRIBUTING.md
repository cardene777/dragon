# Contributing to dragon

Thanks for considering a contribution. dragon は小さな OSS プロジェクトで、 idea / bug 報告 / pull request どれも歓迎。

## Quick start

```bash
git clone git@github.com:cardene777/dragon.git
cd dragon
pnpm install
pnpm test            # vitest 全 pass を確認
pnpm dev             # http://localhost:4323 で playground SPA 起動
```

`pnpm test` で全件 pass する状態が baseline。 ローカル開発開始前に必ず緑を確認。

## monorepo の構成

| path | 役割 |
| --- | --- |
| `packages/dragon/` | text DSL parser (`@cardenelabs/dragon`) ... YAML-like → CdlDiagram |
| `apps/playground-spa/` | Vite + React 19 + Tailwind 4 SPA ... Catalog + Editor + Compare + Docs |

engine (`@cardenelabs/cdl`) は別 repo (`github.com/cardene777/cdl`) SSOT。

## 開発フロー

1. issue を起票
2. `feature/{N}-{slug}` で branch 切り
3. test 先行 (TDD 推奨、 動作証明のないコードは merge 対象外)
4. `pnpm test` + `pnpm typecheck` + `pnpm build` が緑になるか確認
5. pull request を起票

## 残作業の数え方

この repo の issue は **Linear と GitHub の 2 箇所**にある。 片方だけ見ると残作業が見えない。

「残りゼロ」 と判断する前に、両方を実測する。

### Linear 側

完了扱いの状態は `Done` / `Canceled` / `Duplicate` の 3 つで、**それ以外は全て残作業**。
状態は後から増えるため、残っている状態を数え上げるのではなく
**完了扱いの 3 つを除いた残り全部**として数える。

```text
mcp__linear__list_issue_statuses  team=Cardene
mcp__linear__list_issues  team=Cardene  state=<完了扱いでない状態>
```

**team 全体で数えて、dragon の話かどうかは本文で判定する。**
`project=dragon` で絞ると、project が未設定の issue が丸ごと消える。 未設定は起票直後に
起きやすいが `Triage` に限らず、どの状態でも起こりうる。 件数が多くて絞りたい時も、
project で絞った数を「残り全部」 として報告しない。

実測すると、`Backlog` と `In Progress` を `project=dragon` で数えるだけでは
**この手順そのものの issue (`CAR-2948`) が数から消える**。 `Triage` にあり project が未設定のため。

### GitHub 側

```bash
gh issue list -R cardene777/dragon --state open --limit 200
gh pr list -R cardene777/dragon --state open --limit 200
```

`--limit` を省くと **30 件で黙って打ち切られる**。 返ってきた件数が `--limit` と同じなら
まだ先があるので、上限を上げて数え直す。

### Linear の tool が見当たらない時

**「tool が無い」 を「Linear は非該当」 と読み替えない。** これがそのまま数え漏れになる。

`.mcp.json` に Linear の登録があることは、**server が登録済である**ことしか示さない。
tool が出ない理由は他にもある。

| 理由 | 確かめ方 |
|---|---|
| 未認証 | 下記の command で認証すると出る |
| client が MCP 未対応、または server を無効にしている | client 側の設定を見る |
| 接続の許可をまだ与えていない | client が確認を出していないか見る |
| network から Linear に届いていない | 他の外部通信が通るか見る |
| workspace に招待されていない | 認証まで進んでも issue が見えない |

認証の command は client ごとに違う。

- Claude Code ... `claude mcp login linear` (`/mcp` から選んでもよい)
- Codex CLI ... `codex mcp login linear`

**Linear は private な workspace で、外部の contributor は招待されていない。**
その場合は GitHub 側だけを数え、報告に **「Linear は数えていない」 と明記する**。
数えていない source を 0 件として書かない。

### なぜこの手順があるか

2026-08-06 の棚卸しで、GitHub が 0 件になった時点で Linear の tool が出ておらず、
`.mcp.json` を見ないまま「非該当」 と判断した。 実際は未認証だっただけで、認証したら
Backlog 7 件 / In Progress 4 件が残っていた。 そのまま報告していれば 11 件を見落として
「残作業 0」 と書くところだった。

**この手順の最初の版も同じ誤り方をしていた。** 認証後に数えた 2 つの状態
(`Backlog` / `In Progress`) をそのまま手順に書いたため、`Triage` にある project 未設定の
issue が数から漏れた。 数え方を「見た状態の列挙」 で書くと、見ていない状態が
最初から存在しないことになる。 だから完了扱いを除く形で書いてある。

経緯は `#1055` と `#1056` に残っている。

## Tests

```bash
pnpm test                                        # vitest 全件 (unit + integration)
pnpm test:watch                                  # vitest watch mode
pnpm lint                                        # eslint
pnpm typecheck                                   # tsc -b 全 workspace
```

新機能を追加する PR は test を必ず添える。 test の置き場所は `packages/dragon/test/` または `apps/playground-spa/tests/` のいずれか。

### 画面の検査 (Playwright)

**server を 2 つ立ててから回す**。 立てずに回すと、見に行く先が無い検査がまとめて落ちる。

```bash
# 1. 本番 build の preview (ほぼ全ての検査がここを見る)
pnpm build
cd apps/playground-spa && pnpm preview

# 2. 開発 server (`/__render` を使う spec だけがここを見る、別の terminal で)
pnpm dev

# 3. 検査を回す (さらに別の terminal で)
pnpm --filter dragon-playground-spa test:e2e
```

**検査は build 済の画面を見る**。 開発 server を見ていた間、実行中に file を編集すると
Vite が繋いでいる画面を全再読み込みし、走行中の検査が巻き添えで落ちていた (#1438)。
落ち方が「要素が現れず時間切れ」 に見えるため flake と区別が付かない。 build 済の画面は
編集で作り直されないので、この経路が消える。

代償として **画面を直したら `pnpm build` を回し直す**。 preview が配るのは build の成果物で、
`src/` の編集は自動では反映されない。

開発 server が要るのは `row-bounds-offset.spec.ts` だけ。 図を流し込む頁 (`/__render`) が
`import.meta.env.DEV` の時しか繋がらず、build 済には route が無いため。 対象は
`playwright.config.ts` の `開発serverの検査` が持つ。

`prod-check` / `a11y-check` / `final-check` の 3 spec は従来どおり `PROD_BASE_URL` から
自分で絶対 URL を組んで preview を見る。

port は `apps/playground-spa/ports.ts` が持つ。 開発と preview で別の port を使うので、
2 つを同時に立てたままにできる。

文書 (この手引きや `README.md`) に書いた `localhost:<数字>` は、`src/lib/ports.test.ts` が
`ports.ts` と突き合わせる (#2054)。 port を変えたら文書の数字も直す。 preview の URL は
`/dragon/` まで書く (base path の下にしか配らない)。

**spec の `goto` は先頭 `/` を付けずに書く**。 build 済は `/dragon/` の下に配られ、
`new URL(path, base)` は先頭 `/` を「origin 直下」 と読んで base を捨てる = `goto("/editor")`
は base の外を開き、画面が出ないまま落ちる。 `src/lib/spec-base-url.test.ts` が literal の
先頭 `/` を検出する。

見に行く先は環境変数で差し替えられる。

| 変数 | 差し替える先 | 既定 |
| --- | --- | --- |
| `SPA_URL` | build 済を見る検査 (大半) | `ports.ts` の `PREVIEW_BASE_URL` |
| `DEV_SPA_URL` | 開発 server を見る spec | `ports.ts` の `DEV_URL` |
| `PROD_BASE_URL` | 本番 build を見る 3 spec | `ports.ts` の `PREVIEW_URL` |

**依存の版を上げた直後は server を立て直す**。 Vite は起動時に依存を抱え込むため、
動いている server は古い版を配り続ける。

開発 server を見る spec は、開発 server を立て直す。 port を別の作業が使っていて立て直せない時は、
空いている port で立て、`DEV_SPA_URL` でそこへ向ける (#2052)。 `SPA_URL` は build 済を見る検査の
差し替えで、開発 server を見る spec には届かない。

```bash
pnpm -C apps/playground-spa dev --port <空いている port> --strictPort
DEV_SPA_URL=http://localhost:<空いている port> pnpm -C apps/playground-spa exec playwright test --project dev
```

立てた時に `Re-optimizing dependencies because lockfile has changed` が出れば、束は作り直されている。
束が古いかは `dev-deps-fresh.setup.ts` が見て、古ければ直し方を出して止まる。

#### 書いた cmd が実在することを検査で見る

この節に書いた `pnpm` の cmd は `src/lib/contributing-commands.test.ts` が
`package.json` と突き合わせる。

実在しない script を `--filter` 付きで呼ぶと、pnpm は **黙って skip して exit 0 を返す**。
以前この節には `pnpm --filter dragon-playground-spa test` と書かれていたが、その script は
無く、手順どおりに打つと 1 件も走らないまま「成功」 に見えていた (`#1328`)。

### 値が動くことの検査は実経路に載せる

記法に書いた値 (`states:` / `values:`) が動くことを見る検査は、**描画側と同じ入口を通す**。

```ts
// 記法 → 組み立て → 配置 → その瞬間に描画側が読む値
const values = computeStateValues(layout(textDslToDiagram(src)), 段, 進み);
```

engine の解く関数 (`applyDerivedValues` / `withDerivedValues`) を検査から直接呼ばない。
渡す値を手で組み立てると、**図に状態が 1 件も載らない形を通り抜ける**。 実際に
`#1179` はこの書き方で「値が届く」 ことを証明したつもりになり、`animation:` を書かない図で
値が 1 つも届かない状態を素通りさせた。 `packages/dragon/test/values-compile.test.ts` の
「検査が実経路を迂回していない」 が、検査 file 全件を走査してこれを禁止している。

**値が絵に出るところまで見る検査を 1 本は置く**
(`apps/playground-spa/src/lib/values-on-screen.test.tsx`)。 値の計算が合っていても、その値を
描く経路が無ければ画面は変わらない。 実際に `#1173` は 110 件に手を入れて 79 件が画面上
動かず、宣言だけを見る検査がそれを「動いている」 と判定した。

```ts
const svg = renderToStaticMarkup(<CdlDiagramView diagram={textDslToDiagram(src)} />);
expect(svg).toContain(">6<");
expect(svg).not.toContain("{waiting}");
```

段の途中 (`進み` が 0 と 1 の間) は静止した描画では作れないので、そこは
`computeStateValues` を直接見る。 2 段の役割はこう分かれる。

| 段 | 見るもの |
|---|---|
| `computeStateValues` | 段ごとの値、段の補間の途中の値、解けない値の扱い |
| SVG 文字列 | 値が実際に絵の文字として出ること (描く経路の有無を含む) |

### 対象を決める規則を変える前に実データで数える

検査が「どの入力を対象とみなすか」 を決める規則 (述語) を書き換える時は、**変更の前後で
実データの母集団を数えてから決める**。 手で書いた反例は述語を確かめる材料であって、決める
材料にしない。

数えるのは 3 つ。

| # | 数えるもの |
|---|---|
| 1 | いまの述語が「対象」 とみなす件数 |
| 2 | 新しい述語が「対象」 とみなす件数 |
| 3 | 1 と 2 で判定が変わる件数と、その具体例 |

3 が 0 件なら、その変更は実データに対して何もしていない。 変える理由を書き直す。
0 件でないなら、変わった件が意図した向きかを 1 件ずつ見る。

手で書いた反例で確かめられるのは「この形は通る / 通らない」 までで、**その形が実データに
何件あるか** は分からない。 そこを飛ばすと、理論上ありうる形を根拠に述語を厳しくして、
実在する多数派を巻き込む。

`#1279` で実際に踏んだ。 `changelog-covers-commits.test.ts` の「commit の本文のどの行を
元件名とみなすか」 という述語 1 つを、review 4 round にわたって往復させている。

| round | 述語 | 外れ方 |
|---|---|---|
| 3 | `* ` + commit 件名の形 | 厳しすぎ。 `(#N Round 1)` のような注記付き 109 行を落とす |
| 4 | 列 0 の `* ` を全て、`some` | 緩すぎ。 説明の箇条書きが未記載の元件名を隠す |
| 5 | 列 0 の `* ` を全て、`every` | 厳しすぎ。 番号を持たない行を「未記載の元件名」 と数える |
| 6 | 番号を名乗った元件名だけ `every` | 収束 |

round 3 と round 5 の外れは、どちらも **実履歴を数えて初めて分かった**。 数えていれば
その場で出た数字なので、往復の 2 回は避けられた。 とくに round 5 は、実在しない形
(説明の箇条書き、実測 0 件) を防ぐために、実在する 82 commit (実測時) を壊している。

数え方は短い script で足りる。 全履歴を走査しても 1 秒かからない。 件数は履歴が伸びれば
変わるので、**本文の数値を信じずに自分で走らせる**。

```bash
# 新旧 2 つの述語で列 0 の `* ` 行を分類し、判定が変わる件数を出す
git log --format=%B%x00 --all | python3 -c '
import sys, re
msgs = [m.strip() for m in sys.stdin.read().split("\0") if m.strip()]
# round 3 の述語 (実物をそのまま写した)
旧 = re.compile(r"^\* (?:\S+ )?[a-z]+(?:\([^)]+\))?!?: .+ \(#\d+\)$")
# commit 件名らしい形 (これに当たらない = 説明の箇条書きの候補)
件名形 = re.compile(r"^\* (?:\S+ )?[A-Za-z]+(?:\([^)]+\))?!?: |^\* Revert \"")
全, 旧が拾う, 番号なし, 該当commit, 説明候補 = 0, 0, 0, 0, 0
for m in msgs:
    行 = [l for l in m.split("\n")[1:] if l.startswith("* ")]
    if 行 and any(not re.search(r"#\d+", l) for l in 行): 該当commit += 1
    for l in 行:
        全 += 1
        if not re.search(r"#\d+", l): 番号なし += 1; continue
        if 旧.match(l): 旧が拾う += 1
        if not 件名形.match(l): 説明候補 += 1
番号あり = 全 - 番号なし
print(f"commit {len(msgs)} / 列 0 の * 行 {全}")
print(f"  番号を持つ行 {番号あり} (旧述語が拾う {旧が拾う} / 落とす {番号あり - 旧が拾う})")
print(f"  番号なしの行 {番号なし} (それを含む commit {該当commit})")
print(f"  番号を持つが commit 件名の形でない行 {説明候補}")'
```

出力の対応はこう読む。 **本節の数値は全てこの出力から取っている**。

| 出力 | 本節のどの数値か |
|---|---|
| 落とす | round 3 の取りこぼし (109) |
| 番号なしの行を含む commit | round 5 の巻き込み (82) |
| 番号を持つが commit 件名の形でない行 | 説明の箇条書きの実測 (0) |

適用するのは **入力を分類する述語** に限る。 出力の書式や、分類を伴わない実装変更には
課さない。 全変更に課すと、形だけ数えた記録が増えて記録そのものが信用されなくなる。

## Pull request

- 1 PR = 1 concern (機能 / 修正 / refactor を混ぜない)
- title prefix ... `feat` / `fix` / `docs` / `refactor` / `test` / `chore`
- description ... 変更理由 + 影響範囲 + test 方針を明記

## commit message

絵文字 prefix + 日本語簡潔。

| 絵文字 | 用途 |
| --- | --- |
| `✨` | 新機能 |
| `🐛` | bug fix |
| `📝` | docs |
| `♻️` | refactor |
| `✅` | test |
| `🎨` | style / format |
| `⚡` | performance |
| `🔧` | tooling / config |

例 ... `✨ feat(dragon): sequence preset を追加`

## code style

- TypeScript ... strict mode 全面 ON、 `any` 禁止
- lint ... `pnpm lint` (eslint、 自動修正はしない)
- 整形 ... 設定は `.prettierrc` (`semi: true` / `singleQuote: false` / `printWidth: 100`)。 **触った `.ts` /
  `.tsx` だけ** `npx prettier --write <path>` で整形する
- import 順 ... 標準 lib → 外部 → 自 package → 相対 path
- 1 file 1 責務、 巨大ファイル禁止

### markdown には prettier をかけない

prettier は表の桁を揃える時、**文字数で数えて表示幅で数えない**。 日本語は全角 1 文字が
2 文字分の幅を占めるため、揃えたはずの `|` が実際にはずれる。

```
prettier をかける前 (見た目が揃う)     かけた後 (見た目がずれる)
| 理由 | 確かめ方 |                      | 理由                     | 確かめ方           |
|---|---|                                | ------------------------ | ------------------ |
| 未認証 | 下記の command で認証する |   | 未認証                   | 下記の command で認証する |
```

この repo の文書は日本語の表を多く持つため、markdown は手で書いた形のまま残す。

### repo 全体を整形する script は置かない (決定済)

一括整形する案は `#1285` で検討し、**採らないと決めた**。

対象の件数は自分で数える。 **触った file から順に準拠していくため、この数は減っていく**
(実際 `#1286` で 1 file 減った)。

```bash
npx prettier --list-different . | sed -E 's/.*\.([A-Za-z0-9]+)$/\1/' | sort | uniq -c | sort -rn
```

`#1285` で数えた時点では 397 file で、拡張子別は `.ts` 233 / `.mjs` 99 / `.tsx` 21 /
`.md` 17 / `.html` 14 / `.json` 5 / `.css` 5 / `.yaml` 2 / `.prettierrc` 1 だった
(合計 397)。 変更の中身は
**引用符の統一と折り返し** が大半で、演算子や識別子は動かない。

採らない理由は 3 つある。

1. **維持する仕組みが無い**。 この repo は CI を持たず、`pre-commit` 等の local hook も
   置かない。 一度整形しても新しい file は準拠しないまま
   増えるため、全体準拠は保てない
2. **markdown が壊れる**。 17 file が対象に入るが、prettier は表の桁を文字数で揃えるため
   日本語の表がずれる (上記)
3. **`git blame` が失われる**。 397 file を 1 commit で塗り替えると、整形で動く多くの行が
   整形 commit を指すようになる

代わりに **触った `.ts` / `.tsx` だけを整形する**。 触るたびに 1 file ずつ準拠していくため、
実際に読まれる file から順に揃う。 整形だけの commit は作らない。

## License

dragon は [MIT License](LICENSE) で配布。 contribution は同 license で受領される前提。
