/**
 * 版を出す前と出した後の確かめの判定 (#3589)。
 *
 * ikkan の配る前の関門 (`deployable.sh`) と配った後の関門 (`deployed.sh`) は、`.ikkan/checks.md` の欄に書いた命令を回す。
 * 配る先との整合、配る前のセキュリティ、戻す確かめ、配った後の確かめの 4 欄は `scripts/release-checks.mjs` を回す。
 * npm と GitHub に問い合わせる所は命令の外側に置き、ここでは問い合わせた答えから何を落とすかを確かめる。
 */
import { describe, expect, it } from "vitest";

interface ReleaseChecks {
  previousVersion: (tags: string[], version: string) => string | undefined;
  judgeTarget: (input: { version: string; published: string[]; tagged: boolean }) => string[];
  secretFiles: (files: string[]) => string[];
  judgeSecurity: (input: { vulnerabilityExit: number; leakExit: number; packedFiles: string[] }) => string[];
  judgeRollback: (input: { previous: string | undefined; info: { version?: string; tarball?: string; deprecated?: string } | undefined }) => string[];
  judgeAfter: (input: { version: string; latest: string; installedVersion: string; pagesStatus: number }) => string[];
}

const MODULE = "../../../scripts/release-checks.mjs";
/** 判定の道具。file が無い間も、この file を読み込んだ所で落とさず、検査ごとに無いと断って落とす */
const load = async (): Promise<Partial<ReleaseChecks>> => (await import(/* @vite-ignore */ MODULE).catch(() => ({}))) as Partial<ReleaseChecks>;

/** 判定の関数を取り出す。無い時はその名前で落とす */
async function pick<K extends keyof ReleaseChecks>(name: K): Promise<ReleaseChecks[K]> {
  const fn = (await load())[name];
  expect(fn, `scripts/release-checks.mjs が ${name} を書き出さない`).toBeTypeOf("function");
  return fn as ReleaseChecks[K];
}

describe("版を出す前と出した後の確かめ (#3589)", () => {
  it("release-previous-version-is-highest-lower-tag", async () => {
    const previousVersion = await pick("previousVersion");
    const tags = ["v0.9.0", "v0.68.1", "v0.69.0", "v0.68.0", "v0.70.0", "v0.10.0", "release-1", "v1.0.0-rc.1"];
    // 文字の並びでは 0.9.0 が 0.68.1 より後に来る。版の数で比べる
    expect(previousVersion(tags, "0.69.1"), "包む版より小さい印のうち最も大きい版でない").toBe("0.69.0");
    expect(previousVersion(tags, "0.69.0"), "包む版と同じ印を前の版に数えた").toBe("0.68.1");
    expect(previousVersion(tags, "0.10.1"), "0.10.0 と 0.9.0 を文字の並びで比べた").toBe("0.10.0");
    expect(previousVersion(["v0.70.0"], "0.69.0"), "小さい印が無いのに前の版を返した").toBeUndefined();
  });

  it("release-target-refuses-published-version", async () => {
    const judgeTarget = await pick("judgeTarget");
    expect(judgeTarget({ version: "0.70.0", published: ["0.69.0", "0.68.1"], tagged: false }), "どちらにも無い版を落とした").toEqual([]);
    expect(judgeTarget({ version: "0.69.0", published: ["0.69.0", "0.68.1"], tagged: false }).join("\n"), "npm に在る版を通した").toContain("npm");
    expect(judgeTarget({ version: "0.70.0", published: ["0.69.0"], tagged: true }).join("\n"), "GitHub に印が在る版を通した").toContain("v0.70.0");
    // 0.7.0 は 0.70.0 の一部の字だが、別の版
    expect(judgeTarget({ version: "0.7.0", published: ["0.70.0"], tagged: false }), "版の字の一部が重なるだけの版を落とした").toEqual([]);
  });

  it("release-security-refuses-secret-files", async () => {
    const secretFiles = await pick("secretFiles");
    const files = ["package.json", "dist/cli.js", "src/index.ts", ".env", "dist/.env.local", ".npmrc", "blocks/key.pem", "id_rsa", "src/keys.ts", "README.md"];
    expect(secretFiles(files).sort(), "秘密の値を持ちうる file を全て挙げない").toEqual([".env", ".npmrc", "blocks/key.pem", "dist/.env.local", "id_rsa"].sort());
    expect(secretFiles(["package.json", "dist/index.js", "src/environment.ts"]), "普通の file を秘密の値の file に数えた").toEqual([]);
  });

  it("release-security-fails-on-failed-scan", async () => {
    const judgeSecurity = await pick("judgeSecurity");
    const clean = { vulnerabilityExit: 0, leakExit: 0, packedFiles: ["package.json", "dist/cli.js"] };
    expect(judgeSecurity(clean), "全て通った回を落とした").toEqual([]);
    expect(judgeSecurity({ ...clean, vulnerabilityExit: 1 }).join("\n"), "依存の脆弱性が見つかった回を通した").toContain("脆弱性");
    // 走らせられない (2) と、受容記録が古い (3) も通さない
    expect(judgeSecurity({ ...clean, vulnerabilityExit: 2 }), "依存の脆弱性の確かめが走らなかった回を通した").not.toEqual([]);
    expect(judgeSecurity({ ...clean, leakExit: 1 }).join("\n"), "gitleaks が漏れを見つけた回を通した").toContain("gitleaks");
    expect(judgeSecurity({ ...clean, packedFiles: ["package.json", ".npmrc"] }).join("\n"), "包む物に .npmrc が在る回を通した").toContain(".npmrc");
  });

  it("release-rollback-needs-previous-version", async () => {
    const judgeRollback = await pick("judgeRollback");
    const info = { version: "0.68.1", tarball: "https://registry.npmjs.org/@cardenelabs/dragon/-/dragon-0.68.1.tgz" };
    expect(judgeRollback({ previous: "0.68.1", info }), "npm から入れられる前の版を落とした").toEqual([]);
    expect(judgeRollback({ previous: undefined, info: undefined }), "前の版の印が無い回を通した").not.toEqual([]);
    expect(judgeRollback({ previous: "0.68.1", info: undefined }).join("\n"), "npm に無い前の版を通した").toContain("0.68.1");
    expect(judgeRollback({ previous: "0.68.1", info: { ...info, tarball: undefined } }), "入れる file の無い前の版を通した").not.toEqual([]);
    expect(judgeRollback({ previous: "0.68.1", info: { ...info, deprecated: "壊れている" } }).join("\n"), "取り下げた前の版を通した").toContain("取り下げ");
  });

  it("release-after-judges-npm-and-pages", async () => {
    const judgeAfter = await pick("judgeAfter");
    const good = { version: "0.70.0", latest: "0.70.0", installedVersion: "0.70.0", pagesStatus: 200 };
    expect(judgeAfter(good), "全て合った回を落とした").toEqual([]);
    expect(judgeAfter({ ...good, latest: "0.69.0" }).join("\n"), "npm の最新が前の版のままの回を通した").toContain("0.69.0");
    // `dragon --version` の答えは末尾に改行を持つ
    expect(judgeAfter({ ...good, installedVersion: "0.70.0\n" }), "答えの末尾の改行で版が違うと読んだ").toEqual([]);
    expect(judgeAfter({ ...good, installedVersion: "0.69.0" }).join("\n"), "入れた dragon の版が違う回を通した").toContain("--version");
    expect(judgeAfter({ ...good, pagesStatus: 404 }).join("\n"), "GitHub Pages が 404 を返した回を通した").toContain("404");
  });
});
