/**
 * 寄って追う窓を引く検査 (#3871) が描く図の記法。検査の file と準備の file の両方が読む。
 * 状態の図、構成図、木の図は課題の最小の図で、最後の段で動く物が幅 360 と 390 の窓に今の大きさで収まらない。
 */

/** 状態の図。段 4 で、左の端の「始めた」から右の端の「失敗」へ線を引く */
export const STATE = `state 分かれる状態

box A as 始めた
box B as 待つ
box C as 済んだ
box D as 失敗 [color: amber]

step 始める
  start -> A: 始める

step 待つ
  A -> B: 待つ

step 済む
  B -> C: 済む

step 失敗する
  A -> D: 失敗する
`;

/** 状態の図の段 4 の後に、隣り合う箱へ戻る段 5 を足した図。窓を引いた段の次の収まる段を見る */
export const STATE_BACK = `${STATE}
step 戻る
  B -> A: 戻る
`;

/** 構成図。段 3 で、左の端の「呼ぶ側」から右の端の「記録」へ線を引く */
export const ARCHITECTURE = `architecture 離れた箱へ引く線

box A as 呼ぶ側 [icon: app]
box B as 中継 [icon: layers]
box C as 置き場 [icon: server]
box D as 記録 [icon: db]

step 隣へつなぐ
  A -> B: つなぐ

step 次へつなぐ
  B -> C: 渡す

step 離れた箱へつなぐ
  A -> D: 記録する
`;

/** 木の図。段 2 で、根の左右に 5 つの枝を足す */
export const MIND = `mind 両側に足す枝

step 根を置く
  say 根と2つの枝を置く。
  idea root as "設定ファイル" [color: slate]
  idea k as "身元" of root [color: blue]
  idea s as "待ち受け" of root [color: blue]

step 5つの枝を足す
  say 5つの枝を足す。
  idea i as "identity providerの一覧" of root [color: rose]
  idea n as "networkの一覧" of root [color: rose]
  idea sk as "内部の署名の鍵の保存先" of root [color: rose]
  idea sp as "使うsigning provider" of root [color: rose]
  idea h as "ハッシュの方式の版" of root [color: rose]
`;

/** 時系列図。段 1 で、左の端の列から右の端の列へ線を引く */
export const SEQUENCE = `sequence 遠い相手へ送る

box a as 利用者
box b as 画面
box c as 中継
box d as 置き場
box e as 記録

step 遠くへ送る
  a -> e: 送る

step 返す
  e -> a: 返す
`;

/** 課題の 3 つの図と、その名前 */
export const ISSUE_CASES: readonly (readonly [string, string])[] = [
  ["state", STATE],
  ["architecture", ARCHITECTURE],
  ["mind", MIND],
];
