# Changelog

dragon DSL の主要変更履歴。
[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) format + [Semantic Versioning](https://semver.org/lang/ja/) 準拠。

## [Unreleased]

予定 ... feedback を反映した patch / minor。

## [0.8.0] - 2026-08-20

**破壊的変更を含む**。 記法から型を 1 つ落としている。

### Added

#### 見本帳

- **記法と JSON を並べて見せる見本を 30 件から 58 件に増やした** (#1292)

  `presets` 19 件と `charts` 9 件は `yaml` タブに中身があるのに `json` タブが空だった。
  同じ図に解決される JSON を足し、**片側だけ増やせない検査**を入れた。 検査は「両方ある」
  だけでなく、両方の入口が同じ図に解決されることまで見る (空の JSON や別の図の JSON では通らない)。

#### 記法で書ける欄が増えた

- **矢印の説明文を線の上に重ねられるようにした** (`overlay`、#1267)

  分岐図の条件ラベル (`true` / `false`) 用。 書いていない矢印には付かない。

#### 記法に書ける欄を README に載せた

- **箱 / 矢印 / 最上位に書ける欄の一覧を載せ、実装との一致を検査で固定した** (#1276)

  一覧は実装 (`TOP_LEVEL_KEYS` / `INLINE_ACTOR_KEYS` / `FLOW_INLINE_KEYS`) と両方向で
  突き合わせる。 実装に欄が増えて README を直さないと検査が落ちる。

  併せて `lane:` の効く条件と、静止した `type: flow` が書いた矢印の端を使わない癖を書いた。

#### 見本帳

- **見本 19 件すべてに記法を付けた** (#1242 / #1243 / #1252 / #1264 / #1265 / #1267)

  「コード」 タブで記法を読め、そのままエディタで開ける。

- **図がいまどの局面かをカタログと見本の詳細にも出した** (#1240)

- **カタログの分類を設計と同じ 2 面の姿に揃えた** (#1238)

#### 記法で書ける欄が増えた (詳しい説明)

- **箱を書いた縦列へ入れられるようにした** (`lane:`、 #1263 / #1266)

  縦列が 2-4 本あり箱がそこに散る図 (構成図 / 処理の流れ / 役割ごとの流れ) を記法で書けなかった。
  書いても全部が 1 列に入っていた (実測 = 見本は `Client` に 1 個 / `AWS` に 3 個)。

  ```
  type: topology

  lanes:
    front: { label: "利用者側" }
    back:  { label: "サーバ側" }

  actors:
    - 画面: { lane: front }
    - 受付: { lane: back }
  ```

  効くのは縦列を **箱を並べるための入れ物** として使う 3 図種 (`flow` / `topology` /
  `swimlane`)。 順序図は縦列がそのまま生命線として描かれる骨格なので、 従来どおり選べない
  (#1246 の知らせもそちらでは残る)。

  **全ての箱に書くか 1 つも書かないか** のどちらかにする。 一部だけ書いた形は、 書かなかった
  箱の行き先を決められないため知らせを出して従来の並びにする。

- **箱の大きさを書けるようにした** (`posW:` / `posH:`、 #1259 / #1262)

  組立て API 側は箱ごとに幅を指定することがある。 記法から書けないと描画側の既定 (640) に
  なり、 **既定より狭い幅を指定した図では縦列ごと広がる** (実測 = 拡張ステート図は箱 280 /
  縦列 330 で、 既定 640 が縦列を押し広げて描いた図の幅が `2439` 対 `2279` になった)。

  ```
  actors:
    - 待機: { kind: card, posW: 280 }
  ```

  書かなければ従来どおり描画側の既定になる。 縦列に収まる幅なら図は変わらない
  (実測 = 320 は縦列 370 に収まるため見た目が変わらない)。

- **工程の並びに担当と終わる時期を書けるようにした** (`owner:` / `end:`、 #1251 / #1256)

  組み立て API の帯は担当を持ち、 終わりを状態から取って段で伸び縮みさせられるが、 記法には
  書く場所が無かった。 記法で書き直すと担当が消え、 帯は常に 1 コマになる。

  ```
  type: gantt

  actors:
    - 設計: { value: "Q1", owner: "デザイナー" }
    - 実装: { value: "Q2", end: "{done}" }
  ```

  `end:` に時期の名前を書くとそこまで帯が伸び、 `{名前}` を書くと状態から取る。 書かなければ
  従来どおり始まりと同じ時期に終わる。 効くのは `type: gantt` だけで、 他の図種では知らせる。

- **2 つの軸で仕分ける図に軸の名前を書けるようにした** (`axes:`、 #1251 / #1255)

  組み立て側が「小さい / 大きい」 を直接書き込んでおり、 記法から変える経路が無かった。
  軸の名前が書けないと **何を判断する図か読めない**。

  ```
  type: quadrant

  axes:
    x: { left: "手間 小", right: "手間 大" }
    y: { bottom: "効き 小", top: "効き 大" }
  ```

  区画の名前 (`右上` 等) は軸の名前から `{上} × {右}` の形で決まる。 組立て API 側が同じ規則で
  導いているため、 同じ内容を書けば同じ図になる。 書かなければ従来どおり位置の名前を出す。

- **体験の道筋に場所と改善の余地を書けるようにした** (`touchpoint:` / `opportunity:`、 #1251 / #1254)

  組み立て API の段は「どこで起きたか」 と「何を直せるか」 を持つが、 記法には書く場所が無く、
  記法で書き直すと 2 つとも落ちていた。

  ```
  type: journey

  actors:
    - 登録: { value: "不満", touchpoint: "申込み画面", opportunity: "入力を減らす" }
  ```

  効くのは `type: journey` だけ。 他の図種には相手が無いため、 書かれていたら組み立て側が
  知らせる。 `type: mind` は描けない欄をまとめて 1 件で伝えるため、 そちらには二重に出さない。

- **放射の図で枝の親を書けるようにした** (`type: mind` の矢印、 #1251 / #1253)

  それまで枝は全て中心の直下に並び、 階層を書く手段が無かった。 矢印は「描けません」 として
  落としており、 `type: tree` を使うよう案内していた。

  ```
  type: mind

  actors:
    - Project
    - Features
    - Auth

  flow:
    - Features -> Auth: ""
  ```

  矢印は線にならず「どの枝の下に置くか」 の指定として読む。 親を決める規則は `type: tree` と
  共有するため、 同じ本文で図種を変えても親子の解釈が割れない。 書かなければ従来どおり
  全ての枝が中心の直下に並ぶ。

- **図表の箱に上の小見出しを書けるようにした** (`eyebrow:`、 #1247 / #1250)

  図全体を 1 箱にする図種 (`pie` / `bar` / `line` / `funnel` / `tree` / `journey` /
  `quadrant` / `mind` / `gantt`) は箱を 1 つしか作らないため、 上の小見出しの相手が決まる。
  そこへ渡す経路が記法に無く、 組立て API で作った同じ図と見比べると小見出しだけが空だった。

  ```
  title: "経路別の流入"
  eyebrow: "棒グラフ"
  type: bar
  ```

  箱ごとに分かれる図種 (`sequence` / `flow` 等) では「どの箱の小見出しか」 が決まらないため、
  書かれていたら組み立て側が知らせる。 そちらは従来どおり箱ごとに書く
  (`- A: { eyebrow: "..." }`)。

- **値が「きっかけ」 で動き出す形を書けるようにした** (`trigger:` / `to:` / `dur:`、 #1161 段 2 / #1229)

  それまで `values:` に書けるのは「常に成り立つ関係」 だけで、 いつ動き出すかは段に手で書く
  しかなかった。 工程が 4 つあれば段も 4 つ並べる必要があり、 「フロー 1 が終わったら
  フロー 2」 を書く場所が無かった。

  ```
  states:
    vDone: 0
    cDone: 0

  values:
    vDone: { trigger: step "取込み", to: 100, dur: 2s }
    cDone: { trigger: vDone >= 100, to: 100, dur: 2s }

  animation:
    - step: "取込み" 4s
  ```

  `trigger: step "名前"` はその段が始まった時、 `trigger: <値> >= <数>` は別の値が境目を通った
  時に動き出す。 `to:` が動いた先、 `dur:` が動く長さで、 動き始めの値は `states:` から取る。

  上の例は段を 1 つ書くだけで 2 本が順に動く。 `cDone` が動き出す時刻は `vDone` の傾斜から
  逆算されるため、 段を人が並べ直す必要が無い。

  組み立ての時点で段の中の傾斜へ畳むため、 描画側は変わらない。 畳めない形 (段が無い /
  相手が境目を通らない / 段に収まらない / きっかけが一周する) は図に載せず、 書いた行で伝える。

- **記法で「他の値から決まる値」 を書けるようにした** (`values:` / `states:`、 #1163 / #1183)

  それまで図の中の値は段ごとに手で書くしかなく、値どうしの関係を書く場所が無かった。
  要素が増えるほど段に書く量が増え、連動する図を書けない状態だった。

  ```
  states:
    inflow: 8200
    done: 130

  values:
    waiting: "{inflow} - {done}"
  ```

  `states:` が初期値を、`values:` が他の値から決まる関係を持つ。 段で `states:` の値を動かすと、
  `values:` の式がその都度解かれる。 箱の欄に `{waiting}` と書くとその値が出る。

  `#1163` が記法として読めるところまで、`#1183` が図に載せて描画側で解ける経路までを入れた。

- **JSON の入口でも値と状態を書けるようにした** (#1187 / #1215 段も動かせる)

  記法が `values:` / `states:` を受けるようになった一方、JSON の入口には受ける場所が無く、
  書いても黙って消えていた。 `DragonJson` に `states` と `values` を足して同じ機能に揃えた。

- **図表の欄が値を読めるようにした** (#1199 / #1202)

  円 / 棒 / 折れ線 / 絞り込み / 進捗の数の欄と、気持ち / 区画の語の欄が `{名前}` を受ける。
  それまで図表は配列を書いて一度描くだけで、状態を読む経路が無く永久に静止していた。

- **値の書き方を記法一覧と編集画面の見本に載せた** (#1191)

  `values:` は解けて図に載る状態まで来ていたが、記法一覧に 0 件 / catalog の図に 0 件 /
  編集画面の見本に 0 件で、**書ける人が居なかった**。 一覧と実例を足して書けるようにした。
  一覧の検査対象は実装から導き、`title:` / `type:` / `flow:` / `states:` / `values:` /
  `animation:` / `viewport:` の追加漏れを検知する。

### Changed

- **`@cardenelabs/cdl` の依存を `^0.7.0` から `^0.9.0` に上げた** (#1257)

  cdl 0.8.0 は tag だけ打たれて公開されておらず、その後 17 commit (機能追加 3 件 /
  不具合修正 12 件) が載っていた。 cdl 側で `0.9.0` を切って公開し、そこへ上げた。

  工程の帯で終わりが始まりより前に落ちた時、始まりへ丸める処理が届くようになった
  (cdl#484)。 これで `end:` に状態を書いた工程表の帯が消えなくなる。

  上げたことで挙動が変わった箇所が 2 つあり、本 repo 側も揃えた。

  - **状態の表を継承なしの入れ物で作るようにした**。 engine が継承なしに揃えた
    (cdl#456 / cdl#490) のに組み立て側が通常の object のままで、`__proto__` のような
    名前で **組み立てだけが「値が無い」 と知らせる** 状態になっていた
    (実測 = 描画は `a = 5` を出すのに知らせは `value-unresolved`)

  - **控えの欄の検査で、題を材料に使えなくなった**。 cdl 0.9.0 で全ての種別が題を
    描くようになったため (実測で 110 種すべて)、「控えだけが変わる図」 を題では
    作れない。 副題と上の小見出しは実際の図で見て、題は絞り込みそのものを直接見る形にした

- **`type: mind` の絵が変わった (破壊的変更、 #1177 / #1223)**

  記法の `type: mind` は `card` を 3 列 (`mind-left` / `mind-center` / `mind-right`) に並べる
  別実装で、 engine の `mind-map` 種別を使っていなかった。 中心から放射する絵を出す種別が
  engine 側にあるのに、 記法からは辿り着けない状態だった。

  ```
  title: "アイデア"
  type: mind

  actors:
    - Core        # 1 つ目が中心
    - Idea1       # 残りが枝
    - Idea2
  ```

  **既存の図の見た目が変わる**。 3 列に並んだ箱と箱の間の矢印から、 中心と放射の 1 枚絵になる。

  | 変わったこと | 前 | 後 |
  |---|---|---|
  | 箱の数 | 登場人物の数だけ | 1 つ (図全体を 1 箱で描く) |
  | 枠 | `mind-left` / `mind-center` / `mind-right` | `chart` の 1 つ |
  | 矢印 | 中心から枝へ自動で引く | 引かない (繋がりは箱の中が持つ) |
  | 位置の相対指定 | 効く | 効かない (箱が 1 つのため) |

  併せて 2 つが直った。 枝の親を見る規則 (`ruleMindMapParentReference`) が記法から作った図にも
  当たるようになり、 `SINGLE_BOX_KINDS` の `mind-map` が記法から到達する状態になった。

  **矢印は書いても描けない**。 書かれていたら伝える (`type: journey` / `type: quadrant` と同じ)。
  枝の親を矢印で書く形は `type: tree` が持っており、 `mind` は「1 つ目が中心、 残りが枝」 の
  簡便形として別に残す。

  **箱ごとに描いていた頃の欄の一部は描けなくなる**。 1 箱で描く種別が持てるのは名前、
  名前の後ろに続けて出す副題 / 値、 枝の色だけで、 以下の表で「出ない」「効かない」欄は
  書かれていたら伝える。 副題 / 値に `{状態名}` を書いた場合も、中心と枝の表示文字として
  段の状態を読む。

  | 欄 | 中心 | 枝 |
  |---|---|---|
  | 名前 | 出る | 出る |
  | 色 (`tone`) | **出ない** | 出る |
  | 副題 / 値 | 名前の後ろに出る | 名前の後ろに出る |
  | 上の小見出し / 行 | **出ない** | **出ない** |
  | 種類 / 枠の指定 / 積む順 / 色番号 | **効かない** | **効かない** |
  | 位置 (座標 / 相対) / 大きさ / 配置のずらし | **効かない** | **効かない** |

  これらを描くなら `type: tree` か `type: flow` を使う。 位置と大きさは「登場人物ごとの箱を
  どこに置くか」 の指定で、 箱が 1 つの図では置く先が無い。

  描ける欄と描けない欄の割り当ては型で固定してある。 `DslActor` に欄が増えた時、 どちらにも
  入れ忘れると型検査が落ちる。 伝える判定も同じ表から導くので、 欄を足して判定を書き忘れる
  形も型検査で止まる。

  見本 (`parts`) を重ねた登場人物は **中心にも枝にもせず**、 見本の中身だけを描く。 載せると同じ
  登場人物が 2 箇所に描かれるため。 見本しか書かなかった記法では放射の箱そのものを作らない。

- **`@cardenelabs/cdl` の依存を `^0.6.1` から `^0.7.0` に上げた** (#1205)

  cdl 0.7.0 で木 (`tree`) と放射 (`mind`) の名前が状態を読むようになったため、
  依存を上げて見本 2 件を動かした。

- **見本帳 127 件に段を付けた** (#1185 / #1193 / #1195 / #1197)

  看板が「動く図の記法」 なのに見本帳が 1 件も動いていなかった。 群ごとに段を足した。

  | 群 | 件数 | 動かし方 |
  |---|---|---|
  | primitives-extra | 21 | 指標を 1 つずつ割り当てて段で動かす |
  | `scene-*` | 30 | 箱を 1 つずつ光らせて流れを読ませる |
  | presets | 19 | 箱を 1 つずつ、図全体が箱 1 つのものは図表の中身を動かす |
  | `shape-*` / `kind-*` | 50 | 形を保ったまま副題 (値の欄 / 行) の数を動かす |
  | charts | 7 | 数の欄を段ごとに動かす |

  **検査を描画結果ベースにした**。 宣言の層で見る検査だと、値を足しても絵が変わらない種別が
  「動いている」 と判定される (値を描く経路は 2 種別しか持たない)。

- **`@cardenelabs/cdl` の依存を `^0.5.0` から `^0.6.1` に上げた** (#1166)

  同じ workspace の中で cdl の解決先が 2 つに割れており (`apps/playground-spa` が隣の
  checkout を `link:` で、 `packages/dragon` が公開版を掴む)、 同名だが別物の型として
  扱われて型検査が 103 件落ちていた。 両方を公開版に揃えて 0 件になった。

  cdl 0.6.0 は `mindMapRadial` と `mind-radial` を消しているため、 これらを使う図は
  cdl 側の移行が要る (cdl の `CHANGELOG` に手順がある)。

### Fixed

#### 書いたのに効かない / 黙って消える形

- **JSON が知らない項目を誤りとして返すようにした** (#1295)

  綴り違い (`animation` → `animations`) や打ち間違いが検査を通り、書いたのに効かない図が
  出来ていた。 公開している JSON Schema は元から全階層で `additionalProperties: false` を
  宣言しており、parser が自分の契約に追いついていなかった。 近い項目名があれば hint で勧める。

  併せて、受ける項目の一覧を実装の表 (`ACCEPTED_KEYS`) 1 箇所に集め、schema との一致を
  両方向で検査するようにした。 `viewport` は検査そのものが無かったため型を見るようにし、
  schema に無かった 4 項目 (`actors[].pos` / `flow[].pos` / `lanes.*.pos` / `viewport.scale`)
  を載せ、色の一覧を engine と揃えた。

- **記法では効く箱の項目 12 個と `axes` を JSON でも書けるようにした** (#1294)

  `tone` / `owner` / `end` / `touchpoint` / `opportunity` / `posX` / `posY` / `posW` / `posH` /
  `nodes` / `scale` / `color` と、2 軸で仕分ける図の `axes` が JSON では読まれず、書いても
  図が変わらず知らせも出なかった。 記法と同じ意味で読むようにし、両入口が同じ箱に解決する
  ことを検査で固定した。 併せて、見本 (parts) にしか効かない `state` と `scale` を見本でない
  箱に書いた時は誤りとして返す (記法側も読めない項目名として知らせる)。

- **JSON の `kind` が記法と同じ 108 種を受けるようにした** (#1293)

  JSON 側だけ 31 種の一覧を写し持っていたため、後から増えた 77 種は見本の名前として扱われ、
  `shape-wallet` などが `actor` の箱に変わっていた。種類の一覧と読み替えを記法側と共有し、
  JSON と記法が同じ種類を同じ図へ解決するようにした。

- **矢印が `actors` に無い名前を指した時に知らせ、壊れた図を作らないようにした** (#1221)
- **解決できない矢印を組み立てから外すようにした** (#1225)
- **自分へ戻る矢印を組み立てから外して知らせるようにした** (#1232)
- **静止した `type: flow` が書いた矢印の端を無視することを知らせるようにした** (#1271)
- **`values:` の 1 行形が黙って消えるのを塞いだ** (#1216)
- **英数字でない登場人物の名前でも見本の値が届くようにした** (#1233)
- **順序図の生命線が箱より 100 長く伸びるのを直した** (#1274)

  組立て API は `y2=848`、記法は `y2=948` だった。 原因は footer の箱に `role` が
  無かったこと。 枠の大きさは同じなので、図の大きさの比較では捕まらない。

#### 描いた図が組立て API と違う形

- **図表の記法が図の題を 2 度描くのを直した** (#1252)
- **放射の枝と中心に副題と値を描くようにした** (#1231)
- **名前から作る id の重なりを解いた** (#1226)
- **縦列の幅が合わない記法を外し、幅を検査に入れた** (#1244)

#### その他

- **JSON の入口で 1 度だけ読んで写しを作るようにした** (#1222)
- **放射状の図の削除で残った記録漏れと死んだ項目を片付けた** (#1176)

- **記法で書いた図の大きさを組立て API に揃えた** (#1260 / #1261)

  一致検査は箱 / 矢印 / 縦列 / 段の中身を突き合わせていたが、 **描いた図の大きさを見ていな
  かった**。 そのため中身が同じでも大きさの違う図が通っていた (実測 = 記法を持つ 13 件のうち
  **7 件** で viewBox が違い、 `785x488` 対 `712x600` 等)。

  原因は 2 系統。 図表の箱の大きさが組立て API と違っていたこと (`funnel` は `640x368` 対
  `560x480` 等) と、 後ろへ戻る矢印を箱の上に回していなかったこと
  (`routing: back-detour` が付かず、 図が 82px 低くなっていた)。

  どちらも組立て API 側の値と規則に揃えた。 併せて一致検査に「描いた図の大きさ」 の軸を足した。

- **表と状態の図で名前を 2 度描かないようにした** (#1241 / #1258)

  `er` と `state` は箱を 1 つずつ持ち、 その箱が既に名前を描く。 縦列にも同じ名前を渡していた
  ため、 **同じ字が縦に 2 つ並んで** いた (実測 = 描いた絵に同じ名前が 2 度出て、 図が 92px 高い)。

  `swimlane` は縦列そのものが「誰の担当か」 を読ませる図なので、 従来どおり見出しを付ける。

- **`lanes:` / `groups:` の id が hyphen と日本語を受けるようにした** (#1241)

  組み立て側は登場人物の名前から縦列 id を作るため、 hyphen と日本語が入る
  (`lane-idle` / `lane-待機` / `lane-sign-up`)。 英数字と下線だけを受けていた間、
  **自動で作られた縦列の幅や見出しを書き直す手段が無かった**。

  読み取りを壊す 4 種 (空白 / `:` / 中括弧) だけを受けない形にした。

- **箱に書いた縦列が効かないことを伝えるようにした** (`lane:`、 #1246 / #1248)

  記法は箱の中括弧で `lane` を受け取るが、 組み立て側は 1 度も読んでいなかった。 縦列は
  図種が決めるため、 書いた縦列は落ち、 `lanes:` で宣言した縦列だけが中身のないまま残る。
  知らせも出ないため、 書いた人は出来上がった図を見るまで気付けなかった。

  見本 (parts) の `lane` は張替え先として実際に効くため、 従来どおり知らせない。
  `type: mind` は描けない欄をまとめて 1 件で伝えており、 そこに `枠の指定` が既に入っている
  ため二重には出さない。

- **英数字でない登場人物の名前でも、重ねた見本の値が届くようにした** (#1189)

  値と状態の名前に使う前置きだけを英数字に直す。 それまでは登場人物の名前をそのまま前置きに
  していたため、日本語の名前で見本を重ねると値が 1 つも届かなかった。

  ```
  actors:
    - 受付 1: { kind: <見本> }    # 値は p1__... の名前空間に載る
  ```

  `{名前}` に書ける字種は描画側が 1 箇所で決めており、英数字と `_` に限る。 読む側 (置き換え)
  と書ける側 (式) の両方がその定義を使うため、記法の側だけ広げることはできない。

  **箱 / 縦列 / 矢印の id は変えない**。 これらは `{名前}` の対象ではなく、画面側が id から
  登場人物の名前を取り出す経路があるため。

  同じ形に潰れる名前 (`受付 1` と `受付-1`) は書いた順に番号で分ける。 英数字の名前しか無い図では
  1 つも番号が付かないため、既存の図の名前は変わらない。

- **自分へ戻る矢印を書いても図が組み立つようにした** (#1227)

  `A -> A` の形は組み立てから外し、 書いた行で理由を伝える。 それまでは記法の側が通してしまい、
  描画の直前で図ごと落ちていた。 本文のどの行が原因かも出なかった。

  ```
  flow:
    - Wait -> Wait: "tick"    # 外して知らせる
    - Wait -> Done: "exit"    # そのまま描く
  ```

  描画側は図種を問わず自己ループを受けない (`validate` の判定に分岐が無い)。 実測すると、
  golden 検査が持つ自己ループの見本 4 件 (順序図の自分宛て / 帯図の自己ループ / ER の自己参照 /
  状態図の自己遷移) は **どれも描けない状態だった**。 外して残りを描く形にしたことで、
  4 件とも図が出るようになる。

  自己ループそのものは描けないままなので、 知らせが直し方を 2 通り案内する = 途中の箱を
  1 つ足して 2 本に分けるか、 段 (`animation`) で状態が変わる様子として見せる。

  図全体を 1 箱で描く種別は矢印を作らないため対象にしない (本数を数えて別に伝えている)。

- **見本が持つ値を重ねた先でも解けるようにした** (#1188)

  見本 (parts) は図の定義そのものなので値を持てるが、取り込む側が箱 / 矢印 / 縦列 / 状態を
  写すだけで値を写していなかった。 重ねた先で `{名前}` の生の形が出ていた。

- **図表の欄が読む値の検査を 1 か所に集めた** (#1203)

  数の欄と語の欄で同じ土台を 3 度書いており、3 度とも review で同じ形の穴を指摘されていた
  (同じ名前を 2 回宣言した時に後ろが効くこと / 段で状態に入る値も見ること)。

### Removed (破壊的変更)

- **JSON の `layout` を受けるのをやめた** (#1295)

  記法 (`TOP_LEVEL_KEYS`) に無く、JSON にだけあった。 `doc.layout` を読む場所が実装にも
  画面にも 1 つも無く、検査を通っても何も起きない項目だった。 drag で位置を保存する mode
  (Phase 4) が入る時に、記法と JSON の両方へ同時に足す。

- **記法から `type: radial` を外した** (#1170)

  放射状に枝を配る記法で、 繋がる先の `mind-radial` 種別を engine 側で落としたため
  (`@cardenelabs/cdl` 0.6.0)、 記法の入口も同じ段で閉じた。 閉じないと「型は通るのに
  描けない記法」 が一覧に残る。

  | 消えたもの | 代わりに使うもの |
  |---|---|
  | 記法の `type: radial` | 無し。 下記 |
  | `PresetType` の `"radial"` | 同上 |
  | `diagramJsonSchema` の型一覧の `radial` | 同上 |

  **そのまま置き換えられる記法は無い**。 `type: mind` は枝を書き並べる用途では足りるが、
  `card` を 3 列に並べる別実装なので出てくる絵が変わる (放射状にはならない)。

  `type: radial` を書いた記法は `unknown type: "radial"` で弾かれる。 黙って別の絵に
  なることは無い。

## [0.7.0] - 2026-07-15

### Added

- **龍鱗ゴールド palette** = site 全 chrome を parchment (light) + obsidian (dark) + copper / amber / ember の 3-color system に redesign。 dragon = 「財宝を守る西洋龍」 metaphor、 dev tool の boring UI からの離脱。 light = illuminated manuscript vibe、 dark = dragon's hoard vibe (2 光源 radial glow: amber 75% 30% + ember 15% 90%) (#367-#375 の 5 PR で段階実装、 #373 が palette 全面差替 SSOT)
- **parts catalog** (20 parts、 rich exemplar 合成用 reusable atoms) を lazy dynamic import で分離、 non-parts route の TTI 改善 (#371)
- **breadcrumb aria-label locale 対応** (SiteHeader / ThemePicker / Toast + 6 page breadcrumb を useLocale で JA/EN 切替) (#370)
- **editor URL hash `#preset=<slug>`** で catalog / preset detail から直接 sample load、 SPA navigation でも SAMPLES へ即遷移 + slug 未登録時 toast 通知 (#367)
- **editor 「一括反映」 button** = fixable warning count で disabled 制御 + count 表示 (#367)
- **GitHub Pages deploy setup** = 手動 build + gh-pages branch push 経路 (`pnpm run deploy` = `pnpm build:pages && gh-pages -d dist`)、 CI 未使用 (#376)

### Changed

- **UI 全面日本語化** = Compare / Contribute / Release Notes / Preset Detail / Docs / Editor の 6 page 全 h1 / breadcrumb / button / aria-label (#367)
- **dark mode invisible text hotfix** = globals.css の html.dark base override 追加、 blueprint SVG viewer stage は cream paper (#fcf8ee) 維持で navy 描画明瞭 (#372)
- **preset detail nm-* class CSS 補完** + hideHeader で 01 badge / phase title overlap 解消 (#367)

### Removed

- **`/compare` page (テーマ比較)** = site palette を龍鱗ゴールド 単一に committed した文脈で 6 テーマ選択 UI は decision fatigue、 route + nav link + preset detail button + component + test entry 全削除 (cdl の 6 テーマ機能自体は `data-cdl-theme` 属性経路継続) (#374)
- **dead component 4 削除** = NmPresetCard / ThemePicker / PresetCard / shot-events.mjs = 0 参照 verified、 src/components/ 8 → 5 file (37.5% dead code 削減) (#375)

### Fixed

- CategoryPage 検索 filter の日本語 label 対応 (#367)
- editor `handleAutoFix` axis whitelist 統一で count drift 防止 (#367)
- Preset Detail の `preset.slug` URL 統一で 20 preset 全 hash 経由到達可 (#367)

## [0.6.0] - 2026-06-30

### Changed

- catalog 全 page (cookbook / patterns / text-dsl / presets / animation / styles / primitives) + docs (ja/en) を WebApp 軸の汎用 doc tool 表現に書直し、 blockchain 専用文脈から脱却
- cookbook を WebApp 軸 25 例 (API/Auth 5 + データ操作 5 + UI 5 + 非同期 5 + 運用 5) に再構築、 card 囲い 16:9 統一
- patterns を 12 種の汎用 pattern (Direct / Passthrough / Call-RW / Emit / Hook / Branch / Loop / Fan-out / Fan-in / Rollback / Schedule / Validate→Process) に再構築

### Removed

- 旧 patterns docs (bridge / permit / dex-swap / multicall / approve-pull + solidity preset 解説) を全削除
- primitives-extra の 8 NodeKind (wallet / validator / miner / blockchain-node / mempool / block / bridge-node / relayer) 参照を削除
- 旧 cookbook 25 例 (DeFi 10 / NFT 5 / DAO 5 / Bridge 5) を全削除

## [0.5.0] - 2026-06-28

### Added

Initial OSS release.

- **6 preset** ... sequence / flow / swimlane / er / state / topology
- **多数の NodeKind** ... actor / function / storage / event / service / database / cache / queue / 他
- **8 EdgeStyle** ... solid / dotted / dashed / dotted-flow / 他
- **6 Tone** ... accent / teal / success / error / warning / info
- **phase / state / tween / set / badge** ... 時系列 animation を宣言的に
- **Text DSL v0.5** ... mermaid 感覚の 5 ブロック箇条書き DSL (parser + compiler、 JA / EN i18n)
- **Visual Editor** (`apps/playground`) ... GUI 編集 + live preview + SVG export
- **Catalog** ... 12 preset × animation の visual 一覧
- **Docs site** ... 全 16 概念 × JA / EN、 humans tab + LLM tab、 Diátaxis 準拠
- **Pagefind 全文検索** ... Cmd+K で全 docs 高速 lookup
- **React + Astro 両対応** ... static / SSR / hybrid どこでも動く
- **CdlDiagramThumbnail** ... thumbnail + viewport いっぱいのモーダル拡大
- **CdlDiagramView** ... phase autoplay / focusPhaseId / hideHeader / debug props
- **Performance optimization** ... spatial hash 採用、 1000 node でも 60ms 以下の layout
- **TypeScript strict 全面 ON** + zod runtime validation
- **OSS 公開準備** ... README / CONTRIBUTING / SECURITY / ISSUE_TEMPLATE / PR_TEMPLATE 整備
- **380 件のテスト** ... unit + integration + visual screenshot diff + e2e

### Changed

- chainome monorepo から独立 OSS lib として分離 (旧 `chainome/packages/cdl` + `chainome/packages/anim` + `chainome/apps/web` の cdl 関連を移植)
- repo URL を `git@github.com:cardene777/cdl.git` に変更
- playground (旧 `apps/web`) を `apps/playground` に rename

## [0.4.0] - 2026-06-27

### Added

- **Text DSL v0.4** ... 残 5 preset (flow / swimlane / er / state / topology) animation 拡張
- catalog の Text DSL demo page (`/catalog/text-dsl`) ... 6 preset × animation の visual 確認
- 全 docs code block への preview 強制 (48 件、 lint script による品質保証)
- integration test 21 件追加 (Permit / Topology / edge case / regression / 6 preset × animation)

## [0.3.0] - 2026-06-27

### Added

- **Text DSL v0.3** ... sequence preset で `アニメーション:` ブロック full compile
- DSL の `状態` / `ステップ` / `強調` / `遷移` / `切替` / `バッジ` / `説明` を実 phase / state / tween / set / activate / badge / body に注入
- highlight 解決 ... actor 名 → `header` + `footer` + `step box` を active 化、 `A→B` 矢印 → edge id を active 化
- アーキテクチャ ... animation あり時 builder 直接経路、 なし時 preset 経由 (v0.2 互換)
- test 6 件 (v0.3 機能)

## [0.2.0] - 2026-06-27

### Added

- **Text DSL v0.2** ... 6 preset 全対応 (sequence + flow + swimlane + er + state + topology)
- cardinality 自動解析 (1:1 / 1:N / N:M / 0..1 / 1..*)
- ER preset で entity 自動生成 + relation 自動 cardinality
- state preset で最初 actor = initial、 最後 = final 自動付与
- topology preset で 1 group 内 container 配置
- test 8 件 (5 preset 動作確認)

## [0.1.0] - 2026-06-27

### Added

- **Text DSL v0.1** ... 「タイトル / 種類 / 登場人物 / 流れ / アニメーション」 の 5 ブロック箇条書き DSL
- parser + compiler (sequence preset only) ... 行ベース parser + AST + LaidDiagram 変換
- 日本語 + 英語両対応 (キーワード i18n)
- 矢印正規化 (→ / -> / => / >>)
- duration 解析 (1.5 秒 / 1500ms / 2s)
- エラー親切 (行番号 + hint + 修正提案)
- LLM 生成ガイド + 5 few-shot 例
- ChatGPT/Claude/Cursor 即用 system prompt
- preview 強制 lint script (`pnpm lint:docs-preview`)
- text-dsl-spec.md + text-dsl-llm-guide.md (docs site 統合)
- test 11 件 (parse + compile + アニメーション parse)
