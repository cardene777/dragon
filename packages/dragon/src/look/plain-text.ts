/**
 * 置いた頁の字の間と大文字の指定を戻す性質 (#3787)。
 *
 * 字の間と大文字の指定は、影の根の外からも中へ受け継がれる。
 * 図の札と箱の大きさはエンジンが字の幅の表で測って決めるので、頁が字の間を広げると字は札と箱からはみ出し、帯の題は折り返す。
 * 図のSVGの根 (`render/draw.ts`)、再生の部品の根 (`player.ts`)、帯の枠 (`frame/dragon-frame.mjs`)、帯の頭とそのボタン (`frame/header.mjs`) に書く。
 * 根に書くので、字の間を自分で決める字 (配管の図の槽の名前など) は自分の値のまま描く
 */
export const PLAIN_TEXT = "letter-spacing:normal;word-spacing:normal;text-transform:none;text-indent:0";
