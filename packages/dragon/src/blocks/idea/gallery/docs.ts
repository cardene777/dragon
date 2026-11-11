/** 使い方の頁の「考えを広げる地図」の節の、考えの段落 (#3619) */
import type { BlockDocs } from "../../gallery";

export const docs: BlockDocs = {
  section: "mind",
  ja: [
    "1 つの題から考えを枝と葉に広げていく時は、最初の行を `mind <題>` にする。考えは段の中に `idea <名札> as <名前> of <親>` と書き、書いた段で考えが濃く現れて、親からの枝の線が伸びる。`of` の無い `idea` が真ん中の題で、1 つの図にちょうど 1 つ置く。親は前に書いた考えに限り、題、枝、葉の 3 段まで書ける。",
    "題の子の枝は左右に分かれ、書いた順に左上、右上、右下、左下の四方へ曲線で伸び、枝の子の葉は枝の外側に縦に並ぶ。枝に書いた `[color: <色>]` はその枝の線と葉の枠に引き継ぎ、色の無い枝には書いた順に色を配る。`as <名前>` を省くと名札がそのまま名前になり、語の `of` を含む名前は `\"` で囲む。箱と線と中身の帯の行は書けない。",
  ],
  en: [
    "To grow ideas out of one title into branches and leaves, start the first line with `mind <title>`. Write each idea inside a step as `idea <id> as <name> of <parent>`; the idea comes into full colour in that step and a branch line grows from its parent. The `idea` without `of` is the centre, and a map has exactly one. A parent must be an idea written earlier, and ideas go three levels deep: the centre, branches and leaves.",
    "The branches of the centre split left and right and curve out four ways, top left, top right, bottom right and bottom left in written order, and the leaves of a branch stack outside it. A `[color: <color>]` on a branch carries over to its line and the frames of its leaves, and branches without a color get one in written order. Leave out `as <name>` and the id becomes the name; quote a name that contains the word `of` with `\"`. Box, line and strip lines are not allowed.",
  ],
};
