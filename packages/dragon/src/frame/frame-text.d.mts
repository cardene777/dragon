import type { NotationLang } from '../words';
/** 帯に出す字の表。言葉ごとに同じ名前の字を持つ */
export const FRAME_TEXT: Record<NotationLang, Record<string, string | ((n: number) => string)>>;
/** 帯の言葉。設定`lang`、`node`から上の`lang`属性、英語の順に決める */
export function frameLang(lang: string | undefined, node?: Element | null): NotationLang;
