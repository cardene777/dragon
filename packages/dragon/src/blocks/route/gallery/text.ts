/** 見本帳の一覧の、網の名前と説明 (#3337、#3348) */
import type { BlockText } from "../../gallery";

export const text: BlockText = {
  ja: {
    name: "網",
    desc: "試す図だけの部品。最初の step より前に route <名札>: <節> - <節>, <節> - <節> [from: <節>, to: <節>] と書くと、節と線の網を描く。入力の帯の via にこの網を書くと、送ったチップが from から to まで節の数が最も少ない道を辿り、通った線が強まる。",
  },
  en: {
    name: "Network",
    desc: "Try diagrams only. Write route <id>: <node> - <node>, <node> - <node> [from: <node>, to: <node>] before the first step to draw a network of nodes and lines. Name it in via of the input strip and a sent chip follows the path with the fewest nodes from from to to, and the lines it passes light up.",
  },
};
