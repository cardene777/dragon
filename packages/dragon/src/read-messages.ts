/**
 * 原本を読む時に、原本の形の検査を読む前から要る文 (#3846)。道具より新しい版の誤りと、版1を移して読んだ警告と、検査を読む前に原本を読んだ誤り。
 *
 * ほかの原本の誤りの文 (`field-messages.ts`) は原本の形の検査の塊 (`schemas/validator.ts`) と一緒に後から読み、最初に読む束に入れない。
 * 原本の誤りの文の表もこの表を混ぜて持つので、文はここにだけ書く
 */
import type { NotationLang } from "./words";

export interface ReadMessages {
  /** 道具より新しい版の図 */
  newer: (version: number, tool: number) => string;
  /** 古い版の図を今の版の形に移して読んだ時の警告 (#3346) */
  upgraded: (version: number, tool: number) => string;
  /** 軽い入口で原本の形の検査を読む前に原本を読んだ時 (#3400) */
  validatorNotLoaded: string;
}

export const READ_MESSAGES: Record<NotationLang, ReadMessages> = {
  ja: {
    newer: (version, tool) => `版 ${version} の図は、この道具 (版 ${tool}) より新しいので読めない。道具を新しくする`,
    upgraded: (version, tool) => `版 ${version} の図を版 ${tool} の形に移して読んだ。file を書き換えるには migrateFile を使う`,
    validatorNotLoaded: "原本の形の検査 (schema check) を読んでいない。原本の JSON を読む前に、loadFor にその原本を渡して待つ",
  },
  en: {
    newer: (version, tool) => `Version ${version} diagrams are newer than this tool (version ${tool}) and cannot be read. Update the tool`,
    upgraded: (version, tool) => `Read a version ${version} diagram by moving it to the version ${tool} shape. Use migrateFile to rewrite the file`,
    validatorNotLoaded: "The schema check for diagram JSON is not loaded. Await loadFor with the JSON before reading it",
  },
};
