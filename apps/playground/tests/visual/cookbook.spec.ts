/**
 * Visual regression ... cookbook 25 demo の subset 10 件。
 *
 * /catalog/cookbook の 4 カテゴリ (DeFi / NFT / DAO / Bridge) 各 2-3 件抜粋し
 * 視覚 regression を担保。 全 25 件は coverage 過剰なので頻出 pattern のみ。
 *
 * baseline 不一致 = SVG path / fill / stroke / text rendering の崩れ。
 */
import { test, expect } from "@playwright/test";

const subset = [
  // A. DeFi
  { slug: "erc20-transfer", label: "ERC-20 transfer" },
  { slug: "permit", label: "EIP-2612 Permit" },
  { slug: "uniswap-v2-swap", label: "UniswapV2 swap" },
  // B. NFT
  { slug: "erc721-transfer", label: "ERC-721 safeTransferFrom" },
  { slug: "lazy-mint", label: "Lazy mint" },
  // C. DAO
  { slug: "governor-propose", label: "Governor propose" },
  { slug: "timelock", label: "Timelock queue/execute" },
  // D. Bridge
  { slug: "layerzero-v2", label: "LayerZero V2 send" },
  { slug: "cctp", label: "CCTP USDC transfer" },
  { slug: "wormhole-vaa", label: "Wormhole VAA bridge" },
];

const PAGE_URL = "/catalog/cookbook";

test.describe("Visual regression - cookbook subset (/catalog/cookbook)", () => {
  for (const { slug, label } of subset) {
    test(`cookbook ${slug} (${label}) SVG snapshot`, async ({ page }) => {
      await page.goto(PAGE_URL, { waitUntil: "networkidle" });
      await page.waitForSelector(`[data-cdl-diagram="${slug}"] svg`, { timeout: 10_000 });
      await page.waitForTimeout(1000);
      const el = page.locator(`[data-cdl-diagram="${slug}"]`).first();
      // cookbook の thumbnail を 1 件 scroll into view してから撮影
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await expect(el).toHaveScreenshot(`cookbook-${slug}.png`, {
        maxDiffPixelRatio: 0.01,
        animations: "disabled",
      });
    });
  }
});
