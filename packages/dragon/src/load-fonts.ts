/**
 * 頁に同梱の字を読み込む入口 (`@cardenelabs/dragon/fonts`)。頁で 1 度だけ import する。
 *
 * 字の CSS (`@font-face`) を読み込むだけで、何も出さない。束ねる道具 (Vite など) が CSS と字の file を頁へ運ぶ。
 * 描く入口 (`@cardenelabs/dragon`) から分けているのは、node で原本を検査する時に CSS を読ませないため。
 */
import "@fontsource-variable/noto-sans-jp";
import "@fontsource-variable/jetbrains-mono";
