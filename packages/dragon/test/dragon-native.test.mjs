import { createCheckoutModel } from '../src/checkout/model.mjs';
import { definitionOf as purchaseDefinition } from '../src/checkout/definition.ts';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseNotation,printNotation,renderDiagram,validateDiagram,readDiagram} from '../dist/index.js';
const source=readFileSync(new URL('../examples/checkout/acp-purchase.dragon',import.meta.url),'utf8');
function parse(text=source){const p=parseNotation(text);assert.equal(p.ok,true,JSON.stringify(p.errors));return p.diagram;}

test('通常の解析・JSON保存・再読込・描画で購入図のブロックと線を保持する',()=>{
  const diagram=JSON.parse(JSON.stringify(parse()));
  assert.equal(validateDiagram(diagram).ok,true);
  assert.equal(readDiagram(diagram).ok,true);
  assert.equal(diagram.version,2);
  assert.equal(diagram.blocks['purchase-party'].length,4);
  assert.equal(diagram.blocks['purchase-option'].length,3);
  assert.equal(purchaseDefinition(diagram).blocks.length,18);
  const rendered=renderDiagram(diagram);
  assert.equal(rendered.layout.kind,'checkout');
  assert.equal(rendered.layout.boxes.length,4);
  assert.equal(rendered.layout.edges.length,3);
  assert.equal(rendered.timeline.carriers.length,3);
  assert.match(rendered.svg,/class="dg-eh"/);
  assert.match(rendered.svg,/class="dg-env"/);
  assert.match(rendered.svg,/@keyframes/);
  assert.doesNotMatch(rendered.svg,/animateMotion|wire-route/);
});

test('通常の記法出力で購入図を往復できる',()=>{
  const diagram=parse();
  const reparsed=parse(printNotation(diagram));
  const semantic=d=>purchaseDefinition(d).blocks.map(({line:_line,...b})=>b);
  assert.deepEqual(semantic(reparsed),semantic(diagram));
});

test('角括弧を含む題や商品名を引用して記法へ戻す',()=>{
  const diagram=parse(source.replace('as 条件を変える。購入の判断が変わる。','as "注文[確認]"').replace('as 白いランニングシューズ','as "靴[白]"'));
  const reparsed=parse(printNotation(diagram));
  assert.equal(reparsed.title,'注文[確認]');
  assert.equal(purchaseDefinition(reparsed).blocks.find(b=>b.kind==='product').name,'靴[白]');
});

test('保存した主体ブロックの名前からSVGも組み立てる',()=>{
  const diagram=JSON.parse(JSON.stringify(parse()));
  diagram.blocks['purchase-party'][0].name='購入する人';
  const r=renderDiagram(diagram);
  assert.equal(r.layout.boxes[0].name,'購入する人');
  assert.match(r.svg,/購入する人/);
});

test('定義の単価・送料だけを変えるとモデルの合計が変わる',()=>{
  const diagram=parse(source.replace('price: 18000','price: 9000').replace('fee: 2500','fee: 500'));
  assert.equal(createCheckoutModel(purchaseDefinition(diagram)).initialState().quote.total,9500);
});

test('保存したJSONの壊れた参照・規則・版を拒否する',()=>{
  for(const mutate of [d=>d.blocks['purchase-total'][0].options.product='missing',d=>d.blocks['purchase-total'][0].options.rule='eval(input)',d=>d.checkout.format=2,d=>d.version=3]){
    const diagram=globalThis.structuredClone(parse());mutate(diagram);
    assert.equal(readDiagram(diagram).ok,false);
    assert.throws(()=>renderDiagram(diagram));
  }
});

test('解析後の図を書き換えても購入規則の検査を省略しない',()=>{
  const diagram=parse();
  diagram.blocks['purchase-total'][0].options.product='missing';
  assert.equal(readDiagram(diagram).ok,false);
  assert.throws(()=>renderDiagram(diagram));
});

test('実測したカードの側面を結び、逆向きにも共通の線・封筒を描く',()=>{
  const diagram=JSON.parse(JSON.stringify(parse()));
  diagram.steps=[{title:'条件を返す',body:'販売事業者から最新の条件を返す',events:[{type:'edge',from:'seller',to:'agent',carry:{kind:'envelope'}}]}];
  const r=renderDiagram(diagram,{overlay:true,width:880,anchors:{buyer:{x:0,y:0,w:160,h:84},agent:{x:240,y:0,w:160,h:84},seller:{x:480,y:0,w:160,h:84},processor:{x:720,y:0,w:160,h:84}}});
  assert.deepEqual(r.layout.edges[0].points,[[477,42],[404,42]]);
  assert.equal(r.layout.width,880);
  assert.equal(r.layout.height,84);
  assert.equal(r.timeline.carriers[0].arrive,3);
  assert.doesNotMatch(r.svg,/class="dg-card"/);
});

test('既存の時系列図の解析・描画を保つ',()=>{
  const diagram=parse('sequence\na -> b: hello');
  assert.equal(renderDiagram(diagram).layout.kind,'sequence');
});
