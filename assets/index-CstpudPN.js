(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const p of document.querySelectorAll('link[rel="modulepreload"]'))d(p);new MutationObserver(p=>{for(const a of p)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&d(r)}).observe(document,{childList:!0,subtree:!0});function c(p){const a={};return p.integrity&&(a.integrity=p.integrity),p.referrerPolicy&&(a.referrerPolicy=p.referrerPolicy),p.crossOrigin==="use-credentials"?a.credentials="include":p.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function d(p){if(p.ep)return;p.ep=!0;const a=c(p);fetch(p.href,a)}})();var pd={exports:{}},$i={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var n0;function mv(){if(n0)return $i;n0=1;var t=Symbol.for("react.transitional.element"),s=Symbol.for("react.fragment");function c(d,p,a){var r=null;if(a!==void 0&&(r=""+a),p.key!==void 0&&(r=""+p.key),"key"in p){a={};for(var l in p)l!=="key"&&(a[l]=p[l])}else a=p;return p=a.ref,{$$typeof:t,type:d,key:r,ref:p!==void 0?p:null,props:a}}return $i.Fragment=s,$i.jsx=c,$i.jsxs=c,$i}var a0;function gv(){return a0||(a0=1,pd.exports=mv()),pd.exports}var x=gv(),yv={string:"文字列にする",integer:"整数にする",number:"数にする",object:"オブジェクトにする",array:"配列にする",boolean:"true か false にする",null:"null にする"},bv={string:"Use a string",integer:"Use an integer",number:"Use a number",object:"Use an object",array:"Use an array",boolean:"Use true or false",null:"Use null"},rl=(t,s)=>`${t} ${s}${t===1?"":"s"}`,vv={additionalProperties:t=>`${t} という欄は書けない`,required:t=>`${t} の欄が要る`,enum:t=>`${t.join(" / ")} のどれかにする`,type:t=>yv[t]??`${t} にする`,minLength:t=>`${t} 字以上書く`,maxLength:t=>`${t} 字までにする`,pattern:t=>t?`${t.space?"空白と ":""}${t.chars.join(" ")} は使えない`:"使えない字が入っている",minItems:t=>`${t} つ以上書く`,maxItems:t=>`${t} つまでにする`,minimum:t=>`${t} 以上にする`,const:t=>`${t} にする`,not:t=>t?`${t.field} の欄は kind が ${t.kind} の時だけ書ける`:"この欄の組み合わせは書けない",reserved:t=>`${t.join(" と ")} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,kindOnly:(t,s)=>`${t.join(" と ")} の出来事は kind が ${s} の時だけ書ける`,hex:(t,s)=>`0 から 9 と a から f の字で ${t} から ${s} 字にする`,duration:t=>`数と単位 (${t.join(" / ")}) の組で書く (12s など)`,ratio:"分数 (2/3) か百分率 (97%) で書く",url:"/ で始まる path か、http:// か https:// で始まる URL にする",anyOf:t=>t.length>0?`${t.join(" か ")} の${t.length===2?"どちらか":"どれか"}の欄が要る`:"書ける形のどれにも合わない",oneOf:"書ける形のどれか 1 つだけに合わせる",discriminator:(t,s)=>`${t} は ${s.join(" / ")} のどれかにする`,newer:(t,s)=>`版 ${t} の図は、この道具 (版 ${s}) より新しいので読めない。道具を新しくする`},xv={additionalProperties:t=>`The ${t} field is not allowed`,required:t=>`The ${t} field is required`,enum:t=>`Use one of ${t.join(" / ")}`,type:t=>bv[t]??`Use ${t}`,minLength:t=>`Write at least ${rl(t,"character")}`,maxLength:t=>`Write at most ${rl(t,"character")}`,pattern:t=>t?`Cannot contain ${t.space?"spaces or ":""}${t.chars.join(" ")}`:"Contains characters that are not allowed",minItems:t=>`Write at least ${rl(t,"item")}`,maxItems:t=>`Write at most ${rl(t,"item")}`,minimum:t=>`Use ${t} or greater`,const:t=>`Use ${t}`,not:t=>t?`The ${t.field} field is allowed only when kind is ${t.kind}`:"This combination of fields is not allowed",reserved:t=>`${t.join(" and ")} name the start and end marks of a state diagram and cannot be box ids`,kindOnly:(t,s)=>`${t.join(" and ")} events are allowed only when kind is ${s}`,hex:(t,s)=>`Use ${t} to ${s} characters of 0-9 and a-f`,duration:t=>`Write a number and a unit (${t.join(" / ")}), such as 12s`,ratio:"Write a fraction (2/3) or a percentage (97%)",url:"Use a path that starts with / or a URL that starts with http:// or https://",anyOf:t=>t.length>0?`Write one of the ${t.join(" or ")} fields`:"Does not match any of the allowed shapes",oneOf:"Match exactly one of the allowed shapes",discriminator:(t,s)=>`${t} is one of ${s.join(" / ")}`,newer:(t,s)=>`Version ${t} diagrams are newer than this tool (version ${s}) and cannot be read. Update the tool`},K0={ja:vv,en:xv};function wv(t){let s=0;for(const c of t)s++;return s}var s0=I0,hd={properties:{version:{description:"形式の版",type:"integer",minimum:1},kind:{description:"図の種類",enum:["sequence","architecture","state","git","time","tree","lineup"]},title:{$ref:"#/definitions/text"},view:{description:"見せ方。書かなければ字の大きさで選ぶ。fixed は全体を止めて中だけ動かし、follow は寄って動かし全体図で今どこかを示す",enum:["fixed","follow"]},regions:{type:"array",items:{$ref:"#/definitions/region"}},boxes:{type:"array",items:{$ref:"#/definitions/box"}},strip:{$ref:"#/definitions/strip"},steps:{type:"array",minItems:1,items:{$ref:"#/definitions/step"}},sequence:{$ref:"#/definitions/sequence"},state:{$ref:"#/definitions/state"},git:{$ref:"#/definitions/git"},time:{$ref:"#/definitions/time"},lineup:{$ref:"#/definitions/lineup"}}};function ua(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(Array.isArray(t)){const b=t.length;for(let w=0;w<b;w++){let v=t[w];if(v&&typeof v=="object"&&!Array.isArray(v)&&v.events!==void 0){let A=v.events;if(Array.isArray(A)){const N=A.length;for(let S=0;S<N;S++){let M=A[S];const D=r,z=r;if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type===void 0){const _={};a===null?a=[_]:a.push(_),r++}else if(M.type!==void 0){let _=M.type;if(!(_==="now"||_==="mark"||_==="span")){const P={};a===null?a=[P]:a.push(P),r++}}}var l=z===r;if(l){const _={instancePath:s+"/"+w+"/events/"+S,schemaPath:"#/items/properties/events/items/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}else r=D,a!==null&&(D?a.length=D:a=null);const H=r,Z=r;if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type===void 0){const _={};a===null?a=[_]:a.push(_),r++}else if(M.type!==void 0){let _=M.type;if(!(_==="leaf"||_==="node")){const P={};a===null?a=[P]:a.push(P),r++}}}var f=Z===r;if(f){const _={instancePath:s+"/"+w+"/events/"+S,schemaPath:"#/items/properties/events/items/allOf/0/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}else r=H,a!==null&&(H?a.length=H:a=null);const j=r,R=r;if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type===void 0){const _={};a===null?a=[_]:a.push(_),r++}else if(M.type!==void 0){let _=M.type;if(!(_==="line"||_==="seal"||_==="open"||_==="pick"||_==="stamp")){const P={};a===null?a=[P]:a.push(P),r++}}}var u=R===r;if(u){const _={instancePath:s+"/"+w+"/events/"+S,schemaPath:"#/definitions/notLineupEvent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}else r=j,a!==null&&(j?a.length=j:a=null);if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type!==void 0){let _=M.type;const P=r,B=r;if(!(_==="commit"||_==="branch")){const ne={};a===null?a=[ne]:a.push(ne),r++}var g=B===r;if(g){const ne={instancePath:s+"/"+w+"/events/"+S+"/type",schemaPath:"#/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[ne]:a.push(ne),r++}else r=P,a!==null&&(P?a.length=P:a=null)}if(M.at!==void 0){const _={instancePath:s+"/"+w+"/events/"+S+"/at",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}if(M.into!==void 0){const _={instancePath:s+"/"+w+"/events/"+S+"/into",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}if(M.color!==void 0){const _={instancePath:s+"/"+w+"/events/"+S+"/color",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}}}}}}}return ua.errors=a,r===0}function rn(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)&&t.meters!==void 0){const l={instancePath:s+"/meters",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[l]:a.push(l),r++}return rn.errors=a,r===0}function pl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(Array.isArray(t)){const g=t.length;for(let b=0;b<g;b++){let w=t[b];if(w&&typeof w=="object"&&!Array.isArray(w)&&w.events!==void 0){let v=w.events;if(Array.isArray(v)){const A=v.length;for(let N=0;N<A;N++){let S=v[N];const M=r,D=r;if(S&&typeof S=="object"&&!Array.isArray(S)){if(S.type===void 0){const R={};a===null?a=[R]:a.push(R),r++}else if(S.type!==void 0){let R=S.type;if(!(R==="now"||R==="mark"||R==="span")){const _={};a===null?a=[_]:a.push(_),r++}}}var l=D===r;if(l){const R={instancePath:s+"/"+b+"/events/"+N,schemaPath:"#/items/properties/events/items/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[R]:a.push(R),r++}else r=M,a!==null&&(M?a.length=M:a=null);const z=r,H=r;if(S&&typeof S=="object"&&!Array.isArray(S)){if(S.type===void 0){const R={};a===null?a=[R]:a.push(R),r++}else if(S.type!==void 0){let R=S.type;if(!(R==="leaf"||R==="node")){const _={};a===null?a=[_]:a.push(_),r++}}}var f=H===r;if(f){const R={instancePath:s+"/"+b+"/events/"+N,schemaPath:"#/items/properties/events/items/allOf/0/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[R]:a.push(R),r++}else r=z,a!==null&&(z?a.length=z:a=null);const Z=r,j=r;if(S&&typeof S=="object"&&!Array.isArray(S)){if(S.type===void 0){const R={};a===null?a=[R]:a.push(R),r++}else if(S.type!==void 0){let R=S.type;if(!(R==="line"||R==="seal"||R==="open"||R==="pick"||R==="stamp")){const _={};a===null?a=[_]:a.push(_),r++}}}var u=j===r;if(u){const R={instancePath:s+"/"+b+"/events/"+N,schemaPath:"#/definitions/notLineupEvent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[R]:a.push(R),r++}else r=Z,a!==null&&(Z?a.length=Z:a=null);if(S&&typeof S=="object"&&!Array.isArray(S)){if(S.at!==void 0){const R={instancePath:s+"/"+b+"/events/"+N+"/at",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[R]:a.push(R),r++}if(S.into!==void 0){const R={instancePath:s+"/"+b+"/events/"+N+"/into",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[R]:a.push(R),r++}if(S.color!==void 0){const R={instancePath:s+"/"+b+"/events/"+N+"/color",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[R]:a.push(R),r++}}}}}}}return pl.errors=a,r===0}function hl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(Array.isArray(t)){const g=t.length;for(let b=0;b<g;b++){let w=t[b];if(w&&typeof w=="object"&&!Array.isArray(w)&&w.events!==void 0){let v=w.events;if(Array.isArray(v)){const A=v.length;for(let N=0;N<A;N++){let S=v[N];const M=r,D=r;if(S&&typeof S=="object"&&!Array.isArray(S)){if(S.type===void 0){const Z={};a===null?a=[Z]:a.push(Z),r++}else if(S.type!==void 0){let Z=S.type;if(!(Z==="leaf"||Z==="node")){const j={};a===null?a=[j]:a.push(j),r++}}}var l=D===r;if(l){const Z={instancePath:s+"/"+b+"/events/"+N,schemaPath:"#/items/properties/events/items/allOf/0/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Z]:a.push(Z),r++}else r=M,a!==null&&(M?a.length=M:a=null);const z=r,H=r;if(S&&typeof S=="object"&&!Array.isArray(S)){if(S.type===void 0){const Z={};a===null?a=[Z]:a.push(Z),r++}else if(S.type!==void 0){let Z=S.type;if(!(Z==="line"||Z==="seal"||Z==="open"||Z==="pick"||Z==="stamp")){const j={};a===null?a=[j]:a.push(j),r++}}}var f=H===r;if(f){const Z={instancePath:s+"/"+b+"/events/"+N,schemaPath:"#/definitions/notLineupEvent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Z]:a.push(Z),r++}else r=z,a!==null&&(z?a.length=z:a=null);if(S&&typeof S=="object"&&!Array.isArray(S)&&S.type!==void 0){let Z=S.type;const j=r,R=r;if(!(Z==="commit"||Z==="branch")){const _={};a===null?a=[_]:a.push(_),r++}var u=R===r;if(u){const _={instancePath:s+"/"+b+"/events/"+N+"/type",schemaPath:"#/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}else r=j,a!==null&&(j?a.length=j:a=null)}}}}}}return hl.errors=a,r===0}function fl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(Array.isArray(t)){const g=t.length;for(let b=0;b<g;b++){let w=t[b];if(w&&typeof w=="object"&&!Array.isArray(w)&&w.events!==void 0){let v=w.events;if(Array.isArray(v)){const A=v.length;for(let N=0;N<A;N++){let S=v[N];const M=r,D=r;if(S&&typeof S=="object"&&!Array.isArray(S)){if(S.type===void 0){const Z={};a===null?a=[Z]:a.push(Z),r++}else if(S.type!==void 0){let Z=S.type;if(!(Z==="now"||Z==="mark"||Z==="span")){const j={};a===null?a=[j]:a.push(j),r++}}}var l=D===r;if(l){const Z={instancePath:s+"/"+b+"/events/"+N,schemaPath:"#/items/properties/events/items/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Z]:a.push(Z),r++}else r=M,a!==null&&(M?a.length=M:a=null);const z=r,H=r;if(S&&typeof S=="object"&&!Array.isArray(S)){if(S.type===void 0){const Z={};a===null?a=[Z]:a.push(Z),r++}else if(S.type!==void 0){let Z=S.type;if(!(Z==="line"||Z==="seal"||Z==="open"||Z==="pick"||Z==="stamp")){const j={};a===null?a=[j]:a.push(j),r++}}}var f=H===r;if(f){const Z={instancePath:s+"/"+b+"/events/"+N,schemaPath:"#/definitions/notLineupEvent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Z]:a.push(Z),r++}else r=z,a!==null&&(z?a.length=z:a=null);if(S&&typeof S=="object"&&!Array.isArray(S)){if(S.type!==void 0){let Z=S.type;const j=r,R=r;if(!(Z==="commit"||Z==="branch")){const _={};a===null?a=[_]:a.push(_),r++}var u=R===r;if(u){const _={instancePath:s+"/"+b+"/events/"+N+"/type",schemaPath:"#/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}else r=j,a!==null&&(j?a.length=j:a=null)}if(S.at!==void 0){const Z={instancePath:s+"/"+b+"/events/"+N+"/at",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Z]:a.push(Z),r++}if(S.into!==void 0){const Z={instancePath:s+"/"+b+"/events/"+N+"/into",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Z]:a.push(Z),r++}if(S.color!==void 0){const Z={instancePath:s+"/"+b+"/events/"+N+"/color",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Z]:a.push(Z),r++}}}}}}}return fl.errors=a,r===0}function ml(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(Array.isArray(t)){const b=t.length;for(let w=0;w<b;w++){let v=t[w];if(v&&typeof v=="object"&&!Array.isArray(v)&&v.events!==void 0){let A=v.events;if(Array.isArray(A)){const N=A.length;for(let S=0;S<N;S++){let M=A[S];const D=r,z=r;if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type===void 0){const _={};a===null?a=[_]:a.push(_),r++}else if(M.type!==void 0){let _=M.type;if(!(_==="now"||_==="mark"||_==="span")){const P={};a===null?a=[P]:a.push(P),r++}}}var l=z===r;if(l){const _={instancePath:s+"/"+w+"/events/"+S,schemaPath:"#/items/properties/events/items/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}else r=D,a!==null&&(D?a.length=D:a=null);const H=r,Z=r;if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type===void 0){const _={};a===null?a=[_]:a.push(_),r++}else if(M.type!==void 0){let _=M.type;if(!(_==="leaf"||_==="node")){const P={};a===null?a=[P]:a.push(P),r++}}}var f=Z===r;if(f){const _={instancePath:s+"/"+w+"/events/"+S,schemaPath:"#/items/properties/events/items/allOf/0/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}else r=H,a!==null&&(H?a.length=H:a=null);const j=r,R=r;if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type===void 0){const _={};a===null?a=[_]:a.push(_),r++}else if(M.type!==void 0){let _=M.type;if(!(_==="edge"||_==="action")){const P={};a===null?a=[P]:a.push(P),r++}}}var u=R===r;if(u){const _={instancePath:s+"/"+w+"/events/"+S,schemaPath:"#/definitions/notWiredEvent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}else r=j,a!==null&&(j?a.length=j:a=null);if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type!==void 0){let _=M.type;const P=r,B=r;if(!(_==="commit"||_==="branch")){const ne={};a===null?a=[ne]:a.push(ne),r++}var g=B===r;if(g){const ne={instancePath:s+"/"+w+"/events/"+S+"/type",schemaPath:"#/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[ne]:a.push(ne),r++}else r=P,a!==null&&(P?a.length=P:a=null)}if(M.color!==void 0){const _={instancePath:s+"/"+w+"/events/"+S+"/color",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}}}}}}}return ml.errors=a,r===0}var zs={enum:["blue","amber","green","violet","rose","slate","coin"]},kt=new RegExp("^[^\\s\\[\\]「」=:]+$","u"),xt=wv;function gl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.id===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}if(t.name===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="id"||l==="name"||l==="note"||l==="color"||l==="icon")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.id!==void 0){let l=t.id;if(typeof l=="string"){if(!kt.test(l)){const f={instancePath:s+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.name!==void 0){let l=t.name;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.note!==void 0){let l=t.note;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.color!==void 0){let l=t.color;if(!(l==="blue"||l==="amber"||l==="green"||l==="violet"||l==="rose"||l==="slate"||l==="coin")){const f={instancePath:s+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:zs.enum},message:"must be equal to one of the allowed values"};a===null?a=[f]:a.push(f),r++}}if(t.icon!==void 0){let l=t.icon;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/icon",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/icon",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return gl.errors=a,r===0}var W0=new RegExp("^(/|https?://)","u");function yl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.id===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}if(t.name===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="id"||l==="name"||l==="sub"||l==="color"||l==="icon"||l==="region"||l==="link")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.id!==void 0){let l=t.id;if(typeof l=="string"){if(!kt.test(l)){const f={instancePath:s+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.name!==void 0){let l=t.name;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.sub!==void 0){let l=t.sub;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/sub",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/sub",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.color!==void 0){let l=t.color;if(!(l==="blue"||l==="amber"||l==="green"||l==="violet"||l==="rose"||l==="slate"||l==="coin")){const f={instancePath:s+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:zs.enum},message:"must be equal to one of the allowed values"};a===null?a=[f]:a.push(f),r++}}if(t.icon!==void 0){let l=t.icon;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/icon",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/icon",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.region!==void 0){let l=t.region;if(typeof l=="string"){if(!kt.test(l)){const f={instancePath:s+"/region",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/region",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.link!==void 0){let l=t.link;if(typeof l=="string"){if(!W0.test(l)){const f={instancePath:s+"/link",schemaPath:"#/definitions/url/pattern",keyword:"pattern",params:{pattern:"^(/|https?://)"},message:'must match pattern "^(/|https?://)"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/link",schemaPath:"#/definitions/url/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return yl.errors=a,r===0}var kv=new RegExp("^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$","u");function bl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.field===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"field"},message:"must have required property 'field'"};a===null?a=[l]:a.push(l),r++}if(t.line===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"line"},message:"must have required property 'line'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="field"||l==="line")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.field!==void 0){let l=t.field;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/field",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/field",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.line!==void 0){let l=t.line;if(typeof l=="string"){if(!kv.test(l)){const f={instancePath:s+"/line",schemaPath:"#/definitions/ratio/pattern",keyword:"pattern",params:{pattern:"^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$"},message:'must match pattern "^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/line",schemaPath:"#/definitions/ratio/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return bl.errors=a,r===0}function vl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.title===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};a===null?a=[l]:a.push(l),r++}if(t.fields===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"fields"},message:"must have required property 'fields'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="title"||l==="fields"||l==="meters")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.title!==void 0){let l=t.title;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.fields!==void 0){let l=t.fields;if(Array.isArray(l)){if(l.length<1){const u={instancePath:s+"/fields",schemaPath:"#/properties/fields/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[u]:a.push(u),r++}const f=l.length;for(let u=0;u<f;u++){let g=l[u];if(typeof g=="string"){if(xt(g)<1){const b={instancePath:s+"/fields/"+u,schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[b]:a.push(b),r++}}else{const b={instancePath:s+"/fields/"+u,schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[b]:a.push(b),r++}}}else{const f={instancePath:s+"/fields",schemaPath:"#/properties/fields/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}if(t.meters!==void 0){let l=t.meters;if(Array.isArray(l)){if(l.length<1){const u={instancePath:s+"/meters",schemaPath:"#/properties/meters/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[u]:a.push(u),r++}const f=l.length;for(let u=0;u<f;u++)bl(l[u],{instancePath:s+"/meters/"+u,parentData:l,parentDataProperty:u,rootData:p})||(a=a===null?bl.errors:a.concat(bl.errors),r=a.length)}else{const f={instancePath:s+"/meters",schemaPath:"#/properties/meters/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return vl.errors=a,r===0}function xl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.name===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};a===null?a=[l]:a.push(l),r++}if(t.url===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"url"},message:"must have required property 'url'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="name"||l==="url")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.name!==void 0){let l=t.name;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.url!==void 0){let l=t.url;if(typeof l=="string"){if(!W0.test(l)){const f={instancePath:s+"/url",schemaPath:"#/definitions/url/pattern",keyword:"pattern",params:{pattern:"^(/|https?://)"},message:'must match pattern "^(/|https?://)"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/url",schemaPath:"#/definitions/url/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return xl.errors=a,r===0}var o0={oneOf:[{description:"線。運ぶ物を載せて送る側から受ける側へ走る",type:"object",additionalProperties:!1,required:["type","from","to","carry"],properties:{type:{const:"edge"},from:{$ref:"#/definitions/id"},to:{$ref:"#/definitions/id"},label:{$ref:"#/definitions/text"},carry:{$ref:"#/definitions/carry"},labelSide:{description:"線の名前を置く側 (寄せの指示)",enum:["above","below","left","right"]},at:{description:"時間軸の図の拡大の帯で、線を引く列の目盛り",$ref:"#/definitions/unit"},into:{description:"時間軸の図の拡大の帯で、受ける箱を選ぶ列の目盛り。書かなければ at の列",$ref:"#/definitions/unit"}}},{description:"箱の中の処理",type:"object",additionalProperties:!1,required:["type","box","label"],properties:{type:{const:"action"},box:{$ref:"#/definitions/id"},label:{$ref:"#/definitions/text"}}},{description:"箱の下の小さな字の書き換え",type:"object",additionalProperties:!1,required:["type","box","text"],properties:{type:{const:"swap"},box:{$ref:"#/definitions/id"},text:{$ref:"#/definitions/text"},color:{description:"時間軸の図の節目の丸の色",$ref:"#/definitions/color"}}},{description:"commit を積む。枝分かれの図だけが書ける。積んだ枝の札と、その枝を指す HEAD が進む。当て直し (copy) は枝の札を動かさず、merge commit (merge) は取り込む枝の先端も親に持つ",type:"object",additionalProperties:!1,required:["type","id","branch"],properties:{type:{const:"commit"},id:{$ref:"#/definitions/id"},branch:{$ref:"#/definitions/id"},copy:{$ref:"#/definitions/id"},merge:{$ref:"#/definitions/id"},hash:{$ref:"#/definitions/hash"},note:{$ref:"#/definitions/text"}}},{description:"枝を切る。枝分かれの図だけが書ける。枝の札を from の commit へ置き、HEAD をその枝へ移す",type:"object",additionalProperties:!1,required:["type","branch","from"],properties:{type:{const:"branch"},branch:{$ref:"#/definitions/id"},from:{$ref:"#/definitions/id"}}},{description:"時間軸の図の今の時刻の針を、to の目盛りの終わりまで進める",type:"object",additionalProperties:!1,required:["type","to"],properties:{type:{const:"now"},to:{$ref:"#/definitions/unit"}}},{description:"時間軸の図の印の列 row の、from から to の目盛りの印の色を変える",type:"object",additionalProperties:!1,required:["type","row","from","to","color"],properties:{type:{const:"mark"},row:{$ref:"#/definitions/id"},from:{$ref:"#/definitions/unit"},to:{$ref:"#/definitions/unit"},color:{$ref:"#/definitions/color"}}},{description:"時間軸の図の from から to の目盛りに、括弧と字を出す。shape が box なら印の列を囲み、字を縁の札にする",type:"object",additionalProperties:!1,required:["type","from","to","text"],properties:{type:{const:"span"},from:{$ref:"#/definitions/unit"},to:{$ref:"#/definitions/unit"},text:{$ref:"#/definitions/text"},shape:{enum:["box"]},color:{$ref:"#/definitions/color"}}},{description:"葉を出す。木の図だけが書ける。書いた段で葉の箱が現れる。hash を書くと箱に値を出し、名札を葉の下の札に出す",type:"object",additionalProperties:!1,required:["type","id"],properties:{type:{const:"leaf"},id:{$ref:"#/definitions/id"},hash:{$ref:"#/definitions/hash"}}},{description:"1 つ以上の子から親を組む。木の図だけが書ける。書いた段で親の箱と、子から親への木の線が現れる",type:"object",additionalProperties:!1,required:["type","id","children"],properties:{type:{const:"node"},id:{$ref:"#/definitions/id"},children:{type:"array",minItems:1,items:{$ref:"#/definitions/id"}},hash:{$ref:"#/definitions/hash"}}},{description:"列の box の並びを items に書き換える。列の図だけが書ける。チップは前に居た列から滑り、どの列にも居なかったチップは弾んで現れ、列から外れたチップは消える",type:"object",additionalProperties:!1,required:["type","box","items"],properties:{type:{const:"line"},box:{$ref:"#/definitions/id"},items:{type:"array",minItems:1,maxItems:12,items:{$ref:"#/definitions/id"}}}},{description:"列 box に封をして、チップを隠す。列の図だけが書ける",type:"object",additionalProperties:!1,required:["type","box"],properties:{type:{const:"seal"},box:{$ref:"#/definitions/id"}}},{description:"列 box の封を開ける。列の図だけが書ける",type:"object",additionalProperties:!1,required:["type","box"],properties:{type:{const:"open"},box:{$ref:"#/definitions/id"}}},{description:"列 box を選ぶ。列の図だけが書ける。列の縁に色が付き、ほかの列が薄くなる",type:"object",additionalProperties:!1,required:["type","box"],properties:{type:{const:"pick"},box:{$ref:"#/definitions/id"}}},{description:"列 box の右に text の札を押す。列の図だけが書ける",type:"object",additionalProperties:!1,required:["type","box","text"],properties:{type:{const:"stamp"},box:{$ref:"#/definitions/id"},text:{$ref:"#/definitions/text"}}},{description:"中身の帯の欄の値と札",type:"object",additionalProperties:!1,required:["type","field"],anyOf:[{required:["value"]},{required:["tag"]}],properties:{type:{const:"strip"},field:{$ref:"#/definitions/text"},value:{$ref:"#/definitions/text"},tag:{$ref:"#/definitions/text"}}}]},fd=new RegExp("^[0-9a-f]{4,40}$","u"),Ev={properties:{kind:{enum:["envelope","tag","coin","none"]}}};function wl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;const l=r;let f=!0;const u=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.kind===void 0){const v={};a===null?a=[v]:a.push(v),r++}else if(t.kind!==void 0&&t.kind!=="tag"){const v={};a===null?a=[v]:a.push(v),r++}}var g=u===r;r=l,a!==null&&(l?a.length=l:a=null);let b;if(g){const v=r;if(t&&typeof t=="object"&&!Array.isArray(t)&&t.text===void 0){const N={instancePath:s,schemaPath:"#/then/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};a===null?a=[N]:a.push(N),r++}var g=v===r;f=g,b="then"}else{const v=r,A=r,N=r;if(t&&typeof t=="object"&&!Array.isArray(t)&&t.text===void 0){const M={};a===null?a=[M]:a.push(M),r++}var w=N===r;if(w){const M={instancePath:s,schemaPath:"#/else/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[M]:a.push(M),r++}else r=A,a!==null&&(A?a.length=A:a=null);var g=v===r;f=g,b="else"}if(!f){const v={instancePath:s,schemaPath:"#/if",keyword:"if",params:{failingKeyword:b},message:'must match "'+b+'" schema'};a===null?a=[v]:a.push(v),r++}if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.kind===void 0){const v={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"kind"},message:"must have required property 'kind'"};a===null?a=[v]:a.push(v),r++}for(const v in t)if(!(v==="kind"||v==="text")){const A={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:v},message:"must NOT have additional properties"};a===null?a=[A]:a.push(A),r++}if(t.kind!==void 0){let v=t.kind;if(!(v==="envelope"||v==="tag"||v==="coin"||v==="none")){const A={instancePath:s+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues:Ev.properties.kind.enum},message:"must be equal to one of the allowed values"};a===null?a=[A]:a.push(A),r++}}if(t.text!==void 0){let v=t.text;if(typeof v=="string"){if(xt(v)<1){const A={instancePath:s+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[A]:a.push(A),r++}}else{const A={instancePath:s+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[A]:a.push(A),r++}}}else{const v={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[v]:a.push(v),r++}return wl.errors=a,r===0}function kl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}const f=t.type;if(typeof f=="string")if(f==="edge")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.from===void 0){const u={instancePath:s,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[u]:a.push(u),r++}if(t.to===void 0){const u={instancePath:s,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[u]:a.push(u),r++}if(t.carry===void 0){const u={instancePath:s,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"carry"},message:"must have required property 'carry'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="from"||u==="to"||u==="label"||u==="carry"||u==="labelSide"||u==="at"||u==="into")){const g={instancePath:s,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="edge"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue:"edge"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.from!==void 0){let u=t.from;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.to!==void 0){let u=t.to;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/to",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/to",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.label!==void 0){let u=t.label;if(typeof u=="string"){if(xt(u)<1){const g={instancePath:s+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.carry!==void 0&&(wl(t.carry,{instancePath:s+"/carry",parentData:t,parentDataProperty:"carry",rootData:p})||(a=a===null?wl.errors:a.concat(wl.errors),r=a.length)),t.labelSide!==void 0){let u=t.labelSide;if(!(u==="above"||u==="below"||u==="left"||u==="right")){const g={instancePath:s+"/labelSide",schemaPath:"#/oneOf/0/properties/labelSide/enum",keyword:"enum",params:{allowedValues:o0.oneOf[0].properties.labelSide.enum},message:"must be equal to one of the allowed values"};a===null?a=[g]:a.push(g),r++}}if(t.at!==void 0){let u=t.at;if(!(typeof u=="number"&&!(u%1)&&!isNaN(u)&&isFinite(u))){const g={instancePath:s+"/at",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof u=="number"&&isFinite(u)&&(u<0||isNaN(u))){const g={instancePath:s+"/at",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}if(t.into!==void 0){let u=t.into;if(!(typeof u=="number"&&!(u%1)&&!isNaN(u)&&isFinite(u))){const g={instancePath:s+"/into",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof u=="number"&&isFinite(u)&&(u<0||isNaN(u))){const g={instancePath:s+"/into",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="action")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.box===void 0){const u={instancePath:s,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};a===null?a=[u]:a.push(u),r++}if(t.label===void 0){const u={instancePath:s,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"label"},message:"must have required property 'label'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="box"||u==="label")){const g={instancePath:s,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="action"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue:"action"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.box!==void 0){let u=t.box;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.label!==void 0){let u=t.label;if(typeof u=="string"){if(xt(u)<1){const g={instancePath:s+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="swap")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.box===void 0){const u={instancePath:s,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};a===null?a=[u]:a.push(u),r++}if(t.text===void 0){const u={instancePath:s,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="box"||u==="text"||u==="color")){const g={instancePath:s,schemaPath:"#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="swap"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue:"swap"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.box!==void 0){let u=t.box;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.text!==void 0){let u=t.text;if(typeof u=="string"){if(xt(u)<1){const g={instancePath:s+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.color!==void 0){let u=t.color;if(!(u==="blue"||u==="amber"||u==="green"||u==="violet"||u==="rose"||u==="slate"||u==="coin")){const g={instancePath:s+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:zs.enum},message:"must be equal to one of the allowed values"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/2/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="commit")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.id===void 0){const u={instancePath:s,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[u]:a.push(u),r++}if(t.branch===void 0){const u={instancePath:s,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"branch"},message:"must have required property 'branch'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="id"||u==="branch"||u==="copy"||u==="merge"||u==="hash"||u==="note")){const g={instancePath:s,schemaPath:"#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="commit"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue:"commit"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.id!==void 0){let u=t.id;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.branch!==void 0){let u=t.branch;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/branch",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/branch",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.copy!==void 0){let u=t.copy;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/copy",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/copy",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.merge!==void 0){let u=t.merge;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/merge",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/merge",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.hash!==void 0){let u=t.hash;if(typeof u=="string"){if(!fd.test(u)){const g={instancePath:s+"/hash",schemaPath:"#/definitions/hash/pattern",keyword:"pattern",params:{pattern:"^[0-9a-f]{4,40}$"},message:'must match pattern "^[0-9a-f]{4,40}$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/hash",schemaPath:"#/definitions/hash/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.note!==void 0){let u=t.note;if(typeof u=="string"){if(xt(u)<1){const g={instancePath:s+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/3/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="branch")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.branch===void 0){const u={instancePath:s,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"branch"},message:"must have required property 'branch'"};a===null?a=[u]:a.push(u),r++}if(t.from===void 0){const u={instancePath:s,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="branch"||u==="from")){const g={instancePath:s,schemaPath:"#/oneOf/4/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="branch"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue:"branch"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.branch!==void 0){let u=t.branch;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/branch",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/branch",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.from!==void 0){let u=t.from;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/4/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="now")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.to===void 0){const u={instancePath:s,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="to")){const g={instancePath:s,schemaPath:"#/oneOf/5/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="now"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue:"now"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.to!==void 0){let u=t.to;if(!(typeof u=="number"&&!(u%1)&&!isNaN(u)&&isFinite(u))){const g={instancePath:s+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof u=="number"&&isFinite(u)&&(u<0||isNaN(u))){const g={instancePath:s+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/5/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="mark")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.row===void 0){const u={instancePath:s,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"row"},message:"must have required property 'row'"};a===null?a=[u]:a.push(u),r++}if(t.from===void 0){const u={instancePath:s,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[u]:a.push(u),r++}if(t.to===void 0){const u={instancePath:s,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[u]:a.push(u),r++}if(t.color===void 0){const u={instancePath:s,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"color"},message:"must have required property 'color'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="row"||u==="from"||u==="to"||u==="color")){const g={instancePath:s,schemaPath:"#/oneOf/6/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="mark"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue:"mark"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.row!==void 0){let u=t.row;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/row",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/row",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.from!==void 0){let u=t.from;if(!(typeof u=="number"&&!(u%1)&&!isNaN(u)&&isFinite(u))){const g={instancePath:s+"/from",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof u=="number"&&isFinite(u)&&(u<0||isNaN(u))){const g={instancePath:s+"/from",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}if(t.to!==void 0){let u=t.to;if(!(typeof u=="number"&&!(u%1)&&!isNaN(u)&&isFinite(u))){const g={instancePath:s+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof u=="number"&&isFinite(u)&&(u<0||isNaN(u))){const g={instancePath:s+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}if(t.color!==void 0){let u=t.color;if(!(u==="blue"||u==="amber"||u==="green"||u==="violet"||u==="rose"||u==="slate"||u==="coin")){const g={instancePath:s+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:zs.enum},message:"must be equal to one of the allowed values"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/6/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="span")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.from===void 0){const u={instancePath:s,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[u]:a.push(u),r++}if(t.to===void 0){const u={instancePath:s,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[u]:a.push(u),r++}if(t.text===void 0){const u={instancePath:s,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="from"||u==="to"||u==="text"||u==="shape"||u==="color")){const g={instancePath:s,schemaPath:"#/oneOf/7/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="span"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue:"span"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.from!==void 0){let u=t.from;if(!(typeof u=="number"&&!(u%1)&&!isNaN(u)&&isFinite(u))){const g={instancePath:s+"/from",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof u=="number"&&isFinite(u)&&(u<0||isNaN(u))){const g={instancePath:s+"/from",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}if(t.to!==void 0){let u=t.to;if(!(typeof u=="number"&&!(u%1)&&!isNaN(u)&&isFinite(u))){const g={instancePath:s+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof u=="number"&&isFinite(u)&&(u<0||isNaN(u))){const g={instancePath:s+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}if(t.text!==void 0){let u=t.text;if(typeof u=="string"){if(xt(u)<1){const g={instancePath:s+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.shape!==void 0&&t.shape!=="box"){const u={instancePath:s+"/shape",schemaPath:"#/oneOf/7/properties/shape/enum",keyword:"enum",params:{allowedValues:o0.oneOf[7].properties.shape.enum},message:"must be equal to one of the allowed values"};a===null?a=[u]:a.push(u),r++}if(t.color!==void 0){let u=t.color;if(!(u==="blue"||u==="amber"||u==="green"||u==="violet"||u==="rose"||u==="slate"||u==="coin")){const g={instancePath:s+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:zs.enum},message:"must be equal to one of the allowed values"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/7/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="leaf")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.id===void 0){const u={instancePath:s,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="id"||u==="hash")){const g={instancePath:s,schemaPath:"#/oneOf/8/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="leaf"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue:"leaf"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.id!==void 0){let u=t.id;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.hash!==void 0){let u=t.hash;if(typeof u=="string"){if(!fd.test(u)){const g={instancePath:s+"/hash",schemaPath:"#/definitions/hash/pattern",keyword:"pattern",params:{pattern:"^[0-9a-f]{4,40}$"},message:'must match pattern "^[0-9a-f]{4,40}$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/hash",schemaPath:"#/definitions/hash/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/8/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="node")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.id===void 0){const u={instancePath:s,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[u]:a.push(u),r++}if(t.children===void 0){const u={instancePath:s,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty:"children"},message:"must have required property 'children'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="id"||u==="children"||u==="hash")){const g={instancePath:s,schemaPath:"#/oneOf/9/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="node"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/9/properties/type/const",keyword:"const",params:{allowedValue:"node"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.id!==void 0){let u=t.id;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.children!==void 0){let u=t.children;if(Array.isArray(u)){if(u.length<1){const b={instancePath:s+"/children",schemaPath:"#/oneOf/9/properties/children/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[b]:a.push(b),r++}const g=u.length;for(let b=0;b<g;b++){let w=u[b];if(typeof w=="string"){if(!kt.test(w)){const v={instancePath:s+"/children/"+b,schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[v]:a.push(v),r++}}else{const v={instancePath:s+"/children/"+b,schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[v]:a.push(v),r++}}}else{const g={instancePath:s+"/children",schemaPath:"#/oneOf/9/properties/children/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[g]:a.push(g),r++}}if(t.hash!==void 0){let u=t.hash;if(typeof u=="string"){if(!fd.test(u)){const g={instancePath:s+"/hash",schemaPath:"#/definitions/hash/pattern",keyword:"pattern",params:{pattern:"^[0-9a-f]{4,40}$"},message:'must match pattern "^[0-9a-f]{4,40}$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/hash",schemaPath:"#/definitions/hash/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/9/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="line")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/10/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.box===void 0){const u={instancePath:s,schemaPath:"#/oneOf/10/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};a===null?a=[u]:a.push(u),r++}if(t.items===void 0){const u={instancePath:s,schemaPath:"#/oneOf/10/required",keyword:"required",params:{missingProperty:"items"},message:"must have required property 'items'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="box"||u==="items")){const g={instancePath:s,schemaPath:"#/oneOf/10/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="line"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/10/properties/type/const",keyword:"const",params:{allowedValue:"line"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.box!==void 0){let u=t.box;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.items!==void 0){let u=t.items;if(Array.isArray(u)){if(u.length>12){const b={instancePath:s+"/items",schemaPath:"#/oneOf/10/properties/items/maxItems",keyword:"maxItems",params:{limit:12},message:"must NOT have more than 12 items"};a===null?a=[b]:a.push(b),r++}if(u.length<1){const b={instancePath:s+"/items",schemaPath:"#/oneOf/10/properties/items/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[b]:a.push(b),r++}const g=u.length;for(let b=0;b<g;b++){let w=u[b];if(typeof w=="string"){if(!kt.test(w)){const v={instancePath:s+"/items/"+b,schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[v]:a.push(v),r++}}else{const v={instancePath:s+"/items/"+b,schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[v]:a.push(v),r++}}}else{const g={instancePath:s+"/items",schemaPath:"#/oneOf/10/properties/items/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/10/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="seal")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/11/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.box===void 0){const u={instancePath:s,schemaPath:"#/oneOf/11/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="box")){const g={instancePath:s,schemaPath:"#/oneOf/11/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="seal"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/11/properties/type/const",keyword:"const",params:{allowedValue:"seal"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.box!==void 0){let u=t.box;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/11/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="open")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/12/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.box===void 0){const u={instancePath:s,schemaPath:"#/oneOf/12/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="box")){const g={instancePath:s,schemaPath:"#/oneOf/12/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="open"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/12/properties/type/const",keyword:"const",params:{allowedValue:"open"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.box!==void 0){let u=t.box;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/12/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="pick")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/13/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.box===void 0){const u={instancePath:s,schemaPath:"#/oneOf/13/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="box")){const g={instancePath:s,schemaPath:"#/oneOf/13/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="pick"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/13/properties/type/const",keyword:"const",params:{allowedValue:"pick"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.box!==void 0){let u=t.box;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/13/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="stamp")if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const u={instancePath:s,schemaPath:"#/oneOf/14/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[u]:a.push(u),r++}if(t.box===void 0){const u={instancePath:s,schemaPath:"#/oneOf/14/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};a===null?a=[u]:a.push(u),r++}if(t.text===void 0){const u={instancePath:s,schemaPath:"#/oneOf/14/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};a===null?a=[u]:a.push(u),r++}for(const u in t)if(!(u==="type"||u==="box"||u==="text")){const g={instancePath:s,schemaPath:"#/oneOf/14/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:u},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(t.type!==void 0&&t.type!=="stamp"){const u={instancePath:s+"/type",schemaPath:"#/oneOf/14/properties/type/const",keyword:"const",params:{allowedValue:"stamp"},message:"must be equal to constant"};a===null?a=[u]:a.push(u),r++}if(t.box!==void 0){let u=t.box;if(typeof u=="string"){if(!kt.test(u)){const g={instancePath:s+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(t.text!==void 0){let u=t.text;if(typeof u=="string"){if(xt(u)<1){const g={instancePath:s+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:s+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const u={instancePath:s,schemaPath:"#/oneOf/14/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[u]:a.push(u),r++}else if(f==="strip"){const u=r;let g=!1;const b=r;if(t&&typeof t=="object"&&!Array.isArray(t)&&t.value===void 0){const w={instancePath:s,schemaPath:"#/oneOf/15/anyOf/0/required",keyword:"required",params:{missingProperty:"value"},message:"must have required property 'value'"};a===null?a=[w]:a.push(w),r++}var l=b===r;if(g=g||l,!g){const w=r;if(t&&typeof t=="object"&&!Array.isArray(t)&&t.tag===void 0){const A={instancePath:s,schemaPath:"#/oneOf/15/anyOf/1/required",keyword:"required",params:{missingProperty:"tag"},message:"must have required property 'tag'"};a===null?a=[A]:a.push(A),r++}var l=w===r;g=g||l}if(g)r=u,a!==null&&(u?a.length=u:a=null);else{const w={instancePath:s,schemaPath:"#/oneOf/15/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};a===null?a=[w]:a.push(w),r++}if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.type===void 0){const w={instancePath:s,schemaPath:"#/oneOf/15/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[w]:a.push(w),r++}if(t.field===void 0){const w={instancePath:s,schemaPath:"#/oneOf/15/required",keyword:"required",params:{missingProperty:"field"},message:"must have required property 'field'"};a===null?a=[w]:a.push(w),r++}for(const w in t)if(!(w==="type"||w==="field"||w==="value"||w==="tag")){const v={instancePath:s,schemaPath:"#/oneOf/15/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:w},message:"must NOT have additional properties"};a===null?a=[v]:a.push(v),r++}if(t.type!==void 0&&t.type!=="strip"){const w={instancePath:s+"/type",schemaPath:"#/oneOf/15/properties/type/const",keyword:"const",params:{allowedValue:"strip"},message:"must be equal to constant"};a===null?a=[w]:a.push(w),r++}if(t.field!==void 0){let w=t.field;if(typeof w=="string"){if(xt(w)<1){const v={instancePath:s+"/field",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[v]:a.push(v),r++}}else{const v={instancePath:s+"/field",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[v]:a.push(v),r++}}if(t.value!==void 0){let w=t.value;if(typeof w=="string"){if(xt(w)<1){const v={instancePath:s+"/value",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[v]:a.push(v),r++}}else{const v={instancePath:s+"/value",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[v]:a.push(v),r++}}if(t.tag!==void 0){let w=t.tag;if(typeof w=="string"){if(xt(w)<1){const v={instancePath:s+"/tag",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[v]:a.push(v),r++}}else{const v={instancePath:s+"/tag",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[v]:a.push(v),r++}}}else{const w={instancePath:s,schemaPath:"#/oneOf/15/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[w]:a.push(w),r++}}else{const u={instancePath:s,schemaPath:"#/discriminator",keyword:"discriminator",params:{error:"mapping",tag:"type",tagValue:f},message:'value of tag "type" must be in oneOf'};a===null?a=[u]:a.push(u),r++}else{const u={instancePath:s,schemaPath:"#/discriminator",keyword:"discriminator",params:{error:"tag",tag:"type",tagValue:f},message:'tag "type" must be string'};a===null?a=[u]:a.push(u),r++}}else{const f={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[f]:a.push(f),r++}return kl.errors=a,r===0}function El(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.title===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};a===null?a=[l]:a.push(l),r++}if(t.body===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"body"},message:"must have required property 'body'"};a===null?a=[l]:a.push(l),r++}if(t.events===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"events"},message:"must have required property 'events'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="title"||l==="body"||l==="code"||l==="sources"||l==="events")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.title!==void 0){let l=t.title;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.body!==void 0){let l=t.body;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/body",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/body",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.code!==void 0){let l=t.code;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/code",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/code",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.sources!==void 0){let l=t.sources;if(Array.isArray(l)){if(l.length<1){const u={instancePath:s+"/sources",schemaPath:"#/properties/sources/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[u]:a.push(u),r++}const f=l.length;for(let u=0;u<f;u++)xl(l[u],{instancePath:s+"/sources/"+u,parentData:l,parentDataProperty:u,rootData:p})||(a=a===null?xl.errors:a.concat(xl.errors),r=a.length)}else{const f={instancePath:s+"/sources",schemaPath:"#/properties/sources/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}if(t.events!==void 0){let l=t.events;if(Array.isArray(l)){const f=l.length;for(let u=0;u<f;u++)kl(l[u],{instancePath:s+"/events/"+u,parentData:l,parentDataProperty:u,rootData:p})||(a=a===null?kl.errors:a.concat(kl.errors),r=a.length)}else{const f={instancePath:s+"/events",schemaPath:"#/properties/events/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return El.errors=a,r===0}function Al(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.lifelines===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"lifelines"},message:"must have required property 'lifelines'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(l!=="lifelines"){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.lifelines!==void 0){let l=t.lifelines;if(Array.isArray(l)){if(l.length<1){const u={instancePath:s+"/lifelines",schemaPath:"#/properties/lifelines/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[u]:a.push(u),r++}const f=l.length;for(let u=0;u<f;u++){let g=l[u];if(typeof g=="string"){if(!kt.test(g)){const b={instancePath:s+"/lifelines/"+u,schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[b]:a.push(b),r++}}else{const b={instancePath:s+"/lifelines/"+u,schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[b]:a.push(b),r++}}}else{const f={instancePath:s+"/lifelines",schemaPath:"#/properties/lifelines/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return Al.errors=a,r===0}function _l(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.from===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[l]:a.push(l),r++}if(t.to===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="from"||l==="to"||l==="label")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.from!==void 0){let l=t.from;if(typeof l=="string"){if(!kt.test(l)){const f={instancePath:s+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.to!==void 0){let l=t.to;if(typeof l=="string"){if(!kt.test(l)){const f={instancePath:s+"/to",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/to",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.label!==void 0){let l=t.label;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return _l.errors=a,r===0}function Sl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.paths===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"paths"},message:"must have required property 'paths'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(l!=="paths"){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.paths!==void 0){let l=t.paths;if(Array.isArray(l)){if(l.length<1){const u={instancePath:s+"/paths",schemaPath:"#/properties/paths/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[u]:a.push(u),r++}const f=l.length;for(let u=0;u<f;u++)_l(l[u],{instancePath:s+"/paths/"+u,parentData:l,parentDataProperty:u,rootData:p})||(a=a===null?_l.errors:a.concat(_l.errors),r=a.length)}else{const f={instancePath:s+"/paths",schemaPath:"#/properties/paths/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return Sl.errors=a,r===0}function $l(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.id===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="id"||l==="note")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.id!==void 0){let l=t.id;if(typeof l=="string"){if(!kt.test(l)){const f={instancePath:s+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.note!==void 0){let l=t.note;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return $l.errors=a,r===0}function Nl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.branches===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"branches"},message:"must have required property 'branches'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(l!=="branches"){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.branches!==void 0){let l=t.branches;if(Array.isArray(l)){if(l.length<1){const u={instancePath:s+"/branches",schemaPath:"#/properties/branches/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[u]:a.push(u),r++}const f=l.length;for(let u=0;u<f;u++)$l(l[u],{instancePath:s+"/branches/"+u,parentData:l,parentDataProperty:u,rootData:p})||(a=a===null?$l.errors:a.concat($l.errors),r=a.length)}else{const f={instancePath:s+"/branches",schemaPath:"#/properties/branches/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return Nl.errors=a,r===0}var Av=new RegExp("^[0-9]+(\\.[0-9]+)?(ms|s|min|h|d)$","u");function Dl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.unit===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"unit"},message:"must have required property 'unit'"};a===null?a=[l]:a.push(l),r++}if(t.length===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"length"},message:"must have required property 'length'"};a===null?a=[l]:a.push(l),r++}if(t.count===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"count"},message:"must have required property 'count'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="unit"||l==="length"||l==="count"||l==="from")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.unit!==void 0){let l=t.unit;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/unit",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/unit",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.length!==void 0){let l=t.length;if(typeof l=="string"){if(!Av.test(l)){const f={instancePath:s+"/length",schemaPath:"#/definitions/duration/pattern",keyword:"pattern",params:{pattern:"^[0-9]+(\\.[0-9]+)?(ms|s|min|h|d)$"},message:'must match pattern "^[0-9]+(\\.[0-9]+)?(ms|s|min|h|d)$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/length",schemaPath:"#/definitions/duration/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.count!==void 0){let l=t.count;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:s+"/count",schemaPath:"#/properties/count/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<1||isNaN(l))){const f={instancePath:s+"/count",schemaPath:"#/properties/count/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};a===null?a=[f]:a.push(f),r++}}if(t.from!==void 0){let l=t.from;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:s+"/from",schemaPath:"#/properties/from/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const f={instancePath:s+"/from",schemaPath:"#/properties/from/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return Dl.errors=a,r===0}function Tl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.name===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};a===null?a=[l]:a.push(l),r++}if(t.length===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"length"},message:"must have required property 'length'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="name"||l==="length"||l==="from")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.name!==void 0){let l=t.name;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.length!==void 0){let l=t.length;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:s+"/length",schemaPath:"#/properties/length/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<1||isNaN(l))){const f={instancePath:s+"/length",schemaPath:"#/properties/length/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};a===null?a=[f]:a.push(f),r++}}if(t.from!==void 0){let l=t.from;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:s+"/from",schemaPath:"#/properties/from/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const f={instancePath:s+"/from",schemaPath:"#/properties/from/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return Tl.errors=a,r===0}function Cl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.id===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}if(t.name===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="id"||l==="name"||l==="color"||l==="empty")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.id!==void 0){let l=t.id;if(typeof l=="string"){if(!kt.test(l)){const f={instancePath:s+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.name!==void 0){let l=t.name;if(typeof l=="string"){if(xt(l)<1){const f={instancePath:s+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.color!==void 0){let l=t.color;if(!(l==="blue"||l==="amber"||l==="green"||l==="violet"||l==="rose"||l==="slate"||l==="coin")){const f={instancePath:s+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:zs.enum},message:"must be equal to one of the allowed values"};a===null?a=[f]:a.push(f),r++}}if(t.empty!==void 0){let l=t.empty;if(Array.isArray(l)){const f=l.length;for(let u=0;u<f;u++){let g=l[u];if(!(typeof g=="number"&&!(g%1)&&!isNaN(g)&&isFinite(g))){const b={instancePath:s+"/empty/"+u,schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[b]:a.push(b),r++}if(typeof g=="number"&&isFinite(g)&&(g<0||isNaN(g))){const b={instancePath:s+"/empty/"+u,schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[b]:a.push(b),r++}}}else{const f={instancePath:s+"/empty",schemaPath:"#/properties/empty/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return Cl.errors=a,r===0}function Ol(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.id===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}if(t.at===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"at"},message:"must have required property 'at'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="id"||l==="at")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.id!==void 0){let l=t.id;if(typeof l=="string"){if(!kt.test(l)){const f={instancePath:s+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.at!==void 0){let l=t.at;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:s+"/at",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const f={instancePath:s+"/at",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return Ol.errors=a,r===0}function Ml(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.from===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[l]:a.push(l),r++}if(t.to===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="from"||l==="to")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.from!==void 0){let l=t.from;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:s+"/from",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const f={instancePath:s+"/from",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[f]:a.push(f),r++}}if(t.to!==void 0){let l=t.to;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:s+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const f={instancePath:s+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return Ml.errors=a,r===0}function Bl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.scale===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"scale"},message:"must have required property 'scale'"};a===null?a=[l]:a.push(l),r++}if(t.rows===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"rows"},message:"must have required property 'rows'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="scale"||l==="period"||l==="rows"||l==="points"||l==="zoom")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.scale!==void 0&&(Dl(t.scale,{instancePath:s+"/scale",parentData:t,parentDataProperty:"scale",rootData:p})||(a=a===null?Dl.errors:a.concat(Dl.errors),r=a.length)),t.period!==void 0&&(Tl(t.period,{instancePath:s+"/period",parentData:t,parentDataProperty:"period",rootData:p})||(a=a===null?Tl.errors:a.concat(Tl.errors),r=a.length)),t.rows!==void 0){let l=t.rows;if(Array.isArray(l)){if(l.length<1){const u={instancePath:s+"/rows",schemaPath:"#/properties/rows/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[u]:a.push(u),r++}const f=l.length;for(let u=0;u<f;u++)Cl(l[u],{instancePath:s+"/rows/"+u,parentData:l,parentDataProperty:u,rootData:p})||(a=a===null?Cl.errors:a.concat(Cl.errors),r=a.length)}else{const f={instancePath:s+"/rows",schemaPath:"#/properties/rows/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}if(t.points!==void 0){let l=t.points;if(Array.isArray(l)){const f=l.length;for(let u=0;u<f;u++)Ol(l[u],{instancePath:s+"/points/"+u,parentData:l,parentDataProperty:u,rootData:p})||(a=a===null?Ol.errors:a.concat(Ol.errors),r=a.length)}else{const f={instancePath:s+"/points",schemaPath:"#/properties/points/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}t.zoom!==void 0&&(Ml(t.zoom,{instancePath:s+"/zoom",parentData:t,parentDataProperty:"zoom",rootData:p})||(a=a===null?Ml.errors:a.concat(Ml.errors),r=a.length))}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return Bl.errors=a,r===0}function jl(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.id===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(!(l==="id"||l==="color"||l==="label")){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.id!==void 0){let l=t.id;if(typeof l=="string"){if(!kt.test(l)){const f={instancePath:s+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(t.color!==void 0){let l=t.color;if(!(l==="blue"||l==="amber"||l==="green"||l==="violet"||l==="rose"||l==="slate"||l==="coin")){const f={instancePath:s+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:zs.enum},message:"must be equal to one of the allowed values"};a===null?a=[f]:a.push(f),r++}}if(t.label!==void 0){let l=t.label;if(typeof l=="string"){if(xt(l)>4){const f={instancePath:s+"/label",schemaPath:"#/properties/label/maxLength",keyword:"maxLength",params:{limit:4},message:"must NOT have more than 4 characters"};a===null?a=[f]:a.push(f),r++}if(xt(l)<1){const f={instancePath:s+"/label",schemaPath:"#/properties/label/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:s+"/label",schemaPath:"#/properties/label/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return jl.errors=a,r===0}function ql(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.items===void 0){const l={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"items"},message:"must have required property 'items'"};a===null?a=[l]:a.push(l),r++}for(const l in t)if(l!=="items"){const f={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(t.items!==void 0){let l=t.items;if(Array.isArray(l)){if(l.length<1){const u={instancePath:s+"/items",schemaPath:"#/properties/items/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[u]:a.push(u),r++}const f=l.length;for(let u=0;u<f;u++)jl(l[u],{instancePath:s+"/items/"+u,parentData:l,parentDataProperty:u,rootData:p})||(a=a===null?jl.errors:a.concat(jl.errors),r=a.length)}else{const f={instancePath:s+"/items",schemaPath:"#/properties/items/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return ql.errors=a,r===0}var _v=Object.prototype.hasOwnProperty;function I0(t,{instancePath:s="",parentData:c,parentDataProperty:d,rootData:p=t}={}){let a=null,r=0;const l=r;let f=!0;const u=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.kind===void 0){const D={};a===null?a=[D]:a.push(D),r++}else if(t.kind!==void 0&&t.kind!=="sequence"){const D={};a===null?a=[D]:a.push(D),r++}}var g=u===r;r=l,a!==null&&(l?a.length=l:a=null);let b;if(g){const D=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.sequence===void 0){const H={instancePath:s,schemaPath:"#/then/required",keyword:"required",params:{missingProperty:"sequence"},message:"must have required property 'sequence'"};a===null?a=[H]:a.push(H),r++}if(t.boxes!==void 0){let H=t.boxes;if(Array.isArray(H)&&H.length<1){const Z={instancePath:s+"/boxes",schemaPath:"#/then/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[Z]:a.push(Z),r++}}if(t.steps!==void 0&&(ua(t.steps,{instancePath:s+"/steps",parentData:t,parentDataProperty:"steps",rootData:p})||(a=a===null?ua.errors:a.concat(ua.errors),r=a.length)),t.strip!==void 0&&(rn(t.strip,{instancePath:s+"/strip",parentData:t,parentDataProperty:"strip",rootData:p})||(a=a===null?rn.errors:a.concat(rn.errors),r=a.length)),t.state!==void 0){const H={instancePath:s+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[H]:a.push(H),r++}if(t.git!==void 0){const H={instancePath:s+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[H]:a.push(H),r++}if(t.time!==void 0){const H={instancePath:s+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[H]:a.push(H),r++}if(t.lineup!==void 0){const H={instancePath:s+"/lineup",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[H]:a.push(H),r++}}var g=D===r;f=g,b="then"}else{const D=r,z=r;let H=!0;const Z=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.kind===void 0){const _={};a===null?a=[_]:a.push(_),r++}else if(t.kind!==void 0&&t.kind!=="state"){const _={};a===null?a=[_]:a.push(_),r++}}var w=Z===r;r=z,a!==null&&(z?a.length=z:a=null);let j;if(w){const _=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.boxes!==void 0){let B=t.boxes;if(Array.isArray(B)){if(B.length<1){const ae={instancePath:s+"/boxes",schemaPath:"#/else/then/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[ae]:a.push(ae),r++}const ne=B.length;for(let ae=0;ae<ne;ae++){let fe=B[ae];if(fe&&typeof fe=="object"&&!Array.isArray(fe)&&fe.id!==void 0){let pe=fe.id;const Ae=r,C=r;if(!(pe==="start"||pe==="finish")){const $={};a===null?a=[$]:a.push($),r++}var v=C===r;if(v){const $={instancePath:s+"/boxes/"+ae+"/id",schemaPath:"#/else/then/properties/boxes/items/properties/id/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[$]:a.push($),r++}else r=Ae,a!==null&&(Ae?a.length=Ae:a=null)}}}}if(t.steps!==void 0&&(ua(t.steps,{instancePath:s+"/steps",parentData:t,parentDataProperty:"steps",rootData:p})||(a=a===null?ua.errors:a.concat(ua.errors),r=a.length)),t.strip!==void 0&&(rn(t.strip,{instancePath:s+"/strip",parentData:t,parentDataProperty:"strip",rootData:p})||(a=a===null?rn.errors:a.concat(rn.errors),r=a.length)),t.git!==void 0){const B={instancePath:s+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[B]:a.push(B),r++}if(t.time!==void 0){const B={instancePath:s+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[B]:a.push(B),r++}if(t.lineup!==void 0){const B={instancePath:s+"/lineup",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[B]:a.push(B),r++}}var w=_===r;H=w,j="then"}else{const _=r,P=r;let B=!0;const ne=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.kind===void 0){const pe={};a===null?a=[pe]:a.push(pe),r++}else if(t.kind!==void 0&&t.kind!=="git"){const pe={};a===null?a=[pe]:a.push(pe),r++}}var A=ne===r;r=P,a!==null&&(P?a.length=P:a=null);let ae;if(A){const pe=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.git===void 0){const C={instancePath:s,schemaPath:"#/else/else/then/required",keyword:"required",params:{missingProperty:"git"},message:"must have required property 'git'"};a===null?a=[C]:a.push(C),r++}if(t.steps!==void 0&&(pl(t.steps,{instancePath:s+"/steps",parentData:t,parentDataProperty:"steps",rootData:p})||(a=a===null?pl.errors:a.concat(pl.errors),r=a.length)),t.strip!==void 0&&(rn(t.strip,{instancePath:s+"/strip",parentData:t,parentDataProperty:"strip",rootData:p})||(a=a===null?rn.errors:a.concat(rn.errors),r=a.length)),t.state!==void 0){const C={instancePath:s+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[C]:a.push(C),r++}if(t.regions!==void 0){const C={instancePath:s+"/regions",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[C]:a.push(C),r++}if(t.time!==void 0){const C={instancePath:s+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[C]:a.push(C),r++}if(t.lineup!==void 0){const C={instancePath:s+"/lineup",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[C]:a.push(C),r++}}var A=pe===r;B=A,ae="then"}else{const pe=r,Ae=r;let C=!0;const $=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.kind===void 0){const ie={};a===null?a=[ie]:a.push(ie),r++}else if(t.kind!==void 0&&t.kind!=="time"){const ie={};a===null?a=[ie]:a.push(ie),r++}}var N=$===r;r=Ae,a!==null&&(Ae?a.length=Ae:a=null);let V;if(N){const ie=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.time===void 0){const G={instancePath:s,schemaPath:"#/else/else/else/then/required",keyword:"required",params:{missingProperty:"time"},message:"must have required property 'time'"};a===null?a=[G]:a.push(G),r++}if(t.steps!==void 0&&(hl(t.steps,{instancePath:s+"/steps",parentData:t,parentDataProperty:"steps",rootData:p})||(a=a===null?hl.errors:a.concat(hl.errors),r=a.length)),t.state!==void 0){const G={instancePath:s+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[G]:a.push(G),r++}if(t.git!==void 0){const G={instancePath:s+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[G]:a.push(G),r++}if(t.regions!==void 0){const G={instancePath:s+"/regions",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[G]:a.push(G),r++}if(t.lineup!==void 0){const G={instancePath:s+"/lineup",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[G]:a.push(G),r++}}var N=ie===r;C=N,V="then"}else{const ie=r,T=r;let G=!0;const re=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.kind===void 0){const ke={};a===null?a=[ke]:a.push(ke),r++}else if(t.kind!==void 0&&t.kind!=="tree"){const ke={};a===null?a=[ke]:a.push(ke),r++}}var S=re===r;r=T,a!==null&&(T?a.length=T:a=null);let Y;if(S){const ke=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.steps!==void 0&&(fl(t.steps,{instancePath:s+"/steps",parentData:t,parentDataProperty:"steps",rootData:p})||(a=a===null?fl.errors:a.concat(fl.errors),r=a.length)),t.strip!==void 0&&(rn(t.strip,{instancePath:s+"/strip",parentData:t,parentDataProperty:"strip",rootData:p})||(a=a===null?rn.errors:a.concat(rn.errors),r=a.length)),t.state!==void 0){const Fe={instancePath:s+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Fe]:a.push(Fe),r++}if(t.git!==void 0){const Fe={instancePath:s+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Fe]:a.push(Fe),r++}if(t.time!==void 0){const Fe={instancePath:s+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Fe]:a.push(Fe),r++}if(t.regions!==void 0){const Fe={instancePath:s+"/regions",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Fe]:a.push(Fe),r++}if(t.lineup!==void 0){const Fe={instancePath:s+"/lineup",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Fe]:a.push(Fe),r++}}var S=ke===r;G=S,Y="then"}else{const ke=r,ze=r;let Fe=!0;const Re=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.kind===void 0){const U={};a===null?a=[U]:a.push(U),r++}else if(t.kind!==void 0&&t.kind!=="lineup"){const U={};a===null?a=[U]:a.push(U),r++}}var M=Re===r;r=ze,a!==null&&(ze?a.length=ze:a=null);let Qe;if(M){const U=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.lineup===void 0){const F={instancePath:s,schemaPath:"#/else/else/else/else/else/then/required",keyword:"required",params:{missingProperty:"lineup"},message:"must have required property 'lineup'"};a===null?a=[F]:a.push(F),r++}if(t.boxes!==void 0){let F=t.boxes;if(Array.isArray(F)){if(F.length<1){const k={instancePath:s+"/boxes",schemaPath:"#/else/else/else/else/else/then/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[k]:a.push(k),r++}const be=F.length;for(let k=0;k<be;k++){let te=F[k];if(te&&typeof te=="object"&&!Array.isArray(te)){if(te.icon!==void 0){const W={instancePath:s+"/boxes/"+k+"/icon",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[W]:a.push(W),r++}if(te.link!==void 0){const W={instancePath:s+"/boxes/"+k+"/link",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[W]:a.push(W),r++}if(te.region!==void 0){const W={instancePath:s+"/boxes/"+k+"/region",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[W]:a.push(W),r++}}}}}if(t.steps!==void 0&&(ml(t.steps,{instancePath:s+"/steps",parentData:t,parentDataProperty:"steps",rootData:p})||(a=a===null?ml.errors:a.concat(ml.errors),r=a.length)),t.strip!==void 0&&(rn(t.strip,{instancePath:s+"/strip",parentData:t,parentDataProperty:"strip",rootData:p})||(a=a===null?rn.errors:a.concat(rn.errors),r=a.length)),t.state!==void 0){const F={instancePath:s+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[F]:a.push(F),r++}if(t.git!==void 0){const F={instancePath:s+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[F]:a.push(F),r++}if(t.time!==void 0){const F={instancePath:s+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[F]:a.push(F),r++}if(t.regions!==void 0){const F={instancePath:s+"/regions",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[F]:a.push(F),r++}}var M=U===r;Fe=M,Qe="then"}else{const U=r;if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.boxes!==void 0){let F=t.boxes;if(Array.isArray(F)&&F.length<1){const be={instancePath:s+"/boxes",schemaPath:"#/else/else/else/else/else/else/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[be]:a.push(be),r++}}if(t.steps!==void 0&&(ua(t.steps,{instancePath:s+"/steps",parentData:t,parentDataProperty:"steps",rootData:p})||(a=a===null?ua.errors:a.concat(ua.errors),r=a.length)),t.strip!==void 0&&(rn(t.strip,{instancePath:s+"/strip",parentData:t,parentDataProperty:"strip",rootData:p})||(a=a===null?rn.errors:a.concat(rn.errors),r=a.length)),t.state!==void 0){const F={instancePath:s+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[F]:a.push(F),r++}if(t.git!==void 0){const F={instancePath:s+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[F]:a.push(F),r++}if(t.time!==void 0){const F={instancePath:s+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[F]:a.push(F),r++}if(t.lineup!==void 0){const F={instancePath:s+"/lineup",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[F]:a.push(F),r++}}var M=U===r;Fe=M,Qe="else"}if(!Fe){const U={instancePath:s,schemaPath:"#/else/else/else/else/else/if",keyword:"if",params:{failingKeyword:Qe},message:'must match "'+Qe+'" schema'};a===null?a=[U]:a.push(U),r++}var S=ke===r;G=S,Y="else"}if(!G){const ke={instancePath:s,schemaPath:"#/else/else/else/else/if",keyword:"if",params:{failingKeyword:Y},message:'must match "'+Y+'" schema'};a===null?a=[ke]:a.push(ke),r++}var N=ie===r;C=N,V="else"}if(!C){const ie={instancePath:s,schemaPath:"#/else/else/else/if",keyword:"if",params:{failingKeyword:V},message:'must match "'+V+'" schema'};a===null?a=[ie]:a.push(ie),r++}var A=pe===r;B=A,ae="else"}if(!B){const pe={instancePath:s,schemaPath:"#/else/else/if",keyword:"if",params:{failingKeyword:ae},message:'must match "'+ae+'" schema'};a===null?a=[pe]:a.push(pe),r++}var w=_===r;H=w,j="else"}if(!H){const _={instancePath:s,schemaPath:"#/else/if",keyword:"if",params:{failingKeyword:j},message:'must match "'+j+'" schema'};a===null?a=[_]:a.push(_),r++}if(t&&typeof t=="object"&&!Array.isArray(t)&&t.sequence!==void 0){const _={instancePath:s+"/sequence",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[_]:a.push(_),r++}var g=D===r;f=g,b="else"}if(!f){const D={instancePath:s,schemaPath:"#/if",keyword:"if",params:{failingKeyword:b},message:'must match "'+b+'" schema'};a===null?a=[D]:a.push(D),r++}if(t&&typeof t=="object"&&!Array.isArray(t)){if(t.version===void 0){const D={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"version"},message:"must have required property 'version'"};a===null?a=[D]:a.push(D),r++}if(t.kind===void 0){const D={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"kind"},message:"must have required property 'kind'"};a===null?a=[D]:a.push(D),r++}if(t.title===void 0){const D={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};a===null?a=[D]:a.push(D),r++}if(t.boxes===void 0){const D={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"boxes"},message:"must have required property 'boxes'"};a===null?a=[D]:a.push(D),r++}if(t.steps===void 0){const D={instancePath:s,schemaPath:"#/required",keyword:"required",params:{missingProperty:"steps"},message:"must have required property 'steps'"};a===null?a=[D]:a.push(D),r++}for(const D in t)if(!_v.call(hd.properties,D)){const z={instancePath:s,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:D},message:"must NOT have additional properties"};a===null?a=[z]:a.push(z),r++}if(t.version!==void 0){let D=t.version;if(!(typeof D=="number"&&!(D%1)&&!isNaN(D)&&isFinite(D))){const z={instancePath:s+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[z]:a.push(z),r++}if(typeof D=="number"&&isFinite(D)&&(D<1||isNaN(D))){const z={instancePath:s+"/version",schemaPath:"#/properties/version/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};a===null?a=[z]:a.push(z),r++}}if(t.kind!==void 0){let D=t.kind;if(!(D==="sequence"||D==="architecture"||D==="state"||D==="git"||D==="time"||D==="tree"||D==="lineup")){const z={instancePath:s+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues:hd.properties.kind.enum},message:"must be equal to one of the allowed values"};a===null?a=[z]:a.push(z),r++}}if(t.title!==void 0){let D=t.title;if(typeof D=="string"){if(xt(D)<1){const z={instancePath:s+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[z]:a.push(z),r++}}else{const z={instancePath:s+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[z]:a.push(z),r++}}if(t.view!==void 0){let D=t.view;if(!(D==="fixed"||D==="follow")){const z={instancePath:s+"/view",schemaPath:"#/properties/view/enum",keyword:"enum",params:{allowedValues:hd.properties.view.enum},message:"must be equal to one of the allowed values"};a===null?a=[z]:a.push(z),r++}}if(t.regions!==void 0){let D=t.regions;if(Array.isArray(D)){const z=D.length;for(let H=0;H<z;H++)gl(D[H],{instancePath:s+"/regions/"+H,parentData:D,parentDataProperty:H,rootData:p})||(a=a===null?gl.errors:a.concat(gl.errors),r=a.length)}else{const z={instancePath:s+"/regions",schemaPath:"#/properties/regions/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[z]:a.push(z),r++}}if(t.boxes!==void 0){let D=t.boxes;if(Array.isArray(D)){const z=D.length;for(let H=0;H<z;H++)yl(D[H],{instancePath:s+"/boxes/"+H,parentData:D,parentDataProperty:H,rootData:p})||(a=a===null?yl.errors:a.concat(yl.errors),r=a.length)}else{const z={instancePath:s+"/boxes",schemaPath:"#/properties/boxes/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[z]:a.push(z),r++}}if(t.strip!==void 0&&(vl(t.strip,{instancePath:s+"/strip",parentData:t,parentDataProperty:"strip",rootData:p})||(a=a===null?vl.errors:a.concat(vl.errors),r=a.length)),t.steps!==void 0){let D=t.steps;if(Array.isArray(D)){if(D.length<1){const H={instancePath:s+"/steps",schemaPath:"#/properties/steps/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[H]:a.push(H),r++}const z=D.length;for(let H=0;H<z;H++)El(D[H],{instancePath:s+"/steps/"+H,parentData:D,parentDataProperty:H,rootData:p})||(a=a===null?El.errors:a.concat(El.errors),r=a.length)}else{const z={instancePath:s+"/steps",schemaPath:"#/properties/steps/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[z]:a.push(z),r++}}t.sequence!==void 0&&(Al(t.sequence,{instancePath:s+"/sequence",parentData:t,parentDataProperty:"sequence",rootData:p})||(a=a===null?Al.errors:a.concat(Al.errors),r=a.length)),t.state!==void 0&&(Sl(t.state,{instancePath:s+"/state",parentData:t,parentDataProperty:"state",rootData:p})||(a=a===null?Sl.errors:a.concat(Sl.errors),r=a.length)),t.git!==void 0&&(Nl(t.git,{instancePath:s+"/git",parentData:t,parentDataProperty:"git",rootData:p})||(a=a===null?Nl.errors:a.concat(Nl.errors),r=a.length)),t.time!==void 0&&(Bl(t.time,{instancePath:s+"/time",parentData:t,parentDataProperty:"time",rootData:p})||(a=a===null?Bl.errors:a.concat(Bl.errors),r=a.length)),t.lineup!==void 0&&(ql(t.lineup,{instancePath:s+"/lineup",parentData:t,parentDataProperty:"lineup",rootData:p})||(a=a===null?ql.errors:a.concat(ql.errors),r=a.length))}else{const D={instancePath:s,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[D]:a.push(D),r++}return I0.errors=a,r===0}var Ql=t=>Object.keys(t),qi=Ql({sequence:!0,architecture:!0,state:!0,git:!0,time:!0,tree:!0,lineup:!0}),Ri=["start","finish"],eg=["scale","period","row","point","zoom","mark","span"],Zl="now",tg=["leaf","node"],ng=["item","line","seal","open","pick","stamp"],Pl=12,i0=4,Sv=["note","color"],Ud=["group","end","box","strip","step","say","code","source","act","note","set","branch","commit",...eg,...tg,...ng],ll="as",ag="on",sg="copy",og="merge",Gd="from",pa="HEAD",ig="at",rg="of",on={diagram:["view"],group:["note","color","icon"],box:["note","color","icon","link"],source:["url"],edge:["carry","tag","side","at","into"],note:["color"],set:["tag"],strip:["meter"],branch:["note"],commit:["hash","note"],leaf:["hash"],node:["hash"],item:["color","label"],scale:["from"],period:["from"],row:["color","empty"],mark:["color"],span:["shape","color"]},$v=["at","into"],zi=["box"],lg=["ms","s","min","h","d"],Yd=Ql({coin:!0,none:!0}),Vd=Ql({fixed:!0,follow:!0}),Xd=Ql({above:!0,below:!0,left:!0,right:!0}),r0={時系列図:"sequence",構成図:"architecture",区画:"group",見せ方:"view",region:"group",view:"view"},us=["blue","amber","green","violet","rose","slate","coin"],Nv=["edge","action","swap","strip","commit","branch","now","mark","span","leaf","node","line","seal","open","pick","stamp"],Dv="#/definitions/absent/not",Tv={regions:"sequence / architecture / state",at:"time",into:"time",color:"time",meters:"time",region:"sequence / architecture / state",icon:"sequence / architecture / state / git / time / tree",link:"sequence / architecture / state / git / time / tree"},Cv={carry:{field:"text",kind:"tag"}},Ov=/\/boxes\/items\/properties\/id\/not$/u,Mv=/\/events\/items\/properties\/type\/not$/u,Bv=["commit","branch"],jv=/\/events\/items\/not$/u,qv=["now","mark","span"],Rv=/\/events\/items\/allOf\/0\/not$/u,zv=["leaf","node"],Fv="#/definitions/notLineupEvent/not",Lv=["line","seal","open","pick","stamp"],Hv="#/definitions/notWiredEvent/not",Pv=["edge","action"],Uv=/^\^\[0-9\]\+\(\\\.\[0-9\]\+\)\?\(([a-z|]+)\)\$$/u,Gv=/%\)\$$/u,md=t=>t.replaceAll("~","~0").replaceAll("/","~1"),Yv="#/definitions/url/pattern",Vv=/^\^\[0-9a-f\]\{(\d+),(\d+)\}\$$/u;function Xv(t){const s=/^\^\[\^(.+)\]\+\$$/u.exec(t)?.[1];if(s===void 0)return;const c=s.match(/\\.|[^\\]/gu)??[];return{space:c.includes("\\s"),chars:c.filter(d=>d!=="\\s").map(d=>d.replace(/^\\/u,""))}}var cg=(t,s)=>s.filter(c=>c!==t&&c.schemaPath.startsWith(`${t.schemaPath}/`)&&(c.instancePath===t.instancePath||c.instancePath.startsWith(`${t.instancePath}/`)));function Jv(t,s,c){const d=t.params,p=t.instancePath;switch(t.keyword){case"additionalProperties":{const a=String(d.additionalProperty);return{pointer:`${p}/${md(a)}`,message:c.additionalProperties(a)}}case"required":{const a=String(d.missingProperty);return{pointer:`${p}/${md(a)}`,message:c.required(a)}}case"not":{if(Ov.test(t.schemaPath))return{pointer:p,message:c.reserved(Ri)};if(Mv.test(t.schemaPath))return{pointer:p,message:c.kindOnly(Bv,"git")};if(jv.test(t.schemaPath))return{pointer:`${p}/type`,message:c.kindOnly(qv,"time")};if(Rv.test(t.schemaPath))return{pointer:`${p}/type`,message:c.kindOnly(zv,"tree")};if(t.schemaPath===Fv)return{pointer:`${p}/type`,message:c.kindOnly(Lv,"lineup")};if(t.schemaPath===Hv)return{pointer:`${p}/type`,message:c.kindOnly(Pv,"sequence / architecture / state / git / time / tree")};const a=p.slice(p.lastIndexOf("/")+1);if(t.schemaPath===Dv)return{pointer:p,message:c.not({field:a,kind:Tv[a]??a})};const r=Cv[a];return{pointer:r?`${p}/${r.field}`:p,message:c.not(r)}}case"anyOf":{const a=cg(t,s),r=a.every(l=>l.keyword==="required")?a.map(l=>String(l.params.missingProperty)):[];return{pointer:p,message:c.anyOf(r)}}case"discriminator":{const a=String(d.tag);return{pointer:`${p}/${md(a)}`,message:c.discriminator(a,Nv)}}case"enum":return{pointer:p,message:c.enum(d.allowedValues.map(String))};case"type":return{pointer:p,message:c.type(String(d.type))};case"minLength":return{pointer:p,message:c.minLength(Number(d.limit))};case"maxLength":return{pointer:p,message:c.maxLength(Number(d.limit))};case"pattern":{if(t.schemaPath===Yv)return{pointer:p,message:c.url};const a=String(d.pattern),r=Vv.exec(a);if(r)return{pointer:p,message:c.hex(Number(r[1]),Number(r[2]))};const l=Uv.exec(a);return l?{pointer:p,message:c.duration((l[1]??"").split("|"))}:Gv.test(a)?{pointer:p,message:c.ratio}:{pointer:p,message:c.pattern(Xv(a))}}case"minItems":return{pointer:p,message:c.minItems(Number(d.limit))};case"maxItems":return{pointer:p,message:c.maxItems(Number(d.limit))};case"minimum":return{pointer:p,message:c.minimum(Number(d.limit))};case"const":return{pointer:p,message:c.const(String(d.allowedValue))};case"oneOf":return{pointer:p,message:c.oneOf};default:return{pointer:p,message:t.message??t.keyword}}}function Qv(t,s={}){if(s0(t))return{ok:!0};const c=s0.errors??[],d=new Set(c.filter(r=>r.keyword==="anyOf").flatMap(r=>cg(r,c))),p=K0[s.lang??"ja"];return{ok:!1,errors:c.filter(r=>r.keyword!=="if"&&!d.has(r)).map(r=>Jv(r,c,p))}}var tn=t=>t.join(" / "),Zv=()=>{const t={sequence:"sequence <題>",architecture:"architecture <題>",group:"group <名札> as <名前> [note: <添え書き>] から end まで",box:"box <名札> as <名前> [note: <下の小さな字>]",strip:"strip <題>: <欄>, <欄>",view:"sequence <題> [view: follow]",step:"step <段の題>",say:"say <段の本文>",code:"code <命令>",act:"act <名札>: <処理の名前>",note:"note <名札>: <下の小さな字>",set:"set <欄>: <値> [tag: <札>]"};return{noHead:`最初の行に図の種類 (${tn(qi)}) と題を書く`,badHead:`最初の行は ${qi.join(" か ")} で始め、続けて題を書く`,oldForm:(s,c)=>`${s} は前の形の書き方。新しい形では ${t[c]} と書く`,unknownHead:s=>`${s} は行の頭に書けない。行は ${tn(Ud)} か、<名札> -> <名札> で始める`,duplicate:s=>`${s} は既に宣言した名札`,needsId:s=>`${s} の後ろに名札を書く`,badId:s=>`${s} は名札に使えない。名札には空白と [ ] 「 」 = : を含めない`,afterId:"名札の後ろには as <名前> か属性を書く",undeclaredBox:s=>`${s} という箱は宣言していない`,noBody:s=>`段「${s}」に本文 (say の行) が要る`,emptyStepTitle:"step の後ろに段の題を書く",noBoxes:"箱を 1 つ以上宣言する",noSteps:"段 (step の行) を 1 つ以上書く",emptySay:"say の後ろか、その下に字下げした行に段の本文を書く",sayTwice:"1 つの段に say は 1 つまで。長い本文は say の下に字下げして続ける",codeTwice:"1 つの段に code は 1 行まで",emptyCode:"code の後ろに命令を書く",sourceShape:"source は source <名前> [url: <URL>] の形で書く",declarationInStep:"group と box と strip と branch と、scale と period と row と point と zoom は最初の step より前に書く",stepLineBeforeStep:"線と say と code と source と act と note と set と commit と枝を切る行と、now と mark と span と、leaf と node の行は step の下に書く",nestedGroup:"group の中に group は書けない。先に end で閉じる",strayEnd:"end の前に、閉じる group が無い",endTakesNothing:"end の後ろには何も書かない",unclosedGroup:s=>`group ${s} を end で閉じていない`,regionReopened:s=>`group ${s} は宣言済み。もう一度開く時は group ${s} だけを書き、名前と属性は最初の宣言に書く`,emptyName:s=>`${s} の名前が空`,stripTwice:"strip は 1 つだけ宣言する",stripShape:"strip は strip <題>: <欄>, <欄> の形で書く",emptyStripField:"strip の欄の名前が空",stripUndeclared:"set を書く前に、strip <題>: <欄>, <欄> で帯を宣言する",noSuchField:s=>`${s} という欄は strip に無い`,stripNeedsValue:"set は set <欄>: <値> か set <欄> [tag: <札>] の形で書く",actShape:"act は act <名札>: <処理の名前> の形で書く",noteShape:"note は note <名札>: <下の小さな字> の形で書く",edgeShape:"線は <名札> -> <名札>: <線の名前> [<属性>] の形で書く",emptyLabel:"線の : の後ろに線の名前を書く。名前を書かない時は : も書かない",quoteUnclosed:'" で始めた字を " で閉じていない',afterQuote:'" で閉じた字の後ろには、属性か次の , だけを書く',attrUnclosed:"属性は [ で始めて ] で閉じ、行の終わりに置く",attrNoColon:s=>`[${s}] は書けない。属性は [<鍵>: <値>] の形で書く`,attrNoValue:s=>`${s}: の後ろに値を書く`,attrTwice:s=>`${s} は 1 つの行に 1 つまで`,badAttr:(s,c)=>`${s} はこの行に書けない属性。書けるのは ${tn(c)}`,badColor:`color は ${tn(us)} のどれか`,badView:`view は ${tn(Vd)} のどれか`,badCarry:`carry は ${tn(Yd)} のどれか。札は tag: <値> で書く`,badSide:`side は ${tn(Xd)} のどれか`,badUrl:s=>`${s} には / で始まる path か、http:// か https:// で始まる URL を書く`,carryTwice:"運ぶ物は 1 本の線に 1 つまで。carry と tag は一緒に書かない",reservedId:s=>`${s} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,intoStart:"start へ入る線は書けない。start は始まりの印で、線は start から出る",outOfFinish:"finish から出る線は書けない。finish は終わりの印で、線は finish へ入る",pathNoAttrs:"最初の step より前の線は今回は通らない道なので、属性 (carry と tag と side) を書けない",gitOnly:s=>`${s} の行は git (枝分かれの図) でだけ書ける`,gitNoGroup:"git (枝分かれの図) には group を書けない。枝は branch の行で宣言する",noBranches:"branch の行で枝を 1 つ以上宣言する",branchShape:"branch は branch <名札> [note: <添え書き>] の形で書く",commitShape:"commit は commit <名札> on <枝> [hash: <hash>, note: <一言>] の形で書く。当て直しは copy <commit> を、取り込みは merge <枝> を on <枝> の後ろに書く",fromShape:"枝を切る行は <枝> from <commit> の形で書く",undeclaredBranch:s=>`${s} という枝は宣言していない`,undeclaredRef:s=>`${s} という枝は宣言していない。札を動かす線は枝の名札か HEAD から引く`,noCommit:s=>`${s} という commit はまだ積んでいない`,emptyBranch:s=>`${s} の枝はまだどの commit も指していないので取り込めない`,mergeSelf:s=>`${s} は積む枝なので、取り込む枝にできない`,headReserved:s=>`${s} は枝分かれの図で今いる場所の札の名前で、名札に使えない`,badHash:"hash は 0 から 9 と a から f の字で 4 から 40 字にする",timeOnly:s=>`${s} は time (時間軸の図) でだけ書ける`,treeOnly:s=>`${s} の行は tree (木の図) でだけ書ける`,treeNoGroup:"tree (木の図) には group を書けない。木の箱は leaf と node の行で書く",noLeaves:"leaf の行で葉を 1 つ以上書く",leafShape:"leaf は leaf <名札> [hash: <hash>] の形で書く",nodeShape:"node は node <名札> of <子>, <子> [hash: <hash>] の形で書く",noTreeChild:s=>`${s} という葉か親はまだ書いていない。子は前に leaf か node で書いた名札にする`,notTreeBox:s=>`${s} は box の行で置いた箱で、木の箱でない。子は leaf か node で書いた名札にする`,twoParents:s=>`${s} はもう別の親の子になっている。木の箱の親は 1 つだけ`,manyRoots:(s,c)=>`${s} が親を持たないまま残る。木の根は 1 つだけで、${s} も ${c} も最後に 1 つの根へ組む`,lineupOnly:s=>`${s} の行は lineup (列の図) でだけ書ける`,lineupNoGroup:"lineup (列の図) には group を書けない。列は box の行で宣言する",lineupNoEdge:"lineup (列の図) には線の行を書けない。チップは line の行で列の並びを書くと動く",lineupNoAct:"lineup (列の図) には act の行を書けない。列の右上の字は note の行で書き換える",noItems:"item の行でチップを 1 つ以上宣言する",itemShape:"item は item <名札>, <名札> [color: <色>, label: <字>] の形で書く",lineShape:"line は line <列>: <チップ>, <チップ> の形で書く",laneShape:s=>`${s} は ${s} <列> の形で書く`,stampShape:"stamp は stamp <列>: <字> の形で書く",labelTooLong:s=>`label は ${s} 字までにする`,noSuchItem:s=>`${s} というチップは宣言していない`,itemTwice:s=>`${s} はこの行に 2 度書いている。同じ列に同じチップは 1 枚だけ`,laneFull:(s,c)=>`${s} の列に並べられるチップは ${c} 枚まで`,lineOnSealed:s=>`${s} の列は封をしているので並びを書けない。先に open で開ける`,sealTwice:s=>`${s} の列にはもう封をしている`,openUnsealed:s=>`${s} の列には封をしていない`,timeTwice:s=>`${s} は 1 つだけ宣言する`,noScale:"scale の行で目盛りを宣言する",noRows:"row の行で印の列を 1 つ以上宣言する",scaleShape:"scale は scale <単位> <長さ> <数> [from: <番号>] の形で書く",periodShape:"period は period <名前> <目盛りの数> [from: <番号>] の形で書く",rowShape:"row は row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>] の形で書く",pointShape:"point は point <名札> at <目盛り> の形で書く",zoomShape:"zoom は zoom <目盛り>-<目盛り> の形で書く",nowShape:"針を進める行は now -> <目盛り> の形で書く",markShape:"mark は mark <列> <目盛り>-<目盛り> [color: <色>] の形で書く",spanShape:`span は span <目盛り>-<目盛り>: <字> [shape: ${tn(zi)}, color: <色>] の形で書く`,badLength:`長さは数と単位 (${tn(lg)}) の組で書く (12s など)`,badCount:s=>`${s} の目盛りの数は 1 以上の整数にする`,badUnit:(s,c)=>`${s} は目盛りの位置にできない。0 から ${c-1} の数か、その範囲 (0-3 など) を書く`,nowBack:(s,c)=>`now -> ${s} は針を進めない。前の now (${c}) より後の目盛りを書く`,outOfZoom:(s,c)=>`拡大の帯の列は ${s} から ${c} の目盛りから選ぶ`,noZoom:"at と into は、zoom で拡大の帯を宣言した図の箱どうしの線にだけ書ける",boxNeedsZoom:"時間軸の図の箱は拡大の帯に置く。zoom <目盛り>-<目盛り> で拡大の範囲を書く",boxLineNeedsAt:"拡大の帯の箱どうしの線には [at: <目盛り>] で列を書く",pointLineNoAt:"節目どうしの線は軸の上に引くので、at と into を書けない",mixedLine:"線は箱どうしか、節目どうしで引く",undeclaredRow:s=>`${s} という印の列は宣言していない`,undeclaredNote:s=>`${s} という箱か節目は宣言していない`,nowReserved:s=>`${s} は時間軸の図で針を進める行の語で、名札に使えない`,noteColorPointOnly:"note の color は節目の丸の色で、節目の note にだけ書ける",badShape:`shape は ${tn(zi)} だけ書ける。括弧は shape を書かない`,badRatio:"物差しの線は分数 (2/3) か百分率 (97%) で書く",meterValue:s=>`${s} は物差しの欄なので、値を分数 (2/3) か百分率 (97%) で書く`}},Kv=()=>{const t={sequence:"sequence <title>",architecture:"architecture <title>",group:"group <id> as <name> [note: <note>] through end",box:"box <id> as <name> [note: <caption>]",strip:"strip <title>: <field>, <field>",view:"sequence <title> [view: follow]",step:"step <step title>",say:"say <step body>",code:"code <command>",act:"act <id>: <action>",note:"note <id>: <caption>",set:"set <field>: <value> [tag: <tag>]"};return{noHead:`Write the diagram kind (${tn(qi)}) and a title on the first line`,badHead:`Start the first line with ${qi.join(" or ")}, followed by the title`,oldForm:(s,c)=>`${s} is the old notation. Write ${t[c]} instead`,unknownHead:s=>`A line cannot start with ${s}. Start a line with ${tn(Ud)}, or <id> -> <id>`,duplicate:s=>`${s} is already declared`,needsId:s=>`Write an id after ${s}`,badId:s=>`${s} cannot be an id. An id has no spaces and none of [ ] 「 」 = :`,afterId:"Write as <name> or attributes after the id",undeclaredBox:s=>`No box named ${s} is declared`,noBody:s=>`Step "${s}" needs a body (a say line)`,emptyStepTitle:"Write a title after step",noBoxes:"Declare at least one box",noSteps:"Write at least one step (a step line)",emptySay:"Write the step body after say, or on indented lines below it",sayTwice:"A step takes one say. Continue a long body on indented lines below it",codeTwice:"A step takes at most one code line",emptyCode:"Write the command after code",sourceShape:"Write a source as source <name> [url: <URL>]",declarationInStep:"Write group, box, strip, branch, scale, period, row, point and zoom before the first step",stepLineBeforeStep:"Write lines, say, code, source, act, note, set, commit, branch cuts, now, mark, span, leaf and node under a step",nestedGroup:"A group cannot hold another group. Close it with end first",strayEnd:"There is no group for this end to close",endTakesNothing:"Write nothing after end",unclosedGroup:s=>`group ${s} is not closed with end`,regionReopened:s=>`group ${s} is already declared. To open it again, write only group ${s}; put the name and attributes on the first one`,emptyName:s=>`${s} has an empty name`,stripTwice:"Declare only one strip",stripShape:"Write a strip as strip <title>: <field>, <field>",emptyStripField:"A strip field name is empty",stripUndeclared:"Declare the strip as strip <title>: <field>, <field> before writing set",noSuchField:s=>`The strip has no field named ${s}`,stripNeedsValue:"Write set as set <field>: <value> or set <field> [tag: <tag>]",actShape:"Write act as act <id>: <action>",noteShape:"Write note as note <id>: <caption>",edgeShape:"Write a line as <id> -> <id>: <label> [<attributes>]",emptyLabel:"Write the label after the : of a line, or leave out the : as well",quoteUnclosed:'A value that starts with " is not closed with "',afterQuote:'After a value closed with ", write only attributes or the next ,',attrUnclosed:"Start attributes with [, close them with ], and put them at the end of the line",attrNoColon:s=>`[${s}] cannot be read. Write an attribute as [<key>: <value>]`,attrNoValue:s=>`Write a value after ${s}:`,attrTwice:s=>`Write ${s} only once on a line`,badAttr:(s,c)=>`${s} cannot be written on this line. Write ${tn(c)}`,badColor:`color is one of ${tn(us)}`,badView:`view is one of ${tn(Vd)}`,badCarry:`carry is one of ${tn(Yd)}. Write a tag as tag: <value>`,badSide:`side is one of ${tn(Xd)}`,badUrl:s=>`Write a path that starts with / or a URL that starts with http:// or https:// for ${s}`,carryTwice:"A line carries one thing. Do not write carry and tag together",reservedId:s=>`${s} names the start or end mark of a state diagram and cannot be a box id`,intoStart:"A line cannot go into start. start is the start mark, and lines leave it",outOfFinish:"A line cannot leave finish. finish is the end mark, and lines go into it",pathNoAttrs:"A line before the first step is a path not taken, so it takes no attributes (carry, tag, side)",gitOnly:s=>`${s} lines can be written only in git diagrams`,gitNoGroup:"A git diagram takes no group. Declare branches with branch lines",noBranches:"Declare at least one branch with a branch line",branchShape:"Write a branch as branch <id> [note: <note>]",commitShape:"Write a commit as commit <id> on <branch> [hash: <hash>, note: <note>]. For a replayed commit add copy <commit>, and for a merge commit add merge <branch>, after on <branch>",fromShape:"Write a branch cut as <branch> from <commit>",undeclaredBranch:s=>`No branch named ${s} is declared`,undeclaredRef:s=>`No branch named ${s} is declared. A line that moves a ref starts from a branch id or HEAD`,noCommit:s=>`No commit named ${s} has been made yet`,emptyBranch:s=>`Branch ${s} does not point at any commit yet, so it cannot be merged`,mergeSelf:s=>`${s} is the branch being committed to, so it cannot be the branch merged in`,headReserved:s=>`${s} names where you are in a git diagram and cannot be an id`,badHash:"Write a hash as 4 to 40 characters of 0-9 and a-f",timeOnly:s=>`${s} can be written only in time diagrams`,treeOnly:s=>`${s} lines can be written only in tree diagrams`,treeNoGroup:"A tree diagram takes no group. Write the tree boxes with leaf and node lines",noLeaves:"Write at least one leaf with a leaf line",leafShape:"Write a leaf as leaf <id> [hash: <hash>]",nodeShape:"Write a node as node <id> of <child>, <child> [hash: <hash>]",noTreeChild:s=>`No leaf or node named ${s} has been written yet. A child must be an id written earlier with leaf or node`,notTreeBox:s=>`${s} is a box from a box line, not a tree box. A child must be an id written with leaf or node`,twoParents:s=>`${s} is already a child of another node. A tree box has only one parent`,manyRoots:(s,c)=>`${s} is left without a parent. A tree has one root, so join ${s} and ${c} under one root by the end`,lineupOnly:s=>`${s} lines can be written only in lineup diagrams`,lineupNoGroup:"A lineup diagram takes no group. Declare the lanes with box lines",lineupNoEdge:"A lineup diagram takes no edge lines. Chips move when a line line rewrites a lane",lineupNoAct:"A lineup diagram takes no act lines. Rewrite the text at the top right of a lane with a note line",noItems:"Declare at least one chip with an item line",itemShape:"Write an item as item <id>, <id> [color: <color>, label: <text>]",lineShape:"Write a line as line <lane>: <chip>, <chip>",laneShape:s=>`Write ${s} as ${s} <lane>`,stampShape:"Write a stamp as stamp <lane>: <text>",labelTooLong:s=>`A label is at most ${s} characters`,noSuchItem:s=>`The chip ${s} is not declared`,itemTwice:s=>`${s} is written twice on this line. A lane holds one of each chip`,laneFull:(s,c)=>`The lane ${s} holds at most ${c} chips`,lineOnSealed:s=>`The lane ${s} is sealed, so its order cannot be written. Open it first`,sealTwice:s=>`The lane ${s} is already sealed`,openUnsealed:s=>`The lane ${s} is not sealed`,timeTwice:s=>`Declare only one ${s}`,noScale:"Declare the scale with a scale line",noRows:"Declare at least one row with a row line",scaleShape:"Write a scale as scale <unit> <length> <count> [from: <number>]",periodShape:"Write a period as period <name> <units> [from: <number>]",rowShape:"Write a row as row <id> as <name> [color: <color>, empty: <unit> <unit>]",pointShape:"Write a point as point <id> at <unit>",zoomShape:"Write a zoom as zoom <unit>-<unit>",nowShape:"Write a needle line as now -> <unit>",markShape:"Write a mark as mark <row> <unit>-<unit> [color: <color>]",spanShape:`Write a span as span <unit>-<unit>: <text> [shape: ${tn(zi)}, color: <color>]`,badLength:`Write a length as a number and a unit (${tn(lg)}), such as 12s`,badCount:s=>`The unit count of ${s} is a whole number of 1 or more`,badUnit:(s,c)=>`${s} cannot be a unit. Write a number from 0 to ${c-1}, or a range such as 0-3`,nowBack:(s,c)=>`now -> ${s} does not move the needle forward. Write a unit after the previous now (${c})`,outOfZoom:(s,c)=>`Pick a zoom column from units ${s} to ${c}`,noZoom:"at and into are allowed only on lines between boxes in a diagram that declares a zoom",boxNeedsZoom:"Boxes of a time diagram sit in the zoom band. Write the zoom range as zoom <unit>-<unit>",boxLineNeedsAt:"Write the column of a line between zoom boxes as [at: <unit>]",pointLineNoAt:"A line between points runs along the axis, so it takes no at or into",mixedLine:"Draw a line between two boxes or between two points",undeclaredRow:s=>`No row named ${s} is declared`,undeclaredNote:s=>`No box or point named ${s} is declared`,nowReserved:s=>`${s} starts the needle line of a time diagram and cannot be an id`,noteColorPointOnly:"The color of a note colors the circle of a point, so write it only on the note of a point",badShape:`shape takes only ${tn(zi)}. A bracket takes no shape`,badRatio:"Write the meter line as a fraction (2/3) or a percentage (97%)",meterValue:s=>`${s} is a meter, so write its value as a fraction (2/3) or a percentage (97%)`}},Wv={ja:Zv(),en:Kv()},Iv=t=>Wv[t],l0=t=>t.text===""||t.text.startsWith("//");function e1(t,s){return t.column+Array.from(t.text.slice(0,s)).length}function t1(t){return t.split(/\r?\n/).map((s,c)=>{const d=Array.from(s.slice(0,s.length-s.trimStart().length)).length;return{line:c+1,column:d+1,indent:d,text:s.trim()}})}var Kl=1;function n1(t){if(typeof t!="object"||t===null)return;const s=t.version;return typeof s=="number"&&s>Kl?s:void 0}var a1=(t,s)=>({pointer:"/version",message:K0[s].newer(t,Kl)});function Pi(t,s={}){const c=n1(t);if(c!==void 0)return{ok:!1,errors:[a1(c,s.lang??"ja")]};const d=Qv(t,s);return d.ok?{ok:!0,diagram:t,warnings:[]}:d}var Jd=class extends Error{constructor(t,s,c){super(c),this.line=t,this.column=s}line;column},de=(t,s,c)=>new Jd(t.line,e1(t,s),c),Rs=/^[^\s[\]「」=:]+$/u,s1=/^([^\s:[\]]+?)\s*->\s*([^\s:[\]]+)/du,o1=new RegExp(`^commit\\s+([^\\s[]+)(?:\\s+${ag}\\s+([^\\s[]+))?(?:\\s+${sg}\\s+([^\\s[]+))?(?:\\s+${og}\\s+([^\\s[]+))?`,"du"),i1=new RegExp(`^([^\\s[]+)\\s+${Gd}(?:\\s+([^\\s[]+))?\\s*$`,"du"),r1=/^leaf\s+([^\s[]+)/du,l1=new RegExp(`^node\\s+([^\\s[]+)\\s+${rg}\\s+`,"du"),c1=/^line\s+([^\s:[]+)\s*:/du,u1=/^stamp\s+([^\s:[]+)\s*:/du,d1=/^(?:seal|open|pick)\s+(\S+)\s*$/du,c0=/^[0-9a-f]{4,40}$/u,p1=/^(\/|https?:\/\/)/u,h1=/^scale\s+(\S+)\s+(\S+)\s+([^\s[]+)/du,f1=/^period\s+(\S+)\s+([^\s[]+)/du,m1=new RegExp(`^point\\s+(\\S+)\\s+${ig}\\s+(\\S+)\\s*$`,"du"),g1=/^zoom\s+(\S+)\s*$/du,y1=new RegExp(`^${Zl}\\s*->`,"u"),b1=new RegExp(`^${Zl}\\s*->\\s*(\\S+)\\s*$`,"du"),v1=/^mark\s+([^\s[]+)\s+([^\s[]+)/du,x1=/^span\s+([^\s:[]+)\s*:/du,w1=/^[0-9]+(\.[0-9]+)?(ms|s|min|h|d)$/u,u0=/^([0-9]+\/[0-9]+|[0-9]+(\.[0-9]+)?%)$/u,d0=/^[1-9][0-9]*$/u,gd=/^(0|[1-9][0-9]*)$/u,k1=/^(0|[1-9][0-9]*)(?:-(0|[1-9][0-9]*))?$/u,vn=(t,s)=>t.includes(s);function Lt(t,s){let c=s;for(;c<t.length&&/\s/u.test(t[c]??"");)c++;return c}function Do(t,s,c){const d=t.text;let p="";for(let a=s+1;a<d.length;a++){const r=d[a]??"",l=d[a+1]??"";if(r==="\\"&&(l==='"'||l==="\\"))p+=l,a++;else{if(r==='"')return{value:p,end:a+1};p+=r}}throw de(t,s,c.quoteUnclosed)}function cs(t,s,c){const d=t.text,p=Lt(d,s);if(d[p]==='"'){const l=Do(t,p,c),f=Lt(d,l.end);if(f<d.length&&d[f]!=="[")throw de(t,f,c.afterQuote);return{value:l.value,rest:f}}const a=d.indexOf("[",p),r=a<0?d.length:a;return{value:d.slice(p,r).trim(),rest:r}}function zn(t,s,c,d){const p=t.text;if(!p.endsWith("]"))throw de(t,s,d.attrUnclosed);const a=p.length-1,r=new Map;for(let l=s+1;;){const f=Lt(p,l);let u=f;for(;u<a&&p[u]!==":"&&p[u]!==",";)u++;if(u>=a||p[u]!==":")throw de(t,f,d.attrNoColon(p.slice(f,u).trim()));const g=p.slice(f,u).trim();if(!c.includes(g))throw de(t,f,d.badAttr(g,c));if(r.has(g))throw de(t,f,d.attrTwice(g));let b=Lt(p,u+1),w;if(p[b]==='"'){const v=Do(t,b,d);if(w=v.value,b=Lt(p,v.end),b<a&&p[b]!==",")throw de(t,b,d.afterQuote)}else{const v=p.indexOf(",",b),A=v<0||v>a?a:v;w=p.slice(b,A).trim(),b=A}if(w==="")throw de(t,f,d.attrNoValue(g));if(r.set(g,{value:w,at:f}),b>=a)return r;l=b+1}}function E1(t,s,c){const d=t.text,p=[];for(let a=s;;){const r=Lt(d,a);let l,f;if(d[r]==='"'){const u=Do(t,r,c);if(l=u.value,f=Lt(d,u.end),f<d.length&&d[f]!==",")throw de(t,f,c.afterQuote)}else{const u=d.indexOf(",",r);f=u<0?d.length:u,l=d.slice(r,f).trim()}if(l==="")throw de(t,r,c.emptyStripField);if(p.push(l),f>=d.length)return p;a=f+1}}function cl(t,s,c,d){const p=t.text,a=Lt(p,s.length),r=/^[^\s[]+/u.exec(p.slice(a))?.[0];if(r===void 0)throw de(t,0,d.needsId(s));if(!Rs.test(r))throw de(t,a,d.badId(r));let l=Lt(p,a+r.length),f;if(p.startsWith(ll,l)&&/^(\s|$)/u.test(p.slice(l+ll.length,l+ll.length+1))){const g=cs(t,l+ll.length,d);if(g.value==="")throw de(t,l,d.emptyName(r));f=g.value,l=g.rest}if(l<p.length&&p[l]!=="[")throw de(t,l,d.afterId);const u=l<p.length?zn(t,l,c,d):new Map;return{id:r,idAt:a,...f!==void 0?{name:f}:{},attrs:u}}function p0(t,s,c){const d=s.get("color");if(d&&!vn(us,d.value))throw de(t,d.at,c.badColor);const p=s.get("note")?.value,a=s.get("icon")?.value;return{...p!==void 0?{note:p}:{},...d?{color:d.value}:{},...a!==void 0?{icon:a}:{}}}function h0(t,s){const c=t.split(/\s/u)[0]??"";if(c==="帯")return{word:c,shape:s?"set":"strip"};if(Object.hasOwn(r0,c))return{word:c,shape:r0[c]};if(t.startsWith("#"))return{word:"#",shape:"step"};if(t.startsWith(">"))return{word:">",shape:"say"};if(t.startsWith("`"))return{word:"`",shape:"code"};if(t.includes("「"))return{word:"「」",shape:s?"note":"box"};if(/^[^\s=:]+\s*=(?!>)/u.test(t))return{word:"=",shape:"box"};if(s&&/^[^\s:]+\s*:/u.test(t))return{word:":",shape:"act"}}function A1(t,s){const c=t.findIndex(O=>!l0(O)),d=t[c];if(!d)throw new Jd(1,1,s.noHead);const p=d.text.split(/\s/u)[0]??"";if(!vn(qi,p)){const O=h0(d.text,!1);throw de(d,0,O?s.oldForm(O.word,O.shape):s.badHead)}const a=cs(d,p.length,s);if(a.value==="")throw de(d,0,s.badHead);const r=a.value,l=a.rest<d.text.length?zn(d,a.rest,on.diagram,s).get("view"):void 0;if(l&&!vn(Vd,l.value))throw de(d,l.at,s.badView);const f=l?.value,u=p==="state",g=p==="git",b=p==="time",w=p==="tree",v=p==="lineup",A=[],N=new Set,S=new Map,M=new Map;let D,z;const H=[],Z=[];let j;const R=[],_=[];let P=!1,B,ne=0;const ae=[],fe=new Set,pe=new Map,Ae=[],C=[],$=[],V=new Set;let X;const ie=[];let T,G;const re=(O,q,ee)=>{if(V.has(q))throw de(O,ee,s.duplicate(q));V.add(q)},Y=(O,q,ee)=>{if(!C.some(me=>me.id===q))throw de(O,ee,s.undeclaredBox(q));return q},xe=(O,q,ee)=>{if(!pe.has(q))throw de(O,ee,s.undeclaredBranch(q));return q},ke=(O,q,ee)=>{if(!fe.has(q))throw de(O,ee,s.noCommit(q));return q},ze=(O,q,ee,me)=>{if(g){if(me==="to")return ke(O,q,ee);if(q!==pa&&!pe.has(q))throw de(O,ee,s.undeclaredRef(q));return q}if(b){if(!C.some(le=>le.id===q)&&!Z.some(le=>le.id===q))throw de(O,ee,s.undeclaredNote(q));return q}if(w&&S.has(q))return q;if(!u||!vn(Ri,q))return Y(O,q,ee);if(q==="start"!=(me==="from"))throw de(O,ee,q==="start"?s.intoStart:s.outOfFinish);return q},Fe=(O,q,ee)=>{if(u&&vn(Ri,q))throw de(O,ee,s.reservedId(q));if(g&&q===pa)throw de(O,ee,s.headReserved(q));if(b&&q===Zl)throw de(O,ee,s.nowReserved(q))},Re=O=>{if(!T)throw de(O,0,s.stepLineBeforeStep);return T},Qe=O=>{if(T)throw de(O,0,s.declarationInStep)},K=()=>{if(T){if(T.body===void 0)throw de(T.source,0,s.noBody(T.title));ie.push({title:T.title,body:T.body.join(`
`),...T.code!==void 0?{code:T.code}:{},...T.sources.length>0?{sources:T.sources}:{},events:T.events})}},U=t.slice(c+1);for(let O=0;O<U.length;O++){const q=U[O];if(!q||l0(q))continue;const ee=q.text;if(b&&y1.test(ee)){Re(q).events.push(St(q));continue}const me=s1.exec(ee);if(me){if(v)throw de(q,0,s.lineupNoEdge);u&&!T?$.push(Vi(q,me)):Re(q).events.push(Xi(q,me));continue}const[le="",Ee]=ee.split(/\s+/u);if(g&&pe.has(le)&&Ee===Gd){Re(q).events.push(L(q));continue}if(!g&&(le==="branch"||le==="commit"))throw de(q,0,s.gitOnly(le));if(!b&&vn(eg,le))throw de(q,0,s.timeOnly(le));if(!w&&vn(tg,le))throw de(q,0,s.treeOnly(le));if(!v&&vn(ng,le))throw de(q,0,s.lineupOnly(le));if(!vn(Ud,le)){const $e=h0(ee,T!==void 0);throw de(q,0,$e?s.oldForm($e.word,$e.shape):s.unknownHead(le))}switch(le){case"group":nn(q);break;case"end":if(ee!==le)throw de(q,le.length,s.endTakesNothing);if(!G)throw de(q,0,s.strayEnd);G=void 0;break;case"box":ln(q);break;case"strip":Hn(q);break;case"step":{if(G)throw de(G.source,0,s.unclosedGroup(G.id));te(),K();const $e=ee.slice(le.length).trim();if($e==="")throw de(q,0,s.emptyStepTitle);T={source:q,title:$e,sources:[],events:[]};break}case"say":O=En(q,O);break;case"code":{const $e=Re(q);if($e.code!==void 0)throw de(q,0,s.codeTwice);const Ce=ee.slice(le.length).trim();if(Ce==="")throw de(q,0,s.emptyCode);$e.code=Ce;break}case"source":Re(q).sources.push(Ln(q));break;case"act":{if(v)throw de(q,0,s.lineupNoAct);const $e=Re(q),Ce=ea(q,le,s.actShape);$e.events.push({type:"action",box:Ce.box,label:Ce.text});break}case"note":{const $e=Re(q);if(b){$e.events.push(Vt(q));break}const Ce=ea(q,le,s.noteShape);$e.events.push({type:"swap",box:Ce.box,text:Ce.text});break}case"set":Re(q).events.push(zo(q));break;case"branch":Xt(q);break;case"commit":{Re(q).events.push(wn(q));break}case"scale":De(q);break;case"period":Te(q);break;case"row":je(q);break;case"point":Le(q);break;case"zoom":st(q);break;case"mark":Re(q).events.push(Pt(q));break;case"span":Re(q).events.push(lt(q));break;case"leaf":{Re(q).events.push(ye(q));break}case"node":{Re(q).events.push(Oe(q));break}case"item":tt(q);break;case"line":{Re(q).events.push(Ht(q));break}case"seal":case"open":case"pick":{Re(q).events.push(bt(q,le));break}case"stamp":{Re(q).events.push(zt(q));break}}}if(G)throw de(G.source,0,s.unclosedGroup(G.id));if(te(),K(),g&&ae.length===0)throw de(d,0,s.noBranches);if(w&&S.size===0)throw de(d,0,s.noLeaves);if(v&&A.length===0)throw de(d,0,s.noItems);if(C.length===0&&!g&&!b&&!w)throw de(d,0,s.noBoxes);if(ie.length===0)throw de(d,0,s.noSteps);const Ne=[...S.keys()].filter(O=>!M.has(O)),[F,be]=Ne,k=be===void 0?void 0:S.get(be);if(F!==void 0&&be!==void 0&&k)throw de(k.source,k.at,s.manyRoots(be,F));return{version:Kl,kind:p,title:r,...f?{view:f}:{},...Ae.length>0?{regions:Ae}:{},boxes:C,...X?{strip:R.length>0?{...X,meters:R}:X}:{},steps:ie,...p==="sequence"?{sequence:{lifelines:C.map(O=>O.id)}}:{},...$.length>0?{state:{paths:$}}:{},...g?{git:{branches:ae}}:{},...v?{lineup:{items:A}}:{},...b&&D?{time:{scale:D,...z?{period:z}:{},rows:H,...Z.length>0?{points:Z}:{},...j?{zoom:j}:{}}}:{}};function te(){if(!(!b||P)){if(P=!0,!D)throw de(d,0,s.noScale);if(H.length===0)throw de(d,0,s.noRows);for(const O of _)O();if(B&&!j)throw de(B,0,s.boxNeedsZoom)}}function W(){return D?.count??0}function we(O,q,ee){if(!gd.test(ee)||Number(ee)>=W())throw de(O,q,s.badUnit(ee,W()));return Number(ee)}function Be(O,q,ee){const me=k1.exec(ee),le=Number(me?.[1]),Ee=Number(me?.[2]??me?.[1]);if(!me||le>Ee||Ee>=W())throw de(O,q,s.badUnit(ee,W()));return{from:le,to:Ee}}function De(O){if(Qe(O),D)throw de(O,0,s.timeTwice("scale"));const q=O.text,ee=h1.exec(q),me=Ge=>ee?.indices?.[Ge]?.[0]??0;if(!ee)throw de(O,0,s.scaleShape);const le=Lt(q,ee[0].length);if(le<q.length&&q[le]!=="[")throw de(O,le,s.scaleShape);const Ee=ee[2]??"";if(!w1.test(Ee))throw de(O,me(2),s.badLength);const $e=ee[3]??"";if(!d0.test($e))throw de(O,me(3),s.badCount("scale"));const Ce=le<q.length?zn(O,le,on.scale,s).get("from"):void 0;if(Ce&&!gd.test(Ce.value))throw de(O,Ce.at,s.scaleShape);D={unit:ee[1]??"",length:Ee,count:Number($e),...Ce?{from:Number(Ce.value)}:{}}}function Te(O){if(Qe(O),z)throw de(O,0,s.timeTwice("period"));const q=O.text,ee=f1.exec(q);if(!ee)throw de(O,0,s.periodShape);const me=Lt(q,ee[0].length);if(me<q.length&&q[me]!=="[")throw de(O,me,s.periodShape);const le=ee[2]??"";if(!d0.test(le))throw de(O,ee.indices?.[2]?.[0]??0,s.badCount("period"));const Ee=me<q.length?zn(O,me,on.period,s).get("from"):void 0;if(Ee&&!gd.test(Ee.value))throw de(O,Ee.at,s.periodShape);z={name:ee[1]??"",length:Number(le),...Ee?{from:Number(Ee.value)}:{}}}function je(O){Qe(O);const q=cl(O,"row",on.row,s);if(Fe(O,q.id,q.idAt),H.some(Ee=>Ee.id===q.id)||Z.some(Ee=>Ee.id===q.id))throw de(O,q.idAt,s.duplicate(q.id));const ee=q.attrs.get("color");if(ee&&!vn(us,ee.value))throw de(O,ee.at,s.badColor);const me=q.attrs.get("empty"),le={id:q.id,name:q.name??q.id,...ee?{color:ee.value}:{}};if(H.push(le),me){const Ee=me.value.split(/\s+/u);le.empty=[],_.push(()=>{le.empty=Ee.map($e=>we(O,me.at,$e))})}}function Le(O){Qe(O);const q=m1.exec(O.text),ee=q?.[1],me=q?.[2];if(!q||ee===void 0||me===void 0)throw de(O,0,s.pointShape);const le=q.indices?.[1]?.[0]??0,Ee=q.indices?.[2]?.[0]??0;if(!Rs.test(ee))throw de(O,le,s.badId(ee));if(Fe(O,ee,le),H.some(Ce=>Ce.id===ee))throw de(O,le,s.duplicate(ee));re(O,ee,le);const $e={id:ee,at:0};Z.push($e),_.push(()=>{$e.at=we(O,Ee,me)})}function st(O){if(Qe(O),j)throw de(O,0,s.timeTwice("zoom"));const q=g1.exec(O.text),ee=q?.[1];if(!q||ee===void 0)throw de(O,0,s.zoomShape);const me=q.indices?.[1]?.[0]??0,le={from:0,to:0};j=le,_.push(()=>{Object.assign(le,Be(O,me,ee))})}function St(O){const q=b1.exec(O.text),ee=q?.[1];if(!q||ee===void 0)throw de(O,0,s.nowShape);const me=q.indices?.[1]?.[0]??0,le=we(O,me,ee);if(le+1<=ne)throw de(O,me,s.nowBack(ee,ne-1));return ne=le+1,{type:"now",to:le}}function Pt(O){const q=O.text,ee=v1.exec(q),me=ee?.[1],le=ee?.[2];if(!ee||me===void 0||le===void 0)throw de(O,0,s.markShape);if(!H.some(rt=>rt.id===me))throw de(O,ee.indices?.[1]?.[0]??0,s.undeclaredRow(me));const{from:Ee,to:$e}=Be(O,ee.indices?.[2]?.[0]??0,le),Ce=Lt(q,ee[0].length);if(Ce>=q.length||q[Ce]!=="[")throw de(O,Ce,s.markShape);const Ge=zn(O,Ce,on.mark,s).get("color");if(!Ge)throw de(O,Ce,s.markShape);if(!vn(us,Ge.value))throw de(O,Ge.at,s.badColor);return{type:"mark",row:me,from:Ee,to:$e,color:Ge.value}}function lt(O){const q=x1.exec(O.text),ee=q?.[1];if(!q||ee===void 0)throw de(O,0,s.spanShape);const{from:me,to:le}=Be(O,q.indices?.[1]?.[0]??0,ee),Ee=cs(O,q[0].length,s);if(Ee.value==="")throw de(O,0,s.spanShape);const $e=Ee.rest<O.text.length?zn(O,Ee.rest,on.span,s):new Map,Ce=$e.get("shape");if(Ce&&!vn(zi,Ce.value))throw de(O,Ce.at,s.badShape);const Ge=$e.get("color");if(Ge&&!vn(us,Ge.value))throw de(O,Ge.at,s.badColor);return{type:"span",from:me,to:le,text:Ee.value,...Ce?{shape:"box"}:{},...Ge?{color:Ge.value}:{}}}function Vt(O){const q=/^note\s+([^\s:]+)\s*:/du.exec(O.text),ee=q?.[1];if(!q||ee===void 0)throw de(O,0,s.noteShape);const me=q.indices?.[1]?.[0]??0,le=Z.some(Ce=>Ce.id===ee);if(!le&&!C.some(Ce=>Ce.id===ee))throw de(O,me,s.undeclaredNote(ee));const Ee=cs(O,q[0].length,s);if(Ee.value==="")throw de(O,0,s.noteShape);const $e=Ee.rest<O.text.length?zn(O,Ee.rest,on.note,s).get("color"):void 0;if($e&&!le)throw de(O,$e.at,s.noteColorPointOnly);if($e&&!vn(us,$e.value))throw de(O,$e.at,s.badColor);return{type:"swap",box:ee,text:Ee.value,...$e?{color:$e.value}:{}}}function nn(O){if(Qe(O),g)throw de(O,0,s.gitNoGroup);if(w)throw de(O,0,s.treeNoGroup);if(v)throw de(O,0,s.lineupNoGroup);if(G)throw de(O,0,s.nestedGroup);const q=cl(O,"group",on.group,s);if(Ae.some(ee=>ee.id===q.id)){if(q.name!==void 0||q.attrs.size>0)throw de(O,0,s.regionReopened(q.id))}else Fe(O,q.id,q.idAt),re(O,q.id,q.idAt),Ae.push({id:q.id,name:q.name??q.id,...p0(O,q.attrs,s)});G={source:O,id:q.id}}function ln(O){Qe(O);const q=cl(O,"box",v?Sv:on.box,s);Fe(O,q.id,q.idAt),re(O,q.id,q.idAt),B??=O;const{note:ee,...me}=p0(O,q.attrs,s),le=q.attrs.get("link");C.push({id:q.id,name:q.name??q.id,...ee!==void 0?{sub:ee}:{},...me,...G?{region:G.id}:{},...le?{link:cn(O,"link",le)}:{}})}function Ln(O){const q=cs(O,6,s),ee=q.rest<O.text.length?zn(O,q.rest,on.source,s).get("url"):void 0;if(q.value===""||!ee)throw de(O,0,s.sourceShape);return{name:q.value,url:cn(O,"url",ee)}}function cn(O,q,ee){if(!p1.test(ee.value))throw de(O,ee.at,s.badUrl(q));return ee.value}function Xt(O){Qe(O);const q=cl(O,"branch",on.branch,s);if(q.name!==void 0)throw de(O,0,s.branchShape);Fe(O,q.id,q.idAt),re(O,q.id,q.idAt);const ee=q.attrs.get("note")?.value;ae.push({id:q.id,...ee!==void 0?{note:ee}:{}}),pe.set(q.id,null)}function wn(O){const q=O.text,ee=o1.exec(q),me=za=>ee?.indices?.[za]?.[0]??0,le=ee?.[1],Ee=ee?.[2];if(!ee||le===void 0||Ee===void 0)throw de(O,0,s.commitShape);const $e=Lt(q,ee[0].length);if($e<q.length&&q[$e]!=="[")throw de(O,$e,s.commitShape);if(!Rs.test(le))throw de(O,me(1),s.badId(le));Fe(O,le,me(1)),re(O,le,me(1));const Ce=xe(O,Ee,me(2)),Ge=ee[3]===void 0?void 0:ke(O,ee[3],me(3)),rt=ee[4]===void 0?void 0:hn(O,ee[4],me(4),Ce),Mt=$e<q.length?zn(O,$e,on.commit,s):new Map,Bt=Mt.get("hash");if(Bt&&!c0.test(Bt.value))throw de(O,Bt.at,s.badHash);const an=Mt.get("note")?.value;return fe.add(le),Ge===void 0&&pe.set(Ce,le),{type:"commit",id:le,branch:Ce,...Ge!==void 0?{copy:Ge}:{},...rt!==void 0?{merge:rt}:{},...Bt?{hash:Bt.value}:{},...an!==void 0?{note:an}:{}}}function hn(O,q,ee,me){if(xe(O,q,ee),q===me)throw de(O,ee,s.mergeSelf(q));if(pe.get(q)===null)throw de(O,ee,s.emptyBranch(q));return q}function L(O){const q=i1.exec(O.text),ee=q?.[1],me=q?.[2];if(!q||ee===void 0||me===void 0)throw de(O,0,s.fromShape);return ke(O,me,q.indices?.[2]?.[0]??0),pe.set(ee,me),{type:"branch",branch:ee,from:me}}function ye(O){const q=O.text,ee=r1.exec(q),me=ee?.[1];if(!ee||me===void 0)throw de(O,0,s.leafShape);const le=ee.indices?.[1]?.[0]??0;if(!Rs.test(me))throw de(O,le,s.badId(me));re(O,me,le),S.set(me,{source:O,at:le});const Ee=Lt(q,ee[0].length);if(Ee<q.length&&q[Ee]!=="[")throw de(O,Ee,s.leafShape);const $e=Ke(O,Ee,on.leaf);return{type:"leaf",id:me,...$e!==void 0?{hash:$e}:{}}}function Oe(O){const q=O.text,ee=l1.exec(q),me=ee?.[1];if(!ee||me===void 0)throw de(O,0,s.nodeShape);const le=ee.indices?.[1]?.[0]??0;if(!Rs.test(me))throw de(O,le,s.badId(me));re(O,me,le);const Ee=[];let $e=ee[0].length;for(;;){const Ge=Lt(q,$e);for($e=Ge;$e<q.length&&q[$e]!==","&&q[$e]!=="[";)$e++;const rt=q.slice(Ge,$e).trim();if(rt===""||!Rs.test(rt))throw de(O,Ge,s.nodeShape);if(!S.has(rt))throw de(O,Ge,V.has(rt)&&rt!==me?s.notTreeBox(rt):s.noTreeChild(rt));if(M.has(rt))throw de(O,Ge,s.twoParents(rt));if(M.set(rt,me),Ee.push(rt),q[$e]!==",")break;$e++}const Ce=Ke(O,$e,on.node);return S.set(me,{source:O,at:le}),{type:"node",id:me,children:Ee,...Ce!==void 0?{hash:Ce}:{}}}function Ke(O,q,ee){if(q>=O.text.length)return;const me=zn(O,q,ee,s).get("hash");if(me&&!c0.test(me.value))throw de(O,me.at,s.badHash);return me?.value}function Ve(O,q,ee,me){const le=O.text,Ee=[];for(let $e=q;;){const Ce=Lt(le,$e),Ge=le.indexOf(",",Ce),rt=Ge<0||Ge>ee?ee:Ge,Mt=le.slice(Ce,rt).trim();if(Mt==="")throw de(O,Ce,me);if(!Rs.test(Mt))throw de(O,Ce,s.badId(Mt));if(Ee.push({value:Mt,at:Ce}),rt>=ee)return Ee;$e=rt+1}}function tt(O){Qe(O);const q=O.text.indexOf("["),ee=q<0?O.text.length:q,me=q<0?new Map:zn(O,q,on.item,s),le=me.get("color");if(le&&!vn(us,le.value))throw de(O,le.at,s.badColor);const Ee=me.get("label");if(Ee&&[...Ee.value].length>i0)throw de(O,Ee.at,s.labelTooLong(i0));for(const{value:$e,at:Ce}of Ve(O,4,ee,s.itemShape))re(O,$e,Ce),A.push({id:$e,...le?{color:le.value}:{},...Ee?{label:Ee.value}:{}})}function Ht(O){const q=c1.exec(O.text),ee=q?.[1];if(!q||ee===void 0)throw de(O,0,s.lineShape);const me=q.indices?.[1]?.[0]??0,le=Y(O,ee,me);if(N.has(le))throw de(O,me,s.lineOnSealed(le));const Ee=Ve(O,q[0].length,O.text.length,s.lineShape),$e=new Set;return Ee.forEach(({value:Ce,at:Ge},rt)=>{if(!A.some(Mt=>Mt.id===Ce))throw de(O,Ge,s.noSuchItem(Ce));if($e.has(Ce))throw de(O,Ge,s.itemTwice(Ce));if(rt>=Pl)throw de(O,Ge,s.laneFull(le,Pl));$e.add(Ce)}),{type:"line",box:le,items:Ee.map(Ce=>Ce.value)}}function bt(O,q){const ee=d1.exec(O.text),me=ee?.[1];if(!ee||me===void 0)throw de(O,0,s.laneShape(q));const le=ee.indices?.[1]?.[0]??0,Ee=Y(O,me,le);if(q==="seal"){if(N.has(Ee))throw de(O,le,s.sealTwice(Ee));N.add(Ee)}if(q==="open"&&!N.delete(Ee))throw de(O,le,s.openUnsealed(Ee));return{type:q,box:Ee}}function zt(O){const q=u1.exec(O.text),ee=q?.[1];if(!q||ee===void 0)throw de(O,0,s.stampShape);const me=Y(O,ee,q.indices?.[1]?.[0]??0),le=cs(O,q[0].length,s);if(le.value===""||le.rest<O.text.length)throw de(O,0,s.stampShape);return{type:"stamp",box:me,text:le.value}}function Hn(O){if(Qe(O),X)throw de(O,0,s.stripTwice);const q=O.text,ee=Lt(q,5);let me,le;if(q[ee]==='"'){const Ce=Do(O,ee,s);me=Ce.value,le=Lt(q,Ce.end)}else le=q.indexOf(":",ee),me=le<0?"":q.slice(ee,le).trim();if(me===""||q[le]!==":")throw de(O,0,s.stripShape);if(b){X={title:me,fields:Pn(O,le+1)};return}const Ee=E1(O,le+1,s),$e=/\[\s*meter\s*:/u.exec(q);if($e&&Ee.some(Ce=>/\[\s*meter\s*:[^\]]*\]$/u.test(Ce)))throw de(O,$e.index+1,s.timeOnly("meter"));X={title:me,fields:Ee}}function Pn(O,q){const ee=O.text,me=[];for(let le=q;;){const Ee=Lt(ee,le);let $e,Ce;if(ee[Ee]==='"'){const Ge=Do(O,Ee,s);$e=Ge.value,Ce=Lt(ee,Ge.end)}else{for(Ce=Ee;Ce<ee.length&&ee[Ce]!==","&&ee[Ce]!=="[";)Ce++;$e=ee.slice(Ee,Ce).trim()}if($e==="")throw de(O,Ee,s.emptyStripField);if(ee[Ce]==="["){const Ge=ee.indexOf("]",Ce);if(Ge<0)throw de(O,Ce,s.attrUnclosed);const rt=ee.slice(Ce+1,Ge),Mt=/^\s*([a-z]*)\s*:\s*(.*?)\s*$/u.exec(rt);if(!Mt)throw de(O,Ce+1,s.attrNoColon(rt.trim()));const Bt=Mt[1]??"";if(!on.strip.includes(Bt))throw de(O,Ce+1,s.badAttr(Bt,on.strip));if(!u0.test(Mt[2]??""))throw de(O,Ce+1,s.badRatio);R.push({field:$e,line:Mt[2]??""}),Ce=Lt(ee,Ge+1)}if(Ce<ee.length&&ee[Ce]!==",")throw de(O,Ce,s.afterQuote);if(me.push($e),Ce>=ee.length)return me;le=Ce+1}}function En(O,q){const ee=Re(O);if(ee.body!==void 0)throw de(O,0,s.sayTwice);const me=O.text.slice(3).trim(),le=me===""?[]:[me];let Ee=0,$e=q;for(let Ce=q+1;Ce<U.length;Ce++){const Ge=U[Ce];if(!Ge)break;if(Ge.text===""){Ee++;continue}if(Ge.indent<=O.indent)break;le.push(...Array.from({length:Ee},()=>""),Ge.text),Ee=0,$e=Ce}if(le.length===0)throw de(O,0,s.emptySay);return ee.body=le,$e}function ea(O,q,ee){const me=new RegExp(`^${q}\\s+([^\\s:]+)\\s*:\\s*(.*)$`,"du").exec(O.text),le=me?.indices?.[1]?.[0];if(!me||le===void 0||(me[2]??"")==="")throw de(O,0,ee);return{box:Y(O,me[1]??"",le),text:me[2]??""}}function ys(O,q){const ee=O.text,me=ze(O,q[1]??"",q.indices?.[1]?.[0]??0,"from"),le=ze(O,q[2]??"",q.indices?.[2]?.[0]??0,"to"),Ee=Lt(ee,q[0].length);if(ee[Ee]!==":")return{from:me,to:le,at:Ee};const $e=cs(O,Ee+1,s);if($e.value==="")throw de(O,Ee,s.emptyLabel);return{from:me,to:le,label:$e.value,at:$e.rest}}function Vi(O,q){const{from:ee,to:me,label:le,at:Ee}=ys(O,q);if(Ee<O.text.length)throw de(O,Ee,O.text[Ee]==="["?s.pathNoAttrs:s.edgeShape);return{from:ee,to:me,...le!==void 0?{label:le}:{}}}function Xi(O,q){const ee=O.text,{from:me,to:le,label:Ee,at:$e}=ys(O,q);if($e<ee.length&&ee[$e]!=="[")throw de(O,$e,s.edgeShape);const Ce=$e<ee.length?zn(O,$e,on.edge,s):new Map,Ge=Ce.get("tag"),rt=Ce.get("carry");if(Ge&&rt)throw de(O,Math.max(Ge.at,rt.at),s.carryTwice);if(rt&&!vn(Yd,rt.value))throw de(O,rt.at,s.badCarry);const Mt=Ce.get("side");if(Mt&&!vn(Xd,Mt.value))throw de(O,Mt.at,s.badSide);const Bt=Ji(O,me,le,Ce,$e);let an=g?{kind:"tag",text:me}:{kind:"envelope"};return Ge?an={kind:"tag",text:Ge.value}:rt&&(an=rt.value==="coin"?{kind:"coin"}:{kind:"none"}),g&&me!==pa&&pe.set(me,le),{type:"edge",from:me,to:le,...Ee!==void 0?{label:Ee}:{},carry:an,...Mt?{labelSide:Mt.value}:{},...Bt}}function Ji(O,q,ee,me,le){const $e=$v.flatMap(Bt=>{const an=me.get(Bt);return an?[{key:Bt,attr:an}]:[]})[0];if(!b){if($e)throw de(O,$e.attr.at,s.timeOnly($e.key));return{}}const Ce=Bt=>C.some(an=>an.id===Bt);if(Ce(q)!==Ce(ee))throw de(O,0,s.mixedLine);if(!Ce(q)){if($e)throw de(O,$e.attr.at,j?s.pointLineNoAt:s.noZoom);return{}}const Ge=Bt=>{if(!Bt)return;const an=we(O,Bt.at,Bt.value);if(!j||an<j.from||an>j.to)throw de(O,Bt.at,j?s.outOfZoom(j.from,j.to):s.noZoom);return an},rt=Ge(me.get("at"));if(rt===void 0)throw de(O,le,s.boxLineNeedsAt);const Mt=Ge(me.get("into"));return{at:rt,...Mt!==void 0?{into:Mt}:{}}}function zo(O){const q=X;if(!q)throw de(O,0,s.stripUndeclared);const ee=O.text,me=Lt(ee,3);let le,Ee;if(ee[me]==='"'){const Ge=Do(O,me,s);le=Ge.value,Ee=Lt(ee,Ge.end)}else{for(Ee=me;Ee<ee.length&&ee[Ee]!==":"&&ee[Ee]!=="[";)Ee++;le=ee.slice(me,Ee).trim()}if(!q.fields.includes(le))throw de(O,me,s.noSuchField(le));let $e;if(ee[Ee]===":"){const Ge=cs(O,Ee+1,s);if(Ge.value==="")throw de(O,Ee,s.stripNeedsValue);$e=Ge.value,Ee=Ge.rest}if(Ee<ee.length&&ee[Ee]!=="[")throw de(O,Ee,s.stripNeedsValue);const Ce=Ee<ee.length?zn(O,Ee,on.set,s).get("tag")?.value:void 0;if($e===void 0&&Ce===void 0)throw de(O,0,s.stripNeedsValue);if($e!==void 0&&R.some(Ge=>Ge.field===le)&&!u0.test($e))throw de(O,me,s.meterValue(le));return{type:"strip",field:le,...$e!==void 0?{value:$e}:{},...Ce!==void 0?{tag:Ce}:{}}}}function ms(t,s={}){try{return{ok:!0,diagram:A1(t1(t),Iv(s.lang??"ja"))}}catch(c){if(!(c instanceof Jd))throw c;return{ok:!1,errors:[{line:c.line,column:c.column,message:c.message}]}}}var Wl=t=>`"${t.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`,ps=t=>t.includes("[")||t.startsWith('"')?Wl(t):t,ug=t=>t.includes(":")||t.includes("[")||t.startsWith('"')?Wl(t):t,_1=(t,s)=>t.includes(",")||t.startsWith('"')||s&&t.includes("[")?Wl(t):t,S1=t=>t.includes(",")||t.includes("]")||t.startsWith('"')?Wl(t):t,pn=t=>{const s=t.filter(c=>c[1]!==void 0);return s.length===0?"":` [${s.map(([c,d])=>`${c}: ${S1(d)}`).join(", ")}]`},Qd=(t,s)=>s===t?"":` as ${ps(s)}`,f0=t=>`group ${t.id}${Qd(t.id,t.name)}${pn([["note",t.note],["color",t.color],["icon",t.icon]])}`,$1=t=>`box ${t.id}${Qd(t.id,t.name)}${pn([["note",t.sub],["color",t.color],["icon",t.icon],["link",t.link]])}`,dg=(t,s,c)=>`${t} -> ${s}${c===void 0?"":`: ${ps(c)}`}`,Od=(t,s)=>t===s?`${t}`:`${t}-${s}`,Ul=t=>t===void 0?void 0:`${t}`;function N1(t,s){switch(t.type){case"edge":{const d=(s==="git"?t.carry.kind==="tag"&&t.carry.text===t.from:t.carry.kind==="envelope")?[]:t.carry.kind==="tag"?[["tag",t.carry.text]]:[["carry",t.carry.kind]];return`${dg(t.from,t.to,t.label)}${pn([...d,["side",t.labelSide],["at",Ul(t.at)],["into",Ul(t.into)]])}`}case"action":return`act ${t.box}: ${t.label}`;case"swap":return s==="time"?`note ${t.box}: ${ps(t.text)}${pn([["color",t.color]])}`:`note ${t.box}: ${t.text}`;case"now":return`${Zl} -> ${t.to}`;case"mark":return`mark ${t.row} ${Od(t.from,t.to)}${pn([["color",t.color]])}`;case"span":return`span ${Od(t.from,t.to)}: ${ps(t.text)}${pn([["shape",t.shape],["color",t.color]])}`;case"strip":return`set ${ug(t.field)}${t.value===void 0?"":`: ${ps(t.value)}`}${pn([["tag",t.tag]])}`;case"commit":return`commit ${t.id} ${ag} ${t.branch}${t.copy===void 0?"":` ${sg} ${t.copy}`}${t.merge===void 0?"":` ${og} ${t.merge}`}${pn([["hash",t.hash],["note",t.note]])}`;case"branch":return`${t.branch} ${Gd} ${t.from}`;case"leaf":return`leaf ${t.id}${pn([["hash",t.hash]])}`;case"node":return`node ${t.id} ${rg} ${t.children.join(", ")}${pn([["hash",t.hash]])}`;case"line":return`line ${t.box}: ${t.items.join(", ")}`;case"seal":case"open":case"pick":return`${t.type} ${t.box}`;case"stamp":return`stamp ${t.box}: ${ps(t.text)}`}}function D1(t){const s=[];for(const c of t){const d=s.at(-1);d&&c.label===void 0&&d[0]?.label===void 0&&d[0]?.color===c.color?d.push(c):s.push([c])}return s.map(c=>`item ${c.map(d=>d.id).join(", ")}${pn([["color",c[0]?.color],["label",c[0]?.label]])}`).join(`
`)}function T1(t){const s=[`scale ${t.scale.unit} ${t.scale.length} ${t.scale.count}${pn([["from",Ul(t.scale.from)]])}`,...t.period?[`period ${t.period.name} ${t.period.length}${pn([["from",Ul(t.period.from)]])}`]:[]],c=t.rows.map(p=>`row ${p.id}${Qd(p.id,p.name)}${pn([["color",p.color],["empty",p.empty&&p.empty.length>0?p.empty.join(" "):void 0]])}`),d=(t.points??[]).map(p=>`point ${p.id} ${ig} ${p.at}`);return[s.join(`
`),c.join(`
`),...d.length>0?[d.join(`
`)]:[],...t.zoom?[`zoom ${Od(t.zoom.from,t.zoom.to)}`]:[]]}function C1(t){const s=t.regions??[],c=[];for(const l of t.boxes){const f=c.at(-1);f&&f.region===l.region?f.boxes.push(l):c.push({...l.region!==void 0?{region:l.region}:{},boxes:[l]})}const d=[...new Set(c.flatMap(l=>l.region===void 0?[]:[l.region]))],p=d.length===s.length&&d.every((l,f)=>s[f]?.id===l),a=new Set,r=[];if(!p)for(const l of s)r.push(`${f0(l)}
end`),a.add(l.id);for(const l of c){const f=l.boxes.map($1);if(l.region===void 0){r.push(f.join(`
`));continue}const u=s.find(b=>b.id===l.region),g=a.has(l.region)||!u?`group ${l.region}`:f0(u);a.add(l.region),r.push([g,...f.map(b=>`  ${b}`),"end"].join(`
`))}return r}function Fi(t){const s=(t.git?.branches??[]).map(p=>`branch ${p.id}${pn([["note",p.note]])}`),c=t.kind==="time",d=[`${t.kind} ${ps(t.title)}${pn([["view",t.view]])}`,...s.length>0?[s.join(`
`)]:[],...t.time?T1(t.time):[],...C1(t),...t.lineup&&t.lineup.items.length>0?[D1(t.lineup.items)]:[]];if(t.strip){const p=new Map((t.strip.meters??[]).map(r=>[r.field,r.line])),a=t.strip.fields.map(r=>`${_1(r,c)}${pn([["meter",p.get(r)]])}`);d.push(`strip ${ug(t.strip.title)}: ${a.join(", ")}`)}t.state&&d.push(t.state.paths.map(p=>dg(p.from,p.to,p.label)).join(`
`));for(const p of t.steps){const a=p.body.split(`
`),r=a.length===1?[`  say ${p.body}`]:["  say",...a.map(l=>l===""?"":`    ${l}`)];d.push([`step ${p.title}`,...r,...p.code===void 0?[]:[`  code ${p.code}`],...(p.sources??[]).map(l=>`  source ${ps(l.name)}${pn([["url",l.url]])}`),...p.events.map(l=>`  ${N1(l,t.kind)}`)].join(`
`))}return`${d.join(`

`)}
`}var Li={sans:"Noto Sans JP Variable",mono:"JetBrains Mono Variable"},O1={0:590,1:590,2:590,3:590,4:590,5:590,6:590,7:590,8:590,9:590," ":228,"!":371,'"':575,"#":590,$:590,"%":963,"&":740,"'":325,"(":378,")":378,"*":507,"+":590,",":325,"-":371,".":325,"/":390,":":325,";":325,"<":590,"=":590,">":590,"?":514,"@":1007,A:642,B:682,C:657,D:715,E:616,F:586,G:718,H:758,I:330,J:568,K:686,L:579,M:854,N:750,O:771,P:668,Q:771,R:682,S:624,T:626,U:748,V:619,W:915,X:627,Y:581,Z:614,"[":378,"\\":390,"]":378,"^":590,_:568,"`":626,a:591,b:644,c:528,d:645,e:581,f:372,g:598,h:640,i:305,j:306,k:605,l:315,m:964,n:641,o:626,p:645,q:645,r:437,s:495,t:421,u:638,v:576,w:863,x:562,y:575,z:512,"{":378,"|":297,"}":378,"~":590,"…":1e3,"−":590,"×":1e3,"→":1e3,"←":1e3,"↑":1e3,"↓":1e3,"–":545,"—":908,"‘":325,"’":325,"“":575,"”":575,"°":404,"±":1e3,"·":593,"•":379},M1=600,B1=11904,Md=1e3;function j1(t,s){return(t.codePointAt(0)??0)>=B1?Md:s==="mono"?M1:O1[t]??Md}var q1={clear:{name:"澄んだ色",note:"白い地に、中くらいの明るさの鮮やかな 6 色。今の見本帳の色",light:{page:"#f3f4f7",bg:"#ffffff",surf:"#ffffff",sunk:"#f5f6f8",ink:"#12141a",ink2:"#3f4451",mute:"#6b7180",hair:"#12141a1c",line:"#12141a40",sh:"#101828","on-c":"#ffffff","c-blue":"#467deb","t-blue":"#2e62ce","c-amber":"#d28008","t-amber":"#975b04","c-green":"#0ea886","t-green":"#07775e","c-violet":"#6c3bb2","t-violet":"#6c3bb2","c-rose":"#ba3e40","t-rose":"#b83c3f","c-slate":"#5d6677","t-slate":"#5d6677",coin:"#e9b114",coint:"#856300",coinin:"#a8740c",tint:"5%",edge:"20%",shA:".05",shB:".08",carry:"#65686f"},dark:{page:"#08090c",bg:"#0d0e12",surf:"#17191f",sunk:"#121419",ink:"#eceef3",ink2:"#c4c8d2",mute:"#9198a6",hair:"#eceef31f",line:"#eceef340",sh:"#000000","on-c":"#0d0e12","c-blue":"#7e7ef6","t-blue":"#989cfd","c-amber":"#c78135","t-amber":"#dd954b","c-green":"#20ac7a","t-green":"#35b986","c-violet":"#695b9f","t-violet":"#a79ae3","c-rose":"#bc434b","t-rose":"#fd7d81","c-slate":"#9ba3b2","t-slate":"#9da5b4",coin:"#f0c040",coint:"#f0c040",coinin:"#9a6a0c",tint:"6%",edge:"19%",shA:".45",shB:".35"}},paper:{name:"紙と墨",note:"生成りの紙の地に、藍 / 黄土 / 苔 / 葡萄 / 朱 / 鈍のくすんだ 6 色",light:{page:"#ece7dd",bg:"#f9f6f0",surf:"#fffcf6",sunk:"#f2ede4",ink:"#221e18",ink2:"#4b453b",mute:"#7b7366",hair:"#221e181f",line:"#221e1847",sh:"#3a2a10","on-c":"#fffcf6","c-blue":"#487dd5","t-blue":"#2d60b5","c-amber":"#c38405","t-amber":"#885a01","c-green":"#57a271","t-green":"#237143","c-violet":"#904698","t-violet":"#904698","c-rose":"#a9513e","t-rose":"#9f4836","c-slate":"#6a645a","t-slate":"#696359",coin:"#d4a52a",coint:"#7d5e05",coinin:"#9a7016",tint:"6%",edge:"22%",shA:".06",shB:".07",carry:"#68635c"},dark:{page:"#0e0d0b",bg:"#15130f",surf:"#1e1b17",sunk:"#191612",ink:"#ede6d8",ink2:"#cbc2b1",mute:"#9c9283",hair:"#ede6d81f",line:"#ede6d842",sh:"#000000","on-c":"#15130f","c-blue":"#5785d5","t-blue":"#76a6f9","c-amber":"#be8802","t-amber":"#d59e2f","c-green":"#52aa71","t-green":"#61b87e","c-violet":"#90529b","t-violet":"#d08edb","c-rose":"#bb4e3d","t-rose":"#f98672","c-slate":"#a9a295","t-slate":"#aca598",coin:"#dcb24e",coint:"#dcb24e",coinin:"#8a6a14",tint:"6%",edge:"19%",shA:".45",shB:".35"}},night:{name:"夜の計器",note:"青みの黒の地に、光る水色 / 琥珀 / 若緑 / 菫 / 桃 の 6 色。明るい側は青灰の地",light:{page:"#e9eef5",bg:"#f6f9fc",surf:"#ffffff",sunk:"#eef3f8",ink:"#0b1424",ink2:"#34425a",mute:"#64748b",hair:"#0b14241c",line:"#0b142440",sh:"#0b1424","on-c":"#ffffff","c-blue":"#0385cd","t-blue":"#086aa3","c-amber":"#ba8e0f","t-amber":"#7f5f04","c-green":"#0a8857","t-green":"#027449","c-violet":"#5839ba","t-violet":"#5839ba","c-rose":"#dd4a94","t-rose":"#b82375","c-slate":"#64748b","t-slate":"#56667c",coin:"#eab308",coint:"#7e6005",coinin:"#a16207",tint:"5%",edge:"22%",shA:".06",shB:".09",carry:"#596579"},dark:{page:"#060a12",bg:"#0a101c",surf:"#111a2a",sunk:"#0d1522",ink:"#e6edf7",ink2:"#b8c4d6",mute:"#8090a8",hair:"#e6edf71c",line:"#9fb3d145",sh:"#000000","on-c":"#0a101c","c-blue":"#3884b6","t-blue":"#62ace1","c-amber":"#be8533","t-amber":"#d59b4b","c-green":"#3ba774","t-green":"#4fb884","c-violet":"#7d4ecd","t-violet":"#b494fd","c-rose":"#bc3a74","t-rose":"#ff77ad","c-slate":"#96a3b5","t-slate":"#99a6b8",coin:"#facc15",coint:"#facc15",coinin:"#a16207",tint:"6%",edge:"19%",shA:".5",shB:".4"}}},Gl="paper",Ba=Object.fromEntries(Object.entries(q1).map(([t,s])=>[t,{id:t,...s}]));function Zd(t){return(t!==void 0&&Object.hasOwn(Ba,t)?Ba[t]:void 0)??Ba[Gl]}var R1=["page","bg","surf","sunk","ink","ink2","mute","hair","line","sh","on-c","c-blue","t-blue","c-amber","t-amber","c-green","t-green","c-violet","t-violet","c-rose","t-rose","c-slate","t-slate","coin","coint","coinin","tint","edge","shA","shB","carry"],z1=new Set(R1),F1=t=>z1.has(t);function L1(t){if(typeof t!="string"||!/^[\w\s#%.,()/+-]+$/u.test(t)||/url\(/iu.test(t))return!1;let s=0;for(const c of t)if(s+=c==="("?1:c===")"?-1:0,s<0)return!1;return s===0}function pg(t,s){return Object.entries(t[s]).map(([c,d])=>`--${c}:${d}`).join(";")}var hg=`--sans:"${Li.sans}";--mono:"${Li.mono}"`,Co=["blue","amber","green","violet","rose"],it=(t,s,c="sans")=>({size:t,weight:s,family:c}),oe={boxName:it(13,650),boxSub:it(11,500),boxSubStrong:it(11,700),regionName:it(12.5,700),regionNote:it(11,500),label:it(11,600,"mono"),labelJa:it(11,650),action:it(11,650),badge:it(10.5,700,"mono"),carrier:it(10.5,700,"mono"),carrierJa:it(10.5,700),stripTitle:it(12.5,700),fieldName:it(10.5,600),fieldValue:it(12,600,"mono"),fieldValueJa:it(12,600),tag:it(10.5,700),miniTitle:it(10.5,700),stepTitle:it(15,700),stepBody:it(13.5,500),stepNo:it(13,700,"mono"),button:it(14,700),gitId:it(11,700),gitHash:it(10.5,600,"mono"),gitNote:it(10.5,650),treeHash:it(13.5,700,"mono"),treeName:it(10.5,600),rootHash:it(15,700,"mono"),rootName:it(11,700),treeCard:it(11.5,650),chip:it(10.5,700,"mono"),stamp:it(11,700),timeHead:it(11,650,"mono"),timeRow:it(11,600),timeTick:it(10.5,600,"mono"),timePeriod:it(11.5,650),timeRange:it(10.5,500,"mono"),pointName:it(11,700,"mono"),pointState:it(11.5,700),spanText:it(11,650),emptyText:it(11,700),meterLine:it(10.5,700,"mono")},Q={gap:10,margin:14,box:{h:72,minW:92,padX:12,radius:12,icon:24,iconRadius:7,iconY:-16,iconScale:.74,nameY:12,subY:27},region:{pad:18,gap:10,radius:14,inset:14,icon:24,iconRadius:7,iconScale:.68,nameY:58,line:16,minH:108},architecture:{columns:4,columnGap:56,maxColumnGap:160,rowGap:44,labelRoom:16},sequence:{columnGap:40,labelRoom:16,labelOffset:16,firstRow:10,rowGap:6,stepGap:6,minPitch:32,tail:10,selfW:34,selfH:18},state:{columns:4,columnGap:64,rowGap:108,labelRoom:16,start:7,end:{r:9,inner:5},drop:56,below:64,beside:38,text:16,loop:{w:24,h:34,samples:12,badgeAt:.6},side:{pad:16,gap:76,lane:30,entry:28},ghost:{h:52,pad:12,gap:10,nameY:-2,subY:14},done:{r:6.5,inset:13},pastLabel:.85},git:{x0:120,pitch:90,textGap:12,r:12,orphan:13.5,topLine:120,line:90,topBelow:30,below:82,bare:62,above:18,under:27,lineStep:13,tagTop:58,tag:30,row:22,turn:60,samples:12,boxGap:24,labelUnder:50,colors:["blue","violet","green","amber","rose"]},tree:{w:74,h:44,padX:10,radius:10,root:{w:112,h:54,radius:13,iconX:10,textX:46,padR:14,nameY:-4,hashY:14},hashY:-1,nameY:14,oneY:4.5,slotGap:12,top:16,row:102,card:{drop:78,h:30,minW:70,padX:10,icon:12,gap:6,glyph:.62,radius:9},boxGap:24,badgeAlong:22,faint:.42,color:"violet",rootColor:"green"},lineup:{padX:12,h:61,radius:10,textY:20,trackY:33,textGap:10,faint:.35,chip:{w:25,h:18,gap:4,radius:4,padX:3},seal:{over:3,radius:5,stripe:7},stamp:{h:22,padX:8,radius:5,tilt:-4,color:"green"}},time:{width:728,axisX:118,right:16,gutterGap:12,head:22,boxTop:34,boxGap:36,zoomBottom:14,sep:12,zoomGap:12,rowsTop:24,row:20,rowGap:6,markRatio:.5,markMin:1.5,markMax:18,markRadius:1.5,shade:8,frame:2.5,emptyR:1.7,point:{drop:40,r:9,text:15,nameY:-2,stateY:12,link:10,end:6,room:30,plain:12,glyph:.62},bracket:{gap:12,tick:6,text:16,lane:34},box:{pad:6,tagX:12,tagH:16,tagPadX:7},axisGap:18,major:12,minor:6,minorPx:40,tickY:18,rangeY:14,nameGap:8,ticks:6,bottom:12,needle:{over:8,head:6,dot:3.5},meter:{w:150,h:6,y:36,mark:5,textY:59,color:"amber"}},edge:{inset:3,arrow:6,arrowHalf:3.5,parallel:5,ghostDash:5,flowDash:9,bend:12},label:{h:20,padX:9,radius:10,offset:22,side:14,search:4,searchMax:400,soft:6,touch:2},action:{h:22,padX:10,radius:11},badge:{r:9.5,ring:9,inset:4,along:14,short:44},carrier:{envW:24,envH:17,coinR:6.5,coinIn:3.8,tagH:18,tagPadX:8,samples:16},slot:{gap:6,pad:3,spread:4,h:24,radius:7,clear:2,lifeline:5,mark:4},mark:{pad:3,radius:5,dash:4,gap:3},strip:{h:72,line:44,pad:12,icon:24,titleX:44,fieldGap:22,sepInset:14,tagGap:6,tagH:15,tagPadX:7,nameY:22,valueY:43,trail:{r:5.4,step:16},now:{r:3,gap:7}},stroke:{git:2.25,gitOrphan:1.5,mark:1.6,slot:1.2,hair:1,edge:1.7,edgeOn:2.25,arrow:1.5,flow:1.3,halo:7,on:1.75,glyph:2,lifeline:1.2,envelope:1.5,badgeRing:1.5,path:1.6,end:1.6,done:1.2,trail:1.2,timeSlot:.6,timeFrame:1.25,timeAxis:1,timeSpan:1.5,timeDrop:1.4,timePoint:1.75,timeFlag:1.8,timeNeedle:1.25,timeMeter:1.25,tree:1.5,treeTrail:2.6,treeCon:1.3,stamp:2},shadow:{near:.8,far:4,nearY:1,farY:3},mini:{w:168,pad:8,title:14,inset:12,radius:10},follow:{aspect:.75,minH:320,fitMinH:160,ease:.6,narrow:440,badgeRoom:8,headRoom:10,head:{pad:8,h:40,nameY:17,subY:31}},mix:{slot:45,icon:14,regionIcon:16,regionIconEdge:34,cap:12,capEdge:42,badgePast:14,badgePastEdge:70,mini:62,miniBand:16,miniBandEdge:36,view:6,side:4,sideEdge:36,ghostEdge:60,path:55,past:72,timeShade:3.5,timeSpan:6,timeEmpty:8,timeGuide:50,chipPlain:34,sealDark:60,sealLight:34},baseline:{label:3.8,badge:3.5,carrier:3.7,stripTitle:4.5,tag:3.6,action:3.8,mark:4},rise:5,popFrom:.4,player:{gap:10,radius:12,button:36,touch:44,hidden:1,focus:2,narrow:440}},He={intro:1.4,outro:4.6,tail:.6,stepBase:1.2,perChar:.025,stepMin:2.2,stepMax:5,dwell:1.2,edgeAt:.1,stagger:.5,draw:.55,drawCarry:.9,action:.9,change:.12,minShow:.8,labelDelay:.15,fade:.3,popFade:.4,untilFade:.2,still:.45,done:.3,time:{axis:11.5,unitMin:.12,unitMax:.4,wait:.15,after:.15,reset:.05},lineup:{slide:.7,seal:.6,stagger:.2,cut:.01}},fg=10.5,et={inOut:"cubic-bezier(.65,0,.35,1)",out:"cubic-bezier(.22,1,.36,1)",pop:"cubic-bezier(.34,1.56,.64,1)"},yd=t=>/[0-9A-Za-z]$/u.test(t)?`${t} `:t,H1=t=>t.charAt(0).toUpperCase()+t.slice(1),gs={ja:{cannotDraw:t=>`図を描けない: ${t}`,unknownColor:t=>`colors の ${t} は色味に無い色の名前`,unreadableColor:t=>`colors の ${t} の値を色として読めない`,overview:"全体図",prev:"前の段",pause:"止める",play:"動かす",next:"次の段",steps:t=>`${t} の段`,side:"脇道",sideNote:"今回は通らない",sideFrom:t=>`${t} つの状態から入れる`,trail:"通った状態",start:"始まり",end:"終わり",badgeName:t=>`段の番号 ${t}`,quoted:t=>`「${t}」`,iconOf:t=>`「${t} の絵柄」`,coin:"「硬貨」",envelope:"「封筒」",textsOverlap:(t,s)=>`${yd(t)}と${yd(s)}が重なる`,lineCrosses:(t,s,c)=>`線 ${t} → ${s} が${yd(c)}を横切る`,timeUnits:{ms:"ミリ秒",s:"秒",min:"分",h:"時間",d:"日"},zoom:"拡大",range:(t,s)=>`${t}〜${s}`,headJoin:" ・ ",empty:"空き"},en:{cannotDraw:t=>`Cannot draw the diagram: ${t}`,unknownColor:t=>`colors.${t} is not a color name of the palette`,unreadableColor:t=>`colors.${t} cannot be read as a color`,overview:"Overview",prev:"Previous step",pause:"Pause",play:"Play",next:"Next step",steps:t=>`Steps of ${t}`,side:"Side path",sideNote:"Not taken this time",sideFrom:t=>`Enterable from ${t} ${t===1?"state":"states"}`,trail:"States passed",start:"Start",end:"End",badgeName:t=>`step number ${t}`,quoted:t=>`"${t}"`,iconOf:t=>`the icon of "${t}"`,coin:"the coin",envelope:"the envelope",textsOverlap:(t,s)=>H1(`${t} and ${s} overlap`),lineCrosses:(t,s,c)=>`The line ${t} → ${s} crosses ${c}`,timeUnits:{ms:"ms",s:"s",min:"min",h:"h",d:"d"},zoom:"Zoom",range:(t,s)=>`${t}–${s}`,headJoin:" · ",empty:"Empty"}},In=t=>[...t].some(s=>(s.codePointAt(0)??0)>=11904);function P1(t,s){return s==="mono"&&In(t)?"sans":s}function Xe(t,s){const c=P1(t,s.family);let d=0;for(const p of t)d+=j1(p,c);return d*s.size/Md}function oa(t,s,c,d,p="start"){const a=Xe(t,d);return{x:p==="middle"?s-a/2:s,y:c-d.size*.8,w:a,h:d.size}}function Ui(t){return t.steps.flatMap((s,c)=>s.events.flatMap((d,p)=>d.type==="edge"?[{step:c,event:p,edge:d}]:[]))}function Hs(t){const s=mg(t),c=new Map;return t.boxes.forEach((d,p)=>{const a=d.region===void 0?void 0:s.get(d.region);c.set(d.id,d.color??a??Co[p%Co.length])}),c}function mg(t){const s=new Map;return(t.regions??[]).forEach((c,d)=>s.set(c.id,c.color??Co[d%Co.length])),s}var Gi=(t,s)=>t.carry.kind==="coin"?"coin":s.get(t.from)??"slate";function jo(t,s,c){const d=t.boxes.find(a=>a.id===s);if(!d)return Q.box.minW;const p=[Xe(d.name,oe.boxName),Xe(d.sub??"",oe.boxSub)];for(const a of t.steps)for(const r of a.events)r.type==="swap"&&r.box===s&&p.push(Xe(r.text,oe.boxSubStrong)),c&&r.type==="action"&&r.box===s&&p.push(Xe(r.label,oe.boxSubStrong));return Math.max(Q.box.minW,Math.max(...p)+Q.box.padX*2)}function Oo(t){const s=Q.carrier;return t.kind==="tag"?[(Xe(t.text,In(t.text)?oe.carrierJa:oe.carrier)+s.tagPadX*2)/2,s.tagH/2]:t.kind==="coin"?[s.coinR,s.coinR]:[s.envW/2,s.envH/2]}var gg=t=>t.main+t.coin+(t.main>0&&t.coin>0?Q.slot.spread:0);function Il(t){const s=new Map,c=new Set(t.boxes.map(d=>d.id));for(const d of t.steps)for(const p of d.events){if(p.type!=="edge"||p.carry.kind==="none")continue;const a=p.carry.kind==="coin"?"coin":"main",r=Oo(p.carry)[0]*2;for(const l of[p.from,p.to]){if(!c.has(l))continue;const f=s.get(l)??{main:0,coin:0};f[a]=Math.max(f[a],r),s.set(l,f)}}return s}function ec(t,s,c){return t?(s?Q.box.icon+Q.slot.gap:0)+gg(t)+Q.slot.pad*2+Q.box.padX+c:0}function tc(t,s,c=Q.box.padX){if(!s)return;const d=Q.box,p=Q.slot,a=gg(s)+p.pad*2,r=t.icon?d.icon+p.gap:0,l=Math.max(t.x+d.padX,Math.min(t.cx-(r+a)/2,t.x+t.w-c-(r+a)));t.icon&&(t.iconX=l+d.icon/2),t.slot={x:l+r,y:t.cy+d.iconY-p.h/2,w:a,h:p.h}}function Hi(t,s,c){const d=Q.slot,p=(a,r)=>{const l=s.get(a),f=c.get(a);if(!l?.slot||!f)return;const u=l.slot.x+d.pad,g=l.slot.y+l.slot.h/2;return f.main>0&&f.coin>0?r.kind==="coin"?[u+f.main+d.spread+f.coin/2,g]:[u+f.main/2,g]:[l.slot.x+l.slot.w/2,g]};for(const a of t){if(a.carry.kind==="none")continue;const r=p(a.to,a.carry),l=p(a.from,a.carry);r&&(a.settle=r),l&&(a.wait=l)}}function To(t,s){const c=Math.max(s.x-(t.x+t.w),t.x-(s.x+s.w)),d=Math.max(s.y-(t.y+t.h),t.y-(s.y+s.h));return Math.max(c,d)}function Kd(t,s,c=0){const d=s.x+c,p=s.y+c,a=s.x+s.w-c,r=s.y+s.h-c;if(a<=d||r<=p)return!1;for(let l=1;l<t.length;l++){const[f,u]=t[l-1],[g,b]=t[l],w=g-f,v=b-u;let A=0,N=1;const S=(M,D)=>{if(M===0)return D>0;const z=D/M;return M<0?A=Math.max(A,z):N=Math.min(N,z),A<N};if(S(-w,f-d)&&S(w,a-f)&&S(-v,u-p)&&S(v,r-u))return!0}return!1}function U1(t){let s={a:t[0],b:t[1]??t[0],length:-1};for(let c=1;c<t.length;c++){const d=t[c-1],p=t[c],a=Math.hypot(p[0]-d[0],p[1]-d[1]);a>s.length&&(s={a:d,b:p,length:a})}return{a:s.a,b:s.b,vertical:Math.abs(s.b[0]-s.a[0])<Math.abs(s.b[1]-s.a[1])}}function ja(t,s){let c=s;for(let d=1;d<t.length;d++){const p=t[d-1],a=t[d],r=Math.hypot(a[0]-p[0],a[1]-p[1]);if(c<=r&&r>0)return[p[0]+(a[0]-p[0])*c/r,p[1]+(a[1]-p[1])*c/r];c-=r}return t[t.length-1]}function qo(t){let s=0;for(let c=1;c<t.length;c++){const d=t[c-1],p=t[c];s+=Math.hypot(p[0]-d[0],p[1]-d[1])}return s}function Wd(t){const{w:s,h:c,samples:d}=Q.state.loop,p=t.y+t.h,a=[t.cx+s/2,p],r=[t.cx+s*3/4,p+c*4/3],l=[t.cx-s*3/4,p+c*4/3],f=[t.cx-s/2,p+Q.edge.inset];return Array.from({length:d+1},(u,g)=>{const b=g/d,w=1-b,v=A=>w*w*w*a[A]+3*w*w*b*r[A]+3*w*b*b*l[A]+b*b*b*f[A];return[v(0),v(1)]})}function yg(t){const s=Math.max(...t.map(([p])=>p)),c=t[0][1],d=Math.max(...t.map(([,p])=>p));return[s+Q.badge.r+Q.badge.inset,c+(d-c)*Q.state.loop.badgeAt]}function bg(t,s){return{x:(t[0]?.[0]??0)-Q.state.loop.w/2-s/2,y:Math.max(...t.map(([,c])=>c))+Q.label.soft}}var m0=Q.state.loop.h+Q.label.soft*2+Q.label.h;function Ro(t,s=[],c=[]){const d=qo(t),p=d<Q.badge.short?Math.min(Q.badge.r+1,d/2):Q.badge.along,a=Q.badge.r*2+Q.badge.inset;for(let r=p;r<=d;r+=1){const l=ja(t,r);if(s.every(([f,u])=>Math.hypot(l[0]-f,l[1]-u)>=a))return l}return G1(t,p,s,c)??ja(t,p)}function G1(t,s,c,d){const p=qo(t),[a,r]=ja(t,s),[l,f]=ja(t,Math.max(0,s-1)),[u,g]=ja(t,Math.min(p,s+1)),b=Math.hypot(u-l,g-f);if(b===0)return;const[w,v]=[-(g-f)/b,(u-l)/b],A=Q.badge.r*2;for(const N of[Q.edge.arrowHalf,0])for(let S=1;S<=A+Q.badge.inset;S++)for(const M of[1,-1]){const D=[a+w*S*M,r+v*S*M];if(c.every(([H,Z])=>Math.max(Math.abs(D[0]-H),Math.abs(D[1]-Z))>=A+1)&&d.every(H=>!Kd(H,ma(D),-N)))return D}}var Yl=t=>t.points.map(([s,c])=>`${Math.round(s*10)},${Math.round(c*10)}`).join(" ");function Mo(t,s,c=(d,p,a)=>Ro(d.points,p,a)){const d=new Map,p=[],a=new Map;for(let r=0;r<s;r++){const l=t.find(w=>w.step===r&&w.points.length>0);if(!l)continue;const f=Yl(l),u=a.get(f);if(u){d.set(r,{point:u,edge:l});continue}const g=t.filter(w=>w.points.length>1&&Yl(w)!==f).map(w=>w.points),b=c(l,p,g);p.push(b),a.set(f,b),d.set(r,{point:b,edge:l})}return d}function Ps(t){const s=(c,d)=>Math.hypot(c.x-d.x,c.y-d.y)<=.5;return t.map(c=>{const d=t.filter(p=>p.step>c.step&&s(p,c)).sort((p,a)=>p.step-a.step)[0];return d?{...c,until:d.step}:c})}var ma=([t,s])=>({x:t-Q.badge.r,y:s-Q.badge.r,w:Q.badge.r*2,h:Q.badge.r*2}),vg=t=>[t.x+Q.state.text,t.y+Q.baseline.mark],fa=t=>In(t)?oe.labelJa:oe.label,Y1={above:"below",below:"above",left:"right",right:"left"};function Fs(t,s){const c=Xe(t.text,fa(t.text))+Q.label.padX*2,d=Q.label.h,p=U1(t.points),a=(p.a[0]+p.b[0])/2,r=(p.a[1]+p.b[1])/2,l=t.side??(p.vertical?"right":"above"),{side:f}=Q.label,u=t.offset??Q.label.offset,g=S=>S==="above"?{x:a-c/2,y:r-u-d/2,w:c,h:d}:S==="below"?{x:a-c/2,y:r+u-d/2,w:c,h:d}:S==="left"?{x:a-f-c,y:r-d/2,w:c,h:d}:{x:a+f,y:r-d/2,w:c,h:d},b=t.base?{...t.base,w:c,h:d}:g(l),w=t.flip?[l,Y1[l]]:[l],v=S=>s.hard.every(M=>To(S,M)>=Q.gap)&&s.soft.every(M=>To(S,M)>=Q.label.soft)&&(s.touch??[]).every(M=>To(S,M)>=Q.label.touch)&&(s.lines??[]).every(M=>!Kd(M,S,-2)),{search:A,searchMax:N}=Q.label;for(let S=0;S<=N;S+=A)for(const M of w){const D=M===l?b:g(M),z=M==="above"?[0,-1]:M==="below"?[0,1]:M==="left"?[-1,0]:[1,0],H=[Math.abs(z[1]),Math.abs(z[0])],Z=t.slide??(M==="above"||M==="below"?c:d*4);for(let j=0;j<=Z;j+=A)for(const R of j===0?[1]:[1,-1]){const _={x:D.x+z[0]*S+H[0]*j*R,y:D.y+z[1]*S+H[1]*j*R,w:c,h:d};if(v(_))return{..._,step:t.step,event:t.event,text:t.text,family:fa(t.text).family,color:t.color}}}return{...b,step:t.step,event:t.event,text:t.text,family:fa(t.text).family,color:t.color}}function xg(t){const s=/^([0-9]+(?:\.[0-9]+)?)%$/u.exec(t.trim());if(s)return Math.min(1,Math.max(0,Number(s[1])/100));const c=/^([0-9]+)\/([0-9]+)$/u.exec(t.trim());if(c&&Number(c[2])>0)return Math.min(1,Math.max(0,Number(c[1])/Number(c[2])))}var wg=(t,s)=>t.strip?.meters?.find(c=>c.field===s);function kg(t,s){if(wg(t,s))return Math.max(Xe(s,oe.fieldName),Q.time.meter.w);let c=0,d=0;for(const a of t.steps)for(const r of a.events)r.type!=="strip"||r.field!==s||(r.value!==void 0&&(c=Math.max(c,Xe(r.value,In(r.value)?oe.fieldValueJa:oe.fieldValue))),r.tag!==void 0&&(d=Math.max(d,Xe(r.tag,oe.tag)+Q.strip.tagPadX*2)));const p=c+(d>0?(c>0?Q.strip.tagGap:0)+d:0);return Math.max(Xe(s,oe.fieldName),p)}var Bd=t=>Math.max(Xe(t.title,oe.fieldName),t.states.length*Q.strip.trail.step);function Us(t,s){if(!t.strip)return 0;const{titleX:c,fieldGap:d,pad:p}=Q.strip,a=c+Xe(t.strip.title,oe.stripTitle)+d,r=[...t.strip.fields.map(l=>kg(t,l)),...s?[Bd(s)]:[]];return a+r.reduce((l,f)=>l+f+d,0)-d+p}function Gs(t,s,c,d,p){if(!t.strip)return;const{titleX:a,fieldGap:r,pad:l,line:f,h:u}=Q.strip,g=a+Xe(t.strip.title,oe.stripTitle)+r,b=[];let w=g,v=0;const A=S=>{w>g&&w+S>d-l&&(w=g,v++);const M={x:s+w,y:c+v*f};return w+=S+r,M};for(const S of t.strip.fields){const M=kg(t,S),D=A(M),z=wg(t,S),H=z?xg(z.line):void 0;b.push({name:S,...D,w:M,...z&&H!==void 0?{meter:{line:H,text:z.line,x:D.x,w:Q.time.meter.w}}:{}})}const N=p?{...p,...A(Bd(p)),w:Bd(p)}:void 0;return{x:s,y:c,w:d,h:u+v*f,title:t.strip.title,fields:b,...N?{trail:N}:{}}}function Id(t,s,c){const d=p=>{p.x+=s,p.y+=c};for(const p of t.boxes)d(p),p.cx+=s,p.cy+=c,p.slot&&d(p.slot),p.iconX!==void 0&&(p.iconX+=s);for(const p of t.regions)p.y+=c,d(p.header);for(const p of t.lifelines)p.x+=s,p.y1+=c,p.y2+=c;for(const p of t.edges)p.points=p.points.map(([a,r])=>[a+s,r+c]),p.settle&&(p.settle=[p.settle[0]+s,p.settle[1]+c]),p.wait&&(p.wait=[p.wait[0]+s,p.wait[1]+c]);for(const p of t.labels)d(p);for(const p of t.paths)p.points=p.points.map(([a,r])=>[a+s,r+c]),p.label&&d(p.label);for(const p of t.ends)p.x+=s,p.y+=c;t.side&&d(t.side);for(const p of t.actions)d(p);for(const p of t.badges)p.x+=s,p.y+=c;if(t.strip){t.strip.y+=c;for(const p of t.strip.fields)p.x+=s,p.y+=c,p.meter&&(p.meter.x+=s);t.strip.trail&&(t.strip.trail.x+=s,t.strip.trail.y+=c)}}function ep(t,s,c){const{inset:d}=Q.badge;for(const a of t){const r=a.type==="swap"||a.type==="action"?a.box:void 0,l=c.boxes.find(f=>f.id===r);if(l)return{step:s,x:l.x,y:l.y,color:l.color}}if(c.strip&&t.some(a=>a.type==="strip"))return{step:s,x:c.strip.x+d,y:c.strip.y+d,color:"slate"};const p=c.boxes[0];return{step:s,x:p.x,y:p.y,color:p.color}}function V1(t){const s=X1(t),c=J1(t,s),d=s.map(()=>({top:0,bottom:0}));let p=g0(t,s,c,d);for(let a=0;a<3&&K1(p,s,c,d);a++)p=g0(t,s,c,d);return p}function X1(t){const s=t.regions??[],c=new Set(s.map(a=>a.id)),d=s.map(a=>({region:a,members:t.boxes.filter(r=>r.region===a.id).map(r=>r.id)})),p=t.boxes.filter(a=>a.region===void 0||!c.has(a.region)).map(a=>a.id);return p.length>0&&d.push({members:p}),d}var Eg=t=>t==="left"||t==="right";function J1(t,s){const c=Q.architecture.columns,d=Ui(t).map(r=>r.edge),p=new Map;s.forEach((r,l)=>{const f=new Set(r.members),u=new Set,g=(M,D)=>M>=0&&M<c&&!u.has(`${M},${D}`),b=(M,D)=>{const z=Math.min(c-1,Math.max(0,M));for(let H=D;;H++)for(let Z=0;Z<c;Z++)for(const j of[z+Z,z-Z])if(g(j,H))return[j,H]},w=(M,D,z)=>{p.set(M,{group:l,col:D,row:z}),u.add(`${D},${z}`)};let v=1;const A=M=>{for(const D of d){const z=D.from===M?D.to:D.to===M?D.from:void 0;if(z===void 0||!f.has(z)||p.has(z))continue;const H=p.get(M),[Z,j]=Eg(D.labelSide)?b(H.col,H.row+1):g(H.col+v,H.row)?[H.col+v,H.row]:b(H.col+v,H.row);w(z,Z,j),A(z)}},N=M=>{for(let D=0;D<d.length;D++){const z=d[D],H=z?.from===M?z.to:z?.to===M?z.from:void 0,Z=H===void 0?void 0:p.get(H);if(Z&&Z.group<l)return{order:D,col:Z.col}}};let S=0;for(;;){const M=r.members.filter(R=>!p.has(R));if(M.length===0)break;const D=M.map(R=>({id:R,anchor:N(R)})).filter(R=>R.anchor!==void 0);D.sort((R,_)=>(R.anchor?.order??0)-(_.anchor?.order??0));const z=D[0]??{id:M[0],anchor:void 0},H=z.anchor?.col??0;S===0&&(v=H>=(c-1)/2?-1:1);const[Z,j]=g(H,0)?[H,0]:b(H,0);w(z.id,Z,j),A(z.id),S++}});const a=[...new Set([...p.values()].map(r=>r.col))].sort((r,l)=>r-l);for(const r of p.values())r.col=a.indexOf(r.col);return p}function Q1(t){const s=[...t.matchAll(/ /g)].map(d=>d.index);if(s.length===0)return[t];const c=s.reduce((d,p)=>Math.abs(p-t.length/2)<Math.abs(d-t.length/2)?p:d);return[t.slice(0,c),t.slice(c+1)]}function Z1(t){const{icon:s,nameY:c,line:d,inset:p}=Q.region,a=Q1(t.name),r=Math.max(s,...a.map(f=>Xe(f,oe.regionName)),Xe(t.note??"",oe.regionNote)),l=c-p+(a.length-1)*d+(t.note?d:0)+Q.gap/2;return{w:r,h:l,lines:a}}function g0(t,s,c,d){const{box:p,region:a,architecture:r,margin:l,gap:f}=Q,u=Hs(t),g=mg(t),b=Ui(t),w=Math.max(1,...[...c.values()].map(k=>k.col+1)),v=Il(t),A=new Map(t.boxes.map(k=>[k.id,Math.max(jo(t,k.id,!0),ec(v.get(k.id),k.icon!==void 0,p.padX))])),N=Array.from({length:w},(k,te)=>Math.max(p.minW,...[...c].filter(([,W])=>W.col===te).map(([W])=>A.get(W)??p.minW))),S=Array.from({length:Math.max(0,w-1)},()=>r.columnGap);for(const{edge:k}of b){const te=c.get(k.from),W=c.get(k.to);if(!te||!W||k.label===void 0||te.group!==W.group||te.row!==W.row||Math.abs(te.col-W.col)!==1||Eg(k.labelSide))continue;const we=Xe(k.label,fa(k.label))+Q.label.padX*2+r.labelRoom*2,Be=Math.min(te.col,W.col);we<=r.maxColumnGap&&(S[Be]=Math.max(S[Be]??0,we))}const M=s.map(k=>k.region?Z1(k.region):void 0),D=Math.max(0,...M.map(k=>k?k.w+a.inset*2:0)),z=[];for(let k=0;k<w;k++)z.push(k===0?l+(D>0?D:a.pad):z[k-1]+N[k-1]+S[k-1]);const H=k=>z[k]+N[k]/2,Z=new Set(b.filter(({edge:k})=>k.from===k.to).map(({edge:k})=>k.from)),j=new Set([...Z].flatMap(k=>{const te=c.get(k);return te?[`${te.group}:${te.row}`]:[]})),R=(k,te)=>j.has(`${k}:${te}`)?m0:0,_=[],P=[];let B=l;s.forEach((k,te)=>{const W=Math.max(1,...k.members.map(st=>(c.get(st)?.row??0)+1)),we=d[te],Be=B+a.pad+we.top,De=[0];for(let st=1;st<W;st++)De.push(De[st-1]+p.h+r.rowGap+R(te,st-1));for(const st of k.members){const St=c.get(st),Pt=t.boxes.find(ln=>ln.id===st),lt=A.get(st)??p.minW,Vt=H(St.col),nn=Be+De[St.row];_.push({id:st,name:Pt?.name??st,...Pt?.sub!==void 0?{sub:Pt.sub}:{},...Pt?.icon!==void 0?{icon:Pt.icon}:{},color:u.get(st)??"slate",x:Vt-lt/2,y:nn,w:lt,h:p.h,cx:Vt,cy:nn+p.h/2})}const Te=Be+De[W-1]+p.h+R(te,W-1),je=M[te],Le=Math.max(Te+a.pad+we.bottom-B,je?je.h+a.inset*2:0,k.region?a.minH:0);P.push({group:te,y:B,h:Le,rows:W}),B+=Le+a.gap});const ne=B-a.gap;for(const k of _)tc(k,v.get(k.id));const ae=new Map(_.map(k=>[k.id,k])),fe=k=>P[c.get(k)?.group??0],pe=(k,te,W)=>{for(let we=1;we<k.length;we++){const[Be,De]=k[we-1],[Te,je]=k[we];if(Math.min(Be,Te)<=te.x+te.w+W&&Math.max(Be,Te)>=te.x-W&&Math.min(De,je)<=te.y+te.h+W&&Math.max(De,je)>=te.y-W)return!0}return!1},Ae=[...Z].flatMap(k=>{const te=ae.get(k);return te?[{x:te.x,y:te.y+te.h,w:te.w,h:m0}]:[]}),C=k=>Ae.some(te=>pe(k,te,0)),$=(k,te,W)=>_.some(we=>we.id!==te&&we.id!==W&&pe(k,we,Q.label.search))||C(k),V=k=>{const te=ae.get(k),W=fe(k),we=c.get(k),Be=te.y+te.h+(we?R(we.group,we.row):0);return(we?.row??0)<W.rows-1?Be+r.rowGap/2:Math.min(Be+a.pad/2,W.y+W.h-Q.edge.inset)},X=k=>{const te=ae.get(k),W=fe(k);return(c.get(k)?.row??0)>0?te.y-r.rowGap/2:Math.max(te.y-a.pad/2,W.y+Q.edge.inset)},ie=Q.edge.inset,T=(k,te)=>te?z[k]+N[k]+(S[k]??r.columnGap)/2:z[k]-(S[k-1]??r.columnGap)/2,G=(k,te)=>{const W=ae.get(k),we=ae.get(te);if(k===te)return Wd(W);const Be=c.get(k),De=c.get(te);if(Be.group===De.group&&Be.row===De.row){const lt=we.cx>W.cx,Vt=[[lt?W.x+W.w:W.x,W.cy],[lt?we.x-ie:we.x+we.w+ie,we.cy]];if(!$(Vt,k,te))return Vt;const nn=V(k),ln=[[W.cx,W.y+W.h],[W.cx,nn],[we.cx,nn],[we.cx,we.y+we.h+ie]];if(!C(ln))return ln;const Ln=X(k),cn=[[W.cx,W.y],[W.cx,Ln],[we.cx,Ln],[we.cx,we.y-ie]];return C(cn)?ln:cn}const Te=we.cy>W.cy,je=[W.cx,Te?W.y+W.h:W.y],Le=[we.cx,Te?we.y-ie:we.y+we.h+ie];if(Be.col===De.col){const lt=[je,Le];if(!$(lt,k,te))return lt;const Vt=T(Be.col,!0);return[[W.x+W.w,W.cy],[Vt,W.cy],[Vt,we.cy],[we.x+we.w+ie,we.cy]]}const st=we.cx>W.cx,St=Te?V(k):X(k),Pt=[[je,[W.cx,we.cy],[st?we.x-ie:we.x+we.w+ie,we.cy]],[[st?W.x+W.w:W.x,W.cy],[we.cx,W.cy],Le],[je,[W.cx,St],[we.cx,St],Le]];if(Z.has(k)||Z.has(te)){const lt=T(Be.col,st),Vt=T(De.col,!st),nn=[[st?W.x+W.w:W.x,W.cy],[lt,W.cy]],ln=[st?we.x-ie:we.x+we.w+ie,we.cy];Pt.push([...nn,[lt,we.cy],ln],[...nn,[lt,St],[we.cx,St],Le],[je,[W.cx,St],[Vt,St],[Vt,we.cy],ln],[...nn,[lt,St],[Vt,St],[Vt,we.cy],ln])}return Pt.find(lt=>!$(lt,k,te))??Pt[2]},re=b.map(({step:k,event:te,edge:W})=>({step:k,event:te,from:W.from,to:W.to,points:G(W.from,W.to),color:Gi(W,u),carry:W.carry}));Hi(re,ae,v);const Y=new Map;for(const k of re){if(k.points.length!==2||!re.some(Te=>Te.from===k.to&&Te.to===k.from&&Te.points.length===2))continue;const[W,we]=k.points,Be=Math.abs(we[1]-W[1])<Math.abs(we[0]-W[0]),De=(k.from<k.to?1:-1)*Q.edge.parallel;k.points=k.points.map(([Te,je])=>Be?[Te,je+De]:[Te+De,je]),Y.set(k,Be?De>0?"below":"above":De>0?"right":"left")}const xe=[];s.forEach((k,te)=>{const W=P[te],we=M[te];!k.region||!we||xe.push({id:k.region.id,lines:we.lines,...k.region.note!==void 0?{note:k.region.note}:{},...k.region.icon!==void 0?{icon:k.region.icon}:{},color:g.get(k.region.id)??"slate",x:l,y:W.y,w:0,h:W.h,header:{x:l+a.inset,y:W.y+a.inset,w:we.w,h:we.h}})});const ke=(k,te,W)=>k.from===k.to?yg(k.points):Ro(k.points,te,W),ze=Mo(re,t.steps.length,ke),Fe=[];for(const k of re){const te=t.steps[k.step]?.events[k.event];if(te?.type!=="edge"||te.label===void 0)continue;const W=[...ze].filter(([Te])=>Te<=k.step).map(([,Te])=>ma(Te.point)),we=[...xe.map(Te=>Te.header),...Fe.filter(Te=>Te.step===k.step)],Be=te.labelSide??Y.get(k),De=k.from===k.to?{side:"below",base:bg(k.points,Xe(te.label,fa(te.label))+Q.label.padX*2)}:void 0;Fe.push(Fs({step:k.step,event:k.event,text:te.label,points:k.points,color:k.color,...De??(Be?{side:Be}:{flip:!0})},{hard:_,soft:we,touch:W}))}const Re={kind:"architecture",width:0,height:0,regions:xe,boxes:_,lifelines:[],edges:re,labels:Fe,actions:[],badges:[],paths:[],ends:[]},Qe=Fe.length>0?Math.max(0,l+Q.label.soft-Math.min(...Fe.map(k=>k.x))):0;Qe>0&&Id(Re,Qe,0);const K=Math.max(..._.map(k=>k.x+k.w+a.pad),...Fe.map(k=>k.x+k.w+Q.label.soft),...re.flatMap(k=>k.points.map(te=>te[0]+a.pad))),U=Math.max(K+l,Us(t)+l*2);for(const k of xe)k.w=U-l*2;const Ne=Math.max(ne,...Fe.map(k=>k.y+k.h)),F=Gs(t,l,Ne+f,U-l*2);Re.width=U,Re.height=(F?F.y+F.h:Ne)+l,F&&(Re.strip=F);const be=Mo(re,t.steps.length,ke);return Re.badges=Ps(t.steps.map((k,te)=>{const W=be.get(te);return W?{step:te,x:W.point[0],y:W.point[1],color:W.edge.color}:ep(k.events,te,Re)})),Re}function K1(t,s,c,d){let p=!1;const a=Q.label.soft;for(const r of t.labels){const l=t.edges.find(A=>A.step===r.step&&A.event===r.event),f=l&&c.get(l.from),u=l&&c.get(l.to);if(!f||!u||f.group!==u.group||!s[f.group]?.region)continue;const g=t.regions.find(A=>A.id===s[f.group]?.region?.id),b=d[f.group];if(!g||!b)continue;const w=g.y+a-r.y,v=r.y+r.h-(g.y+g.h-a);w>0&&(b.top+=w,p=!0),v>0&&(b.bottom+=v,p=!0)}return p}var W1=t=>t.kind==="git";function I1(t){const s=(t.git?.branches??[]).map(_=>_.id),c=_=>{s.includes(_)||s.push(_)};for(const _ of t.steps)for(const P of _.events)(P.type==="commit"||P.type==="branch")&&c(P.branch);const d=new Map(s.map(_=>[_,null]));let p=null,a=null;const r=[],l=new Map,f=[],u=[],g=[],b=new Map,w=new Map,v=new Map,A=[...s,pa],N=new Map(A.map(_=>[_,[]])),S=[],M=_=>_===pa?a===null?p:null:d.get(_)??null,D=_=>{const P=b.get(_)??[],B=P.indexOf(null);return B<0?P.length:B},z=(_,P,B,ne)=>{const ae=new Map(A.map(C=>[C,M(C)])),fe=p;B();const Ae=A.filter(C=>ae.get(C)!==M(C)).map(C=>{const $=v.get(C);return $&&(b.get($.commit)[$.row]=null,v.delete(C)),{ref:C,slot:$}});for(const{ref:C,slot:$}of Ae){const V=$??(C===pa&&fe!==null?{commit:fe,row:D(fe)}:void 0),X=M(C);let ie;if(X!==null){ie={commit:X,row:D(X)};const T=b.get(X)??[];T[ie.row]=C,b.set(X,T),w.set(X,Math.max(w.get(X)??0,T.filter(G=>G!==null).length)),v.set(C,ie)}u.push({ref:C,step:_,event:P,...V?{from:V}:{},...ie?{to:ie}:{},line:C===ne})}},H=(_,P)=>{const B=new Set,ne=[...d.values(),p].filter(ae=>ae!==null);for(;ne.length>0;){const ae=ne.pop();B.has(ae)||(B.add(ae),ne.push(...l.get(ae)?.parents??[]))}for(const ae of r)!B.has(ae.id)&&ae.orphan===void 0&&(ae.orphan={step:_,event:P})};t.steps.forEach((_,P)=>{_.events.forEach((B,ne)=>{if(B.type==="commit")j(B,P,ne);else if(B.type==="branch"){if(!l.has(B.from))return;Z(B.from)!==B.branch&&f.push({kind:"branch",from:B.from,to:B.branch,step:P,event:ne}),z(P,ne,()=>{d.set(B.branch,B.from),a=B.branch,p=B.from})}else if(B.type==="edge"){const ae=B.from;if(ae!==pa&&!d.has(ae)||!l.has(B.to))return;z(P,ne,()=>{if(ae===pa){a=null,p=B.to;return}d.set(ae,B.to),a===ae?p=B.to:a===null&&p===B.to&&(a=ae)},ae)}else return;H(P,ne)});for(const B of A)N.get(B)?.push(B===pa?p:d.get(B)??null);S.push(a);for(const B of A){const ne=v.get(B);ne&&g.push({ref:B,step:P,slot:ne})}});function Z(_){return l.get(_)?.branch}function j(_,P,B){if(l.has(_.id))return;const ne=_.copy!==void 0&&l.has(_.copy)?_.copy:void 0,ae=ne!==void 0&&a===null&&p!==null?p:d.get(_.branch)??null,fe=_.merge!==void 0&&_.merge!==_.branch?d.get(_.merge)??void 0:void 0,pe=[...new Set([ae,fe].filter($=>$!=null))],Ae={id:_.id,branch:_.branch,parents:pe,...fe!==void 0&&fe!==ae?{joined:fe}:{},...ne!==void 0?{copy:ne}:{},..._.hash!==void 0?{hash:_.hash}:{},..._.note!==void 0?{note:_.note}:{},step:P,event:B};r.push(Ae),l.set(Ae.id,Ae);for(const $ of pe)f.push({kind:"parent",from:$,to:Ae.id,step:P,event:B});ne!==void 0&&f.push({kind:"copy",from:ne,to:Ae.id,step:P,event:B});const C=a===null&&p===null;z(P,B,()=>{ne===void 0?(d.set(_.branch,Ae.id),a===_.branch&&(p=Ae.id)):a===null&&(p=Ae.id),C&&(a=_.branch,p=Ae.id)})}const R=A.map(_=>({name:_,at:N.get(_)??[],..._===pa?{attached:S}:{}}));return{branches:s,made:r,links:f,moves:u,refs:R,tags:g,rows:w}}function Vl(t,s,c,d){const p=Q.git.samples;return Array.from({length:p},(a,r)=>{const l=(r+1)/p,f=1-l,u=g=>f*f*f*t[g]+3*f*f*l*s[g]+3*f*l*l*c[g]+l*l*l*d[g];return[u(0),u(1)]})}function ex(t,s){return Math.abs(t[1]-s[1])<.5?[t,s]:t[1]>s[1]?[t,[t[0],s[1]],s]:[t,[s[0],t[1]],s]}function y0(t,s,c){const d=c>t.cy?1:-1,p=[t.cx,t.cy+d*t.r],a=Math.max(0,Math.min(Q.git.turn,s-t.cx)),r=[t.cx+a,c],l=Vl(p,[p[0],p[1]+(c-p[1])*.7],[t.cx+a*.2,c],r);return[p,...l,...s>r[0]?[[s,c]]:[]]}function tx(t,s){const c=s.cy<t.cy?1:-1,d=[t.cx+t.r,t.cy],p=[s.cx,s.cy+c*s.r],a=Math.max(0,Math.min(Q.git.turn,s.cx-d[0])),r=[s.cx-a,t.cy],l=Vl(r,[s.cx-a*.2,t.cy],[s.cx,p[1]+(t.cy-p[1])*.7],p);return[d,...r[0]>d[0]?[r]:[],...l]}function nx(t,s){if(Math.abs(t.cy-s.cy)<.5){const r=t.cy-t.r,l=Q.git.turn*.7;return[[t.cx,r],...Vl([t.cx,r],[t.cx,r-l],[s.cx,r-l],[s.cx,r])]}const c=s.cy<t.cy?-1:1,d=[t.cx,t.cy+c*t.r],p=[s.cx,s.cy-c*s.r],a=(p[1]-d[1])*.5;return[d,...Vl(d,[d[0],d[1]+a],[p[0],p[1]-a],p)]}function ax(t){const{margin:s,gap:c,box:d,region:p,git:a,carrier:r}=Q,l=I1(t),f=new Map((t.git?.branches??[]).map(K=>[K.id,K.note])),u=new Map(l.branches.map((K,U)=>[K,U])),g=K=>a.colors[(u.get(K)??0)%a.colors.length],b=new Map,w=new Map;for(const K of l.made){const U=Math.max(0,...K.parents.map(Ne=>(b.get(Ne)??-1)+1),(w.get(K.branch)??-1)+1);b.set(K.id,U),w.set(K.branch,U)}const v=K=>[...K.hash!==void 0?[{text:K.hash,style:oe.gitHash}]:[],...K.note!==void 0?[{text:K.note,style:oe.gitNote}]:[]],A=K=>Math.max(0,...v(K).map(U=>Xe(U.text,U.style))),N=K=>Xe(K,In(K)?oe.carrierJa:oe.carrier)+r.tagPadX*2,S=Math.max(0,...l.refs.map(K=>N(K.name))),M=Math.max(a.pitch,...l.made.map(K=>A(K)+a.textGap),S+a.textGap),D=l.branches.map(K=>({w:Math.max(p.icon,Xe(K,oe.regionName),Xe(f.get(K)??"",oe.regionNote))})),z=s+p.inset+Math.max(0,...D.map(K=>K.w)),H=Math.max(a.r,...l.made.filter(K=>b.get(K.id)===0&&u.get(K.branch)===0).map(K=>A(K)/2),S/2),Z=Math.max(a.x0,z+c+H),j=new Set(l.moves.flatMap(K=>{const U=t.steps[K.step]?.events[K.event];return K.line&&K.to&&U?.type==="edge"&&U.label!==void 0?[l.made.find(Ne=>Ne.id===K.to?.commit)?.branch??""]:[]})),R=K=>Math.max(0,...l.made.filter(U=>U.branch===K).map(U=>(l.rows.get(U.id)??0)-2))*a.row,_=l.made.some(K=>u.get(K.branch)===0&&v(K).length>0),P=[];let B=s;l.branches.forEach((K,U)=>{const Ne=U===0,F=Ne&&_?a.tagTop:a.tag,be=B+(Ne?a.topLine-(a.tagTop-F):a.line)+R(K),k=be-B+(Ne?a.topBelow:j.has(K)?a.below:a.bare);P.push({id:K,x:s,y:B,w:0,h:k,line:be,color:g(K),tagBase:F}),B+=k+p.gap});const ne=B-p.gap,ae=new Map(P.map(K=>[K.id,K])),fe=l.made.map(K=>{const U=ae.get(K.branch),Ne=u.get(K.branch)===0,F=Z+M*(b.get(K.id)??0)+(Ne?0:M/2),be=U.line,k=v(K),te=k.map((De,Te)=>Ne?be-a.above-(k.length-1-Te)*a.lineStep:be+a.under+Te*a.lineStep),W=k.map((De,Te)=>oa(De.text,F,te[Te],De.style,"middle")),we=W.length===0?void 0:{...sx(W),lines:k.map(De=>De.text),baselines:te},Be=K.copy!==void 0?g(l.made.find(De=>De.id===K.copy)?.branch??K.branch):g(K.branch);return{id:K.id,branch:K.branch,color:Be,cx:F,cy:be,r:a.r,step:K.step,event:K.event,parents:K.parents,...K.copy!==void 0?{copy:K.copy}:{},...K.hash!==void 0?{hash:K.hash}:{},...K.note!==void 0?{note:K.note}:{},...we?{text:we}:{},...K.orphan?{orphan:K.orphan.step,orphanEvent:K.orphan.event}:{}}}),pe=new Map(fe.map(K=>[K.id,K])),Ae=l.links.flatMap(K=>{const U=pe.get(K.from);if(!U)return[];if(K.kind==="branch"){if(!l.made.some(te=>te.branch===K.to))return[];const k=ae.get(K.to);return[{...K,points:y0(U,U.cx+a.turn,k.line),color:g(K.to)}]}const Ne=pe.get(K.to),F=l.made.find(k=>k.id===K.to);let be;return K.kind==="copy"?be=nx(U,Ne):Math.abs(U.cy-Ne.cy)<.5?be=[[U.cx+U.r,U.cy],[Ne.cx-Ne.r,Ne.cy]]:F?.joined===K.from?be=tx(U,Ne):be=y0(U,Ne.cx-Ne.r,Ne.cy),[{...K,points:be,color:Ne.color}]}),C=(K,U)=>{const Ne=pe.get(U.commit),F=ae.get(Ne.branch)?.tagBase??a.tag,be=N(K);return{x:Ne.cx-be/2,y:Ne.cy-F-U.row*a.row-r.tagH/2,w:be,h:r.tagH}},$=K=>[K.x+K.w/2,K.y+K.h/2],V=l.moves.map(K=>{const U=K.from?C(K.ref,K.from):void 0,Ne=K.to?C(K.ref,K.to):void 0,F=t.steps[K.step]?.events[K.event],be=K.line&&F?.type==="edge"&&F.carry.kind!=="none"&&!(F.carry.kind==="tag"&&F.carry.text===F.from);return{ref:K.ref,step:K.step,event:K.event,...U?{from:U}:{},...Ne?{to:Ne}:{},...K.to?{target:K.to.commit}:{},...be?{carried:!0}:{},...K.line&&U&&Ne?{line:ex($(U),$(Ne))}:{},color:"slate"}}),X=l.tags.map(K=>({...C(K.ref,K.slot),ref:K.ref,step:K.step})),ie=Hs(t),T=Math.max(Z,...fe.flatMap(K=>[K.cx+K.r,...K.text?[K.text.x+K.text.w]:[]]),...X.map(K=>K.x+K.w),...V.flatMap(K=>[K.from,K.to].flatMap(U=>U?[U.x+U.w]:[]))),G=T+a.boxGap,re=(P[1]??P[0])?.line??s+d.h/2,Y=t.boxes.map((K,U)=>{const Ne=jo(t,K.id,!0),F=re+U*(d.h+c);return{id:K.id,name:K.name,...K.sub!==void 0?{sub:K.sub}:{},...K.icon!==void 0?{icon:K.icon}:{},color:ie.get(K.id)??"slate",x:G,y:F-d.h/2,w:Ne,h:d.h,cx:G+Ne/2,cy:F}}),xe=P.map((K,U)=>{const Ne=f.get(K.id);return{id:K.id,lines:[K.id],...Ne!==void 0?{note:Ne}:{},icon:"branch",color:K.color,x:K.x,y:K.y,w:0,h:K.h,header:{x:K.x+p.inset,y:K.y+p.inset,w:D[U]?.w??0,h:p.nameY-p.inset+(Ne!==void 0?p.line:0)+c/2}}}),ke={kind:"git",width:0,height:0,regions:xe,boxes:Y,lifelines:[],edges:[],labels:[],actions:[],badges:[],paths:[],ends:[],lanes:P,commits:fe,links:Ae,tags:X,refs:l.refs,moves:V};ke.badges=v0(t,ke),ke.labels=rx(t,ke);const ze=Math.max(T,...Y.map(K=>K.x+K.w),...ke.labels.map(K=>K.x+K.w))+p.pad,Fe=Math.max(ze+s,Us(t)+s*2);for(const K of xe)K.w=Fe-s*2;for(const K of P)K.w=Fe-s*2;const Re=Math.max(ne,...Y.map(K=>K.y+K.h),...ke.labels.map(K=>K.y+K.h)),Qe=Gs(t,s,Re+c,Fe-s*2);return ke.width=Fe,ke.height=(Qe?Qe.y+Qe.h:Re)+s,Qe&&(ke.strip=Qe),ke.badges=v0(t,ke),ke}function sx(t){const s=Math.min(...t.map(d=>d.x)),c=Math.min(...t.map(d=>d.y));return{x:s,y:c,w:Math.max(...t.map(d=>d.x+d.w))-s,h:Math.max(...t.map(d=>d.y+d.h))-c}}function ox(t,s){return[...t.links.filter(d=>d.step===s&&d.kind!=="copy").map(d=>({event:d.event,points:d.points,color:d.color})),...t.moves.flatMap(d=>{const p=t.commits.find(a=>a.id===d.target);return d.step===s&&d.line&&p?[{event:d.event,target:p,color:p.color}]:[]})].sort((d,p)=>d.event-p.event)[0]}function b0(t,s,c){const{r:d,inset:p}=Q.badge,a=t.r+p+d,r=d*2+p;return[[t.cx+a,t.cy],[t.cx,t.cy+a],[t.cx-a,t.cy],[t.cx,t.cy-a]].find(f=>s.every(([u,g])=>Math.hypot(f[0]-u,f[1]-g)>=r)&&c.every(u=>To(ma(f),u)>=Q.label.touch))}function ix(t,s,c){const{r:d,inset:p,along:a,short:r}=Q.badge,l=qo(t),f=l<r?Math.min(d+1,l/2):a,u=d*2+p;for(let g=f;g<=l;g+=1){const b=ja(t,g),w=ma(b);if(s.every(([v,A])=>Math.hypot(b[0]-v,b[1]-A)>=u)&&c.every(v=>To(w,v)>=Q.label.touch))return b}}function v0(t,s){const{inset:c}=Q.badge,d=[],p=[...s.links.map(l=>l.points),...s.moves.flatMap(l=>l.line?[l.line]:[])],a=[],r=[...s.tags,...s.commits.flatMap(l=>[{x:l.cx-l.r,y:l.cy-l.r,w:l.r*2,h:l.r*2},...l.text?[l.text]:[]])];return t.steps.forEach((l,f)=>{const u=ox(s,f),g=u?.target?b0(u.target,d,r):void 0;if(u&&(u.points||g)){const S=u.points,M=g??(S?ix(S,d,r)??Ro(S,d,p.filter(D=>D!==S)):[0,0]);d.push(M),a.push({step:f,x:M[0],y:M[1],color:u.color});return}const b=l.events.flatMap(S=>S.type==="swap"||S.type==="action"?[S.box]:[]).map(S=>s.boxes.find(M=>M.id===S))[0];if(b){a.push({step:f,x:b.x,y:b.y,color:b.color});return}if(s.strip&&l.events.some(S=>S.type==="strip")){a.push({step:f,x:s.strip.x+c,y:s.strip.y+c,color:"slate"});return}const w=s.commits.find(S=>S.id===s.refs[0]?.at[f]),v=w?b0(w,d,r):void 0;if(w&&v){d.push(v),a.push({step:f,x:v[0],y:v[1],color:w.color});return}const A=a[a.length-1],N=s.lanes[0];a.push(A?{...A,step:f}:{step:f,x:(N?.x??0)+(N?.w??0)-c-Q.badge.r,y:(N?.y??0)+c+Q.badge.r,color:N?.color??"slate"})}),Ps(a)}function rx(t,s){const c=Q.git,d=[],p=s.commits.map(l=>({x:l.cx-l.r,y:l.cy-l.r,w:l.r*2,h:l.r*2})),a=s.commits.flatMap(l=>l.text?[l.text]:[]),r=s.regions.map(l=>l.header);for(const l of s.moves){const f=t.steps[l.step]?.events[l.event];if(f?.type!=="edge"||f.label===void 0||!l.line)continue;const u=s.commits.find(D=>D.id===f.to);if(!u)continue;const g=s.lanes[0]?.id===u.branch,b=Xe(f.label,In(f.label)?oe.labelJa:oe.label)+Q.label.padX*2,[w]=l.line.reduce((D,z)=>[D[0]+z[0]/l.line.length,0],[0,0]),v=Math.max(0,...s.tags.filter(D=>D.step===l.step&&Math.abs(D.x+D.w/2-u.cx)<.5).map(D=>u.cy-D.y)),A=f.labelSide??(g?"above":"below"),N=f.labelSide!==void 0?void 0:g?{x:w-b/2,y:u.cy-Math.max(v,(s.lanes[0]?.tagBase??c.tag)+Q.carrier.tagH/2)-Q.label.soft-Q.label.h}:{x:w-b/2,y:u.cy+c.labelUnder},S=s.badges.filter(D=>D.step<=l.step).map(D=>ma([D.x,D.y])),M=s.tags.filter(D=>D.step===l.step);d.push(Fs({step:l.step,event:l.event,text:f.label,points:l.line,color:l.color,side:A,...N?{base:N}:{}},{hard:[...p,...s.boxes],soft:[...a,...M,...r,...d.filter(D=>D.step===l.step)],touch:S}))}return d}var Ag=t=>t.kind==="lineup";function lx(t,s,c){const d=t.steps.flatMap(p=>p.events.flatMap(a=>a.type==="swap"&&a.box===s?[Xe(a.text,oe.boxSubStrong)]:[]));return c===void 0?d:[Xe(c,oe.boxSub),...d]}function cx(t){const{margin:s,gap:c,lineup:d}=Q,p=t.lineup?.items??[],a=new Set(p.map(P=>P.id)),r=Math.max(d.chip.w,...p.map(P=>P.label===void 0?0:Xe(P.label,oe.chip)+d.chip.padX*2)),l=r+d.chip.gap,f=l*Pl-d.chip.gap,u=t.boxes.map(P=>Xe(P.name,oe.boxName)+d.textGap+Math.max(0,...lx(t,P.id,P.sub))),g=Math.max(f+d.padX*2,...u.map(P=>P+d.padX*2),Us(t)),b=Hs(t),w=t.boxes.map((P,B)=>{const ne=s+B*(d.h+c),ae=ne+d.textY,fe=s+g-d.padX;return{id:P.id,name:P.name,...P.sub!==void 0?{sub:P.sub}:{},color:b.get(P.id)??"slate",x:s,y:ne,w:g,h:d.h,cx:s+g/2,cy:ne+d.h/2,title:{...oa(P.name,s+d.padX,ae,oe.boxName),text:P.name,baseline:ae},...P.sub!==void 0?{note:{...oa(P.sub,fe-Xe(P.sub,oe.boxSub),ae,oe.boxSub),text:P.sub,baseline:ae}}:{},noteRight:fe,track:{x:s+d.padX,y:ne+d.trackY,w:f,h:d.chip.h}}}),v=new Map(w.map(P=>[P.id,P])),A=[],N=[],S=[],M=[],D=new Map,z=new Map;let H;t.steps.forEach((P,B)=>{const ne=[...D.values()].flat();P.events.forEach((ae,fe)=>{if(ae.type!=="line"&&ae.type!=="seal"&&ae.type!=="open"&&ae.type!=="pick"&&ae.type!=="stamp")return;const pe=v.get(ae.box);if(!pe)return;const Ae={step:B,event:fe};if(ae.type==="seal"&&!z.has(pe.id)){const{over:C}=d.seal,$={...Ae,lane:pe.id,x:pe.track.x-C,y:pe.track.y-C,w:pe.track.w+C*2,h:pe.track.h+C*2};N.push($),z.set(pe.id,$)}else if(ae.type==="open"){const C=z.get(pe.id);C&&(C.until=Ae),z.delete(pe.id)}else if(ae.type==="pick"&&H!==pe.id)M.push({...Ae,lane:pe.id}),H=pe.id;else if(ae.type==="stamp"){const C=Xe(ae.text,oe.stamp)+d.stamp.padX*2;S.push({...Ae,lane:pe.id,text:ae.text,x:pe.x+pe.w-d.padX-C,y:pe.track.y+(pe.track.h-d.stamp.h)/2,w:C,h:d.stamp.h})}else if(ae.type==="line"){const C=D.get(pe.id)??[],V=[...new Set(ae.items)].filter(X=>a.has(X)).slice(0,Pl).map((X,ie)=>{const T=C.find(xe=>xe.id===X);if(T?.index===ie)return T;const G=ne.filter(xe=>xe.id===X),re=T??G.find(xe=>xe.lane===H)??G.at(-1),Y={...Ae,id:X,lane:pe.id,index:ie,x:pe.track.x+l*ie,y:pe.track.y,w:r,h:d.chip.h,...re?{from:[re.x,re.y]}:{}};return A.push(Y),Y});for(const X of C)V.includes(X)||(X.until=Ae);D.set(pe.id,V)}})});const Z={kind:"lineup",width:0,height:0,regions:[],boxes:w,lifelines:[],edges:[],labels:[],actions:[],badges:[],paths:[],ends:[],lanes:w,chips:A,seals:N,stamps:S,picks:M},j=Math.max(...w.map(P=>P.y+P.h),s),R=g+s*2,_=Gs(t,s,j+c,R-s*2);return Z.width=R,Z.height=(_?_.y+_.h:j)+s,_&&(Z.strip=_),Z.badges=ux(t,Z),Z}function ux(t,s){const{inset:c}=Q.badge,d=[],p=(a,r,l,f)=>{d.push({step:a,x:r,y:l,color:f})};return t.steps.forEach((a,r)=>{const l=a.events.flatMap(u=>"box"in u?[u.box]:[]).flatMap(u=>s.lanes.filter(g=>g.id===u))[0];if(l){p(r,l.x,l.track.y+l.track.h/2,l.color);return}const f=d[d.length-1];s.strip&&a.events.some(u=>u.type==="strip")?p(r,s.strip.x+c,s.strip.y+c,"slate"):f?d.push({...f,step:r}):p(r,Q.margin,Q.margin,s.lanes[0]?.color??"slate")}),Ps(d)}function dx(t){const{box:s,sequence:c,label:d,margin:p,gap:a}=Q,r=Hs(t),l=t.sequence?.lifelines??[],f=[...l,...t.boxes.map(C=>C.id).filter(C=>!l.includes(C))],u=new Map(f.map((C,$)=>[C,$])),g=f.map(C=>jo(t,C,!1)),b=g.slice(1).map((C,$)=>g[$]/2+C/2+c.columnGap),w=[];for(const C of t.steps)for(const $ of C.events){if($.type!=="edge"||$.label===void 0)continue;const V=u.get($.from)??0,X=u.get($.to)??0,ie=Xe($.label,fa($.label))+d.padX*2;V===X?V<b.length&&w.push({from:V,to:V+1,need:c.selfW+d.side+ie+c.labelRoom}):w.push({from:Math.min(V,X),to:Math.max(V,X),need:ie+c.labelRoom*2})}w.sort((C,$)=>C.to-C.from-($.to-$.from));for(const{from:C,to:$,need:V}of w){let X=0;for(let T=C;T<$;T++)X+=b[T]??0;if(X>=V)continue;const ie=(V-X)/($-C);for(let T=C;T<$;T++)b[T]=(b[T]??0)+ie}const v=[];f.forEach((C,$)=>v.push($===0?p+g[0]/2:v[$-1]+b[$-1]));const A=f.map((C,$)=>{const V=t.boxes.find(T=>T.id===C),X=g[$],ie=v[$];return{id:C,name:V?.name??C,...V?.sub!==void 0?{sub:V.sub}:{},...V?.icon!==void 0?{icon:V.icon}:{},color:r.get(C)??"slate",x:ie-X/2,y:p,w:X,h:s.h,cx:ie,cy:p+s.h/2}}),N=p+s.h,S=[],M=[],D=[];let z=N+c.firstRow,H=0,Z=!0;t.steps.forEach((C,$)=>{C.events.forEach((V,X)=>{if(V.type!=="edge"&&V.type!=="action")return;let ie,T;if(V.type==="edge"){const G=V.labelSide??"above",re=V.from===V.to,Y=V.label!==void 0;ie=Y&&G==="above"?c.labelOffset+d.h/2:a,T=re?c.selfH+a:Y&&G==="below"?c.labelOffset+d.h/2:a}else ie=Q.action.h/2,T=Q.action.h/2;if(z=Z?z+ie:z+Math.max(c.minPitch,H+c.rowGap+ie)+(X===0&&$>0?c.stepGap:0),Z=!1,H=T,V.type==="edge"){const G=v[u.get(V.from)??0],re=v[u.get(V.to)??0],Y=Math.sign(re-G)||1,xe=G===re?[[G,z],[G+c.selfW,z],[G+c.selfW,z+c.selfH],[G+Q.edge.inset,z+c.selfH]]:[[G,z],[re-Y*Q.edge.inset,z]],ke=Gi(V,r),ze={};if(V.carry.kind!=="none"){const Fe=Q.slot.lifeline+Oo(V.carry)[0],[Re,Qe]=xe,[K,U]=xe.slice(-2),Ne=Math.sign(Qe[0]-Re[0])||1,F=Math.sign(U[0]-K[0])||-1;ze.wait=[G-Ne*Fe,Re[1]],ze.settle=[re+F*Fe,U[1]]}S.push({step:$,event:X,from:V.from,to:V.to,points:xe,color:ke,carry:V.carry,...ze}),V.label!==void 0&&D.push({step:$,event:X,text:V.label,points:xe,color:ke,...V.labelSide?{side:V.labelSide}:G===re?{side:"right"}:{},offset:c.labelOffset})}else{const G=v[u.get(V.box)??0],re=Xe(V.label,oe.action)+Q.action.padX*2;M.push({step:$,event:X,box:V.box,text:V.label,color:r.get(V.box)??"slate",x:G+Q.badge.r+4,y:z-Q.action.h/2,w:re,h:Q.action.h})}})});const j=(Z?N:z+H)+c.tail,R=f.map((C,$)=>({id:C,x:v[$],y1:N,y2:j})),_=Mo(S,t.steps.length),P=[];for(const C of D){const $=[..._].filter(([X])=>X<=C.step).map(([,X])=>ma(X.point)),V=[...P.filter(X=>X.step===C.step),...M];P.push(Fs(C,{hard:A,soft:V,touch:$}))}const B={kind:"sequence",width:0,height:0,regions:[],boxes:A,lifelines:R,edges:S,labels:P,actions:M,badges:[],paths:[],ends:[]},ne=[...A.map(C=>C.x),...P.map(C=>C.x),...M.map(C=>C.x)],ae=Math.max(0,p-Math.min(...ne));ae>0&&Id(B,ae,0);const fe=[...A.map(C=>C.x+C.w),...P.map(C=>C.x+C.w),...M.map(C=>C.x+C.w),...S.flatMap(C=>C.points.map($=>$[0]))],pe=Math.max(Math.max(...fe)+p,Us(t)+p*2),Ae=Gs(t,p,j+a,pe-p*2);return B.width=pe,B.height=(Ae?Ae.y+Ae.h:j)+p,Ae&&(B.strip=Ae),B.badges=px(t,B),B}function px(t,s){const c=Mo(s.edges,t.steps.length),d=t.steps.map((p,a)=>{const r=c.get(a);if(r)return{step:a,x:r.point[0],y:r.point[1],color:r.edge.color};const l=s.actions.find(u=>u.step===a),f=l&&s.lifelines.find(u=>u.id===l.box);return l&&f?{step:a,x:f.x,y:l.y+l.h/2,color:l.color}:ep(p.events,a,s)});return Ps(d)}var _g=t=>Ri.includes(t);function hx(t){const s=[],c=d=>{!_g(d)&&!s.includes(d)&&s.push(d)};for(const{edge:d}of Ui(t))c(d.from),c(d.to);return s}var fx=(t,s)=>t.from===s.from&&t.to===s.to;function mx(t,s){const{box:c,state:d,margin:p,gap:a}=Q,r=Q.edge.inset,l=gs[s],f=Hs(t),u=Ui(t),g=hx(t),b=t.boxes.map(L=>L.id).filter(L=>!g.includes(L)),w=(t.state?.paths??[]).filter(L=>!u.some(({edge:ye})=>fx(ye,L))),v=[...u.map(({edge:L})=>L),...w],A=d.ghost,N=L=>{const ye=t.boxes.find(Oe=>Oe.id===L);return A.pad*2+c.icon+A.gap+Math.max(Xe(ye?.name??L,oe.boxName),Xe(ye?.sub??"",oe.boxSub))},S=Il(t),M=Math.max(c.padX,d.done.inset+d.done.r+Q.slot.clear),D=new Map(t.boxes.map(L=>[L.id,b.includes(L.id)?N(L.id):Math.max(jo(t,L.id,!0),ec(S.get(L.id),L.icon!==void 0,M))])),z=Math.max(1,Math.min(d.columns,g.length)),H=Math.max(1,Math.ceil(g.length/d.columns)),Z=new Map(g.map((L,ye)=>{const Oe=Math.floor(ye/d.columns),Ke=ye%d.columns;return[L,{row:Oe,col:Oe%2===0?Ke:z-1-Ke}]})),j=Array.from({length:z},(L,ye)=>Math.max(c.minW,...g.filter(Oe=>Z.get(Oe)?.col===ye).map(Oe=>D.get(Oe)??c.minW))),R=Array.from({length:Math.max(0,z-1)},()=>d.columnGap);for(const L of v){const ye=Z.get(L.from),Oe=Z.get(L.to);if(!ye||!Oe||L.label===void 0||ye.row!==Oe.row||Math.abs(ye.col-Oe.col)!==1)continue;const Ke=Math.min(ye.col,Oe.col);R[Ke]=Math.max(R[Ke]??0,Xe(L.label,fa(L.label))+Q.label.padX*2+d.labelRoom*2)}const _=[];for(let L=0;L<z;L++)_.push(L===0?p:_[L-1]+j[L-1]+R[L-1]);const P=L=>_[L]+j[L]/2,B=L=>b.includes(L),ne=new Set(w.filter(L=>B(L.to)&&!B(L.from)&&!_g(L.from)).map(L=>L.from)),ae=[l.sideNote,...ne.size>0?[l.sideFrom(ne.size)]:[]],fe=Math.max(Xe(l.side,oe.regionName),...ae.map(L=>Xe(L,oe.regionNote))),pe=d.side.pad*2+Math.max(A.h,oe.regionName.size+Q.region.line*ae.length+d.side.pad/4),Ae=v.some(L=>L.from==="start"),C=p+(b.length>0?pe+d.side.gap:Ae?d.start+d.drop:0),$=L=>C+L*(c.h+d.rowGap),V=(L,ye,Oe,Ke)=>{const Ve=t.boxes.find(bt=>bt.id===L),tt=D.get(L)??c.minW,Ht=Ke?A.h:c.h;return{id:L,name:Ve?.name??L,...Ve?.sub!==void 0?{sub:Ve.sub}:{},...Ve?.icon!==void 0?{icon:Ve.icon}:{},color:f.get(L)??"slate",x:ye-tt/2,y:Oe,w:tt,h:Ht,cx:ye,cy:Oe+Ht/2,...Ke?{ghost:!0}:{}}},X=g.map(L=>{const ye=Z.get(L);return V(L,P(ye.col),$(ye.row),!1)});for(const L of X)tc(L,S.get(L.id),M);const ie=new Map(X.map(L=>[L.id,L])),T=L=>X.some(ye=>ye!==L&&Math.abs(ye.cx-L.cx)<.5&&ye.y>L.y),G=[],re=X[0],Y=Math.max(...X.map(L=>L.x+L.w));let xe;const ke=p+pe+d.side.lane;if(b.length>0){const L=bt=>w.filter(zt=>zt.to===bt).flatMap(zt=>ie.get(zt.from)??[]),ye=b.flatMap(L),Oe=Math.max(p,Math.min(...ye.length>0?ye.map(bt=>bt.x):[p+d.side.pad])-d.side.pad);let Ke=Oe+d.side.pad+fe+a*2;const Ve=b.map(bt=>{const zt=L(bt);return{id:bt,cx:zt.length>0?zt.reduce((Hn,Pn)=>Hn+Pn.cx,0)/zt.length:Ke}});Ve.sort((bt,zt)=>bt.cx-zt.cx);let tt=Oe;for(const{id:bt,cx:zt}of Ve){const Hn=D.get(bt)??c.minW,Pn=Math.max(zt-Hn/2,Ke),En=V(bt,Pn+Hn/2,p+(pe-A.h)/2,!0);X.push(En),ie.set(bt,En);const ea=w.some(ys=>ys.from===bt&&ys.to==="finish");ea&&G.push({kind:"finish",x:En.x+En.w+d.beside,y:En.cy,r:d.end.r,ghost:!0,text:"",box:bt}),tt=ea?En.x+En.w+d.beside+d.end.r:En.x+En.w,Ke=tt+a*2}const Ht=Math.max(tt+d.side.pad,Y);xe={x:Oe,y:p,w:Ht-Oe,h:pe,title:l.side,notes:ae}}if(re&&Ae){const L=re.cx+d.start+d.text+Xe(l.start,oe.regionNote)+a,ye=xe&&L<xe.x?xe.y+d.side.pad+d.start:re.y-d.drop;G.unshift({kind:"start",x:re.cx,y:ye,r:d.start,ghost:!1,text:l.start})}for(const L of X.filter(ye=>!ye.ghost&&v.some(Oe=>Oe.from===ye.id&&Oe.to==="finish")))G.push(T(L)?{kind:"finish",x:L.x+L.w+d.beside,y:L.cy,r:d.end.r,ghost:!1,text:l.end,box:L.id}:{kind:"finish",x:L.cx,y:L.y+L.h+d.below,r:d.end.r,ghost:!1,text:l.end,box:L.id});const ze=(L,ye)=>{const Oe=Z.get(L.id),Ke=Z.get(ye.id);if(!Oe||!Ke)return[[L.cx,L.y+L.h],[ye.cx,ye.y-r]];if(Oe.row===Ke.row&&Math.abs(Oe.col-Ke.col)===1)return ye.cx>L.cx?[[L.x+L.w,L.cy],[ye.x-r,ye.cy]]:[[L.x,L.cy],[ye.x+ye.w+r,ye.cy]];if(Oe.row===Ke.row){const tt=L.y+L.h+d.rowGap/4;return[[L.cx,L.y+L.h],[L.cx,tt],[ye.cx,tt],[ye.cx,ye.y+ye.h+r]]}if(Ke.row>Oe.row){if(Math.abs(L.cx-ye.cx)<.5)return[[L.cx,L.y+L.h],[ye.cx,ye.y-r]];const tt=L.y+L.h+d.rowGap/2;return[[L.cx,L.y+L.h],[L.cx,tt],[ye.cx,tt],[ye.cx,ye.y-r]]}if(Math.abs(L.cx-ye.cx)<.5)return[[L.cx,L.y],[ye.cx,ye.y+ye.h+r]];const Ve=ye.y+ye.h+d.rowGap/2;return[[L.cx,L.y],[L.cx,Ve],[ye.cx,Ve],[ye.cx,ye.y+ye.h+r]]},Fe=(L,ye)=>{const Oe=w.filter(Ve=>Ve.to===ye.id).flatMap(Ve=>ie.get(Ve.from)??[]).sort((Ve,tt)=>Ve.cx-tt.cx),Ke=Oe.findIndex(Ve=>Ve.id===L);return Oe.length<=1?Math.min(Math.max(Oe[0]?.cx??ye.cx,ye.x+d.side.entry),ye.x+ye.w-d.side.entry):ye.x+d.side.entry+(ye.w-d.side.entry*2)*Math.max(0,Ke)/(Oe.length-1)},Re=L=>Ae&&L===re?L.cx+d.side.entry:L.cx,Qe=L=>G.find(ye=>ye.kind==="finish"&&ye.box===L),K=(L,ye)=>{if(L==="start"){const Ve=G.find(Ht=>Ht.kind==="start"),tt=ie.get(ye);return!Ve||!tt?[]:[[Ve.x,Ve.y+Ve.r],[tt.cx,tt.y-r]]}const Oe=ie.get(L);if(!Oe)return[];if(ye==="finish"){const Ve=Qe(L);return Ve?Math.abs(Ve.x-Oe.cx)<.5?[[Oe.cx,Oe.y+Oe.h],[Oe.cx,Ve.y-Ve.r-r]]:[[Oe.x+Oe.w,Oe.cy],[Ve.x-Ve.r-r,Oe.cy]]:[]}const Ke=ie.get(ye);if(!Ke)return[];if(L===ye)return Wd(Oe);if(Ke.ghost&&!Oe.ghost){const Ve=Re(Oe),tt=Fe(L,Ke);return Math.abs(Ve-tt)<.5?[[Ve,Oe.y],[tt,Ke.y+Ke.h+r]]:[[Ve,Oe.y],[Ve,ke],[tt,ke],[tt,Ke.y+Ke.h+r]]}return Oe.ghost&&Ke.ghost?[[Oe.x+Oe.w,Oe.cy],[Ke.x-r,Ke.cy]]:Oe.ghost?[[Oe.cx,Oe.y+Oe.h],[Oe.cx,ke],[Ke.cx,ke],[Ke.cx,Ke.y-r]]:ze(Oe,Ke)},U=L=>{const ye=L.to==="finish"?Qe(L.from):void 0;if(!ye)return;const Oe=ie.get(L.from);return Oe&&Math.abs(ye.x-Oe.cx)<.5?[ye.x-ye.r-a-Oo(L.carry)[0],ye.y]:[ye.x,ye.y+ye.r+a+Q.carrier.tagH/2]},Ne=L=>{const ye=L.from==="start"?G.find(Oe=>Oe.kind==="start"):void 0;return ye?[ye.x-ye.r-Q.slot.mark-Oo(L.carry)[0],ye.y]:void 0},F=u.map(({step:L,event:ye,edge:Oe})=>{const Ke=U(Oe),Ve=Oe.carry.kind==="none"?void 0:Ne(Oe);return{step:L,event:ye,from:Oe.from,to:Oe.to,points:K(Oe.from,Oe.to),color:gx(Oe,f),carry:Oe.carry,...Ke?{settle:Ke}:{},...Ve?{wait:Ve}:{}}});Hi(F,ie,S);const be=new Map;for(const L of F){if(L.points.length!==2||!F.some(tt=>tt.from===L.to&&tt.to===L.from&&tt.points.length===2))continue;const[ye,Oe]=L.points,Ke=Math.abs(Oe[1]-ye[1])<Math.abs(Oe[0]-ye[0]),Ve=(L.from<L.to?1:-1)*Q.edge.parallel;L.points=L.points.map(([tt,Ht])=>Ke?[tt,Ht+Ve]:[tt+Ve,Ht]),be.set(L,Ke?Ve>0?"below":"above":Ve>0?"right":"left")}const k=w.map(L=>({from:L.from,to:L.to,points:K(L.from,L.to)})),te=(L,ye,Oe)=>L.from===L.to?yg(L.points):Ro(L.points,ye,Oe),W=[],we=G.flatMap(L=>L.text===""?[]:[oa(L.text,...vg(L),oe.regionNote)]),Be=[...Mo(F,t.steps.length,te).values()].map(L=>ma(L.point)),De=[...xe?[{x:xe.x,y:xe.y,w:d.side.pad+fe,h:xe.h}]:[],...we],Te=L=>[...F.map(ye=>ye.points),...k.map(ye=>ye.points)].filter(ye=>ye!==L);for(const L of F){const ye=t.steps[L.step]?.events[L.event];if(ye?.type!=="edge"||ye.label===void 0)continue;const Oe=L.from===L.to,Ke=Yl(L),Ve=W.filter(Hn=>Hn.text===ye.label&&F.some(Pn=>Pn.step===Hn.step&&Pn.event===Hn.event&&Yl(Pn)===Ke)),tt=Ve[Ve.length-1];if(tt){tt.until=L.step,W.push({x:tt.x,y:tt.y,w:tt.w,h:tt.h,step:L.step,event:L.event,text:tt.text,family:tt.family,color:L.color});continue}const Ht=Xe(ye.label,fa(ye.label))+Q.label.padX*2,bt=Oe?{side:"below",base:bg(L.points,Ht)}:{},zt=ye.labelSide??(L.to==="finish"?"left":be.get(L));W.push(Fs({step:L.step,event:L.event,text:ye.label,points:L.points,color:L.color,...zt?{side:zt}:Oe?{}:{flip:!0},...bt},{hard:X,soft:[...De,...W],touch:Be,lines:Te(L.points)}))}const je=[];w.forEach((L,ye)=>{const Oe=k[ye];if(L.label===void 0||Oe.points.length===0)return;const Ke=fa(L.label),Ve=ie.get(L.to)?.ghost===!0&&ie.get(L.from)?.ghost!==!0,tt=Oe.points[0][0],Ht=Ve?{side:"below",base:{x:tt+Q.label.soft,y:ke+Q.label.soft},slide:Math.max(...Oe.points.map(([zt])=>Math.abs(zt-tt)))}:{},bt=Fs({step:-1,event:ye,text:L.label,points:Oe.points,color:"slate",...Ht},{hard:X,soft:[...De,...W,...je],touch:Be,lines:Te(Oe.points)});je.push(bt),Oe.label={x:bt.x,y:bt.y,w:bt.w,h:bt.h,text:L.label,family:Ke.family}});const Le={kind:"state",width:0,height:0,regions:[],boxes:X,lifelines:[],edges:F,labels:W,actions:[],badges:[],paths:k,ends:G,...xe?{side:xe}:{}},st=[...X.map(L=>L.x),...W.map(L=>L.x),...k.flatMap(L=>L.label?[L.label.x]:[])],St=[...W.map(L=>L.y),...k.flatMap(L=>L.label?[L.label.y]:[])],Pt=Math.max(0,p-Math.min(...st)),lt=St.length>0?Math.max(0,p-Math.min(...St)):0;(Pt>0||lt>0)&&Id(Le,Pt,lt);const Vt=L=>L.x+(L.text===""?L.r:d.text+Xe(L.text,oe.regionNote)),nn=[...X.map(L=>L.x+L.w),...W.map(L=>L.x+L.w),...G.map(Vt),...F.flatMap(L=>L.points.map(ye=>ye[0])),...k.flatMap(L=>[...L.points.map(ye=>ye[0]),...L.label?[L.label.x+L.label.w]:[]]),...xe?[xe.x+xe.w]:[]],ln=[...X.map(L=>L.y+L.h),...W.map(L=>L.y+L.h),...G.map(L=>L.y+L.r),...F.flatMap(L=>L.points.map(ye=>ye[1]))],Ln={title:l.trail,states:g.map(L=>({box:L,color:f.get(L)??"slate"}))},cn=Math.max(Math.max(...nn)+p,Us(t,Ln)+p*2),Xt=Math.max(...ln,$(H-1)+c.h),wn=Gs(t,p,Xt+a,cn-p*2,Ln);Le.width=cn,Le.height=(wn?wn.y+wn.h:Xt)+p,wn&&(Le.strip=wn);const hn=Mo(F,t.steps.length,te);return Le.badges=Ps(t.steps.map((L,ye)=>{const Oe=hn.get(ye);return Oe?{step:ye,x:Oe.point[0],y:Oe.point[1],color:Oe.edge.color}:ep(L.events,ye,Le)})),Le}function gx(t,s){return t.carry.kind==="coin"?Gi(t,s):s.get(t.to==="finish"?t.from:t.to)??"slate"}var Sg=t=>t.kind==="time",nc={d:86400,h:3600,min:60,s:1,ms:.001},yx=Object.keys(nc);function bx(t){const s=/^([0-9]+(?:\.[0-9]+)?)(ms|s|min|h|d)$/u.exec(t);if(!s)return{seconds:1,unit:"s"};const c=s[2];return{seconds:Number(s[1])*nc[c],unit:c}}var x0=(t,s)=>yx.find(c=>t/nc[c]>=2-1e-9)??s,w0=(t,s,c)=>`${Number((t/nc[s]).toFixed(2))} ${gs[c].timeUnits[s]}`;function vx(t,s,c){let d=1;if(s)d=s*Math.max(1,Math.ceil(t/s/8));else for(let r=1;;r*=10){const l=[r,r*2,r*5].find(f=>t/f<=Q.time.ticks);if(l!==void 0){d=l;break}}const p=[];for(let r=0;r<=t;r+=d)p.push(r);const a=p[p.length-1];return a!==t&&(t-a)*c>=Q.time.minorPx&&p.push(t),{at:p,step:d}}function xx(t,s,c,d){const p=Array.from({length:s-1},(r,l)=>l+1).find(r=>s%r===0&&r*c>=Q.time.minorPx);if(p===void 0)return[];const a=[];for(let r=p;r<t;r+=p)d.includes(r)||a.push(r);return a}function k0(t){let s=0;return t.steps.map(c=>{const d=s;for(const p of c.events)p.type==="now"&&(s=Math.max(s,p.to+1));return[d,s]})}function wx(t,s="ja"){const c=Q.time,{margin:d,gap:p}=Q,a=Q.region,r=gs[s],l=t.time??{scale:{unit:"",length:"1s",count:1},rows:[]},{scale:f}=l,u=Math.max(1,f.count),g=bx(f.length),b=Math.max(c.width,Us(t)+d*2),w=Math.max(0,...l.rows.map(F=>Xe(F.name,oe.timeRow))),v=Math.max(c.axisX,d+a.inset+w+c.gutterGap),A=b-c.right-v,N=A/u,S=Hs(t),M=Il(t),D=[],z=[],H=[],Z=[],j=new Map(l.rows.map(F=>[F.id,F]));let R,_=d;if(l.zoom){const{from:F,to:be}=l.zoom,k=be-F+1,te=A/k,W=d,we=x0(be*g.seconds,g.unit),Be=[];for(let je=0;je<k;je++){const Le=F+je,st=v+je*te,St=t.boxes.map((lt,Vt)=>{const nn=M.get(lt.id),ln=Math.max(jo(t,lt.id,!1),ec(nn,lt.icon!==void 0,Q.box.padX)),Ln=W+c.boxTop+Vt*(Q.box.h+c.boxGap),cn=j.get(lt.id),Xt={id:lt.id,name:lt.name,...lt.sub!==void 0?{sub:lt.sub}:{},...lt.icon!==void 0?{icon:lt.icon}:{},color:S.get(lt.id)??"slate",x:st+te/2-ln/2,y:Ln,w:ln,h:Q.box.h,cx:st+te/2,cy:Ln+Q.box.h/2,...cn?{row:cn.id}:{},...cn?.empty?.includes(Le)?{empty:!0}:{}};return tc(Xt,nn),Xt});z.push(...St);const Pt=`${f.unit} ${(f.from??0)+Le}${r.headJoin}${w0(Le*g.seconds,we,s)}`;Be.push({unit:Le,head:Pt,boxes:St,x:st,y:W,w:te,h:0})}const Te=Math.max(W+c.boxTop,...z.map(je=>je.y+je.h))+c.zoomBottom;for(const je of Be)je.h=Te-W;D.push({id:"zoom",lines:[r.zoom],note:`${k} ${f.unit}`,icon:"clock",color:"blue",x:d,y:W,w:b-d*2,h:Te-W,header:{x:d+a.inset,y:W+a.inset,w:Math.max(a.icon,Xe(r.zoom,oe.regionName)),h:a.nameY-a.inset+a.line}}),R={from:F,to:be,frame:{x:0,y:0,w:0,h:0},guides:[],columns:Be,empty:r.empty,headY:W+c.head},_=Te+c.zoomGap}const P=_+c.rowsTop,B=l.rows.map((F,be)=>({id:F.id,name:F.name,color:F.color??S.get(F.id)??Co[be%Co.length],x:v,y:P+be*(c.row+c.rowGap),w:A,h:c.row})),ne=B.length>0?Math.max(...B.map(F=>F.y+F.h)):P,ae=Math.min(c.markMax,Math.max(c.markMin,N*c.markRatio)),fe=B.flatMap((F,be)=>Array.from({length:u},(k,te)=>({row:F.id,unit:te,empty:l.rows[be]?.empty?.includes(te)===!0,color:F.color,colors:[],x:v+(te+.5)*N-ae/2,y:F.y,w:ae,h:F.h})));if(t.steps.forEach((F,be)=>F.events.forEach((k,te)=>{if(k.type==="mark")for(const W of fe)W.row===k.row&&W.unit>=k.from&&W.unit<=k.to&&!W.empty&&W.colors.push({step:be,event:te,color:k.color})})),R){const F={x:v+R.from*N-c.frame,y:P-c.frame,w:(R.to-R.from+1)*N+c.frame*2,h:ne-P+c.frame*2},be=Math.max(...R.columns.map(k=>k.y+k.h));R.frame=F,R.guides=[[[F.x,F.y],[v,be]],[[F.x+F.w,F.y],[v+A,be]]]}const pe=ne+c.point.drop,Ae=(l.points??[]).map(F=>{const be=[];t.steps.forEach((De,Te)=>De.events.forEach((je,Le)=>{je.type==="swap"&&je.box===F.id&&be.push({step:Te,event:Le,text:je.text,...je.color?{color:je.color}:{}})}));const k=v+(F.at+.5)*N,te=k+c.point.text,W=Math.max(Xe(F.id,oe.pointName),...be.map(De=>Xe(De.text,oe.pointState))),we=pe+c.point.nameY-oe.pointName.size*.8,Be=pe+c.point.stateY+oe.pointState.size*.2;return{id:F.id,unit:F.at,cx:k,cy:pe,r:c.point.r,text:{x:te,y:we,w:W,h:Be-we},changes:be}}),C=new Map(Ae.map(F=>[F.id,F])),$=(F,be)=>C.get(F)?.changes.filter(te=>te.step<=be&&te.color).at(-1)?.color;t.steps.forEach((F,be)=>F.events.forEach((k,te)=>{if(k.type!=="edge")return;if(k.at===void 0){const Be=C.get(k.from),De=C.get(k.to);if(!Be||!De||Be===De)return;const Te=De.cx>Be.cx,je=Te?Math.max(Be.cx+Be.r,Be.text.x+Be.text.w+c.point.link):Be.cx-Be.r-c.point.end,Le=Te?De.cx-De.r-c.point.end:Math.min(De.cx-De.r,De.text.x+De.text.w+c.point.link),st={step:be,event:te,from:k.from,to:k.to,points:[[je,Be.cy],[Le,De.cy]],color:k.carry.kind==="coin"?"coin":$(k.to,be)??"slate",carry:k.carry};k.carry.kind!=="none"&&(st.settle=[Le-(Te?1:-1)*(Q.carrier.coinR+Q.edge.arrow),De.cy]),H.push(st);return}const W=kx(k,R);if(!W)return;const we={step:be,event:te,from:k.from,to:k.to,points:W.points,color:Gi(k,S),carry:k.carry};Ex(we,W.from,W.to,M),H.push(we),Z.push({step:be,event:te,from:W.from,to:W.to,column:k.at,into:k.into??k.at})}));const V={kind:"time",width:b,height:0,regions:D,boxes:z,lifelines:[],edges:H,labels:[],actions:[],badges:[],paths:[],ends:[],axis:{x:v,w:A,unit:N,count:u,line:0},rows:B,marks:fe,ticks:[],minor:[],periods:[],points:Ae,...R?{zoom:R}:{},spans:[],wires:Z,needle:{y1:P-c.needle.over,y2:ne+c.needle.over}},X=ne,ie=t.steps.some(F=>F.events.some(be=>be.type==="edge"&&be.at===void 0&&be.label!==void 0)),{r:T,inset:G}=Q.badge;let re=Ae.length>0?pe+c.point.r+(ie?c.point.room:c.point.plain):X+(T+G)*2;const Y=[],xe=t.steps.flatMap((F,be)=>F.events.flatMap((k,te)=>k.type==="span"?[{s:be,e:te,event:k}]:[]));for(const{s:F,e:be,event:k}of xe){const te=k.shape==="box"?"box":"bracket",W=xe.find(je=>je.s>F&&(je.event.shape==="box"?"box":"bracket")===te&&je.event.from<=k.to&&k.from<=je.event.to),we=k.color??"slate",Be=v+k.from*N,De=v+(k.to+1)*N,Te={step:F,event:be,kind:te,from:k.from,to:k.to,text:k.text,color:we,...W?{until:W.s}:{}};if(te==="box"){const je=c.box,Le={x:Be-je.pad,y:P-je.pad,w:De-Be+je.pad*2,h:ne-P+je.pad*2},st=Xe(k.text,oe.tag)+je.tagPadX*2,St={x:Le.x+je.tagX,y:Le.y-je.tagH/2,w:st,h:je.tagH};Y.push({...Te,...Le,textRect:St,textY:Le.y+Q.baseline.tag})}else Y.push({...Te,x:Be,y:0,w:De-Be,h:c.bracket.tick,textRect:{x:0,y:0,w:0,h:0},textY:0})}V.spans=Y,V.badges=E0(t,V,k0(t)),V.labels=_x(t,V),re=Math.max(re,...V.labels.map(F=>F.y+F.h+Q.label.soft));const ke=[];for(const F of Y.filter(be=>be.kind==="bracket")){const be=Xe(F.text,oe.spanText),k=Math.min(v+A-be/2,Math.max(v+be/2,F.x+F.w/2)),te={x:Math.min(F.x,k-be/2),w:Math.max(F.x+F.w,k+be/2)-Math.min(F.x,k-be/2)},W=Be=>{const De=Be.until===void 0||Be.until>F.step,Te=Math.min(Be.x,Be.textRect.x),je=Math.max(Be.x+Be.w,Be.textRect.x+Be.textRect.w)-Te;return De&&te.x<Te+je&&Te<te.x+te.w};let we=ke.findIndex(Be=>!Be.some(W));we<0&&(ke.push([]),we=ke.length-1),ke[we].push(F),F.y=re+c.bracket.gap+we*c.bracket.lane,F.textY=F.y+c.bracket.tick+c.bracket.text,F.textRect=oa(F.text,k,F.textY,oe.spanText,"middle")}ke.length>0&&(re=Math.max(...Y.filter(F=>F.kind==="bracket").map(F=>F.textRect.y+F.textRect.h)));const ze=re+c.axisGap;V.axis.line=ze;const Fe=vx(u,l.period?.length,N),Re=ze+c.tickY,Qe=x0(u*g.seconds,g.unit);V.ticks=Fe.at.map(F=>{const be=w0(F*g.seconds,Qe,s),k=Xe(be,oe.timeTick),te=v+F*N,W=F===0?te:F===u?te-k:Math.min(v+A-k,Math.max(v,te-k/2));return{at:F,x:te,text:be,left:W,y:Re}}),V.minor=xx(u,Fe.step,N,Fe.at);let K=Re+oe.timeTick.size*.2;if(l.period){const F=l.period,be=[];for(let W=0,we=0;we<u;W++,we+=F.length){const Be=Math.min(u,we+F.length)-1,De=`${F.name} ${(F.from??0)+W}`,Te=(f.from??0)+we,je=`${f.unit} ${r.range(String(Te),String((f.from??0)+Be))}`;be.push({index:W,from:we,to:Be,name:De,range:je,x:v+we*N,y:ze,w:(Be-we+1)*N,h:0,nameY:Re,rangeY:Re+c.rangeY})}const k=V.ticks.map(W=>oa(W.text,W.left,W.y,oe.timeTick)),te=be.some(W=>{const we=oa(W.name,W.x+W.w/2,W.nameY,oe.timePeriod,"middle");return k.some(Be=>we.x<Be.x+Be.w+c.nameGap&&Be.x<we.x+we.w+c.nameGap)});for(const W of be)te&&(W.nameY=Re+c.rangeY+2,W.rangeY=W.nameY+c.rangeY),W.h=W.rangeY+oe.timeRange.size*.2-ze;V.periods=be,K=Math.max(K,...be.map(W=>W.rangeY+oe.timeRange.size*.2))}const U=K+c.bottom;D.push({id:"axis",lines:[],color:"slate",x:d,y:_,w:b-d*2,h:U-_,header:{x:d+a.inset,y:_+a.inset,w:0,h:0}});const Ne=Gs(t,d,U+p,b-d*2);return Ne&&(V.strip=Ne),V.height=(Ne?Ne.y+Ne.h:U)+d,V.badges=E0(t,V,k0(t)),V}function kx(t,s){if(!s||t.at===void 0)return;const c=t.into??t.at,d=s.columns.find(v=>v.unit===t.at),p=s.columns.find(v=>v.unit===c),a=d?.boxes.find(v=>v.id===t.from),r=p?.boxes.find(v=>v.id===t.to);if(!d||!p||!a||!r||a===r)return;const l=d.boxes.indexOf(a),f=p.boxes.indexOf(r),u=f>l;if(d===p){if(Math.abs(f-l)===1)return{from:a,to:r,points:[[a.cx,u?a.y+a.h+1:a.y-1],[r.cx,u?r.y-1:r.y+r.h+1]]};const v=Math.min(d.x+d.w-Q.gap,Math.max(a.x+a.w,r.x+r.w)+Q.gap);return{from:a,to:r,points:[[a.x+a.w+1,a.cy],[v,a.cy],[v,r.cy],[r.x+r.w+1,r.cy]]}}const g=p.x>d.x;if(l===f)return{from:a,to:r,points:[[g?a.x+a.w+1:a.x-1,a.cy],[g?r.x-1:r.x+r.w+1,r.cy]]};const b=a.cx+(g?1:-1)*a.w/4,w=r.cx-(g?1:-1)*r.w/4;return{from:a,to:r,points:[[b,u?a.y+a.h+1:a.y-1],[w,u?r.y-1:r.y+r.h+1]]}}function Ex(t,s,c,d){const p={...t};Hi([p],new Map([[t.to,c]]),d);const a={...t};Hi([a],new Map([[t.from,s]]),d),p.settle&&(t.settle=p.settle),a.wait&&(t.wait=a.wait)}function E0(t,s,c){const{r:d,inset:p}=Q.badge,{axis:a}=s,r=[],l=[],f=Math.min(...s.rows.map(b=>b.y),s.needle.y1+Q.time.needle.over),u=Math.max(...s.rows.map(b=>b.y+b.h),f),g=s.points[0]?(u+s.points[0].cy-s.points[0].r)/2:u+d+p;return t.steps.forEach((b,w)=>{const v=(D,z)=>{r.push(D),l.push({step:w,x:D[0],y:D[1],color:z})},A=s.edges.filter(D=>D.step===w).sort((D,z)=>D.event-z.event)[0];if(A){const D=A.carry.kind!=="none"&&!A.wait?[A.points[0]]:[],z=s.edges.filter(H=>H!==A).map(H=>H.points);v(Ro(A.points,[...r,...D],z),A.color);return}const[N,S]=c[w]??[0,0];if(S>N){let D=a.x+(N+S)/2*a.unit;const z=s.points.find(H=>Math.abs(H.cx-D)<d+p);z&&(D=z.cx+d+p*2),v([D,g],"slate");return}for(const D of b.events){const z=Ax(D,w,s);if(z){v(z.at,z.color);return}}if(s.strip&&b.events.some(D=>D.type==="strip")){l.push({step:w,x:s.strip.x+p,y:s.strip.y+p,color:"slate"});return}const M=l[l.length-1];l.push(M?{...M,step:w}:{step:w,x:a.x-d-p,y:f,color:"slate"})}),Ps(l)}function Ax(t,s,c){const{r:d,inset:p}=Q.badge;if(t.type==="span"){const a=c.spans.find(r=>r.step===s&&r.from===t.from&&r.to===t.to&&r.text===t.text);return a?a.kind==="box"?{at:[a.x,a.y],color:a.color}:{at:[a.x-d-p,a.y+a.h/2],color:a.color}:void 0}if(t.type==="swap"){const a=c.points.find(r=>r.id===t.box);if(a)return{at:[a.cx-a.r-p-d,a.cy],color:t.color??"slate"}}if(t.type==="mark"){const a=c.rows.find(l=>l.id===t.row),r=Math.min(...c.rows.map(l=>l.y));if(a)return{at:[c.axis.x+(t.from+t.to+1)/2*c.axis.unit,r-d-p],color:t.color}}}function _x(t,s){const c=[],d=s.points.map(r=>({x:r.cx-r.r,y:r.cy-r.r,w:r.r*2,h:r.r*2})),p=s.points.map(r=>r.text),a=(s.zoom?.columns??[]).map(r=>oa(r.head,r.x+r.w/2,s.zoom?.headY??0,oe.timeHead,"middle"));for(const r of s.edges){const l=t.steps[r.step]?.events[r.event];if(l?.type!=="edge"||l.label===void 0)continue;const f=s.badges.filter(g=>g.step<=r.step).map(g=>ma([g.x,g.y])),u=l.labelSide??(l.at===void 0?"below":void 0);c.push(Fs({step:r.step,event:r.event,text:l.label,points:r.points,color:r.color,...u?{side:u}:{},flip:l.at!==void 0},{hard:[...d,...s.boxes],soft:[...p,...a,...c.filter(g=>g.step===r.step)],touch:f}))}return c}var tp=t=>t.kind==="tree";function Sx(t){const s=new Set(t.boxes.map(a=>a.id)),c=new Set,d=new Map,p=[];return t.steps.forEach((a,r)=>{a.events.forEach((l,f)=>{if(l.type!=="leaf"&&l.type!=="node"||c.has(l.id)||s.has(l.id))return;const u=l.type==="node"?[...new Set(l.children)].filter(g=>c.has(g)&&!d.has(g)):[];for(const g of u)d.set(g,l.id);p.push({id:l.id,kind:l.type,children:u,step:r,event:f,...l.hash!==void 0?{hash:l.hash}:{}}),c.add(l.id)})}),{grown:p,parents:d}}function $x(t,s){return t.hash===void 0?[{text:t.id,style:oe.boxName}]:s?[{text:t.id,style:oe.rootName},{text:t.hash,style:oe.rootHash}]:t.kind==="leaf"?[{text:t.hash,style:oe.treeHash}]:[{text:t.hash,style:oe.treeHash},{text:t.id,style:oe.treeName}]}function Nx(t,s){const c=Q.edge.inset,d=Math.max(t.y,s.y),p=Math.min(t.y+t.h,s.y+s.h);if(p>d){const u=(d+p)/2;return s.x>=t.x+t.w?[[t.x+t.w+c,u],[s.x-c,u]]:[[t.x-c,u],[s.x+s.w+c,u]]}const a=Math.max(t.x,s.x),r=Math.min(t.x+t.w,s.x+s.w);if(r>a){const u=(a+r)/2;return s.y>=t.y+t.h?[[u,t.y+t.h+c],[u,s.y-c]]:[[u,t.y-c],[u,s.y+s.h+c]]}const l=t.x+t.w/2,f=s.y+s.h/2;return[[l,s.y>t.y?t.y+t.h+c:t.y-c],[l,f],[s.x>l?s.x-c:s.x+s.w+c,f]]}function Dx(t){const{margin:s,gap:c,box:d,tree:p,badge:a}=Q,{grown:r,parents:l}=Sx(t),f=r.filter(U=>!l.has(U.id)),u=f[f.length-1]?.id,g=new Map(r.map(U=>[U.id,U])),b=new Map,w=(U,Ne)=>{b.set(U,Ne);for(const F of g.get(U)?.children??[])w(F,Ne+1)};for(const U of f)w(U.id,0);const v=new Map(r.map(U=>[U.id,$x(U,U.id===u)])),A=U=>Math.max(0,...(v.get(U)??[]).map(Ne=>Xe(Ne.text,Ne.style))),N=U=>U.id===u?Math.max(p.root.w,p.root.textX+A(U.id)+p.root.padR):Math.max(p.w,A(U.id)+p.padX*2),S=U=>Math.max(p.card.minW,p.card.padX*2+p.card.icon+p.card.gap+Xe(U.id,oe.treeCard)),M=U=>U.kind==="leaf"&&U.hash!==void 0,D=r.filter(U=>U.children.length===0),z=Math.max(...r.filter(U=>U.id!==u||U.children.length===0).map(U=>Math.max(N(U),M(U)?S(U):0)),p.w)+p.slotGap,H=s+a.r*2+a.inset,Z=new Map;D.forEach((U,Ne)=>Z.set(U.id,H+z*(Ne+.5)));const j=U=>{const Ne=Z.get(U);if(Ne!==void 0)return Ne;const F=g.get(U)?.children??[],be=(j(F[0])+j(F[F.length-1]))/2;return Z.set(U,be),be},R=s+p.top,_=U=>R+p.root.h/2+U*p.row,P=Hs(t),B=r.map(U=>{const Ne=U.id===u,F=b.get(U.id)??0,be=j(U.id),k=_(F),te=N(U),W=Ne?p.root.h:p.h,we=v.get(U.id)??[],Be=we.length===1?[k+p.oneY]:Ne?[k+p.root.nameY,k+p.root.hashY]:[k+p.hashY,k+p.nameY],De=l.get(U.id),Te=Ne?p.rootColor:p.color;P.set(U.id,Te);const je=S(U);return{id:U.id,kind:U.kind,depth:F,...De!==void 0?{parent:De}:{},children:U.children,step:U.step,event:U.event,...U.hash!==void 0?{hash:U.hash}:{},root:Ne,x:be-te/2,y:k-W/2,w:te,h:W,cx:be,cy:k,color:Te,lines:we.map(Le=>Le.text),baselines:Be,styles:we.map(Le=>Le.style),...M(U)?{card:{x:be-je/2,y:k+p.card.drop-p.card.h/2,w:je,h:p.card.h,text:U.id}}:{}}}),ne=new Map(B.map(U=>[U.id,U])),ae=B.flatMap(U=>U.children.flatMap(Ne=>{const F=ne.get(Ne);if(!F)return[];const be=(F.y+U.y+U.h)/2,k=[[F.cx,F.y-Q.edge.inset],[F.cx,be],[U.cx,be],[U.cx,U.y+U.h+Q.edge.inset]];return[{from:F.id,to:U.id,step:U.step,event:U.event,points:k}]})),fe=Il(t),pe=Math.max(H,...B.flatMap(U=>[U.x+U.w,...U.card?[U.card.x+U.card.w]:[]])),Ae=B.find(U=>U.root),C=new Set(t.boxes.map(U=>U.id)),$=Ui(t).flatMap(({edge:U})=>U.label!==void 0&&(C.has(U.from)||C.has(U.to))?[Xe(U.label,fa(U.label))+Q.label.padX*2]:[]),V=Math.max(pe+p.boxGap,(Ae?Ae.x+Ae.w:H)+Math.max(0,...$)+c*2);let X=Ae?.y??R;const ie=t.boxes.map(U=>{const Ne=Math.max(jo(t,U.id,!0),ec(fe.get(U.id),U.icon!==void 0,d.padX)),F=X;X+=d.h+c;const be={id:U.id,name:U.name,...U.sub!==void 0?{sub:U.sub}:{},...U.icon!==void 0?{icon:U.icon}:{},color:P.get(U.id)??"slate",x:V,y:F,w:Ne,h:d.h,cx:V+Ne/2,cy:F+d.h/2};return tc(be,fe.get(U.id)),be}),T=new Map(ie.map(U=>[U.id,U])),G=[],re=t.steps.flatMap((U,Ne)=>U.events.flatMap((F,be)=>{if(F.type!=="edge")return[];const k=ne.get(F.from)??T.get(F.from),te=ne.get(F.to)??T.get(F.to);if(!k||!te)return[];const W=ae.find(Te=>Te.from===F.from&&Te.to===F.to),we=ae.find(Te=>Te.from===F.to&&Te.to===F.from),Be=W??we;Be&&G.push({step:Ne,event:be,link:Be.from});const De=W?W.points:we?[...we.points].reverse():F.from===F.to?Wd({cx:k.x+k.w/2,y:k.y,h:k.h}):Nx(k,te);return[{step:Ne,event:be,from:F.from,to:F.to,points:De,color:Gi(F,P),carry:F.carry}]}));Hi(re,T,fe);const Y={kind:"tree",width:0,height:0,regions:[],boxes:ie,lifelines:[],edges:re,labels:[],actions:[],badges:[],paths:[],ends:[],nodes:B,links:ae,runs:G};Y.badges=A0(t,Y),Y.labels=Ox(t,Y);const xe=B.flatMap(U=>U.card?[U.card]:[]),ke=[...B,...xe,...ie,...Y.labels],ze=re.flatMap(U=>U.points),Fe=Math.max(...ke.map(U=>U.x+U.w),...ze.map(([U])=>U),H),Re=Math.max(...ke.map(U=>U.y+U.h),...ze.map(([,U])=>U),R),Qe=Math.max(Fe+s,Us(t)+s*2),K=Gs(t,s,Re+c,Qe-s*2);return Y.width=Qe,Y.height=(K?K.y+K.h:Re)+s,K&&(Y.strip=K),Y.badges=A0(t,Y),Y}function A0(t,s){const{r:c,inset:d}=Q.badge,p=c*2+d,a=[],r=[],l=[...s.nodes,...s.nodes.flatMap(b=>b.card?[b.card]:[]),...s.boxes],f=b=>a.every(([w,v])=>Math.hypot(b[0]-w,b[1]-v)>=p)&&l.every(w=>To(ma(b),w)>=Q.label.touch),u=(b,w,v)=>{a.push(w),r.push({step:b,x:w[0],y:w[1],color:v})},g=new Map;return t.steps.forEach((b,w)=>{const v=b.events.findIndex(H=>H.type==="leaf"||H.type==="node"||H.type==="edge"),A=b.events[v],N=s.nodes.find(H=>H.step===w&&H.event===v);if(A&&A.type!=="edge"&&N){const H=[[N.x-d-c,N.cy],[N.x,N.y],[N.x+N.w+d+c,N.cy],[N.x+N.w,N.y]];u(w,H.find(f)??H[0],N.color);return}const S=s.edges.find(H=>H.step===w&&H.event===v);if(A?.type==="edge"&&S){const H=[S.from,S.to].sort().join(`
`),Z=s.runs.some(_=>_.step===w&&_.event===v),j=s.edges.filter(_=>_!==S).map(_=>_.points),R=g.get(H)??(Z?Tx(S.points,f):Cx(S,f))??Ro(S.points,a,j);g.set(H,R),u(w,R,S.color);return}const M=b.events.flatMap(H=>H.type==="swap"||H.type==="action"?[H.box]:[]).flatMap(H=>s.boxes.filter(Z=>Z.id===H))[0];if(M){r.push({step:w,x:M.x,y:M.y,color:M.color});return}if(s.strip&&b.events.some(H=>H.type==="strip")){r.push({step:w,x:s.strip.x+d,y:s.strip.y+d,color:"slate"});return}const D=r[r.length-1],z=s.nodes.find(H=>H.root);r.push(D?{...D,step:w}:{step:w,x:z?.x??Q.margin,y:z?.y??Q.margin,color:z?.color??"slate"})}),Ps(r)}function Tx(t,s){const[c,d,p]=t,a=Math.abs(p[0]-d[0]),{r,inset:l}=Q.badge;if(a>=Q.tree.badgeAlong+r){const u=ja(t,qo([c,d])+Q.tree.badgeAlong);if(s(u))return u}const f=[d[0]+r+l,d[1]];return s(f)?f:void 0}function Cx(t,s){const c=qo(t.points),d=Oo(t.carry)[0]+Q.badge.r+Q.badge.inset;for(let p=0;p<=c/2-d;p+=1)for(const a of[c/2-p,c/2+p]){const r=ja(t.points,a);if(s(r))return r}}function Ox(t,s){const c=[],d=s.nodes.flatMap(p=>p.card?[p.card]:[]);for(const p of s.edges){const a=t.steps[p.step]?.events[p.event];if(a?.type!=="edge"||a.label===void 0)continue;const r=s.badges.filter(l=>l.step<=p.step).map(l=>ma([l.x,l.y]));c.push(Fs({step:p.step,event:p.event,text:a.label,points:p.points,color:p.color,...a.labelSide?{side:a.labelSide}:{},flip:!0},{hard:[...s.nodes,...s.boxes],soft:[...d,...c.filter(l=>l.step===p.step)],touch:r}))}return c}var Mx={line:He.lineup.slide,seal:He.lineup.seal,open:He.fade,pick:He.fade,stamp:He.popFade};function _0(t,s){const c={edges:[],events:[],busy:0};let d=He.edgeAt,p,a=0,r=Number.NEGATIVE_INFINITY;const l=(w,v,A)=>{const N=v.carry.kind!=="none",S=A+(N?He.drawCarry:He.draw);return c.edges.push({event:w,a:A,b:S,carries:N,coin:v.carry.kind==="coin",named:v.label!==void 0}),c.busy=Math.max(c.busy,S),S},f=s?t.events.flatMap((w,v)=>w.type==="now"?[{e:v,to:w.to}]:[]):[],u=s?.from??0,g=Math.max(u,...f.map(w=>w.to+1)),b=w=>w.type==="edge"&&w.at!==void 0&&w.at>=u&&w.at<g;return t.events.forEach((w,v)=>{if(s&&v===f[0]?.e){let A=Math.max(d,r+He.change);const N=[[A,u]],S=[];for(let M=u;M<g;M++){const D=A,z=t.events.flatMap((j,R)=>b(j)&&j.at===M?[{k:R,ev:j}]:[]),H=z.reduce((j,R,_)=>Math.max(j,l(R.k,R.ev,D+He.stagger*_)),D),Z=Math.max(D+s.speed,z.length>0?H+He.time.wait:D);Z-s.speed>D+1e-9&&N.push([Z-s.speed,M]),N.push([Z,M+1]),S.push({unit:M,at:Z}),A=Z}c.sweep={keys:N,passed:S},c.busy=Math.max(c.busy,A),d=A+He.time.after,p=A,a=0;return}if(!(w.type==="now"||s&&b(w))){if(w.type==="line"||w.type==="seal"||w.type==="open"||w.type==="pick"||w.type==="stamp"){const A=d,N=A+Mx[w.type];c.edges.push({event:v,a:A,b:N,carries:!1,coin:!1,named:!1}),d=A+He.lineup.stagger,p=N,a=0,c.busy=Math.max(c.busy,N);return}if(w.type==="commit"||w.type==="branch"||w.type==="leaf"||w.type==="node"){const A=d,N=A+He.draw;c.edges.push({event:v,a:A,b:N,carries:!1,coin:!1,named:!1}),d=A+He.stagger,p=N,a=0,c.busy=Math.max(c.busy,N)}else if(w.type==="edge"){const A=d;p=l(v,w,A),d=A+He.stagger,a=0}else if(w.type==="action")c.events.push({event:v,at:d}),c.busy=Math.max(c.busy,d+He.action),d+=He.action,a=0;else{const A=(p??d)+He.change*a++;c.events.push({event:v,at:A}),c.busy=Math.max(c.busy,A),r=Math.max(r,A)}}}),c.edges.sort((w,v)=>w.a-v.a),c}function Bx(t,s=!1){const c=t.kind==="time"?t.time:void 0,d=He.time,p=c?Math.min(d.unitMax,Math.max(d.unitMin,d.axis/Math.max(1,c.scale.count))):0;let a=0;const r=t.steps.map(P=>{if(!c)return _0(P);const B=_0(P,{from:a,speed:p});return a=B.sweep?.keys[B.sweep.keys.length-1]?.[1]??a,B}),l=[];let f=He.intro;t.steps.forEach((P,B)=>{const ne=Math.min(He.stepMax,Math.max(He.stepMin,He.stepBase+[...P.body].length*He.perChar)),ae=Math.max(ne,(r[B]?.busy??0)+He.dwell);l.push({start:f,end:f+ae}),f+=ae});const g=Math.ceil(f+He.outro),b=g-He.tail,w=l[l.length-1],v=s&&w?{start:w.start+(r[r.length-1]?.busy??0),end:b}:void 0,A=v?.start??b,N=[],S=[],M=[],D=[];r.forEach((P,B)=>{const ne=l[B],ae=[];for(const fe of P.edges){const pe=ne.start+fe.a;N.push({step:B,event:fe.event,start:pe,drawn:ne.start+fe.b,end:ne.end});const Ae=t.steps[B]?.events[fe.event],C=t.kind==="git"&&Ae?.type==="edge"&&Ae.carry.kind==="tag"&&Ae.carry.text===Ae.from;fe.carries&&!C&&D.push({step:B,event:fe.event,who:fe.coin?"coin":"main",a:pe,b:ne.start+fe.b}),fe.named&&ae.push({step:B,event:fe.event,start:pe+He.labelDelay,end:ne.end})}ae.forEach((fe,pe)=>{const Ae=ae[pe+2];Ae&&(fe.end=Math.min(fe.end,Ae.start))});for(const fe of ae)v&&fe.end>v.start?fe.end=v.end:(t.kind==="state"&&fe.end<A&&(fe.after={start:fe.end,end:A}),v&&(fe.again=v));S.push(...ae);for(const fe of P.events)M.push({step:B,event:fe.event,at:ne.start+fe.at})});const z=l[0]?.start??0,H=D.some(P=>P.who==="main"),Z=[];for(const P of["main","coin"]){const B=D.filter(ne=>ne.who===P);B.forEach((ne,ae)=>{const fe=B[ae+1],pe=ae===0&&(P==="main"||!H);Z.push({step:ne.step,event:ne.event,who:P,depart:ne.a,arrive:ne.b,start:pe?Math.min(z,ne.a):ne.a,end:fe?Math.max(fe.a,ne.b):b})})}Z.sort((P,B)=>P.depart-B.depart);const j=t.kind==="state"?Rx(t,N,b):void 0,R=[[0,0]],_=[];return r.forEach((P,B)=>{const ne=l[B].start;for(const[ae,fe]of P.sweep?.keys??[])R.push([ne+ae,fe]);for(const ae of P.sweep?.passed??[])_.push({unit:ae.unit,passed:ne+ae.at})}),R.push([g,a]),{total:g,last:b,steps:l,edges:N,carriers:Z,labels:S,badges:l.map((P,B)=>({step:B,appears:P.start})),events:M,stills:l.map(P=>P.end-He.still),...v?{whole:v}:{},...j?{states:j}:{},...c?{needle:R,units:_,meters:jx(t,r,l)}:{}}}function jx(t,s,c){const d=t.time?.period?.length;return(t.strip?.meters??[]).map(({field:p})=>{const a=[[0,0]];let r=0;return s.forEach((l,f)=>{const u=c[f].start,g=(t.steps[f]?.events??[]).flatMap((N,S)=>{const M=N.type==="strip"&&N.field===p&&N.value!==void 0?xg(N.value):void 0;return M===void 0?[]:[{e:S,ratio:M}]}),b=g[g.length-1];if(!b)return;const w=l.sweep?.keys??[],v=w[0],A=w[w.length-1];if(v&&A&&A[1]>v[1]){const[N,S]=[v[1],A[1]];let M=r,D=N;const z=d?Math.floor((S-1e-9)/d)*d:0;if(z>0&&z>=N){const H=u+(w.find(([,j])=>j===z)?.[0]??v[0]),Z=a[a.length-1][0];a.push([Math.max(Z,H-He.time.reset),r],[H,0]),M=0,D=z}for(const[H,Z]of w)Z>=D&&a.push([u+H,M+(b.ratio-M)*(Z-D)/(S-D)])}else{const N=u+(l.events.find(S=>S.event===b.e)?.at??0);a.push([N,r],[N+He.fade,b.ratio])}r=b.ratio}),{field:p,keys:a}})}var qx=t=>Ri.includes(t);function Rx(t,s,c){const d=new Map,p=r=>{const l=d.get(r)??{box:r,lit:[]};return d.set(r,l),l};let a;for(const r of s){const l=t.steps[r.step]?.events[r.event];if(!(l?.type!=="edge"||l.from===l.to)){if(a){const f=p(a.box);f.lit.push({start:a.since,end:r.start}),a.box===l.from&&f.done===void 0&&(f.done=r.start+He.done),a=void 0}qx(l.to)||(a={box:l.to,since:r.drawn})}}return a&&p(a.box).lit.push({start:a.since,end:c}),[...d.values()]}var Ls={app:"M -9 -7 h18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z M -11 -2 h22",router:"M -9 -4 h16 M 3 -8 l4 4 l-4 4 M 9 5 h-16 M -3 1 l-4 4 l4 4",on:"M -7 7 L 7 -7 M -1 -7 h8 v8",off:"M -7 -7 L 7 7 M 7 -1 v8 h-8",pool:"M -9 -5 a9 3.5 0 1 0 18 0 a9 3.5 0 1 0 -18 0 M -9 -5 v10 a9 3.5 0 0 0 18 0 v-10 M -9 0 a9 3.5 0 0 0 18 0",db:"M -9 -5 a9 3.5 0 1 0 18 0 a9 3.5 0 1 0 -18 0 M -9 -5 v10 a9 3.5 0 0 0 18 0 v-10 M -9 0 a9 3.5 0 0 0 18 0",exe:"M -5 -8 L 7 0 L -5 8 Z",idx:"M -9 -7 h18 M -9 -2 h18 M -9 3 h18 M -9 8 h11",sign:"M -9 4 c 3 -9 5 -9 6 0 s 3 7 6 -2 s 3 -6 6 0",env:"M -8 -5.5 h16 v11 h-16 z M -8 -5.5 l8 6 l8 -6",lock:"M -5.5 -1 h11 v8 h-11 z M -3.5 -1 v-3 a3.5 3.5 0 0 1 7 0 v3",check:"M -5 0 l3.5 3.5 l6.5 -7",flag:"M -4 8 V -8 M -4 -7 H 6 L 3.5 -3.5 L 6 0 H -4",x:"M -5 -5 l10 10 M 5 -5 l-10 10",chain:"M -1.5 4.5 l-2 2 a3.5 3.5 0 0 1 -5 -5 l3 -3 a3.5 3.5 0 0 1 5 0 M 1.5 -4.5 l2 -2 a3.5 3.5 0 0 1 5 5 l-3 3 a3.5 3.5 0 0 1 -5 0 M -2.5 2.5 l5 -5",net:"M -1.3 -4.6 L -5.8 3 M 1.3 -4.6 L 5.8 3 M -4.3 5.5 H 4.3 M -2.2 -7 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 M -9.2 5.5 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 M 4.8 5.5 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0",user:"M -4 -4.5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M -8 9 c0 -5 3.6 -7.5 8 -7.5 s8 2.5 8 7.5",server:"M -9 -8 h18 v7 h-18 z M -9 1 h18 v7 h-18 z M -5 -4.5 h0.01 M -5 4.5 h0.01",key:"M -9 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0 M -2 0 h10 M 5 0 v3.5 M 8 0 v2.5",shield:"M 0 -9 l8 3 v5 c0 5 -3.5 8 -8 10 c-4.5 -2 -8 -5 -8 -10 v-5 z",globe:"M -9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M -9 0 h18 M 0 -9 c-4.5 4 -4.5 14 0 18 M 0 -9 c4.5 4 4.5 14 0 18",bolt:"M 2 -9 L -5 1 h5 l-2 8 l7 -10 h-5 z",doc:"M -6 -9 h8 l5 5 v13 h-13 z M 2 -9 v5 h5 M -3 1 h7 M -3 5 h5",box:"M -9 -4.5 l9 -4.5 l9 4.5 v9 l-9 4.5 l-9 -4.5 z M -9 -4.5 l9 4.5 l9 -4.5 M 0 0 v9",truck:"M -10 -6 h11 v10 h-11 z M 1 -2 h5 l3.5 3.5 v2.5 h-8.5 M -7.5 6.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0 M 3 6.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0",card:"M -9 -6.5 h18 a2 2 0 0 1 2 2 v9 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-9 a2 2 0 0 1 2 -2 z M -11 -2 h22 M -7 3 h5",cart:"M -10 -8 h3 l3 11 h11 l2.5 -8 h-15.5 M -4.5 7.5 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M 5 7.5 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0",clock:"M -9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M 0 -5 v5 l3.5 2.5",branch:"M -4 -4.5 v9 M 5 0.5 c0 4 -9 3 -9 6.5 M -6.2 -7 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 M -6.2 7 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 M 2.8 -2 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0",cloud:"M -7 6 h13 a4.5 4.5 0 0 0 0.5 -9 a6 6 0 0 0 -11.5 -1 a4.5 4.5 0 0 0 -2 10 z",refresh:"M 7 -3 a7.5 7.5 0 1 0 0.5 5 M 7.5 -8 v5 h-5",undo:"M -7 -2 h10 a5 5 0 0 1 0 10 h-6 M -3 -6 l-4 4 l4 4",yen:"M -6 -8 l6 7 l6 -7 M 0 -1 v9 M -5 1.5 h10 M -5 5 h10",layers:"M 0 -8 l9 4.5 l-9 4.5 l-9 -4.5 z M -9 2.5 l9 4.5 l9 -4.5",code:"M -4 -6 l-5 6 l5 6 M 4 -6 l5 6 l-5 6",paint:"M -8 8 c 0 -3 2 -5 4.5 -5 l 9 -9 l 3.5 3.5 l -9 9 c 0 2.5 -2 4.5 -5 4.5 z",tree:"M 0 -5 v4 M -6 -1 h12 M -6 -1 v3 M 6 -1 v3 M -9 2 h6 v6 h-6 z M 3 2 h6 v6 h-6 z M -3 -10 h6 v5 h-6 z",block:"M -9 -7 h18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z M -11 -2.5 h22 M -6 2.5 h8"},Fn=[[0,Number.POSITIVE_INFINITY]],bd=.5,S0=(t,s)=>t.shown.some(([c,d])=>c<=s&&s<d),vd=t=>({text:t.text,rect:{x:t.rect.x,y:t.rect.y,w:t.rect.w,h:t.rect.h},badge:t.badge===!0,...t.part?{part:t.part}:{}});function zx(t,s,c=[]){const d=[];return s.forEach((p,a)=>{const r=t.filter(f=>S0(f,p));r.forEach((f,u)=>{for(const g of r.slice(u+1)){const b=Math.min(f.rect.x+f.rect.w,g.rect.x+g.rect.w)-Math.max(f.rect.x,g.rect.x),w=Math.min(f.rect.y+f.rect.h,g.rect.y+g.rect.h)-Math.max(f.rect.y,g.rect.y);b>bd&&w>bd&&d.push({kind:"texts",step:a,texts:[f.text,g.text],spots:[vd(f),vd(g)]})}});const l=c.filter(f=>S0(f,p));for(const f of r)if(!f.boxed)for(const u of l)Kd(u.points,f.rect,bd)&&d.push({kind:"line",step:a,text:f.text,line:{from:u.from,to:u.to},spots:[vd(f)]})}),d}function Fx(t,s="ja"){const c=gs[s],d=a=>a.kind==="icon"?c.iconOf(a.box):a.kind==="coin"?c.coin:c.envelope,p=a=>a.badge?c.badgeName(a.text):a.part?d(a.part):c.quoted(a.text);return t.kind==="texts"?c.textsOverlap(p(t.spots[0]),p(t.spots[1])):c.lineCrosses(t.line.from,t.line.to,p(t.spots[0]))}var pt=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),$g=(t,s)=>t===void 0?s:`<a href="${pt(t)}">${s}</a>`,Me=t=>Math.round(t*100)/100,dt=t=>t==="coin"?"--c:var(--coin);--ct:var(--coint)":`--c:var(--c-${t});--ct:var(--t-${t})`;function qa(t,s,c,d,p="dg-gl"){const a=t===void 0?void 0:Ls[t];return a?`<path class="${p}" transform="translate(${Me(s)} ${Me(c)}) scale(${d})" d="${a}"/>`:""}function Lx(t){return Object.hasOwn(Ls,t)?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${Q.stroke.glyph*Q.box.iconScale}" stroke-linecap="round" stroke-linejoin="round"><path d="${Ls[t]}"/></svg>`:void 0}function hs(t){const s=t.filter((a,r)=>r===0||a[0]!==t[r-1][0]||a[1]!==t[r-1][1]),[c,d]=s[0];let p=`M ${Me(c)} ${Me(d)}`;for(let a=1;a<s.length-1;a++){const[r,l]=s[a-1],[f,u]=s[a],[g,b]=s[a+1],w=Math.hypot(f-r,u-l),v=Math.hypot(g-f,b-u),A=Math.min(Q.edge.bend,w/2,v/2);p+=` L ${Me(f-(f-r)/w*A)} ${Me(u-(u-l)/w*A)} Q ${Me(f)} ${Me(u)} ${Me(f+(g-f)/v*A)} ${Me(u+(b-u)/v*A)}`}if(s.length>1){const[a,r]=s[s.length-1];p+=` L ${Me(a)} ${Me(r)}`}return p}function ac(t){const[s,c]=t[t.length-1],[d,p]=t[t.length-2],a=Math.hypot(s-d,c-p)||1,r=(s-d)/a,l=(c-p)/a,{arrow:f,arrowHalf:u}=Q.edge;return`M ${Me(s-r*f-l*u)} ${Me(c-l*f+r*u)} L ${Me(s)} ${Me(c)} L ${Me(s-r*f+l*u)} ${Me(c-l*f-r*u)}`}function wt(t,s,c,d,p,a,r=Fn,l){return t?.push({text:p,rect:oa(p,c,d,a,l),shown:r}),`<text class="${s}" x="${Me(c)}" y="${Me(d)}"${l?` text-anchor="${l}"`:""}>${pt(p)}</text>`}function Ng(t,s){const c=[[0,{opacity:0}]];for(const[d,p]of s)c.push([d,{opacity:0},et.out],[d+He.fade,{opacity:1}],[p-.1,{opacity:1},et.inOut],[p+.25,{opacity:0}]);return c.push([t.total,{opacity:0}]),t.kf(c)}function np(t,s){const c=[];for(let d=0;d<s.length;){let p=d;for(;p+1<s.length&&s[p+1]===s[p]+1;)p++;c.push([t.t.steps[s[d]].start,t.t.steps[s[p]].end]),d=p+1}return Ng(t.m,c)}function Hx(t,s){const{radius:c,icon:d,iconRadius:p,iconScale:a,nameY:r,line:l}=Q.region,{x:f,y:u}=t.header,g=t.lines.map((v,A)=>wt(s,"dg-bz",f,t.y+r+A*l,v,oe.regionName)).join(""),b=t.note?wt(s,"dg-bx",f,t.y+r+t.lines.length*l+1,t.note,oe.regionNote):"",w=t.icon&&Ls[t.icon]?`<rect class="dg-bi" x="${Me(f)}" y="${Me(u)}" width="${d}" height="${d}" rx="${p}"/>${qa(t.icon,f+d/2,u+d/2,a)}`:"";return`<g style="${dt(t.color)}"><rect class="dg-band" x="${Me(t.x+.5)}" y="${Me(t.y+.5)}" width="${Me(t.w-1)}" height="${Me(t.h-1)}" rx="${c}"/>${w}${g}${b}</g>`}function ap(t,s,c,d,p,a){const r=[[0,t.sub??"","dg-ss"],...c];return r.map(([l,f,u],g)=>{const b=r[g+1]?.[0],w=g===0?b===void 0?"":s.until(b-He.untilFade):b===void 0?s.rise(l):s.rise(l,b-He.untilFade);if(f==="")return"";const v=[[g===0?0:l,b===void 0?Number.POSITIVE_INFINITY:b-He.untilFade]],A=u==="dg-ss"?oe.boxSub:oe.boxSubStrong,N=a===void 0?wt(p,u,t.cx,d,f,A,v,"middle"):wt(p,u,a-Xe(f,A),d,f,A,v);return`<g${w?` class="dg-a" style="${w}"`:""}>${N}</g>`}).join("")}function Dg(t,s,c,d,p){const a=(r,l="")=>`<rect class="${r}" x="${Me(t.x)}" y="${Me(d)}" width="${Me(t.w)}" height="${p}" rx="${Q.box.radius}"${l}/>`;return`${c?`<g class="dg-a" style="${c}">${a("dg-halo")}</g>`:""}${a("dg-st",` ${s.sh}`)}${c?`<g class="dg-a" style="${c}">${a("dg-on")}</g>`:""}`}function Tg(t,s,c,d,p){const{icon:a,iconRadius:r,iconScale:l,iconY:f,nameY:u,subY:g}=Q.box,b=ap(t,s.m,d,t.cy+g,s.ink),w=p?p.length>0?Ng(s.m,p.map(S=>[S.start,S.end])):void 0:c.length>0?np(s,c):void 0,v=t.iconX??t.cx,A=t.slot?`<rect class="dg-slot" x="${Me(t.slot.x)}" y="${Me(t.slot.y)}" width="${Me(t.slot.w)}" height="${Me(t.slot.h)}" rx="${Q.slot.radius}"/>`:"";let N="";if(t.icon&&Ls[t.icon]){const S={x:v-a/2,y:t.cy+f-a/2,w:a,h:a};s.ink.push({text:`${t.name} の絵柄`,rect:S,shown:Fn,boxed:!0,part:{kind:"icon",box:t.name}}),N=`<rect class="dg-ic" x="${Me(S.x)}" y="${Me(S.y)}" width="${a}" height="${a}" rx="${r}"/>${qa(t.icon,v,t.cy+f,l)}`}return`<g style="${dt(t.color)}">${Dg(t,s,w,t.y,t.h)}${A}${N}${wt(s.ink,"dg-sn",t.cx,t.cy+u,t.name,oe.boxName,Fn,"middle")}${b}</g>`}function Px(t,s,c,d){const{pad:p,h:a,nameY:r,subY:l}=Q.follow.head,f=ap(t,s.m,d,p+l),u=c.length>0?np(s,c):void 0;return`<g style="${dt(t.color)}">${Dg(t,s,u,p,a)}<text class="dg-sn" x="${Me(t.cx)}" y="${Me(p+r)}" text-anchor="middle">${pt(t.name)}</text>${f}</g>`}function Ux(t,s){const{icon:c,iconRadius:d,iconScale:p,radius:a}=Q.box,r=Q.state.ghost,l=t.x+r.pad+c/2,f=t.x+r.pad+c+r.gap,u=t.icon&&Ls[t.icon]?`<rect class="dg-ic" x="${Me(l-c/2)}" y="${Me(t.cy-c/2)}" width="${c}" height="${c}" rx="${d}"/>${qa(t.icon,l,t.cy,p)}`:"",g=t.sub?r.nameY:Q.baseline.mark,b=t.sub?wt(s,"dg-ss",f,t.cy+r.subY,t.sub,oe.boxSub,Fn,"start"):"";return`<g data-ghost="${pt(t.id)}" style="${dt(t.color)}"><rect class="dg-ghost" x="${Me(t.x)}" y="${Me(t.y)}" width="${Me(t.w)}" height="${t.h}" rx="${a}"/>${u}${wt(s,"dg-sn",f,t.cy+g,t.name,oe.boxName,Fn,"start")}${b}</g>`}function Gx(t,s,c){const{r:d,inset:p}=Q.state.done,a=t.x+t.w-p,r=t.y+p;return`<g class="dg-popc dg-a" data-done="${pt(t.id)}" style="${dt(t.color)};${c.m.pop(s)}"><circle class="dg-done" cx="${Me(a)}" cy="${Me(r)}" r="${d}"/>${qa("check",a,r,.5,"dg-done-ck")}</g>`}function Yx(t,s,c,d){d.push({from:t.from,to:t.to,points:t.points,shown:Fn});const p=t.label?.family==="sans",a=t.label?wt(c,`dg-path-t${p?" dg-path-tj":""}`,t.label.x+Q.label.padX,t.label.y+t.label.h/2+Q.baseline.label,t.label.text,p?oe.labelJa:oe.label):"";return`<g data-path="${pt(`${t.from}->${t.to}`)}" style="${dt(s)}"><path class="dg-path" d="${hs(t.points)}"/><path class="dg-path-h" d="${ac(t.points)}"/>${a}</g>`}function Vx(t,s,c){const{pad:d}=Q.state.side,p=t.y+d+oe.regionName.size,a=t.notes.map((r,l)=>wt(c,"dg-side-n",t.x+d,p+Q.region.line*(l+1),r,oe.regionNote)).join("");return`<g style="${dt(s)}"><rect class="dg-side" x="${Me(t.x+.5)}" y="${Me(t.y+.5)}" width="${Me(t.w-1)}" height="${Me(t.h-1)}" rx="${Q.region.radius}"/>${wt(c,"dg-side-t",t.x+d,p,t.title,oe.regionName)}${a}</g>`}function Xx(t,s,c){const{end:d}=Q.state,p=vg(t),a=t.text===""?"":wt(c,"dg-mark",p[0],p[1],t.text,oe.regionNote),r=Me(t.x),l=Me(t.y);return t.kind==="start"?`<g data-end="start"><circle class="dg-start" cx="${r}" cy="${l}" r="${t.r}"/>${a}</g>`:t.ghost?`<g data-end="finish" style="${dt(s)}"><circle class="dg-end-x" cx="${r}" cy="${l}" r="${t.r}"/><circle class="dg-end-xi" cx="${r}" cy="${l}" r="${d.inner}"/>${a}</g>`:`<g data-end="finish"><circle class="dg-end" cx="${r}" cy="${l}" r="${t.r}"/><circle class="dg-end-in" cx="${r}" cy="${l}" r="${d.inner}"/>${a}</g>`}function Jx(t,s,c){return`<line class="dg-ll" x1="${Me(t)}" y1="${Me(s)}" x2="${Me(t)}" y2="${Me(c)}"/>`}function Qx(t,s,c,d=!1,p=0){const{m:a}=c;c.traces.push({from:t.from,to:t.to,points:t.points,shown:p>0?[[p,Number.POSITIVE_INFINITY]]:Fn});const r=hs(t.points),l=ac(t.points),{start:f,drawn:u,end:g}=s,b=d?[[g,{opacity:1},et.inOut],[g+.4,{opacity:0}],[a.total,{opacity:0}]]:[[g,{opacity:1},et.inOut],[g+.4,{opacity:.45}],[c.end+.3,{opacity:.45},et.inOut],[c.end+1,{opacity:.95}],[a.last,{opacity:.95},et.inOut],[a.total,{opacity:0}]],w=a.kf([[0,{opacity:0,"stroke-dashoffset":1}],[f,{opacity:0,"stroke-dashoffset":1},et.inOut],[f+.05,{opacity:1}],[u,{"stroke-dashoffset":0}],[a.last,{"stroke-dashoffset":0}],[a.total,{"stroke-dashoffset":1}],...b]),v=a.kf([[0,{opacity:0}],[u-.05,{opacity:0}],[u,{opacity:1}],...b]),A=-(g-u)*26,N=a.kf([[0,{opacity:0,"stroke-dashoffset":0}],[u,{opacity:0,"stroke-dashoffset":0}],[u+.25,{opacity:.9}],[g-.1,{opacity:.9},et.inOut],[g+.2,{opacity:0,"stroke-dashoffset":A}],[a.total,{opacity:0,"stroke-dashoffset":A}]]),S=d?a.kf([[0,{opacity:0}],[g,{opacity:0},et.inOut],[g+.4,{opacity:1}],[a.last,{opacity:1},et.inOut],[a.total,{opacity:0}]]):"",M=`<path class="dg-e" d="${r}"/><path class="dg-eh" d="${l}"/>`;return{base:`${p>0?`<g class="dg-a" style="${a.vis(p)}">${M}</g>`:M}${d?`<path class="dg-e-past dg-a" d="${r}" style="${S}"/><path class="dg-eh-past dg-a" d="${l}" style="${S}"/>`:""}`,lit:`<g style="${dt(t.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${r}" style="${w}"/><path class="dg-eh-on dg-a" d="${l}" style="${v}"/><path class="dg-flow dg-a" d="${r}" style="${N}"/></g>`}}function Zx(t,s,c){const d=t.family==="sans"?" dg-capj":"",{radius:p}=Q.label,a=s.again?[[s.start,s.end],[s.again.start,s.again.end]]:[[s.start,s.end]];c.ink.push({text:t.text,rect:t,shown:a,boxed:!0}),s.after&&c.ink.push({text:t.text,rect:oa(t.text,t.x+t.w/2,t.y+t.h/2+Q.baseline.label,t.family==="sans"?oe.labelJa:oe.label,"middle"),shown:[[s.after.start,s.after.end]]});const r=Me(t.x+t.w/2),l=Me(t.y+t.h/2+Q.baseline.label),f=s.after?`<g class="dg-cap-past${t.family==="sans"?" dg-cap-pastj":""} dg-a" style="${c.m.vis(s.after.start,s.after.end)}"><text x="${r}" y="${l}" text-anchor="middle">${pt(t.text)}</text></g>`:"",u=a.map(([g,b])=>`<g class="dg-cap${d} dg-a" style="${dt(t.color)};${c.m.rise(g,b,!0)}"><rect x="${Me(t.x)}" y="${Me(t.y)}" width="${Me(t.w)}" height="${t.h}" rx="${p}"/><text x="${r}" y="${l}" text-anchor="middle">${pt(t.text)}</text></g>`);return`${f}${u.join("")}`}function $0(t,s,c,d,p){const a=p?[[s,c],[p.start,p.end]]:[[s,c]];return d.ink.push({text:t.text,rect:t,shown:a,boxed:!0}),a.map(([r,l])=>`<g class="dg-act dg-a" style="${dt(t.color)};${d.m.rise(r,l,!0)}"><rect x="${Me(t.x)}" y="${Me(t.y)}" width="${Me(t.w)}" height="${t.h}" rx="${Q.action.radius}"/><text x="${Me(t.x+t.w/2)}" y="${Me(t.y+t.h/2+Q.baseline.action)}" text-anchor="middle">${pt(t.text)}</text></g>`).join("")}function Kx(t,s){const c=Q.carrier;if(t.carry.kind==="coin")return`<circle class="dg-coin" r="${c.coinR}"/><circle class="dg-coin-in" r="${c.coinIn}"/>`;if(t.carry.kind==="tag"){const d=t.carry.text,p=In(d),a=Xe(d,p?oe.carrierJa:oe.carrier)+c.tagPadX*2;return`<rect class="dg-car" x="${Me(-a/2)}" y="${-18/2}" width="${Me(a)}" height="${c.tagH}" rx="${c.tagH/2}" ${s}/><text class="dg-car-t${p?" dg-car-tj":""}" y="${Q.baseline.carrier}" text-anchor="middle">${pt(d)}</text>`}return`<rect class="dg-env" x="${-24/2}" y="${-17/2}" width="${c.envW}" height="${c.envH}" rx="3" ${s}/><path class="dg-env-in" d="M -8 -4.5 L 0 1.5 L 8 -4.5"/>`}var Wx=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;function Cg(t,s,c){const{m:d}=c,p=Q.carrier.samples,a=t.wait?[t.wait,...t.points]:t.points,r=qo(a),{depart:l,arrive:f,start:u,end:g}=s,b=[];for(let j=0;j<=p;j++){const[R,_]=ja(a,Wx(j/p)*r);b.push([l+(f-l)*j/p,R,_])}const w=b[0],v=b[b.length-1],A=t.settle??[v[1],v[2]],N=[[0,w[1],w[2]],...b];t.settle&&N.push([Math.min(f+.3,Math.max(g,f+.01)),A[0],A[1]]),N.push([g,A[0],A[1]],[d.total,A[0],A[1]]);const[S,M]=Oo(t.carry),D=t.carry.kind==="tag"?t.carry.text:t.carry.kind==="coin"?"硬貨":"封筒",z=t.carry.kind==="tag"?{}:{part:{kind:t.carry.kind==="coin"?"coin":"envelope"}},H=j=>({x:j[0]-S,y:j[1]-M,w:S*2,h:M*2});l>u&&c.ink.push({text:D,rect:H([w[1],w[2]]),shown:[[u,l]],boxed:!0,...z}),c.ink.push({text:D,rect:H(A),shown:[[f,g]],boxed:!0,...z});const Z=g<d.last?.05:.18;return`<g class="dg-a" style="${d.move(N,d.blink(u+.02,g,Z))}">${Kx(t,c.sh)}</g>`}function Ix(t,s,c=!1){const{m:d}=s,p=s.t.steps[t.step],a=p.start,r=p.end,{r:l,ring:f}=Q.badge,u={visibility:"visible"},g={visibility:"hidden"},b=t.until===void 0?void 0:s.t.steps[t.until].start,w=b!==void 0&&b<=r+1e-6,v=d.kf([[0,{opacity:0,transform:"scale(.5)",...g}],[a,{opacity:0,transform:"scale(.5)",...g},et.pop],[a+.35,{opacity:1,transform:"scale(1)",...u}],[r,{opacity:1,transform:"scale(1)",...u},et.inOut],[r+(w?He.untilFade:.4),{opacity:0,transform:"scale(1)",...g}],[d.total,{opacity:0,transform:"scale(.5)",...g}]]),A=b??d.last,N=w?d.kf([[0,{opacity:0,...g}],[d.total,{opacity:0,...g}]]):d.kf([[0,{opacity:0,...g}],[r,{opacity:0,...g},et.inOut],[r+.4,{opacity:1,...u}],[A,{opacity:1,...u},et.inOut],...b===void 0?[]:[[b+He.untilFade,{opacity:0,...g}]],[d.total,{opacity:0,...g}]]),S=d.kf([[0,{opacity:0,transform:"scale(1)"}],[a+.05,{opacity:0,transform:"scale(1)"}],[a+.1,{opacity:.7,transform:"scale(1)"},et.out],[a+.9,{opacity:0,transform:"scale(2.3)"}],[d.total,{opacity:0,transform:"scale(1)"}]]),M=Me(t.x),D=Me(t.y),z=Me(t.y+Q.baseline.badge),H=t.step+1;return s.ink.push({text:String(H),rect:{x:t.x-l,y:t.y-l,w:l*2,h:l*2},shown:[[a,A]],boxed:!0,badge:!0}),`<g class="dg-bd" data-step="${t.step}" style="${dt(t.color)}"><circle class="dg-bdr dg-popc dg-a" cx="${M}" cy="${D}" r="${f}" style="${S}"/><g class="dg-a" style="${N}"><circle class="${c?"dg-bdp-g":"dg-bdp"}" cx="${M}" cy="${D}" r="${f}"/><text class="${c?"dg-bdpt-g":"dg-bdpt"}" x="${M}" y="${z}" text-anchor="middle">${H}</text></g><g class="dg-popc dg-a" style="${v}"><circle class="dg-bdf" cx="${M}" cy="${D}" r="${l}"/><text class="dg-bdft" x="${M}" y="${z}" text-anchor="middle">${H}</text></g></g>`}function e3(t,s,c,d=!1,p=new Map,a){const{m:r,sh:l}=c,f=Q.strip,u=t.y+f.h/2,g=[`<rect class="dg-strip" x="${Me(t.x+.5)}" y="${Me(t.y+.5)}" width="${Me(t.w-1)}" height="${Me(t.h-1)}" rx="${Q.region.radius}" ${l}/>`,`<g style="${dt("slate")}"><rect class="dg-bi" x="${Me(t.x+f.pad)}" y="${Me(u-f.icon/2)}" width="${f.icon}" height="${f.icon}" rx="${Q.box.iconRadius}"/>${qa("env",t.x+f.pad+f.icon/2,u,.78)}</g>`,wt(c.ink,"dg-sh",t.x+f.titleX,u+Q.baseline.stripTitle,t.title,oe.stripTitle)];if(t.fields.forEach((b,w)=>{const v=t.fields[w-1];if(v&&v.y===b.y){const D=b.x-f.fieldGap/2;g.push(`<line class="dg-sep" x1="${Me(D)}" y1="${Me(b.y+f.sepInset)}" x2="${Me(D)}" y2="${Me(b.y+f.h-f.sepInset)}"/>`)}g.push(wt(c.ink,"dg-fl",b.x,b.y+f.nameY,b.name,oe.fieldName));const A=a?.(b);if(A!==void 0){g.push(A);return}const N=s.get(b.name)??[],S=N.filter(D=>D.value!==void 0),M=N.filter(D=>D.tag!==void 0);S.forEach((D,z)=>{const H=S[z+1]?.at,Z=D.value,j=In(Z)?"dg-fvj":"dg-fv";c.ink.push({text:Z,rect:oa(Z,b.x,b.y+f.valueY,In(Z)?oe.fieldValueJa:oe.fieldValue),shown:[[D.at,H===void 0?Number.POSITIVE_INFINITY:H-He.untilFade]]});const R=ne=>`<text class="${ne}" x="${Me(b.x)}" y="${Me(b.y+f.valueY)}">${pt(Z)}</text>`,_=R(j);if(!d){const ne=H===void 0?r.rise(D.at):r.rise(D.at,H-He.untilFade);g.push(`<g class="dg-a" style="${ne}">${_}</g>`);return}const P=Math.min(D.until,H??D.until),B=`<circle class="dg-fl-now" cx="${Me(b.x+Xe(b.name,oe.fieldName)+f.now.gap)}" cy="${Me(b.y+f.nameY-oe.fieldName.size/3)}" r="${f.now.r}"/>`;g.push(`<g class="dg-fv-now dg-a" data-step="${D.step}" style="${dt(D.color)};${r.rise(D.at,P-He.untilFade)}">${R(`${j} dg-fv-c`)}${B}</g>`),(H===void 0||H>P)&&g.push(`<g class="dg-a" style="${r.vis(P-He.untilFade,H===void 0?r.last:H-He.untilFade)}">${_}</g>`)}),M.forEach((D,z)=>{const H=M[z+1]?.at,Z=D.tag,j=[...S].reverse().find(B=>B.at<=D.at+1e-9)?.value,R=b.x+(j?Xe(j,In(j)?oe.fieldValueJa:oe.fieldValue)+f.tagGap:0),_=Xe(Z,oe.tag)+f.tagPadX*2,P=b.y+f.valueY-f.tagH/2-Q.baseline.tag;c.ink.push({text:Z,rect:{x:R,y:P,w:_,h:f.tagH},shown:[[D.at,H===void 0?Number.POSITIVE_INFINITY:H-He.untilFade]],boxed:!0}),g.push(`<g class="dg-tg dg-popc dg-a" style="${dt(D.color)};${H===void 0?r.pop(D.at):r.pop(D.at,H-He.untilFade)}"><rect x="${Me(R)}" y="${Me(P)}" width="${Me(_)}" height="${f.tagH}" rx="${f.tagH/2}"/><text x="${Me(R+_/2)}" y="${Me(P+f.tagH/2+Q.baseline.tag)}" text-anchor="middle">${pt(Z)}</text></g>`)})}),t.trail){const b=t.trail,w=t.fields[t.fields.length-1];if(w&&w.y===b.y){const A=b.x-f.fieldGap/2;g.push(`<line class="dg-sep" x1="${Me(A)}" y1="${Me(b.y+f.sepInset)}" x2="${Me(A)}" y2="${Me(b.y+f.h-f.sepInset)}"/>`)}g.push(wt(c.ink,"dg-fl",b.x,b.y+f.nameY,b.title,oe.fieldName));const v=b.y+f.valueY-oe.fieldValue.size/3;b.states.forEach((A,N)=>{const S=Me(b.x+f.trail.r+N*f.trail.step),M=p.get(A.box),D=M===void 0?"":`<circle class="dg-tr-fill dg-a" cx="${S}" cy="${Me(v)}" r="${f.trail.r}" style="${r.pop(M)}"/>`;g.push(`<g data-trail="${pt(A.box)}" style="${dt(A.color)}"><circle class="dg-tr-ring" cx="${S}" cy="${Me(v)}" r="${f.trail.r}"/>${D}</g>`)})}return g.join("")}var da=t=>Math.round(t*100)/100,N0=t=>[t.x+t.w/2,t.y+t.h/2];function t3(t,s){const c=Q.carrier,d=In(t),p=Xe(t,d?oe.carrierJa:oe.carrier)+c.tagPadX*2;return`<rect class="dg-car" x="${da(-p/2)}" y="${-18/2}" width="${da(p)}" height="${c.tagH}" rx="${c.tagH/2}" ${s}/><text class="dg-car-t${d?" dg-car-tj":""}" y="${Q.baseline.carrier}" text-anchor="middle">${pt(t)}</text>`}function n3(t,s,c,d){const{m:p}=d,a=Q.git,r=(v,A)=>c.edges.find(N=>N.step===v&&N.event===A),l=t.links.map(v=>{const A=r(v.step,v.event);if(!A)return"";d.traces.push({from:v.from,to:v.to,points:v.points,shown:[[A.start,Number.POSITIVE_INFINITY]]});const N=hs(v.points);if(v.kind==="copy")return`<g style="${dt(v.color)}"><path class="dg-git-cp dg-a" d="${N}" style="${p.vis(A.start,p.last)}"/></g>`;const S=p.kf([[0,{opacity:0,"stroke-dashoffset":1}],[A.start,{opacity:0,"stroke-dashoffset":1},et.inOut],[A.start+.05,{opacity:1}],[A.drawn,{"stroke-dashoffset":0}],[p.last,{opacity:1,"stroke-dashoffset":0},et.inOut],[p.total,{opacity:0,"stroke-dashoffset":0}]]);return`<g style="${dt(v.color)}"><path class="dg-git-l dg-a" pathLength="1" d="${N}" style="${S}"/></g>`}).join(""),f=t.commits.map(v=>{const A=r(v.step,v.event)?.drawn??0,N={x:v.cx-v.r,y:v.cy-v.r,w:v.r*2,h:v.r*2};d.ink.push({text:v.id,rect:N,shown:[[A,Number.POSITIVE_INFINITY]],boxed:!0});const S=(v.text?.lines??[]).map((j,R)=>{const _=R===0&&v.hash!==void 0,P=v.text?.baselines[R]??v.cy;return wt(d.ink,_?"dg-git-h":"dg-git-n",v.cx,P,j,_?oe.gitHash:oe.gitNote,[[A,Number.POSITIVE_INFINITY]],"middle")}).join(""),M=`<text class="dg-git-id" x="${da(v.cx)}" y="${da(v.cy+Q.baseline.badge)}" text-anchor="middle">${pt(v.id)}</text>`,D=`<g class="dg-popc dg-a" style="${p.pop(A)}"><circle class="dg-git-c" cx="${da(v.cx)}" cy="${da(v.cy)}" r="${v.r}" ${d.sh}/>${M}</g>`,z=S===""?"":`<g class="dg-a" style="${p.vis(A)}">${S}</g>`,H=v.orphan===void 0?void 0:r(v.orphan,v.orphanEvent??0)?.drawn,Z=H===void 0?"":`<g class="dg-a" data-orphan="${pt(v.id)}" style="${p.vis(H,p.last,{f:.5})}"><circle class="dg-git-old" cx="${da(v.cx)}" cy="${da(v.cy)}" r="${a.orphan}"/><text class="dg-git-oldl" x="${da(v.cx)}" y="${da(v.cy+Q.baseline.badge)}" text-anchor="middle">${pt(v.id)}</text></g>`;return`<g data-commit="${pt(v.id)}" style="${dt(v.color)}">${D}${z}${Z}</g>`}).join(""),u=t.moves.flatMap(v=>{const A=r(v.step,v.event);if(!v.line||!A)return[];const N=c.steps[v.step].end;d.traces.push({from:v.ref,to:v.target??v.ref,points:v.line,shown:[[A.start,N+.4]]});const S=p.kf([[0,{opacity:0,"stroke-dashoffset":1}],[A.start,{opacity:0,"stroke-dashoffset":1},et.inOut],[A.start+.05,{opacity:1}],[A.drawn,{"stroke-dashoffset":0}],[N,{opacity:1},et.inOut],[N+.4,{opacity:0}],[p.total,{opacity:0,"stroke-dashoffset":0}]]);return[`<g style="${dt(v.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${hs(v.line)}" style="${S}"/></g>`]}).join(""),g=c.carriers.flatMap(v=>{const A=t.moves.find(M=>M.step===v.step&&M.event===v.event&&M.line),N=s.steps[v.step]?.events[v.event];if(!A?.line||N?.type!=="edge")return[];const S={step:v.step,event:v.event,from:A.ref,to:A.target??A.ref,points:A.line,color:A.color,carry:N.carry};return[Cg(S,{...v,start:v.depart,end:v.arrive+He.fade},d)]}).join(""),w=[...new Set(t.moves.map(v=>v.ref))].map(v=>a3(v,t.moves.filter(A=>A.ref===v),r,d)).join("")+g;return{links:l,lines:u,commits:f,tags:w}}function a3(t,s,c,d){const{m:p}=d,a=[],r=[[0,{opacity:0}]];let l=!1,f;const u=v=>{f&&d.ink.push({text:t,rect:f.rect,shown:[[f.since,v]],boxed:!0}),f=void 0};for(const v of s){const A=c(v.step,v.event);if(!A)continue;const{start:N,drawn:S}=A,M=v.from?N0(v.from):void 0,D=v.to?N0(v.to):void 0;if(u(N),v.carried&&M&&D&&l){a.push([N+He.fade,M[0],M[1]],[S-He.fade,D[0],D[1]]),r.push([N,{opacity:1},et.inOut],[N+He.fade,{opacity:0}],[S-He.fade,{opacity:0},et.out],[S,{opacity:1}]),f={rect:v.to,since:S};continue}if(M&&a.push([N,M[0],M[1]]),D&&a.push([S,D[0],D[1]]),D&&!l){const z=M?N:S-He.fade;r.push([z,{opacity:0},et.out],[z+He.fade,{opacity:1}]),l=!0}else!D&&l&&(r.push([S,{opacity:1},et.inOut],[S+He.untilFade,{opacity:0}]),l=!1);v.to&&(f={rect:v.to,since:S})}if(u(Number.POSITIVE_INFINITY),a.length===0)return"";const g=a[0],b=a[a.length-1];l?r.push([p.last,{opacity:1},et.inOut],[p.total,{opacity:0}]):r.push([p.total,{opacity:0}]);const w=p.move([[0,g[1],g[2]],...a,[p.total,b[1],b[2]]],r);return`<g class="dg-a" data-ref="${pt(t)}" style="${w}">${t3(t,d.sh)}</g>`}var xn=t=>Math.round(t*100)/100,xd=(t,s,c=1)=>`translate(${xn(t)}px,${xn(s)}px) scale(${c})`,s3=(t,s)=>s.reduce((c,[d,p])=>c.flatMap(([a,r])=>p<=a||d>=r?[[a,r]]:[...a<d?[[a,d]]:[],...p<r?[[p,r]]:[]]),[t]);function o3(t,s,c,d,p){const{m:a}=d,r=Q.lineup,l=He.lineup.cut,f=B=>c.edges.find(ne=>ne.step===B.step&&ne.event===B.event)??{start:0,drawn:0},u=new Map((s.lineup?.items??[]).map(B=>[B.id,B])),g=new Map(t.lanes.map(B=>[B.id,[]])),b=new Set,w=(B,ne,ae)=>{b.has(B)!==ae&&(ae?b.add(B):b.delete(B),g.get(B)?.push([ne,ae]))};for(const B of[...c.edges].sort((ne,ae)=>ne.start-ae.start)){const ne=s.steps[B.step]?.events[B.event];if(ne?.type==="line"&&w(ne.box,B.start,!1),ne?.type==="pick")for(const ae of t.lanes)w(ae.id,B.start,ae.id!==ne.box)}const v=B=>{const ne=g.get(B)??[];if(ne.length===0)return;const ae=[[0,{opacity:1}]];let fe=1;for(const[pe,Ae]of ne){const C=Ae?r.faint:1;ae.push([pe,{opacity:fe},et.inOut],[pe+He.fade,{opacity:C}]),fe=C}return ae.push([a.last,{opacity:fe},et.inOut],[a.total,{opacity:1}]),a.kf(ae)},A=B=>[f(B).drawn,B.until?f(B.until).start:Number.POSITIVE_INFINITY],N=B=>{if(B.length===0)return;const ne=[[0,{opacity:1}]];for(const ae of B){const[fe,pe]=A(ae);ne.push([fe,{opacity:1}],[fe+l,{opacity:0}]),ae.until&&ne.push([pe,{opacity:0}],[pe+l,{opacity:1}])}return ne.push([a.total-l,{opacity:B.at(-1)?.until?1:0}],[a.total,{opacity:1}]),a.kf(ne)},S=B=>{const{start:ne,drawn:ae}=f(B),fe={opacity:0,transform:"scaleX(0)"},pe=B.until?[[f(B.until).start,{opacity:1},et.inOut],[f(B.until).start+He.fade,{opacity:0}],[a.total,{opacity:0}]]:[[a.last,{opacity:1},et.inOut],[a.total,{opacity:0}]];return a.kf([[0,fe],[ne-l,fe],[ne,{opacity:1,transform:"scaleX(0)"},et.inOut],[ae,{transform:"scaleX(1)"}],...pe])},M=B=>{if(!B.until)return;const ne=B.until,ae=t.chips.find(fe=>fe!==B&&fe.id===B.id&&fe.step===ne.step&&fe.from?.[0]===B.x&&fe.from?.[1]===B.y);return ae?{at:f(ae).start,moved:!0}:{at:f(ne).start,moved:!1}},D=B=>{const ne=f(B).start,ae=xd(0,0),fe=[];if(B.from){const Ae=xd(B.from[0]-B.x,B.from[1]-B.y);fe.push([0,{opacity:0,transform:Ae}],[ne-l,{opacity:0,transform:Ae}],[ne,{opacity:1,transform:Ae},et.inOut],[ne+He.lineup.slide,{transform:ae}])}else{const Ae=xd(0,0,Q.popFrom);fe.push([0,{opacity:0,transform:Ae}],[ne,{opacity:0,transform:Ae},et.pop],[ne+He.popFade,{opacity:1,transform:ae}])}const pe=M(B);return pe?fe.push([pe.at,{opacity:1},et.inOut],[pe.at+(pe.moved?l:He.fade),{opacity:0}],[a.total,{opacity:0}]):fe.push([a.last,{opacity:1},et.inOut],[a.total,{opacity:0}]),a.kf(fe)},z=(B,ne)=>{const ae=u.get(B.id),fe=ae?.color,pe=`<rect class="${fe?"dg-ln-chip":"dg-ln-plain"}" x="${xn(B.x)}" y="${xn(B.y)}" width="${xn(B.w)}" height="${B.h}" rx="${r.chip.radius}"/>`,Ae=s3([f(B).start+He.lineup.slide,M(B)?.at??Number.POSITIVE_INFINITY],ne),C=ae?.label===void 0?"":wt(d.ink,fe?"dg-ln-t":"dg-ln-tp",B.x+B.w/2,B.y+B.h/2+Q.baseline.tag,ae.label,oe.chip,Ae,"middle");return`<g class="dg-popc dg-a" data-lineup-chip="${pt(B.id)}" data-lineup-on="${pt(B.lane)}" data-lineup-seat="${B.index}" style="${fe?`${dt(fe)};`:""}${D(B)}">${pe}${C}</g>`},H=(B,ne,ae)=>`<g class="dg-a" data-lineup-ring="${pt(B.lane)}" style="${a.vis(f(B).start,ne?f(ne).start:a.last)}">${ae}</g>`,Z=new Map(t.lanes.map(B=>[B.id,v(B.id)])),j=t.lanes.map(B=>{const ne=(Ae,C="")=>`<rect class="${Ae}" x="${xn(B.x)}" y="${xn(B.y)}" width="${xn(B.w)}" height="${B.h}" rx="${r.radius}"${C}/>`,ae=t.picks.flatMap((Ae,C)=>Ae.lane===B.id?[H(Ae,t.picks[C+1],`${ne("dg-halo")}${ne("dg-on")}`)]:[]).join(""),fe=ap(B,a,p.get(B.id)??[],B.title.baseline,d.ink,B.noteRight),pe=Z.get(B.id);return`<g${pe?' class="dg-a"':""} data-lineup-lane="${pt(B.id)}" style="${dt(B.color)}${pe?`;${pe}`:""}">${ne("dg-st",` ${d.sh}`)}${ae}${wt(d.ink,"dg-sn",B.title.x,B.title.baseline,B.name,oe.boxName,Fn)}${fe}</g>`}).join(""),R=r.seal.stripe,_=`<defs><pattern id="dg-seal-${d.id}" patternUnits="userSpaceOnUse" width="${R*2}" height="${R*2}" patternTransform="rotate(45)"><rect class="dg-ln-sl" width="${R*2}" height="${R*2}"/><rect class="dg-ln-sd" width="${R}" height="${R*2}"/></pattern></defs>`,P=t.lanes.map(B=>{const ne=t.seals.filter(X=>X.lane===B.id),ae=ne.map(A),fe=t.chips.filter(X=>X.lane===B.id).map(X=>z(X,ae)).join(""),pe=N(ne),Ae=`<g${pe?' class="dg-a"':""} data-lineup-track="${pt(B.id)}"${pe?` style="${pe}"`:""}>${fe}</g>`,C=ne.map(X=>`<rect class="dg-ln-seal dg-a" data-lineup-seal="${pt(B.id)}" x="${xn(X.x)}" y="${xn(X.y)}" width="${xn(X.w)}" height="${xn(X.h)}" rx="${r.seal.radius}" fill="url(#dg-seal-${d.id})" style="${S(X)}"/>`).join(""),$=t.stamps.filter(X=>X.lane===B.id).map(X=>{const ie=f(X).start,T=X.x+X.w/2,G=X.y+X.h/2,re=wt(d.ink,"dg-ln-st",T,G+Q.baseline.tag,X.text,oe.stamp,[[ie,Number.POSITIVE_INFINITY]],"middle");return`<g class="dg-popc dg-a" data-lineup-stamp="${pt(B.id)}" style="${dt(r.stamp.color)};${a.pop(ie)}"><g transform="rotate(${r.stamp.tilt} ${xn(T)} ${xn(G)})"><rect class="dg-ln-stamp" x="${xn(X.x)}" y="${xn(X.y)}" width="${xn(X.w)}" height="${X.h}" rx="${r.stamp.radius}"/>${re}</g></g>`}).join(""),V=Z.get(B.id);return`<g${V?` class="dg-a" style="${V}"`:""}>${Ae}${C}${$}</g>`}).join("");return{lanes:j,chips:`${_}${P}`}}var Pe=t=>Math.round(t*100)/100,js=(t,s)=>In(s)?`${t} ${t}j`:t,ul=t=>({...t,family:"sans"});function Og(t){const s=[];for(const c of t){const d=s[s.length-2],p=s[s.length-1];if(d&&p){const a=p[0]===d[0]?Number.NaN:(p[1]-d[1])/(p[0]-d[0]),r=c[0]===p[0]?Number.NaN:(c[1]-p[1])/(c[0]-p[0]);Number.isFinite(a)&&Number.isFinite(r)&&Math.abs(a-r)<1e-9?s[s.length-1]=c:s.push(c)}else s.push(c)}return s}function Mg(t,s){const c=t[0];if(!c)return 0;if(s<=c[0])return c[1];for(let d=1;d<t.length;d++){const[p,a]=t[d],[r,l]=t[d-1];if(s<=p)return p===r?a:l+(a-l)*(s-r)/(p-r)}return t[t.length-1][1]}function i3(t,s,c,d,p){const{m:a,ink:r}=d,l=Q.time,{axis:f}=t,u=new Map((c.units??[]).map($=>[$.unit,$.passed])),g=($,V)=>c.events.find(X=>X.step===$&&X.event===V)?.at,b=($,V)=>c.edges.find(X=>X.step===$&&X.event===V)?.drawn,w=[],v=[],A=[],N=[],S=Math.min(...t.rows.map($=>$.y)),M=Math.max(...t.rows.map($=>$.y+$.h)),D=new Map;for(const $ of t.wires){const V=b($.step,$.event);V!==void 0&&D.set($.to,Math.min(D.get($.to)??Number.POSITIVE_INFINITY,V))}const z=($,V)=>{const X=t.zoom?.columns.find(T=>T.unit===V)?.boxes.find(T=>T.id===$),ie=[u.get(V),X?D.get(X):void 0].filter(T=>T!==void 0);return ie.length>0?Math.min(...ie):void 0};for(const $ of t.periods)$.index%2===1&&w.push(`<rect class="dg-tm-ep" x="${Pe($.x)}" y="${Pe(S-l.shade)}" width="${Pe($.w)}" height="${Pe(M-S+l.shade*2)}" rx="4"/>`);if(t.zoom){const $=t.zoom;$.columns.forEach((V,X)=>{X>0&&w.push(`<line class="dg-tm-sep" x1="${Pe(V.x)}" y1="${Pe(V.y+l.sep)}" x2="${Pe(V.x)}" y2="${Pe(V.y+V.h-l.sep)}"/>`),w.push(wt(r,js("dg-tm-hd",V.head),V.x+V.w/2,$.headY,V.head,oe.timeHead,Fn,"middle"));for(const ie of V.boxes)A.push(H(ie,V.unit))})}function H($,V){const X=[...new Set(t.wires.filter(re=>re.from===$||re.to===$).map(re=>re.step))].sort((re,Y)=>re-Y),ie=re=>`<rect class="${re}" x="${Pe($.x)}" y="${Pe($.y)}" width="${Pe($.w)}" height="${$.h}" rx="${Q.box.radius}"/>`;if($.empty){const re=u.get(V),Y=t.zoom?.empty??"",xe=re===void 0?"":`<g class="dg-a" style="${a.vis(re)}">${ie("dg-tm-ex")}${wt(r,"dg-tm-ext",$.cx,$.cy+Q.baseline.mark,Y,oe.emptyText,[[re,Number.POSITIVE_INFINITY]],"middle")}</g>`;return`<g data-empty="${pt($.id)}">${ie("dg-tm-ph")}${xe}</g>`}const T=$g(s.boxes.find(re=>re.id===$.id)?.link,Tg($,d,X,p.get($.id)??[]));if(!$.row)return T;const G=z($.row,V);return G===void 0?ie("dg-tm-ph"):`<g class="dg-a" style="${a.until(G)}">${ie("dg-tm-ph")}</g><g class="dg-popc dg-a" style="${a.pop(G)}">${T}</g>`}for(const $ of t.rows){const V=[];for(const X of t.marks.filter(ie=>ie.row===$.id)){const ie=(G,re="")=>`<rect class="${G}" x="${Pe(X.x)}" y="${Pe(X.y)}" width="${Pe(X.w)}" height="${Pe(X.h)}" rx="${l.markRadius}"${re}/>`;if(V.push(ie("dg-tm-slot")),X.empty){const G=u.get(X.unit);G!==void 0&&V.push(`<circle class="dg-tm-x dg-a" cx="${Pe(X.x+X.w/2)}" cy="${Pe(X.y+X.h/2)}" r="${l.emptyR}" style="${a.vis(G,a.last,{f:.2})}"/>`);continue}const T=z($.id,X.unit);T!==void 0&&V.push(ie("dg-tm-m dg-a",` style="${a.vis(T,a.last,{f:.2})}"`)),X.colors.forEach((G,re)=>{const Y=g(G.step,G.event);if(Y===void 0)return;const xe=X.colors[re+1],ke=xe?g(xe.step,xe.event):void 0;V.push(`<g style="${dt(G.color)}">${ie("dg-tm-m dg-a",` style="${a.vis(Y,ke??a.last,{f:.35})}"`)}</g>`)})}w.push(`<g data-row="${pt($.id)}" style="${dt($.color)}">${V.join("")}</g>`),w.push(wt(r,"dg-tm-rn",Q.margin+Q.region.inset,$.y+$.h/2+Q.baseline.mark,$.name,oe.timeRow))}if(t.zoom){const $=t.zoom,V=t.spans.filter(T=>T.kind==="box"&&T.from<=$.to&&$.from<=T.to).map(T=>g(T.step,T.event)).filter(T=>T!==void 0).sort((T,G)=>T-G)[0],X=$.guides.map(T=>`<path class="dg-tm-gd" d="${hs(T)}"/>`).join(""),ie=`<rect class="dg-tm-fr" x="${Pe($.frame.x)}" y="${Pe($.frame.y)}" width="${Pe($.frame.w)}" height="${Pe($.frame.h)}" rx="4"/>${X}`;w.push(V===void 0?ie:`<g class="dg-a" style="${a.until(V)}">${ie}</g>`)}const Z=$=>Pe(f.x+$*f.unit),j=t.ticks.map($=>`M ${Z($.at)} ${Pe(f.line-l.major/2)} V ${Pe(f.line+l.major/2)}`),R=t.minor.map($=>`M ${Z($)} ${Pe(f.line-l.minor/2)} V ${Pe(f.line+l.minor/2)}`);w.push(`<path class="dg-tm-ax" d="M ${Z(0)} ${Pe(f.line)} H ${Z(f.count)} ${[...j,...R].join(" ")}"/>`);for(const $ of t.ticks)w.push(wt(r,js("dg-tm-tk",$.text),$.left,$.y,$.text,oe.timeTick));for(const $ of t.periods)w.push(wt(r,js("dg-tm-en",$.name),$.x+$.w/2,$.nameY,$.name,oe.timePeriod,Fn,"middle")),w.push(wt(r,js("dg-tm-er",$.range),$.x+$.w/2,$.rangeY,$.range,oe.timeRange,Fn,"middle"));for(const $ of t.spans){const V=g($.step,$.event);if(V===void 0)continue;const X=$.until===void 0?void 0:c.steps[$.until].start,ie=[[V,X??Number.POSITIVE_INFINITY]],T=X===void 0?a.vis(V):a.vis(V,X,{within:!0});if($.kind==="bracket"){const[re,Y,xe,ke]=[Pe($.x+1),Pe($.x+$.w-1),Pe($.y),Pe($.y+$.h)],ze=wt(r,js("dg-tm-bt",$.text),$.textRect.x+$.textRect.w/2,$.textY,$.text,oe.spanText,ie,"middle");w.push(`<g class="dg-a" data-span="${$.step}" style="${dt($.color)};${T}"><path class="dg-tm-br" d="M ${re} ${xe} L ${re} ${ke} L ${Y} ${ke} L ${Y} ${xe}"/>${ze}</g>`);continue}w.push(`<g class="dg-a" data-span="${$.step}" style="${dt($.color)};${T}"><rect class="dg-tm-bx" x="${Pe($.x)}" y="${Pe($.y)}" width="${Pe($.w)}" height="${Pe($.h)}" rx="6"/></g>`);const G=$.textRect;r.push({text:$.text,rect:G,shown:ie,boxed:!0}),N.push(`<g class="dg-tg dg-popc dg-a" style="${dt($.color)};${X===void 0?a.pop(V):a.pop(V,X)}"><rect x="${Pe(G.x)}" y="${Pe(G.y)}" width="${Pe(G.w)}" height="${G.h}" rx="${G.h/2}"/><text x="${Pe(G.x+G.w/2)}" y="${Pe($.textY)}" text-anchor="middle">${pt($.text)}</text></g>`)}const _=l.point;for(const $ of t.points){const{cx:V,cy:X,r:ie}=$,T=$.changes.map(Re=>g(Re.step,Re.event)??Number.POSITIVE_INFINITY),G=T[0];w.push(`<path class="dg-tm-con" d="M ${Pe(V)} ${Pe(M+3)} L ${Pe(V)} ${Pe(X-ie-2)}"/>`);const re=$.text.x,Y=wt(r,js("dg-tm-pn",$.id),re,X+_.nameY,$.id,oe.pointName),xe=Y.replace(/class="([^"]*)"/u,'class="$1 dg-tm-pn-g"'),ke=G===void 0||!Number.isFinite(G)?xe:`<g class="dg-a" style="${a.until(G)}">${xe}</g><g class="dg-a" style="${a.vis(G)}">${Y}</g>`,ze=$.changes.map((Re,Qe)=>{const K=T[Qe];if(!Number.isFinite(K))return"";const U=T[Qe+1],Ne=U!==void 0&&Number.isFinite(U)?U-He.untilFade:void 0,F=wt(r,js("dg-tm-ps",Re.text),re,X+_.stateY,Re.text,oe.pointState,[[K,Ne??Number.POSITIVE_INFINITY]]);return`<g class="dg-a" style="${dt(Re.color??"slate")};${Ne===void 0?a.rise(K):a.rise(K,Ne)}">${F}</g>`}).join(""),Fe=$.changes.map((Re,Qe)=>{const K=T[Qe];return!Re.color||!Number.isFinite(K)?"":`<g class="dg-popc dg-a" style="${dt(Re.color)};${a.pop(K)}"><circle class="dg-tm-pc" cx="${Pe(V)}" cy="${Pe(X)}" r="${ie+.5}"/>${qa("flag",V,X,_.glyph,"dg-tm-pcg")}</g>`}).join("");A.push(`<g data-point="${pt($.id)}"><circle class="dg-tm-pg" cx="${Pe(V)}" cy="${Pe(X)}" r="${ie}"/>${qa("flag",V,X,_.glyph,"dg-tm-pgl")}${Fe}${ke}${ze}</g>`)}const P=new Set(t.wires.map($=>`${$.step}/${$.event}`));for(const $ of t.edges){if(P.has(`${$.step}/${$.event}`))continue;const V=c.edges.find(T=>T.step===$.step&&T.event===$.event);if(!V)continue;d.traces.push({from:$.from,to:$.to,points:$.points,shown:[[V.start,Number.POSITIVE_INFINITY]]});const X=a.kf([[0,{opacity:0,"stroke-dashoffset":1}],[V.start,{opacity:0,"stroke-dashoffset":1},et.inOut],[V.start+.05,{opacity:1}],[V.drawn,{"stroke-dashoffset":0}],[a.last,{opacity:1,"stroke-dashoffset":0},et.inOut],[a.total,{opacity:0,"stroke-dashoffset":0}]]),ie=a.kf([[0,{opacity:0}],[V.drawn-.05,{opacity:0}],[V.drawn,{opacity:1}],[a.last,{opacity:1},et.inOut],[a.total,{opacity:0}]]);v.push(`<g data-link="${pt(`${$.from}->${$.to}`)}" style="${dt($.color)}"><path class="dg-tm-ln dg-a" pathLength="1" d="${hs($.points)}" style="${X}"/><path class="dg-eh-on dg-a" d="${ac($.points)}" style="${ie}"/></g>`)}const B=c.needle??[],ne=Og(B.filter(([$])=>$<a.total)),ae=ne[ne.length-1]?.[1]??0,fe=[...ne.map(([$,V])=>[$,f.x+V*f.unit,0]),[a.last,f.x+ae*f.unit,0],[a.total,f.x,0]],{y1:pe,y2:Ae}=t.needle,C=l.needle;return N.push(`<g class="dg-a" data-needle="" style="${a.move(fe)}"><line class="dg-tm-nd" x1="0" y1="${Pe(pe)}" x2="0" y2="${Pe(Ae)}"/><path class="dg-tm-nh" d="M ${-6*.75} ${Pe(pe-C.head)} L ${C.head*.75} ${Pe(pe-C.head)} L 0 ${Pe(pe)} Z"/><circle class="dg-tm-nh" cy="${Pe(f.line)}" r="${C.dot}"/></g>`),{base:w.join(""),lit:v.join(""),node:A.join(""),top:N.join("")}}function r3(t,s,c){const{m:d}=c,p=Q.time.meter,{x:a,w:r,line:l,text:f}=t.meter,u=t.y+p.y,g=d.kf([...Og(s).map(([w,v])=>[w,{transform:`scaleX(${Pe(v*1e3)/1e3})`}]),[d.last,{transform:`scaleX(${Pe(Mg(s,d.last)*1e3)/1e3})`},et.inOut],[d.total,{transform:"scaleX(0)"}]]),b=a+r*l;return`<rect class="dg-tm-mt" x="${Pe(a)}" y="${Pe(u)}" width="${Pe(r)}" height="${p.h}" rx="${p.h/2}"/><rect class="dg-tm-mf dg-a" x="${Pe(a)}" y="${Pe(u)}" width="${Pe(r)}" height="${p.h}" rx="${p.h/2}" style="${dt(p.color)};${g}"/><line class="dg-tm-mk" x1="${Pe(b)}" y1="${Pe(u-p.mark)}" x2="${Pe(b)}" y2="${Pe(u+p.h+p.mark)}"/>`+wt(c.ink,"dg-tm-ml",b,t.y+p.textY,f,oe.meterLine,Fn,"middle")}function l3(t,s,c,d,p,a){const r=s.steps[c],l=Mg(s.needle??[],r.end-He.still),f=t.axis.x+l*t.axis.unit,u=Math.min(...t.rows.map(N=>N.y)),g=Math.max(...t.rows.map(N=>N.y+N.h));let b={x:f-1,y:u,w:2,h:g-u};const w=t.badges.find(N=>N.step===c),v=N=>Math.hypot(Math.max(0,N.x-f,f-N.x-N.w),Math.max(0,N.y-u,u-N.y-N.h)),A=[...w?[{x:w.x-Q.badge.r,y:w.y-Q.badge.r,w:Q.badge.r*2,h:Q.badge.r*2}]:[],...[...d].sort((N,S)=>v(N)-v(S))];for(const N of A){const S=Math.min(b.x,N.x),M=Math.min(b.y,N.y),D={x:S,y:M,w:Math.max(b.x+b.w,N.x+N.w)-S,h:Math.max(b.y+b.h,N.y+N.h)-M};D.w<=p&&D.h<=a&&(b=D)}return b}var sa=t=>Math.round(t*100)/100;function c3(t,s,c,d){const{m:p}=d,a=Q.tree,r=Q.box,l=(j,R)=>c.edges.find(_=>_.step===j&&_.event===R),f=new Map,u=new Map;s.steps.forEach((j,R)=>{for(const _ of j.events)if(_.type==="edge")for(const P of[_.from,_.to])f.set(P,(f.get(P)??new Set).add(R)),_.carry.kind!=="none"&&!u.has(P)&&u.set(P,R)});const g=(j,R)=>{const _=s.steps[j]?.events[R];return _?.type==="edge"&&_.carry.kind!=="none"},b=t.runs.filter(j=>g(j.step,j.event)).reduce((j,R)=>j===void 0?R.step:Math.min(j,R.step),void 0),w=b===void 0?void 0:c.steps[b]?.start,v=j=>{if(b===void 0||w===void 0)return;const R=u.get(j);if(R!==void 0&&R<=b)return;const _=R===void 0?void 0:c.steps[R]?.start,P=[[0,{opacity:1}],[w,{opacity:1},et.inOut],[w+He.fade,{opacity:a.faint}]];return _!==void 0&&P.push([_,{opacity:a.faint},et.inOut],[_+He.fade,{opacity:1}]),P.push([p.last,{opacity:_===void 0?a.faint:1},et.inOut],[p.total,{opacity:1}]),p.kf(P)},A=(j,R,_="")=>{const P=v(j);return P?`<g class="dg-a"${_} style="${P}">${R}</g>`:_===""?R:`<g${_}>${R}</g>`},N=new Map(t.nodes.map(j=>[j.id,l(j.step,j.event)?.drawn??0])),S=t.links.map(j=>{const R=l(j.step,j.event);if(!R)return"";d.traces.push({from:j.from,to:j.to,points:j.points,shown:[[R.start,Number.POSITIVE_INFINITY]]});const _=p.kf([[0,{opacity:0,"stroke-dashoffset":1}],[R.start,{opacity:0,"stroke-dashoffset":1},et.inOut],[R.start+.05,{opacity:1}],[R.drawn,{"stroke-dashoffset":0}],[p.last,{opacity:1,"stroke-dashoffset":0},et.inOut],[p.total,{opacity:0,"stroke-dashoffset":0}]]);return A(j.from,`<path class="dg-tree-l dg-a" data-tree-link="${pt(j.from)}" pathLength="1" d="${hs(j.points)}" style="${_}"/>`)}).join(""),M=t.nodes.flatMap(j=>{if(!j.card)return[];const R=N.get(j.id)??0,_=`M ${sa(j.cx)} ${sa(j.y+j.h+Q.edge.inset)} V ${sa(j.card.y-Q.edge.inset)}`;return[A(j.id,`<path class="dg-tree-con dg-a" d="${_}" style="${p.vis(R)}"/>`)]}).join(""),D=new Set,z=t.runs.flatMap(j=>{const R=t.edges.find(pe=>pe.step===j.step&&pe.event===j.event);if(!R||D.has(j.link))return[];const _=c.carriers.find(pe=>pe.step===j.step&&pe.event===j.event),P=l(j.step,j.event),B=_?.depart??P?.start,ne=_?.arrive??P?.drawn;if(B===void 0||ne===void 0)return[];D.add(j.link);const ae=p.kf([[0,{opacity:0,"stroke-dashoffset":1}],[B,{opacity:0,"stroke-dashoffset":1},et.inOut],[B+.05,{opacity:1}],[ne,{"stroke-dashoffset":0}],[p.last,{opacity:1,"stroke-dashoffset":0},et.inOut],[p.total,{opacity:0,"stroke-dashoffset":0}]]),fe=hs(R.points);return[`<g style="${dt(R.color)}"><path class="dg-tree-tr dg-a" data-tree-trail="${pt(j.link)}" pathLength="1" d="${fe}" style="${ae}"/><path class="dg-tree-h dg-a" d="${ac(R.points)}" style="${p.vis(ne)}"/></g>`]}).join(""),H=t.nodes.flatMap(j=>{const R=j.card;if(!R)return[];const _=R.x+a.card.padX+a.card.icon/2,P=R.y+R.h/2,B=wt(d.ink,"dg-tree-ct",R.x+a.card.padX+a.card.icon+a.card.gap,P+Q.baseline.label,R.text,oe.treeCard,Fn);return[A(j.id,`<rect class="dg-tree-card" x="${sa(R.x)}" y="${sa(R.y)}" width="${sa(R.w)}" height="${R.h}" rx="${a.card.radius}"/>${qa("doc",_,P,a.card.glyph,"dg-tree-cg")}${B}`,` data-tree-card="${pt(j.id)}"`)]}).join(""),Z=t.nodes.map(j=>{const R=N.get(j.id)??0,_=[...f.get(j.id)??[]].sort((V,X)=>V-X),P=_.length>0?np(d,_):void 0,B=j.root?a.root.radius:a.radius,ne=(V,X="")=>`<rect class="${V}" x="${sa(j.x)}" y="${sa(j.y)}" width="${sa(j.w)}" height="${j.h}" rx="${B}"${X}/>`,ae=`${P?`<g class="dg-a" style="${P}">${ne("dg-halo")}</g>`:""}${ne("dg-st",` ${d.sh}`)}${P?`<g class="dg-a" style="${P}">${ne("dg-on")}</g>`:""}`,fe=j.x+a.root.iconX+r.icon/2,pe=j.root?`<rect class="dg-ic" x="${sa(fe-r.icon/2)}" y="${sa(j.cy-r.icon/2)}" width="${r.icon}" height="${r.icon}" rx="${r.iconRadius}"/>${qa("tree",fe,j.cy,r.iconScale)}`:"",Ae=[[R,Number.POSITIVE_INFINITY]],C=j.lines.map((V,X)=>{const ie=j.styles[X]??oe.boxName,T=ie===oe.treeHash?"dg-tree-hash":ie===oe.treeName?"dg-tree-name":ie===oe.rootHash?"dg-tree-rh":ie===oe.rootName?"dg-tree-rn":"dg-tree-one",G=j.baselines[X]??j.cy;return j.root?wt(d.ink,T,j.x+a.root.textX,G,V,ie,Ae):wt(d.ink,T,j.cx,G,V,ie,Ae,"middle")}).join(""),$=A(j.id,`${ae}${pe}${C}`,` data-tree-node="${pt(j.id)}"${j.root?` data-tree-root="${pt(j.id)}"`:""}`);return`<g class="dg-popc dg-a" style="${dt(j.color)};${p.pop(R)}">${$}</g>`}).join("");return{links:S+M,trails:z,nodes:H+Z,appear:N}}var D0=t=>Math.round(t*100)/100,u3=class{constructor(t,s,c){this.prefix=t,this.total=s,this.last=c}prefix;total;last;frames=[];count=0;pct(t){return+(Math.min(Math.max(t,0),this.total)/this.total*100).toFixed(3)}kf(t){const s=`${this.prefix}-${this.count++}`,c=new Map;for(const[p,a,r]of[...t].sort((l,f)=>l[0]-f[0])){const l=this.pct(p),f=c.get(l)??{props:{}};Object.assign(f.props,a),r&&(f.ease=r),c.set(l,f)}const d=[...c].map(([p,{props:a,ease:r}])=>{const l=Object.entries(a).map(([f,u])=>`${f}:${u}`);return r&&l.push(`animation-timing-function:${r}`),`${p}%{${l.join(";")}}`}).join("");return this.frames.push(`@keyframes ${s}{${d}}`),`animation-name:${s}`}vis(t,s=this.last,c={}){const d=c.f??He.fade,p=c.on??{},a=c.off??{},r=c.within?Math.max(t+d,s-d):s;return this.kf([[0,{opacity:0,...a}],[t,{opacity:0,...a},c.ein??et.out],[t+d,{opacity:1,...p}],[r,{opacity:1,...p},et.inOut],[Math.min(r+d,this.total),{opacity:0,...a}],[this.total,{opacity:0,...a}]])}rise(t,s=this.last,c=!1){return this.vis(t,s,{on:{transform:"translateY(0)"},off:{transform:`translateY(${Q.rise}px)`},within:c})}pop(t,s=this.last){return this.vis(t,s,{f:He.popFade,ein:et.pop,on:{transform:"scale(1)"},off:{transform:`scale(${Q.popFrom})`}})}until(t){const s=He.untilFade;return this.kf([[0,{opacity:1}],[t,{opacity:1},et.inOut],[t+s,{opacity:0}],[this.last,{opacity:0}],[this.total,{opacity:1}]])}move(t,s=[]){return this.kf(t.map(([c,d,p,a=1,r])=>[c,{transform:`translate(${D0(d)}px,${D0(p)}px) scale(${a})`},r]).concat(s))}blink(t,s,c){return[[0,{opacity:0}],[t-.01,{opacity:0}],[t,{opacity:1}],[s,{opacity:1}],[s+c,{opacity:0}],[this.total,{opacity:0}]]}},Ze=t=>`font:${t.weight} ${t.size}px var(--${t.family})`,bn=(t,s="var(--surf)")=>`color-mix(in srgb,var(--c) ${t}%,${s})`,We=Q.stroke,Ot=Q.mix,wd=`color-mix(in srgb,var(--mute) ${Ot.past}%,var(--bg))`,d3=[".dg{display:block;width:100%;height:auto;overflow:visible}",".dg .dg-a{animation-duration:var(--T);animation-timing-function:linear;animation-iteration-count:infinite;animation-fill-mode:both;animation-delay:calc(var(--at,0) * -1s);animation-play-state:var(--play,running)}",".dg .dg-popc{transform-box:fill-box;transform-origin:center}",".dg-bg{fill:var(--bg)}",".dg-band{fill:color-mix(in srgb,var(--c) var(--tint),var(--bg));stroke:color-mix(in srgb,var(--c) var(--edge),transparent)}",`.dg-bi{fill:${bn(Ot.regionIcon)};stroke:${bn(Ot.regionIconEdge,"transparent")}}`,`.dg-bz{${Ze(oe.regionName)};fill:var(--ct)}`,`.dg-bx{${Ze(oe.regionNote)};fill:var(--mute)}`,".dg-st{fill:var(--surf);stroke:var(--hair)}",`.dg-halo{fill:none;stroke:var(--c);stroke-width:${We.halo};stroke-opacity:.16}`,`.dg-on{fill:none;stroke:var(--c);stroke-width:${We.on}}`,`.dg-ic{fill:${bn(Ot.icon)}}`,`.dg-slot{fill:none;stroke:${bn(Ot.slot,"transparent")};stroke-width:${We.slot};stroke-dasharray:3 3}`,`.dg-gl{fill:none;stroke:var(--c);stroke-width:${We.glyph};stroke-linecap:round;stroke-linejoin:round}`,`.dg-sn{${Ze(oe.boxName)};fill:var(--ink)}`,`.dg-ss{${Ze(oe.boxSub)};fill:var(--mute)}`,`.dg-ss-ok{${Ze(oe.boxSubStrong)};fill:var(--ct)}`,`.dg-ss-act{${Ze(oe.boxSubStrong)};fill:var(--ink)}`,`.dg-ll{stroke:var(--line);stroke-width:${We.lifeline};stroke-dasharray:3 4}`,`.dg-e{fill:none;stroke:var(--line);stroke-width:${We.edge};stroke-linecap:round;stroke-dasharray:0 ${Q.edge.ghostDash}}`,`.dg-eh{fill:none;stroke:var(--line);stroke-width:${We.arrow};stroke-linecap:round;stroke-linejoin:round}`,`.dg-e-on{fill:none;stroke:var(--c);stroke-width:${We.edgeOn};stroke-linecap:round;stroke-dasharray:1 2}`,`.dg-eh-on{fill:none;stroke:var(--c);stroke-width:${We.edgeOn};stroke-linecap:round;stroke-linejoin:round}`,`.dg-flow{fill:none;stroke:var(--surf);stroke-width:${We.flow};stroke-linecap:round;stroke-dasharray:1.5 ${Q.edge.flowDash}}`,`.dg-e-past{fill:none;stroke:${wd};stroke-width:${We.edge};stroke-linecap:round}`,`.dg-eh-past{fill:none;stroke:${wd};stroke-width:${We.arrow};stroke-linecap:round;stroke-linejoin:round}`,".dg-bd{cursor:pointer}",".dg-bdf{fill:var(--c)}",`.dg-bdft{${Ze(oe.badge)};fill:var(--on-c)}`,`.dg-bdr{fill:none;stroke:var(--c);stroke-width:${We.badgeRing};pointer-events:none}`,`.dg-bdp{fill:${bn(Ot.badgePast)};stroke:${bn(Ot.badgePastEdge,"transparent")};stroke-width:${We.hair}}`,`.dg-bdpt{${Ze(oe.badge)};fill:var(--ct)}`,`.dg-bdp-g{fill:var(--surf);stroke:${wd};stroke-width:${We.hair}}`,`.dg-bdpt-g{${Ze(oe.badge)};fill:var(--mute)}`,`.dg-cap rect,.dg-act rect{fill:${bn(Ot.cap)};stroke:${bn(Ot.capEdge,"transparent")}}`,`.dg-cap text{${Ze(oe.label)};fill:var(--ct)}`,`.dg-capj text{${Ze(oe.labelJa)}}`,`.dg-cap-past text{${Ze(oe.label)};fill:var(--mute);fill-opacity:${Q.state.pastLabel}}`,`.dg-cap-pastj text{${Ze(oe.labelJa)}}`,`.dg-act text{${Ze(oe.action)};fill:var(--ct)}`,".dg-car{fill:var(--carry,var(--ink))}",`.dg-car-t{${Ze(oe.carrier)};fill:var(--bg)}`,`.dg-car-tj{${Ze(oe.carrierJa)}}`,`.dg-env{fill:var(--carry,var(--ink));stroke:var(--surf);stroke-width:${We.envelope}}`,`.dg-env-in{fill:none;stroke:var(--surf);stroke-width:${We.flow};stroke-linejoin:round;stroke-linecap:round}`,".dg-coin{fill:var(--coin);stroke:var(--surf);stroke-width:1.2}",".dg-coin-in{fill:none;stroke:var(--coinin);stroke-width:1.1}",".dg-strip{fill:var(--surf);stroke:var(--hair)}",`.dg-sep{stroke:var(--hair);stroke-width:${We.hair}}`,`.dg-sh{${Ze(oe.stripTitle)};fill:var(--ink)}`,`.dg-fl{${Ze(oe.fieldName)};fill:var(--mute)}`,`.dg-fv{${Ze(oe.fieldValue)};fill:var(--ink)}`,`.dg-fvj{${Ze(oe.fieldValueJa)};fill:var(--ink)}`,".dg-fv-c{fill:var(--ct)}",".dg-fl-now{fill:var(--c)}",`.dg-tr-ring{fill:none;stroke:var(--line);stroke-width:${We.trail}}`,".dg-tr-fill{fill:var(--c)}",".dg-tg rect{fill:var(--c)}",`.dg-tg text{${Ze(oe.tag)};fill:var(--on-c)}`,`.dg-side{fill:color-mix(in srgb,var(--c) ${Ot.side}%,var(--bg));stroke:${bn(Ot.sideEdge,"transparent")};stroke-dasharray:4 4}`,`.dg-side-t{${Ze(oe.regionName)};fill:var(--ct)}`,`.dg-side-n{${Ze(oe.regionNote)};fill:var(--mute)}`,`.dg-ghost{fill:var(--surf);stroke:${bn(Ot.ghostEdge,"transparent")};stroke-dasharray:4 3}`,`.dg-path{fill:none;stroke:${bn(Ot.path,"transparent")};stroke-width:${We.path};stroke-linecap:round;stroke-dasharray:0 ${Q.edge.ghostDash}}`,`.dg-path-h{fill:none;stroke:${bn(Ot.path,"transparent")};stroke-width:${We.arrow};stroke-linecap:round;stroke-linejoin:round}`,`.dg-path-t{${Ze(oe.label)};fill:var(--ct)}`,`.dg-path-tj{${Ze(oe.labelJa)}}`,".dg-start{fill:var(--ink)}",`.dg-end{fill:var(--bg);stroke:var(--ink);stroke-width:${We.end}}`,".dg-end-in{fill:var(--ink)}",`.dg-end-x{fill:var(--bg);stroke:${bn(Ot.path,"transparent")};stroke-width:${We.arrow};stroke-dasharray:2 2.5}`,`.dg-end-xi{fill:${bn(Ot.path,"transparent")}}`,`.dg-mark{${Ze(oe.regionNote)};fill:var(--mute)}`,`.dg-done{fill:var(--ink);stroke:var(--surf);stroke-width:${We.done}}`,`.dg-done-ck{fill:none;stroke:var(--surf);stroke-width:${We.glyph};stroke-linecap:round;stroke-linejoin:round}`,`.dg-git-l{fill:none;stroke:var(--c);stroke-width:${We.git};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,`.dg-git-cp{fill:none;stroke:var(--c);stroke-width:${We.gitOrphan};stroke-linecap:round;stroke-dasharray:3 3;stroke-opacity:.7}`,`.dg-git-c{fill:var(--surf);stroke:var(--c);stroke-width:${We.git}}`,`.dg-git-id{${Ze(oe.gitId)};fill:var(--ct)}`,`.dg-git-h{${Ze(oe.gitHash)};fill:var(--mute)}`,`.dg-git-n{${Ze(oe.gitNote)};fill:var(--ink2)}`,`.dg-git-old{fill:var(--surf);stroke:var(--c);stroke-width:${We.gitOrphan};stroke-dasharray:3 3;stroke-opacity:.6}`,`.dg-git-oldl{${Ze(oe.gitId)};fill:var(--ct);opacity:.55}`,`.dg-tree-l{fill:none;stroke:var(--line);stroke-width:${We.tree};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,`.dg-tree-tr{fill:none;stroke:var(--c);stroke-width:${We.treeTrail};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,`.dg-tree-h{fill:none;stroke:var(--c);stroke-width:${We.treeTrail};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tree-con{fill:none;stroke:var(--line);stroke-width:${We.treeCon};stroke-linecap:round;stroke-dasharray:2 3.5}`,`.dg-tree-card{fill:var(--surf);stroke:var(--hair);stroke-width:${We.hair}}`,`.dg-tree-cg{fill:none;stroke:var(--mute);stroke-width:${We.glyph};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tree-ct{${Ze(oe.treeCard)};fill:var(--ink)}`,`.dg-tree-hash{${Ze(oe.treeHash)};fill:var(--ink)}`,`.dg-tree-name{${Ze(oe.treeName)};fill:var(--mute)}`,`.dg-tree-one{${Ze(oe.boxName)};fill:var(--ink)}`,`.dg-tree-rh{${Ze(oe.rootHash)};fill:var(--ink)}`,`.dg-tree-rn{${Ze(oe.rootName)};fill:var(--mute)}`,".dg-ln-chip{fill:var(--c)}",`.dg-ln-plain{fill:color-mix(in srgb,var(--mute) ${Ot.chipPlain}%,var(--surf))}`,`.dg-ln-t{${Ze(oe.chip)};fill:var(--on-c)}`,`.dg-ln-tp{${Ze(oe.chip)};fill:var(--ink)}`,".dg-ln-seal{transform-box:fill-box;transform-origin:0 50%}",`.dg-ln-sd{fill:color-mix(in srgb,var(--mute) ${Ot.sealDark}%,var(--surf))}`,`.dg-ln-sl{fill:color-mix(in srgb,var(--mute) ${Ot.sealLight}%,var(--surf))}`,`.dg-ln-stamp{fill:var(--surf);stroke:var(--c);stroke-width:${We.stamp}}`,`.dg-ln-st{${Ze(oe.stamp)};fill:var(--ct)}`,`.dg-tm-ep{fill:color-mix(in srgb,var(--ink) ${Ot.timeShade}%,transparent)}`,`.dg-tm-sep{stroke:var(--hair);stroke-width:${We.hair};stroke-dasharray:2 4}`,`.dg-tm-hd{${Ze(oe.timeHead)};fill:var(--ink)}`,`.dg-tm-hdj{${Ze(ul(oe.timeHead))}}`,`.dg-tm-slot{fill:none;stroke:var(--line);stroke-width:${We.timeSlot};opacity:.55}`,".dg-tm-m{fill:var(--c)}",".dg-tm-x{fill:var(--c-slate)}",`.dg-tm-fr{fill:none;stroke:var(--c-blue);stroke-width:${We.timeFrame};stroke-dasharray:3 2}`,`.dg-tm-gd{fill:none;stroke:color-mix(in srgb,var(--c-blue) ${Ot.timeGuide}%,transparent);stroke-width:${We.hair};stroke-dasharray:2 3}`,`.dg-tm-ax{fill:none;stroke:var(--line);stroke-width:${We.timeAxis}}`,`.dg-tm-tk{${Ze(oe.timeTick)};fill:var(--mute)}`,`.dg-tm-tkj{${Ze(ul(oe.timeTick))}}`,`.dg-tm-en{${Ze(oe.timePeriod)};fill:var(--ink2)}`,`.dg-tm-er{${Ze(oe.timeRange)};fill:var(--mute)}`,`.dg-tm-erj{${Ze(ul(oe.timeRange))}}`,`.dg-tm-rn{${Ze(oe.timeRow)};fill:var(--ink2)}`,`.dg-tm-br{fill:none;stroke:var(--c);stroke-width:${We.timeSpan};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tm-bt{${Ze(oe.spanText)};fill:var(--ct)}`,`.dg-tm-bx{fill:color-mix(in srgb,var(--c) ${Ot.timeSpan}%,transparent);stroke:var(--c);stroke-width:${We.timeSpan};stroke-dasharray:4 3}`,`.dg-tm-con{fill:none;stroke:var(--line);stroke-width:${We.timeDrop};stroke-linecap:round;stroke-dasharray:0 3.5}`,".dg-tm-pg{fill:var(--surf);stroke:var(--line);stroke-dasharray:2 2.5}",`.dg-tm-pgl{fill:none;stroke:var(--mute);stroke-width:${We.timeFlag};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tm-pc{fill:var(--surf);stroke:var(--c);stroke-width:${We.timePoint}}`,`.dg-tm-pcg{fill:none;stroke:var(--c);stroke-width:${We.timeFlag};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tm-pn{${Ze(oe.pointName)};fill:var(--ink)}`,`.dg-tm-pnj{${Ze(ul(oe.pointName))}}`,".dg-tm-pn-g{fill:var(--mute)}",`.dg-tm-ps{${Ze(oe.pointState)};fill:var(--ct)}`,`.dg-tm-ln{fill:none;stroke:var(--c);stroke-width:${We.edgeOn};stroke-linecap:round;stroke-dasharray:1 2}`,`.dg-tm-nd{stroke:var(--ink);stroke-width:${We.timeNeedle};opacity:.55}`,".dg-tm-nh{fill:var(--ink)}",".dg-tm-ph{fill:none;stroke:var(--line);stroke-dasharray:3 3}",`.dg-tm-ex{fill:color-mix(in srgb,var(--c-slate) ${Ot.timeEmpty}%,var(--surf));stroke:var(--c-slate);stroke-width:${We.timeFrame};stroke-dasharray:3 3}`,`.dg-tm-ext{${Ze(oe.emptyText)};fill:var(--t-slate)}`,".dg-tm-mt{fill:var(--hair)}",".dg-tm-mf{fill:var(--c);transform-box:fill-box;transform-origin:0 50%}",`.dg-tm-mk{stroke:var(--ink2);stroke-width:${We.timeMeter}}`,`.dg-tm-ml{${Ze(oe.meterLine)};fill:var(--ink2)}`,".dg-vp-bg{fill:var(--bg)}",".dg-vp-frame{fill:none;stroke:var(--hair)}",".dg-hd-bg{fill:var(--bg)}",".dg-mm-bg{fill:var(--surf);stroke:var(--hair)}",`.dg-mm-t{${Ze(oe.miniTitle)};fill:var(--mute)}`,".dg-mm-world{fill:var(--sunk);stroke:var(--hair)}",`.dg-mm-band{fill:${bn(Ot.miniBand)};stroke:${bn(Ot.miniBandEdge,"transparent")};stroke-width:.6}`,`.dg-mm-card{fill:${bn(Ot.mini)}}`,`.dg-mm-vp{fill:color-mix(in srgb,var(--ink) ${Ot.view}%,transparent);stroke:var(--ink);stroke-width:${We.badgeRing};vector-effect:non-scaling-stroke}`].join("");function p3(t){let s=2166136261;for(let c=0;c<t.length;c++)s^=t.charCodeAt(c),s=Math.imul(s,16777619);return(s>>>0).toString(36)}function h3(t){const s=new Map,c=(d,p)=>{s.set(d,(s.get(d)??new Set).add(p))};return t.steps.forEach((d,p)=>{for(const a of d.events)a.type==="edge"?(c(a.from,p),c(a.to,p)):(a.type==="action"||a.type==="swap")&&c(a.box,p)}),new Map([...s].map(([d,p])=>[d,[...p].sort((a,r)=>a-r)]))}function f3(t,s,c){const d=[],{whole:p}=s;let a=0;for(const l of s.events){const f=t.steps[l.step]?.events[l.event];if(f?.type==="swap"&&d.push({t:l.at,order:a++,box:f.box,set:f.text}),c&&f?.type==="action"){d.push({t:l.at,order:a++,box:f.box,act:f.label});const u=s.steps[l.step].end;(!p||u<=p.start)&&d.push({t:u,order:a++,box:f.box,act:null})}}d.sort((l,f)=>l.t-f.t||l.order-f.order);const r=new Map;for(const l of t.boxes){let f=[l.sub??"","dg-ss"],u,g=f.join("|");const b=[],w=d.filter(N=>N.box===l.id),v=[...w].reverse().find(N=>N.set!==void 0||typeof N.act=="string");p&&typeof v?.act=="string"&&w.push({t:p.start,order:a++,box:l.id,act:v.act});for(const N of w){N.set!==void 0&&(f=[N.set,"dg-ss-ok"],u=void 0),N.act!==void 0&&(u=N.act??void 0);const S=u!==void 0?[u,"dg-ss-act"]:f;S.join("|")!==g&&(g=S.join("|"),b.push([N.t,S[0],S[1]]))}const A=b.filter((N,S)=>{const M=b[S+1];return M===void 0||M[0]-N[0]>=He.minShow});r.set(l.id,A)}return r}function m3(t,s,c){const d=new Map;for(const p of s.events){const a=t.steps[p.step]?.events[p.event];if(a?.type!=="strip")continue;const r=c.badges[p.step]?.color??"slate",l=d.get(a.field)??[],f=s.steps[p.step].end;l.push({at:p.at,color:r,step:p.step,until:f,...a.value!==void 0?{value:a.value}:{},...a.tag!==void 0?{tag:a.tag}:{}}),d.set(a.field,l)}return d}function g3(t,s,c){if(t.until===void 0)return s;const{after:d,again:p,...a}=s;if(!d)return a;const r=c[t.until].start;return r>d.start?{...a,after:{start:d.start,end:Math.min(d.end,r)}}:a}function Bg(t,s,c,d,p,a,r=[],l=[]){const f=pg(d,p),u=p3(`${JSON.stringify(t)}|${f}|${a?`${a.width}|${a.lang}`:""}`),g=new u3(`dg${u}`,c.total,c.last),b={m:g,t:c,id:u,sh:`filter="url(#dg-sh-${u})"`,end:c.steps[c.steps.length-1].end,ink:r,traces:l},w=h3(t),v=f3(t,c,s.kind!=="sequence"),A={band:[],base:[],lit:[],node:[],badge:[],top:[]};for(const Y of s.regions)A.band.push(Hx(Y,r));const N=s.boxes.find(Y=>Y.ghost)?.color??"slate";s.side&&A.band.push(Vx(s.side,N,r));const S=(Y,xe)=>s.boxes.find(ke=>ke.id===Y&&(xe===void 0||ke.ghost===xe))?.color;for(const Y of s.paths)A.base.push(Yx(Y,S(Y.to,!0)??S(Y.from)??N,r,l));for(const Y of s.ends)A.node.push(Xx(Y,N,r));const M=s.kind==="state",D=new Map((c.states??[]).flatMap(Y=>Y.lit[0]?[[Y.box,Y.lit[0].start]]:[])),z=new Map((c.meters??[]).map(Y=>[Y.field,Y.keys])),H=Y=>Y.meter?r3({...Y,meter:Y.meter},z.get(Y.name)??[[0,0]],b):void 0;s.strip&&A.band.push(e3(s.strip,m3(t,c,s),b,M,D,H));for(const Y of s.lifelines)A.base.push(Jx(Y.x,Y.y1,Y.y2));if(W1(s)){const Y=n3(s,t,c,b);A.base.push(Y.links),A.lit.push(Y.lines),A.node.push(Y.commits),A.top.push(Y.tags)}const Z=tp(s)?s:void 0,j=Z?c3(Z,t,c,b):void 0;j&&(A.base.push(j.links),A.lit.push(j.trails),A.node.push(j.nodes));const R=new Set((Z?.runs??[]).map(Y=>`${Y.step}/${Y.event}`)),_=Ag(s)?s:void 0;if(_){const Y=o3(_,t,c,b,v);A.base.push(Y.lanes),A.node.push(Y.chips)}const P=Sg(s)?s:void 0;if(P){const Y=i3(P,t,c,b,v);A.base.push(Y.base),A.lit.push(Y.lit),A.node.push(Y.node),A.top.push(Y.top)}const B=new Set((P?.wires??[]).map(Y=>`${Y.step}/${Y.event}`));for(const Y of s.edges){const xe=c.edges.find(Fe=>Fe.step===Y.step&&Fe.event===Y.event);if(!xe||P&&!B.has(`${Y.step}/${Y.event}`)||R.has(`${Y.step}/${Y.event}`))continue;const ke=Math.max(j?.appear.get(Y.from)??0,j?.appear.get(Y.to)??0),ze=Qx(Y,xe,b,M,ke);A.base.push(ze.base),A.lit.push(ze.lit)}const ne=new Map((c.states??[]).map(Y=>[Y.box,Y])),ae=new Map(t.boxes.flatMap(Y=>Y.link===void 0?[]:[[Y.id,Y.link]])),fe=(Y,xe)=>$g(ae.get(Y),xe);for(const Y of P||_?[]:s.boxes){if(Y.ghost){A.node.push(fe(Y.id,Ux(Y,r)));continue}const xe=ne.get(Y.id);A.node.push(fe(Y.id,Tg(Y,b,w.get(Y.id)??[],v.get(Y.id)??[],M?xe?.lit??[]:void 0))),xe?.done!==void 0&&A.node.push(Gx(Y,xe.done,b))}for(const Y of s.badges)A.badge.push(Ix(Y,b,M));for(const Y of s.labels){const xe=c.labels.find(ke=>ke.step===Y.step&&ke.event===Y.event);xe&&A.top.push(Zx(Y,g3(Y,xe,c.steps),b))}const{whole:pe}=c;for(const Y of s.actions){const xe=c.events.find(ze=>ze.step===Y.step&&ze.event===Y.event);if(!xe)continue;const ke=c.steps[Y.step].end;A.top.push(pe&&ke>pe.start?$0(Y,xe.at,pe.end,b):$0(Y,xe.at,ke,b,pe))}for(const Y of c.carriers){const xe=s.edges.find(ke=>ke.step===Y.step&&ke.event===Y.event);xe&&A.top.push(Cg(xe,Z?{...Y,start:Y.depart,end:Y.arrive+He.fade}:Y,b))}const Ae=Object.values(A).map(Y=>Y.join("")).join(""),{near:C,far:$,nearY:V,farY:X}=Q.shadow,ie=`<filter id="dg-sh-${u}" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="${V}" stdDeviation="${C}" style="flood-color:var(--sh);flood-opacity:var(--shA)"/><feDropShadow dx="0" dy="${X}" stdDeviation="${$}" style="flood-color:var(--sh);flood-opacity:var(--shB)"/></filter>`,T=a&&s.kind==="sequence"?s.boxes.map(Y=>fe(Y.id,Px(Y,b,w.get(Y.id)??[],v.get(Y.id)??[]))).join(""):"",G=a?v3(s,c,t,g,u,Ae,a,T):{body:`<rect class="dg-bg" width="${s.width}" height="${s.height}" rx="${Q.region.radius}"/>${Ae}`,w:s.width,h:s.height},re=`.dg-${u}{${hg};--T:${c.total}s;${f}}${d3}${g.frames.join("")}`;return`<svg xmlns="http://www.w3.org/2000/svg" class="dg dg-${u}" viewBox="0 0 ${Math.ceil(G.w)} ${Math.ceil(G.h)}" width="${Math.ceil(G.w)}" height="${Math.ceil(G.h)}" role="img" aria-label="${pt(t.title)}" data-dragon="figure" data-view="${a?"follow":"fixed"}"><style>${re}</style><defs>${ie}</defs>${G.body}</svg>`}function jg(t){const s=Math.min(...t.map(d=>d.x)),c=Math.min(...t.map(d=>d.y));return{x:s,y:c,w:Math.max(...t.map(d=>d.x+d.w))-s,h:Math.max(...t.map(d=>d.y+d.h))-c}}function y3(t,s,c){const d=jd(t,s,c);return d.length===0?void 0:jg(d)}function b3(t,s,c,d){const p=Q.badge.r+Q.follow.badgeRoom,{x:a,y:r}=t,l=u=>Math.hypot(Math.max(0,u.x-a,a-u.x-u.w),Math.max(0,u.y-r,r-u.y-u.h));let f={x:a-p,y:r-p,w:p*2,h:p*2};for(const u of[...s].sort((g,b)=>l(g)-l(b))){const g=jg([f,u]);g.w<=c&&g.h<=d&&(f=g)}return f}function jd(t,s,c){const d=[];for(const p of t.edges.filter(a=>a.step===c)){const a=p.points.map(l=>l[0]),r=p.points.map(l=>l[1]);d.push({x:Math.min(...a),y:Math.min(...r),w:Math.max(...a)-Math.min(...a),h:Math.max(...r)-Math.min(...r)})}if(d.push(...t.labels.filter(p=>p.step===c),...t.actions.filter(p=>p.step===c)),tp(t)){const p=new Set((s.steps[c]?.events??[]).flatMap(a=>a.type==="edge"?[a.from,a.to]:[]));d.push(...t.nodes.filter(a=>a.step===c||p.has(a.id)));for(const a of t.links.filter(r=>r.step===c)){const r=a.points.map(f=>f[0]),l=a.points.map(f=>f[1]);d.push({x:Math.min(...r),y:Math.min(...l),w:Math.max(...r)-Math.min(...r),h:Math.max(...l)-Math.min(...l)})}}if(Ag(t)){const p=new Set((s.steps[c]?.events??[]).flatMap(a=>"box"in a?[a.box]:[]));d.push(...t.lanes.filter(a=>p.has(a.id)))}for(const p of s.steps[c]?.events??[]){const a=p.type==="edge"?[p.from,p.to]:p.type==="action"||p.type==="swap"?[p.box]:[];for(const r of a){const l=t.boxes.find(f=>f.id===r);l&&(t.kind==="architecture"||p.type==="swap")&&d.push(l)}}return d}function v3(t,s,c,d,p,a,r,l){const f=Q.follow,u=Q.mini,g=Math.max(1,r.width),b=Math.min(t.width,g),w=gs[r.lang].overview,v=U=>{const Ne=Math.min(u.w,b*.4,U*.4/t.height*t.width),F=Ne/t.width,be=t.height*F,k=Math.max(Ne,Math.ceil(Xe(w,oe.miniTitle)));return{vh:U,mw:Ne,k:F,mh:be,bw:k,bgW:k+u.pad*2,bgH:be+u.pad*2+u.title,beside:be>Ne}},A=v(Math.min(t.height,Math.max(f.minH,b*f.aspect))),N=A.beside&&g<f.narrow,S=r.height===void 0?Number.POSITIVE_INFINITY:A.beside?r.height:r.height-A.bgH-u.inset,{vh:M,mw:D,k:z,mh:H,bw:Z,bgW:j,bgH:R,beside:_}=S<A.vh?v(Math.max(f.fitMinH,S)):{...A,vh:Number.isFinite(S)?Math.min(t.height,S):A.vh},P=_&&!N?Math.min(t.width,g-j-u.inset):b,B=U=>Math.min(t.width-P/2,Math.max(P/2,U)),ne=l===""?0:Math.max(...t.boxes.map(U=>U.y+U.h))+f.headRoom,ae=l===""?0:f.head.pad*2+f.head.h,fe=M-ae,pe=U=>Math.min(t.height-fe/2,Math.max(ne+fe/2,U)),Ae=Q.badge.r;let C=[t.width/2,t.height/2];const V=s.steps.map((U,Ne)=>{if(Sg(t)){const W=l3(t,s,Ne,jd(t,c,Ne),P,fe);return C=[W.x+W.w/2,W.y+W.h/2],[B(C[0]),pe(C[1])]}const F=y3(t,c,Ne);C=F?[F.x+F.w/2,F.y+F.h/2]:C;const be=[B(C[0]),pe(C[1])],k=t.badges.find(W=>W.step===Ne);if(!k||Math.abs(k.x-be[0])<=P/2-Ae&&Math.abs(k.y-be[1])<=fe/2-Ae)return be;const te=b3(k,jd(t,c,Ne),P,fe);return C=[te.x+te.w/2,te.y+te.h/2],[B(C[0]),pe(C[1])]}).map(([U,Ne])=>[U,Ne-ae/2]),X=V[0],ie=[[0,X[0],X[1]],[s.steps[0].start,X[0],X[1]]];V.forEach((U,Ne)=>{if(Ne===0)return;const F=V[Ne-1],be=s.steps[Ne].start;ie.push([be,F[0],F[1],1,et.inOut],[be+f.ease,U[0],U[1]])});const T=V[V.length-1];ie.push([s.last,T[0],T[1],1,et.inOut],[s.total,X[0],X[1]]);const G=d.move(ie.map(([U,Ne,F,be,k])=>[U,P/2-Ne,M/2-F,be,k])),re=_?P+u.inset:P-j-u.inset,Y=_?0:M+u.inset,xe=re+u.pad,ke=xe+(Z-D)/2,ze=Y+u.pad+u.title,Re=N?{clip:"",body:""}:(()=>{const U=[...t.regions.map(F=>`<rect class="dg-mm-band" style="${dt(F.color)}" x="${ke+F.x*z}" y="${ze+F.y*z}" width="${F.w*z}" height="${F.h*z}" rx="3"/>`),...t.boxes.map(F=>`<rect class="dg-mm-card" style="${dt(F.color)}" x="${ke+F.x*z}" y="${ze+F.y*z}" width="${F.w*z}" height="${F.h*z}" rx="1.5"/>`),...(tp(t)?t.nodes:[]).map(F=>`<rect class="dg-mm-card" style="${dt(F.color)}" x="${ke+F.x*z}" y="${ze+F.y*z}" width="${F.w*z}" height="${F.h*z}" rx="1.5"/>`)].join(""),Ne=d.move(ie.map(([F,be,k,,te])=>[F,ke+(be-P/2)*z,ze+(k-M/2)*z,1,te]));return{clip:`<clipPath id="dg-mm-${p}"><rect x="${ke}" y="${ze}" width="${D}" height="${H}" rx="4"/></clipPath>`,body:`<rect class="dg-mm-bg" x="${re}" y="${Y}" width="${j}" height="${R}" rx="${u.radius}"/><text class="dg-mm-t" x="${xe}" y="${ze-u.pad+2}">${w}</text><g clip-path="url(#dg-mm-${p})"><rect class="dg-mm-world" x="${ke}" y="${ze}" width="${D}" height="${H}"/>${U}<rect class="dg-mm-vp dg-a"${ae===0?"":` y="${ae*z}"`} width="${P*z}" height="${(M-ae)*z}" rx="2" style="${Ne}"/></g>`}})(),Qe=ae===0?"":`<g class="dg-hd"><rect class="dg-hd-bg" width="${P}" height="${ae}"/><line class="dg-sep" x1="0" y1="${ae}" x2="${P}" y2="${ae}"/><g class="dg-a" style="${d.move(ie.map(([U,Ne,,F,be])=>[U,P/2-Ne,0,F,be]))}">${l}</g></g>`;return{body:`<defs><clipPath id="dg-vp-${p}"><rect width="${P}" height="${M}" rx="${Q.region.radius}"/></clipPath>${Re.clip}</defs><g clip-path="url(#dg-vp-${p})"><rect class="dg-vp-bg" width="${P}" height="${M}"/><g class="dg-a" style="${G}">${a}</g>${Qe}</g><rect class="dg-vp-frame" x="0.5" y="0.5" width="${P-1}" height="${M-1}" rx="${Q.region.radius}"/>${Re.body}`,w:_&&!N?P+u.inset+j:b,h:_?M:Y+R}}function qg(t,s){const c=Zd(t.palette);if(!t.colors)return c;const d=gs[t.lang??"ja"],p=Object.entries(t.colors).flatMap(([a,r])=>F1(a)?L1(r)?[]:[d.unreadableColor(a)]:[d.unknownColor(a)]);if(p.length>0)throw new Error(d.cannotDraw(p.join(" / ")));return{...c,[s]:{...c[s],...t.colors}}}function sp(t,s={}){const c=s.lang??"ja",d=Pi(t,{lang:c});if(!d.ok)throw new Error(gs[c].cannotDraw(d.errors.map(r=>`${r.pointer} ${r.message}`).join(" / ")));const p=d.diagram,a=p.kind==="sequence"?dx(p):p.kind==="state"?mx(p,c):p.kind==="git"?ax(p):p.kind==="time"?wx(p,c):p.kind==="tree"?Dx(p):p.kind==="lineup"?cx(p):V1(p);return x3(p,a,Bx(p,s.still===!0),s)}function x3(t,s,c,d={}){const p=d.theme==="dark"?"dark":"light",a=qg(d,p),r=[],l=[];return{svg:Bg(t,s,c,a,p,void 0,r,l),palette:a.id,theme:p,...t.view?{view:t.view}:{},fonts:{...Li},layout:s,timeline:c,diagram:t,overlaps:zx(r,c.stills,l)}}function T0(t,s,c){const d=Math.max(0,s)/t.layout.width,a=(c===void 0?d:Math.min(d,Math.max(0,c)/t.layout.height))*oe.boxName.size;return t.view?{mode:t.view,textPx:a}:{mode:a>=fg?"fixed":"follow",textPx:a}}var dl=t=>`font:${t.weight} ${t.size}px var(--${t.family})`,Yt=t=>`${t}px`;function w3(){const t=Q.player,s=Yt(t.hidden);return[`.dg-player{display:flex;flex-direction:column;gap:${Yt(t.gap)};color:var(--ink)}`,`.dg-player .dg-frame{border-radius:${Yt(t.radius)};overflow:hidden}`,".dg-bar{container:dg-bar/inline-size}",`.dg-row{display:flex;align-items:flex-start;gap:${Yt(t.gap)}}`,`.dg-btns{display:flex;gap:${Yt(t.gap/2)};flex:none}`,`.dg-btn{width:${Yt(t.button)};height:${Yt(t.button)};border-radius:${Yt(t.radius)};border:${Yt(Q.stroke.hair)} solid var(--hair);background:var(--surf);color:var(--ink);${dl(oe.button)};cursor:pointer}`,`.dg-btn:focus-visible{outline:${Yt(t.focus)} solid var(--c-blue);outline-offset:${Yt(t.focus)}}`,`.dg-say{display:flex;gap:${Yt(t.gap)};min-width:0}`,`.dg-no{${dl(oe.stepNo)};color:var(--mute);padding-top:${Yt(t.focus)}}`,".dg-txt{display:grid;grid-template-columns:minmax(0,1fr);min-width:0}",".dg-txt>*{grid-area:1/1}",".dg-room{visibility:hidden}",`.dg-tt{${dl(oe.stepTitle)};margin:0}`,`.dg-tb{${dl(oe.stepBody)};color:var(--ink2);margin:0;white-space:pre-line}`,`.dg-sr{position:absolute;width:${s};height:${s};margin:-${s};padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}`,`@container dg-bar (width < ${Yt(t.narrow)}){.dg-row{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;gap:0 ${Yt(t.gap)}}.dg-say,.dg-txt,.dg-txt>*{display:contents}.dg-btns{grid-area:1/1;margin-bottom:${Yt(t.gap/2)}}.dg-btn{width:${Yt(t.touch)};height:${Yt(t.touch)}}.dg-no{grid-area:1/2;display:flex;align-items:center;min-height:${Yt(t.touch)};padding-top:0}.dg-tt{grid-area:2/1/3/3}.dg-tb{grid-area:3/1/4/3}}`,`@media (pointer: coarse){.dg-btn{width:${Yt(t.touch)};height:${Yt(t.touch)}}}`,`.dg-spot{fill:none;stroke:var(--t-amber);stroke-width:${Yt(Q.stroke.mark)};stroke-dasharray:${Q.mark.dash} ${Q.mark.gap};pointer-events:none}`].join("")}function k3(t){if(t.getElementById("dragon-player-css"))return;const s=t.createElement("style");s.id="dragon-player-css",s.textContent=w3(),t.head.appendChild(s)}var Ni={prev:"‹",pause:"❚❚",play:"▶",next:"›"},C0="http://www.w3.org/2000/svg",O0=t=>String(t).padStart(2,"0"),E3=(t,s)=>`${O0(t+1)}/${O0(s)}`;function Rg(t,s,c={}){const d=t.ownerDocument,p=d.defaultView,a=!!p?.matchMedia?.("(prefers-reduced-motion: reduce)").matches,r=sp(s,c),l=c.lang??"ja",f=gs[l],u=qg(c,r.theme),{timeline:g}=r,b=r.diagram.steps,w=b.length;k3(d);const v=d.createElement("div");v.className="dg-player",v.dataset.dragon="player",v.setAttribute("style",`${hg};${pg(u,r.theme)}`);const A=d.createElement("div");A.className="dg-frame";const N=(De,Te,je)=>{const Le=d.createElement("button");return Le.type="button",Le.className="dg-btn",Le.dataset.dragon=De,Le.setAttribute("aria-label",Te),Le.textContent=je,Le},S=N("prev",f.prev,Ni.prev),M=N("toggle",f.pause,Ni.pause),D=N("next",f.next,Ni.next),z=d.createElement("div");z.className="dg-btns",z.setAttribute("lang",l),z.append(S,M,D);const H=d.createElement("div");H.className="dg-say",H.setAttribute("aria-hidden","true");const Z=d.createElement("div");Z.className="dg-no",Z.dataset.dragon="step-no";const j=d.createElement("div");j.className="dg-txt";const R=d.createElement("p");R.className="dg-tt",R.dataset.dragon="step-title";const _=d.createElement("p");_.className="dg-tb",_.dataset.dragon="step-body";const P=d.createElement("div");P.append(R,_),j.append(P);for(const De of b){const Te=d.createElement("div");Te.className="dg-room",Te.dataset.dragon="caption-room";const je=d.createElement("p");je.className="dg-tt",je.textContent=De.title;const Le=d.createElement("p");Le.className="dg-tb",Le.textContent=De.body,Te.append(je,Le),j.append(Te)}H.append(Z,j);for(const De of[Z,R,_])De.setAttribute("aria-hidden","true");const B=d.createElement("div");B.className="dg-row",B.append(z,H);const ne=d.createElement("div");ne.className="dg-bar",ne.append(B);const ae=d.createElement("ol");ae.className="dg-sr",ae.dataset.dragon="steps",ae.setAttribute("aria-label",f.steps(r.diagram.title));for(const De of b){const Te=d.createElement("li"),je=d.createElement("strong");je.textContent=De.title,Te.append(je);for(const Le of De.body.split(`
`)){const st=d.createElement("p");st.textContent=Le,Te.append(st)}if(De.sources){const Le=d.createElement("ul");for(const st of De.sources){const St=d.createElement("a");St.href=st.url,St.textContent=st.name;const Pt=d.createElement("li");Pt.append(St),Le.append(Pt)}Te.append(Le)}ae.append(Te)}v.append(A,ne,ae),t.append(v);const fe=()=>A.clientWidth||t.clientWidth||r.layout.width,pe=()=>{if(!c.fitHeight||!p)return;const De=p.getComputedStyle(A),Te=A.clientHeight-(Number.parseFloat(De.paddingTop)||0)-(Number.parseFloat(De.paddingBottom)||0);return Te>0?Te:void 0};let Ae=T0(r,fe(),pe()).mode,C=fe(),$=pe(),V=null,X=c.pausedAt===void 0?0:Math.min(w-1,Math.max(0,c.pausedAt)),ie=!a&&c.pausedAt===void 0,T=ie?0:g.stills[X]??0;const G=g.stills[w-1]??0;let re=Date.now(),Y=[];const xe=()=>{if(!V)return;for(const je of V.querySelectorAll(".dg-spots"))je.remove();if(Y.length===0)return;const De=Q.mark,Te=d.createElementNS(C0,"g");Te.setAttribute("class","dg-spots");for(const je of Y){const Le=d.createElementNS(C0,"rect");Le.setAttribute("class","dg-spot"),Le.setAttribute("x",String(je.x-De.pad)),Le.setAttribute("y",String(je.y-De.pad)),Le.setAttribute("width",String(je.w+De.pad*2)),Le.setAttribute("height",String(je.h+De.pad*2)),Le.setAttribute("rx",String(De.radius)),Te.append(Le)}(V.querySelector('g[clip-path^="url(#dg-vp-"] > g.dg-a')??V).append(Te)},ke=De=>{let Te;if(De!==void 0){const je=d.createElement("div");je.innerHTML=De,Te=je.querySelector("svg")}else Te=V?V.cloneNode(!0):null;Te&&(Te.setAttribute("aria-hidden","true"),Te.removeAttribute("role"),Te.removeAttribute("aria-label"),Te.style.setProperty("--at",String(T)),Te.style.setProperty("--play",ie?"running":"paused"),Te.dataset.motion=ie?"play":"still",V?V.replaceWith(Te):A.append(Te),V=Te,re=Date.now(),xe())},ze=()=>Ae==="follow"?Bg(r.diagram,r.layout,g,u,r.theme,{width:C,...$===void 0?{}:{height:$},lang:l}):r.svg,Fe=()=>ie?(T+(Date.now()-re)/1e3)%g.total:T,Re=De=>{let Te=0;return g.steps.forEach((je,Le)=>{je.start<=De&&(Te=Le)}),Te},Qe=()=>{const De=b[X];Z.textContent=E3(X,w),R.textContent=De?.title??"",_.textContent=De?.body??"",M.setAttribute("aria-label",ie?f.pause:f.play),M.textContent=ie?Ni.pause:Ni.play,c.onStep?.(X)},K=(De,Te)=>{T=De,ie=Te,ke(),Qe()},U=De=>{X=Math.min(w-1,Math.max(0,De));const Te=g.steps[X];K(ie?Te.start:g.stills[X]??Te.start,ie)},Ne=()=>{c.playOnce&&T>=G&&(X=0,T=0),K(T,!0)};ke(ze()),Qe();const F=p?.setInterval(()=>{if(!ie)return;if(c.playOnce&&T+(Date.now()-re)/1e3>=G){X=w-1,K(G,!1);return}const De=Re(Fe());De!==X&&(X=De,Qe())},120),be=()=>U(X-1),k=()=>U(X+1),te=()=>ie?K(Fe(),!1):Ne(),W=De=>{const Te=De.target?.closest?.("[data-step]"),je=Te?Number(Te.getAttribute("data-step")):Number.NaN;Number.isInteger(je)&&U(je)};S.addEventListener("click",be),D.addEventListener("click",k),M.addEventListener("click",te),A.addEventListener("click",W);const we=p?.ResizeObserver,Be=we?new we(()=>{const De=fe(),Te=pe(),je=T0(r,De,Te).mode;if(je===Ae&&(Ae==="fixed"||De===C&&Te===$))return;const Le=Fe();Ae=je,C=De,$=Te,T=Le,ke(ze())}):void 0;return Be?.observe(A),{get step(){return X},get playing(){return ie},next:k,prev:be,play:()=>{ie||Ne()},pause:()=>{ie&&K(Fe(),!1)},goTo:De=>{ie=!1,U(De)},mark:De=>{Y=De,xe()},destroy:()=>{F!==void 0&&p?.clearInterval(F),Be?.disconnect(),S.removeEventListener("click",be),D.removeEventListener("click",k),M.removeEventListener("click",te),A.removeEventListener("click",W),v.remove()}}}var kd={exports:{}},nt={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var M0;function A3(){if(M0)return nt;M0=1;var t=Symbol.for("react.transitional.element"),s=Symbol.for("react.portal"),c=Symbol.for("react.fragment"),d=Symbol.for("react.strict_mode"),p=Symbol.for("react.profiler"),a=Symbol.for("react.consumer"),r=Symbol.for("react.context"),l=Symbol.for("react.forward_ref"),f=Symbol.for("react.suspense"),u=Symbol.for("react.memo"),g=Symbol.for("react.lazy"),b=Symbol.for("react.activity"),w=Symbol.iterator;function v(T){return T===null||typeof T!="object"?null:(T=w&&T[w]||T["@@iterator"],typeof T=="function"?T:null)}var A={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},N=Object.assign,S={};function M(T,G,re){this.props=T,this.context=G,this.refs=S,this.updater=re||A}M.prototype.isReactComponent={},M.prototype.setState=function(T,G){if(typeof T!="object"&&typeof T!="function"&&T!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,T,G,"setState")},M.prototype.forceUpdate=function(T){this.updater.enqueueForceUpdate(this,T,"forceUpdate")};function D(){}D.prototype=M.prototype;function z(T,G,re){this.props=T,this.context=G,this.refs=S,this.updater=re||A}var H=z.prototype=new D;H.constructor=z,N(H,M.prototype),H.isPureReactComponent=!0;var Z=Array.isArray;function j(){}var R={H:null,A:null,T:null,S:null},_=Object.prototype.hasOwnProperty;function P(T,G,re){var Y=re.ref;return{$$typeof:t,type:T,key:G,ref:Y!==void 0?Y:null,props:re}}function B(T,G){return P(T.type,G,T.props)}function ne(T){return typeof T=="object"&&T!==null&&T.$$typeof===t}function ae(T){var G={"=":"=0",":":"=2"};return"$"+T.replace(/[=:]/g,function(re){return G[re]})}var fe=/\/+/g;function pe(T,G){return typeof T=="object"&&T!==null&&T.key!=null?ae(""+T.key):G.toString(36)}function Ae(T){switch(T.status){case"fulfilled":return T.value;case"rejected":throw T.reason;default:switch(typeof T.status=="string"?T.then(j,j):(T.status="pending",T.then(function(G){T.status==="pending"&&(T.status="fulfilled",T.value=G)},function(G){T.status==="pending"&&(T.status="rejected",T.reason=G)})),T.status){case"fulfilled":return T.value;case"rejected":throw T.reason}}throw T}function C(T,G,re,Y,xe){var ke=typeof T;(ke==="undefined"||ke==="boolean")&&(T=null);var ze=!1;if(T===null)ze=!0;else switch(ke){case"bigint":case"string":case"number":ze=!0;break;case"object":switch(T.$$typeof){case t:case s:ze=!0;break;case g:return ze=T._init,C(ze(T._payload),G,re,Y,xe)}}if(ze)return xe=xe(T),ze=Y===""?"."+pe(T,0):Y,Z(xe)?(re="",ze!=null&&(re=ze.replace(fe,"$&/")+"/"),C(xe,G,re,"",function(Qe){return Qe})):xe!=null&&(ne(xe)&&(xe=B(xe,re+(xe.key==null||T&&T.key===xe.key?"":(""+xe.key).replace(fe,"$&/")+"/")+ze)),G.push(xe)),1;ze=0;var Fe=Y===""?".":Y+":";if(Z(T))for(var Re=0;Re<T.length;Re++)Y=T[Re],ke=Fe+pe(Y,Re),ze+=C(Y,G,re,ke,xe);else if(Re=v(T),typeof Re=="function")for(T=Re.call(T),Re=0;!(Y=T.next()).done;)Y=Y.value,ke=Fe+pe(Y,Re++),ze+=C(Y,G,re,ke,xe);else if(ke==="object"){if(typeof T.then=="function")return C(Ae(T),G,re,Y,xe);throw G=String(T),Error("Objects are not valid as a React child (found: "+(G==="[object Object]"?"object with keys {"+Object.keys(T).join(", ")+"}":G)+"). If you meant to render a collection of children, use an array instead.")}return ze}function $(T,G,re){if(T==null)return T;var Y=[],xe=0;return C(T,Y,"","",function(ke){return G.call(re,ke,xe++)}),Y}function V(T){if(T._status===-1){var G=T._result;G=G(),G.then(function(re){(T._status===0||T._status===-1)&&(T._status=1,T._result=re)},function(re){(T._status===0||T._status===-1)&&(T._status=2,T._result=re)}),T._status===-1&&(T._status=0,T._result=G)}if(T._status===1)return T._result.default;throw T._result}var X=typeof reportError=="function"?reportError:function(T){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var G=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof T=="object"&&T!==null&&typeof T.message=="string"?String(T.message):String(T),error:T});if(!window.dispatchEvent(G))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",T);return}console.error(T)},ie={map:$,forEach:function(T,G,re){$(T,function(){G.apply(this,arguments)},re)},count:function(T){var G=0;return $(T,function(){G++}),G},toArray:function(T){return $(T,function(G){return G})||[]},only:function(T){if(!ne(T))throw Error("React.Children.only expected to receive a single React element child.");return T}};return nt.Activity=b,nt.Children=ie,nt.Component=M,nt.Fragment=c,nt.Profiler=p,nt.PureComponent=z,nt.StrictMode=d,nt.Suspense=f,nt.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=R,nt.__COMPILER_RUNTIME={__proto__:null,c:function(T){return R.H.useMemoCache(T)}},nt.cache=function(T){return function(){return T.apply(null,arguments)}},nt.cacheSignal=function(){return null},nt.cloneElement=function(T,G,re){if(T==null)throw Error("The argument must be a React element, but you passed "+T+".");var Y=N({},T.props),xe=T.key;if(G!=null)for(ke in G.key!==void 0&&(xe=""+G.key),G)!_.call(G,ke)||ke==="key"||ke==="__self"||ke==="__source"||ke==="ref"&&G.ref===void 0||(Y[ke]=G[ke]);var ke=arguments.length-2;if(ke===1)Y.children=re;else if(1<ke){for(var ze=Array(ke),Fe=0;Fe<ke;Fe++)ze[Fe]=arguments[Fe+2];Y.children=ze}return P(T.type,xe,Y)},nt.createContext=function(T){return T={$$typeof:r,_currentValue:T,_currentValue2:T,_threadCount:0,Provider:null,Consumer:null},T.Provider=T,T.Consumer={$$typeof:a,_context:T},T},nt.createElement=function(T,G,re){var Y,xe={},ke=null;if(G!=null)for(Y in G.key!==void 0&&(ke=""+G.key),G)_.call(G,Y)&&Y!=="key"&&Y!=="__self"&&Y!=="__source"&&(xe[Y]=G[Y]);var ze=arguments.length-2;if(ze===1)xe.children=re;else if(1<ze){for(var Fe=Array(ze),Re=0;Re<ze;Re++)Fe[Re]=arguments[Re+2];xe.children=Fe}if(T&&T.defaultProps)for(Y in ze=T.defaultProps,ze)xe[Y]===void 0&&(xe[Y]=ze[Y]);return P(T,ke,xe)},nt.createRef=function(){return{current:null}},nt.forwardRef=function(T){return{$$typeof:l,render:T}},nt.isValidElement=ne,nt.lazy=function(T){return{$$typeof:g,_payload:{_status:-1,_result:T},_init:V}},nt.memo=function(T,G){return{$$typeof:u,type:T,compare:G===void 0?null:G}},nt.startTransition=function(T){var G=R.T,re={};R.T=re;try{var Y=T(),xe=R.S;xe!==null&&xe(re,Y),typeof Y=="object"&&Y!==null&&typeof Y.then=="function"&&Y.then(j,X)}catch(ke){X(ke)}finally{G!==null&&re.types!==null&&(G.types=re.types),R.T=G}},nt.unstable_useCacheRefresh=function(){return R.H.useCacheRefresh()},nt.use=function(T){return R.H.use(T)},nt.useActionState=function(T,G,re){return R.H.useActionState(T,G,re)},nt.useCallback=function(T,G){return R.H.useCallback(T,G)},nt.useContext=function(T){return R.H.useContext(T)},nt.useDebugValue=function(){},nt.useDeferredValue=function(T,G){return R.H.useDeferredValue(T,G)},nt.useEffect=function(T,G){return R.H.useEffect(T,G)},nt.useEffectEvent=function(T){return R.H.useEffectEvent(T)},nt.useId=function(){return R.H.useId()},nt.useImperativeHandle=function(T,G,re){return R.H.useImperativeHandle(T,G,re)},nt.useInsertionEffect=function(T,G){return R.H.useInsertionEffect(T,G)},nt.useLayoutEffect=function(T,G){return R.H.useLayoutEffect(T,G)},nt.useMemo=function(T,G){return R.H.useMemo(T,G)},nt.useOptimistic=function(T,G){return R.H.useOptimistic(T,G)},nt.useReducer=function(T,G,re){return R.H.useReducer(T,G,re)},nt.useRef=function(T){return R.H.useRef(T)},nt.useState=function(T){return R.H.useState(T)},nt.useSyncExternalStore=function(T,G,re){return R.H.useSyncExternalStore(T,G,re)},nt.useTransition=function(){return R.H.useTransition()},nt.version="19.2.7",nt}var B0;function op(){return B0||(B0=1,kd.exports=A3()),kd.exports}var qe=op(),Ed={exports:{}},Di={},Ad={exports:{}},_d={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var j0;function _3(){return j0||(j0=1,(function(t){function s(C,$){var V=C.length;C.push($);e:for(;0<V;){var X=V-1>>>1,ie=C[X];if(0<p(ie,$))C[X]=$,C[V]=ie,V=X;else break e}}function c(C){return C.length===0?null:C[0]}function d(C){if(C.length===0)return null;var $=C[0],V=C.pop();if(V!==$){C[0]=V;e:for(var X=0,ie=C.length,T=ie>>>1;X<T;){var G=2*(X+1)-1,re=C[G],Y=G+1,xe=C[Y];if(0>p(re,V))Y<ie&&0>p(xe,re)?(C[X]=xe,C[Y]=V,X=Y):(C[X]=re,C[G]=V,X=G);else if(Y<ie&&0>p(xe,V))C[X]=xe,C[Y]=V,X=Y;else break e}}return $}function p(C,$){var V=C.sortIndex-$.sortIndex;return V!==0?V:C.id-$.id}if(t.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var a=performance;t.unstable_now=function(){return a.now()}}else{var r=Date,l=r.now();t.unstable_now=function(){return r.now()-l}}var f=[],u=[],g=1,b=null,w=3,v=!1,A=!1,N=!1,S=!1,M=typeof setTimeout=="function"?setTimeout:null,D=typeof clearTimeout=="function"?clearTimeout:null,z=typeof setImmediate<"u"?setImmediate:null;function H(C){for(var $=c(u);$!==null;){if($.callback===null)d(u);else if($.startTime<=C)d(u),$.sortIndex=$.expirationTime,s(f,$);else break;$=c(u)}}function Z(C){if(N=!1,H(C),!A)if(c(f)!==null)A=!0,j||(j=!0,ae());else{var $=c(u);$!==null&&Ae(Z,$.startTime-C)}}var j=!1,R=-1,_=5,P=-1;function B(){return S?!0:!(t.unstable_now()-P<_)}function ne(){if(S=!1,j){var C=t.unstable_now();P=C;var $=!0;try{e:{A=!1,N&&(N=!1,D(R),R=-1),v=!0;var V=w;try{t:{for(H(C),b=c(f);b!==null&&!(b.expirationTime>C&&B());){var X=b.callback;if(typeof X=="function"){b.callback=null,w=b.priorityLevel;var ie=X(b.expirationTime<=C);if(C=t.unstable_now(),typeof ie=="function"){b.callback=ie,H(C),$=!0;break t}b===c(f)&&d(f),H(C)}else d(f);b=c(f)}if(b!==null)$=!0;else{var T=c(u);T!==null&&Ae(Z,T.startTime-C),$=!1}}break e}finally{b=null,w=V,v=!1}$=void 0}}finally{$?ae():j=!1}}}var ae;if(typeof z=="function")ae=function(){z(ne)};else if(typeof MessageChannel<"u"){var fe=new MessageChannel,pe=fe.port2;fe.port1.onmessage=ne,ae=function(){pe.postMessage(null)}}else ae=function(){M(ne,0)};function Ae(C,$){R=M(function(){C(t.unstable_now())},$)}t.unstable_IdlePriority=5,t.unstable_ImmediatePriority=1,t.unstable_LowPriority=4,t.unstable_NormalPriority=3,t.unstable_Profiling=null,t.unstable_UserBlockingPriority=2,t.unstable_cancelCallback=function(C){C.callback=null},t.unstable_forceFrameRate=function(C){0>C||125<C?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):_=0<C?Math.floor(1e3/C):5},t.unstable_getCurrentPriorityLevel=function(){return w},t.unstable_next=function(C){switch(w){case 1:case 2:case 3:var $=3;break;default:$=w}var V=w;w=$;try{return C()}finally{w=V}},t.unstable_requestPaint=function(){S=!0},t.unstable_runWithPriority=function(C,$){switch(C){case 1:case 2:case 3:case 4:case 5:break;default:C=3}var V=w;w=C;try{return $()}finally{w=V}},t.unstable_scheduleCallback=function(C,$,V){var X=t.unstable_now();switch(typeof V=="object"&&V!==null?(V=V.delay,V=typeof V=="number"&&0<V?X+V:X):V=X,C){case 1:var ie=-1;break;case 2:ie=250;break;case 5:ie=1073741823;break;case 4:ie=1e4;break;default:ie=5e3}return ie=V+ie,C={id:g++,callback:$,priorityLevel:C,startTime:V,expirationTime:ie,sortIndex:-1},V>X?(C.sortIndex=V,s(u,C),c(f)===null&&C===c(u)&&(N?(D(R),R=-1):N=!0,Ae(Z,V-X))):(C.sortIndex=ie,s(f,C),A||v||(A=!0,j||(j=!0,ae()))),C},t.unstable_shouldYield=B,t.unstable_wrapCallback=function(C){var $=w;return function(){var V=w;w=$;try{return C.apply(this,arguments)}finally{w=V}}}})(_d)),_d}var q0;function S3(){return q0||(q0=1,Ad.exports=_3()),Ad.exports}var Sd={exports:{}},kn={};/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var R0;function $3(){if(R0)return kn;R0=1;var t=op();function s(f){var u="https://react.dev/errors/"+f;if(1<arguments.length){u+="?args[]="+encodeURIComponent(arguments[1]);for(var g=2;g<arguments.length;g++)u+="&args[]="+encodeURIComponent(arguments[g])}return"Minified React error #"+f+"; visit "+u+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function c(){}var d={d:{f:c,r:function(){throw Error(s(522))},D:c,C:c,L:c,m:c,X:c,S:c,M:c},p:0,findDOMNode:null},p=Symbol.for("react.portal");function a(f,u,g){var b=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:p,key:b==null?null:""+b,children:f,containerInfo:u,implementation:g}}var r=t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function l(f,u){if(f==="font")return"";if(typeof u=="string")return u==="use-credentials"?u:""}return kn.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=d,kn.createPortal=function(f,u){var g=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!u||u.nodeType!==1&&u.nodeType!==9&&u.nodeType!==11)throw Error(s(299));return a(f,u,null,g)},kn.flushSync=function(f){var u=r.T,g=d.p;try{if(r.T=null,d.p=2,f)return f()}finally{r.T=u,d.p=g,d.d.f()}},kn.preconnect=function(f,u){typeof f=="string"&&(u?(u=u.crossOrigin,u=typeof u=="string"?u==="use-credentials"?u:"":void 0):u=null,d.d.C(f,u))},kn.prefetchDNS=function(f){typeof f=="string"&&d.d.D(f)},kn.preinit=function(f,u){if(typeof f=="string"&&u&&typeof u.as=="string"){var g=u.as,b=l(g,u.crossOrigin),w=typeof u.integrity=="string"?u.integrity:void 0,v=typeof u.fetchPriority=="string"?u.fetchPriority:void 0;g==="style"?d.d.S(f,typeof u.precedence=="string"?u.precedence:void 0,{crossOrigin:b,integrity:w,fetchPriority:v}):g==="script"&&d.d.X(f,{crossOrigin:b,integrity:w,fetchPriority:v,nonce:typeof u.nonce=="string"?u.nonce:void 0})}},kn.preinitModule=function(f,u){if(typeof f=="string")if(typeof u=="object"&&u!==null){if(u.as==null||u.as==="script"){var g=l(u.as,u.crossOrigin);d.d.M(f,{crossOrigin:g,integrity:typeof u.integrity=="string"?u.integrity:void 0,nonce:typeof u.nonce=="string"?u.nonce:void 0})}}else u==null&&d.d.M(f)},kn.preload=function(f,u){if(typeof f=="string"&&typeof u=="object"&&u!==null&&typeof u.as=="string"){var g=u.as,b=l(g,u.crossOrigin);d.d.L(f,g,{crossOrigin:b,integrity:typeof u.integrity=="string"?u.integrity:void 0,nonce:typeof u.nonce=="string"?u.nonce:void 0,type:typeof u.type=="string"?u.type:void 0,fetchPriority:typeof u.fetchPriority=="string"?u.fetchPriority:void 0,referrerPolicy:typeof u.referrerPolicy=="string"?u.referrerPolicy:void 0,imageSrcSet:typeof u.imageSrcSet=="string"?u.imageSrcSet:void 0,imageSizes:typeof u.imageSizes=="string"?u.imageSizes:void 0,media:typeof u.media=="string"?u.media:void 0})}},kn.preloadModule=function(f,u){if(typeof f=="string")if(u){var g=l(u.as,u.crossOrigin);d.d.m(f,{as:typeof u.as=="string"&&u.as!=="script"?u.as:void 0,crossOrigin:g,integrity:typeof u.integrity=="string"?u.integrity:void 0})}else d.d.m(f)},kn.requestFormReset=function(f){d.d.r(f)},kn.unstable_batchedUpdates=function(f,u){return f(u)},kn.useFormState=function(f,u,g){return r.H.useFormState(f,u,g)},kn.useFormStatus=function(){return r.H.useHostTransitionStatus()},kn.version="19.2.7",kn}var z0;function N3(){if(z0)return Sd.exports;z0=1;function t(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(t)}catch(s){console.error(s)}}return t(),Sd.exports=$3(),Sd.exports}/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var F0;function D3(){if(F0)return Di;F0=1;var t=S3(),s=op(),c=N3();function d(e){var n="https://react.dev/errors/"+e;if(1<arguments.length){n+="?args[]="+encodeURIComponent(arguments[1]);for(var o=2;o<arguments.length;o++)n+="&args[]="+encodeURIComponent(arguments[o])}return"Minified React error #"+e+"; visit "+n+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function p(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function a(e){var n=e,o=e;if(e.alternate)for(;n.return;)n=n.return;else{e=n;do n=e,(n.flags&4098)!==0&&(o=n.return),e=n.return;while(e)}return n.tag===3?o:null}function r(e){if(e.tag===13){var n=e.memoizedState;if(n===null&&(e=e.alternate,e!==null&&(n=e.memoizedState)),n!==null)return n.dehydrated}return null}function l(e){if(e.tag===31){var n=e.memoizedState;if(n===null&&(e=e.alternate,e!==null&&(n=e.memoizedState)),n!==null)return n.dehydrated}return null}function f(e){if(a(e)!==e)throw Error(d(188))}function u(e){var n=e.alternate;if(!n){if(n=a(e),n===null)throw Error(d(188));return n!==e?null:e}for(var o=e,i=n;;){var h=o.return;if(h===null)break;var m=h.alternate;if(m===null){if(i=h.return,i!==null){o=i;continue}break}if(h.child===m.child){for(m=h.child;m;){if(m===o)return f(h),e;if(m===i)return f(h),n;m=m.sibling}throw Error(d(188))}if(o.return!==i.return)o=h,i=m;else{for(var y=!1,E=h.child;E;){if(E===o){y=!0,o=h,i=m;break}if(E===i){y=!0,i=h,o=m;break}E=E.sibling}if(!y){for(E=m.child;E;){if(E===o){y=!0,o=m,i=h;break}if(E===i){y=!0,i=m,o=h;break}E=E.sibling}if(!y)throw Error(d(189))}}if(o.alternate!==i)throw Error(d(190))}if(o.tag!==3)throw Error(d(188));return o.stateNode.current===o?e:n}function g(e){var n=e.tag;if(n===5||n===26||n===27||n===6)return e;for(e=e.child;e!==null;){if(n=g(e),n!==null)return n;e=e.sibling}return null}var b=Object.assign,w=Symbol.for("react.element"),v=Symbol.for("react.transitional.element"),A=Symbol.for("react.portal"),N=Symbol.for("react.fragment"),S=Symbol.for("react.strict_mode"),M=Symbol.for("react.profiler"),D=Symbol.for("react.consumer"),z=Symbol.for("react.context"),H=Symbol.for("react.forward_ref"),Z=Symbol.for("react.suspense"),j=Symbol.for("react.suspense_list"),R=Symbol.for("react.memo"),_=Symbol.for("react.lazy"),P=Symbol.for("react.activity"),B=Symbol.for("react.memo_cache_sentinel"),ne=Symbol.iterator;function ae(e){return e===null||typeof e!="object"?null:(e=ne&&e[ne]||e["@@iterator"],typeof e=="function"?e:null)}var fe=Symbol.for("react.client.reference");function pe(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===fe?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case N:return"Fragment";case M:return"Profiler";case S:return"StrictMode";case Z:return"Suspense";case j:return"SuspenseList";case P:return"Activity"}if(typeof e=="object")switch(e.$$typeof){case A:return"Portal";case z:return e.displayName||"Context";case D:return(e._context.displayName||"Context")+".Consumer";case H:var n=e.render;return e=e.displayName,e||(e=n.displayName||n.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case R:return n=e.displayName||null,n!==null?n:pe(e.type)||"Memo";case _:n=e._payload,e=e._init;try{return pe(e(n))}catch{}}return null}var Ae=Array.isArray,C=s.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,$=c.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,V={pending:!1,data:null,method:null,action:null},X=[],ie=-1;function T(e){return{current:e}}function G(e){0>ie||(e.current=X[ie],X[ie]=null,ie--)}function re(e,n){ie++,X[ie]=e.current,e.current=n}var Y=T(null),xe=T(null),ke=T(null),ze=T(null);function Fe(e,n){switch(re(ke,n),re(xe,e),re(Y,null),n.nodeType){case 9:case 11:e=(e=n.documentElement)&&(e=e.namespaceURI)?_m(e):0;break;default:if(e=n.tagName,n=n.namespaceURI)n=_m(n),e=Sm(n,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}G(Y),re(Y,e)}function Re(){G(Y),G(xe),G(ke)}function Qe(e){e.memoizedState!==null&&re(ze,e);var n=Y.current,o=Sm(n,e.type);n!==o&&(re(xe,e),re(Y,o))}function K(e){xe.current===e&&(G(Y),G(xe)),ze.current===e&&(G(ze),Ei._currentValue=V)}var U,Ne;function F(e){if(U===void 0)try{throw Error()}catch(o){var n=o.stack.trim().match(/\n( *(at )?)/);U=n&&n[1]||"",Ne=-1<o.stack.indexOf(`
    at`)?" (<anonymous>)":-1<o.stack.indexOf("@")?"@unknown:0:0":""}return`
`+U+e+Ne}var be=!1;function k(e,n){if(!e||be)return"";be=!0;var o=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var i={DetermineComponentFrameRoot:function(){try{if(n){var Se=function(){throw Error()};if(Object.defineProperty(Se.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(Se,[])}catch(ge){var he=ge}Reflect.construct(e,[],Se)}else{try{Se.call()}catch(ge){he=ge}e.call(Se.prototype)}}else{try{throw Error()}catch(ge){he=ge}(Se=e())&&typeof Se.catch=="function"&&Se.catch(function(){})}}catch(ge){if(ge&&he&&typeof ge.stack=="string")return[ge.stack,he.stack]}return[null,null]}};i.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var h=Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot,"name");h&&h.configurable&&Object.defineProperty(i.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var m=i.DetermineComponentFrameRoot(),y=m[0],E=m[1];if(y&&E){var J=y.split(`
`),ue=E.split(`
`);for(h=i=0;i<J.length&&!J[i].includes("DetermineComponentFrameRoot");)i++;for(;h<ue.length&&!ue[h].includes("DetermineComponentFrameRoot");)h++;if(i===J.length||h===ue.length)for(i=J.length-1,h=ue.length-1;1<=i&&0<=h&&J[i]!==ue[h];)h--;for(;1<=i&&0<=h;i--,h--)if(J[i]!==ue[h]){if(i!==1||h!==1)do if(i--,h--,0>h||J[i]!==ue[h]){var ve=`
`+J[i].replace(" at new "," at ");return e.displayName&&ve.includes("<anonymous>")&&(ve=ve.replace("<anonymous>",e.displayName)),ve}while(1<=i&&0<=h);break}}}finally{be=!1,Error.prepareStackTrace=o}return(o=e?e.displayName||e.name:"")?F(o):""}function te(e,n){switch(e.tag){case 26:case 27:case 5:return F(e.type);case 16:return F("Lazy");case 13:return e.child!==n&&n!==null?F("Suspense Fallback"):F("Suspense");case 19:return F("SuspenseList");case 0:case 15:return k(e.type,!1);case 11:return k(e.type.render,!1);case 1:return k(e.type,!0);case 31:return F("Activity");default:return""}}function W(e){try{var n="",o=null;do n+=te(e,o),o=e,e=e.return;while(e);return n}catch(i){return`
Error generating stack: `+i.message+`
`+i.stack}}var we=Object.prototype.hasOwnProperty,Be=t.unstable_scheduleCallback,De=t.unstable_cancelCallback,Te=t.unstable_shouldYield,je=t.unstable_requestPaint,Le=t.unstable_now,st=t.unstable_getCurrentPriorityLevel,St=t.unstable_ImmediatePriority,Pt=t.unstable_UserBlockingPriority,lt=t.unstable_NormalPriority,Vt=t.unstable_LowPriority,nn=t.unstable_IdlePriority,ln=t.log,Ln=t.unstable_setDisableYieldValue,cn=null,Xt=null;function wn(e){if(typeof ln=="function"&&Ln(e),Xt&&typeof Xt.setStrictMode=="function")try{Xt.setStrictMode(cn,e)}catch{}}var hn=Math.clz32?Math.clz32:Oe,L=Math.log,ye=Math.LN2;function Oe(e){return e>>>=0,e===0?32:31-(L(e)/ye|0)|0}var Ke=256,Ve=262144,tt=4194304;function Ht(e){var n=e&42;if(n!==0)return n;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&261888;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function bt(e,n,o){var i=e.pendingLanes;if(i===0)return 0;var h=0,m=e.suspendedLanes,y=e.pingedLanes;e=e.warmLanes;var E=i&134217727;return E!==0?(i=E&~m,i!==0?h=Ht(i):(y&=E,y!==0?h=Ht(y):o||(o=E&~e,o!==0&&(h=Ht(o))))):(E=i&~m,E!==0?h=Ht(E):y!==0?h=Ht(y):o||(o=i&~e,o!==0&&(h=Ht(o)))),h===0?0:n!==0&&n!==h&&(n&m)===0&&(m=h&-h,o=n&-n,m>=o||m===32&&(o&4194048)!==0)?n:h}function zt(e,n){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&n)===0}function Hn(e,n){switch(e){case 1:case 2:case 4:case 8:case 64:return n+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return n+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Pn(){var e=tt;return tt<<=1,(tt&62914560)===0&&(tt=4194304),e}function En(e){for(var n=[],o=0;31>o;o++)n.push(e);return n}function ea(e,n){e.pendingLanes|=n,n!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function ys(e,n,o,i,h,m){var y=e.pendingLanes;e.pendingLanes=o,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=o,e.entangledLanes&=o,e.errorRecoveryDisabledLanes&=o,e.shellSuspendCounter=0;var E=e.entanglements,J=e.expirationTimes,ue=e.hiddenUpdates;for(o=y&~o;0<o;){var ve=31-hn(o),Se=1<<ve;E[ve]=0,J[ve]=-1;var he=ue[ve];if(he!==null)for(ue[ve]=null,ve=0;ve<he.length;ve++){var ge=he[ve];ge!==null&&(ge.lane&=-536870913)}o&=~Se}i!==0&&Vi(e,i,0),m!==0&&h===0&&e.tag!==0&&(e.suspendedLanes|=m&~(y&~n))}function Vi(e,n,o){e.pendingLanes|=n,e.suspendedLanes&=~n;var i=31-hn(n);e.entangledLanes|=n,e.entanglements[i]=e.entanglements[i]|1073741824|o&261930}function Xi(e,n){var o=e.entangledLanes|=n;for(e=e.entanglements;o;){var i=31-hn(o),h=1<<i;h&n|e[i]&n&&(e[i]|=n),o&=~h}}function Ji(e,n){var o=n&-n;return o=(o&42)!==0?1:zo(o),(o&(e.suspendedLanes|n))!==0?0:o}function zo(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function O(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function q(){var e=$.p;return e!==0?e:(e=window.event,e===void 0?32:Qm(e.type))}function ee(e,n){var o=$.p;try{return $.p=e,n()}finally{$.p=o}}var me=Math.random().toString(36).slice(2),le="__reactFiber$"+me,Ee="__reactProps$"+me,$e="__reactContainer$"+me,Ce="__reactEvents$"+me,Ge="__reactListeners$"+me,rt="__reactHandles$"+me,Mt="__reactResources$"+me,Bt="__reactMarker$"+me;function an(e){delete e[le],delete e[Ee],delete e[Ce],delete e[Ge],delete e[rt]}function za(e){var n=e[le];if(n)return n;for(var o=e.parentNode;o;){if(n=o[$e]||o[le]){if(o=n.alternate,n.child!==null||o!==null&&o.child!==null)for(e=Mm(e);e!==null;){if(o=e[le])return o;e=Mm(e)}return n}e=o,o=e.parentNode}return null}function Ys(e){if(e=e[le]||e[$e]){var n=e.tag;if(n===5||n===6||n===13||n===31||n===26||n===27||n===3)return e}return null}function Fo(e){var n=e.tag;if(n===5||n===26||n===27||n===6)return e.stateNode;throw Error(d(33))}function Vs(e){var n=e[Mt];return n||(n=e[Mt]={hoistableStyles:new Map,hoistableScripts:new Map}),n}function un(e){e[Bt]=!0}var pp=new Set,hp={};function bs(e,n){Xs(e,n),Xs(e+"Capture",n)}function Xs(e,n){for(hp[e]=n,e=0;e<n.length;e++)pp.add(n[e])}var iy=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),fp={},mp={};function ry(e){return we.call(mp,e)?!0:we.call(fp,e)?!1:iy.test(e)?mp[e]=!0:(fp[e]=!0,!1)}function Qi(e,n,o){if(ry(n))if(o===null)e.removeAttribute(n);else{switch(typeof o){case"undefined":case"function":case"symbol":e.removeAttribute(n);return;case"boolean":var i=n.toLowerCase().slice(0,5);if(i!=="data-"&&i!=="aria-"){e.removeAttribute(n);return}}e.setAttribute(n,""+o)}}function Zi(e,n,o){if(o===null)e.removeAttribute(n);else{switch(typeof o){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(n);return}e.setAttribute(n,""+o)}}function ga(e,n,o,i){if(i===null)e.removeAttribute(o);else{switch(typeof i){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(o);return}e.setAttributeNS(n,o,""+i)}}function Un(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function gp(e){var n=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(n==="checkbox"||n==="radio")}function ly(e,n,o){var i=Object.getOwnPropertyDescriptor(e.constructor.prototype,n);if(!e.hasOwnProperty(n)&&typeof i<"u"&&typeof i.get=="function"&&typeof i.set=="function"){var h=i.get,m=i.set;return Object.defineProperty(e,n,{configurable:!0,get:function(){return h.call(this)},set:function(y){o=""+y,m.call(this,y)}}),Object.defineProperty(e,n,{enumerable:i.enumerable}),{getValue:function(){return o},setValue:function(y){o=""+y},stopTracking:function(){e._valueTracker=null,delete e[n]}}}}function oc(e){if(!e._valueTracker){var n=gp(e)?"checked":"value";e._valueTracker=ly(e,n,""+e[n])}}function yp(e){if(!e)return!1;var n=e._valueTracker;if(!n)return!0;var o=n.getValue(),i="";return e&&(i=gp(e)?e.checked?"true":"false":e.value),e=i,e!==o?(n.setValue(e),!0):!1}function Ki(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}var cy=/[\n"\\]/g;function Gn(e){return e.replace(cy,function(n){return"\\"+n.charCodeAt(0).toString(16)+" "})}function ic(e,n,o,i,h,m,y,E){e.name="",y!=null&&typeof y!="function"&&typeof y!="symbol"&&typeof y!="boolean"?e.type=y:e.removeAttribute("type"),n!=null?y==="number"?(n===0&&e.value===""||e.value!=n)&&(e.value=""+Un(n)):e.value!==""+Un(n)&&(e.value=""+Un(n)):y!=="submit"&&y!=="reset"||e.removeAttribute("value"),n!=null?rc(e,y,Un(n)):o!=null?rc(e,y,Un(o)):i!=null&&e.removeAttribute("value"),h==null&&m!=null&&(e.defaultChecked=!!m),h!=null&&(e.checked=h&&typeof h!="function"&&typeof h!="symbol"),E!=null&&typeof E!="function"&&typeof E!="symbol"&&typeof E!="boolean"?e.name=""+Un(E):e.removeAttribute("name")}function bp(e,n,o,i,h,m,y,E){if(m!=null&&typeof m!="function"&&typeof m!="symbol"&&typeof m!="boolean"&&(e.type=m),n!=null||o!=null){if(!(m!=="submit"&&m!=="reset"||n!=null)){oc(e);return}o=o!=null?""+Un(o):"",n=n!=null?""+Un(n):o,E||n===e.value||(e.value=n),e.defaultValue=n}i=i??h,i=typeof i!="function"&&typeof i!="symbol"&&!!i,e.checked=E?e.checked:!!i,e.defaultChecked=!!i,y!=null&&typeof y!="function"&&typeof y!="symbol"&&typeof y!="boolean"&&(e.name=y),oc(e)}function rc(e,n,o){n==="number"&&Ki(e.ownerDocument)===e||e.defaultValue===""+o||(e.defaultValue=""+o)}function Js(e,n,o,i){if(e=e.options,n){n={};for(var h=0;h<o.length;h++)n["$"+o[h]]=!0;for(o=0;o<e.length;o++)h=n.hasOwnProperty("$"+e[o].value),e[o].selected!==h&&(e[o].selected=h),h&&i&&(e[o].defaultSelected=!0)}else{for(o=""+Un(o),n=null,h=0;h<e.length;h++){if(e[h].value===o){e[h].selected=!0,i&&(e[h].defaultSelected=!0);return}n!==null||e[h].disabled||(n=e[h])}n!==null&&(n.selected=!0)}}function vp(e,n,o){if(n!=null&&(n=""+Un(n),n!==e.value&&(e.value=n),o==null)){e.defaultValue!==n&&(e.defaultValue=n);return}e.defaultValue=o!=null?""+Un(o):""}function xp(e,n,o,i){if(n==null){if(i!=null){if(o!=null)throw Error(d(92));if(Ae(i)){if(1<i.length)throw Error(d(93));i=i[0]}o=i}o==null&&(o=""),n=o}o=Un(n),e.defaultValue=o,i=e.textContent,i===o&&i!==""&&i!==null&&(e.value=i),oc(e)}function Qs(e,n){if(n){var o=e.firstChild;if(o&&o===e.lastChild&&o.nodeType===3){o.nodeValue=n;return}}e.textContent=n}var uy=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function wp(e,n,o){var i=n.indexOf("--")===0;o==null||typeof o=="boolean"||o===""?i?e.setProperty(n,""):n==="float"?e.cssFloat="":e[n]="":i?e.setProperty(n,o):typeof o!="number"||o===0||uy.has(n)?n==="float"?e.cssFloat=o:e[n]=(""+o).trim():e[n]=o+"px"}function kp(e,n,o){if(n!=null&&typeof n!="object")throw Error(d(62));if(e=e.style,o!=null){for(var i in o)!o.hasOwnProperty(i)||n!=null&&n.hasOwnProperty(i)||(i.indexOf("--")===0?e.setProperty(i,""):i==="float"?e.cssFloat="":e[i]="");for(var h in n)i=n[h],n.hasOwnProperty(h)&&o[h]!==i&&wp(e,h,i)}else for(var m in n)n.hasOwnProperty(m)&&wp(e,m,n[m])}function lc(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var dy=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),py=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Wi(e){return py.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function ya(){}var cc=null;function uc(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Zs=null,Ks=null;function Ep(e){var n=Ys(e);if(n&&(e=n.stateNode)){var o=e[Ee]||null;e:switch(e=n.stateNode,n.type){case"input":if(ic(e,o.value,o.defaultValue,o.defaultValue,o.checked,o.defaultChecked,o.type,o.name),n=o.name,o.type==="radio"&&n!=null){for(o=e;o.parentNode;)o=o.parentNode;for(o=o.querySelectorAll('input[name="'+Gn(""+n)+'"][type="radio"]'),n=0;n<o.length;n++){var i=o[n];if(i!==e&&i.form===e.form){var h=i[Ee]||null;if(!h)throw Error(d(90));ic(i,h.value,h.defaultValue,h.defaultValue,h.checked,h.defaultChecked,h.type,h.name)}}for(n=0;n<o.length;n++)i=o[n],i.form===e.form&&yp(i)}break e;case"textarea":vp(e,o.value,o.defaultValue);break e;case"select":n=o.value,n!=null&&Js(e,!!o.multiple,n,!1)}}}var dc=!1;function Ap(e,n,o){if(dc)return e(n,o);dc=!0;try{var i=e(n);return i}finally{if(dc=!1,(Zs!==null||Ks!==null)&&(Fr(),Zs&&(n=Zs,e=Ks,Ks=Zs=null,Ep(n),e)))for(n=0;n<e.length;n++)Ep(e[n])}}function Lo(e,n){var o=e.stateNode;if(o===null)return null;var i=o[Ee]||null;if(i===null)return null;o=i[n];e:switch(n){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(e=e.type,i=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!i;break e;default:e=!1}if(e)return null;if(o&&typeof o!="function")throw Error(d(231,n,typeof o));return o}var ba=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),pc=!1;if(ba)try{var Ho={};Object.defineProperty(Ho,"passive",{get:function(){pc=!0}}),window.addEventListener("test",Ho,Ho),window.removeEventListener("test",Ho,Ho)}catch{pc=!1}var Fa=null,hc=null,Ii=null;function _p(){if(Ii)return Ii;var e,n=hc,o=n.length,i,h="value"in Fa?Fa.value:Fa.textContent,m=h.length;for(e=0;e<o&&n[e]===h[e];e++);var y=o-e;for(i=1;i<=y&&n[o-i]===h[m-i];i++);return Ii=h.slice(e,1<i?1-i:void 0)}function er(e){var n=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&n===13&&(e=13)):e=n,e===10&&(e=13),32<=e||e===13?e:0}function tr(){return!0}function Sp(){return!1}function _n(e){function n(o,i,h,m,y){this._reactName=o,this._targetInst=h,this.type=i,this.nativeEvent=m,this.target=y,this.currentTarget=null;for(var E in e)e.hasOwnProperty(E)&&(o=e[E],this[E]=o?o(m):m[E]);return this.isDefaultPrevented=(m.defaultPrevented!=null?m.defaultPrevented:m.returnValue===!1)?tr:Sp,this.isPropagationStopped=Sp,this}return b(n.prototype,{preventDefault:function(){this.defaultPrevented=!0;var o=this.nativeEvent;o&&(o.preventDefault?o.preventDefault():typeof o.returnValue!="unknown"&&(o.returnValue=!1),this.isDefaultPrevented=tr)},stopPropagation:function(){var o=this.nativeEvent;o&&(o.stopPropagation?o.stopPropagation():typeof o.cancelBubble!="unknown"&&(o.cancelBubble=!0),this.isPropagationStopped=tr)},persist:function(){},isPersistent:tr}),n}var vs={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},nr=_n(vs),Po=b({},vs,{view:0,detail:0}),hy=_n(Po),fc,mc,Uo,ar=b({},Po,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:yc,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==Uo&&(Uo&&e.type==="mousemove"?(fc=e.screenX-Uo.screenX,mc=e.screenY-Uo.screenY):mc=fc=0,Uo=e),fc)},movementY:function(e){return"movementY"in e?e.movementY:mc}}),$p=_n(ar),fy=b({},ar,{dataTransfer:0}),my=_n(fy),gy=b({},Po,{relatedTarget:0}),gc=_n(gy),yy=b({},vs,{animationName:0,elapsedTime:0,pseudoElement:0}),by=_n(yy),vy=b({},vs,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),xy=_n(vy),wy=b({},vs,{data:0}),Np=_n(wy),ky={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Ey={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Ay={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function _y(e){var n=this.nativeEvent;return n.getModifierState?n.getModifierState(e):(e=Ay[e])?!!n[e]:!1}function yc(){return _y}var Sy=b({},Po,{key:function(e){if(e.key){var n=ky[e.key]||e.key;if(n!=="Unidentified")return n}return e.type==="keypress"?(e=er(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?Ey[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:yc,charCode:function(e){return e.type==="keypress"?er(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?er(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),$y=_n(Sy),Ny=b({},ar,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Dp=_n(Ny),Dy=b({},Po,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:yc}),Ty=_n(Dy),Cy=b({},vs,{propertyName:0,elapsedTime:0,pseudoElement:0}),Oy=_n(Cy),My=b({},ar,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),By=_n(My),jy=b({},vs,{newState:0,oldState:0}),qy=_n(jy),Ry=[9,13,27,32],bc=ba&&"CompositionEvent"in window,Go=null;ba&&"documentMode"in document&&(Go=document.documentMode);var zy=ba&&"TextEvent"in window&&!Go,Tp=ba&&(!bc||Go&&8<Go&&11>=Go),Cp=" ",Op=!1;function Mp(e,n){switch(e){case"keyup":return Ry.indexOf(n.keyCode)!==-1;case"keydown":return n.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Bp(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Ws=!1;function Fy(e,n){switch(e){case"compositionend":return Bp(n);case"keypress":return n.which!==32?null:(Op=!0,Cp);case"textInput":return e=n.data,e===Cp&&Op?null:e;default:return null}}function Ly(e,n){if(Ws)return e==="compositionend"||!bc&&Mp(e,n)?(e=_p(),Ii=hc=Fa=null,Ws=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(n.ctrlKey||n.altKey||n.metaKey)||n.ctrlKey&&n.altKey){if(n.char&&1<n.char.length)return n.char;if(n.which)return String.fromCharCode(n.which)}return null;case"compositionend":return Tp&&n.locale!=="ko"?null:n.data;default:return null}}var Hy={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function jp(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n==="input"?!!Hy[e.type]:n==="textarea"}function qp(e,n,o,i){Zs?Ks?Ks.push(i):Ks=[i]:Zs=i,n=Vr(n,"onChange"),0<n.length&&(o=new nr("onChange","change",null,o,i),e.push({event:o,listeners:n}))}var Yo=null,Vo=null;function Py(e){vm(e,0)}function sr(e){var n=Fo(e);if(yp(n))return e}function Rp(e,n){if(e==="change")return n}var zp=!1;if(ba){var vc;if(ba){var xc="oninput"in document;if(!xc){var Fp=document.createElement("div");Fp.setAttribute("oninput","return;"),xc=typeof Fp.oninput=="function"}vc=xc}else vc=!1;zp=vc&&(!document.documentMode||9<document.documentMode)}function Lp(){Yo&&(Yo.detachEvent("onpropertychange",Hp),Vo=Yo=null)}function Hp(e){if(e.propertyName==="value"&&sr(Vo)){var n=[];qp(n,Vo,e,uc(e)),Ap(Py,n)}}function Uy(e,n,o){e==="focusin"?(Lp(),Yo=n,Vo=o,Yo.attachEvent("onpropertychange",Hp)):e==="focusout"&&Lp()}function Gy(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return sr(Vo)}function Yy(e,n){if(e==="click")return sr(n)}function Vy(e,n){if(e==="input"||e==="change")return sr(n)}function Xy(e,n){return e===n&&(e!==0||1/e===1/n)||e!==e&&n!==n}var Cn=typeof Object.is=="function"?Object.is:Xy;function Xo(e,n){if(Cn(e,n))return!0;if(typeof e!="object"||e===null||typeof n!="object"||n===null)return!1;var o=Object.keys(e),i=Object.keys(n);if(o.length!==i.length)return!1;for(i=0;i<o.length;i++){var h=o[i];if(!we.call(n,h)||!Cn(e[h],n[h]))return!1}return!0}function Pp(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Up(e,n){var o=Pp(e);e=0;for(var i;o;){if(o.nodeType===3){if(i=e+o.textContent.length,e<=n&&i>=n)return{node:o,offset:n-e};e=i}e:{for(;o;){if(o.nextSibling){o=o.nextSibling;break e}o=o.parentNode}o=void 0}o=Pp(o)}}function Gp(e,n){return e&&n?e===n?!0:e&&e.nodeType===3?!1:n&&n.nodeType===3?Gp(e,n.parentNode):"contains"in e?e.contains(n):e.compareDocumentPosition?!!(e.compareDocumentPosition(n)&16):!1:!1}function Yp(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var n=Ki(e.document);n instanceof e.HTMLIFrameElement;){try{var o=typeof n.contentWindow.location.href=="string"}catch{o=!1}if(o)e=n.contentWindow;else break;n=Ki(e.document)}return n}function wc(e){var n=e&&e.nodeName&&e.nodeName.toLowerCase();return n&&(n==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||n==="textarea"||e.contentEditable==="true")}var Jy=ba&&"documentMode"in document&&11>=document.documentMode,Is=null,kc=null,Jo=null,Ec=!1;function Vp(e,n,o){var i=o.window===o?o.document:o.nodeType===9?o:o.ownerDocument;Ec||Is==null||Is!==Ki(i)||(i=Is,"selectionStart"in i&&wc(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),Jo&&Xo(Jo,i)||(Jo=i,i=Vr(kc,"onSelect"),0<i.length&&(n=new nr("onSelect","select",null,n,o),e.push({event:n,listeners:i}),n.target=Is)))}function xs(e,n){var o={};return o[e.toLowerCase()]=n.toLowerCase(),o["Webkit"+e]="webkit"+n,o["Moz"+e]="moz"+n,o}var eo={animationend:xs("Animation","AnimationEnd"),animationiteration:xs("Animation","AnimationIteration"),animationstart:xs("Animation","AnimationStart"),transitionrun:xs("Transition","TransitionRun"),transitionstart:xs("Transition","TransitionStart"),transitioncancel:xs("Transition","TransitionCancel"),transitionend:xs("Transition","TransitionEnd")},Ac={},Xp={};ba&&(Xp=document.createElement("div").style,"AnimationEvent"in window||(delete eo.animationend.animation,delete eo.animationiteration.animation,delete eo.animationstart.animation),"TransitionEvent"in window||delete eo.transitionend.transition);function ws(e){if(Ac[e])return Ac[e];if(!eo[e])return e;var n=eo[e],o;for(o in n)if(n.hasOwnProperty(o)&&o in Xp)return Ac[e]=n[o];return e}var Jp=ws("animationend"),Qp=ws("animationiteration"),Zp=ws("animationstart"),Qy=ws("transitionrun"),Zy=ws("transitionstart"),Ky=ws("transitioncancel"),Kp=ws("transitionend"),Wp=new Map,_c="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");_c.push("scrollEnd");function ta(e,n){Wp.set(e,n),bs(n,[e])}var or=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var n=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(n))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Yn=[],to=0,Sc=0;function ir(){for(var e=to,n=Sc=to=0;n<e;){var o=Yn[n];Yn[n++]=null;var i=Yn[n];Yn[n++]=null;var h=Yn[n];Yn[n++]=null;var m=Yn[n];if(Yn[n++]=null,i!==null&&h!==null){var y=i.pending;y===null?h.next=h:(h.next=y.next,y.next=h),i.pending=h}m!==0&&Ip(o,h,m)}}function rr(e,n,o,i){Yn[to++]=e,Yn[to++]=n,Yn[to++]=o,Yn[to++]=i,Sc|=i,e.lanes|=i,e=e.alternate,e!==null&&(e.lanes|=i)}function $c(e,n,o,i){return rr(e,n,o,i),lr(e)}function ks(e,n){return rr(e,null,null,n),lr(e)}function Ip(e,n,o){e.lanes|=o;var i=e.alternate;i!==null&&(i.lanes|=o);for(var h=!1,m=e.return;m!==null;)m.childLanes|=o,i=m.alternate,i!==null&&(i.childLanes|=o),m.tag===22&&(e=m.stateNode,e===null||e._visibility&1||(h=!0)),e=m,m=m.return;return e.tag===3?(m=e.stateNode,h&&n!==null&&(h=31-hn(o),e=m.hiddenUpdates,i=e[h],i===null?e[h]=[n]:i.push(n),n.lane=o|536870912),m):null}function lr(e){if(50<gi)throw gi=0,qu=null,Error(d(185));for(var n=e.return;n!==null;)e=n,n=e.return;return e.tag===3?e.stateNode:null}var no={};function Wy(e,n,o,i){this.tag=e,this.key=o,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=n,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function On(e,n,o,i){return new Wy(e,n,o,i)}function Nc(e){return e=e.prototype,!(!e||!e.isReactComponent)}function va(e,n){var o=e.alternate;return o===null?(o=On(e.tag,n,e.key,e.mode),o.elementType=e.elementType,o.type=e.type,o.stateNode=e.stateNode,o.alternate=e,e.alternate=o):(o.pendingProps=n,o.type=e.type,o.flags=0,o.subtreeFlags=0,o.deletions=null),o.flags=e.flags&65011712,o.childLanes=e.childLanes,o.lanes=e.lanes,o.child=e.child,o.memoizedProps=e.memoizedProps,o.memoizedState=e.memoizedState,o.updateQueue=e.updateQueue,n=e.dependencies,o.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext},o.sibling=e.sibling,o.index=e.index,o.ref=e.ref,o.refCleanup=e.refCleanup,o}function eh(e,n){e.flags&=65011714;var o=e.alternate;return o===null?(e.childLanes=0,e.lanes=n,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=o.childLanes,e.lanes=o.lanes,e.child=o.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=o.memoizedProps,e.memoizedState=o.memoizedState,e.updateQueue=o.updateQueue,e.type=o.type,n=o.dependencies,e.dependencies=n===null?null:{lanes:n.lanes,firstContext:n.firstContext}),e}function cr(e,n,o,i,h,m){var y=0;if(i=e,typeof e=="function")Nc(e)&&(y=1);else if(typeof e=="string")y=av(e,o,Y.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(e){case P:return e=On(31,o,n,h),e.elementType=P,e.lanes=m,e;case N:return Es(o.children,h,m,n);case S:y=8,h|=24;break;case M:return e=On(12,o,n,h|2),e.elementType=M,e.lanes=m,e;case Z:return e=On(13,o,n,h),e.elementType=Z,e.lanes=m,e;case j:return e=On(19,o,n,h),e.elementType=j,e.lanes=m,e;default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case z:y=10;break e;case D:y=9;break e;case H:y=11;break e;case R:y=14;break e;case _:y=16,i=null;break e}y=29,o=Error(d(130,e===null?"null":typeof e,"")),i=null}return n=On(y,o,n,h),n.elementType=e,n.type=i,n.lanes=m,n}function Es(e,n,o,i){return e=On(7,e,i,n),e.lanes=o,e}function Dc(e,n,o){return e=On(6,e,null,n),e.lanes=o,e}function th(e){var n=On(18,null,null,0);return n.stateNode=e,n}function Tc(e,n,o){return n=On(4,e.children!==null?e.children:[],e.key,n),n.lanes=o,n.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},n}var nh=new WeakMap;function Vn(e,n){if(typeof e=="object"&&e!==null){var o=nh.get(e);return o!==void 0?o:(n={value:e,source:n,stack:W(n)},nh.set(e,n),n)}return{value:e,source:n,stack:W(n)}}var ao=[],so=0,ur=null,Qo=0,Xn=[],Jn=0,La=null,ia=1,ra="";function xa(e,n){ao[so++]=Qo,ao[so++]=ur,ur=e,Qo=n}function ah(e,n,o){Xn[Jn++]=ia,Xn[Jn++]=ra,Xn[Jn++]=La,La=e;var i=ia;e=ra;var h=32-hn(i)-1;i&=~(1<<h),o+=1;var m=32-hn(n)+h;if(30<m){var y=h-h%5;m=(i&(1<<y)-1).toString(32),i>>=y,h-=y,ia=1<<32-hn(n)+h|o<<h|i,ra=m+e}else ia=1<<m|o<<h|i,ra=e}function Cc(e){e.return!==null&&(xa(e,1),ah(e,1,0))}function Oc(e){for(;e===ur;)ur=ao[--so],ao[so]=null,Qo=ao[--so],ao[so]=null;for(;e===La;)La=Xn[--Jn],Xn[Jn]=null,ra=Xn[--Jn],Xn[Jn]=null,ia=Xn[--Jn],Xn[Jn]=null}function sh(e,n){Xn[Jn++]=ia,Xn[Jn++]=ra,Xn[Jn++]=La,ia=n.id,ra=n.overflow,La=e}var fn=null,qt=null,mt=!1,Ha=null,Qn=!1,Mc=Error(d(519));function Pa(e){var n=Error(d(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw Zo(Vn(n,e)),Mc}function oh(e){var n=e.stateNode,o=e.type,i=e.memoizedProps;switch(n[le]=e,n[Ee]=i,o){case"dialog":ut("cancel",n),ut("close",n);break;case"iframe":case"object":case"embed":ut("load",n);break;case"video":case"audio":for(o=0;o<bi.length;o++)ut(bi[o],n);break;case"source":ut("error",n);break;case"img":case"image":case"link":ut("error",n),ut("load",n);break;case"details":ut("toggle",n);break;case"input":ut("invalid",n),bp(n,i.value,i.defaultValue,i.checked,i.defaultChecked,i.type,i.name,!0);break;case"select":ut("invalid",n);break;case"textarea":ut("invalid",n),xp(n,i.value,i.defaultValue,i.children)}o=i.children,typeof o!="string"&&typeof o!="number"&&typeof o!="bigint"||n.textContent===""+o||i.suppressHydrationWarning===!0||Em(n.textContent,o)?(i.popover!=null&&(ut("beforetoggle",n),ut("toggle",n)),i.onScroll!=null&&ut("scroll",n),i.onScrollEnd!=null&&ut("scrollend",n),i.onClick!=null&&(n.onclick=ya),n=!0):n=!1,n||Pa(e,!0)}function ih(e){for(fn=e.return;fn;)switch(fn.tag){case 5:case 31:case 13:Qn=!1;return;case 27:case 3:Qn=!0;return;default:fn=fn.return}}function oo(e){if(e!==fn)return!1;if(!mt)return ih(e),mt=!0,!1;var n=e.tag,o;if((o=n!==3&&n!==27)&&((o=n===5)&&(o=e.type,o=!(o!=="form"&&o!=="button")||Ku(e.type,e.memoizedProps)),o=!o),o&&qt&&Pa(e),ih(e),n===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(d(317));qt=Om(e)}else if(n===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(d(317));qt=Om(e)}else n===27?(n=qt,ns(e.type)?(e=nd,nd=null,qt=e):qt=n):qt=fn?Kn(e.stateNode.nextSibling):null;return!0}function As(){qt=fn=null,mt=!1}function Bc(){var e=Ha;return e!==null&&(Dn===null?Dn=e:Dn.push.apply(Dn,e),Ha=null),e}function Zo(e){Ha===null?Ha=[e]:Ha.push(e)}var jc=T(null),_s=null,wa=null;function Ua(e,n,o){re(jc,n._currentValue),n._currentValue=o}function ka(e){e._currentValue=jc.current,G(jc)}function qc(e,n,o){for(;e!==null;){var i=e.alternate;if((e.childLanes&n)!==n?(e.childLanes|=n,i!==null&&(i.childLanes|=n)):i!==null&&(i.childLanes&n)!==n&&(i.childLanes|=n),e===o)break;e=e.return}}function Rc(e,n,o,i){var h=e.child;for(h!==null&&(h.return=e);h!==null;){var m=h.dependencies;if(m!==null){var y=h.child;m=m.firstContext;e:for(;m!==null;){var E=m;m=h;for(var J=0;J<n.length;J++)if(E.context===n[J]){m.lanes|=o,E=m.alternate,E!==null&&(E.lanes|=o),qc(m.return,o,e),i||(y=null);break e}m=E.next}}else if(h.tag===18){if(y=h.return,y===null)throw Error(d(341));y.lanes|=o,m=y.alternate,m!==null&&(m.lanes|=o),qc(y,o,e),y=null}else y=h.child;if(y!==null)y.return=h;else for(y=h;y!==null;){if(y===e){y=null;break}if(h=y.sibling,h!==null){h.return=y.return,y=h;break}y=y.return}h=y}}function io(e,n,o,i){e=null;for(var h=n,m=!1;h!==null;){if(!m){if((h.flags&524288)!==0)m=!0;else if((h.flags&262144)!==0)break}if(h.tag===10){var y=h.alternate;if(y===null)throw Error(d(387));if(y=y.memoizedProps,y!==null){var E=h.type;Cn(h.pendingProps.value,y.value)||(e!==null?e.push(E):e=[E])}}else if(h===ze.current){if(y=h.alternate,y===null)throw Error(d(387));y.memoizedState.memoizedState!==h.memoizedState.memoizedState&&(e!==null?e.push(Ei):e=[Ei])}h=h.return}e!==null&&Rc(n,e,o,i),n.flags|=262144}function dr(e){for(e=e.firstContext;e!==null;){if(!Cn(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Ss(e){_s=e,wa=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function mn(e){return rh(_s,e)}function pr(e,n){return _s===null&&Ss(e),rh(e,n)}function rh(e,n){var o=n._currentValue;if(n={context:n,memoizedValue:o,next:null},wa===null){if(e===null)throw Error(d(308));wa=n,e.dependencies={lanes:0,firstContext:n},e.flags|=524288}else wa=wa.next=n;return o}var Iy=typeof AbortController<"u"?AbortController:function(){var e=[],n=this.signal={aborted:!1,addEventListener:function(o,i){e.push(i)}};this.abort=function(){n.aborted=!0,e.forEach(function(o){return o()})}},eb=t.unstable_scheduleCallback,tb=t.unstable_NormalPriority,Zt={$$typeof:z,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function zc(){return{controller:new Iy,data:new Map,refCount:0}}function Ko(e){e.refCount--,e.refCount===0&&eb(tb,function(){e.controller.abort()})}var Wo=null,Fc=0,ro=0,lo=null;function nb(e,n){if(Wo===null){var o=Wo=[];Fc=0,ro=Pu(),lo={status:"pending",value:void 0,then:function(i){o.push(i)}}}return Fc++,n.then(lh,lh),n}function lh(){if(--Fc===0&&Wo!==null){lo!==null&&(lo.status="fulfilled");var e=Wo;Wo=null,ro=0,lo=null;for(var n=0;n<e.length;n++)(0,e[n])()}}function ab(e,n){var o=[],i={status:"pending",value:null,reason:null,then:function(h){o.push(h)}};return e.then(function(){i.status="fulfilled",i.value=n;for(var h=0;h<o.length;h++)(0,o[h])(n)},function(h){for(i.status="rejected",i.reason=h,h=0;h<o.length;h++)(0,o[h])(void 0)}),i}var ch=C.S;C.S=function(e,n){Xf=Le(),typeof n=="object"&&n!==null&&typeof n.then=="function"&&nb(e,n),ch!==null&&ch(e,n)};var $s=T(null);function Lc(){var e=$s.current;return e!==null?e:Ct.pooledCache}function hr(e,n){n===null?re($s,$s.current):re($s,n.pool)}function uh(){var e=Lc();return e===null?null:{parent:Zt._currentValue,pool:e}}var co=Error(d(460)),Hc=Error(d(474)),fr=Error(d(542)),mr={then:function(){}};function dh(e){return e=e.status,e==="fulfilled"||e==="rejected"}function ph(e,n,o){switch(o=e[o],o===void 0?e.push(n):o!==n&&(n.then(ya,ya),n=o),n.status){case"fulfilled":return n.value;case"rejected":throw e=n.reason,fh(e),e;default:if(typeof n.status=="string")n.then(ya,ya);else{if(e=Ct,e!==null&&100<e.shellSuspendCounter)throw Error(d(482));e=n,e.status="pending",e.then(function(i){if(n.status==="pending"){var h=n;h.status="fulfilled",h.value=i}},function(i){if(n.status==="pending"){var h=n;h.status="rejected",h.reason=i}})}switch(n.status){case"fulfilled":return n.value;case"rejected":throw e=n.reason,fh(e),e}throw Ds=n,co}}function Ns(e){try{var n=e._init;return n(e._payload)}catch(o){throw o!==null&&typeof o=="object"&&typeof o.then=="function"?(Ds=o,co):o}}var Ds=null;function hh(){if(Ds===null)throw Error(d(459));var e=Ds;return Ds=null,e}function fh(e){if(e===co||e===fr)throw Error(d(483))}var uo=null,Io=0;function gr(e){var n=Io;return Io+=1,uo===null&&(uo=[]),ph(uo,e,n)}function ei(e,n){n=n.props.ref,e.ref=n!==void 0?n:null}function yr(e,n){throw n.$$typeof===w?Error(d(525)):(e=Object.prototype.toString.call(n),Error(d(31,e==="[object Object]"?"object with keys {"+Object.keys(n).join(", ")+"}":e)))}function mh(e){function n(se,I){if(e){var ce=se.deletions;ce===null?(se.deletions=[I],se.flags|=16):ce.push(I)}}function o(se,I){if(!e)return null;for(;I!==null;)n(se,I),I=I.sibling;return null}function i(se){for(var I=new Map;se!==null;)se.key!==null?I.set(se.key,se):I.set(se.index,se),se=se.sibling;return I}function h(se,I){return se=va(se,I),se.index=0,se.sibling=null,se}function m(se,I,ce){return se.index=ce,e?(ce=se.alternate,ce!==null?(ce=ce.index,ce<I?(se.flags|=67108866,I):ce):(se.flags|=67108866,I)):(se.flags|=1048576,I)}function y(se){return e&&se.alternate===null&&(se.flags|=67108866),se}function E(se,I,ce,_e){return I===null||I.tag!==6?(I=Dc(ce,se.mode,_e),I.return=se,I):(I=h(I,ce),I.return=se,I)}function J(se,I,ce,_e){var Je=ce.type;return Je===N?ve(se,I,ce.props.children,_e,ce.key):I!==null&&(I.elementType===Je||typeof Je=="object"&&Je!==null&&Je.$$typeof===_&&Ns(Je)===I.type)?(I=h(I,ce.props),ei(I,ce),I.return=se,I):(I=cr(ce.type,ce.key,ce.props,null,se.mode,_e),ei(I,ce),I.return=se,I)}function ue(se,I,ce,_e){return I===null||I.tag!==4||I.stateNode.containerInfo!==ce.containerInfo||I.stateNode.implementation!==ce.implementation?(I=Tc(ce,se.mode,_e),I.return=se,I):(I=h(I,ce.children||[]),I.return=se,I)}function ve(se,I,ce,_e,Je){return I===null||I.tag!==7?(I=Es(ce,se.mode,_e,Je),I.return=se,I):(I=h(I,ce),I.return=se,I)}function Se(se,I,ce){if(typeof I=="string"&&I!==""||typeof I=="number"||typeof I=="bigint")return I=Dc(""+I,se.mode,ce),I.return=se,I;if(typeof I=="object"&&I!==null){switch(I.$$typeof){case v:return ce=cr(I.type,I.key,I.props,null,se.mode,ce),ei(ce,I),ce.return=se,ce;case A:return I=Tc(I,se.mode,ce),I.return=se,I;case _:return I=Ns(I),Se(se,I,ce)}if(Ae(I)||ae(I))return I=Es(I,se.mode,ce,null),I.return=se,I;if(typeof I.then=="function")return Se(se,gr(I),ce);if(I.$$typeof===z)return Se(se,pr(se,I),ce);yr(se,I)}return null}function he(se,I,ce,_e){var Je=I!==null?I.key:null;if(typeof ce=="string"&&ce!==""||typeof ce=="number"||typeof ce=="bigint")return Je!==null?null:E(se,I,""+ce,_e);if(typeof ce=="object"&&ce!==null){switch(ce.$$typeof){case v:return ce.key===Je?J(se,I,ce,_e):null;case A:return ce.key===Je?ue(se,I,ce,_e):null;case _:return ce=Ns(ce),he(se,I,ce,_e)}if(Ae(ce)||ae(ce))return Je!==null?null:ve(se,I,ce,_e,null);if(typeof ce.then=="function")return he(se,I,gr(ce),_e);if(ce.$$typeof===z)return he(se,I,pr(se,ce),_e);yr(se,ce)}return null}function ge(se,I,ce,_e,Je){if(typeof _e=="string"&&_e!==""||typeof _e=="number"||typeof _e=="bigint")return se=se.get(ce)||null,E(I,se,""+_e,Je);if(typeof _e=="object"&&_e!==null){switch(_e.$$typeof){case v:return se=se.get(_e.key===null?ce:_e.key)||null,J(I,se,_e,Je);case A:return se=se.get(_e.key===null?ce:_e.key)||null,ue(I,se,_e,Je);case _:return _e=Ns(_e),ge(se,I,ce,_e,Je)}if(Ae(_e)||ae(_e))return se=se.get(ce)||null,ve(I,se,_e,Je,null);if(typeof _e.then=="function")return ge(se,I,ce,gr(_e),Je);if(_e.$$typeof===z)return ge(se,I,ce,pr(I,_e),Je);yr(I,_e)}return null}function Ue(se,I,ce,_e){for(var Je=null,gt=null,Ye=I,ot=I=0,ft=null;Ye!==null&&ot<ce.length;ot++){Ye.index>ot?(ft=Ye,Ye=null):ft=Ye.sibling;var yt=he(se,Ye,ce[ot],_e);if(yt===null){Ye===null&&(Ye=ft);break}e&&Ye&&yt.alternate===null&&n(se,Ye),I=m(yt,I,ot),gt===null?Je=yt:gt.sibling=yt,gt=yt,Ye=ft}if(ot===ce.length)return o(se,Ye),mt&&xa(se,ot),Je;if(Ye===null){for(;ot<ce.length;ot++)Ye=Se(se,ce[ot],_e),Ye!==null&&(I=m(Ye,I,ot),gt===null?Je=Ye:gt.sibling=Ye,gt=Ye);return mt&&xa(se,ot),Je}for(Ye=i(Ye);ot<ce.length;ot++)ft=ge(Ye,se,ot,ce[ot],_e),ft!==null&&(e&&ft.alternate!==null&&Ye.delete(ft.key===null?ot:ft.key),I=m(ft,I,ot),gt===null?Je=ft:gt.sibling=ft,gt=ft);return e&&Ye.forEach(function(rs){return n(se,rs)}),mt&&xa(se,ot),Je}function Ie(se,I,ce,_e){if(ce==null)throw Error(d(151));for(var Je=null,gt=null,Ye=I,ot=I=0,ft=null,yt=ce.next();Ye!==null&&!yt.done;ot++,yt=ce.next()){Ye.index>ot?(ft=Ye,Ye=null):ft=Ye.sibling;var rs=he(se,Ye,yt.value,_e);if(rs===null){Ye===null&&(Ye=ft);break}e&&Ye&&rs.alternate===null&&n(se,Ye),I=m(rs,I,ot),gt===null?Je=rs:gt.sibling=rs,gt=rs,Ye=ft}if(yt.done)return o(se,Ye),mt&&xa(se,ot),Je;if(Ye===null){for(;!yt.done;ot++,yt=ce.next())yt=Se(se,yt.value,_e),yt!==null&&(I=m(yt,I,ot),gt===null?Je=yt:gt.sibling=yt,gt=yt);return mt&&xa(se,ot),Je}for(Ye=i(Ye);!yt.done;ot++,yt=ce.next())yt=ge(Ye,se,ot,yt.value,_e),yt!==null&&(e&&yt.alternate!==null&&Ye.delete(yt.key===null?ot:yt.key),I=m(yt,I,ot),gt===null?Je=yt:gt.sibling=yt,gt=yt);return e&&Ye.forEach(function(fv){return n(se,fv)}),mt&&xa(se,ot),Je}function Dt(se,I,ce,_e){if(typeof ce=="object"&&ce!==null&&ce.type===N&&ce.key===null&&(ce=ce.props.children),typeof ce=="object"&&ce!==null){switch(ce.$$typeof){case v:e:{for(var Je=ce.key;I!==null;){if(I.key===Je){if(Je=ce.type,Je===N){if(I.tag===7){o(se,I.sibling),_e=h(I,ce.props.children),_e.return=se,se=_e;break e}}else if(I.elementType===Je||typeof Je=="object"&&Je!==null&&Je.$$typeof===_&&Ns(Je)===I.type){o(se,I.sibling),_e=h(I,ce.props),ei(_e,ce),_e.return=se,se=_e;break e}o(se,I);break}else n(se,I);I=I.sibling}ce.type===N?(_e=Es(ce.props.children,se.mode,_e,ce.key),_e.return=se,se=_e):(_e=cr(ce.type,ce.key,ce.props,null,se.mode,_e),ei(_e,ce),_e.return=se,se=_e)}return y(se);case A:e:{for(Je=ce.key;I!==null;){if(I.key===Je)if(I.tag===4&&I.stateNode.containerInfo===ce.containerInfo&&I.stateNode.implementation===ce.implementation){o(se,I.sibling),_e=h(I,ce.children||[]),_e.return=se,se=_e;break e}else{o(se,I);break}else n(se,I);I=I.sibling}_e=Tc(ce,se.mode,_e),_e.return=se,se=_e}return y(se);case _:return ce=Ns(ce),Dt(se,I,ce,_e)}if(Ae(ce))return Ue(se,I,ce,_e);if(ae(ce)){if(Je=ae(ce),typeof Je!="function")throw Error(d(150));return ce=Je.call(ce),Ie(se,I,ce,_e)}if(typeof ce.then=="function")return Dt(se,I,gr(ce),_e);if(ce.$$typeof===z)return Dt(se,I,pr(se,ce),_e);yr(se,ce)}return typeof ce=="string"&&ce!==""||typeof ce=="number"||typeof ce=="bigint"?(ce=""+ce,I!==null&&I.tag===6?(o(se,I.sibling),_e=h(I,ce),_e.return=se,se=_e):(o(se,I),_e=Dc(ce,se.mode,_e),_e.return=se,se=_e),y(se)):o(se,I)}return function(se,I,ce,_e){try{Io=0;var Je=Dt(se,I,ce,_e);return uo=null,Je}catch(Ye){if(Ye===co||Ye===fr)throw Ye;var gt=On(29,Ye,null,se.mode);return gt.lanes=_e,gt.return=se,gt}}}var Ts=mh(!0),gh=mh(!1),Ga=!1;function Pc(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Uc(e,n){e=e.updateQueue,n.updateQueue===e&&(n.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Ya(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Va(e,n,o){var i=e.updateQueue;if(i===null)return null;if(i=i.shared,(vt&2)!==0){var h=i.pending;return h===null?n.next=n:(n.next=h.next,h.next=n),i.pending=n,n=lr(e),Ip(e,null,o),n}return rr(e,i,n,o),lr(e)}function ti(e,n,o){if(n=n.updateQueue,n!==null&&(n=n.shared,(o&4194048)!==0)){var i=n.lanes;i&=e.pendingLanes,o|=i,n.lanes=o,Xi(e,o)}}function Gc(e,n){var o=e.updateQueue,i=e.alternate;if(i!==null&&(i=i.updateQueue,o===i)){var h=null,m=null;if(o=o.firstBaseUpdate,o!==null){do{var y={lane:o.lane,tag:o.tag,payload:o.payload,callback:null,next:null};m===null?h=m=y:m=m.next=y,o=o.next}while(o!==null);m===null?h=m=n:m=m.next=n}else h=m=n;o={baseState:i.baseState,firstBaseUpdate:h,lastBaseUpdate:m,shared:i.shared,callbacks:i.callbacks},e.updateQueue=o;return}e=o.lastBaseUpdate,e===null?o.firstBaseUpdate=n:e.next=n,o.lastBaseUpdate=n}var Yc=!1;function ni(){if(Yc){var e=lo;if(e!==null)throw e}}function ai(e,n,o,i){Yc=!1;var h=e.updateQueue;Ga=!1;var m=h.firstBaseUpdate,y=h.lastBaseUpdate,E=h.shared.pending;if(E!==null){h.shared.pending=null;var J=E,ue=J.next;J.next=null,y===null?m=ue:y.next=ue,y=J;var ve=e.alternate;ve!==null&&(ve=ve.updateQueue,E=ve.lastBaseUpdate,E!==y&&(E===null?ve.firstBaseUpdate=ue:E.next=ue,ve.lastBaseUpdate=J))}if(m!==null){var Se=h.baseState;y=0,ve=ue=J=null,E=m;do{var he=E.lane&-536870913,ge=he!==E.lane;if(ge?(ht&he)===he:(i&he)===he){he!==0&&he===ro&&(Yc=!0),ve!==null&&(ve=ve.next={lane:0,tag:E.tag,payload:E.payload,callback:null,next:null});e:{var Ue=e,Ie=E;he=n;var Dt=o;switch(Ie.tag){case 1:if(Ue=Ie.payload,typeof Ue=="function"){Se=Ue.call(Dt,Se,he);break e}Se=Ue;break e;case 3:Ue.flags=Ue.flags&-65537|128;case 0:if(Ue=Ie.payload,he=typeof Ue=="function"?Ue.call(Dt,Se,he):Ue,he==null)break e;Se=b({},Se,he);break e;case 2:Ga=!0}}he=E.callback,he!==null&&(e.flags|=64,ge&&(e.flags|=8192),ge=h.callbacks,ge===null?h.callbacks=[he]:ge.push(he))}else ge={lane:he,tag:E.tag,payload:E.payload,callback:E.callback,next:null},ve===null?(ue=ve=ge,J=Se):ve=ve.next=ge,y|=he;if(E=E.next,E===null){if(E=h.shared.pending,E===null)break;ge=E,E=ge.next,ge.next=null,h.lastBaseUpdate=ge,h.shared.pending=null}}while(!0);ve===null&&(J=Se),h.baseState=J,h.firstBaseUpdate=ue,h.lastBaseUpdate=ve,m===null&&(h.shared.lanes=0),Ka|=y,e.lanes=y,e.memoizedState=Se}}function yh(e,n){if(typeof e!="function")throw Error(d(191,e));e.call(n)}function bh(e,n){var o=e.callbacks;if(o!==null)for(e.callbacks=null,e=0;e<o.length;e++)yh(o[e],n)}var po=T(null),br=T(0);function vh(e,n){e=Ca,re(br,e),re(po,n),Ca=e|n.baseLanes}function Vc(){re(br,Ca),re(po,po.current)}function Xc(){Ca=br.current,G(po),G(br)}var Mn=T(null),Zn=null;function Xa(e){var n=e.alternate;re(Jt,Jt.current&1),re(Mn,e),Zn===null&&(n===null||po.current!==null||n.memoizedState!==null)&&(Zn=e)}function Jc(e){re(Jt,Jt.current),re(Mn,e),Zn===null&&(Zn=e)}function xh(e){e.tag===22?(re(Jt,Jt.current),re(Mn,e),Zn===null&&(Zn=e)):Ja()}function Ja(){re(Jt,Jt.current),re(Mn,Mn.current)}function Bn(e){G(Mn),Zn===e&&(Zn=null),G(Jt)}var Jt=T(0);function vr(e){for(var n=e;n!==null;){if(n.tag===13){var o=n.memoizedState;if(o!==null&&(o=o.dehydrated,o===null||ed(o)||td(o)))return n}else if(n.tag===19&&(n.memoizedProps.revealOrder==="forwards"||n.memoizedProps.revealOrder==="backwards"||n.memoizedProps.revealOrder==="unstable_legacy-backwards"||n.memoizedProps.revealOrder==="together")){if((n.flags&128)!==0)return n}else if(n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return null;n=n.return}n.sibling.return=n.return,n=n.sibling}return null}var Ea=0,at=null,$t=null,Kt=null,xr=!1,ho=!1,Cs=!1,wr=0,si=0,fo=null,sb=0;function Ut(){throw Error(d(321))}function Qc(e,n){if(n===null)return!1;for(var o=0;o<n.length&&o<e.length;o++)if(!Cn(e[o],n[o]))return!1;return!0}function Zc(e,n,o,i,h,m){return Ea=m,at=n,n.memoizedState=null,n.updateQueue=null,n.lanes=0,C.H=e===null||e.memoizedState===null?af:du,Cs=!1,m=o(i,h),Cs=!1,ho&&(m=kh(n,o,i,h)),wh(e),m}function wh(e){C.H=ri;var n=$t!==null&&$t.next!==null;if(Ea=0,Kt=$t=at=null,xr=!1,si=0,fo=null,n)throw Error(d(300));e===null||Wt||(e=e.dependencies,e!==null&&dr(e)&&(Wt=!0))}function kh(e,n,o,i){at=e;var h=0;do{if(ho&&(fo=null),si=0,ho=!1,25<=h)throw Error(d(301));if(h+=1,Kt=$t=null,e.updateQueue!=null){var m=e.updateQueue;m.lastEffect=null,m.events=null,m.stores=null,m.memoCache!=null&&(m.memoCache.index=0)}C.H=sf,m=n(o,i)}while(ho);return m}function ob(){var e=C.H,n=e.useState()[0];return n=typeof n.then=="function"?oi(n):n,e=e.useState()[0],($t!==null?$t.memoizedState:null)!==e&&(at.flags|=1024),n}function Kc(){var e=wr!==0;return wr=0,e}function Wc(e,n,o){n.updateQueue=e.updateQueue,n.flags&=-2053,e.lanes&=~o}function Ic(e){if(xr){for(e=e.memoizedState;e!==null;){var n=e.queue;n!==null&&(n.pending=null),e=e.next}xr=!1}Ea=0,Kt=$t=at=null,ho=!1,si=wr=0,fo=null}function An(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Kt===null?at.memoizedState=Kt=e:Kt=Kt.next=e,Kt}function Qt(){if($t===null){var e=at.alternate;e=e!==null?e.memoizedState:null}else e=$t.next;var n=Kt===null?at.memoizedState:Kt.next;if(n!==null)Kt=n,$t=e;else{if(e===null)throw at.alternate===null?Error(d(467)):Error(d(310));$t=e,e={memoizedState:$t.memoizedState,baseState:$t.baseState,baseQueue:$t.baseQueue,queue:$t.queue,next:null},Kt===null?at.memoizedState=Kt=e:Kt=Kt.next=e}return Kt}function kr(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function oi(e){var n=si;return si+=1,fo===null&&(fo=[]),e=ph(fo,e,n),n=at,(Kt===null?n.memoizedState:Kt.next)===null&&(n=n.alternate,C.H=n===null||n.memoizedState===null?af:du),e}function Er(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return oi(e);if(e.$$typeof===z)return mn(e)}throw Error(d(438,String(e)))}function eu(e){var n=null,o=at.updateQueue;if(o!==null&&(n=o.memoCache),n==null){var i=at.alternate;i!==null&&(i=i.updateQueue,i!==null&&(i=i.memoCache,i!=null&&(n={data:i.data.map(function(h){return h.slice()}),index:0})))}if(n==null&&(n={data:[],index:0}),o===null&&(o=kr(),at.updateQueue=o),o.memoCache=n,o=n.data[n.index],o===void 0)for(o=n.data[n.index]=Array(e),i=0;i<e;i++)o[i]=B;return n.index++,o}function Aa(e,n){return typeof n=="function"?n(e):n}function Ar(e){var n=Qt();return tu(n,$t,e)}function tu(e,n,o){var i=e.queue;if(i===null)throw Error(d(311));i.lastRenderedReducer=o;var h=e.baseQueue,m=i.pending;if(m!==null){if(h!==null){var y=h.next;h.next=m.next,m.next=y}n.baseQueue=h=m,i.pending=null}if(m=e.baseState,h===null)e.memoizedState=m;else{n=h.next;var E=y=null,J=null,ue=n,ve=!1;do{var Se=ue.lane&-536870913;if(Se!==ue.lane?(ht&Se)===Se:(Ea&Se)===Se){var he=ue.revertLane;if(he===0)J!==null&&(J=J.next={lane:0,revertLane:0,gesture:null,action:ue.action,hasEagerState:ue.hasEagerState,eagerState:ue.eagerState,next:null}),Se===ro&&(ve=!0);else if((Ea&he)===he){ue=ue.next,he===ro&&(ve=!0);continue}else Se={lane:0,revertLane:ue.revertLane,gesture:null,action:ue.action,hasEagerState:ue.hasEagerState,eagerState:ue.eagerState,next:null},J===null?(E=J=Se,y=m):J=J.next=Se,at.lanes|=he,Ka|=he;Se=ue.action,Cs&&o(m,Se),m=ue.hasEagerState?ue.eagerState:o(m,Se)}else he={lane:Se,revertLane:ue.revertLane,gesture:ue.gesture,action:ue.action,hasEagerState:ue.hasEagerState,eagerState:ue.eagerState,next:null},J===null?(E=J=he,y=m):J=J.next=he,at.lanes|=Se,Ka|=Se;ue=ue.next}while(ue!==null&&ue!==n);if(J===null?y=m:J.next=E,!Cn(m,e.memoizedState)&&(Wt=!0,ve&&(o=lo,o!==null)))throw o;e.memoizedState=m,e.baseState=y,e.baseQueue=J,i.lastRenderedState=m}return h===null&&(i.lanes=0),[e.memoizedState,i.dispatch]}function nu(e){var n=Qt(),o=n.queue;if(o===null)throw Error(d(311));o.lastRenderedReducer=e;var i=o.dispatch,h=o.pending,m=n.memoizedState;if(h!==null){o.pending=null;var y=h=h.next;do m=e(m,y.action),y=y.next;while(y!==h);Cn(m,n.memoizedState)||(Wt=!0),n.memoizedState=m,n.baseQueue===null&&(n.baseState=m),o.lastRenderedState=m}return[m,i]}function Eh(e,n,o){var i=at,h=Qt(),m=mt;if(m){if(o===void 0)throw Error(d(407));o=o()}else o=n();var y=!Cn(($t||h).memoizedState,o);if(y&&(h.memoizedState=o,Wt=!0),h=h.queue,ou(Sh.bind(null,i,h,e),[e]),h.getSnapshot!==n||y||Kt!==null&&Kt.memoizedState.tag&1){if(i.flags|=2048,mo(9,{destroy:void 0},_h.bind(null,i,h,o,n),null),Ct===null)throw Error(d(349));m||(Ea&127)!==0||Ah(i,n,o)}return o}function Ah(e,n,o){e.flags|=16384,e={getSnapshot:n,value:o},n=at.updateQueue,n===null?(n=kr(),at.updateQueue=n,n.stores=[e]):(o=n.stores,o===null?n.stores=[e]:o.push(e))}function _h(e,n,o,i){n.value=o,n.getSnapshot=i,$h(n)&&Nh(e)}function Sh(e,n,o){return o(function(){$h(n)&&Nh(e)})}function $h(e){var n=e.getSnapshot;e=e.value;try{var o=n();return!Cn(e,o)}catch{return!0}}function Nh(e){var n=ks(e,2);n!==null&&Tn(n,e,2)}function au(e){var n=An();if(typeof e=="function"){var o=e;if(e=o(),Cs){wn(!0);try{o()}finally{wn(!1)}}}return n.memoizedState=n.baseState=e,n.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Aa,lastRenderedState:e},n}function Dh(e,n,o,i){return e.baseState=o,tu(e,$t,typeof i=="function"?i:Aa)}function ib(e,n,o,i,h){if($r(e))throw Error(d(485));if(e=n.action,e!==null){var m={payload:h,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(y){m.listeners.push(y)}};C.T!==null?o(!0):m.isTransition=!1,i(m),o=n.pending,o===null?(m.next=n.pending=m,Th(n,m)):(m.next=o.next,n.pending=o.next=m)}}function Th(e,n){var o=n.action,i=n.payload,h=e.state;if(n.isTransition){var m=C.T,y={};C.T=y;try{var E=o(h,i),J=C.S;J!==null&&J(y,E),Ch(e,n,E)}catch(ue){su(e,n,ue)}finally{m!==null&&y.types!==null&&(m.types=y.types),C.T=m}}else try{m=o(h,i),Ch(e,n,m)}catch(ue){su(e,n,ue)}}function Ch(e,n,o){o!==null&&typeof o=="object"&&typeof o.then=="function"?o.then(function(i){Oh(e,n,i)},function(i){return su(e,n,i)}):Oh(e,n,o)}function Oh(e,n,o){n.status="fulfilled",n.value=o,Mh(n),e.state=o,n=e.pending,n!==null&&(o=n.next,o===n?e.pending=null:(o=o.next,n.next=o,Th(e,o)))}function su(e,n,o){var i=e.pending;if(e.pending=null,i!==null){i=i.next;do n.status="rejected",n.reason=o,Mh(n),n=n.next;while(n!==i)}e.action=null}function Mh(e){e=e.listeners;for(var n=0;n<e.length;n++)(0,e[n])()}function Bh(e,n){return n}function jh(e,n){if(mt){var o=Ct.formState;if(o!==null){e:{var i=at;if(mt){if(qt){t:{for(var h=qt,m=Qn;h.nodeType!==8;){if(!m){h=null;break t}if(h=Kn(h.nextSibling),h===null){h=null;break t}}m=h.data,h=m==="F!"||m==="F"?h:null}if(h){qt=Kn(h.nextSibling),i=h.data==="F!";break e}}Pa(i)}i=!1}i&&(n=o[0])}}return o=An(),o.memoizedState=o.baseState=n,i={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Bh,lastRenderedState:n},o.queue=i,o=ef.bind(null,at,i),i.dispatch=o,i=au(!1),m=uu.bind(null,at,!1,i.queue),i=An(),h={state:n,dispatch:null,action:e,pending:null},i.queue=h,o=ib.bind(null,at,h,m,o),h.dispatch=o,i.memoizedState=e,[n,o,!1]}function qh(e){var n=Qt();return Rh(n,$t,e)}function Rh(e,n,o){if(n=tu(e,n,Bh)[0],e=Ar(Aa)[0],typeof n=="object"&&n!==null&&typeof n.then=="function")try{var i=oi(n)}catch(y){throw y===co?fr:y}else i=n;n=Qt();var h=n.queue,m=h.dispatch;return o!==n.memoizedState&&(at.flags|=2048,mo(9,{destroy:void 0},rb.bind(null,h,o),null)),[i,m,e]}function rb(e,n){e.action=n}function zh(e){var n=Qt(),o=$t;if(o!==null)return Rh(n,o,e);Qt(),n=n.memoizedState,o=Qt();var i=o.queue.dispatch;return o.memoizedState=e,[n,i,!1]}function mo(e,n,o,i){return e={tag:e,create:o,deps:i,inst:n,next:null},n=at.updateQueue,n===null&&(n=kr(),at.updateQueue=n),o=n.lastEffect,o===null?n.lastEffect=e.next=e:(i=o.next,o.next=e,e.next=i,n.lastEffect=e),e}function Fh(){return Qt().memoizedState}function _r(e,n,o,i){var h=An();at.flags|=e,h.memoizedState=mo(1|n,{destroy:void 0},o,i===void 0?null:i)}function Sr(e,n,o,i){var h=Qt();i=i===void 0?null:i;var m=h.memoizedState.inst;$t!==null&&i!==null&&Qc(i,$t.memoizedState.deps)?h.memoizedState=mo(n,m,o,i):(at.flags|=e,h.memoizedState=mo(1|n,m,o,i))}function Lh(e,n){_r(8390656,8,e,n)}function ou(e,n){Sr(2048,8,e,n)}function lb(e){at.flags|=4;var n=at.updateQueue;if(n===null)n=kr(),at.updateQueue=n,n.events=[e];else{var o=n.events;o===null?n.events=[e]:o.push(e)}}function Hh(e){var n=Qt().memoizedState;return lb({ref:n,nextImpl:e}),function(){if((vt&2)!==0)throw Error(d(440));return n.impl.apply(void 0,arguments)}}function Ph(e,n){return Sr(4,2,e,n)}function Uh(e,n){return Sr(4,4,e,n)}function Gh(e,n){if(typeof n=="function"){e=e();var o=n(e);return function(){typeof o=="function"?o():n(null)}}if(n!=null)return e=e(),n.current=e,function(){n.current=null}}function Yh(e,n,o){o=o!=null?o.concat([e]):null,Sr(4,4,Gh.bind(null,n,e),o)}function iu(){}function Vh(e,n){var o=Qt();n=n===void 0?null:n;var i=o.memoizedState;return n!==null&&Qc(n,i[1])?i[0]:(o.memoizedState=[e,n],e)}function Xh(e,n){var o=Qt();n=n===void 0?null:n;var i=o.memoizedState;if(n!==null&&Qc(n,i[1]))return i[0];if(i=e(),Cs){wn(!0);try{e()}finally{wn(!1)}}return o.memoizedState=[i,n],i}function ru(e,n,o){return o===void 0||(Ea&1073741824)!==0&&(ht&261930)===0?e.memoizedState=n:(e.memoizedState=o,e=Qf(),at.lanes|=e,Ka|=e,o)}function Jh(e,n,o,i){return Cn(o,n)?o:po.current!==null?(e=ru(e,o,i),Cn(e,n)||(Wt=!0),e):(Ea&42)===0||(Ea&1073741824)!==0&&(ht&261930)===0?(Wt=!0,e.memoizedState=o):(e=Qf(),at.lanes|=e,Ka|=e,n)}function Qh(e,n,o,i,h){var m=$.p;$.p=m!==0&&8>m?m:8;var y=C.T,E={};C.T=E,uu(e,!1,n,o);try{var J=h(),ue=C.S;if(ue!==null&&ue(E,J),J!==null&&typeof J=="object"&&typeof J.then=="function"){var ve=ab(J,i);ii(e,n,ve,Rn(e))}else ii(e,n,i,Rn(e))}catch(Se){ii(e,n,{then:function(){},status:"rejected",reason:Se},Rn())}finally{$.p=m,y!==null&&E.types!==null&&(y.types=E.types),C.T=y}}function cb(){}function lu(e,n,o,i){if(e.tag!==5)throw Error(d(476));var h=Zh(e).queue;Qh(e,h,n,V,o===null?cb:function(){return Kh(e),o(i)})}function Zh(e){var n=e.memoizedState;if(n!==null)return n;n={memoizedState:V,baseState:V,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Aa,lastRenderedState:V},next:null};var o={};return n.next={memoizedState:o,baseState:o,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Aa,lastRenderedState:o},next:null},e.memoizedState=n,e=e.alternate,e!==null&&(e.memoizedState=n),n}function Kh(e){var n=Zh(e);n.next===null&&(n=e.alternate.memoizedState),ii(e,n.next.queue,{},Rn())}function cu(){return mn(Ei)}function Wh(){return Qt().memoizedState}function Ih(){return Qt().memoizedState}function ub(e){for(var n=e.return;n!==null;){switch(n.tag){case 24:case 3:var o=Rn();e=Ya(o);var i=Va(n,e,o);i!==null&&(Tn(i,n,o),ti(i,n,o)),n={cache:zc()},e.payload=n;return}n=n.return}}function db(e,n,o){var i=Rn();o={lane:i,revertLane:0,gesture:null,action:o,hasEagerState:!1,eagerState:null,next:null},$r(e)?tf(n,o):(o=$c(e,n,o,i),o!==null&&(Tn(o,e,i),nf(o,n,i)))}function ef(e,n,o){var i=Rn();ii(e,n,o,i)}function ii(e,n,o,i){var h={lane:i,revertLane:0,gesture:null,action:o,hasEagerState:!1,eagerState:null,next:null};if($r(e))tf(n,h);else{var m=e.alternate;if(e.lanes===0&&(m===null||m.lanes===0)&&(m=n.lastRenderedReducer,m!==null))try{var y=n.lastRenderedState,E=m(y,o);if(h.hasEagerState=!0,h.eagerState=E,Cn(E,y))return rr(e,n,h,0),Ct===null&&ir(),!1}catch{}if(o=$c(e,n,h,i),o!==null)return Tn(o,e,i),nf(o,n,i),!0}return!1}function uu(e,n,o,i){if(i={lane:2,revertLane:Pu(),gesture:null,action:i,hasEagerState:!1,eagerState:null,next:null},$r(e)){if(n)throw Error(d(479))}else n=$c(e,o,i,2),n!==null&&Tn(n,e,2)}function $r(e){var n=e.alternate;return e===at||n!==null&&n===at}function tf(e,n){ho=xr=!0;var o=e.pending;o===null?n.next=n:(n.next=o.next,o.next=n),e.pending=n}function nf(e,n,o){if((o&4194048)!==0){var i=n.lanes;i&=e.pendingLanes,o|=i,n.lanes=o,Xi(e,o)}}var ri={readContext:mn,use:Er,useCallback:Ut,useContext:Ut,useEffect:Ut,useImperativeHandle:Ut,useLayoutEffect:Ut,useInsertionEffect:Ut,useMemo:Ut,useReducer:Ut,useRef:Ut,useState:Ut,useDebugValue:Ut,useDeferredValue:Ut,useTransition:Ut,useSyncExternalStore:Ut,useId:Ut,useHostTransitionStatus:Ut,useFormState:Ut,useActionState:Ut,useOptimistic:Ut,useMemoCache:Ut,useCacheRefresh:Ut};ri.useEffectEvent=Ut;var af={readContext:mn,use:Er,useCallback:function(e,n){return An().memoizedState=[e,n===void 0?null:n],e},useContext:mn,useEffect:Lh,useImperativeHandle:function(e,n,o){o=o!=null?o.concat([e]):null,_r(4194308,4,Gh.bind(null,n,e),o)},useLayoutEffect:function(e,n){return _r(4194308,4,e,n)},useInsertionEffect:function(e,n){_r(4,2,e,n)},useMemo:function(e,n){var o=An();n=n===void 0?null:n;var i=e();if(Cs){wn(!0);try{e()}finally{wn(!1)}}return o.memoizedState=[i,n],i},useReducer:function(e,n,o){var i=An();if(o!==void 0){var h=o(n);if(Cs){wn(!0);try{o(n)}finally{wn(!1)}}}else h=n;return i.memoizedState=i.baseState=h,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:h},i.queue=e,e=e.dispatch=db.bind(null,at,e),[i.memoizedState,e]},useRef:function(e){var n=An();return e={current:e},n.memoizedState=e},useState:function(e){e=au(e);var n=e.queue,o=ef.bind(null,at,n);return n.dispatch=o,[e.memoizedState,o]},useDebugValue:iu,useDeferredValue:function(e,n){var o=An();return ru(o,e,n)},useTransition:function(){var e=au(!1);return e=Qh.bind(null,at,e.queue,!0,!1),An().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,n,o){var i=at,h=An();if(mt){if(o===void 0)throw Error(d(407));o=o()}else{if(o=n(),Ct===null)throw Error(d(349));(ht&127)!==0||Ah(i,n,o)}h.memoizedState=o;var m={value:o,getSnapshot:n};return h.queue=m,Lh(Sh.bind(null,i,m,e),[e]),i.flags|=2048,mo(9,{destroy:void 0},_h.bind(null,i,m,o,n),null),o},useId:function(){var e=An(),n=Ct.identifierPrefix;if(mt){var o=ra,i=ia;o=(i&~(1<<32-hn(i)-1)).toString(32)+o,n="_"+n+"R_"+o,o=wr++,0<o&&(n+="H"+o.toString(32)),n+="_"}else o=sb++,n="_"+n+"r_"+o.toString(32)+"_";return e.memoizedState=n},useHostTransitionStatus:cu,useFormState:jh,useActionState:jh,useOptimistic:function(e){var n=An();n.memoizedState=n.baseState=e;var o={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return n.queue=o,n=uu.bind(null,at,!0,o),o.dispatch=n,[e,n]},useMemoCache:eu,useCacheRefresh:function(){return An().memoizedState=ub.bind(null,at)},useEffectEvent:function(e){var n=An(),o={impl:e};return n.memoizedState=o,function(){if((vt&2)!==0)throw Error(d(440));return o.impl.apply(void 0,arguments)}}},du={readContext:mn,use:Er,useCallback:Vh,useContext:mn,useEffect:ou,useImperativeHandle:Yh,useInsertionEffect:Ph,useLayoutEffect:Uh,useMemo:Xh,useReducer:Ar,useRef:Fh,useState:function(){return Ar(Aa)},useDebugValue:iu,useDeferredValue:function(e,n){var o=Qt();return Jh(o,$t.memoizedState,e,n)},useTransition:function(){var e=Ar(Aa)[0],n=Qt().memoizedState;return[typeof e=="boolean"?e:oi(e),n]},useSyncExternalStore:Eh,useId:Wh,useHostTransitionStatus:cu,useFormState:qh,useActionState:qh,useOptimistic:function(e,n){var o=Qt();return Dh(o,$t,e,n)},useMemoCache:eu,useCacheRefresh:Ih};du.useEffectEvent=Hh;var sf={readContext:mn,use:Er,useCallback:Vh,useContext:mn,useEffect:ou,useImperativeHandle:Yh,useInsertionEffect:Ph,useLayoutEffect:Uh,useMemo:Xh,useReducer:nu,useRef:Fh,useState:function(){return nu(Aa)},useDebugValue:iu,useDeferredValue:function(e,n){var o=Qt();return $t===null?ru(o,e,n):Jh(o,$t.memoizedState,e,n)},useTransition:function(){var e=nu(Aa)[0],n=Qt().memoizedState;return[typeof e=="boolean"?e:oi(e),n]},useSyncExternalStore:Eh,useId:Wh,useHostTransitionStatus:cu,useFormState:zh,useActionState:zh,useOptimistic:function(e,n){var o=Qt();return $t!==null?Dh(o,$t,e,n):(o.baseState=e,[e,o.queue.dispatch])},useMemoCache:eu,useCacheRefresh:Ih};sf.useEffectEvent=Hh;function pu(e,n,o,i){n=e.memoizedState,o=o(i,n),o=o==null?n:b({},n,o),e.memoizedState=o,e.lanes===0&&(e.updateQueue.baseState=o)}var hu={enqueueSetState:function(e,n,o){e=e._reactInternals;var i=Rn(),h=Ya(i);h.payload=n,o!=null&&(h.callback=o),n=Va(e,h,i),n!==null&&(Tn(n,e,i),ti(n,e,i))},enqueueReplaceState:function(e,n,o){e=e._reactInternals;var i=Rn(),h=Ya(i);h.tag=1,h.payload=n,o!=null&&(h.callback=o),n=Va(e,h,i),n!==null&&(Tn(n,e,i),ti(n,e,i))},enqueueForceUpdate:function(e,n){e=e._reactInternals;var o=Rn(),i=Ya(o);i.tag=2,n!=null&&(i.callback=n),n=Va(e,i,o),n!==null&&(Tn(n,e,o),ti(n,e,o))}};function of(e,n,o,i,h,m,y){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(i,m,y):n.prototype&&n.prototype.isPureReactComponent?!Xo(o,i)||!Xo(h,m):!0}function rf(e,n,o,i){e=n.state,typeof n.componentWillReceiveProps=="function"&&n.componentWillReceiveProps(o,i),typeof n.UNSAFE_componentWillReceiveProps=="function"&&n.UNSAFE_componentWillReceiveProps(o,i),n.state!==e&&hu.enqueueReplaceState(n,n.state,null)}function Os(e,n){var o=n;if("ref"in n){o={};for(var i in n)i!=="ref"&&(o[i]=n[i])}if(e=e.defaultProps){o===n&&(o=b({},o));for(var h in e)o[h]===void 0&&(o[h]=e[h])}return o}function lf(e){or(e)}function cf(e){console.error(e)}function uf(e){or(e)}function Nr(e,n){try{var o=e.onUncaughtError;o(n.value,{componentStack:n.stack})}catch(i){setTimeout(function(){throw i})}}function df(e,n,o){try{var i=e.onCaughtError;i(o.value,{componentStack:o.stack,errorBoundary:n.tag===1?n.stateNode:null})}catch(h){setTimeout(function(){throw h})}}function fu(e,n,o){return o=Ya(o),o.tag=3,o.payload={element:null},o.callback=function(){Nr(e,n)},o}function pf(e){return e=Ya(e),e.tag=3,e}function hf(e,n,o,i){var h=o.type.getDerivedStateFromError;if(typeof h=="function"){var m=i.value;e.payload=function(){return h(m)},e.callback=function(){df(n,o,i)}}var y=o.stateNode;y!==null&&typeof y.componentDidCatch=="function"&&(e.callback=function(){df(n,o,i),typeof h!="function"&&(Wa===null?Wa=new Set([this]):Wa.add(this));var E=i.stack;this.componentDidCatch(i.value,{componentStack:E!==null?E:""})})}function pb(e,n,o,i,h){if(o.flags|=32768,i!==null&&typeof i=="object"&&typeof i.then=="function"){if(n=o.alternate,n!==null&&io(n,o,h,!0),o=Mn.current,o!==null){switch(o.tag){case 31:case 13:return Zn===null?Lr():o.alternate===null&&Gt===0&&(Gt=3),o.flags&=-257,o.flags|=65536,o.lanes=h,i===mr?o.flags|=16384:(n=o.updateQueue,n===null?o.updateQueue=new Set([i]):n.add(i),Fu(e,i,h)),!1;case 22:return o.flags|=65536,i===mr?o.flags|=16384:(n=o.updateQueue,n===null?(n={transitions:null,markerInstances:null,retryQueue:new Set([i])},o.updateQueue=n):(o=n.retryQueue,o===null?n.retryQueue=new Set([i]):o.add(i)),Fu(e,i,h)),!1}throw Error(d(435,o.tag))}return Fu(e,i,h),Lr(),!1}if(mt)return n=Mn.current,n!==null?((n.flags&65536)===0&&(n.flags|=256),n.flags|=65536,n.lanes=h,i!==Mc&&(e=Error(d(422),{cause:i}),Zo(Vn(e,o)))):(i!==Mc&&(n=Error(d(423),{cause:i}),Zo(Vn(n,o))),e=e.current.alternate,e.flags|=65536,h&=-h,e.lanes|=h,i=Vn(i,o),h=fu(e.stateNode,i,h),Gc(e,h),Gt!==4&&(Gt=2)),!1;var m=Error(d(520),{cause:i});if(m=Vn(m,o),mi===null?mi=[m]:mi.push(m),Gt!==4&&(Gt=2),n===null)return!0;i=Vn(i,o),o=n;do{switch(o.tag){case 3:return o.flags|=65536,e=h&-h,o.lanes|=e,e=fu(o.stateNode,i,e),Gc(o,e),!1;case 1:if(n=o.type,m=o.stateNode,(o.flags&128)===0&&(typeof n.getDerivedStateFromError=="function"||m!==null&&typeof m.componentDidCatch=="function"&&(Wa===null||!Wa.has(m))))return o.flags|=65536,h&=-h,o.lanes|=h,h=pf(h),hf(h,e,o,i),Gc(o,h),!1}o=o.return}while(o!==null);return!1}var mu=Error(d(461)),Wt=!1;function gn(e,n,o,i){n.child=e===null?gh(n,null,o,i):Ts(n,e.child,o,i)}function ff(e,n,o,i,h){o=o.render;var m=n.ref;if("ref"in i){var y={};for(var E in i)E!=="ref"&&(y[E]=i[E])}else y=i;return Ss(n),i=Zc(e,n,o,y,m,h),E=Kc(),e!==null&&!Wt?(Wc(e,n,h),_a(e,n,h)):(mt&&E&&Cc(n),n.flags|=1,gn(e,n,i,h),n.child)}function mf(e,n,o,i,h){if(e===null){var m=o.type;return typeof m=="function"&&!Nc(m)&&m.defaultProps===void 0&&o.compare===null?(n.tag=15,n.type=m,gf(e,n,m,i,h)):(e=cr(o.type,null,i,n,n.mode,h),e.ref=n.ref,e.return=n,n.child=e)}if(m=e.child,!Eu(e,h)){var y=m.memoizedProps;if(o=o.compare,o=o!==null?o:Xo,o(y,i)&&e.ref===n.ref)return _a(e,n,h)}return n.flags|=1,e=va(m,i),e.ref=n.ref,e.return=n,n.child=e}function gf(e,n,o,i,h){if(e!==null){var m=e.memoizedProps;if(Xo(m,i)&&e.ref===n.ref)if(Wt=!1,n.pendingProps=i=m,Eu(e,h))(e.flags&131072)!==0&&(Wt=!0);else return n.lanes=e.lanes,_a(e,n,h)}return gu(e,n,o,i,h)}function yf(e,n,o,i){var h=i.children,m=e!==null?e.memoizedState:null;if(e===null&&n.stateNode===null&&(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),i.mode==="hidden"){if((n.flags&128)!==0){if(m=m!==null?m.baseLanes|o:o,e!==null){for(i=n.child=e.child,h=0;i!==null;)h=h|i.lanes|i.childLanes,i=i.sibling;i=h&~m}else i=0,n.child=null;return bf(e,n,m,o,i)}if((o&536870912)!==0)n.memoizedState={baseLanes:0,cachePool:null},e!==null&&hr(n,m!==null?m.cachePool:null),m!==null?vh(n,m):Vc(),xh(n);else return i=n.lanes=536870912,bf(e,n,m!==null?m.baseLanes|o:o,o,i)}else m!==null?(hr(n,m.cachePool),vh(n,m),Ja(),n.memoizedState=null):(e!==null&&hr(n,null),Vc(),Ja());return gn(e,n,h,o),n.child}function li(e,n){return e!==null&&e.tag===22||n.stateNode!==null||(n.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),n.sibling}function bf(e,n,o,i,h){var m=Lc();return m=m===null?null:{parent:Zt._currentValue,pool:m},n.memoizedState={baseLanes:o,cachePool:m},e!==null&&hr(n,null),Vc(),xh(n),e!==null&&io(e,n,i,!0),n.childLanes=h,null}function Dr(e,n){return n=Cr({mode:n.mode,children:n.children},e.mode),n.ref=e.ref,e.child=n,n.return=e,n}function vf(e,n,o){return Ts(n,e.child,null,o),e=Dr(n,n.pendingProps),e.flags|=2,Bn(n),n.memoizedState=null,e}function hb(e,n,o){var i=n.pendingProps,h=(n.flags&128)!==0;if(n.flags&=-129,e===null){if(mt){if(i.mode==="hidden")return e=Dr(n,i),n.lanes=536870912,li(null,e);if(Jc(n),(e=qt)?(e=Cm(e,Qn),e=e!==null&&e.data==="&"?e:null,e!==null&&(n.memoizedState={dehydrated:e,treeContext:La!==null?{id:ia,overflow:ra}:null,retryLane:536870912,hydrationErrors:null},o=th(e),o.return=n,n.child=o,fn=n,qt=null)):e=null,e===null)throw Pa(n);return n.lanes=536870912,null}return Dr(n,i)}var m=e.memoizedState;if(m!==null){var y=m.dehydrated;if(Jc(n),h)if(n.flags&256)n.flags&=-257,n=vf(e,n,o);else if(n.memoizedState!==null)n.child=e.child,n.flags|=128,n=null;else throw Error(d(558));else if(Wt||io(e,n,o,!1),h=(o&e.childLanes)!==0,Wt||h){if(i=Ct,i!==null&&(y=Ji(i,o),y!==0&&y!==m.retryLane))throw m.retryLane=y,ks(e,y),Tn(i,e,y),mu;Lr(),n=vf(e,n,o)}else e=m.treeContext,qt=Kn(y.nextSibling),fn=n,mt=!0,Ha=null,Qn=!1,e!==null&&sh(n,e),n=Dr(n,i),n.flags|=4096;return n}return e=va(e.child,{mode:i.mode,children:i.children}),e.ref=n.ref,n.child=e,e.return=n,e}function Tr(e,n){var o=n.ref;if(o===null)e!==null&&e.ref!==null&&(n.flags|=4194816);else{if(typeof o!="function"&&typeof o!="object")throw Error(d(284));(e===null||e.ref!==o)&&(n.flags|=4194816)}}function gu(e,n,o,i,h){return Ss(n),o=Zc(e,n,o,i,void 0,h),i=Kc(),e!==null&&!Wt?(Wc(e,n,h),_a(e,n,h)):(mt&&i&&Cc(n),n.flags|=1,gn(e,n,o,h),n.child)}function xf(e,n,o,i,h,m){return Ss(n),n.updateQueue=null,o=kh(n,i,o,h),wh(e),i=Kc(),e!==null&&!Wt?(Wc(e,n,m),_a(e,n,m)):(mt&&i&&Cc(n),n.flags|=1,gn(e,n,o,m),n.child)}function wf(e,n,o,i,h){if(Ss(n),n.stateNode===null){var m=no,y=o.contextType;typeof y=="object"&&y!==null&&(m=mn(y)),m=new o(i,m),n.memoizedState=m.state!==null&&m.state!==void 0?m.state:null,m.updater=hu,n.stateNode=m,m._reactInternals=n,m=n.stateNode,m.props=i,m.state=n.memoizedState,m.refs={},Pc(n),y=o.contextType,m.context=typeof y=="object"&&y!==null?mn(y):no,m.state=n.memoizedState,y=o.getDerivedStateFromProps,typeof y=="function"&&(pu(n,o,y,i),m.state=n.memoizedState),typeof o.getDerivedStateFromProps=="function"||typeof m.getSnapshotBeforeUpdate=="function"||typeof m.UNSAFE_componentWillMount!="function"&&typeof m.componentWillMount!="function"||(y=m.state,typeof m.componentWillMount=="function"&&m.componentWillMount(),typeof m.UNSAFE_componentWillMount=="function"&&m.UNSAFE_componentWillMount(),y!==m.state&&hu.enqueueReplaceState(m,m.state,null),ai(n,i,m,h),ni(),m.state=n.memoizedState),typeof m.componentDidMount=="function"&&(n.flags|=4194308),i=!0}else if(e===null){m=n.stateNode;var E=n.memoizedProps,J=Os(o,E);m.props=J;var ue=m.context,ve=o.contextType;y=no,typeof ve=="object"&&ve!==null&&(y=mn(ve));var Se=o.getDerivedStateFromProps;ve=typeof Se=="function"||typeof m.getSnapshotBeforeUpdate=="function",E=n.pendingProps!==E,ve||typeof m.UNSAFE_componentWillReceiveProps!="function"&&typeof m.componentWillReceiveProps!="function"||(E||ue!==y)&&rf(n,m,i,y),Ga=!1;var he=n.memoizedState;m.state=he,ai(n,i,m,h),ni(),ue=n.memoizedState,E||he!==ue||Ga?(typeof Se=="function"&&(pu(n,o,Se,i),ue=n.memoizedState),(J=Ga||of(n,o,J,i,he,ue,y))?(ve||typeof m.UNSAFE_componentWillMount!="function"&&typeof m.componentWillMount!="function"||(typeof m.componentWillMount=="function"&&m.componentWillMount(),typeof m.UNSAFE_componentWillMount=="function"&&m.UNSAFE_componentWillMount()),typeof m.componentDidMount=="function"&&(n.flags|=4194308)):(typeof m.componentDidMount=="function"&&(n.flags|=4194308),n.memoizedProps=i,n.memoizedState=ue),m.props=i,m.state=ue,m.context=y,i=J):(typeof m.componentDidMount=="function"&&(n.flags|=4194308),i=!1)}else{m=n.stateNode,Uc(e,n),y=n.memoizedProps,ve=Os(o,y),m.props=ve,Se=n.pendingProps,he=m.context,ue=o.contextType,J=no,typeof ue=="object"&&ue!==null&&(J=mn(ue)),E=o.getDerivedStateFromProps,(ue=typeof E=="function"||typeof m.getSnapshotBeforeUpdate=="function")||typeof m.UNSAFE_componentWillReceiveProps!="function"&&typeof m.componentWillReceiveProps!="function"||(y!==Se||he!==J)&&rf(n,m,i,J),Ga=!1,he=n.memoizedState,m.state=he,ai(n,i,m,h),ni();var ge=n.memoizedState;y!==Se||he!==ge||Ga||e!==null&&e.dependencies!==null&&dr(e.dependencies)?(typeof E=="function"&&(pu(n,o,E,i),ge=n.memoizedState),(ve=Ga||of(n,o,ve,i,he,ge,J)||e!==null&&e.dependencies!==null&&dr(e.dependencies))?(ue||typeof m.UNSAFE_componentWillUpdate!="function"&&typeof m.componentWillUpdate!="function"||(typeof m.componentWillUpdate=="function"&&m.componentWillUpdate(i,ge,J),typeof m.UNSAFE_componentWillUpdate=="function"&&m.UNSAFE_componentWillUpdate(i,ge,J)),typeof m.componentDidUpdate=="function"&&(n.flags|=4),typeof m.getSnapshotBeforeUpdate=="function"&&(n.flags|=1024)):(typeof m.componentDidUpdate!="function"||y===e.memoizedProps&&he===e.memoizedState||(n.flags|=4),typeof m.getSnapshotBeforeUpdate!="function"||y===e.memoizedProps&&he===e.memoizedState||(n.flags|=1024),n.memoizedProps=i,n.memoizedState=ge),m.props=i,m.state=ge,m.context=J,i=ve):(typeof m.componentDidUpdate!="function"||y===e.memoizedProps&&he===e.memoizedState||(n.flags|=4),typeof m.getSnapshotBeforeUpdate!="function"||y===e.memoizedProps&&he===e.memoizedState||(n.flags|=1024),i=!1)}return m=i,Tr(e,n),i=(n.flags&128)!==0,m||i?(m=n.stateNode,o=i&&typeof o.getDerivedStateFromError!="function"?null:m.render(),n.flags|=1,e!==null&&i?(n.child=Ts(n,e.child,null,h),n.child=Ts(n,null,o,h)):gn(e,n,o,h),n.memoizedState=m.state,e=n.child):e=_a(e,n,h),e}function kf(e,n,o,i){return As(),n.flags|=256,gn(e,n,o,i),n.child}var yu={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function bu(e){return{baseLanes:e,cachePool:uh()}}function vu(e,n,o){return e=e!==null?e.childLanes&~o:0,n&&(e|=qn),e}function Ef(e,n,o){var i=n.pendingProps,h=!1,m=(n.flags&128)!==0,y;if((y=m)||(y=e!==null&&e.memoizedState===null?!1:(Jt.current&2)!==0),y&&(h=!0,n.flags&=-129),y=(n.flags&32)!==0,n.flags&=-33,e===null){if(mt){if(h?Xa(n):Ja(),(e=qt)?(e=Cm(e,Qn),e=e!==null&&e.data!=="&"?e:null,e!==null&&(n.memoizedState={dehydrated:e,treeContext:La!==null?{id:ia,overflow:ra}:null,retryLane:536870912,hydrationErrors:null},o=th(e),o.return=n,n.child=o,fn=n,qt=null)):e=null,e===null)throw Pa(n);return td(e)?n.lanes=32:n.lanes=536870912,null}var E=i.children;return i=i.fallback,h?(Ja(),h=n.mode,E=Cr({mode:"hidden",children:E},h),i=Es(i,h,o,null),E.return=n,i.return=n,E.sibling=i,n.child=E,i=n.child,i.memoizedState=bu(o),i.childLanes=vu(e,y,o),n.memoizedState=yu,li(null,i)):(Xa(n),xu(n,E))}var J=e.memoizedState;if(J!==null&&(E=J.dehydrated,E!==null)){if(m)n.flags&256?(Xa(n),n.flags&=-257,n=wu(e,n,o)):n.memoizedState!==null?(Ja(),n.child=e.child,n.flags|=128,n=null):(Ja(),E=i.fallback,h=n.mode,i=Cr({mode:"visible",children:i.children},h),E=Es(E,h,o,null),E.flags|=2,i.return=n,E.return=n,i.sibling=E,n.child=i,Ts(n,e.child,null,o),i=n.child,i.memoizedState=bu(o),i.childLanes=vu(e,y,o),n.memoizedState=yu,n=li(null,i));else if(Xa(n),td(E)){if(y=E.nextSibling&&E.nextSibling.dataset,y)var ue=y.dgst;y=ue,i=Error(d(419)),i.stack="",i.digest=y,Zo({value:i,source:null,stack:null}),n=wu(e,n,o)}else if(Wt||io(e,n,o,!1),y=(o&e.childLanes)!==0,Wt||y){if(y=Ct,y!==null&&(i=Ji(y,o),i!==0&&i!==J.retryLane))throw J.retryLane=i,ks(e,i),Tn(y,e,i),mu;ed(E)||Lr(),n=wu(e,n,o)}else ed(E)?(n.flags|=192,n.child=e.child,n=null):(e=J.treeContext,qt=Kn(E.nextSibling),fn=n,mt=!0,Ha=null,Qn=!1,e!==null&&sh(n,e),n=xu(n,i.children),n.flags|=4096);return n}return h?(Ja(),E=i.fallback,h=n.mode,J=e.child,ue=J.sibling,i=va(J,{mode:"hidden",children:i.children}),i.subtreeFlags=J.subtreeFlags&65011712,ue!==null?E=va(ue,E):(E=Es(E,h,o,null),E.flags|=2),E.return=n,i.return=n,i.sibling=E,n.child=i,li(null,i),i=n.child,E=e.child.memoizedState,E===null?E=bu(o):(h=E.cachePool,h!==null?(J=Zt._currentValue,h=h.parent!==J?{parent:J,pool:J}:h):h=uh(),E={baseLanes:E.baseLanes|o,cachePool:h}),i.memoizedState=E,i.childLanes=vu(e,y,o),n.memoizedState=yu,li(e.child,i)):(Xa(n),o=e.child,e=o.sibling,o=va(o,{mode:"visible",children:i.children}),o.return=n,o.sibling=null,e!==null&&(y=n.deletions,y===null?(n.deletions=[e],n.flags|=16):y.push(e)),n.child=o,n.memoizedState=null,o)}function xu(e,n){return n=Cr({mode:"visible",children:n},e.mode),n.return=e,e.child=n}function Cr(e,n){return e=On(22,e,null,n),e.lanes=0,e}function wu(e,n,o){return Ts(n,e.child,null,o),e=xu(n,n.pendingProps.children),e.flags|=2,n.memoizedState=null,e}function Af(e,n,o){e.lanes|=n;var i=e.alternate;i!==null&&(i.lanes|=n),qc(e.return,n,o)}function ku(e,n,o,i,h,m){var y=e.memoizedState;y===null?e.memoizedState={isBackwards:n,rendering:null,renderingStartTime:0,last:i,tail:o,tailMode:h,treeForkCount:m}:(y.isBackwards=n,y.rendering=null,y.renderingStartTime=0,y.last=i,y.tail=o,y.tailMode=h,y.treeForkCount=m)}function _f(e,n,o){var i=n.pendingProps,h=i.revealOrder,m=i.tail;i=i.children;var y=Jt.current,E=(y&2)!==0;if(E?(y=y&1|2,n.flags|=128):y&=1,re(Jt,y),gn(e,n,i,o),i=mt?Qo:0,!E&&e!==null&&(e.flags&128)!==0)e:for(e=n.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Af(e,o,n);else if(e.tag===19)Af(e,o,n);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===n)break e;for(;e.sibling===null;){if(e.return===null||e.return===n)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(h){case"forwards":for(o=n.child,h=null;o!==null;)e=o.alternate,e!==null&&vr(e)===null&&(h=o),o=o.sibling;o=h,o===null?(h=n.child,n.child=null):(h=o.sibling,o.sibling=null),ku(n,!1,h,o,m,i);break;case"backwards":case"unstable_legacy-backwards":for(o=null,h=n.child,n.child=null;h!==null;){if(e=h.alternate,e!==null&&vr(e)===null){n.child=h;break}e=h.sibling,h.sibling=o,o=h,h=e}ku(n,!0,o,null,m,i);break;case"together":ku(n,!1,null,null,void 0,i);break;default:n.memoizedState=null}return n.child}function _a(e,n,o){if(e!==null&&(n.dependencies=e.dependencies),Ka|=n.lanes,(o&n.childLanes)===0)if(e!==null){if(io(e,n,o,!1),(o&n.childLanes)===0)return null}else return null;if(e!==null&&n.child!==e.child)throw Error(d(153));if(n.child!==null){for(e=n.child,o=va(e,e.pendingProps),n.child=o,o.return=n;e.sibling!==null;)e=e.sibling,o=o.sibling=va(e,e.pendingProps),o.return=n;o.sibling=null}return n.child}function Eu(e,n){return(e.lanes&n)!==0?!0:(e=e.dependencies,!!(e!==null&&dr(e)))}function fb(e,n,o){switch(n.tag){case 3:Fe(n,n.stateNode.containerInfo),Ua(n,Zt,e.memoizedState.cache),As();break;case 27:case 5:Qe(n);break;case 4:Fe(n,n.stateNode.containerInfo);break;case 10:Ua(n,n.type,n.memoizedProps.value);break;case 31:if(n.memoizedState!==null)return n.flags|=128,Jc(n),null;break;case 13:var i=n.memoizedState;if(i!==null)return i.dehydrated!==null?(Xa(n),n.flags|=128,null):(o&n.child.childLanes)!==0?Ef(e,n,o):(Xa(n),e=_a(e,n,o),e!==null?e.sibling:null);Xa(n);break;case 19:var h=(e.flags&128)!==0;if(i=(o&n.childLanes)!==0,i||(io(e,n,o,!1),i=(o&n.childLanes)!==0),h){if(i)return _f(e,n,o);n.flags|=128}if(h=n.memoizedState,h!==null&&(h.rendering=null,h.tail=null,h.lastEffect=null),re(Jt,Jt.current),i)break;return null;case 22:return n.lanes=0,yf(e,n,o,n.pendingProps);case 24:Ua(n,Zt,e.memoizedState.cache)}return _a(e,n,o)}function Sf(e,n,o){if(e!==null)if(e.memoizedProps!==n.pendingProps)Wt=!0;else{if(!Eu(e,o)&&(n.flags&128)===0)return Wt=!1,fb(e,n,o);Wt=(e.flags&131072)!==0}else Wt=!1,mt&&(n.flags&1048576)!==0&&ah(n,Qo,n.index);switch(n.lanes=0,n.tag){case 16:e:{var i=n.pendingProps;if(e=Ns(n.elementType),n.type=e,typeof e=="function")Nc(e)?(i=Os(e,i),n.tag=1,n=wf(null,n,e,i,o)):(n.tag=0,n=gu(null,n,e,i,o));else{if(e!=null){var h=e.$$typeof;if(h===H){n.tag=11,n=ff(null,n,e,i,o);break e}else if(h===R){n.tag=14,n=mf(null,n,e,i,o);break e}}throw n=pe(e)||e,Error(d(306,n,""))}}return n;case 0:return gu(e,n,n.type,n.pendingProps,o);case 1:return i=n.type,h=Os(i,n.pendingProps),wf(e,n,i,h,o);case 3:e:{if(Fe(n,n.stateNode.containerInfo),e===null)throw Error(d(387));i=n.pendingProps;var m=n.memoizedState;h=m.element,Uc(e,n),ai(n,i,null,o);var y=n.memoizedState;if(i=y.cache,Ua(n,Zt,i),i!==m.cache&&Rc(n,[Zt],o,!0),ni(),i=y.element,m.isDehydrated)if(m={element:i,isDehydrated:!1,cache:y.cache},n.updateQueue.baseState=m,n.memoizedState=m,n.flags&256){n=kf(e,n,i,o);break e}else if(i!==h){h=Vn(Error(d(424)),n),Zo(h),n=kf(e,n,i,o);break e}else for(e=n.stateNode.containerInfo,e.nodeType===9?e=e.body:e=e.nodeName==="HTML"?e.ownerDocument.body:e,qt=Kn(e.firstChild),fn=n,mt=!0,Ha=null,Qn=!0,o=gh(n,null,i,o),n.child=o;o;)o.flags=o.flags&-3|4096,o=o.sibling;else{if(As(),i===h){n=_a(e,n,o);break e}gn(e,n,i,o)}n=n.child}return n;case 26:return Tr(e,n),e===null?(o=Rm(n.type,null,n.pendingProps,null))?n.memoizedState=o:mt||(o=n.type,e=n.pendingProps,i=Xr(ke.current).createElement(o),i[le]=n,i[Ee]=e,yn(i,o,e),un(i),n.stateNode=i):n.memoizedState=Rm(n.type,e.memoizedProps,n.pendingProps,e.memoizedState),null;case 27:return Qe(n),e===null&&mt&&(i=n.stateNode=Bm(n.type,n.pendingProps,ke.current),fn=n,Qn=!0,h=qt,ns(n.type)?(nd=h,qt=Kn(i.firstChild)):qt=h),gn(e,n,n.pendingProps.children,o),Tr(e,n),e===null&&(n.flags|=4194304),n.child;case 5:return e===null&&mt&&((h=i=qt)&&(i=Gb(i,n.type,n.pendingProps,Qn),i!==null?(n.stateNode=i,fn=n,qt=Kn(i.firstChild),Qn=!1,h=!0):h=!1),h||Pa(n)),Qe(n),h=n.type,m=n.pendingProps,y=e!==null?e.memoizedProps:null,i=m.children,Ku(h,m)?i=null:y!==null&&Ku(h,y)&&(n.flags|=32),n.memoizedState!==null&&(h=Zc(e,n,ob,null,null,o),Ei._currentValue=h),Tr(e,n),gn(e,n,i,o),n.child;case 6:return e===null&&mt&&((e=o=qt)&&(o=Yb(o,n.pendingProps,Qn),o!==null?(n.stateNode=o,fn=n,qt=null,e=!0):e=!1),e||Pa(n)),null;case 13:return Ef(e,n,o);case 4:return Fe(n,n.stateNode.containerInfo),i=n.pendingProps,e===null?n.child=Ts(n,null,i,o):gn(e,n,i,o),n.child;case 11:return ff(e,n,n.type,n.pendingProps,o);case 7:return gn(e,n,n.pendingProps,o),n.child;case 8:return gn(e,n,n.pendingProps.children,o),n.child;case 12:return gn(e,n,n.pendingProps.children,o),n.child;case 10:return i=n.pendingProps,Ua(n,n.type,i.value),gn(e,n,i.children,o),n.child;case 9:return h=n.type._context,i=n.pendingProps.children,Ss(n),h=mn(h),i=i(h),n.flags|=1,gn(e,n,i,o),n.child;case 14:return mf(e,n,n.type,n.pendingProps,o);case 15:return gf(e,n,n.type,n.pendingProps,o);case 19:return _f(e,n,o);case 31:return hb(e,n,o);case 22:return yf(e,n,o,n.pendingProps);case 24:return Ss(n),i=mn(Zt),e===null?(h=Lc(),h===null&&(h=Ct,m=zc(),h.pooledCache=m,m.refCount++,m!==null&&(h.pooledCacheLanes|=o),h=m),n.memoizedState={parent:i,cache:h},Pc(n),Ua(n,Zt,h)):((e.lanes&o)!==0&&(Uc(e,n),ai(n,null,null,o),ni()),h=e.memoizedState,m=n.memoizedState,h.parent!==i?(h={parent:i,cache:i},n.memoizedState=h,n.lanes===0&&(n.memoizedState=n.updateQueue.baseState=h),Ua(n,Zt,i)):(i=m.cache,Ua(n,Zt,i),i!==h.cache&&Rc(n,[Zt],o,!0))),gn(e,n,n.pendingProps.children,o),n.child;case 29:throw n.pendingProps}throw Error(d(156,n.tag))}function Sa(e){e.flags|=4}function Au(e,n,o,i,h){if((n=(e.mode&32)!==0)&&(n=!1),n){if(e.flags|=16777216,(h&335544128)===h)if(e.stateNode.complete)e.flags|=8192;else if(If())e.flags|=8192;else throw Ds=mr,Hc}else e.flags&=-16777217}function $f(e,n){if(n.type!=="stylesheet"||(n.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!Pm(n))if(If())e.flags|=8192;else throw Ds=mr,Hc}function Or(e,n){n!==null&&(e.flags|=4),e.flags&16384&&(n=e.tag!==22?Pn():536870912,e.lanes|=n,vo|=n)}function ci(e,n){if(!mt)switch(e.tailMode){case"hidden":n=e.tail;for(var o=null;n!==null;)n.alternate!==null&&(o=n),n=n.sibling;o===null?e.tail=null:o.sibling=null;break;case"collapsed":o=e.tail;for(var i=null;o!==null;)o.alternate!==null&&(i=o),o=o.sibling;i===null?n||e.tail===null?e.tail=null:e.tail.sibling=null:i.sibling=null}}function Rt(e){var n=e.alternate!==null&&e.alternate.child===e.child,o=0,i=0;if(n)for(var h=e.child;h!==null;)o|=h.lanes|h.childLanes,i|=h.subtreeFlags&65011712,i|=h.flags&65011712,h.return=e,h=h.sibling;else for(h=e.child;h!==null;)o|=h.lanes|h.childLanes,i|=h.subtreeFlags,i|=h.flags,h.return=e,h=h.sibling;return e.subtreeFlags|=i,e.childLanes=o,n}function mb(e,n,o){var i=n.pendingProps;switch(Oc(n),n.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Rt(n),null;case 1:return Rt(n),null;case 3:return o=n.stateNode,i=null,e!==null&&(i=e.memoizedState.cache),n.memoizedState.cache!==i&&(n.flags|=2048),ka(Zt),Re(),o.pendingContext&&(o.context=o.pendingContext,o.pendingContext=null),(e===null||e.child===null)&&(oo(n)?Sa(n):e===null||e.memoizedState.isDehydrated&&(n.flags&256)===0||(n.flags|=1024,Bc())),Rt(n),null;case 26:var h=n.type,m=n.memoizedState;return e===null?(Sa(n),m!==null?(Rt(n),$f(n,m)):(Rt(n),Au(n,h,null,i,o))):m?m!==e.memoizedState?(Sa(n),Rt(n),$f(n,m)):(Rt(n),n.flags&=-16777217):(e=e.memoizedProps,e!==i&&Sa(n),Rt(n),Au(n,h,e,i,o)),null;case 27:if(K(n),o=ke.current,h=n.type,e!==null&&n.stateNode!=null)e.memoizedProps!==i&&Sa(n);else{if(!i){if(n.stateNode===null)throw Error(d(166));return Rt(n),null}e=Y.current,oo(n)?oh(n):(e=Bm(h,i,o),n.stateNode=e,Sa(n))}return Rt(n),null;case 5:if(K(n),h=n.type,e!==null&&n.stateNode!=null)e.memoizedProps!==i&&Sa(n);else{if(!i){if(n.stateNode===null)throw Error(d(166));return Rt(n),null}if(m=Y.current,oo(n))oh(n);else{var y=Xr(ke.current);switch(m){case 1:m=y.createElementNS("http://www.w3.org/2000/svg",h);break;case 2:m=y.createElementNS("http://www.w3.org/1998/Math/MathML",h);break;default:switch(h){case"svg":m=y.createElementNS("http://www.w3.org/2000/svg",h);break;case"math":m=y.createElementNS("http://www.w3.org/1998/Math/MathML",h);break;case"script":m=y.createElement("div"),m.innerHTML="<script><\/script>",m=m.removeChild(m.firstChild);break;case"select":m=typeof i.is=="string"?y.createElement("select",{is:i.is}):y.createElement("select"),i.multiple?m.multiple=!0:i.size&&(m.size=i.size);break;default:m=typeof i.is=="string"?y.createElement(h,{is:i.is}):y.createElement(h)}}m[le]=n,m[Ee]=i;e:for(y=n.child;y!==null;){if(y.tag===5||y.tag===6)m.appendChild(y.stateNode);else if(y.tag!==4&&y.tag!==27&&y.child!==null){y.child.return=y,y=y.child;continue}if(y===n)break e;for(;y.sibling===null;){if(y.return===null||y.return===n)break e;y=y.return}y.sibling.return=y.return,y=y.sibling}n.stateNode=m;e:switch(yn(m,h,i),h){case"button":case"input":case"select":case"textarea":i=!!i.autoFocus;break e;case"img":i=!0;break e;default:i=!1}i&&Sa(n)}}return Rt(n),Au(n,n.type,e===null?null:e.memoizedProps,n.pendingProps,o),null;case 6:if(e&&n.stateNode!=null)e.memoizedProps!==i&&Sa(n);else{if(typeof i!="string"&&n.stateNode===null)throw Error(d(166));if(e=ke.current,oo(n)){if(e=n.stateNode,o=n.memoizedProps,i=null,h=fn,h!==null)switch(h.tag){case 27:case 5:i=h.memoizedProps}e[le]=n,e=!!(e.nodeValue===o||i!==null&&i.suppressHydrationWarning===!0||Em(e.nodeValue,o)),e||Pa(n,!0)}else e=Xr(e).createTextNode(i),e[le]=n,n.stateNode=e}return Rt(n),null;case 31:if(o=n.memoizedState,e===null||e.memoizedState!==null){if(i=oo(n),o!==null){if(e===null){if(!i)throw Error(d(318));if(e=n.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(d(557));e[le]=n}else As(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Rt(n),e=!1}else o=Bc(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=o),e=!0;if(!e)return n.flags&256?(Bn(n),n):(Bn(n),null);if((n.flags&128)!==0)throw Error(d(558))}return Rt(n),null;case 13:if(i=n.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(h=oo(n),i!==null&&i.dehydrated!==null){if(e===null){if(!h)throw Error(d(318));if(h=n.memoizedState,h=h!==null?h.dehydrated:null,!h)throw Error(d(317));h[le]=n}else As(),(n.flags&128)===0&&(n.memoizedState=null),n.flags|=4;Rt(n),h=!1}else h=Bc(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=h),h=!0;if(!h)return n.flags&256?(Bn(n),n):(Bn(n),null)}return Bn(n),(n.flags&128)!==0?(n.lanes=o,n):(o=i!==null,e=e!==null&&e.memoizedState!==null,o&&(i=n.child,h=null,i.alternate!==null&&i.alternate.memoizedState!==null&&i.alternate.memoizedState.cachePool!==null&&(h=i.alternate.memoizedState.cachePool.pool),m=null,i.memoizedState!==null&&i.memoizedState.cachePool!==null&&(m=i.memoizedState.cachePool.pool),m!==h&&(i.flags|=2048)),o!==e&&o&&(n.child.flags|=8192),Or(n,n.updateQueue),Rt(n),null);case 4:return Re(),e===null&&Vu(n.stateNode.containerInfo),Rt(n),null;case 10:return ka(n.type),Rt(n),null;case 19:if(G(Jt),i=n.memoizedState,i===null)return Rt(n),null;if(h=(n.flags&128)!==0,m=i.rendering,m===null)if(h)ci(i,!1);else{if(Gt!==0||e!==null&&(e.flags&128)!==0)for(e=n.child;e!==null;){if(m=vr(e),m!==null){for(n.flags|=128,ci(i,!1),e=m.updateQueue,n.updateQueue=e,Or(n,e),n.subtreeFlags=0,e=o,o=n.child;o!==null;)eh(o,e),o=o.sibling;return re(Jt,Jt.current&1|2),mt&&xa(n,i.treeForkCount),n.child}e=e.sibling}i.tail!==null&&Le()>Rr&&(n.flags|=128,h=!0,ci(i,!1),n.lanes=4194304)}else{if(!h)if(e=vr(m),e!==null){if(n.flags|=128,h=!0,e=e.updateQueue,n.updateQueue=e,Or(n,e),ci(i,!0),i.tail===null&&i.tailMode==="hidden"&&!m.alternate&&!mt)return Rt(n),null}else 2*Le()-i.renderingStartTime>Rr&&o!==536870912&&(n.flags|=128,h=!0,ci(i,!1),n.lanes=4194304);i.isBackwards?(m.sibling=n.child,n.child=m):(e=i.last,e!==null?e.sibling=m:n.child=m,i.last=m)}return i.tail!==null?(e=i.tail,i.rendering=e,i.tail=e.sibling,i.renderingStartTime=Le(),e.sibling=null,o=Jt.current,re(Jt,h?o&1|2:o&1),mt&&xa(n,i.treeForkCount),e):(Rt(n),null);case 22:case 23:return Bn(n),Xc(),i=n.memoizedState!==null,e!==null?e.memoizedState!==null!==i&&(n.flags|=8192):i&&(n.flags|=8192),i?(o&536870912)!==0&&(n.flags&128)===0&&(Rt(n),n.subtreeFlags&6&&(n.flags|=8192)):Rt(n),o=n.updateQueue,o!==null&&Or(n,o.retryQueue),o=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(o=e.memoizedState.cachePool.pool),i=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(i=n.memoizedState.cachePool.pool),i!==o&&(n.flags|=2048),e!==null&&G($s),null;case 24:return o=null,e!==null&&(o=e.memoizedState.cache),n.memoizedState.cache!==o&&(n.flags|=2048),ka(Zt),Rt(n),null;case 25:return null;case 30:return null}throw Error(d(156,n.tag))}function gb(e,n){switch(Oc(n),n.tag){case 1:return e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 3:return ka(Zt),Re(),e=n.flags,(e&65536)!==0&&(e&128)===0?(n.flags=e&-65537|128,n):null;case 26:case 27:case 5:return K(n),null;case 31:if(n.memoizedState!==null){if(Bn(n),n.alternate===null)throw Error(d(340));As()}return e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 13:if(Bn(n),e=n.memoizedState,e!==null&&e.dehydrated!==null){if(n.alternate===null)throw Error(d(340));As()}return e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 19:return G(Jt),null;case 4:return Re(),null;case 10:return ka(n.type),null;case 22:case 23:return Bn(n),Xc(),e!==null&&G($s),e=n.flags,e&65536?(n.flags=e&-65537|128,n):null;case 24:return ka(Zt),null;case 25:return null;default:return null}}function Nf(e,n){switch(Oc(n),n.tag){case 3:ka(Zt),Re();break;case 26:case 27:case 5:K(n);break;case 4:Re();break;case 31:n.memoizedState!==null&&Bn(n);break;case 13:Bn(n);break;case 19:G(Jt);break;case 10:ka(n.type);break;case 22:case 23:Bn(n),Xc(),e!==null&&G($s);break;case 24:ka(Zt)}}function ui(e,n){try{var o=n.updateQueue,i=o!==null?o.lastEffect:null;if(i!==null){var h=i.next;o=h;do{if((o.tag&e)===e){i=void 0;var m=o.create,y=o.inst;i=m(),y.destroy=i}o=o.next}while(o!==h)}}catch(E){_t(n,n.return,E)}}function Qa(e,n,o){try{var i=n.updateQueue,h=i!==null?i.lastEffect:null;if(h!==null){var m=h.next;i=m;do{if((i.tag&e)===e){var y=i.inst,E=y.destroy;if(E!==void 0){y.destroy=void 0,h=n;var J=o,ue=E;try{ue()}catch(ve){_t(h,J,ve)}}}i=i.next}while(i!==m)}}catch(ve){_t(n,n.return,ve)}}function Df(e){var n=e.updateQueue;if(n!==null){var o=e.stateNode;try{bh(n,o)}catch(i){_t(e,e.return,i)}}}function Tf(e,n,o){o.props=Os(e.type,e.memoizedProps),o.state=e.memoizedState;try{o.componentWillUnmount()}catch(i){_t(e,n,i)}}function di(e,n){try{var o=e.ref;if(o!==null){switch(e.tag){case 26:case 27:case 5:var i=e.stateNode;break;case 30:i=e.stateNode;break;default:i=e.stateNode}typeof o=="function"?e.refCleanup=o(i):o.current=i}}catch(h){_t(e,n,h)}}function la(e,n){var o=e.ref,i=e.refCleanup;if(o!==null)if(typeof i=="function")try{i()}catch(h){_t(e,n,h)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof o=="function")try{o(null)}catch(h){_t(e,n,h)}else o.current=null}function Cf(e){var n=e.type,o=e.memoizedProps,i=e.stateNode;try{e:switch(n){case"button":case"input":case"select":case"textarea":o.autoFocus&&i.focus();break e;case"img":o.src?i.src=o.src:o.srcSet&&(i.srcset=o.srcSet)}}catch(h){_t(e,e.return,h)}}function _u(e,n,o){try{var i=e.stateNode;zb(i,e.type,o,n),i[Ee]=n}catch(h){_t(e,e.return,h)}}function Of(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&ns(e.type)||e.tag===4}function Su(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||Of(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&ns(e.type)||e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function $u(e,n,o){var i=e.tag;if(i===5||i===6)e=e.stateNode,n?(o.nodeType===9?o.body:o.nodeName==="HTML"?o.ownerDocument.body:o).insertBefore(e,n):(n=o.nodeType===9?o.body:o.nodeName==="HTML"?o.ownerDocument.body:o,n.appendChild(e),o=o._reactRootContainer,o!=null||n.onclick!==null||(n.onclick=ya));else if(i!==4&&(i===27&&ns(e.type)&&(o=e.stateNode,n=null),e=e.child,e!==null))for($u(e,n,o),e=e.sibling;e!==null;)$u(e,n,o),e=e.sibling}function Mr(e,n,o){var i=e.tag;if(i===5||i===6)e=e.stateNode,n?o.insertBefore(e,n):o.appendChild(e);else if(i!==4&&(i===27&&ns(e.type)&&(o=e.stateNode),e=e.child,e!==null))for(Mr(e,n,o),e=e.sibling;e!==null;)Mr(e,n,o),e=e.sibling}function Mf(e){var n=e.stateNode,o=e.memoizedProps;try{for(var i=e.type,h=n.attributes;h.length;)n.removeAttributeNode(h[0]);yn(n,i,o),n[le]=e,n[Ee]=o}catch(m){_t(e,e.return,m)}}var $a=!1,It=!1,Nu=!1,Bf=typeof WeakSet=="function"?WeakSet:Set,dn=null;function yb(e,n){if(e=e.containerInfo,Qu=el,e=Yp(e),wc(e)){if("selectionStart"in e)var o={start:e.selectionStart,end:e.selectionEnd};else e:{o=(o=e.ownerDocument)&&o.defaultView||window;var i=o.getSelection&&o.getSelection();if(i&&i.rangeCount!==0){o=i.anchorNode;var h=i.anchorOffset,m=i.focusNode;i=i.focusOffset;try{o.nodeType,m.nodeType}catch{o=null;break e}var y=0,E=-1,J=-1,ue=0,ve=0,Se=e,he=null;t:for(;;){for(var ge;Se!==o||h!==0&&Se.nodeType!==3||(E=y+h),Se!==m||i!==0&&Se.nodeType!==3||(J=y+i),Se.nodeType===3&&(y+=Se.nodeValue.length),(ge=Se.firstChild)!==null;)he=Se,Se=ge;for(;;){if(Se===e)break t;if(he===o&&++ue===h&&(E=y),he===m&&++ve===i&&(J=y),(ge=Se.nextSibling)!==null)break;Se=he,he=Se.parentNode}Se=ge}o=E===-1||J===-1?null:{start:E,end:J}}else o=null}o=o||{start:0,end:0}}else o=null;for(Zu={focusedElem:e,selectionRange:o},el=!1,dn=n;dn!==null;)if(n=dn,e=n.child,(n.subtreeFlags&1028)!==0&&e!==null)e.return=n,dn=e;else for(;dn!==null;){switch(n=dn,m=n.alternate,e=n.flags,n.tag){case 0:if((e&4)!==0&&(e=n.updateQueue,e=e!==null?e.events:null,e!==null))for(o=0;o<e.length;o++)h=e[o],h.ref.impl=h.nextImpl;break;case 11:case 15:break;case 1:if((e&1024)!==0&&m!==null){e=void 0,o=n,h=m.memoizedProps,m=m.memoizedState,i=o.stateNode;try{var Ue=Os(o.type,h);e=i.getSnapshotBeforeUpdate(Ue,m),i.__reactInternalSnapshotBeforeUpdate=e}catch(Ie){_t(o,o.return,Ie)}}break;case 3:if((e&1024)!==0){if(e=n.stateNode.containerInfo,o=e.nodeType,o===9)Iu(e);else if(o===1)switch(e.nodeName){case"HEAD":case"HTML":case"BODY":Iu(e);break;default:e.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((e&1024)!==0)throw Error(d(163))}if(e=n.sibling,e!==null){e.return=n.return,dn=e;break}dn=n.return}}function jf(e,n,o){var i=o.flags;switch(o.tag){case 0:case 11:case 15:Da(e,o),i&4&&ui(5,o);break;case 1:if(Da(e,o),i&4)if(e=o.stateNode,n===null)try{e.componentDidMount()}catch(y){_t(o,o.return,y)}else{var h=Os(o.type,n.memoizedProps);n=n.memoizedState;try{e.componentDidUpdate(h,n,e.__reactInternalSnapshotBeforeUpdate)}catch(y){_t(o,o.return,y)}}i&64&&Df(o),i&512&&di(o,o.return);break;case 3:if(Da(e,o),i&64&&(e=o.updateQueue,e!==null)){if(n=null,o.child!==null)switch(o.child.tag){case 27:case 5:n=o.child.stateNode;break;case 1:n=o.child.stateNode}try{bh(e,n)}catch(y){_t(o,o.return,y)}}break;case 27:n===null&&i&4&&Mf(o);case 26:case 5:Da(e,o),n===null&&i&4&&Cf(o),i&512&&di(o,o.return);break;case 12:Da(e,o);break;case 31:Da(e,o),i&4&&zf(e,o);break;case 13:Da(e,o),i&4&&Ff(e,o),i&64&&(e=o.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(o=Sb.bind(null,o),Vb(e,o))));break;case 22:if(i=o.memoizedState!==null||$a,!i){n=n!==null&&n.memoizedState!==null||It,h=$a;var m=It;$a=i,(It=n)&&!m?Ta(e,o,(o.subtreeFlags&8772)!==0):Da(e,o),$a=h,It=m}break;case 30:break;default:Da(e,o)}}function qf(e){var n=e.alternate;n!==null&&(e.alternate=null,qf(n)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(n=e.stateNode,n!==null&&an(n)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var Ft=null,Sn=!1;function Na(e,n,o){for(o=o.child;o!==null;)Rf(e,n,o),o=o.sibling}function Rf(e,n,o){if(Xt&&typeof Xt.onCommitFiberUnmount=="function")try{Xt.onCommitFiberUnmount(cn,o)}catch{}switch(o.tag){case 26:It||la(o,n),Na(e,n,o),o.memoizedState?o.memoizedState.count--:o.stateNode&&(o=o.stateNode,o.parentNode.removeChild(o));break;case 27:It||la(o,n);var i=Ft,h=Sn;ns(o.type)&&(Ft=o.stateNode,Sn=!1),Na(e,n,o),xi(o.stateNode),Ft=i,Sn=h;break;case 5:It||la(o,n);case 6:if(i=Ft,h=Sn,Ft=null,Na(e,n,o),Ft=i,Sn=h,Ft!==null)if(Sn)try{(Ft.nodeType===9?Ft.body:Ft.nodeName==="HTML"?Ft.ownerDocument.body:Ft).removeChild(o.stateNode)}catch(m){_t(o,n,m)}else try{Ft.removeChild(o.stateNode)}catch(m){_t(o,n,m)}break;case 18:Ft!==null&&(Sn?(e=Ft,Dm(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,o.stateNode),$o(e)):Dm(Ft,o.stateNode));break;case 4:i=Ft,h=Sn,Ft=o.stateNode.containerInfo,Sn=!0,Na(e,n,o),Ft=i,Sn=h;break;case 0:case 11:case 14:case 15:Qa(2,o,n),It||Qa(4,o,n),Na(e,n,o);break;case 1:It||(la(o,n),i=o.stateNode,typeof i.componentWillUnmount=="function"&&Tf(o,n,i)),Na(e,n,o);break;case 21:Na(e,n,o);break;case 22:It=(i=It)||o.memoizedState!==null,Na(e,n,o),It=i;break;default:Na(e,n,o)}}function zf(e,n){if(n.memoizedState===null&&(e=n.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{$o(e)}catch(o){_t(n,n.return,o)}}}function Ff(e,n){if(n.memoizedState===null&&(e=n.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{$o(e)}catch(o){_t(n,n.return,o)}}function bb(e){switch(e.tag){case 31:case 13:case 19:var n=e.stateNode;return n===null&&(n=e.stateNode=new Bf),n;case 22:return e=e.stateNode,n=e._retryCache,n===null&&(n=e._retryCache=new Bf),n;default:throw Error(d(435,e.tag))}}function Br(e,n){var o=bb(e);n.forEach(function(i){if(!o.has(i)){o.add(i);var h=$b.bind(null,e,i);i.then(h,h)}})}function $n(e,n){var o=n.deletions;if(o!==null)for(var i=0;i<o.length;i++){var h=o[i],m=e,y=n,E=y;e:for(;E!==null;){switch(E.tag){case 27:if(ns(E.type)){Ft=E.stateNode,Sn=!1;break e}break;case 5:Ft=E.stateNode,Sn=!1;break e;case 3:case 4:Ft=E.stateNode.containerInfo,Sn=!0;break e}E=E.return}if(Ft===null)throw Error(d(160));Rf(m,y,h),Ft=null,Sn=!1,m=h.alternate,m!==null&&(m.return=null),h.return=null}if(n.subtreeFlags&13886)for(n=n.child;n!==null;)Lf(n,e),n=n.sibling}var na=null;function Lf(e,n){var o=e.alternate,i=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:$n(n,e),Nn(e),i&4&&(Qa(3,e,e.return),ui(3,e),Qa(5,e,e.return));break;case 1:$n(n,e),Nn(e),i&512&&(It||o===null||la(o,o.return)),i&64&&$a&&(e=e.updateQueue,e!==null&&(i=e.callbacks,i!==null&&(o=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=o===null?i:o.concat(i))));break;case 26:var h=na;if($n(n,e),Nn(e),i&512&&(It||o===null||la(o,o.return)),i&4){var m=o!==null?o.memoizedState:null;if(i=e.memoizedState,o===null)if(i===null)if(e.stateNode===null){e:{i=e.type,o=e.memoizedProps,h=h.ownerDocument||h;t:switch(i){case"title":m=h.getElementsByTagName("title")[0],(!m||m[Bt]||m[le]||m.namespaceURI==="http://www.w3.org/2000/svg"||m.hasAttribute("itemprop"))&&(m=h.createElement(i),h.head.insertBefore(m,h.querySelector("head > title"))),yn(m,i,o),m[le]=e,un(m),i=m;break e;case"link":var y=Lm("link","href",h).get(i+(o.href||""));if(y){for(var E=0;E<y.length;E++)if(m=y[E],m.getAttribute("href")===(o.href==null||o.href===""?null:o.href)&&m.getAttribute("rel")===(o.rel==null?null:o.rel)&&m.getAttribute("title")===(o.title==null?null:o.title)&&m.getAttribute("crossorigin")===(o.crossOrigin==null?null:o.crossOrigin)){y.splice(E,1);break t}}m=h.createElement(i),yn(m,i,o),h.head.appendChild(m);break;case"meta":if(y=Lm("meta","content",h).get(i+(o.content||""))){for(E=0;E<y.length;E++)if(m=y[E],m.getAttribute("content")===(o.content==null?null:""+o.content)&&m.getAttribute("name")===(o.name==null?null:o.name)&&m.getAttribute("property")===(o.property==null?null:o.property)&&m.getAttribute("http-equiv")===(o.httpEquiv==null?null:o.httpEquiv)&&m.getAttribute("charset")===(o.charSet==null?null:o.charSet)){y.splice(E,1);break t}}m=h.createElement(i),yn(m,i,o),h.head.appendChild(m);break;default:throw Error(d(468,i))}m[le]=e,un(m),i=m}e.stateNode=i}else Hm(h,e.type,e.stateNode);else e.stateNode=Fm(h,i,e.memoizedProps);else m!==i?(m===null?o.stateNode!==null&&(o=o.stateNode,o.parentNode.removeChild(o)):m.count--,i===null?Hm(h,e.type,e.stateNode):Fm(h,i,e.memoizedProps)):i===null&&e.stateNode!==null&&_u(e,e.memoizedProps,o.memoizedProps)}break;case 27:$n(n,e),Nn(e),i&512&&(It||o===null||la(o,o.return)),o!==null&&i&4&&_u(e,e.memoizedProps,o.memoizedProps);break;case 5:if($n(n,e),Nn(e),i&512&&(It||o===null||la(o,o.return)),e.flags&32){h=e.stateNode;try{Qs(h,"")}catch(Ue){_t(e,e.return,Ue)}}i&4&&e.stateNode!=null&&(h=e.memoizedProps,_u(e,h,o!==null?o.memoizedProps:h)),i&1024&&(Nu=!0);break;case 6:if($n(n,e),Nn(e),i&4){if(e.stateNode===null)throw Error(d(162));i=e.memoizedProps,o=e.stateNode;try{o.nodeValue=i}catch(Ue){_t(e,e.return,Ue)}}break;case 3:if(Zr=null,h=na,na=Jr(n.containerInfo),$n(n,e),na=h,Nn(e),i&4&&o!==null&&o.memoizedState.isDehydrated)try{$o(n.containerInfo)}catch(Ue){_t(e,e.return,Ue)}Nu&&(Nu=!1,Hf(e));break;case 4:i=na,na=Jr(e.stateNode.containerInfo),$n(n,e),Nn(e),na=i;break;case 12:$n(n,e),Nn(e);break;case 31:$n(n,e),Nn(e),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,Br(e,i)));break;case 13:$n(n,e),Nn(e),e.child.flags&8192&&e.memoizedState!==null!=(o!==null&&o.memoizedState!==null)&&(qr=Le()),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,Br(e,i)));break;case 22:h=e.memoizedState!==null;var J=o!==null&&o.memoizedState!==null,ue=$a,ve=It;if($a=ue||h,It=ve||J,$n(n,e),It=ve,$a=ue,Nn(e),i&8192)e:for(n=e.stateNode,n._visibility=h?n._visibility&-2:n._visibility|1,h&&(o===null||J||$a||It||Ms(e)),o=null,n=e;;){if(n.tag===5||n.tag===26){if(o===null){J=o=n;try{if(m=J.stateNode,h)y=m.style,typeof y.setProperty=="function"?y.setProperty("display","none","important"):y.display="none";else{E=J.stateNode;var Se=J.memoizedProps.style,he=Se!=null&&Se.hasOwnProperty("display")?Se.display:null;E.style.display=he==null||typeof he=="boolean"?"":(""+he).trim()}}catch(Ue){_t(J,J.return,Ue)}}}else if(n.tag===6){if(o===null){J=n;try{J.stateNode.nodeValue=h?"":J.memoizedProps}catch(Ue){_t(J,J.return,Ue)}}}else if(n.tag===18){if(o===null){J=n;try{var ge=J.stateNode;h?Tm(ge,!0):Tm(J.stateNode,!1)}catch(Ue){_t(J,J.return,Ue)}}}else if((n.tag!==22&&n.tag!==23||n.memoizedState===null||n===e)&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break e;for(;n.sibling===null;){if(n.return===null||n.return===e)break e;o===n&&(o=null),n=n.return}o===n&&(o=null),n.sibling.return=n.return,n=n.sibling}i&4&&(i=e.updateQueue,i!==null&&(o=i.retryQueue,o!==null&&(i.retryQueue=null,Br(e,o))));break;case 19:$n(n,e),Nn(e),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,Br(e,i)));break;case 30:break;case 21:break;default:$n(n,e),Nn(e)}}function Nn(e){var n=e.flags;if(n&2){try{for(var o,i=e.return;i!==null;){if(Of(i)){o=i;break}i=i.return}if(o==null)throw Error(d(160));switch(o.tag){case 27:var h=o.stateNode,m=Su(e);Mr(e,m,h);break;case 5:var y=o.stateNode;o.flags&32&&(Qs(y,""),o.flags&=-33);var E=Su(e);Mr(e,E,y);break;case 3:case 4:var J=o.stateNode.containerInfo,ue=Su(e);$u(e,ue,J);break;default:throw Error(d(161))}}catch(ve){_t(e,e.return,ve)}e.flags&=-3}n&4096&&(e.flags&=-4097)}function Hf(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var n=e;Hf(n),n.tag===5&&n.flags&1024&&n.stateNode.reset(),e=e.sibling}}function Da(e,n){if(n.subtreeFlags&8772)for(n=n.child;n!==null;)jf(e,n.alternate,n),n=n.sibling}function Ms(e){for(e=e.child;e!==null;){var n=e;switch(n.tag){case 0:case 11:case 14:case 15:Qa(4,n,n.return),Ms(n);break;case 1:la(n,n.return);var o=n.stateNode;typeof o.componentWillUnmount=="function"&&Tf(n,n.return,o),Ms(n);break;case 27:xi(n.stateNode);case 26:case 5:la(n,n.return),Ms(n);break;case 22:n.memoizedState===null&&Ms(n);break;case 30:Ms(n);break;default:Ms(n)}e=e.sibling}}function Ta(e,n,o){for(o=o&&(n.subtreeFlags&8772)!==0,n=n.child;n!==null;){var i=n.alternate,h=e,m=n,y=m.flags;switch(m.tag){case 0:case 11:case 15:Ta(h,m,o),ui(4,m);break;case 1:if(Ta(h,m,o),i=m,h=i.stateNode,typeof h.componentDidMount=="function")try{h.componentDidMount()}catch(ue){_t(i,i.return,ue)}if(i=m,h=i.updateQueue,h!==null){var E=i.stateNode;try{var J=h.shared.hiddenCallbacks;if(J!==null)for(h.shared.hiddenCallbacks=null,h=0;h<J.length;h++)yh(J[h],E)}catch(ue){_t(i,i.return,ue)}}o&&y&64&&Df(m),di(m,m.return);break;case 27:Mf(m);case 26:case 5:Ta(h,m,o),o&&i===null&&y&4&&Cf(m),di(m,m.return);break;case 12:Ta(h,m,o);break;case 31:Ta(h,m,o),o&&y&4&&zf(h,m);break;case 13:Ta(h,m,o),o&&y&4&&Ff(h,m);break;case 22:m.memoizedState===null&&Ta(h,m,o),di(m,m.return);break;case 30:break;default:Ta(h,m,o)}n=n.sibling}}function Du(e,n){var o=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(o=e.memoizedState.cachePool.pool),e=null,n.memoizedState!==null&&n.memoizedState.cachePool!==null&&(e=n.memoizedState.cachePool.pool),e!==o&&(e!=null&&e.refCount++,o!=null&&Ko(o))}function Tu(e,n){e=null,n.alternate!==null&&(e=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==e&&(n.refCount++,e!=null&&Ko(e))}function aa(e,n,o,i){if(n.subtreeFlags&10256)for(n=n.child;n!==null;)Pf(e,n,o,i),n=n.sibling}function Pf(e,n,o,i){var h=n.flags;switch(n.tag){case 0:case 11:case 15:aa(e,n,o,i),h&2048&&ui(9,n);break;case 1:aa(e,n,o,i);break;case 3:aa(e,n,o,i),h&2048&&(e=null,n.alternate!==null&&(e=n.alternate.memoizedState.cache),n=n.memoizedState.cache,n!==e&&(n.refCount++,e!=null&&Ko(e)));break;case 12:if(h&2048){aa(e,n,o,i),e=n.stateNode;try{var m=n.memoizedProps,y=m.id,E=m.onPostCommit;typeof E=="function"&&E(y,n.alternate===null?"mount":"update",e.passiveEffectDuration,-0)}catch(J){_t(n,n.return,J)}}else aa(e,n,o,i);break;case 31:aa(e,n,o,i);break;case 13:aa(e,n,o,i);break;case 23:break;case 22:m=n.stateNode,y=n.alternate,n.memoizedState!==null?m._visibility&2?aa(e,n,o,i):pi(e,n):m._visibility&2?aa(e,n,o,i):(m._visibility|=2,go(e,n,o,i,(n.subtreeFlags&10256)!==0||!1)),h&2048&&Du(y,n);break;case 24:aa(e,n,o,i),h&2048&&Tu(n.alternate,n);break;default:aa(e,n,o,i)}}function go(e,n,o,i,h){for(h=h&&((n.subtreeFlags&10256)!==0||!1),n=n.child;n!==null;){var m=e,y=n,E=o,J=i,ue=y.flags;switch(y.tag){case 0:case 11:case 15:go(m,y,E,J,h),ui(8,y);break;case 23:break;case 22:var ve=y.stateNode;y.memoizedState!==null?ve._visibility&2?go(m,y,E,J,h):pi(m,y):(ve._visibility|=2,go(m,y,E,J,h)),h&&ue&2048&&Du(y.alternate,y);break;case 24:go(m,y,E,J,h),h&&ue&2048&&Tu(y.alternate,y);break;default:go(m,y,E,J,h)}n=n.sibling}}function pi(e,n){if(n.subtreeFlags&10256)for(n=n.child;n!==null;){var o=e,i=n,h=i.flags;switch(i.tag){case 22:pi(o,i),h&2048&&Du(i.alternate,i);break;case 24:pi(o,i),h&2048&&Tu(i.alternate,i);break;default:pi(o,i)}n=n.sibling}}var hi=8192;function yo(e,n,o){if(e.subtreeFlags&hi)for(e=e.child;e!==null;)Uf(e,n,o),e=e.sibling}function Uf(e,n,o){switch(e.tag){case 26:yo(e,n,o),e.flags&hi&&e.memoizedState!==null&&sv(o,na,e.memoizedState,e.memoizedProps);break;case 5:yo(e,n,o);break;case 3:case 4:var i=na;na=Jr(e.stateNode.containerInfo),yo(e,n,o),na=i;break;case 22:e.memoizedState===null&&(i=e.alternate,i!==null&&i.memoizedState!==null?(i=hi,hi=16777216,yo(e,n,o),hi=i):yo(e,n,o));break;default:yo(e,n,o)}}function Gf(e){var n=e.alternate;if(n!==null&&(e=n.child,e!==null)){n.child=null;do n=e.sibling,e.sibling=null,e=n;while(e!==null)}}function fi(e){var n=e.deletions;if((e.flags&16)!==0){if(n!==null)for(var o=0;o<n.length;o++){var i=n[o];dn=i,Vf(i,e)}Gf(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Yf(e),e=e.sibling}function Yf(e){switch(e.tag){case 0:case 11:case 15:fi(e),e.flags&2048&&Qa(9,e,e.return);break;case 3:fi(e);break;case 12:fi(e);break;case 22:var n=e.stateNode;e.memoizedState!==null&&n._visibility&2&&(e.return===null||e.return.tag!==13)?(n._visibility&=-3,jr(e)):fi(e);break;default:fi(e)}}function jr(e){var n=e.deletions;if((e.flags&16)!==0){if(n!==null)for(var o=0;o<n.length;o++){var i=n[o];dn=i,Vf(i,e)}Gf(e)}for(e=e.child;e!==null;){switch(n=e,n.tag){case 0:case 11:case 15:Qa(8,n,n.return),jr(n);break;case 22:o=n.stateNode,o._visibility&2&&(o._visibility&=-3,jr(n));break;default:jr(n)}e=e.sibling}}function Vf(e,n){for(;dn!==null;){var o=dn;switch(o.tag){case 0:case 11:case 15:Qa(8,o,n);break;case 23:case 22:if(o.memoizedState!==null&&o.memoizedState.cachePool!==null){var i=o.memoizedState.cachePool.pool;i!=null&&i.refCount++}break;case 24:Ko(o.memoizedState.cache)}if(i=o.child,i!==null)i.return=o,dn=i;else e:for(o=e;dn!==null;){i=dn;var h=i.sibling,m=i.return;if(qf(i),i===o){dn=null;break e}if(h!==null){h.return=m,dn=h;break e}dn=m}}}var vb={getCacheForType:function(e){var n=mn(Zt),o=n.data.get(e);return o===void 0&&(o=e(),n.data.set(e,o)),o},cacheSignal:function(){return mn(Zt).controller.signal}},xb=typeof WeakMap=="function"?WeakMap:Map,vt=0,Ct=null,ct=null,ht=0,At=0,jn=null,Za=!1,bo=!1,Cu=!1,Ca=0,Gt=0,Ka=0,Bs=0,Ou=0,qn=0,vo=0,mi=null,Dn=null,Mu=!1,qr=0,Xf=0,Rr=1/0,zr=null,Wa=null,sn=0,Ia=null,xo=null,Oa=0,Bu=0,ju=null,Jf=null,gi=0,qu=null;function Rn(){return(vt&2)!==0&&ht!==0?ht&-ht:C.T!==null?Pu():q()}function Qf(){if(qn===0)if((ht&536870912)===0||mt){var e=Ve;Ve<<=1,(Ve&3932160)===0&&(Ve=262144),qn=e}else qn=536870912;return e=Mn.current,e!==null&&(e.flags|=32),qn}function Tn(e,n,o){(e===Ct&&(At===2||At===9)||e.cancelPendingCommit!==null)&&(wo(e,0),es(e,ht,qn,!1)),ea(e,o),((vt&2)===0||e!==Ct)&&(e===Ct&&((vt&2)===0&&(Bs|=o),Gt===4&&es(e,ht,qn,!1)),ca(e))}function Zf(e,n,o){if((vt&6)!==0)throw Error(d(327));var i=!o&&(n&127)===0&&(n&e.expiredLanes)===0||zt(e,n),h=i?Eb(e,n):zu(e,n,!0),m=i;do{if(h===0){bo&&!i&&es(e,n,0,!1);break}else{if(o=e.current.alternate,m&&!wb(o)){h=zu(e,n,!1),m=!1;continue}if(h===2){if(m=n,e.errorRecoveryDisabledLanes&m)var y=0;else y=e.pendingLanes&-536870913,y=y!==0?y:y&536870912?536870912:0;if(y!==0){n=y;e:{var E=e;h=mi;var J=E.current.memoizedState.isDehydrated;if(J&&(wo(E,y).flags|=256),y=zu(E,y,!1),y!==2){if(Cu&&!J){E.errorRecoveryDisabledLanes|=m,Bs|=m,h=4;break e}m=Dn,Dn=h,m!==null&&(Dn===null?Dn=m:Dn.push.apply(Dn,m))}h=y}if(m=!1,h!==2)continue}}if(h===1){wo(e,0),es(e,n,0,!0);break}e:{switch(i=e,m=h,m){case 0:case 1:throw Error(d(345));case 4:if((n&4194048)!==n)break;case 6:es(i,n,qn,!Za);break e;case 2:Dn=null;break;case 3:case 5:break;default:throw Error(d(329))}if((n&62914560)===n&&(h=qr+300-Le(),10<h)){if(es(i,n,qn,!Za),bt(i,0,!0)!==0)break e;Oa=n,i.timeoutHandle=$m(Kf.bind(null,i,o,Dn,zr,Mu,n,qn,Bs,vo,Za,m,"Throttled",-0,0),h);break e}Kf(i,o,Dn,zr,Mu,n,qn,Bs,vo,Za,m,null,-0,0)}}break}while(!0);ca(e)}function Kf(e,n,o,i,h,m,y,E,J,ue,ve,Se,he,ge){if(e.timeoutHandle=-1,Se=n.subtreeFlags,Se&8192||(Se&16785408)===16785408){Se={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:ya},Uf(n,m,Se);var Ue=(m&62914560)===m?qr-Le():(m&4194048)===m?Xf-Le():0;if(Ue=ov(Se,Ue),Ue!==null){Oa=m,e.cancelPendingCommit=Ue(om.bind(null,e,n,m,o,i,h,y,E,J,ve,Se,null,he,ge)),es(e,m,y,!ue);return}}om(e,n,m,o,i,h,y,E,J)}function wb(e){for(var n=e;;){var o=n.tag;if((o===0||o===11||o===15)&&n.flags&16384&&(o=n.updateQueue,o!==null&&(o=o.stores,o!==null)))for(var i=0;i<o.length;i++){var h=o[i],m=h.getSnapshot;h=h.value;try{if(!Cn(m(),h))return!1}catch{return!1}}if(o=n.child,n.subtreeFlags&16384&&o!==null)o.return=n,n=o;else{if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return!0;n=n.return}n.sibling.return=n.return,n=n.sibling}}return!0}function es(e,n,o,i){n&=~Ou,n&=~Bs,e.suspendedLanes|=n,e.pingedLanes&=~n,i&&(e.warmLanes|=n),i=e.expirationTimes;for(var h=n;0<h;){var m=31-hn(h),y=1<<m;i[m]=-1,h&=~y}o!==0&&Vi(e,o,n)}function Fr(){return(vt&6)===0?(yi(0),!1):!0}function Ru(){if(ct!==null){if(At===0)var e=ct.return;else e=ct,wa=_s=null,Ic(e),uo=null,Io=0,e=ct;for(;e!==null;)Nf(e.alternate,e),e=e.return;ct=null}}function wo(e,n){var o=e.timeoutHandle;o!==-1&&(e.timeoutHandle=-1,Hb(o)),o=e.cancelPendingCommit,o!==null&&(e.cancelPendingCommit=null,o()),Oa=0,Ru(),Ct=e,ct=o=va(e.current,null),ht=n,At=0,jn=null,Za=!1,bo=zt(e,n),Cu=!1,vo=qn=Ou=Bs=Ka=Gt=0,Dn=mi=null,Mu=!1,(n&8)!==0&&(n|=n&32);var i=e.entangledLanes;if(i!==0)for(e=e.entanglements,i&=n;0<i;){var h=31-hn(i),m=1<<h;n|=e[h],i&=~m}return Ca=n,ir(),o}function Wf(e,n){at=null,C.H=ri,n===co||n===fr?(n=hh(),At=3):n===Hc?(n=hh(),At=4):At=n===mu?8:n!==null&&typeof n=="object"&&typeof n.then=="function"?6:1,jn=n,ct===null&&(Gt=1,Nr(e,Vn(n,e.current)))}function If(){var e=Mn.current;return e===null?!0:(ht&4194048)===ht?Zn===null:(ht&62914560)===ht||(ht&536870912)!==0?e===Zn:!1}function em(){var e=C.H;return C.H=ri,e===null?ri:e}function tm(){var e=C.A;return C.A=vb,e}function Lr(){Gt=4,Za||(ht&4194048)!==ht&&Mn.current!==null||(bo=!0),(Ka&134217727)===0&&(Bs&134217727)===0||Ct===null||es(Ct,ht,qn,!1)}function zu(e,n,o){var i=vt;vt|=2;var h=em(),m=tm();(Ct!==e||ht!==n)&&(zr=null,wo(e,n)),n=!1;var y=Gt;e:do try{if(At!==0&&ct!==null){var E=ct,J=jn;switch(At){case 8:Ru(),y=6;break e;case 3:case 2:case 9:case 6:Mn.current===null&&(n=!0);var ue=At;if(At=0,jn=null,ko(e,E,J,ue),o&&bo){y=0;break e}break;default:ue=At,At=0,jn=null,ko(e,E,J,ue)}}kb(),y=Gt;break}catch(ve){Wf(e,ve)}while(!0);return n&&e.shellSuspendCounter++,wa=_s=null,vt=i,C.H=h,C.A=m,ct===null&&(Ct=null,ht=0,ir()),y}function kb(){for(;ct!==null;)nm(ct)}function Eb(e,n){var o=vt;vt|=2;var i=em(),h=tm();Ct!==e||ht!==n?(zr=null,Rr=Le()+500,wo(e,n)):bo=zt(e,n);e:do try{if(At!==0&&ct!==null){n=ct;var m=jn;t:switch(At){case 1:At=0,jn=null,ko(e,n,m,1);break;case 2:case 9:if(dh(m)){At=0,jn=null,am(n);break}n=function(){At!==2&&At!==9||Ct!==e||(At=7),ca(e)},m.then(n,n);break e;case 3:At=7;break e;case 4:At=5;break e;case 7:dh(m)?(At=0,jn=null,am(n)):(At=0,jn=null,ko(e,n,m,7));break;case 5:var y=null;switch(ct.tag){case 26:y=ct.memoizedState;case 5:case 27:var E=ct;if(y?Pm(y):E.stateNode.complete){At=0,jn=null;var J=E.sibling;if(J!==null)ct=J;else{var ue=E.return;ue!==null?(ct=ue,Hr(ue)):ct=null}break t}}At=0,jn=null,ko(e,n,m,5);break;case 6:At=0,jn=null,ko(e,n,m,6);break;case 8:Ru(),Gt=6;break e;default:throw Error(d(462))}}Ab();break}catch(ve){Wf(e,ve)}while(!0);return wa=_s=null,C.H=i,C.A=h,vt=o,ct!==null?0:(Ct=null,ht=0,ir(),Gt)}function Ab(){for(;ct!==null&&!Te();)nm(ct)}function nm(e){var n=Sf(e.alternate,e,Ca);e.memoizedProps=e.pendingProps,n===null?Hr(e):ct=n}function am(e){var n=e,o=n.alternate;switch(n.tag){case 15:case 0:n=xf(o,n,n.pendingProps,n.type,void 0,ht);break;case 11:n=xf(o,n,n.pendingProps,n.type.render,n.ref,ht);break;case 5:Ic(n);default:Nf(o,n),n=ct=eh(n,Ca),n=Sf(o,n,Ca)}e.memoizedProps=e.pendingProps,n===null?Hr(e):ct=n}function ko(e,n,o,i){wa=_s=null,Ic(n),uo=null,Io=0;var h=n.return;try{if(pb(e,h,n,o,ht)){Gt=1,Nr(e,Vn(o,e.current)),ct=null;return}}catch(m){if(h!==null)throw ct=h,m;Gt=1,Nr(e,Vn(o,e.current)),ct=null;return}n.flags&32768?(mt||i===1?e=!0:bo||(ht&536870912)!==0?e=!1:(Za=e=!0,(i===2||i===9||i===3||i===6)&&(i=Mn.current,i!==null&&i.tag===13&&(i.flags|=16384))),sm(n,e)):Hr(n)}function Hr(e){var n=e;do{if((n.flags&32768)!==0){sm(n,Za);return}e=n.return;var o=mb(n.alternate,n,Ca);if(o!==null){ct=o;return}if(n=n.sibling,n!==null){ct=n;return}ct=n=e}while(n!==null);Gt===0&&(Gt=5)}function sm(e,n){do{var o=gb(e.alternate,e);if(o!==null){o.flags&=32767,ct=o;return}if(o=e.return,o!==null&&(o.flags|=32768,o.subtreeFlags=0,o.deletions=null),!n&&(e=e.sibling,e!==null)){ct=e;return}ct=e=o}while(e!==null);Gt=6,ct=null}function om(e,n,o,i,h,m,y,E,J){e.cancelPendingCommit=null;do Pr();while(sn!==0);if((vt&6)!==0)throw Error(d(327));if(n!==null){if(n===e.current)throw Error(d(177));if(m=n.lanes|n.childLanes,m|=Sc,ys(e,o,m,y,E,J),e===Ct&&(ct=Ct=null,ht=0),xo=n,Ia=e,Oa=o,Bu=m,ju=h,Jf=i,(n.subtreeFlags&10256)!==0||(n.flags&10256)!==0?(e.callbackNode=null,e.callbackPriority=0,Nb(lt,function(){return um(),null})):(e.callbackNode=null,e.callbackPriority=0),i=(n.flags&13878)!==0,(n.subtreeFlags&13878)!==0||i){i=C.T,C.T=null,h=$.p,$.p=2,y=vt,vt|=4;try{yb(e,n,o)}finally{vt=y,$.p=h,C.T=i}}sn=1,im(),rm(),lm()}}function im(){if(sn===1){sn=0;var e=Ia,n=xo,o=(n.flags&13878)!==0;if((n.subtreeFlags&13878)!==0||o){o=C.T,C.T=null;var i=$.p;$.p=2;var h=vt;vt|=4;try{Lf(n,e);var m=Zu,y=Yp(e.containerInfo),E=m.focusedElem,J=m.selectionRange;if(y!==E&&E&&E.ownerDocument&&Gp(E.ownerDocument.documentElement,E)){if(J!==null&&wc(E)){var ue=J.start,ve=J.end;if(ve===void 0&&(ve=ue),"selectionStart"in E)E.selectionStart=ue,E.selectionEnd=Math.min(ve,E.value.length);else{var Se=E.ownerDocument||document,he=Se&&Se.defaultView||window;if(he.getSelection){var ge=he.getSelection(),Ue=E.textContent.length,Ie=Math.min(J.start,Ue),Dt=J.end===void 0?Ie:Math.min(J.end,Ue);!ge.extend&&Ie>Dt&&(y=Dt,Dt=Ie,Ie=y);var se=Up(E,Ie),I=Up(E,Dt);if(se&&I&&(ge.rangeCount!==1||ge.anchorNode!==se.node||ge.anchorOffset!==se.offset||ge.focusNode!==I.node||ge.focusOffset!==I.offset)){var ce=Se.createRange();ce.setStart(se.node,se.offset),ge.removeAllRanges(),Ie>Dt?(ge.addRange(ce),ge.extend(I.node,I.offset)):(ce.setEnd(I.node,I.offset),ge.addRange(ce))}}}}for(Se=[],ge=E;ge=ge.parentNode;)ge.nodeType===1&&Se.push({element:ge,left:ge.scrollLeft,top:ge.scrollTop});for(typeof E.focus=="function"&&E.focus(),E=0;E<Se.length;E++){var _e=Se[E];_e.element.scrollLeft=_e.left,_e.element.scrollTop=_e.top}}el=!!Qu,Zu=Qu=null}finally{vt=h,$.p=i,C.T=o}}e.current=n,sn=2}}function rm(){if(sn===2){sn=0;var e=Ia,n=xo,o=(n.flags&8772)!==0;if((n.subtreeFlags&8772)!==0||o){o=C.T,C.T=null;var i=$.p;$.p=2;var h=vt;vt|=4;try{jf(e,n.alternate,n)}finally{vt=h,$.p=i,C.T=o}}sn=3}}function lm(){if(sn===4||sn===3){sn=0,je();var e=Ia,n=xo,o=Oa,i=Jf;(n.subtreeFlags&10256)!==0||(n.flags&10256)!==0?sn=5:(sn=0,xo=Ia=null,cm(e,e.pendingLanes));var h=e.pendingLanes;if(h===0&&(Wa=null),O(o),n=n.stateNode,Xt&&typeof Xt.onCommitFiberRoot=="function")try{Xt.onCommitFiberRoot(cn,n,void 0,(n.current.flags&128)===128)}catch{}if(i!==null){n=C.T,h=$.p,$.p=2,C.T=null;try{for(var m=e.onRecoverableError,y=0;y<i.length;y++){var E=i[y];m(E.value,{componentStack:E.stack})}}finally{C.T=n,$.p=h}}(Oa&3)!==0&&Pr(),ca(e),h=e.pendingLanes,(o&261930)!==0&&(h&42)!==0?e===qu?gi++:(gi=0,qu=e):gi=0,yi(0)}}function cm(e,n){(e.pooledCacheLanes&=n)===0&&(n=e.pooledCache,n!=null&&(e.pooledCache=null,Ko(n)))}function Pr(){return im(),rm(),lm(),um()}function um(){if(sn!==5)return!1;var e=Ia,n=Bu;Bu=0;var o=O(Oa),i=C.T,h=$.p;try{$.p=32>o?32:o,C.T=null,o=ju,ju=null;var m=Ia,y=Oa;if(sn=0,xo=Ia=null,Oa=0,(vt&6)!==0)throw Error(d(331));var E=vt;if(vt|=4,Yf(m.current),Pf(m,m.current,y,o),vt=E,yi(0,!1),Xt&&typeof Xt.onPostCommitFiberRoot=="function")try{Xt.onPostCommitFiberRoot(cn,m)}catch{}return!0}finally{$.p=h,C.T=i,cm(e,n)}}function dm(e,n,o){n=Vn(o,n),n=fu(e.stateNode,n,2),e=Va(e,n,2),e!==null&&(ea(e,2),ca(e))}function _t(e,n,o){if(e.tag===3)dm(e,e,o);else for(;n!==null;){if(n.tag===3){dm(n,e,o);break}else if(n.tag===1){var i=n.stateNode;if(typeof n.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(Wa===null||!Wa.has(i))){e=Vn(o,e),o=pf(2),i=Va(n,o,2),i!==null&&(hf(o,i,n,e),ea(i,2),ca(i));break}}n=n.return}}function Fu(e,n,o){var i=e.pingCache;if(i===null){i=e.pingCache=new xb;var h=new Set;i.set(n,h)}else h=i.get(n),h===void 0&&(h=new Set,i.set(n,h));h.has(o)||(Cu=!0,h.add(o),e=_b.bind(null,e,n,o),n.then(e,e))}function _b(e,n,o){var i=e.pingCache;i!==null&&i.delete(n),e.pingedLanes|=e.suspendedLanes&o,e.warmLanes&=~o,Ct===e&&(ht&o)===o&&(Gt===4||Gt===3&&(ht&62914560)===ht&&300>Le()-qr?(vt&2)===0&&wo(e,0):Ou|=o,vo===ht&&(vo=0)),ca(e)}function pm(e,n){n===0&&(n=Pn()),e=ks(e,n),e!==null&&(ea(e,n),ca(e))}function Sb(e){var n=e.memoizedState,o=0;n!==null&&(o=n.retryLane),pm(e,o)}function $b(e,n){var o=0;switch(e.tag){case 31:case 13:var i=e.stateNode,h=e.memoizedState;h!==null&&(o=h.retryLane);break;case 19:i=e.stateNode;break;case 22:i=e.stateNode._retryCache;break;default:throw Error(d(314))}i!==null&&i.delete(n),pm(e,o)}function Nb(e,n){return Be(e,n)}var Ur=null,Eo=null,Lu=!1,Gr=!1,Hu=!1,ts=0;function ca(e){e!==Eo&&e.next===null&&(Eo===null?Ur=Eo=e:Eo=Eo.next=e),Gr=!0,Lu||(Lu=!0,Tb())}function yi(e,n){if(!Hu&&Gr){Hu=!0;do for(var o=!1,i=Ur;i!==null;){if(e!==0){var h=i.pendingLanes;if(h===0)var m=0;else{var y=i.suspendedLanes,E=i.pingedLanes;m=(1<<31-hn(42|e)+1)-1,m&=h&~(y&~E),m=m&201326741?m&201326741|1:m?m|2:0}m!==0&&(o=!0,gm(i,m))}else m=ht,m=bt(i,i===Ct?m:0,i.cancelPendingCommit!==null||i.timeoutHandle!==-1),(m&3)===0||zt(i,m)||(o=!0,gm(i,m));i=i.next}while(o);Hu=!1}}function Db(){hm()}function hm(){Gr=Lu=!1;var e=0;ts!==0&&Lb()&&(e=ts);for(var n=Le(),o=null,i=Ur;i!==null;){var h=i.next,m=fm(i,n);m===0?(i.next=null,o===null?Ur=h:o.next=h,h===null&&(Eo=o)):(o=i,(e!==0||(m&3)!==0)&&(Gr=!0)),i=h}sn!==0&&sn!==5||yi(e),ts!==0&&(ts=0)}function fm(e,n){for(var o=e.suspendedLanes,i=e.pingedLanes,h=e.expirationTimes,m=e.pendingLanes&-62914561;0<m;){var y=31-hn(m),E=1<<y,J=h[y];J===-1?((E&o)===0||(E&i)!==0)&&(h[y]=Hn(E,n)):J<=n&&(e.expiredLanes|=E),m&=~E}if(n=Ct,o=ht,o=bt(e,e===n?o:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i=e.callbackNode,o===0||e===n&&(At===2||At===9)||e.cancelPendingCommit!==null)return i!==null&&i!==null&&De(i),e.callbackNode=null,e.callbackPriority=0;if((o&3)===0||zt(e,o)){if(n=o&-o,n===e.callbackPriority)return n;switch(i!==null&&De(i),O(o)){case 2:case 8:o=Pt;break;case 32:o=lt;break;case 268435456:o=nn;break;default:o=lt}return i=mm.bind(null,e),o=Be(o,i),e.callbackPriority=n,e.callbackNode=o,n}return i!==null&&i!==null&&De(i),e.callbackPriority=2,e.callbackNode=null,2}function mm(e,n){if(sn!==0&&sn!==5)return e.callbackNode=null,e.callbackPriority=0,null;var o=e.callbackNode;if(Pr()&&e.callbackNode!==o)return null;var i=ht;return i=bt(e,e===Ct?i:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i===0?null:(Zf(e,i,n),fm(e,Le()),e.callbackNode!=null&&e.callbackNode===o?mm.bind(null,e):null)}function gm(e,n){if(Pr())return null;Zf(e,n,!0)}function Tb(){Pb(function(){(vt&6)!==0?Be(St,Db):hm()})}function Pu(){if(ts===0){var e=ro;e===0&&(e=Ke,Ke<<=1,(Ke&261888)===0&&(Ke=256)),ts=e}return ts}function ym(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:Wi(""+e)}function bm(e,n){var o=n.ownerDocument.createElement("input");return o.name=n.name,o.value=n.value,e.id&&o.setAttribute("form",e.id),n.parentNode.insertBefore(o,n),e=new FormData(e),o.parentNode.removeChild(o),e}function Cb(e,n,o,i,h){if(n==="submit"&&o&&o.stateNode===h){var m=ym((h[Ee]||null).action),y=i.submitter;y&&(n=(n=y[Ee]||null)?ym(n.formAction):y.getAttribute("formAction"),n!==null&&(m=n,y=null));var E=new nr("action","action",null,i,h);e.push({event:E,listeners:[{instance:null,listener:function(){if(i.defaultPrevented){if(ts!==0){var J=y?bm(h,y):new FormData(h);lu(o,{pending:!0,data:J,method:h.method,action:m},null,J)}}else typeof m=="function"&&(E.preventDefault(),J=y?bm(h,y):new FormData(h),lu(o,{pending:!0,data:J,method:h.method,action:m},m,J))},currentTarget:h}]})}}for(var Uu=0;Uu<_c.length;Uu++){var Gu=_c[Uu],Ob=Gu.toLowerCase(),Mb=Gu[0].toUpperCase()+Gu.slice(1);ta(Ob,"on"+Mb)}ta(Jp,"onAnimationEnd"),ta(Qp,"onAnimationIteration"),ta(Zp,"onAnimationStart"),ta("dblclick","onDoubleClick"),ta("focusin","onFocus"),ta("focusout","onBlur"),ta(Qy,"onTransitionRun"),ta(Zy,"onTransitionStart"),ta(Ky,"onTransitionCancel"),ta(Kp,"onTransitionEnd"),Xs("onMouseEnter",["mouseout","mouseover"]),Xs("onMouseLeave",["mouseout","mouseover"]),Xs("onPointerEnter",["pointerout","pointerover"]),Xs("onPointerLeave",["pointerout","pointerover"]),bs("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),bs("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),bs("onBeforeInput",["compositionend","keypress","textInput","paste"]),bs("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),bs("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),bs("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var bi="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Bb=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(bi));function vm(e,n){n=(n&4)!==0;for(var o=0;o<e.length;o++){var i=e[o],h=i.event;i=i.listeners;e:{var m=void 0;if(n)for(var y=i.length-1;0<=y;y--){var E=i[y],J=E.instance,ue=E.currentTarget;if(E=E.listener,J!==m&&h.isPropagationStopped())break e;m=E,h.currentTarget=ue;try{m(h)}catch(ve){or(ve)}h.currentTarget=null,m=J}else for(y=0;y<i.length;y++){if(E=i[y],J=E.instance,ue=E.currentTarget,E=E.listener,J!==m&&h.isPropagationStopped())break e;m=E,h.currentTarget=ue;try{m(h)}catch(ve){or(ve)}h.currentTarget=null,m=J}}}}function ut(e,n){var o=n[Ce];o===void 0&&(o=n[Ce]=new Set);var i=e+"__bubble";o.has(i)||(xm(n,e,2,!1),o.add(i))}function Yu(e,n,o){var i=0;n&&(i|=4),xm(o,e,i,n)}var Yr="_reactListening"+Math.random().toString(36).slice(2);function Vu(e){if(!e[Yr]){e[Yr]=!0,pp.forEach(function(o){o!=="selectionchange"&&(Bb.has(o)||Yu(o,!1,e),Yu(o,!0,e))});var n=e.nodeType===9?e:e.ownerDocument;n===null||n[Yr]||(n[Yr]=!0,Yu("selectionchange",!1,n))}}function xm(e,n,o,i){switch(Qm(n)){case 2:var h=lv;break;case 8:h=cv;break;default:h=rd}o=h.bind(null,n,o,e),h=void 0,!pc||n!=="touchstart"&&n!=="touchmove"&&n!=="wheel"||(h=!0),i?h!==void 0?e.addEventListener(n,o,{capture:!0,passive:h}):e.addEventListener(n,o,!0):h!==void 0?e.addEventListener(n,o,{passive:h}):e.addEventListener(n,o,!1)}function Xu(e,n,o,i,h){var m=i;if((n&1)===0&&(n&2)===0&&i!==null)e:for(;;){if(i===null)return;var y=i.tag;if(y===3||y===4){var E=i.stateNode.containerInfo;if(E===h)break;if(y===4)for(y=i.return;y!==null;){var J=y.tag;if((J===3||J===4)&&y.stateNode.containerInfo===h)return;y=y.return}for(;E!==null;){if(y=za(E),y===null)return;if(J=y.tag,J===5||J===6||J===26||J===27){i=m=y;continue e}E=E.parentNode}}i=i.return}Ap(function(){var ue=m,ve=uc(o),Se=[];e:{var he=Wp.get(e);if(he!==void 0){var ge=nr,Ue=e;switch(e){case"keypress":if(er(o)===0)break e;case"keydown":case"keyup":ge=$y;break;case"focusin":Ue="focus",ge=gc;break;case"focusout":Ue="blur",ge=gc;break;case"beforeblur":case"afterblur":ge=gc;break;case"click":if(o.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":ge=$p;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":ge=my;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":ge=Ty;break;case Jp:case Qp:case Zp:ge=by;break;case Kp:ge=Oy;break;case"scroll":case"scrollend":ge=hy;break;case"wheel":ge=By;break;case"copy":case"cut":case"paste":ge=xy;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":ge=Dp;break;case"toggle":case"beforetoggle":ge=qy}var Ie=(n&4)!==0,Dt=!Ie&&(e==="scroll"||e==="scrollend"),se=Ie?he!==null?he+"Capture":null:he;Ie=[];for(var I=ue,ce;I!==null;){var _e=I;if(ce=_e.stateNode,_e=_e.tag,_e!==5&&_e!==26&&_e!==27||ce===null||se===null||(_e=Lo(I,se),_e!=null&&Ie.push(vi(I,_e,ce))),Dt)break;I=I.return}0<Ie.length&&(he=new ge(he,Ue,null,o,ve),Se.push({event:he,listeners:Ie}))}}if((n&7)===0){e:{if(he=e==="mouseover"||e==="pointerover",ge=e==="mouseout"||e==="pointerout",he&&o!==cc&&(Ue=o.relatedTarget||o.fromElement)&&(za(Ue)||Ue[$e]))break e;if((ge||he)&&(he=ve.window===ve?ve:(he=ve.ownerDocument)?he.defaultView||he.parentWindow:window,ge?(Ue=o.relatedTarget||o.toElement,ge=ue,Ue=Ue?za(Ue):null,Ue!==null&&(Dt=a(Ue),Ie=Ue.tag,Ue!==Dt||Ie!==5&&Ie!==27&&Ie!==6)&&(Ue=null)):(ge=null,Ue=ue),ge!==Ue)){if(Ie=$p,_e="onMouseLeave",se="onMouseEnter",I="mouse",(e==="pointerout"||e==="pointerover")&&(Ie=Dp,_e="onPointerLeave",se="onPointerEnter",I="pointer"),Dt=ge==null?he:Fo(ge),ce=Ue==null?he:Fo(Ue),he=new Ie(_e,I+"leave",ge,o,ve),he.target=Dt,he.relatedTarget=ce,_e=null,za(ve)===ue&&(Ie=new Ie(se,I+"enter",Ue,o,ve),Ie.target=ce,Ie.relatedTarget=Dt,_e=Ie),Dt=_e,ge&&Ue)t:{for(Ie=jb,se=ge,I=Ue,ce=0,_e=se;_e;_e=Ie(_e))ce++;_e=0;for(var Je=I;Je;Je=Ie(Je))_e++;for(;0<ce-_e;)se=Ie(se),ce--;for(;0<_e-ce;)I=Ie(I),_e--;for(;ce--;){if(se===I||I!==null&&se===I.alternate){Ie=se;break t}se=Ie(se),I=Ie(I)}Ie=null}else Ie=null;ge!==null&&wm(Se,he,ge,Ie,!1),Ue!==null&&Dt!==null&&wm(Se,Dt,Ue,Ie,!0)}}e:{if(he=ue?Fo(ue):window,ge=he.nodeName&&he.nodeName.toLowerCase(),ge==="select"||ge==="input"&&he.type==="file")var gt=Rp;else if(jp(he))if(zp)gt=Vy;else{gt=Gy;var Ye=Uy}else ge=he.nodeName,!ge||ge.toLowerCase()!=="input"||he.type!=="checkbox"&&he.type!=="radio"?ue&&lc(ue.elementType)&&(gt=Rp):gt=Yy;if(gt&&(gt=gt(e,ue))){qp(Se,gt,o,ve);break e}Ye&&Ye(e,he,ue),e==="focusout"&&ue&&he.type==="number"&&ue.memoizedProps.value!=null&&rc(he,"number",he.value)}switch(Ye=ue?Fo(ue):window,e){case"focusin":(jp(Ye)||Ye.contentEditable==="true")&&(Is=Ye,kc=ue,Jo=null);break;case"focusout":Jo=kc=Is=null;break;case"mousedown":Ec=!0;break;case"contextmenu":case"mouseup":case"dragend":Ec=!1,Vp(Se,o,ve);break;case"selectionchange":if(Jy)break;case"keydown":case"keyup":Vp(Se,o,ve)}var ot;if(bc)e:{switch(e){case"compositionstart":var ft="onCompositionStart";break e;case"compositionend":ft="onCompositionEnd";break e;case"compositionupdate":ft="onCompositionUpdate";break e}ft=void 0}else Ws?Mp(e,o)&&(ft="onCompositionEnd"):e==="keydown"&&o.keyCode===229&&(ft="onCompositionStart");ft&&(Tp&&o.locale!=="ko"&&(Ws||ft!=="onCompositionStart"?ft==="onCompositionEnd"&&Ws&&(ot=_p()):(Fa=ve,hc="value"in Fa?Fa.value:Fa.textContent,Ws=!0)),Ye=Vr(ue,ft),0<Ye.length&&(ft=new Np(ft,e,null,o,ve),Se.push({event:ft,listeners:Ye}),ot?ft.data=ot:(ot=Bp(o),ot!==null&&(ft.data=ot)))),(ot=zy?Fy(e,o):Ly(e,o))&&(ft=Vr(ue,"onBeforeInput"),0<ft.length&&(Ye=new Np("onBeforeInput","beforeinput",null,o,ve),Se.push({event:Ye,listeners:ft}),Ye.data=ot)),Cb(Se,e,ue,o,ve)}vm(Se,n)})}function vi(e,n,o){return{instance:e,listener:n,currentTarget:o}}function Vr(e,n){for(var o=n+"Capture",i=[];e!==null;){var h=e,m=h.stateNode;if(h=h.tag,h!==5&&h!==26&&h!==27||m===null||(h=Lo(e,o),h!=null&&i.unshift(vi(e,h,m)),h=Lo(e,n),h!=null&&i.push(vi(e,h,m))),e.tag===3)return i;e=e.return}return[]}function jb(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function wm(e,n,o,i,h){for(var m=n._reactName,y=[];o!==null&&o!==i;){var E=o,J=E.alternate,ue=E.stateNode;if(E=E.tag,J!==null&&J===i)break;E!==5&&E!==26&&E!==27||ue===null||(J=ue,h?(ue=Lo(o,m),ue!=null&&y.unshift(vi(o,ue,J))):h||(ue=Lo(o,m),ue!=null&&y.push(vi(o,ue,J)))),o=o.return}y.length!==0&&e.push({event:n,listeners:y})}var qb=/\r\n?/g,Rb=/\u0000|\uFFFD/g;function km(e){return(typeof e=="string"?e:""+e).replace(qb,`
`).replace(Rb,"")}function Em(e,n){return n=km(n),km(e)===n}function Nt(e,n,o,i,h,m){switch(o){case"children":typeof i=="string"?n==="body"||n==="textarea"&&i===""||Qs(e,i):(typeof i=="number"||typeof i=="bigint")&&n!=="body"&&Qs(e,""+i);break;case"className":Zi(e,"class",i);break;case"tabIndex":Zi(e,"tabindex",i);break;case"dir":case"role":case"viewBox":case"width":case"height":Zi(e,o,i);break;case"style":kp(e,i,m);break;case"data":if(n!=="object"){Zi(e,"data",i);break}case"src":case"href":if(i===""&&(n!=="a"||o!=="href")){e.removeAttribute(o);break}if(i==null||typeof i=="function"||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(o);break}i=Wi(""+i),e.setAttribute(o,i);break;case"action":case"formAction":if(typeof i=="function"){e.setAttribute(o,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof m=="function"&&(o==="formAction"?(n!=="input"&&Nt(e,n,"name",h.name,h,null),Nt(e,n,"formEncType",h.formEncType,h,null),Nt(e,n,"formMethod",h.formMethod,h,null),Nt(e,n,"formTarget",h.formTarget,h,null)):(Nt(e,n,"encType",h.encType,h,null),Nt(e,n,"method",h.method,h,null),Nt(e,n,"target",h.target,h,null)));if(i==null||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(o);break}i=Wi(""+i),e.setAttribute(o,i);break;case"onClick":i!=null&&(e.onclick=ya);break;case"onScroll":i!=null&&ut("scroll",e);break;case"onScrollEnd":i!=null&&ut("scrollend",e);break;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(d(61));if(o=i.__html,o!=null){if(h.children!=null)throw Error(d(60));e.innerHTML=o}}break;case"multiple":e.multiple=i&&typeof i!="function"&&typeof i!="symbol";break;case"muted":e.muted=i&&typeof i!="function"&&typeof i!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(i==null||typeof i=="function"||typeof i=="boolean"||typeof i=="symbol"){e.removeAttribute("xlink:href");break}o=Wi(""+i),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",o);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(o,""+i):e.removeAttribute(o);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":i&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(o,""):e.removeAttribute(o);break;case"capture":case"download":i===!0?e.setAttribute(o,""):i!==!1&&i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(o,i):e.removeAttribute(o);break;case"cols":case"rows":case"size":case"span":i!=null&&typeof i!="function"&&typeof i!="symbol"&&!isNaN(i)&&1<=i?e.setAttribute(o,i):e.removeAttribute(o);break;case"rowSpan":case"start":i==null||typeof i=="function"||typeof i=="symbol"||isNaN(i)?e.removeAttribute(o):e.setAttribute(o,i);break;case"popover":ut("beforetoggle",e),ut("toggle",e),Qi(e,"popover",i);break;case"xlinkActuate":ga(e,"http://www.w3.org/1999/xlink","xlink:actuate",i);break;case"xlinkArcrole":ga(e,"http://www.w3.org/1999/xlink","xlink:arcrole",i);break;case"xlinkRole":ga(e,"http://www.w3.org/1999/xlink","xlink:role",i);break;case"xlinkShow":ga(e,"http://www.w3.org/1999/xlink","xlink:show",i);break;case"xlinkTitle":ga(e,"http://www.w3.org/1999/xlink","xlink:title",i);break;case"xlinkType":ga(e,"http://www.w3.org/1999/xlink","xlink:type",i);break;case"xmlBase":ga(e,"http://www.w3.org/XML/1998/namespace","xml:base",i);break;case"xmlLang":ga(e,"http://www.w3.org/XML/1998/namespace","xml:lang",i);break;case"xmlSpace":ga(e,"http://www.w3.org/XML/1998/namespace","xml:space",i);break;case"is":Qi(e,"is",i);break;case"innerText":case"textContent":break;default:(!(2<o.length)||o[0]!=="o"&&o[0]!=="O"||o[1]!=="n"&&o[1]!=="N")&&(o=dy.get(o)||o,Qi(e,o,i))}}function Ju(e,n,o,i,h,m){switch(o){case"style":kp(e,i,m);break;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(d(61));if(o=i.__html,o!=null){if(h.children!=null)throw Error(d(60));e.innerHTML=o}}break;case"children":typeof i=="string"?Qs(e,i):(typeof i=="number"||typeof i=="bigint")&&Qs(e,""+i);break;case"onScroll":i!=null&&ut("scroll",e);break;case"onScrollEnd":i!=null&&ut("scrollend",e);break;case"onClick":i!=null&&(e.onclick=ya);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!hp.hasOwnProperty(o))e:{if(o[0]==="o"&&o[1]==="n"&&(h=o.endsWith("Capture"),n=o.slice(2,h?o.length-7:void 0),m=e[Ee]||null,m=m!=null?m[o]:null,typeof m=="function"&&e.removeEventListener(n,m,h),typeof i=="function")){typeof m!="function"&&m!==null&&(o in e?e[o]=null:e.hasAttribute(o)&&e.removeAttribute(o)),e.addEventListener(n,i,h);break e}o in e?e[o]=i:i===!0?e.setAttribute(o,""):Qi(e,o,i)}}}function yn(e,n,o){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":ut("error",e),ut("load",e);var i=!1,h=!1,m;for(m in o)if(o.hasOwnProperty(m)){var y=o[m];if(y!=null)switch(m){case"src":i=!0;break;case"srcSet":h=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(d(137,n));default:Nt(e,n,m,y,o,null)}}h&&Nt(e,n,"srcSet",o.srcSet,o,null),i&&Nt(e,n,"src",o.src,o,null);return;case"input":ut("invalid",e);var E=m=y=h=null,J=null,ue=null;for(i in o)if(o.hasOwnProperty(i)){var ve=o[i];if(ve!=null)switch(i){case"name":h=ve;break;case"type":y=ve;break;case"checked":J=ve;break;case"defaultChecked":ue=ve;break;case"value":m=ve;break;case"defaultValue":E=ve;break;case"children":case"dangerouslySetInnerHTML":if(ve!=null)throw Error(d(137,n));break;default:Nt(e,n,i,ve,o,null)}}bp(e,m,E,J,ue,y,h,!1);return;case"select":ut("invalid",e),i=y=m=null;for(h in o)if(o.hasOwnProperty(h)&&(E=o[h],E!=null))switch(h){case"value":m=E;break;case"defaultValue":y=E;break;case"multiple":i=E;default:Nt(e,n,h,E,o,null)}n=m,o=y,e.multiple=!!i,n!=null?Js(e,!!i,n,!1):o!=null&&Js(e,!!i,o,!0);return;case"textarea":ut("invalid",e),m=h=i=null;for(y in o)if(o.hasOwnProperty(y)&&(E=o[y],E!=null))switch(y){case"value":i=E;break;case"defaultValue":h=E;break;case"children":m=E;break;case"dangerouslySetInnerHTML":if(E!=null)throw Error(d(91));break;default:Nt(e,n,y,E,o,null)}xp(e,i,h,m);return;case"option":for(J in o)o.hasOwnProperty(J)&&(i=o[J],i!=null)&&(J==="selected"?e.selected=i&&typeof i!="function"&&typeof i!="symbol":Nt(e,n,J,i,o,null));return;case"dialog":ut("beforetoggle",e),ut("toggle",e),ut("cancel",e),ut("close",e);break;case"iframe":case"object":ut("load",e);break;case"video":case"audio":for(i=0;i<bi.length;i++)ut(bi[i],e);break;case"image":ut("error",e),ut("load",e);break;case"details":ut("toggle",e);break;case"embed":case"source":case"link":ut("error",e),ut("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(ue in o)if(o.hasOwnProperty(ue)&&(i=o[ue],i!=null))switch(ue){case"children":case"dangerouslySetInnerHTML":throw Error(d(137,n));default:Nt(e,n,ue,i,o,null)}return;default:if(lc(n)){for(ve in o)o.hasOwnProperty(ve)&&(i=o[ve],i!==void 0&&Ju(e,n,ve,i,o,void 0));return}}for(E in o)o.hasOwnProperty(E)&&(i=o[E],i!=null&&Nt(e,n,E,i,o,null))}function zb(e,n,o,i){switch(n){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var h=null,m=null,y=null,E=null,J=null,ue=null,ve=null;for(ge in o){var Se=o[ge];if(o.hasOwnProperty(ge)&&Se!=null)switch(ge){case"checked":break;case"value":break;case"defaultValue":J=Se;default:i.hasOwnProperty(ge)||Nt(e,n,ge,null,i,Se)}}for(var he in i){var ge=i[he];if(Se=o[he],i.hasOwnProperty(he)&&(ge!=null||Se!=null))switch(he){case"type":m=ge;break;case"name":h=ge;break;case"checked":ue=ge;break;case"defaultChecked":ve=ge;break;case"value":y=ge;break;case"defaultValue":E=ge;break;case"children":case"dangerouslySetInnerHTML":if(ge!=null)throw Error(d(137,n));break;default:ge!==Se&&Nt(e,n,he,ge,i,Se)}}ic(e,y,E,J,ue,ve,m,h);return;case"select":ge=y=E=he=null;for(m in o)if(J=o[m],o.hasOwnProperty(m)&&J!=null)switch(m){case"value":break;case"multiple":ge=J;default:i.hasOwnProperty(m)||Nt(e,n,m,null,i,J)}for(h in i)if(m=i[h],J=o[h],i.hasOwnProperty(h)&&(m!=null||J!=null))switch(h){case"value":he=m;break;case"defaultValue":E=m;break;case"multiple":y=m;default:m!==J&&Nt(e,n,h,m,i,J)}n=E,o=y,i=ge,he!=null?Js(e,!!o,he,!1):!!i!=!!o&&(n!=null?Js(e,!!o,n,!0):Js(e,!!o,o?[]:"",!1));return;case"textarea":ge=he=null;for(E in o)if(h=o[E],o.hasOwnProperty(E)&&h!=null&&!i.hasOwnProperty(E))switch(E){case"value":break;case"children":break;default:Nt(e,n,E,null,i,h)}for(y in i)if(h=i[y],m=o[y],i.hasOwnProperty(y)&&(h!=null||m!=null))switch(y){case"value":he=h;break;case"defaultValue":ge=h;break;case"children":break;case"dangerouslySetInnerHTML":if(h!=null)throw Error(d(91));break;default:h!==m&&Nt(e,n,y,h,i,m)}vp(e,he,ge);return;case"option":for(var Ue in o)he=o[Ue],o.hasOwnProperty(Ue)&&he!=null&&!i.hasOwnProperty(Ue)&&(Ue==="selected"?e.selected=!1:Nt(e,n,Ue,null,i,he));for(J in i)he=i[J],ge=o[J],i.hasOwnProperty(J)&&he!==ge&&(he!=null||ge!=null)&&(J==="selected"?e.selected=he&&typeof he!="function"&&typeof he!="symbol":Nt(e,n,J,he,i,ge));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var Ie in o)he=o[Ie],o.hasOwnProperty(Ie)&&he!=null&&!i.hasOwnProperty(Ie)&&Nt(e,n,Ie,null,i,he);for(ue in i)if(he=i[ue],ge=o[ue],i.hasOwnProperty(ue)&&he!==ge&&(he!=null||ge!=null))switch(ue){case"children":case"dangerouslySetInnerHTML":if(he!=null)throw Error(d(137,n));break;default:Nt(e,n,ue,he,i,ge)}return;default:if(lc(n)){for(var Dt in o)he=o[Dt],o.hasOwnProperty(Dt)&&he!==void 0&&!i.hasOwnProperty(Dt)&&Ju(e,n,Dt,void 0,i,he);for(ve in i)he=i[ve],ge=o[ve],!i.hasOwnProperty(ve)||he===ge||he===void 0&&ge===void 0||Ju(e,n,ve,he,i,ge);return}}for(var se in o)he=o[se],o.hasOwnProperty(se)&&he!=null&&!i.hasOwnProperty(se)&&Nt(e,n,se,null,i,he);for(Se in i)he=i[Se],ge=o[Se],!i.hasOwnProperty(Se)||he===ge||he==null&&ge==null||Nt(e,n,Se,he,i,ge)}function Am(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function Fb(){if(typeof performance.getEntriesByType=="function"){for(var e=0,n=0,o=performance.getEntriesByType("resource"),i=0;i<o.length;i++){var h=o[i],m=h.transferSize,y=h.initiatorType,E=h.duration;if(m&&E&&Am(y)){for(y=0,E=h.responseEnd,i+=1;i<o.length;i++){var J=o[i],ue=J.startTime;if(ue>E)break;var ve=J.transferSize,Se=J.initiatorType;ve&&Am(Se)&&(J=J.responseEnd,y+=ve*(J<E?1:(E-ue)/(J-ue)))}if(--i,n+=8*(m+y)/(h.duration/1e3),e++,10<e)break}}if(0<e)return n/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var Qu=null,Zu=null;function Xr(e){return e.nodeType===9?e:e.ownerDocument}function _m(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function Sm(e,n){if(e===0)switch(n){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&n==="foreignObject"?0:e}function Ku(e,n){return e==="textarea"||e==="noscript"||typeof n.children=="string"||typeof n.children=="number"||typeof n.children=="bigint"||typeof n.dangerouslySetInnerHTML=="object"&&n.dangerouslySetInnerHTML!==null&&n.dangerouslySetInnerHTML.__html!=null}var Wu=null;function Lb(){var e=window.event;return e&&e.type==="popstate"?e===Wu?!1:(Wu=e,!0):(Wu=null,!1)}var $m=typeof setTimeout=="function"?setTimeout:void 0,Hb=typeof clearTimeout=="function"?clearTimeout:void 0,Nm=typeof Promise=="function"?Promise:void 0,Pb=typeof queueMicrotask=="function"?queueMicrotask:typeof Nm<"u"?function(e){return Nm.resolve(null).then(e).catch(Ub)}:$m;function Ub(e){setTimeout(function(){throw e})}function ns(e){return e==="head"}function Dm(e,n){var o=n,i=0;do{var h=o.nextSibling;if(e.removeChild(o),h&&h.nodeType===8)if(o=h.data,o==="/$"||o==="/&"){if(i===0){e.removeChild(h),$o(n);return}i--}else if(o==="$"||o==="$?"||o==="$~"||o==="$!"||o==="&")i++;else if(o==="html")xi(e.ownerDocument.documentElement);else if(o==="head"){o=e.ownerDocument.head,xi(o);for(var m=o.firstChild;m;){var y=m.nextSibling,E=m.nodeName;m[Bt]||E==="SCRIPT"||E==="STYLE"||E==="LINK"&&m.rel.toLowerCase()==="stylesheet"||o.removeChild(m),m=y}}else o==="body"&&xi(e.ownerDocument.body);o=h}while(o);$o(n)}function Tm(e,n){var o=e;e=0;do{var i=o.nextSibling;if(o.nodeType===1?n?(o._stashedDisplay=o.style.display,o.style.display="none"):(o.style.display=o._stashedDisplay||"",o.getAttribute("style")===""&&o.removeAttribute("style")):o.nodeType===3&&(n?(o._stashedText=o.nodeValue,o.nodeValue=""):o.nodeValue=o._stashedText||""),i&&i.nodeType===8)if(o=i.data,o==="/$"){if(e===0)break;e--}else o!=="$"&&o!=="$?"&&o!=="$~"&&o!=="$!"||e++;o=i}while(o)}function Iu(e){var n=e.firstChild;for(n&&n.nodeType===10&&(n=n.nextSibling);n;){var o=n;switch(n=n.nextSibling,o.nodeName){case"HTML":case"HEAD":case"BODY":Iu(o),an(o);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(o.rel.toLowerCase()==="stylesheet")continue}e.removeChild(o)}}function Gb(e,n,o,i){for(;e.nodeType===1;){var h=o;if(e.nodeName.toLowerCase()!==n.toLowerCase()){if(!i&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(i){if(!e[Bt])switch(n){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(m=e.getAttribute("rel"),m==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(m!==h.rel||e.getAttribute("href")!==(h.href==null||h.href===""?null:h.href)||e.getAttribute("crossorigin")!==(h.crossOrigin==null?null:h.crossOrigin)||e.getAttribute("title")!==(h.title==null?null:h.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(m=e.getAttribute("src"),(m!==(h.src==null?null:h.src)||e.getAttribute("type")!==(h.type==null?null:h.type)||e.getAttribute("crossorigin")!==(h.crossOrigin==null?null:h.crossOrigin))&&m&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(n==="input"&&e.type==="hidden"){var m=h.name==null?null:""+h.name;if(h.type==="hidden"&&e.getAttribute("name")===m)return e}else return e;if(e=Kn(e.nextSibling),e===null)break}return null}function Yb(e,n,o){if(n==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!o||(e=Kn(e.nextSibling),e===null))return null;return e}function Cm(e,n){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!n||(e=Kn(e.nextSibling),e===null))return null;return e}function ed(e){return e.data==="$?"||e.data==="$~"}function td(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function Vb(e,n){var o=e.ownerDocument;if(e.data==="$~")e._reactRetry=n;else if(e.data!=="$?"||o.readyState!=="loading")n();else{var i=function(){n(),o.removeEventListener("DOMContentLoaded",i)};o.addEventListener("DOMContentLoaded",i),e._reactRetry=i}}function Kn(e){for(;e!=null;e=e.nextSibling){var n=e.nodeType;if(n===1||n===3)break;if(n===8){if(n=e.data,n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"||n==="F!"||n==="F")break;if(n==="/$"||n==="/&")return null}}return e}var nd=null;function Om(e){e=e.nextSibling;for(var n=0;e;){if(e.nodeType===8){var o=e.data;if(o==="/$"||o==="/&"){if(n===0)return Kn(e.nextSibling);n--}else o!=="$"&&o!=="$!"&&o!=="$?"&&o!=="$~"&&o!=="&"||n++}e=e.nextSibling}return null}function Mm(e){e=e.previousSibling;for(var n=0;e;){if(e.nodeType===8){var o=e.data;if(o==="$"||o==="$!"||o==="$?"||o==="$~"||o==="&"){if(n===0)return e;n--}else o!=="/$"&&o!=="/&"||n++}e=e.previousSibling}return null}function Bm(e,n,o){switch(n=Xr(o),e){case"html":if(e=n.documentElement,!e)throw Error(d(452));return e;case"head":if(e=n.head,!e)throw Error(d(453));return e;case"body":if(e=n.body,!e)throw Error(d(454));return e;default:throw Error(d(451))}}function xi(e){for(var n=e.attributes;n.length;)e.removeAttributeNode(n[0]);an(e)}var Wn=new Map,jm=new Set;function Jr(e){return typeof e.getRootNode=="function"?e.getRootNode():e.nodeType===9?e:e.ownerDocument}var Ma=$.d;$.d={f:Xb,r:Jb,D:Qb,C:Zb,L:Kb,m:Wb,X:ev,S:Ib,M:tv};function Xb(){var e=Ma.f(),n=Fr();return e||n}function Jb(e){var n=Ys(e);n!==null&&n.tag===5&&n.type==="form"?Kh(n):Ma.r(e)}var Ao=typeof document>"u"?null:document;function qm(e,n,o){var i=Ao;if(i&&typeof n=="string"&&n){var h=Gn(n);h='link[rel="'+e+'"][href="'+h+'"]',typeof o=="string"&&(h+='[crossorigin="'+o+'"]'),jm.has(h)||(jm.add(h),e={rel:e,crossOrigin:o,href:n},i.querySelector(h)===null&&(n=i.createElement("link"),yn(n,"link",e),un(n),i.head.appendChild(n)))}}function Qb(e){Ma.D(e),qm("dns-prefetch",e,null)}function Zb(e,n){Ma.C(e,n),qm("preconnect",e,n)}function Kb(e,n,o){Ma.L(e,n,o);var i=Ao;if(i&&e&&n){var h='link[rel="preload"][as="'+Gn(n)+'"]';n==="image"&&o&&o.imageSrcSet?(h+='[imagesrcset="'+Gn(o.imageSrcSet)+'"]',typeof o.imageSizes=="string"&&(h+='[imagesizes="'+Gn(o.imageSizes)+'"]')):h+='[href="'+Gn(e)+'"]';var m=h;switch(n){case"style":m=_o(e);break;case"script":m=So(e)}Wn.has(m)||(e=b({rel:"preload",href:n==="image"&&o&&o.imageSrcSet?void 0:e,as:n},o),Wn.set(m,e),i.querySelector(h)!==null||n==="style"&&i.querySelector(wi(m))||n==="script"&&i.querySelector(ki(m))||(n=i.createElement("link"),yn(n,"link",e),un(n),i.head.appendChild(n)))}}function Wb(e,n){Ma.m(e,n);var o=Ao;if(o&&e){var i=n&&typeof n.as=="string"?n.as:"script",h='link[rel="modulepreload"][as="'+Gn(i)+'"][href="'+Gn(e)+'"]',m=h;switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":m=So(e)}if(!Wn.has(m)&&(e=b({rel:"modulepreload",href:e},n),Wn.set(m,e),o.querySelector(h)===null)){switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(o.querySelector(ki(m)))return}i=o.createElement("link"),yn(i,"link",e),un(i),o.head.appendChild(i)}}}function Ib(e,n,o){Ma.S(e,n,o);var i=Ao;if(i&&e){var h=Vs(i).hoistableStyles,m=_o(e);n=n||"default";var y=h.get(m);if(!y){var E={loading:0,preload:null};if(y=i.querySelector(wi(m)))E.loading=5;else{e=b({rel:"stylesheet",href:e,"data-precedence":n},o),(o=Wn.get(m))&&ad(e,o);var J=y=i.createElement("link");un(J),yn(J,"link",e),J._p=new Promise(function(ue,ve){J.onload=ue,J.onerror=ve}),J.addEventListener("load",function(){E.loading|=1}),J.addEventListener("error",function(){E.loading|=2}),E.loading|=4,Qr(y,n,i)}y={type:"stylesheet",instance:y,count:1,state:E},h.set(m,y)}}}function ev(e,n){Ma.X(e,n);var o=Ao;if(o&&e){var i=Vs(o).hoistableScripts,h=So(e),m=i.get(h);m||(m=o.querySelector(ki(h)),m||(e=b({src:e,async:!0},n),(n=Wn.get(h))&&sd(e,n),m=o.createElement("script"),un(m),yn(m,"link",e),o.head.appendChild(m)),m={type:"script",instance:m,count:1,state:null},i.set(h,m))}}function tv(e,n){Ma.M(e,n);var o=Ao;if(o&&e){var i=Vs(o).hoistableScripts,h=So(e),m=i.get(h);m||(m=o.querySelector(ki(h)),m||(e=b({src:e,async:!0,type:"module"},n),(n=Wn.get(h))&&sd(e,n),m=o.createElement("script"),un(m),yn(m,"link",e),o.head.appendChild(m)),m={type:"script",instance:m,count:1,state:null},i.set(h,m))}}function Rm(e,n,o,i){var h=(h=ke.current)?Jr(h):null;if(!h)throw Error(d(446));switch(e){case"meta":case"title":return null;case"style":return typeof o.precedence=="string"&&typeof o.href=="string"?(n=_o(o.href),o=Vs(h).hoistableStyles,i=o.get(n),i||(i={type:"style",instance:null,count:0,state:null},o.set(n,i)),i):{type:"void",instance:null,count:0,state:null};case"link":if(o.rel==="stylesheet"&&typeof o.href=="string"&&typeof o.precedence=="string"){e=_o(o.href);var m=Vs(h).hoistableStyles,y=m.get(e);if(y||(h=h.ownerDocument||h,y={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},m.set(e,y),(m=h.querySelector(wi(e)))&&!m._p&&(y.instance=m,y.state.loading=5),Wn.has(e)||(o={rel:"preload",as:"style",href:o.href,crossOrigin:o.crossOrigin,integrity:o.integrity,media:o.media,hrefLang:o.hrefLang,referrerPolicy:o.referrerPolicy},Wn.set(e,o),m||nv(h,e,o,y.state))),n&&i===null)throw Error(d(528,""));return y}if(n&&i!==null)throw Error(d(529,""));return null;case"script":return n=o.async,o=o.src,typeof o=="string"&&n&&typeof n!="function"&&typeof n!="symbol"?(n=So(o),o=Vs(h).hoistableScripts,i=o.get(n),i||(i={type:"script",instance:null,count:0,state:null},o.set(n,i)),i):{type:"void",instance:null,count:0,state:null};default:throw Error(d(444,e))}}function _o(e){return'href="'+Gn(e)+'"'}function wi(e){return'link[rel="stylesheet"]['+e+"]"}function zm(e){return b({},e,{"data-precedence":e.precedence,precedence:null})}function nv(e,n,o,i){e.querySelector('link[rel="preload"][as="style"]['+n+"]")?i.loading=1:(n=e.createElement("link"),i.preload=n,n.addEventListener("load",function(){return i.loading|=1}),n.addEventListener("error",function(){return i.loading|=2}),yn(n,"link",o),un(n),e.head.appendChild(n))}function So(e){return'[src="'+Gn(e)+'"]'}function ki(e){return"script[async]"+e}function Fm(e,n,o){if(n.count++,n.instance===null)switch(n.type){case"style":var i=e.querySelector('style[data-href~="'+Gn(o.href)+'"]');if(i)return n.instance=i,un(i),i;var h=b({},o,{"data-href":o.href,"data-precedence":o.precedence,href:null,precedence:null});return i=(e.ownerDocument||e).createElement("style"),un(i),yn(i,"style",h),Qr(i,o.precedence,e),n.instance=i;case"stylesheet":h=_o(o.href);var m=e.querySelector(wi(h));if(m)return n.state.loading|=4,n.instance=m,un(m),m;i=zm(o),(h=Wn.get(h))&&ad(i,h),m=(e.ownerDocument||e).createElement("link"),un(m);var y=m;return y._p=new Promise(function(E,J){y.onload=E,y.onerror=J}),yn(m,"link",i),n.state.loading|=4,Qr(m,o.precedence,e),n.instance=m;case"script":return m=So(o.src),(h=e.querySelector(ki(m)))?(n.instance=h,un(h),h):(i=o,(h=Wn.get(m))&&(i=b({},o),sd(i,h)),e=e.ownerDocument||e,h=e.createElement("script"),un(h),yn(h,"link",i),e.head.appendChild(h),n.instance=h);case"void":return null;default:throw Error(d(443,n.type))}else n.type==="stylesheet"&&(n.state.loading&4)===0&&(i=n.instance,n.state.loading|=4,Qr(i,o.precedence,e));return n.instance}function Qr(e,n,o){for(var i=o.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),h=i.length?i[i.length-1]:null,m=h,y=0;y<i.length;y++){var E=i[y];if(E.dataset.precedence===n)m=E;else if(m!==h)break}m?m.parentNode.insertBefore(e,m.nextSibling):(n=o.nodeType===9?o.head:o,n.insertBefore(e,n.firstChild))}function ad(e,n){e.crossOrigin==null&&(e.crossOrigin=n.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=n.referrerPolicy),e.title==null&&(e.title=n.title)}function sd(e,n){e.crossOrigin==null&&(e.crossOrigin=n.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=n.referrerPolicy),e.integrity==null&&(e.integrity=n.integrity)}var Zr=null;function Lm(e,n,o){if(Zr===null){var i=new Map,h=Zr=new Map;h.set(o,i)}else h=Zr,i=h.get(o),i||(i=new Map,h.set(o,i));if(i.has(e))return i;for(i.set(e,null),o=o.getElementsByTagName(e),h=0;h<o.length;h++){var m=o[h];if(!(m[Bt]||m[le]||e==="link"&&m.getAttribute("rel")==="stylesheet")&&m.namespaceURI!=="http://www.w3.org/2000/svg"){var y=m.getAttribute(n)||"";y=e+y;var E=i.get(y);E?E.push(m):i.set(y,[m])}}return i}function Hm(e,n,o){e=e.ownerDocument||e,e.head.insertBefore(o,n==="title"?e.querySelector("head > title"):null)}function av(e,n,o){if(o===1||n.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof n.precedence!="string"||typeof n.href!="string"||n.href==="")break;return!0;case"link":if(typeof n.rel!="string"||typeof n.href!="string"||n.href===""||n.onLoad||n.onError)break;return n.rel==="stylesheet"?(e=n.disabled,typeof n.precedence=="string"&&e==null):!0;case"script":if(n.async&&typeof n.async!="function"&&typeof n.async!="symbol"&&!n.onLoad&&!n.onError&&n.src&&typeof n.src=="string")return!0}return!1}function Pm(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}function sv(e,n,o,i){if(o.type==="stylesheet"&&(typeof i.media!="string"||matchMedia(i.media).matches!==!1)&&(o.state.loading&4)===0){if(o.instance===null){var h=_o(i.href),m=n.querySelector(wi(h));if(m){n=m._p,n!==null&&typeof n=="object"&&typeof n.then=="function"&&(e.count++,e=Kr.bind(e),n.then(e,e)),o.state.loading|=4,o.instance=m,un(m);return}m=n.ownerDocument||n,i=zm(i),(h=Wn.get(h))&&ad(i,h),m=m.createElement("link"),un(m);var y=m;y._p=new Promise(function(E,J){y.onload=E,y.onerror=J}),yn(m,"link",i),o.instance=m}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(o,n),(n=o.state.preload)&&(o.state.loading&3)===0&&(e.count++,o=Kr.bind(e),n.addEventListener("load",o),n.addEventListener("error",o))}}var od=0;function ov(e,n){return e.stylesheets&&e.count===0&&Ir(e,e.stylesheets),0<e.count||0<e.imgCount?function(o){var i=setTimeout(function(){if(e.stylesheets&&Ir(e,e.stylesheets),e.unsuspend){var m=e.unsuspend;e.unsuspend=null,m()}},6e4+n);0<e.imgBytes&&od===0&&(od=62500*Fb());var h=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&Ir(e,e.stylesheets),e.unsuspend)){var m=e.unsuspend;e.unsuspend=null,m()}},(e.imgBytes>od?50:800)+n);return e.unsuspend=o,function(){e.unsuspend=null,clearTimeout(i),clearTimeout(h)}}:null}function Kr(){if(this.count--,this.count===0&&(this.imgCount===0||!this.waitingForImages)){if(this.stylesheets)Ir(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var Wr=null;function Ir(e,n){e.stylesheets=null,e.unsuspend!==null&&(e.count++,Wr=new Map,n.forEach(iv,e),Wr=null,Kr.call(e))}function iv(e,n){if(!(n.state.loading&4)){var o=Wr.get(e);if(o)var i=o.get(null);else{o=new Map,Wr.set(e,o);for(var h=e.querySelectorAll("link[data-precedence],style[data-precedence]"),m=0;m<h.length;m++){var y=h[m];(y.nodeName==="LINK"||y.getAttribute("media")!=="not all")&&(o.set(y.dataset.precedence,y),i=y)}i&&o.set(null,i)}h=n.instance,y=h.getAttribute("data-precedence"),m=o.get(y)||i,m===i&&o.set(null,h),o.set(y,h),this.count++,i=Kr.bind(this),h.addEventListener("load",i),h.addEventListener("error",i),m?m.parentNode.insertBefore(h,m.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(h,e.firstChild)),n.state.loading|=4}}var Ei={$$typeof:z,Provider:null,Consumer:null,_currentValue:V,_currentValue2:V,_threadCount:0};function rv(e,n,o,i,h,m,y,E,J){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=En(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=En(0),this.hiddenUpdates=En(null),this.identifierPrefix=i,this.onUncaughtError=h,this.onCaughtError=m,this.onRecoverableError=y,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=J,this.incompleteTransitions=new Map}function Um(e,n,o,i,h,m,y,E,J,ue,ve,Se){return e=new rv(e,n,o,y,J,ue,ve,Se,E),n=1,m===!0&&(n|=24),m=On(3,null,null,n),e.current=m,m.stateNode=e,n=zc(),n.refCount++,e.pooledCache=n,n.refCount++,m.memoizedState={element:i,isDehydrated:o,cache:n},Pc(m),e}function Gm(e){return e?(e=no,e):no}function Ym(e,n,o,i,h,m){h=Gm(h),i.context===null?i.context=h:i.pendingContext=h,i=Ya(n),i.payload={element:o},m=m===void 0?null:m,m!==null&&(i.callback=m),o=Va(e,i,n),o!==null&&(Tn(o,e,n),ti(o,e,n))}function Vm(e,n){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var o=e.retryLane;e.retryLane=o!==0&&o<n?o:n}}function id(e,n){Vm(e,n),(e=e.alternate)&&Vm(e,n)}function Xm(e){if(e.tag===13||e.tag===31){var n=ks(e,67108864);n!==null&&Tn(n,e,67108864),id(e,67108864)}}function Jm(e){if(e.tag===13||e.tag===31){var n=Rn();n=zo(n);var o=ks(e,n);o!==null&&Tn(o,e,n),id(e,n)}}var el=!0;function lv(e,n,o,i){var h=C.T;C.T=null;var m=$.p;try{$.p=2,rd(e,n,o,i)}finally{$.p=m,C.T=h}}function cv(e,n,o,i){var h=C.T;C.T=null;var m=$.p;try{$.p=8,rd(e,n,o,i)}finally{$.p=m,C.T=h}}function rd(e,n,o,i){if(el){var h=ld(i);if(h===null)Xu(e,n,i,tl,o),Zm(e,i);else if(dv(h,e,n,o,i))i.stopPropagation();else if(Zm(e,i),n&4&&-1<uv.indexOf(e)){for(;h!==null;){var m=Ys(h);if(m!==null)switch(m.tag){case 3:if(m=m.stateNode,m.current.memoizedState.isDehydrated){var y=Ht(m.pendingLanes);if(y!==0){var E=m;for(E.pendingLanes|=2,E.entangledLanes|=2;y;){var J=1<<31-hn(y);E.entanglements[1]|=J,y&=~J}ca(m),(vt&6)===0&&(Rr=Le()+500,yi(0))}}break;case 31:case 13:E=ks(m,2),E!==null&&Tn(E,m,2),Fr(),id(m,2)}if(m=ld(i),m===null&&Xu(e,n,i,tl,o),m===h)break;h=m}h!==null&&i.stopPropagation()}else Xu(e,n,i,null,o)}}function ld(e){return e=uc(e),cd(e)}var tl=null;function cd(e){if(tl=null,e=za(e),e!==null){var n=a(e);if(n===null)e=null;else{var o=n.tag;if(o===13){if(e=r(n),e!==null)return e;e=null}else if(o===31){if(e=l(n),e!==null)return e;e=null}else if(o===3){if(n.stateNode.current.memoizedState.isDehydrated)return n.tag===3?n.stateNode.containerInfo:null;e=null}else n!==e&&(e=null)}}return tl=e,null}function Qm(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(st()){case St:return 2;case Pt:return 8;case lt:case Vt:return 32;case nn:return 268435456;default:return 32}default:return 32}}var ud=!1,as=null,ss=null,os=null,Ai=new Map,_i=new Map,is=[],uv="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Zm(e,n){switch(e){case"focusin":case"focusout":as=null;break;case"dragenter":case"dragleave":ss=null;break;case"mouseover":case"mouseout":os=null;break;case"pointerover":case"pointerout":Ai.delete(n.pointerId);break;case"gotpointercapture":case"lostpointercapture":_i.delete(n.pointerId)}}function Si(e,n,o,i,h,m){return e===null||e.nativeEvent!==m?(e={blockedOn:n,domEventName:o,eventSystemFlags:i,nativeEvent:m,targetContainers:[h]},n!==null&&(n=Ys(n),n!==null&&Xm(n)),e):(e.eventSystemFlags|=i,n=e.targetContainers,h!==null&&n.indexOf(h)===-1&&n.push(h),e)}function dv(e,n,o,i,h){switch(n){case"focusin":return as=Si(as,e,n,o,i,h),!0;case"dragenter":return ss=Si(ss,e,n,o,i,h),!0;case"mouseover":return os=Si(os,e,n,o,i,h),!0;case"pointerover":var m=h.pointerId;return Ai.set(m,Si(Ai.get(m)||null,e,n,o,i,h)),!0;case"gotpointercapture":return m=h.pointerId,_i.set(m,Si(_i.get(m)||null,e,n,o,i,h)),!0}return!1}function Km(e){var n=za(e.target);if(n!==null){var o=a(n);if(o!==null){if(n=o.tag,n===13){if(n=r(o),n!==null){e.blockedOn=n,ee(e.priority,function(){Jm(o)});return}}else if(n===31){if(n=l(o),n!==null){e.blockedOn=n,ee(e.priority,function(){Jm(o)});return}}else if(n===3&&o.stateNode.current.memoizedState.isDehydrated){e.blockedOn=o.tag===3?o.stateNode.containerInfo:null;return}}}e.blockedOn=null}function nl(e){if(e.blockedOn!==null)return!1;for(var n=e.targetContainers;0<n.length;){var o=ld(e.nativeEvent);if(o===null){o=e.nativeEvent;var i=new o.constructor(o.type,o);cc=i,o.target.dispatchEvent(i),cc=null}else return n=Ys(o),n!==null&&Xm(n),e.blockedOn=o,!1;n.shift()}return!0}function Wm(e,n,o){nl(e)&&o.delete(n)}function pv(){ud=!1,as!==null&&nl(as)&&(as=null),ss!==null&&nl(ss)&&(ss=null),os!==null&&nl(os)&&(os=null),Ai.forEach(Wm),_i.forEach(Wm)}function al(e,n){e.blockedOn===n&&(e.blockedOn=null,ud||(ud=!0,t.unstable_scheduleCallback(t.unstable_NormalPriority,pv)))}var sl=null;function Im(e){sl!==e&&(sl=e,t.unstable_scheduleCallback(t.unstable_NormalPriority,function(){sl===e&&(sl=null);for(var n=0;n<e.length;n+=3){var o=e[n],i=e[n+1],h=e[n+2];if(typeof i!="function"){if(cd(i||o)===null)continue;break}var m=Ys(o);m!==null&&(e.splice(n,3),n-=3,lu(m,{pending:!0,data:h,method:o.method,action:i},i,h))}}))}function $o(e){function n(J){return al(J,e)}as!==null&&al(as,e),ss!==null&&al(ss,e),os!==null&&al(os,e),Ai.forEach(n),_i.forEach(n);for(var o=0;o<is.length;o++){var i=is[o];i.blockedOn===e&&(i.blockedOn=null)}for(;0<is.length&&(o=is[0],o.blockedOn===null);)Km(o),o.blockedOn===null&&is.shift();if(o=(e.ownerDocument||e).$$reactFormReplay,o!=null)for(i=0;i<o.length;i+=3){var h=o[i],m=o[i+1],y=h[Ee]||null;if(typeof m=="function")y||Im(o);else if(y){var E=null;if(m&&m.hasAttribute("formAction")){if(h=m,y=m[Ee]||null)E=y.formAction;else if(cd(h)!==null)continue}else E=y.action;typeof E=="function"?o[i+1]=E:(o.splice(i,3),i-=3),Im(o)}}}function e0(){function e(m){m.canIntercept&&m.info==="react-transition"&&m.intercept({handler:function(){return new Promise(function(y){return h=y})},focusReset:"manual",scroll:"manual"})}function n(){h!==null&&(h(),h=null),i||setTimeout(o,20)}function o(){if(!i&&!navigation.transition){var m=navigation.currentEntry;m&&m.url!=null&&navigation.navigate(m.url,{state:m.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var i=!1,h=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",n),navigation.addEventListener("navigateerror",n),setTimeout(o,100),function(){i=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",n),navigation.removeEventListener("navigateerror",n),h!==null&&(h(),h=null)}}}function dd(e){this._internalRoot=e}ol.prototype.render=dd.prototype.render=function(e){var n=this._internalRoot;if(n===null)throw Error(d(409));var o=n.current,i=Rn();Ym(o,i,e,n,null,null)},ol.prototype.unmount=dd.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var n=e.containerInfo;Ym(e.current,2,null,e,null,null),Fr(),n[$e]=null}};function ol(e){this._internalRoot=e}ol.prototype.unstable_scheduleHydration=function(e){if(e){var n=q();e={blockedOn:null,target:e,priority:n};for(var o=0;o<is.length&&n!==0&&n<is[o].priority;o++);is.splice(o,0,e),o===0&&Km(e)}};var t0=s.version;if(t0!=="19.2.7")throw Error(d(527,t0,"19.2.7"));$.findDOMNode=function(e){var n=e._reactInternals;if(n===void 0)throw typeof e.render=="function"?Error(d(188)):(e=Object.keys(e).join(","),Error(d(268,e)));return e=u(n),e=e!==null?g(e):null,e=e===null?null:e.stateNode,e};var hv={bundleType:0,version:"19.2.7",rendererPackageName:"react-dom",currentDispatcherRef:C,reconcilerVersion:"19.2.7"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var il=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!il.isDisabled&&il.supportsFiber)try{cn=il.inject(hv),Xt=il}catch{}}return Di.createRoot=function(e,n){if(!p(e))throw Error(d(299));var o=!1,i="",h=lf,m=cf,y=uf;return n!=null&&(n.unstable_strictMode===!0&&(o=!0),n.identifierPrefix!==void 0&&(i=n.identifierPrefix),n.onUncaughtError!==void 0&&(h=n.onUncaughtError),n.onCaughtError!==void 0&&(m=n.onCaughtError),n.onRecoverableError!==void 0&&(y=n.onRecoverableError)),n=Um(e,1,!1,null,null,o,i,null,h,m,y,e0),e[$e]=n.current,Vu(e),new dd(n)},Di.hydrateRoot=function(e,n,o){if(!p(e))throw Error(d(299));var i=!1,h="",m=lf,y=cf,E=uf,J=null;return o!=null&&(o.unstable_strictMode===!0&&(i=!0),o.identifierPrefix!==void 0&&(h=o.identifierPrefix),o.onUncaughtError!==void 0&&(m=o.onUncaughtError),o.onCaughtError!==void 0&&(y=o.onCaughtError),o.onRecoverableError!==void 0&&(E=o.onRecoverableError),o.formState!==void 0&&(J=o.formState)),n=Um(e,1,!0,n,o??null,i,h,J,m,y,E,e0),n.context=Gm(null),o=n.current,i=Rn(),i=zo(i),h=Ya(i),h.callback=null,Va(o,h,i),o=i,n.current.lanes=o,ea(n,o),ca(n),e[$e]=n.current,Vu(e),new ol(n)},Di.version="19.2.7",Di}var L0;function T3(){if(L0)return Ed.exports;L0=1;function t(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(t)}catch(s){console.error(s)}}return t(),Ed.exports=D3(),Ed.exports}var C3=T3();const O3=`// API の往復の見本。行きの線と戻りの線を引き、戻りの線の名前は線の下に置く
sequence 注文の一覧を取る

box ブラウザ as 利用者のブラウザ [note: 一覧の画面を開く, color: slate, icon: globe]
box API as API サーバー [note: 注文の一覧を返す, color: blue, icon: server]
box DB as 注文の DB [note: 注文を持つ, color: violet, icon: db]

step 一覧を頼む
  say 利用者が注文の画面を開くと、ブラウザが API サーバーに注文の一覧を頼む。
  ブラウザ -> API: GET /orders

step 注文を読む
  say API サーバーが、その利用者の注文を DB から読む。
  API -> DB: SELECT orders

step 行が返る
  say DB が当てはまる行を返す。戻りの線の名前は線の下に置き、行きの線の名前と見分ける。
  DB -> API: 12 行 [side: below]

step 一覧を返す
  say API サーバーが行を JSON にして、ブラウザに 200 OK で返す。
  API -> ブラウザ: 200 OK [side: below]
`,M3=`// API round trip example. Draw the request and the reply, and put the reply labels under the line
sequence Fetch the order list

box browser as User's browser [note: opens the order screen, color: slate, icon: globe]
box api as API server [note: returns the order list, color: blue, icon: server]
box db as Order DB [note: holds the orders, color: violet, icon: db]

step Ask for the list
  say The user opens the order screen, and the browser asks the API server for the order list.
  browser -> api: GET /orders

step Read the orders
  say The API server reads that user's orders from the DB.
  api -> db: SELECT orders

step Rows come back
  say The DB returns the matching rows. The reply label sits under the line so it reads apart from the request label.
  db -> api: 12 rows [side: below]

step Return the list
  say The API server turns the rows into JSON and returns them to the browser with 200 OK.
  api -> browser: 200 OK [side: below]
`,B3=`// Ethereum で送ったトランザクションが、ビルダーの入札を経てブロックに入り、投票されるまで。
// 列の 1 つが 1 人の持ち物で、チップ 1 枚が 1 件のトランザクション。自分の分は色の付いたチップで追う。
// ビルダーは順序を替えて封をし、提案者は金額だけを見て選び、中身を見ずに署名する。
lineup 入札でブロックの中身が決まるまで

box メモリプール
box ビルダーA
box ビルダーB [color: amber]
box ビルダーC
box バリデーター [color: green]

item 自分 [color: amber]
item 取引1, 取引2, 取引3, 取引4, 取引5, 取引6, 取引7
item 裏1, 裏2 [color: blue]
item 票1, 票2, 票3, 票4, 票5, 票6, 票7, 票8, 票9, 票10, 票11, 票12 [color: green, label: ✓]

step トランザクションが列に並ぶ
  say 送ったトランザクションはメモリプールに入り、ほかの人の分と一緒に待つ。
  line メモリプール: 取引1, 取引2, 自分, 取引3, 取引4, 取引5, 取引6, 取引7

step ビルダーが順序を決めて入札する
  say ビルダーは順序を並べ替え、メモリプールに無い取引も足してブロックを組み、金額を付ける。
  line ビルダーA: 取引1, 取引2, 自分, 取引3, 取引4, 取引5, 取引6, 取引7
  line ビルダーB: 裏1, 裏2, 取引3, 自分, 取引1, 取引2, 取引4, 取引5
  line ビルダーC: 取引1, 取引2, 取引3, 取引4, 取引5, 取引6, 取引7
  note ビルダーA: 0.05 ETH
  note ビルダーB: 0.12 ETH
  note ビルダーC: 0.08 ETH

step リレーが封をして中身を隠す
  say リレーは中身を預かって隠す。提案者が中身を盗めないようにするため。
  seal ビルダーA
  seal ビルダーB
  seal ビルダーC

step 提案者に金額だけを見せる
  say 提案者に届くのは金額だけで、最も高いビルダーBを選ぶ。
  pick ビルダーB

step 提案者が中身を見ずに署名する
  say 提案者は中身を見ないまま、ブロックの頭に署名する。
  stamp ビルダーB: 署名済み

step 封を開けて全文を公開する
  say 署名を受けたリレーが全文を公開する。負けた列の中身は公開されない。
  open ビルダーB

step バリデーターが投票する
  say バリデーターが実行し直して確かめ、正しければ投票する。
  line バリデーター: 票1, 票2, 票3, 票4, 票5, 票6, 票7, 票8, 票9, 票10, 票11, 票12
`,j3=`// How a transaction sent on Ethereum gets into a block through builder bids and is voted on.
// Each lane belongs to one party and each chip is one transaction. Your own transaction is the coloured chip.
// Builders reorder and seal their lanes, and the proposer picks by price alone and signs without seeing the contents.
lineup How an auction decides what goes in a block

box Mempool
box BuilderA as Builder A
box BuilderB as Builder B [color: amber]
box BuilderC as Builder C
box Validators [color: green]

item mine [color: amber]
item t1, t2, t3, t4, t5, t6, t7
item private1, private2 [color: blue]
item v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12 [color: green, label: ✓]

step Transactions line up
  say A transaction you send enters the mempool and waits with everyone else's.
  line Mempool: t1, t2, mine, t3, t4, t5, t6, t7

step Builders pick an order and bid
  say Builders reorder the transactions, add private ones the mempool never saw, and name a price.
  line BuilderA: t1, t2, mine, t3, t4, t5, t6, t7
  line BuilderB: private1, private2, t3, mine, t1, t2, t4, t5
  line BuilderC: t1, t2, t3, t4, t5, t6, t7
  note BuilderA: 0.05 ETH
  note BuilderB: 0.12 ETH
  note BuilderC: 0.08 ETH

step The relay seals the contents
  say The relay holds the contents and hides them, so the proposer cannot steal them.
  seal BuilderA
  seal BuilderB
  seal BuilderC

step The proposer sees only the price
  say Only the price reaches the proposer, who picks the highest bid, Builder B.
  pick BuilderB

step The proposer signs without looking
  say The proposer signs the block header without seeing the contents.
  stamp BuilderB: Signed

step The seal opens and the block is published
  say With the signature in hand, the relay publishes the full block. The losing lanes stay hidden.
  open BuilderB

step Validators vote
  say Validators re-execute the block and vote for it if it is correct.
  line Validators: v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12
`,q3=`// Chainlink CCIP でメッセージとトークンが送信元チェーンから送信先チェーンへ届くまで
architecture Chainlink CCIP でトークンを別のチェーンへ送る

group 送信元 as 送信元チェーン [note: 例 Ethereum, color: blue, icon: chain]
  box 送るアプリ as 送る側のアプリ [note: メッセージを作る, icon: app]
  box 送信元Router as Router [note: ただ 1 つの入口, icon: router]
  box OnRamp [note: 確かめて送り出す, icon: on]
  box 送信元Pool as Token Pool [note: 預かるか焼く, icon: pool]
  box ブロック [note: 送信元チェーンの記録, icon: block]
end

group 網 as Chainlink ネットワーク [note: DON, color: amber, icon: net]
  box Verifier as Committee Verifier [note: 署名を集めて証明を作る, icon: sign]
  box Indexer [note: 証明を置く, icon: idx]
  box Executor [note: 実行を頼む, icon: exe]
end

group 送信先 as 送信先チェーン [note: 例 Arbitrum, color: green, icon: chain]
  box OffRamp [note: 確かめて実行する, icon: off]
  box 送信先Router as Router [note: ただ 1 つの入口, icon: router]
  box 送信先Pool as Token Pool [note: 解放するか発行, icon: pool]
  box 受けるアプリ as 受け取る側のアプリ [note: 受け取って処理する, icon: app]
end

strip メッセージ: ID, 宛先, 受け取る側, データ, トークン, 署名, 状態

step 送る
  say 送る側のアプリがメッセージを作り、Router の ccipSend() を呼ぶ。メッセージには受け取る側、データ、送るトークンを入れ、手数料を LINK かそのチェーンの通貨で払う。
  code ccipSend(宛先チェーン, メッセージ)
  set ID: まだ無い
  set 宛先: Arbitrum
  set 受け取る側: 0x7a1c…3f
  set データ: 注文 #42
  set トークン: 100 USDC
  送るアプリ -> 送信元Router: ccipSend() [side: below]

step 受け付ける
  say Router が宛先に合った OnRamp へ渡す。Router はアプリから見たただ 1 つの入口で、どのチェーンでも同じ形をしている。
  送信元Router -> OnRamp

step 中身を確かめる
  say OnRamp がトークンの数、ガスの上限、データの長さを確かめ、宛先が緊急停止されていないことも確かめる。通ったメッセージの ID が決まる。
  act OnRamp: 中身を確かめる
  set ID: 0x9f3c…a1

step トークンを預ける
  say OnRamp が Token Pool の lockOrBurn() を呼ぶ。トークンは預かられるか焼かれ、送信元チェーンから出ていく。一度に送れる量の上限もここで効く。
  code lockOrBurn()
  OnRamp -> 送信元Pool: lockOrBurn() [carry: coin, side: below]
  note 送信元Pool: −100 USDC

step 出来事を残す
  say OnRamp が CCIPMessageSent を出し、メッセージは送信元チェーンのブロックに記録される。
  code CCIPMessageSent
  OnRamp -> ブロック: CCIPMessageSent [side: left]

step 確定を待つ
  say 既定では、そのブロックが確定するまで先へ進まない。チェーンごとの確定の条件を満たし、巻き戻らない状態になってから検証に入る。
  act ブロック: 確定を待つ

step 検証して署名する
  say Committee Verifier (Chainlink の DON) の各ノードが、送信元チェーンの記録とメッセージが合っているかを確かめて署名する。定足数の署名がそろうと、そのメッセージの証明になる。
  ブロック -> Verifier
  act Verifier: 署名を集める
  set 署名 [tag: 証明]

step 証明を置く
  say 証明はメッセージの ID に結び付けて Indexer に置かれ、誰でも取り出せる。
  code VerifierResult
  Verifier -> Indexer: VerifierResult [tag: 証明, side: above]
  note Indexer: 証明を置いた

step 証明をそろえる
  say Executor がメッセージと、送信先が求める全ての証明を Indexer から集め、送信先チェーンへ運ぶ。
  Indexer -> Executor

step 実行を頼む
  say Executor が送信先チェーンの OffRamp の execute() を呼ぶ。この呼び出しは誰でもでき、Executor は代わりに打っているだけ。
  code OffRamp.execute()
  Executor -> OffRamp: execute() [side: right]
  set 状態: UNTOUCHED

step 証明を確かめる
  say OffRamp が各 CCV に証明を確かめさせる。求められた CCV が 1 つでも通らなければ実行しない。
  act OffRamp: 証明を確かめる
  note OffRamp: CCV で確かめる
  set 署名 [tag: 検証済]

step トークンを渡す
  say OffRamp が Token Pool の releaseOrMint() を呼ぶ。トークンは解放されるか新しく発行され、受け取る側へ直接渡る。
  code releaseOrMint()
  note OffRamp: 確かめて実行する
  OffRamp -> 送信先Pool: releaseOrMint() [carry: none, side: above]
  note 送信先Pool: 100 USDC を発行
  送信先Pool -> 受けるアプリ [carry: coin]
  note 受けるアプリ: +100 USDC

step 届ける
  say OffRamp が Router を通して受け取る側の ccipReceive() を呼ぶ。最後まで通ると、メッセージは SUCCESS として記録される。
  code ccipReceive()
  OffRamp -> 送信先Router
  送信先Router -> 受けるアプリ
  note 受けるアプリ: ccipReceive()
  set 状態: SUCCESS
  note 受けるアプリ: 注文 #42 と 100 USDC
  note OffRamp: SUCCESS を記録
`,R3=`// How a message and tokens travel from the source chain to the destination chain with Chainlink CCIP
architecture Send tokens to another chain with Chainlink CCIP

group src as Source chain [note: e.g. Ethereum, color: blue, icon: chain]
  box senderApp as Sending app [note: builds the message, icon: app]
  box srcRouter as Router [note: the single entry, icon: router]
  box OnRamp [note: checks and sends out, icon: on]
  box srcPool as Token Pool [note: locks or burns, icon: pool]
  box block as Block [note: source chain record, icon: block]
end

group net as Chainlink network [note: DON, color: amber, icon: net]
  box Verifier as Committee Verifier [note: signs and builds a proof, icon: sign]
  box Indexer [note: stores proofs, icon: idx]
  box Executor [note: requests execution, icon: exe]
end

group dst as Destination chain [note: e.g. Arbitrum, color: green, icon: chain]
  box OffRamp [note: checks and executes, icon: off]
  box dstRouter as Router [note: the single entry, icon: router]
  box dstPool as Token Pool [note: releases or mints, icon: pool]
  box receiverApp as Receiving app [note: receives and handles, icon: app]
end

strip Message: ID, destination, receiver, data, tokens, signatures, status

step Send
  say The sending app builds a message and calls the Router's ccipSend(). The message holds the receiver, the data and the tokens to send, and the fee is paid in LINK or the chain's own currency.
  code ccipSend(destination chain, message)
  set ID: not yet
  set destination: Arbitrum
  set receiver: 0x7a1c…3f
  set data: order #42
  set tokens: 100 USDC
  senderApp -> srcRouter: ccipSend() [side: below]

step Accept
  say The Router hands the message to the OnRamp for the destination. The Router is the app's single entry and has the same shape on every chain.
  srcRouter -> OnRamp

step Check the contents
  say The OnRamp checks the token amount, the gas limit and the data length, and that the destination is not under an emergency stop. A message that passes gets its ID.
  act OnRamp: check the contents
  set ID: 0x9f3c…a1

step Deposit the tokens
  say The OnRamp calls the Token Pool's lockOrBurn(). The tokens are locked or burned and leave the source chain. The limit on how much can be sent at once also applies here.
  code lockOrBurn()
  OnRamp -> srcPool: lockOrBurn() [carry: coin, side: below]
  note srcPool: −100 USDC

step Record the event
  say The OnRamp emits CCIPMessageSent, and the message is recorded in a block on the source chain.
  code CCIPMessageSent
  OnRamp -> block: CCIPMessageSent [side: left]

step Wait for finality
  say By default nothing moves on until that block is final. Verification starts once the chain's finality rule is met and the block can no longer roll back.
  act block: wait for finality

step Verify and sign
  say Each node of the Committee Verifier (Chainlink's DON) checks that the message matches the source chain record and signs it. Once a quorum of signatures is in, they form the message's proof.
  block -> Verifier
  act Verifier: collect signatures
  set signatures [tag: proof]

step Store the proof
  say The proof is stored in the Indexer under the message ID, where anyone can fetch it.
  code VerifierResult
  Verifier -> Indexer: VerifierResult [tag: proof, side: above]
  note Indexer: stored the proof

step Gather the proofs
  say The Executor gathers the message and every proof the destination asks for from the Indexer and carries them to the destination chain.
  Indexer -> Executor

step Request execution
  say The Executor calls execute() on the destination chain's OffRamp. Anyone may make this call, and the Executor only makes it on someone's behalf.
  code OffRamp.execute()
  Executor -> OffRamp: execute() [side: right]
  set status: UNTOUCHED

step Check the proofs
  say The OffRamp has each CCV check the proofs. If any required CCV fails, it does not execute.
  act OffRamp: check the proofs
  note OffRamp: checked by CCVs
  set signatures [tag: verified]

step Hand over the tokens
  say The OffRamp calls the Token Pool's releaseOrMint(). The tokens are released or newly minted and go straight to the receiver.
  code releaseOrMint()
  note OffRamp: checks and executes
  OffRamp -> dstPool: releaseOrMint() [carry: none, side: above]
  note dstPool: minted 100 USDC
  dstPool -> receiverApp [carry: coin]
  note receiverApp: +100 USDC

step Deliver
  say The OffRamp calls the receiver's ccipReceive() through the Router. When it all goes through, the message is recorded as SUCCESS.
  code ccipReceive()
  OffRamp -> dstRouter
  dstRouter -> receiverApp
  note receiverApp: ccipReceive()
  set status: SUCCESS
  note receiverApp: order #42 and 100 USDC
  note OffRamp: recorded SUCCESS
`,z3=`// Ethereum でブロックが出てから確定して戻せなくなるまで。
// 上の帯が最初の 4 slot の拡大、下が 3 epoch 分 (96 slot) の時間軸で、細い棒 1 本が 1 slot (12 秒)。
// 全体を止めたまま針を進め、checkpoint が提案、正当化、確定と進む様子を下の帯と一緒に追う。
time Ethereum のブロックが確定して戻せなくなるまで

scale slot 12s 96 [from: 3200]
period epoch 32 [from: 100]
row ブロック [color: blue, empty: 3 13 45 79]
row 票 [color: amber]
point C100 at 0
point C101 at 32
point C102 at 64
zoom 0-3

box 提案者 [color: blue, icon: user]
box ブロック [color: blue, icon: box]
box 委員会 [note: 全体の 1/32, color: amber]

strip 確定の進み: 経過, C100, C101, C102, 今の epoch の票 [meter: 2/3]

step ブロックを出す
  say 時間は 12 秒ごとの slot に区切られる。slot ごとに validator から 1 人が提案者に選ばれ、ブロックを 1 つ出す。
  提案者 -> ブロック [at: 0]
  set 経過: 0 秒

step 委員会が投票する
  say 各 validator は 1 epoch に 1 回、割り当てられた slot で投票 (attestation) する。票は先頭のブロックと checkpoint を指す。
  code attestation = { head, source, target }
  委員会 -> ブロック [tag: 票, at: 0]
  now -> 0
  set 経過: 12 秒
  set 今の epoch の票: 3%

step 空く slot もある
  say 提案者が応答しないと、その slot はブロックの無いまま過ぎる。チェーンは止まらず、その slot の票は 1 つ前のブロックを指す。
  提案者 -> ブロック [at: 1]
  委員会 -> ブロック [tag: 票, at: 1]
  提案者 -> ブロック [at: 2]
  委員会 -> ブロック [tag: 票, at: 2]
  委員会 -> ブロック [tag: 票, at: 3, into: 2]
  now -> 3
  set 経過: 48 秒
  set 今の epoch の票: 12%

step checkpoint を決める
  say 32 slot (6.4 分) で 1 epoch。epoch の最初の slot のブロックが、その epoch の checkpoint になる。ここでは C100 と呼ぶ。
  note C100: 提案済み [color: blue]
  span 0-31: 32 slot = 6.4 分 [color: slate]
  set C100: 提案済み

step 票が積み上がる
  say epoch の間に全 validator が 1 回ずつ投票するので、C100 への票は slot ごとに積み上がる。票の重さは持っている stake で量る。
  now -> 31
  set 経過: 6 分 24 秒
  set 今の epoch の票: 97%

step 正当化する
  say epoch の終わりの集計で、C100 への票が全体の stake の 2/3 を超えていれば、C100 は正当化 (justified) される。
  note C100: 正当化 [color: violet]
  set C100: 正当化

step 次の epoch も同じ
  say 次の epoch では C101 へ票が集まる。票は直前に正当化された C100 を起点 (source)、C101 を目標 (target) として数える。
  code source C100 → target C101
  note C101: 提案済み [color: blue]
  now -> 63
  set 経過: 12 分 48 秒
  set 今の epoch の票: 97%
  set C101: 提案済み

step 前の checkpoint が確定する
  say C101 も正当化されると、続けて正当化された 2 つのうち前の C100 が確定 (finalized) する。C100 の提案から約 2 epoch、12.8 分。
  C100 -> C101: 2/3 を超えた [carry: none]
  note C101: 正当化 [color: violet]
  note C100: 確定 [color: green]
  mark ブロック 0 [color: green]
  span 0-63: C100 の提案から確定まで 約 12.8 分 [color: green]
  set C101: 正当化
  set C100: 確定

step 確定が 1 epoch ずつ進む
  say 以後は epoch ごとに同じことが起き、C102 の正当化で C101 までのブロックが確定する。確定した範囲は 1 epoch ずつ伸びる。
  note C102: 提案済み [color: blue]
  now -> 95
  C101 -> C102: 2/3 を超えた [carry: none]
  note C102: 正当化 [color: violet]
  note C101: 確定 [color: green]
  mark ブロック 1-32 [color: green]
  set 経過: 19 分 12 秒
  set 今の epoch の票: 97%
  set C101: 確定
  set C102: 正当化

step 確定したら戻せない
  say 確定したブロックを戻すには、全体の stake の 1/3 以上を持つ validator が矛盾した票を出し、罰 (slashing) を受けなければならない。
  span 0-32: 確定して戻せない [shape: box, color: rose]
`,F3=`// How an Ethereum block becomes final and cannot be reverted.
// The top band zooms into the first 4 slots, and the bottom is a timeline of 3 epochs (96 slots), one thin bar per slot (12 seconds).
// The whole view stays still while the needle moves, and the strip follows the checkpoints from proposed to justified to finalized.
time How an Ethereum block becomes final

scale slot 12s 96 [from: 3200]
period epoch 32 [from: 100]
row block [color: blue, empty: 3 13 45 79]
row vote [color: amber]
point C100 at 0
point C101 at 32
point C102 at 64
zoom 0-3

box proposer [color: blue, icon: user]
box block [color: blue, icon: box]
box committee [note: 1/32 of all, color: amber]

strip Finality: Elapsed, C100, C101, C102, Votes this epoch [meter: 2/3]

step Propose a block
  say Time is cut into 12-second slots. In each slot one validator is chosen as the proposer and puts out one block.
  proposer -> block [at: 0]
  set Elapsed: 0 s

step The committee votes
  say Each validator votes (attests) once per epoch, in its assigned slot. A vote points at the head block and at a checkpoint.
  code attestation = { head, source, target }
  committee -> block [tag: vote, at: 0]
  now -> 0
  set Elapsed: 12 s
  set Votes this epoch: 3%

step Some slots stay empty
  say When the proposer does not respond, the slot passes without a block. The chain does not stop, and the votes of that slot point at the block before it.
  proposer -> block [at: 1]
  committee -> block [tag: vote, at: 1]
  proposer -> block [at: 2]
  committee -> block [tag: vote, at: 2]
  committee -> block [tag: vote, at: 3, into: 2]
  now -> 3
  set Elapsed: 48 s
  set Votes this epoch: 12%

step Pick the checkpoint
  say 32 slots (6.4 minutes) make one epoch. The block in the first slot of an epoch becomes its checkpoint, called C100 here.
  note C100: Proposed [color: blue]
  span 0-31: 32 slots = 6.4 min [color: slate]
  set C100: Proposed

step Votes pile up
  say Every validator votes once during the epoch, so the votes for C100 pile up slot by slot. A vote weighs as much as the stake behind it.
  now -> 31
  set Elapsed: 6 min 24 s
  set Votes this epoch: 97%

step Justify
  say At the end of the epoch, if the votes for C100 pass 2/3 of all stake, C100 is justified.
  note C100: Justified [color: violet]
  set C100: Justified

step The next epoch does the same
  say In the next epoch the votes gather on C101. They count from C100, the last justified checkpoint (source), to C101 (target).
  code source C100 → target C101
  note C101: Proposed [color: blue]
  now -> 63
  set Elapsed: 12 min 48 s
  set Votes this epoch: 97%
  set C101: Proposed

step The earlier checkpoint is finalized
  say When C101 is justified too, the earlier of the two justified checkpoints in a row, C100, is finalized. About 2 epochs, 12.8 minutes, after C100 was proposed.
  C100 -> C101: passed 2/3 [carry: none]
  note C101: Justified [color: violet]
  note C100: Final [color: green]
  mark block 0 [color: green]
  span 0-63: From C100 proposed to final, about 12.8 min [color: green]
  set C101: Justified
  set C100: Final

step Finality moves one epoch at a time
  say The same happens every epoch after that. Justifying C102 finalizes the blocks up to C101, so the final range grows one epoch at a time.
  note C102: Proposed [color: blue]
  now -> 95
  C101 -> C102: passed 2/3 [carry: none]
  note C102: Justified [color: violet]
  note C101: Final [color: green]
  mark block 1-32 [color: green]
  set Elapsed: 19 min 12 s
  set Votes this epoch: 97%
  set C101: Final
  set C102: Justified

step Final cannot be reverted
  say Reverting a final block needs validators holding at least 1/3 of all stake to cast conflicting votes and be punished (slashed).
  span 0-32: Final and cannot be reverted [shape: box, color: rose]
`,L3=`// 入門の見本。箱 2 つと線 1 本で、記法の形を見る
sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する, color: slate, icon: globe]
box アプリ [note: ログインを頼む側, color: blue, icon: app]

step ログインを押す
  say 利用者がアプリのログインを押す。アプリは本人の確認を認可サーバーに任せる。
  ブラウザ -> アプリ: GET /login
`,H3=`// Starter example. Two boxes and one line show the shape of the notation
sequence Ask to sign in

box browser as User's browser [note: operated by the user, color: slate, icon: globe]
box app as App [note: asks for sign-in, color: blue, icon: app]

step Press sign in
  say The user presses the app's sign-in button. The app leaves identity checks to the authorization server.
  browser -> app: GET /login
`,P3=`// 直しの枝 fix と作業の枝 feature を、merge commit で main へ取り込むまで。
// 上の帯が main、その下に fix と feature。merge commit は取り込む先の先端と取り込む枝の先端の 2 つを親に持つ。
// 取り込む先の札だけが merge commit へ進み、取り込んだ枝の札は元の commit に残る。
git 2 本の枝を merge commit で main へ取り込む

branch main [note: 取り込む先]
branch fix [note: 直しの枝]
branch feature [note: 作業の枝]

strip 参照: main, fix, feature

step main にある
  say main に commit A と B がある。main は B を指し、HEAD は main を指している。
  commit A on main [hash: 3fa0c19, note: 最初の形]
  commit B on main [hash: 8b04f71, note: 一覧を足す]
  set main: B 8b04f71

step 枝を 2 本切る
  say B から直しの枝 fix と作業の枝 feature を切る。どちらも B を指し、HEAD は後から切った feature を指す。
  code git branch fix → git switch -c feature
  fix from B
  feature from B
  set fix: B 8b04f71
  set feature: B 8b04f71

step 直しを積む
  say fix に誤字の直し F を積む。fix は F へ進み、feature と main は B のまま。
  commit F on fix [hash: 5b2e7a1, note: 誤字を直す]
  set fix: F 5b2e7a1

step 作業を積む
  say feature に C と D を積む。commit のたびに feature が新しい commit へ進む。
  code git commit
  commit C on feature [hash: c41d0e5, note: 価格を丸める]
  commit D on feature [hash: d72b9a3, note: 送料を足す]
  set feature: D d72b9a3

step 直しを取り込む
  say main で fix を取り込むと、merge commit の M1 ができる。M1 の親は main の先端の B と fix の先端の F の 2 つで、main だけが M1 へ進む。
  code git switch main → git merge fix
  commit M1 on main merge fix [hash: 9a1c3e4, note: fix を取り込む]
  set main: M1 9a1c3e4

step 作業を取り込む
  say 続けて feature を取り込むと、M1 と D を親に持つ M2 ができる。fix と feature の札は元の commit に残る。
  code git merge feature
  commit M2 on main merge feature [hash: 4e8f0b2, note: feature を取り込む]
  set main: M2 4e8f0b2

step 枝の形が残る
  say merge commit は枝の commit を作り直さないので、hash は変わらず、枝分かれの形も履歴に残る。rebase で 1 本にする時との違いはここにある。
  code git log --graph --oneline
`,U3=`// Bringing the fix branch and the feature branch into main with merge commits.
// The top lane is main, with fix and feature below it. A merge commit has two parents: the tip of the target and the tip of the merged branch.
// Only the target's ref moves to the merge commit; the merged branch's ref stays on its own commit.
git Merge two branches into main with merge commits

branch main [note: Merge target]
branch fix [note: Fix branch]
branch feature [note: Work branch]

strip Refs: main, fix, feature

step On main
  say main has commits A and B. main points at B, and HEAD points at main.
  commit A on main [hash: 3fa0c19, note: First shape]
  commit B on main [hash: 8b04f71, note: Add the list]
  set main: B 8b04f71

step Cut two branches
  say Cut the fix branch fix and the work branch feature from B. Both point at B, and HEAD points at feature, the one cut last.
  code git branch fix → git switch -c feature
  fix from B
  feature from B
  set fix: B 8b04f71
  set feature: B 8b04f71

step Commit a fix
  say Add the typo fix F on fix. fix moves to F, while feature and main stay at B.
  commit F on fix [hash: 5b2e7a1, note: Fix a typo]
  set fix: F 5b2e7a1

step Commit work
  say Add C and D on feature. Each commit moves feature to the new commit.
  code git commit
  commit C on feature [hash: c41d0e5, note: Round prices]
  commit D on feature [hash: d72b9a3, note: Add shipping]
  set feature: D d72b9a3

step Merge the fix
  say Merging fix on main creates the merge commit M1. M1 has two parents, B at the tip of main and F at the tip of fix, and only main moves to M1.
  code git switch main → git merge fix
  commit M1 on main merge fix [hash: 9a1c3e4, note: Merge fix]
  set main: M1 9a1c3e4

step Merge the work
  say Merging feature next creates M2, with M1 and D as parents. The fix and feature refs stay on their own commits.
  code git merge feature
  commit M2 on main merge feature [hash: 4e8f0b2, note: Merge feature]
  set main: M2 4e8f0b2

step The branches stay
  say A merge commit does not rewrite the branch commits, so their hashes stay the same and the branching shape stays in the history. That is the difference from rebasing into one line.
  code git log --graph --oneline
`,G3=`// 8件の取引から組んだ Merkle 木で、取引3が含まれることを根まで辿って証明する。
// 前半の4段で葉から根まで組み上げ、後半の4段で取引3の値から隣の値を受けて根まで上る。
// 根は上の真ん中に、葉は下に並ぶ。値を持つ葉は箱に値を、下の札に名札を出す。
tree Merkle 木で取引を証明する

box ブロックの頭 [note: 根 e71c, color: green, icon: box]

strip 証明: 確かめる取引, 使った値, 出した根, 結果

step 取引ごとに値を出す
  say 8件の取引それぞれから値を出す。この値が木の葉になる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  leaf 取引3 [hash: c41d]
  leaf 取引4 [hash: e5f8]
  leaf 取引5 [hash: a90c]
  leaf 取引6 [hash: d72b]
  leaf 取引7 [hash: f1e7]
  leaf 取引8 [hash: 5c3e]

step 2つずつ組む
  say 隣どうしの値を2つずつつないで、もう1度値を出す。親が4つできる。
  node 1から2 of 取引1, 取引2 [hash: 7a21]
  node 3から4 of 取引3, 取引4 [hash: b9e4]
  node 5から6 of 取引5, 取引6 [hash: 4d0f]
  node 7から8 of 取引7, 取引8 [hash: 92c6]

step さらに2つを組む
  say 親の値も同じように2つずつ組む。親が2つになる。
  node 1から4 of 1から2, 3から4 [hash: 1e8b]
  node 5から8 of 5から6, 7から8 [hash: 6f53]

step 根ができる
  say 残った2つを組むと、全ての取引の値をまとめた根が1つできる。ブロックの頭にはこの根だけを記録する。
  node 根 of 1から4, 5から8 [hash: e71c]

step 取引3の値を出す
  say 取引3が含まれることを確かめる。まず取引3そのものから値 c41d を出す。
  set 確かめる取引: 取引3 [tag: c41d]

step e5f8と組む
  say 隣の値 e5f8 を受け取って c41d と組み、親の値 b9e4 を出す。ほかの取引は読まなくてよい。
  取引3 -> 3から4 [tag: c41d]
  取引4 -> 3から4 [tag: e5f8]
  set 使った値: e5f8

step 7a21と組む
  say 隣の値 7a21 を受け取って b9e4 と組み、さらに上の親の値 1e8b を出す。
  3から4 -> 1から4 [tag: b9e4]
  1から2 -> 1から4 [tag: 7a21]
  set 使った値: e5f8, 7a21

step 6f53と組んで根と照らす
  say 隣の値 6f53 と組むと根の値が出る。ブロックの頭に記録した e71c と一致するので、取引3は確かに含まれている。
  1から4 -> 根 [tag: 1e8b]
  5から8 -> 根 [tag: 6f53]
  ブロックの頭 -> 根: 照らす [tag: e71c]
  set 使った値: e5f8, 7a21, 6f53
  set 出した根: e71c
  set 結果: 一致
`,Y3=`// Prove that transaction 3 is in a Merkle tree built from 8 transactions, by climbing to the root.
// The first 4 steps build the tree from the leaves to the root. The last 4 climb from the value of transaction 3 with the neighbouring values.
// The root sits at the top center and the leaves below. A leaf with a value shows the value in its box and its id on the card below.
tree Proving a transaction with a Merkle tree

box header as Block header [note: root e71c, color: green, icon: box]

strip Proof: Transaction, Values used, Computed root, Result

step Hash each transaction
  say Compute a value from each of the 8 transactions. These values become the leaves.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  leaf tx3 [hash: c41d]
  leaf tx4 [hash: e5f8]
  leaf tx5 [hash: a90c]
  leaf tx6 [hash: d72b]
  leaf tx7 [hash: f1e7]
  leaf tx8 [hash: 5c3e]

step Pair them up
  say Join neighbouring values two at a time and hash again. Four parents appear.
  node 1to2 of tx1, tx2 [hash: 7a21]
  node 3to4 of tx3, tx4 [hash: b9e4]
  node 5to6 of tx5, tx6 [hash: 4d0f]
  node 7to8 of tx7, tx8 [hash: 92c6]

step Pair the parents
  say Pair the parent values the same way. Two parents remain.
  node 1to4 of 1to2, 3to4 [hash: 1e8b]
  node 5to8 of 5to6, 7to8 [hash: 6f53]

step The root appears
  say Joining the last two gives one root that sums up every transaction. The block header records only this root.
  node root of 1to4, 5to8 [hash: e71c]

step Hash transaction 3
  say To check that transaction 3 is included, first compute its value c41d from the transaction itself.
  set Transaction: tx3 [tag: c41d]

step Pair with e5f8
  say Take the neighbouring value e5f8, pair it with c41d and compute the parent value b9e4. The other transactions stay unread.
  tx3 -> 3to4 [tag: c41d]
  tx4 -> 3to4 [tag: e5f8]
  set Values used: e5f8

step Pair with 7a21
  say Take the neighbouring value 7a21, pair it with b9e4 and compute the next parent value 1e8b.
  3to4 -> 1to4 [tag: b9e4]
  1to2 -> 1to4 [tag: 7a21]
  set Values used: e5f8, 7a21

step Pair with 6f53 and compare
  say Pairing with 6f53 gives the root value. It matches the e71c recorded in the block header, so transaction 3 is included.
  1to4 -> root [tag: 1e8b]
  5to8 -> root [tag: 6f53]
  header -> root: Compare [tag: e71c]
  set Values used: e5f8, 7a21, 6f53
  set Computed root: e71c
  set Result: Match
`,V3=`// OAuth 2.0 の認可コードと PKCE で、ログインしてから API を呼ぶまで
sequence OAuth 2.0 でログインして API を呼ぶ (認可コードと PKCE)

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する, color: slate, icon: globe]
box アプリ [note: ログインを頼む側, color: blue, icon: app]
box 認可 as 認可サーバー [note: 本人を確かめる, color: violet, icon: shield]
box API [note: 利用者のデータ, color: green, icon: server]

strip アプリが持つ値: state, code_verifier, 認可コード, アクセストークン, リフレッシュトークン

step ログインを押す
  say 利用者がアプリのログインを押す。アプリは ID もパスワードも受け取らず、本人の確認を認可サーバーに任せる。
  code GET /login
  ブラウザ -> アプリ: GET /login

step 鍵の元を作る
  say アプリが使い捨ての code_verifier を作り、その SHA-256 を code_challenge にする。戻りを見分ける state も作り、手元に残す。
  code code_challenge = BASE64URL(SHA-256(code_verifier))
  act アプリ: 鍵の元を作る
  set code_verifier: dBjf…
  set state: af0i…

step 認可サーバーへ回す
  say アプリはブラウザを認可サーバーへリダイレクトする。code_challenge と state は URL に載り、ブラウザを通って運ばれる。
  code GET /authorize?code_challenge=…&state=…
  アプリ -> ブラウザ: 302 で転送 [tag: challenge]
  ブラウザ -> 認可: GET /authorize [tag: challenge]

step ログインと同意
  say 認可サーバーが利用者を確かめ、アプリに渡す範囲 (scope) への同意を取る。パスワードはアプリに一度も渡らない。
  認可 -> ブラウザ: ログイン画面
  ブラウザ -> 認可: ID とパスワードと同意

step 認可コードを付けて戻す
  say 認可サーバーは短命の認可コードを発行し、登録済みの redirect_uri へブラウザを戻す。コードもブラウザを通る。
  code 302 redirect_uri?code=…&state=…
  認可 -> ブラウザ: 302 で転送 [tag: code]
  ブラウザ -> アプリ: GET /callback [tag: code]
  set 認可コード: Splx…

step state を確かめる
  say アプリは戻った state が送った値と同じかを確かめる。違えば他人が仕組んだ戻りとみなして捨てる。
  act アプリ: state を照らす
  set state [tag: 一致]

step コードを交換する
  say アプリは認可コードと code_verifier を、ブラウザを通さず認可サーバーへ直接送る。
  code POST /token  code=…&code_verifier=…
  アプリ -> 認可: 直接 POST /token [tag: code + verifier]
  set code_verifier [tag: 渡した]
  set 認可コード [tag: 渡した]

step 照らし合わせる
  say 認可サーバーは code_verifier の SHA-256 が最初の code_challenge と同じか、コードが未使用で期限内かを確かめ、コードを使用済みにする。
  act 認可: 照らし合わせる
  set 認可コード [tag: 使えない]

step トークンを返す
  say 通ればアクセストークンとリフレッシュトークンを返す。コードだけを盗んだ者は code_verifier を知らないので、前の段で弾かれる。
  code access_token, refresh_token, expires_in
  認可 -> アプリ: 直接 200 トークン [tag: access + refresh]
  note アプリ: トークンを持つ
  set アクセストークン: eyJh… [tag: 60 分]
  set リフレッシュトークン: 8xLO… [tag: 保管]

step API を呼ぶ
  say アプリはアクセストークンを Authorization ヘッダに載せて API を呼ぶ。
  code Authorization: Bearer <access_token>
  アプリ -> API: GET /me [tag: Bearer]

step 確かめて返す
  say API はトークンの署名、期限、許された範囲を確かめ、通れば利用者のデータを返す。
  act API: トークンを確かめる
  API -> アプリ: 200 データ
  note API: データを返した

step ログイン後の画面を返す
  say アプリはデータで画面を作って返す。アクセストークンが切れたら、リフレッシュトークンで新しく取り直す。
  アプリ -> ブラウザ: ログイン後の画面
  note ブラウザ: ログイン済み
`,X3=`// Sign in with the OAuth 2.0 authorization code and PKCE, then call an API
sequence Sign in with OAuth 2.0 and call an API (authorization code and PKCE)

box browser as User's browser [note: operated by the user, color: slate, icon: globe]
box app as App [note: asks for sign-in, color: blue, icon: app]
box auth as Authorization server [note: checks who you are, color: violet, icon: shield]
box API [note: the user's data, color: green, icon: server]

strip Values the app holds: state, code_verifier, authorization code, access token, refresh token

step Press sign in
  say The user presses the app's sign-in button. The app never receives an ID or a password and leaves identity checks to the authorization server.
  code GET /login
  browser -> app: GET /login

step Make the key material
  say The app makes a one-time code_verifier and uses its SHA-256 as the code_challenge. It also makes a state to recognise the return trip and keeps it.
  code code_challenge = BASE64URL(SHA-256(code_verifier))
  act app: make the key material
  set code_verifier: dBjf…
  set state: af0i…

step Send to the authorization server
  say The app redirects the browser to the authorization server. code_challenge and state ride in the URL and travel through the browser.
  code GET /authorize?code_challenge=…&state=…
  app -> browser: 302 redirect [tag: challenge]
  browser -> auth: GET /authorize [tag: challenge]

step Sign in and consent
  say The authorization server checks the user and asks for consent to the scope the app will get. The password never reaches the app.
  auth -> browser: sign-in screen
  browser -> auth: ID, password and consent

step Return with an authorization code
  say The authorization server issues a short-lived authorization code and sends the browser back to the registered redirect_uri. The code also passes through the browser.
  code 302 redirect_uri?code=…&state=…
  auth -> browser: 302 redirect [tag: code]
  browser -> app: GET /callback [tag: code]
  set authorization code: Splx…

step Check the state
  say The app checks that the returned state equals the one it sent. If not, it treats the return as forged and drops it.
  act app: compare the state
  set state [tag: match]

step Exchange the code
  say The app sends the authorization code and code_verifier straight to the authorization server, not through the browser.
  code POST /token  code=…&code_verifier=…
  app -> auth: direct POST /token [tag: code + verifier]
  set code_verifier [tag: sent]
  set authorization code [tag: sent]

step Compare
  say The authorization server checks that the SHA-256 of code_verifier equals the first code_challenge and that the code is unused and unexpired, then marks the code as used.
  act auth: compare
  set authorization code [tag: spent]

step Return the tokens
  say If everything matches, it returns an access token and a refresh token. Someone who stole only the code does not know code_verifier, so the previous step stops them.
  code access_token, refresh_token, expires_in
  auth -> app: direct 200 tokens [tag: access + refresh]
  note app: holds the tokens
  set access token: eyJh… [tag: 60 min]
  set refresh token: 8xLO… [tag: stored]

step Call the API
  say The app puts the access token in the Authorization header and calls the API.
  code Authorization: Bearer <access_token>
  app -> API: GET /me [tag: Bearer]

step Check and answer
  say The API checks the token's signature, expiry and allowed scope, and returns the user's data if it passes.
  act API: check the token
  API -> app: 200 data
  note API: returned the data

step Return the signed-in page
  say The app builds a page from the data and returns it. When the access token expires, it gets a new one with the refresh token.
  app -> browser: signed-in page
  note browser: signed in
`,J3=`// ネット通販の注文 #1042 が受け付けられ、届いた後に返品されて返金で閉じるまでの状態。
// 最初の段より前の線は、移れるが今回は通らない取り消しの道。
state ネット通販の注文が届いて返金されるまでの状態

box 注文受付 [note: 番号を付ける, color: blue, icon: doc]
box 支払い待ち [note: 入金を待つ, color: amber, icon: clock]
box 支払い済み [note: 決済が通った, color: amber, icon: card]
box 発送準備 [note: 棚から出す, color: blue, icon: box]
box 発送済み [note: 業者が運ぶ, color: violet, icon: truck]
box 配達完了 [note: 受け取られた, color: green, icon: check]
box 返品の受付 [note: 検品を待つ, color: rose, icon: undo]
box 返金済み [note: 代金を戻す, color: rose, icon: yen]
box キャンセル [note: 払った分は返す, color: rose, icon: x]

strip 注文 #1042: 支払い, 在庫, 伝票番号, 経過

支払い待ち -> キャンセル
支払い済み -> キャンセル: 取り消す
発送準備 -> キャンセル
キャンセル -> finish

step 注文を受け付ける
  say カートの中身で注文を確定すると、注文受付から始まる。注文番号 #1042 が付き、ここから先の動きは全て記録に残る。
  start -> 注文受付: 注文を確定 [tag: #1042]
  set 支払い: まだ
  set 在庫: 未確保
  set 経過: 0 分

step 支払いを待つ
  say 決済へ進むと支払い待ちに移る。期限までに払われなければ、この状態から取り消しへ移る。
  注文受付 -> 支払い待ち: 決済へ進む [tag: #1042]
  set 経過: 2 分

step 支払いが確定する
  say 決済会社から入金の知らせが届き、支払い済みに移る。金額の 4,980 円が記録に入る。
  支払い待ち -> 支払い済み: 支払いを確定 [tag: #1042]
  set 支払い: 4,980 円
  set 経過: 5 分

step 在庫を確保する
  say 倉庫が在庫を引き当て、発送準備に移る。ここまでは取り消せて、取り消すと払った分を返す。
  支払い済み -> 発送準備: 在庫を確保 [tag: #1042]
  set 在庫: 確保した
  set 経過: 3 時間

step 発送する
  say 配送業者に渡して伝票番号を発行し、発送済みに移る。発送した後は取り消しの道が閉じる。
  発送準備 -> 発送済み: 伝票を発行 [tag: #1042]
  set 在庫: 出荷した
  set 伝票番号: 4821-0937
  set 経過: 1 日

step 届く
  say 配送業者が受け取りを記録すると、配達完了に移る。普通の注文はここで終わる。
  発送済み -> 配達完了: 配達を記録 [tag: #1042]
  set 経過: 2 日

step 返品を申し込む
  say 購入者が返品を申し込み、返品の受付に移る。届いてから決まった日数の間だけ選べる道。
  配達完了 -> 返品の受付: 返品を申請 [tag: #1042]
  set 経過: 6 日

step 戻った品を確かめる
  say 戻った商品を検品する。状態は返品の受付のまま変わらないので、同じ状態へ戻る矢印で表す。
  返品の受付 -> 返品の受付: 検品する [tag: #1042]
  note 返品の受付: 検品を通った
  set 在庫: 棚へ戻した
  set 経過: 9 日

step 返金する
  say 検品を通ったので返金を実行し、返金済みに移る。支払いの欄が返金した、に変わる。
  返品の受付 -> 返金済み: 返金を実行 [tag: #1042]
  note 返金済み: 全額を戻した
  set 支払い: 返金した
  set 経過: 10 日

step 注文を閉じる
  say 返金済みは終わりの状態で、ここから先へは移らない。注文は閉じ、通った道は記録として残る。
  返金済み -> finish: 注文を閉じる [tag: #1042]
`,Q3=`// The states of online order #1042, from the order to delivery, then a return and a refund that close it.
// The lines before the first step are the cancel path, which the order could take but does not this time.
state States of an online order from delivery to refund

box received as Received [note: Gets a number, color: blue, icon: doc]
box awaiting as Awaiting payment [note: Waits for funds, color: amber, icon: clock]
box paid as Paid [note: Payment cleared, color: amber, icon: card]
box packing as Packing [note: Off the shelf, color: blue, icon: box]
box shipped as Shipped [note: With the carrier, color: violet, icon: truck]
box delivered as Delivered [note: Handed over, color: green, icon: check]
box returning as Return requested [note: Awaiting the check, color: rose, icon: undo]
box refunded as Refunded [note: Money goes back, color: rose, icon: yen]
box cancelled as Cancelled [note: Payment returned, color: rose, icon: x]

strip Order #1042: Payment, Stock, Tracking no., Elapsed

awaiting -> cancelled
paid -> cancelled: Cancel
packing -> cancelled
cancelled -> finish

step Receive the order
  say Confirming the cart starts the order at Received. It gets the number #1042, and every later move is recorded.
  start -> received: Place order [tag: #1042]
  set Payment: not yet
  set Stock: not held
  set Elapsed: 0 min

step Wait for payment
  say Going to checkout moves the order to Awaiting payment. If it is not paid in time, it moves from here to Cancelled.
  received -> awaiting: Check out [tag: #1042]
  set Elapsed: 2 min

step Confirm the payment
  say The payment company reports the deposit, and the order moves to Paid. The amount of 4,980 yen is recorded.
  awaiting -> paid: Confirm payment [tag: #1042]
  set Payment: 4,980 yen
  set Elapsed: 5 min

step Hold the stock
  say The warehouse holds the stock, and the order moves to Packing. Up to here it can be cancelled, and the payment is returned.
  paid -> packing: Hold stock [tag: #1042]
  set Stock: held
  set Elapsed: 3 h

step Ship
  say The parcel goes to the carrier with a tracking number, and the order moves to Shipped. After shipping, the cancel path is closed.
  packing -> shipped: Issue label [tag: #1042]
  set Stock: shipped
  set Tracking no.: 4821-0937
  set Elapsed: 1 day

step Deliver
  say The carrier records the handover, and the order moves to Delivered. A normal order ends here.
  shipped -> delivered: Record delivery [tag: #1042]
  set Elapsed: 2 days

step Request a return
  say The buyer asks for a return, and the order moves to Return requested. This path is open only for a set number of days after delivery.
  delivered -> returning: Request return [tag: #1042]
  set Elapsed: 6 days

step Check the returned item
  say The returned item is inspected. The state stays Return requested, so the arrow goes back to the same state.
  returning -> returning: Inspect [tag: #1042]
  note returning: Passed the check
  set Stock: back on shelf
  set Elapsed: 9 days

step Refund
  say The item passed, so the refund runs and the order moves to Refunded. The payment field changes to refunded.
  returning -> refunded: Run refund [tag: #1042]
  note refunded: Fully returned
  set Payment: refunded
  set Elapsed: 10 days

step Close the order
  say Refunded is a final state, and the order moves nowhere after it. The order closes, and the path it took stays on record.
  refunded -> finish: Close order [tag: #1042]
`,Z3=`// 支払いと後から届く知らせの見本。お金は硬貨で運び、注文の状態を帯で追う
sequence カードで払い、後から知らせを受ける

box 客 [note: 払う人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: cart]
box 決済 as 決済サービス [note: カードを処理する, color: violet, icon: card]

strip 注文: 番号, 金額, 状態

step 注文する
  say 客が店のアプリで注文を確定する。
  客 -> 店: 注文する
  set 番号: #1024
  set 金額: 3200 円
  set 状態: 支払い待ち

step 払う
  say 客がカードで払う。お金は決済サービスへ動く。
  客 -> 決済: 3200 円 [carry: coin]
  set 状態: 処理中

step 受け付けを返す
  say 決済サービスは、受け付けたことだけを先に客へ返す。支払いが済んだかは、まだ店に届いていない。
  決済 -> 客: 受け付けた [side: below]

step 後から知らせる
  say 支払いが済むと、決済サービスが店のアプリへ webhook で知らせる。店はこの知らせで注文を確定する。
  決済 -> 店: 支払い済み [tag: webhook]
  set 状態: 支払い済み [tag: 確定]

step 受け取ったと返す
  say 店のアプリは知らせを受け取ったと 200 で返す。返さなければ、決済サービスは同じ知らせを送り直す。
  店 -> 決済: 200 OK [carry: none, side: below]
`,K3=`// Payment and later notice example. Money moves as a coin, and the strip follows the order state
sequence Pay by card and get notified later

box customer as Customer [note: pays, color: slate, icon: user]
box shop as Shop app [note: takes orders, color: blue, icon: cart]
box pay as Payment service [note: processes cards, color: violet, icon: card]

strip Order: number, amount, state

step Order
  say The customer confirms the order in the shop app.
  customer -> shop: place order
  set number: #1024
  set amount: 32 USD
  set state: awaiting payment

step Pay
  say The customer pays by card. The money moves to the payment service.
  customer -> pay: 32 USD [carry: coin]
  set state: processing

step Acknowledge
  say The payment service first tells the customer only that it accepted the request. The shop does not know yet whether the payment went through.
  pay -> customer: accepted [side: below]

step Notify later
  say When the payment goes through, the payment service notifies the shop app by webhook. The shop confirms the order on this notice.
  pay -> shop: paid [tag: webhook]
  set state: paid [tag: confirmed]

step Confirm receipt
  say The shop app answers 200 to say it got the notice. Without it, the payment service sends the same notice again.
  shop -> pay: 200 OK [carry: none, side: below]
`,W3=`// 作業の枝 feature を main の先端へ rebase し、main を早送りで進めて履歴を 1 本にするまで。
// 上の帯が main、下の帯が feature。commit は丸で、hash と一言を丸の外に添える。
// 当て直した C' と D' は main の帯に積み、枝の札は動かさない。HEAD は枝から離れた間だけ札で出す。
git 作業の枝を rebase して main へ取り込む

branch main [note: 取り込む先]
branch feature [note: 作業の枝]

box 作業ツリー [note: 手元のファイル, color: violet, icon: doc]

strip 参照: main, feature, HEAD, 履歴の形

step main にある
  say main に commit A と B がある。main は B を指し、HEAD は main を指している。手元で開いているのは B の中身。
  commit A on main [hash: 3fa0c19, note: 最初の形]
  commit B on main [hash: 8b04f71, note: 一覧を足す]
  set main: B 8b04f71
  set HEAD: main
  set 履歴の形: 一直線

step 枝を切る
  say B から作業の枝 feature を作って移る。feature も B を指し、HEAD は feature を指す。中身はまだ main と同じ。
  code git switch -c feature
  feature from B
  set feature: B 8b04f71
  set HEAD: feature

step 作業を積む
  say feature に C と D を積む。commit のたびに feature が新しい commit へ進み、HEAD も付いていく。main は B のまま。
  code git commit
  commit C on feature [hash: c41d0e5, note: 価格を丸める]
  commit D on feature [hash: d72b9a3, note: 送料を足す]
  set feature: D d72b9a3

step main が進む
  say その間に他の人の変更 E が main に入り、手元の main も取り込んで E を指す。feature は古い B から分かれたまま。
  commit E on main [hash: e5f8312, note: 税率を直す]
  set main: E e5f8312
  set 履歴の形: 枝分かれ

step rebase を始める
  say Git は分かれ目の B まで戻って C と D を控え、HEAD を E へ移す。HEAD は枝を通さず E を直接指す (切り離し)。ここから 1 つずつ当て直す。
  code git rebase main
  HEAD -> E: git rebase main
  set HEAD: E (切り離し)
  set 履歴の形: 当て直し中

step 衝突で止まる
  say C を E の上へ当て直すと、E も同じ行を変えていたので衝突する。rebase はそこで止まり、直すのを待つ。
  note 作業ツリー: src/price.ts で衝突
  set 履歴の形: 衝突で停止

step 直して続ける
  say 衝突した行を直して続けると、C と同じ変更を持つ C' ができる。親が B から E に変わったので hash も変わる。
  code git add → git rebase --continue
  note 作業ツリー: 直して git add した
  commit C' on main copy C [hash: a90c6b4, note: 価格を丸める]
  set HEAD: C' (切り離し)
  set 履歴の形: 当て直し中

step D を当て直す
  say D は衝突せず D' になる。当て終わると feature が D' へ移り、HEAD も feature に戻る。元の C と D はどこからも指されない。
  commit D' on main copy D [hash: f1e7d28, note: 送料を足す]
  feature -> D'
  set feature: D' f1e7d28
  set HEAD: feature
  set 履歴の形: 早送りできる

step 検査が通る
  say D' は E の変更も含んだ形になっている。この形で検査を回し、全て通ることを確かめてから取り込む。
  note 作業ツリー: D' で検査を回す
  note 作業ツリー: 型、単体、結合が通った

step main を早送り
  say main を D' まで進める。main の先に C' と D' が一直線に続くので、merge commit を作らず参照を動かすだけで済む。
  code git switch main → git merge --ff-only feature
  main -> D': git merge --ff-only feature
  set main: D' f1e7d28
  set HEAD: main
  set 履歴の形: 一直線

step 一直線の履歴
  say main の履歴を先端から辿ると D'、C'、E、B、A の 1 本になる。元の C と D は reflog に残るが、期限が過ぎると掃除される。
  code git log --oneline
`,I3=`// Rebasing the work branch feature onto the tip of main, then fast-forwarding main into one straight history.
// The top lane is main and the lower lane is feature. Commits are circles, with the hash and a short note beside them.
// The replayed C' and D' sit on the main lane and do not move branch refs. HEAD shows as a tag only while it is detached.
git Rebase a work branch and bring it into main

branch main [note: Merge target]
branch feature [note: Work branch]

box worktree as Worktree [note: Local files, color: violet, icon: doc]

strip Refs: main, feature, HEAD, History

step On main
  say main has commits A and B. main points at B, and HEAD points at main. The files you have open are B's.
  commit A on main [hash: 3fa0c19, note: First shape]
  commit B on main [hash: 8b04f71, note: Add the list]
  set main: B 8b04f71
  set HEAD: main
  set History: Straight

step Cut a branch
  say Create the work branch feature from B and switch to it. feature also points at B, and HEAD points at feature. The files are still the same as main.
  code git switch -c feature
  feature from B
  set feature: B 8b04f71
  set HEAD: feature

step Commit work
  say Add C and D on feature. Each commit moves feature to the new commit, and HEAD follows. main stays at B.
  code git commit
  commit C on feature [hash: c41d0e5, note: Round prices]
  commit D on feature [hash: d72b9a3, note: Add shipping]
  set feature: D d72b9a3

step main moves on
  say Meanwhile someone else's change E lands on main, and the local main pulls it in and points at E. feature still branches off the old B.
  commit E on main [hash: e5f8312, note: Fix the tax rate]
  set main: E e5f8312
  set History: Branched

step Start the rebase
  say Git walks back to the fork point B, sets C and D aside, and moves HEAD to E. HEAD points at E directly, not through a branch (detached). From here it replays one commit at a time.
  code git rebase main
  HEAD -> E: git rebase main
  set HEAD: E (detached)
  set History: Replaying

step Stop on a conflict
  say Replaying C on top of E conflicts, because E changed the same lines. The rebase stops there and waits for a fix.
  note worktree: Conflict in src/price.ts
  set History: Stopped on a conflict

step Fix and continue
  say Fix the conflicting lines and continue, and C' appears with the same change as C. Its parent changed from B to E, so its hash changes too.
  code git add → git rebase --continue
  note worktree: Fixed and staged
  commit C' on main copy C [hash: a90c6b4, note: Round prices]
  set HEAD: C' (detached)
  set History: Replaying

step Replay D
  say D replays without a conflict and becomes D'. When the replay ends, feature moves to D' and HEAD returns to feature. The old C and D are no longer pointed at by anything.
  commit D' on main copy D [hash: f1e7d28, note: Add shipping]
  feature -> D'
  set feature: D' f1e7d28
  set HEAD: feature
  set History: Can fast-forward

step Checks pass
  say D' now includes the change in E. Run the checks on this shape and make sure they all pass before bringing it in.
  note worktree: Running checks on D'
  note worktree: Types, unit, integration pass

step Fast-forward main
  say Move main up to D'. C' and D' continue in a straight line after main, so no merge commit is needed; only the ref moves.
  code git switch main → git merge --ff-only feature
  main -> D': git merge --ff-only feature
  set main: D' f1e7d28
  set HEAD: main
  set History: Straight

step A straight history
  say Following main back from its tip gives one line: D', C', E, B, A. The old C and D stay in the reflog until they expire and are cleaned up.
  code git log --oneline
`,ew=`// 失敗してやり直す見本。同じ線を 2 度引き、待つ処理と何回目かを箱の中と下に見せる
sequence 決済を頼み直す

box アプリ as 店のアプリ [note: 1 回目, color: blue, icon: app]
box 決済 as 決済 API [note: 混んでいる, color: violet, icon: card]

step 頼む
  say 店のアプリが決済 API に支払いを頼む。
  アプリ -> 決済: POST /charges

step 断られる
  say 決済 API が混んでいて、503 で断る。
  決済 -> アプリ: 503 混んでいる [side: below]

step 待つ
  say アプリはすぐに頼み直さず、1 秒待ってから 2 回目を送る。
  act アプリ: 1 秒待つ
  note アプリ: 2 回目

step 頼み直す
  say 同じ頼みをもう一度送る。決済 API の混み具合は落ち着いている。
  アプリ -> 決済: POST /charges
  note 決済: 空いている

step 通る
  say 2 回目は通り、決済 API が支払いの番号を 200 OK で返す。
  決済 -> アプリ: 200 OK [side: below]
`,tw=`// Retry example. Draw the same line twice, and show the wait and the attempt count inside and under the box
sequence Retry the payment

box app as Shop app [note: attempt 1, color: blue, icon: app]
box pay as Payment API [note: busy, color: violet, icon: card]

step Ask
  say The shop app asks the payment API to charge the card.
  app -> pay: POST /charges

step Turned away
  say The payment API is busy and answers 503.
  pay -> app: 503 busy [side: below]

step Wait
  say The app does not retry at once. It waits one second before the second attempt.
  act app: wait 1 second
  note app: attempt 2

step Ask again
  say The app sends the same request again. The payment API has calmed down.
  app -> pay: POST /charges
  note pay: free

step Through
  say The second attempt goes through, and the payment API returns the payment ID with 200 OK.
  pay -> app: 200 OK [side: below]
`,nw=`// ウォレットで署名して取引を送る見本。署名した取引を札で運び、段ごとに呼ぶ命令を見せる
sequence ウォレットで署名して送る

box dApp as 取引所の dApp [note: 取引を組む, color: blue, icon: app]
box ウォレット [note: 鍵を持つ, color: amber, icon: key]
box ノード as RPC ノード [note: 取引を受け付ける, color: slate, icon: server]
box チェーン as ブロックチェーン [note: 取引を記録する, color: green, icon: chain]

step 署名を頼む
  say dApp が送る取引を組み、ウォレットに署名と送信を頼む。
  code eth_sendTransaction
  dApp -> ウォレット: 取引を頼む

step 署名する
  say 利用者がウォレットの画面で中身を確かめて承認し、ウォレットが鍵で署名する。
  act ウォレット: 承認して署名する

step 送る
  say ウォレットが署名した取引を RPC ノードへ送る。
  code eth_sendRawTransaction
  ウォレット -> ノード: 署名した取引 [tag: 0x02f8…]

step 取り込まれる
  say ノードが取引をネットワークへ広め、取引がブロックに取り込まれる。
  ノード -> チェーン: 取引を広める

step 受領書を受け取る
  say dApp が取引の受領書を引き、成功したことを画面に出す。
  code eth_getTransactionReceipt
  dApp -> ノード: 受領書を引く
  ノード -> dApp: status 1 [side: below]
`,aw=`// Wallet signing example. The signed transaction runs as a tag, and each step shows the call it makes
sequence Sign in the wallet and send

box dapp as Exchange dApp [note: builds the transaction, color: blue, icon: app]
box wallet as Wallet [note: holds the key, color: amber, icon: key]
box node as RPC node [note: accepts transactions, color: slate, icon: server]
box chain as Blockchain [note: records transactions, color: green, icon: chain]

step Ask to sign
  say The dApp builds the transaction and asks the wallet to sign and send it.
  code eth_sendTransaction
  dapp -> wallet: request transaction

step Sign
  say The user checks the details in the wallet and approves, and the wallet signs with its key.
  act wallet: approve and sign

step Send
  say The wallet sends the signed transaction to the RPC node.
  code eth_sendRawTransaction
  wallet -> node: signed transaction [tag: 0x02f8…]

step Included
  say The node spreads the transaction to the network, and a block includes it.
  node -> chain: broadcast

step Get the receipt
  say The dApp fetches the transaction receipt and shows that it succeeded.
  code eth_getTransactionReceipt
  dapp -> node: get receipt
  node -> dapp: status 1 [side: below]
`,sw=`// L2 から L1 へ資産を引き出す時の 7 日の待ち。
// 目盛り 1 つが 1 日で、10 日分を並べる。L1 へ出した状態に誰でも異議を出せる 7 日を囲みで示し、
// 針が 7 日を進んでから L1 で受け取れる様子を追う。箱と拡大の帯を持たない、目盛りと節目だけの図。
time L2 から L1 へ引き出すまでの 7 日の待ち

scale 日 1d 10
row 提出 as L1 への提出 [color: blue]
point 申し込み at 0
point 受け取り at 8

strip 引き出しの進み: 経過, 異議を出せる残り, 引き出し

step 引き出しを申し込む
  say 利用者は L2 で引き出しの取引を出す。L2 の中では数秒で済むが、L1 で受け取るのはまだ先になる。
  note 申し込み: 申し込んだ [color: violet]
  set 経過: 0 日
  set 引き出し: 申し込んだ

step 状態を L1 へ出す
  say L2 は取引をまとめた状態を L1 へ出す。この提出から、誰でも異議を出せる 7 日が始まる。
  now -> 0
  note 申し込み: L1 に提出 [color: blue]
  set 経過: 1 日
  set 異議を出せる残り: 7 日

step 7 日待つ
  say 出した状態が誤っていれば、誰でも 7 日の間に不正の証明を出して取り消せる。異議が無ければ状態は確かになる。
  span 1-7: 異議を出せる 7 日 [shape: box, color: amber]
  now -> 7
  set 経過: 8 日
  set 異議を出せる残り: 0 日

step L1 で受け取る
  say 7 日の間に異議が出なかったので、利用者は L1 で引き出しを確かめて資産を受け取る。
  申し込み -> 受け取り: 引き出す [carry: coin]
  note 受け取り: 受け取った [color: green]
  now -> 8
  set 経過: 9 日
  set 引き出し: 受け取った
`,ow=`// The 7-day wait when withdrawing assets from L2 to L1.
// One unit is one day, and the axis shows 10 days. A box marks the 7 days in which anyone can dispute the state sent to L1,
// and the needle moves through those 7 days before the assets can be received on L1. A diagram of the axis and points only, with no boxes or zoom band.
time The 7-day wait to withdraw from L2 to L1

scale day 1d 10
row batch as Posted to L1 [color: blue]
point request at 0
point receive at 8

strip Withdrawal: Elapsed, Dispute days left, Withdrawal

step Request the withdrawal
  say The user sends a withdrawal on L2. It takes seconds inside L2, but receiving it on L1 is still a while away.
  note request: Requested [color: violet]
  set Elapsed: 0 d
  set Withdrawal: Requested

step Post the state to L1
  say L2 posts the state that bundles the transactions to L1. From this post, anyone has 7 days to dispute it.
  now -> 0
  note request: Posted to L1 [color: blue]
  set Elapsed: 1 d
  set Dispute days left: 7 d

step Wait 7 days
  say If the posted state is wrong, anyone can submit a fraud proof within the 7 days and cancel it. With no dispute the state becomes settled.
  span 1-7: 7 days to dispute [shape: box, color: amber]
  now -> 7
  set Elapsed: 8 d
  set Dispute days left: 0 d

step Receive on L1
  say No dispute came in the 7 days, so the user proves the withdrawal on L1 and receives the assets.
  request -> receive: withdraw [carry: coin]
  note receive: Received [color: green]
  now -> 8
  set Elapsed: 9 d
  set Withdrawal: Received
`,Yi=["intro","api","retry","payment","wallet","oauth","ccip","order","rebase","merge","finality","withdraw","merkle","auction"],H0="oauth",iw=["intro","oauth","ccip"],rw={intro:{ja:L3,en:H3},api:{ja:O3,en:M3},retry:{ja:ew,en:tw},payment:{ja:Z3,en:K3},wallet:{ja:nw,en:aw},oauth:{ja:V3,en:X3},ccip:{ja:q3,en:R3},order:{ja:J3,en:Q3},rebase:{ja:W3,en:I3},merge:{ja:P3,en:U3},finality:{ja:z3,en:F3},withdraw:{ja:sw,en:ow},merkle:{ja:G3,en:Y3},auction:{ja:B3,en:j3}},Ra=(t,s)=>rw[t][s].trimEnd();function fs(t,s){const c=Ra(t,s),d=ms(c);if(!d.ok)return;const p=c.split(`
`)[0]??"";return{title:d.diagram.title,kind:d.diagram.kind,about:p.startsWith("//")?p.replace(/^\/\/\s*/u,""):""}}const Rl={ja:["sequence 新しい図","","box 甲","box 乙","","step 最初の段","  say この段で起きることを書く。","  甲 -> 乙: 呼ぶ"].join(`
`),en:["sequence New diagram","","box a as A","box b as B","","step First step","  say Write what happens in this step.","  a -> b: call"].join(`
`)},qd="new.dragon";function zl(t){for(const s of Yi)for(const c of["ja","en"])if(Ra(s,c)===t.trimEnd())return{key:s,lang:c}}const Et={ja:{title:"dragon — 文章で書くと、動く図になる",tagline:"文章で書くと、動く図になる",language:"言葉",palette:"色味",paletteNames:{clear:"澄んだ色",paper:"紙と墨",night:"夜の計器"},site:{nav:{home:"概要",catalog:"カタログ",editor:"編集画面",docs:"使い方","release-notes":"更新履歴"},navLabel:"行き先",openMenu:"行き先を開く",closeMenu:"行き先を閉じる",openEditor:"編集画面を開く →",toDark:"暗い表示にする",toLight:"明るい表示にする",home:{chip:t=>[...t,"段ごとの再生"].join(" × "),title:["より自由な","図","を"],lead:"箱と線を書き、段ごとに動かす。型に合わせて諦めていた図が、文章のまま組み上がる。",readDocs:"使い方を読む",features:{eyebrow:"なぜ dragon か",title:"書く手間を、動く成果に。",items:[{title:"文章で書ける",text:"箱と線と段を 1 行ずつ書くだけ。座標も図の部品も組まない。"},{title:"段ごとに動き出す",text:"段を切り替えると、線の上を封筒や札が走り、箱の中の処理が進む。順序と因果が目に見える。"},{title:"URL と file で渡せる",text:"書いた記法は URL に載せて共有できる。CLI で mp4、GIF、HTML、PNG にも書き出せる。"}]},steps:{eyebrow:"3 手順",title:"1 分で走り出す。",items:[{title:"編集画面を開く",text:"ブラウザで編集画面を開く。導入作業は要らない。"},{title:"記法を書く",text:"箱と線と段を 1 行ずつ書く。最初の行で図の種類を選ぶ。"},{title:"図が動き出す",text:"右の実況表示に、段ごとに動く図が出る。URL で共有でき、file にも書き出せる。"}]},uses:{eyebrow:"使いどころ",title:"こんな図が書ける。",more:"カタログで図を見る →"},closing:{title:"今すぐ、書いて動かす。",lead:"記法を 1 つ書くだけ。動く図を 1 分後に手に入れる。"}},catalog:{crumb:"現在地",lead:(t,s,c)=>`今の記法の部品 ${t} 個と、部品を組み合わせた ${s} 種類の図を並べる。部品の頁で書き方と見え方を確かめ、図の頁で見本を検索して動かし、編集画面で開ける。合計 ${c} 件の見本。`,sections:{parts:{title:"部品",lead:"いくつもの図で使う部品。部品ごとに、使える図の種類それぞれで描いた見え方を並べる。列の図は線を引かないので、線と箱の中の処理の部品は列の図に無い。"},"kind-parts":{title:"図の種類だけの部品",lead:"1 つの図の種類でだけ使う部品。"},kinds:{title:"図",lead:"部品を組み合わせた図。図ごとに、使う部品の一覧と見本を載せる。"}},parts:{box:{name:"箱",desc:"box の行で、図に登場する物を 1 つ置く。名札と見せる名前を書き、線はこの名札で引く。"},edge:{name:"線",desc:"送る側の箱から受ける側の箱へ引く線。1 つの段に何本でも並べ、書いた順に引く。"},"edge-label":{name:"線の名前",desc:"線に添える名前。side で、上、下、左、右のどこに置くかを選ぶ。"},carry:{name:"運ぶ物",desc:"線の上を走る物。封筒、値を書いた札、硬貨、何も走らせないの 4 つから選ぶ。"},color:{name:"色の役",desc:"箱と区画に付ける色の役。7 つの役から選び、色そのものは色味が決める。"},icon:{name:"絵",desc:"箱と区画の名前に添える絵。user や db などの名前で選ぶ。"},link:{name:"飛び先",desc:"箱に書く飛び先。描いた図ではその箱が link になり、押すと中の仕組みを描いた頁などへ移る。/ で始まる path か、http:// か https:// で始まる URL で書く。"},note:{name:"小さな字",desc:"箱と区画の名前の下に添える小さな字。段の中で箱の小さな字を書き換えられる。"},act:{name:"箱の中の処理",desc:"線を引かずに、箱の中で起きる処理を札で見せる。"},strip:{name:"中身の帯と欄",desc:"図の下に置く中身の帯。段ごとに欄の値を入れ替え、運ばれる物の中身を追う。"},step:{name:"段",desc:"図を区切る段。段ごとに本文と打つ命令を書き、1 段ずつ送って見る。view で、枠が段を追うか全体を止めて見せるかを選ぶ。"},source:{name:"出典",desc:"段に書く出典。名前と URL の組を 1 つの段に何行でも書け、読み上げの段の一覧に名前の link で出る。図と見える語りには出さない。"},lifeline:{name:"生存線",desc:"時系列図だけの部品。箱の下に縦の線が伸び、上から下へ時が進む。"},group:{name:"区画",desc:"構成図だけの部品。group から end までの箱を 1 つの区画に囲み、仕組みの境目を見せる。"},"start-finish":{name:"始まりと終わり",desc:"状態遷移図だけの部品。線の送る側に start、受ける側に finish を書くと、始まりの印から出る線と、終わりの印へ入る線になる。"},"side-path":{name:"通らない道",desc:"状態遷移図だけの部品。最初の step より前に書いた線は、移れるが今回は通らない道として点線で引く。どの段も辿り着かない状態は点線の箱にして、脇道の囲みに入れる。"},branch:{name:"枝",desc:"枝分かれの図だけの部品。branch の行で枝を上から順に宣言すると、枝ごとに横長の帯が並ぶ。段の中で <枝> from <commit> と書くと、その commit から枝を切る。"},commit:{name:"commit",desc:"枝分かれの図だけの部品。commit <名札> on <枝> で枝に commit を積み、hash と一言を丸の外に添える。積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。"},copy:{name:"当て直し",desc:"枝分かれの図だけの部品。on <枝> の後ろに copy <commit> を書くと、元の commit と同じ変更を当て直した commit になり、元から点線で結ぶ。rebase で作り直す commit に使い、枝の札は動かさない。"},merge:{name:"merge commit",desc:"枝分かれの図だけの部品。on <枝> の後ろに merge <枝> を書くと、取り込む先の先端と取り込む枝の先端の 2 つを親に持つ commit になる。取り込む先の札だけが進む。"},scale:{name:"目盛りと針",desc:"時間軸の図だけの部品。scale の行で目盛りの名前と 1 つの長さと数を書くと、時間軸に目盛りが並ぶ。段の中で now -> <目盛り> と書くと、針が決まった速さでその目盛りの終わりまで進む。period で区切りを、span で範囲の括弧か囲みを出す。"},row:{name:"印の列",desc:"時間軸の図だけの部品。row の行で印の列を上から順に宣言すると、目盛りごとに細い印が並び、針が過ぎた所から塗られる。empty に書いた目盛りは空きの印になり、段の中の mark で印の色を変える。"},point:{name:"節目",desc:"時間軸の図だけの部品。point <名札> at <目盛り> で、その目盛りの印の下に旗の丸を置く。段の中の note で状態の字と丸の色を変え、節目どうしを線で結ぶ。"},zoom:{name:"拡大の帯",desc:"時間軸の図だけの部品。zoom の行で目盛りの範囲を書くと、上の帯にその目盛りを列にして並べ、宣言した箱を列ごとに繰り返す。線は [at: <目盛り>] の列の箱どうしを結び、受ける箱を別の列から選ぶ時は into を書く。"},leaf:{name:"葉と札",desc:"木の図だけの部品。段の中に leaf <名札> [hash: <値>] と書くと、その段で葉の箱が現れる。値を持つ葉は箱に値を、葉の下の札に名札を出す。札は最初の段から見える。"},node:{name:"組んだ親",desc:"木の図だけの部品。段の中に node <名札> of <子>, <子> [hash: <値>] と書くと、前に書いた葉か親を子にして親の箱が現れ、子と親を木の線で結ぶ。親子の箱どうしの線は木の線の上を走る。親を持たない箱は最後に根の 1 つだけ残す。"},item:{name:"チップ",desc:"列の図だけの部品。最初の step より前に item <名札>, <名札> [color: <色>, label: <字>] と書くと、列に並べるチップを宣言する。色を付けたチップは色で塗り、label の字は 4 字まで載る。"},line:{name:"列の並び",desc:"列の図だけの部品。段の中に line <列>: <チップ>, <チップ> と書くと、その列のチップが書いた順に並び直す。ほかの列に居たチップはその席から滑って来て、どこにも居なかったチップは弾んで現れる。1 列は 12 枚まで。"},seal:{name:"封",desc:"列の図だけの部品。段の中に seal <列> と書くと、縞の封が列の左から伸びて中身を隠し、open <列> と書くと封が消えて中身が戻る。封をした列の並びは開けるまで書けない。"},pick:{name:"選ぶ",desc:"列の図だけの部品。段の中に pick <列> と書くと、その列の縁に色が付き、ほかの列が薄くなる。薄くなった列は、後の段で並びを書き換えるか選ぶと濃く戻る。"},stamp:{name:"札",desc:"列の図だけの部品。段の中に stamp <列>: <字> と書くと、列の右に傾いた札が押される。署名や承認のように、列の中身に触れずに起きたことを見せる。"}},kindOnly:t=>`${t}だけ`,partKinds:"使える図",words:"記法の語",uses:"この図で使う部品",usesLead:"部品を押すと、その部品の書き方と見え方の頁へ移る。",partSamples:"この部品を使う見本",partSamplesLead:"見本を押すと、図の頁でその見本を開く。",partIcons:"使える絵柄",partIconsLead:t=>`箱と区画の icon に下の名前を書くと、その絵柄が名前の横に付く。使える絵柄は ${t} 個。`,count:t=>`${t} 件`,open:"開く →",kinds:{sequence:"登場する物の間で、誰が誰に何を渡すかを段ごとに追う図。ログインの流れや API の呼び出しの順を、線の上を走る封筒で見せる。",architecture:"区画と箱で仕組みの構成を描き、段ごとにどこからどこへ何が流れるかを見せる図。チェーンをまたぐ送金や、サービスの間の受け渡しに使う。",state:"1 つの物が状態を移る様子を段ごとに追う図。注文や申請が受付から閉じるまでにどの状態を通るかを、線の上を走る札で見せる。",git:"git の枝に commit が積まれ、rebase や merge commit で取り込まれる様子を段ごとに追う図。枝と HEAD がどの commit を指すかを、丸の上の札で見せる。",time:"決まった間隔で刻む時間の上で、何がいつ起きたかを段ごとに追う図。ブロックの確定や引き出しの待ちのように、時間が長さとして効く仕組みを、進む針と塗られる印で見せる。",tree:"親子で枝分かれする箱を葉から根まで組み上げ、根と葉の間を段ごとに辿る図。Merkle 木のように少しの値で全体を確かめる仕組みを、木の線の上を走る札で見せる。",lineup:"横長の列にチップを並べ、段ごとに並びが替わる様子を追う図。入札でブロックの中身が決まる流れのように、順番と隠す中身が効く仕組みを、列の間を滑るチップと封で見せる。"},total:t=>`全 ${t} 件`,showing:t=>`${t} 件 表示中`,search:"検索 (名前 / 説明)",searchLabel:"見本を検索",clearSearch:"検索語を消す",list:"見本の一覧",nothing:"当てはまる見本が無い",preview:"図の表示",views:"表示の切替",figure:"図",code:"コード",sameAsSite:"サイトと同じ",expand:"拡大",expandLabel:t=>`${t} を拡大して見る`,close:"閉じる",openEditor:"編集画面で開く →",source:"この図の記法",copy:"コードを写す",copied:"写しました"},screens:{catalog:{title:"カタログ"},editor:{title:"編集画面",lead:""},docs:{title:"使い方"},"release-notes":{title:"更新履歴"},"not-found":{title:"そこは、まだ書かれていない。"}},releaseNotes:{crumb:"道筋",eyebrow:t=>`公開の記録 · ${t} が最新`,accent:"履歴",lead:"dragon の今の版を示す。版ごとの詳しい変更は GitHub 上の CHANGELOG.md で読める。",changelog:"変更の記録を GitHub で見る"},notFound:{em:"そこは",lead:t=>`お探しの頁は移動または削除されたか、そもそも存在しません。dragon の ${t} つの入口から探してみてください。`,catalog:"カタログを見る",docs:"使い方を読む"}},notation:"記法",editor:"図の記法を書く欄",fold:"畳む",unfold:"開く",readable:(t,s)=>`読めています — 箱 ${t} つ、段 ${s}`,notJson:t=>`JSON として読めない — ${t}`,cannotDraw:t=>`描けない — ${t}`,kept:"誤りがあるあいだは、最後に描けた図を出しています",exportLead:"同じ図を書き出す",exportTail:"で mp4 / GIF / HTML / PNG",shelf:{label:"棚",open:"棚を開く",close:"棚を閉じる",newFile:"新規ファイル",tabs:{samples:"見本",parts:"部品",notation:"記法"},filter:"絞り込む…",filterLabel:"一覧を絞り込む",nothing:"当てはまる物が無い",kinds:{sequence:"時系列図",architecture:"構成図",state:"状態遷移図",git:"枝分かれの図",time:"時間軸の図",tree:"木の図",lineup:"列の図"},partsHint:"押すと書く欄に足す。宣言の行は最初の段の前、段の中の行は最後の段に入る",notationHint:"行の形。書く欄の記法と同じ言葉の語で出す",parts:{box:"箱",region:"区画と箱",step:"段",edge:"線 (封筒が走る)","edge-tag":"札を運ぶ線","edge-coin":"硬貨を運ぶ線","edge-none":"何も運ばない線","edge-below":"名前を下に置く線",action:"箱の中の処理",swap:"箱の下の字の書き換え",strip:"帯の値"},syntax:{kind:"図の種類と題。最初の行に書く",view:"見せ方。書かなければ字の大きさで選ぶ",region:"区画。箱を囲む",box:"箱。名札は線と処理で使う",strip:"帯。段ごとに変わる値の欄",step:"段の題と本文",code:"段で打つ命令",source:"段の出典。読み上げの段の一覧に名前の link で出る",edge:"線。運ぶ物を書かなければ封筒が走る",carry:"線の上を運ぶ物",side:"線の名前を置く側","start-finish":"始まりと終わり。状態遷移図の線の送る側に start、受ける側に finish を書く",path:"通らない道。状態遷移図の最初の step より前に書く",branch:"枝。枝分かれの図で上から帯に並べ、段の中の from で commit から枝を切る",commit:"commit を積む。hash と一言を丸の外に添える",copy:"当て直した commit。枝の札を動かさない",merge:"merge commit。取り込む枝の先端も親に持つ",ref:"札を動かす。枝の名札か HEAD から commit へ引く",scale:"目盛り。時間軸の図で目盛りの名前と 1 つの長さと数を書く",period:"区切り。目盛りいくつかごとに名前と番号を置く",row:"印の列。目盛りごとに印を並べ、empty の目盛りを空きにする",point:"節目。目盛りの印の下に旗の丸を置く",zoom:"拡大の帯。目盛りの範囲を上の帯に列にして並べる",now:"針を進める。段の中で、その目盛りの終わりまで進める",mark:"印の色を変える。段の中で、列の目盛りの範囲を塗り直す",span:"範囲の括弧。shape: box で印の列を囲む",leaf:"葉を出す。hash に値を書くと箱に値を、下の札に名札を出す",node:"親を組む。of の後ろに子を書く。親を持たない箱は最後に根の 1 つだけ",item:"チップ。列の図で最初の step より前に宣言する。label は 4 字まで",line:"列の並びを書く。段の中で、列のチップを書いた順に並べ直す",seal:"封をする。段の中で、列の中身を隠す",open:"封を開ける。段の中で、隠した中身を戻す",pick:"列を選ぶ。選んだ列の縁に色が付き、ほかの列が薄くなる",stamp:"札を押す。段の中で、列の右に字の札を置く",action:"箱の中の処理",swap:"箱の下の小さな字の書き換え","strip-value":"帯の値",comment:"メモ。図には出ない"}},code:{file:"書類名",import:"file を取り込む (.dragon か .json)",export:"今の記法を .dragon の file に書き出す"},stage:{live:"実況表示",fontDown:"語りの字を小さくする",fontUp:"語りの字を大きくする",grid:"格子を出す",fullscreen:"全画面で見る",fit:"全体に合わせる",zoomOut:"縮小する",zoomIn:"拡大する",zoom:"表示の倍率",phase:(t,s,c)=>`段 ${t} / ${s} · ${c}`},notices:{line:t=>`${t} 行目`,count:t=>`誤り ${t} 件`,goTo:t=>`${t} 行目へ移る`},overlaps:{count:t=>`字の重なり ${t} 件`,step:t=>`段 ${t}`,goTo:t=>`段 ${t} へ移る`}},en:{title:"dragon — write it as text, get a moving diagram",tagline:"Write it as text, get a moving diagram",language:"Language",palette:"Palette",paletteNames:{clear:"Clear",paper:"Paper and ink",night:"Night gauges"},site:{nav:{home:"Home",catalog:"Catalog",editor:"Editor",docs:"Docs","release-notes":"Release notes"},navLabel:"Main navigation",openMenu:"Open navigation",closeMenu:"Close navigation",openEditor:"Open editor →",toDark:"Switch to dark",toLight:"Switch to light",home:{chip:t=>[...t,"step playback"].join(" × "),title:["","Diagrams"," beyond the template"],lead:"Write the boxes and the edges, and move them step by step. Diagrams you gave up on because the template could not hold them now build themselves from plain text.",readDocs:"Read the docs",features:{eyebrow:"Why dragon",title:"Turn your writing into diagrams that move.",items:[{title:"Write it as text",text:"Write boxes, edges and steps one line at a time. No coordinates, no hand-built parts."},{title:"Motion, step by step",text:"Switch steps and envelopes and tags run along the edges while actions play inside the boxes. Order and causality become visible."},{title:"Hand it over by URL or file",text:"Put the notation in a URL to share it, or export it to mp4, GIF, HTML or PNG with the CLI."}]},steps:{eyebrow:"3 steps",title:"Up and running in a minute.",items:[{title:"Open the editor",text:"Open the editor in your browser. Nothing to install."},{title:"Write the notation",text:"Write boxes, edges and steps one line at a time. The first line picks the diagram kind."},{title:"The diagram starts moving",text:"The live view on the right shows a diagram that moves step by step. Share it by URL, or export it to a file."}]},uses:{eyebrow:"Use cases",title:"Diagrams you can write.",more:"Browse the catalog →"},closing:{title:"Write it now, watch it move.",lead:"One notation file is all it takes. A moving diagram is yours a minute later."}},catalog:{crumb:"You are here",lead:(t,s,c)=>`The ${t} parts of the current notation, and the ${s} diagram kinds built from them. A part page shows how to write the part and how it looks; a diagram page lets you search its examples, watch them move, and open them in the editor. ${c} examples in total.`,sections:{parts:{title:"Parts",lead:"Parts that many diagrams use. Each part page shows the part in every diagram kind that can use it. Lineup diagrams draw no edges, so the edge and action parts are not part of them."},"kind-parts":{title:"Parts for one kind",lead:"Parts that only one diagram kind uses."},kinds:{title:"Diagrams",lead:"Diagrams built from the parts. Each lists the parts it uses and its examples."}},parts:{box:{name:"Box",desc:"A box line places one thing in the diagram. Write a tag and the name to show; edges use the tag."},edge:{name:"Edge",desc:"A line from the sending box to the receiving box. A step can hold any number, drawn in the order written."},"edge-label":{name:"Edge label",desc:"The name beside an edge. side puts it above, below, left or right."},carry:{name:"Carry",desc:"What runs along an edge: an envelope, a tag with a value, a coin, or nothing."},color:{name:"Color",desc:"The color role of a box or a group. Pick one of seven roles; the palette decides the actual color."},icon:{name:"Icon",desc:"A picture beside the name of a box or a group, chosen by a name such as user or db."},link:{name:"Link",desc:"Where a box leads. The box becomes a link in the drawn diagram, for example to the page that draws what is inside it. Write a path that starts with / or a URL that starts with http:// or https://."},note:{name:"Note",desc:"Small text under the name of a box or a group. A step can rewrite the small text of a box."},act:{name:"Action",desc:"Shows work done inside a box as a badge, with no edge."},strip:{name:"Strip",desc:"A strip of fields under the diagram. Each step can rewrite a field to follow what is carried."},step:{name:"Step",desc:"A step of the diagram, with its own text and command, played one at a time. view picks whether the frame follows the step or holds the whole diagram."},source:{name:"Source",desc:"A source for a step: a name and a URL, as many lines as the step needs. Sources appear as links in the step list that screen readers read, not in the diagram or the shown text."},lifeline:{name:"Lifeline",desc:"Sequence diagrams only. A line runs down from each box, and time moves down the page."},group:{name:"Group",desc:"Architecture diagrams only. The boxes between group and end sit inside one region that marks a boundary in the system."},"start-finish":{name:"Start and end",desc:"State diagrams only. Write start as the sender of a line and finish as its receiver, and the line leaves the start mark or goes into the end mark."},"side-path":{name:"Path not taken",desc:"State diagrams only. A line written before the first step is a path the object could take but does not this time, drawn dotted. A state that no step reaches becomes a dotted box inside the side path area."},branch:{name:"Branch",desc:"Git graphs only. Declare branches top to bottom with branch lines, and each gets its own lane. Inside a step, <branch> from <commit> cuts the branch at that commit."},commit:{name:"Commit",desc:"Git graphs only. commit <id> on <branch> adds a commit to the branch, with its hash and a short note beside the circle. The branch's ref, and HEAD when it points at that branch, move to the new commit."},copy:{name:"Replay",desc:"Git graphs only. Add copy <commit> after on <branch> to replay the same change as that commit, joined to it by a dotted line. Use it for commits a rebase rewrites; branch refs do not move."},merge:{name:"Merge commit",desc:"Git graphs only. Add merge <branch> after on <branch> to make a commit with two parents: the tip of the target and the tip of the merged branch. Only the target's ref moves."},scale:{name:"Scale and needle",desc:"Time diagrams only. A scale line gives the unit name, the length of one unit and the count, and lays the units out along the axis. Inside a step, now -> <unit> moves the needle at a fixed speed to the end of that unit. period adds named periods, and span adds a bracket or a box over a range."},row:{name:"Row of marks",desc:"Time diagrams only. Declare rows from top to bottom with row lines; each unit gets a thin mark, filled once the needle passes it. Units listed in empty get an empty mark, and mark inside a step recolors marks."},point:{name:"Point",desc:"Time diagrams only. point <id> at <unit> puts a flag circle under the marks of that unit. note inside a step changes its state and the color of the circle, and lines can join two points."},zoom:{name:"Zoom band",desc:"Time diagrams only. A zoom line gives a range of units, laid out as columns in the band above, with the declared boxes repeated in every column. A line joins the boxes of the column in [at: <unit>]; write into to take the receiving box from another column."},leaf:{name:"Leaf and card",desc:"Tree diagrams only. Write leaf <id> [hash: <value>] in a step and a leaf box appears in that step. A leaf with a value shows the value in the box and its id on a card below. The card is there from the first step."},node:{name:"Parent node",desc:"Tree diagrams only. Write node <id> of <child>, <child> [hash: <value>] in a step and a parent box appears over the leaves or parents written earlier, joined to them by tree lines. A line between a parent and its child runs along the tree line. Only the root is left without a parent at the end."},item:{name:"Chip",desc:"Lineup diagrams only. Write item <id>, <id> [color: <color>, label: <text>] before the first step to declare the chips the lanes hold. A chip with a color is filled with it, and a label of up to 4 characters sits on the chip."},line:{name:"Lane order",desc:"Lineup diagrams only. Write line <lane>: <chip>, <chip> in a step and the chips of that lane line up in the order written. A chip that was in another lane slides over from its seat, and a chip that was nowhere pops in. A lane holds up to 12 chips."},seal:{name:"Seal",desc:"Lineup diagrams only. Write seal <lane> in a step and a striped seal grows from the left of the lane and hides its contents. open <lane> removes the seal and brings the contents back. The order of a sealed lane cannot be written until it is opened."},pick:{name:"Pick",desc:"Lineup diagrams only. Write pick <lane> in a step and the edge of that lane lights up while the other lanes fade. A faded lane comes back when a later step rewrites its order or picks it."},stamp:{name:"Stamp",desc:"Lineup diagrams only. Write stamp <lane>: <text> in a step and a tilted stamp lands on the right of the lane. Use it for something that happens without touching the contents, such as a signature or an approval."}},kindOnly:t=>`${t} only`,partKinds:"Used in",words:"Notation",uses:"Parts this diagram uses",usesLead:"Pick a part to see how to write it and how it looks.",partSamples:"Examples that use this part",partSamplesLead:"Pick an example to open it on its diagram page.",partIcons:"Available icons",partIconsLead:t=>`Write one of these names as the icon of a box or a group to put that picture beside its name. There are ${t} icons.`,count:t=>`${t} ${t===1?"example":"examples"}`,open:"Open →",kinds:{sequence:"Follow who hands what to whom, step by step. Show a sign-in flow or the order of API calls with envelopes running along the edges.",architecture:"Draw a system as regions and boxes, and show what flows where in each step. Use it for cross-chain transfers or hand-offs between services.",state:"Follow one object as it moves between states, step by step. A tag running along the lines shows which states an order or a request passes before it closes.",git:"Follow commits piling up on git branches and coming together through a rebase or a merge commit, step by step. Tags above the circles show which commit each branch and HEAD point at.",time:"Follow what happens when on time cut into fixed units, step by step. For mechanisms where time itself matters, like block finality or a withdrawal wait, a moving needle and filling marks show it.",tree:"Build boxes that branch into parents and children from the leaves up to the root, then follow the path between root and leaf step by step. For mechanisms like a Merkle tree, where a few values prove the whole, tags running along the tree lines show it.",lineup:"Line chips up in long lanes and follow how their order changes, step by step. For mechanisms where order and hidden contents matter, like an auction that decides what goes in a block, chips sliding between lanes and seals show it."},total:t=>`${t} ${t===1?"example":"examples"}`,showing:t=>`showing ${t}`,search:"Search (name / description)",searchLabel:"Search the examples",clearSearch:"Clear the search",list:"Example list",nothing:"No example matches",preview:"Diagram",views:"What to show",figure:"Diagram",code:"Code",sameAsSite:"Same as the site",expand:"Enlarge",expandLabel:t=>`Enlarge ${t}`,close:"Close",openEditor:"Open in the editor →",source:"Notation for this diagram",copy:"Copy the code",copied:"Copied"},screens:{catalog:{title:"Catalog"},editor:{title:"Editor",lead:""},docs:{title:"Docs"},"release-notes":{title:"Release notes"},"not-found":{title:"That page has not been written yet."}},releaseNotes:{crumb:"Breadcrumb",eyebrow:t=>`Release log • ${t} is current`,accent:"notes",lead:"Shows the current dragon version. The detailed record for each version is in CHANGELOG.md on GitHub.",changelog:"See the change log on GitHub"},notFound:{em:"That page",lead:t=>`The page you are looking for was moved, deleted, or never existed. Try one of dragon's ${t} entry points.`,catalog:"Browse the catalog",docs:"Read the docs"}},notation:"Notation",editor:"Diagram notation",fold:"Hide",unfold:"Show",readable:(t,s)=>`Reads fine — ${t} ${t===1?"box":"boxes"}, ${s} ${s===1?"step":"steps"}`,notJson:t=>`Not valid JSON — ${t}`,cannotDraw:t=>`Cannot draw — ${t}`,kept:"Showing the last diagram that drew",exportLead:"Export the same diagram",exportTail:"to mp4 / GIF / HTML / PNG",shelf:{label:"Shelf",open:"Open the shelf",close:"Close the shelf",newFile:"New file",tabs:{samples:"Samples",parts:"Parts",notation:"Notation"},filter:"Filter…",filterLabel:"Filter the list",nothing:"Nothing matches",kinds:{sequence:"Sequence",architecture:"Architecture",state:"State",git:"Git graph",time:"Time diagram",tree:"Tree diagram",lineup:"Lineup"},partsHint:"Click to add to the editor. Declarations go before the first step, step lines go to the last step",notationHint:"Line shapes, in the words of the notation you are writing",parts:{box:"Box",region:"Region with a box",step:"Step",edge:"Edge (an envelope runs)","edge-tag":"Edge carrying a tag","edge-coin":"Edge carrying a coin","edge-none":"Edge carrying nothing","edge-below":"Edge with its label below",action:"Action inside a box",swap:"Rewrite the text under a box",strip:"Strip value"},syntax:{kind:"Diagram kind and title, on the first line",view:"View. Chosen by text size when left out",region:"Region around boxes",box:"Box. Its id is used by edges and actions",strip:"Strip, the fields whose values change per step",step:"Step title and body",code:"Command run in the step",source:"Source of the step. Shown as a link in the step list that screen readers read",edge:"Edge. An envelope runs when nothing is carried",carry:"What runs along the edge",side:"Where the edge label sits","start-finish":"Start and end. In a state diagram, write start as a line's sender and finish as its receiver",path:"Path not taken. In a state diagram, write it before the first step",branch:"Branch. In a git graph, lanes go top to bottom; from inside a step cuts a branch at a commit",commit:"Add a commit, with its hash and a short note beside the circle",copy:"Replayed commit. Branch refs do not move",merge:"Merge commit. The merged branch's tip is a parent too",ref:"Move a ref, from a branch id or HEAD to a commit",scale:"Scale. In a time diagram, give the unit name, the length of one unit and the count",period:"Period. A name and number every few units",row:"Row of marks. One mark per unit; units in empty stay empty",point:"Point. A flag circle under the marks of a unit",zoom:"Zoom band. A range of units laid out as columns above",now:"Move the needle to the end of a unit, inside a step",mark:"Recolor marks. Inside a step, repaint a range of a row",span:"Range bracket. shape: box draws a box around the rows",leaf:"Add a leaf. With a hash, the box shows the value and a card below shows the id",node:"Build a parent. List its children after of. Only the root is left without a parent at the end",item:"Chip. In a lineup diagram, declare it before the first step. A label is up to 4 characters",line:"Write a lane's order. Inside a step, the chips line up in the order written",seal:"Seal a lane. Inside a step, hide its contents",open:"Open a seal. Inside a step, bring the hidden contents back",pick:"Pick a lane. Its edge lights up and the other lanes fade",stamp:"Stamp a lane. Inside a step, put a text stamp on the right of the lane",action:"Action inside a box",swap:"Rewrite the small text under a box","strip-value":"Strip value",comment:"Memo. Not drawn"}},code:{file:"File name",import:"Import a file (.dragon or .json)",export:"Export the notation as a .dragon file"},stage:{live:"Live preview",fontDown:"Smaller narration text",fontUp:"Larger narration text",grid:"Show the grid",fullscreen:"Full screen",fit:"Fit to the frame",zoomOut:"Zoom out",zoomIn:"Zoom in",zoom:"Zoom level",phase:(t,s,c)=>`Step ${t} / ${s} · ${c}`},notices:{line:t=>`Line ${t}`,count:t=>`${t} ${t===1?"error":"errors"}`,goTo:t=>`Go to line ${t}`},overlaps:{count:t=>`${t} text ${t===1?"overlap":"overlaps"}`,step:t=>`Step ${t}`,goTo:t=>`Go to step ${t}`}}};function lw(t){return t[0]?.toLowerCase().startsWith("ja")?"ja":"en"}const ha=Object.keys(Et.ja.shelf.kinds),ip=t=>ha.some(s=>s===t),zg=t=>Yi.filter(s=>fs(s,"ja")?.kind===t),Rd="n=";function rp(t){let s="";for(const c of new TextEncoder().encode(t))s+=String.fromCharCode(c);return`#${Rd}${btoa(s).replaceAll("+","-").replaceAll("/","_").replace(/=+$/u,"")}`}function Fg(t){if(t.startsWith(`#${Rd}`))try{const s=atob(t.slice(Rd.length+1).replaceAll("-","+").replaceAll("_","/"));return new TextDecoder("utf-8",{fatal:!0}).decode(Uint8Array.from(s,c=>c.charCodeAt(0)))}catch{return}}const ds="/dragon/",Tt={home:ds,catalog:`${ds}catalog`,editor:`${ds}editor`,docs:`${ds}docs`,"release-notes":`${ds}release-notes`},lp="https://github.com/cardene777/dragon",cw={catalog:"catalog",editor:"editor",docs:"docs","release-notes":"release-notes"};function Lg(t){if(`${t}/`===ds)return{screen:"home"};if(!t.startsWith(ds))return{screen:"not-found"};const s=t.slice(ds.length).split("/").filter(Boolean),[c,d,p]=s;if(c===void 0)return{screen:"home"};if(c==="catalog"&&d!==void 0&&s.length===2)return{screen:"category",category:decodeURIComponent(d)};if(c==="catalog"&&d==="part"&&p!==void 0&&s.length===3)return{screen:"part",part:decodeURIComponent(p)};const a=cw[c];return a!==void 0&&s.length===1?{screen:a}:{screen:"not-found"}}function uw(){Lg(location.pathname).screen==="home"&&Fg(location.hash)!==void 0&&history.replaceState(null,"",`${Tt.editor}${location.search}${location.hash}`)}const zd=new Set;function dw(t){return zd.add(t),addEventListener("popstate",t),()=>{zd.delete(t),removeEventListener("popstate",t)}}function pw(){return qe.useSyncExternalStore(dw,()=>location.pathname)}function hw(t){const s=new URL(t,location.href);if(s.pathname!==location.pathname||s.hash!==""&&s.hash!==location.hash){history.pushState(null,"",`${s.pathname}${s.hash}`);for(const c of zd)c()}scrollTo(0,0)}function jt(t,s){t.button!==0||t.metaKey||t.ctrlKey||t.shiftKey||t.altKey||(t.preventDefault(),hw(t.currentTarget.href),s?.())}const fw=`architecture 箱の中の処理

box アプリ
box サーバー

step 送る
  say アプリが署名した注文をサーバーへ送る。
  アプリ -> サーバー: 注文

step 確かめる
  say act で、線を引かずに箱の中で起きる処理を見せる。
  act サーバー: 署名を確かめる

step 返す
  say 処理の後に線を続けられる。
  サーバー -> アプリ: 受け付けた
`,mw=`architecture Action

box app as App
box server as Server

step Send
  say The app sends a signed order to the server.
  app -> server: order

step Check
  say act shows work done inside a box, with no edge.
  act server: check signature

step Reply
  say Edges can follow the action.
  server -> app: accepted
`,gw=`git 箱の中の処理

branch main

box 作業ツリー

step 積む
  say main に A を積む。
  commit A on main

step 確かめる
  say act で、commit を積まずに箱の中で起きる処理を見せる。
  act 作業ツリー: 検査を回す

step 続ける
  say 処理の後に commit を続けられる。
  commit B on main
`,yw=`git Action

branch main

box worktree as Worktree

step Commit
  say Add A on main.
  commit A on main

step Check
  say act shows work done inside a box without adding a commit.
  act worktree: Run the checks

step Go on
  say A commit can follow the action.
  commit B on main
`,bw=`sequence 箱の中の処理

box アプリ
box サーバー

step 送る
  say アプリが署名した注文をサーバーへ送る。
  アプリ -> サーバー: 注文

step 確かめる
  say act で、線を引かずに箱の中で起きる処理を見せる。
  act サーバー: 署名を確かめる

step 返す
  say 処理の後に線を続けられる。
  サーバー -> アプリ: 受け付けた
`,vw=`sequence Action

box app as App
box server as Server

step Send
  say The app sends a signed order to the server.
  app -> server: order

step Check
  say act shows work done inside a box, with no edge.
  act server: check signature

step Reply
  say Edges can follow the action.
  server -> app: accepted
`,xw=`state 箱の中の処理

box 受付
box 確認中
box 承認

step 出す
  say 申請が届き、確認中に移る。
  受付 -> 確認中: 申請する

step 確かめる
  say act で、状態を移らずに箱の中で起きる処理を見せる。
  act 確認中: 書類を照らし合わせる

step 通す
  say 処理の後に線を続けられる。
  確認中 -> 承認: 承認する
`,ww=`state Action

box received as Received
box checking as Checking
box approved as Approved

step Submit
  say The request arrives and moves to Checking.
  received -> checking: submit

step Check
  say act shows work done inside the box without moving to another state.
  act checking: match the papers

step Approve
  say An edge can follow the work.
  checking -> approved: approve
`,kw=`time 処理

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者 [icon: user]
box ブロック [icon: box]

step 処理する
  say act で、箱が自分で行う処理を箱の下の字に出す。
  act 提案者: ブロックを作る

step 渡す
  say 処理の後に線を引くと、作った物が次の箱へ届く。
  提案者 -> ブロック [at: 0]
  now -> 0
`,Ew=`time Action

scale slot 12s 6
row block
zoom 0-2

box proposer [icon: user]
box block [icon: box]

step Act
  say act shows what a box does by itself, in the small text under it.
  act proposer: build a block

step Hand over
  say Draw a line after the action, and what it made reaches the next box.
  proposer -> block [at: 0]
  now -> 0
`,Aw=`tree 箱の中の処理

box 記録

step 葉を出す
  say 葉を2つ出す。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 確かめる
  say act で、箱を足さずに箱の中で起きる処理を見せる。
  act 記録: 値を確かめる

step 組む
  say 処理の後に親を組める。
  node 根 of 取引1, 取引2 [hash: 7a21]
`,_w=`tree Work in a box

box ledger as Ledger

step Add leaves
  say Add two leaves.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Check
  say act shows work happening inside a box without adding a box.
  act ledger: Check the values

step Join
  say The tree can grow again after the work.
  node root of tx1, tx2 [hash: 7a21]
`,Sw=`architecture 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,$w=`architecture Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,Nw=`git 箱

branch main

box 作業ツリー [note: 手元のファイル]

step 積む
  say box の行で、枝の帯の横に物を 1 つ置く。commit の外で変わる物に使う。
  commit A on main [hash: 3fa0c19]
  note 作業ツリー: A の中身

step 進める
  say 段の中の note の行で、箱の下の小さな字を書き換える。
  commit B on main [hash: 8b04f71]
  note 作業ツリー: B の中身
`,Dw=`git Box

branch main

box worktree as Worktree [note: Local files]

step Commit
  say A box line places one thing beside the branch lanes. Use it for things that change outside commits.
  commit A on main [hash: 3fa0c19]
  note worktree: A's files

step Move on
  say A note line inside a step rewrites the small text under the box.
  commit B on main [hash: 8b04f71]
  note worktree: B's files
`,Tw=`lineup 箱

box 待ち [note: 3件]
box 箱詰め

item 甲, 乙, 丙

step 並べる
  say box の行が列になり、宣言した順に上から同じ幅で並ぶ。
  line 待ち: 甲, 乙, 丙

step 移す
  say 段の中の note の行で、列の右上の字を書き換える。
  line 箱詰め: 甲, 乙
  line 待ち: 丙
  note 待ち: 1件
  note 箱詰め: 2件
`,Cw=`lineup Boxes

box waiting as Waiting [note: 3 items]
box packed as Packed

item a, b, c

step Line up
  say Each box line becomes a lane, stacked top to bottom in the order declared, all the same width.
  line waiting: a, b, c

step Move
  say A note line inside a step rewrites the text at the top right of a lane.
  line packed: a, b
  line waiting: c
  note waiting: 1 item
  note packed: 2 items
`,Ow=`sequence 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,Mw=`sequence Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,Bw=`state 箱

box 下書き
box 公開中 as 公開している

step 公開する
  say box の行で状態を 1 つ置く。as の後ろに見せる名前を書く。
  下書き -> 公開中: 公開する

step 戻す
  say 線は状態の名札で書く。
  公開中 -> 下書き: 取り下げる
`,jw=`state Box

box draft as Draft
box live as Published

step Publish
  say A box line places one state. The name to show follows as.
  draft -> live: publish

step Withdraw
  say Edges name the states by their tags.
  live -> draft: withdraw
`,qw=`time 箱

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者
box ブロック

step 出す
  say box の行で、拡大の帯の列ごとに同じ箱を並べる。
  提案者 -> ブロック [at: 0]
  now -> 0

step 進める
  say 箱は 1 度宣言すれば、どの列にも同じ並びで出る。
  提案者 -> ブロック [at: 1]
  now -> 1
`,Rw=`time Box

scale slot 12s 6
row block
zoom 0-2

box proposer
box block

step Propose
  say A box line puts the same box in every column of the zoom band.
  proposer -> block [at: 0]
  now -> 0

step Next
  say Declare a box once, and it shows in every column in the same order.
  proposer -> block [at: 1]
  now -> 1
`,zw=`tree 箱

box 記録 [note: まだ無い]

step 葉を出す
  say box の行で、木の右に物を1つ置く。木の外で変わる物に使う。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  note 記録: 葉が2つ

step 組む
  say 段の中の note の行で、箱の下の小さな字を書き換える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 記録: 根 7a21
`,Fw=`tree Boxes

box ledger as Ledger [note: empty]

step Add leaves
  say A box line places one thing to the right of the tree. Use it for what changes outside the tree.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  note ledger: 2 leaves

step Join
  say A note line inside a step rewrites the small text under a box.
  node root of tx1, tx2 [hash: 7a21]
  note ledger: root 7a21
`,Lw=`git 枝

branch main [note: 取り込む先]
branch topic [note: 作業の枝]

step 宣言する
  say branch の行で枝を上から順に宣言し、枝ごとに帯を並べる。note で帯に添え書きを付ける。
  commit A on main
  commit B on main

step 枝を切る
  say 段の中で <枝> from <commit> と書くと、その commit から枝を切り、HEAD がその枝へ移る。
  topic from A
  commit C on topic
`,Hw=`git Branch

branch main [note: Merge target]
branch topic [note: Work branch]

step Declare
  say Declare branches top to bottom with branch lines, and each gets a lane. note adds a note to the lane.
  commit A on main
  commit B on main

step Cut
  say Inside a step, <branch> from <commit> cuts the branch at that commit, and HEAD moves to the branch.
  topic from A
  commit C on topic
`,Pw=`architecture 運ぶ物

box 財布
box 店

step 封筒
  say 何も書かなければ、線の上を封筒が走る。
  財布 -> 店: 注文

step 札
  say tag で、線の上を走る札に値を書く。
  店 -> 財布: 請求 [tag: #42]

step 硬貨
  say carry: coin で、お金が動くことを硬貨で見せる。
  財布 -> 店: 払う [carry: coin]

step 運ばない
  say carry: none で、線だけを引いて何も走らせない。
  店 -> 財布: 受け取った [carry: none]
`,Uw=`architecture Carry

box wallet as Wallet
box shop as Shop

step Envelope
  say With nothing written, an envelope runs along the edge.
  wallet -> shop: order

step Tag
  say tag writes a value on a tag that runs along the edge.
  shop -> wallet: bill [tag: #42]

step Coin
  say carry: coin shows money moving as a coin.
  wallet -> shop: pay [carry: coin]

step Nothing
  say carry: none draws the edge and runs nothing along it.
  shop -> wallet: received [carry: none]
`,Gw=`git 運ぶ物

branch main

step 積む
  say main に A と B と C を積む。
  commit A on main
  commit B on main
  commit C on main

step 動かす札
  say 何も書かなければ、動かす札 (枝の名前か HEAD) が線を走る。
  HEAD -> A

step 札
  say tag で、線の上を走る札に値を書く。動かす札は着いた所へ移る。
  HEAD -> B [tag: 切り替え]

step 硬貨
  say carry: coin で、線の上に硬貨を走らせる。
  HEAD -> C [carry: coin]

step 運ばない
  say carry: none で、線だけを引いて何も走らせない。
  HEAD -> A [carry: none]
`,Yw=`git Carry

branch main

step Commit
  say Add A, B and C on main.
  commit A on main
  commit B on main
  commit C on main

step The moving ref
  say Without carry, the moving ref (a branch name or HEAD) runs along the line.
  HEAD -> A

step Tag
  say tag writes a value on a tag that runs along the line. The moving ref moves to the end.
  HEAD -> B [tag: switch]

step Coin
  say carry: coin runs a coin along the line.
  HEAD -> C [carry: coin]

step Nothing
  say carry: none draws only the line and runs nothing.
  HEAD -> A [carry: none]
`,Vw=`sequence 運ぶ物

box 財布
box 店

step 封筒
  say 何も書かなければ、線の上を封筒が走る。
  財布 -> 店: 注文

step 札
  say tag で、線の上を走る札に値を書く。
  店 -> 財布: 請求 [tag: #42]

step 硬貨
  say carry: coin で、お金が動くことを硬貨で見せる。
  財布 -> 店: 払う [carry: coin]

step 運ばない
  say carry: none で、線だけを引いて何も走らせない。
  店 -> 財布: 受け取った [carry: none]
`,Xw=`sequence Carry

box wallet as Wallet
box shop as Shop

step Envelope
  say With nothing written, an envelope runs along the edge.
  wallet -> shop: order

step Tag
  say tag writes a value on a tag that runs along the edge.
  shop -> wallet: bill [tag: #42]

step Coin
  say carry: coin shows money moving as a coin.
  wallet -> shop: pay [carry: coin]

step Nothing
  say carry: none draws the edge and runs nothing along it.
  shop -> wallet: received [carry: none]
`,Jw=`state 運ぶ物

box 注文済み
box 支払い待ち
box 完了

step 封筒
  say 何も書かなければ、線の上を封筒が走る。
  注文済み -> 支払い待ち: 決済へ

step 札
  say tag で、線の上を走る札に値を書く。
  支払い待ち -> 注文済み: 差し戻す [tag: #42]

step 硬貨
  say carry: coin で、お金が動くことを硬貨で見せる。
  注文済み -> 支払い待ち: 払う [carry: coin]

step 運ばない
  say carry: none で、線だけを引いて何も走らせない。
  支払い待ち -> 完了: 閉じる [carry: none]
`,Qw=`state Carry

box ordered as Ordered
box paying as Awaiting payment
box done as Done

step Envelope
  say With nothing written, an envelope runs along the edge.
  ordered -> paying: check out

step Tag
  say tag writes a value on a tag that runs along the edge.
  paying -> ordered: send back [tag: #42]

step Coin
  say carry: coin shows money moving as a coin.
  ordered -> paying: pay [carry: coin]

step Nothing
  say carry: none draws the edge and runs nothing along it.
  paying -> done: close [carry: none]
`,Zw=`time 運ぶ物

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者 [icon: user]
box ブロック [icon: box]
box 委員会

step 封筒
  say carry を書かなければ、線の上を封筒が走る。
  提案者 -> ブロック [at: 0]
  now -> 0

step 札
  say tag で、線の上を走る札に字を書く。
  委員会 -> ブロック [at: 1, tag: 票]
  now -> 1

step 硬貨
  say carry: coin で硬貨を走らせ、carry: none で線だけを引く。
  提案者 -> ブロック [at: 2, carry: coin]
  委員会 -> ブロック [at: 2, carry: none]
  now -> 2
`,Kw=`time Carry

scale slot 12s 6
row block
zoom 0-2

box proposer [icon: user]
box block [icon: box]
box committee

step Envelope
  say Without carry, an envelope runs along the line.
  proposer -> block [at: 0]
  now -> 0

step Tag
  say tag writes a value on a tag that runs along the line.
  committee -> block [at: 1, tag: vote]
  now -> 1

step Coin
  say carry: coin runs a coin, and carry: none draws only the line.
  proposer -> block [at: 2, carry: coin]
  committee -> block [at: 2, carry: none]
  now -> 2
`,Ww=`tree 運ぶ物

step 組む
  say 葉を2つ出して、親を組む。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  node 根 of 取引1, 取引2 [hash: 7a21]

step 封筒
  say 何も書かなければ、封筒が線の上を走る。
  取引1 -> 根

step 札
  say tag で、線の上を走る札に値を書く。
  取引2 -> 根 [tag: 8b04]

step 硬貨
  say carry: coin で、線の上に硬貨を走らせる。
  根 -> 取引1 [carry: coin]

step 運ばない
  say carry: none で、線だけを引いて何も走らせない。
  根 -> 取引2 [carry: none]
`,Iw=`tree What travels

step Join
  say Add two leaves and join them under a parent.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  node root of tx1, tx2 [hash: 7a21]

step Envelope
  say With nothing written, an envelope runs along the line.
  tx1 -> root

step Tag
  say tag writes a value on a tag that runs along the line.
  tx2 -> root [tag: 8b04]

step Coin
  say carry: coin runs a coin along the line.
  root -> tx1 [carry: coin]

step Nothing
  say carry: none draws the line with nothing on it.
  root -> tx2 [carry: none]
`,e2=`architecture 色の役

group 手元 as 手元の端末 [color: slate]
  box 利用者 [color: slate]
end

group 店 as 店の仕組み [color: blue]
  box アプリ [color: blue]
  box 決済 [color: coin]
end

step 頼む
  say 箱と区画は同じ 7 つの役から色を選ぶ。
  利用者 -> アプリ: 買う

step 払う
  say 区画の中の箱にも、区画と違う役を付けられる。
  アプリ -> 決済: 請求
`,t2=`architecture Color

group device as Device [color: slate]
  box user as User [color: slate]
end

group shop as Shop system [color: blue]
  box app as App [color: blue]
  box pay as Payment [color: coin]
end

step Ask
  say Boxes and groups pick their color from the same seven roles.
  user -> app: buy

step Pay
  say A box inside a group can take a different role from its group.
  app -> pay: bill
`,n2=`git 色の役

branch main

box 作業ツリー [color: violet]
box 置き場 [color: amber]

step 積む
  say color で、箱に 7 つの役から色を選ぶ。枝の帯の色は上から順に配る。
  commit A on main
  note 作業ツリー: 変えた

step 控える
  say 役は意味で選ぶ。手元の物は violet、控えは amber のように揃える。
  commit B on main
  note 置き場: 控えた
`,a2=`git Color

branch main

box worktree as Worktree [color: violet]
box stash as Stash [color: amber]

step Commit
  say color picks one of seven roles for a box. Branch lanes get their colors in order from the top.
  commit A on main
  note worktree: Changed

step Stash
  say Pick roles by meaning: violet for what is at hand, amber for what is set aside.
  commit B on main
  note stash: Stashed
`,s2=`lineup 色の役

box 待ち
box 選んだ列 [color: amber]

item 自分 [color: amber]
item 甲, 乙

step 並べる
  say color で、列とチップに7つの役から色を選ぶ。
  line 待ち: 甲, 自分, 乙

step 選ぶ
  say 色を付けた列は、選んだ時に縁がその色になる。役は意味で選び、自分の分を amber で揃える。
  line 選んだ列: 自分, 甲
  pick 選んだ列
`,o2=`lineup Color

box waiting as Waiting
box chosen as Chosen [color: amber]

item mine [color: amber]
item a, b

step Line up
  say color picks one of seven roles for a lane or a chip.
  line waiting: a, mine, b

step Pick
  say A lane with a color lights up its edge in that color when picked. Pick roles by meaning, such as amber for your own chip.
  line chosen: mine, a
  pick chosen
`,i2=`sequence 色の役

box 利用者 [color: slate]
box アプリ [color: blue]
box 決済 [color: coin]
box 倉庫 [color: green]

step 頼む
  say color で箱に色の役を付ける。役は blue や coin など 7 つ。
  利用者 -> アプリ: 買う

step 払う
  say 色は色味ごとに決まり、役が同じ箱は同じ色で描く。
  アプリ -> 決済: 請求
  アプリ -> 倉庫: 出荷
`,r2=`sequence Color

box user as User [color: slate]
box app as App [color: blue]
box pay as Payment [color: coin]
box store as Warehouse [color: green]

step Ask
  say color gives a box one of seven roles, such as blue or coin.
  user -> app: buy

step Pay
  say The palette sets the colors. Boxes with one role share a color.
  app -> pay: bill
  app -> store: ship
`,l2=`state 色の役

box 下書き [color: slate]
box 審査中 [color: amber]
box 公開中 [color: green]

step 出す
  say color で、状態の箱に 7 つの役から色を選ぶ。
  下書き -> 審査中: 審査に出す

step 通る
  say 役は意味で選ぶ。待つ状態は amber、終えた状態は green のように揃える。
  審査中 -> 公開中: 通す
`,c2=`state Color

box draft as Draft [color: slate]
box review as In review [color: amber]
box live as Published [color: green]

step Submit
  say color picks one of 7 roles for a state box.
  draft -> review: submit

step Approve
  say Pick roles by meaning, such as amber for waiting states and green for finished ones.
  review -> live: approve
`,u2=`time 色

scale slot 12s 6
row ブロック [color: blue]
zoom 0-2

box 提案者 [color: violet]
box ブロック [color: blue]

step 色を付ける
  say color で箱に色の役を付ける。線は送る側の箱の色で引く。
  提案者 -> ブロック [at: 0]
  now -> 0

step 印の列
  say 印の列にも color を書くと、塗る印がその色になる。
  提案者 -> ブロック [at: 1]
  now -> 1
`,d2=`time Color

scale slot 12s 6
row block [color: blue]
zoom 0-2

box proposer [color: violet]
box block [color: blue]

step Add color
  say color gives a box a color role. A line takes the color of the box that sends it.
  proposer -> block [at: 0]
  now -> 0

step Row of marks
  say Write color on a row too, and its marks fill in that color.
  proposer -> block [at: 1]
  now -> 1
`,p2=`tree 色の役

box 記録 [color: violet]
box 控え [color: amber]

step 葉を出す
  say color で、箱に7つの役から色を選ぶ。木の箱の色は決まっている。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  note 記録: 葉が2つ

step 組む
  say 役は意味で選ぶ。元の記録は violet、控えは amber のように揃える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 控え: 根 7a21
`,h2=`tree Color roles

box ledger as Ledger [color: violet]
box backup as Backup [color: amber]

step Add leaves
  say color picks one of 7 roles for a box. Tree boxes have fixed colors.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  note ledger: 2 leaves

step Join
  say Pick roles by meaning: violet for the original and amber for the backup, say.
  node root of tx1, tx2 [hash: 7a21]
  note backup: root 7a21
`,f2=`git commit

branch main

step 積む
  say commit <名札> on <枝> で枝に commit を積む。積んだ枝の札が新しい commit へ進む。
  commit A on main
  commit B on main

step 字を添える
  say hash と note で、丸の外に hash と一言を添える。
  commit C on main [hash: c41d0e5, note: 価格を丸める]
`,m2=`git Commit

branch main

step Commit
  say commit <id> on <branch> adds a commit to the branch. The branch's ref moves to the new commit.
  commit A on main
  commit B on main

step Add text
  say hash and note put a hash and a short note beside the circle.
  commit C on main [hash: c41d0e5, note: Round prices]
`,g2=`git 当て直し

branch main
branch topic

step 分かれる
  say main と topic にそれぞれ commit を積む。
  commit A on main
  topic from A
  commit C on topic
  commit B on main

step 当て直す
  say HEAD を B へ移し、copy で C の変更を B の上に当て直す。枝の札は動かない。
  HEAD -> B
  commit C' on main copy C

step 枝を移す
  say topic を C' へ動かすと、元の C はどの札からも辿れなくなり、点線の丸に変わる。
  topic -> C'
`,y2=`git Replay

branch main
branch topic

step Diverge
  say Add a commit on each of main and topic.
  commit A on main
  topic from A
  commit C on topic
  commit B on main

step Replay
  say Move HEAD to B, and copy replays the change in C on top of B. Branch refs do not move.
  HEAD -> B
  commit C' on main copy C

step Move the branch
  say Move topic to C', and the old C is no longer reached by any ref, so it turns into a dotted circle.
  topic -> C'
`,b2=`architecture 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,v2=`architecture Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,x2=`git 線の名前

branch main

step 積む
  say main に A と B を積む。
  commit A on main
  commit B on main

step 上に置く
  say コロンの後ろが線の名前。書かなければ札の上に置く。
  HEAD -> A: 切り離す

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  HEAD -> B: 戻る [side: below]
`,w2=`git Edge label

branch main

step Commit
  say Add A and B on main.
  commit A on main
  commit B on main

step Above
  say The text after the colon is the label. Without side it sits above the tags.
  HEAD -> A: detach

step Below
  say side picks where the label sits: above, below, left or right.
  HEAD -> B: go back [side: below]
`,k2=`sequence 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。横の線は above か below。
  乙 -> 甲: 下の名前 [side: below]
`,E2=`sequence Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above or below.
  b -> a: label below [side: below]
`,A2=`state 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,_2=`state Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,S2=`time 線の名前

scale epoch 6.4min 4
row 確定
point A at 0
point B at 2

step 下に置く
  say コロンの後ろが線の名前。節目どうしの線は、書かなければ線の下に置く。
  note A: 正当化 [color: violet]
  A -> B: 2/3 を超えた [carry: none]

step 上に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  note B: 正当化 [color: violet]
  A -> B: 次の epoch [carry: none, side: above]
`,$2=`time Edge label

scale epoch 6.4min 4
row final
point A at 0
point B at 2

step Below
  say The text after the colon is the label. A line between points puts it below unless you say otherwise.
  note A: Justified [color: violet]
  A -> B: over 2/3 [carry: none]

step Above
  say side picks where the label sits: above, below, left or right.
  note B: Justified [color: violet]
  A -> B: next epoch [carry: none, side: above]
`,N2=`tree 線の名前

box 記録

step 組む
  say 葉を2つ出して、親を組む。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  node 根 of 取引1, 取引2 [hash: 7a21]

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  根 -> 記録: 残す

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の4つ。
  記録 -> 根: 照らす [side: below]
`,D2=`tree Line names

box ledger as Ledger

step Join
  say Add two leaves and join them under a parent.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  node root of tx1, tx2 [hash: 7a21]

step Above
  say The text after the colon names the line. Without side it goes above the line.
  root -> ledger: Keep

step Below
  say side picks where the name goes: above, below, left or right.
  ledger -> root: Check [side: below]
`,T2=`architecture 線

box ブラウザ
box サーバー
box DB

step 呼ぶ
  say 線は送る側の名札から受ける側の名札へ -> で引く。
  ブラウザ -> サーバー: GET /items

step 読む
  say 1 つの段に線を何本でも並べられる。書いた順に引く。
  サーバー -> DB: SELECT
  DB -> サーバー: 行

step 返す
  say 返す線は逆向きに書く。
  サーバー -> ブラウザ: 200 OK
`,C2=`architecture Edge

box browser as Browser
box server as Server
box db as DB

step Call
  say An edge runs from the sender tag to the receiver tag with ->.
  browser -> server: GET /items

step Read
  say One step can hold any number of edges, drawn in the order written.
  server -> db: SELECT
  db -> server: rows

step Reply
  say Write the reply the other way round.
  server -> browser: 200 OK
`,O2=`git 線

branch main
branch topic

step 積む
  say main に A と B を積み、A から切った topic に C を積む。
  commit A on main
  commit B on main
  topic from A
  commit C on topic

step HEAD を動かす
  say 線は札の名前から commit の名札へ -> で引き、その札を commit へ動かす。HEAD から引くと、HEAD が枝から離れる。
  HEAD -> B

step 枝の札を動かす
  say 枝の札も同じ形で動かす。札を動かす線は commit を作らない。
  main -> C
`,M2=`git Edge

branch main
branch topic

step Commit
  say Add A and B on main, cut topic at A, and add C on topic.
  commit A on main
  commit B on main
  topic from A
  commit C on topic

step Move HEAD
  say Draw a line with -> from a ref name to a commit id, and the ref moves there. A line from HEAD detaches HEAD from its branch.
  HEAD -> B

step Move a branch
  say A branch ref moves the same way. A line that moves a ref makes no commit.
  main -> C
`,B2=`sequence 線

box ブラウザ
box サーバー
box DB

step 呼ぶ
  say 線は送る側の名札から受ける側の名札へ -> で引く。
  ブラウザ -> サーバー: GET /items

step 読む
  say 1 つの段に線を何本でも並べられる。書いた順に引く。
  サーバー -> DB: SELECT
  DB -> サーバー: 行

step 返す
  say 返す線は逆向きに書く。
  サーバー -> ブラウザ: 200 OK
`,j2=`sequence Edge

box browser as Browser
box server as Server
box db as DB

step Call
  say An edge runs from the sender tag to the receiver tag with ->.
  browser -> server: GET /items

step Read
  say One step can hold any number of edges, drawn in the order written.
  server -> db: SELECT
  db -> server: rows

step Reply
  say Write the reply the other way round.
  server -> browser: 200 OK
`,q2=`state 線

box 受付
box 対応中
box 解決

step 割り当てる
  say 線は移る前の状態の名札から、移った後の状態の名札へ -> で引く。
  受付 -> 対応中: 担当を付ける

step 解く
  say 段ごとに、その段で移る線を書く。
  対応中 -> 解決: 直した

step 開き直す
  say 前の状態へ戻る線も同じ形で書く。
  解決 -> 対応中: 再び開く
`,R2=`state Edge

box open as Open
box working as In progress
box solved as Solved

step Assign
  say An edge runs with -> from the state before the move to the state after it.
  open -> working: assign

step Solve
  say Each step writes the edges it moves along.
  working -> solved: fixed

step Reopen
  say An edge back to an earlier state is written the same way.
  solved -> working: reopen
`,z2=`time 線

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者
box ブロック

step 列の線
  say at の列の箱どうしを線で結ぶ。運ぶ物を書かなければ封筒が走る。
  提案者 -> ブロック [at: 0]
  now -> 0

step 次の列
  say 針は、その列の線が届くまで目盛りの中で待つ。
  提案者 -> ブロック [at: 1]
  now -> 1
`,F2=`time Edge

scale slot 12s 6
row block
zoom 0-2

box proposer
box block

step Column line
  say A line joins the boxes of the column in at. Without carry, an envelope runs along it.
  proposer -> block [at: 0]
  now -> 0

step Next column
  say The needle waits in the unit until the line of that column arrives.
  proposer -> block [at: 1]
  now -> 1
`,L2=`tree 線

box 記録

step 組む
  say 葉を2つ出して、親を組む。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  node 根 of 取引1, 取引2 [hash: 7a21]

step 親へ運ぶ
  say 線は名札から名札へ -> で引く。親子の箱どうしの線は木の線の上を走る。
  取引1 -> 根

step 箱へ送る
  say 親子でない箱どうしの線は、箱の向き合う辺を結ぶ。
  根 -> 記録
`,H2=`tree Lines

box ledger as Ledger

step Join
  say Add two leaves and join them under a parent.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  node root of tx1, tx2 [hash: 7a21]

step Up to the parent
  say Draw a line from id to id with ->. A line between a parent and its child runs along the tree line.
  tx1 -> root

step Over to the box
  say A line between boxes that are not parent and child joins their facing sides.
  root -> ledger
`,P2=`architecture 区画

group 手元 as 手元の端末 [note: 利用者の側, color: slate, icon: user]
  box ブラウザ
end

group 雲 as クラウド [note: サービスの側, color: blue, icon: cloud]
  box アプリ
  box DB
end

step 開く
  say group から end までの箱を 1 つの区画に囲む。
  ブラウザ -> アプリ: 開く

step 読む
  say 区画にも、名前の下の小さな字と色の役と絵を付けられる。
  アプリ -> DB: 読む
`,U2=`architecture Group

group device as Device [note: the user side, color: slate, icon: user]
  box browser as Browser
end

group cloud as Cloud [note: the service side, color: blue, icon: cloud]
  box app as App
  box db as DB
end

step Open
  say The boxes between group and end sit inside one group.
  browser -> app: open

step Read
  say A group takes small text, a color role and a picture too.
  app -> db: read
`,G2=`architecture 絵

group 雲 as クラウド [icon: cloud]
  box アプリ [icon: app]
  box DB [icon: db]
end

group 手元 as 手元の端末 [icon: user]
  box 利用者 [icon: user]
end

step 開く
  say 箱と区画のどちらにも icon で絵を付けられる。
  利用者 -> アプリ: 開く

step 読む
  say 区画の絵は区画の名前の左に置く。
  アプリ -> DB: 読む
`,Y2=`architecture Icon

group cloud as Cloud [icon: cloud]
  box app as App [icon: app]
  box db as DB [icon: db]
end

group device as Device [icon: user]
  box user as User [icon: user]
end

step Open
  say Both boxes and groups take a picture with icon.
  user -> app: open

step Read
  say A group shows its picture left of the group name.
  app -> db: read
`,V2=`git 絵

branch main

box 作業ツリー [icon: doc]
box 遠く as 遠くの repo [icon: cloud]

step 積む
  say icon で箱に絵を付ける。
  commit A on main
  note 作業ツリー: A を書いた

step 送る
  say 絵は箱の名前の上に置く。
  commit B on main
  note 遠く: B を受け取った
`,X2=`git Icon

branch main

box worktree as Worktree [icon: doc]
box remote as Remote repo [icon: cloud]

step Commit
  say icon puts a picture on a box.
  commit A on main
  note worktree: Wrote A

step Push
  say The picture sits above the box name.
  commit B on main
  note remote: Received B
`,J2=`sequence 絵

box 利用者 [icon: user]
box アプリ [icon: app]
box 鍵 as 鍵の置き場 [icon: key]
box DB [icon: db]

step 開く
  say icon で箱の名前の上に絵を置く。絵は user や db の名前で選ぶ。
  利用者 -> アプリ: 開く

step 読む
  say 絵があると、箱が何かを名前より先に見分けられる。
  アプリ -> 鍵: 鍵を借りる
  アプリ -> DB: 読む
`,Q2=`sequence Icon

box user as User [icon: user]
box app as App [icon: app]
box vault as Key vault [icon: key]
box db as DB [icon: db]

step Open
  say icon puts a picture above the box name, such as user or db.
  user -> app: open

step Read
  say The picture tells what a box is before you read its name.
  app -> vault: borrow key
  app -> db: read
`,Z2=`state 絵

box 下書き [icon: doc]
box 審査中 [icon: clock]
box 公開中 [icon: globe]

step 出す
  say icon で状態の箱に絵を付ける。
  下書き -> 審査中: 審査に出す

step 通る
  say 運ぶ物は、着いた状態の絵柄の横の置き場に留まる。
  審査中 -> 公開中: 通す
`,K2=`state Icon

box draft as Draft [icon: doc]
box review as In review [icon: clock]
box live as Published [icon: globe]

step Submit
  say icon puts a picture on a state box.
  draft -> review: submit

step Approve
  say The carried item rests in the slot beside the icon of the state it reaches.
  review -> live: approve
`,W2=`time 絵

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者 [icon: user]
box ブロック [icon: box]

step 絵を付ける
  say icon で、箱の名前の上に絵柄を付ける。
  提案者 -> ブロック [at: 0]
  now -> 0

step 続ける
  say 使える絵柄の名前は、絵の部品の頁に並んでいる。
  提案者 -> ブロック [at: 1]
  now -> 1
`,I2=`time Icon

scale slot 12s 6
row block
zoom 0-2

box proposer [icon: user]
box block [icon: box]

step Add an icon
  say icon puts a picture above the box name.
  proposer -> block [at: 0]
  now -> 0

step Next
  say The icon names you can use are listed on the icon part page.
  proposer -> block [at: 1]
  now -> 1
`,e6=`tree 絵

box 記録 [icon: doc]
box 遠く as 遠くの台帳 [icon: cloud]

step 葉を出す
  say icon で箱に絵を付ける。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  note 記録: 葉が2つ

step 組む
  say 絵は箱の名前の上に置く。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 遠く: 根を受け取った
`,t6=`tree Icons

box ledger as Ledger [icon: doc]
box remote as Remote ledger [icon: cloud]

step Add leaves
  say icon gives a box a picture.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  note ledger: 2 leaves

step Join
  say The picture sits above the box name.
  node root of tx1, tx2 [hash: 7a21]
  note remote: got the root
`,n6=`lineup チップ

box 待ち

item 甲, 乙 [color: amber]
item 丙
item 済1, 済2 [color: green, label: ✓]

step 並べる
  say item で、列に並べるチップを最初の step より前に宣言する。color で色を付ける。
  line 待ち: 甲, 乙, 丙

step 字を載せる
  say label で、チップに4字までの字を載せる。
  line 待ち: 甲, 乙, 丙, 済1, 済2
`,a6=`lineup Chips

box waiting as Waiting

item a, b [color: amber]
item c
item done1, done2 [color: green, label: ✓]

step Line up
  say item declares the chips the lanes hold, before the first step. color fills a chip.
  line waiting: a, b, c

step Add labels
  say label puts up to 4 characters on a chip.
  line waiting: a, b, c, done1, done2
`,s6=`tree 葉と札

step 葉を出す
  say leaf の行で葉を出す。hash に値を書くと、箱に値を、葉の下の札に名札を出す。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 親を組む
  say 札は最初の段から出ていて、葉が現れると点線で結ばれる。
  node 根 of 取引1, 取引2 [hash: 7a21]
`,o6=`tree Leaf and card

step Add leaves
  say A leaf line adds a leaf. With a hash, the box shows the value and a card below shows the id.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Cards are there from the first step, and a dotted line ties them to the leaf when it appears.
  node root of tx1, tx2 [hash: 7a21]
`,i6=`sequence 生存線

box 利用者
box アプリ
box サーバー

step 開く
  say 時系列図では、箱の下に縦の線が伸び、上から下へ時が進む。
  利用者 -> アプリ: 開く

step 取りに行く
  say 段が進むほど、線は下の行に引かれる。
  アプリ -> サーバー: 読む
  サーバー -> アプリ: 返す
`,r6=`sequence Lifeline

box user as User
box app as App
box server as Server

step Open
  say A line runs down from each box, and time moves down the page.
  user -> app: open

step Fetch
  say Each later step draws its edges on a lower row.
  app -> server: read
  server -> app: data
`,l6=`lineup 列の並び

box 待ち
box 箱詰め

item 甲 [color: amber]
item 乙, 丙, 丁

step 並べる
  say 段の中の line の行で、列のチップを書いた順に並べる。
  line 待ち: 甲, 乙, 丙, 丁

step 並べ替える
  say ほかの列に居たチップは、その席から滑って来る。元の列を書かなければ、元の席にも残る。
  line 箱詰め: 丙, 甲, 乙

step 減らす
  say 列から外したチップは消える。1列に並べられるのは12枚まで。
  line 待ち: 丁
`,c6=`lineup Lane order

box waiting as Waiting
box packed as Packed

item a [color: amber]
item b, c, d

step Line up
  say A line line inside a step lines up the chips of a lane in the order written.
  line waiting: a, b, c, d

step Reorder
  say A chip that was in another lane slides over from its seat. If that lane is not rewritten, the chip stays there too.
  line packed: c, a, b

step Remove
  say A chip left out of a lane disappears. A lane holds up to 12 chips.
  line waiting: d
`,u6=`architecture 飛び先

box アプリ
box 決済 as 決済の仕組み [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  アプリ -> 決済: 請求

step 返す
  say 箱の中の仕組みを別の図に描いた時は、その図の頁を飛び先にする。
  決済 -> アプリ: 済
`,d6=`architecture Link

box app as App
box pay as Payment system [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  app -> pay: Charge

step Answer
  say When another diagram draws what is inside the box, link to its page.
  pay -> app: Done
`,p6=`git 飛び先

branch main

box 遠く as 遠くの repo [link: https://github.com/cardene777/dragon]

step 積む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  commit A on main

step 送る
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  commit B on main
  note 遠く: B を受け取った
`,h6=`git Link

branch main

box remote as Remote repo [link: https://github.com/cardene777/dragon]

step Commit
  say link on a box makes the box a link to that place in the drawn diagram.
  commit A on main

step Push
  say Write a path that starts with / or a URL that starts with http:// or https://.
  commit B on main
  note remote: Received B
`,f6=`sequence 飛び先

box 利用者
box 認可 as 認可サーバー [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  利用者 -> 認可: 許可を求める

step 返す
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  認可 -> 利用者: 許可した
`,m6=`sequence Link

box user as User
box auth as Auth server [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  user -> auth: Ask for access

step Answer
  say Write a path that starts with / or a URL that starts with http:// or https://.
  auth -> user: Granted
`,g6=`state 飛び先

box 注文 as 注文を受けた
box 支払い as 支払いを確かめる [link: https://github.com/cardene777/dragon]

step 受ける
  say link で状態の箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  start -> 注文

step 確かめる
  say 確かめ方を別の図に描いた時は、その図の頁を飛び先にする。
  注文 -> 支払い: 払った
  支払い -> finish
`,y6=`state Link

box order as Order received
box check as Checking payment [link: https://github.com/cardene777/dragon]

step Receive
  say link on a state box makes the box a link to that place in the drawn diagram.
  start -> order

step Check
  say When another diagram draws how the check works, link to its page.
  order -> check: Paid
  check -> finish
`,b6=`time 飛び先

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者
box ブロック [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  提案者 -> ブロック [at: 0]
  now -> 0

step 続ける
  say 箱の中の仕組みを別の図に描いた時は、その図の頁を飛び先にする。
  提案者 -> ブロック [at: 1]
  now -> 1
`,v6=`time Link

scale slot 12s 6
row block
zoom 0-2

box proposer
box block [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  proposer -> block [at: 0]
  now -> 0

step Next
  say When another diagram draws what is inside the box, link to its page.
  proposer -> block [at: 1]
  now -> 1
`,x6=`tree 飛び先

box 遠く as 遠くの台帳 [link: https://github.com/cardene777/dragon]

step 葉を出す
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 遠く: 根を受け取った
`,w6=`tree Links

box remote as Remote ledger [link: https://github.com/cardene777/dragon]

step Add leaves
  say link gives a box a target. Clicking the box in the drawn diagram goes there.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Write a path starting with / or a URL starting with http:// or https://.
  node root of tx1, tx2 [hash: 7a21]
  note remote: got the root
`,k6=`git merge commit

branch main
branch topic

step 分かれる
  say main と topic にそれぞれ commit を積む。
  commit A on main
  topic from A
  commit C on topic
  commit B on main

step 取り込む
  say merge で topic を取り込むと、B と C の 2 つを親に持つ M ができる。main の札だけが進む。
  commit M on main merge topic
`,E6=`git Merge commit

branch main
branch topic

step Diverge
  say Add a commit on each of main and topic.
  commit A on main
  topic from A
  commit C on topic
  commit B on main

step Merge
  say merge brings topic in and makes M, with B and C as parents. Only main's ref moves.
  commit M on main merge topic
`,A6=`tree 組んだ親

step 葉を出す
  say 親を組む前に、子になる葉を書く。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  leaf 取引3 [hash: c41d]
  leaf 取引4 [hash: e5f8]

step 親を組む
  say node の行で、of の後ろに書いた子から親を組む。親は子の真ん中の上に置かれる。
  node 左 of 取引1, 取引2 [hash: 7a21]
  node 右 of 取引3, 取引4 [hash: b9e4]

step 根まで組む
  say 親を持たない箱が最後に1つ残り、それが根になる。
  node 根 of 左, 右 [hash: e71c]
`,_6=`tree Parent node

step Add leaves
  say Write the leaves that become children before the parent.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  leaf tx3 [hash: c41d]
  leaf tx4 [hash: e5f8]

step Build parents
  say A node line builds a parent from the children written after of. The parent sits above the middle of them.
  node left of tx1, tx2 [hash: 7a21]
  node right of tx3, tx4 [hash: b9e4]

step Up to the root
  say One box is left without a parent at the end. That box is the root.
  node root of left, right [hash: e71c]
`,S6=`architecture 小さな字

group 手元 as 手元の端末 [note: 利用者の側]
  box 財布 [note: 残高 5000 円]
end

group 売り場 as 店の仕組み [note: 売る側]
  box 店 as 店のアプリ [note: 待っている]
end

step 払う
  say note で箱と区画の名前の下に小さな字を添える。
  財布 -> 店: 1200 円 [carry: coin]

step 書き換える
  say 段の中の note の行で、その段から箱の小さな字を書き換える。
  note 財布: 残高 3800 円
  note 店: 受け取った
`,$6=`architecture Note

group device as Device [note: the user side]
  box wallet as Wallet [note: balance 50 USD]
end

group store as Shop system [note: the selling side]
  box shop as Shop app [note: waiting]
end

step Pay
  say note adds small text under the name of a box or a group.
  wallet -> shop: 12 USD [carry: coin]

step Rewrite
  say A note line in a step rewrites a box's small text from then on.
  note wallet: balance 38 USD
  note shop: paid
`,N6=`git 小さな字

branch main

box 作業ツリー [note: 変更なし]

step 書き換える
  say note で箱の名前の下に小さな字を添える。
  commit A on main
  note 作業ツリー: 2 つ書き換えた

step 積む
  say 段の中の note の行で、その段から箱の小さな字を書き換える。
  commit B on main
  note 作業ツリー: 変更なし
`,D6=`git Note

branch main

box worktree as Worktree [note: Clean]

step Edit
  say note adds small text under the name of a box.
  commit A on main
  note worktree: Two files changed

step Commit
  say A note line inside a step rewrites the small text of the box from that step.
  commit B on main
  note worktree: Clean
`,T6=`lineup 小さな字

box 入札A [note: 0 ETH]
box 入札B [note: 0 ETH]

item 一, 二, 三

step 並べる
  say note で、列の右上に小さな字を添える。
  line 入札A: 一, 二
  line 入札B: 三, 一

step 書き換える
  say 段の中の note の行で、その段から列の右上の字を書き換える。
  note 入札A: 0.05 ETH
  note 入札B: 0.12 ETH
`,C6=`lineup Small text

box bidA as Bid A [note: 0 ETH]
box bidB as Bid B [note: 0 ETH]

item one, two, three

step Line up
  say note adds small text at the top right of a lane.
  line bidA: one, two
  line bidB: three, one

step Rewrite
  say A note line inside a step rewrites that text from that step on.
  note bidA: 0.05 ETH
  note bidB: 0.12 ETH
`,O6=`sequence 小さな字

box 財布 [note: 残高 5000 円]
box 店 [note: 待っている]

step 払う
  say note で箱の名前の下に小さな字を添える。
  財布 -> 店: 1200 円 [carry: coin]

step 書き換える
  say 段の中の note の行で、その段から小さな字を書き換える。
  note 財布: 残高 3800 円
  note 店: 受け取った
`,M6=`sequence Note

box wallet as Wallet [note: balance 50 USD]
box shop as Shop [note: waiting]

step Pay
  say note adds small text under the box name.
  wallet -> shop: 12 USD [carry: coin]

step Rewrite
  say A note line in a step rewrites the small text from then on.
  note wallet: balance 38 USD
  note shop: paid
`,B6=`state 小さな字

box 在庫あり [note: 残り 1 個]
box 品切れ [note: 入荷待ち]

step 売り切れる
  say note で状態の名前の下に小さな字を添える。
  在庫あり -> 品切れ: 最後の 1 個が売れた

step 入荷する
  say 段の中の note の行で、その段から状態の小さな字を書き換える。
  品切れ -> 在庫あり: 入荷した
  note 在庫あり: 残り 10 個
`,j6=`state Note

box stocked as In stock [note: 1 left]
box out as Sold out [note: awaiting stock]

step Sell out
  say note adds small text under the state name.
  stocked -> out: last one sold

step Restock
  say A note line inside a step rewrites the small text from that step on.
  out -> stocked: restocked
  note stocked: 10 left
`,q6=`time 小さな字

scale slot 12s 6
row ブロック
point C at 0
zoom 0-2

box 提案者 [note: 1 人を選ぶ]
box ブロック

step 箱の下の字
  say note で、箱の名前の下に小さな字を添える。
  提案者 -> ブロック [at: 0]
  now -> 0

step 書き換える
  say 段の中の note の行で、節目の状態の字を書き換える。
  note C: 提案済み
`,R6=`time Note

scale slot 12s 6
row block
point C at 0
zoom 0-2

box proposer [note: one is picked]
box block

step Small text
  say note adds small text under the box name.
  proposer -> block [at: 0]
  now -> 0

step Rewrite
  say A note line inside a step rewrites the state of a point.
  note C: Proposed
`,z6=`tree 小さな字

box 記録 [note: まだ無い]

step 葉を出す
  say note で箱の名前の下に小さな字を添える。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 段の中の note の行で、その段から箱の小さな字を書き換える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 記録: 根 7a21
`,F6=`tree Small text

box ledger as Ledger [note: empty]

step Add leaves
  say note adds small text under the box name.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say A note line inside a step rewrites that small text from that step on.
  node root of tx1, tx2 [hash: 7a21]
  note ledger: root 7a21
`,L6=`lineup 選ぶ

box 案A [note: 5]
box 案B [color: amber, note: 8]
box 案C [note: 3]

item 一, 二, 三, 四

step 並べる
  say 3つの列に、それぞれの並びを書く。
  line 案A: 一, 二, 三
  line 案B: 二, 四, 一
  line 案C: 三, 一

step 選ぶ
  say pick で、選んだ列の縁に色が付き、ほかの列が薄くなる。
  pick 案B
`,H6=`lineup Pick

box planA as Plan A [note: 5]
box planB as Plan B [color: amber, note: 8]
box planC as Plan C [note: 3]

item one, two, three, four

step Line up
  say Each of the three lanes gets its own order.
  line planA: one, two, three
  line planB: two, four, one
  line planC: three, one

step Pick
  say pick lights up the edge of a lane and fades the other lanes.
  pick planB
`,P6=`time 節目

scale epoch 6.4min 4 [from: 100]
row 確定
point C100 at 0
point C101 at 2

step 状態を変える
  say point で目盛りの印の下に節目の旗の丸を置き、note で状態の字を書き換える。
  note C100: 提案済み [color: blue]
  now -> 0

step 色を変える
  say note の color で丸の色を変える。節目どうしは線で結べる。
  note C100: 確定 [color: green]
  C100 -> C101: 次の epoch [carry: none]
  now -> 2
`,U6=`time Point

scale epoch 6.4min 4 [from: 100]
row final
point C100 at 0
point C101 at 2

step Change the state
  say point puts a flag circle under the marks of a unit, and note rewrites its state.
  note C100: Proposed [color: blue]
  now -> 0

step Change the color
  say color on note changes the color of the circle. Lines can join two points.
  note C100: Final [color: green]
  C100 -> C101: next epoch [carry: none]
  now -> 2
`,G6=`time 印の列

scale slot 12s 8
row ブロック [color: blue, empty: 2 5]
row 票 [color: amber]

step 印を塗る
  say row で印の列を上から宣言する。針が過ぎた目盛りの印が塗られ、empty の目盛りは空きの印になる。
  now -> 7

step 色を変える
  say 段の中の mark で、列の目盛りの範囲の印の色を変える。
  mark ブロック 0-3 [color: green]
`,Y6=`time Row of marks

scale slot 12s 8
row block [color: blue, empty: 2 5]
row vote [color: amber]

step Fill the marks
  say Declare rows from top to bottom with row. Marks fill once the needle passes, and units in empty stay empty.
  now -> 7

step Recolor
  say mark inside a step recolors a range of marks in a row.
  mark block 0-3 [color: green]
`,V6=`time 目盛りと針

scale slot 12s 8 [from: 3200]
period epoch 4 [from: 100]
row ブロック

strip 進み: 今の epoch の票 [meter: 2/3]

step 針を進める
  say scale で目盛りの名前と 1 つの長さと数を書く。段の中の now で、針がその目盛りの終わりまで決まった速さで進む。
  now -> 3
  set 今の epoch の票: 97%
  span 0-3: 1 epoch = 48 秒

step 範囲を囲む
  say period で区切りを置き、span の shape: box で範囲を囲む。
  now -> 7
  set 今の epoch の票: 97%
  span 0-3: 戻せない [shape: box, color: rose]
`,X6=`time Scale and needle

scale slot 12s 8 [from: 3200]
period epoch 4 [from: 100]
row block

strip Progress: Votes this epoch [meter: 2/3]

step Move the needle
  say scale gives the unit name, the length of one unit and the count. now inside a step moves the needle at a fixed speed to the end of that unit.
  now -> 3
  set Votes this epoch: 97%
  span 0-3: 1 epoch = 48 s

step Box a range
  say period adds periods, and span with shape: box draws a box around a range.
  now -> 7
  set Votes this epoch: 97%
  span 0-3: cannot be reverted [shape: box, color: rose]
`,J6=`lineup 封

box 列A
box 列B

item 一, 二, 三, 五
item 四 [color: amber]

step 並べる
  say 2つの列にチップを並べる。
  line 列A: 一, 二, 三
  line 列B: 四, 五

step 封をする
  say seal で、縞の封が列の左から伸びて中身を隠す。
  seal 列A
  seal 列B

step 開ける
  say open で封が消えて中身が戻る。開けなかった列は隠れたまま。
  open 列B
`,Q6=`lineup Seal

box laneA as Lane A
box laneB as Lane B

item one, two, three, five
item four [color: amber]

step Line up
  say Two lanes get their chips.
  line laneA: one, two, three
  line laneB: four, five

step Seal
  say seal grows a striped seal from the left of a lane and hides its contents.
  seal laneA
  seal laneB

step Open
  say open removes the seal and brings the contents back. A lane left sealed stays hidden.
  open laneB
`,Z6=`state 通らない道

box 受付
box 支払い済み
box 発送済み
box キャンセル

受付 -> キャンセル
支払い済み -> キャンセル: 取り消す

step 払う
  say 最初の段より前に書いた線は、移れるが今回は通らない道。
    点線で引き、運ぶ物は走らせない。
  受付 -> 支払い済み: 支払う

step 送る
  say どの段にも出ない状態は、点線の箱にして脇道の囲みへ寄せる。
    同じ線を段の中に書くと、通った道になる。
  支払い済み -> 発送済み: 発送する
`,K6=`state Path not taken

box received as Received
box paid as Paid
box shipped as Shipped
box cancelled as Cancelled

received -> cancelled
paid -> cancelled: cancel

step Pay
  say Edges written before the first step are paths that could be taken but are not this time.
    They are dotted and carry nothing.
  received -> paid: pay

step Ship
  say A state that no step reaches becomes a dotted box in the side path area.
    Writing the same edge inside a step makes it a path taken.
  paid -> shipped: ship
`,W6=`architecture 出典

box アプリ
box 決済 as 決済の仕組み

step 頼む
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  アプリ -> 決済: 請求

step 返す
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  決済 -> アプリ: 済
`,I6=`architecture Source

box app as App
box pay as Payment system

step Ask
  say source gives a step the name and url of a source. A step takes any number.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  app -> pay: Charge

step Answer
  say Sources stay out of the diagram and the text, and appear as links in the step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  pay -> app: Done
`,ek=`git 出典

branch main

step 積む
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  commit A on main

step 続ける
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  commit B on main
`,tk=`git Source

branch main

step Commit
  say source gives a step the name and url of a source. A step takes any number.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  commit A on main

step Continue
  say Sources stay out of the diagram and the text, and appear as links in the step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  commit B on main
`,nk=`lineup 出典

box 待ち

item 甲, 乙

step 並べる
  say source で段に出典の名前と url を書く。1つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  line 待ち: 甲, 乙

step 並べ替える
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  line 待ち: 乙, 甲
`,ak=`lineup Sources

box waiting as Waiting

item a, b

step Line up
  say source gives a step a source name and url. A step can have any number of them.
  source The dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  line waiting: a, b

step Reorder
  say Sources stay out of the figure and appear as named links in the spoken step list.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source The dragon repo [url: https://github.com/cardene777/dragon]
  line waiting: b, a
`,sk=`sequence 出典

box 利用者
box 認可 as 認可サーバー

step 頼む
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  利用者 -> 認可: 許可を求める

step 返す
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  認可 -> 利用者: 許可した
`,ok=`sequence Source

box user as User
box auth as Auth server

step Ask
  say source gives a step the name and url of a source. A step takes any number.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  user -> auth: Ask for access

step Answer
  say Sources stay out of the diagram and the text, and appear as links in the step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  auth -> user: Granted
`,ik=`state 出典

box 注文 as 注文を受けた
box 支払い as 支払いを確かめる

step 受ける
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  start -> 注文

step 確かめる
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  注文 -> 支払い: 払った
  支払い -> finish
`,rk=`state Source

box order as Order received
box check as Checking payment

step Receive
  say source gives a step the name and url of a source. A step takes any number.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  start -> order

step Check
  say Sources stay out of the diagram and the text, and appear as links in the step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  order -> check: Paid
  check -> finish
`,lk=`time 出典

scale slot 12s 6
row ブロック
zoom 0-2

box 提案者
box ブロック

step 頼む
  say source で段に出典の名前と url を書く。1 つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  提案者 -> ブロック [at: 0]
  now -> 0

step 続ける
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  提案者 -> ブロック [at: 1]
  now -> 1
`,ck=`time Source

scale slot 12s 6
row block
zoom 0-2

box proposer
box block

step Ask
  say source gives a step the name and url of a source. A step takes any number.
  source dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  proposer -> block [at: 0]
  now -> 0

step Next
  say Sources stay out of the diagram and the text, and appear as links in the step list.
  source Notation guide [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.en.md]
  source dragon repo [url: https://github.com/cardene777/dragon]
  proposer -> block [at: 1]
  now -> 1
`,uk=`tree 出典

step 葉を出す
  say source で段に出典の名前と url を書く。1つの段に何行でも書ける。
  source dragon の README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 出典は図にも語りにも出さず、読み上げの段の一覧に名前の link で出る。
  source 記法の書き方 [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source dragon の repo [url: https://github.com/cardene777/dragon]
  node 根 of 取引1, 取引2 [hash: 7a21]
`,dk=`tree Sources

step Add leaves
  say source gives a step a source name and url. A step can have any number of them.
  source The dragon README [url: https://github.com/cardene777/dragon/blob/main/README.md]
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Sources stay out of the figure and appear as named links in the spoken step list.
  source How to write the notation [url: https://github.com/cardene777/dragon/blob/main/packages/dragon/examples/quick-start.md]
  source The dragon repo [url: https://github.com/cardene777/dragon]
  node root of tx1, tx2 [hash: 7a21]
`,pk=`lineup 札

box 申請 [color: amber]

item 書類1, 書類2, 書類3

step 並べる
  say 列にチップを並べる。
  line 申請: 書類1, 書類2, 書類3

step 札を押す
  say stamp で、列の右に傾いた札を押す。中身に触れずに起きたことを見せる。
  stamp 申請: 承認済み
`,hk=`lineup Stamp

box request as Request [color: amber]

item doc1, doc2, doc3

step Line up
  say A lane gets its chips.
  line request: doc1, doc2, doc3

step Stamp
  say stamp lands a tilted stamp on the right of a lane. It shows what happens without touching the contents.
  stamp request: Approved
`,fk=`state 始まりと終わり

box 受付
box 完了

step 始める
  say start は始まりの印。start から最初の状態へ線を引く。
  start -> 受付: 申し込む

step 進める
  say 状態どうしは名札で結ぶ。
  受付 -> 完了: 片付ける

step 終える
  say finish は終わりの印。終わりの状態から finish へ線を引く。
    start へ入る線と、finish から出る線は書けない。
  完了 -> finish: 閉じる
`,mk=`state Start and end

box received as Received
box done as Done

step Begin
  say start is the start mark. Draw an edge from start to the first state.
  start -> received: apply

step Proceed
  say States are joined by their tags.
  received -> done: settle

step End
  say finish is the end mark. Draw an edge from the final state to finish.
    No edge can go into start or come out of finish.
  done -> finish: close
`,gk=`architecture 段 [view: fixed]

box 端末
box サーバー

step 打つ
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code curl /api/items
  端末 -> サーバー: GET /api/items

step 返る
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  サーバー -> 端末: 200 OK
`,yk=`architecture Step [view: fixed]

box term as Terminal
box server as Server

step Run
  say step starts a step and say writes its text.
    The command run in the step goes in code.
  code curl /api/items
  term -> server: GET /api/items

step Return
  say Steps play one at a time.
    view picks whether the frame follows the step
    or holds the whole diagram.
  server -> term: 200 OK
`,bk=`git 段 [view: fixed]

branch main

step 積む
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code git commit
  commit A on main

step 続ける
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code git commit
  commit B on main
`,vk=`git Step [view: fixed]

branch main

step Commit
  say step starts a step, and say writes its text.
    Write the command run in the step with code.
  code git commit
  commit A on main

step Go on
  say Steps are played one at a time.
    view picks whether the frame follows the step or holds the whole diagram.
  code git commit
  commit B on main
`,xk=`lineup 段 [view: fixed]

box 待ち

item 甲, 乙, 丙

step 並べる
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code send 甲 乙 丙
  line 待ち: 甲, 乙, 丙

step 並べ替える
  say 段は1つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code sort
  line 待ち: 丙, 乙, 甲
`,wk=`lineup Steps [view: fixed]

box waiting as Waiting

item a, b, c

step Line up
  say step separates steps, and say writes the body of a step.
    code writes the command typed in that step.
  code send a b c
  line waiting: a, b, c

step Reorder
  say Steps are viewed one at a time.
    view picks whether the frame follows the step or holds the whole diagram.
  code sort
  line waiting: c, b, a
`,kk=`sequence 段 [view: fixed]

box 端末
box サーバー

step 打つ
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code curl /api/items
  端末 -> サーバー: GET /api/items

step 返る
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  サーバー -> 端末: 200 OK
`,Ek=`sequence Step [view: fixed]

box term as Terminal
box server as Server

step Run
  say step starts a step and say writes its text.
    The command run in the step goes in code.
  code curl /api/items
  term -> server: GET /api/items

step Return
  say Steps play one at a time.
    view picks whether the frame follows the step
    or holds the whole diagram.
  server -> term: 200 OK
`,Ak=`state 段 [view: fixed]

box 停止中
box 動作中

step 起動する
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code systemctl start app
  停止中 -> 動作中: 起動

step 止める
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code systemctl stop app
  動作中 -> 停止中: 停止
`,_k=`state Step [view: fixed]

box stopped as Stopped
box running as Running

step Launch
  say step starts a step and say writes its text.
    The command run in the step goes in code.
  code systemctl start app
  stopped -> running: launch

step Halt
  say Steps play one at a time.
    view picks whether the frame follows the step
    or holds the whole diagram.
  code systemctl stop app
  running -> stopped: halt
`,Sk=`time 段 [view: fixed]

scale slot 12s 6
row ブロック

step 進める
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code attestation = { head, source, target }
  now -> 2

step 続ける
  say 段は 1 つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  now -> 5
`,$k=`time Step [view: fixed]

scale slot 12s 6
row block

step Advance
  say step starts a step, and say writes its text.
    Write the command for the step with code.
  code attestation = { head, source, target }
  now -> 2

step Continue
  say Steps are shown one at a time.
    view picks whether the frame follows each step or shows the whole diagram still.
  now -> 5
`,Nk=`tree 段 [view: fixed]

step 葉を出す
  say step で段を区切り、say で段の本文を書く。
    その段で打つ命令は code で書く。
  code hash 取引1 取引2
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 段は1つずつ送って見る。
    view で、枠が段を追うか全体を止めて見せるかを選ぶ。
  code hash 3fa0 8b04
  node 根 of 取引1, 取引2 [hash: 7a21]
`,Dk=`tree Steps [view: fixed]

step Add leaves
  say step separates steps, and say writes the body of a step.
    code writes the command typed in that step.
  code hash tx1 tx2
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Steps are viewed one at a time.
    view picks whether the frame follows the step or holds the whole diagram.
  code hash 3fa0 8b04
  node root of tx1, tx2 [hash: 7a21]
`,Tk=`architecture 中身の帯と欄

box アプリ
box サーバー

strip 注文: 番号, 状態

step 作る
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  アプリ -> サーバー: 注文する
  set 番号: 42
  set 状態: 受付

step 進める
  say set の tag で、欄の値に札を添える。
  act サーバー: 確かめる
  set 状態: 確定 [tag: 済]
`,Ck=`architecture Strip

box app as App
box server as Server

strip Order: number, state

step Create
  say strip puts a strip of fields under the diagram. set fills a field.
  app -> server: place order
  set number: 42
  set state: received

step Advance
  say tag on a set line adds a tag to the field value.
  act server: check
  set state: confirmed [tag: done]
`,Ok=`git 中身の帯と欄

branch main

strip 参照: main, HEAD

step 積む
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  commit A on main [hash: 3fa0c19]
  set main: A 3fa0c19
  set HEAD: main

step 進める
  say set の tag で、欄の値に札を添える。
  commit B on main [hash: 8b04f71]
  set main: B 8b04f71 [tag: 先端]
`,Mk=`git Strip

branch main

strip Refs: main, HEAD

step Commit
  say strip puts a strip of fields under the diagram, and set fills a field.
  commit A on main [hash: 3fa0c19]
  set main: A 3fa0c19
  set HEAD: main

step Move on
  say tag on a set line adds a tag beside the field value.
  commit B on main [hash: 8b04f71]
  set main: B 8b04f71 [tag: tip]
`,Bk=`lineup 中身の帯と欄

strip 状態: 件数, 先頭

box 待ち

item 甲, 乙, 丙

step 並べる
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  line 待ち: 甲, 乙, 丙
  set 件数: 3

step 並べ替える
  say set の tag で、欄の値に札を添える。
  line 待ち: 丙, 甲, 乙
  set 先頭: 丙 [tag: 替わった]
`,jk=`lineup Strip and fields

strip State: Count, First

box waiting as Waiting

item a, b, c

step Line up
  say strip places a strip with fields under the diagram, and set fills a field.
  line waiting: a, b, c
  set Count: 3

step Reorder
  say tag on set adds a tag to the field value.
  line waiting: c, a, b
  set First: c [tag: Changed]
`,qk=`sequence 中身の帯と欄

box アプリ
box サーバー

strip 注文: 番号, 状態

step 作る
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  アプリ -> サーバー: 注文する
  set 番号: 42
  set 状態: 受付

step 進める
  say set の tag で、欄の値に札を添える。
  act サーバー: 確かめる
  set 状態: 確定 [tag: 済]
`,Rk=`sequence Strip

box app as App
box server as Server

strip Order: number, state

step Create
  say strip puts a strip of fields under the diagram. set fills a field.
  app -> server: place order
  set number: 42
  set state: received

step Advance
  say tag on a set line adds a tag to the field value.
  act server: check
  set state: confirmed [tag: done]
`,zk=`state 中身の帯と欄

box 受付
box 発送済み
box 配達完了

strip 注文: 番号, 状態

step 送る
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  受付 -> 発送済み: 発送する
  set 番号: 42
  set 状態: 発送済み

step 届く
  say set の tag で、欄の値に札を添える。
  発送済み -> 配達完了: 届けた
  set 状態: 配達完了 [tag: 済]
`,Fk=`state Strip

box received as Received
box shipped as Shipped
box delivered as Delivered

strip Order: number, state

step Ship
  say strip puts a strip of fields under the diagram. set fills a field.
  received -> shipped: ship
  set number: 42
  set state: shipped

step Deliver
  say tag on a set line adds a tag to the field value.
  shipped -> delivered: hand over
  set state: delivered [tag: done]
`,Lk=`time 中身の帯と欄

scale slot 12s 8
period epoch 4
row ブロック

strip 進み: 経過, 状態, 今の epoch の票 [meter: 2/3]

step 進める
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。物差しの欄は針と一緒に満ちる。
  now -> 3
  set 経過: 48 秒
  set 今の epoch の票: 97%

step 札を添える
  say set の tag で、欄の値に札を添える。
  set 状態: 正当化 [tag: 2/3]
`,Hk=`time Strip and fields

scale slot 12s 8
period epoch 4
row block

strip Progress: Elapsed, State, Votes this epoch [meter: 2/3]

step Advance
  say strip puts a strip of fields under the diagram, and set fills a field. A meter field fills with the needle.
  now -> 3
  set Elapsed: 48 s
  set Votes this epoch: 97%

step Add a tag
  say tag on set adds a tag next to the value.
  set State: Justified [tag: 2/3]
`,Pk=`tree 中身の帯と欄

strip 証明: 取引, 根

step 葉を出す
  say strip で図の下に中身の帯と欄を置き、set で欄に値を入れる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  set 取引: 取引1

step 組む
  say set の tag で、欄の値に札を添える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  set 根: 7a21 [tag: 一致]
`,Uk=`tree Strip and fields

strip Proof: Item, Root

step Add leaves
  say strip places a strip with fields under the diagram, and set fills a field.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  set Item: tx1

step Join
  say tag on set adds a tag to the field value.
  node root of tx1, tx2 [hash: 7a21]
  set Root: 7a21 [tag: Match]
`,Gk=`time 拡大の帯

scale slot 12s 8 [from: 3200]
row ブロック [empty: 2]
zoom 0-2

box 提案者 [icon: user]
box ブロック [icon: box]
box 委員会

step 列を並べる
  say zoom で目盛りの範囲を書くと、上の帯にその目盛りを列にして箱を並べる。線は at の列の箱どうしを結ぶ。
  提案者 -> ブロック [at: 0]
  委員会 -> ブロック [at: 0, tag: 票]
  now -> 0

step 別の列へ
  say into で、受ける箱を別の列から選ぶ。空きの目盛りの列では、印の列と同じ名札の箱が空きの枠になる。
  提案者 -> ブロック [at: 1]
  委員会 -> ブロック [at: 2, into: 1, tag: 票]
  now -> 2
`,Yk=`time Zoom band

scale slot 12s 8 [from: 3200]
row block [empty: 2]
zoom 0-2

box proposer [icon: user]
box block [icon: box]
box committee

step Lay out columns
  say zoom gives a range of units, laid out as columns of boxes in the band above. A line joins the boxes of the column in at.
  proposer -> block [at: 0]
  committee -> block [at: 0, tag: vote]
  now -> 0

step Another column
  say into takes the receiving box from another column. In an empty unit, the box named like the row becomes an empty frame.
  proposer -> block [at: 1]
  committee -> block [at: 2, into: 1, tag: vote]
  now -> 2
`,No=ha.filter(t=>t!=="lineup"),ji=[{id:"box",kinds:ha,words:["head:box"]},{id:"edge",kinds:No,words:["edge:->"]},{id:"edge-label",kinds:No,words:["attr:edge.side"]},{id:"carry",kinds:No,words:["attr:edge.carry","attr:edge.tag"]},{id:"color",kinds:ha,words:["attr:box.color"]},{id:"icon",kinds:No,words:["attr:box.icon"]},{id:"link",kinds:No,words:["attr:box.link"]},{id:"note",kinds:ha,words:["attr:box.note","head:note"]},{id:"act",kinds:No,words:["head:act"]},{id:"strip",kinds:ha,words:["head:strip","head:set","attr:set.tag"]},{id:"step",kinds:ha,words:["head:step","head:say","head:code","attr:diagram.view"]},{id:"source",kinds:ha,words:["head:source","attr:source.url"]},{id:"lifeline",kinds:["sequence"],words:["kind:sequence"]},{id:"group",kinds:["architecture"],words:["kind:architecture","head:group","head:end","attr:group.note","attr:group.color","attr:group.icon"]},{id:"start-finish",kinds:["state"],words:["kind:state","edge:start","edge:finish"]},{id:"side-path",kinds:["state"],words:["edge:before-step"]},{id:"branch",kinds:["git"],words:["kind:git","head:branch","attr:branch.note","git:from"]},{id:"commit",kinds:["git"],words:["head:commit","attr:commit.hash","attr:commit.note"]},{id:"copy",kinds:["git"],words:["git:copy"]},{id:"merge",kinds:["git"],words:["git:merge"]},{id:"scale",kinds:["time"],words:["kind:time","head:scale","attr:scale.from","head:period","attr:period.from","head:span","attr:span.shape","attr:span.color","attr:strip.meter"]},{id:"row",kinds:["time"],words:["head:row","attr:row.color","attr:row.empty","head:mark","attr:mark.color"]},{id:"point",kinds:["time"],words:["head:point","attr:note.color"]},{id:"zoom",kinds:["time"],words:["head:zoom","attr:edge.at","attr:edge.into"]},{id:"leaf",kinds:["tree"],words:["kind:tree","head:leaf","attr:leaf.hash"]},{id:"node",kinds:["tree"],words:["head:node","attr:node.hash"]},{id:"item",kinds:["lineup"],words:["kind:lineup","head:item","attr:item.color","attr:item.label"]},{id:"line",kinds:["lineup"],words:["head:line"]},{id:"seal",kinds:["lineup"],words:["head:seal","head:open"]},{id:"pick",kinds:["lineup"],words:["head:pick"]},{id:"stamp",kinds:["lineup"],words:["head:stamp"]}],Fd=t=>t.kinds.length>1,cp=t=>ji.find(s=>s.id===t),Vk=t=>ji.filter(s=>s.kinds.includes(t)),Xk=Object.assign({"./parts/act.architecture.dragon":fw,"./parts/act.architecture.en.dragon":mw,"./parts/act.git.dragon":gw,"./parts/act.git.en.dragon":yw,"./parts/act.sequence.dragon":bw,"./parts/act.sequence.en.dragon":vw,"./parts/act.state.dragon":xw,"./parts/act.state.en.dragon":ww,"./parts/act.time.dragon":kw,"./parts/act.time.en.dragon":Ew,"./parts/act.tree.dragon":Aw,"./parts/act.tree.en.dragon":_w,"./parts/box.architecture.dragon":Sw,"./parts/box.architecture.en.dragon":$w,"./parts/box.git.dragon":Nw,"./parts/box.git.en.dragon":Dw,"./parts/box.lineup.dragon":Tw,"./parts/box.lineup.en.dragon":Cw,"./parts/box.sequence.dragon":Ow,"./parts/box.sequence.en.dragon":Mw,"./parts/box.state.dragon":Bw,"./parts/box.state.en.dragon":jw,"./parts/box.time.dragon":qw,"./parts/box.time.en.dragon":Rw,"./parts/box.tree.dragon":zw,"./parts/box.tree.en.dragon":Fw,"./parts/branch.git.dragon":Lw,"./parts/branch.git.en.dragon":Hw,"./parts/carry.architecture.dragon":Pw,"./parts/carry.architecture.en.dragon":Uw,"./parts/carry.git.dragon":Gw,"./parts/carry.git.en.dragon":Yw,"./parts/carry.sequence.dragon":Vw,"./parts/carry.sequence.en.dragon":Xw,"./parts/carry.state.dragon":Jw,"./parts/carry.state.en.dragon":Qw,"./parts/carry.time.dragon":Zw,"./parts/carry.time.en.dragon":Kw,"./parts/carry.tree.dragon":Ww,"./parts/carry.tree.en.dragon":Iw,"./parts/color.architecture.dragon":e2,"./parts/color.architecture.en.dragon":t2,"./parts/color.git.dragon":n2,"./parts/color.git.en.dragon":a2,"./parts/color.lineup.dragon":s2,"./parts/color.lineup.en.dragon":o2,"./parts/color.sequence.dragon":i2,"./parts/color.sequence.en.dragon":r2,"./parts/color.state.dragon":l2,"./parts/color.state.en.dragon":c2,"./parts/color.time.dragon":u2,"./parts/color.time.en.dragon":d2,"./parts/color.tree.dragon":p2,"./parts/color.tree.en.dragon":h2,"./parts/commit.git.dragon":f2,"./parts/commit.git.en.dragon":m2,"./parts/copy.git.dragon":g2,"./parts/copy.git.en.dragon":y2,"./parts/edge-label.architecture.dragon":b2,"./parts/edge-label.architecture.en.dragon":v2,"./parts/edge-label.git.dragon":x2,"./parts/edge-label.git.en.dragon":w2,"./parts/edge-label.sequence.dragon":k2,"./parts/edge-label.sequence.en.dragon":E2,"./parts/edge-label.state.dragon":A2,"./parts/edge-label.state.en.dragon":_2,"./parts/edge-label.time.dragon":S2,"./parts/edge-label.time.en.dragon":$2,"./parts/edge-label.tree.dragon":N2,"./parts/edge-label.tree.en.dragon":D2,"./parts/edge.architecture.dragon":T2,"./parts/edge.architecture.en.dragon":C2,"./parts/edge.git.dragon":O2,"./parts/edge.git.en.dragon":M2,"./parts/edge.sequence.dragon":B2,"./parts/edge.sequence.en.dragon":j2,"./parts/edge.state.dragon":q2,"./parts/edge.state.en.dragon":R2,"./parts/edge.time.dragon":z2,"./parts/edge.time.en.dragon":F2,"./parts/edge.tree.dragon":L2,"./parts/edge.tree.en.dragon":H2,"./parts/group.architecture.dragon":P2,"./parts/group.architecture.en.dragon":U2,"./parts/icon.architecture.dragon":G2,"./parts/icon.architecture.en.dragon":Y2,"./parts/icon.git.dragon":V2,"./parts/icon.git.en.dragon":X2,"./parts/icon.sequence.dragon":J2,"./parts/icon.sequence.en.dragon":Q2,"./parts/icon.state.dragon":Z2,"./parts/icon.state.en.dragon":K2,"./parts/icon.time.dragon":W2,"./parts/icon.time.en.dragon":I2,"./parts/icon.tree.dragon":e6,"./parts/icon.tree.en.dragon":t6,"./parts/item.lineup.dragon":n6,"./parts/item.lineup.en.dragon":a6,"./parts/leaf.tree.dragon":s6,"./parts/leaf.tree.en.dragon":o6,"./parts/lifeline.sequence.dragon":i6,"./parts/lifeline.sequence.en.dragon":r6,"./parts/line.lineup.dragon":l6,"./parts/line.lineup.en.dragon":c6,"./parts/link.architecture.dragon":u6,"./parts/link.architecture.en.dragon":d6,"./parts/link.git.dragon":p6,"./parts/link.git.en.dragon":h6,"./parts/link.sequence.dragon":f6,"./parts/link.sequence.en.dragon":m6,"./parts/link.state.dragon":g6,"./parts/link.state.en.dragon":y6,"./parts/link.time.dragon":b6,"./parts/link.time.en.dragon":v6,"./parts/link.tree.dragon":x6,"./parts/link.tree.en.dragon":w6,"./parts/merge.git.dragon":k6,"./parts/merge.git.en.dragon":E6,"./parts/node.tree.dragon":A6,"./parts/node.tree.en.dragon":_6,"./parts/note.architecture.dragon":S6,"./parts/note.architecture.en.dragon":$6,"./parts/note.git.dragon":N6,"./parts/note.git.en.dragon":D6,"./parts/note.lineup.dragon":T6,"./parts/note.lineup.en.dragon":C6,"./parts/note.sequence.dragon":O6,"./parts/note.sequence.en.dragon":M6,"./parts/note.state.dragon":B6,"./parts/note.state.en.dragon":j6,"./parts/note.time.dragon":q6,"./parts/note.time.en.dragon":R6,"./parts/note.tree.dragon":z6,"./parts/note.tree.en.dragon":F6,"./parts/pick.lineup.dragon":L6,"./parts/pick.lineup.en.dragon":H6,"./parts/point.time.dragon":P6,"./parts/point.time.en.dragon":U6,"./parts/row.time.dragon":G6,"./parts/row.time.en.dragon":Y6,"./parts/scale.time.dragon":V6,"./parts/scale.time.en.dragon":X6,"./parts/seal.lineup.dragon":J6,"./parts/seal.lineup.en.dragon":Q6,"./parts/side-path.state.dragon":Z6,"./parts/side-path.state.en.dragon":K6,"./parts/source.architecture.dragon":W6,"./parts/source.architecture.en.dragon":I6,"./parts/source.git.dragon":ek,"./parts/source.git.en.dragon":tk,"./parts/source.lineup.dragon":nk,"./parts/source.lineup.en.dragon":ak,"./parts/source.sequence.dragon":sk,"./parts/source.sequence.en.dragon":ok,"./parts/source.state.dragon":ik,"./parts/source.state.en.dragon":rk,"./parts/source.time.dragon":lk,"./parts/source.time.en.dragon":ck,"./parts/source.tree.dragon":uk,"./parts/source.tree.en.dragon":dk,"./parts/stamp.lineup.dragon":pk,"./parts/stamp.lineup.en.dragon":hk,"./parts/start-finish.state.dragon":fk,"./parts/start-finish.state.en.dragon":mk,"./parts/step.architecture.dragon":gk,"./parts/step.architecture.en.dragon":yk,"./parts/step.git.dragon":bk,"./parts/step.git.en.dragon":vk,"./parts/step.lineup.dragon":xk,"./parts/step.lineup.en.dragon":wk,"./parts/step.sequence.dragon":kk,"./parts/step.sequence.en.dragon":Ek,"./parts/step.state.dragon":Ak,"./parts/step.state.en.dragon":_k,"./parts/step.time.dragon":Sk,"./parts/step.time.en.dragon":$k,"./parts/step.tree.dragon":Nk,"./parts/step.tree.en.dragon":Dk,"./parts/strip.architecture.dragon":Tk,"./parts/strip.architecture.en.dragon":Ck,"./parts/strip.git.dragon":Ok,"./parts/strip.git.en.dragon":Mk,"./parts/strip.lineup.dragon":Bk,"./parts/strip.lineup.en.dragon":jk,"./parts/strip.sequence.dragon":qk,"./parts/strip.sequence.en.dragon":Rk,"./parts/strip.state.dragon":zk,"./parts/strip.state.en.dragon":Fk,"./parts/strip.time.dragon":Lk,"./parts/strip.time.en.dragon":Hk,"./parts/strip.tree.dragon":Pk,"./parts/strip.tree.en.dragon":Uk,"./parts/zoom.time.dragon":Gk,"./parts/zoom.time.en.dragon":Yk}),Jk=(t,s,c)=>(Xk[`./parts/${t}.${s}${c==="en"?".en":""}.dragon`]??"").trimEnd(),en=t=>t.steps.flatMap(s=>s.events),ls=t=>en(t).flatMap(s=>s.type==="edge"?[s]:[]),Ti=t=>en(t).flatMap(s=>s.type==="commit"?[s]:[]),$d=t=>en(t).flatMap(s=>s.type==="span"?[s]:[]),Qk=(t,s)=>s.carry.kind==="tag"&&!(t.kind==="git"&&s.carry.text===s.from),Zk={"kind:sequence":t=>t.kind==="sequence","kind:architecture":t=>t.kind==="architecture","kind:state":t=>t.kind==="state","kind:git":t=>t.kind==="git","head:group":t=>(t.regions??[]).length>0,"head:end":t=>(t.regions??[]).length>0,"head:box":t=>t.boxes.length>0,"head:strip":t=>t.strip!==void 0,"head:step":t=>t.steps.length>0,"head:say":t=>t.steps.some(s=>s.body!==""),"head:code":t=>t.steps.some(s=>s.code!==void 0),"head:source":t=>t.steps.some(s=>s.sources!==void 0),"head:act":t=>en(t).some(s=>s.type==="action"),"head:note":t=>en(t).some(s=>s.type==="swap"),"head:set":t=>en(t).some(s=>s.type==="strip"),"attr:diagram.view":t=>t.view!==void 0,"attr:group.note":t=>(t.regions??[]).some(s=>s.note!==void 0),"attr:group.color":t=>(t.regions??[]).some(s=>s.color!==void 0),"attr:group.icon":t=>(t.regions??[]).some(s=>s.icon!==void 0),"attr:box.note":t=>t.boxes.some(s=>s.sub!==void 0),"attr:box.color":t=>t.boxes.some(s=>s.color!==void 0),"attr:box.icon":t=>t.boxes.some(s=>s.icon!==void 0),"attr:box.link":t=>t.boxes.some(s=>s.link!==void 0),"attr:source.url":t=>t.steps.some(s=>s.sources!==void 0),"attr:edge.carry":t=>ls(t).some(s=>s.carry.kind==="coin"||s.carry.kind==="none"),"attr:edge.tag":t=>ls(t).some(s=>Qk(t,s)),"attr:edge.side":t=>ls(t).some(s=>s.labelSide!==void 0),"attr:set.tag":t=>en(t).some(s=>s.type==="strip"&&s.tag!==void 0),"edge:->":t=>ls(t).length>0,"edge:start":t=>ls(t).some(s=>s.from==="start"),"edge:finish":t=>ls(t).some(s=>s.to==="finish"),"edge:before-step":t=>(t.state?.paths??[]).length>0,"head:branch":t=>(t.git?.branches??[]).length>0,"head:commit":t=>Ti(t).length>0,"attr:branch.note":t=>(t.git?.branches??[]).some(s=>s.note!==void 0),"attr:commit.hash":t=>Ti(t).some(s=>s.hash!==void 0),"attr:commit.note":t=>Ti(t).some(s=>s.note!==void 0),"git:from":t=>en(t).some(s=>s.type==="branch"),"git:copy":t=>Ti(t).some(s=>s.copy!==void 0),"git:merge":t=>Ti(t).some(s=>s.merge!==void 0),"kind:time":t=>t.kind==="time","head:scale":t=>t.time!==void 0,"attr:scale.from":t=>t.time?.scale.from!==void 0,"head:period":t=>t.time?.period!==void 0,"attr:period.from":t=>t.time?.period?.from!==void 0,"head:span":t=>$d(t).length>0,"attr:span.shape":t=>$d(t).some(s=>s.shape!==void 0),"attr:span.color":t=>$d(t).some(s=>s.color!==void 0),"attr:strip.meter":t=>(t.strip?.meters??[]).length>0,"head:row":t=>(t.time?.rows??[]).length>0,"attr:row.color":t=>(t.time?.rows??[]).some(s=>s.color!==void 0),"attr:row.empty":t=>(t.time?.rows??[]).some(s=>s.empty!==void 0),"head:mark":t=>en(t).some(s=>s.type==="mark"),"attr:mark.color":t=>en(t).some(s=>s.type==="mark"),"head:point":t=>(t.time?.points??[]).length>0,"attr:note.color":t=>en(t).some(s=>s.type==="swap"&&s.color!==void 0),"head:zoom":t=>t.time?.zoom!==void 0,"attr:edge.at":t=>ls(t).some(s=>s.at!==void 0),"attr:edge.into":t=>ls(t).some(s=>s.into!==void 0),"kind:tree":t=>t.kind==="tree","head:leaf":t=>en(t).some(s=>s.type==="leaf"),"attr:leaf.hash":t=>en(t).some(s=>s.type==="leaf"&&s.hash!==void 0),"head:node":t=>en(t).some(s=>s.type==="node"),"attr:node.hash":t=>en(t).some(s=>s.type==="node"&&s.hash!==void 0),"kind:lineup":t=>t.kind==="lineup","head:item":t=>(t.lineup?.items??[]).length>0,"attr:item.color":t=>(t.lineup?.items??[]).some(s=>s.color!==void 0),"attr:item.label":t=>(t.lineup?.items??[]).some(s=>s.label!==void 0),"head:line":t=>en(t).some(s=>s.type==="line"),"head:seal":t=>en(t).some(s=>s.type==="seal"),"head:open":t=>en(t).some(s=>s.type==="open"),"head:pick":t=>en(t).some(s=>s.type==="pick"),"head:stamp":t=>en(t).some(s=>s.type==="stamp")},Kk=Yi.flatMap(t=>{const s=ms(Ra(t,"ja"));return s.ok?[{key:t,diagram:s.diagram}]:[]}),Wk=t=>Kk.filter(({diagram:s})=>t.kinds.includes(s.kind)&&t.words.some(c=>Zk[c]?.(s)===!0)).map(({key:s,diagram:c})=>({key:s,kind:c.kind})),Hg=t=>{const[s,c=""]=t.split(":");return s==="attr"?`[${c.split(".")[1]??c}: …]`:t==="edge:before-step"?"->":c};function Ik({lang:t}){const s=Et[t],c=s.site.catalog,d=p=>x.jsxs("header",{className:"catalog-section-head",children:[x.jsx("h2",{className:"catalog-section-title",children:c.sections[p].title}),x.jsx("p",{className:"catalog-section-lead",children:c.sections[p].lead})]});return x.jsxs("div",{className:"catalog-page","data-catalog":"index",children:[x.jsxs("div",{className:"catalog-hero",children:[x.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":c.crumb,children:[x.jsx("a",{href:Tt.home,onClick:p=>jt(p),children:s.site.nav.home}),x.jsx("span",{"aria-hidden":"true",children:"›"}),x.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:s.site.screens.catalog.title})]}),x.jsx("h1",{className:"catalog-title",children:s.site.screens.catalog.title}),x.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:c.lead(ji.length,ha.length,Yi.length)})]}),x.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"parts",children:[d("parts"),x.jsx("div",{className:"catalog-part-grid",children:ji.filter(Fd).map(p=>x.jsx(Ld,{part:p,lang:t},p.id))})]}),x.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"kind-parts",children:[d("kind-parts"),x.jsx("div",{className:"catalog-part-grid",children:ji.filter(p=>!Fd(p)).map(p=>x.jsx(Ld,{part:p,lang:t},p.id))})]}),x.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"kinds",children:[d("kinds"),x.jsx("div",{className:"catalog-index-grid",children:ha.map((p,a)=>x.jsxs("a",{className:"catalog-index-card","data-catalog":"card",href:`${Tt.catalog}/${p}`,onClick:r=>jt(r),children:[x.jsxs("div",{className:"catalog-index-card-top",children:[x.jsxs("div",{className:"catalog-index-card-head",children:[x.jsx("span",{className:"catalog-index-card-no","data-catalog":"card-no",children:String(a+1).padStart(2,"0")}),x.jsx("span",{className:"catalog-index-card-count","data-catalog":"card-count",children:c.count(zg(p).length)})]}),x.jsx("h2",{className:"catalog-index-card-title",children:s.shelf.kinds[p]}),x.jsx("p",{className:"catalog-index-card-desc","data-catalog":"card-desc",children:c.kinds[p]})]}),x.jsx("span",{className:"catalog-index-card-link","data-catalog":"card-open",children:c.open})]},p))})]})]})}function Ld({part:t,lang:s,name:c="part-card"}){const d=Et[s],p=d.site.catalog;return x.jsxs("a",{className:"catalog-part-card","data-catalog":c,"data-part":t.id,href:`${Tt.catalog}/part/${t.id}`,onClick:a=>jt(a),children:[x.jsxs("span",{className:"catalog-part-card-head",children:[x.jsx("span",{className:"catalog-part-card-name",children:p.parts[t.id].name}),!Fd(t)&&x.jsx("span",{className:"catalog-part-card-kind",children:p.kindOnly(t.kinds.map(a=>d.shelf.kinds[a]).join("、"))})]}),x.jsx("span",{className:"catalog-part-card-words",children:t.words.map(a=>x.jsx("code",{children:Hg(a)},a))})]})}const e4=11,t4=1.5,Xl=1.2,Bo=[.25,4];function n4(t,s,c,d=e4){if(t.width<=0||t.height<=0||s.width<=0||s.height<=0)return 1;const p=Math.min(t.width/s.width,t.height/s.height),a=c>0?d/c:0;return Math.min(t4,Math.max(a,p))}const Jl=(t,s)=>Math.min(Bo[1],Math.max(Bo[0],t*s)),Ci=t=>Number.parseFloat(t)||0;function up(t,s,{palette:c,theme:d,lang:p,onStep:a,fitHeight:r=!1,onPlayer:l}){const[f,u]=qe.useState(null),g=qe.useRef(a),b=qe.useRef(l);return qe.useEffect(()=>{g.current=a,b.current=l}),qe.useEffect(()=>{const w=t.current;if(!w||!s)return;const v=Rg(w,s,{palette:c,theme:d,lang:p,onStep:M=>g.current(M),fitHeight:r});b.current?.(v);const A=w.querySelector(".dg-frame"),N=()=>{const M=w.querySelector('svg[data-dragon="figure"]');if(!A||!M||M.dataset.view!=="fixed"){u(null);return}if(A.clientWidth===0)return;const D=getComputedStyle(A),z={width:A.clientWidth-Ci(D.paddingLeft)-Ci(D.paddingRight),height:A.clientHeight-Ci(D.paddingTop)-Ci(D.paddingBottom)},H=M.viewBox.baseVal,Z=M.querySelector(".dg-sn"),j=Z?Ci(getComputedStyle(Z).fontSize):0,R=r?fg:void 0;u({width:H.width,scale:n4(z,{width:H.width,height:H.height},j,R)})},S=new ResizeObserver(N);return A&&S.observe(A),()=>{S.disconnect(),v.destroy(),b.current?.(null)}},[t,s,c,d,p,r]),f}const Pg="(max-width: 439px)";function a4(t){const s=matchMedia(Pg);return s.addEventListener("change",t),()=>s.removeEventListener("change",t)}const s4=()=>matchMedia(Pg).matches;function Ug(){return qe.useSyncExternalStore(a4,s4)}const Fl="site";function Gg(t){const s=ms(t);if(!s.ok)return null;const c=Pi(s.diagram);return c.ok?c.diagram:null}function o4(t){const s=decodeURIComponent(location.hash.slice(1));return t.find(c=>c===s)??null}function i4(t,s,c){const d=c.trim().toLowerCase();if(d==="")return!0;const p=fs(t,s);return[p?.title??"",p?.about??"",t].some(a=>a.toLowerCase().includes(d))}function r4({kind:t,lang:s,theme:c,palette:d}){const p=Et[s],a=p.site.catalog,r=zg(t),[l,f]=qe.useState(""),[u,g]=qe.useState(()=>o4(r)),[b,w]=qe.useState("figure"),[v,A]=qe.useState("notation"),[N,S]=qe.useState(null),[M,D]=qe.useState(!1),z=N?.site===d?N.palette:Fl,H=z===Fl?d:z,Z=r.filter(_=>i4(_,s,l)),j=u!==null&&r.includes(u)?u:r[0],R=p.shelf.kinds[t];return x.jsxs("div",{className:"catalog-page","data-catalog":"category",children:[x.jsxs("div",{className:"catalog-hero",children:[x.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":a.crumb,children:[x.jsx("a",{href:Tt.home,onClick:_=>jt(_),children:p.site.nav.home}),x.jsx("span",{"aria-hidden":"true",children:"›"}),x.jsx("a",{href:Tt.catalog,onClick:_=>jt(_),children:p.site.screens.catalog.title}),x.jsx("span",{"aria-hidden":"true",children:"›"}),x.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:R})]}),x.jsx("h1",{className:"catalog-title",children:R}),x.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:a.kinds[t]}),x.jsxs("div",{className:"catalog-meta",children:[x.jsx("span",{className:"catalog-count","data-catalog":"count",children:a.total(r.length)}),Z.length!==r.length&&x.jsx("span",{className:"catalog-count catalog-count-filter",children:a.showing(Z.length)})]})]}),x.jsxs("div",{className:"catalog-body",children:[x.jsxs("aside",{className:"catalog-sidebar","data-catalog":"sidebar","aria-label":a.list,children:[x.jsxs("div",{className:"catalog-search-wrap",children:[x.jsx("span",{className:"catalog-search-icon","aria-hidden":"true"}),x.jsx("input",{type:"text",className:"catalog-search","data-catalog":"search",placeholder:a.search,"aria-label":a.searchLabel,value:l,onChange:_=>f(_.target.value)}),l!==""&&x.jsx("button",{type:"button",className:"catalog-search-clear","data-catalog":"search-clear","aria-label":a.clearSearch,onClick:()=>f(""),children:"×"})]}),x.jsx("div",{className:"catalog-list",role:"list",children:Z.length===0?x.jsx("p",{className:"catalog-list-empty","data-catalog":"empty",children:a.nothing}):Z.map(_=>x.jsx("button",{type:"button",role:"listitem",className:"catalog-list-item","data-catalog":"item","aria-current":_===j?"true":void 0,onClick:()=>g(_),children:fs(_,s)?.title??_},_))})]}),x.jsx("section",{className:"catalog-preview","data-catalog":"preview","aria-label":a.preview,children:j!==void 0&&x.jsx(l4,{sample:j,lang:s,theme:c,palette:H,choice:z,onChoice:_=>S(_===Fl?null:{site:d,palette:_}),view:b,onView:w,source:v,onSource:A,onExpand:()=>D(!0)},j)})]}),x.jsxs("section",{className:"catalog-section catalog-uses","data-catalog":"uses","aria-label":a.uses,children:[x.jsxs("header",{className:"catalog-section-head",children:[x.jsx("h2",{className:"catalog-section-title",children:a.uses}),x.jsx("p",{className:"catalog-section-lead",children:a.usesLead})]}),x.jsx("div",{className:"catalog-part-grid",children:Vk(t).map(_=>x.jsx(Ld,{part:_,lang:s,name:"uses-part"},_.id))})]}),M&&j!==void 0&&x.jsx(c4,{sample:j,lang:s,theme:c,palette:H,onClose:()=>D(!1)})]})}function l4({sample:t,lang:s,theme:c,palette:d,choice:p,onChoice:a,view:r,onView:l,source:f,onSource:u,onExpand:g}){const b=Et[s],w=b.site.catalog,v=Ra(t,s),A=fs(t,s),N=A?.title??t,S=qe.useMemo(()=>Gg(v),[v]),M=qe.useRef(null),[D,z]=qe.useState(0),[H,Z]=qe.useState(1),[j,R]=qe.useState(!1),_=Ug(),P=up(M,S,{palette:d,theme:c,lang:s,onStep:z});qe.useEffect(()=>{if(!j)return;const X=window.setTimeout(()=>R(!1),1600);return()=>window.clearTimeout(X)},[j]);const B=S?.steps.length??0,ne=S?.steps[Math.min(D,B-1)],ae=B>1&&ne!==void 0,fe=P?Jl(P.scale,H):null,pe=P!==null&&r==="figure",Ae=fe===null||!pe?"—":`${Math.round(fe*100)}%`,C=X=>{P&&Z(Jl(P.scale,H*X)/P.scale)},$=f==="notation"?v:S?JSON.stringify(S,null,2):"",V=()=>{navigator.clipboard?.writeText($).then(()=>R(!0),()=>{})};return x.jsxs("article",{className:"catalog-preview-card",children:[x.jsxs("header",{className:"catalog-preview-head",children:[x.jsx("h2",{className:"catalog-preview-title",children:N}),A?.about&&x.jsx("p",{className:"catalog-preview-sub","data-catalog":"about",children:A.about})]}),x.jsxs("div",{className:"catalog-preview-tabs",children:[x.jsx("div",{className:"catalog-tablist",role:"tablist","aria-label":w.views,children:["figure","code"].map(X=>x.jsx("button",{type:"button",role:"tab",className:"catalog-preview-tab","data-catalog":`tab-${X}`,"aria-selected":r===X,onClick:()=>l(X),children:X==="figure"?w.figure:w.code},X))}),x.jsxs("div",{className:"catalog-preview-actions",children:[x.jsxs("label",{className:"catalog-option",children:[x.jsx("span",{className:"catalog-option-label",children:b.palette}),x.jsx("span",{className:"catalog-select-field",children:x.jsxs("select",{className:"catalog-select","data-catalog":"palette",value:p,onChange:X=>a(X.target.value),children:[x.jsx("option",{value:Fl,children:w.sameAsSite}),Object.values(Ba).map(X=>x.jsx("option",{value:X.id,children:b.paletteNames[X.id]??X.name},X.id))]})})]}),x.jsxs("div",{className:"catalog-zoom",role:"group","aria-label":b.stage.zoom,children:[x.jsx(Nd,{name:"zoom-out",icon:"zoom-out",label:b.stage.zoomOut,disabled:!pe||fe===Bo[0],onClick:()=>C(1/Xl)}),_?x.jsx("button",{type:"button",className:"catalog-zoom-btn catalog-zoom-fit","data-catalog":"zoom-level","aria-label":`${b.stage.fit} (${Ae})`,title:b.stage.fit,disabled:!pe,onClick:()=>Z(1),children:Ae}):x.jsx("span",{className:"catalog-zoom-value","data-catalog":"zoom-level",children:Ae}),x.jsx(Nd,{name:"zoom-in",icon:"zoom-in",label:b.stage.zoomIn,disabled:!pe||fe===Bo[1],onClick:()=>C(Xl)}),!_&&x.jsx(Nd,{name:"fit",icon:"fit",label:b.stage.fit,disabled:!pe,onClick:()=>Z(1)})]}),x.jsxs("button",{type:"button",className:"catalog-expand-btn","data-catalog":"expand","aria-label":w.expandLabel(N),onClick:g,children:[x.jsx("span",{className:"pg-icon","data-icon":"fullscreen","aria-hidden":"true"}),x.jsx("span",{children:w.expand})]})]})]}),x.jsxs("div",{className:"catalog-preview-stage pg-figure","data-catalog":"stage","data-phased":ae?"on":void 0,hidden:r!=="figure",style:P&&fe!==null?{"--fig-w":`${P.width*fe}px`}:void 0,children:[ae&&x.jsxs("p",{className:"pg-phase","data-catalog":"phase-badge",children:[x.jsx("span",{className:"pg-phase-dot","aria-hidden":"true"}),b.stage.phase(D+1,B,ne.title)]}),x.jsx("div",{className:"pg-player",ref:M})]}),r==="figure"&&(ae||ne?.body)&&x.jsxs("div",{className:"catalog-preview-note",children:[ae&&x.jsx("div",{className:"pg-progress","data-catalog":"progress","aria-hidden":"true",children:S?.steps.map((X,ie)=>x.jsx("span",{className:"pg-progress-seg","data-catalog":"progress-seg","data-done":ie<=D},`${ie}-${X.title}`))}),ne?.body&&x.jsx("p",{className:"catalog-step-note","data-catalog":"step-note",children:ne.body})]}),x.jsxs("div",{className:"catalog-source","data-catalog":"source",role:"region",hidden:r!=="code","aria-label":w.source,children:[x.jsxs("div",{className:"catalog-source-bar",children:[x.jsx("div",{className:"catalog-source-tabs",role:"group",children:["notation","json"].map(X=>x.jsx("button",{type:"button",className:"catalog-source-tab","data-catalog":`source-${X}`,"aria-pressed":f===X,onClick:()=>u(X),children:X==="notation"?b.notation:"JSON"},X))}),x.jsxs("button",{type:"button",className:"catalog-source-copy","data-catalog":"copy",onClick:V,children:[x.jsx("span",{className:"catalog-copy-icon","aria-hidden":"true"}),x.jsx("span",{"aria-live":"polite",children:j?w.copied:w.copy})]})]}),x.jsx("pre",{className:"catalog-source-code","data-catalog":"source-code",children:x.jsx("code",{children:$})})]}),x.jsx("footer",{className:"catalog-preview-foot",children:x.jsx("a",{className:"catalog-preview-link","data-catalog":"open-editor",href:`${Tt.editor}${rp(v)}`,onClick:X=>jt(X),children:w.openEditor})})]})}function Nd({name:t,icon:s,label:c,disabled:d,onClick:p}){return x.jsx("button",{type:"button",className:"catalog-zoom-btn","data-catalog":t,"aria-label":c,title:c,disabled:d,onClick:p,children:x.jsx("span",{className:"pg-icon","data-icon":s,"aria-hidden":"true"})})}function c4({sample:t,lang:s,theme:c,palette:d,onClose:p}){const a=Et[s],r=Ra(t,s),l=fs(t,s),f=qe.useMemo(()=>Gg(r),[r]),u=qe.useRef(null),g=qe.useRef(null),b=up(u,f,{palette:d,theme:c,lang:s,onStep:()=>{},fitHeight:!0}),w=qe.useRef(p);return qe.useEffect(()=>{w.current=p}),qe.useEffect(()=>{const v=document.activeElement instanceof HTMLElement?document.activeElement:null;g.current?.focus();const A=S=>{S.key==="Escape"&&w.current()};addEventListener("keydown",A);const N=document.body.style.overflow;return document.body.style.overflow="hidden",()=>{removeEventListener("keydown",A),document.body.style.overflow=N,v?.focus()}},[]),x.jsx("div",{className:"catalog-overlay","data-catalog":"overlay",role:"dialog","aria-modal":"true","aria-labelledby":"catalog-overlay-title",onClick:v=>{v.target===v.currentTarget&&p()},children:x.jsxs("div",{className:"catalog-overlay-card",children:[x.jsxs("div",{className:"catalog-overlay-head",children:[x.jsxs("div",{children:[x.jsx("h2",{className:"catalog-overlay-title",id:"catalog-overlay-title","data-catalog":"overlay-title",children:l?.title??t}),l?.about&&x.jsx("p",{className:"catalog-overlay-desc",children:l.about})]}),x.jsx("button",{ref:g,type:"button",className:"catalog-overlay-close","data-catalog":"overlay-close","aria-label":a.site.catalog.close,onClick:p,children:"×"})]}),x.jsx("div",{className:"catalog-overlay-stage pg-figure",style:b?{"--fig-w":`${b.width*b.scale}px`}:void 0,children:x.jsx("div",{className:"pg-player",ref:u})})]})})}function u4(t){let s;try{s=JSON.parse(t)}catch{return null}const c=Pi(s);return c.ok?c.diagram:null}function d4(t){const s=ms(t);return s.ok?s.diagram:null}function sc({notation:t,lang:s,theme:c,palette:d,whole:p=!1,json:a=!1,onStep:r,className:l}){const f=qe.useRef(null),u=qe.useMemo(()=>{const b=a?u4(t):d4(t);return b?p?{...b,view:"fixed"}:b:null},[t,p,a]),g=qe.useRef(r);return qe.useEffect(()=>{g.current=r}),qe.useEffect(()=>{const b=f.current;if(!b||!u)return;const w=Rg(b,u,{palette:d,theme:c,lang:s,onStep:v=>g.current?.(v)});return()=>w.destroy()},[u,d,c,s]),x.jsx("div",{ref:f,className:l})}function p4({part:t,lang:s,theme:c,palette:d}){const p=Et[s],a=p.site.catalog,r=a.parts[t.id];return x.jsxs("div",{className:"catalog-page","data-catalog":"part",children:[x.jsxs("div",{className:"catalog-hero",children:[x.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":a.crumb,children:[x.jsx("a",{href:Tt.home,onClick:l=>jt(l),children:p.site.nav.home}),x.jsx("span",{"aria-hidden":"true",children:"›"}),x.jsx("a",{href:Tt.catalog,onClick:l=>jt(l),children:p.site.screens.catalog.title}),x.jsx("span",{"aria-hidden":"true",children:"›"}),x.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:r.name})]}),x.jsx("h1",{className:"catalog-title",children:r.name}),x.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:r.desc}),x.jsxs("dl",{className:"catalog-part-facts",children:[x.jsxs("div",{className:"catalog-part-fact",children:[x.jsx("dt",{children:a.partKinds}),x.jsx("dd",{className:"catalog-part-kinds","data-catalog":"part-kinds",children:t.kinds.map(l=>x.jsx("a",{href:`${Tt.catalog}/${l}`,onClick:f=>jt(f),children:p.shelf.kinds[l]},l))})]}),x.jsxs("div",{className:"catalog-part-fact",children:[x.jsx("dt",{children:a.words}),x.jsx("dd",{className:"catalog-part-words","data-catalog":"part-words",children:t.words.map(l=>x.jsx("code",{children:Hg(l)},l))})]})]})]}),x.jsx("div",{className:"catalog-part-figures","data-count":t.kinds.length,children:t.kinds.map(l=>x.jsx(f4,{part:t,kind:l,lang:s,theme:c,palette:d},l))}),t.id==="icon"&&x.jsx(h4,{lang:s}),x.jsxs("section",{className:"catalog-section","data-catalog":"part-samples","aria-label":a.partSamples,children:[x.jsxs("header",{className:"catalog-section-head",children:[x.jsx("h2",{className:"catalog-section-title",children:a.partSamples}),x.jsx("p",{className:"catalog-section-lead",children:a.partSamplesLead})]}),x.jsx("div",{className:"catalog-part-grid",children:Wk(t).map(({key:l,kind:f})=>x.jsxs("a",{className:"catalog-part-card","data-catalog":"part-sample","data-sample":l,href:`${Tt.catalog}/${f}#${l}`,onClick:u=>jt(u),children:[x.jsxs("span",{className:"catalog-part-card-head",children:[x.jsx("span",{className:"catalog-part-card-name",children:fs(l,s)?.title??l}),x.jsx("span",{className:"catalog-part-card-kind",children:p.shelf.kinds[f]})]}),x.jsx("span",{className:"catalog-part-sample-about",children:fs(l,s)?.about})]},l))})]})]})}function h4({lang:t}){const s=Et[t].site.catalog,c=Object.keys(Ls).sort();return x.jsxs("section",{className:"catalog-section","data-catalog":"part-icons","aria-label":s.partIcons,children:[x.jsxs("header",{className:"catalog-section-head",children:[x.jsx("h2",{className:"catalog-section-title",children:s.partIcons}),x.jsx("p",{className:"catalog-section-lead",children:s.partIconsLead(c.length)})]}),x.jsx("ul",{className:"catalog-icon-grid",children:c.map(d=>x.jsxs("li",{className:"catalog-icon","data-icon":d,children:[x.jsx("span",{className:"catalog-icon-chip",dangerouslySetInnerHTML:{__html:Lx(d)??""}}),x.jsx("code",{className:"catalog-icon-name",children:d})]},d))})]})}function f4({part:t,kind:s,lang:c,theme:d,palette:p}){const a=Et[c],r=a.site.catalog,l=Jk(t.id,s,c);return x.jsxs("section",{className:"catalog-part-figure","data-catalog":"part-figure","data-kind":s,"aria-label":a.shelf.kinds[s],children:[x.jsx("h2",{className:"catalog-part-figure-title",children:a.shelf.kinds[s]}),x.jsx(sc,{className:"catalog-part-stage",notation:l,lang:c,theme:d,palette:p,whole:!0}),x.jsx("pre",{className:"catalog-part-source","data-catalog":"part-source","aria-label":r.source,children:x.jsx("code",{children:l})}),x.jsx("a",{className:"catalog-preview-link catalog-part-open","data-catalog":"part-open-editor",href:`${Tt.editor}${rp(l)}`,onClick:f=>jt(f),children:r.openEditor})]})}const m4=`sequence 注文を受ける

box 客 [note: 注文する人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 台帳 [note: 注文を残す, color: green, icon: db]

step 注文を送る
  say 客が店のアプリに注文を送り、店のアプリが台帳に残す。
  客 -> 店: 注文する
  店 -> 台帳: 残す
`,g4=`sequence Take an order

box customer as Customer [note: places the order, color: slate, icon: user]
box shop as Shop app [note: takes the order, color: blue, icon: app]
box ledger as Ledger [note: keeps the order, color: green, icon: db]

step Send the order
  say The customer sends an order to the shop app, and the shop app keeps it in the ledger.
  customer -> shop: place order
  shop -> ledger: keep
`,y4=`sequence 運ばれる物を見分ける

box 客 [note: 払う人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 決済 [note: 代金を受け取る, color: violet, icon: card]

step 注文する
  say 客が店のアプリに注文を送る。
  客 -> 店: 注文する

step 払う
  say 店のアプリが注文の番号を付けて決済に回し、客が代金を払う。
  店 -> 決済: 支払いを頼む [tag: #42]
  客 -> 決済: 1200 円 [carry: coin]

step 知らせる
  say 決済が、払われたことを店のアプリに知らせる。
  決済 -> 店: 払われた [carry: none]
`,b4=`sequence Tell what travels

box customer as Customer [note: pays, color: slate, icon: user]
box shop as Shop app [note: takes the order, color: blue, icon: app]
box payment as Payment [note: takes the money, color: violet, icon: card]

step Place the order
  say The customer sends an order to the shop app.
  customer -> shop: place order

step Pay
  say The shop app passes the order number to the payment service, and the customer pays.
  shop -> payment: ask to pay [tag: #42]
  customer -> payment: 1200 yen [carry: coin]

step Tell the shop
  say The payment service tells the shop app that the order is paid.
  payment -> shop: paid [carry: none]
`,v4=`sequence 在庫を確かめる

box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 倉庫 [note: 在庫を持つ, color: amber, icon: box]

step 在庫を聞く
  say 店のアプリが倉庫に在庫を聞き、倉庫は棚を数えてから答える。
  店 -> 倉庫: 在庫はあるか
  act 倉庫: 棚を数える
  倉庫 -> 店: 3 個ある
`,x4=`sequence Check the stock

box shop as Shop app [note: takes the order, color: blue, icon: app]
box warehouse as Warehouse [note: holds the stock, color: amber, icon: box]

step Ask for stock
  say The shop app asks the warehouse for stock, and the warehouse counts the shelf before it answers.
  shop -> warehouse: in stock?
  act warehouse: count the shelf
  warehouse -> shop: 3 left
`,w4=`git fix は merge commit で、feature は当て直して取り込む

branch main [note: 取り込む先]
branch feature [note: 作業の枝]
branch fix [note: 直しの枝]

step 枝を切る
  say main の A から fix と feature を切り、それぞれに commit を積む。
  commit A on main [hash: 3fa0c19, note: 最初の形]
  fix from A
  commit F on fix [hash: 9b2e4d1, note: 誤字を直す]
  feature from A
  commit C on feature [hash: c41d0e5, note: 検索を足す]

step merge commit で取り込む
  say fix を merge commit M で main へ取り込む。M は A と F の 2 つを親に持つ。
  commit M on main merge fix [hash: 7d3a5e2, note: fix を取り込む]

step 当て直す
  say HEAD を M へ動かして枝から離し、C を M の先へ写して C' を作る。
  HEAD -> M
  commit C' on main copy C [hash: a90c6b4, note: 検索を足す]

step 早送りする
  say feature を C' へ動かし、main も C' まで進める。元の C はどの枝からも辿れなくなる。
  feature -> C'
  main -> C'
`,k4=`git Merge fix with a merge commit and replay feature

branch main [note: Target]
branch feature [note: Work branch]
branch fix [note: Fix branch]

step Cut branches
  say Cut fix and feature from A on main, and add a commit to each.
  commit A on main [hash: 3fa0c19, note: First shape]
  fix from A
  commit F on fix [hash: 9b2e4d1, note: Fix a typo]
  feature from A
  commit C on feature [hash: c41d0e5, note: Add search]

step Merge commit
  say Merge fix into main with merge commit M. M has two parents, A and F.
  commit M on main merge fix [hash: 7d3a5e2, note: Merge fix]

step Replay
  say Move HEAD to M to detach it, and copy C onto M as C'.
  HEAD -> M
  commit C' on main copy C [hash: a90c6b4, note: Add search]

step Fast-forward
  say Move feature to C', and move main up to C' too. The old C can no longer be reached from any branch.
  feature -> C'
  main -> C'
`,E4=`{
  "version": 1,
  "kind": "sequence",
  "title": "Ask to sign in",
  "boxes": [
    {
      "id": "browser",
      "name": "User's browser",
      "sub": "operated by the user"
    },
    {
      "id": "app",
      "name": "App",
      "sub": "asks for sign-in"
    }
  ],
  "steps": [
    {
      "title": "Press sign in",
      "body": "The user presses the app's sign-in button.",
      "events": [
        {
          "type": "edge",
          "from": "browser",
          "to": "app",
          "label": "GET /login",
          "carry": {
            "kind": "envelope"
          }
        }
      ]
    }
  ],
  "sequence": {
    "lifelines": [
      "browser",
      "app"
    ]
  }
}
`,A4=`{
  "version": 1,
  "kind": "sequence",
  "title": "ログインを頼む",
  "boxes": [
    {
      "id": "ブラウザ",
      "name": "利用者のブラウザ",
      "sub": "利用者が操作する"
    },
    {
      "id": "アプリ",
      "name": "アプリ",
      "sub": "ログインを頼む側"
    }
  ],
  "steps": [
    {
      "title": "ログインを押す",
      "body": "利用者がアプリのログインを押す。",
      "events": [
        {
          "type": "edge",
          "from": "ブラウザ",
          "to": "アプリ",
          "label": "GET /login",
          "carry": {
            "kind": "envelope"
          }
        }
      ]
    }
  ],
  "sequence": {
    "lifelines": [
      "ブラウザ",
      "アプリ"
    ]
  }
}
`,_4=`architecture 店と倉庫をつなぐ

group 店側 as 店 [note: 注文を受ける側, color: blue, icon: cart]
  box 受付 [note: 注文を受ける, icon: app]
  box 会計 [note: 代金を受け取る, icon: card]
end

group 倉庫側 as 倉庫 [note: 品物を送る側, color: green, icon: box]
  box 出荷 [note: 品物を送る, icon: truck]
end

step 代金を頼む
  say 受付が注文を受け、会計に代金を頼む。
  受付 -> 会計: 代金を頼む

step 出荷に回す
  say 代金が払われたら、会計が出荷に回す。
  会計 -> 出荷: 送ってよい
`,S4=`architecture Connect the shop and the warehouse

group shopSide as Shop [note: takes orders, color: blue, icon: cart]
  box desk as Order desk [note: takes the order, icon: app]
  box till as Till [note: takes the payment, icon: card]
end

group warehouseSide as Warehouse [note: sends goods, color: green, icon: box]
  box shipping as Shipping [note: sends the goods, icon: truck]
end

step Ask for payment
  say The order desk takes the order and asks the till for the payment.
  desk -> till: ask for payment

step Pass to shipping
  say Once the payment is in, the till passes the order to shipping.
  till -> shipping: ready to send
`,$4=`architecture 注文を倉庫へ回す

group 店側 as 店 [note: 注文を受ける側, color: blue, icon: cart]
  box 受付 [note: 注文を受ける, icon: app]
end

group 倉庫側 as 倉庫 [note: 品物を送る側, color: green, icon: box]
  box 出荷 [note: 品物を送る, icon: truck]
end

step 出荷に回す
  say
    受付が注文の番号を 2 つまとめて出荷に回す。
    出荷は届いた番号の順に品物を送る。
  受付 -> 出荷: 送ってよい [tag: "#42, #43"]
`,N4=`architecture Pass orders to the warehouse

group shopSide as Shop [note: takes orders, color: blue, icon: cart]
  box desk as Order desk [note: takes the order, icon: app]
end

group warehouseSide as Warehouse [note: sends goods, color: green, icon: box]
  box shipping as Shipping [note: sends the goods, icon: truck]
end

step Pass to shipping
  say
    The order desk passes two order numbers to shipping at once.
    Shipping sends the goods in the order the numbers arrived.
  desk -> shipping: ready to send [tag: "#42, #43"]
`,D4=`sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する]
box アプリ [note: ログインを頼む側]

step ログインを押す
  say 利用者がアプリのログインを押す。
  ブラウザ -> アプリ: GET /login
`,T4=`sequence Ask to sign in

box browser as User's browser [note: operated by the user]
box app as App [note: asks for sign-in]

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
`,C4=`state 注文が届くまでの状態

box 支払い待ち [note: 入金を待つ, color: amber, icon: clock]
box 発送済み [note: 業者が運ぶ, color: violet, icon: truck]
box 配達完了 [note: 受け取られた, color: green, icon: check]
box キャンセル [note: 払った分は返す, color: rose, icon: x]

支払い待ち -> キャンセル: 取り消す
キャンセル -> finish

step 注文する
  say 注文を確定すると、支払い待ちから始まる。
  start -> 支払い待ち: 注文を確定 [tag: #1042]

step 発送する
  say 入金を確かめて品物を送り、発送済みに移る。
  支払い待ち -> 発送済み: 発送 [tag: #1042]

step 届く
  say 品物が届いて配達完了に移り、注文を閉じる。
  発送済み -> 配達完了: 受け取り [tag: #1042]
  配達完了 -> finish: 注文を閉じる [tag: #1042]
`,O4=`state States of an order until it arrives

box awaiting as Awaiting payment [note: Waits for funds, color: amber, icon: clock]
box shipped as Shipped [note: With the carrier, color: violet, icon: truck]
box delivered as Delivered [note: Handed over, color: green, icon: check]
box cancelled as Cancelled [note: Payment returned, color: rose, icon: x]

awaiting -> cancelled: Cancel
cancelled -> finish

step Place the order
  say Confirming the order starts it at Awaiting payment.
  start -> awaiting: Place order [tag: #1042]

step Ship
  say Once the payment clears, the goods go out and the order moves to Shipped.
  awaiting -> shipped: Ship [tag: #1042]

step Arrive
  say The goods arrive, the order moves to Delivered, and it closes.
  shipped -> delivered: Receive [tag: #1042]
  delivered -> finish: Close the order [tag: #1042]
`,M4=`sequence 代金を払う

box 客 [note: 払う人, color: slate, icon: user]
box 決済 [note: 代金を受け取る, color: violet, icon: card]

step 支払いを頼む
  say
    客がカードで 1200 円を払う。
    決済はカードの持ち主を確かめてから受け取る。
  code pay(1200)
  客 -> 決済: 1200 円払う
  act 決済: 持ち主を確かめる

step 受け取る
  say 決済が代金を受け取り、受け取ったと記す。
  note 決済: 受け取った
`,B4=`sequence Pay for the order

box customer as Customer [note: pays, color: slate, icon: user]
box payment as Payment [note: takes the money, color: violet, icon: card]

step Ask to pay
  say
    The customer pays 1200 yen by card.
    The payment service checks the card holder before it takes the money.
  code pay(1200)
  customer -> payment: pay 1200 yen
  act payment: check the card holder

step Take the money
  say The payment service takes the money and marks it as received.
  note payment: received
`,j4=`sequence 注文の状態を追う

box 客 [note: 注文する人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]

strip 注文: 番号, 状態

step 注文する
  say 客が注文を送り、店のアプリが番号を振る。
  客 -> 店: 注文する
  set 番号: 42
  set 状態: 受付

step 送る
  say 店のアプリが品物を送り、注文を送った状態にする。
  店 -> 客: 品物を送る
  set 状態 [tag: 送った]
`,q4=`sequence Follow the order

box customer as Customer [note: places the order, color: slate, icon: user]
box shop as Shop app [note: takes the order, color: blue, icon: app]

strip Order: number, state

step Place the order
  say The customer sends an order, and the shop app gives it a number.
  customer -> shop: place order
  set number: 42
  set state: received

step Send the goods
  say The shop app sends the goods and marks the order as sent.
  shop -> customer: send the goods
  set state [tag: sent]
`,R4=`time ブロックが確定して戻せなくなるまで

scale slot 12s 64
period epoch 32
row ブロック [color: blue, empty: 5]
point C0 at 0
point C1 at 32
zoom 0-1

box 提案者 [color: blue, icon: user]
box ブロック [color: blue, icon: box]

strip 確定の進み: 経過, 今の epoch の票 [meter: 2/3]

step ブロックを出す
  say slot ごとに提案者が 1 人選ばれ、ブロックを 1 つ出す。上の帯は最初の 2 slot を拡大した所。
  提案者 -> ブロック [at: 0]
  提案者 -> ブロック [at: 1]
  now -> 1
  set 経過: 24 秒

step 1 epoch 分の票を集める
  say 32 slot で 1 epoch。針が過ぎた slot にブロックの印が出て、提案者が応答しなかった slot は空きの印になる。
  note C0: 提案済み [color: blue]
  span 0-31: 1 epoch = 6.4 分 [color: slate]
  now -> 31
  set 経過: 6 分 24 秒
  set 今の epoch の票: 97%

step 次の epoch へ進む
  say C0 への票が全体の 2/3 を超えたので、C0 は正当化される。次の epoch では C1 へ票が集まる。
  note C0: 正当化 [color: violet]
  note C1: 提案済み [color: blue]
  now -> 63
  set 経過: 12 分 48 秒
  set 今の epoch の票: 97%

step C0 が確定する
  say C1 も正当化されると、続けて正当化された 2 つのうち前の C0 が確定する。確定したブロックは戻せない。
  C0 -> C1: 2/3 を超えた [carry: none]
  note C1: 正当化 [color: violet]
  note C0: 確定 [color: green]
  mark ブロック 0-31 [color: green]
  span 0-31: 確定して戻せない [shape: box, color: rose]
`,z4=`time How a block becomes final

scale slot 12s 64
period epoch 32
row block [color: blue, empty: 5]
point C0 at 0
point C1 at 32
zoom 0-1

box proposer [color: blue, icon: user]
box block [color: blue, icon: box]

strip Finality: Elapsed, Votes this epoch [meter: 2/3]

step Propose blocks
  say In each slot one proposer is chosen and proposes one block. The top band zooms in on the first 2 slots.
  proposer -> block [at: 0]
  proposer -> block [at: 1]
  now -> 1
  set Elapsed: 24 s

step Collect one epoch of votes
  say 32 slots make one epoch. A block mark appears on each slot the needle passes, and a slot whose proposer did not answer gets an empty mark.
  note C0: Proposed [color: blue]
  span 0-31: 1 epoch = 6.4 min [color: slate]
  now -> 31
  set Elapsed: 6 min 24 s
  set Votes this epoch: 97%

step Move to the next epoch
  say Votes for C0 passed 2/3 of the total, so C0 is justified. In the next epoch, votes gather on C1.
  note C0: Justified [color: violet]
  note C1: Proposed [color: blue]
  now -> 63
  set Elapsed: 12 min 48 s
  set Votes this epoch: 97%

step C0 becomes final
  say Once C1 is justified too, the earlier of the two justified in a row, C0, becomes final. A final block cannot be undone.
  C0 -> C1: over 2/3 [carry: none]
  note C1: Justified [color: violet]
  note C0: Final [color: green]
  mark block 0-31 [color: green]
  span 0-31: Final, cannot be undone [shape: box, color: rose]
`,F4=`tree 取引が含まれることを確かめる

step 取引ごとに値を出す
  say 4件の取引それぞれから値を出す。この値が木の葉になる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]
  leaf 取引3 [hash: c41d]
  leaf 取引4 [hash: e5f8]

step 2つずつ組む
  say 隣どうしの値を2つずつつないで、もう1度値を出す。親が2つできる。
  node 1と2 of 取引1, 取引2 [hash: 7a21]
  node 3と4 of 取引3, 取引4 [hash: b9e4]

step 根ができる
  say 残った2つを組むと、全ての取引の値をまとめた根が1つできる。
  node 根 of 1と2, 3と4 [hash: e71c]

step 取引3から根まで上る
  say 隣の値を受け取りながら親へ上る。取引1と取引2を読まなくても、根の値が出る。
  取引3 -> 3と4 [tag: c41d]
  取引4 -> 3と4 [tag: e5f8]
  3と4 -> 根 [tag: b9e4]
  1と2 -> 根 [tag: 7a21]
`,L4=`tree Proving a transaction is included

step Hash each transaction
  say Compute a value from each of the 4 transactions. These values become the leaves.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]
  leaf tx3 [hash: c41d]
  leaf tx4 [hash: e5f8]

step Pair them up
  say Join neighbouring values two at a time and hash again. Two parents appear.
  node 1to2 of tx1, tx2 [hash: 7a21]
  node 3to4 of tx3, tx4 [hash: b9e4]

step The root appears
  say Joining the last two gives one root that sums up every transaction.
  node root of 1to2, 3to4 [hash: e71c]

step Climb from tx3 to the root
  say Take the neighbouring value at each level and climb. The root comes out without reading tx1 or tx2.
  tx3 -> 3to4 [tag: c41d]
  tx4 -> 3to4 [tag: e5f8]
  3to4 -> root [tag: b9e4]
  1to2 -> root [tag: 7a21]
`,dp=`v${"0.44.0".split(".").slice(0,2).join(".")}`,H4=["start","rules","boxes","edges","regions","state","git","time","tree","steps","strip","carry","json","place","export","migrate"],P4=["start","boxes","regions","steps","json","export"],U4={start:{screen:"editor"},rules:{section:"boxes"},boxes:{section:"edges"},edges:{section:"regions"},regions:{kind:"architecture"},state:{kind:"state"},git:{kind:"git"},time:{kind:"time"},tree:{kind:"tree"},steps:{section:"strip"},strip:{kind:"sequence"},carry:{section:"json"},json:{screen:"editor"},place:{section:"export"},export:{screen:"editor"},migrate:{screen:"editor"}},G4={place:[['import "@cardenelabs/dragon/fonts";','import { mountDiagram, parseNotation } from "@cardenelabs/dragon";',"",'const source = await (await fetch("login.dragon")).text();',"const parsed = parseNotation(source);",'if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\\n"));',"",'const host = document.getElementById("figure");','if (host === null) throw new Error("#figure not found");',"const player = mountDiagram(host, parsed.diagram);"].join(`
`),null,null],export:["npm install @cardenelabs/dragon",`pnpm add -D playwright-core
pnpm exec playwright-core install chromium`,"dragon export login.dragon --out out"]},Ll={ja:{eyebrow:t=>`使い方の案内 · ${t}`,lead:"dragon記法の書き方を 1 枚にまとめた読み物。最初の 5 分で図を動かし、決まり 4 つを押さえてから、箱、線、区画、状態遷移図、枝分かれの図、時間軸の図、木の図、段、帯、運ぶ物の順に記法の要素を掴む。JSON との行き来と、mp4 や GIF への書き出しと、前の形から書き直す対応表もここで扱う。",start:"5 分で始める →",browse:"カタログで図を見る",iconLink:"使える絵柄を部品「絵」の頁で全て見る →",sections:{start:{title:"5 分で動かす",text:["何も入れずに試すなら、編集画面を開く。左の欄に記法を書くと、右にその場で動く図が出る。","記法は行の頭の語で、その行に何を書くかが決まる。最初の行に図の種類と題を書き、`sequence` なら時間の順に箱どうしのやり取りを、`architecture` なら区画に置いた箱のつながりを描く。","次に登場する箱を `box` の行で並べ、`step` の行の下に字下げして、その段で起きることを起きる順に書く。下の例は箱 2 つと段 1 つの、いちばん小さな図になる。"],exit:"編集画面で書いてみる →"},rules:{title:"決まり",text:["dragon記法は、どの行も次の決まり 4 つに従う。決まりを押さえておけば、初めて見る行も形から読める。",'下の例は 4 つの決まりを全部使う。区画を `group` と `end` で囲み、`,` を含む札の値を `"` で囲み、長い本文を `say` の下に字下げして続けている。'],exit:"続き → 箱"},boxes:{title:"箱",text:["箱は `box <名札> as <名前> [note: <下の字>]` で宣言する。名札は線や処理で箱を指す時の呼び名で、図には名前と下の字が出る。`as <名前>` を省くと、名札がそのまま名前になる。",'`[ ]` の中に `color: <色>` を足すと箱の色の役が、`icon: <印>` を足すと名前の横の印が付き、2 つ以上は `,` で区切る。色は `blue` や `green` のような色の役の名前で、印は `user` や `db` のような名前で選ぶ。名前に `[` を、値に `,` か `]` を含める時は `"` で囲む。',"`link: <飛び先>` を足すと、描いた図でその箱が飛び先への link になり、箱の中の仕組みを描いた別の図の頁などへ移れる。飛び先は `/` で始まる path か、`http://` か `https://` で始まる URL で書く。","箱は宣言した順に並ぶ。時系列図では箱ごとに縦の線が左から右へ立ち、線はその間を走る。"],exit:"続き → 線"},edges:{title:"線",text:["線は `<名札> -> <名札>: <線の名前>` で書き、段の中に書いた順に走る。名前は省ける。","`act <名札>: <処理の名前>` は、線を引かずに箱の中で行う処理を表す。受け取った物を確かめる、数を数える、のような箱の中だけで済む動きに使う。","線の名前の置き場所は自動で決まる。崩れた時だけ、線の行の終わりに `[side: above]` か `below`、`left`、`right` を足して置く側を指す。"],exit:"続き → 区画"},regions:{title:"区画",text:["構成図では、箱を区画に分けて置ける。区画は `group <名札> as <名前> [note: <添え書き>]` の行で開いて `end` の行で閉じ、その間に書いた `box` の行の箱が区画の中に置かれる。","区画も `color:` と `icon:` を持てる。仕組みの持ち主や置き場所の境目 (チェーンと網、店と倉庫) を見せる時に使う。","同じ区画の箱が離れて並ぶ時は、同じ `group <名札>` をもう一度開いて続きの箱を書く。2 度目は名札だけを書き、名前と札は最初の 1 度だけ書く。"],exit:"構成図の見本を見る →"},state:{title:"状態遷移図",text:["1 つの物が状態を移る様子を段ごとに追う時は、最初の行を `state <題>` にする。箱が状態になり、線は状態から状態への移り変わりになる。札が乗っている状態は光り、札が出た状態には済んだ印が残る。","線の送る側に `start` を書くと始まりの印から出る線に、受ける側に `finish` を書くと終わりの印へ入る線になる。`start` と `finish` は箱の名札に使えない。","最初の `step` の行より前に書いた線は、移れるが今回は通らない道として点線で引き、運ぶ物を走らせない。どの段も辿り着かない状態 (例のキャンセル) は、図の右上の脇道の囲みに入る。"],exit:"状態遷移図の見本を見る →"},git:{title:"枝分かれの図",text:["git の枝に commit を積み、取り込むまでを段ごとに追う時は、最初の行を `git <題>` にする。枝は `branch <枝> [note: <添え書き>]` の行で上から順に宣言し、枝ごとに帯が並ぶ。箱は無くてもよい。","段の中では `commit <名札> on <枝>` で枝の先に commit を積み、`[hash: <hash>, note: <一言>]` で丸の外に hash と一言を添える。`copy <元>` を付けると元の commit を写した当て直しの commit に、`merge <枝>` を付けるとその枝の先端も親に持つ merge commit になる。","`<枝> from <commit>` でその commit から枝を切る。`<札> -> <commit>` は commit を作らずに枝の札か `HEAD` を動かし、`HEAD` を動かすと枝から離れる。どの札からも辿れなくなった commit (例の C) は点線の丸に変わる。"],exit:"枝分かれの図の見本を見る →"},time:{title:"時間軸の図",text:["決まった間隔で進む時間の上で、出来事がどの目盛りで起きたかを段ごとに追う時は、最初の行を `time <題>` にする。`scale <単位> <長さ> <数>` で目盛りを宣言すると、その数の目盛りが軸に等間隔で並ぶ。長さは数と単位 (`ms`、`s`、`min`、`h`、`d`) の組で書き、軸の時刻の字はこの長さから計算する。","`period <名前> <目盛りの数>` は区切りの境ごとに名前と番号を置き、`row <名札> [empty: <目盛り>]` は目盛りごとの印の列を、`point <名札> at <目盛り>` は軸の下の節目を宣言する。`zoom <範囲>` で選んだ目盛りは上の帯に列として並び、宣言した箱が列ごとに同じ並びで出る。線は `[at: <目盛り>]` でその列の箱どうしを結び、`[into: <目盛り>]` を足すと受ける箱を別の列から選ぶ。","段の中では `now -> <目盛り>` で針を進める。針は目盛り 1 つを決まった速さで進み、過ぎた目盛りの印がその時に出るので、秒数は書かない。`mark <列> <範囲> [color: <色>]` は印の色を変え、`span <範囲>: <字>` は軸の下に範囲の括弧を出し、`[shape: box]` を付けると印の列を囲む枠になる。節目の状態は `note` で書き換え、節目どうしにも線を引ける。","中身の帯の欄の名前の後ろに `[meter: <割合>]` を付けると物差しになり、その割合の所に線を引く。`set <欄>: <割合>` を書いた段で、針と一緒に値まで満ちる。"],exit:"時間軸の図の見本を見る →"},tree:{title:"木の図",text:["葉の値を親へ畳み上げて1つの根にまとめる構造を段ごとに追う時は、最初の行を `tree <題>` にする。葉と親は段の中に書き、書いた段で箱が現れる。`leaf <名札> [hash: <値>]` が葉で、書いた順に左から並ぶ。`hash` を書くと箱に値を出し、名札は葉の下の札に出す。","`node <名札> of <子>, <子> [hash: <値>]` が親で、`of` の後ろに組む子を並べる。親は子の真ん中の上に置かれ、親と子を木の線が結ぶ。どの親にも組まれなかった箱が根で、上の真ん中に置かれる。根は1つにする。","親子の箱どうしに `<子> -> <親> [tag: <値>]` の線を書くと、運ぶ物は木の線の上を走り、通った木の線はその色で残る。木の線を運ぶ物が通った段から後は、運ぶ物を送るか受けた箱だけを濃く出す。木の図では `group` を書けず、`box` で宣言した箱は木の右に並ぶ。"],exit:"木の図の見本を見る →"},steps:{title:"段",text:["段は `step <見出し>` の行で区切り、図はこの単位で 1 段ずつ進む。段の中の行は字下げして書き、その段で起きることを語る `say` の行を必ず書く。本文を 2 行以上に分ける時は、`say` だけの行の下に、さらに深く字下げして続ける。","例の `code pay(1200)` の行のように、`code` の行はその段で打つ命令になる。1 つの段に 1 行まで書ける。","`source <名前> [url: <URL>]` の行は、その段の出典になる。1 つの段に何行でも書け、図と見える語りには出さず、読み上げの段の一覧に名前の link で出る。URL の形は箱の飛び先と同じ。","`note <名札>: <字>` は、その段から箱の下の字を書き換える。残高や状態のように、段を追って替わる値を箱の上で見せる。","見せ方は最初の行の終わりに `[view: fixed]` か `[view: follow]` を足して選ぶ。`fixed` は全体を止めて中だけを動かし、`follow` は今動いている所へ寄って動かす。書かなければ、全体を枠に収めた時の字の大きさで決まる。"],exit:"続き → 帯"},strip:{title:"帯",text:["帯は図に添える中身の表で、段を追って替わる値を見せる。`strip <題>: <欄>, <欄>` で欄を宣言する。","段の中で `set <欄>: <値>` と書くとその欄に値が入り、`set <欄> [tag: <札>]` と書くとその欄に札が付く。","認可コードや注文の状態のように、やり取りの間に持ち物が替わる様子を、線とは別に追える。"],exit:"時系列図の見本を見る →"},carry:{title:"運ぶ物",text:["線の上には、何が運ばれたかを示す物が走る。何も書かなければ封筒が走る。","線の行の終わりに `[tag: <値>]` を足すと字を書いた札を、`[carry: coin]` を足すと硬貨を走らせる。番号や証明のような値が動く線には札を、代金やトークンのように価値が動く線には硬貨を使う。","`[carry: none]` は何も走らせない。知らせるだけで物が動かない線に使う。"],exit:"続き → JSON"},json:{title:"JSON",text:["記法と JSON は行き来できる。人は記法で書き、道具や AI は JSON (原本) で持つ。下の例は 5 分で動かすの節の図を JSON で書いた物で、図はその JSON をそのまま読んで描いている。","JSON は `version` に形式の版を持ち、古い版は読む時に今の形へ直す。形は package の `src/schemas/diagram.schema.json` が持つ。","`parseNotation` は記法を JSON に、`printNotation` は JSON を記法に直し、`readDiagram` は JSON を確かめて読む。JSON から記法へ書き戻すと決まった並べ方に整うので、書き手の行の並べ方と `//` で始まる注釈の行は残らない。"],exit:"編集画面で JSON を取り込む →"},place:{title:"頁に置く",text:["自分の頁に図を置く時は、頁で 1 度だけ字の入口 `@cardenelabs/dragon/fonts` を import し、記法を読んだ原本を `mountDiagram` に渡す。下の例は package の README と同じ物。","字の入口は、同梱の 2 つの字 (Noto Sans JP と JetBrains Mono) の CSS を読み込むだけで、何も出さない。図は同梱の字で測った字の幅で組むため、読み込まないと端末の字で描かれ、札から字がはみ出すことがある。CSS と字の file は、束ねる道具 (Vite など) が頁へ運ぶ。","`mountDiagram` が返す `player` で段を動かす (`next`、`prev`、`play`、`pause`、`destroy`)。3 つめの引数には、色味や段が替わった時に呼ぶ関数などの設定 (`PlayerOptions`) を渡す。"],exit:"続き → 書き出し"},export:{title:"書き出し",text:["同じ原本から、mp4、GIF、HTML、PNG を書き出せる。package を入れると `dragon` の命令が使える。","書き出しは画面なしの Chromium で、頁と同じ描画を 1 コマずつ撮る。Chromium を動かす `playwright-core` は、書き出しを使う時だけ入れる。","原本の JSON (`.json`) か記法 (`.dragon`) を渡すと、同じ名前の 4 つの file を書き出す。PNG は最後の段の止め絵になる。"],exit:"編集画面から書き出す →"},migrate:{title:"前の形から書き直す",text:["前の形の記法 (`時系列図` か `構成図` で始まり、段を `#` で区切る形) は読めなくなった。前の形の行を読むと、その行の新しい形を示す誤りで止まる。","前の形を新しい形へ移す命令は無いので、下の表を見て行ごとに書き直す。左が前の形、右が新しい形になる。"],exit:"編集画面で書き直す →"}},cards:{start:"導入なし。編集画面を開いて書くだけで図が動く。",boxes:"名前と下の字と色と印で、登場する物を描く。",regions:"構成図の箱を、持ち主ごとの区画に分けて置く。",steps:"図は段ごとに進み、本文がその段の動きを語る。",json:"人は記法で、道具は JSON で、同じ図を持つ。",export:"同じ図を mp4、GIF、HTML、PNG に書き出す。"},options:{head:["設定","意味"],rows:(t,s)=>[["--out <dir>","書き出す先。無ければ作る (既定は今の dir)"],["--width <px>","枠の幅。見せ方 (`fixed` / `follow`) を選び、`follow` の時の窓の幅になる"],["--palette <名前>",`色味 (${t}、既定は \`${s}\`)`],["--theme <明暗>","`light` か `dark`"],["--lang <言葉>","図の中の字と命令の文の言葉 (`ja` か `en`)。既定は `ja`"],["--fps <数>","mp4 の 1 秒のコマの数 (既定 30)"],["--gif-fps <数>","GIF の 1 秒のコマの数 (既定 10)"],["--format <形>","書き出す形を `,` で区切る (既定 `mp4,gif,html,png`)"]]},rules:["行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる","鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる",'空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `"` で囲む',"入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする"],migration:{head:["前の形","新しい形"],rows:[["`時系列図 <題>`","`sequence <題>`"],["`構成図 <題>`","`architecture <題>`"],["`見せ方 止める`、`見せ方 寄る`","`sequence <題> [view: fixed]`、`sequence <題> [view: follow]`"],["`区画 <名札> = <名前>「<添え書き>」`","`group <名札> as <名前> [note: <添え書き>]` から `end` まで"],["箱の行の `[区画 <名札>]`","`group <名札>` と `end` の間に `box` の行を書く"],["`<名札> = <名前>「<下の字>」`","`box <名札> as <名前> [note: <下の字>]`"],["`[色 <色>]`、`[印 <印>]`","`box <名札> [color: <色>, icon: <印>]`"],["`帯 <題> = <欄>, <欄>`","`strip <題>: <欄>, <欄>`"],["`# <題>`","`step <題>`"],["`> <本文>`","`say <本文>`"],["バッククォートで囲んだ行","`code <命令>`"],["`<名札> -> <名札> : <線の名前>`","`<名札> -> <名札>: <線の名前>`"],["`[札 <値>]`、`[硬貨]`、`[なし]`","`<名札> -> <名札> [tag: <値>]`、`<名札> -> <名札> [carry: coin]`、`<名札> -> <名札> [carry: none]`"],["`[名前 上]`","`<名札> -> <名札> [side: above]`"],["`[名前 下]`","`<名札> -> <名札> [side: below]`"],["`[名前 左]`","`<名札> -> <名札> [side: left]`"],["`[名前 右]`","`<名札> -> <名札> [side: right]`"],["`<名札> : <処理の名前>`","`act <名札>: <処理の名前>`"],["`<名札>「<字>」`","`note <名札>: <字>`"],["`帯 <欄> = <値>`","`set <欄>: <値>`"],["`帯 <欄> [<札>]`","`set <欄> [tag: <札>]`"]]}},en:{eyebrow:t=>`guide • ${t}`,lead:"One page that lays out how to write dragon notation. Get a diagram moving in the first five minutes, learn the four rules, then take in the parts of the notation in order: boxes, lines, regions, state diagrams, git graphs, time diagrams, tree diagrams, steps, the strip and what travels. Going between the notation and JSON, exporting to mp4 or GIF, and a table for rewriting the old form are covered here too.",start:"Start in five minutes →",browse:"Browse the catalog",iconLink:"See every icon on the Icon part page →",sections:{start:{title:"Up and running in five minutes",text:["To try it without installing anything, open the editor. Write notation in the box on the left and a moving diagram appears on the right as you type.","The first word of each line says what the line holds. The first line gives the diagram kind and title: `sequence` draws boxes exchanging messages in time order, and `architecture` draws how boxes placed in regions connect.","Then list the boxes that take part with `box` lines, and indented under a `step` line, write what happens in that step in the order it happens. The example below is the smallest diagram: two boxes and one step."],exit:"Write one in the editor →"},rules:{title:"Rules",text:["Every line of dragon notation follows the four rules below. Once you know them, you can read a line you have not seen before from its shape.",'The example below uses all four rules. It wraps the regions in `group` and `end`, wraps a tag value that contains `,` in `"`, and continues a long body indented under `say`.'],exit:"Next → Boxes"},boxes:{title:"Boxes",text:["Declare a box with `box <id> as <name> [note: <caption>]`. The id is how lines and actions point at the box, and the name and caption are what the diagram shows. Without `as <name>`, the id is the name.",'Inside the `[ ]`, add `color: <color>` to give the box a colour role and `icon: <icon>` to put an icon next to its name, separating two or more with `,`. Colours are role names such as `blue` or `green`, and icons are names such as `user` or `db`. Wrap a name in `"` when it contains `[`, and a value when it contains `,` or `]`.',"Add `link: <target>` and the box becomes a link to that target in the drawn diagram, for example to the page of another diagram that draws what is inside the box. Write the target as a path that starts with `/` or a URL that starts with `http://` or `https://`.","Boxes line up in the order you declare them. In a sequence diagram each box gets a vertical line from left to right, and lines run between them."],exit:"Next → Lines"},edges:{title:"Lines",text:["Write a line as `<id> -> <id>: <label>`. Lines run in the order they are written in the step, and the label can be left out.","`act <id>: <action>` is something a box does inside itself, without drawing a line. Use it for work that stays inside the box, such as checking what arrived or counting.","The label is placed automatically. Only when the placement breaks, add `[side: above]`, `below`, `left` or `right` at the end of the line to say which side it goes."],exit:"Next → Regions"},regions:{title:"Regions",text:["In an architecture diagram, boxes can be placed in regions. Open a region with a `group <id> as <name> [note: <note>]` line and close it with an `end` line, and the boxes on the `box` lines in between go inside it.","Regions can also take `color:` and `icon:`. Use them to show where ownership or placement changes, such as between chains and a network, or a shop and a warehouse.","When boxes of the same region are not next to each other, open the same `group <id>` again and write the rest of its boxes. The second time, write only the id, and give the name and attributes only the first time."],exit:"See the architecture samples →"},state:{title:"State diagrams",text:["To follow one thing as it moves between states step by step, start the first line with `state <title>`. Each box is a state, and each line is a move from one state to another. The state the tag sits on lights up, and a state the tag has left keeps a done mark.","Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark. `start` and `finish` cannot be used as box ids.","Lines written before the first `step` line are paths the diagram could take but does not take this time. They are drawn dotted, and nothing travels on them. A state that no step reaches (Cancelled in the example) goes in the side-path box at the top right."],exit:"See the state diagram samples →"},git:{title:"Git graphs",text:["To follow commits on git branches step by step until they are merged, start the first line with `git <title>`. Declare branches from top to bottom with `branch <branch> [note: <note>]` lines, and each branch gets its own band. Boxes are optional.","Inside a step, `commit <id> on <branch>` adds a commit at the tip of the branch, and `[hash: <hash>, note: <note>]` puts a hash and a short note beside the circle. Add `copy <source>` for a replayed copy of another commit, or `merge <branch>` for a merge commit whose parents include the tip of that branch.","`<branch> from <commit>` cuts a branch at that commit. `<ref> -> <commit>` moves a branch ref or `HEAD` without making a commit, and moving `HEAD` detaches it from its branch. A commit that no ref can reach any more (C in the example) turns into a dotted circle."],exit:"See the git graph samples →"},time:{title:"Time diagrams",text:["To follow, step by step, which tick each event happens on while time moves at a fixed interval, start the first line with `time <title>`. `scale <unit> <length> <count>` declares the ticks, and that many ticks are spaced evenly along the axis. Write the length as a number and a unit (`ms`, `s`, `min`, `h`, `d`); the time labels on the axis are worked out from it.","`period <name> <ticks>` puts a name and a number at each period boundary, `row <id> [empty: <ticks>]` declares a row of marks with one mark per tick, and `point <id> at <tick>` declares a point below the axis. The ticks chosen with `zoom <range>` become columns in the top band, and the declared boxes appear in every column in the same order. A line with `[at: <tick>]` joins the boxes in that column, and `[into: <tick>]` picks the receiving box from another column.","Inside a step, `now -> <tick>` moves the needle. The needle moves one tick at a fixed speed and the marks it passes appear as it goes, so no seconds are written. `mark <row> <range> [color: <color>]` recolors marks, `span <range>: <text>` puts a bracket under the axis, and `[shape: box]` turns it into a frame around the rows. `note` rewrites the state of a point, and lines can join points too.","Add `[meter: <ratio>]` after the name of a strip field to make it a meter with a line at that ratio. In a step with `set <field>: <ratio>`, it fills up to the value along with the needle."],exit:"See the time diagram samples →"},tree:{title:"Tree diagrams",text:["To follow, step by step, how the values of leaves fold up through parents into one root, start the first line with `tree <title>`. Leaves and parents are written inside steps, and each box appears in the step that writes it. `leaf <id> [hash: <value>]` is a leaf, and leaves line up from the left in written order. With `hash`, the box shows the value and the id moves to a card below the leaf.","`node <id> of <child>, <child> [hash: <value>]` is a parent, and the children to join follow `of`. A parent sits above the middle of its children, and tree lines join them. The box that no parent takes is the root and sits at the top in the middle. Keep to one root.","A line `<child> -> <parent> [tag: <value>]` between a parent and a child sends its carrier along the tree line, and the tree line keeps that color once passed. From the step where a carrier first runs a tree line, only the boxes that have sent or received a carrier stay strong. A tree diagram takes no `group`, and boxes declared with `box` sit to the right of the tree."],exit:"See the tree diagram samples →"},steps:{title:"Steps",text:["Steps are separated by `step <heading>` lines, and the diagram moves on one step at a time. Indent the lines inside a step, and every step needs a `say` line that tells what happens in it. To split the body over two or more lines, write `say` alone and continue on lines indented further below it.","A `code` line, like the `code pay(1200)` line in the example, is the command for that step. A step can have at most one.","A `source <name> [url: <URL>]` line is a source for that step. A step can have any number of them. They stay out of the diagram and the shown text, and appear as links named by the source in the step list that screen readers read. The URL takes the same forms as a box link.","`note <id>: <text>` rewrites the caption under a box from that step on. Use it to show a value that changes step by step, such as a balance or a state, right on the box.","Choose the view by adding `[view: fixed]` or `[view: follow]` at the end of the first line. `fixed` keeps the whole diagram still and moves only what is inside, and `follow` moves to where things are happening. Without it, the view is chosen by the text size when the whole diagram fits the frame."],exit:"Next → The strip"},strip:{title:"The strip",text:["The strip is a table that goes with the diagram and shows values that change step by step. Declare its fields with `strip <title>: <field>, <field>`.","Inside a step, `set <field>: <value>` puts a value in a field, and `set <field> [tag: <tag>]` puts a tag on it.","It lets you follow what is held while messages go back and forth, such as an authorization code or the state of an order, apart from the lines."],exit:"See the sequence samples →"},carry:{title:"What travels",text:["Something runs along each line to show what was carried. Without any option, an envelope travels.","Adding `[tag: <value>]` at the end of the line sends a tag with text on it, and `[carry: coin]` sends a coin. Use a tag for lines that move a value such as a number or a proof, and a coin for lines that move worth such as money or tokens.","`[carry: none]` sends nothing. Use it for lines that only tell, with nothing changing hands."],exit:"Next → JSON"},json:{title:"JSON",text:["The notation and JSON convert both ways. People write the notation, and tools and AI keep the JSON (the source). The example below is the diagram from the five-minute section written as JSON, and the diagram is drawn by reading that JSON as it is.","The JSON holds the format version in `version`, and older versions are converted to the current shape when read. The shape is defined in the package's `src/schemas/diagram.schema.json`.","`parseNotation` turns the notation into JSON, `printNotation` turns JSON back into the notation, and `readDiagram` checks and reads JSON. Writing JSON back as notation uses a fixed layout, so the writer's line order and the comment lines that start with `//` are not kept."],exit:"Import JSON in the editor →"},place:{title:"Placing on a page",text:["To place a diagram on your own page, import the font entry `@cardenelabs/dragon/fonts` once on the page, and pass the source read from the notation to `mountDiagram`. The example below is the same as in the package README.","The font entry only loads the CSS for the two bundled fonts (Noto Sans JP and JetBrains Mono) and exports nothing. Diagrams are laid out with character widths measured from the bundled fonts, so without it they are drawn in the device's fonts and text can overflow its labels. A bundler (such as Vite) carries the CSS and font files to the page.","Use the `player` returned by `mountDiagram` to move through the steps (`next`, `prev`, `play`, `pause`, `destroy`). The third argument takes settings such as the palette and a function called when the step changes (`PlayerOptions`)."],exit:"Next → Export"},export:{title:"Export",text:["The same source can be exported to mp4, GIF, HTML and PNG. Install the package and the `dragon` command is available.","Export uses a headless Chromium and captures the same drawing as the page one frame at a time. Install `playwright-core`, which runs Chromium, only when you use export.","Pass the source JSON (`.json`) or the notation (`.dragon`) and it writes four files with the same name. The PNG is a still of the last step."],exit:"Export from the editor →"},migrate:{title:"Rewriting the old form",text:["The old form of the notation (steps separated by `#`, bodies starting with `>`, and the same lines in Japanese words) is no longer read. Reading an old line stops with an error that shows the new form of that line.","There is no command that moves the old form to the new one, so rewrite each line with the table below. The left column is the old form with English words, and the right column is the new form."],exit:"Rewrite in the editor →"}},cards:{start:"Nothing to set up. Open the editor and write.",boxes:"Draw what takes part with a name, a caption, a colour and an icon.",regions:"Put the boxes of an architecture diagram in regions by owner.",steps:"The diagram moves step by step, and the body tells what each step does.",json:"People keep the notation, and tools keep the same diagram as JSON.",export:"Export the same diagram to mp4, GIF, HTML and PNG."},options:{head:["Option","Meaning"],rows:(t,s)=>[["--out <dir>","Where to write. Created if missing (default: the current dir)"],["--width <px>","Frame width. Picks the view (`fixed` / `follow`) and sets the window width for `follow`"],["--palette <name>",`Colours (${t}, default \`${s}\`)`],["--theme <mode>","`light` or `dark`"],["--lang <lang>","Language of the diagram text and command messages (`ja` or `en`). Defaults to `ja`"],["--fps <n>","Frames per second of the mp4 (default 30)"],["--gif-fps <n>","Frames per second of the GIF (default 10)"],["--format <list>","Formats to write, separated by `,` (default `mp4,gif,html,png`)"]]},rules:["The first English word of a line decides its kind. Only arrow lines start with a box id","A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`",'Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`',"The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`"],migration:{head:["Old form","New form"],rows:[["`sequence <title>`, `architecture <title>`","`sequence <title>`, `architecture <title>` (unchanged)"],["`view fixed`, `view follow`","`sequence <title> [view: fixed]`, `sequence <title> [view: follow]`"],['`region <id> = <name> "<note>"`',"`group <id> as <name> [note: <note>]` through `end`"],["`[region <id>]` on a box line","`box` lines between `group <id>` and `end`"],['`<id> = <name> "<caption>"`',"`box <id> as <name> [note: <caption>]`"],["`[color <color>]`, `[icon <icon>]`","`box <id> [color: <color>, icon: <icon>]`"],["`strip <title> = <field>, <field>`","`strip <title>: <field>, <field>`"],["`# <heading>`","`step <heading>`"],["`> <body>`","`say <body>`"],["A line wrapped in backticks","`code <command>`"],["`<id> -> <id> : <label>`","`<id> -> <id>: <label>`"],["`[tag <value>]`, `[coin]`, `[none]`","`<id> -> <id> [tag: <value>]`, `<id> -> <id> [carry: coin]`, `<id> -> <id> [carry: none]`"],["`[label above]`","`<id> -> <id> [side: above]`"],["`[label below]`","`<id> -> <id> [side: below]`"],["`[label left]`","`<id> -> <id> [side: left]`"],["`[label right]`","`<id> -> <id> [side: right]`"],["`<id> : <action>`","`act <id>: <action>`"],['`<id> "<text>"`',"`note <id>: <text>`"],["`strip <field> = <value>`","`set <field>: <value>`"],["`strip <field> [<tag>]`","`set <field> [tag: <tag>]`"]]}}},Y4=Object.assign({"./examples/boxes.dragon":m4,"./examples/boxes.en.dragon":g4,"./examples/carry.dragon":y4,"./examples/carry.en.dragon":b4,"./examples/edges.dragon":v4,"./examples/edges.en.dragon":x4,"./examples/git.dragon":w4,"./examples/git.en.dragon":k4,"./examples/json.en.json":E4,"./examples/json.json":A4,"./examples/regions.dragon":_4,"./examples/regions.en.dragon":S4,"./examples/rules.dragon":$4,"./examples/rules.en.dragon":N4,"./examples/start.dragon":D4,"./examples/start.en.dragon":T4,"./examples/state.dragon":C4,"./examples/state.en.dragon":O4,"./examples/steps.dragon":M4,"./examples/steps.en.dragon":B4,"./examples/strip.dragon":j4,"./examples/strip.en.dragon":q4,"./examples/time.dragon":R4,"./examples/time.en.dragon":z4,"./examples/tree.dragon":F4,"./examples/tree.en.dragon":L4});function V4(t,s){return Y4[`./examples/${t}${s==="en"?".en":""}.${t==="json"?"json":"dragon"}`]?.trimEnd()}function Oi(t){return t.split("`").map((s,c)=>x.jsx(qe.Fragment,{children:c%2===1?x.jsx("code",{children:s}):s},c))}function X4(t){return"section"in t?`#${t.section}`:"kind"in t?`${Tt.catalog}/${t.kind}`:Tt[t.screen]}function P0({head:t,rows:s,docs:c}){return x.jsxs("table",{className:"docs-options","data-docs":c,children:[x.jsx("thead",{children:x.jsx("tr",{children:t.map(d=>x.jsx("th",{children:d},d))})}),x.jsx("tbody",{children:s.map(([d,p],a)=>x.jsxs("tr",{children:[x.jsx("td",{children:d}),x.jsx("td",{children:p})]},a))})]})}function J4({id:t,index:s,lang:c,theme:d,palette:p}){const a=Ll[c].sections[t],r=V4(t,c),l=G4[t]??[],f=U4[t],{options:u,rules:g,migration:b}=Ll[c];return x.jsxs("section",{id:t,className:"docs-sec","data-docs":"section",children:[x.jsxs("div",{className:"docs-sec-head",children:[x.jsx("span",{className:"docs-sec-no","data-docs":"section-no",children:String(s+1).padStart(2,"0")}),x.jsx("h2",{children:a.title})]}),a.text.map((w,v)=>x.jsxs(qe.Fragment,{children:[x.jsx("p",{className:"docs-sec-text","data-docs":"text",children:Oi(w)}),l[v]!=null&&x.jsx("pre",{className:"docs-command","data-docs":"command",children:x.jsx("code",{children:l[v]})})]},w)),t==="boxes"&&x.jsx("a",{className:"docs-sec-cta","data-docs":"icon-link",href:`${Tt.catalog}/part/icon`,onClick:w=>jt(w),children:Ll[c].iconLink}),t==="rules"&&x.jsx("ol",{className:"docs-rules","data-docs":"rules",children:g.map(w=>x.jsx("li",{"data-docs":"rule",children:Oi(w)},w))}),r!==void 0&&x.jsxs("div",{className:"docs-example","data-docs":"example",children:[x.jsx("pre",{className:"docs-example-code","data-docs":"example-code",children:x.jsx("code",{children:r})}),x.jsx(sc,{className:"docs-example-figure",notation:r,json:t==="json",lang:c,theme:d,palette:p,whole:!0})]}),t==="export"&&x.jsx(P0,{head:u.head,rows:u.rows(Object.keys(Ba).map(w=>`\`${w}\``).join(" / "),Gl).map(([w,v])=>[x.jsx("code",{children:w},"option"),Oi(v)])}),t==="migrate"&&x.jsx(P0,{head:b.head,rows:b.rows.map(([w,v])=>[Oi(w),Oi(v)]),docs:"migration"}),x.jsx("a",{className:"docs-sec-cta","data-docs":"section-cta",href:X4(f),onClick:"section"in f?void 0:w=>jt(w),children:a.exit})]})}function Q4({lang:t,theme:s,palette:c}){const d=Ll[t];return qe.useEffect(()=>{const p=decodeURIComponent(location.hash.slice(1));p!==""&&document.getElementById(p)?.scrollIntoView()},[]),x.jsxs("div",{className:"docs",children:[x.jsxs("section",{className:"docs-hero","data-docs":"hero",children:[x.jsx("div",{className:"docs-eyebrow","data-docs":"eyebrow",children:d.eyebrow(dp)}),x.jsx("h1",{children:Et[t].site.screens.docs.title}),x.jsx("p",{className:"docs-lead","data-docs":"lead",children:d.lead}),x.jsxs("div",{className:"docs-cta","data-docs":"cta",children:[x.jsx("a",{className:"docs-btn-primary",href:Tt.editor,onClick:p=>jt(p),children:d.start}),x.jsx("a",{className:"docs-btn-secondary",href:Tt.catalog,onClick:p=>jt(p),children:d.browse})]})]}),x.jsx("nav",{className:"docs-features","data-docs":"features",children:P4.map(p=>x.jsxs("a",{className:"docs-card","data-docs":"card",href:`#${p}`,children:[x.jsx("span",{className:"docs-card-icon","data-icon":p,"aria-hidden":"true"}),x.jsx("span",{className:"docs-card-name","data-docs":"card-name",children:d.sections[p].title}),x.jsx("p",{children:d.cards[p]})]},p))}),x.jsx("div",{className:"docs-sections",children:H4.map((p,a)=>x.jsx(J4,{id:p,index:a,lang:t,theme:s,palette:c},p))})]})}const Z4=`sequence ログイン処理

box 利用者 [note: 画面, color: slate, icon: user]
box API [note: 受付, color: blue, icon: server]
box 台帳 [note: DB, color: green, icon: db]

step 認証を頼む
  say 利用者が ID とパスワードを API に送る。
  利用者 -> API: POST /login

step 台帳を引く
  say API が台帳から利用者の行を引く。
  API -> 台帳: SELECT user
  台帳 -> API: row

step 結果を返す
  say API が利用者にログインの結果を返す。
  API -> 利用者: 200 OK
`,K4=`sequence Sign-in

box user as User [note: screen, color: slate, icon: user]
box api as API [note: front desk, color: blue, icon: server]
box ledger as Ledger [note: DB, color: green, icon: db]

step Ask to sign in
  say The user sends an ID and a password to the API.
  user -> api: POST /login

step Look up the ledger
  say The API reads the user's row from the ledger.
  api -> ledger: SELECT user
  ledger -> api: row

step Return the result
  say The API returns the sign-in result to the user.
  api -> user: 200 OK
`,W4={ja:Z4.trimEnd(),en:K4.trimEnd()},I4="login.dragon",e5=["write","play","share"],t5=/^step(\s|$)/u;function n5(t){const s=t.split(`
`),c=s.flatMap((d,p)=>t5.test(d)?[p]:[]);return c.map((d,p)=>{let a=(c[p+1]??s.length)-1;for(;a>d&&(s[a]??"").trim()==="";)a--;return Array.from({length:a-d+1},(r,l)=>d+l+1)})}function a5(t){let s;return t.map((c,d)=>{const p=c.trim(),a=c.length-c.trimStart().length;if(s!==void 0&&p!==""&&a>s)return"say";s=void 0;const r=p.split(/\s/u)[0];return p.startsWith("//")?"comment":r==="step"?"step":r==="say"?(s=a,"say"):r==="code"?"code":d===0?"head":void 0})}function s5({lang:t,theme:s,palette:c}){const d=Et[t],p=W4[t],[a,r]=qe.useState(0),l=qe.useMemo(()=>{const b=ms(p);return b.ok?b.diagram.steps:[]},[p]),f=new Set(n5(p)[a]??[]),u=qe.useMemo(()=>a5(p.split(`
`)),[p]),g=l[Math.min(a,l.length-1)];return x.jsx("section",{className:"home-demo","data-home":"demo",children:x.jsxs("div",{className:"home-canvas",children:[x.jsxs("div",{className:"home-canvas-bar",children:[x.jsxs("div",{className:"home-canvas-file",children:[x.jsxs("span",{className:"home-dots","aria-hidden":"true",children:[x.jsx("span",{}),x.jsx("span",{}),x.jsx("span",{})]}),x.jsx("span",{className:"home-file","data-home":"demo-file",children:I4})]}),g!==void 0&&x.jsxs("span",{className:"home-phase","data-home":"demo-phase",children:[x.jsx("span",{className:"home-live-dot","aria-hidden":"true"}),d.stage.phase(Math.min(a,l.length-1)+1,l.length,g.title)]})]}),x.jsxs("div",{className:"home-canvas-body",children:[x.jsx("div",{className:"home-code","data-home":"demo-code",children:p.split(`
`).map((b,w)=>x.jsxs("div",{className:"home-code-line","data-line":w+1,"data-current":f.has(w+1),"data-kind":u[w],children:[x.jsx("span",{className:"home-ln","aria-hidden":"true",children:w+1}),x.jsx("span",{className:"home-code-text","data-home":"code-text",children:b})]},w))}),x.jsx(sc,{className:"home-canvas-stage",notation:p,lang:t,theme:s,palette:c,onStep:r,whole:!0})]})]})})}function o5({lang:t,theme:s,palette:c}){const d=Et[t].site,p=d.home,[a,r,l]=p.title,f=Et[t].shelf.kinds,u=iw.flatMap(g=>{const b=fs(g,t);return b?[{key:g,...b}]:[]});return x.jsxs("div",{className:"home",children:[x.jsxs("section",{className:"home-hero","data-home":"hero",children:[x.jsxs("div",{className:"home-eyebrow",children:[x.jsx("span",{className:"home-chip","data-home":"version",children:dp}),x.jsx("span",{className:"home-chip",children:p.chip(Object.values(f))})]}),x.jsxs("h1",{children:[a,x.jsx("em",{children:r}),l]}),x.jsx("p",{className:"home-lead",children:p.lead}),x.jsxs("div",{className:"home-cta",children:[x.jsx("a",{className:"home-btn-primary",href:Tt.editor,onClick:g=>jt(g),children:d.openEditor}),x.jsx("a",{className:"home-btn-secondary",href:Tt.docs,onClick:g=>jt(g),children:p.readDocs})]})]}),x.jsx(s5,{lang:t,theme:s,palette:c}),x.jsxs("section",{className:"home-features","data-home":"features",children:[x.jsxs("div",{className:"home-head",children:[x.jsx("span",{className:"home-head-eyebrow",children:p.features.eyebrow}),x.jsx("h2",{children:p.features.title})]}),x.jsx("div",{className:"home-grid",children:p.features.items.map((g,b)=>x.jsxs("div",{className:"home-feature","data-home":"feature",children:[x.jsx("span",{className:"home-feature-icon","data-home":"feature-icon","data-icon":e5[b],"aria-hidden":"true"}),x.jsx("h3",{children:g.title}),x.jsx("p",{children:g.text})]},g.title))})]}),x.jsxs("section",{className:"home-steps","data-home":"steps",children:[x.jsxs("div",{className:"home-head",children:[x.jsx("span",{className:"home-head-eyebrow",children:p.steps.eyebrow}),x.jsx("h2",{children:p.steps.title})]}),x.jsx("div",{className:"home-grid",children:p.steps.items.map((g,b)=>x.jsxs("div",{className:"home-step","data-home":"step",children:[x.jsx("div",{className:"home-step-no","data-home":"step-no",children:String(b+1).padStart(2,"0")}),x.jsx("h3",{children:g.title}),x.jsx("p",{children:g.text}),b===1&&x.jsx("pre",{className:"home-step-code","data-home":"step-code",children:Rl[t]})]},g.title))})]}),x.jsxs("section",{className:"home-uses","data-home":"uses",children:[x.jsxs("div",{className:"home-head",children:[x.jsx("span",{className:"home-head-eyebrow",children:p.uses.eyebrow}),x.jsx("h2",{children:p.uses.title})]}),x.jsx("div",{className:"home-use-grid",children:u.map(g=>x.jsxs("a",{className:"home-use","data-home":"use",href:`${Tt.catalog}/${g.kind}`,onClick:b=>jt(b),children:[x.jsx(sc,{className:"home-use-thumb",notation:Ra(g.key,t),lang:t,theme:s,palette:c,whole:!0}),x.jsxs("div",{className:"home-use-body",children:[x.jsx("span",{className:"home-use-kind","data-home":"use-kind",children:f[g.kind]}),x.jsx("h3",{children:g.title}),x.jsx("p",{"data-home":"use-about",children:g.about})]})]},g.key))}),x.jsx("div",{className:"home-uses-more","data-home":"uses-more",children:x.jsx("a",{className:"home-link",href:Tt.catalog,onClick:g=>jt(g),children:p.uses.more})})]}),x.jsxs("section",{className:"home-closing","data-home":"closing",children:[x.jsx("h2",{children:p.closing.title}),x.jsx("p",{children:p.closing.lead}),x.jsxs("div",{className:"home-cta",children:[x.jsx("a",{className:"home-btn-primary",href:Tt.editor,onClick:g=>jt(g),children:d.openEditor}),x.jsx("a",{className:"home-btn-secondary",href:lp,target:"_blank",rel:"noopener noreferrer",children:"GitHub ↗"})]})]})]})}const U0=["editor","catalog","docs"],i5=4;function r5({lang:t,path:s}){const c=Et[t].site,d=c.notFound,p=c.screens["not-found"].title,a={editor:c.openEditor,catalog:d.catalog,docs:d.docs};return x.jsxs("section",{className:"not-found",children:[x.jsxs("div",{className:"not-found-code","data-not-found":"code","aria-label":"404",children:[x.jsx("span",{"aria-hidden":"true",children:"4"}),x.jsx("span",{className:"not-found-zero","aria-hidden":"true",children:"0"}),x.jsx("span",{"aria-hidden":"true",children:"4"})]}),x.jsx("div",{className:"not-found-ticks","aria-hidden":"true",children:Array.from({length:i5},(r,l)=>x.jsx("span",{},l))}),x.jsxs("h1",{children:[x.jsx("em",{children:d.em}),p.slice(d.em.length)]}),x.jsx("p",{className:"not-found-lead","data-not-found":"lead",children:d.lead(U0.length)}),x.jsx("div",{className:"not-found-cta","data-not-found":"cta",children:U0.map((r,l)=>x.jsx("a",{className:l===0?"not-found-btn-primary":"not-found-btn-secondary",href:Tt[r],onClick:f=>jt(f),children:a[r]},r))}),x.jsx("p",{className:"not-found-path","data-not-found":"path",children:s})]})}const Yg=t=>t.map((s,c)=>({n:s,i:c})).sort((s,c)=>(s.n.line??1/0)-(c.n.line??1/0)||s.i-c.i).map(({n:s})=>s),l5=t=>Yg(t.map(s=>({line:s.line,text:s.message})));function c5(t,s){const c=s===void 0?void 0:h5(s);return Yg(t.map(d=>{const p=c?p5(c,d.pointer):void 0;return{...p!==void 0?{line:p}:{},text:`${d.pointer||"/"} — ${d.message}`}}))}function u5(t,s){const c=/\bline (\d+)/u.exec(t);if(c)return Number(c[1]);const d=/\bposition (\d+)/u.exec(t);if(d)return s.slice(0,Number(d[1])).split(`
`).length}const d5=t=>t.replaceAll("~","~0").replaceAll("/","~1");function p5(t,s){for(let c=s;;c=c.slice(0,c.lastIndexOf("/"))){const d=t.get(c);if(d!==void 0)return d;if(c==="")return}}function h5(t){const s=new Map;let c=0,d=1;const p=()=>{for(;c<t.length&&/\s/u.test(t[c]??"");)t[c]===`
`&&d++,c++},a=()=>{const l=c;for(c++;c<t.length&&t[c]!=='"';)c+=t[c]==="\\"?2:1;return c++,JSON.parse(t.slice(l,c))},r=(l,f)=>{s.set(l,f);const u=t[c];if(u==="{"||u==="["){c++;for(let g=0;c<t.length;g++){if(p(),t[c]==="}"||t[c]==="]"){c++;return}if(t[c]===","&&(c++,p()),u==="{"){const b=d,w=a();p(),c++,p(),r(`${l}/${d5(w)}`,b)}else r(`${l}/${g}`,d)}return}if(u==='"'){a();return}for(;c<t.length&&!/[\s,\]}]/u.test(t[c]??"");)c++};return p(),r("",d),s}function f5(t){const s=[];for(const c of Yi){const d=ms(Ra(c,t),{lang:t});if(!d.ok)continue;const{kind:p,title:a}=d.diagram,r=s.find(l=>l.kind===p);r?r.samples.push({key:c,title:a}):s.push({kind:p,samples:[{key:c,title:a}]})}return s}const Hd=/^step(\s|$)/u,Dd=/^box\s/u,m5=/^group(\s|$)/u;function g5(t,s){const c=s.length+1,d=new Int32Array((t.length+1)*c),p=(r,l)=>d[r*c+l]??0;for(let r=t.length-1;r>=0;r--)for(let l=s.length-1;l>=0;l--)d[r*c+l]=t[r]===s[l]?p(r+1,l+1)+1:Math.max(p(r+1,l),p(r,l+1));const a=[];for(let r=0,l=0;l<s.length;)r<t.length&&t[r]===s[l]?(r++,l++):r<t.length&&p(r+1,l)>=p(r,l+1)?r++:(a.push(l),l++);return a}function Vg(t,s){const c=Fi(t).split(`
`),d=Fi(s).split(`
`),p=d.findIndex(r=>Hd.test(r)),a={declarations:[],steps:[]};for(const r of g5(c,d)){const l=d[r]??"";l.trim()!==""&&(p>=0&&r>=p?a.steps:a.declarations).push(l)}return a}function y5(t,s){const c=t.replace(/\s+$/u,"").split(`
`);let d=-1;const p=()=>{const u=c.findIndex((b,w)=>w>0&&Hd.test(b.trim()));let g=u<0?c.length:u;for(;g>1&&c[g-1]?.trim()==="";)g--;return g},a=(u,g)=>{c.splice(u,0,...g);const b=u+Math.max(g.findIndex(w=>w!==""),0);(d<0||b<d)&&(d=b)},r=s.declarations.some(u=>m5.test(u.trim())),l=r?[]:s.declarations.filter(u=>Dd.test(u.trim())),f=r?s.declarations:s.declarations.filter(u=>!Dd.test(u.trim()));if(l.length>0){const u=p();let g=-1;for(let b=0;b<u;b++)Dd.test(c[b]?.trim()??"")&&(g=b);a(g<0?u:g+1,l)}return f.length>0&&a(p(),r?["",...f]:f),s.steps.length>0&&a(c.length,Hd.test(s.steps[0]??"")?["",...s.steps]:s.steps),{text:c.join(`
`),line:d+1}}const b5=["box","region","step","edge","edge-tag","edge-coin","edge-none","edge-below","action","swap","strip"],v5={ja:{box:"箱",newBox:"新しい箱",region:"区画",newRegion:"新しい区画",newStep:"新しい段",stepBody:"この段で起きることを書く。",call:"呼ぶ",handOver:"渡す",key:"鍵",pay:"払う",notify:"知らせる",process:"処理する",rewritten:"書き換えた字",stripTitle:"状態",stripField:"値",stripValue:"1"},en:{box:"box",newBox:"New box",region:"zone",newRegion:"New region",newStep:"New step",stepBody:"Write what happens in this step.",call:"call",handOver:"hand over",key:"key",pay:"pay",notify:"notify",process:"process",rewritten:"Rewritten",stripTitle:"State",stripField:"value",stripValue:"1"}};function Xg(t,s){const c=new Set([...t.boxes.map(p=>p.id),...(t.regions??[]).map(p=>p.id)]);let d=1;for(;c.has(`${s}${d}`);)d++;return`${s}${d}`}function Pd(t,s,c){const d=Xg(t,s.box),p=c??(t.kind==="architecture"?t.boxes.at(-1)?.region:void 0),a={id:d,name:s.newBox,...p?{region:p}:{}},r=t.sequence?{sequence:{lifelines:[...t.sequence.lifelines,d]}}:{};return{id:d,diagram:{...t,boxes:[...t.boxes,a],...r}}}function Jg(t,s){const[c,d]=t.boxes;if(c&&d)return{diagram:t,from:c.id,to:d.id};const p=Pd(t,s);return{diagram:p.diagram,from:c?.id??p.id,to:p.id}}function Hl(t,s){const c=t.steps.at(-1);return c?{...t,steps:[...t.steps.slice(0,-1),{...c,events:[...c.events,s]}]}:t}const Mi=(t,s,c)=>(d,p)=>{const a=Jg(d,p);return Hl(a.diagram,{type:"edge",from:a.from,to:a.to,label:p[s],carry:t,...c?{labelSide:c}:{}})},x5={box:(t,s)=>Pd(t,s).diagram,region:(t,s)=>{const c=Xg(t,s.region);return Pd({...t,regions:[...t.regions??[],{id:c,name:s.newRegion}]},s,c).diagram},step:(t,s)=>{const c=Jg(t,s),d={title:s.newStep,body:s.stepBody,events:[{type:"edge",from:c.from,to:c.to,label:s.call,carry:{kind:"envelope"}}]};return{...c.diagram,steps:[...c.diagram.steps,d]}},edge:Mi({kind:"envelope"},"call"),"edge-tag":(t,s)=>Mi({kind:"tag",text:s.key},"handOver")(t,s),"edge-coin":Mi({kind:"coin"},"pay"),"edge-none":Mi({kind:"none"},"notify"),"edge-below":Mi({kind:"envelope"},"call","below"),action:(t,s)=>Hl(t,{type:"action",box:t.boxes[0]?.id??"",label:s.process}),swap:(t,s)=>Hl(t,{type:"swap",box:t.boxes[0]?.id??"",text:s.rewritten}),strip:(t,s)=>{const c=t.strip??{title:s.stripTitle,fields:[s.stripField]};return Hl({...t,strip:c},{type:"strip",field:c.fields[0]??s.stripField,value:s.stripValue})}},Qg=(t,s,c)=>Vg(s,x5[t](s,v5[c])),w5={ja:{title:"題",id:"名札",name:"名前",note:"添え書き",color:"色",icon:"印",link:"飛び先",field:"欄",value:"値",tag:"札",stepTitle:"段の題",stepBody:"段の本文",command:"命令",source:"出典の名前",url:"URL",label:"線の名前",action:"処理の名前",text:"字",memo:"メモ",branch:"枝",hash:"hash",message:"一言",unit:"目盛りの名前",length:"長さ",count:"数",number:"番号",tick:"目盛り",first:"最初",last:"最後",child:"子",lane:"列",chip:"チップ"},en:{title:"title",id:"id",name:"name",note:"note",color:"color",icon:"icon",link:"link",field:"field",value:"value",tag:"tag",stepTitle:"step title",stepBody:"step body",command:"command",source:"source name",url:"URL",label:"label",action:"action",text:"text",memo:"memo",branch:"branch",hash:"hash",message:"message",unit:"unit",length:"length",count:"count",number:"number",tick:"tick",first:"first",last:"last",child:"child",lane:"lane",chip:"chip"}};function k5(t){const s=Object.fromEntries(Object.entries(w5[t]).map(([B,ne])=>[B,`<${ne}>`])),c=B=>B,d=B=>c({version:Kl,kind:B,title:s.title,boxes:[],steps:[]}),p=d("sequence"),a={title:s.stepTitle,body:s.stepBody,events:[]},r=c({...p,steps:[a]}),l=(B,ne={})=>c({...p,...ne,steps:[{...a,events:B}]}),f=(B,ne)=>({type:"edge",from:s.id,to:s.id,label:s.label,carry:B,...ne?{labelSide:ne}:{}}),u=B=>B.flatMap(([ne,ae])=>{const fe=Vg(ne,ae);return[...fe.declarations,...fe.steps]}),g={title:s.title,fields:[s.field]},b=B=>Fi(B).split(`
`)[0]??"",w=c({...d("state"),steps:[a]}),v=(B,ne)=>({type:"edge",from:B,to:ne,label:s.label,carry:{kind:"envelope"}}),A=c({...d("git"),git:{branches:[{id:s.branch}]},steps:[a]}),N=B=>c({...A,steps:[{...a,events:B}]}),S=B=>({type:"commit",id:s.id,branch:s.branch,...B}),M={unit:s.unit,length:s.length,count:s.count},D=(B={})=>c({...d("time"),time:{scale:M,rows:[],...B},steps:[a]}),z=D(),H=(B,ne=z)=>c({...ne,steps:[{...a,events:B}]}),Z=c({...D({zoom:{from:s.first,to:s.last}}),boxes:[{id:s.id,name:s.id}]}),j=c({...d("tree"),steps:[a]}),R=B=>c({...j,steps:[{...a,events:B}]}),_=c({...d("lineup"),lineup:{items:[]},steps:[a]}),P=B=>c({..._,steps:[{...a,events:B}]});return[{id:"kind",lines:[b(p),b(d("architecture")),b(d("state")),b(d("git")),b(d("time")),b(d("tree")),b(d("lineup"))]},{id:"view",lines:u([[p,c({...p,view:"fixed"})],[p,c({...p,view:"follow"})]])},{id:"region",lines:u([[p,c({...p,regions:[{id:s.id,name:s.name,note:s.note,color:s.color,icon:s.icon}],boxes:[{id:s.id,name:s.name,region:s.id}]})]])},{id:"box",lines:u([[p,c({...p,boxes:[{id:s.id,name:s.name,sub:s.note,color:s.color,icon:s.icon,link:s.link}]})]])},{id:"strip",lines:u([[p,c({...p,strip:{title:s.title,fields:[s.field,s.field]}})]])},{id:"step",lines:u([[p,r]])},{id:"code",lines:u([[r,c({...p,steps:[{...a,code:s.command}]})]])},{id:"source",lines:u([[r,c({...p,steps:[{...a,sources:[{name:s.source,url:s.url}]}]})]])},{id:"edge",lines:u([[r,l([f({kind:"envelope"})])]])},{id:"carry",lines:u([{kind:"tag",text:s.value},{kind:"coin"},{kind:"none"}].map(B=>[r,l([f(B)])]))},{id:"side",lines:u(["above","below","left","right"].map(B=>[r,l([f({kind:"envelope"},B)])]))},{id:"start-finish",lines:u([[w,c({...w,steps:[{...a,events:[v("start",s.id),v(s.id,"finish")]}]})]])},{id:"path",lines:u([[w,c({...w,state:{paths:[{from:s.id,to:s.id,label:s.label}]}})]])},{id:"branch",lines:u([[c({...d("git"),steps:[a]}),c({...A,git:{branches:[{id:s.branch,note:s.note}]}})],[A,N([{type:"branch",branch:s.branch,from:s.id}])]])},{id:"commit",lines:u([[A,N([S({hash:s.hash,note:s.message})])]])},{id:"copy",lines:u([[A,N([S({copy:s.id})])]])},{id:"merge",lines:u([[A,N([S({merge:s.branch})])]])},{id:"ref",lines:u([[A,N([{type:"edge",from:s.branch,to:s.id,label:s.label,carry:{kind:"tag",text:s.branch}}])]])},{id:"scale",lines:u([[c({...d("time"),steps:[a]}),D({scale:{...M,from:s.number}})]])},{id:"period",lines:u([[z,D({period:{name:s.name,length:s.count,from:s.number}})]])},{id:"row",lines:u([[z,D({rows:[{id:s.id,name:s.name,color:s.color,empty:[s.tick]}]})]])},{id:"point",lines:u([[z,D({points:[{id:s.id,at:s.tick}]})]])},{id:"zoom",lines:u([[z,D({zoom:{from:s.first,to:s.last}})],[Z,H([{type:"edge",from:s.id,to:s.id,carry:{kind:"envelope"},at:s.tick,into:s.tick}],Z)]])},{id:"now",lines:u([[z,H([{type:"now",to:s.tick}])]])},{id:"mark",lines:u([[z,H([{type:"mark",row:s.id,from:s.first,to:s.last,color:s.color}])]])},{id:"span",lines:u([[z,H([{type:"span",from:s.first,to:s.last,text:s.text}])],[z,H([{type:"span",from:s.first,to:s.last,text:s.text,shape:"box",color:s.color}])]])},{id:"leaf",lines:u([[j,R([{type:"leaf",id:s.id,hash:s.hash}])]])},{id:"node",lines:u([[j,R([{type:"node",id:s.id,children:[s.child,s.child],hash:s.hash}])]])},{id:"item",lines:u([[_,c({..._,lineup:{items:[{id:s.id,color:s.color,label:s.text}]}})]])},{id:"line",lines:u([[_,P([{type:"line",box:s.lane,items:[s.chip,s.chip]}])]])},{id:"seal",lines:u([[_,P([{type:"seal",box:s.lane}])]])},{id:"open",lines:u([[_,P([{type:"open",box:s.lane}])]])},{id:"pick",lines:u([[_,P([{type:"pick",box:s.lane}])]])},{id:"stamp",lines:u([[_,P([{type:"stamp",box:s.lane,text:s.text}])]])},{id:"action",lines:u([[r,l([{type:"action",box:s.id,label:s.action}])]])},{id:"swap",lines:u([[r,l([{type:"swap",box:s.id,text:s.text}])]])},{id:"strip-value",lines:u([[c({...r,strip:g}),l([{type:"strip",field:s.field,value:s.value,tag:s.tag}],{strip:g})]])},{id:"comment",lines:[`// ${s.memo}`]}]}const E5=["samples","parts","notation"];function A5({lang:t,base:s,active:c,open:d,onClose:p,onNew:a,onSample:r,onPart:l}){const f=Et[t].shelf,[u,g]=qe.useState("samples"),[b,w]=qe.useState(""),v=qe.useMemo(()=>f5(t),[t]),A=qe.useMemo(()=>s?b5.map(j=>{const R=Qg(j,s,t);return{id:j,lines:[...R.declarations,...R.steps]}}):[],[s,t]),N=qe.useMemo(()=>k5(t),[t]),S=b.trim().toLowerCase(),M=(...j)=>S===""||j.some(R=>R.toLowerCase().includes(S)),D=v.map(j=>({...j,samples:j.samples.filter(R=>M(R.title,R.key))})).filter(j=>j.samples.length>0),z=A.filter(j=>M(f.parts[j.id],...j.lines)),H=N.filter(j=>M(f.syntax[j.id],...j.lines)),Z={samples:D.length,parts:z.length,notation:H.length}[u]===0;return x.jsxs("aside",{className:"pg-shelf","data-playground":"shelf","data-open":d?"on":void 0,"aria-label":f.label,onKeyDown:j=>{j.key==="Escape"&&d&&p()},children:[x.jsxs("button",{type:"button",className:"pg-new","data-playground":"new-file",onClick:a,children:[x.jsx("span",{className:"pg-new-plus","aria-hidden":"true",children:"+"}),f.newFile]}),x.jsx("div",{className:"pg-shelf-tabs",role:"tablist",children:E5.map(j=>x.jsx("button",{type:"button",role:"tab","data-playground":`shelf-tab-${j}`,"aria-selected":u===j,onClick:()=>g(j),children:f.tabs[j]},j))}),x.jsx("input",{className:"pg-filter","data-playground":"shelf-filter",type:"search",placeholder:f.filter,"aria-label":f.filterLabel,spellCheck:!1,value:b,onChange:j=>w(j.target.value)}),x.jsxs("div",{className:"pg-shelf-list",role:"tabpanel",children:[u==="samples"&&D.map(j=>x.jsxs("section",{className:"pg-group",children:[x.jsx("h3",{className:"pg-group-title",children:f.kinds[j.kind]}),j.samples.map(R=>x.jsx("button",{type:"button",className:"pg-item","data-playground":`sample-${R.key}`,"aria-current":c===R.key?"true":void 0,title:R.title,onClick:()=>r(R.key),children:R.title},R.key))]},j.kind)),u==="parts"&&x.jsxs(x.Fragment,{children:[x.jsx("p",{className:"pg-shelf-hint",children:f.partsHint}),z.map(j=>x.jsxs("button",{type:"button",className:"pg-entry pg-entry-button","data-playground":`part-${j.id}`,onClick:()=>l(j.id),children:[x.jsx("span",{className:"pg-entry-name",children:f.parts[j.id]}),x.jsx("code",{className:"pg-entry-code",children:j.lines.join(`
`)})]},j.id))]}),u==="notation"&&x.jsxs(x.Fragment,{children:[x.jsx("p",{className:"pg-shelf-hint",children:f.notationHint}),H.map(j=>x.jsxs("div",{className:"pg-entry","data-playground":`syntax-${j.id}`,children:[x.jsx("code",{className:"pg-entry-code",children:j.lines.join(`
`)}),x.jsx("span",{className:"pg-entry-note",children:f.syntax[j.id]})]},j.id))]}),Z&&x.jsx("p",{className:"pg-shelf-empty",children:f.nothing})]})]})}const G0=1.15,Y0=[.7,1.6],V0=t=>Math.min(Y0[1],Math.max(Y0[0],t));function qs({name:t,icon:s,label:c,onClick:d,pressed:p,disabled:a}){return x.jsx("button",{type:"button",className:"pg-tool","data-playground":t,"aria-label":c,title:c,"aria-pressed":p,disabled:a,onClick:d,children:x.jsx("span",{className:"pg-icon","data-icon":s,"aria-hidden":"true"})})}function _5({diagram:t,palette:s,onPalette:c,theme:d,lang:p,kept:a,fileName:r,overlaps:l,jump:f}){const u=Et[p],g=qe.useRef(null),b=qe.useRef(null),[w,v]=qe.useState(0),[A,N]=qe.useState(1),[S,M]=qe.useState(!1),[D,z]=qe.useState(1),[H,Z]=qe.useState(!1),j=Ug(),R=qe.useRef(null),_=up(b,t,{palette:s,theme:d,lang:p,onStep:v,onPlayer:$=>{R.current=$}});qe.useEffect(()=>{R.current?.mark(l.filter($=>$.step===w).flatMap($=>$.spots.map(V=>V.rect)))},[l,w,t,s,d,p]),qe.useEffect(()=>{f&&R.current?.goTo(f.step)},[f]),qe.useEffect(()=>{const $=()=>Z(document.fullscreenElement!==null&&document.fullscreenElement===g.current);return document.addEventListener("fullscreenchange",$),()=>document.removeEventListener("fullscreenchange",$)},[]);const P=()=>{document.fullscreenElement?document.exitFullscreen().catch(()=>{}):g.current?.requestFullscreen().catch(()=>{})},B=t?.steps.length??0,ne=t?.steps[Math.min(w,B-1)],ae=B>1&&ne!==void 0,fe=_?Jl(_.scale,A):null,pe=fe===null?"—":`${Math.round(fe*100)}%`,Ae=$=>{_&&N(Jl(_.scale,A*$)/_.scale)},C={..._&&fe!==null?{"--fig-w":`${_.width*fe}px`}:{},"--say":String(D)};return x.jsxs("section",{className:"pg-stage","data-playground":"stage",ref:g,children:[x.jsxs("div",{className:"pg-stage-bar",children:[x.jsxs("span",{className:"pg-live",children:[x.jsx("span",{className:"pg-live-dot","aria-hidden":"true"}),u.stage.live]}),x.jsx("div",{className:"pg-swatches",role:"group","aria-label":u.palette,children:Object.values(Ba).map($=>x.jsx("button",{type:"button",className:"pg-swatch","data-playground":`palette-${$.id}`,"aria-pressed":s===$.id,"aria-label":u.paletteNames[$.id]??$.name,title:u.paletteNames[$.id]??$.name,onClick:()=>c($.id),children:x.jsx("span",{className:"pg-swatch-dot","aria-hidden":"true",style:{background:`linear-gradient(135deg, ${$.light.page} 50%, ${$.dark.page} 50%)`,borderColor:$.light["c-blue"]}})},$.id))}),x.jsx("span",{className:"pg-gap"}),x.jsx(qs,{name:"font-down",icon:"text-down",label:u.stage.fontDown,onClick:()=>z(V0(D/G0))}),x.jsx(qs,{name:"font-up",icon:"text-up",label:u.stage.fontUp,onClick:()=>z(V0(D*G0))}),x.jsx(qs,{name:"grid",icon:"grid",label:u.stage.grid,pressed:S,onClick:()=>M(!S)}),x.jsx(qs,{name:"fullscreen",icon:"fullscreen",label:u.stage.fullscreen,pressed:H,onClick:P}),x.jsx("span",{className:"pg-tool-sep","aria-hidden":"true"}),!j&&x.jsx(qs,{name:"fit",icon:"fit",label:u.stage.fit,disabled:!_,onClick:()=>N(1)}),x.jsx(qs,{name:"zoom-out",icon:"zoom-out",label:u.stage.zoomOut,disabled:!_||fe===Bo[0],onClick:()=>Ae(1/Xl)}),j&&x.jsx("button",{type:"button",className:"pg-tool pg-zoom-fit","data-playground":"zoom-level","aria-label":`${u.stage.fit} (${pe})`,title:u.stage.fit,disabled:!_,onClick:()=>N(1),children:pe}),x.jsx(qs,{name:"zoom-in",icon:"zoom-in",label:u.stage.zoomIn,disabled:!_||fe===Bo[1],onClick:()=>Ae(Xl)}),!j&&x.jsx("span",{className:"pg-zoom","data-playground":"zoom-level","aria-label":u.stage.zoom,children:pe})]}),x.jsxs("div",{className:"pg-figure","data-playground":"figure","data-grid":S?"on":void 0,"data-phased":ae?"on":void 0,style:C,children:[ae&&x.jsxs("p",{className:"pg-phase","data-playground":"phase-badge",children:[x.jsx("span",{className:"pg-phase-dot","aria-hidden":"true"}),u.stage.phase(w+1,B,ne.title)]}),a&&x.jsxs("p",{className:"pg-kept",children:["↺ ",u.kept]}),x.jsx("div",{className:"pg-player",ref:b})]}),x.jsxs("div",{className:"pg-stage-foot",children:[ae&&x.jsx("div",{className:"pg-progress","data-playground":"progress","aria-hidden":"true",children:t?.steps.map(($,V)=>x.jsx("span",{className:"pg-progress-seg","data-playground":"progress-seg","data-done":V<=w},`${V}-${$.title}`))}),x.jsxs("p",{className:"pg-hint",children:[u.exportLead," ",x.jsxs("code",{children:["dragon export ",r]})," ",u.exportTail]})]})]})}const Zg=t=>t instanceof Error?t.message:String(t);function Kg(t,s,c){const d=Pi(t,{lang:s});if(!d.ok)return{ok:!1,problem:{lang:s,notices:c5(d.errors,c)}};try{sp(d.diagram)}catch(p){return{ok:!1,problem:{lang:s,notices:[{text:Et[s].cannotDraw(Zg(p))}]}}}return{ok:!0,diagram:d.diagram}}function Bi(t,s){const c=ms(t,{lang:s});return c.ok?Kg(c.diagram,s):{ok:!1,problem:{lang:s,notices:l5(c.errors)}}}function X0(t,s){let c;try{c=JSON.parse(t)}catch(d){const p=Zg(d),a=u5(p,t);return{ok:!1,problem:{lang:s,notices:[{...a!==void 0?{line:a}:{},text:Et[s].notJson(p)}]}}}return Kg(c,s,t)}const J0=t=>{const s=t.trim();return s===""?qd:s.endsWith(".dragon")?s:`${s}.dragon`},Td=t=>t.replace(/\.dragon$/u,"");function S5(t,s){const c=t.value.split(`
`),d=c.slice(0,s-1).reduce((p,a)=>p+a.length+1,0);t.focus(),t.setSelectionRange(d,d+(c[s-1]?.length??0)),Wg(t,s)}function Wg(t,s){const c=Number.parseFloat(getComputedStyle(t).lineHeight)||20;t.scrollTop=Math.max(0,(s-1)*c-t.clientHeight/2)}const Q0=t=>t?JSON.stringify(t,null,2):"",Cd=t=>{history.replaceState(null,"",`${location.pathname}${location.search}${t===void 0?"":rp(t)}`)};function $5(t){const s=Fg(location.hash),c=s??Ra(H0,t);return{text:c,example:s===void 0?H0:zl(c)?.key??null,outcome:Bi(c,t)}}function N5({lang:t,theme:s,palette:c,onBeforeLang:d}){const[p]=qe.useState(()=>$5(t)),[a,r]=qe.useState("notation"),[l,f]=qe.useState(p.text),[u,g]=qe.useState(""),[b,w]=qe.useState(p.example),[v,A]=qe.useState(p.outcome.ok?p.outcome.diagram:null),[N,S]=qe.useState(p.outcome.ok?null:p.outcome.problem),[M,D]=qe.useState(null),z=M?.site===c?M.palette:c,[H,Z]=qe.useState(!1),[j,R]=qe.useState(Td(p.example===null?qd:`${p.example}.dragon`)),[_,P]=qe.useState(!1),[B,ne]=qe.useState(null),ae=qe.useRef(null),fe=qe.useRef(null),pe=qe.useRef(null),Ae=qe.useRef(null),C=Et[t],$=qe.useMemo(()=>{const k=ms(l,{lang:t});return k.ok?k.diagram:v},[l,t,v]);qe.useLayoutEffect(()=>{const k=Ae.current;k===null||!ae.current||(Ae.current=null,Wg(ae.current,k))});const V=k=>{A(te=>te&&JSON.stringify(te)===JSON.stringify(k)?te:k),S(null)},X=k=>{f(k),w(zl(k)?.key??null),Cd(k);const te=Bi(k,t);te.ok?V(te.diagram):S(te.problem)},ie=k=>{g(k);const te=X0(k,t);if(!te.ok){S(te.problem);return}V(te.diagram);const W=Fi(te.diagram);f(W),w(zl(W)?.key??null),Cd(W)},T=(k,te,W,we)=>{const Be=Bi(k,we);f(k),w(te),R(Td(W)),Cd(void 0),Be.ok?(V(Be.diagram),g(Q0(Be.diagram))):S(Be.problem)},G=(k,te)=>T(Ra(k,te),k,`${k}.dragon`,te),re=()=>T(Rl[t],null,qd,t),Y=async k=>{const te=(await k.text()).replace(/\r\n?/gu,`
`).trimEnd();let W=te;if(/^\s*\{/u.test(te))try{const we=Pi(JSON.parse(te),{lang:t});we.ok&&(W=Fi(we.diagram))}catch{}r("notation"),X(W),R(Td(k.name.replace(/\.json$/iu,".dragon")))},xe=()=>{const k=URL.createObjectURL(new Blob([`${l.trimEnd()}
`],{type:"text/plain;charset=utf-8"})),te=document.createElement("a");te.href=k,te.download=J0(j),te.click(),window.setTimeout(()=>URL.revokeObjectURL(k),6e4)},ke=k=>{if(!$)return;const te=y5(l,Qg(k,$,t));a!=="notation"&&r("notation"),X(te.text),Ae.current=te.line},ze=k=>{H&&Z(!1),ae.current&&S5(ae.current,k)},Fe=k=>{if(r(k),k==="json"){g(Q0(v)),S(null);return}const te=Bi(l,t);S(te.ok?null:te.problem)},Re=k=>{if(a==="json"&&N){const W=X0(u,k);W.ok||S(W.problem);return}const te=zl(l);if(te&&te.lang!==k){G(te.key,k);return}if(l===Rl[t]&&t!==k){T(Rl[k],null,j,k);return}if(a==="notation"&&N){const W=Bi(l,k);W.ok||S(W.problem)}};qe.useLayoutEffect(()=>(d(Re),()=>d(null)));const Qe=a==="notation"?l:u,K=qe.useMemo(()=>v?sp(v,{lang:t}).overlaps:[],[v,t]),U=Qe.split(`
`).length,Ne=new Set(N?.notices.flatMap(k=>k.line===void 0?[]:[k.line])),F=N?Et[N.lang].notices:void 0,be=k=>(...te)=>{k(...te),P(!1)};return x.jsxs("div",{className:"pg",children:[x.jsx(A5,{lang:t,base:$,active:b,open:_,onClose:()=>P(!1),onNew:be(re),onSample:be(k=>G(k,t)),onPart:ke}),_&&x.jsx("button",{type:"button",className:"pg-shelf-scrim","aria-label":C.shelf.close,onClick:()=>P(!1)}),x.jsxs("section",{className:"pg-code","data-playground":"editor-pane","data-folded":H,children:[x.jsxs("div",{className:"pg-bar",children:[x.jsx("button",{type:"button",className:"pg-tool pg-shelf-toggle","data-playground":"shelf-toggle","aria-label":C.shelf.open,title:C.shelf.open,"aria-expanded":_,onClick:()=>P(!_),children:x.jsx("span",{className:"pg-icon","data-icon":"list","aria-hidden":"true"})}),x.jsx("div",{className:"pg-tabs",role:"tablist",children:["notation","json"].map(k=>x.jsx("button",{type:"button",role:"tab","data-playground":`tab-${k}`,"aria-selected":a===k,onClick:()=>Fe(k),children:k==="notation"?C.notation:"JSON"},k))}),x.jsx("input",{className:"pg-file","data-playground":"file-name","aria-label":C.code.file,title:C.code.file,spellCheck:!1,value:j,onChange:k=>R(k.target.value)}),x.jsx("button",{type:"button",className:"pg-tool","data-playground":"import","aria-label":C.code.import,title:C.code.import,onClick:()=>pe.current?.click(),children:x.jsx("span",{className:"pg-icon","data-icon":"import","aria-hidden":"true"})}),x.jsx("input",{ref:pe,type:"file",hidden:!0,"data-playground":"import-file",accept:".dragon,.json,.txt,text/plain,application/json",onChange:k=>{const te=k.target.files?.[0];k.target.value="",te&&Y(te)}}),x.jsx("button",{type:"button",className:"pg-tool pg-tool-primary","data-playground":"export","aria-label":C.code.export,title:C.code.export,onClick:xe,children:x.jsx("span",{className:"pg-icon","data-icon":"export","aria-hidden":"true"})}),x.jsxs("button",{type:"button",className:"pg-fold","data-playground":"fold","aria-expanded":!H,onClick:()=>Z(!H),children:[H?C.unfold:C.fold," ",H?"▴":"▾"]})]}),x.jsxs("div",{className:"pg-code-body",hidden:H,children:[x.jsx("div",{className:"pg-gutter",ref:fe,"aria-hidden":"true",children:Array.from({length:U},(k,te)=>x.jsx("div",{className:Ne.has(te+1)?"is-error":void 0,children:te+1},te))}),x.jsx("textarea",{ref:ae,className:"pg-text","data-playground":"editor","aria-label":C.editor,spellCheck:!1,wrap:"off",value:Qe,onChange:k=>a==="notation"?X(k.target.value):ie(k.target.value),onScroll:k=>{fe.current&&(fe.current.scrollTop=k.currentTarget.scrollTop)}})]}),x.jsx("div",{className:"pg-notices","data-playground":"status","data-state":N?"error":"ok",role:"status",children:N&&F?x.jsxs(x.Fragment,{children:[x.jsx("p",{className:"pg-notices-head",children:x.jsx("span",{className:"pg-notices-badge",children:F.count(N.notices.length)})}),x.jsx("ul",{className:"pg-notice-list",children:N.notices.map((k,te)=>x.jsxs("li",{className:"pg-notice","data-playground":"notice",children:[k.line!==void 0&&x.jsx("button",{type:"button",className:"pg-notice-line","data-playground":"notice-line","aria-label":F.goTo(k.line),onClick:()=>ze(k.line??1),children:F.line(k.line)}),x.jsx("span",{className:"pg-notice-text",children:k.text})]},`${te}-${k.line??"-"}`))})]}):x.jsxs(x.Fragment,{children:[x.jsxs("p",{className:"pg-ok",children:[x.jsx("span",{"aria-hidden":"true",children:"✓"})," ",v?C.readable(v.boxes.length,v.steps.length):""]}),K.length>0&&x.jsxs("div",{className:"pg-overlaps","data-playground":"overlaps",children:[x.jsx("p",{className:"pg-notices-head",children:x.jsx("span",{className:"pg-overlaps-badge","data-playground":"overlaps-count",children:C.overlaps.count(K.length)})}),x.jsx("ul",{className:"pg-notice-list",children:K.map((k,te)=>x.jsxs("li",{className:"pg-notice","data-playground":"overlap",children:[x.jsx("button",{type:"button",className:"pg-overlap-step","data-playground":"overlap-step","aria-label":C.overlaps.goTo(k.step+1),onClick:()=>ne(W=>({step:k.step,count:(W?.count??0)+1})),children:C.overlaps.step(k.step+1)}),x.jsx("span",{className:"pg-notice-text","data-playground":"overlap-text",children:Fx(k,t)})]},`${te}-${k.step}`))})]})]})})]}),x.jsx(_5,{diagram:v,palette:z,onPalette:k=>D({site:c,palette:k}),theme:s,lang:t,kept:N!==null&&v!==null,overlaps:K,jump:B,fileName:J0(j)})]})}const D5=`${lp}/blob/main/CHANGELOG.md`;function T5({lang:t}){const s=Et[t].site,c=s.releaseNotes,d=s.screens["release-notes"].title;return x.jsxs("section",{className:"release","data-release":"hero",children:[x.jsxs("nav",{className:"release-crumb","data-release":"crumb","aria-label":c.crumb,children:[x.jsx("a",{href:Tt.home,onClick:p=>jt(p),children:s.nav.home}),x.jsx("span",{"aria-hidden":"true",children:"›"}),x.jsx("span",{className:"release-crumb-here","aria-current":"page",children:d})]}),x.jsx("span",{className:"release-eyebrow","data-release":"eyebrow",children:c.eyebrow(dp)}),x.jsxs("h1",{children:[d.slice(0,d.length-c.accent.length),x.jsx("span",{className:"release-accent",children:c.accent})]}),x.jsx("p",{className:"release-lead","data-release":"lead",children:c.lead}),x.jsx("div",{className:"release-actions","data-release":"actions",children:x.jsxs("a",{className:"release-btn",href:D5,target:"_blank",rel:"noopener noreferrer",children:[x.jsx("span",{children:c.changelog}),x.jsx("span",{className:"release-btn-arrow","aria-hidden":"true",children:"↗"})]})})]})}const C5={paper:"rose",clear:"blue",night:"blue"},Ig="dragon-site-palette";function ey(t,s){const c=Zd(t)[s];return c[`t-${C5[t]??"blue"}`]??c.ink??""}function O5(t,s){const c=Zd(t)[s],d=p=>c[p]??"";return{"--d-bg":d("page"),"--d-surface":d("surf"),"--d-surface-2":d("bg"),"--d-surface-3":d("sunk"),"--d-border":d("hair"),"--d-border-strong":d("line"),"--d-text-primary":d("ink"),"--d-text-secondary":d("ink2"),"--d-text-muted":d("mute"),"--d-accent":ey(t,s),"--d-on-accent":d("on-c"),"--d-code-bg":d("sunk"),"--d-err":d("t-rose"),"--d-ok":d("t-green"),"--d-warn":d("t-amber")}}function ty(t,s){const c=document.documentElement;c.dataset.scheme=s,c.style.colorScheme=s;for(const[d,p]of Object.entries(O5(t,s)))c.style.setProperty(d,p)}function ny(){try{const t=localStorage.getItem(Ig);return t!==null&&Object.hasOwn(Ba,t)?t:Gl}catch{return Gl}}function M5(t){try{localStorage.setItem(Ig,t)}catch{}}const Z0=t=>({"--sw-light":t.light.page,"--sw-dark":t.dark.page,"--sw-accent":ey(t.id,"light")}),ay=["home","catalog","editor","docs","release-notes"],B5=t=>t.screen==="category"||t.screen==="part"?"catalog":ay.find(s=>s===t.screen);function j5({path:t,route:s,lang:c,theme:d,palette:p,onLang:a,onTheme:r,onPalette:l}){const f=Et[c].site,u=Et[c].paletteNames,g=B5(s),[b,w]=qe.useState(null),v=b===t;qe.useEffect(()=>{if(!v)return;const N=S=>{S.key==="Escape"&&w(null)};return addEventListener("keydown",N),()=>removeEventListener("keydown",N)},[v]);const A=(N,S)=>[...ay.map(M=>x.jsx("a",{className:N,href:Tt[M],"aria-current":M===g?"page":void 0,onClick:D=>jt(D,S),children:f.nav[M]},M)),x.jsx("a",{className:N,href:lp,target:"_blank",rel:"noopener noreferrer",children:"GitHub ↗"},"github")];return x.jsxs("header",{className:"site-head","data-site":"header",children:[x.jsxs("a",{className:"site-brand",href:Tt.home,onClick:N=>jt(N),children:[x.jsx("span",{className:"site-mark","data-site":"mark","aria-hidden":"true"}),x.jsx("span",{className:"site-name","data-site":"name",children:"dragon"}),x.jsxs("span",{className:"site-tagline","data-site":"tagline",children:["— ",Et[c].tagline]})]}),x.jsx("nav",{className:"site-nav","data-site":"nav","aria-label":f.navLabel,children:A("site-nav-link")}),x.jsxs("div",{className:"site-actions",children:[x.jsx("div",{className:"site-lang",role:"group","aria-label":Et[c].language,children:["ja","en"].map(N=>x.jsx("button",{type:"button","data-site":`lang-${N}`,"aria-pressed":c===N,onClick:()=>a(N),children:N.toUpperCase()},N))}),x.jsx("div",{className:"site-palette","data-site":"palette",role:"group","aria-label":Et[c].palette,children:Object.values(Ba).map(N=>x.jsx("button",{type:"button",className:"site-palette-btn","data-site":`palette-${N.id}`,"aria-pressed":p===N.id,"aria-label":u[N.id]??N.name,title:u[N.id]??N.name,onClick:()=>l(N.id),children:x.jsx("span",{className:"site-swatch",style:Z0(N),"aria-hidden":"true"})},N.id))}),x.jsx("button",{type:"button",className:"site-icon-btn","data-site":"theme","aria-label":d==="dark"?f.toLight:f.toDark,title:d==="dark"?f.toLight:f.toDark,onClick:r,children:d==="dark"?"☀":"☾"}),x.jsx("button",{type:"button",className:"site-icon-btn site-menu-btn","data-site":"menu","aria-label":v?f.closeMenu:f.openMenu,"aria-expanded":v,"aria-controls":"site-sheet",onClick:()=>w(v?null:t),children:v?"×":"≡"}),x.jsx("a",{className:"site-cta","data-site":"open-editor",href:Tt.editor,onClick:N=>jt(N),children:f.openEditor})]}),v&&x.jsxs(x.Fragment,{children:[x.jsx("div",{className:"site-scrim","aria-hidden":"true",onClick:()=>w(null)}),x.jsxs("div",{className:"site-sheet",id:"site-sheet",children:[x.jsx("nav",{"data-site":"sheet","aria-label":f.navLabel,children:A("site-sheet-link",()=>w(null))}),x.jsxs("div",{className:"site-sheet-palette","data-site":"sheet-palette",role:"group","aria-label":Et[c].palette,children:[x.jsx("span",{className:"site-sheet-label","aria-hidden":"true",children:Et[c].palette}),Object.values(Ba).map(N=>x.jsxs("button",{type:"button",className:"site-sheet-swatch","data-site":`palette-${N.id}`,"aria-pressed":p===N.id,onClick:()=>l(N.id),children:[x.jsx("span",{className:"site-swatch",style:Z0(N),"aria-hidden":"true"}),u[N.id]??N.name]},N.id))]}),x.jsx("a",{className:"site-sheet-cta",href:Tt.editor,onClick:N=>jt(N,()=>w(null)),children:f.openEditor})]})]})]})}const sy="(prefers-color-scheme: dark)";function q5(t){const s=matchMedia(sy);return s.addEventListener("change",t),()=>s.removeEventListener("change",t)}const oy=()=>matchMedia(sy).matches?"dark":"light";function R5(t){const s=Lg(t);return s.screen==="category"&&!ip(s.category)?{screen:"not-found"}:s.screen==="part"&&cp(s.part)===void 0?{screen:"not-found"}:s}function z5(t,s){const c=Et[s];if(t.screen==="home")return null;if(t.screen==="category")return ip(t.category)?c.shelf.kinds[t.category]:null;if(t.screen==="part"){const d=cp(t.part);return d?c.site.catalog.parts[d.id].name:null}return c.site.screens[t.screen].title}function F5(){const t=pw(),s=R5(t),c=cp(s.part),[d,p]=qe.useState(()=>lw(navigator.languages.length>0?navigator.languages:[navigator.language])),[a,r]=qe.useState(null),[l,f]=qe.useState(ny),u=qe.useSyncExternalStore(q5,oy),g=a??u,b=qe.useRef(null),w=qe.useCallback(S=>{b.current=S},[]);qe.useLayoutEffect(()=>{const S=document.documentElement;S.lang=d,S.style.setProperty("--sans",`"${Li.sans}"`),S.style.setProperty("--mono",`"${Li.mono}"`)},[d]),qe.useLayoutEffect(()=>{ty(l,g)},[l,g]);const v=z5(s,d);qe.useLayoutEffect(()=>{document.title=v===null?Et[d].title:`${v} — dragon`},[d,v]);const A=S=>{S!==d&&(b.current?.(S),p(S))},N=S=>{f(S),M5(S)};return x.jsxs("div",{className:"site",children:[x.jsx(j5,{path:t,route:s,lang:d,theme:g,palette:l,onLang:A,onTheme:()=>r(g==="dark"?"light":"dark"),onPalette:N}),x.jsx("main",{className:"site-main","data-site-screen":s.screen,children:s.screen==="home"?x.jsx(o5,{lang:d,theme:g,palette:l}):s.screen==="editor"?x.jsx(N5,{lang:d,theme:g,palette:l,onBeforeLang:w}):s.screen==="catalog"?x.jsx(Ik,{lang:d}):s.screen==="category"&&ip(s.category)?x.jsx(r4,{kind:s.category,lang:d,theme:g,palette:l},s.category):s.screen==="part"&&c?x.jsx(p4,{part:c,lang:d,theme:g,palette:l},c.id):s.screen==="docs"?x.jsx(Q4,{lang:d,theme:g,palette:l}):s.screen==="release-notes"?x.jsx(T5,{lang:d}):x.jsx(r5,{lang:d,path:t})})]})}uw();ty(ny(),oy());C3.createRoot(document.getElementById("root")).render(x.jsx(qe.StrictMode,{children:x.jsx(F5,{})}));
