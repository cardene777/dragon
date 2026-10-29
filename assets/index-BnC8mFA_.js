(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const p of document.querySelectorAll('link[rel="modulepreload"]'))u(p);new MutationObserver(p=>{for(const s of p)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&u(r)}).observe(document,{childList:!0,subtree:!0});function c(p){const s={};return p.integrity&&(s.integrity=p.integrity),p.referrerPolicy&&(s.referrerPolicy=p.referrerPolicy),p.crossOrigin==="use-credentials"?s.credentials="include":p.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function u(p){if(p.ep)return;p.ep=!0;const s=c(p);fetch(p.href,s)}})();var Gu={exports:{}},oi={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var qm;function Jb(){if(qm)return oi;qm=1;var n=Symbol.for("react.transitional.element"),o=Symbol.for("react.fragment");function c(u,p,s){var r=null;if(s!==void 0&&(r=""+s),p.key!==void 0&&(r=""+p.key),"key"in p){s={};for(var l in p)l!=="key"&&(s[l]=p[l])}else s=p;return p=s.ref,{$$typeof:n,type:u,key:r,ref:p!==void 0?p:null,props:s}}return oi.Fragment=o,oi.jsx=c,oi.jsxs=c,oi}var Hm;function Kb(){return Hm||(Hm=1,Gu.exports=Jb()),Gu.exports}var v=Kb(),Wb={string:"文字列にする",integer:"整数にする",number:"数にする",object:"オブジェクトにする",array:"配列にする",boolean:"true か false にする",null:"null にする"},Ib={string:"Use a string",integer:"Use an integer",number:"Use a number",object:"Use an object",array:"Use an array",boolean:"Use true or false",null:"Use null"},Um=(n,o)=>`${n} ${o}${n===1?"":"s"}`,ev={additionalProperties:n=>`${n} という欄は書けない`,required:n=>`${n} の欄が要る`,enum:n=>`${n.join(" / ")} のどれかにする`,type:n=>Wb[n]??`${n} にする`,minLength:n=>`${n} 字以上書く`,pattern:n=>n?`${n.space?"空白と ":""}${n.chars.join(" ")} は使えない`:"使えない字が入っている",minItems:n=>`${n} つ以上書く`,minimum:n=>`${n} 以上にする`,const:n=>`${n} にする`,not:n=>n?`${n.field} の欄は kind が ${n.kind} の時だけ書ける`:"この欄の組み合わせは書けない",reserved:n=>`${n.join(" と ")} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,kindOnly:(n,o)=>`${n.join(" と ")} の出来事は kind が ${o} の時だけ書ける`,hex:(n,o)=>`0 から 9 と a から f の字で ${n} から ${o} 字にする`,duration:n=>`数と単位 (${n.join(" / ")}) の組で書く (12s など)`,ratio:"分数 (2/3) か百分率 (97%) で書く",url:"/ で始まる path か、http:// か https:// で始まる URL にする",anyOf:n=>n.length>0?`${n.join(" か ")} の${n.length===2?"どちらか":"どれか"}の欄が要る`:"書ける形のどれにも合わない",oneOf:"書ける形のどれか 1 つだけに合わせる",discriminator:(n,o)=>`${n} は ${o.join(" / ")} のどれかにする`,newer:(n,o)=>`版 ${n} の図は、この道具 (版 ${o}) より新しいので読めない。道具を新しくする`},tv={additionalProperties:n=>`The ${n} field is not allowed`,required:n=>`The ${n} field is required`,enum:n=>`Use one of ${n.join(" / ")}`,type:n=>Ib[n]??`Use ${n}`,minLength:n=>`Write at least ${Um(n,"character")}`,pattern:n=>n?`Cannot contain ${n.space?"spaces or ":""}${n.chars.join(" ")}`:"Contains characters that are not allowed",minItems:n=>`Write at least ${Um(n,"item")}`,minimum:n=>`Use ${n} or greater`,const:n=>`Use ${n}`,not:n=>n?`The ${n.field} field is allowed only when kind is ${n.kind}`:"This combination of fields is not allowed",reserved:n=>`${n.join(" and ")} name the start and end marks of a state diagram and cannot be box ids`,kindOnly:(n,o)=>`${n.join(" and ")} events are allowed only when kind is ${o}`,hex:(n,o)=>`Use ${n} to ${o} characters of 0-9 and a-f`,duration:n=>`Write a number and a unit (${n.join(" / ")}), such as 12s`,ratio:"Write a fraction (2/3) or a percentage (97%)",url:"Use a path that starts with / or a URL that starts with http:// or https://",anyOf:n=>n.length>0?`Write one of the ${n.join(" or ")} fields`:"Does not match any of the allowed shapes",oneOf:"Match exactly one of the allowed shapes",discriminator:(n,o)=>`${n} is one of ${o.join(" / ")}`,newer:(n,o)=>`Version ${n} diagrams are newer than this tool (version ${o}) and cannot be read. Update the tool`},M0={ja:ev,en:tv};function nv(n){let o=0;for(const c of n)o++;return o}var Lm=O0,Yu={properties:{version:{description:"形式の版",type:"integer",minimum:1},kind:{description:"図の種類",enum:["sequence","architecture","state","git","time"]},title:{$ref:"#/definitions/text"},view:{description:"見せ方。書かなければ字の大きさで選ぶ。fixed は全体を止めて中だけ動かし、follow は寄って動かし全体図で今どこかを示す",enum:["fixed","follow"]},regions:{type:"array",items:{$ref:"#/definitions/region"}},boxes:{type:"array",items:{$ref:"#/definitions/box"}},strip:{$ref:"#/definitions/strip"},steps:{type:"array",minItems:1,items:{$ref:"#/definitions/step"}},sequence:{$ref:"#/definitions/sequence"},state:{$ref:"#/definitions/state"},git:{$ref:"#/definitions/git"},time:{$ref:"#/definitions/time"}}};function Kn(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(Array.isArray(n)){const h=n.length;for(let g=0;g<h;g++){let x=n[g];if(x&&typeof x=="object"&&!Array.isArray(x)&&x.events!==void 0){let A=x.events;if(Array.isArray(A)){const w=A.length;for(let D=0;D<w;D++){let T=A[D];const B=r,N=r;if(T&&typeof T=="object"&&!Array.isArray(T)){if(T.type===void 0){const M={};s===null?s=[M]:s.push(M),r++}else if(T.type!==void 0){let M=T.type;if(!(M==="now"||M==="mark"||M==="span")){const z={};s===null?s=[z]:s.push(z),r++}}}var l=N===r;if(l){const M={instancePath:o+"/"+g+"/events/"+D,schemaPath:"#/items/properties/events/items/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[M]:s.push(M),r++}else r=B,s!==null&&(B?s.length=B:s=null);if(T&&typeof T=="object"&&!Array.isArray(T)){if(T.type!==void 0){let M=T.type;const z=r,ae=r;if(!(M==="commit"||M==="branch")){const le={};s===null?s=[le]:s.push(le),r++}var m=ae===r;if(m){const le={instancePath:o+"/"+g+"/events/"+D+"/type",schemaPath:"#/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[le]:s.push(le),r++}else r=z,s!==null&&(z?s.length=z:s=null)}if(T.at!==void 0){const M={instancePath:o+"/"+g+"/events/"+D+"/at",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[M]:s.push(M),r++}if(T.into!==void 0){const M={instancePath:o+"/"+g+"/events/"+D+"/into",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[M]:s.push(M),r++}if(T.color!==void 0){const M={instancePath:o+"/"+g+"/events/"+D+"/color",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[M]:s.push(M),r++}}}}}}}return Kn.errors=s,r===0}function Nn(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)&&n.meters!==void 0){const l={instancePath:o+"/meters",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[l]:s.push(l),r++}return Nn.errors=s,r===0}function Pr(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(Array.isArray(n)){const m=n.length;for(let h=0;h<m;h++){let g=n[h];if(g&&typeof g=="object"&&!Array.isArray(g)&&g.events!==void 0){let x=g.events;if(Array.isArray(x)){const A=x.length;for(let w=0;w<A;w++){let D=x[w];const T=r,B=r;if(D&&typeof D=="object"&&!Array.isArray(D)){if(D.type===void 0){const N={};s===null?s=[N]:s.push(N),r++}else if(D.type!==void 0){let N=D.type;if(!(N==="now"||N==="mark"||N==="span")){const M={};s===null?s=[M]:s.push(M),r++}}}var l=B===r;if(l){const N={instancePath:o+"/"+h+"/events/"+w,schemaPath:"#/items/properties/events/items/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[N]:s.push(N),r++}else r=T,s!==null&&(T?s.length=T:s=null);if(D&&typeof D=="object"&&!Array.isArray(D)){if(D.at!==void 0){const N={instancePath:o+"/"+h+"/events/"+w+"/at",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[N]:s.push(N),r++}if(D.into!==void 0){const N={instancePath:o+"/"+h+"/events/"+w+"/into",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[N]:s.push(N),r++}if(D.color!==void 0){const N={instancePath:o+"/"+h+"/events/"+w+"/color",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[N]:s.push(N),r++}}}}}}}return Pr.errors=s,r===0}var lo={enum:["blue","amber","green","violet","rose","slate","coin"]},Pt=new RegExp("^[^\\s\\[\\]「」=:]+$","u"),xt=nv;function Vr(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.id===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};s===null?s=[l]:s.push(l),r++}if(n.name===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="id"||l==="name"||l==="note"||l==="color"||l==="icon")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.id!==void 0){let l=n.id;if(typeof l=="string"){if(!Pt.test(l)){const m={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.name!==void 0){let l=n.name;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.note!==void 0){let l=n.note;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.color!==void 0){let l=n.color;if(!(l==="blue"||l==="amber"||l==="green"||l==="violet"||l==="rose"||l==="slate"||l==="coin")){const m={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:lo.enum},message:"must be equal to one of the allowed values"};s===null?s=[m]:s.push(m),r++}}if(n.icon!==void 0){let l=n.icon;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/icon",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/icon",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return Vr.errors=s,r===0}var C0=new RegExp("^(/|https?://)","u");function Xr(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.id===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};s===null?s=[l]:s.push(l),r++}if(n.name===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="id"||l==="name"||l==="sub"||l==="color"||l==="icon"||l==="region"||l==="link")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.id!==void 0){let l=n.id;if(typeof l=="string"){if(!Pt.test(l)){const m={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.name!==void 0){let l=n.name;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.sub!==void 0){let l=n.sub;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/sub",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/sub",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.color!==void 0){let l=n.color;if(!(l==="blue"||l==="amber"||l==="green"||l==="violet"||l==="rose"||l==="slate"||l==="coin")){const m={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:lo.enum},message:"must be equal to one of the allowed values"};s===null?s=[m]:s.push(m),r++}}if(n.icon!==void 0){let l=n.icon;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/icon",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/icon",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.region!==void 0){let l=n.region;if(typeof l=="string"){if(!Pt.test(l)){const m={instancePath:o+"/region",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/region",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.link!==void 0){let l=n.link;if(typeof l=="string"){if(!C0.test(l)){const m={instancePath:o+"/link",schemaPath:"#/definitions/url/pattern",keyword:"pattern",params:{pattern:"^(/|https?://)"},message:'must match pattern "^(/|https?://)"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/link",schemaPath:"#/definitions/url/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return Xr.errors=s,r===0}var av=new RegExp("^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$","u");function Qr(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.field===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"field"},message:"must have required property 'field'"};s===null?s=[l]:s.push(l),r++}if(n.line===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"line"},message:"must have required property 'line'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="field"||l==="line")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.field!==void 0){let l=n.field;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/field",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/field",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.line!==void 0){let l=n.line;if(typeof l=="string"){if(!av.test(l)){const m={instancePath:o+"/line",schemaPath:"#/definitions/ratio/pattern",keyword:"pattern",params:{pattern:"^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$"},message:'must match pattern "^([0-9]+/[0-9]+|[0-9]+(\\.[0-9]+)?%)$"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/line",schemaPath:"#/definitions/ratio/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return Qr.errors=s,r===0}function Zr(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.title===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};s===null?s=[l]:s.push(l),r++}if(n.fields===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"fields"},message:"must have required property 'fields'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="title"||l==="fields"||l==="meters")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.title!==void 0){let l=n.title;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.fields!==void 0){let l=n.fields;if(Array.isArray(l)){if(l.length<1){const h={instancePath:o+"/fields",schemaPath:"#/properties/fields/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[h]:s.push(h),r++}const m=l.length;for(let h=0;h<m;h++){let g=l[h];if(typeof g=="string"){if(xt(g)<1){const x={instancePath:o+"/fields/"+h,schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[x]:s.push(x),r++}}else{const x={instancePath:o+"/fields/"+h,schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[x]:s.push(x),r++}}}else{const m={instancePath:o+"/fields",schemaPath:"#/properties/fields/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[m]:s.push(m),r++}}if(n.meters!==void 0){let l=n.meters;if(Array.isArray(l)){if(l.length<1){const h={instancePath:o+"/meters",schemaPath:"#/properties/meters/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[h]:s.push(h),r++}const m=l.length;for(let h=0;h<m;h++)Qr(l[h],{instancePath:o+"/meters/"+h,parentData:l,parentDataProperty:h,rootData:p})||(s=s===null?Qr.errors:s.concat(Qr.errors),r=s.length)}else{const m={instancePath:o+"/meters",schemaPath:"#/properties/meters/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return Zr.errors=s,r===0}function Jr(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.name===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};s===null?s=[l]:s.push(l),r++}if(n.url===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"url"},message:"must have required property 'url'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="name"||l==="url")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.name!==void 0){let l=n.name;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.url!==void 0){let l=n.url;if(typeof l=="string"){if(!C0.test(l)){const m={instancePath:o+"/url",schemaPath:"#/definitions/url/pattern",keyword:"pattern",params:{pattern:"^(/|https?://)"},message:'must match pattern "^(/|https?://)"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/url",schemaPath:"#/definitions/url/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return Jr.errors=s,r===0}var Fm={oneOf:[{description:"線。運ぶ物を載せて送る側から受ける側へ走る",type:"object",additionalProperties:!1,required:["type","from","to","carry"],properties:{type:{const:"edge"},from:{$ref:"#/definitions/id"},to:{$ref:"#/definitions/id"},label:{$ref:"#/definitions/text"},carry:{$ref:"#/definitions/carry"},labelSide:{description:"線の名前を置く側 (寄せの指示)",enum:["above","below","left","right"]},at:{description:"時間軸の図の拡大の帯で、線を引く列の目盛り",$ref:"#/definitions/unit"},into:{description:"時間軸の図の拡大の帯で、受ける箱を選ぶ列の目盛り。書かなければ at の列",$ref:"#/definitions/unit"}}},{description:"箱の中の処理",type:"object",additionalProperties:!1,required:["type","box","label"],properties:{type:{const:"action"},box:{$ref:"#/definitions/id"},label:{$ref:"#/definitions/text"}}},{description:"箱の下の小さな字の書き換え",type:"object",additionalProperties:!1,required:["type","box","text"],properties:{type:{const:"swap"},box:{$ref:"#/definitions/id"},text:{$ref:"#/definitions/text"},color:{description:"時間軸の図の節目の丸の色",$ref:"#/definitions/color"}}},{description:"commit を積む。枝分かれの図だけが書ける。積んだ枝の札と、その枝を指す HEAD が進む。当て直し (copy) は枝の札を動かさず、merge commit (merge) は取り込む枝の先端も親に持つ",type:"object",additionalProperties:!1,required:["type","id","branch"],properties:{type:{const:"commit"},id:{$ref:"#/definitions/id"},branch:{$ref:"#/definitions/id"},copy:{$ref:"#/definitions/id"},merge:{$ref:"#/definitions/id"},hash:{$ref:"#/definitions/hash"},note:{$ref:"#/definitions/text"}}},{description:"枝を切る。枝分かれの図だけが書ける。枝の札を from の commit へ置き、HEAD をその枝へ移す",type:"object",additionalProperties:!1,required:["type","branch","from"],properties:{type:{const:"branch"},branch:{$ref:"#/definitions/id"},from:{$ref:"#/definitions/id"}}},{description:"時間軸の図の今の時刻の針を、to の目盛りの終わりまで進める",type:"object",additionalProperties:!1,required:["type","to"],properties:{type:{const:"now"},to:{$ref:"#/definitions/unit"}}},{description:"時間軸の図の印の列 row の、from から to の目盛りの印の色を変える",type:"object",additionalProperties:!1,required:["type","row","from","to","color"],properties:{type:{const:"mark"},row:{$ref:"#/definitions/id"},from:{$ref:"#/definitions/unit"},to:{$ref:"#/definitions/unit"},color:{$ref:"#/definitions/color"}}},{description:"時間軸の図の from から to の目盛りに、括弧と字を出す。shape が box なら印の列を囲み、字を縁の札にする",type:"object",additionalProperties:!1,required:["type","from","to","text"],properties:{type:{const:"span"},from:{$ref:"#/definitions/unit"},to:{$ref:"#/definitions/unit"},text:{$ref:"#/definitions/text"},shape:{enum:["box"]},color:{$ref:"#/definitions/color"}}},{description:"中身の帯の欄の値と札",type:"object",additionalProperties:!1,required:["type","field"],anyOf:[{required:["value"]},{required:["tag"]}],properties:{type:{const:"strip"},field:{$ref:"#/definitions/text"},value:{$ref:"#/definitions/text"},tag:{$ref:"#/definitions/text"}}}]},sv=new RegExp("^[0-9a-f]{4,40}$","u"),ov={properties:{kind:{enum:["envelope","tag","coin","none"]}}};function Kr(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;const l=r;let m=!0;const h=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const w={};s===null?s=[w]:s.push(w),r++}else if(n.kind!==void 0&&n.kind!=="tag"){const w={};s===null?s=[w]:s.push(w),r++}}var g=h===r;r=l,s!==null&&(l?s.length=l:s=null);let x;if(g){const w=r;if(n&&typeof n=="object"&&!Array.isArray(n)&&n.text===void 0){const T={instancePath:o,schemaPath:"#/then/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};s===null?s=[T]:s.push(T),r++}var g=w===r;m=g,x="then"}else{const w=r,D=r,T=r;if(n&&typeof n=="object"&&!Array.isArray(n)&&n.text===void 0){const N={};s===null?s=[N]:s.push(N),r++}var A=T===r;if(A){const N={instancePath:o,schemaPath:"#/else/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[N]:s.push(N),r++}else r=D,s!==null&&(D?s.length=D:s=null);var g=w===r;m=g,x="else"}if(!m){const w={instancePath:o,schemaPath:"#/if",keyword:"if",params:{failingKeyword:x},message:'must match "'+x+'" schema'};s===null?s=[w]:s.push(w),r++}if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const w={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"kind"},message:"must have required property 'kind'"};s===null?s=[w]:s.push(w),r++}for(const w in n)if(!(w==="kind"||w==="text")){const D={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:w},message:"must NOT have additional properties"};s===null?s=[D]:s.push(D),r++}if(n.kind!==void 0){let w=n.kind;if(!(w==="envelope"||w==="tag"||w==="coin"||w==="none")){const D={instancePath:o+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues:ov.properties.kind.enum},message:"must be equal to one of the allowed values"};s===null?s=[D]:s.push(D),r++}}if(n.text!==void 0){let w=n.text;if(typeof w=="string"){if(xt(w)<1){const D={instancePath:o+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[D]:s.push(D),r++}}else{const D={instancePath:o+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[D]:s.push(D),r++}}}else{const w={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[w]:s.push(w),r++}return Kr.errors=s,r===0}function Wr(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};s===null?s=[h]:s.push(h),r++}const m=n.type;if(typeof m=="string")if(m==="edge")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const h={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};s===null?s=[h]:s.push(h),r++}if(n.from===void 0){const h={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};s===null?s=[h]:s.push(h),r++}if(n.to===void 0){const h={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};s===null?s=[h]:s.push(h),r++}if(n.carry===void 0){const h={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"carry"},message:"must have required property 'carry'"};s===null?s=[h]:s.push(h),r++}for(const h in n)if(!(h==="type"||h==="from"||h==="to"||h==="label"||h==="carry"||h==="labelSide"||h==="at"||h==="into")){const g={instancePath:o,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};s===null?s=[g]:s.push(g),r++}if(n.type!==void 0&&n.type!=="edge"){const h={instancePath:o+"/type",schemaPath:"#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue:"edge"},message:"must be equal to constant"};s===null?s=[h]:s.push(h),r++}if(n.from!==void 0){let h=n.from;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.to!==void 0){let h=n.to;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/to",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/to",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.label!==void 0){let h=n.label;if(typeof h=="string"){if(xt(h)<1){const g={instancePath:o+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.carry!==void 0&&(Kr(n.carry,{instancePath:o+"/carry",parentData:n,parentDataProperty:"carry",rootData:p})||(s=s===null?Kr.errors:s.concat(Kr.errors),r=s.length)),n.labelSide!==void 0){let h=n.labelSide;if(!(h==="above"||h==="below"||h==="left"||h==="right")){const g={instancePath:o+"/labelSide",schemaPath:"#/oneOf/0/properties/labelSide/enum",keyword:"enum",params:{allowedValues:Fm.oneOf[0].properties.labelSide.enum},message:"must be equal to one of the allowed values"};s===null?s=[g]:s.push(g),r++}}if(n.at!==void 0){let h=n.at;if(!(typeof h=="number"&&!(h%1)&&!isNaN(h)&&isFinite(h))){const g={instancePath:o+"/at",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[g]:s.push(g),r++}if(typeof h=="number"&&isFinite(h)&&(h<0||isNaN(h))){const g={instancePath:o+"/at",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[g]:s.push(g),r++}}if(n.into!==void 0){let h=n.into;if(!(typeof h=="number"&&!(h%1)&&!isNaN(h)&&isFinite(h))){const g={instancePath:o+"/into",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[g]:s.push(g),r++}if(typeof h=="number"&&isFinite(h)&&(h<0||isNaN(h))){const g={instancePath:o+"/into",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[g]:s.push(g),r++}}}else{const h={instancePath:o,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[h]:s.push(h),r++}else if(m==="action")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const h={instancePath:o,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};s===null?s=[h]:s.push(h),r++}if(n.box===void 0){const h={instancePath:o,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};s===null?s=[h]:s.push(h),r++}if(n.label===void 0){const h={instancePath:o,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"label"},message:"must have required property 'label'"};s===null?s=[h]:s.push(h),r++}for(const h in n)if(!(h==="type"||h==="box"||h==="label")){const g={instancePath:o,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};s===null?s=[g]:s.push(g),r++}if(n.type!==void 0&&n.type!=="action"){const h={instancePath:o+"/type",schemaPath:"#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue:"action"},message:"must be equal to constant"};s===null?s=[h]:s.push(h),r++}if(n.box!==void 0){let h=n.box;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.label!==void 0){let h=n.label;if(typeof h=="string"){if(xt(h)<1){const g={instancePath:o+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}}else{const h={instancePath:o,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[h]:s.push(h),r++}else if(m==="swap")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const h={instancePath:o,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};s===null?s=[h]:s.push(h),r++}if(n.box===void 0){const h={instancePath:o,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};s===null?s=[h]:s.push(h),r++}if(n.text===void 0){const h={instancePath:o,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};s===null?s=[h]:s.push(h),r++}for(const h in n)if(!(h==="type"||h==="box"||h==="text"||h==="color")){const g={instancePath:o,schemaPath:"#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};s===null?s=[g]:s.push(g),r++}if(n.type!==void 0&&n.type!=="swap"){const h={instancePath:o+"/type",schemaPath:"#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue:"swap"},message:"must be equal to constant"};s===null?s=[h]:s.push(h),r++}if(n.box!==void 0){let h=n.box;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.text!==void 0){let h=n.text;if(typeof h=="string"){if(xt(h)<1){const g={instancePath:o+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.color!==void 0){let h=n.color;if(!(h==="blue"||h==="amber"||h==="green"||h==="violet"||h==="rose"||h==="slate"||h==="coin")){const g={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:lo.enum},message:"must be equal to one of the allowed values"};s===null?s=[g]:s.push(g),r++}}}else{const h={instancePath:o,schemaPath:"#/oneOf/2/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[h]:s.push(h),r++}else if(m==="commit")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const h={instancePath:o,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};s===null?s=[h]:s.push(h),r++}if(n.id===void 0){const h={instancePath:o,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};s===null?s=[h]:s.push(h),r++}if(n.branch===void 0){const h={instancePath:o,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"branch"},message:"must have required property 'branch'"};s===null?s=[h]:s.push(h),r++}for(const h in n)if(!(h==="type"||h==="id"||h==="branch"||h==="copy"||h==="merge"||h==="hash"||h==="note")){const g={instancePath:o,schemaPath:"#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};s===null?s=[g]:s.push(g),r++}if(n.type!==void 0&&n.type!=="commit"){const h={instancePath:o+"/type",schemaPath:"#/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue:"commit"},message:"must be equal to constant"};s===null?s=[h]:s.push(h),r++}if(n.id!==void 0){let h=n.id;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.branch!==void 0){let h=n.branch;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/branch",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/branch",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.copy!==void 0){let h=n.copy;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/copy",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/copy",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.merge!==void 0){let h=n.merge;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/merge",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/merge",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.hash!==void 0){let h=n.hash;if(typeof h=="string"){if(!sv.test(h)){const g={instancePath:o+"/hash",schemaPath:"#/definitions/hash/pattern",keyword:"pattern",params:{pattern:"^[0-9a-f]{4,40}$"},message:'must match pattern "^[0-9a-f]{4,40}$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/hash",schemaPath:"#/definitions/hash/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.note!==void 0){let h=n.note;if(typeof h=="string"){if(xt(h)<1){const g={instancePath:o+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}}else{const h={instancePath:o,schemaPath:"#/oneOf/3/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[h]:s.push(h),r++}else if(m==="branch")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const h={instancePath:o,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};s===null?s=[h]:s.push(h),r++}if(n.branch===void 0){const h={instancePath:o,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"branch"},message:"must have required property 'branch'"};s===null?s=[h]:s.push(h),r++}if(n.from===void 0){const h={instancePath:o,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};s===null?s=[h]:s.push(h),r++}for(const h in n)if(!(h==="type"||h==="branch"||h==="from")){const g={instancePath:o,schemaPath:"#/oneOf/4/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};s===null?s=[g]:s.push(g),r++}if(n.type!==void 0&&n.type!=="branch"){const h={instancePath:o+"/type",schemaPath:"#/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue:"branch"},message:"must be equal to constant"};s===null?s=[h]:s.push(h),r++}if(n.branch!==void 0){let h=n.branch;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/branch",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/branch",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.from!==void 0){let h=n.from;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}}else{const h={instancePath:o,schemaPath:"#/oneOf/4/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[h]:s.push(h),r++}else if(m==="now")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const h={instancePath:o,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};s===null?s=[h]:s.push(h),r++}if(n.to===void 0){const h={instancePath:o,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};s===null?s=[h]:s.push(h),r++}for(const h in n)if(!(h==="type"||h==="to")){const g={instancePath:o,schemaPath:"#/oneOf/5/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};s===null?s=[g]:s.push(g),r++}if(n.type!==void 0&&n.type!=="now"){const h={instancePath:o+"/type",schemaPath:"#/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue:"now"},message:"must be equal to constant"};s===null?s=[h]:s.push(h),r++}if(n.to!==void 0){let h=n.to;if(!(typeof h=="number"&&!(h%1)&&!isNaN(h)&&isFinite(h))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[g]:s.push(g),r++}if(typeof h=="number"&&isFinite(h)&&(h<0||isNaN(h))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[g]:s.push(g),r++}}}else{const h={instancePath:o,schemaPath:"#/oneOf/5/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[h]:s.push(h),r++}else if(m==="mark")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const h={instancePath:o,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};s===null?s=[h]:s.push(h),r++}if(n.row===void 0){const h={instancePath:o,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"row"},message:"must have required property 'row'"};s===null?s=[h]:s.push(h),r++}if(n.from===void 0){const h={instancePath:o,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};s===null?s=[h]:s.push(h),r++}if(n.to===void 0){const h={instancePath:o,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};s===null?s=[h]:s.push(h),r++}if(n.color===void 0){const h={instancePath:o,schemaPath:"#/oneOf/6/required",keyword:"required",params:{missingProperty:"color"},message:"must have required property 'color'"};s===null?s=[h]:s.push(h),r++}for(const h in n)if(!(h==="type"||h==="row"||h==="from"||h==="to"||h==="color")){const g={instancePath:o,schemaPath:"#/oneOf/6/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};s===null?s=[g]:s.push(g),r++}if(n.type!==void 0&&n.type!=="mark"){const h={instancePath:o+"/type",schemaPath:"#/oneOf/6/properties/type/const",keyword:"const",params:{allowedValue:"mark"},message:"must be equal to constant"};s===null?s=[h]:s.push(h),r++}if(n.row!==void 0){let h=n.row;if(typeof h=="string"){if(!Pt.test(h)){const g={instancePath:o+"/row",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/row",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.from!==void 0){let h=n.from;if(!(typeof h=="number"&&!(h%1)&&!isNaN(h)&&isFinite(h))){const g={instancePath:o+"/from",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[g]:s.push(g),r++}if(typeof h=="number"&&isFinite(h)&&(h<0||isNaN(h))){const g={instancePath:o+"/from",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[g]:s.push(g),r++}}if(n.to!==void 0){let h=n.to;if(!(typeof h=="number"&&!(h%1)&&!isNaN(h)&&isFinite(h))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[g]:s.push(g),r++}if(typeof h=="number"&&isFinite(h)&&(h<0||isNaN(h))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[g]:s.push(g),r++}}if(n.color!==void 0){let h=n.color;if(!(h==="blue"||h==="amber"||h==="green"||h==="violet"||h==="rose"||h==="slate"||h==="coin")){const g={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:lo.enum},message:"must be equal to one of the allowed values"};s===null?s=[g]:s.push(g),r++}}}else{const h={instancePath:o,schemaPath:"#/oneOf/6/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[h]:s.push(h),r++}else if(m==="span")if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const h={instancePath:o,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};s===null?s=[h]:s.push(h),r++}if(n.from===void 0){const h={instancePath:o,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};s===null?s=[h]:s.push(h),r++}if(n.to===void 0){const h={instancePath:o,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};s===null?s=[h]:s.push(h),r++}if(n.text===void 0){const h={instancePath:o,schemaPath:"#/oneOf/7/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};s===null?s=[h]:s.push(h),r++}for(const h in n)if(!(h==="type"||h==="from"||h==="to"||h==="text"||h==="shape"||h==="color")){const g={instancePath:o,schemaPath:"#/oneOf/7/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};s===null?s=[g]:s.push(g),r++}if(n.type!==void 0&&n.type!=="span"){const h={instancePath:o+"/type",schemaPath:"#/oneOf/7/properties/type/const",keyword:"const",params:{allowedValue:"span"},message:"must be equal to constant"};s===null?s=[h]:s.push(h),r++}if(n.from!==void 0){let h=n.from;if(!(typeof h=="number"&&!(h%1)&&!isNaN(h)&&isFinite(h))){const g={instancePath:o+"/from",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[g]:s.push(g),r++}if(typeof h=="number"&&isFinite(h)&&(h<0||isNaN(h))){const g={instancePath:o+"/from",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[g]:s.push(g),r++}}if(n.to!==void 0){let h=n.to;if(!(typeof h=="number"&&!(h%1)&&!isNaN(h)&&isFinite(h))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[g]:s.push(g),r++}if(typeof h=="number"&&isFinite(h)&&(h<0||isNaN(h))){const g={instancePath:o+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[g]:s.push(g),r++}}if(n.text!==void 0){let h=n.text;if(typeof h=="string"){if(xt(h)<1){const g={instancePath:o+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[g]:s.push(g),r++}}else{const g={instancePath:o+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[g]:s.push(g),r++}}if(n.shape!==void 0&&n.shape!=="box"){const h={instancePath:o+"/shape",schemaPath:"#/oneOf/7/properties/shape/enum",keyword:"enum",params:{allowedValues:Fm.oneOf[7].properties.shape.enum},message:"must be equal to one of the allowed values"};s===null?s=[h]:s.push(h),r++}if(n.color!==void 0){let h=n.color;if(!(h==="blue"||h==="amber"||h==="green"||h==="violet"||h==="rose"||h==="slate"||h==="coin")){const g={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:lo.enum},message:"must be equal to one of the allowed values"};s===null?s=[g]:s.push(g),r++}}}else{const h={instancePath:o,schemaPath:"#/oneOf/7/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[h]:s.push(h),r++}else if(m==="strip"){const h=r;let g=!1;const x=r;if(n&&typeof n=="object"&&!Array.isArray(n)&&n.value===void 0){const A={instancePath:o,schemaPath:"#/oneOf/8/anyOf/0/required",keyword:"required",params:{missingProperty:"value"},message:"must have required property 'value'"};s===null?s=[A]:s.push(A),r++}var l=x===r;if(g=g||l,!g){const A=r;if(n&&typeof n=="object"&&!Array.isArray(n)&&n.tag===void 0){const D={instancePath:o,schemaPath:"#/oneOf/8/anyOf/1/required",keyword:"required",params:{missingProperty:"tag"},message:"must have required property 'tag'"};s===null?s=[D]:s.push(D),r++}var l=A===r;g=g||l}if(g)r=h,s!==null&&(h?s.length=h:s=null);else{const A={instancePath:o,schemaPath:"#/oneOf/8/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};s===null?s=[A]:s.push(A),r++}if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.type===void 0){const A={instancePath:o,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};s===null?s=[A]:s.push(A),r++}if(n.field===void 0){const A={instancePath:o,schemaPath:"#/oneOf/8/required",keyword:"required",params:{missingProperty:"field"},message:"must have required property 'field'"};s===null?s=[A]:s.push(A),r++}for(const A in n)if(!(A==="type"||A==="field"||A==="value"||A==="tag")){const w={instancePath:o,schemaPath:"#/oneOf/8/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:A},message:"must NOT have additional properties"};s===null?s=[w]:s.push(w),r++}if(n.type!==void 0&&n.type!=="strip"){const A={instancePath:o+"/type",schemaPath:"#/oneOf/8/properties/type/const",keyword:"const",params:{allowedValue:"strip"},message:"must be equal to constant"};s===null?s=[A]:s.push(A),r++}if(n.field!==void 0){let A=n.field;if(typeof A=="string"){if(xt(A)<1){const w={instancePath:o+"/field",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[w]:s.push(w),r++}}else{const w={instancePath:o+"/field",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[w]:s.push(w),r++}}if(n.value!==void 0){let A=n.value;if(typeof A=="string"){if(xt(A)<1){const w={instancePath:o+"/value",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[w]:s.push(w),r++}}else{const w={instancePath:o+"/value",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[w]:s.push(w),r++}}if(n.tag!==void 0){let A=n.tag;if(typeof A=="string"){if(xt(A)<1){const w={instancePath:o+"/tag",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[w]:s.push(w),r++}}else{const w={instancePath:o+"/tag",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[w]:s.push(w),r++}}}else{const A={instancePath:o,schemaPath:"#/oneOf/8/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[A]:s.push(A),r++}}else{const h={instancePath:o,schemaPath:"#/discriminator",keyword:"discriminator",params:{error:"mapping",tag:"type",tagValue:m},message:'value of tag "type" must be in oneOf'};s===null?s=[h]:s.push(h),r++}else{const h={instancePath:o,schemaPath:"#/discriminator",keyword:"discriminator",params:{error:"tag",tag:"type",tagValue:m},message:'tag "type" must be string'};s===null?s=[h]:s.push(h),r++}}else{const m={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[m]:s.push(m),r++}return Wr.errors=s,r===0}function Ir(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.title===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};s===null?s=[l]:s.push(l),r++}if(n.body===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"body"},message:"must have required property 'body'"};s===null?s=[l]:s.push(l),r++}if(n.events===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"events"},message:"must have required property 'events'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="title"||l==="body"||l==="code"||l==="sources"||l==="events")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.title!==void 0){let l=n.title;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.body!==void 0){let l=n.body;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/body",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/body",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.code!==void 0){let l=n.code;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/code",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/code",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.sources!==void 0){let l=n.sources;if(Array.isArray(l)){if(l.length<1){const h={instancePath:o+"/sources",schemaPath:"#/properties/sources/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[h]:s.push(h),r++}const m=l.length;for(let h=0;h<m;h++)Jr(l[h],{instancePath:o+"/sources/"+h,parentData:l,parentDataProperty:h,rootData:p})||(s=s===null?Jr.errors:s.concat(Jr.errors),r=s.length)}else{const m={instancePath:o+"/sources",schemaPath:"#/properties/sources/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[m]:s.push(m),r++}}if(n.events!==void 0){let l=n.events;if(Array.isArray(l)){const m=l.length;for(let h=0;h<m;h++)Wr(l[h],{instancePath:o+"/events/"+h,parentData:l,parentDataProperty:h,rootData:p})||(s=s===null?Wr.errors:s.concat(Wr.errors),r=s.length)}else{const m={instancePath:o+"/events",schemaPath:"#/properties/events/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return Ir.errors=s,r===0}function el(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.lifelines===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"lifelines"},message:"must have required property 'lifelines'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(l!=="lifelines"){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.lifelines!==void 0){let l=n.lifelines;if(Array.isArray(l)){if(l.length<1){const h={instancePath:o+"/lifelines",schemaPath:"#/properties/lifelines/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[h]:s.push(h),r++}const m=l.length;for(let h=0;h<m;h++){let g=l[h];if(typeof g=="string"){if(!Pt.test(g)){const x={instancePath:o+"/lifelines/"+h,schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[x]:s.push(x),r++}}else{const x={instancePath:o+"/lifelines/"+h,schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[x]:s.push(x),r++}}}else{const m={instancePath:o+"/lifelines",schemaPath:"#/properties/lifelines/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return el.errors=s,r===0}function tl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.from===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};s===null?s=[l]:s.push(l),r++}if(n.to===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="from"||l==="to"||l==="label")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.from!==void 0){let l=n.from;if(typeof l=="string"){if(!Pt.test(l)){const m={instancePath:o+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.to!==void 0){let l=n.to;if(typeof l=="string"){if(!Pt.test(l)){const m={instancePath:o+"/to",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/to",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.label!==void 0){let l=n.label;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return tl.errors=s,r===0}function nl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.paths===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"paths"},message:"must have required property 'paths'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(l!=="paths"){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.paths!==void 0){let l=n.paths;if(Array.isArray(l)){if(l.length<1){const h={instancePath:o+"/paths",schemaPath:"#/properties/paths/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[h]:s.push(h),r++}const m=l.length;for(let h=0;h<m;h++)tl(l[h],{instancePath:o+"/paths/"+h,parentData:l,parentDataProperty:h,rootData:p})||(s=s===null?tl.errors:s.concat(tl.errors),r=s.length)}else{const m={instancePath:o+"/paths",schemaPath:"#/properties/paths/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return nl.errors=s,r===0}function al(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.id===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="id"||l==="note")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.id!==void 0){let l=n.id;if(typeof l=="string"){if(!Pt.test(l)){const m={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.note!==void 0){let l=n.note;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return al.errors=s,r===0}function sl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.branches===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"branches"},message:"must have required property 'branches'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(l!=="branches"){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.branches!==void 0){let l=n.branches;if(Array.isArray(l)){if(l.length<1){const h={instancePath:o+"/branches",schemaPath:"#/properties/branches/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[h]:s.push(h),r++}const m=l.length;for(let h=0;h<m;h++)al(l[h],{instancePath:o+"/branches/"+h,parentData:l,parentDataProperty:h,rootData:p})||(s=s===null?al.errors:s.concat(al.errors),r=s.length)}else{const m={instancePath:o+"/branches",schemaPath:"#/properties/branches/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return sl.errors=s,r===0}var iv=new RegExp("^[0-9]+(\\.[0-9]+)?(ms|s|min|h|d)$","u");function ol(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.unit===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"unit"},message:"must have required property 'unit'"};s===null?s=[l]:s.push(l),r++}if(n.length===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"length"},message:"must have required property 'length'"};s===null?s=[l]:s.push(l),r++}if(n.count===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"count"},message:"must have required property 'count'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="unit"||l==="length"||l==="count"||l==="from")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.unit!==void 0){let l=n.unit;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/unit",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/unit",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.length!==void 0){let l=n.length;if(typeof l=="string"){if(!iv.test(l)){const m={instancePath:o+"/length",schemaPath:"#/definitions/duration/pattern",keyword:"pattern",params:{pattern:"^[0-9]+(\\.[0-9]+)?(ms|s|min|h|d)$"},message:'must match pattern "^[0-9]+(\\.[0-9]+)?(ms|s|min|h|d)$"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/length",schemaPath:"#/definitions/duration/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.count!==void 0){let l=n.count;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const m={instancePath:o+"/count",schemaPath:"#/properties/count/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[m]:s.push(m),r++}if(typeof l=="number"&&isFinite(l)&&(l<1||isNaN(l))){const m={instancePath:o+"/count",schemaPath:"#/properties/count/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};s===null?s=[m]:s.push(m),r++}}if(n.from!==void 0){let l=n.from;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const m={instancePath:o+"/from",schemaPath:"#/properties/from/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[m]:s.push(m),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const m={instancePath:o+"/from",schemaPath:"#/properties/from/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return ol.errors=s,r===0}function il(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.name===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};s===null?s=[l]:s.push(l),r++}if(n.length===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"length"},message:"must have required property 'length'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="name"||l==="length"||l==="from")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.name!==void 0){let l=n.name;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.length!==void 0){let l=n.length;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const m={instancePath:o+"/length",schemaPath:"#/properties/length/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[m]:s.push(m),r++}if(typeof l=="number"&&isFinite(l)&&(l<1||isNaN(l))){const m={instancePath:o+"/length",schemaPath:"#/properties/length/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};s===null?s=[m]:s.push(m),r++}}if(n.from!==void 0){let l=n.from;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const m={instancePath:o+"/from",schemaPath:"#/properties/from/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[m]:s.push(m),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const m={instancePath:o+"/from",schemaPath:"#/properties/from/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return il.errors=s,r===0}function rl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.id===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};s===null?s=[l]:s.push(l),r++}if(n.name===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="id"||l==="name"||l==="color"||l==="empty")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.id!==void 0){let l=n.id;if(typeof l=="string"){if(!Pt.test(l)){const m={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.name!==void 0){let l=n.name;if(typeof l=="string"){if(xt(l)<1){const m={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.color!==void 0){let l=n.color;if(!(l==="blue"||l==="amber"||l==="green"||l==="violet"||l==="rose"||l==="slate"||l==="coin")){const m={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:lo.enum},message:"must be equal to one of the allowed values"};s===null?s=[m]:s.push(m),r++}}if(n.empty!==void 0){let l=n.empty;if(Array.isArray(l)){const m=l.length;for(let h=0;h<m;h++){let g=l[h];if(!(typeof g=="number"&&!(g%1)&&!isNaN(g)&&isFinite(g))){const x={instancePath:o+"/empty/"+h,schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[x]:s.push(x),r++}if(typeof g=="number"&&isFinite(g)&&(g<0||isNaN(g))){const x={instancePath:o+"/empty/"+h,schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[x]:s.push(x),r++}}}else{const m={instancePath:o+"/empty",schemaPath:"#/properties/empty/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return rl.errors=s,r===0}function ll(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.id===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};s===null?s=[l]:s.push(l),r++}if(n.at===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"at"},message:"must have required property 'at'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="id"||l==="at")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.id!==void 0){let l=n.id;if(typeof l=="string"){if(!Pt.test(l)){const m={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};s===null?s=[m]:s.push(m),r++}}else{const m={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[m]:s.push(m),r++}}if(n.at!==void 0){let l=n.at;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const m={instancePath:o+"/at",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[m]:s.push(m),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const m={instancePath:o+"/at",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return ll.errors=s,r===0}function cl(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.from===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};s===null?s=[l]:s.push(l),r++}if(n.to===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="from"||l==="to")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.from!==void 0){let l=n.from;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const m={instancePath:o+"/from",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[m]:s.push(m),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const m={instancePath:o+"/from",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[m]:s.push(m),r++}}if(n.to!==void 0){let l=n.to;if(!(typeof l=="number"&&!(l%1)&&!isNaN(l)&&isFinite(l))){const m={instancePath:o+"/to",schemaPath:"#/definitions/unit/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[m]:s.push(m),r++}if(typeof l=="number"&&isFinite(l)&&(l<0||isNaN(l))){const m={instancePath:o+"/to",schemaPath:"#/definitions/unit/minimum",keyword:"minimum",params:{comparison:">=",limit:0},message:"must be >= 0"};s===null?s=[m]:s.push(m),r++}}}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return cl.errors=s,r===0}function ul(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.scale===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"scale"},message:"must have required property 'scale'"};s===null?s=[l]:s.push(l),r++}if(n.rows===void 0){const l={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"rows"},message:"must have required property 'rows'"};s===null?s=[l]:s.push(l),r++}for(const l in n)if(!(l==="scale"||l==="period"||l==="rows"||l==="points"||l==="zoom")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:l},message:"must NOT have additional properties"};s===null?s=[m]:s.push(m),r++}if(n.scale!==void 0&&(ol(n.scale,{instancePath:o+"/scale",parentData:n,parentDataProperty:"scale",rootData:p})||(s=s===null?ol.errors:s.concat(ol.errors),r=s.length)),n.period!==void 0&&(il(n.period,{instancePath:o+"/period",parentData:n,parentDataProperty:"period",rootData:p})||(s=s===null?il.errors:s.concat(il.errors),r=s.length)),n.rows!==void 0){let l=n.rows;if(Array.isArray(l)){if(l.length<1){const h={instancePath:o+"/rows",schemaPath:"#/properties/rows/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[h]:s.push(h),r++}const m=l.length;for(let h=0;h<m;h++)rl(l[h],{instancePath:o+"/rows/"+h,parentData:l,parentDataProperty:h,rootData:p})||(s=s===null?rl.errors:s.concat(rl.errors),r=s.length)}else{const m={instancePath:o+"/rows",schemaPath:"#/properties/rows/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[m]:s.push(m),r++}}if(n.points!==void 0){let l=n.points;if(Array.isArray(l)){const m=l.length;for(let h=0;h<m;h++)ll(l[h],{instancePath:o+"/points/"+h,parentData:l,parentDataProperty:h,rootData:p})||(s=s===null?ll.errors:s.concat(ll.errors),r=s.length)}else{const m={instancePath:o+"/points",schemaPath:"#/properties/points/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[m]:s.push(m),r++}}n.zoom!==void 0&&(cl(n.zoom,{instancePath:o+"/zoom",parentData:n,parentDataProperty:"zoom",rootData:p})||(s=s===null?cl.errors:s.concat(cl.errors),r=s.length))}else{const l={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[l]:s.push(l),r++}return ul.errors=s,r===0}var rv=Object.prototype.hasOwnProperty;function O0(n,{instancePath:o="",parentData:c,parentDataProperty:u,rootData:p=n}={}){let s=null,r=0;const l=r;let m=!0;const h=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const N={};s===null?s=[N]:s.push(N),r++}else if(n.kind!==void 0&&n.kind!=="sequence"){const N={};s===null?s=[N]:s.push(N),r++}}var g=h===r;r=l,s!==null&&(l?s.length=l:s=null);let x;if(g){const N=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.sequence===void 0){const z={instancePath:o,schemaPath:"#/then/required",keyword:"required",params:{missingProperty:"sequence"},message:"must have required property 'sequence'"};s===null?s=[z]:s.push(z),r++}if(n.boxes!==void 0){let z=n.boxes;if(Array.isArray(z)&&z.length<1){const ae={instancePath:o+"/boxes",schemaPath:"#/then/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[ae]:s.push(ae),r++}}if(n.steps!==void 0&&(Kn(n.steps,{instancePath:o+"/steps",parentData:n,parentDataProperty:"steps",rootData:p})||(s=s===null?Kn.errors:s.concat(Kn.errors),r=s.length)),n.strip!==void 0&&(Nn(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:p})||(s=s===null?Nn.errors:s.concat(Nn.errors),r=s.length)),n.state!==void 0){const z={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[z]:s.push(z),r++}if(n.git!==void 0){const z={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[z]:s.push(z),r++}if(n.time!==void 0){const z={instancePath:o+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[z]:s.push(z),r++}}var g=N===r;m=g,x="then"}else{const N=r,M=r;let z=!0;const ae=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const J={};s===null?s=[J]:s.push(J),r++}else if(n.kind!==void 0&&n.kind!=="state"){const J={};s===null?s=[J]:s.push(J),r++}}var A=ae===r;r=M,s!==null&&(M?s.length=M:s=null);let le;if(A){const J=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.boxes!==void 0){let W=n.boxes;if(Array.isArray(W)){if(W.length<1){const ye={instancePath:o+"/boxes",schemaPath:"#/else/then/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[ye]:s.push(ye),r++}const re=W.length;for(let ye=0;ye<re;ye++){let he=W[ye];if(he&&typeof he=="object"&&!Array.isArray(he)&&he.id!==void 0){let me=he.id;const Oe=r,xe=r;if(!(me==="start"||me==="finish")){const C={};s===null?s=[C]:s.push(C),r++}var w=xe===r;if(w){const C={instancePath:o+"/boxes/"+ye+"/id",schemaPath:"#/else/then/properties/boxes/items/properties/id/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[C]:s.push(C),r++}else r=Oe,s!==null&&(Oe?s.length=Oe:s=null)}}}}if(n.steps!==void 0&&(Kn(n.steps,{instancePath:o+"/steps",parentData:n,parentDataProperty:"steps",rootData:p})||(s=s===null?Kn.errors:s.concat(Kn.errors),r=s.length)),n.strip!==void 0&&(Nn(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:p})||(s=s===null?Nn.errors:s.concat(Nn.errors),r=s.length)),n.git!==void 0){const W={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[W]:s.push(W),r++}if(n.time!==void 0){const W={instancePath:o+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[W]:s.push(W),r++}}var A=J===r;z=A,le="then"}else{const J=r,X=r;let W=!0;const re=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const me={};s===null?s=[me]:s.push(me),r++}else if(n.kind!==void 0&&n.kind!=="git"){const me={};s===null?s=[me]:s.push(me),r++}}var D=re===r;r=X,s!==null&&(X?s.length=X:s=null);let ye;if(D){const me=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.git===void 0){const xe={instancePath:o,schemaPath:"#/else/else/then/required",keyword:"required",params:{missingProperty:"git"},message:"must have required property 'git'"};s===null?s=[xe]:s.push(xe),r++}if(n.steps!==void 0&&(Pr(n.steps,{instancePath:o+"/steps",parentData:n,parentDataProperty:"steps",rootData:p})||(s=s===null?Pr.errors:s.concat(Pr.errors),r=s.length)),n.strip!==void 0&&(Nn(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:p})||(s=s===null?Nn.errors:s.concat(Nn.errors),r=s.length)),n.state!==void 0){const xe={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[xe]:s.push(xe),r++}if(n.regions!==void 0){const xe={instancePath:o+"/regions",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[xe]:s.push(xe),r++}if(n.time!==void 0){const xe={instancePath:o+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[xe]:s.push(xe),r++}}var D=me===r;W=D,ye="then"}else{const me=r,Oe=r;let xe=!0;const C=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.kind===void 0){const G={};s===null?s=[G]:s.push(G),r++}else if(n.kind!==void 0&&n.kind!=="time"){const G={};s===null?s=[G]:s.push(G),r++}}var T=C===r;r=Oe,s!==null&&(Oe?s.length=Oe:s=null);let $;if(T){const G=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.time===void 0){const S={instancePath:o,schemaPath:"#/else/else/else/then/required",keyword:"required",params:{missingProperty:"time"},message:"must have required property 'time'"};s===null?s=[S]:s.push(S),r++}if(n.steps!==void 0){let S=n.steps;if(Array.isArray(S)){const H=S.length;for(let K=0;K<H;K++){let pe=S[K];if(pe&&typeof pe=="object"&&!Array.isArray(pe)&&pe.events!==void 0){let _e=pe.events;if(Array.isArray(_e)){const De=_e.length;for(let je=0;je<De;je++){let Le=_e[je];if(Le&&typeof Le=="object"&&!Array.isArray(Le)&&Le.type!==void 0){let ze=Le.type;const Ze=r,U=r;if(!(ze==="commit"||ze==="branch")){const ke={};s===null?s=[ke]:s.push(ke),r++}var B=U===r;if(B){const ke={instancePath:o+"/steps/"+K+"/events/"+je+"/type",schemaPath:"#/definitions/timeSteps/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[ke]:s.push(ke),r++}else r=Ze,s!==null&&(Ze?s.length=Ze:s=null)}}}}}}}if(n.state!==void 0){const S={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[S]:s.push(S),r++}if(n.git!==void 0){const S={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[S]:s.push(S),r++}if(n.regions!==void 0){const S={instancePath:o+"/regions",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[S]:s.push(S),r++}}var T=G===r;xe=T,$="then"}else{const G=r;if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.boxes!==void 0){let S=n.boxes;if(Array.isArray(S)&&S.length<1){const H={instancePath:o+"/boxes",schemaPath:"#/else/else/else/else/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[H]:s.push(H),r++}}if(n.steps!==void 0&&(Kn(n.steps,{instancePath:o+"/steps",parentData:n,parentDataProperty:"steps",rootData:p})||(s=s===null?Kn.errors:s.concat(Kn.errors),r=s.length)),n.strip!==void 0&&(Nn(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:p})||(s=s===null?Nn.errors:s.concat(Nn.errors),r=s.length)),n.state!==void 0){const S={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[S]:s.push(S),r++}if(n.git!==void 0){const S={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[S]:s.push(S),r++}if(n.time!==void 0){const S={instancePath:o+"/time",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[S]:s.push(S),r++}}var T=G===r;xe=T,$="else"}if(!xe){const G={instancePath:o,schemaPath:"#/else/else/else/if",keyword:"if",params:{failingKeyword:$},message:'must match "'+$+'" schema'};s===null?s=[G]:s.push(G),r++}var D=me===r;W=D,ye="else"}if(!W){const me={instancePath:o,schemaPath:"#/else/else/if",keyword:"if",params:{failingKeyword:ye},message:'must match "'+ye+'" schema'};s===null?s=[me]:s.push(me),r++}var A=J===r;z=A,le="else"}if(!z){const J={instancePath:o,schemaPath:"#/else/if",keyword:"if",params:{failingKeyword:le},message:'must match "'+le+'" schema'};s===null?s=[J]:s.push(J),r++}if(n&&typeof n=="object"&&!Array.isArray(n)&&n.sequence!==void 0){const J={instancePath:o+"/sequence",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};s===null?s=[J]:s.push(J),r++}var g=N===r;m=g,x="else"}if(!m){const N={instancePath:o,schemaPath:"#/if",keyword:"if",params:{failingKeyword:x},message:'must match "'+x+'" schema'};s===null?s=[N]:s.push(N),r++}if(n&&typeof n=="object"&&!Array.isArray(n)){if(n.version===void 0){const N={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"version"},message:"must have required property 'version'"};s===null?s=[N]:s.push(N),r++}if(n.kind===void 0){const N={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"kind"},message:"must have required property 'kind'"};s===null?s=[N]:s.push(N),r++}if(n.title===void 0){const N={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};s===null?s=[N]:s.push(N),r++}if(n.boxes===void 0){const N={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"boxes"},message:"must have required property 'boxes'"};s===null?s=[N]:s.push(N),r++}if(n.steps===void 0){const N={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"steps"},message:"must have required property 'steps'"};s===null?s=[N]:s.push(N),r++}for(const N in n)if(!rv.call(Yu.properties,N)){const M={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:N},message:"must NOT have additional properties"};s===null?s=[M]:s.push(M),r++}if(n.version!==void 0){let N=n.version;if(!(typeof N=="number"&&!(N%1)&&!isNaN(N)&&isFinite(N))){const M={instancePath:o+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type:"integer"},message:"must be integer"};s===null?s=[M]:s.push(M),r++}if(typeof N=="number"&&isFinite(N)&&(N<1||isNaN(N))){const M={instancePath:o+"/version",schemaPath:"#/properties/version/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};s===null?s=[M]:s.push(M),r++}}if(n.kind!==void 0){let N=n.kind;if(!(N==="sequence"||N==="architecture"||N==="state"||N==="git"||N==="time")){const M={instancePath:o+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues:Yu.properties.kind.enum},message:"must be equal to one of the allowed values"};s===null?s=[M]:s.push(M),r++}}if(n.title!==void 0){let N=n.title;if(typeof N=="string"){if(xt(N)<1){const M={instancePath:o+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};s===null?s=[M]:s.push(M),r++}}else{const M={instancePath:o+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};s===null?s=[M]:s.push(M),r++}}if(n.view!==void 0){let N=n.view;if(!(N==="fixed"||N==="follow")){const M={instancePath:o+"/view",schemaPath:"#/properties/view/enum",keyword:"enum",params:{allowedValues:Yu.properties.view.enum},message:"must be equal to one of the allowed values"};s===null?s=[M]:s.push(M),r++}}if(n.regions!==void 0){let N=n.regions;if(Array.isArray(N)){const M=N.length;for(let z=0;z<M;z++)Vr(N[z],{instancePath:o+"/regions/"+z,parentData:N,parentDataProperty:z,rootData:p})||(s=s===null?Vr.errors:s.concat(Vr.errors),r=s.length)}else{const M={instancePath:o+"/regions",schemaPath:"#/properties/regions/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[M]:s.push(M),r++}}if(n.boxes!==void 0){let N=n.boxes;if(Array.isArray(N)){const M=N.length;for(let z=0;z<M;z++)Xr(N[z],{instancePath:o+"/boxes/"+z,parentData:N,parentDataProperty:z,rootData:p})||(s=s===null?Xr.errors:s.concat(Xr.errors),r=s.length)}else{const M={instancePath:o+"/boxes",schemaPath:"#/properties/boxes/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[M]:s.push(M),r++}}if(n.strip!==void 0&&(Zr(n.strip,{instancePath:o+"/strip",parentData:n,parentDataProperty:"strip",rootData:p})||(s=s===null?Zr.errors:s.concat(Zr.errors),r=s.length)),n.steps!==void 0){let N=n.steps;if(Array.isArray(N)){if(N.length<1){const z={instancePath:o+"/steps",schemaPath:"#/properties/steps/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};s===null?s=[z]:s.push(z),r++}const M=N.length;for(let z=0;z<M;z++)Ir(N[z],{instancePath:o+"/steps/"+z,parentData:N,parentDataProperty:z,rootData:p})||(s=s===null?Ir.errors:s.concat(Ir.errors),r=s.length)}else{const M={instancePath:o+"/steps",schemaPath:"#/properties/steps/type",keyword:"type",params:{type:"array"},message:"must be array"};s===null?s=[M]:s.push(M),r++}}n.sequence!==void 0&&(el(n.sequence,{instancePath:o+"/sequence",parentData:n,parentDataProperty:"sequence",rootData:p})||(s=s===null?el.errors:s.concat(el.errors),r=s.length)),n.state!==void 0&&(nl(n.state,{instancePath:o+"/state",parentData:n,parentDataProperty:"state",rootData:p})||(s=s===null?nl.errors:s.concat(nl.errors),r=s.length)),n.git!==void 0&&(sl(n.git,{instancePath:o+"/git",parentData:n,parentDataProperty:"git",rootData:p})||(s=s===null?sl.errors:s.concat(sl.errors),r=s.length)),n.time!==void 0&&(ul(n.time,{instancePath:o+"/time",parentData:n,parentDataProperty:"time",rootData:p})||(s=s===null?ul.errors:s.concat(ul.errors),r=s.length))}else{const N={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};s===null?s=[N]:s.push(N),r++}return O0.errors=s,r===0}var El=n=>Object.keys(n),mi=El({sequence:!0,architecture:!0,state:!0,git:!0,time:!0}),gi=["start","finish"],B0=["scale","period","row","point","zoom","mark","span"],Al="now",vd=["group","end","box","strip","step","say","code","source","act","note","set","branch","commit",...B0],Lr="as",j0="on",z0="copy",R0="merge",xd="from",In="HEAD",q0="at",ln={diagram:["view"],group:["note","color","icon"],box:["note","color","icon","link"],source:["url"],edge:["carry","tag","side","at","into"],note:["color"],set:["tag"],strip:["meter"],branch:["note"],commit:["hash","note"],scale:["from"],period:["from"],row:["color","empty"],mark:["color"],span:["shape","color"]},lv=["at","into"],yi=["box"],H0=["ms","s","min","h","d"],wd=El({coin:!0,none:!0}),kd=El({fixed:!0,follow:!0}),Ed=El({above:!0,below:!0,left:!0,right:!0}),Gm={時系列図:"sequence",構成図:"architecture",区画:"group",見せ方:"view",region:"group",view:"view"},bs=["blue","amber","green","violet","rose","slate","coin"],cv=["edge","action","swap","strip","commit","branch","now","mark","span"],uv="#/definitions/absent/not",dv={regions:"sequence / architecture / state",at:"time",into:"time",color:"time",meters:"time"},pv={carry:{field:"text",kind:"tag"}},hv=/\/boxes\/items\/properties\/id\/not$/u,fv=/\/events\/items\/properties\/type\/not$/u,mv=["commit","branch"],gv=/\/events\/items\/not$/u,yv=["now","mark","span"],bv=/^\^\[0-9\]\+\(\\\.\[0-9\]\+\)\?\(([a-z|]+)\)\$$/u,vv=/%\)\$$/u,Pu=n=>n.replaceAll("~","~0").replaceAll("/","~1"),xv="#/definitions/url/pattern",wv=/^\^\[0-9a-f\]\{(\d+),(\d+)\}\$$/u;function kv(n){const o=/^\^\[\^(.+)\]\+\$$/u.exec(n)?.[1];if(o===void 0)return;const c=o.match(/\\.|[^\\]/gu)??[];return{space:c.includes("\\s"),chars:c.filter(u=>u!=="\\s").map(u=>u.replace(/^\\/u,""))}}var U0=(n,o)=>o.filter(c=>c!==n&&c.schemaPath.startsWith(`${n.schemaPath}/`)&&(c.instancePath===n.instancePath||c.instancePath.startsWith(`${n.instancePath}/`)));function Ev(n,o,c){const u=n.params,p=n.instancePath;switch(n.keyword){case"additionalProperties":{const s=String(u.additionalProperty);return{pointer:`${p}/${Pu(s)}`,message:c.additionalProperties(s)}}case"required":{const s=String(u.missingProperty);return{pointer:`${p}/${Pu(s)}`,message:c.required(s)}}case"not":{if(hv.test(n.schemaPath))return{pointer:p,message:c.reserved(gi)};if(fv.test(n.schemaPath))return{pointer:p,message:c.kindOnly(mv,"git")};if(gv.test(n.schemaPath))return{pointer:`${p}/type`,message:c.kindOnly(yv,"time")};const s=p.slice(p.lastIndexOf("/")+1);if(n.schemaPath===uv)return{pointer:p,message:c.not({field:s,kind:dv[s]??s})};const r=pv[s];return{pointer:r?`${p}/${r.field}`:p,message:c.not(r)}}case"anyOf":{const s=U0(n,o),r=s.every(l=>l.keyword==="required")?s.map(l=>String(l.params.missingProperty)):[];return{pointer:p,message:c.anyOf(r)}}case"discriminator":{const s=String(u.tag);return{pointer:`${p}/${Pu(s)}`,message:c.discriminator(s,cv)}}case"enum":return{pointer:p,message:c.enum(u.allowedValues.map(String))};case"type":return{pointer:p,message:c.type(String(u.type))};case"minLength":return{pointer:p,message:c.minLength(Number(u.limit))};case"pattern":{if(n.schemaPath===xv)return{pointer:p,message:c.url};const s=String(u.pattern),r=wv.exec(s);if(r)return{pointer:p,message:c.hex(Number(r[1]),Number(r[2]))};const l=bv.exec(s);return l?{pointer:p,message:c.duration((l[1]??"").split("|"))}:vv.test(s)?{pointer:p,message:c.ratio}:{pointer:p,message:c.pattern(kv(s))}}case"minItems":return{pointer:p,message:c.minItems(Number(u.limit))};case"minimum":return{pointer:p,message:c.minimum(Number(u.limit))};case"const":return{pointer:p,message:c.const(String(u.allowedValue))};case"oneOf":return{pointer:p,message:c.oneOf};default:return{pointer:p,message:n.message??n.keyword}}}function Av(n,o={}){if(Lm(n))return{ok:!0};const c=Lm.errors??[],u=new Set(c.filter(r=>r.keyword==="anyOf").flatMap(r=>U0(r,c))),p=M0[o.lang??"ja"];return{ok:!1,errors:c.filter(r=>r.keyword!=="if"&&!u.has(r)).map(r=>Ev(r,c,p))}}var Vt=n=>n.join(" / "),Sv=()=>{const n={sequence:"sequence <題>",architecture:"architecture <題>",group:"group <名札> as <名前> [note: <添え書き>] から end まで",box:"box <名札> as <名前> [note: <下の小さな字>]",strip:"strip <題>: <欄>, <欄>",view:"sequence <題> [view: follow]",step:"step <段の題>",say:"say <段の本文>",code:"code <命令>",act:"act <名札>: <処理の名前>",note:"note <名札>: <下の小さな字>",set:"set <欄>: <値> [tag: <札>]"};return{noHead:`最初の行に図の種類 (${Vt(mi)}) と題を書く`,badHead:`最初の行は ${mi.join(" か ")} で始め、続けて題を書く`,oldForm:(o,c)=>`${o} は前の形の書き方。新しい形では ${n[c]} と書く`,unknownHead:o=>`${o} は行の頭に書けない。行は ${Vt(vd)} か、<名札> -> <名札> で始める`,duplicate:o=>`${o} は既に宣言した名札`,needsId:o=>`${o} の後ろに名札を書く`,badId:o=>`${o} は名札に使えない。名札には空白と [ ] 「 」 = : を含めない`,afterId:"名札の後ろには as <名前> か属性を書く",undeclaredBox:o=>`${o} という箱は宣言していない`,noBody:o=>`段「${o}」に本文 (say の行) が要る`,emptyStepTitle:"step の後ろに段の題を書く",noBoxes:"箱を 1 つ以上宣言する",noSteps:"段 (step の行) を 1 つ以上書く",emptySay:"say の後ろか、その下に字下げした行に段の本文を書く",sayTwice:"1 つの段に say は 1 つまで。長い本文は say の下に字下げして続ける",codeTwice:"1 つの段に code は 1 行まで",emptyCode:"code の後ろに命令を書く",sourceShape:"source は source <名前> [url: <URL>] の形で書く",declarationInStep:"group と box と strip と branch と、scale と period と row と point と zoom は最初の step より前に書く",stepLineBeforeStep:"線と say と code と source と act と note と set と commit と枝を切る行と、now と mark と span の行は step の下に書く",nestedGroup:"group の中に group は書けない。先に end で閉じる",strayEnd:"end の前に、閉じる group が無い",endTakesNothing:"end の後ろには何も書かない",unclosedGroup:o=>`group ${o} を end で閉じていない`,regionReopened:o=>`group ${o} は宣言済み。もう一度開く時は group ${o} だけを書き、名前と属性は最初の宣言に書く`,emptyName:o=>`${o} の名前が空`,stripTwice:"strip は 1 つだけ宣言する",stripShape:"strip は strip <題>: <欄>, <欄> の形で書く",emptyStripField:"strip の欄の名前が空",stripUndeclared:"set を書く前に、strip <題>: <欄>, <欄> で帯を宣言する",noSuchField:o=>`${o} という欄は strip に無い`,stripNeedsValue:"set は set <欄>: <値> か set <欄> [tag: <札>] の形で書く",actShape:"act は act <名札>: <処理の名前> の形で書く",noteShape:"note は note <名札>: <下の小さな字> の形で書く",edgeShape:"線は <名札> -> <名札>: <線の名前> [<属性>] の形で書く",emptyLabel:"線の : の後ろに線の名前を書く。名前を書かない時は : も書かない",quoteUnclosed:'" で始めた字を " で閉じていない',afterQuote:'" で閉じた字の後ろには、属性か次の , だけを書く',attrUnclosed:"属性は [ で始めて ] で閉じ、行の終わりに置く",attrNoColon:o=>`[${o}] は書けない。属性は [<鍵>: <値>] の形で書く`,attrNoValue:o=>`${o}: の後ろに値を書く`,attrTwice:o=>`${o} は 1 つの行に 1 つまで`,badAttr:(o,c)=>`${o} はこの行に書けない属性。書けるのは ${Vt(c)}`,badColor:`color は ${Vt(bs)} のどれか`,badView:`view は ${Vt(kd)} のどれか`,badCarry:`carry は ${Vt(wd)} のどれか。札は tag: <値> で書く`,badSide:`side は ${Vt(Ed)} のどれか`,badUrl:o=>`${o} には / で始まる path か、http:// か https:// で始まる URL を書く`,carryTwice:"運ぶ物は 1 本の線に 1 つまで。carry と tag は一緒に書かない",reservedId:o=>`${o} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,intoStart:"start へ入る線は書けない。start は始まりの印で、線は start から出る",outOfFinish:"finish から出る線は書けない。finish は終わりの印で、線は finish へ入る",pathNoAttrs:"最初の step より前の線は今回は通らない道なので、属性 (carry と tag と side) を書けない",gitOnly:o=>`${o} の行は git (枝分かれの図) でだけ書ける`,gitNoGroup:"git (枝分かれの図) には group を書けない。枝は branch の行で宣言する",noBranches:"branch の行で枝を 1 つ以上宣言する",branchShape:"branch は branch <名札> [note: <添え書き>] の形で書く",commitShape:"commit は commit <名札> on <枝> [hash: <hash>, note: <一言>] の形で書く。当て直しは copy <commit> を、取り込みは merge <枝> を on <枝> の後ろに書く",fromShape:"枝を切る行は <枝> from <commit> の形で書く",undeclaredBranch:o=>`${o} という枝は宣言していない`,undeclaredRef:o=>`${o} という枝は宣言していない。札を動かす線は枝の名札か HEAD から引く`,noCommit:o=>`${o} という commit はまだ積んでいない`,emptyBranch:o=>`${o} の枝はまだどの commit も指していないので取り込めない`,mergeSelf:o=>`${o} は積む枝なので、取り込む枝にできない`,headReserved:o=>`${o} は枝分かれの図で今いる場所の札の名前で、名札に使えない`,badHash:"hash は 0 から 9 と a から f の字で 4 から 40 字にする",timeOnly:o=>`${o} は time (時間軸の図) でだけ書ける`,timeTwice:o=>`${o} は 1 つだけ宣言する`,noScale:"scale の行で目盛りを宣言する",noRows:"row の行で印の列を 1 つ以上宣言する",scaleShape:"scale は scale <単位> <長さ> <数> [from: <番号>] の形で書く",periodShape:"period は period <名前> <目盛りの数> [from: <番号>] の形で書く",rowShape:"row は row <名札> as <名前> [color: <色>, empty: <目盛り> <目盛り>] の形で書く",pointShape:"point は point <名札> at <目盛り> の形で書く",zoomShape:"zoom は zoom <目盛り>-<目盛り> の形で書く",nowShape:"針を進める行は now -> <目盛り> の形で書く",markShape:"mark は mark <列> <目盛り>-<目盛り> [color: <色>] の形で書く",spanShape:`span は span <目盛り>-<目盛り>: <字> [shape: ${Vt(yi)}, color: <色>] の形で書く`,badLength:`長さは数と単位 (${Vt(H0)}) の組で書く (12s など)`,badCount:o=>`${o} の目盛りの数は 1 以上の整数にする`,badUnit:(o,c)=>`${o} は目盛りの位置にできない。0 から ${c-1} の数か、その範囲 (0-3 など) を書く`,nowBack:(o,c)=>`now -> ${o} は針を進めない。前の now (${c}) より後の目盛りを書く`,outOfZoom:(o,c)=>`拡大の帯の列は ${o} から ${c} の目盛りから選ぶ`,noZoom:"at と into は、zoom で拡大の帯を宣言した図の箱どうしの線にだけ書ける",boxNeedsZoom:"時間軸の図の箱は拡大の帯に置く。zoom <目盛り>-<目盛り> で拡大の範囲を書く",boxLineNeedsAt:"拡大の帯の箱どうしの線には [at: <目盛り>] で列を書く",pointLineNoAt:"節目どうしの線は軸の上に引くので、at と into を書けない",mixedLine:"線は箱どうしか、節目どうしで引く",undeclaredRow:o=>`${o} という印の列は宣言していない`,undeclaredNote:o=>`${o} という箱か節目は宣言していない`,nowReserved:o=>`${o} は時間軸の図で針を進める行の語で、名札に使えない`,noteColorPointOnly:"note の color は節目の丸の色で、節目の note にだけ書ける",badShape:`shape は ${Vt(yi)} だけ書ける。括弧は shape を書かない`,badRatio:"物差しの線は分数 (2/3) か百分率 (97%) で書く",meterValue:o=>`${o} は物差しの欄なので、値を分数 (2/3) か百分率 (97%) で書く`}},_v=()=>{const n={sequence:"sequence <title>",architecture:"architecture <title>",group:"group <id> as <name> [note: <note>] through end",box:"box <id> as <name> [note: <caption>]",strip:"strip <title>: <field>, <field>",view:"sequence <title> [view: follow]",step:"step <step title>",say:"say <step body>",code:"code <command>",act:"act <id>: <action>",note:"note <id>: <caption>",set:"set <field>: <value> [tag: <tag>]"};return{noHead:`Write the diagram kind (${Vt(mi)}) and a title on the first line`,badHead:`Start the first line with ${mi.join(" or ")}, followed by the title`,oldForm:(o,c)=>`${o} is the old notation. Write ${n[c]} instead`,unknownHead:o=>`A line cannot start with ${o}. Start a line with ${Vt(vd)}, or <id> -> <id>`,duplicate:o=>`${o} is already declared`,needsId:o=>`Write an id after ${o}`,badId:o=>`${o} cannot be an id. An id has no spaces and none of [ ] 「 」 = :`,afterId:"Write as <name> or attributes after the id",undeclaredBox:o=>`No box named ${o} is declared`,noBody:o=>`Step "${o}" needs a body (a say line)`,emptyStepTitle:"Write a title after step",noBoxes:"Declare at least one box",noSteps:"Write at least one step (a step line)",emptySay:"Write the step body after say, or on indented lines below it",sayTwice:"A step takes one say. Continue a long body on indented lines below it",codeTwice:"A step takes at most one code line",emptyCode:"Write the command after code",sourceShape:"Write a source as source <name> [url: <URL>]",declarationInStep:"Write group, box, strip, branch, scale, period, row, point and zoom before the first step",stepLineBeforeStep:"Write lines, say, code, source, act, note, set, commit, branch cuts, now, mark and span under a step",nestedGroup:"A group cannot hold another group. Close it with end first",strayEnd:"There is no group for this end to close",endTakesNothing:"Write nothing after end",unclosedGroup:o=>`group ${o} is not closed with end`,regionReopened:o=>`group ${o} is already declared. To open it again, write only group ${o}; put the name and attributes on the first one`,emptyName:o=>`${o} has an empty name`,stripTwice:"Declare only one strip",stripShape:"Write a strip as strip <title>: <field>, <field>",emptyStripField:"A strip field name is empty",stripUndeclared:"Declare the strip as strip <title>: <field>, <field> before writing set",noSuchField:o=>`The strip has no field named ${o}`,stripNeedsValue:"Write set as set <field>: <value> or set <field> [tag: <tag>]",actShape:"Write act as act <id>: <action>",noteShape:"Write note as note <id>: <caption>",edgeShape:"Write a line as <id> -> <id>: <label> [<attributes>]",emptyLabel:"Write the label after the : of a line, or leave out the : as well",quoteUnclosed:'A value that starts with " is not closed with "',afterQuote:'After a value closed with ", write only attributes or the next ,',attrUnclosed:"Start attributes with [, close them with ], and put them at the end of the line",attrNoColon:o=>`[${o}] cannot be read. Write an attribute as [<key>: <value>]`,attrNoValue:o=>`Write a value after ${o}:`,attrTwice:o=>`Write ${o} only once on a line`,badAttr:(o,c)=>`${o} cannot be written on this line. Write ${Vt(c)}`,badColor:`color is one of ${Vt(bs)}`,badView:`view is one of ${Vt(kd)}`,badCarry:`carry is one of ${Vt(wd)}. Write a tag as tag: <value>`,badSide:`side is one of ${Vt(Ed)}`,badUrl:o=>`Write a path that starts with / or a URL that starts with http:// or https:// for ${o}`,carryTwice:"A line carries one thing. Do not write carry and tag together",reservedId:o=>`${o} names the start or end mark of a state diagram and cannot be a box id`,intoStart:"A line cannot go into start. start is the start mark, and lines leave it",outOfFinish:"A line cannot leave finish. finish is the end mark, and lines go into it",pathNoAttrs:"A line before the first step is a path not taken, so it takes no attributes (carry, tag, side)",gitOnly:o=>`${o} lines can be written only in git diagrams`,gitNoGroup:"A git diagram takes no group. Declare branches with branch lines",noBranches:"Declare at least one branch with a branch line",branchShape:"Write a branch as branch <id> [note: <note>]",commitShape:"Write a commit as commit <id> on <branch> [hash: <hash>, note: <note>]. For a replayed commit add copy <commit>, and for a merge commit add merge <branch>, after on <branch>",fromShape:"Write a branch cut as <branch> from <commit>",undeclaredBranch:o=>`No branch named ${o} is declared`,undeclaredRef:o=>`No branch named ${o} is declared. A line that moves a ref starts from a branch id or HEAD`,noCommit:o=>`No commit named ${o} has been made yet`,emptyBranch:o=>`Branch ${o} does not point at any commit yet, so it cannot be merged`,mergeSelf:o=>`${o} is the branch being committed to, so it cannot be the branch merged in`,headReserved:o=>`${o} names where you are in a git diagram and cannot be an id`,badHash:"Write a hash as 4 to 40 characters of 0-9 and a-f",timeOnly:o=>`${o} can be written only in time diagrams`,timeTwice:o=>`Declare only one ${o}`,noScale:"Declare the scale with a scale line",noRows:"Declare at least one row with a row line",scaleShape:"Write a scale as scale <unit> <length> <count> [from: <number>]",periodShape:"Write a period as period <name> <units> [from: <number>]",rowShape:"Write a row as row <id> as <name> [color: <color>, empty: <unit> <unit>]",pointShape:"Write a point as point <id> at <unit>",zoomShape:"Write a zoom as zoom <unit>-<unit>",nowShape:"Write a needle line as now -> <unit>",markShape:"Write a mark as mark <row> <unit>-<unit> [color: <color>]",spanShape:`Write a span as span <unit>-<unit>: <text> [shape: ${Vt(yi)}, color: <color>]`,badLength:`Write a length as a number and a unit (${Vt(H0)}), such as 12s`,badCount:o=>`The unit count of ${o} is a whole number of 1 or more`,badUnit:(o,c)=>`${o} cannot be a unit. Write a number from 0 to ${c-1}, or a range such as 0-3`,nowBack:(o,c)=>`now -> ${o} does not move the needle forward. Write a unit after the previous now (${c})`,outOfZoom:(o,c)=>`Pick a zoom column from units ${o} to ${c}`,noZoom:"at and into are allowed only on lines between boxes in a diagram that declares a zoom",boxNeedsZoom:"Boxes of a time diagram sit in the zoom band. Write the zoom range as zoom <unit>-<unit>",boxLineNeedsAt:"Write the column of a line between zoom boxes as [at: <unit>]",pointLineNoAt:"A line between points runs along the axis, so it takes no at or into",mixedLine:"Draw a line between two boxes or between two points",undeclaredRow:o=>`No row named ${o} is declared`,undeclaredNote:o=>`No box or point named ${o} is declared`,nowReserved:o=>`${o} starts the needle line of a time diagram and cannot be an id`,noteColorPointOnly:"The color of a note colors the circle of a point, so write it only on the note of a point",badShape:`shape takes only ${Vt(yi)}. A bracket takes no shape`,badRatio:"Write the meter line as a fraction (2/3) or a percentage (97%)",meterValue:o=>`${o} is a meter, so write its value as a fraction (2/3) or a percentage (97%)`}},$v={ja:Sv(),en:_v()},Dv=n=>$v[n],Ym=n=>n.text===""||n.text.startsWith("//");function Nv(n,o){return n.column+Array.from(n.text.slice(0,o)).length}function Tv(n){return n.split(/\r?\n/).map((o,c)=>{const u=Array.from(o.slice(0,o.length-o.trimStart().length)).length;return{line:c+1,column:u+1,indent:u,text:o.trim()}})}var Sl=1;function Mv(n){if(typeof n!="object"||n===null)return;const o=n.version;return typeof o=="number"&&o>Sl?o:void 0}var Cv=(n,o)=>({pointer:"/version",message:M0[o].newer(n,Sl)});function wi(n,o={}){const c=Mv(n);if(c!==void 0)return{ok:!1,errors:[Cv(c,o.lang??"ja")]};const u=Av(n,o);return u.ok?{ok:!0,diagram:n,warnings:[]}:u}var Ad=class extends Error{constructor(n,o,c){super(c),this.line=n,this.column=o}line;column},de=(n,o,c)=>new Ad(n.line,Nv(n,o),c),rd=/^[^\s[\]「」=:]+$/u,Ov=/^([^\s:[\]]+?)\s*->\s*([^\s:[\]]+)/du,Bv=new RegExp(`^commit\\s+([^\\s[]+)(?:\\s+${j0}\\s+([^\\s[]+))?(?:\\s+${z0}\\s+([^\\s[]+))?(?:\\s+${R0}\\s+([^\\s[]+))?`,"du"),jv=new RegExp(`^([^\\s[]+)\\s+${xd}(?:\\s+([^\\s[]+))?\\s*$`,"du"),zv=/^[0-9a-f]{4,40}$/u,Rv=/^(\/|https?:\/\/)/u,qv=/^scale\s+(\S+)\s+(\S+)\s+([^\s[]+)/du,Hv=/^period\s+(\S+)\s+([^\s[]+)/du,Uv=new RegExp(`^point\\s+(\\S+)\\s+${q0}\\s+(\\S+)\\s*$`,"du"),Lv=/^zoom\s+(\S+)\s*$/du,Fv=new RegExp(`^${Al}\\s*->`,"u"),Gv=new RegExp(`^${Al}\\s*->\\s*(\\S+)\\s*$`,"du"),Yv=/^mark\s+([^\s[]+)\s+([^\s[]+)/du,Pv=/^span\s+([^\s:[]+)\s*:/du,Vv=/^[0-9]+(\.[0-9]+)?(ms|s|min|h|d)$/u,Pm=/^([0-9]+\/[0-9]+|[0-9]+(\.[0-9]+)?%)$/u,Vm=/^[1-9][0-9]*$/u,Vu=/^(0|[1-9][0-9]*)$/u,Xv=/^(0|[1-9][0-9]*)(?:-(0|[1-9][0-9]*))?$/u,xn=(n,o)=>n.includes(o);function Ut(n,o){let c=o;for(;c<n.length&&/\s/u.test(n[c]??"");)c++;return c}function co(n,o,c){const u=n.text;let p="";for(let s=o+1;s<u.length;s++){const r=u[s]??"",l=u[s+1]??"";if(r==="\\"&&(l==='"'||l==="\\"))p+=l,s++;else{if(r==='"')return{value:p,end:s+1};p+=r}}throw de(n,o,c.quoteUnclosed)}function ys(n,o,c){const u=n.text,p=Ut(u,o);if(u[p]==='"'){const l=co(n,p,c),m=Ut(u,l.end);if(m<u.length&&u[m]!=="[")throw de(n,m,c.afterQuote);return{value:l.value,rest:m}}const s=u.indexOf("[",p),r=s<0?u.length:s;return{value:u.slice(p,r).trim(),rest:r}}function Yn(n,o,c,u){const p=n.text;if(!p.endsWith("]"))throw de(n,o,u.attrUnclosed);const s=p.length-1,r=new Map;for(let l=o+1;;){const m=Ut(p,l);let h=m;for(;h<s&&p[h]!==":"&&p[h]!==",";)h++;if(h>=s||p[h]!==":")throw de(n,m,u.attrNoColon(p.slice(m,h).trim()));const g=p.slice(m,h).trim();if(!c.includes(g))throw de(n,m,u.badAttr(g,c));if(r.has(g))throw de(n,m,u.attrTwice(g));let x=Ut(p,h+1),A;if(p[x]==='"'){const w=co(n,x,u);if(A=w.value,x=Ut(p,w.end),x<s&&p[x]!==",")throw de(n,x,u.afterQuote)}else{const w=p.indexOf(",",x),D=w<0||w>s?s:w;A=p.slice(x,D).trim(),x=D}if(A==="")throw de(n,m,u.attrNoValue(g));if(r.set(g,{value:A,at:m}),x>=s)return r;l=x+1}}function Qv(n,o,c){const u=n.text,p=[];for(let s=o;;){const r=Ut(u,s);let l,m;if(u[r]==='"'){const h=co(n,r,c);if(l=h.value,m=Ut(u,h.end),m<u.length&&u[m]!==",")throw de(n,m,c.afterQuote)}else{const h=u.indexOf(",",r);m=h<0?u.length:h,l=u.slice(r,m).trim()}if(l==="")throw de(n,r,c.emptyStripField);if(p.push(l),m>=u.length)return p;s=m+1}}function Fr(n,o,c,u){const p=n.text,s=Ut(p,o.length),r=/^[^\s[]+/u.exec(p.slice(s))?.[0];if(r===void 0)throw de(n,0,u.needsId(o));if(!rd.test(r))throw de(n,s,u.badId(r));let l=Ut(p,s+r.length),m;if(p.startsWith(Lr,l)&&/^(\s|$)/u.test(p.slice(l+Lr.length,l+Lr.length+1))){const g=ys(n,l+Lr.length,u);if(g.value==="")throw de(n,l,u.emptyName(r));m=g.value,l=g.rest}if(l<p.length&&p[l]!=="[")throw de(n,l,u.afterId);const h=l<p.length?Yn(n,l,c,u):new Map;return{id:r,idAt:s,...m!==void 0?{name:m}:{},attrs:h}}function Xm(n,o,c){const u=o.get("color");if(u&&!xn(bs,u.value))throw de(n,u.at,c.badColor);const p=o.get("note")?.value,s=o.get("icon")?.value;return{...p!==void 0?{note:p}:{},...u?{color:u.value}:{},...s!==void 0?{icon:s}:{}}}function Qm(n,o){const c=n.split(/\s/u)[0]??"";if(c==="帯")return{word:c,shape:o?"set":"strip"};if(Object.hasOwn(Gm,c))return{word:c,shape:Gm[c]};if(n.startsWith("#"))return{word:"#",shape:"step"};if(n.startsWith(">"))return{word:">",shape:"say"};if(n.startsWith("`"))return{word:"`",shape:"code"};if(n.includes("「"))return{word:"「」",shape:o?"note":"box"};if(/^[^\s=:]+\s*=(?!>)/u.test(n))return{word:"=",shape:"box"};if(o&&/^[^\s:]+\s*:/u.test(n))return{word:":",shape:"act"}}function Zv(n,o){const c=n.findIndex(b=>!Ym(b)),u=n[c];if(!u)throw new Ad(1,1,o.noHead);const p=u.text.split(/\s/u)[0]??"";if(!xn(mi,p)){const b=Qm(u.text,!1);throw de(u,0,b?o.oldForm(b.word,b.shape):o.badHead)}const s=ys(u,p.length,o);if(s.value==="")throw de(u,0,o.badHead);const r=s.value,l=s.rest<u.text.length?Yn(u,s.rest,ln.diagram,o).get("view"):void 0;if(l&&!xn(kd,l.value))throw de(u,l.at,o.badView);const m=l?.value,h=p==="state",g=p==="git",x=p==="time";let A,w;const D=[],T=[];let B;const N=[],M=[];let z=!1,ae,le=0;const V=[],J=new Set,X=new Map,W=[],re=[],ye=[],he=new Set;let me;const Oe=[];let xe,C;const $=(b,k,O)=>{if(he.has(k))throw de(b,O,o.duplicate(k));he.add(k)},q=(b,k,O)=>{if(!re.some(se=>se.id===k))throw de(b,O,o.undeclaredBox(k));return k},G=(b,k,O)=>{if(!X.has(k))throw de(b,O,o.undeclaredBranch(k));return k},R=(b,k,O)=>{if(!J.has(k))throw de(b,O,o.noCommit(k));return k},S=(b,k,O,se)=>{if(g){if(se==="to")return R(b,k,O);if(k!==In&&!X.has(k))throw de(b,O,o.undeclaredRef(k));return k}if(x){if(!re.some(I=>I.id===k)&&!T.some(I=>I.id===k))throw de(b,O,o.undeclaredNote(k));return k}if(!h||!xn(gi,k))return q(b,k,O);if(k==="start"!=(se==="from"))throw de(b,O,k==="start"?o.intoStart:o.outOfFinish);return k},H=(b,k,O)=>{if(h&&xn(gi,k))throw de(b,O,o.reservedId(k));if(g&&k===In)throw de(b,O,o.headReserved(k));if(x&&k===Al)throw de(b,O,o.nowReserved(k))},K=b=>{if(!xe)throw de(b,0,o.stepLineBeforeStep);return xe},pe=b=>{if(xe)throw de(b,0,o.declarationInStep)},_e=()=>{if(xe){if(xe.body===void 0)throw de(xe.source,0,o.noBody(xe.title));Oe.push({title:xe.title,body:xe.body.join(`
`),...xe.code!==void 0?{code:xe.code}:{},...xe.sources.length>0?{sources:xe.sources}:{},events:xe.events})}},De=n.slice(c+1);for(let b=0;b<De.length;b++){const k=De[b];if(!k||Ym(k))continue;const O=k.text;if(x&&Fv.test(O)){K(k).events.push(_(k));continue}const se=Ov.exec(O);if(se){h&&!xe?ye.push(Wt(k,se)):K(k).events.push(Rt(k,se));continue}const[I="",ce]=O.split(/\s+/u);if(g&&X.has(I)&&ce===xd){K(k).events.push(Ct(k));continue}if(!g&&(I==="branch"||I==="commit"))throw de(k,0,o.gitOnly(I));if(!x&&xn(B0,I))throw de(k,0,o.timeOnly(I));if(!xn(vd,I)){const Se=Qm(O,xe!==void 0);throw de(k,0,Se?o.oldForm(Se.word,Se.shape):o.unknownHead(I))}switch(I){case"group":Ce(k);break;case"end":if(O!==I)throw de(k,I.length,o.endTakesNothing);if(!C)throw de(k,0,o.strayEnd);C=void 0;break;case"box":we(k);break;case"strip":Ie(k);break;case"step":{if(C)throw de(C.source,0,o.unclosedGroup(C.id));je(),_e();const Se=O.slice(I.length).trim();if(Se==="")throw de(k,0,o.emptyStepTitle);xe={source:k,title:Se,sources:[],events:[]};break}case"say":b=Xt(k,b);break;case"code":{const Se=K(k);if(Se.code!==void 0)throw de(k,0,o.codeTwice);const ve=O.slice(I.length).trim();if(ve==="")throw de(k,0,o.emptyCode);Se.code=ve;break}case"source":K(k).sources.push(Ae(k));break;case"act":{const Se=K(k),ve=Qt(k,I,o.actShape);Se.events.push({type:"action",box:ve.box,label:ve.text});break}case"note":{const Se=K(k);if(x){Se.events.push(be(k));break}const ve=Qt(k,I,o.noteShape);Se.events.push({type:"swap",box:ve.box,text:ve.text});break}case"set":K(k).events.push(It(k));break;case"branch":Be(k);break;case"commit":{K(k).events.push(Ke(k));break}case"scale":U(k);break;case"period":ke(k);break;case"row":Ne(k);break;case"point":Z(k);break;case"zoom":Ee(k);break;case"mark":K(k).events.push(P(k));break;case"span":K(k).events.push(Y(k));break}}if(C)throw de(C.source,0,o.unclosedGroup(C.id));if(je(),_e(),g&&V.length===0)throw de(u,0,o.noBranches);if(re.length===0&&!g&&!x)throw de(u,0,o.noBoxes);if(Oe.length===0)throw de(u,0,o.noSteps);return{version:Sl,kind:p,title:r,...m?{view:m}:{},...W.length>0?{regions:W}:{},boxes:re,...me?{strip:N.length>0?{...me,meters:N}:me}:{},steps:Oe,...p==="sequence"?{sequence:{lifelines:re.map(b=>b.id)}}:{},...ye.length>0?{state:{paths:ye}}:{},...g?{git:{branches:V}}:{},...x&&A?{time:{scale:A,...w?{period:w}:{},rows:D,...T.length>0?{points:T}:{},...B?{zoom:B}:{}}}:{}};function je(){if(!(!x||z)){if(z=!0,!A)throw de(u,0,o.noScale);if(D.length===0)throw de(u,0,o.noRows);for(const b of M)b();if(ae&&!B)throw de(ae,0,o.boxNeedsZoom)}}function Le(){return A?.count??0}function ze(b,k,O){if(!Vu.test(O)||Number(O)>=Le())throw de(b,k,o.badUnit(O,Le()));return Number(O)}function Ze(b,k,O){const se=Xv.exec(O),I=Number(se?.[1]),ce=Number(se?.[2]??se?.[1]);if(!se||I>ce||ce>=Le())throw de(b,k,o.badUnit(O,Le()));return{from:I,to:ce}}function U(b){if(pe(b),A)throw de(b,0,o.timeTwice("scale"));const k=b.text,O=qv.exec(k),se=Re=>O?.indices?.[Re]?.[0]??0;if(!O)throw de(b,0,o.scaleShape);const I=Ut(k,O[0].length);if(I<k.length&&k[I]!=="[")throw de(b,I,o.scaleShape);const ce=O[2]??"";if(!Vv.test(ce))throw de(b,se(2),o.badLength);const Se=O[3]??"";if(!Vm.test(Se))throw de(b,se(3),o.badCount("scale"));const ve=I<k.length?Yn(b,I,ln.scale,o).get("from"):void 0;if(ve&&!Vu.test(ve.value))throw de(b,ve.at,o.scaleShape);A={unit:O[1]??"",length:ce,count:Number(Se),...ve?{from:Number(ve.value)}:{}}}function ke(b){if(pe(b),w)throw de(b,0,o.timeTwice("period"));const k=b.text,O=Hv.exec(k);if(!O)throw de(b,0,o.periodShape);const se=Ut(k,O[0].length);if(se<k.length&&k[se]!=="[")throw de(b,se,o.periodShape);const I=O[2]??"";if(!Vm.test(I))throw de(b,O.indices?.[2]?.[0]??0,o.badCount("period"));const ce=se<k.length?Yn(b,se,ln.period,o).get("from"):void 0;if(ce&&!Vu.test(ce.value))throw de(b,ce.at,o.periodShape);w={name:O[1]??"",length:Number(I),...ce?{from:Number(ce.value)}:{}}}function Ne(b){pe(b);const k=Fr(b,"row",ln.row,o);if(H(b,k.id,k.idAt),D.some(ce=>ce.id===k.id)||T.some(ce=>ce.id===k.id))throw de(b,k.idAt,o.duplicate(k.id));const O=k.attrs.get("color");if(O&&!xn(bs,O.value))throw de(b,O.at,o.badColor);const se=k.attrs.get("empty"),I={id:k.id,name:k.name??k.id,...O?{color:O.value}:{}};if(D.push(I),se){const ce=se.value.split(/\s+/u);I.empty=[],M.push(()=>{I.empty=ce.map(Se=>ze(b,se.at,Se))})}}function Z(b){pe(b);const k=Uv.exec(b.text),O=k?.[1],se=k?.[2];if(!k||O===void 0||se===void 0)throw de(b,0,o.pointShape);const I=k.indices?.[1]?.[0]??0,ce=k.indices?.[2]?.[0]??0;if(!rd.test(O))throw de(b,I,o.badId(O));if(H(b,O,I),D.some(ve=>ve.id===O))throw de(b,I,o.duplicate(O));$(b,O,I);const Se={id:O,at:0};T.push(Se),M.push(()=>{Se.at=ze(b,ce,se)})}function Ee(b){if(pe(b),B)throw de(b,0,o.timeTwice("zoom"));const k=Lv.exec(b.text),O=k?.[1];if(!k||O===void 0)throw de(b,0,o.zoomShape);const se=k.indices?.[1]?.[0]??0,I={from:0,to:0};B=I,M.push(()=>{Object.assign(I,Ze(b,se,O))})}function _(b){const k=Gv.exec(b.text),O=k?.[1];if(!k||O===void 0)throw de(b,0,o.nowShape);const se=k.indices?.[1]?.[0]??0,I=ze(b,se,O);if(I+1<=le)throw de(b,se,o.nowBack(O,le-1));return le=I+1,{type:"now",to:I}}function P(b){const k=b.text,O=Yv.exec(k),se=O?.[1],I=O?.[2];if(!O||se===void 0||I===void 0)throw de(b,0,o.markShape);if(!D.some(ht=>ht.id===se))throw de(b,O.indices?.[1]?.[0]??0,o.undeclaredRow(se));const{from:ce,to:Se}=Ze(b,O.indices?.[2]?.[0]??0,I),ve=Ut(k,O[0].length);if(ve>=k.length||k[ve]!=="[")throw de(b,ve,o.markShape);const Re=Yn(b,ve,ln.mark,o).get("color");if(!Re)throw de(b,ve,o.markShape);if(!xn(bs,Re.value))throw de(b,Re.at,o.badColor);return{type:"mark",row:se,from:ce,to:Se,color:Re.value}}function Y(b){const k=Pv.exec(b.text),O=k?.[1];if(!k||O===void 0)throw de(b,0,o.spanShape);const{from:se,to:I}=Ze(b,k.indices?.[1]?.[0]??0,O),ce=ys(b,k[0].length,o);if(ce.value==="")throw de(b,0,o.spanShape);const Se=ce.rest<b.text.length?Yn(b,ce.rest,ln.span,o):new Map,ve=Se.get("shape");if(ve&&!xn(yi,ve.value))throw de(b,ve.at,o.badShape);const Re=Se.get("color");if(Re&&!xn(bs,Re.value))throw de(b,Re.at,o.badColor);return{type:"span",from:se,to:I,text:ce.value,...ve?{shape:"box"}:{},...Re?{color:Re.value}:{}}}function be(b){const k=/^note\s+([^\s:]+)\s*:/du.exec(b.text),O=k?.[1];if(!k||O===void 0)throw de(b,0,o.noteShape);const se=k.indices?.[1]?.[0]??0,I=T.some(ve=>ve.id===O);if(!I&&!re.some(ve=>ve.id===O))throw de(b,se,o.undeclaredNote(O));const ce=ys(b,k[0].length,o);if(ce.value==="")throw de(b,0,o.noteShape);const Se=ce.rest<b.text.length?Yn(b,ce.rest,ln.note,o).get("color"):void 0;if(Se&&!I)throw de(b,Se.at,o.noteColorPointOnly);if(Se&&!xn(bs,Se.value))throw de(b,Se.at,o.badColor);return{type:"swap",box:O,text:ce.value,...Se?{color:Se.value}:{}}}function Ce(b){if(pe(b),g)throw de(b,0,o.gitNoGroup);if(C)throw de(b,0,o.nestedGroup);const k=Fr(b,"group",ln.group,o);if(W.some(O=>O.id===k.id)){if(k.name!==void 0||k.attrs.size>0)throw de(b,0,o.regionReopened(k.id))}else H(b,k.id,k.idAt),$(b,k.id,k.idAt),W.push({id:k.id,name:k.name??k.id,...Xm(b,k.attrs,o)});C={source:b,id:k.id}}function we(b){pe(b);const k=Fr(b,"box",ln.box,o);H(b,k.id,k.idAt),$(b,k.id,k.idAt),ae??=b;const{note:O,...se}=Xm(b,k.attrs,o),I=k.attrs.get("link");re.push({id:k.id,name:k.name??k.id,...O!==void 0?{sub:O}:{},...se,...C?{region:C.id}:{},...I?{link:Te(b,"link",I)}:{}})}function Ae(b){const k=ys(b,6,o),O=k.rest<b.text.length?Yn(b,k.rest,ln.source,o).get("url"):void 0;if(k.value===""||!O)throw de(b,0,o.sourceShape);return{name:k.value,url:Te(b,"url",O)}}function Te(b,k,O){if(!Rv.test(O.value))throw de(b,O.at,o.badUrl(k));return O.value}function Be(b){pe(b);const k=Fr(b,"branch",ln.branch,o);if(k.name!==void 0)throw de(b,0,o.branchShape);H(b,k.id,k.idAt),$(b,k.id,k.idAt);const O=k.attrs.get("note")?.value;V.push({id:k.id,...O!==void 0?{note:O}:{}}),X.set(k.id,null)}function Ke(b){const k=b.text,O=Bv.exec(k),se=Es=>O?.indices?.[Es]?.[0]??0,I=O?.[1],ce=O?.[2];if(!O||I===void 0||ce===void 0)throw de(b,0,o.commitShape);const Se=Ut(k,O[0].length);if(Se<k.length&&k[Se]!=="[")throw de(b,Se,o.commitShape);if(!rd.test(I))throw de(b,se(1),o.badId(I));H(b,I,se(1)),$(b,I,se(1));const ve=G(b,ce,se(2)),Re=O[3]===void 0?void 0:R(b,O[3],se(3)),ht=O[4]===void 0?void 0:gt(b,O[4],se(4),ve),kt=Se<k.length?Yn(b,Se,ln.commit,o):new Map,ot=kt.get("hash");if(ot&&!zv.test(ot.value))throw de(b,ot.at,o.badHash);const Dt=kt.get("note")?.value;return J.add(I),Re===void 0&&X.set(ve,I),{type:"commit",id:I,branch:ve,...Re!==void 0?{copy:Re}:{},...ht!==void 0?{merge:ht}:{},...ot?{hash:ot.value}:{},...Dt!==void 0?{note:Dt}:{}}}function gt(b,k,O,se){if(G(b,k,O),k===se)throw de(b,O,o.mergeSelf(k));if(X.get(k)===null)throw de(b,O,o.emptyBranch(k));return k}function Ct(b){const k=jv.exec(b.text),O=k?.[1],se=k?.[2];if(!k||O===void 0||se===void 0)throw de(b,0,o.fromShape);return R(b,se,k.indices?.[2]?.[0]??0),X.set(O,se),{type:"branch",branch:O,from:se}}function Ie(b){if(pe(b),me)throw de(b,0,o.stripTwice);const k=b.text,O=Ut(k,5);let se,I;if(k[O]==='"'){const ve=co(b,O,o);se=ve.value,I=Ut(k,ve.end)}else I=k.indexOf(":",O),se=I<0?"":k.slice(O,I).trim();if(se===""||k[I]!==":")throw de(b,0,o.stripShape);if(x){me={title:se,fields:zt(b,I+1)};return}const ce=Qv(b,I+1,o),Se=/\[\s*meter\s*:/u.exec(k);if(Se&&ce.some(ve=>/\[\s*meter\s*:[^\]]*\]$/u.test(ve)))throw de(b,Se.index+1,o.timeOnly("meter"));me={title:se,fields:ce}}function zt(b,k){const O=b.text,se=[];for(let I=k;;){const ce=Ut(O,I);let Se,ve;if(O[ce]==='"'){const Re=co(b,ce,o);Se=Re.value,ve=Ut(O,Re.end)}else{for(ve=ce;ve<O.length&&O[ve]!==","&&O[ve]!=="[";)ve++;Se=O.slice(ce,ve).trim()}if(Se==="")throw de(b,ce,o.emptyStripField);if(O[ve]==="["){const Re=O.indexOf("]",ve);if(Re<0)throw de(b,ve,o.attrUnclosed);const ht=O.slice(ve+1,Re),kt=/^\s*([a-z]*)\s*:\s*(.*?)\s*$/u.exec(ht);if(!kt)throw de(b,ve+1,o.attrNoColon(ht.trim()));const ot=kt[1]??"";if(!ln.strip.includes(ot))throw de(b,ve+1,o.badAttr(ot,ln.strip));if(!Pm.test(kt[2]??""))throw de(b,ve+1,o.badRatio);N.push({field:Se,line:kt[2]??""}),ve=Ut(O,Re+1)}if(ve<O.length&&O[ve]!==",")throw de(b,ve,o.afterQuote);if(se.push(Se),ve>=O.length)return se;I=ve+1}}function Xt(b,k){const O=K(b);if(O.body!==void 0)throw de(b,0,o.sayTwice);const se=b.text.slice(3).trim(),I=se===""?[]:[se];let ce=0,Se=k;for(let ve=k+1;ve<De.length;ve++){const Re=De[ve];if(!Re)break;if(Re.text===""){ce++;continue}if(Re.indent<=b.indent)break;I.push(...Array.from({length:ce},()=>""),Re.text),ce=0,Se=ve}if(I.length===0)throw de(b,0,o.emptySay);return O.body=I,Se}function Qt(b,k,O){const se=new RegExp(`^${k}\\s+([^\\s:]+)\\s*:\\s*(.*)$`,"du").exec(b.text),I=se?.indices?.[1]?.[0];if(!se||I===void 0||(se[2]??"")==="")throw de(b,0,O);return{box:q(b,se[1]??"",I),text:se[2]??""}}function wn(b,k){const O=b.text,se=S(b,k[1]??"",k.indices?.[1]?.[0]??0,"from"),I=S(b,k[2]??"",k.indices?.[2]?.[0]??0,"to"),ce=Ut(O,k[0].length);if(O[ce]!==":")return{from:se,to:I,at:ce};const Se=ys(b,ce+1,o);if(Se.value==="")throw de(b,ce,o.emptyLabel);return{from:se,to:I,label:Se.value,at:Se.rest}}function Wt(b,k){const{from:O,to:se,label:I,at:ce}=wn(b,k);if(ce<b.text.length)throw de(b,ce,b.text[ce]==="["?o.pathNoAttrs:o.edgeShape);return{from:O,to:se,...I!==void 0?{label:I}:{}}}function Rt(b,k){const O=b.text,{from:se,to:I,label:ce,at:Se}=wn(b,k);if(Se<O.length&&O[Se]!=="[")throw de(b,Se,o.edgeShape);const ve=Se<O.length?Yn(b,Se,ln.edge,o):new Map,Re=ve.get("tag"),ht=ve.get("carry");if(Re&&ht)throw de(b,Math.max(Re.at,ht.at),o.carryTwice);if(ht&&!xn(wd,ht.value))throw de(b,ht.at,o.badCarry);const kt=ve.get("side");if(kt&&!xn(Ed,kt.value))throw de(b,kt.at,o.badSide);const ot=rn(b,se,I,ve,Se);let Dt=g?{kind:"tag",text:se}:{kind:"envelope"};return Re?Dt={kind:"tag",text:Re.value}:ht&&(Dt=ht.value==="coin"?{kind:"coin"}:{kind:"none"}),g&&se!==In&&X.set(se,I),{type:"edge",from:se,to:I,...ce!==void 0?{label:ce}:{},carry:Dt,...kt?{labelSide:kt.value}:{},...ot}}function rn(b,k,O,se,I){const Se=lv.flatMap(ot=>{const Dt=se.get(ot);return Dt?[{key:ot,attr:Dt}]:[]})[0];if(!x){if(Se)throw de(b,Se.attr.at,o.timeOnly(Se.key));return{}}const ve=ot=>re.some(Dt=>Dt.id===ot);if(ve(k)!==ve(O))throw de(b,0,o.mixedLine);if(!ve(k)){if(Se)throw de(b,Se.attr.at,B?o.pointLineNoAt:o.noZoom);return{}}const Re=ot=>{if(!ot)return;const Dt=ze(b,ot.at,ot.value);if(!B||Dt<B.from||Dt>B.to)throw de(b,ot.at,B?o.outOfZoom(B.from,B.to):o.noZoom);return Dt},ht=Re(se.get("at"));if(ht===void 0)throw de(b,I,o.boxLineNeedsAt);const kt=Re(se.get("into"));return{at:ht,...kt!==void 0?{into:kt}:{}}}function It(b){const k=me;if(!k)throw de(b,0,o.stripUndeclared);const O=b.text,se=Ut(O,3);let I,ce;if(O[se]==='"'){const Re=co(b,se,o);I=Re.value,ce=Ut(O,Re.end)}else{for(ce=se;ce<O.length&&O[ce]!==":"&&O[ce]!=="[";)ce++;I=O.slice(se,ce).trim()}if(!k.fields.includes(I))throw de(b,se,o.noSuchField(I));let Se;if(O[ce]===":"){const Re=ys(b,ce+1,o);if(Re.value==="")throw de(b,ce,o.stripNeedsValue);Se=Re.value,ce=Re.rest}if(ce<O.length&&O[ce]!=="[")throw de(b,ce,o.stripNeedsValue);const ve=ce<O.length?Yn(b,ce,ln.set,o).get("tag")?.value:void 0;if(Se===void 0&&ve===void 0)throw de(b,0,o.stripNeedsValue);if(Se!==void 0&&N.some(Re=>Re.field===I)&&!Pm.test(Se))throw de(b,se,o.meterValue(I));return{type:"strip",field:I,...Se!==void 0?{value:Se}:{},...ve!==void 0?{tag:ve}:{}}}}function Za(n,o={}){try{return{ok:!0,diagram:Zv(Tv(n),Dv(o.lang??"ja"))}}catch(c){if(!(c instanceof Ad))throw c;return{ok:!1,errors:[{line:c.line,column:c.column,message:c.message}]}}}var _l=n=>`"${n.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`,vs=n=>n.includes("[")||n.startsWith('"')?_l(n):n,L0=n=>n.includes(":")||n.includes("[")||n.startsWith('"')?_l(n):n,Jv=(n,o)=>n.includes(",")||n.startsWith('"')||o&&n.includes("[")?_l(n):n,Kv=n=>n.includes(",")||n.includes("]")||n.startsWith('"')?_l(n):n,pn=n=>{const o=n.filter(c=>c[1]!==void 0);return o.length===0?"":` [${o.map(([c,u])=>`${c}: ${Kv(u)}`).join(", ")}]`},Sd=(n,o)=>o===n?"":` as ${vs(o)}`,Zm=n=>`group ${n.id}${Sd(n.id,n.name)}${pn([["note",n.note],["color",n.color],["icon",n.icon]])}`,Wv=n=>`box ${n.id}${Sd(n.id,n.name)}${pn([["note",n.sub],["color",n.color],["icon",n.icon],["link",n.link]])}`,F0=(n,o,c)=>`${n} -> ${o}${c===void 0?"":`: ${vs(c)}`}`,ld=(n,o)=>n===o?`${n}`:`${n}-${o}`,gl=n=>n===void 0?void 0:`${n}`;function Iv(n,o){switch(n.type){case"edge":{const u=(o==="git"?n.carry.kind==="tag"&&n.carry.text===n.from:n.carry.kind==="envelope")?[]:n.carry.kind==="tag"?[["tag",n.carry.text]]:[["carry",n.carry.kind]];return`${F0(n.from,n.to,n.label)}${pn([...u,["side",n.labelSide],["at",gl(n.at)],["into",gl(n.into)]])}`}case"action":return`act ${n.box}: ${n.label}`;case"swap":return o==="time"?`note ${n.box}: ${vs(n.text)}${pn([["color",n.color]])}`:`note ${n.box}: ${n.text}`;case"now":return`${Al} -> ${n.to}`;case"mark":return`mark ${n.row} ${ld(n.from,n.to)}${pn([["color",n.color]])}`;case"span":return`span ${ld(n.from,n.to)}: ${vs(n.text)}${pn([["shape",n.shape],["color",n.color]])}`;case"strip":return`set ${L0(n.field)}${n.value===void 0?"":`: ${vs(n.value)}`}${pn([["tag",n.tag]])}`;case"commit":return`commit ${n.id} ${j0} ${n.branch}${n.copy===void 0?"":` ${z0} ${n.copy}`}${n.merge===void 0?"":` ${R0} ${n.merge}`}${pn([["hash",n.hash],["note",n.note]])}`;case"branch":return`${n.branch} ${xd} ${n.from}`}}function e1(n){const o=[`scale ${n.scale.unit} ${n.scale.length} ${n.scale.count}${pn([["from",gl(n.scale.from)]])}`,...n.period?[`period ${n.period.name} ${n.period.length}${pn([["from",gl(n.period.from)]])}`]:[]],c=n.rows.map(p=>`row ${p.id}${Sd(p.id,p.name)}${pn([["color",p.color],["empty",p.empty&&p.empty.length>0?p.empty.join(" "):void 0]])}`),u=(n.points??[]).map(p=>`point ${p.id} ${q0} ${p.at}`);return[o.join(`
`),c.join(`
`),...u.length>0?[u.join(`
`)]:[],...n.zoom?[`zoom ${ld(n.zoom.from,n.zoom.to)}`]:[]]}function t1(n){const o=n.regions??[],c=[];for(const l of n.boxes){const m=c.at(-1);m&&m.region===l.region?m.boxes.push(l):c.push({...l.region!==void 0?{region:l.region}:{},boxes:[l]})}const u=[...new Set(c.flatMap(l=>l.region===void 0?[]:[l.region]))],p=u.length===o.length&&u.every((l,m)=>o[m]?.id===l),s=new Set,r=[];if(!p)for(const l of o)r.push(`${Zm(l)}
end`),s.add(l.id);for(const l of c){const m=l.boxes.map(Wv);if(l.region===void 0){r.push(m.join(`
`));continue}const h=o.find(x=>x.id===l.region),g=s.has(l.region)||!h?`group ${l.region}`:Zm(h);s.add(l.region),r.push([g,...m.map(x=>`  ${x}`),"end"].join(`
`))}return r}function bi(n){const o=(n.git?.branches??[]).map(p=>`branch ${p.id}${pn([["note",p.note]])}`),c=n.kind==="time",u=[`${n.kind} ${vs(n.title)}${pn([["view",n.view]])}`,...o.length>0?[o.join(`
`)]:[],...n.time?e1(n.time):[],...t1(n)];if(n.strip){const p=new Map((n.strip.meters??[]).map(r=>[r.field,r.line])),s=n.strip.fields.map(r=>`${Jv(r,c)}${pn([["meter",p.get(r)]])}`);u.push(`strip ${L0(n.strip.title)}: ${s.join(", ")}`)}n.state&&u.push(n.state.paths.map(p=>F0(p.from,p.to,p.label)).join(`
`));for(const p of n.steps){const s=p.body.split(`
`),r=s.length===1?[`  say ${p.body}`]:["  say",...s.map(l=>l===""?"":`    ${l}`)];u.push([`step ${p.title}`,...r,...p.code===void 0?[]:[`  code ${p.code}`],...(p.sources??[]).map(l=>`  source ${vs(l.name)}${pn([["url",l.url]])}`),...p.events.map(l=>`  ${Iv(l,n.kind)}`)].join(`
`))}return`${u.join(`

`)}
`}var vi={sans:"Noto Sans JP Variable",mono:"JetBrains Mono Variable"},n1={0:590,1:590,2:590,3:590,4:590,5:590,6:590,7:590,8:590,9:590," ":228,"!":371,'"':575,"#":590,$:590,"%":963,"&":740,"'":325,"(":378,")":378,"*":507,"+":590,",":325,"-":371,".":325,"/":390,":":325,";":325,"<":590,"=":590,">":590,"?":514,"@":1007,A:642,B:682,C:657,D:715,E:616,F:586,G:718,H:758,I:330,J:568,K:686,L:579,M:854,N:750,O:771,P:668,Q:771,R:682,S:624,T:626,U:748,V:619,W:915,X:627,Y:581,Z:614,"[":378,"\\":390,"]":378,"^":590,_:568,"`":626,a:591,b:644,c:528,d:645,e:581,f:372,g:598,h:640,i:305,j:306,k:605,l:315,m:964,n:641,o:626,p:645,q:645,r:437,s:495,t:421,u:638,v:576,w:863,x:562,y:575,z:512,"{":378,"|":297,"}":378,"~":590,"…":1e3,"−":590,"×":1e3,"→":1e3,"←":1e3,"↑":1e3,"↓":1e3,"–":545,"—":908,"‘":325,"’":325,"“":575,"”":575,"°":404,"±":1e3,"·":593,"•":379},a1=600,s1=11904,cd=1e3;function o1(n,o){return(n.codePointAt(0)??0)>=s1?cd:o==="mono"?a1:n1[n]??cd}var i1={clear:{name:"澄んだ色",note:"白い地に、中くらいの明るさの鮮やかな 6 色。今の見本帳の色",light:{page:"#f3f4f7",bg:"#ffffff",surf:"#ffffff",sunk:"#f5f6f8",ink:"#12141a",ink2:"#3f4451",mute:"#6b7180",hair:"#12141a1c",line:"#12141a40",sh:"#101828","on-c":"#ffffff","c-blue":"#467deb","t-blue":"#2e62ce","c-amber":"#d28008","t-amber":"#975b04","c-green":"#0ea886","t-green":"#07775e","c-violet":"#6c3bb2","t-violet":"#6c3bb2","c-rose":"#ba3e40","t-rose":"#b83c3f","c-slate":"#5d6677","t-slate":"#5d6677",coin:"#e9b114",coint:"#856300",coinin:"#a8740c",tint:"5%",edge:"20%",shA:".05",shB:".08",carry:"#65686f"},dark:{page:"#08090c",bg:"#0d0e12",surf:"#17191f",sunk:"#121419",ink:"#eceef3",ink2:"#c4c8d2",mute:"#9198a6",hair:"#eceef31f",line:"#eceef340",sh:"#000000","on-c":"#0d0e12","c-blue":"#7e7ef6","t-blue":"#989cfd","c-amber":"#c78135","t-amber":"#dd954b","c-green":"#20ac7a","t-green":"#35b986","c-violet":"#695b9f","t-violet":"#a79ae3","c-rose":"#bc434b","t-rose":"#fd7d81","c-slate":"#9ba3b2","t-slate":"#9da5b4",coin:"#f0c040",coint:"#f0c040",coinin:"#9a6a0c",tint:"6%",edge:"19%",shA:".45",shB:".35"}},paper:{name:"紙と墨",note:"生成りの紙の地に、藍 / 黄土 / 苔 / 葡萄 / 朱 / 鈍のくすんだ 6 色",light:{page:"#ece7dd",bg:"#f9f6f0",surf:"#fffcf6",sunk:"#f2ede4",ink:"#221e18",ink2:"#4b453b",mute:"#7b7366",hair:"#221e181f",line:"#221e1847",sh:"#3a2a10","on-c":"#fffcf6","c-blue":"#487dd5","t-blue":"#2d60b5","c-amber":"#c38405","t-amber":"#885a01","c-green":"#57a271","t-green":"#237143","c-violet":"#904698","t-violet":"#904698","c-rose":"#a9513e","t-rose":"#9f4836","c-slate":"#6a645a","t-slate":"#696359",coin:"#d4a52a",coint:"#7d5e05",coinin:"#9a7016",tint:"6%",edge:"22%",shA:".06",shB:".07",carry:"#68635c"},dark:{page:"#0e0d0b",bg:"#15130f",surf:"#1e1b17",sunk:"#191612",ink:"#ede6d8",ink2:"#cbc2b1",mute:"#9c9283",hair:"#ede6d81f",line:"#ede6d842",sh:"#000000","on-c":"#15130f","c-blue":"#5785d5","t-blue":"#76a6f9","c-amber":"#be8802","t-amber":"#d59e2f","c-green":"#52aa71","t-green":"#61b87e","c-violet":"#90529b","t-violet":"#d08edb","c-rose":"#bb4e3d","t-rose":"#f98672","c-slate":"#a9a295","t-slate":"#aca598",coin:"#dcb24e",coint:"#dcb24e",coinin:"#8a6a14",tint:"6%",edge:"19%",shA:".45",shB:".35"}},night:{name:"夜の計器",note:"青みの黒の地に、光る水色 / 琥珀 / 若緑 / 菫 / 桃 の 6 色。明るい側は青灰の地",light:{page:"#e9eef5",bg:"#f6f9fc",surf:"#ffffff",sunk:"#eef3f8",ink:"#0b1424",ink2:"#34425a",mute:"#64748b",hair:"#0b14241c",line:"#0b142440",sh:"#0b1424","on-c":"#ffffff","c-blue":"#0385cd","t-blue":"#086aa3","c-amber":"#ba8e0f","t-amber":"#7f5f04","c-green":"#0a8857","t-green":"#027449","c-violet":"#5839ba","t-violet":"#5839ba","c-rose":"#dd4a94","t-rose":"#b82375","c-slate":"#64748b","t-slate":"#56667c",coin:"#eab308",coint:"#7e6005",coinin:"#a16207",tint:"5%",edge:"22%",shA:".06",shB:".09",carry:"#596579"},dark:{page:"#060a12",bg:"#0a101c",surf:"#111a2a",sunk:"#0d1522",ink:"#e6edf7",ink2:"#b8c4d6",mute:"#8090a8",hair:"#e6edf71c",line:"#9fb3d145",sh:"#000000","on-c":"#0a101c","c-blue":"#3884b6","t-blue":"#62ace1","c-amber":"#be8533","t-amber":"#d59b4b","c-green":"#3ba774","t-green":"#4fb884","c-violet":"#7d4ecd","t-violet":"#b494fd","c-rose":"#bc3a74","t-rose":"#ff77ad","c-slate":"#96a3b5","t-slate":"#99a6b8",coin:"#facc15",coint:"#facc15",coinin:"#a16207",tint:"6%",edge:"19%",shA:".5",shB:".4"}}},yl="paper",ba=Object.fromEntries(Object.entries(i1).map(([n,o])=>[n,{id:n,...o}]));function _d(n){return(n!==void 0&&Object.hasOwn(ba,n)?ba[n]:void 0)??ba[yl]}var r1=["page","bg","surf","sunk","ink","ink2","mute","hair","line","sh","on-c","c-blue","t-blue","c-amber","t-amber","c-green","t-green","c-violet","t-violet","c-rose","t-rose","c-slate","t-slate","coin","coint","coinin","tint","edge","shA","shB","carry"],l1=new Set(r1),c1=n=>l1.has(n);function u1(n){if(typeof n!="string"||!/^[\w\s#%.,()/+-]+$/u.test(n)||/url\(/iu.test(n))return!1;let o=0;for(const c of n)if(o+=c==="("?1:c===")"?-1:0,o<0)return!1;return o===0}function G0(n,o){return Object.entries(n[o]).map(([c,u])=>`--${c}:${u}`).join(";")}var Y0=`--sans:"${vi.sans}";--mono:"${vi.mono}"`,uo=["blue","amber","green","violet","rose"],it=(n,o,c="sans")=>({size:n,weight:o,family:c}),oe={boxName:it(13,650),boxSub:it(11,500),boxSubStrong:it(11,700),regionName:it(12.5,700),regionNote:it(11,500),label:it(11,600,"mono"),labelJa:it(11,650),action:it(11,650),badge:it(10.5,700,"mono"),carrier:it(10.5,700,"mono"),carrierJa:it(10.5,700),stripTitle:it(12.5,700),fieldName:it(10.5,600),fieldValue:it(12,600,"mono"),fieldValueJa:it(12,600),tag:it(10.5,700),miniTitle:it(10.5,700),stepTitle:it(15,700),stepBody:it(13.5,500),stepNo:it(13,700,"mono"),button:it(14,700),gitId:it(11,700),gitHash:it(10.5,600,"mono"),gitNote:it(10.5,650),timeHead:it(11,650,"mono"),timeRow:it(11,600),timeTick:it(10.5,600,"mono"),timePeriod:it(11.5,650),timeRange:it(10.5,500,"mono"),pointName:it(11,700,"mono"),pointState:it(11.5,700),spanText:it(11,650),emptyText:it(11,700),meterLine:it(10.5,700,"mono")},F={gap:10,margin:14,box:{h:72,minW:92,padX:12,radius:12,icon:24,iconRadius:7,iconY:-16,iconScale:.74,nameY:12,subY:27},region:{pad:18,gap:10,radius:14,inset:14,icon:24,iconRadius:7,iconScale:.68,nameY:58,line:16,minH:108},architecture:{columns:4,columnGap:56,maxColumnGap:160,rowGap:44,labelRoom:16},sequence:{columnGap:40,labelRoom:16,labelOffset:16,firstRow:10,rowGap:6,stepGap:6,minPitch:32,tail:10,selfW:34,selfH:18},state:{columns:4,columnGap:64,rowGap:108,labelRoom:16,start:7,end:{r:9,inner:5},drop:56,below:64,beside:38,text:16,loop:{w:24,h:34,samples:12,badgeAt:.6},side:{pad:16,gap:76,lane:30,entry:28},ghost:{h:52,pad:12,gap:10,nameY:-2,subY:14},done:{r:6.5,inset:13},pastLabel:.85},git:{x0:120,pitch:90,textGap:12,r:12,orphan:13.5,topLine:120,line:90,topBelow:30,below:82,bare:62,above:18,under:27,lineStep:13,tagTop:58,tag:30,row:22,turn:60,samples:12,boxGap:24,labelUnder:50,colors:["blue","violet","green","amber","rose"]},time:{width:728,axisX:118,right:16,gutterGap:12,head:22,boxTop:34,boxGap:36,zoomBottom:14,sep:12,zoomGap:12,rowsTop:24,row:20,rowGap:6,markRatio:.5,markMin:1.5,markMax:18,markRadius:1.5,shade:8,frame:2.5,emptyR:1.7,point:{drop:40,r:9,text:15,nameY:-2,stateY:12,link:10,end:6,room:30,plain:12,glyph:.62},bracket:{gap:12,tick:6,text:16,lane:34},box:{pad:6,tagX:12,tagH:16,tagPadX:7},axisGap:18,major:12,minor:6,minorPx:40,tickY:18,rangeY:14,nameGap:8,ticks:6,bottom:12,needle:{over:8,head:6,dot:3.5},meter:{w:150,h:6,y:36,mark:5,textY:59,color:"amber"}},edge:{inset:3,arrow:6,arrowHalf:3.5,parallel:5,ghostDash:5,flowDash:9,bend:12},label:{h:20,padX:9,radius:10,offset:22,side:14,search:4,searchMax:400,soft:6,touch:2},action:{h:22,padX:10,radius:11},badge:{r:9.5,ring:9,inset:4,along:14,short:44},carrier:{envW:24,envH:17,coinR:6.5,coinIn:3.8,tagH:18,tagPadX:8,samples:16},slot:{gap:6,pad:3,spread:4,h:24,radius:7,clear:2,lifeline:5,mark:4},mark:{pad:3,radius:5,dash:4,gap:3},strip:{h:72,line:44,pad:12,icon:24,titleX:44,fieldGap:22,sepInset:14,tagGap:6,tagH:15,tagPadX:7,nameY:22,valueY:43,trail:{r:5.4,step:16},now:{r:3,gap:7}},stroke:{git:2.25,gitOrphan:1.5,mark:1.6,slot:1.2,hair:1,edge:1.7,edgeOn:2.25,arrow:1.5,flow:1.3,halo:7,on:1.75,glyph:2,lifeline:1.2,envelope:1.5,badgeRing:1.5,path:1.6,end:1.6,done:1.2,trail:1.2,timeSlot:.6,timeFrame:1.25,timeAxis:1,timeSpan:1.5,timeDrop:1.4,timePoint:1.75,timeFlag:1.8,timeNeedle:1.25,timeMeter:1.25},shadow:{near:.8,far:4,nearY:1,farY:3},mini:{w:168,pad:8,title:14,inset:12,radius:10},follow:{aspect:.75,minH:320,fitMinH:160,ease:.6,narrow:440,badgeRoom:8,headRoom:10,head:{pad:8,h:40,nameY:17,subY:31}},mix:{slot:45,icon:14,regionIcon:16,regionIconEdge:34,cap:12,capEdge:42,badgePast:14,badgePastEdge:70,mini:62,miniBand:16,miniBandEdge:36,view:6,side:4,sideEdge:36,ghostEdge:60,path:55,past:72,timeShade:3.5,timeSpan:6,timeEmpty:8,timeGuide:50},baseline:{label:3.8,badge:3.5,carrier:3.7,stripTitle:4.5,tag:3.6,action:3.8,mark:4},rise:5,popFrom:.4,player:{gap:10,radius:12,button:36,touch:44,hidden:1,focus:2,narrow:440}},Ge={intro:1.4,outro:4.6,tail:.6,stepBase:1.2,perChar:.025,stepMin:2.2,stepMax:5,dwell:1.2,edgeAt:.1,stagger:.5,draw:.55,drawCarry:.9,action:.9,change:.12,minShow:.8,labelDelay:.15,fade:.3,popFade:.4,untilFade:.2,still:.45,done:.3,time:{axis:11.5,unitMin:.12,unitMax:.4,wait:.15,after:.15,reset:.05}},P0=10.5,rt={inOut:"cubic-bezier(.65,0,.35,1)",out:"cubic-bezier(.22,1,.36,1)",pop:"cubic-bezier(.34,1.56,.64,1)"},Xu=n=>/[0-9A-Za-z]$/u.test(n)?`${n} `:n,d1=n=>n.charAt(0).toUpperCase()+n.slice(1),Ja={ja:{cannotDraw:n=>`図を描けない: ${n}`,unknownColor:n=>`colors の ${n} は色味に無い色の名前`,unreadableColor:n=>`colors の ${n} の値を色として読めない`,overview:"全体図",prev:"前の段",pause:"止める",play:"動かす",next:"次の段",steps:n=>`${n} の段`,side:"脇道",sideNote:"今回は通らない",sideFrom:n=>`${n} つの状態から入れる`,trail:"通った状態",start:"始まり",end:"終わり",badgeName:n=>`段の番号 ${n}`,quoted:n=>`「${n}」`,iconOf:n=>`「${n} の絵柄」`,coin:"「硬貨」",envelope:"「封筒」",textsOverlap:(n,o)=>`${Xu(n)}と${Xu(o)}が重なる`,lineCrosses:(n,o,c)=>`線 ${n} → ${o} が${Xu(c)}を横切る`,timeUnits:{ms:"ミリ秒",s:"秒",min:"分",h:"時間",d:"日"},zoom:"拡大",range:(n,o)=>`${n}〜${o}`,headJoin:" ・ ",empty:"空き"},en:{cannotDraw:n=>`Cannot draw the diagram: ${n}`,unknownColor:n=>`colors.${n} is not a color name of the palette`,unreadableColor:n=>`colors.${n} cannot be read as a color`,overview:"Overview",prev:"Previous step",pause:"Pause",play:"Play",next:"Next step",steps:n=>`Steps of ${n}`,side:"Side path",sideNote:"Not taken this time",sideFrom:n=>`Enterable from ${n} ${n===1?"state":"states"}`,trail:"States passed",start:"Start",end:"End",badgeName:n=>`step number ${n}`,quoted:n=>`"${n}"`,iconOf:n=>`the icon of "${n}"`,coin:"the coin",envelope:"the envelope",textsOverlap:(n,o)=>d1(`${n} and ${o} overlap`),lineCrosses:(n,o,c)=>`The line ${n} → ${o} crosses ${c}`,timeUnits:{ms:"ms",s:"s",min:"min",h:"h",d:"d"},zoom:"Zoom",range:(n,o)=>`${n}–${o}`,headJoin:" · ",empty:"Empty"}},Un=n=>[...n].some(o=>(o.codePointAt(0)??0)>=11904);function p1(n,o){return o==="mono"&&Un(n)?"sans":o}function Pe(n,o){const c=p1(n,o.family);let u=0;for(const p of n)u+=o1(p,c);return u*o.size/cd}function va(n,o,c,u,p="start"){const s=Pe(n,u);return{x:p==="middle"?o-s/2:o,y:c-u.size*.8,w:s,h:u.size}}function $l(n){return n.steps.flatMap((o,c)=>o.events.flatMap((u,p)=>u.type==="edge"?[{step:c,event:p,edge:u}]:[]))}function ki(n){const o=V0(n),c=new Map;return n.boxes.forEach((u,p)=>{const s=u.region===void 0?void 0:o.get(u.region);c.set(u.id,u.color??s??uo[p%uo.length])}),c}function V0(n){const o=new Map;return(n.regions??[]).forEach((c,u)=>o.set(c.id,c.color??uo[u%uo.length])),o}var Dl=(n,o)=>n.carry.kind==="coin"?"coin":o.get(n.from)??"slate";function Ei(n,o,c){const u=n.boxes.find(s=>s.id===o);if(!u)return F.box.minW;const p=[Pe(u.name,oe.boxName),Pe(u.sub??"",oe.boxSub)];for(const s of n.steps)for(const r of s.events)r.type==="swap"&&r.box===o&&p.push(Pe(r.text,oe.boxSubStrong)),c&&r.type==="action"&&r.box===o&&p.push(Pe(r.label,oe.boxSubStrong));return Math.max(F.box.minW,Math.max(...p)+F.box.padX*2)}function xi(n){const o=F.carrier;return n.kind==="tag"?[(Pe(n.text,Un(n.text)?oe.carrierJa:oe.carrier)+o.tagPadX*2)/2,o.tagH/2]:n.kind==="coin"?[o.coinR,o.coinR]:[o.envW/2,o.envH/2]}var X0=n=>n.main+n.coin+(n.main>0&&n.coin>0?F.slot.spread:0);function $d(n){const o=new Map,c=new Set(n.boxes.map(u=>u.id));for(const u of n.steps)for(const p of u.events){if(p.type!=="edge"||p.carry.kind==="none")continue;const s=p.carry.kind==="coin"?"coin":"main",r=xi(p.carry)[0]*2;for(const l of[p.from,p.to]){if(!c.has(l))continue;const m=o.get(l)??{main:0,coin:0};m[s]=Math.max(m[s],r),o.set(l,m)}}return o}function Dd(n,o,c){return n?(o?F.box.icon+F.slot.gap:0)+X0(n)+F.slot.pad*2+F.box.padX+c:0}function Nd(n,o,c=F.box.padX){if(!o)return;const u=F.box,p=F.slot,s=X0(o)+p.pad*2,r=n.icon?u.icon+p.gap:0,l=Math.max(n.x+u.padX,Math.min(n.cx-(r+s)/2,n.x+n.w-c-(r+s)));n.icon&&(n.iconX=l+u.icon/2),n.slot={x:l+r,y:n.cy+u.iconY-p.h/2,w:s,h:p.h}}function bl(n,o,c){const u=F.slot,p=(s,r)=>{const l=o.get(s),m=c.get(s);if(!l?.slot||!m)return;const h=l.slot.x+u.pad,g=l.slot.y+l.slot.h/2;return m.main>0&&m.coin>0?r.kind==="coin"?[h+m.main+u.spread+m.coin/2,g]:[h+m.main/2,g]:[l.slot.x+l.slot.w/2,g]};for(const s of n){if(s.carry.kind==="none")continue;const r=p(s.to,s.carry),l=p(s.from,s.carry);r&&(s.settle=r),l&&(s.wait=l)}}function hi(n,o){const c=Math.max(o.x-(n.x+n.w),n.x-(o.x+o.w)),u=Math.max(o.y-(n.y+n.h),n.y-(o.y+o.h));return Math.max(c,u)}function Td(n,o,c=0){const u=o.x+c,p=o.y+c,s=o.x+o.w-c,r=o.y+o.h-c;if(s<=u||r<=p)return!1;for(let l=1;l<n.length;l++){const[m,h]=n[l-1],[g,x]=n[l],A=g-m,w=x-h;let D=0,T=1;const B=(N,M)=>{if(N===0)return M>0;const z=M/N;return N<0?D=Math.max(D,z):T=Math.min(T,z),D<T};if(B(-A,m-u)&&B(A,s-m)&&B(-w,h-p)&&B(w,r-h))return!0}return!1}function h1(n){let o={a:n[0],b:n[1]??n[0],length:-1};for(let c=1;c<n.length;c++){const u=n[c-1],p=n[c],s=Math.hypot(p[0]-u[0],p[1]-u[1]);s>o.length&&(o={a:u,b:p,length:s})}return{a:o.a,b:o.b,vertical:Math.abs(o.b[0]-o.a[0])<Math.abs(o.b[1]-o.a[1])}}function xs(n,o){let c=o;for(let u=1;u<n.length;u++){const p=n[u-1],s=n[u],r=Math.hypot(s[0]-p[0],s[1]-p[1]);if(c<=r&&r>0)return[p[0]+(s[0]-p[0])*c/r,p[1]+(s[1]-p[1])*c/r];c-=r}return n[n.length-1]}function Nl(n){let o=0;for(let c=1;c<n.length;c++){const u=n[c-1],p=n[c];o+=Math.hypot(p[0]-u[0],p[1]-u[1])}return o}function Q0(n){const{w:o,h:c,samples:u}=F.state.loop,p=n.y+n.h,s=[n.cx+o/2,p],r=[n.cx+o*3/4,p+c*4/3],l=[n.cx-o*3/4,p+c*4/3],m=[n.cx-o/2,p+F.edge.inset];return Array.from({length:u+1},(h,g)=>{const x=g/u,A=1-x,w=D=>A*A*A*s[D]+3*A*A*x*r[D]+3*A*x*x*l[D]+x*x*x*m[D];return[w(0),w(1)]})}function Z0(n){const o=Math.max(...n.map(([p])=>p)),c=n[0][1],u=Math.max(...n.map(([,p])=>p));return[o+F.badge.r+F.badge.inset,c+(u-c)*F.state.loop.badgeAt]}function J0(n,o){return{x:(n[0]?.[0]??0)-F.state.loop.w/2-o/2,y:Math.max(...n.map(([,c])=>c))+F.label.soft}}var Jm=F.state.loop.h+F.label.soft*2+F.label.h;function Ai(n,o=[],c=[]){const u=Nl(n),p=u<F.badge.short?Math.min(F.badge.r+1,u/2):F.badge.along,s=F.badge.r*2+F.badge.inset;for(let r=p;r<=u;r+=1){const l=xs(n,r);if(o.every(([m,h])=>Math.hypot(l[0]-m,l[1]-h)>=s))return l}return f1(n,p,o,c)??xs(n,p)}function f1(n,o,c,u){const p=Nl(n),[s,r]=xs(n,o),[l,m]=xs(n,Math.max(0,o-1)),[h,g]=xs(n,Math.min(p,o+1)),x=Math.hypot(h-l,g-m);if(x===0)return;const[A,w]=[-(g-m)/x,(h-l)/x],D=F.badge.r*2;for(const T of[F.edge.arrowHalf,0])for(let B=1;B<=D+F.badge.inset;B++)for(const N of[1,-1]){const M=[s+A*B*N,r+w*B*N];if(c.every(([ae,le])=>Math.max(Math.abs(M[0]-ae),Math.abs(M[1]-le))>=D+1)&&u.every(ae=>!Td(ae,Ka(M),-T)))return M}}var vl=n=>n.points.map(([o,c])=>`${Math.round(o*10)},${Math.round(c*10)}`).join(" ");function po(n,o,c=(u,p,s)=>Ai(u.points,p,s)){const u=new Map,p=[],s=new Map;for(let r=0;r<o;r++){const l=n.find(A=>A.step===r&&A.points.length>0);if(!l)continue;const m=vl(l),h=s.get(m);if(h){u.set(r,{point:h,edge:l});continue}const g=n.filter(A=>A.points.length>1&&vl(A)!==m).map(A=>A.points),x=c(l,p,g);p.push(x),s.set(m,x),u.set(r,{point:x,edge:l})}return u}function Si(n){const o=(c,u)=>Math.hypot(c.x-u.x,c.y-u.y)<=.5;return n.map(c=>{const u=n.filter(p=>p.step>c.step&&o(p,c)).sort((p,s)=>p.step-s.step)[0];return u?{...c,until:u.step}:c})}var Ka=([n,o])=>({x:n-F.badge.r,y:o-F.badge.r,w:F.badge.r*2,h:F.badge.r*2}),K0=n=>[n.x+F.state.text,n.y+F.baseline.mark],xa=n=>Un(n)?oe.labelJa:oe.label,m1={above:"below",below:"above",left:"right",right:"left"};function ho(n,o){const c=Pe(n.text,xa(n.text))+F.label.padX*2,u=F.label.h,p=h1(n.points),s=(p.a[0]+p.b[0])/2,r=(p.a[1]+p.b[1])/2,l=n.side??(p.vertical?"right":"above"),{side:m}=F.label,h=n.offset??F.label.offset,g=B=>B==="above"?{x:s-c/2,y:r-h-u/2,w:c,h:u}:B==="below"?{x:s-c/2,y:r+h-u/2,w:c,h:u}:B==="left"?{x:s-m-c,y:r-u/2,w:c,h:u}:{x:s+m,y:r-u/2,w:c,h:u},x=n.base?{...n.base,w:c,h:u}:g(l),A=n.flip?[l,m1[l]]:[l],w=B=>o.hard.every(N=>hi(B,N)>=F.gap)&&o.soft.every(N=>hi(B,N)>=F.label.soft)&&(o.touch??[]).every(N=>hi(B,N)>=F.label.touch)&&(o.lines??[]).every(N=>!Td(N,B,-2)),{search:D,searchMax:T}=F.label;for(let B=0;B<=T;B+=D)for(const N of A){const M=N===l?x:g(N),z=N==="above"?[0,-1]:N==="below"?[0,1]:N==="left"?[-1,0]:[1,0],ae=[Math.abs(z[1]),Math.abs(z[0])],le=n.slide??(N==="above"||N==="below"?c:u*4);for(let V=0;V<=le;V+=D)for(const J of V===0?[1]:[1,-1]){const X={x:M.x+z[0]*B+ae[0]*V*J,y:M.y+z[1]*B+ae[1]*V*J,w:c,h:u};if(w(X))return{...X,step:n.step,event:n.event,text:n.text,family:xa(n.text).family,color:n.color}}}return{...x,step:n.step,event:n.event,text:n.text,family:xa(n.text).family,color:n.color}}function W0(n){const o=/^([0-9]+(?:\.[0-9]+)?)%$/u.exec(n.trim());if(o)return Math.min(1,Math.max(0,Number(o[1])/100));const c=/^([0-9]+)\/([0-9]+)$/u.exec(n.trim());if(c&&Number(c[2])>0)return Math.min(1,Math.max(0,Number(c[1])/Number(c[2])))}var I0=(n,o)=>n.strip?.meters?.find(c=>c.field===o);function eg(n,o){if(I0(n,o))return Math.max(Pe(o,oe.fieldName),F.time.meter.w);let c=0,u=0;for(const s of n.steps)for(const r of s.events)r.type!=="strip"||r.field!==o||(r.value!==void 0&&(c=Math.max(c,Pe(r.value,Un(r.value)?oe.fieldValueJa:oe.fieldValue))),r.tag!==void 0&&(u=Math.max(u,Pe(r.tag,oe.tag)+F.strip.tagPadX*2)));const p=c+(u>0?(c>0?F.strip.tagGap:0)+u:0);return Math.max(Pe(o,oe.fieldName),p)}var ud=n=>Math.max(Pe(n.title,oe.fieldName),n.states.length*F.strip.trail.step);function _i(n,o){if(!n.strip)return 0;const{titleX:c,fieldGap:u,pad:p}=F.strip,s=c+Pe(n.strip.title,oe.stripTitle)+u,r=[...n.strip.fields.map(l=>eg(n,l)),...o?[ud(o)]:[]];return s+r.reduce((l,m)=>l+m+u,0)-u+p}function $i(n,o,c,u,p){if(!n.strip)return;const{titleX:s,fieldGap:r,pad:l,line:m,h}=F.strip,g=s+Pe(n.strip.title,oe.stripTitle)+r,x=[];let A=g,w=0;const D=B=>{A>g&&A+B>u-l&&(A=g,w++);const N={x:o+A,y:c+w*m};return A+=B+r,N};for(const B of n.strip.fields){const N=eg(n,B),M=D(N),z=I0(n,B),ae=z?W0(z.line):void 0;x.push({name:B,...M,w:N,...z&&ae!==void 0?{meter:{line:ae,text:z.line,x:M.x,w:F.time.meter.w}}:{}})}const T=p?{...p,...D(ud(p)),w:ud(p)}:void 0;return{x:o,y:c,w:u,h:h+w*m,title:n.strip.title,fields:x,...T?{trail:T}:{}}}function Md(n,o,c){const u=p=>{p.x+=o,p.y+=c};for(const p of n.boxes)u(p),p.cx+=o,p.cy+=c,p.slot&&u(p.slot),p.iconX!==void 0&&(p.iconX+=o);for(const p of n.regions)p.y+=c,u(p.header);for(const p of n.lifelines)p.x+=o,p.y1+=c,p.y2+=c;for(const p of n.edges)p.points=p.points.map(([s,r])=>[s+o,r+c]),p.settle&&(p.settle=[p.settle[0]+o,p.settle[1]+c]),p.wait&&(p.wait=[p.wait[0]+o,p.wait[1]+c]);for(const p of n.labels)u(p);for(const p of n.paths)p.points=p.points.map(([s,r])=>[s+o,r+c]),p.label&&u(p.label);for(const p of n.ends)p.x+=o,p.y+=c;n.side&&u(n.side);for(const p of n.actions)u(p);for(const p of n.badges)p.x+=o,p.y+=c;if(n.strip){n.strip.y+=c;for(const p of n.strip.fields)p.x+=o,p.y+=c,p.meter&&(p.meter.x+=o);n.strip.trail&&(n.strip.trail.x+=o,n.strip.trail.y+=c)}}function Cd(n,o,c){const{inset:u}=F.badge;for(const s of n){const r=s.type==="swap"||s.type==="action"?s.box:void 0,l=c.boxes.find(m=>m.id===r);if(l)return{step:o,x:l.x,y:l.y,color:l.color}}if(c.strip&&n.some(s=>s.type==="strip"))return{step:o,x:c.strip.x+u,y:c.strip.y+u,color:"slate"};const p=c.boxes[0];return{step:o,x:p.x,y:p.y,color:p.color}}function g1(n){const o=y1(n),c=b1(n,o),u=o.map(()=>({top:0,bottom:0}));let p=Km(n,o,c,u);for(let s=0;s<3&&w1(p,o,c,u);s++)p=Km(n,o,c,u);return p}function y1(n){const o=n.regions??[],c=new Set(o.map(s=>s.id)),u=o.map(s=>({region:s,members:n.boxes.filter(r=>r.region===s.id).map(r=>r.id)})),p=n.boxes.filter(s=>s.region===void 0||!c.has(s.region)).map(s=>s.id);return p.length>0&&u.push({members:p}),u}var tg=n=>n==="left"||n==="right";function b1(n,o){const c=F.architecture.columns,u=$l(n).map(r=>r.edge),p=new Map;o.forEach((r,l)=>{const m=new Set(r.members),h=new Set,g=(N,M)=>N>=0&&N<c&&!h.has(`${N},${M}`),x=(N,M)=>{const z=Math.min(c-1,Math.max(0,N));for(let ae=M;;ae++)for(let le=0;le<c;le++)for(const V of[z+le,z-le])if(g(V,ae))return[V,ae]},A=(N,M,z)=>{p.set(N,{group:l,col:M,row:z}),h.add(`${M},${z}`)};let w=1;const D=N=>{for(const M of u){const z=M.from===N?M.to:M.to===N?M.from:void 0;if(z===void 0||!m.has(z)||p.has(z))continue;const ae=p.get(N),[le,V]=tg(M.labelSide)?x(ae.col,ae.row+1):g(ae.col+w,ae.row)?[ae.col+w,ae.row]:x(ae.col+w,ae.row);A(z,le,V),D(z)}},T=N=>{for(let M=0;M<u.length;M++){const z=u[M],ae=z?.from===N?z.to:z?.to===N?z.from:void 0,le=ae===void 0?void 0:p.get(ae);if(le&&le.group<l)return{order:M,col:le.col}}};let B=0;for(;;){const N=r.members.filter(J=>!p.has(J));if(N.length===0)break;const M=N.map(J=>({id:J,anchor:T(J)})).filter(J=>J.anchor!==void 0);M.sort((J,X)=>(J.anchor?.order??0)-(X.anchor?.order??0));const z=M[0]??{id:N[0],anchor:void 0},ae=z.anchor?.col??0;B===0&&(w=ae>=(c-1)/2?-1:1);const[le,V]=g(ae,0)?[ae,0]:x(ae,0);A(z.id,le,V),D(z.id),B++}});const s=[...new Set([...p.values()].map(r=>r.col))].sort((r,l)=>r-l);for(const r of p.values())r.col=s.indexOf(r.col);return p}function v1(n){const o=[...n.matchAll(/ /g)].map(u=>u.index);if(o.length===0)return[n];const c=o.reduce((u,p)=>Math.abs(p-n.length/2)<Math.abs(u-n.length/2)?p:u);return[n.slice(0,c),n.slice(c+1)]}function x1(n){const{icon:o,nameY:c,line:u,inset:p}=F.region,s=v1(n.name),r=Math.max(o,...s.map(m=>Pe(m,oe.regionName)),Pe(n.note??"",oe.regionNote)),l=c-p+(s.length-1)*u+(n.note?u:0)+F.gap/2;return{w:r,h:l,lines:s}}function Km(n,o,c,u){const{box:p,region:s,architecture:r,margin:l,gap:m}=F,h=ki(n),g=V0(n),x=$l(n),A=Math.max(1,...[...c.values()].map(_=>_.col+1)),w=$d(n),D=new Map(n.boxes.map(_=>[_.id,Math.max(Ei(n,_.id,!0),Dd(w.get(_.id),_.icon!==void 0,p.padX))])),T=Array.from({length:A},(_,P)=>Math.max(p.minW,...[...c].filter(([,Y])=>Y.col===P).map(([Y])=>D.get(Y)??p.minW))),B=Array.from({length:Math.max(0,A-1)},()=>r.columnGap);for(const{edge:_}of x){const P=c.get(_.from),Y=c.get(_.to);if(!P||!Y||_.label===void 0||P.group!==Y.group||P.row!==Y.row||Math.abs(P.col-Y.col)!==1||tg(_.labelSide))continue;const be=Pe(_.label,xa(_.label))+F.label.padX*2+r.labelRoom*2,Ce=Math.min(P.col,Y.col);be<=r.maxColumnGap&&(B[Ce]=Math.max(B[Ce]??0,be))}const N=o.map(_=>_.region?x1(_.region):void 0),M=Math.max(0,...N.map(_=>_?_.w+s.inset*2:0)),z=[];for(let _=0;_<A;_++)z.push(_===0?l+(M>0?M:s.pad):z[_-1]+T[_-1]+B[_-1]);const ae=_=>z[_]+T[_]/2,le=new Set(x.filter(({edge:_})=>_.from===_.to).map(({edge:_})=>_.from)),V=new Set([...le].flatMap(_=>{const P=c.get(_);return P?[`${P.group}:${P.row}`]:[]})),J=(_,P)=>V.has(`${_}:${P}`)?Jm:0,X=[],W=[];let re=l;o.forEach((_,P)=>{const Y=Math.max(1,..._.members.map(Ke=>(c.get(Ke)?.row??0)+1)),be=u[P],Ce=re+s.pad+be.top,we=[0];for(let Ke=1;Ke<Y;Ke++)we.push(we[Ke-1]+p.h+r.rowGap+J(P,Ke-1));for(const Ke of _.members){const gt=c.get(Ke),Ct=n.boxes.find(Qt=>Qt.id===Ke),Ie=D.get(Ke)??p.minW,zt=ae(gt.col),Xt=Ce+we[gt.row];X.push({id:Ke,name:Ct?.name??Ke,...Ct?.sub!==void 0?{sub:Ct.sub}:{},...Ct?.icon!==void 0?{icon:Ct.icon}:{},color:h.get(Ke)??"slate",x:zt-Ie/2,y:Xt,w:Ie,h:p.h,cx:zt,cy:Xt+p.h/2})}const Ae=Ce+we[Y-1]+p.h+J(P,Y-1),Te=N[P],Be=Math.max(Ae+s.pad+be.bottom-re,Te?Te.h+s.inset*2:0,_.region?s.minH:0);W.push({group:P,y:re,h:Be,rows:Y}),re+=Be+s.gap});const ye=re-s.gap;for(const _ of X)Nd(_,w.get(_.id));const he=new Map(X.map(_=>[_.id,_])),me=_=>W[c.get(_)?.group??0],Oe=(_,P,Y)=>{for(let be=1;be<_.length;be++){const[Ce,we]=_[be-1],[Ae,Te]=_[be];if(Math.min(Ce,Ae)<=P.x+P.w+Y&&Math.max(Ce,Ae)>=P.x-Y&&Math.min(we,Te)<=P.y+P.h+Y&&Math.max(we,Te)>=P.y-Y)return!0}return!1},xe=[...le].flatMap(_=>{const P=he.get(_);return P?[{x:P.x,y:P.y+P.h,w:P.w,h:Jm}]:[]}),C=_=>xe.some(P=>Oe(_,P,0)),$=(_,P,Y)=>X.some(be=>be.id!==P&&be.id!==Y&&Oe(_,be,F.label.search))||C(_),q=_=>{const P=he.get(_),Y=me(_),be=c.get(_),Ce=P.y+P.h+(be?J(be.group,be.row):0);return(be?.row??0)<Y.rows-1?Ce+r.rowGap/2:Math.min(Ce+s.pad/2,Y.y+Y.h-F.edge.inset)},G=_=>{const P=he.get(_),Y=me(_);return(c.get(_)?.row??0)>0?P.y-r.rowGap/2:Math.max(P.y-s.pad/2,Y.y+F.edge.inset)},R=F.edge.inset,S=(_,P)=>P?z[_]+T[_]+(B[_]??r.columnGap)/2:z[_]-(B[_-1]??r.columnGap)/2,H=(_,P)=>{const Y=he.get(_),be=he.get(P);if(_===P)return Q0(Y);const Ce=c.get(_),we=c.get(P);if(Ce.group===we.group&&Ce.row===we.row){const Ie=be.cx>Y.cx,zt=[[Ie?Y.x+Y.w:Y.x,Y.cy],[Ie?be.x-R:be.x+be.w+R,be.cy]];if(!$(zt,_,P))return zt;const Xt=q(_),Qt=[[Y.cx,Y.y+Y.h],[Y.cx,Xt],[be.cx,Xt],[be.cx,be.y+be.h+R]];if(!C(Qt))return Qt;const wn=G(_),Wt=[[Y.cx,Y.y],[Y.cx,wn],[be.cx,wn],[be.cx,be.y-R]];return C(Wt)?Qt:Wt}const Ae=be.cy>Y.cy,Te=[Y.cx,Ae?Y.y+Y.h:Y.y],Be=[be.cx,Ae?be.y-R:be.y+be.h+R];if(Ce.col===we.col){const Ie=[Te,Be];if(!$(Ie,_,P))return Ie;const zt=S(Ce.col,!0);return[[Y.x+Y.w,Y.cy],[zt,Y.cy],[zt,be.cy],[be.x+be.w+R,be.cy]]}const Ke=be.cx>Y.cx,gt=Ae?q(_):G(_),Ct=[[Te,[Y.cx,be.cy],[Ke?be.x-R:be.x+be.w+R,be.cy]],[[Ke?Y.x+Y.w:Y.x,Y.cy],[be.cx,Y.cy],Be],[Te,[Y.cx,gt],[be.cx,gt],Be]];if(le.has(_)||le.has(P)){const Ie=S(Ce.col,Ke),zt=S(we.col,!Ke),Xt=[[Ke?Y.x+Y.w:Y.x,Y.cy],[Ie,Y.cy]],Qt=[Ke?be.x-R:be.x+be.w+R,be.cy];Ct.push([...Xt,[Ie,be.cy],Qt],[...Xt,[Ie,gt],[be.cx,gt],Be],[Te,[Y.cx,gt],[zt,gt],[zt,be.cy],Qt],[...Xt,[Ie,gt],[zt,gt],[zt,be.cy],Qt])}return Ct.find(Ie=>!$(Ie,_,P))??Ct[2]},K=x.map(({step:_,event:P,edge:Y})=>({step:_,event:P,from:Y.from,to:Y.to,points:H(Y.from,Y.to),color:Dl(Y,h),carry:Y.carry}));bl(K,he,w);const pe=new Map;for(const _ of K){if(_.points.length!==2||!K.some(Ae=>Ae.from===_.to&&Ae.to===_.from&&Ae.points.length===2))continue;const[Y,be]=_.points,Ce=Math.abs(be[1]-Y[1])<Math.abs(be[0]-Y[0]),we=(_.from<_.to?1:-1)*F.edge.parallel;_.points=_.points.map(([Ae,Te])=>Ce?[Ae,Te+we]:[Ae+we,Te]),pe.set(_,Ce?we>0?"below":"above":we>0?"right":"left")}const _e=[];o.forEach((_,P)=>{const Y=W[P],be=N[P];!_.region||!be||_e.push({id:_.region.id,lines:be.lines,..._.region.note!==void 0?{note:_.region.note}:{},..._.region.icon!==void 0?{icon:_.region.icon}:{},color:g.get(_.region.id)??"slate",x:l,y:Y.y,w:0,h:Y.h,header:{x:l+s.inset,y:Y.y+s.inset,w:be.w,h:be.h}})});const De=(_,P,Y)=>_.from===_.to?Z0(_.points):Ai(_.points,P,Y),je=po(K,n.steps.length,De),Le=[];for(const _ of K){const P=n.steps[_.step]?.events[_.event];if(P?.type!=="edge"||P.label===void 0)continue;const Y=[...je].filter(([Ae])=>Ae<=_.step).map(([,Ae])=>Ka(Ae.point)),be=[..._e.map(Ae=>Ae.header),...Le.filter(Ae=>Ae.step===_.step)],Ce=P.labelSide??pe.get(_),we=_.from===_.to?{side:"below",base:J0(_.points,Pe(P.label,xa(P.label))+F.label.padX*2)}:void 0;Le.push(ho({step:_.step,event:_.event,text:P.label,points:_.points,color:_.color,...we??(Ce?{side:Ce}:{flip:!0})},{hard:X,soft:be,touch:Y}))}const ze={kind:"architecture",width:0,height:0,regions:_e,boxes:X,lifelines:[],edges:K,labels:Le,actions:[],badges:[],paths:[],ends:[]},Ze=Le.length>0?Math.max(0,l+F.label.soft-Math.min(...Le.map(_=>_.x))):0;Ze>0&&Md(ze,Ze,0);const U=Math.max(...X.map(_=>_.x+_.w+s.pad),...Le.map(_=>_.x+_.w+F.label.soft),...K.flatMap(_=>_.points.map(P=>P[0]+s.pad))),ke=Math.max(U+l,_i(n)+l*2);for(const _ of _e)_.w=ke-l*2;const Ne=Math.max(ye,...Le.map(_=>_.y+_.h)),Z=$i(n,l,Ne+m,ke-l*2);ze.width=ke,ze.height=(Z?Z.y+Z.h:Ne)+l,Z&&(ze.strip=Z);const Ee=po(K,n.steps.length,De);return ze.badges=Si(n.steps.map((_,P)=>{const Y=Ee.get(P);return Y?{step:P,x:Y.point[0],y:Y.point[1],color:Y.edge.color}:Cd(_.events,P,ze)})),ze}function w1(n,o,c,u){let p=!1;const s=F.label.soft;for(const r of n.labels){const l=n.edges.find(D=>D.step===r.step&&D.event===r.event),m=l&&c.get(l.from),h=l&&c.get(l.to);if(!m||!h||m.group!==h.group||!o[m.group]?.region)continue;const g=n.regions.find(D=>D.id===o[m.group]?.region?.id),x=u[m.group];if(!g||!x)continue;const A=g.y+s-r.y,w=r.y+r.h-(g.y+g.h-s);A>0&&(x.top+=A,p=!0),w>0&&(x.bottom+=w,p=!0)}return p}var k1=n=>n.kind==="git";function E1(n){const o=(n.git?.branches??[]).map(X=>X.id),c=X=>{o.includes(X)||o.push(X)};for(const X of n.steps)for(const W of X.events)(W.type==="commit"||W.type==="branch")&&c(W.branch);const u=new Map(o.map(X=>[X,null]));let p=null,s=null;const r=[],l=new Map,m=[],h=[],g=[],x=new Map,A=new Map,w=new Map,D=[...o,In],T=new Map(D.map(X=>[X,[]])),B=[],N=X=>X===In?s===null?p:null:u.get(X)??null,M=X=>{const W=x.get(X)??[],re=W.indexOf(null);return re<0?W.length:re},z=(X,W,re,ye)=>{const he=new Map(D.map(C=>[C,N(C)])),me=p;re();const xe=D.filter(C=>he.get(C)!==N(C)).map(C=>{const $=w.get(C);return $&&(x.get($.commit)[$.row]=null,w.delete(C)),{ref:C,slot:$}});for(const{ref:C,slot:$}of xe){const q=$??(C===In&&me!==null?{commit:me,row:M(me)}:void 0),G=N(C);let R;if(G!==null){R={commit:G,row:M(G)};const S=x.get(G)??[];S[R.row]=C,x.set(G,S),A.set(G,Math.max(A.get(G)??0,S.filter(H=>H!==null).length)),w.set(C,R)}h.push({ref:C,step:X,event:W,...q?{from:q}:{},...R?{to:R}:{},line:C===ye})}},ae=(X,W)=>{const re=new Set,ye=[...u.values(),p].filter(he=>he!==null);for(;ye.length>0;){const he=ye.pop();re.has(he)||(re.add(he),ye.push(...l.get(he)?.parents??[]))}for(const he of r)!re.has(he.id)&&he.orphan===void 0&&(he.orphan={step:X,event:W})};n.steps.forEach((X,W)=>{X.events.forEach((re,ye)=>{if(re.type==="commit")V(re,W,ye);else if(re.type==="branch"){if(!l.has(re.from))return;le(re.from)!==re.branch&&m.push({kind:"branch",from:re.from,to:re.branch,step:W,event:ye}),z(W,ye,()=>{u.set(re.branch,re.from),s=re.branch,p=re.from})}else if(re.type==="edge"){const he=re.from;if(he!==In&&!u.has(he)||!l.has(re.to))return;z(W,ye,()=>{if(he===In){s=null,p=re.to;return}u.set(he,re.to),s===he?p=re.to:s===null&&p===re.to&&(s=he)},he)}else return;ae(W,ye)});for(const re of D)T.get(re)?.push(re===In?p:u.get(re)??null);B.push(s);for(const re of D){const ye=w.get(re);ye&&g.push({ref:re,step:W,slot:ye})}});function le(X){return l.get(X)?.branch}function V(X,W,re){if(l.has(X.id))return;const ye=X.copy!==void 0&&l.has(X.copy)?X.copy:void 0,he=ye!==void 0&&s===null&&p!==null?p:u.get(X.branch)??null,me=X.merge!==void 0&&X.merge!==X.branch?u.get(X.merge)??void 0:void 0,Oe=[...new Set([he,me].filter($=>$!=null))],xe={id:X.id,branch:X.branch,parents:Oe,...me!==void 0&&me!==he?{joined:me}:{},...ye!==void 0?{copy:ye}:{},...X.hash!==void 0?{hash:X.hash}:{},...X.note!==void 0?{note:X.note}:{},step:W,event:re};r.push(xe),l.set(xe.id,xe);for(const $ of Oe)m.push({kind:"parent",from:$,to:xe.id,step:W,event:re});ye!==void 0&&m.push({kind:"copy",from:ye,to:xe.id,step:W,event:re});const C=s===null&&p===null;z(W,re,()=>{ye===void 0?(u.set(X.branch,xe.id),s===X.branch&&(p=xe.id)):s===null&&(p=xe.id),C&&(s=X.branch,p=xe.id)})}const J=D.map(X=>({name:X,at:T.get(X)??[],...X===In?{attached:B}:{}}));return{branches:o,made:r,links:m,moves:h,refs:J,tags:g,rows:A}}function xl(n,o,c,u){const p=F.git.samples;return Array.from({length:p},(s,r)=>{const l=(r+1)/p,m=1-l,h=g=>m*m*m*n[g]+3*m*m*l*o[g]+3*m*l*l*c[g]+l*l*l*u[g];return[h(0),h(1)]})}function A1(n,o){return Math.abs(n[1]-o[1])<.5?[n,o]:n[1]>o[1]?[n,[n[0],o[1]],o]:[n,[o[0],n[1]],o]}function Wm(n,o,c){const u=c>n.cy?1:-1,p=[n.cx,n.cy+u*n.r],s=Math.max(0,Math.min(F.git.turn,o-n.cx)),r=[n.cx+s,c],l=xl(p,[p[0],p[1]+(c-p[1])*.7],[n.cx+s*.2,c],r);return[p,...l,...o>r[0]?[[o,c]]:[]]}function S1(n,o){const c=o.cy<n.cy?1:-1,u=[n.cx+n.r,n.cy],p=[o.cx,o.cy+c*o.r],s=Math.max(0,Math.min(F.git.turn,o.cx-u[0])),r=[o.cx-s,n.cy],l=xl(r,[o.cx-s*.2,n.cy],[o.cx,p[1]+(n.cy-p[1])*.7],p);return[u,...r[0]>u[0]?[r]:[],...l]}function _1(n,o){if(Math.abs(n.cy-o.cy)<.5){const r=n.cy-n.r,l=F.git.turn*.7;return[[n.cx,r],...xl([n.cx,r],[n.cx,r-l],[o.cx,r-l],[o.cx,r])]}const c=o.cy<n.cy?-1:1,u=[n.cx,n.cy+c*n.r],p=[o.cx,o.cy-c*o.r],s=(p[1]-u[1])*.5;return[u,...xl(u,[u[0],u[1]+s],[p[0],p[1]-s],p)]}function $1(n){const{margin:o,gap:c,box:u,region:p,git:s,carrier:r}=F,l=E1(n),m=new Map((n.git?.branches??[]).map(U=>[U.id,U.note])),h=new Map(l.branches.map((U,ke)=>[U,ke])),g=U=>s.colors[(h.get(U)??0)%s.colors.length],x=new Map,A=new Map;for(const U of l.made){const ke=Math.max(0,...U.parents.map(Ne=>(x.get(Ne)??-1)+1),(A.get(U.branch)??-1)+1);x.set(U.id,ke),A.set(U.branch,ke)}const w=U=>[...U.hash!==void 0?[{text:U.hash,style:oe.gitHash}]:[],...U.note!==void 0?[{text:U.note,style:oe.gitNote}]:[]],D=U=>Math.max(0,...w(U).map(ke=>Pe(ke.text,ke.style))),T=U=>Pe(U,Un(U)?oe.carrierJa:oe.carrier)+r.tagPadX*2,B=Math.max(0,...l.refs.map(U=>T(U.name))),N=Math.max(s.pitch,...l.made.map(U=>D(U)+s.textGap),B+s.textGap),M=l.branches.map(U=>({w:Math.max(p.icon,Pe(U,oe.regionName),Pe(m.get(U)??"",oe.regionNote))})),z=o+p.inset+Math.max(0,...M.map(U=>U.w)),ae=Math.max(s.r,...l.made.filter(U=>x.get(U.id)===0&&h.get(U.branch)===0).map(U=>D(U)/2),B/2),le=Math.max(s.x0,z+c+ae),V=new Set(l.moves.flatMap(U=>{const ke=n.steps[U.step]?.events[U.event];return U.line&&U.to&&ke?.type==="edge"&&ke.label!==void 0?[l.made.find(Ne=>Ne.id===U.to?.commit)?.branch??""]:[]})),J=U=>Math.max(0,...l.made.filter(ke=>ke.branch===U).map(ke=>(l.rows.get(ke.id)??0)-2))*s.row,X=l.made.some(U=>h.get(U.branch)===0&&w(U).length>0),W=[];let re=o;l.branches.forEach((U,ke)=>{const Ne=ke===0,Z=Ne&&X?s.tagTop:s.tag,Ee=re+(Ne?s.topLine-(s.tagTop-Z):s.line)+J(U),_=Ee-re+(Ne?s.topBelow:V.has(U)?s.below:s.bare);W.push({id:U,x:o,y:re,w:0,h:_,line:Ee,color:g(U),tagBase:Z}),re+=_+p.gap});const ye=re-p.gap,he=new Map(W.map(U=>[U.id,U])),me=l.made.map(U=>{const ke=he.get(U.branch),Ne=h.get(U.branch)===0,Z=le+N*(x.get(U.id)??0)+(Ne?0:N/2),Ee=ke.line,_=w(U),P=_.map((we,Ae)=>Ne?Ee-s.above-(_.length-1-Ae)*s.lineStep:Ee+s.under+Ae*s.lineStep),Y=_.map((we,Ae)=>va(we.text,Z,P[Ae],we.style,"middle")),be=Y.length===0?void 0:{...D1(Y),lines:_.map(we=>we.text),baselines:P},Ce=U.copy!==void 0?g(l.made.find(we=>we.id===U.copy)?.branch??U.branch):g(U.branch);return{id:U.id,branch:U.branch,color:Ce,cx:Z,cy:Ee,r:s.r,step:U.step,event:U.event,parents:U.parents,...U.copy!==void 0?{copy:U.copy}:{},...U.hash!==void 0?{hash:U.hash}:{},...U.note!==void 0?{note:U.note}:{},...be?{text:be}:{},...U.orphan?{orphan:U.orphan.step,orphanEvent:U.orphan.event}:{}}}),Oe=new Map(me.map(U=>[U.id,U])),xe=l.links.flatMap(U=>{const ke=Oe.get(U.from);if(!ke)return[];if(U.kind==="branch"){if(!l.made.some(P=>P.branch===U.to))return[];const _=he.get(U.to);return[{...U,points:Wm(ke,ke.cx+s.turn,_.line),color:g(U.to)}]}const Ne=Oe.get(U.to),Z=l.made.find(_=>_.id===U.to);let Ee;return U.kind==="copy"?Ee=_1(ke,Ne):Math.abs(ke.cy-Ne.cy)<.5?Ee=[[ke.cx+ke.r,ke.cy],[Ne.cx-Ne.r,Ne.cy]]:Z?.joined===U.from?Ee=S1(ke,Ne):Ee=Wm(ke,Ne.cx-Ne.r,Ne.cy),[{...U,points:Ee,color:Ne.color}]}),C=(U,ke)=>{const Ne=Oe.get(ke.commit),Z=he.get(Ne.branch)?.tagBase??s.tag,Ee=T(U);return{x:Ne.cx-Ee/2,y:Ne.cy-Z-ke.row*s.row-r.tagH/2,w:Ee,h:r.tagH}},$=U=>[U.x+U.w/2,U.y+U.h/2],q=l.moves.map(U=>{const ke=U.from?C(U.ref,U.from):void 0,Ne=U.to?C(U.ref,U.to):void 0,Z=n.steps[U.step]?.events[U.event],Ee=U.line&&Z?.type==="edge"&&Z.carry.kind!=="none"&&!(Z.carry.kind==="tag"&&Z.carry.text===Z.from);return{ref:U.ref,step:U.step,event:U.event,...ke?{from:ke}:{},...Ne?{to:Ne}:{},...U.to?{target:U.to.commit}:{},...Ee?{carried:!0}:{},...U.line&&ke&&Ne?{line:A1($(ke),$(Ne))}:{},color:"slate"}}),G=l.tags.map(U=>({...C(U.ref,U.slot),ref:U.ref,step:U.step})),R=ki(n),S=Math.max(le,...me.flatMap(U=>[U.cx+U.r,...U.text?[U.text.x+U.text.w]:[]]),...G.map(U=>U.x+U.w),...q.flatMap(U=>[U.from,U.to].flatMap(ke=>ke?[ke.x+ke.w]:[]))),H=S+s.boxGap,K=(W[1]??W[0])?.line??o+u.h/2,pe=n.boxes.map((U,ke)=>{const Ne=Ei(n,U.id,!0),Z=K+ke*(u.h+c);return{id:U.id,name:U.name,...U.sub!==void 0?{sub:U.sub}:{},...U.icon!==void 0?{icon:U.icon}:{},color:R.get(U.id)??"slate",x:H,y:Z-u.h/2,w:Ne,h:u.h,cx:H+Ne/2,cy:Z}}),_e=W.map((U,ke)=>{const Ne=m.get(U.id);return{id:U.id,lines:[U.id],...Ne!==void 0?{note:Ne}:{},icon:"branch",color:U.color,x:U.x,y:U.y,w:0,h:U.h,header:{x:U.x+p.inset,y:U.y+p.inset,w:M[ke]?.w??0,h:p.nameY-p.inset+(Ne!==void 0?p.line:0)+c/2}}}),De={kind:"git",width:0,height:0,regions:_e,boxes:pe,lifelines:[],edges:[],labels:[],actions:[],badges:[],paths:[],ends:[],lanes:W,commits:me,links:xe,tags:G,refs:l.refs,moves:q};De.badges=e0(n,De),De.labels=M1(n,De);const je=Math.max(S,...pe.map(U=>U.x+U.w),...De.labels.map(U=>U.x+U.w))+p.pad,Le=Math.max(je+o,_i(n)+o*2);for(const U of _e)U.w=Le-o*2;for(const U of W)U.w=Le-o*2;const ze=Math.max(ye,...pe.map(U=>U.y+U.h),...De.labels.map(U=>U.y+U.h)),Ze=$i(n,o,ze+c,Le-o*2);return De.width=Le,De.height=(Ze?Ze.y+Ze.h:ze)+o,Ze&&(De.strip=Ze),De.badges=e0(n,De),De}function D1(n){const o=Math.min(...n.map(u=>u.x)),c=Math.min(...n.map(u=>u.y));return{x:o,y:c,w:Math.max(...n.map(u=>u.x+u.w))-o,h:Math.max(...n.map(u=>u.y+u.h))-c}}function N1(n,o){return[...n.links.filter(u=>u.step===o&&u.kind!=="copy").map(u=>({event:u.event,points:u.points,color:u.color})),...n.moves.flatMap(u=>{const p=n.commits.find(s=>s.id===u.target);return u.step===o&&u.line&&p?[{event:u.event,target:p,color:p.color}]:[]})].sort((u,p)=>u.event-p.event)[0]}function Im(n,o,c){const{r:u,inset:p}=F.badge,s=n.r+p+u,r=u*2+p;return[[n.cx+s,n.cy],[n.cx,n.cy+s],[n.cx-s,n.cy],[n.cx,n.cy-s]].find(m=>o.every(([h,g])=>Math.hypot(m[0]-h,m[1]-g)>=r)&&c.every(h=>hi(Ka(m),h)>=F.label.touch))}function T1(n,o,c){const{r:u,inset:p,along:s,short:r}=F.badge,l=Nl(n),m=l<r?Math.min(u+1,l/2):s,h=u*2+p;for(let g=m;g<=l;g+=1){const x=xs(n,g),A=Ka(x);if(o.every(([w,D])=>Math.hypot(x[0]-w,x[1]-D)>=h)&&c.every(w=>hi(A,w)>=F.label.touch))return x}}function e0(n,o){const{inset:c}=F.badge,u=[],p=[...o.links.map(l=>l.points),...o.moves.flatMap(l=>l.line?[l.line]:[])],s=[],r=[...o.tags,...o.commits.flatMap(l=>[{x:l.cx-l.r,y:l.cy-l.r,w:l.r*2,h:l.r*2},...l.text?[l.text]:[]])];return n.steps.forEach((l,m)=>{const h=N1(o,m),g=h?.target?Im(h.target,u,r):void 0;if(h&&(h.points||g)){const B=h.points,N=g??(B?T1(B,u,r)??Ai(B,u,p.filter(M=>M!==B)):[0,0]);u.push(N),s.push({step:m,x:N[0],y:N[1],color:h.color});return}const x=l.events.flatMap(B=>B.type==="swap"||B.type==="action"?[B.box]:[]).map(B=>o.boxes.find(N=>N.id===B))[0];if(x){s.push({step:m,x:x.x,y:x.y,color:x.color});return}if(o.strip&&l.events.some(B=>B.type==="strip")){s.push({step:m,x:o.strip.x+c,y:o.strip.y+c,color:"slate"});return}const A=o.commits.find(B=>B.id===o.refs[0]?.at[m]),w=A?Im(A,u,r):void 0;if(A&&w){u.push(w),s.push({step:m,x:w[0],y:w[1],color:A.color});return}const D=s[s.length-1],T=o.lanes[0];s.push(D?{...D,step:m}:{step:m,x:(T?.x??0)+(T?.w??0)-c-F.badge.r,y:(T?.y??0)+c+F.badge.r,color:T?.color??"slate"})}),Si(s)}function M1(n,o){const c=F.git,u=[],p=o.commits.map(l=>({x:l.cx-l.r,y:l.cy-l.r,w:l.r*2,h:l.r*2})),s=o.commits.flatMap(l=>l.text?[l.text]:[]),r=o.regions.map(l=>l.header);for(const l of o.moves){const m=n.steps[l.step]?.events[l.event];if(m?.type!=="edge"||m.label===void 0||!l.line)continue;const h=o.commits.find(M=>M.id===m.to);if(!h)continue;const g=o.lanes[0]?.id===h.branch,x=Pe(m.label,Un(m.label)?oe.labelJa:oe.label)+F.label.padX*2,[A]=l.line.reduce((M,z)=>[M[0]+z[0]/l.line.length,0],[0,0]),w=Math.max(0,...o.tags.filter(M=>M.step===l.step&&Math.abs(M.x+M.w/2-h.cx)<.5).map(M=>h.cy-M.y)),D=m.labelSide??(g?"above":"below"),T=m.labelSide!==void 0?void 0:g?{x:A-x/2,y:h.cy-Math.max(w,(o.lanes[0]?.tagBase??c.tag)+F.carrier.tagH/2)-F.label.soft-F.label.h}:{x:A-x/2,y:h.cy+c.labelUnder},B=o.badges.filter(M=>M.step<=l.step).map(M=>Ka([M.x,M.y])),N=o.tags.filter(M=>M.step===l.step);u.push(ho({step:l.step,event:l.event,text:m.label,points:l.line,color:l.color,side:D,...T?{base:T}:{}},{hard:[...p,...o.boxes],soft:[...s,...N,...r,...u.filter(M=>M.step===l.step)],touch:B}))}return u}function C1(n){const{box:o,sequence:c,label:u,margin:p,gap:s}=F,r=ki(n),l=n.sequence?.lifelines??[],m=[...l,...n.boxes.map(C=>C.id).filter(C=>!l.includes(C))],h=new Map(m.map((C,$)=>[C,$])),g=m.map(C=>Ei(n,C,!1)),x=g.slice(1).map((C,$)=>g[$]/2+C/2+c.columnGap),A=[];for(const C of n.steps)for(const $ of C.events){if($.type!=="edge"||$.label===void 0)continue;const q=h.get($.from)??0,G=h.get($.to)??0,R=Pe($.label,xa($.label))+u.padX*2;q===G?q<x.length&&A.push({from:q,to:q+1,need:c.selfW+u.side+R+c.labelRoom}):A.push({from:Math.min(q,G),to:Math.max(q,G),need:R+c.labelRoom*2})}A.sort((C,$)=>C.to-C.from-($.to-$.from));for(const{from:C,to:$,need:q}of A){let G=0;for(let S=C;S<$;S++)G+=x[S]??0;if(G>=q)continue;const R=(q-G)/($-C);for(let S=C;S<$;S++)x[S]=(x[S]??0)+R}const w=[];m.forEach((C,$)=>w.push($===0?p+g[0]/2:w[$-1]+x[$-1]));const D=m.map((C,$)=>{const q=n.boxes.find(S=>S.id===C),G=g[$],R=w[$];return{id:C,name:q?.name??C,...q?.sub!==void 0?{sub:q.sub}:{},...q?.icon!==void 0?{icon:q.icon}:{},color:r.get(C)??"slate",x:R-G/2,y:p,w:G,h:o.h,cx:R,cy:p+o.h/2}}),T=p+o.h,B=[],N=[],M=[];let z=T+c.firstRow,ae=0,le=!0;n.steps.forEach((C,$)=>{C.events.forEach((q,G)=>{if(q.type!=="edge"&&q.type!=="action")return;let R,S;if(q.type==="edge"){const H=q.labelSide??"above",K=q.from===q.to,pe=q.label!==void 0;R=pe&&H==="above"?c.labelOffset+u.h/2:s,S=K?c.selfH+s:pe&&H==="below"?c.labelOffset+u.h/2:s}else R=F.action.h/2,S=F.action.h/2;if(z=le?z+R:z+Math.max(c.minPitch,ae+c.rowGap+R)+(G===0&&$>0?c.stepGap:0),le=!1,ae=S,q.type==="edge"){const H=w[h.get(q.from)??0],K=w[h.get(q.to)??0],pe=Math.sign(K-H)||1,_e=H===K?[[H,z],[H+c.selfW,z],[H+c.selfW,z+c.selfH],[H+F.edge.inset,z+c.selfH]]:[[H,z],[K-pe*F.edge.inset,z]],De=Dl(q,r),je={};if(q.carry.kind!=="none"){const Le=F.slot.lifeline+xi(q.carry)[0],[ze,Ze]=_e,[U,ke]=_e.slice(-2),Ne=Math.sign(Ze[0]-ze[0])||1,Z=Math.sign(ke[0]-U[0])||-1;je.wait=[H-Ne*Le,ze[1]],je.settle=[K+Z*Le,ke[1]]}B.push({step:$,event:G,from:q.from,to:q.to,points:_e,color:De,carry:q.carry,...je}),q.label!==void 0&&M.push({step:$,event:G,text:q.label,points:_e,color:De,...q.labelSide?{side:q.labelSide}:H===K?{side:"right"}:{},offset:c.labelOffset})}else{const H=w[h.get(q.box)??0],K=Pe(q.label,oe.action)+F.action.padX*2;N.push({step:$,event:G,box:q.box,text:q.label,color:r.get(q.box)??"slate",x:H+F.badge.r+4,y:z-F.action.h/2,w:K,h:F.action.h})}})});const V=(le?T:z+ae)+c.tail,J=m.map((C,$)=>({id:C,x:w[$],y1:T,y2:V})),X=po(B,n.steps.length),W=[];for(const C of M){const $=[...X].filter(([G])=>G<=C.step).map(([,G])=>Ka(G.point)),q=[...W.filter(G=>G.step===C.step),...N];W.push(ho(C,{hard:D,soft:q,touch:$}))}const re={kind:"sequence",width:0,height:0,regions:[],boxes:D,lifelines:J,edges:B,labels:W,actions:N,badges:[],paths:[],ends:[]},ye=[...D.map(C=>C.x),...W.map(C=>C.x),...N.map(C=>C.x)],he=Math.max(0,p-Math.min(...ye));he>0&&Md(re,he,0);const me=[...D.map(C=>C.x+C.w),...W.map(C=>C.x+C.w),...N.map(C=>C.x+C.w),...B.flatMap(C=>C.points.map($=>$[0]))],Oe=Math.max(Math.max(...me)+p,_i(n)+p*2),xe=$i(n,p,V+s,Oe-p*2);return re.width=Oe,re.height=(xe?xe.y+xe.h:V)+p,xe&&(re.strip=xe),re.badges=O1(n,re),re}function O1(n,o){const c=po(o.edges,n.steps.length),u=n.steps.map((p,s)=>{const r=c.get(s);if(r)return{step:s,x:r.point[0],y:r.point[1],color:r.edge.color};const l=o.actions.find(h=>h.step===s),m=l&&o.lifelines.find(h=>h.id===l.box);return l&&m?{step:s,x:m.x,y:l.y+l.h/2,color:l.color}:Cd(p.events,s,o)});return Si(u)}var ng=n=>gi.includes(n);function B1(n){const o=[],c=u=>{!ng(u)&&!o.includes(u)&&o.push(u)};for(const{edge:u}of $l(n))c(u.from),c(u.to);return o}var j1=(n,o)=>n.from===o.from&&n.to===o.to;function z1(n,o){const{box:c,state:u,margin:p,gap:s}=F,r=F.edge.inset,l=Ja[o],m=ki(n),h=$l(n),g=B1(n),x=n.boxes.map(b=>b.id).filter(b=>!g.includes(b)),A=(n.state?.paths??[]).filter(b=>!h.some(({edge:k})=>j1(k,b))),w=[...h.map(({edge:b})=>b),...A],D=u.ghost,T=b=>{const k=n.boxes.find(O=>O.id===b);return D.pad*2+c.icon+D.gap+Math.max(Pe(k?.name??b,oe.boxName),Pe(k?.sub??"",oe.boxSub))},B=$d(n),N=Math.max(c.padX,u.done.inset+u.done.r+F.slot.clear),M=new Map(n.boxes.map(b=>[b.id,x.includes(b.id)?T(b.id):Math.max(Ei(n,b.id,!0),Dd(B.get(b.id),b.icon!==void 0,N))])),z=Math.max(1,Math.min(u.columns,g.length)),ae=Math.max(1,Math.ceil(g.length/u.columns)),le=new Map(g.map((b,k)=>{const O=Math.floor(k/u.columns),se=k%u.columns;return[b,{row:O,col:O%2===0?se:z-1-se}]})),V=Array.from({length:z},(b,k)=>Math.max(c.minW,...g.filter(O=>le.get(O)?.col===k).map(O=>M.get(O)??c.minW))),J=Array.from({length:Math.max(0,z-1)},()=>u.columnGap);for(const b of w){const k=le.get(b.from),O=le.get(b.to);if(!k||!O||b.label===void 0||k.row!==O.row||Math.abs(k.col-O.col)!==1)continue;const se=Math.min(k.col,O.col);J[se]=Math.max(J[se]??0,Pe(b.label,xa(b.label))+F.label.padX*2+u.labelRoom*2)}const X=[];for(let b=0;b<z;b++)X.push(b===0?p:X[b-1]+V[b-1]+J[b-1]);const W=b=>X[b]+V[b]/2,re=b=>x.includes(b),ye=new Set(A.filter(b=>re(b.to)&&!re(b.from)&&!ng(b.from)).map(b=>b.from)),he=[l.sideNote,...ye.size>0?[l.sideFrom(ye.size)]:[]],me=Math.max(Pe(l.side,oe.regionName),...he.map(b=>Pe(b,oe.regionNote))),Oe=u.side.pad*2+Math.max(D.h,oe.regionName.size+F.region.line*he.length+u.side.pad/4),xe=w.some(b=>b.from==="start"),C=p+(x.length>0?Oe+u.side.gap:xe?u.start+u.drop:0),$=b=>C+b*(c.h+u.rowGap),q=(b,k,O,se)=>{const I=n.boxes.find(ve=>ve.id===b),ce=M.get(b)??c.minW,Se=se?D.h:c.h;return{id:b,name:I?.name??b,...I?.sub!==void 0?{sub:I.sub}:{},...I?.icon!==void 0?{icon:I.icon}:{},color:m.get(b)??"slate",x:k-ce/2,y:O,w:ce,h:Se,cx:k,cy:O+Se/2,...se?{ghost:!0}:{}}},G=g.map(b=>{const k=le.get(b);return q(b,W(k.col),$(k.row),!1)});for(const b of G)Nd(b,B.get(b.id),N);const R=new Map(G.map(b=>[b.id,b])),S=b=>G.some(k=>k!==b&&Math.abs(k.cx-b.cx)<.5&&k.y>b.y),H=[],K=G[0],pe=Math.max(...G.map(b=>b.x+b.w));let _e;const De=p+Oe+u.side.lane;if(x.length>0){const b=ve=>A.filter(Re=>Re.to===ve).flatMap(Re=>R.get(Re.from)??[]),k=x.flatMap(b),O=Math.max(p,Math.min(...k.length>0?k.map(ve=>ve.x):[p+u.side.pad])-u.side.pad);let se=O+u.side.pad+me+s*2;const I=x.map(ve=>{const Re=b(ve);return{id:ve,cx:Re.length>0?Re.reduce((ht,kt)=>ht+kt.cx,0)/Re.length:se}});I.sort((ve,Re)=>ve.cx-Re.cx);let ce=O;for(const{id:ve,cx:Re}of I){const ht=M.get(ve)??c.minW,kt=Math.max(Re-ht/2,se),ot=q(ve,kt+ht/2,p+(Oe-D.h)/2,!0);G.push(ot),R.set(ve,ot);const Dt=A.some(Es=>Es.from===ve&&Es.to==="finish");Dt&&H.push({kind:"finish",x:ot.x+ot.w+u.beside,y:ot.cy,r:u.end.r,ghost:!0,text:"",box:ve}),ce=Dt?ot.x+ot.w+u.beside+u.end.r:ot.x+ot.w,se=ce+s*2}const Se=Math.max(ce+u.side.pad,pe);_e={x:O,y:p,w:Se-O,h:Oe,title:l.side,notes:he}}if(K&&xe){const b=K.cx+u.start+u.text+Pe(l.start,oe.regionNote)+s,k=_e&&b<_e.x?_e.y+u.side.pad+u.start:K.y-u.drop;H.unshift({kind:"start",x:K.cx,y:k,r:u.start,ghost:!1,text:l.start})}for(const b of G.filter(k=>!k.ghost&&w.some(O=>O.from===k.id&&O.to==="finish")))H.push(S(b)?{kind:"finish",x:b.x+b.w+u.beside,y:b.cy,r:u.end.r,ghost:!1,text:l.end,box:b.id}:{kind:"finish",x:b.cx,y:b.y+b.h+u.below,r:u.end.r,ghost:!1,text:l.end,box:b.id});const je=(b,k)=>{const O=le.get(b.id),se=le.get(k.id);if(!O||!se)return[[b.cx,b.y+b.h],[k.cx,k.y-r]];if(O.row===se.row&&Math.abs(O.col-se.col)===1)return k.cx>b.cx?[[b.x+b.w,b.cy],[k.x-r,k.cy]]:[[b.x,b.cy],[k.x+k.w+r,k.cy]];if(O.row===se.row){const ce=b.y+b.h+u.rowGap/4;return[[b.cx,b.y+b.h],[b.cx,ce],[k.cx,ce],[k.cx,k.y+k.h+r]]}if(se.row>O.row){if(Math.abs(b.cx-k.cx)<.5)return[[b.cx,b.y+b.h],[k.cx,k.y-r]];const ce=b.y+b.h+u.rowGap/2;return[[b.cx,b.y+b.h],[b.cx,ce],[k.cx,ce],[k.cx,k.y-r]]}if(Math.abs(b.cx-k.cx)<.5)return[[b.cx,b.y],[k.cx,k.y+k.h+r]];const I=k.y+k.h+u.rowGap/2;return[[b.cx,b.y],[b.cx,I],[k.cx,I],[k.cx,k.y+k.h+r]]},Le=(b,k)=>{const O=A.filter(I=>I.to===k.id).flatMap(I=>R.get(I.from)??[]).sort((I,ce)=>I.cx-ce.cx),se=O.findIndex(I=>I.id===b);return O.length<=1?Math.min(Math.max(O[0]?.cx??k.cx,k.x+u.side.entry),k.x+k.w-u.side.entry):k.x+u.side.entry+(k.w-u.side.entry*2)*Math.max(0,se)/(O.length-1)},ze=b=>xe&&b===K?b.cx+u.side.entry:b.cx,Ze=b=>H.find(k=>k.kind==="finish"&&k.box===b),U=(b,k)=>{if(b==="start"){const I=H.find(Se=>Se.kind==="start"),ce=R.get(k);return!I||!ce?[]:[[I.x,I.y+I.r],[ce.cx,ce.y-r]]}const O=R.get(b);if(!O)return[];if(k==="finish"){const I=Ze(b);return I?Math.abs(I.x-O.cx)<.5?[[O.cx,O.y+O.h],[O.cx,I.y-I.r-r]]:[[O.x+O.w,O.cy],[I.x-I.r-r,O.cy]]:[]}const se=R.get(k);if(!se)return[];if(b===k)return Q0(O);if(se.ghost&&!O.ghost){const I=ze(O),ce=Le(b,se);return Math.abs(I-ce)<.5?[[I,O.y],[ce,se.y+se.h+r]]:[[I,O.y],[I,De],[ce,De],[ce,se.y+se.h+r]]}return O.ghost&&se.ghost?[[O.x+O.w,O.cy],[se.x-r,se.cy]]:O.ghost?[[O.cx,O.y+O.h],[O.cx,De],[se.cx,De],[se.cx,se.y-r]]:je(O,se)},ke=b=>{const k=b.to==="finish"?Ze(b.from):void 0;if(!k)return;const O=R.get(b.from);return O&&Math.abs(k.x-O.cx)<.5?[k.x-k.r-s-xi(b.carry)[0],k.y]:[k.x,k.y+k.r+s+F.carrier.tagH/2]},Ne=b=>{const k=b.from==="start"?H.find(O=>O.kind==="start"):void 0;return k?[k.x-k.r-F.slot.mark-xi(b.carry)[0],k.y]:void 0},Z=h.map(({step:b,event:k,edge:O})=>{const se=ke(O),I=O.carry.kind==="none"?void 0:Ne(O);return{step:b,event:k,from:O.from,to:O.to,points:U(O.from,O.to),color:R1(O,m),carry:O.carry,...se?{settle:se}:{},...I?{wait:I}:{}}});bl(Z,R,B);const Ee=new Map;for(const b of Z){if(b.points.length!==2||!Z.some(ce=>ce.from===b.to&&ce.to===b.from&&ce.points.length===2))continue;const[k,O]=b.points,se=Math.abs(O[1]-k[1])<Math.abs(O[0]-k[0]),I=(b.from<b.to?1:-1)*F.edge.parallel;b.points=b.points.map(([ce,Se])=>se?[ce,Se+I]:[ce+I,Se]),Ee.set(b,se?I>0?"below":"above":I>0?"right":"left")}const _=A.map(b=>({from:b.from,to:b.to,points:U(b.from,b.to)})),P=(b,k,O)=>b.from===b.to?Z0(b.points):Ai(b.points,k,O),Y=[],be=H.flatMap(b=>b.text===""?[]:[va(b.text,...K0(b),oe.regionNote)]),Ce=[...po(Z,n.steps.length,P).values()].map(b=>Ka(b.point)),we=[..._e?[{x:_e.x,y:_e.y,w:u.side.pad+me,h:_e.h}]:[],...be],Ae=b=>[...Z.map(k=>k.points),..._.map(k=>k.points)].filter(k=>k!==b);for(const b of Z){const k=n.steps[b.step]?.events[b.event];if(k?.type!=="edge"||k.label===void 0)continue;const O=b.from===b.to,se=vl(b),I=Y.filter(ht=>ht.text===k.label&&Z.some(kt=>kt.step===ht.step&&kt.event===ht.event&&vl(kt)===se)),ce=I[I.length-1];if(ce){ce.until=b.step,Y.push({x:ce.x,y:ce.y,w:ce.w,h:ce.h,step:b.step,event:b.event,text:ce.text,family:ce.family,color:b.color});continue}const Se=Pe(k.label,xa(k.label))+F.label.padX*2,ve=O?{side:"below",base:J0(b.points,Se)}:{},Re=k.labelSide??(b.to==="finish"?"left":Ee.get(b));Y.push(ho({step:b.step,event:b.event,text:k.label,points:b.points,color:b.color,...Re?{side:Re}:O?{}:{flip:!0},...ve},{hard:G,soft:[...we,...Y],touch:Ce,lines:Ae(b.points)}))}const Te=[];A.forEach((b,k)=>{const O=_[k];if(b.label===void 0||O.points.length===0)return;const se=xa(b.label),I=R.get(b.to)?.ghost===!0&&R.get(b.from)?.ghost!==!0,ce=O.points[0][0],Se=I?{side:"below",base:{x:ce+F.label.soft,y:De+F.label.soft},slide:Math.max(...O.points.map(([Re])=>Math.abs(Re-ce)))}:{},ve=ho({step:-1,event:k,text:b.label,points:O.points,color:"slate",...Se},{hard:G,soft:[...we,...Y,...Te],touch:Ce,lines:Ae(O.points)});Te.push(ve),O.label={x:ve.x,y:ve.y,w:ve.w,h:ve.h,text:b.label,family:se.family}});const Be={kind:"state",width:0,height:0,regions:[],boxes:G,lifelines:[],edges:Z,labels:Y,actions:[],badges:[],paths:_,ends:H,..._e?{side:_e}:{}},Ke=[...G.map(b=>b.x),...Y.map(b=>b.x),..._.flatMap(b=>b.label?[b.label.x]:[])],gt=[...Y.map(b=>b.y),..._.flatMap(b=>b.label?[b.label.y]:[])],Ct=Math.max(0,p-Math.min(...Ke)),Ie=gt.length>0?Math.max(0,p-Math.min(...gt)):0;(Ct>0||Ie>0)&&Md(Be,Ct,Ie);const zt=b=>b.x+(b.text===""?b.r:u.text+Pe(b.text,oe.regionNote)),Xt=[...G.map(b=>b.x+b.w),...Y.map(b=>b.x+b.w),...H.map(zt),...Z.flatMap(b=>b.points.map(k=>k[0])),..._.flatMap(b=>[...b.points.map(k=>k[0]),...b.label?[b.label.x+b.label.w]:[]]),..._e?[_e.x+_e.w]:[]],Qt=[...G.map(b=>b.y+b.h),...Y.map(b=>b.y+b.h),...H.map(b=>b.y+b.r),...Z.flatMap(b=>b.points.map(k=>k[1]))],wn={title:l.trail,states:g.map(b=>({box:b,color:m.get(b)??"slate"}))},Wt=Math.max(Math.max(...Xt)+p,_i(n,wn)+p*2),Rt=Math.max(...Qt,$(ae-1)+c.h),rn=$i(n,p,Rt+s,Wt-p*2,wn);Be.width=Wt,Be.height=(rn?rn.y+rn.h:Rt)+p,rn&&(Be.strip=rn);const It=po(Z,n.steps.length,P);return Be.badges=Si(n.steps.map((b,k)=>{const O=It.get(k);return O?{step:k,x:O.point[0],y:O.point[1],color:O.edge.color}:Cd(b.events,k,Be)})),Be}function R1(n,o){return n.carry.kind==="coin"?Dl(n,o):o.get(n.to==="finish"?n.from:n.to)??"slate"}var ag=n=>n.kind==="time",Tl={d:86400,h:3600,min:60,s:1,ms:.001},q1=Object.keys(Tl);function H1(n){const o=/^([0-9]+(?:\.[0-9]+)?)(ms|s|min|h|d)$/u.exec(n);if(!o)return{seconds:1,unit:"s"};const c=o[2];return{seconds:Number(o[1])*Tl[c],unit:c}}var t0=(n,o)=>q1.find(c=>n/Tl[c]>=2-1e-9)??o,n0=(n,o,c)=>`${Number((n/Tl[o]).toFixed(2))} ${Ja[c].timeUnits[o]}`;function U1(n,o,c){let u=1;if(o)u=o*Math.max(1,Math.ceil(n/o/8));else for(let r=1;;r*=10){const l=[r,r*2,r*5].find(m=>n/m<=F.time.ticks);if(l!==void 0){u=l;break}}const p=[];for(let r=0;r<=n;r+=u)p.push(r);const s=p[p.length-1];return s!==n&&(n-s)*c>=F.time.minorPx&&p.push(n),{at:p,step:u}}function L1(n,o,c,u){const p=Array.from({length:o-1},(r,l)=>l+1).find(r=>o%r===0&&r*c>=F.time.minorPx);if(p===void 0)return[];const s=[];for(let r=p;r<n;r+=p)u.includes(r)||s.push(r);return s}function a0(n){let o=0;return n.steps.map(c=>{const u=o;for(const p of c.events)p.type==="now"&&(o=Math.max(o,p.to+1));return[u,o]})}function F1(n,o="ja"){const c=F.time,{margin:u,gap:p}=F,s=F.region,r=Ja[o],l=n.time??{scale:{unit:"",length:"1s",count:1},rows:[]},{scale:m}=l,h=Math.max(1,m.count),g=H1(m.length),x=Math.max(c.width,_i(n)+u*2),A=Math.max(0,...l.rows.map(Z=>Pe(Z.name,oe.timeRow))),w=Math.max(c.axisX,u+s.inset+A+c.gutterGap),D=x-c.right-w,T=D/h,B=ki(n),N=$d(n),M=[],z=[],ae=[],le=[],V=new Map(l.rows.map(Z=>[Z.id,Z]));let J,X=u;if(l.zoom){const{from:Z,to:Ee}=l.zoom,_=Ee-Z+1,P=D/_,Y=u,be=t0(Ee*g.seconds,g.unit),Ce=[];for(let Te=0;Te<_;Te++){const Be=Z+Te,Ke=w+Te*P,gt=n.boxes.map((Ie,zt)=>{const Xt=N.get(Ie.id),Qt=Math.max(Ei(n,Ie.id,!1),Dd(Xt,Ie.icon!==void 0,F.box.padX)),wn=Y+c.boxTop+zt*(F.box.h+c.boxGap),Wt=V.get(Ie.id),Rt={id:Ie.id,name:Ie.name,...Ie.sub!==void 0?{sub:Ie.sub}:{},...Ie.icon!==void 0?{icon:Ie.icon}:{},color:B.get(Ie.id)??"slate",x:Ke+P/2-Qt/2,y:wn,w:Qt,h:F.box.h,cx:Ke+P/2,cy:wn+F.box.h/2,...Wt?{row:Wt.id}:{},...Wt?.empty?.includes(Be)?{empty:!0}:{}};return Nd(Rt,Xt),Rt});z.push(...gt);const Ct=`${m.unit} ${(m.from??0)+Be}${r.headJoin}${n0(Be*g.seconds,be,o)}`;Ce.push({unit:Be,head:Ct,boxes:gt,x:Ke,y:Y,w:P,h:0})}const Ae=Math.max(Y+c.boxTop,...z.map(Te=>Te.y+Te.h))+c.zoomBottom;for(const Te of Ce)Te.h=Ae-Y;M.push({id:"zoom",lines:[r.zoom],note:`${_} ${m.unit}`,icon:"clock",color:"blue",x:u,y:Y,w:x-u*2,h:Ae-Y,header:{x:u+s.inset,y:Y+s.inset,w:Math.max(s.icon,Pe(r.zoom,oe.regionName)),h:s.nameY-s.inset+s.line}}),J={from:Z,to:Ee,frame:{x:0,y:0,w:0,h:0},guides:[],columns:Ce,empty:r.empty,headY:Y+c.head},X=Ae+c.zoomGap}const W=X+c.rowsTop,re=l.rows.map((Z,Ee)=>({id:Z.id,name:Z.name,color:Z.color??B.get(Z.id)??uo[Ee%uo.length],x:w,y:W+Ee*(c.row+c.rowGap),w:D,h:c.row})),ye=re.length>0?Math.max(...re.map(Z=>Z.y+Z.h)):W,he=Math.min(c.markMax,Math.max(c.markMin,T*c.markRatio)),me=re.flatMap((Z,Ee)=>Array.from({length:h},(_,P)=>({row:Z.id,unit:P,empty:l.rows[Ee]?.empty?.includes(P)===!0,color:Z.color,colors:[],x:w+(P+.5)*T-he/2,y:Z.y,w:he,h:Z.h})));if(n.steps.forEach((Z,Ee)=>Z.events.forEach((_,P)=>{if(_.type==="mark")for(const Y of me)Y.row===_.row&&Y.unit>=_.from&&Y.unit<=_.to&&!Y.empty&&Y.colors.push({step:Ee,event:P,color:_.color})})),J){const Z={x:w+J.from*T-c.frame,y:W-c.frame,w:(J.to-J.from+1)*T+c.frame*2,h:ye-W+c.frame*2},Ee=Math.max(...J.columns.map(_=>_.y+_.h));J.frame=Z,J.guides=[[[Z.x,Z.y],[w,Ee]],[[Z.x+Z.w,Z.y],[w+D,Ee]]]}const Oe=ye+c.point.drop,xe=(l.points??[]).map(Z=>{const Ee=[];n.steps.forEach((we,Ae)=>we.events.forEach((Te,Be)=>{Te.type==="swap"&&Te.box===Z.id&&Ee.push({step:Ae,event:Be,text:Te.text,...Te.color?{color:Te.color}:{}})}));const _=w+(Z.at+.5)*T,P=_+c.point.text,Y=Math.max(Pe(Z.id,oe.pointName),...Ee.map(we=>Pe(we.text,oe.pointState))),be=Oe+c.point.nameY-oe.pointName.size*.8,Ce=Oe+c.point.stateY+oe.pointState.size*.2;return{id:Z.id,unit:Z.at,cx:_,cy:Oe,r:c.point.r,text:{x:P,y:be,w:Y,h:Ce-be},changes:Ee}}),C=new Map(xe.map(Z=>[Z.id,Z])),$=(Z,Ee)=>C.get(Z)?.changes.filter(P=>P.step<=Ee&&P.color).at(-1)?.color;n.steps.forEach((Z,Ee)=>Z.events.forEach((_,P)=>{if(_.type!=="edge")return;if(_.at===void 0){const Ce=C.get(_.from),we=C.get(_.to);if(!Ce||!we||Ce===we)return;const Ae=we.cx>Ce.cx,Te=Ae?Math.max(Ce.cx+Ce.r,Ce.text.x+Ce.text.w+c.point.link):Ce.cx-Ce.r-c.point.end,Be=Ae?we.cx-we.r-c.point.end:Math.min(we.cx-we.r,we.text.x+we.text.w+c.point.link),Ke={step:Ee,event:P,from:_.from,to:_.to,points:[[Te,Ce.cy],[Be,we.cy]],color:_.carry.kind==="coin"?"coin":$(_.to,Ee)??"slate",carry:_.carry};_.carry.kind!=="none"&&(Ke.settle=[Be-(Ae?1:-1)*(F.carrier.coinR+F.edge.arrow),we.cy]),ae.push(Ke);return}const Y=G1(_,J);if(!Y)return;const be={step:Ee,event:P,from:_.from,to:_.to,points:Y.points,color:Dl(_,B),carry:_.carry};Y1(be,Y.from,Y.to,N),ae.push(be),le.push({step:Ee,event:P,from:Y.from,to:Y.to,column:_.at,into:_.into??_.at})}));const q={kind:"time",width:x,height:0,regions:M,boxes:z,lifelines:[],edges:ae,labels:[],actions:[],badges:[],paths:[],ends:[],axis:{x:w,w:D,unit:T,count:h,line:0},rows:re,marks:me,ticks:[],minor:[],periods:[],points:xe,...J?{zoom:J}:{},spans:[],wires:le,needle:{y1:W-c.needle.over,y2:ye+c.needle.over}},G=ye,R=n.steps.some(Z=>Z.events.some(Ee=>Ee.type==="edge"&&Ee.at===void 0&&Ee.label!==void 0)),{r:S,inset:H}=F.badge;let K=xe.length>0?Oe+c.point.r+(R?c.point.room:c.point.plain):G+(S+H)*2;const pe=[],_e=n.steps.flatMap((Z,Ee)=>Z.events.flatMap((_,P)=>_.type==="span"?[{s:Ee,e:P,event:_}]:[]));for(const{s:Z,e:Ee,event:_}of _e){const P=_.shape==="box"?"box":"bracket",Y=_e.find(Te=>Te.s>Z&&(Te.event.shape==="box"?"box":"bracket")===P&&Te.event.from<=_.to&&_.from<=Te.event.to),be=_.color??"slate",Ce=w+_.from*T,we=w+(_.to+1)*T,Ae={step:Z,event:Ee,kind:P,from:_.from,to:_.to,text:_.text,color:be,...Y?{until:Y.s}:{}};if(P==="box"){const Te=c.box,Be={x:Ce-Te.pad,y:W-Te.pad,w:we-Ce+Te.pad*2,h:ye-W+Te.pad*2},Ke=Pe(_.text,oe.tag)+Te.tagPadX*2,gt={x:Be.x+Te.tagX,y:Be.y-Te.tagH/2,w:Ke,h:Te.tagH};pe.push({...Ae,...Be,textRect:gt,textY:Be.y+F.baseline.tag})}else pe.push({...Ae,x:Ce,y:0,w:we-Ce,h:c.bracket.tick,textRect:{x:0,y:0,w:0,h:0},textY:0})}q.spans=pe,q.badges=s0(n,q,a0(n)),q.labels=V1(n,q),K=Math.max(K,...q.labels.map(Z=>Z.y+Z.h+F.label.soft));const De=[];for(const Z of pe.filter(Ee=>Ee.kind==="bracket")){const Ee=Pe(Z.text,oe.spanText),_=Math.min(w+D-Ee/2,Math.max(w+Ee/2,Z.x+Z.w/2)),P={x:Math.min(Z.x,_-Ee/2),w:Math.max(Z.x+Z.w,_+Ee/2)-Math.min(Z.x,_-Ee/2)},Y=Ce=>{const we=Ce.until===void 0||Ce.until>Z.step,Ae=Math.min(Ce.x,Ce.textRect.x),Te=Math.max(Ce.x+Ce.w,Ce.textRect.x+Ce.textRect.w)-Ae;return we&&P.x<Ae+Te&&Ae<P.x+P.w};let be=De.findIndex(Ce=>!Ce.some(Y));be<0&&(De.push([]),be=De.length-1),De[be].push(Z),Z.y=K+c.bracket.gap+be*c.bracket.lane,Z.textY=Z.y+c.bracket.tick+c.bracket.text,Z.textRect=va(Z.text,_,Z.textY,oe.spanText,"middle")}De.length>0&&(K=Math.max(...pe.filter(Z=>Z.kind==="bracket").map(Z=>Z.textRect.y+Z.textRect.h)));const je=K+c.axisGap;q.axis.line=je;const Le=U1(h,l.period?.length,T),ze=je+c.tickY,Ze=t0(h*g.seconds,g.unit);q.ticks=Le.at.map(Z=>{const Ee=n0(Z*g.seconds,Ze,o),_=Pe(Ee,oe.timeTick),P=w+Z*T,Y=Z===0?P:Z===h?P-_:Math.min(w+D-_,Math.max(w,P-_/2));return{at:Z,x:P,text:Ee,left:Y,y:ze}}),q.minor=L1(h,Le.step,T,Le.at);let U=ze+oe.timeTick.size*.2;if(l.period){const Z=l.period,Ee=[];for(let Y=0,be=0;be<h;Y++,be+=Z.length){const Ce=Math.min(h,be+Z.length)-1,we=`${Z.name} ${(Z.from??0)+Y}`,Ae=(m.from??0)+be,Te=`${m.unit} ${r.range(String(Ae),String((m.from??0)+Ce))}`;Ee.push({index:Y,from:be,to:Ce,name:we,range:Te,x:w+be*T,y:je,w:(Ce-be+1)*T,h:0,nameY:ze,rangeY:ze+c.rangeY})}const _=q.ticks.map(Y=>va(Y.text,Y.left,Y.y,oe.timeTick)),P=Ee.some(Y=>{const be=va(Y.name,Y.x+Y.w/2,Y.nameY,oe.timePeriod,"middle");return _.some(Ce=>be.x<Ce.x+Ce.w+c.nameGap&&Ce.x<be.x+be.w+c.nameGap)});for(const Y of Ee)P&&(Y.nameY=ze+c.rangeY+2,Y.rangeY=Y.nameY+c.rangeY),Y.h=Y.rangeY+oe.timeRange.size*.2-je;q.periods=Ee,U=Math.max(U,...Ee.map(Y=>Y.rangeY+oe.timeRange.size*.2))}const ke=U+c.bottom;M.push({id:"axis",lines:[],color:"slate",x:u,y:X,w:x-u*2,h:ke-X,header:{x:u+s.inset,y:X+s.inset,w:0,h:0}});const Ne=$i(n,u,ke+p,x-u*2);return Ne&&(q.strip=Ne),q.height=(Ne?Ne.y+Ne.h:ke)+u,q.badges=s0(n,q,a0(n)),q}function G1(n,o){if(!o||n.at===void 0)return;const c=n.into??n.at,u=o.columns.find(w=>w.unit===n.at),p=o.columns.find(w=>w.unit===c),s=u?.boxes.find(w=>w.id===n.from),r=p?.boxes.find(w=>w.id===n.to);if(!u||!p||!s||!r||s===r)return;const l=u.boxes.indexOf(s),m=p.boxes.indexOf(r),h=m>l;if(u===p){if(Math.abs(m-l)===1)return{from:s,to:r,points:[[s.cx,h?s.y+s.h+1:s.y-1],[r.cx,h?r.y-1:r.y+r.h+1]]};const w=Math.min(u.x+u.w-F.gap,Math.max(s.x+s.w,r.x+r.w)+F.gap);return{from:s,to:r,points:[[s.x+s.w+1,s.cy],[w,s.cy],[w,r.cy],[r.x+r.w+1,r.cy]]}}const g=p.x>u.x;if(l===m)return{from:s,to:r,points:[[g?s.x+s.w+1:s.x-1,s.cy],[g?r.x-1:r.x+r.w+1,r.cy]]};const x=s.cx+(g?1:-1)*s.w/4,A=r.cx-(g?1:-1)*r.w/4;return{from:s,to:r,points:[[x,h?s.y+s.h+1:s.y-1],[A,h?r.y-1:r.y+r.h+1]]}}function Y1(n,o,c,u){const p={...n};bl([p],new Map([[n.to,c]]),u);const s={...n};bl([s],new Map([[n.from,o]]),u),p.settle&&(n.settle=p.settle),s.wait&&(n.wait=s.wait)}function s0(n,o,c){const{r:u,inset:p}=F.badge,{axis:s}=o,r=[],l=[],m=Math.min(...o.rows.map(x=>x.y),o.needle.y1+F.time.needle.over),h=Math.max(...o.rows.map(x=>x.y+x.h),m),g=o.points[0]?(h+o.points[0].cy-o.points[0].r)/2:h+u+p;return n.steps.forEach((x,A)=>{const w=(M,z)=>{r.push(M),l.push({step:A,x:M[0],y:M[1],color:z})},D=o.edges.filter(M=>M.step===A).sort((M,z)=>M.event-z.event)[0];if(D){const M=D.carry.kind!=="none"&&!D.wait?[D.points[0]]:[],z=o.edges.filter(ae=>ae!==D).map(ae=>ae.points);w(Ai(D.points,[...r,...M],z),D.color);return}const[T,B]=c[A]??[0,0];if(B>T){let M=s.x+(T+B)/2*s.unit;const z=o.points.find(ae=>Math.abs(ae.cx-M)<u+p);z&&(M=z.cx+u+p*2),w([M,g],"slate");return}for(const M of x.events){const z=P1(M,A,o);if(z){w(z.at,z.color);return}}if(o.strip&&x.events.some(M=>M.type==="strip")){l.push({step:A,x:o.strip.x+p,y:o.strip.y+p,color:"slate"});return}const N=l[l.length-1];l.push(N?{...N,step:A}:{step:A,x:s.x-u-p,y:m,color:"slate"})}),Si(l)}function P1(n,o,c){const{r:u,inset:p}=F.badge;if(n.type==="span"){const s=c.spans.find(r=>r.step===o&&r.from===n.from&&r.to===n.to&&r.text===n.text);return s?s.kind==="box"?{at:[s.x,s.y],color:s.color}:{at:[s.x-u-p,s.y+s.h/2],color:s.color}:void 0}if(n.type==="swap"){const s=c.points.find(r=>r.id===n.box);if(s)return{at:[s.cx-s.r-p-u,s.cy],color:n.color??"slate"}}if(n.type==="mark"){const s=c.rows.find(l=>l.id===n.row),r=Math.min(...c.rows.map(l=>l.y));if(s)return{at:[c.axis.x+(n.from+n.to+1)/2*c.axis.unit,r-u-p],color:n.color}}}function V1(n,o){const c=[],u=o.points.map(r=>({x:r.cx-r.r,y:r.cy-r.r,w:r.r*2,h:r.r*2})),p=o.points.map(r=>r.text),s=(o.zoom?.columns??[]).map(r=>va(r.head,r.x+r.w/2,o.zoom?.headY??0,oe.timeHead,"middle"));for(const r of o.edges){const l=n.steps[r.step]?.events[r.event];if(l?.type!=="edge"||l.label===void 0)continue;const m=o.badges.filter(g=>g.step<=r.step).map(g=>Ka([g.x,g.y])),h=l.labelSide??(l.at===void 0?"below":void 0);c.push(ho({step:r.step,event:r.event,text:l.label,points:r.points,color:r.color,...h?{side:h}:{},flip:l.at!==void 0},{hard:[...u,...o.boxes],soft:[...p,...s,...c.filter(g=>g.step===r.step)],touch:m}))}return c}function o0(n,o){const c={edges:[],events:[],busy:0};let u=Ge.edgeAt,p,s=0,r=Number.NEGATIVE_INFINITY;const l=(A,w,D)=>{const T=w.carry.kind!=="none",B=D+(T?Ge.drawCarry:Ge.draw);return c.edges.push({event:A,a:D,b:B,carries:T,coin:w.carry.kind==="coin",named:w.label!==void 0}),c.busy=Math.max(c.busy,B),B},m=o?n.events.flatMap((A,w)=>A.type==="now"?[{e:w,to:A.to}]:[]):[],h=o?.from??0,g=Math.max(h,...m.map(A=>A.to+1)),x=A=>A.type==="edge"&&A.at!==void 0&&A.at>=h&&A.at<g;return n.events.forEach((A,w)=>{if(o&&w===m[0]?.e){let D=Math.max(u,r+Ge.change);const T=[[D,h]],B=[];for(let N=h;N<g;N++){const M=D,z=n.events.flatMap((V,J)=>x(V)&&V.at===N?[{k:J,ev:V}]:[]),ae=z.reduce((V,J,X)=>Math.max(V,l(J.k,J.ev,M+Ge.stagger*X)),M),le=Math.max(M+o.speed,z.length>0?ae+Ge.time.wait:M);le-o.speed>M+1e-9&&T.push([le-o.speed,N]),T.push([le,N+1]),B.push({unit:N,at:le}),D=le}c.sweep={keys:T,passed:B},c.busy=Math.max(c.busy,D),u=D+Ge.time.after,p=D,s=0;return}if(!(A.type==="now"||o&&x(A)))if(A.type==="commit"||A.type==="branch"){const D=u,T=D+Ge.draw;c.edges.push({event:w,a:D,b:T,carries:!1,coin:!1,named:!1}),u=D+Ge.stagger,p=T,s=0,c.busy=Math.max(c.busy,T)}else if(A.type==="edge"){const D=u;p=l(w,A,D),u=D+Ge.stagger,s=0}else if(A.type==="action")c.events.push({event:w,at:u}),c.busy=Math.max(c.busy,u+Ge.action),u+=Ge.action,s=0;else{const D=(p??u)+Ge.change*s++;c.events.push({event:w,at:D}),c.busy=Math.max(c.busy,D),r=Math.max(r,D)}}),c.edges.sort((A,w)=>A.a-w.a),c}function X1(n,o=!1){const c=n.kind==="time"?n.time:void 0,u=Ge.time,p=c?Math.min(u.unitMax,Math.max(u.unitMin,u.axis/Math.max(1,c.scale.count))):0;let s=0;const r=n.steps.map(W=>{if(!c)return o0(W);const re=o0(W,{from:s,speed:p});return s=re.sweep?.keys[re.sweep.keys.length-1]?.[1]??s,re}),l=[];let m=Ge.intro;n.steps.forEach((W,re)=>{const ye=Math.min(Ge.stepMax,Math.max(Ge.stepMin,Ge.stepBase+[...W.body].length*Ge.perChar)),he=Math.max(ye,(r[re]?.busy??0)+Ge.dwell);l.push({start:m,end:m+he}),m+=he});const g=Math.ceil(m+Ge.outro),x=g-Ge.tail,A=l[l.length-1],w=o&&A?{start:A.start+(r[r.length-1]?.busy??0),end:x}:void 0,D=w?.start??x,T=[],B=[],N=[],M=[];r.forEach((W,re)=>{const ye=l[re],he=[];for(const me of W.edges){const Oe=ye.start+me.a;T.push({step:re,event:me.event,start:Oe,drawn:ye.start+me.b,end:ye.end});const xe=n.steps[re]?.events[me.event],C=n.kind==="git"&&xe?.type==="edge"&&xe.carry.kind==="tag"&&xe.carry.text===xe.from;me.carries&&!C&&M.push({step:re,event:me.event,who:me.coin?"coin":"main",a:Oe,b:ye.start+me.b}),me.named&&he.push({step:re,event:me.event,start:Oe+Ge.labelDelay,end:ye.end})}he.forEach((me,Oe)=>{const xe=he[Oe+2];xe&&(me.end=Math.min(me.end,xe.start))});for(const me of he)w&&me.end>w.start?me.end=w.end:(n.kind==="state"&&me.end<D&&(me.after={start:me.end,end:D}),w&&(me.again=w));B.push(...he);for(const me of W.events)N.push({step:re,event:me.event,at:ye.start+me.at})});const z=l[0]?.start??0,ae=M.some(W=>W.who==="main"),le=[];for(const W of["main","coin"]){const re=M.filter(ye=>ye.who===W);re.forEach((ye,he)=>{const me=re[he+1],Oe=he===0&&(W==="main"||!ae);le.push({step:ye.step,event:ye.event,who:W,depart:ye.a,arrive:ye.b,start:Oe?Math.min(z,ye.a):ye.a,end:me?Math.max(me.a,ye.b):x})})}le.sort((W,re)=>W.depart-re.depart);const V=n.kind==="state"?J1(n,T,x):void 0,J=[[0,0]],X=[];return r.forEach((W,re)=>{const ye=l[re].start;for(const[he,me]of W.sweep?.keys??[])J.push([ye+he,me]);for(const he of W.sweep?.passed??[])X.push({unit:he.unit,passed:ye+he.at})}),J.push([g,s]),{total:g,last:x,steps:l,edges:T,carriers:le,labels:B,badges:l.map((W,re)=>({step:re,appears:W.start})),events:N,stills:l.map(W=>W.end-Ge.still),...w?{whole:w}:{},...V?{states:V}:{},...c?{needle:J,units:X,meters:Q1(n,r,l)}:{}}}function Q1(n,o,c){const u=n.time?.period?.length;return(n.strip?.meters??[]).map(({field:p})=>{const s=[[0,0]];let r=0;return o.forEach((l,m)=>{const h=c[m].start,g=(n.steps[m]?.events??[]).flatMap((T,B)=>{const N=T.type==="strip"&&T.field===p&&T.value!==void 0?W0(T.value):void 0;return N===void 0?[]:[{e:B,ratio:N}]}),x=g[g.length-1];if(!x)return;const A=l.sweep?.keys??[],w=A[0],D=A[A.length-1];if(w&&D&&D[1]>w[1]){const[T,B]=[w[1],D[1]];let N=r,M=T;const z=u?Math.floor((B-1e-9)/u)*u:0;if(z>0&&z>=T){const ae=h+(A.find(([,V])=>V===z)?.[0]??w[0]),le=s[s.length-1][0];s.push([Math.max(le,ae-Ge.time.reset),r],[ae,0]),N=0,M=z}for(const[ae,le]of A)le>=M&&s.push([h+ae,N+(x.ratio-N)*(le-M)/(B-M)])}else{const T=h+(l.events.find(B=>B.event===x.e)?.at??0);s.push([T,r],[T+Ge.fade,x.ratio])}r=x.ratio}),{field:p,keys:s}})}var Z1=n=>gi.includes(n);function J1(n,o,c){const u=new Map,p=r=>{const l=u.get(r)??{box:r,lit:[]};return u.set(r,l),l};let s;for(const r of o){const l=n.steps[r.step]?.events[r.event];if(!(l?.type!=="edge"||l.from===l.to)){if(s){const m=p(s.box);m.lit.push({start:s.since,end:r.start}),s.box===l.from&&m.done===void 0&&(m.done=r.start+Ge.done),s=void 0}Z1(l.to)||(s={box:l.to,since:r.drawn})}}return s&&p(s.box).lit.push({start:s.since,end:c}),[...u.values()]}var ws={app:"M -9 -7 h18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z M -11 -2 h22",router:"M -9 -4 h16 M 3 -8 l4 4 l-4 4 M 9 5 h-16 M -3 1 l-4 4 l4 4",on:"M -7 7 L 7 -7 M -1 -7 h8 v8",off:"M -7 -7 L 7 7 M 7 -1 v8 h-8",pool:"M -9 -5 a9 3.5 0 1 0 18 0 a9 3.5 0 1 0 -18 0 M -9 -5 v10 a9 3.5 0 0 0 18 0 v-10 M -9 0 a9 3.5 0 0 0 18 0",db:"M -9 -5 a9 3.5 0 1 0 18 0 a9 3.5 0 1 0 -18 0 M -9 -5 v10 a9 3.5 0 0 0 18 0 v-10 M -9 0 a9 3.5 0 0 0 18 0",exe:"M -5 -8 L 7 0 L -5 8 Z",idx:"M -9 -7 h18 M -9 -2 h18 M -9 3 h18 M -9 8 h11",sign:"M -9 4 c 3 -9 5 -9 6 0 s 3 7 6 -2 s 3 -6 6 0",env:"M -8 -5.5 h16 v11 h-16 z M -8 -5.5 l8 6 l8 -6",lock:"M -5.5 -1 h11 v8 h-11 z M -3.5 -1 v-3 a3.5 3.5 0 0 1 7 0 v3",check:"M -5 0 l3.5 3.5 l6.5 -7",flag:"M -4 8 V -8 M -4 -7 H 6 L 3.5 -3.5 L 6 0 H -4",x:"M -5 -5 l10 10 M 5 -5 l-10 10",chain:"M -1.5 4.5 l-2 2 a3.5 3.5 0 0 1 -5 -5 l3 -3 a3.5 3.5 0 0 1 5 0 M 1.5 -4.5 l2 -2 a3.5 3.5 0 0 1 5 5 l-3 3 a3.5 3.5 0 0 1 -5 0 M -2.5 2.5 l5 -5",net:"M -1.3 -4.6 L -5.8 3 M 1.3 -4.6 L 5.8 3 M -4.3 5.5 H 4.3 M -2.2 -7 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 M -9.2 5.5 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 M 4.8 5.5 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0",user:"M -4 -4.5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M -8 9 c0 -5 3.6 -7.5 8 -7.5 s8 2.5 8 7.5",server:"M -9 -8 h18 v7 h-18 z M -9 1 h18 v7 h-18 z M -5 -4.5 h0.01 M -5 4.5 h0.01",key:"M -9 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0 M -2 0 h10 M 5 0 v3.5 M 8 0 v2.5",shield:"M 0 -9 l8 3 v5 c0 5 -3.5 8 -8 10 c-4.5 -2 -8 -5 -8 -10 v-5 z",globe:"M -9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M -9 0 h18 M 0 -9 c-4.5 4 -4.5 14 0 18 M 0 -9 c4.5 4 4.5 14 0 18",bolt:"M 2 -9 L -5 1 h5 l-2 8 l7 -10 h-5 z",doc:"M -6 -9 h8 l5 5 v13 h-13 z M 2 -9 v5 h5 M -3 1 h7 M -3 5 h5",box:"M -9 -4.5 l9 -4.5 l9 4.5 v9 l-9 4.5 l-9 -4.5 z M -9 -4.5 l9 4.5 l9 -4.5 M 0 0 v9",truck:"M -10 -6 h11 v10 h-11 z M 1 -2 h5 l3.5 3.5 v2.5 h-8.5 M -7.5 6.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0 M 3 6.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0",card:"M -9 -6.5 h18 a2 2 0 0 1 2 2 v9 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-9 a2 2 0 0 1 2 -2 z M -11 -2 h22 M -7 3 h5",cart:"M -10 -8 h3 l3 11 h11 l2.5 -8 h-15.5 M -4.5 7.5 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M 5 7.5 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0",clock:"M -9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M 0 -5 v5 l3.5 2.5",branch:"M -4 -4.5 v9 M 5 0.5 c0 4 -9 3 -9 6.5 M -6.2 -7 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 M -6.2 7 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 M 2.8 -2 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0",cloud:"M -7 6 h13 a4.5 4.5 0 0 0 0.5 -9 a6 6 0 0 0 -11.5 -1 a4.5 4.5 0 0 0 -2 10 z",refresh:"M 7 -3 a7.5 7.5 0 1 0 0.5 5 M 7.5 -8 v5 h-5",undo:"M -7 -2 h10 a5 5 0 0 1 0 10 h-6 M -3 -6 l-4 4 l4 4",yen:"M -6 -8 l6 7 l6 -7 M 0 -1 v9 M -5 1.5 h10 M -5 5 h10",layers:"M 0 -8 l9 4.5 l-9 4.5 l-9 -4.5 z M -9 2.5 l9 4.5 l9 -4.5",code:"M -4 -6 l-5 6 l5 6 M 4 -6 l5 6 l-5 6",paint:"M -8 8 c 0 -3 2 -5 4.5 -5 l 9 -9 l 3.5 3.5 l -9 9 c 0 2.5 -2 4.5 -5 4.5 z",block:"M -9 -7 h18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z M -11 -2.5 h22 M -6 2.5 h8"},Vn=[[0,Number.POSITIVE_INFINITY]],Qu=.5,i0=(n,o)=>n.shown.some(([c,u])=>c<=o&&o<u),Zu=n=>({text:n.text,rect:{x:n.rect.x,y:n.rect.y,w:n.rect.w,h:n.rect.h},badge:n.badge===!0,...n.part?{part:n.part}:{}});function K1(n,o,c=[]){const u=[];return o.forEach((p,s)=>{const r=n.filter(m=>i0(m,p));r.forEach((m,h)=>{for(const g of r.slice(h+1)){const x=Math.min(m.rect.x+m.rect.w,g.rect.x+g.rect.w)-Math.max(m.rect.x,g.rect.x),A=Math.min(m.rect.y+m.rect.h,g.rect.y+g.rect.h)-Math.max(m.rect.y,g.rect.y);x>Qu&&A>Qu&&u.push({kind:"texts",step:s,texts:[m.text,g.text],spots:[Zu(m),Zu(g)]})}});const l=c.filter(m=>i0(m,p));for(const m of r)if(!m.boxed)for(const h of l)Td(h.points,m.rect,Qu)&&u.push({kind:"line",step:s,text:m.text,line:{from:h.from,to:h.to},spots:[Zu(m)]})}),u}function W1(n,o="ja"){const c=Ja[o],u=s=>s.kind==="icon"?c.iconOf(s.box):s.kind==="coin"?c.coin:c.envelope,p=s=>s.badge?c.badgeName(s.text):s.part?u(s.part):c.quoted(s.text);return n.kind==="texts"?c.textsOverlap(p(n.spots[0]),p(n.spots[1])):c.lineCrosses(n.line.from,n.line.to,p(n.spots[0]))}var $t=n=>n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),sg=(n,o)=>n===void 0?o:`<a href="${$t(n)}">${o}</a>`,$e=n=>Math.round(n*100)/100,dt=n=>n==="coin"?"--c:var(--coin);--ct:var(--coint)":`--c:var(--c-${n});--ct:var(--t-${n})`;function ks(n,o,c,u,p="dg-gl"){const s=n===void 0?void 0:ws[n];return s?`<path class="${p}" transform="translate(${$e(o)} ${$e(c)}) scale(${u})" d="${s}"/>`:""}function I1(n){return Object.hasOwn(ws,n)?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${F.stroke.glyph*F.box.iconScale}" stroke-linecap="round" stroke-linejoin="round"><path d="${ws[n]}"/></svg>`:void 0}function fo(n){const o=n.filter((s,r)=>r===0||s[0]!==n[r-1][0]||s[1]!==n[r-1][1]),[c,u]=o[0];let p=`M ${$e(c)} ${$e(u)}`;for(let s=1;s<o.length-1;s++){const[r,l]=o[s-1],[m,h]=o[s],[g,x]=o[s+1],A=Math.hypot(m-r,h-l),w=Math.hypot(g-m,x-h),D=Math.min(F.edge.bend,A/2,w/2);p+=` L ${$e(m-(m-r)/A*D)} ${$e(h-(h-l)/A*D)} Q ${$e(m)} ${$e(h)} ${$e(m+(g-m)/w*D)} ${$e(h+(x-h)/w*D)}`}if(o.length>1){const[s,r]=o[o.length-1];p+=` L ${$e(s)} ${$e(r)}`}return p}function Od(n){const[o,c]=n[n.length-1],[u,p]=n[n.length-2],s=Math.hypot(o-u,c-p)||1,r=(o-u)/s,l=(c-p)/s,{arrow:m,arrowHalf:h}=F.edge;return`M ${$e(o-r*m-l*h)} ${$e(c-l*m+r*h)} L ${$e(o)} ${$e(c)} L ${$e(o-r*m+l*h)} ${$e(c-l*m-r*h)}`}function Mt(n,o,c,u,p,s,r=Vn,l){return n?.push({text:p,rect:va(p,c,u,s,l),shown:r}),`<text class="${o}" x="${$e(c)}" y="${$e(u)}"${l?` text-anchor="${l}"`:""}>${$t(p)}</text>`}function og(n,o){const c=[[0,{opacity:0}]];for(const[u,p]of o)c.push([u,{opacity:0},rt.out],[u+Ge.fade,{opacity:1}],[p-.1,{opacity:1},rt.inOut],[p+.25,{opacity:0}]);return c.push([n.total,{opacity:0}]),n.kf(c)}function ig(n,o){const c=[];for(let u=0;u<o.length;){let p=u;for(;p+1<o.length&&o[p+1]===o[p]+1;)p++;c.push([n.t.steps[o[u]].start,n.t.steps[o[p]].end]),u=p+1}return og(n.m,c)}function ex(n,o){const{radius:c,icon:u,iconRadius:p,iconScale:s,nameY:r,line:l}=F.region,{x:m,y:h}=n.header,g=n.lines.map((w,D)=>Mt(o,"dg-bz",m,n.y+r+D*l,w,oe.regionName)).join(""),x=n.note?Mt(o,"dg-bx",m,n.y+r+n.lines.length*l+1,n.note,oe.regionNote):"",A=n.icon&&ws[n.icon]?`<rect class="dg-bi" x="${$e(m)}" y="${$e(h)}" width="${u}" height="${u}" rx="${p}"/>${ks(n.icon,m+u/2,h+u/2,s)}`:"";return`<g style="${dt(n.color)}"><rect class="dg-band" x="${$e(n.x+.5)}" y="${$e(n.y+.5)}" width="${$e(n.w-1)}" height="${$e(n.h-1)}" rx="${c}"/>${A}${g}${x}</g>`}function rg(n,o,c,u,p){const s=[[0,n.sub??"","dg-ss"],...c];return s.map(([r,l,m],h)=>{const g=s[h+1]?.[0],x=h===0?g===void 0?"":o.until(g-Ge.untilFade):g===void 0?o.rise(r):o.rise(r,g-Ge.untilFade);if(l==="")return"";const A=[[h===0?0:r,g===void 0?Number.POSITIVE_INFINITY:g-Ge.untilFade]];return`<g${x?` class="dg-a" style="${x}"`:""}>${Mt(p,m,n.cx,u,l,m==="dg-ss"?oe.boxSub:oe.boxSubStrong,A,"middle")}</g>`}).join("")}function lg(n,o,c,u,p){const s=(r,l="")=>`<rect class="${r}" x="${$e(n.x)}" y="${$e(u)}" width="${$e(n.w)}" height="${p}" rx="${F.box.radius}"${l}/>`;return`${c?`<g class="dg-a" style="${c}">${s("dg-halo")}</g>`:""}${s("dg-st",` ${o.sh}`)}${c?`<g class="dg-a" style="${c}">${s("dg-on")}</g>`:""}`}function cg(n,o,c,u,p){const{icon:s,iconRadius:r,iconScale:l,iconY:m,nameY:h,subY:g}=F.box,x=rg(n,o.m,u,n.cy+g,o.ink),A=p?p.length>0?og(o.m,p.map(B=>[B.start,B.end])):void 0:c.length>0?ig(o,c):void 0,w=n.iconX??n.cx,D=n.slot?`<rect class="dg-slot" x="${$e(n.slot.x)}" y="${$e(n.slot.y)}" width="${$e(n.slot.w)}" height="${$e(n.slot.h)}" rx="${F.slot.radius}"/>`:"";let T="";if(n.icon&&ws[n.icon]){const B={x:w-s/2,y:n.cy+m-s/2,w:s,h:s};o.ink.push({text:`${n.name} の絵柄`,rect:B,shown:Vn,boxed:!0,part:{kind:"icon",box:n.name}}),T=`<rect class="dg-ic" x="${$e(B.x)}" y="${$e(B.y)}" width="${s}" height="${s}" rx="${r}"/>${ks(n.icon,w,n.cy+m,l)}`}return`<g style="${dt(n.color)}">${lg(n,o,A,n.y,n.h)}${D}${T}${Mt(o.ink,"dg-sn",n.cx,n.cy+h,n.name,oe.boxName,Vn,"middle")}${x}</g>`}function tx(n,o,c,u){const{pad:p,h:s,nameY:r,subY:l}=F.follow.head,m=rg(n,o.m,u,p+l),h=c.length>0?ig(o,c):void 0;return`<g style="${dt(n.color)}">${lg(n,o,h,p,s)}<text class="dg-sn" x="${$e(n.cx)}" y="${$e(p+r)}" text-anchor="middle">${$t(n.name)}</text>${m}</g>`}function nx(n,o){const{icon:c,iconRadius:u,iconScale:p,radius:s}=F.box,r=F.state.ghost,l=n.x+r.pad+c/2,m=n.x+r.pad+c+r.gap,h=n.icon&&ws[n.icon]?`<rect class="dg-ic" x="${$e(l-c/2)}" y="${$e(n.cy-c/2)}" width="${c}" height="${c}" rx="${u}"/>${ks(n.icon,l,n.cy,p)}`:"",g=n.sub?r.nameY:F.baseline.mark,x=n.sub?Mt(o,"dg-ss",m,n.cy+r.subY,n.sub,oe.boxSub,Vn,"start"):"";return`<g data-ghost="${$t(n.id)}" style="${dt(n.color)}"><rect class="dg-ghost" x="${$e(n.x)}" y="${$e(n.y)}" width="${$e(n.w)}" height="${n.h}" rx="${s}"/>${h}${Mt(o,"dg-sn",m,n.cy+g,n.name,oe.boxName,Vn,"start")}${x}</g>`}function ax(n,o,c){const{r:u,inset:p}=F.state.done,s=n.x+n.w-p,r=n.y+p;return`<g class="dg-popc dg-a" data-done="${$t(n.id)}" style="${dt(n.color)};${c.m.pop(o)}"><circle class="dg-done" cx="${$e(s)}" cy="${$e(r)}" r="${u}"/>${ks("check",s,r,.5,"dg-done-ck")}</g>`}function sx(n,o,c,u){u.push({from:n.from,to:n.to,points:n.points,shown:Vn});const p=n.label?.family==="sans",s=n.label?Mt(c,`dg-path-t${p?" dg-path-tj":""}`,n.label.x+F.label.padX,n.label.y+n.label.h/2+F.baseline.label,n.label.text,p?oe.labelJa:oe.label):"";return`<g data-path="${$t(`${n.from}->${n.to}`)}" style="${dt(o)}"><path class="dg-path" d="${fo(n.points)}"/><path class="dg-path-h" d="${Od(n.points)}"/>${s}</g>`}function ox(n,o,c){const{pad:u}=F.state.side,p=n.y+u+oe.regionName.size,s=n.notes.map((r,l)=>Mt(c,"dg-side-n",n.x+u,p+F.region.line*(l+1),r,oe.regionNote)).join("");return`<g style="${dt(o)}"><rect class="dg-side" x="${$e(n.x+.5)}" y="${$e(n.y+.5)}" width="${$e(n.w-1)}" height="${$e(n.h-1)}" rx="${F.region.radius}"/>${Mt(c,"dg-side-t",n.x+u,p,n.title,oe.regionName)}${s}</g>`}function ix(n,o,c){const{end:u}=F.state,p=K0(n),s=n.text===""?"":Mt(c,"dg-mark",p[0],p[1],n.text,oe.regionNote),r=$e(n.x),l=$e(n.y);return n.kind==="start"?`<g data-end="start"><circle class="dg-start" cx="${r}" cy="${l}" r="${n.r}"/>${s}</g>`:n.ghost?`<g data-end="finish" style="${dt(o)}"><circle class="dg-end-x" cx="${r}" cy="${l}" r="${n.r}"/><circle class="dg-end-xi" cx="${r}" cy="${l}" r="${u.inner}"/>${s}</g>`:`<g data-end="finish"><circle class="dg-end" cx="${r}" cy="${l}" r="${n.r}"/><circle class="dg-end-in" cx="${r}" cy="${l}" r="${u.inner}"/>${s}</g>`}function rx(n,o,c){return`<line class="dg-ll" x1="${$e(n)}" y1="${$e(o)}" x2="${$e(n)}" y2="${$e(c)}"/>`}function lx(n,o,c,u=!1){const{m:p}=c;c.traces.push({from:n.from,to:n.to,points:n.points,shown:Vn});const s=fo(n.points),r=Od(n.points),{start:l,drawn:m,end:h}=o,g=u?[[h,{opacity:1},rt.inOut],[h+.4,{opacity:0}],[p.total,{opacity:0}]]:[[h,{opacity:1},rt.inOut],[h+.4,{opacity:.45}],[c.end+.3,{opacity:.45},rt.inOut],[c.end+1,{opacity:.95}],[p.last,{opacity:.95},rt.inOut],[p.total,{opacity:0}]],x=p.kf([[0,{opacity:0,"stroke-dashoffset":1}],[l,{opacity:0,"stroke-dashoffset":1},rt.inOut],[l+.05,{opacity:1}],[m,{"stroke-dashoffset":0}],[p.last,{"stroke-dashoffset":0}],[p.total,{"stroke-dashoffset":1}],...g]),A=p.kf([[0,{opacity:0}],[m-.05,{opacity:0}],[m,{opacity:1}],...g]),w=-(h-m)*26,D=p.kf([[0,{opacity:0,"stroke-dashoffset":0}],[m,{opacity:0,"stroke-dashoffset":0}],[m+.25,{opacity:.9}],[h-.1,{opacity:.9},rt.inOut],[h+.2,{opacity:0,"stroke-dashoffset":w}],[p.total,{opacity:0,"stroke-dashoffset":w}]]),T=u?p.kf([[0,{opacity:0}],[h,{opacity:0},rt.inOut],[h+.4,{opacity:1}],[p.last,{opacity:1},rt.inOut],[p.total,{opacity:0}]]):"";return{base:`<path class="dg-e" d="${s}"/><path class="dg-eh" d="${r}"/>${u?`<path class="dg-e-past dg-a" d="${s}" style="${T}"/><path class="dg-eh-past dg-a" d="${r}" style="${T}"/>`:""}`,lit:`<g style="${dt(n.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${s}" style="${x}"/><path class="dg-eh-on dg-a" d="${r}" style="${A}"/><path class="dg-flow dg-a" d="${s}" style="${D}"/></g>`}}function cx(n,o,c){const u=n.family==="sans"?" dg-capj":"",{radius:p}=F.label,s=o.again?[[o.start,o.end],[o.again.start,o.again.end]]:[[o.start,o.end]];c.ink.push({text:n.text,rect:n,shown:s,boxed:!0}),o.after&&c.ink.push({text:n.text,rect:va(n.text,n.x+n.w/2,n.y+n.h/2+F.baseline.label,n.family==="sans"?oe.labelJa:oe.label,"middle"),shown:[[o.after.start,o.after.end]]});const r=$e(n.x+n.w/2),l=$e(n.y+n.h/2+F.baseline.label),m=o.after?`<g class="dg-cap-past${n.family==="sans"?" dg-cap-pastj":""} dg-a" style="${c.m.vis(o.after.start,o.after.end)}"><text x="${r}" y="${l}" text-anchor="middle">${$t(n.text)}</text></g>`:"",h=s.map(([g,x])=>`<g class="dg-cap${u} dg-a" style="${dt(n.color)};${c.m.rise(g,x,!0)}"><rect x="${$e(n.x)}" y="${$e(n.y)}" width="${$e(n.w)}" height="${n.h}" rx="${p}"/><text x="${r}" y="${l}" text-anchor="middle">${$t(n.text)}</text></g>`);return`${m}${h.join("")}`}function r0(n,o,c,u,p){const s=p?[[o,c],[p.start,p.end]]:[[o,c]];return u.ink.push({text:n.text,rect:n,shown:s,boxed:!0}),s.map(([r,l])=>`<g class="dg-act dg-a" style="${dt(n.color)};${u.m.rise(r,l,!0)}"><rect x="${$e(n.x)}" y="${$e(n.y)}" width="${$e(n.w)}" height="${n.h}" rx="${F.action.radius}"/><text x="${$e(n.x+n.w/2)}" y="${$e(n.y+n.h/2+F.baseline.action)}" text-anchor="middle">${$t(n.text)}</text></g>`).join("")}function ux(n,o){const c=F.carrier;if(n.carry.kind==="coin")return`<circle class="dg-coin" r="${c.coinR}"/><circle class="dg-coin-in" r="${c.coinIn}"/>`;if(n.carry.kind==="tag"){const u=n.carry.text,p=Un(u),s=Pe(u,p?oe.carrierJa:oe.carrier)+c.tagPadX*2;return`<rect class="dg-car" x="${$e(-s/2)}" y="${-18/2}" width="${$e(s)}" height="${c.tagH}" rx="${c.tagH/2}" ${o}/><text class="dg-car-t${p?" dg-car-tj":""}" y="${F.baseline.carrier}" text-anchor="middle">${$t(u)}</text>`}return`<rect class="dg-env" x="${-24/2}" y="${-17/2}" width="${c.envW}" height="${c.envH}" rx="3" ${o}/><path class="dg-env-in" d="M -8 -4.5 L 0 1.5 L 8 -4.5"/>`}var dx=n=>n<.5?4*n*n*n:1-(-2*n+2)**3/2;function ug(n,o,c){const{m:u}=c,p=F.carrier.samples,s=n.wait?[n.wait,...n.points]:n.points,r=Nl(s),{depart:l,arrive:m,start:h,end:g}=o,x=[];for(let V=0;V<=p;V++){const[J,X]=xs(s,dx(V/p)*r);x.push([l+(m-l)*V/p,J,X])}const A=x[0],w=x[x.length-1],D=n.settle??[w[1],w[2]],T=[[0,A[1],A[2]],...x];n.settle&&T.push([Math.min(m+.3,Math.max(g,m+.01)),D[0],D[1]]),T.push([g,D[0],D[1]],[u.total,D[0],D[1]]);const[B,N]=xi(n.carry),M=n.carry.kind==="tag"?n.carry.text:n.carry.kind==="coin"?"硬貨":"封筒",z=n.carry.kind==="tag"?{}:{part:{kind:n.carry.kind==="coin"?"coin":"envelope"}},ae=V=>({x:V[0]-B,y:V[1]-N,w:B*2,h:N*2});l>h&&c.ink.push({text:M,rect:ae([A[1],A[2]]),shown:[[h,l]],boxed:!0,...z}),c.ink.push({text:M,rect:ae(D),shown:[[m,g]],boxed:!0,...z});const le=g<u.last?.05:.18;return`<g class="dg-a" style="${u.move(T,u.blink(h+.02,g,le))}">${ux(n,c.sh)}</g>`}function px(n,o,c=!1){const{m:u}=o,p=o.t.steps[n.step],s=p.start,r=p.end,{r:l,ring:m}=F.badge,h={visibility:"visible"},g={visibility:"hidden"},x=n.until===void 0?void 0:o.t.steps[n.until].start,A=x!==void 0&&x<=r+1e-6,w=u.kf([[0,{opacity:0,transform:"scale(.5)",...g}],[s,{opacity:0,transform:"scale(.5)",...g},rt.pop],[s+.35,{opacity:1,transform:"scale(1)",...h}],[r,{opacity:1,transform:"scale(1)",...h},rt.inOut],[r+(A?Ge.untilFade:.4),{opacity:0,transform:"scale(1)",...g}],[u.total,{opacity:0,transform:"scale(.5)",...g}]]),D=x??u.last,T=A?u.kf([[0,{opacity:0,...g}],[u.total,{opacity:0,...g}]]):u.kf([[0,{opacity:0,...g}],[r,{opacity:0,...g},rt.inOut],[r+.4,{opacity:1,...h}],[D,{opacity:1,...h},rt.inOut],...x===void 0?[]:[[x+Ge.untilFade,{opacity:0,...g}]],[u.total,{opacity:0,...g}]]),B=u.kf([[0,{opacity:0,transform:"scale(1)"}],[s+.05,{opacity:0,transform:"scale(1)"}],[s+.1,{opacity:.7,transform:"scale(1)"},rt.out],[s+.9,{opacity:0,transform:"scale(2.3)"}],[u.total,{opacity:0,transform:"scale(1)"}]]),N=$e(n.x),M=$e(n.y),z=$e(n.y+F.baseline.badge),ae=n.step+1;return o.ink.push({text:String(ae),rect:{x:n.x-l,y:n.y-l,w:l*2,h:l*2},shown:[[s,D]],boxed:!0,badge:!0}),`<g class="dg-bd" data-step="${n.step}" style="${dt(n.color)}"><circle class="dg-bdr dg-popc dg-a" cx="${N}" cy="${M}" r="${m}" style="${B}"/><g class="dg-a" style="${T}"><circle class="${c?"dg-bdp-g":"dg-bdp"}" cx="${N}" cy="${M}" r="${m}"/><text class="${c?"dg-bdpt-g":"dg-bdpt"}" x="${N}" y="${z}" text-anchor="middle">${ae}</text></g><g class="dg-popc dg-a" style="${w}"><circle class="dg-bdf" cx="${N}" cy="${M}" r="${l}"/><text class="dg-bdft" x="${N}" y="${z}" text-anchor="middle">${ae}</text></g></g>`}function hx(n,o,c,u=!1,p=new Map,s){const{m:r,sh:l}=c,m=F.strip,h=n.y+m.h/2,g=[`<rect class="dg-strip" x="${$e(n.x+.5)}" y="${$e(n.y+.5)}" width="${$e(n.w-1)}" height="${$e(n.h-1)}" rx="${F.region.radius}" ${l}/>`,`<g style="${dt("slate")}"><rect class="dg-bi" x="${$e(n.x+m.pad)}" y="${$e(h-m.icon/2)}" width="${m.icon}" height="${m.icon}" rx="${F.box.iconRadius}"/>${ks("env",n.x+m.pad+m.icon/2,h,.78)}</g>`,Mt(c.ink,"dg-sh",n.x+m.titleX,h+F.baseline.stripTitle,n.title,oe.stripTitle)];if(n.fields.forEach((x,A)=>{const w=n.fields[A-1];if(w&&w.y===x.y){const M=x.x-m.fieldGap/2;g.push(`<line class="dg-sep" x1="${$e(M)}" y1="${$e(x.y+m.sepInset)}" x2="${$e(M)}" y2="${$e(x.y+m.h-m.sepInset)}"/>`)}g.push(Mt(c.ink,"dg-fl",x.x,x.y+m.nameY,x.name,oe.fieldName));const D=s?.(x);if(D!==void 0){g.push(D);return}const T=o.get(x.name)??[],B=T.filter(M=>M.value!==void 0),N=T.filter(M=>M.tag!==void 0);B.forEach((M,z)=>{const ae=B[z+1]?.at,le=M.value,V=Un(le)?"dg-fvj":"dg-fv";c.ink.push({text:le,rect:va(le,x.x,x.y+m.valueY,Un(le)?oe.fieldValueJa:oe.fieldValue),shown:[[M.at,ae===void 0?Number.POSITIVE_INFINITY:ae-Ge.untilFade]]});const J=ye=>`<text class="${ye}" x="${$e(x.x)}" y="${$e(x.y+m.valueY)}">${$t(le)}</text>`,X=J(V);if(!u){const ye=ae===void 0?r.rise(M.at):r.rise(M.at,ae-Ge.untilFade);g.push(`<g class="dg-a" style="${ye}">${X}</g>`);return}const W=Math.min(M.until,ae??M.until),re=`<circle class="dg-fl-now" cx="${$e(x.x+Pe(x.name,oe.fieldName)+m.now.gap)}" cy="${$e(x.y+m.nameY-oe.fieldName.size/3)}" r="${m.now.r}"/>`;g.push(`<g class="dg-fv-now dg-a" data-step="${M.step}" style="${dt(M.color)};${r.rise(M.at,W-Ge.untilFade)}">${J(`${V} dg-fv-c`)}${re}</g>`),(ae===void 0||ae>W)&&g.push(`<g class="dg-a" style="${r.vis(W-Ge.untilFade,ae===void 0?r.last:ae-Ge.untilFade)}">${X}</g>`)}),N.forEach((M,z)=>{const ae=N[z+1]?.at,le=M.tag,V=[...B].reverse().find(re=>re.at<=M.at+1e-9)?.value,J=x.x+(V?Pe(V,Un(V)?oe.fieldValueJa:oe.fieldValue)+m.tagGap:0),X=Pe(le,oe.tag)+m.tagPadX*2,W=x.y+m.valueY-m.tagH/2-F.baseline.tag;c.ink.push({text:le,rect:{x:J,y:W,w:X,h:m.tagH},shown:[[M.at,ae===void 0?Number.POSITIVE_INFINITY:ae-Ge.untilFade]],boxed:!0}),g.push(`<g class="dg-tg dg-popc dg-a" style="${dt(M.color)};${ae===void 0?r.pop(M.at):r.pop(M.at,ae-Ge.untilFade)}"><rect x="${$e(J)}" y="${$e(W)}" width="${$e(X)}" height="${m.tagH}" rx="${m.tagH/2}"/><text x="${$e(J+X/2)}" y="${$e(W+m.tagH/2+F.baseline.tag)}" text-anchor="middle">${$t(le)}</text></g>`)})}),n.trail){const x=n.trail,A=n.fields[n.fields.length-1];if(A&&A.y===x.y){const D=x.x-m.fieldGap/2;g.push(`<line class="dg-sep" x1="${$e(D)}" y1="${$e(x.y+m.sepInset)}" x2="${$e(D)}" y2="${$e(x.y+m.h-m.sepInset)}"/>`)}g.push(Mt(c.ink,"dg-fl",x.x,x.y+m.nameY,x.title,oe.fieldName));const w=x.y+m.valueY-oe.fieldValue.size/3;x.states.forEach((D,T)=>{const B=$e(x.x+m.trail.r+T*m.trail.step),N=p.get(D.box),M=N===void 0?"":`<circle class="dg-tr-fill dg-a" cx="${B}" cy="${$e(w)}" r="${m.trail.r}" style="${r.pop(N)}"/>`;g.push(`<g data-trail="${$t(D.box)}" style="${dt(D.color)}"><circle class="dg-tr-ring" cx="${B}" cy="${$e(w)}" r="${m.trail.r}"/>${M}</g>`)})}return g.join("")}var Wn=n=>Math.round(n*100)/100,l0=n=>[n.x+n.w/2,n.y+n.h/2];function fx(n,o){const c=F.carrier,u=Un(n),p=Pe(n,u?oe.carrierJa:oe.carrier)+c.tagPadX*2;return`<rect class="dg-car" x="${Wn(-p/2)}" y="${-18/2}" width="${Wn(p)}" height="${c.tagH}" rx="${c.tagH/2}" ${o}/><text class="dg-car-t${u?" dg-car-tj":""}" y="${F.baseline.carrier}" text-anchor="middle">${$t(n)}</text>`}function mx(n,o,c,u){const{m:p}=u,s=F.git,r=(w,D)=>c.edges.find(T=>T.step===w&&T.event===D),l=n.links.map(w=>{const D=r(w.step,w.event);if(!D)return"";u.traces.push({from:w.from,to:w.to,points:w.points,shown:[[D.start,Number.POSITIVE_INFINITY]]});const T=fo(w.points);if(w.kind==="copy")return`<g style="${dt(w.color)}"><path class="dg-git-cp dg-a" d="${T}" style="${p.vis(D.start,p.last)}"/></g>`;const B=p.kf([[0,{opacity:0,"stroke-dashoffset":1}],[D.start,{opacity:0,"stroke-dashoffset":1},rt.inOut],[D.start+.05,{opacity:1}],[D.drawn,{"stroke-dashoffset":0}],[p.last,{opacity:1,"stroke-dashoffset":0},rt.inOut],[p.total,{opacity:0,"stroke-dashoffset":0}]]);return`<g style="${dt(w.color)}"><path class="dg-git-l dg-a" pathLength="1" d="${T}" style="${B}"/></g>`}).join(""),m=n.commits.map(w=>{const D=r(w.step,w.event)?.drawn??0,T={x:w.cx-w.r,y:w.cy-w.r,w:w.r*2,h:w.r*2};u.ink.push({text:w.id,rect:T,shown:[[D,Number.POSITIVE_INFINITY]],boxed:!0});const B=(w.text?.lines??[]).map((V,J)=>{const X=J===0&&w.hash!==void 0,W=w.text?.baselines[J]??w.cy;return Mt(u.ink,X?"dg-git-h":"dg-git-n",w.cx,W,V,X?oe.gitHash:oe.gitNote,[[D,Number.POSITIVE_INFINITY]],"middle")}).join(""),N=`<text class="dg-git-id" x="${Wn(w.cx)}" y="${Wn(w.cy+F.baseline.badge)}" text-anchor="middle">${$t(w.id)}</text>`,M=`<g class="dg-popc dg-a" style="${p.pop(D)}"><circle class="dg-git-c" cx="${Wn(w.cx)}" cy="${Wn(w.cy)}" r="${w.r}" ${u.sh}/>${N}</g>`,z=B===""?"":`<g class="dg-a" style="${p.vis(D)}">${B}</g>`,ae=w.orphan===void 0?void 0:r(w.orphan,w.orphanEvent??0)?.drawn,le=ae===void 0?"":`<g class="dg-a" data-orphan="${$t(w.id)}" style="${p.vis(ae,p.last,{f:.5})}"><circle class="dg-git-old" cx="${Wn(w.cx)}" cy="${Wn(w.cy)}" r="${s.orphan}"/><text class="dg-git-oldl" x="${Wn(w.cx)}" y="${Wn(w.cy+F.baseline.badge)}" text-anchor="middle">${$t(w.id)}</text></g>`;return`<g data-commit="${$t(w.id)}" style="${dt(w.color)}">${M}${z}${le}</g>`}).join(""),h=n.moves.flatMap(w=>{const D=r(w.step,w.event);if(!w.line||!D)return[];const T=c.steps[w.step].end;u.traces.push({from:w.ref,to:w.target??w.ref,points:w.line,shown:[[D.start,T+.4]]});const B=p.kf([[0,{opacity:0,"stroke-dashoffset":1}],[D.start,{opacity:0,"stroke-dashoffset":1},rt.inOut],[D.start+.05,{opacity:1}],[D.drawn,{"stroke-dashoffset":0}],[T,{opacity:1},rt.inOut],[T+.4,{opacity:0}],[p.total,{opacity:0,"stroke-dashoffset":0}]]);return[`<g style="${dt(w.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${fo(w.line)}" style="${B}"/></g>`]}).join(""),g=c.carriers.flatMap(w=>{const D=n.moves.find(N=>N.step===w.step&&N.event===w.event&&N.line),T=o.steps[w.step]?.events[w.event];if(!D?.line||T?.type!=="edge")return[];const B={step:w.step,event:w.event,from:D.ref,to:D.target??D.ref,points:D.line,color:D.color,carry:T.carry};return[ug(B,{...w,start:w.depart,end:w.arrive+Ge.fade},u)]}).join(""),A=[...new Set(n.moves.map(w=>w.ref))].map(w=>gx(w,n.moves.filter(D=>D.ref===w),r,u)).join("")+g;return{links:l,lines:h,commits:m,tags:A}}function gx(n,o,c,u){const{m:p}=u,s=[],r=[[0,{opacity:0}]];let l=!1,m;const h=w=>{m&&u.ink.push({text:n,rect:m.rect,shown:[[m.since,w]],boxed:!0}),m=void 0};for(const w of o){const D=c(w.step,w.event);if(!D)continue;const{start:T,drawn:B}=D,N=w.from?l0(w.from):void 0,M=w.to?l0(w.to):void 0;if(h(T),w.carried&&N&&M&&l){s.push([T+Ge.fade,N[0],N[1]],[B-Ge.fade,M[0],M[1]]),r.push([T,{opacity:1},rt.inOut],[T+Ge.fade,{opacity:0}],[B-Ge.fade,{opacity:0},rt.out],[B,{opacity:1}]),m={rect:w.to,since:B};continue}if(N&&s.push([T,N[0],N[1]]),M&&s.push([B,M[0],M[1]]),M&&!l){const z=N?T:B-Ge.fade;r.push([z,{opacity:0},rt.out],[z+Ge.fade,{opacity:1}]),l=!0}else!M&&l&&(r.push([B,{opacity:1},rt.inOut],[B+Ge.untilFade,{opacity:0}]),l=!1);w.to&&(m={rect:w.to,since:B})}if(h(Number.POSITIVE_INFINITY),s.length===0)return"";const g=s[0],x=s[s.length-1];l?r.push([p.last,{opacity:1},rt.inOut],[p.total,{opacity:0}]):r.push([p.total,{opacity:0}]);const A=p.move([[0,g[1],g[2]],...s,[p.total,x[1],x[2]]],r);return`<g class="dg-a" data-ref="${$t(n)}" style="${A}">${fx(n,u.sh)}</g>`}var qe=n=>Math.round(n*100)/100,ms=(n,o)=>Un(o)?`${n} ${n}j`:n,Gr=n=>({...n,family:"sans"});function dg(n){const o=[];for(const c of n){const u=o[o.length-2],p=o[o.length-1];if(u&&p){const s=p[0]===u[0]?Number.NaN:(p[1]-u[1])/(p[0]-u[0]),r=c[0]===p[0]?Number.NaN:(c[1]-p[1])/(c[0]-p[0]);Number.isFinite(s)&&Number.isFinite(r)&&Math.abs(s-r)<1e-9?o[o.length-1]=c:o.push(c)}else o.push(c)}return o}function pg(n,o){const c=n[0];if(!c)return 0;if(o<=c[0])return c[1];for(let u=1;u<n.length;u++){const[p,s]=n[u],[r,l]=n[u-1];if(o<=p)return p===r?s:l+(s-l)*(o-r)/(p-r)}return n[n.length-1][1]}function yx(n,o,c,u,p){const{m:s,ink:r}=u,l=F.time,{axis:m}=n,h=new Map((c.units??[]).map($=>[$.unit,$.passed])),g=($,q)=>c.events.find(G=>G.step===$&&G.event===q)?.at,x=($,q)=>c.edges.find(G=>G.step===$&&G.event===q)?.drawn,A=[],w=[],D=[],T=[],B=Math.min(...n.rows.map($=>$.y)),N=Math.max(...n.rows.map($=>$.y+$.h)),M=new Map;for(const $ of n.wires){const q=x($.step,$.event);q!==void 0&&M.set($.to,Math.min(M.get($.to)??Number.POSITIVE_INFINITY,q))}const z=($,q)=>{const G=n.zoom?.columns.find(S=>S.unit===q)?.boxes.find(S=>S.id===$),R=[h.get(q),G?M.get(G):void 0].filter(S=>S!==void 0);return R.length>0?Math.min(...R):void 0};for(const $ of n.periods)$.index%2===1&&A.push(`<rect class="dg-tm-ep" x="${qe($.x)}" y="${qe(B-l.shade)}" width="${qe($.w)}" height="${qe(N-B+l.shade*2)}" rx="4"/>`);if(n.zoom){const $=n.zoom;$.columns.forEach((q,G)=>{G>0&&A.push(`<line class="dg-tm-sep" x1="${qe(q.x)}" y1="${qe(q.y+l.sep)}" x2="${qe(q.x)}" y2="${qe(q.y+q.h-l.sep)}"/>`),A.push(Mt(r,ms("dg-tm-hd",q.head),q.x+q.w/2,$.headY,q.head,oe.timeHead,Vn,"middle"));for(const R of q.boxes)D.push(ae(R,q.unit))})}function ae($,q){const G=[...new Set(n.wires.filter(K=>K.from===$||K.to===$).map(K=>K.step))].sort((K,pe)=>K-pe),R=K=>`<rect class="${K}" x="${qe($.x)}" y="${qe($.y)}" width="${qe($.w)}" height="${$.h}" rx="${F.box.radius}"/>`;if($.empty){const K=h.get(q),pe=n.zoom?.empty??"",_e=K===void 0?"":`<g class="dg-a" style="${s.vis(K)}">${R("dg-tm-ex")}${Mt(r,"dg-tm-ext",$.cx,$.cy+F.baseline.mark,pe,oe.emptyText,[[K,Number.POSITIVE_INFINITY]],"middle")}</g>`;return`<g data-empty="${$t($.id)}">${R("dg-tm-ph")}${_e}</g>`}const S=sg(o.boxes.find(K=>K.id===$.id)?.link,cg($,u,G,p.get($.id)??[]));if(!$.row)return S;const H=z($.row,q);return H===void 0?R("dg-tm-ph"):`<g class="dg-a" style="${s.until(H)}">${R("dg-tm-ph")}</g><g class="dg-popc dg-a" style="${s.pop(H)}">${S}</g>`}for(const $ of n.rows){const q=[];for(const G of n.marks.filter(R=>R.row===$.id)){const R=(H,K="")=>`<rect class="${H}" x="${qe(G.x)}" y="${qe(G.y)}" width="${qe(G.w)}" height="${qe(G.h)}" rx="${l.markRadius}"${K}/>`;if(q.push(R("dg-tm-slot")),G.empty){const H=h.get(G.unit);H!==void 0&&q.push(`<circle class="dg-tm-x dg-a" cx="${qe(G.x+G.w/2)}" cy="${qe(G.y+G.h/2)}" r="${l.emptyR}" style="${s.vis(H,s.last,{f:.2})}"/>`);continue}const S=z($.id,G.unit);S!==void 0&&q.push(R("dg-tm-m dg-a",` style="${s.vis(S,s.last,{f:.2})}"`)),G.colors.forEach((H,K)=>{const pe=g(H.step,H.event);if(pe===void 0)return;const _e=G.colors[K+1],De=_e?g(_e.step,_e.event):void 0;q.push(`<g style="${dt(H.color)}">${R("dg-tm-m dg-a",` style="${s.vis(pe,De??s.last,{f:.35})}"`)}</g>`)})}A.push(`<g data-row="${$t($.id)}" style="${dt($.color)}">${q.join("")}</g>`),A.push(Mt(r,"dg-tm-rn",F.margin+F.region.inset,$.y+$.h/2+F.baseline.mark,$.name,oe.timeRow))}if(n.zoom){const $=n.zoom,q=n.spans.filter(S=>S.kind==="box"&&S.from<=$.to&&$.from<=S.to).map(S=>g(S.step,S.event)).filter(S=>S!==void 0).sort((S,H)=>S-H)[0],G=$.guides.map(S=>`<path class="dg-tm-gd" d="${fo(S)}"/>`).join(""),R=`<rect class="dg-tm-fr" x="${qe($.frame.x)}" y="${qe($.frame.y)}" width="${qe($.frame.w)}" height="${qe($.frame.h)}" rx="4"/>${G}`;A.push(q===void 0?R:`<g class="dg-a" style="${s.until(q)}">${R}</g>`)}const le=$=>qe(m.x+$*m.unit),V=n.ticks.map($=>`M ${le($.at)} ${qe(m.line-l.major/2)} V ${qe(m.line+l.major/2)}`),J=n.minor.map($=>`M ${le($)} ${qe(m.line-l.minor/2)} V ${qe(m.line+l.minor/2)}`);A.push(`<path class="dg-tm-ax" d="M ${le(0)} ${qe(m.line)} H ${le(m.count)} ${[...V,...J].join(" ")}"/>`);for(const $ of n.ticks)A.push(Mt(r,ms("dg-tm-tk",$.text),$.left,$.y,$.text,oe.timeTick));for(const $ of n.periods)A.push(Mt(r,ms("dg-tm-en",$.name),$.x+$.w/2,$.nameY,$.name,oe.timePeriod,Vn,"middle")),A.push(Mt(r,ms("dg-tm-er",$.range),$.x+$.w/2,$.rangeY,$.range,oe.timeRange,Vn,"middle"));for(const $ of n.spans){const q=g($.step,$.event);if(q===void 0)continue;const G=$.until===void 0?void 0:c.steps[$.until].start,R=[[q,G??Number.POSITIVE_INFINITY]],S=G===void 0?s.vis(q):s.vis(q,G,{within:!0});if($.kind==="bracket"){const[K,pe,_e,De]=[qe($.x+1),qe($.x+$.w-1),qe($.y),qe($.y+$.h)],je=Mt(r,ms("dg-tm-bt",$.text),$.textRect.x+$.textRect.w/2,$.textY,$.text,oe.spanText,R,"middle");A.push(`<g class="dg-a" data-span="${$.step}" style="${dt($.color)};${S}"><path class="dg-tm-br" d="M ${K} ${_e} L ${K} ${De} L ${pe} ${De} L ${pe} ${_e}"/>${je}</g>`);continue}A.push(`<g class="dg-a" data-span="${$.step}" style="${dt($.color)};${S}"><rect class="dg-tm-bx" x="${qe($.x)}" y="${qe($.y)}" width="${qe($.w)}" height="${qe($.h)}" rx="6"/></g>`);const H=$.textRect;r.push({text:$.text,rect:H,shown:R,boxed:!0}),T.push(`<g class="dg-tg dg-popc dg-a" style="${dt($.color)};${G===void 0?s.pop(q):s.pop(q,G)}"><rect x="${qe(H.x)}" y="${qe(H.y)}" width="${qe(H.w)}" height="${H.h}" rx="${H.h/2}"/><text x="${qe(H.x+H.w/2)}" y="${qe($.textY)}" text-anchor="middle">${$t($.text)}</text></g>`)}const X=l.point;for(const $ of n.points){const{cx:q,cy:G,r:R}=$,S=$.changes.map(ze=>g(ze.step,ze.event)??Number.POSITIVE_INFINITY),H=S[0];A.push(`<path class="dg-tm-con" d="M ${qe(q)} ${qe(N+3)} L ${qe(q)} ${qe(G-R-2)}"/>`);const K=$.text.x,pe=Mt(r,ms("dg-tm-pn",$.id),K,G+X.nameY,$.id,oe.pointName),_e=pe.replace(/class="([^"]*)"/u,'class="$1 dg-tm-pn-g"'),De=H===void 0||!Number.isFinite(H)?_e:`<g class="dg-a" style="${s.until(H)}">${_e}</g><g class="dg-a" style="${s.vis(H)}">${pe}</g>`,je=$.changes.map((ze,Ze)=>{const U=S[Ze];if(!Number.isFinite(U))return"";const ke=S[Ze+1],Ne=ke!==void 0&&Number.isFinite(ke)?ke-Ge.untilFade:void 0,Z=Mt(r,ms("dg-tm-ps",ze.text),K,G+X.stateY,ze.text,oe.pointState,[[U,Ne??Number.POSITIVE_INFINITY]]);return`<g class="dg-a" style="${dt(ze.color??"slate")};${Ne===void 0?s.rise(U):s.rise(U,Ne)}">${Z}</g>`}).join(""),Le=$.changes.map((ze,Ze)=>{const U=S[Ze];return!ze.color||!Number.isFinite(U)?"":`<g class="dg-popc dg-a" style="${dt(ze.color)};${s.pop(U)}"><circle class="dg-tm-pc" cx="${qe(q)}" cy="${qe(G)}" r="${R+.5}"/>${ks("flag",q,G,X.glyph,"dg-tm-pcg")}</g>`}).join("");D.push(`<g data-point="${$t($.id)}"><circle class="dg-tm-pg" cx="${qe(q)}" cy="${qe(G)}" r="${R}"/>${ks("flag",q,G,X.glyph,"dg-tm-pgl")}${Le}${De}${je}</g>`)}const W=new Set(n.wires.map($=>`${$.step}/${$.event}`));for(const $ of n.edges){if(W.has(`${$.step}/${$.event}`))continue;const q=c.edges.find(S=>S.step===$.step&&S.event===$.event);if(!q)continue;u.traces.push({from:$.from,to:$.to,points:$.points,shown:[[q.start,Number.POSITIVE_INFINITY]]});const G=s.kf([[0,{opacity:0,"stroke-dashoffset":1}],[q.start,{opacity:0,"stroke-dashoffset":1},rt.inOut],[q.start+.05,{opacity:1}],[q.drawn,{"stroke-dashoffset":0}],[s.last,{opacity:1,"stroke-dashoffset":0},rt.inOut],[s.total,{opacity:0,"stroke-dashoffset":0}]]),R=s.kf([[0,{opacity:0}],[q.drawn-.05,{opacity:0}],[q.drawn,{opacity:1}],[s.last,{opacity:1},rt.inOut],[s.total,{opacity:0}]]);w.push(`<g data-link="${$t(`${$.from}->${$.to}`)}" style="${dt($.color)}"><path class="dg-tm-ln dg-a" pathLength="1" d="${fo($.points)}" style="${G}"/><path class="dg-eh-on dg-a" d="${Od($.points)}" style="${R}"/></g>`)}const re=c.needle??[],ye=dg(re.filter(([$])=>$<s.total)),he=ye[ye.length-1]?.[1]??0,me=[...ye.map(([$,q])=>[$,m.x+q*m.unit,0]),[s.last,m.x+he*m.unit,0],[s.total,m.x,0]],{y1:Oe,y2:xe}=n.needle,C=l.needle;return T.push(`<g class="dg-a" data-needle="" style="${s.move(me)}"><line class="dg-tm-nd" x1="0" y1="${qe(Oe)}" x2="0" y2="${qe(xe)}"/><path class="dg-tm-nh" d="M ${-6*.75} ${qe(Oe-C.head)} L ${C.head*.75} ${qe(Oe-C.head)} L 0 ${qe(Oe)} Z"/><circle class="dg-tm-nh" cy="${qe(m.line)}" r="${C.dot}"/></g>`),{base:A.join(""),lit:w.join(""),node:D.join(""),top:T.join("")}}function bx(n,o,c){const{m:u}=c,p=F.time.meter,{x:s,w:r,line:l,text:m}=n.meter,h=n.y+p.y,g=u.kf([...dg(o).map(([A,w])=>[A,{transform:`scaleX(${qe(w*1e3)/1e3})`}]),[u.last,{transform:`scaleX(${qe(pg(o,u.last)*1e3)/1e3})`},rt.inOut],[u.total,{transform:"scaleX(0)"}]]),x=s+r*l;return`<rect class="dg-tm-mt" x="${qe(s)}" y="${qe(h)}" width="${qe(r)}" height="${p.h}" rx="${p.h/2}"/><rect class="dg-tm-mf dg-a" x="${qe(s)}" y="${qe(h)}" width="${qe(r)}" height="${p.h}" rx="${p.h/2}" style="${dt(p.color)};${g}"/><line class="dg-tm-mk" x1="${qe(x)}" y1="${qe(h-p.mark)}" x2="${qe(x)}" y2="${qe(h+p.h+p.mark)}"/>`+Mt(c.ink,"dg-tm-ml",x,n.y+p.textY,m,oe.meterLine,Vn,"middle")}function vx(n,o,c,u,p,s){const r=o.steps[c],l=pg(o.needle??[],r.end-Ge.still),m=n.axis.x+l*n.axis.unit,h=Math.min(...n.rows.map(T=>T.y)),g=Math.max(...n.rows.map(T=>T.y+T.h));let x={x:m-1,y:h,w:2,h:g-h};const A=n.badges.find(T=>T.step===c),w=T=>Math.hypot(Math.max(0,T.x-m,m-T.x-T.w),Math.max(0,T.y-h,h-T.y-T.h)),D=[...A?[{x:A.x-F.badge.r,y:A.y-F.badge.r,w:F.badge.r*2,h:F.badge.r*2}]:[],...[...u].sort((T,B)=>w(T)-w(B))];for(const T of D){const B=Math.min(x.x,T.x),N=Math.min(x.y,T.y),M={x:B,y:N,w:Math.max(x.x+x.w,T.x+T.w)-B,h:Math.max(x.y+x.h,T.y+T.h)-N};M.w<=p&&M.h<=s&&(x=M)}return x}var c0=n=>Math.round(n*100)/100,xx=class{constructor(n,o,c){this.prefix=n,this.total=o,this.last=c}prefix;total;last;frames=[];count=0;pct(n){return+(Math.min(Math.max(n,0),this.total)/this.total*100).toFixed(3)}kf(n){const o=`${this.prefix}-${this.count++}`,c=new Map;for(const[p,s,r]of[...n].sort((l,m)=>l[0]-m[0])){const l=this.pct(p),m=c.get(l)??{props:{}};Object.assign(m.props,s),r&&(m.ease=r),c.set(l,m)}const u=[...c].map(([p,{props:s,ease:r}])=>{const l=Object.entries(s).map(([m,h])=>`${m}:${h}`);return r&&l.push(`animation-timing-function:${r}`),`${p}%{${l.join(";")}}`}).join("");return this.frames.push(`@keyframes ${o}{${u}}`),`animation-name:${o}`}vis(n,o=this.last,c={}){const u=c.f??Ge.fade,p=c.on??{},s=c.off??{},r=c.within?Math.max(n+u,o-u):o;return this.kf([[0,{opacity:0,...s}],[n,{opacity:0,...s},c.ein??rt.out],[n+u,{opacity:1,...p}],[r,{opacity:1,...p},rt.inOut],[Math.min(r+u,this.total),{opacity:0,...s}],[this.total,{opacity:0,...s}]])}rise(n,o=this.last,c=!1){return this.vis(n,o,{on:{transform:"translateY(0)"},off:{transform:`translateY(${F.rise}px)`},within:c})}pop(n,o=this.last){return this.vis(n,o,{f:Ge.popFade,ein:rt.pop,on:{transform:"scale(1)"},off:{transform:`scale(${F.popFrom})`}})}until(n){const o=Ge.untilFade;return this.kf([[0,{opacity:1}],[n,{opacity:1},rt.inOut],[n+o,{opacity:0}],[this.last,{opacity:0}],[this.total,{opacity:1}]])}move(n,o=[]){return this.kf(n.map(([c,u,p,s=1,r])=>[c,{transform:`translate(${c0(u)}px,${c0(p)}px) scale(${s})`},r]).concat(o))}blink(n,o,c){return[[0,{opacity:0}],[n-.01,{opacity:0}],[n,{opacity:1}],[o,{opacity:1}],[o+c,{opacity:0}],[this.total,{opacity:0}]]}},Ve=n=>`font:${n.weight} ${n.size}px var(--${n.family})`,on=(n,o="var(--surf)")=>`color-mix(in srgb,var(--c) ${n}%,${o})`,Xe=F.stroke,Tt=F.mix,Ju=`color-mix(in srgb,var(--mute) ${Tt.past}%,var(--bg))`,wx=[".dg{display:block;width:100%;height:auto;overflow:visible}",".dg .dg-a{animation-duration:var(--T);animation-timing-function:linear;animation-iteration-count:infinite;animation-fill-mode:both;animation-delay:calc(var(--at,0) * -1s);animation-play-state:var(--play,running)}",".dg .dg-popc{transform-box:fill-box;transform-origin:center}",".dg-bg{fill:var(--bg)}",".dg-band{fill:color-mix(in srgb,var(--c) var(--tint),var(--bg));stroke:color-mix(in srgb,var(--c) var(--edge),transparent)}",`.dg-bi{fill:${on(Tt.regionIcon)};stroke:${on(Tt.regionIconEdge,"transparent")}}`,`.dg-bz{${Ve(oe.regionName)};fill:var(--ct)}`,`.dg-bx{${Ve(oe.regionNote)};fill:var(--mute)}`,".dg-st{fill:var(--surf);stroke:var(--hair)}",`.dg-halo{fill:none;stroke:var(--c);stroke-width:${Xe.halo};stroke-opacity:.16}`,`.dg-on{fill:none;stroke:var(--c);stroke-width:${Xe.on}}`,`.dg-ic{fill:${on(Tt.icon)}}`,`.dg-slot{fill:none;stroke:${on(Tt.slot,"transparent")};stroke-width:${Xe.slot};stroke-dasharray:3 3}`,`.dg-gl{fill:none;stroke:var(--c);stroke-width:${Xe.glyph};stroke-linecap:round;stroke-linejoin:round}`,`.dg-sn{${Ve(oe.boxName)};fill:var(--ink)}`,`.dg-ss{${Ve(oe.boxSub)};fill:var(--mute)}`,`.dg-ss-ok{${Ve(oe.boxSubStrong)};fill:var(--ct)}`,`.dg-ss-act{${Ve(oe.boxSubStrong)};fill:var(--ink)}`,`.dg-ll{stroke:var(--line);stroke-width:${Xe.lifeline};stroke-dasharray:3 4}`,`.dg-e{fill:none;stroke:var(--line);stroke-width:${Xe.edge};stroke-linecap:round;stroke-dasharray:0 ${F.edge.ghostDash}}`,`.dg-eh{fill:none;stroke:var(--line);stroke-width:${Xe.arrow};stroke-linecap:round;stroke-linejoin:round}`,`.dg-e-on{fill:none;stroke:var(--c);stroke-width:${Xe.edgeOn};stroke-linecap:round;stroke-dasharray:1 2}`,`.dg-eh-on{fill:none;stroke:var(--c);stroke-width:${Xe.edgeOn};stroke-linecap:round;stroke-linejoin:round}`,`.dg-flow{fill:none;stroke:var(--surf);stroke-width:${Xe.flow};stroke-linecap:round;stroke-dasharray:1.5 ${F.edge.flowDash}}`,`.dg-e-past{fill:none;stroke:${Ju};stroke-width:${Xe.edge};stroke-linecap:round}`,`.dg-eh-past{fill:none;stroke:${Ju};stroke-width:${Xe.arrow};stroke-linecap:round;stroke-linejoin:round}`,".dg-bd{cursor:pointer}",".dg-bdf{fill:var(--c)}",`.dg-bdft{${Ve(oe.badge)};fill:var(--on-c)}`,`.dg-bdr{fill:none;stroke:var(--c);stroke-width:${Xe.badgeRing};pointer-events:none}`,`.dg-bdp{fill:${on(Tt.badgePast)};stroke:${on(Tt.badgePastEdge,"transparent")};stroke-width:${Xe.hair}}`,`.dg-bdpt{${Ve(oe.badge)};fill:var(--ct)}`,`.dg-bdp-g{fill:var(--surf);stroke:${Ju};stroke-width:${Xe.hair}}`,`.dg-bdpt-g{${Ve(oe.badge)};fill:var(--mute)}`,`.dg-cap rect,.dg-act rect{fill:${on(Tt.cap)};stroke:${on(Tt.capEdge,"transparent")}}`,`.dg-cap text{${Ve(oe.label)};fill:var(--ct)}`,`.dg-capj text{${Ve(oe.labelJa)}}`,`.dg-cap-past text{${Ve(oe.label)};fill:var(--mute);fill-opacity:${F.state.pastLabel}}`,`.dg-cap-pastj text{${Ve(oe.labelJa)}}`,`.dg-act text{${Ve(oe.action)};fill:var(--ct)}`,".dg-car{fill:var(--carry,var(--ink))}",`.dg-car-t{${Ve(oe.carrier)};fill:var(--bg)}`,`.dg-car-tj{${Ve(oe.carrierJa)}}`,`.dg-env{fill:var(--carry,var(--ink));stroke:var(--surf);stroke-width:${Xe.envelope}}`,`.dg-env-in{fill:none;stroke:var(--surf);stroke-width:${Xe.flow};stroke-linejoin:round;stroke-linecap:round}`,".dg-coin{fill:var(--coin);stroke:var(--surf);stroke-width:1.2}",".dg-coin-in{fill:none;stroke:var(--coinin);stroke-width:1.1}",".dg-strip{fill:var(--surf);stroke:var(--hair)}",`.dg-sep{stroke:var(--hair);stroke-width:${Xe.hair}}`,`.dg-sh{${Ve(oe.stripTitle)};fill:var(--ink)}`,`.dg-fl{${Ve(oe.fieldName)};fill:var(--mute)}`,`.dg-fv{${Ve(oe.fieldValue)};fill:var(--ink)}`,`.dg-fvj{${Ve(oe.fieldValueJa)};fill:var(--ink)}`,".dg-fv-c{fill:var(--ct)}",".dg-fl-now{fill:var(--c)}",`.dg-tr-ring{fill:none;stroke:var(--line);stroke-width:${Xe.trail}}`,".dg-tr-fill{fill:var(--c)}",".dg-tg rect{fill:var(--c)}",`.dg-tg text{${Ve(oe.tag)};fill:var(--on-c)}`,`.dg-side{fill:color-mix(in srgb,var(--c) ${Tt.side}%,var(--bg));stroke:${on(Tt.sideEdge,"transparent")};stroke-dasharray:4 4}`,`.dg-side-t{${Ve(oe.regionName)};fill:var(--ct)}`,`.dg-side-n{${Ve(oe.regionNote)};fill:var(--mute)}`,`.dg-ghost{fill:var(--surf);stroke:${on(Tt.ghostEdge,"transparent")};stroke-dasharray:4 3}`,`.dg-path{fill:none;stroke:${on(Tt.path,"transparent")};stroke-width:${Xe.path};stroke-linecap:round;stroke-dasharray:0 ${F.edge.ghostDash}}`,`.dg-path-h{fill:none;stroke:${on(Tt.path,"transparent")};stroke-width:${Xe.arrow};stroke-linecap:round;stroke-linejoin:round}`,`.dg-path-t{${Ve(oe.label)};fill:var(--ct)}`,`.dg-path-tj{${Ve(oe.labelJa)}}`,".dg-start{fill:var(--ink)}",`.dg-end{fill:var(--bg);stroke:var(--ink);stroke-width:${Xe.end}}`,".dg-end-in{fill:var(--ink)}",`.dg-end-x{fill:var(--bg);stroke:${on(Tt.path,"transparent")};stroke-width:${Xe.arrow};stroke-dasharray:2 2.5}`,`.dg-end-xi{fill:${on(Tt.path,"transparent")}}`,`.dg-mark{${Ve(oe.regionNote)};fill:var(--mute)}`,`.dg-done{fill:var(--ink);stroke:var(--surf);stroke-width:${Xe.done}}`,`.dg-done-ck{fill:none;stroke:var(--surf);stroke-width:${Xe.glyph};stroke-linecap:round;stroke-linejoin:round}`,`.dg-git-l{fill:none;stroke:var(--c);stroke-width:${Xe.git};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,`.dg-git-cp{fill:none;stroke:var(--c);stroke-width:${Xe.gitOrphan};stroke-linecap:round;stroke-dasharray:3 3;stroke-opacity:.7}`,`.dg-git-c{fill:var(--surf);stroke:var(--c);stroke-width:${Xe.git}}`,`.dg-git-id{${Ve(oe.gitId)};fill:var(--ct)}`,`.dg-git-h{${Ve(oe.gitHash)};fill:var(--mute)}`,`.dg-git-n{${Ve(oe.gitNote)};fill:var(--ink2)}`,`.dg-git-old{fill:var(--surf);stroke:var(--c);stroke-width:${Xe.gitOrphan};stroke-dasharray:3 3;stroke-opacity:.6}`,`.dg-git-oldl{${Ve(oe.gitId)};fill:var(--ct);opacity:.55}`,`.dg-tm-ep{fill:color-mix(in srgb,var(--ink) ${Tt.timeShade}%,transparent)}`,`.dg-tm-sep{stroke:var(--hair);stroke-width:${Xe.hair};stroke-dasharray:2 4}`,`.dg-tm-hd{${Ve(oe.timeHead)};fill:var(--ink)}`,`.dg-tm-hdj{${Ve(Gr(oe.timeHead))}}`,`.dg-tm-slot{fill:none;stroke:var(--line);stroke-width:${Xe.timeSlot};opacity:.55}`,".dg-tm-m{fill:var(--c)}",".dg-tm-x{fill:var(--c-slate)}",`.dg-tm-fr{fill:none;stroke:var(--c-blue);stroke-width:${Xe.timeFrame};stroke-dasharray:3 2}`,`.dg-tm-gd{fill:none;stroke:color-mix(in srgb,var(--c-blue) ${Tt.timeGuide}%,transparent);stroke-width:${Xe.hair};stroke-dasharray:2 3}`,`.dg-tm-ax{fill:none;stroke:var(--line);stroke-width:${Xe.timeAxis}}`,`.dg-tm-tk{${Ve(oe.timeTick)};fill:var(--mute)}`,`.dg-tm-tkj{${Ve(Gr(oe.timeTick))}}`,`.dg-tm-en{${Ve(oe.timePeriod)};fill:var(--ink2)}`,`.dg-tm-er{${Ve(oe.timeRange)};fill:var(--mute)}`,`.dg-tm-erj{${Ve(Gr(oe.timeRange))}}`,`.dg-tm-rn{${Ve(oe.timeRow)};fill:var(--ink2)}`,`.dg-tm-br{fill:none;stroke:var(--c);stroke-width:${Xe.timeSpan};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tm-bt{${Ve(oe.spanText)};fill:var(--ct)}`,`.dg-tm-bx{fill:color-mix(in srgb,var(--c) ${Tt.timeSpan}%,transparent);stroke:var(--c);stroke-width:${Xe.timeSpan};stroke-dasharray:4 3}`,`.dg-tm-con{fill:none;stroke:var(--line);stroke-width:${Xe.timeDrop};stroke-linecap:round;stroke-dasharray:0 3.5}`,".dg-tm-pg{fill:var(--surf);stroke:var(--line);stroke-dasharray:2 2.5}",`.dg-tm-pgl{fill:none;stroke:var(--mute);stroke-width:${Xe.timeFlag};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tm-pc{fill:var(--surf);stroke:var(--c);stroke-width:${Xe.timePoint}}`,`.dg-tm-pcg{fill:none;stroke:var(--c);stroke-width:${Xe.timeFlag};stroke-linecap:round;stroke-linejoin:round}`,`.dg-tm-pn{${Ve(oe.pointName)};fill:var(--ink)}`,`.dg-tm-pnj{${Ve(Gr(oe.pointName))}}`,".dg-tm-pn-g{fill:var(--mute)}",`.dg-tm-ps{${Ve(oe.pointState)};fill:var(--ct)}`,`.dg-tm-ln{fill:none;stroke:var(--c);stroke-width:${Xe.edgeOn};stroke-linecap:round;stroke-dasharray:1 2}`,`.dg-tm-nd{stroke:var(--ink);stroke-width:${Xe.timeNeedle};opacity:.55}`,".dg-tm-nh{fill:var(--ink)}",".dg-tm-ph{fill:none;stroke:var(--line);stroke-dasharray:3 3}",`.dg-tm-ex{fill:color-mix(in srgb,var(--c-slate) ${Tt.timeEmpty}%,var(--surf));stroke:var(--c-slate);stroke-width:${Xe.timeFrame};stroke-dasharray:3 3}`,`.dg-tm-ext{${Ve(oe.emptyText)};fill:var(--t-slate)}`,".dg-tm-mt{fill:var(--hair)}",".dg-tm-mf{fill:var(--c);transform-box:fill-box;transform-origin:0 50%}",`.dg-tm-mk{stroke:var(--ink2);stroke-width:${Xe.timeMeter}}`,`.dg-tm-ml{${Ve(oe.meterLine)};fill:var(--ink2)}`,".dg-vp-bg{fill:var(--bg)}",".dg-vp-frame{fill:none;stroke:var(--hair)}",".dg-hd-bg{fill:var(--bg)}",".dg-mm-bg{fill:var(--surf);stroke:var(--hair)}",`.dg-mm-t{${Ve(oe.miniTitle)};fill:var(--mute)}`,".dg-mm-world{fill:var(--sunk);stroke:var(--hair)}",`.dg-mm-band{fill:${on(Tt.miniBand)};stroke:${on(Tt.miniBandEdge,"transparent")};stroke-width:.6}`,`.dg-mm-card{fill:${on(Tt.mini)}}`,`.dg-mm-vp{fill:color-mix(in srgb,var(--ink) ${Tt.view}%,transparent);stroke:var(--ink);stroke-width:${Xe.badgeRing};vector-effect:non-scaling-stroke}`].join("");function kx(n){let o=2166136261;for(let c=0;c<n.length;c++)o^=n.charCodeAt(c),o=Math.imul(o,16777619);return(o>>>0).toString(36)}function Ex(n){const o=new Map,c=(u,p)=>{o.set(u,(o.get(u)??new Set).add(p))};return n.steps.forEach((u,p)=>{for(const s of u.events)s.type==="edge"?(c(s.from,p),c(s.to,p)):(s.type==="action"||s.type==="swap")&&c(s.box,p)}),new Map([...o].map(([u,p])=>[u,[...p].sort((s,r)=>s-r)]))}function Ax(n,o,c){const u=[],{whole:p}=o;let s=0;for(const l of o.events){const m=n.steps[l.step]?.events[l.event];if(m?.type==="swap"&&u.push({t:l.at,order:s++,box:m.box,set:m.text}),c&&m?.type==="action"){u.push({t:l.at,order:s++,box:m.box,act:m.label});const h=o.steps[l.step].end;(!p||h<=p.start)&&u.push({t:h,order:s++,box:m.box,act:null})}}u.sort((l,m)=>l.t-m.t||l.order-m.order);const r=new Map;for(const l of n.boxes){let m=[l.sub??"","dg-ss"],h,g=m.join("|");const x=[],A=u.filter(T=>T.box===l.id),w=[...A].reverse().find(T=>T.set!==void 0||typeof T.act=="string");p&&typeof w?.act=="string"&&A.push({t:p.start,order:s++,box:l.id,act:w.act});for(const T of A){T.set!==void 0&&(m=[T.set,"dg-ss-ok"],h=void 0),T.act!==void 0&&(h=T.act??void 0);const B=h!==void 0?[h,"dg-ss-act"]:m;B.join("|")!==g&&(g=B.join("|"),x.push([T.t,B[0],B[1]]))}const D=x.filter((T,B)=>{const N=x[B+1];return N===void 0||N[0]-T[0]>=Ge.minShow});r.set(l.id,D)}return r}function Sx(n,o,c){const u=new Map;for(const p of o.events){const s=n.steps[p.step]?.events[p.event];if(s?.type!=="strip")continue;const r=c.badges[p.step]?.color??"slate",l=u.get(s.field)??[],m=o.steps[p.step].end;l.push({at:p.at,color:r,step:p.step,until:m,...s.value!==void 0?{value:s.value}:{},...s.tag!==void 0?{tag:s.tag}:{}}),u.set(s.field,l)}return u}function _x(n,o,c){if(n.until===void 0)return o;const{after:u,again:p,...s}=o;if(!u)return s;const r=c[n.until].start;return r>u.start?{...s,after:{start:u.start,end:Math.min(u.end,r)}}:s}function hg(n,o,c,u,p,s,r=[],l=[]){const m=G0(u,p),h=kx(`${JSON.stringify(n)}|${m}|${s?`${s.width}|${s.lang}`:""}`),g=new xx(`dg${h}`,c.total,c.last),x={m:g,t:c,sh:`filter="url(#dg-sh-${h})"`,end:c.steps[c.steps.length-1].end,ink:r,traces:l},A=Ex(n),w=Ax(n,c,o.kind!=="sequence"),D={band:[],base:[],lit:[],node:[],badge:[],top:[]};for(const R of o.regions)D.band.push(ex(R,r));const T=o.boxes.find(R=>R.ghost)?.color??"slate";o.side&&D.band.push(ox(o.side,T,r));const B=(R,S)=>o.boxes.find(H=>H.id===R&&(S===void 0||H.ghost===S))?.color;for(const R of o.paths)D.base.push(sx(R,B(R.to,!0)??B(R.from)??T,r,l));for(const R of o.ends)D.node.push(ix(R,T,r));const N=o.kind==="state",M=new Map((c.states??[]).flatMap(R=>R.lit[0]?[[R.box,R.lit[0].start]]:[])),z=new Map((c.meters??[]).map(R=>[R.field,R.keys])),ae=R=>R.meter?bx({...R,meter:R.meter},z.get(R.name)??[[0,0]],x):void 0;o.strip&&D.band.push(hx(o.strip,Sx(n,c,o),x,N,M,ae));for(const R of o.lifelines)D.base.push(rx(R.x,R.y1,R.y2));if(k1(o)){const R=mx(o,n,c,x);D.base.push(R.links),D.lit.push(R.lines),D.node.push(R.commits),D.top.push(R.tags)}const le=ag(o)?o:void 0;if(le){const R=yx(le,n,c,x,w);D.base.push(R.base),D.lit.push(R.lit),D.node.push(R.node),D.top.push(R.top)}const V=new Set((le?.wires??[]).map(R=>`${R.step}/${R.event}`));for(const R of o.edges){const S=c.edges.find(K=>K.step===R.step&&K.event===R.event);if(!S||le&&!V.has(`${R.step}/${R.event}`))continue;const H=lx(R,S,x,N);D.base.push(H.base),D.lit.push(H.lit)}const J=new Map((c.states??[]).map(R=>[R.box,R])),X=new Map(n.boxes.flatMap(R=>R.link===void 0?[]:[[R.id,R.link]])),W=(R,S)=>sg(X.get(R),S);for(const R of le?[]:o.boxes){if(R.ghost){D.node.push(W(R.id,nx(R,r)));continue}const S=J.get(R.id);D.node.push(W(R.id,cg(R,x,A.get(R.id)??[],w.get(R.id)??[],N?S?.lit??[]:void 0))),S?.done!==void 0&&D.node.push(ax(R,S.done,x))}for(const R of o.badges)D.badge.push(px(R,x,N));for(const R of o.labels){const S=c.labels.find(H=>H.step===R.step&&H.event===R.event);S&&D.top.push(cx(R,_x(R,S,c.steps),x))}const{whole:re}=c;for(const R of o.actions){const S=c.events.find(K=>K.step===R.step&&K.event===R.event);if(!S)continue;const H=c.steps[R.step].end;D.top.push(re&&H>re.start?r0(R,S.at,re.end,x):r0(R,S.at,H,x,re))}for(const R of c.carriers){const S=o.edges.find(H=>H.step===R.step&&H.event===R.event);S&&D.top.push(ug(S,R,x))}const ye=Object.values(D).map(R=>R.join("")).join(""),{near:he,far:me,nearY:Oe,farY:xe}=F.shadow,C=`<filter id="dg-sh-${h}" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="${Oe}" stdDeviation="${he}" style="flood-color:var(--sh);flood-opacity:var(--shA)"/><feDropShadow dx="0" dy="${xe}" stdDeviation="${me}" style="flood-color:var(--sh);flood-opacity:var(--shB)"/></filter>`,$=s&&o.kind==="sequence"?o.boxes.map(R=>W(R.id,tx(R,x,A.get(R.id)??[],w.get(R.id)??[]))).join(""):"",q=s?Nx(o,c,n,g,h,ye,s,$):{body:`<rect class="dg-bg" width="${o.width}" height="${o.height}" rx="${F.region.radius}"/>${ye}`,w:o.width,h:o.height},G=`.dg-${h}{${Y0};--T:${c.total}s;${m}}${wx}${g.frames.join("")}`;return`<svg xmlns="http://www.w3.org/2000/svg" class="dg dg-${h}" viewBox="0 0 ${Math.ceil(q.w)} ${Math.ceil(q.h)}" width="${Math.ceil(q.w)}" height="${Math.ceil(q.h)}" role="img" aria-label="${$t(n.title)}" data-dragon="figure" data-view="${s?"follow":"fixed"}"><style>${G}</style><defs>${C}</defs>${q.body}</svg>`}function fg(n){const o=Math.min(...n.map(u=>u.x)),c=Math.min(...n.map(u=>u.y));return{x:o,y:c,w:Math.max(...n.map(u=>u.x+u.w))-o,h:Math.max(...n.map(u=>u.y+u.h))-c}}function $x(n,o,c){const u=dd(n,o,c);return u.length===0?void 0:fg(u)}function Dx(n,o,c,u){const p=F.badge.r+F.follow.badgeRoom,{x:s,y:r}=n,l=h=>Math.hypot(Math.max(0,h.x-s,s-h.x-h.w),Math.max(0,h.y-r,r-h.y-h.h));let m={x:s-p,y:r-p,w:p*2,h:p*2};for(const h of[...o].sort((g,x)=>l(g)-l(x))){const g=fg([m,h]);g.w<=c&&g.h<=u&&(m=g)}return m}function dd(n,o,c){const u=[];for(const p of n.edges.filter(s=>s.step===c)){const s=p.points.map(l=>l[0]),r=p.points.map(l=>l[1]);u.push({x:Math.min(...s),y:Math.min(...r),w:Math.max(...s)-Math.min(...s),h:Math.max(...r)-Math.min(...r)})}u.push(...n.labels.filter(p=>p.step===c),...n.actions.filter(p=>p.step===c));for(const p of o.steps[c]?.events??[]){const s=p.type==="edge"?[p.from,p.to]:p.type==="action"||p.type==="swap"?[p.box]:[];for(const r of s){const l=n.boxes.find(m=>m.id===r);l&&(n.kind==="architecture"||p.type==="swap")&&u.push(l)}}return u}function Nx(n,o,c,u,p,s,r,l){const m=F.follow,h=F.mini,g=Math.max(1,r.width),x=Math.min(n.width,g),A=Ja[r.lang].overview,w=ke=>{const Ne=Math.min(h.w,x*.4,ke*.4/n.height*n.width),Z=Ne/n.width,Ee=n.height*Z,_=Math.max(Ne,Math.ceil(Pe(A,oe.miniTitle)));return{vh:ke,mw:Ne,k:Z,mh:Ee,bw:_,bgW:_+h.pad*2,bgH:Ee+h.pad*2+h.title,beside:Ee>Ne}},D=w(Math.min(n.height,Math.max(m.minH,x*m.aspect))),T=D.beside&&g<m.narrow,B=r.height===void 0?Number.POSITIVE_INFINITY:D.beside?r.height:r.height-D.bgH-h.inset,{vh:N,mw:M,k:z,mh:ae,bw:le,bgW:V,bgH:J,beside:X}=B<D.vh?w(Math.max(m.fitMinH,B)):{...D,vh:Number.isFinite(B)?Math.min(n.height,B):D.vh},W=X&&!T?Math.min(n.width,g-V-h.inset):x,re=ke=>Math.min(n.width-W/2,Math.max(W/2,ke)),ye=l===""?0:Math.max(...n.boxes.map(ke=>ke.y+ke.h))+m.headRoom,he=l===""?0:m.head.pad*2+m.head.h,me=N-he,Oe=ke=>Math.min(n.height-me/2,Math.max(ye+me/2,ke)),xe=F.badge.r;let C=[n.width/2,n.height/2];const q=o.steps.map((ke,Ne)=>{if(ag(n)){const Y=vx(n,o,Ne,dd(n,c,Ne),W,me);return C=[Y.x+Y.w/2,Y.y+Y.h/2],[re(C[0]),Oe(C[1])]}const Z=$x(n,c,Ne);C=Z?[Z.x+Z.w/2,Z.y+Z.h/2]:C;const Ee=[re(C[0]),Oe(C[1])],_=n.badges.find(Y=>Y.step===Ne);if(!_||Math.abs(_.x-Ee[0])<=W/2-xe&&Math.abs(_.y-Ee[1])<=me/2-xe)return Ee;const P=Dx(_,dd(n,c,Ne),W,me);return C=[P.x+P.w/2,P.y+P.h/2],[re(C[0]),Oe(C[1])]}).map(([ke,Ne])=>[ke,Ne-he/2]),G=q[0],R=[[0,G[0],G[1]],[o.steps[0].start,G[0],G[1]]];q.forEach((ke,Ne)=>{if(Ne===0)return;const Z=q[Ne-1],Ee=o.steps[Ne].start;R.push([Ee,Z[0],Z[1],1,rt.inOut],[Ee+m.ease,ke[0],ke[1]])});const S=q[q.length-1];R.push([o.last,S[0],S[1],1,rt.inOut],[o.total,G[0],G[1]]);const H=u.move(R.map(([ke,Ne,Z,Ee,_])=>[ke,W/2-Ne,N/2-Z,Ee,_])),K=X?W+h.inset:W-V-h.inset,pe=X?0:N+h.inset,_e=K+h.pad,De=_e+(le-M)/2,je=pe+h.pad+h.title,ze=T?{clip:"",body:""}:(()=>{const ke=[...n.regions.map(Z=>`<rect class="dg-mm-band" style="${dt(Z.color)}" x="${De+Z.x*z}" y="${je+Z.y*z}" width="${Z.w*z}" height="${Z.h*z}" rx="3"/>`),...n.boxes.map(Z=>`<rect class="dg-mm-card" style="${dt(Z.color)}" x="${De+Z.x*z}" y="${je+Z.y*z}" width="${Z.w*z}" height="${Z.h*z}" rx="1.5"/>`)].join(""),Ne=u.move(R.map(([Z,Ee,_,,P])=>[Z,De+(Ee-W/2)*z,je+(_-N/2)*z,1,P]));return{clip:`<clipPath id="dg-mm-${p}"><rect x="${De}" y="${je}" width="${M}" height="${ae}" rx="4"/></clipPath>`,body:`<rect class="dg-mm-bg" x="${K}" y="${pe}" width="${V}" height="${J}" rx="${h.radius}"/><text class="dg-mm-t" x="${_e}" y="${je-h.pad+2}">${A}</text><g clip-path="url(#dg-mm-${p})"><rect class="dg-mm-world" x="${De}" y="${je}" width="${M}" height="${ae}"/>${ke}<rect class="dg-mm-vp dg-a"${he===0?"":` y="${he*z}"`} width="${W*z}" height="${(N-he)*z}" rx="2" style="${Ne}"/></g>`}})(),Ze=he===0?"":`<g class="dg-hd"><rect class="dg-hd-bg" width="${W}" height="${he}"/><line class="dg-sep" x1="0" y1="${he}" x2="${W}" y2="${he}"/><g class="dg-a" style="${u.move(R.map(([ke,Ne,,Z,Ee])=>[ke,W/2-Ne,0,Z,Ee]))}">${l}</g></g>`;return{body:`<defs><clipPath id="dg-vp-${p}"><rect width="${W}" height="${N}" rx="${F.region.radius}"/></clipPath>${ze.clip}</defs><g clip-path="url(#dg-vp-${p})"><rect class="dg-vp-bg" width="${W}" height="${N}"/><g class="dg-a" style="${H}">${s}</g>${Ze}</g><rect class="dg-vp-frame" x="0.5" y="0.5" width="${W-1}" height="${N-1}" rx="${F.region.radius}"/>${ze.body}`,w:X&&!T?W+h.inset+V:x,h:X?N:pe+J}}function mg(n,o){const c=_d(n.palette);if(!n.colors)return c;const u=Ja[n.lang??"ja"],p=Object.entries(n.colors).flatMap(([s,r])=>c1(s)?u1(r)?[]:[u.unreadableColor(s)]:[u.unknownColor(s)]);if(p.length>0)throw new Error(u.cannotDraw(p.join(" / ")));return{...c,[o]:{...c[o],...n.colors}}}function Bd(n,o={}){const c=o.lang??"ja",u=wi(n,{lang:c});if(!u.ok)throw new Error(Ja[c].cannotDraw(u.errors.map(r=>`${r.pointer} ${r.message}`).join(" / ")));const p=u.diagram,s=p.kind==="sequence"?C1(p):p.kind==="state"?z1(p,c):p.kind==="git"?$1(p):p.kind==="time"?F1(p,c):g1(p);return Tx(p,s,X1(p,o.still===!0),o)}function Tx(n,o,c,u={}){const p=u.theme==="dark"?"dark":"light",s=mg(u,p),r=[],l=[];return{svg:hg(n,o,c,s,p,void 0,r,l),palette:s.id,theme:p,...n.view?{view:n.view}:{},fonts:{...vi},layout:o,timeline:c,diagram:n,overlaps:K1(r,c.stills,l)}}function u0(n,o,c){const u=Math.max(0,o)/n.layout.width,s=(c===void 0?u:Math.min(u,Math.max(0,c)/n.layout.height))*oe.boxName.size;return n.view?{mode:n.view,textPx:s}:{mode:s>=P0?"fixed":"follow",textPx:s}}var Yr=n=>`font:${n.weight} ${n.size}px var(--${n.family})`,jt=n=>`${n}px`;function Mx(){const n=F.player,o=jt(n.hidden);return[`.dg-player{display:flex;flex-direction:column;gap:${jt(n.gap)};color:var(--ink)}`,`.dg-player .dg-frame{border-radius:${jt(n.radius)};overflow:hidden}`,".dg-bar{container:dg-bar/inline-size}",`.dg-row{display:flex;align-items:flex-start;gap:${jt(n.gap)}}`,`.dg-btns{display:flex;gap:${jt(n.gap/2)};flex:none}`,`.dg-btn{width:${jt(n.button)};height:${jt(n.button)};border-radius:${jt(n.radius)};border:${jt(F.stroke.hair)} solid var(--hair);background:var(--surf);color:var(--ink);${Yr(oe.button)};cursor:pointer}`,`.dg-btn:focus-visible{outline:${jt(n.focus)} solid var(--c-blue);outline-offset:${jt(n.focus)}}`,`.dg-say{display:flex;gap:${jt(n.gap)};min-width:0}`,`.dg-no{${Yr(oe.stepNo)};color:var(--mute);padding-top:${jt(n.focus)}}`,".dg-txt{display:grid;grid-template-columns:minmax(0,1fr);min-width:0}",".dg-txt>*{grid-area:1/1}",".dg-room{visibility:hidden}",`.dg-tt{${Yr(oe.stepTitle)};margin:0}`,`.dg-tb{${Yr(oe.stepBody)};color:var(--ink2);margin:0;white-space:pre-line}`,`.dg-sr{position:absolute;width:${o};height:${o};margin:-${o};padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}`,`@container dg-bar (width < ${jt(n.narrow)}){.dg-row{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;gap:0 ${jt(n.gap)}}.dg-say,.dg-txt,.dg-txt>*{display:contents}.dg-btns{grid-area:1/1;margin-bottom:${jt(n.gap/2)}}.dg-btn{width:${jt(n.touch)};height:${jt(n.touch)}}.dg-no{grid-area:1/2;display:flex;align-items:center;min-height:${jt(n.touch)};padding-top:0}.dg-tt{grid-area:2/1/3/3}.dg-tb{grid-area:3/1/4/3}}`,`@media (pointer: coarse){.dg-btn{width:${jt(n.touch)};height:${jt(n.touch)}}}`,`.dg-spot{fill:none;stroke:var(--t-amber);stroke-width:${jt(F.stroke.mark)};stroke-dasharray:${F.mark.dash} ${F.mark.gap};pointer-events:none}`].join("")}function Cx(n){if(n.getElementById("dragon-player-css"))return;const o=n.createElement("style");o.id="dragon-player-css",o.textContent=Mx(),n.head.appendChild(o)}var ii={prev:"‹",pause:"❚❚",play:"▶",next:"›"},d0="http://www.w3.org/2000/svg",p0=n=>String(n).padStart(2,"0"),Ox=(n,o)=>`${p0(n+1)}/${p0(o)}`;function gg(n,o,c={}){const u=n.ownerDocument,p=u.defaultView,s=!!p?.matchMedia?.("(prefers-reduced-motion: reduce)").matches,r=Bd(o,c),l=c.lang??"ja",m=Ja[l],h=mg(c,r.theme),{timeline:g}=r,x=r.diagram.steps,A=x.length;Cx(u);const w=u.createElement("div");w.className="dg-player",w.dataset.dragon="player",w.setAttribute("style",`${Y0};${G0(h,r.theme)}`);const D=u.createElement("div");D.className="dg-frame";const T=(we,Ae,Te)=>{const Be=u.createElement("button");return Be.type="button",Be.className="dg-btn",Be.dataset.dragon=we,Be.setAttribute("aria-label",Ae),Be.textContent=Te,Be},B=T("prev",m.prev,ii.prev),N=T("toggle",m.pause,ii.pause),M=T("next",m.next,ii.next),z=u.createElement("div");z.className="dg-btns",z.setAttribute("lang",l),z.append(B,N,M);const ae=u.createElement("div");ae.className="dg-say",ae.setAttribute("aria-hidden","true");const le=u.createElement("div");le.className="dg-no",le.dataset.dragon="step-no";const V=u.createElement("div");V.className="dg-txt";const J=u.createElement("p");J.className="dg-tt",J.dataset.dragon="step-title";const X=u.createElement("p");X.className="dg-tb",X.dataset.dragon="step-body";const W=u.createElement("div");W.append(J,X),V.append(W);for(const we of x){const Ae=u.createElement("div");Ae.className="dg-room",Ae.dataset.dragon="caption-room";const Te=u.createElement("p");Te.className="dg-tt",Te.textContent=we.title;const Be=u.createElement("p");Be.className="dg-tb",Be.textContent=we.body,Ae.append(Te,Be),V.append(Ae)}ae.append(le,V);for(const we of[le,J,X])we.setAttribute("aria-hidden","true");const re=u.createElement("div");re.className="dg-row",re.append(z,ae);const ye=u.createElement("div");ye.className="dg-bar",ye.append(re);const he=u.createElement("ol");he.className="dg-sr",he.dataset.dragon="steps",he.setAttribute("aria-label",m.steps(r.diagram.title));for(const we of x){const Ae=u.createElement("li"),Te=u.createElement("strong");Te.textContent=we.title,Ae.append(Te);for(const Be of we.body.split(`
`)){const Ke=u.createElement("p");Ke.textContent=Be,Ae.append(Ke)}if(we.sources){const Be=u.createElement("ul");for(const Ke of we.sources){const gt=u.createElement("a");gt.href=Ke.url,gt.textContent=Ke.name;const Ct=u.createElement("li");Ct.append(gt),Be.append(Ct)}Ae.append(Be)}he.append(Ae)}w.append(D,ye,he),n.append(w);const me=()=>D.clientWidth||n.clientWidth||r.layout.width,Oe=()=>{if(!c.fitHeight||!p)return;const we=p.getComputedStyle(D),Ae=D.clientHeight-(Number.parseFloat(we.paddingTop)||0)-(Number.parseFloat(we.paddingBottom)||0);return Ae>0?Ae:void 0};let xe=u0(r,me(),Oe()).mode,C=me(),$=Oe(),q=null,G=c.pausedAt===void 0?0:Math.min(A-1,Math.max(0,c.pausedAt)),R=!s&&c.pausedAt===void 0,S=R?0:g.stills[G]??0;const H=g.stills[A-1]??0;let K=Date.now(),pe=[];const _e=()=>{if(!q)return;for(const Te of q.querySelectorAll(".dg-spots"))Te.remove();if(pe.length===0)return;const we=F.mark,Ae=u.createElementNS(d0,"g");Ae.setAttribute("class","dg-spots");for(const Te of pe){const Be=u.createElementNS(d0,"rect");Be.setAttribute("class","dg-spot"),Be.setAttribute("x",String(Te.x-we.pad)),Be.setAttribute("y",String(Te.y-we.pad)),Be.setAttribute("width",String(Te.w+we.pad*2)),Be.setAttribute("height",String(Te.h+we.pad*2)),Be.setAttribute("rx",String(we.radius)),Ae.append(Be)}(q.querySelector('g[clip-path^="url(#dg-vp-"] > g.dg-a')??q).append(Ae)},De=we=>{let Ae;if(we!==void 0){const Te=u.createElement("div");Te.innerHTML=we,Ae=Te.querySelector("svg")}else Ae=q?q.cloneNode(!0):null;Ae&&(Ae.setAttribute("aria-hidden","true"),Ae.removeAttribute("role"),Ae.removeAttribute("aria-label"),Ae.style.setProperty("--at",String(S)),Ae.style.setProperty("--play",R?"running":"paused"),Ae.dataset.motion=R?"play":"still",q?q.replaceWith(Ae):D.append(Ae),q=Ae,K=Date.now(),_e())},je=()=>xe==="follow"?hg(r.diagram,r.layout,g,h,r.theme,{width:C,...$===void 0?{}:{height:$},lang:l}):r.svg,Le=()=>R?(S+(Date.now()-K)/1e3)%g.total:S,ze=we=>{let Ae=0;return g.steps.forEach((Te,Be)=>{Te.start<=we&&(Ae=Be)}),Ae},Ze=()=>{const we=x[G];le.textContent=Ox(G,A),J.textContent=we?.title??"",X.textContent=we?.body??"",N.setAttribute("aria-label",R?m.pause:m.play),N.textContent=R?ii.pause:ii.play,c.onStep?.(G)},U=(we,Ae)=>{S=we,R=Ae,De(),Ze()},ke=we=>{G=Math.min(A-1,Math.max(0,we));const Ae=g.steps[G];U(R?Ae.start:g.stills[G]??Ae.start,R)},Ne=()=>{c.playOnce&&S>=H&&(G=0,S=0),U(S,!0)};De(je()),Ze();const Z=p?.setInterval(()=>{if(!R)return;if(c.playOnce&&S+(Date.now()-K)/1e3>=H){G=A-1,U(H,!1);return}const we=ze(Le());we!==G&&(G=we,Ze())},120),Ee=()=>ke(G-1),_=()=>ke(G+1),P=()=>R?U(Le(),!1):Ne(),Y=we=>{const Ae=we.target?.closest?.("[data-step]"),Te=Ae?Number(Ae.getAttribute("data-step")):Number.NaN;Number.isInteger(Te)&&ke(Te)};B.addEventListener("click",Ee),M.addEventListener("click",_),N.addEventListener("click",P),D.addEventListener("click",Y);const be=p?.ResizeObserver,Ce=be?new be(()=>{const we=me(),Ae=Oe(),Te=u0(r,we,Ae).mode;if(Te===xe&&(xe==="fixed"||we===C&&Ae===$))return;const Be=Le();xe=Te,C=we,$=Ae,S=Be,De(je())}):void 0;return Ce?.observe(D),{get step(){return G},get playing(){return R},next:_,prev:Ee,play:()=>{R||Ne()},pause:()=>{R&&U(Le(),!1)},goTo:we=>{R=!1,ke(we)},mark:we=>{pe=we,_e()},destroy:()=>{Z!==void 0&&p?.clearInterval(Z),Ce?.disconnect(),B.removeEventListener("click",Ee),M.removeEventListener("click",_),N.removeEventListener("click",P),D.removeEventListener("click",Y),w.remove()}}}var Ku={exports:{}},Qe={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var h0;function Bx(){if(h0)return Qe;h0=1;var n=Symbol.for("react.transitional.element"),o=Symbol.for("react.portal"),c=Symbol.for("react.fragment"),u=Symbol.for("react.strict_mode"),p=Symbol.for("react.profiler"),s=Symbol.for("react.consumer"),r=Symbol.for("react.context"),l=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),h=Symbol.for("react.memo"),g=Symbol.for("react.lazy"),x=Symbol.for("react.activity"),A=Symbol.iterator;function w(S){return S===null||typeof S!="object"?null:(S=A&&S[A]||S["@@iterator"],typeof S=="function"?S:null)}var D={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},T=Object.assign,B={};function N(S,H,K){this.props=S,this.context=H,this.refs=B,this.updater=K||D}N.prototype.isReactComponent={},N.prototype.setState=function(S,H){if(typeof S!="object"&&typeof S!="function"&&S!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,S,H,"setState")},N.prototype.forceUpdate=function(S){this.updater.enqueueForceUpdate(this,S,"forceUpdate")};function M(){}M.prototype=N.prototype;function z(S,H,K){this.props=S,this.context=H,this.refs=B,this.updater=K||D}var ae=z.prototype=new M;ae.constructor=z,T(ae,N.prototype),ae.isPureReactComponent=!0;var le=Array.isArray;function V(){}var J={H:null,A:null,T:null,S:null},X=Object.prototype.hasOwnProperty;function W(S,H,K){var pe=K.ref;return{$$typeof:n,type:S,key:H,ref:pe!==void 0?pe:null,props:K}}function re(S,H){return W(S.type,H,S.props)}function ye(S){return typeof S=="object"&&S!==null&&S.$$typeof===n}function he(S){var H={"=":"=0",":":"=2"};return"$"+S.replace(/[=:]/g,function(K){return H[K]})}var me=/\/+/g;function Oe(S,H){return typeof S=="object"&&S!==null&&S.key!=null?he(""+S.key):H.toString(36)}function xe(S){switch(S.status){case"fulfilled":return S.value;case"rejected":throw S.reason;default:switch(typeof S.status=="string"?S.then(V,V):(S.status="pending",S.then(function(H){S.status==="pending"&&(S.status="fulfilled",S.value=H)},function(H){S.status==="pending"&&(S.status="rejected",S.reason=H)})),S.status){case"fulfilled":return S.value;case"rejected":throw S.reason}}throw S}function C(S,H,K,pe,_e){var De=typeof S;(De==="undefined"||De==="boolean")&&(S=null);var je=!1;if(S===null)je=!0;else switch(De){case"bigint":case"string":case"number":je=!0;break;case"object":switch(S.$$typeof){case n:case o:je=!0;break;case g:return je=S._init,C(je(S._payload),H,K,pe,_e)}}if(je)return _e=_e(S),je=pe===""?"."+Oe(S,0):pe,le(_e)?(K="",je!=null&&(K=je.replace(me,"$&/")+"/"),C(_e,H,K,"",function(Ze){return Ze})):_e!=null&&(ye(_e)&&(_e=re(_e,K+(_e.key==null||S&&S.key===_e.key?"":(""+_e.key).replace(me,"$&/")+"/")+je)),H.push(_e)),1;je=0;var Le=pe===""?".":pe+":";if(le(S))for(var ze=0;ze<S.length;ze++)pe=S[ze],De=Le+Oe(pe,ze),je+=C(pe,H,K,De,_e);else if(ze=w(S),typeof ze=="function")for(S=ze.call(S),ze=0;!(pe=S.next()).done;)pe=pe.value,De=Le+Oe(pe,ze++),je+=C(pe,H,K,De,_e);else if(De==="object"){if(typeof S.then=="function")return C(xe(S),H,K,pe,_e);throw H=String(S),Error("Objects are not valid as a React child (found: "+(H==="[object Object]"?"object with keys {"+Object.keys(S).join(", ")+"}":H)+"). If you meant to render a collection of children, use an array instead.")}return je}function $(S,H,K){if(S==null)return S;var pe=[],_e=0;return C(S,pe,"","",function(De){return H.call(K,De,_e++)}),pe}function q(S){if(S._status===-1){var H=S._result;H=H(),H.then(function(K){(S._status===0||S._status===-1)&&(S._status=1,S._result=K)},function(K){(S._status===0||S._status===-1)&&(S._status=2,S._result=K)}),S._status===-1&&(S._status=0,S._result=H)}if(S._status===1)return S._result.default;throw S._result}var G=typeof reportError=="function"?reportError:function(S){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var H=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof S=="object"&&S!==null&&typeof S.message=="string"?String(S.message):String(S),error:S});if(!window.dispatchEvent(H))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",S);return}console.error(S)},R={map:$,forEach:function(S,H,K){$(S,function(){H.apply(this,arguments)},K)},count:function(S){var H=0;return $(S,function(){H++}),H},toArray:function(S){return $(S,function(H){return H})||[]},only:function(S){if(!ye(S))throw Error("React.Children.only expected to receive a single React element child.");return S}};return Qe.Activity=x,Qe.Children=R,Qe.Component=N,Qe.Fragment=c,Qe.Profiler=p,Qe.PureComponent=z,Qe.StrictMode=u,Qe.Suspense=m,Qe.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=J,Qe.__COMPILER_RUNTIME={__proto__:null,c:function(S){return J.H.useMemoCache(S)}},Qe.cache=function(S){return function(){return S.apply(null,arguments)}},Qe.cacheSignal=function(){return null},Qe.cloneElement=function(S,H,K){if(S==null)throw Error("The argument must be a React element, but you passed "+S+".");var pe=T({},S.props),_e=S.key;if(H!=null)for(De in H.key!==void 0&&(_e=""+H.key),H)!X.call(H,De)||De==="key"||De==="__self"||De==="__source"||De==="ref"&&H.ref===void 0||(pe[De]=H[De]);var De=arguments.length-2;if(De===1)pe.children=K;else if(1<De){for(var je=Array(De),Le=0;Le<De;Le++)je[Le]=arguments[Le+2];pe.children=je}return W(S.type,_e,pe)},Qe.createContext=function(S){return S={$$typeof:r,_currentValue:S,_currentValue2:S,_threadCount:0,Provider:null,Consumer:null},S.Provider=S,S.Consumer={$$typeof:s,_context:S},S},Qe.createElement=function(S,H,K){var pe,_e={},De=null;if(H!=null)for(pe in H.key!==void 0&&(De=""+H.key),H)X.call(H,pe)&&pe!=="key"&&pe!=="__self"&&pe!=="__source"&&(_e[pe]=H[pe]);var je=arguments.length-2;if(je===1)_e.children=K;else if(1<je){for(var Le=Array(je),ze=0;ze<je;ze++)Le[ze]=arguments[ze+2];_e.children=Le}if(S&&S.defaultProps)for(pe in je=S.defaultProps,je)_e[pe]===void 0&&(_e[pe]=je[pe]);return W(S,De,_e)},Qe.createRef=function(){return{current:null}},Qe.forwardRef=function(S){return{$$typeof:l,render:S}},Qe.isValidElement=ye,Qe.lazy=function(S){return{$$typeof:g,_payload:{_status:-1,_result:S},_init:q}},Qe.memo=function(S,H){return{$$typeof:h,type:S,compare:H===void 0?null:H}},Qe.startTransition=function(S){var H=J.T,K={};J.T=K;try{var pe=S(),_e=J.S;_e!==null&&_e(K,pe),typeof pe=="object"&&pe!==null&&typeof pe.then=="function"&&pe.then(V,G)}catch(De){G(De)}finally{H!==null&&K.types!==null&&(H.types=K.types),J.T=H}},Qe.unstable_useCacheRefresh=function(){return J.H.useCacheRefresh()},Qe.use=function(S){return J.H.use(S)},Qe.useActionState=function(S,H,K){return J.H.useActionState(S,H,K)},Qe.useCallback=function(S,H){return J.H.useCallback(S,H)},Qe.useContext=function(S){return J.H.useContext(S)},Qe.useDebugValue=function(){},Qe.useDeferredValue=function(S,H){return J.H.useDeferredValue(S,H)},Qe.useEffect=function(S,H){return J.H.useEffect(S,H)},Qe.useEffectEvent=function(S){return J.H.useEffectEvent(S)},Qe.useId=function(){return J.H.useId()},Qe.useImperativeHandle=function(S,H,K){return J.H.useImperativeHandle(S,H,K)},Qe.useInsertionEffect=function(S,H){return J.H.useInsertionEffect(S,H)},Qe.useLayoutEffect=function(S,H){return J.H.useLayoutEffect(S,H)},Qe.useMemo=function(S,H){return J.H.useMemo(S,H)},Qe.useOptimistic=function(S,H){return J.H.useOptimistic(S,H)},Qe.useReducer=function(S,H,K){return J.H.useReducer(S,H,K)},Qe.useRef=function(S){return J.H.useRef(S)},Qe.useState=function(S){return J.H.useState(S)},Qe.useSyncExternalStore=function(S,H,K){return J.H.useSyncExternalStore(S,H,K)},Qe.useTransition=function(){return J.H.useTransition()},Qe.version="19.2.7",Qe}var f0;function jd(){return f0||(f0=1,Ku.exports=Bx()),Ku.exports}var Me=jd(),Wu={exports:{}},ri={},Iu={exports:{}},ed={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var m0;function jx(){return m0||(m0=1,(function(n){function o(C,$){var q=C.length;C.push($);e:for(;0<q;){var G=q-1>>>1,R=C[G];if(0<p(R,$))C[G]=$,C[q]=R,q=G;else break e}}function c(C){return C.length===0?null:C[0]}function u(C){if(C.length===0)return null;var $=C[0],q=C.pop();if(q!==$){C[0]=q;e:for(var G=0,R=C.length,S=R>>>1;G<S;){var H=2*(G+1)-1,K=C[H],pe=H+1,_e=C[pe];if(0>p(K,q))pe<R&&0>p(_e,K)?(C[G]=_e,C[pe]=q,G=pe):(C[G]=K,C[H]=q,G=H);else if(pe<R&&0>p(_e,q))C[G]=_e,C[pe]=q,G=pe;else break e}}return $}function p(C,$){var q=C.sortIndex-$.sortIndex;return q!==0?q:C.id-$.id}if(n.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var s=performance;n.unstable_now=function(){return s.now()}}else{var r=Date,l=r.now();n.unstable_now=function(){return r.now()-l}}var m=[],h=[],g=1,x=null,A=3,w=!1,D=!1,T=!1,B=!1,N=typeof setTimeout=="function"?setTimeout:null,M=typeof clearTimeout=="function"?clearTimeout:null,z=typeof setImmediate<"u"?setImmediate:null;function ae(C){for(var $=c(h);$!==null;){if($.callback===null)u(h);else if($.startTime<=C)u(h),$.sortIndex=$.expirationTime,o(m,$);else break;$=c(h)}}function le(C){if(T=!1,ae(C),!D)if(c(m)!==null)D=!0,V||(V=!0,he());else{var $=c(h);$!==null&&xe(le,$.startTime-C)}}var V=!1,J=-1,X=5,W=-1;function re(){return B?!0:!(n.unstable_now()-W<X)}function ye(){if(B=!1,V){var C=n.unstable_now();W=C;var $=!0;try{e:{D=!1,T&&(T=!1,M(J),J=-1),w=!0;var q=A;try{t:{for(ae(C),x=c(m);x!==null&&!(x.expirationTime>C&&re());){var G=x.callback;if(typeof G=="function"){x.callback=null,A=x.priorityLevel;var R=G(x.expirationTime<=C);if(C=n.unstable_now(),typeof R=="function"){x.callback=R,ae(C),$=!0;break t}x===c(m)&&u(m),ae(C)}else u(m);x=c(m)}if(x!==null)$=!0;else{var S=c(h);S!==null&&xe(le,S.startTime-C),$=!1}}break e}finally{x=null,A=q,w=!1}$=void 0}}finally{$?he():V=!1}}}var he;if(typeof z=="function")he=function(){z(ye)};else if(typeof MessageChannel<"u"){var me=new MessageChannel,Oe=me.port2;me.port1.onmessage=ye,he=function(){Oe.postMessage(null)}}else he=function(){N(ye,0)};function xe(C,$){J=N(function(){C(n.unstable_now())},$)}n.unstable_IdlePriority=5,n.unstable_ImmediatePriority=1,n.unstable_LowPriority=4,n.unstable_NormalPriority=3,n.unstable_Profiling=null,n.unstable_UserBlockingPriority=2,n.unstable_cancelCallback=function(C){C.callback=null},n.unstable_forceFrameRate=function(C){0>C||125<C?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):X=0<C?Math.floor(1e3/C):5},n.unstable_getCurrentPriorityLevel=function(){return A},n.unstable_next=function(C){switch(A){case 1:case 2:case 3:var $=3;break;default:$=A}var q=A;A=$;try{return C()}finally{A=q}},n.unstable_requestPaint=function(){B=!0},n.unstable_runWithPriority=function(C,$){switch(C){case 1:case 2:case 3:case 4:case 5:break;default:C=3}var q=A;A=C;try{return $()}finally{A=q}},n.unstable_scheduleCallback=function(C,$,q){var G=n.unstable_now();switch(typeof q=="object"&&q!==null?(q=q.delay,q=typeof q=="number"&&0<q?G+q:G):q=G,C){case 1:var R=-1;break;case 2:R=250;break;case 5:R=1073741823;break;case 4:R=1e4;break;default:R=5e3}return R=q+R,C={id:g++,callback:$,priorityLevel:C,startTime:q,expirationTime:R,sortIndex:-1},q>G?(C.sortIndex=q,o(h,C),c(m)===null&&C===c(h)&&(T?(M(J),J=-1):T=!0,xe(le,q-G))):(C.sortIndex=R,o(m,C),D||w||(D=!0,V||(V=!0,he()))),C},n.unstable_shouldYield=re,n.unstable_wrapCallback=function(C){var $=A;return function(){var q=A;A=$;try{return C.apply(this,arguments)}finally{A=q}}}})(ed)),ed}var g0;function zx(){return g0||(g0=1,Iu.exports=jx()),Iu.exports}var td={exports:{}},cn={};/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var y0;function Rx(){if(y0)return cn;y0=1;var n=jd();function o(m){var h="https://react.dev/errors/"+m;if(1<arguments.length){h+="?args[]="+encodeURIComponent(arguments[1]);for(var g=2;g<arguments.length;g++)h+="&args[]="+encodeURIComponent(arguments[g])}return"Minified React error #"+m+"; visit "+h+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function c(){}var u={d:{f:c,r:function(){throw Error(o(522))},D:c,C:c,L:c,m:c,X:c,S:c,M:c},p:0,findDOMNode:null},p=Symbol.for("react.portal");function s(m,h,g){var x=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:p,key:x==null?null:""+x,children:m,containerInfo:h,implementation:g}}var r=n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function l(m,h){if(m==="font")return"";if(typeof h=="string")return h==="use-credentials"?h:""}return cn.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=u,cn.createPortal=function(m,h){var g=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!h||h.nodeType!==1&&h.nodeType!==9&&h.nodeType!==11)throw Error(o(299));return s(m,h,null,g)},cn.flushSync=function(m){var h=r.T,g=u.p;try{if(r.T=null,u.p=2,m)return m()}finally{r.T=h,u.p=g,u.d.f()}},cn.preconnect=function(m,h){typeof m=="string"&&(h?(h=h.crossOrigin,h=typeof h=="string"?h==="use-credentials"?h:"":void 0):h=null,u.d.C(m,h))},cn.prefetchDNS=function(m){typeof m=="string"&&u.d.D(m)},cn.preinit=function(m,h){if(typeof m=="string"&&h&&typeof h.as=="string"){var g=h.as,x=l(g,h.crossOrigin),A=typeof h.integrity=="string"?h.integrity:void 0,w=typeof h.fetchPriority=="string"?h.fetchPriority:void 0;g==="style"?u.d.S(m,typeof h.precedence=="string"?h.precedence:void 0,{crossOrigin:x,integrity:A,fetchPriority:w}):g==="script"&&u.d.X(m,{crossOrigin:x,integrity:A,fetchPriority:w,nonce:typeof h.nonce=="string"?h.nonce:void 0})}},cn.preinitModule=function(m,h){if(typeof m=="string")if(typeof h=="object"&&h!==null){if(h.as==null||h.as==="script"){var g=l(h.as,h.crossOrigin);u.d.M(m,{crossOrigin:g,integrity:typeof h.integrity=="string"?h.integrity:void 0,nonce:typeof h.nonce=="string"?h.nonce:void 0})}}else h==null&&u.d.M(m)},cn.preload=function(m,h){if(typeof m=="string"&&typeof h=="object"&&h!==null&&typeof h.as=="string"){var g=h.as,x=l(g,h.crossOrigin);u.d.L(m,g,{crossOrigin:x,integrity:typeof h.integrity=="string"?h.integrity:void 0,nonce:typeof h.nonce=="string"?h.nonce:void 0,type:typeof h.type=="string"?h.type:void 0,fetchPriority:typeof h.fetchPriority=="string"?h.fetchPriority:void 0,referrerPolicy:typeof h.referrerPolicy=="string"?h.referrerPolicy:void 0,imageSrcSet:typeof h.imageSrcSet=="string"?h.imageSrcSet:void 0,imageSizes:typeof h.imageSizes=="string"?h.imageSizes:void 0,media:typeof h.media=="string"?h.media:void 0})}},cn.preloadModule=function(m,h){if(typeof m=="string")if(h){var g=l(h.as,h.crossOrigin);u.d.m(m,{as:typeof h.as=="string"&&h.as!=="script"?h.as:void 0,crossOrigin:g,integrity:typeof h.integrity=="string"?h.integrity:void 0})}else u.d.m(m)},cn.requestFormReset=function(m){u.d.r(m)},cn.unstable_batchedUpdates=function(m,h){return m(h)},cn.useFormState=function(m,h,g){return r.H.useFormState(m,h,g)},cn.useFormStatus=function(){return r.H.useHostTransitionStatus()},cn.version="19.2.7",cn}var b0;function qx(){if(b0)return td.exports;b0=1;function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(o){console.error(o)}}return n(),td.exports=Rx(),td.exports}/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var v0;function Hx(){if(v0)return ri;v0=1;var n=zx(),o=jd(),c=qx();function u(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var a=2;a<arguments.length;a++)t+="&args[]="+encodeURIComponent(arguments[a])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function p(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function s(e){var t=e,a=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(a=t.return),e=t.return;while(e)}return t.tag===3?a:null}function r(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function l(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function m(e){if(s(e)!==e)throw Error(u(188))}function h(e){var t=e.alternate;if(!t){if(t=s(e),t===null)throw Error(u(188));return t!==e?null:e}for(var a=e,i=t;;){var d=a.return;if(d===null)break;var f=d.alternate;if(f===null){if(i=d.return,i!==null){a=i;continue}break}if(d.child===f.child){for(f=d.child;f;){if(f===a)return m(d),e;if(f===i)return m(d),t;f=f.sibling}throw Error(u(188))}if(a.return!==i.return)a=d,i=f;else{for(var y=!1,E=d.child;E;){if(E===a){y=!0,a=d,i=f;break}if(E===i){y=!0,i=d,a=f;break}E=E.sibling}if(!y){for(E=f.child;E;){if(E===a){y=!0,a=f,i=d;break}if(E===i){y=!0,i=f,a=d;break}E=E.sibling}if(!y)throw Error(u(189))}}if(a.alternate!==i)throw Error(u(190))}if(a.tag!==3)throw Error(u(188));return a.stateNode.current===a?e:t}function g(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=g(e),t!==null)return t;e=e.sibling}return null}var x=Object.assign,A=Symbol.for("react.element"),w=Symbol.for("react.transitional.element"),D=Symbol.for("react.portal"),T=Symbol.for("react.fragment"),B=Symbol.for("react.strict_mode"),N=Symbol.for("react.profiler"),M=Symbol.for("react.consumer"),z=Symbol.for("react.context"),ae=Symbol.for("react.forward_ref"),le=Symbol.for("react.suspense"),V=Symbol.for("react.suspense_list"),J=Symbol.for("react.memo"),X=Symbol.for("react.lazy"),W=Symbol.for("react.activity"),re=Symbol.for("react.memo_cache_sentinel"),ye=Symbol.iterator;function he(e){return e===null||typeof e!="object"?null:(e=ye&&e[ye]||e["@@iterator"],typeof e=="function"?e:null)}var me=Symbol.for("react.client.reference");function Oe(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===me?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case T:return"Fragment";case N:return"Profiler";case B:return"StrictMode";case le:return"Suspense";case V:return"SuspenseList";case W:return"Activity"}if(typeof e=="object")switch(e.$$typeof){case D:return"Portal";case z:return e.displayName||"Context";case M:return(e._context.displayName||"Context")+".Consumer";case ae:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case J:return t=e.displayName||null,t!==null?t:Oe(e.type)||"Memo";case X:t=e._payload,e=e._init;try{return Oe(e(t))}catch{}}return null}var xe=Array.isArray,C=o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,$=c.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,q={pending:!1,data:null,method:null,action:null},G=[],R=-1;function S(e){return{current:e}}function H(e){0>R||(e.current=G[R],G[R]=null,R--)}function K(e,t){R++,G[R]=e.current,e.current=t}var pe=S(null),_e=S(null),De=S(null),je=S(null);function Le(e,t){switch(K(De,t),K(_e,e),K(pe,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?rm(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=rm(t),e=lm(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}H(pe),K(pe,e)}function ze(){H(pe),H(_e),H(De)}function Ze(e){e.memoizedState!==null&&K(je,e);var t=pe.current,a=lm(t,e.type);t!==a&&(K(_e,e),K(pe,a))}function U(e){_e.current===e&&(H(pe),H(_e)),je.current===e&&(H(je),ti._currentValue=q)}var ke,Ne;function Z(e){if(ke===void 0)try{throw Error()}catch(a){var t=a.stack.trim().match(/\n( *(at )?)/);ke=t&&t[1]||"",Ne=-1<a.stack.indexOf(`
    at`)?" (<anonymous>)":-1<a.stack.indexOf("@")?"@unknown:0:0":""}return`
`+ke+e+Ne}var Ee=!1;function _(e,t){if(!e||Ee)return"";Ee=!0;var a=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var i={DetermineComponentFrameRoot:function(){try{if(t){var ge=function(){throw Error()};if(Object.defineProperty(ge.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(ge,[])}catch(ie){var ne=ie}Reflect.construct(e,[],ge)}else{try{ge.call()}catch(ie){ne=ie}e.call(ge.prototype)}}else{try{throw Error()}catch(ie){ne=ie}(ge=e())&&typeof ge.catch=="function"&&ge.catch(function(){})}}catch(ie){if(ie&&ne&&typeof ie.stack=="string")return[ie.stack,ne.stack]}return[null,null]}};i.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var d=Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot,"name");d&&d.configurable&&Object.defineProperty(i.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var f=i.DetermineComponentFrameRoot(),y=f[0],E=f[1];if(y&&E){var j=y.split(`
`),te=E.split(`
`);for(d=i=0;i<j.length&&!j[i].includes("DetermineComponentFrameRoot");)i++;for(;d<te.length&&!te[d].includes("DetermineComponentFrameRoot");)d++;if(i===j.length||d===te.length)for(i=j.length-1,d=te.length-1;1<=i&&0<=d&&j[i]!==te[d];)d--;for(;1<=i&&0<=d;i--,d--)if(j[i]!==te[d]){if(i!==1||d!==1)do if(i--,d--,0>d||j[i]!==te[d]){var ue=`
`+j[i].replace(" at new "," at ");return e.displayName&&ue.includes("<anonymous>")&&(ue=ue.replace("<anonymous>",e.displayName)),ue}while(1<=i&&0<=d);break}}}finally{Ee=!1,Error.prepareStackTrace=a}return(a=e?e.displayName||e.name:"")?Z(a):""}function P(e,t){switch(e.tag){case 26:case 27:case 5:return Z(e.type);case 16:return Z("Lazy");case 13:return e.child!==t&&t!==null?Z("Suspense Fallback"):Z("Suspense");case 19:return Z("SuspenseList");case 0:case 15:return _(e.type,!1);case 11:return _(e.type.render,!1);case 1:return _(e.type,!0);case 31:return Z("Activity");default:return""}}function Y(e){try{var t="",a=null;do t+=P(e,a),a=e,e=e.return;while(e);return t}catch(i){return`
Error generating stack: `+i.message+`
`+i.stack}}var be=Object.prototype.hasOwnProperty,Ce=n.unstable_scheduleCallback,we=n.unstable_cancelCallback,Ae=n.unstable_shouldYield,Te=n.unstable_requestPaint,Be=n.unstable_now,Ke=n.unstable_getCurrentPriorityLevel,gt=n.unstable_ImmediatePriority,Ct=n.unstable_UserBlockingPriority,Ie=n.unstable_NormalPriority,zt=n.unstable_LowPriority,Xt=n.unstable_IdlePriority,Qt=n.log,wn=n.unstable_setDisableYieldValue,Wt=null,Rt=null;function rn(e){if(typeof Qt=="function"&&wn(e),Rt&&typeof Rt.setStrictMode=="function")try{Rt.setStrictMode(Wt,e)}catch{}}var It=Math.clz32?Math.clz32:O,b=Math.log,k=Math.LN2;function O(e){return e>>>=0,e===0?32:31-(b(e)/k|0)|0}var se=256,I=262144,ce=4194304;function Se(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&261888;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function ve(e,t,a){var i=e.pendingLanes;if(i===0)return 0;var d=0,f=e.suspendedLanes,y=e.pingedLanes;e=e.warmLanes;var E=i&134217727;return E!==0?(i=E&~f,i!==0?d=Se(i):(y&=E,y!==0?d=Se(y):a||(a=E&~e,a!==0&&(d=Se(a))))):(E=i&~f,E!==0?d=Se(E):y!==0?d=Se(y):a||(a=i&~e,a!==0&&(d=Se(a)))),d===0?0:t!==0&&t!==d&&(t&f)===0&&(f=d&-d,a=t&-t,f>=a||f===32&&(a&4194048)!==0)?t:d}function Re(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function ht(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function kt(){var e=ce;return ce<<=1,(ce&62914560)===0&&(ce=4194304),e}function ot(e){for(var t=[],a=0;31>a;a++)t.push(e);return t}function Dt(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function Es(e,t,a,i,d,f){var y=e.pendingLanes;e.pendingLanes=a,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=a,e.entangledLanes&=a,e.errorRecoveryDisabledLanes&=a,e.shellSuspendCounter=0;var E=e.entanglements,j=e.expirationTimes,te=e.hiddenUpdates;for(a=y&~a;0<a;){var ue=31-It(a),ge=1<<ue;E[ue]=0,j[ue]=-1;var ne=te[ue];if(ne!==null)for(te[ue]=null,ue=0;ue<ne.length;ue++){var ie=ne[ue];ie!==null&&(ie.lane&=-536870913)}a&=~ge}i!==0&&Fd(e,i,0),f!==0&&d===0&&e.tag!==0&&(e.suspendedLanes|=f&~(y&~t))}function Fd(e,t,a){e.pendingLanes|=t,e.suspendedLanes&=~t;var i=31-It(t);e.entangledLanes|=t,e.entanglements[i]=e.entanglements[i]|1073741824|a&261930}function Gd(e,t){var a=e.entangledLanes|=t;for(e=e.entanglements;a;){var i=31-It(a),d=1<<i;d&t|e[i]&t&&(e[i]|=t),a&=~d}}function Yd(e,t){var a=t&-t;return a=(a&42)!==0?1:Cl(a),(a&(e.suspendedLanes|t))!==0?0:a}function Cl(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Ol(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function Pd(){var e=$.p;return e!==0?e:(e=window.event,e===void 0?32:Mm(e.type))}function Vd(e,t){var a=$.p;try{return $.p=e,t()}finally{$.p=a}}var ka=Math.random().toString(36).slice(2),en="__reactFiber$"+ka,hn="__reactProps$"+ka,As="__reactContainer$"+ka,Bl="__reactEvents$"+ka,Hg="__reactListeners$"+ka,Ug="__reactHandles$"+ka,Xd="__reactResources$"+ka,go="__reactMarker$"+ka;function jl(e){delete e[en],delete e[hn],delete e[Bl],delete e[Hg],delete e[Ug]}function Ss(e){var t=e[en];if(t)return t;for(var a=e.parentNode;a;){if(t=a[As]||a[en]){if(a=t.alternate,t.child!==null||a!==null&&a.child!==null)for(e=mm(e);e!==null;){if(a=e[en])return a;e=mm(e)}return t}e=a,a=e.parentNode}return null}function _s(e){if(e=e[en]||e[As]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function yo(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(u(33))}function $s(e){var t=e[Xd];return t||(t=e[Xd]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function Jt(e){e[go]=!0}var Qd=new Set,Zd={};function Wa(e,t){Ds(e,t),Ds(e+"Capture",t)}function Ds(e,t){for(Zd[e]=t,e=0;e<t.length;e++)Qd.add(t[e])}var Lg=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Jd={},Kd={};function Fg(e){return be.call(Kd,e)?!0:be.call(Jd,e)?!1:Lg.test(e)?Kd[e]=!0:(Jd[e]=!0,!1)}function Ni(e,t,a){if(Fg(t))if(a===null)e.removeAttribute(t);else{switch(typeof a){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var i=t.toLowerCase().slice(0,5);if(i!=="data-"&&i!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,""+a)}}function Ti(e,t,a){if(a===null)e.removeAttribute(t);else{switch(typeof a){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,""+a)}}function ea(e,t,a,i){if(i===null)e.removeAttribute(a);else{switch(typeof i){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(a);return}e.setAttributeNS(t,a,""+i)}}function Tn(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Wd(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Gg(e,t,a){var i=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof i<"u"&&typeof i.get=="function"&&typeof i.set=="function"){var d=i.get,f=i.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return d.call(this)},set:function(y){a=""+y,f.call(this,y)}}),Object.defineProperty(e,t,{enumerable:i.enumerable}),{getValue:function(){return a},setValue:function(y){a=""+y},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function zl(e){if(!e._valueTracker){var t=Wd(e)?"checked":"value";e._valueTracker=Gg(e,t,""+e[t])}}function Id(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var a=t.getValue(),i="";return e&&(i=Wd(e)?e.checked?"true":"false":e.value),e=i,e!==a?(t.setValue(e),!0):!1}function Mi(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}var Yg=/[\n"\\]/g;function Mn(e){return e.replace(Yg,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function Rl(e,t,a,i,d,f,y,E){e.name="",y!=null&&typeof y!="function"&&typeof y!="symbol"&&typeof y!="boolean"?e.type=y:e.removeAttribute("type"),t!=null?y==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+Tn(t)):e.value!==""+Tn(t)&&(e.value=""+Tn(t)):y!=="submit"&&y!=="reset"||e.removeAttribute("value"),t!=null?ql(e,y,Tn(t)):a!=null?ql(e,y,Tn(a)):i!=null&&e.removeAttribute("value"),d==null&&f!=null&&(e.defaultChecked=!!f),d!=null&&(e.checked=d&&typeof d!="function"&&typeof d!="symbol"),E!=null&&typeof E!="function"&&typeof E!="symbol"&&typeof E!="boolean"?e.name=""+Tn(E):e.removeAttribute("name")}function ep(e,t,a,i,d,f,y,E){if(f!=null&&typeof f!="function"&&typeof f!="symbol"&&typeof f!="boolean"&&(e.type=f),t!=null||a!=null){if(!(f!=="submit"&&f!=="reset"||t!=null)){zl(e);return}a=a!=null?""+Tn(a):"",t=t!=null?""+Tn(t):a,E||t===e.value||(e.value=t),e.defaultValue=t}i=i??d,i=typeof i!="function"&&typeof i!="symbol"&&!!i,e.checked=E?e.checked:!!i,e.defaultChecked=!!i,y!=null&&typeof y!="function"&&typeof y!="symbol"&&typeof y!="boolean"&&(e.name=y),zl(e)}function ql(e,t,a){t==="number"&&Mi(e.ownerDocument)===e||e.defaultValue===""+a||(e.defaultValue=""+a)}function Ns(e,t,a,i){if(e=e.options,t){t={};for(var d=0;d<a.length;d++)t["$"+a[d]]=!0;for(a=0;a<e.length;a++)d=t.hasOwnProperty("$"+e[a].value),e[a].selected!==d&&(e[a].selected=d),d&&i&&(e[a].defaultSelected=!0)}else{for(a=""+Tn(a),t=null,d=0;d<e.length;d++){if(e[d].value===a){e[d].selected=!0,i&&(e[d].defaultSelected=!0);return}t!==null||e[d].disabled||(t=e[d])}t!==null&&(t.selected=!0)}}function tp(e,t,a){if(t!=null&&(t=""+Tn(t),t!==e.value&&(e.value=t),a==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=a!=null?""+Tn(a):""}function np(e,t,a,i){if(t==null){if(i!=null){if(a!=null)throw Error(u(92));if(xe(i)){if(1<i.length)throw Error(u(93));i=i[0]}a=i}a==null&&(a=""),t=a}a=Tn(t),e.defaultValue=a,i=e.textContent,i===a&&i!==""&&i!==null&&(e.value=i),zl(e)}function Ts(e,t){if(t){var a=e.firstChild;if(a&&a===e.lastChild&&a.nodeType===3){a.nodeValue=t;return}}e.textContent=t}var Pg=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function ap(e,t,a){var i=t.indexOf("--")===0;a==null||typeof a=="boolean"||a===""?i?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":i?e.setProperty(t,a):typeof a!="number"||a===0||Pg.has(t)?t==="float"?e.cssFloat=a:e[t]=(""+a).trim():e[t]=a+"px"}function sp(e,t,a){if(t!=null&&typeof t!="object")throw Error(u(62));if(e=e.style,a!=null){for(var i in a)!a.hasOwnProperty(i)||t!=null&&t.hasOwnProperty(i)||(i.indexOf("--")===0?e.setProperty(i,""):i==="float"?e.cssFloat="":e[i]="");for(var d in t)i=t[d],t.hasOwnProperty(d)&&a[d]!==i&&ap(e,d,i)}else for(var f in t)t.hasOwnProperty(f)&&ap(e,f,t[f])}function Hl(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Vg=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),Xg=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Ci(e){return Xg.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function ta(){}var Ul=null;function Ll(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Ms=null,Cs=null;function op(e){var t=_s(e);if(t&&(e=t.stateNode)){var a=e[hn]||null;e:switch(e=t.stateNode,t.type){case"input":if(Rl(e,a.value,a.defaultValue,a.defaultValue,a.checked,a.defaultChecked,a.type,a.name),t=a.name,a.type==="radio"&&t!=null){for(a=e;a.parentNode;)a=a.parentNode;for(a=a.querySelectorAll('input[name="'+Mn(""+t)+'"][type="radio"]'),t=0;t<a.length;t++){var i=a[t];if(i!==e&&i.form===e.form){var d=i[hn]||null;if(!d)throw Error(u(90));Rl(i,d.value,d.defaultValue,d.defaultValue,d.checked,d.defaultChecked,d.type,d.name)}}for(t=0;t<a.length;t++)i=a[t],i.form===e.form&&Id(i)}break e;case"textarea":tp(e,a.value,a.defaultValue);break e;case"select":t=a.value,t!=null&&Ns(e,!!a.multiple,t,!1)}}}var Fl=!1;function ip(e,t,a){if(Fl)return e(t,a);Fl=!0;try{var i=e(t);return i}finally{if(Fl=!1,(Ms!==null||Cs!==null)&&(vr(),Ms&&(t=Ms,e=Cs,Cs=Ms=null,op(t),e)))for(t=0;t<e.length;t++)op(e[t])}}function bo(e,t){var a=e.stateNode;if(a===null)return null;var i=a[hn]||null;if(i===null)return null;a=i[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(e=e.type,i=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!i;break e;default:e=!1}if(e)return null;if(a&&typeof a!="function")throw Error(u(231,t,typeof a));return a}var na=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),Gl=!1;if(na)try{var vo={};Object.defineProperty(vo,"passive",{get:function(){Gl=!0}}),window.addEventListener("test",vo,vo),window.removeEventListener("test",vo,vo)}catch{Gl=!1}var Ea=null,Yl=null,Oi=null;function rp(){if(Oi)return Oi;var e,t=Yl,a=t.length,i,d="value"in Ea?Ea.value:Ea.textContent,f=d.length;for(e=0;e<a&&t[e]===d[e];e++);var y=a-e;for(i=1;i<=y&&t[a-i]===d[f-i];i++);return Oi=d.slice(e,1<i?1-i:void 0)}function Bi(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function ji(){return!0}function lp(){return!1}function fn(e){function t(a,i,d,f,y){this._reactName=a,this._targetInst=d,this.type=i,this.nativeEvent=f,this.target=y,this.currentTarget=null;for(var E in e)e.hasOwnProperty(E)&&(a=e[E],this[E]=a?a(f):f[E]);return this.isDefaultPrevented=(f.defaultPrevented!=null?f.defaultPrevented:f.returnValue===!1)?ji:lp,this.isPropagationStopped=lp,this}return x(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():typeof a.returnValue!="unknown"&&(a.returnValue=!1),this.isDefaultPrevented=ji)},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():typeof a.cancelBubble!="unknown"&&(a.cancelBubble=!0),this.isPropagationStopped=ji)},persist:function(){},isPersistent:ji}),t}var Ia={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},zi=fn(Ia),xo=x({},Ia,{view:0,detail:0}),Qg=fn(xo),Pl,Vl,wo,Ri=x({},xo,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:Ql,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==wo&&(wo&&e.type==="mousemove"?(Pl=e.screenX-wo.screenX,Vl=e.screenY-wo.screenY):Vl=Pl=0,wo=e),Pl)},movementY:function(e){return"movementY"in e?e.movementY:Vl}}),cp=fn(Ri),Zg=x({},Ri,{dataTransfer:0}),Jg=fn(Zg),Kg=x({},xo,{relatedTarget:0}),Xl=fn(Kg),Wg=x({},Ia,{animationName:0,elapsedTime:0,pseudoElement:0}),Ig=fn(Wg),ey=x({},Ia,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),ty=fn(ey),ny=x({},Ia,{data:0}),up=fn(ny),ay={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},sy={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},oy={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function iy(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=oy[e])?!!t[e]:!1}function Ql(){return iy}var ry=x({},xo,{key:function(e){if(e.key){var t=ay[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Bi(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?sy[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:Ql,charCode:function(e){return e.type==="keypress"?Bi(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Bi(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),ly=fn(ry),cy=x({},Ri,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),dp=fn(cy),uy=x({},xo,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:Ql}),dy=fn(uy),py=x({},Ia,{propertyName:0,elapsedTime:0,pseudoElement:0}),hy=fn(py),fy=x({},Ri,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),my=fn(fy),gy=x({},Ia,{newState:0,oldState:0}),yy=fn(gy),by=[9,13,27,32],Zl=na&&"CompositionEvent"in window,ko=null;na&&"documentMode"in document&&(ko=document.documentMode);var vy=na&&"TextEvent"in window&&!ko,pp=na&&(!Zl||ko&&8<ko&&11>=ko),hp=" ",fp=!1;function mp(e,t){switch(e){case"keyup":return by.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function gp(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Os=!1;function xy(e,t){switch(e){case"compositionend":return gp(t);case"keypress":return t.which!==32?null:(fp=!0,hp);case"textInput":return e=t.data,e===hp&&fp?null:e;default:return null}}function wy(e,t){if(Os)return e==="compositionend"||!Zl&&mp(e,t)?(e=rp(),Oi=Yl=Ea=null,Os=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return pp&&t.locale!=="ko"?null:t.data;default:return null}}var ky={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function yp(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!ky[e.type]:t==="textarea"}function bp(e,t,a,i){Ms?Cs?Cs.push(i):Cs=[i]:Ms=i,t=_r(t,"onChange"),0<t.length&&(a=new zi("onChange","change",null,a,i),e.push({event:a,listeners:t}))}var Eo=null,Ao=null;function Ey(e){tm(e,0)}function qi(e){var t=yo(e);if(Id(t))return e}function vp(e,t){if(e==="change")return t}var xp=!1;if(na){var Jl;if(na){var Kl="oninput"in document;if(!Kl){var wp=document.createElement("div");wp.setAttribute("oninput","return;"),Kl=typeof wp.oninput=="function"}Jl=Kl}else Jl=!1;xp=Jl&&(!document.documentMode||9<document.documentMode)}function kp(){Eo&&(Eo.detachEvent("onpropertychange",Ep),Ao=Eo=null)}function Ep(e){if(e.propertyName==="value"&&qi(Ao)){var t=[];bp(t,Ao,e,Ll(e)),ip(Ey,t)}}function Ay(e,t,a){e==="focusin"?(kp(),Eo=t,Ao=a,Eo.attachEvent("onpropertychange",Ep)):e==="focusout"&&kp()}function Sy(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return qi(Ao)}function _y(e,t){if(e==="click")return qi(t)}function $y(e,t){if(e==="input"||e==="change")return qi(t)}function Dy(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var kn=typeof Object.is=="function"?Object.is:Dy;function So(e,t){if(kn(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var a=Object.keys(e),i=Object.keys(t);if(a.length!==i.length)return!1;for(i=0;i<a.length;i++){var d=a[i];if(!be.call(t,d)||!kn(e[d],t[d]))return!1}return!0}function Ap(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Sp(e,t){var a=Ap(e);e=0;for(var i;a;){if(a.nodeType===3){if(i=e+a.textContent.length,e<=t&&i>=t)return{node:a,offset:t-e};e=i}e:{for(;a;){if(a.nextSibling){a=a.nextSibling;break e}a=a.parentNode}a=void 0}a=Ap(a)}}function _p(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?_p(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function $p(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=Mi(e.document);t instanceof e.HTMLIFrameElement;){try{var a=typeof t.contentWindow.location.href=="string"}catch{a=!1}if(a)e=t.contentWindow;else break;t=Mi(e.document)}return t}function Wl(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var Ny=na&&"documentMode"in document&&11>=document.documentMode,Bs=null,Il=null,_o=null,ec=!1;function Dp(e,t,a){var i=a.window===a?a.document:a.nodeType===9?a:a.ownerDocument;ec||Bs==null||Bs!==Mi(i)||(i=Bs,"selectionStart"in i&&Wl(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),_o&&So(_o,i)||(_o=i,i=_r(Il,"onSelect"),0<i.length&&(t=new zi("onSelect","select",null,t,a),e.push({event:t,listeners:i}),t.target=Bs)))}function es(e,t){var a={};return a[e.toLowerCase()]=t.toLowerCase(),a["Webkit"+e]="webkit"+t,a["Moz"+e]="moz"+t,a}var js={animationend:es("Animation","AnimationEnd"),animationiteration:es("Animation","AnimationIteration"),animationstart:es("Animation","AnimationStart"),transitionrun:es("Transition","TransitionRun"),transitionstart:es("Transition","TransitionStart"),transitioncancel:es("Transition","TransitionCancel"),transitionend:es("Transition","TransitionEnd")},tc={},Np={};na&&(Np=document.createElement("div").style,"AnimationEvent"in window||(delete js.animationend.animation,delete js.animationiteration.animation,delete js.animationstart.animation),"TransitionEvent"in window||delete js.transitionend.transition);function ts(e){if(tc[e])return tc[e];if(!js[e])return e;var t=js[e],a;for(a in t)if(t.hasOwnProperty(a)&&a in Np)return tc[e]=t[a];return e}var Tp=ts("animationend"),Mp=ts("animationiteration"),Cp=ts("animationstart"),Ty=ts("transitionrun"),My=ts("transitionstart"),Cy=ts("transitioncancel"),Op=ts("transitionend"),Bp=new Map,nc="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");nc.push("scrollEnd");function Ln(e,t){Bp.set(e,t),Wa(t,[e])}var Hi=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Cn=[],zs=0,ac=0;function Ui(){for(var e=zs,t=ac=zs=0;t<e;){var a=Cn[t];Cn[t++]=null;var i=Cn[t];Cn[t++]=null;var d=Cn[t];Cn[t++]=null;var f=Cn[t];if(Cn[t++]=null,i!==null&&d!==null){var y=i.pending;y===null?d.next=d:(d.next=y.next,y.next=d),i.pending=d}f!==0&&jp(a,d,f)}}function Li(e,t,a,i){Cn[zs++]=e,Cn[zs++]=t,Cn[zs++]=a,Cn[zs++]=i,ac|=i,e.lanes|=i,e=e.alternate,e!==null&&(e.lanes|=i)}function sc(e,t,a,i){return Li(e,t,a,i),Fi(e)}function ns(e,t){return Li(e,null,null,t),Fi(e)}function jp(e,t,a){e.lanes|=a;var i=e.alternate;i!==null&&(i.lanes|=a);for(var d=!1,f=e.return;f!==null;)f.childLanes|=a,i=f.alternate,i!==null&&(i.childLanes|=a),f.tag===22&&(e=f.stateNode,e===null||e._visibility&1||(d=!0)),e=f,f=f.return;return e.tag===3?(f=e.stateNode,d&&t!==null&&(d=31-It(a),e=f.hiddenUpdates,i=e[d],i===null?e[d]=[t]:i.push(t),t.lane=a|536870912),f):null}function Fi(e){if(50<Qo)throw Qo=0,hu=null,Error(u(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var Rs={};function Oy(e,t,a,i){this.tag=e,this.key=a,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function En(e,t,a,i){return new Oy(e,t,a,i)}function oc(e){return e=e.prototype,!(!e||!e.isReactComponent)}function aa(e,t){var a=e.alternate;return a===null?(a=En(e.tag,t,e.key,e.mode),a.elementType=e.elementType,a.type=e.type,a.stateNode=e.stateNode,a.alternate=e,e.alternate=a):(a.pendingProps=t,a.type=e.type,a.flags=0,a.subtreeFlags=0,a.deletions=null),a.flags=e.flags&65011712,a.childLanes=e.childLanes,a.lanes=e.lanes,a.child=e.child,a.memoizedProps=e.memoizedProps,a.memoizedState=e.memoizedState,a.updateQueue=e.updateQueue,t=e.dependencies,a.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},a.sibling=e.sibling,a.index=e.index,a.ref=e.ref,a.refCleanup=e.refCleanup,a}function zp(e,t){e.flags&=65011714;var a=e.alternate;return a===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=a.childLanes,e.lanes=a.lanes,e.child=a.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=a.memoizedProps,e.memoizedState=a.memoizedState,e.updateQueue=a.updateQueue,e.type=a.type,t=a.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function Gi(e,t,a,i,d,f){var y=0;if(i=e,typeof e=="function")oc(e)&&(y=1);else if(typeof e=="string")y=qb(e,a,pe.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(e){case W:return e=En(31,a,t,d),e.elementType=W,e.lanes=f,e;case T:return as(a.children,d,f,t);case B:y=8,d|=24;break;case N:return e=En(12,a,t,d|2),e.elementType=N,e.lanes=f,e;case le:return e=En(13,a,t,d),e.elementType=le,e.lanes=f,e;case V:return e=En(19,a,t,d),e.elementType=V,e.lanes=f,e;default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case z:y=10;break e;case M:y=9;break e;case ae:y=11;break e;case J:y=14;break e;case X:y=16,i=null;break e}y=29,a=Error(u(130,e===null?"null":typeof e,"")),i=null}return t=En(y,a,t,d),t.elementType=e,t.type=i,t.lanes=f,t}function as(e,t,a,i){return e=En(7,e,i,t),e.lanes=a,e}function ic(e,t,a){return e=En(6,e,null,t),e.lanes=a,e}function Rp(e){var t=En(18,null,null,0);return t.stateNode=e,t}function rc(e,t,a){return t=En(4,e.children!==null?e.children:[],e.key,t),t.lanes=a,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var qp=new WeakMap;function On(e,t){if(typeof e=="object"&&e!==null){var a=qp.get(e);return a!==void 0?a:(t={value:e,source:t,stack:Y(t)},qp.set(e,t),t)}return{value:e,source:t,stack:Y(t)}}var qs=[],Hs=0,Yi=null,$o=0,Bn=[],jn=0,Aa=null,Xn=1,Qn="";function sa(e,t){qs[Hs++]=$o,qs[Hs++]=Yi,Yi=e,$o=t}function Hp(e,t,a){Bn[jn++]=Xn,Bn[jn++]=Qn,Bn[jn++]=Aa,Aa=e;var i=Xn;e=Qn;var d=32-It(i)-1;i&=~(1<<d),a+=1;var f=32-It(t)+d;if(30<f){var y=d-d%5;f=(i&(1<<y)-1).toString(32),i>>=y,d-=y,Xn=1<<32-It(t)+d|a<<d|i,Qn=f+e}else Xn=1<<f|a<<d|i,Qn=e}function lc(e){e.return!==null&&(sa(e,1),Hp(e,1,0))}function cc(e){for(;e===Yi;)Yi=qs[--Hs],qs[Hs]=null,$o=qs[--Hs],qs[Hs]=null;for(;e===Aa;)Aa=Bn[--jn],Bn[jn]=null,Qn=Bn[--jn],Bn[jn]=null,Xn=Bn[--jn],Bn[jn]=null}function Up(e,t){Bn[jn++]=Xn,Bn[jn++]=Qn,Bn[jn++]=Aa,Xn=t.id,Qn=t.overflow,Aa=e}var tn=null,St=null,st=!1,Sa=null,zn=!1,uc=Error(u(519));function _a(e){var t=Error(u(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw Do(On(t,e)),uc}function Lp(e){var t=e.stateNode,a=e.type,i=e.memoizedProps;switch(t[en]=e,t[hn]=i,a){case"dialog":tt("cancel",t),tt("close",t);break;case"iframe":case"object":case"embed":tt("load",t);break;case"video":case"audio":for(a=0;a<Jo.length;a++)tt(Jo[a],t);break;case"source":tt("error",t);break;case"img":case"image":case"link":tt("error",t),tt("load",t);break;case"details":tt("toggle",t);break;case"input":tt("invalid",t),ep(t,i.value,i.defaultValue,i.checked,i.defaultChecked,i.type,i.name,!0);break;case"select":tt("invalid",t);break;case"textarea":tt("invalid",t),np(t,i.value,i.defaultValue,i.children)}a=i.children,typeof a!="string"&&typeof a!="number"&&typeof a!="bigint"||t.textContent===""+a||i.suppressHydrationWarning===!0||om(t.textContent,a)?(i.popover!=null&&(tt("beforetoggle",t),tt("toggle",t)),i.onScroll!=null&&tt("scroll",t),i.onScrollEnd!=null&&tt("scrollend",t),i.onClick!=null&&(t.onclick=ta),t=!0):t=!1,t||_a(e,!0)}function Fp(e){for(tn=e.return;tn;)switch(tn.tag){case 5:case 31:case 13:zn=!1;return;case 27:case 3:zn=!0;return;default:tn=tn.return}}function Us(e){if(e!==tn)return!1;if(!st)return Fp(e),st=!0,!1;var t=e.tag,a;if((a=t!==3&&t!==27)&&((a=t===5)&&(a=e.type,a=!(a!=="form"&&a!=="button")||Du(e.type,e.memoizedProps)),a=!a),a&&St&&_a(e),Fp(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(u(317));St=fm(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(u(317));St=fm(e)}else t===27?(t=St,Ua(e.type)?(e=Ou,Ou=null,St=e):St=t):St=tn?qn(e.stateNode.nextSibling):null;return!0}function ss(){St=tn=null,st=!1}function dc(){var e=Sa;return e!==null&&(bn===null?bn=e:bn.push.apply(bn,e),Sa=null),e}function Do(e){Sa===null?Sa=[e]:Sa.push(e)}var pc=S(null),os=null,oa=null;function $a(e,t,a){K(pc,t._currentValue),t._currentValue=a}function ia(e){e._currentValue=pc.current,H(pc)}function hc(e,t,a){for(;e!==null;){var i=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,i!==null&&(i.childLanes|=t)):i!==null&&(i.childLanes&t)!==t&&(i.childLanes|=t),e===a)break;e=e.return}}function fc(e,t,a,i){var d=e.child;for(d!==null&&(d.return=e);d!==null;){var f=d.dependencies;if(f!==null){var y=d.child;f=f.firstContext;e:for(;f!==null;){var E=f;f=d;for(var j=0;j<t.length;j++)if(E.context===t[j]){f.lanes|=a,E=f.alternate,E!==null&&(E.lanes|=a),hc(f.return,a,e),i||(y=null);break e}f=E.next}}else if(d.tag===18){if(y=d.return,y===null)throw Error(u(341));y.lanes|=a,f=y.alternate,f!==null&&(f.lanes|=a),hc(y,a,e),y=null}else y=d.child;if(y!==null)y.return=d;else for(y=d;y!==null;){if(y===e){y=null;break}if(d=y.sibling,d!==null){d.return=y.return,y=d;break}y=y.return}d=y}}function Ls(e,t,a,i){e=null;for(var d=t,f=!1;d!==null;){if(!f){if((d.flags&524288)!==0)f=!0;else if((d.flags&262144)!==0)break}if(d.tag===10){var y=d.alternate;if(y===null)throw Error(u(387));if(y=y.memoizedProps,y!==null){var E=d.type;kn(d.pendingProps.value,y.value)||(e!==null?e.push(E):e=[E])}}else if(d===je.current){if(y=d.alternate,y===null)throw Error(u(387));y.memoizedState.memoizedState!==d.memoizedState.memoizedState&&(e!==null?e.push(ti):e=[ti])}d=d.return}e!==null&&fc(t,e,a,i),t.flags|=262144}function Pi(e){for(e=e.firstContext;e!==null;){if(!kn(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function is(e){os=e,oa=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function nn(e){return Gp(os,e)}function Vi(e,t){return os===null&&is(e),Gp(e,t)}function Gp(e,t){var a=t._currentValue;if(t={context:t,memoizedValue:a,next:null},oa===null){if(e===null)throw Error(u(308));oa=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else oa=oa.next=t;return a}var By=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(a,i){e.push(i)}};this.abort=function(){t.aborted=!0,e.forEach(function(a){return a()})}},jy=n.unstable_scheduleCallback,zy=n.unstable_NormalPriority,Lt={$$typeof:z,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function mc(){return{controller:new By,data:new Map,refCount:0}}function No(e){e.refCount--,e.refCount===0&&jy(zy,function(){e.controller.abort()})}var To=null,gc=0,Fs=0,Gs=null;function Ry(e,t){if(To===null){var a=To=[];gc=0,Fs=vu(),Gs={status:"pending",value:void 0,then:function(i){a.push(i)}}}return gc++,t.then(Yp,Yp),t}function Yp(){if(--gc===0&&To!==null){Gs!==null&&(Gs.status="fulfilled");var e=To;To=null,Fs=0,Gs=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function qy(e,t){var a=[],i={status:"pending",value:null,reason:null,then:function(d){a.push(d)}};return e.then(function(){i.status="fulfilled",i.value=t;for(var d=0;d<a.length;d++)(0,a[d])(t)},function(d){for(i.status="rejected",i.reason=d,d=0;d<a.length;d++)(0,a[d])(void 0)}),i}var Pp=C.S;C.S=function(e,t){Nf=Be(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&Ry(e,t),Pp!==null&&Pp(e,t)};var rs=S(null);function yc(){var e=rs.current;return e!==null?e:Et.pooledCache}function Xi(e,t){t===null?K(rs,rs.current):K(rs,t.pool)}function Vp(){var e=yc();return e===null?null:{parent:Lt._currentValue,pool:e}}var Ys=Error(u(460)),bc=Error(u(474)),Qi=Error(u(542)),Zi={then:function(){}};function Xp(e){return e=e.status,e==="fulfilled"||e==="rejected"}function Qp(e,t,a){switch(a=e[a],a===void 0?e.push(t):a!==t&&(t.then(ta,ta),t=a),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Jp(e),e;default:if(typeof t.status=="string")t.then(ta,ta);else{if(e=Et,e!==null&&100<e.shellSuspendCounter)throw Error(u(482));e=t,e.status="pending",e.then(function(i){if(t.status==="pending"){var d=t;d.status="fulfilled",d.value=i}},function(i){if(t.status==="pending"){var d=t;d.status="rejected",d.reason=i}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Jp(e),e}throw cs=t,Ys}}function ls(e){try{var t=e._init;return t(e._payload)}catch(a){throw a!==null&&typeof a=="object"&&typeof a.then=="function"?(cs=a,Ys):a}}var cs=null;function Zp(){if(cs===null)throw Error(u(459));var e=cs;return cs=null,e}function Jp(e){if(e===Ys||e===Qi)throw Error(u(483))}var Ps=null,Mo=0;function Ji(e){var t=Mo;return Mo+=1,Ps===null&&(Ps=[]),Qp(Ps,e,t)}function Co(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function Ki(e,t){throw t.$$typeof===A?Error(u(525)):(e=Object.prototype.toString.call(t),Error(u(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function Kp(e){function t(Q,L){if(e){var ee=Q.deletions;ee===null?(Q.deletions=[L],Q.flags|=16):ee.push(L)}}function a(Q,L){if(!e)return null;for(;L!==null;)t(Q,L),L=L.sibling;return null}function i(Q){for(var L=new Map;Q!==null;)Q.key!==null?L.set(Q.key,Q):L.set(Q.index,Q),Q=Q.sibling;return L}function d(Q,L){return Q=aa(Q,L),Q.index=0,Q.sibling=null,Q}function f(Q,L,ee){return Q.index=ee,e?(ee=Q.alternate,ee!==null?(ee=ee.index,ee<L?(Q.flags|=67108866,L):ee):(Q.flags|=67108866,L)):(Q.flags|=1048576,L)}function y(Q){return e&&Q.alternate===null&&(Q.flags|=67108866),Q}function E(Q,L,ee,fe){return L===null||L.tag!==6?(L=ic(ee,Q.mode,fe),L.return=Q,L):(L=d(L,ee),L.return=Q,L)}function j(Q,L,ee,fe){var Fe=ee.type;return Fe===T?ue(Q,L,ee.props.children,fe,ee.key):L!==null&&(L.elementType===Fe||typeof Fe=="object"&&Fe!==null&&Fe.$$typeof===X&&ls(Fe)===L.type)?(L=d(L,ee.props),Co(L,ee),L.return=Q,L):(L=Gi(ee.type,ee.key,ee.props,null,Q.mode,fe),Co(L,ee),L.return=Q,L)}function te(Q,L,ee,fe){return L===null||L.tag!==4||L.stateNode.containerInfo!==ee.containerInfo||L.stateNode.implementation!==ee.implementation?(L=rc(ee,Q.mode,fe),L.return=Q,L):(L=d(L,ee.children||[]),L.return=Q,L)}function ue(Q,L,ee,fe,Fe){return L===null||L.tag!==7?(L=as(ee,Q.mode,fe,Fe),L.return=Q,L):(L=d(L,ee),L.return=Q,L)}function ge(Q,L,ee){if(typeof L=="string"&&L!==""||typeof L=="number"||typeof L=="bigint")return L=ic(""+L,Q.mode,ee),L.return=Q,L;if(typeof L=="object"&&L!==null){switch(L.$$typeof){case w:return ee=Gi(L.type,L.key,L.props,null,Q.mode,ee),Co(ee,L),ee.return=Q,ee;case D:return L=rc(L,Q.mode,ee),L.return=Q,L;case X:return L=ls(L),ge(Q,L,ee)}if(xe(L)||he(L))return L=as(L,Q.mode,ee,null),L.return=Q,L;if(typeof L.then=="function")return ge(Q,Ji(L),ee);if(L.$$typeof===z)return ge(Q,Vi(Q,L),ee);Ki(Q,L)}return null}function ne(Q,L,ee,fe){var Fe=L!==null?L.key:null;if(typeof ee=="string"&&ee!==""||typeof ee=="number"||typeof ee=="bigint")return Fe!==null?null:E(Q,L,""+ee,fe);if(typeof ee=="object"&&ee!==null){switch(ee.$$typeof){case w:return ee.key===Fe?j(Q,L,ee,fe):null;case D:return ee.key===Fe?te(Q,L,ee,fe):null;case X:return ee=ls(ee),ne(Q,L,ee,fe)}if(xe(ee)||he(ee))return Fe!==null?null:ue(Q,L,ee,fe,null);if(typeof ee.then=="function")return ne(Q,L,Ji(ee),fe);if(ee.$$typeof===z)return ne(Q,L,Vi(Q,ee),fe);Ki(Q,ee)}return null}function ie(Q,L,ee,fe,Fe){if(typeof fe=="string"&&fe!==""||typeof fe=="number"||typeof fe=="bigint")return Q=Q.get(ee)||null,E(L,Q,""+fe,Fe);if(typeof fe=="object"&&fe!==null){switch(fe.$$typeof){case w:return Q=Q.get(fe.key===null?ee:fe.key)||null,j(L,Q,fe,Fe);case D:return Q=Q.get(fe.key===null?ee:fe.key)||null,te(L,Q,fe,Fe);case X:return fe=ls(fe),ie(Q,L,ee,fe,Fe)}if(xe(fe)||he(fe))return Q=Q.get(ee)||null,ue(L,Q,fe,Fe,null);if(typeof fe.then=="function")return ie(Q,L,ee,Ji(fe),Fe);if(fe.$$typeof===z)return ie(Q,L,ee,Vi(L,fe),Fe);Ki(L,fe)}return null}function He(Q,L,ee,fe){for(var Fe=null,lt=null,Ue=L,We=L=0,at=null;Ue!==null&&We<ee.length;We++){Ue.index>We?(at=Ue,Ue=null):at=Ue.sibling;var ct=ne(Q,Ue,ee[We],fe);if(ct===null){Ue===null&&(Ue=at);break}e&&Ue&&ct.alternate===null&&t(Q,Ue),L=f(ct,L,We),lt===null?Fe=ct:lt.sibling=ct,lt=ct,Ue=at}if(We===ee.length)return a(Q,Ue),st&&sa(Q,We),Fe;if(Ue===null){for(;We<ee.length;We++)Ue=ge(Q,ee[We],fe),Ue!==null&&(L=f(Ue,L,We),lt===null?Fe=Ue:lt.sibling=Ue,lt=Ue);return st&&sa(Q,We),Fe}for(Ue=i(Ue);We<ee.length;We++)at=ie(Ue,Q,We,ee[We],fe),at!==null&&(e&&at.alternate!==null&&Ue.delete(at.key===null?We:at.key),L=f(at,L,We),lt===null?Fe=at:lt.sibling=at,lt=at);return e&&Ue.forEach(function(Pa){return t(Q,Pa)}),st&&sa(Q,We),Fe}function Ye(Q,L,ee,fe){if(ee==null)throw Error(u(151));for(var Fe=null,lt=null,Ue=L,We=L=0,at=null,ct=ee.next();Ue!==null&&!ct.done;We++,ct=ee.next()){Ue.index>We?(at=Ue,Ue=null):at=Ue.sibling;var Pa=ne(Q,Ue,ct.value,fe);if(Pa===null){Ue===null&&(Ue=at);break}e&&Ue&&Pa.alternate===null&&t(Q,Ue),L=f(Pa,L,We),lt===null?Fe=Pa:lt.sibling=Pa,lt=Pa,Ue=at}if(ct.done)return a(Q,Ue),st&&sa(Q,We),Fe;if(Ue===null){for(;!ct.done;We++,ct=ee.next())ct=ge(Q,ct.value,fe),ct!==null&&(L=f(ct,L,We),lt===null?Fe=ct:lt.sibling=ct,lt=ct);return st&&sa(Q,We),Fe}for(Ue=i(Ue);!ct.done;We++,ct=ee.next())ct=ie(Ue,Q,We,ct.value,fe),ct!==null&&(e&&ct.alternate!==null&&Ue.delete(ct.key===null?We:ct.key),L=f(ct,L,We),lt===null?Fe=ct:lt.sibling=ct,lt=ct);return e&&Ue.forEach(function(Zb){return t(Q,Zb)}),st&&sa(Q,We),Fe}function vt(Q,L,ee,fe){if(typeof ee=="object"&&ee!==null&&ee.type===T&&ee.key===null&&(ee=ee.props.children),typeof ee=="object"&&ee!==null){switch(ee.$$typeof){case w:e:{for(var Fe=ee.key;L!==null;){if(L.key===Fe){if(Fe=ee.type,Fe===T){if(L.tag===7){a(Q,L.sibling),fe=d(L,ee.props.children),fe.return=Q,Q=fe;break e}}else if(L.elementType===Fe||typeof Fe=="object"&&Fe!==null&&Fe.$$typeof===X&&ls(Fe)===L.type){a(Q,L.sibling),fe=d(L,ee.props),Co(fe,ee),fe.return=Q,Q=fe;break e}a(Q,L);break}else t(Q,L);L=L.sibling}ee.type===T?(fe=as(ee.props.children,Q.mode,fe,ee.key),fe.return=Q,Q=fe):(fe=Gi(ee.type,ee.key,ee.props,null,Q.mode,fe),Co(fe,ee),fe.return=Q,Q=fe)}return y(Q);case D:e:{for(Fe=ee.key;L!==null;){if(L.key===Fe)if(L.tag===4&&L.stateNode.containerInfo===ee.containerInfo&&L.stateNode.implementation===ee.implementation){a(Q,L.sibling),fe=d(L,ee.children||[]),fe.return=Q,Q=fe;break e}else{a(Q,L);break}else t(Q,L);L=L.sibling}fe=rc(ee,Q.mode,fe),fe.return=Q,Q=fe}return y(Q);case X:return ee=ls(ee),vt(Q,L,ee,fe)}if(xe(ee))return He(Q,L,ee,fe);if(he(ee)){if(Fe=he(ee),typeof Fe!="function")throw Error(u(150));return ee=Fe.call(ee),Ye(Q,L,ee,fe)}if(typeof ee.then=="function")return vt(Q,L,Ji(ee),fe);if(ee.$$typeof===z)return vt(Q,L,Vi(Q,ee),fe);Ki(Q,ee)}return typeof ee=="string"&&ee!==""||typeof ee=="number"||typeof ee=="bigint"?(ee=""+ee,L!==null&&L.tag===6?(a(Q,L.sibling),fe=d(L,ee),fe.return=Q,Q=fe):(a(Q,L),fe=ic(ee,Q.mode,fe),fe.return=Q,Q=fe),y(Q)):a(Q,L)}return function(Q,L,ee,fe){try{Mo=0;var Fe=vt(Q,L,ee,fe);return Ps=null,Fe}catch(Ue){if(Ue===Ys||Ue===Qi)throw Ue;var lt=En(29,Ue,null,Q.mode);return lt.lanes=fe,lt.return=Q,lt}}}var us=Kp(!0),Wp=Kp(!1),Da=!1;function vc(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function xc(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Na(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Ta(e,t,a){var i=e.updateQueue;if(i===null)return null;if(i=i.shared,(ut&2)!==0){var d=i.pending;return d===null?t.next=t:(t.next=d.next,d.next=t),i.pending=t,t=Fi(e),jp(e,null,a),t}return Li(e,i,t,a),Fi(e)}function Oo(e,t,a){if(t=t.updateQueue,t!==null&&(t=t.shared,(a&4194048)!==0)){var i=t.lanes;i&=e.pendingLanes,a|=i,t.lanes=a,Gd(e,a)}}function wc(e,t){var a=e.updateQueue,i=e.alternate;if(i!==null&&(i=i.updateQueue,a===i)){var d=null,f=null;if(a=a.firstBaseUpdate,a!==null){do{var y={lane:a.lane,tag:a.tag,payload:a.payload,callback:null,next:null};f===null?d=f=y:f=f.next=y,a=a.next}while(a!==null);f===null?d=f=t:f=f.next=t}else d=f=t;a={baseState:i.baseState,firstBaseUpdate:d,lastBaseUpdate:f,shared:i.shared,callbacks:i.callbacks},e.updateQueue=a;return}e=a.lastBaseUpdate,e===null?a.firstBaseUpdate=t:e.next=t,a.lastBaseUpdate=t}var kc=!1;function Bo(){if(kc){var e=Gs;if(e!==null)throw e}}function jo(e,t,a,i){kc=!1;var d=e.updateQueue;Da=!1;var f=d.firstBaseUpdate,y=d.lastBaseUpdate,E=d.shared.pending;if(E!==null){d.shared.pending=null;var j=E,te=j.next;j.next=null,y===null?f=te:y.next=te,y=j;var ue=e.alternate;ue!==null&&(ue=ue.updateQueue,E=ue.lastBaseUpdate,E!==y&&(E===null?ue.firstBaseUpdate=te:E.next=te,ue.lastBaseUpdate=j))}if(f!==null){var ge=d.baseState;y=0,ue=te=j=null,E=f;do{var ne=E.lane&-536870913,ie=ne!==E.lane;if(ie?(nt&ne)===ne:(i&ne)===ne){ne!==0&&ne===Fs&&(kc=!0),ue!==null&&(ue=ue.next={lane:0,tag:E.tag,payload:E.payload,callback:null,next:null});e:{var He=e,Ye=E;ne=t;var vt=a;switch(Ye.tag){case 1:if(He=Ye.payload,typeof He=="function"){ge=He.call(vt,ge,ne);break e}ge=He;break e;case 3:He.flags=He.flags&-65537|128;case 0:if(He=Ye.payload,ne=typeof He=="function"?He.call(vt,ge,ne):He,ne==null)break e;ge=x({},ge,ne);break e;case 2:Da=!0}}ne=E.callback,ne!==null&&(e.flags|=64,ie&&(e.flags|=8192),ie=d.callbacks,ie===null?d.callbacks=[ne]:ie.push(ne))}else ie={lane:ne,tag:E.tag,payload:E.payload,callback:E.callback,next:null},ue===null?(te=ue=ie,j=ge):ue=ue.next=ie,y|=ne;if(E=E.next,E===null){if(E=d.shared.pending,E===null)break;ie=E,E=ie.next,ie.next=null,d.lastBaseUpdate=ie,d.shared.pending=null}}while(!0);ue===null&&(j=ge),d.baseState=j,d.firstBaseUpdate=te,d.lastBaseUpdate=ue,f===null&&(d.shared.lanes=0),ja|=y,e.lanes=y,e.memoizedState=ge}}function Ip(e,t){if(typeof e!="function")throw Error(u(191,e));e.call(t)}function eh(e,t){var a=e.callbacks;if(a!==null)for(e.callbacks=null,e=0;e<a.length;e++)Ip(a[e],t)}var Vs=S(null),Wi=S(0);function th(e,t){e=ma,K(Wi,e),K(Vs,t),ma=e|t.baseLanes}function Ec(){K(Wi,ma),K(Vs,Vs.current)}function Ac(){ma=Wi.current,H(Vs),H(Wi)}var An=S(null),Rn=null;function Ma(e){var t=e.alternate;K(qt,qt.current&1),K(An,e),Rn===null&&(t===null||Vs.current!==null||t.memoizedState!==null)&&(Rn=e)}function Sc(e){K(qt,qt.current),K(An,e),Rn===null&&(Rn=e)}function nh(e){e.tag===22?(K(qt,qt.current),K(An,e),Rn===null&&(Rn=e)):Ca()}function Ca(){K(qt,qt.current),K(An,An.current)}function Sn(e){H(An),Rn===e&&(Rn=null),H(qt)}var qt=S(0);function Ii(e){for(var t=e;t!==null;){if(t.tag===13){var a=t.memoizedState;if(a!==null&&(a=a.dehydrated,a===null||Mu(a)||Cu(a)))return t}else if(t.tag===19&&(t.memoizedProps.revealOrder==="forwards"||t.memoizedProps.revealOrder==="backwards"||t.memoizedProps.revealOrder==="unstable_legacy-backwards"||t.memoizedProps.revealOrder==="together")){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var ra=0,Je=null,yt=null,Ft=null,er=!1,Xs=!1,ds=!1,tr=0,zo=0,Qs=null,Hy=0;function Ot(){throw Error(u(321))}function _c(e,t){if(t===null)return!1;for(var a=0;a<t.length&&a<e.length;a++)if(!kn(e[a],t[a]))return!1;return!0}function $c(e,t,a,i,d,f){return ra=f,Je=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,C.H=e===null||e.memoizedState===null?Hh:Fc,ds=!1,f=a(i,d),ds=!1,Xs&&(f=sh(t,a,i,d)),ah(e),f}function ah(e){C.H=Ho;var t=yt!==null&&yt.next!==null;if(ra=0,Ft=yt=Je=null,er=!1,zo=0,Qs=null,t)throw Error(u(300));e===null||Gt||(e=e.dependencies,e!==null&&Pi(e)&&(Gt=!0))}function sh(e,t,a,i){Je=e;var d=0;do{if(Xs&&(Qs=null),zo=0,Xs=!1,25<=d)throw Error(u(301));if(d+=1,Ft=yt=null,e.updateQueue!=null){var f=e.updateQueue;f.lastEffect=null,f.events=null,f.stores=null,f.memoCache!=null&&(f.memoCache.index=0)}C.H=Uh,f=t(a,i)}while(Xs);return f}function Uy(){var e=C.H,t=e.useState()[0];return t=typeof t.then=="function"?Ro(t):t,e=e.useState()[0],(yt!==null?yt.memoizedState:null)!==e&&(Je.flags|=1024),t}function Dc(){var e=tr!==0;return tr=0,e}function Nc(e,t,a){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~a}function Tc(e){if(er){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}er=!1}ra=0,Ft=yt=Je=null,Xs=!1,zo=tr=0,Qs=null}function dn(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Ft===null?Je.memoizedState=Ft=e:Ft=Ft.next=e,Ft}function Ht(){if(yt===null){var e=Je.alternate;e=e!==null?e.memoizedState:null}else e=yt.next;var t=Ft===null?Je.memoizedState:Ft.next;if(t!==null)Ft=t,yt=e;else{if(e===null)throw Je.alternate===null?Error(u(467)):Error(u(310));yt=e,e={memoizedState:yt.memoizedState,baseState:yt.baseState,baseQueue:yt.baseQueue,queue:yt.queue,next:null},Ft===null?Je.memoizedState=Ft=e:Ft=Ft.next=e}return Ft}function nr(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function Ro(e){var t=zo;return zo+=1,Qs===null&&(Qs=[]),e=Qp(Qs,e,t),t=Je,(Ft===null?t.memoizedState:Ft.next)===null&&(t=t.alternate,C.H=t===null||t.memoizedState===null?Hh:Fc),e}function ar(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return Ro(e);if(e.$$typeof===z)return nn(e)}throw Error(u(438,String(e)))}function Mc(e){var t=null,a=Je.updateQueue;if(a!==null&&(t=a.memoCache),t==null){var i=Je.alternate;i!==null&&(i=i.updateQueue,i!==null&&(i=i.memoCache,i!=null&&(t={data:i.data.map(function(d){return d.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),a===null&&(a=nr(),Je.updateQueue=a),a.memoCache=t,a=t.data[t.index],a===void 0)for(a=t.data[t.index]=Array(e),i=0;i<e;i++)a[i]=re;return t.index++,a}function la(e,t){return typeof t=="function"?t(e):t}function sr(e){var t=Ht();return Cc(t,yt,e)}function Cc(e,t,a){var i=e.queue;if(i===null)throw Error(u(311));i.lastRenderedReducer=a;var d=e.baseQueue,f=i.pending;if(f!==null){if(d!==null){var y=d.next;d.next=f.next,f.next=y}t.baseQueue=d=f,i.pending=null}if(f=e.baseState,d===null)e.memoizedState=f;else{t=d.next;var E=y=null,j=null,te=t,ue=!1;do{var ge=te.lane&-536870913;if(ge!==te.lane?(nt&ge)===ge:(ra&ge)===ge){var ne=te.revertLane;if(ne===0)j!==null&&(j=j.next={lane:0,revertLane:0,gesture:null,action:te.action,hasEagerState:te.hasEagerState,eagerState:te.eagerState,next:null}),ge===Fs&&(ue=!0);else if((ra&ne)===ne){te=te.next,ne===Fs&&(ue=!0);continue}else ge={lane:0,revertLane:te.revertLane,gesture:null,action:te.action,hasEagerState:te.hasEagerState,eagerState:te.eagerState,next:null},j===null?(E=j=ge,y=f):j=j.next=ge,Je.lanes|=ne,ja|=ne;ge=te.action,ds&&a(f,ge),f=te.hasEagerState?te.eagerState:a(f,ge)}else ne={lane:ge,revertLane:te.revertLane,gesture:te.gesture,action:te.action,hasEagerState:te.hasEagerState,eagerState:te.eagerState,next:null},j===null?(E=j=ne,y=f):j=j.next=ne,Je.lanes|=ge,ja|=ge;te=te.next}while(te!==null&&te!==t);if(j===null?y=f:j.next=E,!kn(f,e.memoizedState)&&(Gt=!0,ue&&(a=Gs,a!==null)))throw a;e.memoizedState=f,e.baseState=y,e.baseQueue=j,i.lastRenderedState=f}return d===null&&(i.lanes=0),[e.memoizedState,i.dispatch]}function Oc(e){var t=Ht(),a=t.queue;if(a===null)throw Error(u(311));a.lastRenderedReducer=e;var i=a.dispatch,d=a.pending,f=t.memoizedState;if(d!==null){a.pending=null;var y=d=d.next;do f=e(f,y.action),y=y.next;while(y!==d);kn(f,t.memoizedState)||(Gt=!0),t.memoizedState=f,t.baseQueue===null&&(t.baseState=f),a.lastRenderedState=f}return[f,i]}function oh(e,t,a){var i=Je,d=Ht(),f=st;if(f){if(a===void 0)throw Error(u(407));a=a()}else a=t();var y=!kn((yt||d).memoizedState,a);if(y&&(d.memoizedState=a,Gt=!0),d=d.queue,zc(lh.bind(null,i,d,e),[e]),d.getSnapshot!==t||y||Ft!==null&&Ft.memoizedState.tag&1){if(i.flags|=2048,Zs(9,{destroy:void 0},rh.bind(null,i,d,a,t),null),Et===null)throw Error(u(349));f||(ra&127)!==0||ih(i,t,a)}return a}function ih(e,t,a){e.flags|=16384,e={getSnapshot:t,value:a},t=Je.updateQueue,t===null?(t=nr(),Je.updateQueue=t,t.stores=[e]):(a=t.stores,a===null?t.stores=[e]:a.push(e))}function rh(e,t,a,i){t.value=a,t.getSnapshot=i,ch(t)&&uh(e)}function lh(e,t,a){return a(function(){ch(t)&&uh(e)})}function ch(e){var t=e.getSnapshot;e=e.value;try{var a=t();return!kn(e,a)}catch{return!0}}function uh(e){var t=ns(e,2);t!==null&&vn(t,e,2)}function Bc(e){var t=dn();if(typeof e=="function"){var a=e;if(e=a(),ds){rn(!0);try{a()}finally{rn(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:la,lastRenderedState:e},t}function dh(e,t,a,i){return e.baseState=a,Cc(e,yt,typeof i=="function"?i:la)}function Ly(e,t,a,i,d){if(rr(e))throw Error(u(485));if(e=t.action,e!==null){var f={payload:d,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(y){f.listeners.push(y)}};C.T!==null?a(!0):f.isTransition=!1,i(f),a=t.pending,a===null?(f.next=t.pending=f,ph(t,f)):(f.next=a.next,t.pending=a.next=f)}}function ph(e,t){var a=t.action,i=t.payload,d=e.state;if(t.isTransition){var f=C.T,y={};C.T=y;try{var E=a(d,i),j=C.S;j!==null&&j(y,E),hh(e,t,E)}catch(te){jc(e,t,te)}finally{f!==null&&y.types!==null&&(f.types=y.types),C.T=f}}else try{f=a(d,i),hh(e,t,f)}catch(te){jc(e,t,te)}}function hh(e,t,a){a!==null&&typeof a=="object"&&typeof a.then=="function"?a.then(function(i){fh(e,t,i)},function(i){return jc(e,t,i)}):fh(e,t,a)}function fh(e,t,a){t.status="fulfilled",t.value=a,mh(t),e.state=a,t=e.pending,t!==null&&(a=t.next,a===t?e.pending=null:(a=a.next,t.next=a,ph(e,a)))}function jc(e,t,a){var i=e.pending;if(e.pending=null,i!==null){i=i.next;do t.status="rejected",t.reason=a,mh(t),t=t.next;while(t!==i)}e.action=null}function mh(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function gh(e,t){return t}function yh(e,t){if(st){var a=Et.formState;if(a!==null){e:{var i=Je;if(st){if(St){t:{for(var d=St,f=zn;d.nodeType!==8;){if(!f){d=null;break t}if(d=qn(d.nextSibling),d===null){d=null;break t}}f=d.data,d=f==="F!"||f==="F"?d:null}if(d){St=qn(d.nextSibling),i=d.data==="F!";break e}}_a(i)}i=!1}i&&(t=a[0])}}return a=dn(),a.memoizedState=a.baseState=t,i={pending:null,lanes:0,dispatch:null,lastRenderedReducer:gh,lastRenderedState:t},a.queue=i,a=zh.bind(null,Je,i),i.dispatch=a,i=Bc(!1),f=Lc.bind(null,Je,!1,i.queue),i=dn(),d={state:t,dispatch:null,action:e,pending:null},i.queue=d,a=Ly.bind(null,Je,d,f,a),d.dispatch=a,i.memoizedState=e,[t,a,!1]}function bh(e){var t=Ht();return vh(t,yt,e)}function vh(e,t,a){if(t=Cc(e,t,gh)[0],e=sr(la)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var i=Ro(t)}catch(y){throw y===Ys?Qi:y}else i=t;t=Ht();var d=t.queue,f=d.dispatch;return a!==t.memoizedState&&(Je.flags|=2048,Zs(9,{destroy:void 0},Fy.bind(null,d,a),null)),[i,f,e]}function Fy(e,t){e.action=t}function xh(e){var t=Ht(),a=yt;if(a!==null)return vh(t,a,e);Ht(),t=t.memoizedState,a=Ht();var i=a.queue.dispatch;return a.memoizedState=e,[t,i,!1]}function Zs(e,t,a,i){return e={tag:e,create:a,deps:i,inst:t,next:null},t=Je.updateQueue,t===null&&(t=nr(),Je.updateQueue=t),a=t.lastEffect,a===null?t.lastEffect=e.next=e:(i=a.next,a.next=e,e.next=i,t.lastEffect=e),e}function wh(){return Ht().memoizedState}function or(e,t,a,i){var d=dn();Je.flags|=e,d.memoizedState=Zs(1|t,{destroy:void 0},a,i===void 0?null:i)}function ir(e,t,a,i){var d=Ht();i=i===void 0?null:i;var f=d.memoizedState.inst;yt!==null&&i!==null&&_c(i,yt.memoizedState.deps)?d.memoizedState=Zs(t,f,a,i):(Je.flags|=e,d.memoizedState=Zs(1|t,f,a,i))}function kh(e,t){or(8390656,8,e,t)}function zc(e,t){ir(2048,8,e,t)}function Gy(e){Je.flags|=4;var t=Je.updateQueue;if(t===null)t=nr(),Je.updateQueue=t,t.events=[e];else{var a=t.events;a===null?t.events=[e]:a.push(e)}}function Eh(e){var t=Ht().memoizedState;return Gy({ref:t,nextImpl:e}),function(){if((ut&2)!==0)throw Error(u(440));return t.impl.apply(void 0,arguments)}}function Ah(e,t){return ir(4,2,e,t)}function Sh(e,t){return ir(4,4,e,t)}function _h(e,t){if(typeof t=="function"){e=e();var a=t(e);return function(){typeof a=="function"?a():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function $h(e,t,a){a=a!=null?a.concat([e]):null,ir(4,4,_h.bind(null,t,e),a)}function Rc(){}function Dh(e,t){var a=Ht();t=t===void 0?null:t;var i=a.memoizedState;return t!==null&&_c(t,i[1])?i[0]:(a.memoizedState=[e,t],e)}function Nh(e,t){var a=Ht();t=t===void 0?null:t;var i=a.memoizedState;if(t!==null&&_c(t,i[1]))return i[0];if(i=e(),ds){rn(!0);try{e()}finally{rn(!1)}}return a.memoizedState=[i,t],i}function qc(e,t,a){return a===void 0||(ra&1073741824)!==0&&(nt&261930)===0?e.memoizedState=t:(e.memoizedState=a,e=Mf(),Je.lanes|=e,ja|=e,a)}function Th(e,t,a,i){return kn(a,t)?a:Vs.current!==null?(e=qc(e,a,i),kn(e,t)||(Gt=!0),e):(ra&42)===0||(ra&1073741824)!==0&&(nt&261930)===0?(Gt=!0,e.memoizedState=a):(e=Mf(),Je.lanes|=e,ja|=e,t)}function Mh(e,t,a,i,d){var f=$.p;$.p=f!==0&&8>f?f:8;var y=C.T,E={};C.T=E,Lc(e,!1,t,a);try{var j=d(),te=C.S;if(te!==null&&te(E,j),j!==null&&typeof j=="object"&&typeof j.then=="function"){var ue=qy(j,i);qo(e,t,ue,Dn(e))}else qo(e,t,i,Dn(e))}catch(ge){qo(e,t,{then:function(){},status:"rejected",reason:ge},Dn())}finally{$.p=f,y!==null&&E.types!==null&&(y.types=E.types),C.T=y}}function Yy(){}function Hc(e,t,a,i){if(e.tag!==5)throw Error(u(476));var d=Ch(e).queue;Mh(e,d,t,q,a===null?Yy:function(){return Oh(e),a(i)})}function Ch(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:q,baseState:q,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:la,lastRenderedState:q},next:null};var a={};return t.next={memoizedState:a,baseState:a,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:la,lastRenderedState:a},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function Oh(e){var t=Ch(e);t.next===null&&(t=e.alternate.memoizedState),qo(e,t.next.queue,{},Dn())}function Uc(){return nn(ti)}function Bh(){return Ht().memoizedState}function jh(){return Ht().memoizedState}function Py(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var a=Dn();e=Na(a);var i=Ta(t,e,a);i!==null&&(vn(i,t,a),Oo(i,t,a)),t={cache:mc()},e.payload=t;return}t=t.return}}function Vy(e,t,a){var i=Dn();a={lane:i,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null},rr(e)?Rh(t,a):(a=sc(e,t,a,i),a!==null&&(vn(a,e,i),qh(a,t,i)))}function zh(e,t,a){var i=Dn();qo(e,t,a,i)}function qo(e,t,a,i){var d={lane:i,revertLane:0,gesture:null,action:a,hasEagerState:!1,eagerState:null,next:null};if(rr(e))Rh(t,d);else{var f=e.alternate;if(e.lanes===0&&(f===null||f.lanes===0)&&(f=t.lastRenderedReducer,f!==null))try{var y=t.lastRenderedState,E=f(y,a);if(d.hasEagerState=!0,d.eagerState=E,kn(E,y))return Li(e,t,d,0),Et===null&&Ui(),!1}catch{}if(a=sc(e,t,d,i),a!==null)return vn(a,e,i),qh(a,t,i),!0}return!1}function Lc(e,t,a,i){if(i={lane:2,revertLane:vu(),gesture:null,action:i,hasEagerState:!1,eagerState:null,next:null},rr(e)){if(t)throw Error(u(479))}else t=sc(e,a,i,2),t!==null&&vn(t,e,2)}function rr(e){var t=e.alternate;return e===Je||t!==null&&t===Je}function Rh(e,t){Xs=er=!0;var a=e.pending;a===null?t.next=t:(t.next=a.next,a.next=t),e.pending=t}function qh(e,t,a){if((a&4194048)!==0){var i=t.lanes;i&=e.pendingLanes,a|=i,t.lanes=a,Gd(e,a)}}var Ho={readContext:nn,use:ar,useCallback:Ot,useContext:Ot,useEffect:Ot,useImperativeHandle:Ot,useLayoutEffect:Ot,useInsertionEffect:Ot,useMemo:Ot,useReducer:Ot,useRef:Ot,useState:Ot,useDebugValue:Ot,useDeferredValue:Ot,useTransition:Ot,useSyncExternalStore:Ot,useId:Ot,useHostTransitionStatus:Ot,useFormState:Ot,useActionState:Ot,useOptimistic:Ot,useMemoCache:Ot,useCacheRefresh:Ot};Ho.useEffectEvent=Ot;var Hh={readContext:nn,use:ar,useCallback:function(e,t){return dn().memoizedState=[e,t===void 0?null:t],e},useContext:nn,useEffect:kh,useImperativeHandle:function(e,t,a){a=a!=null?a.concat([e]):null,or(4194308,4,_h.bind(null,t,e),a)},useLayoutEffect:function(e,t){return or(4194308,4,e,t)},useInsertionEffect:function(e,t){or(4,2,e,t)},useMemo:function(e,t){var a=dn();t=t===void 0?null:t;var i=e();if(ds){rn(!0);try{e()}finally{rn(!1)}}return a.memoizedState=[i,t],i},useReducer:function(e,t,a){var i=dn();if(a!==void 0){var d=a(t);if(ds){rn(!0);try{a(t)}finally{rn(!1)}}}else d=t;return i.memoizedState=i.baseState=d,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:d},i.queue=e,e=e.dispatch=Vy.bind(null,Je,e),[i.memoizedState,e]},useRef:function(e){var t=dn();return e={current:e},t.memoizedState=e},useState:function(e){e=Bc(e);var t=e.queue,a=zh.bind(null,Je,t);return t.dispatch=a,[e.memoizedState,a]},useDebugValue:Rc,useDeferredValue:function(e,t){var a=dn();return qc(a,e,t)},useTransition:function(){var e=Bc(!1);return e=Mh.bind(null,Je,e.queue,!0,!1),dn().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,a){var i=Je,d=dn();if(st){if(a===void 0)throw Error(u(407));a=a()}else{if(a=t(),Et===null)throw Error(u(349));(nt&127)!==0||ih(i,t,a)}d.memoizedState=a;var f={value:a,getSnapshot:t};return d.queue=f,kh(lh.bind(null,i,f,e),[e]),i.flags|=2048,Zs(9,{destroy:void 0},rh.bind(null,i,f,a,t),null),a},useId:function(){var e=dn(),t=Et.identifierPrefix;if(st){var a=Qn,i=Xn;a=(i&~(1<<32-It(i)-1)).toString(32)+a,t="_"+t+"R_"+a,a=tr++,0<a&&(t+="H"+a.toString(32)),t+="_"}else a=Hy++,t="_"+t+"r_"+a.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:Uc,useFormState:yh,useActionState:yh,useOptimistic:function(e){var t=dn();t.memoizedState=t.baseState=e;var a={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=a,t=Lc.bind(null,Je,!0,a),a.dispatch=t,[e,t]},useMemoCache:Mc,useCacheRefresh:function(){return dn().memoizedState=Py.bind(null,Je)},useEffectEvent:function(e){var t=dn(),a={impl:e};return t.memoizedState=a,function(){if((ut&2)!==0)throw Error(u(440));return a.impl.apply(void 0,arguments)}}},Fc={readContext:nn,use:ar,useCallback:Dh,useContext:nn,useEffect:zc,useImperativeHandle:$h,useInsertionEffect:Ah,useLayoutEffect:Sh,useMemo:Nh,useReducer:sr,useRef:wh,useState:function(){return sr(la)},useDebugValue:Rc,useDeferredValue:function(e,t){var a=Ht();return Th(a,yt.memoizedState,e,t)},useTransition:function(){var e=sr(la)[0],t=Ht().memoizedState;return[typeof e=="boolean"?e:Ro(e),t]},useSyncExternalStore:oh,useId:Bh,useHostTransitionStatus:Uc,useFormState:bh,useActionState:bh,useOptimistic:function(e,t){var a=Ht();return dh(a,yt,e,t)},useMemoCache:Mc,useCacheRefresh:jh};Fc.useEffectEvent=Eh;var Uh={readContext:nn,use:ar,useCallback:Dh,useContext:nn,useEffect:zc,useImperativeHandle:$h,useInsertionEffect:Ah,useLayoutEffect:Sh,useMemo:Nh,useReducer:Oc,useRef:wh,useState:function(){return Oc(la)},useDebugValue:Rc,useDeferredValue:function(e,t){var a=Ht();return yt===null?qc(a,e,t):Th(a,yt.memoizedState,e,t)},useTransition:function(){var e=Oc(la)[0],t=Ht().memoizedState;return[typeof e=="boolean"?e:Ro(e),t]},useSyncExternalStore:oh,useId:Bh,useHostTransitionStatus:Uc,useFormState:xh,useActionState:xh,useOptimistic:function(e,t){var a=Ht();return yt!==null?dh(a,yt,e,t):(a.baseState=e,[e,a.queue.dispatch])},useMemoCache:Mc,useCacheRefresh:jh};Uh.useEffectEvent=Eh;function Gc(e,t,a,i){t=e.memoizedState,a=a(i,t),a=a==null?t:x({},t,a),e.memoizedState=a,e.lanes===0&&(e.updateQueue.baseState=a)}var Yc={enqueueSetState:function(e,t,a){e=e._reactInternals;var i=Dn(),d=Na(i);d.payload=t,a!=null&&(d.callback=a),t=Ta(e,d,i),t!==null&&(vn(t,e,i),Oo(t,e,i))},enqueueReplaceState:function(e,t,a){e=e._reactInternals;var i=Dn(),d=Na(i);d.tag=1,d.payload=t,a!=null&&(d.callback=a),t=Ta(e,d,i),t!==null&&(vn(t,e,i),Oo(t,e,i))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var a=Dn(),i=Na(a);i.tag=2,t!=null&&(i.callback=t),t=Ta(e,i,a),t!==null&&(vn(t,e,a),Oo(t,e,a))}};function Lh(e,t,a,i,d,f,y){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(i,f,y):t.prototype&&t.prototype.isPureReactComponent?!So(a,i)||!So(d,f):!0}function Fh(e,t,a,i){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(a,i),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(a,i),t.state!==e&&Yc.enqueueReplaceState(t,t.state,null)}function ps(e,t){var a=t;if("ref"in t){a={};for(var i in t)i!=="ref"&&(a[i]=t[i])}if(e=e.defaultProps){a===t&&(a=x({},a));for(var d in e)a[d]===void 0&&(a[d]=e[d])}return a}function Gh(e){Hi(e)}function Yh(e){console.error(e)}function Ph(e){Hi(e)}function lr(e,t){try{var a=e.onUncaughtError;a(t.value,{componentStack:t.stack})}catch(i){setTimeout(function(){throw i})}}function Vh(e,t,a){try{var i=e.onCaughtError;i(a.value,{componentStack:a.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(d){setTimeout(function(){throw d})}}function Pc(e,t,a){return a=Na(a),a.tag=3,a.payload={element:null},a.callback=function(){lr(e,t)},a}function Xh(e){return e=Na(e),e.tag=3,e}function Qh(e,t,a,i){var d=a.type.getDerivedStateFromError;if(typeof d=="function"){var f=i.value;e.payload=function(){return d(f)},e.callback=function(){Vh(t,a,i)}}var y=a.stateNode;y!==null&&typeof y.componentDidCatch=="function"&&(e.callback=function(){Vh(t,a,i),typeof d!="function"&&(za===null?za=new Set([this]):za.add(this));var E=i.stack;this.componentDidCatch(i.value,{componentStack:E!==null?E:""})})}function Xy(e,t,a,i,d){if(a.flags|=32768,i!==null&&typeof i=="object"&&typeof i.then=="function"){if(t=a.alternate,t!==null&&Ls(t,a,d,!0),a=An.current,a!==null){switch(a.tag){case 31:case 13:return Rn===null?xr():a.alternate===null&&Bt===0&&(Bt=3),a.flags&=-257,a.flags|=65536,a.lanes=d,i===Zi?a.flags|=16384:(t=a.updateQueue,t===null?a.updateQueue=new Set([i]):t.add(i),gu(e,i,d)),!1;case 22:return a.flags|=65536,i===Zi?a.flags|=16384:(t=a.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([i])},a.updateQueue=t):(a=t.retryQueue,a===null?t.retryQueue=new Set([i]):a.add(i)),gu(e,i,d)),!1}throw Error(u(435,a.tag))}return gu(e,i,d),xr(),!1}if(st)return t=An.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=d,i!==uc&&(e=Error(u(422),{cause:i}),Do(On(e,a)))):(i!==uc&&(t=Error(u(423),{cause:i}),Do(On(t,a))),e=e.current.alternate,e.flags|=65536,d&=-d,e.lanes|=d,i=On(i,a),d=Pc(e.stateNode,i,d),wc(e,d),Bt!==4&&(Bt=2)),!1;var f=Error(u(520),{cause:i});if(f=On(f,a),Xo===null?Xo=[f]:Xo.push(f),Bt!==4&&(Bt=2),t===null)return!0;i=On(i,a),a=t;do{switch(a.tag){case 3:return a.flags|=65536,e=d&-d,a.lanes|=e,e=Pc(a.stateNode,i,e),wc(a,e),!1;case 1:if(t=a.type,f=a.stateNode,(a.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||f!==null&&typeof f.componentDidCatch=="function"&&(za===null||!za.has(f))))return a.flags|=65536,d&=-d,a.lanes|=d,d=Xh(d),Qh(d,e,a,i),wc(a,d),!1}a=a.return}while(a!==null);return!1}var Vc=Error(u(461)),Gt=!1;function an(e,t,a,i){t.child=e===null?Wp(t,null,a,i):us(t,e.child,a,i)}function Zh(e,t,a,i,d){a=a.render;var f=t.ref;if("ref"in i){var y={};for(var E in i)E!=="ref"&&(y[E]=i[E])}else y=i;return is(t),i=$c(e,t,a,y,f,d),E=Dc(),e!==null&&!Gt?(Nc(e,t,d),ca(e,t,d)):(st&&E&&lc(t),t.flags|=1,an(e,t,i,d),t.child)}function Jh(e,t,a,i,d){if(e===null){var f=a.type;return typeof f=="function"&&!oc(f)&&f.defaultProps===void 0&&a.compare===null?(t.tag=15,t.type=f,Kh(e,t,f,i,d)):(e=Gi(a.type,null,i,t,t.mode,d),e.ref=t.ref,e.return=t,t.child=e)}if(f=e.child,!eu(e,d)){var y=f.memoizedProps;if(a=a.compare,a=a!==null?a:So,a(y,i)&&e.ref===t.ref)return ca(e,t,d)}return t.flags|=1,e=aa(f,i),e.ref=t.ref,e.return=t,t.child=e}function Kh(e,t,a,i,d){if(e!==null){var f=e.memoizedProps;if(So(f,i)&&e.ref===t.ref)if(Gt=!1,t.pendingProps=i=f,eu(e,d))(e.flags&131072)!==0&&(Gt=!0);else return t.lanes=e.lanes,ca(e,t,d)}return Xc(e,t,a,i,d)}function Wh(e,t,a,i){var d=i.children,f=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),i.mode==="hidden"){if((t.flags&128)!==0){if(f=f!==null?f.baseLanes|a:a,e!==null){for(i=t.child=e.child,d=0;i!==null;)d=d|i.lanes|i.childLanes,i=i.sibling;i=d&~f}else i=0,t.child=null;return Ih(e,t,f,a,i)}if((a&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Xi(t,f!==null?f.cachePool:null),f!==null?th(t,f):Ec(),nh(t);else return i=t.lanes=536870912,Ih(e,t,f!==null?f.baseLanes|a:a,a,i)}else f!==null?(Xi(t,f.cachePool),th(t,f),Ca(),t.memoizedState=null):(e!==null&&Xi(t,null),Ec(),Ca());return an(e,t,d,a),t.child}function Uo(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Ih(e,t,a,i,d){var f=yc();return f=f===null?null:{parent:Lt._currentValue,pool:f},t.memoizedState={baseLanes:a,cachePool:f},e!==null&&Xi(t,null),Ec(),nh(t),e!==null&&Ls(e,t,i,!0),t.childLanes=d,null}function cr(e,t){return t=dr({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function ef(e,t,a){return us(t,e.child,null,a),e=cr(t,t.pendingProps),e.flags|=2,Sn(t),t.memoizedState=null,e}function Qy(e,t,a){var i=t.pendingProps,d=(t.flags&128)!==0;if(t.flags&=-129,e===null){if(st){if(i.mode==="hidden")return e=cr(t,i),t.lanes=536870912,Uo(null,e);if(Sc(t),(e=St)?(e=hm(e,zn),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Aa!==null?{id:Xn,overflow:Qn}:null,retryLane:536870912,hydrationErrors:null},a=Rp(e),a.return=t,t.child=a,tn=t,St=null)):e=null,e===null)throw _a(t);return t.lanes=536870912,null}return cr(t,i)}var f=e.memoizedState;if(f!==null){var y=f.dehydrated;if(Sc(t),d)if(t.flags&256)t.flags&=-257,t=ef(e,t,a);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(u(558));else if(Gt||Ls(e,t,a,!1),d=(a&e.childLanes)!==0,Gt||d){if(i=Et,i!==null&&(y=Yd(i,a),y!==0&&y!==f.retryLane))throw f.retryLane=y,ns(e,y),vn(i,e,y),Vc;xr(),t=ef(e,t,a)}else e=f.treeContext,St=qn(y.nextSibling),tn=t,st=!0,Sa=null,zn=!1,e!==null&&Up(t,e),t=cr(t,i),t.flags|=4096;return t}return e=aa(e.child,{mode:i.mode,children:i.children}),e.ref=t.ref,t.child=e,e.return=t,e}function ur(e,t){var a=t.ref;if(a===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof a!="function"&&typeof a!="object")throw Error(u(284));(e===null||e.ref!==a)&&(t.flags|=4194816)}}function Xc(e,t,a,i,d){return is(t),a=$c(e,t,a,i,void 0,d),i=Dc(),e!==null&&!Gt?(Nc(e,t,d),ca(e,t,d)):(st&&i&&lc(t),t.flags|=1,an(e,t,a,d),t.child)}function tf(e,t,a,i,d,f){return is(t),t.updateQueue=null,a=sh(t,i,a,d),ah(e),i=Dc(),e!==null&&!Gt?(Nc(e,t,f),ca(e,t,f)):(st&&i&&lc(t),t.flags|=1,an(e,t,a,f),t.child)}function nf(e,t,a,i,d){if(is(t),t.stateNode===null){var f=Rs,y=a.contextType;typeof y=="object"&&y!==null&&(f=nn(y)),f=new a(i,f),t.memoizedState=f.state!==null&&f.state!==void 0?f.state:null,f.updater=Yc,t.stateNode=f,f._reactInternals=t,f=t.stateNode,f.props=i,f.state=t.memoizedState,f.refs={},vc(t),y=a.contextType,f.context=typeof y=="object"&&y!==null?nn(y):Rs,f.state=t.memoizedState,y=a.getDerivedStateFromProps,typeof y=="function"&&(Gc(t,a,y,i),f.state=t.memoizedState),typeof a.getDerivedStateFromProps=="function"||typeof f.getSnapshotBeforeUpdate=="function"||typeof f.UNSAFE_componentWillMount!="function"&&typeof f.componentWillMount!="function"||(y=f.state,typeof f.componentWillMount=="function"&&f.componentWillMount(),typeof f.UNSAFE_componentWillMount=="function"&&f.UNSAFE_componentWillMount(),y!==f.state&&Yc.enqueueReplaceState(f,f.state,null),jo(t,i,f,d),Bo(),f.state=t.memoizedState),typeof f.componentDidMount=="function"&&(t.flags|=4194308),i=!0}else if(e===null){f=t.stateNode;var E=t.memoizedProps,j=ps(a,E);f.props=j;var te=f.context,ue=a.contextType;y=Rs,typeof ue=="object"&&ue!==null&&(y=nn(ue));var ge=a.getDerivedStateFromProps;ue=typeof ge=="function"||typeof f.getSnapshotBeforeUpdate=="function",E=t.pendingProps!==E,ue||typeof f.UNSAFE_componentWillReceiveProps!="function"&&typeof f.componentWillReceiveProps!="function"||(E||te!==y)&&Fh(t,f,i,y),Da=!1;var ne=t.memoizedState;f.state=ne,jo(t,i,f,d),Bo(),te=t.memoizedState,E||ne!==te||Da?(typeof ge=="function"&&(Gc(t,a,ge,i),te=t.memoizedState),(j=Da||Lh(t,a,j,i,ne,te,y))?(ue||typeof f.UNSAFE_componentWillMount!="function"&&typeof f.componentWillMount!="function"||(typeof f.componentWillMount=="function"&&f.componentWillMount(),typeof f.UNSAFE_componentWillMount=="function"&&f.UNSAFE_componentWillMount()),typeof f.componentDidMount=="function"&&(t.flags|=4194308)):(typeof f.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=i,t.memoizedState=te),f.props=i,f.state=te,f.context=y,i=j):(typeof f.componentDidMount=="function"&&(t.flags|=4194308),i=!1)}else{f=t.stateNode,xc(e,t),y=t.memoizedProps,ue=ps(a,y),f.props=ue,ge=t.pendingProps,ne=f.context,te=a.contextType,j=Rs,typeof te=="object"&&te!==null&&(j=nn(te)),E=a.getDerivedStateFromProps,(te=typeof E=="function"||typeof f.getSnapshotBeforeUpdate=="function")||typeof f.UNSAFE_componentWillReceiveProps!="function"&&typeof f.componentWillReceiveProps!="function"||(y!==ge||ne!==j)&&Fh(t,f,i,j),Da=!1,ne=t.memoizedState,f.state=ne,jo(t,i,f,d),Bo();var ie=t.memoizedState;y!==ge||ne!==ie||Da||e!==null&&e.dependencies!==null&&Pi(e.dependencies)?(typeof E=="function"&&(Gc(t,a,E,i),ie=t.memoizedState),(ue=Da||Lh(t,a,ue,i,ne,ie,j)||e!==null&&e.dependencies!==null&&Pi(e.dependencies))?(te||typeof f.UNSAFE_componentWillUpdate!="function"&&typeof f.componentWillUpdate!="function"||(typeof f.componentWillUpdate=="function"&&f.componentWillUpdate(i,ie,j),typeof f.UNSAFE_componentWillUpdate=="function"&&f.UNSAFE_componentWillUpdate(i,ie,j)),typeof f.componentDidUpdate=="function"&&(t.flags|=4),typeof f.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof f.componentDidUpdate!="function"||y===e.memoizedProps&&ne===e.memoizedState||(t.flags|=4),typeof f.getSnapshotBeforeUpdate!="function"||y===e.memoizedProps&&ne===e.memoizedState||(t.flags|=1024),t.memoizedProps=i,t.memoizedState=ie),f.props=i,f.state=ie,f.context=j,i=ue):(typeof f.componentDidUpdate!="function"||y===e.memoizedProps&&ne===e.memoizedState||(t.flags|=4),typeof f.getSnapshotBeforeUpdate!="function"||y===e.memoizedProps&&ne===e.memoizedState||(t.flags|=1024),i=!1)}return f=i,ur(e,t),i=(t.flags&128)!==0,f||i?(f=t.stateNode,a=i&&typeof a.getDerivedStateFromError!="function"?null:f.render(),t.flags|=1,e!==null&&i?(t.child=us(t,e.child,null,d),t.child=us(t,null,a,d)):an(e,t,a,d),t.memoizedState=f.state,e=t.child):e=ca(e,t,d),e}function af(e,t,a,i){return ss(),t.flags|=256,an(e,t,a,i),t.child}var Qc={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Zc(e){return{baseLanes:e,cachePool:Vp()}}function Jc(e,t,a){return e=e!==null?e.childLanes&~a:0,t&&(e|=$n),e}function sf(e,t,a){var i=t.pendingProps,d=!1,f=(t.flags&128)!==0,y;if((y=f)||(y=e!==null&&e.memoizedState===null?!1:(qt.current&2)!==0),y&&(d=!0,t.flags&=-129),y=(t.flags&32)!==0,t.flags&=-33,e===null){if(st){if(d?Ma(t):Ca(),(e=St)?(e=hm(e,zn),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Aa!==null?{id:Xn,overflow:Qn}:null,retryLane:536870912,hydrationErrors:null},a=Rp(e),a.return=t,t.child=a,tn=t,St=null)):e=null,e===null)throw _a(t);return Cu(e)?t.lanes=32:t.lanes=536870912,null}var E=i.children;return i=i.fallback,d?(Ca(),d=t.mode,E=dr({mode:"hidden",children:E},d),i=as(i,d,a,null),E.return=t,i.return=t,E.sibling=i,t.child=E,i=t.child,i.memoizedState=Zc(a),i.childLanes=Jc(e,y,a),t.memoizedState=Qc,Uo(null,i)):(Ma(t),Kc(t,E))}var j=e.memoizedState;if(j!==null&&(E=j.dehydrated,E!==null)){if(f)t.flags&256?(Ma(t),t.flags&=-257,t=Wc(e,t,a)):t.memoizedState!==null?(Ca(),t.child=e.child,t.flags|=128,t=null):(Ca(),E=i.fallback,d=t.mode,i=dr({mode:"visible",children:i.children},d),E=as(E,d,a,null),E.flags|=2,i.return=t,E.return=t,i.sibling=E,t.child=i,us(t,e.child,null,a),i=t.child,i.memoizedState=Zc(a),i.childLanes=Jc(e,y,a),t.memoizedState=Qc,t=Uo(null,i));else if(Ma(t),Cu(E)){if(y=E.nextSibling&&E.nextSibling.dataset,y)var te=y.dgst;y=te,i=Error(u(419)),i.stack="",i.digest=y,Do({value:i,source:null,stack:null}),t=Wc(e,t,a)}else if(Gt||Ls(e,t,a,!1),y=(a&e.childLanes)!==0,Gt||y){if(y=Et,y!==null&&(i=Yd(y,a),i!==0&&i!==j.retryLane))throw j.retryLane=i,ns(e,i),vn(y,e,i),Vc;Mu(E)||xr(),t=Wc(e,t,a)}else Mu(E)?(t.flags|=192,t.child=e.child,t=null):(e=j.treeContext,St=qn(E.nextSibling),tn=t,st=!0,Sa=null,zn=!1,e!==null&&Up(t,e),t=Kc(t,i.children),t.flags|=4096);return t}return d?(Ca(),E=i.fallback,d=t.mode,j=e.child,te=j.sibling,i=aa(j,{mode:"hidden",children:i.children}),i.subtreeFlags=j.subtreeFlags&65011712,te!==null?E=aa(te,E):(E=as(E,d,a,null),E.flags|=2),E.return=t,i.return=t,i.sibling=E,t.child=i,Uo(null,i),i=t.child,E=e.child.memoizedState,E===null?E=Zc(a):(d=E.cachePool,d!==null?(j=Lt._currentValue,d=d.parent!==j?{parent:j,pool:j}:d):d=Vp(),E={baseLanes:E.baseLanes|a,cachePool:d}),i.memoizedState=E,i.childLanes=Jc(e,y,a),t.memoizedState=Qc,Uo(e.child,i)):(Ma(t),a=e.child,e=a.sibling,a=aa(a,{mode:"visible",children:i.children}),a.return=t,a.sibling=null,e!==null&&(y=t.deletions,y===null?(t.deletions=[e],t.flags|=16):y.push(e)),t.child=a,t.memoizedState=null,a)}function Kc(e,t){return t=dr({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function dr(e,t){return e=En(22,e,null,t),e.lanes=0,e}function Wc(e,t,a){return us(t,e.child,null,a),e=Kc(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function of(e,t,a){e.lanes|=t;var i=e.alternate;i!==null&&(i.lanes|=t),hc(e.return,t,a)}function Ic(e,t,a,i,d,f){var y=e.memoizedState;y===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:i,tail:a,tailMode:d,treeForkCount:f}:(y.isBackwards=t,y.rendering=null,y.renderingStartTime=0,y.last=i,y.tail=a,y.tailMode=d,y.treeForkCount=f)}function rf(e,t,a){var i=t.pendingProps,d=i.revealOrder,f=i.tail;i=i.children;var y=qt.current,E=(y&2)!==0;if(E?(y=y&1|2,t.flags|=128):y&=1,K(qt,y),an(e,t,i,a),i=st?$o:0,!E&&e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&of(e,a,t);else if(e.tag===19)of(e,a,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(d){case"forwards":for(a=t.child,d=null;a!==null;)e=a.alternate,e!==null&&Ii(e)===null&&(d=a),a=a.sibling;a=d,a===null?(d=t.child,t.child=null):(d=a.sibling,a.sibling=null),Ic(t,!1,d,a,f,i);break;case"backwards":case"unstable_legacy-backwards":for(a=null,d=t.child,t.child=null;d!==null;){if(e=d.alternate,e!==null&&Ii(e)===null){t.child=d;break}e=d.sibling,d.sibling=a,a=d,d=e}Ic(t,!0,a,null,f,i);break;case"together":Ic(t,!1,null,null,void 0,i);break;default:t.memoizedState=null}return t.child}function ca(e,t,a){if(e!==null&&(t.dependencies=e.dependencies),ja|=t.lanes,(a&t.childLanes)===0)if(e!==null){if(Ls(e,t,a,!1),(a&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(u(153));if(t.child!==null){for(e=t.child,a=aa(e,e.pendingProps),t.child=a,a.return=t;e.sibling!==null;)e=e.sibling,a=a.sibling=aa(e,e.pendingProps),a.return=t;a.sibling=null}return t.child}function eu(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&Pi(e)))}function Zy(e,t,a){switch(t.tag){case 3:Le(t,t.stateNode.containerInfo),$a(t,Lt,e.memoizedState.cache),ss();break;case 27:case 5:Ze(t);break;case 4:Le(t,t.stateNode.containerInfo);break;case 10:$a(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,Sc(t),null;break;case 13:var i=t.memoizedState;if(i!==null)return i.dehydrated!==null?(Ma(t),t.flags|=128,null):(a&t.child.childLanes)!==0?sf(e,t,a):(Ma(t),e=ca(e,t,a),e!==null?e.sibling:null);Ma(t);break;case 19:var d=(e.flags&128)!==0;if(i=(a&t.childLanes)!==0,i||(Ls(e,t,a,!1),i=(a&t.childLanes)!==0),d){if(i)return rf(e,t,a);t.flags|=128}if(d=t.memoizedState,d!==null&&(d.rendering=null,d.tail=null,d.lastEffect=null),K(qt,qt.current),i)break;return null;case 22:return t.lanes=0,Wh(e,t,a,t.pendingProps);case 24:$a(t,Lt,e.memoizedState.cache)}return ca(e,t,a)}function lf(e,t,a){if(e!==null)if(e.memoizedProps!==t.pendingProps)Gt=!0;else{if(!eu(e,a)&&(t.flags&128)===0)return Gt=!1,Zy(e,t,a);Gt=(e.flags&131072)!==0}else Gt=!1,st&&(t.flags&1048576)!==0&&Hp(t,$o,t.index);switch(t.lanes=0,t.tag){case 16:e:{var i=t.pendingProps;if(e=ls(t.elementType),t.type=e,typeof e=="function")oc(e)?(i=ps(e,i),t.tag=1,t=nf(null,t,e,i,a)):(t.tag=0,t=Xc(null,t,e,i,a));else{if(e!=null){var d=e.$$typeof;if(d===ae){t.tag=11,t=Zh(null,t,e,i,a);break e}else if(d===J){t.tag=14,t=Jh(null,t,e,i,a);break e}}throw t=Oe(e)||e,Error(u(306,t,""))}}return t;case 0:return Xc(e,t,t.type,t.pendingProps,a);case 1:return i=t.type,d=ps(i,t.pendingProps),nf(e,t,i,d,a);case 3:e:{if(Le(t,t.stateNode.containerInfo),e===null)throw Error(u(387));i=t.pendingProps;var f=t.memoizedState;d=f.element,xc(e,t),jo(t,i,null,a);var y=t.memoizedState;if(i=y.cache,$a(t,Lt,i),i!==f.cache&&fc(t,[Lt],a,!0),Bo(),i=y.element,f.isDehydrated)if(f={element:i,isDehydrated:!1,cache:y.cache},t.updateQueue.baseState=f,t.memoizedState=f,t.flags&256){t=af(e,t,i,a);break e}else if(i!==d){d=On(Error(u(424)),t),Do(d),t=af(e,t,i,a);break e}else for(e=t.stateNode.containerInfo,e.nodeType===9?e=e.body:e=e.nodeName==="HTML"?e.ownerDocument.body:e,St=qn(e.firstChild),tn=t,st=!0,Sa=null,zn=!0,a=Wp(t,null,i,a),t.child=a;a;)a.flags=a.flags&-3|4096,a=a.sibling;else{if(ss(),i===d){t=ca(e,t,a);break e}an(e,t,i,a)}t=t.child}return t;case 26:return ur(e,t),e===null?(a=vm(t.type,null,t.pendingProps,null))?t.memoizedState=a:st||(a=t.type,e=t.pendingProps,i=$r(De.current).createElement(a),i[en]=t,i[hn]=e,sn(i,a,e),Jt(i),t.stateNode=i):t.memoizedState=vm(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return Ze(t),e===null&&st&&(i=t.stateNode=gm(t.type,t.pendingProps,De.current),tn=t,zn=!0,d=St,Ua(t.type)?(Ou=d,St=qn(i.firstChild)):St=d),an(e,t,t.pendingProps.children,a),ur(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&st&&((d=i=St)&&(i=Sb(i,t.type,t.pendingProps,zn),i!==null?(t.stateNode=i,tn=t,St=qn(i.firstChild),zn=!1,d=!0):d=!1),d||_a(t)),Ze(t),d=t.type,f=t.pendingProps,y=e!==null?e.memoizedProps:null,i=f.children,Du(d,f)?i=null:y!==null&&Du(d,y)&&(t.flags|=32),t.memoizedState!==null&&(d=$c(e,t,Uy,null,null,a),ti._currentValue=d),ur(e,t),an(e,t,i,a),t.child;case 6:return e===null&&st&&((e=a=St)&&(a=_b(a,t.pendingProps,zn),a!==null?(t.stateNode=a,tn=t,St=null,e=!0):e=!1),e||_a(t)),null;case 13:return sf(e,t,a);case 4:return Le(t,t.stateNode.containerInfo),i=t.pendingProps,e===null?t.child=us(t,null,i,a):an(e,t,i,a),t.child;case 11:return Zh(e,t,t.type,t.pendingProps,a);case 7:return an(e,t,t.pendingProps,a),t.child;case 8:return an(e,t,t.pendingProps.children,a),t.child;case 12:return an(e,t,t.pendingProps.children,a),t.child;case 10:return i=t.pendingProps,$a(t,t.type,i.value),an(e,t,i.children,a),t.child;case 9:return d=t.type._context,i=t.pendingProps.children,is(t),d=nn(d),i=i(d),t.flags|=1,an(e,t,i,a),t.child;case 14:return Jh(e,t,t.type,t.pendingProps,a);case 15:return Kh(e,t,t.type,t.pendingProps,a);case 19:return rf(e,t,a);case 31:return Qy(e,t,a);case 22:return Wh(e,t,a,t.pendingProps);case 24:return is(t),i=nn(Lt),e===null?(d=yc(),d===null&&(d=Et,f=mc(),d.pooledCache=f,f.refCount++,f!==null&&(d.pooledCacheLanes|=a),d=f),t.memoizedState={parent:i,cache:d},vc(t),$a(t,Lt,d)):((e.lanes&a)!==0&&(xc(e,t),jo(t,null,null,a),Bo()),d=e.memoizedState,f=t.memoizedState,d.parent!==i?(d={parent:i,cache:i},t.memoizedState=d,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=d),$a(t,Lt,i)):(i=f.cache,$a(t,Lt,i),i!==d.cache&&fc(t,[Lt],a,!0))),an(e,t,t.pendingProps.children,a),t.child;case 29:throw t.pendingProps}throw Error(u(156,t.tag))}function ua(e){e.flags|=4}function tu(e,t,a,i,d){if((t=(e.mode&32)!==0)&&(t=!1),t){if(e.flags|=16777216,(d&335544128)===d)if(e.stateNode.complete)e.flags|=8192;else if(jf())e.flags|=8192;else throw cs=Zi,bc}else e.flags&=-16777217}function cf(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!Am(t))if(jf())e.flags|=8192;else throw cs=Zi,bc}function pr(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?kt():536870912,e.lanes|=t,Is|=t)}function Lo(e,t){if(!st)switch(e.tailMode){case"hidden":t=e.tail;for(var a=null;t!==null;)t.alternate!==null&&(a=t),t=t.sibling;a===null?e.tail=null:a.sibling=null;break;case"collapsed":a=e.tail;for(var i=null;a!==null;)a.alternate!==null&&(i=a),a=a.sibling;i===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:i.sibling=null}}function _t(e){var t=e.alternate!==null&&e.alternate.child===e.child,a=0,i=0;if(t)for(var d=e.child;d!==null;)a|=d.lanes|d.childLanes,i|=d.subtreeFlags&65011712,i|=d.flags&65011712,d.return=e,d=d.sibling;else for(d=e.child;d!==null;)a|=d.lanes|d.childLanes,i|=d.subtreeFlags,i|=d.flags,d.return=e,d=d.sibling;return e.subtreeFlags|=i,e.childLanes=a,t}function Jy(e,t,a){var i=t.pendingProps;switch(cc(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return _t(t),null;case 1:return _t(t),null;case 3:return a=t.stateNode,i=null,e!==null&&(i=e.memoizedState.cache),t.memoizedState.cache!==i&&(t.flags|=2048),ia(Lt),ze(),a.pendingContext&&(a.context=a.pendingContext,a.pendingContext=null),(e===null||e.child===null)&&(Us(t)?ua(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,dc())),_t(t),null;case 26:var d=t.type,f=t.memoizedState;return e===null?(ua(t),f!==null?(_t(t),cf(t,f)):(_t(t),tu(t,d,null,i,a))):f?f!==e.memoizedState?(ua(t),_t(t),cf(t,f)):(_t(t),t.flags&=-16777217):(e=e.memoizedProps,e!==i&&ua(t),_t(t),tu(t,d,e,i,a)),null;case 27:if(U(t),a=De.current,d=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&ua(t);else{if(!i){if(t.stateNode===null)throw Error(u(166));return _t(t),null}e=pe.current,Us(t)?Lp(t):(e=gm(d,i,a),t.stateNode=e,ua(t))}return _t(t),null;case 5:if(U(t),d=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&ua(t);else{if(!i){if(t.stateNode===null)throw Error(u(166));return _t(t),null}if(f=pe.current,Us(t))Lp(t);else{var y=$r(De.current);switch(f){case 1:f=y.createElementNS("http://www.w3.org/2000/svg",d);break;case 2:f=y.createElementNS("http://www.w3.org/1998/Math/MathML",d);break;default:switch(d){case"svg":f=y.createElementNS("http://www.w3.org/2000/svg",d);break;case"math":f=y.createElementNS("http://www.w3.org/1998/Math/MathML",d);break;case"script":f=y.createElement("div"),f.innerHTML="<script><\/script>",f=f.removeChild(f.firstChild);break;case"select":f=typeof i.is=="string"?y.createElement("select",{is:i.is}):y.createElement("select"),i.multiple?f.multiple=!0:i.size&&(f.size=i.size);break;default:f=typeof i.is=="string"?y.createElement(d,{is:i.is}):y.createElement(d)}}f[en]=t,f[hn]=i;e:for(y=t.child;y!==null;){if(y.tag===5||y.tag===6)f.appendChild(y.stateNode);else if(y.tag!==4&&y.tag!==27&&y.child!==null){y.child.return=y,y=y.child;continue}if(y===t)break e;for(;y.sibling===null;){if(y.return===null||y.return===t)break e;y=y.return}y.sibling.return=y.return,y=y.sibling}t.stateNode=f;e:switch(sn(f,d,i),d){case"button":case"input":case"select":case"textarea":i=!!i.autoFocus;break e;case"img":i=!0;break e;default:i=!1}i&&ua(t)}}return _t(t),tu(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,a),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==i&&ua(t);else{if(typeof i!="string"&&t.stateNode===null)throw Error(u(166));if(e=De.current,Us(t)){if(e=t.stateNode,a=t.memoizedProps,i=null,d=tn,d!==null)switch(d.tag){case 27:case 5:i=d.memoizedProps}e[en]=t,e=!!(e.nodeValue===a||i!==null&&i.suppressHydrationWarning===!0||om(e.nodeValue,a)),e||_a(t,!0)}else e=$r(e).createTextNode(i),e[en]=t,t.stateNode=e}return _t(t),null;case 31:if(a=t.memoizedState,e===null||e.memoizedState!==null){if(i=Us(t),a!==null){if(e===null){if(!i)throw Error(u(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(u(557));e[en]=t}else ss(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;_t(t),e=!1}else a=dc(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=a),e=!0;if(!e)return t.flags&256?(Sn(t),t):(Sn(t),null);if((t.flags&128)!==0)throw Error(u(558))}return _t(t),null;case 13:if(i=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(d=Us(t),i!==null&&i.dehydrated!==null){if(e===null){if(!d)throw Error(u(318));if(d=t.memoizedState,d=d!==null?d.dehydrated:null,!d)throw Error(u(317));d[en]=t}else ss(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;_t(t),d=!1}else d=dc(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=d),d=!0;if(!d)return t.flags&256?(Sn(t),t):(Sn(t),null)}return Sn(t),(t.flags&128)!==0?(t.lanes=a,t):(a=i!==null,e=e!==null&&e.memoizedState!==null,a&&(i=t.child,d=null,i.alternate!==null&&i.alternate.memoizedState!==null&&i.alternate.memoizedState.cachePool!==null&&(d=i.alternate.memoizedState.cachePool.pool),f=null,i.memoizedState!==null&&i.memoizedState.cachePool!==null&&(f=i.memoizedState.cachePool.pool),f!==d&&(i.flags|=2048)),a!==e&&a&&(t.child.flags|=8192),pr(t,t.updateQueue),_t(t),null);case 4:return ze(),e===null&&Eu(t.stateNode.containerInfo),_t(t),null;case 10:return ia(t.type),_t(t),null;case 19:if(H(qt),i=t.memoizedState,i===null)return _t(t),null;if(d=(t.flags&128)!==0,f=i.rendering,f===null)if(d)Lo(i,!1);else{if(Bt!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(f=Ii(e),f!==null){for(t.flags|=128,Lo(i,!1),e=f.updateQueue,t.updateQueue=e,pr(t,e),t.subtreeFlags=0,e=a,a=t.child;a!==null;)zp(a,e),a=a.sibling;return K(qt,qt.current&1|2),st&&sa(t,i.treeForkCount),t.child}e=e.sibling}i.tail!==null&&Be()>yr&&(t.flags|=128,d=!0,Lo(i,!1),t.lanes=4194304)}else{if(!d)if(e=Ii(f),e!==null){if(t.flags|=128,d=!0,e=e.updateQueue,t.updateQueue=e,pr(t,e),Lo(i,!0),i.tail===null&&i.tailMode==="hidden"&&!f.alternate&&!st)return _t(t),null}else 2*Be()-i.renderingStartTime>yr&&a!==536870912&&(t.flags|=128,d=!0,Lo(i,!1),t.lanes=4194304);i.isBackwards?(f.sibling=t.child,t.child=f):(e=i.last,e!==null?e.sibling=f:t.child=f,i.last=f)}return i.tail!==null?(e=i.tail,i.rendering=e,i.tail=e.sibling,i.renderingStartTime=Be(),e.sibling=null,a=qt.current,K(qt,d?a&1|2:a&1),st&&sa(t,i.treeForkCount),e):(_t(t),null);case 22:case 23:return Sn(t),Ac(),i=t.memoizedState!==null,e!==null?e.memoizedState!==null!==i&&(t.flags|=8192):i&&(t.flags|=8192),i?(a&536870912)!==0&&(t.flags&128)===0&&(_t(t),t.subtreeFlags&6&&(t.flags|=8192)):_t(t),a=t.updateQueue,a!==null&&pr(t,a.retryQueue),a=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(a=e.memoizedState.cachePool.pool),i=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(i=t.memoizedState.cachePool.pool),i!==a&&(t.flags|=2048),e!==null&&H(rs),null;case 24:return a=null,e!==null&&(a=e.memoizedState.cache),t.memoizedState.cache!==a&&(t.flags|=2048),ia(Lt),_t(t),null;case 25:return null;case 30:return null}throw Error(u(156,t.tag))}function Ky(e,t){switch(cc(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return ia(Lt),ze(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return U(t),null;case 31:if(t.memoizedState!==null){if(Sn(t),t.alternate===null)throw Error(u(340));ss()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(Sn(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(u(340));ss()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return H(qt),null;case 4:return ze(),null;case 10:return ia(t.type),null;case 22:case 23:return Sn(t),Ac(),e!==null&&H(rs),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return ia(Lt),null;case 25:return null;default:return null}}function uf(e,t){switch(cc(t),t.tag){case 3:ia(Lt),ze();break;case 26:case 27:case 5:U(t);break;case 4:ze();break;case 31:t.memoizedState!==null&&Sn(t);break;case 13:Sn(t);break;case 19:H(qt);break;case 10:ia(t.type);break;case 22:case 23:Sn(t),Ac(),e!==null&&H(rs);break;case 24:ia(Lt)}}function Fo(e,t){try{var a=t.updateQueue,i=a!==null?a.lastEffect:null;if(i!==null){var d=i.next;a=d;do{if((a.tag&e)===e){i=void 0;var f=a.create,y=a.inst;i=f(),y.destroy=i}a=a.next}while(a!==d)}}catch(E){mt(t,t.return,E)}}function Oa(e,t,a){try{var i=t.updateQueue,d=i!==null?i.lastEffect:null;if(d!==null){var f=d.next;i=f;do{if((i.tag&e)===e){var y=i.inst,E=y.destroy;if(E!==void 0){y.destroy=void 0,d=t;var j=a,te=E;try{te()}catch(ue){mt(d,j,ue)}}}i=i.next}while(i!==f)}}catch(ue){mt(t,t.return,ue)}}function df(e){var t=e.updateQueue;if(t!==null){var a=e.stateNode;try{eh(t,a)}catch(i){mt(e,e.return,i)}}}function pf(e,t,a){a.props=ps(e.type,e.memoizedProps),a.state=e.memoizedState;try{a.componentWillUnmount()}catch(i){mt(e,t,i)}}function Go(e,t){try{var a=e.ref;if(a!==null){switch(e.tag){case 26:case 27:case 5:var i=e.stateNode;break;case 30:i=e.stateNode;break;default:i=e.stateNode}typeof a=="function"?e.refCleanup=a(i):a.current=i}}catch(d){mt(e,t,d)}}function Zn(e,t){var a=e.ref,i=e.refCleanup;if(a!==null)if(typeof i=="function")try{i()}catch(d){mt(e,t,d)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof a=="function")try{a(null)}catch(d){mt(e,t,d)}else a.current=null}function hf(e){var t=e.type,a=e.memoizedProps,i=e.stateNode;try{e:switch(t){case"button":case"input":case"select":case"textarea":a.autoFocus&&i.focus();break e;case"img":a.src?i.src=a.src:a.srcSet&&(i.srcset=a.srcSet)}}catch(d){mt(e,e.return,d)}}function nu(e,t,a){try{var i=e.stateNode;vb(i,e.type,a,t),i[hn]=t}catch(d){mt(e,e.return,d)}}function ff(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Ua(e.type)||e.tag===4}function au(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||ff(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Ua(e.type)||e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function su(e,t,a){var i=e.tag;if(i===5||i===6)e=e.stateNode,t?(a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a).insertBefore(e,t):(t=a.nodeType===9?a.body:a.nodeName==="HTML"?a.ownerDocument.body:a,t.appendChild(e),a=a._reactRootContainer,a!=null||t.onclick!==null||(t.onclick=ta));else if(i!==4&&(i===27&&Ua(e.type)&&(a=e.stateNode,t=null),e=e.child,e!==null))for(su(e,t,a),e=e.sibling;e!==null;)su(e,t,a),e=e.sibling}function hr(e,t,a){var i=e.tag;if(i===5||i===6)e=e.stateNode,t?a.insertBefore(e,t):a.appendChild(e);else if(i!==4&&(i===27&&Ua(e.type)&&(a=e.stateNode),e=e.child,e!==null))for(hr(e,t,a),e=e.sibling;e!==null;)hr(e,t,a),e=e.sibling}function mf(e){var t=e.stateNode,a=e.memoizedProps;try{for(var i=e.type,d=t.attributes;d.length;)t.removeAttributeNode(d[0]);sn(t,i,a),t[en]=e,t[hn]=a}catch(f){mt(e,e.return,f)}}var da=!1,Yt=!1,ou=!1,gf=typeof WeakSet=="function"?WeakSet:Set,Kt=null;function Wy(e,t){if(e=e.containerInfo,_u=Br,e=$p(e),Wl(e)){if("selectionStart"in e)var a={start:e.selectionStart,end:e.selectionEnd};else e:{a=(a=e.ownerDocument)&&a.defaultView||window;var i=a.getSelection&&a.getSelection();if(i&&i.rangeCount!==0){a=i.anchorNode;var d=i.anchorOffset,f=i.focusNode;i=i.focusOffset;try{a.nodeType,f.nodeType}catch{a=null;break e}var y=0,E=-1,j=-1,te=0,ue=0,ge=e,ne=null;t:for(;;){for(var ie;ge!==a||d!==0&&ge.nodeType!==3||(E=y+d),ge!==f||i!==0&&ge.nodeType!==3||(j=y+i),ge.nodeType===3&&(y+=ge.nodeValue.length),(ie=ge.firstChild)!==null;)ne=ge,ge=ie;for(;;){if(ge===e)break t;if(ne===a&&++te===d&&(E=y),ne===f&&++ue===i&&(j=y),(ie=ge.nextSibling)!==null)break;ge=ne,ne=ge.parentNode}ge=ie}a=E===-1||j===-1?null:{start:E,end:j}}else a=null}a=a||{start:0,end:0}}else a=null;for($u={focusedElem:e,selectionRange:a},Br=!1,Kt=t;Kt!==null;)if(t=Kt,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,Kt=e;else for(;Kt!==null;){switch(t=Kt,f=t.alternate,e=t.flags,t.tag){case 0:if((e&4)!==0&&(e=t.updateQueue,e=e!==null?e.events:null,e!==null))for(a=0;a<e.length;a++)d=e[a],d.ref.impl=d.nextImpl;break;case 11:case 15:break;case 1:if((e&1024)!==0&&f!==null){e=void 0,a=t,d=f.memoizedProps,f=f.memoizedState,i=a.stateNode;try{var He=ps(a.type,d);e=i.getSnapshotBeforeUpdate(He,f),i.__reactInternalSnapshotBeforeUpdate=e}catch(Ye){mt(a,a.return,Ye)}}break;case 3:if((e&1024)!==0){if(e=t.stateNode.containerInfo,a=e.nodeType,a===9)Tu(e);else if(a===1)switch(e.nodeName){case"HEAD":case"HTML":case"BODY":Tu(e);break;default:e.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((e&1024)!==0)throw Error(u(163))}if(e=t.sibling,e!==null){e.return=t.return,Kt=e;break}Kt=t.return}}function yf(e,t,a){var i=a.flags;switch(a.tag){case 0:case 11:case 15:ha(e,a),i&4&&Fo(5,a);break;case 1:if(ha(e,a),i&4)if(e=a.stateNode,t===null)try{e.componentDidMount()}catch(y){mt(a,a.return,y)}else{var d=ps(a.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(d,t,e.__reactInternalSnapshotBeforeUpdate)}catch(y){mt(a,a.return,y)}}i&64&&df(a),i&512&&Go(a,a.return);break;case 3:if(ha(e,a),i&64&&(e=a.updateQueue,e!==null)){if(t=null,a.child!==null)switch(a.child.tag){case 27:case 5:t=a.child.stateNode;break;case 1:t=a.child.stateNode}try{eh(e,t)}catch(y){mt(a,a.return,y)}}break;case 27:t===null&&i&4&&mf(a);case 26:case 5:ha(e,a),t===null&&i&4&&hf(a),i&512&&Go(a,a.return);break;case 12:ha(e,a);break;case 31:ha(e,a),i&4&&xf(e,a);break;case 13:ha(e,a),i&4&&wf(e,a),i&64&&(e=a.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(a=rb.bind(null,a),$b(e,a))));break;case 22:if(i=a.memoizedState!==null||da,!i){t=t!==null&&t.memoizedState!==null||Yt,d=da;var f=Yt;da=i,(Yt=t)&&!f?fa(e,a,(a.subtreeFlags&8772)!==0):ha(e,a),da=d,Yt=f}break;case 30:break;default:ha(e,a)}}function bf(e){var t=e.alternate;t!==null&&(e.alternate=null,bf(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&jl(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var Nt=null,mn=!1;function pa(e,t,a){for(a=a.child;a!==null;)vf(e,t,a),a=a.sibling}function vf(e,t,a){if(Rt&&typeof Rt.onCommitFiberUnmount=="function")try{Rt.onCommitFiberUnmount(Wt,a)}catch{}switch(a.tag){case 26:Yt||Zn(a,t),pa(e,t,a),a.memoizedState?a.memoizedState.count--:a.stateNode&&(a=a.stateNode,a.parentNode.removeChild(a));break;case 27:Yt||Zn(a,t);var i=Nt,d=mn;Ua(a.type)&&(Nt=a.stateNode,mn=!1),pa(e,t,a),Wo(a.stateNode),Nt=i,mn=d;break;case 5:Yt||Zn(a,t);case 6:if(i=Nt,d=mn,Nt=null,pa(e,t,a),Nt=i,mn=d,Nt!==null)if(mn)try{(Nt.nodeType===9?Nt.body:Nt.nodeName==="HTML"?Nt.ownerDocument.body:Nt).removeChild(a.stateNode)}catch(f){mt(a,t,f)}else try{Nt.removeChild(a.stateNode)}catch(f){mt(a,t,f)}break;case 18:Nt!==null&&(mn?(e=Nt,dm(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,a.stateNode),ro(e)):dm(Nt,a.stateNode));break;case 4:i=Nt,d=mn,Nt=a.stateNode.containerInfo,mn=!0,pa(e,t,a),Nt=i,mn=d;break;case 0:case 11:case 14:case 15:Oa(2,a,t),Yt||Oa(4,a,t),pa(e,t,a);break;case 1:Yt||(Zn(a,t),i=a.stateNode,typeof i.componentWillUnmount=="function"&&pf(a,t,i)),pa(e,t,a);break;case 21:pa(e,t,a);break;case 22:Yt=(i=Yt)||a.memoizedState!==null,pa(e,t,a),Yt=i;break;default:pa(e,t,a)}}function xf(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{ro(e)}catch(a){mt(t,t.return,a)}}}function wf(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{ro(e)}catch(a){mt(t,t.return,a)}}function Iy(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new gf),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new gf),t;default:throw Error(u(435,e.tag))}}function fr(e,t){var a=Iy(e);t.forEach(function(i){if(!a.has(i)){a.add(i);var d=lb.bind(null,e,i);i.then(d,d)}})}function gn(e,t){var a=t.deletions;if(a!==null)for(var i=0;i<a.length;i++){var d=a[i],f=e,y=t,E=y;e:for(;E!==null;){switch(E.tag){case 27:if(Ua(E.type)){Nt=E.stateNode,mn=!1;break e}break;case 5:Nt=E.stateNode,mn=!1;break e;case 3:case 4:Nt=E.stateNode.containerInfo,mn=!0;break e}E=E.return}if(Nt===null)throw Error(u(160));vf(f,y,d),Nt=null,mn=!1,f=d.alternate,f!==null&&(f.return=null),d.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)kf(t,e),t=t.sibling}var Fn=null;function kf(e,t){var a=e.alternate,i=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:gn(t,e),yn(e),i&4&&(Oa(3,e,e.return),Fo(3,e),Oa(5,e,e.return));break;case 1:gn(t,e),yn(e),i&512&&(Yt||a===null||Zn(a,a.return)),i&64&&da&&(e=e.updateQueue,e!==null&&(i=e.callbacks,i!==null&&(a=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=a===null?i:a.concat(i))));break;case 26:var d=Fn;if(gn(t,e),yn(e),i&512&&(Yt||a===null||Zn(a,a.return)),i&4){var f=a!==null?a.memoizedState:null;if(i=e.memoizedState,a===null)if(i===null)if(e.stateNode===null){e:{i=e.type,a=e.memoizedProps,d=d.ownerDocument||d;t:switch(i){case"title":f=d.getElementsByTagName("title")[0],(!f||f[go]||f[en]||f.namespaceURI==="http://www.w3.org/2000/svg"||f.hasAttribute("itemprop"))&&(f=d.createElement(i),d.head.insertBefore(f,d.querySelector("head > title"))),sn(f,i,a),f[en]=e,Jt(f),i=f;break e;case"link":var y=km("link","href",d).get(i+(a.href||""));if(y){for(var E=0;E<y.length;E++)if(f=y[E],f.getAttribute("href")===(a.href==null||a.href===""?null:a.href)&&f.getAttribute("rel")===(a.rel==null?null:a.rel)&&f.getAttribute("title")===(a.title==null?null:a.title)&&f.getAttribute("crossorigin")===(a.crossOrigin==null?null:a.crossOrigin)){y.splice(E,1);break t}}f=d.createElement(i),sn(f,i,a),d.head.appendChild(f);break;case"meta":if(y=km("meta","content",d).get(i+(a.content||""))){for(E=0;E<y.length;E++)if(f=y[E],f.getAttribute("content")===(a.content==null?null:""+a.content)&&f.getAttribute("name")===(a.name==null?null:a.name)&&f.getAttribute("property")===(a.property==null?null:a.property)&&f.getAttribute("http-equiv")===(a.httpEquiv==null?null:a.httpEquiv)&&f.getAttribute("charset")===(a.charSet==null?null:a.charSet)){y.splice(E,1);break t}}f=d.createElement(i),sn(f,i,a),d.head.appendChild(f);break;default:throw Error(u(468,i))}f[en]=e,Jt(f),i=f}e.stateNode=i}else Em(d,e.type,e.stateNode);else e.stateNode=wm(d,i,e.memoizedProps);else f!==i?(f===null?a.stateNode!==null&&(a=a.stateNode,a.parentNode.removeChild(a)):f.count--,i===null?Em(d,e.type,e.stateNode):wm(d,i,e.memoizedProps)):i===null&&e.stateNode!==null&&nu(e,e.memoizedProps,a.memoizedProps)}break;case 27:gn(t,e),yn(e),i&512&&(Yt||a===null||Zn(a,a.return)),a!==null&&i&4&&nu(e,e.memoizedProps,a.memoizedProps);break;case 5:if(gn(t,e),yn(e),i&512&&(Yt||a===null||Zn(a,a.return)),e.flags&32){d=e.stateNode;try{Ts(d,"")}catch(He){mt(e,e.return,He)}}i&4&&e.stateNode!=null&&(d=e.memoizedProps,nu(e,d,a!==null?a.memoizedProps:d)),i&1024&&(ou=!0);break;case 6:if(gn(t,e),yn(e),i&4){if(e.stateNode===null)throw Error(u(162));i=e.memoizedProps,a=e.stateNode;try{a.nodeValue=i}catch(He){mt(e,e.return,He)}}break;case 3:if(Tr=null,d=Fn,Fn=Dr(t.containerInfo),gn(t,e),Fn=d,yn(e),i&4&&a!==null&&a.memoizedState.isDehydrated)try{ro(t.containerInfo)}catch(He){mt(e,e.return,He)}ou&&(ou=!1,Ef(e));break;case 4:i=Fn,Fn=Dr(e.stateNode.containerInfo),gn(t,e),yn(e),Fn=i;break;case 12:gn(t,e),yn(e);break;case 31:gn(t,e),yn(e),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,fr(e,i)));break;case 13:gn(t,e),yn(e),e.child.flags&8192&&e.memoizedState!==null!=(a!==null&&a.memoizedState!==null)&&(gr=Be()),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,fr(e,i)));break;case 22:d=e.memoizedState!==null;var j=a!==null&&a.memoizedState!==null,te=da,ue=Yt;if(da=te||d,Yt=ue||j,gn(t,e),Yt=ue,da=te,yn(e),i&8192)e:for(t=e.stateNode,t._visibility=d?t._visibility&-2:t._visibility|1,d&&(a===null||j||da||Yt||hs(e)),a=null,t=e;;){if(t.tag===5||t.tag===26){if(a===null){j=a=t;try{if(f=j.stateNode,d)y=f.style,typeof y.setProperty=="function"?y.setProperty("display","none","important"):y.display="none";else{E=j.stateNode;var ge=j.memoizedProps.style,ne=ge!=null&&ge.hasOwnProperty("display")?ge.display:null;E.style.display=ne==null||typeof ne=="boolean"?"":(""+ne).trim()}}catch(He){mt(j,j.return,He)}}}else if(t.tag===6){if(a===null){j=t;try{j.stateNode.nodeValue=d?"":j.memoizedProps}catch(He){mt(j,j.return,He)}}}else if(t.tag===18){if(a===null){j=t;try{var ie=j.stateNode;d?pm(ie,!0):pm(j.stateNode,!1)}catch(He){mt(j,j.return,He)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;a===t&&(a=null),t=t.return}a===t&&(a=null),t.sibling.return=t.return,t=t.sibling}i&4&&(i=e.updateQueue,i!==null&&(a=i.retryQueue,a!==null&&(i.retryQueue=null,fr(e,a))));break;case 19:gn(t,e),yn(e),i&4&&(i=e.updateQueue,i!==null&&(e.updateQueue=null,fr(e,i)));break;case 30:break;case 21:break;default:gn(t,e),yn(e)}}function yn(e){var t=e.flags;if(t&2){try{for(var a,i=e.return;i!==null;){if(ff(i)){a=i;break}i=i.return}if(a==null)throw Error(u(160));switch(a.tag){case 27:var d=a.stateNode,f=au(e);hr(e,f,d);break;case 5:var y=a.stateNode;a.flags&32&&(Ts(y,""),a.flags&=-33);var E=au(e);hr(e,E,y);break;case 3:case 4:var j=a.stateNode.containerInfo,te=au(e);su(e,te,j);break;default:throw Error(u(161))}}catch(ue){mt(e,e.return,ue)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Ef(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Ef(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function ha(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)yf(e,t.alternate,t),t=t.sibling}function hs(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:Oa(4,t,t.return),hs(t);break;case 1:Zn(t,t.return);var a=t.stateNode;typeof a.componentWillUnmount=="function"&&pf(t,t.return,a),hs(t);break;case 27:Wo(t.stateNode);case 26:case 5:Zn(t,t.return),hs(t);break;case 22:t.memoizedState===null&&hs(t);break;case 30:hs(t);break;default:hs(t)}e=e.sibling}}function fa(e,t,a){for(a=a&&(t.subtreeFlags&8772)!==0,t=t.child;t!==null;){var i=t.alternate,d=e,f=t,y=f.flags;switch(f.tag){case 0:case 11:case 15:fa(d,f,a),Fo(4,f);break;case 1:if(fa(d,f,a),i=f,d=i.stateNode,typeof d.componentDidMount=="function")try{d.componentDidMount()}catch(te){mt(i,i.return,te)}if(i=f,d=i.updateQueue,d!==null){var E=i.stateNode;try{var j=d.shared.hiddenCallbacks;if(j!==null)for(d.shared.hiddenCallbacks=null,d=0;d<j.length;d++)Ip(j[d],E)}catch(te){mt(i,i.return,te)}}a&&y&64&&df(f),Go(f,f.return);break;case 27:mf(f);case 26:case 5:fa(d,f,a),a&&i===null&&y&4&&hf(f),Go(f,f.return);break;case 12:fa(d,f,a);break;case 31:fa(d,f,a),a&&y&4&&xf(d,f);break;case 13:fa(d,f,a),a&&y&4&&wf(d,f);break;case 22:f.memoizedState===null&&fa(d,f,a),Go(f,f.return);break;case 30:break;default:fa(d,f,a)}t=t.sibling}}function iu(e,t){var a=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(a=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==a&&(e!=null&&e.refCount++,a!=null&&No(a))}function ru(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&No(e))}function Gn(e,t,a,i){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)Af(e,t,a,i),t=t.sibling}function Af(e,t,a,i){var d=t.flags;switch(t.tag){case 0:case 11:case 15:Gn(e,t,a,i),d&2048&&Fo(9,t);break;case 1:Gn(e,t,a,i);break;case 3:Gn(e,t,a,i),d&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&No(e)));break;case 12:if(d&2048){Gn(e,t,a,i),e=t.stateNode;try{var f=t.memoizedProps,y=f.id,E=f.onPostCommit;typeof E=="function"&&E(y,t.alternate===null?"mount":"update",e.passiveEffectDuration,-0)}catch(j){mt(t,t.return,j)}}else Gn(e,t,a,i);break;case 31:Gn(e,t,a,i);break;case 13:Gn(e,t,a,i);break;case 23:break;case 22:f=t.stateNode,y=t.alternate,t.memoizedState!==null?f._visibility&2?Gn(e,t,a,i):Yo(e,t):f._visibility&2?Gn(e,t,a,i):(f._visibility|=2,Js(e,t,a,i,(t.subtreeFlags&10256)!==0||!1)),d&2048&&iu(y,t);break;case 24:Gn(e,t,a,i),d&2048&&ru(t.alternate,t);break;default:Gn(e,t,a,i)}}function Js(e,t,a,i,d){for(d=d&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var f=e,y=t,E=a,j=i,te=y.flags;switch(y.tag){case 0:case 11:case 15:Js(f,y,E,j,d),Fo(8,y);break;case 23:break;case 22:var ue=y.stateNode;y.memoizedState!==null?ue._visibility&2?Js(f,y,E,j,d):Yo(f,y):(ue._visibility|=2,Js(f,y,E,j,d)),d&&te&2048&&iu(y.alternate,y);break;case 24:Js(f,y,E,j,d),d&&te&2048&&ru(y.alternate,y);break;default:Js(f,y,E,j,d)}t=t.sibling}}function Yo(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var a=e,i=t,d=i.flags;switch(i.tag){case 22:Yo(a,i),d&2048&&iu(i.alternate,i);break;case 24:Yo(a,i),d&2048&&ru(i.alternate,i);break;default:Yo(a,i)}t=t.sibling}}var Po=8192;function Ks(e,t,a){if(e.subtreeFlags&Po)for(e=e.child;e!==null;)Sf(e,t,a),e=e.sibling}function Sf(e,t,a){switch(e.tag){case 26:Ks(e,t,a),e.flags&Po&&e.memoizedState!==null&&Hb(a,Fn,e.memoizedState,e.memoizedProps);break;case 5:Ks(e,t,a);break;case 3:case 4:var i=Fn;Fn=Dr(e.stateNode.containerInfo),Ks(e,t,a),Fn=i;break;case 22:e.memoizedState===null&&(i=e.alternate,i!==null&&i.memoizedState!==null?(i=Po,Po=16777216,Ks(e,t,a),Po=i):Ks(e,t,a));break;default:Ks(e,t,a)}}function _f(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Vo(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var a=0;a<t.length;a++){var i=t[a];Kt=i,Df(i,e)}_f(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)$f(e),e=e.sibling}function $f(e){switch(e.tag){case 0:case 11:case 15:Vo(e),e.flags&2048&&Oa(9,e,e.return);break;case 3:Vo(e);break;case 12:Vo(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,mr(e)):Vo(e);break;default:Vo(e)}}function mr(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var a=0;a<t.length;a++){var i=t[a];Kt=i,Df(i,e)}_f(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Oa(8,t,t.return),mr(t);break;case 22:a=t.stateNode,a._visibility&2&&(a._visibility&=-3,mr(t));break;default:mr(t)}e=e.sibling}}function Df(e,t){for(;Kt!==null;){var a=Kt;switch(a.tag){case 0:case 11:case 15:Oa(8,a,t);break;case 23:case 22:if(a.memoizedState!==null&&a.memoizedState.cachePool!==null){var i=a.memoizedState.cachePool.pool;i!=null&&i.refCount++}break;case 24:No(a.memoizedState.cache)}if(i=a.child,i!==null)i.return=a,Kt=i;else e:for(a=e;Kt!==null;){i=Kt;var d=i.sibling,f=i.return;if(bf(i),i===a){Kt=null;break e}if(d!==null){d.return=f,Kt=d;break e}Kt=f}}}var eb={getCacheForType:function(e){var t=nn(Lt),a=t.data.get(e);return a===void 0&&(a=e(),t.data.set(e,a)),a},cacheSignal:function(){return nn(Lt).controller.signal}},tb=typeof WeakMap=="function"?WeakMap:Map,ut=0,Et=null,et=null,nt=0,ft=0,_n=null,Ba=!1,Ws=!1,lu=!1,ma=0,Bt=0,ja=0,fs=0,cu=0,$n=0,Is=0,Xo=null,bn=null,uu=!1,gr=0,Nf=0,yr=1/0,br=null,za=null,Zt=0,Ra=null,eo=null,ga=0,du=0,pu=null,Tf=null,Qo=0,hu=null;function Dn(){return(ut&2)!==0&&nt!==0?nt&-nt:C.T!==null?vu():Pd()}function Mf(){if($n===0)if((nt&536870912)===0||st){var e=I;I<<=1,(I&3932160)===0&&(I=262144),$n=e}else $n=536870912;return e=An.current,e!==null&&(e.flags|=32),$n}function vn(e,t,a){(e===Et&&(ft===2||ft===9)||e.cancelPendingCommit!==null)&&(to(e,0),qa(e,nt,$n,!1)),Dt(e,a),((ut&2)===0||e!==Et)&&(e===Et&&((ut&2)===0&&(fs|=a),Bt===4&&qa(e,nt,$n,!1)),Jn(e))}function Cf(e,t,a){if((ut&6)!==0)throw Error(u(327));var i=!a&&(t&127)===0&&(t&e.expiredLanes)===0||Re(e,t),d=i?sb(e,t):mu(e,t,!0),f=i;do{if(d===0){Ws&&!i&&qa(e,t,0,!1);break}else{if(a=e.current.alternate,f&&!nb(a)){d=mu(e,t,!1),f=!1;continue}if(d===2){if(f=t,e.errorRecoveryDisabledLanes&f)var y=0;else y=e.pendingLanes&-536870913,y=y!==0?y:y&536870912?536870912:0;if(y!==0){t=y;e:{var E=e;d=Xo;var j=E.current.memoizedState.isDehydrated;if(j&&(to(E,y).flags|=256),y=mu(E,y,!1),y!==2){if(lu&&!j){E.errorRecoveryDisabledLanes|=f,fs|=f,d=4;break e}f=bn,bn=d,f!==null&&(bn===null?bn=f:bn.push.apply(bn,f))}d=y}if(f=!1,d!==2)continue}}if(d===1){to(e,0),qa(e,t,0,!0);break}e:{switch(i=e,f=d,f){case 0:case 1:throw Error(u(345));case 4:if((t&4194048)!==t)break;case 6:qa(i,t,$n,!Ba);break e;case 2:bn=null;break;case 3:case 5:break;default:throw Error(u(329))}if((t&62914560)===t&&(d=gr+300-Be(),10<d)){if(qa(i,t,$n,!Ba),ve(i,0,!0)!==0)break e;ga=t,i.timeoutHandle=cm(Of.bind(null,i,a,bn,br,uu,t,$n,fs,Is,Ba,f,"Throttled",-0,0),d);break e}Of(i,a,bn,br,uu,t,$n,fs,Is,Ba,f,null,-0,0)}}break}while(!0);Jn(e)}function Of(e,t,a,i,d,f,y,E,j,te,ue,ge,ne,ie){if(e.timeoutHandle=-1,ge=t.subtreeFlags,ge&8192||(ge&16785408)===16785408){ge={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:ta},Sf(t,f,ge);var He=(f&62914560)===f?gr-Be():(f&4194048)===f?Nf-Be():0;if(He=Ub(ge,He),He!==null){ga=f,e.cancelPendingCommit=He(Lf.bind(null,e,t,f,a,i,d,y,E,j,ue,ge,null,ne,ie)),qa(e,f,y,!te);return}}Lf(e,t,f,a,i,d,y,E,j)}function nb(e){for(var t=e;;){var a=t.tag;if((a===0||a===11||a===15)&&t.flags&16384&&(a=t.updateQueue,a!==null&&(a=a.stores,a!==null)))for(var i=0;i<a.length;i++){var d=a[i],f=d.getSnapshot;d=d.value;try{if(!kn(f(),d))return!1}catch{return!1}}if(a=t.child,t.subtreeFlags&16384&&a!==null)a.return=t,t=a;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function qa(e,t,a,i){t&=~cu,t&=~fs,e.suspendedLanes|=t,e.pingedLanes&=~t,i&&(e.warmLanes|=t),i=e.expirationTimes;for(var d=t;0<d;){var f=31-It(d),y=1<<f;i[f]=-1,d&=~y}a!==0&&Fd(e,a,t)}function vr(){return(ut&6)===0?(Zo(0),!1):!0}function fu(){if(et!==null){if(ft===0)var e=et.return;else e=et,oa=os=null,Tc(e),Ps=null,Mo=0,e=et;for(;e!==null;)uf(e.alternate,e),e=e.return;et=null}}function to(e,t){var a=e.timeoutHandle;a!==-1&&(e.timeoutHandle=-1,kb(a)),a=e.cancelPendingCommit,a!==null&&(e.cancelPendingCommit=null,a()),ga=0,fu(),Et=e,et=a=aa(e.current,null),nt=t,ft=0,_n=null,Ba=!1,Ws=Re(e,t),lu=!1,Is=$n=cu=fs=ja=Bt=0,bn=Xo=null,uu=!1,(t&8)!==0&&(t|=t&32);var i=e.entangledLanes;if(i!==0)for(e=e.entanglements,i&=t;0<i;){var d=31-It(i),f=1<<d;t|=e[d],i&=~f}return ma=t,Ui(),a}function Bf(e,t){Je=null,C.H=Ho,t===Ys||t===Qi?(t=Zp(),ft=3):t===bc?(t=Zp(),ft=4):ft=t===Vc?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,_n=t,et===null&&(Bt=1,lr(e,On(t,e.current)))}function jf(){var e=An.current;return e===null?!0:(nt&4194048)===nt?Rn===null:(nt&62914560)===nt||(nt&536870912)!==0?e===Rn:!1}function zf(){var e=C.H;return C.H=Ho,e===null?Ho:e}function Rf(){var e=C.A;return C.A=eb,e}function xr(){Bt=4,Ba||(nt&4194048)!==nt&&An.current!==null||(Ws=!0),(ja&134217727)===0&&(fs&134217727)===0||Et===null||qa(Et,nt,$n,!1)}function mu(e,t,a){var i=ut;ut|=2;var d=zf(),f=Rf();(Et!==e||nt!==t)&&(br=null,to(e,t)),t=!1;var y=Bt;e:do try{if(ft!==0&&et!==null){var E=et,j=_n;switch(ft){case 8:fu(),y=6;break e;case 3:case 2:case 9:case 6:An.current===null&&(t=!0);var te=ft;if(ft=0,_n=null,no(e,E,j,te),a&&Ws){y=0;break e}break;default:te=ft,ft=0,_n=null,no(e,E,j,te)}}ab(),y=Bt;break}catch(ue){Bf(e,ue)}while(!0);return t&&e.shellSuspendCounter++,oa=os=null,ut=i,C.H=d,C.A=f,et===null&&(Et=null,nt=0,Ui()),y}function ab(){for(;et!==null;)qf(et)}function sb(e,t){var a=ut;ut|=2;var i=zf(),d=Rf();Et!==e||nt!==t?(br=null,yr=Be()+500,to(e,t)):Ws=Re(e,t);e:do try{if(ft!==0&&et!==null){t=et;var f=_n;t:switch(ft){case 1:ft=0,_n=null,no(e,t,f,1);break;case 2:case 9:if(Xp(f)){ft=0,_n=null,Hf(t);break}t=function(){ft!==2&&ft!==9||Et!==e||(ft=7),Jn(e)},f.then(t,t);break e;case 3:ft=7;break e;case 4:ft=5;break e;case 7:Xp(f)?(ft=0,_n=null,Hf(t)):(ft=0,_n=null,no(e,t,f,7));break;case 5:var y=null;switch(et.tag){case 26:y=et.memoizedState;case 5:case 27:var E=et;if(y?Am(y):E.stateNode.complete){ft=0,_n=null;var j=E.sibling;if(j!==null)et=j;else{var te=E.return;te!==null?(et=te,wr(te)):et=null}break t}}ft=0,_n=null,no(e,t,f,5);break;case 6:ft=0,_n=null,no(e,t,f,6);break;case 8:fu(),Bt=6;break e;default:throw Error(u(462))}}ob();break}catch(ue){Bf(e,ue)}while(!0);return oa=os=null,C.H=i,C.A=d,ut=a,et!==null?0:(Et=null,nt=0,Ui(),Bt)}function ob(){for(;et!==null&&!Ae();)qf(et)}function qf(e){var t=lf(e.alternate,e,ma);e.memoizedProps=e.pendingProps,t===null?wr(e):et=t}function Hf(e){var t=e,a=t.alternate;switch(t.tag){case 15:case 0:t=tf(a,t,t.pendingProps,t.type,void 0,nt);break;case 11:t=tf(a,t,t.pendingProps,t.type.render,t.ref,nt);break;case 5:Tc(t);default:uf(a,t),t=et=zp(t,ma),t=lf(a,t,ma)}e.memoizedProps=e.pendingProps,t===null?wr(e):et=t}function no(e,t,a,i){oa=os=null,Tc(t),Ps=null,Mo=0;var d=t.return;try{if(Xy(e,d,t,a,nt)){Bt=1,lr(e,On(a,e.current)),et=null;return}}catch(f){if(d!==null)throw et=d,f;Bt=1,lr(e,On(a,e.current)),et=null;return}t.flags&32768?(st||i===1?e=!0:Ws||(nt&536870912)!==0?e=!1:(Ba=e=!0,(i===2||i===9||i===3||i===6)&&(i=An.current,i!==null&&i.tag===13&&(i.flags|=16384))),Uf(t,e)):wr(t)}function wr(e){var t=e;do{if((t.flags&32768)!==0){Uf(t,Ba);return}e=t.return;var a=Jy(t.alternate,t,ma);if(a!==null){et=a;return}if(t=t.sibling,t!==null){et=t;return}et=t=e}while(t!==null);Bt===0&&(Bt=5)}function Uf(e,t){do{var a=Ky(e.alternate,e);if(a!==null){a.flags&=32767,et=a;return}if(a=e.return,a!==null&&(a.flags|=32768,a.subtreeFlags=0,a.deletions=null),!t&&(e=e.sibling,e!==null)){et=e;return}et=e=a}while(e!==null);Bt=6,et=null}function Lf(e,t,a,i,d,f,y,E,j){e.cancelPendingCommit=null;do kr();while(Zt!==0);if((ut&6)!==0)throw Error(u(327));if(t!==null){if(t===e.current)throw Error(u(177));if(f=t.lanes|t.childLanes,f|=ac,Es(e,a,f,y,E,j),e===Et&&(et=Et=null,nt=0),eo=t,Ra=e,ga=a,du=f,pu=d,Tf=i,(t.subtreeFlags&10256)!==0||(t.flags&10256)!==0?(e.callbackNode=null,e.callbackPriority=0,cb(Ie,function(){return Vf(),null})):(e.callbackNode=null,e.callbackPriority=0),i=(t.flags&13878)!==0,(t.subtreeFlags&13878)!==0||i){i=C.T,C.T=null,d=$.p,$.p=2,y=ut,ut|=4;try{Wy(e,t,a)}finally{ut=y,$.p=d,C.T=i}}Zt=1,Ff(),Gf(),Yf()}}function Ff(){if(Zt===1){Zt=0;var e=Ra,t=eo,a=(t.flags&13878)!==0;if((t.subtreeFlags&13878)!==0||a){a=C.T,C.T=null;var i=$.p;$.p=2;var d=ut;ut|=4;try{kf(t,e);var f=$u,y=$p(e.containerInfo),E=f.focusedElem,j=f.selectionRange;if(y!==E&&E&&E.ownerDocument&&_p(E.ownerDocument.documentElement,E)){if(j!==null&&Wl(E)){var te=j.start,ue=j.end;if(ue===void 0&&(ue=te),"selectionStart"in E)E.selectionStart=te,E.selectionEnd=Math.min(ue,E.value.length);else{var ge=E.ownerDocument||document,ne=ge&&ge.defaultView||window;if(ne.getSelection){var ie=ne.getSelection(),He=E.textContent.length,Ye=Math.min(j.start,He),vt=j.end===void 0?Ye:Math.min(j.end,He);!ie.extend&&Ye>vt&&(y=vt,vt=Ye,Ye=y);var Q=Sp(E,Ye),L=Sp(E,vt);if(Q&&L&&(ie.rangeCount!==1||ie.anchorNode!==Q.node||ie.anchorOffset!==Q.offset||ie.focusNode!==L.node||ie.focusOffset!==L.offset)){var ee=ge.createRange();ee.setStart(Q.node,Q.offset),ie.removeAllRanges(),Ye>vt?(ie.addRange(ee),ie.extend(L.node,L.offset)):(ee.setEnd(L.node,L.offset),ie.addRange(ee))}}}}for(ge=[],ie=E;ie=ie.parentNode;)ie.nodeType===1&&ge.push({element:ie,left:ie.scrollLeft,top:ie.scrollTop});for(typeof E.focus=="function"&&E.focus(),E=0;E<ge.length;E++){var fe=ge[E];fe.element.scrollLeft=fe.left,fe.element.scrollTop=fe.top}}Br=!!_u,$u=_u=null}finally{ut=d,$.p=i,C.T=a}}e.current=t,Zt=2}}function Gf(){if(Zt===2){Zt=0;var e=Ra,t=eo,a=(t.flags&8772)!==0;if((t.subtreeFlags&8772)!==0||a){a=C.T,C.T=null;var i=$.p;$.p=2;var d=ut;ut|=4;try{yf(e,t.alternate,t)}finally{ut=d,$.p=i,C.T=a}}Zt=3}}function Yf(){if(Zt===4||Zt===3){Zt=0,Te();var e=Ra,t=eo,a=ga,i=Tf;(t.subtreeFlags&10256)!==0||(t.flags&10256)!==0?Zt=5:(Zt=0,eo=Ra=null,Pf(e,e.pendingLanes));var d=e.pendingLanes;if(d===0&&(za=null),Ol(a),t=t.stateNode,Rt&&typeof Rt.onCommitFiberRoot=="function")try{Rt.onCommitFiberRoot(Wt,t,void 0,(t.current.flags&128)===128)}catch{}if(i!==null){t=C.T,d=$.p,$.p=2,C.T=null;try{for(var f=e.onRecoverableError,y=0;y<i.length;y++){var E=i[y];f(E.value,{componentStack:E.stack})}}finally{C.T=t,$.p=d}}(ga&3)!==0&&kr(),Jn(e),d=e.pendingLanes,(a&261930)!==0&&(d&42)!==0?e===hu?Qo++:(Qo=0,hu=e):Qo=0,Zo(0)}}function Pf(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,No(t)))}function kr(){return Ff(),Gf(),Yf(),Vf()}function Vf(){if(Zt!==5)return!1;var e=Ra,t=du;du=0;var a=Ol(ga),i=C.T,d=$.p;try{$.p=32>a?32:a,C.T=null,a=pu,pu=null;var f=Ra,y=ga;if(Zt=0,eo=Ra=null,ga=0,(ut&6)!==0)throw Error(u(331));var E=ut;if(ut|=4,$f(f.current),Af(f,f.current,y,a),ut=E,Zo(0,!1),Rt&&typeof Rt.onPostCommitFiberRoot=="function")try{Rt.onPostCommitFiberRoot(Wt,f)}catch{}return!0}finally{$.p=d,C.T=i,Pf(e,t)}}function Xf(e,t,a){t=On(a,t),t=Pc(e.stateNode,t,2),e=Ta(e,t,2),e!==null&&(Dt(e,2),Jn(e))}function mt(e,t,a){if(e.tag===3)Xf(e,e,a);else for(;t!==null;){if(t.tag===3){Xf(t,e,a);break}else if(t.tag===1){var i=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(za===null||!za.has(i))){e=On(a,e),a=Xh(2),i=Ta(t,a,2),i!==null&&(Qh(a,i,t,e),Dt(i,2),Jn(i));break}}t=t.return}}function gu(e,t,a){var i=e.pingCache;if(i===null){i=e.pingCache=new tb;var d=new Set;i.set(t,d)}else d=i.get(t),d===void 0&&(d=new Set,i.set(t,d));d.has(a)||(lu=!0,d.add(a),e=ib.bind(null,e,t,a),t.then(e,e))}function ib(e,t,a){var i=e.pingCache;i!==null&&i.delete(t),e.pingedLanes|=e.suspendedLanes&a,e.warmLanes&=~a,Et===e&&(nt&a)===a&&(Bt===4||Bt===3&&(nt&62914560)===nt&&300>Be()-gr?(ut&2)===0&&to(e,0):cu|=a,Is===nt&&(Is=0)),Jn(e)}function Qf(e,t){t===0&&(t=kt()),e=ns(e,t),e!==null&&(Dt(e,t),Jn(e))}function rb(e){var t=e.memoizedState,a=0;t!==null&&(a=t.retryLane),Qf(e,a)}function lb(e,t){var a=0;switch(e.tag){case 31:case 13:var i=e.stateNode,d=e.memoizedState;d!==null&&(a=d.retryLane);break;case 19:i=e.stateNode;break;case 22:i=e.stateNode._retryCache;break;default:throw Error(u(314))}i!==null&&i.delete(t),Qf(e,a)}function cb(e,t){return Ce(e,t)}var Er=null,ao=null,yu=!1,Ar=!1,bu=!1,Ha=0;function Jn(e){e!==ao&&e.next===null&&(ao===null?Er=ao=e:ao=ao.next=e),Ar=!0,yu||(yu=!0,db())}function Zo(e,t){if(!bu&&Ar){bu=!0;do for(var a=!1,i=Er;i!==null;){if(e!==0){var d=i.pendingLanes;if(d===0)var f=0;else{var y=i.suspendedLanes,E=i.pingedLanes;f=(1<<31-It(42|e)+1)-1,f&=d&~(y&~E),f=f&201326741?f&201326741|1:f?f|2:0}f!==0&&(a=!0,Wf(i,f))}else f=nt,f=ve(i,i===Et?f:0,i.cancelPendingCommit!==null||i.timeoutHandle!==-1),(f&3)===0||Re(i,f)||(a=!0,Wf(i,f));i=i.next}while(a);bu=!1}}function ub(){Zf()}function Zf(){Ar=yu=!1;var e=0;Ha!==0&&wb()&&(e=Ha);for(var t=Be(),a=null,i=Er;i!==null;){var d=i.next,f=Jf(i,t);f===0?(i.next=null,a===null?Er=d:a.next=d,d===null&&(ao=a)):(a=i,(e!==0||(f&3)!==0)&&(Ar=!0)),i=d}Zt!==0&&Zt!==5||Zo(e),Ha!==0&&(Ha=0)}function Jf(e,t){for(var a=e.suspendedLanes,i=e.pingedLanes,d=e.expirationTimes,f=e.pendingLanes&-62914561;0<f;){var y=31-It(f),E=1<<y,j=d[y];j===-1?((E&a)===0||(E&i)!==0)&&(d[y]=ht(E,t)):j<=t&&(e.expiredLanes|=E),f&=~E}if(t=Et,a=nt,a=ve(e,e===t?a:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i=e.callbackNode,a===0||e===t&&(ft===2||ft===9)||e.cancelPendingCommit!==null)return i!==null&&i!==null&&we(i),e.callbackNode=null,e.callbackPriority=0;if((a&3)===0||Re(e,a)){if(t=a&-a,t===e.callbackPriority)return t;switch(i!==null&&we(i),Ol(a)){case 2:case 8:a=Ct;break;case 32:a=Ie;break;case 268435456:a=Xt;break;default:a=Ie}return i=Kf.bind(null,e),a=Ce(a,i),e.callbackPriority=t,e.callbackNode=a,t}return i!==null&&i!==null&&we(i),e.callbackPriority=2,e.callbackNode=null,2}function Kf(e,t){if(Zt!==0&&Zt!==5)return e.callbackNode=null,e.callbackPriority=0,null;var a=e.callbackNode;if(kr()&&e.callbackNode!==a)return null;var i=nt;return i=ve(e,e===Et?i:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i===0?null:(Cf(e,i,t),Jf(e,Be()),e.callbackNode!=null&&e.callbackNode===a?Kf.bind(null,e):null)}function Wf(e,t){if(kr())return null;Cf(e,t,!0)}function db(){Eb(function(){(ut&6)!==0?Ce(gt,ub):Zf()})}function vu(){if(Ha===0){var e=Fs;e===0&&(e=se,se<<=1,(se&261888)===0&&(se=256)),Ha=e}return Ha}function If(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:Ci(""+e)}function em(e,t){var a=t.ownerDocument.createElement("input");return a.name=t.name,a.value=t.value,e.id&&a.setAttribute("form",e.id),t.parentNode.insertBefore(a,t),e=new FormData(e),a.parentNode.removeChild(a),e}function pb(e,t,a,i,d){if(t==="submit"&&a&&a.stateNode===d){var f=If((d[hn]||null).action),y=i.submitter;y&&(t=(t=y[hn]||null)?If(t.formAction):y.getAttribute("formAction"),t!==null&&(f=t,y=null));var E=new zi("action","action",null,i,d);e.push({event:E,listeners:[{instance:null,listener:function(){if(i.defaultPrevented){if(Ha!==0){var j=y?em(d,y):new FormData(d);Hc(a,{pending:!0,data:j,method:d.method,action:f},null,j)}}else typeof f=="function"&&(E.preventDefault(),j=y?em(d,y):new FormData(d),Hc(a,{pending:!0,data:j,method:d.method,action:f},f,j))},currentTarget:d}]})}}for(var xu=0;xu<nc.length;xu++){var wu=nc[xu],hb=wu.toLowerCase(),fb=wu[0].toUpperCase()+wu.slice(1);Ln(hb,"on"+fb)}Ln(Tp,"onAnimationEnd"),Ln(Mp,"onAnimationIteration"),Ln(Cp,"onAnimationStart"),Ln("dblclick","onDoubleClick"),Ln("focusin","onFocus"),Ln("focusout","onBlur"),Ln(Ty,"onTransitionRun"),Ln(My,"onTransitionStart"),Ln(Cy,"onTransitionCancel"),Ln(Op,"onTransitionEnd"),Ds("onMouseEnter",["mouseout","mouseover"]),Ds("onMouseLeave",["mouseout","mouseover"]),Ds("onPointerEnter",["pointerout","pointerover"]),Ds("onPointerLeave",["pointerout","pointerover"]),Wa("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),Wa("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),Wa("onBeforeInput",["compositionend","keypress","textInput","paste"]),Wa("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),Wa("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),Wa("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Jo="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),mb=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Jo));function tm(e,t){t=(t&4)!==0;for(var a=0;a<e.length;a++){var i=e[a],d=i.event;i=i.listeners;e:{var f=void 0;if(t)for(var y=i.length-1;0<=y;y--){var E=i[y],j=E.instance,te=E.currentTarget;if(E=E.listener,j!==f&&d.isPropagationStopped())break e;f=E,d.currentTarget=te;try{f(d)}catch(ue){Hi(ue)}d.currentTarget=null,f=j}else for(y=0;y<i.length;y++){if(E=i[y],j=E.instance,te=E.currentTarget,E=E.listener,j!==f&&d.isPropagationStopped())break e;f=E,d.currentTarget=te;try{f(d)}catch(ue){Hi(ue)}d.currentTarget=null,f=j}}}}function tt(e,t){var a=t[Bl];a===void 0&&(a=t[Bl]=new Set);var i=e+"__bubble";a.has(i)||(nm(t,e,2,!1),a.add(i))}function ku(e,t,a){var i=0;t&&(i|=4),nm(a,e,i,t)}var Sr="_reactListening"+Math.random().toString(36).slice(2);function Eu(e){if(!e[Sr]){e[Sr]=!0,Qd.forEach(function(a){a!=="selectionchange"&&(mb.has(a)||ku(a,!1,e),ku(a,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Sr]||(t[Sr]=!0,ku("selectionchange",!1,t))}}function nm(e,t,a,i){switch(Mm(t)){case 2:var d=Gb;break;case 8:d=Yb;break;default:d=qu}a=d.bind(null,t,a,e),d=void 0,!Gl||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(d=!0),i?d!==void 0?e.addEventListener(t,a,{capture:!0,passive:d}):e.addEventListener(t,a,!0):d!==void 0?e.addEventListener(t,a,{passive:d}):e.addEventListener(t,a,!1)}function Au(e,t,a,i,d){var f=i;if((t&1)===0&&(t&2)===0&&i!==null)e:for(;;){if(i===null)return;var y=i.tag;if(y===3||y===4){var E=i.stateNode.containerInfo;if(E===d)break;if(y===4)for(y=i.return;y!==null;){var j=y.tag;if((j===3||j===4)&&y.stateNode.containerInfo===d)return;y=y.return}for(;E!==null;){if(y=Ss(E),y===null)return;if(j=y.tag,j===5||j===6||j===26||j===27){i=f=y;continue e}E=E.parentNode}}i=i.return}ip(function(){var te=f,ue=Ll(a),ge=[];e:{var ne=Bp.get(e);if(ne!==void 0){var ie=zi,He=e;switch(e){case"keypress":if(Bi(a)===0)break e;case"keydown":case"keyup":ie=ly;break;case"focusin":He="focus",ie=Xl;break;case"focusout":He="blur",ie=Xl;break;case"beforeblur":case"afterblur":ie=Xl;break;case"click":if(a.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":ie=cp;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":ie=Jg;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":ie=dy;break;case Tp:case Mp:case Cp:ie=Ig;break;case Op:ie=hy;break;case"scroll":case"scrollend":ie=Qg;break;case"wheel":ie=my;break;case"copy":case"cut":case"paste":ie=ty;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":ie=dp;break;case"toggle":case"beforetoggle":ie=yy}var Ye=(t&4)!==0,vt=!Ye&&(e==="scroll"||e==="scrollend"),Q=Ye?ne!==null?ne+"Capture":null:ne;Ye=[];for(var L=te,ee;L!==null;){var fe=L;if(ee=fe.stateNode,fe=fe.tag,fe!==5&&fe!==26&&fe!==27||ee===null||Q===null||(fe=bo(L,Q),fe!=null&&Ye.push(Ko(L,fe,ee))),vt)break;L=L.return}0<Ye.length&&(ne=new ie(ne,He,null,a,ue),ge.push({event:ne,listeners:Ye}))}}if((t&7)===0){e:{if(ne=e==="mouseover"||e==="pointerover",ie=e==="mouseout"||e==="pointerout",ne&&a!==Ul&&(He=a.relatedTarget||a.fromElement)&&(Ss(He)||He[As]))break e;if((ie||ne)&&(ne=ue.window===ue?ue:(ne=ue.ownerDocument)?ne.defaultView||ne.parentWindow:window,ie?(He=a.relatedTarget||a.toElement,ie=te,He=He?Ss(He):null,He!==null&&(vt=s(He),Ye=He.tag,He!==vt||Ye!==5&&Ye!==27&&Ye!==6)&&(He=null)):(ie=null,He=te),ie!==He)){if(Ye=cp,fe="onMouseLeave",Q="onMouseEnter",L="mouse",(e==="pointerout"||e==="pointerover")&&(Ye=dp,fe="onPointerLeave",Q="onPointerEnter",L="pointer"),vt=ie==null?ne:yo(ie),ee=He==null?ne:yo(He),ne=new Ye(fe,L+"leave",ie,a,ue),ne.target=vt,ne.relatedTarget=ee,fe=null,Ss(ue)===te&&(Ye=new Ye(Q,L+"enter",He,a,ue),Ye.target=ee,Ye.relatedTarget=vt,fe=Ye),vt=fe,ie&&He)t:{for(Ye=gb,Q=ie,L=He,ee=0,fe=Q;fe;fe=Ye(fe))ee++;fe=0;for(var Fe=L;Fe;Fe=Ye(Fe))fe++;for(;0<ee-fe;)Q=Ye(Q),ee--;for(;0<fe-ee;)L=Ye(L),fe--;for(;ee--;){if(Q===L||L!==null&&Q===L.alternate){Ye=Q;break t}Q=Ye(Q),L=Ye(L)}Ye=null}else Ye=null;ie!==null&&am(ge,ne,ie,Ye,!1),He!==null&&vt!==null&&am(ge,vt,He,Ye,!0)}}e:{if(ne=te?yo(te):window,ie=ne.nodeName&&ne.nodeName.toLowerCase(),ie==="select"||ie==="input"&&ne.type==="file")var lt=vp;else if(yp(ne))if(xp)lt=$y;else{lt=Sy;var Ue=Ay}else ie=ne.nodeName,!ie||ie.toLowerCase()!=="input"||ne.type!=="checkbox"&&ne.type!=="radio"?te&&Hl(te.elementType)&&(lt=vp):lt=_y;if(lt&&(lt=lt(e,te))){bp(ge,lt,a,ue);break e}Ue&&Ue(e,ne,te),e==="focusout"&&te&&ne.type==="number"&&te.memoizedProps.value!=null&&ql(ne,"number",ne.value)}switch(Ue=te?yo(te):window,e){case"focusin":(yp(Ue)||Ue.contentEditable==="true")&&(Bs=Ue,Il=te,_o=null);break;case"focusout":_o=Il=Bs=null;break;case"mousedown":ec=!0;break;case"contextmenu":case"mouseup":case"dragend":ec=!1,Dp(ge,a,ue);break;case"selectionchange":if(Ny)break;case"keydown":case"keyup":Dp(ge,a,ue)}var We;if(Zl)e:{switch(e){case"compositionstart":var at="onCompositionStart";break e;case"compositionend":at="onCompositionEnd";break e;case"compositionupdate":at="onCompositionUpdate";break e}at=void 0}else Os?mp(e,a)&&(at="onCompositionEnd"):e==="keydown"&&a.keyCode===229&&(at="onCompositionStart");at&&(pp&&a.locale!=="ko"&&(Os||at!=="onCompositionStart"?at==="onCompositionEnd"&&Os&&(We=rp()):(Ea=ue,Yl="value"in Ea?Ea.value:Ea.textContent,Os=!0)),Ue=_r(te,at),0<Ue.length&&(at=new up(at,e,null,a,ue),ge.push({event:at,listeners:Ue}),We?at.data=We:(We=gp(a),We!==null&&(at.data=We)))),(We=vy?xy(e,a):wy(e,a))&&(at=_r(te,"onBeforeInput"),0<at.length&&(Ue=new up("onBeforeInput","beforeinput",null,a,ue),ge.push({event:Ue,listeners:at}),Ue.data=We)),pb(ge,e,te,a,ue)}tm(ge,t)})}function Ko(e,t,a){return{instance:e,listener:t,currentTarget:a}}function _r(e,t){for(var a=t+"Capture",i=[];e!==null;){var d=e,f=d.stateNode;if(d=d.tag,d!==5&&d!==26&&d!==27||f===null||(d=bo(e,a),d!=null&&i.unshift(Ko(e,d,f)),d=bo(e,t),d!=null&&i.push(Ko(e,d,f))),e.tag===3)return i;e=e.return}return[]}function gb(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function am(e,t,a,i,d){for(var f=t._reactName,y=[];a!==null&&a!==i;){var E=a,j=E.alternate,te=E.stateNode;if(E=E.tag,j!==null&&j===i)break;E!==5&&E!==26&&E!==27||te===null||(j=te,d?(te=bo(a,f),te!=null&&y.unshift(Ko(a,te,j))):d||(te=bo(a,f),te!=null&&y.push(Ko(a,te,j)))),a=a.return}y.length!==0&&e.push({event:t,listeners:y})}var yb=/\r\n?/g,bb=/\u0000|\uFFFD/g;function sm(e){return(typeof e=="string"?e:""+e).replace(yb,`
`).replace(bb,"")}function om(e,t){return t=sm(t),sm(e)===t}function bt(e,t,a,i,d,f){switch(a){case"children":typeof i=="string"?t==="body"||t==="textarea"&&i===""||Ts(e,i):(typeof i=="number"||typeof i=="bigint")&&t!=="body"&&Ts(e,""+i);break;case"className":Ti(e,"class",i);break;case"tabIndex":Ti(e,"tabindex",i);break;case"dir":case"role":case"viewBox":case"width":case"height":Ti(e,a,i);break;case"style":sp(e,i,f);break;case"data":if(t!=="object"){Ti(e,"data",i);break}case"src":case"href":if(i===""&&(t!=="a"||a!=="href")){e.removeAttribute(a);break}if(i==null||typeof i=="function"||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(a);break}i=Ci(""+i),e.setAttribute(a,i);break;case"action":case"formAction":if(typeof i=="function"){e.setAttribute(a,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof f=="function"&&(a==="formAction"?(t!=="input"&&bt(e,t,"name",d.name,d,null),bt(e,t,"formEncType",d.formEncType,d,null),bt(e,t,"formMethod",d.formMethod,d,null),bt(e,t,"formTarget",d.formTarget,d,null)):(bt(e,t,"encType",d.encType,d,null),bt(e,t,"method",d.method,d,null),bt(e,t,"target",d.target,d,null)));if(i==null||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(a);break}i=Ci(""+i),e.setAttribute(a,i);break;case"onClick":i!=null&&(e.onclick=ta);break;case"onScroll":i!=null&&tt("scroll",e);break;case"onScrollEnd":i!=null&&tt("scrollend",e);break;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(u(61));if(a=i.__html,a!=null){if(d.children!=null)throw Error(u(60));e.innerHTML=a}}break;case"multiple":e.multiple=i&&typeof i!="function"&&typeof i!="symbol";break;case"muted":e.muted=i&&typeof i!="function"&&typeof i!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(i==null||typeof i=="function"||typeof i=="boolean"||typeof i=="symbol"){e.removeAttribute("xlink:href");break}a=Ci(""+i),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",a);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(a,""+i):e.removeAttribute(a);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":i&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(a,""):e.removeAttribute(a);break;case"capture":case"download":i===!0?e.setAttribute(a,""):i!==!1&&i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(a,i):e.removeAttribute(a);break;case"cols":case"rows":case"size":case"span":i!=null&&typeof i!="function"&&typeof i!="symbol"&&!isNaN(i)&&1<=i?e.setAttribute(a,i):e.removeAttribute(a);break;case"rowSpan":case"start":i==null||typeof i=="function"||typeof i=="symbol"||isNaN(i)?e.removeAttribute(a):e.setAttribute(a,i);break;case"popover":tt("beforetoggle",e),tt("toggle",e),Ni(e,"popover",i);break;case"xlinkActuate":ea(e,"http://www.w3.org/1999/xlink","xlink:actuate",i);break;case"xlinkArcrole":ea(e,"http://www.w3.org/1999/xlink","xlink:arcrole",i);break;case"xlinkRole":ea(e,"http://www.w3.org/1999/xlink","xlink:role",i);break;case"xlinkShow":ea(e,"http://www.w3.org/1999/xlink","xlink:show",i);break;case"xlinkTitle":ea(e,"http://www.w3.org/1999/xlink","xlink:title",i);break;case"xlinkType":ea(e,"http://www.w3.org/1999/xlink","xlink:type",i);break;case"xmlBase":ea(e,"http://www.w3.org/XML/1998/namespace","xml:base",i);break;case"xmlLang":ea(e,"http://www.w3.org/XML/1998/namespace","xml:lang",i);break;case"xmlSpace":ea(e,"http://www.w3.org/XML/1998/namespace","xml:space",i);break;case"is":Ni(e,"is",i);break;case"innerText":case"textContent":break;default:(!(2<a.length)||a[0]!=="o"&&a[0]!=="O"||a[1]!=="n"&&a[1]!=="N")&&(a=Vg.get(a)||a,Ni(e,a,i))}}function Su(e,t,a,i,d,f){switch(a){case"style":sp(e,i,f);break;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(u(61));if(a=i.__html,a!=null){if(d.children!=null)throw Error(u(60));e.innerHTML=a}}break;case"children":typeof i=="string"?Ts(e,i):(typeof i=="number"||typeof i=="bigint")&&Ts(e,""+i);break;case"onScroll":i!=null&&tt("scroll",e);break;case"onScrollEnd":i!=null&&tt("scrollend",e);break;case"onClick":i!=null&&(e.onclick=ta);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!Zd.hasOwnProperty(a))e:{if(a[0]==="o"&&a[1]==="n"&&(d=a.endsWith("Capture"),t=a.slice(2,d?a.length-7:void 0),f=e[hn]||null,f=f!=null?f[a]:null,typeof f=="function"&&e.removeEventListener(t,f,d),typeof i=="function")){typeof f!="function"&&f!==null&&(a in e?e[a]=null:e.hasAttribute(a)&&e.removeAttribute(a)),e.addEventListener(t,i,d);break e}a in e?e[a]=i:i===!0?e.setAttribute(a,""):Ni(e,a,i)}}}function sn(e,t,a){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":tt("error",e),tt("load",e);var i=!1,d=!1,f;for(f in a)if(a.hasOwnProperty(f)){var y=a[f];if(y!=null)switch(f){case"src":i=!0;break;case"srcSet":d=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(u(137,t));default:bt(e,t,f,y,a,null)}}d&&bt(e,t,"srcSet",a.srcSet,a,null),i&&bt(e,t,"src",a.src,a,null);return;case"input":tt("invalid",e);var E=f=y=d=null,j=null,te=null;for(i in a)if(a.hasOwnProperty(i)){var ue=a[i];if(ue!=null)switch(i){case"name":d=ue;break;case"type":y=ue;break;case"checked":j=ue;break;case"defaultChecked":te=ue;break;case"value":f=ue;break;case"defaultValue":E=ue;break;case"children":case"dangerouslySetInnerHTML":if(ue!=null)throw Error(u(137,t));break;default:bt(e,t,i,ue,a,null)}}ep(e,f,E,j,te,y,d,!1);return;case"select":tt("invalid",e),i=y=f=null;for(d in a)if(a.hasOwnProperty(d)&&(E=a[d],E!=null))switch(d){case"value":f=E;break;case"defaultValue":y=E;break;case"multiple":i=E;default:bt(e,t,d,E,a,null)}t=f,a=y,e.multiple=!!i,t!=null?Ns(e,!!i,t,!1):a!=null&&Ns(e,!!i,a,!0);return;case"textarea":tt("invalid",e),f=d=i=null;for(y in a)if(a.hasOwnProperty(y)&&(E=a[y],E!=null))switch(y){case"value":i=E;break;case"defaultValue":d=E;break;case"children":f=E;break;case"dangerouslySetInnerHTML":if(E!=null)throw Error(u(91));break;default:bt(e,t,y,E,a,null)}np(e,i,d,f);return;case"option":for(j in a)a.hasOwnProperty(j)&&(i=a[j],i!=null)&&(j==="selected"?e.selected=i&&typeof i!="function"&&typeof i!="symbol":bt(e,t,j,i,a,null));return;case"dialog":tt("beforetoggle",e),tt("toggle",e),tt("cancel",e),tt("close",e);break;case"iframe":case"object":tt("load",e);break;case"video":case"audio":for(i=0;i<Jo.length;i++)tt(Jo[i],e);break;case"image":tt("error",e),tt("load",e);break;case"details":tt("toggle",e);break;case"embed":case"source":case"link":tt("error",e),tt("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(te in a)if(a.hasOwnProperty(te)&&(i=a[te],i!=null))switch(te){case"children":case"dangerouslySetInnerHTML":throw Error(u(137,t));default:bt(e,t,te,i,a,null)}return;default:if(Hl(t)){for(ue in a)a.hasOwnProperty(ue)&&(i=a[ue],i!==void 0&&Su(e,t,ue,i,a,void 0));return}}for(E in a)a.hasOwnProperty(E)&&(i=a[E],i!=null&&bt(e,t,E,i,a,null))}function vb(e,t,a,i){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var d=null,f=null,y=null,E=null,j=null,te=null,ue=null;for(ie in a){var ge=a[ie];if(a.hasOwnProperty(ie)&&ge!=null)switch(ie){case"checked":break;case"value":break;case"defaultValue":j=ge;default:i.hasOwnProperty(ie)||bt(e,t,ie,null,i,ge)}}for(var ne in i){var ie=i[ne];if(ge=a[ne],i.hasOwnProperty(ne)&&(ie!=null||ge!=null))switch(ne){case"type":f=ie;break;case"name":d=ie;break;case"checked":te=ie;break;case"defaultChecked":ue=ie;break;case"value":y=ie;break;case"defaultValue":E=ie;break;case"children":case"dangerouslySetInnerHTML":if(ie!=null)throw Error(u(137,t));break;default:ie!==ge&&bt(e,t,ne,ie,i,ge)}}Rl(e,y,E,j,te,ue,f,d);return;case"select":ie=y=E=ne=null;for(f in a)if(j=a[f],a.hasOwnProperty(f)&&j!=null)switch(f){case"value":break;case"multiple":ie=j;default:i.hasOwnProperty(f)||bt(e,t,f,null,i,j)}for(d in i)if(f=i[d],j=a[d],i.hasOwnProperty(d)&&(f!=null||j!=null))switch(d){case"value":ne=f;break;case"defaultValue":E=f;break;case"multiple":y=f;default:f!==j&&bt(e,t,d,f,i,j)}t=E,a=y,i=ie,ne!=null?Ns(e,!!a,ne,!1):!!i!=!!a&&(t!=null?Ns(e,!!a,t,!0):Ns(e,!!a,a?[]:"",!1));return;case"textarea":ie=ne=null;for(E in a)if(d=a[E],a.hasOwnProperty(E)&&d!=null&&!i.hasOwnProperty(E))switch(E){case"value":break;case"children":break;default:bt(e,t,E,null,i,d)}for(y in i)if(d=i[y],f=a[y],i.hasOwnProperty(y)&&(d!=null||f!=null))switch(y){case"value":ne=d;break;case"defaultValue":ie=d;break;case"children":break;case"dangerouslySetInnerHTML":if(d!=null)throw Error(u(91));break;default:d!==f&&bt(e,t,y,d,i,f)}tp(e,ne,ie);return;case"option":for(var He in a)ne=a[He],a.hasOwnProperty(He)&&ne!=null&&!i.hasOwnProperty(He)&&(He==="selected"?e.selected=!1:bt(e,t,He,null,i,ne));for(j in i)ne=i[j],ie=a[j],i.hasOwnProperty(j)&&ne!==ie&&(ne!=null||ie!=null)&&(j==="selected"?e.selected=ne&&typeof ne!="function"&&typeof ne!="symbol":bt(e,t,j,ne,i,ie));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var Ye in a)ne=a[Ye],a.hasOwnProperty(Ye)&&ne!=null&&!i.hasOwnProperty(Ye)&&bt(e,t,Ye,null,i,ne);for(te in i)if(ne=i[te],ie=a[te],i.hasOwnProperty(te)&&ne!==ie&&(ne!=null||ie!=null))switch(te){case"children":case"dangerouslySetInnerHTML":if(ne!=null)throw Error(u(137,t));break;default:bt(e,t,te,ne,i,ie)}return;default:if(Hl(t)){for(var vt in a)ne=a[vt],a.hasOwnProperty(vt)&&ne!==void 0&&!i.hasOwnProperty(vt)&&Su(e,t,vt,void 0,i,ne);for(ue in i)ne=i[ue],ie=a[ue],!i.hasOwnProperty(ue)||ne===ie||ne===void 0&&ie===void 0||Su(e,t,ue,ne,i,ie);return}}for(var Q in a)ne=a[Q],a.hasOwnProperty(Q)&&ne!=null&&!i.hasOwnProperty(Q)&&bt(e,t,Q,null,i,ne);for(ge in i)ne=i[ge],ie=a[ge],!i.hasOwnProperty(ge)||ne===ie||ne==null&&ie==null||bt(e,t,ge,ne,i,ie)}function im(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function xb(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,a=performance.getEntriesByType("resource"),i=0;i<a.length;i++){var d=a[i],f=d.transferSize,y=d.initiatorType,E=d.duration;if(f&&E&&im(y)){for(y=0,E=d.responseEnd,i+=1;i<a.length;i++){var j=a[i],te=j.startTime;if(te>E)break;var ue=j.transferSize,ge=j.initiatorType;ue&&im(ge)&&(j=j.responseEnd,y+=ue*(j<E?1:(E-te)/(j-te)))}if(--i,t+=8*(f+y)/(d.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var _u=null,$u=null;function $r(e){return e.nodeType===9?e:e.ownerDocument}function rm(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function lm(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function Du(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Nu=null;function wb(){var e=window.event;return e&&e.type==="popstate"?e===Nu?!1:(Nu=e,!0):(Nu=null,!1)}var cm=typeof setTimeout=="function"?setTimeout:void 0,kb=typeof clearTimeout=="function"?clearTimeout:void 0,um=typeof Promise=="function"?Promise:void 0,Eb=typeof queueMicrotask=="function"?queueMicrotask:typeof um<"u"?function(e){return um.resolve(null).then(e).catch(Ab)}:cm;function Ab(e){setTimeout(function(){throw e})}function Ua(e){return e==="head"}function dm(e,t){var a=t,i=0;do{var d=a.nextSibling;if(e.removeChild(a),d&&d.nodeType===8)if(a=d.data,a==="/$"||a==="/&"){if(i===0){e.removeChild(d),ro(t);return}i--}else if(a==="$"||a==="$?"||a==="$~"||a==="$!"||a==="&")i++;else if(a==="html")Wo(e.ownerDocument.documentElement);else if(a==="head"){a=e.ownerDocument.head,Wo(a);for(var f=a.firstChild;f;){var y=f.nextSibling,E=f.nodeName;f[go]||E==="SCRIPT"||E==="STYLE"||E==="LINK"&&f.rel.toLowerCase()==="stylesheet"||a.removeChild(f),f=y}}else a==="body"&&Wo(e.ownerDocument.body);a=d}while(a);ro(t)}function pm(e,t){var a=e;e=0;do{var i=a.nextSibling;if(a.nodeType===1?t?(a._stashedDisplay=a.style.display,a.style.display="none"):(a.style.display=a._stashedDisplay||"",a.getAttribute("style")===""&&a.removeAttribute("style")):a.nodeType===3&&(t?(a._stashedText=a.nodeValue,a.nodeValue=""):a.nodeValue=a._stashedText||""),i&&i.nodeType===8)if(a=i.data,a==="/$"){if(e===0)break;e--}else a!=="$"&&a!=="$?"&&a!=="$~"&&a!=="$!"||e++;a=i}while(a)}function Tu(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var a=t;switch(t=t.nextSibling,a.nodeName){case"HTML":case"HEAD":case"BODY":Tu(a),jl(a);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(a.rel.toLowerCase()==="stylesheet")continue}e.removeChild(a)}}function Sb(e,t,a,i){for(;e.nodeType===1;){var d=a;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!i&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(i){if(!e[go])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(f=e.getAttribute("rel"),f==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(f!==d.rel||e.getAttribute("href")!==(d.href==null||d.href===""?null:d.href)||e.getAttribute("crossorigin")!==(d.crossOrigin==null?null:d.crossOrigin)||e.getAttribute("title")!==(d.title==null?null:d.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(f=e.getAttribute("src"),(f!==(d.src==null?null:d.src)||e.getAttribute("type")!==(d.type==null?null:d.type)||e.getAttribute("crossorigin")!==(d.crossOrigin==null?null:d.crossOrigin))&&f&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var f=d.name==null?null:""+d.name;if(d.type==="hidden"&&e.getAttribute("name")===f)return e}else return e;if(e=qn(e.nextSibling),e===null)break}return null}function _b(e,t,a){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!a||(e=qn(e.nextSibling),e===null))return null;return e}function hm(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=qn(e.nextSibling),e===null))return null;return e}function Mu(e){return e.data==="$?"||e.data==="$~"}function Cu(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function $b(e,t){var a=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||a.readyState!=="loading")t();else{var i=function(){t(),a.removeEventListener("DOMContentLoaded",i)};a.addEventListener("DOMContentLoaded",i),e._reactRetry=i}}function qn(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var Ou=null;function fm(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var a=e.data;if(a==="/$"||a==="/&"){if(t===0)return qn(e.nextSibling);t--}else a!=="$"&&a!=="$!"&&a!=="$?"&&a!=="$~"&&a!=="&"||t++}e=e.nextSibling}return null}function mm(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var a=e.data;if(a==="$"||a==="$!"||a==="$?"||a==="$~"||a==="&"){if(t===0)return e;t--}else a!=="/$"&&a!=="/&"||t++}e=e.previousSibling}return null}function gm(e,t,a){switch(t=$r(a),e){case"html":if(e=t.documentElement,!e)throw Error(u(452));return e;case"head":if(e=t.head,!e)throw Error(u(453));return e;case"body":if(e=t.body,!e)throw Error(u(454));return e;default:throw Error(u(451))}}function Wo(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);jl(e)}var Hn=new Map,ym=new Set;function Dr(e){return typeof e.getRootNode=="function"?e.getRootNode():e.nodeType===9?e:e.ownerDocument}var ya=$.d;$.d={f:Db,r:Nb,D:Tb,C:Mb,L:Cb,m:Ob,X:jb,S:Bb,M:zb};function Db(){var e=ya.f(),t=vr();return e||t}function Nb(e){var t=_s(e);t!==null&&t.tag===5&&t.type==="form"?Oh(t):ya.r(e)}var so=typeof document>"u"?null:document;function bm(e,t,a){var i=so;if(i&&typeof t=="string"&&t){var d=Mn(t);d='link[rel="'+e+'"][href="'+d+'"]',typeof a=="string"&&(d+='[crossorigin="'+a+'"]'),ym.has(d)||(ym.add(d),e={rel:e,crossOrigin:a,href:t},i.querySelector(d)===null&&(t=i.createElement("link"),sn(t,"link",e),Jt(t),i.head.appendChild(t)))}}function Tb(e){ya.D(e),bm("dns-prefetch",e,null)}function Mb(e,t){ya.C(e,t),bm("preconnect",e,t)}function Cb(e,t,a){ya.L(e,t,a);var i=so;if(i&&e&&t){var d='link[rel="preload"][as="'+Mn(t)+'"]';t==="image"&&a&&a.imageSrcSet?(d+='[imagesrcset="'+Mn(a.imageSrcSet)+'"]',typeof a.imageSizes=="string"&&(d+='[imagesizes="'+Mn(a.imageSizes)+'"]')):d+='[href="'+Mn(e)+'"]';var f=d;switch(t){case"style":f=oo(e);break;case"script":f=io(e)}Hn.has(f)||(e=x({rel:"preload",href:t==="image"&&a&&a.imageSrcSet?void 0:e,as:t},a),Hn.set(f,e),i.querySelector(d)!==null||t==="style"&&i.querySelector(Io(f))||t==="script"&&i.querySelector(ei(f))||(t=i.createElement("link"),sn(t,"link",e),Jt(t),i.head.appendChild(t)))}}function Ob(e,t){ya.m(e,t);var a=so;if(a&&e){var i=t&&typeof t.as=="string"?t.as:"script",d='link[rel="modulepreload"][as="'+Mn(i)+'"][href="'+Mn(e)+'"]',f=d;switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":f=io(e)}if(!Hn.has(f)&&(e=x({rel:"modulepreload",href:e},t),Hn.set(f,e),a.querySelector(d)===null)){switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(a.querySelector(ei(f)))return}i=a.createElement("link"),sn(i,"link",e),Jt(i),a.head.appendChild(i)}}}function Bb(e,t,a){ya.S(e,t,a);var i=so;if(i&&e){var d=$s(i).hoistableStyles,f=oo(e);t=t||"default";var y=d.get(f);if(!y){var E={loading:0,preload:null};if(y=i.querySelector(Io(f)))E.loading=5;else{e=x({rel:"stylesheet",href:e,"data-precedence":t},a),(a=Hn.get(f))&&Bu(e,a);var j=y=i.createElement("link");Jt(j),sn(j,"link",e),j._p=new Promise(function(te,ue){j.onload=te,j.onerror=ue}),j.addEventListener("load",function(){E.loading|=1}),j.addEventListener("error",function(){E.loading|=2}),E.loading|=4,Nr(y,t,i)}y={type:"stylesheet",instance:y,count:1,state:E},d.set(f,y)}}}function jb(e,t){ya.X(e,t);var a=so;if(a&&e){var i=$s(a).hoistableScripts,d=io(e),f=i.get(d);f||(f=a.querySelector(ei(d)),f||(e=x({src:e,async:!0},t),(t=Hn.get(d))&&ju(e,t),f=a.createElement("script"),Jt(f),sn(f,"link",e),a.head.appendChild(f)),f={type:"script",instance:f,count:1,state:null},i.set(d,f))}}function zb(e,t){ya.M(e,t);var a=so;if(a&&e){var i=$s(a).hoistableScripts,d=io(e),f=i.get(d);f||(f=a.querySelector(ei(d)),f||(e=x({src:e,async:!0,type:"module"},t),(t=Hn.get(d))&&ju(e,t),f=a.createElement("script"),Jt(f),sn(f,"link",e),a.head.appendChild(f)),f={type:"script",instance:f,count:1,state:null},i.set(d,f))}}function vm(e,t,a,i){var d=(d=De.current)?Dr(d):null;if(!d)throw Error(u(446));switch(e){case"meta":case"title":return null;case"style":return typeof a.precedence=="string"&&typeof a.href=="string"?(t=oo(a.href),a=$s(d).hoistableStyles,i=a.get(t),i||(i={type:"style",instance:null,count:0,state:null},a.set(t,i)),i):{type:"void",instance:null,count:0,state:null};case"link":if(a.rel==="stylesheet"&&typeof a.href=="string"&&typeof a.precedence=="string"){e=oo(a.href);var f=$s(d).hoistableStyles,y=f.get(e);if(y||(d=d.ownerDocument||d,y={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},f.set(e,y),(f=d.querySelector(Io(e)))&&!f._p&&(y.instance=f,y.state.loading=5),Hn.has(e)||(a={rel:"preload",as:"style",href:a.href,crossOrigin:a.crossOrigin,integrity:a.integrity,media:a.media,hrefLang:a.hrefLang,referrerPolicy:a.referrerPolicy},Hn.set(e,a),f||Rb(d,e,a,y.state))),t&&i===null)throw Error(u(528,""));return y}if(t&&i!==null)throw Error(u(529,""));return null;case"script":return t=a.async,a=a.src,typeof a=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(t=io(a),a=$s(d).hoistableScripts,i=a.get(t),i||(i={type:"script",instance:null,count:0,state:null},a.set(t,i)),i):{type:"void",instance:null,count:0,state:null};default:throw Error(u(444,e))}}function oo(e){return'href="'+Mn(e)+'"'}function Io(e){return'link[rel="stylesheet"]['+e+"]"}function xm(e){return x({},e,{"data-precedence":e.precedence,precedence:null})}function Rb(e,t,a,i){e.querySelector('link[rel="preload"][as="style"]['+t+"]")?i.loading=1:(t=e.createElement("link"),i.preload=t,t.addEventListener("load",function(){return i.loading|=1}),t.addEventListener("error",function(){return i.loading|=2}),sn(t,"link",a),Jt(t),e.head.appendChild(t))}function io(e){return'[src="'+Mn(e)+'"]'}function ei(e){return"script[async]"+e}function wm(e,t,a){if(t.count++,t.instance===null)switch(t.type){case"style":var i=e.querySelector('style[data-href~="'+Mn(a.href)+'"]');if(i)return t.instance=i,Jt(i),i;var d=x({},a,{"data-href":a.href,"data-precedence":a.precedence,href:null,precedence:null});return i=(e.ownerDocument||e).createElement("style"),Jt(i),sn(i,"style",d),Nr(i,a.precedence,e),t.instance=i;case"stylesheet":d=oo(a.href);var f=e.querySelector(Io(d));if(f)return t.state.loading|=4,t.instance=f,Jt(f),f;i=xm(a),(d=Hn.get(d))&&Bu(i,d),f=(e.ownerDocument||e).createElement("link"),Jt(f);var y=f;return y._p=new Promise(function(E,j){y.onload=E,y.onerror=j}),sn(f,"link",i),t.state.loading|=4,Nr(f,a.precedence,e),t.instance=f;case"script":return f=io(a.src),(d=e.querySelector(ei(f)))?(t.instance=d,Jt(d),d):(i=a,(d=Hn.get(f))&&(i=x({},a),ju(i,d)),e=e.ownerDocument||e,d=e.createElement("script"),Jt(d),sn(d,"link",i),e.head.appendChild(d),t.instance=d);case"void":return null;default:throw Error(u(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(i=t.instance,t.state.loading|=4,Nr(i,a.precedence,e));return t.instance}function Nr(e,t,a){for(var i=a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),d=i.length?i[i.length-1]:null,f=d,y=0;y<i.length;y++){var E=i[y];if(E.dataset.precedence===t)f=E;else if(f!==d)break}f?f.parentNode.insertBefore(e,f.nextSibling):(t=a.nodeType===9?a.head:a,t.insertBefore(e,t.firstChild))}function Bu(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function ju(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var Tr=null;function km(e,t,a){if(Tr===null){var i=new Map,d=Tr=new Map;d.set(a,i)}else d=Tr,i=d.get(a),i||(i=new Map,d.set(a,i));if(i.has(e))return i;for(i.set(e,null),a=a.getElementsByTagName(e),d=0;d<a.length;d++){var f=a[d];if(!(f[go]||f[en]||e==="link"&&f.getAttribute("rel")==="stylesheet")&&f.namespaceURI!=="http://www.w3.org/2000/svg"){var y=f.getAttribute(t)||"";y=e+y;var E=i.get(y);E?E.push(f):i.set(y,[f])}}return i}function Em(e,t,a){e=e.ownerDocument||e,e.head.insertBefore(a,t==="title"?e.querySelector("head > title"):null)}function qb(e,t,a){if(a===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;return t.rel==="stylesheet"?(e=t.disabled,typeof t.precedence=="string"&&e==null):!0;case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function Am(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}function Hb(e,t,a,i){if(a.type==="stylesheet"&&(typeof i.media!="string"||matchMedia(i.media).matches!==!1)&&(a.state.loading&4)===0){if(a.instance===null){var d=oo(i.href),f=t.querySelector(Io(d));if(f){t=f._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=Mr.bind(e),t.then(e,e)),a.state.loading|=4,a.instance=f,Jt(f);return}f=t.ownerDocument||t,i=xm(i),(d=Hn.get(d))&&Bu(i,d),f=f.createElement("link"),Jt(f);var y=f;y._p=new Promise(function(E,j){y.onload=E,y.onerror=j}),sn(f,"link",i),a.instance=f}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(a,t),(t=a.state.preload)&&(a.state.loading&3)===0&&(e.count++,a=Mr.bind(e),t.addEventListener("load",a),t.addEventListener("error",a))}}var zu=0;function Ub(e,t){return e.stylesheets&&e.count===0&&Or(e,e.stylesheets),0<e.count||0<e.imgCount?function(a){var i=setTimeout(function(){if(e.stylesheets&&Or(e,e.stylesheets),e.unsuspend){var f=e.unsuspend;e.unsuspend=null,f()}},6e4+t);0<e.imgBytes&&zu===0&&(zu=62500*xb());var d=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&Or(e,e.stylesheets),e.unsuspend)){var f=e.unsuspend;e.unsuspend=null,f()}},(e.imgBytes>zu?50:800)+t);return e.unsuspend=a,function(){e.unsuspend=null,clearTimeout(i),clearTimeout(d)}}:null}function Mr(){if(this.count--,this.count===0&&(this.imgCount===0||!this.waitingForImages)){if(this.stylesheets)Or(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var Cr=null;function Or(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,Cr=new Map,t.forEach(Lb,e),Cr=null,Mr.call(e))}function Lb(e,t){if(!(t.state.loading&4)){var a=Cr.get(e);if(a)var i=a.get(null);else{a=new Map,Cr.set(e,a);for(var d=e.querySelectorAll("link[data-precedence],style[data-precedence]"),f=0;f<d.length;f++){var y=d[f];(y.nodeName==="LINK"||y.getAttribute("media")!=="not all")&&(a.set(y.dataset.precedence,y),i=y)}i&&a.set(null,i)}d=t.instance,y=d.getAttribute("data-precedence"),f=a.get(y)||i,f===i&&a.set(null,d),a.set(y,d),this.count++,i=Mr.bind(this),d.addEventListener("load",i),d.addEventListener("error",i),f?f.parentNode.insertBefore(d,f.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(d,e.firstChild)),t.state.loading|=4}}var ti={$$typeof:z,Provider:null,Consumer:null,_currentValue:q,_currentValue2:q,_threadCount:0};function Fb(e,t,a,i,d,f,y,E,j){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=ot(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=ot(0),this.hiddenUpdates=ot(null),this.identifierPrefix=i,this.onUncaughtError=d,this.onCaughtError=f,this.onRecoverableError=y,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=j,this.incompleteTransitions=new Map}function Sm(e,t,a,i,d,f,y,E,j,te,ue,ge){return e=new Fb(e,t,a,y,j,te,ue,ge,E),t=1,f===!0&&(t|=24),f=En(3,null,null,t),e.current=f,f.stateNode=e,t=mc(),t.refCount++,e.pooledCache=t,t.refCount++,f.memoizedState={element:i,isDehydrated:a,cache:t},vc(f),e}function _m(e){return e?(e=Rs,e):Rs}function $m(e,t,a,i,d,f){d=_m(d),i.context===null?i.context=d:i.pendingContext=d,i=Na(t),i.payload={element:a},f=f===void 0?null:f,f!==null&&(i.callback=f),a=Ta(e,i,t),a!==null&&(vn(a,e,t),Oo(a,e,t))}function Dm(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var a=e.retryLane;e.retryLane=a!==0&&a<t?a:t}}function Ru(e,t){Dm(e,t),(e=e.alternate)&&Dm(e,t)}function Nm(e){if(e.tag===13||e.tag===31){var t=ns(e,67108864);t!==null&&vn(t,e,67108864),Ru(e,67108864)}}function Tm(e){if(e.tag===13||e.tag===31){var t=Dn();t=Cl(t);var a=ns(e,t);a!==null&&vn(a,e,t),Ru(e,t)}}var Br=!0;function Gb(e,t,a,i){var d=C.T;C.T=null;var f=$.p;try{$.p=2,qu(e,t,a,i)}finally{$.p=f,C.T=d}}function Yb(e,t,a,i){var d=C.T;C.T=null;var f=$.p;try{$.p=8,qu(e,t,a,i)}finally{$.p=f,C.T=d}}function qu(e,t,a,i){if(Br){var d=Hu(i);if(d===null)Au(e,t,i,jr,a),Cm(e,i);else if(Vb(d,e,t,a,i))i.stopPropagation();else if(Cm(e,i),t&4&&-1<Pb.indexOf(e)){for(;d!==null;){var f=_s(d);if(f!==null)switch(f.tag){case 3:if(f=f.stateNode,f.current.memoizedState.isDehydrated){var y=Se(f.pendingLanes);if(y!==0){var E=f;for(E.pendingLanes|=2,E.entangledLanes|=2;y;){var j=1<<31-It(y);E.entanglements[1]|=j,y&=~j}Jn(f),(ut&6)===0&&(yr=Be()+500,Zo(0))}}break;case 31:case 13:E=ns(f,2),E!==null&&vn(E,f,2),vr(),Ru(f,2)}if(f=Hu(i),f===null&&Au(e,t,i,jr,a),f===d)break;d=f}d!==null&&i.stopPropagation()}else Au(e,t,i,null,a)}}function Hu(e){return e=Ll(e),Uu(e)}var jr=null;function Uu(e){if(jr=null,e=Ss(e),e!==null){var t=s(e);if(t===null)e=null;else{var a=t.tag;if(a===13){if(e=r(t),e!==null)return e;e=null}else if(a===31){if(e=l(t),e!==null)return e;e=null}else if(a===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return jr=e,null}function Mm(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(Ke()){case gt:return 2;case Ct:return 8;case Ie:case zt:return 32;case Xt:return 268435456;default:return 32}default:return 32}}var Lu=!1,La=null,Fa=null,Ga=null,ni=new Map,ai=new Map,Ya=[],Pb="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Cm(e,t){switch(e){case"focusin":case"focusout":La=null;break;case"dragenter":case"dragleave":Fa=null;break;case"mouseover":case"mouseout":Ga=null;break;case"pointerover":case"pointerout":ni.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":ai.delete(t.pointerId)}}function si(e,t,a,i,d,f){return e===null||e.nativeEvent!==f?(e={blockedOn:t,domEventName:a,eventSystemFlags:i,nativeEvent:f,targetContainers:[d]},t!==null&&(t=_s(t),t!==null&&Nm(t)),e):(e.eventSystemFlags|=i,t=e.targetContainers,d!==null&&t.indexOf(d)===-1&&t.push(d),e)}function Vb(e,t,a,i,d){switch(t){case"focusin":return La=si(La,e,t,a,i,d),!0;case"dragenter":return Fa=si(Fa,e,t,a,i,d),!0;case"mouseover":return Ga=si(Ga,e,t,a,i,d),!0;case"pointerover":var f=d.pointerId;return ni.set(f,si(ni.get(f)||null,e,t,a,i,d)),!0;case"gotpointercapture":return f=d.pointerId,ai.set(f,si(ai.get(f)||null,e,t,a,i,d)),!0}return!1}function Om(e){var t=Ss(e.target);if(t!==null){var a=s(t);if(a!==null){if(t=a.tag,t===13){if(t=r(a),t!==null){e.blockedOn=t,Vd(e.priority,function(){Tm(a)});return}}else if(t===31){if(t=l(a),t!==null){e.blockedOn=t,Vd(e.priority,function(){Tm(a)});return}}else if(t===3&&a.stateNode.current.memoizedState.isDehydrated){e.blockedOn=a.tag===3?a.stateNode.containerInfo:null;return}}}e.blockedOn=null}function zr(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var a=Hu(e.nativeEvent);if(a===null){a=e.nativeEvent;var i=new a.constructor(a.type,a);Ul=i,a.target.dispatchEvent(i),Ul=null}else return t=_s(a),t!==null&&Nm(t),e.blockedOn=a,!1;t.shift()}return!0}function Bm(e,t,a){zr(e)&&a.delete(t)}function Xb(){Lu=!1,La!==null&&zr(La)&&(La=null),Fa!==null&&zr(Fa)&&(Fa=null),Ga!==null&&zr(Ga)&&(Ga=null),ni.forEach(Bm),ai.forEach(Bm)}function Rr(e,t){e.blockedOn===t&&(e.blockedOn=null,Lu||(Lu=!0,n.unstable_scheduleCallback(n.unstable_NormalPriority,Xb)))}var qr=null;function jm(e){qr!==e&&(qr=e,n.unstable_scheduleCallback(n.unstable_NormalPriority,function(){qr===e&&(qr=null);for(var t=0;t<e.length;t+=3){var a=e[t],i=e[t+1],d=e[t+2];if(typeof i!="function"){if(Uu(i||a)===null)continue;break}var f=_s(a);f!==null&&(e.splice(t,3),t-=3,Hc(f,{pending:!0,data:d,method:a.method,action:i},i,d))}}))}function ro(e){function t(j){return Rr(j,e)}La!==null&&Rr(La,e),Fa!==null&&Rr(Fa,e),Ga!==null&&Rr(Ga,e),ni.forEach(t),ai.forEach(t);for(var a=0;a<Ya.length;a++){var i=Ya[a];i.blockedOn===e&&(i.blockedOn=null)}for(;0<Ya.length&&(a=Ya[0],a.blockedOn===null);)Om(a),a.blockedOn===null&&Ya.shift();if(a=(e.ownerDocument||e).$$reactFormReplay,a!=null)for(i=0;i<a.length;i+=3){var d=a[i],f=a[i+1],y=d[hn]||null;if(typeof f=="function")y||jm(a);else if(y){var E=null;if(f&&f.hasAttribute("formAction")){if(d=f,y=f[hn]||null)E=y.formAction;else if(Uu(d)!==null)continue}else E=y.action;typeof E=="function"?a[i+1]=E:(a.splice(i,3),i-=3),jm(a)}}}function zm(){function e(f){f.canIntercept&&f.info==="react-transition"&&f.intercept({handler:function(){return new Promise(function(y){return d=y})},focusReset:"manual",scroll:"manual"})}function t(){d!==null&&(d(),d=null),i||setTimeout(a,20)}function a(){if(!i&&!navigation.transition){var f=navigation.currentEntry;f&&f.url!=null&&navigation.navigate(f.url,{state:f.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var i=!1,d=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(a,100),function(){i=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),d!==null&&(d(),d=null)}}}function Fu(e){this._internalRoot=e}Hr.prototype.render=Fu.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(u(409));var a=t.current,i=Dn();$m(a,i,e,t,null,null)},Hr.prototype.unmount=Fu.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;$m(e.current,2,null,e,null,null),vr(),t[As]=null}};function Hr(e){this._internalRoot=e}Hr.prototype.unstable_scheduleHydration=function(e){if(e){var t=Pd();e={blockedOn:null,target:e,priority:t};for(var a=0;a<Ya.length&&t!==0&&t<Ya[a].priority;a++);Ya.splice(a,0,e),a===0&&Om(e)}};var Rm=o.version;if(Rm!=="19.2.7")throw Error(u(527,Rm,"19.2.7"));$.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(u(188)):(e=Object.keys(e).join(","),Error(u(268,e)));return e=h(t),e=e!==null?g(e):null,e=e===null?null:e.stateNode,e};var Qb={bundleType:0,version:"19.2.7",rendererPackageName:"react-dom",currentDispatcherRef:C,reconcilerVersion:"19.2.7"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Ur=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Ur.isDisabled&&Ur.supportsFiber)try{Wt=Ur.inject(Qb),Rt=Ur}catch{}}return ri.createRoot=function(e,t){if(!p(e))throw Error(u(299));var a=!1,i="",d=Gh,f=Yh,y=Ph;return t!=null&&(t.unstable_strictMode===!0&&(a=!0),t.identifierPrefix!==void 0&&(i=t.identifierPrefix),t.onUncaughtError!==void 0&&(d=t.onUncaughtError),t.onCaughtError!==void 0&&(f=t.onCaughtError),t.onRecoverableError!==void 0&&(y=t.onRecoverableError)),t=Sm(e,1,!1,null,null,a,i,null,d,f,y,zm),e[As]=t.current,Eu(e),new Fu(t)},ri.hydrateRoot=function(e,t,a){if(!p(e))throw Error(u(299));var i=!1,d="",f=Gh,y=Yh,E=Ph,j=null;return a!=null&&(a.unstable_strictMode===!0&&(i=!0),a.identifierPrefix!==void 0&&(d=a.identifierPrefix),a.onUncaughtError!==void 0&&(f=a.onUncaughtError),a.onCaughtError!==void 0&&(y=a.onCaughtError),a.onRecoverableError!==void 0&&(E=a.onRecoverableError),a.formState!==void 0&&(j=a.formState)),t=Sm(e,1,!0,t,a??null,i,d,j,f,y,E,zm),t.context=_m(null),a=t.current,i=Dn(),i=Cl(i),d=Na(i),d.callback=null,Ta(a,d,i),a=i,t.current.lanes=a,Dt(t,a),Jn(t),e[As]=t.current,Eu(e),new Hr(t)},ri.version="19.2.7",ri}var x0;function Ux(){if(x0)return Wu.exports;x0=1;function n(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n)}catch(o){console.error(o)}}return n(),Wu.exports=Hx(),Wu.exports}var Lx=Ux();const Fx=`// API の往復の見本。行きの線と戻りの線を引き、戻りの線の名前は線の下に置く
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
`,Gx=`// API round trip example. Draw the request and the reply, and put the reply labels under the line
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
`,Yx=`// Chainlink CCIP でメッセージとトークンが送信元チェーンから送信先チェーンへ届くまで
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
`,Px=`// How a message and tokens travel from the source chain to the destination chain with Chainlink CCIP
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
`,Vx=`// Ethereum でブロックが出てから確定して戻せなくなるまで (#3165)。
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
`,Xx=`// How an Ethereum block becomes final and cannot be reverted (#3165).
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
`,Qx=`// 入門の見本。箱 2 つと線 1 本で、記法の形を見る
sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する, color: slate, icon: globe]
box アプリ [note: ログインを頼む側, color: blue, icon: app]

step ログインを押す
  say 利用者がアプリのログインを押す。アプリは本人の確認を認可サーバーに任せる。
  ブラウザ -> アプリ: GET /login
`,Zx=`// Starter example. Two boxes and one line show the shape of the notation
sequence Ask to sign in

box browser as User's browser [note: operated by the user, color: slate, icon: globe]
box app as App [note: asks for sign-in, color: blue, icon: app]

step Press sign in
  say The user presses the app's sign-in button. The app leaves identity checks to the authorization server.
  browser -> app: GET /login
`,Jx=`// 直しの枝 fix と作業の枝 feature を、merge commit で main へ取り込むまで (#3164)。
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
`,Kx=`// Bringing the fix branch and the feature branch into main with merge commits (#3164).
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
`,Wx=`// OAuth 2.0 の認可コードと PKCE で、ログインしてから API を呼ぶまで
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
`,Ix=`// Sign in with the OAuth 2.0 authorization code and PKCE, then call an API
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
`,e3=`// ネット通販の注文 #1042 が受け付けられ、届いた後に返品されて返金で閉じるまでの状態 (#3163)。
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
`,t3=`// The states of online order #1042, from the order to delivery, then a return and a refund that close it (#3163).
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
`,n3=`// 支払いと後から届く知らせの見本。お金は硬貨で運び、注文の状態を帯で追う
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
`,a3=`// Payment and later notice example. Money moves as a coin, and the strip follows the order state
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
`,s3=`// 作業の枝 feature を main の先端へ rebase し、main を早送りで進めて履歴を 1 本にするまで (#3164)。
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
`,o3=`// Rebasing the work branch feature onto the tip of main, then fast-forwarding main into one straight history (#3164).
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
`,i3=`// 失敗してやり直す見本。同じ線を 2 度引き、待つ処理と何回目かを箱の中と下に見せる
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
`,r3=`// Retry example. Draw the same line twice, and show the wait and the attempt count inside and under the box
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
`,l3=`// ウォレットで署名して取引を送る見本。署名した取引を札で運び、段ごとに呼ぶ命令を見せる
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
`,c3=`// Wallet signing example. The signed transaction runs as a tag, and each step shows the call it makes
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
`,u3=`// L2 から L1 へ資産を引き出す時の 7 日の待ち (#3165)。
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
`,d3=`// The 7-day wait when withdrawing assets from L2 to L1 (#3165).
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
`,Di=["intro","api","retry","payment","wallet","oauth","ccip","order","rebase","merge","finality","withdraw"],w0="oauth",p3=["intro","oauth","ccip"],h3={intro:{ja:Qx,en:Zx},api:{ja:Fx,en:Gx},retry:{ja:i3,en:r3},payment:{ja:n3,en:a3},wallet:{ja:l3,en:c3},oauth:{ja:Wx,en:Ix},ccip:{ja:Yx,en:Px},order:{ja:e3,en:t3},rebase:{ja:s3,en:o3},merge:{ja:Jx,en:Kx},finality:{ja:Vx,en:Xx},withdraw:{ja:u3,en:d3}},wa=(n,o)=>h3[n][o].trimEnd();function Qa(n,o){const c=wa(n,o),u=Za(c);if(!u.ok)return;const p=c.split(`
`)[0]??"";return{title:u.diagram.title,kind:u.diagram.kind,about:p.startsWith("//")?p.replace(/^\/\/\s*/u,""):""}}const dl={ja:["sequence 新しい図","","box 甲","box 乙","","step 最初の段","  say この段で起きることを書く。","  甲 -> 乙: 呼ぶ"].join(`
`),en:["sequence New diagram","","box a as A","box b as B","","step First step","  say Write what happens in this step.","  a -> b: call"].join(`
`)},pd="new.dragon";function pl(n){for(const o of Di)for(const c of["ja","en"])if(wa(o,c)===n.trimEnd())return{key:o,lang:c}}const pt={ja:{title:"dragon — 文章で書くと、動く図になる",tagline:"文章で書くと、動く図になる",language:"言葉",palette:"色味",paletteNames:{clear:"澄んだ色",paper:"紙と墨",night:"夜の計器"},site:{nav:{home:"概要",catalog:"カタログ",editor:"編集画面",docs:"使い方","release-notes":"更新履歴"},navLabel:"行き先",openMenu:"行き先を開く",closeMenu:"行き先を閉じる",openEditor:"編集画面を開く →",toDark:"暗い表示にする",toLight:"明るい表示にする",home:{chip:n=>[...n,"段ごとの再生"].join(" × "),title:["より自由な","図","を"],lead:"箱と線を書き、段ごとに動かす。型に合わせて諦めていた図が、文章のまま組み上がる。",readDocs:"使い方を読む",features:{eyebrow:"なぜ dragon か",title:"書く手間を、動く成果に。",items:[{title:"文章で書ける",text:"箱と線と段を 1 行ずつ書くだけ。座標も図の部品も組まない。"},{title:"段ごとに動き出す",text:"段を切り替えると、線の上を封筒や札が走り、箱の中の処理が進む。順序と因果が目に見える。"},{title:"URL と file で渡せる",text:"書いた記法は URL に載せて共有できる。CLI で mp4、GIF、HTML、PNG にも書き出せる。"}]},steps:{eyebrow:"3 手順",title:"1 分で走り出す。",items:[{title:"編集画面を開く",text:"ブラウザで編集画面を開く。導入作業は要らない。"},{title:"記法を書く",text:"箱と線と段を 1 行ずつ書く。最初の行で図の種類を選ぶ。"},{title:"図が動き出す",text:"右の実況表示に、段ごとに動く図が出る。URL で共有でき、file にも書き出せる。"}]},uses:{eyebrow:"使いどころ",title:"こんな図が書ける。",more:"カタログで図を見る →"},closing:{title:"今すぐ、書いて動かす。",lead:"記法を 1 つ書くだけ。動く図を 1 分後に手に入れる。"}},catalog:{crumb:"現在地",lead:(n,o,c)=>`今の記法の部品 ${n} 個と、部品を組み合わせた ${o} 種類の図を並べる。部品の頁で書き方と見え方を確かめ、図の頁で見本を検索して動かし、編集画面で開ける。合計 ${c} 件の見本。`,sections:{parts:{title:"部品",lead:"どの図でも使う部品。部品ごとに、時系列図と構成図と状態遷移図と枝分かれの図と時間軸の図で描いた見え方を並べる。"},"kind-parts":{title:"図の種類だけの部品",lead:"1 つの図の種類でだけ使う部品。"},kinds:{title:"図",lead:"部品を組み合わせた図。図ごとに、使う部品の一覧と見本を載せる。"}},parts:{box:{name:"箱",desc:"box の行で、図に登場する物を 1 つ置く。名札と見せる名前を書き、線はこの名札で引く。"},edge:{name:"線",desc:"送る側の箱から受ける側の箱へ引く線。1 つの段に何本でも並べ、書いた順に引く。"},"edge-label":{name:"線の名前",desc:"線に添える名前。side で、上、下、左、右のどこに置くかを選ぶ。"},carry:{name:"運ぶ物",desc:"線の上を走る物。封筒、値を書いた札、硬貨、何も走らせないの 4 つから選ぶ。"},color:{name:"色の役",desc:"箱と区画に付ける色の役。7 つの役から選び、色そのものは色味が決める。"},icon:{name:"絵",desc:"箱と区画の名前に添える絵。user や db などの名前で選ぶ。"},link:{name:"飛び先",desc:"箱に書く飛び先。描いた図ではその箱が link になり、押すと中の仕組みを描いた頁などへ移る。/ で始まる path か、http:// か https:// で始まる URL で書く。"},note:{name:"小さな字",desc:"箱と区画の名前の下に添える小さな字。段の中で箱の小さな字を書き換えられる。"},act:{name:"箱の中の処理",desc:"線を引かずに、箱の中で起きる処理を札で見せる。"},strip:{name:"中身の帯と欄",desc:"図の下に置く中身の帯。段ごとに欄の値を入れ替え、運ばれる物の中身を追う。"},step:{name:"段",desc:"図を区切る段。段ごとに本文と打つ命令を書き、1 段ずつ送って見る。view で、枠が段を追うか全体を止めて見せるかを選ぶ。"},source:{name:"出典",desc:"段に書く出典。名前と URL の組を 1 つの段に何行でも書け、読み上げの段の一覧に名前の link で出る。図と見える語りには出さない。"},lifeline:{name:"生存線",desc:"時系列図だけの部品。箱の下に縦の線が伸び、上から下へ時が進む。"},group:{name:"区画",desc:"構成図だけの部品。group から end までの箱を 1 つの区画に囲み、仕組みの境目を見せる。"},"start-finish":{name:"始まりと終わり",desc:"状態遷移図だけの部品。線の送る側に start、受ける側に finish を書くと、始まりの印から出る線と、終わりの印へ入る線になる。"},"side-path":{name:"通らない道",desc:"状態遷移図だけの部品。最初の step より前に書いた線は、移れるが今回は通らない道として点線で引く。どの段も辿り着かない状態は点線の箱にして、脇道の囲みに入れる。"},branch:{name:"枝",desc:"枝分かれの図だけの部品。branch の行で枝を上から順に宣言すると、枝ごとに横長の帯が並ぶ。段の中で <枝> from <commit> と書くと、その commit から枝を切る。"},commit:{name:"commit",desc:"枝分かれの図だけの部品。commit <名札> on <枝> で枝に commit を積み、hash と一言を丸の外に添える。積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。"},copy:{name:"当て直し",desc:"枝分かれの図だけの部品。on <枝> の後ろに copy <commit> を書くと、元の commit と同じ変更を当て直した commit になり、元から点線で結ぶ。rebase で作り直す commit に使い、枝の札は動かさない。"},merge:{name:"merge commit",desc:"枝分かれの図だけの部品。on <枝> の後ろに merge <枝> を書くと、取り込む先の先端と取り込む枝の先端の 2 つを親に持つ commit になる。取り込む先の札だけが進む。"},scale:{name:"目盛りと針",desc:"時間軸の図だけの部品。scale の行で目盛りの名前と 1 つの長さと数を書くと、時間軸に目盛りが並ぶ。段の中で now -> <目盛り> と書くと、針が決まった速さでその目盛りの終わりまで進む。period で区切りを、span で範囲の括弧か囲みを出す。"},row:{name:"印の列",desc:"時間軸の図だけの部品。row の行で印の列を上から順に宣言すると、目盛りごとに細い印が並び、針が過ぎた所から塗られる。empty に書いた目盛りは空きの印になり、段の中の mark で印の色を変える。"},point:{name:"節目",desc:"時間軸の図だけの部品。point <名札> at <目盛り> で、その目盛りの印の下に旗の丸を置く。段の中の note で状態の字と丸の色を変え、節目どうしを線で結ぶ。"},zoom:{name:"拡大の帯",desc:"時間軸の図だけの部品。zoom の行で目盛りの範囲を書くと、上の帯にその目盛りを列にして並べ、宣言した箱を列ごとに繰り返す。線は [at: <目盛り>] の列の箱どうしを結び、受ける箱を別の列から選ぶ時は into を書く。"}},kindOnly:n=>`${n}だけ`,partKinds:"使える図",words:"記法の語",uses:"この図で使う部品",usesLead:"部品を押すと、その部品の書き方と見え方の頁へ移る。",partSamples:"この部品を使う見本",partSamplesLead:"見本を押すと、図の頁でその見本を開く。",partIcons:"使える絵柄",partIconsLead:n=>`箱と区画の icon に下の名前を書くと、その絵柄が名前の横に付く。使える絵柄は ${n} 個。`,count:n=>`${n} 件`,open:"開く →",kinds:{sequence:"登場する物の間で、誰が誰に何を渡すかを段ごとに追う図。ログインの流れや API の呼び出しの順を、線の上を走る封筒で見せる。",architecture:"区画と箱で仕組みの構成を描き、段ごとにどこからどこへ何が流れるかを見せる図。チェーンをまたぐ送金や、サービスの間の受け渡しに使う。",state:"1 つの物が状態を移る様子を段ごとに追う図。注文や申請が受付から閉じるまでにどの状態を通るかを、線の上を走る札で見せる。",git:"git の枝に commit が積まれ、rebase や merge commit で取り込まれる様子を段ごとに追う図。枝と HEAD がどの commit を指すかを、丸の上の札で見せる。",time:"決まった間隔で刻む時間の上で、何がいつ起きたかを段ごとに追う図。ブロックの確定や引き出しの待ちのように、時間が長さとして効く仕組みを、進む針と塗られる印で見せる。"},total:n=>`全 ${n} 件`,showing:n=>`${n} 件 表示中`,search:"検索 (名前 / 説明)",searchLabel:"見本を検索",clearSearch:"検索語を消す",list:"見本の一覧",nothing:"当てはまる見本が無い",preview:"図の表示",views:"表示の切替",figure:"図",code:"コード",sameAsSite:"サイトと同じ",expand:"拡大",expandLabel:n=>`${n} を拡大して見る`,close:"閉じる",openEditor:"編集画面で開く →",source:"この図の記法",copy:"コードを写す",copied:"写しました"},screens:{catalog:{title:"カタログ"},editor:{title:"編集画面",lead:""},docs:{title:"使い方"},"release-notes":{title:"更新履歴"},"not-found":{title:"そこは、まだ書かれていない。"}},releaseNotes:{crumb:"道筋",eyebrow:n=>`公開の記録 · ${n} が最新`,accent:"履歴",lead:"dragon の今の版を示す。版ごとの詳しい変更は GitHub 上の CHANGELOG.md で読める。",changelog:"変更の記録を GitHub で見る"},notFound:{em:"そこは",lead:n=>`お探しの頁は移動または削除されたか、そもそも存在しません。dragon の ${n} つの入口から探してみてください。`,catalog:"カタログを見る",docs:"使い方を読む"}},notation:"記法",editor:"図の記法を書く欄",fold:"畳む",unfold:"開く",readable:(n,o)=>`読めています — 箱 ${n} つ、段 ${o}`,notJson:n=>`JSON として読めない — ${n}`,cannotDraw:n=>`描けない — ${n}`,kept:"誤りがあるあいだは、最後に描けた図を出しています",exportLead:"同じ図を書き出す",exportTail:"で mp4 / GIF / HTML / PNG",shelf:{label:"棚",open:"棚を開く",close:"棚を閉じる",newFile:"新規ファイル",tabs:{samples:"見本",parts:"部品",notation:"記法"},filter:"絞り込む…",filterLabel:"一覧を絞り込む",nothing:"当てはまる物が無い",kinds:{sequence:"時系列図",architecture:"構成図",state:"状態遷移図",git:"枝分かれの図",time:"時間軸の図"},partsHint:"押すと書く欄に足す。宣言の行は最初の段の前、段の中の行は最後の段に入る",notationHint:"行の形。書く欄の記法と同じ言葉の語で出す",parts:{box:"箱",region:"区画と箱",step:"段",edge:"線 (封筒が走る)","edge-tag":"札を運ぶ線","edge-coin":"硬貨を運ぶ線","edge-none":"何も運ばない線","edge-below":"名前を下に置く線",action:"箱の中の処理",swap:"箱の下の字の書き換え",strip:"帯の値"},syntax:{kind:"図の種類と題。最初の行に書く",view:"見せ方。書かなければ字の大きさで選ぶ",region:"区画。箱を囲む",box:"箱。名札は線と処理で使う",strip:"帯。段ごとに変わる値の欄",step:"段の題と本文",code:"段で打つ命令",source:"段の出典。読み上げの段の一覧に名前の link で出る",edge:"線。運ぶ物を書かなければ封筒が走る",carry:"線の上を運ぶ物",side:"線の名前を置く側","start-finish":"始まりと終わり。状態遷移図の線の送る側に start、受ける側に finish を書く",path:"通らない道。状態遷移図の最初の step より前に書く",branch:"枝。枝分かれの図で上から帯に並べ、段の中の from で commit から枝を切る",commit:"commit を積む。hash と一言を丸の外に添える",copy:"当て直した commit。枝の札を動かさない",merge:"merge commit。取り込む枝の先端も親に持つ",ref:"札を動かす。枝の名札か HEAD から commit へ引く",scale:"目盛り。時間軸の図で目盛りの名前と 1 つの長さと数を書く",period:"区切り。目盛りいくつかごとに名前と番号を置く",row:"印の列。目盛りごとに印を並べ、empty の目盛りを空きにする",point:"節目。目盛りの印の下に旗の丸を置く",zoom:"拡大の帯。目盛りの範囲を上の帯に列にして並べる",now:"針を進める。段の中で、その目盛りの終わりまで進める",mark:"印の色を変える。段の中で、列の目盛りの範囲を塗り直す",span:"範囲の括弧。shape: box で印の列を囲む",action:"箱の中の処理",swap:"箱の下の小さな字の書き換え","strip-value":"帯の値",comment:"メモ。図には出ない"}},code:{file:"書類名",import:"file を取り込む (.dragon か .json)",export:"今の記法を .dragon の file に書き出す"},stage:{live:"実況表示",fontDown:"語りの字を小さくする",fontUp:"語りの字を大きくする",grid:"格子を出す",fullscreen:"全画面で見る",fit:"全体に合わせる",zoomOut:"縮小する",zoomIn:"拡大する",zoom:"表示の倍率",phase:(n,o,c)=>`段 ${n} / ${o} · ${c}`},notices:{line:n=>`${n} 行目`,count:n=>`誤り ${n} 件`,goTo:n=>`${n} 行目へ移る`},overlaps:{count:n=>`字の重なり ${n} 件`,step:n=>`段 ${n}`,goTo:n=>`段 ${n} へ移る`}},en:{title:"dragon — write it as text, get a moving diagram",tagline:"Write it as text, get a moving diagram",language:"Language",palette:"Palette",paletteNames:{clear:"Clear",paper:"Paper and ink",night:"Night gauges"},site:{nav:{home:"Home",catalog:"Catalog",editor:"Editor",docs:"Docs","release-notes":"Release notes"},navLabel:"Main navigation",openMenu:"Open navigation",closeMenu:"Close navigation",openEditor:"Open editor →",toDark:"Switch to dark",toLight:"Switch to light",home:{chip:n=>[...n,"step playback"].join(" × "),title:["","Diagrams"," beyond the template"],lead:"Write the boxes and the edges, and move them step by step. Diagrams you gave up on because the template could not hold them now build themselves from plain text.",readDocs:"Read the docs",features:{eyebrow:"Why dragon",title:"Turn your writing into diagrams that move.",items:[{title:"Write it as text",text:"Write boxes, edges and steps one line at a time. No coordinates, no hand-built parts."},{title:"Motion, step by step",text:"Switch steps and envelopes and tags run along the edges while actions play inside the boxes. Order and causality become visible."},{title:"Hand it over by URL or file",text:"Put the notation in a URL to share it, or export it to mp4, GIF, HTML or PNG with the CLI."}]},steps:{eyebrow:"3 steps",title:"Up and running in a minute.",items:[{title:"Open the editor",text:"Open the editor in your browser. Nothing to install."},{title:"Write the notation",text:"Write boxes, edges and steps one line at a time. The first line picks the diagram kind."},{title:"The diagram starts moving",text:"The live view on the right shows a diagram that moves step by step. Share it by URL, or export it to a file."}]},uses:{eyebrow:"Use cases",title:"Diagrams you can write.",more:"Browse the catalog →"},closing:{title:"Write it now, watch it move.",lead:"One notation file is all it takes. A moving diagram is yours a minute later."}},catalog:{crumb:"You are here",lead:(n,o,c)=>`The ${n} parts of the current notation, and the ${o} diagram kinds built from them. A part page shows how to write the part and how it looks; a diagram page lets you search its examples, watch them move, and open them in the editor. ${c} examples in total.`,sections:{parts:{title:"Parts",lead:"Parts every diagram uses. Each part page shows the part in a sequence diagram, an architecture diagram, a state diagram, a git graph, and a time diagram."},"kind-parts":{title:"Parts for one kind",lead:"Parts that only one diagram kind uses."},kinds:{title:"Diagrams",lead:"Diagrams built from the parts. Each lists the parts it uses and its examples."}},parts:{box:{name:"Box",desc:"A box line places one thing in the diagram. Write a tag and the name to show; edges use the tag."},edge:{name:"Edge",desc:"A line from the sending box to the receiving box. A step can hold any number, drawn in the order written."},"edge-label":{name:"Edge label",desc:"The name beside an edge. side puts it above, below, left or right."},carry:{name:"Carry",desc:"What runs along an edge: an envelope, a tag with a value, a coin, or nothing."},color:{name:"Color",desc:"The color role of a box or a group. Pick one of seven roles; the palette decides the actual color."},icon:{name:"Icon",desc:"A picture beside the name of a box or a group, chosen by a name such as user or db."},link:{name:"Link",desc:"Where a box leads. The box becomes a link in the drawn diagram, for example to the page that draws what is inside it. Write a path that starts with / or a URL that starts with http:// or https://."},note:{name:"Note",desc:"Small text under the name of a box or a group. A step can rewrite the small text of a box."},act:{name:"Action",desc:"Shows work done inside a box as a badge, with no edge."},strip:{name:"Strip",desc:"A strip of fields under the diagram. Each step can rewrite a field to follow what is carried."},step:{name:"Step",desc:"A step of the diagram, with its own text and command, played one at a time. view picks whether the frame follows the step or holds the whole diagram."},source:{name:"Source",desc:"A source for a step: a name and a URL, as many lines as the step needs. Sources appear as links in the step list that screen readers read, not in the diagram or the shown text."},lifeline:{name:"Lifeline",desc:"Sequence diagrams only. A line runs down from each box, and time moves down the page."},group:{name:"Group",desc:"Architecture diagrams only. The boxes between group and end sit inside one region that marks a boundary in the system."},"start-finish":{name:"Start and end",desc:"State diagrams only. Write start as the sender of a line and finish as its receiver, and the line leaves the start mark or goes into the end mark."},"side-path":{name:"Path not taken",desc:"State diagrams only. A line written before the first step is a path the object could take but does not this time, drawn dotted. A state that no step reaches becomes a dotted box inside the side path area."},branch:{name:"Branch",desc:"Git graphs only. Declare branches top to bottom with branch lines, and each gets its own lane. Inside a step, <branch> from <commit> cuts the branch at that commit."},commit:{name:"Commit",desc:"Git graphs only. commit <id> on <branch> adds a commit to the branch, with its hash and a short note beside the circle. The branch's ref, and HEAD when it points at that branch, move to the new commit."},copy:{name:"Replay",desc:"Git graphs only. Add copy <commit> after on <branch> to replay the same change as that commit, joined to it by a dotted line. Use it for commits a rebase rewrites; branch refs do not move."},merge:{name:"Merge commit",desc:"Git graphs only. Add merge <branch> after on <branch> to make a commit with two parents: the tip of the target and the tip of the merged branch. Only the target's ref moves."},scale:{name:"Scale and needle",desc:"Time diagrams only. A scale line gives the unit name, the length of one unit and the count, and lays the units out along the axis. Inside a step, now -> <unit> moves the needle at a fixed speed to the end of that unit. period adds named periods, and span adds a bracket or a box over a range."},row:{name:"Row of marks",desc:"Time diagrams only. Declare rows from top to bottom with row lines; each unit gets a thin mark, filled once the needle passes it. Units listed in empty get an empty mark, and mark inside a step recolors marks."},point:{name:"Point",desc:"Time diagrams only. point <id> at <unit> puts a flag circle under the marks of that unit. note inside a step changes its state and the color of the circle, and lines can join two points."},zoom:{name:"Zoom band",desc:"Time diagrams only. A zoom line gives a range of units, laid out as columns in the band above, with the declared boxes repeated in every column. A line joins the boxes of the column in [at: <unit>]; write into to take the receiving box from another column."}},kindOnly:n=>`${n} only`,partKinds:"Used in",words:"Notation",uses:"Parts this diagram uses",usesLead:"Pick a part to see how to write it and how it looks.",partSamples:"Examples that use this part",partSamplesLead:"Pick an example to open it on its diagram page.",partIcons:"Available icons",partIconsLead:n=>`Write one of these names as the icon of a box or a group to put that picture beside its name. There are ${n} icons.`,count:n=>`${n} ${n===1?"example":"examples"}`,open:"Open →",kinds:{sequence:"Follow who hands what to whom, step by step. Show a sign-in flow or the order of API calls with envelopes running along the edges.",architecture:"Draw a system as regions and boxes, and show what flows where in each step. Use it for cross-chain transfers or hand-offs between services.",state:"Follow one object as it moves between states, step by step. A tag running along the lines shows which states an order or a request passes before it closes.",git:"Follow commits piling up on git branches and coming together through a rebase or a merge commit, step by step. Tags above the circles show which commit each branch and HEAD point at.",time:"Follow what happens when on time cut into fixed units, step by step. For mechanisms where time itself matters, like block finality or a withdrawal wait, a moving needle and filling marks show it."},total:n=>`${n} ${n===1?"example":"examples"}`,showing:n=>`showing ${n}`,search:"Search (name / description)",searchLabel:"Search the examples",clearSearch:"Clear the search",list:"Example list",nothing:"No example matches",preview:"Diagram",views:"What to show",figure:"Diagram",code:"Code",sameAsSite:"Same as the site",expand:"Enlarge",expandLabel:n=>`Enlarge ${n}`,close:"Close",openEditor:"Open in the editor →",source:"Notation for this diagram",copy:"Copy the code",copied:"Copied"},screens:{catalog:{title:"Catalog"},editor:{title:"Editor",lead:""},docs:{title:"Docs"},"release-notes":{title:"Release notes"},"not-found":{title:"That page has not been written yet."}},releaseNotes:{crumb:"Breadcrumb",eyebrow:n=>`Release log • ${n} is current`,accent:"notes",lead:"Shows the current dragon version. The detailed record for each version is in CHANGELOG.md on GitHub.",changelog:"See the change log on GitHub"},notFound:{em:"That page",lead:n=>`The page you are looking for was moved, deleted, or never existed. Try one of dragon's ${n} entry points.`,catalog:"Browse the catalog",docs:"Read the docs"}},notation:"Notation",editor:"Diagram notation",fold:"Hide",unfold:"Show",readable:(n,o)=>`Reads fine — ${n} ${n===1?"box":"boxes"}, ${o} ${o===1?"step":"steps"}`,notJson:n=>`Not valid JSON — ${n}`,cannotDraw:n=>`Cannot draw — ${n}`,kept:"Showing the last diagram that drew",exportLead:"Export the same diagram",exportTail:"to mp4 / GIF / HTML / PNG",shelf:{label:"Shelf",open:"Open the shelf",close:"Close the shelf",newFile:"New file",tabs:{samples:"Samples",parts:"Parts",notation:"Notation"},filter:"Filter…",filterLabel:"Filter the list",nothing:"Nothing matches",kinds:{sequence:"Sequence",architecture:"Architecture",state:"State",git:"Git graph",time:"Time diagram"},partsHint:"Click to add to the editor. Declarations go before the first step, step lines go to the last step",notationHint:"Line shapes, in the words of the notation you are writing",parts:{box:"Box",region:"Region with a box",step:"Step",edge:"Edge (an envelope runs)","edge-tag":"Edge carrying a tag","edge-coin":"Edge carrying a coin","edge-none":"Edge carrying nothing","edge-below":"Edge with its label below",action:"Action inside a box",swap:"Rewrite the text under a box",strip:"Strip value"},syntax:{kind:"Diagram kind and title, on the first line",view:"View. Chosen by text size when left out",region:"Region around boxes",box:"Box. Its id is used by edges and actions",strip:"Strip, the fields whose values change per step",step:"Step title and body",code:"Command run in the step",source:"Source of the step. Shown as a link in the step list that screen readers read",edge:"Edge. An envelope runs when nothing is carried",carry:"What runs along the edge",side:"Where the edge label sits","start-finish":"Start and end. In a state diagram, write start as a line's sender and finish as its receiver",path:"Path not taken. In a state diagram, write it before the first step",branch:"Branch. In a git graph, lanes go top to bottom; from inside a step cuts a branch at a commit",commit:"Add a commit, with its hash and a short note beside the circle",copy:"Replayed commit. Branch refs do not move",merge:"Merge commit. The merged branch's tip is a parent too",ref:"Move a ref, from a branch id or HEAD to a commit",scale:"Scale. In a time diagram, give the unit name, the length of one unit and the count",period:"Period. A name and number every few units",row:"Row of marks. One mark per unit; units in empty stay empty",point:"Point. A flag circle under the marks of a unit",zoom:"Zoom band. A range of units laid out as columns above",now:"Move the needle to the end of a unit, inside a step",mark:"Recolor marks. Inside a step, repaint a range of a row",span:"Range bracket. shape: box draws a box around the rows",action:"Action inside a box",swap:"Rewrite the small text under a box","strip-value":"Strip value",comment:"Memo. Not drawn"}},code:{file:"File name",import:"Import a file (.dragon or .json)",export:"Export the notation as a .dragon file"},stage:{live:"Live preview",fontDown:"Smaller narration text",fontUp:"Larger narration text",grid:"Show the grid",fullscreen:"Full screen",fit:"Fit to the frame",zoomOut:"Zoom out",zoomIn:"Zoom in",zoom:"Zoom level",phase:(n,o,c)=>`Step ${n} / ${o} · ${c}`},notices:{line:n=>`Line ${n}`,count:n=>`${n} ${n===1?"error":"errors"}`,goTo:n=>`Go to line ${n}`},overlaps:{count:n=>`${n} text ${n===1?"overlap":"overlaps"}`,step:n=>`Step ${n}`,goTo:n=>`Go to step ${n}`}}};function f3(n){return n[0]?.toLowerCase().startsWith("ja")?"ja":"en"}const un=Object.keys(pt.ja.shelf.kinds),zd=n=>un.some(o=>o===n),yg=n=>Di.filter(o=>Qa(o,"ja")?.kind===n),hd="n=";function Rd(n){let o="";for(const c of new TextEncoder().encode(n))o+=String.fromCharCode(c);return`#${hd}${btoa(o).replaceAll("+","-").replaceAll("/","_").replace(/=+$/u,"")}`}function bg(n){if(n.startsWith(`#${hd}`))try{const o=atob(n.slice(hd.length+1).replaceAll("-","+").replaceAll("_","/"));return new TextDecoder("utf-8",{fatal:!0}).decode(Uint8Array.from(o,c=>c.charCodeAt(0)))}catch{return}}const Xa="/dragon/",wt={home:Xa,catalog:`${Xa}catalog`,editor:`${Xa}editor`,docs:`${Xa}docs`,"release-notes":`${Xa}release-notes`},qd="https://github.com/cardene777/dragon",m3={catalog:"catalog",editor:"editor",docs:"docs","release-notes":"release-notes"};function vg(n){if(`${n}/`===Xa)return{screen:"home"};if(!n.startsWith(Xa))return{screen:"not-found"};const o=n.slice(Xa.length).split("/").filter(Boolean),[c,u,p]=o;if(c===void 0)return{screen:"home"};if(c==="catalog"&&u!==void 0&&o.length===2)return{screen:"category",category:decodeURIComponent(u)};if(c==="catalog"&&u==="part"&&p!==void 0&&o.length===3)return{screen:"part",part:decodeURIComponent(p)};const s=m3[c];return s!==void 0&&o.length===1?{screen:s}:{screen:"not-found"}}function g3(){vg(location.pathname).screen==="home"&&bg(location.hash)!==void 0&&history.replaceState(null,"",`${wt.editor}${location.search}${location.hash}`)}const fd=new Set;function y3(n){return fd.add(n),addEventListener("popstate",n),()=>{fd.delete(n),removeEventListener("popstate",n)}}function b3(){return Me.useSyncExternalStore(y3,()=>location.pathname)}function v3(n){const o=new URL(n,location.href);if(o.pathname!==location.pathname||o.hash!==""&&o.hash!==location.hash){history.pushState(null,"",`${o.pathname}${o.hash}`);for(const c of fd)c()}scrollTo(0,0)}function At(n,o){n.button!==0||n.metaKey||n.ctrlKey||n.shiftKey||n.altKey||(n.preventDefault(),v3(n.currentTarget.href),o?.())}const x3=`architecture 箱の中の処理

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
`,w3=`architecture Action

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
`,k3=`git 箱の中の処理

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
`,E3=`git Action

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
`,A3=`sequence 箱の中の処理

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
`,S3=`sequence Action

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
`,_3=`state 箱の中の処理

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
`,$3=`state Action

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
`,D3=`time 処理

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
`,N3=`time Action

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
`,T3=`architecture 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,M3=`architecture Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,C3=`git 箱

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
`,O3=`git Box

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
`,B3=`sequence 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,j3=`sequence Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,z3=`state 箱

box 下書き
box 公開中 as 公開している

step 公開する
  say box の行で状態を 1 つ置く。as の後ろに見せる名前を書く。
  下書き -> 公開中: 公開する

step 戻す
  say 線は状態の名札で書く。
  公開中 -> 下書き: 取り下げる
`,R3=`state Box

box draft as Draft
box live as Published

step Publish
  say A box line places one state. The name to show follows as.
  draft -> live: publish

step Withdraw
  say Edges name the states by their tags.
  live -> draft: withdraw
`,q3=`time 箱

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
`,H3=`time Box

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
`,U3=`git 枝

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
`,L3=`git Branch

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
`,F3=`architecture 運ぶ物

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
`,G3=`architecture Carry

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
`,Y3=`git 運ぶ物

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
`,P3=`git Carry

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
`,V3=`sequence 運ぶ物

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
`,X3=`sequence Carry

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
`,Q3=`state 運ぶ物

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
`,Z3=`state Carry

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
`,J3=`time 運ぶ物

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
`,K3=`time Carry

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
`,W3=`architecture 色の役

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
`,I3=`architecture Color

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
`,ew=`git 色の役

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
`,tw=`git Color

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
`,nw=`sequence 色の役

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
`,aw=`sequence Color

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
`,sw=`state 色の役

box 下書き [color: slate]
box 審査中 [color: amber]
box 公開中 [color: green]

step 出す
  say color で、状態の箱に 7 つの役から色を選ぶ。
  下書き -> 審査中: 審査に出す

step 通る
  say 役は意味で選ぶ。待つ状態は amber、終えた状態は green のように揃える。
  審査中 -> 公開中: 通す
`,ow=`state Color

box draft as Draft [color: slate]
box review as In review [color: amber]
box live as Published [color: green]

step Submit
  say color picks one of 7 roles for a state box.
  draft -> review: submit

step Approve
  say Pick roles by meaning, such as amber for waiting states and green for finished ones.
  review -> live: approve
`,iw=`time 色

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
`,rw=`time Color

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
`,lw=`git commit

branch main

step 積む
  say commit <名札> on <枝> で枝に commit を積む。積んだ枝の札が新しい commit へ進む。
  commit A on main
  commit B on main

step 字を添える
  say hash と note で、丸の外に hash と一言を添える。
  commit C on main [hash: c41d0e5, note: 価格を丸める]
`,cw=`git Commit

branch main

step Commit
  say commit <id> on <branch> adds a commit to the branch. The branch's ref moves to the new commit.
  commit A on main
  commit B on main

step Add text
  say hash and note put a hash and a short note beside the circle.
  commit C on main [hash: c41d0e5, note: Round prices]
`,uw=`git 当て直し

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
`,dw=`git Replay

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
`,pw=`architecture 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,hw=`architecture Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,fw=`git 線の名前

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
`,mw=`git Edge label

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
`,gw=`sequence 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。横の線は above か below。
  乙 -> 甲: 下の名前 [side: below]
`,yw=`sequence Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above or below.
  b -> a: label below [side: below]
`,bw=`state 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,vw=`state Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,xw=`time 線の名前

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
`,ww=`time Edge label

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
`,kw=`architecture 線

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
`,Ew=`architecture Edge

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
`,Aw=`git 線

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
`,Sw=`git Edge

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
`,_w=`sequence 線

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
`,$w=`sequence Edge

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
`,Dw=`state 線

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
`,Nw=`state Edge

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
`,Tw=`time 線

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
`,Mw=`time Edge

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
`,Cw=`architecture 区画

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
`,Ow=`architecture Group

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
`,Bw=`architecture 絵

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
`,jw=`architecture Icon

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
`,zw=`git 絵

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
`,Rw=`git Icon

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
`,qw=`sequence 絵

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
`,Hw=`sequence Icon

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
`,Uw=`state 絵

box 下書き [icon: doc]
box 審査中 [icon: clock]
box 公開中 [icon: globe]

step 出す
  say icon で状態の箱に絵を付ける。
  下書き -> 審査中: 審査に出す

step 通る
  say 運ぶ物は、着いた状態の絵柄の横の置き場に留まる。
  審査中 -> 公開中: 通す
`,Lw=`state Icon

box draft as Draft [icon: doc]
box review as In review [icon: clock]
box live as Published [icon: globe]

step Submit
  say icon puts a picture on a state box.
  draft -> review: submit

step Approve
  say The carried item rests in the slot beside the icon of the state it reaches.
  review -> live: approve
`,Fw=`time 絵

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
`,Gw=`time Icon

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
`,Yw=`sequence 生存線

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
`,Pw=`sequence Lifeline

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
`,Vw=`architecture 飛び先

box アプリ
box 決済 as 決済の仕組み [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  アプリ -> 決済: 請求

step 返す
  say 箱の中の仕組みを別の図に描いた時は、その図の頁を飛び先にする。
  決済 -> アプリ: 済
`,Xw=`architecture Link

box app as App
box pay as Payment system [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  app -> pay: Charge

step Answer
  say When another diagram draws what is inside the box, link to its page.
  pay -> app: Done
`,Qw=`git 飛び先

branch main

box 遠く as 遠くの repo [link: https://github.com/cardene777/dragon]

step 積む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  commit A on main

step 送る
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  commit B on main
  note 遠く: B を受け取った
`,Zw=`git Link

branch main

box remote as Remote repo [link: https://github.com/cardene777/dragon]

step Commit
  say link on a box makes the box a link to that place in the drawn diagram.
  commit A on main

step Push
  say Write a path that starts with / or a URL that starts with http:// or https://.
  commit B on main
  note remote: Received B
`,Jw=`sequence 飛び先

box 利用者
box 認可 as 認可サーバー [link: https://github.com/cardene777/dragon]

step 頼む
  say link で箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  利用者 -> 認可: 許可を求める

step 返す
  say 飛び先は / で始まる path か、http:// か https:// で始まる URL で書く。
  認可 -> 利用者: 許可した
`,Kw=`sequence Link

box user as User
box auth as Auth server [link: https://github.com/cardene777/dragon]

step Ask
  say link on a box makes the box a link to that place in the drawn diagram.
  user -> auth: Ask for access

step Answer
  say Write a path that starts with / or a URL that starts with http:// or https://.
  auth -> user: Granted
`,Ww=`state 飛び先

box 注文 as 注文を受けた
box 支払い as 支払いを確かめる [link: https://github.com/cardene777/dragon]

step 受ける
  say link で状態の箱に飛び先を書くと、描いた図でその箱を押して飛び先へ移れる。
  start -> 注文

step 確かめる
  say 確かめ方を別の図に描いた時は、その図の頁を飛び先にする。
  注文 -> 支払い: 払った
  支払い -> finish
`,Iw=`state Link

box order as Order received
box check as Checking payment [link: https://github.com/cardene777/dragon]

step Receive
  say link on a state box makes the box a link to that place in the drawn diagram.
  start -> order

step Check
  say When another diagram draws how the check works, link to its page.
  order -> check: Paid
  check -> finish
`,e2=`time 飛び先

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
`,t2=`time Link

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
`,n2=`git merge commit

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
`,a2=`git Merge commit

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
`,s2=`architecture 小さな字

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
`,o2=`architecture Note

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
`,i2=`git 小さな字

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
`,r2=`git Note

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
`,l2=`sequence 小さな字

box 財布 [note: 残高 5000 円]
box 店 [note: 待っている]

step 払う
  say note で箱の名前の下に小さな字を添える。
  財布 -> 店: 1200 円 [carry: coin]

step 書き換える
  say 段の中の note の行で、その段から小さな字を書き換える。
  note 財布: 残高 3800 円
  note 店: 受け取った
`,c2=`sequence Note

box wallet as Wallet [note: balance 50 USD]
box shop as Shop [note: waiting]

step Pay
  say note adds small text under the box name.
  wallet -> shop: 12 USD [carry: coin]

step Rewrite
  say A note line in a step rewrites the small text from then on.
  note wallet: balance 38 USD
  note shop: paid
`,u2=`state 小さな字

box 在庫あり [note: 残り 1 個]
box 品切れ [note: 入荷待ち]

step 売り切れる
  say note で状態の名前の下に小さな字を添える。
  在庫あり -> 品切れ: 最後の 1 個が売れた

step 入荷する
  say 段の中の note の行で、その段から状態の小さな字を書き換える。
  品切れ -> 在庫あり: 入荷した
  note 在庫あり: 残り 10 個
`,d2=`state Note

box stocked as In stock [note: 1 left]
box out as Sold out [note: awaiting stock]

step Sell out
  say note adds small text under the state name.
  stocked -> out: last one sold

step Restock
  say A note line inside a step rewrites the small text from that step on.
  out -> stocked: restocked
  note stocked: 10 left
`,p2=`time 小さな字

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
`,h2=`time Note

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
`,f2=`time 節目

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
`,m2=`time Point

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
`,g2=`time 印の列

scale slot 12s 8
row ブロック [color: blue, empty: 2 5]
row 票 [color: amber]

step 印を塗る
  say row で印の列を上から宣言する。針が過ぎた目盛りの印が塗られ、empty の目盛りは空きの印になる。
  now -> 7

step 色を変える
  say 段の中の mark で、列の目盛りの範囲の印の色を変える。
  mark ブロック 0-3 [color: green]
`,y2=`time Row of marks

scale slot 12s 8
row block [color: blue, empty: 2 5]
row vote [color: amber]

step Fill the marks
  say Declare rows from top to bottom with row. Marks fill once the needle passes, and units in empty stay empty.
  now -> 7

step Recolor
  say mark inside a step recolors a range of marks in a row.
  mark block 0-3 [color: green]
`,b2=`time 目盛りと針

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
`,v2=`time Scale and needle

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
`,x2=`state 通らない道

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
`,w2=`state Path not taken

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
`,k2=`architecture 出典

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
`,E2=`architecture Source

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
`,A2=`git 出典

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
`,S2=`git Source

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
`,_2=`sequence 出典

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
`,$2=`sequence Source

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
`,D2=`state 出典

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
`,N2=`state Source

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
`,T2=`time 出典

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
`,M2=`time Source

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
`,C2=`state 始まりと終わり

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
`,O2=`state Start and end

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
`,B2=`architecture 段 [view: fixed]

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
`,j2=`architecture Step [view: fixed]

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
`,z2=`git 段 [view: fixed]

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
`,R2=`git Step [view: fixed]

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
`,q2=`sequence 段 [view: fixed]

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
`,H2=`sequence Step [view: fixed]

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
`,U2=`state 段 [view: fixed]

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
`,L2=`state Step [view: fixed]

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
`,F2=`time 段 [view: fixed]

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
`,G2=`time Step [view: fixed]

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
`,Y2=`architecture 中身の帯と欄

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
`,P2=`architecture Strip

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
`,V2=`git 中身の帯と欄

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
`,X2=`git Strip

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
`,Q2=`sequence 中身の帯と欄

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
`,Z2=`sequence Strip

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
`,J2=`state 中身の帯と欄

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
`,K2=`state Strip

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
`,W2=`time 中身の帯と欄

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
`,I2=`time Strip and fields

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
`,e6=`time 拡大の帯

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
`,t6=`time Zoom band

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
`,fi=[{id:"box",kinds:un,words:["head:box"]},{id:"edge",kinds:un,words:["edge:->"]},{id:"edge-label",kinds:un,words:["attr:edge.side"]},{id:"carry",kinds:un,words:["attr:edge.carry","attr:edge.tag"]},{id:"color",kinds:un,words:["attr:box.color"]},{id:"icon",kinds:un,words:["attr:box.icon"]},{id:"link",kinds:un,words:["attr:box.link"]},{id:"note",kinds:un,words:["attr:box.note","head:note"]},{id:"act",kinds:un,words:["head:act"]},{id:"strip",kinds:un,words:["head:strip","head:set","attr:set.tag"]},{id:"step",kinds:un,words:["head:step","head:say","head:code","attr:diagram.view"]},{id:"source",kinds:un,words:["head:source","attr:source.url"]},{id:"lifeline",kinds:["sequence"],words:["kind:sequence"]},{id:"group",kinds:["architecture"],words:["kind:architecture","head:group","head:end","attr:group.note","attr:group.color","attr:group.icon"]},{id:"start-finish",kinds:["state"],words:["kind:state","edge:start","edge:finish"]},{id:"side-path",kinds:["state"],words:["edge:before-step"]},{id:"branch",kinds:["git"],words:["kind:git","head:branch","attr:branch.note","git:from"]},{id:"commit",kinds:["git"],words:["head:commit","attr:commit.hash","attr:commit.note"]},{id:"copy",kinds:["git"],words:["git:copy"]},{id:"merge",kinds:["git"],words:["git:merge"]},{id:"scale",kinds:["time"],words:["kind:time","head:scale","attr:scale.from","head:period","attr:period.from","head:span","attr:span.shape","attr:span.color","attr:strip.meter"]},{id:"row",kinds:["time"],words:["head:row","attr:row.color","attr:row.empty","head:mark","attr:mark.color"]},{id:"point",kinds:["time"],words:["head:point","attr:note.color"]},{id:"zoom",kinds:["time"],words:["head:zoom","attr:edge.at","attr:edge.into"]}],md=n=>un.every(o=>n.kinds.includes(o)),Hd=n=>fi.find(o=>o.id===n),n6=n=>fi.filter(o=>o.kinds.includes(n)),a6=Object.assign({"./parts/act.architecture.dragon":x3,"./parts/act.architecture.en.dragon":w3,"./parts/act.git.dragon":k3,"./parts/act.git.en.dragon":E3,"./parts/act.sequence.dragon":A3,"./parts/act.sequence.en.dragon":S3,"./parts/act.state.dragon":_3,"./parts/act.state.en.dragon":$3,"./parts/act.time.dragon":D3,"./parts/act.time.en.dragon":N3,"./parts/box.architecture.dragon":T3,"./parts/box.architecture.en.dragon":M3,"./parts/box.git.dragon":C3,"./parts/box.git.en.dragon":O3,"./parts/box.sequence.dragon":B3,"./parts/box.sequence.en.dragon":j3,"./parts/box.state.dragon":z3,"./parts/box.state.en.dragon":R3,"./parts/box.time.dragon":q3,"./parts/box.time.en.dragon":H3,"./parts/branch.git.dragon":U3,"./parts/branch.git.en.dragon":L3,"./parts/carry.architecture.dragon":F3,"./parts/carry.architecture.en.dragon":G3,"./parts/carry.git.dragon":Y3,"./parts/carry.git.en.dragon":P3,"./parts/carry.sequence.dragon":V3,"./parts/carry.sequence.en.dragon":X3,"./parts/carry.state.dragon":Q3,"./parts/carry.state.en.dragon":Z3,"./parts/carry.time.dragon":J3,"./parts/carry.time.en.dragon":K3,"./parts/color.architecture.dragon":W3,"./parts/color.architecture.en.dragon":I3,"./parts/color.git.dragon":ew,"./parts/color.git.en.dragon":tw,"./parts/color.sequence.dragon":nw,"./parts/color.sequence.en.dragon":aw,"./parts/color.state.dragon":sw,"./parts/color.state.en.dragon":ow,"./parts/color.time.dragon":iw,"./parts/color.time.en.dragon":rw,"./parts/commit.git.dragon":lw,"./parts/commit.git.en.dragon":cw,"./parts/copy.git.dragon":uw,"./parts/copy.git.en.dragon":dw,"./parts/edge-label.architecture.dragon":pw,"./parts/edge-label.architecture.en.dragon":hw,"./parts/edge-label.git.dragon":fw,"./parts/edge-label.git.en.dragon":mw,"./parts/edge-label.sequence.dragon":gw,"./parts/edge-label.sequence.en.dragon":yw,"./parts/edge-label.state.dragon":bw,"./parts/edge-label.state.en.dragon":vw,"./parts/edge-label.time.dragon":xw,"./parts/edge-label.time.en.dragon":ww,"./parts/edge.architecture.dragon":kw,"./parts/edge.architecture.en.dragon":Ew,"./parts/edge.git.dragon":Aw,"./parts/edge.git.en.dragon":Sw,"./parts/edge.sequence.dragon":_w,"./parts/edge.sequence.en.dragon":$w,"./parts/edge.state.dragon":Dw,"./parts/edge.state.en.dragon":Nw,"./parts/edge.time.dragon":Tw,"./parts/edge.time.en.dragon":Mw,"./parts/group.architecture.dragon":Cw,"./parts/group.architecture.en.dragon":Ow,"./parts/icon.architecture.dragon":Bw,"./parts/icon.architecture.en.dragon":jw,"./parts/icon.git.dragon":zw,"./parts/icon.git.en.dragon":Rw,"./parts/icon.sequence.dragon":qw,"./parts/icon.sequence.en.dragon":Hw,"./parts/icon.state.dragon":Uw,"./parts/icon.state.en.dragon":Lw,"./parts/icon.time.dragon":Fw,"./parts/icon.time.en.dragon":Gw,"./parts/lifeline.sequence.dragon":Yw,"./parts/lifeline.sequence.en.dragon":Pw,"./parts/link.architecture.dragon":Vw,"./parts/link.architecture.en.dragon":Xw,"./parts/link.git.dragon":Qw,"./parts/link.git.en.dragon":Zw,"./parts/link.sequence.dragon":Jw,"./parts/link.sequence.en.dragon":Kw,"./parts/link.state.dragon":Ww,"./parts/link.state.en.dragon":Iw,"./parts/link.time.dragon":e2,"./parts/link.time.en.dragon":t2,"./parts/merge.git.dragon":n2,"./parts/merge.git.en.dragon":a2,"./parts/note.architecture.dragon":s2,"./parts/note.architecture.en.dragon":o2,"./parts/note.git.dragon":i2,"./parts/note.git.en.dragon":r2,"./parts/note.sequence.dragon":l2,"./parts/note.sequence.en.dragon":c2,"./parts/note.state.dragon":u2,"./parts/note.state.en.dragon":d2,"./parts/note.time.dragon":p2,"./parts/note.time.en.dragon":h2,"./parts/point.time.dragon":f2,"./parts/point.time.en.dragon":m2,"./parts/row.time.dragon":g2,"./parts/row.time.en.dragon":y2,"./parts/scale.time.dragon":b2,"./parts/scale.time.en.dragon":v2,"./parts/side-path.state.dragon":x2,"./parts/side-path.state.en.dragon":w2,"./parts/source.architecture.dragon":k2,"./parts/source.architecture.en.dragon":E2,"./parts/source.git.dragon":A2,"./parts/source.git.en.dragon":S2,"./parts/source.sequence.dragon":_2,"./parts/source.sequence.en.dragon":$2,"./parts/source.state.dragon":D2,"./parts/source.state.en.dragon":N2,"./parts/source.time.dragon":T2,"./parts/source.time.en.dragon":M2,"./parts/start-finish.state.dragon":C2,"./parts/start-finish.state.en.dragon":O2,"./parts/step.architecture.dragon":B2,"./parts/step.architecture.en.dragon":j2,"./parts/step.git.dragon":z2,"./parts/step.git.en.dragon":R2,"./parts/step.sequence.dragon":q2,"./parts/step.sequence.en.dragon":H2,"./parts/step.state.dragon":U2,"./parts/step.state.en.dragon":L2,"./parts/step.time.dragon":F2,"./parts/step.time.en.dragon":G2,"./parts/strip.architecture.dragon":Y2,"./parts/strip.architecture.en.dragon":P2,"./parts/strip.git.dragon":V2,"./parts/strip.git.en.dragon":X2,"./parts/strip.sequence.dragon":Q2,"./parts/strip.sequence.en.dragon":Z2,"./parts/strip.state.dragon":J2,"./parts/strip.state.en.dragon":K2,"./parts/strip.time.dragon":W2,"./parts/strip.time.en.dragon":I2,"./parts/zoom.time.dragon":e6,"./parts/zoom.time.en.dragon":t6}),s6=(n,o,c)=>(a6[`./parts/${n}.${o}${c==="en"?".en":""}.dragon`]??"").trimEnd(),Pn=n=>n.steps.flatMap(o=>o.events),Va=n=>Pn(n).flatMap(o=>o.type==="edge"?[o]:[]),li=n=>Pn(n).flatMap(o=>o.type==="commit"?[o]:[]),nd=n=>Pn(n).flatMap(o=>o.type==="span"?[o]:[]),o6=(n,o)=>o.carry.kind==="tag"&&!(n.kind==="git"&&o.carry.text===o.from),i6={"kind:sequence":n=>n.kind==="sequence","kind:architecture":n=>n.kind==="architecture","kind:state":n=>n.kind==="state","kind:git":n=>n.kind==="git","head:group":n=>(n.regions??[]).length>0,"head:end":n=>(n.regions??[]).length>0,"head:box":n=>n.boxes.length>0,"head:strip":n=>n.strip!==void 0,"head:step":n=>n.steps.length>0,"head:say":n=>n.steps.some(o=>o.body!==""),"head:code":n=>n.steps.some(o=>o.code!==void 0),"head:source":n=>n.steps.some(o=>o.sources!==void 0),"head:act":n=>Pn(n).some(o=>o.type==="action"),"head:note":n=>Pn(n).some(o=>o.type==="swap"),"head:set":n=>Pn(n).some(o=>o.type==="strip"),"attr:diagram.view":n=>n.view!==void 0,"attr:group.note":n=>(n.regions??[]).some(o=>o.note!==void 0),"attr:group.color":n=>(n.regions??[]).some(o=>o.color!==void 0),"attr:group.icon":n=>(n.regions??[]).some(o=>o.icon!==void 0),"attr:box.note":n=>n.boxes.some(o=>o.sub!==void 0),"attr:box.color":n=>n.boxes.some(o=>o.color!==void 0),"attr:box.icon":n=>n.boxes.some(o=>o.icon!==void 0),"attr:box.link":n=>n.boxes.some(o=>o.link!==void 0),"attr:source.url":n=>n.steps.some(o=>o.sources!==void 0),"attr:edge.carry":n=>Va(n).some(o=>o.carry.kind==="coin"||o.carry.kind==="none"),"attr:edge.tag":n=>Va(n).some(o=>o6(n,o)),"attr:edge.side":n=>Va(n).some(o=>o.labelSide!==void 0),"attr:set.tag":n=>Pn(n).some(o=>o.type==="strip"&&o.tag!==void 0),"edge:->":n=>Va(n).length>0,"edge:start":n=>Va(n).some(o=>o.from==="start"),"edge:finish":n=>Va(n).some(o=>o.to==="finish"),"edge:before-step":n=>(n.state?.paths??[]).length>0,"head:branch":n=>(n.git?.branches??[]).length>0,"head:commit":n=>li(n).length>0,"attr:branch.note":n=>(n.git?.branches??[]).some(o=>o.note!==void 0),"attr:commit.hash":n=>li(n).some(o=>o.hash!==void 0),"attr:commit.note":n=>li(n).some(o=>o.note!==void 0),"git:from":n=>Pn(n).some(o=>o.type==="branch"),"git:copy":n=>li(n).some(o=>o.copy!==void 0),"git:merge":n=>li(n).some(o=>o.merge!==void 0),"kind:time":n=>n.kind==="time","head:scale":n=>n.time!==void 0,"attr:scale.from":n=>n.time?.scale.from!==void 0,"head:period":n=>n.time?.period!==void 0,"attr:period.from":n=>n.time?.period?.from!==void 0,"head:span":n=>nd(n).length>0,"attr:span.shape":n=>nd(n).some(o=>o.shape!==void 0),"attr:span.color":n=>nd(n).some(o=>o.color!==void 0),"attr:strip.meter":n=>(n.strip?.meters??[]).length>0,"head:row":n=>(n.time?.rows??[]).length>0,"attr:row.color":n=>(n.time?.rows??[]).some(o=>o.color!==void 0),"attr:row.empty":n=>(n.time?.rows??[]).some(o=>o.empty!==void 0),"head:mark":n=>Pn(n).some(o=>o.type==="mark"),"attr:mark.color":n=>Pn(n).some(o=>o.type==="mark"),"head:point":n=>(n.time?.points??[]).length>0,"attr:note.color":n=>Pn(n).some(o=>o.type==="swap"&&o.color!==void 0),"head:zoom":n=>n.time?.zoom!==void 0,"attr:edge.at":n=>Va(n).some(o=>o.at!==void 0),"attr:edge.into":n=>Va(n).some(o=>o.into!==void 0)},r6=Di.flatMap(n=>{const o=Za(wa(n,"ja"));return o.ok?[{key:n,diagram:o.diagram}]:[]}),l6=n=>r6.filter(({diagram:o})=>n.kinds.includes(o.kind)&&n.words.some(c=>i6[c]?.(o)===!0)).map(({key:o,diagram:c})=>({key:o,kind:c.kind})),xg=n=>{const[o,c=""]=n.split(":");return o==="attr"?`[${c.split(".")[1]??c}: …]`:n==="edge:before-step"?"->":c};function c6({lang:n}){const o=pt[n],c=o.site.catalog,u=p=>v.jsxs("header",{className:"catalog-section-head",children:[v.jsx("h2",{className:"catalog-section-title",children:c.sections[p].title}),v.jsx("p",{className:"catalog-section-lead",children:c.sections[p].lead})]});return v.jsxs("div",{className:"catalog-page","data-catalog":"index",children:[v.jsxs("div",{className:"catalog-hero",children:[v.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":c.crumb,children:[v.jsx("a",{href:wt.home,onClick:p=>At(p),children:o.site.nav.home}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:o.site.screens.catalog.title})]}),v.jsx("h1",{className:"catalog-title",children:o.site.screens.catalog.title}),v.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:c.lead(fi.length,un.length,Di.length)})]}),v.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"parts",children:[u("parts"),v.jsx("div",{className:"catalog-part-grid",children:fi.filter(md).map(p=>v.jsx(gd,{part:p,lang:n},p.id))})]}),v.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"kind-parts",children:[u("kind-parts"),v.jsx("div",{className:"catalog-part-grid",children:fi.filter(p=>!md(p)).map(p=>v.jsx(gd,{part:p,lang:n},p.id))})]}),v.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"kinds",children:[u("kinds"),v.jsx("div",{className:"catalog-index-grid",children:un.map((p,s)=>v.jsxs("a",{className:"catalog-index-card","data-catalog":"card",href:`${wt.catalog}/${p}`,onClick:r=>At(r),children:[v.jsxs("div",{className:"catalog-index-card-top",children:[v.jsxs("div",{className:"catalog-index-card-head",children:[v.jsx("span",{className:"catalog-index-card-no","data-catalog":"card-no",children:String(s+1).padStart(2,"0")}),v.jsx("span",{className:"catalog-index-card-count","data-catalog":"card-count",children:c.count(yg(p).length)})]}),v.jsx("h2",{className:"catalog-index-card-title",children:o.shelf.kinds[p]}),v.jsx("p",{className:"catalog-index-card-desc","data-catalog":"card-desc",children:c.kinds[p]})]}),v.jsx("span",{className:"catalog-index-card-link","data-catalog":"card-open",children:c.open})]},p))})]})]})}function gd({part:n,lang:o,name:c="part-card"}){const u=pt[o],p=u.site.catalog;return v.jsxs("a",{className:"catalog-part-card","data-catalog":c,"data-part":n.id,href:`${wt.catalog}/part/${n.id}`,onClick:s=>At(s),children:[v.jsxs("span",{className:"catalog-part-card-head",children:[v.jsx("span",{className:"catalog-part-card-name",children:p.parts[n.id].name}),!md(n)&&v.jsx("span",{className:"catalog-part-card-kind",children:p.kindOnly(n.kinds.map(s=>u.shelf.kinds[s]).join("、"))})]}),v.jsx("span",{className:"catalog-part-card-words",children:n.words.map(s=>v.jsx("code",{children:xg(s)},s))})]})}const u6=11,d6=1.5,wl=1.2,mo=[.25,4];function p6(n,o,c,u=u6){if(n.width<=0||n.height<=0||o.width<=0||o.height<=0)return 1;const p=Math.min(n.width/o.width,n.height/o.height),s=c>0?u/c:0;return Math.min(d6,Math.max(s,p))}const kl=(n,o)=>Math.min(mo[1],Math.max(mo[0],n*o)),ci=n=>Number.parseFloat(n)||0;function Ud(n,o,{palette:c,theme:u,lang:p,onStep:s,fitHeight:r=!1,onPlayer:l}){const[m,h]=Me.useState(null),g=Me.useRef(s),x=Me.useRef(l);return Me.useEffect(()=>{g.current=s,x.current=l}),Me.useEffect(()=>{const A=n.current;if(!A||!o)return;const w=gg(A,o,{palette:c,theme:u,lang:p,onStep:N=>g.current(N),fitHeight:r});x.current?.(w);const D=A.querySelector(".dg-frame"),T=()=>{const N=A.querySelector('svg[data-dragon="figure"]');if(!D||!N||N.dataset.view!=="fixed"){h(null);return}if(D.clientWidth===0)return;const M=getComputedStyle(D),z={width:D.clientWidth-ci(M.paddingLeft)-ci(M.paddingRight),height:D.clientHeight-ci(M.paddingTop)-ci(M.paddingBottom)},ae=N.viewBox.baseVal,le=N.querySelector(".dg-sn"),V=le?ci(getComputedStyle(le).fontSize):0,J=r?P0:void 0;h({width:ae.width,scale:p6(z,{width:ae.width,height:ae.height},V,J)})},B=new ResizeObserver(T);return D&&B.observe(D),()=>{B.disconnect(),w.destroy(),x.current?.(null)}},[n,o,c,u,p,r]),m}const wg="(max-width: 439px)";function h6(n){const o=matchMedia(wg);return o.addEventListener("change",n),()=>o.removeEventListener("change",n)}const f6=()=>matchMedia(wg).matches;function kg(){return Me.useSyncExternalStore(h6,f6)}const hl="site";function Eg(n){const o=Za(n);if(!o.ok)return null;const c=wi(o.diagram);return c.ok?c.diagram:null}function m6(n){const o=decodeURIComponent(location.hash.slice(1));return n.find(c=>c===o)??null}function g6(n,o,c){const u=c.trim().toLowerCase();if(u==="")return!0;const p=Qa(n,o);return[p?.title??"",p?.about??"",n].some(s=>s.toLowerCase().includes(u))}function y6({kind:n,lang:o,theme:c,palette:u}){const p=pt[o],s=p.site.catalog,r=yg(n),[l,m]=Me.useState(""),[h,g]=Me.useState(()=>m6(r)),[x,A]=Me.useState("figure"),[w,D]=Me.useState("notation"),[T,B]=Me.useState(null),[N,M]=Me.useState(!1),z=T?.site===u?T.palette:hl,ae=z===hl?u:z,le=r.filter(X=>g6(X,o,l)),V=h!==null&&r.includes(h)?h:r[0],J=p.shelf.kinds[n];return v.jsxs("div",{className:"catalog-page","data-catalog":"category",children:[v.jsxs("div",{className:"catalog-hero",children:[v.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":s.crumb,children:[v.jsx("a",{href:wt.home,onClick:X=>At(X),children:p.site.nav.home}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("a",{href:wt.catalog,onClick:X=>At(X),children:p.site.screens.catalog.title}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:J})]}),v.jsx("h1",{className:"catalog-title",children:J}),v.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:s.kinds[n]}),v.jsxs("div",{className:"catalog-meta",children:[v.jsx("span",{className:"catalog-count","data-catalog":"count",children:s.total(r.length)}),le.length!==r.length&&v.jsx("span",{className:"catalog-count catalog-count-filter",children:s.showing(le.length)})]})]}),v.jsxs("div",{className:"catalog-body",children:[v.jsxs("aside",{className:"catalog-sidebar","data-catalog":"sidebar","aria-label":s.list,children:[v.jsxs("div",{className:"catalog-search-wrap",children:[v.jsx("span",{className:"catalog-search-icon","aria-hidden":"true"}),v.jsx("input",{type:"text",className:"catalog-search","data-catalog":"search",placeholder:s.search,"aria-label":s.searchLabel,value:l,onChange:X=>m(X.target.value)}),l!==""&&v.jsx("button",{type:"button",className:"catalog-search-clear","data-catalog":"search-clear","aria-label":s.clearSearch,onClick:()=>m(""),children:"×"})]}),v.jsx("div",{className:"catalog-list",role:"list",children:le.length===0?v.jsx("p",{className:"catalog-list-empty","data-catalog":"empty",children:s.nothing}):le.map(X=>v.jsx("button",{type:"button",role:"listitem",className:"catalog-list-item","data-catalog":"item","aria-current":X===V?"true":void 0,onClick:()=>g(X),children:Qa(X,o)?.title??X},X))})]}),v.jsx("section",{className:"catalog-preview","data-catalog":"preview","aria-label":s.preview,children:V!==void 0&&v.jsx(b6,{sample:V,lang:o,theme:c,palette:ae,choice:z,onChoice:X=>B(X===hl?null:{site:u,palette:X}),view:x,onView:A,source:w,onSource:D,onExpand:()=>M(!0)},V)})]}),v.jsxs("section",{className:"catalog-section catalog-uses","data-catalog":"uses","aria-label":s.uses,children:[v.jsxs("header",{className:"catalog-section-head",children:[v.jsx("h2",{className:"catalog-section-title",children:s.uses}),v.jsx("p",{className:"catalog-section-lead",children:s.usesLead})]}),v.jsx("div",{className:"catalog-part-grid",children:n6(n).map(X=>v.jsx(gd,{part:X,lang:o,name:"uses-part"},X.id))})]}),N&&V!==void 0&&v.jsx(v6,{sample:V,lang:o,theme:c,palette:ae,onClose:()=>M(!1)})]})}function b6({sample:n,lang:o,theme:c,palette:u,choice:p,onChoice:s,view:r,onView:l,source:m,onSource:h,onExpand:g}){const x=pt[o],A=x.site.catalog,w=wa(n,o),D=Qa(n,o),T=D?.title??n,B=Me.useMemo(()=>Eg(w),[w]),N=Me.useRef(null),[M,z]=Me.useState(0),[ae,le]=Me.useState(1),[V,J]=Me.useState(!1),X=kg(),W=Ud(N,B,{palette:u,theme:c,lang:o,onStep:z});Me.useEffect(()=>{if(!V)return;const G=window.setTimeout(()=>J(!1),1600);return()=>window.clearTimeout(G)},[V]);const re=B?.steps.length??0,ye=B?.steps[Math.min(M,re-1)],he=re>1&&ye!==void 0,me=W?kl(W.scale,ae):null,Oe=W!==null&&r==="figure",xe=me===null||!Oe?"—":`${Math.round(me*100)}%`,C=G=>{W&&le(kl(W.scale,ae*G)/W.scale)},$=m==="notation"?w:B?JSON.stringify(B,null,2):"",q=()=>{navigator.clipboard?.writeText($).then(()=>J(!0),()=>{})};return v.jsxs("article",{className:"catalog-preview-card",children:[v.jsxs("header",{className:"catalog-preview-head",children:[v.jsx("h2",{className:"catalog-preview-title",children:T}),D?.about&&v.jsx("p",{className:"catalog-preview-sub","data-catalog":"about",children:D.about})]}),v.jsxs("div",{className:"catalog-preview-tabs",children:[v.jsx("div",{className:"catalog-tablist",role:"tablist","aria-label":A.views,children:["figure","code"].map(G=>v.jsx("button",{type:"button",role:"tab",className:"catalog-preview-tab","data-catalog":`tab-${G}`,"aria-selected":r===G,onClick:()=>l(G),children:G==="figure"?A.figure:A.code},G))}),v.jsxs("div",{className:"catalog-preview-actions",children:[v.jsxs("label",{className:"catalog-option",children:[v.jsx("span",{className:"catalog-option-label",children:x.palette}),v.jsx("span",{className:"catalog-select-field",children:v.jsxs("select",{className:"catalog-select","data-catalog":"palette",value:p,onChange:G=>s(G.target.value),children:[v.jsx("option",{value:hl,children:A.sameAsSite}),Object.values(ba).map(G=>v.jsx("option",{value:G.id,children:x.paletteNames[G.id]??G.name},G.id))]})})]}),v.jsxs("div",{className:"catalog-zoom",role:"group","aria-label":x.stage.zoom,children:[v.jsx(ad,{name:"zoom-out",icon:"zoom-out",label:x.stage.zoomOut,disabled:!Oe||me===mo[0],onClick:()=>C(1/wl)}),X?v.jsx("button",{type:"button",className:"catalog-zoom-btn catalog-zoom-fit","data-catalog":"zoom-level","aria-label":`${x.stage.fit} (${xe})`,title:x.stage.fit,disabled:!Oe,onClick:()=>le(1),children:xe}):v.jsx("span",{className:"catalog-zoom-value","data-catalog":"zoom-level",children:xe}),v.jsx(ad,{name:"zoom-in",icon:"zoom-in",label:x.stage.zoomIn,disabled:!Oe||me===mo[1],onClick:()=>C(wl)}),!X&&v.jsx(ad,{name:"fit",icon:"fit",label:x.stage.fit,disabled:!Oe,onClick:()=>le(1)})]}),v.jsxs("button",{type:"button",className:"catalog-expand-btn","data-catalog":"expand","aria-label":A.expandLabel(T),onClick:g,children:[v.jsx("span",{className:"pg-icon","data-icon":"fullscreen","aria-hidden":"true"}),v.jsx("span",{children:A.expand})]})]})]}),v.jsxs("div",{className:"catalog-preview-stage pg-figure","data-catalog":"stage","data-phased":he?"on":void 0,hidden:r!=="figure",style:W&&me!==null?{"--fig-w":`${W.width*me}px`}:void 0,children:[he&&v.jsxs("p",{className:"pg-phase","data-catalog":"phase-badge",children:[v.jsx("span",{className:"pg-phase-dot","aria-hidden":"true"}),x.stage.phase(M+1,re,ye.title)]}),v.jsx("div",{className:"pg-player",ref:N})]}),r==="figure"&&(he||ye?.body)&&v.jsxs("div",{className:"catalog-preview-note",children:[he&&v.jsx("div",{className:"pg-progress","data-catalog":"progress","aria-hidden":"true",children:B?.steps.map((G,R)=>v.jsx("span",{className:"pg-progress-seg","data-catalog":"progress-seg","data-done":R<=M},`${R}-${G.title}`))}),ye?.body&&v.jsx("p",{className:"catalog-step-note","data-catalog":"step-note",children:ye.body})]}),v.jsxs("div",{className:"catalog-source","data-catalog":"source",role:"region",hidden:r!=="code","aria-label":A.source,children:[v.jsxs("div",{className:"catalog-source-bar",children:[v.jsx("div",{className:"catalog-source-tabs",role:"group",children:["notation","json"].map(G=>v.jsx("button",{type:"button",className:"catalog-source-tab","data-catalog":`source-${G}`,"aria-pressed":m===G,onClick:()=>h(G),children:G==="notation"?x.notation:"JSON"},G))}),v.jsxs("button",{type:"button",className:"catalog-source-copy","data-catalog":"copy",onClick:q,children:[v.jsx("span",{className:"catalog-copy-icon","aria-hidden":"true"}),v.jsx("span",{"aria-live":"polite",children:V?A.copied:A.copy})]})]}),v.jsx("pre",{className:"catalog-source-code","data-catalog":"source-code",children:v.jsx("code",{children:$})})]}),v.jsx("footer",{className:"catalog-preview-foot",children:v.jsx("a",{className:"catalog-preview-link","data-catalog":"open-editor",href:`${wt.editor}${Rd(w)}`,onClick:G=>At(G),children:A.openEditor})})]})}function ad({name:n,icon:o,label:c,disabled:u,onClick:p}){return v.jsx("button",{type:"button",className:"catalog-zoom-btn","data-catalog":n,"aria-label":c,title:c,disabled:u,onClick:p,children:v.jsx("span",{className:"pg-icon","data-icon":o,"aria-hidden":"true"})})}function v6({sample:n,lang:o,theme:c,palette:u,onClose:p}){const s=pt[o],r=wa(n,o),l=Qa(n,o),m=Me.useMemo(()=>Eg(r),[r]),h=Me.useRef(null),g=Me.useRef(null),x=Ud(h,m,{palette:u,theme:c,lang:o,onStep:()=>{},fitHeight:!0}),A=Me.useRef(p);return Me.useEffect(()=>{A.current=p}),Me.useEffect(()=>{const w=document.activeElement instanceof HTMLElement?document.activeElement:null;g.current?.focus();const D=B=>{B.key==="Escape"&&A.current()};addEventListener("keydown",D);const T=document.body.style.overflow;return document.body.style.overflow="hidden",()=>{removeEventListener("keydown",D),document.body.style.overflow=T,w?.focus()}},[]),v.jsx("div",{className:"catalog-overlay","data-catalog":"overlay",role:"dialog","aria-modal":"true","aria-labelledby":"catalog-overlay-title",onClick:w=>{w.target===w.currentTarget&&p()},children:v.jsxs("div",{className:"catalog-overlay-card",children:[v.jsxs("div",{className:"catalog-overlay-head",children:[v.jsxs("div",{children:[v.jsx("h2",{className:"catalog-overlay-title",id:"catalog-overlay-title","data-catalog":"overlay-title",children:l?.title??n}),l?.about&&v.jsx("p",{className:"catalog-overlay-desc",children:l.about})]}),v.jsx("button",{ref:g,type:"button",className:"catalog-overlay-close","data-catalog":"overlay-close","aria-label":s.site.catalog.close,onClick:p,children:"×"})]}),v.jsx("div",{className:"catalog-overlay-stage pg-figure",style:x?{"--fig-w":`${x.width*x.scale}px`}:void 0,children:v.jsx("div",{className:"pg-player",ref:h})})]})})}function x6(n){let o;try{o=JSON.parse(n)}catch{return null}const c=wi(o);return c.ok?c.diagram:null}function w6(n){const o=Za(n);return o.ok?o.diagram:null}function Ml({notation:n,lang:o,theme:c,palette:u,whole:p=!1,json:s=!1,onStep:r,className:l}){const m=Me.useRef(null),h=Me.useMemo(()=>{const x=s?x6(n):w6(n);return x?p?{...x,view:"fixed"}:x:null},[n,p,s]),g=Me.useRef(r);return Me.useEffect(()=>{g.current=r}),Me.useEffect(()=>{const x=m.current;if(!x||!h)return;const A=gg(x,h,{palette:u,theme:c,lang:o,onStep:w=>g.current?.(w)});return()=>A.destroy()},[h,u,c,o]),v.jsx("div",{ref:m,className:l})}function k6({part:n,lang:o,theme:c,palette:u}){const p=pt[o],s=p.site.catalog,r=s.parts[n.id];return v.jsxs("div",{className:"catalog-page","data-catalog":"part",children:[v.jsxs("div",{className:"catalog-hero",children:[v.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":s.crumb,children:[v.jsx("a",{href:wt.home,onClick:l=>At(l),children:p.site.nav.home}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("a",{href:wt.catalog,onClick:l=>At(l),children:p.site.screens.catalog.title}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:r.name})]}),v.jsx("h1",{className:"catalog-title",children:r.name}),v.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:r.desc}),v.jsxs("dl",{className:"catalog-part-facts",children:[v.jsxs("div",{className:"catalog-part-fact",children:[v.jsx("dt",{children:s.partKinds}),v.jsx("dd",{className:"catalog-part-kinds","data-catalog":"part-kinds",children:n.kinds.map(l=>v.jsx("a",{href:`${wt.catalog}/${l}`,onClick:m=>At(m),children:p.shelf.kinds[l]},l))})]}),v.jsxs("div",{className:"catalog-part-fact",children:[v.jsx("dt",{children:s.words}),v.jsx("dd",{className:"catalog-part-words","data-catalog":"part-words",children:n.words.map(l=>v.jsx("code",{children:xg(l)},l))})]})]})]}),v.jsx("div",{className:"catalog-part-figures","data-count":n.kinds.length,children:n.kinds.map(l=>v.jsx(A6,{part:n,kind:l,lang:o,theme:c,palette:u},l))}),n.id==="icon"&&v.jsx(E6,{lang:o}),v.jsxs("section",{className:"catalog-section","data-catalog":"part-samples","aria-label":s.partSamples,children:[v.jsxs("header",{className:"catalog-section-head",children:[v.jsx("h2",{className:"catalog-section-title",children:s.partSamples}),v.jsx("p",{className:"catalog-section-lead",children:s.partSamplesLead})]}),v.jsx("div",{className:"catalog-part-grid",children:l6(n).map(({key:l,kind:m})=>v.jsxs("a",{className:"catalog-part-card","data-catalog":"part-sample","data-sample":l,href:`${wt.catalog}/${m}#${l}`,onClick:h=>At(h),children:[v.jsxs("span",{className:"catalog-part-card-head",children:[v.jsx("span",{className:"catalog-part-card-name",children:Qa(l,o)?.title??l}),v.jsx("span",{className:"catalog-part-card-kind",children:p.shelf.kinds[m]})]}),v.jsx("span",{className:"catalog-part-sample-about",children:Qa(l,o)?.about})]},l))})]})]})}function E6({lang:n}){const o=pt[n].site.catalog,c=Object.keys(ws).sort();return v.jsxs("section",{className:"catalog-section","data-catalog":"part-icons","aria-label":o.partIcons,children:[v.jsxs("header",{className:"catalog-section-head",children:[v.jsx("h2",{className:"catalog-section-title",children:o.partIcons}),v.jsx("p",{className:"catalog-section-lead",children:o.partIconsLead(c.length)})]}),v.jsx("ul",{className:"catalog-icon-grid",children:c.map(u=>v.jsxs("li",{className:"catalog-icon","data-icon":u,children:[v.jsx("span",{className:"catalog-icon-chip",dangerouslySetInnerHTML:{__html:I1(u)??""}}),v.jsx("code",{className:"catalog-icon-name",children:u})]},u))})]})}function A6({part:n,kind:o,lang:c,theme:u,palette:p}){const s=pt[c],r=s.site.catalog,l=s6(n.id,o,c);return v.jsxs("section",{className:"catalog-part-figure","data-catalog":"part-figure","data-kind":o,"aria-label":s.shelf.kinds[o],children:[v.jsx("h2",{className:"catalog-part-figure-title",children:s.shelf.kinds[o]}),v.jsx(Ml,{className:"catalog-part-stage",notation:l,lang:c,theme:u,palette:p,whole:!0}),v.jsx("pre",{className:"catalog-part-source","data-catalog":"part-source","aria-label":r.source,children:v.jsx("code",{children:l})}),v.jsx("a",{className:"catalog-preview-link catalog-part-open","data-catalog":"part-open-editor",href:`${wt.editor}${Rd(l)}`,onClick:m=>At(m),children:r.openEditor})]})}const S6=`sequence 注文を受ける

box 客 [note: 注文する人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 台帳 [note: 注文を残す, color: green, icon: db]

step 注文を送る
  say 客が店のアプリに注文を送り、店のアプリが台帳に残す。
  客 -> 店: 注文する
  店 -> 台帳: 残す
`,_6=`sequence Take an order

box customer as Customer [note: places the order, color: slate, icon: user]
box shop as Shop app [note: takes the order, color: blue, icon: app]
box ledger as Ledger [note: keeps the order, color: green, icon: db]

step Send the order
  say The customer sends an order to the shop app, and the shop app keeps it in the ledger.
  customer -> shop: place order
  shop -> ledger: keep
`,$6=`sequence 運ばれる物を見分ける

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
`,D6=`sequence Tell what travels

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
`,N6=`sequence 在庫を確かめる

box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 倉庫 [note: 在庫を持つ, color: amber, icon: box]

step 在庫を聞く
  say 店のアプリが倉庫に在庫を聞き、倉庫は棚を数えてから答える。
  店 -> 倉庫: 在庫はあるか
  act 倉庫: 棚を数える
  倉庫 -> 店: 3 個ある
`,T6=`sequence Check the stock

box shop as Shop app [note: takes the order, color: blue, icon: app]
box warehouse as Warehouse [note: holds the stock, color: amber, icon: box]

step Ask for stock
  say The shop app asks the warehouse for stock, and the warehouse counts the shelf before it answers.
  shop -> warehouse: in stock?
  act warehouse: count the shelf
  warehouse -> shop: 3 left
`,M6=`git fix は merge commit で、feature は当て直して取り込む

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
`,C6=`git Merge fix with a merge commit and replay feature

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
`,O6=`{
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
`,B6=`{
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
`,j6=`architecture 店と倉庫をつなぐ

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
`,z6=`architecture Connect the shop and the warehouse

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
`,R6=`architecture 注文を倉庫へ回す

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
`,q6=`architecture Pass orders to the warehouse

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
`,H6=`sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する]
box アプリ [note: ログインを頼む側]

step ログインを押す
  say 利用者がアプリのログインを押す。
  ブラウザ -> アプリ: GET /login
`,U6=`sequence Ask to sign in

box browser as User's browser [note: operated by the user]
box app as App [note: asks for sign-in]

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
`,L6=`state 注文が届くまでの状態

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
`,F6=`state States of an order until it arrives

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
`,G6=`sequence 代金を払う

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
`,Y6=`sequence Pay for the order

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
`,P6=`sequence 注文の状態を追う

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
`,V6=`sequence Follow the order

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
`,Ld=`v${"0.42.0".split(".").slice(0,2).join(".")}`,X6=["start","rules","boxes","edges","regions","state","git","steps","strip","carry","json","place","export","migrate"],Q6=["start","boxes","regions","steps","json","export"],Z6={start:{screen:"editor"},rules:{section:"boxes"},boxes:{section:"edges"},edges:{section:"regions"},regions:{kind:"architecture"},state:{kind:"state"},git:{kind:"git"},steps:{section:"strip"},strip:{kind:"sequence"},carry:{section:"json"},json:{screen:"editor"},place:{section:"export"},export:{screen:"editor"},migrate:{screen:"editor"}},J6={place:[['import "@cardenelabs/dragon/fonts";','import { mountDiagram, parseNotation } from "@cardenelabs/dragon";',"",'const source = await (await fetch("login.dragon")).text();',"const parsed = parseNotation(source);",'if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\\n"));',"",'const host = document.getElementById("figure");','if (host === null) throw new Error("#figure not found");',"const player = mountDiagram(host, parsed.diagram);"].join(`
`),null,null],export:["npm install @cardenelabs/dragon",`pnpm add -D playwright-core
pnpm exec playwright-core install chromium`,"dragon export login.dragon --out out"]},fl={ja:{eyebrow:n=>`使い方の案内 · ${n}`,lead:"dragon記法の書き方を 1 枚にまとめた読み物。最初の 5 分で図を動かし、決まり 4 つを押さえてから、箱、線、区画、状態遷移図、枝分かれの図、段、帯、運ぶ物の順に記法の要素を掴む。JSON との行き来と、mp4 や GIF への書き出しと、前の形から書き直す対応表もここで扱う。",start:"5 分で始める →",browse:"カタログで図を見る",iconLink:"使える絵柄を部品「絵」の頁で全て見る →",sections:{start:{title:"5 分で動かす",text:["何も入れずに試すなら、編集画面を開く。左の欄に記法を書くと、右にその場で動く図が出る。","記法は行の頭の語で、その行に何を書くかが決まる。最初の行に図の種類と題を書き、`sequence` なら時間の順に箱どうしのやり取りを、`architecture` なら区画に置いた箱のつながりを描く。","次に登場する箱を `box` の行で並べ、`step` の行の下に字下げして、その段で起きることを起きる順に書く。下の例は箱 2 つと段 1 つの、いちばん小さな図になる。"],exit:"編集画面で書いてみる →"},rules:{title:"決まり",text:["dragon記法は、どの行も次の決まり 4 つに従う。決まりを押さえておけば、初めて見る行も形から読める。",'下の例は 4 つの決まりを全部使う。区画を `group` と `end` で囲み、`,` を含む札の値を `"` で囲み、長い本文を `say` の下に字下げして続けている。'],exit:"続き → 箱"},boxes:{title:"箱",text:["箱は `box <名札> as <名前> [note: <下の字>]` で宣言する。名札は線や処理で箱を指す時の呼び名で、図には名前と下の字が出る。`as <名前>` を省くと、名札がそのまま名前になる。",'`[ ]` の中に `color: <色>` を足すと箱の色の役が、`icon: <印>` を足すと名前の横の印が付き、2 つ以上は `,` で区切る。色は `blue` や `green` のような色の役の名前で、印は `user` や `db` のような名前で選ぶ。名前に `[` を、値に `,` か `]` を含める時は `"` で囲む。',"`link: <飛び先>` を足すと、描いた図でその箱が飛び先への link になり、箱の中の仕組みを描いた別の図の頁などへ移れる。飛び先は `/` で始まる path か、`http://` か `https://` で始まる URL で書く。","箱は宣言した順に並ぶ。時系列図では箱ごとに縦の線が左から右へ立ち、線はその間を走る。"],exit:"続き → 線"},edges:{title:"線",text:["線は `<名札> -> <名札>: <線の名前>` で書き、段の中に書いた順に走る。名前は省ける。","`act <名札>: <処理の名前>` は、線を引かずに箱の中で行う処理を表す。受け取った物を確かめる、数を数える、のような箱の中だけで済む動きに使う。","線の名前の置き場所は自動で決まる。崩れた時だけ、線の行の終わりに `[side: above]` か `below`、`left`、`right` を足して置く側を指す。"],exit:"続き → 区画"},regions:{title:"区画",text:["構成図では、箱を区画に分けて置ける。区画は `group <名札> as <名前> [note: <添え書き>]` の行で開いて `end` の行で閉じ、その間に書いた `box` の行の箱が区画の中に置かれる。","区画も `color:` と `icon:` を持てる。仕組みの持ち主や置き場所の境目 (チェーンと網、店と倉庫) を見せる時に使う。","同じ区画の箱が離れて並ぶ時は、同じ `group <名札>` をもう一度開いて続きの箱を書く。2 度目は名札だけを書き、名前と札は最初の 1 度だけ書く。"],exit:"構成図の見本を見る →"},state:{title:"状態遷移図",text:["1 つの物が状態を移る様子を段ごとに追う時は、最初の行を `state <題>` にする。箱が状態になり、線は状態から状態への移り変わりになる。札が乗っている状態は光り、札が出た状態には済んだ印が残る。","線の送る側に `start` を書くと始まりの印から出る線に、受ける側に `finish` を書くと終わりの印へ入る線になる。`start` と `finish` は箱の名札に使えない。","最初の `step` の行より前に書いた線は、移れるが今回は通らない道として点線で引き、運ぶ物を走らせない。どの段も辿り着かない状態 (例のキャンセル) は、図の右上の脇道の囲みに入る。"],exit:"状態遷移図の見本を見る →"},git:{title:"枝分かれの図",text:["git の枝に commit を積み、取り込むまでを段ごとに追う時は、最初の行を `git <題>` にする。枝は `branch <枝> [note: <添え書き>]` の行で上から順に宣言し、枝ごとに帯が並ぶ。箱は無くてもよい。","段の中では `commit <名札> on <枝>` で枝の先に commit を積み、`[hash: <hash>, note: <一言>]` で丸の外に hash と一言を添える。`copy <元>` を付けると元の commit を写した当て直しの commit に、`merge <枝>` を付けるとその枝の先端も親に持つ merge commit になる。","`<枝> from <commit>` でその commit から枝を切る。`<札> -> <commit>` は commit を作らずに枝の札か `HEAD` を動かし、`HEAD` を動かすと枝から離れる。どの札からも辿れなくなった commit (例の C) は点線の丸に変わる。"],exit:"枝分かれの図の見本を見る →"},steps:{title:"段",text:["段は `step <見出し>` の行で区切り、図はこの単位で 1 段ずつ進む。段の中の行は字下げして書き、その段で起きることを語る `say` の行を必ず書く。本文を 2 行以上に分ける時は、`say` だけの行の下に、さらに深く字下げして続ける。","例の `code pay(1200)` の行のように、`code` の行はその段で打つ命令になる。1 つの段に 1 行まで書ける。","`source <名前> [url: <URL>]` の行は、その段の出典になる。1 つの段に何行でも書け、図と見える語りには出さず、読み上げの段の一覧に名前の link で出る。URL の形は箱の飛び先と同じ。","`note <名札>: <字>` は、その段から箱の下の字を書き換える。残高や状態のように、段を追って替わる値を箱の上で見せる。","見せ方は最初の行の終わりに `[view: fixed]` か `[view: follow]` を足して選ぶ。`fixed` は全体を止めて中だけを動かし、`follow` は今動いている所へ寄って動かす。書かなければ、全体を枠に収めた時の字の大きさで決まる。"],exit:"続き → 帯"},strip:{title:"帯",text:["帯は図に添える中身の表で、段を追って替わる値を見せる。`strip <題>: <欄>, <欄>` で欄を宣言する。","段の中で `set <欄>: <値>` と書くとその欄に値が入り、`set <欄> [tag: <札>]` と書くとその欄に札が付く。","認可コードや注文の状態のように、やり取りの間に持ち物が替わる様子を、線とは別に追える。"],exit:"時系列図の見本を見る →"},carry:{title:"運ぶ物",text:["線の上には、何が運ばれたかを示す物が走る。何も書かなければ封筒が走る。","線の行の終わりに `[tag: <値>]` を足すと字を書いた札を、`[carry: coin]` を足すと硬貨を走らせる。番号や証明のような値が動く線には札を、代金やトークンのように価値が動く線には硬貨を使う。","`[carry: none]` は何も走らせない。知らせるだけで物が動かない線に使う。"],exit:"続き → JSON"},json:{title:"JSON",text:["記法と JSON は行き来できる。人は記法で書き、道具や AI は JSON (原本) で持つ。下の例は 5 分で動かすの節の図を JSON で書いた物で、図はその JSON をそのまま読んで描いている。","JSON は `version` に形式の版を持ち、古い版は読む時に今の形へ直す。形は package の `src/schemas/diagram.schema.json` が持つ。","`parseNotation` は記法を JSON に、`printNotation` は JSON を記法に直し、`readDiagram` は JSON を確かめて読む。JSON から記法へ書き戻すと決まった並べ方に整うので、書き手の行の並べ方と `//` で始まる注釈の行は残らない。"],exit:"編集画面で JSON を取り込む →"},place:{title:"頁に置く",text:["自分の頁に図を置く時は、頁で 1 度だけ字の入口 `@cardenelabs/dragon/fonts` を import し、記法を読んだ原本を `mountDiagram` に渡す。下の例は package の README と同じ物。","字の入口は、同梱の 2 つの字 (Noto Sans JP と JetBrains Mono) の CSS を読み込むだけで、何も出さない。図は同梱の字で測った字の幅で組むため、読み込まないと端末の字で描かれ、札から字がはみ出すことがある。CSS と字の file は、束ねる道具 (Vite など) が頁へ運ぶ。","`mountDiagram` が返す `player` で段を動かす (`next`、`prev`、`play`、`pause`、`destroy`)。3 つめの引数には、色味や段が替わった時に呼ぶ関数などの設定 (`PlayerOptions`) を渡す。"],exit:"続き → 書き出し"},export:{title:"書き出し",text:["同じ原本から、mp4、GIF、HTML、PNG を書き出せる。package を入れると `dragon` の命令が使える。","書き出しは画面なしの Chromium で、頁と同じ描画を 1 コマずつ撮る。Chromium を動かす `playwright-core` は、書き出しを使う時だけ入れる。","原本の JSON (`.json`) か記法 (`.dragon`) を渡すと、同じ名前の 4 つの file を書き出す。PNG は最後の段の止め絵になる。"],exit:"編集画面から書き出す →"},migrate:{title:"前の形から書き直す",text:["前の形の記法 (`時系列図` か `構成図` で始まり、段を `#` で区切る形) は読めなくなった。前の形の行を読むと、その行の新しい形を示す誤りで止まる。","前の形を新しい形へ移す命令は無いので、下の表を見て行ごとに書き直す。左が前の形、右が新しい形になる。"],exit:"編集画面で書き直す →"}},cards:{start:"導入なし。編集画面を開いて書くだけで図が動く。",boxes:"名前と下の字と色と印で、登場する物を描く。",regions:"構成図の箱を、持ち主ごとの区画に分けて置く。",steps:"図は段ごとに進み、本文がその段の動きを語る。",json:"人は記法で、道具は JSON で、同じ図を持つ。",export:"同じ図を mp4、GIF、HTML、PNG に書き出す。"},options:{head:["設定","意味"],rows:(n,o)=>[["--out <dir>","書き出す先。無ければ作る (既定は今の dir)"],["--width <px>","枠の幅。見せ方 (`fixed` / `follow`) を選び、`follow` の時の窓の幅になる"],["--palette <名前>",`色味 (${n}、既定は \`${o}\`)`],["--theme <明暗>","`light` か `dark`"],["--lang <言葉>","図の中の字と命令の文の言葉 (`ja` か `en`)。既定は `ja`"],["--fps <数>","mp4 の 1 秒のコマの数 (既定 30)"],["--gif-fps <数>","GIF の 1 秒のコマの数 (既定 10)"],["--format <形>","書き出す形を `,` で区切る (既定 `mp4,gif,html,png`)"]]},rules:["行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる","鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる",'空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `"` で囲む',"入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする"],migration:{head:["前の形","新しい形"],rows:[["`時系列図 <題>`","`sequence <題>`"],["`構成図 <題>`","`architecture <題>`"],["`見せ方 止める`、`見せ方 寄る`","`sequence <題> [view: fixed]`、`sequence <題> [view: follow]`"],["`区画 <名札> = <名前>「<添え書き>」`","`group <名札> as <名前> [note: <添え書き>]` から `end` まで"],["箱の行の `[区画 <名札>]`","`group <名札>` と `end` の間に `box` の行を書く"],["`<名札> = <名前>「<下の字>」`","`box <名札> as <名前> [note: <下の字>]`"],["`[色 <色>]`、`[印 <印>]`","`box <名札> [color: <色>, icon: <印>]`"],["`帯 <題> = <欄>, <欄>`","`strip <題>: <欄>, <欄>`"],["`# <題>`","`step <題>`"],["`> <本文>`","`say <本文>`"],["バッククォートで囲んだ行","`code <命令>`"],["`<名札> -> <名札> : <線の名前>`","`<名札> -> <名札>: <線の名前>`"],["`[札 <値>]`、`[硬貨]`、`[なし]`","`<名札> -> <名札> [tag: <値>]`、`<名札> -> <名札> [carry: coin]`、`<名札> -> <名札> [carry: none]`"],["`[名前 上]`","`<名札> -> <名札> [side: above]`"],["`[名前 下]`","`<名札> -> <名札> [side: below]`"],["`[名前 左]`","`<名札> -> <名札> [side: left]`"],["`[名前 右]`","`<名札> -> <名札> [side: right]`"],["`<名札> : <処理の名前>`","`act <名札>: <処理の名前>`"],["`<名札>「<字>」`","`note <名札>: <字>`"],["`帯 <欄> = <値>`","`set <欄>: <値>`"],["`帯 <欄> [<札>]`","`set <欄> [tag: <札>]`"]]}},en:{eyebrow:n=>`guide • ${n}`,lead:"One page that lays out how to write dragon notation. Get a diagram moving in the first five minutes, learn the four rules, then take in the parts of the notation in order: boxes, lines, regions, state diagrams, git graphs, steps, the strip and what travels. Going between the notation and JSON, exporting to mp4 or GIF, and a table for rewriting the old form are covered here too.",start:"Start in five minutes →",browse:"Browse the catalog",iconLink:"See every icon on the Icon part page →",sections:{start:{title:"Up and running in five minutes",text:["To try it without installing anything, open the editor. Write notation in the box on the left and a moving diagram appears on the right as you type.","The first word of each line says what the line holds. The first line gives the diagram kind and title: `sequence` draws boxes exchanging messages in time order, and `architecture` draws how boxes placed in regions connect.","Then list the boxes that take part with `box` lines, and indented under a `step` line, write what happens in that step in the order it happens. The example below is the smallest diagram: two boxes and one step."],exit:"Write one in the editor →"},rules:{title:"Rules",text:["Every line of dragon notation follows the four rules below. Once you know them, you can read a line you have not seen before from its shape.",'The example below uses all four rules. It wraps the regions in `group` and `end`, wraps a tag value that contains `,` in `"`, and continues a long body indented under `say`.'],exit:"Next → Boxes"},boxes:{title:"Boxes",text:["Declare a box with `box <id> as <name> [note: <caption>]`. The id is how lines and actions point at the box, and the name and caption are what the diagram shows. Without `as <name>`, the id is the name.",'Inside the `[ ]`, add `color: <color>` to give the box a colour role and `icon: <icon>` to put an icon next to its name, separating two or more with `,`. Colours are role names such as `blue` or `green`, and icons are names such as `user` or `db`. Wrap a name in `"` when it contains `[`, and a value when it contains `,` or `]`.',"Add `link: <target>` and the box becomes a link to that target in the drawn diagram, for example to the page of another diagram that draws what is inside the box. Write the target as a path that starts with `/` or a URL that starts with `http://` or `https://`.","Boxes line up in the order you declare them. In a sequence diagram each box gets a vertical line from left to right, and lines run between them."],exit:"Next → Lines"},edges:{title:"Lines",text:["Write a line as `<id> -> <id>: <label>`. Lines run in the order they are written in the step, and the label can be left out.","`act <id>: <action>` is something a box does inside itself, without drawing a line. Use it for work that stays inside the box, such as checking what arrived or counting.","The label is placed automatically. Only when the placement breaks, add `[side: above]`, `below`, `left` or `right` at the end of the line to say which side it goes."],exit:"Next → Regions"},regions:{title:"Regions",text:["In an architecture diagram, boxes can be placed in regions. Open a region with a `group <id> as <name> [note: <note>]` line and close it with an `end` line, and the boxes on the `box` lines in between go inside it.","Regions can also take `color:` and `icon:`. Use them to show where ownership or placement changes, such as between chains and a network, or a shop and a warehouse.","When boxes of the same region are not next to each other, open the same `group <id>` again and write the rest of its boxes. The second time, write only the id, and give the name and attributes only the first time."],exit:"See the architecture samples →"},state:{title:"State diagrams",text:["To follow one thing as it moves between states step by step, start the first line with `state <title>`. Each box is a state, and each line is a move from one state to another. The state the tag sits on lights up, and a state the tag has left keeps a done mark.","Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark. `start` and `finish` cannot be used as box ids.","Lines written before the first `step` line are paths the diagram could take but does not take this time. They are drawn dotted, and nothing travels on them. A state that no step reaches (Cancelled in the example) goes in the side-path box at the top right."],exit:"See the state diagram samples →"},git:{title:"Git graphs",text:["To follow commits on git branches step by step until they are merged, start the first line with `git <title>`. Declare branches from top to bottom with `branch <branch> [note: <note>]` lines, and each branch gets its own band. Boxes are optional.","Inside a step, `commit <id> on <branch>` adds a commit at the tip of the branch, and `[hash: <hash>, note: <note>]` puts a hash and a short note beside the circle. Add `copy <source>` for a replayed copy of another commit, or `merge <branch>` for a merge commit whose parents include the tip of that branch.","`<branch> from <commit>` cuts a branch at that commit. `<ref> -> <commit>` moves a branch ref or `HEAD` without making a commit, and moving `HEAD` detaches it from its branch. A commit that no ref can reach any more (C in the example) turns into a dotted circle."],exit:"See the git graph samples →"},steps:{title:"Steps",text:["Steps are separated by `step <heading>` lines, and the diagram moves on one step at a time. Indent the lines inside a step, and every step needs a `say` line that tells what happens in it. To split the body over two or more lines, write `say` alone and continue on lines indented further below it.","A `code` line, like the `code pay(1200)` line in the example, is the command for that step. A step can have at most one.","A `source <name> [url: <URL>]` line is a source for that step. A step can have any number of them. They stay out of the diagram and the shown text, and appear as links named by the source in the step list that screen readers read. The URL takes the same forms as a box link.","`note <id>: <text>` rewrites the caption under a box from that step on. Use it to show a value that changes step by step, such as a balance or a state, right on the box.","Choose the view by adding `[view: fixed]` or `[view: follow]` at the end of the first line. `fixed` keeps the whole diagram still and moves only what is inside, and `follow` moves to where things are happening. Without it, the view is chosen by the text size when the whole diagram fits the frame."],exit:"Next → The strip"},strip:{title:"The strip",text:["The strip is a table that goes with the diagram and shows values that change step by step. Declare its fields with `strip <title>: <field>, <field>`.","Inside a step, `set <field>: <value>` puts a value in a field, and `set <field> [tag: <tag>]` puts a tag on it.","It lets you follow what is held while messages go back and forth, such as an authorization code or the state of an order, apart from the lines."],exit:"See the sequence samples →"},carry:{title:"What travels",text:["Something runs along each line to show what was carried. Without any option, an envelope travels.","Adding `[tag: <value>]` at the end of the line sends a tag with text on it, and `[carry: coin]` sends a coin. Use a tag for lines that move a value such as a number or a proof, and a coin for lines that move worth such as money or tokens.","`[carry: none]` sends nothing. Use it for lines that only tell, with nothing changing hands."],exit:"Next → JSON"},json:{title:"JSON",text:["The notation and JSON convert both ways. People write the notation, and tools and AI keep the JSON (the source). The example below is the diagram from the five-minute section written as JSON, and the diagram is drawn by reading that JSON as it is.","The JSON holds the format version in `version`, and older versions are converted to the current shape when read. The shape is defined in the package's `src/schemas/diagram.schema.json`.","`parseNotation` turns the notation into JSON, `printNotation` turns JSON back into the notation, and `readDiagram` checks and reads JSON. Writing JSON back as notation uses a fixed layout, so the writer's line order and the comment lines that start with `//` are not kept."],exit:"Import JSON in the editor →"},place:{title:"Placing on a page",text:["To place a diagram on your own page, import the font entry `@cardenelabs/dragon/fonts` once on the page, and pass the source read from the notation to `mountDiagram`. The example below is the same as in the package README.","The font entry only loads the CSS for the two bundled fonts (Noto Sans JP and JetBrains Mono) and exports nothing. Diagrams are laid out with character widths measured from the bundled fonts, so without it they are drawn in the device's fonts and text can overflow its labels. A bundler (such as Vite) carries the CSS and font files to the page.","Use the `player` returned by `mountDiagram` to move through the steps (`next`, `prev`, `play`, `pause`, `destroy`). The third argument takes settings such as the palette and a function called when the step changes (`PlayerOptions`)."],exit:"Next → Export"},export:{title:"Export",text:["The same source can be exported to mp4, GIF, HTML and PNG. Install the package and the `dragon` command is available.","Export uses a headless Chromium and captures the same drawing as the page one frame at a time. Install `playwright-core`, which runs Chromium, only when you use export.","Pass the source JSON (`.json`) or the notation (`.dragon`) and it writes four files with the same name. The PNG is a still of the last step."],exit:"Export from the editor →"},migrate:{title:"Rewriting the old form",text:["The old form of the notation (steps separated by `#`, bodies starting with `>`, and the same lines in Japanese words) is no longer read. Reading an old line stops with an error that shows the new form of that line.","There is no command that moves the old form to the new one, so rewrite each line with the table below. The left column is the old form with English words, and the right column is the new form."],exit:"Rewrite in the editor →"}},cards:{start:"Nothing to set up. Open the editor and write.",boxes:"Draw what takes part with a name, a caption, a colour and an icon.",regions:"Put the boxes of an architecture diagram in regions by owner.",steps:"The diagram moves step by step, and the body tells what each step does.",json:"People keep the notation, and tools keep the same diagram as JSON.",export:"Export the same diagram to mp4, GIF, HTML and PNG."},options:{head:["Option","Meaning"],rows:(n,o)=>[["--out <dir>","Where to write. Created if missing (default: the current dir)"],["--width <px>","Frame width. Picks the view (`fixed` / `follow`) and sets the window width for `follow`"],["--palette <name>",`Colours (${n}, default \`${o}\`)`],["--theme <mode>","`light` or `dark`"],["--lang <lang>","Language of the diagram text and command messages (`ja` or `en`). Defaults to `ja`"],["--fps <n>","Frames per second of the mp4 (default 30)"],["--gif-fps <n>","Frames per second of the GIF (default 10)"],["--format <list>","Formats to write, separated by `,` (default `mp4,gif,html,png`)"]]},rules:["The first English word of a line decides its kind. Only arrow lines start with a box id","A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`",'Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`',"The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`"],migration:{head:["Old form","New form"],rows:[["`sequence <title>`, `architecture <title>`","`sequence <title>`, `architecture <title>` (unchanged)"],["`view fixed`, `view follow`","`sequence <title> [view: fixed]`, `sequence <title> [view: follow]`"],['`region <id> = <name> "<note>"`',"`group <id> as <name> [note: <note>]` through `end`"],["`[region <id>]` on a box line","`box` lines between `group <id>` and `end`"],['`<id> = <name> "<caption>"`',"`box <id> as <name> [note: <caption>]`"],["`[color <color>]`, `[icon <icon>]`","`box <id> [color: <color>, icon: <icon>]`"],["`strip <title> = <field>, <field>`","`strip <title>: <field>, <field>`"],["`# <heading>`","`step <heading>`"],["`> <body>`","`say <body>`"],["A line wrapped in backticks","`code <command>`"],["`<id> -> <id> : <label>`","`<id> -> <id>: <label>`"],["`[tag <value>]`, `[coin]`, `[none]`","`<id> -> <id> [tag: <value>]`, `<id> -> <id> [carry: coin]`, `<id> -> <id> [carry: none]`"],["`[label above]`","`<id> -> <id> [side: above]`"],["`[label below]`","`<id> -> <id> [side: below]`"],["`[label left]`","`<id> -> <id> [side: left]`"],["`[label right]`","`<id> -> <id> [side: right]`"],["`<id> : <action>`","`act <id>: <action>`"],['`<id> "<text>"`',"`note <id>: <text>`"],["`strip <field> = <value>`","`set <field>: <value>`"],["`strip <field> [<tag>]`","`set <field> [tag: <tag>]`"]]}}},K6=Object.assign({"./examples/boxes.dragon":S6,"./examples/boxes.en.dragon":_6,"./examples/carry.dragon":$6,"./examples/carry.en.dragon":D6,"./examples/edges.dragon":N6,"./examples/edges.en.dragon":T6,"./examples/git.dragon":M6,"./examples/git.en.dragon":C6,"./examples/json.en.json":O6,"./examples/json.json":B6,"./examples/regions.dragon":j6,"./examples/regions.en.dragon":z6,"./examples/rules.dragon":R6,"./examples/rules.en.dragon":q6,"./examples/start.dragon":H6,"./examples/start.en.dragon":U6,"./examples/state.dragon":L6,"./examples/state.en.dragon":F6,"./examples/steps.dragon":G6,"./examples/steps.en.dragon":Y6,"./examples/strip.dragon":P6,"./examples/strip.en.dragon":V6});function W6(n,o){return K6[`./examples/${n}${o==="en"?".en":""}.${n==="json"?"json":"dragon"}`]?.trimEnd()}function ui(n){return n.split("`").map((o,c)=>v.jsx(Me.Fragment,{children:c%2===1?v.jsx("code",{children:o}):o},c))}function I6(n){return"section"in n?`#${n.section}`:"kind"in n?`${wt.catalog}/${n.kind}`:wt[n.screen]}function k0({head:n,rows:o,docs:c}){return v.jsxs("table",{className:"docs-options","data-docs":c,children:[v.jsx("thead",{children:v.jsx("tr",{children:n.map(u=>v.jsx("th",{children:u},u))})}),v.jsx("tbody",{children:o.map(([u,p],s)=>v.jsxs("tr",{children:[v.jsx("td",{children:u}),v.jsx("td",{children:p})]},s))})]})}function ek({id:n,index:o,lang:c,theme:u,palette:p}){const s=fl[c].sections[n],r=W6(n,c),l=J6[n]??[],m=Z6[n],{options:h,rules:g,migration:x}=fl[c];return v.jsxs("section",{id:n,className:"docs-sec","data-docs":"section",children:[v.jsxs("div",{className:"docs-sec-head",children:[v.jsx("span",{className:"docs-sec-no","data-docs":"section-no",children:String(o+1).padStart(2,"0")}),v.jsx("h2",{children:s.title})]}),s.text.map((A,w)=>v.jsxs(Me.Fragment,{children:[v.jsx("p",{className:"docs-sec-text","data-docs":"text",children:ui(A)}),l[w]!=null&&v.jsx("pre",{className:"docs-command","data-docs":"command",children:v.jsx("code",{children:l[w]})})]},A)),n==="boxes"&&v.jsx("a",{className:"docs-sec-cta","data-docs":"icon-link",href:`${wt.catalog}/part/icon`,onClick:A=>At(A),children:fl[c].iconLink}),n==="rules"&&v.jsx("ol",{className:"docs-rules","data-docs":"rules",children:g.map(A=>v.jsx("li",{"data-docs":"rule",children:ui(A)},A))}),r!==void 0&&v.jsxs("div",{className:"docs-example","data-docs":"example",children:[v.jsx("pre",{className:"docs-example-code","data-docs":"example-code",children:v.jsx("code",{children:r})}),v.jsx(Ml,{className:"docs-example-figure",notation:r,json:n==="json",lang:c,theme:u,palette:p,whole:!0})]}),n==="export"&&v.jsx(k0,{head:h.head,rows:h.rows(Object.keys(ba).map(A=>`\`${A}\``).join(" / "),yl).map(([A,w])=>[v.jsx("code",{children:A},"option"),ui(w)])}),n==="migrate"&&v.jsx(k0,{head:x.head,rows:x.rows.map(([A,w])=>[ui(A),ui(w)]),docs:"migration"}),v.jsx("a",{className:"docs-sec-cta","data-docs":"section-cta",href:I6(m),onClick:"section"in m?void 0:A=>At(A),children:s.exit})]})}function tk({lang:n,theme:o,palette:c}){const u=fl[n];return Me.useEffect(()=>{const p=decodeURIComponent(location.hash.slice(1));p!==""&&document.getElementById(p)?.scrollIntoView()},[]),v.jsxs("div",{className:"docs",children:[v.jsxs("section",{className:"docs-hero","data-docs":"hero",children:[v.jsx("div",{className:"docs-eyebrow","data-docs":"eyebrow",children:u.eyebrow(Ld)}),v.jsx("h1",{children:pt[n].site.screens.docs.title}),v.jsx("p",{className:"docs-lead","data-docs":"lead",children:u.lead}),v.jsxs("div",{className:"docs-cta","data-docs":"cta",children:[v.jsx("a",{className:"docs-btn-primary",href:wt.editor,onClick:p=>At(p),children:u.start}),v.jsx("a",{className:"docs-btn-secondary",href:wt.catalog,onClick:p=>At(p),children:u.browse})]})]}),v.jsx("nav",{className:"docs-features","data-docs":"features",children:Q6.map(p=>v.jsxs("a",{className:"docs-card","data-docs":"card",href:`#${p}`,children:[v.jsx("span",{className:"docs-card-icon","data-icon":p,"aria-hidden":"true"}),v.jsx("span",{className:"docs-card-name","data-docs":"card-name",children:u.sections[p].title}),v.jsx("p",{children:u.cards[p]})]},p))}),v.jsx("div",{className:"docs-sections",children:X6.map((p,s)=>v.jsx(ek,{id:p,index:s,lang:n,theme:o,palette:c},p))})]})}const nk=`sequence ログイン処理

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
`,ak=`sequence Sign-in

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
`,sk={ja:nk.trimEnd(),en:ak.trimEnd()},ok="login.dragon",ik=["write","play","share"],rk=/^step(\s|$)/u;function lk(n){const o=n.split(`
`),c=o.flatMap((u,p)=>rk.test(u)?[p]:[]);return c.map((u,p)=>{let s=(c[p+1]??o.length)-1;for(;s>u&&(o[s]??"").trim()==="";)s--;return Array.from({length:s-u+1},(r,l)=>u+l+1)})}function ck(n){let o;return n.map((c,u)=>{const p=c.trim(),s=c.length-c.trimStart().length;if(o!==void 0&&p!==""&&s>o)return"say";o=void 0;const r=p.split(/\s/u)[0];return p.startsWith("//")?"comment":r==="step"?"step":r==="say"?(o=s,"say"):r==="code"?"code":u===0?"head":void 0})}function uk({lang:n,theme:o,palette:c}){const u=pt[n],p=sk[n],[s,r]=Me.useState(0),l=Me.useMemo(()=>{const x=Za(p);return x.ok?x.diagram.steps:[]},[p]),m=new Set(lk(p)[s]??[]),h=Me.useMemo(()=>ck(p.split(`
`)),[p]),g=l[Math.min(s,l.length-1)];return v.jsx("section",{className:"home-demo","data-home":"demo",children:v.jsxs("div",{className:"home-canvas",children:[v.jsxs("div",{className:"home-canvas-bar",children:[v.jsxs("div",{className:"home-canvas-file",children:[v.jsxs("span",{className:"home-dots","aria-hidden":"true",children:[v.jsx("span",{}),v.jsx("span",{}),v.jsx("span",{})]}),v.jsx("span",{className:"home-file","data-home":"demo-file",children:ok})]}),g!==void 0&&v.jsxs("span",{className:"home-phase","data-home":"demo-phase",children:[v.jsx("span",{className:"home-live-dot","aria-hidden":"true"}),u.stage.phase(Math.min(s,l.length-1)+1,l.length,g.title)]})]}),v.jsxs("div",{className:"home-canvas-body",children:[v.jsx("div",{className:"home-code","data-home":"demo-code",children:p.split(`
`).map((x,A)=>v.jsxs("div",{className:"home-code-line","data-line":A+1,"data-current":m.has(A+1),"data-kind":h[A],children:[v.jsx("span",{className:"home-ln","aria-hidden":"true",children:A+1}),v.jsx("span",{className:"home-code-text","data-home":"code-text",children:x})]},A))}),v.jsx(Ml,{className:"home-canvas-stage",notation:p,lang:n,theme:o,palette:c,onStep:r,whole:!0})]})]})})}function dk({lang:n,theme:o,palette:c}){const u=pt[n].site,p=u.home,[s,r,l]=p.title,m=pt[n].shelf.kinds,h=p3.flatMap(g=>{const x=Qa(g,n);return x?[{key:g,...x}]:[]});return v.jsxs("div",{className:"home",children:[v.jsxs("section",{className:"home-hero","data-home":"hero",children:[v.jsxs("div",{className:"home-eyebrow",children:[v.jsx("span",{className:"home-chip","data-home":"version",children:Ld}),v.jsx("span",{className:"home-chip",children:p.chip(Object.values(m))})]}),v.jsxs("h1",{children:[s,v.jsx("em",{children:r}),l]}),v.jsx("p",{className:"home-lead",children:p.lead}),v.jsxs("div",{className:"home-cta",children:[v.jsx("a",{className:"home-btn-primary",href:wt.editor,onClick:g=>At(g),children:u.openEditor}),v.jsx("a",{className:"home-btn-secondary",href:wt.docs,onClick:g=>At(g),children:p.readDocs})]})]}),v.jsx(uk,{lang:n,theme:o,palette:c}),v.jsxs("section",{className:"home-features","data-home":"features",children:[v.jsxs("div",{className:"home-head",children:[v.jsx("span",{className:"home-head-eyebrow",children:p.features.eyebrow}),v.jsx("h2",{children:p.features.title})]}),v.jsx("div",{className:"home-grid",children:p.features.items.map((g,x)=>v.jsxs("div",{className:"home-feature","data-home":"feature",children:[v.jsx("span",{className:"home-feature-icon","data-home":"feature-icon","data-icon":ik[x],"aria-hidden":"true"}),v.jsx("h3",{children:g.title}),v.jsx("p",{children:g.text})]},g.title))})]}),v.jsxs("section",{className:"home-steps","data-home":"steps",children:[v.jsxs("div",{className:"home-head",children:[v.jsx("span",{className:"home-head-eyebrow",children:p.steps.eyebrow}),v.jsx("h2",{children:p.steps.title})]}),v.jsx("div",{className:"home-grid",children:p.steps.items.map((g,x)=>v.jsxs("div",{className:"home-step","data-home":"step",children:[v.jsx("div",{className:"home-step-no","data-home":"step-no",children:String(x+1).padStart(2,"0")}),v.jsx("h3",{children:g.title}),v.jsx("p",{children:g.text}),x===1&&v.jsx("pre",{className:"home-step-code","data-home":"step-code",children:dl[n]})]},g.title))})]}),v.jsxs("section",{className:"home-uses","data-home":"uses",children:[v.jsxs("div",{className:"home-head",children:[v.jsx("span",{className:"home-head-eyebrow",children:p.uses.eyebrow}),v.jsx("h2",{children:p.uses.title})]}),v.jsx("div",{className:"home-use-grid",children:h.map(g=>v.jsxs("a",{className:"home-use","data-home":"use",href:`${wt.catalog}/${g.kind}`,onClick:x=>At(x),children:[v.jsx(Ml,{className:"home-use-thumb",notation:wa(g.key,n),lang:n,theme:o,palette:c,whole:!0}),v.jsxs("div",{className:"home-use-body",children:[v.jsx("span",{className:"home-use-kind","data-home":"use-kind",children:m[g.kind]}),v.jsx("h3",{children:g.title}),v.jsx("p",{"data-home":"use-about",children:g.about})]})]},g.key))}),v.jsx("div",{className:"home-uses-more","data-home":"uses-more",children:v.jsx("a",{className:"home-link",href:wt.catalog,onClick:g=>At(g),children:p.uses.more})})]}),v.jsxs("section",{className:"home-closing","data-home":"closing",children:[v.jsx("h2",{children:p.closing.title}),v.jsx("p",{children:p.closing.lead}),v.jsxs("div",{className:"home-cta",children:[v.jsx("a",{className:"home-btn-primary",href:wt.editor,onClick:g=>At(g),children:u.openEditor}),v.jsx("a",{className:"home-btn-secondary",href:qd,target:"_blank",rel:"noopener noreferrer",children:"GitHub ↗"})]})]})]})}const E0=["editor","catalog","docs"],pk=4;function hk({lang:n,path:o}){const c=pt[n].site,u=c.notFound,p=c.screens["not-found"].title,s={editor:c.openEditor,catalog:u.catalog,docs:u.docs};return v.jsxs("section",{className:"not-found",children:[v.jsxs("div",{className:"not-found-code","data-not-found":"code","aria-label":"404",children:[v.jsx("span",{"aria-hidden":"true",children:"4"}),v.jsx("span",{className:"not-found-zero","aria-hidden":"true",children:"0"}),v.jsx("span",{"aria-hidden":"true",children:"4"})]}),v.jsx("div",{className:"not-found-ticks","aria-hidden":"true",children:Array.from({length:pk},(r,l)=>v.jsx("span",{},l))}),v.jsxs("h1",{children:[v.jsx("em",{children:u.em}),p.slice(u.em.length)]}),v.jsx("p",{className:"not-found-lead","data-not-found":"lead",children:u.lead(E0.length)}),v.jsx("div",{className:"not-found-cta","data-not-found":"cta",children:E0.map((r,l)=>v.jsx("a",{className:l===0?"not-found-btn-primary":"not-found-btn-secondary",href:wt[r],onClick:m=>At(m),children:s[r]},r))}),v.jsx("p",{className:"not-found-path","data-not-found":"path",children:o})]})}const Ag=n=>n.map((o,c)=>({n:o,i:c})).sort((o,c)=>(o.n.line??1/0)-(c.n.line??1/0)||o.i-c.i).map(({n:o})=>o),fk=n=>Ag(n.map(o=>({line:o.line,text:o.message})));function mk(n,o){const c=o===void 0?void 0:vk(o);return Ag(n.map(u=>{const p=c?bk(c,u.pointer):void 0;return{...p!==void 0?{line:p}:{},text:`${u.pointer||"/"} — ${u.message}`}}))}function gk(n,o){const c=/\bline (\d+)/u.exec(n);if(c)return Number(c[1]);const u=/\bposition (\d+)/u.exec(n);if(u)return o.slice(0,Number(u[1])).split(`
`).length}const yk=n=>n.replaceAll("~","~0").replaceAll("/","~1");function bk(n,o){for(let c=o;;c=c.slice(0,c.lastIndexOf("/"))){const u=n.get(c);if(u!==void 0)return u;if(c==="")return}}function vk(n){const o=new Map;let c=0,u=1;const p=()=>{for(;c<n.length&&/\s/u.test(n[c]??"");)n[c]===`
`&&u++,c++},s=()=>{const l=c;for(c++;c<n.length&&n[c]!=='"';)c+=n[c]==="\\"?2:1;return c++,JSON.parse(n.slice(l,c))},r=(l,m)=>{o.set(l,m);const h=n[c];if(h==="{"||h==="["){c++;for(let g=0;c<n.length;g++){if(p(),n[c]==="}"||n[c]==="]"){c++;return}if(n[c]===","&&(c++,p()),h==="{"){const x=u,A=s();p(),c++,p(),r(`${l}/${yk(A)}`,x)}else r(`${l}/${g}`,u)}return}if(h==='"'){s();return}for(;c<n.length&&!/[\s,\]}]/u.test(n[c]??"");)c++};return p(),r("",u),o}function xk(n){const o=[];for(const c of Di){const u=Za(wa(c,n),{lang:n});if(!u.ok)continue;const{kind:p,title:s}=u.diagram,r=o.find(l=>l.kind===p);r?r.samples.push({key:c,title:s}):o.push({kind:p,samples:[{key:c,title:s}]})}return o}const yd=/^step(\s|$)/u,sd=/^box\s/u,wk=/^group(\s|$)/u;function kk(n,o){const c=o.length+1,u=new Int32Array((n.length+1)*c),p=(r,l)=>u[r*c+l]??0;for(let r=n.length-1;r>=0;r--)for(let l=o.length-1;l>=0;l--)u[r*c+l]=n[r]===o[l]?p(r+1,l+1)+1:Math.max(p(r+1,l),p(r,l+1));const s=[];for(let r=0,l=0;l<o.length;)r<n.length&&n[r]===o[l]?(r++,l++):r<n.length&&p(r+1,l)>=p(r,l+1)?r++:(s.push(l),l++);return s}function Sg(n,o){const c=bi(n).split(`
`),u=bi(o).split(`
`),p=u.findIndex(r=>yd.test(r)),s={declarations:[],steps:[]};for(const r of kk(c,u)){const l=u[r]??"";l.trim()!==""&&(p>=0&&r>=p?s.steps:s.declarations).push(l)}return s}function Ek(n,o){const c=n.replace(/\s+$/u,"").split(`
`);let u=-1;const p=()=>{const h=c.findIndex((x,A)=>A>0&&yd.test(x.trim()));let g=h<0?c.length:h;for(;g>1&&c[g-1]?.trim()==="";)g--;return g},s=(h,g)=>{c.splice(h,0,...g);const x=h+Math.max(g.findIndex(A=>A!==""),0);(u<0||x<u)&&(u=x)},r=o.declarations.some(h=>wk.test(h.trim())),l=r?[]:o.declarations.filter(h=>sd.test(h.trim())),m=r?o.declarations:o.declarations.filter(h=>!sd.test(h.trim()));if(l.length>0){const h=p();let g=-1;for(let x=0;x<h;x++)sd.test(c[x]?.trim()??"")&&(g=x);s(g<0?h:g+1,l)}return m.length>0&&s(p(),r?["",...m]:m),o.steps.length>0&&s(c.length,yd.test(o.steps[0]??"")?["",...o.steps]:o.steps),{text:c.join(`
`),line:u+1}}const Ak=["box","region","step","edge","edge-tag","edge-coin","edge-none","edge-below","action","swap","strip"],Sk={ja:{box:"箱",newBox:"新しい箱",region:"区画",newRegion:"新しい区画",newStep:"新しい段",stepBody:"この段で起きることを書く。",call:"呼ぶ",handOver:"渡す",key:"鍵",pay:"払う",notify:"知らせる",process:"処理する",rewritten:"書き換えた字",stripTitle:"状態",stripField:"値",stripValue:"1"},en:{box:"box",newBox:"New box",region:"zone",newRegion:"New region",newStep:"New step",stepBody:"Write what happens in this step.",call:"call",handOver:"hand over",key:"key",pay:"pay",notify:"notify",process:"process",rewritten:"Rewritten",stripTitle:"State",stripField:"value",stripValue:"1"}};function _g(n,o){const c=new Set([...n.boxes.map(p=>p.id),...(n.regions??[]).map(p=>p.id)]);let u=1;for(;c.has(`${o}${u}`);)u++;return`${o}${u}`}function bd(n,o,c){const u=_g(n,o.box),p=c??(n.kind==="architecture"?n.boxes.at(-1)?.region:void 0),s={id:u,name:o.newBox,...p?{region:p}:{}},r=n.sequence?{sequence:{lifelines:[...n.sequence.lifelines,u]}}:{};return{id:u,diagram:{...n,boxes:[...n.boxes,s],...r}}}function $g(n,o){const[c,u]=n.boxes;if(c&&u)return{diagram:n,from:c.id,to:u.id};const p=bd(n,o);return{diagram:p.diagram,from:c?.id??p.id,to:p.id}}function ml(n,o){const c=n.steps.at(-1);return c?{...n,steps:[...n.steps.slice(0,-1),{...c,events:[...c.events,o]}]}:n}const di=(n,o,c)=>(u,p)=>{const s=$g(u,p);return ml(s.diagram,{type:"edge",from:s.from,to:s.to,label:p[o],carry:n,...c?{labelSide:c}:{}})},_k={box:(n,o)=>bd(n,o).diagram,region:(n,o)=>{const c=_g(n,o.region);return bd({...n,regions:[...n.regions??[],{id:c,name:o.newRegion}]},o,c).diagram},step:(n,o)=>{const c=$g(n,o),u={title:o.newStep,body:o.stepBody,events:[{type:"edge",from:c.from,to:c.to,label:o.call,carry:{kind:"envelope"}}]};return{...c.diagram,steps:[...c.diagram.steps,u]}},edge:di({kind:"envelope"},"call"),"edge-tag":(n,o)=>di({kind:"tag",text:o.key},"handOver")(n,o),"edge-coin":di({kind:"coin"},"pay"),"edge-none":di({kind:"none"},"notify"),"edge-below":di({kind:"envelope"},"call","below"),action:(n,o)=>ml(n,{type:"action",box:n.boxes[0]?.id??"",label:o.process}),swap:(n,o)=>ml(n,{type:"swap",box:n.boxes[0]?.id??"",text:o.rewritten}),strip:(n,o)=>{const c=n.strip??{title:o.stripTitle,fields:[o.stripField]};return ml({...n,strip:c},{type:"strip",field:c.fields[0]??o.stripField,value:o.stripValue})}},Dg=(n,o,c)=>Sg(o,_k[n](o,Sk[c])),$k={ja:{title:"題",id:"名札",name:"名前",note:"添え書き",color:"色",icon:"印",link:"飛び先",field:"欄",value:"値",tag:"札",stepTitle:"段の題",stepBody:"段の本文",command:"命令",source:"出典の名前",url:"URL",label:"線の名前",action:"処理の名前",text:"字",memo:"メモ",branch:"枝",hash:"hash",message:"一言",unit:"目盛りの名前",length:"長さ",count:"数",number:"番号",tick:"目盛り",first:"最初",last:"最後"},en:{title:"title",id:"id",name:"name",note:"note",color:"color",icon:"icon",link:"link",field:"field",value:"value",tag:"tag",stepTitle:"step title",stepBody:"step body",command:"command",source:"source name",url:"URL",label:"label",action:"action",text:"text",memo:"memo",branch:"branch",hash:"hash",message:"message",unit:"unit",length:"length",count:"count",number:"number",tick:"tick",first:"first",last:"last"}};function Dk(n){const o=Object.fromEntries(Object.entries($k[n]).map(([V,J])=>[V,`<${J}>`])),c=V=>V,u=V=>c({version:Sl,kind:V,title:o.title,boxes:[],steps:[]}),p=u("sequence"),s={title:o.stepTitle,body:o.stepBody,events:[]},r=c({...p,steps:[s]}),l=(V,J={})=>c({...p,...J,steps:[{...s,events:V}]}),m=(V,J)=>({type:"edge",from:o.id,to:o.id,label:o.label,carry:V,...J?{labelSide:J}:{}}),h=V=>V.flatMap(([J,X])=>{const W=Sg(J,X);return[...W.declarations,...W.steps]}),g={title:o.title,fields:[o.field]},x=V=>bi(V).split(`
`)[0]??"",A=c({...u("state"),steps:[s]}),w=(V,J)=>({type:"edge",from:V,to:J,label:o.label,carry:{kind:"envelope"}}),D=c({...u("git"),git:{branches:[{id:o.branch}]},steps:[s]}),T=V=>c({...D,steps:[{...s,events:V}]}),B=V=>({type:"commit",id:o.id,branch:o.branch,...V}),N={unit:o.unit,length:o.length,count:o.count},M=(V={})=>c({...u("time"),time:{scale:N,rows:[],...V},steps:[s]}),z=M(),ae=(V,J=z)=>c({...J,steps:[{...s,events:V}]}),le=c({...M({zoom:{from:o.first,to:o.last}}),boxes:[{id:o.id,name:o.id}]});return[{id:"kind",lines:[x(p),x(u("architecture")),x(u("state")),x(u("git")),x(u("time"))]},{id:"view",lines:h([[p,c({...p,view:"fixed"})],[p,c({...p,view:"follow"})]])},{id:"region",lines:h([[p,c({...p,regions:[{id:o.id,name:o.name,note:o.note,color:o.color,icon:o.icon}],boxes:[{id:o.id,name:o.name,region:o.id}]})]])},{id:"box",lines:h([[p,c({...p,boxes:[{id:o.id,name:o.name,sub:o.note,color:o.color,icon:o.icon,link:o.link}]})]])},{id:"strip",lines:h([[p,c({...p,strip:{title:o.title,fields:[o.field,o.field]}})]])},{id:"step",lines:h([[p,r]])},{id:"code",lines:h([[r,c({...p,steps:[{...s,code:o.command}]})]])},{id:"source",lines:h([[r,c({...p,steps:[{...s,sources:[{name:o.source,url:o.url}]}]})]])},{id:"edge",lines:h([[r,l([m({kind:"envelope"})])]])},{id:"carry",lines:h([{kind:"tag",text:o.value},{kind:"coin"},{kind:"none"}].map(V=>[r,l([m(V)])]))},{id:"side",lines:h(["above","below","left","right"].map(V=>[r,l([m({kind:"envelope"},V)])]))},{id:"start-finish",lines:h([[A,c({...A,steps:[{...s,events:[w("start",o.id),w(o.id,"finish")]}]})]])},{id:"path",lines:h([[A,c({...A,state:{paths:[{from:o.id,to:o.id,label:o.label}]}})]])},{id:"branch",lines:h([[c({...u("git"),steps:[s]}),c({...D,git:{branches:[{id:o.branch,note:o.note}]}})],[D,T([{type:"branch",branch:o.branch,from:o.id}])]])},{id:"commit",lines:h([[D,T([B({hash:o.hash,note:o.message})])]])},{id:"copy",lines:h([[D,T([B({copy:o.id})])]])},{id:"merge",lines:h([[D,T([B({merge:o.branch})])]])},{id:"ref",lines:h([[D,T([{type:"edge",from:o.branch,to:o.id,label:o.label,carry:{kind:"tag",text:o.branch}}])]])},{id:"scale",lines:h([[c({...u("time"),steps:[s]}),M({scale:{...N,from:o.number}})]])},{id:"period",lines:h([[z,M({period:{name:o.name,length:o.count,from:o.number}})]])},{id:"row",lines:h([[z,M({rows:[{id:o.id,name:o.name,color:o.color,empty:[o.tick]}]})]])},{id:"point",lines:h([[z,M({points:[{id:o.id,at:o.tick}]})]])},{id:"zoom",lines:h([[z,M({zoom:{from:o.first,to:o.last}})],[le,ae([{type:"edge",from:o.id,to:o.id,carry:{kind:"envelope"},at:o.tick,into:o.tick}],le)]])},{id:"now",lines:h([[z,ae([{type:"now",to:o.tick}])]])},{id:"mark",lines:h([[z,ae([{type:"mark",row:o.id,from:o.first,to:o.last,color:o.color}])]])},{id:"span",lines:h([[z,ae([{type:"span",from:o.first,to:o.last,text:o.text}])],[z,ae([{type:"span",from:o.first,to:o.last,text:o.text,shape:"box",color:o.color}])]])},{id:"action",lines:h([[r,l([{type:"action",box:o.id,label:o.action}])]])},{id:"swap",lines:h([[r,l([{type:"swap",box:o.id,text:o.text}])]])},{id:"strip-value",lines:h([[c({...r,strip:g}),l([{type:"strip",field:o.field,value:o.value,tag:o.tag}],{strip:g})]])},{id:"comment",lines:[`// ${o.memo}`]}]}const Nk=["samples","parts","notation"];function Tk({lang:n,base:o,active:c,open:u,onClose:p,onNew:s,onSample:r,onPart:l}){const m=pt[n].shelf,[h,g]=Me.useState("samples"),[x,A]=Me.useState(""),w=Me.useMemo(()=>xk(n),[n]),D=Me.useMemo(()=>o?Ak.map(V=>{const J=Dg(V,o,n);return{id:V,lines:[...J.declarations,...J.steps]}}):[],[o,n]),T=Me.useMemo(()=>Dk(n),[n]),B=x.trim().toLowerCase(),N=(...V)=>B===""||V.some(J=>J.toLowerCase().includes(B)),M=w.map(V=>({...V,samples:V.samples.filter(J=>N(J.title,J.key))})).filter(V=>V.samples.length>0),z=D.filter(V=>N(m.parts[V.id],...V.lines)),ae=T.filter(V=>N(m.syntax[V.id],...V.lines)),le={samples:M.length,parts:z.length,notation:ae.length}[h]===0;return v.jsxs("aside",{className:"pg-shelf","data-playground":"shelf","data-open":u?"on":void 0,"aria-label":m.label,onKeyDown:V=>{V.key==="Escape"&&u&&p()},children:[v.jsxs("button",{type:"button",className:"pg-new","data-playground":"new-file",onClick:s,children:[v.jsx("span",{className:"pg-new-plus","aria-hidden":"true",children:"+"}),m.newFile]}),v.jsx("div",{className:"pg-shelf-tabs",role:"tablist",children:Nk.map(V=>v.jsx("button",{type:"button",role:"tab","data-playground":`shelf-tab-${V}`,"aria-selected":h===V,onClick:()=>g(V),children:m.tabs[V]},V))}),v.jsx("input",{className:"pg-filter","data-playground":"shelf-filter",type:"search",placeholder:m.filter,"aria-label":m.filterLabel,spellCheck:!1,value:x,onChange:V=>A(V.target.value)}),v.jsxs("div",{className:"pg-shelf-list",role:"tabpanel",children:[h==="samples"&&M.map(V=>v.jsxs("section",{className:"pg-group",children:[v.jsx("h3",{className:"pg-group-title",children:m.kinds[V.kind]}),V.samples.map(J=>v.jsx("button",{type:"button",className:"pg-item","data-playground":`sample-${J.key}`,"aria-current":c===J.key?"true":void 0,title:J.title,onClick:()=>r(J.key),children:J.title},J.key))]},V.kind)),h==="parts"&&v.jsxs(v.Fragment,{children:[v.jsx("p",{className:"pg-shelf-hint",children:m.partsHint}),z.map(V=>v.jsxs("button",{type:"button",className:"pg-entry pg-entry-button","data-playground":`part-${V.id}`,onClick:()=>l(V.id),children:[v.jsx("span",{className:"pg-entry-name",children:m.parts[V.id]}),v.jsx("code",{className:"pg-entry-code",children:V.lines.join(`
`)})]},V.id))]}),h==="notation"&&v.jsxs(v.Fragment,{children:[v.jsx("p",{className:"pg-shelf-hint",children:m.notationHint}),ae.map(V=>v.jsxs("div",{className:"pg-entry","data-playground":`syntax-${V.id}`,children:[v.jsx("code",{className:"pg-entry-code",children:V.lines.join(`
`)}),v.jsx("span",{className:"pg-entry-note",children:m.syntax[V.id]})]},V.id))]}),le&&v.jsx("p",{className:"pg-shelf-empty",children:m.nothing})]})]})}const A0=1.15,S0=[.7,1.6],_0=n=>Math.min(S0[1],Math.max(S0[0],n));function gs({name:n,icon:o,label:c,onClick:u,pressed:p,disabled:s}){return v.jsx("button",{type:"button",className:"pg-tool","data-playground":n,"aria-label":c,title:c,"aria-pressed":p,disabled:s,onClick:u,children:v.jsx("span",{className:"pg-icon","data-icon":o,"aria-hidden":"true"})})}function Mk({diagram:n,palette:o,onPalette:c,theme:u,lang:p,kept:s,fileName:r,overlaps:l,jump:m}){const h=pt[p],g=Me.useRef(null),x=Me.useRef(null),[A,w]=Me.useState(0),[D,T]=Me.useState(1),[B,N]=Me.useState(!1),[M,z]=Me.useState(1),[ae,le]=Me.useState(!1),V=kg(),J=Me.useRef(null),X=Ud(x,n,{palette:o,theme:u,lang:p,onStep:w,onPlayer:$=>{J.current=$}});Me.useEffect(()=>{J.current?.mark(l.filter($=>$.step===A).flatMap($=>$.spots.map(q=>q.rect)))},[l,A,n,o,u,p]),Me.useEffect(()=>{m&&J.current?.goTo(m.step)},[m]),Me.useEffect(()=>{const $=()=>le(document.fullscreenElement!==null&&document.fullscreenElement===g.current);return document.addEventListener("fullscreenchange",$),()=>document.removeEventListener("fullscreenchange",$)},[]);const W=()=>{document.fullscreenElement?document.exitFullscreen().catch(()=>{}):g.current?.requestFullscreen().catch(()=>{})},re=n?.steps.length??0,ye=n?.steps[Math.min(A,re-1)],he=re>1&&ye!==void 0,me=X?kl(X.scale,D):null,Oe=me===null?"—":`${Math.round(me*100)}%`,xe=$=>{X&&T(kl(X.scale,D*$)/X.scale)},C={...X&&me!==null?{"--fig-w":`${X.width*me}px`}:{},"--say":String(M)};return v.jsxs("section",{className:"pg-stage","data-playground":"stage",ref:g,children:[v.jsxs("div",{className:"pg-stage-bar",children:[v.jsxs("span",{className:"pg-live",children:[v.jsx("span",{className:"pg-live-dot","aria-hidden":"true"}),h.stage.live]}),v.jsx("div",{className:"pg-swatches",role:"group","aria-label":h.palette,children:Object.values(ba).map($=>v.jsx("button",{type:"button",className:"pg-swatch","data-playground":`palette-${$.id}`,"aria-pressed":o===$.id,"aria-label":h.paletteNames[$.id]??$.name,title:h.paletteNames[$.id]??$.name,onClick:()=>c($.id),children:v.jsx("span",{className:"pg-swatch-dot","aria-hidden":"true",style:{background:`linear-gradient(135deg, ${$.light.page} 50%, ${$.dark.page} 50%)`,borderColor:$.light["c-blue"]}})},$.id))}),v.jsx("span",{className:"pg-gap"}),v.jsx(gs,{name:"font-down",icon:"text-down",label:h.stage.fontDown,onClick:()=>z(_0(M/A0))}),v.jsx(gs,{name:"font-up",icon:"text-up",label:h.stage.fontUp,onClick:()=>z(_0(M*A0))}),v.jsx(gs,{name:"grid",icon:"grid",label:h.stage.grid,pressed:B,onClick:()=>N(!B)}),v.jsx(gs,{name:"fullscreen",icon:"fullscreen",label:h.stage.fullscreen,pressed:ae,onClick:W}),v.jsx("span",{className:"pg-tool-sep","aria-hidden":"true"}),!V&&v.jsx(gs,{name:"fit",icon:"fit",label:h.stage.fit,disabled:!X,onClick:()=>T(1)}),v.jsx(gs,{name:"zoom-out",icon:"zoom-out",label:h.stage.zoomOut,disabled:!X||me===mo[0],onClick:()=>xe(1/wl)}),V&&v.jsx("button",{type:"button",className:"pg-tool pg-zoom-fit","data-playground":"zoom-level","aria-label":`${h.stage.fit} (${Oe})`,title:h.stage.fit,disabled:!X,onClick:()=>T(1),children:Oe}),v.jsx(gs,{name:"zoom-in",icon:"zoom-in",label:h.stage.zoomIn,disabled:!X||me===mo[1],onClick:()=>xe(wl)}),!V&&v.jsx("span",{className:"pg-zoom","data-playground":"zoom-level","aria-label":h.stage.zoom,children:Oe})]}),v.jsxs("div",{className:"pg-figure","data-playground":"figure","data-grid":B?"on":void 0,"data-phased":he?"on":void 0,style:C,children:[he&&v.jsxs("p",{className:"pg-phase","data-playground":"phase-badge",children:[v.jsx("span",{className:"pg-phase-dot","aria-hidden":"true"}),h.stage.phase(A+1,re,ye.title)]}),s&&v.jsxs("p",{className:"pg-kept",children:["↺ ",h.kept]}),v.jsx("div",{className:"pg-player",ref:x})]}),v.jsxs("div",{className:"pg-stage-foot",children:[he&&v.jsx("div",{className:"pg-progress","data-playground":"progress","aria-hidden":"true",children:n?.steps.map(($,q)=>v.jsx("span",{className:"pg-progress-seg","data-playground":"progress-seg","data-done":q<=A},`${q}-${$.title}`))}),v.jsxs("p",{className:"pg-hint",children:[h.exportLead," ",v.jsxs("code",{children:["dragon export ",r]})," ",h.exportTail]})]})]})}const Ng=n=>n instanceof Error?n.message:String(n);function Tg(n,o,c){const u=wi(n,{lang:o});if(!u.ok)return{ok:!1,problem:{lang:o,notices:mk(u.errors,c)}};try{Bd(u.diagram)}catch(p){return{ok:!1,problem:{lang:o,notices:[{text:pt[o].cannotDraw(Ng(p))}]}}}return{ok:!0,diagram:u.diagram}}function pi(n,o){const c=Za(n,{lang:o});return c.ok?Tg(c.diagram,o):{ok:!1,problem:{lang:o,notices:fk(c.errors)}}}function $0(n,o){let c;try{c=JSON.parse(n)}catch(u){const p=Ng(u),s=gk(p,n);return{ok:!1,problem:{lang:o,notices:[{...s!==void 0?{line:s}:{},text:pt[o].notJson(p)}]}}}return Tg(c,o,n)}const D0=n=>{const o=n.trim();return o===""?pd:o.endsWith(".dragon")?o:`${o}.dragon`},od=n=>n.replace(/\.dragon$/u,"");function Ck(n,o){const c=n.value.split(`
`),u=c.slice(0,o-1).reduce((p,s)=>p+s.length+1,0);n.focus(),n.setSelectionRange(u,u+(c[o-1]?.length??0)),Mg(n,o)}function Mg(n,o){const c=Number.parseFloat(getComputedStyle(n).lineHeight)||20;n.scrollTop=Math.max(0,(o-1)*c-n.clientHeight/2)}const N0=n=>n?JSON.stringify(n,null,2):"",id=n=>{history.replaceState(null,"",`${location.pathname}${location.search}${n===void 0?"":Rd(n)}`)};function Ok(n){const o=bg(location.hash),c=o??wa(w0,n);return{text:c,example:o===void 0?w0:pl(c)?.key??null,outcome:pi(c,n)}}function Bk({lang:n,theme:o,palette:c,onBeforeLang:u}){const[p]=Me.useState(()=>Ok(n)),[s,r]=Me.useState("notation"),[l,m]=Me.useState(p.text),[h,g]=Me.useState(""),[x,A]=Me.useState(p.example),[w,D]=Me.useState(p.outcome.ok?p.outcome.diagram:null),[T,B]=Me.useState(p.outcome.ok?null:p.outcome.problem),[N,M]=Me.useState(null),z=N?.site===c?N.palette:c,[ae,le]=Me.useState(!1),[V,J]=Me.useState(od(p.example===null?pd:`${p.example}.dragon`)),[X,W]=Me.useState(!1),[re,ye]=Me.useState(null),he=Me.useRef(null),me=Me.useRef(null),Oe=Me.useRef(null),xe=Me.useRef(null),C=pt[n],$=Me.useMemo(()=>{const _=Za(l,{lang:n});return _.ok?_.diagram:w},[l,n,w]);Me.useLayoutEffect(()=>{const _=xe.current;_===null||!he.current||(xe.current=null,Mg(he.current,_))});const q=_=>{D(P=>P&&JSON.stringify(P)===JSON.stringify(_)?P:_),B(null)},G=_=>{m(_),A(pl(_)?.key??null),id(_);const P=pi(_,n);P.ok?q(P.diagram):B(P.problem)},R=_=>{g(_);const P=$0(_,n);if(!P.ok){B(P.problem);return}q(P.diagram);const Y=bi(P.diagram);m(Y),A(pl(Y)?.key??null),id(Y)},S=(_,P,Y,be)=>{const Ce=pi(_,be);m(_),A(P),J(od(Y)),id(void 0),Ce.ok?(q(Ce.diagram),g(N0(Ce.diagram))):B(Ce.problem)},H=(_,P)=>S(wa(_,P),_,`${_}.dragon`,P),K=()=>S(dl[n],null,pd,n),pe=async _=>{const P=(await _.text()).replace(/\r\n?/gu,`
`).trimEnd();let Y=P;if(/^\s*\{/u.test(P))try{const be=wi(JSON.parse(P),{lang:n});be.ok&&(Y=bi(be.diagram))}catch{}r("notation"),G(Y),J(od(_.name.replace(/\.json$/iu,".dragon")))},_e=()=>{const _=URL.createObjectURL(new Blob([`${l.trimEnd()}
`],{type:"text/plain;charset=utf-8"})),P=document.createElement("a");P.href=_,P.download=D0(V),P.click(),window.setTimeout(()=>URL.revokeObjectURL(_),6e4)},De=_=>{if(!$)return;const P=Ek(l,Dg(_,$,n));s!=="notation"&&r("notation"),G(P.text),xe.current=P.line},je=_=>{ae&&le(!1),he.current&&Ck(he.current,_)},Le=_=>{if(r(_),_==="json"){g(N0(w)),B(null);return}const P=pi(l,n);B(P.ok?null:P.problem)},ze=_=>{if(s==="json"&&T){const Y=$0(h,_);Y.ok||B(Y.problem);return}const P=pl(l);if(P&&P.lang!==_){H(P.key,_);return}if(l===dl[n]&&n!==_){S(dl[_],null,V,_);return}if(s==="notation"&&T){const Y=pi(l,_);Y.ok||B(Y.problem)}};Me.useLayoutEffect(()=>(u(ze),()=>u(null)));const Ze=s==="notation"?l:h,U=Me.useMemo(()=>w?Bd(w,{lang:n}).overlaps:[],[w,n]),ke=Ze.split(`
`).length,Ne=new Set(T?.notices.flatMap(_=>_.line===void 0?[]:[_.line])),Z=T?pt[T.lang].notices:void 0,Ee=_=>(...P)=>{_(...P),W(!1)};return v.jsxs("div",{className:"pg",children:[v.jsx(Tk,{lang:n,base:$,active:x,open:X,onClose:()=>W(!1),onNew:Ee(K),onSample:Ee(_=>H(_,n)),onPart:De}),X&&v.jsx("button",{type:"button",className:"pg-shelf-scrim","aria-label":C.shelf.close,onClick:()=>W(!1)}),v.jsxs("section",{className:"pg-code","data-playground":"editor-pane","data-folded":ae,children:[v.jsxs("div",{className:"pg-bar",children:[v.jsx("button",{type:"button",className:"pg-tool pg-shelf-toggle","data-playground":"shelf-toggle","aria-label":C.shelf.open,title:C.shelf.open,"aria-expanded":X,onClick:()=>W(!X),children:v.jsx("span",{className:"pg-icon","data-icon":"list","aria-hidden":"true"})}),v.jsx("div",{className:"pg-tabs",role:"tablist",children:["notation","json"].map(_=>v.jsx("button",{type:"button",role:"tab","data-playground":`tab-${_}`,"aria-selected":s===_,onClick:()=>Le(_),children:_==="notation"?C.notation:"JSON"},_))}),v.jsx("input",{className:"pg-file","data-playground":"file-name","aria-label":C.code.file,title:C.code.file,spellCheck:!1,value:V,onChange:_=>J(_.target.value)}),v.jsx("button",{type:"button",className:"pg-tool","data-playground":"import","aria-label":C.code.import,title:C.code.import,onClick:()=>Oe.current?.click(),children:v.jsx("span",{className:"pg-icon","data-icon":"import","aria-hidden":"true"})}),v.jsx("input",{ref:Oe,type:"file",hidden:!0,"data-playground":"import-file",accept:".dragon,.json,.txt,text/plain,application/json",onChange:_=>{const P=_.target.files?.[0];_.target.value="",P&&pe(P)}}),v.jsx("button",{type:"button",className:"pg-tool pg-tool-primary","data-playground":"export","aria-label":C.code.export,title:C.code.export,onClick:_e,children:v.jsx("span",{className:"pg-icon","data-icon":"export","aria-hidden":"true"})}),v.jsxs("button",{type:"button",className:"pg-fold","data-playground":"fold","aria-expanded":!ae,onClick:()=>le(!ae),children:[ae?C.unfold:C.fold," ",ae?"▴":"▾"]})]}),v.jsxs("div",{className:"pg-code-body",hidden:ae,children:[v.jsx("div",{className:"pg-gutter",ref:me,"aria-hidden":"true",children:Array.from({length:ke},(_,P)=>v.jsx("div",{className:Ne.has(P+1)?"is-error":void 0,children:P+1},P))}),v.jsx("textarea",{ref:he,className:"pg-text","data-playground":"editor","aria-label":C.editor,spellCheck:!1,wrap:"off",value:Ze,onChange:_=>s==="notation"?G(_.target.value):R(_.target.value),onScroll:_=>{me.current&&(me.current.scrollTop=_.currentTarget.scrollTop)}})]}),v.jsx("div",{className:"pg-notices","data-playground":"status","data-state":T?"error":"ok",role:"status",children:T&&Z?v.jsxs(v.Fragment,{children:[v.jsx("p",{className:"pg-notices-head",children:v.jsx("span",{className:"pg-notices-badge",children:Z.count(T.notices.length)})}),v.jsx("ul",{className:"pg-notice-list",children:T.notices.map((_,P)=>v.jsxs("li",{className:"pg-notice","data-playground":"notice",children:[_.line!==void 0&&v.jsx("button",{type:"button",className:"pg-notice-line","data-playground":"notice-line","aria-label":Z.goTo(_.line),onClick:()=>je(_.line??1),children:Z.line(_.line)}),v.jsx("span",{className:"pg-notice-text",children:_.text})]},`${P}-${_.line??"-"}`))})]}):v.jsxs(v.Fragment,{children:[v.jsxs("p",{className:"pg-ok",children:[v.jsx("span",{"aria-hidden":"true",children:"✓"})," ",w?C.readable(w.boxes.length,w.steps.length):""]}),U.length>0&&v.jsxs("div",{className:"pg-overlaps","data-playground":"overlaps",children:[v.jsx("p",{className:"pg-notices-head",children:v.jsx("span",{className:"pg-overlaps-badge","data-playground":"overlaps-count",children:C.overlaps.count(U.length)})}),v.jsx("ul",{className:"pg-notice-list",children:U.map((_,P)=>v.jsxs("li",{className:"pg-notice","data-playground":"overlap",children:[v.jsx("button",{type:"button",className:"pg-overlap-step","data-playground":"overlap-step","aria-label":C.overlaps.goTo(_.step+1),onClick:()=>ye(Y=>({step:_.step,count:(Y?.count??0)+1})),children:C.overlaps.step(_.step+1)}),v.jsx("span",{className:"pg-notice-text","data-playground":"overlap-text",children:W1(_,n)})]},`${P}-${_.step}`))})]})]})})]}),v.jsx(Mk,{diagram:w,palette:z,onPalette:_=>M({site:c,palette:_}),theme:o,lang:n,kept:T!==null&&w!==null,overlaps:U,jump:re,fileName:D0(V)})]})}const jk=`${qd}/blob/main/CHANGELOG.md`;function zk({lang:n}){const o=pt[n].site,c=o.releaseNotes,u=o.screens["release-notes"].title;return v.jsxs("section",{className:"release","data-release":"hero",children:[v.jsxs("nav",{className:"release-crumb","data-release":"crumb","aria-label":c.crumb,children:[v.jsx("a",{href:wt.home,onClick:p=>At(p),children:o.nav.home}),v.jsx("span",{"aria-hidden":"true",children:"›"}),v.jsx("span",{className:"release-crumb-here","aria-current":"page",children:u})]}),v.jsx("span",{className:"release-eyebrow","data-release":"eyebrow",children:c.eyebrow(Ld)}),v.jsxs("h1",{children:[u.slice(0,u.length-c.accent.length),v.jsx("span",{className:"release-accent",children:c.accent})]}),v.jsx("p",{className:"release-lead","data-release":"lead",children:c.lead}),v.jsx("div",{className:"release-actions","data-release":"actions",children:v.jsxs("a",{className:"release-btn",href:jk,target:"_blank",rel:"noopener noreferrer",children:[v.jsx("span",{children:c.changelog}),v.jsx("span",{className:"release-btn-arrow","aria-hidden":"true",children:"↗"})]})})]})}const Rk={paper:"rose",clear:"blue",night:"blue"},Cg="dragon-site-palette";function Og(n,o){const c=_d(n)[o];return c[`t-${Rk[n]??"blue"}`]??c.ink??""}function qk(n,o){const c=_d(n)[o],u=p=>c[p]??"";return{"--d-bg":u("page"),"--d-surface":u("surf"),"--d-surface-2":u("bg"),"--d-surface-3":u("sunk"),"--d-border":u("hair"),"--d-border-strong":u("line"),"--d-text-primary":u("ink"),"--d-text-secondary":u("ink2"),"--d-text-muted":u("mute"),"--d-accent":Og(n,o),"--d-on-accent":u("on-c"),"--d-code-bg":u("sunk"),"--d-err":u("t-rose"),"--d-ok":u("t-green"),"--d-warn":u("t-amber")}}function Bg(n,o){const c=document.documentElement;c.dataset.scheme=o,c.style.colorScheme=o;for(const[u,p]of Object.entries(qk(n,o)))c.style.setProperty(u,p)}function jg(){try{const n=localStorage.getItem(Cg);return n!==null&&Object.hasOwn(ba,n)?n:yl}catch{return yl}}function Hk(n){try{localStorage.setItem(Cg,n)}catch{}}const T0=n=>({"--sw-light":n.light.page,"--sw-dark":n.dark.page,"--sw-accent":Og(n.id,"light")}),zg=["home","catalog","editor","docs","release-notes"],Uk=n=>n.screen==="category"||n.screen==="part"?"catalog":zg.find(o=>o===n.screen);function Lk({path:n,route:o,lang:c,theme:u,palette:p,onLang:s,onTheme:r,onPalette:l}){const m=pt[c].site,h=pt[c].paletteNames,g=Uk(o),[x,A]=Me.useState(null),w=x===n;Me.useEffect(()=>{if(!w)return;const T=B=>{B.key==="Escape"&&A(null)};return addEventListener("keydown",T),()=>removeEventListener("keydown",T)},[w]);const D=(T,B)=>[...zg.map(N=>v.jsx("a",{className:T,href:wt[N],"aria-current":N===g?"page":void 0,onClick:M=>At(M,B),children:m.nav[N]},N)),v.jsx("a",{className:T,href:qd,target:"_blank",rel:"noopener noreferrer",children:"GitHub ↗"},"github")];return v.jsxs("header",{className:"site-head","data-site":"header",children:[v.jsxs("a",{className:"site-brand",href:wt.home,onClick:T=>At(T),children:[v.jsx("span",{className:"site-mark","data-site":"mark","aria-hidden":"true"}),v.jsx("span",{className:"site-name","data-site":"name",children:"dragon"}),v.jsxs("span",{className:"site-tagline","data-site":"tagline",children:["— ",pt[c].tagline]})]}),v.jsx("nav",{className:"site-nav","data-site":"nav","aria-label":m.navLabel,children:D("site-nav-link")}),v.jsxs("div",{className:"site-actions",children:[v.jsx("div",{className:"site-lang",role:"group","aria-label":pt[c].language,children:["ja","en"].map(T=>v.jsx("button",{type:"button","data-site":`lang-${T}`,"aria-pressed":c===T,onClick:()=>s(T),children:T.toUpperCase()},T))}),v.jsx("div",{className:"site-palette","data-site":"palette",role:"group","aria-label":pt[c].palette,children:Object.values(ba).map(T=>v.jsx("button",{type:"button",className:"site-palette-btn","data-site":`palette-${T.id}`,"aria-pressed":p===T.id,"aria-label":h[T.id]??T.name,title:h[T.id]??T.name,onClick:()=>l(T.id),children:v.jsx("span",{className:"site-swatch",style:T0(T),"aria-hidden":"true"})},T.id))}),v.jsx("button",{type:"button",className:"site-icon-btn","data-site":"theme","aria-label":u==="dark"?m.toLight:m.toDark,title:u==="dark"?m.toLight:m.toDark,onClick:r,children:u==="dark"?"☀":"☾"}),v.jsx("button",{type:"button",className:"site-icon-btn site-menu-btn","data-site":"menu","aria-label":w?m.closeMenu:m.openMenu,"aria-expanded":w,"aria-controls":"site-sheet",onClick:()=>A(w?null:n),children:w?"×":"≡"}),v.jsx("a",{className:"site-cta","data-site":"open-editor",href:wt.editor,onClick:T=>At(T),children:m.openEditor})]}),w&&v.jsxs(v.Fragment,{children:[v.jsx("div",{className:"site-scrim","aria-hidden":"true",onClick:()=>A(null)}),v.jsxs("div",{className:"site-sheet",id:"site-sheet",children:[v.jsx("nav",{"data-site":"sheet","aria-label":m.navLabel,children:D("site-sheet-link",()=>A(null))}),v.jsxs("div",{className:"site-sheet-palette","data-site":"sheet-palette",role:"group","aria-label":pt[c].palette,children:[v.jsx("span",{className:"site-sheet-label","aria-hidden":"true",children:pt[c].palette}),Object.values(ba).map(T=>v.jsxs("button",{type:"button",className:"site-sheet-swatch","data-site":`palette-${T.id}`,"aria-pressed":p===T.id,onClick:()=>l(T.id),children:[v.jsx("span",{className:"site-swatch",style:T0(T),"aria-hidden":"true"}),h[T.id]??T.name]},T.id))]}),v.jsx("a",{className:"site-sheet-cta",href:wt.editor,onClick:T=>At(T,()=>A(null)),children:m.openEditor})]})]})]})}const Rg="(prefers-color-scheme: dark)";function Fk(n){const o=matchMedia(Rg);return o.addEventListener("change",n),()=>o.removeEventListener("change",n)}const qg=()=>matchMedia(Rg).matches?"dark":"light";function Gk(n){const o=vg(n);return o.screen==="category"&&!zd(o.category)?{screen:"not-found"}:o.screen==="part"&&Hd(o.part)===void 0?{screen:"not-found"}:o}function Yk(n,o){const c=pt[o];if(n.screen==="home")return null;if(n.screen==="category")return zd(n.category)?c.shelf.kinds[n.category]:null;if(n.screen==="part"){const u=Hd(n.part);return u?c.site.catalog.parts[u.id].name:null}return c.site.screens[n.screen].title}function Pk(){const n=b3(),o=Gk(n),c=Hd(o.part),[u,p]=Me.useState(()=>f3(navigator.languages.length>0?navigator.languages:[navigator.language])),[s,r]=Me.useState(null),[l,m]=Me.useState(jg),h=Me.useSyncExternalStore(Fk,qg),g=s??h,x=Me.useRef(null),A=Me.useCallback(B=>{x.current=B},[]);Me.useLayoutEffect(()=>{const B=document.documentElement;B.lang=u,B.style.setProperty("--sans",`"${vi.sans}"`),B.style.setProperty("--mono",`"${vi.mono}"`)},[u]),Me.useLayoutEffect(()=>{Bg(l,g)},[l,g]);const w=Yk(o,u);Me.useLayoutEffect(()=>{document.title=w===null?pt[u].title:`${w} — dragon`},[u,w]);const D=B=>{B!==u&&(x.current?.(B),p(B))},T=B=>{m(B),Hk(B)};return v.jsxs("div",{className:"site",children:[v.jsx(Lk,{path:n,route:o,lang:u,theme:g,palette:l,onLang:D,onTheme:()=>r(g==="dark"?"light":"dark"),onPalette:T}),v.jsx("main",{className:"site-main","data-site-screen":o.screen,children:o.screen==="home"?v.jsx(dk,{lang:u,theme:g,palette:l}):o.screen==="editor"?v.jsx(Bk,{lang:u,theme:g,palette:l,onBeforeLang:A}):o.screen==="catalog"?v.jsx(c6,{lang:u}):o.screen==="category"&&zd(o.category)?v.jsx(y6,{kind:o.category,lang:u,theme:g,palette:l},o.category):o.screen==="part"&&c?v.jsx(k6,{part:c,lang:u,theme:g,palette:l},c.id):o.screen==="docs"?v.jsx(tk,{lang:u,theme:g,palette:l}):o.screen==="release-notes"?v.jsx(zk,{lang:u}):v.jsx(hk,{lang:u,path:n})})]})}g3();Bg(jg(),qg());Lx.createRoot(document.getElementById("root")).render(v.jsx(Me.StrictMode,{children:v.jsx(Pk,{})}));
