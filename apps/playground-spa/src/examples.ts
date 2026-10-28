/**
 * 頁で選べる見本と、新規作成の雛形。記法の file を字のまま読み込む (#2995、#3031、#3032)。
 *
 * 見本の正は `packages/dragon/examples` の file で、英語版は同じ名前に `.en` を付けた file。
 * 時系列図の見本は、入門と OAuth の間に、よく描く形 (往復、やり直し、支払い、署名) を易しい順に並べる (#3167)。
 */
import apiJa from "../../../packages/dragon/examples/api.dragon?raw";
import apiEn from "../../../packages/dragon/examples/api.en.dragon?raw";
import ccipJa from "../../../packages/dragon/examples/ccip.dragon?raw";
import ccipEn from "../../../packages/dragon/examples/ccip.en.dragon?raw";
import introJa from "../../../packages/dragon/examples/intro.dragon?raw";
import introEn from "../../../packages/dragon/examples/intro.en.dragon?raw";
import oauthJa from "../../../packages/dragon/examples/oauth.dragon?raw";
import oauthEn from "../../../packages/dragon/examples/oauth.en.dragon?raw";
import paymentJa from "../../../packages/dragon/examples/payment.dragon?raw";
import paymentEn from "../../../packages/dragon/examples/payment.en.dragon?raw";
import retryJa from "../../../packages/dragon/examples/retry.dragon?raw";
import retryEn from "../../../packages/dragon/examples/retry.en.dragon?raw";
import walletJa from "../../../packages/dragon/examples/wallet.dragon?raw";
import walletEn from "../../../packages/dragon/examples/wallet.en.dragon?raw";

import { type Diagram, parseNotation } from "@cardenelabs/dragon";

import type { Lang } from "./text";

export const EXAMPLE_KEYS = ["intro", "api", "retry", "payment", "wallet", "oauth", "ccip"] as const;
export type ExampleKey = (typeof EXAMPLE_KEYS)[number];

/** 頁を開いた時に出す見本 */
export const FIRST_EXAMPLE: ExampleKey = "oauth";

/** 概要の頁の使いどころに並べる見本。見本を足しても概要の頁は替えない (#3167) */
export const HOME_USES: readonly ExampleKey[] = ["intro", "oauth", "ccip"];

const EXAMPLES: Record<ExampleKey, Record<Lang, string>> = {
  intro: { ja: introJa, en: introEn },
  api: { ja: apiJa, en: apiEn },
  retry: { ja: retryJa, en: retryEn },
  payment: { ja: paymentJa, en: paymentEn },
  wallet: { ja: walletJa, en: walletEn },
  oauth: { ja: oauthJa, en: oauthEn },
  ccip: { ja: ccipJa, en: ccipEn },
};

export const exampleText = (key: ExampleKey, lang: Lang): string => EXAMPLES[key][lang].trimEnd();

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
 * 読めない見本は `undefined`。
 */
export function exampleInfo(key: ExampleKey, lang: Lang): ExampleInfo | undefined {
  const text = exampleText(key, lang);
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

/** 書く欄の中身がどれかの見本そのままなら、その見本と言葉 */
export function whichExample(text: string): { key: ExampleKey; lang: Lang } | undefined {
  for (const key of EXAMPLE_KEYS) {
    for (const lang of ["ja", "en"] as const) {
      if (exampleText(key, lang) === text.trimEnd()) return { key, lang };
    }
  }
  return undefined;
}
