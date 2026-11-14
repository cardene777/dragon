import {paintNotation,paintJson} from '../syntax-highlight';
import {CHECKOUT_BLOCKS} from '../checkout/blocks';

export const SNIPPET_CSS=`.snippet{color:#e0e9df}.snippet [data-syn=kind]{color:#cdb0ff;font-weight:700}.snippet [data-syn=head]{color:#8ed8bb;font-weight:650}.snippet [data-syn=as],.snippet [data-syn=arrow]{color:#a4bfff}.snippet [data-syn=key],.snippet [data-syn=json-key]{color:#9bc7f1}.snippet [data-syn=value],.snippet [data-syn=json-number]{color:#f3ca86}.snippet [data-syn=comment]{color:#91aa94;font-style:italic}.snippet [data-syn=punct],.snippet [data-syn=json-punct]{color:#b0beb2}.snippet [data-syn=json-string]{color:#a9d5ae}.snippet [data-syn=json-literal]{color:#cdb0ff}.snippet [data-syn=code]{color:#f3ca86}`;
/**
 * 色を付ける語。記法の語の一覧 (`NOTATION_WORDS`) は呼ぶ側から受け取る。
 * scriptの1行の入口は帯を後から読む塊に入れ、本体と同じ一覧をこの塊に写さずに渡す (#3699)
 */
export const snippetWords=notation=>({kinds:notation.kinds,heads:[...new Set([...notation.heads,...CHECKOUT_BLOCKS.map(b=>b.name)])]});

/** Use the dragon editor's own tokenizer; never interpret source text as markup. */
export function paintSnippet(pre,source,language,words) {
  const document=pre.ownerDocument;
  const code=document.createElement('code');code.className=`language-${language}`;
  const lines=language==='json'?paintJson(source):paintNotation(source,words);
  lines.forEach((line,i)=>{
    if(i)code.append(document.createTextNode('\n'));
    for(const part of line){const span=document.createElement('span');span.textContent=part.text;if(part.role)span.dataset.syn=part.role;code.append(span);}
  });
  pre.classList.add('snippet');pre.replaceChildren(code);
}
