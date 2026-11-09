/**
 * 1 回の実行の一時フォルダ (#3587)。準備の段 (`globalSetup`) で作って `TMPDIR` をそこへ向け、終わりに丸ごと消す。
 *
 * 検査と、検査が起こす子の process と Chromium の一時 file は全てこの下に入る。
 * 検査の file ごとに消す形にしないのは、新しい検査が消し忘れると溜まり、時間切れで止まった検査の分も残るため。2 日で 7GB 溜まった。
 *
 * 1 回の実行の上限で止める時は `process.exit` で終わり、準備の段の片付けが呼ばれないので、process の `exit` でも消す (`run-limit.ts`)。
 * それでも消せなかった分 (process を外から止めた時など) は、次の実行が消す。
 * 名前に持ち主の process の番号を持たせ、動いていない実行の分だけを消す。別の作業場所で同時に走っている実行の分を消さないため。
 * 動いているか判らない時と、名前から持ち主を読めない時は消さない。
 */
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RUN_DIR = /^dragon-run-(\d+)-/u;

/** 消す。消せない時は実行を止めず、理由を残す。残った分は次の実行が消す */
function remove(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true, maxRetries: 2 });
  } catch (error) {
    console.error(`一時フォルダを消せなかった (次の実行が消す): ${dir}: ${String(error)}`);
  }
}

/** その process が動いていないと判った時だけ true。権限が無く確かめられない時は false */
function isGone(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ESRCH";
  }
}

/** `base` の直下で、持ち主の process が終わった実行の一時フォルダを消す */
export function sweepDeadRuns(base: string): void {
  for (const name of readdirSync(base)) {
    const pid = RUN_DIR.exec(name)?.[1];
    if (pid !== undefined && isGone(Number(pid))) remove(join(base, name));
  }
}

export default function setup(): () => void {
  const base = tmpdir();
  const before = process.env.TMPDIR;
  sweepDeadRuns(base);
  const dir = mkdtempSync(join(base, `dragon-run-${process.pid}-`));
  process.env.TMPDIR = dir;
  const clean = (): void => remove(dir);
  process.once("exit", clean);
  return () => {
    process.off("exit", clean);
    clean();
    if (before === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = before;
  };
}
