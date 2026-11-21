/**
 * 帯の初めから在るボタンの名前と、帯の色の欄の名前 (#3789)。
 * 帯の部品 (`dragon-frame.mjs`、`header.mjs`) と、mdの頭の`header-`の行を読む頁の書き出し (`page/read.ts`) が同じ一覧を読む。
 */

/** 帯に初めから在るボタン。並びは設定`buttons`を書かない時に帯へ並ぶ順 */
export const BUILTIN_BUTTONS = ["code", "editor", "copy", "export", "expand"] as const;

/** 帯の色の欄 (`HeaderColors`)。帯の`--dragon-header-<欄>`の変数に入る */
export const HEADER_COLOR_KEYS = ["surface", "background", "foreground", "muted", "border", "accent", "hover"] as const;
