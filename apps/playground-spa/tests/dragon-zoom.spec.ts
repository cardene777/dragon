import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const OUT = "test-results/zoom";
mkdirSync(OUT, { recursive: true });

// 全 category (7) の代表 diagram を各 category 1 個 = 7 個 zoom
const TARGETS = [
  { path: "/catalog/presets", article: "presetSwimlane", slug: "presets-swimlane" },
  { path: "/catalog/presets", article: "presetClassDiagram", slug: "presets-class" },
  { path: "/catalog/presets", article: "presetSequence", slug: "presets-sequence" },
  { path: "/catalog/patterns", article: "patternFanOut", slug: "patterns-fan-out" },
  { path: "/catalog/patterns", article: "patternPassthrough", slug: "patterns-passthrough" },
  { path: "/catalog/cookbook", article: "apiCall", slug: "cookbook-api-call" },
  { path: "/catalog/cookbook", article: "jwtAuth", slug: "cookbook-jwt-auth" },
  { path: "/catalog/text-dsl", article: "textDslClass", slug: "text-dsl-class" },
  { path: "/catalog/text-dsl", article: "textDslSequence", slug: "text-dsl-sequence" },
  { path: "/catalog/primitives", article: "kindActor", slug: "primitives-actor" },
  { path: "/catalog/primitives", article: "kindFunction", slug: "primitives-function" },
  { path: "/catalog/animation", article: "tweenSimple", slug: "animation-tween" },
  { path: "/catalog/animation", article: "badgePerPhase", slug: "animation-badge" },
  { path: "/catalog/styles", article: "styleSolid", slug: "styles-solid" },
  { path: "/catalog/styles", article: "toneAccent", slug: "styles-tone-accent" },
  // iter 8 wave 8-J 〜 8-W business scenario 拡張 41 例 (dragon-review 対象)
  // interactive.cdl.ts (22)
  { path: "/catalog/interactive", article: "publishWorkflowSteps", slug: "iter8-publish-workflow" },
  { path: "/catalog/interactive", article: "teamPresenceStatus", slug: "iter8-team-presence" },
  { path: "/catalog/interactive", article: "feedbackThumbRating", slug: "iter8-feedback-rating" },
  { path: "/catalog/interactive", article: "startupOrgChart", slug: "iter8-startup-org" },
  { path: "/catalog/interactive", article: "npsTrendKpi", slug: "iter8-nps-trend" },
  { path: "/catalog/interactive", article: "postReactionPoll", slug: "iter8-post-reaction-poll" },
  { path: "/catalog/interactive", article: "voiceMessagePlayback", slug: "iter8-voice-playback" },
  { path: "/catalog/interactive", article: "teamThreadSummary", slug: "iter8-thread-summary" },
  { path: "/catalog/interactive", article: "dmReadReceipt", slug: "iter8-dm-read-receipt" },
  { path: "/catalog/interactive", article: "formPasswordCheck", slug: "iter8-password-check" },
  { path: "/catalog/interactive", article: "loginOtpVerify", slug: "iter8-otp-verify" },
  { path: "/catalog/interactive", article: "profileAvatarUpload", slug: "iter8-avatar-upload" },
  { path: "/catalog/interactive", article: "prodLogTail", slug: "iter8-prod-log-tail" },
  { path: "/catalog/interactive", article: "opsAlertBanner", slug: "iter8-ops-alert" },
  { path: "/catalog/interactive", article: "serviceHealthGrid", slug: "iter8-service-health" },
  { path: "/catalog/interactive", article: "checkoutCartSummary", slug: "iter8-cart-summary" },
  { path: "/catalog/interactive", article: "saasPricingTier", slug: "iter8-pricing-tier" },
  { path: "/catalog/interactive", article: "checkoutCouponApply", slug: "iter8-coupon-apply" },
  { path: "/catalog/interactive", article: "blogArticlePreview", slug: "iter8-blog-preview" },
  { path: "/catalog/interactive", article: "docsTocNav", slug: "iter8-docs-toc" },
  { path: "/catalog/interactive", article: "socialShareButtons", slug: "iter8-share-buttons" },
  { path: "/catalog/interactive", article: "serverUptimeStatus", slug: "iter8-uptime-status" },
  // patterns.cdl.ts (12)
  { path: "/catalog/patterns", article: "patternDirectCheckout", slug: "iter8-pattern-direct" },
  { path: "/catalog/patterns", article: "patternPassthroughApiGateway", slug: "iter8-pattern-passthrough" },
  { path: "/catalog/patterns", article: "patternCallRwUserProfile", slug: "iter8-pattern-callrw" },
  { path: "/catalog/patterns", article: "patternEmitOrderCreated", slug: "iter8-pattern-emit" },
  { path: "/catalog/patterns", article: "patternHookWebhook", slug: "iter8-pattern-hook" },
  { path: "/catalog/patterns", article: "patternBranchAuthzCheck", slug: "iter8-pattern-branch" },
  { path: "/catalog/patterns", article: "patternLoopBatchImport", slug: "iter8-pattern-loop" },
  { path: "/catalog/patterns", article: "patternFanOutVideoTranscode", slug: "iter8-pattern-fanout" },
  { path: "/catalog/patterns", article: "patternFanInMapReduce", slug: "iter8-pattern-fanin" },
  { path: "/catalog/patterns", article: "patternRollbackBankTransfer", slug: "iter8-pattern-rollback" },
  { path: "/catalog/patterns", article: "patternScheduleReportJob", slug: "iter8-pattern-schedule" },
  { path: "/catalog/patterns", article: "patternValidateProcessOrderSubmit", slug: "iter8-pattern-validate" },
  // animation.cdl.ts (5)
  { path: "/catalog/animation", article: "animationCounterViewCount", slug: "iter8-anim-counter" },
  { path: "/catalog/animation", article: "animationSprintProgress", slug: "iter8-anim-sprint" },
  { path: "/catalog/animation", article: "animationBuildStatus", slug: "iter8-anim-build" },
  { path: "/catalog/animation", article: "animationDeployBadge", slug: "iter8-anim-deploy" },
  { path: "/catalog/animation", article: "animationOrderProgress", slug: "iter8-anim-order" },
  // styles.cdl.ts (2)
  { path: "/catalog/styles", article: "stateActiveConnection", slug: "iter8-state-active" },
  { path: "/catalog/styles", article: "stateInactiveMonitor", slug: "iter8-state-inactive" },
];

for (const t of TARGETS) {
  test(`zoom ${t.slug}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(t.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    // 拡大 button クリックで modal 展開 → modal 内 SVG を screenshot
    const cards = page.locator('article').filter({ hasText: t.article });
    const count = await cards.count();
    if (count === 0) {
      // fallback = card article を直接 screenshot
      await page.screenshot({ path: `${OUT}/${t.slug}-notfound.png`, fullPage: false });
      return;
    }
    await cards.first().locator('button[aria-label*="拡大"]').click();
    await page.waitForTimeout(2000);
    const dialog = page.locator('[role="dialog"]');
    await dialog.screenshot({ path: `${OUT}/${t.slug}.png` });
  });
}
