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
pnpm --filter dragon-playground-spa test         # Playwright E2E
pnpm lint                                        # eslint
pnpm typecheck                                   # tsc -b 全 workspace
```

新機能を追加する PR は test を必ず添える。 test の置き場所は `packages/dragon/test/` または `apps/playground-spa/tests/` のいずれか。

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
全, 旧が拾う, 番号なし, 該当commit = 0, 0, 0, 0
for m in msgs:
    行 = [l for l in m.split("\n")[1:] if l.startswith("* ")]
    if 行 and any(not re.search(r"#\d+", l) for l in 行): 該当commit += 1
    for l in 行:
        全 += 1
        if not re.search(r"#\d+", l): 番号なし += 1; continue
        if 旧.match(l): 旧が拾う += 1
番号あり = 全 - 番号なし
print(f"commit {len(msgs)} / 列 0 の * 行 {全}")
print(f"  番号を持つ行 {番号あり} (旧述語が拾う {旧が拾う} / 落とす {番号あり - 旧が拾う})")
print(f"  番号なしの行 {番号なし} (それを含む commit {該当commit})")'
```

出力の「落とす」 が round 3 の取りこぼし、「番号なしの行を含む commit」 が round 5 の
巻き込みにあたる。 **本節の数値はこの出力から取っている**。

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
- prettier ... `pnpm format` (eslint + prettier)
- import 順 ... 標準 lib → 外部 → 自 package → 相対 path
- 1 file 1 責務、 巨大ファイル禁止

## License

dragon は [MIT License](LICENSE) で配布。 contribution は同 license で受領される前提。
