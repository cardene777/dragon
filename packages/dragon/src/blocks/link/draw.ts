/**
 * 飛び先の描き方 (#3345、#3199)。
 *
 * 飛び先を持つ箱は、描いた箱の札をその飛び先への link (`<a>`) で包み、押すとその頁へ移る。
 */
import { esc } from "../../render/parts";

/** 箱の飛び先 (#3199)。飛び先を持つ箱の札を、その飛び先への link で包む */
export const linkTo = (link: string | undefined, markup: string): string => (link === undefined ? markup : `<a href="${esc(link)}">${markup}</a>`);
