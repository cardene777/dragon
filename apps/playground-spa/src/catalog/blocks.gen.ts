// packages/dragon/scripts/build-blocks.mjs が置き場の dir から書き出した。手で直さない

/** 見本帳の一覧の名前と説明。鍵はブロックの置き場の dir の名前 */
export const BLOCK_TEXT = {} as const;

/** 編集画面の棚に置く部品の名前。鍵はブロックの置き場の dir の名前 */
export const BLOCK_SHELF = {} as const;

/** 使い方の頁の段落。鍵はブロックの置き場の dir の名前 */
export const BLOCK_DOCS = {} as const;

/** `GRAMMAR.md` の部品と使い方の表の行。鍵はブロックの置き場の dir の名前 */
export const BLOCK_RULE = {} as const;
