/**
 * 種類の検査から移した命令と書き出しの確かめ (#3763)。
 *
 * buildした`dist`を読む検査は、関係する検査を選ぶ命令の表 (`test-support/related-table.json`の`runtime`) が全ての入口へ結ぶので、どの種類を変えても選ばれる。
 * 種類の検査のfileが`dist`を読むと、その種類の検査も全ての種類の変更で選ばれるため、`dist`を読む件をこのfileへ集める。
 * 件は種類ごとの助けのfile (`<種類の検査>-cli-checks.ts`) に、元の名前と確かめのまま置く
 */
import "./arch-label-frames-cli-checks";
import "./chart-diagram-cli-checks";
import "./flow-diagram-cli-checks";
import "./frame-edge-cli-checks";
import "./icon-paint-cli-checks";
import "./interactive-diagram-cli-checks";
import "./layout-check-overlaps-cli-checks";
import "./overlap-notice-cli-checks";
import "./return-lines-cli-checks";
import "./short-notation-cli-checks";
import "./time-axis-inside-cli-checks";
import "./user-blocks-cli-checks";
