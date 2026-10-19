/**
 * 外した書き方と置き換え先 (#2947 / #2960)。
 *
 * dragon はどの分野にも寄らずに図を描く道具なので、特定の技術や会社に向けた書き方を外した。
 * 外した書き方を黙って受けないために、**書いた人に置き換え先を返す**。 図種と箱の種類は
 * 誤りとして返し、意匠は警告を出して置き換え先で描く (`外した意匠` の説明)。
 *
 * 外した語を受理集合 (`NODE_KIND_VALID` / `TYPE_ALIASES`) から消すだけだと、箱の種類は
 * 見本 (parts) の名前として扱われて「そんな部品は無い」 と出て、図種は「図種が読めません」
 * と出る。 どちらも何に書き換えればよいかが読み取れない。
 *
 * 記法 (`v05/parser.ts`) と JSON (`json-parser.ts`) の両方の入口がこの表を引く。
 * 入口ごとに表を持つと、片方だけ受け付ける形が残る。
 */
import type { DslTheme } from "../keywords";

/** 外した図種と、同じ図を描く書き方 */
export const 外した図種: ReadonlyMap<string, string> = new Map<string, string>([
  ["solidity", "`type: sequence` と `order: 種類`"],
]);

/**
 * cdl から外した挿絵の種類 (cardene777/cdl#1256)。
 *
 * 業界ごとに手で描いた形で、どこまで足しても偏るため cdl 0.140.0 で外した。
 * 外す前の形は cdl の tag `archive/illustration-shapes` から取り出せる。
 */
export const 外した挿絵の種類: readonly string[] = [
  "shape-kanban-card",
  "shape-message-bubble",
  "shape-gear",
  "shape-network-node",
  "shape-iot-sensor",
  "shape-robot-arm",
  "shape-satellite",
  "shape-website",
  "shape-cdn-edge",
  "shape-api-gateway",
  "shape-storefront",
  "shape-warehouse",
  "shape-online-shop",
  "shape-customer-service",
  "shape-lawyer",
  "shape-auditor",
  "shape-regulator",
  "shape-notary",
  "shape-trader",
  "shape-smart-contract",
  "shape-blockchain-block",
  "shape-blockchain",
  "shape-bitcoin-chain",
  "shape-ethereum-chain",
  "shape-blockchain-node",
  "shape-rpc-node",
  "shape-wallet",
  "shape-nft",
  "shape-token",
  "shape-bank",
  "shape-trust-bank",
  "shape-payment-provider",
  "shape-credit-card",
  "shape-brokerage",
  "shape-exchange",
  "shape-atm",
];

/** 外した挿絵の代わり。 1 つに決まらないので、選べる 2 つの道を示す */
const 挿絵の代わり =
  "基本の形 (`shape-file` / `shape-cylinder` など) を使うか、箱に `kindForm: icon` と `icon` を書く";

/**
 * 外した箱の種類と、置き換え先。
 *
 * | 外した種類 | 置き換え先 | 元の役目 |
 * |---|---|---|
 * | `contract` / `proxy` / `library` / `interface` | `card` | Solidity の図の契約 |
 * | `eoa` | `person` | Solidity の図の人が持つ財布 |
 * | `multisig` | `signer` | Solidity の図の複数人の署名 |
 * | `alb` / `ecs` / `iam` / `kms` / `lambda` / `rds` / `s3` | 同じ役目の汎用の種類 | AWS の名前の読み替え |
 * | cdl から外した挿絵 | 基本の形か `kindForm: icon` | 業界ごとの挿絵 |
 *
 * 置き換え先は外す前に読み替えていた先と同じ種類にした (`alb` だけは読み替え先の挿絵が
 * 外れたので `api` にした)。 書き換えた図は外す前と同じ形で描かれる。
 */
export const 外した種類: ReadonlyMap<string, string> = new Map<string, string>([
  ["contract", "`card`"],
  ["proxy", "`card`"],
  ["library", "`card`"],
  ["interface", "`card`"],
  ["eoa", "`person`"],
  ["multisig", "`signer`"],
  ["alb", "`api`"],
  ["ecs", "`microservice`"],
  ["iam", "`admin`"],
  ["kms", "`admin`"],
  ["lambda", "`function`"],
  ["rds", "`database`"],
  ["s3", "`storage`"],
  ...外した挿絵の種類.map((k): [string, string] => [k, 挿絵の代わり]),
]);

/** 外した箱の種類なら、知らせの文面を返す */
export function 外した種類の知らせ(kind: string): { message: string; hint: string } | undefined {
  const 代わり = 外した種類.get(kind);
  if (代わり === undefined) return undefined;
  return {
    message: `箱の種類 "${kind}" は外しました`,
    hint: 外した挿絵の種類.includes(kind) ? 代わり : `代わりに ${代わり} を書く`,
  };
}

/** 外した図種なら、知らせの文面を返す */
export function 外した図種の知らせ(type: string): { message: string; hint: string } | undefined {
  const 代わり = 外した図種.get(type);
  if (代わり === undefined) return undefined;
  return { message: `図種 "${type}" は外しました`, hint: `代わりに ${代わり} を書く` };
}

/**
 * 外した意匠と、置き換え先 (#2960)。
 *
 * 生成りに茶と青磁に墨は色だけを変える意匠で、残る 7 つは地まで含めた 1 枚の絵になる。
 * 色だけの 2 つを外し、近い色みの絵へ置き換える。
 *
 * 図種と箱の種類 (上の 2 つの表) と違い、**誤りにせず置き換え先で描く**。 意匠は図の骨組みを
 * 変えないので、置き換えても図が崩れない。 書いた人には警告で置き換え先を知らせる。
 */
export const 外した意匠: ReadonlyMap<string, DslTheme> = new Map<string, DslTheme>([
  ["kinari", "letterpress"],
  ["生成り", "letterpress"],
  ["生成りに茶", "letterpress"],
  ["celadon", "blueprint"],
  ["青磁", "blueprint"],
  ["青磁に墨", "blueprint"],
]);

/** 外した意匠なら、置き換え先と知らせの文面を返す。 意匠と同じく大文字小文字を区別しない */
export function 外した意匠の知らせ(
  theme: string,
): { replacement: DslTheme; message: string; hint: string } | undefined {
  const 書いた語 = theme.trim();
  const 代わり = 外した意匠.get(書いた語.toLowerCase());
  if (代わり === undefined) return undefined;
  return {
    replacement: 代わり,
    message: `意匠 "${書いた語}" は外しました。 置き換え先の ${代わり} で描きます`,
    hint: `代わりに ${代わり} を書く`,
  };
}
