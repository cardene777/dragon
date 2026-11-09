/**
 * 手順の図の描く部品 (#3561)。並べ方は図の種類の置き場 (`kinds/flow/layout.ts`)、線と段の印と箱の字の描き方は `render/flow.ts`、
 * 判断のひし形の描き方は判断のブロックの置き場が持つ
 */
export { layoutFlow } from "./flow/layout";
export { flowCss, flowHooks, flowTimes, stepMarks } from "../render/flow";
