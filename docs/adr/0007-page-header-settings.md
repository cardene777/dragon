# jsDelivrの頁とmdの書き出しの頁で帯の設定を1つの塊から読む

## 決めたこと

jsDelivrの1行を読む頁は、`<script type="application/json" id="dragon-header">`の1つの塊から帯の設定を読み、頁の全ての`data-header`の塊に効かせる。
塊の鍵はSDKの`mountDragon`と同じ`buttons`と`look`にする。
`buttons`に書けるのは初めから在る5つのボタン (`code`、`editor`、`copy`、`export`、`expand`) の名前だけにする。

`dragon export`のmdは、頭の`---`の間に`header-buttons`と帯の7色の行を1行ずつ書く。
`header-buttons`はボタンの名前を`,`で区切り、色の行は帯の7色 (`surface`、`background`、`foreground`、`muted`、`border`、`accent`、`hover`) の頭に`header-`を付けた名前にする。
書き出しはこれらの行を`#dragon-header`の塊にして頁に入れ、知らないボタンの名前は行の番号つきで断る。

## 選んだ案

帯の設定を書く所を頁に1つにし、鍵をSDKと同じにする。
READMEの帯の設定の説明をSDKとjsDelivrで1つにでき、頁全体の設定は配管の図の並べ方の塊`#dragon-layouts`と同じ置き方で読める。
mdの頭は今も`title`と`layout`を1行1値で読むので、同じ読み方に行を足し、書き出しが裏でJSONに直す。

## 却下した案とその理由

| 案 | 却下した理由 |
|---|---|
| 塊ごとの属性 (`data-header-buttons`、`data-header-accent`など) で書く | 色7つと見た目6つとボタンで属性が最大14個になり、同じ設定の3枚の図では同じ属性を3回書く |
| 頁のJSONを既定にし、`data-header`の値に書いたJSONで塊ごとに上書きする | 設定を書く所が2つになり、どちらが効いたかを2か所で追うことになる |
| mdの頭に`header`の1行を足し、jsDelivrの頁と同じJSONをそのまま書く | GitHubでmdを読むと頭に長い1行のJSONが出て、書き間違えた所を探しにくい |
| 書き出しの命令は変えず、書き出した頁に塊を手で足す | mdから書き出し直すたびに、足した塊が消える |

## 拠り所

- 課題 #3789 の`## 決めたこと (step 2)`の採る行と、却下の行の4つ
- `packages/dragon/src/page-blocks.ts`の`storedLayouts`が、頁の`<script type="application/json" id="dragon-layouts">`を読む形
- `packages/dragon/src/page/read.ts`の`frontMatter`が、mdの頭の`---`の間を1行1値で読む形
- `packages/dragon/src/embed/index.ts`の`EmbedOptions`の`look`と`buttons`

## 決めた日

2026-11-21
