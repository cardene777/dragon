(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))u(d);new MutationObserver(d=>{for(const a of d)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&u(r)}).observe(document,{childList:!0,subtree:!0});function c(d){const a={};return d.integrity&&(a.integrity=d.integrity),d.referrerPolicy&&(a.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?a.credentials="include":d.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function u(d){if(d.ep)return;d.ep=!0;const a=c(d);fetch(d.href,a)}})();var nd={exports:{}},Ei={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Ym;function ov(){if(Ym)return Ei;Ym=1;var n=Symbol.for("react.transitional.element"),o=Symbol.for("react.fragment");function c(u,d,a){var r=null;if(a!==void 0&&(r=""+a),d.key!==void 0&&(r=""+d.key),"key"in d){a={};for(var l in d)l!=="key"&&(a[l]=d[l])}else a=d;return d=a.ref,{$$typeof:n,type:u,key:r,ref:d!==void 0?d:null,props:a}}return Ei.Fragment=o,Ei.jsx=c,Ei.jsxs=c,Ei}var Vm;function iv(){return Vm||(Vm=1,nd.exports=ov()),nd.exports}var v=iv(),rv={string:"文字列にする",integer:"整数にする",number:"数にする",object:"オブジェクトにする",array:"配列にする",boolean:"true か false にする",null:"null にする"},lv={string:"Use a string",integer:"Use an integer",number:"Use a number",object:"Use an object",array:"Use an array",boolean:"Use true or false",null:"Use null"},Xm=(n,o)=>`${n} ${o}${n===1?"":"s"}`,cv={additionalProperties:n=>`${n} という欄は書けない`,required:n=>`${n} の欄が要る`,enum:n=>`${n.join(" / ")} のどれかにする`,type:n=>rv[n]??`${n} にする`,minLength:n=>`${n} 字以上書く`,pattern:n=>n?`${n.space?"空白と ":""}${n.chars.join(" ")} は使えない`:"使えない字が入っている",minItems:n=>`${n} つ以上書く`,minimum:n=>`${n} 以上にする`,const:n=>`${n} にする`,not:n=>n?`${n.field} の欄は kind が ${n.kind} の時だけ書ける`:"この欄の組み合わせは書けない",reserved:n=>`${n.join(" と ")} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,kindOnly:(n,o)=>`${n.join(" と ")} の出来事は kind が ${o} の時だけ書ける`,hex:(n,o)=>`0 から 9 と a から f の字で ${n} から ${o} 字にする`,duration:n=>`数と単位 (${n.join(" / ")}) の組で書く (12s など)`,ratio:"分数 (2/3) か百分率 (97%) で書く",url:"/ で始まる path か、http:// か https:// で始まる URL にする",anyOf:n=>n.length>0?`${n.join(" か ")} の${n.length===2?"どちらか":"どれか"}の欄が要る`:"書ける形のどれにも合わない",oneOf:"書ける形のどれか 1 つだけに合わせる",discriminator:(n,o)=>`${n} は ${o.join(" / ")} のどれかにする`,newer:(n,o)=>`版 ${n} の図は、この道具 (版 ${o}) より新しいので読めない。道具を新しくする`},uv={additionalProperties:n=>`The ${n} field is not allowed`,required:n=>`The ${n} field is required`,enum:n=>`Use one of ${n.join(" / ")}`,type:n=>lv[n]??`Use ${n}`,minLength:n=>`Write at least ${Xm(n,"character")}`,pattern:n=>n?`Cannot contain ${n.space?"spaces or ":""}${n.chars.join(" ")}`:"Contains characters that are not allowed",minItems:n=>`Write at least ${Xm(n,"item")}`,minimum:n=>`Use ${n} or greater`,const:n=>`Use ${n}`,not:n=>n?`The ${n.field} field is allowed only when kind is ${n.kind}`:"This combination of fields is not allowed",reserved:n=>`${n.join(" and ")} name the start and end marks of a state diagram and cannot be box ids`,kindOnly:(n,o)=>`${n.join(" and ")} events are allowed only when kind is ${o}`,hex:(n,o)=>`Use ${n} to ${o} characters of 0-9 and a-f`,duration:n=>`Write a number and a unit (${n.join(" / ")}), such as 12s`,ratio:"Write a fraction (2/3) or a percentage (97%)",url:"Use a path that starts with / or a URL that starts with http:// or https://",anyOf:n=>n.length>0?`Write one of the ${n.join(" or ")} fields`:"Does not match any of the allowed shapes",oneOf:"Match exactly one of the allowed shapes",discriminator:(n,o)=>`${n} is one of ${o.join(" / ")}`,newer:(n,o)=>`Version ${n} diagrams are newer than this tool (version ${o}) and cannot be read. Update the tool`},H0={ja:cv,en:uv};function dv(n){let o=0;for(const c of n)o++;return o}var Jm=U0,ad={properties:{version:{description:"形式の版",type:"integer",minimum:1},kind:{description:"図の種類",enum:["sequence","architecture","state","git","time","tree"]},title:{$ref:"#/definitions/text"},view:{description:"見せ方。書かなければ字の大きさで選ぶ。fixed は全体を止めて中だけ動かし、follow は寄って動かし全体図で今どこかを示す",enum:["fixed","follow"]},regions:{type:"array",items:{$ref:"#/definitions/region"}},boxes:{type:"array",items:{$ref:"#/definitions/box"}},strip:{$ref:"#/definitions/strip"},steps:{type:"array",minItems:1,items:{$ref:"#/definitions/step"}},sequence:{$ref:"#/definitions/sequence"},state:{$ref:"#/definitions/state"},git:{$ref:"#/definitions/git"},time:{$ref:"#/definitions/time"}}};function ra(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(Array.isArray(n)){const g=n.length;for(let b=0;b<g;b++){let w=n[b];if(w&&typeof w=="object"&&!Array.isArray(w)&&w.events!==void 0){let x=w.events;if(Array.isArray(x)){const _=x.length;for(let E=0;E<_;E++){let M=x[E];const N=r,$=r;if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type===void 0){const K={};a===null?a=[K]:a.push(K),r++}else if(M.type!==void 0){let K=M.type;if(!(K==="now"||K==="mark"||K==="span")){const q={};a===null?a=[q]:a.push(q),r++}}}var l=$===r;if(l){const K={instancePath:o+"/"+b+"/events/"+E,schemaPath:"#/items/properties/events/items/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[K]:a.push(K),r++}else r=N,a!==null&&(N?a.length=N:a=null);const j=r,G=r;if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type===void 0){const K={};a===null?a=[K]:a.push(K),r++}else if(M.type!==void 0){let K=M.type;if(!(K==="leaf"||K==="node")){const q={};a===null?a=[q]:a.push(q),r++}}}var f=G===r;if(f){const K={instancePath:o+"/"+b+"/events/"+E,schemaPath:"#/items/properties/events/items/allOf/0/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[K]:a.push(K),r++}else r=j,a!==null&&(j?a.length=j:a=null);if(M&&typeof M=="object"&&!Array.isArray(M)){if(M.type!==void 0){let K=M.type;const q=r,U=r;if(!(K==="commit"||K==="branch")){const z={};a===null?a=[z]:a.push(z),r++}var p=U===r;if(p){const z={instancePath:o+"/"+b+"/events/"+E+"/type",schemaPath:"#/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[z]:a.push(z),r++}else r=q,a!==null&&(q?a.length=q:a=null)}if(M.at!==void 0){const K={instancePath:o+"/"+b+"/events/"+E+"/at",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[K]:a.push(K),r++}if(M.into!==void 0){const K={instancePath:o+"/"+b+"/events/"+E+"/into",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[K]:a.push(K),r++}if(M.color!==void 0){const K={instancePath:o+"/"+b+"/events/"+E+"/color",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[K]:a.push(K),r++}}}}}}}return ra.errors=a,r===0}function xn(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)&&n.meters!==void 0){const l={instancePath:o+"/meters",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[l]:a.push(l),r++}return xn.errors=a,r===0}function sl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(Array.isArray(n)){const p=n.length;for(let g=0;g<p;g++){let b=n[g];if(b&&typeof b=="object"&&!Array.isArray(b)&&b.events!==void 0){let w=b.events;if(Array.isArray(w)){const x=w.length;for(let _=0;_<x;_++){let E=w[_];const M=r,N=r;if(E&&typeof E=="object"&&!Array.isArray(E)){if(E.type===void 0){const G={};a===null?a=[G]:a.push(G),r++}else if(E.type!==void 0){let G=E.type;if(!(G==="now"||G==="mark"||G==="span")){const K={};a===null?a=[K]:a.push(K),r++}}}var l=N===r;if(l){const G={instancePath:o+"/"+g+"/events/"+_,schemaPath:"#/items/properties/events/items/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[G]:a.push(G),r++}else r=M,a!==null&&(M?a.length=M:a=null);const $=r,j=r;if(E&&typeof E=="object"&&!Array.isArray(E)){if(E.type===void 0){const G={};a===null?a=[G]:a.push(G),r++}else if(E.type!==void 0){let G=E.type;if(!(G==="leaf"||G==="node")){const K={};a===null?a=[K]:a.push(K),r++}}}var f=j===r;if(f){const G={instancePath:o+"/"+g+"/events/"+_,schemaPath:"#/items/properties/events/items/allOf/0/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[G]:a.push(G),r++}else r=$,a!==null&&($?a.length=$:a=null);if(E&&typeof E=="object"&&!Array.isArray(E)){if(E.at!==void 0){const G={instancePath:o+"/"+g+"/events/"+_+"/at",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[G]:a.push(G),r++}if(E.into!==void 0){const G={instancePath:o+"/"+g+"/events/"+_+"/into",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[G]:a.push(G),r++}if(E.color!==void 0){const G={instancePath:o+"/"+g+"/events/"+_+"/color",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[G]:a.push(G),r++}}}}}}}return sl.errors=a,r===0}function ol(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(Array.isArray(n)){const p=n.length;for(let g=0;g<p;g++){let b=n[g];if(b&&typeof b=="object"&&!Array.isArray(b)&&b.events!==void 0){let w=b.events;if(Array.isArray(w)){const x=w.length;for(let _=0;_<x;_++){let E=w[_];const M=r,N=r;if(E&&typeof E=="object"&&!Array.isArray(E)){if(E.type===void 0){const $={};a===null?a=[$]:a.push($),r++}else if(E.type!==void 0){let $=E.type;if(!($==="leaf"||$==="node")){const j={};a===null?a=[j]:a.push(j),r++}}}var l=N===r;if(l){const $={instancePath:o+"/"+g+"/events/"+_,schemaPath:"#/items/properties/events/items/allOf/0/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[$]:a.push($),r++}else r=M,a!==null&&(M?a.length=M:a=null);if(E&&typeof E=="object"&&!Array.isArray(E)&&E.type!==void 0){let $=E.type;const j=r,G=r;if(!($==="commit"||$==="branch")){const K={};a===null?a=[K]:a.push(K),r++}var f=G===r;if(f){const K={instancePath:o+"/"+g+"/events/"+_+"/type",schemaPath:"#/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[K]:a.push(K),r++}else r=j,a!==null&&(j?a.length=j:a=null)}}}}}}return ol.errors=a,r===0}function il(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(Array.isArray(n)){const p=n.length;for(let g=0;g<p;g++){let b=n[g];if(b&&typeof b=="object"&&!Array.isArray(b)&&b.events!==void 0){let w=b.events;if(Array.isArray(w)){const x=w.length;for(let _=0;_<x;_++){let E=w[_];const M=r,N=r;if(E&&typeof E=="object"&&!Array.isArray(E)){if(E.type===void 0){const $={};a===null?a=[$]:a.push($),r++}else if(E.type!==void 0){let $=E.type;if(!($==="now"||$==="mark"||$==="span")){const j={};a===null?a=[j]:a.push(j),r++}}}var l=N===r;if(l){const $={instancePath:o+"/"+g+"/events/"+_,schemaPath:"#/items/properties/events/items/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[$]:a.push($),r++}else r=M,a!==null&&(M?a.length=M:a=null);if(E&&typeof E=="object"&&!Array.isArray(E)){if(E.type!==void 0){let $=E.type;const j=r,G=r;if(!($==="commit"||$==="branch")){const K={};a===null?a=[K]:a.push(K),r++}var f=G===r;if(f){const K={instancePath:o+"/"+g+"/events/"+_+"/type",schemaPath:"#/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[K]:a.push(K),r++}else r=j,a!==null&&(j?a.length=j:a=null)}if(E.at!==void 0){const $={instancePath:o+"/"+g+"/events/"+_+"/at",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[$]:a.push($),r++}if(E.into!==void 0){const $={instancePath:o+"/"+g+"/events/"+_+"/into",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[$]:a.push($),r++}if(E.color!==void 0){const $={instancePath:o+"/"+g+"/events/"+_+"/color",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[$]:a.push($),r++}}}}}}}return il.errors=a,r===0}var xo={enum:["blue","amber","green","violet","rose","slate","coin"]},Ht=new RegExp("^[^\\s\\[\\]「」=:]+$","u"),Nt=dv;function rl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.id===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}if(n.name===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="id"||l==="name"||l==="note"||l==="color"||l==="icon")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.id!==void 0){let l=n.id;if(typeof l=="string"){if(!Ht.test(l)){const f={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.name!==void 0){let l=n.name;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.note!==void 0){let l=n.note;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.color!==void 0){let l=n.color;if(!(l==="blue"||l==="amber"||l==="green"||l==="violet"||l==="rose"||l==="slate"||l==="coin")){const f={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:xo.enum},message:"must be equal to one of the allowed values"};a===null?a=[f]:a.push(f),r++}}if(n.icon!==void 0){let l=n.icon;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/icon",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/icon",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return rl.errors=a,r===0}var L0=new RegExp("^(/|https?://)","u");function ll(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.id===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}if(n.name===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="id"||l==="name"||l==="sub"||l==="color"||l==="icon"||l==="region"||l==="link")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.id!==void 0){let l=n.id;if(typeof l=="string"){if(!Ht.test(l)){const f={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.name!==void 0){let l=n.name;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.sub!==void 0){let l=n.sub;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/sub",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/sub",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.color!==void 0){let l=n.color;if(!(l==="blue"||l==="amber"||l==="green"||l==="violet"||l==="rose"||l==="slate"||l==="coin")){const f={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:xo.enum},message:"must be equal to one of the allowed values"};a===null?a=[f]:a.push(f),r++}}if(n.icon!==void 0){let l=n.icon;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/icon",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/icon",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.region!==void 0){let l=n.region;if(typeof l=="string"){if(!Ht.test(l)){const f={instancePath:o+"/region",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/region",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.link!==void 0){let l=n.link;if(typeof l=="string"){if(!L0.test(l)){const f={instancePath:o+"/link",schemaPath:"#/definitions/url/pattern",keyword:"pattern",params:{pattern:"^(/|https?://)"},message:'must match pattern "^(/|https?://)"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/link",schemaPath:"#/definitions/url/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return ll.errors=a,r===0}var hv=new RegExp("^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$","u");function cl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.field===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"field"},message:"must have required property 'field'"};a===null?a=[l]:a.push(l),r++}if(n.line===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"line"},message:"must have required property 'line'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="field"||l==="line")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.field!==void 0){let l=n.field;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/field",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/field",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.line!==void 0){let l=n.line;if(typeof l=="string"){if(!hv.test(l)){const f={instancePath:o+"/line",schemaPath:"#/definitions/ratio/pattern",keyword:"pattern",params:{pattern:"^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$"},message:'must match pattern "^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/line",schemaPath:"#/definitions/ratio/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return cl.errors=a,r===0}function ul(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.title===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};a===null?a=[l]:a.push(l),r++}if(n.fields===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"fields"},message:"must have required property 'fields'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="title"||l==="fields"||l==="meters")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.title!==void 0){let l=n.title;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.fields!==void 0){let l=n.fields;if(Array.isArray(l)){if(l.length<1){const p={instancePath:o+"/fields",schemaPath:"#/properties/fields/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[p]:a.push(p),r++}const f=l.length;for(let p=0;p<f;p++){let g=l[p];if(typeof g=="string"){if(Nt(g)<1){const b={instancePath:o+"/fields/"+p,schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[b]:a.push(b),r++}}else{const b={instancePath:o+"/fields/"+p,schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[b]:a.push(b),r++}}}else{const f={instancePath:o+"/fields",schemaPath:"#/properties/fields/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}if(n.meters!==void 0){let l=n.meters;if(Array.isArray(l)){if(l.length<1){const p={instancePath:o+"/meters",schemaPath:"#/properties/meters/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[p]:a.push(p),r++}const f=l.length;for(let p=0;p<f;p++)cl(l[p],{instancePath:o+"/meters/"+p,parentData:l,parentDataProperty:p,rootData:d})||(a=a===null?cl.errors:a.concat(cl.errors),r=a.length)}else{const f={instancePath:o+"/meters",schemaPath:"#/properties/meters/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return ul.errors=a,r===0}function dl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.name===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};a===null?a=[l]:a.push(l),r++}if(n.url===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"url"},message:"must have required property 'url'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="name"||l==="url")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.name!==void 0){let l=n.name;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.url!==void 0){let l=n.url;if(typeof l=="string"){if(!L0.test(l)){const f={instancePath:o+"/url",schemaPath:"#/definitions/url/pattern",keyword:"pattern",params:{pattern:"^(/|https?://)"},message:'must match pattern "^(/|https?://)"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/url",schemaPath:"#/definitions/url/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return dl.errors=a,r===0}var Qm={oneOf:[{description:"線。運ぶ物を載せて送る側から受ける側へ走る",type:"object",additionalProperties:!1,required:["type","from","to","carry"],properties:{type:{const:"edge"},from:{$ref:"#/definitions/id"},to:{$ref:"#/definitions/id"},label:{$ref:"#/definitions/text"},carry:{$ref:"#/definitions/carry"},labelSide:{description:"線の名前を置く側 (寄せの指示)",enum:["above","below","left","right"]},at:{description:"時間軸の図の拡大の帯で、線を引く列の目盛り",$ref:"#/definitions/unit"},into:{description:"時間軸の図の拡大の帯で、受ける箱を選ぶ列の目盛り。書かなければ at の列",$ref:"#/definitions/unit"}}},{description:"箱の中の処理",type:"object",additionalProperties:!1,required:["type","box","label"],properties:{type:{const:"action"},box:{$ref:"#/definitions/id"},label:{$ref:"#/definitions/text"}}},{description:"箱の下の小さな字の書き換え",type:"object",additionalProperties:!1,required:["type","box","text"],properties:{type:{const:"swap"},box:{$ref:"#/definitions/id"},text:{$ref:"#/definitions/text"},color:{description:"時間軸の図の節目の丸の色",$ref:"#/definitions/color"}}},{description:"commit を積む。枝分かれの図だけが書ける。積んだ枝の札と、その枝を指す HEAD が進む。当て直し (copy) は枝の札を動かさず、merge commit (merge) は取り込む枝の先端も親に持つ",type:"object",additionalProperties:!1,required:["type","id","branch"],properties:{type:{const:"commit"},id:{$ref:"#/definitions/id"},branch:{$ref:"#/definitions/id"},copy:{$ref:"#/definitions/id"},merge:{$ref:"#/definitions/id"},hash:{$ref:"#/definitions/hash"},note:{$ref:"#/definitions/text"}}},{description:"枝を切る。枝分かれの図だけが書ける。枝の札を from の commit へ置き、HEAD をその枝へ移す",type:"object",additionalProperties:!1,required:["type","branch","from"],properties:{type:{const:"branch"},branch:{$ref:"#/definitions/id"},from:{$ref:"#/definitions/id"}}},{description:"時間軸の図の今の時刻の針を、to の目盛りの終わりまで進める",type:"object",additionalProperties:!1,required:["type","to"],properties:{type:{const:"now"},to:{$ref:"#/definitions/unit"}}},{description:"時間軸の図の印の列 row の、from から to の目盛りの印の色を変える",type:"object",additionalProperties:!1,required:["type","row","from","to","color"],properties:{type:{const:"mark"},row:{$ref:"#/definitions/id"},from:{$ref:"#/definitions/unit"},to:{$ref:"#/definitions/unit"},color:{$ref:"#/definitions/color"}}},{description:"時間軸の図の from から to の目盛りに、括弧と字を出す。shape が box なら印の列を囲み、字を縁の札にする",type:"object",additionalProperties:!1,required:["type","from","to","text"],properties:{type:{const:"span"},from:{$ref:"#/definitions/unit"},to:{$ref:"#/definitions/unit"},text:{$ref:"#/definitions/text"},shape:{enum:["box"]},color:{$ref:"#/definitions/color"}}},{description:"葉を出す。木の図だけが書ける。書いた段で葉の箱が現れる。hash を書くと箱に値を出し、名札を葉の下の札に出す",type:"object",additionalProperties:!1,required:["type","id"],properties:{type:{const:"leaf"},id:{$ref:"#/definitions/id"},hash:{$ref:"#/definitions/hash"}}},{description:"1 つ以上の子から親を組む。木の図だけが書ける。書いた段で親の箱と、子から親への木の線が現れる",type:"object",additionalProperties:!1,required:["type","id","children"],properties:{type:{const:"node"},id:{$ref:"#/definitions/id"},children:{type:"array",minItems:1,items:{$ref:"#/definitions/id"}},hash:{$ref:"#/definitions/hash"}}},{description:"中身の帯の欄の値と札",type:"object",additionalProperties:!1,required:["type","field"],anyOf:[{required:["value"]},{required:["tag"]}],properties:{type:{const:"strip"},field:{$ref:"#/definitions/text"},value:{$ref:"#/definitions/text"},tag:{$ref:"#/definitions/text"}}}]},sd=new RegExp("^[0-9a-f]{4,40}$","u"),pv={properties:{kind:{enum:["envelope","tag","coin","none"]}}};function hl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;const l=r;let f=!0;const p=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const x={};a===null?a=[x]:a.push(x),r++}else if(n.kind!==void 0&&n.kind!=="tag"){const x={};a===null?a=[x]:a.push(x),r++}}var g=p===r;r=l,a!==null&&(l?a.length=l:a=null);let b;if(g){const x=r;if(n&&typeof n=="object"&&!Array.isArray(n)&&n.text===void 0){const E={instancePath:o,schemaPath:"#/then/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};a===null?a=[E]:a.push(E),r++}var g=x===r;f=g,b="then"}else{const x=r,_=r,E=r;if(n&&typeof n=="object"&&!Array.isArray(n)&&n.text===void 0){const N={};a===null?a=[N]:a.push(N),r++}var w=E===r;if(w){const N={instancePath:o,schemaPath:"#/else/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[N]:a.push(N),r++}else r=_,a!==null&&(_?a.length=_:a=null);var g=x===r;f=g,b="else"}if(!f){const x={instancePath:o,schemaPath:"#/if",keyword:"if",params:{failingKeyword:b},message:'must match "'+b+'" schema'};a===null?a=[x]:a.push(x),r++}if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const x={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"kind"},message:"must have required property 'kind'"};a===null?a=[x]:a.push(x),r++}for(const x in n)if(!(x==="kind"||x==="text")){const _={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:x},message:"must NOT have additional properties"};a===null?a=[_]:a.push(_),r++}if(n.kind!==void 0){let x=n.kind;if(!(x==="envelope"||x==="tag"||x==="coin"||x==="none")){const _={instancePath:o+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues:pv.properties.kind.enum},message:"must be equal to one of the allowed values"};a===null?a=[_]:a.push(_),r++}}if(n.text!==void 0){let x=n.text;if(typeof x=="string"){if(Nt(x)<1){const _={instancePath:o+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[_]:a.push(_),r++}}else{const _={instancePath:o+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[_]:a.push(_),r++}}}else{const x={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[x]:a.push(x),r++}return hl.errors=a,r===0}function pl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}const f=n.type;if(typeof f=="string")if(f==="edge")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}if(n.from===void 0){const p={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[p]:a.push(p),r++}if(n.to===void 0){const p={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[p]:a.push(p),r++}if(n.carry===void 0){const p={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"carry"},message:"must have required property 'carry'"};a===null?a=[p]:a.push(p),r++}for(const p in n)if(!(p==="type"||p==="from"||p==="to"||p==="label"||p==="carry"||p==="labelSide"||p==="at"||p==="into")){const g={instancePath:o,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(n.type!==void 0&&n.type!=="edge"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue:"edge"},message:"must be equal to constant"};a===null?a=[p]:a.push(p),r++}if(n.from!==void 0){let p=n.from;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.to!==void 0){let p=n.to;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/to",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/to",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.label!==void 0){let p=n.label;if(typeof p=="string"){if(Nt(p)<1){const g={instancePath:o+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.carry!==void 0&&(hl(n.carry,{instancePath:o+"/carry",parentData:n,parentDataProperty:"carry",rootData:d})||(a=a===null?hl.errors:a.concat(hl.errors),r=a.length)),n.labelSide!==void 0){let p=n.labelSide;if(!(p==="above"||p==="below"||p==="left"||p==="right")){const g={instancePath:o+"/labelSide",schemaPath:"#/oneOf/0/properties/labelSide/enum",keyword:"enum",params:{allowedValues:Qm.oneOf[0].properties.labelSide.enum},message:"must be equal to one of the allowed values"};a===null?a=[g]:a.push(g),r++}}if(n.at!==void 0){let p=n.at;if(!(typeof p=="number"&&!(p%1)&&!isNaN(p)&&isFinite(p))){const g={instancePath:o+"/at",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof p=="number"&&isFinite(p)&&(p<0||isNaN(p))){const g={instancePath:o+"/at",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}if(n.into!==void 0){let p=n.into;if(!(typeof p=="number"&&!(p%1)&&!isNaN(p)&&isFinite(p))){const g={instancePath:o+"/into",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof p=="number"&&isFinite(p)&&(p<0||isNaN(p))){const g={instancePath:o+"/into",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[p]:a.push(p),r++}else if(f==="action")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}if(n.box===void 0){const p={instancePath:o,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};a===null?a=[p]:a.push(p),r++}if(n.label===void 0){const p={instancePath:o,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"label"},message:"must have required property 'label'"};a===null?a=[p]:a.push(p),r++}for(const p in n)if(!(p==="type"||p==="box"||p==="label")){const g={instancePath:o,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(n.type!==void 0&&n.type!=="action"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue:"action"},message:"must be equal to constant"};a===null?a=[p]:a.push(p),r++}if(n.box!==void 0){let p=n.box;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.label!==void 0){let p=n.label;if(typeof p=="string"){if(Nt(p)<1){const g={instancePath:o+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[p]:a.push(p),r++}else if(f==="swap")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}if(n.box===void 0){const p={instancePath:o,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};a===null?a=[p]:a.push(p),r++}if(n.text===void 0){const p={instancePath:o,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};a===null?a=[p]:a.push(p),r++}for(const p in n)if(!(p==="type"||p==="box"||p==="text"||p==="color")){const g={instancePath:o,schemaPath:"#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(n.type!==void 0&&n.type!=="swap"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue:"swap"},message:"must be equal to constant"};a===null?a=[p]:a.push(p),r++}if(n.box!==void 0){let p=n.box;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.text!==void 0){let p=n.text;if(typeof p=="string"){if(Nt(p)<1){const g={instancePath:o+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.color!==void 0){let p=n.color;if(!(p==="blue"||p==="amber"||p==="green"||p==="violet"||p==="rose"||p==="slate"||p==="coin")){const g={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:xo.enum},message:"must be equal to one of the allowed values"};a===null?a=[g]:a.push(g),r++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/2/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[p]:a.push(p),r++}else if(f==="commit")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}if(n.id===void 0){const p={instancePath:o,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[p]:a.push(p),r++}if(n.branch===void 0){const p={instancePath:o,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"branch"},message:"must have required property 'branch'"};a===null?a=[p]:a.push(p),r++}for(const p in n)if(!(p==="type"||p==="id"||p==="branch"||p==="copy"||p==="merge"||p==="hash"||p==="note")){const g={instancePath:o,schemaPath:"#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(n.type!==void 0&&n.type!=="commit"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue:"commit"},message:"must be equal to constant"};a===null?a=[p]:a.push(p),r++}if(n.id!==void 0){let p=n.id;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.branch!==void 0){let p=n.branch;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/branch",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/branch",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.copy!==void 0){let p=n.copy;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/copy",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/copy",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.merge!==void 0){let p=n.merge;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/merge",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/merge",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.hash!==void 0){let p=n.hash;if(typeof p=="string"){if(!sd.test(p)){const g={instancePath:o+"/hash",schemaPath:"#/definitions/hash/pattern",keyword:"pattern",params:{pattern:"^[0-9a-f]{4,40}$"},message:'must match pattern "^[0-9a-f]{4,40}$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/hash",schemaPath:"#/definitions/hash/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.note!==void 0){let p=n.note;if(typeof p=="string"){if(Nt(p)<1){const g={instancePath:o+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/3/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[p]:a.push(p),r++}else if(f==="branch")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}if(n.branch===void 0){const p={instancePath:o,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"branch"},message:"must have required property 'branch'"};a===null?a=[p]:a.push(p),r++}if(n.from===void 0){const p={instancePath:o,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[p]:a.push(p),r++}for(const p in n)if(!(p==="type"||p==="branch"||p==="from")){const g={instancePath:o,schemaPath:"#/oneOf/4/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(n.type!==void 0&&n.type!=="branch"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue:"branch"},message:"must be equal to constant"};a===null?a=[p]:a.push(p),r++}if(n.branch!==void 0){let p=n.branch;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/branch",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/branch",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.from!==void 0){let p=n.from;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/4/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[p]:a.push(p),r++}else if(f==="now")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}if(n.to===void 0){const p={instancePath:o,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[p]:a.push(p),r++}for(const p in n)if(!(p==="type"||p==="to")){const g={instancePath:o,schemaPath:"#/oneOf/5/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(n.type!==void 0&&n.type!=="now"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue:"now"},message:"must be equal to constant"};a===null?a=[p]:a.push(p),r++}if(n.to!==void 0){let p=n.to;if(!(typeof p=="number"&&!(p%1)&&!isNaN(p)&&isFinite(p))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof p=="number"&&isFinite(p)&&(p<0||isNaN(p))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/5/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[p]:a.push(p),r++}else if(f==="mark")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}if(n.row===void 0){const p={instancePath:o,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"row"},message:"must have required property 'row'"};a===null?a=[p]:a.push(p),r++}if(n.from===void 0){const p={instancePath:o,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[p]:a.push(p),r++}if(n.to===void 0){const p={instancePath:o,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[p]:a.push(p),r++}if(n.color===void 0){const p={instancePath:o,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"color"},message:"must have required property 'color'"};a===null?a=[p]:a.push(p),r++}for(const p in n)if(!(p==="type"||p==="row"||p==="from"||p==="to"||p==="color")){const g={instancePath:o,schemaPath:"#/oneOf/6/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(n.type!==void 0&&n.type!=="mark"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue:"mark"},message:"must be equal to constant"};a===null?a=[p]:a.push(p),r++}if(n.row!==void 0){let p=n.row;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/row",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/row",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.from!==void 0){let p=n.from;if(!(typeof p=="number"&&!(p%1)&&!isNaN(p)&&isFinite(p))){const g={instancePath:o+"/from",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof p=="number"&&isFinite(p)&&(p<0||isNaN(p))){const g={instancePath:o+"/from",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}if(n.to!==void 0){let p=n.to;if(!(typeof p=="number"&&!(p%1)&&!isNaN(p)&&isFinite(p))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof p=="number"&&isFinite(p)&&(p<0||isNaN(p))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}if(n.color!==void 0){let p=n.color;if(!(p==="blue"||p==="amber"||p==="green"||p==="violet"||p==="rose"||p==="slate"||p==="coin")){const g={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:xo.enum},message:"must be equal to one of the allowed values"};a===null?a=[g]:a.push(g),r++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/6/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[p]:a.push(p),r++}else if(f==="span")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}if(n.from===void 0){const p={instancePath:o,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[p]:a.push(p),r++}if(n.to===void 0){const p={instancePath:o,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[p]:a.push(p),r++}if(n.text===void 0){const p={instancePath:o,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};a===null?a=[p]:a.push(p),r++}for(const p in n)if(!(p==="type"||p==="from"||p==="to"||p==="text"||p==="shape"||p==="color")){const g={instancePath:o,schemaPath:"#/oneOf/7/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(n.type!==void 0&&n.type!=="span"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue:"span"},message:"must be equal to constant"};a===null?a=[p]:a.push(p),r++}if(n.from!==void 0){let p=n.from;if(!(typeof p=="number"&&!(p%1)&&!isNaN(p)&&isFinite(p))){const g={instancePath:o+"/from",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof p=="number"&&isFinite(p)&&(p<0||isNaN(p))){const g={instancePath:o+"/from",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}if(n.to!==void 0){let p=n.to;if(!(typeof p=="number"&&!(p%1)&&!isNaN(p)&&isFinite(p))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[g]:a.push(g),r++}if(typeof p=="number"&&isFinite(p)&&(p<0||isNaN(p))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[g]:a.push(g),r++}}if(n.text!==void 0){let p=n.text;if(typeof p=="string"){if(Nt(p)<1){const g={instancePath:o+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.shape!==void 0&&n.shape!=="box"){const p={instancePath:o+"/shape",schemaPath:"#/oneOf/7/properties/shape/enum",keyword:"enum",params:{allowedValues:Qm.oneOf[7].properties.shape.enum},message:"must be equal to one of the allowed values"};a===null?a=[p]:a.push(p),r++}if(n.color!==void 0){let p=n.color;if(!(p==="blue"||p==="amber"||p==="green"||p==="violet"||p==="rose"||p==="slate"||p==="coin")){const g={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:xo.enum},message:"must be equal to one of the allowed values"};a===null?a=[g]:a.push(g),r++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/7/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[p]:a.push(p),r++}else if(f==="leaf")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}if(n.id===void 0){const p={instancePath:o,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[p]:a.push(p),r++}for(const p in n)if(!(p==="type"||p==="id"||p==="hash")){const g={instancePath:o,schemaPath:"#/oneOf/8/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(n.type!==void 0&&n.type!=="leaf"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue:"leaf"},message:"must be equal to constant"};a===null?a=[p]:a.push(p),r++}if(n.id!==void 0){let p=n.id;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.hash!==void 0){let p=n.hash;if(typeof p=="string"){if(!sd.test(p)){const g={instancePath:o+"/hash",schemaPath:"#/definitions/hash/pattern",keyword:"pattern",params:{pattern:"^[0-9a-f]{4,40}$"},message:'must match pattern "^[0-9a-f]{4,40}$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/hash",schemaPath:"#/definitions/hash/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/8/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[p]:a.push(p),r++}else if(f==="node")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[p]:a.push(p),r++}if(n.id===void 0){const p={instancePath:o,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[p]:a.push(p),r++}if(n.children===void 0){const p={instancePath:o,schemaPath:"#/oneOf/9/required",keyword:"required",params:{missingProperty:"children"},message:"must have required property 'children'"};a===null?a=[p]:a.push(p),r++}for(const p in n)if(!(p==="type"||p==="id"||p==="children"||p==="hash")){const g={instancePath:o,schemaPath:"#/oneOf/9/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};a===null?a=[g]:a.push(g),r++}if(n.type!==void 0&&n.type!=="node"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/9/properties/type/const",keyword:"const",params:{allowedValue:"node"},message:"must be equal to constant"};a===null?a=[p]:a.push(p),r++}if(n.id!==void 0){let p=n.id;if(typeof p=="string"){if(!Ht.test(p)){const g={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}if(n.children!==void 0){let p=n.children;if(Array.isArray(p)){if(p.length<1){const b={instancePath:o+"/children",schemaPath:"#/oneOf/9/properties/children/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[b]:a.push(b),r++}const g=p.length;for(let b=0;b<g;b++){let w=p[b];if(typeof w=="string"){if(!Ht.test(w)){const x={instancePath:o+"/children/"+b,schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[x]:a.push(x),r++}}else{const x={instancePath:o+"/children/"+b,schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[x]:a.push(x),r++}}}else{const g={instancePath:o+"/children",schemaPath:"#/oneOf/9/properties/children/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[g]:a.push(g),r++}}if(n.hash!==void 0){let p=n.hash;if(typeof p=="string"){if(!sd.test(p)){const g={instancePath:o+"/hash",schemaPath:"#/definitions/hash/pattern",keyword:"pattern",params:{pattern:"^[0-9a-f]{4,40}$"},message:'must match pattern "^[0-9a-f]{4,40}$"'};a===null?a=[g]:a.push(g),r++}}else{const g={instancePath:o+"/hash",schemaPath:"#/definitions/hash/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[g]:a.push(g),r++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/9/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[p]:a.push(p),r++}else if(f==="strip"){const p=r;let g=!1;const b=r;if(n&&typeof n=="object"&&!Array.isArray(n)&&n.value===void 0){const w={instancePath:o,schemaPath:"#/oneOf/10/anyOf/0/required",keyword:"required",params:{missingProperty:"value"},message:"must have required property 'value'"};a===null?a=[w]:a.push(w),r++}var l=b===r;if(g=g||l,!g){const w=r;if(n&&typeof n=="object"&&!Array.isArray(n)&&n.tag===void 0){const _={instancePath:o,schemaPath:"#/oneOf/10/anyOf/1/required",keyword:"required",params:{missingProperty:"tag"},message:"must have required property 'tag'"};a===null?a=[_]:a.push(_),r++}var l=w===r;g=g||l}if(g)r=p,a!==null&&(p?a.length=p:a=null);else{const w={instancePath:o,schemaPath:"#/oneOf/10/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};a===null?a=[w]:a.push(w),r++}if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const w={instancePath:o,schemaPath:"#/oneOf/10/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};a===null?a=[w]:a.push(w),r++}if(n.field===void 0){const w={instancePath:o,schemaPath:"#/oneOf/10/required",keyword:"required",params:{missingProperty:"field"},message:"must have required property 'field'"};a===null?a=[w]:a.push(w),r++}for(const w in n)if(!(w==="type"||w==="field"||w==="value"||w==="tag")){const x={instancePath:o,schemaPath:"#/oneOf/10/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:w},message:"must NOT have additional properties"};a===null?a=[x]:a.push(x),r++}if(n.type!==void 0&&n.type!=="strip"){const w={instancePath:o+"/type",schemaPath:"#/oneOf/10/properties/type/const",keyword:"const",params:{allowedValue:"strip"},message:"must be equal to constant"};a===null?a=[w]:a.push(w),r++}if(n.field!==void 0){let w=n.field;if(typeof w=="string"){if(Nt(w)<1){const x={instancePath:o+"/field",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[x]:a.push(x),r++}}else{const x={instancePath:o+"/field",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[x]:a.push(x),r++}}if(n.value!==void 0){let w=n.value;if(typeof w=="string"){if(Nt(w)<1){const x={instancePath:o+"/value",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[x]:a.push(x),r++}}else{const x={instancePath:o+"/value",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[x]:a.push(x),r++}}if(n.tag!==void 0){let w=n.tag;if(typeof w=="string"){if(Nt(w)<1){const x={instancePath:o+"/tag",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[x]:a.push(x),r++}}else{const x={instancePath:o+"/tag",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[x]:a.push(x),r++}}}else{const w={instancePath:o,schemaPath:"#/oneOf/10/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[w]:a.push(w),r++}}else{const p={instancePath:o,schemaPath:"#/discriminator",keyword:"discriminator",params:{error:"mapping",tag:"type",tagValue:f},message:'value of tag "type" must be in oneOf'};a===null?a=[p]:a.push(p),r++}else{const p={instancePath:o,schemaPath:"#/discriminator",keyword:"discriminator",params:{error:"tag",tag:"type",tagValue:f},message:'tag "type" must be string'};a===null?a=[p]:a.push(p),r++}}else{const f={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[f]:a.push(f),r++}return pl.errors=a,r===0}function fl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.title===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};a===null?a=[l]:a.push(l),r++}if(n.body===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"body"},message:"must have required property 'body'"};a===null?a=[l]:a.push(l),r++}if(n.events===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"events"},message:"must have required property 'events'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="title"||l==="body"||l==="code"||l==="sources"||l==="events")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.title!==void 0){let l=n.title;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.body!==void 0){let l=n.body;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/body",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/body",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.code!==void 0){let l=n.code;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/code",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/code",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.sources!==void 0){let l=n.sources;if(Array.isArray(l)){if(l.length<1){const p={instancePath:o+"/sources",schemaPath:"#/properties/sources/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[p]:a.push(p),r++}const f=l.length;for(let p=0;p<f;p++)dl(l[p],{instancePath:o+"/sources/"+p,parentData:l,parentDataProperty:p,rootData:d})||(a=a===null?dl.errors:a.concat(dl.errors),r=a.length)}else{const f={instancePath:o+"/sources",schemaPath:"#/properties/sources/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}if(n.events!==void 0){let l=n.events;if(Array.isArray(l)){const f=l.length;for(let p=0;p<f;p++)pl(l[p],{instancePath:o+"/events/"+p,parentData:l,parentDataProperty:p,rootData:d})||(a=a===null?pl.errors:a.concat(pl.errors),r=a.length)}else{const f={instancePath:o+"/events",schemaPath:"#/properties/events/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return fl.errors=a,r===0}function ml(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.lifelines===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"lifelines"},message:"must have required property 'lifelines'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(l!=="lifelines"){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.lifelines!==void 0){let l=n.lifelines;if(Array.isArray(l)){if(l.length<1){const p={instancePath:o+"/lifelines",schemaPath:"#/properties/lifelines/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[p]:a.push(p),r++}const f=l.length;for(let p=0;p<f;p++){let g=l[p];if(typeof g=="string"){if(!Ht.test(g)){const b={instancePath:o+"/lifelines/"+p,schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[b]:a.push(b),r++}}else{const b={instancePath:o+"/lifelines/"+p,schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[b]:a.push(b),r++}}}else{const f={instancePath:o+"/lifelines",schemaPath:"#/properties/lifelines/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return ml.errors=a,r===0}function gl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.from===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[l]:a.push(l),r++}if(n.to===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="from"||l==="to"||l==="label")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.from!==void 0){let l=n.from;if(typeof l=="string"){if(!Ht.test(l)){const f={instancePath:o+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.to!==void 0){let l=n.to;if(typeof l=="string"){if(!Ht.test(l)){const f={instancePath:o+"/to",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/to",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.label!==void 0){let l=n.label;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return gl.errors=a,r===0}function yl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.paths===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"paths"},message:"must have required property 'paths'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(l!=="paths"){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.paths!==void 0){let l=n.paths;if(Array.isArray(l)){if(l.length<1){const p={instancePath:o+"/paths",schemaPath:"#/properties/paths/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[p]:a.push(p),r++}const f=l.length;for(let p=0;p<f;p++)gl(l[p],{instancePath:o+"/paths/"+p,parentData:l,parentDataProperty:p,rootData:d})||(a=a===null?gl.errors:a.concat(gl.errors),r=a.length)}else{const f={instancePath:o+"/paths",schemaPath:"#/properties/paths/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return yl.errors=a,r===0}function bl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.id===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="id"||l==="note")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.id!==void 0){let l=n.id;if(typeof l=="string"){if(!Ht.test(l)){const f={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.note!==void 0){let l=n.note;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return bl.errors=a,r===0}function vl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.branches===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"branches"},message:"must have required property 'branches'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(l!=="branches"){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.branches!==void 0){let l=n.branches;if(Array.isArray(l)){if(l.length<1){const p={instancePath:o+"/branches",schemaPath:"#/properties/branches/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[p]:a.push(p),r++}const f=l.length;for(let p=0;p<f;p++)bl(l[p],{instancePath:o+"/branches/"+p,parentData:l,parentDataProperty:p,rootData:d})||(a=a===null?bl.errors:a.concat(bl.errors),r=a.length)}else{const f={instancePath:o+"/branches",schemaPath:"#/properties/branches/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return vl.errors=a,r===0}var fv=new RegExp("^[0-9]+(\\.[0-9]+)?(ms|s|min|h|d)$","u");function xl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.unit===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"unit"},message:"must have required property 'unit'"};a===null?a=[l]:a.push(l),r++}if(n.length===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"length"},message:"must have required property 'length'"};a===null?a=[l]:a.push(l),r++}if(n.count===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"count"},message:"must have required property 'count'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="unit"||l==="length"||l==="count"||l==="from")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.unit!==void 0){let l=n.unit;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/unit",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/unit",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.length!==void 0){let l=n.length;if(typeof l=="string"){if(!fv.test(l)){const f={instancePath:o+"/length",schemaPath:"#/definitions/duration/pattern",keyword:"pattern",params:{pattern:"^[0-9]+(\\.[0-9]+)?(ms|s|min|h|d)$"},message:'must match pattern "^[0-9]+(\\.[0-9]+)?(ms|s|min|h|d)$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/length",schemaPath:"#/definitions/duration/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.count!==void 0){let l=n.count;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:o+"/count",schemaPath:"#/properties/count/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<1||isNaN(l))){const f={instancePath:o+"/count",schemaPath:"#/properties/count/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};a===null?a=[f]:a.push(f),r++}}if(n.from!==void 0){let l=n.from;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:o+"/from",schemaPath:"#/properties/from/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const f={instancePath:o+"/from",schemaPath:"#/properties/from/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return xl.errors=a,r===0}function wl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.name===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};a===null?a=[l]:a.push(l),r++}if(n.length===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"length"},message:"must have required property 'length'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="name"||l==="length"||l==="from")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.name!==void 0){let l=n.name;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.length!==void 0){let l=n.length;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:o+"/length",schemaPath:"#/properties/length/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<1||isNaN(l))){const f={instancePath:o+"/length",schemaPath:"#/properties/length/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};a===null?a=[f]:a.push(f),r++}}if(n.from!==void 0){let l=n.from;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:o+"/from",schemaPath:"#/properties/from/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const f={instancePath:o+"/from",schemaPath:"#/properties/from/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return wl.errors=a,r===0}function kl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.id===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}if(n.name===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="id"||l==="name"||l==="color"||l==="empty")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.id!==void 0){let l=n.id;if(typeof l=="string"){if(!Ht.test(l)){const f={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.name!==void 0){let l=n.name;if(typeof l=="string"){if(Nt(l)<1){const f={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.color!==void 0){let l=n.color;if(!(l==="blue"||l==="amber"||l==="green"||l==="violet"||l==="rose"||l==="slate"||l==="coin")){const f={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:xo.enum},message:"must be equal to one of the allowed values"};a===null?a=[f]:a.push(f),r++}}if(n.empty!==void 0){let l=n.empty;if(Array.isArray(l)){const f=l.length;for(let p=0;p<f;p++){let g=l[p];if(!(typeof g=="number"&&!(g%1)&&!isNaN(g)&&isFinite(g))){const b={instancePath:o+"/empty/"+p,schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[b]:a.push(b),r++}if(typeof g=="number"&&isFinite(g)&&(g<0||isNaN(g))){const b={instancePath:o+"/empty/"+p,schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[b]:a.push(b),r++}}}else{const f={instancePath:o+"/empty",schemaPath:"#/properties/empty/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return kl.errors=a,r===0}function El(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.id===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};a===null?a=[l]:a.push(l),r++}if(n.at===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"at"},message:"must have required property 'at'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="id"||l==="at")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.id!==void 0){let l=n.id;if(typeof l=="string"){if(!Ht.test(l)){const f={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};a===null?a=[f]:a.push(f),r++}}else{const f={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[f]:a.push(f),r++}}if(n.at!==void 0){let l=n.at;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:o+"/at",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const f={instancePath:o+"/at",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return El.errors=a,r===0}function Al(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.from===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};a===null?a=[l]:a.push(l),r++}if(n.to===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="from"||l==="to")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.from!==void 0){let l=n.from;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:o+"/from",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const f={instancePath:o+"/from",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[f]:a.push(f),r++}}if(n.to!==void 0){let l=n.to;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const f={instancePath:o+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[f]:a.push(f),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const f={instancePath:o+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};a===null?a=[f]:a.push(f),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return Al.errors=a,r===0}function _l(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.scale===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"scale"},message:"must have required property 'scale'"};a===null?a=[l]:a.push(l),r++}if(n.rows===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"rows"},message:"must have required property 'rows'"};a===null?a=[l]:a.push(l),r++}for(const l in n)if(!(l==="scale"||l==="period"||l==="rows"||l==="points"||l==="zoom")){const f={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};a===null?a=[f]:a.push(f),r++}if(n.scale!==void 0&&(xl(n.scale,{instancePath:o+"/scale",parentData:n,parentDataProperty:"scale",rootData:d})||(a=a===null?xl.errors:a.concat(xl.errors),r=a.length)),n.period!==void 0&&(wl(n.period,{instancePath:o+"/period",parentData:n,parentDataProperty:"period",rootData:d})||(a=a===null?wl.errors:a.concat(wl.errors),r=a.length)),n.rows!==void 0){let l=n.rows;if(Array.isArray(l)){if(l.length<1){const p={instancePath:o+"/rows",schemaPath:"#/properties/rows/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[p]:a.push(p),r++}const f=l.length;for(let p=0;p<f;p++)kl(l[p],{instancePath:o+"/rows/"+p,parentData:l,parentDataProperty:p,rootData:d})||(a=a===null?kl.errors:a.concat(kl.errors),r=a.length)}else{const f={instancePath:o+"/rows",schemaPath:"#/properties/rows/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}if(n.points!==void 0){let l=n.points;if(Array.isArray(l)){const f=l.length;for(let p=0;p<f;p++)El(l[p],{instancePath:o+"/points/"+p,parentData:l,parentDataProperty:p,rootData:d})||(a=a===null?El.errors:a.concat(El.errors),r=a.length)}else{const f={instancePath:o+"/points",schemaPath:"#/properties/points/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[f]:a.push(f),r++}}n.zoom!==void 0&&(Al(n.zoom,{instancePath:o+"/zoom",parentData:n,parentDataProperty:"zoom",rootData:d})||(a=a===null?Al.errors:a.concat(Al.errors),r=a.length))}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[l]:a.push(l),r++}return _l.errors=a,r===0}var mv=Object.prototype.hasOwnProperty;function U0(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:d=n}={}){let a=null,r=0;const l=r;let f=!0;const p=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const N={};a===null?a=[N]:a.push(N),r++}else if(n.kind!==void 0&&n.kind!=="sequence"){const N={};a===null?a=[N]:a.push(N),r++}}var g=p===r;r=l,a!==null&&(l?a.length=l:a=null);let b;if(g){const N=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.sequence===void 0){const j={instancePath:o,schemaPath:"#/then/required",keyword:"required",params:{missingProperty:"sequence"},message:"must have required property 'sequence'"};a===null?a=[j]:a.push(j),r++}if(n.boxes!==void 0){let j=n.boxes;if(Array.isArray(j)&&j.length<1){const G={instancePath:o+"/boxes",schemaPath:"#/then/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[G]:a.push(G),r++}}if(n.steps!==void 0&&(ra(n.steps,{instancePath:o+"/steps",parentData:n,parentDataProperty:"steps",rootData:d})||(a=a===null?ra.errors:a.concat(ra.errors),r=a.length)),n.strip!==void 0&&(xn(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:d})||(a=a===null?xn.errors:a.concat(xn.errors),r=a.length)),n.state!==void 0){const j={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[j]:a.push(j),r++}if(n.git!==void 0){const j={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[j]:a.push(j),r++}if(n.time!==void 0){const j={instancePath:o+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[j]:a.push(j),r++}}var g=N===r;f=g,b="then"}else{const N=r,$=r;let j=!0;const G=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const U={};a===null?a=[U]:a.push(U),r++}else if(n.kind!==void 0&&n.kind!=="state"){const U={};a===null?a=[U]:a.push(U),r++}}var w=G===r;r=$,a!==null&&($?a.length=$:a=null);let K;if(w){const U=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.boxes!==void 0){let Q=n.boxes;if(Array.isArray(Q)){if(Q.length<1){const ue={instancePath:o+"/boxes",schemaPath:"#/else/then/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[ue]:a.push(ue),r++}const re=Q.length;for(let ue=0;ue<re;ue++){let he=Q[ue];if(he&&typeof he=="object"&&!Array.isArray(he)&&he.id!==void 0){let fe=he.id;const Ce=r,$e=r;if(!(fe==="start"||fe==="finish")){const C={};a===null?a=[C]:a.push(C),r++}var x=$e===r;if(x){const C={instancePath:o+"/boxes/"+ue+"/id",schemaPath:"#/else/then/properties/boxes/items/properties/id/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[C]:a.push(C),r++}else r=Ce,a!==null&&(Ce?a.length=Ce:a=null)}}}}if(n.steps!==void 0&&(ra(n.steps,{instancePath:o+"/steps",parentData:n,parentDataProperty:"steps",rootData:d})||(a=a===null?ra.errors:a.concat(ra.errors),r=a.length)),n.strip!==void 0&&(xn(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:d})||(a=a===null?xn.errors:a.concat(xn.errors),r=a.length)),n.git!==void 0){const Q={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Q]:a.push(Q),r++}if(n.time!==void 0){const Q={instancePath:o+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Q]:a.push(Q),r++}}var w=U===r;j=w,K="then"}else{const U=r,z=r;let Q=!0;const re=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const fe={};a===null?a=[fe]:a.push(fe),r++}else if(n.kind!==void 0&&n.kind!=="git"){const fe={};a===null?a=[fe]:a.push(fe),r++}}var _=re===r;r=z,a!==null&&(z?a.length=z:a=null);let ue;if(_){const fe=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.git===void 0){const $e={instancePath:o,schemaPath:"#/else/else/then/required",keyword:"required",params:{missingProperty:"git"},message:"must have required property 'git'"};a===null?a=[$e]:a.push($e),r++}if(n.steps!==void 0&&(sl(n.steps,{instancePath:o+"/steps",parentData:n,parentDataProperty:"steps",rootData:d})||(a=a===null?sl.errors:a.concat(sl.errors),r=a.length)),n.strip!==void 0&&(xn(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:d})||(a=a===null?xn.errors:a.concat(xn.errors),r=a.length)),n.state!==void 0){const $e={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[$e]:a.push($e),r++}if(n.regions!==void 0){const $e={instancePath:o+"/regions",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[$e]:a.push($e),r++}if(n.time!==void 0){const $e={instancePath:o+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[$e]:a.push($e),r++}}var _=fe===r;Q=_,ue="then"}else{const fe=r,Ce=r;let $e=!0;const C=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const Y={};a===null?a=[Y]:a.push(Y),r++}else if(n.kind!==void 0&&n.kind!=="time"){const Y={};a===null?a=[Y]:a.push(Y),r++}}var E=C===r;r=Ce,a!==null&&(Ce?a.length=Ce:a=null);let S;if(E){const Y=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.time===void 0){const D={instancePath:o,schemaPath:"#/else/else/else/then/required",keyword:"required",params:{missingProperty:"time"},message:"must have required property 'time'"};a===null?a=[D]:a.push(D),r++}if(n.steps!==void 0&&(ol(n.steps,{instancePath:o+"/steps",parentData:n,parentDataProperty:"steps",rootData:d})||(a=a===null?ol.errors:a.concat(ol.errors),r=a.length)),n.state!==void 0){const D={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[D]:a.push(D),r++}if(n.git!==void 0){const D={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[D]:a.push(D),r++}if(n.regions!==void 0){const D={instancePath:o+"/regions",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[D]:a.push(D),r++}}var E=Y===r;$e=E,S="then"}else{const Y=r,oe=r;let D=!0;const T=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const ve={};a===null?a=[ve]:a.push(ve),r++}else if(n.kind!==void 0&&n.kind!=="tree"){const ve={};a===null?a=[ve]:a.push(ve),r++}}var M=T===r;r=oe,a!==null&&(oe?a.length=oe:a=null);let te;if(M){const ve=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.steps!==void 0&&(il(n.steps,{instancePath:o+"/steps",parentData:n,parentDataProperty:"steps",rootData:d})||(a=a===null?il.errors:a.concat(il.errors),r=a.length)),n.strip!==void 0&&(xn(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:d})||(a=a===null?xn.errors:a.concat(xn.errors),r=a.length)),n.state!==void 0){const Ne={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Ne]:a.push(Ne),r++}if(n.git!==void 0){const Ne={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Ne]:a.push(Ne),r++}if(n.time!==void 0){const Ne={instancePath:o+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Ne]:a.push(Ne),r++}if(n.regions!==void 0){const Ne={instancePath:o+"/regions",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Ne]:a.push(Ne),r++}}var M=ve===r;D=M,te="then"}else{const ve=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.boxes!==void 0){let Ne=n.boxes;if(Array.isArray(Ne)&&Ne.length<1){const Ye={instancePath:o+"/boxes",schemaPath:"#/else/else/else/else/else/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[Ye]:a.push(Ye),r++}}if(n.steps!==void 0&&(ra(n.steps,{instancePath:o+"/steps",parentData:n,parentDataProperty:"steps",rootData:d})||(a=a===null?ra.errors:a.concat(ra.errors),r=a.length)),n.strip!==void 0&&(xn(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:d})||(a=a===null?xn.errors:a.concat(xn.errors),r=a.length)),n.state!==void 0){const Ne={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Ne]:a.push(Ne),r++}if(n.git!==void 0){const Ne={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Ne]:a.push(Ne),r++}if(n.time!==void 0){const Ne={instancePath:o+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[Ne]:a.push(Ne),r++}}var M=ve===r;D=M,te="else"}if(!D){const ve={instancePath:o,schemaPath:"#/else/else/else/else/if",keyword:"if",params:{failingKeyword:te},message:'must match "'+te+'" schema'};a===null?a=[ve]:a.push(ve),r++}var E=Y===r;$e=E,S="else"}if(!$e){const Y={instancePath:o,schemaPath:"#/else/else/else/if",keyword:"if",params:{failingKeyword:S},message:'must match "'+S+'" schema'};a===null?a=[Y]:a.push(Y),r++}var _=fe===r;Q=_,ue="else"}if(!Q){const fe={instancePath:o,schemaPath:"#/else/else/if",keyword:"if",params:{failingKeyword:ue},message:'must match "'+ue+'" schema'};a===null?a=[fe]:a.push(fe),r++}var w=U===r;j=w,K="else"}if(!j){const U={instancePath:o,schemaPath:"#/else/if",keyword:"if",params:{failingKeyword:K},message:'must match "'+K+'" schema'};a===null?a=[U]:a.push(U),r++}if(n&&typeof n=="object"&&!Array.isArray(n)&&n.sequence!==void 0){const U={instancePath:o+"/sequence",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};a===null?a=[U]:a.push(U),r++}var g=N===r;f=g,b="else"}if(!f){const N={instancePath:o,schemaPath:"#/if",keyword:"if",params:{failingKeyword:b},message:'must match "'+b+'" schema'};a===null?a=[N]:a.push(N),r++}if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.version===void 0){const N={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"version"},message:"must have required property 'version'"};a===null?a=[N]:a.push(N),r++}if(n.kind===void 0){const N={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"kind"},message:"must have required property 'kind'"};a===null?a=[N]:a.push(N),r++}if(n.title===void 0){const N={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};a===null?a=[N]:a.push(N),r++}if(n.boxes===void 0){const N={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"boxes"},message:"must have required property 'boxes'"};a===null?a=[N]:a.push(N),r++}if(n.steps===void 0){const N={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"steps"},message:"must have required property 'steps'"};a===null?a=[N]:a.push(N),r++}for(const N in n)if(!mv.call(ad.properties,N)){const $={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:N},message:"must NOT have additional properties"};a===null?a=[$]:a.push($),r++}if(n.version!==void 0){let N=n.version;if(!(typeof N=="number"&&!(N%1)&&!isNaN(N)&&isFinite(N))){const $={instancePath:o+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type:"integer"},message:"must be integer"};a===null?a=[$]:a.push($),r++}if(typeof N=="number"&&isFinite(N)&&(N<1||isNaN(N))){const $={instancePath:o+"/version",schemaPath:"#/properties/version/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};a===null?a=[$]:a.push($),r++}}if(n.kind!==void 0){let N=n.kind;if(!(N==="sequence"||N==="architecture"||N==="state"||N==="git"||N==="time"||N==="tree")){const $={instancePath:o+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues:ad.properties.kind.enum},message:"must be equal to one of the allowed values"};a===null?a=[$]:a.push($),r++}}if(n.title!==void 0){let N=n.title;if(typeof N=="string"){if(Nt(N)<1){const $={instancePath:o+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};a===null?a=[$]:a.push($),r++}}else{const $={instancePath:o+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};a===null?a=[$]:a.push($),r++}}if(n.view!==void 0){let N=n.view;if(!(N==="fixed"||N==="follow")){const $={instancePath:o+"/view",schemaPath:"#/properties/view/enum",keyword:"enum",params:{allowedValues:ad.properties.view.enum},message:"must be equal to one of the allowed values"};a===null?a=[$]:a.push($),r++}}if(n.regions!==void 0){let N=n.regions;if(Array.isArray(N)){const $=N.length;for(let j=0;j<$;j++)rl(N[j],{instancePath:o+"/regions/"+j,parentData:N,parentDataProperty:j,rootData:d})||(a=a===null?rl.errors:a.concat(rl.errors),r=a.length)}else{const $={instancePath:o+"/regions",schemaPath:"#/properties/regions/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[$]:a.push($),r++}}if(n.boxes!==void 0){let N=n.boxes;if(Array.isArray(N)){const $=N.length;for(let j=0;j<$;j++)ll(N[j],{instancePath:o+"/boxes/"+j,parentData:N,parentDataProperty:j,rootData:d})||(a=a===null?ll.errors:a.concat(ll.errors),r=a.length)}else{const $={instancePath:o+"/boxes",schemaPath:"#/properties/boxes/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[$]:a.push($),r++}}if(n.strip!==void 0&&(ul(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:d})||(a=a===null?ul.errors:a.concat(ul.errors),r=a.length)),n.steps!==void 0){let N=n.steps;if(Array.isArray(N)){if(N.length<1){const j={instancePath:o+"/steps",schemaPath:"#/properties/steps/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};a===null?a=[j]:a.push(j),r++}const $=N.length;for(let j=0;j<$;j++)fl(N[j],{instancePath:o+"/steps/"+j,parentData:N,parentDataProperty:j,rootData:d})||(a=a===null?fl.errors:a.concat(fl.errors),r=a.length)}else{const $={instancePath:o+"/steps",schemaPath:"#/properties/steps/type",keyword:"type",params:{type:"array"},message:"must be array"};a===null?a=[$]:a.push($),r++}}n.sequence!==void 0&&(ml(n.sequence,{instancePath:o+"/sequence",parentData:n,parentDataProperty:"sequence",rootData:d})||(a=a===null?ml.errors:a.concat(ml.errors),r=a.length)),n.state!==void 0&&(yl(n.state,{instancePath:o+"/state",parentData:n,parentDataProperty:"state",rootData:d})||(a=a===null?yl.errors:a.concat(yl.errors),r=a.length)),n.git!==void 0&&(vl(n.git,{instancePath:o+"/git",parentData:n,parentDataProperty:"git",rootData:d})||(a=a===null?vl.errors:a.concat(vl.errors),r=a.length)),n.time!==void 0&&(_l(n.time,{instancePath:o+"/time",parentData:n,parentDataProperty:"time",rootData:d})||(a=a===null?_l.errors:a.concat(_l.errors),r=a.length))}else{const N={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};a===null?a=[N]:a.push(N),r++}return U0.errors=a,r===0}var Rl=n=>Object.keys(n),Ci=Rl({sequence:!0,architecture:!0,state:!0,git:!0,time:!0,tree:!0}),Oi=["start","finish"],P0=["scale","period","row","point","zoom","mark","span"],ql="now",G0=["leaf","node"],Cd=["group","end","box","strip","step","say","code","source","act","note","set","branch","commit",...P0,...G0],el="as",Y0="on",V0="copy",X0="merge",Od="from",ca="HEAD",J0="at",Q0="of",ln={diagram:["view"],group:["note","color","icon"],box:["note","color","icon","link"],source:["url"],edge:["carry","tag","side","at","into"],note:["color"],set:["tag"],strip:["meter"],branch:["note"],commit:["hash","note"],leaf:["hash"],node:["hash"],scale:["from"],period:["from"],row:["color","empty"],mark:["color"],span:["shape","color"]},gv=["at","into"],Bi=["box"],Z0=["ms","s","min","h","d"],Bd=Rl({coin:!0,none:!0}),jd=Rl({fixed:!0,follow:!0}),zd=Rl({above:!0,below:!0,left:!0,right:!0}),Zm={時系列図:"sequence",構成図:"architecture",区画:"group",見せ方:"view",region:"group",view:"view"},Ts=["blue","amber","green","violet","rose","slate","coin"],yv=["edge","action","swap","strip","commit","branch","now","mark","span","leaf","node"],bv="#/definitions/absent/not",vv={regions:"sequence / architecture / state",at:"time",into:"time",color:"time",meters:"time"},xv={carry:{field:"text",kind:"tag"}},wv=/\/boxes\/items\/properties\/id\/not$/u,kv=/\/events\/items\/properties\/type\/not$/u,Ev=["commit","branch"],Av=/\/events\/items\/not$/u,_v=["now","mark","span"],Sv=/\/events\/items\/allOf\/0\/not$/u,$v=["leaf","node"],Dv=/^\^\[0-9\]\+\(\\\.\[0-9\]\+\)\?\(([a-z|]+)\)\$$/u,Nv=/%\)\$$/u,od=n=>n.replaceAll("~","~0").replaceAll("/","~1"),Tv="#/definitions/url/pattern",Mv=/^\^\[0-9a-f\]\{(\d+),(\d+)\}\$$/u;function Cv(n){const o=/^\^\[\^(.+)\]\+\$$/u.exec(n)?.[1];if(o===void 0)return;const c=o.match(/\\.|[^\\]/gu)??[];return{space:c.includes("\\s"),chars:c.filter(u=>u!=="\\s").map(u=>u.replace(/^\\/u,""))}}var K0=(n,o)=>o.filter(c=>c!==n&&c.schemaPath.startsWith(`${n.schemaPath}/`)&&(c.instancePath===n.instancePath||c.instancePath.startsWith(`${n.instancePath}/`)));function Ov(n,o,c){const u=n.params,d=n.instancePath;switch(n.keyword){case"additionalProperties":{const a=String(u.additionalProperty);return{pointer:`${d}/${od(a)}`,message:c.additionalProperties(a)}}case"required":{const a=String(u.missingProperty);return{pointer:`${d}/${od(a)}`,message:c.required(a)}}case"not":{if(wv.test(n.schemaPath))return{pointer:d,message:c.reserved(Oi)};if(kv.test(n.schemaPath))return{pointer:d,message:c.kindOnly(Ev,"git")};if(Av.test(n.schemaPath))return{pointer:`${d}/type`,message:c.kindOnly(_v,"time")};if(Sv.test(n.schemaPath))return{pointer:`${d}/type`,message:c.kindOnly($v,"tree")};const a=d.slice(d.lastIndexOf("/")+1);if(n.schemaPath===bv)return{pointer:d,message:c.not({field:a,kind:vv[a]??a})};const r=xv[a];return{pointer:r?`${d}/${r.field}`:d,message:c.not(r)}}case"anyOf":{const a=K0(n,o),r=a.every(l=>l.keyword==="required")?a.map(l=>String(l.params.missingProperty)):[];return{pointer:d,message:c.anyOf(r)}}case"discriminator":{const a=String(u.tag);return{pointer:`${d}/${od(a)}`,message:c.discriminator(a,yv)}}case"enum":return{pointer:d,message:c.enum(u.allowedValues.map(String))};case"type":return{pointer:d,message:c.type(String(u.type))};case"minLength":return{pointer:d,message:c.minLength(Number(u.limit))};case"pattern":{if(n.schemaPath===Tv)return{pointer:d,message:c.url};const a=String(u.pattern),r=Mv.exec(a);if(r)return{pointer:d,message:c.hex(Number(r[1]),Number(r[2]))};const l=Dv.exec(a);return l?{pointer:d,message:c.duration((l[1]??"").split("|"))}:Nv.test(a)?{pointer:d,message:c.ratio}:{pointer:d,message:c.pattern(Cv(a))}}case"minItems":return{pointer:d,message:c.minItems(Number(u.limit))};case"minimum":return{pointer:d,message:c.minimum(Number(u.limit))};case"const":return{pointer:d,message:c.const(String(u.allowedValue))};case"oneOf":return{pointer:d,message:c.oneOf};default:return{pointer:d,message:n.message??n.keyword}}}function Bv(n,o={}){if(Jm(n))return{ok:!0};const c=Jm.errors??[],u=new Set(c.filter(r=>r.keyword==="anyOf").flatMap(r=>K0(r,c))),d=H0[o.lang??"ja"];return{ok:!1,errors:c.filter(r=>r.keyword!=="if"&&!u.has(r)).map(r=>Ov(r,c,d))}}var tn=n=>n.join(" / "),jv=()=>{const n={sequence:"sequence <題>",architecture:"architecture <題>",group:"group <名札> as <名前> [note: <添え書き>] から end まで",box:"box <名札> as <名前> [note: <下の小さな字>]",strip:"strip <題>: <欄>, <欄>",view:"sequence <題> [view: follow]",step:"step <段の題>",say:"say <段の本文>",code:"code <命令>",act:"act <名札>: <処理の名前>",note:"note <名札>: <下の小さな字>",set:"set <欄>: <値> [tag: <札>]"};return{noHead:`最初の行に図の種類 (${tn(Ci)}) と題を書く`,badHead:`最初の行は ${Ci.join(" か ")} で始め、続けて題を書く`,oldForm:(o,c)=>`${o} は前の形の書き方。新しい形では ${n[c]} と書く`,unknownHead:o=>`${o} は行の頭に書けない。行は ${tn(Cd)} か、<名札> -> <名札> で始める`,duplicate:o=>`${o} は既に宣言した名札`,needsId:o=>`${o} の後ろに名札を書く`,badId:o=>`${o} は名札に使えない。名札には空白と [ ] 「 」 = : を含めない`,afterId:"名札の後ろには as <名前> か属性を書く",undeclaredBox:o=>`${o} という箱は宣言していない`,noBody:o=>`段「${o}」に本文 (say の行) が要る`,emptyStepTitle:"step の後ろに段の題を書く",noBoxes:"箱を 1 つ以上宣言する",noSteps:"段 (step の行) を 1 つ以上書く",emptySay:"say の後ろか、その下に字下げした行に段の本文を書く",sayTwice:"1 つの段に say は 1 つまで。長い本文は say の下に字下げして続ける",codeTwice:"1 つの段に code は 1 行まで",emptyCode:"code の後ろに命令を書く",sourceShape:"source は source <名前> [url: <URL>] の形で書く",declarationInStep:"group と box と strip と branch と、scale と period と row と point と zoom は最初の step より前に書く",stepLineBeforeStep:"線と say と code と source と act と note と set と commit と枝を切る行と、now と mark と span と、leaf と node の行は step の下に書く",nestedGroup:"group の中に group は書けない。先に end で閉じる",strayEnd:"end の前に、閉じる group が無い",endTakesNothing:"end の後ろには何も書かない",unclosedGroup:o=>`group ${o} を end で閉じていない`,regionReopened:o=>`group ${o} は宣言済み。もう一度開く時は group ${o} だけを書き、名前と属性は最初の宣言に書く`,emptyName:o=>`${o} の名前が空`,stripTwice:"strip は 1 つだけ宣言する",stripShape:"strip は strip <題>: <欄>, <欄> の形で書く",emptyStripField:"strip の欄の名前が空",stripUndeclared:"set を書く前に、strip <題>: <欄>, <欄> で帯を宣言する",noSuchField:o=>`${o} という欄は strip に無い`,stripNeedsValue:"set は set <欄>: <値> か set <欄> [tag: <札>] の形で書く",actShape:"act は act <名札>: <処理の名前> の形で書く",noteShape:"note は note <名札>: <下の小さな字> の形で書く",edgeShape:"線は <名札> -> <名札>: <線の名前> [<属性>] の形で書く",emptyLabel:"線の : の後ろに線の名前を書く。名前を書かない時は : も書かない",quoteUnclosed:'" で始めた字を " で閉じていない',afterQuote:'" で閉じた字の後ろには、属性か次の , だけを書く',attrUnclosed:"属性は [ で始めて ] で閉じ、行の終わりに置く",attrNoColon:o=>`[${o}] は書けない。属性は [<鍵>: <値>] の形で書く`,attrNoValue:o=>`${o}: の後ろに値を書く`,attrTwice:o=>`${o} は 1 つの行に 1 つまで`,badAttr:(o,c)=>`${o} はこの行に書けない属性。書けるのは ${tn(c)}`,badColor:`color は ${tn(Ts)} のどれか`,badView:`view は ${tn(jd)} のどれか`,badCarry:`carry は ${tn(Bd)} のどれか。札は tag: <値> で書く`,badSide:`side は ${tn(zd)} のどれか`,badUrl:o=>`${o} には / で始まる path か、http:// か https:// で始まる URL を書く`,carryTwice:"運ぶ物は 1 本の線に 1 つまで。carry と tag は一緒に書かない",reservedId:o=>`${o} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,intoStart:"start へ入る線は書けない。start は始まりの印で、線は start から出る",outOfFinish:"finish から出る線は書けない。finish は終わりの印で、線は finish へ入る",pathNoAttrs:"最初の step より前の線は今回は通らない道なので、属性 (carry と tag と side) を書けない",gitOnly:o=>`${o} の行は git (枝分かれの図) でだけ書ける`,gitNoGroup:"git (枝分かれの図) には group を書けない。枝は branch の行で宣言する",noBranches:"branch の行で枝を 1 つ以上宣言する",branchShape:"branch は branch <名札> [note: <添え書き>] の形で書く",commitShape:"commit は commit <名札> on <枝> [hash: <hash>, note: <一言>] の形で書く。当て直しは copy <commit> を、取り込みは merge <枝> を on <枝> の後ろに書く",fromShape:"枝を切る行は <枝> from <commit> の形で書く",undeclaredBranch:o=>`${o} という枝は宣言していない`,undeclaredRef:o=>`${o} という枝は宣言していない。札を動かす線は枝の名札か HEAD から引く`,noCommit:o=>`${o} という commit はまだ積んでいない`,emptyBranch:o=>`${o} の枝はまだどの commit も指していないので取り込めない`,mergeSelf:o=>`${o} は積む枝なので、取り込む枝にできない`,headReserved:o=>`${o} は枝分かれの図で今いる場所の札の名前で、名札に使えない`,badHash:"hash は 0 から 9 と a から f の字で 4 から 40 字にする",timeOnly:o=>`${o} は time (時間軸の図) でだけ書ける`,treeOnly:o=>`${o} の行は tree (木の図) でだけ書ける`,treeNoGroup:"tree (木の図) には group を書けない。木の箱は leaf と node の行で書く",noLeaves:"leaf の行で葉を 1 つ以上書く",leafShape:"leaf は leaf <名札> [hash: <hash>] の形で書く",nodeShape:"node は node <名札> of <子>, <子> [hash: <hash>] の形で書く",noTreeChild:o=>`${o} という葉か親はまだ書いていない。子は前に leaf か node で書いた名札にする`,notTreeBox:o=>`${o} は box の行で置いた箱で、木の箱でない。子は leaf か node で書いた名札にする`,twoParents:o=>`${o} はもう別の親の子になっている。木の箱の親は 1 つだけ`,manyRoots:(o,c)=>`${o} が親を持たないまま残る。木の根は 1 つだけで、${o} も ${c} も最後に 1 つの根へ組む`,timeTwice:o=>`${o} は 1 つだけ宣言する`,noScale:"scale の行で目盛りを宣言する",noRows:"row の行で印の列を 1 つ以上宣言する",scaleShape:"scale は scale <単位> <長さ> <数> [from: <番号>] の形で書く",periodShape:"period は period <名前> <目盛りの数> [from: <番号>] の形で書く",rowShape:"row は row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>] の形で書く",pointShape:"point は point <名札> at <目盛り> の形で書く",zoomShape:"zoom は zoom <目盛り>-<目盛り> の形で書く",nowShape:"針を進める行は now -> <目盛り> の形で書く",markShape:"mark は mark <列> <目盛り>-<目盛り> [color: <色>] の形で書く",spanShape:`span は span <目盛り>-<目盛り>: <字> [shape: ${tn(Bi)}, color: <色>] の形で書く`,badLength:`長さは数と単位 (${tn(Z0)}) の組で書く (12s など)`,badCount:o=>`${o} の目盛りの数は 1 以上の整数にする`,badUnit:(o,c)=>`${o} は目盛りの位置にできない。0 から ${c-1} の数か、その範囲 (0-3 など) を書く`,nowBack:(o,c)=>`now -> ${o} は針を進めない。前の now (${c}) より後の目盛りを書く`,outOfZoom:(o,c)=>`拡大の帯の列は ${o} から ${c} の目盛りから選ぶ`,noZoom:"at と into は、zoom で拡大の帯を宣言した図の箱どうしの線にだけ書ける",boxNeedsZoom:"時間軸の図の箱は拡大の帯に置く。zoom <目盛り>-<目盛り> で拡大の範囲を書く",boxLineNeedsAt:"拡大の帯の箱どうしの線には [at: <目盛り>] で列を書く",pointLineNoAt:"節目どうしの線は軸の上に引くので、at と into を書けない",mixedLine:"線は箱どうしか、節目どうしで引く",undeclaredRow:o=>`${o} という印の列は宣言していない`,undeclaredNote:o=>`${o} という箱か節目は宣言していない`,nowReserved:o=>`${o} は時間軸の図で針を進める行の語で、名札に使えない`,noteColorPointOnly:"note の color は節目の丸の色で、節目の note にだけ書ける",badShape:`shape は ${tn(Bi)} だけ書ける。括弧は shape を書かない`,badRatio:"物差しの線は分数 (2/3) か百分率 (97%) で書く",meterValue:o=>`${o} は物差しの欄なので、値を分数 (2/3) か百分率 (97%) で書く`}},zv=()=>{const n={sequence:"sequence <title>",architecture:"architecture <title>",group:"group <id> as <name> [note: <note>] through end",box:"box <id> as <name> [note: <caption>]",strip:"strip <title>: <field>, <field>",view:"sequence <title> [view: follow]",step:"step <step title>",say:"say <step body>",code:"code <command>",act:"act <id>: <action>",note:"note <id>: <caption>",set:"set <field>: <value> [tag: <tag>]"};return{noHead:`Write the diagram kind (${tn(Ci)}) and a title on the first line`,badHead:`Start the first line with ${Ci.join(" or ")}, followed by the title`,oldForm:(o,c)=>`${o} is the old notation. Write ${n[c]} instead`,unknownHead:o=>`A line cannot start with ${o}. Start a line with ${tn(Cd)}, or <id> -> <id>`,duplicate:o=>`${o} is already declared`,needsId:o=>`Write an id after ${o}`,badId:o=>`${o} cannot be an id. An id has no spaces and none of [ ] 「 」 = :`,afterId:"Write as <name> or attributes after the id",undeclaredBox:o=>`No box named ${o} is declared`,noBody:o=>`Step "${o}" needs a body (a say line)`,emptyStepTitle:"Write a title after step",noBoxes:"Declare at least one box",noSteps:"Write at least one step (a step line)",emptySay:"Write the step body after say, or on indented lines below it",sayTwice:"A step takes one say. Continue a long body on indented lines below it",codeTwice:"A step takes at most one code line",emptyCode:"Write the command after code",sourceShape:"Write a source as source <name> [url: <URL>]",declarationInStep:"Write group, box, strip, branch, scale, period, row, point and zoom before the first step",stepLineBeforeStep:"Write lines, say, code, source, act, note, set, commit, branch cuts, now, mark, span, leaf and node under a step",nestedGroup:"A group cannot hold another group. Close it with end first",strayEnd:"There is no group for this end to close",endTakesNothing:"Write nothing after end",unclosedGroup:o=>`group ${o} is not closed with end`,regionReopened:o=>`group ${o} is already declared. To open it again, write only group ${o}; put the name and attributes on the first one`,emptyName:o=>`${o} has an empty name`,stripTwice:"Declare only one strip",stripShape:"Write a strip as strip <title>: <field>, <field>",emptyStripField:"A strip field name is empty",stripUndeclared:"Declare the strip as strip <title>: <field>, <field> before writing set",noSuchField:o=>`The strip has no field named ${o}`,stripNeedsValue:"Write set as set <field>: <value> or set <field> [tag: <tag>]",actShape:"Write act as act <id>: <action>",noteShape:"Write note as note <id>: <caption>",edgeShape:"Write a line as <id> -> <id>: <label> [<attributes>]",emptyLabel:"Write the label after the : of a line, or leave out the : as well",quoteUnclosed:'A value that starts with " is not closed with "',afterQuote:'After a value closed with ", write only attributes or the next ,',attrUnclosed:"Start attributes with [, close them with ], and put them at the end of the line",attrNoColon:o=>`[${o}] cannot be read. Write an attribute as [<key>: <value>]`,attrNoValue:o=>`Write a value after ${o}:`,attrTwice:o=>`Write ${o} only once on a line`,badAttr:(o,c)=>`${o} cannot be written on this line. Write ${tn(c)}`,badColor:`color is one of ${tn(Ts)}`,badView:`view is one of ${tn(jd)}`,badCarry:`carry is one of ${tn(Bd)}. Write a tag as tag: <value>`,badSide:`side is one of ${tn(zd)}`,badUrl:o=>`Write a path that starts with / or a URL that starts with http:// or https:// for ${o}`,carryTwice:"A line carries one thing. Do not write carry and tag together",reservedId:o=>`${o} names the start or end mark of a state diagram and cannot be a box id`,intoStart:"A line cannot go into start. start is the start mark, and lines leave it",outOfFinish:"A line cannot leave finish. finish is the end mark, and lines go into it",pathNoAttrs:"A line before the first step is a path not taken, so it takes no attributes (carry, tag, side)",gitOnly:o=>`${o} lines can be written only in git diagrams`,gitNoGroup:"A git diagram takes no group. Declare branches with branch lines",noBranches:"Declare at least one branch with a branch line",branchShape:"Write a branch as branch <id> [note: <note>]",commitShape:"Write a commit as commit <id> on <branch> [hash: <hash>, note: <note>]. For a replayed commit add copy <commit>, and for a merge commit add merge <branch>, after on <branch>",fromShape:"Write a branch cut as <branch> from <commit>",undeclaredBranch:o=>`No branch named ${o} is declared`,undeclaredRef:o=>`No branch named ${o} is declared. A line that moves a ref starts from a branch id or HEAD`,noCommit:o=>`No commit named ${o} has been made yet`,emptyBranch:o=>`Branch ${o} does not point at any commit yet, so it cannot be merged`,mergeSelf:o=>`${o} is the branch being committed to, so it cannot be the branch merged in`,headReserved:o=>`${o} names where you are in a git diagram and cannot be an id`,badHash:"Write a hash as 4 to 40 characters of 0-9 and a-f",timeOnly:o=>`${o} can be written only in time diagrams`,treeOnly:o=>`${o} lines can be written only in tree diagrams`,treeNoGroup:"A tree diagram takes no group. Write the tree boxes with leaf and node lines",noLeaves:"Write at least one leaf with a leaf line",leafShape:"Write a leaf as leaf <id> [hash: <hash>]",nodeShape:"Write a node as node <id> of <child>, <child> [hash: <hash>]",noTreeChild:o=>`No leaf or node named ${o} has been written yet. A child must be an id written earlier with leaf or node`,notTreeBox:o=>`${o} is a box from a box line, not a tree box. A child must be an id written with leaf or node`,twoParents:o=>`${o} is already a child of another node. A tree box has only one parent`,manyRoots:(o,c)=>`${o} is left without a parent. A tree has one root, so join ${o} and ${c} under one root by the end`,timeTwice:o=>`Declare only one ${o}`,noScale:"Declare the scale with a scale line",noRows:"Declare at least one row with a row line",scaleShape:"Write a scale as scale <unit> <length> <count> [from: <number>]",periodShape:"Write a period as period <name> <units> [from: <number>]",rowShape:"Write a row as row <id> as <name> [color: <color>, empty: <unit> <unit>]",pointShape:"Write a point as point <id> at <unit>",zoomShape:"Write a zoom as zoom <unit>-<unit>",nowShape:"Write a needle line as now -> <unit>",markShape:"Write a mark as mark <row> <unit>-<unit> [color: <color>]",spanShape:`Write a span as span <unit>-<unit>: <text> [shape: ${tn(Bi)}, color: <color>]`,badLength:`Write a length as a number and a unit (${tn(Z0)}), such as 12s`,badCount:o=>`The unit count of ${o} is a whole number of 1 or more`,badUnit:(o,c)=>`${o} cannot be a unit. Write a number from 0 to ${c-1}, or a range such as 0-3`,nowBack:(o,c)=>`now -> ${o} does not move the needle forward. Write a unit after the previous now (${c})`,outOfZoom:(o,c)=>`Pick a zoom column from units ${o} to ${c}`,noZoom:"at and into are allowed only on lines between boxes in a diagram that declares a zoom",boxNeedsZoom:"Boxes of a time diagram sit in the zoom band. Write the zoom range as zoom <unit>-<unit>",boxLineNeedsAt:"Write the column of a line between zoom boxes as [at: <unit>]",pointLineNoAt:"A line between points runs along the axis, so it takes no at or into",mixedLine:"Draw a line between two boxes or between two points",undeclaredRow:o=>`No row named ${o} is declared`,undeclaredNote:o=>`No box or point named ${o} is declared`,nowReserved:o=>`${o} starts the needle line of a time diagram and cannot be an id`,noteColorPointOnly:"The color of a note colors the circle of a point, so write it only on the note of a point",badShape:`shape takes only ${tn(Bi)}. A bracket takes no shape`,badRatio:"Write the meter line as a fraction (2/3) or a percentage (97%)",meterValue:o=>`${o} is a meter, so write its value as a fraction (2/3) or a percentage (97%)`}},Rv={ja:jv(),en:zv()},qv=n=>Rv[n],Km=n=>n.text===""||n.text.startsWith("//");function Fv(n,o){return n.column+Array.from(n.text.slice(0,o)).length}function Hv(n){return n.split(/\r?\n/).map((o,c)=>{const u=Array.from(o.slice(0,o.length-o.trimStart().length)).length;return{line:c+1,column:u+1,indent:u,text:o.trim()}})}var Fl=1;function Lv(n){if(typeof n!="object"||n===null)return;const o=n.version;return typeof o=="number"&&o>Fl?o:void 0}var Uv=(n,o)=>({pointer:"/version",message:H0[o].newer(n,Fl)});function qi(n,o={}){const c=Lv(n);if(c!==void 0)return{ok:!1,errors:[Uv(c,o.lang??"ja")]};const u=Bv(n,o);return u.ok?{ok:!0,diagram:n,warnings:[]}:u}var Rd=class extends Error{constructor(n,o,c){super(c),this.line=n,this.column=o}line;column},ce=(n,o,c)=>new Rd(n.line,Fv(n,o),c),vo=/^[^\s[\]「」=:]+$/u,Pv=/^([^\s:[\]]+?)\s*->\s*([^\s:[\]]+)/du,Gv=new RegExp(`^commit\\s+([^\\s[]+)(?:\\s+${Y0}\\s+([^\\s[]+))?(?:\\s+${V0}\\s+([^\\s[]+))?(?:\\s+${X0}\\s+([^\\s[]+))?`,"du"),Yv=new RegExp(`^([^\\s[]+)\\s+${Od}(?:\\s+([^\\s[]+))?\\s*$`,"du"),Vv=/^leaf\s+([^\s[]+)/du,Xv=new RegExp(`^node\\s+([^\\s[]+)\\s+${Q0}\\s+`,"du"),Wm=/^[0-9a-f]{4,40}$/u,Jv=/^(\/|https?:\/\/)/u,Qv=/^scale\s+(\S+)\s+(\S+)\s+([^\s[]+)/du,Zv=/^period\s+(\S+)\s+([^\s[]+)/du,Kv=new RegExp(`^point\\s+(\\S+)\\s+${J0}\\s+(\\S+)\\s*$`,"du"),Wv=/^zoom\s+(\S+)\s*$/du,Iv=new RegExp(`^${ql}\\s*->`,"u"),e1=new RegExp(`^${ql}\\s*->\\s*(\\S+)\\s*$`,"du"),t1=/^mark\s+([^\s[]+)\s+([^\s[]+)/du,n1=/^span\s+([^\s:[]+)\s*:/du,a1=/^[0-9]+(\.[0-9]+)?(ms|s|min|h|d)$/u,Im=/^([0-9]+\/[0-9]+|[0-9]+(\.[0-9]+)?%)$/u,e0=/^[1-9][0-9]*$/u,id=/^(0|[1-9][0-9]*)$/u,s1=/^(0|[1-9][0-9]*)(?:-(0|[1-9][0-9]*))?$/u,En=(n,o)=>n.includes(o);function Lt(n,o){let c=o;for(;c<n.length&&/\s/u.test(n[c]??"");)c++;return c}function wo(n,o,c){const u=n.text;let d="";for(let a=o+1;a<u.length;a++){const r=u[a]??"",l=u[a+1]??"";if(r==="\\"&&(l==='"'||l==="\\"))d+=l,a++;else{if(r==='"')return{value:d,end:a+1};d+=r}}throw ce(n,o,c.quoteUnclosed)}function Ns(n,o,c){const u=n.text,d=Lt(u,o);if(u[d]==='"'){const l=wo(n,d,c),f=Lt(u,l.end);if(f<u.length&&u[f]!=="[")throw ce(n,f,c.afterQuote);return{value:l.value,rest:f}}const a=u.indexOf("[",d),r=a<0?u.length:a;return{value:u.slice(d,r).trim(),rest:r}}function Zn(n,o,c,u){const d=n.text;if(!d.endsWith("]"))throw ce(n,o,u.attrUnclosed);const a=d.length-1,r=new Map;for(let l=o+1;;){const f=Lt(d,l);let p=f;for(;p<a&&d[p]!==":"&&d[p]!==",";)p++;if(p>=a||d[p]!==":")throw ce(n,f,u.attrNoColon(d.slice(f,p).trim()));const g=d.slice(f,p).trim();if(!c.includes(g))throw ce(n,f,u.badAttr(g,c));if(r.has(g))throw ce(n,f,u.attrTwice(g));let b=Lt(d,p+1),w;if(d[b]==='"'){const x=wo(n,b,u);if(w=x.value,b=Lt(d,x.end),b<a&&d[b]!==",")throw ce(n,b,u.afterQuote)}else{const x=d.indexOf(",",b),_=x<0||x>a?a:x;w=d.slice(b,_).trim(),b=_}if(w==="")throw ce(n,f,u.attrNoValue(g));if(r.set(g,{value:w,at:f}),b>=a)return r;l=b+1}}function o1(n,o,c){const u=n.text,d=[];for(let a=o;;){const r=Lt(u,a);let l,f;if(u[r]==='"'){const p=wo(n,r,c);if(l=p.value,f=Lt(u,p.end),f<u.length&&u[f]!==",")throw ce(n,f,c.afterQuote)}else{const p=u.indexOf(",",r);f=p<0?u.length:p,l=u.slice(r,f).trim()}if(l==="")throw ce(n,r,c.emptyStripField);if(d.push(l),f>=u.length)return d;a=f+1}}function tl(n,o,c,u){const d=n.text,a=Lt(d,o.length),r=/^[^\s[]+/u.exec(d.slice(a))?.[0];if(r===void 0)throw ce(n,0,u.needsId(o));if(!vo.test(r))throw ce(n,a,u.badId(r));let l=Lt(d,a+r.length),f;if(d.startsWith(el,l)&&/^(\s|$)/u.test(d.slice(l+el.length,l+el.length+1))){const g=Ns(n,l+el.length,u);if(g.value==="")throw ce(n,l,u.emptyName(r));f=g.value,l=g.rest}if(l<d.length&&d[l]!=="[")throw ce(n,l,u.afterId);const p=l<d.length?Zn(n,l,c,u):new Map;return{id:r,idAt:a,...f!==void 0?{name:f}:{},attrs:p}}function t0(n,o,c){const u=o.get("color");if(u&&!En(Ts,u.value))throw ce(n,u.at,c.badColor);const d=o.get("note")?.value,a=o.get("icon")?.value;return{...d!==void 0?{note:d}:{},...u?{color:u.value}:{},...a!==void 0?{icon:a}:{}}}function n0(n,o){const c=n.split(/\s/u)[0]??"";if(c==="帯")return{word:c,shape:o?"set":"strip"};if(Object.hasOwn(Zm,c))return{word:c,shape:Zm[c]};if(n.startsWith("#"))return{word:"#",shape:"step"};if(n.startsWith(">"))return{word:">",shape:"say"};if(n.startsWith("`"))return{word:"`",shape:"code"};if(n.includes("「"))return{word:"「」",shape:o?"note":"box"};if(/^[^\s=:]+\s*=(?!>)/u.test(n))return{word:"=",shape:"box"};if(o&&/^[^\s:]+\s*:/u.test(n))return{word:":",shape:"act"}}function i1(n,o){const c=n.findIndex(O=>!Km(O)),u=n[c];if(!u)throw new Rd(1,1,o.noHead);const d=u.text.split(/\s/u)[0]??"";if(!En(Ci,d)){const O=n0(u.text,!1);throw ce(u,0,O?o.oldForm(O.word,O.shape):o.badHead)}const a=Ns(u,d.length,o);if(a.value==="")throw ce(u,0,o.badHead);const r=a.value,l=a.rest<u.text.length?Zn(u,a.rest,ln.diagram,o).get("view"):void 0;if(l&&!En(jd,l.value))throw ce(u,l.at,o.badView);const f=l?.value,p=d==="state",g=d==="git",b=d==="time",w=d==="tree",x=new Map,_=new Map;let E,M;const N=[],$=[];let j;const G=[],K=[];let q=!1,U,z=0;const Q=[],re=new Set,ue=new Map,he=[],fe=[],Ce=[],$e=new Set;let C;const S=[];let F,Y;const oe=(O,B,I)=>{if($e.has(B))throw ce(O,I,o.duplicate(B));$e.add(B)},D=(O,B,I)=>{if(!fe.some(ge=>ge.id===B))throw ce(O,I,o.undeclaredBox(B));return B},T=(O,B,I)=>{if(!ue.has(B))throw ce(O,I,o.undeclaredBranch(B));return B},te=(O,B,I)=>{if(!re.has(B))throw ce(O,I,o.noCommit(B));return B},de=(O,B,I,ge)=>{if(g){if(ge==="to")return te(O,B,I);if(B!==ca&&!ue.has(B))throw ce(O,I,o.undeclaredRef(B));return B}if(b){if(!fe.some(we=>we.id===B)&&!$.some(we=>we.id===B))throw ce(O,I,o.undeclaredNote(B));return B}if(w&&x.has(B))return B;if(!p||!En(Oi,B))return D(O,B,I);if(B==="start"!=(ge==="from"))throw ce(O,I,B==="start"?o.intoStart:o.outOfFinish);return B},ve=(O,B,I)=>{if(p&&En(Oi,B))throw ce(O,I,o.reservedId(B));if(g&&B===ca)throw ce(O,I,o.headReserved(B));if(b&&B===ql)throw ce(O,I,o.nowReserved(B))},Se=O=>{if(!F)throw ce(O,0,o.stepLineBeforeStep);return F},Ne=O=>{if(F)throw ce(O,0,o.declarationInStep)},Ye=()=>{if(F){if(F.body===void 0)throw ce(F.source,0,o.noBody(F.title));S.push({title:F.title,body:F.body.join(`
`),...F.code!==void 0?{code:F.code}:{},...F.sources.length>0?{sources:F.sources}:{},events:F.events})}},Fe=n.slice(c+1);for(let O=0;O<Fe.length;O++){const B=Fe[O];if(!B||Km(B))continue;const I=B.text;if(b&&Iv.test(I)){Se(B).events.push(je(B));continue}const ge=Pv.exec(I);if(ge){p&&!F?Ce.push(Ft(B,ge)):Se(B).events.push(bt(B,ge));continue}const[we="",Oe]=I.split(/\s+/u);if(g&&ue.has(we)&&Oe===Od){Se(B).events.push(Xt(B));continue}if(!g&&(we==="branch"||we==="commit"))throw ce(B,0,o.gitOnly(we));if(!b&&En(P0,we))throw ce(B,0,o.timeOnly(we));if(!w&&En(G0,we))throw ce(B,0,o.treeOnly(we));if(!En(Cd,we)){const Te=n0(I,F!==void 0);throw ce(B,0,Te?o.oldForm(Te.word,Te.shape):o.unknownHead(we))}switch(we){case"group":Ut(B);break;case"end":if(I!==we)throw ce(B,we.length,o.endTakesNothing);if(!Y)throw ce(B,0,o.strayEnd);Y=void 0;break;case"box":rt(B);break;case"strip":pe(B);break;case"step":{if(Y)throw ce(Y.source,0,o.unclosedGroup(Y.id));V(),Ye();const Te=I.slice(we.length).trim();if(Te==="")throw ce(B,0,o.emptyStepTitle);F={source:B,title:Te,sources:[],events:[]};break}case"say":O=Je(B,O);break;case"code":{const Te=Se(B);if(Te.code!==void 0)throw ce(B,0,o.codeTwice);const ze=I.slice(we.length).trim();if(ze==="")throw ce(B,0,o.emptyCode);Te.code=ze;break}case"source":Se(B).sources.push(Vt(B));break;case"act":{const Te=Se(B),ze=Pe(B,we,o.actShape);Te.events.push({type:"action",box:ze.box,label:ze.text});break}case"note":{const Te=Se(B);if(b){Te.events.push(_t(B));break}const ze=Pe(B,we,o.noteShape);Te.events.push({type:"swap",box:ze.box,text:ze.text});break}case"set":Se(B).events.push(Fn(B));break;case"branch":sn(B);break;case"commit":{Se(B).events.push(qn(B));break}case"scale":Z(B);break;case"period":be(B);break;case"row":Be(B);break;case"point":Ae(B);break;case"zoom":_e(B);break;case"mark":Se(B).events.push(qe(B));break;case"span":Se(B).events.push(nt(B));break;case"leaf":{Se(B).events.push(yn(B));break}case"node":{Se(B).events.push(un(B));break}}}if(Y)throw ce(Y.source,0,o.unclosedGroup(Y.id));if(V(),Ye(),g&&Q.length===0)throw ce(u,0,o.noBranches);if(w&&x.size===0)throw ce(u,0,o.noLeaves);if(fe.length===0&&!g&&!b&&!w)throw ce(u,0,o.noBoxes);if(S.length===0)throw ce(u,0,o.noSteps);const ot=[...x.keys()].filter(O=>!_.has(O)),[X,L]=ot,Ee=L===void 0?void 0:x.get(L);if(X!==void 0&&L!==void 0&&Ee)throw ce(Ee.source,Ee.at,o.manyRoots(L,X));return{version:Fl,kind:d,title:r,...f?{view:f}:{},...he.length>0?{regions:he}:{},boxes:fe,...C?{strip:G.length>0?{...C,meters:G}:C}:{},steps:S,...d==="sequence"?{sequence:{lifelines:fe.map(O=>O.id)}}:{},...Ce.length>0?{state:{paths:Ce}}:{},...g?{git:{branches:Q}}:{},...b&&E?{time:{scale:E,...M?{period:M}:{},rows:N,...$.length>0?{points:$}:{},...j?{zoom:j}:{}}}:{}};function V(){if(!(!b||q)){if(q=!0,!E)throw ce(u,0,o.noScale);if(N.length===0)throw ce(u,0,o.noRows);for(const O of K)O();if(U&&!j)throw ce(U,0,o.boxNeedsZoom)}}function ye(){return E?.count??0}function k(O,B,I){if(!id.test(I)||Number(I)>=ye())throw ce(O,B,o.badUnit(I,ye()));return Number(I)}function W(O,B,I){const ge=s1.exec(I),we=Number(ge?.[1]),Oe=Number(ge?.[2]??ge?.[1]);if(!ge||we>Oe||Oe>=ye())throw ce(O,B,o.badUnit(I,ye()));return{from:we,to:Oe}}function Z(O){if(Ne(O),E)throw ce(O,0,o.timeTwice("scale"));const B=O.text,I=Qv.exec(B),ge=Ve=>I?.indices?.[Ve]?.[0]??0;if(!I)throw ce(O,0,o.scaleShape);const we=Lt(B,I[0].length);if(we<B.length&&B[we]!=="[")throw ce(O,we,o.scaleShape);const Oe=I[2]??"";if(!a1.test(Oe))throw ce(O,ge(2),o.badLength);const Te=I[3]??"";if(!e0.test(Te))throw ce(O,ge(3),o.badCount("scale"));const ze=we<B.length?Zn(O,we,ln.scale,o).get("from"):void 0;if(ze&&!id.test(ze.value))throw ce(O,ze.at,o.scaleShape);E={unit:I[1]??"",length:Oe,count:Number(Te),...ze?{from:Number(ze.value)}:{}}}function be(O){if(Ne(O),M)throw ce(O,0,o.timeTwice("period"));const B=O.text,I=Zv.exec(B);if(!I)throw ce(O,0,o.periodShape);const ge=Lt(B,I[0].length);if(ge<B.length&&B[ge]!=="[")throw ce(O,ge,o.periodShape);const we=I[2]??"";if(!e0.test(we))throw ce(O,I.indices?.[2]?.[0]??0,o.badCount("period"));const Oe=ge<B.length?Zn(O,ge,ln.period,o).get("from"):void 0;if(Oe&&!id.test(Oe.value))throw ce(O,Oe.at,o.periodShape);M={name:I[1]??"",length:Number(we),...Oe?{from:Number(Oe.value)}:{}}}function Be(O){Ne(O);const B=tl(O,"row",ln.row,o);if(ve(O,B.id,B.idAt),N.some(Oe=>Oe.id===B.id)||$.some(Oe=>Oe.id===B.id))throw ce(O,B.idAt,o.duplicate(B.id));const I=B.attrs.get("color");if(I&&!En(Ts,I.value))throw ce(O,I.at,o.badColor);const ge=B.attrs.get("empty"),we={id:B.id,name:B.name??B.id,...I?{color:I.value}:{}};if(N.push(we),ge){const Oe=ge.value.split(/\s+/u);we.empty=[],K.push(()=>{we.empty=Oe.map(Te=>k(O,ge.at,Te))})}}function Ae(O){Ne(O);const B=Kv.exec(O.text),I=B?.[1],ge=B?.[2];if(!B||I===void 0||ge===void 0)throw ce(O,0,o.pointShape);const we=B.indices?.[1]?.[0]??0,Oe=B.indices?.[2]?.[0]??0;if(!vo.test(I))throw ce(O,we,o.badId(I));if(ve(O,I,we),N.some(ze=>ze.id===I))throw ce(O,we,o.duplicate(I));oe(O,I,we);const Te={id:I,at:0};$.push(Te),K.push(()=>{Te.at=k(O,Oe,ge)})}function _e(O){if(Ne(O),j)throw ce(O,0,o.timeTwice("zoom"));const B=Wv.exec(O.text),I=B?.[1];if(!B||I===void 0)throw ce(O,0,o.zoomShape);const ge=B.indices?.[1]?.[0]??0,we={from:0,to:0};j=we,K.push(()=>{Object.assign(we,W(O,ge,I))})}function je(O){const B=e1.exec(O.text),I=B?.[1];if(!B||I===void 0)throw ce(O,0,o.nowShape);const ge=B.indices?.[1]?.[0]??0,we=k(O,ge,I);if(we+1<=z)throw ce(O,ge,o.nowBack(I,z-1));return z=we+1,{type:"now",to:we}}function qe(O){const B=O.text,I=t1.exec(B),ge=I?.[1],we=I?.[2];if(!I||ge===void 0||we===void 0)throw ce(O,0,o.markShape);if(!N.some(ft=>ft.id===ge))throw ce(O,I.indices?.[1]?.[0]??0,o.undeclaredRow(ge));const{from:Oe,to:Te}=W(O,I.indices?.[2]?.[0]??0,we),ze=Lt(B,I[0].length);if(ze>=B.length||B[ze]!=="[")throw ce(O,ze,o.markShape);const Ve=Zn(O,ze,ln.mark,o).get("color");if(!Ve)throw ce(O,ze,o.markShape);if(!En(Ts,Ve.value))throw ce(O,Ve.at,o.badColor);return{type:"mark",row:ge,from:Oe,to:Te,color:Ve.value}}function nt(O){const B=n1.exec(O.text),I=B?.[1];if(!B||I===void 0)throw ce(O,0,o.spanShape);const{from:ge,to:we}=W(O,B.indices?.[1]?.[0]??0,I),Oe=Ns(O,B[0].length,o);if(Oe.value==="")throw ce(O,0,o.spanShape);const Te=Oe.rest<O.text.length?Zn(O,Oe.rest,ln.span,o):new Map,ze=Te.get("shape");if(ze&&!En(Bi,ze.value))throw ce(O,ze.at,o.badShape);const Ve=Te.get("color");if(Ve&&!En(Ts,Ve.value))throw ce(O,Ve.at,o.badColor);return{type:"span",from:ge,to:we,text:Oe.value,...ze?{shape:"box"}:{},...Ve?{color:Ve.value}:{}}}function _t(O){const B=/^note\s+([^\s:]+)\s*:/du.exec(O.text),I=B?.[1];if(!B||I===void 0)throw ce(O,0,o.noteShape);const ge=B.indices?.[1]?.[0]??0,we=$.some(ze=>ze.id===I);if(!we&&!fe.some(ze=>ze.id===I))throw ce(O,ge,o.undeclaredNote(I));const Oe=Ns(O,B[0].length,o);if(Oe.value==="")throw ce(O,0,o.noteShape);const Te=Oe.rest<O.text.length?Zn(O,Oe.rest,ln.note,o).get("color"):void 0;if(Te&&!we)throw ce(O,Te.at,o.noteColorPointOnly);if(Te&&!En(Ts,Te.value))throw ce(O,Te.at,o.badColor);return{type:"swap",box:I,text:Oe.value,...Te?{color:Te.value}:{}}}function Ut(O){if(Ne(O),g)throw ce(O,0,o.gitNoGroup);if(w)throw ce(O,0,o.treeNoGroup);if(Y)throw ce(O,0,o.nestedGroup);const B=tl(O,"group",ln.group,o);if(he.some(I=>I.id===B.id)){if(B.name!==void 0||B.attrs.size>0)throw ce(O,0,o.regionReopened(B.id))}else ve(O,B.id,B.idAt),oe(O,B.id,B.idAt),he.push({id:B.id,name:B.name??B.id,...t0(O,B.attrs,o)});Y={source:O,id:B.id}}function rt(O){Ne(O);const B=tl(O,"box",ln.box,o);ve(O,B.id,B.idAt),oe(O,B.id,B.idAt),U??=O;const{note:I,...ge}=t0(O,B.attrs,o),we=B.attrs.get("link");fe.push({id:B.id,name:B.name??B.id,...I!==void 0?{sub:I}:{},...ge,...Y?{region:Y.id}:{},...we?{link:Zt(O,"link",we)}:{}})}function Vt(O){const B=Ns(O,6,o),I=B.rest<O.text.length?Zn(O,B.rest,ln.source,o).get("url"):void 0;if(B.value===""||!I)throw ce(O,0,o.sourceShape);return{name:B.value,url:Zt(O,"url",I)}}function Zt(O,B,I){if(!Jv.test(I.value))throw ce(O,I.at,o.badUrl(B));return I.value}function sn(O){Ne(O);const B=tl(O,"branch",ln.branch,o);if(B.name!==void 0)throw ce(O,0,o.branchShape);ve(O,B.id,B.idAt),oe(O,B.id,B.idAt);const I=B.attrs.get("note")?.value;Q.push({id:B.id,...I!==void 0?{note:I}:{}}),ue.set(B.id,null)}function qn(O){const B=O.text,I=Gv.exec(B),ge=bn=>I?.indices?.[bn]?.[0]??0,we=I?.[1],Oe=I?.[2];if(!I||we===void 0||Oe===void 0)throw ce(O,0,o.commitShape);const Te=Lt(B,I[0].length);if(Te<B.length&&B[Te]!=="[")throw ce(O,Te,o.commitShape);if(!vo.test(we))throw ce(O,ge(1),o.badId(we));ve(O,we,ge(1)),oe(O,we,ge(1));const ze=T(O,Oe,ge(2)),Ve=I[3]===void 0?void 0:te(O,I[3],ge(3)),ft=I[4]===void 0?void 0:cn(O,I[4],ge(4),ze),nn=Te<B.length?Zn(O,Te,ln.commit,o):new Map,kt=nn.get("hash");if(kt&&!Wm.test(kt.value))throw ce(O,kt.at,o.badHash);const mt=nn.get("note")?.value;return re.add(we),Ve===void 0&&ue.set(ze,we),{type:"commit",id:we,branch:ze,...Ve!==void 0?{copy:Ve}:{},...ft!==void 0?{merge:ft}:{},...kt?{hash:kt.value}:{},...mt!==void 0?{note:mt}:{}}}function cn(O,B,I,ge){if(T(O,B,I),B===ge)throw ce(O,I,o.mergeSelf(B));if(ue.get(B)===null)throw ce(O,I,o.emptyBranch(B));return B}function Xt(O){const B=Yv.exec(O.text),I=B?.[1],ge=B?.[2];if(!B||I===void 0||ge===void 0)throw ce(O,0,o.fromShape);return te(O,ge,B.indices?.[2]?.[0]??0),ue.set(I,ge),{type:"branch",branch:I,from:ge}}function yn(O){const B=O.text,I=Vv.exec(B),ge=I?.[1];if(!I||ge===void 0)throw ce(O,0,o.leafShape);const we=I.indices?.[1]?.[0]??0;if(!vo.test(ge))throw ce(O,we,o.badId(ge));oe(O,ge,we),x.set(ge,{source:O,at:we});const Oe=Lt(B,I[0].length);if(Oe<B.length&&B[Oe]!=="[")throw ce(O,Oe,o.leafShape);const Te=R(O,Oe,ln.leaf);return{type:"leaf",id:ge,...Te!==void 0?{hash:Te}:{}}}function un(O){const B=O.text,I=Xv.exec(B),ge=I?.[1];if(!I||ge===void 0)throw ce(O,0,o.nodeShape);const we=I.indices?.[1]?.[0]??0;if(!vo.test(ge))throw ce(O,we,o.badId(ge));oe(O,ge,we);const Oe=[];let Te=I[0].length;for(;;){const Ve=Lt(B,Te);for(Te=Ve;Te<B.length&&B[Te]!==","&&B[Te]!=="[";)Te++;const ft=B.slice(Ve,Te).trim();if(ft===""||!vo.test(ft))throw ce(O,Ve,o.nodeShape);if(!x.has(ft))throw ce(O,Ve,$e.has(ft)&&ft!==ge?o.notTreeBox(ft):o.noTreeChild(ft));if(_.has(ft))throw ce(O,Ve,o.twoParents(ft));if(_.set(ft,ge),Oe.push(ft),B[Te]!==",")break;Te++}const ze=R(O,Te,ln.node);return x.set(ge,{source:O,at:we}),{type:"node",id:ge,children:Oe,...ze!==void 0?{hash:ze}:{}}}function R(O,B,I){if(B>=O.text.length)return;const ge=Zn(O,B,I,o).get("hash");if(ge&&!Wm.test(ge.value))throw ce(O,ge.at,o.badHash);return ge?.value}function pe(O){if(Ne(O),C)throw ce(O,0,o.stripTwice);const B=O.text,I=Lt(B,5);let ge,we;if(B[I]==='"'){const ze=wo(O,I,o);ge=ze.value,we=Lt(B,ze.end)}else we=B.indexOf(":",I),ge=we<0?"":B.slice(I,we).trim();if(ge===""||B[we]!==":")throw ce(O,0,o.stripShape);if(b){C={title:ge,fields:De(O,we+1)};return}const Oe=o1(O,we+1,o),Te=/\[\s*meter\s*:/u.exec(B);if(Te&&Oe.some(ze=>/\[\s*meter\s*:[^\]]*\]$/u.test(ze)))throw ce(O,Te.index+1,o.timeOnly("meter"));C={title:ge,fields:Oe}}function De(O,B){const I=O.text,ge=[];for(let we=B;;){const Oe=Lt(I,we);let Te,ze;if(I[Oe]==='"'){const Ve=wo(O,Oe,o);Te=Ve.value,ze=Lt(I,Ve.end)}else{for(ze=Oe;ze<I.length&&I[ze]!==","&&I[ze]!=="[";)ze++;Te=I.slice(Oe,ze).trim()}if(Te==="")throw ce(O,Oe,o.emptyStripField);if(I[ze]==="["){const Ve=I.indexOf("]",ze);if(Ve<0)throw ce(O,ze,o.attrUnclosed);const ft=I.slice(ze+1,Ve),nn=/^\s*([a-z]*)\s*:\s*(.*?)\s*$/u.exec(ft);if(!nn)throw ce(O,ze+1,o.attrNoColon(ft.trim()));const kt=nn[1]??"";if(!ln.strip.includes(kt))throw ce(O,ze+1,o.badAttr(kt,ln.strip));if(!Im.test(nn[2]??""))throw ce(O,ze+1,o.badRatio);G.push({field:Te,line:nn[2]??""}),ze=Lt(I,Ve+1)}if(ze<I.length&&I[ze]!==",")throw ce(O,ze,o.afterQuote);if(ge.push(Te),ze>=I.length)return ge;we=ze+1}}function Je(O,B){const I=Se(O);if(I.body!==void 0)throw ce(O,0,o.sayTwice);const ge=O.text.slice(3).trim(),we=ge===""?[]:[ge];let Oe=0,Te=B;for(let ze=B+1;ze<Fe.length;ze++){const Ve=Fe[ze];if(!Ve)break;if(Ve.text===""){Oe++;continue}if(Ve.indent<=O.indent)break;we.push(...Array.from({length:Oe},()=>""),Ve.text),Oe=0,Te=ze}if(we.length===0)throw ce(O,0,o.emptySay);return I.body=we,Te}function Pe(O,B,I){const ge=new RegExp(`^${B}\\s+([^\\s:]+)\\s*:\\s*(.*)$`,"du").exec(O.text),we=ge?.indices?.[1]?.[0];if(!ge||we===void 0||(ge[2]??"")==="")throw ce(O,0,I);return{box:D(O,ge[1]??"",we),text:ge[2]??""}}function We(O,B){const I=O.text,ge=de(O,B[1]??"",B.indices?.[1]?.[0]??0,"from"),we=de(O,B[2]??"",B.indices?.[2]?.[0]??0,"to"),Oe=Lt(I,B[0].length);if(I[Oe]!==":")return{from:ge,to:we,at:Oe};const Te=Ns(O,Oe+1,o);if(Te.value==="")throw ce(O,Oe,o.emptyLabel);return{from:ge,to:we,label:Te.value,at:Te.rest}}function Ft(O,B){const{from:I,to:ge,label:we,at:Oe}=We(O,B);if(Oe<O.text.length)throw ce(O,Oe,O.text[Oe]==="["?o.pathNoAttrs:o.edgeShape);return{from:I,to:ge,...we!==void 0?{label:we}:{}}}function bt(O,B){const I=O.text,{from:ge,to:we,label:Oe,at:Te}=We(O,B);if(Te<I.length&&I[Te]!=="[")throw ce(O,Te,o.edgeShape);const ze=Te<I.length?Zn(O,Te,ln.edge,o):new Map,Ve=ze.get("tag"),ft=ze.get("carry");if(Ve&&ft)throw ce(O,Math.max(Ve.at,ft.at),o.carryTwice);if(ft&&!En(Bd,ft.value))throw ce(O,ft.at,o.badCarry);const nn=ze.get("side");if(nn&&!En(zd,nn.value))throw ce(O,nn.at,o.badSide);const kt=zt(O,ge,we,ze,Te);let mt=g?{kind:"tag",text:ge}:{kind:"envelope"};return Ve?mt={kind:"tag",text:Ve.value}:ft&&(mt=ft.value==="coin"?{kind:"coin"}:{kind:"none"}),g&&ge!==ca&&ue.set(ge,we),{type:"edge",from:ge,to:we,...Oe!==void 0?{label:Oe}:{},carry:mt,...nn?{labelSide:nn.value}:{},...kt}}function zt(O,B,I,ge,we){const Te=gv.flatMap(kt=>{const mt=ge.get(kt);return mt?[{key:kt,attr:mt}]:[]})[0];if(!b){if(Te)throw ce(O,Te.attr.at,o.timeOnly(Te.key));return{}}const ze=kt=>fe.some(mt=>mt.id===kt);if(ze(B)!==ze(I))throw ce(O,0,o.mixedLine);if(!ze(B)){if(Te)throw ce(O,Te.attr.at,j?o.pointLineNoAt:o.noZoom);return{}}const Ve=kt=>{if(!kt)return;const mt=k(O,kt.at,kt.value);if(!j||mt<j.from||mt>j.to)throw ce(O,kt.at,j?o.outOfZoom(j.from,j.to):o.noZoom);return mt},ft=Ve(ge.get("at"));if(ft===void 0)throw ce(O,we,o.boxLineNeedsAt);const nn=Ve(ge.get("into"));return{at:ft,...nn!==void 0?{into:nn}:{}}}function Fn(O){const B=C;if(!B)throw ce(O,0,o.stripUndeclared);const I=O.text,ge=Lt(I,3);let we,Oe;if(I[ge]==='"'){const Ve=wo(O,ge,o);we=Ve.value,Oe=Lt(I,Ve.end)}else{for(Oe=ge;Oe<I.length&&I[Oe]!==":"&&I[Oe]!=="[";)Oe++;we=I.slice(ge,Oe).trim()}if(!B.fields.includes(we))throw ce(O,ge,o.noSuchField(we));let Te;if(I[Oe]===":"){const Ve=Ns(O,Oe+1,o);if(Ve.value==="")throw ce(O,Oe,o.stripNeedsValue);Te=Ve.value,Oe=Ve.rest}if(Oe<I.length&&I[Oe]!=="[")throw ce(O,Oe,o.stripNeedsValue);const ze=Oe<I.length?Zn(O,Oe,ln.set,o).get("tag")?.value:void 0;if(Te===void 0&&ze===void 0)throw ce(O,0,o.stripNeedsValue);if(Te!==void 0&&G.some(Ve=>Ve.field===we)&&!Im.test(Te))throw ce(O,ge,o.meterValue(we));return{type:"strip",field:we,...Te!==void 0?{value:Te}:{},...ze!==void 0?{tag:ze}:{}}}}function ls(n,o={}){try{return{ok:!0,diagram:i1(Hv(n),qv(o.lang??"ja"))}}catch(c){if(!(c instanceof Rd))throw c;return{ok:!1,errors:[{line:c.line,column:c.column,message:c.message}]}}}var Hl=n=>`"${n.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`,Ms=n=>n.includes("[")||n.startsWith('"')?Hl(n):n,W0=n=>n.includes(":")||n.includes("[")||n.startsWith('"')?Hl(n):n,r1=(n,o)=>n.includes(",")||n.startsWith('"')||o&&n.includes("[")?Hl(n):n,l1=n=>n.includes(",")||n.includes("]")||n.startsWith('"')?Hl(n):n,gn=n=>{const o=n.filter(c=>c[1]!==void 0);return o.length===0?"":` [${o.map(([c,u])=>`${c}: ${l1(u)}`).join(", ")}]`},qd=(n,o)=>o===n?"":` as ${Ms(o)}`,a0=n=>`group ${n.id}${qd(n.id,n.name)}${gn([["note",n.note],["color",n.color],["icon",n.icon]])}`,c1=n=>`box ${n.id}${qd(n.id,n.name)}${gn([["note",n.sub],["color",n.color],["icon",n.icon],["link",n.link]])}`,I0=(n,o,c)=>`${n} -> ${o}${c===void 0?"":`: ${Ms(c)}`}`,wd=(n,o)=>n===o?`${n}`:`${n}-${o}`,Ml=n=>n===void 0?void 0:`${n}`;function u1(n,o){switch(n.type){case"edge":{const u=(o==="git"?n.carry.kind==="tag"&&n.carry.text===n.from:n.carry.kind==="envelope")?[]:n.carry.kind==="tag"?[["tag",n.carry.text]]:[["carry",n.carry.kind]];return`${I0(n.from,n.to,n.label)}${gn([...u,["side",n.labelSide],["at",Ml(n.at)],["into",Ml(n.into)]])}`}case"action":return`act ${n.box}: ${n.label}`;case"swap":return o==="time"?`note ${n.box}: ${Ms(n.text)}${gn([["color",n.color]])}`:`note ${n.box}: ${n.text}`;case"now":return`${ql} -> ${n.to}`;case"mark":return`mark ${n.row} ${wd(n.from,n.to)}${gn([["color",n.color]])}`;case"span":return`span ${wd(n.from,n.to)}: ${Ms(n.text)}${gn([["shape",n.shape],["color",n.color]])}`;case"strip":return`set ${W0(n.field)}${n.value===void 0?"":`: ${Ms(n.value)}`}${gn([["tag",n.tag]])}`;case"commit":return`commit ${n.id} ${Y0} ${n.branch}${n.copy===void 0?"":` ${V0} ${n.copy}`}${n.merge===void 0?"":` ${X0} ${n.merge}`}${gn([["hash",n.hash],["note",n.note]])}`;case"branch":return`${n.branch} ${Od} ${n.from}`;case"leaf":return`leaf ${n.id}${gn([["hash",n.hash]])}`;case"node":return`node ${n.id} ${Q0} ${n.children.join(", ")}${gn([["hash",n.hash]])}`}}function d1(n){const o=[`scale ${n.scale.unit} ${n.scale.length} ${n.scale.count}${gn([["from",Ml(n.scale.from)]])}`,...n.period?[`period ${n.period.name} ${n.period.length}${gn([["from",Ml(n.period.from)]])}`]:[]],c=n.rows.map(d=>`row ${d.id}${qd(d.id,d.name)}${gn([["color",d.color],["empty",d.empty&&d.empty.length>0?d.empty.join(" "):void 0]])}`),u=(n.points??[]).map(d=>`point ${d.id} ${J0} ${d.at}`);return[o.join(`
`),c.join(`
`),...u.length>0?[u.join(`
`)]:[],...n.zoom?[`zoom ${wd(n.zoom.from,n.zoom.to)}`]:[]]}function h1(n){const o=n.regions??[],c=[];for(const l of n.boxes){const f=c.at(-1);f&&f.region===l.region?f.boxes.push(l):c.push({...l.region!==void 0?{region:l.region}:{},boxes:[l]})}const u=[...new Set(c.flatMap(l=>l.region===void 0?[]:[l.region]))],d=u.length===o.length&&u.every((l,f)=>o[f]?.id===l),a=new Set,r=[];if(!d)for(const l of o)r.push(`${a0(l)}
end`),a.add(l.id);for(const l of c){const f=l.boxes.map(c1);if(l.region===void 0){r.push(f.join(`
`));continue}const p=o.find(b=>b.id===l.region),g=a.has(l.region)||!p?`group ${l.region}`:a0(p);a.add(l.region),r.push([g,...f.map(b=>`  ${b}`),"end"].join(`
`))}return r}function ji(n){const o=(n.git?.branches??[]).map(d=>`branch ${d.id}${gn([["note",d.note]])}`),c=n.kind==="time",u=[`${n.kind} ${Ms(n.title)}${gn([["view",n.view]])}`,...o.length>0?[o.join(`
`)]:[],...n.time?d1(n.time):[],...h1(n)];if(n.strip){const d=new Map((n.strip.meters??[]).map(r=>[r.field,r.line])),a=n.strip.fields.map(r=>`${r1(r,c)}${gn([["meter",d.get(r)]])}`);u.push(`strip ${W0(n.strip.title)}: ${a.join(", ")}`)}n.state&&u.push(n.state.paths.map(d=>I0(d.from,d.to,d.label)).join(`
`));for(const d of n.steps){const a=d.body.split(`
`),r=a.length===1?[`  say ${d.body}`]:["  say",...a.map(l=>l===""?"":`    ${l}`)];u.push([`step ${d.title}`,...r,...d.code===void 0?[]:[`  code ${d.code}`],...(d.sources??[]).map(l=>`  source ${Ms(l.name)}${gn([["url",l.url]])}`),...d.events.map(l=>`  ${u1(l,n.kind)}`)].join(`
`))}return`${u.join(`

`)}
`}var zi={sans:"Noto Sans JP Variable",mono:"JetBrains Mono Variable"},p1={0:590,1:590,2:590,3:590,4:590,5:590,6:590,7:590,8:590,9:590," ":228,"!":371,'"':575,"#":590,$:590,"%":963,"&":740,"'":325,"(":378,")":378,"*":507,"+":590,",":325,"-":371,".":325,"/":390,":":325,";":325,"<":590,"=":590,">":590,"?":514,"@":1007,A:642,B:682,C:657,D:715,E:616,F:586,G:718,H:758,I:330,J:568,K:686,L:579,M:854,N:750,O:771,P:668,Q:771,R:682,S:624,T:626,U:748,V:619,W:915,X:627,Y:581,Z:614,"[":378,"\\":390,"]":378,"^":590,_:568,"`":626,a:591,b:644,c:528,d:645,e:581,f:372,g:598,h:640,i:305,j:306,k:605,l:315,m:964,n:641,o:626,p:645,q:645,r:437,s:495,t:421,u:638,v:576,w:863,x:562,y:575,z:512,"{":378,"|":297,"}":378,"~":590,"…":1e3,"−":590,"×":1e3,"→":1e3,"←":1e3,"↑":1e3,"↓":1e3,"–":545,"—":908,"‘":325,"’":325,"“":575,"”":575,"°":404,"±":1e3,"·":593,"•":379},f1=600,m1=11904,kd=1e3;function g1(n,o){return(n.codePointAt(0)??0)>=m1?kd:o==="mono"?f1:p1[n]??kd}var y1={clear:{name:"澄んだ色",note:"白い地に、中くらいの明るさの鮮やかな 6 色。今の見本帳の色",light:{page:"#f3f4f7",bg:"#ffffff",surf:"#ffffff",sunk:"#f5f6f8",ink:"#12141a",ink2:"#3f4451",mute:"#6b7180",hair:"#12141a1c",line:"#12141a40",sh:"#101828","on-c":"#ffffff","c-blue":"#467deb","t-blue":"#2e62ce","c-amber":"#d28008","t-amber":"#975b04","c-green":"#0ea886","t-green":"#07775e","c-violet":"#6c3bb2","t-violet":"#6c3bb2","c-rose":"#ba3e40","t-rose":"#b83c3f","c-slate":"#5d6677","t-slate":"#5d6677",coin:"#e9b114",coint:"#856300",coinin:"#a8740c",tint:"5%",edge:"20%",shA:".05",shB:".08",carry:"#65686f"},dark:{page:"#08090c",bg:"#0d0e12",surf:"#17191f",sunk:"#121419",ink:"#eceef3",ink2:"#c4c8d2",mute:"#9198a6",hair:"#eceef31f",line:"#eceef340",sh:"#000000","on-c":"#0d0e12","c-blue":"#7e7ef6","t-blue":"#989cfd","c-amber":"#c78135","t-amber":"#dd954b","c-green":"#20ac7a","t-green":"#35b986","c-violet":"#695b9f","t-violet":"#a79ae3","c-rose":"#bc434b","t-rose":"#fd7d81","c-slate":"#9ba3b2","t-slate":"#9da5b4",coin:"#f0c040",coint:"#f0c040",coinin:"#9a6a0c",tint:"6%",edge:"19%",shA:".45",shB:".35"}},paper:{name:"紙と墨",note:"生成りの紙の地に、藍 / 黄土 / 苔 / 葡萄 / 朱 / 鈍のくすんだ 6 色",light:{page:"#ece7dd",bg:"#f9f6f0",surf:"#fffcf6",sunk:"#f2ede4",ink:"#221e18",ink2:"#4b453b",mute:"#7b7366",hair:"#221e181f",line:"#221e1847",sh:"#3a2a10","on-c":"#fffcf6","c-blue":"#487dd5","t-blue":"#2d60b5","c-amber":"#c38405","t-amber":"#885a01","c-green":"#57a271","t-green":"#237143","c-violet":"#904698","t-violet":"#904698","c-rose":"#a9513e","t-rose":"#9f4836","c-slate":"#6a645a","t-slate":"#696359",coin:"#d4a52a",coint:"#7d5e05",coinin:"#9a7016",tint:"6%",edge:"22%",shA:".06",shB:".07",carry:"#68635c"},dark:{page:"#0e0d0b",bg:"#15130f",surf:"#1e1b17",sunk:"#191612",ink:"#ede6d8",ink2:"#cbc2b1",mute:"#9c9283",hair:"#ede6d81f",line:"#ede6d842",sh:"#000000","on-c":"#15130f","c-blue":"#5785d5","t-blue":"#76a6f9","c-amber":"#be8802","t-amber":"#d59e2f","c-green":"#52aa71","t-green":"#61b87e","c-violet":"#90529b","t-violet":"#d08edb","c-rose":"#bb4e3d","t-rose":"#f98672","c-slate":"#a9a295","t-slate":"#aca598",coin:"#dcb24e",coint:"#dcb24e",coinin:"#8a6a14",tint:"6%",edge:"19%",shA:".45",shB:".35"}},night:{name:"夜の計器",note:"青みの黒の地に、光る水色 / 琥珀 / 若緑 / 菫 / 桃 の 6 色。明るい側は青灰の地",light:{page:"#e9eef5",bg:"#f6f9fc",surf:"#ffffff",sunk:"#eef3f8",ink:"#0b1424",ink2:"#34425a",mute:"#64748b",hair:"#0b14241c",line:"#0b142440",sh:"#0b1424","on-c":"#ffffff","c-blue":"#0385cd","t-blue":"#086aa3","c-amber":"#ba8e0f","t-amber":"#7f5f04","c-green":"#0a8857","t-green":"#027449","c-violet":"#5839ba","t-violet":"#5839ba","c-rose":"#dd4a94","t-rose":"#b82375","c-slate":"#64748b","t-slate":"#56667c",coin:"#eab308",coint:"#7e6005",coinin:"#a16207",tint:"5%",edge:"22%",shA:".06",shB:".09",carry:"#596579"},dark:{page:"#060a12",bg:"#0a101c",surf:"#111a2a",sunk:"#0d1522",ink:"#e6edf7",ink2:"#b8c4d6",mute:"#8090a8",hair:"#e6edf71c",line:"#9fb3d145",sh:"#000000","on-c":"#0a101c","c-blue":"#3884b6","t-blue":"#62ace1","c-amber":"#be8533","t-amber":"#d59b4b","c-green":"#3ba774","t-green":"#4fb884","c-violet":"#7d4ecd","t-violet":"#b494fd","c-rose":"#bc3a74","t-rose":"#ff77ad","c-slate":"#96a3b5","t-slate":"#99a6b8",coin:"#facc15",coint:"#facc15",coinin:"#a16207",tint:"6%",edge:"19%",shA:".5",shB:".4"}}},Cl="paper",Ta=Object.fromEntries(Object.entries(y1).map(([n,o])=>[n,{id:n,...o}]));function Fd(n){return(n!==void 0&&Object.hasOwn(Ta,n)?Ta[n]:void 0)??Ta[Cl]}var b1=["page","bg","surf","sunk","ink","ink2","mute","hair","line","sh","on-c","c-blue","t-blue","c-amber","t-amber","c-green","t-green","c-violet","t-violet","c-rose","t-rose","c-slate","t-slate","coin","coint","coinin","tint","edge","shA","shB","carry"],v1=new Set(b1),x1=n=>v1.has(n);function w1(n){if(typeof n!="string"||!/^[\w\s#%.,()/+-]+$/u.test(n)||/url\(/iu.test(n))return!1;let o=0;for(const c of n)if(o+=c==="("?1:c===")"?-1:0,o<0)return!1;return o===0}function eg(n,o){return Object.entries(n[o]).map(([c,u])=>`--${c}:${u}`).join(";")}var tg=`--sans:"${zi.sans}";--mono:"${zi.mono}"`,Eo=["blue","amber","green","violet","rose"],it=(n,o,c="sans")=>({size:n,weight:o,family:c}),ne={boxName:it(13,650),boxSub:it(11,500),boxSubStrong:it(11,700),regionName:it(12.5,700),regionNote:it(11,500),label:it(11,600,"mono"),labelJa:it(11,650),action:it(11,650),badge:it(10.5,700,"mono"),carrier:it(10.5,700,"mono"),carrierJa:it(10.5,700),stripTitle:it(12.5,700),fieldName:it(10.5,600),fieldValue:it(12,600,"mono"),fieldValueJa:it(12,600),tag:it(10.5,700),miniTitle:it(10.5,700),stepTitle:it(15,700),stepBody:it(13.5,500),stepNo:it(13,700,"mono"),button:it(14,700),gitId:it(11,700),gitHash:it(10.5,600,"mono"),gitNote:it(10.5,650),treeHash:it(13.5,700,"mono"),treeName:it(10.5,600),rootHash:it(15,700,"mono"),rootName:it(11,700),treeCard:it(11.5,650),timeHead:it(11,650,"mono"),timeRow:it(11,600),timeTick:it(10.5,600,"mono"),timePeriod:it(11.5,650),timeRange:it(10.5,500,"mono"),pointName:it(11,700,"mono"),pointState:it(11.5,700),spanText:it(11,650),emptyText:it(11,700),meterLine:it(10.5,700,"mono")},P={gap:10,margin:14,box:{h:72,minW:92,padX:12,radius:12,icon:24,iconRadius:7,iconY:-16,iconScale:.74,nameY:12,subY:27},region:{pad:18,gap:10,radius:14,inset:14,icon:24,iconRadius:7,iconScale:.68,nameY:58,line:16,minH:108},architecture:{columns:4,columnGap:56,maxColumnGap:160,rowGap:44,labelRoom:16},sequence:{columnGap:40,labelRoom:16,labelOffset:16,firstRow:10,rowGap:6,stepGap:6,minPitch:32,tail:10,selfW:34,selfH:18},state:{columns:4,columnGap:64,rowGap:108,labelRoom:16,start:7,end:{r:9,inner:5},drop:56,below:64,beside:38,text:16,loop:{w:24,h:34,samples:12,badgeAt:.6},side:{pad:16,gap:76,lane:30,entry:28},ghost:{h:52,pad:12,gap:10,nameY:-2,subY:14},done:{r:6.5,inset:13},pastLabel:.85},git:{x0:120,pitch:90,textGap:12,r:12,orphan:13.5,topLine:120,line:90,topBelow:30,below:82,bare:62,above:18,under:27,lineStep:13,tagTop:58,tag:30,row:22,turn:60,samples:12,boxGap:24,labelUnder:50,colors:["blue","violet","green","amber","rose"]},tree:{w:74,h:44,padX:10,radius:10,root:{w:112,h:54,radius:13,iconX:10,textX:46,padR:14,nameY:-4,hashY:14},hashY:-1,nameY:14,oneY:4.5,slotGap:12,top:16,row:102,card:{drop:78,h:30,minW:70,padX:10,icon:12,gap:6,glyph:.62,radius:9},boxGap:24,badgeAlong:22,faint:.42,color:"violet",rootColor:"green"},time:{width:728,axisX:118,right:16,gutterGap:12,head:22,boxTop:34,boxGap:36,zoomBottom:14,sep:12,zoomGap:12,rowsTop:24,row:20,rowGap:6,markRatio:.5,markMin:1.5,markMax:18,markRadius:1.5,shade:8,frame:2.5,emptyR:1.7,point:{drop:40,r:9,text:15,nameY:-2,stateY:12,link:10,end:6,room:30,plain:12,glyph:.62},bracket:{gap:12,tick:6,text:16,lane:34},box:{pad:6,tagX:12,tagH:16,tagPadX:7},axisGap:18,major:12,minor:6,minorPx:40,tickY:18,rangeY:14,nameGap:8,ticks:6,bottom:12,needle:{over:8,head:6,dot:3.5},meter:{w:150,h:6,y:36,mark:5,textY:59,color:"amber"}},edge:{inset:3,arrow:6,arrowHalf:3.5,parallel:5,ghostDash:5,flowDash:9,bend:12},label:{h:20,padX:9,radius:10,offset:22,side:14,search:4,searchMax:400,soft:6,touch:2},action:{h:22,padX:10,radius:11},badge:{r:9.5,ring:9,inset:4,along:14,short:44},carrier:{envW:24,envH:17,coinR:6.5,coinIn:3.8,tagH:18,tagPadX:8,samples:16},slot:{gap:6,pad:3,spread:4,h:24,radius:7,clear:2,lifeline:5,mark:4},mark:{pad:3,radius:5,dash:4,gap:3},strip:{h:72,line:44,pad:12,icon:24,titleX:44,fieldGap:22,sepInset:14,tagGap:6,tagH:15,tagPadX:7,nameY:22,valueY:43,trail:{r:5.4,step:16},now:{r:3,gap:7}},stroke:{git:2.25,gitOrphan:1.5,mark:1.6,slot:1.2,hair:1,edge:1.7,edgeOn:2.25,arrow:1.5,flow:1.3,halo:7,on:1.75,glyph:2,lifeline:1.2,envelope:1.5,badgeRing:1.5,path:1.6,end:1.6,done:1.2,trail:1.2,timeSlot:.6,timeFrame:1.25,timeAxis:1,timeSpan:1.5,timeDrop:1.4,timePoint:1.75,timeFlag:1.8,timeNeedle:1.25,timeMeter:1.25,tree:1.5,treeTrail:2.6,treeCon:1.3},shadow:{near:.8,far:4,nearY:1,farY:3},mini:{w:168,pad:8,title:14,inset:12,radius:10},follow:{aspect:.75,minH:320,fitMinH:160,ease:.6,narrow:440,badgeRoom:8,headRoom:10,head:{pad:8,h:40,nameY:17,subY:31}},mix:{slot:45,icon:14,regionIcon:16,regionIconEdge:34,cap:12,capEdge:42,badgePast:14,badgePastEdge:70,mini:62,miniBand:16,miniBandEdge:36,view:6,side:4,sideEdge:36,ghostEdge:60,path:55,past:72,timeShade:3.5,timeSpan:6,timeEmpty:8,timeGuide:50},baseline:{label:3.8,badge:3.5,carrier:3.7,stripTitle:4.5,tag:3.6,action:3.8,mark:4},rise:5,popFrom:.4,player:{gap:10,radius:12,button:36,touch:44,hidden:1,focus:2,narrow:440}},Ge={intro:1.4,outro:4.6,tail:.6,stepBase:1.2,perChar:.025,stepMin:2.2,stepMax:5,dwell:1.2,edgeAt:.1,stagger:.5,draw:.55,drawCarry:.9,action:.9,change:.12,minShow:.8,labelDelay:.15,fade:.3,popFade:.4,untilFade:.2,still:.45,done:.3,time:{axis:11.5,unitMin:.12,unitMax:.4,wait:.15,after:.15,reset:.05}},ng=10.5,st={inOut:"cubic-bezier(.65,0,.35,1)",out:"cubic-bezier(.22,1,.36,1)",pop:"cubic-bezier(.34,1.56,.64,1)"},rd=n=>/[0-9A-Za-z]$/u.test(n)?`${n} `:n,k1=n=>n.charAt(0).toUpperCase()+n.slice(1),cs={ja:{cannotDraw:n=>`図を描けない: ${n}`,unknownColor:n=>`colors の ${n} は色味に無い色の名前`,unreadableColor:n=>`colors の ${n} の値を色として読めない`,overview:"全体図",prev:"前の段",pause:"止める",play:"動かす",next:"次の段",steps:n=>`${n} の段`,side:"脇道",sideNote:"今回は通らない",sideFrom:n=>`${n} つの状態から入れる`,trail:"通った状態",start:"始まり",end:"終わり",badgeName:n=>`段の番号 ${n}`,quoted:n=>`「${n}」`,iconOf:n=>`「${n} の絵柄」`,coin:"「硬貨」",envelope:"「封筒」",textsOverlap:(n,o)=>`${rd(n)}と${rd(o)}が重なる`,lineCrosses:(n,o,c)=>`線 ${n} → ${o} が${rd(c)}を横切る`,timeUnits:{ms:"ミリ秒",s:"秒",min:"分",h:"時間",d:"日"},zoom:"拡大",range:(n,o)=>`${n}〜${o}`,headJoin:" ・ ",empty:"空き"},en:{cannotDraw:n=>`Cannot draw the diagram: ${n}`,unknownColor:n=>`colors.${n} is not a color name of the palette`,unreadableColor:n=>`colors.${n} cannot be read as a color`,overview:"Overview",prev:"Previous step",pause:"Pause",play:"Play",next:"Next step",steps:n=>`Steps of ${n}`,side:"Side path",sideNote:"Not taken this time",sideFrom:n=>`Enterable from ${n} ${n===1?"state":"states"}`,trail:"States passed",start:"Start",end:"End",badgeName:n=>`step number ${n}`,quoted:n=>`"${n}"`,iconOf:n=>`the icon of "${n}"`,coin:"the coin",envelope:"the envelope",textsOverlap:(n,o)=>k1(`${n} and ${o} overlap`),lineCrosses:(n,o,c)=>`The line ${n} → ${o} crosses ${c}`,timeUnits:{ms:"ms",s:"s",min:"min",h:"h",d:"d"},zoom:"Zoom",range:(n,o)=>`${n}–${o}`,headJoin:" · ",empty:"Empty"}},Kn=n=>[...n].some(o=>(o.codePointAt(0)??0)>=11904);function E1(n,o){return o==="mono"&&Kn(n)?"sans":o}function Ie(n,o){const c=E1(n,o.family);let u=0;for(const d of n)u+=g1(d,c);return u*o.size/kd}function Ma(n,o,c,u,d="start"){const a=Ie(n,u);return{x:d==="middle"?o-a/2:o,y:c-u.size*.8,w:a,h:u.size}}function Fi(n){return n.steps.flatMap((o,c)=>o.events.flatMap((u,d)=>u.type==="edge"?[{step:c,event:d,edge:u}]:[]))}function $o(n){const o=ag(n),c=new Map;return n.boxes.forEach((u,d)=>{const a=u.region===void 0?void 0:o.get(u.region);c.set(u.id,u.color??a??Eo[d%Eo.length])}),c}function ag(n){const o=new Map;return(n.regions??[]).forEach((c,u)=>o.set(c.id,c.color??Eo[u%Eo.length])),o}var Hi=(n,o)=>n.carry.kind==="coin"?"coin":o.get(n.from)??"slate";function Do(n,o,c){const u=n.boxes.find(a=>a.id===o);if(!u)return P.box.minW;const d=[Ie(u.name,ne.boxName),Ie(u.sub??"",ne.boxSub)];for(const a of n.steps)for(const r of a.events)r.type==="swap"&&r.box===o&&d.push(Ie(r.text,ne.boxSubStrong)),c&&r.type==="action"&&r.box===o&&d.push(Ie(r.label,ne.boxSubStrong));return Math.max(P.box.minW,Math.max(...d)+P.box.padX*2)}function Ao(n){const o=P.carrier;return n.kind==="tag"?[(Ie(n.text,Kn(n.text)?ne.carrierJa:ne.carrier)+o.tagPadX*2)/2,o.tagH/2]:n.kind==="coin"?[o.coinR,o.coinR]:[o.envW/2,o.envH/2]}var sg=n=>n.main+n.coin+(n.main>0&&n.coin>0?P.slot.spread:0);function Ll(n){const o=new Map,c=new Set(n.boxes.map(u=>u.id));for(const u of n.steps)for(const d of u.events){if(d.type!=="edge"||d.carry.kind==="none")continue;const a=d.carry.kind==="coin"?"coin":"main",r=Ao(d.carry)[0]*2;for(const l of[d.from,d.to]){if(!c.has(l))continue;const f=o.get(l)??{main:0,coin:0};f[a]=Math.max(f[a],r),o.set(l,f)}}return o}function Ul(n,o,c){return n?(o?P.box.icon+P.slot.gap:0)+sg(n)+P.slot.pad*2+P.box.padX+c:0}function Pl(n,o,c=P.box.padX){if(!o)return;const u=P.box,d=P.slot,a=sg(o)+d.pad*2,r=n.icon?u.icon+d.gap:0,l=Math.max(n.x+u.padX,Math.min(n.cx-(r+a)/2,n.x+n.w-c-(r+a)));n.icon&&(n.iconX=l+u.icon/2),n.slot={x:l+r,y:n.cy+u.iconY-d.h/2,w:a,h:d.h}}function Ri(n,o,c){const u=P.slot,d=(a,r)=>{const l=o.get(a),f=c.get(a);if(!l?.slot||!f)return;const p=l.slot.x+u.pad,g=l.slot.y+l.slot.h/2;return f.main>0&&f.coin>0?r.kind==="coin"?[p+f.main+u.spread+f.coin/2,g]:[p+f.main/2,g]:[l.slot.x+l.slot.w/2,g]};for(const a of n){if(a.carry.kind==="none")continue;const r=d(a.to,a.carry),l=d(a.from,a.carry);r&&(a.settle=r),l&&(a.wait=l)}}function ko(n,o){const c=Math.max(o.x-(n.x+n.w),n.x-(o.x+o.w)),u=Math.max(o.y-(n.y+n.h),n.y-(o.y+o.h));return Math.max(c,u)}function Hd(n,o,c=0){const u=o.x+c,d=o.y+c,a=o.x+o.w-c,r=o.y+o.h-c;if(a<=u||r<=d)return!1;for(let l=1;l<n.length;l++){const[f,p]=n[l-1],[g,b]=n[l],w=g-f,x=b-p;let _=0,E=1;const M=(N,$)=>{if(N===0)return $>0;const j=$/N;return N<0?_=Math.max(_,j):E=Math.min(E,j),_<E};if(M(-w,f-u)&&M(w,a-f)&&M(-x,p-d)&&M(x,r-p))return!0}return!1}function A1(n){let o={a:n[0],b:n[1]??n[0],length:-1};for(let c=1;c<n.length;c++){const u=n[c-1],d=n[c],a=Math.hypot(d[0]-u[0],d[1]-u[1]);a>o.length&&(o={a:u,b:d,length:a})}return{a:o.a,b:o.b,vertical:Math.abs(o.b[0]-o.a[0])<Math.abs(o.b[1]-o.a[1])}}function Ca(n,o){let c=o;for(let u=1;u<n.length;u++){const d=n[u-1],a=n[u],r=Math.hypot(a[0]-d[0],a[1]-d[1]);if(c<=r&&r>0)return[d[0]+(a[0]-d[0])*c/r,d[1]+(a[1]-d[1])*c/r];c-=r}return n[n.length-1]}function No(n){let o=0;for(let c=1;c<n.length;c++){const u=n[c-1],d=n[c];o+=Math.hypot(d[0]-u[0],d[1]-u[1])}return o}function Ld(n){const{w:o,h:c,samples:u}=P.state.loop,d=n.y+n.h,a=[n.cx+o/2,d],r=[n.cx+o*3/4,d+c*4/3],l=[n.cx-o*3/4,d+c*4/3],f=[n.cx-o/2,d+P.edge.inset];return Array.from({length:u+1},(p,g)=>{const b=g/u,w=1-b,x=_=>w*w*w*a[_]+3*w*w*b*r[_]+3*w*b*b*l[_]+b*b*b*f[_];return[x(0),x(1)]})}function og(n){const o=Math.max(...n.map(([d])=>d)),c=n[0][1],u=Math.max(...n.map(([,d])=>d));return[o+P.badge.r+P.badge.inset,c+(u-c)*P.state.loop.badgeAt]}function ig(n,o){return{x:(n[0]?.[0]??0)-P.state.loop.w/2-o/2,y:Math.max(...n.map(([,c])=>c))+P.label.soft}}var s0=P.state.loop.h+P.label.soft*2+P.label.h;function To(n,o=[],c=[]){const u=No(n),d=u<P.badge.short?Math.min(P.badge.r+1,u/2):P.badge.along,a=P.badge.r*2+P.badge.inset;for(let r=d;r<=u;r+=1){const l=Ca(n,r);if(o.every(([f,p])=>Math.hypot(l[0]-f,l[1]-p)>=a))return l}return _1(n,d,o,c)??Ca(n,d)}function _1(n,o,c,u){const d=No(n),[a,r]=Ca(n,o),[l,f]=Ca(n,Math.max(0,o-1)),[p,g]=Ca(n,Math.min(d,o+1)),b=Math.hypot(p-l,g-f);if(b===0)return;const[w,x]=[-(g-f)/b,(p-l)/b],_=P.badge.r*2;for(const E of[P.edge.arrowHalf,0])for(let M=1;M<=_+P.badge.inset;M++)for(const N of[1,-1]){const $=[a+w*M*N,r+x*M*N];if(c.every(([G,K])=>Math.max(Math.abs($[0]-G),Math.abs($[1]-K))>=_+1)&&u.every(G=>!Hd(G,da($),-E)))return $}}var Ol=n=>n.points.map(([o,c])=>`${Math.round(o*10)},${Math.round(c*10)}`).join(" ");function _o(n,o,c=(u,d,a)=>To(u.points,d,a)){const u=new Map,d=[],a=new Map;for(let r=0;r<o;r++){const l=n.find(w=>w.step===r&&w.points.length>0);if(!l)continue;const f=Ol(l),p=a.get(f);if(p){u.set(r,{point:p,edge:l});continue}const g=n.filter(w=>w.points.length>1&&Ol(w)!==f).map(w=>w.points),b=c(l,d,g);d.push(b),a.set(f,b),u.set(r,{point:b,edge:l})}return u}function Mo(n){const o=(c,u)=>Math.hypot(c.x-u.x,c.y-u.y)<=.5;return n.map(c=>{const u=n.filter(d=>d.step>c.step&&o(d,c)).sort((d,a)=>d.step-a.step)[0];return u?{...c,until:u.step}:c})}var da=([n,o])=>({x:n-P.badge.r,y:o-P.badge.r,w:P.badge.r*2,h:P.badge.r*2}),rg=n=>[n.x+P.state.text,n.y+P.baseline.mark],ua=n=>Kn(n)?ne.labelJa:ne.label,S1={above:"below",below:"above",left:"right",right:"left"};function Cs(n,o){const c=Ie(n.text,ua(n.text))+P.label.padX*2,u=P.label.h,d=A1(n.points),a=(d.a[0]+d.b[0])/2,r=(d.a[1]+d.b[1])/2,l=n.side??(d.vertical?"right":"above"),{side:f}=P.label,p=n.offset??P.label.offset,g=M=>M==="above"?{x:a-c/2,y:r-p-u/2,w:c,h:u}:M==="below"?{x:a-c/2,y:r+p-u/2,w:c,h:u}:M==="left"?{x:a-f-c,y:r-u/2,w:c,h:u}:{x:a+f,y:r-u/2,w:c,h:u},b=n.base?{...n.base,w:c,h:u}:g(l),w=n.flip?[l,S1[l]]:[l],x=M=>o.hard.every(N=>ko(M,N)>=P.gap)&&o.soft.every(N=>ko(M,N)>=P.label.soft)&&(o.touch??[]).every(N=>ko(M,N)>=P.label.touch)&&(o.lines??[]).every(N=>!Hd(N,M,-2)),{search:_,searchMax:E}=P.label;for(let M=0;M<=E;M+=_)for(const N of w){const $=N===l?b:g(N),j=N==="above"?[0,-1]:N==="below"?[0,1]:N==="left"?[-1,0]:[1,0],G=[Math.abs(j[1]),Math.abs(j[0])],K=n.slide??(N==="above"||N==="below"?c:u*4);for(let q=0;q<=K;q+=_)for(const U of q===0?[1]:[1,-1]){const z={x:$.x+j[0]*M+G[0]*q*U,y:$.y+j[1]*M+G[1]*q*U,w:c,h:u};if(x(z))return{...z,step:n.step,event:n.event,text:n.text,family:ua(n.text).family,color:n.color}}}return{...b,step:n.step,event:n.event,text:n.text,family:ua(n.text).family,color:n.color}}function lg(n){const o=/^([0-9]+(?:\.[0-9]+)?)%$/u.exec(n.trim());if(o)return Math.min(1,Math.max(0,Number(o[1])/100));const c=/^([0-9]+)\/([0-9]+)$/u.exec(n.trim());if(c&&Number(c[2])>0)return Math.min(1,Math.max(0,Number(c[1])/Number(c[2])))}var cg=(n,o)=>n.strip?.meters?.find(c=>c.field===o);function ug(n,o){if(cg(n,o))return Math.max(Ie(o,ne.fieldName),P.time.meter.w);let c=0,u=0;for(const a of n.steps)for(const r of a.events)r.type!=="strip"||r.field!==o||(r.value!==void 0&&(c=Math.max(c,Ie(r.value,Kn(r.value)?ne.fieldValueJa:ne.fieldValue))),r.tag!==void 0&&(u=Math.max(u,Ie(r.tag,ne.tag)+P.strip.tagPadX*2)));const d=c+(u>0?(c>0?P.strip.tagGap:0)+u:0);return Math.max(Ie(o,ne.fieldName),d)}var Ed=n=>Math.max(Ie(n.title,ne.fieldName),n.states.length*P.strip.trail.step);function Co(n,o){if(!n.strip)return 0;const{titleX:c,fieldGap:u,pad:d}=P.strip,a=c+Ie(n.strip.title,ne.stripTitle)+u,r=[...n.strip.fields.map(l=>ug(n,l)),...o?[Ed(o)]:[]];return a+r.reduce((l,f)=>l+f+u,0)-u+d}function Oo(n,o,c,u,d){if(!n.strip)return;const{titleX:a,fieldGap:r,pad:l,line:f,h:p}=P.strip,g=a+Ie(n.strip.title,ne.stripTitle)+r,b=[];let w=g,x=0;const _=M=>{w>g&&w+M>u-l&&(w=g,x++);const N={x:o+w,y:c+x*f};return w+=M+r,N};for(const M of n.strip.fields){const N=ug(n,M),$=_(N),j=cg(n,M),G=j?lg(j.line):void 0;b.push({name:M,...$,w:N,...j&&G!==void 0?{meter:{line:G,text:j.line,x:$.x,w:P.time.meter.w}}:{}})}const E=d?{...d,..._(Ed(d)),w:Ed(d)}:void 0;return{x:o,y:c,w:u,h:p+x*f,title:n.strip.title,fields:b,...E?{trail:E}:{}}}function Ud(n,o,c){const u=d=>{d.x+=o,d.y+=c};for(const d of n.boxes)u(d),d.cx+=o,d.cy+=c,d.slot&&u(d.slot),d.iconX!==void 0&&(d.iconX+=o);for(const d of n.regions)d.y+=c,u(d.header);for(const d of n.lifelines)d.x+=o,d.y1+=c,d.y2+=c;for(const d of n.edges)d.points=d.points.map(([a,r])=>[a+o,r+c]),d.settle&&(d.settle=[d.settle[0]+o,d.settle[1]+c]),d.wait&&(d.wait=[d.wait[0]+o,d.wait[1]+c]);for(const d of n.labels)u(d);for(const d of n.paths)d.points=d.points.map(([a,r])=>[a+o,r+c]),d.label&&u(d.label);for(const d of n.ends)d.x+=o,d.y+=c;n.side&&u(n.side);for(const d of n.actions)u(d);for(const d of n.badges)d.x+=o,d.y+=c;if(n.strip){n.strip.y+=c;for(const d of n.strip.fields)d.x+=o,d.y+=c,d.meter&&(d.meter.x+=o);n.strip.trail&&(n.strip.trail.x+=o,n.strip.trail.y+=c)}}function Pd(n,o,c){const{inset:u}=P.badge;for(const a of n){const r=a.type==="swap"||a.type==="action"?a.box:void 0,l=c.boxes.find(f=>f.id===r);if(l)return{step:o,x:l.x,y:l.y,color:l.color}}if(c.strip&&n.some(a=>a.type==="strip"))return{step:o,x:c.strip.x+u,y:c.strip.y+u,color:"slate"};const d=c.boxes[0];return{step:o,x:d.x,y:d.y,color:d.color}}function $1(n){const o=D1(n),c=N1(n,o),u=o.map(()=>({top:0,bottom:0}));let d=o0(n,o,c,u);for(let a=0;a<3&&C1(d,o,c,u);a++)d=o0(n,o,c,u);return d}function D1(n){const o=n.regions??[],c=new Set(o.map(a=>a.id)),u=o.map(a=>({region:a,members:n.boxes.filter(r=>r.region===a.id).map(r=>r.id)})),d=n.boxes.filter(a=>a.region===void 0||!c.has(a.region)).map(a=>a.id);return d.length>0&&u.push({members:d}),u}var dg=n=>n==="left"||n==="right";function N1(n,o){const c=P.architecture.columns,u=Fi(n).map(r=>r.edge),d=new Map;o.forEach((r,l)=>{const f=new Set(r.members),p=new Set,g=(N,$)=>N>=0&&N<c&&!p.has(`${N},${$}`),b=(N,$)=>{const j=Math.min(c-1,Math.max(0,N));for(let G=$;;G++)for(let K=0;K<c;K++)for(const q of[j+K,j-K])if(g(q,G))return[q,G]},w=(N,$,j)=>{d.set(N,{group:l,col:$,row:j}),p.add(`${$},${j}`)};let x=1;const _=N=>{for(const $ of u){const j=$.from===N?$.to:$.to===N?$.from:void 0;if(j===void 0||!f.has(j)||d.has(j))continue;const G=d.get(N),[K,q]=dg($.labelSide)?b(G.col,G.row+1):g(G.col+x,G.row)?[G.col+x,G.row]:b(G.col+x,G.row);w(j,K,q),_(j)}},E=N=>{for(let $=0;$<u.length;$++){const j=u[$],G=j?.from===N?j.to:j?.to===N?j.from:void 0,K=G===void 0?void 0:d.get(G);if(K&&K.group<l)return{order:$,col:K.col}}};let M=0;for(;;){const N=r.members.filter(U=>!d.has(U));if(N.length===0)break;const $=N.map(U=>({id:U,anchor:E(U)})).filter(U=>U.anchor!==void 0);$.sort((U,z)=>(U.anchor?.order??0)-(z.anchor?.order??0));const j=$[0]??{id:N[0],anchor:void 0},G=j.anchor?.col??0;M===0&&(x=G>=(c-1)/2?-1:1);const[K,q]=g(G,0)?[G,0]:b(G,0);w(j.id,K,q),_(j.id),M++}});const a=[...new Set([...d.values()].map(r=>r.col))].sort((r,l)=>r-l);for(const r of d.values())r.col=a.indexOf(r.col);return d}function T1(n){const o=[...n.matchAll(/ /g)].map(u=>u.index);if(o.length===0)return[n];const c=o.reduce((u,d)=>Math.abs(d-n.length/2)<Math.abs(u-n.length/2)?d:u);return[n.slice(0,c),n.slice(c+1)]}function M1(n){const{icon:o,nameY:c,line:u,inset:d}=P.region,a=T1(n.name),r=Math.max(o,...a.map(f=>Ie(f,ne.regionName)),Ie(n.note??"",ne.regionNote)),l=c-d+(a.length-1)*u+(n.note?u:0)+P.gap/2;return{w:r,h:l,lines:a}}function o0(n,o,c,u){const{box:d,region:a,architecture:r,margin:l,gap:f}=P,p=$o(n),g=ag(n),b=Fi(n),w=Math.max(1,...[...c.values()].map(k=>k.col+1)),x=Ll(n),_=new Map(n.boxes.map(k=>[k.id,Math.max(Do(n,k.id,!0),Ul(x.get(k.id),k.icon!==void 0,d.padX))])),E=Array.from({length:w},(k,W)=>Math.max(d.minW,...[...c].filter(([,Z])=>Z.col===W).map(([Z])=>_.get(Z)??d.minW))),M=Array.from({length:Math.max(0,w-1)},()=>r.columnGap);for(const{edge:k}of b){const W=c.get(k.from),Z=c.get(k.to);if(!W||!Z||k.label===void 0||W.group!==Z.group||W.row!==Z.row||Math.abs(W.col-Z.col)!==1||dg(k.labelSide))continue;const be=Ie(k.label,ua(k.label))+P.label.padX*2+r.labelRoom*2,Be=Math.min(W.col,Z.col);be<=r.maxColumnGap&&(M[Be]=Math.max(M[Be]??0,be))}const N=o.map(k=>k.region?M1(k.region):void 0),$=Math.max(0,...N.map(k=>k?k.w+a.inset*2:0)),j=[];for(let k=0;k<w;k++)j.push(k===0?l+($>0?$:a.pad):j[k-1]+E[k-1]+M[k-1]);const G=k=>j[k]+E[k]/2,K=new Set(b.filter(({edge:k})=>k.from===k.to).map(({edge:k})=>k.from)),q=new Set([...K].flatMap(k=>{const W=c.get(k);return W?[`${W.group}:${W.row}`]:[]})),U=(k,W)=>q.has(`${k}:${W}`)?s0:0,z=[],Q=[];let re=l;o.forEach((k,W)=>{const Z=Math.max(1,...k.members.map(nt=>(c.get(nt)?.row??0)+1)),be=u[W],Be=re+a.pad+be.top,Ae=[0];for(let nt=1;nt<Z;nt++)Ae.push(Ae[nt-1]+d.h+r.rowGap+U(W,nt-1));for(const nt of k.members){const _t=c.get(nt),Ut=n.boxes.find(sn=>sn.id===nt),rt=_.get(nt)??d.minW,Vt=G(_t.col),Zt=Be+Ae[_t.row];z.push({id:nt,name:Ut?.name??nt,...Ut?.sub!==void 0?{sub:Ut.sub}:{},...Ut?.icon!==void 0?{icon:Ut.icon}:{},color:p.get(nt)??"slate",x:Vt-rt/2,y:Zt,w:rt,h:d.h,cx:Vt,cy:Zt+d.h/2})}const _e=Be+Ae[Z-1]+d.h+U(W,Z-1),je=N[W],qe=Math.max(_e+a.pad+be.bottom-re,je?je.h+a.inset*2:0,k.region?a.minH:0);Q.push({group:W,y:re,h:qe,rows:Z}),re+=qe+a.gap});const ue=re-a.gap;for(const k of z)Pl(k,x.get(k.id));const he=new Map(z.map(k=>[k.id,k])),fe=k=>Q[c.get(k)?.group??0],Ce=(k,W,Z)=>{for(let be=1;be<k.length;be++){const[Be,Ae]=k[be-1],[_e,je]=k[be];if(Math.min(Be,_e)<=W.x+W.w+Z&&Math.max(Be,_e)>=W.x-Z&&Math.min(Ae,je)<=W.y+W.h+Z&&Math.max(Ae,je)>=W.y-Z)return!0}return!1},$e=[...K].flatMap(k=>{const W=he.get(k);return W?[{x:W.x,y:W.y+W.h,w:W.w,h:s0}]:[]}),C=k=>$e.some(W=>Ce(k,W,0)),S=(k,W,Z)=>z.some(be=>be.id!==W&&be.id!==Z&&Ce(k,be,P.label.search))||C(k),F=k=>{const W=he.get(k),Z=fe(k),be=c.get(k),Be=W.y+W.h+(be?U(be.group,be.row):0);return(be?.row??0)<Z.rows-1?Be+r.rowGap/2:Math.min(Be+a.pad/2,Z.y+Z.h-P.edge.inset)},Y=k=>{const W=he.get(k),Z=fe(k);return(c.get(k)?.row??0)>0?W.y-r.rowGap/2:Math.max(W.y-a.pad/2,Z.y+P.edge.inset)},oe=P.edge.inset,D=(k,W)=>W?j[k]+E[k]+(M[k]??r.columnGap)/2:j[k]-(M[k-1]??r.columnGap)/2,T=(k,W)=>{const Z=he.get(k),be=he.get(W);if(k===W)return Ld(Z);const Be=c.get(k),Ae=c.get(W);if(Be.group===Ae.group&&Be.row===Ae.row){const rt=be.cx>Z.cx,Vt=[[rt?Z.x+Z.w:Z.x,Z.cy],[rt?be.x-oe:be.x+be.w+oe,be.cy]];if(!S(Vt,k,W))return Vt;const Zt=F(k),sn=[[Z.cx,Z.y+Z.h],[Z.cx,Zt],[be.cx,Zt],[be.cx,be.y+be.h+oe]];if(!C(sn))return sn;const qn=Y(k),cn=[[Z.cx,Z.y],[Z.cx,qn],[be.cx,qn],[be.cx,be.y-oe]];return C(cn)?sn:cn}const _e=be.cy>Z.cy,je=[Z.cx,_e?Z.y+Z.h:Z.y],qe=[be.cx,_e?be.y-oe:be.y+be.h+oe];if(Be.col===Ae.col){const rt=[je,qe];if(!S(rt,k,W))return rt;const Vt=D(Be.col,!0);return[[Z.x+Z.w,Z.cy],[Vt,Z.cy],[Vt,be.cy],[be.x+be.w+oe,be.cy]]}const nt=be.cx>Z.cx,_t=_e?F(k):Y(k),Ut=[[je,[Z.cx,be.cy],[nt?be.x-oe:be.x+be.w+oe,be.cy]],[[nt?Z.x+Z.w:Z.x,Z.cy],[be.cx,Z.cy],qe],[je,[Z.cx,_t],[be.cx,_t],qe]];if(K.has(k)||K.has(W)){const rt=D(Be.col,nt),Vt=D(Ae.col,!nt),Zt=[[nt?Z.x+Z.w:Z.x,Z.cy],[rt,Z.cy]],sn=[nt?be.x-oe:be.x+be.w+oe,be.cy];Ut.push([...Zt,[rt,be.cy],sn],[...Zt,[rt,_t],[be.cx,_t],qe],[je,[Z.cx,_t],[Vt,_t],[Vt,be.cy],sn],[...Zt,[rt,_t],[Vt,_t],[Vt,be.cy],sn])}return Ut.find(rt=>!S(rt,k,W))??Ut[2]},te=b.map(({step:k,event:W,edge:Z})=>({step:k,event:W,from:Z.from,to:Z.to,points:T(Z.from,Z.to),color:Hi(Z,p),carry:Z.carry}));Ri(te,he,x);const de=new Map;for(const k of te){if(k.points.length!==2||!te.some(_e=>_e.from===k.to&&_e.to===k.from&&_e.points.length===2))continue;const[Z,be]=k.points,Be=Math.abs(be[1]-Z[1])<Math.abs(be[0]-Z[0]),Ae=(k.from<k.to?1:-1)*P.edge.parallel;k.points=k.points.map(([_e,je])=>Be?[_e,je+Ae]:[_e+Ae,je]),de.set(k,Be?Ae>0?"below":"above":Ae>0?"right":"left")}const ve=[];o.forEach((k,W)=>{const Z=Q[W],be=N[W];!k.region||!be||ve.push({id:k.region.id,lines:be.lines,...k.region.note!==void 0?{note:k.region.note}:{},...k.region.icon!==void 0?{icon:k.region.icon}:{},color:g.get(k.region.id)??"slate",x:l,y:Z.y,w:0,h:Z.h,header:{x:l+a.inset,y:Z.y+a.inset,w:be.w,h:be.h}})});const Se=(k,W,Z)=>k.from===k.to?og(k.points):To(k.points,W,Z),Ne=_o(te,n.steps.length,Se),Ye=[];for(const k of te){const W=n.steps[k.step]?.events[k.event];if(W?.type!=="edge"||W.label===void 0)continue;const Z=[...Ne].filter(([_e])=>_e<=k.step).map(([,_e])=>da(_e.point)),be=[...ve.map(_e=>_e.header),...Ye.filter(_e=>_e.step===k.step)],Be=W.labelSide??de.get(k),Ae=k.from===k.to?{side:"below",base:ig(k.points,Ie(W.label,ua(W.label))+P.label.padX*2)}:void 0;Ye.push(Cs({step:k.step,event:k.event,text:W.label,points:k.points,color:k.color,...Ae??(Be?{side:Be}:{flip:!0})},{hard:z,soft:be,touch:Z}))}const Fe={kind:"architecture",width:0,height:0,regions:ve,boxes:z,lifelines:[],edges:te,labels:Ye,actions:[],badges:[],paths:[],ends:[]},ot=Ye.length>0?Math.max(0,l+P.label.soft-Math.min(...Ye.map(k=>k.x))):0;ot>0&&Ud(Fe,ot,0);const X=Math.max(...z.map(k=>k.x+k.w+a.pad),...Ye.map(k=>k.x+k.w+P.label.soft),...te.flatMap(k=>k.points.map(W=>W[0]+a.pad))),L=Math.max(X+l,Co(n)+l*2);for(const k of ve)k.w=L-l*2;const Ee=Math.max(ue,...Ye.map(k=>k.y+k.h)),V=Oo(n,l,Ee+f,L-l*2);Fe.width=L,Fe.height=(V?V.y+V.h:Ee)+l,V&&(Fe.strip=V);const ye=_o(te,n.steps.length,Se);return Fe.badges=Mo(n.steps.map((k,W)=>{const Z=ye.get(W);return Z?{step:W,x:Z.point[0],y:Z.point[1],color:Z.edge.color}:Pd(k.events,W,Fe)})),Fe}function C1(n,o,c,u){let d=!1;const a=P.label.soft;for(const r of n.labels){const l=n.edges.find(_=>_.step===r.step&&_.event===r.event),f=l&&c.get(l.from),p=l&&c.get(l.to);if(!f||!p||f.group!==p.group||!o[f.group]?.region)continue;const g=n.regions.find(_=>_.id===o[f.group]?.region?.id),b=u[f.group];if(!g||!b)continue;const w=g.y+a-r.y,x=r.y+r.h-(g.y+g.h-a);w>0&&(b.top+=w,d=!0),x>0&&(b.bottom+=x,d=!0)}return d}var O1=n=>n.kind==="git";function B1(n){const o=(n.git?.branches??[]).map(z=>z.id),c=z=>{o.includes(z)||o.push(z)};for(const z of n.steps)for(const Q of z.events)(Q.type==="commit"||Q.type==="branch")&&c(Q.branch);const u=new Map(o.map(z=>[z,null]));let d=null,a=null;const r=[],l=new Map,f=[],p=[],g=[],b=new Map,w=new Map,x=new Map,_=[...o,ca],E=new Map(_.map(z=>[z,[]])),M=[],N=z=>z===ca?a===null?d:null:u.get(z)??null,$=z=>{const Q=b.get(z)??[],re=Q.indexOf(null);return re<0?Q.length:re},j=(z,Q,re,ue)=>{const he=new Map(_.map(C=>[C,N(C)])),fe=d;re();const $e=_.filter(C=>he.get(C)!==N(C)).map(C=>{const S=x.get(C);return S&&(b.get(S.commit)[S.row]=null,x.delete(C)),{ref:C,slot:S}});for(const{ref:C,slot:S}of $e){const F=S??(C===ca&&fe!==null?{commit:fe,row:$(fe)}:void 0),Y=N(C);let oe;if(Y!==null){oe={commit:Y,row:$(Y)};const D=b.get(Y)??[];D[oe.row]=C,b.set(Y,D),w.set(Y,Math.max(w.get(Y)??0,D.filter(T=>T!==null).length)),x.set(C,oe)}p.push({ref:C,step:z,event:Q,...F?{from:F}:{},...oe?{to:oe}:{},line:C===ue})}},G=(z,Q)=>{const re=new Set,ue=[...u.values(),d].filter(he=>he!==null);for(;ue.length>0;){const he=ue.pop();re.has(he)||(re.add(he),ue.push(...l.get(he)?.parents??[]))}for(const he of r)!re.has(he.id)&&he.orphan===void 0&&(he.orphan={step:z,event:Q})};n.steps.forEach((z,Q)=>{z.events.forEach((re,ue)=>{if(re.type==="commit")q(re,Q,ue);else if(re.type==="branch"){if(!l.has(re.from))return;K(re.from)!==re.branch&&f.push({kind:"branch",from:re.from,to:re.branch,step:Q,event:ue}),j(Q,ue,()=>{u.set(re.branch,re.from),a=re.branch,d=re.from})}else if(re.type==="edge"){const he=re.from;if(he!==ca&&!u.has(he)||!l.has(re.to))return;j(Q,ue,()=>{if(he===ca){a=null,d=re.to;return}u.set(he,re.to),a===he?d=re.to:a===null&&d===re.to&&(a=he)},he)}else return;G(Q,ue)});for(const re of _)E.get(re)?.push(re===ca?d:u.get(re)??null);M.push(a);for(const re of _){const ue=x.get(re);ue&&g.push({ref:re,step:Q,slot:ue})}});function K(z){return l.get(z)?.branch}function q(z,Q,re){if(l.has(z.id))return;const ue=z.copy!==void 0&&l.has(z.copy)?z.copy:void 0,he=ue!==void 0&&a===null&&d!==null?d:u.get(z.branch)??null,fe=z.merge!==void 0&&z.merge!==z.branch?u.get(z.merge)??void 0:void 0,Ce=[...new Set([he,fe].filter(S=>S!=null))],$e={id:z.id,branch:z.branch,parents:Ce,...fe!==void 0&&fe!==he?{joined:fe}:{},...ue!==void 0?{copy:ue}:{},...z.hash!==void 0?{hash:z.hash}:{},...z.note!==void 0?{note:z.note}:{},step:Q,event:re};r.push($e),l.set($e.id,$e);for(const S of Ce)f.push({kind:"parent",from:S,to:$e.id,step:Q,event:re});ue!==void 0&&f.push({kind:"copy",from:ue,to:$e.id,step:Q,event:re});const C=a===null&&d===null;j(Q,re,()=>{ue===void 0?(u.set(z.branch,$e.id),a===z.branch&&(d=$e.id)):a===null&&(d=$e.id),C&&(a=z.branch,d=$e.id)})}const U=_.map(z=>({name:z,at:E.get(z)??[],...z===ca?{attached:M}:{}}));return{branches:o,made:r,links:f,moves:p,refs:U,tags:g,rows:w}}function Bl(n,o,c,u){const d=P.git.samples;return Array.from({length:d},(a,r)=>{const l=(r+1)/d,f=1-l,p=g=>f*f*f*n[g]+3*f*f*l*o[g]+3*f*l*l*c[g]+l*l*l*u[g];return[p(0),p(1)]})}function j1(n,o){return Math.abs(n[1]-o[1])<.5?[n,o]:n[1]>o[1]?[n,[n[0],o[1]],o]:[n,[o[0],n[1]],o]}function i0(n,o,c){const u=c>n.cy?1:-1,d=[n.cx,n.cy+u*n.r],a=Math.max(0,Math.min(P.git.turn,o-n.cx)),r=[n.cx+a,c],l=Bl(d,[d[0],d[1]+(c-d[1])*.7],[n.cx+a*.2,c],r);return[d,...l,...o>r[0]?[[o,c]]:[]]}function z1(n,o){const c=o.cy<n.cy?1:-1,u=[n.cx+n.r,n.cy],d=[o.cx,o.cy+c*o.r],a=Math.max(0,Math.min(P.git.turn,o.cx-u[0])),r=[o.cx-a,n.cy],l=Bl(r,[o.cx-a*.2,n.cy],[o.cx,d[1]+(n.cy-d[1])*.7],d);return[u,...r[0]>u[0]?[r]:[],...l]}function R1(n,o){if(Math.abs(n.cy-o.cy)<.5){const r=n.cy-n.r,l=P.git.turn*.7;return[[n.cx,r],...Bl([n.cx,r],[n.cx,r-l],[o.cx,r-l],[o.cx,r])]}const c=o.cy<n.cy?-1:1,u=[n.cx,n.cy+c*n.r],d=[o.cx,o.cy-c*o.r],a=(d[1]-u[1])*.5;return[u,...Bl(u,[u[0],u[1]+a],[d[0],d[1]-a],d)]}function q1(n){const{margin:o,gap:c,box:u,region:d,git:a,carrier:r}=P,l=B1(n),f=new Map((n.git?.branches??[]).map(X=>[X.id,X.note])),p=new Map(l.branches.map((X,L)=>[X,L])),g=X=>a.colors[(p.get(X)??0)%a.colors.length],b=new Map,w=new Map;for(const X of l.made){const L=Math.max(0,...X.parents.map(Ee=>(b.get(Ee)??-1)+1),(w.get(X.branch)??-1)+1);b.set(X.id,L),w.set(X.branch,L)}const x=X=>[...X.hash!==void 0?[{text:X.hash,style:ne.gitHash}]:[],...X.note!==void 0?[{text:X.note,style:ne.gitNote}]:[]],_=X=>Math.max(0,...x(X).map(L=>Ie(L.text,L.style))),E=X=>Ie(X,Kn(X)?ne.carrierJa:ne.carrier)+r.tagPadX*2,M=Math.max(0,...l.refs.map(X=>E(X.name))),N=Math.max(a.pitch,...l.made.map(X=>_(X)+a.textGap),M+a.textGap),$=l.branches.map(X=>({w:Math.max(d.icon,Ie(X,ne.regionName),Ie(f.get(X)??"",ne.regionNote))})),j=o+d.inset+Math.max(0,...$.map(X=>X.w)),G=Math.max(a.r,...l.made.filter(X=>b.get(X.id)===0&&p.get(X.branch)===0).map(X=>_(X)/2),M/2),K=Math.max(a.x0,j+c+G),q=new Set(l.moves.flatMap(X=>{const L=n.steps[X.step]?.events[X.event];return X.line&&X.to&&L?.type==="edge"&&L.label!==void 0?[l.made.find(Ee=>Ee.id===X.to?.commit)?.branch??""]:[]})),U=X=>Math.max(0,...l.made.filter(L=>L.branch===X).map(L=>(l.rows.get(L.id)??0)-2))*a.row,z=l.made.some(X=>p.get(X.branch)===0&&x(X).length>0),Q=[];let re=o;l.branches.forEach((X,L)=>{const Ee=L===0,V=Ee&&z?a.tagTop:a.tag,ye=re+(Ee?a.topLine-(a.tagTop-V):a.line)+U(X),k=ye-re+(Ee?a.topBelow:q.has(X)?a.below:a.bare);Q.push({id:X,x:o,y:re,w:0,h:k,line:ye,color:g(X),tagBase:V}),re+=k+d.gap});const ue=re-d.gap,he=new Map(Q.map(X=>[X.id,X])),fe=l.made.map(X=>{const L=he.get(X.branch),Ee=p.get(X.branch)===0,V=K+N*(b.get(X.id)??0)+(Ee?0:N/2),ye=L.line,k=x(X),W=k.map((Ae,_e)=>Ee?ye-a.above-(k.length-1-_e)*a.lineStep:ye+a.under+_e*a.lineStep),Z=k.map((Ae,_e)=>Ma(Ae.text,V,W[_e],Ae.style,"middle")),be=Z.length===0?void 0:{...F1(Z),lines:k.map(Ae=>Ae.text),baselines:W},Be=X.copy!==void 0?g(l.made.find(Ae=>Ae.id===X.copy)?.branch??X.branch):g(X.branch);return{id:X.id,branch:X.branch,color:Be,cx:V,cy:ye,r:a.r,step:X.step,event:X.event,parents:X.parents,...X.copy!==void 0?{copy:X.copy}:{},...X.hash!==void 0?{hash:X.hash}:{},...X.note!==void 0?{note:X.note}:{},...be?{text:be}:{},...X.orphan?{orphan:X.orphan.step,orphanEvent:X.orphan.event}:{}}}),Ce=new Map(fe.map(X=>[X.id,X])),$e=l.links.flatMap(X=>{const L=Ce.get(X.from);if(!L)return[];if(X.kind==="branch"){if(!l.made.some(W=>W.branch===X.to))return[];const k=he.get(X.to);return[{...X,points:i0(L,L.cx+a.turn,k.line),color:g(X.to)}]}const Ee=Ce.get(X.to),V=l.made.find(k=>k.id===X.to);let ye;return X.kind==="copy"?ye=R1(L,Ee):Math.abs(L.cy-Ee.cy)<.5?ye=[[L.cx+L.r,L.cy],[Ee.cx-Ee.r,Ee.cy]]:V?.joined===X.from?ye=z1(L,Ee):ye=i0(L,Ee.cx-Ee.r,Ee.cy),[{...X,points:ye,color:Ee.color}]}),C=(X,L)=>{const Ee=Ce.get(L.commit),V=he.get(Ee.branch)?.tagBase??a.tag,ye=E(X);return{x:Ee.cx-ye/2,y:Ee.cy-V-L.row*a.row-r.tagH/2,w:ye,h:r.tagH}},S=X=>[X.x+X.w/2,X.y+X.h/2],F=l.moves.map(X=>{const L=X.from?C(X.ref,X.from):void 0,Ee=X.to?C(X.ref,X.to):void 0,V=n.steps[X.step]?.events[X.event],ye=X.line&&V?.type==="edge"&&V.carry.kind!=="none"&&!(V.carry.kind==="tag"&&V.carry.text===V.from);return{ref:X.ref,step:X.step,event:X.event,...L?{from:L}:{},...Ee?{to:Ee}:{},...X.to?{target:X.to.commit}:{},...ye?{carried:!0}:{},...X.line&&L&&Ee?{line:j1(S(L),S(Ee))}:{},color:"slate"}}),Y=l.tags.map(X=>({...C(X.ref,X.slot),ref:X.ref,step:X.step})),oe=$o(n),D=Math.max(K,...fe.flatMap(X=>[X.cx+X.r,...X.text?[X.text.x+X.text.w]:[]]),...Y.map(X=>X.x+X.w),...F.flatMap(X=>[X.from,X.to].flatMap(L=>L?[L.x+L.w]:[]))),T=D+a.boxGap,te=(Q[1]??Q[0])?.line??o+u.h/2,de=n.boxes.map((X,L)=>{const Ee=Do(n,X.id,!0),V=te+L*(u.h+c);return{id:X.id,name:X.name,...X.sub!==void 0?{sub:X.sub}:{},...X.icon!==void 0?{icon:X.icon}:{},color:oe.get(X.id)??"slate",x:T,y:V-u.h/2,w:Ee,h:u.h,cx:T+Ee/2,cy:V}}),ve=Q.map((X,L)=>{const Ee=f.get(X.id);return{id:X.id,lines:[X.id],...Ee!==void 0?{note:Ee}:{},icon:"branch",color:X.color,x:X.x,y:X.y,w:0,h:X.h,header:{x:X.x+d.inset,y:X.y+d.inset,w:$[L]?.w??0,h:d.nameY-d.inset+(Ee!==void 0?d.line:0)+c/2}}}),Se={kind:"git",width:0,height:0,regions:ve,boxes:de,lifelines:[],edges:[],labels:[],actions:[],badges:[],paths:[],ends:[],lanes:Q,commits:fe,links:$e,tags:Y,refs:l.refs,moves:F};Se.badges=l0(n,Se),Se.labels=U1(n,Se);const Ne=Math.max(D,...de.map(X=>X.x+X.w),...Se.labels.map(X=>X.x+X.w))+d.pad,Ye=Math.max(Ne+o,Co(n)+o*2);for(const X of ve)X.w=Ye-o*2;for(const X of Q)X.w=Ye-o*2;const Fe=Math.max(ue,...de.map(X=>X.y+X.h),...Se.labels.map(X=>X.y+X.h)),ot=Oo(n,o,Fe+c,Ye-o*2);return Se.width=Ye,Se.height=(ot?ot.y+ot.h:Fe)+o,ot&&(Se.strip=ot),Se.badges=l0(n,Se),Se}function F1(n){const o=Math.min(...n.map(u=>u.x)),c=Math.min(...n.map(u=>u.y));return{x:o,y:c,w:Math.max(...n.map(u=>u.x+u.w))-o,h:Math.max(...n.map(u=>u.y+u.h))-c}}function H1(n,o){return[...n.links.filter(u=>u.step===o&&u.kind!=="copy").map(u=>({event:u.event,points:u.points,color:u.color})),...n.moves.flatMap(u=>{const d=n.commits.find(a=>a.id===u.target);return u.step===o&&u.line&&d?[{event:u.event,target:d,color:d.color}]:[]})].sort((u,d)=>u.event-d.event)[0]}function r0(n,o,c){const{r:u,inset:d}=P.badge,a=n.r+d+u,r=u*2+d;return[[n.cx+a,n.cy],[n.cx,n.cy+a],[n.cx-a,n.cy],[n.cx,n.cy-a]].find(f=>o.every(([p,g])=>Math.hypot(f[0]-p,f[1]-g)>=r)&&c.every(p=>ko(da(f),p)>=P.label.touch))}function L1(n,o,c){const{r:u,inset:d,along:a,short:r}=P.badge,l=No(n),f=l<r?Math.min(u+1,l/2):a,p=u*2+d;for(let g=f;g<=l;g+=1){const b=Ca(n,g),w=da(b);if(o.every(([x,_])=>Math.hypot(b[0]-x,b[1]-_)>=p)&&c.every(x=>ko(w,x)>=P.label.touch))return b}}function l0(n,o){const{inset:c}=P.badge,u=[],d=[...o.links.map(l=>l.points),...o.moves.flatMap(l=>l.line?[l.line]:[])],a=[],r=[...o.tags,...o.commits.flatMap(l=>[{x:l.cx-l.r,y:l.cy-l.r,w:l.r*2,h:l.r*2},...l.text?[l.text]:[]])];return n.steps.forEach((l,f)=>{const p=H1(o,f),g=p?.target?r0(p.target,u,r):void 0;if(p&&(p.points||g)){const M=p.points,N=g??(M?L1(M,u,r)??To(M,u,d.filter($=>$!==M)):[0,0]);u.push(N),a.push({step:f,x:N[0],y:N[1],color:p.color});return}const b=l.events.flatMap(M=>M.type==="swap"||M.type==="action"?[M.box]:[]).map(M=>o.boxes.find(N=>N.id===M))[0];if(b){a.push({step:f,x:b.x,y:b.y,color:b.color});return}if(o.strip&&l.events.some(M=>M.type==="strip")){a.push({step:f,x:o.strip.x+c,y:o.strip.y+c,color:"slate"});return}const w=o.commits.find(M=>M.id===o.refs[0]?.at[f]),x=w?r0(w,u,r):void 0;if(w&&x){u.push(x),a.push({step:f,x:x[0],y:x[1],color:w.color});return}const _=a[a.length-1],E=o.lanes[0];a.push(_?{..._,step:f}:{step:f,x:(E?.x??0)+(E?.w??0)-c-P.badge.r,y:(E?.y??0)+c+P.badge.r,color:E?.color??"slate"})}),Mo(a)}function U1(n,o){const c=P.git,u=[],d=o.commits.map(l=>({x:l.cx-l.r,y:l.cy-l.r,w:l.r*2,h:l.r*2})),a=o.commits.flatMap(l=>l.text?[l.text]:[]),r=o.regions.map(l=>l.header);for(const l of o.moves){const f=n.steps[l.step]?.events[l.event];if(f?.type!=="edge"||f.label===void 0||!l.line)continue;const p=o.commits.find($=>$.id===f.to);if(!p)continue;const g=o.lanes[0]?.id===p.branch,b=Ie(f.label,Kn(f.label)?ne.labelJa:ne.label)+P.label.padX*2,[w]=l.line.reduce(($,j)=>[$[0]+j[0]/l.line.length,0],[0,0]),x=Math.max(0,...o.tags.filter($=>$.step===l.step&&Math.abs($.x+$.w/2-p.cx)<.5).map($=>p.cy-$.y)),_=f.labelSide??(g?"above":"below"),E=f.labelSide!==void 0?void 0:g?{x:w-b/2,y:p.cy-Math.max(x,(o.lanes[0]?.tagBase??c.tag)+P.carrier.tagH/2)-P.label.soft-P.label.h}:{x:w-b/2,y:p.cy+c.labelUnder},M=o.badges.filter($=>$.step<=l.step).map($=>da([$.x,$.y])),N=o.tags.filter($=>$.step===l.step);u.push(Cs({step:l.step,event:l.event,text:f.label,points:l.line,color:l.color,side:_,...E?{base:E}:{}},{hard:[...d,...o.boxes],soft:[...a,...N,...r,...u.filter($=>$.step===l.step)],touch:M}))}return u}function P1(n){const{box:o,sequence:c,label:u,margin:d,gap:a}=P,r=$o(n),l=n.sequence?.lifelines??[],f=[...l,...n.boxes.map(C=>C.id).filter(C=>!l.includes(C))],p=new Map(f.map((C,S)=>[C,S])),g=f.map(C=>Do(n,C,!1)),b=g.slice(1).map((C,S)=>g[S]/2+C/2+c.columnGap),w=[];for(const C of n.steps)for(const S of C.events){if(S.type!=="edge"||S.label===void 0)continue;const F=p.get(S.from)??0,Y=p.get(S.to)??0,oe=Ie(S.label,ua(S.label))+u.padX*2;F===Y?F<b.length&&w.push({from:F,to:F+1,need:c.selfW+u.side+oe+c.labelRoom}):w.push({from:Math.min(F,Y),to:Math.max(F,Y),need:oe+c.labelRoom*2})}w.sort((C,S)=>C.to-C.from-(S.to-S.from));for(const{from:C,to:S,need:F}of w){let Y=0;for(let D=C;D<S;D++)Y+=b[D]??0;if(Y>=F)continue;const oe=(F-Y)/(S-C);for(let D=C;D<S;D++)b[D]=(b[D]??0)+oe}const x=[];f.forEach((C,S)=>x.push(S===0?d+g[0]/2:x[S-1]+b[S-1]));const _=f.map((C,S)=>{const F=n.boxes.find(D=>D.id===C),Y=g[S],oe=x[S];return{id:C,name:F?.name??C,...F?.sub!==void 0?{sub:F.sub}:{},...F?.icon!==void 0?{icon:F.icon}:{},color:r.get(C)??"slate",x:oe-Y/2,y:d,w:Y,h:o.h,cx:oe,cy:d+o.h/2}}),E=d+o.h,M=[],N=[],$=[];let j=E+c.firstRow,G=0,K=!0;n.steps.forEach((C,S)=>{C.events.forEach((F,Y)=>{if(F.type!=="edge"&&F.type!=="action")return;let oe,D;if(F.type==="edge"){const T=F.labelSide??"above",te=F.from===F.to,de=F.label!==void 0;oe=de&&T==="above"?c.labelOffset+u.h/2:a,D=te?c.selfH+a:de&&T==="below"?c.labelOffset+u.h/2:a}else oe=P.action.h/2,D=P.action.h/2;if(j=K?j+oe:j+Math.max(c.minPitch,G+c.rowGap+oe)+(Y===0&&S>0?c.stepGap:0),K=!1,G=D,F.type==="edge"){const T=x[p.get(F.from)??0],te=x[p.get(F.to)??0],de=Math.sign(te-T)||1,ve=T===te?[[T,j],[T+c.selfW,j],[T+c.selfW,j+c.selfH],[T+P.edge.inset,j+c.selfH]]:[[T,j],[te-de*P.edge.inset,j]],Se=Hi(F,r),Ne={};if(F.carry.kind!=="none"){const Ye=P.slot.lifeline+Ao(F.carry)[0],[Fe,ot]=ve,[X,L]=ve.slice(-2),Ee=Math.sign(ot[0]-Fe[0])||1,V=Math.sign(L[0]-X[0])||-1;Ne.wait=[T-Ee*Ye,Fe[1]],Ne.settle=[te+V*Ye,L[1]]}M.push({step:S,event:Y,from:F.from,to:F.to,points:ve,color:Se,carry:F.carry,...Ne}),F.label!==void 0&&$.push({step:S,event:Y,text:F.label,points:ve,color:Se,...F.labelSide?{side:F.labelSide}:T===te?{side:"right"}:{},offset:c.labelOffset})}else{const T=x[p.get(F.box)??0],te=Ie(F.label,ne.action)+P.action.padX*2;N.push({step:S,event:Y,box:F.box,text:F.label,color:r.get(F.box)??"slate",x:T+P.badge.r+4,y:j-P.action.h/2,w:te,h:P.action.h})}})});const q=(K?E:j+G)+c.tail,U=f.map((C,S)=>({id:C,x:x[S],y1:E,y2:q})),z=_o(M,n.steps.length),Q=[];for(const C of $){const S=[...z].filter(([Y])=>Y<=C.step).map(([,Y])=>da(Y.point)),F=[...Q.filter(Y=>Y.step===C.step),...N];Q.push(Cs(C,{hard:_,soft:F,touch:S}))}const re={kind:"sequence",width:0,height:0,regions:[],boxes:_,lifelines:U,edges:M,labels:Q,actions:N,badges:[],paths:[],ends:[]},ue=[..._.map(C=>C.x),...Q.map(C=>C.x),...N.map(C=>C.x)],he=Math.max(0,d-Math.min(...ue));he>0&&Ud(re,he,0);const fe=[..._.map(C=>C.x+C.w),...Q.map(C=>C.x+C.w),...N.map(C=>C.x+C.w),...M.flatMap(C=>C.points.map(S=>S[0]))],Ce=Math.max(Math.max(...fe)+d,Co(n)+d*2),$e=Oo(n,d,q+a,Ce-d*2);return re.width=Ce,re.height=($e?$e.y+$e.h:q)+d,$e&&(re.strip=$e),re.badges=G1(n,re),re}function G1(n,o){const c=_o(o.edges,n.steps.length),u=n.steps.map((d,a)=>{const r=c.get(a);if(r)return{step:a,x:r.point[0],y:r.point[1],color:r.edge.color};const l=o.actions.find(p=>p.step===a),f=l&&o.lifelines.find(p=>p.id===l.box);return l&&f?{step:a,x:f.x,y:l.y+l.h/2,color:l.color}:Pd(d.events,a,o)});return Mo(u)}var hg=n=>Oi.includes(n);function Y1(n){const o=[],c=u=>{!hg(u)&&!o.includes(u)&&o.push(u)};for(const{edge:u}of Fi(n))c(u.from),c(u.to);return o}var V1=(n,o)=>n.from===o.from&&n.to===o.to;function X1(n,o){const{box:c,state:u,margin:d,gap:a}=P,r=P.edge.inset,l=cs[o],f=$o(n),p=Fi(n),g=Y1(n),b=n.boxes.map(R=>R.id).filter(R=>!g.includes(R)),w=(n.state?.paths??[]).filter(R=>!p.some(({edge:pe})=>V1(pe,R))),x=[...p.map(({edge:R})=>R),...w],_=u.ghost,E=R=>{const pe=n.boxes.find(De=>De.id===R);return _.pad*2+c.icon+_.gap+Math.max(Ie(pe?.name??R,ne.boxName),Ie(pe?.sub??"",ne.boxSub))},M=Ll(n),N=Math.max(c.padX,u.done.inset+u.done.r+P.slot.clear),$=new Map(n.boxes.map(R=>[R.id,b.includes(R.id)?E(R.id):Math.max(Do(n,R.id,!0),Ul(M.get(R.id),R.icon!==void 0,N))])),j=Math.max(1,Math.min(u.columns,g.length)),G=Math.max(1,Math.ceil(g.length/u.columns)),K=new Map(g.map((R,pe)=>{const De=Math.floor(pe/u.columns),Je=pe%u.columns;return[R,{row:De,col:De%2===0?Je:j-1-Je}]})),q=Array.from({length:j},(R,pe)=>Math.max(c.minW,...g.filter(De=>K.get(De)?.col===pe).map(De=>$.get(De)??c.minW))),U=Array.from({length:Math.max(0,j-1)},()=>u.columnGap);for(const R of x){const pe=K.get(R.from),De=K.get(R.to);if(!pe||!De||R.label===void 0||pe.row!==De.row||Math.abs(pe.col-De.col)!==1)continue;const Je=Math.min(pe.col,De.col);U[Je]=Math.max(U[Je]??0,Ie(R.label,ua(R.label))+P.label.padX*2+u.labelRoom*2)}const z=[];for(let R=0;R<j;R++)z.push(R===0?d:z[R-1]+q[R-1]+U[R-1]);const Q=R=>z[R]+q[R]/2,re=R=>b.includes(R),ue=new Set(w.filter(R=>re(R.to)&&!re(R.from)&&!hg(R.from)).map(R=>R.from)),he=[l.sideNote,...ue.size>0?[l.sideFrom(ue.size)]:[]],fe=Math.max(Ie(l.side,ne.regionName),...he.map(R=>Ie(R,ne.regionNote))),Ce=u.side.pad*2+Math.max(_.h,ne.regionName.size+P.region.line*he.length+u.side.pad/4),$e=x.some(R=>R.from==="start"),C=d+(b.length>0?Ce+u.side.gap:$e?u.start+u.drop:0),S=R=>C+R*(c.h+u.rowGap),F=(R,pe,De,Je)=>{const Pe=n.boxes.find(bt=>bt.id===R),We=$.get(R)??c.minW,Ft=Je?_.h:c.h;return{id:R,name:Pe?.name??R,...Pe?.sub!==void 0?{sub:Pe.sub}:{},...Pe?.icon!==void 0?{icon:Pe.icon}:{},color:f.get(R)??"slate",x:pe-We/2,y:De,w:We,h:Ft,cx:pe,cy:De+Ft/2,...Je?{ghost:!0}:{}}},Y=g.map(R=>{const pe=K.get(R);return F(R,Q(pe.col),S(pe.row),!1)});for(const R of Y)Pl(R,M.get(R.id),N);const oe=new Map(Y.map(R=>[R.id,R])),D=R=>Y.some(pe=>pe!==R&&Math.abs(pe.cx-R.cx)<.5&&pe.y>R.y),T=[],te=Y[0],de=Math.max(...Y.map(R=>R.x+R.w));let ve;const Se=d+Ce+u.side.lane;if(b.length>0){const R=bt=>w.filter(zt=>zt.to===bt).flatMap(zt=>oe.get(zt.from)??[]),pe=b.flatMap(R),De=Math.max(d,Math.min(...pe.length>0?pe.map(bt=>bt.x):[d+u.side.pad])-u.side.pad);let Je=De+u.side.pad+fe+a*2;const Pe=b.map(bt=>{const zt=R(bt);return{id:bt,cx:zt.length>0?zt.reduce((Fn,O)=>Fn+O.cx,0)/zt.length:Je}});Pe.sort((bt,zt)=>bt.cx-zt.cx);let We=De;for(const{id:bt,cx:zt}of Pe){const Fn=$.get(bt)??c.minW,O=Math.max(zt-Fn/2,Je),B=F(bt,O+Fn/2,d+(Ce-_.h)/2,!0);Y.push(B),oe.set(bt,B);const I=w.some(ge=>ge.from===bt&&ge.to==="finish");I&&T.push({kind:"finish",x:B.x+B.w+u.beside,y:B.cy,r:u.end.r,ghost:!0,text:"",box:bt}),We=I?B.x+B.w+u.beside+u.end.r:B.x+B.w,Je=We+a*2}const Ft=Math.max(We+u.side.pad,de);ve={x:De,y:d,w:Ft-De,h:Ce,title:l.side,notes:he}}if(te&&$e){const R=te.cx+u.start+u.text+Ie(l.start,ne.regionNote)+a,pe=ve&&R<ve.x?ve.y+u.side.pad+u.start:te.y-u.drop;T.unshift({kind:"start",x:te.cx,y:pe,r:u.start,ghost:!1,text:l.start})}for(const R of Y.filter(pe=>!pe.ghost&&x.some(De=>De.from===pe.id&&De.to==="finish")))T.push(D(R)?{kind:"finish",x:R.x+R.w+u.beside,y:R.cy,r:u.end.r,ghost:!1,text:l.end,box:R.id}:{kind:"finish",x:R.cx,y:R.y+R.h+u.below,r:u.end.r,ghost:!1,text:l.end,box:R.id});const Ne=(R,pe)=>{const De=K.get(R.id),Je=K.get(pe.id);if(!De||!Je)return[[R.cx,R.y+R.h],[pe.cx,pe.y-r]];if(De.row===Je.row&&Math.abs(De.col-Je.col)===1)return pe.cx>R.cx?[[R.x+R.w,R.cy],[pe.x-r,pe.cy]]:[[R.x,R.cy],[pe.x+pe.w+r,pe.cy]];if(De.row===Je.row){const We=R.y+R.h+u.rowGap/4;return[[R.cx,R.y+R.h],[R.cx,We],[pe.cx,We],[pe.cx,pe.y+pe.h+r]]}if(Je.row>De.row){if(Math.abs(R.cx-pe.cx)<.5)return[[R.cx,R.y+R.h],[pe.cx,pe.y-r]];const We=R.y+R.h+u.rowGap/2;return[[R.cx,R.y+R.h],[R.cx,We],[pe.cx,We],[pe.cx,pe.y-r]]}if(Math.abs(R.cx-pe.cx)<.5)return[[R.cx,R.y],[pe.cx,pe.y+pe.h+r]];const Pe=pe.y+pe.h+u.rowGap/2;return[[R.cx,R.y],[R.cx,Pe],[pe.cx,Pe],[pe.cx,pe.y+pe.h+r]]},Ye=(R,pe)=>{const De=w.filter(Pe=>Pe.to===pe.id).flatMap(Pe=>oe.get(Pe.from)??[]).sort((Pe,We)=>Pe.cx-We.cx),Je=De.findIndex(Pe=>Pe.id===R);return De.length<=1?Math.min(Math.max(De[0]?.cx??pe.cx,pe.x+u.side.entry),pe.x+pe.w-u.side.entry):pe.x+u.side.entry+(pe.w-u.side.entry*2)*Math.max(0,Je)/(De.length-1)},Fe=R=>$e&&R===te?R.cx+u.side.entry:R.cx,ot=R=>T.find(pe=>pe.kind==="finish"&&pe.box===R),X=(R,pe)=>{if(R==="start"){const Pe=T.find(Ft=>Ft.kind==="start"),We=oe.get(pe);return!Pe||!We?[]:[[Pe.x,Pe.y+Pe.r],[We.cx,We.y-r]]}const De=oe.get(R);if(!De)return[];if(pe==="finish"){const Pe=ot(R);return Pe?Math.abs(Pe.x-De.cx)<.5?[[De.cx,De.y+De.h],[De.cx,Pe.y-Pe.r-r]]:[[De.x+De.w,De.cy],[Pe.x-Pe.r-r,De.cy]]:[]}const Je=oe.get(pe);if(!Je)return[];if(R===pe)return Ld(De);if(Je.ghost&&!De.ghost){const Pe=Fe(De),We=Ye(R,Je);return Math.abs(Pe-We)<.5?[[Pe,De.y],[We,Je.y+Je.h+r]]:[[Pe,De.y],[Pe,Se],[We,Se],[We,Je.y+Je.h+r]]}return De.ghost&&Je.ghost?[[De.x+De.w,De.cy],[Je.x-r,Je.cy]]:De.ghost?[[De.cx,De.y+De.h],[De.cx,Se],[Je.cx,Se],[Je.cx,Je.y-r]]:Ne(De,Je)},L=R=>{const pe=R.to==="finish"?ot(R.from):void 0;if(!pe)return;const De=oe.get(R.from);return De&&Math.abs(pe.x-De.cx)<.5?[pe.x-pe.r-a-Ao(R.carry)[0],pe.y]:[pe.x,pe.y+pe.r+a+P.carrier.tagH/2]},Ee=R=>{const pe=R.from==="start"?T.find(De=>De.kind==="start"):void 0;return pe?[pe.x-pe.r-P.slot.mark-Ao(R.carry)[0],pe.y]:void 0},V=p.map(({step:R,event:pe,edge:De})=>{const Je=L(De),Pe=De.carry.kind==="none"?void 0:Ee(De);return{step:R,event:pe,from:De.from,to:De.to,points:X(De.from,De.to),color:J1(De,f),carry:De.carry,...Je?{settle:Je}:{},...Pe?{wait:Pe}:{}}});Ri(V,oe,M);const ye=new Map;for(const R of V){if(R.points.length!==2||!V.some(We=>We.from===R.to&&We.to===R.from&&We.points.length===2))continue;const[pe,De]=R.points,Je=Math.abs(De[1]-pe[1])<Math.abs(De[0]-pe[0]),Pe=(R.from<R.to?1:-1)*P.edge.parallel;R.points=R.points.map(([We,Ft])=>Je?[We,Ft+Pe]:[We+Pe,Ft]),ye.set(R,Je?Pe>0?"below":"above":Pe>0?"right":"left")}const k=w.map(R=>({from:R.from,to:R.to,points:X(R.from,R.to)})),W=(R,pe,De)=>R.from===R.to?og(R.points):To(R.points,pe,De),Z=[],be=T.flatMap(R=>R.text===""?[]:[Ma(R.text,...rg(R),ne.regionNote)]),Be=[..._o(V,n.steps.length,W).values()].map(R=>da(R.point)),Ae=[...ve?[{x:ve.x,y:ve.y,w:u.side.pad+fe,h:ve.h}]:[],...be],_e=R=>[...V.map(pe=>pe.points),...k.map(pe=>pe.points)].filter(pe=>pe!==R);for(const R of V){const pe=n.steps[R.step]?.events[R.event];if(pe?.type!=="edge"||pe.label===void 0)continue;const De=R.from===R.to,Je=Ol(R),Pe=Z.filter(Fn=>Fn.text===pe.label&&V.some(O=>O.step===Fn.step&&O.event===Fn.event&&Ol(O)===Je)),We=Pe[Pe.length-1];if(We){We.until=R.step,Z.push({x:We.x,y:We.y,w:We.w,h:We.h,step:R.step,event:R.event,text:We.text,family:We.family,color:R.color});continue}const Ft=Ie(pe.label,ua(pe.label))+P.label.padX*2,bt=De?{side:"below",base:ig(R.points,Ft)}:{},zt=pe.labelSide??(R.to==="finish"?"left":ye.get(R));Z.push(Cs({step:R.step,event:R.event,text:pe.label,points:R.points,color:R.color,...zt?{side:zt}:De?{}:{flip:!0},...bt},{hard:Y,soft:[...Ae,...Z],touch:Be,lines:_e(R.points)}))}const je=[];w.forEach((R,pe)=>{const De=k[pe];if(R.label===void 0||De.points.length===0)return;const Je=ua(R.label),Pe=oe.get(R.to)?.ghost===!0&&oe.get(R.from)?.ghost!==!0,We=De.points[0][0],Ft=Pe?{side:"below",base:{x:We+P.label.soft,y:Se+P.label.soft},slide:Math.max(...De.points.map(([zt])=>Math.abs(zt-We)))}:{},bt=Cs({step:-1,event:pe,text:R.label,points:De.points,color:"slate",...Ft},{hard:Y,soft:[...Ae,...Z,...je],touch:Be,lines:_e(De.points)});je.push(bt),De.label={x:bt.x,y:bt.y,w:bt.w,h:bt.h,text:R.label,family:Je.family}});const qe={kind:"state",width:0,height:0,regions:[],boxes:Y,lifelines:[],edges:V,labels:Z,actions:[],badges:[],paths:k,ends:T,...ve?{side:ve}:{}},nt=[...Y.map(R=>R.x),...Z.map(R=>R.x),...k.flatMap(R=>R.label?[R.label.x]:[])],_t=[...Z.map(R=>R.y),...k.flatMap(R=>R.label?[R.label.y]:[])],Ut=Math.max(0,d-Math.min(...nt)),rt=_t.length>0?Math.max(0,d-Math.min(..._t)):0;(Ut>0||rt>0)&&Ud(qe,Ut,rt);const Vt=R=>R.x+(R.text===""?R.r:u.text+Ie(R.text,ne.regionNote)),Zt=[...Y.map(R=>R.x+R.w),...Z.map(R=>R.x+R.w),...T.map(Vt),...V.flatMap(R=>R.points.map(pe=>pe[0])),...k.flatMap(R=>[...R.points.map(pe=>pe[0]),...R.label?[R.label.x+R.label.w]:[]]),...ve?[ve.x+ve.w]:[]],sn=[...Y.map(R=>R.y+R.h),...Z.map(R=>R.y+R.h),...T.map(R=>R.y+R.r),...V.flatMap(R=>R.points.map(pe=>pe[1]))],qn={title:l.trail,states:g.map(R=>({box:R,color:f.get(R)??"slate"}))},cn=Math.max(Math.max(...Zt)+d,Co(n,qn)+d*2),Xt=Math.max(...sn,S(G-1)+c.h),yn=Oo(n,d,Xt+a,cn-d*2,qn);qe.width=cn,qe.height=(yn?yn.y+yn.h:Xt)+d,yn&&(qe.strip=yn);const un=_o(V,n.steps.length,W);return qe.badges=Mo(n.steps.map((R,pe)=>{const De=un.get(pe);return De?{step:pe,x:De.point[0],y:De.point[1],color:De.edge.color}:Pd(R.events,pe,qe)})),qe}function J1(n,o){return n.carry.kind==="coin"?Hi(n,o):o.get(n.to==="finish"?n.from:n.to)??"slate"}var pg=n=>n.kind==="time",Gl={d:86400,h:3600,min:60,s:1,ms:.001},Q1=Object.keys(Gl);function Z1(n){const o=/^([0-9]+(?:\.[0-9]+)?)(ms|s|min|h|d)$/u.exec(n);if(!o)return{seconds:1,unit:"s"};const c=o[2];return{seconds:Number(o[1])*Gl[c],unit:c}}var c0=(n,o)=>Q1.find(c=>n/Gl[c]>=2-1e-9)??o,u0=(n,o,c)=>`${Number((n/Gl[o]).toFixed(2))} ${cs[c].timeUnits[o]}`;function K1(n,o,c){let u=1;if(o)u=o*Math.max(1,Math.ceil(n/o/8));else for(let r=1;;r*=10){const l=[r,r*2,r*5].find(f=>n/f<=P.time.ticks);if(l!==void 0){u=l;break}}const d=[];for(let r=0;r<=n;r+=u)d.push(r);const a=d[d.length-1];return a!==n&&(n-a)*c>=P.time.minorPx&&d.push(n),{at:d,step:u}}function W1(n,o,c,u){const d=Array.from({length:o-1},(r,l)=>l+1).find(r=>o%r===0&&r*c>=P.time.minorPx);if(d===void 0)return[];const a=[];for(let r=d;r<n;r+=d)u.includes(r)||a.push(r);return a}function d0(n){let o=0;return n.steps.map(c=>{const u=o;for(const d of c.events)d.type==="now"&&(o=Math.max(o,d.to+1));return[u,o]})}function I1(n,o="ja"){const c=P.time,{margin:u,gap:d}=P,a=P.region,r=cs[o],l=n.time??{scale:{unit:"",length:"1s",count:1},rows:[]},{scale:f}=l,p=Math.max(1,f.count),g=Z1(f.length),b=Math.max(c.width,Co(n)+u*2),w=Math.max(0,...l.rows.map(V=>Ie(V.name,ne.timeRow))),x=Math.max(c.axisX,u+a.inset+w+c.gutterGap),_=b-c.right-x,E=_/p,M=$o(n),N=Ll(n),$=[],j=[],G=[],K=[],q=new Map(l.rows.map(V=>[V.id,V]));let U,z=u;if(l.zoom){const{from:V,to:ye}=l.zoom,k=ye-V+1,W=_/k,Z=u,be=c0(ye*g.seconds,g.unit),Be=[];for(let je=0;je<k;je++){const qe=V+je,nt=x+je*W,_t=n.boxes.map((rt,Vt)=>{const Zt=N.get(rt.id),sn=Math.max(Do(n,rt.id,!1),Ul(Zt,rt.icon!==void 0,P.box.padX)),qn=Z+c.boxTop+Vt*(P.box.h+c.boxGap),cn=q.get(rt.id),Xt={id:rt.id,name:rt.name,...rt.sub!==void 0?{sub:rt.sub}:{},...rt.icon!==void 0?{icon:rt.icon}:{},color:M.get(rt.id)??"slate",x:nt+W/2-sn/2,y:qn,w:sn,h:P.box.h,cx:nt+W/2,cy:qn+P.box.h/2,...cn?{row:cn.id}:{},...cn?.empty?.includes(qe)?{empty:!0}:{}};return Pl(Xt,Zt),Xt});j.push(..._t);const Ut=`${f.unit} ${(f.from??0)+qe}${r.headJoin}${u0(qe*g.seconds,be,o)}`;Be.push({unit:qe,head:Ut,boxes:_t,x:nt,y:Z,w:W,h:0})}const _e=Math.max(Z+c.boxTop,...j.map(je=>je.y+je.h))+c.zoomBottom;for(const je of Be)je.h=_e-Z;$.push({id:"zoom",lines:[r.zoom],note:`${k} ${f.unit}`,icon:"clock",color:"blue",x:u,y:Z,w:b-u*2,h:_e-Z,header:{x:u+a.inset,y:Z+a.inset,w:Math.max(a.icon,Ie(r.zoom,ne.regionName)),h:a.nameY-a.inset+a.line}}),U={from:V,to:ye,frame:{x:0,y:0,w:0,h:0},guides:[],columns:Be,empty:r.empty,headY:Z+c.head},z=_e+c.zoomGap}const Q=z+c.rowsTop,re=l.rows.map((V,ye)=>({id:V.id,name:V.name,color:V.color??M.get(V.id)??Eo[ye%Eo.length],x,y:Q+ye*(c.row+c.rowGap),w:_,h:c.row})),ue=re.length>0?Math.max(...re.map(V=>V.y+V.h)):Q,he=Math.min(c.markMax,Math.max(c.markMin,E*c.markRatio)),fe=re.flatMap((V,ye)=>Array.from({length:p},(k,W)=>({row:V.id,unit:W,empty:l.rows[ye]?.empty?.includes(W)===!0,color:V.color,colors:[],x:x+(W+.5)*E-he/2,y:V.y,w:he,h:V.h})));if(n.steps.forEach((V,ye)=>V.events.forEach((k,W)=>{if(k.type==="mark")for(const Z of fe)Z.row===k.row&&Z.unit>=k.from&&Z.unit<=k.to&&!Z.empty&&Z.colors.push({step:ye,event:W,color:k.color})})),U){const V={x:x+U.from*E-c.frame,y:Q-c.frame,w:(U.to-U.from+1)*E+c.frame*2,h:ue-Q+c.frame*2},ye=Math.max(...U.columns.map(k=>k.y+k.h));U.frame=V,U.guides=[[[V.x,V.y],[x,ye]],[[V.x+V.w,V.y],[x+_,ye]]]}const Ce=ue+c.point.drop,$e=(l.points??[]).map(V=>{const ye=[];n.steps.forEach((Ae,_e)=>Ae.events.forEach((je,qe)=>{je.type==="swap"&&je.box===V.id&&ye.push({step:_e,event:qe,text:je.text,...je.color?{color:je.color}:{}})}));const k=x+(V.at+.5)*E,W=k+c.point.text,Z=Math.max(Ie(V.id,ne.pointName),...ye.map(Ae=>Ie(Ae.text,ne.pointState))),be=Ce+c.point.nameY-ne.pointName.size*.8,Be=Ce+c.point.stateY+ne.pointState.size*.2;return{id:V.id,unit:V.at,cx:k,cy:Ce,r:c.point.r,text:{x:W,y:be,w:Z,h:Be-be},changes:ye}}),C=new Map($e.map(V=>[V.id,V])),S=(V,ye)=>C.get(V)?.changes.filter(W=>W.step<=ye&&W.color).at(-1)?.color;n.steps.forEach((V,ye)=>V.events.forEach((k,W)=>{if(k.type!=="edge")return;if(k.at===void 0){const Be=C.get(k.from),Ae=C.get(k.to);if(!Be||!Ae||Be===Ae)return;const _e=Ae.cx>Be.cx,je=_e?Math.max(Be.cx+Be.r,Be.text.x+Be.text.w+c.point.link):Be.cx-Be.r-c.point.end,qe=_e?Ae.cx-Ae.r-c.point.end:Math.min(Ae.cx-Ae.r,Ae.text.x+Ae.text.w+c.point.link),nt={step:ye,event:W,from:k.from,to:k.to,points:[[je,Be.cy],[qe,Ae.cy]],color:k.carry.kind==="coin"?"coin":S(k.to,ye)??"slate",carry:k.carry};k.carry.kind!=="none"&&(nt.settle=[qe-(_e?1:-1)*(P.carrier.coinR+P.edge.arrow),Ae.cy]),G.push(nt);return}const Z=ex(k,U);if(!Z)return;const be={step:ye,event:W,from:k.from,to:k.to,points:Z.points,color:Hi(k,M),carry:k.carry};tx(be,Z.from,Z.to,N),G.push(be),K.push({step:ye,event:W,from:Z.from,to:Z.to,column:k.at,into:k.into??k.at})}));const F={kind:"time",width:b,height:0,regions:$,boxes:j,lifelines:[],edges:G,labels:[],actions:[],badges:[],paths:[],ends:[],axis:{x,w:_,unit:E,count:p,line:0},rows:re,marks:fe,ticks:[],minor:[],periods:[],points:$e,...U?{zoom:U}:{},spans:[],wires:K,needle:{y1:Q-c.needle.over,y2:ue+c.needle.over}},Y=ue,oe=n.steps.some(V=>V.events.some(ye=>ye.type==="edge"&&ye.at===void 0&&ye.label!==void 0)),{r:D,inset:T}=P.badge;let te=$e.length>0?Ce+c.point.r+(oe?c.point.room:c.point.plain):Y+(D+T)*2;const de=[],ve=n.steps.flatMap((V,ye)=>V.events.flatMap((k,W)=>k.type==="span"?[{s:ye,e:W,event:k}]:[]));for(const{s:V,e:ye,event:k}of ve){const W=k.shape==="box"?"box":"bracket",Z=ve.find(je=>je.s>V&&(je.event.shape==="box"?"box":"bracket")===W&&je.event.from<=k.to&&k.from<=je.event.to),be=k.color??"slate",Be=x+k.from*E,Ae=x+(k.to+1)*E,_e={step:V,event:ye,kind:W,from:k.from,to:k.to,text:k.text,color:be,...Z?{until:Z.s}:{}};if(W==="box"){const je=c.box,qe={x:Be-je.pad,y:Q-je.pad,w:Ae-Be+je.pad*2,h:ue-Q+je.pad*2},nt=Ie(k.text,ne.tag)+je.tagPadX*2,_t={x:qe.x+je.tagX,y:qe.y-je.tagH/2,w:nt,h:je.tagH};de.push({..._e,...qe,textRect:_t,textY:qe.y+P.baseline.tag})}else de.push({..._e,x:Be,y:0,w:Ae-Be,h:c.bracket.tick,textRect:{x:0,y:0,w:0,h:0},textY:0})}F.spans=de,F.badges=h0(n,F,d0(n)),F.labels=ax(n,F),te=Math.max(te,...F.labels.map(V=>V.y+V.h+P.label.soft));const Se=[];for(const V of de.filter(ye=>ye.kind==="bracket")){const ye=Ie(V.text,ne.spanText),k=Math.min(x+_-ye/2,Math.max(x+ye/2,V.x+V.w/2)),W={x:Math.min(V.x,k-ye/2),w:Math.max(V.x+V.w,k+ye/2)-Math.min(V.x,k-ye/2)},Z=Be=>{const Ae=Be.until===void 0||Be.until>V.step,_e=Math.min(Be.x,Be.textRect.x),je=Math.max(Be.x+Be.w,Be.textRect.x+Be.textRect.w)-_e;return Ae&&W.x<_e+je&&_e<W.x+W.w};let be=Se.findIndex(Be=>!Be.some(Z));be<0&&(Se.push([]),be=Se.length-1),Se[be].push(V),V.y=te+c.bracket.gap+be*c.bracket.lane,V.textY=V.y+c.bracket.tick+c.bracket.text,V.textRect=Ma(V.text,k,V.textY,ne.spanText,"middle")}Se.length>0&&(te=Math.max(...de.filter(V=>V.kind==="bracket").map(V=>V.textRect.y+V.textRect.h)));const Ne=te+c.axisGap;F.axis.line=Ne;const Ye=K1(p,l.period?.length,E),Fe=Ne+c.tickY,ot=c0(p*g.seconds,g.unit);F.ticks=Ye.at.map(V=>{const ye=u0(V*g.seconds,ot,o),k=Ie(ye,ne.timeTick),W=x+V*E,Z=V===0?W:V===p?W-k:Math.min(x+_-k,Math.max(x,W-k/2));return{at:V,x:W,text:ye,left:Z,y:Fe}}),F.minor=W1(p,Ye.step,E,Ye.at);let X=Fe+ne.timeTick.size*.2;if(l.period){const V=l.period,ye=[];for(let Z=0,be=0;be<p;Z++,be+=V.length){const Be=Math.min(p,be+V.length)-1,Ae=`${V.name} ${(V.from??0)+Z}`,_e=(f.from??0)+be,je=`${f.unit} ${r.range(String(_e),String((f.from??0)+Be))}`;ye.push({index:Z,from:be,to:Be,name:Ae,range:je,x:x+be*E,y:Ne,w:(Be-be+1)*E,h:0,nameY:Fe,rangeY:Fe+c.rangeY})}const k=F.ticks.map(Z=>Ma(Z.text,Z.left,Z.y,ne.timeTick)),W=ye.some(Z=>{const be=Ma(Z.name,Z.x+Z.w/2,Z.nameY,ne.timePeriod,"middle");return k.some(Be=>be.x<Be.x+Be.w+c.nameGap&&Be.x<be.x+be.w+c.nameGap)});for(const Z of ye)W&&(Z.nameY=Fe+c.rangeY+2,Z.rangeY=Z.nameY+c.rangeY),Z.h=Z.rangeY+ne.timeRange.size*.2-Ne;F.periods=ye,X=Math.max(X,...ye.map(Z=>Z.rangeY+ne.timeRange.size*.2))}const L=X+c.bottom;$.push({id:"axis",lines:[],color:"slate",x:u,y:z,w:b-u*2,h:L-z,header:{x:u+a.inset,y:z+a.inset,w:0,h:0}});const Ee=Oo(n,u,L+d,b-u*2);return Ee&&(F.strip=Ee),F.height=(Ee?Ee.y+Ee.h:L)+u,F.badges=h0(n,F,d0(n)),F}function ex(n,o){if(!o||n.at===void 0)return;const c=n.into??n.at,u=o.columns.find(x=>x.unit===n.at),d=o.columns.find(x=>x.unit===c),a=u?.boxes.find(x=>x.id===n.from),r=d?.boxes.find(x=>x.id===n.to);if(!u||!d||!a||!r||a===r)return;const l=u.boxes.indexOf(a),f=d.boxes.indexOf(r),p=f>l;if(u===d){if(Math.abs(f-l)===1)return{from:a,to:r,points:[[a.cx,p?a.y+a.h+1:a.y-1],[r.cx,p?r.y-1:r.y+r.h+1]]};const x=Math.min(u.x+u.w-P.gap,Math.max(a.x+a.w,r.x+r.w)+P.gap);return{from:a,to:r,points:[[a.x+a.w+1,a.cy],[x,a.cy],[x,r.cy],[r.x+r.w+1,r.cy]]}}const g=d.x>u.x;if(l===f)return{from:a,to:r,points:[[g?a.x+a.w+1:a.x-1,a.cy],[g?r.x-1:r.x+r.w+1,r.cy]]};const b=a.cx+(g?1:-1)*a.w/4,w=r.cx-(g?1:-1)*r.w/4;return{from:a,to:r,points:[[b,p?a.y+a.h+1:a.y-1],[w,p?r.y-1:r.y+r.h+1]]}}function tx(n,o,c,u){const d={...n};Ri([d],new Map([[n.to,c]]),u);const a={...n};Ri([a],new Map([[n.from,o]]),u),d.settle&&(n.settle=d.settle),a.wait&&(n.wait=a.wait)}function h0(n,o,c){const{r:u,inset:d}=P.badge,{axis:a}=o,r=[],l=[],f=Math.min(...o.rows.map(b=>b.y),o.needle.y1+P.time.needle.over),p=Math.max(...o.rows.map(b=>b.y+b.h),f),g=o.points[0]?(p+o.points[0].cy-o.points[0].r)/2:p+u+d;return n.steps.forEach((b,w)=>{const x=($,j)=>{r.push($),l.push({step:w,x:$[0],y:$[1],color:j})},_=o.edges.filter($=>$.step===w).sort(($,j)=>$.event-j.event)[0];if(_){const $=_.carry.kind!=="none"&&!_.wait?[_.points[0]]:[],j=o.edges.filter(G=>G!==_).map(G=>G.points);x(To(_.points,[...r,...$],j),_.color);return}const[E,M]=c[w]??[0,0];if(M>E){let $=a.x+(E+M)/2*a.unit;const j=o.points.find(G=>Math.abs(G.cx-$)<u+d);j&&($=j.cx+u+d*2),x([$,g],"slate");return}for(const $ of b.events){const j=nx($,w,o);if(j){x(j.at,j.color);return}}if(o.strip&&b.events.some($=>$.type==="strip")){l.push({step:w,x:o.strip.x+d,y:o.strip.y+d,color:"slate"});return}const N=l[l.length-1];l.push(N?{...N,step:w}:{step:w,x:a.x-u-d,y:f,color:"slate"})}),Mo(l)}function nx(n,o,c){const{r:u,inset:d}=P.badge;if(n.type==="span"){const a=c.spans.find(r=>r.step===o&&r.from===n.from&&r.to===n.to&&r.text===n.text);return a?a.kind==="box"?{at:[a.x,a.y],color:a.color}:{at:[a.x-u-d,a.y+a.h/2],color:a.color}:void 0}if(n.type==="swap"){const a=c.points.find(r=>r.id===n.box);if(a)return{at:[a.cx-a.r-d-u,a.cy],color:n.color??"slate"}}if(n.type==="mark"){const a=c.rows.find(l=>l.id===n.row),r=Math.min(...c.rows.map(l=>l.y));if(a)return{at:[c.axis.x+(n.from+n.to+1)/2*c.axis.unit,r-u-d],color:n.color}}}function ax(n,o){const c=[],u=o.points.map(r=>({x:r.cx-r.r,y:r.cy-r.r,w:r.r*2,h:r.r*2})),d=o.points.map(r=>r.text),a=(o.zoom?.columns??[]).map(r=>Ma(r.head,r.x+r.w/2,o.zoom?.headY??0,ne.timeHead,"middle"));for(const r of o.edges){const l=n.steps[r.step]?.events[r.event];if(l?.type!=="edge"||l.label===void 0)continue;const f=o.badges.filter(g=>g.step<=r.step).map(g=>da([g.x,g.y])),p=l.labelSide??(l.at===void 0?"below":void 0);c.push(Cs({step:r.step,event:r.event,text:l.label,points:r.points,color:r.color,...p?{side:p}:{},flip:l.at!==void 0},{hard:[...u,...o.boxes],soft:[...d,...a,...c.filter(g=>g.step===r.step)],touch:f}))}return c}var Gd=n=>n.kind==="tree";function sx(n){const o=new Set(n.boxes.map(a=>a.id)),c=new Set,u=new Map,d=[];return n.steps.forEach((a,r)=>{a.events.forEach((l,f)=>{if(l.type!=="leaf"&&l.type!=="node"||c.has(l.id)||o.has(l.id))return;const p=l.type==="node"?[...new Set(l.children)].filter(g=>c.has(g)&&!u.has(g)):[];for(const g of p)u.set(g,l.id);d.push({id:l.id,kind:l.type,children:p,step:r,event:f,...l.hash!==void 0?{hash:l.hash}:{}}),c.add(l.id)})}),{grown:d,parents:u}}function ox(n,o){return n.hash===void 0?[{text:n.id,style:ne.boxName}]:o?[{text:n.id,style:ne.rootName},{text:n.hash,style:ne.rootHash}]:n.kind==="leaf"?[{text:n.hash,style:ne.treeHash}]:[{text:n.hash,style:ne.treeHash},{text:n.id,style:ne.treeName}]}function ix(n,o){const c=P.edge.inset,u=Math.max(n.y,o.y),d=Math.min(n.y+n.h,o.y+o.h);if(d>u){const p=(u+d)/2;return o.x>=n.x+n.w?[[n.x+n.w+c,p],[o.x-c,p]]:[[n.x-c,p],[o.x+o.w+c,p]]}const a=Math.max(n.x,o.x),r=Math.min(n.x+n.w,o.x+o.w);if(r>a){const p=(a+r)/2;return o.y>=n.y+n.h?[[p,n.y+n.h+c],[p,o.y-c]]:[[p,n.y-c],[p,o.y+o.h+c]]}const l=n.x+n.w/2,f=o.y+o.h/2;return[[l,o.y>n.y?n.y+n.h+c:n.y-c],[l,f],[o.x>l?o.x-c:o.x+o.w+c,f]]}function rx(n){const{margin:o,gap:c,box:u,tree:d,badge:a}=P,{grown:r,parents:l}=sx(n),f=r.filter(L=>!l.has(L.id)),p=f[f.length-1]?.id,g=new Map(r.map(L=>[L.id,L])),b=new Map,w=(L,Ee)=>{b.set(L,Ee);for(const V of g.get(L)?.children??[])w(V,Ee+1)};for(const L of f)w(L.id,0);const x=new Map(r.map(L=>[L.id,ox(L,L.id===p)])),_=L=>Math.max(0,...(x.get(L)??[]).map(Ee=>Ie(Ee.text,Ee.style))),E=L=>L.id===p?Math.max(d.root.w,d.root.textX+_(L.id)+d.root.padR):Math.max(d.w,_(L.id)+d.padX*2),M=L=>Math.max(d.card.minW,d.card.padX*2+d.card.icon+d.card.gap+Ie(L.id,ne.treeCard)),N=L=>L.kind==="leaf"&&L.hash!==void 0,$=r.filter(L=>L.children.length===0),j=Math.max(...r.filter(L=>L.id!==p||L.children.length===0).map(L=>Math.max(E(L),N(L)?M(L):0)),d.w)+d.slotGap,G=o+a.r*2+a.inset,K=new Map;$.forEach((L,Ee)=>K.set(L.id,G+j*(Ee+.5)));const q=L=>{const Ee=K.get(L);if(Ee!==void 0)return Ee;const V=g.get(L)?.children??[],ye=(q(V[0])+q(V[V.length-1]))/2;return K.set(L,ye),ye},U=o+d.top,z=L=>U+d.root.h/2+L*d.row,Q=$o(n),re=r.map(L=>{const Ee=L.id===p,V=b.get(L.id)??0,ye=q(L.id),k=z(V),W=E(L),Z=Ee?d.root.h:d.h,be=x.get(L.id)??[],Be=be.length===1?[k+d.oneY]:Ee?[k+d.root.nameY,k+d.root.hashY]:[k+d.hashY,k+d.nameY],Ae=l.get(L.id),_e=Ee?d.rootColor:d.color;Q.set(L.id,_e);const je=M(L);return{id:L.id,kind:L.kind,depth:V,...Ae!==void 0?{parent:Ae}:{},children:L.children,step:L.step,event:L.event,...L.hash!==void 0?{hash:L.hash}:{},root:Ee,x:ye-W/2,y:k-Z/2,w:W,h:Z,cx:ye,cy:k,color:_e,lines:be.map(qe=>qe.text),baselines:Be,styles:be.map(qe=>qe.style),...N(L)?{card:{x:ye-je/2,y:k+d.card.drop-d.card.h/2,w:je,h:d.card.h,text:L.id}}:{}}}),ue=new Map(re.map(L=>[L.id,L])),he=re.flatMap(L=>L.children.flatMap(Ee=>{const V=ue.get(Ee);if(!V)return[];const ye=(V.y+L.y+L.h)/2,k=[[V.cx,V.y-P.edge.inset],[V.cx,ye],[L.cx,ye],[L.cx,L.y+L.h+P.edge.inset]];return[{from:V.id,to:L.id,step:L.step,event:L.event,points:k}]})),fe=Ll(n),Ce=Math.max(G,...re.flatMap(L=>[L.x+L.w,...L.card?[L.card.x+L.card.w]:[]])),$e=re.find(L=>L.root),C=new Set(n.boxes.map(L=>L.id)),S=Fi(n).flatMap(({edge:L})=>L.label!==void 0&&(C.has(L.from)||C.has(L.to))?[Ie(L.label,ua(L.label))+P.label.padX*2]:[]),F=Math.max(Ce+d.boxGap,($e?$e.x+$e.w:G)+Math.max(0,...S)+c*2);let Y=$e?.y??U;const oe=n.boxes.map(L=>{const Ee=Math.max(Do(n,L.id,!0),Ul(fe.get(L.id),L.icon!==void 0,u.padX)),V=Y;Y+=u.h+c;const ye={id:L.id,name:L.name,...L.sub!==void 0?{sub:L.sub}:{},...L.icon!==void 0?{icon:L.icon}:{},color:Q.get(L.id)??"slate",x:F,y:V,w:Ee,h:u.h,cx:F+Ee/2,cy:V+u.h/2};return Pl(ye,fe.get(L.id)),ye}),D=new Map(oe.map(L=>[L.id,L])),T=[],te=n.steps.flatMap((L,Ee)=>L.events.flatMap((V,ye)=>{if(V.type!=="edge")return[];const k=ue.get(V.from)??D.get(V.from),W=ue.get(V.to)??D.get(V.to);if(!k||!W)return[];const Z=he.find(_e=>_e.from===V.from&&_e.to===V.to),be=he.find(_e=>_e.from===V.to&&_e.to===V.from),Be=Z??be;Be&&T.push({step:Ee,event:ye,link:Be.from});const Ae=Z?Z.points:be?[...be.points].reverse():V.from===V.to?Ld({cx:k.x+k.w/2,y:k.y,h:k.h}):ix(k,W);return[{step:Ee,event:ye,from:V.from,to:V.to,points:Ae,color:Hi(V,Q),carry:V.carry}]}));Ri(te,D,fe);const de={kind:"tree",width:0,height:0,regions:[],boxes:oe,lifelines:[],edges:te,labels:[],actions:[],badges:[],paths:[],ends:[],nodes:re,links:he,runs:T};de.badges=p0(n,de),de.labels=ux(n,de);const ve=re.flatMap(L=>L.card?[L.card]:[]),Se=[...re,...ve,...oe,...de.labels],Ne=te.flatMap(L=>L.points),Ye=Math.max(...Se.map(L=>L.x+L.w),...Ne.map(([L])=>L),G),Fe=Math.max(...Se.map(L=>L.y+L.h),...Ne.map(([,L])=>L),U),ot=Math.max(Ye+o,Co(n)+o*2),X=Oo(n,o,Fe+c,ot-o*2);return de.width=ot,de.height=(X?X.y+X.h:Fe)+o,X&&(de.strip=X),de.badges=p0(n,de),de}function p0(n,o){const{r:c,inset:u}=P.badge,d=c*2+u,a=[],r=[],l=[...o.nodes,...o.nodes.flatMap(b=>b.card?[b.card]:[]),...o.boxes],f=b=>a.every(([w,x])=>Math.hypot(b[0]-w,b[1]-x)>=d)&&l.every(w=>ko(da(b),w)>=P.label.touch),p=(b,w,x)=>{a.push(w),r.push({step:b,x:w[0],y:w[1],color:x})},g=new Map;return n.steps.forEach((b,w)=>{const x=b.events.findIndex(G=>G.type==="leaf"||G.type==="node"||G.type==="edge"),_=b.events[x],E=o.nodes.find(G=>G.step===w&&G.event===x);if(_&&_.type!=="edge"&&E){const G=[[E.x-u-c,E.cy],[E.x,E.y],[E.x+E.w+u+c,E.cy],[E.x+E.w,E.y]];p(w,G.find(f)??G[0],E.color);return}const M=o.edges.find(G=>G.step===w&&G.event===x);if(_?.type==="edge"&&M){const G=[M.from,M.to].sort().join(`
`),K=o.runs.some(z=>z.step===w&&z.event===x),q=o.edges.filter(z=>z!==M).map(z=>z.points),U=g.get(G)??(K?lx(M.points,f):cx(M,f))??To(M.points,a,q);g.set(G,U),p(w,U,M.color);return}const N=b.events.flatMap(G=>G.type==="swap"||G.type==="action"?[G.box]:[]).flatMap(G=>o.boxes.filter(K=>K.id===G))[0];if(N){r.push({step:w,x:N.x,y:N.y,color:N.color});return}if(o.strip&&b.events.some(G=>G.type==="strip")){r.push({step:w,x:o.strip.x+u,y:o.strip.y+u,color:"slate"});return}const $=r[r.length-1],j=o.nodes.find(G=>G.root);r.push($?{...$,step:w}:{step:w,x:j?.x??P.margin,y:j?.y??P.margin,color:j?.color??"slate"})}),Mo(r)}function lx(n,o){const[c,u,d]=n,a=Math.abs(d[0]-u[0]),{r,inset:l}=P.badge;if(a>=P.tree.badgeAlong+r){const p=Ca(n,No([c,u])+P.tree.badgeAlong);if(o(p))return p}const f=[u[0]+r+l,u[1]];return o(f)?f:void 0}function cx(n,o){const c=No(n.points),u=Ao(n.carry)[0]+P.badge.r+P.badge.inset;for(let d=0;d<=c/2-u;d+=1)for(const a of[c/2-d,c/2+d]){const r=Ca(n.points,a);if(o(r))return r}}function ux(n,o){const c=[],u=o.nodes.flatMap(d=>d.card?[d.card]:[]);for(const d of o.edges){const a=n.steps[d.step]?.events[d.event];if(a?.type!=="edge"||a.label===void 0)continue;const r=o.badges.filter(l=>l.step<=d.step).map(l=>da([l.x,l.y]));c.push(Cs({step:d.step,event:d.event,text:a.label,points:d.points,color:d.color,...a.labelSide?{side:a.labelSide}:{},flip:!0},{hard:[...o.nodes,...o.boxes],soft:[...u,...c.filter(l=>l.step===d.step)],touch:r}))}return c}function f0(n,o){const c={edges:[],events:[],busy:0};let u=Ge.edgeAt,d,a=0,r=Number.NEGATIVE_INFINITY;const l=(w,x,_)=>{const E=x.carry.kind!=="none",M=_+(E?Ge.drawCarry:Ge.draw);return c.edges.push({event:w,a:_,b:M,carries:E,coin:x.carry.kind==="coin",named:x.label!==void 0}),c.busy=Math.max(c.busy,M),M},f=o?n.events.flatMap((w,x)=>w.type==="now"?[{e:x,to:w.to}]:[]):[],p=o?.from??0,g=Math.max(p,...f.map(w=>w.to+1)),b=w=>w.type==="edge"&&w.at!==void 0&&w.at>=p&&w.at<g;return n.events.forEach((w,x)=>{if(o&&x===f[0]?.e){let _=Math.max(u,r+Ge.change);const E=[[_,p]],M=[];for(let N=p;N<g;N++){const $=_,j=n.events.flatMap((q,U)=>b(q)&&q.at===N?[{k:U,ev:q}]:[]),G=j.reduce((q,U,z)=>Math.max(q,l(U.k,U.ev,$+Ge.stagger*z)),$),K=Math.max($+o.speed,j.length>0?G+Ge.time.wait:$);K-o.speed>$+1e-9&&E.push([K-o.speed,N]),E.push([K,N+1]),M.push({unit:N,at:K}),_=K}c.sweep={keys:E,passed:M},c.busy=Math.max(c.busy,_),u=_+Ge.time.after,d=_,a=0;return}if(!(w.type==="now"||o&&b(w)))if(w.type==="commit"||w.type==="branch"||w.type==="leaf"||w.type==="node"){const _=u,E=_+Ge.draw;c.edges.push({event:x,a:_,b:E,carries:!1,coin:!1,named:!1}),u=_+Ge.stagger,d=E,a=0,c.busy=Math.max(c.busy,E)}else if(w.type==="edge"){const _=u;d=l(x,w,_),u=_+Ge.stagger,a=0}else if(w.type==="action")c.events.push({event:x,at:u}),c.busy=Math.max(c.busy,u+Ge.action),u+=Ge.action,a=0;else{const _=(d??u)+Ge.change*a++;c.events.push({event:x,at:_}),c.busy=Math.max(c.busy,_),r=Math.max(r,_)}}),c.edges.sort((w,x)=>w.a-x.a),c}function dx(n,o=!1){const c=n.kind==="time"?n.time:void 0,u=Ge.time,d=c?Math.min(u.unitMax,Math.max(u.unitMin,u.axis/Math.max(1,c.scale.count))):0;let a=0;const r=n.steps.map(Q=>{if(!c)return f0(Q);const re=f0(Q,{from:a,speed:d});return a=re.sweep?.keys[re.sweep.keys.length-1]?.[1]??a,re}),l=[];let f=Ge.intro;n.steps.forEach((Q,re)=>{const ue=Math.min(Ge.stepMax,Math.max(Ge.stepMin,Ge.stepBase+[...Q.body].length*Ge.perChar)),he=Math.max(ue,(r[re]?.busy??0)+Ge.dwell);l.push({start:f,end:f+he}),f+=he});const g=Math.ceil(f+Ge.outro),b=g-Ge.tail,w=l[l.length-1],x=o&&w?{start:w.start+(r[r.length-1]?.busy??0),end:b}:void 0,_=x?.start??b,E=[],M=[],N=[],$=[];r.forEach((Q,re)=>{const ue=l[re],he=[];for(const fe of Q.edges){const Ce=ue.start+fe.a;E.push({step:re,event:fe.event,start:Ce,drawn:ue.start+fe.b,end:ue.end});const $e=n.steps[re]?.events[fe.event],C=n.kind==="git"&&$e?.type==="edge"&&$e.carry.kind==="tag"&&$e.carry.text===$e.from;fe.carries&&!C&&$.push({step:re,event:fe.event,who:fe.coin?"coin":"main",a:Ce,b:ue.start+fe.b}),fe.named&&he.push({step:re,event:fe.event,start:Ce+Ge.labelDelay,end:ue.end})}he.forEach((fe,Ce)=>{const $e=he[Ce+2];$e&&(fe.end=Math.min(fe.end,$e.start))});for(const fe of he)x&&fe.end>x.start?fe.end=x.end:(n.kind==="state"&&fe.end<_&&(fe.after={start:fe.end,end:_}),x&&(fe.again=x));M.push(...he);for(const fe of Q.events)N.push({step:re,event:fe.event,at:ue.start+fe.at})});const j=l[0]?.start??0,G=$.some(Q=>Q.who==="main"),K=[];for(const Q of["main","coin"]){const re=$.filter(ue=>ue.who===Q);re.forEach((ue,he)=>{const fe=re[he+1],Ce=he===0&&(Q==="main"||!G);K.push({step:ue.step,event:ue.event,who:Q,depart:ue.a,arrive:ue.b,start:Ce?Math.min(j,ue.a):ue.a,end:fe?Math.max(fe.a,ue.b):b})})}K.sort((Q,re)=>Q.depart-re.depart);const q=n.kind==="state"?fx(n,E,b):void 0,U=[[0,0]],z=[];return r.forEach((Q,re)=>{const ue=l[re].start;for(const[he,fe]of Q.sweep?.keys??[])U.push([ue+he,fe]);for(const he of Q.sweep?.passed??[])z.push({unit:he.unit,passed:ue+he.at})}),U.push([g,a]),{total:g,last:b,steps:l,edges:E,carriers:K,labels:M,badges:l.map((Q,re)=>({step:re,appears:Q.start})),events:N,stills:l.map(Q=>Q.end-Ge.still),...x?{whole:x}:{},...q?{states:q}:{},...c?{needle:U,units:z,meters:hx(n,r,l)}:{}}}function hx(n,o,c){const u=n.time?.period?.length;return(n.strip?.meters??[]).map(({field:d})=>{const a=[[0,0]];let r=0;return o.forEach((l,f)=>{const p=c[f].start,g=(n.steps[f]?.events??[]).flatMap((E,M)=>{const N=E.type==="strip"&&E.field===d&&E.value!==void 0?lg(E.value):void 0;return N===void 0?[]:[{e:M,ratio:N}]}),b=g[g.length-1];if(!b)return;const w=l.sweep?.keys??[],x=w[0],_=w[w.length-1];if(x&&_&&_[1]>x[1]){const[E,M]=[x[1],_[1]];let N=r,$=E;const j=u?Math.floor((M-1e-9)/u)*u:0;if(j>0&&j>=E){const G=p+(w.find(([,q])=>q===j)?.[0]??x[0]),K=a[a.length-1][0];a.push([Math.max(K,G-Ge.time.reset),r],[G,0]),N=0,$=j}for(const[G,K]of w)K>=$&&a.push([p+G,N+(b.ratio-N)*(K-$)/(M-$)])}else{const E=p+(l.events.find(M=>M.event===b.e)?.at??0);a.push([E,r],[E+Ge.fade,b.ratio])}r=b.ratio}),{field:d,keys:a}})}var px=n=>Oi.includes(n);function fx(n,o,c){const u=new Map,d=r=>{const l=u.get(r)??{box:r,lit:[]};return u.set(r,l),l};let a;for(const r of o){const l=n.steps[r.step]?.events[r.event];if(!(l?.type!=="edge"||l.from===l.to)){if(a){const f=d(a.box);f.lit.push({start:a.since,end:r.start}),a.box===l.from&&f.done===void 0&&(f.done=r.start+Ge.done),a=void 0}px(l.to)||(a={box:l.to,since:r.drawn})}}return a&&d(a.box).lit.push({start:a.since,end:c}),[...u.values()]}var Os={app:"M -9 -7 h18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z M -11 -2 h22",router:"M -9 -4 h16 M 3 -8 l4 4 l-4 4 M 9 5 h-16 M -3 1 l-4 4 l4 4",on:"M -7 7 L 7 -7 M -1 -7 h8 v8",off:"M -7 -7 L 7 7 M 7 -1 v8 h-8",pool:"M -9 -5 a9 3.5 0 1 0 18 0 a9 3.5 0 1 0 -18 0 M -9 -5 v10 a9 3.5 0 0 0 18 0 v-10 M -9 0 a9 3.5 0 0 0 18 0",db:"M -9 -5 a9 3.5 0 1 0 18 0 a9 3.5 0 1 0 -18 0 M -9 -5 v10 a9 3.5 0 0 0 18 0 v-10 M -9 0 a9 3.5 0 0 0 18 0",exe:"M -5 -8 L 7 0 L -5 8 Z",idx:"M -9 -7 h18 M -9 -2 h18 M -9 3 h18 M -9 8 h11",sign:"M -9 4 c 3 -9 5 -9 6 0 s 3 7 6 -2 s 3 -6 6 0",env:"M -8 -5.5 h16 v11 h-16 z M -8 -5.5 l8 6 l8 -6",lock:"M -5.5 -1 h11 v8 h-11 z M -3.5 -1 v-3 a3.5 3.5 0 0 1 7 0 v3",check:"M -5 0 l3.5 3.5 l6.5 -7",flag:"M -4 8 V -8 M -4 -7 H 6 L 3.5 -3.5 L 6 0 H -4",x:"M -5 -5 l10 10 M 5 -5 l-10 10",chain:"M -1.5 4.5 l-2 2 a3.5 3.5 0 0 1 -5 -5 l3 -3 a3.5 3.5 0 0 1 5 0 M 1.5 -4.5 l2 -2 a3.5 3.5 0 0 1 5 5 l-3 3 a3.5 3.5 0 0 1 -5 0 M -2.5 2.5 l5 -5",net:"M -1.3 -4.6 L -5.8 3 M 1.3 -4.6 L 5.8 3 M -4.3 5.5 H 4.3 M -2.2 -7 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 M -9.2 5.5 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 M 4.8 5.5 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0",user:"M -4 -4.5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M -8 9 c0 -5 3.6 -7.5 8 -7.5 s8 2.5 8 7.5",server:"M -9 -8 h18 v7 h-18 z M -9 1 h18 v7 h-18 z M -5 -4.5 h0.01 M -5 4.5 h0.01",key:"M -9 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0 M -2 0 h10 M 5 0 v3.5 M 8 0 v2.5",shield:"M 0 -9 l8 3 v5 c0 5 -3.5 8 -8 10 c-4.5 -2 -8 -5 -8 -10 v-5 z",globe:"M -9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M -9 0 h18 M 0 -9 c-4.5 4 -4.5 14 0 18 M 0 -9 c4.5 4 4.5 14 0 18",bolt:"M 2 -9 L -5 1 h5 l-2 8 l7 -10 h-5 z",doc:"M -6 -9 h8 l5 5 v13 h-13 z M 2 -9 v5 h5 M -3 1 h7 M -3 5 h5",box:"M -9 -4.5 l9 -4.5 l9 4.5 v9 l-9 4.5 l-9 -4.5 z M -9 -4.5 l9 4.5 l9 -4.5 M 0 0 v9",truck:"M -10 -6 h11 v10 h-11 z M 1 -2 h5 l3.5 3.5 v2.5 h-8.5 M -7.5 6.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0 M 3 6.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0",card:"M -9 -6.5 h18 a2 2 0 0 1 2 2 v9 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-9 a2 2 0 0 1 2 -2 z M -11 -2 h22 M -7 3 h5",cart:"M -10 -8 h3 l3 11 h11 l2.5 -8 h-15.5 M -4.5 7.5 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M 5 7.5 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0",clock:"M -9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M 0 -5 v5 l3.5 2.5",branch:"M -4 -4.5 v9 M 5 0.5 c0 4 -9 3 -9 6.5 M -6.2 -7 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 M -6.2 7 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 M 2.8 -2 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0",cloud:"M -7 6 h13 a4.5 4.5 0 0 0 0.5 -9 a6 6 0 0 0 -11.5 -1 a4.5 4.5 0 0 0 -2 10 z",refresh:"M 7 -3 a7.5 7.5 0 1 0 0.5 5 M 7.5 -8 v5 h-5",undo:"M -7 -2 h10 a5 5 0 0 1 0 10 h-6 M -3 -6 l-4 4 l4 4",yen:"M -6 -8 l6 7 l6 -7 M 0 -1 v9 M -5 1.5 h10 M -5 5 h10",layers:"M 0 -8 l9 4.5 l-9 4.5 l-9 -4.5 z M -9 2.5 l9 4.5 l9 -4.5",code:"M -4 -6 l-5 6 l5 6 M 4 -6 l5 6 l-5 6",paint:"M -8 8 c 0 -3 2 -5 4.5 -5 l 9 -9 l 3.5 3.5 l -9 9 c 0 2.5 -2 4.5 -5 4.5 z",tree:"M 0 -5 v4 M -6 -1 h12 M -6 -1 v3 M 6 -1 v3 M -9 2 h6 v6 h-6 z M 3 2 h6 v6 h-6 z M -3 -10 h6 v5 h-6 z",block:"M -9 -7 h18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z M -11 -2.5 h22 M -6 2.5 h8"},Wn=[[0,Number.POSITIVE_INFINITY]],ld=.5,m0=(n,o)=>n.shown.some(([c,u])=>c<=o&&o<u),cd=n=>({text:n.text,rect:{x:n.rect.x,y:n.rect.y,w:n.rect.w,h:n.rect.h},badge:n.badge===!0,...n.part?{part:n.part}:{}});function mx(n,o,c=[]){const u=[];return o.forEach((d,a)=>{const r=n.filter(f=>m0(f,d));r.forEach((f,p)=>{for(const g of r.slice(p+1)){const b=Math.min(f.rect.x+f.rect.w,g.rect.x+g.rect.w)-Math.max(f.rect.x,g.rect.x),w=Math.min(f.rect.y+f.rect.h,g.rect.y+g.rect.h)-Math.max(f.rect.y,g.rect.y);b>ld&&w>ld&&u.push({kind:"texts",step:a,texts:[f.text,g.text],spots:[cd(f),cd(g)]})}});const l=c.filter(f=>m0(f,d));for(const f of r)if(!f.boxed)for(const p of l)Hd(p.points,f.rect,ld)&&u.push({kind:"line",step:a,text:f.text,line:{from:p.from,to:p.to},spots:[cd(f)]})}),u}function gx(n,o="ja"){const c=cs[o],u=a=>a.kind==="icon"?c.iconOf(a.box):a.kind==="coin"?c.coin:c.envelope,d=a=>a.badge?c.badgeName(a.text):a.part?u(a.part):c.quoted(a.text);return n.kind==="texts"?c.textsOverlap(d(n.spots[0]),d(n.spots[1])):c.lineCrosses(n.line.from,n.line.to,d(n.spots[0]))}var wt=n=>n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),fg=(n,o)=>n===void 0?o:`<a href="${wt(n)}">${o}</a>`,Me=n=>Math.round(n*100)/100,pt=n=>n==="coin"?"--c:var(--coin);--ct:var(--coint)":`--c:var(--c-${n});--ct:var(--t-${n})`;function Oa(n,o,c,u,d="dg-gl"){const a=n===void 0?void 0:Os[n];return a?`<path class="${d}" transform="translate(${Me(o)} ${Me(c)}) scale(${u})" d="${a}"/>`:""}function yx(n){return Object.hasOwn(Os,n)?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${P.stroke.glyph*P.box.iconScale}" stroke-linecap="round" stroke-linejoin="round"><path d="${Os[n]}"/></svg>`:void 0}function is(n){const o=n.filter((a,r)=>r===0||a[0]!==n[r-1][0]||a[1]!==n[r-1][1]),[c,u]=o[0];let d=`M ${Me(c)} ${Me(u)}`;for(let a=1;a<o.length-1;a++){const[r,l]=o[a-1],[f,p]=o[a],[g,b]=o[a+1],w=Math.hypot(f-r,p-l),x=Math.hypot(g-f,b-p),_=Math.min(P.edge.bend,w/2,x/2);d+=` L ${Me(f-(f-r)/w*_)} ${Me(p-(p-l)/w*_)} Q ${Me(f)} ${Me(p)} ${Me(f+(g-f)/x*_)} ${Me(p+(b-p)/x*_)}`}if(o.length>1){const[a,r]=o[o.length-1];d+=` L ${Me(a)} ${Me(r)}`}return d}function Yl(n){const[o,c]=n[n.length-1],[u,d]=n[n.length-2],a=Math.hypot(o-u,c-d)||1,r=(o-u)/a,l=(c-d)/a,{arrow:f,arrowHalf:p}=P.edge;return`M ${Me(o-r*f-l*p)} ${Me(c-l*f+r*p)} L ${Me(o)} ${Me(c)} L ${Me(o-r*f+l*p)} ${Me(c-l*f-r*p)}`}function Ct(n,o,c,u,d,a,r=Wn,l){return n?.push({text:d,rect:Ma(d,c,u,a,l),shown:r}),`<text class="${o}" x="${Me(c)}" y="${Me(u)}"${l?` text-anchor="${l}"`:""}>${wt(d)}</text>`}function mg(n,o){const c=[[0,{opacity:0}]];for(const[u,d]of o)c.push([u,{opacity:0},st.out],[u+Ge.fade,{opacity:1}],[d-.1,{opacity:1},st.inOut],[d+.25,{opacity:0}]);return c.push([n.total,{opacity:0}]),n.kf(c)}function Yd(n,o){const c=[];for(let u=0;u<o.length;){let d=u;for(;d+1<o.length&&o[d+1]===o[d]+1;)d++;c.push([n.t.steps[o[u]].start,n.t.steps[o[d]].end]),u=d+1}return mg(n.m,c)}function bx(n,o){const{radius:c,icon:u,iconRadius:d,iconScale:a,nameY:r,line:l}=P.region,{x:f,y:p}=n.header,g=n.lines.map((x,_)=>Ct(o,"dg-bz",f,n.y+r+_*l,x,ne.regionName)).join(""),b=n.note?Ct(o,"dg-bx",f,n.y+r+n.lines.length*l+1,n.note,ne.regionNote):"",w=n.icon&&Os[n.icon]?`<rect class="dg-bi" x="${Me(f)}" y="${Me(p)}" width="${u}" height="${u}" rx="${d}"/>${Oa(n.icon,f+u/2,p+u/2,a)}`:"";return`<g style="${pt(n.color)}"><rect class="dg-band" x="${Me(n.x+.5)}" y="${Me(n.y+.5)}" width="${Me(n.w-1)}" height="${Me(n.h-1)}" rx="${c}"/>${w}${g}${b}</g>`}function gg(n,o,c,u,d){const a=[[0,n.sub??"","dg-ss"],...c];return a.map(([r,l,f],p)=>{const g=a[p+1]?.[0],b=p===0?g===void 0?"":o.until(g-Ge.untilFade):g===void 0?o.rise(r):o.rise(r,g-Ge.untilFade);if(l==="")return"";const w=[[p===0?0:r,g===void 0?Number.POSITIVE_INFINITY:g-Ge.untilFade]];return`<g${b?` class="dg-a" style="${b}"`:""}>${Ct(d,f,n.cx,u,l,f==="dg-ss"?ne.boxSub:ne.boxSubStrong,w,"middle")}</g>`}).join("")}function yg(n,o,c,u,d){const a=(r,l="")=>`<rect class="${r}" x="${Me(n.x)}" y="${Me(u)}" width="${Me(n.w)}" height="${d}" rx="${P.box.radius}"${l}/>`;return`${c?`<g class="dg-a" style="${c}">${a("dg-halo")}</g>`:""}${a("dg-st",` ${o.sh}`)}${c?`<g class="dg-a" style="${c}">${a("dg-on")}</g>`:""}`}function bg(n,o,c,u,d){const{icon:a,iconRadius:r,iconScale:l,iconY:f,nameY:p,subY:g}=P.box,b=gg(n,o.m,u,n.cy+g,o.ink),w=d?d.length>0?mg(o.m,d.map(M=>[M.start,M.end])):void 0:c.length>0?Yd(o,c):void 0,x=n.iconX??n.cx,_=n.slot?`<rect class="dg-slot" x="${Me(n.slot.x)}" y="${Me(n.slot.y)}" width="${Me(n.slot.w)}" height="${Me(n.slot.h)}" rx="${P.slot.radius}"/>`:"";let E="";if(n.icon&&Os[n.icon]){const M={x:x-a/2,y:n.cy+f-a/2,w:a,h:a};o.ink.push({text:`${n.name} の絵柄`,rect:M,shown:Wn,boxed:!0,part:{kind:"icon",box:n.name}}),E=`<rect class="dg-ic" x="${Me(M.x)}" y="${Me(M.y)}" width="${a}" height="${a}" rx="${r}"/>${Oa(n.icon,x,n.cy+f,l)}`}return`<g style="${pt(n.color)}">${yg(n,o,w,n.y,n.h)}${_}${E}${Ct(o.ink,"dg-sn",n.cx,n.cy+p,n.name,ne.boxName,Wn,"middle")}${b}</g>`}function vx(n,o,c,u){const{pad:d,h:a,nameY:r,subY:l}=P.follow.head,f=gg(n,o.m,u,d+l),p=c.length>0?Yd(o,c):void 0;return`<g style="${pt(n.color)}">${yg(n,o,p,d,a)}<text class="dg-sn" x="${Me(n.cx)}" y="${Me(d+r)}" text-anchor="middle">${wt(n.name)}</text>${f}</g>`}function xx(n,o){const{icon:c,iconRadius:u,iconScale:d,radius:a}=P.box,r=P.state.ghost,l=n.x+r.pad+c/2,f=n.x+r.pad+c+r.gap,p=n.icon&&Os[n.icon]?`<rect class="dg-ic" x="${Me(l-c/2)}" y="${Me(n.cy-c/2)}" width="${c}" height="${c}" rx="${u}"/>${Oa(n.icon,l,n.cy,d)}`:"",g=n.sub?r.nameY:P.baseline.mark,b=n.sub?Ct(o,"dg-ss",f,n.cy+r.subY,n.sub,ne.boxSub,Wn,"start"):"";return`<g data-ghost="${wt(n.id)}" style="${pt(n.color)}"><rect class="dg-ghost" x="${Me(n.x)}" y="${Me(n.y)}" width="${Me(n.w)}" height="${n.h}" rx="${a}"/>${p}${Ct(o,"dg-sn",f,n.cy+g,n.name,ne.boxName,Wn,"start")}${b}</g>`}function wx(n,o,c){const{r:u,inset:d}=P.state.done,a=n.x+n.w-d,r=n.y+d;return`<g class="dg-popc dg-a" data-done="${wt(n.id)}" style="${pt(n.color)};${c.m.pop(o)}"><circle class="dg-done" cx="${Me(a)}" cy="${Me(r)}" r="${u}"/>${Oa("check",a,r,.5,"dg-done-ck")}</g>`}function kx(n,o,c,u){u.push({from:n.from,to:n.to,points:n.points,shown:Wn});const d=n.label?.family==="sans",a=n.label?Ct(c,`dg-path-t${d?" dg-path-tj":""}`,n.label.x+P.label.padX,n.label.y+n.label.h/2+P.baseline.label,n.label.text,d?ne.labelJa:ne.label):"";return`<g data-path="${wt(`${n.from}->${n.to}`)}" style="${pt(o)}"><path class="dg-path" d="${is(n.points)}"/><path class="dg-path-h" d="${Yl(n.points)}"/>${a}</g>`}function Ex(n,o,c){const{pad:u}=P.state.side,d=n.y+u+ne.regionName.size,a=n.notes.map((r,l)=>Ct(c,"dg-side-n",n.x+u,d+P.region.line*(l+1),r,ne.regionNote)).join("");return`<g style="${pt(o)}"><rect class="dg-side" x="${Me(n.x+.5)}" y="${Me(n.y+.5)}" width="${Me(n.w-1)}" height="${Me(n.h-1)}" rx="${P.region.radius}"/>${Ct(c,"dg-side-t",n.x+u,d,n.title,ne.regionName)}${a}</g>`}function Ax(n,o,c){const{end:u}=P.state,d=rg(n),a=n.text===""?"":Ct(c,"dg-mark",d[0],d[1],n.text,ne.regionNote),r=Me(n.x),l=Me(n.y);return n.kind==="start"?`<g data-end="start"><circle class="dg-start" cx="${r}" cy="${l}" r="${n.r}"/>${a}</g>`:n.ghost?`<g data-end="finish" style="${pt(o)}"><circle class="dg-end-x" cx="${r}" cy="${l}" r="${n.r}"/><circle class="dg-end-xi" cx="${r}" cy="${l}" r="${u.inner}"/>${a}</g>`:`<g data-end="finish"><circle class="dg-end" cx="${r}" cy="${l}" r="${n.r}"/><circle class="dg-end-in" cx="${r}" cy="${l}" r="${u.inner}"/>${a}</g>`}function _x(n,o,c){return`<line class="dg-ll" x1="${Me(n)}" y1="${Me(o)}" x2="${Me(n)}" y2="${Me(c)}"/>`}function Sx(n,o,c,u=!1){const{m:d}=c;c.traces.push({from:n.from,to:n.to,points:n.points,shown:Wn});const a=is(n.points),r=Yl(n.points),{start:l,drawn:f,end:p}=o,g=u?[[p,{opacity:1},st.inOut],[p+.4,{opacity:0}],[d.total,{opacity:0}]]:[[p,{opacity:1},st.inOut],[p+.4,{opacity:.45}],[c.end+.3,{opacity:.45},st.inOut],[c.end+1,{opacity:.95}],[d.last,{opacity:.95},st.inOut],[d.total,{opacity:0}]],b=d.kf([[0,{opacity:0,"stroke-dashoffset":1}],[l,{opacity:0,"stroke-dashoffset":1},st.inOut],[l+.05,{opacity:1}],[f,{"stroke-dashoffset":0}],[d.last,{"stroke-dashoffset":0}],[d.total,{"stroke-dashoffset":1}],...g]),w=d.kf([[0,{opacity:0}],[f-.05,{opacity:0}],[f,{opacity:1}],...g]),x=-(p-f)*26,_=d.kf([[0,{opacity:0,"stroke-dashoffset":0}],[f,{opacity:0,"stroke-dashoffset":0}],[f+.25,{opacity:.9}],[p-.1,{opacity:.9},st.inOut],[p+.2,{opacity:0,"stroke-dashoffset":x}],[d.total,{opacity:0,"stroke-dashoffset":x}]]),E=u?d.kf([[0,{opacity:0}],[p,{opacity:0},st.inOut],[p+.4,{opacity:1}],[d.last,{opacity:1},st.inOut],[d.total,{opacity:0}]]):"";return{base:`<path class="dg-e" d="${a}"/><path class="dg-eh" d="${r}"/>${u?`<path class="dg-e-past dg-a" d="${a}" style="${E}"/><path class="dg-eh-past dg-a" d="${r}" style="${E}"/>`:""}`,lit:`<g style="${pt(n.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${a}" style="${b}"/><path class="dg-eh-on dg-a" d="${r}" style="${w}"/><path class="dg-flow dg-a" d="${a}" style="${_}"/></g>`}}function $x(n,o,c){const u=n.family==="sans"?" dg-capj":"",{radius:d}=P.label,a=o.again?[[o.start,o.end],[o.again.start,o.again.end]]:[[o.start,o.end]];c.ink.push({text:n.text,rect:n,shown:a,boxed:!0}),o.after&&c.ink.push({text:n.text,rect:Ma(n.text,n.x+n.w/2,n.y+n.h/2+P.baseline.label,n.family==="sans"?ne.labelJa:ne.label,"middle"),shown:[[o.after.start,o.after.end]]});const r=Me(n.x+n.w/2),l=Me(n.y+n.h/2+P.baseline.label),f=o.after?`<g class="dg-cap-past${n.family==="sans"?" dg-cap-pastj":""} dg-a" style="${c.m.vis(o.after.start,o.after.end)}"><text x="${r}" y="${l}" text-anchor="middle">${wt(n.text)}</text></g>`:"",p=a.map(([g,b])=>`<g class="dg-cap${u} dg-a" style="${pt(n.color)};${c.m.rise(g,b,!0)}"><rect x="${Me(n.x)}" y="${Me(n.y)}" width="${Me(n.w)}" height="${n.h}" rx="${d}"/><text x="${r}" y="${l}" text-anchor="middle">${wt(n.text)}</text></g>`);return`${f}${p.join("")}`}function g0(n,o,c,u,d){const a=d?[[o,c],[d.start,d.end]]:[[o,c]];return u.ink.push({text:n.text,rect:n,shown:a,boxed:!0}),a.map(([r,l])=>`<g class="dg-act dg-a" style="${pt(n.color)};${u.m.rise(r,l,!0)}"><rect x="${Me(n.x)}" y="${Me(n.y)}" width="${Me(n.w)}" height="${n.h}" rx="${P.action.radius}"/><text x="${Me(n.x+n.w/2)}" y="${Me(n.y+n.h/2+P.baseline.action)}" text-anchor="middle">${wt(n.text)}</text></g>`).join("")}function Dx(n,o){const c=P.carrier;if(n.carry.kind==="coin")return`<circle class="dg-coin" r="${c.coinR}"/><circle class="dg-coin-in" r="${c.coinIn}"/>`;if(n.carry.kind==="tag"){const u=n.carry.text,d=Kn(u),a=Ie(u,d?ne.carrierJa:ne.carrier)+c.tagPadX*2;return`<rect class="dg-car" x="${Me(-a/2)}" y="${-18/2}" width="${Me(a)}" height="${c.tagH}" rx="${c.tagH/2}" ${o}/><text class="dg-car-t${d?" dg-car-tj":""}" y="${P.baseline.carrier}" text-anchor="middle">${wt(u)}</text>`}return`<rect class="dg-env" x="${-24/2}" y="${-17/2}" width="${c.envW}" height="${c.envH}" rx="3" ${o}/><path class="dg-env-in" d="M -8 -4.5 L 0 1.5 L 8 -4.5"/>`}var Nx=n=>n<.5?4*n*n*n:1-(-2*n+2)**3/2;function vg(n,o,c){const{m:u}=c,d=P.carrier.samples,a=n.wait?[n.wait,...n.points]:n.points,r=No(a),{depart:l,arrive:f,start:p,end:g}=o,b=[];for(let q=0;q<=d;q++){const[U,z]=Ca(a,Nx(q/d)*r);b.push([l+(f-l)*q/d,U,z])}const w=b[0],x=b[b.length-1],_=n.settle??[x[1],x[2]],E=[[0,w[1],w[2]],...b];n.settle&&E.push([Math.min(f+.3,Math.max(g,f+.01)),_[0],_[1]]),E.push([g,_[0],_[1]],[u.total,_[0],_[1]]);const[M,N]=Ao(n.carry),$=n.carry.kind==="tag"?n.carry.text:n.carry.kind==="coin"?"硬貨":"封筒",j=n.carry.kind==="tag"?{}:{part:{kind:n.carry.kind==="coin"?"coin":"envelope"}},G=q=>({x:q[0]-M,y:q[1]-N,w:M*2,h:N*2});l>p&&c.ink.push({text:$,rect:G([w[1],w[2]]),shown:[[p,l]],boxed:!0,...j}),c.ink.push({text:$,rect:G(_),shown:[[f,g]],boxed:!0,...j});const K=g<u.last?.05:.18;return`<g class="dg-a" style="${u.move(E,u.blink(p+.02,g,K))}">${Dx(n,c.sh)}</g>`}function Tx(n,o,c=!1){const{m:u}=o,d=o.t.steps[n.step],a=d.start,r=d.end,{r:l,ring:f}=P.badge,p={visibility:"visible"},g={visibility:"hidden"},b=n.until===void 0?void 0:o.t.steps[n.until].start,w=b!==void 0&&b<=r+1e-6,x=u.kf([[0,{opacity:0,transform:"scale(.5)",...g}],[a,{opacity:0,transform:"scale(.5)",...g},st.pop],[a+.35,{opacity:1,transform:"scale(1)",...p}],[r,{opacity:1,transform:"scale(1)",...p},st.inOut],[r+(w?Ge.untilFade:.4),{opacity:0,transform:"scale(1)",...g}],[u.total,{opacity:0,transform:"scale(.5)",...g}]]),_=b??u.last,E=w?u.kf([[0,{opacity:0,...g}],[u.total,{opacity:0,...g}]]):u.kf([[0,{opacity:0,...g}],[r,{opacity:0,...g},st.inOut],[r+.4,{opacity:1,...p}],[_,{opacity:1,...p},st.inOut],...b===void 0?[]:[[b+Ge.untilFade,{opacity:0,...g}]],[u.total,{opacity:0,...g}]]),M=u.kf([[0,{opacity:0,transform:"scale(1)"}],[a+.05,{opacity:0,transform:"scale(1)"}],[a+.1,{opacity:.7,transform:"scale(1)"},st.out],[a+.9,{opacity:0,transform:"scale(2.3)"}],[u.total,{opacity:0,transform:"scale(1)"}]]),N=Me(n.x),$=Me(n.y),j=Me(n.y+P.baseline.badge),G=n.step+1;return o.ink.push({text:String(G),rect:{x:n.x-l,y:n.y-l,w:l*2,h:l*2},shown:[[a,_]],boxed:!0,badge:!0}),`<g class="dg-bd" data-step="${n.step}" style="${pt(n.color)}"><circle class="dg-bdr dg-popc dg-a" cx="${N}" cy="${$}" r="${f}" style="${M}"/><g class="dg-a" style="${E}"><circle class="${c?"dg-bdp-g":"dg-bdp"}" cx="${N}" cy="${$}" r="${f}"/><text class="${c?"dg-bdpt-g":"dg-bdpt"}" x="${N}" y="${j}" text-anchor="middle">${G}</text></g><g class="dg-popc dg-a" style="${x}"><circle class="dg-bdf" cx="${N}" cy="${$}" r="${l}"/><text class="dg-bdft" x="${N}" y="${j}" text-anchor="middle">${G}</text></g></g>`}function Mx(n,o,c,u=!1,d=new Map,a){const{m:r,sh:l}=c,f=P.strip,p=n.y+f.h/2,g=[`<rect class="dg-strip" x="${Me(n.x+.5)}" y="${Me(n.y+.5)}" width="${Me(n.w-1)}" height="${Me(n.h-1)}" rx="${P.region.radius}" ${l}/>`,`<g style="${pt("slate")}"><rect class="dg-bi" x="${Me(n.x+f.pad)}" y="${Me(p-f.icon/2)}" width="${f.icon}" height="${f.icon}" rx="${P.box.iconRadius}"/>${Oa("env",n.x+f.pad+f.icon/2,p,.78)}</g>`,Ct(c.ink,"dg-sh",n.x+f.titleX,p+P.baseline.stripTitle,n.title,ne.stripTitle)];if(n.fields.forEach((b,w)=>{const x=n.fields[w-1];if(x&&x.y===b.y){const $=b.x-f.fieldGap/2;g.push(`<line class="dg-sep" x1="${Me($)}" y1="${Me(b.y+f.sepInset)}" x2="${Me($)}" y2="${Me(b.y+f.h-f.sepInset)}"/>`)}g.push(Ct(c.ink,"dg-fl",b.x,b.y+f.nameY,b.name,ne.fieldName));const _=a?.(b);if(_!==void 0){g.push(_);return}const E=o.get(b.name)??[],M=E.filter($=>$.value!==void 0),N=E.filter($=>$.tag!==void 0);M.forEach(($,j)=>{const G=M[j+1]?.at,K=$.value,q=Kn(K)?"dg-fvj":"dg-fv";c.ink.push({text:K,rect:Ma(K,b.x,b.y+f.valueY,Kn(K)?ne.fieldValueJa:ne.fieldValue),shown:[[$.at,G===void 0?Number.POSITIVE_INFINITY:G-Ge.untilFade]]});const U=ue=>`<text class="${ue}" x="${Me(b.x)}" y="${Me(b.y+f.valueY)}">${wt(K)}</text>`,z=U(q);if(!u){const ue=G===void 0?r.rise($.at):r.rise($.at,G-Ge.untilFade);g.push(`<g class="dg-a" style="${ue}">${z}</g>`);return}const Q=Math.min($.until,G??$.until),re=`<circle class="dg-fl-now" cx="${Me(b.x+Ie(b.name,ne.fieldName)+f.now.gap)}" cy="${Me(b.y+f.nameY-ne.fieldName.size/3)}" r="${f.now.r}"/>`;g.push(`<g class="dg-fv-now dg-a" data-step="${$.step}" style="${pt($.color)};${r.rise($.at,Q-Ge.untilFade)}">${U(`${q} dg-fv-c`)}${re}</g>`),(G===void 0||G>Q)&&g.push(`<g class="dg-a" style="${r.vis(Q-Ge.untilFade,G===void 0?r.last:G-Ge.untilFade)}">${z}</g>`)}),N.forEach(($,j)=>{const G=N[j+1]?.at,K=$.tag,q=[...M].reverse().find(re=>re.at<=$.at+1e-9)?.value,U=b.x+(q?Ie(q,Kn(q)?ne.fieldValueJa:ne.fieldValue)+f.tagGap:0),z=Ie(K,ne.tag)+f.tagPadX*2,Q=b.y+f.valueY-f.tagH/2-P.baseline.tag;c.ink.push({text:K,rect:{x:U,y:Q,w:z,h:f.tagH},shown:[[$.at,G===void 0?Number.POSITIVE_INFINITY:G-Ge.untilFade]],boxed:!0}),g.push(`<g class="dg-tg dg-popc dg-a" style="${pt($.color)};${G===void 0?r.pop($.at):r.pop($.at,G-Ge.untilFade)}"><rect x="${Me(U)}" y="${Me(Q)}" width="${Me(z)}" height="${f.tagH}" rx="${f.tagH/2}"/><text x="${Me(U+z/2)}" y="${Me(Q+f.tagH/2+P.baseline.tag)}" text-anchor="middle">${wt(K)}</text></g>`)})}),n.trail){const b=n.trail,w=n.fields[n.fields.length-1];if(w&&w.y===b.y){const _=b.x-f.fieldGap/2;g.push(`<line class="dg-sep" x1="${Me(_)}" y1="${Me(b.y+f.sepInset)}" x2="${Me(_)}" y2="${Me(b.y+f.h-f.sepInset)}"/>`)}g.push(Ct(c.ink,"dg-fl",b.x,b.y+f.nameY,b.title,ne.fieldName));const x=b.y+f.valueY-ne.fieldValue.size/3;b.states.forEach((_,E)=>{const M=Me(b.x+f.trail.r+E*f.trail.step),N=d.get(_.box),$=N===void 0?"":`<circle class="dg-tr-fill dg-a" cx="${M}" cy="${Me(x)}" r="${f.trail.r}" style="${r.pop(N)}"/>`;g.push(`<g data-trail="${wt(_.box)}" style="${pt(_.color)}"><circle class="dg-tr-ring" cx="${M}" cy="${Me(x)}" r="${f.trail.r}"/>${$}</g>`)})}return g.join("")}var la=n=>Math.round(n*100)/100,y0=n=>[n.x+n.w/2,n.y+n.h/2];function Cx(n,o){const c=P.carrier,u=Kn(n),d=Ie(n,u?ne.carrierJa:ne.carrier)+c.tagPadX*2;return`<rect class="dg-car" x="${la(-d/2)}" y="${-18/2}" width="${la(d)}" height="${c.tagH}" rx="${c.tagH/2}" ${o}/><text class="dg-car-t${u?" dg-car-tj":""}" y="${P.baseline.carrier}" text-anchor="middle">${wt(n)}</text>`}function Ox(n,o,c,u){const{m:d}=u,a=P.git,r=(x,_)=>c.edges.find(E=>E.step===x&&E.event===_),l=n.links.map(x=>{const _=r(x.step,x.event);if(!_)return"";u.traces.push({from:x.from,to:x.to,points:x.points,shown:[[_.start,Number.POSITIVE_INFINITY]]});const E=is(x.points);if(x.kind==="copy")return`<g style="${pt(x.color)}"><path class="dg-git-cp dg-a" d="${E}" style="${d.vis(_.start,d.last)}"/></g>`;const M=d.kf([[0,{opacity:0,"stroke-dashoffset":1}],[_.start,{opacity:0,"stroke-dashoffset":1},st.inOut],[_.start+.05,{opacity:1}],[_.drawn,{"stroke-dashoffset":0}],[d.last,{opacity:1,"stroke-dashoffset":0},st.inOut],[d.total,{opacity:0,"stroke-dashoffset":0}]]);return`<g style="${pt(x.color)}"><path class="dg-git-l dg-a" pathLength="1" d="${E}" style="${M}"/></g>`}).join(""),f=n.commits.map(x=>{const _=r(x.step,x.event)?.drawn??0,E={x:x.cx-x.r,y:x.cy-x.r,w:x.r*2,h:x.r*2};u.ink.push({text:x.id,rect:E,shown:[[_,Number.POSITIVE_INFINITY]],boxed:!0});const M=(x.text?.lines??[]).map((q,U)=>{const z=U===0&&x.hash!==void 0,Q=x.text?.baselines[U]??x.cy;return Ct(u.ink,z?"dg-git-h":"dg-git-n",x.cx,Q,q,z?ne.gitHash:ne.gitNote,[[_,Number.POSITIVE_INFINITY]],"middle")}).join(""),N=`<text class="dg-git-id" x="${la(x.cx)}" y="${la(x.cy+P.baseline.badge)}" text-anchor="middle">${wt(x.id)}</text>`,$=`<g class="dg-popc dg-a" style="${d.pop(_)}"><circle class="dg-git-c" cx="${la(x.cx)}" cy="${la(x.cy)}" r="${x.r}" ${u.sh}/>${N}</g>`,j=M===""?"":`<g class="dg-a" style="${d.vis(_)}">${M}</g>`,G=x.orphan===void 0?void 0:r(x.orphan,x.orphanEvent??0)?.drawn,K=G===void 0?"":`<g class="dg-a" data-orphan="${wt(x.id)}" style="${d.vis(G,d.last,{f:.5})}"><circle class="dg-git-old" cx="${la(x.cx)}" cy="${la(x.cy)}" r="${a.orphan}"/><text class="dg-git-oldl" x="${la(x.cx)}" y="${la(x.cy+P.baseline.badge)}" text-anchor="middle">${wt(x.id)}</text></g>`;return`<g data-commit="${wt(x.id)}" style="${pt(x.color)}">${$}${j}${K}</g>`}).join(""),p=n.moves.flatMap(x=>{const _=r(x.step,x.event);if(!x.line||!_)return[];const E=c.steps[x.step].end;u.traces.push({from:x.ref,to:x.target??x.ref,points:x.line,shown:[[_.start,E+.4]]});const M=d.kf([[0,{opacity:0,"stroke-dashoffset":1}],[_.start,{opacity:0,"stroke-dashoffset":1},st.inOut],[_.start+.05,{opacity:1}],[_.drawn,{"stroke-dashoffset":0}],[E,{opacity:1},st.inOut],[E+.4,{opacity:0}],[d.total,{opacity:0,"stroke-dashoffset":0}]]);return[`<g style="${pt(x.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${is(x.line)}" style="${M}"/></g>`]}).join(""),g=c.carriers.flatMap(x=>{const _=n.moves.find(N=>N.step===x.step&&N.event===x.event&&N.line),E=o.steps[x.step]?.events[x.event];if(!_?.line||E?.type!=="edge")return[];const M={step:x.step,event:x.event,from:_.ref,to:_.target??_.ref,points:_.line,color:_.color,carry:E.carry};return[vg(M,{...x,start:x.depart,end:x.arrive+Ge.fade},u)]}).join(""),w=[...new Set(n.moves.map(x=>x.ref))].map(x=>Bx(x,n.moves.filter(_=>_.ref===x),r,u)).join("")+g;return{links:l,lines:p,commits:f,tags:w}}function Bx(n,o,c,u){const{m:d}=u,a=[],r=[[0,{opacity:0}]];let l=!1,f;const p=x=>{f&&u.ink.push({text:n,rect:f.rect,shown:[[f.since,x]],boxed:!0}),f=void 0};for(const x of o){const _=c(x.step,x.event);if(!_)continue;const{start:E,drawn:M}=_,N=x.from?y0(x.from):void 0,$=x.to?y0(x.to):void 0;if(p(E),x.carried&&N&&$&&l){a.push([E+Ge.fade,N[0],N[1]],[M-Ge.fade,$[0],$[1]]),r.push([E,{opacity:1},st.inOut],[E+Ge.fade,{opacity:0}],[M-Ge.fade,{opacity:0},st.out],[M,{opacity:1}]),f={rect:x.to,since:M};continue}if(N&&a.push([E,N[0],N[1]]),$&&a.push([M,$[0],$[1]]),$&&!l){const j=N?E:M-Ge.fade;r.push([j,{opacity:0},st.out],[j+Ge.fade,{opacity:1}]),l=!0}else!$&&l&&(r.push([M,{opacity:1},st.inOut],[M+Ge.untilFade,{opacity:0}]),l=!1);x.to&&(f={rect:x.to,since:M})}if(p(Number.POSITIVE_INFINITY),a.length===0)return"";const g=a[0],b=a[a.length-1];l?r.push([d.last,{opacity:1},st.inOut],[d.total,{opacity:0}]):r.push([d.total,{opacity:0}]);const w=d.move([[0,g[1],g[2]],...a,[d.total,b[1],b[2]]],r);return`<g class="dg-a" data-ref="${wt(n)}" style="${w}">${Cx(n,u.sh)}</g>`}var He=n=>Math.round(n*100)/100,$s=(n,o)=>Kn(o)?`${n} ${n}j`:n,nl=n=>({...n,family:"sans"});function xg(n){const o=[];for(const c of n){const u=o[o.length-2],d=o[o.length-1];if(u&&d){const a=d[0]===u[0]?Number.NaN:(d[1]-u[1])/(d[0]-u[0]),r=c[0]===d[0]?Number.NaN:(c[1]-d[1])/(c[0]-d[0]);Number.isFinite(a)&&Number.isFinite(r)&&Math.abs(a-r)<1e-9?o[o.length-1]=c:o.push(c)}else o.push(c)}return o}function wg(n,o){const c=n[0];if(!c)return 0;if(o<=c[0])return c[1];for(let u=1;u<n.length;u++){const[d,a]=n[u],[r,l]=n[u-1];if(o<=d)return d===r?a:l+(a-l)*(o-r)/(d-r)}return n[n.length-1][1]}function jx(n,o,c,u,d){const{m:a,ink:r}=u,l=P.time,{axis:f}=n,p=new Map((c.units??[]).map(S=>[S.unit,S.passed])),g=(S,F)=>c.events.find(Y=>Y.step===S&&Y.event===F)?.at,b=(S,F)=>c.edges.find(Y=>Y.step===S&&Y.event===F)?.drawn,w=[],x=[],_=[],E=[],M=Math.min(...n.rows.map(S=>S.y)),N=Math.max(...n.rows.map(S=>S.y+S.h)),$=new Map;for(const S of n.wires){const F=b(S.step,S.event);F!==void 0&&$.set(S.to,Math.min($.get(S.to)??Number.POSITIVE_INFINITY,F))}const j=(S,F)=>{const Y=n.zoom?.columns.find(D=>D.unit===F)?.boxes.find(D=>D.id===S),oe=[p.get(F),Y?$.get(Y):void 0].filter(D=>D!==void 0);return oe.length>0?Math.min(...oe):void 0};for(const S of n.periods)S.index%2===1&&w.push(`<rect class="dg-tm-ep" x="${He(S.x)}" y="${He(M-l.shade)}" width="${He(S.w)}" height="${He(N-M+l.shade*2)}" rx="4"/>`);if(n.zoom){const S=n.zoom;S.columns.forEach((F,Y)=>{Y>0&&w.push(`<line class="dg-tm-sep" x1="${He(F.x)}" y1="${He(F.y+l.sep)}" x2="${He(F.x)}" y2="${He(F.y+F.h-l.sep)}"/>`),w.push(Ct(r,$s("dg-tm-hd",F.head),F.x+F.w/2,S.headY,F.head,ne.timeHead,Wn,"middle"));for(const oe of F.boxes)_.push(G(oe,F.unit))})}function G(S,F){const Y=[...new Set(n.wires.filter(te=>te.from===S||te.to===S).map(te=>te.step))].sort((te,de)=>te-de),oe=te=>`<rect class="${te}" x="${He(S.x)}" y="${He(S.y)}" width="${He(S.w)}" height="${S.h}" rx="${P.box.radius}"/>`;if(S.empty){const te=p.get(F),de=n.zoom?.empty??"",ve=te===void 0?"":`<g class="dg-a" style="${a.vis(te)}">${oe("dg-tm-ex")}${Ct(r,"dg-tm-ext",S.cx,S.cy+P.baseline.mark,de,ne.emptyText,[[te,Number.POSITIVE_INFINITY]],"middle")}</g>`;return`<g data-empty="${wt(S.id)}">${oe("dg-tm-ph")}${ve}</g>`}const D=fg(o.boxes.find(te=>te.id===S.id)?.link,bg(S,u,Y,d.get(S.id)??[]));if(!S.row)return D;const T=j(S.row,F);return T===void 0?oe("dg-tm-ph"):`<g class="dg-a" style="${a.until(T)}">${oe("dg-tm-ph")}</g><g class="dg-popc dg-a" style="${a.pop(T)}">${D}</g>`}for(const S of n.rows){const F=[];for(const Y of n.marks.filter(oe=>oe.row===S.id)){const oe=(T,te="")=>`<rect class="${T}" x="${He(Y.x)}" y="${He(Y.y)}" width="${He(Y.w)}" height="${He(Y.h)}" rx="${l.markRadius}"${te}/>`;if(F.push(oe("dg-tm-slot")),Y.empty){const T=p.get(Y.unit);T!==void 0&&F.push(`<circle class="dg-tm-x dg-a" cx="${He(Y.x+Y.w/2)}" cy="${He(Y.y+Y.h/2)}" r="${l.emptyR}" style="${a.vis(T,a.last,{f:.2})}"/>`);continue}const D=j(S.id,Y.unit);D!==void 0&&F.push(oe("dg-tm-m dg-a",` style="${a.vis(D,a.last,{f:.2})}"`)),Y.colors.forEach((T,te)=>{const de=g(T.step,T.event);if(de===void 0)return;const ve=Y.colors[te+1],Se=ve?g(ve.step,ve.event):void 0;F.push(`<g style="${pt(T.color)}">${oe("dg-tm-m dg-a",` style="${a.vis(de,Se??a.last,{f:.35})}"`)}</g>`)})}w.push(`<g data-row="${wt(S.id)}" style="${pt(S.color)}">${F.join("")}</g>`),w.push(Ct(r,"dg-tm-rn",P.margin+P.region.inset,S.y+S.h/2+P.baseline.mark,S.name,ne.timeRow))}if(n.zoom){const S=n.zoom,F=n.spans.filter(D=>D.kind==="box"&&D.from<=S.to&&S.from<=D.to).map(D=>g(D.step,D.event)).filter(D=>D!==void 0).sort((D,T)=>D-T)[0],Y=S.guides.map(D=>`<path class="dg-tm-gd" d="${is(D)}"/>`).join(""),oe=`<rect class="dg-tm-fr" x="${He(S.frame.x)}" y="${He(S.frame.y)}" width="${He(S.frame.w)}" height="${He(S.frame.h)}" rx="4"/>${Y}`;w.push(F===void 0?oe:`<g class="dg-a" style="${a.until(F)}">${oe}</g>`)}const K=S=>He(f.x+S*f.unit),q=n.ticks.map(S=>`M ${K(S.at)} ${He(f.line-l.major/2)} V ${He(f.line+l.major/2)}`),U=n.minor.map(S=>`M ${K(S)} ${He(f.line-l.minor/2)} V ${He(f.line+l.minor/2)}`);w.push(`<path class="dg-tm-ax" d="M ${K(0)} ${He(f.line)} H ${K(f.count)} ${[...q,...U].join(" ")}"/>`);for(const S of n.ticks)w.push(Ct(r,$s("dg-tm-tk",S.text),S.left,S.y,S.text,ne.timeTick));for(const S of n.periods)w.push(Ct(r,$s("dg-tm-en",S.name),S.x+S.w/2,S.nameY,S.name,ne.timePeriod,Wn,"middle")),w.push(Ct(r,$s("dg-tm-er",S.range),S.x+S.w/2,S.rangeY,S.range,ne.timeRange,Wn,"middle"));for(const S of n.spans){const F=g(S.step,S.event);if(F===void 0)continue;const Y=S.until===void 0?void 0:c.steps[S.until].start,oe=[[F,Y??Number.POSITIVE_INFINITY]],D=Y===void 0?a.vis(F):a.vis(F,Y,{within:!0});if(S.kind==="bracket"){const[te,de,ve,Se]=[He(S.x+1),He(S.x+S.w-1),He(S.y),He(S.y+S.h)],Ne=Ct(r,$s("dg-tm-bt",S.text),S.textRect.x+S.textRect.w/2,S.textY,S.text,ne.spanText,oe,"middle");w.push(`<g class="dg-a" data-span="${S.step}" style="${pt(S.color)};${D}"><path class="dg-tm-br" d="M ${te} ${ve} L ${te} ${Se} L ${de} ${Se} L ${de} ${ve}"/>${Ne}</g>`);continue}w.push(`<g class="dg-a" data-span="${S.step}" style="${pt(S.color)};${D}"><rect class="dg-tm-bx" x="${He(S.x)}" y="${He(S.y)}" width="${He(S.w)}" height="${He(S.h)}" rx="6"/></g>`);const T=S.textRect;r.push({text:S.text,rect:T,shown:oe,boxed:!0}),E.push(`<g class="dg-tg dg-popc dg-a" style="${pt(S.color)};${Y===void 0?a.pop(F):a.pop(F,Y)}"><rect x="${He(T.x)}" y="${He(T.y)}" width="${He(T.w)}" height="${T.h}" rx="${T.h/2}"/><text x="${He(T.x+T.w/2)}" y="${He(S.textY)}" text-anchor="middle">${wt(S.text)}</text></g>`)}const z=l.point;for(const S of n.points){const{cx:F,cy:Y,r:oe}=S,D=S.changes.map(Fe=>g(Fe.step,Fe.event)??Number.POSITIVE_INFINITY),T=D[0];w.push(`<path class="dg-tm-con" d="M ${He(F)} ${He(N+3)} L ${He(F)} ${He(Y-oe-2)}"/>`);const te=S.text.x,de=Ct(r,$s("dg-tm-pn",S.id),te,Y+z.nameY,S.id,ne.pointName),ve=de.replace(/class="([^"]*)"/u,'class="$1 dg-tm-pn-g"'),Se=T===void 0||!Number.isFinite(T)?ve:`<g class="dg-a" style="${a.until(T)}">${ve}</g><g class="dg-a" style="${a.vis(T)}">${de}</g>`,Ne=S.changes.map((Fe,ot)=>{const X=D[ot];if(!Number.isFinite(X))return"";const L=D[ot+1],Ee=L!==void 0&&Number.isFinite(L)?L-Ge.untilFade:void 0,V=Ct(r,$s("dg-tm-ps",Fe.text),te,Y+z.stateY,Fe.text,ne.pointState,[[X,Ee??Number.POSITIVE_INFINITY]]);return`<g class="dg-a" style="${pt(Fe.color??"slate")};${Ee===void 0?a.rise(X):a.rise(X,Ee)}">${V}</g>`}).join(""),Ye=S.changes.map((Fe,ot)=>{const X=D[ot];return!Fe.color||!Number.isFinite(X)?"":`<g class="dg-popc dg-a" style="${pt(Fe.color)};${a.pop(X)}"><circle class="dg-tm-pc" cx="${He(F)}" cy="${He(Y)}" r="${oe+.5}"/>${Oa("flag",F,Y,z.glyph,"dg-tm-pcg")}</g>`}).join("");_.push(`<g data-point="${wt(S.id)}"><circle class="dg-tm-pg" cx="${He(F)}" cy="${He(Y)}" r="${oe}"/>${Oa("flag",F,Y,z.glyph,"dg-tm-pgl")}${Ye}${Se}${Ne}</g>`)}const Q=new Set(n.wires.map(S=>`${S.step}/${S.event}`));for(const S of n.edges){if(Q.has(`${S.step}/${S.event}`))continue;const F=c.edges.find(D=>D.step===S.step&&D.event===S.event);if(!F)continue;u.traces.push({from:S.from,to:S.to,points:S.points,shown:[[F.start,Number.POSITIVE_INFINITY]]});const Y=a.kf([[0,{opacity:0,"stroke-dashoffset":1}],[F.start,{opacity:0,"stroke-dashoffset":1},st.inOut],[F.start+.05,{opacity:1}],[F.drawn,{"stroke-dashoffset":0}],[a.last,{opacity:1,"stroke-dashoffset":0},st.inOut],[a.total,{opacity:0,"stroke-dashoffset":0}]]),oe=a.kf([[0,{opacity:0}],[F.drawn-.05,{opacity:0}],[F.drawn,{opacity:1}],[a.last,{opacity:1},st.inOut],[a.total,{opacity:0}]]);x.push(`<g data-link="${wt(`${S.from}->${S.to}`)}" style="${pt(S.color)}"><path class="dg-tm-ln dg-a" pathLength="1" d="${is(S.points)}" style="${Y}"/><path class="dg-eh-on dg-a" d="${Yl(S.points)}" style="${oe}"/></g>`)}const re=c.needle??[],ue=xg(re.filter(([S])=>S<a.total)),he=ue[ue.length-1]?.[1]??0,fe=[...ue.map(([S,F])=>[S,f.x+F*f.unit,0]),[a.last,f.x+he*f.unit,0],[a.total,f.x,0]],{y1:Ce,y2:$e}=n.needle,C=l.needle;return E.push(`<g class="dg-a" data-needle="" style="${a.move(fe)}"><line class="dg-tm-nd" x1="0" y1="${He(Ce)}" x2="0" y2="${He($e)}"/><path class="dg-tm-nh" d="M ${-6*.75} ${He(Ce-C.head)} L ${C.head*.75} ${He(Ce-C.head)} L 0 ${He(Ce)} Z"/><circle class="dg-tm-nh" cy="${He(f.line)}" r="${C.dot}"/></g>`),{base:w.join(""),lit:x.join(""),node:_.join(""),top:E.join("")}}function zx(n,o,c){const{m:u}=c,d=P.time.meter,{x:a,w:r,line:l,text:f}=n.meter,p=n.y+d.y,g=u.kf([...xg(o).map(([w,x])=>[w,{transform:`scaleX(${He(x*1e3)/1e3})`}]),[u.last,{transform:`scaleX(${He(wg(o,u.last)*1e3)/1e3})`},st.inOut],[u.total,{transform:"scaleX(0)"}]]),b=a+r*l;return`<rect class="dg-tm-mt" x="${He(a)}" y="${He(p)}" width="${He(r)}" height="${d.h}" rx="${d.h/2}"/><rect class="dg-tm-mf dg-a" x="${He(a)}" y="${He(p)}" width="${He(r)}" height="${d.h}" rx="${d.h/2}" style="${pt(d.color)};${g}"/><line class="dg-tm-mk" x1="${He(b)}" y1="${He(p-d.mark)}" x2="${He(b)}" y2="${He(p+d.h+d.mark)}"/>`+Ct(c.ink,"dg-tm-ml",b,n.y+d.textY,f,ne.meterLine,Wn,"middle")}function Rx(n,o,c,u,d,a){const r=o.steps[c],l=wg(o.needle??[],r.end-Ge.still),f=n.axis.x+l*n.axis.unit,p=Math.min(...n.rows.map(E=>E.y)),g=Math.max(...n.rows.map(E=>E.y+E.h));let b={x:f-1,y:p,w:2,h:g-p};const w=n.badges.find(E=>E.step===c),x=E=>Math.hypot(Math.max(0,E.x-f,f-E.x-E.w),Math.max(0,E.y-p,p-E.y-E.h)),_=[...w?[{x:w.x-P.badge.r,y:w.y-P.badge.r,w:P.badge.r*2,h:P.badge.r*2}]:[],...[...u].sort((E,M)=>x(E)-x(M))];for(const E of _){const M=Math.min(b.x,E.x),N=Math.min(b.y,E.y),$={x:M,y:N,w:Math.max(b.x+b.w,E.x+E.w)-M,h:Math.max(b.y+b.h,E.y+E.h)-N};$.w<=d&&$.h<=a&&(b=$)}return b}var na=n=>Math.round(n*100)/100;function qx(n,o,c,u){const{m:d}=u,a=P.tree,r=P.box,l=(q,U)=>c.edges.find(z=>z.step===q&&z.event===U),f=new Map,p=new Map;o.steps.forEach((q,U)=>{for(const z of q.events)if(z.type==="edge")for(const Q of[z.from,z.to])f.set(Q,(f.get(Q)??new Set).add(U)),z.carry.kind!=="none"&&!p.has(Q)&&p.set(Q,U)});const g=(q,U)=>{const z=o.steps[q]?.events[U];return z?.type==="edge"&&z.carry.kind!=="none"},b=n.runs.filter(q=>g(q.step,q.event)).reduce((q,U)=>q===void 0?U.step:Math.min(q,U.step),void 0),w=b===void 0?void 0:c.steps[b]?.start,x=q=>{if(b===void 0||w===void 0)return;const U=p.get(q);if(U!==void 0&&U<=b)return;const z=U===void 0?void 0:c.steps[U]?.start,Q=[[0,{opacity:1}],[w,{opacity:1},st.inOut],[w+Ge.fade,{opacity:a.faint}]];return z!==void 0&&Q.push([z,{opacity:a.faint},st.inOut],[z+Ge.fade,{opacity:1}]),Q.push([d.last,{opacity:z===void 0?a.faint:1},st.inOut],[d.total,{opacity:1}]),d.kf(Q)},_=(q,U,z="")=>{const Q=x(q);return Q?`<g class="dg-a"${z} style="${Q}">${U}</g>`:z===""?U:`<g${z}>${U}</g>`},E=new Map(n.nodes.map(q=>[q.id,l(q.step,q.event)?.drawn??0])),M=n.links.map(q=>{const U=l(q.step,q.event);if(!U)return"";u.traces.push({from:q.from,to:q.to,points:q.points,shown:[[U.start,Number.POSITIVE_INFINITY]]});const z=d.kf([[0,{opacity:0,"stroke-dashoffset":1}],[U.start,{opacity:0,"stroke-dashoffset":1},st.inOut],[U.start+.05,{opacity:1}],[U.drawn,{"stroke-dashoffset":0}],[d.last,{opacity:1,"stroke-dashoffset":0},st.inOut],[d.total,{opacity:0,"stroke-dashoffset":0}]]);return _(q.from,`<path class="dg-tree-l dg-a" data-tree-link="${wt(q.from)}" pathLength="1" d="${is(q.points)}" style="${z}"/>`)}).join(""),N=n.nodes.flatMap(q=>{if(!q.card)return[];const U=E.get(q.id)??0,z=`M ${na(q.cx)} ${na(q.y+q.h+P.edge.inset)} V ${na(q.card.y-P.edge.inset)}`;return[_(q.id,`<path class="dg-tree-con dg-a" d="${z}" style="${d.vis(U)}"/>`)]}).join(""),$=new Set,j=n.runs.flatMap(q=>{const U=n.edges.find(Ce=>Ce.step===q.step&&Ce.event===q.event);if(!U||$.has(q.link))return[];const z=c.carriers.find(Ce=>Ce.step===q.step&&Ce.event===q.event),Q=l(q.step,q.event),re=z?.depart??Q?.start,ue=z?.arrive??Q?.drawn;if(re===void 0||ue===void 0)return[];$.add(q.link);const he=d.kf([[0,{opacity:0,"stroke-dashoffset":1}],[re,{opacity:0,"stroke-dashoffset":1},st.inOut],[re+.05,{opacity:1}],[ue,{"stroke-dashoffset":0}],[d.last,{opacity:1,"stroke-dashoffset":0},st.inOut],[d.total,{opacity:0,"stroke-dashoffset":0}]]),fe=is(U.points);return[`<g style="${pt(U.color)}"><path class="dg-tree-tr dg-a" data-tree-trail="${wt(q.link)}" pathLength="1" d="${fe}" style="${he}"/><path class="dg-tree-h dg-a" d="${Yl(U.points)}" style="${d.vis(ue)}"/></g>`]}).join(""),G=n.nodes.flatMap(q=>{const U=q.card;if(!U)return[];const z=U.x+a.card.padX+a.card.icon/2,Q=U.y+U.h/2,re=Ct(u.ink,"dg-tree-ct",U.x+a.card.padX+a.card.icon+a.card.gap,Q+P.baseline.label,U.text,ne.treeCard,Wn);return[_(q.id,`<rect class="dg-tree-card" x="${na(U.x)}" y="${na(U.y)}" width="${na(U.w)}" height="${U.h}" rx="${a.card.radius}"/>${Oa("doc",z,Q,a.card.glyph,"dg-tree-cg")}${re}`,` data-tree-card="${wt(q.id)}"`)]}).join(""),K=n.nodes.map(q=>{const U=E.get(q.id)??0,z=[...f.get(q.id)??[]].sort((F,Y)=>F-Y),Q=z.length>0?Yd(u,z):void 0,re=q.root?a.root.radius:a.radius,ue=(F,Y="")=>`<rect class="${F}" x="${na(q.x)}" y="${na(q.y)}" width="${na(q.w)}" height="${q.h}" rx="${re}"${Y}/>`,he=`${Q?`<g class="dg-a" style="${Q}">${ue("dg-halo")}</g>`:""}${ue("dg-st",` ${u.sh}`)}${Q?`<g class="dg-a" style="${Q}">${ue("dg-on")}</g>`:""}`,fe=q.x+a.root.iconX+r.icon/2,Ce=q.root?`<rect class="dg-ic" x="${na(fe-r.icon/2)}" y="${na(q.cy-r.icon/2)}" width="${r.icon}" height="${r.icon}" rx="${r.iconRadius}"/>${Oa("tree",fe,q.cy,r.iconScale)}`:"",$e=[[U,Number.POSITIVE_INFINITY]],C=q.lines.map((F,Y)=>{const oe=q.styles[Y]??ne.boxName,D=oe===ne.treeHash?"dg-tree-hash":oe===ne.treeName?"dg-tree-name":oe===ne.rootHash?"dg-tree-rh":oe===ne.rootName?"dg-tree-rn":"dg-tree-one",T=q.baselines[Y]??q.cy;return q.root?Ct(u.ink,D,q.x+a.root.textX,T,F,oe,$e):Ct(u.ink,D,q.cx,T,F,oe,$e,"middle")}).join(""),S=_(q.id,`${he}${Ce}${C}`,` data-tree-node="${wt(q.id)}"${q.root?` data-tree-root="${wt(q.id)}"`:""}`);return`<g class="dg-popc dg-a" style="${pt(q.color)};${d.pop(U)}">${S}</g>`}).join("");return{links:M+N,trails:j,nodes:G+K}}var b0=n=>Math.round(n*100)/100,Fx=class{constructor(n,o,c){this.prefix=n,this.total=o,this.last=c}prefix;total;last;frames=[];count=0;pct(n){return+(Math.min(Math.max(n,0),this.total)/this.total*100).toFixed(3)}kf(n){const o=`${this.prefix}-${this.count++}`,c=new Map;for(const[d,a,r]of[...n].sort((l,f)=>l[0]-f[0])){const l=this.pct(d),f=c.get(l)??{props:{}};Object.assign(f.props,a),r&&(f.ease=r),c.set(l,f)}const u=[...c].map(([d,{props:a,ease:r}])=>{const l=Object.entries(a).map(([f,p])=>`${f}:${p}`);return r&&l.push(`animation-timing-function:${r}`),`${d}%{${l.join(";")}}`}).join("");return this.frames.push(`@keyframes ${o}{${u}}`),`animation-name:${o}`}vis(n,o=this.last,c={}){const u=c.f??Ge.fade,d=c.on??{},a=c.off??{},r=c.within?Math.max(n+u,o-u):o;return this.kf([[0,{opacity:0,...a}],[n,{opacity:0,...a},c.ein??st.out],[n+u,{opacity:1,...d}],[r,{opacity:1,...d},st.inOut],[Math.min(r+u,this.total),{opacity:0,...a}],[this.total,{opacity:0,...a}]])}rise(n,o=this.last,c=!1){return this.vis(n,o,{on:{transform:"translateY(0)"},off:{transform:`translateY(${P.rise}px)`},within:c})}pop(n,o=this.last){return this.vis(n,o,{f:Ge.popFade,ein:st.pop,on:{transform:"scale(1)"},off:{transform:`scale(${P.popFrom})`}})}until(n){const o=Ge.untilFade;return this.kf([[0,{opacity:1}],[n,{opacity:1},st.inOut],[n+o,{opacity:0}],[this.last,{opacity:0}],[this.total,{opacity:1}]])}move(n,o=[]){return this.kf(n.map(([c,u,d,a=1,r])=>[c,{transform:`translate(${b0(u)}px,${b0(d)}px) scale(${a})`},r]).concat(o))}blink(n,o,c){return[[0,{opacity:0}],[n-.01,{opacity:0}],[n,{opacity:1}],[o,{opacity:1}],[o+c,{opacity:0}],[this.total,{opacity:0}]]}},Ze=n=>`font:${n.weight} ${n.size}px var(--${n.family})`,mn=(n,o="var(--surf)")=>`color-mix(in srgb,var(--c) ${n}%,${o})`,Ke=P.stroke,qt=P.mix,ud=`color-mix(in srgb,var(--mute) ${qt.past}%,var(--bg))`,Hx=[".dg{display:block;width:100%;height:auto;overflow:visible}",".dg .dg-a{animation-duration:var(--T);animation-timing-function:linear;animation-iteration-count:infinite;animation-fill-mode:both;animation-delay:calc(var(--at,0) * -1s);animation-play-state:var(--play,running)}",".dg .dg-popc{transform-box:fill-box;transform-origin:center}",".dg-bg{fill:var(--bg)}",".dg-band{fill:color-mix(in srgb,var(--c) var(--tint),var(--bg));stroke:color-mix(in srgb,var(--c) var(--edge),transparent)}",`.dg-bi{fill:${mn(qt.regionIcon)};stroke:${mn(qt.regionIconEdge,"transparent")}}`,`.dg-bz{${Ze(ne.regionName)};fill:var(--ct)}`,`.dg-bx{${Ze(ne.regionNote)};fill:var(--mute)}`,".dg-st{fill:var(--surf);stroke:var(--hair)}",`.dg-halo{fill:none;stroke:var(--c);stroke-width:${Ke.halo};stroke-opacity:.16}`,`.dg-on{fill:none;stroke:var(--c);stroke-width:${Ke.on}}`,`.dg-ic{fill:${mn(qt.icon)}}`,`.dg-slot{fill:none;stroke:${mn(qt.slot,"transparent")};stroke-width:${Ke.slot};stroke-dasharray:3 3}`,`.dg-gl{fill:none;stroke:var(--c);stroke-width:${Ke.glyph};stroke-linecap:round;stroke-linejoin:round}`,`.dg-sn{${Ze(ne.boxName)};fill:var(--ink)}`,`.dg-ss{${Ze(ne.boxSub)};fill:var(--mute)}`,`.dg-ss-ok{${Ze(ne.boxSubStrong)};fill:var(--ct)}`,`.dg-ss-act{${Ze(ne.boxSubStrong)};fill:var(--ink)}`,`.dg-ll{stroke:var(--line);stroke-width:${Ke.lifeline};stroke-dasharray:3 4}`,`.dg-e{fill:none;stroke:var(--line);stroke-width:${Ke.edge};stroke-linecap:round;stroke-dasharray:0 ${P.edge.ghostDash}}`,`.dg-eh{fill:none;stroke:var(--line);stroke-width:${Ke.arrow};stroke-linecap:round;stroke-linejoin:round}`,`.dg-e-on{fill:none;stroke:var(--c);stroke-width:${Ke.edgeOn};stroke-linecap:round;stroke-dasharray:1 2}`,`.dg-eh-on{fill:none;stroke:var(--c);stroke-width:${Ke.edgeOn};stroke-linecap:round;stroke-linejoin:round}`,`.dg-flow{fill:none;stroke:var(--surf);stroke-width:${Ke.flow};stroke-linecap:round;stroke-dasharray:1.5 ${P.edge.flowDash}}`,`.dg-e-past{fill:none;stroke:${ud};stroke-width:${Ke.edge};stroke-linecap:round}`,`.dg-eh-past{fill:none;stroke:${ud};stroke-width:${Ke.arrow};stroke-linecap:round;stroke-linejoin:round}`,".dg-bd{cursor:pointer}",".dg-bdf{fill:var(--c)}",`.dg-bdft{${Ze(ne.badge)};fill:var(--on-c)}`,`.dg-bdr{fill:none;stroke:var(--c);stroke-width:${Ke.badgeRing};pointer-events:none}`,`.dg-bdp{fill:${mn(qt.badgePast)};stroke:${mn(qt.badgePastEdge,"transparent")};stroke-width:${Ke.hair}}`,`.dg-bdpt{${Ze(ne.badge)};fill:var(--ct)}`,`.dg-bdp-g{fill:var(--surf);stroke:${ud};stroke-width:${Ke.hair}}`,`.dg-bdpt-g{${Ze(ne.badge)};fill:var(--mute)}`,`.dg-cap rect,.dg-act rect{fill:${mn(qt.cap)};stroke:${mn(qt.capEdge,"transparent")}}`,`.dg-cap text{${Ze(ne.label)};fill:var(--ct)}`,`.dg-capj text{${Ze(ne.labelJa)}}`,`.dg-cap-past text{${Ze(ne.label)};fill:var(--mute);fill-opacity:${P.state.pastLabel}}`,`.dg-cap-pastj text{${Ze(ne.labelJa)}}`,`.dg-act text{${Ze(ne.action)};fill:var(--ct)}`,".dg-car{fill:var(--carry,var(--ink))}",`.dg-car-t{${Ze(ne.carrier)};fill:var(--bg)}`,`.dg-car-tj{${Ze(ne.carrierJa)}}`,`.dg-env{fill:var(--carry,var(--ink));stroke:var(--surf);stroke-width:${Ke.envelope}}`,`.dg-env-in{fill:none;stroke:var(--surf);stroke-width:${Ke.flow};stroke-linejoin:round;stroke-linecap:round}`,".dg-coin{fill:var(--coin);stroke:var(--surf);stroke-width:1.2}",".dg-coin-in{fill:none;stroke:var(--coinin);stroke-width:1.1}",".dg-strip{fill:var(--surf);stroke:var(--hair)}",`.dg-sep{stroke:var(--hair);stroke-width:${Ke.hair}}`,`.dg-sh{${Ze(ne.stripTitle)};fill:var(--ink)}`,`.dg-fl{${Ze(ne.fieldName)};fill:var(--mute)}`,`.dg-fv{${Ze(ne.fieldValue)};fill:var(--ink)}`,`.dg-fvj{${Ze(ne.fieldValueJa)};fill:var(--ink)}`,".dg-fv-c{fill:var(--ct)}",".dg-fl-now{fill:var(--c)}",`.dg-tr-ring{fill:none;stroke:var(--line);stroke-width:${Ke.trail}}`,".dg-tr-fill{fill:var(--c)}",".dg-tg rect{fill:var(--c)}",`.dg-tg text{${Ze(ne.tag)};fill:var(--on-c)}`,`.dg-side{fill:color-mix(in srgb,var(--c) ${qt.side}%,var(--bg));stroke:${mn(qt.sideEdge,"transparent")};stroke-dasharray:4 4}`,`.dg-side-t{${Ze(ne.regionName)};fill:var(--ct)}`,`.dg-side-n{${Ze(ne.regionNote)};fill:var(--mute)}`,`.dg-ghost{fill:var(--surf);stroke:${mn(qt.ghostEdge,"transparent")};stroke-dasharray:4 3}`,`.dg-path{fill:none;stroke:${mn(qt.path,"transparent")};stroke-width:${Ke.path};stroke-linecap:round;stroke-dasharray:0 ${P.edge.ghostDash}}`,`.dg-path-h{fill:none;stroke:${mn(qt.path,"transparent")};stroke-width:${Ke.arrow};stroke-linecap:round;stroke-linejoin:round}`,`.dg-path-t{${Ze(ne.label)};fill:var(--ct)}`,`.dg-path-tj{${Ze(ne.labelJa)}}`,".dg-start{fill:var(--ink)}",`.dg-end{fill:var(--bg);stroke:var(--ink);stroke-width:${Ke.end}}`,".dg-end-in{fill:var(--ink)}",`.dg-end-x{fill:var(--bg);stroke:${mn(qt.path,"transparent")};stroke-width:${Ke.arrow};stroke-dasharray:2 2.5}`,`.dg-end-xi{fill:${mn(qt.path,"transparent")}}`,`.dg-mark{${Ze(ne.regionNote)};fill:var(--mute)}`,`.dg-done{fill:var(--ink);stroke:var(--surf);stroke-width:${Ke.done}}`,`.dg-done-ck{fill:none;stroke:var(--surf);stroke-width:${Ke.glyph};stroke-linecap:round;stroke-linejoin:round}`,`.dg-git-l{fill:none;stroke:var(--c);stroke-width:${Ke.git};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,`.dg-git-cp{fill:none;stroke:var(--c);stroke-width:${Ke.gitOrphan};stroke-linecap:round;stroke-dasharray:3 3;stroke-opacity:.7}`,`.dg-git-c{fill:var(--surf);stroke:var(--c);stroke-width:${Ke.git}}`,`.dg-git-id{${Ze(ne.gitId)};fill:var(--ct)}`,`.dg-git-h{${Ze(ne.gitHash)};fill:var(--mute)}`,`.dg-git-n{${Ze(ne.gitNote)};fill:var(--ink2)}`,`.dg-git-old{fill:var(--surf);stroke:var(--c);stroke-width:${Ke.gitOrphan};stroke-dasharray:3 3;stroke-opacity:.6}`,`.dg-git-oldl{${Ze(ne.gitId)};fill:var(--ct);opacity:.55}`,`.dg-tree-l{fill:none;stroke:var(--line);stroke-width:${Ke.tree};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,`.dg-tree-tr{fill:none;stroke:var(--c);stroke-width:${Ke.treeTrail};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,`.dg-tree-h{fill:none;stroke:var(--c);stroke-width:${Ke.treeTrail};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tree-con{fill:none;stroke:var(--line);stroke-width:${Ke.treeCon};stroke-linecap:round;stroke-dasharray:2 3.5}`,`.dg-tree-card{fill:var(--surf);stroke:var(--hair);stroke-width:${Ke.hair}}`,`.dg-tree-cg{fill:none;stroke:var(--mute);stroke-width:${Ke.glyph};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tree-ct{${Ze(ne.treeCard)};fill:var(--ink)}`,`.dg-tree-hash{${Ze(ne.treeHash)};fill:var(--ink)}`,`.dg-tree-name{${Ze(ne.treeName)};fill:var(--mute)}`,`.dg-tree-one{${Ze(ne.boxName)};fill:var(--ink)}`,`.dg-tree-rh{${Ze(ne.rootHash)};fill:var(--ink)}`,`.dg-tree-rn{${Ze(ne.rootName)};fill:var(--mute)}`,`.dg-tm-ep{fill:color-mix(in srgb,var(--ink) ${qt.timeShade}%,transparent)}`,`.dg-tm-sep{stroke:var(--hair);stroke-width:${Ke.hair};stroke-dasharray:2 4}`,`.dg-tm-hd{${Ze(ne.timeHead)};fill:var(--ink)}`,`.dg-tm-hdj{${Ze(nl(ne.timeHead))}}`,`.dg-tm-slot{fill:none;stroke:var(--line);stroke-width:${Ke.timeSlot};opacity:.55}`,".dg-tm-m{fill:var(--c)}",".dg-tm-x{fill:var(--c-slate)}",`.dg-tm-fr{fill:none;stroke:var(--c-blue);stroke-width:${Ke.timeFrame};stroke-dasharray:3 2}`,`.dg-tm-gd{fill:none;stroke:color-mix(in srgb,var(--c-blue) ${qt.timeGuide}%,transparent);stroke-width:${Ke.hair};stroke-dasharray:2 3}`,`.dg-tm-ax{fill:none;stroke:var(--line);stroke-width:${Ke.timeAxis}}`,`.dg-tm-tk{${Ze(ne.timeTick)};fill:var(--mute)}`,`.dg-tm-tkj{${Ze(nl(ne.timeTick))}}`,`.dg-tm-en{${Ze(ne.timePeriod)};fill:var(--ink2)}`,`.dg-tm-er{${Ze(ne.timeRange)};fill:var(--mute)}`,`.dg-tm-erj{${Ze(nl(ne.timeRange))}}`,`.dg-tm-rn{${Ze(ne.timeRow)};fill:var(--ink2)}`,`.dg-tm-br{fill:none;stroke:var(--c);stroke-width:${Ke.timeSpan};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tm-bt{${Ze(ne.spanText)};fill:var(--ct)}`,`.dg-tm-bx{fill:color-mix(in srgb,var(--c) ${qt.timeSpan}%,transparent);stroke:var(--c);stroke-width:${Ke.timeSpan};stroke-dasharray:4 3}`,`.dg-tm-con{fill:none;stroke:var(--line);stroke-width:${Ke.timeDrop};stroke-linecap:round;stroke-dasharray:0 3.5}`,".dg-tm-pg{fill:var(--surf);stroke:var(--line);stroke-dasharray:2 2.5}",`.dg-tm-pgl{fill:none;stroke:var(--mute);stroke-width:${Ke.timeFlag};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tm-pc{fill:var(--surf);stroke:var(--c);stroke-width:${Ke.timePoint}}`,`.dg-tm-pcg{fill:none;stroke:var(--c);stroke-width:${Ke.timeFlag};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tm-pn{${Ze(ne.pointName)};fill:var(--ink)}`,`.dg-tm-pnj{${Ze(nl(ne.pointName))}}`,".dg-tm-pn-g{fill:var(--mute)}",`.dg-tm-ps{${Ze(ne.pointState)};fill:var(--ct)}`,`.dg-tm-ln{fill:none;stroke:var(--c);stroke-width:${Ke.edgeOn};stroke-linecap:round;stroke-dasharray:1 2}`,`.dg-tm-nd{stroke:var(--ink);stroke-width:${Ke.timeNeedle};opacity:.55}`,".dg-tm-nh{fill:var(--ink)}",".dg-tm-ph{fill:none;stroke:var(--line);stroke-dasharray:3 3}",`.dg-tm-ex{fill:color-mix(in srgb,var(--c-slate) ${qt.timeEmpty}%,var(--surf));stroke:var(--c-slate);stroke-width:${Ke.timeFrame};stroke-dasharray:3 3}`,`.dg-tm-ext{${Ze(ne.emptyText)};fill:var(--t-slate)}`,".dg-tm-mt{fill:var(--hair)}",".dg-tm-mf{fill:var(--c);transform-box:fill-box;transform-origin:0 50%}",`.dg-tm-mk{stroke:var(--ink2);stroke-width:${Ke.timeMeter}}`,`.dg-tm-ml{${Ze(ne.meterLine)};fill:var(--ink2)}`,".dg-vp-bg{fill:var(--bg)}",".dg-vp-frame{fill:none;stroke:var(--hair)}",".dg-hd-bg{fill:var(--bg)}",".dg-mm-bg{fill:var(--surf);stroke:var(--hair)}",`.dg-mm-t{${Ze(ne.miniTitle)};fill:var(--mute)}`,".dg-mm-world{fill:var(--sunk);stroke:var(--hair)}",`.dg-mm-band{fill:${mn(qt.miniBand)};stroke:${mn(qt.miniBandEdge,"transparent")};stroke-width:.6}`,`.dg-mm-card{fill:${mn(qt.mini)}}`,`.dg-mm-vp{fill:color-mix(in srgb,var(--ink) ${qt.view}%,transparent);stroke:var(--ink);stroke-width:${Ke.badgeRing};vector-effect:non-scaling-stroke}`].join("");function Lx(n){let o=2166136261;for(let c=0;c<n.length;c++)o^=n.charCodeAt(c),o=Math.imul(o,16777619);return(o>>>0).toString(36)}function Ux(n){const o=new Map,c=(u,d)=>{o.set(u,(o.get(u)??new Set).add(d))};return n.steps.forEach((u,d)=>{for(const a of u.events)a.type==="edge"?(c(a.from,d),c(a.to,d)):(a.type==="action"||a.type==="swap")&&c(a.box,d)}),new Map([...o].map(([u,d])=>[u,[...d].sort((a,r)=>a-r)]))}function Px(n,o,c){const u=[],{whole:d}=o;let a=0;for(const l of o.events){const f=n.steps[l.step]?.events[l.event];if(f?.type==="swap"&&u.push({t:l.at,order:a++,box:f.box,set:f.text}),c&&f?.type==="action"){u.push({t:l.at,order:a++,box:f.box,act:f.label});const p=o.steps[l.step].end;(!d||p<=d.start)&&u.push({t:p,order:a++,box:f.box,act:null})}}u.sort((l,f)=>l.t-f.t||l.order-f.order);const r=new Map;for(const l of n.boxes){let f=[l.sub??"","dg-ss"],p,g=f.join("|");const b=[],w=u.filter(E=>E.box===l.id),x=[...w].reverse().find(E=>E.set!==void 0||typeof E.act=="string");d&&typeof x?.act=="string"&&w.push({t:d.start,order:a++,box:l.id,act:x.act});for(const E of w){E.set!==void 0&&(f=[E.set,"dg-ss-ok"],p=void 0),E.act!==void 0&&(p=E.act??void 0);const M=p!==void 0?[p,"dg-ss-act"]:f;M.join("|")!==g&&(g=M.join("|"),b.push([E.t,M[0],M[1]]))}const _=b.filter((E,M)=>{const N=b[M+1];return N===void 0||N[0]-E[0]>=Ge.minShow});r.set(l.id,_)}return r}function Gx(n,o,c){const u=new Map;for(const d of o.events){const a=n.steps[d.step]?.events[d.event];if(a?.type!=="strip")continue;const r=c.badges[d.step]?.color??"slate",l=u.get(a.field)??[],f=o.steps[d.step].end;l.push({at:d.at,color:r,step:d.step,until:f,...a.value!==void 0?{value:a.value}:{},...a.tag!==void 0?{tag:a.tag}:{}}),u.set(a.field,l)}return u}function Yx(n,o,c){if(n.until===void 0)return o;const{after:u,again:d,...a}=o;if(!u)return a;const r=c[n.until].start;return r>u.start?{...a,after:{start:u.start,end:Math.min(u.end,r)}}:a}function kg(n,o,c,u,d,a,r=[],l=[]){const f=eg(u,d),p=Lx(`${JSON.stringify(n)}|${f}|${a?`${a.width}|${a.lang}`:""}`),g=new Fx(`dg${p}`,c.total,c.last),b={m:g,t:c,sh:`filter="url(#dg-sh-${p})"`,end:c.steps[c.steps.length-1].end,ink:r,traces:l},w=Ux(n),x=Px(n,c,o.kind!=="sequence"),_={band:[],base:[],lit:[],node:[],badge:[],top:[]};for(const T of o.regions)_.band.push(bx(T,r));const E=o.boxes.find(T=>T.ghost)?.color??"slate";o.side&&_.band.push(Ex(o.side,E,r));const M=(T,te)=>o.boxes.find(de=>de.id===T&&(te===void 0||de.ghost===te))?.color;for(const T of o.paths)_.base.push(kx(T,M(T.to,!0)??M(T.from)??E,r,l));for(const T of o.ends)_.node.push(Ax(T,E,r));const N=o.kind==="state",$=new Map((c.states??[]).flatMap(T=>T.lit[0]?[[T.box,T.lit[0].start]]:[])),j=new Map((c.meters??[]).map(T=>[T.field,T.keys])),G=T=>T.meter?zx({...T,meter:T.meter},j.get(T.name)??[[0,0]],b):void 0;o.strip&&_.band.push(Mx(o.strip,Gx(n,c,o),b,N,$,G));for(const T of o.lifelines)_.base.push(_x(T.x,T.y1,T.y2));if(O1(o)){const T=Ox(o,n,c,b);_.base.push(T.links),_.lit.push(T.lines),_.node.push(T.commits),_.top.push(T.tags)}const K=Gd(o)?o:void 0;if(K){const T=qx(K,n,c,b);_.base.push(T.links),_.lit.push(T.trails),_.node.push(T.nodes)}const q=new Set((K?.runs??[]).map(T=>`${T.step}/${T.event}`)),U=pg(o)?o:void 0;if(U){const T=jx(U,n,c,b,x);_.base.push(T.base),_.lit.push(T.lit),_.node.push(T.node),_.top.push(T.top)}const z=new Set((U?.wires??[]).map(T=>`${T.step}/${T.event}`));for(const T of o.edges){const te=c.edges.find(ve=>ve.step===T.step&&ve.event===T.event);if(!te||U&&!z.has(`${T.step}/${T.event}`)||q.has(`${T.step}/${T.event}`))continue;const de=Sx(T,te,b,N);_.base.push(de.base),_.lit.push(de.lit)}const Q=new Map((c.states??[]).map(T=>[T.box,T])),re=new Map(n.boxes.flatMap(T=>T.link===void 0?[]:[[T.id,T.link]])),ue=(T,te)=>fg(re.get(T),te);for(const T of U?[]:o.boxes){if(T.ghost){_.node.push(ue(T.id,xx(T,r)));continue}const te=Q.get(T.id);_.node.push(ue(T.id,bg(T,b,w.get(T.id)??[],x.get(T.id)??[],N?te?.lit??[]:void 0))),te?.done!==void 0&&_.node.push(wx(T,te.done,b))}for(const T of o.badges)_.badge.push(Tx(T,b,N));for(const T of o.labels){const te=c.labels.find(de=>de.step===T.step&&de.event===T.event);te&&_.top.push($x(T,Yx(T,te,c.steps),b))}const{whole:he}=c;for(const T of o.actions){const te=c.events.find(ve=>ve.step===T.step&&ve.event===T.event);if(!te)continue;const de=c.steps[T.step].end;_.top.push(he&&de>he.start?g0(T,te.at,he.end,b):g0(T,te.at,de,b,he))}for(const T of c.carriers){const te=o.edges.find(de=>de.step===T.step&&de.event===T.event);te&&_.top.push(vg(te,K?{...T,start:T.depart,end:T.arrive+Ge.fade}:T,b))}const fe=Object.values(_).map(T=>T.join("")).join(""),{near:Ce,far:$e,nearY:C,farY:S}=P.shadow,F=`<filter id="dg-sh-${p}" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="${C}" stdDeviation="${Ce}" style="flood-color:var(--sh);flood-opacity:var(--shA)"/><feDropShadow dx="0" dy="${S}" stdDeviation="${$e}" style="flood-color:var(--sh);flood-opacity:var(--shB)"/></filter>`,Y=a&&o.kind==="sequence"?o.boxes.map(T=>ue(T.id,vx(T,b,w.get(T.id)??[],x.get(T.id)??[]))).join(""):"",oe=a?Jx(o,c,n,g,p,fe,a,Y):{body:`<rect class="dg-bg" width="${o.width}" height="${o.height}" rx="${P.region.radius}"/>${fe}`,w:o.width,h:o.height},D=`.dg-${p}{${tg};--T:${c.total}s;${f}}${Hx}${g.frames.join("")}`;return`<svg xmlns="http://www.w3.org/2000/svg" class="dg dg-${p}" viewBox="0 0 ${Math.ceil(oe.w)} ${Math.ceil(oe.h)}" width="${Math.ceil(oe.w)}" height="${Math.ceil(oe.h)}" role="img" aria-label="${wt(n.title)}" data-dragon="figure" data-view="${a?"follow":"fixed"}"><style>${D}</style><defs>${F}</defs>${oe.body}</svg>`}function Eg(n){const o=Math.min(...n.map(u=>u.x)),c=Math.min(...n.map(u=>u.y));return{x:o,y:c,w:Math.max(...n.map(u=>u.x+u.w))-o,h:Math.max(...n.map(u=>u.y+u.h))-c}}function Vx(n,o,c){const u=Ad(n,o,c);return u.length===0?void 0:Eg(u)}function Xx(n,o,c,u){const d=P.badge.r+P.follow.badgeRoom,{x:a,y:r}=n,l=p=>Math.hypot(Math.max(0,p.x-a,a-p.x-p.w),Math.max(0,p.y-r,r-p.y-p.h));let f={x:a-d,y:r-d,w:d*2,h:d*2};for(const p of[...o].sort((g,b)=>l(g)-l(b))){const g=Eg([f,p]);g.w<=c&&g.h<=u&&(f=g)}return f}function Ad(n,o,c){const u=[];for(const d of n.edges.filter(a=>a.step===c)){const a=d.points.map(l=>l[0]),r=d.points.map(l=>l[1]);u.push({x:Math.min(...a),y:Math.min(...r),w:Math.max(...a)-Math.min(...a),h:Math.max(...r)-Math.min(...r)})}if(u.push(...n.labels.filter(d=>d.step===c),...n.actions.filter(d=>d.step===c)),Gd(n)){const d=new Set((o.steps[c]?.events??[]).flatMap(a=>a.type==="edge"?[a.from,a.to]:[]));u.push(...n.nodes.filter(a=>a.step===c||d.has(a.id)));for(const a of n.links.filter(r=>r.step===c)){const r=a.points.map(f=>f[0]),l=a.points.map(f=>f[1]);u.push({x:Math.min(...r),y:Math.min(...l),w:Math.max(...r)-Math.min(...r),h:Math.max(...l)-Math.min(...l)})}}for(const d of o.steps[c]?.events??[]){const a=d.type==="edge"?[d.from,d.to]:d.type==="action"||d.type==="swap"?[d.box]:[];for(const r of a){const l=n.boxes.find(f=>f.id===r);l&&(n.kind==="architecture"||d.type==="swap")&&u.push(l)}}return u}function Jx(n,o,c,u,d,a,r,l){const f=P.follow,p=P.mini,g=Math.max(1,r.width),b=Math.min(n.width,g),w=cs[r.lang].overview,x=L=>{const Ee=Math.min(p.w,b*.4,L*.4/n.height*n.width),V=Ee/n.width,ye=n.height*V,k=Math.max(Ee,Math.ceil(Ie(w,ne.miniTitle)));return{vh:L,mw:Ee,k:V,mh:ye,bw:k,bgW:k+p.pad*2,bgH:ye+p.pad*2+p.title,beside:ye>Ee}},_=x(Math.min(n.height,Math.max(f.minH,b*f.aspect))),E=_.beside&&g<f.narrow,M=r.height===void 0?Number.POSITIVE_INFINITY:_.beside?r.height:r.height-_.bgH-p.inset,{vh:N,mw:$,k:j,mh:G,bw:K,bgW:q,bgH:U,beside:z}=M<_.vh?x(Math.max(f.fitMinH,M)):{..._,vh:Number.isFinite(M)?Math.min(n.height,M):_.vh},Q=z&&!E?Math.min(n.width,g-q-p.inset):b,re=L=>Math.min(n.width-Q/2,Math.max(Q/2,L)),ue=l===""?0:Math.max(...n.boxes.map(L=>L.y+L.h))+f.headRoom,he=l===""?0:f.head.pad*2+f.head.h,fe=N-he,Ce=L=>Math.min(n.height-fe/2,Math.max(ue+fe/2,L)),$e=P.badge.r;let C=[n.width/2,n.height/2];const F=o.steps.map((L,Ee)=>{if(pg(n)){const Z=Rx(n,o,Ee,Ad(n,c,Ee),Q,fe);return C=[Z.x+Z.w/2,Z.y+Z.h/2],[re(C[0]),Ce(C[1])]}const V=Vx(n,c,Ee);C=V?[V.x+V.w/2,V.y+V.h/2]:C;const ye=[re(C[0]),Ce(C[1])],k=n.badges.find(Z=>Z.step===Ee);if(!k||Math.abs(k.x-ye[0])<=Q/2-$e&&Math.abs(k.y-ye[1])<=fe/2-$e)return ye;const W=Xx(k,Ad(n,c,Ee),Q,fe);return C=[W.x+W.w/2,W.y+W.h/2],[re(C[0]),Ce(C[1])]}).map(([L,Ee])=>[L,Ee-he/2]),Y=F[0],oe=[[0,Y[0],Y[1]],[o.steps[0].start,Y[0],Y[1]]];F.forEach((L,Ee)=>{if(Ee===0)return;const V=F[Ee-1],ye=o.steps[Ee].start;oe.push([ye,V[0],V[1],1,st.inOut],[ye+f.ease,L[0],L[1]])});const D=F[F.length-1];oe.push([o.last,D[0],D[1],1,st.inOut],[o.total,Y[0],Y[1]]);const T=u.move(oe.map(([L,Ee,V,ye,k])=>[L,Q/2-Ee,N/2-V,ye,k])),te=z?Q+p.inset:Q-q-p.inset,de=z?0:N+p.inset,ve=te+p.pad,Se=ve+(K-$)/2,Ne=de+p.pad+p.title,Fe=E?{clip:"",body:""}:(()=>{const L=[...n.regions.map(V=>`<rect class="dg-mm-band" style="${pt(V.color)}" x="${Se+V.x*j}" y="${Ne+V.y*j}" width="${V.w*j}" height="${V.h*j}" rx="3"/>`),...n.boxes.map(V=>`<rect class="dg-mm-card" style="${pt(V.color)}" x="${Se+V.x*j}" y="${Ne+V.y*j}" width="${V.w*j}" height="${V.h*j}" rx="1.5"/>`),...(Gd(n)?n.nodes:[]).map(V=>`<rect class="dg-mm-card" style="${pt(V.color)}" x="${Se+V.x*j}" y="${Ne+V.y*j}" width="${V.w*j}" height="${V.h*j}" rx="1.5"/>`)].join(""),Ee=u.move(oe.map(([V,ye,k,,W])=>[V,Se+(ye-Q/2)*j,Ne+(k-N/2)*j,1,W]));return{clip:`<clipPath id="dg-mm-${d}"><rect x="${Se}" y="${Ne}" width="${$}" height="${G}" rx="4"/></clipPath>`,body:`<rect class="dg-mm-bg" x="${te}" y="${de}" width="${q}" height="${U}" rx="${p.radius}"/><text class="dg-mm-t" x="${ve}" y="${Ne-p.pad+2}">${w}</text><g clip-path="url(#dg-mm-${d})"><rect class="dg-mm-world" x="${Se}" y="${Ne}" width="${$}" height="${G}"/>${L}<rect class="dg-mm-vp dg-a"${he===0?"":` y="${he*j}"`} width="${Q*j}" height="${(N-he)*j}" rx="2" style="${Ee}"/></g>`}})(),ot=he===0?"":`<g class="dg-hd"><rect class="dg-hd-bg" width="${Q}" height="${he}"/><line class="dg-sep" x1="0" y1="${he}" x2="${Q}" y2="${he}"/><g class="dg-a" style="${u.move(oe.map(([L,Ee,,V,ye])=>[L,Q/2-Ee,0,V,ye]))}">${l}</g></g>`;return{body:`<defs><clipPath id="dg-vp-${d}"><rect width="${Q}" height="${N}" rx="${P.region.radius}"/></clipPath>${Fe.clip}</defs><g clip-path="url(#dg-vp-${d})"><rect class="dg-vp-bg" width="${Q}" height="${N}"/><g class="dg-a" style="${T}">${a}</g>${ot}</g><rect class="dg-vp-frame" x="0.5" y="0.5" width="${Q-1}" height="${N-1}" rx="${P.region.radius}"/>${Fe.body}`,w:z&&!E?Q+p.inset+q:b,h:z?N:de+U}}function Ag(n,o){const c=Fd(n.palette);if(!n.colors)return c;const u=cs[n.lang??"ja"],d=Object.entries(n.colors).flatMap(([a,r])=>x1(a)?w1(r)?[]:[u.unreadableColor(a)]:[u.unknownColor(a)]);if(d.length>0)throw new Error(u.cannotDraw(d.join(" / ")));return{...c,[o]:{...c[o],...n.colors}}}function Vd(n,o={}){const c=o.lang??"ja",u=qi(n,{lang:c});if(!u.ok)throw new Error(cs[c].cannotDraw(u.errors.map(r=>`${r.pointer} ${r.message}`).join(" / ")));const d=u.diagram,a=d.kind==="sequence"?P1(d):d.kind==="state"?X1(d,c):d.kind==="git"?q1(d):d.kind==="time"?I1(d,c):d.kind==="tree"?rx(d):$1(d);return Qx(d,a,dx(d,o.still===!0),o)}function Qx(n,o,c,u={}){const d=u.theme==="dark"?"dark":"light",a=Ag(u,d),r=[],l=[];return{svg:kg(n,o,c,a,d,void 0,r,l),palette:a.id,theme:d,...n.view?{view:n.view}:{},fonts:{...zi},layout:o,timeline:c,diagram:n,overlaps:mx(r,c.stills,l)}}function v0(n,o,c){const u=Math.max(0,o)/n.layout.width,a=(c===void 0?u:Math.min(u,Math.max(0,c)/n.layout.height))*ne.boxName.size;return n.view?{mode:n.view,textPx:a}:{mode:a>=ng?"fixed":"follow",textPx:a}}var al=n=>`font:${n.weight} ${n.size}px var(--${n.family})`,Yt=n=>`${n}px`;function Zx(){const n=P.player,o=Yt(n.hidden);return[`.dg-player{display:flex;flex-direction:column;gap:${Yt(n.gap)};color:var(--ink)}`,`.dg-player .dg-frame{border-radius:${Yt(n.radius)};overflow:hidden}`,".dg-bar{container:dg-bar/inline-size}",`.dg-row{display:flex;align-items:flex-start;gap:${Yt(n.gap)}}`,`.dg-btns{display:flex;gap:${Yt(n.gap/2)};flex:none}`,`.dg-btn{width:${Yt(n.button)};height:${Yt(n.button)};border-radius:${Yt(n.radius)};border:${Yt(P.stroke.hair)} solid var(--hair);background:var(--surf);color:var(--ink);${al(ne.button)};cursor:pointer}`,`.dg-btn:focus-visible{outline:${Yt(n.focus)} solid var(--c-blue);outline-offset:${Yt(n.focus)}}`,`.dg-say{display:flex;gap:${Yt(n.gap)};min-width:0}`,`.dg-no{${al(ne.stepNo)};color:var(--mute);padding-top:${Yt(n.focus)}}`,".dg-txt{display:grid;grid-template-columns:minmax(0,1fr);min-width:0}",".dg-txt>*{grid-area:1/1}",".dg-room{visibility:hidden}",`.dg-tt{${al(ne.stepTitle)};margin:0}`,`.dg-tb{${al(ne.stepBody)};color:var(--ink2);margin:0;white-space:pre-line}`,`.dg-sr{position:absolute;width:${o};height:${o};margin:-${o};padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}`,`@container dg-bar (width < ${Yt(n.narrow)}){.dg-row{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;gap:0 ${Yt(n.gap)}}.dg-say,.dg-txt,.dg-txt>*{display:contents}.dg-btns{grid-area:1/1;margin-bottom:${Yt(n.gap/2)}}.dg-btn{width:${Yt(n.touch)};height:${Yt(n.touch)}}.dg-no{grid-area:1/2;display:flex;align-items:center;min-height:${Yt(n.touch)};padding-top:0}.dg-tt{grid-area:2/1/3/3}.dg-tb{grid-area:3/1/4/3}}`,`@media (pointer: coarse){.dg-btn{width:${Yt(n.touch)};height:${Yt(n.touch)}}}`,`.dg-spot{fill:none;stroke:var(--t-amber);stroke-width:${Yt(P.stroke.mark)};stroke-dasharray:${P.mark.dash} ${P.mark.gap};pointer-events:none}`].join("")}function Kx(n){if(n.getElementById("dragon-player-css"))return;const o=n.createElement("style");o.id="dragon-player-css",o.textContent=Zx(),n.head.appendChild(o)}var Ai={prev:"‹",pause:"❚❚",play:"▶",next:"›"},x0="http://www.w3.org/2000/svg",w0=n=>String(n).padStart(2,"0"),Wx=(n,o)=>`${w0(n+1)}/${w0(o)}`;function _g(n,o,c={}){const u=n.ownerDocument,d=u.defaultView,a=!!d?.matchMedia?.("(prefers-reduced-motion: reduce)").matches,r=Vd(o,c),l=c.lang??"ja",f=cs[l],p=Ag(c,r.theme),{timeline:g}=r,b=r.diagram.steps,w=b.length;Kx(u);const x=u.createElement("div");x.className="dg-player",x.dataset.dragon="player",x.setAttribute("style",`${tg};${eg(p,r.theme)}`);const _=u.createElement("div");_.className="dg-frame";const E=(Ae,_e,je)=>{const qe=u.createElement("button");return qe.type="button",qe.className="dg-btn",qe.dataset.dragon=Ae,qe.setAttribute("aria-label",_e),qe.textContent=je,qe},M=E("prev",f.prev,Ai.prev),N=E("toggle",f.pause,Ai.pause),$=E("next",f.next,Ai.next),j=u.createElement("div");j.className="dg-btns",j.setAttribute("lang",l),j.append(M,N,$);const G=u.createElement("div");G.className="dg-say",G.setAttribute("aria-hidden","true");const K=u.createElement("div");K.className="dg-no",K.dataset.dragon="step-no";const q=u.createElement("div");q.className="dg-txt";const U=u.createElement("p");U.className="dg-tt",U.dataset.dragon="step-title";const z=u.createElement("p");z.className="dg-tb",z.dataset.dragon="step-body";const Q=u.createElement("div");Q.append(U,z),q.append(Q);for(const Ae of b){const _e=u.createElement("div");_e.className="dg-room",_e.dataset.dragon="caption-room";const je=u.createElement("p");je.className="dg-tt",je.textContent=Ae.title;const qe=u.createElement("p");qe.className="dg-tb",qe.textContent=Ae.body,_e.append(je,qe),q.append(_e)}G.append(K,q);for(const Ae of[K,U,z])Ae.setAttribute("aria-hidden","true");const re=u.createElement("div");re.className="dg-row",re.append(j,G);const ue=u.createElement("div");ue.className="dg-bar",ue.append(re);const he=u.createElement("ol");he.className="dg-sr",he.dataset.dragon="steps",he.setAttribute("aria-label",f.steps(r.diagram.title));for(const Ae of b){const _e=u.createElement("li"),je=u.createElement("strong");je.textContent=Ae.title,_e.append(je);for(const qe of Ae.body.split(`
`)){const nt=u.createElement("p");nt.textContent=qe,_e.append(nt)}if(Ae.sources){const qe=u.createElement("ul");for(const nt of Ae.sources){const _t=u.createElement("a");_t.href=nt.url,_t.textContent=nt.name;const Ut=u.createElement("li");Ut.append(_t),qe.append(Ut)}_e.append(qe)}he.append(_e)}x.append(_,ue,he),n.append(x);const fe=()=>_.clientWidth||n.clientWidth||r.layout.width,Ce=()=>{if(!c.fitHeight||!d)return;const Ae=d.getComputedStyle(_),_e=_.clientHeight-(Number.parseFloat(Ae.paddingTop)||0)-(Number.parseFloat(Ae.paddingBottom)||0);return _e>0?_e:void 0};let $e=v0(r,fe(),Ce()).mode,C=fe(),S=Ce(),F=null,Y=c.pausedAt===void 0?0:Math.min(w-1,Math.max(0,c.pausedAt)),oe=!a&&c.pausedAt===void 0,D=oe?0:g.stills[Y]??0;const T=g.stills[w-1]??0;let te=Date.now(),de=[];const ve=()=>{if(!F)return;for(const je of F.querySelectorAll(".dg-spots"))je.remove();if(de.length===0)return;const Ae=P.mark,_e=u.createElementNS(x0,"g");_e.setAttribute("class","dg-spots");for(const je of de){const qe=u.createElementNS(x0,"rect");qe.setAttribute("class","dg-spot"),qe.setAttribute("x",String(je.x-Ae.pad)),qe.setAttribute("y",String(je.y-Ae.pad)),qe.setAttribute("width",String(je.w+Ae.pad*2)),qe.setAttribute("height",String(je.h+Ae.pad*2)),qe.setAttribute("rx",String(Ae.radius)),_e.append(qe)}(F.querySelector('g[clip-path^="url(#dg-vp-"] > g.dg-a')??F).append(_e)},Se=Ae=>{let _e;if(Ae!==void 0){const je=u.createElement("div");je.innerHTML=Ae,_e=je.querySelector("svg")}else _e=F?F.cloneNode(!0):null;_e&&(_e.setAttribute("aria-hidden","true"),_e.removeAttribute("role"),_e.removeAttribute("aria-label"),_e.style.setProperty("--at",String(D)),_e.style.setProperty("--play",oe?"running":"paused"),_e.dataset.motion=oe?"play":"still",F?F.replaceWith(_e):_.append(_e),F=_e,te=Date.now(),ve())},Ne=()=>$e==="follow"?kg(r.diagram,r.layout,g,p,r.theme,{width:C,...S===void 0?{}:{height:S},lang:l}):r.svg,Ye=()=>oe?(D+(Date.now()-te)/1e3)%g.total:D,Fe=Ae=>{let _e=0;return g.steps.forEach((je,qe)=>{je.start<=Ae&&(_e=qe)}),_e},ot=()=>{const Ae=b[Y];K.textContent=Wx(Y,w),U.textContent=Ae?.title??"",z.textContent=Ae?.body??"",N.setAttribute("aria-label",oe?f.pause:f.play),N.textContent=oe?Ai.pause:Ai.play,c.onStep?.(Y)},X=(Ae,_e)=>{D=Ae,oe=_e,Se(),ot()},L=Ae=>{Y=Math.min(w-1,Math.max(0,Ae));const _e=g.steps[Y];X(oe?_e.start:g.stills[Y]??_e.start,oe)},Ee=()=>{c.playOnce&&D>=T&&(Y=0,D=0),X(D,!0)};Se(Ne()),ot();const V=d?.setInterval(()=>{if(!oe)return;if(c.playOnce&&D+(Date.now()-te)/1e3>=T){Y=w-1,X(T,!1);return}const Ae=Fe(Ye());Ae!==Y&&(Y=Ae,ot())},120),ye=()=>L(Y-1),k=()=>L(Y+1),W=()=>oe?X(Ye(),!1):Ee(),Z=Ae=>{const _e=Ae.target?.closest?.("[data-step]"),je=_e?Number(_e.getAttribute("data-step")):Number.NaN;Number.isInteger(je)&&L(je)};M.addEventListener("click",ye),$.addEventListener("click",k),N.addEventListener("click",W),_.addEventListener("click",Z);const be=d?.ResizeObserver,Be=be?new be(()=>{const Ae=fe(),_e=Ce(),je=v0(r,Ae,_e).mode;if(je===$e&&($e==="fixed"||Ae===C&&_e===S))return;const qe=Ye();$e=je,C=Ae,S=_e,D=qe,Se(Ne())}):void 0;return Be?.observe(_),{get step(){return Y},get playing(){return oe},next:k,prev:ye,play:()=>{oe||Ee()},pause:()=>{oe&&X(Ye(),!1)},goTo:Ae=>{oe=!1,L(Ae)},mark:Ae=>{de=Ae,ve()},destroy:()=>{V!==void 0&&d?.clearInterval(V),Be?.disconnect(),M.removeEventListener("click",ye),$.removeEventListener("click",k),N.removeEventListener("click",W),_.removeEventListener("click",Z),x.remove()}}}var dd={exports:{}},et={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var k0;function Ix(){if(k0)return et;k0=1;var n=Symbol.for("react.transitional.element"),o=Symbol.for("react.portal"),c=Symbol.for("react.fragment"),u=Symbol.for("react.strict_mode"),d=Symbol.for("react.profiler"),a=Symbol.for("react.consumer"),r=Symbol.for("react.context"),l=Symbol.for("react.forward_ref"),f=Symbol.for("react.suspense"),p=Symbol.for("react.memo"),g=Symbol.for("react.lazy"),b=Symbol.for("react.activity"),w=Symbol.iterator;function x(D){return D===null||typeof D!="object"?null:(D=w&&D[w]||D["@@iterator"],typeof D=="function"?D:null)}var _={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},E=Object.assign,M={};function N(D,T,te){this.props=D,this.context=T,this.refs=M,this.updater=te||_}N.prototype.isReactComponent={},N.prototype.setState=function(D,T){if(typeof D!="object"&&typeof D!="function"&&D!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,D,T,"setState")},N.prototype.forceUpdate=function(D){this.updater.enqueueForceUpdate(this,D,"forceUpdate")};function $(){}$.prototype=N.prototype;function j(D,T,te){this.props=D,this.context=T,this.refs=M,this.updater=te||_}var G=j.prototype=new $;G.constructor=j,E(G,N.prototype),G.isPureReactComponent=!0;var K=Array.isArray;function q(){}var U={H:null,A:null,T:null,S:null},z=Object.prototype.hasOwnProperty;function Q(D,T,te){var de=te.ref;return{$$typeof:n,type:D,key:T,ref:de!==void 0?de:null,props:te}}function re(D,T){return Q(D.type,T,D.props)}function ue(D){return typeof D=="object"&&D!==null&&D.$$typeof===n}function he(D){var T={"=":"=0",":":"=2"};return"$"+D.replace(/[=:]/g,function(te){return T[te]})}var fe=/\/+/g;function Ce(D,T){return typeof D=="object"&&D!==null&&D.key!=null?he(""+D.key):T.toString(36)}function $e(D){switch(D.status){case"fulfilled":return D.value;case"rejected":throw D.reason;default:switch(typeof D.status=="string"?D.then(q,q):(D.status="pending",D.then(function(T){D.status==="pending"&&(D.status="fulfilled",D.value=T)},function(T){D.status==="pending"&&(D.status="rejected",D.reason=T)})),D.status){case"fulfilled":return D.value;case"rejected":throw D.reason}}throw D}function C(D,T,te,de,ve){var Se=typeof D;(Se==="undefined"||Se==="boolean")&&(D=null);var Ne=!1;if(D===null)Ne=!0;else switch(Se){case"bigint":case"string":case"number":Ne=!0;break;case"object":switch(D.$$typeof){case n:case o:Ne=!0;break;case g:return Ne=D._init,C(Ne(D._payload),T,te,de,ve)}}if(Ne)return ve=ve(D),Ne=de===""?"."+Ce(D,0):de,K(ve)?(te="",Ne!=null&&(te=Ne.replace(fe,"$&/")+"/"),C(ve,T,te,"",function(ot){return ot})):ve!=null&&(ue(ve)&&(ve=re(ve,te+(ve.key==null||D&&D.key===ve.key?"":(""+ve.key).replace(fe,"$&/")+"/")+Ne)),T.push(ve)),1;Ne=0;var Ye=de===""?".":de+":";if(K(D))for(var Fe=0;Fe<D.length;Fe++)de=D[Fe],Se=Ye+Ce(de,Fe),Ne+=C(de,T,te,Se,ve);else if(Fe=x(D),typeof Fe=="function")for(D=Fe.call(D),Fe=0;!(de=D.next()).done;)de=de.value,Se=Ye+Ce(de,Fe++),Ne+=C(de,T,te,Se,ve);else if(Se==="object"){if(typeof D.then=="function")return C($e(D),T,te,de,ve);throw T=String(D),Error("Objects are not valid as a React child (found: "+(T==="[object Object]"?"object with keys {"+Object.keys(D).join(", ")+"}":T)+"). If you meant to render a collection of children, use an array instead.")}return Ne}function S(D,T,te){if(D==null)return D;var de=[],ve=0;return C(D,de,"","",function(Se){return T.call(te,Se,ve++)}),de}function F(D){if(D._status===-1){var T=D._result;T=T(),T.then(function(te){(D._status===0||D._status===-1)&&(D._status=1,D._result=te)},function(te){(D._status===0||D._status===-1)&&(D._status=2,D._result=te)}),D._status===-1&&(D._status=0,D._result=T)}if(D._status===1)return D._result.default;throw D._result}var Y=typeof reportError=="function"?reportError:function(D){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var T=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof D=="object"&&D!==null&&typeof D.message=="string"?String(D.message):String(D),error:D});if(!window.dispatchEvent(T))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",D);return}console.error(D)},oe={map:S,forEach:function(D,T,te){S(D,function(){T.apply(this,arguments)},te)},count:function(D){var T=0;return S(D,function(){T++}),T},toArray:function(D){return S(D,function(T){return T})||[]},only:function(D){if(!ue(D))throw Error("React.Children.only expected to receive a single React element child.");return D}};return et.Activity=b,et.Children=oe,et.Component=N,et.Fragment=c,et.Profiler=d,et.PureComponent=j,et.StrictMode=u,et.Suspense=f,et.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=U,et.__COMPILER_RUNTIME={__proto__:null,c:function(D){return U.H.useMemoCache(D)}},et.cache=function(D){return function(){return D.apply(null,arguments)}},et.cacheSignal=function(){return null},et.cloneElement=function(D,T,te){if(D==null)throw Error("The argument must be a React element, but you passed "+D+".");var de=E({},D.props),ve=D.key;if(T!=null)for(Se in T.key!==void 0&&(ve=""+T.key),T)!z.call(T,Se)||Se==="key"||Se==="__self"||Se==="__source"||Se==="ref"&&T.ref===void 0||(de[Se]=T[Se]);var Se=arguments.length-2;if(Se===1)de.children=te;else if(1<Se){for(var Ne=Array(Se),Ye=0;Ye<Se;Ye++)Ne[Ye]=arguments[Ye+2];de.children=Ne}return Q(D.type,ve,de)},et.createContext=function(D){return D={$$typeof:r,_currentValue:D,_currentValue2:D,_threadCount:0,Provider:null,Consumer:null},D.Provider=D,D.Consumer={$$typeof:a,_context:D},D},et.createElement=function(D,T,te){var de,ve={},Se=null;if(T!=null)for(de in T.key!==void 0&&(Se=""+T.key),T)z.call(T,de)&&de!=="key"&&de!=="__self"&&de!=="__source"&&(ve[de]=T[de]);var Ne=arguments.length-2;if(Ne===1)ve.children=te;else if(1<Ne){for(var Ye=Array(Ne),Fe=0;Fe<Ne;Fe++)Ye[Fe]=arguments[Fe+2];ve.children=Ye}if(D&&D.defaultProps)for(de in Ne=D.defaultProps,Ne)ve[de]===void 0&&(ve[de]=Ne[de]);return Q(D,Se,ve)},et.createRef=function(){return{current:null}},et.forwardRef=function(D){return{$$typeof:l,render:D}},et.isValidElement=ue,et.lazy=function(D){return{$$typeof:g,_payload:{_status:-1,_result:D},_init:F}},et.memo=function(D,T){return{$$typeof:p,type:D,compare:T===void 0?null:T}},et.startTransition=function(D){var T=U.T,te={};U.T=te;try{var de=D(),ve=U.S;ve!==null&&ve(te,de),typeof de=="object"&&de!==null&&typeof de.then=="function"&&de.then(q,Y)}catch(Se){Y(Se)}finally{T!==null&&te.types!==null&&(T.types=te.types),U.T=T}},et.unstable_useCacheRefresh=function(){return U.H.useCacheRefresh()},et.use=function(D){return U.H.use(D)},et.useActionState=function(D,T,te){return U.H.useActionState(D,T,te)},et.useCallback=function(D,T){return U.H.useCallback(D,T)},et.useContext=function(D){return U.H.useContext(D)},et.useDebugValue=function(){},et.useDeferredValue=function(D,T){return U.H.useDeferredValue(D,T)},et.useEffect=function(D,T){return U.H.useEffect(D,T)},et.useEffectEvent=function(D){return U.H.useEffectEvent(D)},et.useId=function(){return U.H.useId()},et.useImperativeHandle=function(D,T,te){return U.H.useImperativeHandle(D,T,te)},et.useInsertionEffect=function(D,T){return U.H.useInsertionEffect(D,T)},et.useLayoutEffect=function(D,T){return U.H.useLayoutEffect(D,T)},et.useMemo=function(D,T){return U.H.useMemo(D,T)},et.useOptimistic=function(D,T){return U.H.useOptimistic(D,T)},et.useReducer=function(D,T,te){return U.H.useReducer(D,T,te)},et.useRef=function(D){return U.H.useRef(D)},et.useState=function(D){return U.H.useState(D)},et.useSyncExternalStore=function(D,T,te){return U.H.useSyncExternalStore(D,T,te)},et.useTransition=function(){return U.H.useTransition()},et.version="19.2.7",et}var E0;function Xd(){return E0||(E0=1,dd.exports=Ix()),dd.exports}var Re=Xd(),hd={exports:{}},_i={},pd={exports:{}},fd={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var A0;function e3(){return A0||(A0=1,(function(n){function o(C,S){var F=C.length;C.push(S);e:for(;0<F;){var Y=F-1>>>1,oe=C[Y];if(0<d(oe,S))C[Y]=S,C[F]=oe,F=Y;else break e}}function c(C){return C.length===0?null:C[0]}function u(C){if(C.length===0)return null;var S=C[0],F=C.pop();if(F!==S){C[0]=F;e:for(var Y=0,oe=C.length,D=oe>>>1;Y<D;){var T=2*(Y+1)-1,te=C[T],de=T+1,ve=C[de];if(0>d(te,F))de<oe&&0>d(ve,te)?(C[Y]=ve,C[de]=F,Y=de):(C[Y]=te,C[T]=F,Y=T);else if(de<oe&&0>d(ve,F))C[Y]=ve,C[de]=F,Y=de;else break e}}return S}function d(C,S){var F=C.sortIndex-S.sortIndex;return F!==0?F:C.id-S.id}if(n.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var a=performance;n.unstable_now=function(){return a.now()}}else{var r=Date,l=r.now();n.unstable_now=function(){return r.now()-l}}var f=[],p=[],g=1,b=null,w=3,x=!1,_=!1,E=!1,M=!1,N=typeof setTimeout=="function"?setTimeout:null,$=typeof clearTimeout=="function"?clearTimeout:null,j=typeof setImmediate<"u"?setImmediate:null;function G(C){for(var S=c(p);S!==null;){if(S.callback===null)u(p);else if(S.startTime<=C)u(p),S.sortIndex=S.expirationTime,o(f,S);else break;S=c(p)}}function K(C){if(E=!1,G(C),!_)if(c(f)!==null)_=!0,q||(q=!0,he());else{var S=c(p);S!==null&&$e(K,S.startTime-C)}}var q=!1,U=-1,z=5,Q=-1;function re(){return M?!0:!(n.unstable_now()-Q<z)}function ue(){if(M=!1,q){var C=n.unstable_now();Q=C;var S=!0;try{e:{_=!1,E&&(E=!1,$(U),U=-1),x=!0;var F=w;try{t:{for(G(C),b=c(f);b!==null&&!(b.expirationTime>C&&re());){var Y=b.callback;if(typeof Y=="function"){b.callback=null,w=b.priorityLevel;var oe=Y(b.expirationTime<=C);if(C=n.unstable_now(),typeof oe=="function"){b.callback=oe,G(C),S=!0;break t}b===c(f)&&u(f),G(C)}else u(f);b=c(f)}if(b!==null)S=!0;else{var D=c(p);D!==null&&$e(K,D.startTime-C),S=!1}}break e}finally{b=null,w=F,x=!1}S=void 0}}finally{S?he():q=!1}}}var he;if(typeof j=="function")he=function(){j(ue)};else if(typeof MessageChannel<"u"){var fe=new MessageChannel,Ce=fe.port2;fe.port1.onmessage=ue,he=function(){Ce.postMessage(null)}}else he=function(){N(ue,0)};function $e(C,S){U=N(function(){C(n.unstable_now())},S)}n.unstable_IdlePriority=5,n.unstable_ImmediatePriority=1,n.unstable_LowPriority=4,n.unstable_NormalPriority=3,n.unstable_Profiling=null,n.unstable_UserBlockingPriority=2,n.unstable_cancelCallback=function(C){C.callback=null},n.unstable_forceFrameRate=function(C){0>C||125<C?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):z=0<C?Math.floor(1e3/C):5},n.unstable_getCurrentPriorityLevel=function(){return w},n.unstable_next=function(C){switch(w){case 1:case 2:case 3:var S=3;break;default:S=w}var F=w;w=S;try{return C()}finally{w=F}},n.unstable_requestPaint=function(){M=!0},n.unstable_runWithPriority=function(C,S){switch(C){case 1:case 2:case 3:case 4:case 5:break;default:C=3}var F=w;w=C;try{return S()}finally{w=F}},n.unstable_scheduleCallback=function(C,S,F){var Y=n.unstable_now();switch(typeof F=="object"&&F!==null?(F=F.delay,F=typeof F=="number"&&0<F?Y+F:Y):F=Y,C){case 1:var oe=-1;break;case 2:oe=250;break;case 5:oe=1073741823;break;case 4:oe=1e4;break;default:oe=5e3}return oe=F+oe,C={id:g++,callback:S,priorityLevel:C,startTime:F,expirationTime:oe,sortIndex:-1},F>Y?(C.sortIndex=F,o(p,C),c(f)===null&&C===c(p)&&(E?($(U),U=-1):E=!0,$e(K,F-Y))):(C.sortIndex=oe,o(f,C),_||x||(_=!0,q||(q=!0,he()))),C},n.unstable_shouldYield=re,n.unstable_wrapCallback=function(C){var S=w;return function(){var F=w;w=S;try{return C.apply(this,arguments)}finally{w=F}}}})(fd)),fd}var _0;function t3(){return _0||(_0=1,pd.exports=e3()),pd.exports}var md={exports:{}},vn={};/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var S0;function n3(){if(S0)return vn;S0=1;var n=Xd();function o(f){var p="https://react.dev/errors/"+f;if(1<arguments.length){p+="?args[]="+encodeURIComponent(arguments[1]);for(var g=2;g<arguments.length;g++)p+="&args[]="+encodeURIComponent(arguments[g])}return"Minified React error #"+f+"; visit "+p+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function c(){}var u={d:{f:c,r:function(){throw Error(o(522))},D:c,C:c,L:c,m:c,X:c,S:c,M:c},p:0,findDOMNode:null},d=Symbol.for("react.portal");function a(f,p,g){var b=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:d,key:b==null?null:""+b,children:f,containerInfo:p,implementation:g}}var r=n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function l(f,p){if(f==="font")return"";if(typeof p=="string")return p==="use-credentials"?p:""}return vn.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=u,vn.createPortal=function(f,p){var g=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!p||p.nodeType!==1&&p.nodeType!==9&&p.nodeType!==11)throw Error(o(299));return a(f,p,null,g)},vn.flushSync=function(f){var p=r.T,g=u.p;try{if(r.T=null,u.p=2,f)return f()}finally{r.T=p,u.p=g,u.d.f()}},vn.preconnect=function(f,p){typeof f=="string"&&(p?(p=p.crossOrigin,p=typeof p=="string"?p==="use-credentials"?p:"":void 0):p=null,u.d.C(f,p))},vn.prefetchDNS=function(f){typeof f=="string"&&u.d.D(f)},vn.preinit=function(f,p){if(typeof f=="string"&&p&&typeof p.as=="string"){var g=p.as,b=l(g,p.crossOrigin),w=typeof p.integrity=="string"?p.integrity:void 0,x=typeof p.fetchPriority=="string"?p.fetchPriority:void 0;g==="style"?u.d.S(f,typeof p.precedence=="string"?p.precedence:void 0,{crossOrigin:b,integrity:w,fetchPriority:x}):g==="script"&&u.d.X(f,{crossOrigin:b,integrity:w,fetchPriority:x,nonce:typeof p.nonce=="string"?p.nonce:void 0})}},vn.preinitModule=function(f,p){if(typeof f=="string")if(typeof p=="object"&&p!==null){if(p.as==null||p.as==="script"){var g=l(p.as,p.crossOrigin);u.d.M(f,{crossOrigin:g,integrity:typeof p.integrity=="string"?p.integrity:void 0,nonce:typeof p.nonce=="string"?p.nonce:void 0})}}else p==null&&u.d.M(f)},vn.preload=function(f,p){if(typeof f=="string"&&typeof p=="object"&&p!==null&&typeof p.as=="string"){var g=p.as,b=l(g,p.crossOrigin);u.d.L(f,g,{crossOrigin:b,integrity:typeof p.integrity=="string"?p.integrity:void 0,nonce:typeof p.nonce=="string"?p.nonce:void 0,type:typeof p.type=="string"?p.type:void 0,fetchPriority:typeof p.fetchPriority=="string"?p.fetchPriority:void 0,referrerPolicy:typeof p.referrerPolicy=="string"?p.referrerPolicy:void 0,imageSrcSet:typeof p.imageSrcSet=="string"?p.imageSrcSet:void 0,imageSizes:typeof p.imageSizes=="string"?p.imageSizes:void 0,media:typeof p.media=="string"?p.media:void 0})}},vn.preloadModule=function(f,p){if(typeof f=="string")if(p){var g=l(p.as,p.crossOrigin);u.d.m(f,{as:typeof p.as=="string"&&p.as!=="script"?p.as:void 0,crossOrigin:g,integrity:typeof p.integrity=="string"?p.integrity:void 0})}else u.d.m(f)},vn.requestFormReset=function(f){u.d.r(f)},vn.unstable_batchedUpdates=function(f,p){return f(p)},vn.useFormState=function(f,p,g){return r.H.useFormState(f,p,g)},vn.useFormStatus=function(){return r.H.useHostTransitionStatus()},vn.version="19.2.7",vn}var $0;function a3(){if($0)return md.exports;$0=1;function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(o){console.error(o)}}return n(),md.exports=n3(),md.exports}/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var D0;function s3(){if(D0)return _i;D0=1;var n=t3(),o=Xd(),c=a3();function u(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var s=2;s<arguments.length;s++)t+="&args[]="+encodeURIComponent(arguments[s])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function d(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function a(e){var t=e,s=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(s=t.return),e=t.return;while(e)}return t.tag===3?s:null}function r(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function l(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function f(e){if(a(e)!==e)throw Error(u(188))}function p(e){var t=e.alternate;if(!t){if(t=a(e),t===null)throw Error(u(188));return t!==e?null:e}for(var s=e,i=t;;){var h=s.return;if(h===null)break;var m=h.alternate;if(m===null){if(i=h.return,i!==null){s=i;continue}break}if(h.child===m.child){for(m=h.child;m;){if(m===s)return f(h),e;if(m===i)return f(h),t;m=m.sibling}throw Error(u(188))}if(s.return!==i.return)s=h,i=m;else{for(var y=!1,A=h.child;A;){if(A===s){y=!0,s=h,i=m;break}if(A===i){y=!0,i=h,s=m;break}A=A.sibling}if(!y){for(A=m.child;A;){if(A===s){y=!0,s=m,i=h;break}if(A===i){y=!0,i=m,s=h;break}A=A.sibling}if(!y)throw Error(u(189))}}if(s.alternate!==i)throw Error(u(190))}if(s.tag!==3)throw Error(u(188));return s.stateNode.current===s?e:t}function g(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=g(e),t!==null)return t;e=e.sibling}return null}var b=Object.assign,w=Symbol.for("react.element"),x=Symbol.for("react.transitional.element"),_=Symbol.for("react.portal"),E=Symbol.for("react.fragment"),M=Symbol.for("react.strict_mode"),N=Symbol.for("react.profiler"),$=Symbol.for("react.consumer"),j=Symbol.for("react.context"),G=Symbol.for("react.forward_ref"),K=Symbol.for("react.suspense"),q=Symbol.for("react.suspense_list"),U=Symbol.for("react.memo"),z=Symbol.for("react.lazy"),Q=Symbol.for("react.activity"),re=Symbol.for("react.memo_cache_sentinel"),ue=Symbol.iterator;function he(e){return e===null||typeof e!="object"?null:(e=ue&&e[ue]||e["@@iterator"],typeof e=="function"?e:null)}var fe=Symbol.for("react.client.reference");function Ce(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===fe?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case E:return"Fragment";case N:return"Profiler";case M:return"StrictMode";case K:return"Suspense";case q:return"SuspenseList";case Q:return"Activity"}if(typeof e=="object")switch(e.$$typeof){case _:return"Portal";case j:return e.displayName||"Context";case $:return(e._context.displayName||"Context")+".Consumer";case G:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case U:return t=e.displayName||null,t!==null?t:Ce(e.type)||"Memo";case z:t=e._payload,e=e._init;try{return Ce(e(t))}catch{}}return null}var $e=Array.isArray,C=o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,S=c.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,F={pending:!1,data:null,method:null,action:null},Y=[],oe=-1;function D(e){return{current:e}}function T(e){0>oe||(e.current=Y[oe],Y[oe]=null,oe--)}function te(e,t){oe++,Y[oe]=e.current,e.current=t}var de=D(null),ve=D(null),Se=D(null),Ne=D(null);function Ye(e,t){switch(te(Se,t),te(ve,e),te(de,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?fm(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=fm(t),e=mm(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}T(de),te(de,e)}function Fe(){T(de),T(ve),T(Se)}function ot(e){e.memoizedState!==null&&te(Ne,e);var t=de.current,s=mm(t,e.type);t!==s&&(te(ve,e),te(de,s))}function X(e){ve.current===e&&(T(de),T(ve)),Ne.current===e&&(T(Ne),vi._currentValue=F)}var L,Ee;function V(e){if(L===void 0)try{throw Error()}catch(s){var t=s.stack.trim().match(/\n( *(at )?)/);L=t&&t[1]||"",Ee=-1<s.stack.indexOf(`
    at`)?" (<anonymous>)":-1<s.stack.indexOf("@")?"@unknown:0:0":""}return`
`+L+e+Ee}var ye=!1;function k(e,t){if(!e||ye)return"";ye=!0;var s=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var i={DetermineComponentFrameRoot:function(){try{if(t){var ke=function(){throw Error()};if(Object.defineProperty(ke.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(ke,[])}catch(le){var ie=le}Reflect.construct(e,[],ke)}else{try{ke.call()}catch(le){ie=le}e.call(ke.prototype)}}else{try{throw Error()}catch(le){ie=le}(ke=e())&&typeof ke.catch=="function"&&ke.catch(function(){})}}catch(le){if(le&&ie&&typeof le.stack=="string")return[le.stack,ie.stack]}return[null,null]}};i.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var h=Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot,"name");h&&h.configurable&&Object.defineProperty(i.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var m=i.DetermineComponentFrameRoot(),y=m[0],A=m[1];if(y&&A){var H=y.split(`
`),se=A.split(`
`);for(h=i=0;i<H.length&&!H[i].includes("DetermineComponentFrameRoot");)i++;for(;h<se.length&&!se[h].includes("DetermineComponentFrameRoot");)h++;if(i===H.length||h===se.length)for(i=H.length-1,h=se.length-1;1<=i&&0<=h&&H[i]!==se[h];)h--;for(;1<=i&&0<=h;i--,h--)if(H[i]!==se[h]){if(i!==1||h!==1)do if(i--,h--,0>h||H[i]!==se[h]){var me=`
`+H[i].replace(" at new "," at ");return e.displayName&&me.includes("<anonymous>")&&(me=me.replace("<anonymous>",e.displayName)),me}while(1<=i&&0<=h);break}}}finally{ye=!1,Error.prepareStackTrace=s}return(s=e?e.displayName||e.name:"")?V(s):""}function W(e,t){switch(e.tag){case 26:case 27:case 5:return V(e.type);case 16:return V("Lazy");case 13:return e.child!==t&&t!==null?V("Suspense Fallback"):V("Suspense");case 19:return V("SuspenseList");case 0:case 15:return k(e.type,!1);case 11:return k(e.type.render,!1);case 1:return k(e.type,!0);case 31:return V("Activity");default:return""}}function Z(e){try{var t="",s=null;do t+=W(e,s),s=e,e=e.return;while(e);return t}catch(i){return`
Error generating stack: `+i.message+`
`+i.stack}}var be=Object.prototype.hasOwnProperty,Be=n.unstable_scheduleCallback,Ae=n.unstable_cancelCallback,_e=n.unstable_shouldYield,je=n.unstable_requestPaint,qe=n.unstable_now,nt=n.unstable_getCurrentPriorityLevel,_t=n.unstable_ImmediatePriority,Ut=n.unstable_UserBlockingPriority,rt=n.unstable_NormalPriority,Vt=n.unstable_LowPriority,Zt=n.unstable_IdlePriority,sn=n.log,qn=n.unstable_setDisableYieldValue,cn=null,Xt=null;function yn(e){if(typeof sn=="function"&&qn(e),Xt&&typeof Xt.setStrictMode=="function")try{Xt.setStrictMode(cn,e)}catch{}}var un=Math.clz32?Math.clz32:De,R=Math.log,pe=Math.LN2;function De(e){return e>>>=0,e===0?32:31-(R(e)/pe|0)|0}var Je=256,Pe=262144,We=4194304;function Ft(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&261888;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function bt(e,t,s){var i=e.pendingLanes;if(i===0)return 0;var h=0,m=e.suspendedLanes,y=e.pingedLanes;e=e.warmLanes;var A=i&134217727;return A!==0?(i=A&~m,i!==0?h=Ft(i):(y&=A,y!==0?h=Ft(y):s||(s=A&~e,s!==0&&(h=Ft(s))))):(A=i&~m,A!==0?h=Ft(A):y!==0?h=Ft(y):s||(s=i&~e,s!==0&&(h=Ft(s)))),h===0?0:t!==0&&t!==h&&(t&m)===0&&(m=h&-h,s=t&-t,m>=s||m===32&&(s&4194048)!==0)?t:h}function zt(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function Fn(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function O(){var e=We;return We<<=1,(We&62914560)===0&&(We=4194304),e}function B(e){for(var t=[],s=0;31>s;s++)t.push(e);return t}function I(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function ge(e,t,s,i,h,m){var y=e.pendingLanes;e.pendingLanes=s,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=s,e.entangledLanes&=s,e.errorRecoveryDisabledLanes&=s,e.shellSuspendCounter=0;var A=e.entanglements,H=e.expirationTimes,se=e.hiddenUpdates;for(s=y&~s;0<s;){var me=31-un(s),ke=1<<me;A[me]=0,H[me]=-1;var ie=se[me];if(ie!==null)for(se[me]=null,me=0;me<ie.length;me++){var le=ie[me];le!==null&&(le.lane&=-536870913)}s&=~ke}i!==0&&we(e,i,0),m!==0&&h===0&&e.tag!==0&&(e.suspendedLanes|=m&~(y&~t))}function we(e,t,s){e.pendingLanes|=t,e.suspendedLanes&=~t;var i=31-un(t);e.entangledLanes|=t,e.entanglements[i]=e.entanglements[i]|1073741824|s&261930}function Oe(e,t){var s=e.entangledLanes|=t;for(e=e.entanglements;s;){var i=31-un(s),h=1<<i;h&t|e[i]&t&&(e[i]|=t),s&=~h}}function Te(e,t){var s=t&-t;return s=(s&42)!==0?1:ze(s),(s&(e.suspendedLanes|t))!==0?0:s}function ze(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Ve(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function ft(){var e=S.p;return e!==0?e:(e=window.event,e===void 0?32:qm(e.type))}function nn(e,t){var s=S.p;try{return S.p=e,t()}finally{S.p=s}}var kt=Math.random().toString(36).slice(2),mt="__reactFiber$"+kt,bn="__reactProps$"+kt,Bs="__reactContainer$"+kt,Xl="__reactEvents$"+kt,Jg="__reactListeners$"+kt,Qg="__reactHandles$"+kt,eh="__reactResources$"+kt,Bo="__reactMarker$"+kt;function Jl(e){delete e[mt],delete e[bn],delete e[Xl],delete e[Jg],delete e[Qg]}function js(e){var t=e[mt];if(t)return t;for(var s=e.parentNode;s;){if(t=s[Bs]||s[mt]){if(s=t.alternate,t.child!==null||s!==null&&s.child!==null)for(e=km(e);e!==null;){if(s=e[mt])return s;e=km(e)}return t}e=s,s=e.parentNode}return null}function zs(e){if(e=e[mt]||e[Bs]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function jo(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(u(33))}function Rs(e){var t=e[eh];return t||(t=e[eh]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function on(e){e[Bo]=!0}var th=new Set,nh={};function us(e,t){qs(e,t),qs(e+"Capture",t)}function qs(e,t){for(nh[e]=t,e=0;e<t.length;e++)th.add(t[e])}var Zg=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),ah={},sh={};function Kg(e){return be.call(sh,e)?!0:be.call(ah,e)?!1:Zg.test(e)?sh[e]=!0:(ah[e]=!0,!1)}function Ui(e,t,s){if(Kg(t))if(s===null)e.removeAttribute(t);else{switch(typeof s){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var i=t.toLowerCase().slice(0,5);if(i!=="data-"&&i!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,""+s)}}function Pi(e,t,s){if(s===null)e.removeAttribute(t);else{switch(typeof s){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,""+s)}}function ha(e,t,s,i){if(i===null)e.removeAttribute(s);else{switch(typeof i){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(s);return}e.setAttributeNS(t,s,""+i)}}function Hn(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function oh(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Wg(e,t,s){var i=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof i<"u"&&typeof i.get=="function"&&typeof i.set=="function"){var h=i.get,m=i.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return h.call(this)},set:function(y){s=""+y,m.call(this,y)}}),Object.defineProperty(e,t,{enumerable:i.enumerable}),{getValue:function(){return s},setValue:function(y){s=""+y},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Ql(e){if(!e._valueTracker){var t=oh(e)?"checked":"value";e._valueTracker=Wg(e,t,""+e[t])}}function ih(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var s=t.getValue(),i="";return e&&(i=oh(e)?e.checked?"true":"false":e.value),e=i,e!==s?(t.setValue(e),!0):!1}function Gi(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}var Ig=/[\n"\\]/g;function Ln(e){return e.replace(Ig,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function Zl(e,t,s,i,h,m,y,A){e.name="",y!=null&&typeof y!="function"&&typeof y!="symbol"&&typeof y!="boolean"?e.type=y:e.removeAttribute("type"),t!=null?y==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+Hn(t)):e.value!==""+Hn(t)&&(e.value=""+Hn(t)):y!=="submit"&&y!=="reset"||e.removeAttribute("value"),t!=null?Kl(e,y,Hn(t)):s!=null?Kl(e,y,Hn(s)):i!=null&&e.removeAttribute("value"),h==null&&m!=null&&(e.defaultChecked=!!m),h!=null&&(e.checked=h&&typeof h!="function"&&typeof h!="symbol"),A!=null&&typeof A!="function"&&typeof A!="symbol"&&typeof A!="boolean"?e.name=""+Hn(A):e.removeAttribute("name")}function rh(e,t,s,i,h,m,y,A){if(m!=null&&typeof m!="function"&&typeof m!="symbol"&&typeof m!="boolean"&&(e.type=m),t!=null||s!=null){if(!(m!=="submit"&&m!=="reset"||t!=null)){Ql(e);return}s=s!=null?""+Hn(s):"",t=t!=null?""+Hn(t):s,A||t===e.value||(e.value=t),e.defaultValue=t}i=i??h,i=typeof i!="function"&&typeof i!="symbol"&&!!i,e.checked=A?e.checked:!!i,e.defaultChecked=!!i,y!=null&&typeof y!="function"&&typeof y!="symbol"&&typeof y!="boolean"&&(e.name=y),Ql(e)}function Kl(e,t,s){t==="number"&&Gi(e.ownerDocument)===e||e.defaultValue===""+s||(e.defaultValue=""+s)}function Fs(e,t,s,i){if(e=e.options,t){t={};for(var h=0;h<s.length;h++)t["$"+s[h]]=!0;for(s=0;s<e.length;s++)h=t.hasOwnProperty("$"+e[s].value),e[s].selected!==h&&(e[s].selected=h),h&&i&&(e[s].defaultSelected=!0)}else{for(s=""+Hn(s),t=null,h=0;h<e.length;h++){if(e[h].value===s){e[h].selected=!0,i&&(e[h].defaultSelected=!0);return}t!==null||e[h].disabled||(t=e[h])}t!==null&&(t.selected=!0)}}function lh(e,t,s){if(t!=null&&(t=""+Hn(t),t!==e.value&&(e.value=t),s==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=s!=null?""+Hn(s):""}function ch(e,t,s,i){if(t==null){if(i!=null){if(s!=null)throw Error(u(92));if($e(i)){if(1<i.length)throw Error(u(93));i=i[0]}s=i}s==null&&(s=""),t=s}s=Hn(t),e.defaultValue=s,i=e.textContent,i===s&&i!==""&&i!==null&&(e.value=i),Ql(e)}function Hs(e,t){if(t){var s=e.firstChild;if(s&&s===e.lastChild&&s.nodeType===3){s.nodeValue=t;return}}e.textContent=t}var ey=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function uh(e,t,s){var i=t.indexOf("--")===0;s==null||typeof s=="boolean"||s===""?i?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":i?e.setProperty(t,s):typeof s!="number"||s===0||ey.has(t)?t==="float"?e.cssFloat=s:e[t]=(""+s).trim():e[t]=s+"px"}function dh(e,t,s){if(t!=null&&typeof t!="object")throw Error(u(62));if(e=e.style,s!=null){for(var i in s)!s.hasOwnProperty(i)||t!=null&&t.hasOwnProperty(i)||(i.indexOf("--")===0?e.setProperty(i,""):i==="float"?e.cssFloat="":e[i]="");for(var h in t)i=t[h],t.hasOwnProperty(h)&&s[h]!==i&&uh(e,h,i)}else for(var m in t)t.hasOwnProperty(m)&&uh(e,m,t[m])}function Wl(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var ty=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),ny=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Yi(e){return ny.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function pa(){}var Il=null;function ec(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Ls=null,Us=null;function hh(e){var t=zs(e);if(t&&(e=t.stateNode)){var s=e[bn]||null;e:switch(e=t.stateNode,t.type){case"input":if(Zl(e,s.value,s.defaultValue,s.defaultValue,s.checked,s.defaultChecked,s.type,s.name),t=s.name,s.type==="radio"&&t!=null){for(s=e;s.parentNode;)s=s.parentNode;for(s=s.querySelectorAll('input[name="'+Ln(""+t)+'"][type="radio"]'),t=0;t<s.length;t++){var i=s[t];if(i!==e&&i.form===e.form){var h=i[bn]||null;if(!h)throw Error(u(90));Zl(i,h.value,h.defaultValue,h.defaultValue,h.checked,h.defaultChecked,h.type,h.name)}}for(t=0;t<s.length;t++)i=s[t],i.form===e.form&&ih(i)}break e;case"textarea":lh(e,s.value,s.defaultValue);break e;case"select":t=s.value,t!=null&&Fs(e,!!s.multiple,t,!1)}}}var tc=!1;function ph(e,t,s){if(tc)return e(t,s);tc=!0;try{var i=e(t);return i}finally{if(tc=!1,(Ls!==null||Us!==null)&&(Cr(),Ls&&(t=Ls,e=Us,Us=Ls=null,hh(t),e)))for(t=0;t<e.length;t++)hh(e[t])}}function zo(e,t){var s=e.stateNode;if(s===null)return null;var i=s[bn]||null;if(i===null)return null;s=i[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(e=e.type,i=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!i;break e;default:e=!1}if(e)return null;if(s&&typeof s!="function")throw Error(u(231,t,typeof s));return s}var fa=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),nc=!1;if(fa)try{var Ro={};Object.defineProperty(Ro,"passive",{get:function(){nc=!0}}),window.addEventListener("test",Ro,Ro),window.removeEventListener("test",Ro,Ro)}catch{nc=!1}var ja=null,ac=null,Vi=null;function fh(){if(Vi)return Vi;var e,t=ac,s=t.length,i,h="value"in ja?ja.value:ja.textContent,m=h.length;for(e=0;e<s&&t[e]===h[e];e++);var y=s-e;for(i=1;i<=y&&t[s-i]===h[m-i];i++);return Vi=h.slice(e,1<i?1-i:void 0)}function Xi(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function Ji(){return!0}function mh(){return!1}function _n(e){function t(s,i,h,m,y){this._reactName=s,this._targetInst=h,this.type=i,this.nativeEvent=m,this.target=y,this.currentTarget=null;for(var A in e)e.hasOwnProperty(A)&&(s=e[A],this[A]=s?s(m):m[A]);return this.isDefaultPrevented=(m.defaultPrevented!=null?m.defaultPrevented:m.returnValue===!1)?Ji:mh,this.isPropagationStopped=mh,this}return b(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var s=this.nativeEvent;s&&(s.preventDefault?s.preventDefault():typeof s.returnValue!="unknown"&&(s.returnValue=!1),this.isDefaultPrevented=Ji)},stopPropagation:function(){var s=this.nativeEvent;s&&(s.stopPropagation?s.stopPropagation():typeof s.cancelBubble!="unknown"&&(s.cancelBubble=!0),this.isPropagationStopped=Ji)},persist:function(){},isPersistent:Ji}),t}var ds={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Qi=_n(ds),qo=b({},ds,{view:0,detail:0}),ay=_n(qo),sc,oc,Fo,Zi=b({},qo,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:rc,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==Fo&&(Fo&&e.type==="mousemove"?(sc=e.screenX-Fo.screenX,oc=e.screenY-Fo.screenY):oc=sc=0,Fo=e),sc)},movementY:function(e){return"movementY"in e?e.movementY:oc}}),gh=_n(Zi),sy=b({},Zi,{dataTransfer:0}),oy=_n(sy),iy=b({},qo,{relatedTarget:0}),ic=_n(iy),ry=b({},ds,{animationName:0,elapsedTime:0,pseudoElement:0}),ly=_n(ry),cy=b({},ds,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),uy=_n(cy),dy=b({},ds,{data:0}),yh=_n(dy),hy={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},py={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},fy={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function my(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=fy[e])?!!t[e]:!1}function rc(){return my}var gy=b({},qo,{key:function(e){if(e.key){var t=hy[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Xi(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?py[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:rc,charCode:function(e){return e.type==="keypress"?Xi(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Xi(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),yy=_n(gy),by=b({},Zi,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),bh=_n(by),vy=b({},qo,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:rc}),xy=_n(vy),wy=b({},ds,{propertyName:0,elapsedTime:0,pseudoElement:0}),ky=_n(wy),Ey=b({},Zi,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),Ay=_n(Ey),_y=b({},ds,{newState:0,oldState:0}),Sy=_n(_y),$y=[9,13,27,32],lc=fa&&"CompositionEvent"in window,Ho=null;fa&&"documentMode"in document&&(Ho=document.documentMode);var Dy=fa&&"TextEvent"in window&&!Ho,vh=fa&&(!lc||Ho&&8<Ho&&11>=Ho),xh=" ",wh=!1;function kh(e,t){switch(e){case"keyup":return $y.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Eh(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Ps=!1;function Ny(e,t){switch(e){case"compositionend":return Eh(t);case"keypress":return t.which!==32?null:(wh=!0,xh);case"textInput":return e=t.data,e===xh&&wh?null:e;default:return null}}function Ty(e,t){if(Ps)return e==="compositionend"||!lc&&kh(e,t)?(e=fh(),Vi=ac=ja=null,Ps=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return vh&&t.locale!=="ko"?null:t.data;default:return null}}var My={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Ah(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!My[e.type]:t==="textarea"}function _h(e,t,s,i){Ls?Us?Us.push(i):Us=[i]:Ls=i,t=Fr(t,"onChange"),0<t.length&&(s=new Qi("onChange","change",null,s,i),e.push({event:s,listeners:t}))}var Lo=null,Uo=null;function Cy(e){lm(e,0)}function Ki(e){var t=jo(e);if(ih(t))return e}function Sh(e,t){if(e==="change")return t}var $h=!1;if(fa){var cc;if(fa){var uc="oninput"in document;if(!uc){var Dh=document.createElement("div");Dh.setAttribute("oninput","return;"),uc=typeof Dh.oninput=="function"}cc=uc}else cc=!1;$h=cc&&(!document.documentMode||9<document.documentMode)}function Nh(){Lo&&(Lo.detachEvent("onpropertychange",Th),Uo=Lo=null)}function Th(e){if(e.propertyName==="value"&&Ki(Uo)){var t=[];_h(t,Uo,e,ec(e)),ph(Cy,t)}}function Oy(e,t,s){e==="focusin"?(Nh(),Lo=t,Uo=s,Lo.attachEvent("onpropertychange",Th)):e==="focusout"&&Nh()}function By(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return Ki(Uo)}function jy(e,t){if(e==="click")return Ki(t)}function zy(e,t){if(e==="input"||e==="change")return Ki(t)}function Ry(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Mn=typeof Object.is=="function"?Object.is:Ry;function Po(e,t){if(Mn(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var s=Object.keys(e),i=Object.keys(t);if(s.length!==i.length)return!1;for(i=0;i<s.length;i++){var h=s[i];if(!be.call(t,h)||!Mn(e[h],t[h]))return!1}return!0}function Mh(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Ch(e,t){var s=Mh(e);e=0;for(var i;s;){if(s.nodeType===3){if(i=e+s.textContent.length,e<=t&&i>=t)return{node:s,offset:t-e};e=i}e:{for(;s;){if(s.nextSibling){s=s.nextSibling;break e}s=s.parentNode}s=void 0}s=Mh(s)}}function Oh(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Oh(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Bh(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=Gi(e.document);t instanceof e.HTMLIFrameElement;){try{var s=typeof t.contentWindow.location.href=="string"}catch{s=!1}if(s)e=t.contentWindow;else break;t=Gi(e.document)}return t}function dc(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var qy=fa&&"documentMode"in document&&11>=document.documentMode,Gs=null,hc=null,Go=null,pc=!1;function jh(e,t,s){var i=s.window===s?s.document:s.nodeType===9?s:s.ownerDocument;pc||Gs==null||Gs!==Gi(i)||(i=Gs,"selectionStart"in i&&dc(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),Go&&Po(Go,i)||(Go=i,i=Fr(hc,"onSelect"),0<i.length&&(t=new Qi("onSelect","select",null,t,s),e.push({event:t,listeners:i}),t.target=Gs)))}function hs(e,t){var s={};return s[e.toLowerCase()]=t.toLowerCase(),s["Webkit"+e]="webkit"+t,s["Moz"+e]="moz"+t,s}var Ys={animationend:hs("Animation","AnimationEnd"),animationiteration:hs("Animation","AnimationIteration"),animationstart:hs("Animation","AnimationStart"),transitionrun:hs("Transition","TransitionRun"),transitionstart:hs("Transition","TransitionStart"),transitioncancel:hs("Transition","TransitionCancel"),transitionend:hs("Transition","TransitionEnd")},fc={},zh={};fa&&(zh=document.createElement("div").style,"AnimationEvent"in window||(delete Ys.animationend.animation,delete Ys.animationiteration.animation,delete Ys.animationstart.animation),"TransitionEvent"in window||delete Ys.transitionend.transition);function ps(e){if(fc[e])return fc[e];if(!Ys[e])return e;var t=Ys[e],s;for(s in t)if(t.hasOwnProperty(s)&&s in zh)return fc[e]=t[s];return e}var Rh=ps("animationend"),qh=ps("animationiteration"),Fh=ps("animationstart"),Fy=ps("transitionrun"),Hy=ps("transitionstart"),Ly=ps("transitioncancel"),Hh=ps("transitionend"),Lh=new Map,mc="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");mc.push("scrollEnd");function In(e,t){Lh.set(e,t),us(t,[e])}var Wi=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Un=[],Vs=0,gc=0;function Ii(){for(var e=Vs,t=gc=Vs=0;t<e;){var s=Un[t];Un[t++]=null;var i=Un[t];Un[t++]=null;var h=Un[t];Un[t++]=null;var m=Un[t];if(Un[t++]=null,i!==null&&h!==null){var y=i.pending;y===null?h.next=h:(h.next=y.next,y.next=h),i.pending=h}m!==0&&Uh(s,h,m)}}function er(e,t,s,i){Un[Vs++]=e,Un[Vs++]=t,Un[Vs++]=s,Un[Vs++]=i,gc|=i,e.lanes|=i,e=e.alternate,e!==null&&(e.lanes|=i)}function yc(e,t,s,i){return er(e,t,s,i),tr(e)}function fs(e,t){return er(e,null,null,t),tr(e)}function Uh(e,t,s){e.lanes|=s;var i=e.alternate;i!==null&&(i.lanes|=s);for(var h=!1,m=e.return;m!==null;)m.childLanes|=s,i=m.alternate,i!==null&&(i.childLanes|=s),m.tag===22&&(e=m.stateNode,e===null||e._visibility&1||(h=!0)),e=m,m=m.return;return e.tag===3?(m=e.stateNode,h&&t!==null&&(h=31-un(s),e=m.hiddenUpdates,i=e[h],i===null?e[h]=[t]:i.push(t),t.lane=s|536870912),m):null}function tr(e){if(50<hi)throw hi=0,Su=null,Error(u(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var Xs={};function Uy(e,t,s,i){this.tag=e,this.key=s,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Cn(e,t,s,i){return new Uy(e,t,s,i)}function bc(e){return e=e.prototype,!(!e||!e.isReactComponent)}function ma(e,t){var s=e.alternate;return s===null?(s=Cn(e.tag,t,e.key,e.mode),s.elementType=e.elementType,s.type=e.type,s.stateNode=e.stateNode,s.alternate=e,e.alternate=s):(s.pendingProps=t,s.type=e.type,s.flags=0,s.subtreeFlags=0,s.deletions=null),s.flags=e.flags&65011712,s.childLanes=e.childLanes,s.lanes=e.lanes,s.child=e.child,s.memoizedProps=e.memoizedProps,s.memoizedState=e.memoizedState,s.updateQueue=e.updateQueue,t=e.dependencies,s.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},s.sibling=e.sibling,s.index=e.index,s.ref=e.ref,s.refCleanup=e.refCleanup,s}function Ph(e,t){e.flags&=65011714;var s=e.alternate;return s===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=s.childLanes,e.lanes=s.lanes,e.child=s.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=s.memoizedProps,e.memoizedState=s.memoizedState,e.updateQueue=s.updateQueue,e.type=s.type,t=s.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function nr(e,t,s,i,h,m){var y=0;if(i=e,typeof e=="function")bc(e)&&(y=1);else if(typeof e=="string")y=Xb(e,s,de.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(e){case Q:return e=Cn(31,s,t,h),e.elementType=Q,e.lanes=m,e;case E:return ms(s.children,h,m,t);case M:y=8,h|=24;break;case N:return e=Cn(12,s,t,h|2),e.elementType=N,e.lanes=m,e;case K:return e=Cn(13,s,t,h),e.elementType=K,e.lanes=m,e;case q:return e=Cn(19,s,t,h),e.elementType=q,e.lanes=m,e;default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case j:y=10;break e;case $:y=9;break e;case G:y=11;break e;case U:y=14;break e;case z:y=16,i=null;break e}y=29,s=Error(u(130,e===null?"null":typeof e,"")),i=null}return t=Cn(y,s,t,h),t.elementType=e,t.type=i,t.lanes=m,t}function ms(e,t,s,i){return e=Cn(7,e,i,t),e.lanes=s,e}function vc(e,t,s){return e=Cn(6,e,null,t),e.lanes=s,e}function Gh(e){var t=Cn(18,null,null,0);return t.stateNode=e,t}function xc(e,t,s){return t=Cn(4,e.children!==null?e.children:[],e.key,t),t.lanes=s,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Yh=new WeakMap;function Pn(e,t){if(typeof e=="object"&&e!==null){var s=Yh.get(e);return s!==void 0?s:(t={value:e,source:t,stack:Z(t)},Yh.set(e,t),t)}return{value:e,source:t,stack:Z(t)}}var Js=[],Qs=0,ar=null,Yo=0,Gn=[],Yn=0,za=null,aa=1,sa="";function ga(e,t){Js[Qs++]=Yo,Js[Qs++]=ar,ar=e,Yo=t}function Vh(e,t,s){Gn[Yn++]=aa,Gn[Yn++]=sa,Gn[Yn++]=za,za=e;var i=aa;e=sa;var h=32-un(i)-1;i&=~(1<<h),s+=1;var m=32-un(t)+h;if(30<m){var y=h-h%5;m=(i&(1<<y)-1).toString(32),i>>=y,h-=y,aa=1<<32-un(t)+h|s<<h|i,sa=m+e}else aa=1<<m|s<<h|i,sa=e}function wc(e){e.return!==null&&(ga(e,1),Vh(e,1,0))}function kc(e){for(;e===ar;)ar=Js[--Qs],Js[Qs]=null,Yo=Js[--Qs],Js[Qs]=null;for(;e===za;)za=Gn[--Yn],Gn[Yn]=null,sa=Gn[--Yn],Gn[Yn]=null,aa=Gn[--Yn],Gn[Yn]=null}function Xh(e,t){Gn[Yn++]=aa,Gn[Yn++]=sa,Gn[Yn++]=za,aa=t.id,sa=t.overflow,za=e}var dn=null,Bt=null,ht=!1,Ra=null,Vn=!1,Ec=Error(u(519));function qa(e){var t=Error(u(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw Vo(Pn(t,e)),Ec}function Jh(e){var t=e.stateNode,s=e.type,i=e.memoizedProps;switch(t[mt]=e,t[bn]=i,s){case"dialog":ct("cancel",t),ct("close",t);break;case"iframe":case"object":case"embed":ct("load",t);break;case"video":case"audio":for(s=0;s<fi.length;s++)ct(fi[s],t);break;case"source":ct("error",t);break;case"img":case"image":case"link":ct("error",t),ct("load",t);break;case"details":ct("toggle",t);break;case"input":ct("invalid",t),rh(t,i.value,i.defaultValue,i.checked,i.defaultChecked,i.type,i.name,!0);break;case"select":ct("invalid",t);break;case"textarea":ct("invalid",t),ch(t,i.value,i.defaultValue,i.children)}s=i.children,typeof s!="string"&&typeof s!="number"&&typeof s!="bigint"||t.textContent===""+s||i.suppressHydrationWarning===!0||hm(t.textContent,s)?(i.popover!=null&&(ct("beforetoggle",t),ct("toggle",t)),i.onScroll!=null&&ct("scroll",t),i.onScrollEnd!=null&&ct("scrollend",t),i.onClick!=null&&(t.onclick=pa),t=!0):t=!1,t||qa(e,!0)}function Qh(e){for(dn=e.return;dn;)switch(dn.tag){case 5:case 31:case 13:Vn=!1;return;case 27:case 3:Vn=!0;return;default:dn=dn.return}}function Zs(e){if(e!==dn)return!1;if(!ht)return Qh(e),ht=!0,!1;var t=e.tag,s;if((s=t!==3&&t!==27)&&((s=t===5)&&(s=e.type,s=!(s!=="form"&&s!=="button")||Lu(e.type,e.memoizedProps)),s=!s),s&&Bt&&qa(e),Qh(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(u(317));Bt=wm(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(u(317));Bt=wm(e)}else t===27?(t=Bt,Wa(e.type)?(e=Vu,Vu=null,Bt=e):Bt=t):Bt=dn?Jn(e.stateNode.nextSibling):null;return!0}function gs(){Bt=dn=null,ht=!1}function Ac(){var e=Ra;return e!==null&&(Nn===null?Nn=e:Nn.push.apply(Nn,e),Ra=null),e}function Vo(e){Ra===null?Ra=[e]:Ra.push(e)}var _c=D(null),ys=null,ya=null;function Fa(e,t,s){te(_c,t._currentValue),t._currentValue=s}function ba(e){e._currentValue=_c.current,T(_c)}function Sc(e,t,s){for(;e!==null;){var i=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,i!==null&&(i.childLanes|=t)):i!==null&&(i.childLanes&t)!==t&&(i.childLanes|=t),e===s)break;e=e.return}}function $c(e,t,s,i){var h=e.child;for(h!==null&&(h.return=e);h!==null;){var m=h.dependencies;if(m!==null){var y=h.child;m=m.firstContext;e:for(;m!==null;){var A=m;m=h;for(var H=0;H<t.length;H++)if(A.context===t[H]){m.lanes|=s,A=m.alternate,A!==null&&(A.lanes|=s),Sc(m.return,s,e),i||(y=null);break e}m=A.next}}else if(h.tag===18){if(y=h.return,y===null)throw Error(u(341));y.lanes|=s,m=y.alternate,m!==null&&(m.lanes|=s),Sc(y,s,e),y=null}else y=h.child;if(y!==null)y.return=h;else for(y=h;y!==null;){if(y===e){y=null;break}if(h=y.sibling,h!==null){h.return=y.return,y=h;break}y=y.return}h=y}}function Ks(e,t,s,i){e=null;for(var h=t,m=!1;h!==null;){if(!m){if((h.flags&524288)!==0)m=!0;else if((h.flags&262144)!==0)break}if(h.tag===10){var y=h.alternate;if(y===null)throw Error(u(387));if(y=y.memoizedProps,y!==null){var A=h.type;Mn(h.pendingProps.value,y.value)||(e!==null?e.push(A):e=[A])}}else if(h===Ne.current){if(y=h.alternate,y===null)throw Error(u(387));y.memoizedState.memoizedState!==h.memoizedState.memoizedState&&(e!==null?e.push(vi):e=[vi])}h=h.return}e!==null&&$c(t,e,s,i),t.flags|=262144}function sr(e){for(e=e.firstContext;e!==null;){if(!Mn(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function bs(e){ys=e,ya=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function hn(e){return Zh(ys,e)}function or(e,t){return ys===null&&bs(e),Zh(e,t)}function Zh(e,t){var s=t._currentValue;if(t={context:t,memoizedValue:s,next:null},ya===null){if(e===null)throw Error(u(308));ya=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else ya=ya.next=t;return s}var Py=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(s,i){e.push(i)}};this.abort=function(){t.aborted=!0,e.forEach(function(s){return s()})}},Gy=n.unstable_scheduleCallback,Yy=n.unstable_NormalPriority,Kt={$$typeof:j,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Dc(){return{controller:new Py,data:new Map,refCount:0}}function Xo(e){e.refCount--,e.refCount===0&&Gy(Yy,function(){e.controller.abort()})}var Jo=null,Nc=0,Ws=0,Is=null;function Vy(e,t){if(Jo===null){var s=Jo=[];Nc=0,Ws=Cu(),Is={status:"pending",value:void 0,then:function(i){s.push(i)}}}return Nc++,t.then(Kh,Kh),t}function Kh(){if(--Nc===0&&Jo!==null){Is!==null&&(Is.status="fulfilled");var e=Jo;Jo=null,Ws=0,Is=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function Xy(e,t){var s=[],i={status:"pending",value:null,reason:null,then:function(h){s.push(h)}};return e.then(function(){i.status="fulfilled",i.value=t;for(var h=0;h<s.length;h++)(0,s[h])(t)},function(h){for(i.status="rejected",i.reason=h,h=0;h<s.length;h++)(0,s[h])(void 0)}),i}var Wh=C.S;C.S=function(e,t){zf=qe(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&Vy(e,t),Wh!==null&&Wh(e,t)};var vs=D(null);function Tc(){var e=vs.current;return e!==null?e:Mt.pooledCache}function ir(e,t){t===null?te(vs,vs.current):te(vs,t.pool)}function Ih(){var e=Tc();return e===null?null:{parent:Kt._currentValue,pool:e}}var eo=Error(u(460)),Mc=Error(u(474)),rr=Error(u(542)),lr={then:function(){}};function ep(e){return e=e.status,e==="fulfilled"||e==="rejected"}function tp(e,t,s){switch(s=e[s],s===void 0?e.push(t):s!==t&&(t.then(pa,pa),t=s),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,ap(e),e;default:if(typeof t.status=="string")t.then(pa,pa);else{if(e=Mt,e!==null&&100<e.shellSuspendCounter)throw Error(u(482));e=t,e.status="pending",e.then(function(i){if(t.status==="pending"){var h=t;h.status="fulfilled",h.value=i}},function(i){if(t.status==="pending"){var h=t;h.status="rejected",h.reason=i}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,ap(e),e}throw ws=t,eo}}function xs(e){try{var t=e._init;return t(e._payload)}catch(s){throw s!==null&&typeof s=="object"&&typeof s.then=="function"?(ws=s,eo):s}}var ws=null;function np(){if(ws===null)throw Error(u(459));var e=ws;return ws=null,e}function ap(e){if(e===eo||e===rr)throw Error(u(483))}var to=null,Qo=0;function cr(e){var t=Qo;return Qo+=1,to===null&&(to=[]),tp(to,e,t)}function Zo(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function ur(e,t){throw t.$$typeof===w?Error(u(525)):(e=Object.prototype.toString.call(t),Error(u(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function sp(e){function t(ee,J){if(e){var ae=ee.deletions;ae===null?(ee.deletions=[J],ee.flags|=16):ae.push(J)}}function s(ee,J){if(!e)return null;for(;J!==null;)t(ee,J),J=J.sibling;return null}function i(ee){for(var J=new Map;ee!==null;)ee.key!==null?J.set(ee.key,ee):J.set(ee.index,ee),ee=ee.sibling;return J}function h(ee,J){return ee=ma(ee,J),ee.index=0,ee.sibling=null,ee}function m(ee,J,ae){return ee.index=ae,e?(ae=ee.alternate,ae!==null?(ae=ae.index,ae<J?(ee.flags|=67108866,J):ae):(ee.flags|=67108866,J)):(ee.flags|=1048576,J)}function y(ee){return e&&ee.alternate===null&&(ee.flags|=67108866),ee}function A(ee,J,ae,xe){return J===null||J.tag!==6?(J=vc(ae,ee.mode,xe),J.return=ee,J):(J=h(J,ae),J.return=ee,J)}function H(ee,J,ae,xe){var Xe=ae.type;return Xe===E?me(ee,J,ae.props.children,xe,ae.key):J!==null&&(J.elementType===Xe||typeof Xe=="object"&&Xe!==null&&Xe.$$typeof===z&&xs(Xe)===J.type)?(J=h(J,ae.props),Zo(J,ae),J.return=ee,J):(J=nr(ae.type,ae.key,ae.props,null,ee.mode,xe),Zo(J,ae),J.return=ee,J)}function se(ee,J,ae,xe){return J===null||J.tag!==4||J.stateNode.containerInfo!==ae.containerInfo||J.stateNode.implementation!==ae.implementation?(J=xc(ae,ee.mode,xe),J.return=ee,J):(J=h(J,ae.children||[]),J.return=ee,J)}function me(ee,J,ae,xe,Xe){return J===null||J.tag!==7?(J=ms(ae,ee.mode,xe,Xe),J.return=ee,J):(J=h(J,ae),J.return=ee,J)}function ke(ee,J,ae){if(typeof J=="string"&&J!==""||typeof J=="number"||typeof J=="bigint")return J=vc(""+J,ee.mode,ae),J.return=ee,J;if(typeof J=="object"&&J!==null){switch(J.$$typeof){case x:return ae=nr(J.type,J.key,J.props,null,ee.mode,ae),Zo(ae,J),ae.return=ee,ae;case _:return J=xc(J,ee.mode,ae),J.return=ee,J;case z:return J=xs(J),ke(ee,J,ae)}if($e(J)||he(J))return J=ms(J,ee.mode,ae,null),J.return=ee,J;if(typeof J.then=="function")return ke(ee,cr(J),ae);if(J.$$typeof===j)return ke(ee,or(ee,J),ae);ur(ee,J)}return null}function ie(ee,J,ae,xe){var Xe=J!==null?J.key:null;if(typeof ae=="string"&&ae!==""||typeof ae=="number"||typeof ae=="bigint")return Xe!==null?null:A(ee,J,""+ae,xe);if(typeof ae=="object"&&ae!==null){switch(ae.$$typeof){case x:return ae.key===Xe?H(ee,J,ae,xe):null;case _:return ae.key===Xe?se(ee,J,ae,xe):null;case z:return ae=xs(ae),ie(ee,J,ae,xe)}if($e(ae)||he(ae))return Xe!==null?null:me(ee,J,ae,xe,null);if(typeof ae.then=="function")return ie(ee,J,cr(ae),xe);if(ae.$$typeof===j)return ie(ee,J,or(ee,ae),xe);ur(ee,ae)}return null}function le(ee,J,ae,xe,Xe){if(typeof xe=="string"&&xe!==""||typeof xe=="number"||typeof xe=="bigint")return ee=ee.get(ae)||null,A(J,ee,""+xe,Xe);if(typeof xe=="object"&&xe!==null){switch(xe.$$typeof){case x:return ee=ee.get(xe.key===null?ae:xe.key)||null,H(J,ee,xe,Xe);case _:return ee=ee.get(xe.key===null?ae:xe.key)||null,se(J,ee,xe,Xe);case z:return xe=xs(xe),le(ee,J,ae,xe,Xe)}if($e(xe)||he(xe))return ee=ee.get(ae)||null,me(J,ee,xe,Xe,null);if(typeof xe.then=="function")return le(ee,J,ae,cr(xe),Xe);if(xe.$$typeof===j)return le(ee,J,ae,or(J,xe),Xe);ur(J,xe)}return null}function Le(ee,J,ae,xe){for(var Xe=null,gt=null,Ue=J,at=J=0,dt=null;Ue!==null&&at<ae.length;at++){Ue.index>at?(dt=Ue,Ue=null):dt=Ue.sibling;var yt=ie(ee,Ue,ae[at],xe);if(yt===null){Ue===null&&(Ue=dt);break}e&&Ue&&yt.alternate===null&&t(ee,Ue),J=m(yt,J,at),gt===null?Xe=yt:gt.sibling=yt,gt=yt,Ue=dt}if(at===ae.length)return s(ee,Ue),ht&&ga(ee,at),Xe;if(Ue===null){for(;at<ae.length;at++)Ue=ke(ee,ae[at],xe),Ue!==null&&(J=m(Ue,J,at),gt===null?Xe=Ue:gt.sibling=Ue,gt=Ue);return ht&&ga(ee,at),Xe}for(Ue=i(Ue);at<ae.length;at++)dt=le(Ue,ee,at,ae[at],xe),dt!==null&&(e&&dt.alternate!==null&&Ue.delete(dt.key===null?at:dt.key),J=m(dt,J,at),gt===null?Xe=dt:gt.sibling=dt,gt=dt);return e&&Ue.forEach(function(as){return t(ee,as)}),ht&&ga(ee,at),Xe}function Qe(ee,J,ae,xe){if(ae==null)throw Error(u(151));for(var Xe=null,gt=null,Ue=J,at=J=0,dt=null,yt=ae.next();Ue!==null&&!yt.done;at++,yt=ae.next()){Ue.index>at?(dt=Ue,Ue=null):dt=Ue.sibling;var as=ie(ee,Ue,yt.value,xe);if(as===null){Ue===null&&(Ue=dt);break}e&&Ue&&as.alternate===null&&t(ee,Ue),J=m(as,J,at),gt===null?Xe=as:gt.sibling=as,gt=as,Ue=dt}if(yt.done)return s(ee,Ue),ht&&ga(ee,at),Xe;if(Ue===null){for(;!yt.done;at++,yt=ae.next())yt=ke(ee,yt.value,xe),yt!==null&&(J=m(yt,J,at),gt===null?Xe=yt:gt.sibling=yt,gt=yt);return ht&&ga(ee,at),Xe}for(Ue=i(Ue);!yt.done;at++,yt=ae.next())yt=le(Ue,ee,at,yt.value,xe),yt!==null&&(e&&yt.alternate!==null&&Ue.delete(yt.key===null?at:yt.key),J=m(yt,J,at),gt===null?Xe=yt:gt.sibling=yt,gt=yt);return e&&Ue.forEach(function(sv){return t(ee,sv)}),ht&&ga(ee,at),Xe}function Dt(ee,J,ae,xe){if(typeof ae=="object"&&ae!==null&&ae.type===E&&ae.key===null&&(ae=ae.props.children),typeof ae=="object"&&ae!==null){switch(ae.$$typeof){case x:e:{for(var Xe=ae.key;J!==null;){if(J.key===Xe){if(Xe=ae.type,Xe===E){if(J.tag===7){s(ee,J.sibling),xe=h(J,ae.props.children),xe.return=ee,ee=xe;break e}}else if(J.elementType===Xe||typeof Xe=="object"&&Xe!==null&&Xe.$$typeof===z&&xs(Xe)===J.type){s(ee,J.sibling),xe=h(J,ae.props),Zo(xe,ae),xe.return=ee,ee=xe;break e}s(ee,J);break}else t(ee,J);J=J.sibling}ae.type===E?(xe=ms(ae.props.children,ee.mode,xe,ae.key),xe.return=ee,ee=xe):(xe=nr(ae.type,ae.key,ae.props,null,ee.mode,xe),Zo(xe,ae),xe.return=ee,ee=xe)}return y(ee);case _:e:{for(Xe=ae.key;J!==null;){if(J.key===Xe)if(J.tag===4&&J.stateNode.containerInfo===ae.containerInfo&&J.stateNode.implementation===ae.implementation){s(ee,J.sibling),xe=h(J,ae.children||[]),xe.return=ee,ee=xe;break e}else{s(ee,J);break}else t(ee,J);J=J.sibling}xe=xc(ae,ee.mode,xe),xe.return=ee,ee=xe}return y(ee);case z:return ae=xs(ae),Dt(ee,J,ae,xe)}if($e(ae))return Le(ee,J,ae,xe);if(he(ae)){if(Xe=he(ae),typeof Xe!="function")throw Error(u(150));return ae=Xe.call(ae),Qe(ee,J,ae,xe)}if(typeof ae.then=="function")return Dt(ee,J,cr(ae),xe);if(ae.$$typeof===j)return Dt(ee,J,or(ee,ae),xe);ur(ee,ae)}return typeof ae=="string"&&ae!==""||typeof ae=="number"||typeof ae=="bigint"?(ae=""+ae,J!==null&&J.tag===6?(s(ee,J.sibling),xe=h(J,ae),xe.return=ee,ee=xe):(s(ee,J),xe=vc(ae,ee.mode,xe),xe.return=ee,ee=xe),y(ee)):s(ee,J)}return function(ee,J,ae,xe){try{Qo=0;var Xe=Dt(ee,J,ae,xe);return to=null,Xe}catch(Ue){if(Ue===eo||Ue===rr)throw Ue;var gt=Cn(29,Ue,null,ee.mode);return gt.lanes=xe,gt.return=ee,gt}}}var ks=sp(!0),op=sp(!1),Ha=!1;function Cc(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Oc(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function La(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Ua(e,t,s){var i=e.updateQueue;if(i===null)return null;if(i=i.shared,(vt&2)!==0){var h=i.pending;return h===null?t.next=t:(t.next=h.next,h.next=t),i.pending=t,t=tr(e),Uh(e,null,s),t}return er(e,i,t,s),tr(e)}function Ko(e,t,s){if(t=t.updateQueue,t!==null&&(t=t.shared,(s&4194048)!==0)){var i=t.lanes;i&=e.pendingLanes,s|=i,t.lanes=s,Oe(e,s)}}function Bc(e,t){var s=e.updateQueue,i=e.alternate;if(i!==null&&(i=i.updateQueue,s===i)){var h=null,m=null;if(s=s.firstBaseUpdate,s!==null){do{var y={lane:s.lane,tag:s.tag,payload:s.payload,callback:null,next:null};m===null?h=m=y:m=m.next=y,s=s.next}while(s!==null);m===null?h=m=t:m=m.next=t}else h=m=t;s={baseState:i.baseState,firstBaseUpdate:h,lastBaseUpdate:m,shared:i.shared,callbacks:i.callbacks},e.updateQueue=s;return}e=s.lastBaseUpdate,e===null?s.firstBaseUpdate=t:e.next=t,s.lastBaseUpdate=t}var jc=!1;function Wo(){if(jc){var e=Is;if(e!==null)throw e}}function Io(e,t,s,i){jc=!1;var h=e.updateQueue;Ha=!1;var m=h.firstBaseUpdate,y=h.lastBaseUpdate,A=h.shared.pending;if(A!==null){h.shared.pending=null;var H=A,se=H.next;H.next=null,y===null?m=se:y.next=se,y=H;var me=e.alternate;me!==null&&(me=me.updateQueue,A=me.lastBaseUpdate,A!==y&&(A===null?me.firstBaseUpdate=se:A.next=se,me.lastBaseUpdate=H))}if(m!==null){var ke=h.baseState;y=0,me=se=H=null,A=m;do{var ie=A.lane&-536870913,le=ie!==A.lane;if(le?(ut&ie)===ie:(i&ie)===ie){ie!==0&&ie===Ws&&(jc=!0),me!==null&&(me=me.next={lane:0,tag:A.tag,payload:A.payload,callback:null,next:null});e:{var Le=e,Qe=A;ie=t;var Dt=s;switch(Qe.tag){case 1:if(Le=Qe.payload,typeof Le=="function"){ke=Le.call(Dt,ke,ie);break e}ke=Le;break e;case 3:Le.flags=Le.flags&-65537|128;case 0:if(Le=Qe.payload,ie=typeof Le=="function"?Le.call(Dt,ke,ie):Le,ie==null)break e;ke=b({},ke,ie);break e;case 2:Ha=!0}}ie=A.callback,ie!==null&&(e.flags|=64,le&&(e.flags|=8192),le=h.callbacks,le===null?h.callbacks=[ie]:le.push(ie))}else le={lane:ie,tag:A.tag,payload:A.payload,callback:A.callback,next:null},me===null?(se=me=le,H=ke):me=me.next=le,y|=ie;if(A=A.next,A===null){if(A=h.shared.pending,A===null)break;le=A,A=le.next,le.next=null,h.lastBaseUpdate=le,h.shared.pending=null}}while(!0);me===null&&(H=ke),h.baseState=H,h.firstBaseUpdate=se,h.lastBaseUpdate=me,m===null&&(h.shared.lanes=0),Xa|=y,e.lanes=y,e.memoizedState=ke}}function ip(e,t){if(typeof e!="function")throw Error(u(191,e));e.call(t)}function rp(e,t){var s=e.callbacks;if(s!==null)for(e.callbacks=null,e=0;e<s.length;e++)ip(s[e],t)}var no=D(null),dr=D(0);function lp(e,t){e=$a,te(dr,e),te(no,t),$a=e|t.baseLanes}function zc(){te(dr,$a),te(no,no.current)}function Rc(){$a=dr.current,T(no),T(dr)}var On=D(null),Xn=null;function Pa(e){var t=e.alternate;te(Jt,Jt.current&1),te(On,e),Xn===null&&(t===null||no.current!==null||t.memoizedState!==null)&&(Xn=e)}function qc(e){te(Jt,Jt.current),te(On,e),Xn===null&&(Xn=e)}function cp(e){e.tag===22?(te(Jt,Jt.current),te(On,e),Xn===null&&(Xn=e)):Ga()}function Ga(){te(Jt,Jt.current),te(On,On.current)}function Bn(e){T(On),Xn===e&&(Xn=null),T(Jt)}var Jt=D(0);function hr(e){for(var t=e;t!==null;){if(t.tag===13){var s=t.memoizedState;if(s!==null&&(s=s.dehydrated,s===null||Gu(s)||Yu(s)))return t}else if(t.tag===19&&(t.memoizedProps.revealOrder==="forwards"||t.memoizedProps.revealOrder==="backwards"||t.memoizedProps.revealOrder==="unstable_legacy-backwards"||t.memoizedProps.revealOrder==="together")){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var va=0,tt=null,St=null,Wt=null,pr=!1,ao=!1,Es=!1,fr=0,ei=0,so=null,Jy=0;function Pt(){throw Error(u(321))}function Fc(e,t){if(t===null)return!1;for(var s=0;s<t.length&&s<e.length;s++)if(!Mn(e[s],t[s]))return!1;return!0}function Hc(e,t,s,i,h,m){return va=m,tt=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,C.H=e===null||e.memoizedState===null?Vp:tu,Es=!1,m=s(i,h),Es=!1,ao&&(m=dp(t,s,i,h)),up(e),m}function up(e){C.H=ai;var t=St!==null&&St.next!==null;if(va=0,Wt=St=tt=null,pr=!1,ei=0,so=null,t)throw Error(u(300));e===null||It||(e=e.dependencies,e!==null&&sr(e)&&(It=!0))}function dp(e,t,s,i){tt=e;var h=0;do{if(ao&&(so=null),ei=0,ao=!1,25<=h)throw Error(u(301));if(h+=1,Wt=St=null,e.updateQueue!=null){var m=e.updateQueue;m.lastEffect=null,m.events=null,m.stores=null,m.memoCache!=null&&(m.memoCache.index=0)}C.H=Xp,m=t(s,i)}while(ao);return m}function Qy(){var e=C.H,t=e.useState()[0];return t=typeof t.then=="function"?ti(t):t,e=e.useState()[0],(St!==null?St.memoizedState:null)!==e&&(tt.flags|=1024),t}function Lc(){var e=fr!==0;return fr=0,e}function Uc(e,t,s){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~s}function Pc(e){if(pr){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}pr=!1}va=0,Wt=St=tt=null,ao=!1,ei=fr=0,so=null}function kn(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Wt===null?tt.memoizedState=Wt=e:Wt=Wt.next=e,Wt}function Qt(){if(St===null){var e=tt.alternate;e=e!==null?e.memoizedState:null}else e=St.next;var t=Wt===null?tt.memoizedState:Wt.next;if(t!==null)Wt=t,St=e;else{if(e===null)throw tt.alternate===null?Error(u(467)):Error(u(310));St=e,e={memoizedState:St.memoizedState,baseState:St.baseState,baseQueue:St.baseQueue,queue:St.queue,next:null},Wt===null?tt.memoizedState=Wt=e:Wt=Wt.next=e}return Wt}function mr(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function ti(e){var t=ei;return ei+=1,so===null&&(so=[]),e=tp(so,e,t),t=tt,(Wt===null?t.memoizedState:Wt.next)===null&&(t=t.alternate,C.H=t===null||t.memoizedState===null?Vp:tu),e}function gr(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return ti(e);if(e.$$typeof===j)return hn(e)}throw Error(u(438,String(e)))}function Gc(e){var t=null,s=tt.updateQueue;if(s!==null&&(t=s.memoCache),t==null){var i=tt.alternate;i!==null&&(i=i.updateQueue,i!==null&&(i=i.memoCache,i!=null&&(t={data:i.data.map(function(h){return h.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),s===null&&(s=mr(),tt.updateQueue=s),s.memoCache=t,s=t.data[t.index],s===void 0)for(s=t.data[t.index]=Array(e),i=0;i<e;i++)s[i]=re;return t.index++,s}function xa(e,t){return typeof t=="function"?t(e):t}function yr(e){var t=Qt();return Yc(t,St,e)}function Yc(e,t,s){var i=e.queue;if(i===null)throw Error(u(311));i.lastRenderedReducer=s;var h=e.baseQueue,m=i.pending;if(m!==null){if(h!==null){var y=h.next;h.next=m.next,m.next=y}t.baseQueue=h=m,i.pending=null}if(m=e.baseState,h===null)e.memoizedState=m;else{t=h.next;var A=y=null,H=null,se=t,me=!1;do{var ke=se.lane&-536870913;if(ke!==se.lane?(ut&ke)===ke:(va&ke)===ke){var ie=se.revertLane;if(ie===0)H!==null&&(H=H.next={lane:0,revertLane:0,gesture:null,action:se.action,hasEagerState:se.hasEagerState,eagerState:se.eagerState,next:null}),ke===Ws&&(me=!0);else if((va&ie)===ie){se=se.next,ie===Ws&&(me=!0);continue}else ke={lane:0,revertLane:se.revertLane,gesture:null,action:se.action,hasEagerState:se.hasEagerState,eagerState:se.eagerState,next:null},H===null?(A=H=ke,y=m):H=H.next=ke,tt.lanes|=ie,Xa|=ie;ke=se.action,Es&&s(m,ke),m=se.hasEagerState?se.eagerState:s(m,ke)}else ie={lane:ke,revertLane:se.revertLane,gesture:se.gesture,action:se.action,hasEagerState:se.hasEagerState,eagerState:se.eagerState,next:null},H===null?(A=H=ie,y=m):H=H.next=ie,tt.lanes|=ke,Xa|=ke;se=se.next}while(se!==null&&se!==t);if(H===null?y=m:H.next=A,!Mn(m,e.memoizedState)&&(It=!0,me&&(s=Is,s!==null)))throw s;e.memoizedState=m,e.baseState=y,e.baseQueue=H,i.lastRenderedState=m}return h===null&&(i.lanes=0),[e.memoizedState,i.dispatch]}function Vc(e){var t=Qt(),s=t.queue;if(s===null)throw Error(u(311));s.lastRenderedReducer=e;var i=s.dispatch,h=s.pending,m=t.memoizedState;if(h!==null){s.pending=null;var y=h=h.next;do m=e(m,y.action),y=y.next;while(y!==h);Mn(m,t.memoizedState)||(It=!0),t.memoizedState=m,t.baseQueue===null&&(t.baseState=m),s.lastRenderedState=m}return[m,i]}function hp(e,t,s){var i=tt,h=Qt(),m=ht;if(m){if(s===void 0)throw Error(u(407));s=s()}else s=t();var y=!Mn((St||h).memoizedState,s);if(y&&(h.memoizedState=s,It=!0),h=h.queue,Qc(mp.bind(null,i,h,e),[e]),h.getSnapshot!==t||y||Wt!==null&&Wt.memoizedState.tag&1){if(i.flags|=2048,oo(9,{destroy:void 0},fp.bind(null,i,h,s,t),null),Mt===null)throw Error(u(349));m||(va&127)!==0||pp(i,t,s)}return s}function pp(e,t,s){e.flags|=16384,e={getSnapshot:t,value:s},t=tt.updateQueue,t===null?(t=mr(),tt.updateQueue=t,t.stores=[e]):(s=t.stores,s===null?t.stores=[e]:s.push(e))}function fp(e,t,s,i){t.value=s,t.getSnapshot=i,gp(t)&&yp(e)}function mp(e,t,s){return s(function(){gp(t)&&yp(e)})}function gp(e){var t=e.getSnapshot;e=e.value;try{var s=t();return!Mn(e,s)}catch{return!0}}function yp(e){var t=fs(e,2);t!==null&&Tn(t,e,2)}function Xc(e){var t=kn();if(typeof e=="function"){var s=e;if(e=s(),Es){yn(!0);try{s()}finally{yn(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:xa,lastRenderedState:e},t}function bp(e,t,s,i){return e.baseState=s,Yc(e,St,typeof i=="function"?i:xa)}function Zy(e,t,s,i,h){if(xr(e))throw Error(u(485));if(e=t.action,e!==null){var m={payload:h,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(y){m.listeners.push(y)}};C.T!==null?s(!0):m.isTransition=!1,i(m),s=t.pending,s===null?(m.next=t.pending=m,vp(t,m)):(m.next=s.next,t.pending=s.next=m)}}function vp(e,t){var s=t.action,i=t.payload,h=e.state;if(t.isTransition){var m=C.T,y={};C.T=y;try{var A=s(h,i),H=C.S;H!==null&&H(y,A),xp(e,t,A)}catch(se){Jc(e,t,se)}finally{m!==null&&y.types!==null&&(m.types=y.types),C.T=m}}else try{m=s(h,i),xp(e,t,m)}catch(se){Jc(e,t,se)}}function xp(e,t,s){s!==null&&typeof s=="object"&&typeof s.then=="function"?s.then(function(i){wp(e,t,i)},function(i){return Jc(e,t,i)}):wp(e,t,s)}function wp(e,t,s){t.status="fulfilled",t.value=s,kp(t),e.state=s,t=e.pending,t!==null&&(s=t.next,s===t?e.pending=null:(s=s.next,t.next=s,vp(e,s)))}function Jc(e,t,s){var i=e.pending;if(e.pending=null,i!==null){i=i.next;do t.status="rejected",t.reason=s,kp(t),t=t.next;while(t!==i)}e.action=null}function kp(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function Ep(e,t){return t}function Ap(e,t){if(ht){var s=Mt.formState;if(s!==null){e:{var i=tt;if(ht){if(Bt){t:{for(var h=Bt,m=Vn;h.nodeType!==8;){if(!m){h=null;break t}if(h=Jn(h.nextSibling),h===null){h=null;break t}}m=h.data,h=m==="F!"||m==="F"?h:null}if(h){Bt=Jn(h.nextSibling),i=h.data==="F!";break e}}qa(i)}i=!1}i&&(t=s[0])}}return s=kn(),s.memoizedState=s.baseState=t,i={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Ep,lastRenderedState:t},s.queue=i,s=Pp.bind(null,tt,i),i.dispatch=s,i=Xc(!1),m=eu.bind(null,tt,!1,i.queue),i=kn(),h={state:t,dispatch:null,action:e,pending:null},i.queue=h,s=Zy.bind(null,tt,h,m,s),h.dispatch=s,i.memoizedState=e,[t,s,!1]}function _p(e){var t=Qt();return Sp(t,St,e)}function Sp(e,t,s){if(t=Yc(e,t,Ep)[0],e=yr(xa)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var i=ti(t)}catch(y){throw y===eo?rr:y}else i=t;t=Qt();var h=t.queue,m=h.dispatch;return s!==t.memoizedState&&(tt.flags|=2048,oo(9,{destroy:void 0},Ky.bind(null,h,s),null)),[i,m,e]}function Ky(e,t){e.action=t}function $p(e){var t=Qt(),s=St;if(s!==null)return Sp(t,s,e);Qt(),t=t.memoizedState,s=Qt();var i=s.queue.dispatch;return s.memoizedState=e,[t,i,!1]}function oo(e,t,s,i){return e={tag:e,create:s,deps:i,inst:t,next:null},t=tt.updateQueue,t===null&&(t=mr(),tt.updateQueue=t),s=t.lastEffect,s===null?t.lastEffect=e.next=e:(i=s.next,s.next=e,e.next=i,t.lastEffect=e),e}function Dp(){return Qt().memoizedState}function br(e,t,s,i){var h=kn();tt.flags|=e,h.memoizedState=oo(1|t,{destroy:void 0},s,i===void 0?null:i)}function vr(e,t,s,i){var h=Qt();i=i===void 0?null:i;var m=h.memoizedState.inst;St!==null&&i!==null&&Fc(i,St.memoizedState.deps)?h.memoizedState=oo(t,m,s,i):(tt.flags|=e,h.memoizedState=oo(1|t,m,s,i))}function Np(e,t){br(8390656,8,e,t)}function Qc(e,t){vr(2048,8,e,t)}function Wy(e){tt.flags|=4;var t=tt.updateQueue;if(t===null)t=mr(),tt.updateQueue=t,t.events=[e];else{var s=t.events;s===null?t.events=[e]:s.push(e)}}function Tp(e){var t=Qt().memoizedState;return Wy({ref:t,nextImpl:e}),function(){if((vt&2)!==0)throw Error(u(440));return t.impl.apply(void 0,arguments)}}function Mp(e,t){return vr(4,2,e,t)}function Cp(e,t){return vr(4,4,e,t)}function Op(e,t){if(typeof t=="function"){e=e();var s=t(e);return function(){typeof s=="function"?s():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Bp(e,t,s){s=s!=null?s.concat([e]):null,vr(4,4,Op.bind(null,t,e),s)}function Zc(){}function jp(e,t){var s=Qt();t=t===void 0?null:t;var i=s.memoizedState;return t!==null&&Fc(t,i[1])?i[0]:(s.memoizedState=[e,t],e)}function zp(e,t){var s=Qt();t=t===void 0?null:t;var i=s.memoizedState;if(t!==null&&Fc(t,i[1]))return i[0];if(i=e(),Es){yn(!0);try{e()}finally{yn(!1)}}return s.memoizedState=[i,t],i}function Kc(e,t,s){return s===void 0||(va&1073741824)!==0&&(ut&261930)===0?e.memoizedState=t:(e.memoizedState=s,e=qf(),tt.lanes|=e,Xa|=e,s)}function Rp(e,t,s,i){return Mn(s,t)?s:no.current!==null?(e=Kc(e,s,i),Mn(e,t)||(It=!0),e):(va&42)===0||(va&1073741824)!==0&&(ut&261930)===0?(It=!0,e.memoizedState=s):(e=qf(),tt.lanes|=e,Xa|=e,t)}function qp(e,t,s,i,h){var m=S.p;S.p=m!==0&&8>m?m:8;var y=C.T,A={};C.T=A,eu(e,!1,t,s);try{var H=h(),se=C.S;if(se!==null&&se(A,H),H!==null&&typeof H=="object"&&typeof H.then=="function"){var me=Xy(H,i);ni(e,t,me,Rn(e))}else ni(e,t,i,Rn(e))}catch(ke){ni(e,t,{then:function(){},status:"rejected",reason:ke},Rn())}finally{S.p=m,y!==null&&A.types!==null&&(y.types=A.types),C.T=y}}function Iy(){}function Wc(e,t,s,i){if(e.tag!==5)throw Error(u(476));var h=Fp(e).queue;qp(e,h,t,F,s===null?Iy:function(){return Hp(e),s(i)})}function Fp(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:F,baseState:F,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:xa,lastRenderedState:F},next:null};var s={};return t.next={memoizedState:s,baseState:s,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:xa,lastRenderedState:s},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function Hp(e){var t=Fp(e);t.next===null&&(t=e.alternate.memoizedState),ni(e,t.next.queue,{},Rn())}function Ic(){return hn(vi)}function Lp(){return Qt().memoizedState}function Up(){return Qt().memoizedState}function eb(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var s=Rn();e=La(s);var i=Ua(t,e,s);i!==null&&(Tn(i,t,s),Ko(i,t,s)),t={cache:Dc()},e.payload=t;return}t=t.return}}function tb(e,t,s){var i=Rn();s={lane:i,revertLane:0,gesture:null,action:s,hasEagerState:!1,eagerState:null,next:null},xr(e)?Gp(t,s):(s=yc(e,t,s,i),s!==null&&(Tn(s,e,i),Yp(s,t,i)))}function Pp(e,t,s){var i=Rn();ni(e,t,s,i)}function ni(e,t,s,i){var h={lane:i,revertLane:0,gesture:null,action:s,hasEagerState:!1,eagerState:null,next:null};if(xr(e))Gp(t,h);else{var m=e.alternate;if(e.lanes===0&&(m===null||m.lanes===0)&&(m=t.lastRenderedReducer,m!==null))try{var y=t.lastRenderedState,A=m(y,s);if(h.hasEagerState=!0,h.eagerState=A,Mn(A,y))return er(e,t,h,0),Mt===null&&Ii(),!1}catch{}if(s=yc(e,t,h,i),s!==null)return Tn(s,e,i),Yp(s,t,i),!0}return!1}function eu(e,t,s,i){if(i={lane:2,revertLane:Cu(),gesture:null,action:i,hasEagerState:!1,eagerState:null,next:null},xr(e)){if(t)throw Error(u(479))}else t=yc(e,s,i,2),t!==null&&Tn(t,e,2)}function xr(e){var t=e.alternate;return e===tt||t!==null&&t===tt}function Gp(e,t){ao=pr=!0;var s=e.pending;s===null?t.next=t:(t.next=s.next,s.next=t),e.pending=t}function Yp(e,t,s){if((s&4194048)!==0){var i=t.lanes;i&=e.pendingLanes,s|=i,t.lanes=s,Oe(e,s)}}var ai={readContext:hn,use:gr,useCallback:Pt,useContext:Pt,useEffect:Pt,useImperativeHandle:Pt,useLayoutEffect:Pt,useInsertionEffect:Pt,useMemo:Pt,useReducer:Pt,useRef:Pt,useState:Pt,useDebugValue:Pt,useDeferredValue:Pt,useTransition:Pt,useSyncExternalStore:Pt,useId:Pt,useHostTransitionStatus:Pt,useFormState:Pt,useActionState:Pt,useOptimistic:Pt,useMemoCache:Pt,useCacheRefresh:Pt};ai.useEffectEvent=Pt;var Vp={readContext:hn,use:gr,useCallback:function(e,t){return kn().memoizedState=[e,t===void 0?null:t],e},useContext:hn,useEffect:Np,useImperativeHandle:function(e,t,s){s=s!=null?s.concat([e]):null,br(4194308,4,Op.bind(null,t,e),s)},useLayoutEffect:function(e,t){return br(4194308,4,e,t)},useInsertionEffect:function(e,t){br(4,2,e,t)},useMemo:function(e,t){var s=kn();t=t===void 0?null:t;var i=e();if(Es){yn(!0);try{e()}finally{yn(!1)}}return s.memoizedState=[i,t],i},useReducer:function(e,t,s){var i=kn();if(s!==void 0){var h=s(t);if(Es){yn(!0);try{s(t)}finally{yn(!1)}}}else h=t;return i.memoizedState=i.baseState=h,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:h},i.queue=e,e=e.dispatch=tb.bind(null,tt,e),[i.memoizedState,e]},useRef:function(e){var t=kn();return e={current:e},t.memoizedState=e},useState:function(e){e=Xc(e);var t=e.queue,s=Pp.bind(null,tt,t);return t.dispatch=s,[e.memoizedState,s]},useDebugValue:Zc,useDeferredValue:function(e,t){var s=kn();return Kc(s,e,t)},useTransition:function(){var e=Xc(!1);return e=qp.bind(null,tt,e.queue,!0,!1),kn().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,s){var i=tt,h=kn();if(ht){if(s===void 0)throw Error(u(407));s=s()}else{if(s=t(),Mt===null)throw Error(u(349));(ut&127)!==0||pp(i,t,s)}h.memoizedState=s;var m={value:s,getSnapshot:t};return h.queue=m,Np(mp.bind(null,i,m,e),[e]),i.flags|=2048,oo(9,{destroy:void 0},fp.bind(null,i,m,s,t),null),s},useId:function(){var e=kn(),t=Mt.identifierPrefix;if(ht){var s=sa,i=aa;s=(i&~(1<<32-un(i)-1)).toString(32)+s,t="_"+t+"R_"+s,s=fr++,0<s&&(t+="H"+s.toString(32)),t+="_"}else s=Jy++,t="_"+t+"r_"+s.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:Ic,useFormState:Ap,useActionState:Ap,useOptimistic:function(e){var t=kn();t.memoizedState=t.baseState=e;var s={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=s,t=eu.bind(null,tt,!0,s),s.dispatch=t,[e,t]},useMemoCache:Gc,useCacheRefresh:function(){return kn().memoizedState=eb.bind(null,tt)},useEffectEvent:function(e){var t=kn(),s={impl:e};return t.memoizedState=s,function(){if((vt&2)!==0)throw Error(u(440));return s.impl.apply(void 0,arguments)}}},tu={readContext:hn,use:gr,useCallback:jp,useContext:hn,useEffect:Qc,useImperativeHandle:Bp,useInsertionEffect:Mp,useLayoutEffect:Cp,useMemo:zp,useReducer:yr,useRef:Dp,useState:function(){return yr(xa)},useDebugValue:Zc,useDeferredValue:function(e,t){var s=Qt();return Rp(s,St.memoizedState,e,t)},useTransition:function(){var e=yr(xa)[0],t=Qt().memoizedState;return[typeof e=="boolean"?e:ti(e),t]},useSyncExternalStore:hp,useId:Lp,useHostTransitionStatus:Ic,useFormState:_p,useActionState:_p,useOptimistic:function(e,t){var s=Qt();return bp(s,St,e,t)},useMemoCache:Gc,useCacheRefresh:Up};tu.useEffectEvent=Tp;var Xp={readContext:hn,use:gr,useCallback:jp,useContext:hn,useEffect:Qc,useImperativeHandle:Bp,useInsertionEffect:Mp,useLayoutEffect:Cp,useMemo:zp,useReducer:Vc,useRef:Dp,useState:function(){return Vc(xa)},useDebugValue:Zc,useDeferredValue:function(e,t){var s=Qt();return St===null?Kc(s,e,t):Rp(s,St.memoizedState,e,t)},useTransition:function(){var e=Vc(xa)[0],t=Qt().memoizedState;return[typeof e=="boolean"?e:ti(e),t]},useSyncExternalStore:hp,useId:Lp,useHostTransitionStatus:Ic,useFormState:$p,useActionState:$p,useOptimistic:function(e,t){var s=Qt();return St!==null?bp(s,St,e,t):(s.baseState=e,[e,s.queue.dispatch])},useMemoCache:Gc,useCacheRefresh:Up};Xp.useEffectEvent=Tp;function nu(e,t,s,i){t=e.memoizedState,s=s(i,t),s=s==null?t:b({},t,s),e.memoizedState=s,e.lanes===0&&(e.updateQueue.baseState=s)}var au={enqueueSetState:function(e,t,s){e=e._reactInternals;var i=Rn(),h=La(i);h.payload=t,s!=null&&(h.callback=s),t=Ua(e,h,i),t!==null&&(Tn(t,e,i),Ko(t,e,i))},enqueueReplaceState:function(e,t,s){e=e._reactInternals;var i=Rn(),h=La(i);h.tag=1,h.payload=t,s!=null&&(h.callback=s),t=Ua(e,h,i),t!==null&&(Tn(t,e,i),Ko(t,e,i))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var s=Rn(),i=La(s);i.tag=2,t!=null&&(i.callback=t),t=Ua(e,i,s),t!==null&&(Tn(t,e,s),Ko(t,e,s))}};function Jp(e,t,s,i,h,m,y){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(i,m,y):t.prototype&&t.prototype.isPureReactComponent?!Po(s,i)||!Po(h,m):!0}function Qp(e,t,s,i){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(s,i),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(s,i),t.state!==e&&au.enqueueReplaceState(t,t.state,null)}function As(e,t){var s=t;if("ref"in t){s={};for(var i in t)i!=="ref"&&(s[i]=t[i])}if(e=e.defaultProps){s===t&&(s=b({},s));for(var h in e)s[h]===void 0&&(s[h]=e[h])}return s}function Zp(e){Wi(e)}function Kp(e){console.error(e)}function Wp(e){Wi(e)}function wr(e,t){try{var s=e.onUncaughtError;s(t.value,{componentStack:t.stack})}catch(i){setTimeout(function(){throw i})}}function Ip(e,t,s){try{var i=e.onCaughtError;i(s.value,{componentStack:s.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(h){setTimeout(function(){throw h})}}function su(e,t,s){return s=La(s),s.tag=3,s.payload={element:null},s.callback=function(){wr(e,t)},s}function ef(e){return e=La(e),e.tag=3,e}function tf(e,t,s,i){var h=s.type.getDerivedStateFromError;if(typeof h=="function"){var m=i.value;e.payload=function(){return h(m)},e.callback=function(){Ip(t,s,i)}}var y=s.stateNode;y!==null&&typeof y.componentDidCatch=="function"&&(e.callback=function(){Ip(t,s,i),typeof h!="function"&&(Ja===null?Ja=new Set([this]):Ja.add(this));var A=i.stack;this.componentDidCatch(i.value,{componentStack:A!==null?A:""})})}function nb(e,t,s,i,h){if(s.flags|=32768,i!==null&&typeof i=="object"&&typeof i.then=="function"){if(t=s.alternate,t!==null&&Ks(t,s,h,!0),s=On.current,s!==null){switch(s.tag){case 31:case 13:return Xn===null?Or():s.alternate===null&&Gt===0&&(Gt=3),s.flags&=-257,s.flags|=65536,s.lanes=h,i===lr?s.flags|=16384:(t=s.updateQueue,t===null?s.updateQueue=new Set([i]):t.add(i),Nu(e,i,h)),!1;case 22:return s.flags|=65536,i===lr?s.flags|=16384:(t=s.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([i])},s.updateQueue=t):(s=t.retryQueue,s===null?t.retryQueue=new Set([i]):s.add(i)),Nu(e,i,h)),!1}throw Error(u(435,s.tag))}return Nu(e,i,h),Or(),!1}if(ht)return t=On.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=h,i!==Ec&&(e=Error(u(422),{cause:i}),Vo(Pn(e,s)))):(i!==Ec&&(t=Error(u(423),{cause:i}),Vo(Pn(t,s))),e=e.current.alternate,e.flags|=65536,h&=-h,e.lanes|=h,i=Pn(i,s),h=su(e.stateNode,i,h),Bc(e,h),Gt!==4&&(Gt=2)),!1;var m=Error(u(520),{cause:i});if(m=Pn(m,s),di===null?di=[m]:di.push(m),Gt!==4&&(Gt=2),t===null)return!0;i=Pn(i,s),s=t;do{switch(s.tag){case 3:return s.flags|=65536,e=h&-h,s.lanes|=e,e=su(s.stateNode,i,e),Bc(s,e),!1;case 1:if(t=s.type,m=s.stateNode,(s.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||m!==null&&typeof m.componentDidCatch=="function"&&(Ja===null||!Ja.has(m))))return s.flags|=65536,h&=-h,s.lanes|=h,h=ef(h),tf(h,e,s,i),Bc(s,h),!1}s=s.return}while(s!==null);return!1}var ou=Error(u(461)),It=!1;function pn(e,t,s,i){t.child=e===null?op(t,null,s,i):ks(t,e.child,s,i)}function nf(e,t,s,i,h){s=s.render;var m=t.ref;if("ref"in i){var y={};for(var A in i)A!=="ref"&&(y[A]=i[A])}else y=i;return bs(t),i=Hc(e,t,s,y,m,h),A=Lc(),e!==null&&!It?(Uc(e,t,h),wa(e,t,h)):(ht&&A&&wc(t),t.flags|=1,pn(e,t,i,h),t.child)}function af(e,t,s,i,h){if(e===null){var m=s.type;return typeof m=="function"&&!bc(m)&&m.defaultProps===void 0&&s.compare===null?(t.tag=15,t.type=m,sf(e,t,m,i,h)):(e=nr(s.type,null,i,t,t.mode,h),e.ref=t.ref,e.return=t,t.child=e)}if(m=e.child,!pu(e,h)){var y=m.memoizedProps;if(s=s.compare,s=s!==null?s:Po,s(y,i)&&e.ref===t.ref)return wa(e,t,h)}return t.flags|=1,e=ma(m,i),e.ref=t.ref,e.return=t,t.child=e}function sf(e,t,s,i,h){if(e!==null){var m=e.memoizedProps;if(Po(m,i)&&e.ref===t.ref)if(It=!1,t.pendingProps=i=m,pu(e,h))(e.flags&131072)!==0&&(It=!0);else return t.lanes=e.lanes,wa(e,t,h)}return iu(e,t,s,i,h)}function of(e,t,s,i){var h=i.children,m=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),i.mode==="hidden"){if((t.flags&128)!==0){if(m=m!==null?m.baseLanes|s:s,e!==null){for(i=t.child=e.child,h=0;i!==null;)h=h|i.lanes|i.childLanes,i=i.sibling;i=h&~m}else i=0,t.child=null;return rf(e,t,m,s,i)}if((s&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&ir(t,m!==null?m.cachePool:null),m!==null?lp(t,m):zc(),cp(t);else return i=t.lanes=536870912,rf(e,t,m!==null?m.baseLanes|s:s,s,i)}else m!==null?(ir(t,m.cachePool),lp(t,m),Ga(),t.memoizedState=null):(e!==null&&ir(t,null),zc(),Ga());return pn(e,t,h,s),t.child}function si(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function rf(e,t,s,i,h){var m=Tc();return m=m===null?null:{parent:Kt._currentValue,pool:m},t.memoizedState={baseLanes:s,cachePool:m},e!==null&&ir(t,null),zc(),cp(t),e!==null&&Ks(e,t,i,!0),t.childLanes=h,null}function kr(e,t){return t=Ar({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function lf(e,t,s){return ks(t,e.child,null,s),e=kr(t,t.pendingProps),e.flags|=2,Bn(t),t.memoizedState=null,e}function ab(e,t,s){var i=t.pendingProps,h=(t.flags&128)!==0;if(t.flags&=-129,e===null){if(ht){if(i.mode==="hidden")return e=kr(t,i),t.lanes=536870912,si(null,e);if(qc(t),(e=Bt)?(e=xm(e,Vn),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:za!==null?{id:aa,overflow:sa}:null,retryLane:536870912,hydrationErrors:null},s=Gh(e),s.return=t,t.child=s,dn=t,Bt=null)):e=null,e===null)throw qa(t);return t.lanes=536870912,null}return kr(t,i)}var m=e.memoizedState;if(m!==null){var y=m.dehydrated;if(qc(t),h)if(t.flags&256)t.flags&=-257,t=lf(e,t,s);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(u(558));else if(It||Ks(e,t,s,!1),h=(s&e.childLanes)!==0,It||h){if(i=Mt,i!==null&&(y=Te(i,s),y!==0&&y!==m.retryLane))throw m.retryLane=y,fs(e,y),Tn(i,e,y),ou;Or(),t=lf(e,t,s)}else e=m.treeContext,Bt=Jn(y.nextSibling),dn=t,ht=!0,Ra=null,Vn=!1,e!==null&&Xh(t,e),t=kr(t,i),t.flags|=4096;return t}return e=ma(e.child,{mode:i.mode,children:i.children}),e.ref=t.ref,t.child=e,e.return=t,e}function Er(e,t){var s=t.ref;if(s===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof s!="function"&&typeof s!="object")throw Error(u(284));(e===null||e.ref!==s)&&(t.flags|=4194816)}}function iu(e,t,s,i,h){return bs(t),s=Hc(e,t,s,i,void 0,h),i=Lc(),e!==null&&!It?(Uc(e,t,h),wa(e,t,h)):(ht&&i&&wc(t),t.flags|=1,pn(e,t,s,h),t.child)}function cf(e,t,s,i,h,m){return bs(t),t.updateQueue=null,s=dp(t,i,s,h),up(e),i=Lc(),e!==null&&!It?(Uc(e,t,m),wa(e,t,m)):(ht&&i&&wc(t),t.flags|=1,pn(e,t,s,m),t.child)}function uf(e,t,s,i,h){if(bs(t),t.stateNode===null){var m=Xs,y=s.contextType;typeof y=="object"&&y!==null&&(m=hn(y)),m=new s(i,m),t.memoizedState=m.state!==null&&m.state!==void 0?m.state:null,m.updater=au,t.stateNode=m,m._reactInternals=t,m=t.stateNode,m.props=i,m.state=t.memoizedState,m.refs={},Cc(t),y=s.contextType,m.context=typeof y=="object"&&y!==null?hn(y):Xs,m.state=t.memoizedState,y=s.getDerivedStateFromProps,typeof y=="function"&&(nu(t,s,y,i),m.state=t.memoizedState),typeof s.getDerivedStateFromProps=="function"||typeof m.getSnapshotBeforeUpdate=="function"||typeof m.UNSAFE_componentWillMount!="function"&&typeof m.componentWillMount!="function"||(y=m.state,typeof m.componentWillMount=="function"&&m.componentWillMount(),typeof m.UNSAFE_componentWillMount=="function"&&m.UNSAFE_componentWillMount(),y!==m.state&&au.enqueueReplaceState(m,m.state,null),Io(t,i,m,h),Wo(),m.state=t.memoizedState),typeof m.componentDidMount=="function"&&(t.flags|=4194308),i=!0}else if(e===null){m=t.stateNode;var A=t.memoizedProps,H=As(s,A);m.props=H;var se=m.context,me=s.contextType;y=Xs,typeof me=="object"&&me!==null&&(y=hn(me));var ke=s.getDerivedStateFromProps;me=typeof ke=="function"||typeof m.getSnapshotBeforeUpdate=="function",A=t.pendingProps!==A,me||typeof m.UNSAFE_componentWillReceiveProps!="function"&&typeof m.componentWillReceiveProps!="function"||(A||se!==y)&&Qp(t,m,i,y),Ha=!1;var ie=t.memoizedState;m.state=ie,Io(t,i,m,h),Wo(),se=t.memoizedState,A||ie!==se||Ha?(typeof ke=="function"&&(nu(t,s,ke,i),se=t.memoizedState),(H=Ha||Jp(t,s,H,i,ie,se,y))?(me||typeof m.UNSAFE_componentWillMount!="function"&&typeof m.componentWillMount!="function"||(typeof m.componentWillMount=="function"&&m.componentWillMount(),typeof m.UNSAFE_componentWillMount=="function"&&m.UNSAFE_componentWillMount()),typeof m.componentDidMount=="function"&&(t.flags|=4194308)):(typeof m.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=i,t.memoizedState=se),m.props=i,m.state=se,m.context=y,i=H):(typeof m.componentDidMount=="function"&&(t.flags|=4194308),i=!1)}else{m=t.stateNode,Oc(e,t),y=t.memoizedProps,me=As(s,y),m.props=me,ke=t.pendingProps,ie=m.context,se=s.contextType,H=Xs,typeof se=="object"&&se!==null&&(H=hn(se)),A=s.getDerivedStateFromProps,(se=typeof A=="function"||typeof m.getSnapshotBeforeUpdate=="function")||typeof m.UNSAFE_componentWillReceiveProps!="function"&&typeof m.componentWillReceiveProps!="function"||(y!==ke||ie!==H)&&Qp(t,m,i,H),Ha=!1,ie=t.memoizedState,m.state=ie,Io(t,i,m,h),Wo();var le=t.memoizedState;y!==ke||ie!==le||Ha||e!==null&&e.dependencies!==null&&sr(e.dependencies)?(typeof A=="function"&&(nu(t,s,A,i),le=t.memoizedState),(me=Ha||Jp(t,s,me,i,ie,le,H)||e!==null&&e.dependencies!==null&&sr(e.dependencies))?(se||typeof m.UNSAFE_componentWillUpdate!="function"&&typeof m.componentWillUpdate!="function"||(typeof m.componentWillUpdate=="function"&&m.componentWillUpdate(i,le,H),typeof m.UNSAFE_componentWillUpdate=="function"&&m.UNSAFE_componentWillUpdate(i,le,H)),typeof m.componentDidUpdate=="function"&&(t.flags|=4),typeof m.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof m.componentDidUpdate!="function"||y===e.memoizedProps&&ie===e.memoizedState||(t.flags|=4),typeof m.getSnapshotBeforeUpdate!="function"||y===e.memoizedProps&&ie===e.memoizedState||(t.flags|=1024),t.memoizedProps=i,t.memoizedState=le),m.props=i,m.state=le,m.context=H,i=me):(typeof m.componentDidUpdate!="function"||y===e.memoizedProps&&ie===e.memoizedState||(t.flags|=4),typeof m.getSnapshotBeforeUpdate!="function"||y===e.memoizedProps&&ie===e.memoizedState||(t.flags|=1024),i=!1)}return m=i,Er(e,t),i=(t.flags&128)!==0,m||i?(m=t.stateNode,s=i&&typeof s.getDerivedStateFromError!="function"?null:m.render(),t.flags|=1,e!==null&&i?(t.child=ks(t,e.child,null,h),t.child=ks(t,null,s,h)):pn(e,t,s,h),t.memoizedState=m.state,e=t.child):e=wa(e,t,h),e}function df(e,t,s,i){return gs(),t.flags|=256,pn(e,t,s,i),t.child}var ru={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function lu(e){return{baseLanes:e,cachePool:Ih()}}function cu(e,t,s){return e=e!==null?e.childLanes&~s:0,t&&(e|=zn),e}function hf(e,t,s){var i=t.pendingProps,h=!1,m=(t.flags&128)!==0,y;if((y=m)||(y=e!==null&&e.memoizedState===null?!1:(Jt.current&2)!==0),y&&(h=!0,t.flags&=-129),y=(t.flags&32)!==0,t.flags&=-33,e===null){if(ht){if(h?Pa(t):Ga(),(e=Bt)?(e=xm(e,Vn),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:za!==null?{id:aa,overflow:sa}:null,retryLane:536870912,hydrationErrors:null},s=Gh(e),s.return=t,t.child=s,dn=t,Bt=null)):e=null,e===null)throw qa(t);return Yu(e)?t.lanes=32:t.lanes=536870912,null}var A=i.children;return i=i.fallback,h?(Ga(),h=t.mode,A=Ar({mode:"hidden",children:A},h),i=ms(i,h,s,null),A.return=t,i.return=t,A.sibling=i,t.child=A,i=t.child,i.memoizedState=lu(s),i.childLanes=cu(e,y,s),t.memoizedState=ru,si(null,i)):(Pa(t),uu(t,A))}var H=e.memoizedState;if(H!==null&&(A=H.dehydrated,A!==null)){if(m)t.flags&256?(Pa(t),t.flags&=-257,t=du(e,t,s)):t.memoizedState!==null?(Ga(),t.child=e.child,t.flags|=128,t=null):(Ga(),A=i.fallback,h=t.mode,i=Ar({mode:"visible",children:i.children},h),A=ms(A,h,s,null),A.flags|=2,i.return=t,A.return=t,i.sibling=A,t.child=i,ks(t,e.child,null,s),i=t.child,i.memoizedState=lu(s),i.childLanes=cu(e,y,s),t.memoizedState=ru,t=si(null,i));else if(Pa(t),Yu(A)){if(y=A.nextSibling&&A.nextSibling.dataset,y)var se=y.dgst;y=se,i=Error(u(419)),i.stack="",i.digest=y,Vo({value:i,source:null,stack:null}),t=du(e,t,s)}else if(It||Ks(e,t,s,!1),y=(s&e.childLanes)!==0,It||y){if(y=Mt,y!==null&&(i=Te(y,s),i!==0&&i!==H.retryLane))throw H.retryLane=i,fs(e,i),Tn(y,e,i),ou;Gu(A)||Or(),t=du(e,t,s)}else Gu(A)?(t.flags|=192,t.child=e.child,t=null):(e=H.treeContext,Bt=Jn(A.nextSibling),dn=t,ht=!0,Ra=null,Vn=!1,e!==null&&Xh(t,e),t=uu(t,i.children),t.flags|=4096);return t}return h?(Ga(),A=i.fallback,h=t.mode,H=e.child,se=H.sibling,i=ma(H,{mode:"hidden",children:i.children}),i.subtreeFlags=H.subtreeFlags&65011712,se!==null?A=ma(se,A):(A=ms(A,h,s,null),A.flags|=2),A.return=t,i.return=t,i.sibling=A,t.child=i,si(null,i),i=t.child,A=e.child.memoizedState,A===null?A=lu(s):(h=A.cachePool,h!==null?(H=Kt._currentValue,h=h.parent!==H?{parent:H,pool:H}:h):h=Ih(),A={baseLanes:A.baseLanes|s,cachePool:h}),i.memoizedState=A,i.childLanes=cu(e,y,s),t.memoizedState=ru,si(e.child,i)):(Pa(t),s=e.child,e=s.sibling,s=ma(s,{mode:"visible",children:i.children}),s.return=t,s.sibling=null,e!==null&&(y=t.deletions,y===null?(t.deletions=[e],t.flags|=16):y.push(e)),t.child=s,t.memoizedState=null,s)}function uu(e,t){return t=Ar({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function Ar(e,t){return e=Cn(22,e,null,t),e.lanes=0,e}function du(e,t,s){return ks(t,e.child,null,s),e=uu(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function pf(e,t,s){e.lanes|=t;var i=e.alternate;i!==null&&(i.lanes|=t),Sc(e.return,t,s)}function hu(e,t,s,i,h,m){var y=e.memoizedState;y===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:i,tail:s,tailMode:h,treeForkCount:m}:(y.isBackwards=t,y.rendering=null,y.renderingStartTime=0,y.last=i,y.tail=s,y.tailMode=h,y.treeForkCount=m)}function ff(e,t,s){var i=t.pendingProps,h=i.revealOrder,m=i.tail;i=i.children;var y=Jt.current,A=(y&2)!==0;if(A?(y=y&1|2,t.flags|=128):y&=1,te(Jt,y),pn(e,t,i,s),i=ht?Yo:0,!A&&e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&pf(e,s,t);else if(e.tag===19)pf(e,s,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(h){case"forwards":for(s=t.child,h=null;s!==null;)e=s.alternate,e!==null&&hr(e)===null&&(h=s),s=s.sibling;s=h,s===null?(h=t.child,t.child=null):(h=s.sibling,s.sibling=null),hu(t,!1,h,s,m,i);break;case"backwards":case"unstable_legacy-backwards":for(s=null,h=t.child,t.child=null;h!==null;){if(e=h.alternate,e!==null&&hr(e)===null){t.child=h;break}e=h.sibling,h.sibling=s,s=h,h=e}hu(t,!0,s,null,m,i);break;case"together":hu(t,!1,null,null,void 0,i);break;default:t.memoizedState=null}return t.child}function wa(e,t,s){if(e!==null&&(t.dependencies=e.dependencies),Xa|=t.lanes,(s&t.childLanes)===0)if(e!==null){if(Ks(e,t,s,!1),(s&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(u(153));if(t.child!==null){for(e=t.child,s=ma(e,e.pendingProps),t.child=s,s.return=t;e.sibling!==null;)e=e.sibling,s=s.sibling=ma(e,e.pendingProps),s.return=t;s.sibling=null}return t.child}function pu(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&sr(e)))}function sb(e,t,s){switch(t.tag){case 3:Ye(t,t.stateNode.containerInfo),Fa(t,Kt,e.memoizedState.cache),gs();break;case 27:case 5:ot(t);break;case 4:Ye(t,t.stateNode.containerInfo);break;case 10:Fa(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,qc(t),null;break;case 13:var i=t.memoizedState;if(i!==null)return i.dehydrated!==null?(Pa(t),t.flags|=128,null):(s&t.child.childLanes)!==0?hf(e,t,s):(Pa(t),e=wa(e,t,s),e!==null?e.sibling:null);Pa(t);break;case 19:var h=(e.flags&128)!==0;if(i=(s&t.childLanes)!==0,i||(Ks(e,t,s,!1),i=(s&t.childLanes)!==0),h){if(i)return ff(e,t,s);t.flags|=128}if(h=t.memoizedState,h!==null&&(h.rendering=null,h.tail=null,h.lastEffect=null),te(Jt,Jt.current),i)break;return null;case 22:return t.lanes=0,of(e,t,s,t.pendingProps);case 24:Fa(t,Kt,e.memoizedState.cache)}return wa(e,t,s)}function mf(e,t,s){if(e!==null)if(e.memoizedProps!==t.pendingProps)It=!0;else{if(!pu(e,s)&&(t.flags&128)===0)return It=!1,sb(e,t,s);It=(e.flags&131072)!==0}else It=!1,ht&&(t.flags&1048576)!==0&&Vh(t,Yo,t.index);switch(t.lanes=0,t.tag){case 16:e:{var i=t.pendingProps;if(e=xs(t.elementType),t.type=e,typeof e=="function")bc(e)?(i=As(e,i),t.tag=1,t=uf(null,t,e,i,s)):(t.tag=0,t=iu(null,t,e,i,s));else{if(e!=null){var h=e.$$typeof;if(h===G){t.tag=11,t=nf(null,t,e,i,s);break e}else if(h===U){t.tag=14,t=af(null,t,e,i,s);break e}}throw t=Ce(e)||e,Error(u(306,t,""))}}return t;case 0:return iu(e,t,t.type,t.pendingProps,s);case 1:return i=t.type,h=As(i,t.pendingProps),uf(e,t,i,h,s);case 3:e:{if(Ye(t,t.stateNode.containerInfo),e===null)throw Error(u(387));i=t.pendingProps;var m=t.memoizedState;h=m.element,Oc(e,t),Io(t,i,null,s);var y=t.memoizedState;if(i=y.cache,Fa(t,Kt,i),i!==m.cache&&$c(t,[Kt],s,!0),Wo(),i=y.element,m.isDehydrated)if(m={element:i,isDehydrated:!1,cache:y.cache},t.updateQueue.baseState=m,t.memoizedState=m,t.flags&256){t=df(e,t,i,s);break e}else if(i!==h){h=Pn(Error(u(424)),t),Vo(h),t=df(e,t,i,s);break e}else for(e=t.stateNode.containerInfo,e.nodeType===9?e=e.body:e=e.nodeName==="HTML"?e.ownerDocument.body:e,Bt=Jn(e.firstChild),dn=t,ht=!0,Ra=null,Vn=!0,s=op(t,null,i,s),t.child=s;s;)s.flags=s.flags&-3|4096,s=s.sibling;else{if(gs(),i===h){t=wa(e,t,s);break e}pn(e,t,i,s)}t=t.child}return t;case 26:return Er(e,t),e===null?(s=Sm(t.type,null,t.pendingProps,null))?t.memoizedState=s:ht||(s=t.type,e=t.pendingProps,i=Hr(Se.current).createElement(s),i[mt]=t,i[bn]=e,fn(i,s,e),on(i),t.stateNode=i):t.memoizedState=Sm(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return ot(t),e===null&&ht&&(i=t.stateNode=Em(t.type,t.pendingProps,Se.current),dn=t,Vn=!0,h=Bt,Wa(t.type)?(Vu=h,Bt=Jn(i.firstChild)):Bt=h),pn(e,t,t.pendingProps.children,s),Er(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&ht&&((h=i=Bt)&&(i=Bb(i,t.type,t.pendingProps,Vn),i!==null?(t.stateNode=i,dn=t,Bt=Jn(i.firstChild),Vn=!1,h=!0):h=!1),h||qa(t)),ot(t),h=t.type,m=t.pendingProps,y=e!==null?e.memoizedProps:null,i=m.children,Lu(h,m)?i=null:y!==null&&Lu(h,y)&&(t.flags|=32),t.memoizedState!==null&&(h=Hc(e,t,Qy,null,null,s),vi._currentValue=h),Er(e,t),pn(e,t,i,s),t.child;case 6:return e===null&&ht&&((e=s=Bt)&&(s=jb(s,t.pendingProps,Vn),s!==null?(t.stateNode=s,dn=t,Bt=null,e=!0):e=!1),e||qa(t)),null;case 13:return hf(e,t,s);case 4:return Ye(t,t.stateNode.containerInfo),i=t.pendingProps,e===null?t.child=ks(t,null,i,s):pn(e,t,i,s),t.child;case 11:return nf(e,t,t.type,t.pendingProps,s);case 7:return pn(e,t,t.pendingProps,s),t.child;case 8:return pn(e,t,t.pendingProps.children,s),t.child;case 12:return pn(e,t,t.pendingProps.children,s),t.child;case 10:return i=t.pendingProps,Fa(t,t.type,i.value),pn(e,t,i.children,s),t.child;case 9:return h=t.type._context,i=t.pendingProps.children,bs(t),h=hn(h),i=i(h),t.flags|=1,pn(e,t,i,s),t.child;case 14:return af(e,t,t.type,t.pendingProps,s);case 15:return sf(e,t,t.type,t.pendingProps,s);case 19:return ff(e,t,s);case 31:return ab(e,t,s);case 22:return of(e,t,s,t.pendingProps);case 24:return bs(t),i=hn(Kt),e===null?(h=Tc(),h===null&&(h=Mt,m=Dc(),h.pooledCache=m,m.refCount++,m!==null&&(h.pooledCacheLanes|=s),h=m),t.memoizedState={parent:i,cache:h},Cc(t),Fa(t,Kt,h)):((e.lanes&s)!==0&&(Oc(e,t),Io(t,null,null,s),Wo()),h=e.memoizedState,m=t.memoizedState,h.parent!==i?(h={parent:i,cache:i},t.memoizedState=h,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=h),Fa(t,Kt,i)):(i=m.cache,Fa(t,Kt,i),i!==h.cache&&$c(t,[Kt],s,!0))),pn(e,t,t.pendingProps.children,s),t.child;case 29:throw t.pendingProps}throw Error(u(156,t.tag))}function ka(e){e.flags|=4}function fu(e,t,s,i,h){if((t=(e.mode&32)!==0)&&(t=!1),t){if(e.flags|=16777216,(h&335544128)===h)if(e.stateNode.complete)e.flags|=8192;else if(Uf())e.flags|=8192;else throw ws=lr,Mc}else e.flags&=-16777217}function gf(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!Mm(t))if(Uf())e.flags|=8192;else throw ws=lr,Mc}function _r(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?O():536870912,e.lanes|=t,co|=t)}function oi(e,t){if(!ht)switch(e.tailMode){case"hidden":t=e.tail;for(var s=null;t!==null;)t.alternate!==null&&(s=t),t=t.sibling;s===null?e.tail=null:s.sibling=null;break;case"collapsed":s=e.tail;for(var i=null;s!==null;)s.alternate!==null&&(i=s),s=s.sibling;i===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:i.sibling=null}}function jt(e){var t=e.alternate!==null&&e.alternate.child===e.child,s=0,i=0;if(t)for(var h=e.child;h!==null;)s|=h.lanes|h.childLanes,i|=h.subtreeFlags&65011712,i|=h.flags&65011712,h.return=e,h=h.sibling;else for(h=e.child;h!==null;)s|=h.lanes|h.childLanes,i|=h.subtreeFlags,i|=h.flags,h.return=e,h=h.sibling;return e.subtreeFlags|=i,e.childLanes=s,t}function ob(e,t,s){var i=t.pendingProps;switch(kc(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return jt(t),null;case 1:return jt(t),null;case 3:return s=t.stateNode,i=null,e!==null&&(i=e.memoizedState.cache),t.memoizedState.cache!==i&&(t.flags|=2048),ba(Kt),Fe(),s.pendingContext&&(s.context=s.pendingContext,s.pendingContext=null),(e===null||e.child===null)&&(Zs(t)?ka(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Ac())),jt(t),null;case 26:var h=t.type,m=t.memoizedState;return e===null?(ka(t),m!==null?(jt(t),gf(t,m)):(jt(t),fu(t,h,null,i,s))):m?m!==e.memoizedState?(ka(t),jt(t),gf(t,m)):(jt(t),t.flags&=-16777217):(e=e.memoizedProps,e!==i&&ka(t),jt(t),fu(t,h,e,i,s)),null;case 27:if(X(t),s=Se.current,h=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&ka(t);else{if(!i){if(t.stateNode===null)throw Error(u(166));return jt(t),null}e=de.current,Zs(t)?Jh(t):(e=Em(h,i,s),t.stateNode=e,ka(t))}return jt(t),null;case 5:if(X(t),h=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&ka(t);else{if(!i){if(t.stateNode===null)throw Error(u(166));return jt(t),null}if(m=de.current,Zs(t))Jh(t);else{var y=Hr(Se.current);switch(m){case 1:m=y.createElementNS("http://www.w3.org/2000/svg",h);break;case 2:m=y.createElementNS("http://www.w3.org/1998/Math/MathML",h);break;default:switch(h){case"svg":m=y.createElementNS("http://www.w3.org/2000/svg",h);break;case"math":m=y.createElementNS("http://www.w3.org/1998/Math/MathML",h);break;case"script":m=y.createElement("div"),m.innerHTML="<script><\/script>",m=m.removeChild(m.firstChild);break;case"select":m=typeof i.is=="string"?y.createElement("select",{is:i.is}):y.createElement("select"),i.multiple?m.multiple=!0:i.size&&(m.size=i.size);break;default:m=typeof i.is=="string"?y.createElement(h,{is:i.is}):y.createElement(h)}}m[mt]=t,m[bn]=i;e:for(y=t.child;y!==null;){if(y.tag===5||y.tag===6)m.appendChild(y.stateNode);else if(y.tag!==4&&y.tag!==27&&y.child!==null){y.child.return=y,y=y.child;continue}if(y===t)break e;for(;y.sibling===null;){if(y.return===null||y.return===t)break e;y=y.return}y.sibling.return=y.return,y=y.sibling}t.stateNode=m;e:switch(fn(m,h,i),h){case"button":case"input":case"select":case"textarea":i=!!i.autoFocus;break e;case"img":i=!0;break e;default:i=!1}i&&ka(t)}}return jt(t),fu(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,s),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==i&&ka(t);else{if(typeof i!="string"&&t.stateNode===null)throw Error(u(166));if(e=Se.current,Zs(t)){if(e=t.stateNode,s=t.memoizedProps,i=null,h=dn,h!==null)switch(h.tag){case 27:case 5:i=h.memoizedProps}e[mt]=t,e=!!(e.nodeValue===s||i!==null&&i.suppressHydrationWarning===!0||hm(e.nodeValue,s)),e||qa(t,!0)}else e=Hr(e).createTextNode(i),e[mt]=t,t.stateNode=e}return jt(t),null;case 31:if(s=t.memoizedState,e===null||e.memoizedState!==null){if(i=Zs(t),s!==null){if(e===null){if(!i)throw Error(u(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(u(557));e[mt]=t}else gs(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;jt(t),e=!1}else s=Ac(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=s),e=!0;if(!e)return t.flags&256?(Bn(t),t):(Bn(t),null);if((t.flags&128)!==0)throw Error(u(558))}return jt(t),null;case 13:if(i=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(h=Zs(t),i!==null&&i.dehydrated!==null){if(e===null){if(!h)throw Error(u(318));if(h=t.memoizedState,h=h!==null?h.dehydrated:null,!h)throw Error(u(317));h[mt]=t}else gs(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;jt(t),h=!1}else h=Ac(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=h),h=!0;if(!h)return t.flags&256?(Bn(t),t):(Bn(t),null)}return Bn(t),(t.flags&128)!==0?(t.lanes=s,t):(s=i!==null,e=e!==null&&e.memoizedState!==null,s&&(i=t.child,h=null,i.alternate!==null&&i.alternate.memoizedState!==null&&i.alternate.memoizedState.cachePool!==null&&(h=i.alternate.memoizedState.cachePool.pool),m=null,i.memoizedState!==null&&i.memoizedState.cachePool!==null&&(m=i.memoizedState.cachePool.pool),m!==h&&(i.flags|=2048)),s!==e&&s&&(t.child.flags|=8192),_r(t,t.updateQueue),jt(t),null);case 4:return Fe(),e===null&&zu(t.stateNode.containerInfo),jt(t),null;case 10:return ba(t.type),jt(t),null;case 19:if(T(Jt),i=t.memoizedState,i===null)return jt(t),null;if(h=(t.flags&128)!==0,m=i.rendering,m===null)if(h)oi(i,!1);else{if(Gt!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(m=hr(e),m!==null){for(t.flags|=128,oi(i,!1),e=m.updateQueue,t.updateQueue=e,_r(t,e),t.subtreeFlags=0,e=s,s=t.child;s!==null;)Ph(s,e),s=s.sibling;return te(Jt,Jt.current&1|2),ht&&ga(t,i.treeForkCount),t.child}e=e.sibling}i.tail!==null&&qe()>Tr&&(t.flags|=128,h=!0,oi(i,!1),t.lanes=4194304)}else{if(!h)if(e=hr(m),e!==null){if(t.flags|=128,h=!0,e=e.updateQueue,t.updateQueue=e,_r(t,e),oi(i,!0),i.tail===null&&i.tailMode==="hidden"&&!m.alternate&&!ht)return jt(t),null}else 2*qe()-i.renderingStartTime>Tr&&s!==536870912&&(t.flags|=128,h=!0,oi(i,!1),t.lanes=4194304);i.isBackwards?(m.sibling=t.child,t.child=m):(e=i.last,e!==null?e.sibling=m:t.child=m,i.last=m)}return i.tail!==null?(e=i.tail,i.rendering=e,i.tail=e.sibling,i.renderingStartTime=qe(),e.sibling=null,s=Jt.current,te(Jt,h?s&1|2:s&1),ht&&ga(t,i.treeForkCount),e):(jt(t),null);case 22:case 23:return Bn(t),Rc(),i=t.memoizedState!==null,e!==null?e.memoizedState!==null!==i&&(t.flags|=8192):i&&(t.flags|=8192),i?(s&536870912)!==0&&(t.flags&128)===0&&(jt(t),t.subtreeFlags&6&&(t.flags|=8192)):jt(t),s=t.updateQueue,s!==null&&_r(t,s.retryQueue),s=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(s=e.memoizedState.cachePool.pool),i=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(i=t.memoizedState.cachePool.pool),i!==s&&(t.flags|=2048),e!==null&&T(vs),null;case 24:return s=null,e!==null&&(s=e.memoizedState.cache),t.memoizedState.cache!==s&&(t.flags|=2048),ba(Kt),jt(t),null;case 25:return null;case 30:return null}throw Error(u(156,t.tag))}function ib(e,t){switch(kc(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return ba(Kt),Fe(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return X(t),null;case 31:if(t.memoizedState!==null){if(Bn(t),t.alternate===null)throw Error(u(340));gs()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(Bn(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(u(340));gs()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return T(Jt),null;case 4:return Fe(),null;case 10:return ba(t.type),null;case 22:case 23:return Bn(t),Rc(),e!==null&&T(vs),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return ba(Kt),null;case 25:return null;default:return null}}function yf(e,t){switch(kc(t),t.tag){case 3:ba(Kt),Fe();break;case 26:case 27:case 5:X(t);break;case 4:Fe();break;case 31:t.memoizedState!==null&&Bn(t);break;case 13:Bn(t);break;case 19:T(Jt);break;case 10:ba(t.type);break;case 22:case 23:Bn(t),Rc(),e!==null&&T(vs);break;case 24:ba(Kt)}}function ii(e,t){try{var s=t.updateQueue,i=s!==null?s.lastEffect:null;if(i!==null){var h=i.next;s=h;do{if((s.tag&e)===e){i=void 0;var m=s.create,y=s.inst;i=m(),y.destroy=i}s=s.next}while(s!==h)}}catch(A){At(t,t.return,A)}}function Ya(e,t,s){try{var i=t.updateQueue,h=i!==null?i.lastEffect:null;if(h!==null){var m=h.next;i=m;do{if((i.tag&e)===e){var y=i.inst,A=y.destroy;if(A!==void 0){y.destroy=void 0,h=t;var H=s,se=A;try{se()}catch(me){At(h,H,me)}}}i=i.next}while(i!==m)}}catch(me){At(t,t.return,me)}}function bf(e){var t=e.updateQueue;if(t!==null){var s=e.stateNode;try{rp(t,s)}catch(i){At(e,e.return,i)}}}function vf(e,t,s){s.props=As(e.type,e.memoizedProps),s.state=e.memoizedState;try{s.componentWillUnmount()}catch(i){At(e,t,i)}}function ri(e,t){try{var s=e.ref;if(s!==null){switch(e.tag){case 26:case 27:case 5:var i=e.stateNode;break;case 30:i=e.stateNode;break;default:i=e.stateNode}typeof s=="function"?e.refCleanup=s(i):s.current=i}}catch(h){At(e,t,h)}}function oa(e,t){var s=e.ref,i=e.refCleanup;if(s!==null)if(typeof i=="function")try{i()}catch(h){At(e,t,h)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof s=="function")try{s(null)}catch(h){At(e,t,h)}else s.current=null}function xf(e){var t=e.type,s=e.memoizedProps,i=e.stateNode;try{e:switch(t){case"button":case"input":case"select":case"textarea":s.autoFocus&&i.focus();break e;case"img":s.src?i.src=s.src:s.srcSet&&(i.srcset=s.srcSet)}}catch(h){At(e,e.return,h)}}function mu(e,t,s){try{var i=e.stateNode;Db(i,e.type,s,t),i[bn]=t}catch(h){At(e,e.return,h)}}function wf(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Wa(e.type)||e.tag===4}function gu(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||wf(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Wa(e.type)||e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function yu(e,t,s){var i=e.tag;if(i===5||i===6)e=e.stateNode,t?(s.nodeType===9?s.body:s.nodeName==="HTML"?s.ownerDocument.body:s).insertBefore(e,t):(t=s.nodeType===9?s.body:s.nodeName==="HTML"?s.ownerDocument.body:s,t.appendChild(e),s=s._reactRootContainer,s!=null||t.onclick!==null||(t.onclick=pa));else if(i!==4&&(i===27&&Wa(e.type)&&(s=e.stateNode,t=null),e=e.child,e!==null))for(yu(e,t,s),e=e.sibling;e!==null;)yu(e,t,s),e=e.sibling}function Sr(e,t,s){var i=e.tag;if(i===5||i===6)e=e.stateNode,t?s.insertBefore(e,t):s.appendChild(e);else if(i!==4&&(i===27&&Wa(e.type)&&(s=e.stateNode),e=e.child,e!==null))for(Sr(e,t,s),e=e.sibling;e!==null;)Sr(e,t,s),e=e.sibling}function kf(e){var t=e.stateNode,s=e.memoizedProps;try{for(var i=e.type,h=t.attributes;h.length;)t.removeAttributeNode(h[0]);fn(t,i,s),t[mt]=e,t[bn]=s}catch(m){At(e,e.return,m)}}var Ea=!1,en=!1,bu=!1,Ef=typeof WeakSet=="function"?WeakSet:Set,rn=null;function rb(e,t){if(e=e.containerInfo,Fu=Xr,e=Bh(e),dc(e)){if("selectionStart"in e)var s={start:e.selectionStart,end:e.selectionEnd};else e:{s=(s=e.ownerDocument)&&s.defaultView||window;var i=s.getSelection&&s.getSelection();if(i&&i.rangeCount!==0){s=i.anchorNode;var h=i.anchorOffset,m=i.focusNode;i=i.focusOffset;try{s.nodeType,m.nodeType}catch{s=null;break e}var y=0,A=-1,H=-1,se=0,me=0,ke=e,ie=null;t:for(;;){for(var le;ke!==s||h!==0&&ke.nodeType!==3||(A=y+h),ke!==m||i!==0&&ke.nodeType!==3||(H=y+i),ke.nodeType===3&&(y+=ke.nodeValue.length),(le=ke.firstChild)!==null;)ie=ke,ke=le;for(;;){if(ke===e)break t;if(ie===s&&++se===h&&(A=y),ie===m&&++me===i&&(H=y),(le=ke.nextSibling)!==null)break;ke=ie,ie=ke.parentNode}ke=le}s=A===-1||H===-1?null:{start:A,end:H}}else s=null}s=s||{start:0,end:0}}else s=null;for(Hu={focusedElem:e,selectionRange:s},Xr=!1,rn=t;rn!==null;)if(t=rn,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,rn=e;else for(;rn!==null;){switch(t=rn,m=t.alternate,e=t.flags,t.tag){case 0:if((e&4)!==0&&(e=t.updateQueue,e=e!==null?e.events:null,e!==null))for(s=0;s<e.length;s++)h=e[s],h.ref.impl=h.nextImpl;break;case 11:case 15:break;case 1:if((e&1024)!==0&&m!==null){e=void 0,s=t,h=m.memoizedProps,m=m.memoizedState,i=s.stateNode;try{var Le=As(s.type,h);e=i.getSnapshotBeforeUpdate(Le,m),i.__reactInternalSnapshotBeforeUpdate=e}catch(Qe){At(s,s.return,Qe)}}break;case 3:if((e&1024)!==0){if(e=t.stateNode.containerInfo,s=e.nodeType,s===9)Pu(e);else if(s===1)switch(e.nodeName){case"HEAD":case"HTML":case"BODY":Pu(e);break;default:e.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((e&1024)!==0)throw Error(u(163))}if(e=t.sibling,e!==null){e.return=t.return,rn=e;break}rn=t.return}}function Af(e,t,s){var i=s.flags;switch(s.tag){case 0:case 11:case 15:_a(e,s),i&4&&ii(5,s);break;case 1:if(_a(e,s),i&4)if(e=s.stateNode,t===null)try{e.componentDidMount()}catch(y){At(s,s.return,y)}else{var h=As(s.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(h,t,e.__reactInternalSnapshotBeforeUpdate)}catch(y){At(s,s.return,y)}}i&64&&bf(s),i&512&&ri(s,s.return);break;case 3:if(_a(e,s),i&64&&(e=s.updateQueue,e!==null)){if(t=null,s.child!==null)switch(s.child.tag){case 27:case 5:t=s.child.stateNode;break;case 1:t=s.child.stateNode}try{rp(e,t)}catch(y){At(s,s.return,y)}}break;case 27:t===null&&i&4&&kf(s);case 26:case 5:_a(e,s),t===null&&i&4&&xf(s),i&512&&ri(s,s.return);break;case 12:_a(e,s);break;case 31:_a(e,s),i&4&&$f(e,s);break;case 13:_a(e,s),i&4&&Df(e,s),i&64&&(e=s.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(s=gb.bind(null,s),zb(e,s))));break;case 22:if(i=s.memoizedState!==null||Ea,!i){t=t!==null&&t.memoizedState!==null||en,h=Ea;var m=en;Ea=i,(en=t)&&!m?Sa(e,s,(s.subtreeFlags&8772)!==0):_a(e,s),Ea=h,en=m}break;case 30:break;default:_a(e,s)}}function _f(e){var t=e.alternate;t!==null&&(e.alternate=null,_f(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&Jl(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var Rt=null,Sn=!1;function Aa(e,t,s){for(s=s.child;s!==null;)Sf(e,t,s),s=s.sibling}function Sf(e,t,s){if(Xt&&typeof Xt.onCommitFiberUnmount=="function")try{Xt.onCommitFiberUnmount(cn,s)}catch{}switch(s.tag){case 26:en||oa(s,t),Aa(e,t,s),s.memoizedState?s.memoizedState.count--:s.stateNode&&(s=s.stateNode,s.parentNode.removeChild(s));break;case 27:en||oa(s,t);var i=Rt,h=Sn;Wa(s.type)&&(Rt=s.stateNode,Sn=!1),Aa(e,t,s),gi(s.stateNode),Rt=i,Sn=h;break;case 5:en||oa(s,t);case 6:if(i=Rt,h=Sn,Rt=null,Aa(e,t,s),Rt=i,Sn=h,Rt!==null)if(Sn)try{(Rt.nodeType===9?Rt.body:Rt.nodeName==="HTML"?Rt.ownerDocument.body:Rt).removeChild(s.stateNode)}catch(m){At(s,t,m)}else try{Rt.removeChild(s.stateNode)}catch(m){At(s,t,m)}break;case 18:Rt!==null&&(Sn?(e=Rt,bm(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,s.stateNode),bo(e)):bm(Rt,s.stateNode));break;case 4:i=Rt,h=Sn,Rt=s.stateNode.containerInfo,Sn=!0,Aa(e,t,s),Rt=i,Sn=h;break;case 0:case 11:case 14:case 15:Ya(2,s,t),en||Ya(4,s,t),Aa(e,t,s);break;case 1:en||(oa(s,t),i=s.stateNode,typeof i.componentWillUnmount=="function"&&vf(s,t,i)),Aa(e,t,s);break;case 21:Aa(e,t,s);break;case 22:en=(i=en)||s.memoizedState!==null,Aa(e,t,s),en=i;break;default:Aa(e,t,s)}}function $f(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{bo(e)}catch(s){At(t,t.return,s)}}}function Df(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{bo(e)}catch(s){At(t,t.return,s)}}function lb(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new Ef),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new Ef),t;default:throw Error(u(435,e.tag))}}function $r(e,t){var s=lb(e);t.forEach(function(i){if(!s.has(i)){s.add(i);var h=yb.bind(null,e,i);i.then(h,h)}})}function $n(e,t){var s=t.deletions;if(s!==null)for(var i=0;i<s.length;i++){var h=s[i],m=e,y=t,A=y;e:for(;A!==null;){switch(A.tag){case 27:if(Wa(A.type)){Rt=A.stateNode,Sn=!1;break e}break;case 5:Rt=A.stateNode,Sn=!1;break e;case 3:case 4:Rt=A.stateNode.containerInfo,Sn=!0;break e}A=A.return}if(Rt===null)throw Error(u(160));Sf(m,y,h),Rt=null,Sn=!1,m=h.alternate,m!==null&&(m.return=null),h.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)Nf(t,e),t=t.sibling}var ea=null;function Nf(e,t){var s=e.alternate,i=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:$n(t,e),Dn(e),i&4&&(Ya(3,e,e.return),ii(3,e),Ya(5,e,e.return));break;case 1:$n(t,e),Dn(e),i&512&&(en||s===null||oa(s,s.return)),i&64&&Ea&&(e=e.updateQueue,e!==null&&(i=e.callbacks,i!==null&&(s=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=s===null?i:s.concat(i))));break;case 26:var h=ea;if($n(t,e),Dn(e),i&512&&(en||s===null||oa(s,s.return)),i&4){var m=s!==null?s.memoizedState:null;if(i=e.memoizedState,s===null)if(i===null)if(e.stateNode===null){e:{i=e.type,s=e.memoizedProps,h=h.ownerDocument||h;t:switch(i){case"title":m=h.getElementsByTagName("title")[0],(!m||m[Bo]||m[mt]||m.namespaceURI==="http://www.w3.org/2000/svg"||m.hasAttribute("itemprop"))&&(m=h.createElement(i),h.head.insertBefore(m,h.querySelector("head > title"))),fn(m,i,s),m[mt]=e,on(m),i=m;break e;case"link":var y=Nm("link","href",h).get(i+(s.href||""));if(y){for(var A=0;A<y.length;A++)if(m=y[A],m.getAttribute("href")===(s.href==null||s.href===""?null:s.href)&&m.getAttribute("rel")===(s.rel==null?null:s.rel)&&m.getAttribute("title")===(s.title==null?null:s.title)&&m.getAttribute("crossorigin")===(s.crossOrigin==null?null:s.crossOrigin)){y.splice(A,1);break t}}m=h.createElement(i),fn(m,i,s),h.head.appendChild(m);break;case"meta":if(y=Nm("meta","content",h).get(i+(s.content||""))){for(A=0;A<y.length;A++)if(m=y[A],m.getAttribute("content")===(s.content==null?null:""+s.content)&&m.getAttribute("name")===(s.name==null?null:s.name)&&m.getAttribute("property")===(s.property==null?null:s.property)&&m.getAttribute("http-equiv")===(s.httpEquiv==null?null:s.httpEquiv)&&m.getAttribute("charset")===(s.charSet==null?null:s.charSet)){y.splice(A,1);break t}}m=h.createElement(i),fn(m,i,s),h.head.appendChild(m);break;default:throw Error(u(468,i))}m[mt]=e,on(m),i=m}e.stateNode=i}else Tm(h,e.type,e.stateNode);else e.stateNode=Dm(h,i,e.memoizedProps);else m!==i?(m===null?s.stateNode!==null&&(s=s.stateNode,s.parentNode.removeChild(s)):m.count--,i===null?Tm(h,e.type,e.stateNode):Dm(h,i,e.memoizedProps)):i===null&&e.stateNode!==null&&mu(e,e.memoizedProps,s.memoizedProps)}break;case 27:$n(t,e),Dn(e),i&512&&(en||s===null||oa(s,s.return)),s!==null&&i&4&&mu(e,e.memoizedProps,s.memoizedProps);break;case 5:if($n(t,e),Dn(e),i&512&&(en||s===null||oa(s,s.return)),e.flags&32){h=e.stateNode;try{Hs(h,"")}catch(Le){At(e,e.return,Le)}}i&4&&e.stateNode!=null&&(h=e.memoizedProps,mu(e,h,s!==null?s.memoizedProps:h)),i&1024&&(bu=!0);break;case 6:if($n(t,e),Dn(e),i&4){if(e.stateNode===null)throw Error(u(162));i=e.memoizedProps,s=e.stateNode;try{s.nodeValue=i}catch(Le){At(e,e.return,Le)}}break;case 3:if(Pr=null,h=ea,ea=Lr(t.containerInfo),$n(t,e),ea=h,Dn(e),i&4&&s!==null&&s.memoizedState.isDehydrated)try{bo(t.containerInfo)}catch(Le){At(e,e.return,Le)}bu&&(bu=!1,Tf(e));break;case 4:i=ea,ea=Lr(e.stateNode.containerInfo),$n(t,e),Dn(e),ea=i;break;case 12:$n(t,e),Dn(e);break;case 31:$n(t,e),Dn(e),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,$r(e,i)));break;case 13:$n(t,e),Dn(e),e.child.flags&8192&&e.memoizedState!==null!=(s!==null&&s.memoizedState!==null)&&(Nr=qe()),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,$r(e,i)));break;case 22:h=e.memoizedState!==null;var H=s!==null&&s.memoizedState!==null,se=Ea,me=en;if(Ea=se||h,en=me||H,$n(t,e),en=me,Ea=se,Dn(e),i&8192)e:for(t=e.stateNode,t._visibility=h?t._visibility&-2:t._visibility|1,h&&(s===null||H||Ea||en||_s(e)),s=null,t=e;;){if(t.tag===5||t.tag===26){if(s===null){H=s=t;try{if(m=H.stateNode,h)y=m.style,typeof y.setProperty=="function"?y.setProperty("display","none","important"):y.display="none";else{A=H.stateNode;var ke=H.memoizedProps.style,ie=ke!=null&&ke.hasOwnProperty("display")?ke.display:null;A.style.display=ie==null||typeof ie=="boolean"?"":(""+ie).trim()}}catch(Le){At(H,H.return,Le)}}}else if(t.tag===6){if(s===null){H=t;try{H.stateNode.nodeValue=h?"":H.memoizedProps}catch(Le){At(H,H.return,Le)}}}else if(t.tag===18){if(s===null){H=t;try{var le=H.stateNode;h?vm(le,!0):vm(H.stateNode,!1)}catch(Le){At(H,H.return,Le)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;s===t&&(s=null),t=t.return}s===t&&(s=null),t.sibling.return=t.return,t=t.sibling}i&4&&(i=e.updateQueue,i!==null&&(s=i.retryQueue,s!==null&&(i.retryQueue=null,$r(e,s))));break;case 19:$n(t,e),Dn(e),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,$r(e,i)));break;case 30:break;case 21:break;default:$n(t,e),Dn(e)}}function Dn(e){var t=e.flags;if(t&2){try{for(var s,i=e.return;i!==null;){if(wf(i)){s=i;break}i=i.return}if(s==null)throw Error(u(160));switch(s.tag){case 27:var h=s.stateNode,m=gu(e);Sr(e,m,h);break;case 5:var y=s.stateNode;s.flags&32&&(Hs(y,""),s.flags&=-33);var A=gu(e);Sr(e,A,y);break;case 3:case 4:var H=s.stateNode.containerInfo,se=gu(e);yu(e,se,H);break;default:throw Error(u(161))}}catch(me){At(e,e.return,me)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Tf(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Tf(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function _a(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)Af(e,t.alternate,t),t=t.sibling}function _s(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:Ya(4,t,t.return),_s(t);break;case 1:oa(t,t.return);var s=t.stateNode;typeof s.componentWillUnmount=="function"&&vf(t,t.return,s),_s(t);break;case 27:gi(t.stateNode);case 26:case 5:oa(t,t.return),_s(t);break;case 22:t.memoizedState===null&&_s(t);break;case 30:_s(t);break;default:_s(t)}e=e.sibling}}function Sa(e,t,s){for(s=s&&(t.subtreeFlags&8772)!==0,t=t.child;t!==null;){var i=t.alternate,h=e,m=t,y=m.flags;switch(m.tag){case 0:case 11:case 15:Sa(h,m,s),ii(4,m);break;case 1:if(Sa(h,m,s),i=m,h=i.stateNode,typeof h.componentDidMount=="function")try{h.componentDidMount()}catch(se){At(i,i.return,se)}if(i=m,h=i.updateQueue,h!==null){var A=i.stateNode;try{var H=h.shared.hiddenCallbacks;if(H!==null)for(h.shared.hiddenCallbacks=null,h=0;h<H.length;h++)ip(H[h],A)}catch(se){At(i,i.return,se)}}s&&y&64&&bf(m),ri(m,m.return);break;case 27:kf(m);case 26:case 5:Sa(h,m,s),s&&i===null&&y&4&&xf(m),ri(m,m.return);break;case 12:Sa(h,m,s);break;case 31:Sa(h,m,s),s&&y&4&&$f(h,m);break;case 13:Sa(h,m,s),s&&y&4&&Df(h,m);break;case 22:m.memoizedState===null&&Sa(h,m,s),ri(m,m.return);break;case 30:break;default:Sa(h,m,s)}t=t.sibling}}function vu(e,t){var s=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(s=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==s&&(e!=null&&e.refCount++,s!=null&&Xo(s))}function xu(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Xo(e))}function ta(e,t,s,i){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)Mf(e,t,s,i),t=t.sibling}function Mf(e,t,s,i){var h=t.flags;switch(t.tag){case 0:case 11:case 15:ta(e,t,s,i),h&2048&&ii(9,t);break;case 1:ta(e,t,s,i);break;case 3:ta(e,t,s,i),h&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Xo(e)));break;case 12:if(h&2048){ta(e,t,s,i),e=t.stateNode;try{var m=t.memoizedProps,y=m.id,A=m.onPostCommit;typeof A=="function"&&A(y,t.alternate===null?"mount":"update",e.passiveEffectDuration,-0)}catch(H){At(t,t.return,H)}}else ta(e,t,s,i);break;case 31:ta(e,t,s,i);break;case 13:ta(e,t,s,i);break;case 23:break;case 22:m=t.stateNode,y=t.alternate,t.memoizedState!==null?m._visibility&2?ta(e,t,s,i):li(e,t):m._visibility&2?ta(e,t,s,i):(m._visibility|=2,io(e,t,s,i,(t.subtreeFlags&10256)!==0||!1)),h&2048&&vu(y,t);break;case 24:ta(e,t,s,i),h&2048&&xu(t.alternate,t);break;default:ta(e,t,s,i)}}function io(e,t,s,i,h){for(h=h&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var m=e,y=t,A=s,H=i,se=y.flags;switch(y.tag){case 0:case 11:case 15:io(m,y,A,H,h),ii(8,y);break;case 23:break;case 22:var me=y.stateNode;y.memoizedState!==null?me._visibility&2?io(m,y,A,H,h):li(m,y):(me._visibility|=2,io(m,y,A,H,h)),h&&se&2048&&vu(y.alternate,y);break;case 24:io(m,y,A,H,h),h&&se&2048&&xu(y.alternate,y);break;default:io(m,y,A,H,h)}t=t.sibling}}function li(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var s=e,i=t,h=i.flags;switch(i.tag){case 22:li(s,i),h&2048&&vu(i.alternate,i);break;case 24:li(s,i),h&2048&&xu(i.alternate,i);break;default:li(s,i)}t=t.sibling}}var ci=8192;function ro(e,t,s){if(e.subtreeFlags&ci)for(e=e.child;e!==null;)Cf(e,t,s),e=e.sibling}function Cf(e,t,s){switch(e.tag){case 26:ro(e,t,s),e.flags&ci&&e.memoizedState!==null&&Jb(s,ea,e.memoizedState,e.memoizedProps);break;case 5:ro(e,t,s);break;case 3:case 4:var i=ea;ea=Lr(e.stateNode.containerInfo),ro(e,t,s),ea=i;break;case 22:e.memoizedState===null&&(i=e.alternate,i!==null&&i.memoizedState!==null?(i=ci,ci=16777216,ro(e,t,s),ci=i):ro(e,t,s));break;default:ro(e,t,s)}}function Of(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function ui(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var s=0;s<t.length;s++){var i=t[s];rn=i,jf(i,e)}Of(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Bf(e),e=e.sibling}function Bf(e){switch(e.tag){case 0:case 11:case 15:ui(e),e.flags&2048&&Ya(9,e,e.return);break;case 3:ui(e);break;case 12:ui(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,Dr(e)):ui(e);break;default:ui(e)}}function Dr(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var s=0;s<t.length;s++){var i=t[s];rn=i,jf(i,e)}Of(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Ya(8,t,t.return),Dr(t);break;case 22:s=t.stateNode,s._visibility&2&&(s._visibility&=-3,Dr(t));break;default:Dr(t)}e=e.sibling}}function jf(e,t){for(;rn!==null;){var s=rn;switch(s.tag){case 0:case 11:case 15:Ya(8,s,t);break;case 23:case 22:if(s.memoizedState!==null&&s.memoizedState.cachePool!==null){var i=s.memoizedState.cachePool.pool;i!=null&&i.refCount++}break;case 24:Xo(s.memoizedState.cache)}if(i=s.child,i!==null)i.return=s,rn=i;else e:for(s=e;rn!==null;){i=rn;var h=i.sibling,m=i.return;if(_f(i),i===s){rn=null;break e}if(h!==null){h.return=m,rn=h;break e}rn=m}}}var cb={getCacheForType:function(e){var t=hn(Kt),s=t.data.get(e);return s===void 0&&(s=e(),t.data.set(e,s)),s},cacheSignal:function(){return hn(Kt).controller.signal}},ub=typeof WeakMap=="function"?WeakMap:Map,vt=0,Mt=null,lt=null,ut=0,Et=0,jn=null,Va=!1,lo=!1,wu=!1,$a=0,Gt=0,Xa=0,Ss=0,ku=0,zn=0,co=0,di=null,Nn=null,Eu=!1,Nr=0,zf=0,Tr=1/0,Mr=null,Ja=null,an=0,Qa=null,uo=null,Da=0,Au=0,_u=null,Rf=null,hi=0,Su=null;function Rn(){return(vt&2)!==0&&ut!==0?ut&-ut:C.T!==null?Cu():ft()}function qf(){if(zn===0)if((ut&536870912)===0||ht){var e=Pe;Pe<<=1,(Pe&3932160)===0&&(Pe=262144),zn=e}else zn=536870912;return e=On.current,e!==null&&(e.flags|=32),zn}function Tn(e,t,s){(e===Mt&&(Et===2||Et===9)||e.cancelPendingCommit!==null)&&(ho(e,0),Za(e,ut,zn,!1)),I(e,s),((vt&2)===0||e!==Mt)&&(e===Mt&&((vt&2)===0&&(Ss|=s),Gt===4&&Za(e,ut,zn,!1)),ia(e))}function Ff(e,t,s){if((vt&6)!==0)throw Error(u(327));var i=!s&&(t&127)===0&&(t&e.expiredLanes)===0||zt(e,t),h=i?pb(e,t):Du(e,t,!0),m=i;do{if(h===0){lo&&!i&&Za(e,t,0,!1);break}else{if(s=e.current.alternate,m&&!db(s)){h=Du(e,t,!1),m=!1;continue}if(h===2){if(m=t,e.errorRecoveryDisabledLanes&m)var y=0;else y=e.pendingLanes&-536870913,y=y!==0?y:y&536870912?536870912:0;if(y!==0){t=y;e:{var A=e;h=di;var H=A.current.memoizedState.isDehydrated;if(H&&(ho(A,y).flags|=256),y=Du(A,y,!1),y!==2){if(wu&&!H){A.errorRecoveryDisabledLanes|=m,Ss|=m,h=4;break e}m=Nn,Nn=h,m!==null&&(Nn===null?Nn=m:Nn.push.apply(Nn,m))}h=y}if(m=!1,h!==2)continue}}if(h===1){ho(e,0),Za(e,t,0,!0);break}e:{switch(i=e,m=h,m){case 0:case 1:throw Error(u(345));case 4:if((t&4194048)!==t)break;case 6:Za(i,t,zn,!Va);break e;case 2:Nn=null;break;case 3:case 5:break;default:throw Error(u(329))}if((t&62914560)===t&&(h=Nr+300-qe(),10<h)){if(Za(i,t,zn,!Va),bt(i,0,!0)!==0)break e;Da=t,i.timeoutHandle=gm(Hf.bind(null,i,s,Nn,Mr,Eu,t,zn,Ss,co,Va,m,"Throttled",-0,0),h);break e}Hf(i,s,Nn,Mr,Eu,t,zn,Ss,co,Va,m,null,-0,0)}}break}while(!0);ia(e)}function Hf(e,t,s,i,h,m,y,A,H,se,me,ke,ie,le){if(e.timeoutHandle=-1,ke=t.subtreeFlags,ke&8192||(ke&16785408)===16785408){ke={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:pa},Cf(t,m,ke);var Le=(m&62914560)===m?Nr-qe():(m&4194048)===m?zf-qe():0;if(Le=Qb(ke,Le),Le!==null){Da=m,e.cancelPendingCommit=Le(Jf.bind(null,e,t,m,s,i,h,y,A,H,me,ke,null,ie,le)),Za(e,m,y,!se);return}}Jf(e,t,m,s,i,h,y,A,H)}function db(e){for(var t=e;;){var s=t.tag;if((s===0||s===11||s===15)&&t.flags&16384&&(s=t.updateQueue,s!==null&&(s=s.stores,s!==null)))for(var i=0;i<s.length;i++){var h=s[i],m=h.getSnapshot;h=h.value;try{if(!Mn(m(),h))return!1}catch{return!1}}if(s=t.child,t.subtreeFlags&16384&&s!==null)s.return=t,t=s;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function Za(e,t,s,i){t&=~ku,t&=~Ss,e.suspendedLanes|=t,e.pingedLanes&=~t,i&&(e.warmLanes|=t),i=e.expirationTimes;for(var h=t;0<h;){var m=31-un(h),y=1<<m;i[m]=-1,h&=~y}s!==0&&we(e,s,t)}function Cr(){return(vt&6)===0?(pi(0),!1):!0}function $u(){if(lt!==null){if(Et===0)var e=lt.return;else e=lt,ya=ys=null,Pc(e),to=null,Qo=0,e=lt;for(;e!==null;)yf(e.alternate,e),e=e.return;lt=null}}function ho(e,t){var s=e.timeoutHandle;s!==-1&&(e.timeoutHandle=-1,Mb(s)),s=e.cancelPendingCommit,s!==null&&(e.cancelPendingCommit=null,s()),Da=0,$u(),Mt=e,lt=s=ma(e.current,null),ut=t,Et=0,jn=null,Va=!1,lo=zt(e,t),wu=!1,co=zn=ku=Ss=Xa=Gt=0,Nn=di=null,Eu=!1,(t&8)!==0&&(t|=t&32);var i=e.entangledLanes;if(i!==0)for(e=e.entanglements,i&=t;0<i;){var h=31-un(i),m=1<<h;t|=e[h],i&=~m}return $a=t,Ii(),s}function Lf(e,t){tt=null,C.H=ai,t===eo||t===rr?(t=np(),Et=3):t===Mc?(t=np(),Et=4):Et=t===ou?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,jn=t,lt===null&&(Gt=1,wr(e,Pn(t,e.current)))}function Uf(){var e=On.current;return e===null?!0:(ut&4194048)===ut?Xn===null:(ut&62914560)===ut||(ut&536870912)!==0?e===Xn:!1}function Pf(){var e=C.H;return C.H=ai,e===null?ai:e}function Gf(){var e=C.A;return C.A=cb,e}function Or(){Gt=4,Va||(ut&4194048)!==ut&&On.current!==null||(lo=!0),(Xa&134217727)===0&&(Ss&134217727)===0||Mt===null||Za(Mt,ut,zn,!1)}function Du(e,t,s){var i=vt;vt|=2;var h=Pf(),m=Gf();(Mt!==e||ut!==t)&&(Mr=null,ho(e,t)),t=!1;var y=Gt;e:do try{if(Et!==0&&lt!==null){var A=lt,H=jn;switch(Et){case 8:$u(),y=6;break e;case 3:case 2:case 9:case 6:On.current===null&&(t=!0);var se=Et;if(Et=0,jn=null,po(e,A,H,se),s&&lo){y=0;break e}break;default:se=Et,Et=0,jn=null,po(e,A,H,se)}}hb(),y=Gt;break}catch(me){Lf(e,me)}while(!0);return t&&e.shellSuspendCounter++,ya=ys=null,vt=i,C.H=h,C.A=m,lt===null&&(Mt=null,ut=0,Ii()),y}function hb(){for(;lt!==null;)Yf(lt)}function pb(e,t){var s=vt;vt|=2;var i=Pf(),h=Gf();Mt!==e||ut!==t?(Mr=null,Tr=qe()+500,ho(e,t)):lo=zt(e,t);e:do try{if(Et!==0&&lt!==null){t=lt;var m=jn;t:switch(Et){case 1:Et=0,jn=null,po(e,t,m,1);break;case 2:case 9:if(ep(m)){Et=0,jn=null,Vf(t);break}t=function(){Et!==2&&Et!==9||Mt!==e||(Et=7),ia(e)},m.then(t,t);break e;case 3:Et=7;break e;case 4:Et=5;break e;case 7:ep(m)?(Et=0,jn=null,Vf(t)):(Et=0,jn=null,po(e,t,m,7));break;case 5:var y=null;switch(lt.tag){case 26:y=lt.memoizedState;case 5:case 27:var A=lt;if(y?Mm(y):A.stateNode.complete){Et=0,jn=null;var H=A.sibling;if(H!==null)lt=H;else{var se=A.return;se!==null?(lt=se,Br(se)):lt=null}break t}}Et=0,jn=null,po(e,t,m,5);break;case 6:Et=0,jn=null,po(e,t,m,6);break;case 8:$u(),Gt=6;break e;default:throw Error(u(462))}}fb();break}catch(me){Lf(e,me)}while(!0);return ya=ys=null,C.H=i,C.A=h,vt=s,lt!==null?0:(Mt=null,ut=0,Ii(),Gt)}function fb(){for(;lt!==null&&!_e();)Yf(lt)}function Yf(e){var t=mf(e.alternate,e,$a);e.memoizedProps=e.pendingProps,t===null?Br(e):lt=t}function Vf(e){var t=e,s=t.alternate;switch(t.tag){case 15:case 0:t=cf(s,t,t.pendingProps,t.type,void 0,ut);break;case 11:t=cf(s,t,t.pendingProps,t.type.render,t.ref,ut);break;case 5:Pc(t);default:yf(s,t),t=lt=Ph(t,$a),t=mf(s,t,$a)}e.memoizedProps=e.pendingProps,t===null?Br(e):lt=t}function po(e,t,s,i){ya=ys=null,Pc(t),to=null,Qo=0;var h=t.return;try{if(nb(e,h,t,s,ut)){Gt=1,wr(e,Pn(s,e.current)),lt=null;return}}catch(m){if(h!==null)throw lt=h,m;Gt=1,wr(e,Pn(s,e.current)),lt=null;return}t.flags&32768?(ht||i===1?e=!0:lo||(ut&536870912)!==0?e=!1:(Va=e=!0,(i===2||i===9||i===3||i===6)&&(i=On.current,i!==null&&i.tag===13&&(i.flags|=16384))),Xf(t,e)):Br(t)}function Br(e){var t=e;do{if((t.flags&32768)!==0){Xf(t,Va);return}e=t.return;var s=ob(t.alternate,t,$a);if(s!==null){lt=s;return}if(t=t.sibling,t!==null){lt=t;return}lt=t=e}while(t!==null);Gt===0&&(Gt=5)}function Xf(e,t){do{var s=ib(e.alternate,e);if(s!==null){s.flags&=32767,lt=s;return}if(s=e.return,s!==null&&(s.flags|=32768,s.subtreeFlags=0,s.deletions=null),!t&&(e=e.sibling,e!==null)){lt=e;return}lt=e=s}while(e!==null);Gt=6,lt=null}function Jf(e,t,s,i,h,m,y,A,H){e.cancelPendingCommit=null;do jr();while(an!==0);if((vt&6)!==0)throw Error(u(327));if(t!==null){if(t===e.current)throw Error(u(177));if(m=t.lanes|t.childLanes,m|=gc,ge(e,s,m,y,A,H),e===Mt&&(lt=Mt=null,ut=0),uo=t,Qa=e,Da=s,Au=m,_u=h,Rf=i,(t.subtreeFlags&10256)!==0||(t.flags&10256)!==0?(e.callbackNode=null,e.callbackPriority=0,bb(rt,function(){return If(),null})):(e.callbackNode=null,e.callbackPriority=0),i=(t.flags&13878)!==0,(t.subtreeFlags&13878)!==0||i){i=C.T,C.T=null,h=S.p,S.p=2,y=vt,vt|=4;try{rb(e,t,s)}finally{vt=y,S.p=h,C.T=i}}an=1,Qf(),Zf(),Kf()}}function Qf(){if(an===1){an=0;var e=Qa,t=uo,s=(t.flags&13878)!==0;if((t.subtreeFlags&13878)!==0||s){s=C.T,C.T=null;var i=S.p;S.p=2;var h=vt;vt|=4;try{Nf(t,e);var m=Hu,y=Bh(e.containerInfo),A=m.focusedElem,H=m.selectionRange;if(y!==A&&A&&A.ownerDocument&&Oh(A.ownerDocument.documentElement,A)){if(H!==null&&dc(A)){var se=H.start,me=H.end;if(me===void 0&&(me=se),"selectionStart"in A)A.selectionStart=se,A.selectionEnd=Math.min(me,A.value.length);else{var ke=A.ownerDocument||document,ie=ke&&ke.defaultView||window;if(ie.getSelection){var le=ie.getSelection(),Le=A.textContent.length,Qe=Math.min(H.start,Le),Dt=H.end===void 0?Qe:Math.min(H.end,Le);!le.extend&&Qe>Dt&&(y=Dt,Dt=Qe,Qe=y);var ee=Ch(A,Qe),J=Ch(A,Dt);if(ee&&J&&(le.rangeCount!==1||le.anchorNode!==ee.node||le.anchorOffset!==ee.offset||le.focusNode!==J.node||le.focusOffset!==J.offset)){var ae=ke.createRange();ae.setStart(ee.node,ee.offset),le.removeAllRanges(),Qe>Dt?(le.addRange(ae),le.extend(J.node,J.offset)):(ae.setEnd(J.node,J.offset),le.addRange(ae))}}}}for(ke=[],le=A;le=le.parentNode;)le.nodeType===1&&ke.push({element:le,left:le.scrollLeft,top:le.scrollTop});for(typeof A.focus=="function"&&A.focus(),A=0;A<ke.length;A++){var xe=ke[A];xe.element.scrollLeft=xe.left,xe.element.scrollTop=xe.top}}Xr=!!Fu,Hu=Fu=null}finally{vt=h,S.p=i,C.T=s}}e.current=t,an=2}}function Zf(){if(an===2){an=0;var e=Qa,t=uo,s=(t.flags&8772)!==0;if((t.subtreeFlags&8772)!==0||s){s=C.T,C.T=null;var i=S.p;S.p=2;var h=vt;vt|=4;try{Af(e,t.alternate,t)}finally{vt=h,S.p=i,C.T=s}}an=3}}function Kf(){if(an===4||an===3){an=0,je();var e=Qa,t=uo,s=Da,i=Rf;(t.subtreeFlags&10256)!==0||(t.flags&10256)!==0?an=5:(an=0,uo=Qa=null,Wf(e,e.pendingLanes));var h=e.pendingLanes;if(h===0&&(Ja=null),Ve(s),t=t.stateNode,Xt&&typeof Xt.onCommitFiberRoot=="function")try{Xt.onCommitFiberRoot(cn,t,void 0,(t.current.flags&128)===128)}catch{}if(i!==null){t=C.T,h=S.p,S.p=2,C.T=null;try{for(var m=e.onRecoverableError,y=0;y<i.length;y++){var A=i[y];m(A.value,{componentStack:A.stack})}}finally{C.T=t,S.p=h}}(Da&3)!==0&&jr(),ia(e),h=e.pendingLanes,(s&261930)!==0&&(h&42)!==0?e===Su?hi++:(hi=0,Su=e):hi=0,pi(0)}}function Wf(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,Xo(t)))}function jr(){return Qf(),Zf(),Kf(),If()}function If(){if(an!==5)return!1;var e=Qa,t=Au;Au=0;var s=Ve(Da),i=C.T,h=S.p;try{S.p=32>s?32:s,C.T=null,s=_u,_u=null;var m=Qa,y=Da;if(an=0,uo=Qa=null,Da=0,(vt&6)!==0)throw Error(u(331));var A=vt;if(vt|=4,Bf(m.current),Mf(m,m.current,y,s),vt=A,pi(0,!1),Xt&&typeof Xt.onPostCommitFiberRoot=="function")try{Xt.onPostCommitFiberRoot(cn,m)}catch{}return!0}finally{S.p=h,C.T=i,Wf(e,t)}}function em(e,t,s){t=Pn(s,t),t=su(e.stateNode,t,2),e=Ua(e,t,2),e!==null&&(I(e,2),ia(e))}function At(e,t,s){if(e.tag===3)em(e,e,s);else for(;t!==null;){if(t.tag===3){em(t,e,s);break}else if(t.tag===1){var i=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(Ja===null||!Ja.has(i))){e=Pn(s,e),s=ef(2),i=Ua(t,s,2),i!==null&&(tf(s,i,t,e),I(i,2),ia(i));break}}t=t.return}}function Nu(e,t,s){var i=e.pingCache;if(i===null){i=e.pingCache=new ub;var h=new Set;i.set(t,h)}else h=i.get(t),h===void 0&&(h=new Set,i.set(t,h));h.has(s)||(wu=!0,h.add(s),e=mb.bind(null,e,t,s),t.then(e,e))}function mb(e,t,s){var i=e.pingCache;i!==null&&i.delete(t),e.pingedLanes|=e.suspendedLanes&s,e.warmLanes&=~s,Mt===e&&(ut&s)===s&&(Gt===4||Gt===3&&(ut&62914560)===ut&&300>qe()-Nr?(vt&2)===0&&ho(e,0):ku|=s,co===ut&&(co=0)),ia(e)}function tm(e,t){t===0&&(t=O()),e=fs(e,t),e!==null&&(I(e,t),ia(e))}function gb(e){var t=e.memoizedState,s=0;t!==null&&(s=t.retryLane),tm(e,s)}function yb(e,t){var s=0;switch(e.tag){case 31:case 13:var i=e.stateNode,h=e.memoizedState;h!==null&&(s=h.retryLane);break;case 19:i=e.stateNode;break;case 22:i=e.stateNode._retryCache;break;default:throw Error(u(314))}i!==null&&i.delete(t),tm(e,s)}function bb(e,t){return Be(e,t)}var zr=null,fo=null,Tu=!1,Rr=!1,Mu=!1,Ka=0;function ia(e){e!==fo&&e.next===null&&(fo===null?zr=fo=e:fo=fo.next=e),Rr=!0,Tu||(Tu=!0,xb())}function pi(e,t){if(!Mu&&Rr){Mu=!0;do for(var s=!1,i=zr;i!==null;){if(e!==0){var h=i.pendingLanes;if(h===0)var m=0;else{var y=i.suspendedLanes,A=i.pingedLanes;m=(1<<31-un(42|e)+1)-1,m&=h&~(y&~A),m=m&201326741?m&201326741|1:m?m|2:0}m!==0&&(s=!0,om(i,m))}else m=ut,m=bt(i,i===Mt?m:0,i.cancelPendingCommit!==null||i.timeoutHandle!==-1),(m&3)===0||zt(i,m)||(s=!0,om(i,m));i=i.next}while(s);Mu=!1}}function vb(){nm()}function nm(){Rr=Tu=!1;var e=0;Ka!==0&&Tb()&&(e=Ka);for(var t=qe(),s=null,i=zr;i!==null;){var h=i.next,m=am(i,t);m===0?(i.next=null,s===null?zr=h:s.next=h,h===null&&(fo=s)):(s=i,(e!==0||(m&3)!==0)&&(Rr=!0)),i=h}an!==0&&an!==5||pi(e),Ka!==0&&(Ka=0)}function am(e,t){for(var s=e.suspendedLanes,i=e.pingedLanes,h=e.expirationTimes,m=e.pendingLanes&-62914561;0<m;){var y=31-un(m),A=1<<y,H=h[y];H===-1?((A&s)===0||(A&i)!==0)&&(h[y]=Fn(A,t)):H<=t&&(e.expiredLanes|=A),m&=~A}if(t=Mt,s=ut,s=bt(e,e===t?s:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i=e.callbackNode,s===0||e===t&&(Et===2||Et===9)||e.cancelPendingCommit!==null)return i!==null&&i!==null&&Ae(i),e.callbackNode=null,e.callbackPriority=0;if((s&3)===0||zt(e,s)){if(t=s&-s,t===e.callbackPriority)return t;switch(i!==null&&Ae(i),Ve(s)){case 2:case 8:s=Ut;break;case 32:s=rt;break;case 268435456:s=Zt;break;default:s=rt}return i=sm.bind(null,e),s=Be(s,i),e.callbackPriority=t,e.callbackNode=s,t}return i!==null&&i!==null&&Ae(i),e.callbackPriority=2,e.callbackNode=null,2}function sm(e,t){if(an!==0&&an!==5)return e.callbackNode=null,e.callbackPriority=0,null;var s=e.callbackNode;if(jr()&&e.callbackNode!==s)return null;var i=ut;return i=bt(e,e===Mt?i:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i===0?null:(Ff(e,i,t),am(e,qe()),e.callbackNode!=null&&e.callbackNode===s?sm.bind(null,e):null)}function om(e,t){if(jr())return null;Ff(e,t,!0)}function xb(){Cb(function(){(vt&6)!==0?Be(_t,vb):nm()})}function Cu(){if(Ka===0){var e=Ws;e===0&&(e=Je,Je<<=1,(Je&261888)===0&&(Je=256)),Ka=e}return Ka}function im(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:Yi(""+e)}function rm(e,t){var s=t.ownerDocument.createElement("input");return s.name=t.name,s.value=t.value,e.id&&s.setAttribute("form",e.id),t.parentNode.insertBefore(s,t),e=new FormData(e),s.parentNode.removeChild(s),e}function wb(e,t,s,i,h){if(t==="submit"&&s&&s.stateNode===h){var m=im((h[bn]||null).action),y=i.submitter;y&&(t=(t=y[bn]||null)?im(t.formAction):y.getAttribute("formAction"),t!==null&&(m=t,y=null));var A=new Qi("action","action",null,i,h);e.push({event:A,listeners:[{instance:null,listener:function(){if(i.defaultPrevented){if(Ka!==0){var H=y?rm(h,y):new FormData(h);Wc(s,{pending:!0,data:H,method:h.method,action:m},null,H)}}else typeof m=="function"&&(A.preventDefault(),H=y?rm(h,y):new FormData(h),Wc(s,{pending:!0,data:H,method:h.method,action:m},m,H))},currentTarget:h}]})}}for(var Ou=0;Ou<mc.length;Ou++){var Bu=mc[Ou],kb=Bu.toLowerCase(),Eb=Bu[0].toUpperCase()+Bu.slice(1);In(kb,"on"+Eb)}In(Rh,"onAnimationEnd"),In(qh,"onAnimationIteration"),In(Fh,"onAnimationStart"),In("dblclick","onDoubleClick"),In("focusin","onFocus"),In("focusout","onBlur"),In(Fy,"onTransitionRun"),In(Hy,"onTransitionStart"),In(Ly,"onTransitionCancel"),In(Hh,"onTransitionEnd"),qs("onMouseEnter",["mouseout","mouseover"]),qs("onMouseLeave",["mouseout","mouseover"]),qs("onPointerEnter",["pointerout","pointerover"]),qs("onPointerLeave",["pointerout","pointerover"]),us("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),us("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),us("onBeforeInput",["compositionend","keypress","textInput","paste"]),us("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),us("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),us("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var fi="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Ab=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(fi));function lm(e,t){t=(t&4)!==0;for(var s=0;s<e.length;s++){var i=e[s],h=i.event;i=i.listeners;e:{var m=void 0;if(t)for(var y=i.length-1;0<=y;y--){var A=i[y],H=A.instance,se=A.currentTarget;if(A=A.listener,H!==m&&h.isPropagationStopped())break e;m=A,h.currentTarget=se;try{m(h)}catch(me){Wi(me)}h.currentTarget=null,m=H}else for(y=0;y<i.length;y++){if(A=i[y],H=A.instance,se=A.currentTarget,A=A.listener,H!==m&&h.isPropagationStopped())break e;m=A,h.currentTarget=se;try{m(h)}catch(me){Wi(me)}h.currentTarget=null,m=H}}}}function ct(e,t){var s=t[Xl];s===void 0&&(s=t[Xl]=new Set);var i=e+"__bubble";s.has(i)||(cm(t,e,2,!1),s.add(i))}function ju(e,t,s){var i=0;t&&(i|=4),cm(s,e,i,t)}var qr="_reactListening"+Math.random().toString(36).slice(2);function zu(e){if(!e[qr]){e[qr]=!0,th.forEach(function(s){s!=="selectionchange"&&(Ab.has(s)||ju(s,!1,e),ju(s,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[qr]||(t[qr]=!0,ju("selectionchange",!1,t))}}function cm(e,t,s,i){switch(qm(t)){case 2:var h=Wb;break;case 8:h=Ib;break;default:h=Ku}s=h.bind(null,t,s,e),h=void 0,!nc||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(h=!0),i?h!==void 0?e.addEventListener(t,s,{capture:!0,passive:h}):e.addEventListener(t,s,!0):h!==void 0?e.addEventListener(t,s,{passive:h}):e.addEventListener(t,s,!1)}function Ru(e,t,s,i,h){var m=i;if((t&1)===0&&(t&2)===0&&i!==null)e:for(;;){if(i===null)return;var y=i.tag;if(y===3||y===4){var A=i.stateNode.containerInfo;if(A===h)break;if(y===4)for(y=i.return;y!==null;){var H=y.tag;if((H===3||H===4)&&y.stateNode.containerInfo===h)return;y=y.return}for(;A!==null;){if(y=js(A),y===null)return;if(H=y.tag,H===5||H===6||H===26||H===27){i=m=y;continue e}A=A.parentNode}}i=i.return}ph(function(){var se=m,me=ec(s),ke=[];e:{var ie=Lh.get(e);if(ie!==void 0){var le=Qi,Le=e;switch(e){case"keypress":if(Xi(s)===0)break e;case"keydown":case"keyup":le=yy;break;case"focusin":Le="focus",le=ic;break;case"focusout":Le="blur",le=ic;break;case"beforeblur":case"afterblur":le=ic;break;case"click":if(s.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":le=gh;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":le=oy;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":le=xy;break;case Rh:case qh:case Fh:le=ly;break;case Hh:le=ky;break;case"scroll":case"scrollend":le=ay;break;case"wheel":le=Ay;break;case"copy":case"cut":case"paste":le=uy;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":le=bh;break;case"toggle":case"beforetoggle":le=Sy}var Qe=(t&4)!==0,Dt=!Qe&&(e==="scroll"||e==="scrollend"),ee=Qe?ie!==null?ie+"Capture":null:ie;Qe=[];for(var J=se,ae;J!==null;){var xe=J;if(ae=xe.stateNode,xe=xe.tag,xe!==5&&xe!==26&&xe!==27||ae===null||ee===null||(xe=zo(J,ee),xe!=null&&Qe.push(mi(J,xe,ae))),Dt)break;J=J.return}0<Qe.length&&(ie=new le(ie,Le,null,s,me),ke.push({event:ie,listeners:Qe}))}}if((t&7)===0){e:{if(ie=e==="mouseover"||e==="pointerover",le=e==="mouseout"||e==="pointerout",ie&&s!==Il&&(Le=s.relatedTarget||s.fromElement)&&(js(Le)||Le[Bs]))break e;if((le||ie)&&(ie=me.window===me?me:(ie=me.ownerDocument)?ie.defaultView||ie.parentWindow:window,le?(Le=s.relatedTarget||s.toElement,le=se,Le=Le?js(Le):null,Le!==null&&(Dt=a(Le),Qe=Le.tag,Le!==Dt||Qe!==5&&Qe!==27&&Qe!==6)&&(Le=null)):(le=null,Le=se),le!==Le)){if(Qe=gh,xe="onMouseLeave",ee="onMouseEnter",J="mouse",(e==="pointerout"||e==="pointerover")&&(Qe=bh,xe="onPointerLeave",ee="onPointerEnter",J="pointer"),Dt=le==null?ie:jo(le),ae=Le==null?ie:jo(Le),ie=new Qe(xe,J+"leave",le,s,me),ie.target=Dt,ie.relatedTarget=ae,xe=null,js(me)===se&&(Qe=new Qe(ee,J+"enter",Le,s,me),Qe.target=ae,Qe.relatedTarget=Dt,xe=Qe),Dt=xe,le&&Le)t:{for(Qe=_b,ee=le,J=Le,ae=0,xe=ee;xe;xe=Qe(xe))ae++;xe=0;for(var Xe=J;Xe;Xe=Qe(Xe))xe++;for(;0<ae-xe;)ee=Qe(ee),ae--;for(;0<xe-ae;)J=Qe(J),xe--;for(;ae--;){if(ee===J||J!==null&&ee===J.alternate){Qe=ee;break t}ee=Qe(ee),J=Qe(J)}Qe=null}else Qe=null;le!==null&&um(ke,ie,le,Qe,!1),Le!==null&&Dt!==null&&um(ke,Dt,Le,Qe,!0)}}e:{if(ie=se?jo(se):window,le=ie.nodeName&&ie.nodeName.toLowerCase(),le==="select"||le==="input"&&ie.type==="file")var gt=Sh;else if(Ah(ie))if($h)gt=zy;else{gt=By;var Ue=Oy}else le=ie.nodeName,!le||le.toLowerCase()!=="input"||ie.type!=="checkbox"&&ie.type!=="radio"?se&&Wl(se.elementType)&&(gt=Sh):gt=jy;if(gt&&(gt=gt(e,se))){_h(ke,gt,s,me);break e}Ue&&Ue(e,ie,se),e==="focusout"&&se&&ie.type==="number"&&se.memoizedProps.value!=null&&Kl(ie,"number",ie.value)}switch(Ue=se?jo(se):window,e){case"focusin":(Ah(Ue)||Ue.contentEditable==="true")&&(Gs=Ue,hc=se,Go=null);break;case"focusout":Go=hc=Gs=null;break;case"mousedown":pc=!0;break;case"contextmenu":case"mouseup":case"dragend":pc=!1,jh(ke,s,me);break;case"selectionchange":if(qy)break;case"keydown":case"keyup":jh(ke,s,me)}var at;if(lc)e:{switch(e){case"compositionstart":var dt="onCompositionStart";break e;case"compositionend":dt="onCompositionEnd";break e;case"compositionupdate":dt="onCompositionUpdate";break e}dt=void 0}else Ps?kh(e,s)&&(dt="onCompositionEnd"):e==="keydown"&&s.keyCode===229&&(dt="onCompositionStart");dt&&(vh&&s.locale!=="ko"&&(Ps||dt!=="onCompositionStart"?dt==="onCompositionEnd"&&Ps&&(at=fh()):(ja=me,ac="value"in ja?ja.value:ja.textContent,Ps=!0)),Ue=Fr(se,dt),0<Ue.length&&(dt=new yh(dt,e,null,s,me),ke.push({event:dt,listeners:Ue}),at?dt.data=at:(at=Eh(s),at!==null&&(dt.data=at)))),(at=Dy?Ny(e,s):Ty(e,s))&&(dt=Fr(se,"onBeforeInput"),0<dt.length&&(Ue=new yh("onBeforeInput","beforeinput",null,s,me),ke.push({event:Ue,listeners:dt}),Ue.data=at)),wb(ke,e,se,s,me)}lm(ke,t)})}function mi(e,t,s){return{instance:e,listener:t,currentTarget:s}}function Fr(e,t){for(var s=t+"Capture",i=[];e!==null;){var h=e,m=h.stateNode;if(h=h.tag,h!==5&&h!==26&&h!==27||m===null||(h=zo(e,s),h!=null&&i.unshift(mi(e,h,m)),h=zo(e,t),h!=null&&i.push(mi(e,h,m))),e.tag===3)return i;e=e.return}return[]}function _b(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function um(e,t,s,i,h){for(var m=t._reactName,y=[];s!==null&&s!==i;){var A=s,H=A.alternate,se=A.stateNode;if(A=A.tag,H!==null&&H===i)break;A!==5&&A!==26&&A!==27||se===null||(H=se,h?(se=zo(s,m),se!=null&&y.unshift(mi(s,se,H))):h||(se=zo(s,m),se!=null&&y.push(mi(s,se,H)))),s=s.return}y.length!==0&&e.push({event:t,listeners:y})}var Sb=/\r\n?/g,$b=/\u0000|\uFFFD/g;function dm(e){return(typeof e=="string"?e:""+e).replace(Sb,`
`).replace($b,"")}function hm(e,t){return t=dm(t),dm(e)===t}function $t(e,t,s,i,h,m){switch(s){case"children":typeof i=="string"?t==="body"||t==="textarea"&&i===""||Hs(e,i):(typeof i=="number"||typeof i=="bigint")&&t!=="body"&&Hs(e,""+i);break;case"className":Pi(e,"class",i);break;case"tabIndex":Pi(e,"tabindex",i);break;case"dir":case"role":case"viewBox":case"width":case"height":Pi(e,s,i);break;case"style":dh(e,i,m);break;case"data":if(t!=="object"){Pi(e,"data",i);break}case"src":case"href":if(i===""&&(t!=="a"||s!=="href")){e.removeAttribute(s);break}if(i==null||typeof i=="function"||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(s);break}i=Yi(""+i),e.setAttribute(s,i);break;case"action":case"formAction":if(typeof i=="function"){e.setAttribute(s,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof m=="function"&&(s==="formAction"?(t!=="input"&&$t(e,t,"name",h.name,h,null),$t(e,t,"formEncType",h.formEncType,h,null),$t(e,t,"formMethod",h.formMethod,h,null),$t(e,t,"formTarget",h.formTarget,h,null)):($t(e,t,"encType",h.encType,h,null),$t(e,t,"method",h.method,h,null),$t(e,t,"target",h.target,h,null)));if(i==null||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(s);break}i=Yi(""+i),e.setAttribute(s,i);break;case"onClick":i!=null&&(e.onclick=pa);break;case"onScroll":i!=null&&ct("scroll",e);break;case"onScrollEnd":i!=null&&ct("scrollend",e);break;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(u(61));if(s=i.__html,s!=null){if(h.children!=null)throw Error(u(60));e.innerHTML=s}}break;case"multiple":e.multiple=i&&typeof i!="function"&&typeof i!="symbol";break;case"muted":e.muted=i&&typeof i!="function"&&typeof i!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(i==null||typeof i=="function"||typeof i=="boolean"||typeof i=="symbol"){e.removeAttribute("xlink:href");break}s=Yi(""+i),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",s);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(s,""+i):e.removeAttribute(s);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":i&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(s,""):e.removeAttribute(s);break;case"capture":case"download":i===!0?e.setAttribute(s,""):i!==!1&&i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(s,i):e.removeAttribute(s);break;case"cols":case"rows":case"size":case"span":i!=null&&typeof i!="function"&&typeof i!="symbol"&&!isNaN(i)&&1<=i?e.setAttribute(s,i):e.removeAttribute(s);break;case"rowSpan":case"start":i==null||typeof i=="function"||typeof i=="symbol"||isNaN(i)?e.removeAttribute(s):e.setAttribute(s,i);break;case"popover":ct("beforetoggle",e),ct("toggle",e),Ui(e,"popover",i);break;case"xlinkActuate":ha(e,"http://www.w3.org/1999/xlink","xlink:actuate",i);break;case"xlinkArcrole":ha(e,"http://www.w3.org/1999/xlink","xlink:arcrole",i);break;case"xlinkRole":ha(e,"http://www.w3.org/1999/xlink","xlink:role",i);break;case"xlinkShow":ha(e,"http://www.w3.org/1999/xlink","xlink:show",i);break;case"xlinkTitle":ha(e,"http://www.w3.org/1999/xlink","xlink:title",i);break;case"xlinkType":ha(e,"http://www.w3.org/1999/xlink","xlink:type",i);break;case"xmlBase":ha(e,"http://www.w3.org/XML/1998/namespace","xml:base",i);break;case"xmlLang":ha(e,"http://www.w3.org/XML/1998/namespace","xml:lang",i);break;case"xmlSpace":ha(e,"http://www.w3.org/XML/1998/namespace","xml:space",i);break;case"is":Ui(e,"is",i);break;case"innerText":case"textContent":break;default:(!(2<s.length)||s[0]!=="o"&&s[0]!=="O"||s[1]!=="n"&&s[1]!=="N")&&(s=ty.get(s)||s,Ui(e,s,i))}}function qu(e,t,s,i,h,m){switch(s){case"style":dh(e,i,m);break;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(u(61));if(s=i.__html,s!=null){if(h.children!=null)throw Error(u(60));e.innerHTML=s}}break;case"children":typeof i=="string"?Hs(e,i):(typeof i=="number"||typeof i=="bigint")&&Hs(e,""+i);break;case"onScroll":i!=null&&ct("scroll",e);break;case"onScrollEnd":i!=null&&ct("scrollend",e);break;case"onClick":i!=null&&(e.onclick=pa);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!nh.hasOwnProperty(s))e:{if(s[0]==="o"&&s[1]==="n"&&(h=s.endsWith("Capture"),t=s.slice(2,h?s.length-7:void 0),m=e[bn]||null,m=m!=null?m[s]:null,typeof m=="function"&&e.removeEventListener(t,m,h),typeof i=="function")){typeof m!="function"&&m!==null&&(s in e?e[s]=null:e.hasAttribute(s)&&e.removeAttribute(s)),e.addEventListener(t,i,h);break e}s in e?e[s]=i:i===!0?e.setAttribute(s,""):Ui(e,s,i)}}}function fn(e,t,s){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":ct("error",e),ct("load",e);var i=!1,h=!1,m;for(m in s)if(s.hasOwnProperty(m)){var y=s[m];if(y!=null)switch(m){case"src":i=!0;break;case"srcSet":h=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(u(137,t));default:$t(e,t,m,y,s,null)}}h&&$t(e,t,"srcSet",s.srcSet,s,null),i&&$t(e,t,"src",s.src,s,null);return;case"input":ct("invalid",e);var A=m=y=h=null,H=null,se=null;for(i in s)if(s.hasOwnProperty(i)){var me=s[i];if(me!=null)switch(i){case"name":h=me;break;case"type":y=me;break;case"checked":H=me;break;case"defaultChecked":se=me;break;case"value":m=me;break;case"defaultValue":A=me;break;case"children":case"dangerouslySetInnerHTML":if(me!=null)throw Error(u(137,t));break;default:$t(e,t,i,me,s,null)}}rh(e,m,A,H,se,y,h,!1);return;case"select":ct("invalid",e),i=y=m=null;for(h in s)if(s.hasOwnProperty(h)&&(A=s[h],A!=null))switch(h){case"value":m=A;break;case"defaultValue":y=A;break;case"multiple":i=A;default:$t(e,t,h,A,s,null)}t=m,s=y,e.multiple=!!i,t!=null?Fs(e,!!i,t,!1):s!=null&&Fs(e,!!i,s,!0);return;case"textarea":ct("invalid",e),m=h=i=null;for(y in s)if(s.hasOwnProperty(y)&&(A=s[y],A!=null))switch(y){case"value":i=A;break;case"defaultValue":h=A;break;case"children":m=A;break;case"dangerouslySetInnerHTML":if(A!=null)throw Error(u(91));break;default:$t(e,t,y,A,s,null)}ch(e,i,h,m);return;case"option":for(H in s)s.hasOwnProperty(H)&&(i=s[H],i!=null)&&(H==="selected"?e.selected=i&&typeof i!="function"&&typeof i!="symbol":$t(e,t,H,i,s,null));return;case"dialog":ct("beforetoggle",e),ct("toggle",e),ct("cancel",e),ct("close",e);break;case"iframe":case"object":ct("load",e);break;case"video":case"audio":for(i=0;i<fi.length;i++)ct(fi[i],e);break;case"image":ct("error",e),ct("load",e);break;case"details":ct("toggle",e);break;case"embed":case"source":case"link":ct("error",e),ct("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(se in s)if(s.hasOwnProperty(se)&&(i=s[se],i!=null))switch(se){case"children":case"dangerouslySetInnerHTML":throw Error(u(137,t));default:$t(e,t,se,i,s,null)}return;default:if(Wl(t)){for(me in s)s.hasOwnProperty(me)&&(i=s[me],i!==void 0&&qu(e,t,me,i,s,void 0));return}}for(A in s)s.hasOwnProperty(A)&&(i=s[A],i!=null&&$t(e,t,A,i,s,null))}function Db(e,t,s,i){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var h=null,m=null,y=null,A=null,H=null,se=null,me=null;for(le in s){var ke=s[le];if(s.hasOwnProperty(le)&&ke!=null)switch(le){case"checked":break;case"value":break;case"defaultValue":H=ke;default:i.hasOwnProperty(le)||$t(e,t,le,null,i,ke)}}for(var ie in i){var le=i[ie];if(ke=s[ie],i.hasOwnProperty(ie)&&(le!=null||ke!=null))switch(ie){case"type":m=le;break;case"name":h=le;break;case"checked":se=le;break;case"defaultChecked":me=le;break;case"value":y=le;break;case"defaultValue":A=le;break;case"children":case"dangerouslySetInnerHTML":if(le!=null)throw Error(u(137,t));break;default:le!==ke&&$t(e,t,ie,le,i,ke)}}Zl(e,y,A,H,se,me,m,h);return;case"select":le=y=A=ie=null;for(m in s)if(H=s[m],s.hasOwnProperty(m)&&H!=null)switch(m){case"value":break;case"multiple":le=H;default:i.hasOwnProperty(m)||$t(e,t,m,null,i,H)}for(h in i)if(m=i[h],H=s[h],i.hasOwnProperty(h)&&(m!=null||H!=null))switch(h){case"value":ie=m;break;case"defaultValue":A=m;break;case"multiple":y=m;default:m!==H&&$t(e,t,h,m,i,H)}t=A,s=y,i=le,ie!=null?Fs(e,!!s,ie,!1):!!i!=!!s&&(t!=null?Fs(e,!!s,t,!0):Fs(e,!!s,s?[]:"",!1));return;case"textarea":le=ie=null;for(A in s)if(h=s[A],s.hasOwnProperty(A)&&h!=null&&!i.hasOwnProperty(A))switch(A){case"value":break;case"children":break;default:$t(e,t,A,null,i,h)}for(y in i)if(h=i[y],m=s[y],i.hasOwnProperty(y)&&(h!=null||m!=null))switch(y){case"value":ie=h;break;case"defaultValue":le=h;break;case"children":break;case"dangerouslySetInnerHTML":if(h!=null)throw Error(u(91));break;default:h!==m&&$t(e,t,y,h,i,m)}lh(e,ie,le);return;case"option":for(var Le in s)ie=s[Le],s.hasOwnProperty(Le)&&ie!=null&&!i.hasOwnProperty(Le)&&(Le==="selected"?e.selected=!1:$t(e,t,Le,null,i,ie));for(H in i)ie=i[H],le=s[H],i.hasOwnProperty(H)&&ie!==le&&(ie!=null||le!=null)&&(H==="selected"?e.selected=ie&&typeof ie!="function"&&typeof ie!="symbol":$t(e,t,H,ie,i,le));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var Qe in s)ie=s[Qe],s.hasOwnProperty(Qe)&&ie!=null&&!i.hasOwnProperty(Qe)&&$t(e,t,Qe,null,i,ie);for(se in i)if(ie=i[se],le=s[se],i.hasOwnProperty(se)&&ie!==le&&(ie!=null||le!=null))switch(se){case"children":case"dangerouslySetInnerHTML":if(ie!=null)throw Error(u(137,t));break;default:$t(e,t,se,ie,i,le)}return;default:if(Wl(t)){for(var Dt in s)ie=s[Dt],s.hasOwnProperty(Dt)&&ie!==void 0&&!i.hasOwnProperty(Dt)&&qu(e,t,Dt,void 0,i,ie);for(me in i)ie=i[me],le=s[me],!i.hasOwnProperty(me)||ie===le||ie===void 0&&le===void 0||qu(e,t,me,ie,i,le);return}}for(var ee in s)ie=s[ee],s.hasOwnProperty(ee)&&ie!=null&&!i.hasOwnProperty(ee)&&$t(e,t,ee,null,i,ie);for(ke in i)ie=i[ke],le=s[ke],!i.hasOwnProperty(ke)||ie===le||ie==null&&le==null||$t(e,t,ke,ie,i,le)}function pm(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function Nb(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,s=performance.getEntriesByType("resource"),i=0;i<s.length;i++){var h=s[i],m=h.transferSize,y=h.initiatorType,A=h.duration;if(m&&A&&pm(y)){for(y=0,A=h.responseEnd,i+=1;i<s.length;i++){var H=s[i],se=H.startTime;if(se>A)break;var me=H.transferSize,ke=H.initiatorType;me&&pm(ke)&&(H=H.responseEnd,y+=me*(H<A?1:(A-se)/(H-se)))}if(--i,t+=8*(m+y)/(h.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var Fu=null,Hu=null;function Hr(e){return e.nodeType===9?e:e.ownerDocument}function fm(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function mm(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function Lu(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Uu=null;function Tb(){var e=window.event;return e&&e.type==="popstate"?e===Uu?!1:(Uu=e,!0):(Uu=null,!1)}var gm=typeof setTimeout=="function"?setTimeout:void 0,Mb=typeof clearTimeout=="function"?clearTimeout:void 0,ym=typeof Promise=="function"?Promise:void 0,Cb=typeof queueMicrotask=="function"?queueMicrotask:typeof ym<"u"?function(e){return ym.resolve(null).then(e).catch(Ob)}:gm;function Ob(e){setTimeout(function(){throw e})}function Wa(e){return e==="head"}function bm(e,t){var s=t,i=0;do{var h=s.nextSibling;if(e.removeChild(s),h&&h.nodeType===8)if(s=h.data,s==="/$"||s==="/&"){if(i===0){e.removeChild(h),bo(t);return}i--}else if(s==="$"||s==="$?"||s==="$~"||s==="$!"||s==="&")i++;else if(s==="html")gi(e.ownerDocument.documentElement);else if(s==="head"){s=e.ownerDocument.head,gi(s);for(var m=s.firstChild;m;){var y=m.nextSibling,A=m.nodeName;m[Bo]||A==="SCRIPT"||A==="STYLE"||A==="LINK"&&m.rel.toLowerCase()==="stylesheet"||s.removeChild(m),m=y}}else s==="body"&&gi(e.ownerDocument.body);s=h}while(s);bo(t)}function vm(e,t){var s=e;e=0;do{var i=s.nextSibling;if(s.nodeType===1?t?(s._stashedDisplay=s.style.display,s.style.display="none"):(s.style.display=s._stashedDisplay||"",s.getAttribute("style")===""&&s.removeAttribute("style")):s.nodeType===3&&(t?(s._stashedText=s.nodeValue,s.nodeValue=""):s.nodeValue=s._stashedText||""),i&&i.nodeType===8)if(s=i.data,s==="/$"){if(e===0)break;e--}else s!=="$"&&s!=="$?"&&s!=="$~"&&s!=="$!"||e++;s=i}while(s)}function Pu(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var s=t;switch(t=t.nextSibling,s.nodeName){case"HTML":case"HEAD":case"BODY":Pu(s),Jl(s);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(s.rel.toLowerCase()==="stylesheet")continue}e.removeChild(s)}}function Bb(e,t,s,i){for(;e.nodeType===1;){var h=s;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!i&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(i){if(!e[Bo])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(m=e.getAttribute("rel"),m==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(m!==h.rel||e.getAttribute("href")!==(h.href==null||h.href===""?null:h.href)||e.getAttribute("crossorigin")!==(h.crossOrigin==null?null:h.crossOrigin)||e.getAttribute("title")!==(h.title==null?null:h.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(m=e.getAttribute("src"),(m!==(h.src==null?null:h.src)||e.getAttribute("type")!==(h.type==null?null:h.type)||e.getAttribute("crossorigin")!==(h.crossOrigin==null?null:h.crossOrigin))&&m&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var m=h.name==null?null:""+h.name;if(h.type==="hidden"&&e.getAttribute("name")===m)return e}else return e;if(e=Jn(e.nextSibling),e===null)break}return null}function jb(e,t,s){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!s||(e=Jn(e.nextSibling),e===null))return null;return e}function xm(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=Jn(e.nextSibling),e===null))return null;return e}function Gu(e){return e.data==="$?"||e.data==="$~"}function Yu(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function zb(e,t){var s=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||s.readyState!=="loading")t();else{var i=function(){t(),s.removeEventListener("DOMContentLoaded",i)};s.addEventListener("DOMContentLoaded",i),e._reactRetry=i}}function Jn(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var Vu=null;function wm(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var s=e.data;if(s==="/$"||s==="/&"){if(t===0)return Jn(e.nextSibling);t--}else s!=="$"&&s!=="$!"&&s!=="$?"&&s!=="$~"&&s!=="&"||t++}e=e.nextSibling}return null}function km(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var s=e.data;if(s==="$"||s==="$!"||s==="$?"||s==="$~"||s==="&"){if(t===0)return e;t--}else s!=="/$"&&s!=="/&"||t++}e=e.previousSibling}return null}function Em(e,t,s){switch(t=Hr(s),e){case"html":if(e=t.documentElement,!e)throw Error(u(452));return e;case"head":if(e=t.head,!e)throw Error(u(453));return e;case"body":if(e=t.body,!e)throw Error(u(454));return e;default:throw Error(u(451))}}function gi(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);Jl(e)}var Qn=new Map,Am=new Set;function Lr(e){return typeof e.getRootNode=="function"?e.getRootNode():e.nodeType===9?e:e.ownerDocument}var Na=S.d;S.d={f:Rb,r:qb,D:Fb,C:Hb,L:Lb,m:Ub,X:Gb,S:Pb,M:Yb};function Rb(){var e=Na.f(),t=Cr();return e||t}function qb(e){var t=zs(e);t!==null&&t.tag===5&&t.type==="form"?Hp(t):Na.r(e)}var mo=typeof document>"u"?null:document;function _m(e,t,s){var i=mo;if(i&&typeof t=="string"&&t){var h=Ln(t);h='link[rel="'+e+'"][href="'+h+'"]',typeof s=="string"&&(h+='[crossorigin="'+s+'"]'),Am.has(h)||(Am.add(h),e={rel:e,crossOrigin:s,href:t},i.querySelector(h)===null&&(t=i.createElement("link"),fn(t,"link",e),on(t),i.head.appendChild(t)))}}function Fb(e){Na.D(e),_m("dns-prefetch",e,null)}function Hb(e,t){Na.C(e,t),_m("preconnect",e,t)}function Lb(e,t,s){Na.L(e,t,s);var i=mo;if(i&&e&&t){var h='link[rel="preload"][as="'+Ln(t)+'"]';t==="image"&&s&&s.imageSrcSet?(h+='[imagesrcset="'+Ln(s.imageSrcSet)+'"]',typeof s.imageSizes=="string"&&(h+='[imagesizes="'+Ln(s.imageSizes)+'"]')):h+='[href="'+Ln(e)+'"]';var m=h;switch(t){case"style":m=go(e);break;case"script":m=yo(e)}Qn.has(m)||(e=b({rel:"preload",href:t==="image"&&s&&s.imageSrcSet?void 0:e,as:t},s),Qn.set(m,e),i.querySelector(h)!==null||t==="style"&&i.querySelector(yi(m))||t==="script"&&i.querySelector(bi(m))||(t=i.createElement("link"),fn(t,"link",e),on(t),i.head.appendChild(t)))}}function Ub(e,t){Na.m(e,t);var s=mo;if(s&&e){var i=t&&typeof t.as=="string"?t.as:"script",h='link[rel="modulepreload"][as="'+Ln(i)+'"][href="'+Ln(e)+'"]',m=h;switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":m=yo(e)}if(!Qn.has(m)&&(e=b({rel:"modulepreload",href:e},t),Qn.set(m,e),s.querySelector(h)===null)){switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(s.querySelector(bi(m)))return}i=s.createElement("link"),fn(i,"link",e),on(i),s.head.appendChild(i)}}}function Pb(e,t,s){Na.S(e,t,s);var i=mo;if(i&&e){var h=Rs(i).hoistableStyles,m=go(e);t=t||"default";var y=h.get(m);if(!y){var A={loading:0,preload:null};if(y=i.querySelector(yi(m)))A.loading=5;else{e=b({rel:"stylesheet",href:e,"data-precedence":t},s),(s=Qn.get(m))&&Xu(e,s);var H=y=i.createElement("link");on(H),fn(H,"link",e),H._p=new Promise(function(se,me){H.onload=se,H.onerror=me}),H.addEventListener("load",function(){A.loading|=1}),H.addEventListener("error",function(){A.loading|=2}),A.loading|=4,Ur(y,t,i)}y={type:"stylesheet",instance:y,count:1,state:A},h.set(m,y)}}}function Gb(e,t){Na.X(e,t);var s=mo;if(s&&e){var i=Rs(s).hoistableScripts,h=yo(e),m=i.get(h);m||(m=s.querySelector(bi(h)),m||(e=b({src:e,async:!0},t),(t=Qn.get(h))&&Ju(e,t),m=s.createElement("script"),on(m),fn(m,"link",e),s.head.appendChild(m)),m={type:"script",instance:m,count:1,state:null},i.set(h,m))}}function Yb(e,t){Na.M(e,t);var s=mo;if(s&&e){var i=Rs(s).hoistableScripts,h=yo(e),m=i.get(h);m||(m=s.querySelector(bi(h)),m||(e=b({src:e,async:!0,type:"module"},t),(t=Qn.get(h))&&Ju(e,t),m=s.createElement("script"),on(m),fn(m,"link",e),s.head.appendChild(m)),m={type:"script",instance:m,count:1,state:null},i.set(h,m))}}function Sm(e,t,s,i){var h=(h=Se.current)?Lr(h):null;if(!h)throw Error(u(446));switch(e){case"meta":case"title":return null;case"style":return typeof s.precedence=="string"&&typeof s.href=="string"?(t=go(s.href),s=Rs(h).hoistableStyles,i=s.get(t),i||(i={type:"style",instance:null,count:0,state:null},s.set(t,i)),i):{type:"void",instance:null,count:0,state:null};case"link":if(s.rel==="stylesheet"&&typeof s.href=="string"&&typeof s.precedence=="string"){e=go(s.href);var m=Rs(h).hoistableStyles,y=m.get(e);if(y||(h=h.ownerDocument||h,y={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},m.set(e,y),(m=h.querySelector(yi(e)))&&!m._p&&(y.instance=m,y.state.loading=5),Qn.has(e)||(s={rel:"preload",as:"style",href:s.href,crossOrigin:s.crossOrigin,integrity:s.integrity,media:s.media,hrefLang:s.hrefLang,referrerPolicy:s.referrerPolicy},Qn.set(e,s),m||Vb(h,e,s,y.state))),t&&i===null)throw Error(u(528,""));return y}if(t&&i!==null)throw Error(u(529,""));return null;case"script":return t=s.async,s=s.src,typeof s=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(t=yo(s),s=Rs(h).hoistableScripts,i=s.get(t),i||(i={type:"script",instance:null,count:0,state:null},s.set(t,i)),i):{type:"void",instance:null,count:0,state:null};default:throw Error(u(444,e))}}function go(e){return'href="'+Ln(e)+'"'}function yi(e){return'link[rel="stylesheet"]['+e+"]"}function $m(e){return b({},e,{"data-precedence":e.precedence,precedence:null})}function Vb(e,t,s,i){e.querySelector('link[rel="preload"][as="style"]['+t+"]")?i.loading=1:(t=e.createElement("link"),i.preload=t,t.addEventListener("load",function(){return i.loading|=1}),t.addEventListener("error",function(){return i.loading|=2}),fn(t,"link",s),on(t),e.head.appendChild(t))}function yo(e){return'[src="'+Ln(e)+'"]'}function bi(e){return"script[async]"+e}function Dm(e,t,s){if(t.count++,t.instance===null)switch(t.type){case"style":var i=e.querySelector('style[data-href~="'+Ln(s.href)+'"]');if(i)return t.instance=i,on(i),i;var h=b({},s,{"data-href":s.href,"data-precedence":s.precedence,href:null,precedence:null});return i=(e.ownerDocument||e).createElement("style"),on(i),fn(i,"style",h),Ur(i,s.precedence,e),t.instance=i;case"stylesheet":h=go(s.href);var m=e.querySelector(yi(h));if(m)return t.state.loading|=4,t.instance=m,on(m),m;i=$m(s),(h=Qn.get(h))&&Xu(i,h),m=(e.ownerDocument||e).createElement("link"),on(m);var y=m;return y._p=new Promise(function(A,H){y.onload=A,y.onerror=H}),fn(m,"link",i),t.state.loading|=4,Ur(m,s.precedence,e),t.instance=m;case"script":return m=yo(s.src),(h=e.querySelector(bi(m)))?(t.instance=h,on(h),h):(i=s,(h=Qn.get(m))&&(i=b({},s),Ju(i,h)),e=e.ownerDocument||e,h=e.createElement("script"),on(h),fn(h,"link",i),e.head.appendChild(h),t.instance=h);case"void":return null;default:throw Error(u(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(i=t.instance,t.state.loading|=4,Ur(i,s.precedence,e));return t.instance}function Ur(e,t,s){for(var i=s.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),h=i.length?i[i.length-1]:null,m=h,y=0;y<i.length;y++){var A=i[y];if(A.dataset.precedence===t)m=A;else if(m!==h)break}m?m.parentNode.insertBefore(e,m.nextSibling):(t=s.nodeType===9?s.head:s,t.insertBefore(e,t.firstChild))}function Xu(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function Ju(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var Pr=null;function Nm(e,t,s){if(Pr===null){var i=new Map,h=Pr=new Map;h.set(s,i)}else h=Pr,i=h.get(s),i||(i=new Map,h.set(s,i));if(i.has(e))return i;for(i.set(e,null),s=s.getElementsByTagName(e),h=0;h<s.length;h++){var m=s[h];if(!(m[Bo]||m[mt]||e==="link"&&m.getAttribute("rel")==="stylesheet")&&m.namespaceURI!=="http://www.w3.org/2000/svg"){var y=m.getAttribute(t)||"";y=e+y;var A=i.get(y);A?A.push(m):i.set(y,[m])}}return i}function Tm(e,t,s){e=e.ownerDocument||e,e.head.insertBefore(s,t==="title"?e.querySelector("head > title"):null)}function Xb(e,t,s){if(s===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;return t.rel==="stylesheet"?(e=t.disabled,typeof t.precedence=="string"&&e==null):!0;case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function Mm(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}function Jb(e,t,s,i){if(s.type==="stylesheet"&&(typeof i.media!="string"||matchMedia(i.media).matches!==!1)&&(s.state.loading&4)===0){if(s.instance===null){var h=go(i.href),m=t.querySelector(yi(h));if(m){t=m._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=Gr.bind(e),t.then(e,e)),s.state.loading|=4,s.instance=m,on(m);return}m=t.ownerDocument||t,i=$m(i),(h=Qn.get(h))&&Xu(i,h),m=m.createElement("link"),on(m);var y=m;y._p=new Promise(function(A,H){y.onload=A,y.onerror=H}),fn(m,"link",i),s.instance=m}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(s,t),(t=s.state.preload)&&(s.state.loading&3)===0&&(e.count++,s=Gr.bind(e),t.addEventListener("load",s),t.addEventListener("error",s))}}var Qu=0;function Qb(e,t){return e.stylesheets&&e.count===0&&Vr(e,e.stylesheets),0<e.count||0<e.imgCount?function(s){var i=setTimeout(function(){if(e.stylesheets&&Vr(e,e.stylesheets),e.unsuspend){var m=e.unsuspend;e.unsuspend=null,m()}},6e4+t);0<e.imgBytes&&Qu===0&&(Qu=62500*Nb());var h=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&Vr(e,e.stylesheets),e.unsuspend)){var m=e.unsuspend;e.unsuspend=null,m()}},(e.imgBytes>Qu?50:800)+t);return e.unsuspend=s,function(){e.unsuspend=null,clearTimeout(i),clearTimeout(h)}}:null}function Gr(){if(this.count--,this.count===0&&(this.imgCount===0||!this.waitingForImages)){if(this.stylesheets)Vr(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var Yr=null;function Vr(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,Yr=new Map,t.forEach(Zb,e),Yr=null,Gr.call(e))}function Zb(e,t){if(!(t.state.loading&4)){var s=Yr.get(e);if(s)var i=s.get(null);else{s=new Map,Yr.set(e,s);for(var h=e.querySelectorAll("link[data-precedence],style[data-precedence]"),m=0;m<h.length;m++){var y=h[m];(y.nodeName==="LINK"||y.getAttribute("media")!=="not all")&&(s.set(y.dataset.precedence,y),i=y)}i&&s.set(null,i)}h=t.instance,y=h.getAttribute("data-precedence"),m=s.get(y)||i,m===i&&s.set(null,h),s.set(y,h),this.count++,i=Gr.bind(this),h.addEventListener("load",i),h.addEventListener("error",i),m?m.parentNode.insertBefore(h,m.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(h,e.firstChild)),t.state.loading|=4}}var vi={$$typeof:j,Provider:null,Consumer:null,_currentValue:F,_currentValue2:F,_threadCount:0};function Kb(e,t,s,i,h,m,y,A,H){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=B(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=B(0),this.hiddenUpdates=B(null),this.identifierPrefix=i,this.onUncaughtError=h,this.onCaughtError=m,this.onRecoverableError=y,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=H,this.incompleteTransitions=new Map}function Cm(e,t,s,i,h,m,y,A,H,se,me,ke){return e=new Kb(e,t,s,y,H,se,me,ke,A),t=1,m===!0&&(t|=24),m=Cn(3,null,null,t),e.current=m,m.stateNode=e,t=Dc(),t.refCount++,e.pooledCache=t,t.refCount++,m.memoizedState={element:i,isDehydrated:s,cache:t},Cc(m),e}function Om(e){return e?(e=Xs,e):Xs}function Bm(e,t,s,i,h,m){h=Om(h),i.context===null?i.context=h:i.pendingContext=h,i=La(t),i.payload={element:s},m=m===void 0?null:m,m!==null&&(i.callback=m),s=Ua(e,i,t),s!==null&&(Tn(s,e,t),Ko(s,e,t))}function jm(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var s=e.retryLane;e.retryLane=s!==0&&s<t?s:t}}function Zu(e,t){jm(e,t),(e=e.alternate)&&jm(e,t)}function zm(e){if(e.tag===13||e.tag===31){var t=fs(e,67108864);t!==null&&Tn(t,e,67108864),Zu(e,67108864)}}function Rm(e){if(e.tag===13||e.tag===31){var t=Rn();t=ze(t);var s=fs(e,t);s!==null&&Tn(s,e,t),Zu(e,t)}}var Xr=!0;function Wb(e,t,s,i){var h=C.T;C.T=null;var m=S.p;try{S.p=2,Ku(e,t,s,i)}finally{S.p=m,C.T=h}}function Ib(e,t,s,i){var h=C.T;C.T=null;var m=S.p;try{S.p=8,Ku(e,t,s,i)}finally{S.p=m,C.T=h}}function Ku(e,t,s,i){if(Xr){var h=Wu(i);if(h===null)Ru(e,t,i,Jr,s),Fm(e,i);else if(tv(h,e,t,s,i))i.stopPropagation();else if(Fm(e,i),t&4&&-1<ev.indexOf(e)){for(;h!==null;){var m=zs(h);if(m!==null)switch(m.tag){case 3:if(m=m.stateNode,m.current.memoizedState.isDehydrated){var y=Ft(m.pendingLanes);if(y!==0){var A=m;for(A.pendingLanes|=2,A.entangledLanes|=2;y;){var H=1<<31-un(y);A.entanglements[1]|=H,y&=~H}ia(m),(vt&6)===0&&(Tr=qe()+500,pi(0))}}break;case 31:case 13:A=fs(m,2),A!==null&&Tn(A,m,2),Cr(),Zu(m,2)}if(m=Wu(i),m===null&&Ru(e,t,i,Jr,s),m===h)break;h=m}h!==null&&i.stopPropagation()}else Ru(e,t,i,null,s)}}function Wu(e){return e=ec(e),Iu(e)}var Jr=null;function Iu(e){if(Jr=null,e=js(e),e!==null){var t=a(e);if(t===null)e=null;else{var s=t.tag;if(s===13){if(e=r(t),e!==null)return e;e=null}else if(s===31){if(e=l(t),e!==null)return e;e=null}else if(s===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return Jr=e,null}function qm(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(nt()){case _t:return 2;case Ut:return 8;case rt:case Vt:return 32;case Zt:return 268435456;default:return 32}default:return 32}}var ed=!1,Ia=null,es=null,ts=null,xi=new Map,wi=new Map,ns=[],ev="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Fm(e,t){switch(e){case"focusin":case"focusout":Ia=null;break;case"dragenter":case"dragleave":es=null;break;case"mouseover":case"mouseout":ts=null;break;case"pointerover":case"pointerout":xi.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":wi.delete(t.pointerId)}}function ki(e,t,s,i,h,m){return e===null||e.nativeEvent!==m?(e={blockedOn:t,domEventName:s,eventSystemFlags:i,nativeEvent:m,targetContainers:[h]},t!==null&&(t=zs(t),t!==null&&zm(t)),e):(e.eventSystemFlags|=i,t=e.targetContainers,h!==null&&t.indexOf(h)===-1&&t.push(h),e)}function tv(e,t,s,i,h){switch(t){case"focusin":return Ia=ki(Ia,e,t,s,i,h),!0;case"dragenter":return es=ki(es,e,t,s,i,h),!0;case"mouseover":return ts=ki(ts,e,t,s,i,h),!0;case"pointerover":var m=h.pointerId;return xi.set(m,ki(xi.get(m)||null,e,t,s,i,h)),!0;case"gotpointercapture":return m=h.pointerId,wi.set(m,ki(wi.get(m)||null,e,t,s,i,h)),!0}return!1}function Hm(e){var t=js(e.target);if(t!==null){var s=a(t);if(s!==null){if(t=s.tag,t===13){if(t=r(s),t!==null){e.blockedOn=t,nn(e.priority,function(){Rm(s)});return}}else if(t===31){if(t=l(s),t!==null){e.blockedOn=t,nn(e.priority,function(){Rm(s)});return}}else if(t===3&&s.stateNode.current.memoizedState.isDehydrated){e.blockedOn=s.tag===3?s.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Qr(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var s=Wu(e.nativeEvent);if(s===null){s=e.nativeEvent;var i=new s.constructor(s.type,s);Il=i,s.target.dispatchEvent(i),Il=null}else return t=zs(s),t!==null&&zm(t),e.blockedOn=s,!1;t.shift()}return!0}function Lm(e,t,s){Qr(e)&&s.delete(t)}function nv(){ed=!1,Ia!==null&&Qr(Ia)&&(Ia=null),es!==null&&Qr(es)&&(es=null),ts!==null&&Qr(ts)&&(ts=null),xi.forEach(Lm),wi.forEach(Lm)}function Zr(e,t){e.blockedOn===t&&(e.blockedOn=null,ed||(ed=!0,n.unstable_scheduleCallback(n.unstable_NormalPriority,nv)))}var Kr=null;function Um(e){Kr!==e&&(Kr=e,n.unstable_scheduleCallback(n.unstable_NormalPriority,function(){Kr===e&&(Kr=null);for(var t=0;t<e.length;t+=3){var s=e[t],i=e[t+1],h=e[t+2];if(typeof i!="function"){if(Iu(i||s)===null)continue;break}var m=zs(s);m!==null&&(e.splice(t,3),t-=3,Wc(m,{pending:!0,data:h,method:s.method,action:i},i,h))}}))}function bo(e){function t(H){return Zr(H,e)}Ia!==null&&Zr(Ia,e),es!==null&&Zr(es,e),ts!==null&&Zr(ts,e),xi.forEach(t),wi.forEach(t);for(var s=0;s<ns.length;s++){var i=ns[s];i.blockedOn===e&&(i.blockedOn=null)}for(;0<ns.length&&(s=ns[0],s.blockedOn===null);)Hm(s),s.blockedOn===null&&ns.shift();if(s=(e.ownerDocument||e).$$reactFormReplay,s!=null)for(i=0;i<s.length;i+=3){var h=s[i],m=s[i+1],y=h[bn]||null;if(typeof m=="function")y||Um(s);else if(y){var A=null;if(m&&m.hasAttribute("formAction")){if(h=m,y=m[bn]||null)A=y.formAction;else if(Iu(h)!==null)continue}else A=y.action;typeof A=="function"?s[i+1]=A:(s.splice(i,3),i-=3),Um(s)}}}function Pm(){function e(m){m.canIntercept&&m.info==="react-transition"&&m.intercept({handler:function(){return new Promise(function(y){return h=y})},focusReset:"manual",scroll:"manual"})}function t(){h!==null&&(h(),h=null),i||setTimeout(s,20)}function s(){if(!i&&!navigation.transition){var m=navigation.currentEntry;m&&m.url!=null&&navigation.navigate(m.url,{state:m.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var i=!1,h=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(s,100),function(){i=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),h!==null&&(h(),h=null)}}}function td(e){this._internalRoot=e}Wr.prototype.render=td.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(u(409));var s=t.current,i=Rn();Bm(s,i,e,t,null,null)},Wr.prototype.unmount=td.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Bm(e.current,2,null,e,null,null),Cr(),t[Bs]=null}};function Wr(e){this._internalRoot=e}Wr.prototype.unstable_scheduleHydration=function(e){if(e){var t=ft();e={blockedOn:null,target:e,priority:t};for(var s=0;s<ns.length&&t!==0&&t<ns[s].priority;s++);ns.splice(s,0,e),s===0&&Hm(e)}};var Gm=o.version;if(Gm!=="19.2.7")throw Error(u(527,Gm,"19.2.7"));S.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(u(188)):(e=Object.keys(e).join(","),Error(u(268,e)));return e=p(t),e=e!==null?g(e):null,e=e===null?null:e.stateNode,e};var av={bundleType:0,version:"19.2.7",rendererPackageName:"react-dom",currentDispatcherRef:C,reconcilerVersion:"19.2.7"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Ir=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Ir.isDisabled&&Ir.supportsFiber)try{cn=Ir.inject(av),Xt=Ir}catch{}}return _i.createRoot=function(e,t){if(!d(e))throw Error(u(299));var s=!1,i="",h=Zp,m=Kp,y=Wp;return t!=null&&(t.unstable_strictMode===!0&&(s=!0),t.identifierPrefix!==void 0&&(i=t.identifierPrefix),t.onUncaughtError!==void 0&&(h=t.onUncaughtError),t.onCaughtError!==void 0&&(m=t.onCaughtError),t.onRecoverableError!==void 0&&(y=t.onRecoverableError)),t=Cm(e,1,!1,null,null,s,i,null,h,m,y,Pm),e[Bs]=t.current,zu(e),new td(t)},_i.hydrateRoot=function(e,t,s){if(!d(e))throw Error(u(299));var i=!1,h="",m=Zp,y=Kp,A=Wp,H=null;return s!=null&&(s.unstable_strictMode===!0&&(i=!0),s.identifierPrefix!==void 0&&(h=s.identifierPrefix),s.onUncaughtError!==void 0&&(m=s.onUncaughtError),s.onCaughtError!==void 0&&(y=s.onCaughtError),s.onRecoverableError!==void 0&&(A=s.onRecoverableError),s.formState!==void 0&&(H=s.formState)),t=Cm(e,1,!0,t,s??null,i,h,H,m,y,A,Pm),t.context=Om(null),s=t.current,i=Rn(),i=ze(i),h=La(i),h.callback=null,Ua(s,h,i),s=i,t.current.lanes=s,I(t,s),ia(t),e[Bs]=t.current,zu(e),new Wr(t)},_i.version="19.2.7",_i}var N0;function o3(){if(N0)return hd.exports;N0=1;function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(o){console.error(o)}}return n(),hd.exports=s3(),hd.exports}var i3=o3();const r3=`// API の往復の見本。行きの線と戻りの線を引き、戻りの線の名前は線の下に置く
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
`,l3=`// API round trip example. Draw the request and the reply, and put the reply labels under the line
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
`,c3=`// Chainlink CCIP でメッセージとトークンが送信元チェーンから送信先チェーンへ届くまで
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
`,u3=`// How a message and tokens travel from the source chain to the destination chain with Chainlink CCIP
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
`,d3=`// Ethereum でブロックが出てから確定して戻せなくなるまで (#3165)。
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
`,h3=`// How an Ethereum block becomes final and cannot be reverted (#3165).
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
`,p3=`// 入門の見本。箱 2 つと線 1 本で、記法の形を見る
sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する, color: slate, icon: globe]
box アプリ [note: ログインを頼む側, color: blue, icon: app]

step ログインを押す
  say 利用者がアプリのログインを押す。アプリは本人の確認を認可サーバーに任せる。
  ブラウザ -> アプリ: GET /login
`,f3=`// Starter example. Two boxes and one line show the shape of the notation
sequence Ask to sign in

box browser as User's browser [note: operated by the user, color: slate, icon: globe]
box app as App [note: asks for sign-in, color: blue, icon: app]

step Press sign in
  say The user presses the app's sign-in button. The app leaves identity checks to the authorization server.
  browser -> app: GET /login
`,m3=`// 直しの枝 fix と作業の枝 feature を、merge commit で main へ取り込むまで (#3164)。
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
`,g3=`// Bringing the fix branch and the feature branch into main with merge commits (#3164).
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
`,y3=`// 8件の取引から組んだ Merkle 木で、取引3が含まれることを根まで辿って証明する (#3233)。
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
`,b3=`// Prove that transaction 3 is in a Merkle tree built from 8 transactions, by climbing to the root (#3233).
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
`,v3=`// OAuth 2.0 の認可コードと PKCE で、ログインしてから API を呼ぶまで
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
`,x3=`// Sign in with the OAuth 2.0 authorization code and PKCE, then call an API
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
`,w3=`// ネット通販の注文 #1042 が受け付けられ、届いた後に返品されて返金で閉じるまでの状態 (#3163)。
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
`,k3=`// The states of online order #1042, from the order to delivery, then a return and a refund that close it (#3163).
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
`,E3=`// 支払いと後から届く知らせの見本。お金は硬貨で運び、注文の状態を帯で追う
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
`,A3=`// Payment and later notice example. Money moves as a coin, and the strip follows the order state
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
`,_3=`// 作業の枝 feature を main の先端へ rebase し、main を早送りで進めて履歴を 1 本にするまで (#3164)。
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
`,S3=`// Rebasing the work branch feature onto the tip of main, then fast-forwarding main into one straight history (#3164).
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
`,$3=`// 失敗してやり直す見本。同じ線を 2 度引き、待つ処理と何回目かを箱の中と下に見せる
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
`,D3=`// Retry example. Draw the same line twice, and show the wait and the attempt count inside and under the box
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
`,N3=`// ウォレットで署名して取引を送る見本。署名した取引を札で運び、段ごとに呼ぶ命令を見せる
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
`,T3=`// Wallet signing example. The signed transaction runs as a tag, and each step shows the call it makes
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
`,M3=`// L2 から L1 へ資産を引き出す時の 7 日の待ち (#3165)。
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
`,C3=`// The 7-day wait when withdrawing assets from L2 to L1 (#3165).
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
`,Li=["intro","api","retry","payment","wallet","oauth","ccip","order","rebase","merge","finality","withdraw","merkle"],T0="oauth",O3=["intro","oauth","ccip"],B3={intro:{ja:p3,en:f3},api:{ja:r3,en:l3},retry:{ja:$3,en:D3},payment:{ja:E3,en:A3},wallet:{ja:N3,en:T3},oauth:{ja:v3,en:x3},ccip:{ja:c3,en:u3},order:{ja:w3,en:k3},rebase:{ja:_3,en:S3},merge:{ja:m3,en:g3},finality:{ja:d3,en:h3},withdraw:{ja:M3,en:C3},merkle:{ja:y3,en:b3}},Ba=(n,o)=>B3[n][o].trimEnd();function rs(n,o){const c=Ba(n,o),u=ls(c);if(!u.ok)return;const d=c.split(`
`)[0]??"";return{title:u.diagram.title,kind:u.diagram.kind,about:d.startsWith("//")?d.replace(/^\/\/\s*/u,""):""}}const Sl={ja:["sequence 新しい図","","box 甲","box 乙","","step 最初の段","  say この段で起きることを書く。","  甲 -> 乙: 呼ぶ"].join(`
`),en:["sequence New diagram","","box a as A","box b as B","","step First step","  say Write what happens in this step.","  a -> b: call"].join(`
`)},_d="new.dragon";function $l(n){for(const o of Li)for(const c of["ja","en"])if(Ba(o,c)===n.trimEnd())return{key:o,lang:c}}const xt={ja:{title:"dragon — 文章で書くと、動く図になる",tagline:"文章で書くと、動く図になる",language:"言葉",palette:"色味",paletteNames:{clear:"澄んだ色",paper:"紙と墨",night:"夜の計器"},site:{nav:{home:"概要",catalog:"カタログ",editor:"編集画面",docs:"使い方","release-notes":"更新履歴"},navLabel:"行き先",openMenu:"行き先を開く",closeMenu:"行き先を閉じる",openEditor:"編集画面を開く →",toDark:"暗い表示にする",toLight:"明るい表示にする",home:{chip:n=>[...n,"段ごとの再生"].join(" × "),title:["より自由な","図","を"],lead:"箱と線を書き、段ごとに動かす。型に合わせて諦めていた図が、文章のまま組み上がる。",readDocs:"使い方を読む",features:{eyebrow:"なぜ dragon か",title:"書く手間を、動く成果に。",items:[{title:"文章で書ける",text:"箱と線と段を 1 行ずつ書くだけ。座標も図の部品も組まない。"},{title:"段ごとに動き出す",text:"段を切り替えると、線の上を封筒や札が走り、箱の中の処理が進む。順序と因果が目に見える。"},{title:"URL と file で渡せる",text:"書いた記法は URL に載せて共有できる。CLI で mp4、GIF、HTML、PNG にも書き出せる。"}]},steps:{eyebrow:"3 手順",title:"1 分で走り出す。",items:[{title:"編集画面を開く",text:"ブラウザで編集画面を開く。導入作業は要らない。"},{title:"記法を書く",text:"箱と線と段を 1 行ずつ書く。最初の行で図の種類を選ぶ。"},{title:"図が動き出す",text:"右の実況表示に、段ごとに動く図が出る。URL で共有でき、file にも書き出せる。"}]},uses:{eyebrow:"使いどころ",title:"こんな図が書ける。",more:"カタログで図を見る →"},closing:{title:"今すぐ、書いて動かす。",lead:"記法を 1 つ書くだけ。動く図を 1 分後に手に入れる。"}},catalog:{crumb:"現在地",lead:(n,o,c)=>`今の記法の部品 ${n} 個と、部品を組み合わせた ${o} 種類の図を並べる。部品の頁で書き方と見え方を確かめ、図の頁で見本を検索して動かし、編集画面で開ける。合計 ${c} 件の見本。`,sections:{parts:{title:"部品",lead:"どの図でも使う部品。部品ごとに、時系列図と構成図と状態遷移図と枝分かれの図と時間軸の図と木の図で描いた見え方を並べる。"},"kind-parts":{title:"図の種類だけの部品",lead:"1 つの図の種類でだけ使う部品。"},kinds:{title:"図",lead:"部品を組み合わせた図。図ごとに、使う部品の一覧と見本を載せる。"}},parts:{box:{name:"箱",desc:"box の行で、図に登場する物を 1 つ置く。名札と見せる名前を書き、線はこの名札で引く。"},edge:{name:"線",desc:"送る側の箱から受ける側の箱へ引く線。1 つの段に何本でも並べ、書いた順に引く。"},"edge-label":{name:"線の名前",desc:"線に添える名前。side で、上、下、左、右のどこに置くかを選ぶ。"},carry:{name:"運ぶ物",desc:"線の上を走る物。封筒、値を書いた札、硬貨、何も走らせないの 4 つから選ぶ。"},color:{name:"色の役",desc:"箱と区画に付ける色の役。7 つの役から選び、色そのものは色味が決める。"},icon:{name:"絵",desc:"箱と区画の名前に添える絵。user や db などの名前で選ぶ。"},link:{name:"飛び先",desc:"箱に書く飛び先。描いた図ではその箱が link になり、押すと中の仕組みを描いた頁などへ移る。/ で始まる path か、http:// か https:// で始まる URL で書く。"},note:{name:"小さな字",desc:"箱と区画の名前の下に添える小さな字。段の中で箱の小さな字を書き換えられる。"},act:{name:"箱の中の処理",desc:"線を引かずに、箱の中で起きる処理を札で見せる。"},strip:{name:"中身の帯と欄",desc:"図の下に置く中身の帯。段ごとに欄の値を入れ替え、運ばれる物の中身を追う。"},step:{name:"段",desc:"図を区切る段。段ごとに本文と打つ命令を書き、1 段ずつ送って見る。view で、枠が段を追うか全体を止めて見せるかを選ぶ。"},source:{name:"出典",desc:"段に書く出典。名前と URL の組を 1 つの段に何行でも書け、読み上げの段の一覧に名前の link で出る。図と見える語りには出さない。"},lifeline:{name:"生存線",desc:"時系列図だけの部品。箱の下に縦の線が伸び、上から下へ時が進む。"},group:{name:"区画",desc:"構成図だけの部品。group から end までの箱を 1 つの区画に囲み、仕組みの境目を見せる。"},"start-finish":{name:"始まりと終わり",desc:"状態遷移図だけの部品。線の送る側に start、受ける側に finish を書くと、始まりの印から出る線と、終わりの印へ入る線になる。"},"side-path":{name:"通らない道",desc:"状態遷移図だけの部品。最初の step より前に書いた線は、移れるが今回は通らない道として点線で引く。どの段も辿り着かない状態は点線の箱にして、脇道の囲みに入れる。"},branch:{name:"枝",desc:"枝分かれの図だけの部品。branch の行で枝を上から順に宣言すると、枝ごとに横長の帯が並ぶ。段の中で <枝> from <commit> と書くと、その commit から枝を切る。"},commit:{name:"commit",desc:"枝分かれの図だけの部品。commit <名札> on <枝> で枝に commit を積み、hash と一言を丸の外に添える。積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。"},copy:{name:"当て直し",desc:"枝分かれの図だけの部品。on <枝> の後ろに copy <commit> を書くと、元の commit と同じ変更を当て直した commit になり、元から点線で結ぶ。rebase で作り直す commit に使い、枝の札は動かさない。"},merge:{name:"merge commit",desc:"枝分かれの図だけの部品。on <枝> の後ろに merge <枝> を書くと、取り込む先の先端と取り込む枝の先端の 2 つを親に持つ commit になる。取り込む先の札だけが進む。"},scale:{name:"目盛りと針",desc:"時間軸の図だけの部品。scale の行で目盛りの名前と 1 つの長さと数を書くと、時間軸に目盛りが並ぶ。段の中で now -> <目盛り> と書くと、針が決まった速さでその目盛りの終わりまで進む。period で区切りを、span で範囲の括弧か囲みを出す。"},row:{name:"印の列",desc:"時間軸の図だけの部品。row の行で印の列を上から順に宣言すると、目盛りごとに細い印が並び、針が過ぎた所から塗られる。empty に書いた目盛りは空きの印になり、段の中の mark で印の色を変える。"},point:{name:"節目",desc:"時間軸の図だけの部品。point <名札> at <目盛り> で、その目盛りの印の下に旗の丸を置く。段の中の note で状態の字と丸の色を変え、節目どうしを線で結ぶ。"},zoom:{name:"拡大の帯",desc:"時間軸の図だけの部品。zoom の行で目盛りの範囲を書くと、上の帯にその目盛りを列にして並べ、宣言した箱を列ごとに繰り返す。線は [at: <目盛り>] の列の箱どうしを結び、受ける箱を別の列から選ぶ時は into を書く。"},leaf:{name:"葉と札",desc:"木の図だけの部品。段の中に leaf <名札> [hash: <値>] と書くと、その段で葉の箱が現れる。値を持つ葉は箱に値を、葉の下の札に名札を出す。札は最初の段から見える。"},node:{name:"組んだ親",desc:"木の図だけの部品。段の中に node <名札> of <子>, <子> [hash: <値>] と書くと、前に書いた葉か親を子にして親の箱が現れ、子と親を木の線で結ぶ。親子の箱どうしの線は木の線の上を走る。親を持たない箱は最後に根の 1 つだけ残す。"}},kindOnly:n=>`${n}だけ`,partKinds:"使える図",words:"記法の語",uses:"この図で使う部品",usesLead:"部品を押すと、その部品の書き方と見え方の頁へ移る。",partSamples:"この部品を使う見本",partSamplesLead:"見本を押すと、図の頁でその見本を開く。",partIcons:"使える絵柄",partIconsLead:n=>`箱と区画の icon に下の名前を書くと、その絵柄が名前の横に付く。使える絵柄は ${n} 個。`,count:n=>`${n} 件`,open:"開く →",kinds:{sequence:"登場する物の間で、誰が誰に何を渡すかを段ごとに追う図。ログインの流れや API の呼び出しの順を、線の上を走る封筒で見せる。",architecture:"区画と箱で仕組みの構成を描き、段ごとにどこからどこへ何が流れるかを見せる図。チェーンをまたぐ送金や、サービスの間の受け渡しに使う。",state:"1 つの物が状態を移る様子を段ごとに追う図。注文や申請が受付から閉じるまでにどの状態を通るかを、線の上を走る札で見せる。",git:"git の枝に commit が積まれ、rebase や merge commit で取り込まれる様子を段ごとに追う図。枝と HEAD がどの commit を指すかを、丸の上の札で見せる。",time:"決まった間隔で刻む時間の上で、何がいつ起きたかを段ごとに追う図。ブロックの確定や引き出しの待ちのように、時間が長さとして効く仕組みを、進む針と塗られる印で見せる。",tree:"親子で枝分かれする箱を葉から根まで組み上げ、根と葉の間を段ごとに辿る図。Merkle 木のように少しの値で全体を確かめる仕組みを、木の線の上を走る札で見せる。"},total:n=>`全 ${n} 件`,showing:n=>`${n} 件 表示中`,search:"検索 (名前 / 説明)",searchLabel:"見本を検索",clearSearch:"検索語を消す",list:"見本の一覧",nothing:"当てはまる見本が無い",preview:"図の表示",views:"表示の切替",figure:"図",code:"コード",sameAsSite:"サイトと同じ",expand:"拡大",expandLabel:n=>`${n} を拡大して見る`,close:"閉じる",openEditor:"編集画面で開く →",source:"この図の記法",copy:"コードを写す",copied:"写しました"},screens:{catalog:{title:"カタログ"},editor:{title:"編集画面",lead:""},docs:{title:"使い方"},"release-notes":{title:"更新履歴"},"not-found":{title:"そこは、まだ書かれていない。"}},releaseNotes:{crumb:"道筋",eyebrow:n=>`公開の記録 · ${n} が最新`,accent:"履歴",lead:"dragon の今の版を示す。版ごとの詳しい変更は GitHub 上の CHANGELOG.md で読める。",changelog:"変更の記録を GitHub で見る"},notFound:{em:"そこは",lead:n=>`お探しの頁は移動または削除されたか、そもそも存在しません。dragon の ${n} つの入口から探してみてください。`,catalog:"カタログを見る",docs:"使い方を読む"}},notation:"記法",editor:"図の記法を書く欄",fold:"畳む",unfold:"開く",readable:(n,o)=>`読めています — 箱 ${n} つ、段 ${o}`,notJson:n=>`JSON として読めない — ${n}`,cannotDraw:n=>`描けない — ${n}`,kept:"誤りがあるあいだは、最後に描けた図を出しています",exportLead:"同じ図を書き出す",exportTail:"で mp4 / GIF / HTML / PNG",shelf:{label:"棚",open:"棚を開く",close:"棚を閉じる",newFile:"新規ファイル",tabs:{samples:"見本",parts:"部品",notation:"記法"},filter:"絞り込む…",filterLabel:"一覧を絞り込む",nothing:"当てはまる物が無い",kinds:{sequence:"時系列図",architecture:"構成図",state:"状態遷移図",git:"枝分かれの図",time:"時間軸の図",tree:"木の図"},partsHint:"押すと書く欄に足す。宣言の行は最初の段の前、段の中の行は最後の段に入る",notationHint:"行の形。書く欄の記法と同じ言葉の語で出す",parts:{box:"箱",region:"区画と箱",step:"段",edge:"線 (封筒が走る)","edge-tag":"札を運ぶ線","edge-coin":"硬貨を運ぶ線","edge-none":"何も運ばない線","edge-below":"名前を下に置く線",action:"箱の中の処理",swap:"箱の下の字の書き換え",strip:"帯の値"},syntax:{kind:"図の種類と題。最初の行に書く",view:"見せ方。書かなければ字の大きさで選ぶ",region:"区画。箱を囲む",box:"箱。名札は線と処理で使う",strip:"帯。段ごとに変わる値の欄",step:"段の題と本文",code:"段で打つ命令",source:"段の出典。読み上げの段の一覧に名前の link で出る",edge:"線。運ぶ物を書かなければ封筒が走る",carry:"線の上を運ぶ物",side:"線の名前を置く側","start-finish":"始まりと終わり。状態遷移図の線の送る側に start、受ける側に finish を書く",path:"通らない道。状態遷移図の最初の step より前に書く",branch:"枝。枝分かれの図で上から帯に並べ、段の中の from で commit から枝を切る",commit:"commit を積む。hash と一言を丸の外に添える",copy:"当て直した commit。枝の札を動かさない",merge:"merge commit。取り込む枝の先端も親に持つ",ref:"札を動かす。枝の名札か HEAD から commit へ引く",scale:"目盛り。時間軸の図で目盛りの名前と 1 つの長さと数を書く",period:"区切り。目盛りいくつかごとに名前と番号を置く",row:"印の列。目盛りごとに印を並べ、empty の目盛りを空きにする",point:"節目。目盛りの印の下に旗の丸を置く",zoom:"拡大の帯。目盛りの範囲を上の帯に列にして並べる",now:"針を進める。段の中で、その目盛りの終わりまで進める",mark:"印の色を変える。段の中で、列の目盛りの範囲を塗り直す",span:"範囲の括弧。shape: box で印の列を囲む",leaf:"葉を出す。hash に値を書くと箱に値を、下の札に名札を出す",node:"親を組む。of の後ろに子を書く。親を持たない箱は最後に根の 1 つだけ",action:"箱の中の処理",swap:"箱の下の小さな字の書き換え","strip-value":"帯の値",comment:"メモ。図には出ない"}},code:{file:"書類名",import:"file を取り込む (.dragon か .json)",export:"今の記法を .dragon の file に書き出す"},stage:{live:"実況表示",fontDown:"語りの字を小さくする",fontUp:"語りの字を大きくする",grid:"格子を出す",fullscreen:"全画面で見る",fit:"全体に合わせる",zoomOut:"縮小する",zoomIn:"拡大する",zoom:"表示の倍率",phase:(n,o,c)=>`段 ${n} / ${o} · ${c}`},notices:{line:n=>`${n} 行目`,count:n=>`誤り ${n} 件`,goTo:n=>`${n} 行目へ移る`},overlaps:{count:n=>`字の重なり ${n} 件`,step:n=>`段 ${n}`,goTo:n=>`段 ${n} へ移る`}},en:{title:"dragon — write it as text, get a moving diagram",tagline:"Write it as text, get a moving diagram",language:"Language",palette:"Palette",paletteNames:{clear:"Clear",paper:"Paper and ink",night:"Night gauges"},site:{nav:{home:"Home",catalog:"Catalog",editor:"Editor",docs:"Docs","release-notes":"Release notes"},navLabel:"Main navigation",openMenu:"Open navigation",closeMenu:"Close navigation",openEditor:"Open editor →",toDark:"Switch to dark",toLight:"Switch to light",home:{chip:n=>[...n,"step playback"].join(" × "),title:["","Diagrams"," beyond the template"],lead:"Write the boxes and the edges, and move them step by step. Diagrams you gave up on because the template could not hold them now build themselves from plain text.",readDocs:"Read the docs",features:{eyebrow:"Why dragon",title:"Turn your writing into diagrams that move.",items:[{title:"Write it as text",text:"Write boxes, edges and steps one line at a time. No coordinates, no hand-built parts."},{title:"Motion, step by step",text:"Switch steps and envelopes and tags run along the edges while actions play inside the boxes. Order and causality become visible."},{title:"Hand it over by URL or file",text:"Put the notation in a URL to share it, or export it to mp4, GIF, HTML or PNG with the CLI."}]},steps:{eyebrow:"3 steps",title:"Up and running in a minute.",items:[{title:"Open the editor",text:"Open the editor in your browser. Nothing to install."},{title:"Write the notation",text:"Write boxes, edges and steps one line at a time. The first line picks the diagram kind."},{title:"The diagram starts moving",text:"The live view on the right shows a diagram that moves step by step. Share it by URL, or export it to a file."}]},uses:{eyebrow:"Use cases",title:"Diagrams you can write.",more:"Browse the catalog →"},closing:{title:"Write it now, watch it move.",lead:"One notation file is all it takes. A moving diagram is yours a minute later."}},catalog:{crumb:"You are here",lead:(n,o,c)=>`The ${n} parts of the current notation, and the ${o} diagram kinds built from them. A part page shows how to write the part and how it looks; a diagram page lets you search its examples, watch them move, and open them in the editor. ${c} examples in total.`,sections:{parts:{title:"Parts",lead:"Parts every diagram uses. Each part page shows the part in a sequence diagram, an architecture diagram, a state diagram, a git graph, a time diagram, and a tree diagram."},"kind-parts":{title:"Parts for one kind",lead:"Parts that only one diagram kind uses."},kinds:{title:"Diagrams",lead:"Diagrams built from the parts. Each lists the parts it uses and its examples."}},parts:{box:{name:"Box",desc:"A box line places one thing in the diagram. Write a tag and the name to show; edges use the tag."},edge:{name:"Edge",desc:"A line from the sending box to the receiving box. A step can hold any number, drawn in the order written."},"edge-label":{name:"Edge label",desc:"The name beside an edge. side puts it above, below, left or right."},carry:{name:"Carry",desc:"What runs along an edge: an envelope, a tag with a value, a coin, or nothing."},color:{name:"Color",desc:"The color role of a box or a group. Pick one of seven roles; the palette decides the actual color."},icon:{name:"Icon",desc:"A picture beside the name of a box or a group, chosen by a name such as user or db."},link:{name:"Link",desc:"Where a box leads. The box becomes a link in the drawn diagram, for example to the page that draws what is inside it. Write a path that starts with / or a URL that starts with http:// or https://."},note:{name:"Note",desc:"Small text under the name of a box or a group. A step can rewrite the small text of a box."},act:{name:"Action",desc:"Shows work done inside a box as a badge, with no edge."},strip:{name:"Strip",desc:"A strip of fields under the diagram. Each step can rewrite a field to follow what is carried."},step:{name:"Step",desc:"A step of the diagram, with its own text and command, played one at a time. view picks whether the frame follows the step or holds the whole diagram."},source:{name:"Source",desc:"A source for a step: a name and a URL, as many lines as the step needs. Sources appear as links in the step list that screen readers read, not in the diagram or the shown text."},lifeline:{name:"Lifeline",desc:"Sequence diagrams only. A line runs down from each box, and time moves down the page."},group:{name:"Group",desc:"Architecture diagrams only. The boxes between group and end sit inside one region that marks a boundary in the system."},"start-finish":{name:"Start and end",desc:"State diagrams only. Write start as the sender of a line and finish as its receiver, and the line leaves the start mark or goes into the end mark."},"side-path":{name:"Path not taken",desc:"State diagrams only. A line written before the first step is a path the object could take but does not this time, drawn dotted. A state that no step reaches becomes a dotted box inside the side path area."},branch:{name:"Branch",desc:"Git graphs only. Declare branches top to bottom with branch lines, and each gets its own lane. Inside a step, <branch> from <commit> cuts the branch at that commit."},commit:{name:"Commit",desc:"Git graphs only. commit <id> on <branch> adds a commit to the branch, with its hash and a short note beside the circle. The branch's ref, and HEAD when it points at that branch, move to the new commit."},copy:{name:"Replay",desc:"Git graphs only. Add copy <commit> after on <branch> to replay the same change as that commit, joined to it by a dotted line. Use it for commits a rebase rewrites; branch refs do not move."},merge:{name:"Merge commit",desc:"Git graphs only. Add merge <branch> after on <branch> to make a commit with two parents: the tip of the target and the tip of the merged branch. Only the target's ref moves."},scale:{name:"Scale and needle",desc:"Time diagrams only. A scale line gives the unit name, the length of one unit and the count, and lays the units out along the axis. Inside a step, now -> <unit> moves the needle at a fixed speed to the end of that unit. period adds named periods, and span adds a bracket or a box over a range."},row:{name:"Row of marks",desc:"Time diagrams only. Declare rows from top to bottom with row lines; each unit gets a thin mark, filled once the needle passes it. Units listed in empty get an empty mark, and mark inside a step recolors marks."},point:{name:"Point",desc:"Time diagrams only. point <id> at <unit> puts a flag circle under the marks of that unit. note inside a step changes its state and the color of the circle, and lines can join two points."},zoom:{name:"Zoom band",desc:"Time diagrams only. A zoom line gives a range of units, laid out as columns in the band above, with the declared boxes repeated in every column. A line joins the boxes of the column in [at: <unit>]; write into to take the receiving box from another column."},leaf:{name:"Leaf and card",desc:"Tree diagrams only. Write leaf <id> [hash: <value>] in a step and a leaf box appears in that step. A leaf with a value shows the value in the box and its id on a card below. The card is there from the first step."},node:{name:"Parent node",desc:"Tree diagrams only. Write node <id> of <child>, <child> [hash: <value>] in a step and a parent box appears over the leaves or parents written earlier, joined to them by tree lines. A line between a parent and its child runs along the tree line. Only the root is left without a parent at the end."}},kindOnly:n=>`${n} only`,partKinds:"Used in",words:"Notation",uses:"Parts this diagram uses",usesLead:"Pick a part to see how to write it and how it looks.",partSamples:"Examples that use this part",partSamplesLead:"Pick an example to open it on its diagram page.",partIcons:"Available icons",partIconsLead:n=>`Write one of these names as the icon of a box or a group to put that picture beside its name. There are ${n} icons.`,count:n=>`${n} ${n===1?"example":"examples"}`,open:"Open →",kinds:{sequence:"Follow who hands what to whom, step by step. Show a sign-in flow or the order of API calls with envelopes running along the edges.",architecture:"Draw a system as regions and boxes, and show what flows where in each step. Use it for cross-chain transfers or hand-offs between services.",state:"Follow one object as it moves between states, step by step. A tag running along the lines shows which states an order or a request passes before it closes.",git:"Follow commits piling up on git branches and coming together through a rebase or a merge commit, step by step. Tags above the circles show which commit each branch and HEAD point at.",time:"Follow what happens when on time cut into fixed units, step by step. For mechanisms where time itself matters, like block finality or a withdrawal wait, a moving needle and filling marks show it.",tree:"Build boxes that branch into parents and children from the leaves up to the root, then follow the path between root and leaf step by step. For mechanisms like a Merkle tree, where a few values prove the whole, tags running along the tree lines show it."},total:n=>`${n} ${n===1?"example":"examples"}`,showing:n=>`showing ${n}`,search:"Search (name / description)",searchLabel:"Search the examples",clearSearch:"Clear the search",list:"Example list",nothing:"No example matches",preview:"Diagram",views:"What to show",figure:"Diagram",code:"Code",sameAsSite:"Same as the site",expand:"Enlarge",expandLabel:n=>`Enlarge ${n}`,close:"Close",openEditor:"Open in the editor →",source:"Notation for this diagram",copy:"Copy the code",copied:"Copied"},screens:{catalog:{title:"Catalog"},editor:{title:"Editor",lead:""},docs:{title:"Docs"},"release-notes":{title:"Release notes"},"not-found":{title:"That page has not been written yet."}},releaseNotes:{crumb:"Breadcrumb",eyebrow:n=>`Release log • ${n} is current`,accent:"notes",lead:"Shows the current dragon version. The detailed record for each version is in CHANGELOG.md on GitHub.",changelog:"See the change log on GitHub"},notFound:{em:"That page",lead:n=>`The page you are looking for was moved, deleted, or never existed. Try one of dragon's ${n} entry points.`,catalog:"Browse the catalog",docs:"Read the docs"}},notation:"Notation",editor:"Diagram notation",fold:"Hide",unfold:"Show",readable:(n,o)=>`Reads fine — ${n} ${n===1?"box":"boxes"}, ${o} ${o===1?"step":"steps"}`,notJson:n=>`Not valid JSON — ${n}`,cannotDraw:n=>`Cannot draw — ${n}`,kept:"Showing the last diagram that drew",exportLead:"Export the same diagram",exportTail:"to mp4 / GIF / HTML / PNG",shelf:{label:"Shelf",open:"Open the shelf",close:"Close the shelf",newFile:"New file",tabs:{samples:"Samples",parts:"Parts",notation:"Notation"},filter:"Filter…",filterLabel:"Filter the list",nothing:"Nothing matches",kinds:{sequence:"Sequence",architecture:"Architecture",state:"State",git:"Git graph",time:"Time diagram",tree:"Tree diagram"},partsHint:"Click to add to the editor. Declarations go before the first step, step lines go to the last step",notationHint:"Line shapes, in the words of the notation you are writing",parts:{box:"Box",region:"Region with a box",step:"Step",edge:"Edge (an envelope runs)","edge-tag":"Edge carrying a tag","edge-coin":"Edge carrying a coin","edge-none":"Edge carrying nothing","edge-below":"Edge with its label below",action:"Action inside a box",swap:"Rewrite the text under a box",strip:"Strip value"},syntax:{kind:"Diagram kind and title, on the first line",view:"View. Chosen by text size when left out",region:"Region around boxes",box:"Box. Its id is used by edges and actions",strip:"Strip, the fields whose values change per step",step:"Step title and body",code:"Command run in the step",source:"Source of the step. Shown as a link in the step list that screen readers read",edge:"Edge. An envelope runs when nothing is carried",carry:"What runs along the edge",side:"Where the edge label sits","start-finish":"Start and end. In a state diagram, write start as a line's sender and finish as its receiver",path:"Path not taken. In a state diagram, write it before the first step",branch:"Branch. In a git graph, lanes go top to bottom; from inside a step cuts a branch at a commit",commit:"Add a commit, with its hash and a short note beside the circle",copy:"Replayed commit. Branch refs do not move",merge:"Merge commit. The merged branch's tip is a parent too",ref:"Move a ref, from a branch id or HEAD to a commit",scale:"Scale. In a time diagram, give the unit name, the length of one unit and the count",period:"Period. A name and number every few units",row:"Row of marks. One mark per unit; units in empty stay empty",point:"Point. A flag circle under the marks of a unit",zoom:"Zoom band. A range of units laid out as columns above",now:"Move the needle to the end of a unit, inside a step",mark:"Recolor marks. Inside a step, repaint a range of a row",span:"Range bracket. shape: box draws a box around the rows",leaf:"Add a leaf. With a hash, the box shows the value and a card below shows the id",node:"Build a parent. List its children after of. Only the root is left without a parent at the end",action:"Action inside a box",swap:"Rewrite the small text under a box","strip-value":"Strip value",comment:"Memo. Not drawn"}},code:{file:"File name",import:"Import a file (.dragon or .json)",export:"Export the notation as a .dragon file"},stage:{live:"Live preview",fontDown:"Smaller narration text",fontUp:"Larger narration text",grid:"Show the grid",fullscreen:"Full screen",fit:"Fit to the frame",zoomOut:"Zoom out",zoomIn:"Zoom in",zoom:"Zoom level",phase:(n,o,c)=>`Step ${n} / ${o} · ${c}`},notices:{line:n=>`Line ${n}`,count:n=>`${n} ${n===1?"error":"errors"}`,goTo:n=>`Go to line ${n}`},overlaps:{count:n=>`${n} text ${n===1?"overlap":"overlaps"}`,step:n=>`Step ${n}`,goTo:n=>`Go to step ${n}`}}};function j3(n){return n[0]?.toLowerCase().startsWith("ja")?"ja":"en"}const wn=Object.keys(xt.ja.shelf.kinds),Jd=n=>wn.some(o=>o===n),Sg=n=>Li.filter(o=>rs(o,"ja")?.kind===n),Sd="n=";function Qd(n){let o="";for(const c of new TextEncoder().encode(n))o+=String.fromCharCode(c);return`#${Sd}${btoa(o).replaceAll("+","-").replaceAll("/","_").replace(/=+$/u,"")}`}function $g(n){if(n.startsWith(`#${Sd}`))try{const o=atob(n.slice(Sd.length+1).replaceAll("-","+").replaceAll("_","/"));return new TextDecoder("utf-8",{fatal:!0}).decode(Uint8Array.from(o,c=>c.charCodeAt(0)))}catch{return}}const os="/dragon/",Tt={home:os,catalog:`${os}catalog`,editor:`${os}editor`,docs:`${os}docs`,"release-notes":`${os}release-notes`},Zd="https://github.com/cardene777/dragon",z3={catalog:"catalog",editor:"editor",docs:"docs","release-notes":"release-notes"};function Dg(n){if(`${n}/`===os)return{screen:"home"};if(!n.startsWith(os))return{screen:"not-found"};const o=n.slice(os.length).split("/").filter(Boolean),[c,u,d]=o;if(c===void 0)return{screen:"home"};if(c==="catalog"&&u!==void 0&&o.length===2)return{screen:"category",category:decodeURIComponent(u)};if(c==="catalog"&&u==="part"&&d!==void 0&&o.length===3)return{screen:"part",part:decodeURIComponent(d)};const a=z3[c];return a!==void 0&&o.length===1?{screen:a}:{screen:"not-found"}}function R3(){Dg(location.pathname).screen==="home"&&$g(location.hash)!==void 0&&history.replaceState(null,"",`${Tt.editor}${location.search}${location.hash}`)}const $d=new Set;function q3(n){return $d.add(n),addEventListener("popstate",n),()=>{$d.delete(n),removeEventListener("popstate",n)}}function F3(){return Re.useSyncExternalStore(q3,()=>location.pathname)}function H3(n){const o=new URL(n,location.href);if(o.pathname!==location.pathname||o.hash!==""&&o.hash!==location.hash){history.pushState(null,"",`${o.pathname}${o.hash}`);for(const c of $d)c()}scrollTo(0,0)}function Ot(n,o){n.button!==0||n.metaKey||n.ctrlKey||n.shiftKey||n.altKey||(n.preventDefault(),H3(n.currentTarget.href),o?.())}const L3=`architecture 箱の中の処理

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
`,U3=`architecture Action

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
`,P3=`git 箱の中の処理

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
`,G3=`git Action

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
`,Y3=`sequence 箱の中の処理

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
`,V3=`sequence Action

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
`,X3=`state 箱の中の処理

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
`,J3=`state Action

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
`,Q3=`time 処理

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
`,Z3=`time Action

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
`,K3=`tree 箱の中の処理

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
`,W3=`tree Work in a box

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
`,I3=`architecture 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,ew=`architecture Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,tw=`git 箱

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
`,nw=`git Box

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
`,aw=`sequence 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,sw=`sequence Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,ow=`state 箱

box 下書き
box 公開中 as 公開している

step 公開する
  say box の行で状態を 1 つ置く。as の後ろに見せる名前を書く。
  下書き -> 公開中: 公開する

step 戻す
  say 線は状態の名札で書く。
  公開中 -> 下書き: 取り下げる
`,iw=`state Box

box draft as Draft
box live as Published

step Publish
  say A box line places one state. The name to show follows as.
  draft -> live: publish

step Withdraw
  say Edges name the states by their tags.
  live -> draft: withdraw
`,rw=`time 箱

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
`,lw=`time Box

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
`,cw=`tree 箱

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
`,uw=`tree Boxes

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
`,dw=`git 枝

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
`,hw=`git Branch

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
`,pw=`architecture 運ぶ物

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
`,fw=`architecture Carry

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
`,mw=`git 運ぶ物

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
`,gw=`git Carry

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
`,yw=`sequence 運ぶ物

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
`,bw=`sequence Carry

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
`,vw=`state 運ぶ物

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
`,xw=`state Carry

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
`,ww=`time 運ぶ物

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
`,kw=`time Carry

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
`,Ew=`tree 運ぶ物

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
`,Aw=`tree What travels

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
`,_w=`architecture 色の役

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
`,Sw=`architecture Color

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
`,$w=`git 色の役

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
`,Dw=`git Color

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
`,Nw=`sequence 色の役

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
`,Tw=`sequence Color

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
`,Mw=`state 色の役

box 下書き [color: slate]
box 審査中 [color: amber]
box 公開中 [color: green]

step 出す
  say color で、状態の箱に 7 つの役から色を選ぶ。
  下書き -> 審査中: 審査に出す

step 通る
  say 役は意味で選ぶ。待つ状態は amber、終えた状態は green のように揃える。
  審査中 -> 公開中: 通す
`,Cw=`state Color

box draft as Draft [color: slate]
box review as In review [color: amber]
box live as Published [color: green]

step Submit
  say color picks one of 7 roles for a state box.
  draft -> review: submit

step Approve
  say Pick roles by meaning, such as amber for waiting states and green for finished ones.
  review -> live: approve
`,Ow=`time 色

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
`,Bw=`time Color

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
`,jw=`tree 色の役

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
`,zw=`tree Color roles

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
`,Rw=`git commit

branch main

step 積む
  say commit <名札> on <枝> で枝に commit を積む。積んだ枝の札が新しい commit へ進む。
  commit A on main
  commit B on main

step 字を添える
  say hash と note で、丸の外に hash と一言を添える。
  commit C on main [hash: c41d0e5, note: 価格を丸める]
`,qw=`git Commit

branch main

step Commit
  say commit <id> on <branch> adds a commit to the branch. The branch's ref moves to the new commit.
  commit A on main
  commit B on main

step Add text
  say hash and note put a hash and a short note beside the circle.
  commit C on main [hash: c41d0e5, note: Round prices]
`,Fw=`git 当て直し

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
`,Hw=`git Replay

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
`,Lw=`architecture 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,Uw=`architecture Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,Pw=`git 線の名前

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
`,Gw=`git Edge label

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
`,Yw=`sequence 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。横の線は above か below。
  乙 -> 甲: 下の名前 [side: below]
`,Vw=`sequence Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above or below.
  b -> a: label below [side: below]
`,Xw=`state 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,Jw=`state Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,Qw=`time 線の名前

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
`,Zw=`time Edge label

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
`,Kw=`tree 線の名前

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
`,Ww=`tree Line names

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
`,Iw=`architecture 線

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
`,e2=`architecture Edge

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
`,t2=`git 線

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
`,n2=`git Edge

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
`,a2=`sequence 線

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
`,s2=`sequence Edge

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
`,o2=`state 線

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
`,i2=`state Edge

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
`,r2=`time 線

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
`,l2=`time Edge

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
`,c2=`tree 線

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
`,u2=`tree Lines

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
`,d2=`architecture 区画

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
`,h2=`architecture Group

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
`,p2=`architecture 絵

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
`,f2=`architecture Icon

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
`,m2=`git 絵

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
`,g2=`git Icon

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
`,y2=`sequence 絵

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
`,b2=`sequence Icon

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
`,v2=`state 絵

box 下書き [icon: doc]
box 審査中 [icon: clock]
box 公開中 [icon: globe]

step 出す
  say icon で状態の箱に絵を付ける。
  下書き -> 審査中: 審査に出す

step 通る
  say 運ぶ物は、着いた状態の絵柄の横の置き場に留まる。
  審査中 -> 公開中: 通す
`,x2=`state Icon

box draft as Draft [icon: doc]
box review as In review [icon: clock]
box live as Published [icon: globe]

step Submit
  say icon puts a picture on a state box.
  draft -> review: submit

step Approve
  say The carried item rests in the slot beside the icon of the state it reaches.
  review -> live: approve
`,w2=`time 絵

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
`,k2=`time Icon

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
`,E2=`tree 絵

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
`,A2=`tree Icons

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
`,_2=`tree 葉と札

step 葉を出す
  say leaf の行で葉を出す。hash に値を書くと、箱に値を、葉の下の札に名札を出す。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 親を組む
  say 札は最初の段から出ていて、葉が現れると点線で結ばれる。
  node 根 of 取引1, 取引2 [hash: 7a21]
`,S2=`tree Leaf and card

step Add leaves
  say A leaf line adds a leaf. With a hash, the box shows the value and a card below shows the id.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Cards are there from the first step, and a dotted line ties them to the leaf when it appears.
  node root of tx1, tx2 [hash: 7a21]
`,$2=`sequence 生存線

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
`,D2=`sequence Lifeline

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
`,N2=`architecture 飛び先

box アプリ
box 決済 as 決済の仕組み [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  アプリ -> 決済: 請求

step 返す
  say 箱の中の仕組みを別の図に描いた時は、その図の頁を飛び先にする。
  決済 -> アプリ: 済
`,T2=`architecture Link

box app as App
box pay as Payment system [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  app -> pay: Charge

step Answer
  say When another diagram draws what is inside the box, link to its page.
  pay -> app: Done
`,M2=`git 飛び先

branch main

box 遠く as 遠くの repo [link: https://github.com/cardene777/dragon]

step 積む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  commit A on main

step 送る
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  commit B on main
  note 遠く: B を受け取った
`,C2=`git Link

branch main

box remote as Remote repo [link: https://github.com/cardene777/dragon]

step Commit
  say link on a box makes the box a link to that place in the drawn diagram.
  commit A on main

step Push
  say Write a path that starts with / or a URL that starts with http:// or https://.
  commit B on main
  note remote: Received B
`,O2=`sequence 飛び先

box 利用者
box 認可 as 認可サーバー [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  利用者 -> 認可: 許可を求める

step 返す
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  認可 -> 利用者: 許可した
`,B2=`sequence Link

box user as User
box auth as Auth server [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  user -> auth: Ask for access

step Answer
  say Write a path that starts with / or a URL that starts with http:// or https://.
  auth -> user: Granted
`,j2=`state 飛び先

box 注文 as 注文を受けた
box 支払い as 支払いを確かめる [link: https://github.com/cardene777/dragon]

step 受ける
  say link で状態の箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  start -> 注文

step 確かめる
  say 確かめ方を別の図に描いた時は、その図の頁を飛び先にする。
  注文 -> 支払い: 払った
  支払い -> finish
`,z2=`state Link

box order as Order received
box check as Checking payment [link: https://github.com/cardene777/dragon]

step Receive
  say link on a state box makes the box a link to that place in the drawn diagram.
  start -> order

step Check
  say When another diagram draws how the check works, link to its page.
  order -> check: Paid
  check -> finish
`,R2=`time 飛び先

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
`,q2=`time Link

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
`,F2=`tree 飛び先

box 遠く as 遠くの台帳 [link: https://github.com/cardene777/dragon]

step 葉を出す
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 遠く: 根を受け取った
`,H2=`tree Links

box remote as Remote ledger [link: https://github.com/cardene777/dragon]

step Add leaves
  say link gives a box a target. Clicking the box in the drawn diagram goes there.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say Write a path starting with / or a URL starting with http:// or https://.
  node root of tx1, tx2 [hash: 7a21]
  note remote: got the root
`,L2=`git merge commit

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
`,U2=`git Merge commit

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
`,P2=`tree 組んだ親

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
`,G2=`tree Parent node

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
`,Y2=`architecture 小さな字

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
`,V2=`architecture Note

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
`,X2=`git 小さな字

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
`,J2=`git Note

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
`,Q2=`sequence 小さな字

box 財布 [note: 残高 5000 円]
box 店 [note: 待っている]

step 払う
  say note で箱の名前の下に小さな字を添える。
  財布 -> 店: 1200 円 [carry: coin]

step 書き換える
  say 段の中の note の行で、その段から小さな字を書き換える。
  note 財布: 残高 3800 円
  note 店: 受け取った
`,Z2=`sequence Note

box wallet as Wallet [note: balance 50 USD]
box shop as Shop [note: waiting]

step Pay
  say note adds small text under the box name.
  wallet -> shop: 12 USD [carry: coin]

step Rewrite
  say A note line in a step rewrites the small text from then on.
  note wallet: balance 38 USD
  note shop: paid
`,K2=`state 小さな字

box 在庫あり [note: 残り 1 個]
box 品切れ [note: 入荷待ち]

step 売り切れる
  say note で状態の名前の下に小さな字を添える。
  在庫あり -> 品切れ: 最後の 1 個が売れた

step 入荷する
  say 段の中の note の行で、その段から状態の小さな字を書き換える。
  品切れ -> 在庫あり: 入荷した
  note 在庫あり: 残り 10 個
`,W2=`state Note

box stocked as In stock [note: 1 left]
box out as Sold out [note: awaiting stock]

step Sell out
  say note adds small text under the state name.
  stocked -> out: last one sold

step Restock
  say A note line inside a step rewrites the small text from that step on.
  out -> stocked: restocked
  note stocked: 10 left
`,I2=`time 小さな字

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
`,e6=`time Note

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
`,t6=`tree 小さな字

box 記録 [note: まだ無い]

step 葉を出す
  say note で箱の名前の下に小さな字を添える。
  leaf 取引1 [hash: 3fa0]
  leaf 取引2 [hash: 8b04]

step 組む
  say 段の中の note の行で、その段から箱の小さな字を書き換える。
  node 根 of 取引1, 取引2 [hash: 7a21]
  note 記録: 根 7a21
`,n6=`tree Small text

box ledger as Ledger [note: empty]

step Add leaves
  say note adds small text under the box name.
  leaf tx1 [hash: 3fa0]
  leaf tx2 [hash: 8b04]

step Join
  say A note line inside a step rewrites that small text from that step on.
  node root of tx1, tx2 [hash: 7a21]
  note ledger: root 7a21
`,a6=`time 節目

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
`,s6=`time Point

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
`,o6=`time 印の列

scale slot 12s 8
row ブロック [color: blue, empty: 2 5]
row 票 [color: amber]

step 印を塗る
  say row で印の列を上から宣言する。針が過ぎた目盛りの印が塗られ、empty の目盛りは空きの印になる。
  now -> 7

step 色を変える
  say 段の中の mark で、列の目盛りの範囲の印の色を変える。
  mark ブロック 0-3 [color: green]
`,i6=`time Row of marks

scale slot 12s 8
row block [color: blue, empty: 2 5]
row vote [color: amber]

step Fill the marks
  say Declare rows from top to bottom with row. Marks fill once the needle passes, and units in empty stay empty.
  now -> 7

step Recolor
  say mark inside a step recolors a range of marks in a row.
  mark block 0-3 [color: green]
`,r6=`time 目盛りと針

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
`,l6=`time Scale and needle

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
`,c6=`state 通らない道

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
`,u6=`state Path not taken

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
`,d6=`architecture 出典

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
`,h6=`architecture Source

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
`,p6=`git 出典

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
`,f6=`git Source

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
`,m6=`sequence 出典

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
`,g6=`sequence Source

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
`,y6=`state 出典

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
`,b6=`state Source

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
`,v6=`time 出典

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
`,x6=`time Source

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
`,w6=`tree 出典

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
`,k6=`tree Sources

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
`,E6=`state 始まりと終わり

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
`,A6=`state Start and end

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
`,_6=`architecture 段 [view: fixed]

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
`,S6=`architecture Step [view: fixed]

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
`,$6=`git 段 [view: fixed]

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
`,D6=`git Step [view: fixed]

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
`,N6=`sequence 段 [view: fixed]

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
`,T6=`sequence Step [view: fixed]

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
`,M6=`state 段 [view: fixed]

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
`,C6=`state Step [view: fixed]

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
`,O6=`time 段 [view: fixed]

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
`,B6=`time Step [view: fixed]

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
`,j6=`tree 段 [view: fixed]

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
`,z6=`tree Steps [view: fixed]

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
`,R6=`architecture 中身の帯と欄

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
`,q6=`architecture Strip

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
`,F6=`git 中身の帯と欄

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
`,H6=`git Strip

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
`,L6=`sequence 中身の帯と欄

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
`,U6=`sequence Strip

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
`,P6=`state 中身の帯と欄

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
`,G6=`state Strip

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
`,Y6=`time 中身の帯と欄

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
`,V6=`time Strip and fields

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
`,X6=`tree 中身の帯と欄

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
`,J6=`tree Strip and fields

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
`,Q6=`time 拡大の帯

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
`,Z6=`time Zoom band

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
`,Mi=[{id:"box",kinds:wn,words:["head:box"]},{id:"edge",kinds:wn,words:["edge:->"]},{id:"edge-label",kinds:wn,words:["attr:edge.side"]},{id:"carry",kinds:wn,words:["attr:edge.carry","attr:edge.tag"]},{id:"color",kinds:wn,words:["attr:box.color"]},{id:"icon",kinds:wn,words:["attr:box.icon"]},{id:"link",kinds:wn,words:["attr:box.link"]},{id:"note",kinds:wn,words:["attr:box.note","head:note"]},{id:"act",kinds:wn,words:["head:act"]},{id:"strip",kinds:wn,words:["head:strip","head:set","attr:set.tag"]},{id:"step",kinds:wn,words:["head:step","head:say","head:code","attr:diagram.view"]},{id:"source",kinds:wn,words:["head:source","attr:source.url"]},{id:"lifeline",kinds:["sequence"],words:["kind:sequence"]},{id:"group",kinds:["architecture"],words:["kind:architecture","head:group","head:end","attr:group.note","attr:group.color","attr:group.icon"]},{id:"start-finish",kinds:["state"],words:["kind:state","edge:start","edge:finish"]},{id:"side-path",kinds:["state"],words:["edge:before-step"]},{id:"branch",kinds:["git"],words:["kind:git","head:branch","attr:branch.note","git:from"]},{id:"commit",kinds:["git"],words:["head:commit","attr:commit.hash","attr:commit.note"]},{id:"copy",kinds:["git"],words:["git:copy"]},{id:"merge",kinds:["git"],words:["git:merge"]},{id:"scale",kinds:["time"],words:["kind:time","head:scale","attr:scale.from","head:period","attr:period.from","head:span","attr:span.shape","attr:span.color","attr:strip.meter"]},{id:"row",kinds:["time"],words:["head:row","attr:row.color","attr:row.empty","head:mark","attr:mark.color"]},{id:"point",kinds:["time"],words:["head:point","attr:note.color"]},{id:"zoom",kinds:["time"],words:["head:zoom","attr:edge.at","attr:edge.into"]},{id:"leaf",kinds:["tree"],words:["kind:tree","head:leaf","attr:leaf.hash"]},{id:"node",kinds:["tree"],words:["head:node","attr:node.hash"]}],Dd=n=>wn.every(o=>n.kinds.includes(o)),Kd=n=>Mi.find(o=>o.id===n),K6=n=>Mi.filter(o=>o.kinds.includes(n)),W6=Object.assign({"./parts/act.architecture.dragon":L3,"./parts/act.architecture.en.dragon":U3,"./parts/act.git.dragon":P3,"./parts/act.git.en.dragon":G3,"./parts/act.sequence.dragon":Y3,"./parts/act.sequence.en.dragon":V3,"./parts/act.state.dragon":X3,"./parts/act.state.en.dragon":J3,"./parts/act.time.dragon":Q3,"./parts/act.time.en.dragon":Z3,"./parts/act.tree.dragon":K3,"./parts/act.tree.en.dragon":W3,"./parts/box.architecture.dragon":I3,"./parts/box.architecture.en.dragon":ew,"./parts/box.git.dragon":tw,"./parts/box.git.en.dragon":nw,"./parts/box.sequence.dragon":aw,"./parts/box.sequence.en.dragon":sw,"./parts/box.state.dragon":ow,"./parts/box.state.en.dragon":iw,"./parts/box.time.dragon":rw,"./parts/box.time.en.dragon":lw,"./parts/box.tree.dragon":cw,"./parts/box.tree.en.dragon":uw,"./parts/branch.git.dragon":dw,"./parts/branch.git.en.dragon":hw,"./parts/carry.architecture.dragon":pw,"./parts/carry.architecture.en.dragon":fw,"./parts/carry.git.dragon":mw,"./parts/carry.git.en.dragon":gw,"./parts/carry.sequence.dragon":yw,"./parts/carry.sequence.en.dragon":bw,"./parts/carry.state.dragon":vw,"./parts/carry.state.en.dragon":xw,"./parts/carry.time.dragon":ww,"./parts/carry.time.en.dragon":kw,"./parts/carry.tree.dragon":Ew,"./parts/carry.tree.en.dragon":Aw,"./parts/color.architecture.dragon":_w,"./parts/color.architecture.en.dragon":Sw,"./parts/color.git.dragon":$w,"./parts/color.git.en.dragon":Dw,"./parts/color.sequence.dragon":Nw,"./parts/color.sequence.en.dragon":Tw,"./parts/color.state.dragon":Mw,"./parts/color.state.en.dragon":Cw,"./parts/color.time.dragon":Ow,"./parts/color.time.en.dragon":Bw,"./parts/color.tree.dragon":jw,"./parts/color.tree.en.dragon":zw,"./parts/commit.git.dragon":Rw,"./parts/commit.git.en.dragon":qw,"./parts/copy.git.dragon":Fw,"./parts/copy.git.en.dragon":Hw,"./parts/edge-label.architecture.dragon":Lw,"./parts/edge-label.architecture.en.dragon":Uw,"./parts/edge-label.git.dragon":Pw,"./parts/edge-label.git.en.dragon":Gw,"./parts/edge-label.sequence.dragon":Yw,"./parts/edge-label.sequence.en.dragon":Vw,"./parts/edge-label.state.dragon":Xw,"./parts/edge-label.state.en.dragon":Jw,"./parts/edge-label.time.dragon":Qw,"./parts/edge-label.time.en.dragon":Zw,"./parts/edge-label.tree.dragon":Kw,"./parts/edge-label.tree.en.dragon":Ww,"./parts/edge.architecture.dragon":Iw,"./parts/edge.architecture.en.dragon":e2,"./parts/edge.git.dragon":t2,"./parts/edge.git.en.dragon":n2,"./parts/edge.sequence.dragon":a2,"./parts/edge.sequence.en.dragon":s2,"./parts/edge.state.dragon":o2,"./parts/edge.state.en.dragon":i2,"./parts/edge.time.dragon":r2,"./parts/edge.time.en.dragon":l2,"./parts/edge.tree.dragon":c2,"./parts/edge.tree.en.dragon":u2,"./parts/group.architecture.dragon":d2,"./parts/group.architecture.en.dragon":h2,"./parts/icon.architecture.dragon":p2,"./parts/icon.architecture.en.dragon":f2,"./parts/icon.git.dragon":m2,"./parts/icon.git.en.dragon":g2,"./parts/icon.sequence.dragon":y2,"./parts/icon.sequence.en.dragon":b2,"./parts/icon.state.dragon":v2,"./parts/icon.state.en.dragon":x2,"./parts/icon.time.dragon":w2,"./parts/icon.time.en.dragon":k2,"./parts/icon.tree.dragon":E2,"./parts/icon.tree.en.dragon":A2,"./parts/leaf.tree.dragon":_2,"./parts/leaf.tree.en.dragon":S2,"./parts/lifeline.sequence.dragon":$2,"./parts/lifeline.sequence.en.dragon":D2,"./parts/link.architecture.dragon":N2,"./parts/link.architecture.en.dragon":T2,"./parts/link.git.dragon":M2,"./parts/link.git.en.dragon":C2,"./parts/link.sequence.dragon":O2,"./parts/link.sequence.en.dragon":B2,"./parts/link.state.dragon":j2,"./parts/link.state.en.dragon":z2,"./parts/link.time.dragon":R2,"./parts/link.time.en.dragon":q2,"./parts/link.tree.dragon":F2,"./parts/link.tree.en.dragon":H2,"./parts/merge.git.dragon":L2,"./parts/merge.git.en.dragon":U2,"./parts/node.tree.dragon":P2,"./parts/node.tree.en.dragon":G2,"./parts/note.architecture.dragon":Y2,"./parts/note.architecture.en.dragon":V2,"./parts/note.git.dragon":X2,"./parts/note.git.en.dragon":J2,"./parts/note.sequence.dragon":Q2,"./parts/note.sequence.en.dragon":Z2,"./parts/note.state.dragon":K2,"./parts/note.state.en.dragon":W2,"./parts/note.time.dragon":I2,"./parts/note.time.en.dragon":e6,"./parts/note.tree.dragon":t6,"./parts/note.tree.en.dragon":n6,"./parts/point.time.dragon":a6,"./parts/point.time.en.dragon":s6,"./parts/row.time.dragon":o6,"./parts/row.time.en.dragon":i6,"./parts/scale.time.dragon":r6,"./parts/scale.time.en.dragon":l6,"./parts/side-path.state.dragon":c6,"./parts/side-path.state.en.dragon":u6,"./parts/source.architecture.dragon":d6,"./parts/source.architecture.en.dragon":h6,"./parts/source.git.dragon":p6,"./parts/source.git.en.dragon":f6,"./parts/source.sequence.dragon":m6,"./parts/source.sequence.en.dragon":g6,"./parts/source.state.dragon":y6,"./parts/source.state.en.dragon":b6,"./parts/source.time.dragon":v6,"./parts/source.time.en.dragon":x6,"./parts/source.tree.dragon":w6,"./parts/source.tree.en.dragon":k6,"./parts/start-finish.state.dragon":E6,"./parts/start-finish.state.en.dragon":A6,"./parts/step.architecture.dragon":_6,"./parts/step.architecture.en.dragon":S6,"./parts/step.git.dragon":$6,"./parts/step.git.en.dragon":D6,"./parts/step.sequence.dragon":N6,"./parts/step.sequence.en.dragon":T6,"./parts/step.state.dragon":M6,"./parts/step.state.en.dragon":C6,"./parts/step.time.dragon":O6,"./parts/step.time.en.dragon":B6,"./parts/step.tree.dragon":j6,"./parts/step.tree.en.dragon":z6,"./parts/strip.architecture.dragon":R6,"./parts/strip.architecture.en.dragon":q6,"./parts/strip.git.dragon":F6,"./parts/strip.git.en.dragon":H6,"./parts/strip.sequence.dragon":L6,"./parts/strip.sequence.en.dragon":U6,"./parts/strip.state.dragon":P6,"./parts/strip.state.en.dragon":G6,"./parts/strip.time.dragon":Y6,"./parts/strip.time.en.dragon":V6,"./parts/strip.tree.dragon":X6,"./parts/strip.tree.en.dragon":J6,"./parts/zoom.time.dragon":Q6,"./parts/zoom.time.en.dragon":Z6}),I6=(n,o,c)=>(W6[`./parts/${n}.${o}${c==="en"?".en":""}.dragon`]??"").trimEnd(),An=n=>n.steps.flatMap(o=>o.events),ss=n=>An(n).flatMap(o=>o.type==="edge"?[o]:[]),Si=n=>An(n).flatMap(o=>o.type==="commit"?[o]:[]),gd=n=>An(n).flatMap(o=>o.type==="span"?[o]:[]),ek=(n,o)=>o.carry.kind==="tag"&&!(n.kind==="git"&&o.carry.text===o.from),tk={"kind:sequence":n=>n.kind==="sequence","kind:architecture":n=>n.kind==="architecture","kind:state":n=>n.kind==="state","kind:git":n=>n.kind==="git","head:group":n=>(n.regions??[]).length>0,"head:end":n=>(n.regions??[]).length>0,"head:box":n=>n.boxes.length>0,"head:strip":n=>n.strip!==void 0,"head:step":n=>n.steps.length>0,"head:say":n=>n.steps.some(o=>o.body!==""),"head:code":n=>n.steps.some(o=>o.code!==void 0),"head:source":n=>n.steps.some(o=>o.sources!==void 0),"head:act":n=>An(n).some(o=>o.type==="action"),"head:note":n=>An(n).some(o=>o.type==="swap"),"head:set":n=>An(n).some(o=>o.type==="strip"),"attr:diagram.view":n=>n.view!==void 0,"attr:group.note":n=>(n.regions??[]).some(o=>o.note!==void 0),"attr:group.color":n=>(n.regions??[]).some(o=>o.color!==void 0),"attr:group.icon":n=>(n.regions??[]).some(o=>o.icon!==void 0),"attr:box.note":n=>n.boxes.some(o=>o.sub!==void 0),"attr:box.color":n=>n.boxes.some(o=>o.color!==void 0),"attr:box.icon":n=>n.boxes.some(o=>o.icon!==void 0),"attr:box.link":n=>n.boxes.some(o=>o.link!==void 0),"attr:source.url":n=>n.steps.some(o=>o.sources!==void 0),"attr:edge.carry":n=>ss(n).some(o=>o.carry.kind==="coin"||o.carry.kind==="none"),"attr:edge.tag":n=>ss(n).some(o=>ek(n,o)),"attr:edge.side":n=>ss(n).some(o=>o.labelSide!==void 0),"attr:set.tag":n=>An(n).some(o=>o.type==="strip"&&o.tag!==void 0),"edge:->":n=>ss(n).length>0,"edge:start":n=>ss(n).some(o=>o.from==="start"),"edge:finish":n=>ss(n).some(o=>o.to==="finish"),"edge:before-step":n=>(n.state?.paths??[]).length>0,"head:branch":n=>(n.git?.branches??[]).length>0,"head:commit":n=>Si(n).length>0,"attr:branch.note":n=>(n.git?.branches??[]).some(o=>o.note!==void 0),"attr:commit.hash":n=>Si(n).some(o=>o.hash!==void 0),"attr:commit.note":n=>Si(n).some(o=>o.note!==void 0),"git:from":n=>An(n).some(o=>o.type==="branch"),"git:copy":n=>Si(n).some(o=>o.copy!==void 0),"git:merge":n=>Si(n).some(o=>o.merge!==void 0),"kind:time":n=>n.kind==="time","head:scale":n=>n.time!==void 0,"attr:scale.from":n=>n.time?.scale.from!==void 0,"head:period":n=>n.time?.period!==void 0,"attr:period.from":n=>n.time?.period?.from!==void 0,"head:span":n=>gd(n).length>0,"attr:span.shape":n=>gd(n).some(o=>o.shape!==void 0),"attr:span.color":n=>gd(n).some(o=>o.color!==void 0),"attr:strip.meter":n=>(n.strip?.meters??[]).length>0,"head:row":n=>(n.time?.rows??[]).length>0,"attr:row.color":n=>(n.time?.rows??[]).some(o=>o.color!==void 0),"attr:row.empty":n=>(n.time?.rows??[]).some(o=>o.empty!==void 0),"head:mark":n=>An(n).some(o=>o.type==="mark"),"attr:mark.color":n=>An(n).some(o=>o.type==="mark"),"head:point":n=>(n.time?.points??[]).length>0,"attr:note.color":n=>An(n).some(o=>o.type==="swap"&&o.color!==void 0),"head:zoom":n=>n.time?.zoom!==void 0,"attr:edge.at":n=>ss(n).some(o=>o.at!==void 0),"attr:edge.into":n=>ss(n).some(o=>o.into!==void 0),"kind:tree":n=>n.kind==="tree","head:leaf":n=>An(n).some(o=>o.type==="leaf"),"attr:leaf.hash":n=>An(n).some(o=>o.type==="leaf"&&o.hash!==void 0),"head:node":n=>An(n).some(o=>o.type==="node"),"attr:node.hash":n=>An(n).some(o=>o.type==="node"&&o.hash!==void 0)},nk=Li.flatMap(n=>{const o=ls(Ba(n,"ja"));return o.ok?[{key:n,diagram:o.diagram}]:[]}),ak=n=>nk.filter(({diagram:o})=>n.kinds.includes(o.kind)&&n.words.some(c=>tk[c]?.(o)===!0)).map(({key:o,diagram:c})=>({key:o,kind:c.kind})),Ng=n=>{const[o,c=""]=n.split(":");return o==="attr"?`[${c.split(".")[1]??c}: …]`:n==="edge:before-step"?"->":c};function sk({lang:n}){const o=xt[n],c=o.site.catalog,u=d=>v.jsxs("header",{className:"catalog-section-head",children:[v.jsx("h2",{className:"catalog-section-title",children:c.sections[d].title}),v.jsx("p",{className:"catalog-section-lead",children:c.sections[d].lead})]});return v.jsxs("div",{className:"catalog-page","data-catalog":"index",children:[v.jsxs("div",{className:"catalog-hero",children:[v.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":c.crumb,children:[v.jsx("a",{href:Tt.home,onClick:d=>Ot(d),children:o.site.nav.home}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:o.site.screens.catalog.title})]}),v.jsx("h1",{className:"catalog-title",children:o.site.screens.catalog.title}),v.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:c.lead(Mi.length,wn.length,Li.length)})]}),v.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"parts",children:[u("parts"),v.jsx("div",{className:"catalog-part-grid",children:Mi.filter(Dd).map(d=>v.jsx(Nd,{part:d,lang:n},d.id))})]}),v.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"kind-parts",children:[u("kind-parts"),v.jsx("div",{className:"catalog-part-grid",children:Mi.filter(d=>!Dd(d)).map(d=>v.jsx(Nd,{part:d,lang:n},d.id))})]}),v.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"kinds",children:[u("kinds"),v.jsx("div",{className:"catalog-index-grid",children:wn.map((d,a)=>v.jsxs("a",{className:"catalog-index-card","data-catalog":"card",href:`${Tt.catalog}/${d}`,onClick:r=>Ot(r),children:[v.jsxs("div",{className:"catalog-index-card-top",children:[v.jsxs("div",{className:"catalog-index-card-head",children:[v.jsx("span",{className:"catalog-index-card-no","data-catalog":"card-no",children:String(a+1).padStart(2,"0")}),v.jsx("span",{className:"catalog-index-card-count","data-catalog":"card-count",children:c.count(Sg(d).length)})]}),v.jsx("h2",{className:"catalog-index-card-title",children:o.shelf.kinds[d]}),v.jsx("p",{className:"catalog-index-card-desc","data-catalog":"card-desc",children:c.kinds[d]})]}),v.jsx("span",{className:"catalog-index-card-link","data-catalog":"card-open",children:c.open})]},d))})]})]})}function Nd({part:n,lang:o,name:c="part-card"}){const u=xt[o],d=u.site.catalog;return v.jsxs("a",{className:"catalog-part-card","data-catalog":c,"data-part":n.id,href:`${Tt.catalog}/part/${n.id}`,onClick:a=>Ot(a),children:[v.jsxs("span",{className:"catalog-part-card-head",children:[v.jsx("span",{className:"catalog-part-card-name",children:d.parts[n.id].name}),!Dd(n)&&v.jsx("span",{className:"catalog-part-card-kind",children:d.kindOnly(n.kinds.map(a=>u.shelf.kinds[a]).join("、"))})]}),v.jsx("span",{className:"catalog-part-card-words",children:n.words.map(a=>v.jsx("code",{children:Ng(a)},a))})]})}const ok=11,ik=1.5,jl=1.2,So=[.25,4];function rk(n,o,c,u=ok){if(n.width<=0||n.height<=0||o.width<=0||o.height<=0)return 1;const d=Math.min(n.width/o.width,n.height/o.height),a=c>0?u/c:0;return Math.min(ik,Math.max(a,d))}const zl=(n,o)=>Math.min(So[1],Math.max(So[0],n*o)),$i=n=>Number.parseFloat(n)||0;function Wd(n,o,{palette:c,theme:u,lang:d,onStep:a,fitHeight:r=!1,onPlayer:l}){const[f,p]=Re.useState(null),g=Re.useRef(a),b=Re.useRef(l);return Re.useEffect(()=>{g.current=a,b.current=l}),Re.useEffect(()=>{const w=n.current;if(!w||!o)return;const x=_g(w,o,{palette:c,theme:u,lang:d,onStep:N=>g.current(N),fitHeight:r});b.current?.(x);const _=w.querySelector(".dg-frame"),E=()=>{const N=w.querySelector('svg[data-dragon="figure"]');if(!_||!N||N.dataset.view!=="fixed"){p(null);return}if(_.clientWidth===0)return;const $=getComputedStyle(_),j={width:_.clientWidth-$i($.paddingLeft)-$i($.paddingRight),height:_.clientHeight-$i($.paddingTop)-$i($.paddingBottom)},G=N.viewBox.baseVal,K=N.querySelector(".dg-sn"),q=K?$i(getComputedStyle(K).fontSize):0,U=r?ng:void 0;p({width:G.width,scale:rk(j,{width:G.width,height:G.height},q,U)})},M=new ResizeObserver(E);return _&&M.observe(_),()=>{M.disconnect(),x.destroy(),b.current?.(null)}},[n,o,c,u,d,r]),f}const Tg="(max-width: 439px)";function lk(n){const o=matchMedia(Tg);return o.addEventListener("change",n),()=>o.removeEventListener("change",n)}const ck=()=>matchMedia(Tg).matches;function Mg(){return Re.useSyncExternalStore(lk,ck)}const Dl="site";function Cg(n){const o=ls(n);if(!o.ok)return null;const c=qi(o.diagram);return c.ok?c.diagram:null}function uk(n){const o=decodeURIComponent(location.hash.slice(1));return n.find(c=>c===o)??null}function dk(n,o,c){const u=c.trim().toLowerCase();if(u==="")return!0;const d=rs(n,o);return[d?.title??"",d?.about??"",n].some(a=>a.toLowerCase().includes(u))}function hk({kind:n,lang:o,theme:c,palette:u}){const d=xt[o],a=d.site.catalog,r=Sg(n),[l,f]=Re.useState(""),[p,g]=Re.useState(()=>uk(r)),[b,w]=Re.useState("figure"),[x,_]=Re.useState("notation"),[E,M]=Re.useState(null),[N,$]=Re.useState(!1),j=E?.site===u?E.palette:Dl,G=j===Dl?u:j,K=r.filter(z=>dk(z,o,l)),q=p!==null&&r.includes(p)?p:r[0],U=d.shelf.kinds[n];return v.jsxs("div",{className:"catalog-page","data-catalog":"category",children:[v.jsxs("div",{className:"catalog-hero",children:[v.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":a.crumb,children:[v.jsx("a",{href:Tt.home,onClick:z=>Ot(z),children:d.site.nav.home}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("a",{href:Tt.catalog,onClick:z=>Ot(z),children:d.site.screens.catalog.title}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:U})]}),v.jsx("h1",{className:"catalog-title",children:U}),v.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:a.kinds[n]}),v.jsxs("div",{className:"catalog-meta",children:[v.jsx("span",{className:"catalog-count","data-catalog":"count",children:a.total(r.length)}),K.length!==r.length&&v.jsx("span",{className:"catalog-count catalog-count-filter",children:a.showing(K.length)})]})]}),v.jsxs("div",{className:"catalog-body",children:[v.jsxs("aside",{className:"catalog-sidebar","data-catalog":"sidebar","aria-label":a.list,children:[v.jsxs("div",{className:"catalog-search-wrap",children:[v.jsx("span",{className:"catalog-search-icon","aria-hidden":"true"}),v.jsx("input",{type:"text",className:"catalog-search","data-catalog":"search",placeholder:a.search,"aria-label":a.searchLabel,value:l,onChange:z=>f(z.target.value)}),l!==""&&v.jsx("button",{type:"button",className:"catalog-search-clear","data-catalog":"search-clear","aria-label":a.clearSearch,onClick:()=>f(""),children:"×"})]}),v.jsx("div",{className:"catalog-list",role:"list",children:K.length===0?v.jsx("p",{className:"catalog-list-empty","data-catalog":"empty",children:a.nothing}):K.map(z=>v.jsx("button",{type:"button",role:"listitem",className:"catalog-list-item","data-catalog":"item","aria-current":z===q?"true":void 0,onClick:()=>g(z),children:rs(z,o)?.title??z},z))})]}),v.jsx("section",{className:"catalog-preview","data-catalog":"preview","aria-label":a.preview,children:q!==void 0&&v.jsx(pk,{sample:q,lang:o,theme:c,palette:G,choice:j,onChoice:z=>M(z===Dl?null:{site:u,palette:z}),view:b,onView:w,source:x,onSource:_,onExpand:()=>$(!0)},q)})]}),v.jsxs("section",{className:"catalog-section catalog-uses","data-catalog":"uses","aria-label":a.uses,children:[v.jsxs("header",{className:"catalog-section-head",children:[v.jsx("h2",{className:"catalog-section-title",children:a.uses}),v.jsx("p",{className:"catalog-section-lead",children:a.usesLead})]}),v.jsx("div",{className:"catalog-part-grid",children:K6(n).map(z=>v.jsx(Nd,{part:z,lang:o,name:"uses-part"},z.id))})]}),N&&q!==void 0&&v.jsx(fk,{sample:q,lang:o,theme:c,palette:G,onClose:()=>$(!1)})]})}function pk({sample:n,lang:o,theme:c,palette:u,choice:d,onChoice:a,view:r,onView:l,source:f,onSource:p,onExpand:g}){const b=xt[o],w=b.site.catalog,x=Ba(n,o),_=rs(n,o),E=_?.title??n,M=Re.useMemo(()=>Cg(x),[x]),N=Re.useRef(null),[$,j]=Re.useState(0),[G,K]=Re.useState(1),[q,U]=Re.useState(!1),z=Mg(),Q=Wd(N,M,{palette:u,theme:c,lang:o,onStep:j});Re.useEffect(()=>{if(!q)return;const Y=window.setTimeout(()=>U(!1),1600);return()=>window.clearTimeout(Y)},[q]);const re=M?.steps.length??0,ue=M?.steps[Math.min($,re-1)],he=re>1&&ue!==void 0,fe=Q?zl(Q.scale,G):null,Ce=Q!==null&&r==="figure",$e=fe===null||!Ce?"—":`${Math.round(fe*100)}%`,C=Y=>{Q&&K(zl(Q.scale,G*Y)/Q.scale)},S=f==="notation"?x:M?JSON.stringify(M,null,2):"",F=()=>{navigator.clipboard?.writeText(S).then(()=>U(!0),()=>{})};return v.jsxs("article",{className:"catalog-preview-card",children:[v.jsxs("header",{className:"catalog-preview-head",children:[v.jsx("h2",{className:"catalog-preview-title",children:E}),_?.about&&v.jsx("p",{className:"catalog-preview-sub","data-catalog":"about",children:_.about})]}),v.jsxs("div",{className:"catalog-preview-tabs",children:[v.jsx("div",{className:"catalog-tablist",role:"tablist","aria-label":w.views,children:["figure","code"].map(Y=>v.jsx("button",{type:"button",role:"tab",className:"catalog-preview-tab","data-catalog":`tab-${Y}`,"aria-selected":r===Y,onClick:()=>l(Y),children:Y==="figure"?w.figure:w.code},Y))}),v.jsxs("div",{className:"catalog-preview-actions",children:[v.jsxs("label",{className:"catalog-option",children:[v.jsx("span",{className:"catalog-option-label",children:b.palette}),v.jsx("span",{className:"catalog-select-field",children:v.jsxs("select",{className:"catalog-select","data-catalog":"palette",value:d,onChange:Y=>a(Y.target.value),children:[v.jsx("option",{value:Dl,children:w.sameAsSite}),Object.values(Ta).map(Y=>v.jsx("option",{value:Y.id,children:b.paletteNames[Y.id]??Y.name},Y.id))]})})]}),v.jsxs("div",{className:"catalog-zoom",role:"group","aria-label":b.stage.zoom,children:[v.jsx(yd,{name:"zoom-out",icon:"zoom-out",label:b.stage.zoomOut,disabled:!Ce||fe===So[0],onClick:()=>C(1/jl)}),z?v.jsx("button",{type:"button",className:"catalog-zoom-btn catalog-zoom-fit","data-catalog":"zoom-level","aria-label":`${b.stage.fit} (${$e})`,title:b.stage.fit,disabled:!Ce,onClick:()=>K(1),children:$e}):v.jsx("span",{className:"catalog-zoom-value","data-catalog":"zoom-level",children:$e}),v.jsx(yd,{name:"zoom-in",icon:"zoom-in",label:b.stage.zoomIn,disabled:!Ce||fe===So[1],onClick:()=>C(jl)}),!z&&v.jsx(yd,{name:"fit",icon:"fit",label:b.stage.fit,disabled:!Ce,onClick:()=>K(1)})]}),v.jsxs("button",{type:"button",className:"catalog-expand-btn","data-catalog":"expand","aria-label":w.expandLabel(E),onClick:g,children:[v.jsx("span",{className:"pg-icon","data-icon":"fullscreen","aria-hidden":"true"}),v.jsx("span",{children:w.expand})]})]})]}),v.jsxs("div",{className:"catalog-preview-stage pg-figure","data-catalog":"stage","data-phased":he?"on":void 0,hidden:r!=="figure",style:Q&&fe!==null?{"--fig-w":`${Q.width*fe}px`}:void 0,children:[he&&v.jsxs("p",{className:"pg-phase","data-catalog":"phase-badge",children:[v.jsx("span",{className:"pg-phase-dot","aria-hidden":"true"}),b.stage.phase($+1,re,ue.title)]}),v.jsx("div",{className:"pg-player",ref:N})]}),r==="figure"&&(he||ue?.body)&&v.jsxs("div",{className:"catalog-preview-note",children:[he&&v.jsx("div",{className:"pg-progress","data-catalog":"progress","aria-hidden":"true",children:M?.steps.map((Y,oe)=>v.jsx("span",{className:"pg-progress-seg","data-catalog":"progress-seg","data-done":oe<=$},`${oe}-${Y.title}`))}),ue?.body&&v.jsx("p",{className:"catalog-step-note","data-catalog":"step-note",children:ue.body})]}),v.jsxs("div",{className:"catalog-source","data-catalog":"source",role:"region",hidden:r!=="code","aria-label":w.source,children:[v.jsxs("div",{className:"catalog-source-bar",children:[v.jsx("div",{className:"catalog-source-tabs",role:"group",children:["notation","json"].map(Y=>v.jsx("button",{type:"button",className:"catalog-source-tab","data-catalog":`source-${Y}`,"aria-pressed":f===Y,onClick:()=>p(Y),children:Y==="notation"?b.notation:"JSON"},Y))}),v.jsxs("button",{type:"button",className:"catalog-source-copy","data-catalog":"copy",onClick:F,children:[v.jsx("span",{className:"catalog-copy-icon","aria-hidden":"true"}),v.jsx("span",{"aria-live":"polite",children:q?w.copied:w.copy})]})]}),v.jsx("pre",{className:"catalog-source-code","data-catalog":"source-code",children:v.jsx("code",{children:S})})]}),v.jsx("footer",{className:"catalog-preview-foot",children:v.jsx("a",{className:"catalog-preview-link","data-catalog":"open-editor",href:`${Tt.editor}${Qd(x)}`,onClick:Y=>Ot(Y),children:w.openEditor})})]})}function yd({name:n,icon:o,label:c,disabled:u,onClick:d}){return v.jsx("button",{type:"button",className:"catalog-zoom-btn","data-catalog":n,"aria-label":c,title:c,disabled:u,onClick:d,children:v.jsx("span",{className:"pg-icon","data-icon":o,"aria-hidden":"true"})})}function fk({sample:n,lang:o,theme:c,palette:u,onClose:d}){const a=xt[o],r=Ba(n,o),l=rs(n,o),f=Re.useMemo(()=>Cg(r),[r]),p=Re.useRef(null),g=Re.useRef(null),b=Wd(p,f,{palette:u,theme:c,lang:o,onStep:()=>{},fitHeight:!0}),w=Re.useRef(d);return Re.useEffect(()=>{w.current=d}),Re.useEffect(()=>{const x=document.activeElement instanceof HTMLElement?document.activeElement:null;g.current?.focus();const _=M=>{M.key==="Escape"&&w.current()};addEventListener("keydown",_);const E=document.body.style.overflow;return document.body.style.overflow="hidden",()=>{removeEventListener("keydown",_),document.body.style.overflow=E,x?.focus()}},[]),v.jsx("div",{className:"catalog-overlay","data-catalog":"overlay",role:"dialog","aria-modal":"true","aria-labelledby":"catalog-overlay-title",onClick:x=>{x.target===x.currentTarget&&d()},children:v.jsxs("div",{className:"catalog-overlay-card",children:[v.jsxs("div",{className:"catalog-overlay-head",children:[v.jsxs("div",{children:[v.jsx("h2",{className:"catalog-overlay-title",id:"catalog-overlay-title","data-catalog":"overlay-title",children:l?.title??n}),l?.about&&v.jsx("p",{className:"catalog-overlay-desc",children:l.about})]}),v.jsx("button",{ref:g,type:"button",className:"catalog-overlay-close","data-catalog":"overlay-close","aria-label":a.site.catalog.close,onClick:d,children:"×"})]}),v.jsx("div",{className:"catalog-overlay-stage pg-figure",style:b?{"--fig-w":`${b.width*b.scale}px`}:void 0,children:v.jsx("div",{className:"pg-player",ref:p})})]})})}function mk(n){let o;try{o=JSON.parse(n)}catch{return null}const c=qi(o);return c.ok?c.diagram:null}function gk(n){const o=ls(n);return o.ok?o.diagram:null}function Vl({notation:n,lang:o,theme:c,palette:u,whole:d=!1,json:a=!1,onStep:r,className:l}){const f=Re.useRef(null),p=Re.useMemo(()=>{const b=a?mk(n):gk(n);return b?d?{...b,view:"fixed"}:b:null},[n,d,a]),g=Re.useRef(r);return Re.useEffect(()=>{g.current=r}),Re.useEffect(()=>{const b=f.current;if(!b||!p)return;const w=_g(b,p,{palette:u,theme:c,lang:o,onStep:x=>g.current?.(x)});return()=>w.destroy()},[p,u,c,o]),v.jsx("div",{ref:f,className:l})}function yk({part:n,lang:o,theme:c,palette:u}){const d=xt[o],a=d.site.catalog,r=a.parts[n.id];return v.jsxs("div",{className:"catalog-page","data-catalog":"part",children:[v.jsxs("div",{className:"catalog-hero",children:[v.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":a.crumb,children:[v.jsx("a",{href:Tt.home,onClick:l=>Ot(l),children:d.site.nav.home}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("a",{href:Tt.catalog,onClick:l=>Ot(l),children:d.site.screens.catalog.title}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:r.name})]}),v.jsx("h1",{className:"catalog-title",children:r.name}),v.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:r.desc}),v.jsxs("dl",{className:"catalog-part-facts",children:[v.jsxs("div",{className:"catalog-part-fact",children:[v.jsx("dt",{children:a.partKinds}),v.jsx("dd",{className:"catalog-part-kinds","data-catalog":"part-kinds",children:n.kinds.map(l=>v.jsx("a",{href:`${Tt.catalog}/${l}`,onClick:f=>Ot(f),children:d.shelf.kinds[l]},l))})]}),v.jsxs("div",{className:"catalog-part-fact",children:[v.jsx("dt",{children:a.words}),v.jsx("dd",{className:"catalog-part-words","data-catalog":"part-words",children:n.words.map(l=>v.jsx("code",{children:Ng(l)},l))})]})]})]}),v.jsx("div",{className:"catalog-part-figures","data-count":n.kinds.length,children:n.kinds.map(l=>v.jsx(vk,{part:n,kind:l,lang:o,theme:c,palette:u},l))}),n.id==="icon"&&v.jsx(bk,{lang:o}),v.jsxs("section",{className:"catalog-section","data-catalog":"part-samples","aria-label":a.partSamples,children:[v.jsxs("header",{className:"catalog-section-head",children:[v.jsx("h2",{className:"catalog-section-title",children:a.partSamples}),v.jsx("p",{className:"catalog-section-lead",children:a.partSamplesLead})]}),v.jsx("div",{className:"catalog-part-grid",children:ak(n).map(({key:l,kind:f})=>v.jsxs("a",{className:"catalog-part-card","data-catalog":"part-sample","data-sample":l,href:`${Tt.catalog}/${f}#${l}`,onClick:p=>Ot(p),children:[v.jsxs("span",{className:"catalog-part-card-head",children:[v.jsx("span",{className:"catalog-part-card-name",children:rs(l,o)?.title??l}),v.jsx("span",{className:"catalog-part-card-kind",children:d.shelf.kinds[f]})]}),v.jsx("span",{className:"catalog-part-sample-about",children:rs(l,o)?.about})]},l))})]})]})}function bk({lang:n}){const o=xt[n].site.catalog,c=Object.keys(Os).sort();return v.jsxs("section",{className:"catalog-section","data-catalog":"part-icons","aria-label":o.partIcons,children:[v.jsxs("header",{className:"catalog-section-head",children:[v.jsx("h2",{className:"catalog-section-title",children:o.partIcons}),v.jsx("p",{className:"catalog-section-lead",children:o.partIconsLead(c.length)})]}),v.jsx("ul",{className:"catalog-icon-grid",children:c.map(u=>v.jsxs("li",{className:"catalog-icon","data-icon":u,children:[v.jsx("span",{className:"catalog-icon-chip",dangerouslySetInnerHTML:{__html:yx(u)??""}}),v.jsx("code",{className:"catalog-icon-name",children:u})]},u))})]})}function vk({part:n,kind:o,lang:c,theme:u,palette:d}){const a=xt[c],r=a.site.catalog,l=I6(n.id,o,c);return v.jsxs("section",{className:"catalog-part-figure","data-catalog":"part-figure","data-kind":o,"aria-label":a.shelf.kinds[o],children:[v.jsx("h2",{className:"catalog-part-figure-title",children:a.shelf.kinds[o]}),v.jsx(Vl,{className:"catalog-part-stage",notation:l,lang:c,theme:u,palette:d,whole:!0}),v.jsx("pre",{className:"catalog-part-source","data-catalog":"part-source","aria-label":r.source,children:v.jsx("code",{children:l})}),v.jsx("a",{className:"catalog-preview-link catalog-part-open","data-catalog":"part-open-editor",href:`${Tt.editor}${Qd(l)}`,onClick:f=>Ot(f),children:r.openEditor})]})}const xk=`sequence 注文を受ける

box 客 [note: 注文する人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 台帳 [note: 注文を残す, color: green, icon: db]

step 注文を送る
  say 客が店のアプリに注文を送り、店のアプリが台帳に残す。
  客 -> 店: 注文する
  店 -> 台帳: 残す
`,wk=`sequence Take an order

box customer as Customer [note: places the order, color: slate, icon: user]
box shop as Shop app [note: takes the order, color: blue, icon: app]
box ledger as Ledger [note: keeps the order, color: green, icon: db]

step Send the order
  say The customer sends an order to the shop app, and the shop app keeps it in the ledger.
  customer -> shop: place order
  shop -> ledger: keep
`,kk=`sequence 運ばれる物を見分ける

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
`,Ek=`sequence Tell what travels

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
`,Ak=`sequence 在庫を確かめる

box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 倉庫 [note: 在庫を持つ, color: amber, icon: box]

step 在庫を聞く
  say 店のアプリが倉庫に在庫を聞き、倉庫は棚を数えてから答える。
  店 -> 倉庫: 在庫はあるか
  act 倉庫: 棚を数える
  倉庫 -> 店: 3 個ある
`,_k=`sequence Check the stock

box shop as Shop app [note: takes the order, color: blue, icon: app]
box warehouse as Warehouse [note: holds the stock, color: amber, icon: box]

step Ask for stock
  say The shop app asks the warehouse for stock, and the warehouse counts the shelf before it answers.
  shop -> warehouse: in stock?
  act warehouse: count the shelf
  warehouse -> shop: 3 left
`,Sk=`git fix は merge commit で、feature は当て直して取り込む

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
`,$k=`git Merge fix with a merge commit and replay feature

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
`,Dk=`{
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
`,Nk=`{
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
`,Tk=`architecture 店と倉庫をつなぐ

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
`,Mk=`architecture Connect the shop and the warehouse

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
`,Ck=`architecture 注文を倉庫へ回す

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
`,Ok=`architecture Pass orders to the warehouse

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
`,Bk=`sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する]
box アプリ [note: ログインを頼む側]

step ログインを押す
  say 利用者がアプリのログインを押す。
  ブラウザ -> アプリ: GET /login
`,jk=`sequence Ask to sign in

box browser as User's browser [note: operated by the user]
box app as App [note: asks for sign-in]

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
`,zk=`state 注文が届くまでの状態

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
`,Rk=`state States of an order until it arrives

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
`,qk=`sequence 代金を払う

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
`,Fk=`sequence Pay for the order

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
`,Hk=`sequence 注文の状態を追う

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
`,Lk=`sequence Follow the order

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
`,Uk=`time ブロックが確定して戻せなくなるまで

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
`,Pk=`time How a block becomes final

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
`,Gk=`tree 取引が含まれることを確かめる

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
`,Yk=`tree Proving a transaction is included

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
`,Id=`v${"0.43.0".split(".").slice(0,2).join(".")}`,Vk=["start","rules","boxes","edges","regions","state","git","time","tree","steps","strip","carry","json","place","export","migrate"],Xk=["start","boxes","regions","steps","json","export"],Jk={start:{screen:"editor"},rules:{section:"boxes"},boxes:{section:"edges"},edges:{section:"regions"},regions:{kind:"architecture"},state:{kind:"state"},git:{kind:"git"},time:{kind:"time"},tree:{kind:"tree"},steps:{section:"strip"},strip:{kind:"sequence"},carry:{section:"json"},json:{screen:"editor"},place:{section:"export"},export:{screen:"editor"},migrate:{screen:"editor"}},Qk={place:[['import "@cardenelabs/dragon/fonts";','import { mountDiagram, parseNotation } from "@cardenelabs/dragon";',"",'const source = await (await fetch("login.dragon")).text();',"const parsed = parseNotation(source);",'if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\\n"));',"",'const host = document.getElementById("figure");','if (host === null) throw new Error("#figure not found");',"const player = mountDiagram(host, parsed.diagram);"].join(`
`),null,null],export:["npm install @cardenelabs/dragon",`pnpm add -D playwright-core
pnpm exec playwright-core install chromium`,"dragon export login.dragon --out out"]},Nl={ja:{eyebrow:n=>`使い方の案内 · ${n}`,lead:"dragon記法の書き方を 1 枚にまとめた読み物。最初の 5 分で図を動かし、決まり 4 つを押さえてから、箱、線、区画、状態遷移図、枝分かれの図、時間軸の図、木の図、段、帯、運ぶ物の順に記法の要素を掴む。JSON との行き来と、mp4 や GIF への書き出しと、前の形から書き直す対応表もここで扱う。",start:"5 分で始める →",browse:"カタログで図を見る",iconLink:"使える絵柄を部品「絵」の頁で全て見る →",sections:{start:{title:"5 分で動かす",text:["何も入れずに試すなら、編集画面を開く。左の欄に記法を書くと、右にその場で動く図が出る。","記法は行の頭の語で、その行に何を書くかが決まる。最初の行に図の種類と題を書き、`sequence` なら時間の順に箱どうしのやり取りを、`architecture` なら区画に置いた箱のつながりを描く。","次に登場する箱を `box` の行で並べ、`step` の行の下に字下げして、その段で起きることを起きる順に書く。下の例は箱 2 つと段 1 つの、いちばん小さな図になる。"],exit:"編集画面で書いてみる →"},rules:{title:"決まり",text:["dragon記法は、どの行も次の決まり 4 つに従う。決まりを押さえておけば、初めて見る行も形から読める。",'下の例は 4 つの決まりを全部使う。区画を `group` と `end` で囲み、`,` を含む札の値を `"` で囲み、長い本文を `say` の下に字下げして続けている。'],exit:"続き → 箱"},boxes:{title:"箱",text:["箱は `box <名札> as <名前> [note: <下の字>]` で宣言する。名札は線や処理で箱を指す時の呼び名で、図には名前と下の字が出る。`as <名前>` を省くと、名札がそのまま名前になる。",'`[ ]` の中に `color: <色>` を足すと箱の色の役が、`icon: <印>` を足すと名前の横の印が付き、2 つ以上は `,` で区切る。色は `blue` や `green` のような色の役の名前で、印は `user` や `db` のような名前で選ぶ。名前に `[` を、値に `,` か `]` を含める時は `"` で囲む。',"`link: <飛び先>` を足すと、描いた図でその箱が飛び先への link になり、箱の中の仕組みを描いた別の図の頁などへ移れる。飛び先は `/` で始まる path か、`http://` か `https://` で始まる URL で書く。","箱は宣言した順に並ぶ。時系列図では箱ごとに縦の線が左から右へ立ち、線はその間を走る。"],exit:"続き → 線"},edges:{title:"線",text:["線は `<名札> -> <名札>: <線の名前>` で書き、段の中に書いた順に走る。名前は省ける。","`act <名札>: <処理の名前>` は、線を引かずに箱の中で行う処理を表す。受け取った物を確かめる、数を数える、のような箱の中だけで済む動きに使う。","線の名前の置き場所は自動で決まる。崩れた時だけ、線の行の終わりに `[side: above]` か `below`、`left`、`right` を足して置く側を指す。"],exit:"続き → 区画"},regions:{title:"区画",text:["構成図では、箱を区画に分けて置ける。区画は `group <名札> as <名前> [note: <添え書き>]` の行で開いて `end` の行で閉じ、その間に書いた `box` の行の箱が区画の中に置かれる。","区画も `color:` と `icon:` を持てる。仕組みの持ち主や置き場所の境目 (チェーンと網、店と倉庫) を見せる時に使う。","同じ区画の箱が離れて並ぶ時は、同じ `group <名札>` をもう一度開いて続きの箱を書く。2 度目は名札だけを書き、名前と札は最初の 1 度だけ書く。"],exit:"構成図の見本を見る →"},state:{title:"状態遷移図",text:["1 つの物が状態を移る様子を段ごとに追う時は、最初の行を `state <題>` にする。箱が状態になり、線は状態から状態への移り変わりになる。札が乗っている状態は光り、札が出た状態には済んだ印が残る。","線の送る側に `start` を書くと始まりの印から出る線に、受ける側に `finish` を書くと終わりの印へ入る線になる。`start` と `finish` は箱の名札に使えない。","最初の `step` の行より前に書いた線は、移れるが今回は通らない道として点線で引き、運ぶ物を走らせない。どの段も辿り着かない状態 (例のキャンセル) は、図の右上の脇道の囲みに入る。"],exit:"状態遷移図の見本を見る →"},git:{title:"枝分かれの図",text:["git の枝に commit を積み、取り込むまでを段ごとに追う時は、最初の行を `git <題>` にする。枝は `branch <枝> [note: <添え書き>]` の行で上から順に宣言し、枝ごとに帯が並ぶ。箱は無くてもよい。","段の中では `commit <名札> on <枝>` で枝の先に commit を積み、`[hash: <hash>, note: <一言>]` で丸の外に hash と一言を添える。`copy <元>` を付けると元の commit を写した当て直しの commit に、`merge <枝>` を付けるとその枝の先端も親に持つ merge commit になる。","`<枝> from <commit>` でその commit から枝を切る。`<札> -> <commit>` は commit を作らずに枝の札か `HEAD` を動かし、`HEAD` を動かすと枝から離れる。どの札からも辿れなくなった commit (例の C) は点線の丸に変わる。"],exit:"枝分かれの図の見本を見る →"},time:{title:"時間軸の図",text:["決まった間隔で進む時間の上で、出来事がどの目盛りで起きたかを段ごとに追う時は、最初の行を `time <題>` にする。`scale <単位> <長さ> <数>` で目盛りを宣言すると、その数の目盛りが軸に等間隔で並ぶ。長さは数と単位 (`ms`、`s`、`min`、`h`、`d`) の組で書き、軸の時刻の字はこの長さから計算する。","`period <名前> <目盛りの数>` は区切りの境ごとに名前と番号を置き、`row <名札> [empty: <目盛り>]` は目盛りごとの印の列を、`point <名札> at <目盛り>` は軸の下の節目を宣言する。`zoom <範囲>` で選んだ目盛りは上の帯に列として並び、宣言した箱が列ごとに同じ並びで出る。線は `[at: <目盛り>]` でその列の箱どうしを結び、`[into: <目盛り>]` を足すと受ける箱を別の列から選ぶ。","段の中では `now -> <目盛り>` で針を進める。針は目盛り 1 つを決まった速さで進み、過ぎた目盛りの印がその時に出るので、秒数は書かない。`mark <列> <範囲> [color: <色>]` は印の色を変え、`span <範囲>: <字>` は軸の下に範囲の括弧を出し、`[shape: box]` を付けると印の列を囲む枠になる。節目の状態は `note` で書き換え、節目どうしにも線を引ける。","中身の帯の欄の名前の後ろに `[meter: <割合>]` を付けると物差しになり、その割合の所に線を引く。`set <欄>: <割合>` を書いた段で、針と一緒に値まで満ちる。"],exit:"時間軸の図の見本を見る →"},tree:{title:"木の図",text:["葉の値を親へ畳み上げて1つの根にまとめる構造を段ごとに追う時は、最初の行を `tree <題>` にする。葉と親は段の中に書き、書いた段で箱が現れる。`leaf <名札> [hash: <値>]` が葉で、書いた順に左から並ぶ。`hash` を書くと箱に値を出し、名札は葉の下の札に出す。","`node <名札> of <子>, <子> [hash: <値>]` が親で、`of` の後ろに組む子を並べる。親は子の真ん中の上に置かれ、親と子を木の線が結ぶ。どの親にも組まれなかった箱が根で、上の真ん中に置かれる。根は1つにする。","親子の箱どうしに `<子> -> <親> [tag: <値>]` の線を書くと、運ぶ物は木の線の上を走り、通った木の線はその色で残る。木の線を運ぶ物が通った段から後は、運ぶ物を送るか受けた箱だけを濃く出す。木の図では `group` を書けず、`box` で宣言した箱は木の右に並ぶ。"],exit:"木の図の見本を見る →"},steps:{title:"段",text:["段は `step <見出し>` の行で区切り、図はこの単位で 1 段ずつ進む。段の中の行は字下げして書き、その段で起きることを語る `say` の行を必ず書く。本文を 2 行以上に分ける時は、`say` だけの行の下に、さらに深く字下げして続ける。","例の `code pay(1200)` の行のように、`code` の行はその段で打つ命令になる。1 つの段に 1 行まで書ける。","`source <名前> [url: <URL>]` の行は、その段の出典になる。1 つの段に何行でも書け、図と見える語りには出さず、読み上げの段の一覧に名前の link で出る。URL の形は箱の飛び先と同じ。","`note <名札>: <字>` は、その段から箱の下の字を書き換える。残高や状態のように、段を追って替わる値を箱の上で見せる。","見せ方は最初の行の終わりに `[view: fixed]` か `[view: follow]` を足して選ぶ。`fixed` は全体を止めて中だけを動かし、`follow` は今動いている所へ寄って動かす。書かなければ、全体を枠に収めた時の字の大きさで決まる。"],exit:"続き → 帯"},strip:{title:"帯",text:["帯は図に添える中身の表で、段を追って替わる値を見せる。`strip <題>: <欄>, <欄>` で欄を宣言する。","段の中で `set <欄>: <値>` と書くとその欄に値が入り、`set <欄> [tag: <札>]` と書くとその欄に札が付く。","認可コードや注文の状態のように、やり取りの間に持ち物が替わる様子を、線とは別に追える。"],exit:"時系列図の見本を見る →"},carry:{title:"運ぶ物",text:["線の上には、何が運ばれたかを示す物が走る。何も書かなければ封筒が走る。","線の行の終わりに `[tag: <値>]` を足すと字を書いた札を、`[carry: coin]` を足すと硬貨を走らせる。番号や証明のような値が動く線には札を、代金やトークンのように価値が動く線には硬貨を使う。","`[carry: none]` は何も走らせない。知らせるだけで物が動かない線に使う。"],exit:"続き → JSON"},json:{title:"JSON",text:["記法と JSON は行き来できる。人は記法で書き、道具や AI は JSON (原本) で持つ。下の例は 5 分で動かすの節の図を JSON で書いた物で、図はその JSON をそのまま読んで描いている。","JSON は `version` に形式の版を持ち、古い版は読む時に今の形へ直す。形は package の `src/schemas/diagram.schema.json` が持つ。","`parseNotation` は記法を JSON に、`printNotation` は JSON を記法に直し、`readDiagram` は JSON を確かめて読む。JSON から記法へ書き戻すと決まった並べ方に整うので、書き手の行の並べ方と `//` で始まる注釈の行は残らない。"],exit:"編集画面で JSON を取り込む →"},place:{title:"頁に置く",text:["自分の頁に図を置く時は、頁で 1 度だけ字の入口 `@cardenelabs/dragon/fonts` を import し、記法を読んだ原本を `mountDiagram` に渡す。下の例は package の README と同じ物。","字の入口は、同梱の 2 つの字 (Noto Sans JP と JetBrains Mono) の CSS を読み込むだけで、何も出さない。図は同梱の字で測った字の幅で組むため、読み込まないと端末の字で描かれ、札から字がはみ出すことがある。CSS と字の file は、束ねる道具 (Vite など) が頁へ運ぶ。","`mountDiagram` が返す `player` で段を動かす (`next`、`prev`、`play`、`pause`、`destroy`)。3 つめの引数には、色味や段が替わった時に呼ぶ関数などの設定 (`PlayerOptions`) を渡す。"],exit:"続き → 書き出し"},export:{title:"書き出し",text:["同じ原本から、mp4、GIF、HTML、PNG を書き出せる。package を入れると `dragon` の命令が使える。","書き出しは画面なしの Chromium で、頁と同じ描画を 1 コマずつ撮る。Chromium を動かす `playwright-core` は、書き出しを使う時だけ入れる。","原本の JSON (`.json`) か記法 (`.dragon`) を渡すと、同じ名前の 4 つの file を書き出す。PNG は最後の段の止め絵になる。"],exit:"編集画面から書き出す →"},migrate:{title:"前の形から書き直す",text:["前の形の記法 (`時系列図` か `構成図` で始まり、段を `#` で区切る形) は読めなくなった。前の形の行を読むと、その行の新しい形を示す誤りで止まる。","前の形を新しい形へ移す命令は無いので、下の表を見て行ごとに書き直す。左が前の形、右が新しい形になる。"],exit:"編集画面で書き直す →"}},cards:{start:"導入なし。編集画面を開いて書くだけで図が動く。",boxes:"名前と下の字と色と印で、登場する物を描く。",regions:"構成図の箱を、持ち主ごとの区画に分けて置く。",steps:"図は段ごとに進み、本文がその段の動きを語る。",json:"人は記法で、道具は JSON で、同じ図を持つ。",export:"同じ図を mp4、GIF、HTML、PNG に書き出す。"},options:{head:["設定","意味"],rows:(n,o)=>[["--out <dir>","書き出す先。無ければ作る (既定は今の dir)"],["--width <px>","枠の幅。見せ方 (`fixed` / `follow`) を選び、`follow` の時の窓の幅になる"],["--palette <名前>",`色味 (${n}、既定は \`${o}\`)`],["--theme <明暗>","`light` か `dark`"],["--lang <言葉>","図の中の字と命令の文の言葉 (`ja` か `en`)。既定は `ja`"],["--fps <数>","mp4 の 1 秒のコマの数 (既定 30)"],["--gif-fps <数>","GIF の 1 秒のコマの数 (既定 10)"],["--format <形>","書き出す形を `,` で区切る (既定 `mp4,gif,html,png`)"]]},rules:["行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる","鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる",'空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `"` で囲む',"入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする"],migration:{head:["前の形","新しい形"],rows:[["`時系列図 <題>`","`sequence <題>`"],["`構成図 <題>`","`architecture <題>`"],["`見せ方 止める`、`見せ方 寄る`","`sequence <題> [view: fixed]`、`sequence <題> [view: follow]`"],["`区画 <名札> = <名前>「<添え書き>」`","`group <名札> as <名前> [note: <添え書き>]` から `end` まで"],["箱の行の `[区画 <名札>]`","`group <名札>` と `end` の間に `box` の行を書く"],["`<名札> = <名前>「<下の字>」`","`box <名札> as <名前> [note: <下の字>]`"],["`[色 <色>]`、`[印 <印>]`","`box <名札> [color: <色>, icon: <印>]`"],["`帯 <題> = <欄>, <欄>`","`strip <題>: <欄>, <欄>`"],["`# <題>`","`step <題>`"],["`> <本文>`","`say <本文>`"],["バッククォートで囲んだ行","`code <命令>`"],["`<名札> -> <名札> : <線の名前>`","`<名札> -> <名札>: <線の名前>`"],["`[札 <値>]`、`[硬貨]`、`[なし]`","`<名札> -> <名札> [tag: <値>]`、`<名札> -> <名札> [carry: coin]`、`<名札> -> <名札> [carry: none]`"],["`[名前 上]`","`<名札> -> <名札> [side: above]`"],["`[名前 下]`","`<名札> -> <名札> [side: below]`"],["`[名前 左]`","`<名札> -> <名札> [side: left]`"],["`[名前 右]`","`<名札> -> <名札> [side: right]`"],["`<名札> : <処理の名前>`","`act <名札>: <処理の名前>`"],["`<名札>「<字>」`","`note <名札>: <字>`"],["`帯 <欄> = <値>`","`set <欄>: <値>`"],["`帯 <欄> [<札>]`","`set <欄> [tag: <札>]`"]]}},en:{eyebrow:n=>`guide • ${n}`,lead:"One page that lays out how to write dragon notation. Get a diagram moving in the first five minutes, learn the four rules, then take in the parts of the notation in order: boxes, lines, regions, state diagrams, git graphs, time diagrams, tree diagrams, steps, the strip and what travels. Going between the notation and JSON, exporting to mp4 or GIF, and a table for rewriting the old form are covered here too.",start:"Start in five minutes →",browse:"Browse the catalog",iconLink:"See every icon on the Icon part page →",sections:{start:{title:"Up and running in five minutes",text:["To try it without installing anything, open the editor. Write notation in the box on the left and a moving diagram appears on the right as you type.","The first word of each line says what the line holds. The first line gives the diagram kind and title: `sequence` draws boxes exchanging messages in time order, and `architecture` draws how boxes placed in regions connect.","Then list the boxes that take part with `box` lines, and indented under a `step` line, write what happens in that step in the order it happens. The example below is the smallest diagram: two boxes and one step."],exit:"Write one in the editor →"},rules:{title:"Rules",text:["Every line of dragon notation follows the four rules below. Once you know them, you can read a line you have not seen before from its shape.",'The example below uses all four rules. It wraps the regions in `group` and `end`, wraps a tag value that contains `,` in `"`, and continues a long body indented under `say`.'],exit:"Next → Boxes"},boxes:{title:"Boxes",text:["Declare a box with `box <id> as <name> [note: <caption>]`. The id is how lines and actions point at the box, and the name and caption are what the diagram shows. Without `as <name>`, the id is the name.",'Inside the `[ ]`, add `color: <color>` to give the box a colour role and `icon: <icon>` to put an icon next to its name, separating two or more with `,`. Colours are role names such as `blue` or `green`, and icons are names such as `user` or `db`. Wrap a name in `"` when it contains `[`, and a value when it contains `,` or `]`.',"Add `link: <target>` and the box becomes a link to that target in the drawn diagram, for example to the page of another diagram that draws what is inside the box. Write the target as a path that starts with `/` or a URL that starts with `http://` or `https://`.","Boxes line up in the order you declare them. In a sequence diagram each box gets a vertical line from left to right, and lines run between them."],exit:"Next → Lines"},edges:{title:"Lines",text:["Write a line as `<id> -> <id>: <label>`. Lines run in the order they are written in the step, and the label can be left out.","`act <id>: <action>` is something a box does inside itself, without drawing a line. Use it for work that stays inside the box, such as checking what arrived or counting.","The label is placed automatically. Only when the placement breaks, add `[side: above]`, `below`, `left` or `right` at the end of the line to say which side it goes."],exit:"Next → Regions"},regions:{title:"Regions",text:["In an architecture diagram, boxes can be placed in regions. Open a region with a `group <id> as <name> [note: <note>]` line and close it with an `end` line, and the boxes on the `box` lines in between go inside it.","Regions can also take `color:` and `icon:`. Use them to show where ownership or placement changes, such as between chains and a network, or a shop and a warehouse.","When boxes of the same region are not next to each other, open the same `group <id>` again and write the rest of its boxes. The second time, write only the id, and give the name and attributes only the first time."],exit:"See the architecture samples →"},state:{title:"State diagrams",text:["To follow one thing as it moves between states step by step, start the first line with `state <title>`. Each box is a state, and each line is a move from one state to another. The state the tag sits on lights up, and a state the tag has left keeps a done mark.","Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark. `start` and `finish` cannot be used as box ids.","Lines written before the first `step` line are paths the diagram could take but does not take this time. They are drawn dotted, and nothing travels on them. A state that no step reaches (Cancelled in the example) goes in the side-path box at the top right."],exit:"See the state diagram samples →"},git:{title:"Git graphs",text:["To follow commits on git branches step by step until they are merged, start the first line with `git <title>`. Declare branches from top to bottom with `branch <branch> [note: <note>]` lines, and each branch gets its own band. Boxes are optional.","Inside a step, `commit <id> on <branch>` adds a commit at the tip of the branch, and `[hash: <hash>, note: <note>]` puts a hash and a short note beside the circle. Add `copy <source>` for a replayed copy of another commit, or `merge <branch>` for a merge commit whose parents include the tip of that branch.","`<branch> from <commit>` cuts a branch at that commit. `<ref> -> <commit>` moves a branch ref or `HEAD` without making a commit, and moving `HEAD` detaches it from its branch. A commit that no ref can reach any more (C in the example) turns into a dotted circle."],exit:"See the git graph samples →"},time:{title:"Time diagrams",text:["To follow, step by step, which tick each event happens on while time moves at a fixed interval, start the first line with `time <title>`. `scale <unit> <length> <count>` declares the ticks, and that many ticks are spaced evenly along the axis. Write the length as a number and a unit (`ms`, `s`, `min`, `h`, `d`); the time labels on the axis are worked out from it.","`period <name> <ticks>` puts a name and a number at each period boundary, `row <id> [empty: <ticks>]` declares a row of marks with one mark per tick, and `point <id> at <tick>` declares a point below the axis. The ticks chosen with `zoom <range>` become columns in the top band, and the declared boxes appear in every column in the same order. A line with `[at: <tick>]` joins the boxes in that column, and `[into: <tick>]` picks the receiving box from another column.","Inside a step, `now -> <tick>` moves the needle. The needle moves one tick at a fixed speed and the marks it passes appear as it goes, so no seconds are written. `mark <row> <range> [color: <color>]` recolors marks, `span <range>: <text>` puts a bracket under the axis, and `[shape: box]` turns it into a frame around the rows. `note` rewrites the state of a point, and lines can join points too.","Add `[meter: <ratio>]` after the name of a strip field to make it a meter with a line at that ratio. In a step with `set <field>: <ratio>`, it fills up to the value along with the needle."],exit:"See the time diagram samples →"},tree:{title:"Tree diagrams",text:["To follow, step by step, how the values of leaves fold up through parents into one root, start the first line with `tree <title>`. Leaves and parents are written inside steps, and each box appears in the step that writes it. `leaf <id> [hash: <value>]` is a leaf, and leaves line up from the left in written order. With `hash`, the box shows the value and the id moves to a card below the leaf.","`node <id> of <child>, <child> [hash: <value>]` is a parent, and the children to join follow `of`. A parent sits above the middle of its children, and tree lines join them. The box that no parent takes is the root and sits at the top in the middle. Keep to one root.","A line `<child> -> <parent> [tag: <value>]` between a parent and a child sends its carrier along the tree line, and the tree line keeps that color once passed. From the step where a carrier first runs a tree line, only the boxes that have sent or received a carrier stay strong. A tree diagram takes no `group`, and boxes declared with `box` sit to the right of the tree."],exit:"See the tree diagram samples →"},steps:{title:"Steps",text:["Steps are separated by `step <heading>` lines, and the diagram moves on one step at a time. Indent the lines inside a step, and every step needs a `say` line that tells what happens in it. To split the body over two or more lines, write `say` alone and continue on lines indented further below it.","A `code` line, like the `code pay(1200)` line in the example, is the command for that step. A step can have at most one.","A `source <name> [url: <URL>]` line is a source for that step. A step can have any number of them. They stay out of the diagram and the shown text, and appear as links named by the source in the step list that screen readers read. The URL takes the same forms as a box link.","`note <id>: <text>` rewrites the caption under a box from that step on. Use it to show a value that changes step by step, such as a balance or a state, right on the box.","Choose the view by adding `[view: fixed]` or `[view: follow]` at the end of the first line. `fixed` keeps the whole diagram still and moves only what is inside, and `follow` moves to where things are happening. Without it, the view is chosen by the text size when the whole diagram fits the frame."],exit:"Next → The strip"},strip:{title:"The strip",text:["The strip is a table that goes with the diagram and shows values that change step by step. Declare its fields with `strip <title>: <field>, <field>`.","Inside a step, `set <field>: <value>` puts a value in a field, and `set <field> [tag: <tag>]` puts a tag on it.","It lets you follow what is held while messages go back and forth, such as an authorization code or the state of an order, apart from the lines."],exit:"See the sequence samples →"},carry:{title:"What travels",text:["Something runs along each line to show what was carried. Without any option, an envelope travels.","Adding `[tag: <value>]` at the end of the line sends a tag with text on it, and `[carry: coin]` sends a coin. Use a tag for lines that move a value such as a number or a proof, and a coin for lines that move worth such as money or tokens.","`[carry: none]` sends nothing. Use it for lines that only tell, with nothing changing hands."],exit:"Next → JSON"},json:{title:"JSON",text:["The notation and JSON convert both ways. People write the notation, and tools and AI keep the JSON (the source). The example below is the diagram from the five-minute section written as JSON, and the diagram is drawn by reading that JSON as it is.","The JSON holds the format version in `version`, and older versions are converted to the current shape when read. The shape is defined in the package's `src/schemas/diagram.schema.json`.","`parseNotation` turns the notation into JSON, `printNotation` turns JSON back into the notation, and `readDiagram` checks and reads JSON. Writing JSON back as notation uses a fixed layout, so the writer's line order and the comment lines that start with `//` are not kept."],exit:"Import JSON in the editor →"},place:{title:"Placing on a page",text:["To place a diagram on your own page, import the font entry `@cardenelabs/dragon/fonts` once on the page, and pass the source read from the notation to `mountDiagram`. The example below is the same as in the package README.","The font entry only loads the CSS for the two bundled fonts (Noto Sans JP and JetBrains Mono) and exports nothing. Diagrams are laid out with character widths measured from the bundled fonts, so without it they are drawn in the device's fonts and text can overflow its labels. A bundler (such as Vite) carries the CSS and font files to the page.","Use the `player` returned by `mountDiagram` to move through the steps (`next`, `prev`, `play`, `pause`, `destroy`). The third argument takes settings such as the palette and a function called when the step changes (`PlayerOptions`)."],exit:"Next → Export"},export:{title:"Export",text:["The same source can be exported to mp4, GIF, HTML and PNG. Install the package and the `dragon` command is available.","Export uses a headless Chromium and captures the same drawing as the page one frame at a time. Install `playwright-core`, which runs Chromium, only when you use export.","Pass the source JSON (`.json`) or the notation (`.dragon`) and it writes four files with the same name. The PNG is a still of the last step."],exit:"Export from the editor →"},migrate:{title:"Rewriting the old form",text:["The old form of the notation (steps separated by `#`, bodies starting with `>`, and the same lines in Japanese words) is no longer read. Reading an old line stops with an error that shows the new form of that line.","There is no command that moves the old form to the new one, so rewrite each line with the table below. The left column is the old form with English words, and the right column is the new form."],exit:"Rewrite in the editor →"}},cards:{start:"Nothing to set up. Open the editor and write.",boxes:"Draw what takes part with a name, a caption, a colour and an icon.",regions:"Put the boxes of an architecture diagram in regions by owner.",steps:"The diagram moves step by step, and the body tells what each step does.",json:"People keep the notation, and tools keep the same diagram as JSON.",export:"Export the same diagram to mp4, GIF, HTML and PNG."},options:{head:["Option","Meaning"],rows:(n,o)=>[["--out <dir>","Where to write. Created if missing (default: the current dir)"],["--width <px>","Frame width. Picks the view (`fixed` / `follow`) and sets the window width for `follow`"],["--palette <name>",`Colours (${n}, default \`${o}\`)`],["--theme <mode>","`light` or `dark`"],["--lang <lang>","Language of the diagram text and command messages (`ja` or `en`). Defaults to `ja`"],["--fps <n>","Frames per second of the mp4 (default 30)"],["--gif-fps <n>","Frames per second of the GIF (default 10)"],["--format <list>","Formats to write, separated by `,` (default `mp4,gif,html,png`)"]]},rules:["The first English word of a line decides its kind. Only arrow lines start with a box id","A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`",'Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`',"The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`"],migration:{head:["Old form","New form"],rows:[["`sequence <title>`, `architecture <title>`","`sequence <title>`, `architecture <title>` (unchanged)"],["`view fixed`, `view follow`","`sequence <title> [view: fixed]`, `sequence <title> [view: follow]`"],['`region <id> = <name> "<note>"`',"`group <id> as <name> [note: <note>]` through `end`"],["`[region <id>]` on a box line","`box` lines between `group <id>` and `end`"],['`<id> = <name> "<caption>"`',"`box <id> as <name> [note: <caption>]`"],["`[color <color>]`, `[icon <icon>]`","`box <id> [color: <color>, icon: <icon>]`"],["`strip <title> = <field>, <field>`","`strip <title>: <field>, <field>`"],["`# <heading>`","`step <heading>`"],["`> <body>`","`say <body>`"],["A line wrapped in backticks","`code <command>`"],["`<id> -> <id> : <label>`","`<id> -> <id>: <label>`"],["`[tag <value>]`, `[coin]`, `[none]`","`<id> -> <id> [tag: <value>]`, `<id> -> <id> [carry: coin]`, `<id> -> <id> [carry: none]`"],["`[label above]`","`<id> -> <id> [side: above]`"],["`[label below]`","`<id> -> <id> [side: below]`"],["`[label left]`","`<id> -> <id> [side: left]`"],["`[label right]`","`<id> -> <id> [side: right]`"],["`<id> : <action>`","`act <id>: <action>`"],['`<id> "<text>"`',"`note <id>: <text>`"],["`strip <field> = <value>`","`set <field>: <value>`"],["`strip <field> [<tag>]`","`set <field> [tag: <tag>]`"]]}}},Zk=Object.assign({"./examples/boxes.dragon":xk,"./examples/boxes.en.dragon":wk,"./examples/carry.dragon":kk,"./examples/carry.en.dragon":Ek,"./examples/edges.dragon":Ak,"./examples/edges.en.dragon":_k,"./examples/git.dragon":Sk,"./examples/git.en.dragon":$k,"./examples/json.en.json":Dk,"./examples/json.json":Nk,"./examples/regions.dragon":Tk,"./examples/regions.en.dragon":Mk,"./examples/rules.dragon":Ck,"./examples/rules.en.dragon":Ok,"./examples/start.dragon":Bk,"./examples/start.en.dragon":jk,"./examples/state.dragon":zk,"./examples/state.en.dragon":Rk,"./examples/steps.dragon":qk,"./examples/steps.en.dragon":Fk,"./examples/strip.dragon":Hk,"./examples/strip.en.dragon":Lk,"./examples/time.dragon":Uk,"./examples/time.en.dragon":Pk,"./examples/tree.dragon":Gk,"./examples/tree.en.dragon":Yk});function Kk(n,o){return Zk[`./examples/${n}${o==="en"?".en":""}.${n==="json"?"json":"dragon"}`]?.trimEnd()}function Di(n){return n.split("`").map((o,c)=>v.jsx(Re.Fragment,{children:c%2===1?v.jsx("code",{children:o}):o},c))}function Wk(n){return"section"in n?`#${n.section}`:"kind"in n?`${Tt.catalog}/${n.kind}`:Tt[n.screen]}function M0({head:n,rows:o,docs:c}){return v.jsxs("table",{className:"docs-options","data-docs":c,children:[v.jsx("thead",{children:v.jsx("tr",{children:n.map(u=>v.jsx("th",{children:u},u))})}),v.jsx("tbody",{children:o.map(([u,d],a)=>v.jsxs("tr",{children:[v.jsx("td",{children:u}),v.jsx("td",{children:d})]},a))})]})}function Ik({id:n,index:o,lang:c,theme:u,palette:d}){const a=Nl[c].sections[n],r=Kk(n,c),l=Qk[n]??[],f=Jk[n],{options:p,rules:g,migration:b}=Nl[c];return v.jsxs("section",{id:n,className:"docs-sec","data-docs":"section",children:[v.jsxs("div",{className:"docs-sec-head",children:[v.jsx("span",{className:"docs-sec-no","data-docs":"section-no",children:String(o+1).padStart(2,"0")}),v.jsx("h2",{children:a.title})]}),a.text.map((w,x)=>v.jsxs(Re.Fragment,{children:[v.jsx("p",{className:"docs-sec-text","data-docs":"text",children:Di(w)}),l[x]!=null&&v.jsx("pre",{className:"docs-command","data-docs":"command",children:v.jsx("code",{children:l[x]})})]},w)),n==="boxes"&&v.jsx("a",{className:"docs-sec-cta","data-docs":"icon-link",href:`${Tt.catalog}/part/icon`,onClick:w=>Ot(w),children:Nl[c].iconLink}),n==="rules"&&v.jsx("ol",{className:"docs-rules","data-docs":"rules",children:g.map(w=>v.jsx("li",{"data-docs":"rule",children:Di(w)},w))}),r!==void 0&&v.jsxs("div",{className:"docs-example","data-docs":"example",children:[v.jsx("pre",{className:"docs-example-code","data-docs":"example-code",children:v.jsx("code",{children:r})}),v.jsx(Vl,{className:"docs-example-figure",notation:r,json:n==="json",lang:c,theme:u,palette:d,whole:!0})]}),n==="export"&&v.jsx(M0,{head:p.head,rows:p.rows(Object.keys(Ta).map(w=>`\`${w}\``).join(" / "),Cl).map(([w,x])=>[v.jsx("code",{children:w},"option"),Di(x)])}),n==="migrate"&&v.jsx(M0,{head:b.head,rows:b.rows.map(([w,x])=>[Di(w),Di(x)]),docs:"migration"}),v.jsx("a",{className:"docs-sec-cta","data-docs":"section-cta",href:Wk(f),onClick:"section"in f?void 0:w=>Ot(w),children:a.exit})]})}function e4({lang:n,theme:o,palette:c}){const u=Nl[n];return Re.useEffect(()=>{const d=decodeURIComponent(location.hash.slice(1));d!==""&&document.getElementById(d)?.scrollIntoView()},[]),v.jsxs("div",{className:"docs",children:[v.jsxs("section",{className:"docs-hero","data-docs":"hero",children:[v.jsx("div",{className:"docs-eyebrow","data-docs":"eyebrow",children:u.eyebrow(Id)}),v.jsx("h1",{children:xt[n].site.screens.docs.title}),v.jsx("p",{className:"docs-lead","data-docs":"lead",children:u.lead}),v.jsxs("div",{className:"docs-cta","data-docs":"cta",children:[v.jsx("a",{className:"docs-btn-primary",href:Tt.editor,onClick:d=>Ot(d),children:u.start}),v.jsx("a",{className:"docs-btn-secondary",href:Tt.catalog,onClick:d=>Ot(d),children:u.browse})]})]}),v.jsx("nav",{className:"docs-features","data-docs":"features",children:Xk.map(d=>v.jsxs("a",{className:"docs-card","data-docs":"card",href:`#${d}`,children:[v.jsx("span",{className:"docs-card-icon","data-icon":d,"aria-hidden":"true"}),v.jsx("span",{className:"docs-card-name","data-docs":"card-name",children:u.sections[d].title}),v.jsx("p",{children:u.cards[d]})]},d))}),v.jsx("div",{className:"docs-sections",children:Vk.map((d,a)=>v.jsx(Ik,{id:d,index:a,lang:n,theme:o,palette:c},d))})]})}const t4=`sequence ログイン処理

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
`,n4=`sequence Sign-in

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
`,a4={ja:t4.trimEnd(),en:n4.trimEnd()},s4="login.dragon",o4=["write","play","share"],i4=/^step(\s|$)/u;function r4(n){const o=n.split(`
`),c=o.flatMap((u,d)=>i4.test(u)?[d]:[]);return c.map((u,d)=>{let a=(c[d+1]??o.length)-1;for(;a>u&&(o[a]??"").trim()==="";)a--;return Array.from({length:a-u+1},(r,l)=>u+l+1)})}function l4(n){let o;return n.map((c,u)=>{const d=c.trim(),a=c.length-c.trimStart().length;if(o!==void 0&&d!==""&&a>o)return"say";o=void 0;const r=d.split(/\s/u)[0];return d.startsWith("//")?"comment":r==="step"?"step":r==="say"?(o=a,"say"):r==="code"?"code":u===0?"head":void 0})}function c4({lang:n,theme:o,palette:c}){const u=xt[n],d=a4[n],[a,r]=Re.useState(0),l=Re.useMemo(()=>{const b=ls(d);return b.ok?b.diagram.steps:[]},[d]),f=new Set(r4(d)[a]??[]),p=Re.useMemo(()=>l4(d.split(`
`)),[d]),g=l[Math.min(a,l.length-1)];return v.jsx("section",{className:"home-demo","data-home":"demo",children:v.jsxs("div",{className:"home-canvas",children:[v.jsxs("div",{className:"home-canvas-bar",children:[v.jsxs("div",{className:"home-canvas-file",children:[v.jsxs("span",{className:"home-dots","aria-hidden":"true",children:[v.jsx("span",{}),v.jsx("span",{}),v.jsx("span",{})]}),v.jsx("span",{className:"home-file","data-home":"demo-file",children:s4})]}),g!==void 0&&v.jsxs("span",{className:"home-phase","data-home":"demo-phase",children:[v.jsx("span",{className:"home-live-dot","aria-hidden":"true"}),u.stage.phase(Math.min(a,l.length-1)+1,l.length,g.title)]})]}),v.jsxs("div",{className:"home-canvas-body",children:[v.jsx("div",{className:"home-code","data-home":"demo-code",children:d.split(`
`).map((b,w)=>v.jsxs("div",{className:"home-code-line","data-line":w+1,"data-current":f.has(w+1),"data-kind":p[w],children:[v.jsx("span",{className:"home-ln","aria-hidden":"true",children:w+1}),v.jsx("span",{className:"home-code-text","data-home":"code-text",children:b})]},w))}),v.jsx(Vl,{className:"home-canvas-stage",notation:d,lang:n,theme:o,palette:c,onStep:r,whole:!0})]})]})})}function u4({lang:n,theme:o,palette:c}){const u=xt[n].site,d=u.home,[a,r,l]=d.title,f=xt[n].shelf.kinds,p=O3.flatMap(g=>{const b=rs(g,n);return b?[{key:g,...b}]:[]});return v.jsxs("div",{className:"home",children:[v.jsxs("section",{className:"home-hero","data-home":"hero",children:[v.jsxs("div",{className:"home-eyebrow",children:[v.jsx("span",{className:"home-chip","data-home":"version",children:Id}),v.jsx("span",{className:"home-chip",children:d.chip(Object.values(f))})]}),v.jsxs("h1",{children:[a,v.jsx("em",{children:r}),l]}),v.jsx("p",{className:"home-lead",children:d.lead}),v.jsxs("div",{className:"home-cta",children:[v.jsx("a",{className:"home-btn-primary",href:Tt.editor,onClick:g=>Ot(g),children:u.openEditor}),v.jsx("a",{className:"home-btn-secondary",href:Tt.docs,onClick:g=>Ot(g),children:d.readDocs})]})]}),v.jsx(c4,{lang:n,theme:o,palette:c}),v.jsxs("section",{className:"home-features","data-home":"features",children:[v.jsxs("div",{className:"home-head",children:[v.jsx("span",{className:"home-head-eyebrow",children:d.features.eyebrow}),v.jsx("h2",{children:d.features.title})]}),v.jsx("div",{className:"home-grid",children:d.features.items.map((g,b)=>v.jsxs("div",{className:"home-feature","data-home":"feature",children:[v.jsx("span",{className:"home-feature-icon","data-home":"feature-icon","data-icon":o4[b],"aria-hidden":"true"}),v.jsx("h3",{children:g.title}),v.jsx("p",{children:g.text})]},g.title))})]}),v.jsxs("section",{className:"home-steps","data-home":"steps",children:[v.jsxs("div",{className:"home-head",children:[v.jsx("span",{className:"home-head-eyebrow",children:d.steps.eyebrow}),v.jsx("h2",{children:d.steps.title})]}),v.jsx("div",{className:"home-grid",children:d.steps.items.map((g,b)=>v.jsxs("div",{className:"home-step","data-home":"step",children:[v.jsx("div",{className:"home-step-no","data-home":"step-no",children:String(b+1).padStart(2,"0")}),v.jsx("h3",{children:g.title}),v.jsx("p",{children:g.text}),b===1&&v.jsx("pre",{className:"home-step-code","data-home":"step-code",children:Sl[n]})]},g.title))})]}),v.jsxs("section",{className:"home-uses","data-home":"uses",children:[v.jsxs("div",{className:"home-head",children:[v.jsx("span",{className:"home-head-eyebrow",children:d.uses.eyebrow}),v.jsx("h2",{children:d.uses.title})]}),v.jsx("div",{className:"home-use-grid",children:p.map(g=>v.jsxs("a",{className:"home-use","data-home":"use",href:`${Tt.catalog}/${g.kind}`,onClick:b=>Ot(b),children:[v.jsx(Vl,{className:"home-use-thumb",notation:Ba(g.key,n),lang:n,theme:o,palette:c,whole:!0}),v.jsxs("div",{className:"home-use-body",children:[v.jsx("span",{className:"home-use-kind","data-home":"use-kind",children:f[g.kind]}),v.jsx("h3",{children:g.title}),v.jsx("p",{"data-home":"use-about",children:g.about})]})]},g.key))}),v.jsx("div",{className:"home-uses-more","data-home":"uses-more",children:v.jsx("a",{className:"home-link",href:Tt.catalog,onClick:g=>Ot(g),children:d.uses.more})})]}),v.jsxs("section",{className:"home-closing","data-home":"closing",children:[v.jsx("h2",{children:d.closing.title}),v.jsx("p",{children:d.closing.lead}),v.jsxs("div",{className:"home-cta",children:[v.jsx("a",{className:"home-btn-primary",href:Tt.editor,onClick:g=>Ot(g),children:u.openEditor}),v.jsx("a",{className:"home-btn-secondary",href:Zd,target:"_blank",rel:"noopener noreferrer",children:"GitHub ↗"})]})]})]})}const C0=["editor","catalog","docs"],d4=4;function h4({lang:n,path:o}){const c=xt[n].site,u=c.notFound,d=c.screens["not-found"].title,a={editor:c.openEditor,catalog:u.catalog,docs:u.docs};return v.jsxs("section",{className:"not-found",children:[v.jsxs("div",{className:"not-found-code","data-not-found":"code","aria-label":"404",children:[v.jsx("span",{"aria-hidden":"true",children:"4"}),v.jsx("span",{className:"not-found-zero","aria-hidden":"true",children:"0"}),v.jsx("span",{"aria-hidden":"true",children:"4"})]}),v.jsx("div",{className:"not-found-ticks","aria-hidden":"true",children:Array.from({length:d4},(r,l)=>v.jsx("span",{},l))}),v.jsxs("h1",{children:[v.jsx("em",{children:u.em}),d.slice(u.em.length)]}),v.jsx("p",{className:"not-found-lead","data-not-found":"lead",children:u.lead(C0.length)}),v.jsx("div",{className:"not-found-cta","data-not-found":"cta",children:C0.map((r,l)=>v.jsx("a",{className:l===0?"not-found-btn-primary":"not-found-btn-secondary",href:Tt[r],onClick:f=>Ot(f),children:a[r]},r))}),v.jsx("p",{className:"not-found-path","data-not-found":"path",children:o})]})}const Og=n=>n.map((o,c)=>({n:o,i:c})).sort((o,c)=>(o.n.line??1/0)-(c.n.line??1/0)||o.i-c.i).map(({n:o})=>o),p4=n=>Og(n.map(o=>({line:o.line,text:o.message})));function f4(n,o){const c=o===void 0?void 0:b4(o);return Og(n.map(u=>{const d=c?y4(c,u.pointer):void 0;return{...d!==void 0?{line:d}:{},text:`${u.pointer||"/"} — ${u.message}`}}))}function m4(n,o){const c=/\bline (\d+)/u.exec(n);if(c)return Number(c[1]);const u=/\bposition (\d+)/u.exec(n);if(u)return o.slice(0,Number(u[1])).split(`
`).length}const g4=n=>n.replaceAll("~","~0").replaceAll("/","~1");function y4(n,o){for(let c=o;;c=c.slice(0,c.lastIndexOf("/"))){const u=n.get(c);if(u!==void 0)return u;if(c==="")return}}function b4(n){const o=new Map;let c=0,u=1;const d=()=>{for(;c<n.length&&/\s/u.test(n[c]??"");)n[c]===`
`&&u++,c++},a=()=>{const l=c;for(c++;c<n.length&&n[c]!=='"';)c+=n[c]==="\\"?2:1;return c++,JSON.parse(n.slice(l,c))},r=(l,f)=>{o.set(l,f);const p=n[c];if(p==="{"||p==="["){c++;for(let g=0;c<n.length;g++){if(d(),n[c]==="}"||n[c]==="]"){c++;return}if(n[c]===","&&(c++,d()),p==="{"){const b=u,w=a();d(),c++,d(),r(`${l}/${g4(w)}`,b)}else r(`${l}/${g}`,u)}return}if(p==='"'){a();return}for(;c<n.length&&!/[\s,\]}]/u.test(n[c]??"");)c++};return d(),r("",u),o}function v4(n){const o=[];for(const c of Li){const u=ls(Ba(c,n),{lang:n});if(!u.ok)continue;const{kind:d,title:a}=u.diagram,r=o.find(l=>l.kind===d);r?r.samples.push({key:c,title:a}):o.push({kind:d,samples:[{key:c,title:a}]})}return o}const Td=/^step(\s|$)/u,bd=/^box\s/u,x4=/^group(\s|$)/u;function w4(n,o){const c=o.length+1,u=new Int32Array((n.length+1)*c),d=(r,l)=>u[r*c+l]??0;for(let r=n.length-1;r>=0;r--)for(let l=o.length-1;l>=0;l--)u[r*c+l]=n[r]===o[l]?d(r+1,l+1)+1:Math.max(d(r+1,l),d(r,l+1));const a=[];for(let r=0,l=0;l<o.length;)r<n.length&&n[r]===o[l]?(r++,l++):r<n.length&&d(r+1,l)>=d(r,l+1)?r++:(a.push(l),l++);return a}function Bg(n,o){const c=ji(n).split(`
`),u=ji(o).split(`
`),d=u.findIndex(r=>Td.test(r)),a={declarations:[],steps:[]};for(const r of w4(c,u)){const l=u[r]??"";l.trim()!==""&&(d>=0&&r>=d?a.steps:a.declarations).push(l)}return a}function k4(n,o){const c=n.replace(/\s+$/u,"").split(`
`);let u=-1;const d=()=>{const p=c.findIndex((b,w)=>w>0&&Td.test(b.trim()));let g=p<0?c.length:p;for(;g>1&&c[g-1]?.trim()==="";)g--;return g},a=(p,g)=>{c.splice(p,0,...g);const b=p+Math.max(g.findIndex(w=>w!==""),0);(u<0||b<u)&&(u=b)},r=o.declarations.some(p=>x4.test(p.trim())),l=r?[]:o.declarations.filter(p=>bd.test(p.trim())),f=r?o.declarations:o.declarations.filter(p=>!bd.test(p.trim()));if(l.length>0){const p=d();let g=-1;for(let b=0;b<p;b++)bd.test(c[b]?.trim()??"")&&(g=b);a(g<0?p:g+1,l)}return f.length>0&&a(d(),r?["",...f]:f),o.steps.length>0&&a(c.length,Td.test(o.steps[0]??"")?["",...o.steps]:o.steps),{text:c.join(`
`),line:u+1}}const E4=["box","region","step","edge","edge-tag","edge-coin","edge-none","edge-below","action","swap","strip"],A4={ja:{box:"箱",newBox:"新しい箱",region:"区画",newRegion:"新しい区画",newStep:"新しい段",stepBody:"この段で起きることを書く。",call:"呼ぶ",handOver:"渡す",key:"鍵",pay:"払う",notify:"知らせる",process:"処理する",rewritten:"書き換えた字",stripTitle:"状態",stripField:"値",stripValue:"1"},en:{box:"box",newBox:"New box",region:"zone",newRegion:"New region",newStep:"New step",stepBody:"Write what happens in this step.",call:"call",handOver:"hand over",key:"key",pay:"pay",notify:"notify",process:"process",rewritten:"Rewritten",stripTitle:"State",stripField:"value",stripValue:"1"}};function jg(n,o){const c=new Set([...n.boxes.map(d=>d.id),...(n.regions??[]).map(d=>d.id)]);let u=1;for(;c.has(`${o}${u}`);)u++;return`${o}${u}`}function Md(n,o,c){const u=jg(n,o.box),d=c??(n.kind==="architecture"?n.boxes.at(-1)?.region:void 0),a={id:u,name:o.newBox,...d?{region:d}:{}},r=n.sequence?{sequence:{lifelines:[...n.sequence.lifelines,u]}}:{};return{id:u,diagram:{...n,boxes:[...n.boxes,a],...r}}}function zg(n,o){const[c,u]=n.boxes;if(c&&u)return{diagram:n,from:c.id,to:u.id};const d=Md(n,o);return{diagram:d.diagram,from:c?.id??d.id,to:d.id}}function Tl(n,o){const c=n.steps.at(-1);return c?{...n,steps:[...n.steps.slice(0,-1),{...c,events:[...c.events,o]}]}:n}const Ni=(n,o,c)=>(u,d)=>{const a=zg(u,d);return Tl(a.diagram,{type:"edge",from:a.from,to:a.to,label:d[o],carry:n,...c?{labelSide:c}:{}})},_4={box:(n,o)=>Md(n,o).diagram,region:(n,o)=>{const c=jg(n,o.region);return Md({...n,regions:[...n.regions??[],{id:c,name:o.newRegion}]},o,c).diagram},step:(n,o)=>{const c=zg(n,o),u={title:o.newStep,body:o.stepBody,events:[{type:"edge",from:c.from,to:c.to,label:o.call,carry:{kind:"envelope"}}]};return{...c.diagram,steps:[...c.diagram.steps,u]}},edge:Ni({kind:"envelope"},"call"),"edge-tag":(n,o)=>Ni({kind:"tag",text:o.key},"handOver")(n,o),"edge-coin":Ni({kind:"coin"},"pay"),"edge-none":Ni({kind:"none"},"notify"),"edge-below":Ni({kind:"envelope"},"call","below"),action:(n,o)=>Tl(n,{type:"action",box:n.boxes[0]?.id??"",label:o.process}),swap:(n,o)=>Tl(n,{type:"swap",box:n.boxes[0]?.id??"",text:o.rewritten}),strip:(n,o)=>{const c=n.strip??{title:o.stripTitle,fields:[o.stripField]};return Tl({...n,strip:c},{type:"strip",field:c.fields[0]??o.stripField,value:o.stripValue})}},Rg=(n,o,c)=>Bg(o,_4[n](o,A4[c])),S4={ja:{title:"題",id:"名札",name:"名前",note:"添え書き",color:"色",icon:"印",link:"飛び先",field:"欄",value:"値",tag:"札",stepTitle:"段の題",stepBody:"段の本文",command:"命令",source:"出典の名前",url:"URL",label:"線の名前",action:"処理の名前",text:"字",memo:"メモ",branch:"枝",hash:"hash",message:"一言",unit:"目盛りの名前",length:"長さ",count:"数",number:"番号",tick:"目盛り",first:"最初",last:"最後",child:"子"},en:{title:"title",id:"id",name:"name",note:"note",color:"color",icon:"icon",link:"link",field:"field",value:"value",tag:"tag",stepTitle:"step title",stepBody:"step body",command:"command",source:"source name",url:"URL",label:"label",action:"action",text:"text",memo:"memo",branch:"branch",hash:"hash",message:"message",unit:"unit",length:"length",count:"count",number:"number",tick:"tick",first:"first",last:"last",child:"child"}};function $4(n){const o=Object.fromEntries(Object.entries(S4[n]).map(([z,Q])=>[z,`<${Q}>`])),c=z=>z,u=z=>c({version:Fl,kind:z,title:o.title,boxes:[],steps:[]}),d=u("sequence"),a={title:o.stepTitle,body:o.stepBody,events:[]},r=c({...d,steps:[a]}),l=(z,Q={})=>c({...d,...Q,steps:[{...a,events:z}]}),f=(z,Q)=>({type:"edge",from:o.id,to:o.id,label:o.label,carry:z,...Q?{labelSide:Q}:{}}),p=z=>z.flatMap(([Q,re])=>{const ue=Bg(Q,re);return[...ue.declarations,...ue.steps]}),g={title:o.title,fields:[o.field]},b=z=>ji(z).split(`
`)[0]??"",w=c({...u("state"),steps:[a]}),x=(z,Q)=>({type:"edge",from:z,to:Q,label:o.label,carry:{kind:"envelope"}}),_=c({...u("git"),git:{branches:[{id:o.branch}]},steps:[a]}),E=z=>c({..._,steps:[{...a,events:z}]}),M=z=>({type:"commit",id:o.id,branch:o.branch,...z}),N={unit:o.unit,length:o.length,count:o.count},$=(z={})=>c({...u("time"),time:{scale:N,rows:[],...z},steps:[a]}),j=$(),G=(z,Q=j)=>c({...Q,steps:[{...a,events:z}]}),K=c({...$({zoom:{from:o.first,to:o.last}}),boxes:[{id:o.id,name:o.id}]}),q=c({...u("tree"),steps:[a]}),U=z=>c({...q,steps:[{...a,events:z}]});return[{id:"kind",lines:[b(d),b(u("architecture")),b(u("state")),b(u("git")),b(u("time")),b(u("tree"))]},{id:"view",lines:p([[d,c({...d,view:"fixed"})],[d,c({...d,view:"follow"})]])},{id:"region",lines:p([[d,c({...d,regions:[{id:o.id,name:o.name,note:o.note,color:o.color,icon:o.icon}],boxes:[{id:o.id,name:o.name,region:o.id}]})]])},{id:"box",lines:p([[d,c({...d,boxes:[{id:o.id,name:o.name,sub:o.note,color:o.color,icon:o.icon,link:o.link}]})]])},{id:"strip",lines:p([[d,c({...d,strip:{title:o.title,fields:[o.field,o.field]}})]])},{id:"step",lines:p([[d,r]])},{id:"code",lines:p([[r,c({...d,steps:[{...a,code:o.command}]})]])},{id:"source",lines:p([[r,c({...d,steps:[{...a,sources:[{name:o.source,url:o.url}]}]})]])},{id:"edge",lines:p([[r,l([f({kind:"envelope"})])]])},{id:"carry",lines:p([{kind:"tag",text:o.value},{kind:"coin"},{kind:"none"}].map(z=>[r,l([f(z)])]))},{id:"side",lines:p(["above","below","left","right"].map(z=>[r,l([f({kind:"envelope"},z)])]))},{id:"start-finish",lines:p([[w,c({...w,steps:[{...a,events:[x("start",o.id),x(o.id,"finish")]}]})]])},{id:"path",lines:p([[w,c({...w,state:{paths:[{from:o.id,to:o.id,label:o.label}]}})]])},{id:"branch",lines:p([[c({...u("git"),steps:[a]}),c({..._,git:{branches:[{id:o.branch,note:o.note}]}})],[_,E([{type:"branch",branch:o.branch,from:o.id}])]])},{id:"commit",lines:p([[_,E([M({hash:o.hash,note:o.message})])]])},{id:"copy",lines:p([[_,E([M({copy:o.id})])]])},{id:"merge",lines:p([[_,E([M({merge:o.branch})])]])},{id:"ref",lines:p([[_,E([{type:"edge",from:o.branch,to:o.id,label:o.label,carry:{kind:"tag",text:o.branch}}])]])},{id:"scale",lines:p([[c({...u("time"),steps:[a]}),$({scale:{...N,from:o.number}})]])},{id:"period",lines:p([[j,$({period:{name:o.name,length:o.count,from:o.number}})]])},{id:"row",lines:p([[j,$({rows:[{id:o.id,name:o.name,color:o.color,empty:[o.tick]}]})]])},{id:"point",lines:p([[j,$({points:[{id:o.id,at:o.tick}]})]])},{id:"zoom",lines:p([[j,$({zoom:{from:o.first,to:o.last}})],[K,G([{type:"edge",from:o.id,to:o.id,carry:{kind:"envelope"},at:o.tick,into:o.tick}],K)]])},{id:"now",lines:p([[j,G([{type:"now",to:o.tick}])]])},{id:"mark",lines:p([[j,G([{type:"mark",row:o.id,from:o.first,to:o.last,color:o.color}])]])},{id:"span",lines:p([[j,G([{type:"span",from:o.first,to:o.last,text:o.text}])],[j,G([{type:"span",from:o.first,to:o.last,text:o.text,shape:"box",color:o.color}])]])},{id:"leaf",lines:p([[q,U([{type:"leaf",id:o.id,hash:o.hash}])]])},{id:"node",lines:p([[q,U([{type:"node",id:o.id,children:[o.child,o.child],hash:o.hash}])]])},{id:"action",lines:p([[r,l([{type:"action",box:o.id,label:o.action}])]])},{id:"swap",lines:p([[r,l([{type:"swap",box:o.id,text:o.text}])]])},{id:"strip-value",lines:p([[c({...r,strip:g}),l([{type:"strip",field:o.field,value:o.value,tag:o.tag}],{strip:g})]])},{id:"comment",lines:[`// ${o.memo}`]}]}const D4=["samples","parts","notation"];function N4({lang:n,base:o,active:c,open:u,onClose:d,onNew:a,onSample:r,onPart:l}){const f=xt[n].shelf,[p,g]=Re.useState("samples"),[b,w]=Re.useState(""),x=Re.useMemo(()=>v4(n),[n]),_=Re.useMemo(()=>o?E4.map(q=>{const U=Rg(q,o,n);return{id:q,lines:[...U.declarations,...U.steps]}}):[],[o,n]),E=Re.useMemo(()=>$4(n),[n]),M=b.trim().toLowerCase(),N=(...q)=>M===""||q.some(U=>U.toLowerCase().includes(M)),$=x.map(q=>({...q,samples:q.samples.filter(U=>N(U.title,U.key))})).filter(q=>q.samples.length>0),j=_.filter(q=>N(f.parts[q.id],...q.lines)),G=E.filter(q=>N(f.syntax[q.id],...q.lines)),K={samples:$.length,parts:j.length,notation:G.length}[p]===0;return v.jsxs("aside",{className:"pg-shelf","data-playground":"shelf","data-open":u?"on":void 0,"aria-label":f.label,onKeyDown:q=>{q.key==="Escape"&&u&&d()},children:[v.jsxs("button",{type:"button",className:"pg-new","data-playground":"new-file",onClick:a,children:[v.jsx("span",{className:"pg-new-plus","aria-hidden":"true",children:"+"}),f.newFile]}),v.jsx("div",{className:"pg-shelf-tabs",role:"tablist",children:D4.map(q=>v.jsx("button",{type:"button",role:"tab","data-playground":`shelf-tab-${q}`,"aria-selected":p===q,onClick:()=>g(q),children:f.tabs[q]},q))}),v.jsx("input",{className:"pg-filter","data-playground":"shelf-filter",type:"search",placeholder:f.filter,"aria-label":f.filterLabel,spellCheck:!1,value:b,onChange:q=>w(q.target.value)}),v.jsxs("div",{className:"pg-shelf-list",role:"tabpanel",children:[p==="samples"&&$.map(q=>v.jsxs("section",{className:"pg-group",children:[v.jsx("h3",{className:"pg-group-title",children:f.kinds[q.kind]}),q.samples.map(U=>v.jsx("button",{type:"button",className:"pg-item","data-playground":`sample-${U.key}`,"aria-current":c===U.key?"true":void 0,title:U.title,onClick:()=>r(U.key),children:U.title},U.key))]},q.kind)),p==="parts"&&v.jsxs(v.Fragment,{children:[v.jsx("p",{className:"pg-shelf-hint",children:f.partsHint}),j.map(q=>v.jsxs("button",{type:"button",className:"pg-entry pg-entry-button","data-playground":`part-${q.id}`,onClick:()=>l(q.id),children:[v.jsx("span",{className:"pg-entry-name",children:f.parts[q.id]}),v.jsx("code",{className:"pg-entry-code",children:q.lines.join(`
`)})]},q.id))]}),p==="notation"&&v.jsxs(v.Fragment,{children:[v.jsx("p",{className:"pg-shelf-hint",children:f.notationHint}),G.map(q=>v.jsxs("div",{className:"pg-entry","data-playground":`syntax-${q.id}`,children:[v.jsx("code",{className:"pg-entry-code",children:q.lines.join(`
`)}),v.jsx("span",{className:"pg-entry-note",children:f.syntax[q.id]})]},q.id))]}),K&&v.jsx("p",{className:"pg-shelf-empty",children:f.nothing})]})]})}const O0=1.15,B0=[.7,1.6],j0=n=>Math.min(B0[1],Math.max(B0[0],n));function Ds({name:n,icon:o,label:c,onClick:u,pressed:d,disabled:a}){return v.jsx("button",{type:"button",className:"pg-tool","data-playground":n,"aria-label":c,title:c,"aria-pressed":d,disabled:a,onClick:u,children:v.jsx("span",{className:"pg-icon","data-icon":o,"aria-hidden":"true"})})}function T4({diagram:n,palette:o,onPalette:c,theme:u,lang:d,kept:a,fileName:r,overlaps:l,jump:f}){const p=xt[d],g=Re.useRef(null),b=Re.useRef(null),[w,x]=Re.useState(0),[_,E]=Re.useState(1),[M,N]=Re.useState(!1),[$,j]=Re.useState(1),[G,K]=Re.useState(!1),q=Mg(),U=Re.useRef(null),z=Wd(b,n,{palette:o,theme:u,lang:d,onStep:x,onPlayer:S=>{U.current=S}});Re.useEffect(()=>{U.current?.mark(l.filter(S=>S.step===w).flatMap(S=>S.spots.map(F=>F.rect)))},[l,w,n,o,u,d]),Re.useEffect(()=>{f&&U.current?.goTo(f.step)},[f]),Re.useEffect(()=>{const S=()=>K(document.fullscreenElement!==null&&document.fullscreenElement===g.current);return document.addEventListener("fullscreenchange",S),()=>document.removeEventListener("fullscreenchange",S)},[]);const Q=()=>{document.fullscreenElement?document.exitFullscreen().catch(()=>{}):g.current?.requestFullscreen().catch(()=>{})},re=n?.steps.length??0,ue=n?.steps[Math.min(w,re-1)],he=re>1&&ue!==void 0,fe=z?zl(z.scale,_):null,Ce=fe===null?"—":`${Math.round(fe*100)}%`,$e=S=>{z&&E(zl(z.scale,_*S)/z.scale)},C={...z&&fe!==null?{"--fig-w":`${z.width*fe}px`}:{},"--say":String($)};return v.jsxs("section",{className:"pg-stage","data-playground":"stage",ref:g,children:[v.jsxs("div",{className:"pg-stage-bar",children:[v.jsxs("span",{className:"pg-live",children:[v.jsx("span",{className:"pg-live-dot","aria-hidden":"true"}),p.stage.live]}),v.jsx("div",{className:"pg-swatches",role:"group","aria-label":p.palette,children:Object.values(Ta).map(S=>v.jsx("button",{type:"button",className:"pg-swatch","data-playground":`palette-${S.id}`,"aria-pressed":o===S.id,"aria-label":p.paletteNames[S.id]??S.name,title:p.paletteNames[S.id]??S.name,onClick:()=>c(S.id),children:v.jsx("span",{className:"pg-swatch-dot","aria-hidden":"true",style:{background:`linear-gradient(135deg, ${S.light.page} 50%, ${S.dark.page} 50%)`,borderColor:S.light["c-blue"]}})},S.id))}),v.jsx("span",{className:"pg-gap"}),v.jsx(Ds,{name:"font-down",icon:"text-down",label:p.stage.fontDown,onClick:()=>j(j0($/O0))}),v.jsx(Ds,{name:"font-up",icon:"text-up",label:p.stage.fontUp,onClick:()=>j(j0($*O0))}),v.jsx(Ds,{name:"grid",icon:"grid",label:p.stage.grid,pressed:M,onClick:()=>N(!M)}),v.jsx(Ds,{name:"fullscreen",icon:"fullscreen",label:p.stage.fullscreen,pressed:G,onClick:Q}),v.jsx("span",{className:"pg-tool-sep","aria-hidden":"true"}),!q&&v.jsx(Ds,{name:"fit",icon:"fit",label:p.stage.fit,disabled:!z,onClick:()=>E(1)}),v.jsx(Ds,{name:"zoom-out",icon:"zoom-out",label:p.stage.zoomOut,disabled:!z||fe===So[0],onClick:()=>$e(1/jl)}),q&&v.jsx("button",{type:"button",className:"pg-tool pg-zoom-fit","data-playground":"zoom-level","aria-label":`${p.stage.fit} (${Ce})`,title:p.stage.fit,disabled:!z,onClick:()=>E(1),children:Ce}),v.jsx(Ds,{name:"zoom-in",icon:"zoom-in",label:p.stage.zoomIn,disabled:!z||fe===So[1],onClick:()=>$e(jl)}),!q&&v.jsx("span",{className:"pg-zoom","data-playground":"zoom-level","aria-label":p.stage.zoom,children:Ce})]}),v.jsxs("div",{className:"pg-figure","data-playground":"figure","data-grid":M?"on":void 0,"data-phased":he?"on":void 0,style:C,children:[he&&v.jsxs("p",{className:"pg-phase","data-playground":"phase-badge",children:[v.jsx("span",{className:"pg-phase-dot","aria-hidden":"true"}),p.stage.phase(w+1,re,ue.title)]}),a&&v.jsxs("p",{className:"pg-kept",children:["↺ ",p.kept]}),v.jsx("div",{className:"pg-player",ref:b})]}),v.jsxs("div",{className:"pg-stage-foot",children:[he&&v.jsx("div",{className:"pg-progress","data-playground":"progress","aria-hidden":"true",children:n?.steps.map((S,F)=>v.jsx("span",{className:"pg-progress-seg","data-playground":"progress-seg","data-done":F<=w},`${F}-${S.title}`))}),v.jsxs("p",{className:"pg-hint",children:[p.exportLead," ",v.jsxs("code",{children:["dragon export ",r]})," ",p.exportTail]})]})]})}const qg=n=>n instanceof Error?n.message:String(n);function Fg(n,o,c){const u=qi(n,{lang:o});if(!u.ok)return{ok:!1,problem:{lang:o,notices:f4(u.errors,c)}};try{Vd(u.diagram)}catch(d){return{ok:!1,problem:{lang:o,notices:[{text:xt[o].cannotDraw(qg(d))}]}}}return{ok:!0,diagram:u.diagram}}function Ti(n,o){const c=ls(n,{lang:o});return c.ok?Fg(c.diagram,o):{ok:!1,problem:{lang:o,notices:p4(c.errors)}}}function z0(n,o){let c;try{c=JSON.parse(n)}catch(u){const d=qg(u),a=m4(d,n);return{ok:!1,problem:{lang:o,notices:[{...a!==void 0?{line:a}:{},text:xt[o].notJson(d)}]}}}return Fg(c,o,n)}const R0=n=>{const o=n.trim();return o===""?_d:o.endsWith(".dragon")?o:`${o}.dragon`},vd=n=>n.replace(/\.dragon$/u,"");function M4(n,o){const c=n.value.split(`
`),u=c.slice(0,o-1).reduce((d,a)=>d+a.length+1,0);n.focus(),n.setSelectionRange(u,u+(c[o-1]?.length??0)),Hg(n,o)}function Hg(n,o){const c=Number.parseFloat(getComputedStyle(n).lineHeight)||20;n.scrollTop=Math.max(0,(o-1)*c-n.clientHeight/2)}const q0=n=>n?JSON.stringify(n,null,2):"",xd=n=>{history.replaceState(null,"",`${location.pathname}${location.search}${n===void 0?"":Qd(n)}`)};function C4(n){const o=$g(location.hash),c=o??Ba(T0,n);return{text:c,example:o===void 0?T0:$l(c)?.key??null,outcome:Ti(c,n)}}function O4({lang:n,theme:o,palette:c,onBeforeLang:u}){const[d]=Re.useState(()=>C4(n)),[a,r]=Re.useState("notation"),[l,f]=Re.useState(d.text),[p,g]=Re.useState(""),[b,w]=Re.useState(d.example),[x,_]=Re.useState(d.outcome.ok?d.outcome.diagram:null),[E,M]=Re.useState(d.outcome.ok?null:d.outcome.problem),[N,$]=Re.useState(null),j=N?.site===c?N.palette:c,[G,K]=Re.useState(!1),[q,U]=Re.useState(vd(d.example===null?_d:`${d.example}.dragon`)),[z,Q]=Re.useState(!1),[re,ue]=Re.useState(null),he=Re.useRef(null),fe=Re.useRef(null),Ce=Re.useRef(null),$e=Re.useRef(null),C=xt[n],S=Re.useMemo(()=>{const k=ls(l,{lang:n});return k.ok?k.diagram:x},[l,n,x]);Re.useLayoutEffect(()=>{const k=$e.current;k===null||!he.current||($e.current=null,Hg(he.current,k))});const F=k=>{_(W=>W&&JSON.stringify(W)===JSON.stringify(k)?W:k),M(null)},Y=k=>{f(k),w($l(k)?.key??null),xd(k);const W=Ti(k,n);W.ok?F(W.diagram):M(W.problem)},oe=k=>{g(k);const W=z0(k,n);if(!W.ok){M(W.problem);return}F(W.diagram);const Z=ji(W.diagram);f(Z),w($l(Z)?.key??null),xd(Z)},D=(k,W,Z,be)=>{const Be=Ti(k,be);f(k),w(W),U(vd(Z)),xd(void 0),Be.ok?(F(Be.diagram),g(q0(Be.diagram))):M(Be.problem)},T=(k,W)=>D(Ba(k,W),k,`${k}.dragon`,W),te=()=>D(Sl[n],null,_d,n),de=async k=>{const W=(await k.text()).replace(/\r\n?/gu,`
`).trimEnd();let Z=W;if(/^\s*\{/u.test(W))try{const be=qi(JSON.parse(W),{lang:n});be.ok&&(Z=ji(be.diagram))}catch{}r("notation"),Y(Z),U(vd(k.name.replace(/\.json$/iu,".dragon")))},ve=()=>{const k=URL.createObjectURL(new Blob([`${l.trimEnd()}
`],{type:"text/plain;charset=utf-8"})),W=document.createElement("a");W.href=k,W.download=R0(q),W.click(),window.setTimeout(()=>URL.revokeObjectURL(k),6e4)},Se=k=>{if(!S)return;const W=k4(l,Rg(k,S,n));a!=="notation"&&r("notation"),Y(W.text),$e.current=W.line},Ne=k=>{G&&K(!1),he.current&&M4(he.current,k)},Ye=k=>{if(r(k),k==="json"){g(q0(x)),M(null);return}const W=Ti(l,n);M(W.ok?null:W.problem)},Fe=k=>{if(a==="json"&&E){const Z=z0(p,k);Z.ok||M(Z.problem);return}const W=$l(l);if(W&&W.lang!==k){T(W.key,k);return}if(l===Sl[n]&&n!==k){D(Sl[k],null,q,k);return}if(a==="notation"&&E){const Z=Ti(l,k);Z.ok||M(Z.problem)}};Re.useLayoutEffect(()=>(u(Fe),()=>u(null)));const ot=a==="notation"?l:p,X=Re.useMemo(()=>x?Vd(x,{lang:n}).overlaps:[],[x,n]),L=ot.split(`
`).length,Ee=new Set(E?.notices.flatMap(k=>k.line===void 0?[]:[k.line])),V=E?xt[E.lang].notices:void 0,ye=k=>(...W)=>{k(...W),Q(!1)};return v.jsxs("div",{className:"pg",children:[v.jsx(N4,{lang:n,base:S,active:b,open:z,onClose:()=>Q(!1),onNew:ye(te),onSample:ye(k=>T(k,n)),onPart:Se}),z&&v.jsx("button",{type:"button",className:"pg-shelf-scrim","aria-label":C.shelf.close,onClick:()=>Q(!1)}),v.jsxs("section",{className:"pg-code","data-playground":"editor-pane","data-folded":G,children:[v.jsxs("div",{className:"pg-bar",children:[v.jsx("button",{type:"button",className:"pg-tool pg-shelf-toggle","data-playground":"shelf-toggle","aria-label":C.shelf.open,title:C.shelf.open,"aria-expanded":z,onClick:()=>Q(!z),children:v.jsx("span",{className:"pg-icon","data-icon":"list","aria-hidden":"true"})}),v.jsx("div",{className:"pg-tabs",role:"tablist",children:["notation","json"].map(k=>v.jsx("button",{type:"button",role:"tab","data-playground":`tab-${k}`,"aria-selected":a===k,onClick:()=>Ye(k),children:k==="notation"?C.notation:"JSON"},k))}),v.jsx("input",{className:"pg-file","data-playground":"file-name","aria-label":C.code.file,title:C.code.file,spellCheck:!1,value:q,onChange:k=>U(k.target.value)}),v.jsx("button",{type:"button",className:"pg-tool","data-playground":"import","aria-label":C.code.import,title:C.code.import,onClick:()=>Ce.current?.click(),children:v.jsx("span",{className:"pg-icon","data-icon":"import","aria-hidden":"true"})}),v.jsx("input",{ref:Ce,type:"file",hidden:!0,"data-playground":"import-file",accept:".dragon,.json,.txt,text/plain,application/json",onChange:k=>{const W=k.target.files?.[0];k.target.value="",W&&de(W)}}),v.jsx("button",{type:"button",className:"pg-tool pg-tool-primary","data-playground":"export","aria-label":C.code.export,title:C.code.export,onClick:ve,children:v.jsx("span",{className:"pg-icon","data-icon":"export","aria-hidden":"true"})}),v.jsxs("button",{type:"button",className:"pg-fold","data-playground":"fold","aria-expanded":!G,onClick:()=>K(!G),children:[G?C.unfold:C.fold," ",G?"▴":"▾"]})]}),v.jsxs("div",{className:"pg-code-body",hidden:G,children:[v.jsx("div",{className:"pg-gutter",ref:fe,"aria-hidden":"true",children:Array.from({length:L},(k,W)=>v.jsx("div",{className:Ee.has(W+1)?"is-error":void 0,children:W+1},W))}),v.jsx("textarea",{ref:he,className:"pg-text","data-playground":"editor","aria-label":C.editor,spellCheck:!1,wrap:"off",value:ot,onChange:k=>a==="notation"?Y(k.target.value):oe(k.target.value),onScroll:k=>{fe.current&&(fe.current.scrollTop=k.currentTarget.scrollTop)}})]}),v.jsx("div",{className:"pg-notices","data-playground":"status","data-state":E?"error":"ok",role:"status",children:E&&V?v.jsxs(v.Fragment,{children:[v.jsx("p",{className:"pg-notices-head",children:v.jsx("span",{className:"pg-notices-badge",children:V.count(E.notices.length)})}),v.jsx("ul",{className:"pg-notice-list",children:E.notices.map((k,W)=>v.jsxs("li",{className:"pg-notice","data-playground":"notice",children:[k.line!==void 0&&v.jsx("button",{type:"button",className:"pg-notice-line","data-playground":"notice-line","aria-label":V.goTo(k.line),onClick:()=>Ne(k.line??1),children:V.line(k.line)}),v.jsx("span",{className:"pg-notice-text",children:k.text})]},`${W}-${k.line??"-"}`))})]}):v.jsxs(v.Fragment,{children:[v.jsxs("p",{className:"pg-ok",children:[v.jsx("span",{"aria-hidden":"true",children:"✓"})," ",x?C.readable(x.boxes.length,x.steps.length):""]}),X.length>0&&v.jsxs("div",{className:"pg-overlaps","data-playground":"overlaps",children:[v.jsx("p",{className:"pg-notices-head",children:v.jsx("span",{className:"pg-overlaps-badge","data-playground":"overlaps-count",children:C.overlaps.count(X.length)})}),v.jsx("ul",{className:"pg-notice-list",children:X.map((k,W)=>v.jsxs("li",{className:"pg-notice","data-playground":"overlap",children:[v.jsx("button",{type:"button",className:"pg-overlap-step","data-playground":"overlap-step","aria-label":C.overlaps.goTo(k.step+1),onClick:()=>ue(Z=>({step:k.step,count:(Z?.count??0)+1})),children:C.overlaps.step(k.step+1)}),v.jsx("span",{className:"pg-notice-text","data-playground":"overlap-text",children:gx(k,n)})]},`${W}-${k.step}`))})]})]})})]}),v.jsx(T4,{diagram:x,palette:j,onPalette:k=>$({site:c,palette:k}),theme:o,lang:n,kept:E!==null&&x!==null,overlaps:X,jump:re,fileName:R0(q)})]})}const B4=`${Zd}/blob/main/CHANGELOG.md`;function j4({lang:n}){const o=xt[n].site,c=o.releaseNotes,u=o.screens["release-notes"].title;return v.jsxs("section",{className:"release","data-release":"hero",children:[v.jsxs("nav",{className:"release-crumb","data-release":"crumb","aria-label":c.crumb,children:[v.jsx("a",{href:Tt.home,onClick:d=>Ot(d),children:o.nav.home}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("span",{className:"release-crumb-here","aria-current":"page",children:u})]}),v.jsx("span",{className:"release-eyebrow","data-release":"eyebrow",children:c.eyebrow(Id)}),v.jsxs("h1",{children:[u.slice(0,u.length-c.accent.length),v.jsx("span",{className:"release-accent",children:c.accent})]}),v.jsx("p",{className:"release-lead","data-release":"lead",children:c.lead}),v.jsx("div",{className:"release-actions","data-release":"actions",children:v.jsxs("a",{className:"release-btn",href:B4,target:"_blank",rel:"noopener noreferrer",children:[v.jsx("span",{children:c.changelog}),v.jsx("span",{className:"release-btn-arrow","aria-hidden":"true",children:"↗"})]})})]})}const z4={paper:"rose",clear:"blue",night:"blue"},Lg="dragon-site-palette";function Ug(n,o){const c=Fd(n)[o];return c[`t-${z4[n]??"blue"}`]??c.ink??""}function R4(n,o){const c=Fd(n)[o],u=d=>c[d]??"";return{"--d-bg":u("page"),"--d-surface":u("surf"),"--d-surface-2":u("bg"),"--d-surface-3":u("sunk"),"--d-border":u("hair"),"--d-border-strong":u("line"),"--d-text-primary":u("ink"),"--d-text-secondary":u("ink2"),"--d-text-muted":u("mute"),"--d-accent":Ug(n,o),"--d-on-accent":u("on-c"),"--d-code-bg":u("sunk"),"--d-err":u("t-rose"),"--d-ok":u("t-green"),"--d-warn":u("t-amber")}}function Pg(n,o){const c=document.documentElement;c.dataset.scheme=o,c.style.colorScheme=o;for(const[u,d]of Object.entries(R4(n,o)))c.style.setProperty(u,d)}function Gg(){try{const n=localStorage.getItem(Lg);return n!==null&&Object.hasOwn(Ta,n)?n:Cl}catch{return Cl}}function q4(n){try{localStorage.setItem(Lg,n)}catch{}}const F0=n=>({"--sw-light":n.light.page,"--sw-dark":n.dark.page,"--sw-accent":Ug(n.id,"light")}),Yg=["home","catalog","editor","docs","release-notes"],F4=n=>n.screen==="category"||n.screen==="part"?"catalog":Yg.find(o=>o===n.screen);function H4({path:n,route:o,lang:c,theme:u,palette:d,onLang:a,onTheme:r,onPalette:l}){const f=xt[c].site,p=xt[c].paletteNames,g=F4(o),[b,w]=Re.useState(null),x=b===n;Re.useEffect(()=>{if(!x)return;const E=M=>{M.key==="Escape"&&w(null)};return addEventListener("keydown",E),()=>removeEventListener("keydown",E)},[x]);const _=(E,M)=>[...Yg.map(N=>v.jsx("a",{className:E,href:Tt[N],"aria-current":N===g?"page":void 0,onClick:$=>Ot($,M),children:f.nav[N]},N)),v.jsx("a",{className:E,href:Zd,target:"_blank",rel:"noopener noreferrer",children:"GitHub ↗"},"github")];return v.jsxs("header",{className:"site-head","data-site":"header",children:[v.jsxs("a",{className:"site-brand",href:Tt.home,onClick:E=>Ot(E),children:[v.jsx("span",{className:"site-mark","data-site":"mark","aria-hidden":"true"}),v.jsx("span",{className:"site-name","data-site":"name",children:"dragon"}),v.jsxs("span",{className:"site-tagline","data-site":"tagline",children:["— ",xt[c].tagline]})]}),v.jsx("nav",{className:"site-nav","data-site":"nav","aria-label":f.navLabel,children:_("site-nav-link")}),v.jsxs("div",{className:"site-actions",children:[v.jsx("div",{className:"site-lang",role:"group","aria-label":xt[c].language,children:["ja","en"].map(E=>v.jsx("button",{type:"button","data-site":`lang-${E}`,"aria-pressed":c===E,onClick:()=>a(E),children:E.toUpperCase()},E))}),v.jsx("div",{className:"site-palette","data-site":"palette",role:"group","aria-label":xt[c].palette,children:Object.values(Ta).map(E=>v.jsx("button",{type:"button",className:"site-palette-btn","data-site":`palette-${E.id}`,"aria-pressed":d===E.id,"aria-label":p[E.id]??E.name,title:p[E.id]??E.name,onClick:()=>l(E.id),children:v.jsx("span",{className:"site-swatch",style:F0(E),"aria-hidden":"true"})},E.id))}),v.jsx("button",{type:"button",className:"site-icon-btn","data-site":"theme","aria-label":u==="dark"?f.toLight:f.toDark,title:u==="dark"?f.toLight:f.toDark,onClick:r,children:u==="dark"?"☀":"☾"}),v.jsx("button",{type:"button",className:"site-icon-btn site-menu-btn","data-site":"menu","aria-label":x?f.closeMenu:f.openMenu,"aria-expanded":x,"aria-controls":"site-sheet",onClick:()=>w(x?null:n),children:x?"×":"≡"}),v.jsx("a",{className:"site-cta","data-site":"open-editor",href:Tt.editor,onClick:E=>Ot(E),children:f.openEditor})]}),x&&v.jsxs(v.Fragment,{children:[v.jsx("div",{className:"site-scrim","aria-hidden":"true",onClick:()=>w(null)}),v.jsxs("div",{className:"site-sheet",id:"site-sheet",children:[v.jsx("nav",{"data-site":"sheet","aria-label":f.navLabel,children:_("site-sheet-link",()=>w(null))}),v.jsxs("div",{className:"site-sheet-palette","data-site":"sheet-palette",role:"group","aria-label":xt[c].palette,children:[v.jsx("span",{className:"site-sheet-label","aria-hidden":"true",children:xt[c].palette}),Object.values(Ta).map(E=>v.jsxs("button",{type:"button",className:"site-sheet-swatch","data-site":`palette-${E.id}`,"aria-pressed":d===E.id,onClick:()=>l(E.id),children:[v.jsx("span",{className:"site-swatch",style:F0(E),"aria-hidden":"true"}),p[E.id]??E.name]},E.id))]}),v.jsx("a",{className:"site-sheet-cta",href:Tt.editor,onClick:E=>Ot(E,()=>w(null)),children:f.openEditor})]})]})]})}const Vg="(prefers-color-scheme: dark)";function L4(n){const o=matchMedia(Vg);return o.addEventListener("change",n),()=>o.removeEventListener("change",n)}const Xg=()=>matchMedia(Vg).matches?"dark":"light";function U4(n){const o=Dg(n);return o.screen==="category"&&!Jd(o.category)?{screen:"not-found"}:o.screen==="part"&&Kd(o.part)===void 0?{screen:"not-found"}:o}function P4(n,o){const c=xt[o];if(n.screen==="home")return null;if(n.screen==="category")return Jd(n.category)?c.shelf.kinds[n.category]:null;if(n.screen==="part"){const u=Kd(n.part);return u?c.site.catalog.parts[u.id].name:null}return c.site.screens[n.screen].title}function G4(){const n=F3(),o=U4(n),c=Kd(o.part),[u,d]=Re.useState(()=>j3(navigator.languages.length>0?navigator.languages:[navigator.language])),[a,r]=Re.useState(null),[l,f]=Re.useState(Gg),p=Re.useSyncExternalStore(L4,Xg),g=a??p,b=Re.useRef(null),w=Re.useCallback(M=>{b.current=M},[]);Re.useLayoutEffect(()=>{const M=document.documentElement;M.lang=u,M.style.setProperty("--sans",`"${zi.sans}"`),M.style.setProperty("--mono",`"${zi.mono}"`)},[u]),Re.useLayoutEffect(()=>{Pg(l,g)},[l,g]);const x=P4(o,u);Re.useLayoutEffect(()=>{document.title=x===null?xt[u].title:`${x} — dragon`},[u,x]);const _=M=>{M!==u&&(b.current?.(M),d(M))},E=M=>{f(M),q4(M)};return v.jsxs("div",{className:"site",children:[v.jsx(H4,{path:n,route:o,lang:u,theme:g,palette:l,onLang:_,onTheme:()=>r(g==="dark"?"light":"dark"),onPalette:E}),v.jsx("main",{className:"site-main","data-site-screen":o.screen,children:o.screen==="home"?v.jsx(u4,{lang:u,theme:g,palette:l}):o.screen==="editor"?v.jsx(O4,{lang:u,theme:g,palette:l,onBeforeLang:w}):o.screen==="catalog"?v.jsx(sk,{lang:u}):o.screen==="category"&&Jd(o.category)?v.jsx(hk,{kind:o.category,lang:u,theme:g,palette:l},o.category):o.screen==="part"&&c?v.jsx(yk,{part:c,lang:u,theme:g,palette:l},c.id):o.screen==="docs"?v.jsx(e4,{lang:u,theme:g,palette:l}):o.screen==="release-notes"?v.jsx(j4,{lang:u}):v.jsx(h4,{lang:u,path:n})})]})}R3();Pg(Gg(),Xg());i3.createRoot(document.getElementById("root")).render(v.jsx(Re.StrictMode,{children:v.jsx(G4,{})}));
