/**
 * 「画面に収める」 の位置決め (#1088)。
 *
 * `#1084` で読める下限を入れた結果、 横長の図は枠に収まらなくなった。 収まらないこと自体は
 * 決めたとおりだが、 中央寄せのままだと左右が同じだけ隠れる。 実測 (窓 1440×900、 絵の枠
 * 688×840) で見本「利用者登録」 は左右 343px ずつ隠れ、 最初の登場人物が画面の外にあった。
 *
 * ## 収まらない軸だけ始点に寄せる
 *
 * 読む人は左から読む。 収まらない時に見せるべきは左端で、 中央ではない。 縦も同じ理由で
 * 上端に寄せる。
 *
 * **軸ごとに独立して決める**。 横は収まらないが縦は収まる図 (帯の図) で、 縦まで上端に
 * 寄せると上下の余白が偏る。
 */

/** 位置決めに要る 1 軸分の情報。 単位は倍率を掛けた後の px。 */
export interface AxisFit {
  /** 枠の大きさ */
  frame: number;
  /** 図の大きさ */
  content: number;
  /** 図の始点 (囲んだ範囲の左端 / 上端)。 負になることがある */
  origin: number;
}

/**
 * 1 軸分の平行移動量。
 *
 * 収まるなら中央、 収まらないなら始点に寄せる。 どちらの場合も `origin` の分を戻す =
 * 囲んだ範囲の左上が負になる形 (図の左や上にパーツを置いた場合) で位置がずれるため。
 *
 * 収まるかどうかは「図が枠以下か」 で見る。 ちょうど同じ大きさは収まる側に入れる = 中央に
 * 置いても始点に寄せても結果が同じなので、 分岐を増やす意味がない。
 */
export function axisOffset(fit: AxisFit): number {
  const { frame, content, origin } = fit;
  if (!Number.isFinite(frame) || !Number.isFinite(content) || !Number.isFinite(origin)) return 0;
  // 収まらない = 始点を枠の左端 (上端) に合わせる
  if (content > frame) return -origin;
  // 収まる = 中央に置く
  return (frame - content) / 2 - origin;
}

/** 収まらない軸があるか。 呼出側が「横に動かす案内を出すか」 を決めるのに使う。 */
export function overflowsAxis(fit: AxisFit): boolean {
  return Number.isFinite(fit.frame) && Number.isFinite(fit.content) && fit.content > fit.frame;
}
