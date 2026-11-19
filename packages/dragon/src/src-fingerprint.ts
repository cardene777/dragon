/**
 * build した本体の code の指紋 (#3748)。build が `packages/dragon/src` の全ての file から作り、本体に埋める (`tsup.config.ts`)。
 * 収めた配管の図の並べ方の鍵に入れ、並べ方を組んだ code と描く code が違う時に、収めた並べ方を使わずにその場で組ませる。
 * build していない src から読む時 (検査) は `src` になる
 */
declare const __DRAGON_SRC_FINGERPRINT__: string | undefined;

export const SRC_FINGERPRINT: string = typeof __DRAGON_SRC_FINGERPRINT__ === "string" ? __DRAGON_SRC_FINGERPRINT__ : "src";
