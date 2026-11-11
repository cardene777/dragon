/** 見本帳の部品の頁の、考えの説明 (#3619)。部品の頁だけが読み、見本帳が最初に読む塊に入れない */
import type { BlockDesc } from "../../gallery";

export const desc: BlockDesc = {
  ja: "考えを広げる地図だけの部品。段の中に idea <名札> as <名前> of <親> と書くと、その段で考えが濃く現れ、親からの枝の線が伸びる。of の無い idea が真ん中の題で、題の子の枝は左右に分かれて四方へ伸び、葉は枝の外側に並ぶ。枝に書いた [color: <色>] は、その枝の線と葉の枠に引き継ぐ。",
  en: "Mind maps only. Write idea <id> as <name> of <parent> in a step and the idea comes into full colour in that step while a branch line grows from its parent. The idea without of is the centre; its branches split left and right and spread four ways, and leaves sit outside their branch. A [color: <color>] on a branch carries over to its line and the frames of its leaves.",
};
