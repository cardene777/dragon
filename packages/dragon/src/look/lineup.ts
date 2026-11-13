/**
 * 列の図 (`lineup`、#3239) の見た目の値。
 *
 * ほかの値と同じく値の表の層 (`look/`) に置き、描く file は字の大きさと色をここと `values.ts` から読む。
 * 列の図の配置と描画 (`kinds/lineup/layout.ts` と `render/lineup.ts` と列の図のブロックの描き方) だけが読み、どちらも後から読む塊にある (#3248)。
 * `values.ts` の `LOOK` に入れると、列の図を描かない頁も最初に読む script にこの値を持つので、別の file に分ける (#3351)。
 */
/**
 * 列の図の部品の値 (#3351)。横に並べた図の外周の余白は `margin`、役の札どうしの間 `gap`、役の札の角の丸み `radius`、選ばなかった帯の濃さは `faint`。
 * `chip` は封の錠と選んだ帯の印と「この先」の札の角の丸み `radius`。
 * `seal` は封で、チップを置く所の外へ `over` 広げ、角の丸み `radius`、縞の幅 `stripe`。真ん中の錠の箱は一辺 `lock` で、錠は箱の真ん中から `lockY`、字の基準線は `wordY` 下げる。
 * `lock` は錠の形で、胴の幅 `w` と高さ `h`、弦の半径 `r` と高さ `rise`。
 * `stamp` は札に押す印で、高さ `h`、字の左右の余白 `padX`、角の丸み `radius`、傾き `tilt`、色 `color`、札の右の端から `inset`、札の下の端から `drop` 下げる。
 * `mark` は選んだ札の印で、高さ `h`、字の左右の余白 `padX`、名前の右の間 `gap`、名前の行に入らない時に札の上の端から持ち上げる `lift`、色 `color`。
 * `role` は役の札で、幅の下限 `w`、高さ `h` (縦に組んだ時は `stackH`)、札どうしの間 `gap`、字の左の余白 `padX`、名前と一言の基準線 `titleY` と `noteY`、光る色 `color`、役の札と箱の間 `below`。
 * `headline` は図の上の題で、図の題の基準線 `titleY`、段の題の基準線 `headY`、段の題の行の送り `headLine`、段の題から文の基準線まで `sayY`、文の行の送り `sayLine`、文の下から役の札まで `below`、右上の段の番号の上下の位置 `badgeY`。
 * `remark` は札の下の一言で、札の下の端から `top`、行の送り `line`、色の棒の幅 `bar` と高さ `barH`、棒と字の間 `gap`。
 * `ahead` は「この先」の帯で、上の物から `top`、札の高さ `h`、行の間 `gap`、札の間の矢印の幅 `arrow`、番号の箱の一辺 `no`、札の内側の余白 `padX`、番号の箱と題の間 `textGap`、「この先」の字の右の間 `labelGap`。
 * `legend` は凡例で、上の物から `top`、見本の一辺 `swatch`、見本と説明の間 `gap`、行の中の間 `colGap`、行の送り `line`。
 * `arrow` は「この先」の札の間の矢印で、端から `inset` 離し、矢じりの長さ `head`。
 * `stack` は携帯の幅で縦に組んだ層の見た目で、図の幅の下限 `width`、外周の余白 `margin`
 *
 * `layers` は層の見た目 (#3625) で、見た目の元は step 2 で本人が選んだ動く試作の案A (横の帯を重ねる)。帯の中の幅の下限 `width`、帯の高さの下限 `minH`、帯どうしの間 `gap`、角の丸み `radius`、
 * 左の色の棒の幅 `bar`、帯の左から名前と説明の左端まで `textX`、帯の上端から名前の基準線まで `nameY`、名前から説明の基準線まで `descY`、説明の行の送り `descLine`、
 * 字の下の余白 `padY`、帯の右の余白 `padR`、名前と説明、層の番号、印、札の列の間 `colGap`。層の番号の丸の半径 `no`、印の高さ `stamp` と字の左右の余白 `stampPadX`、
 * 札の高さ `card` と字の左右の余白 `cardPadX`、札どうしの間 `cardGap`、札の角の丸み `cardRadius`、札の 2 行の字の真ん中を札の真ん中から `captionY` と `textY` ずらす。
 * 帯の地の濃さ `tint` (帯の地 `base`、札が通った帯 `lit`、札の居る帯 `now`、帯の縁 `edge`)、札の縁の太さ `cardEdge`、札の居る帯の縁の太さ `nowEdge`。
 * 携帯の幅で縦に組む時は、名前と説明の下に印と札の行を置き、名前と説明から行まで `rowGap` 空け、印と札の間は札どうしの間 `cardGap` にする。
 * 印と札が 1 つの行に入らない層だけ、札を印の下の行に置く。字の大きさと太さは `type` が持つ
 *
 * `board` は既定の見た目のボード (#3624) で、見た目の元は step 2 で本人が選んだ動く試作の案A (列を淡い色の縦の帯にする)。
 * 帯は幅の下限 `minW`、帯どうしの間 `gap`、角の丸み `radius`、内側の左右の余白 `padX`、地の濃さ `tint` (地 `base`、札が変わった段の縁 `edge`)。
 * 幅の下限は、帯 5 本の入札の見本を幅 760 の枠で横に並べた時に、縮めた字が読める大きさ (10.5px) を割らない値にする。
 * 見出しは帯の上端から名前の基準線まで `nameY`、名前の左の色の四角は一辺 `dot` で帯の左から `dotX`、名前の左端は帯の左から `nameX`、
 * 2 行目 (上限の目盛り、順番なし、値の札) の真ん中は帯の上端から `row2Y`、見出しの高さは 2 行目を持つ時 `head2`、持たない時 `head1`。
 * 札の数の札は高さ `count.h` で字の左右の余白 `count.padX`、名前と札の数の札の間 `count.gap`。目盛りは幅 `tick.w`、高さ `tick.h`、間 `tick.gap`。
 * 順番なしの札は高さ `noOrder.h` で字の左右の余白 `noOrder.padX`、値の札は高さ `value.h` で字の左右の余白 `value.padX`、変わった段の縁の太さ `value.edge`。
 * 札 (`card`) は高さ `h`、上下の間 `gap`、角の丸み `radius`、左の色の棒の幅 `bar` と札の左からの位置 `barX`、番号の丸の半径 `numR` と真ん中の札の左からの位置 `numX`、
 * 名前の左端は番号を持つ時 `textX`、持たない時 `plainX`。縁の太さは色の無い札 `edge`、色付きの札 `strong`、移った段の札 `moved`、色の無い札の縁の濃さ `faint`。
 * 足したと外れたの札は高さ `tag.h` で字の左右の余白 `tag.padX`、札の右の端から `tag.inset`。戻る印の丸の半径 `back.r` で、札の右の端から `back.inset`。
 * 札の列の下の余白 `bottom`。隣り合う帯の間の向きの印は長さ `chevron.len` と開き `chevron.half`。
 * 差し戻しの線 (`return`) は、帯の上端から `rise` 上を横に戻り、差し戻しの在る図だけ帯の上に `room` 空ける。曲がり目の丸み `bend`、線の太さ `width`、色 `color`、
 * 札は高さ `label.h` で、左右の余白 `label.padX`、戻る向きの印の幅 `label.glyph` と字の間 `label.gap`。
 * 控えの行は印の丸の半径 `trace.r` で、名前は印の右 `trace.gap`。跡の点線は `ghostDash`。
 * 狭い枠 (`narrow`) は図の幅の下限 `width`、外周の余白 `margin`、差し戻しの在る図の帯の左の通り道 `rail` (戻りの線は図の左から `railX`)、
 * 帯どうしの間 `gap`、札を 2 つずつ並べる間 `colGap`、札の高さ `cardH` と上下の間 `cardGap`。字の大きさと太さは `type` と `narrowType` が持つ
 *
 * `stations` は選べる見た目の流れの線 (#3624) で、見た目の元は試作の案B。駅の丸の半径 `r` と縁の太さ `ring`、流れの線の太さ `line`、線の終わりの三角の長さ `head` と開き `headHalf`、
 * 線は最初の駅の左へ `before`、最後の駅の右へ `after` 伸ばす。駅どうしの間の下限 `step`、名前の基準線は線から `nameY` 上、2 行目の真ん中は線から `row2Y` 上、
 * 札は幅の下限 `cardW`、高さ `cardH`、上下の間 `cardGap`、線から最初の札の上端まで `top` (差し戻しの在る図は `backTop`)、戻りの線は線から `backY` 下。
 * 段で通った区間の線の太さ `run`。狭い枠は流れの線を図の左から `narrowX` に引き、戻りの線を `narrowRail` に、札の列を `narrowCards` から置く
 *
 * `stairs` は階段の見た目 (#3640) で、帯と印と札は層の見た目 (`layers`) の値を使い、ここは階段のずらしと経った時間の目盛りと針の値を持つ。
 * 帯の幅の下限 `width`、下の層を右へずらす幅 `shift` (携帯の幅は `phoneShift`、帯が狭くなる時は `leastShift` まで縮める)。
 * 目盛りは、既定の幅では階段の右に縦に、携帯の幅では階段の下に横に置く。目盛りの線の太さ `line`、目盛りの印の長さ `mark`、印と数字の間 `tickGap`。
 * 針は線を指す三角で、長さ `needle`、開きは長さに `spread` を掛けた幅。針に添える経った時間の札は高さ `chipH`、字の左右の余白 `chipPadX`、角の丸み `chipRadius`、針との間 `chipGap`。
 * 既定の幅では階段の右の端から札の列まで `gap`、携帯の幅では階段の下の端から札の行まで `below` 空ける。字の大きさと太さは `type` が持つ
 */
export const LINEUP_LOOK = {
  margin: 20,
  radius: 6,
  gap: 12,
  faint: 0.35,
  chip: { radius: 3 },
  seal: { over: 3, radius: 4, stripe: 7, lock: 44, lockY: -7, wordY: 13 },
  lock: { w: 14, h: 10, r: 4.5, rise: 3 },
  stamp: { h: 22, padX: 8, radius: 4, tilt: -4, color: "rose", inset: 6, drop: 6 },
  mark: { h: 18, padX: 5, gap: 8, lift: 10, color: "violet" },
  role: { w: 200, h: 50, stackH: 46, gap: 24, padX: 14, titleY: 21, noteY: 38, color: "green", below: 22 },
  headline: { titleY: 11, headY: 37, headLine: 26, sayY: 22, sayLine: 19, below: 18, badgeY: 7 },
  remark: { top: 14, line: 21, bar: 3, barH: 14, gap: 8 },
  ahead: { top: 22, h: 24, gap: 8, arrow: 20, no: 16, padX: 4, textGap: 8, labelGap: 12 },
  legend: { top: 22, swatch: 12, gap: 8, colGap: 24, line: 22 },
  arrow: { inset: 4, head: 5 },
  stack: { width: 372, margin: 12 },
  layers: {
    width: 880,
    minH: 78,
    gap: 14,
    radius: 14,
    bar: 6,
    textX: 30,
    nameY: 30,
    descY: 25,
    descLine: 19,
    padY: 18,
    padR: 24,
    colGap: 32,
    no: 13,
    stamp: 26,
    stampPadX: 12,
    card: 44,
    cardPadX: 14,
    cardGap: 10,
    cardRadius: 12,
    captionY: -6,
    textY: 11,
    tint: { base: 10, lit: 16, now: 24, edge: 50 },
    cardEdge: 2.4,
    nowEdge: 2.6,
    rowGap: 12,
    type: {
      name: { size: 16, weight: 700, family: "sans" },
      desc: { size: 13, weight: 500, family: "sans" },
      stamp: { size: 13, weight: 600, family: "sans" },
      no: { size: 13, weight: 700, family: "mono" },
      caption: { size: 12.5, weight: 700, family: "sans" },
      card: { size: 13, weight: 700, family: "mono" },
    },
  },
  board: {
    minW: 166,
    gap: 16,
    radius: 16,
    padX: 11,
    tint: { base: 7, edge: 30 },
    nameY: 27,
    dot: 10,
    dotRadius: 3,
    dotX: 15,
    nameX: 33,
    row2Y: 54,
    head1: 56,
    head2: 76,
    count: { h: 22, padX: 8, gap: 10, tint: 16, radius: 7 },
    tick: { w: 22, h: 8, gap: 5, tint: 20 },
    noOrder: { h: 22, padX: 9, dash: [3, 3] },
    value: { h: 24, padX: 9, edge: 2.2, radius: 8 },
    card: { h: 40, gap: 7, radius: 10, bar: 4, barX: 6, barY: 9, numR: 11, numX: 25, textX: 44, plainX: 20, padR: 12, fill: 13, edge: 1.1, strong: 1.6, moved: 2.4, faint: 0.32 },
    tag: { h: 22, padX: 9, inset: 9, gap: 8 },
    back: { r: 11, inset: 20 },
    bottom: 14,
    chevron: { len: 6.5, half: 5, width: 1.6 },
    return: { rise: 28, room: 30, bend: 12, width: 2.4, head: 7, color: "rose" },
    label: { h: 22, padX: 12, glyph: 9, gap: 8, stroke: 1.7 },
    trace: { x: 14, r: 7.5, gap: 8, stroke: 1.5 },
    ghostDash: [5, 4],
    ghost: { fill: 5, edge: 1.5 },
    narrow: {
      width: 372,
      margin: 12,
      rail: 34,
      railX: 17,
      railR: 10,
      gap: 16,
      colGap: 8,
      head1: 40,
      head2: 70,
      nameLine: 21,
      card: { h: 34, gap: 6, radius: 9, bar: 3.5, barX: 6, barY: 8, numR: 10, numX: 23, textX: 39, plainX: 17, padR: 10 },
      tagInset: 7,
      backInset: 16,
      backR: 9.5,
    },
    type: {
      name: { size: 16, weight: 700, family: "sans" },
      count: { size: 13, weight: 700, family: "mono" },
      noOrder: { size: 12.5, weight: 500, family: "sans" },
      value: { size: 13.5, weight: 700, family: "mono" },
      card: { size: 15, weight: 600, family: "sans" },
      number: { size: 13, weight: 700, family: "mono" },
      tag: { size: 12.5, weight: 700, family: "sans" },
      label: { size: 12.5, weight: 700, family: "sans" },
      trace: { size: 14, weight: 500, family: "sans" },
    },
    narrowType: {
      name: { size: 15, weight: 700, family: "sans" },
      card: { size: 14, weight: 600, family: "sans" },
      number: { size: 12, weight: 700, family: "mono" },
      tag: { size: 11.5, weight: 700, family: "sans" },
    },
  },
  stations: {
    r: 14,
    ring: 4,
    line: 7,
    head: 18,
    headHalf: 10,
    before: 74,
    after: 74,
    step: 196,
    nameY: 58,
    row2Y: 31,
    cardW: 166,
    cardH: 36,
    cardGap: 8,
    top: 54,
    backTop: 64,
    backY: 40,
    run: 7,
    laneGap: 16,
    nameGap: 8,
    rowGap: 8,
    bottom: 14,
    slotDash: [5, 5],
    slot: { fill: 5, edge: 1.4, opacity: 0.6 },
    card: { numR: 11, numX: 18, textX: 36, plainX: 17, padR: 14, tagInset: 7, backInset: 18, backR: 10.5, fill: 10, strongFill: 22, edge: 1.2, strong: 1.7, faint: 0.45 },
    narrowX: 44,
    narrowRail: 14,
    narrowCards: 70,
    narrowR: 11,
    narrowRing: 4,
    narrowTop: 20,
    narrowHead1: 36,
    narrowHead2: 66,
    narrowCard: { h: 34, gap: 6, numR: 10, numX: 17, textX: 33, plainX: 15, padR: 10, tagInset: 6, backInset: 16, backR: 9.5 },
  },
  stairs: {
    width: 560,
    shift: 44,
    phoneShift: 14,
    leastShift: 8,
    line: 2,
    mark: 7,
    tickGap: 6,
    needle: 10,
    spread: 0.6,
    chipH: 28,
    chipPadX: 10,
    chipRadius: 8,
    chipGap: 4,
    gap: 24,
    below: 20,
    type: {
      tick: { size: 12.5, weight: 600, family: "sans" },
      elapsed: { size: 13.5, weight: 700, family: "sans" },
    },
  },
} as const;
