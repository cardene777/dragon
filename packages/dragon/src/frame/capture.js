/**
 * src の入口を読む検査が、書き出す部品を読むための file (#3798)。
 * 配る入口の`import('./capture.js')` (`capture-load.mjs`) は、入口の隣に在る書き出す部品 (`dist/capture.js`、`dist/cdn/capture.js`) を読む。
 * build はこの読む先を外の物として残すので (`tsup.config.ts`、`tsup.frame.config.ts`)、この file は配る入口に入らない。
 * src の入口を読む検査 (`test/pipe-ahead.test.ts`) の vite は読む先を src の中に探すので、ここで書き出す部品の src を出し直す
 */
export * from '../capture/index';
