// 頁を開く検査がつなぐ Chromium を、vitest とは別の node の process で起こす (#3384)。
// 準備の段 (`site-setup.ts`) がこの file を作業者の数だけ起こし、つなぐ先を受け取る。閉じよと言われるか、準備の段が居なくなったら閉じて終わる
import { chromium } from "playwright";

const server = await chromium.launchServer();
const stop = async () => {
  await server.close();
  process.exit(0);
};
process.on("message", stop);
process.on("disconnect", stop);
process.send?.({ endpoint: server.wsEndpoint() });
