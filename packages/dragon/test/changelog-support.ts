/**
 * 変更の一覧 (`CHANGELOG.md` と `CHANGELOG.ja.md`) から、課題の項を持つ節を読む検査の道具 (#3362)。
 *
 * 課題の項は取り込んだ時に `Unreleased` の節に入り、版を切る課題が日付付きの版の節へ移す。
 * 項を `Unreleased` の節だけで探すと、版を切った時に項が在っても落ちる。
 * ここでは `Unreleased` か版のどの節に移っても、その項を持つ節を返す。
 */
import { readFileSync } from "node:fs";

/** 変更の一覧 `path` の、項 `(#<issue>)` を持つ節 (`Unreleased` か版の節) の本文。見出しより前の前置きは数えず、無ければ空 */
export function changelogEntry(path: string, issue: number): string {
  return (
    readFileSync(path, "utf8")
      .split(/^## \[/mu)
      .slice(1)
      .find((part) => part.includes(`(#${issue})`)) ?? ""
  );
}
