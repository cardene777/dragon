import { useMemo } from "react";
import { useLocation } from "react-router";
import { CdlEditor } from "@/components/CdlEditor";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * CAR-1678 = 起動 URL から初期 tab を決定する helper。
 * 優先順位 (spec § 前提) = URL query param `?format=yaml` > file 拡張子 `.yml` / `.yaml` > default `cdl`。
 * pathname / search を独立 arg で受けて test 可能に、 URL 全体を受けない設計は SSR / node fixture でも呼べる form。
 */
export function resolveInitialTab(pathname: string, search: string): "cdl" | "yaml" {
  const params = new URLSearchParams(search);
  const format = params.get("format")?.toLowerCase() ?? null;
  if (format === "yaml") return "yaml";
  if (format === "cdl") return "cdl";
  const lower = pathname.toLowerCase();
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
  return "cdl";
}

/**
 * dragon Visual Editor page = 旧 apps/playground/src/pages/editor.astro 忠実復元。
 * CdlEditor (CodeMirror split view = sidebar preset + code editor + live preview) を mount。
 * CSS SSOT = src/styles/editor.css (旧 editor.astro <style> tag 501 line 移植)。
 *
 * CAR-1678 = URL query `?format=yaml` or 拡張子 `.yml` を検知して CdlEditor の初期 tab を "yaml" に切替える経路を追加。
 */
export function EditorPage(): React.ReactElement {
  const location = useLocation();
  const initialTab = useMemo(
    () => resolveInitialTab(location.pathname, location.search),
    [location.pathname, location.search],
  );
  return (
    <div>
      <SiteHeader />
      <CdlEditor initialTab={initialTab} />
    </div>
  );
}
