/**
 * 頁を開く検査の file と同じく、準備の段 (`apps/playground-spa/src/lib/chromium-preload.ts`) に Chromium を起こさせる見本 (#3388)。
 * 準備の段は file の字で頁を開く file かを決めるので、この見本は `useSite()` の字を持つ。
 * 起こした Chromium の process の番号と作業用の folder を `FIXTURE_OUT` に書き、閉じずに終わる。
 * 検査の側は、この見本の process が終わった後に、どちらも残っていないことを確かめる。
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import type { Browser } from "playwright";
import { it } from "vitest";

it("fixture-uses-preloaded-chromium", async () => {
  const launching = (globalThis as Record<symbol, unknown>)[Symbol.for("dragon.chromium")] as Promise<Browser> | undefined;
  if (launching === undefined) throw new Error("準備の段が Chromium を起こしていない");
  const browser = await launching;
  const session = await browser.newBrowserCDPSession();
  const { processInfo } = (await session.send("SystemInfo.getProcessInfo")) as { processInfo: { type: string; id: number }[] };
  const pid = processInfo.find((info) => info.type === "browser")?.id;
  if (pid === undefined) throw new Error("Chromium の process の番号を読めない");
  const command = execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf8" });
  const profile = /--user-data-dir=(\S+)/u.exec(command)?.[1] ?? "";
  writeFileSync(process.env.FIXTURE_OUT ?? "", JSON.stringify({ pid, profile }));
});
