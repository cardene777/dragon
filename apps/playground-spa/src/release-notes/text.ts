/**
 * 更新履歴の頁だけが使う言葉。日本語と英語の 2 つを持つ (#3880)。
 *
 * 更新履歴の頁 (`ReleaseNotes.tsx`) だけがこの file を読むので、build はこの字を頁と一緒に後から読む塊に入れる (#3832)。
 * 頁の題と上の帯の行き先の名前は、頁の題と上の帯が使うので最初に読む言葉の表 (`../text.ts`) に残す。
 */
import type { Lang } from "../text";

interface ReleaseNotesText {
  crumb: string;
  eyebrow: (version: string) => string;
  /** 見出しの終わりの差し色の語 */
  accent: string;
  lead: string;
  changelog: string;
}

export const RELEASE_NOTES_TEXT: Readonly<Record<Lang, ReleaseNotesText>> = {
  ja: {
    crumb: "道筋",
    eyebrow: (version) => `公開の記録 · ${version} が最新`,
    accent: "履歴",
    lead: "dragon の今の版を示す。版ごとの詳しい変更は GitHub 上の CHANGELOG.ja.md で読める。",
    changelog: "変更の記録を GitHub で見る",
  },
  en: {
    crumb: "Breadcrumb",
    // 区切りは `•` にする。`·` は日本語の字の並びに使われ、英語の頁に日本語が残ったように読めるため (前のサイトの #2455)
    eyebrow: (version) => `Release log • ${version} is current`,
    accent: "notes",
    lead: "Shows the current dragon version. The detailed record for each version is in CHANGELOG.md on GitHub.",
    changelog: "See the change log on GitHub",
  },
};
