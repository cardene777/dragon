import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  走査するfile,
  追跡しているfile,
  未追跡のfile,
  説明書のfile,
  注釈を読むfile,
} from "../../../test-support/scan-targets";

/**
 * 走査する検査が集める file の一覧の検証 (#2095)。
 *
 * ## なぜ 1 か所に寄せるか
 *
 * 集め方を各検査が写し取っていた間、7 本が追跡している file だけを引いていた。
 * 追跡される前の file は一覧に入らないので、書いている最中は判定を受けず、取り込んだ回で初めて落ちる。
 * 2026-09-17 に 2 回踏んだ (#2092 / #2089)。 1 か所に寄せれば、直す時も 1 か所で済む。
 *
 * ## 使い捨ての repo で見る
 *
 * この repo 自身を材料にすると、未追跡の file が有るか無いかで結果が変わる。
 * 一時 dir に小さな repo を作り、追跡 / 未追跡 / 無視 の 3 つを自分で用意して見る。
 *
 * ## 直接呼ぶ形が残らないことも見る
 *
 * 1 か所に寄せても、次に書く人が同じ 3 行を写せば元に戻る。
 * 検査 file が git の一覧の command を直接呼んでいないことを走査する。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

/** 集める処理そのもの。 ここだけは git の一覧を直接呼んでよい */
const 集める処理 = "test-support/scan-targets.ts";

/**
 * 説明書から外す md の名前。 繋いで作る (#2092 と同じ形)。
 *
 * 通しの綴りを書くと、この file 自身が「変更履歴を名指ししている」 側に数えられる。
 */
const 変更履歴 = ["CHANGE", "LOG", ".md"].join("");

/**
 * git の一覧を取る command の名前。 繋いで作る (#2092 と同じ形)。
 *
 * 通しの綴りを書くと、この file 自身が「直接呼んでいる」 側に数えられる。
 */
const 一覧command = ["ls", "-", "files"].join("");

let 仮repo = "";

function git(...args: string[]): string {
  return execFileSync("git", ["-C", 仮repo, ...args], { encoding: "utf8" });
}

beforeAll(() => {
  仮repo = mkdtempSync(join(tmpdir(), "scan-targets-"));
  execFileSync("git", ["-C", 仮repo, "init", "-q", "-b", "main"]);
  mkdirSync(join(仮repo, "sub"));
  writeFileSync(join(仮repo, ".gitignore"), "無視.ts\n");
  // 並びの検査のため、追跡している file が未追跡より前に来る名前を 1 つ混ぜる。
  // 名前を繋げただけでは path 順にならないことを見る
  writeFileSync(join(仮repo, "a-tracked.ts"), "export const a = 1;\n");
  writeFileSync(join(仮repo, "追跡.ts"), "export const b = 2;\n");
  writeFileSync(join(仮repo, "sub", "z-untracked.ts"), "export const c = 3;\n");
  writeFileSync(join(仮repo, "無視.ts"), "export const d = 4;\n");
  writeFileSync(join(仮repo, "別の拡張子.md"), "# 見出し\n");
  git("add", "a-tracked.ts", "追跡.ts", ".gitignore");
  git("-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-q", "-m", "初回");
});

afterAll(() => {
  if (仮repo !== "") rmSync(仮repo, { recursive: true, force: true });
});

describe("走査する検査が集める file の一覧 (#2095)", () => {
  it("追跡している file だけを返す形が、未追跡を含まない", () => {
    expect(追跡しているfile(仮repo, "*.ts")).toEqual(["a-tracked.ts", "追跡.ts"]);
  });

  it("未追跡だけを返す形が、追跡している file と無視された file を含まない", () => {
    // 無視設定に載った file を返すと、配布物や手元の作業用 file まで判定の対象になる
    expect(未追跡のfile(仮repo, "*.ts")).toEqual(["sub/z-untracked.ts"]);
  });

  it("走査する形が、追跡と未追跡の両方を path 順で返す", () => {
    // 2 つの一覧を繋げただけだと未追跡が先頭に来る。 path 順に揃えることで、
    // 落ちた時の出力が実行ごとに変わらない
    expect(走査するfile(仮repo, "*.ts")).toEqual(["a-tracked.ts", "sub/z-untracked.ts", "追跡.ts"]);
  });

  it("渡した glob 以外を返さない", () => {
    // glob が効いていなければ、上の一致は file を作った順に依存しているだけになる
    expect(走査するfile(仮repo, "*.md")).toEqual(["別の拡張子.md"]);
    expect(走査するfile(仮repo, "*.ts", "*.md")).toEqual([
      "a-tracked.ts",
      "sub/z-untracked.ts",
      "別の拡張子.md",
      "追跡.ts",
    ]);
  });

  it("説明書の集合が、配る説明書を入れて変更履歴を外す", () => {
    // **集合そのものの形をここで見る** (#2240)。 使う側 2 本に同じ言い切りを置くと、
    // 片方だけ直した日に 2 本の期待が割れる
    const md = 説明書のfile(REPO);
    expect(md.length, "説明書を 1 つも集められていない (空振り)").toBeGreaterThan(20);
    for (const 相対 of ["packages/dragon/README.md", "packages/dragon/examples/quick-start.md"]) {
      // `package.json` の `files` に入る = `npm` で最初に読まれる面 (#2236)
      expect(md, `配る説明書 ${相対} が入っていない`).toContain(join(REPO, 相対));
    }
    expect(md, "紹介文が入っていない").toContain(join(REPO, "README.md"));
    expect(
      md.filter((p) => p.endsWith(変更履歴)),
      "変更履歴が入っている (決めた日の記録を今の数として読むことになる)",
    ).toEqual([]);
    // 無視設定が効いていること。 効いていなければ外から取ってきた md が母数に混ざる
    expect(
      md.filter((p) => p.includes("/node_modules/")),
      "無視設定の dir の md が混ざっている",
    ).toEqual([]);
  });

  it("注釈を読む集合が、入口を並べていた頃に外れていた場所を入れる", () => {
    const src = 注釈を読むfile(REPO);
    expect(src.length, "source を 1 つも集められていない (空振り)").toBeGreaterThan(100);
    for (const 相対 of [集める処理, "vitest.config.ts"]) {
      // 入口を 4 つ並べていた頃はどちらも外にあり、そこに書いた注釈は止まらなかった (#2238)
      expect(src, `${相対} が入っていない`).toContain(join(REPO, 相対));
    }
    // 拡張子を `.ts` と `.tsx` に絞っていた頃、`scripts/` の道具が丸ごと外にあり、
    // 撮影の道具の注釈に古い件数が 3 つ残っていた (#2242)
    expect(src, "撮影の道具が入っていない").toContain(
      join(REPO, "apps/playground-spa/scripts/shoot-zoom.mjs"),
    );
    for (const 拡張子 of [".ts", ".tsx", ".mts", ".mjs"]) {
      expect(
        src.some((p) => p.endsWith(拡張子)),
        `拡張子 ${拡張子} を集めていない`,
      ).toBe(true);
    }
    expect(
      src.filter((p) => p.includes("/node_modules/") || p.includes("/dist/")),
      "無視設定の dir の source が混ざっている",
    ).toEqual([]);
  });

  it("検査 file が git の一覧を直接呼んでいない", () => {
    const 検査 = 走査するfile(REPO, "*.test.ts", "*.test.tsx");
    expect(検査.length, "検査 file を 1 件も集められていない (空振り)").toBeGreaterThan(100);
    const 直接呼ぶ = 検査.filter((p) => readFileSync(join(REPO, p), "utf8").includes(一覧command));
    expect(直接呼ぶ, "集める処理を通さず git の一覧を直接呼んでいる").toEqual([]);
    // 集める処理の側は直接呼ぶ。 呼んでいなければ、上の 0 件は判定が空振りしている
    expect(
      readFileSync(join(REPO, 集める処理), "utf8").includes(一覧command),
      "集める処理が git の一覧を呼んでいない (判定が空振り)",
    ).toBe(true);
  });
});
