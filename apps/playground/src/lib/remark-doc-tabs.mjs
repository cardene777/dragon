/**
 * Remark plugin ... ::: tabs ブロックを <div class="docs-tabs"> に変換する。
 *
 * 入力 (markdown):
 *
 *   ::: tabs
 *
 *   @@@ humans 👤 For humans
 *
 *   {人向け markdown}
 *
 *   @@@ llm 🤖 For LLM
 *
 *   {LLM 向け markdown}
 *
 *   :::
 *
 * 出力 (HTML):
 *
 *   <div class="docs-tabs" data-default="humans">
 *     <div class="docs-tabs-nav">
 *       <button class="docs-tab-btn active" data-tab="humans">👤 For humans</button>
 *       <button class="docs-tab-btn" data-tab="llm">🤖 For LLM</button>
 *     </div>
 *     <div class="docs-tab-panel active" data-tab="humans">
 *       {人向け markdown を render したもの}
 *     </div>
 *     <div class="docs-tab-panel" data-tab="llm">
 *       {LLM 向け markdown を render したもの}
 *     </div>
 *   </div>
 *
 * tab 切替の JS は DocsLayout.astro 末尾に追加。
 */

const TABS_OPEN_RE = /^:::\s*tabs\s*$/;
const TABS_CLOSE_RE = /^:::\s*$/;
const TAB_HEADER_RE = /^@@@\s+(\S+)\s+(.+)$/;

export default function remarkDocTabs() {
  return (tree) => {
    const newChildren = [];
    let i = 0;
    while (i < tree.children.length) {
      const node = tree.children[i];
      // tabs ブロック開始判定
      if (
        node.type === "paragraph" &&
        node.children?.[0]?.type === "text" &&
        TABS_OPEN_RE.test(node.children[0].value.trim())
      ) {
        // 終了位置を探す
        let j = i + 1;
        while (j < tree.children.length) {
          const n = tree.children[j];
          if (
            n.type === "paragraph" &&
            n.children?.[0]?.type === "text" &&
            TABS_CLOSE_RE.test(n.children[0].value.trim())
          ) {
            break;
          }
          j += 1;
        }
        if (j >= tree.children.length) {
          // 終了がなければそのまま通す
          newChildren.push(node);
          i += 1;
          continue;
        }
        // i+1 .. j-1 の間に @@@ tab headers がある
        const inner = tree.children.slice(i + 1, j);
        const tabs = []; // { id, label, nodes: [] }
        let current = null;
        for (const n of inner) {
          if (
            n.type === "paragraph" &&
            n.children?.[0]?.type === "text" &&
            TAB_HEADER_RE.test(n.children[0].value.trim())
          ) {
            const m = n.children[0].value.trim().match(TAB_HEADER_RE);
            current = { id: m[1], label: m[2], nodes: [] };
            tabs.push(current);
          } else if (current) {
            current.nodes.push(n);
          }
        }
        if (tabs.length === 0) {
          newChildren.push(node);
          i += 1;
          continue;
        }
        // tab UI を html node として組み立てる
        const navHtml = tabs
          .map(
            (t, idx) =>
              `<button type="button" class="docs-tab-btn${idx === 0 ? " active" : ""}" data-tab="${t.id}">${escapeHtml(t.label)}</button>`,
          )
          .join("");
        const openHtml = `<div class="docs-tabs" data-default="${tabs[0].id}"><div class="docs-tabs-nav">${navHtml}</div>`;
        newChildren.push({ type: "html", value: openHtml });
        for (let k = 0; k < tabs.length; k += 1) {
          const t = tabs[k];
          newChildren.push({
            type: "html",
            value: `<div class="docs-tab-panel${k === 0 ? " active" : ""}" data-tab="${t.id}">`,
          });
          for (const n of t.nodes) {
            newChildren.push(n);
          }
          newChildren.push({ type: "html", value: `</div>` });
        }
        newChildren.push({ type: "html", value: `</div>` });
        i = j + 1;
        continue;
      }
      newChildren.push(node);
      i += 1;
    }
    tree.children = newChildren;
  };
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
