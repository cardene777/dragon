/**
 * 検査用の build (`overlap-build.config.ts`) で、図を描く package の重なりを探す所 (`findOverlaps`) の代わりに読ませる (#3197)。
 *
 * 本物の `render/ink` をそのまま出し、`findOverlaps` だけを包み (`packages/dragon/test/paired-overlap.ts`)、
 * 2 段目に図に描いた 2 つの字を組にした重なりを 1 件足す。本番の build はこの file を読まない。
 */
import * as ink from "../../../../packages/dragon/src/render/ink";
import { withPairedOverlap } from "../../../../packages/dragon/test/paired-overlap";

export * from "../../../../packages/dragon/src/render/ink";

export const findOverlaps = withPairedOverlap(ink.findOverlaps);
