/**
 * 見本が少ない図の種類に見本を足す (#3615)。
 *
 * 12 種類 (回り続ける図 #3623 を足した数) のどれも、カタログの種類の頁 (`catalog/catalog.ts` の `samplesOf`) に見本を 4 枚以上載せる。
 * 足した 21 枚は日本語と英語の記法を持ち、英語版は日本語版と同じ形 (部品の数、段の数、段ごとの出来事の数) で、どちらも崩れを出さない。
 * 題材は、今の見本が Web3 に寄る種類には一般の題を、一般に寄る種類には Web3 の題を足し、見本を足した種類は Git の図を除いて両方を持つ。
 * 題材の分野は記法から読めないので、この file の表が持つ。表は #3615 の「決めたこと (step 2)」の写し。
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { checkLayoutText, parseNotation } from "@cardenelabs/dragon";
import { beforeAll, describe, expect, it } from "vitest";

import { KINDS, type Kind, samplesOf } from "../catalog/catalog";
import { EXAMPLE_KEYS, exampleInfo, exampleText, LATER_EXAMPLES } from "../examples";
import type { Lang } from "../text";
import { root } from "./playground-support";

type Field = "general" | "web3";

/** 足す見本。名前、図の種類、題材の分野 */
const ADDED: Readonly<Record<string, { kind: Kind; field: Field }>> = {
  "tx-status": { kind: "state", field: "web3" },
  subscription: { kind: "state", field: "general" },
  "support-ticket": { kind: "state", field: "general" },
  tournament: { kind: "tree", field: "general" },
  sitemap: { kind: "tree", field: "general" },
  "hd-wallet": { kind: "tree", field: "web3" },
  clinic: { kind: "lineup", field: "general" },
  kanban: { kind: "lineup", field: "general" },
  "rollup-batch": { kind: "lineup", field: "web3" },
  "checkout-lanes": { kind: "try", field: "general" },
  "stock-reserve": { kind: "try", field: "general" },
  multisig: { kind: "try", field: "web3" },
  shop: { kind: "architecture", field: "general" },
  video: { kind: "architecture", field: "general" },
  "gas-fee": { kind: "chart", field: "web3" },
  "staking-rewards": { kind: "chart", field: "web3" },
  "approve-deposit": { kind: "flow", field: "web3" },
  "return-check": { kind: "flow", field: "general" },
  hotfix: { kind: "git", field: "general" },
  squash: { kind: "git", field: "general" },
  "shop-opening": { kind: "time", field: "general" },
};

/** 今ある 27 枚。名前と図の種類と、見本を足す種類だけ題材の分野 */
const EXISTING: Readonly<Record<string, { kind: Kind; field?: Field }>> = {
  intro: { kind: "sequence" },
  api: { kind: "sequence" },
  retry: { kind: "sequence" },
  payment: { kind: "sequence" },
  wallet: { kind: "sequence" },
  oauth: { kind: "sequence" },
  ccip: { kind: "architecture", field: "web3" },
  bridge: { kind: "architecture", field: "web3" },
  order: { kind: "state", field: "general" },
  rebase: { kind: "git" },
  merge: { kind: "git" },
  finality: { kind: "time", field: "web3" },
  withdraw: { kind: "time", field: "web3" },
  "release-plan": { kind: "time", field: "general" },
  merkle: { kind: "tree", field: "web3" },
  auction: { kind: "lineup", field: "web3" },
  "tx-block": { kind: "try", field: "web3" },
  swap: { kind: "pipe" },
  "swap-revert": { kind: "pipe" },
  "swap-two-hops": { kind: "pipe" },
  "swap-retry": { kind: "pipe" },
  "vault-proxy": { kind: "pipe" },
  aggregator: { kind: "pipe" },
  "os-share": { kind: "chart", field: "general" },
  tickets: { kind: "chart", field: "general" },
  "login-check": { kind: "flow", field: "general" },
  "login-all-paths": { kind: "flow", field: "general" },
};

const LANGS: readonly Lang[] = ["ja", "en"];
const EXAMPLES_DIR = join(root, "packages/dragon/examples");
const registered = (key: string): boolean => (EXAMPLE_KEYS as readonly string[]).includes(key);

/** 足した見本の記法。一覧に無い間は空の字 */
function textOf(key: string, lang: Lang): string {
  if (!registered(key)) return "";
  return exampleText(key as (typeof EXAMPLE_KEYS)[number], lang) ?? "";
}

/** 図の形。部品の種類ごとの数、段の数、段ごとの出来事の種類ごとの数 */
function shapeOf(text: string): unknown {
  const read = parseNotation(text);
  if (!read.ok) return { unreadable: read.errors };
  const d = read.diagram;
  const count = (types: readonly string[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const type of types) counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  };
  return {
    kind: d.kind,
    blocks: Object.fromEntries(Object.entries(d.blocks as Record<string, readonly unknown[]>).map(([name, list]) => [name, list.length])),
    steps: d.steps.map((step) => count(step.events.map((event) => event.type))),
  };
}

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "後から読む見本の塊が届かない").toBe("ready");
});

describe("見本が少ない図の種類に見本を足す (#3615)", () => {
  it("every-kind-has-four-examples", () => {
    expect(KINDS.length, "カタログの図の種類の数").toBe(14);
    const short = KINDS.map((kind) => ({ kind, count: samplesOf(kind).length })).filter(({ count }) => count < 4);
    expect(short, "見本が 4 枚に届かない種類").toEqual([]);
  });

  it("added-examples-have-both-langs", () => {
    for (const key of Object.keys(ADDED)) {
      for (const file of [`${key}.dragon`, `${key}.en.dragon`]) {
        expect(existsSync(join(EXAMPLES_DIR, file)), `packages/dragon/examples/${file} が無い`).toBe(true);
      }
      expect(registered(key), `${key} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
      const ja = textOf(key, "ja");
      const en = textOf(key, "en");
      expect(ja, `${key} の日本語の記法が届かない`).not.toBe("");
      expect(en, `${key} の英語の記法が届かない`).not.toBe("");
      expect(shapeOf(en), `${key} の英語版の形が日本語版と違う`).toEqual(shapeOf(ja));
      expect(exampleInfo(key as (typeof EXAMPLE_KEYS)[number], "ja")?.kind, `${key} の図の種類`).toBe(ADDED[key]?.kind);
    }
  });

  it("added-examples-have-no-breaks", () => {
    for (const key of Object.keys(ADDED)) {
      for (const lang of LANGS) {
        const text = textOf(key, lang);
        expect(text, `${key} ${lang} の記法が届かない`).not.toBe("");
        const breaks = checkLayoutText(text, { lang });
        expect(
          breaks.map((b) => JSON.stringify(b)),
          `${key} ${lang} の崩れ`,
        ).toEqual([]);
      }
    }
  });

  it("added-examples-cover-general-and-web3", () => {
    const added = Object.entries(ADDED).filter(([key]) => registered(key));
    expect(added.length, "見本の一覧に載った足した見本の数").toBe(Object.keys(ADDED).length);
    expect(new Set(added.map(([, info]) => info.field)), "足した見本の題材の分野").toEqual(new Set(["general", "web3"]));
    const fields = new Map<Kind, Set<Field>>();
    for (const [key, info] of [...Object.entries(EXISTING), ...added]) {
      if (!info.field || !registered(key)) continue;
      fields.set(info.kind, (fields.get(info.kind) ?? new Set()).add(info.field));
    }
    const kinds = [...new Set(added.map(([, info]) => info.kind))].filter((kind) => kind !== "git");
    const oneSided = kinds.filter((kind) => (fields.get(kind)?.size ?? 0) < 2);
    expect(oneSided, "一般と Web3 の片方の見本しか持たない種類").toEqual([]);
  });

  it("existing-examples-stay", () => {
    for (const [key, info] of Object.entries(EXISTING)) {
      expect(registered(key), `${key} が見本の一覧から消えた`).toBe(true);
      expect(exampleInfo(key as (typeof EXAMPLE_KEYS)[number], "ja")?.kind, `${key} の図の種類`).toBe(info.kind);
    }
  });
});
