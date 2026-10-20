# dragon の目的と利用者

## 目的

- dragon は、文字で書いて動く SVG の図を描く道具である (`README.md`)。
- 書いた図は、段ごとに線が光り、点が進む動きを持つ (`README.md`、#2982)。
- 今は作り直しの最中で、古い記法と描画は消してあり、図を描く仕組みは持たない (`packages/dragon/src/index.ts`、#2983)。

## 利用者

- 人は 1 行が 1 つの文になる行ごとの記法で書く。作り直しで作る物で、まだ無い (#2982)。
- AI は原本の JSON で書く。これも作り直しで作る物で、まだ無い (#2982)。
- 利用者の数と、どこで使われているかは不明。

## 配り方

- package は `@cardenelabs/dragon` の名前で、使用許諾は MIT (`packages/dragon/package.json`、`LICENSE`)。
- 今の版は何も公開しない。npm へ出す版と配布名は、作り直しの範囲の外にした (#2982)。
- 見本帳は Vercel から配り、今は作り直しの最中であることを伝える 1 頁だけを持つ (`vercel.json`、`apps/playground-spa/src/main.tsx`)。
