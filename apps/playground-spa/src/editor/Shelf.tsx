/**
 * 編集画面の左の棚 (#3031)。前の編集画面の脇の一覧の配置を、今の記法で戻す。
 *
 * 新規作成の釦、見本と部品と記法の 3 つの見出し、絞り込みの入力欄、一覧を持つ。
 * 見本は図の種類ごとに束ね、部品は押すと書く欄に行を足し、記法は行の形の早見を出す。
 * 部品と記法の行は dragon記法で出し、部品が足す名前と早見の穴は頁の言葉で書く (`shelf-items.ts`)。
 * 幅が狭い時は引き出しに畳み、書く欄の上の釦で開く。
 */
import type { Diagram } from "@cardenelabs/dragon/light";
import { type ReactElement, useMemo, useState } from "react";

import { LaterFailed } from "../catalog/LaterFailed";
import { type ExampleKey, LATER_EXAMPLES } from "../examples";
import { useLater } from "../site/later";
import { type Lang, TEXT } from "../text";
import { PART_IDS, type PartId, partLines, sampleGroups, syntaxLines } from "./shelf-items";

type Tab = "samples" | "parts" | "notation";
const TABS: readonly Tab[] = ["samples", "parts", "notation"];

interface Props {
  /** 頁の言葉。見出しと説明と見本と、部品が足す名前と早見の穴はこの言葉で出す */
  lang: Lang;
  /** 部品を足す先の図 */
  base: Diagram | null;
  /** 開いている見本 */
  active: ExampleKey | null;
  /** 幅が狭い時に引き出しを開いているか */
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  onSample: (key: ExampleKey) => void;
  onPart: (id: PartId) => void;
}

export function Shelf({ lang, base, active, open, onClose, onNew, onSample, onPart }: Props): ReactElement {
  const t = TEXT[lang].shelf;
  const [tab, setTab] = useState<Tab>("samples");
  const [query, setQuery] = useState("");

  // 後から読む見本が届いたら束ね直す。届くまでは最初に読む見本だけを並べ、読めなかった時は読み直す釦を出す (#3246)
  const later = useLater(LATER_EXAMPLES);
  const arrived = later.status === "ready";
  const groups = useMemo(() => sampleGroups(lang, arrived), [lang, arrived]);
  const parts = useMemo(
    () =>
      base
        ? PART_IDS.map((id) => {
            const added = partLines(id, base, lang);
            return { id, lines: [...added.declarations, ...added.steps] };
          })
        : [],
    [base, lang],
  );
  const syntax = useMemo(() => syntaxLines(lang), [lang]);

  const q = query.trim().toLowerCase();
  const matches = (...texts: string[]): boolean => q === "" || texts.some((text) => text.toLowerCase().includes(q));

  const shownGroups = groups.map((g) => ({ ...g, samples: g.samples.filter((s) => matches(s.title, s.key)) })).filter((g) => g.samples.length > 0);
  const shownParts = parts.filter((p) => matches(t.parts[p.id], ...p.lines));
  const shownSyntax = syntax.filter((s) => matches(t.syntax[s.id], ...s.lines));
  const empty = { samples: shownGroups.length, parts: shownParts.length, notation: shownSyntax.length }[tab] === 0;

  return (
    <aside
      className="pg-shelf"
      data-playground="shelf"
      data-open={open ? "on" : undefined}
      aria-label={t.label}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) onClose();
      }}
    >
      <button type="button" className="pg-new" data-playground="new-file" onClick={onNew}>
        <span className="pg-new-plus" aria-hidden="true">
          +
        </span>
        {t.newFile}
      </button>

      <div className="pg-shelf-tabs" role="tablist">
        {TABS.map((k) => (
          <button key={k} type="button" role="tab" data-playground={`shelf-tab-${k}`} aria-selected={tab === k} onClick={() => setTab(k)}>
            {t.tabs[k]}
          </button>
        ))}
      </div>

      <input
        className="pg-filter"
        data-playground="shelf-filter"
        type="search"
        placeholder={t.filter}
        aria-label={t.filterLabel}
        spellCheck={false}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="pg-shelf-list" role="tabpanel">
        {tab === "samples" && later.status === "failed" && <LaterFailed lang={lang} />}
        {tab === "samples" &&
          shownGroups.map((g) => (
            <section key={g.kind} className="pg-group">
              <h3 className="pg-group-title">{t.kinds[g.kind]}</h3>
              {g.samples.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className="pg-item"
                  data-playground={`sample-${s.key}`}
                  aria-current={active === s.key ? "true" : undefined}
                  title={s.title}
                  onClick={() => onSample(s.key)}
                >
                  {s.title}
                </button>
              ))}
            </section>
          ))}

        {tab === "parts" && (
          <>
            <p className="pg-shelf-hint">{t.partsHint}</p>
            {shownParts.map((p) => (
              <button key={p.id} type="button" className="pg-entry pg-entry-button" data-playground={`part-${p.id}`} onClick={() => onPart(p.id)}>
                <span className="pg-entry-name">{t.parts[p.id]}</span>
                <code className="pg-entry-code">{p.lines.join("\n")}</code>
              </button>
            ))}
          </>
        )}

        {tab === "notation" && (
          <>
            <p className="pg-shelf-hint">{t.notationHint}</p>
            {shownSyntax.map((s) => (
              <div key={s.id} className="pg-entry" data-playground={`syntax-${s.id}`}>
                <code className="pg-entry-code">{s.lines.join("\n")}</code>
                <span className="pg-entry-note">{t.syntax[s.id]}</span>
              </div>
            ))}
          </>
        )}

        {empty && <p className="pg-shelf-empty">{t.nothing}</p>}
      </div>
    </aside>
  );
}
