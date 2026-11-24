// @vitest-environment jsdom
/**
 * 種類の検査から移した見本帳の確かめ (#3763)。
 *
 * 見本帳のappのfile (`apps/playground-spa/src/`) は軽い入口を読み、軽い入口の後から読む表が全ての種類を指すので、
 * appのfileを読む検査は、関係する検査を選ぶ命令 (`scripts/test-related.mjs`) から見るとどの種類を変えても選ばれる。
 * 種類の検査のfileがappのfileを読むと、その種類の検査も全ての種類の変更で選ばれるため、appのfileを読む件をこのfileへ集める。
 * 件は種類ごとの助けのfile (`<種類の検査>-playground-checks.ts`) に、元の名前と確かめのまま置く
 */
import "./band-look-playground-checks";
import "./cards-diagram-playground-checks";
import "./chart-diagram-playground-checks";
import "./chart-funnel-playground-checks";
import "./chart-line-playground-checks";
import "./clock-look-playground-checks";
import "./cycle-diagram-playground-checks";
import "./dots-look-playground-checks";
import "./editor-url-playground-checks";
import "./er-diagram-playground-checks";
import "./flow-diagram-playground-checks";
import "./icon-paint-playground-checks";
import "./interactive-accept-gather-playground-checks";
import "./interactive-choices-playground-checks";
import "./interactive-diagram-playground-checks";
import "./interactive-gate-playground-checks";
import "./interactive-group-log-playground-checks";
import "./interactive-side-playground-checks";
import "./lineup-board-playground-checks";
import "./lineup-layers-playground-checks";
import "./lineup-stairs-playground-checks";
import "./lineup-stations-playground-checks";
import "./matrix-diagram-playground-checks";
import "./mind-diagram-playground-checks";
import "./pipe-diagram-playground-checks";
import "./sankey-diagram-playground-checks";
import "./sankey-rows-playground-checks";
import "./sankey-treemap-playground-checks";
import "./scatter-look-playground-checks";
import "./venn-diagram-playground-checks";
