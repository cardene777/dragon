/**
 * mdから書き出す頁 (#3755) が足す字と、書き出せない訳の文。
 *
 * 頁に足す字は頁の言葉で書き、mdの本文に仮名か漢字があれば日本語、無ければ英語にする。英語は日本語の字をそのまま英語にする。
 */
import type { AlertKind } from "./markdown";

export type PageLang = "ja" | "en";

export interface PageWords {
  /** 入口の名前。項目の頁の戻る link と、目次と上の段のタブの最初の行に書く */
  overview: string;
  /** 入口の項目の札を並べた所の見出し */
  choose: string;
  /** 目次の読み上げの名前。説明の頁 (#3961) では、携帯の幅で目次を開く釦の字にもする */
  contents: string;
  /** 上の段のタブの、段が持つ項目の数 */
  count: (n: number) => string;
  /** 注意書きに題を書かない時の題 */
  alerts: Readonly<Record<AlertKind, string>>;
  /** 説明の頁 (#3876) の全体像の、話題を書いた順に並べた道筋の読み上げの名前 (#3961) */
  topics: string;
  /** 説明の頁の頭の全体像の名前。左の目次の最初の行と、全体像の読み上げの名前に書く (#3961) */
  whole: string;
  /** 話題ごとのタブに分けた説明の頁 (#3983、#3991) の、タブの終わりの前の話題へのlinkの字 */
  prev: string;
  /** 話題ごとのタブに分けた説明の頁の、タブの終わりの次の話題へのlinkの字 */
  next: string;
  /** 話題ごとのタブに分けた説明の頁の、前と次のlinkの並びの読み上げの名前 */
  pages: string;
  /** 話題のタブの頭の、問いと答えの一覧の読み上げの名前 (#3991) */
  questions: string;
  /** 確かめる問いの枠の見出し */
  quiz: string;
  /** 確かめる問いの答えを開く釦の字 */
  answer: string;
  /** 確かめる問いの答えを隠す釦の字と、用語の札を閉じるアイコンの読み上げの名前 */
  close: string;
}

export interface PageMessages {
  /** 頭の `---` の間の `layout` の値が知らない値 */
  badLayout: (value: string, allowed: string) => string;
  /** 頭の `note` の値が `pop` でも `under` でもない (#3877) */
  badNote: (value: string, allowed: string) => string;
  /** 頭の `header-buttons` に帯に無いボタンの名前を書いた (#3789) */
  badHeaderButton: (name: string, allowed: string) => string;
  /** 頭の `header-buttons` に同じボタンを 2 度書いた */
  repeatedHeaderButton: (name: string) => string;
  /** 頭の `header-<色の欄>` の値が空か、色の値の外へ出る字を持つ */
  badHeaderColor: (key: string, value: string) => string;
  /** 頭に知らない `header-` の行を書いた */
  unknownHeaderLine: (key: string, allowed: string) => string;
  /** 頁の題の `#` を 2 つ書いた */
  extraTitle: string;
  /** `##` の段より前に `###` の項目を書いた */
  itemBeforeGroup: string;
  /** `###` の項目より前に、段の中で `####` のタブを書いた */
  tabBeforeItem: string;
  /** `####` のタブの外に `#####` のタブを書いた */
  subTabOutsideTab: string;
  /** 説明の頁で、`##` の話題より前に `###` の節を書いた (#3876) */
  sectionBeforeTopic: string;
  /** 説明の頁の節の題の終わりの `[menu: ]` に名前を書かない (#3961) */
  emptyMenuName: string;
  /** 用語の file に同じ用語を 2 度書いた。`first` は最初に書いた file と行 */
  termTwice: (name: string, first: string) => string;
  /** 用語の file に無い用語への link を書いた */
  missingTerm: (name: string, glossary: string) => string;
  /** 載せる file が無い */
  noFile: (target: string) => string;
  /** 載せる file がmdの在るフォルダの外にある */
  outside: (target: string) => string;
  /** 載せる file が文字の file でない */
  notText: (target: string) => string;
  /** 載せた md が自分を載せ直す */
  loop: (target: string) => string;
  /** 箱の飛び先が頁に無い項目を指す */
  missingPlace: (target: string) => string;
  /** mdを読めない */
  unreadable: (detail: string) => string;
}

export const WORDS: Readonly<Record<PageLang, PageWords>> = {
  ja: {
    overview: "概要",
    choose: "項目を選ぶ",
    contents: "目次",
    count: (n) => `${n}個の項目`,
    alerts: { note: "メモ", tip: "ヒント", important: "大事な点", warning: "注意", caution: "警告" },
    topics: "話題の順",
    whole: "全体像",
    prev: "前へ",
    next: "次へ",
    pages: "前と次の話題",
    questions: "この話題の問いと答え",
    quiz: "確かめる",
    answer: "答え",
    close: "閉じる",
  },
  en: {
    overview: "Overview",
    choose: "Choose an item",
    contents: "Contents",
    count: (n) => (n === 1 ? "1 item" : `${n} items`),
    alerts: { note: "Note", tip: "Tip", important: "Important", warning: "Warning", caution: "Caution" },
    topics: "Topics in order",
    whole: "Overview",
    prev: "Previous",
    next: "Next",
    pages: "Previous and next topics",
    questions: "Questions and answers in this topic",
    quiz: "Check",
    answer: "Answer",
    close: "Close",
  },
};

export const MESSAGES: Readonly<Record<PageLang, PageMessages>> = {
  ja: {
    badLayout: (value, allowed) => `layout の値 ${value} は使えない (${allowed} から選ぶ)`,
    badNote: (value, allowed) => `note の値 ${value} は使えない (${allowed} から選ぶ。pop は頁の全ての図の箱の説明を押すと出る札で見せる)`,
    badHeaderButton: (name, allowed) => `header-buttonsの${name}は帯に無いボタン。${allowed}から選ぶ`,
    repeatedHeaderButton: (name) => `header-buttonsに${name}を2度書いた`,
    badHeaderColor: (key, value) => `${key}の値「${value}」は色として使えない。空にせず、「;」「<」「>」「{」「}」「"」「\\」を書かない`,
    unknownHeaderLine: (key, allowed) => `${key}は書けない頭の行。帯の設定は${allowed}で書く`,
    extraTitle: "頁の題の # は 1 つだけ書く。段は ##、項目は ### で書く",
    itemBeforeGroup: "### の項目は ## の段の下に書く",
    tabBeforeItem: "段の中の #### のタブは ### の項目の下に書く",
    subTabOutsideTab: "##### のタブは #### のタブの下に書く",
    sectionBeforeTopic: "### の節は ## の話題の下に書く",
    emptyMenuName: "[menu: ] に目次に出す短い名前が無い。名前を書くか、[menu: ] を消して問いの全文を目次に出す",
    termTwice: (name, first) => `用語 ${name} を2度書いた (最初は ${first})。1つの用語の説明は1か所にだけ書く`,
    missingTerm: (name, glossary) => `用語の file ${glossary} に用語 ${name} が無い。### の見出しで用語を書く`,
    noFile: (target) => `載せる file が無い: ${target}`,
    outside: (target) => `載せる file ${target} は md の在るフォルダの外にある。md の在るフォルダとその下の file だけを載せる`,
    notText: (target) => `載せる file ${target} は文字の file でない。画像は .png などの拡張子の file にする`,
    loop: (target) => `載せる md ${target} が自分を載せ直す`,
    missingPlace: (target) => `飛び先 ${target} の項目が頁に無い。### の見出しから作った場所の名前を # の後ろに書く`,
    unreadable: (detail) => `md を読めない (${detail})`,
  },
  en: {
    badLayout: (value, allowed) => `layout ${value} is not available (choose from ${allowed})`,
    badNote: (value, allowed) => `note ${value} is not available (choose from ${allowed}; pop shows the box notes of every diagram on the page on cards that open on a click)`,
    badHeaderButton: (name, allowed) => `header-buttons: ${name} is not a bar button (choose from ${allowed})`,
    repeatedHeaderButton: (name) => `header-buttons lists ${name} twice`,
    badHeaderColor: (key, value) => `${key}: "${value}" is not usable as a color. Do not leave it empty or write ; < > { } " \\`,
    unknownHeaderLine: (key, allowed) => `${key} is not a head line. Write the bar settings with ${allowed}`,
    extraTitle: "Write only one # for the page title. Write groups with ## and items with ###",
    itemBeforeGroup: "Write a ### item under a ## group",
    tabBeforeItem: "Write a #### tab in a group under a ### item",
    subTabOutsideTab: "Write a ##### tab under a #### tab",
    sectionBeforeTopic: "Write a ### section under a ## topic",
    emptyMenuName: "[menu: ] has no short name for the menu. Write the name, or remove [menu: ] to show the whole question in the menu",
    termTwice: (name, first) => `The term ${name} is written twice (first at ${first}). Write each term once`,
    missingTerm: (name, glossary) => `No term ${name} in the glossary ${glossary}. Write the term as a ### heading`,
    noFile: (target) => `No such file to include: ${target}`,
    outside: (target) => `The file ${target} is outside the folder of the md. Include only files in that folder and below`,
    notText: (target) => `The file ${target} is not a text file. Give images an extension such as .png`,
    loop: (target) => `The md ${target} includes itself again`,
    missingPlace: (target) => `No item on the page for the link ${target}. Write the place name made from a ### heading after #`,
    unreadable: (detail) => `Cannot read the md (${detail})`,
  },
};
