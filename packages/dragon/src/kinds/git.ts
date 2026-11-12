/** 枝分かれの図の描く部品の組 (#3248、#3656)。並べ方は図の種類の置き場 (`kinds/git/layout.ts`、#3347)、線と commit と札の描き方は `render/git.ts` が持つ (#3164) */
import { drawGit } from "../render/git";
import { type GitLayout, layoutGit } from "./git/layout";
import type { KindParts } from "./parts";

export const parts: KindParts<GitLayout> = {
  layout: layoutGit,
  draw: (layout, diagram, ctx) => {
    const git = drawGit(layout, diagram, ctx.t, ctx);
    return { base: git.links, lit: git.lines, node: git.commits, top: git.tags };
  },
};
