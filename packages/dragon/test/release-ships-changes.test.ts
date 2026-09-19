/**
 * 配る中身が変わらない版を、黙って切らせない (#2277)。
 *
 * `0.31.0` を切った時、`packages/dragon` が配る中身は `0.30.0` と 1 file も違わなかった。
 * それでも変更履歴の `[0.31.0]` の節には項目が並び、入れた人が観測できない直し (画面) を
 * 説明していた。 版番号が「配る package の版」 と「repo 全体の区切り」 を兼ねているため。
 *
 * ## 配る中身を `src` だけで測ってはいけない
 *
 * 起票時は `packages/dragon/src` と `schema` の差分件数で測っており、過去 26 版のうち
 * **9 件が 0 件** に見えていた。 しかし `package.json` の `dependencies` を足して測り直すと
 * **2 件** になる。
 *
 * ```
 * src だけ 0 件の 9 版のうち 7 件は、記法の engine の版を上げていた
 * 例 = v0.27.0 は @cardenelabs/cdl ^0.34.0 → ^0.36.0
 * ```
 *
 * 入れた人は依存ごと受け取るので、engine の版が動けば **受け取る code は変わる**。
 * `src` の差分件数は配る中身の代理でしかなく、そこで判定すると 7 件を誤って
 * 「何も配っていない版」 と呼ぶことになる。
 *
 * だから配る中身は 2 つを合わせて測る。
 *
 * | 何を | なぜ |
 * |---|---|
 * | `packages/dragon/src` と `schema` の差分件数 | 自分が書いた code |
 * | `package.json` の配布に効く欄 | 入れた人が一緒に受け取るもの |
 *
 * `version` と `scripts` と `devDependencies` は見ない = 入れた人に届かないか、
 * 版を切ること自体で必ず変わるため、見ると全ての版が「変わった」 になる。
 *
 * ## 過去の版は動かさない
 *
 * 記録は write-once なので、切り終えた版の節に後から 1 行足すことはしない。
 * 過去に配る中身が変わらないまま切った版は下の `宣言` が理由つきで持つ。
 * これから切る版は、変更履歴のその節に理由を書く。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");
const CHANGELOG = readFileSync(join(REPO, "CHANGELOG.md"), "utf8");
const 版 = (
  JSON.parse(readFileSync(join(ここ, "..", "package.json"), "utf8")) as { version: string }
).version;

const git = (...args: string[]): string =>
  execFileSync("git", ["-C", REPO, ...args], { encoding: "utf8" }).trim();

/**
 * 変更履歴のその節に書く合図。
 *
 * **入れた人が読む場所に書く**。 検査の中の宣言だけに書くと、package を入れた人からは
 * 見えないまま「何か直ったらしい節」 が残る = この検査が直そうとしている形そのものになる。
 */
const 合図 = "配る中身は前の版から変わっていない";

/**
 * 配る中身が変わらないまま切った過去の版と、その理由。 **書き換えず、足すだけ**。
 *
 * 切り終えた節は動かさないと決めたので、理由はここが持つ。 これから切る版は
 * 変更履歴の節に `合図` を書く = ここには増えない。
 */
const 宣言: ReadonlyMap<string, string> = new Map([
  [
    "0.24.0",
    "画面の側の直しだけを集めた版。 記法の engine は 0.31.0 から折れ線の 3 つの見せ方を" +
      " 持っており、見本帳の記法がそれを書いていなかったのを画面の切替から流し込む形で直した。" +
      " 配る側は 0.23.0 と同じ中身",
  ],
  [
    "0.31.0",
    "repo 全体の区切りとして切った版 (#2276)。 直した中身は画面 (携帯の幅で図が読めない件) で、" +
      " 配る側は 0.30.0 と同じ中身。 この版を入れた人が受け取る code は変わらない",
  ],
]);

/** 版の tag に付く形。 前触れ (`v0.8.0-rc1`) も同じ版として扱う */
const その版のtag = (tag: string, v: string): boolean => tag === `v${v}` || tag.startsWith(`v${v}-`);

const 全部のtag = (): string[] =>
  git("tag", "--list", "v*", "--sort=-v:refname")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");

/**
 * いまの版が配る中身を測る 2 点 (#2303)。
 *
 * **その版に tag があるかで分ける**。 分けないと、版を切った後に入れた直しが
 * 切り終えた版の中身として数えられる。
 *
 * | いまの版 | 測る範囲 | 意味 |
 * |---|---|---|
 * | tag がある (切り終えている) | 1 つ前の tag → その版の tag | その版が実際に配った中身 |
 * | tag が無い (これから切る) | 一番新しい tag → `HEAD` | これから配る中身 |
 *
 * 元は `その版の tag は使わない` として常に `1 つ前の tag → HEAD` を測っていた。
 * 外していた理由は「tag を打った直後に範囲が空になり、検査が何も見なくなる」 ことだが、
 * 上の表の 1 行目は `v0.30.0 → v0.31.0` を測るので範囲は空にならない。
 *
 * 元の形は両方向に外れていた。
 *
 * | 向き | 起きること |
 * |---|---|
 * | 誤って落ちる | 中身が空のまま切って宣言した版に、後から入れた直しが混ざる (実測 = `0.31.0` が `compile.ts` 1 件で落ちた、#2300) |
 * | 誤って通る | 中身が空の版を宣言せずに切っても、**後から 1 つ commit すれば黙る** |
 *
 * 2 つ目のほうが重い = この関門は版を切った後に commit するだけで外せる状態だった。
 */
function 測る範囲を決める(v: string): { 基準: string; 対象: string } | undefined {
  const tags = 全部のtag();
  const i = tags.findIndex((t) => その版のtag(t, v));
  if (i === -1) {
    // まだ切っていない版。 一番新しい tag から手元までが、これから配る中身
    const 一番新しい = tags[0];
    return 一番新しい === undefined ? undefined : { 基準: 一番新しい, 対象: "HEAD" };
  }
  // 切り終えた版。 その版の tag までが、その版が配った中身
  const 前 = tags[i + 1]; // 新しい順に並ぶので 1 つ後ろが 1 つ前の版
  return 前 === undefined ? undefined : { 基準: 前, 対象: tags[i]! };
}

/** 配布に効く欄。 入れた人が受け取るものだけを並べる */
const 配布に効く欄 = [
  "dependencies",
  "peerDependencies",
  "exports",
  "files",
  "bin",
  "main",
  "module",
  "types",
] as const;

/** その位置の `package.json` のうち、配布に効く欄だけ。 読めなければ `undefined` */
function 配布の欄(位置: string): string | undefined {
  let 生: string;
  try {
    生 = git("show", `${位置}:packages/dragon/package.json`);
  } catch {
    return undefined;
  }
  const j = JSON.parse(生) as Record<string, unknown>;
  const 抜く: Record<string, unknown> = {};
  for (const k of 配布に効く欄) if (j[k] !== undefined) 抜く[k] = j[k];
  return JSON.stringify(抜く);
}

interface 測り {
  /** `src` と `schema` で変わった file の数 */
  code: number;
  /** 配布に効く欄が変わったか。 どちらかの位置を読めなければ `undefined` */
  欄: boolean | undefined;
}

function 配る中身を測る(基準: string, 対象: string): 測り {
  const code = git(
    "diff",
    "--name-only",
    `${基準}..${対象}`,
    "--",
    "packages/dragon/src",
    "packages/dragon/schema",
  )
    .split("\n")
    .filter((l) => l !== "").length;
  const 前 = 配布の欄(基準);
  const 後 = 配布の欄(対象);
  return { code, 欄: 前 === undefined || 後 === undefined ? undefined : 前 !== 後 };
}

/**
 * 配る中身が変わったか。
 *
 * **欄を読めなかった時は「変わった」 に倒す** = 測れていないことを理由に
 * 「何も配っていない版」 と呼ばない (呼ぶと理由を書けと求める側に落ち、書けば通ってしまう)。
 */
const 変わった = (m: 測り): boolean => m.code > 0 || m.欄 !== false;

/** 変更履歴のその版の節。 節が無ければ `undefined` */
function 節を取る(v: string): string | undefined {
  const 始まり = CHANGELOG.indexOf(`## [${v}]`);
  if (始まり === -1) return undefined;
  const 次 = CHANGELOG.indexOf("\n## ", 始まり + 1);
  return CHANGELOG.slice(始まり, 次 === -1 ? undefined : 次);
}

describe("配る中身が変わらない版を黙って切らせない (#2277)", () => {
  it("tag と package.json を読めている (空振り検知)", () => {
    const tags = 全部のtag();
    expect(tags.length, "版の tag を 1 つも読めていない (git fetch --tags が要る)").toBeGreaterThan(
      0,
    );
    expect(版, "packages/dragon の版を読めていない").toMatch(/^\d+\.\d+\.\d+/);
    expect(配布の欄("HEAD"), "HEAD の package.json の配布に効く欄を読めていない").toBeDefined();
  });

  it("**配る中身が変わった版をちゃんと変わったと測れる** (植え込み対照)", () => {
    // 「変わらない版が 0 件」 を期待する側を持つので、測り方が実物と噛み合っているかを
    // 別に確かめる。 過去の版のうち 1 件でも「変わった」 と出なければ測り方が壊れている
    const tags = [...全部のtag()].reverse();
    const 変わった版: string[] = [];
    for (let i = 1; i < tags.length; i++) {
      if (変わった(配る中身を測る(tags[i - 1]!, tags[i]!))) 変わった版.push(tags[i]!);
    }
    expect(
      変わった版.length,
      `過去 ${tags.length - 1} 版のどれも「配る中身が変わった」 と測れない (測り方が壊れている)`,
    ).toBeGreaterThan(0);
  });

  it("**`src` だけで測ると誤る版が実在する** (測り方を狭めたら落ちる)", () => {
    /*
     * この検査が守るのは「配る中身を `src` だけで測らない」 という判断そのもの。
     * `code` が 0 で `欄` が変わった版 = `src` だけで測ると「何も配っていない版」 に
     * 見えるが、実際は依存の版が動いていて入れた人が受け取る code は変わる。
     *
     * 実測 (2026-09-19) = 過去 26 版のうち `src` だけ 0 件は 9 件、そのうち 7 件がこれ。
     * 件数は実物から数えるので、版が増えても書き換えは要らない。
     */
    const tags = [...全部のtag()].reverse();
    const 誤る版: string[] = [];
    for (let i = 1; i < tags.length; i++) {
      const m = 配る中身を測る(tags[i - 1]!, tags[i]!);
      if (m.code === 0 && m.欄 === true) 誤る版.push(tags[i]!);
    }
    expect(
      誤る版.length,
      `\`src\` だけで測っても誤らない版しかない = この検査が守る判断の根拠が実物から消えた` +
        ` (過去 ${tags.length - 1} 版を走査)`,
    ).toBeGreaterThan(0);
  });

  it("宣言した版は、いまも配る中身が変わらないままである (宣言の古さを見る)", () => {
    const tags = [...全部のtag()].reverse();
    const 古い: string[] = [];
    for (const [v, 理由] of 宣言) {
      expect(理由.trim().length, `宣言の理由が空: ${v}`).toBeGreaterThan(0);
      const i = tags.findIndex((t) => その版のtag(t, v));
      expect(i, `宣言した版の tag が無い: v${v}`).toBeGreaterThan(0);
      if (変わった(配る中身を測る(tags[i - 1]!, tags[i]!))) 古い.push(v);
    }
    expect(古い, `宣言が古い。 配る中身が変わっているので 宣言 から外す\n${古い.join("\n")}`).toEqual(
      [],
    );
  });

  it("配る中身が変わらないなら、理由が書かれている", () => {
    const 測った範囲 = 測る範囲を決める(版);
    expect(測った範囲, `${版} を測る 2 点が取れない (tag が 1 つも無い)`).toBeDefined();

    const 測 = 配る中身を測る(測った範囲!.基準, 測った範囲!.対象);
    const 内訳 = `範囲 ${測った範囲!.基準}..${測った範囲!.対象} / code ${測.code} 件 / 配布の欄 ${
      測.欄 === undefined ? "読めず" : 測.欄 ? "変わった" : "同じ"
    }`;

    if (変わった(測)) {
      // 配るものがあるので何も求めない。 宣言に載っていたら古い
      expect(宣言.has(版), `${版} は配る中身が変わっているのに 宣言 に載っている (${内訳})`).toBe(
        false,
      );
      return;
    }

    if (宣言.has(版)) return;

    const 節 = 節を取る(版);
    expect(節, `${版} は配る中身が変わらないが、変更履歴に [${版}] の節が無い (${内訳})`).toBeDefined();
    expect(
      節!.includes(合図),
      `${版} は配る中身が変わらない。 変更履歴の [${版}] の節に「${合図}」 と理由を書く (${内訳})`,
    ).toBe(true);
  });
});

/**
 * 測る 2 点が、版に tag があるかで切り替わることの検証 (#2303)。
 *
 * 上の検査は「落ちない」 ことを期待する側なので、2 点の取り方が壊れても気付けない。
 * 切り替えそのものを別に見る。
 */
describe("配る中身を測る 2 点は、版に tag があるかで切り替わる (#2303)", () => {
  it("tag を 2 つ以上読めている (空振り検知)", () => {
    // 1 つしか無いと「1 つ前の tag」 が取れず、下の 2 件が両方とも undefined で通る
    expect(全部のtag().length, "版の tag が 2 つ未満").toBeGreaterThan(1);
  });

  it("切り終えた版は、その版の tag までを測る", () => {
    const tags = 全部のtag();
    const 切り終えた = tags[0]!.replace(/^v/, "").replace(/-.*$/, "");
    const 測った範囲 = 測る範囲を決める(切り終えた);
    expect(測った範囲, `${切り終えた} の 2 点が取れない`).toBeDefined();
    expect(測った範囲!.対象, "切り終えた版なのに手元までを測っている").toBe(tags[0]);
    expect(測った範囲!.基準, "1 つ前の tag を基準にしていない").toBe(tags[1]);
  });

  it("まだ切っていない版は、一番新しい tag から手元までを測る", () => {
    const 測った範囲 = 測る範囲を決める("99.99.99");
    expect(測った範囲, "まだ切っていない版の 2 点が取れない").toBeDefined();
    expect(測った範囲!.基準, "一番新しい tag を基準にしていない").toBe(全部のtag()[0]);
    expect(測った範囲!.対象, "手元までを測っていない").toBe("HEAD");
  });

  it("版を切った後に入れた直しが、切り終えた版の中身に混ざらない", () => {
    // 直す前の形 (`1 つ前の tag .. HEAD`) をここで組み立て直し、2 つの測り方が
    // 実際に違う値を出すことを見る。 同じ値しか出ないなら切り替えに意味が無い。
    const tags = 全部のtag();
    const 切り終えた = tags[0]!.replace(/^v/, "").replace(/-.*$/, "");
    const 直した = 配る中身を測る(tags[1]!, tags[0]!);
    const 直す前 = 配る中身を測る(tags[1]!, "HEAD");
    const 後で入れた = git(
      "diff",
      "--name-only",
      `${tags[0]}..HEAD`,
      "--",
      "packages/dragon/src",
      "packages/dragon/schema",
    )
      .split("\n")
      .filter((l) => l !== "");
    if (後で入れた.length === 0) {
      // 版を切った後に配る file を 1 つも変えていない時は、2 つの測り方が同じ値になる。
      // 差が無いことを「切り替えが効いていない」 と読まないよう、ここで分ける
      expect(直した.code, `${切り終えた} の後に配る file の変更が無い`).toBe(直す前.code);
      return;
    }
    expect(
      直す前.code - 直した.code,
      `${切り終えた} の後に入れた ${後で入れた.length} 件 (${後で入れた.join(", ")})` +
        ` が、直す前の測り方では ${切り終えた} の中身に混ざる`,
    ).toBe(後で入れた.length);
  });
});
