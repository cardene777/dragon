/** `src-fingerprint.mjs` の型 (#3748)。build の設定 (`tsup.config.ts`) と検査 (`test/pipe-stored-layout.test.ts`) が読む */

/** `dir` の下の全ての file の path と中身から作る SHA-256 の 16 進 64 字 */
export declare function srcFingerprint(dir: string): string;
