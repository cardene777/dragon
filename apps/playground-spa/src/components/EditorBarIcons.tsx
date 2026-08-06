/**
 * 操作列のアイコン (#1063)。
 *
 * 文字で書いたボタンが 12 個並び、合計 811px に対して操作列の幅は 491px しかなかった。
 * 320px が画面の外にあり、等倍表示と拡大縮小が押せない状態だった (実測 = 1440px 幅で
 * 107px、1280px 幅で 174px、1100px 幅で 208px のはみ出し)。
 *
 * 線の太さと端の丸めは全アイコンで揃える。揃えないと、同じ列に置いた時に太さの違いが
 * 「押せる / 押せない」 の差に見える。
 */
import type { JSX } from "react";

/** 16x16 の枠に線で描く。色は呼び出し側の文字色を継ぐ。 */
function Icon({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** 共有 URL を作る。 上向きの矢印 + 箱 = 外に出す。 */
export const IconShare = (): JSX.Element => (
  <Icon>
    <path d="M11 5.5 8 2.5 5 5.5M8 2.5v8" />
    <path d="M3 9.5v3a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3" />
  </Icon>
);

/** 脇の一覧を出す。 横 3 本 = 並んだ項目 (#1070)。 */
export const IconList = (): JSX.Element => (
  <Icon>
    <path d="M3 4.5h10M3 8h10M3 11.5h10" />
  </Icon>
);

/** 画像として書き出す。 下向きの矢印 + 底の線 = 取り出す。 */
export const IconExport = (): JSX.Element => (
  <Icon>
    <path d="M5 7.5 8 10.5 11 7.5M8 10.5v-8" />
    <path d="M3 12.5h10" />
  </Icon>
);

/** 図の中の文字を小さくする。 A + 短い横線。 */
export const IconTextDown = (): JSX.Element => (
  <Icon>
    <path d="M2.5 12.5 5.5 4l3 8.5" />
    <path d="M3.4 10h4.2" />
    <path d="M10.5 8.5h3" />
  </Icon>
);

/** 図の中の文字を大きくする。 A + 十字。 */
export const IconTextUp = (): JSX.Element => (
  <Icon>
    <path d="M2.5 12.5 5.5 4l3 8.5" />
    <path d="M3.4 10h4.2" />
    <path d="M10.5 8.5h3M12 7v3" />
  </Icon>
);

/** 図そのものを縮める。 枠 + 横線 = 中身を減らす。 */
export const IconShrink = (): JSX.Element => (
  <Icon>
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
    <path d="M6 8h4" />
  </Icon>
);

/** 図そのものを広げる。 枠 + 十字 = 中身を増やす。 */
export const IconGrow = (): JSX.Element => (
  <Icon>
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
    <path d="M6 8h4M8 6v4" />
  </Icon>
);

/** 各要素の居場所を図に重ねる。 枠 + 2 点を結ぶ線 = 座標。 */
export const IconPositions = (): JSX.Element => (
  <Icon>
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
    <circle cx="5.5" cy="5.5" r="1.2" />
    <circle cx="10.5" cy="10.5" r="1.2" />
    <path d="M6.7 6.7 9.3 9.3" />
  </Icon>
);

/** 図が枠に収まるよう表示を合わせる。 四隅の角 = 枠に合わせる。 */
export const IconFit = (): JSX.Element => (
  <Icon>
    <path d="M2.5 6V3.5a1 1 0 0 1 1-1H6M10 2.5h2.5a1 1 0 0 1 1 1V6M13.5 10v2.5a1 1 0 0 1-1 1H10M6 13.5H3.5a1 1 0 0 1-1-1V10" />
  </Icon>
);

/** 表示を最初に戻す。 回る矢印。 */
export const IconReset = (): JSX.Element => (
  <Icon>
    <path d="M13 8a5 5 0 1 1-1.6-3.7" />
    <path d="M13.2 2.6v3h-3" />
  </Icon>
);

/**
 * 等倍で表示する。 虫めがね + 数字の 1 = 「1 倍」。
 *
 * **プラスにしてはいけない**。 拡大 (`IconZoomIn`) と同じ形になり、 16px では見分けが
 * 付かない (実測 = 4 倍に拡大して並べても同じに見えた)。 等号も 2 本の線が 16px では潰れる
 * (線の間隔 2 に対し線の太さ 1.4)。 数字なら形が根本から違うので、 小さくても分かれる。
 */
export const IconActualSize = (): JSX.Element => (
  <Icon>
    <circle cx="7.2" cy="7.2" r="4.2" />
    <path d="M10.4 10.4 13.5 13.5" />
    <path d="M6.1 6.1 7.3 5.2v4" />
  </Icon>
);

/** 表示を縮小する。 虫めがね + 横線。 */
export const IconZoomOut = (): JSX.Element => (
  <Icon>
    <circle cx="7.2" cy="7.2" r="4.2" />
    <path d="M10.4 10.4 13.5 13.5" />
    <path d="M5.4 7.2h3.6" />
  </Icon>
);

/** 表示を拡大する。 虫めがね + 十字。 */
export const IconZoomIn = (): JSX.Element => (
  <Icon>
    <circle cx="7.2" cy="7.2" r="4.2" />
    <path d="M10.4 10.4 13.5 13.5" />
    <path d="M5.4 7.2h3.6M7.2 5.4v3.6" />
  </Icon>
);
