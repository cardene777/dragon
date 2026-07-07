import { CdlEditor } from "@/components/CdlEditor";
import { SiteHeader } from "@/components/SiteHeader";

/**
 * dragon Visual Editor page = 旧 apps/playground/src/pages/editor.astro 忠実復元。
 * CdlEditor (CodeMirror split view = sidebar preset + code editor + live preview) を mount。
 * CSS SSOT = src/styles/editor.css (旧 editor.astro <style> tag 501 line 移植)。
 */
export function EditorPage(): React.ReactElement {
  return (
    <div>
      <SiteHeader />
      <CdlEditor />
    </div>
  );
}
