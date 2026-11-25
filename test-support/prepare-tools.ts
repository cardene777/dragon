/**
 * 準備の file (`<名前>.prepare.ts`) が重い仕事を済ませる道具 (#3734)。
 *
 * 準備の段 (`prepare-setup.ts`) は vitest の件の外で動くので、この file は vitest を読まない。
 * 命令は子の Node の process で起こし (`runCli`)、書き出しは Node の大域のままの thread で回す (`exportIn`)。
 * 子の process は同時に `CLI_AT_ONCE` まで、書き出しの thread は `EXPORT_THREADS` 本までにし、準備の段が機械を取り合いすぎないようにする。
 * 書き出しの thread は thread で 1 つの Chromium を借りる (`shared-chromium.ts`)。準備が全て終わったら `closePrepareTools` で閉じる。
 */
import { execFile } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Worker } from "node:worker_threads";

/** repo の根 */
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/** 見本の置き場 */
export const EXAMPLES = join(ROOT, "packages/dragon/examples");
/** 組み上がった命令 */
const CLI = join(ROOT, "packages/dragon/dist/cli.js");
/** 同時に起こす命令の子の process の数。検査の worker の数 (`maxWorkers`) と同じ */
const CLI_AT_ONCE = 4;
/** 書き出しの thread の数。thread ごとに Chromium を 1 つ持つ */
const EXPORT_THREADS = 2;

/** 一時フォルダ。準備の段は実行の一時フォルダ (`run-tmp.ts`) の下に作り、実行の終わりに消える */
export const scratch = (prefix: string): string => mkdtempSync(join(tmpdir(), prefix));

/** 書き出せる形。SVG は止め絵を書く (#3891) */
export type Format = "mp4" | "gif" | "html" | "png" | "svg";

export interface ExportOptions {
  outDir: string;
  name?: string;
  formats?: Format[];
  width?: number;
  palette?: string;
  theme?: "light" | "dark";
  fps?: number;
  gifFps?: number;
  /** 図の中の字 (全体図の札、読み上げの名前、断りの文) の言葉 (#3001) */
  lang?: "ja" | "en";
  /** PNG に撮る段 (1 から数える、#3484) */
  step?: number;
}

/** 書き出した file と、動画のコマの大きさ (CSS の px) */
export interface Exported {
  files: Partial<Record<Format, string>>;
  view: "fixed" | "follow";
  frames: number;
  width: number;
  height: number;
}

export interface Ran {
  code: number;
  stdout: string;
  stderr: string;
}

/** 命令を走らせる場。`env` は今の環境変数に足し、`nodeArgs` は node に命令より先に渡す (#3003) */
export interface RunPlace {
  env?: Record<string, string>;
  nodeArgs?: string[];
}

/** `playwright-core` が入っていない場。撮る道具が無い時の断りを確かめる (#3003、#3013) */
export const withoutPlaywright = (): RunPlace => ({
  nodeArgs: [
    "--import",
    pathToFileURL(join(ROOT, "packages/dragon/test/fixtures/hide-playwright-core.mjs")).href,
  ],
});

/** 同時に走らせる数を `limit` までに抑える */
function limiter(limit: number): <T>(work: () => Promise<T>) => Promise<T> {
  let running = 0;
  const waiting: (() => void)[] = [];
  return async (work) => {
    if (running >= limit) await new Promise<void>((go) => waiting.push(go));
    running++;
    try {
      return await work();
    } finally {
      running--;
      waiting.shift()?.();
    }
  };
}
const cliSlot = limiter(CLI_AT_ONCE);

/** 書き出しの命令を子の Node の process で走らせる。落ちても投げずに終わり方を返す */
export function runCli(args: string[], place: RunPlace = {}): Promise<Ran> {
  return cliSlot(
    () =>
      new Promise<Ran>((done) => {
        execFile(
          process.execPath,
          [...(place.nodeArgs ?? []), CLI, ...args],
          { encoding: "utf8", env: { ...process.env, ...place.env } },
          (error, stdout, stderr) => {
            const code =
              error === null
                ? 0
                : typeof (error as { code?: unknown }).code === "number"
                  ? (error as { code: number }).code
                  : 1;
            done({ code, stdout, stderr });
          },
        );
      }),
  );
}

/**
 * 書き出しの thread の中身。Chromium を貸す形に差し替えてから、頼まれた原本を書き出して結果を返す (#3560、#3602)。
 * 数を頼まれたら、Chromium を起こした回数と書き出した回数を返す。準備を頼まれたら、書き出しの入口を読んで Chromium を起こしておく。
 * 閉じるよう頼まれたら、借りていた Chromium を閉じる。
 * `shared-chromium.ts` は vitest を通さず、Node が型だけを外して読む
 */
export const EXPORT_THREAD = `
const { parentPort } = require("node:worker_threads");
let written = 0;
const lending = import(${JSON.stringify(pathToFileURL(join(ROOT, "packages/dragon/test/shared-chromium.ts")).href)}).then(async (shared) => {
  await shared.lendThreadChromium();
  return shared;
});
const entry = import(${JSON.stringify(pathToFileURL(join(ROOT, "packages/dragon/dist/export.js")).href)});
parentPort.on("message", async ({ id, diagram, options, stats, warm, close }) => {
  try {
    const shared = await lending;
    if (close) {
      await shared.closeThreadChromium();
      parentPort.postMessage({ id, closed: true });
      return;
    }
    if (warm) {
      await entry;
      await shared.warmThreadChromium();
      parentPort.postMessage({ id, warmed: true });
      return;
    }
    if (stats) {
      parentPort.postMessage({ id, stats: { launches: shared.threadChromiumLaunches(), exports: written } });
      return;
    }
    const { exportDiagram } = await entry;
    written++;
    const result = await exportDiagram(diagram, options);
    parentPort.postMessage({ id, result: { files: result.files, view: result.view, frames: result.frames, width: result.width, height: result.height } });
  } catch (error) {
    parentPort.postMessage({ id, error: String(error?.stack ?? error) });
  }
});
`;

/** thread の中で Chromium を起こした回数と、書き出した回数 */
export interface ThreadStats {
  launches: number;
  exports: number;
}

interface Reply {
  id: number;
  result?: Exported;
  stats?: ThreadStats;
  warmed?: true;
  closed?: true;
  error?: string;
}

export type ThreadAsk =
  { diagram: unknown; options: ExportOptions } | { stats: true } | { warm: true } | { close: true };

/** 書き出しの thread。頼んだ番号の返事を待つので、上限で止まった件の返事を次の件の返事と取り違えない */
export class ExportThread {
  private readonly worker = new Worker(EXPORT_THREAD, { eval: true });
  private asked = 0;
  /**
   * 返事を待つ頼み。番号で引く。
   * 返事の受け手は thread に 1 つだけ置く。頼みごとに受け手を足すと、準備の段が 1 つの thread に 11 以上を頼んだ時に Node が受け手の数の警告を出した
   */
  private readonly waiting = new Map<
    number,
    { resolve: (reply: Reply) => void; reject: (error: Error) => void }
  >();

  constructor() {
    this.worker.on("message", (reply: Reply) => {
      const wait = this.waiting.get(reply.id);
      this.waiting.delete(reply.id);
      wait?.resolve(reply);
    });
    this.worker.on("error", (error: Error) => {
      for (const wait of this.waiting.values()) wait.reject(error);
      this.waiting.clear();
    });
  }

  /** まだ返事の無い頼みの数 */
  get pending(): number {
    return this.waiting.size;
  }

  ask(message: ThreadAsk): Promise<Reply> {
    const id = ++this.asked;
    return new Promise<Reply>((resolve, reject) => {
      this.waiting.set(id, { resolve, reject });
      this.worker.postMessage({ id, ...message });
    });
  }

  /**
   * thread を止める。検査の file の後処理はこちらを使う。
   * 後処理で Chromium を閉じると、混んだ機械で 1 件の上限 (10 秒) を超えた回がある (#3384)
   */
  async terminate(): Promise<void> {
    await this.worker.terminate();
  }

  /** 借りていた Chromium を閉じてから thread を止める。1 件の上限の外にある準備の段が使う */
  async close(): Promise<void> {
    await this.ask({ close: true }).catch(() => undefined);
    await this.terminate();
  }
}

/** 準備の段の書き出しの thread。初めて書き出す時に作る */
const threads: ExportThread[] = [];

/** 原本を書き出しの thread で書き出す。返事の待ちが少ない thread に頼む */
export async function exportIn(diagram: unknown, options: ExportOptions): Promise<Exported> {
  if (threads.length < EXPORT_THREADS && threads.every((thread) => thread.pending > 0))
    threads.push(new ExportThread());
  const thread = threads.reduce((least, next) => (next.pending < least.pending ? next : least));
  const reply = await thread.ask({ diagram, options });
  if (!reply.result) throw new Error(`書き出しの thread で書き出せない ${reply.error ?? ""}`);
  return reply.result;
}

/** 準備の段の書き出しの thread と Chromium を閉じる */
export async function closePrepareTools(): Promise<void> {
  await Promise.all(threads.splice(0).map((thread) => thread.close()));
}
