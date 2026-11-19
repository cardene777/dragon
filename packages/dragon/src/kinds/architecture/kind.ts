/**
 * 構成図 (`architecture`) の定義 (#3345)。
 * 区画を上から帯に積み、箱を全ての帯で共通の列に並べて、線を縦と横の折れ線で引く。5 つの付け方を全て受け付ける。
 * 並べ方 (`layout.ts`) は種類の登録の file (`kind-use/architecture.ts`) が登録簿へ登録し、この定義は読まない (#3763)
 */
import type { EagerKind } from "../kind";

export const kind: EagerKind = {
  name: "architecture",
  accepts: ["place", "connect", "ride-on-line", "attach-to-box", "attach-to-figure"],
  short: true,
};
