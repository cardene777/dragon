/**
 * 頁で選べる見本と、新規作成の雛形。記法の file を字のまま読み込む (#2995、#3031、#3032)。
 *
 * 見本の正は `packages/dragon/examples` の file で、英語版は同じ名前に `.en` を付けた file。
 * 時系列図の見本は、入門と OAuth の間に、よく描く形 (往復、やり直し、支払い、署名) を易しい順に並べる (#3167)。
 * どの図の種類も見本を 4 枚以上持ち、前からある見本の後に、今の見本と逆の分野 (一般か Web3) の題を足した (#3615)。
 *
 * 概要の頁の用例と編集画面の最初の見本 (`FIRST_SCREEN_EXAMPLES`) の日本語の記法だけを最初に読み、待たずに出す。
 * 英語の記法は英語の画面の字と同じ英語の塊 (`english.ts`) に入れ、頁は英語の塊が届いてから英語で描く (#3646)。
 * ほかの見本は `examples-later.ts` の 1 つの塊にし、最初の画面を描いた後に記法だけを裏で読む (#3246)。見本が使う読み方は、見本を並べる所が待つ時に読む (#3505)。
 * 届く前の見本の記法は `undefined` で、届いたかは `LATER_EXAMPLES` の状態で分かる。
 */
import ccipJa from "../../../packages/dragon/examples/ccip.dragon?raw";
import introJa from "../../../packages/dragon/examples/intro.dragon?raw";
import oauthJa from "../../../packages/dragon/examples/oauth.dragon?raw";

import { type Diagram, loadReadings, parseNotation } from "@cardenelabs/dragon/light";

import { laterChunk } from "./site/later";
import { LATER_ENGLISH, type Lang } from "./text";

export const EXAMPLE_KEYS = ["intro", "api", "retry", "payment", "wallet", "oauth", "ccip", "bridge", "shop", "video", "order", "tx-status", "subscription", "support-ticket", "rebase", "merge", "hotfix", "squash", "finality", "withdraw", "release-plan", "shop-opening", "merkle", "tournament", "sitemap", "hd-wallet", "auction", "clinic", "kanban", "rollup-batch", "tx-block", "checkout-lanes", "stock-reserve", "multisig", "swap", "swap-revert", "swap-two-hops", "swap-retry", "vault-proxy", "aggregator", "os-share", "tickets", "gas-fee", "staking-rewards", "shop-funnel", "wallet-onboarding", "login-check", "login-all-paths", "approve-deposit", "return-check", "eth-slot", "sprint", "pdca", "restake", "budget-app", "trip-plan", "dao-proposal", "wallet-ux", "order-total", "library-loan", "nft-sale", "token-transfer", "task-priority", "risk-matrix", "token-listing", "chain-choice", "wallet-usage", "l2-chains", "hobbies", "skills"] as const;
export type ExampleKey = (typeof EXAMPLE_KEYS)[number];

/** 最初に読む見本。概要の頁の用例と編集画面の最初の見本 */
export const FIRST_SCREEN_EXAMPLES = ["intro", "oauth", "ccip"] as const;
export type FirstScreenKey = (typeof FIRST_SCREEN_EXAMPLES)[number];
/** 後から読む見本 */
export type LaterExampleKey = Exclude<ExampleKey, FirstScreenKey>;

/** 頁を開いた時に出す見本 */
export const FIRST_EXAMPLE: FirstScreenKey = "oauth";

/** 概要の頁の使いどころに並べる見本。見本を足しても概要の頁は替えない (#3167) */
export const HOME_USES: readonly FirstScreenKey[] = ["intro", "oauth", "ccip"];

/** 最初に読む見本の日本語の記法。英語の記法は英語の塊が持つ */
const FIRST_JA: Record<FirstScreenKey, string> = { intro: introJa, oauth: oauthJa, ccip: ccipJa };

/**
 * 後から読む見本の塊。見本の題と種類を引く所 (見本帳、棚、部品の頁) は届いた見本の記法を待たずに読むので、
 * 見本が使うブロックの読み方を読んでから届いたことにする (#3349)。描く部品は読まず、図を描く所が種類の塊を待つ。
 * 絵柄集 Tabler の絵柄を書く見本 (橋の見本) は、題と種類を読むにも表の塊 (gzip で約 225KB) が要るので、この塊を待つ所が表も読む (#3505)
 */
export const LATER_EXAMPLES = laterChunk(() => import("./examples-later").then((m) => m.withReadings(loadReadings)));

const isFirstScreen = (key: ExampleKey): key is FirstScreenKey => (FIRST_SCREEN_EXAMPLES as readonly ExampleKey[]).includes(key);

/** 最初の画面の見本の英語の記法。英語の塊がまだ届いていないか読めなかった時は `undefined` */
function firstScreenEnglish(key: FirstScreenKey): string | undefined {
  const english = LATER_ENGLISH.state();
  return english.status === "ready" ? english.value.examples[key].trimEnd() : undefined;
}

/**
 * 最初の画面の見本の記法。英語は英語の塊が届いてから読め、届く前に読むと断る。
 * 頁は英語の塊が届いてから英語で描くので、英語の頁で呼ぶ時は届いている
 */
export function firstScreenText(key: FirstScreenKey, lang: Lang): string {
  if (lang === "ja") return FIRST_JA[key].trimEnd();
  const english = firstScreenEnglish(key);
  if (english === undefined) throw new Error("英語の見本がまだ届いていない。英語で描く前に whenText を待つ");
  return english;
}

/** 見本の記法。後から読む見本と最初の画面の見本の英語の記法がまだ届いていないか読めなかった時は `undefined` */
export function exampleText(key: ExampleKey, lang: Lang): string | undefined {
  if (isFirstScreen(key)) return lang === "ja" ? firstScreenText(key, lang) : firstScreenEnglish(key);
  const later = LATER_EXAMPLES.state();
  return later.status === "ready" ? later.value[key][lang].trimEnd() : undefined;
}

export interface ExampleInfo {
  title: string;
  kind: Diagram["kind"];
  /** 何を示す見本か。file の最初の注釈の行 */
  about: string;
}

/**
 * 見本の題と図の種類と説明 (#3032)。
 *
 * 題と種類は記法を読んで取り、説明は file の最初の注釈の行 (`// `) から取る。頁の側に写して持たない。
 * 読めない見本と、まだ届いていない見本は `undefined`。
 */
export function exampleInfo(key: ExampleKey, lang: Lang): ExampleInfo | undefined {
  const text = exampleText(key, lang);
  if (text === undefined) return undefined;
  const parsed = parseNotation(text);
  if (!parsed.ok) return undefined;
  const first = text.split("\n")[0] ?? "";
  return { title: parsed.diagram.title, kind: parsed.diagram.kind, about: first.startsWith("//") ? first.replace(/^\/\/\s*/u, "") : "" };
}

/** 新規作成で書く欄に入れる雛形。箱 2 つと段 1 つの、そのまま描ける図 (#3031) */
export const TEMPLATE: Record<Lang, string> = {
  ja: ["sequence 新しい図", "", "box 甲", "box 乙", "", "step 最初の段", "  say この段で起きることを書く。", "  甲 -> 乙: 呼ぶ"].join("\n"),
  en: ["sequence New diagram", "", "box a as A", "box b as B", "", "step First step", "  say Write what happens in this step.", "  a -> b: call"].join("\n"),
};

/**
 * 新規作成で付ける書類名。見本でない図を開いた時と、名前を空にして書き出した時も使う。
 * 指で触るタブレットの英語の書類名の欄は 5 字までなので、untitled ではなく収まる new にする (#3089)
 */
export const NEW_FILE_NAME = "new.dragon";

/** 書く欄の中身がどれかの見本そのままなら、その見本と言葉。まだ届いていない見本とは比べない */
export function whichExample(text: string): { key: ExampleKey; lang: Lang } | undefined {
  for (const key of EXAMPLE_KEYS) {
    for (const lang of ["ja", "en"] as const) {
      if (exampleText(key, lang) === text.trimEnd()) return { key, lang };
    }
  }
  return undefined;
}
