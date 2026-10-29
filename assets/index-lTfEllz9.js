(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const f of document.querySelectorAll('link[rel="modulepreload"]'))r(f);new MutationObserver(f=>{for(const i of f)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&r(d)}).observe(document,{childList:!0,subtree:!0});function u(f){const i={};return f.integrity&&(i.integrity=f.integrity),f.referrerPolicy&&(i.referrerPolicy=f.referrerPolicy),f.crossOrigin==="use-credentials"?i.credentials="include":f.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(f){if(f.ep)return;f.ep=!0;const i=u(f);fetch(f.href,i)}})();var wu={exports:{}},Go={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var rm;function rb(){if(rm)return Go;rm=1;var a=Symbol.for("react.transitional.element"),o=Symbol.for("react.fragment");function u(r,f,i){var d=null;if(i!==void 0&&(d=""+i),f.key!==void 0&&(d=""+f.key),"key"in f){i={};for(var h in f)h!=="key"&&(i[h]=f[h])}else i=f;return f=i.ref,{$$typeof:a,type:r,key:d,ref:f!==void 0?f:null,props:i}}return Go.Fragment=o,Go.jsx=u,Go.jsxs=u,Go}var cm;function cb(){return cm||(cm=1,wu.exports=rb()),wu.exports}var b=cb(),ub={string:"文字列にする",integer:"整数にする",number:"数にする",object:"オブジェクトにする",array:"配列にする",boolean:"true か false にする",null:"null にする"},db={string:"Use a string",integer:"Use an integer",number:"Use a number",object:"Use an object",array:"Use an array",boolean:"Use true or false",null:"Use null"},um=(a,o)=>`${a} ${o}${a===1?"":"s"}`,fb={additionalProperties:a=>`${a} という欄は書けない`,required:a=>`${a} の欄が要る`,enum:a=>`${a.join(" / ")} のどれかにする`,type:a=>ub[a]??`${a} にする`,minLength:a=>`${a} 字以上書く`,pattern:a=>a?`${a.space?"空白と ":""}${a.chars.join(" ")} は使えない`:"使えない字が入っている",minItems:a=>`${a} つ以上書く`,minimum:a=>`${a} 以上にする`,const:a=>`${a} にする`,not:a=>a?`${a.field} の欄は kind が ${a.kind} の時だけ書ける`:"この欄の組み合わせは書けない",reserved:a=>`${a.join(" と ")} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,kindOnly:(a,o)=>`${a.join(" と ")} の出来事は kind が ${o} の時だけ書ける`,hex:(a,o)=>`0 から 9 と a から f の字で ${a} から ${o} 字にする`,anyOf:a=>a.length>0?`${a.join(" か ")} の${a.length===2?"どちらか":"どれか"}の欄が要る`:"書ける形のどれにも合わない",oneOf:"書ける形のどれか 1 つだけに合わせる",discriminator:(a,o)=>`${a} は ${o.join(" / ")} のどれかにする`,newer:(a,o)=>`版 ${a} の図は、この道具 (版 ${o}) より新しいので読めない。道具を新しくする`},hb={additionalProperties:a=>`The ${a} field is not allowed`,required:a=>`The ${a} field is required`,enum:a=>`Use one of ${a.join(" / ")}`,type:a=>db[a]??`Use ${a}`,minLength:a=>`Write at least ${um(a,"character")}`,pattern:a=>a?`Cannot contain ${a.space?"spaces or ":""}${a.chars.join(" ")}`:"Contains characters that are not allowed",minItems:a=>`Write at least ${um(a,"item")}`,minimum:a=>`Use ${a} or greater`,const:a=>`Use ${a}`,not:a=>a?`The ${a.field} field is allowed only when kind is ${a.kind}`:"This combination of fields is not allowed",reserved:a=>`${a.join(" and ")} name the start and end marks of a state diagram and cannot be box ids`,kindOnly:(a,o)=>`${a.join(" and ")} events are allowed only when kind is ${o}`,hex:(a,o)=>`Use ${a} to ${o} characters of 0-9 and a-f`,anyOf:a=>a.length>0?`Write one of the ${a.join(" or ")} fields`:"Does not match any of the allowed shapes",oneOf:"Match exactly one of the allowed shapes",discriminator:(a,o)=>`${a} is one of ${o.join(" / ")}`,newer:(a,o)=>`Version ${a} diagrams are newer than this tool (version ${o}) and cannot be read. Update the tool`},Vm={ja:fb,en:hb};function pb(a){let o=0;for(const u of a)o++;return o}var dm=Jm,Su={properties:{version:{description:"形式の版",type:"integer",minimum:1},kind:{description:"図の種類",enum:["sequence","architecture","state","git"]},title:{$ref:"#/definitions/text"},view:{description:"見せ方。書かなければ字の大きさで選ぶ。fixed は全体を止めて中だけ動かし、follow は寄って動かし全体図で今どこかを示す",enum:["fixed","follow"]},regions:{type:"array",items:{$ref:"#/definitions/region"}},boxes:{type:"array",items:{$ref:"#/definitions/box"}},strip:{$ref:"#/definitions/strip"},steps:{type:"array",minItems:1,items:{$ref:"#/definitions/step"}},sequence:{$ref:"#/definitions/sequence"},state:{$ref:"#/definitions/state"},git:{$ref:"#/definitions/git"}}},mb=Object.prototype.hasOwnProperty,St=pb,Qm={enum:["blue","amber","green","violet","rose","slate","coin"]},Xt=new RegExp("^[^\\s\\[\\]「」=:]+$","u");function kl(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.id===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};i===null?i=[h]:i.push(h),d++}if(a.name===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};i===null?i=[h]:i.push(h),d++}for(const h in a)if(!(h==="id"||h==="name"||h==="note"||h==="color"||h==="icon")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};i===null?i=[m]:i.push(m),d++}if(a.id!==void 0){let h=a.id;if(typeof h=="string"){if(!Xt.test(h)){const m={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.name!==void 0){let h=a.name;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.note!==void 0){let h=a.note;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.color!==void 0){let h=a.color;if(!(h==="blue"||h==="amber"||h==="green"||h==="violet"||h==="rose"||h==="slate"||h==="coin")){const m={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:Qm.enum},message:"must be equal to one of the allowed values"};i===null?i=[m]:i.push(m),d++}}if(a.icon!==void 0){let h=a.icon;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/icon",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/icon",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}}else{const h={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[h]:i.push(h),d++}return kl.errors=i,d===0}function Dl(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.id===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};i===null?i=[h]:i.push(h),d++}if(a.name===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"name"},message:"must have required property 'name'"};i===null?i=[h]:i.push(h),d++}for(const h in a)if(!(h==="id"||h==="name"||h==="sub"||h==="color"||h==="icon"||h==="region")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};i===null?i=[m]:i.push(m),d++}if(a.id!==void 0){let h=a.id;if(typeof h=="string"){if(!Xt.test(h)){const m={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.name!==void 0){let h=a.name;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/name",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/name",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.sub!==void 0){let h=a.sub;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/sub",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/sub",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.color!==void 0){let h=a.color;if(!(h==="blue"||h==="amber"||h==="green"||h==="violet"||h==="rose"||h==="slate"||h==="coin")){const m={instancePath:o+"/color",schemaPath:"#/definitions/color/enum",keyword:"enum",params:{allowedValues:Qm.enum},message:"must be equal to one of the allowed values"};i===null?i=[m]:i.push(m),d++}}if(a.icon!==void 0){let h=a.icon;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/icon",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/icon",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.region!==void 0){let h=a.region;if(typeof h=="string"){if(!Xt.test(h)){const m={instancePath:o+"/region",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/region",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}}else{const h={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[h]:i.push(h),d++}return Dl.errors=i,d===0}function Tl(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.title===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};i===null?i=[h]:i.push(h),d++}if(a.fields===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"fields"},message:"must have required property 'fields'"};i===null?i=[h]:i.push(h),d++}for(const h in a)if(!(h==="title"||h==="fields")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};i===null?i=[m]:i.push(m),d++}if(a.title!==void 0){let h=a.title;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.fields!==void 0){let h=a.fields;if(Array.isArray(h)){if(h.length<1){const p={instancePath:o+"/fields",schemaPath:"#/properties/fields/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};i===null?i=[p]:i.push(p),d++}const m=h.length;for(let p=0;p<m;p++){let y=h[p];if(typeof y=="string"){if(St(y)<1){const w={instancePath:o+"/fields/"+p,schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[w]:i.push(w),d++}}else{const w={instancePath:o+"/fields/"+p,schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[w]:i.push(w),d++}}}else{const m={instancePath:o+"/fields",schemaPath:"#/properties/fields/type",keyword:"type",params:{type:"array"},message:"must be array"};i===null?i=[m]:i.push(m),d++}}}else{const h={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[h]:i.push(h),d++}return Tl.errors=i,d===0}var gb={oneOf:[{description:"線。運ぶ物を載せて送る側から受ける側へ走る",type:"object",additionalProperties:!1,required:["type","from","to","carry"],properties:{type:{const:"edge"},from:{$ref:"#/definitions/id"},to:{$ref:"#/definitions/id"},label:{$ref:"#/definitions/text"},carry:{$ref:"#/definitions/carry"},labelSide:{description:"線の名前を置く側 (寄せの指示)",enum:["above","below","left","right"]}}},{description:"箱の中の処理",type:"object",additionalProperties:!1,required:["type","box","label"],properties:{type:{const:"action"},box:{$ref:"#/definitions/id"},label:{$ref:"#/definitions/text"}}},{description:"箱の下の小さな字の書き換え",type:"object",additionalProperties:!1,required:["type","box","text"],properties:{type:{const:"swap"},box:{$ref:"#/definitions/id"},text:{$ref:"#/definitions/text"}}},{description:"commit を積む。枝分かれの図だけが書ける。積んだ枝の札と、その枝を指す HEAD が進む。当て直し (copy) は枝の札を動かさず、merge commit (merge) は取り込む枝の先端も親に持つ",type:"object",additionalProperties:!1,required:["type","id","branch"],properties:{type:{const:"commit"},id:{$ref:"#/definitions/id"},branch:{$ref:"#/definitions/id"},copy:{$ref:"#/definitions/id"},merge:{$ref:"#/definitions/id"},hash:{$ref:"#/definitions/hash"},note:{$ref:"#/definitions/text"}}},{description:"枝を切る。枝分かれの図だけが書ける。枝の札を from の commit へ置き、HEAD をその枝へ移す",type:"object",additionalProperties:!1,required:["type","branch","from"],properties:{type:{const:"branch"},branch:{$ref:"#/definitions/id"},from:{$ref:"#/definitions/id"}}},{description:"中身の帯の欄の値と札",type:"object",additionalProperties:!1,required:["type","field"],anyOf:[{required:["value"]},{required:["tag"]}],properties:{type:{const:"strip"},field:{$ref:"#/definitions/text"},value:{$ref:"#/definitions/text"},tag:{$ref:"#/definitions/text"}}}]},yb=new RegExp("^[0-9a-f]{4,40}$","u"),bb={properties:{kind:{enum:["envelope","tag","coin","none"]}}};function Nl(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;const h=d;let m=!0;const p=d;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.kind===void 0){const v={};i===null?i=[v]:i.push(v),d++}else if(a.kind!==void 0&&a.kind!=="tag"){const v={};i===null?i=[v]:i.push(v),d++}}var y=p===d;d=h,i!==null&&(h?i.length=h:i=null);let w;if(y){const v=d;if(a&&typeof a=="object"&&!Array.isArray(a)&&a.text===void 0){const j={instancePath:o,schemaPath:"#/then/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};i===null?i=[j]:i.push(j),d++}var y=v===d;m=y,w="then"}else{const v=d,$=d,j=d;if(a&&typeof a=="object"&&!Array.isArray(a)&&a.text===void 0){const O={};i===null?i=[O]:i.push(O),d++}var _=j===d;if(_){const O={instancePath:o,schemaPath:"#/else/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[O]:i.push(O),d++}else d=$,i!==null&&($?i.length=$:i=null);var y=v===d;m=y,w="else"}if(!m){const v={instancePath:o,schemaPath:"#/if",keyword:"if",params:{failingKeyword:w},message:'must match "'+w+'" schema'};i===null?i=[v]:i.push(v),d++}if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.kind===void 0){const v={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"kind"},message:"must have required property 'kind'"};i===null?i=[v]:i.push(v),d++}for(const v in a)if(!(v==="kind"||v==="text")){const $={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:v},message:"must NOT have additional properties"};i===null?i=[$]:i.push($),d++}if(a.kind!==void 0){let v=a.kind;if(!(v==="envelope"||v==="tag"||v==="coin"||v==="none")){const $={instancePath:o+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues:bb.properties.kind.enum},message:"must be equal to one of the allowed values"};i===null?i=[$]:i.push($),d++}}if(a.text!==void 0){let v=a.text;if(typeof v=="string"){if(St(v)<1){const $={instancePath:o+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[$]:i.push($),d++}}else{const $={instancePath:o+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[$]:i.push($),d++}}}else{const v={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[v]:i.push(v),d++}return Nl.errors=i,d===0}function Ml(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.type===void 0){const p={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};i===null?i=[p]:i.push(p),d++}const m=a.type;if(typeof m=="string")if(m==="edge")if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};i===null?i=[p]:i.push(p),d++}if(a.from===void 0){const p={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};i===null?i=[p]:i.push(p),d++}if(a.to===void 0){const p={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};i===null?i=[p]:i.push(p),d++}if(a.carry===void 0){const p={instancePath:o,schemaPath:"#/oneOf/0/required",keyword:"required",params:{missingProperty:"carry"},message:"must have required property 'carry'"};i===null?i=[p]:i.push(p),d++}for(const p in a)if(!(p==="type"||p==="from"||p==="to"||p==="label"||p==="carry"||p==="labelSide")){const y={instancePath:o,schemaPath:"#/oneOf/0/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};i===null?i=[y]:i.push(y),d++}if(a.type!==void 0&&a.type!=="edge"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/0/properties/type/const",keyword:"const",params:{allowedValue:"edge"},message:"must be equal to constant"};i===null?i=[p]:i.push(p),d++}if(a.from!==void 0){let p=a.from;if(typeof p=="string"){if(!Xt.test(p)){const y={instancePath:o+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.to!==void 0){let p=a.to;if(typeof p=="string"){if(!Xt.test(p)){const y={instancePath:o+"/to",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/to",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.label!==void 0){let p=a.label;if(typeof p=="string"){if(St(p)<1){const y={instancePath:o+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.carry!==void 0&&(Nl(a.carry,{instancePath:o+"/carry",parentData:a,parentDataProperty:"carry",rootData:f})||(i=i===null?Nl.errors:i.concat(Nl.errors),d=i.length)),a.labelSide!==void 0){let p=a.labelSide;if(!(p==="above"||p==="below"||p==="left"||p==="right")){const y={instancePath:o+"/labelSide",schemaPath:"#/oneOf/0/properties/labelSide/enum",keyword:"enum",params:{allowedValues:gb.oneOf[0].properties.labelSide.enum},message:"must be equal to one of the allowed values"};i===null?i=[y]:i.push(y),d++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/0/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[p]:i.push(p),d++}else if(m==="action")if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};i===null?i=[p]:i.push(p),d++}if(a.box===void 0){const p={instancePath:o,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};i===null?i=[p]:i.push(p),d++}if(a.label===void 0){const p={instancePath:o,schemaPath:"#/oneOf/1/required",keyword:"required",params:{missingProperty:"label"},message:"must have required property 'label'"};i===null?i=[p]:i.push(p),d++}for(const p in a)if(!(p==="type"||p==="box"||p==="label")){const y={instancePath:o,schemaPath:"#/oneOf/1/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};i===null?i=[y]:i.push(y),d++}if(a.type!==void 0&&a.type!=="action"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/1/properties/type/const",keyword:"const",params:{allowedValue:"action"},message:"must be equal to constant"};i===null?i=[p]:i.push(p),d++}if(a.box!==void 0){let p=a.box;if(typeof p=="string"){if(!Xt.test(p)){const y={instancePath:o+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.label!==void 0){let p=a.label;if(typeof p=="string"){if(St(p)<1){const y={instancePath:o+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/1/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[p]:i.push(p),d++}else if(m==="swap")if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};i===null?i=[p]:i.push(p),d++}if(a.box===void 0){const p={instancePath:o,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"box"},message:"must have required property 'box'"};i===null?i=[p]:i.push(p),d++}if(a.text===void 0){const p={instancePath:o,schemaPath:"#/oneOf/2/required",keyword:"required",params:{missingProperty:"text"},message:"must have required property 'text'"};i===null?i=[p]:i.push(p),d++}for(const p in a)if(!(p==="type"||p==="box"||p==="text")){const y={instancePath:o,schemaPath:"#/oneOf/2/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};i===null?i=[y]:i.push(y),d++}if(a.type!==void 0&&a.type!=="swap"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/2/properties/type/const",keyword:"const",params:{allowedValue:"swap"},message:"must be equal to constant"};i===null?i=[p]:i.push(p),d++}if(a.box!==void 0){let p=a.box;if(typeof p=="string"){if(!Xt.test(p)){const y={instancePath:o+"/box",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/box",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.text!==void 0){let p=a.text;if(typeof p=="string"){if(St(p)<1){const y={instancePath:o+"/text",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/text",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/2/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[p]:i.push(p),d++}else if(m==="commit")if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};i===null?i=[p]:i.push(p),d++}if(a.id===void 0){const p={instancePath:o,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};i===null?i=[p]:i.push(p),d++}if(a.branch===void 0){const p={instancePath:o,schemaPath:"#/oneOf/3/required",keyword:"required",params:{missingProperty:"branch"},message:"must have required property 'branch'"};i===null?i=[p]:i.push(p),d++}for(const p in a)if(!(p==="type"||p==="id"||p==="branch"||p==="copy"||p==="merge"||p==="hash"||p==="note")){const y={instancePath:o,schemaPath:"#/oneOf/3/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};i===null?i=[y]:i.push(y),d++}if(a.type!==void 0&&a.type!=="commit"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/3/properties/type/const",keyword:"const",params:{allowedValue:"commit"},message:"must be equal to constant"};i===null?i=[p]:i.push(p),d++}if(a.id!==void 0){let p=a.id;if(typeof p=="string"){if(!Xt.test(p)){const y={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.branch!==void 0){let p=a.branch;if(typeof p=="string"){if(!Xt.test(p)){const y={instancePath:o+"/branch",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/branch",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.copy!==void 0){let p=a.copy;if(typeof p=="string"){if(!Xt.test(p)){const y={instancePath:o+"/copy",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/copy",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.merge!==void 0){let p=a.merge;if(typeof p=="string"){if(!Xt.test(p)){const y={instancePath:o+"/merge",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/merge",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.hash!==void 0){let p=a.hash;if(typeof p=="string"){if(!yb.test(p)){const y={instancePath:o+"/hash",schemaPath:"#/definitions/hash/pattern",keyword:"pattern",params:{pattern:"^[0-9a-f]{4,40}$"},message:'must match pattern "^[0-9a-f]{4,40}$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/hash",schemaPath:"#/definitions/hash/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.note!==void 0){let p=a.note;if(typeof p=="string"){if(St(p)<1){const y={instancePath:o+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/3/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[p]:i.push(p),d++}else if(m==="branch")if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.type===void 0){const p={instancePath:o,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};i===null?i=[p]:i.push(p),d++}if(a.branch===void 0){const p={instancePath:o,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"branch"},message:"must have required property 'branch'"};i===null?i=[p]:i.push(p),d++}if(a.from===void 0){const p={instancePath:o,schemaPath:"#/oneOf/4/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};i===null?i=[p]:i.push(p),d++}for(const p in a)if(!(p==="type"||p==="branch"||p==="from")){const y={instancePath:o,schemaPath:"#/oneOf/4/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:p},message:"must NOT have additional properties"};i===null?i=[y]:i.push(y),d++}if(a.type!==void 0&&a.type!=="branch"){const p={instancePath:o+"/type",schemaPath:"#/oneOf/4/properties/type/const",keyword:"const",params:{allowedValue:"branch"},message:"must be equal to constant"};i===null?i=[p]:i.push(p),d++}if(a.branch!==void 0){let p=a.branch;if(typeof p=="string"){if(!Xt.test(p)){const y={instancePath:o+"/branch",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/branch",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}if(a.from!==void 0){let p=a.from;if(typeof p=="string"){if(!Xt.test(p)){const y={instancePath:o+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[y]:i.push(y),d++}}else{const y={instancePath:o+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[y]:i.push(y),d++}}}else{const p={instancePath:o,schemaPath:"#/oneOf/4/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[p]:i.push(p),d++}else if(m==="strip"){const p=d;let y=!1;const w=d;if(a&&typeof a=="object"&&!Array.isArray(a)&&a.value===void 0){const _={instancePath:o,schemaPath:"#/oneOf/5/anyOf/0/required",keyword:"required",params:{missingProperty:"value"},message:"must have required property 'value'"};i===null?i=[_]:i.push(_),d++}var h=w===d;if(y=y||h,!y){const _=d;if(a&&typeof a=="object"&&!Array.isArray(a)&&a.tag===void 0){const $={instancePath:o,schemaPath:"#/oneOf/5/anyOf/1/required",keyword:"required",params:{missingProperty:"tag"},message:"must have required property 'tag'"};i===null?i=[$]:i.push($),d++}var h=_===d;y=y||h}if(y)d=p,i!==null&&(p?i.length=p:i=null);else{const _={instancePath:o,schemaPath:"#/oneOf/5/anyOf",keyword:"anyOf",params:{},message:"must match a schema in anyOf"};i===null?i=[_]:i.push(_),d++}if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.type===void 0){const _={instancePath:o,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty:"type"},message:"must have required property 'type'"};i===null?i=[_]:i.push(_),d++}if(a.field===void 0){const _={instancePath:o,schemaPath:"#/oneOf/5/required",keyword:"required",params:{missingProperty:"field"},message:"must have required property 'field'"};i===null?i=[_]:i.push(_),d++}for(const _ in a)if(!(_==="type"||_==="field"||_==="value"||_==="tag")){const v={instancePath:o,schemaPath:"#/oneOf/5/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:_},message:"must NOT have additional properties"};i===null?i=[v]:i.push(v),d++}if(a.type!==void 0&&a.type!=="strip"){const _={instancePath:o+"/type",schemaPath:"#/oneOf/5/properties/type/const",keyword:"const",params:{allowedValue:"strip"},message:"must be equal to constant"};i===null?i=[_]:i.push(_),d++}if(a.field!==void 0){let _=a.field;if(typeof _=="string"){if(St(_)<1){const v={instancePath:o+"/field",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[v]:i.push(v),d++}}else{const v={instancePath:o+"/field",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[v]:i.push(v),d++}}if(a.value!==void 0){let _=a.value;if(typeof _=="string"){if(St(_)<1){const v={instancePath:o+"/value",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[v]:i.push(v),d++}}else{const v={instancePath:o+"/value",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[v]:i.push(v),d++}}if(a.tag!==void 0){let _=a.tag;if(typeof _=="string"){if(St(_)<1){const v={instancePath:o+"/tag",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[v]:i.push(v),d++}}else{const v={instancePath:o+"/tag",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[v]:i.push(v),d++}}}else{const _={instancePath:o,schemaPath:"#/oneOf/5/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[_]:i.push(_),d++}}else{const p={instancePath:o,schemaPath:"#/discriminator",keyword:"discriminator",params:{error:"mapping",tag:"type",tagValue:m},message:'value of tag "type" must be in oneOf'};i===null?i=[p]:i.push(p),d++}else{const p={instancePath:o,schemaPath:"#/discriminator",keyword:"discriminator",params:{error:"tag",tag:"type",tagValue:m},message:'tag "type" must be string'};i===null?i=[p]:i.push(p),d++}}else{const m={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[m]:i.push(m),d++}return Ml.errors=i,d===0}function $l(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.title===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};i===null?i=[h]:i.push(h),d++}if(a.body===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"body"},message:"must have required property 'body'"};i===null?i=[h]:i.push(h),d++}if(a.events===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"events"},message:"must have required property 'events'"};i===null?i=[h]:i.push(h),d++}for(const h in a)if(!(h==="title"||h==="body"||h==="code"||h==="events")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};i===null?i=[m]:i.push(m),d++}if(a.title!==void 0){let h=a.title;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.body!==void 0){let h=a.body;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/body",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/body",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.code!==void 0){let h=a.code;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/code",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/code",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.events!==void 0){let h=a.events;if(Array.isArray(h)){const m=h.length;for(let p=0;p<m;p++)Ml(h[p],{instancePath:o+"/events/"+p,parentData:h,parentDataProperty:p,rootData:f})||(i=i===null?Ml.errors:i.concat(Ml.errors),d=i.length)}else{const m={instancePath:o+"/events",schemaPath:"#/properties/events/type",keyword:"type",params:{type:"array"},message:"must be array"};i===null?i=[m]:i.push(m),d++}}}else{const h={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[h]:i.push(h),d++}return $l.errors=i,d===0}function Ol(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.lifelines===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"lifelines"},message:"must have required property 'lifelines'"};i===null?i=[h]:i.push(h),d++}for(const h in a)if(h!=="lifelines"){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};i===null?i=[m]:i.push(m),d++}if(a.lifelines!==void 0){let h=a.lifelines;if(Array.isArray(h)){if(h.length<1){const p={instancePath:o+"/lifelines",schemaPath:"#/properties/lifelines/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};i===null?i=[p]:i.push(p),d++}const m=h.length;for(let p=0;p<m;p++){let y=h[p];if(typeof y=="string"){if(!Xt.test(y)){const w={instancePath:o+"/lifelines/"+p,schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[w]:i.push(w),d++}}else{const w={instancePath:o+"/lifelines/"+p,schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[w]:i.push(w),d++}}}else{const m={instancePath:o+"/lifelines",schemaPath:"#/properties/lifelines/type",keyword:"type",params:{type:"array"},message:"must be array"};i===null?i=[m]:i.push(m),d++}}}else{const h={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[h]:i.push(h),d++}return Ol.errors=i,d===0}function Cl(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.from===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"from"},message:"must have required property 'from'"};i===null?i=[h]:i.push(h),d++}if(a.to===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"to"},message:"must have required property 'to'"};i===null?i=[h]:i.push(h),d++}for(const h in a)if(!(h==="from"||h==="to"||h==="label")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};i===null?i=[m]:i.push(m),d++}if(a.from!==void 0){let h=a.from;if(typeof h=="string"){if(!Xt.test(h)){const m={instancePath:o+"/from",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/from",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.to!==void 0){let h=a.to;if(typeof h=="string"){if(!Xt.test(h)){const m={instancePath:o+"/to",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/to",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.label!==void 0){let h=a.label;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/label",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/label",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}}else{const h={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[h]:i.push(h),d++}return Cl.errors=i,d===0}function jl(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.paths===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"paths"},message:"must have required property 'paths'"};i===null?i=[h]:i.push(h),d++}for(const h in a)if(h!=="paths"){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};i===null?i=[m]:i.push(m),d++}if(a.paths!==void 0){let h=a.paths;if(Array.isArray(h)){if(h.length<1){const p={instancePath:o+"/paths",schemaPath:"#/properties/paths/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};i===null?i=[p]:i.push(p),d++}const m=h.length;for(let p=0;p<m;p++)Cl(h[p],{instancePath:o+"/paths/"+p,parentData:h,parentDataProperty:p,rootData:f})||(i=i===null?Cl.errors:i.concat(Cl.errors),d=i.length)}else{const m={instancePath:o+"/paths",schemaPath:"#/properties/paths/type",keyword:"type",params:{type:"array"},message:"must be array"};i===null?i=[m]:i.push(m),d++}}}else{const h={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[h]:i.push(h),d++}return jl.errors=i,d===0}function Bl(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.id===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"id"},message:"must have required property 'id'"};i===null?i=[h]:i.push(h),d++}for(const h in a)if(!(h==="id"||h==="note")){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};i===null?i=[m]:i.push(m),d++}if(a.id!==void 0){let h=a.id;if(typeof h=="string"){if(!Xt.test(h)){const m={instancePath:o+"/id",schemaPath:"#/definitions/id/pattern",keyword:"pattern",params:{pattern:"^[^\\s\\[\\]「」=:]+$"},message:'must match pattern "^[^\\s\\[\\]「」=:]+$"'};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/id",schemaPath:"#/definitions/id/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}if(a.note!==void 0){let h=a.note;if(typeof h=="string"){if(St(h)<1){const m={instancePath:o+"/note",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[m]:i.push(m),d++}}else{const m={instancePath:o+"/note",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[m]:i.push(m),d++}}}else{const h={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[h]:i.push(h),d++}return Bl.errors=i,d===0}function zl(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.branches===void 0){const h={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"branches"},message:"must have required property 'branches'"};i===null?i=[h]:i.push(h),d++}for(const h in a)if(h!=="branches"){const m={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:h},message:"must NOT have additional properties"};i===null?i=[m]:i.push(m),d++}if(a.branches!==void 0){let h=a.branches;if(Array.isArray(h)){if(h.length<1){const p={instancePath:o+"/branches",schemaPath:"#/properties/branches/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};i===null?i=[p]:i.push(p),d++}const m=h.length;for(let p=0;p<m;p++)Bl(h[p],{instancePath:o+"/branches/"+p,parentData:h,parentDataProperty:p,rootData:f})||(i=i===null?Bl.errors:i.concat(Bl.errors),d=i.length)}else{const m={instancePath:o+"/branches",schemaPath:"#/properties/branches/type",keyword:"type",params:{type:"array"},message:"must be array"};i===null?i=[m]:i.push(m),d++}}}else{const h={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[h]:i.push(h),d++}return zl.errors=i,d===0}function Jm(a,{instancePath:o="",parentData:u,parentDataProperty:r,rootData:f=a}={}){let i=null,d=0;const h=d;let m=!0;const p=d;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.kind===void 0){const T={};i===null?i=[T]:i.push(T),d++}else if(a.kind!==void 0&&a.kind!=="sequence"){const T={};i===null?i=[T]:i.push(T),d++}}var y=p===d;d=h,i!==null&&(h?i.length=h:i=null);let w;if(y){const T=d;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.sequence===void 0){const H={instancePath:o,schemaPath:"#/then/required",keyword:"required",params:{missingProperty:"sequence"},message:"must have required property 'sequence'"};i===null?i=[H]:i.push(H),d++}if(a.boxes!==void 0){let H=a.boxes;if(Array.isArray(H)&&H.length<1){const ue={instancePath:o+"/boxes",schemaPath:"#/then/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};i===null?i=[ue]:i.push(ue),d++}}if(a.steps!==void 0){let H=a.steps;if(Array.isArray(H)){const ue=H.length;for(let Z=0;Z<ue;Z++){let ie=H[Z];if(ie&&typeof ie=="object"&&!Array.isArray(ie)&&ie.events!==void 0){let U=ie.events;if(Array.isArray(U)){const fe=U.length;for(let re=0;re<fe;re++){let Ee=U[re];if(Ee&&typeof Ee=="object"&&!Array.isArray(Ee)&&Ee.type!==void 0){let R=Ee.type;const ge=d,we=d;if(!(R==="commit"||R==="branch")){const ke={};i===null?i=[ke]:i.push(ke),d++}var _=we===d;if(_){const ke={instancePath:o+"/steps/"+Z+"/events/"+re+"/type",schemaPath:"#/definitions/plainSteps/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[ke]:i.push(ke),d++}else d=ge,i!==null&&(ge?i.length=ge:i=null)}}}}}}}if(a.state!==void 0){const H={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[H]:i.push(H),d++}if(a.git!==void 0){const H={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[H]:i.push(H),d++}}var y=T===d;m=y,w="then"}else{const T=d,C=d;let H=!0;const ue=d;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.kind===void 0){const U={};i===null?i=[U]:i.push(U),d++}else if(a.kind!==void 0&&a.kind!=="state"){const U={};i===null?i=[U]:i.push(U),d++}}var v=ue===d;d=C,i!==null&&(C?i.length=C:i=null);let Z;if(v){const U=d;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.boxes!==void 0){let re=a.boxes;if(Array.isArray(re)){if(re.length<1){const R={instancePath:o+"/boxes",schemaPath:"#/else/then/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};i===null?i=[R]:i.push(R),d++}const Ee=re.length;for(let R=0;R<Ee;R++){let ge=re[R];if(ge&&typeof ge=="object"&&!Array.isArray(ge)&&ge.id!==void 0){let we=ge.id;const ke=d,E=d;if(!(we==="start"||we==="finish")){const z={};i===null?i=[z]:i.push(z),d++}var $=E===d;if($){const z={instancePath:o+"/boxes/"+R+"/id",schemaPath:"#/else/then/properties/boxes/items/properties/id/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[z]:i.push(z),d++}else d=ke,i!==null&&(ke?i.length=ke:i=null)}}}}if(a.steps!==void 0){let re=a.steps;if(Array.isArray(re)){const Ee=re.length;for(let R=0;R<Ee;R++){let ge=re[R];if(ge&&typeof ge=="object"&&!Array.isArray(ge)&&ge.events!==void 0){let we=ge.events;if(Array.isArray(we)){const ke=we.length;for(let E=0;E<ke;E++){let z=we[E];if(z&&typeof z=="object"&&!Array.isArray(z)&&z.type!==void 0){let K=z.type;const P=d,he=d;if(!(K==="commit"||K==="branch")){const k={};i===null?i=[k]:i.push(k),d++}var j=he===d;if(j){const k={instancePath:o+"/steps/"+R+"/events/"+E+"/type",schemaPath:"#/definitions/plainSteps/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[k]:i.push(k),d++}else d=P,i!==null&&(P?i.length=P:i=null)}}}}}}}if(a.git!==void 0){const re={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[re]:i.push(re),d++}}var v=U===d;H=v,Z="then"}else{const U=d,fe=d;let re=!0;const Ee=d;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.kind===void 0){const we={};i===null?i=[we]:i.push(we),d++}else if(a.kind!==void 0&&a.kind!=="git"){const we={};i===null?i=[we]:i.push(we),d++}}var N=Ee===d;d=fe,i!==null&&(fe?i.length=fe:i=null);let R;if(N){const we=d;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.git===void 0){const E={instancePath:o,schemaPath:"#/else/else/then/required",keyword:"required",params:{missingProperty:"git"},message:"must have required property 'git'"};i===null?i=[E]:i.push(E),d++}if(a.state!==void 0){const E={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[E]:i.push(E),d++}if(a.regions!==void 0){const E={instancePath:o+"/regions",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[E]:i.push(E),d++}}var N=we===d;re=N,R="then"}else{const we=d;if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.boxes!==void 0){let E=a.boxes;if(Array.isArray(E)&&E.length<1){const z={instancePath:o+"/boxes",schemaPath:"#/else/else/else/properties/boxes/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};i===null?i=[z]:i.push(z),d++}}if(a.steps!==void 0){let E=a.steps;if(Array.isArray(E)){const z=E.length;for(let K=0;K<z;K++){let P=E[K];if(P&&typeof P=="object"&&!Array.isArray(P)&&P.events!==void 0){let he=P.events;if(Array.isArray(he)){const k=he.length;for(let X=0;X<k;X++){let ce=he[X];if(ce&&typeof ce=="object"&&!Array.isArray(ce)&&ce.type!==void 0){let ve=ce.type;const Se=d,_e=d;if(!(ve==="commit"||ve==="branch")){const Me={};i===null?i=[Me]:i.push(Me),d++}var O=_e===d;if(O){const Me={instancePath:o+"/steps/"+K+"/events/"+X+"/type",schemaPath:"#/definitions/plainSteps/items/properties/events/items/properties/type/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[Me]:i.push(Me),d++}else d=Se,i!==null&&(Se?i.length=Se:i=null)}}}}}}}if(a.state!==void 0){const E={instancePath:o+"/state",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[E]:i.push(E),d++}if(a.git!==void 0){const E={instancePath:o+"/git",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[E]:i.push(E),d++}}var N=we===d;re=N,R="else"}if(!re){const we={instancePath:o,schemaPath:"#/else/else/if",keyword:"if",params:{failingKeyword:R},message:'must match "'+R+'" schema'};i===null?i=[we]:i.push(we),d++}var v=U===d;H=v,Z="else"}if(!H){const U={instancePath:o,schemaPath:"#/else/if",keyword:"if",params:{failingKeyword:Z},message:'must match "'+Z+'" schema'};i===null?i=[U]:i.push(U),d++}if(a&&typeof a=="object"&&!Array.isArray(a)&&a.sequence!==void 0){const U={instancePath:o+"/sequence",schemaPath:"#/definitions/absent/not",keyword:"not",params:{},message:"must NOT be valid"};i===null?i=[U]:i.push(U),d++}var y=T===d;m=y,w="else"}if(!m){const T={instancePath:o,schemaPath:"#/if",keyword:"if",params:{failingKeyword:w},message:'must match "'+w+'" schema'};i===null?i=[T]:i.push(T),d++}if(a&&typeof a=="object"&&!Array.isArray(a)){if(a.version===void 0){const T={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"version"},message:"must have required property 'version'"};i===null?i=[T]:i.push(T),d++}if(a.kind===void 0){const T={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"kind"},message:"must have required property 'kind'"};i===null?i=[T]:i.push(T),d++}if(a.title===void 0){const T={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"title"},message:"must have required property 'title'"};i===null?i=[T]:i.push(T),d++}if(a.boxes===void 0){const T={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"boxes"},message:"must have required property 'boxes'"};i===null?i=[T]:i.push(T),d++}if(a.steps===void 0){const T={instancePath:o,schemaPath:"#/required",keyword:"required",params:{missingProperty:"steps"},message:"must have required property 'steps'"};i===null?i=[T]:i.push(T),d++}for(const T in a)if(!mb.call(Su.properties,T)){const C={instancePath:o,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty:T},message:"must NOT have additional properties"};i===null?i=[C]:i.push(C),d++}if(a.version!==void 0){let T=a.version;if(!(typeof T=="number"&&!(T%1)&&!isNaN(T)&&isFinite(T))){const C={instancePath:o+"/version",schemaPath:"#/properties/version/type",keyword:"type",params:{type:"integer"},message:"must be integer"};i===null?i=[C]:i.push(C),d++}if(typeof T=="number"&&isFinite(T)&&(T<1||isNaN(T))){const C={instancePath:o+"/version",schemaPath:"#/properties/version/minimum",keyword:"minimum",params:{comparison:">=",limit:1},message:"must be >= 1"};i===null?i=[C]:i.push(C),d++}}if(a.kind!==void 0){let T=a.kind;if(!(T==="sequence"||T==="architecture"||T==="state"||T==="git")){const C={instancePath:o+"/kind",schemaPath:"#/properties/kind/enum",keyword:"enum",params:{allowedValues:Su.properties.kind.enum},message:"must be equal to one of the allowed values"};i===null?i=[C]:i.push(C),d++}}if(a.title!==void 0){let T=a.title;if(typeof T=="string"){if(St(T)<1){const C={instancePath:o+"/title",schemaPath:"#/definitions/text/minLength",keyword:"minLength",params:{limit:1},message:"must NOT have fewer than 1 characters"};i===null?i=[C]:i.push(C),d++}}else{const C={instancePath:o+"/title",schemaPath:"#/definitions/text/type",keyword:"type",params:{type:"string"},message:"must be string"};i===null?i=[C]:i.push(C),d++}}if(a.view!==void 0){let T=a.view;if(!(T==="fixed"||T==="follow")){const C={instancePath:o+"/view",schemaPath:"#/properties/view/enum",keyword:"enum",params:{allowedValues:Su.properties.view.enum},message:"must be equal to one of the allowed values"};i===null?i=[C]:i.push(C),d++}}if(a.regions!==void 0){let T=a.regions;if(Array.isArray(T)){const C=T.length;for(let H=0;H<C;H++)kl(T[H],{instancePath:o+"/regions/"+H,parentData:T,parentDataProperty:H,rootData:f})||(i=i===null?kl.errors:i.concat(kl.errors),d=i.length)}else{const C={instancePath:o+"/regions",schemaPath:"#/properties/regions/type",keyword:"type",params:{type:"array"},message:"must be array"};i===null?i=[C]:i.push(C),d++}}if(a.boxes!==void 0){let T=a.boxes;if(Array.isArray(T)){const C=T.length;for(let H=0;H<C;H++)Dl(T[H],{instancePath:o+"/boxes/"+H,parentData:T,parentDataProperty:H,rootData:f})||(i=i===null?Dl.errors:i.concat(Dl.errors),d=i.length)}else{const C={instancePath:o+"/boxes",schemaPath:"#/properties/boxes/type",keyword:"type",params:{type:"array"},message:"must be array"};i===null?i=[C]:i.push(C),d++}}if(a.strip!==void 0&&(Tl(a.strip,{instancePath:o+"/strip",parentData:a,parentDataProperty:"strip",rootData:f})||(i=i===null?Tl.errors:i.concat(Tl.errors),d=i.length)),a.steps!==void 0){let T=a.steps;if(Array.isArray(T)){if(T.length<1){const H={instancePath:o+"/steps",schemaPath:"#/properties/steps/minItems",keyword:"minItems",params:{limit:1},message:"must NOT have fewer than 1 items"};i===null?i=[H]:i.push(H),d++}const C=T.length;for(let H=0;H<C;H++)$l(T[H],{instancePath:o+"/steps/"+H,parentData:T,parentDataProperty:H,rootData:f})||(i=i===null?$l.errors:i.concat($l.errors),d=i.length)}else{const C={instancePath:o+"/steps",schemaPath:"#/properties/steps/type",keyword:"type",params:{type:"array"},message:"must be array"};i===null?i=[C]:i.push(C),d++}}a.sequence!==void 0&&(Ol(a.sequence,{instancePath:o+"/sequence",parentData:a,parentDataProperty:"sequence",rootData:f})||(i=i===null?Ol.errors:i.concat(Ol.errors),d=i.length)),a.state!==void 0&&(jl(a.state,{instancePath:o+"/state",parentData:a,parentDataProperty:"state",rootData:f})||(i=i===null?jl.errors:i.concat(jl.errors),d=i.length)),a.git!==void 0&&(zl(a.git,{instancePath:o+"/git",parentData:a,parentDataProperty:"git",rootData:f})||(i=i===null?zl.errors:i.concat(zl.errors),d=i.length))}else{const T={instancePath:o,schemaPath:"#/type",keyword:"type",params:{type:"object"},message:"must be object"};i===null?i=[T]:i.push(T),d++}return Jm.errors=i,d===0}var Kl=a=>Object.keys(a),Io=Kl({sequence:!0,architecture:!0,state:!0,git:!0}),ei=["start","finish"],Qu=["group","end","box","strip","step","say","code","act","note","set","branch","commit"],El="as",Zm="on",Km="copy",Pm="merge",Ju="from",Gn="HEAD",as={diagram:["view"],group:["note","color","icon"],box:["note","color","icon"],edge:["carry","tag","side"],set:["tag"],branch:["note"],commit:["hash","note"]},Zu=Kl({coin:!0,none:!0}),Ku=Kl({fixed:!0,follow:!0}),Pu=Kl({above:!0,below:!0,left:!0,right:!0}),fm={時系列図:"sequence",構成図:"architecture",区画:"group",見せ方:"view",region:"group",view:"view"},Wu=["blue","amber","green","violet","rose","slate","coin"],vb=["edge","action","swap","strip","commit","branch"],xb="#/definitions/absent/not",wb={regions:"sequence / architecture / state"},Sb={carry:{field:"text",kind:"tag"}},Ab=/\/boxes\/items\/properties\/id\/not$/u,Eb=/\/events\/items\/properties\/type\/not$/u,_b=["commit","branch"],Au=a=>a.replaceAll("~","~0").replaceAll("/","~1"),kb=/^\^\[0-9a-f\]\{(\d+),(\d+)\}\$$/u;function Db(a){const o=/^\^\[\^(.+)\]\+\$$/u.exec(a)?.[1];if(o===void 0)return;const u=o.match(/\\.|[^\\]/gu)??[];return{space:u.includes("\\s"),chars:u.filter(r=>r!=="\\s").map(r=>r.replace(/^\\/u,""))}}var Wm=(a,o)=>o.filter(u=>u!==a&&u.schemaPath.startsWith(`${a.schemaPath}/`)&&(u.instancePath===a.instancePath||u.instancePath.startsWith(`${a.instancePath}/`)));function Tb(a,o,u){const r=a.params,f=a.instancePath;switch(a.keyword){case"additionalProperties":{const i=String(r.additionalProperty);return{pointer:`${f}/${Au(i)}`,message:u.additionalProperties(i)}}case"required":{const i=String(r.missingProperty);return{pointer:`${f}/${Au(i)}`,message:u.required(i)}}case"not":{if(Ab.test(a.schemaPath))return{pointer:f,message:u.reserved(ei)};if(Eb.test(a.schemaPath))return{pointer:f,message:u.kindOnly(_b,"git")};const i=f.slice(f.lastIndexOf("/")+1);if(a.schemaPath===xb)return{pointer:f,message:u.not({field:i,kind:wb[i]??i})};const d=Sb[i];return{pointer:d?`${f}/${d.field}`:f,message:u.not(d)}}case"anyOf":{const i=Wm(a,o),d=i.every(h=>h.keyword==="required")?i.map(h=>String(h.params.missingProperty)):[];return{pointer:f,message:u.anyOf(d)}}case"discriminator":{const i=String(r.tag);return{pointer:`${f}/${Au(i)}`,message:u.discriminator(i,vb)}}case"enum":return{pointer:f,message:u.enum(r.allowedValues.map(String))};case"type":return{pointer:f,message:u.type(String(r.type))};case"minLength":return{pointer:f,message:u.minLength(Number(r.limit))};case"pattern":{const i=kb.exec(String(r.pattern));return{pointer:f,message:i?u.hex(Number(i[1]),Number(i[2])):u.pattern(Db(String(r.pattern)))}}case"minItems":return{pointer:f,message:u.minItems(Number(r.limit))};case"minimum":return{pointer:f,message:u.minimum(Number(r.limit))};case"const":return{pointer:f,message:u.const(String(r.allowedValue))};case"oneOf":return{pointer:f,message:u.oneOf};default:return{pointer:f,message:a.message??a.keyword}}}function Nb(a,o={}){if(dm(a))return{ok:!0};const u=dm.errors??[],r=new Set(u.filter(d=>d.keyword==="anyOf").flatMap(d=>Wm(d,u))),f=Vm[o.lang??"ja"];return{ok:!1,errors:u.filter(d=>d.keyword!=="if"&&!r.has(d)).map(d=>Tb(d,u,f))}}var cn=a=>a.join(" / "),Mb=()=>{const a={sequence:"sequence <題>",architecture:"architecture <題>",group:"group <名札> as <名前> [note: <添え書き>] から end まで",box:"box <名札> as <名前> [note: <下の小さな字>]",strip:"strip <題>: <欄>, <欄>",view:"sequence <題> [view: follow]",step:"step <段の題>",say:"say <段の本文>",code:"code <命令>",act:"act <名札>: <処理の名前>",note:"note <名札>: <下の小さな字>",set:"set <欄>: <値> [tag: <札>]"};return{noHead:`最初の行に図の種類 (${cn(Io)}) と題を書く`,badHead:`最初の行は ${Io.join(" か ")} で始め、続けて題を書く`,oldForm:(o,u)=>`${o} は前の形の書き方。新しい形では ${a[u]} と書く`,unknownHead:o=>`${o} は行の頭に書けない。行は ${cn(Qu)} か、<名札> -> <名札> で始める`,duplicate:o=>`${o} は既に宣言した名札`,needsId:o=>`${o} の後ろに名札を書く`,badId:o=>`${o} は名札に使えない。名札には空白と [ ] 「 」 = : を含めない`,afterId:"名札の後ろには as <名前> か属性を書く",undeclaredBox:o=>`${o} という箱は宣言していない`,noBody:o=>`段「${o}」に本文 (say の行) が要る`,emptyStepTitle:"step の後ろに段の題を書く",noBoxes:"箱を 1 つ以上宣言する",noSteps:"段 (step の行) を 1 つ以上書く",emptySay:"say の後ろか、その下に字下げした行に段の本文を書く",sayTwice:"1 つの段に say は 1 つまで。長い本文は say の下に字下げして続ける",codeTwice:"1 つの段に code は 1 行まで",emptyCode:"code の後ろに命令を書く",declarationInStep:"group と box と strip と branch は最初の step より前に書く",stepLineBeforeStep:"線と say と code と act と note と set と commit と枝を切る行は step の下に書く",nestedGroup:"group の中に group は書けない。先に end で閉じる",strayEnd:"end の前に、閉じる group が無い",endTakesNothing:"end の後ろには何も書かない",unclosedGroup:o=>`group ${o} を end で閉じていない`,regionReopened:o=>`group ${o} は宣言済み。もう一度開く時は group ${o} だけを書き、名前と属性は最初の宣言に書く`,emptyName:o=>`${o} の名前が空`,stripTwice:"strip は 1 つだけ宣言する",stripShape:"strip は strip <題>: <欄>, <欄> の形で書く",emptyStripField:"strip の欄の名前が空",stripUndeclared:"set を書く前に、strip <題>: <欄>, <欄> で帯を宣言する",noSuchField:o=>`${o} という欄は strip に無い`,stripNeedsValue:"set は set <欄>: <値> か set <欄> [tag: <札>] の形で書く",actShape:"act は act <名札>: <処理の名前> の形で書く",noteShape:"note は note <名札>: <下の小さな字> の形で書く",edgeShape:"線は <名札> -> <名札>: <線の名前> [<属性>] の形で書く",emptyLabel:"線の : の後ろに線の名前を書く。名前を書かない時は : も書かない",quoteUnclosed:'" で始めた字を " で閉じていない',afterQuote:'" で閉じた字の後ろには、属性か次の , だけを書く',attrUnclosed:"属性は [ で始めて ] で閉じ、行の終わりに置く",attrNoColon:o=>`[${o}] は書けない。属性は [<鍵>: <値>] の形で書く`,attrNoValue:o=>`${o}: の後ろに値を書く`,attrTwice:o=>`${o} は 1 つの行に 1 つまで`,badAttr:(o,u)=>`${o} はこの行に書けない属性。書けるのは ${cn(u)}`,badColor:`color は ${cn(Wu)} のどれか`,badView:`view は ${cn(Ku)} のどれか`,badCarry:`carry は ${cn(Zu)} のどれか。札は tag: <値> で書く`,badSide:`side は ${cn(Pu)} のどれか`,carryTwice:"運ぶ物は 1 本の線に 1 つまで。carry と tag は一緒に書かない",reservedId:o=>`${o} は状態遷移図の始まりと終わりの印の名前で、箱の名札に使えない`,intoStart:"start へ入る線は書けない。start は始まりの印で、線は start から出る",outOfFinish:"finish から出る線は書けない。finish は終わりの印で、線は finish へ入る",pathNoAttrs:"最初の step より前の線は今回は通らない道なので、属性 (carry と tag と side) を書けない",gitOnly:o=>`${o} の行は git (枝分かれの図) でだけ書ける`,gitNoGroup:"git (枝分かれの図) には group を書けない。枝は branch の行で宣言する",noBranches:"branch の行で枝を 1 つ以上宣言する",branchShape:"branch は branch <名札> [note: <添え書き>] の形で書く",commitShape:"commit は commit <名札> on <枝> [hash: <hash>, note: <一言>] の形で書く。当て直しは copy <commit> を、取り込みは merge <枝> を on <枝> の後ろに書く",fromShape:"枝を切る行は <枝> from <commit> の形で書く",undeclaredBranch:o=>`${o} という枝は宣言していない`,undeclaredRef:o=>`${o} という枝は宣言していない。札を動かす線は枝の名札か HEAD から引く`,noCommit:o=>`${o} という commit はまだ積んでいない`,emptyBranch:o=>`${o} の枝はまだどの commit も指していないので取り込めない`,mergeSelf:o=>`${o} は積む枝なので、取り込む枝にできない`,headReserved:o=>`${o} は枝分かれの図で今いる場所の札の名前で、名札に使えない`,badHash:"hash は 0 から 9 と a から f の字で 4 から 40 字にする"}},$b=()=>{const a={sequence:"sequence <title>",architecture:"architecture <title>",group:"group <id> as <name> [note: <note>] through end",box:"box <id> as <name> [note: <caption>]",strip:"strip <title>: <field>, <field>",view:"sequence <title> [view: follow]",step:"step <step title>",say:"say <step body>",code:"code <command>",act:"act <id>: <action>",note:"note <id>: <caption>",set:"set <field>: <value> [tag: <tag>]"};return{noHead:`Write the diagram kind (${cn(Io)}) and a title on the first line`,badHead:`Start the first line with ${Io.join(" or ")}, followed by the title`,oldForm:(o,u)=>`${o} is the old notation. Write ${a[u]} instead`,unknownHead:o=>`A line cannot start with ${o}. Start a line with ${cn(Qu)}, or <id> -> <id>`,duplicate:o=>`${o} is already declared`,needsId:o=>`Write an id after ${o}`,badId:o=>`${o} cannot be an id. An id has no spaces and none of [ ] 「 」 = :`,afterId:"Write as <name> or attributes after the id",undeclaredBox:o=>`No box named ${o} is declared`,noBody:o=>`Step "${o}" needs a body (a say line)`,emptyStepTitle:"Write a title after step",noBoxes:"Declare at least one box",noSteps:"Write at least one step (a step line)",emptySay:"Write the step body after say, or on indented lines below it",sayTwice:"A step takes one say. Continue a long body on indented lines below it",codeTwice:"A step takes at most one code line",emptyCode:"Write the command after code",declarationInStep:"Write group, box, strip and branch before the first step",stepLineBeforeStep:"Write lines, say, code, act, note, set, commit and branch cuts under a step",nestedGroup:"A group cannot hold another group. Close it with end first",strayEnd:"There is no group for this end to close",endTakesNothing:"Write nothing after end",unclosedGroup:o=>`group ${o} is not closed with end`,regionReopened:o=>`group ${o} is already declared. To open it again, write only group ${o}; put the name and attributes on the first one`,emptyName:o=>`${o} has an empty name`,stripTwice:"Declare only one strip",stripShape:"Write a strip as strip <title>: <field>, <field>",emptyStripField:"A strip field name is empty",stripUndeclared:"Declare the strip as strip <title>: <field>, <field> before writing set",noSuchField:o=>`The strip has no field named ${o}`,stripNeedsValue:"Write set as set <field>: <value> or set <field> [tag: <tag>]",actShape:"Write act as act <id>: <action>",noteShape:"Write note as note <id>: <caption>",edgeShape:"Write a line as <id> -> <id>: <label> [<attributes>]",emptyLabel:"Write the label after the : of a line, or leave out the : as well",quoteUnclosed:'A value that starts with " is not closed with "',afterQuote:'After a value closed with ", write only attributes or the next ,',attrUnclosed:"Start attributes with [, close them with ], and put them at the end of the line",attrNoColon:o=>`[${o}] cannot be read. Write an attribute as [<key>: <value>]`,attrNoValue:o=>`Write a value after ${o}:`,attrTwice:o=>`Write ${o} only once on a line`,badAttr:(o,u)=>`${o} cannot be written on this line. Write ${cn(u)}`,badColor:`color is one of ${cn(Wu)}`,badView:`view is one of ${cn(Ku)}`,badCarry:`carry is one of ${cn(Zu)}. Write a tag as tag: <value>`,badSide:`side is one of ${cn(Pu)}`,carryTwice:"A line carries one thing. Do not write carry and tag together",reservedId:o=>`${o} names the start or end mark of a state diagram and cannot be a box id`,intoStart:"A line cannot go into start. start is the start mark, and lines leave it",outOfFinish:"A line cannot leave finish. finish is the end mark, and lines go into it",pathNoAttrs:"A line before the first step is a path not taken, so it takes no attributes (carry, tag, side)",gitOnly:o=>`${o} lines can be written only in git diagrams`,gitNoGroup:"A git diagram takes no group. Declare branches with branch lines",noBranches:"Declare at least one branch with a branch line",branchShape:"Write a branch as branch <id> [note: <note>]",commitShape:"Write a commit as commit <id> on <branch> [hash: <hash>, note: <note>]. For a replayed commit add copy <commit>, and for a merge commit add merge <branch>, after on <branch>",fromShape:"Write a branch cut as <branch> from <commit>",undeclaredBranch:o=>`No branch named ${o} is declared`,undeclaredRef:o=>`No branch named ${o} is declared. A line that moves a ref starts from a branch id or HEAD`,noCommit:o=>`No commit named ${o} has been made yet`,emptyBranch:o=>`Branch ${o} does not point at any commit yet, so it cannot be merged`,mergeSelf:o=>`${o} is the branch being committed to, so it cannot be the branch merged in`,headReserved:o=>`${o} names where you are in a git diagram and cannot be an id`,badHash:"Write a hash as 4 to 40 characters of 0-9 and a-f"}},Ob={ja:Mb(),en:$b()},Cb=a=>Ob[a],hm=a=>a.text===""||a.text.startsWith("//");function jb(a,o){return a.column+Array.from(a.text.slice(0,o)).length}function Bb(a){return a.split(/\r?\n/).map((o,u)=>{const r=Array.from(o.slice(0,o.length-o.trimStart().length)).length;return{line:u+1,column:r+1,indent:r,text:o.trim()}})}var Pl=1;function zb(a){if(typeof a!="object"||a===null)return;const o=a.version;return typeof o=="number"&&o>Pl?o:void 0}var Rb=(a,o)=>({pointer:"/version",message:Vm[o].newer(a,Pl)});function ii(a,o={}){const u=zb(a);if(u!==void 0)return{ok:!1,errors:[Rb(u,o.lang??"ja")]};const r=Nb(a,o);return r.ok?{ok:!0,diagram:a,warnings:[]}:r}var Iu=class extends Error{constructor(a,o,u){super(u),this.line=a,this.column=o}line;column},De=(a,o,u)=>new Iu(a.line,jb(a,o),u),Im=/^[^\s[\]「」=:]+$/u,qb=/^([^\s:[\]]+?)\s*->\s*([^\s:[\]]+)/du,Hb=new RegExp(`^commit\\s+([^\\s[]+)(?:\\s+${Zm}\\s+([^\\s[]+))?(?:\\s+${Km}\\s+([^\\s[]+))?(?:\\s+${Pm}\\s+([^\\s[]+))?`,"du"),Ub=new RegExp(`^([^\\s[]+)\\s+${Ju}(?:\\s+([^\\s[]+))?\\s*$`,"du"),Lb=/^[0-9a-f]{4,40}$/u,Ba=(a,o)=>a.includes(o);function Pt(a,o){let u=o;for(;u<a.length&&/\s/u.test(a[u]??"");)u++;return u}function ti(a,o,u){const r=a.text;let f="";for(let i=o+1;i<r.length;i++){const d=r[i]??"",h=r[i+1]??"";if(d==="\\"&&(h==='"'||h==="\\"))f+=h,i++;else{if(d==='"')return{value:f,end:i+1};f+=d}}throw De(a,o,u.quoteUnclosed)}function Rl(a,o,u){const r=a.text,f=Pt(r,o);if(r[f]==='"'){const h=ti(a,f,u),m=Pt(r,h.end);if(m<r.length&&r[m]!=="[")throw De(a,m,u.afterQuote);return{value:h.value,rest:m}}const i=r.indexOf("[",f),d=i<0?r.length:i;return{value:r.slice(f,d).trim(),rest:d}}function Zo(a,o,u,r){const f=a.text;if(!f.endsWith("]"))throw De(a,o,r.attrUnclosed);const i=f.length-1,d=new Map;for(let h=o+1;;){const m=Pt(f,h);let p=m;for(;p<i&&f[p]!==":"&&f[p]!==",";)p++;if(p>=i||f[p]!==":")throw De(a,m,r.attrNoColon(f.slice(m,p).trim()));const y=f.slice(m,p).trim();if(!u.includes(y))throw De(a,m,r.badAttr(y,u));if(d.has(y))throw De(a,m,r.attrTwice(y));let w=Pt(f,p+1),_;if(f[w]==='"'){const v=ti(a,w,r);if(_=v.value,w=Pt(f,v.end),w<i&&f[w]!==",")throw De(a,w,r.afterQuote)}else{const v=f.indexOf(",",w),$=v<0||v>i?i:v;_=f.slice(w,$).trim(),w=$}if(_==="")throw De(a,m,r.attrNoValue(y));if(d.set(y,{value:_,at:m}),w>=i)return d;h=w+1}}function Gb(a,o,u){const r=a.text,f=[];for(let i=o;;){const d=Pt(r,i);let h,m;if(r[d]==='"'){const p=ti(a,d,u);if(h=p.value,m=Pt(r,p.end),m<r.length&&r[m]!==",")throw De(a,m,u.afterQuote)}else{const p=r.indexOf(",",d);m=p<0?r.length:p,h=r.slice(d,m).trim()}if(h==="")throw De(a,d,u.emptyStripField);if(f.push(h),m>=r.length)return f;i=m+1}}function Eu(a,o,u,r){const f=a.text,i=Pt(f,o.length),d=/^[^\s[]+/u.exec(f.slice(i))?.[0];if(d===void 0)throw De(a,0,r.needsId(o));if(!Im.test(d))throw De(a,i,r.badId(d));let h=Pt(f,i+d.length),m;if(f.startsWith(El,h)&&/^(\s|$)/u.test(f.slice(h+El.length,h+El.length+1))){const y=Rl(a,h+El.length,r);if(y.value==="")throw De(a,h,r.emptyName(d));m=y.value,h=y.rest}if(h<f.length&&f[h]!=="[")throw De(a,h,r.afterId);const p=h<f.length?Zo(a,h,u,r):new Map;return{id:d,idAt:i,...m!==void 0?{name:m}:{},attrs:p}}function pm(a,o,u){const r=o.get("color");if(r&&!Ba(Wu,r.value))throw De(a,r.at,u.badColor);const f=o.get("note")?.value,i=o.get("icon")?.value;return{...f!==void 0?{note:f}:{},...r?{color:r.value}:{},...i!==void 0?{icon:i}:{}}}function mm(a,o){const u=a.split(/\s/u)[0]??"";if(u==="帯")return{word:u,shape:o?"set":"strip"};if(Object.hasOwn(fm,u))return{word:u,shape:fm[u]};if(a.startsWith("#"))return{word:"#",shape:"step"};if(a.startsWith(">"))return{word:">",shape:"say"};if(a.startsWith("`"))return{word:"`",shape:"code"};if(a.includes("「"))return{word:"「」",shape:o?"note":"box"};if(/^[^\s=:]+\s*=(?!>)/u.test(a))return{word:"=",shape:"box"};if(o&&/^[^\s:]+\s*:/u.test(a))return{word:":",shape:"act"}}function Yb(a,o){const u=a.findIndex(L=>!hm(L)),r=a[u];if(!r)throw new Iu(1,1,o.noHead);const f=r.text.split(/\s/u)[0]??"";if(!Ba(Io,f)){const L=mm(r.text,!1);throw De(r,0,L?o.oldForm(L.word,L.shape):o.badHead)}const i=Rl(r,f.length,o);if(i.value==="")throw De(r,0,o.badHead);const d=i.value,h=i.rest<r.text.length?Zo(r,i.rest,as.diagram,o).get("view"):void 0;if(h&&!Ba(Ku,h.value))throw De(r,h.at,o.badView);const m=h?.value,p=f==="state",y=f==="git",w=[],_=new Set,v=new Map,$=[],j=[],N=[],O=new Set;let T;const C=[];let H,ue;const Z=(L,G,A)=>{if(O.has(G))throw De(L,A,o.duplicate(G));O.add(G)},ie=(L,G,A)=>{if(!j.some(W=>W.id===G))throw De(L,A,o.undeclaredBox(G));return G},U=(L,G,A)=>{if(!v.has(G))throw De(L,A,o.undeclaredBranch(G));return G},fe=(L,G,A)=>{if(!_.has(G))throw De(L,A,o.noCommit(G));return G},re=(L,G,A,W)=>{if(y){if(W==="to")return fe(L,G,A);if(G!==Gn&&!v.has(G))throw De(L,A,o.undeclaredRef(G));return G}if(!p||!Ba(ei,G))return ie(L,G,A);if(G==="start"!=(W==="from"))throw De(L,A,G==="start"?o.intoStart:o.outOfFinish);return G},Ee=(L,G,A)=>{if(p&&Ba(ei,G))throw De(L,A,o.reservedId(G));if(y&&G===Gn)throw De(L,A,o.headReserved(G))},R=L=>{if(!H)throw De(L,0,o.stepLineBeforeStep);return H},ge=L=>{if(H)throw De(L,0,o.declarationInStep)},we=()=>{if(H){if(H.body===void 0)throw De(H.source,0,o.noBody(H.title));C.push({title:H.title,body:H.body.join(`
`),...H.code!==void 0?{code:H.code}:{},events:H.events})}},ke=a.slice(u+1);for(let L=0;L<ke.length;L++){const G=ke[L];if(!G||hm(G))continue;const A=G.text,W=qb.exec(A);if(W){p&&!H?N.push(_e(G,W)):R(G).events.push(Me(G,W));continue}const[ae="",se]=A.split(/\s+/u);if(y&&v.has(ae)&&se===Ju){R(G).events.push(k(G));continue}if(!y&&(ae==="branch"||ae==="commit"))throw De(G,0,o.gitOnly(ae));if(!Ba(Qu,ae)){const xe=mm(A,H!==void 0);throw De(G,0,xe?o.oldForm(xe.word,xe.shape):o.unknownHead(ae))}switch(ae){case"group":E(G);break;case"end":if(A!==ae)throw De(G,ae.length,o.endTakesNothing);if(!ue)throw De(G,0,o.strayEnd);ue=void 0;break;case"box":z(G);break;case"strip":X(G);break;case"step":{if(ue)throw De(ue.source,0,o.unclosedGroup(ue.id));we();const xe=A.slice(ae.length).trim();if(xe==="")throw De(G,0,o.emptyStepTitle);H={source:G,title:xe,events:[]};break}case"say":L=ce(G,L);break;case"code":{const xe=R(G);if(xe.code!==void 0)throw De(G,0,o.codeTwice);const S=A.slice(ae.length).trim();if(S==="")throw De(G,0,o.emptyCode);xe.code=S;break}case"act":{const xe=R(G),S=ve(G,ae,o.actShape);xe.events.push({type:"action",box:S.box,label:S.text});break}case"note":{const xe=R(G),S=ve(G,ae,o.noteShape);xe.events.push({type:"swap",box:S.box,text:S.text});break}case"set":R(G).events.push(Ge(G));break;case"branch":K(G);break;case"commit":{R(G).events.push(P(G));break}}}if(ue)throw De(ue.source,0,o.unclosedGroup(ue.id));if(we(),y&&w.length===0)throw De(r,0,o.noBranches);if(j.length===0&&!y)throw De(r,0,o.noBoxes);if(C.length===0)throw De(r,0,o.noSteps);return{version:Pl,kind:f,title:d,...m?{view:m}:{},...$.length>0?{regions:$}:{},boxes:j,...T?{strip:T}:{},steps:C,...f==="sequence"?{sequence:{lifelines:j.map(L=>L.id)}}:{},...N.length>0?{state:{paths:N}}:{},...y?{git:{branches:w}}:{}};function E(L){if(ge(L),y)throw De(L,0,o.gitNoGroup);if(ue)throw De(L,0,o.nestedGroup);const G=Eu(L,"group",as.group,o);if($.some(A=>A.id===G.id)){if(G.name!==void 0||G.attrs.size>0)throw De(L,0,o.regionReopened(G.id))}else Ee(L,G.id,G.idAt),Z(L,G.id,G.idAt),$.push({id:G.id,name:G.name??G.id,...pm(L,G.attrs,o)});ue={source:L,id:G.id}}function z(L){ge(L);const G=Eu(L,"box",as.box,o);Ee(L,G.id,G.idAt),Z(L,G.id,G.idAt);const{note:A,...W}=pm(L,G.attrs,o);j.push({id:G.id,name:G.name??G.id,...A!==void 0?{sub:A}:{},...W,...ue?{region:ue.id}:{}})}function K(L){ge(L);const G=Eu(L,"branch",as.branch,o);if(G.name!==void 0)throw De(L,0,o.branchShape);Ee(L,G.id,G.idAt),Z(L,G.id,G.idAt);const A=G.attrs.get("note")?.value;w.push({id:G.id,...A!==void 0?{note:A}:{}}),v.set(G.id,null)}function P(L){const G=L.text,A=Hb.exec(G),W=Oe=>A?.indices?.[Oe]?.[0]??0,ae=A?.[1],se=A?.[2];if(!A||ae===void 0||se===void 0)throw De(L,0,o.commitShape);const xe=Pt(G,A[0].length);if(xe<G.length&&G[xe]!=="[")throw De(L,xe,o.commitShape);if(!Im.test(ae))throw De(L,W(1),o.badId(ae));Ee(L,ae,W(1)),Z(L,ae,W(1));const S=U(L,se,W(2)),F=A[3]===void 0?void 0:fe(L,A[3],W(3)),ee=A[4]===void 0?void 0:he(L,A[4],W(4),S),te=xe<G.length?Zo(L,xe,as.commit,o):new Map,be=te.get("hash");if(be&&!Lb.test(be.value))throw De(L,be.at,o.badHash);const Ne=te.get("note")?.value;return _.add(ae),F===void 0&&v.set(S,ae),{type:"commit",id:ae,branch:S,...F!==void 0?{copy:F}:{},...ee!==void 0?{merge:ee}:{},...be?{hash:be.value}:{},...Ne!==void 0?{note:Ne}:{}}}function he(L,G,A,W){if(U(L,G,A),G===W)throw De(L,A,o.mergeSelf(G));if(v.get(G)===null)throw De(L,A,o.emptyBranch(G));return G}function k(L){const G=Ub.exec(L.text),A=G?.[1],W=G?.[2];if(!G||A===void 0||W===void 0)throw De(L,0,o.fromShape);return fe(L,W,G.indices?.[2]?.[0]??0),v.set(A,W),{type:"branch",branch:A,from:W}}function X(L){if(ge(L),T)throw De(L,0,o.stripTwice);const G=L.text,A=Pt(G,5);let W,ae;if(G[A]==='"'){const se=ti(L,A,o);W=se.value,ae=Pt(G,se.end)}else ae=G.indexOf(":",A),W=ae<0?"":G.slice(A,ae).trim();if(W===""||G[ae]!==":")throw De(L,0,o.stripShape);T={title:W,fields:Gb(L,ae+1,o)}}function ce(L,G){const A=R(L);if(A.body!==void 0)throw De(L,0,o.sayTwice);const W=L.text.slice(3).trim(),ae=W===""?[]:[W];let se=0,xe=G;for(let S=G+1;S<ke.length;S++){const F=ke[S];if(!F)break;if(F.text===""){se++;continue}if(F.indent<=L.indent)break;ae.push(...Array.from({length:se},()=>""),F.text),se=0,xe=S}if(ae.length===0)throw De(L,0,o.emptySay);return A.body=ae,xe}function ve(L,G,A){const W=new RegExp(`^${G}\\s+([^\\s:]+)\\s*:\\s*(.*)$`,"du").exec(L.text),ae=W?.indices?.[1]?.[0];if(!W||ae===void 0||(W[2]??"")==="")throw De(L,0,A);return{box:ie(L,W[1]??"",ae),text:W[2]??""}}function Se(L,G){const A=L.text,W=re(L,G[1]??"",G.indices?.[1]?.[0]??0,"from"),ae=re(L,G[2]??"",G.indices?.[2]?.[0]??0,"to"),se=Pt(A,G[0].length);if(A[se]!==":")return{from:W,to:ae,at:se};const xe=Rl(L,se+1,o);if(xe.value==="")throw De(L,se,o.emptyLabel);return{from:W,to:ae,label:xe.value,at:xe.rest}}function _e(L,G){const{from:A,to:W,label:ae,at:se}=Se(L,G);if(se<L.text.length)throw De(L,se,L.text[se]==="["?o.pathNoAttrs:o.edgeShape);return{from:A,to:W,...ae!==void 0?{label:ae}:{}}}function Me(L,G){const A=L.text,{from:W,to:ae,label:se,at:xe}=Se(L,G);if(xe<A.length&&A[xe]!=="[")throw De(L,xe,o.edgeShape);const S=xe<A.length?Zo(L,xe,as.edge,o):new Map,F=S.get("tag"),ee=S.get("carry");if(F&&ee)throw De(L,Math.max(F.at,ee.at),o.carryTwice);if(ee&&!Ba(Zu,ee.value))throw De(L,ee.at,o.badCarry);const te=S.get("side");if(te&&!Ba(Pu,te.value))throw De(L,te.at,o.badSide);let be=y?{kind:"tag",text:W}:{kind:"envelope"};return F?be={kind:"tag",text:F.value}:ee&&(be=ee.value==="coin"?{kind:"coin"}:{kind:"none"}),y&&W!==Gn&&v.set(W,ae),{type:"edge",from:W,to:ae,...se!==void 0?{label:se}:{},carry:be,...te?{labelSide:te.value}:{}}}function Ge(L){const G=T;if(!G)throw De(L,0,o.stripUndeclared);const A=L.text,W=Pt(A,3);let ae,se;if(A[W]==='"'){const F=ti(L,W,o);ae=F.value,se=Pt(A,F.end)}else{for(se=W;se<A.length&&A[se]!==":"&&A[se]!=="[";)se++;ae=A.slice(W,se).trim()}if(!G.fields.includes(ae))throw De(L,W,o.noSuchField(ae));let xe;if(A[se]===":"){const F=Rl(L,se+1,o);if(F.value==="")throw De(L,se,o.stripNeedsValue);xe=F.value,se=F.rest}if(se<A.length&&A[se]!=="[")throw De(L,se,o.stripNeedsValue);const S=se<A.length?Zo(L,se,as.set,o).get("tag")?.value:void 0;if(xe===void 0&&S===void 0)throw De(L,0,o.stripNeedsValue);return{type:"strip",field:ae,...xe!==void 0?{value:xe}:{},...S!==void 0?{tag:S}:{}}}}function qa(a,o={}){try{return{ok:!0,diagram:Yb(Bb(a),Cb(o.lang??"ja"))}}catch(u){if(!(u instanceof Iu))throw u;return{ok:!1,errors:[{line:u.line,column:u.column,message:u.message}]}}}var Wl=a=>`"${a.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`,Il=a=>a.includes("[")||a.startsWith('"')?Wl(a):a,eg=a=>a.includes(":")||a.includes("[")||a.startsWith('"')?Wl(a):a,Fb=a=>a.includes(",")||a.startsWith('"')?Wl(a):a,Xb=a=>a.includes(",")||a.includes("]")||a.startsWith('"')?Wl(a):a,is=a=>{const o=a.filter(u=>u[1]!==void 0);return o.length===0?"":` [${o.map(([u,r])=>`${u}: ${Xb(r)}`).join(", ")}]`},tg=(a,o)=>o===a?"":` as ${Il(o)}`,gm=a=>`group ${a.id}${tg(a.id,a.name)}${is([["note",a.note],["color",a.color],["icon",a.icon]])}`,Vb=a=>`box ${a.id}${tg(a.id,a.name)}${is([["note",a.sub],["color",a.color],["icon",a.icon]])}`,ng=(a,o,u)=>`${a} -> ${o}${u===void 0?"":`: ${Il(u)}`}`;function Qb(a,o){switch(a.type){case"edge":{const r=(o?a.carry.kind==="tag"&&a.carry.text===a.from:a.carry.kind==="envelope")?[]:a.carry.kind==="tag"?[["tag",a.carry.text]]:[["carry",a.carry.kind]];return`${ng(a.from,a.to,a.label)}${is([...r,["side",a.labelSide]])}`}case"action":return`act ${a.box}: ${a.label}`;case"swap":return`note ${a.box}: ${a.text}`;case"strip":return`set ${eg(a.field)}${a.value===void 0?"":`: ${Il(a.value)}`}${is([["tag",a.tag]])}`;case"commit":return`commit ${a.id} ${Zm} ${a.branch}${a.copy===void 0?"":` ${Km} ${a.copy}`}${a.merge===void 0?"":` ${Pm} ${a.merge}`}${is([["hash",a.hash],["note",a.note]])}`;case"branch":return`${a.branch} ${Ju} ${a.from}`}}function Jb(a){const o=a.regions??[],u=[];for(const h of a.boxes){const m=u.at(-1);m&&m.region===h.region?m.boxes.push(h):u.push({...h.region!==void 0?{region:h.region}:{},boxes:[h]})}const r=[...new Set(u.flatMap(h=>h.region===void 0?[]:[h.region]))],f=r.length===o.length&&r.every((h,m)=>o[m]?.id===h),i=new Set,d=[];if(!f)for(const h of o)d.push(`${gm(h)}
end`),i.add(h.id);for(const h of u){const m=h.boxes.map(Vb);if(h.region===void 0){d.push(m.join(`
`));continue}const p=o.find(w=>w.id===h.region),y=i.has(h.region)||!p?`group ${h.region}`:gm(p);i.add(h.region),d.push([y,...m.map(w=>`  ${w}`),"end"].join(`
`))}return d}function ni(a){const o=(a.git?.branches??[]).map(r=>`branch ${r.id}${is([["note",r.note]])}`),u=[`${a.kind} ${Il(a.title)}${is([["view",a.view]])}`,...o.length>0?[o.join(`
`)]:[],...Jb(a)];a.strip&&u.push(`strip ${eg(a.strip.title)}: ${a.strip.fields.map(Fb).join(", ")}`),a.state&&u.push(a.state.paths.map(r=>ng(r.from,r.to,r.label)).join(`
`));for(const r of a.steps){const f=r.body.split(`
`),i=f.length===1?[`  say ${r.body}`]:["  say",...f.map(d=>d===""?"":`    ${d}`)];u.push([`step ${r.title}`,...i,...r.code===void 0?[]:[`  code ${r.code}`],...r.events.map(d=>`  ${Qb(d,a.kind==="git")}`)].join(`
`))}return`${u.join(`

`)}
`}var ai={sans:"Noto Sans JP Variable",mono:"JetBrains Mono Variable"},Zb={0:590,1:590,2:590,3:590,4:590,5:590,6:590,7:590,8:590,9:590," ":228,"!":371,'"':575,"#":590,$:590,"%":963,"&":740,"'":325,"(":378,")":378,"*":507,"+":590,",":325,"-":371,".":325,"/":390,":":325,";":325,"<":590,"=":590,">":590,"?":514,"@":1007,A:642,B:682,C:657,D:715,E:616,F:586,G:718,H:758,I:330,J:568,K:686,L:579,M:854,N:750,O:771,P:668,Q:771,R:682,S:624,T:626,U:748,V:619,W:915,X:627,Y:581,Z:614,"[":378,"\\":390,"]":378,"^":590,_:568,"`":626,a:591,b:644,c:528,d:645,e:581,f:372,g:598,h:640,i:305,j:306,k:605,l:315,m:964,n:641,o:626,p:645,q:645,r:437,s:495,t:421,u:638,v:576,w:863,x:562,y:575,z:512,"{":378,"|":297,"}":378,"~":590,"…":1e3,"−":590,"×":1e3,"→":1e3,"←":1e3,"↑":1e3,"↓":1e3,"–":545,"—":908,"‘":325,"’":325,"“":575,"”":575,"°":404,"±":1e3,"·":593,"•":379},Kb=600,Pb=11904,qu=1e3;function Wb(a,o){return(a.codePointAt(0)??0)>=Pb?qu:o==="mono"?Kb:Zb[a]??qu}var Ib={clear:{name:"澄んだ色",note:"白い地に、中くらいの明るさの鮮やかな 6 色。今の見本帳の色",light:{page:"#f3f4f7",bg:"#ffffff",surf:"#ffffff",sunk:"#f5f6f8",ink:"#12141a",ink2:"#3f4451",mute:"#6b7180",hair:"#12141a1c",line:"#12141a40",sh:"#101828","on-c":"#ffffff","c-blue":"#467deb","t-blue":"#2e62ce","c-amber":"#d28008","t-amber":"#975b04","c-green":"#0ea886","t-green":"#07775e","c-violet":"#6c3bb2","t-violet":"#6c3bb2","c-rose":"#ba3e40","t-rose":"#b83c3f","c-slate":"#5d6677","t-slate":"#5d6677",coin:"#e9b114",coint:"#856300",coinin:"#a8740c",tint:"5%",edge:"20%",shA:".05",shB:".08",carry:"#65686f"},dark:{page:"#08090c",bg:"#0d0e12",surf:"#17191f",sunk:"#121419",ink:"#eceef3",ink2:"#c4c8d2",mute:"#9198a6",hair:"#eceef31f",line:"#eceef340",sh:"#000000","on-c":"#0d0e12","c-blue":"#7e7ef6","t-blue":"#989cfd","c-amber":"#c78135","t-amber":"#dd954b","c-green":"#20ac7a","t-green":"#35b986","c-violet":"#695b9f","t-violet":"#a79ae3","c-rose":"#bc434b","t-rose":"#fd7d81","c-slate":"#9ba3b2","t-slate":"#9da5b4",coin:"#f0c040",coint:"#f0c040",coinin:"#9a6a0c",tint:"6%",edge:"19%",shA:".45",shB:".35"}},paper:{name:"紙と墨",note:"生成りの紙の地に、藍 / 黄土 / 苔 / 葡萄 / 朱 / 鈍のくすんだ 6 色",light:{page:"#ece7dd",bg:"#f9f6f0",surf:"#fffcf6",sunk:"#f2ede4",ink:"#221e18",ink2:"#4b453b",mute:"#7b7366",hair:"#221e181f",line:"#221e1847",sh:"#3a2a10","on-c":"#fffcf6","c-blue":"#487dd5","t-blue":"#2d60b5","c-amber":"#c38405","t-amber":"#885a01","c-green":"#57a271","t-green":"#237143","c-violet":"#904698","t-violet":"#904698","c-rose":"#a9513e","t-rose":"#9f4836","c-slate":"#6a645a","t-slate":"#696359",coin:"#d4a52a",coint:"#7d5e05",coinin:"#9a7016",tint:"6%",edge:"22%",shA:".06",shB:".07",carry:"#68635c"},dark:{page:"#0e0d0b",bg:"#15130f",surf:"#1e1b17",sunk:"#191612",ink:"#ede6d8",ink2:"#cbc2b1",mute:"#9c9283",hair:"#ede6d81f",line:"#ede6d842",sh:"#000000","on-c":"#15130f","c-blue":"#5785d5","t-blue":"#76a6f9","c-amber":"#be8802","t-amber":"#d59e2f","c-green":"#52aa71","t-green":"#61b87e","c-violet":"#90529b","t-violet":"#d08edb","c-rose":"#bb4e3d","t-rose":"#f98672","c-slate":"#a9a295","t-slate":"#aca598",coin:"#dcb24e",coint:"#dcb24e",coinin:"#8a6a14",tint:"6%",edge:"19%",shA:".45",shB:".35"}},night:{name:"夜の計器",note:"青みの黒の地に、光る水色 / 琥珀 / 若緑 / 菫 / 桃 の 6 色。明るい側は青灰の地",light:{page:"#e9eef5",bg:"#f6f9fc",surf:"#ffffff",sunk:"#eef3f8",ink:"#0b1424",ink2:"#34425a",mute:"#64748b",hair:"#0b14241c",line:"#0b142440",sh:"#0b1424","on-c":"#ffffff","c-blue":"#0385cd","t-blue":"#086aa3","c-amber":"#ba8e0f","t-amber":"#7f5f04","c-green":"#0a8857","t-green":"#027449","c-violet":"#5839ba","t-violet":"#5839ba","c-rose":"#dd4a94","t-rose":"#b82375","c-slate":"#64748b","t-slate":"#56667c",coin:"#eab308",coint:"#7e6005",coinin:"#a16207",tint:"5%",edge:"22%",shA:".06",shB:".09",carry:"#596579"},dark:{page:"#060a12",bg:"#0a101c",surf:"#111a2a",sunk:"#0d1522",ink:"#e6edf7",ink2:"#b8c4d6",mute:"#8090a8",hair:"#e6edf71c",line:"#9fb3d145",sh:"#000000","on-c":"#0a101c","c-blue":"#3884b6","t-blue":"#62ace1","c-amber":"#be8533","t-amber":"#d59b4b","c-green":"#3ba774","t-green":"#4fb884","c-violet":"#7d4ecd","t-violet":"#b494fd","c-rose":"#bc3a74","t-rose":"#ff77ad","c-slate":"#96a3b5","t-slate":"#99a6b8",coin:"#facc15",coint:"#facc15",coinin:"#a16207",tint:"6%",edge:"19%",shA:".5",shB:".4"}}},Yl="paper",la=Object.fromEntries(Object.entries(Ib).map(([a,o])=>[a,{id:a,...o}]));function er(a){return(a!==void 0&&Object.hasOwn(la,a)?la[a]:void 0)??la[Yl]}function ag(a,o){return Object.entries(a[o]).map(([u,r])=>`--${u}:${r}`).join(";")}var sg=`--sans:"${ai.sans}";--mono:"${ai.mono}"`,Fl=["blue","amber","green","violet","rose"],gt=(a,o,u="sans")=>({size:a,weight:o,family:u}),pe={boxName:gt(13,650),boxSub:gt(11,500),boxSubStrong:gt(11,700),regionName:gt(12.5,700),regionNote:gt(11,500),label:gt(11,600,"mono"),labelJa:gt(11,650),action:gt(11,650),badge:gt(10.5,700,"mono"),carrier:gt(10.5,700,"mono"),carrierJa:gt(10.5,700),stripTitle:gt(12.5,700),fieldName:gt(10.5,600),fieldValue:gt(12,600,"mono"),fieldValueJa:gt(12,600),tag:gt(10.5,700),miniTitle:gt(10.5,700),stepTitle:gt(15,700),stepBody:gt(13.5,500),stepNo:gt(13,700,"mono"),button:gt(14,700),gitId:gt(11,700),gitHash:gt(10.5,600,"mono"),gitNote:gt(10.5,650)},Y={gap:10,margin:14,box:{h:72,minW:92,padX:12,radius:12,icon:24,iconRadius:7,iconY:-16,iconScale:.74,nameY:12,subY:27},region:{pad:18,gap:10,radius:14,inset:14,icon:24,iconRadius:7,iconScale:.68,nameY:58,line:16,minH:108},architecture:{columns:4,columnGap:56,maxColumnGap:160,rowGap:44,labelRoom:16},sequence:{columnGap:40,labelRoom:16,labelOffset:16,firstRow:10,rowGap:6,stepGap:6,minPitch:32,tail:10,selfW:34,selfH:18},state:{columns:4,columnGap:64,rowGap:108,labelRoom:16,start:7,end:{r:9,inner:5},drop:56,below:64,beside:38,text:16,loop:{w:24,h:34,samples:12,badgeAt:.6},side:{pad:16,gap:76,lane:30,entry:28},ghost:{h:52,pad:12,gap:10,nameY:-2,subY:14},done:{r:6.5,inset:13},pastLabel:.85},git:{x0:120,pitch:90,textGap:12,r:12,orphan:13.5,topLine:120,line:90,topBelow:30,below:82,bare:62,above:18,under:27,lineStep:13,tagTop:58,tag:30,row:22,turn:60,samples:12,boxGap:24,labelUnder:50,colors:["blue","violet","green","amber","rose"]},edge:{inset:3,arrow:6,arrowHalf:3.5,parallel:5,ghostDash:5,flowDash:9,bend:12},label:{h:20,padX:9,radius:10,offset:22,side:14,search:4,searchMax:400,soft:6,touch:2},action:{h:22,padX:10,radius:11},badge:{r:9.5,ring:9,inset:4,along:14,short:44},carrier:{envW:24,envH:17,coinR:6.5,coinIn:3.8,tagH:18,tagPadX:8,samples:16},slot:{gap:6,pad:3,spread:4,h:24,radius:7,clear:2,lifeline:5,mark:4},mark:{pad:3,radius:5,dash:4,gap:3},strip:{h:72,line:44,pad:12,icon:24,titleX:44,fieldGap:22,sepInset:14,tagGap:6,tagH:15,tagPadX:7,nameY:22,valueY:43,trail:{r:5.4,step:16},now:{r:3,gap:7}},stroke:{git:2.25,gitOrphan:1.5,mark:1.6,slot:1.2,hair:1,edge:1.7,edgeOn:2.25,arrow:1.5,flow:1.3,halo:7,on:1.75,glyph:2,lifeline:1.2,envelope:1.5,badgeRing:1.5,path:1.6,end:1.6,done:1.2,trail:1.2},shadow:{near:.8,far:4,nearY:1,farY:3},mini:{w:168,pad:8,title:14,inset:12,radius:10},follow:{aspect:.75,minH:320,fitMinH:160,ease:.6,narrow:440,badgeRoom:8,headRoom:10,head:{pad:8,h:40,nameY:17,subY:31}},mix:{slot:45,icon:14,regionIcon:16,regionIconEdge:34,cap:12,capEdge:42,badgePast:14,badgePastEdge:70,mini:62,miniBand:16,miniBandEdge:36,view:6,side:4,sideEdge:36,ghostEdge:60,path:55,past:72},baseline:{label:3.8,badge:3.5,carrier:3.7,stripTitle:4.5,tag:3.6,action:3.8,mark:4},rise:5,popFrom:.4,player:{gap:10,radius:12,button:36,touch:44,hidden:1,focus:2,narrow:440}},qe={intro:1.4,outro:4.6,tail:.6,stepBase:1.2,perChar:.025,stepMin:2.2,stepMax:5,dwell:1.2,edgeAt:.1,stagger:.5,draw:.55,drawCarry:.9,action:.9,change:.12,minShow:.8,labelDelay:.15,fade:.3,popFade:.4,untilFade:.2,still:.45,done:.3},og=10.5,et={inOut:"cubic-bezier(.65,0,.35,1)",out:"cubic-bezier(.22,1,.36,1)",pop:"cubic-bezier(.34,1.56,.64,1)"},_u=a=>/[0-9A-Za-z]$/u.test(a)?`${a} `:a,ev=a=>a.charAt(0).toUpperCase()+a.slice(1),li={ja:{cannotDraw:a=>`図を描けない: ${a}`,overview:"全体図",prev:"前の段",pause:"止める",play:"動かす",next:"次の段",steps:a=>`${a} の段`,side:"脇道",sideNote:"今回は通らない",sideFrom:a=>`${a} つの状態から入れる`,trail:"通った状態",start:"始まり",end:"終わり",badgeName:a=>`段の番号 ${a}`,quoted:a=>`「${a}」`,iconOf:a=>`「${a} の絵柄」`,coin:"「硬貨」",envelope:"「封筒」",textsOverlap:(a,o)=>`${_u(a)}と${_u(o)}が重なる`,lineCrosses:(a,o,u)=>`線 ${a} → ${o} が${_u(u)}を横切る`},en:{cannotDraw:a=>`Cannot draw the diagram: ${a}`,overview:"Overview",prev:"Previous step",pause:"Pause",play:"Play",next:"Next step",steps:a=>`Steps of ${a}`,side:"Side path",sideNote:"Not taken this time",sideFrom:a=>`Enterable from ${a} ${a===1?"state":"states"}`,trail:"States passed",start:"Start",end:"End",badgeName:a=>`step number ${a}`,quoted:a=>`"${a}"`,iconOf:a=>`the icon of "${a}"`,coin:"the coin",envelope:"the envelope",textsOverlap:(a,o)=>ev(`${a} and ${o} overlap`),lineCrosses:(a,o,u)=>`The line ${a} → ${o} crosses ${u}`}},jn=a=>[...a].some(o=>(o.codePointAt(0)??0)>=11904);function tv(a,o){return o==="mono"&&jn(a)?"sans":o}function Ye(a,o){const u=tv(a,o.family);let r=0;for(const f of a)r+=Wb(f,u);return r*o.size/qu}function ri(a,o,u,r,f="start"){const i=Ye(a,r);return{x:f==="middle"?o-i/2:o,y:u-r.size*.8,w:i,h:r.size}}function tr(a){return a.steps.flatMap((o,u)=>o.events.flatMap((r,f)=>r.type==="edge"?[{step:u,event:f,edge:r}]:[]))}function nr(a){const o=ig(a),u=new Map;return a.boxes.forEach((r,f)=>{const i=r.region===void 0?void 0:o.get(r.region);u.set(r.id,r.color??i??Fl[f%Fl.length])}),u}function ig(a){const o=new Map;return(a.regions??[]).forEach((u,r)=>o.set(u.id,u.color??Fl[r%Fl.length])),o}var ed=(a,o)=>a.carry.kind==="coin"?"coin":o.get(a.from)??"slate";function ar(a,o,u){const r=a.boxes.find(i=>i.id===o);if(!r)return Y.box.minW;const f=[Ye(r.name,pe.boxName),Ye(r.sub??"",pe.boxSub)];for(const i of a.steps)for(const d of i.events)d.type==="swap"&&d.box===o&&f.push(Ye(d.text,pe.boxSubStrong)),u&&d.type==="action"&&d.box===o&&f.push(Ye(d.label,pe.boxSubStrong));return Math.max(Y.box.minW,Math.max(...f)+Y.box.padX*2)}function si(a){const o=Y.carrier;return a.kind==="tag"?[(Ye(a.text,jn(a.text)?pe.carrierJa:pe.carrier)+o.tagPadX*2)/2,o.tagH/2]:a.kind==="coin"?[o.coinR,o.coinR]:[o.envW/2,o.envH/2]}var lg=a=>a.main+a.coin+(a.main>0&&a.coin>0?Y.slot.spread:0);function rg(a){const o=new Map,u=new Set(a.boxes.map(r=>r.id));for(const r of a.steps)for(const f of r.events){if(f.type!=="edge"||f.carry.kind==="none")continue;const i=f.carry.kind==="coin"?"coin":"main",d=si(f.carry)[0]*2;for(const h of[f.from,f.to]){if(!u.has(h))continue;const m=o.get(h)??{main:0,coin:0};m[i]=Math.max(m[i],d),o.set(h,m)}}return o}function cg(a,o,u){return a?(o?Y.box.icon+Y.slot.gap:0)+lg(a)+Y.slot.pad*2+Y.box.padX+u:0}function ug(a,o,u=Y.box.padX){if(!o)return;const r=Y.box,f=Y.slot,i=lg(o)+f.pad*2,d=a.icon?r.icon+f.gap:0,h=Math.max(a.x+r.padX,Math.min(a.cx-(d+i)/2,a.x+a.w-u-(d+i)));a.icon&&(a.iconX=h+r.icon/2),a.slot={x:h+d,y:a.cy+r.iconY-f.h/2,w:i,h:f.h}}function dg(a,o,u){const r=Y.slot,f=(i,d)=>{const h=o.get(i),m=u.get(i);if(!h?.slot||!m)return;const p=h.slot.x+r.pad,y=h.slot.y+h.slot.h/2;return m.main>0&&m.coin>0?d.kind==="coin"?[p+m.main+r.spread+m.coin/2,y]:[p+m.main/2,y]:[h.slot.x+h.slot.w/2,y]};for(const i of a){if(i.carry.kind==="none")continue;const d=f(i.to,i.carry),h=f(i.from,i.carry);d&&(i.settle=d),h&&(i.wait=h)}}function Po(a,o){const u=Math.max(o.x-(a.x+a.w),a.x-(o.x+o.w)),r=Math.max(o.y-(a.y+a.h),a.y-(o.y+o.h));return Math.max(u,r)}function td(a,o,u=0){const r=o.x+u,f=o.y+u,i=o.x+o.w-u,d=o.y+o.h-u;if(i<=r||d<=f)return!1;for(let h=1;h<a.length;h++){const[m,p]=a[h-1],[y,w]=a[h],_=y-m,v=w-p;let $=0,j=1;const N=(O,T)=>{if(O===0)return T>0;const C=T/O;return O<0?$=Math.max($,C):j=Math.min(j,C),$<j};if(N(-_,m-r)&&N(_,i-m)&&N(-v,p-f)&&N(v,d-p))return!0}return!1}function nv(a){let o={a:a[0],b:a[1]??a[0],length:-1};for(let u=1;u<a.length;u++){const r=a[u-1],f=a[u],i=Math.hypot(f[0]-r[0],f[1]-r[1]);i>o.length&&(o={a:r,b:f,length:i})}return{a:o.a,b:o.b,vertical:Math.abs(o.b[0]-o.a[0])<Math.abs(o.b[1]-o.a[1])}}function ls(a,o){let u=o;for(let r=1;r<a.length;r++){const f=a[r-1],i=a[r],d=Math.hypot(i[0]-f[0],i[1]-f[1]);if(u<=d&&d>0)return[f[0]+(i[0]-f[0])*u/d,f[1]+(i[1]-f[1])*u/d];u-=d}return a[a.length-1]}function sr(a){let o=0;for(let u=1;u<a.length;u++){const r=a[u-1],f=a[u];o+=Math.hypot(f[0]-r[0],f[1]-r[1])}return o}function fg(a){const{w:o,h:u,samples:r}=Y.state.loop,f=a.y+a.h,i=[a.cx+o/2,f],d=[a.cx+o*3/4,f+u*4/3],h=[a.cx-o*3/4,f+u*4/3],m=[a.cx-o/2,f+Y.edge.inset];return Array.from({length:r+1},(p,y)=>{const w=y/r,_=1-w,v=$=>_*_*_*i[$]+3*_*_*w*d[$]+3*_*w*w*h[$]+w*w*w*m[$];return[v(0),v(1)]})}function hg(a){const o=Math.max(...a.map(([f])=>f)),u=a[0][1],r=Math.max(...a.map(([,f])=>f));return[o+Y.badge.r+Y.badge.inset,u+(r-u)*Y.state.loop.badgeAt]}function pg(a,o){return{x:(a[0]?.[0]??0)-Y.state.loop.w/2-o/2,y:Math.max(...a.map(([,u])=>u))+Y.label.soft}}var ym=Y.state.loop.h+Y.label.soft*2+Y.label.h;function or(a,o=[],u=[]){const r=sr(a),f=r<Y.badge.short?Math.min(Y.badge.r+1,r/2):Y.badge.along,i=Y.badge.r*2+Y.badge.inset;for(let d=f;d<=r;d+=1){const h=ls(a,d);if(o.every(([m,p])=>Math.hypot(h[0]-m,h[1]-p)>=i))return h}return av(a,f,o,u)??ls(a,f)}function av(a,o,u,r){const f=sr(a),[i,d]=ls(a,o),[h,m]=ls(a,Math.max(0,o-1)),[p,y]=ls(a,Math.min(f,o+1)),w=Math.hypot(p-h,y-m);if(w===0)return;const[_,v]=[-(y-m)/w,(p-h)/w],$=Y.badge.r*2;for(const j of[Y.edge.arrowHalf,0])for(let N=1;N<=$+Y.badge.inset;N++)for(const O of[1,-1]){const T=[i+_*N*O,d+v*N*O];if(u.every(([H,ue])=>Math.max(Math.abs(T[0]-H),Math.abs(T[1]-ue))>=$+1)&&r.every(H=>!td(H,us(T),-j)))return T}}var Xl=a=>a.points.map(([o,u])=>`${Math.round(o*10)},${Math.round(u*10)}`).join(" ");function Ks(a,o,u=(r,f,i)=>or(r.points,f,i)){const r=new Map,f=[],i=new Map;for(let d=0;d<o;d++){const h=a.find(_=>_.step===d&&_.points.length>0);if(!h)continue;const m=Xl(h),p=i.get(m);if(p){r.set(d,{point:p,edge:h});continue}const y=a.filter(_=>_.points.length>1&&Xl(_)!==m).map(_=>_.points),w=u(h,f,y);f.push(w),i.set(m,w),r.set(d,{point:w,edge:h})}return r}function ir(a){const o=(u,r)=>Math.hypot(u.x-r.x,u.y-r.y)<=.5;return a.map(u=>{const r=a.filter(f=>f.step>u.step&&o(f,u)).sort((f,i)=>f.step-i.step)[0];return r?{...u,until:r.step}:u})}var us=([a,o])=>({x:a-Y.badge.r,y:o-Y.badge.r,w:Y.badge.r*2,h:Y.badge.r*2}),mg=a=>[a.x+Y.state.text,a.y+Y.baseline.mark],ra=a=>jn(a)?pe.labelJa:pe.label,sv={above:"below",below:"above",left:"right",right:"left"};function oi(a,o){const u=Ye(a.text,ra(a.text))+Y.label.padX*2,r=Y.label.h,f=nv(a.points),i=(f.a[0]+f.b[0])/2,d=(f.a[1]+f.b[1])/2,h=a.side??(f.vertical?"right":"above"),{side:m}=Y.label,p=a.offset??Y.label.offset,y=N=>N==="above"?{x:i-u/2,y:d-p-r/2,w:u,h:r}:N==="below"?{x:i-u/2,y:d+p-r/2,w:u,h:r}:N==="left"?{x:i-m-u,y:d-r/2,w:u,h:r}:{x:i+m,y:d-r/2,w:u,h:r},w=a.base?{...a.base,w:u,h:r}:y(h),_=a.flip?[h,sv[h]]:[h],v=N=>o.hard.every(O=>Po(N,O)>=Y.gap)&&o.soft.every(O=>Po(N,O)>=Y.label.soft)&&(o.touch??[]).every(O=>Po(N,O)>=Y.label.touch)&&(o.lines??[]).every(O=>!td(O,N,-2)),{search:$,searchMax:j}=Y.label;for(let N=0;N<=j;N+=$)for(const O of _){const T=O===h?w:y(O),C=O==="above"?[0,-1]:O==="below"?[0,1]:O==="left"?[-1,0]:[1,0],H=[Math.abs(C[1]),Math.abs(C[0])],ue=a.slide??(O==="above"||O==="below"?u:r*4);for(let Z=0;Z<=ue;Z+=$)for(const ie of Z===0?[1]:[1,-1]){const U={x:T.x+C[0]*N+H[0]*Z*ie,y:T.y+C[1]*N+H[1]*Z*ie,w:u,h:r};if(v(U))return{...U,step:a.step,event:a.event,text:a.text,family:ra(a.text).family,color:a.color}}}return{...w,step:a.step,event:a.event,text:a.text,family:ra(a.text).family,color:a.color}}function gg(a,o){let u=0,r=0;for(const i of a.steps)for(const d of i.events)d.type!=="strip"||d.field!==o||(d.value!==void 0&&(u=Math.max(u,Ye(d.value,jn(d.value)?pe.fieldValueJa:pe.fieldValue))),d.tag!==void 0&&(r=Math.max(r,Ye(d.tag,pe.tag)+Y.strip.tagPadX*2)));const f=u+(r>0?(u>0?Y.strip.tagGap:0)+r:0);return Math.max(Ye(o,pe.fieldName),f)}var Hu=a=>Math.max(Ye(a.title,pe.fieldName),a.states.length*Y.strip.trail.step);function lr(a,o){if(!a.strip)return 0;const{titleX:u,fieldGap:r,pad:f}=Y.strip,i=u+Ye(a.strip.title,pe.stripTitle)+r,d=[...a.strip.fields.map(h=>gg(a,h)),...o?[Hu(o)]:[]];return i+d.reduce((h,m)=>h+m+r,0)-r+f}function rr(a,o,u,r,f){if(!a.strip)return;const{titleX:i,fieldGap:d,pad:h,line:m,h:p}=Y.strip,y=i+Ye(a.strip.title,pe.stripTitle)+d,w=[];let _=y,v=0;const $=N=>{_>y&&_+N>r-h&&(_=y,v++);const O={x:o+_,y:u+v*m};return _+=N+d,O};for(const N of a.strip.fields){const O=gg(a,N);w.push({name:N,...$(O),w:O})}const j=f?{...f,...$(Hu(f)),w:Hu(f)}:void 0;return{x:o,y:u,w:r,h:p+v*m,title:a.strip.title,fields:w,...j?{trail:j}:{}}}function nd(a,o,u){const r=f=>{f.x+=o,f.y+=u};for(const f of a.boxes)r(f),f.cx+=o,f.cy+=u,f.slot&&r(f.slot),f.iconX!==void 0&&(f.iconX+=o);for(const f of a.regions)f.y+=u,r(f.header);for(const f of a.lifelines)f.x+=o,f.y1+=u,f.y2+=u;for(const f of a.edges)f.points=f.points.map(([i,d])=>[i+o,d+u]),f.settle&&(f.settle=[f.settle[0]+o,f.settle[1]+u]),f.wait&&(f.wait=[f.wait[0]+o,f.wait[1]+u]);for(const f of a.labels)r(f);for(const f of a.paths)f.points=f.points.map(([i,d])=>[i+o,d+u]),f.label&&r(f.label);for(const f of a.ends)f.x+=o,f.y+=u;a.side&&r(a.side);for(const f of a.actions)r(f);for(const f of a.badges)f.x+=o,f.y+=u;if(a.strip){a.strip.y+=u;for(const f of a.strip.fields)f.x+=o,f.y+=u;a.strip.trail&&(a.strip.trail.x+=o,a.strip.trail.y+=u)}}function ad(a,o,u){const{inset:r}=Y.badge;for(const i of a){const d=i.type==="swap"||i.type==="action"?i.box:void 0,h=u.boxes.find(m=>m.id===d);if(h)return{step:o,x:h.x,y:h.y,color:h.color}}if(u.strip&&a.some(i=>i.type==="strip"))return{step:o,x:u.strip.x+r,y:u.strip.y+r,color:"slate"};const f=u.boxes[0];return{step:o,x:f.x,y:f.y,color:f.color}}function ov(a){const o=iv(a),u=lv(a,o),r=o.map(()=>({top:0,bottom:0}));let f=bm(a,o,u,r);for(let i=0;i<3&&uv(f,o,u,r);i++)f=bm(a,o,u,r);return f}function iv(a){const o=a.regions??[],u=new Set(o.map(i=>i.id)),r=o.map(i=>({region:i,members:a.boxes.filter(d=>d.region===i.id).map(d=>d.id)})),f=a.boxes.filter(i=>i.region===void 0||!u.has(i.region)).map(i=>i.id);return f.length>0&&r.push({members:f}),r}var yg=a=>a==="left"||a==="right";function lv(a,o){const u=Y.architecture.columns,r=tr(a).map(d=>d.edge),f=new Map;o.forEach((d,h)=>{const m=new Set(d.members),p=new Set,y=(O,T)=>O>=0&&O<u&&!p.has(`${O},${T}`),w=(O,T)=>{const C=Math.min(u-1,Math.max(0,O));for(let H=T;;H++)for(let ue=0;ue<u;ue++)for(const Z of[C+ue,C-ue])if(y(Z,H))return[Z,H]},_=(O,T,C)=>{f.set(O,{group:h,col:T,row:C}),p.add(`${T},${C}`)};let v=1;const $=O=>{for(const T of r){const C=T.from===O?T.to:T.to===O?T.from:void 0;if(C===void 0||!m.has(C)||f.has(C))continue;const H=f.get(O),[ue,Z]=yg(T.labelSide)?w(H.col,H.row+1):y(H.col+v,H.row)?[H.col+v,H.row]:w(H.col+v,H.row);_(C,ue,Z),$(C)}},j=O=>{for(let T=0;T<r.length;T++){const C=r[T],H=C?.from===O?C.to:C?.to===O?C.from:void 0,ue=H===void 0?void 0:f.get(H);if(ue&&ue.group<h)return{order:T,col:ue.col}}};let N=0;for(;;){const O=d.members.filter(ie=>!f.has(ie));if(O.length===0)break;const T=O.map(ie=>({id:ie,anchor:j(ie)})).filter(ie=>ie.anchor!==void 0);T.sort((ie,U)=>(ie.anchor?.order??0)-(U.anchor?.order??0));const C=T[0]??{id:O[0],anchor:void 0},H=C.anchor?.col??0;N===0&&(v=H>=(u-1)/2?-1:1);const[ue,Z]=y(H,0)?[H,0]:w(H,0);_(C.id,ue,Z),$(C.id),N++}});const i=[...new Set([...f.values()].map(d=>d.col))].sort((d,h)=>d-h);for(const d of f.values())d.col=i.indexOf(d.col);return f}function rv(a){const o=[...a.matchAll(/ /g)].map(r=>r.index);if(o.length===0)return[a];const u=o.reduce((r,f)=>Math.abs(f-a.length/2)<Math.abs(r-a.length/2)?f:r);return[a.slice(0,u),a.slice(u+1)]}function cv(a){const{icon:o,nameY:u,line:r,inset:f}=Y.region,i=rv(a.name),d=Math.max(o,...i.map(m=>Ye(m,pe.regionName)),Ye(a.note??"",pe.regionNote)),h=u-f+(i.length-1)*r+(a.note?r:0)+Y.gap/2;return{w:d,h,lines:i}}function bm(a,o,u,r){const{box:f,region:i,architecture:d,margin:h,gap:m}=Y,p=nr(a),y=ig(a),w=tr(a),_=Math.max(1,...[...u.values()].map(S=>S.col+1)),v=rg(a),$=new Map(a.boxes.map(S=>[S.id,Math.max(ar(a,S.id,!0),cg(v.get(S.id),S.icon!==void 0,f.padX))])),j=Array.from({length:_},(S,F)=>Math.max(f.minW,...[...u].filter(([,ee])=>ee.col===F).map(([ee])=>$.get(ee)??f.minW))),N=Array.from({length:Math.max(0,_-1)},()=>d.columnGap);for(const{edge:S}of w){const F=u.get(S.from),ee=u.get(S.to);if(!F||!ee||S.label===void 0||F.group!==ee.group||F.row!==ee.row||Math.abs(F.col-ee.col)!==1||yg(S.labelSide))continue;const te=Ye(S.label,ra(S.label))+Y.label.padX*2+d.labelRoom*2,be=Math.min(F.col,ee.col);te<=d.maxColumnGap&&(N[be]=Math.max(N[be]??0,te))}const O=o.map(S=>S.region?cv(S.region):void 0),T=Math.max(0,...O.map(S=>S?S.w+i.inset*2:0)),C=[];for(let S=0;S<_;S++)C.push(S===0?h+(T>0?T:i.pad):C[S-1]+j[S-1]+N[S-1]);const H=S=>C[S]+j[S]/2,ue=new Set(w.filter(({edge:S})=>S.from===S.to).map(({edge:S})=>S.from)),Z=new Set([...ue].flatMap(S=>{const F=u.get(S);return F?[`${F.group}:${F.row}`]:[]})),ie=(S,F)=>Z.has(`${S}:${F}`)?ym:0,U=[],fe=[];let re=h;o.forEach((S,F)=>{const ee=Math.max(1,...S.members.map(pt=>(u.get(pt)?.row??0)+1)),te=r[F],be=re+i.pad+te.top,Ne=[0];for(let pt=1;pt<ee;pt++)Ne.push(Ne[pt-1]+f.h+d.rowGap+ie(F,pt-1));for(const pt of S.members){const Rt=u.get(pt),Jt=a.boxes.find(dn=>dn.id===pt),yt=$.get(pt)??f.minW,qt=H(Rt.col),Wt=be+Ne[Rt.row];U.push({id:pt,name:Jt?.name??pt,...Jt?.sub!==void 0?{sub:Jt.sub}:{},...Jt?.icon!==void 0?{icon:Jt.icon}:{},color:p.get(pt)??"slate",x:qt-yt/2,y:Wt,w:yt,h:f.h,cx:qt,cy:Wt+f.h/2})}const Oe=be+Ne[ee-1]+f.h+ie(F,ee-1),Et=O[F],nt=Math.max(Oe+i.pad+te.bottom-re,Et?Et.h+i.inset*2:0,S.region?i.minH:0);fe.push({group:F,y:re,h:nt,rows:ee}),re+=nt+i.gap});const Ee=re-i.gap;for(const S of U)ug(S,v.get(S.id));const R=new Map(U.map(S=>[S.id,S])),ge=S=>fe[u.get(S)?.group??0],we=(S,F,ee)=>{for(let te=1;te<S.length;te++){const[be,Ne]=S[te-1],[Oe,Et]=S[te];if(Math.min(be,Oe)<=F.x+F.w+ee&&Math.max(be,Oe)>=F.x-ee&&Math.min(Ne,Et)<=F.y+F.h+ee&&Math.max(Ne,Et)>=F.y-ee)return!0}return!1},ke=[...ue].flatMap(S=>{const F=R.get(S);return F?[{x:F.x,y:F.y+F.h,w:F.w,h:ym}]:[]}),E=S=>ke.some(F=>we(S,F,0)),z=(S,F,ee)=>U.some(te=>te.id!==F&&te.id!==ee&&we(S,te,Y.label.search))||E(S),K=S=>{const F=R.get(S),ee=ge(S),te=u.get(S),be=F.y+F.h+(te?ie(te.group,te.row):0);return(te?.row??0)<ee.rows-1?be+d.rowGap/2:Math.min(be+i.pad/2,ee.y+ee.h-Y.edge.inset)},P=S=>{const F=R.get(S),ee=ge(S);return(u.get(S)?.row??0)>0?F.y-d.rowGap/2:Math.max(F.y-i.pad/2,ee.y+Y.edge.inset)},he=Y.edge.inset,k=(S,F)=>F?C[S]+j[S]+(N[S]??d.columnGap)/2:C[S]-(N[S-1]??d.columnGap)/2,X=(S,F)=>{const ee=R.get(S),te=R.get(F);if(S===F)return fg(ee);const be=u.get(S),Ne=u.get(F);if(be.group===Ne.group&&be.row===Ne.row){const yt=te.cx>ee.cx,qt=[[yt?ee.x+ee.w:ee.x,ee.cy],[yt?te.x-he:te.x+te.w+he,te.cy]];if(!z(qt,S,F))return qt;const Wt=K(S),dn=[[ee.cx,ee.y+ee.h],[ee.cx,Wt],[te.cx,Wt],[te.cx,te.y+te.h+he]];if(!E(dn))return dn;const Ha=P(S),Mn=[[ee.cx,ee.y],[ee.cx,Ha],[te.cx,Ha],[te.cx,te.y-he]];return E(Mn)?dn:Mn}const Oe=te.cy>ee.cy,Et=[ee.cx,Oe?ee.y+ee.h:ee.y],nt=[te.cx,Oe?te.y-he:te.y+te.h+he];if(be.col===Ne.col){const yt=[Et,nt];if(!z(yt,S,F))return yt;const qt=k(be.col,!0);return[[ee.x+ee.w,ee.cy],[qt,ee.cy],[qt,te.cy],[te.x+te.w+he,te.cy]]}const pt=te.cx>ee.cx,Rt=Oe?K(S):P(S),Jt=[[Et,[ee.cx,te.cy],[pt?te.x-he:te.x+te.w+he,te.cy]],[[pt?ee.x+ee.w:ee.x,ee.cy],[te.cx,ee.cy],nt],[Et,[ee.cx,Rt],[te.cx,Rt],nt]];if(ue.has(S)||ue.has(F)){const yt=k(be.col,pt),qt=k(Ne.col,!pt),Wt=[[pt?ee.x+ee.w:ee.x,ee.cy],[yt,ee.cy]],dn=[pt?te.x-he:te.x+te.w+he,te.cy];Jt.push([...Wt,[yt,te.cy],dn],[...Wt,[yt,Rt],[te.cx,Rt],nt],[Et,[ee.cx,Rt],[qt,Rt],[qt,te.cy],dn],[...Wt,[yt,Rt],[qt,Rt],[qt,te.cy],dn])}return Jt.find(yt=>!z(yt,S,F))??Jt[2]},ce=w.map(({step:S,event:F,edge:ee})=>({step:S,event:F,from:ee.from,to:ee.to,points:X(ee.from,ee.to),color:ed(ee,p),carry:ee.carry}));dg(ce,R,v);const ve=new Map;for(const S of ce){if(S.points.length!==2||!ce.some(Oe=>Oe.from===S.to&&Oe.to===S.from&&Oe.points.length===2))continue;const[ee,te]=S.points,be=Math.abs(te[1]-ee[1])<Math.abs(te[0]-ee[0]),Ne=(S.from<S.to?1:-1)*Y.edge.parallel;S.points=S.points.map(([Oe,Et])=>be?[Oe,Et+Ne]:[Oe+Ne,Et]),ve.set(S,be?Ne>0?"below":"above":Ne>0?"right":"left")}const Se=[];o.forEach((S,F)=>{const ee=fe[F],te=O[F];!S.region||!te||Se.push({id:S.region.id,lines:te.lines,...S.region.note!==void 0?{note:S.region.note}:{},...S.region.icon!==void 0?{icon:S.region.icon}:{},color:y.get(S.region.id)??"slate",x:h,y:ee.y,w:0,h:ee.h,header:{x:h+i.inset,y:ee.y+i.inset,w:te.w,h:te.h}})});const _e=(S,F,ee)=>S.from===S.to?hg(S.points):or(S.points,F,ee),Me=Ks(ce,a.steps.length,_e),Ge=[];for(const S of ce){const F=a.steps[S.step]?.events[S.event];if(F?.type!=="edge"||F.label===void 0)continue;const ee=[...Me].filter(([Oe])=>Oe<=S.step).map(([,Oe])=>us(Oe.point)),te=[...Se.map(Oe=>Oe.header),...Ge.filter(Oe=>Oe.step===S.step)],be=F.labelSide??ve.get(S),Ne=S.from===S.to?{side:"below",base:pg(S.points,Ye(F.label,ra(F.label))+Y.label.padX*2)}:void 0;Ge.push(oi({step:S.step,event:S.event,text:F.label,points:S.points,color:S.color,...Ne??(be?{side:be}:{flip:!0})},{hard:U,soft:te,touch:ee}))}const L={kind:"architecture",width:0,height:0,regions:Se,boxes:U,lifelines:[],edges:ce,labels:Ge,actions:[],badges:[],paths:[],ends:[]},G=Ge.length>0?Math.max(0,h+Y.label.soft-Math.min(...Ge.map(S=>S.x))):0;G>0&&nd(L,G,0);const A=Math.max(...U.map(S=>S.x+S.w+i.pad),...Ge.map(S=>S.x+S.w+Y.label.soft),...ce.flatMap(S=>S.points.map(F=>F[0]+i.pad))),W=Math.max(A+h,lr(a)+h*2);for(const S of Se)S.w=W-h*2;const ae=Math.max(Ee,...Ge.map(S=>S.y+S.h)),se=rr(a,h,ae+m,W-h*2);L.width=W,L.height=(se?se.y+se.h:ae)+h,se&&(L.strip=se);const xe=Ks(ce,a.steps.length,_e);return L.badges=ir(a.steps.map((S,F)=>{const ee=xe.get(F);return ee?{step:F,x:ee.point[0],y:ee.point[1],color:ee.edge.color}:ad(S.events,F,L)})),L}function uv(a,o,u,r){let f=!1;const i=Y.label.soft;for(const d of a.labels){const h=a.edges.find($=>$.step===d.step&&$.event===d.event),m=h&&u.get(h.from),p=h&&u.get(h.to);if(!m||!p||m.group!==p.group||!o[m.group]?.region)continue;const y=a.regions.find($=>$.id===o[m.group]?.region?.id),w=r[m.group];if(!y||!w)continue;const _=y.y+i-d.y,v=d.y+d.h-(y.y+y.h-i);_>0&&(w.top+=_,f=!0),v>0&&(w.bottom+=v,f=!0)}return f}var dv=a=>a.kind==="git";function fv(a){const o=(a.git?.branches??[]).map(U=>U.id),u=U=>{o.includes(U)||o.push(U)};for(const U of a.steps)for(const fe of U.events)(fe.type==="commit"||fe.type==="branch")&&u(fe.branch);const r=new Map(o.map(U=>[U,null]));let f=null,i=null;const d=[],h=new Map,m=[],p=[],y=[],w=new Map,_=new Map,v=new Map,$=[...o,Gn],j=new Map($.map(U=>[U,[]])),N=[],O=U=>U===Gn?i===null?f:null:r.get(U)??null,T=U=>{const fe=w.get(U)??[],re=fe.indexOf(null);return re<0?fe.length:re},C=(U,fe,re,Ee)=>{const R=new Map($.map(E=>[E,O(E)])),ge=f;re();const ke=$.filter(E=>R.get(E)!==O(E)).map(E=>{const z=v.get(E);return z&&(w.get(z.commit)[z.row]=null,v.delete(E)),{ref:E,slot:z}});for(const{ref:E,slot:z}of ke){const K=z??(E===Gn&&ge!==null?{commit:ge,row:T(ge)}:void 0),P=O(E);let he;if(P!==null){he={commit:P,row:T(P)};const k=w.get(P)??[];k[he.row]=E,w.set(P,k),_.set(P,Math.max(_.get(P)??0,k.filter(X=>X!==null).length)),v.set(E,he)}p.push({ref:E,step:U,event:fe,...K?{from:K}:{},...he?{to:he}:{},line:E===Ee})}},H=(U,fe)=>{const re=new Set,Ee=[...r.values(),f].filter(R=>R!==null);for(;Ee.length>0;){const R=Ee.pop();re.has(R)||(re.add(R),Ee.push(...h.get(R)?.parents??[]))}for(const R of d)!re.has(R.id)&&R.orphan===void 0&&(R.orphan={step:U,event:fe})};a.steps.forEach((U,fe)=>{U.events.forEach((re,Ee)=>{if(re.type==="commit")Z(re,fe,Ee);else if(re.type==="branch"){if(!h.has(re.from))return;ue(re.from)!==re.branch&&m.push({kind:"branch",from:re.from,to:re.branch,step:fe,event:Ee}),C(fe,Ee,()=>{r.set(re.branch,re.from),i=re.branch,f=re.from})}else if(re.type==="edge"){const R=re.from;if(R!==Gn&&!r.has(R)||!h.has(re.to))return;C(fe,Ee,()=>{if(R===Gn){i=null,f=re.to;return}r.set(R,re.to),i===R?f=re.to:i===null&&f===re.to&&(i=R)},R)}else return;H(fe,Ee)});for(const re of $)j.get(re)?.push(re===Gn?f:r.get(re)??null);N.push(i);for(const re of $){const Ee=v.get(re);Ee&&y.push({ref:re,step:fe,slot:Ee})}});function ue(U){return h.get(U)?.branch}function Z(U,fe,re){if(h.has(U.id))return;const Ee=U.copy!==void 0&&h.has(U.copy)?U.copy:void 0,R=Ee!==void 0&&i===null&&f!==null?f:r.get(U.branch)??null,ge=U.merge!==void 0&&U.merge!==U.branch?r.get(U.merge)??void 0:void 0,we=[...new Set([R,ge].filter(z=>z!=null))],ke={id:U.id,branch:U.branch,parents:we,...ge!==void 0&&ge!==R?{joined:ge}:{},...Ee!==void 0?{copy:Ee}:{},...U.hash!==void 0?{hash:U.hash}:{},...U.note!==void 0?{note:U.note}:{},step:fe,event:re};d.push(ke),h.set(ke.id,ke);for(const z of we)m.push({kind:"parent",from:z,to:ke.id,step:fe,event:re});Ee!==void 0&&m.push({kind:"copy",from:Ee,to:ke.id,step:fe,event:re});const E=i===null&&f===null;C(fe,re,()=>{Ee===void 0?(r.set(U.branch,ke.id),i===U.branch&&(f=ke.id)):i===null&&(f=ke.id),E&&(i=U.branch,f=ke.id)})}const ie=$.map(U=>({name:U,at:j.get(U)??[],...U===Gn?{attached:N}:{}}));return{branches:o,made:d,links:m,moves:p,refs:ie,tags:y,rows:_}}function Vl(a,o,u,r){const f=Y.git.samples;return Array.from({length:f},(i,d)=>{const h=(d+1)/f,m=1-h,p=y=>m*m*m*a[y]+3*m*m*h*o[y]+3*m*h*h*u[y]+h*h*h*r[y];return[p(0),p(1)]})}function hv(a,o){return Math.abs(a[1]-o[1])<.5?[a,o]:a[1]>o[1]?[a,[a[0],o[1]],o]:[a,[o[0],a[1]],o]}function vm(a,o,u){const r=u>a.cy?1:-1,f=[a.cx,a.cy+r*a.r],i=Math.max(0,Math.min(Y.git.turn,o-a.cx)),d=[a.cx+i,u],h=Vl(f,[f[0],f[1]+(u-f[1])*.7],[a.cx+i*.2,u],d);return[f,...h,...o>d[0]?[[o,u]]:[]]}function pv(a,o){const u=o.cy<a.cy?1:-1,r=[a.cx+a.r,a.cy],f=[o.cx,o.cy+u*o.r],i=Math.max(0,Math.min(Y.git.turn,o.cx-r[0])),d=[o.cx-i,a.cy],h=Vl(d,[o.cx-i*.2,a.cy],[o.cx,f[1]+(a.cy-f[1])*.7],f);return[r,...d[0]>r[0]?[d]:[],...h]}function mv(a,o){if(Math.abs(a.cy-o.cy)<.5){const d=a.cy-a.r,h=Y.git.turn*.7;return[[a.cx,d],...Vl([a.cx,d],[a.cx,d-h],[o.cx,d-h],[o.cx,d])]}const u=o.cy<a.cy?-1:1,r=[a.cx,a.cy+u*a.r],f=[o.cx,o.cy-u*o.r],i=(f[1]-r[1])*.5;return[r,...Vl(r,[r[0],r[1]+i],[f[0],f[1]-i],f)]}function gv(a){const{margin:o,gap:u,box:r,region:f,git:i,carrier:d}=Y,h=fv(a),m=new Map((a.git?.branches??[]).map(A=>[A.id,A.note])),p=new Map(h.branches.map((A,W)=>[A,W])),y=A=>i.colors[(p.get(A)??0)%i.colors.length],w=new Map,_=new Map;for(const A of h.made){const W=Math.max(0,...A.parents.map(ae=>(w.get(ae)??-1)+1),(_.get(A.branch)??-1)+1);w.set(A.id,W),_.set(A.branch,W)}const v=A=>[...A.hash!==void 0?[{text:A.hash,style:pe.gitHash}]:[],...A.note!==void 0?[{text:A.note,style:pe.gitNote}]:[]],$=A=>Math.max(0,...v(A).map(W=>Ye(W.text,W.style))),j=A=>Ye(A,jn(A)?pe.carrierJa:pe.carrier)+d.tagPadX*2,N=Math.max(0,...h.refs.map(A=>j(A.name))),O=Math.max(i.pitch,...h.made.map(A=>$(A)+i.textGap),N+i.textGap),T=h.branches.map(A=>({w:Math.max(f.icon,Ye(A,pe.regionName),Ye(m.get(A)??"",pe.regionNote))})),C=o+f.inset+Math.max(0,...T.map(A=>A.w)),H=Math.max(i.r,...h.made.filter(A=>w.get(A.id)===0&&p.get(A.branch)===0).map(A=>$(A)/2),N/2),ue=Math.max(i.x0,C+u+H),Z=new Set(h.moves.flatMap(A=>{const W=a.steps[A.step]?.events[A.event];return A.line&&A.to&&W?.type==="edge"&&W.label!==void 0?[h.made.find(ae=>ae.id===A.to?.commit)?.branch??""]:[]})),ie=A=>Math.max(0,...h.made.filter(W=>W.branch===A).map(W=>(h.rows.get(W.id)??0)-2))*i.row,U=h.made.some(A=>p.get(A.branch)===0&&v(A).length>0),fe=[];let re=o;h.branches.forEach((A,W)=>{const ae=W===0,se=ae&&U?i.tagTop:i.tag,xe=re+(ae?i.topLine-(i.tagTop-se):i.line)+ie(A),S=xe-re+(ae?i.topBelow:Z.has(A)?i.below:i.bare);fe.push({id:A,x:o,y:re,w:0,h:S,line:xe,color:y(A),tagBase:se}),re+=S+f.gap});const Ee=re-f.gap,R=new Map(fe.map(A=>[A.id,A])),ge=h.made.map(A=>{const W=R.get(A.branch),ae=p.get(A.branch)===0,se=ue+O*(w.get(A.id)??0)+(ae?0:O/2),xe=W.line,S=v(A),F=S.map((Ne,Oe)=>ae?xe-i.above-(S.length-1-Oe)*i.lineStep:xe+i.under+Oe*i.lineStep),ee=S.map((Ne,Oe)=>ri(Ne.text,se,F[Oe],Ne.style,"middle")),te=ee.length===0?void 0:{...yv(ee),lines:S.map(Ne=>Ne.text),baselines:F},be=A.copy!==void 0?y(h.made.find(Ne=>Ne.id===A.copy)?.branch??A.branch):y(A.branch);return{id:A.id,branch:A.branch,color:be,cx:se,cy:xe,r:i.r,step:A.step,event:A.event,parents:A.parents,...A.copy!==void 0?{copy:A.copy}:{},...A.hash!==void 0?{hash:A.hash}:{},...A.note!==void 0?{note:A.note}:{},...te?{text:te}:{},...A.orphan?{orphan:A.orphan.step,orphanEvent:A.orphan.event}:{}}}),we=new Map(ge.map(A=>[A.id,A])),ke=h.links.flatMap(A=>{const W=we.get(A.from);if(!W)return[];if(A.kind==="branch"){if(!h.made.some(F=>F.branch===A.to))return[];const S=R.get(A.to);return[{...A,points:vm(W,W.cx+i.turn,S.line),color:y(A.to)}]}const ae=we.get(A.to),se=h.made.find(S=>S.id===A.to);let xe;return A.kind==="copy"?xe=mv(W,ae):Math.abs(W.cy-ae.cy)<.5?xe=[[W.cx+W.r,W.cy],[ae.cx-ae.r,ae.cy]]:se?.joined===A.from?xe=pv(W,ae):xe=vm(W,ae.cx-ae.r,ae.cy),[{...A,points:xe,color:ae.color}]}),E=(A,W)=>{const ae=we.get(W.commit),se=R.get(ae.branch)?.tagBase??i.tag,xe=j(A);return{x:ae.cx-xe/2,y:ae.cy-se-W.row*i.row-d.tagH/2,w:xe,h:d.tagH}},z=A=>[A.x+A.w/2,A.y+A.h/2],K=h.moves.map(A=>{const W=A.from?E(A.ref,A.from):void 0,ae=A.to?E(A.ref,A.to):void 0,se=a.steps[A.step]?.events[A.event],xe=A.line&&se?.type==="edge"&&se.carry.kind!=="none"&&!(se.carry.kind==="tag"&&se.carry.text===se.from);return{ref:A.ref,step:A.step,event:A.event,...W?{from:W}:{},...ae?{to:ae}:{},...A.to?{target:A.to.commit}:{},...xe?{carried:!0}:{},...A.line&&W&&ae?{line:hv(z(W),z(ae))}:{},color:"slate"}}),P=h.tags.map(A=>({...E(A.ref,A.slot),ref:A.ref,step:A.step})),he=nr(a),k=Math.max(ue,...ge.flatMap(A=>[A.cx+A.r,...A.text?[A.text.x+A.text.w]:[]]),...P.map(A=>A.x+A.w),...K.flatMap(A=>[A.from,A.to].flatMap(W=>W?[W.x+W.w]:[]))),X=k+i.boxGap,ce=(fe[1]??fe[0])?.line??o+r.h/2,ve=a.boxes.map((A,W)=>{const ae=ar(a,A.id,!0),se=ce+W*(r.h+u);return{id:A.id,name:A.name,...A.sub!==void 0?{sub:A.sub}:{},...A.icon!==void 0?{icon:A.icon}:{},color:he.get(A.id)??"slate",x:X,y:se-r.h/2,w:ae,h:r.h,cx:X+ae/2,cy:se}}),Se=fe.map((A,W)=>{const ae=m.get(A.id);return{id:A.id,lines:[A.id],...ae!==void 0?{note:ae}:{},icon:"branch",color:A.color,x:A.x,y:A.y,w:0,h:A.h,header:{x:A.x+f.inset,y:A.y+f.inset,w:T[W]?.w??0,h:f.nameY-f.inset+(ae!==void 0?f.line:0)+u/2}}}),_e={kind:"git",width:0,height:0,regions:Se,boxes:ve,lifelines:[],edges:[],labels:[],actions:[],badges:[],paths:[],ends:[],lanes:fe,commits:ge,links:ke,tags:P,refs:h.refs,moves:K};_e.badges=wm(a,_e),_e.labels=xv(a,_e);const Me=Math.max(k,...ve.map(A=>A.x+A.w),..._e.labels.map(A=>A.x+A.w))+f.pad,Ge=Math.max(Me+o,lr(a)+o*2);for(const A of Se)A.w=Ge-o*2;for(const A of fe)A.w=Ge-o*2;const L=Math.max(Ee,...ve.map(A=>A.y+A.h),..._e.labels.map(A=>A.y+A.h)),G=rr(a,o,L+u,Ge-o*2);return _e.width=Ge,_e.height=(G?G.y+G.h:L)+o,G&&(_e.strip=G),_e.badges=wm(a,_e),_e}function yv(a){const o=Math.min(...a.map(r=>r.x)),u=Math.min(...a.map(r=>r.y));return{x:o,y:u,w:Math.max(...a.map(r=>r.x+r.w))-o,h:Math.max(...a.map(r=>r.y+r.h))-u}}function bv(a,o){return[...a.links.filter(r=>r.step===o&&r.kind!=="copy").map(r=>({event:r.event,points:r.points,color:r.color})),...a.moves.flatMap(r=>{const f=a.commits.find(i=>i.id===r.target);return r.step===o&&r.line&&f?[{event:r.event,target:f,color:f.color}]:[]})].sort((r,f)=>r.event-f.event)[0]}function xm(a,o,u){const{r,inset:f}=Y.badge,i=a.r+f+r,d=r*2+f;return[[a.cx+i,a.cy],[a.cx,a.cy+i],[a.cx-i,a.cy],[a.cx,a.cy-i]].find(m=>o.every(([p,y])=>Math.hypot(m[0]-p,m[1]-y)>=d)&&u.every(p=>Po(us(m),p)>=Y.label.touch))}function vv(a,o,u){const{r,inset:f,along:i,short:d}=Y.badge,h=sr(a),m=h<d?Math.min(r+1,h/2):i,p=r*2+f;for(let y=m;y<=h;y+=1){const w=ls(a,y),_=us(w);if(o.every(([v,$])=>Math.hypot(w[0]-v,w[1]-$)>=p)&&u.every(v=>Po(_,v)>=Y.label.touch))return w}}function wm(a,o){const{inset:u}=Y.badge,r=[],f=[...o.links.map(h=>h.points),...o.moves.flatMap(h=>h.line?[h.line]:[])],i=[],d=[...o.tags,...o.commits.flatMap(h=>[{x:h.cx-h.r,y:h.cy-h.r,w:h.r*2,h:h.r*2},...h.text?[h.text]:[]])];return a.steps.forEach((h,m)=>{const p=bv(o,m),y=p?.target?xm(p.target,r,d):void 0;if(p&&(p.points||y)){const N=p.points,O=y??(N?vv(N,r,d)??or(N,r,f.filter(T=>T!==N)):[0,0]);r.push(O),i.push({step:m,x:O[0],y:O[1],color:p.color});return}const w=h.events.flatMap(N=>N.type==="swap"||N.type==="action"?[N.box]:[]).map(N=>o.boxes.find(O=>O.id===N))[0];if(w){i.push({step:m,x:w.x,y:w.y,color:w.color});return}if(o.strip&&h.events.some(N=>N.type==="strip")){i.push({step:m,x:o.strip.x+u,y:o.strip.y+u,color:"slate"});return}const _=o.commits.find(N=>N.id===o.refs[0]?.at[m]),v=_?xm(_,r,d):void 0;if(_&&v){r.push(v),i.push({step:m,x:v[0],y:v[1],color:_.color});return}const $=i[i.length-1],j=o.lanes[0];i.push($?{...$,step:m}:{step:m,x:(j?.x??0)+(j?.w??0)-u-Y.badge.r,y:(j?.y??0)+u+Y.badge.r,color:j?.color??"slate"})}),ir(i)}function xv(a,o){const u=Y.git,r=[],f=o.commits.map(h=>({x:h.cx-h.r,y:h.cy-h.r,w:h.r*2,h:h.r*2})),i=o.commits.flatMap(h=>h.text?[h.text]:[]),d=o.regions.map(h=>h.header);for(const h of o.moves){const m=a.steps[h.step]?.events[h.event];if(m?.type!=="edge"||m.label===void 0||!h.line)continue;const p=o.commits.find(T=>T.id===m.to);if(!p)continue;const y=o.lanes[0]?.id===p.branch,w=Ye(m.label,jn(m.label)?pe.labelJa:pe.label)+Y.label.padX*2,[_]=h.line.reduce((T,C)=>[T[0]+C[0]/h.line.length,0],[0,0]),v=Math.max(0,...o.tags.filter(T=>T.step===h.step&&Math.abs(T.x+T.w/2-p.cx)<.5).map(T=>p.cy-T.y)),$=m.labelSide??(y?"above":"below"),j=m.labelSide!==void 0?void 0:y?{x:_-w/2,y:p.cy-Math.max(v,(o.lanes[0]?.tagBase??u.tag)+Y.carrier.tagH/2)-Y.label.soft-Y.label.h}:{x:_-w/2,y:p.cy+u.labelUnder},N=o.badges.filter(T=>T.step<=h.step).map(T=>us([T.x,T.y])),O=o.tags.filter(T=>T.step===h.step);r.push(oi({step:h.step,event:h.event,text:m.label,points:h.line,color:h.color,side:$,...j?{base:j}:{}},{hard:[...f,...o.boxes],soft:[...i,...O,...d,...r.filter(T=>T.step===h.step)],touch:N}))}return r}function wv(a){const{box:o,sequence:u,label:r,margin:f,gap:i}=Y,d=nr(a),h=a.sequence?.lifelines??[],m=[...h,...a.boxes.map(E=>E.id).filter(E=>!h.includes(E))],p=new Map(m.map((E,z)=>[E,z])),y=m.map(E=>ar(a,E,!1)),w=y.slice(1).map((E,z)=>y[z]/2+E/2+u.columnGap),_=[];for(const E of a.steps)for(const z of E.events){if(z.type!=="edge"||z.label===void 0)continue;const K=p.get(z.from)??0,P=p.get(z.to)??0,he=Ye(z.label,ra(z.label))+r.padX*2;K===P?K<w.length&&_.push({from:K,to:K+1,need:u.selfW+r.side+he+u.labelRoom}):_.push({from:Math.min(K,P),to:Math.max(K,P),need:he+u.labelRoom*2})}_.sort((E,z)=>E.to-E.from-(z.to-z.from));for(const{from:E,to:z,need:K}of _){let P=0;for(let k=E;k<z;k++)P+=w[k]??0;if(P>=K)continue;const he=(K-P)/(z-E);for(let k=E;k<z;k++)w[k]=(w[k]??0)+he}const v=[];m.forEach((E,z)=>v.push(z===0?f+y[0]/2:v[z-1]+w[z-1]));const $=m.map((E,z)=>{const K=a.boxes.find(k=>k.id===E),P=y[z],he=v[z];return{id:E,name:K?.name??E,...K?.sub!==void 0?{sub:K.sub}:{},...K?.icon!==void 0?{icon:K.icon}:{},color:d.get(E)??"slate",x:he-P/2,y:f,w:P,h:o.h,cx:he,cy:f+o.h/2}}),j=f+o.h,N=[],O=[],T=[];let C=j+u.firstRow,H=0,ue=!0;a.steps.forEach((E,z)=>{E.events.forEach((K,P)=>{if(K.type!=="edge"&&K.type!=="action")return;let he,k;if(K.type==="edge"){const X=K.labelSide??"above",ce=K.from===K.to,ve=K.label!==void 0;he=ve&&X==="above"?u.labelOffset+r.h/2:i,k=ce?u.selfH+i:ve&&X==="below"?u.labelOffset+r.h/2:i}else he=Y.action.h/2,k=Y.action.h/2;if(C=ue?C+he:C+Math.max(u.minPitch,H+u.rowGap+he)+(P===0&&z>0?u.stepGap:0),ue=!1,H=k,K.type==="edge"){const X=v[p.get(K.from)??0],ce=v[p.get(K.to)??0],ve=Math.sign(ce-X)||1,Se=X===ce?[[X,C],[X+u.selfW,C],[X+u.selfW,C+u.selfH],[X+Y.edge.inset,C+u.selfH]]:[[X,C],[ce-ve*Y.edge.inset,C]],_e=ed(K,d),Me={};if(K.carry.kind!=="none"){const Ge=Y.slot.lifeline+si(K.carry)[0],[L,G]=Se,[A,W]=Se.slice(-2),ae=Math.sign(G[0]-L[0])||1,se=Math.sign(W[0]-A[0])||-1;Me.wait=[X-ae*Ge,L[1]],Me.settle=[ce+se*Ge,W[1]]}N.push({step:z,event:P,from:K.from,to:K.to,points:Se,color:_e,carry:K.carry,...Me}),K.label!==void 0&&T.push({step:z,event:P,text:K.label,points:Se,color:_e,...K.labelSide?{side:K.labelSide}:X===ce?{side:"right"}:{},offset:u.labelOffset})}else{const X=v[p.get(K.box)??0],ce=Ye(K.label,pe.action)+Y.action.padX*2;O.push({step:z,event:P,box:K.box,text:K.label,color:d.get(K.box)??"slate",x:X+Y.badge.r+4,y:C-Y.action.h/2,w:ce,h:Y.action.h})}})});const Z=(ue?j:C+H)+u.tail,ie=m.map((E,z)=>({id:E,x:v[z],y1:j,y2:Z})),U=Ks(N,a.steps.length),fe=[];for(const E of T){const z=[...U].filter(([P])=>P<=E.step).map(([,P])=>us(P.point)),K=[...fe.filter(P=>P.step===E.step),...O];fe.push(oi(E,{hard:$,soft:K,touch:z}))}const re={kind:"sequence",width:0,height:0,regions:[],boxes:$,lifelines:ie,edges:N,labels:fe,actions:O,badges:[],paths:[],ends:[]},Ee=[...$.map(E=>E.x),...fe.map(E=>E.x),...O.map(E=>E.x)],R=Math.max(0,f-Math.min(...Ee));R>0&&nd(re,R,0);const ge=[...$.map(E=>E.x+E.w),...fe.map(E=>E.x+E.w),...O.map(E=>E.x+E.w),...N.flatMap(E=>E.points.map(z=>z[0]))],we=Math.max(Math.max(...ge)+f,lr(a)+f*2),ke=rr(a,f,Z+i,we-f*2);return re.width=we,re.height=(ke?ke.y+ke.h:Z)+f,ke&&(re.strip=ke),re.badges=Sv(a,re),re}function Sv(a,o){const u=Ks(o.edges,a.steps.length),r=a.steps.map((f,i)=>{const d=u.get(i);if(d)return{step:i,x:d.point[0],y:d.point[1],color:d.edge.color};const h=o.actions.find(p=>p.step===i),m=h&&o.lifelines.find(p=>p.id===h.box);return h&&m?{step:i,x:m.x,y:h.y+h.h/2,color:h.color}:ad(f.events,i,o)});return ir(r)}var bg=a=>ei.includes(a);function Av(a){const o=[],u=r=>{!bg(r)&&!o.includes(r)&&o.push(r)};for(const{edge:r}of tr(a))u(r.from),u(r.to);return o}var Ev=(a,o)=>a.from===o.from&&a.to===o.to;function _v(a,o){const{box:u,state:r,margin:f,gap:i}=Y,d=Y.edge.inset,h=li[o],m=nr(a),p=tr(a),y=Av(a),w=a.boxes.map(D=>D.id).filter(D=>!y.includes(D)),_=(a.state?.paths??[]).filter(D=>!p.some(({edge:ne})=>Ev(ne,D))),v=[...p.map(({edge:D})=>D),..._],$=r.ghost,j=D=>{const ne=a.boxes.find(me=>me.id===D);return $.pad*2+u.icon+$.gap+Math.max(Ye(ne?.name??D,pe.boxName),Ye(ne?.sub??"",pe.boxSub))},N=rg(a),O=Math.max(u.padX,r.done.inset+r.done.r+Y.slot.clear),T=new Map(a.boxes.map(D=>[D.id,w.includes(D.id)?j(D.id):Math.max(ar(a,D.id,!0),cg(N.get(D.id),D.icon!==void 0,O))])),C=Math.max(1,Math.min(r.columns,y.length)),H=Math.max(1,Math.ceil(y.length/r.columns)),ue=new Map(y.map((D,ne)=>{const me=Math.floor(ne/r.columns),ze=ne%r.columns;return[D,{row:me,col:me%2===0?ze:C-1-ze}]})),Z=Array.from({length:C},(D,ne)=>Math.max(u.minW,...y.filter(me=>ue.get(me)?.col===ne).map(me=>T.get(me)??u.minW))),ie=Array.from({length:Math.max(0,C-1)},()=>r.columnGap);for(const D of v){const ne=ue.get(D.from),me=ue.get(D.to);if(!ne||!me||D.label===void 0||ne.row!==me.row||Math.abs(ne.col-me.col)!==1)continue;const ze=Math.min(ne.col,me.col);ie[ze]=Math.max(ie[ze]??0,Ye(D.label,ra(D.label))+Y.label.padX*2+r.labelRoom*2)}const U=[];for(let D=0;D<C;D++)U.push(D===0?f:U[D-1]+Z[D-1]+ie[D-1]);const fe=D=>U[D]+Z[D]/2,re=D=>w.includes(D),Ee=new Set(_.filter(D=>re(D.to)&&!re(D.from)&&!bg(D.from)).map(D=>D.from)),R=[h.sideNote,...Ee.size>0?[h.sideFrom(Ee.size)]:[]],ge=Math.max(Ye(h.side,pe.regionName),...R.map(D=>Ye(D,pe.regionNote))),we=r.side.pad*2+Math.max($.h,pe.regionName.size+Y.region.line*R.length+r.side.pad/4),ke=v.some(D=>D.from==="start"),E=f+(w.length>0?we+r.side.gap:ke?r.start+r.drop:0),z=D=>E+D*(u.h+r.rowGap),K=(D,ne,me,ze)=>{const je=a.boxes.find(at=>at.id===D),Re=T.get(D)??u.minW,_t=ze?$.h:u.h;return{id:D,name:je?.name??D,...je?.sub!==void 0?{sub:je.sub}:{},...je?.icon!==void 0?{icon:je.icon}:{},color:m.get(D)??"slate",x:ne-Re/2,y:me,w:Re,h:_t,cx:ne,cy:me+_t/2,...ze?{ghost:!0}:{}}},P=y.map(D=>{const ne=ue.get(D);return K(D,fe(ne.col),z(ne.row),!1)});for(const D of P)ug(D,N.get(D.id),O);const he=new Map(P.map(D=>[D.id,D])),k=D=>P.some(ne=>ne!==D&&Math.abs(ne.cx-D.cx)<.5&&ne.y>D.y),X=[],ce=P[0],ve=Math.max(...P.map(D=>D.x+D.w));let Se;const _e=f+we+r.side.lane;if(w.length>0){const D=at=>_.filter(bt=>bt.to===at).flatMap(bt=>he.get(bt.from)??[]),ne=w.flatMap(D),me=Math.max(f,Math.min(...ne.length>0?ne.map(at=>at.x):[f+r.side.pad])-r.side.pad);let ze=me+r.side.pad+ge+i*2;const je=w.map(at=>{const bt=D(at);return{id:at,cx:bt.length>0?bt.reduce((Bn,zn)=>Bn+zn.cx,0)/bt.length:ze}});je.sort((at,bt)=>at.cx-bt.cx);let Re=me;for(const{id:at,cx:bt}of je){const Bn=T.get(at)??u.minW,zn=Math.max(bt-Bn/2,ze),fn=K(at,zn+Bn/2,f+(we-$.h)/2,!0);P.push(fn),he.set(at,fn);const ua=_.some(di=>di.from===at&&di.to==="finish");ua&&X.push({kind:"finish",x:fn.x+fn.w+r.beside,y:fn.cy,r:r.end.r,ghost:!0,text:"",box:at}),Re=ua?fn.x+fn.w+r.beside+r.end.r:fn.x+fn.w,ze=Re+i*2}const _t=Math.max(Re+r.side.pad,ve);Se={x:me,y:f,w:_t-me,h:we,title:h.side,notes:R}}if(ce&&ke){const D=ce.cx+r.start+r.text+Ye(h.start,pe.regionNote)+i,ne=Se&&D<Se.x?Se.y+r.side.pad+r.start:ce.y-r.drop;X.unshift({kind:"start",x:ce.cx,y:ne,r:r.start,ghost:!1,text:h.start})}for(const D of P.filter(ne=>!ne.ghost&&v.some(me=>me.from===ne.id&&me.to==="finish")))X.push(k(D)?{kind:"finish",x:D.x+D.w+r.beside,y:D.cy,r:r.end.r,ghost:!1,text:h.end,box:D.id}:{kind:"finish",x:D.cx,y:D.y+D.h+r.below,r:r.end.r,ghost:!1,text:h.end,box:D.id});const Me=(D,ne)=>{const me=ue.get(D.id),ze=ue.get(ne.id);if(!me||!ze)return[[D.cx,D.y+D.h],[ne.cx,ne.y-d]];if(me.row===ze.row&&Math.abs(me.col-ze.col)===1)return ne.cx>D.cx?[[D.x+D.w,D.cy],[ne.x-d,ne.cy]]:[[D.x,D.cy],[ne.x+ne.w+d,ne.cy]];if(me.row===ze.row){const Re=D.y+D.h+r.rowGap/4;return[[D.cx,D.y+D.h],[D.cx,Re],[ne.cx,Re],[ne.cx,ne.y+ne.h+d]]}if(ze.row>me.row){if(Math.abs(D.cx-ne.cx)<.5)return[[D.cx,D.y+D.h],[ne.cx,ne.y-d]];const Re=D.y+D.h+r.rowGap/2;return[[D.cx,D.y+D.h],[D.cx,Re],[ne.cx,Re],[ne.cx,ne.y-d]]}if(Math.abs(D.cx-ne.cx)<.5)return[[D.cx,D.y],[ne.cx,ne.y+ne.h+d]];const je=ne.y+ne.h+r.rowGap/2;return[[D.cx,D.y],[D.cx,je],[ne.cx,je],[ne.cx,ne.y+ne.h+d]]},Ge=(D,ne)=>{const me=_.filter(je=>je.to===ne.id).flatMap(je=>he.get(je.from)??[]).sort((je,Re)=>je.cx-Re.cx),ze=me.findIndex(je=>je.id===D);return me.length<=1?Math.min(Math.max(me[0]?.cx??ne.cx,ne.x+r.side.entry),ne.x+ne.w-r.side.entry):ne.x+r.side.entry+(ne.w-r.side.entry*2)*Math.max(0,ze)/(me.length-1)},L=D=>ke&&D===ce?D.cx+r.side.entry:D.cx,G=D=>X.find(ne=>ne.kind==="finish"&&ne.box===D),A=(D,ne)=>{if(D==="start"){const je=X.find(_t=>_t.kind==="start"),Re=he.get(ne);return!je||!Re?[]:[[je.x,je.y+je.r],[Re.cx,Re.y-d]]}const me=he.get(D);if(!me)return[];if(ne==="finish"){const je=G(D);return je?Math.abs(je.x-me.cx)<.5?[[me.cx,me.y+me.h],[me.cx,je.y-je.r-d]]:[[me.x+me.w,me.cy],[je.x-je.r-d,me.cy]]:[]}const ze=he.get(ne);if(!ze)return[];if(D===ne)return fg(me);if(ze.ghost&&!me.ghost){const je=L(me),Re=Ge(D,ze);return Math.abs(je-Re)<.5?[[je,me.y],[Re,ze.y+ze.h+d]]:[[je,me.y],[je,_e],[Re,_e],[Re,ze.y+ze.h+d]]}return me.ghost&&ze.ghost?[[me.x+me.w,me.cy],[ze.x-d,ze.cy]]:me.ghost?[[me.cx,me.y+me.h],[me.cx,_e],[ze.cx,_e],[ze.cx,ze.y-d]]:Me(me,ze)},W=D=>{const ne=D.to==="finish"?G(D.from):void 0;if(!ne)return;const me=he.get(D.from);return me&&Math.abs(ne.x-me.cx)<.5?[ne.x-ne.r-i-si(D.carry)[0],ne.y]:[ne.x,ne.y+ne.r+i+Y.carrier.tagH/2]},ae=D=>{const ne=D.from==="start"?X.find(me=>me.kind==="start"):void 0;return ne?[ne.x-ne.r-Y.slot.mark-si(D.carry)[0],ne.y]:void 0},se=p.map(({step:D,event:ne,edge:me})=>{const ze=W(me),je=me.carry.kind==="none"?void 0:ae(me);return{step:D,event:ne,from:me.from,to:me.to,points:A(me.from,me.to),color:kv(me,m),carry:me.carry,...ze?{settle:ze}:{},...je?{wait:je}:{}}});dg(se,he,N);const xe=new Map;for(const D of se){if(D.points.length!==2||!se.some(Re=>Re.from===D.to&&Re.to===D.from&&Re.points.length===2))continue;const[ne,me]=D.points,ze=Math.abs(me[1]-ne[1])<Math.abs(me[0]-ne[0]),je=(D.from<D.to?1:-1)*Y.edge.parallel;D.points=D.points.map(([Re,_t])=>ze?[Re,_t+je]:[Re+je,_t]),xe.set(D,ze?je>0?"below":"above":je>0?"right":"left")}const S=_.map(D=>({from:D.from,to:D.to,points:A(D.from,D.to)})),F=(D,ne,me)=>D.from===D.to?hg(D.points):or(D.points,ne,me),ee=[],te=X.flatMap(D=>D.text===""?[]:[ri(D.text,...mg(D),pe.regionNote)]),be=[...Ks(se,a.steps.length,F).values()].map(D=>us(D.point)),Ne=[...Se?[{x:Se.x,y:Se.y,w:r.side.pad+ge,h:Se.h}]:[],...te],Oe=D=>[...se.map(ne=>ne.points),...S.map(ne=>ne.points)].filter(ne=>ne!==D);for(const D of se){const ne=a.steps[D.step]?.events[D.event];if(ne?.type!=="edge"||ne.label===void 0)continue;const me=D.from===D.to,ze=Xl(D),je=ee.filter(Bn=>Bn.text===ne.label&&se.some(zn=>zn.step===Bn.step&&zn.event===Bn.event&&Xl(zn)===ze)),Re=je[je.length-1];if(Re){Re.until=D.step,ee.push({x:Re.x,y:Re.y,w:Re.w,h:Re.h,step:D.step,event:D.event,text:Re.text,family:Re.family,color:D.color});continue}const _t=Ye(ne.label,ra(ne.label))+Y.label.padX*2,at=me?{side:"below",base:pg(D.points,_t)}:{},bt=ne.labelSide??(D.to==="finish"?"left":xe.get(D));ee.push(oi({step:D.step,event:D.event,text:ne.label,points:D.points,color:D.color,...bt?{side:bt}:me?{}:{flip:!0},...at},{hard:P,soft:[...Ne,...ee],touch:be,lines:Oe(D.points)}))}const Et=[];_.forEach((D,ne)=>{const me=S[ne];if(D.label===void 0||me.points.length===0)return;const ze=ra(D.label),je=he.get(D.to)?.ghost===!0&&he.get(D.from)?.ghost!==!0,Re=me.points[0][0],_t=je?{side:"below",base:{x:Re+Y.label.soft,y:_e+Y.label.soft},slide:Math.max(...me.points.map(([bt])=>Math.abs(bt-Re)))}:{},at=oi({step:-1,event:ne,text:D.label,points:me.points,color:"slate",..._t},{hard:P,soft:[...Ne,...ee,...Et],touch:be,lines:Oe(me.points)});Et.push(at),me.label={x:at.x,y:at.y,w:at.w,h:at.h,text:D.label,family:ze.family}});const nt={kind:"state",width:0,height:0,regions:[],boxes:P,lifelines:[],edges:se,labels:ee,actions:[],badges:[],paths:S,ends:X,...Se?{side:Se}:{}},pt=[...P.map(D=>D.x),...ee.map(D=>D.x),...S.flatMap(D=>D.label?[D.label.x]:[])],Rt=[...ee.map(D=>D.y),...S.flatMap(D=>D.label?[D.label.y]:[])],Jt=Math.max(0,f-Math.min(...pt)),yt=Rt.length>0?Math.max(0,f-Math.min(...Rt)):0;(Jt>0||yt>0)&&nd(nt,Jt,yt);const qt=D=>D.x+(D.text===""?D.r:r.text+Ye(D.text,pe.regionNote)),Wt=[...P.map(D=>D.x+D.w),...ee.map(D=>D.x+D.w),...X.map(qt),...se.flatMap(D=>D.points.map(ne=>ne[0])),...S.flatMap(D=>[...D.points.map(ne=>ne[0]),...D.label?[D.label.x+D.label.w]:[]]),...Se?[Se.x+Se.w]:[]],dn=[...P.map(D=>D.y+D.h),...ee.map(D=>D.y+D.h),...X.map(D=>D.y+D.r),...se.flatMap(D=>D.points.map(ne=>ne[1]))],Ha={title:h.trail,states:y.map(D=>({box:D,color:m.get(D)??"slate"}))},Mn=Math.max(Math.max(...Wt)+f,lr(a,Ha)+f*2),Vt=Math.max(...dn,z(H-1)+u.h),It=rr(a,f,Vt+i,Mn-f*2,Ha);nt.width=Mn,nt.height=(It?It.y+It.h:Vt)+f,It&&(nt.strip=It);const Zt=Ks(se,a.steps.length,F);return nt.badges=ir(a.steps.map((D,ne)=>{const me=Zt.get(ne);return me?{step:ne,x:me.point[0],y:me.point[1],color:me.edge.color}:ad(D.events,ne,nt)})),nt}function kv(a,o){return a.carry.kind==="coin"?ed(a,o):o.get(a.to==="finish"?a.from:a.to)??"slate"}function Dv(a){const o={edges:[],events:[],busy:0};let u=qe.edgeAt,r,f=0;return a.events.forEach((i,d)=>{if(i.type==="commit"||i.type==="branch"){const h=u,m=h+qe.draw;o.edges.push({event:d,a:h,b:m,carries:!1,coin:!1,named:!1}),u=h+qe.stagger,r=m,f=0,o.busy=Math.max(o.busy,m)}else if(i.type==="edge"){const h=i.carry.kind!=="none",m=u,p=m+(h?qe.drawCarry:qe.draw);o.edges.push({event:d,a:m,b:p,carries:h,coin:i.carry.kind==="coin",named:i.label!==void 0}),u=m+qe.stagger,r=p,f=0,o.busy=Math.max(o.busy,p)}else if(i.type==="action")o.events.push({event:d,at:u}),o.busy=Math.max(o.busy,u+qe.action),u+=qe.action,f=0;else{const h=(r??u)+qe.change*f++;o.events.push({event:d,at:h}),o.busy=Math.max(o.busy,h)}}),o}function Tv(a){const o=a.steps.map(Dv),u=[];let r=qe.intro;a.steps.forEach((j,N)=>{const O=Math.min(qe.stepMax,Math.max(qe.stepMin,qe.stepBase+[...j.body].length*qe.perChar)),T=Math.max(O,(o[N]?.busy??0)+qe.dwell);u.push({start:r,end:r+T}),r+=T});const i=Math.ceil(r+qe.outro),d=i-qe.tail,h=[],m=[],p=[],y=[];o.forEach((j,N)=>{const O=u[N],T=[];for(const C of j.edges){const H=O.start+C.a;h.push({step:N,event:C.event,start:H,drawn:O.start+C.b,end:O.end});const ue=a.steps[N]?.events[C.event],Z=a.kind==="git"&&ue?.type==="edge"&&ue.carry.kind==="tag"&&ue.carry.text===ue.from;C.carries&&!Z&&y.push({step:N,event:C.event,who:C.coin?"coin":"main",a:H,b:O.start+C.b}),C.named&&T.push({step:N,event:C.event,start:H+qe.labelDelay,end:O.end})}if(T.forEach((C,H)=>{const ue=T[H+2];ue&&(C.end=Math.min(C.end,ue.start))}),a.kind==="state")for(const C of T)C.after={start:C.end,end:d};m.push(...T);for(const C of j.events)p.push({step:N,event:C.event,at:O.start+C.at})});const w=u[0]?.start??0,_=y.some(j=>j.who==="main"),v=[];for(const j of["main","coin"]){const N=y.filter(O=>O.who===j);N.forEach((O,T)=>{const C=N[T+1],H=T===0&&(j==="main"||!_);v.push({step:O.step,event:O.event,who:j,depart:O.a,arrive:O.b,start:H?Math.min(w,O.a):O.a,end:C?Math.max(C.a,O.b):d})})}v.sort((j,N)=>j.depart-N.depart);const $=a.kind==="state"?Mv(a,h,d):void 0;return{total:i,last:d,steps:u,edges:h,carriers:v,labels:m,badges:u.map((j,N)=>({step:N,appears:j.start})),events:p,stills:u.map(j=>j.end-qe.still),...$?{states:$}:{}}}var Nv=a=>ei.includes(a);function Mv(a,o,u){const r=new Map,f=d=>{const h=r.get(d)??{box:d,lit:[]};return r.set(d,h),h};let i;for(const d of o){const h=a.steps[d.step]?.events[d.event];if(!(h?.type!=="edge"||h.from===h.to)){if(i){const m=f(i.box);m.lit.push({start:i.since,end:d.start}),i.box===h.from&&m.done===void 0&&(m.done=d.start+qe.done),i=void 0}Nv(h.to)||(i={box:h.to,since:d.drawn})}}return i&&f(i.box).lit.push({start:i.since,end:u}),[...r.values()]}var rs={app:"M -9 -7 h18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z M -11 -2 h22",router:"M -9 -4 h16 M 3 -8 l4 4 l-4 4 M 9 5 h-16 M -3 1 l-4 4 l4 4",on:"M -7 7 L 7 -7 M -1 -7 h8 v8",off:"M -7 -7 L 7 7 M 7 -1 v8 h-8",pool:"M -9 -5 a9 3.5 0 1 0 18 0 a9 3.5 0 1 0 -18 0 M -9 -5 v10 a9 3.5 0 0 0 18 0 v-10 M -9 0 a9 3.5 0 0 0 18 0",db:"M -9 -5 a9 3.5 0 1 0 18 0 a9 3.5 0 1 0 -18 0 M -9 -5 v10 a9 3.5 0 0 0 18 0 v-10 M -9 0 a9 3.5 0 0 0 18 0",exe:"M -5 -8 L 7 0 L -5 8 Z",idx:"M -9 -7 h18 M -9 -2 h18 M -9 3 h18 M -9 8 h11",sign:"M -9 4 c 3 -9 5 -9 6 0 s 3 7 6 -2 s 3 -6 6 0",env:"M -8 -5.5 h16 v11 h-16 z M -8 -5.5 l8 6 l8 -6",lock:"M -5.5 -1 h11 v8 h-11 z M -3.5 -1 v-3 a3.5 3.5 0 0 1 7 0 v3",check:"M -5 0 l3.5 3.5 l6.5 -7",x:"M -5 -5 l10 10 M 5 -5 l-10 10",chain:"M -1.5 4.5 l-2 2 a3.5 3.5 0 0 1 -5 -5 l3 -3 a3.5 3.5 0 0 1 5 0 M 1.5 -4.5 l2 -2 a3.5 3.5 0 0 1 5 5 l-3 3 a3.5 3.5 0 0 1 -5 0 M -2.5 2.5 l5 -5",net:"M -1.3 -4.6 L -5.8 3 M 1.3 -4.6 L 5.8 3 M -4.3 5.5 H 4.3 M -2.2 -7 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 M -9.2 5.5 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0 M 4.8 5.5 a 2.2 2.2 0 1 0 4.4 0 a 2.2 2.2 0 1 0 -4.4 0",user:"M -4 -4.5 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M -8 9 c0 -5 3.6 -7.5 8 -7.5 s8 2.5 8 7.5",server:"M -9 -8 h18 v7 h-18 z M -9 1 h18 v7 h-18 z M -5 -4.5 h0.01 M -5 4.5 h0.01",key:"M -9 0 a3.5 3.5 0 1 0 7 0 a3.5 3.5 0 1 0 -7 0 M -2 0 h10 M 5 0 v3.5 M 8 0 v2.5",shield:"M 0 -9 l8 3 v5 c0 5 -3.5 8 -8 10 c-4.5 -2 -8 -5 -8 -10 v-5 z",globe:"M -9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M -9 0 h18 M 0 -9 c-4.5 4 -4.5 14 0 18 M 0 -9 c4.5 4 4.5 14 0 18",bolt:"M 2 -9 L -5 1 h5 l-2 8 l7 -10 h-5 z",doc:"M -6 -9 h8 l5 5 v13 h-13 z M 2 -9 v5 h5 M -3 1 h7 M -3 5 h5",box:"M -9 -4.5 l9 -4.5 l9 4.5 v9 l-9 4.5 l-9 -4.5 z M -9 -4.5 l9 4.5 l9 -4.5 M 0 0 v9",truck:"M -10 -6 h11 v10 h-11 z M 1 -2 h5 l3.5 3.5 v2.5 h-8.5 M -7.5 6.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0 M 3 6.5 a1.8 1.8 0 1 0 3.6 0 a1.8 1.8 0 1 0 -3.6 0",card:"M -9 -6.5 h18 a2 2 0 0 1 2 2 v9 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-9 a2 2 0 0 1 2 -2 z M -11 -2 h22 M -7 3 h5",cart:"M -10 -8 h3 l3 11 h11 l2.5 -8 h-15.5 M -4.5 7.5 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M 5 7.5 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0",clock:"M -9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 M 0 -5 v5 l3.5 2.5",branch:"M -4 -4.5 v9 M 5 0.5 c0 4 -9 3 -9 6.5 M -6.2 -7 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 M -6.2 7 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 M 2.8 -2 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0",cloud:"M -7 6 h13 a4.5 4.5 0 0 0 0.5 -9 a6 6 0 0 0 -11.5 -1 a4.5 4.5 0 0 0 -2 10 z",refresh:"M 7 -3 a7.5 7.5 0 1 0 0.5 5 M 7.5 -8 v5 h-5",undo:"M -7 -2 h10 a5 5 0 0 1 0 10 h-6 M -3 -6 l-4 4 l4 4",yen:"M -6 -8 l6 7 l6 -7 M 0 -1 v9 M -5 1.5 h10 M -5 5 h10",layers:"M 0 -8 l9 4.5 l-9 4.5 l-9 -4.5 z M -9 2.5 l9 4.5 l9 -4.5",code:"M -4 -6 l-5 6 l5 6 M 4 -6 l5 6 l-5 6",paint:"M -8 8 c 0 -3 2 -5 4.5 -5 l 9 -9 l 3.5 3.5 l -9 9 c 0 2.5 -2 4.5 -5 4.5 z",block:"M -9 -7 h18 a2 2 0 0 1 2 2 v10 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 v-10 a2 2 0 0 1 2 -2 z M -11 -2.5 h22 M -6 2.5 h8"},cs=[[0,Number.POSITIVE_INFINITY]],ku=.5,Sm=(a,o)=>a.shown.some(([u,r])=>u<=o&&o<r),Du=a=>({text:a.text,rect:{x:a.rect.x,y:a.rect.y,w:a.rect.w,h:a.rect.h},badge:a.badge===!0,...a.part?{part:a.part}:{}});function $v(a,o,u=[]){const r=[];return o.forEach((f,i)=>{const d=a.filter(m=>Sm(m,f));d.forEach((m,p)=>{for(const y of d.slice(p+1)){const w=Math.min(m.rect.x+m.rect.w,y.rect.x+y.rect.w)-Math.max(m.rect.x,y.rect.x),_=Math.min(m.rect.y+m.rect.h,y.rect.y+y.rect.h)-Math.max(m.rect.y,y.rect.y);w>ku&&_>ku&&r.push({kind:"texts",step:i,texts:[m.text,y.text],spots:[Du(m),Du(y)]})}});const h=u.filter(m=>Sm(m,f));for(const m of d)if(!m.boxed)for(const p of h)td(p.points,m.rect,ku)&&r.push({kind:"line",step:i,text:m.text,line:{from:p.from,to:p.to},spots:[Du(m)]})}),r}function Ov(a,o="ja"){const u=li[o],r=i=>i.kind==="icon"?u.iconOf(i.box):i.kind==="coin"?u.coin:u.envelope,f=i=>i.badge?u.badgeName(i.text):i.part?r(i.part):u.quoted(i.text);return a.kind==="texts"?u.textsOverlap(f(a.spots[0]),f(a.spots[1])):u.lineCrosses(a.line.from,a.line.to,f(a.spots[0]))}var jt=a=>a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),ye=a=>Math.round(a*100)/100,At=a=>a==="coin"?"--c:var(--coin);--ct:var(--coint)":`--c:var(--c-${a});--ct:var(--t-${a})`;function ci(a,o,u,r,f="dg-gl"){const i=a===void 0?void 0:rs[a];return i?`<path class="${f}" transform="translate(${ye(o)} ${ye(u)}) scale(${r})" d="${i}"/>`:""}function Cv(a){return Object.hasOwn(rs,a)?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${Y.stroke.glyph*Y.box.iconScale}" stroke-linecap="round" stroke-linejoin="round"><path d="${rs[a]}"/></svg>`:void 0}function Ql(a){const o=a.filter((i,d)=>d===0||i[0]!==a[d-1][0]||i[1]!==a[d-1][1]),[u,r]=o[0];let f=`M ${ye(u)} ${ye(r)}`;for(let i=1;i<o.length-1;i++){const[d,h]=o[i-1],[m,p]=o[i],[y,w]=o[i+1],_=Math.hypot(m-d,p-h),v=Math.hypot(y-m,w-p),$=Math.min(Y.edge.bend,_/2,v/2);f+=` L ${ye(m-(m-d)/_*$)} ${ye(p-(p-h)/_*$)} Q ${ye(m)} ${ye(p)} ${ye(m+(y-m)/v*$)} ${ye(p+(w-p)/v*$)}`}if(o.length>1){const[i,d]=o[o.length-1];f+=` L ${ye(i)} ${ye(d)}`}return f}function vg(a){const[o,u]=a[a.length-1],[r,f]=a[a.length-2],i=Math.hypot(o-r,u-f)||1,d=(o-r)/i,h=(u-f)/i,{arrow:m,arrowHalf:p}=Y.edge;return`M ${ye(o-d*m-h*p)} ${ye(u-h*m+d*p)} L ${ye(o)} ${ye(u)} L ${ye(o-d*m+h*p)} ${ye(u-h*m-d*p)}`}function un(a,o,u,r,f,i,d=cs,h){return a?.push({text:f,rect:ri(f,u,r,i,h),shown:d}),`<text class="${o}" x="${ye(u)}" y="${ye(r)}"${h?` text-anchor="${h}"`:""}>${jt(f)}</text>`}function xg(a,o){const u=[[0,{opacity:0}]];for(const[r,f]of o)u.push([r,{opacity:0},et.out],[r+qe.fade,{opacity:1}],[f-.1,{opacity:1},et.inOut],[f+.25,{opacity:0}]);return u.push([a.total,{opacity:0}]),a.kf(u)}function wg(a,o){const u=[];for(let r=0;r<o.length;){let f=r;for(;f+1<o.length&&o[f+1]===o[f]+1;)f++;u.push([a.t.steps[o[r]].start,a.t.steps[o[f]].end]),r=f+1}return xg(a.m,u)}function jv(a,o){const{radius:u,icon:r,iconRadius:f,iconScale:i,nameY:d,line:h}=Y.region,{x:m,y:p}=a.header,y=a.lines.map((v,$)=>un(o,"dg-bz",m,a.y+d+$*h,v,pe.regionName)).join(""),w=a.note?un(o,"dg-bx",m,a.y+d+a.lines.length*h+1,a.note,pe.regionNote):"",_=a.icon&&rs[a.icon]?`<rect class="dg-bi" x="${ye(m)}" y="${ye(p)}" width="${r}" height="${r}" rx="${f}"/>${ci(a.icon,m+r/2,p+r/2,i)}`:"";return`<g style="${At(a.color)}"><rect class="dg-band" x="${ye(a.x+.5)}" y="${ye(a.y+.5)}" width="${ye(a.w-1)}" height="${ye(a.h-1)}" rx="${u}"/>${_}${y}${w}</g>`}function Sg(a,o,u,r,f){const i=[[0,a.sub??"","dg-ss"],...u];return i.map(([d,h,m],p)=>{const y=i[p+1]?.[0],w=p===0?y===void 0?"":o.until(y-qe.untilFade):y===void 0?o.rise(d):o.rise(d,y-qe.untilFade);if(h==="")return"";const _=[[p===0?0:d,y===void 0?Number.POSITIVE_INFINITY:y-qe.untilFade]];return`<g${w?` class="dg-a" style="${w}"`:""}>${un(f,m,a.cx,r,h,m==="dg-ss"?pe.boxSub:pe.boxSubStrong,_,"middle")}</g>`}).join("")}function Ag(a,o,u,r,f){const i=(d,h="")=>`<rect class="${d}" x="${ye(a.x)}" y="${ye(r)}" width="${ye(a.w)}" height="${f}" rx="${Y.box.radius}"${h}/>`;return`${u?`<g class="dg-a" style="${u}">${i("dg-halo")}</g>`:""}${i("dg-st",` ${o.sh}`)}${u?`<g class="dg-a" style="${u}">${i("dg-on")}</g>`:""}`}function Bv(a,o,u,r,f){const{icon:i,iconRadius:d,iconScale:h,iconY:m,nameY:p,subY:y}=Y.box,w=Sg(a,o.m,r,a.cy+y,o.ink),_=f?f.length>0?xg(o.m,f.map(N=>[N.start,N.end])):void 0:u.length>0?wg(o,u):void 0,v=a.iconX??a.cx,$=a.slot?`<rect class="dg-slot" x="${ye(a.slot.x)}" y="${ye(a.slot.y)}" width="${ye(a.slot.w)}" height="${ye(a.slot.h)}" rx="${Y.slot.radius}"/>`:"";let j="";if(a.icon&&rs[a.icon]){const N={x:v-i/2,y:a.cy+m-i/2,w:i,h:i};o.ink.push({text:`${a.name} の絵柄`,rect:N,shown:cs,boxed:!0,part:{kind:"icon",box:a.name}}),j=`<rect class="dg-ic" x="${ye(N.x)}" y="${ye(N.y)}" width="${i}" height="${i}" rx="${d}"/>${ci(a.icon,v,a.cy+m,h)}`}return`<g style="${At(a.color)}">${Ag(a,o,_,a.y,a.h)}${$}${j}${un(o.ink,"dg-sn",a.cx,a.cy+p,a.name,pe.boxName,cs,"middle")}${w}</g>`}function zv(a,o,u,r){const{pad:f,h:i,nameY:d,subY:h}=Y.follow.head,m=Sg(a,o.m,r,f+h),p=u.length>0?wg(o,u):void 0;return`<g style="${At(a.color)}">${Ag(a,o,p,f,i)}<text class="dg-sn" x="${ye(a.cx)}" y="${ye(f+d)}" text-anchor="middle">${jt(a.name)}</text>${m}</g>`}function Rv(a,o){const{icon:u,iconRadius:r,iconScale:f,radius:i}=Y.box,d=Y.state.ghost,h=a.x+d.pad+u/2,m=a.x+d.pad+u+d.gap,p=a.icon&&rs[a.icon]?`<rect class="dg-ic" x="${ye(h-u/2)}" y="${ye(a.cy-u/2)}" width="${u}" height="${u}" rx="${r}"/>${ci(a.icon,h,a.cy,f)}`:"",y=a.sub?d.nameY:Y.baseline.mark,w=a.sub?un(o,"dg-ss",m,a.cy+d.subY,a.sub,pe.boxSub,cs,"start"):"";return`<g data-ghost="${jt(a.id)}" style="${At(a.color)}"><rect class="dg-ghost" x="${ye(a.x)}" y="${ye(a.y)}" width="${ye(a.w)}" height="${a.h}" rx="${i}"/>${p}${un(o,"dg-sn",m,a.cy+y,a.name,pe.boxName,cs,"start")}${w}</g>`}function qv(a,o,u){const{r,inset:f}=Y.state.done,i=a.x+a.w-f,d=a.y+f;return`<g class="dg-popc dg-a" data-done="${jt(a.id)}" style="${At(a.color)};${u.m.pop(o)}"><circle class="dg-done" cx="${ye(i)}" cy="${ye(d)}" r="${r}"/>${ci("check",i,d,.5,"dg-done-ck")}</g>`}function Hv(a,o,u,r){r.push({from:a.from,to:a.to,points:a.points,shown:cs});const f=a.label?.family==="sans",i=a.label?un(u,`dg-path-t${f?" dg-path-tj":""}`,a.label.x+Y.label.padX,a.label.y+a.label.h/2+Y.baseline.label,a.label.text,f?pe.labelJa:pe.label):"";return`<g data-path="${jt(`${a.from}->${a.to}`)}" style="${At(o)}"><path class="dg-path" d="${Ql(a.points)}"/><path class="dg-path-h" d="${vg(a.points)}"/>${i}</g>`}function Uv(a,o,u){const{pad:r}=Y.state.side,f=a.y+r+pe.regionName.size,i=a.notes.map((d,h)=>un(u,"dg-side-n",a.x+r,f+Y.region.line*(h+1),d,pe.regionNote)).join("");return`<g style="${At(o)}"><rect class="dg-side" x="${ye(a.x+.5)}" y="${ye(a.y+.5)}" width="${ye(a.w-1)}" height="${ye(a.h-1)}" rx="${Y.region.radius}"/>${un(u,"dg-side-t",a.x+r,f,a.title,pe.regionName)}${i}</g>`}function Lv(a,o,u){const{end:r}=Y.state,f=mg(a),i=a.text===""?"":un(u,"dg-mark",f[0],f[1],a.text,pe.regionNote),d=ye(a.x),h=ye(a.y);return a.kind==="start"?`<g data-end="start"><circle class="dg-start" cx="${d}" cy="${h}" r="${a.r}"/>${i}</g>`:a.ghost?`<g data-end="finish" style="${At(o)}"><circle class="dg-end-x" cx="${d}" cy="${h}" r="${a.r}"/><circle class="dg-end-xi" cx="${d}" cy="${h}" r="${r.inner}"/>${i}</g>`:`<g data-end="finish"><circle class="dg-end" cx="${d}" cy="${h}" r="${a.r}"/><circle class="dg-end-in" cx="${d}" cy="${h}" r="${r.inner}"/>${i}</g>`}function Gv(a,o,u){return`<line class="dg-ll" x1="${ye(a)}" y1="${ye(o)}" x2="${ye(a)}" y2="${ye(u)}"/>`}function Yv(a,o,u,r=!1){const{m:f}=u;u.traces.push({from:a.from,to:a.to,points:a.points,shown:cs});const i=Ql(a.points),d=vg(a.points),{start:h,drawn:m,end:p}=o,y=r?[[p,{opacity:1},et.inOut],[p+.4,{opacity:0}],[f.total,{opacity:0}]]:[[p,{opacity:1},et.inOut],[p+.4,{opacity:.45}],[u.end+.3,{opacity:.45},et.inOut],[u.end+1,{opacity:.95}],[f.last,{opacity:.95},et.inOut],[f.total,{opacity:0}]],w=f.kf([[0,{opacity:0,"stroke-dashoffset":1}],[h,{opacity:0,"stroke-dashoffset":1},et.inOut],[h+.05,{opacity:1}],[m,{"stroke-dashoffset":0}],[f.last,{"stroke-dashoffset":0}],[f.total,{"stroke-dashoffset":1}],...y]),_=f.kf([[0,{opacity:0}],[m-.05,{opacity:0}],[m,{opacity:1}],...y]),v=-(p-m)*26,$=f.kf([[0,{opacity:0,"stroke-dashoffset":0}],[m,{opacity:0,"stroke-dashoffset":0}],[m+.25,{opacity:.9}],[p-.1,{opacity:.9},et.inOut],[p+.2,{opacity:0,"stroke-dashoffset":v}],[f.total,{opacity:0,"stroke-dashoffset":v}]]),j=r?f.kf([[0,{opacity:0}],[p,{opacity:0},et.inOut],[p+.4,{opacity:1}],[f.last,{opacity:1},et.inOut],[f.total,{opacity:0}]]):"";return{base:`<path class="dg-e" d="${i}"/><path class="dg-eh" d="${d}"/>${r?`<path class="dg-e-past dg-a" d="${i}" style="${j}"/><path class="dg-eh-past dg-a" d="${d}" style="${j}"/>`:""}`,lit:`<g style="${At(a.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${i}" style="${w}"/><path class="dg-eh-on dg-a" d="${d}" style="${_}"/><path class="dg-flow dg-a" d="${i}" style="${$}"/></g>`}}function Fv(a,o,u){const r=a.family==="sans"?" dg-capj":"",{radius:f}=Y.label;u.ink.push({text:a.text,rect:a,shown:[[o.start,o.end]],boxed:!0}),o.after&&u.ink.push({text:a.text,rect:ri(a.text,a.x+a.w/2,a.y+a.h/2+Y.baseline.label,a.family==="sans"?pe.labelJa:pe.label,"middle"),shown:[[o.after.start,o.after.end]]});const i=ye(a.x+a.w/2),d=ye(a.y+a.h/2+Y.baseline.label);return`${o.after?`<g class="dg-cap-past${a.family==="sans"?" dg-cap-pastj":""} dg-a" style="${u.m.vis(o.after.start,o.after.end)}"><text x="${i}" y="${d}" text-anchor="middle">${jt(a.text)}</text></g>`:""}<g class="dg-cap${r} dg-a" style="${At(a.color)};${u.m.rise(o.start,o.end,!0)}"><rect x="${ye(a.x)}" y="${ye(a.y)}" width="${ye(a.w)}" height="${a.h}" rx="${f}"/><text x="${i}" y="${d}" text-anchor="middle">${jt(a.text)}</text></g>`}function Xv(a,o,u,r){return r.ink.push({text:a.text,rect:a,shown:[[o,u]],boxed:!0}),`<g class="dg-act dg-a" style="${At(a.color)};${r.m.rise(o,u,!0)}"><rect x="${ye(a.x)}" y="${ye(a.y)}" width="${ye(a.w)}" height="${a.h}" rx="${Y.action.radius}"/><text x="${ye(a.x+a.w/2)}" y="${ye(a.y+a.h/2+Y.baseline.action)}" text-anchor="middle">${jt(a.text)}</text></g>`}function Vv(a,o){const u=Y.carrier;if(a.carry.kind==="coin")return`<circle class="dg-coin" r="${u.coinR}"/><circle class="dg-coin-in" r="${u.coinIn}"/>`;if(a.carry.kind==="tag"){const r=a.carry.text,f=jn(r),i=Ye(r,f?pe.carrierJa:pe.carrier)+u.tagPadX*2;return`<rect class="dg-car" x="${ye(-i/2)}" y="${-18/2}" width="${ye(i)}" height="${u.tagH}" rx="${u.tagH/2}" ${o}/><text class="dg-car-t${f?" dg-car-tj":""}" y="${Y.baseline.carrier}" text-anchor="middle">${jt(r)}</text>`}return`<rect class="dg-env" x="${-24/2}" y="${-17/2}" width="${u.envW}" height="${u.envH}" rx="3" ${o}/><path class="dg-env-in" d="M -8 -4.5 L 0 1.5 L 8 -4.5"/>`}var Qv=a=>a<.5?4*a*a*a:1-(-2*a+2)**3/2;function Eg(a,o,u){const{m:r}=u,f=Y.carrier.samples,i=a.wait?[a.wait,...a.points]:a.points,d=sr(i),{depart:h,arrive:m,start:p,end:y}=o,w=[];for(let Z=0;Z<=f;Z++){const[ie,U]=ls(i,Qv(Z/f)*d);w.push([h+(m-h)*Z/f,ie,U])}const _=w[0],v=w[w.length-1],$=a.settle??[v[1],v[2]],j=[[0,_[1],_[2]],...w];a.settle&&j.push([Math.min(m+.3,Math.max(y,m+.01)),$[0],$[1]]),j.push([y,$[0],$[1]],[r.total,$[0],$[1]]);const[N,O]=si(a.carry),T=a.carry.kind==="tag"?a.carry.text:a.carry.kind==="coin"?"硬貨":"封筒",C=a.carry.kind==="tag"?{}:{part:{kind:a.carry.kind==="coin"?"coin":"envelope"}},H=Z=>({x:Z[0]-N,y:Z[1]-O,w:N*2,h:O*2});h>p&&u.ink.push({text:T,rect:H([_[1],_[2]]),shown:[[p,h]],boxed:!0,...C}),u.ink.push({text:T,rect:H($),shown:[[m,y]],boxed:!0,...C});const ue=y<r.last?.05:.18;return`<g class="dg-a" style="${r.move(j,r.blink(p+.02,y,ue))}">${Vv(a,u.sh)}</g>`}function Jv(a,o,u=!1){const{m:r}=o,f=o.t.steps[a.step],i=f.start,d=f.end,{r:h,ring:m}=Y.badge,p={visibility:"visible"},y={visibility:"hidden"},w=a.until===void 0?void 0:o.t.steps[a.until].start,_=w!==void 0&&w<=d+1e-6,v=r.kf([[0,{opacity:0,transform:"scale(.5)",...y}],[i,{opacity:0,transform:"scale(.5)",...y},et.pop],[i+.35,{opacity:1,transform:"scale(1)",...p}],[d,{opacity:1,transform:"scale(1)",...p},et.inOut],[d+(_?qe.untilFade:.4),{opacity:0,transform:"scale(1)",...y}],[r.total,{opacity:0,transform:"scale(.5)",...y}]]),$=w??r.last,j=_?r.kf([[0,{opacity:0,...y}],[r.total,{opacity:0,...y}]]):r.kf([[0,{opacity:0,...y}],[d,{opacity:0,...y},et.inOut],[d+.4,{opacity:1,...p}],[$,{opacity:1,...p},et.inOut],...w===void 0?[]:[[w+qe.untilFade,{opacity:0,...y}]],[r.total,{opacity:0,...y}]]),N=r.kf([[0,{opacity:0,transform:"scale(1)"}],[i+.05,{opacity:0,transform:"scale(1)"}],[i+.1,{opacity:.7,transform:"scale(1)"},et.out],[i+.9,{opacity:0,transform:"scale(2.3)"}],[r.total,{opacity:0,transform:"scale(1)"}]]),O=ye(a.x),T=ye(a.y),C=ye(a.y+Y.baseline.badge),H=a.step+1;return o.ink.push({text:String(H),rect:{x:a.x-h,y:a.y-h,w:h*2,h:h*2},shown:[[i,$]],boxed:!0,badge:!0}),`<g class="dg-bd" data-step="${a.step}" style="${At(a.color)}"><circle class="dg-bdr dg-popc dg-a" cx="${O}" cy="${T}" r="${m}" style="${N}"/><g class="dg-a" style="${j}"><circle class="${u?"dg-bdp-g":"dg-bdp"}" cx="${O}" cy="${T}" r="${m}"/><text class="${u?"dg-bdpt-g":"dg-bdpt"}" x="${O}" y="${C}" text-anchor="middle">${H}</text></g><g class="dg-popc dg-a" style="${v}"><circle class="dg-bdf" cx="${O}" cy="${T}" r="${h}"/><text class="dg-bdft" x="${O}" y="${C}" text-anchor="middle">${H}</text></g></g>`}function Zv(a,o,u,r=!1,f=new Map){const{m:i,sh:d}=u,h=Y.strip,m=a.y+h.h/2,p=[`<rect class="dg-strip" x="${ye(a.x+.5)}" y="${ye(a.y+.5)}" width="${ye(a.w-1)}" height="${ye(a.h-1)}" rx="${Y.region.radius}" ${d}/>`,`<g style="${At("slate")}"><rect class="dg-bi" x="${ye(a.x+h.pad)}" y="${ye(m-h.icon/2)}" width="${h.icon}" height="${h.icon}" rx="${Y.box.iconRadius}"/>${ci("env",a.x+h.pad+h.icon/2,m,.78)}</g>`,un(u.ink,"dg-sh",a.x+h.titleX,m+Y.baseline.stripTitle,a.title,pe.stripTitle)];if(a.fields.forEach((y,w)=>{const _=a.fields[w-1];if(_&&_.y===y.y){const N=y.x-h.fieldGap/2;p.push(`<line class="dg-sep" x1="${ye(N)}" y1="${ye(y.y+h.sepInset)}" x2="${ye(N)}" y2="${ye(y.y+h.h-h.sepInset)}"/>`)}p.push(un(u.ink,"dg-fl",y.x,y.y+h.nameY,y.name,pe.fieldName));const v=o.get(y.name)??[],$=v.filter(N=>N.value!==void 0),j=v.filter(N=>N.tag!==void 0);$.forEach((N,O)=>{const T=$[O+1]?.at,C=N.value,H=jn(C)?"dg-fvj":"dg-fv";u.ink.push({text:C,rect:ri(C,y.x,y.y+h.valueY,jn(C)?pe.fieldValueJa:pe.fieldValue),shown:[[N.at,T===void 0?Number.POSITIVE_INFINITY:T-qe.untilFade]]});const ue=fe=>`<text class="${fe}" x="${ye(y.x)}" y="${ye(y.y+h.valueY)}">${jt(C)}</text>`,Z=ue(H);if(!r){const fe=T===void 0?i.rise(N.at):i.rise(N.at,T-qe.untilFade);p.push(`<g class="dg-a" style="${fe}">${Z}</g>`);return}const ie=Math.min(N.until,T??N.until),U=`<circle class="dg-fl-now" cx="${ye(y.x+Ye(y.name,pe.fieldName)+h.now.gap)}" cy="${ye(y.y+h.nameY-pe.fieldName.size/3)}" r="${h.now.r}"/>`;p.push(`<g class="dg-fv-now dg-a" data-step="${N.step}" style="${At(N.color)};${i.rise(N.at,ie-qe.untilFade)}">${ue(`${H} dg-fv-c`)}${U}</g>`),(T===void 0||T>ie)&&p.push(`<g class="dg-a" style="${i.vis(ie-qe.untilFade,T===void 0?i.last:T-qe.untilFade)}">${Z}</g>`)}),j.forEach((N,O)=>{const T=j[O+1]?.at,C=N.tag,H=[...$].reverse().find(U=>U.at<=N.at+1e-9)?.value,ue=y.x+(H?Ye(H,jn(H)?pe.fieldValueJa:pe.fieldValue)+h.tagGap:0),Z=Ye(C,pe.tag)+h.tagPadX*2,ie=y.y+h.valueY-h.tagH/2-Y.baseline.tag;u.ink.push({text:C,rect:{x:ue,y:ie,w:Z,h:h.tagH},shown:[[N.at,T===void 0?Number.POSITIVE_INFINITY:T-qe.untilFade]],boxed:!0}),p.push(`<g class="dg-tg dg-popc dg-a" style="${At(N.color)};${T===void 0?i.pop(N.at):i.pop(N.at,T-qe.untilFade)}"><rect x="${ye(ue)}" y="${ye(ie)}" width="${ye(Z)}" height="${h.tagH}" rx="${h.tagH/2}"/><text x="${ye(ue+Z/2)}" y="${ye(ie+h.tagH/2+Y.baseline.tag)}" text-anchor="middle">${jt(C)}</text></g>`)})}),a.trail){const y=a.trail,w=a.fields[a.fields.length-1];if(w&&w.y===y.y){const v=y.x-h.fieldGap/2;p.push(`<line class="dg-sep" x1="${ye(v)}" y1="${ye(y.y+h.sepInset)}" x2="${ye(v)}" y2="${ye(y.y+h.h-h.sepInset)}"/>`)}p.push(un(u.ink,"dg-fl",y.x,y.y+h.nameY,y.title,pe.fieldName));const _=y.y+h.valueY-pe.fieldValue.size/3;y.states.forEach((v,$)=>{const j=ye(y.x+h.trail.r+$*h.trail.step),N=f.get(v.box),O=N===void 0?"":`<circle class="dg-tr-fill dg-a" cx="${j}" cy="${ye(_)}" r="${h.trail.r}" style="${i.pop(N)}"/>`;p.push(`<g data-trail="${jt(v.box)}" style="${At(v.color)}"><circle class="dg-tr-ring" cx="${j}" cy="${ye(_)}" r="${h.trail.r}"/>${O}</g>`)})}return p.join("")}var Ln=a=>Math.round(a*100)/100,Am=a=>[a.x+a.w/2,a.y+a.h/2];function Kv(a,o){const u=Y.carrier,r=jn(a),f=Ye(a,r?pe.carrierJa:pe.carrier)+u.tagPadX*2;return`<rect class="dg-car" x="${Ln(-f/2)}" y="${-18/2}" width="${Ln(f)}" height="${u.tagH}" rx="${u.tagH/2}" ${o}/><text class="dg-car-t${r?" dg-car-tj":""}" y="${Y.baseline.carrier}" text-anchor="middle">${jt(a)}</text>`}function Pv(a,o,u,r){const{m:f}=r,i=Y.git,d=(v,$)=>u.edges.find(j=>j.step===v&&j.event===$),h=a.links.map(v=>{const $=d(v.step,v.event);if(!$)return"";r.traces.push({from:v.from,to:v.to,points:v.points,shown:[[$.start,Number.POSITIVE_INFINITY]]});const j=Ql(v.points);if(v.kind==="copy")return`<g style="${At(v.color)}"><path class="dg-git-cp dg-a" d="${j}" style="${f.vis($.start,f.last)}"/></g>`;const N=f.kf([[0,{opacity:0,"stroke-dashoffset":1}],[$.start,{opacity:0,"stroke-dashoffset":1},et.inOut],[$.start+.05,{opacity:1}],[$.drawn,{"stroke-dashoffset":0}],[f.last,{opacity:1,"stroke-dashoffset":0},et.inOut],[f.total,{opacity:0,"stroke-dashoffset":0}]]);return`<g style="${At(v.color)}"><path class="dg-git-l dg-a" pathLength="1" d="${j}" style="${N}"/></g>`}).join(""),m=a.commits.map(v=>{const $=d(v.step,v.event)?.drawn??0,j={x:v.cx-v.r,y:v.cy-v.r,w:v.r*2,h:v.r*2};r.ink.push({text:v.id,rect:j,shown:[[$,Number.POSITIVE_INFINITY]],boxed:!0});const N=(v.text?.lines??[]).map((Z,ie)=>{const U=ie===0&&v.hash!==void 0,fe=v.text?.baselines[ie]??v.cy;return un(r.ink,U?"dg-git-h":"dg-git-n",v.cx,fe,Z,U?pe.gitHash:pe.gitNote,[[$,Number.POSITIVE_INFINITY]],"middle")}).join(""),O=`<text class="dg-git-id" x="${Ln(v.cx)}" y="${Ln(v.cy+Y.baseline.badge)}" text-anchor="middle">${jt(v.id)}</text>`,T=`<g class="dg-popc dg-a" style="${f.pop($)}"><circle class="dg-git-c" cx="${Ln(v.cx)}" cy="${Ln(v.cy)}" r="${v.r}" ${r.sh}/>${O}</g>`,C=N===""?"":`<g class="dg-a" style="${f.vis($)}">${N}</g>`,H=v.orphan===void 0?void 0:d(v.orphan,v.orphanEvent??0)?.drawn,ue=H===void 0?"":`<g class="dg-a" data-orphan="${jt(v.id)}" style="${f.vis(H,f.last,{f:.5})}"><circle class="dg-git-old" cx="${Ln(v.cx)}" cy="${Ln(v.cy)}" r="${i.orphan}"/><text class="dg-git-oldl" x="${Ln(v.cx)}" y="${Ln(v.cy+Y.baseline.badge)}" text-anchor="middle">${jt(v.id)}</text></g>`;return`<g data-commit="${jt(v.id)}" style="${At(v.color)}">${T}${C}${ue}</g>`}).join(""),p=a.moves.flatMap(v=>{const $=d(v.step,v.event);if(!v.line||!$)return[];const j=u.steps[v.step].end;r.traces.push({from:v.ref,to:v.target??v.ref,points:v.line,shown:[[$.start,j+.4]]});const N=f.kf([[0,{opacity:0,"stroke-dashoffset":1}],[$.start,{opacity:0,"stroke-dashoffset":1},et.inOut],[$.start+.05,{opacity:1}],[$.drawn,{"stroke-dashoffset":0}],[j,{opacity:1},et.inOut],[j+.4,{opacity:0}],[f.total,{opacity:0,"stroke-dashoffset":0}]]);return[`<g style="${At(v.color)}"><path class="dg-e-on dg-a" pathLength="1" d="${Ql(v.line)}" style="${N}"/></g>`]}).join(""),y=u.carriers.flatMap(v=>{const $=a.moves.find(O=>O.step===v.step&&O.event===v.event&&O.line),j=o.steps[v.step]?.events[v.event];if(!$?.line||j?.type!=="edge")return[];const N={step:v.step,event:v.event,from:$.ref,to:$.target??$.ref,points:$.line,color:$.color,carry:j.carry};return[Eg(N,{...v,start:v.depart,end:v.arrive+qe.fade},r)]}).join(""),_=[...new Set(a.moves.map(v=>v.ref))].map(v=>Wv(v,a.moves.filter($=>$.ref===v),d,r)).join("")+y;return{links:h,lines:p,commits:m,tags:_}}function Wv(a,o,u,r){const{m:f}=r,i=[],d=[[0,{opacity:0}]];let h=!1,m;const p=v=>{m&&r.ink.push({text:a,rect:m.rect,shown:[[m.since,v]],boxed:!0}),m=void 0};for(const v of o){const $=u(v.step,v.event);if(!$)continue;const{start:j,drawn:N}=$,O=v.from?Am(v.from):void 0,T=v.to?Am(v.to):void 0;if(p(j),v.carried&&O&&T&&h){i.push([j+qe.fade,O[0],O[1]],[N-qe.fade,T[0],T[1]]),d.push([j,{opacity:1},et.inOut],[j+qe.fade,{opacity:0}],[N-qe.fade,{opacity:0},et.out],[N,{opacity:1}]),m={rect:v.to,since:N};continue}if(O&&i.push([j,O[0],O[1]]),T&&i.push([N,T[0],T[1]]),T&&!h){const C=O?j:N-qe.fade;d.push([C,{opacity:0},et.out],[C+qe.fade,{opacity:1}]),h=!0}else!T&&h&&(d.push([N,{opacity:1},et.inOut],[N+qe.untilFade,{opacity:0}]),h=!1);v.to&&(m={rect:v.to,since:N})}if(p(Number.POSITIVE_INFINITY),i.length===0)return"";const y=i[0],w=i[i.length-1];h?d.push([f.last,{opacity:1},et.inOut],[f.total,{opacity:0}]):d.push([f.total,{opacity:0}]);const _=f.move([[0,y[1],y[2]],...i,[f.total,w[1],w[2]]],d);return`<g class="dg-a" data-ref="${jt(a)}" style="${_}">${Kv(a,r.sh)}</g>`}var Em=a=>Math.round(a*100)/100,Iv=class{constructor(a,o,u){this.prefix=a,this.total=o,this.last=u}prefix;total;last;frames=[];count=0;pct(a){return+(Math.min(Math.max(a,0),this.total)/this.total*100).toFixed(3)}kf(a){const o=`${this.prefix}-${this.count++}`,u=new Map;for(const[f,i,d]of[...a].sort((h,m)=>h[0]-m[0])){const h=this.pct(f),m=u.get(h)??{props:{}};Object.assign(m.props,i),d&&(m.ease=d),u.set(h,m)}const r=[...u].map(([f,{props:i,ease:d}])=>{const h=Object.entries(i).map(([m,p])=>`${m}:${p}`);return d&&h.push(`animation-timing-function:${d}`),`${f}%{${h.join(";")}}`}).join("");return this.frames.push(`@keyframes ${o}{${r}}`),`animation-name:${o}`}vis(a,o=this.last,u={}){const r=u.f??qe.fade,f=u.on??{},i=u.off??{},d=u.within?Math.max(a+r,o-r):o;return this.kf([[0,{opacity:0,...i}],[a,{opacity:0,...i},u.ein??et.out],[a+r,{opacity:1,...f}],[d,{opacity:1,...f},et.inOut],[Math.min(d+r,this.total),{opacity:0,...i}],[this.total,{opacity:0,...i}]])}rise(a,o=this.last,u=!1){return this.vis(a,o,{on:{transform:"translateY(0)"},off:{transform:`translateY(${Y.rise}px)`},within:u})}pop(a,o=this.last){return this.vis(a,o,{f:qe.popFade,ein:et.pop,on:{transform:"scale(1)"},off:{transform:`scale(${Y.popFrom})`}})}until(a){const o=qe.untilFade;return this.kf([[0,{opacity:1}],[a,{opacity:1},et.inOut],[a+o,{opacity:0}],[this.last,{opacity:0}],[this.total,{opacity:1}]])}move(a,o=[]){return this.kf(a.map(([u,r,f,i=1,d])=>[u,{transform:`translate(${Em(r)}px,${Em(f)}px) scale(${i})`},d]).concat(o))}blink(a,o,u){return[[0,{opacity:0}],[a-.01,{opacity:0}],[a,{opacity:1}],[o,{opacity:1}],[o+u,{opacity:0}],[this.total,{opacity:0}]]}},We=a=>`font:${a.weight} ${a.size}px var(--${a.family})`,Ft=(a,o="var(--surf)")=>`color-mix(in srgb,var(--c) ${a}%,${o})`,Ie=Y.stroke,Ot=Y.mix,Tu=`color-mix(in srgb,var(--mute) ${Ot.past}%,var(--bg))`,ex=[".dg{display:block;width:100%;height:auto;overflow:visible}",".dg .dg-a{animation-duration:var(--T);animation-timing-function:linear;animation-iteration-count:infinite;animation-fill-mode:both;animation-delay:calc(var(--at,0) * -1s);animation-play-state:var(--play,running)}",".dg .dg-popc{transform-box:fill-box;transform-origin:center}",".dg-bg{fill:var(--bg)}",".dg-band{fill:color-mix(in srgb,var(--c) var(--tint),var(--bg));stroke:color-mix(in srgb,var(--c) var(--edge),transparent)}",`.dg-bi{fill:${Ft(Ot.regionIcon)};stroke:${Ft(Ot.regionIconEdge,"transparent")}}`,`.dg-bz{${We(pe.regionName)};fill:var(--ct)}`,`.dg-bx{${We(pe.regionNote)};fill:var(--mute)}`,".dg-st{fill:var(--surf);stroke:var(--hair)}",`.dg-halo{fill:none;stroke:var(--c);stroke-width:${Ie.halo};stroke-opacity:.16}`,`.dg-on{fill:none;stroke:var(--c);stroke-width:${Ie.on}}`,`.dg-ic{fill:${Ft(Ot.icon)}}`,`.dg-slot{fill:none;stroke:${Ft(Ot.slot,"transparent")};stroke-width:${Ie.slot};stroke-dasharray:3 3}`,`.dg-gl{fill:none;stroke:var(--c);stroke-width:${Ie.glyph};stroke-linecap:round;stroke-linejoin:round}`,`.dg-sn{${We(pe.boxName)};fill:var(--ink)}`,`.dg-ss{${We(pe.boxSub)};fill:var(--mute)}`,`.dg-ss-ok{${We(pe.boxSubStrong)};fill:var(--ct)}`,`.dg-ss-act{${We(pe.boxSubStrong)};fill:var(--ink)}`,`.dg-ll{stroke:var(--line);stroke-width:${Ie.lifeline};stroke-dasharray:3 4}`,`.dg-e{fill:none;stroke:var(--line);stroke-width:${Ie.edge};stroke-linecap:round;stroke-dasharray:0 ${Y.edge.ghostDash}}`,`.dg-eh{fill:none;stroke:var(--line);stroke-width:${Ie.arrow};stroke-linecap:round;stroke-linejoin:round}`,`.dg-e-on{fill:none;stroke:var(--c);stroke-width:${Ie.edgeOn};stroke-linecap:round;stroke-dasharray:1 2}`,`.dg-eh-on{fill:none;stroke:var(--c);stroke-width:${Ie.edgeOn};stroke-linecap:round;stroke-linejoin:round}`,`.dg-flow{fill:none;stroke:var(--surf);stroke-width:${Ie.flow};stroke-linecap:round;stroke-dasharray:1.5 ${Y.edge.flowDash}}`,`.dg-e-past{fill:none;stroke:${Tu};stroke-width:${Ie.edge};stroke-linecap:round}`,`.dg-eh-past{fill:none;stroke:${Tu};stroke-width:${Ie.arrow};stroke-linecap:round;stroke-linejoin:round}`,".dg-bd{cursor:pointer}",".dg-bdf{fill:var(--c)}",`.dg-bdft{${We(pe.badge)};fill:var(--on-c)}`,`.dg-bdr{fill:none;stroke:var(--c);stroke-width:${Ie.badgeRing};pointer-events:none}`,`.dg-bdp{fill:${Ft(Ot.badgePast)};stroke:${Ft(Ot.badgePastEdge,"transparent")};stroke-width:${Ie.hair}}`,`.dg-bdpt{${We(pe.badge)};fill:var(--ct)}`,`.dg-bdp-g{fill:var(--surf);stroke:${Tu};stroke-width:${Ie.hair}}`,`.dg-bdpt-g{${We(pe.badge)};fill:var(--mute)}`,`.dg-cap rect,.dg-act rect{fill:${Ft(Ot.cap)};stroke:${Ft(Ot.capEdge,"transparent")}}`,`.dg-cap text{${We(pe.label)};fill:var(--ct)}`,`.dg-capj text{${We(pe.labelJa)}}`,`.dg-cap-past text{${We(pe.label)};fill:var(--mute);fill-opacity:${Y.state.pastLabel}}`,`.dg-cap-pastj text{${We(pe.labelJa)}}`,`.dg-act text{${We(pe.action)};fill:var(--ct)}`,".dg-car{fill:var(--carry,var(--ink))}",`.dg-car-t{${We(pe.carrier)};fill:var(--bg)}`,`.dg-car-tj{${We(pe.carrierJa)}}`,`.dg-env{fill:var(--carry,var(--ink));stroke:var(--surf);stroke-width:${Ie.envelope}}`,`.dg-env-in{fill:none;stroke:var(--surf);stroke-width:${Ie.flow};stroke-linejoin:round;stroke-linecap:round}`,".dg-coin{fill:var(--coin);stroke:var(--surf);stroke-width:1.2}",".dg-coin-in{fill:none;stroke:var(--coinin);stroke-width:1.1}",".dg-strip{fill:var(--surf);stroke:var(--hair)}",`.dg-sep{stroke:var(--hair);stroke-width:${Ie.hair}}`,`.dg-sh{${We(pe.stripTitle)};fill:var(--ink)}`,`.dg-fl{${We(pe.fieldName)};fill:var(--mute)}`,`.dg-fv{${We(pe.fieldValue)};fill:var(--ink)}`,`.dg-fvj{${We(pe.fieldValueJa)};fill:var(--ink)}`,".dg-fv-c{fill:var(--ct)}",".dg-fl-now{fill:var(--c)}",`.dg-tr-ring{fill:none;stroke:var(--line);stroke-width:${Ie.trail}}`,".dg-tr-fill{fill:var(--c)}",".dg-tg rect{fill:var(--c)}",`.dg-tg text{${We(pe.tag)};fill:var(--on-c)}`,`.dg-side{fill:color-mix(in srgb,var(--c) ${Ot.side}%,var(--bg));stroke:${Ft(Ot.sideEdge,"transparent")};stroke-dasharray:4 4}`,`.dg-side-t{${We(pe.regionName)};fill:var(--ct)}`,`.dg-side-n{${We(pe.regionNote)};fill:var(--mute)}`,`.dg-ghost{fill:var(--surf);stroke:${Ft(Ot.ghostEdge,"transparent")};stroke-dasharray:4 3}`,`.dg-path{fill:none;stroke:${Ft(Ot.path,"transparent")};stroke-width:${Ie.path};stroke-linecap:round;stroke-dasharray:0 ${Y.edge.ghostDash}}`,`.dg-path-h{fill:none;stroke:${Ft(Ot.path,"transparent")};stroke-width:${Ie.arrow};stroke-linecap:round;stroke-linejoin:round}`,`.dg-path-t{${We(pe.label)};fill:var(--ct)}`,`.dg-path-tj{${We(pe.labelJa)}}`,".dg-start{fill:var(--ink)}",`.dg-end{fill:var(--bg);stroke:var(--ink);stroke-width:${Ie.end}}`,".dg-end-in{fill:var(--ink)}",`.dg-end-x{fill:var(--bg);stroke:${Ft(Ot.path,"transparent")};stroke-width:${Ie.arrow};stroke-dasharray:2 2.5}`,`.dg-end-xi{fill:${Ft(Ot.path,"transparent")}}`,`.dg-mark{${We(pe.regionNote)};fill:var(--mute)}`,`.dg-done{fill:var(--ink);stroke:var(--surf);stroke-width:${Ie.done}}`,`.dg-done-ck{fill:none;stroke:var(--surf);stroke-width:${Ie.glyph};stroke-linecap:round;stroke-linejoin:round}`,`.dg-git-l{fill:none;stroke:var(--c);stroke-width:${Ie.git};stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1 2}`,`.dg-git-cp{fill:none;stroke:var(--c);stroke-width:${Ie.gitOrphan};stroke-linecap:round;stroke-dasharray:3 3;stroke-opacity:.7}`,`.dg-git-c{fill:var(--surf);stroke:var(--c);stroke-width:${Ie.git}}`,`.dg-git-id{${We(pe.gitId)};fill:var(--ct)}`,`.dg-git-h{${We(pe.gitHash)};fill:var(--mute)}`,`.dg-git-n{${We(pe.gitNote)};fill:var(--ink2)}`,`.dg-git-old{fill:var(--surf);stroke:var(--c);stroke-width:${Ie.gitOrphan};stroke-dasharray:3 3;stroke-opacity:.6}`,`.dg-git-oldl{${We(pe.gitId)};fill:var(--ct);opacity:.55}`,".dg-vp-bg{fill:var(--bg)}",".dg-vp-frame{fill:none;stroke:var(--hair)}",".dg-hd-bg{fill:var(--bg)}",".dg-mm-bg{fill:var(--surf);stroke:var(--hair)}",`.dg-mm-t{${We(pe.miniTitle)};fill:var(--mute)}`,".dg-mm-world{fill:var(--sunk);stroke:var(--hair)}",`.dg-mm-band{fill:${Ft(Ot.miniBand)};stroke:${Ft(Ot.miniBandEdge,"transparent")};stroke-width:.6}`,`.dg-mm-card{fill:${Ft(Ot.mini)}}`,`.dg-mm-vp{fill:color-mix(in srgb,var(--ink) ${Ot.view}%,transparent);stroke:var(--ink);stroke-width:${Ie.badgeRing};vector-effect:non-scaling-stroke}`].join("");function tx(a){let o=2166136261;for(let u=0;u<a.length;u++)o^=a.charCodeAt(u),o=Math.imul(o,16777619);return(o>>>0).toString(36)}function nx(a){const o=new Map,u=(r,f)=>{o.set(r,(o.get(r)??new Set).add(f))};return a.steps.forEach((r,f)=>{for(const i of r.events)i.type==="edge"?(u(i.from,f),u(i.to,f)):(i.type==="action"||i.type==="swap")&&u(i.box,f)}),new Map([...o].map(([r,f])=>[r,[...f].sort((i,d)=>i-d)]))}function ax(a,o,u){const r=[];let f=0;for(const d of o.events){const h=a.steps[d.step]?.events[d.event];h?.type==="swap"&&r.push({t:d.at,order:f++,box:h.box,set:h.text}),u&&h?.type==="action"&&(r.push({t:d.at,order:f++,box:h.box,act:h.label}),r.push({t:o.steps[d.step].end,order:f++,box:h.box,act:null}))}r.sort((d,h)=>d.t-h.t||d.order-h.order);const i=new Map;for(const d of a.boxes){let h=[d.sub??"","dg-ss"],m,p=h.join("|");const y=[];for(const _ of r.filter(v=>v.box===d.id)){_.set!==void 0&&(h=[_.set,"dg-ss-ok"],m=void 0),_.act!==void 0&&(m=_.act??void 0);const v=m!==void 0?[m,"dg-ss-act"]:h;v.join("|")!==p&&(p=v.join("|"),y.push([_.t,v[0],v[1]]))}const w=y.filter((_,v)=>{const $=y[v+1];return $===void 0||$[0]-_[0]>=qe.minShow});i.set(d.id,w)}return i}function sx(a,o,u){const r=new Map;for(const f of o.events){const i=a.steps[f.step]?.events[f.event];if(i?.type!=="strip")continue;const d=u.badges[f.step]?.color??"slate",h=r.get(i.field)??[],m=o.steps[f.step].end;h.push({at:f.at,color:d,step:f.step,until:m,...i.value!==void 0?{value:i.value}:{},...i.tag!==void 0?{tag:i.tag}:{}}),r.set(i.field,h)}return r}function ox(a,o,u){if(a.until===void 0||!o.after)return o;const r=u[a.until].start,{after:f,...i}=o;return r>f.start?{...i,after:{start:f.start,end:Math.min(f.end,r)}}:i}function _g(a,o,u,r,f,i,d=[],h=[]){const m=tx(`${JSON.stringify(a)}|${r.id}|${f}|${i?`${i.width}|${i.lang}`:""}`),p=new Iv(`dg${m}`,u.total,u.last),y={m:p,t:u,sh:`filter="url(#dg-sh-${m})"`,end:u.steps[u.steps.length-1].end,ink:d,traces:h},w=nx(a),_=ax(a,u,o.kind!=="sequence"),v={band:[],base:[],lit:[],node:[],badge:[],top:[]};for(const R of o.regions)v.band.push(jv(R,d));const $=o.boxes.find(R=>R.ghost)?.color??"slate";o.side&&v.band.push(Uv(o.side,$,d));const j=(R,ge)=>o.boxes.find(we=>we.id===R&&(ge===void 0||we.ghost===ge))?.color;for(const R of o.paths)v.base.push(Hv(R,j(R.to,!0)??j(R.from)??$,d,h));for(const R of o.ends)v.node.push(Lv(R,$,d));const N=o.kind==="state",O=new Map((u.states??[]).flatMap(R=>R.lit[0]?[[R.box,R.lit[0].start]]:[]));o.strip&&v.band.push(Zv(o.strip,sx(a,u,o),y,N,O));for(const R of o.lifelines)v.base.push(Gv(R.x,R.y1,R.y2));if(dv(o)){const R=Pv(o,a,u,y);v.base.push(R.links),v.lit.push(R.lines),v.node.push(R.commits),v.top.push(R.tags)}for(const R of o.edges){const ge=u.edges.find(ke=>ke.step===R.step&&ke.event===R.event);if(!ge)continue;const we=Yv(R,ge,y,N);v.base.push(we.base),v.lit.push(we.lit)}const T=new Map((u.states??[]).map(R=>[R.box,R]));for(const R of o.boxes){if(R.ghost){v.node.push(Rv(R,d));continue}const ge=T.get(R.id);v.node.push(Bv(R,y,w.get(R.id)??[],_.get(R.id)??[],N?ge?.lit??[]:void 0)),ge?.done!==void 0&&v.node.push(qv(R,ge.done,y))}for(const R of o.badges)v.badge.push(Jv(R,y,N));for(const R of o.labels){const ge=u.labels.find(we=>we.step===R.step&&we.event===R.event);ge&&v.top.push(Fv(R,ox(R,ge,u.steps),y))}for(const R of o.actions){const ge=u.events.find(we=>we.step===R.step&&we.event===R.event);ge&&v.top.push(Xv(R,ge.at,u.steps[R.step].end,y))}for(const R of u.carriers){const ge=o.edges.find(we=>we.step===R.step&&we.event===R.event);ge&&v.top.push(Eg(ge,R,y))}const C=Object.values(v).map(R=>R.join("")).join(""),{near:H,far:ue,nearY:Z,farY:ie}=Y.shadow,U=`<filter id="dg-sh-${m}" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="${Z}" stdDeviation="${H}" style="flood-color:var(--sh);flood-opacity:var(--shA)"/><feDropShadow dx="0" dy="${ie}" stdDeviation="${ue}" style="flood-color:var(--sh);flood-opacity:var(--shB)"/></filter>`,fe=i&&o.kind==="sequence"?o.boxes.map(R=>zv(R,y,w.get(R.id)??[],_.get(R.id)??[])).join(""):"",re=i?rx(o,u,a,p,m,C,i,fe):{body:`<rect class="dg-bg" width="${o.width}" height="${o.height}" rx="${Y.region.radius}"/>${C}`,w:o.width,h:o.height},Ee=`.dg-${m}{${sg};--T:${u.total}s;${ag(r,f)}}${ex}${p.frames.join("")}`;return`<svg xmlns="http://www.w3.org/2000/svg" class="dg dg-${m}" viewBox="0 0 ${Math.ceil(re.w)} ${Math.ceil(re.h)}" width="${Math.ceil(re.w)}" height="${Math.ceil(re.h)}" role="img" aria-label="${jt(a.title)}" data-dragon="figure" data-view="${i?"follow":"fixed"}"><style>${Ee}</style><defs>${U}</defs>${re.body}</svg>`}function kg(a){const o=Math.min(...a.map(r=>r.x)),u=Math.min(...a.map(r=>r.y));return{x:o,y:u,w:Math.max(...a.map(r=>r.x+r.w))-o,h:Math.max(...a.map(r=>r.y+r.h))-u}}function ix(a,o,u){const r=Dg(a,o,u);return r.length===0?void 0:kg(r)}function lx(a,o,u,r){const f=Y.badge.r+Y.follow.badgeRoom,{x:i,y:d}=a,h=p=>Math.hypot(Math.max(0,p.x-i,i-p.x-p.w),Math.max(0,p.y-d,d-p.y-p.h));let m={x:i-f,y:d-f,w:f*2,h:f*2};for(const p of[...o].sort((y,w)=>h(y)-h(w))){const y=kg([m,p]);y.w<=u&&y.h<=r&&(m=y)}return m}function Dg(a,o,u){const r=[];for(const f of a.edges.filter(i=>i.step===u)){const i=f.points.map(h=>h[0]),d=f.points.map(h=>h[1]);r.push({x:Math.min(...i),y:Math.min(...d),w:Math.max(...i)-Math.min(...i),h:Math.max(...d)-Math.min(...d)})}r.push(...a.labels.filter(f=>f.step===u),...a.actions.filter(f=>f.step===u));for(const f of o.steps[u]?.events??[]){const i=f.type==="edge"?[f.from,f.to]:f.type==="action"||f.type==="swap"?[f.box]:[];for(const d of i){const h=a.boxes.find(m=>m.id===d);h&&(a.kind==="architecture"||f.type==="swap")&&r.push(h)}}return r}function rx(a,o,u,r,f,i,d,h){const m=Y.follow,p=Y.mini,y=Math.max(1,d.width),w=Math.min(a.width,y),_=li[d.lang].overview,v=W=>{const ae=Math.min(p.w,w*.4,W*.4/a.height*a.width),se=ae/a.width,xe=a.height*se,S=Math.max(ae,Math.ceil(Ye(_,pe.miniTitle)));return{vh:W,mw:ae,k:se,mh:xe,bw:S,bgW:S+p.pad*2,bgH:xe+p.pad*2+p.title,beside:xe>ae}},$=v(Math.min(a.height,Math.max(m.minH,w*m.aspect))),j=$.beside&&y<m.narrow,N=d.height===void 0?Number.POSITIVE_INFINITY:$.beside?d.height:d.height-$.bgH-p.inset,{vh:O,mw:T,k:C,mh:H,bw:ue,bgW:Z,bgH:ie,beside:U}=N<$.vh?v(Math.max(m.fitMinH,N)):{...$,vh:Number.isFinite(N)?Math.min(a.height,N):$.vh},fe=U&&!j?Math.min(a.width,y-Z-p.inset):w,re=W=>Math.min(a.width-fe/2,Math.max(fe/2,W)),Ee=h===""?0:Math.max(...a.boxes.map(W=>W.y+W.h))+m.headRoom,R=h===""?0:m.head.pad*2+m.head.h,ge=O-R,we=W=>Math.min(a.height-ge/2,Math.max(Ee+ge/2,W)),ke=Y.badge.r;let E=[a.width/2,a.height/2];const K=o.steps.map((W,ae)=>{const se=ix(a,u,ae);E=se?[se.x+se.w/2,se.y+se.h/2]:E;const xe=[re(E[0]),we(E[1])],S=a.badges.find(ee=>ee.step===ae);if(!S||Math.abs(S.x-xe[0])<=fe/2-ke&&Math.abs(S.y-xe[1])<=ge/2-ke)return xe;const F=lx(S,Dg(a,u,ae),fe,ge);return E=[F.x+F.w/2,F.y+F.h/2],[re(E[0]),we(E[1])]}).map(([W,ae])=>[W,ae-R/2]),P=K[0],he=[[0,P[0],P[1]],[o.steps[0].start,P[0],P[1]]];K.forEach((W,ae)=>{if(ae===0)return;const se=K[ae-1],xe=o.steps[ae].start;he.push([xe,se[0],se[1],1,et.inOut],[xe+m.ease,W[0],W[1]])});const k=K[K.length-1];he.push([o.last,k[0],k[1],1,et.inOut],[o.total,P[0],P[1]]);const X=r.move(he.map(([W,ae,se,xe,S])=>[W,fe/2-ae,O/2-se,xe,S])),ce=U?fe+p.inset:fe-Z-p.inset,ve=U?0:O+p.inset,Se=ce+p.pad,_e=Se+(ue-T)/2,Me=ve+p.pad+p.title,L=j?{clip:"",body:""}:(()=>{const W=[...a.regions.map(se=>`<rect class="dg-mm-band" style="${At(se.color)}" x="${_e+se.x*C}" y="${Me+se.y*C}" width="${se.w*C}" height="${se.h*C}" rx="3"/>`),...a.boxes.map(se=>`<rect class="dg-mm-card" style="${At(se.color)}" x="${_e+se.x*C}" y="${Me+se.y*C}" width="${se.w*C}" height="${se.h*C}" rx="1.5"/>`)].join(""),ae=r.move(he.map(([se,xe,S,,F])=>[se,_e+(xe-fe/2)*C,Me+(S-O/2)*C,1,F]));return{clip:`<clipPath id="dg-mm-${f}"><rect x="${_e}" y="${Me}" width="${T}" height="${H}" rx="4"/></clipPath>`,body:`<rect class="dg-mm-bg" x="${ce}" y="${ve}" width="${Z}" height="${ie}" rx="${p.radius}"/><text class="dg-mm-t" x="${Se}" y="${Me-p.pad+2}">${_}</text><g clip-path="url(#dg-mm-${f})"><rect class="dg-mm-world" x="${_e}" y="${Me}" width="${T}" height="${H}"/>${W}<rect class="dg-mm-vp dg-a"${R===0?"":` y="${R*C}"`} width="${fe*C}" height="${(O-R)*C}" rx="2" style="${ae}"/></g>`}})(),G=R===0?"":`<g class="dg-hd"><rect class="dg-hd-bg" width="${fe}" height="${R}"/><line class="dg-sep" x1="0" y1="${R}" x2="${fe}" y2="${R}"/><g class="dg-a" style="${r.move(he.map(([W,ae,,se,xe])=>[W,fe/2-ae,0,se,xe]))}">${h}</g></g>`;return{body:`<defs><clipPath id="dg-vp-${f}"><rect width="${fe}" height="${O}" rx="${Y.region.radius}"/></clipPath>${L.clip}</defs><g clip-path="url(#dg-vp-${f})"><rect class="dg-vp-bg" width="${fe}" height="${O}"/><g class="dg-a" style="${X}">${i}</g>${G}</g><rect class="dg-vp-frame" x="0.5" y="0.5" width="${fe-1}" height="${O-1}" rx="${Y.region.radius}"/>${L.body}`,w:U&&!j?fe+p.inset+Z:w,h:U?O:ve+ie}}function sd(a,o={}){const u=o.lang??"ja",r=ii(a,{lang:u});if(!r.ok)throw new Error(li[u].cannotDraw(r.errors.map(d=>`${d.pointer} ${d.message}`).join(" / ")));const f=r.diagram,i=f.kind==="sequence"?wv(f):f.kind==="state"?_v(f,u):f.kind==="git"?gv(f):ov(f);return cx(f,i,Tv(f),o)}function cx(a,o,u,r={}){const f=er(r.palette),i=r.theme==="dark"?"dark":"light",d=[],h=[];return{svg:_g(a,o,u,f,i,void 0,d,h),palette:f.id,theme:i,...a.view?{view:a.view}:{},fonts:{...ai},layout:o,timeline:u,diagram:a,overlaps:$v(d,u.stills,h)}}function _m(a,o,u){const r=Math.max(0,o)/a.layout.width,i=(u===void 0?r:Math.min(r,Math.max(0,u)/a.layout.height))*pe.boxName.size;return a.view?{mode:a.view,textPx:i}:{mode:i>=og?"fixed":"follow",textPx:i}}var _l=a=>`font:${a.weight} ${a.size}px var(--${a.family})`,wt=a=>`${a}px`;function ux(){const a=Y.player,o=wt(a.hidden);return[`.dg-player{display:flex;flex-direction:column;gap:${wt(a.gap)};color:var(--ink)}`,`.dg-player .dg-frame{border-radius:${wt(a.radius)};overflow:hidden}`,".dg-bar{container:dg-bar/inline-size}",`.dg-row{display:flex;align-items:flex-start;gap:${wt(a.gap)}}`,`.dg-btns{display:flex;gap:${wt(a.gap/2)};flex:none}`,`.dg-btn{width:${wt(a.button)};height:${wt(a.button)};border-radius:${wt(a.radius)};border:${wt(Y.stroke.hair)} solid var(--hair);background:var(--surf);color:var(--ink);${_l(pe.button)};cursor:pointer}`,`.dg-btn:focus-visible{outline:${wt(a.focus)} solid var(--c-blue);outline-offset:${wt(a.focus)}}`,`.dg-say{display:flex;gap:${wt(a.gap)};min-width:0}`,`.dg-no{${_l(pe.stepNo)};color:var(--mute);padding-top:${wt(a.focus)}}`,".dg-txt{display:grid;grid-template-columns:minmax(0,1fr);min-width:0}",".dg-txt>*{grid-area:1/1}",".dg-room{visibility:hidden}",`.dg-tt{${_l(pe.stepTitle)};margin:0}`,`.dg-tb{${_l(pe.stepBody)};color:var(--ink2);margin:0;white-space:pre-line}`,`.dg-sr{position:absolute;width:${o};height:${o};margin:-${o};padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}`,`@container dg-bar (width < ${wt(a.narrow)}){.dg-row{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;gap:0 ${wt(a.gap)}}.dg-say,.dg-txt,.dg-txt>*{display:contents}.dg-btns{grid-area:1/1;margin-bottom:${wt(a.gap/2)}}.dg-btn{width:${wt(a.touch)};height:${wt(a.touch)}}.dg-no{grid-area:1/2;display:flex;align-items:center;min-height:${wt(a.touch)};padding-top:0}.dg-tt{grid-area:2/1/3/3}.dg-tb{grid-area:3/1/4/3}}`,`@media (pointer: coarse){.dg-btn{width:${wt(a.touch)};height:${wt(a.touch)}}}`,`.dg-spot{fill:none;stroke:var(--t-amber);stroke-width:${wt(Y.stroke.mark)};stroke-dasharray:${Y.mark.dash} ${Y.mark.gap};pointer-events:none}`].join("")}function dx(a){if(a.getElementById("dragon-player-css"))return;const o=a.createElement("style");o.id="dragon-player-css",o.textContent=ux(),a.head.appendChild(o)}var Yo={prev:"‹",pause:"❚❚",play:"▶",next:"›"},km="http://www.w3.org/2000/svg",Dm=a=>String(a).padStart(2,"0"),fx=(a,o)=>`${Dm(a+1)}/${Dm(o)}`;function Tg(a,o,u={}){const r=a.ownerDocument,f=r.defaultView,i=!!f?.matchMedia?.("(prefers-reduced-motion: reduce)").matches,d=sd(o,u),h=u.lang??"ja",m=li[h],p=er(d.palette),{timeline:y}=d,w=d.diagram.steps,_=w.length;dx(r);const v=r.createElement("div");v.className="dg-player",v.dataset.dragon="player",v.setAttribute("style",`${sg};${ag(p,d.theme)}`);const $=r.createElement("div");$.className="dg-frame";const j=(te,be,Ne)=>{const Oe=r.createElement("button");return Oe.type="button",Oe.className="dg-btn",Oe.dataset.dragon=te,Oe.setAttribute("aria-label",be),Oe.textContent=Ne,Oe},N=j("prev",m.prev,Yo.prev),O=j("toggle",m.pause,Yo.pause),T=j("next",m.next,Yo.next),C=r.createElement("div");C.className="dg-btns",C.setAttribute("lang",h),C.append(N,O,T);const H=r.createElement("div");H.className="dg-say",H.setAttribute("aria-hidden","true");const ue=r.createElement("div");ue.className="dg-no",ue.dataset.dragon="step-no";const Z=r.createElement("div");Z.className="dg-txt";const ie=r.createElement("p");ie.className="dg-tt",ie.dataset.dragon="step-title";const U=r.createElement("p");U.className="dg-tb",U.dataset.dragon="step-body";const fe=r.createElement("div");fe.append(ie,U),Z.append(fe);for(const te of w){const be=r.createElement("div");be.className="dg-room",be.dataset.dragon="caption-room";const Ne=r.createElement("p");Ne.className="dg-tt",Ne.textContent=te.title;const Oe=r.createElement("p");Oe.className="dg-tb",Oe.textContent=te.body,be.append(Ne,Oe),Z.append(be)}H.append(ue,Z);for(const te of[ue,ie,U])te.setAttribute("aria-hidden","true");const re=r.createElement("div");re.className="dg-row",re.append(C,H);const Ee=r.createElement("div");Ee.className="dg-bar",Ee.append(re);const R=r.createElement("ol");R.className="dg-sr",R.dataset.dragon="steps",R.setAttribute("aria-label",m.steps(d.diagram.title));for(const te of w){const be=r.createElement("li"),Ne=r.createElement("strong");Ne.textContent=te.title,be.append(Ne);for(const Oe of te.body.split(`
`)){const Et=r.createElement("p");Et.textContent=Oe,be.append(Et)}R.append(be)}v.append($,Ee,R),a.append(v);const ge=()=>$.clientWidth||a.clientWidth||d.layout.width,we=()=>{if(!u.fitHeight||!f)return;const te=f.getComputedStyle($),be=$.clientHeight-(Number.parseFloat(te.paddingTop)||0)-(Number.parseFloat(te.paddingBottom)||0);return be>0?be:void 0};let ke=_m(d,ge(),we()).mode,E=ge(),z=we(),K=null,P=0,he=!i,k=i?y.stills[0]??0:0,X=Date.now(),ce=[];const ve=()=>{if(!K)return;for(const Ne of K.querySelectorAll(".dg-spots"))Ne.remove();if(ce.length===0)return;const te=Y.mark,be=r.createElementNS(km,"g");be.setAttribute("class","dg-spots");for(const Ne of ce){const Oe=r.createElementNS(km,"rect");Oe.setAttribute("class","dg-spot"),Oe.setAttribute("x",String(Ne.x-te.pad)),Oe.setAttribute("y",String(Ne.y-te.pad)),Oe.setAttribute("width",String(Ne.w+te.pad*2)),Oe.setAttribute("height",String(Ne.h+te.pad*2)),Oe.setAttribute("rx",String(te.radius)),be.append(Oe)}(K.querySelector('g[clip-path^="url(#dg-vp-"] > g.dg-a')??K).append(be)},Se=te=>{let be;if(te!==void 0){const Ne=r.createElement("div");Ne.innerHTML=te,be=Ne.querySelector("svg")}else be=K?K.cloneNode(!0):null;be&&(be.setAttribute("aria-hidden","true"),be.removeAttribute("role"),be.removeAttribute("aria-label"),be.style.setProperty("--at",String(k)),be.style.setProperty("--play",he?"running":"paused"),be.dataset.motion=he?"play":"still",K?K.replaceWith(be):$.append(be),K=be,X=Date.now(),ve())},_e=()=>ke==="follow"?_g(d.diagram,d.layout,y,p,d.theme,{width:E,...z===void 0?{}:{height:z},lang:h}):d.svg,Me=()=>he?(k+(Date.now()-X)/1e3)%y.total:k,Ge=te=>{let be=0;return y.steps.forEach((Ne,Oe)=>{Ne.start<=te&&(be=Oe)}),be},L=()=>{const te=w[P];ue.textContent=fx(P,_),ie.textContent=te?.title??"",U.textContent=te?.body??"",O.setAttribute("aria-label",he?m.pause:m.play),O.textContent=he?Yo.pause:Yo.play,u.onStep?.(P)},G=(te,be)=>{k=te,he=be,Se(),L()},A=te=>{P=Math.min(_-1,Math.max(0,te));const be=y.steps[P];G(he?be.start:y.stills[P]??be.start,he)};Se(_e()),L();const W=f?.setInterval(()=>{if(!he)return;const te=Ge(Me());te!==P&&(P=te,L())},120),ae=()=>A(P-1),se=()=>A(P+1),xe=()=>he?G(Me(),!1):G(k,!0),S=te=>{const be=te.target?.closest?.("[data-step]"),Ne=be?Number(be.getAttribute("data-step")):Number.NaN;Number.isInteger(Ne)&&A(Ne)};N.addEventListener("click",ae),T.addEventListener("click",se),O.addEventListener("click",xe),$.addEventListener("click",S);const F=f?.ResizeObserver,ee=F?new F(()=>{const te=ge(),be=we(),Ne=_m(d,te,be).mode;if(Ne===ke&&(ke==="fixed"||te===E&&be===z))return;const Oe=Me();ke=Ne,E=te,z=be,k=Oe,Se(_e())}):void 0;return ee?.observe($),{get step(){return P},get playing(){return he},next:se,prev:ae,play:()=>{he||G(k,!0)},pause:()=>{he&&G(Me(),!1)},goTo:te=>{he=!1,A(te)},mark:te=>{ce=te,ve()},destroy:()=>{W!==void 0&&f?.clearInterval(W),ee?.disconnect(),N.removeEventListener("click",ae),T.removeEventListener("click",se),O.removeEventListener("click",xe),$.removeEventListener("click",S),v.remove()}}}var Nu={exports:{}},He={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Tm;function hx(){if(Tm)return He;Tm=1;var a=Symbol.for("react.transitional.element"),o=Symbol.for("react.portal"),u=Symbol.for("react.fragment"),r=Symbol.for("react.strict_mode"),f=Symbol.for("react.profiler"),i=Symbol.for("react.consumer"),d=Symbol.for("react.context"),h=Symbol.for("react.forward_ref"),m=Symbol.for("react.suspense"),p=Symbol.for("react.memo"),y=Symbol.for("react.lazy"),w=Symbol.for("react.activity"),_=Symbol.iterator;function v(k){return k===null||typeof k!="object"?null:(k=_&&k[_]||k["@@iterator"],typeof k=="function"?k:null)}var $={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},j=Object.assign,N={};function O(k,X,ce){this.props=k,this.context=X,this.refs=N,this.updater=ce||$}O.prototype.isReactComponent={},O.prototype.setState=function(k,X){if(typeof k!="object"&&typeof k!="function"&&k!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,k,X,"setState")},O.prototype.forceUpdate=function(k){this.updater.enqueueForceUpdate(this,k,"forceUpdate")};function T(){}T.prototype=O.prototype;function C(k,X,ce){this.props=k,this.context=X,this.refs=N,this.updater=ce||$}var H=C.prototype=new T;H.constructor=C,j(H,O.prototype),H.isPureReactComponent=!0;var ue=Array.isArray;function Z(){}var ie={H:null,A:null,T:null,S:null},U=Object.prototype.hasOwnProperty;function fe(k,X,ce){var ve=ce.ref;return{$$typeof:a,type:k,key:X,ref:ve!==void 0?ve:null,props:ce}}function re(k,X){return fe(k.type,X,k.props)}function Ee(k){return typeof k=="object"&&k!==null&&k.$$typeof===a}function R(k){var X={"=":"=0",":":"=2"};return"$"+k.replace(/[=:]/g,function(ce){return X[ce]})}var ge=/\/+/g;function we(k,X){return typeof k=="object"&&k!==null&&k.key!=null?R(""+k.key):X.toString(36)}function ke(k){switch(k.status){case"fulfilled":return k.value;case"rejected":throw k.reason;default:switch(typeof k.status=="string"?k.then(Z,Z):(k.status="pending",k.then(function(X){k.status==="pending"&&(k.status="fulfilled",k.value=X)},function(X){k.status==="pending"&&(k.status="rejected",k.reason=X)})),k.status){case"fulfilled":return k.value;case"rejected":throw k.reason}}throw k}function E(k,X,ce,ve,Se){var _e=typeof k;(_e==="undefined"||_e==="boolean")&&(k=null);var Me=!1;if(k===null)Me=!0;else switch(_e){case"bigint":case"string":case"number":Me=!0;break;case"object":switch(k.$$typeof){case a:case o:Me=!0;break;case y:return Me=k._init,E(Me(k._payload),X,ce,ve,Se)}}if(Me)return Se=Se(k),Me=ve===""?"."+we(k,0):ve,ue(Se)?(ce="",Me!=null&&(ce=Me.replace(ge,"$&/")+"/"),E(Se,X,ce,"",function(G){return G})):Se!=null&&(Ee(Se)&&(Se=re(Se,ce+(Se.key==null||k&&k.key===Se.key?"":(""+Se.key).replace(ge,"$&/")+"/")+Me)),X.push(Se)),1;Me=0;var Ge=ve===""?".":ve+":";if(ue(k))for(var L=0;L<k.length;L++)ve=k[L],_e=Ge+we(ve,L),Me+=E(ve,X,ce,_e,Se);else if(L=v(k),typeof L=="function")for(k=L.call(k),L=0;!(ve=k.next()).done;)ve=ve.value,_e=Ge+we(ve,L++),Me+=E(ve,X,ce,_e,Se);else if(_e==="object"){if(typeof k.then=="function")return E(ke(k),X,ce,ve,Se);throw X=String(k),Error("Objects are not valid as a React child (found: "+(X==="[object Object]"?"object with keys {"+Object.keys(k).join(", ")+"}":X)+"). If you meant to render a collection of children, use an array instead.")}return Me}function z(k,X,ce){if(k==null)return k;var ve=[],Se=0;return E(k,ve,"","",function(_e){return X.call(ce,_e,Se++)}),ve}function K(k){if(k._status===-1){var X=k._result;X=X(),X.then(function(ce){(k._status===0||k._status===-1)&&(k._status=1,k._result=ce)},function(ce){(k._status===0||k._status===-1)&&(k._status=2,k._result=ce)}),k._status===-1&&(k._status=0,k._result=X)}if(k._status===1)return k._result.default;throw k._result}var P=typeof reportError=="function"?reportError:function(k){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var X=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof k=="object"&&k!==null&&typeof k.message=="string"?String(k.message):String(k),error:k});if(!window.dispatchEvent(X))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",k);return}console.error(k)},he={map:z,forEach:function(k,X,ce){z(k,function(){X.apply(this,arguments)},ce)},count:function(k){var X=0;return z(k,function(){X++}),X},toArray:function(k){return z(k,function(X){return X})||[]},only:function(k){if(!Ee(k))throw Error("React.Children.only expected to receive a single React element child.");return k}};return He.Activity=w,He.Children=he,He.Component=O,He.Fragment=u,He.Profiler=f,He.PureComponent=C,He.StrictMode=r,He.Suspense=m,He.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=ie,He.__COMPILER_RUNTIME={__proto__:null,c:function(k){return ie.H.useMemoCache(k)}},He.cache=function(k){return function(){return k.apply(null,arguments)}},He.cacheSignal=function(){return null},He.cloneElement=function(k,X,ce){if(k==null)throw Error("The argument must be a React element, but you passed "+k+".");var ve=j({},k.props),Se=k.key;if(X!=null)for(_e in X.key!==void 0&&(Se=""+X.key),X)!U.call(X,_e)||_e==="key"||_e==="__self"||_e==="__source"||_e==="ref"&&X.ref===void 0||(ve[_e]=X[_e]);var _e=arguments.length-2;if(_e===1)ve.children=ce;else if(1<_e){for(var Me=Array(_e),Ge=0;Ge<_e;Ge++)Me[Ge]=arguments[Ge+2];ve.children=Me}return fe(k.type,Se,ve)},He.createContext=function(k){return k={$$typeof:d,_currentValue:k,_currentValue2:k,_threadCount:0,Provider:null,Consumer:null},k.Provider=k,k.Consumer={$$typeof:i,_context:k},k},He.createElement=function(k,X,ce){var ve,Se={},_e=null;if(X!=null)for(ve in X.key!==void 0&&(_e=""+X.key),X)U.call(X,ve)&&ve!=="key"&&ve!=="__self"&&ve!=="__source"&&(Se[ve]=X[ve]);var Me=arguments.length-2;if(Me===1)Se.children=ce;else if(1<Me){for(var Ge=Array(Me),L=0;L<Me;L++)Ge[L]=arguments[L+2];Se.children=Ge}if(k&&k.defaultProps)for(ve in Me=k.defaultProps,Me)Se[ve]===void 0&&(Se[ve]=Me[ve]);return fe(k,_e,Se)},He.createRef=function(){return{current:null}},He.forwardRef=function(k){return{$$typeof:h,render:k}},He.isValidElement=Ee,He.lazy=function(k){return{$$typeof:y,_payload:{_status:-1,_result:k},_init:K}},He.memo=function(k,X){return{$$typeof:p,type:k,compare:X===void 0?null:X}},He.startTransition=function(k){var X=ie.T,ce={};ie.T=ce;try{var ve=k(),Se=ie.S;Se!==null&&Se(ce,ve),typeof ve=="object"&&ve!==null&&typeof ve.then=="function"&&ve.then(Z,P)}catch(_e){P(_e)}finally{X!==null&&ce.types!==null&&(X.types=ce.types),ie.T=X}},He.unstable_useCacheRefresh=function(){return ie.H.useCacheRefresh()},He.use=function(k){return ie.H.use(k)},He.useActionState=function(k,X,ce){return ie.H.useActionState(k,X,ce)},He.useCallback=function(k,X){return ie.H.useCallback(k,X)},He.useContext=function(k){return ie.H.useContext(k)},He.useDebugValue=function(){},He.useDeferredValue=function(k,X){return ie.H.useDeferredValue(k,X)},He.useEffect=function(k,X){return ie.H.useEffect(k,X)},He.useEffectEvent=function(k){return ie.H.useEffectEvent(k)},He.useId=function(){return ie.H.useId()},He.useImperativeHandle=function(k,X,ce){return ie.H.useImperativeHandle(k,X,ce)},He.useInsertionEffect=function(k,X){return ie.H.useInsertionEffect(k,X)},He.useLayoutEffect=function(k,X){return ie.H.useLayoutEffect(k,X)},He.useMemo=function(k,X){return ie.H.useMemo(k,X)},He.useOptimistic=function(k,X){return ie.H.useOptimistic(k,X)},He.useReducer=function(k,X,ce){return ie.H.useReducer(k,X,ce)},He.useRef=function(k){return ie.H.useRef(k)},He.useState=function(k){return ie.H.useState(k)},He.useSyncExternalStore=function(k,X,ce){return ie.H.useSyncExternalStore(k,X,ce)},He.useTransition=function(){return ie.H.useTransition()},He.version="19.2.7",He}var Nm;function od(){return Nm||(Nm=1,Nu.exports=hx()),Nu.exports}var Ae=od(),Mu={exports:{}},Fo={},$u={exports:{}},Ou={};/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Mm;function px(){return Mm||(Mm=1,(function(a){function o(E,z){var K=E.length;E.push(z);e:for(;0<K;){var P=K-1>>>1,he=E[P];if(0<f(he,z))E[P]=z,E[K]=he,K=P;else break e}}function u(E){return E.length===0?null:E[0]}function r(E){if(E.length===0)return null;var z=E[0],K=E.pop();if(K!==z){E[0]=K;e:for(var P=0,he=E.length,k=he>>>1;P<k;){var X=2*(P+1)-1,ce=E[X],ve=X+1,Se=E[ve];if(0>f(ce,K))ve<he&&0>f(Se,ce)?(E[P]=Se,E[ve]=K,P=ve):(E[P]=ce,E[X]=K,P=X);else if(ve<he&&0>f(Se,K))E[P]=Se,E[ve]=K,P=ve;else break e}}return z}function f(E,z){var K=E.sortIndex-z.sortIndex;return K!==0?K:E.id-z.id}if(a.unstable_now=void 0,typeof performance=="object"&&typeof performance.now=="function"){var i=performance;a.unstable_now=function(){return i.now()}}else{var d=Date,h=d.now();a.unstable_now=function(){return d.now()-h}}var m=[],p=[],y=1,w=null,_=3,v=!1,$=!1,j=!1,N=!1,O=typeof setTimeout=="function"?setTimeout:null,T=typeof clearTimeout=="function"?clearTimeout:null,C=typeof setImmediate<"u"?setImmediate:null;function H(E){for(var z=u(p);z!==null;){if(z.callback===null)r(p);else if(z.startTime<=E)r(p),z.sortIndex=z.expirationTime,o(m,z);else break;z=u(p)}}function ue(E){if(j=!1,H(E),!$)if(u(m)!==null)$=!0,Z||(Z=!0,R());else{var z=u(p);z!==null&&ke(ue,z.startTime-E)}}var Z=!1,ie=-1,U=5,fe=-1;function re(){return N?!0:!(a.unstable_now()-fe<U)}function Ee(){if(N=!1,Z){var E=a.unstable_now();fe=E;var z=!0;try{e:{$=!1,j&&(j=!1,T(ie),ie=-1),v=!0;var K=_;try{t:{for(H(E),w=u(m);w!==null&&!(w.expirationTime>E&&re());){var P=w.callback;if(typeof P=="function"){w.callback=null,_=w.priorityLevel;var he=P(w.expirationTime<=E);if(E=a.unstable_now(),typeof he=="function"){w.callback=he,H(E),z=!0;break t}w===u(m)&&r(m),H(E)}else r(m);w=u(m)}if(w!==null)z=!0;else{var k=u(p);k!==null&&ke(ue,k.startTime-E),z=!1}}break e}finally{w=null,_=K,v=!1}z=void 0}}finally{z?R():Z=!1}}}var R;if(typeof C=="function")R=function(){C(Ee)};else if(typeof MessageChannel<"u"){var ge=new MessageChannel,we=ge.port2;ge.port1.onmessage=Ee,R=function(){we.postMessage(null)}}else R=function(){O(Ee,0)};function ke(E,z){ie=O(function(){E(a.unstable_now())},z)}a.unstable_IdlePriority=5,a.unstable_ImmediatePriority=1,a.unstable_LowPriority=4,a.unstable_NormalPriority=3,a.unstable_Profiling=null,a.unstable_UserBlockingPriority=2,a.unstable_cancelCallback=function(E){E.callback=null},a.unstable_forceFrameRate=function(E){0>E||125<E?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):U=0<E?Math.floor(1e3/E):5},a.unstable_getCurrentPriorityLevel=function(){return _},a.unstable_next=function(E){switch(_){case 1:case 2:case 3:var z=3;break;default:z=_}var K=_;_=z;try{return E()}finally{_=K}},a.unstable_requestPaint=function(){N=!0},a.unstable_runWithPriority=function(E,z){switch(E){case 1:case 2:case 3:case 4:case 5:break;default:E=3}var K=_;_=E;try{return z()}finally{_=K}},a.unstable_scheduleCallback=function(E,z,K){var P=a.unstable_now();switch(typeof K=="object"&&K!==null?(K=K.delay,K=typeof K=="number"&&0<K?P+K:P):K=P,E){case 1:var he=-1;break;case 2:he=250;break;case 5:he=1073741823;break;case 4:he=1e4;break;default:he=5e3}return he=K+he,E={id:y++,callback:z,priorityLevel:E,startTime:K,expirationTime:he,sortIndex:-1},K>P?(E.sortIndex=K,o(p,E),u(m)===null&&E===u(p)&&(j?(T(ie),ie=-1):j=!0,ke(ue,K-P))):(E.sortIndex=he,o(m,E),$||v||($=!0,Z||(Z=!0,R()))),E},a.unstable_shouldYield=re,a.unstable_wrapCallback=function(E){var z=_;return function(){var K=_;_=z;try{return E.apply(this,arguments)}finally{_=K}}}})(Ou)),Ou}var $m;function mx(){return $m||($m=1,$u.exports=px()),$u.exports}var Cu={exports:{}},Qt={};/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Om;function gx(){if(Om)return Qt;Om=1;var a=od();function o(m){var p="https://react.dev/errors/"+m;if(1<arguments.length){p+="?args[]="+encodeURIComponent(arguments[1]);for(var y=2;y<arguments.length;y++)p+="&args[]="+encodeURIComponent(arguments[y])}return"Minified React error #"+m+"; visit "+p+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function u(){}var r={d:{f:u,r:function(){throw Error(o(522))},D:u,C:u,L:u,m:u,X:u,S:u,M:u},p:0,findDOMNode:null},f=Symbol.for("react.portal");function i(m,p,y){var w=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:f,key:w==null?null:""+w,children:m,containerInfo:p,implementation:y}}var d=a.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function h(m,p){if(m==="font")return"";if(typeof p=="string")return p==="use-credentials"?p:""}return Qt.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=r,Qt.createPortal=function(m,p){var y=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!p||p.nodeType!==1&&p.nodeType!==9&&p.nodeType!==11)throw Error(o(299));return i(m,p,null,y)},Qt.flushSync=function(m){var p=d.T,y=r.p;try{if(d.T=null,r.p=2,m)return m()}finally{d.T=p,r.p=y,r.d.f()}},Qt.preconnect=function(m,p){typeof m=="string"&&(p?(p=p.crossOrigin,p=typeof p=="string"?p==="use-credentials"?p:"":void 0):p=null,r.d.C(m,p))},Qt.prefetchDNS=function(m){typeof m=="string"&&r.d.D(m)},Qt.preinit=function(m,p){if(typeof m=="string"&&p&&typeof p.as=="string"){var y=p.as,w=h(y,p.crossOrigin),_=typeof p.integrity=="string"?p.integrity:void 0,v=typeof p.fetchPriority=="string"?p.fetchPriority:void 0;y==="style"?r.d.S(m,typeof p.precedence=="string"?p.precedence:void 0,{crossOrigin:w,integrity:_,fetchPriority:v}):y==="script"&&r.d.X(m,{crossOrigin:w,integrity:_,fetchPriority:v,nonce:typeof p.nonce=="string"?p.nonce:void 0})}},Qt.preinitModule=function(m,p){if(typeof m=="string")if(typeof p=="object"&&p!==null){if(p.as==null||p.as==="script"){var y=h(p.as,p.crossOrigin);r.d.M(m,{crossOrigin:y,integrity:typeof p.integrity=="string"?p.integrity:void 0,nonce:typeof p.nonce=="string"?p.nonce:void 0})}}else p==null&&r.d.M(m)},Qt.preload=function(m,p){if(typeof m=="string"&&typeof p=="object"&&p!==null&&typeof p.as=="string"){var y=p.as,w=h(y,p.crossOrigin);r.d.L(m,y,{crossOrigin:w,integrity:typeof p.integrity=="string"?p.integrity:void 0,nonce:typeof p.nonce=="string"?p.nonce:void 0,type:typeof p.type=="string"?p.type:void 0,fetchPriority:typeof p.fetchPriority=="string"?p.fetchPriority:void 0,referrerPolicy:typeof p.referrerPolicy=="string"?p.referrerPolicy:void 0,imageSrcSet:typeof p.imageSrcSet=="string"?p.imageSrcSet:void 0,imageSizes:typeof p.imageSizes=="string"?p.imageSizes:void 0,media:typeof p.media=="string"?p.media:void 0})}},Qt.preloadModule=function(m,p){if(typeof m=="string")if(p){var y=h(p.as,p.crossOrigin);r.d.m(m,{as:typeof p.as=="string"&&p.as!=="script"?p.as:void 0,crossOrigin:y,integrity:typeof p.integrity=="string"?p.integrity:void 0})}else r.d.m(m)},Qt.requestFormReset=function(m){r.d.r(m)},Qt.unstable_batchedUpdates=function(m,p){return m(p)},Qt.useFormState=function(m,p,y){return d.H.useFormState(m,p,y)},Qt.useFormStatus=function(){return d.H.useHostTransitionStatus()},Qt.version="19.2.7",Qt}var Cm;function yx(){if(Cm)return Cu.exports;Cm=1;function a(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a)}catch(o){console.error(o)}}return a(),Cu.exports=gx(),Cu.exports}/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var jm;function bx(){if(jm)return Fo;jm=1;var a=mx(),o=od(),u=yx();function r(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function f(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function i(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function d(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function h(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function m(e){if(i(e)!==e)throw Error(r(188))}function p(e){var t=e.alternate;if(!t){if(t=i(e),t===null)throw Error(r(188));return t!==e?null:e}for(var n=e,s=t;;){var l=n.return;if(l===null)break;var c=l.alternate;if(c===null){if(s=l.return,s!==null){n=s;continue}break}if(l.child===c.child){for(c=l.child;c;){if(c===n)return m(l),e;if(c===s)return m(l),t;c=c.sibling}throw Error(r(188))}if(n.return!==s.return)n=l,s=c;else{for(var g=!1,x=l.child;x;){if(x===n){g=!0,n=l,s=c;break}if(x===s){g=!0,s=l,n=c;break}x=x.sibling}if(!g){for(x=c.child;x;){if(x===n){g=!0,n=c,s=l;break}if(x===s){g=!0,s=c,n=l;break}x=x.sibling}if(!g)throw Error(r(189))}}if(n.alternate!==s)throw Error(r(190))}if(n.tag!==3)throw Error(r(188));return n.stateNode.current===n?e:t}function y(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=y(e),t!==null)return t;e=e.sibling}return null}var w=Object.assign,_=Symbol.for("react.element"),v=Symbol.for("react.transitional.element"),$=Symbol.for("react.portal"),j=Symbol.for("react.fragment"),N=Symbol.for("react.strict_mode"),O=Symbol.for("react.profiler"),T=Symbol.for("react.consumer"),C=Symbol.for("react.context"),H=Symbol.for("react.forward_ref"),ue=Symbol.for("react.suspense"),Z=Symbol.for("react.suspense_list"),ie=Symbol.for("react.memo"),U=Symbol.for("react.lazy"),fe=Symbol.for("react.activity"),re=Symbol.for("react.memo_cache_sentinel"),Ee=Symbol.iterator;function R(e){return e===null||typeof e!="object"?null:(e=Ee&&e[Ee]||e["@@iterator"],typeof e=="function"?e:null)}var ge=Symbol.for("react.client.reference");function we(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===ge?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case j:return"Fragment";case O:return"Profiler";case N:return"StrictMode";case ue:return"Suspense";case Z:return"SuspenseList";case fe:return"Activity"}if(typeof e=="object")switch(e.$$typeof){case $:return"Portal";case C:return e.displayName||"Context";case T:return(e._context.displayName||"Context")+".Consumer";case H:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case ie:return t=e.displayName||null,t!==null?t:we(e.type)||"Memo";case U:t=e._payload,e=e._init;try{return we(e(t))}catch{}}return null}var ke=Array.isArray,E=o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,z=u.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,K={pending:!1,data:null,method:null,action:null},P=[],he=-1;function k(e){return{current:e}}function X(e){0>he||(e.current=P[he],P[he]=null,he--)}function ce(e,t){he++,P[he]=e.current,e.current=t}var ve=k(null),Se=k(null),_e=k(null),Me=k(null);function Ge(e,t){switch(ce(_e,t),ce(Se,e),ce(ve,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?$p(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=$p(t),e=Op(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}X(ve),ce(ve,e)}function L(){X(ve),X(Se),X(_e)}function G(e){e.memoizedState!==null&&ce(Me,e);var t=ve.current,n=Op(t,e.type);t!==n&&(ce(Se,e),ce(ve,n))}function A(e){Se.current===e&&(X(ve),X(Se)),Me.current===e&&(X(Me),qo._currentValue=K)}var W,ae;function se(e){if(W===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);W=t&&t[1]||"",ae=-1<n.stack.indexOf(`
    at`)?" (<anonymous>)":-1<n.stack.indexOf("@")?"@unknown:0:0":""}return`
`+W+e+ae}var xe=!1;function S(e,t){if(!e||xe)return"";xe=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var s={DetermineComponentFrameRoot:function(){try{if(t){var de=function(){throw Error()};if(Object.defineProperty(de.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(de,[])}catch(I){var J=I}Reflect.construct(e,[],de)}else{try{de.call()}catch(I){J=I}e.call(de.prototype)}}else{try{throw Error()}catch(I){J=I}(de=e())&&typeof de.catch=="function"&&de.catch(function(){})}}catch(I){if(I&&J&&typeof I.stack=="string")return[I.stack,J.stack]}return[null,null]}};s.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var l=Object.getOwnPropertyDescriptor(s.DetermineComponentFrameRoot,"name");l&&l.configurable&&Object.defineProperty(s.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var c=s.DetermineComponentFrameRoot(),g=c[0],x=c[1];if(g&&x){var M=g.split(`
`),Q=x.split(`
`);for(l=s=0;s<M.length&&!M[s].includes("DetermineComponentFrameRoot");)s++;for(;l<Q.length&&!Q[l].includes("DetermineComponentFrameRoot");)l++;if(s===M.length||l===Q.length)for(s=M.length-1,l=Q.length-1;1<=s&&0<=l&&M[s]!==Q[l];)l--;for(;1<=s&&0<=l;s--,l--)if(M[s]!==Q[l]){if(s!==1||l!==1)do if(s--,l--,0>l||M[s]!==Q[l]){var oe=`
`+M[s].replace(" at new "," at ");return e.displayName&&oe.includes("<anonymous>")&&(oe=oe.replace("<anonymous>",e.displayName)),oe}while(1<=s&&0<=l);break}}}finally{xe=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:"")?se(n):""}function F(e,t){switch(e.tag){case 26:case 27:case 5:return se(e.type);case 16:return se("Lazy");case 13:return e.child!==t&&t!==null?se("Suspense Fallback"):se("Suspense");case 19:return se("SuspenseList");case 0:case 15:return S(e.type,!1);case 11:return S(e.type.render,!1);case 1:return S(e.type,!0);case 31:return se("Activity");default:return""}}function ee(e){try{var t="",n=null;do t+=F(e,n),n=e,e=e.return;while(e);return t}catch(s){return`
Error generating stack: `+s.message+`
`+s.stack}}var te=Object.prototype.hasOwnProperty,be=a.unstable_scheduleCallback,Ne=a.unstable_cancelCallback,Oe=a.unstable_shouldYield,Et=a.unstable_requestPaint,nt=a.unstable_now,pt=a.unstable_getCurrentPriorityLevel,Rt=a.unstable_ImmediatePriority,Jt=a.unstable_UserBlockingPriority,yt=a.unstable_NormalPriority,qt=a.unstable_LowPriority,Wt=a.unstable_IdlePriority,dn=a.log,Ha=a.unstable_setDisableYieldValue,Mn=null,Vt=null;function It(e){if(typeof dn=="function"&&Ha(e),Vt&&typeof Vt.setStrictMode=="function")try{Vt.setStrictMode(Mn,e)}catch{}}var Zt=Math.clz32?Math.clz32:me,D=Math.log,ne=Math.LN2;function me(e){return e>>>=0,e===0?32:31-(D(e)/ne|0)|0}var ze=256,je=262144,Re=4194304;function _t(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&261888;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function at(e,t,n){var s=e.pendingLanes;if(s===0)return 0;var l=0,c=e.suspendedLanes,g=e.pingedLanes;e=e.warmLanes;var x=s&134217727;return x!==0?(s=x&~c,s!==0?l=_t(s):(g&=x,g!==0?l=_t(g):n||(n=x&~e,n!==0&&(l=_t(n))))):(x=s&~c,x!==0?l=_t(x):g!==0?l=_t(g):n||(n=s&~e,n!==0&&(l=_t(n)))),l===0?0:t!==0&&t!==l&&(t&c)===0&&(c=l&-l,n=t&-t,c>=n||c===32&&(n&4194048)!==0)?t:l}function bt(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function Bn(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function zn(){var e=Re;return Re<<=1,(Re&62914560)===0&&(Re=4194304),e}function fn(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function ua(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function di(e,t,n,s,l,c){var g=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var x=e.entanglements,M=e.expirationTimes,Q=e.hiddenUpdates;for(n=g&~n;0<n;){var oe=31-Zt(n),de=1<<oe;x[oe]=0,M[oe]=-1;var J=Q[oe];if(J!==null)for(Q[oe]=null,oe=0;oe<J.length;oe++){var I=J[oe];I!==null&&(I.lane&=-536870913)}n&=~de}s!==0&&fd(e,s,0),c!==0&&l===0&&e.tag!==0&&(e.suspendedLanes|=c&~(g&~t))}function fd(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var s=31-Zt(t);e.entangledLanes|=t,e.entanglements[s]=e.entanglements[s]|1073741824|n&261930}function hd(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var s=31-Zt(n),l=1<<s;l&t|e[s]&t&&(e[s]|=t),n&=~l}}function pd(e,t){var n=t&-t;return n=(n&42)!==0?1:ur(n),(n&(e.suspendedLanes|t))!==0?0:n}function ur(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function dr(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function md(){var e=z.p;return e!==0?e:(e=window.event,e===void 0?32:tm(e.type))}function gd(e,t){var n=z.p;try{return z.p=e,t()}finally{z.p=n}}var da=Math.random().toString(36).slice(2),Ht="__reactFiber$"+da,en="__reactProps$"+da,ds="__reactContainer$"+da,fr="__reactEvents$"+da,Pg="__reactListeners$"+da,Wg="__reactHandles$"+da,yd="__reactResources$"+da,Ws="__reactMarker$"+da;function hr(e){delete e[Ht],delete e[en],delete e[fr],delete e[Pg],delete e[Wg]}function fs(e){var t=e[Ht];if(t)return t;for(var n=e.parentNode;n;){if(t=n[ds]||n[Ht]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Hp(e);e!==null;){if(n=e[Ht])return n;e=Hp(e)}return t}e=n,n=e.parentNode}return null}function hs(e){if(e=e[Ht]||e[ds]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function Is(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(r(33))}function ps(e){var t=e[yd];return t||(t=e[yd]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function Bt(e){e[Ws]=!0}var bd=new Set,vd={};function Ua(e,t){ms(e,t),ms(e+"Capture",t)}function ms(e,t){for(vd[e]=t,e=0;e<t.length;e++)bd.add(t[e])}var Ig=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),xd={},wd={};function e0(e){return te.call(wd,e)?!0:te.call(xd,e)?!1:Ig.test(e)?wd[e]=!0:(xd[e]=!0,!1)}function fi(e,t,n){if(e0(t))if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var s=t.toLowerCase().slice(0,5);if(s!=="data-"&&s!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,""+n)}}function hi(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,""+n)}}function Yn(e,t,n,s){if(s===null)e.removeAttribute(n);else{switch(typeof s){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(n);return}e.setAttributeNS(t,n,""+s)}}function xn(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Sd(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function t0(e,t,n){var s=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof s<"u"&&typeof s.get=="function"&&typeof s.set=="function"){var l=s.get,c=s.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return l.call(this)},set:function(g){n=""+g,c.call(this,g)}}),Object.defineProperty(e,t,{enumerable:s.enumerable}),{getValue:function(){return n},setValue:function(g){n=""+g},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function pr(e){if(!e._valueTracker){var t=Sd(e)?"checked":"value";e._valueTracker=t0(e,t,""+e[t])}}function Ad(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),s="";return e&&(s=Sd(e)?e.checked?"true":"false":e.value),e=s,e!==n?(t.setValue(e),!0):!1}function pi(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}var n0=/[\n"\\]/g;function wn(e){return e.replace(n0,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function mr(e,t,n,s,l,c,g,x){e.name="",g!=null&&typeof g!="function"&&typeof g!="symbol"&&typeof g!="boolean"?e.type=g:e.removeAttribute("type"),t!=null?g==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+xn(t)):e.value!==""+xn(t)&&(e.value=""+xn(t)):g!=="submit"&&g!=="reset"||e.removeAttribute("value"),t!=null?gr(e,g,xn(t)):n!=null?gr(e,g,xn(n)):s!=null&&e.removeAttribute("value"),l==null&&c!=null&&(e.defaultChecked=!!c),l!=null&&(e.checked=l&&typeof l!="function"&&typeof l!="symbol"),x!=null&&typeof x!="function"&&typeof x!="symbol"&&typeof x!="boolean"?e.name=""+xn(x):e.removeAttribute("name")}function Ed(e,t,n,s,l,c,g,x){if(c!=null&&typeof c!="function"&&typeof c!="symbol"&&typeof c!="boolean"&&(e.type=c),t!=null||n!=null){if(!(c!=="submit"&&c!=="reset"||t!=null)){pr(e);return}n=n!=null?""+xn(n):"",t=t!=null?""+xn(t):n,x||t===e.value||(e.value=t),e.defaultValue=t}s=s??l,s=typeof s!="function"&&typeof s!="symbol"&&!!s,e.checked=x?e.checked:!!s,e.defaultChecked=!!s,g!=null&&typeof g!="function"&&typeof g!="symbol"&&typeof g!="boolean"&&(e.name=g),pr(e)}function gr(e,t,n){t==="number"&&pi(e.ownerDocument)===e||e.defaultValue===""+n||(e.defaultValue=""+n)}function gs(e,t,n,s){if(e=e.options,t){t={};for(var l=0;l<n.length;l++)t["$"+n[l]]=!0;for(n=0;n<e.length;n++)l=t.hasOwnProperty("$"+e[n].value),e[n].selected!==l&&(e[n].selected=l),l&&s&&(e[n].defaultSelected=!0)}else{for(n=""+xn(n),t=null,l=0;l<e.length;l++){if(e[l].value===n){e[l].selected=!0,s&&(e[l].defaultSelected=!0);return}t!==null||e[l].disabled||(t=e[l])}t!==null&&(t.selected=!0)}}function _d(e,t,n){if(t!=null&&(t=""+xn(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n!=null?""+xn(n):""}function kd(e,t,n,s){if(t==null){if(s!=null){if(n!=null)throw Error(r(92));if(ke(s)){if(1<s.length)throw Error(r(93));s=s[0]}n=s}n==null&&(n=""),t=n}n=xn(t),e.defaultValue=n,s=e.textContent,s===n&&s!==""&&s!==null&&(e.value=s),pr(e)}function ys(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var a0=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Dd(e,t,n){var s=t.indexOf("--")===0;n==null||typeof n=="boolean"||n===""?s?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":s?e.setProperty(t,n):typeof n!="number"||n===0||a0.has(t)?t==="float"?e.cssFloat=n:e[t]=(""+n).trim():e[t]=n+"px"}function Td(e,t,n){if(t!=null&&typeof t!="object")throw Error(r(62));if(e=e.style,n!=null){for(var s in n)!n.hasOwnProperty(s)||t!=null&&t.hasOwnProperty(s)||(s.indexOf("--")===0?e.setProperty(s,""):s==="float"?e.cssFloat="":e[s]="");for(var l in t)s=t[l],t.hasOwnProperty(l)&&n[l]!==s&&Dd(e,l,s)}else for(var c in t)t.hasOwnProperty(c)&&Dd(e,c,t[c])}function yr(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var s0=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),o0=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function mi(e){return o0.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function Fn(){}var br=null;function vr(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var bs=null,vs=null;function Nd(e){var t=hs(e);if(t&&(e=t.stateNode)){var n=e[en]||null;e:switch(e=t.stateNode,t.type){case"input":if(mr(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll('input[name="'+wn(""+t)+'"][type="radio"]'),t=0;t<n.length;t++){var s=n[t];if(s!==e&&s.form===e.form){var l=s[en]||null;if(!l)throw Error(r(90));mr(s,l.value,l.defaultValue,l.defaultValue,l.checked,l.defaultChecked,l.type,l.name)}}for(t=0;t<n.length;t++)s=n[t],s.form===e.form&&Ad(s)}break e;case"textarea":_d(e,n.value,n.defaultValue);break e;case"select":t=n.value,t!=null&&gs(e,!!n.multiple,t,!1)}}}var xr=!1;function Md(e,t,n){if(xr)return e(t,n);xr=!0;try{var s=e(t);return s}finally{if(xr=!1,(bs!==null||vs!==null)&&(nl(),bs&&(t=bs,e=vs,vs=bs=null,Nd(t),e)))for(t=0;t<e.length;t++)Nd(e[t])}}function eo(e,t){var n=e.stateNode;if(n===null)return null;var s=n[en]||null;if(s===null)return null;n=s[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(s=!s.disabled)||(e=e.type,s=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!s;break e;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(r(231,t,typeof n));return n}var Xn=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),wr=!1;if(Xn)try{var to={};Object.defineProperty(to,"passive",{get:function(){wr=!0}}),window.addEventListener("test",to,to),window.removeEventListener("test",to,to)}catch{wr=!1}var fa=null,Sr=null,gi=null;function $d(){if(gi)return gi;var e,t=Sr,n=t.length,s,l="value"in fa?fa.value:fa.textContent,c=l.length;for(e=0;e<n&&t[e]===l[e];e++);var g=n-e;for(s=1;s<=g&&t[n-s]===l[c-s];s++);return gi=l.slice(e,1<s?1-s:void 0)}function yi(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function bi(){return!0}function Od(){return!1}function tn(e){function t(n,s,l,c,g){this._reactName=n,this._targetInst=l,this.type=s,this.nativeEvent=c,this.target=g,this.currentTarget=null;for(var x in e)e.hasOwnProperty(x)&&(n=e[x],this[x]=n?n(c):c[x]);return this.isDefaultPrevented=(c.defaultPrevented!=null?c.defaultPrevented:c.returnValue===!1)?bi:Od,this.isPropagationStopped=Od,this}return w(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=bi)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=bi)},persist:function(){},isPersistent:bi}),t}var La={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},vi=tn(La),no=w({},La,{view:0,detail:0}),i0=tn(no),Ar,Er,ao,xi=w({},no,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:kr,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==ao&&(ao&&e.type==="mousemove"?(Ar=e.screenX-ao.screenX,Er=e.screenY-ao.screenY):Er=Ar=0,ao=e),Ar)},movementY:function(e){return"movementY"in e?e.movementY:Er}}),Cd=tn(xi),l0=w({},xi,{dataTransfer:0}),r0=tn(l0),c0=w({},no,{relatedTarget:0}),_r=tn(c0),u0=w({},La,{animationName:0,elapsedTime:0,pseudoElement:0}),d0=tn(u0),f0=w({},La,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),h0=tn(f0),p0=w({},La,{data:0}),jd=tn(p0),m0={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},g0={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},y0={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function b0(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=y0[e])?!!t[e]:!1}function kr(){return b0}var v0=w({},no,{key:function(e){if(e.key){var t=m0[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=yi(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?g0[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:kr,charCode:function(e){return e.type==="keypress"?yi(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?yi(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),x0=tn(v0),w0=w({},xi,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Bd=tn(w0),S0=w({},no,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:kr}),A0=tn(S0),E0=w({},La,{propertyName:0,elapsedTime:0,pseudoElement:0}),_0=tn(E0),k0=w({},xi,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),D0=tn(k0),T0=w({},La,{newState:0,oldState:0}),N0=tn(T0),M0=[9,13,27,32],Dr=Xn&&"CompositionEvent"in window,so=null;Xn&&"documentMode"in document&&(so=document.documentMode);var $0=Xn&&"TextEvent"in window&&!so,zd=Xn&&(!Dr||so&&8<so&&11>=so),Rd=" ",qd=!1;function Hd(e,t){switch(e){case"keyup":return M0.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Ud(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var xs=!1;function O0(e,t){switch(e){case"compositionend":return Ud(t);case"keypress":return t.which!==32?null:(qd=!0,Rd);case"textInput":return e=t.data,e===Rd&&qd?null:e;default:return null}}function C0(e,t){if(xs)return e==="compositionend"||!Dr&&Hd(e,t)?(e=$d(),gi=Sr=fa=null,xs=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return zd&&t.locale!=="ko"?null:t.data;default:return null}}var j0={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Ld(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!j0[e.type]:t==="textarea"}function Gd(e,t,n,s){bs?vs?vs.push(s):vs=[s]:bs=s,t=cl(t,"onChange"),0<t.length&&(n=new vi("onChange","change",null,n,s),e.push({event:n,listeners:t}))}var oo=null,io=null;function B0(e){_p(e,0)}function wi(e){var t=Is(e);if(Ad(t))return e}function Yd(e,t){if(e==="change")return t}var Fd=!1;if(Xn){var Tr;if(Xn){var Nr="oninput"in document;if(!Nr){var Xd=document.createElement("div");Xd.setAttribute("oninput","return;"),Nr=typeof Xd.oninput=="function"}Tr=Nr}else Tr=!1;Fd=Tr&&(!document.documentMode||9<document.documentMode)}function Vd(){oo&&(oo.detachEvent("onpropertychange",Qd),io=oo=null)}function Qd(e){if(e.propertyName==="value"&&wi(io)){var t=[];Gd(t,io,e,vr(e)),Md(B0,t)}}function z0(e,t,n){e==="focusin"?(Vd(),oo=t,io=n,oo.attachEvent("onpropertychange",Qd)):e==="focusout"&&Vd()}function R0(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return wi(io)}function q0(e,t){if(e==="click")return wi(t)}function H0(e,t){if(e==="input"||e==="change")return wi(t)}function U0(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var hn=typeof Object.is=="function"?Object.is:U0;function lo(e,t){if(hn(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),s=Object.keys(t);if(n.length!==s.length)return!1;for(s=0;s<n.length;s++){var l=n[s];if(!te.call(t,l)||!hn(e[l],t[l]))return!1}return!0}function Jd(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Zd(e,t){var n=Jd(e);e=0;for(var s;n;){if(n.nodeType===3){if(s=e+n.textContent.length,e<=t&&s>=t)return{node:n,offset:t-e};e=s}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=Jd(n)}}function Kd(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Kd(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function Pd(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=pi(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=pi(e.document)}return t}function Mr(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var L0=Xn&&"documentMode"in document&&11>=document.documentMode,ws=null,$r=null,ro=null,Or=!1;function Wd(e,t,n){var s=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Or||ws==null||ws!==pi(s)||(s=ws,"selectionStart"in s&&Mr(s)?s={start:s.selectionStart,end:s.selectionEnd}:(s=(s.ownerDocument&&s.ownerDocument.defaultView||window).getSelection(),s={anchorNode:s.anchorNode,anchorOffset:s.anchorOffset,focusNode:s.focusNode,focusOffset:s.focusOffset}),ro&&lo(ro,s)||(ro=s,s=cl($r,"onSelect"),0<s.length&&(t=new vi("onSelect","select",null,t,n),e.push({event:t,listeners:s}),t.target=ws)))}function Ga(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var Ss={animationend:Ga("Animation","AnimationEnd"),animationiteration:Ga("Animation","AnimationIteration"),animationstart:Ga("Animation","AnimationStart"),transitionrun:Ga("Transition","TransitionRun"),transitionstart:Ga("Transition","TransitionStart"),transitioncancel:Ga("Transition","TransitionCancel"),transitionend:Ga("Transition","TransitionEnd")},Cr={},Id={};Xn&&(Id=document.createElement("div").style,"AnimationEvent"in window||(delete Ss.animationend.animation,delete Ss.animationiteration.animation,delete Ss.animationstart.animation),"TransitionEvent"in window||delete Ss.transitionend.transition);function Ya(e){if(Cr[e])return Cr[e];if(!Ss[e])return e;var t=Ss[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in Id)return Cr[e]=t[n];return e}var ef=Ya("animationend"),tf=Ya("animationiteration"),nf=Ya("animationstart"),G0=Ya("transitionrun"),Y0=Ya("transitionstart"),F0=Ya("transitioncancel"),af=Ya("transitionend"),sf=new Map,jr="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");jr.push("scrollEnd");function $n(e,t){sf.set(e,t),Ua(t,[e])}var Si=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Sn=[],As=0,Br=0;function Ai(){for(var e=As,t=Br=As=0;t<e;){var n=Sn[t];Sn[t++]=null;var s=Sn[t];Sn[t++]=null;var l=Sn[t];Sn[t++]=null;var c=Sn[t];if(Sn[t++]=null,s!==null&&l!==null){var g=s.pending;g===null?l.next=l:(l.next=g.next,g.next=l),s.pending=l}c!==0&&of(n,l,c)}}function Ei(e,t,n,s){Sn[As++]=e,Sn[As++]=t,Sn[As++]=n,Sn[As++]=s,Br|=s,e.lanes|=s,e=e.alternate,e!==null&&(e.lanes|=s)}function zr(e,t,n,s){return Ei(e,t,n,s),_i(e)}function Fa(e,t){return Ei(e,null,null,t),_i(e)}function of(e,t,n){e.lanes|=n;var s=e.alternate;s!==null&&(s.lanes|=n);for(var l=!1,c=e.return;c!==null;)c.childLanes|=n,s=c.alternate,s!==null&&(s.childLanes|=n),c.tag===22&&(e=c.stateNode,e===null||e._visibility&1||(l=!0)),e=c,c=c.return;return e.tag===3?(c=e.stateNode,l&&t!==null&&(l=31-Zt(n),e=c.hiddenUpdates,s=e[l],s===null?e[l]=[t]:s.push(t),t.lane=n|536870912),c):null}function _i(e){if(50<$o)throw $o=0,Xc=null,Error(r(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var Es={};function X0(e,t,n,s){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=s,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function pn(e,t,n,s){return new X0(e,t,n,s)}function Rr(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Vn(e,t){var n=e.alternate;return n===null?(n=pn(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&65011712,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function lf(e,t){e.flags&=65011714;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function ki(e,t,n,s,l,c){var g=0;if(s=e,typeof e=="function")Rr(e)&&(g=1);else if(typeof e=="string")g=Ky(e,n,ve.current)?26:e==="html"||e==="head"||e==="body"?27:5;else e:switch(e){case fe:return e=pn(31,n,t,l),e.elementType=fe,e.lanes=c,e;case j:return Xa(n.children,l,c,t);case N:g=8,l|=24;break;case O:return e=pn(12,n,t,l|2),e.elementType=O,e.lanes=c,e;case ue:return e=pn(13,n,t,l),e.elementType=ue,e.lanes=c,e;case Z:return e=pn(19,n,t,l),e.elementType=Z,e.lanes=c,e;default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case C:g=10;break e;case T:g=9;break e;case H:g=11;break e;case ie:g=14;break e;case U:g=16,s=null;break e}g=29,n=Error(r(130,e===null?"null":typeof e,"")),s=null}return t=pn(g,n,t,l),t.elementType=e,t.type=s,t.lanes=c,t}function Xa(e,t,n,s){return e=pn(7,e,s,t),e.lanes=n,e}function qr(e,t,n){return e=pn(6,e,null,t),e.lanes=n,e}function rf(e){var t=pn(18,null,null,0);return t.stateNode=e,t}function Hr(e,t,n){return t=pn(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var cf=new WeakMap;function An(e,t){if(typeof e=="object"&&e!==null){var n=cf.get(e);return n!==void 0?n:(t={value:e,source:t,stack:ee(t)},cf.set(e,t),t)}return{value:e,source:t,stack:ee(t)}}var _s=[],ks=0,Di=null,co=0,En=[],_n=0,ha=null,Rn=1,qn="";function Qn(e,t){_s[ks++]=co,_s[ks++]=Di,Di=e,co=t}function uf(e,t,n){En[_n++]=Rn,En[_n++]=qn,En[_n++]=ha,ha=e;var s=Rn;e=qn;var l=32-Zt(s)-1;s&=~(1<<l),n+=1;var c=32-Zt(t)+l;if(30<c){var g=l-l%5;c=(s&(1<<g)-1).toString(32),s>>=g,l-=g,Rn=1<<32-Zt(t)+l|n<<l|s,qn=c+e}else Rn=1<<c|n<<l|s,qn=e}function Ur(e){e.return!==null&&(Qn(e,1),uf(e,1,0))}function Lr(e){for(;e===Di;)Di=_s[--ks],_s[ks]=null,co=_s[--ks],_s[ks]=null;for(;e===ha;)ha=En[--_n],En[_n]=null,qn=En[--_n],En[_n]=null,Rn=En[--_n],En[_n]=null}function df(e,t){En[_n++]=Rn,En[_n++]=qn,En[_n++]=ha,Rn=t.id,qn=t.overflow,ha=e}var Ut=null,ft=null,Je=!1,pa=null,kn=!1,Gr=Error(r(519));function ma(e){var t=Error(r(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw uo(An(t,e)),Gr}function ff(e){var t=e.stateNode,n=e.type,s=e.memoizedProps;switch(t[Ht]=e,t[en]=s,n){case"dialog":Xe("cancel",t),Xe("close",t);break;case"iframe":case"object":case"embed":Xe("load",t);break;case"video":case"audio":for(n=0;n<Co.length;n++)Xe(Co[n],t);break;case"source":Xe("error",t);break;case"img":case"image":case"link":Xe("error",t),Xe("load",t);break;case"details":Xe("toggle",t);break;case"input":Xe("invalid",t),Ed(t,s.value,s.defaultValue,s.checked,s.defaultChecked,s.type,s.name,!0);break;case"select":Xe("invalid",t);break;case"textarea":Xe("invalid",t),kd(t,s.value,s.defaultValue,s.children)}n=s.children,typeof n!="string"&&typeof n!="number"&&typeof n!="bigint"||t.textContent===""+n||s.suppressHydrationWarning===!0||Np(t.textContent,n)?(s.popover!=null&&(Xe("beforetoggle",t),Xe("toggle",t)),s.onScroll!=null&&Xe("scroll",t),s.onScrollEnd!=null&&Xe("scrollend",t),s.onClick!=null&&(t.onclick=Fn),t=!0):t=!1,t||ma(e,!0)}function hf(e){for(Ut=e.return;Ut;)switch(Ut.tag){case 5:case 31:case 13:kn=!1;return;case 27:case 3:kn=!0;return;default:Ut=Ut.return}}function Ds(e){if(e!==Ut)return!1;if(!Je)return hf(e),Je=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=!(n!=="form"&&n!=="button")||iu(e.type,e.memoizedProps)),n=!n),n&&ft&&ma(e),hf(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(r(317));ft=qp(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(r(317));ft=qp(e)}else t===27?(t=ft,Na(e.type)?(e=du,du=null,ft=e):ft=t):ft=Ut?Tn(e.stateNode.nextSibling):null;return!0}function Va(){ft=Ut=null,Je=!1}function Yr(){var e=pa;return e!==null&&(on===null?on=e:on.push.apply(on,e),pa=null),e}function uo(e){pa===null?pa=[e]:pa.push(e)}var Fr=k(null),Qa=null,Jn=null;function ga(e,t,n){ce(Fr,t._currentValue),t._currentValue=n}function Zn(e){e._currentValue=Fr.current,X(Fr)}function Xr(e,t,n){for(;e!==null;){var s=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,s!==null&&(s.childLanes|=t)):s!==null&&(s.childLanes&t)!==t&&(s.childLanes|=t),e===n)break;e=e.return}}function Vr(e,t,n,s){var l=e.child;for(l!==null&&(l.return=e);l!==null;){var c=l.dependencies;if(c!==null){var g=l.child;c=c.firstContext;e:for(;c!==null;){var x=c;c=l;for(var M=0;M<t.length;M++)if(x.context===t[M]){c.lanes|=n,x=c.alternate,x!==null&&(x.lanes|=n),Xr(c.return,n,e),s||(g=null);break e}c=x.next}}else if(l.tag===18){if(g=l.return,g===null)throw Error(r(341));g.lanes|=n,c=g.alternate,c!==null&&(c.lanes|=n),Xr(g,n,e),g=null}else g=l.child;if(g!==null)g.return=l;else for(g=l;g!==null;){if(g===e){g=null;break}if(l=g.sibling,l!==null){l.return=g.return,g=l;break}g=g.return}l=g}}function Ts(e,t,n,s){e=null;for(var l=t,c=!1;l!==null;){if(!c){if((l.flags&524288)!==0)c=!0;else if((l.flags&262144)!==0)break}if(l.tag===10){var g=l.alternate;if(g===null)throw Error(r(387));if(g=g.memoizedProps,g!==null){var x=l.type;hn(l.pendingProps.value,g.value)||(e!==null?e.push(x):e=[x])}}else if(l===Me.current){if(g=l.alternate,g===null)throw Error(r(387));g.memoizedState.memoizedState!==l.memoizedState.memoizedState&&(e!==null?e.push(qo):e=[qo])}l=l.return}e!==null&&Vr(t,e,n,s),t.flags|=262144}function Ti(e){for(e=e.firstContext;e!==null;){if(!hn(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Ja(e){Qa=e,Jn=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function Lt(e){return pf(Qa,e)}function Ni(e,t){return Qa===null&&Ja(e),pf(e,t)}function pf(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},Jn===null){if(e===null)throw Error(r(308));Jn=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Jn=Jn.next=t;return n}var V0=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(n,s){e.push(s)}};this.abort=function(){t.aborted=!0,e.forEach(function(n){return n()})}},Q0=a.unstable_scheduleCallback,J0=a.unstable_NormalPriority,Tt={$$typeof:C,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Qr(){return{controller:new V0,data:new Map,refCount:0}}function fo(e){e.refCount--,e.refCount===0&&Q0(J0,function(){e.controller.abort()})}var ho=null,Jr=0,Ns=0,Ms=null;function Z0(e,t){if(ho===null){var n=ho=[];Jr=0,Ns=Pc(),Ms={status:"pending",value:void 0,then:function(s){n.push(s)}}}return Jr++,t.then(mf,mf),t}function mf(){if(--Jr===0&&ho!==null){Ms!==null&&(Ms.status="fulfilled");var e=ho;ho=null,Ns=0,Ms=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function K0(e,t){var n=[],s={status:"pending",value:null,reason:null,then:function(l){n.push(l)}};return e.then(function(){s.status="fulfilled",s.value=t;for(var l=0;l<n.length;l++)(0,n[l])(t)},function(l){for(s.status="rejected",s.reason=l,l=0;l<n.length;l++)(0,n[l])(void 0)}),s}var gf=E.S;E.S=function(e,t){Ih=nt(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&Z0(e,t),gf!==null&&gf(e,t)};var Za=k(null);function Zr(){var e=Za.current;return e!==null?e:ut.pooledCache}function Mi(e,t){t===null?ce(Za,Za.current):ce(Za,t.pool)}function yf(){var e=Zr();return e===null?null:{parent:Tt._currentValue,pool:e}}var $s=Error(r(460)),Kr=Error(r(474)),$i=Error(r(542)),Oi={then:function(){}};function bf(e){return e=e.status,e==="fulfilled"||e==="rejected"}function vf(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(Fn,Fn),t=n),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,wf(e),e;default:if(typeof t.status=="string")t.then(Fn,Fn);else{if(e=ut,e!==null&&100<e.shellSuspendCounter)throw Error(r(482));e=t,e.status="pending",e.then(function(s){if(t.status==="pending"){var l=t;l.status="fulfilled",l.value=s}},function(s){if(t.status==="pending"){var l=t;l.status="rejected",l.reason=s}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,wf(e),e}throw Pa=t,$s}}function Ka(e){try{var t=e._init;return t(e._payload)}catch(n){throw n!==null&&typeof n=="object"&&typeof n.then=="function"?(Pa=n,$s):n}}var Pa=null;function xf(){if(Pa===null)throw Error(r(459));var e=Pa;return Pa=null,e}function wf(e){if(e===$s||e===$i)throw Error(r(483))}var Os=null,po=0;function Ci(e){var t=po;return po+=1,Os===null&&(Os=[]),vf(Os,e,t)}function mo(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function ji(e,t){throw t.$$typeof===_?Error(r(525)):(e=Object.prototype.toString.call(t),Error(r(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function Sf(e){function t(q,B){if(e){var V=q.deletions;V===null?(q.deletions=[B],q.flags|=16):V.push(B)}}function n(q,B){if(!e)return null;for(;B!==null;)t(q,B),B=B.sibling;return null}function s(q){for(var B=new Map;q!==null;)q.key!==null?B.set(q.key,q):B.set(q.index,q),q=q.sibling;return B}function l(q,B){return q=Vn(q,B),q.index=0,q.sibling=null,q}function c(q,B,V){return q.index=V,e?(V=q.alternate,V!==null?(V=V.index,V<B?(q.flags|=67108866,B):V):(q.flags|=67108866,B)):(q.flags|=1048576,B)}function g(q){return e&&q.alternate===null&&(q.flags|=67108866),q}function x(q,B,V,le){return B===null||B.tag!==6?(B=qr(V,q.mode,le),B.return=q,B):(B=l(B,V),B.return=q,B)}function M(q,B,V,le){var Ce=V.type;return Ce===j?oe(q,B,V.props.children,le,V.key):B!==null&&(B.elementType===Ce||typeof Ce=="object"&&Ce!==null&&Ce.$$typeof===U&&Ka(Ce)===B.type)?(B=l(B,V.props),mo(B,V),B.return=q,B):(B=ki(V.type,V.key,V.props,null,q.mode,le),mo(B,V),B.return=q,B)}function Q(q,B,V,le){return B===null||B.tag!==4||B.stateNode.containerInfo!==V.containerInfo||B.stateNode.implementation!==V.implementation?(B=Hr(V,q.mode,le),B.return=q,B):(B=l(B,V.children||[]),B.return=q,B)}function oe(q,B,V,le,Ce){return B===null||B.tag!==7?(B=Xa(V,q.mode,le,Ce),B.return=q,B):(B=l(B,V),B.return=q,B)}function de(q,B,V){if(typeof B=="string"&&B!==""||typeof B=="number"||typeof B=="bigint")return B=qr(""+B,q.mode,V),B.return=q,B;if(typeof B=="object"&&B!==null){switch(B.$$typeof){case v:return V=ki(B.type,B.key,B.props,null,q.mode,V),mo(V,B),V.return=q,V;case $:return B=Hr(B,q.mode,V),B.return=q,B;case U:return B=Ka(B),de(q,B,V)}if(ke(B)||R(B))return B=Xa(B,q.mode,V,null),B.return=q,B;if(typeof B.then=="function")return de(q,Ci(B),V);if(B.$$typeof===C)return de(q,Ni(q,B),V);ji(q,B)}return null}function J(q,B,V,le){var Ce=B!==null?B.key:null;if(typeof V=="string"&&V!==""||typeof V=="number"||typeof V=="bigint")return Ce!==null?null:x(q,B,""+V,le);if(typeof V=="object"&&V!==null){switch(V.$$typeof){case v:return V.key===Ce?M(q,B,V,le):null;case $:return V.key===Ce?Q(q,B,V,le):null;case U:return V=Ka(V),J(q,B,V,le)}if(ke(V)||R(V))return Ce!==null?null:oe(q,B,V,le,null);if(typeof V.then=="function")return J(q,B,Ci(V),le);if(V.$$typeof===C)return J(q,B,Ni(q,V),le);ji(q,V)}return null}function I(q,B,V,le,Ce){if(typeof le=="string"&&le!==""||typeof le=="number"||typeof le=="bigint")return q=q.get(V)||null,x(B,q,""+le,Ce);if(typeof le=="object"&&le!==null){switch(le.$$typeof){case v:return q=q.get(le.key===null?V:le.key)||null,M(B,q,le,Ce);case $:return q=q.get(le.key===null?V:le.key)||null,Q(B,q,le,Ce);case U:return le=Ka(le),I(q,B,V,le,Ce)}if(ke(le)||R(le))return q=q.get(V)||null,oe(B,q,le,Ce,null);if(typeof le.then=="function")return I(q,B,V,Ci(le),Ce);if(le.$$typeof===C)return I(q,B,V,Ni(B,le),Ce);ji(B,le)}return null}function Te(q,B,V,le){for(var Ce=null,Ze=null,$e=B,Le=B=0,Qe=null;$e!==null&&Le<V.length;Le++){$e.index>Le?(Qe=$e,$e=null):Qe=$e.sibling;var Ke=J(q,$e,V[Le],le);if(Ke===null){$e===null&&($e=Qe);break}e&&$e&&Ke.alternate===null&&t(q,$e),B=c(Ke,B,Le),Ze===null?Ce=Ke:Ze.sibling=Ke,Ze=Ke,$e=Qe}if(Le===V.length)return n(q,$e),Je&&Qn(q,Le),Ce;if($e===null){for(;Le<V.length;Le++)$e=de(q,V[Le],le),$e!==null&&(B=c($e,B,Le),Ze===null?Ce=$e:Ze.sibling=$e,Ze=$e);return Je&&Qn(q,Le),Ce}for($e=s($e);Le<V.length;Le++)Qe=I($e,q,Le,V[Le],le),Qe!==null&&(e&&Qe.alternate!==null&&$e.delete(Qe.key===null?Le:Qe.key),B=c(Qe,B,Le),Ze===null?Ce=Qe:Ze.sibling=Qe,Ze=Qe);return e&&$e.forEach(function(ja){return t(q,ja)}),Je&&Qn(q,Le),Ce}function Be(q,B,V,le){if(V==null)throw Error(r(151));for(var Ce=null,Ze=null,$e=B,Le=B=0,Qe=null,Ke=V.next();$e!==null&&!Ke.done;Le++,Ke=V.next()){$e.index>Le?(Qe=$e,$e=null):Qe=$e.sibling;var ja=J(q,$e,Ke.value,le);if(ja===null){$e===null&&($e=Qe);break}e&&$e&&ja.alternate===null&&t(q,$e),B=c(ja,B,Le),Ze===null?Ce=ja:Ze.sibling=ja,Ze=ja,$e=Qe}if(Ke.done)return n(q,$e),Je&&Qn(q,Le),Ce;if($e===null){for(;!Ke.done;Le++,Ke=V.next())Ke=de(q,Ke.value,le),Ke!==null&&(B=c(Ke,B,Le),Ze===null?Ce=Ke:Ze.sibling=Ke,Ze=Ke);return Je&&Qn(q,Le),Ce}for($e=s($e);!Ke.done;Le++,Ke=V.next())Ke=I($e,q,Le,Ke.value,le),Ke!==null&&(e&&Ke.alternate!==null&&$e.delete(Ke.key===null?Le:Ke.key),B=c(Ke,B,Le),Ze===null?Ce=Ke:Ze.sibling=Ke,Ze=Ke);return e&&$e.forEach(function(lb){return t(q,lb)}),Je&&Qn(q,Le),Ce}function rt(q,B,V,le){if(typeof V=="object"&&V!==null&&V.type===j&&V.key===null&&(V=V.props.children),typeof V=="object"&&V!==null){switch(V.$$typeof){case v:e:{for(var Ce=V.key;B!==null;){if(B.key===Ce){if(Ce=V.type,Ce===j){if(B.tag===7){n(q,B.sibling),le=l(B,V.props.children),le.return=q,q=le;break e}}else if(B.elementType===Ce||typeof Ce=="object"&&Ce!==null&&Ce.$$typeof===U&&Ka(Ce)===B.type){n(q,B.sibling),le=l(B,V.props),mo(le,V),le.return=q,q=le;break e}n(q,B);break}else t(q,B);B=B.sibling}V.type===j?(le=Xa(V.props.children,q.mode,le,V.key),le.return=q,q=le):(le=ki(V.type,V.key,V.props,null,q.mode,le),mo(le,V),le.return=q,q=le)}return g(q);case $:e:{for(Ce=V.key;B!==null;){if(B.key===Ce)if(B.tag===4&&B.stateNode.containerInfo===V.containerInfo&&B.stateNode.implementation===V.implementation){n(q,B.sibling),le=l(B,V.children||[]),le.return=q,q=le;break e}else{n(q,B);break}else t(q,B);B=B.sibling}le=Hr(V,q.mode,le),le.return=q,q=le}return g(q);case U:return V=Ka(V),rt(q,B,V,le)}if(ke(V))return Te(q,B,V,le);if(R(V)){if(Ce=R(V),typeof Ce!="function")throw Error(r(150));return V=Ce.call(V),Be(q,B,V,le)}if(typeof V.then=="function")return rt(q,B,Ci(V),le);if(V.$$typeof===C)return rt(q,B,Ni(q,V),le);ji(q,V)}return typeof V=="string"&&V!==""||typeof V=="number"||typeof V=="bigint"?(V=""+V,B!==null&&B.tag===6?(n(q,B.sibling),le=l(B,V),le.return=q,q=le):(n(q,B),le=qr(V,q.mode,le),le.return=q,q=le),g(q)):n(q,B)}return function(q,B,V,le){try{po=0;var Ce=rt(q,B,V,le);return Os=null,Ce}catch($e){if($e===$s||$e===$i)throw $e;var Ze=pn(29,$e,null,q.mode);return Ze.lanes=le,Ze.return=q,Ze}}}var Wa=Sf(!0),Af=Sf(!1),ya=!1;function Pr(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Wr(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function ba(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function va(e,t,n){var s=e.updateQueue;if(s===null)return null;if(s=s.shared,(Pe&2)!==0){var l=s.pending;return l===null?t.next=t:(t.next=l.next,l.next=t),s.pending=t,t=_i(e),of(e,null,n),t}return Ei(e,s,t,n),_i(e)}function go(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194048)!==0)){var s=t.lanes;s&=e.pendingLanes,n|=s,t.lanes=n,hd(e,n)}}function Ir(e,t){var n=e.updateQueue,s=e.alternate;if(s!==null&&(s=s.updateQueue,n===s)){var l=null,c=null;if(n=n.firstBaseUpdate,n!==null){do{var g={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};c===null?l=c=g:c=c.next=g,n=n.next}while(n!==null);c===null?l=c=t:c=c.next=t}else l=c=t;n={baseState:s.baseState,firstBaseUpdate:l,lastBaseUpdate:c,shared:s.shared,callbacks:s.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var ec=!1;function yo(){if(ec){var e=Ms;if(e!==null)throw e}}function bo(e,t,n,s){ec=!1;var l=e.updateQueue;ya=!1;var c=l.firstBaseUpdate,g=l.lastBaseUpdate,x=l.shared.pending;if(x!==null){l.shared.pending=null;var M=x,Q=M.next;M.next=null,g===null?c=Q:g.next=Q,g=M;var oe=e.alternate;oe!==null&&(oe=oe.updateQueue,x=oe.lastBaseUpdate,x!==g&&(x===null?oe.firstBaseUpdate=Q:x.next=Q,oe.lastBaseUpdate=M))}if(c!==null){var de=l.baseState;g=0,oe=Q=M=null,x=c;do{var J=x.lane&-536870913,I=J!==x.lane;if(I?(Ve&J)===J:(s&J)===J){J!==0&&J===Ns&&(ec=!0),oe!==null&&(oe=oe.next={lane:0,tag:x.tag,payload:x.payload,callback:null,next:null});e:{var Te=e,Be=x;J=t;var rt=n;switch(Be.tag){case 1:if(Te=Be.payload,typeof Te=="function"){de=Te.call(rt,de,J);break e}de=Te;break e;case 3:Te.flags=Te.flags&-65537|128;case 0:if(Te=Be.payload,J=typeof Te=="function"?Te.call(rt,de,J):Te,J==null)break e;de=w({},de,J);break e;case 2:ya=!0}}J=x.callback,J!==null&&(e.flags|=64,I&&(e.flags|=8192),I=l.callbacks,I===null?l.callbacks=[J]:I.push(J))}else I={lane:J,tag:x.tag,payload:x.payload,callback:x.callback,next:null},oe===null?(Q=oe=I,M=de):oe=oe.next=I,g|=J;if(x=x.next,x===null){if(x=l.shared.pending,x===null)break;I=x,x=I.next,I.next=null,l.lastBaseUpdate=I,l.shared.pending=null}}while(!0);oe===null&&(M=de),l.baseState=M,l.firstBaseUpdate=Q,l.lastBaseUpdate=oe,c===null&&(l.shared.lanes=0),Ea|=g,e.lanes=g,e.memoizedState=de}}function Ef(e,t){if(typeof e!="function")throw Error(r(191,e));e.call(t)}function _f(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)Ef(n[e],t)}var Cs=k(null),Bi=k(0);function kf(e,t){e=sa,ce(Bi,e),ce(Cs,t),sa=e|t.baseLanes}function tc(){ce(Bi,sa),ce(Cs,Cs.current)}function nc(){sa=Bi.current,X(Cs),X(Bi)}var mn=k(null),Dn=null;function xa(e){var t=e.alternate;ce(kt,kt.current&1),ce(mn,e),Dn===null&&(t===null||Cs.current!==null||t.memoizedState!==null)&&(Dn=e)}function ac(e){ce(kt,kt.current),ce(mn,e),Dn===null&&(Dn=e)}function Df(e){e.tag===22?(ce(kt,kt.current),ce(mn,e),Dn===null&&(Dn=e)):wa()}function wa(){ce(kt,kt.current),ce(mn,mn.current)}function gn(e){X(mn),Dn===e&&(Dn=null),X(kt)}var kt=k(0);function zi(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||cu(n)||uu(n)))return t}else if(t.tag===19&&(t.memoizedProps.revealOrder==="forwards"||t.memoizedProps.revealOrder==="backwards"||t.memoizedProps.revealOrder==="unstable_legacy-backwards"||t.memoizedProps.revealOrder==="together")){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Kn=0,Ue=null,it=null,Nt=null,Ri=!1,js=!1,Ia=!1,qi=0,vo=0,Bs=null,P0=0;function vt(){throw Error(r(321))}function sc(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!hn(e[n],t[n]))return!1;return!0}function oc(e,t,n,s,l,c){return Kn=c,Ue=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,E.H=e===null||e.memoizedState===null?uh:xc,Ia=!1,c=n(s,l),Ia=!1,js&&(c=Nf(t,n,s,l)),Tf(e),c}function Tf(e){E.H=So;var t=it!==null&&it.next!==null;if(Kn=0,Nt=it=Ue=null,Ri=!1,vo=0,Bs=null,t)throw Error(r(300));e===null||Mt||(e=e.dependencies,e!==null&&Ti(e)&&(Mt=!0))}function Nf(e,t,n,s){Ue=e;var l=0;do{if(js&&(Bs=null),vo=0,js=!1,25<=l)throw Error(r(301));if(l+=1,Nt=it=null,e.updateQueue!=null){var c=e.updateQueue;c.lastEffect=null,c.events=null,c.stores=null,c.memoCache!=null&&(c.memoCache.index=0)}E.H=dh,c=t(n,s)}while(js);return c}function W0(){var e=E.H,t=e.useState()[0];return t=typeof t.then=="function"?xo(t):t,e=e.useState()[0],(it!==null?it.memoizedState:null)!==e&&(Ue.flags|=1024),t}function ic(){var e=qi!==0;return qi=0,e}function lc(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function rc(e){if(Ri){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Ri=!1}Kn=0,Nt=it=Ue=null,js=!1,vo=qi=0,Bs=null}function Kt(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Nt===null?Ue.memoizedState=Nt=e:Nt=Nt.next=e,Nt}function Dt(){if(it===null){var e=Ue.alternate;e=e!==null?e.memoizedState:null}else e=it.next;var t=Nt===null?Ue.memoizedState:Nt.next;if(t!==null)Nt=t,it=e;else{if(e===null)throw Ue.alternate===null?Error(r(467)):Error(r(310));it=e,e={memoizedState:it.memoizedState,baseState:it.baseState,baseQueue:it.baseQueue,queue:it.queue,next:null},Nt===null?Ue.memoizedState=Nt=e:Nt=Nt.next=e}return Nt}function Hi(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function xo(e){var t=vo;return vo+=1,Bs===null&&(Bs=[]),e=vf(Bs,e,t),t=Ue,(Nt===null?t.memoizedState:Nt.next)===null&&(t=t.alternate,E.H=t===null||t.memoizedState===null?uh:xc),e}function Ui(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return xo(e);if(e.$$typeof===C)return Lt(e)}throw Error(r(438,String(e)))}function cc(e){var t=null,n=Ue.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var s=Ue.alternate;s!==null&&(s=s.updateQueue,s!==null&&(s=s.memoCache,s!=null&&(t={data:s.data.map(function(l){return l.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),n===null&&(n=Hi(),Ue.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),s=0;s<e;s++)n[s]=re;return t.index++,n}function Pn(e,t){return typeof t=="function"?t(e):t}function Li(e){var t=Dt();return uc(t,it,e)}function uc(e,t,n){var s=e.queue;if(s===null)throw Error(r(311));s.lastRenderedReducer=n;var l=e.baseQueue,c=s.pending;if(c!==null){if(l!==null){var g=l.next;l.next=c.next,c.next=g}t.baseQueue=l=c,s.pending=null}if(c=e.baseState,l===null)e.memoizedState=c;else{t=l.next;var x=g=null,M=null,Q=t,oe=!1;do{var de=Q.lane&-536870913;if(de!==Q.lane?(Ve&de)===de:(Kn&de)===de){var J=Q.revertLane;if(J===0)M!==null&&(M=M.next={lane:0,revertLane:0,gesture:null,action:Q.action,hasEagerState:Q.hasEagerState,eagerState:Q.eagerState,next:null}),de===Ns&&(oe=!0);else if((Kn&J)===J){Q=Q.next,J===Ns&&(oe=!0);continue}else de={lane:0,revertLane:Q.revertLane,gesture:null,action:Q.action,hasEagerState:Q.hasEagerState,eagerState:Q.eagerState,next:null},M===null?(x=M=de,g=c):M=M.next=de,Ue.lanes|=J,Ea|=J;de=Q.action,Ia&&n(c,de),c=Q.hasEagerState?Q.eagerState:n(c,de)}else J={lane:de,revertLane:Q.revertLane,gesture:Q.gesture,action:Q.action,hasEagerState:Q.hasEagerState,eagerState:Q.eagerState,next:null},M===null?(x=M=J,g=c):M=M.next=J,Ue.lanes|=de,Ea|=de;Q=Q.next}while(Q!==null&&Q!==t);if(M===null?g=c:M.next=x,!hn(c,e.memoizedState)&&(Mt=!0,oe&&(n=Ms,n!==null)))throw n;e.memoizedState=c,e.baseState=g,e.baseQueue=M,s.lastRenderedState=c}return l===null&&(s.lanes=0),[e.memoizedState,s.dispatch]}function dc(e){var t=Dt(),n=t.queue;if(n===null)throw Error(r(311));n.lastRenderedReducer=e;var s=n.dispatch,l=n.pending,c=t.memoizedState;if(l!==null){n.pending=null;var g=l=l.next;do c=e(c,g.action),g=g.next;while(g!==l);hn(c,t.memoizedState)||(Mt=!0),t.memoizedState=c,t.baseQueue===null&&(t.baseState=c),n.lastRenderedState=c}return[c,s]}function Mf(e,t,n){var s=Ue,l=Dt(),c=Je;if(c){if(n===void 0)throw Error(r(407));n=n()}else n=t();var g=!hn((it||l).memoizedState,n);if(g&&(l.memoizedState=n,Mt=!0),l=l.queue,pc(Cf.bind(null,s,l,e),[e]),l.getSnapshot!==t||g||Nt!==null&&Nt.memoizedState.tag&1){if(s.flags|=2048,zs(9,{destroy:void 0},Of.bind(null,s,l,n,t),null),ut===null)throw Error(r(349));c||(Kn&127)!==0||$f(s,t,n)}return n}function $f(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=Ue.updateQueue,t===null?(t=Hi(),Ue.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Of(e,t,n,s){t.value=n,t.getSnapshot=s,jf(t)&&Bf(e)}function Cf(e,t,n){return n(function(){jf(t)&&Bf(e)})}function jf(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!hn(e,n)}catch{return!0}}function Bf(e){var t=Fa(e,2);t!==null&&ln(t,e,2)}function fc(e){var t=Kt();if(typeof e=="function"){var n=e;if(e=n(),Ia){It(!0);try{n()}finally{It(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Pn,lastRenderedState:e},t}function zf(e,t,n,s){return e.baseState=n,uc(e,it,typeof s=="function"?s:Pn)}function I0(e,t,n,s,l){if(Fi(e))throw Error(r(485));if(e=t.action,e!==null){var c={payload:l,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(g){c.listeners.push(g)}};E.T!==null?n(!0):c.isTransition=!1,s(c),n=t.pending,n===null?(c.next=t.pending=c,Rf(t,c)):(c.next=n.next,t.pending=n.next=c)}}function Rf(e,t){var n=t.action,s=t.payload,l=e.state;if(t.isTransition){var c=E.T,g={};E.T=g;try{var x=n(l,s),M=E.S;M!==null&&M(g,x),qf(e,t,x)}catch(Q){hc(e,t,Q)}finally{c!==null&&g.types!==null&&(c.types=g.types),E.T=c}}else try{c=n(l,s),qf(e,t,c)}catch(Q){hc(e,t,Q)}}function qf(e,t,n){n!==null&&typeof n=="object"&&typeof n.then=="function"?n.then(function(s){Hf(e,t,s)},function(s){return hc(e,t,s)}):Hf(e,t,n)}function Hf(e,t,n){t.status="fulfilled",t.value=n,Uf(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,Rf(e,n)))}function hc(e,t,n){var s=e.pending;if(e.pending=null,s!==null){s=s.next;do t.status="rejected",t.reason=n,Uf(t),t=t.next;while(t!==s)}e.action=null}function Uf(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function Lf(e,t){return t}function Gf(e,t){if(Je){var n=ut.formState;if(n!==null){e:{var s=Ue;if(Je){if(ft){t:{for(var l=ft,c=kn;l.nodeType!==8;){if(!c){l=null;break t}if(l=Tn(l.nextSibling),l===null){l=null;break t}}c=l.data,l=c==="F!"||c==="F"?l:null}if(l){ft=Tn(l.nextSibling),s=l.data==="F!";break e}}ma(s)}s=!1}s&&(t=n[0])}}return n=Kt(),n.memoizedState=n.baseState=t,s={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Lf,lastRenderedState:t},n.queue=s,n=lh.bind(null,Ue,s),s.dispatch=n,s=fc(!1),c=vc.bind(null,Ue,!1,s.queue),s=Kt(),l={state:t,dispatch:null,action:e,pending:null},s.queue=l,n=I0.bind(null,Ue,l,c,n),l.dispatch=n,s.memoizedState=e,[t,n,!1]}function Yf(e){var t=Dt();return Ff(t,it,e)}function Ff(e,t,n){if(t=uc(e,t,Lf)[0],e=Li(Pn)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var s=xo(t)}catch(g){throw g===$s?$i:g}else s=t;t=Dt();var l=t.queue,c=l.dispatch;return n!==t.memoizedState&&(Ue.flags|=2048,zs(9,{destroy:void 0},ey.bind(null,l,n),null)),[s,c,e]}function ey(e,t){e.action=t}function Xf(e){var t=Dt(),n=it;if(n!==null)return Ff(t,n,e);Dt(),t=t.memoizedState,n=Dt();var s=n.queue.dispatch;return n.memoizedState=e,[t,s,!1]}function zs(e,t,n,s){return e={tag:e,create:n,deps:s,inst:t,next:null},t=Ue.updateQueue,t===null&&(t=Hi(),Ue.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(s=n.next,n.next=e,e.next=s,t.lastEffect=e),e}function Vf(){return Dt().memoizedState}function Gi(e,t,n,s){var l=Kt();Ue.flags|=e,l.memoizedState=zs(1|t,{destroy:void 0},n,s===void 0?null:s)}function Yi(e,t,n,s){var l=Dt();s=s===void 0?null:s;var c=l.memoizedState.inst;it!==null&&s!==null&&sc(s,it.memoizedState.deps)?l.memoizedState=zs(t,c,n,s):(Ue.flags|=e,l.memoizedState=zs(1|t,c,n,s))}function Qf(e,t){Gi(8390656,8,e,t)}function pc(e,t){Yi(2048,8,e,t)}function ty(e){Ue.flags|=4;var t=Ue.updateQueue;if(t===null)t=Hi(),Ue.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function Jf(e){var t=Dt().memoizedState;return ty({ref:t,nextImpl:e}),function(){if((Pe&2)!==0)throw Error(r(440));return t.impl.apply(void 0,arguments)}}function Zf(e,t){return Yi(4,2,e,t)}function Kf(e,t){return Yi(4,4,e,t)}function Pf(e,t){if(typeof t=="function"){e=e();var n=t(e);return function(){typeof n=="function"?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Wf(e,t,n){n=n!=null?n.concat([e]):null,Yi(4,4,Pf.bind(null,t,e),n)}function mc(){}function If(e,t){var n=Dt();t=t===void 0?null:t;var s=n.memoizedState;return t!==null&&sc(t,s[1])?s[0]:(n.memoizedState=[e,t],e)}function eh(e,t){var n=Dt();t=t===void 0?null:t;var s=n.memoizedState;if(t!==null&&sc(t,s[1]))return s[0];if(s=e(),Ia){It(!0);try{e()}finally{It(!1)}}return n.memoizedState=[s,t],s}function gc(e,t,n){return n===void 0||(Kn&1073741824)!==0&&(Ve&261930)===0?e.memoizedState=t:(e.memoizedState=n,e=tp(),Ue.lanes|=e,Ea|=e,n)}function th(e,t,n,s){return hn(n,t)?n:Cs.current!==null?(e=gc(e,n,s),hn(e,t)||(Mt=!0),e):(Kn&42)===0||(Kn&1073741824)!==0&&(Ve&261930)===0?(Mt=!0,e.memoizedState=n):(e=tp(),Ue.lanes|=e,Ea|=e,t)}function nh(e,t,n,s,l){var c=z.p;z.p=c!==0&&8>c?c:8;var g=E.T,x={};E.T=x,vc(e,!1,t,n);try{var M=l(),Q=E.S;if(Q!==null&&Q(x,M),M!==null&&typeof M=="object"&&typeof M.then=="function"){var oe=K0(M,s);wo(e,t,oe,vn(e))}else wo(e,t,s,vn(e))}catch(de){wo(e,t,{then:function(){},status:"rejected",reason:de},vn())}finally{z.p=c,g!==null&&x.types!==null&&(g.types=x.types),E.T=g}}function ny(){}function yc(e,t,n,s){if(e.tag!==5)throw Error(r(476));var l=ah(e).queue;nh(e,l,t,K,n===null?ny:function(){return sh(e),n(s)})}function ah(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:K,baseState:K,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Pn,lastRenderedState:K},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Pn,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function sh(e){var t=ah(e);t.next===null&&(t=e.alternate.memoizedState),wo(e,t.next.queue,{},vn())}function bc(){return Lt(qo)}function oh(){return Dt().memoizedState}function ih(){return Dt().memoizedState}function ay(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=vn();e=ba(n);var s=va(t,e,n);s!==null&&(ln(s,t,n),go(s,t,n)),t={cache:Qr()},e.payload=t;return}t=t.return}}function sy(e,t,n){var s=vn();n={lane:s,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},Fi(e)?rh(t,n):(n=zr(e,t,n,s),n!==null&&(ln(n,e,s),ch(n,t,s)))}function lh(e,t,n){var s=vn();wo(e,t,n,s)}function wo(e,t,n,s){var l={lane:s,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(Fi(e))rh(t,l);else{var c=e.alternate;if(e.lanes===0&&(c===null||c.lanes===0)&&(c=t.lastRenderedReducer,c!==null))try{var g=t.lastRenderedState,x=c(g,n);if(l.hasEagerState=!0,l.eagerState=x,hn(x,g))return Ei(e,t,l,0),ut===null&&Ai(),!1}catch{}if(n=zr(e,t,l,s),n!==null)return ln(n,e,s),ch(n,t,s),!0}return!1}function vc(e,t,n,s){if(s={lane:2,revertLane:Pc(),gesture:null,action:s,hasEagerState:!1,eagerState:null,next:null},Fi(e)){if(t)throw Error(r(479))}else t=zr(e,n,s,2),t!==null&&ln(t,e,2)}function Fi(e){var t=e.alternate;return e===Ue||t!==null&&t===Ue}function rh(e,t){js=Ri=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function ch(e,t,n){if((n&4194048)!==0){var s=t.lanes;s&=e.pendingLanes,n|=s,t.lanes=n,hd(e,n)}}var So={readContext:Lt,use:Ui,useCallback:vt,useContext:vt,useEffect:vt,useImperativeHandle:vt,useLayoutEffect:vt,useInsertionEffect:vt,useMemo:vt,useReducer:vt,useRef:vt,useState:vt,useDebugValue:vt,useDeferredValue:vt,useTransition:vt,useSyncExternalStore:vt,useId:vt,useHostTransitionStatus:vt,useFormState:vt,useActionState:vt,useOptimistic:vt,useMemoCache:vt,useCacheRefresh:vt};So.useEffectEvent=vt;var uh={readContext:Lt,use:Ui,useCallback:function(e,t){return Kt().memoizedState=[e,t===void 0?null:t],e},useContext:Lt,useEffect:Qf,useImperativeHandle:function(e,t,n){n=n!=null?n.concat([e]):null,Gi(4194308,4,Pf.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Gi(4194308,4,e,t)},useInsertionEffect:function(e,t){Gi(4,2,e,t)},useMemo:function(e,t){var n=Kt();t=t===void 0?null:t;var s=e();if(Ia){It(!0);try{e()}finally{It(!1)}}return n.memoizedState=[s,t],s},useReducer:function(e,t,n){var s=Kt();if(n!==void 0){var l=n(t);if(Ia){It(!0);try{n(t)}finally{It(!1)}}}else l=t;return s.memoizedState=s.baseState=l,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:l},s.queue=e,e=e.dispatch=sy.bind(null,Ue,e),[s.memoizedState,e]},useRef:function(e){var t=Kt();return e={current:e},t.memoizedState=e},useState:function(e){e=fc(e);var t=e.queue,n=lh.bind(null,Ue,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:mc,useDeferredValue:function(e,t){var n=Kt();return gc(n,e,t)},useTransition:function(){var e=fc(!1);return e=nh.bind(null,Ue,e.queue,!0,!1),Kt().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var s=Ue,l=Kt();if(Je){if(n===void 0)throw Error(r(407));n=n()}else{if(n=t(),ut===null)throw Error(r(349));(Ve&127)!==0||$f(s,t,n)}l.memoizedState=n;var c={value:n,getSnapshot:t};return l.queue=c,Qf(Cf.bind(null,s,c,e),[e]),s.flags|=2048,zs(9,{destroy:void 0},Of.bind(null,s,c,n,t),null),n},useId:function(){var e=Kt(),t=ut.identifierPrefix;if(Je){var n=qn,s=Rn;n=(s&~(1<<32-Zt(s)-1)).toString(32)+n,t="_"+t+"R_"+n,n=qi++,0<n&&(t+="H"+n.toString(32)),t+="_"}else n=P0++,t="_"+t+"r_"+n.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:bc,useFormState:Gf,useActionState:Gf,useOptimistic:function(e){var t=Kt();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=vc.bind(null,Ue,!0,n),n.dispatch=t,[e,t]},useMemoCache:cc,useCacheRefresh:function(){return Kt().memoizedState=ay.bind(null,Ue)},useEffectEvent:function(e){var t=Kt(),n={impl:e};return t.memoizedState=n,function(){if((Pe&2)!==0)throw Error(r(440));return n.impl.apply(void 0,arguments)}}},xc={readContext:Lt,use:Ui,useCallback:If,useContext:Lt,useEffect:pc,useImperativeHandle:Wf,useInsertionEffect:Zf,useLayoutEffect:Kf,useMemo:eh,useReducer:Li,useRef:Vf,useState:function(){return Li(Pn)},useDebugValue:mc,useDeferredValue:function(e,t){var n=Dt();return th(n,it.memoizedState,e,t)},useTransition:function(){var e=Li(Pn)[0],t=Dt().memoizedState;return[typeof e=="boolean"?e:xo(e),t]},useSyncExternalStore:Mf,useId:oh,useHostTransitionStatus:bc,useFormState:Yf,useActionState:Yf,useOptimistic:function(e,t){var n=Dt();return zf(n,it,e,t)},useMemoCache:cc,useCacheRefresh:ih};xc.useEffectEvent=Jf;var dh={readContext:Lt,use:Ui,useCallback:If,useContext:Lt,useEffect:pc,useImperativeHandle:Wf,useInsertionEffect:Zf,useLayoutEffect:Kf,useMemo:eh,useReducer:dc,useRef:Vf,useState:function(){return dc(Pn)},useDebugValue:mc,useDeferredValue:function(e,t){var n=Dt();return it===null?gc(n,e,t):th(n,it.memoizedState,e,t)},useTransition:function(){var e=dc(Pn)[0],t=Dt().memoizedState;return[typeof e=="boolean"?e:xo(e),t]},useSyncExternalStore:Mf,useId:oh,useHostTransitionStatus:bc,useFormState:Xf,useActionState:Xf,useOptimistic:function(e,t){var n=Dt();return it!==null?zf(n,it,e,t):(n.baseState=e,[e,n.queue.dispatch])},useMemoCache:cc,useCacheRefresh:ih};dh.useEffectEvent=Jf;function wc(e,t,n,s){t=e.memoizedState,n=n(s,t),n=n==null?t:w({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var Sc={enqueueSetState:function(e,t,n){e=e._reactInternals;var s=vn(),l=ba(s);l.payload=t,n!=null&&(l.callback=n),t=va(e,l,s),t!==null&&(ln(t,e,s),go(t,e,s))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var s=vn(),l=ba(s);l.tag=1,l.payload=t,n!=null&&(l.callback=n),t=va(e,l,s),t!==null&&(ln(t,e,s),go(t,e,s))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=vn(),s=ba(n);s.tag=2,t!=null&&(s.callback=t),t=va(e,s,n),t!==null&&(ln(t,e,n),go(t,e,n))}};function fh(e,t,n,s,l,c,g){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(s,c,g):t.prototype&&t.prototype.isPureReactComponent?!lo(n,s)||!lo(l,c):!0}function hh(e,t,n,s){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,s),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,s),t.state!==e&&Sc.enqueueReplaceState(t,t.state,null)}function es(e,t){var n=t;if("ref"in t){n={};for(var s in t)s!=="ref"&&(n[s]=t[s])}if(e=e.defaultProps){n===t&&(n=w({},n));for(var l in e)n[l]===void 0&&(n[l]=e[l])}return n}function ph(e){Si(e)}function mh(e){console.error(e)}function gh(e){Si(e)}function Xi(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(s){setTimeout(function(){throw s})}}function yh(e,t,n){try{var s=e.onCaughtError;s(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(l){setTimeout(function(){throw l})}}function Ac(e,t,n){return n=ba(n),n.tag=3,n.payload={element:null},n.callback=function(){Xi(e,t)},n}function bh(e){return e=ba(e),e.tag=3,e}function vh(e,t,n,s){var l=n.type.getDerivedStateFromError;if(typeof l=="function"){var c=s.value;e.payload=function(){return l(c)},e.callback=function(){yh(t,n,s)}}var g=n.stateNode;g!==null&&typeof g.componentDidCatch=="function"&&(e.callback=function(){yh(t,n,s),typeof l!="function"&&(_a===null?_a=new Set([this]):_a.add(this));var x=s.stack;this.componentDidCatch(s.value,{componentStack:x!==null?x:""})})}function oy(e,t,n,s,l){if(n.flags|=32768,s!==null&&typeof s=="object"&&typeof s.then=="function"){if(t=n.alternate,t!==null&&Ts(t,n,l,!0),n=mn.current,n!==null){switch(n.tag){case 31:case 13:return Dn===null?al():n.alternate===null&&xt===0&&(xt=3),n.flags&=-257,n.flags|=65536,n.lanes=l,s===Oi?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([s]):t.add(s),Jc(e,s,l)),!1;case 22:return n.flags|=65536,s===Oi?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([s])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([s]):n.add(s)),Jc(e,s,l)),!1}throw Error(r(435,n.tag))}return Jc(e,s,l),al(),!1}if(Je)return t=mn.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=l,s!==Gr&&(e=Error(r(422),{cause:s}),uo(An(e,n)))):(s!==Gr&&(t=Error(r(423),{cause:s}),uo(An(t,n))),e=e.current.alternate,e.flags|=65536,l&=-l,e.lanes|=l,s=An(s,n),l=Ac(e.stateNode,s,l),Ir(e,l),xt!==4&&(xt=2)),!1;var c=Error(r(520),{cause:s});if(c=An(c,n),Mo===null?Mo=[c]:Mo.push(c),xt!==4&&(xt=2),t===null)return!0;s=An(s,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=l&-l,n.lanes|=e,e=Ac(n.stateNode,s,e),Ir(n,e),!1;case 1:if(t=n.type,c=n.stateNode,(n.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||c!==null&&typeof c.componentDidCatch=="function"&&(_a===null||!_a.has(c))))return n.flags|=65536,l&=-l,n.lanes|=l,l=bh(l),vh(l,e,n,s),Ir(n,l),!1}n=n.return}while(n!==null);return!1}var Ec=Error(r(461)),Mt=!1;function Gt(e,t,n,s){t.child=e===null?Af(t,null,n,s):Wa(t,e.child,n,s)}function xh(e,t,n,s,l){n=n.render;var c=t.ref;if("ref"in s){var g={};for(var x in s)x!=="ref"&&(g[x]=s[x])}else g=s;return Ja(t),s=oc(e,t,n,g,c,l),x=ic(),e!==null&&!Mt?(lc(e,t,l),Wn(e,t,l)):(Je&&x&&Ur(t),t.flags|=1,Gt(e,t,s,l),t.child)}function wh(e,t,n,s,l){if(e===null){var c=n.type;return typeof c=="function"&&!Rr(c)&&c.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=c,Sh(e,t,c,s,l)):(e=ki(n.type,null,s,t,t.mode,l),e.ref=t.ref,e.return=t,t.child=e)}if(c=e.child,!Oc(e,l)){var g=c.memoizedProps;if(n=n.compare,n=n!==null?n:lo,n(g,s)&&e.ref===t.ref)return Wn(e,t,l)}return t.flags|=1,e=Vn(c,s),e.ref=t.ref,e.return=t,t.child=e}function Sh(e,t,n,s,l){if(e!==null){var c=e.memoizedProps;if(lo(c,s)&&e.ref===t.ref)if(Mt=!1,t.pendingProps=s=c,Oc(e,l))(e.flags&131072)!==0&&(Mt=!0);else return t.lanes=e.lanes,Wn(e,t,l)}return _c(e,t,n,s,l)}function Ah(e,t,n,s){var l=s.children,c=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),s.mode==="hidden"){if((t.flags&128)!==0){if(c=c!==null?c.baseLanes|n:n,e!==null){for(s=t.child=e.child,l=0;s!==null;)l=l|s.lanes|s.childLanes,s=s.sibling;s=l&~c}else s=0,t.child=null;return Eh(e,t,c,n,s)}if((n&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Mi(t,c!==null?c.cachePool:null),c!==null?kf(t,c):tc(),Df(t);else return s=t.lanes=536870912,Eh(e,t,c!==null?c.baseLanes|n:n,n,s)}else c!==null?(Mi(t,c.cachePool),kf(t,c),wa(),t.memoizedState=null):(e!==null&&Mi(t,null),tc(),wa());return Gt(e,t,l,n),t.child}function Ao(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Eh(e,t,n,s,l){var c=Zr();return c=c===null?null:{parent:Tt._currentValue,pool:c},t.memoizedState={baseLanes:n,cachePool:c},e!==null&&Mi(t,null),tc(),Df(t),e!==null&&Ts(e,t,s,!0),t.childLanes=l,null}function Vi(e,t){return t=Ji({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function _h(e,t,n){return Wa(t,e.child,null,n),e=Vi(t,t.pendingProps),e.flags|=2,gn(t),t.memoizedState=null,e}function iy(e,t,n){var s=t.pendingProps,l=(t.flags&128)!==0;if(t.flags&=-129,e===null){if(Je){if(s.mode==="hidden")return e=Vi(t,s),t.lanes=536870912,Ao(null,e);if(ac(t),(e=ft)?(e=Rp(e,kn),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:ha!==null?{id:Rn,overflow:qn}:null,retryLane:536870912,hydrationErrors:null},n=rf(e),n.return=t,t.child=n,Ut=t,ft=null)):e=null,e===null)throw ma(t);return t.lanes=536870912,null}return Vi(t,s)}var c=e.memoizedState;if(c!==null){var g=c.dehydrated;if(ac(t),l)if(t.flags&256)t.flags&=-257,t=_h(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(r(558));else if(Mt||Ts(e,t,n,!1),l=(n&e.childLanes)!==0,Mt||l){if(s=ut,s!==null&&(g=pd(s,n),g!==0&&g!==c.retryLane))throw c.retryLane=g,Fa(e,g),ln(s,e,g),Ec;al(),t=_h(e,t,n)}else e=c.treeContext,ft=Tn(g.nextSibling),Ut=t,Je=!0,pa=null,kn=!1,e!==null&&df(t,e),t=Vi(t,s),t.flags|=4096;return t}return e=Vn(e.child,{mode:s.mode,children:s.children}),e.ref=t.ref,t.child=e,e.return=t,e}function Qi(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!="function"&&typeof n!="object")throw Error(r(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function _c(e,t,n,s,l){return Ja(t),n=oc(e,t,n,s,void 0,l),s=ic(),e!==null&&!Mt?(lc(e,t,l),Wn(e,t,l)):(Je&&s&&Ur(t),t.flags|=1,Gt(e,t,n,l),t.child)}function kh(e,t,n,s,l,c){return Ja(t),t.updateQueue=null,n=Nf(t,s,n,l),Tf(e),s=ic(),e!==null&&!Mt?(lc(e,t,c),Wn(e,t,c)):(Je&&s&&Ur(t),t.flags|=1,Gt(e,t,n,c),t.child)}function Dh(e,t,n,s,l){if(Ja(t),t.stateNode===null){var c=Es,g=n.contextType;typeof g=="object"&&g!==null&&(c=Lt(g)),c=new n(s,c),t.memoizedState=c.state!==null&&c.state!==void 0?c.state:null,c.updater=Sc,t.stateNode=c,c._reactInternals=t,c=t.stateNode,c.props=s,c.state=t.memoizedState,c.refs={},Pr(t),g=n.contextType,c.context=typeof g=="object"&&g!==null?Lt(g):Es,c.state=t.memoizedState,g=n.getDerivedStateFromProps,typeof g=="function"&&(wc(t,n,g,s),c.state=t.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof c.getSnapshotBeforeUpdate=="function"||typeof c.UNSAFE_componentWillMount!="function"&&typeof c.componentWillMount!="function"||(g=c.state,typeof c.componentWillMount=="function"&&c.componentWillMount(),typeof c.UNSAFE_componentWillMount=="function"&&c.UNSAFE_componentWillMount(),g!==c.state&&Sc.enqueueReplaceState(c,c.state,null),bo(t,s,c,l),yo(),c.state=t.memoizedState),typeof c.componentDidMount=="function"&&(t.flags|=4194308),s=!0}else if(e===null){c=t.stateNode;var x=t.memoizedProps,M=es(n,x);c.props=M;var Q=c.context,oe=n.contextType;g=Es,typeof oe=="object"&&oe!==null&&(g=Lt(oe));var de=n.getDerivedStateFromProps;oe=typeof de=="function"||typeof c.getSnapshotBeforeUpdate=="function",x=t.pendingProps!==x,oe||typeof c.UNSAFE_componentWillReceiveProps!="function"&&typeof c.componentWillReceiveProps!="function"||(x||Q!==g)&&hh(t,c,s,g),ya=!1;var J=t.memoizedState;c.state=J,bo(t,s,c,l),yo(),Q=t.memoizedState,x||J!==Q||ya?(typeof de=="function"&&(wc(t,n,de,s),Q=t.memoizedState),(M=ya||fh(t,n,M,s,J,Q,g))?(oe||typeof c.UNSAFE_componentWillMount!="function"&&typeof c.componentWillMount!="function"||(typeof c.componentWillMount=="function"&&c.componentWillMount(),typeof c.UNSAFE_componentWillMount=="function"&&c.UNSAFE_componentWillMount()),typeof c.componentDidMount=="function"&&(t.flags|=4194308)):(typeof c.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=s,t.memoizedState=Q),c.props=s,c.state=Q,c.context=g,s=M):(typeof c.componentDidMount=="function"&&(t.flags|=4194308),s=!1)}else{c=t.stateNode,Wr(e,t),g=t.memoizedProps,oe=es(n,g),c.props=oe,de=t.pendingProps,J=c.context,Q=n.contextType,M=Es,typeof Q=="object"&&Q!==null&&(M=Lt(Q)),x=n.getDerivedStateFromProps,(Q=typeof x=="function"||typeof c.getSnapshotBeforeUpdate=="function")||typeof c.UNSAFE_componentWillReceiveProps!="function"&&typeof c.componentWillReceiveProps!="function"||(g!==de||J!==M)&&hh(t,c,s,M),ya=!1,J=t.memoizedState,c.state=J,bo(t,s,c,l),yo();var I=t.memoizedState;g!==de||J!==I||ya||e!==null&&e.dependencies!==null&&Ti(e.dependencies)?(typeof x=="function"&&(wc(t,n,x,s),I=t.memoizedState),(oe=ya||fh(t,n,oe,s,J,I,M)||e!==null&&e.dependencies!==null&&Ti(e.dependencies))?(Q||typeof c.UNSAFE_componentWillUpdate!="function"&&typeof c.componentWillUpdate!="function"||(typeof c.componentWillUpdate=="function"&&c.componentWillUpdate(s,I,M),typeof c.UNSAFE_componentWillUpdate=="function"&&c.UNSAFE_componentWillUpdate(s,I,M)),typeof c.componentDidUpdate=="function"&&(t.flags|=4),typeof c.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof c.componentDidUpdate!="function"||g===e.memoizedProps&&J===e.memoizedState||(t.flags|=4),typeof c.getSnapshotBeforeUpdate!="function"||g===e.memoizedProps&&J===e.memoizedState||(t.flags|=1024),t.memoizedProps=s,t.memoizedState=I),c.props=s,c.state=I,c.context=M,s=oe):(typeof c.componentDidUpdate!="function"||g===e.memoizedProps&&J===e.memoizedState||(t.flags|=4),typeof c.getSnapshotBeforeUpdate!="function"||g===e.memoizedProps&&J===e.memoizedState||(t.flags|=1024),s=!1)}return c=s,Qi(e,t),s=(t.flags&128)!==0,c||s?(c=t.stateNode,n=s&&typeof n.getDerivedStateFromError!="function"?null:c.render(),t.flags|=1,e!==null&&s?(t.child=Wa(t,e.child,null,l),t.child=Wa(t,null,n,l)):Gt(e,t,n,l),t.memoizedState=c.state,e=t.child):e=Wn(e,t,l),e}function Th(e,t,n,s){return Va(),t.flags|=256,Gt(e,t,n,s),t.child}var kc={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Dc(e){return{baseLanes:e,cachePool:yf()}}function Tc(e,t,n){return e=e!==null?e.childLanes&~n:0,t&&(e|=bn),e}function Nh(e,t,n){var s=t.pendingProps,l=!1,c=(t.flags&128)!==0,g;if((g=c)||(g=e!==null&&e.memoizedState===null?!1:(kt.current&2)!==0),g&&(l=!0,t.flags&=-129),g=(t.flags&32)!==0,t.flags&=-33,e===null){if(Je){if(l?xa(t):wa(),(e=ft)?(e=Rp(e,kn),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:ha!==null?{id:Rn,overflow:qn}:null,retryLane:536870912,hydrationErrors:null},n=rf(e),n.return=t,t.child=n,Ut=t,ft=null)):e=null,e===null)throw ma(t);return uu(e)?t.lanes=32:t.lanes=536870912,null}var x=s.children;return s=s.fallback,l?(wa(),l=t.mode,x=Ji({mode:"hidden",children:x},l),s=Xa(s,l,n,null),x.return=t,s.return=t,x.sibling=s,t.child=x,s=t.child,s.memoizedState=Dc(n),s.childLanes=Tc(e,g,n),t.memoizedState=kc,Ao(null,s)):(xa(t),Nc(t,x))}var M=e.memoizedState;if(M!==null&&(x=M.dehydrated,x!==null)){if(c)t.flags&256?(xa(t),t.flags&=-257,t=Mc(e,t,n)):t.memoizedState!==null?(wa(),t.child=e.child,t.flags|=128,t=null):(wa(),x=s.fallback,l=t.mode,s=Ji({mode:"visible",children:s.children},l),x=Xa(x,l,n,null),x.flags|=2,s.return=t,x.return=t,s.sibling=x,t.child=s,Wa(t,e.child,null,n),s=t.child,s.memoizedState=Dc(n),s.childLanes=Tc(e,g,n),t.memoizedState=kc,t=Ao(null,s));else if(xa(t),uu(x)){if(g=x.nextSibling&&x.nextSibling.dataset,g)var Q=g.dgst;g=Q,s=Error(r(419)),s.stack="",s.digest=g,uo({value:s,source:null,stack:null}),t=Mc(e,t,n)}else if(Mt||Ts(e,t,n,!1),g=(n&e.childLanes)!==0,Mt||g){if(g=ut,g!==null&&(s=pd(g,n),s!==0&&s!==M.retryLane))throw M.retryLane=s,Fa(e,s),ln(g,e,s),Ec;cu(x)||al(),t=Mc(e,t,n)}else cu(x)?(t.flags|=192,t.child=e.child,t=null):(e=M.treeContext,ft=Tn(x.nextSibling),Ut=t,Je=!0,pa=null,kn=!1,e!==null&&df(t,e),t=Nc(t,s.children),t.flags|=4096);return t}return l?(wa(),x=s.fallback,l=t.mode,M=e.child,Q=M.sibling,s=Vn(M,{mode:"hidden",children:s.children}),s.subtreeFlags=M.subtreeFlags&65011712,Q!==null?x=Vn(Q,x):(x=Xa(x,l,n,null),x.flags|=2),x.return=t,s.return=t,s.sibling=x,t.child=s,Ao(null,s),s=t.child,x=e.child.memoizedState,x===null?x=Dc(n):(l=x.cachePool,l!==null?(M=Tt._currentValue,l=l.parent!==M?{parent:M,pool:M}:l):l=yf(),x={baseLanes:x.baseLanes|n,cachePool:l}),s.memoizedState=x,s.childLanes=Tc(e,g,n),t.memoizedState=kc,Ao(e.child,s)):(xa(t),n=e.child,e=n.sibling,n=Vn(n,{mode:"visible",children:s.children}),n.return=t,n.sibling=null,e!==null&&(g=t.deletions,g===null?(t.deletions=[e],t.flags|=16):g.push(e)),t.child=n,t.memoizedState=null,n)}function Nc(e,t){return t=Ji({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function Ji(e,t){return e=pn(22,e,null,t),e.lanes=0,e}function Mc(e,t,n){return Wa(t,e.child,null,n),e=Nc(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Mh(e,t,n){e.lanes|=t;var s=e.alternate;s!==null&&(s.lanes|=t),Xr(e.return,t,n)}function $c(e,t,n,s,l,c){var g=e.memoizedState;g===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:s,tail:n,tailMode:l,treeForkCount:c}:(g.isBackwards=t,g.rendering=null,g.renderingStartTime=0,g.last=s,g.tail=n,g.tailMode=l,g.treeForkCount=c)}function $h(e,t,n){var s=t.pendingProps,l=s.revealOrder,c=s.tail;s=s.children;var g=kt.current,x=(g&2)!==0;if(x?(g=g&1|2,t.flags|=128):g&=1,ce(kt,g),Gt(e,t,s,n),s=Je?co:0,!x&&e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Mh(e,n,t);else if(e.tag===19)Mh(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(l){case"forwards":for(n=t.child,l=null;n!==null;)e=n.alternate,e!==null&&zi(e)===null&&(l=n),n=n.sibling;n=l,n===null?(l=t.child,t.child=null):(l=n.sibling,n.sibling=null),$c(t,!1,l,n,c,s);break;case"backwards":case"unstable_legacy-backwards":for(n=null,l=t.child,t.child=null;l!==null;){if(e=l.alternate,e!==null&&zi(e)===null){t.child=l;break}e=l.sibling,l.sibling=n,n=l,l=e}$c(t,!0,n,null,c,s);break;case"together":$c(t,!1,null,null,void 0,s);break;default:t.memoizedState=null}return t.child}function Wn(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Ea|=t.lanes,(n&t.childLanes)===0)if(e!==null){if(Ts(e,t,n,!1),(n&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(r(153));if(t.child!==null){for(e=t.child,n=Vn(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Vn(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function Oc(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&Ti(e)))}function ly(e,t,n){switch(t.tag){case 3:Ge(t,t.stateNode.containerInfo),ga(t,Tt,e.memoizedState.cache),Va();break;case 27:case 5:G(t);break;case 4:Ge(t,t.stateNode.containerInfo);break;case 10:ga(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,ac(t),null;break;case 13:var s=t.memoizedState;if(s!==null)return s.dehydrated!==null?(xa(t),t.flags|=128,null):(n&t.child.childLanes)!==0?Nh(e,t,n):(xa(t),e=Wn(e,t,n),e!==null?e.sibling:null);xa(t);break;case 19:var l=(e.flags&128)!==0;if(s=(n&t.childLanes)!==0,s||(Ts(e,t,n,!1),s=(n&t.childLanes)!==0),l){if(s)return $h(e,t,n);t.flags|=128}if(l=t.memoizedState,l!==null&&(l.rendering=null,l.tail=null,l.lastEffect=null),ce(kt,kt.current),s)break;return null;case 22:return t.lanes=0,Ah(e,t,n,t.pendingProps);case 24:ga(t,Tt,e.memoizedState.cache)}return Wn(e,t,n)}function Oh(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps)Mt=!0;else{if(!Oc(e,n)&&(t.flags&128)===0)return Mt=!1,ly(e,t,n);Mt=(e.flags&131072)!==0}else Mt=!1,Je&&(t.flags&1048576)!==0&&uf(t,co,t.index);switch(t.lanes=0,t.tag){case 16:e:{var s=t.pendingProps;if(e=Ka(t.elementType),t.type=e,typeof e=="function")Rr(e)?(s=es(e,s),t.tag=1,t=Dh(null,t,e,s,n)):(t.tag=0,t=_c(null,t,e,s,n));else{if(e!=null){var l=e.$$typeof;if(l===H){t.tag=11,t=xh(null,t,e,s,n);break e}else if(l===ie){t.tag=14,t=wh(null,t,e,s,n);break e}}throw t=we(e)||e,Error(r(306,t,""))}}return t;case 0:return _c(e,t,t.type,t.pendingProps,n);case 1:return s=t.type,l=es(s,t.pendingProps),Dh(e,t,s,l,n);case 3:e:{if(Ge(t,t.stateNode.containerInfo),e===null)throw Error(r(387));s=t.pendingProps;var c=t.memoizedState;l=c.element,Wr(e,t),bo(t,s,null,n);var g=t.memoizedState;if(s=g.cache,ga(t,Tt,s),s!==c.cache&&Vr(t,[Tt],n,!0),yo(),s=g.element,c.isDehydrated)if(c={element:s,isDehydrated:!1,cache:g.cache},t.updateQueue.baseState=c,t.memoizedState=c,t.flags&256){t=Th(e,t,s,n);break e}else if(s!==l){l=An(Error(r(424)),t),uo(l),t=Th(e,t,s,n);break e}else for(e=t.stateNode.containerInfo,e.nodeType===9?e=e.body:e=e.nodeName==="HTML"?e.ownerDocument.body:e,ft=Tn(e.firstChild),Ut=t,Je=!0,pa=null,kn=!0,n=Af(t,null,s,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(Va(),s===l){t=Wn(e,t,n);break e}Gt(e,t,s,n)}t=t.child}return t;case 26:return Qi(e,t),e===null?(n=Yp(t.type,null,t.pendingProps,null))?t.memoizedState=n:Je||(n=t.type,e=t.pendingProps,s=ul(_e.current).createElement(n),s[Ht]=t,s[en]=e,Yt(s,n,e),Bt(s),t.stateNode=s):t.memoizedState=Yp(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return G(t),e===null&&Je&&(s=t.stateNode=Up(t.type,t.pendingProps,_e.current),Ut=t,kn=!0,l=ft,Na(t.type)?(du=l,ft=Tn(s.firstChild)):ft=l),Gt(e,t,t.pendingProps.children,n),Qi(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&Je&&((l=s=ft)&&(s=Ry(s,t.type,t.pendingProps,kn),s!==null?(t.stateNode=s,Ut=t,ft=Tn(s.firstChild),kn=!1,l=!0):l=!1),l||ma(t)),G(t),l=t.type,c=t.pendingProps,g=e!==null?e.memoizedProps:null,s=c.children,iu(l,c)?s=null:g!==null&&iu(l,g)&&(t.flags|=32),t.memoizedState!==null&&(l=oc(e,t,W0,null,null,n),qo._currentValue=l),Qi(e,t),Gt(e,t,s,n),t.child;case 6:return e===null&&Je&&((e=n=ft)&&(n=qy(n,t.pendingProps,kn),n!==null?(t.stateNode=n,Ut=t,ft=null,e=!0):e=!1),e||ma(t)),null;case 13:return Nh(e,t,n);case 4:return Ge(t,t.stateNode.containerInfo),s=t.pendingProps,e===null?t.child=Wa(t,null,s,n):Gt(e,t,s,n),t.child;case 11:return xh(e,t,t.type,t.pendingProps,n);case 7:return Gt(e,t,t.pendingProps,n),t.child;case 8:return Gt(e,t,t.pendingProps.children,n),t.child;case 12:return Gt(e,t,t.pendingProps.children,n),t.child;case 10:return s=t.pendingProps,ga(t,t.type,s.value),Gt(e,t,s.children,n),t.child;case 9:return l=t.type._context,s=t.pendingProps.children,Ja(t),l=Lt(l),s=s(l),t.flags|=1,Gt(e,t,s,n),t.child;case 14:return wh(e,t,t.type,t.pendingProps,n);case 15:return Sh(e,t,t.type,t.pendingProps,n);case 19:return $h(e,t,n);case 31:return iy(e,t,n);case 22:return Ah(e,t,n,t.pendingProps);case 24:return Ja(t),s=Lt(Tt),e===null?(l=Zr(),l===null&&(l=ut,c=Qr(),l.pooledCache=c,c.refCount++,c!==null&&(l.pooledCacheLanes|=n),l=c),t.memoizedState={parent:s,cache:l},Pr(t),ga(t,Tt,l)):((e.lanes&n)!==0&&(Wr(e,t),bo(t,null,null,n),yo()),l=e.memoizedState,c=t.memoizedState,l.parent!==s?(l={parent:s,cache:s},t.memoizedState=l,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=l),ga(t,Tt,s)):(s=c.cache,ga(t,Tt,s),s!==l.cache&&Vr(t,[Tt],n,!0))),Gt(e,t,t.pendingProps.children,n),t.child;case 29:throw t.pendingProps}throw Error(r(156,t.tag))}function In(e){e.flags|=4}function Cc(e,t,n,s,l){if((t=(e.mode&32)!==0)&&(t=!1),t){if(e.flags|=16777216,(l&335544128)===l)if(e.stateNode.complete)e.flags|=8192;else if(op())e.flags|=8192;else throw Pa=Oi,Kr}else e.flags&=-16777217}function Ch(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!Jp(t))if(op())e.flags|=8192;else throw Pa=Oi,Kr}function Zi(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?zn():536870912,e.lanes|=t,Us|=t)}function Eo(e,t){if(!Je)switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var s=null;n!==null;)n.alternate!==null&&(s=n),n=n.sibling;s===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:s.sibling=null}}function ht(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,s=0;if(t)for(var l=e.child;l!==null;)n|=l.lanes|l.childLanes,s|=l.subtreeFlags&65011712,s|=l.flags&65011712,l.return=e,l=l.sibling;else for(l=e.child;l!==null;)n|=l.lanes|l.childLanes,s|=l.subtreeFlags,s|=l.flags,l.return=e,l=l.sibling;return e.subtreeFlags|=s,e.childLanes=n,t}function ry(e,t,n){var s=t.pendingProps;switch(Lr(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return ht(t),null;case 1:return ht(t),null;case 3:return n=t.stateNode,s=null,e!==null&&(s=e.memoizedState.cache),t.memoizedState.cache!==s&&(t.flags|=2048),Zn(Tt),L(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(Ds(t)?In(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Yr())),ht(t),null;case 26:var l=t.type,c=t.memoizedState;return e===null?(In(t),c!==null?(ht(t),Ch(t,c)):(ht(t),Cc(t,l,null,s,n))):c?c!==e.memoizedState?(In(t),ht(t),Ch(t,c)):(ht(t),t.flags&=-16777217):(e=e.memoizedProps,e!==s&&In(t),ht(t),Cc(t,l,e,s,n)),null;case 27:if(A(t),n=_e.current,l=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==s&&In(t);else{if(!s){if(t.stateNode===null)throw Error(r(166));return ht(t),null}e=ve.current,Ds(t)?ff(t):(e=Up(l,s,n),t.stateNode=e,In(t))}return ht(t),null;case 5:if(A(t),l=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==s&&In(t);else{if(!s){if(t.stateNode===null)throw Error(r(166));return ht(t),null}if(c=ve.current,Ds(t))ff(t);else{var g=ul(_e.current);switch(c){case 1:c=g.createElementNS("http://www.w3.org/2000/svg",l);break;case 2:c=g.createElementNS("http://www.w3.org/1998/Math/MathML",l);break;default:switch(l){case"svg":c=g.createElementNS("http://www.w3.org/2000/svg",l);break;case"math":c=g.createElementNS("http://www.w3.org/1998/Math/MathML",l);break;case"script":c=g.createElement("div"),c.innerHTML="<script><\/script>",c=c.removeChild(c.firstChild);break;case"select":c=typeof s.is=="string"?g.createElement("select",{is:s.is}):g.createElement("select"),s.multiple?c.multiple=!0:s.size&&(c.size=s.size);break;default:c=typeof s.is=="string"?g.createElement(l,{is:s.is}):g.createElement(l)}}c[Ht]=t,c[en]=s;e:for(g=t.child;g!==null;){if(g.tag===5||g.tag===6)c.appendChild(g.stateNode);else if(g.tag!==4&&g.tag!==27&&g.child!==null){g.child.return=g,g=g.child;continue}if(g===t)break e;for(;g.sibling===null;){if(g.return===null||g.return===t)break e;g=g.return}g.sibling.return=g.return,g=g.sibling}t.stateNode=c;e:switch(Yt(c,l,s),l){case"button":case"input":case"select":case"textarea":s=!!s.autoFocus;break e;case"img":s=!0;break e;default:s=!1}s&&In(t)}}return ht(t),Cc(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==s&&In(t);else{if(typeof s!="string"&&t.stateNode===null)throw Error(r(166));if(e=_e.current,Ds(t)){if(e=t.stateNode,n=t.memoizedProps,s=null,l=Ut,l!==null)switch(l.tag){case 27:case 5:s=l.memoizedProps}e[Ht]=t,e=!!(e.nodeValue===n||s!==null&&s.suppressHydrationWarning===!0||Np(e.nodeValue,n)),e||ma(t,!0)}else e=ul(e).createTextNode(s),e[Ht]=t,t.stateNode=e}return ht(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(s=Ds(t),n!==null){if(e===null){if(!s)throw Error(r(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(r(557));e[Ht]=t}else Va(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;ht(t),e=!1}else n=Yr(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(gn(t),t):(gn(t),null);if((t.flags&128)!==0)throw Error(r(558))}return ht(t),null;case 13:if(s=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(l=Ds(t),s!==null&&s.dehydrated!==null){if(e===null){if(!l)throw Error(r(318));if(l=t.memoizedState,l=l!==null?l.dehydrated:null,!l)throw Error(r(317));l[Ht]=t}else Va(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;ht(t),l=!1}else l=Yr(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=l),l=!0;if(!l)return t.flags&256?(gn(t),t):(gn(t),null)}return gn(t),(t.flags&128)!==0?(t.lanes=n,t):(n=s!==null,e=e!==null&&e.memoizedState!==null,n&&(s=t.child,l=null,s.alternate!==null&&s.alternate.memoizedState!==null&&s.alternate.memoizedState.cachePool!==null&&(l=s.alternate.memoizedState.cachePool.pool),c=null,s.memoizedState!==null&&s.memoizedState.cachePool!==null&&(c=s.memoizedState.cachePool.pool),c!==l&&(s.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),Zi(t,t.updateQueue),ht(t),null);case 4:return L(),e===null&&tu(t.stateNode.containerInfo),ht(t),null;case 10:return Zn(t.type),ht(t),null;case 19:if(X(kt),s=t.memoizedState,s===null)return ht(t),null;if(l=(t.flags&128)!==0,c=s.rendering,c===null)if(l)Eo(s,!1);else{if(xt!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(c=zi(e),c!==null){for(t.flags|=128,Eo(s,!1),e=c.updateQueue,t.updateQueue=e,Zi(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)lf(n,e),n=n.sibling;return ce(kt,kt.current&1|2),Je&&Qn(t,s.treeForkCount),t.child}e=e.sibling}s.tail!==null&&nt()>el&&(t.flags|=128,l=!0,Eo(s,!1),t.lanes=4194304)}else{if(!l)if(e=zi(c),e!==null){if(t.flags|=128,l=!0,e=e.updateQueue,t.updateQueue=e,Zi(t,e),Eo(s,!0),s.tail===null&&s.tailMode==="hidden"&&!c.alternate&&!Je)return ht(t),null}else 2*nt()-s.renderingStartTime>el&&n!==536870912&&(t.flags|=128,l=!0,Eo(s,!1),t.lanes=4194304);s.isBackwards?(c.sibling=t.child,t.child=c):(e=s.last,e!==null?e.sibling=c:t.child=c,s.last=c)}return s.tail!==null?(e=s.tail,s.rendering=e,s.tail=e.sibling,s.renderingStartTime=nt(),e.sibling=null,n=kt.current,ce(kt,l?n&1|2:n&1),Je&&Qn(t,s.treeForkCount),e):(ht(t),null);case 22:case 23:return gn(t),nc(),s=t.memoizedState!==null,e!==null?e.memoizedState!==null!==s&&(t.flags|=8192):s&&(t.flags|=8192),s?(n&536870912)!==0&&(t.flags&128)===0&&(ht(t),t.subtreeFlags&6&&(t.flags|=8192)):ht(t),n=t.updateQueue,n!==null&&Zi(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),s=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(s=t.memoizedState.cachePool.pool),s!==n&&(t.flags|=2048),e!==null&&X(Za),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),Zn(Tt),ht(t),null;case 25:return null;case 30:return null}throw Error(r(156,t.tag))}function cy(e,t){switch(Lr(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Zn(Tt),L(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return A(t),null;case 31:if(t.memoizedState!==null){if(gn(t),t.alternate===null)throw Error(r(340));Va()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(gn(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(r(340));Va()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return X(kt),null;case 4:return L(),null;case 10:return Zn(t.type),null;case 22:case 23:return gn(t),nc(),e!==null&&X(Za),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return Zn(Tt),null;case 25:return null;default:return null}}function jh(e,t){switch(Lr(t),t.tag){case 3:Zn(Tt),L();break;case 26:case 27:case 5:A(t);break;case 4:L();break;case 31:t.memoizedState!==null&&gn(t);break;case 13:gn(t);break;case 19:X(kt);break;case 10:Zn(t.type);break;case 22:case 23:gn(t),nc(),e!==null&&X(Za);break;case 24:Zn(Tt)}}function _o(e,t){try{var n=t.updateQueue,s=n!==null?n.lastEffect:null;if(s!==null){var l=s.next;n=l;do{if((n.tag&e)===e){s=void 0;var c=n.create,g=n.inst;s=c(),g.destroy=s}n=n.next}while(n!==l)}}catch(x){ot(t,t.return,x)}}function Sa(e,t,n){try{var s=t.updateQueue,l=s!==null?s.lastEffect:null;if(l!==null){var c=l.next;s=c;do{if((s.tag&e)===e){var g=s.inst,x=g.destroy;if(x!==void 0){g.destroy=void 0,l=t;var M=n,Q=x;try{Q()}catch(oe){ot(l,M,oe)}}}s=s.next}while(s!==c)}}catch(oe){ot(t,t.return,oe)}}function Bh(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{_f(t,n)}catch(s){ot(e,e.return,s)}}}function zh(e,t,n){n.props=es(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(s){ot(e,t,s)}}function ko(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var s=e.stateNode;break;case 30:s=e.stateNode;break;default:s=e.stateNode}typeof n=="function"?e.refCleanup=n(s):n.current=s}}catch(l){ot(e,t,l)}}function Hn(e,t){var n=e.ref,s=e.refCleanup;if(n!==null)if(typeof s=="function")try{s()}catch(l){ot(e,t,l)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n=="function")try{n(null)}catch(l){ot(e,t,l)}else n.current=null}function Rh(e){var t=e.type,n=e.memoizedProps,s=e.stateNode;try{e:switch(t){case"button":case"input":case"select":case"textarea":n.autoFocus&&s.focus();break e;case"img":n.src?s.src=n.src:n.srcSet&&(s.srcset=n.srcSet)}}catch(l){ot(e,e.return,l)}}function jc(e,t,n){try{var s=e.stateNode;$y(s,e.type,n,t),s[en]=t}catch(l){ot(e,e.return,l)}}function qh(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Na(e.type)||e.tag===4}function Bc(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||qh(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Na(e.type)||e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function zc(e,t,n){var s=e.tag;if(s===5||s===6)e=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n).insertBefore(e,t):(t=n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n,t.appendChild(e),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=Fn));else if(s!==4&&(s===27&&Na(e.type)&&(n=e.stateNode,t=null),e=e.child,e!==null))for(zc(e,t,n),e=e.sibling;e!==null;)zc(e,t,n),e=e.sibling}function Ki(e,t,n){var s=e.tag;if(s===5||s===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(s!==4&&(s===27&&Na(e.type)&&(n=e.stateNode),e=e.child,e!==null))for(Ki(e,t,n),e=e.sibling;e!==null;)Ki(e,t,n),e=e.sibling}function Hh(e){var t=e.stateNode,n=e.memoizedProps;try{for(var s=e.type,l=t.attributes;l.length;)t.removeAttributeNode(l[0]);Yt(t,s,n),t[Ht]=e,t[en]=n}catch(c){ot(e,e.return,c)}}var ea=!1,$t=!1,Rc=!1,Uh=typeof WeakSet=="function"?WeakSet:Set,zt=null;function uy(e,t){if(e=e.containerInfo,su=yl,e=Pd(e),Mr(e)){if("selectionStart"in e)var n={start:e.selectionStart,end:e.selectionEnd};else e:{n=(n=e.ownerDocument)&&n.defaultView||window;var s=n.getSelection&&n.getSelection();if(s&&s.rangeCount!==0){n=s.anchorNode;var l=s.anchorOffset,c=s.focusNode;s=s.focusOffset;try{n.nodeType,c.nodeType}catch{n=null;break e}var g=0,x=-1,M=-1,Q=0,oe=0,de=e,J=null;t:for(;;){for(var I;de!==n||l!==0&&de.nodeType!==3||(x=g+l),de!==c||s!==0&&de.nodeType!==3||(M=g+s),de.nodeType===3&&(g+=de.nodeValue.length),(I=de.firstChild)!==null;)J=de,de=I;for(;;){if(de===e)break t;if(J===n&&++Q===l&&(x=g),J===c&&++oe===s&&(M=g),(I=de.nextSibling)!==null)break;de=J,J=de.parentNode}de=I}n=x===-1||M===-1?null:{start:x,end:M}}else n=null}n=n||{start:0,end:0}}else n=null;for(ou={focusedElem:e,selectionRange:n},yl=!1,zt=t;zt!==null;)if(t=zt,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,zt=e;else for(;zt!==null;){switch(t=zt,c=t.alternate,e=t.flags,t.tag){case 0:if((e&4)!==0&&(e=t.updateQueue,e=e!==null?e.events:null,e!==null))for(n=0;n<e.length;n++)l=e[n],l.ref.impl=l.nextImpl;break;case 11:case 15:break;case 1:if((e&1024)!==0&&c!==null){e=void 0,n=t,l=c.memoizedProps,c=c.memoizedState,s=n.stateNode;try{var Te=es(n.type,l);e=s.getSnapshotBeforeUpdate(Te,c),s.__reactInternalSnapshotBeforeUpdate=e}catch(Be){ot(n,n.return,Be)}}break;case 3:if((e&1024)!==0){if(e=t.stateNode.containerInfo,n=e.nodeType,n===9)ru(e);else if(n===1)switch(e.nodeName){case"HEAD":case"HTML":case"BODY":ru(e);break;default:e.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;default:if((e&1024)!==0)throw Error(r(163))}if(e=t.sibling,e!==null){e.return=t.return,zt=e;break}zt=t.return}}function Lh(e,t,n){var s=n.flags;switch(n.tag){case 0:case 11:case 15:na(e,n),s&4&&_o(5,n);break;case 1:if(na(e,n),s&4)if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(g){ot(n,n.return,g)}else{var l=es(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(l,t,e.__reactInternalSnapshotBeforeUpdate)}catch(g){ot(n,n.return,g)}}s&64&&Bh(n),s&512&&ko(n,n.return);break;case 3:if(na(e,n),s&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{_f(e,t)}catch(g){ot(n,n.return,g)}}break;case 27:t===null&&s&4&&Hh(n);case 26:case 5:na(e,n),t===null&&s&4&&Rh(n),s&512&&ko(n,n.return);break;case 12:na(e,n);break;case 31:na(e,n),s&4&&Fh(e,n);break;case 13:na(e,n),s&4&&Xh(e,n),s&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=vy.bind(null,n),Hy(e,n))));break;case 22:if(s=n.memoizedState!==null||ea,!s){t=t!==null&&t.memoizedState!==null||$t,l=ea;var c=$t;ea=s,($t=t)&&!c?aa(e,n,(n.subtreeFlags&8772)!==0):na(e,n),ea=l,$t=c}break;case 30:break;default:na(e,n)}}function Gh(e){var t=e.alternate;t!==null&&(e.alternate=null,Gh(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&hr(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var mt=null,nn=!1;function ta(e,t,n){for(n=n.child;n!==null;)Yh(e,t,n),n=n.sibling}function Yh(e,t,n){if(Vt&&typeof Vt.onCommitFiberUnmount=="function")try{Vt.onCommitFiberUnmount(Mn,n)}catch{}switch(n.tag){case 26:$t||Hn(n,t),ta(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:$t||Hn(n,t);var s=mt,l=nn;Na(n.type)&&(mt=n.stateNode,nn=!1),ta(e,t,n),Bo(n.stateNode),mt=s,nn=l;break;case 5:$t||Hn(n,t);case 6:if(s=mt,l=nn,mt=null,ta(e,t,n),mt=s,nn=l,mt!==null)if(nn)try{(mt.nodeType===9?mt.body:mt.nodeName==="HTML"?mt.ownerDocument.body:mt).removeChild(n.stateNode)}catch(c){ot(n,t,c)}else try{mt.removeChild(n.stateNode)}catch(c){ot(n,t,c)}break;case 18:mt!==null&&(nn?(e=mt,Bp(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,n.stateNode),Js(e)):Bp(mt,n.stateNode));break;case 4:s=mt,l=nn,mt=n.stateNode.containerInfo,nn=!0,ta(e,t,n),mt=s,nn=l;break;case 0:case 11:case 14:case 15:Sa(2,n,t),$t||Sa(4,n,t),ta(e,t,n);break;case 1:$t||(Hn(n,t),s=n.stateNode,typeof s.componentWillUnmount=="function"&&zh(n,t,s)),ta(e,t,n);break;case 21:ta(e,t,n);break;case 22:$t=(s=$t)||n.memoizedState!==null,ta(e,t,n),$t=s;break;default:ta(e,t,n)}}function Fh(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{Js(e)}catch(n){ot(t,t.return,n)}}}function Xh(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Js(e)}catch(n){ot(t,t.return,n)}}function dy(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new Uh),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new Uh),t;default:throw Error(r(435,e.tag))}}function Pi(e,t){var n=dy(e);t.forEach(function(s){if(!n.has(s)){n.add(s);var l=xy.bind(null,e,s);s.then(l,l)}})}function an(e,t){var n=t.deletions;if(n!==null)for(var s=0;s<n.length;s++){var l=n[s],c=e,g=t,x=g;e:for(;x!==null;){switch(x.tag){case 27:if(Na(x.type)){mt=x.stateNode,nn=!1;break e}break;case 5:mt=x.stateNode,nn=!1;break e;case 3:case 4:mt=x.stateNode.containerInfo,nn=!0;break e}x=x.return}if(mt===null)throw Error(r(160));Yh(c,g,l),mt=null,nn=!1,c=l.alternate,c!==null&&(c.return=null),l.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)Vh(t,e),t=t.sibling}var On=null;function Vh(e,t){var n=e.alternate,s=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:an(t,e),sn(e),s&4&&(Sa(3,e,e.return),_o(3,e),Sa(5,e,e.return));break;case 1:an(t,e),sn(e),s&512&&($t||n===null||Hn(n,n.return)),s&64&&ea&&(e=e.updateQueue,e!==null&&(s=e.callbacks,s!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?s:n.concat(s))));break;case 26:var l=On;if(an(t,e),sn(e),s&512&&($t||n===null||Hn(n,n.return)),s&4){var c=n!==null?n.memoizedState:null;if(s=e.memoizedState,n===null)if(s===null)if(e.stateNode===null){e:{s=e.type,n=e.memoizedProps,l=l.ownerDocument||l;t:switch(s){case"title":c=l.getElementsByTagName("title")[0],(!c||c[Ws]||c[Ht]||c.namespaceURI==="http://www.w3.org/2000/svg"||c.hasAttribute("itemprop"))&&(c=l.createElement(s),l.head.insertBefore(c,l.querySelector("head > title"))),Yt(c,s,n),c[Ht]=e,Bt(c),s=c;break e;case"link":var g=Vp("link","href",l).get(s+(n.href||""));if(g){for(var x=0;x<g.length;x++)if(c=g[x],c.getAttribute("href")===(n.href==null||n.href===""?null:n.href)&&c.getAttribute("rel")===(n.rel==null?null:n.rel)&&c.getAttribute("title")===(n.title==null?null:n.title)&&c.getAttribute("crossorigin")===(n.crossOrigin==null?null:n.crossOrigin)){g.splice(x,1);break t}}c=l.createElement(s),Yt(c,s,n),l.head.appendChild(c);break;case"meta":if(g=Vp("meta","content",l).get(s+(n.content||""))){for(x=0;x<g.length;x++)if(c=g[x],c.getAttribute("content")===(n.content==null?null:""+n.content)&&c.getAttribute("name")===(n.name==null?null:n.name)&&c.getAttribute("property")===(n.property==null?null:n.property)&&c.getAttribute("http-equiv")===(n.httpEquiv==null?null:n.httpEquiv)&&c.getAttribute("charset")===(n.charSet==null?null:n.charSet)){g.splice(x,1);break t}}c=l.createElement(s),Yt(c,s,n),l.head.appendChild(c);break;default:throw Error(r(468,s))}c[Ht]=e,Bt(c),s=c}e.stateNode=s}else Qp(l,e.type,e.stateNode);else e.stateNode=Xp(l,s,e.memoizedProps);else c!==s?(c===null?n.stateNode!==null&&(n=n.stateNode,n.parentNode.removeChild(n)):c.count--,s===null?Qp(l,e.type,e.stateNode):Xp(l,s,e.memoizedProps)):s===null&&e.stateNode!==null&&jc(e,e.memoizedProps,n.memoizedProps)}break;case 27:an(t,e),sn(e),s&512&&($t||n===null||Hn(n,n.return)),n!==null&&s&4&&jc(e,e.memoizedProps,n.memoizedProps);break;case 5:if(an(t,e),sn(e),s&512&&($t||n===null||Hn(n,n.return)),e.flags&32){l=e.stateNode;try{ys(l,"")}catch(Te){ot(e,e.return,Te)}}s&4&&e.stateNode!=null&&(l=e.memoizedProps,jc(e,l,n!==null?n.memoizedProps:l)),s&1024&&(Rc=!0);break;case 6:if(an(t,e),sn(e),s&4){if(e.stateNode===null)throw Error(r(162));s=e.memoizedProps,n=e.stateNode;try{n.nodeValue=s}catch(Te){ot(e,e.return,Te)}}break;case 3:if(hl=null,l=On,On=dl(t.containerInfo),an(t,e),On=l,sn(e),s&4&&n!==null&&n.memoizedState.isDehydrated)try{Js(t.containerInfo)}catch(Te){ot(e,e.return,Te)}Rc&&(Rc=!1,Qh(e));break;case 4:s=On,On=dl(e.stateNode.containerInfo),an(t,e),sn(e),On=s;break;case 12:an(t,e),sn(e);break;case 31:an(t,e),sn(e),s&4&&(s=e.updateQueue,s!==null&&(e.updateQueue=null,Pi(e,s)));break;case 13:an(t,e),sn(e),e.child.flags&8192&&e.memoizedState!==null!=(n!==null&&n.memoizedState!==null)&&(Ii=nt()),s&4&&(s=e.updateQueue,s!==null&&(e.updateQueue=null,Pi(e,s)));break;case 22:l=e.memoizedState!==null;var M=n!==null&&n.memoizedState!==null,Q=ea,oe=$t;if(ea=Q||l,$t=oe||M,an(t,e),$t=oe,ea=Q,sn(e),s&8192)e:for(t=e.stateNode,t._visibility=l?t._visibility&-2:t._visibility|1,l&&(n===null||M||ea||$t||ts(e)),n=null,t=e;;){if(t.tag===5||t.tag===26){if(n===null){M=n=t;try{if(c=M.stateNode,l)g=c.style,typeof g.setProperty=="function"?g.setProperty("display","none","important"):g.display="none";else{x=M.stateNode;var de=M.memoizedProps.style,J=de!=null&&de.hasOwnProperty("display")?de.display:null;x.style.display=J==null||typeof J=="boolean"?"":(""+J).trim()}}catch(Te){ot(M,M.return,Te)}}}else if(t.tag===6){if(n===null){M=t;try{M.stateNode.nodeValue=l?"":M.memoizedProps}catch(Te){ot(M,M.return,Te)}}}else if(t.tag===18){if(n===null){M=t;try{var I=M.stateNode;l?zp(I,!0):zp(M.stateNode,!1)}catch(Te){ot(M,M.return,Te)}}}else if((t.tag!==22&&t.tag!==23||t.memoizedState===null||t===e)&&t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;n===t&&(n=null),t=t.return}n===t&&(n=null),t.sibling.return=t.return,t=t.sibling}s&4&&(s=e.updateQueue,s!==null&&(n=s.retryQueue,n!==null&&(s.retryQueue=null,Pi(e,n))));break;case 19:an(t,e),sn(e),s&4&&(s=e.updateQueue,s!==null&&(e.updateQueue=null,Pi(e,s)));break;case 30:break;case 21:break;default:an(t,e),sn(e)}}function sn(e){var t=e.flags;if(t&2){try{for(var n,s=e.return;s!==null;){if(qh(s)){n=s;break}s=s.return}if(n==null)throw Error(r(160));switch(n.tag){case 27:var l=n.stateNode,c=Bc(e);Ki(e,c,l);break;case 5:var g=n.stateNode;n.flags&32&&(ys(g,""),n.flags&=-33);var x=Bc(e);Ki(e,x,g);break;case 3:case 4:var M=n.stateNode.containerInfo,Q=Bc(e);zc(e,Q,M);break;default:throw Error(r(161))}}catch(oe){ot(e,e.return,oe)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Qh(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Qh(t),t.tag===5&&t.flags&1024&&t.stateNode.reset(),e=e.sibling}}function na(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)Lh(e,t.alternate,t),t=t.sibling}function ts(e){for(e=e.child;e!==null;){var t=e;switch(t.tag){case 0:case 11:case 14:case 15:Sa(4,t,t.return),ts(t);break;case 1:Hn(t,t.return);var n=t.stateNode;typeof n.componentWillUnmount=="function"&&zh(t,t.return,n),ts(t);break;case 27:Bo(t.stateNode);case 26:case 5:Hn(t,t.return),ts(t);break;case 22:t.memoizedState===null&&ts(t);break;case 30:ts(t);break;default:ts(t)}e=e.sibling}}function aa(e,t,n){for(n=n&&(t.subtreeFlags&8772)!==0,t=t.child;t!==null;){var s=t.alternate,l=e,c=t,g=c.flags;switch(c.tag){case 0:case 11:case 15:aa(l,c,n),_o(4,c);break;case 1:if(aa(l,c,n),s=c,l=s.stateNode,typeof l.componentDidMount=="function")try{l.componentDidMount()}catch(Q){ot(s,s.return,Q)}if(s=c,l=s.updateQueue,l!==null){var x=s.stateNode;try{var M=l.shared.hiddenCallbacks;if(M!==null)for(l.shared.hiddenCallbacks=null,l=0;l<M.length;l++)Ef(M[l],x)}catch(Q){ot(s,s.return,Q)}}n&&g&64&&Bh(c),ko(c,c.return);break;case 27:Hh(c);case 26:case 5:aa(l,c,n),n&&s===null&&g&4&&Rh(c),ko(c,c.return);break;case 12:aa(l,c,n);break;case 31:aa(l,c,n),n&&g&4&&Fh(l,c);break;case 13:aa(l,c,n),n&&g&4&&Xh(l,c);break;case 22:c.memoizedState===null&&aa(l,c,n),ko(c,c.return);break;case 30:break;default:aa(l,c,n)}t=t.sibling}}function qc(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&fo(n))}function Hc(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&fo(e))}function Cn(e,t,n,s){if(t.subtreeFlags&10256)for(t=t.child;t!==null;)Jh(e,t,n,s),t=t.sibling}function Jh(e,t,n,s){var l=t.flags;switch(t.tag){case 0:case 11:case 15:Cn(e,t,n,s),l&2048&&_o(9,t);break;case 1:Cn(e,t,n,s);break;case 3:Cn(e,t,n,s),l&2048&&(e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&fo(e)));break;case 12:if(l&2048){Cn(e,t,n,s),e=t.stateNode;try{var c=t.memoizedProps,g=c.id,x=c.onPostCommit;typeof x=="function"&&x(g,t.alternate===null?"mount":"update",e.passiveEffectDuration,-0)}catch(M){ot(t,t.return,M)}}else Cn(e,t,n,s);break;case 31:Cn(e,t,n,s);break;case 13:Cn(e,t,n,s);break;case 23:break;case 22:c=t.stateNode,g=t.alternate,t.memoizedState!==null?c._visibility&2?Cn(e,t,n,s):Do(e,t):c._visibility&2?Cn(e,t,n,s):(c._visibility|=2,Rs(e,t,n,s,(t.subtreeFlags&10256)!==0||!1)),l&2048&&qc(g,t);break;case 24:Cn(e,t,n,s),l&2048&&Hc(t.alternate,t);break;default:Cn(e,t,n,s)}}function Rs(e,t,n,s,l){for(l=l&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var c=e,g=t,x=n,M=s,Q=g.flags;switch(g.tag){case 0:case 11:case 15:Rs(c,g,x,M,l),_o(8,g);break;case 23:break;case 22:var oe=g.stateNode;g.memoizedState!==null?oe._visibility&2?Rs(c,g,x,M,l):Do(c,g):(oe._visibility|=2,Rs(c,g,x,M,l)),l&&Q&2048&&qc(g.alternate,g);break;case 24:Rs(c,g,x,M,l),l&&Q&2048&&Hc(g.alternate,g);break;default:Rs(c,g,x,M,l)}t=t.sibling}}function Do(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,s=t,l=s.flags;switch(s.tag){case 22:Do(n,s),l&2048&&qc(s.alternate,s);break;case 24:Do(n,s),l&2048&&Hc(s.alternate,s);break;default:Do(n,s)}t=t.sibling}}var To=8192;function qs(e,t,n){if(e.subtreeFlags&To)for(e=e.child;e!==null;)Zh(e,t,n),e=e.sibling}function Zh(e,t,n){switch(e.tag){case 26:qs(e,t,n),e.flags&To&&e.memoizedState!==null&&Py(n,On,e.memoizedState,e.memoizedProps);break;case 5:qs(e,t,n);break;case 3:case 4:var s=On;On=dl(e.stateNode.containerInfo),qs(e,t,n),On=s;break;case 22:e.memoizedState===null&&(s=e.alternate,s!==null&&s.memoizedState!==null?(s=To,To=16777216,qs(e,t,n),To=s):qs(e,t,n));break;default:qs(e,t,n)}}function Kh(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function No(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var s=t[n];zt=s,Wh(s,e)}Kh(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)Ph(e),e=e.sibling}function Ph(e){switch(e.tag){case 0:case 11:case 15:No(e),e.flags&2048&&Sa(9,e,e.return);break;case 3:No(e);break;case 12:No(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,Wi(e)):No(e);break;default:No(e)}}function Wi(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var s=t[n];zt=s,Wh(s,e)}Kh(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Sa(8,t,t.return),Wi(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,Wi(t));break;default:Wi(t)}e=e.sibling}}function Wh(e,t){for(;zt!==null;){var n=zt;switch(n.tag){case 0:case 11:case 15:Sa(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var s=n.memoizedState.cachePool.pool;s!=null&&s.refCount++}break;case 24:fo(n.memoizedState.cache)}if(s=n.child,s!==null)s.return=n,zt=s;else e:for(n=e;zt!==null;){s=zt;var l=s.sibling,c=s.return;if(Gh(s),s===n){zt=null;break e}if(l!==null){l.return=c,zt=l;break e}zt=c}}}var fy={getCacheForType:function(e){var t=Lt(Tt),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return Lt(Tt).controller.signal}},hy=typeof WeakMap=="function"?WeakMap:Map,Pe=0,ut=null,Fe=null,Ve=0,st=0,yn=null,Aa=!1,Hs=!1,Uc=!1,sa=0,xt=0,Ea=0,ns=0,Lc=0,bn=0,Us=0,Mo=null,on=null,Gc=!1,Ii=0,Ih=0,el=1/0,tl=null,_a=null,Ct=0,ka=null,Ls=null,oa=0,Yc=0,Fc=null,ep=null,$o=0,Xc=null;function vn(){return(Pe&2)!==0&&Ve!==0?Ve&-Ve:E.T!==null?Pc():md()}function tp(){if(bn===0)if((Ve&536870912)===0||Je){var e=je;je<<=1,(je&3932160)===0&&(je=262144),bn=e}else bn=536870912;return e=mn.current,e!==null&&(e.flags|=32),bn}function ln(e,t,n){(e===ut&&(st===2||st===9)||e.cancelPendingCommit!==null)&&(Gs(e,0),Da(e,Ve,bn,!1)),ua(e,n),((Pe&2)===0||e!==ut)&&(e===ut&&((Pe&2)===0&&(ns|=n),xt===4&&Da(e,Ve,bn,!1)),Un(e))}function np(e,t,n){if((Pe&6)!==0)throw Error(r(327));var s=!n&&(t&127)===0&&(t&e.expiredLanes)===0||bt(e,t),l=s?gy(e,t):Qc(e,t,!0),c=s;do{if(l===0){Hs&&!s&&Da(e,t,0,!1);break}else{if(n=e.current.alternate,c&&!py(n)){l=Qc(e,t,!1),c=!1;continue}if(l===2){if(c=t,e.errorRecoveryDisabledLanes&c)var g=0;else g=e.pendingLanes&-536870913,g=g!==0?g:g&536870912?536870912:0;if(g!==0){t=g;e:{var x=e;l=Mo;var M=x.current.memoizedState.isDehydrated;if(M&&(Gs(x,g).flags|=256),g=Qc(x,g,!1),g!==2){if(Uc&&!M){x.errorRecoveryDisabledLanes|=c,ns|=c,l=4;break e}c=on,on=l,c!==null&&(on===null?on=c:on.push.apply(on,c))}l=g}if(c=!1,l!==2)continue}}if(l===1){Gs(e,0),Da(e,t,0,!0);break}e:{switch(s=e,c=l,c){case 0:case 1:throw Error(r(345));case 4:if((t&4194048)!==t)break;case 6:Da(s,t,bn,!Aa);break e;case 2:on=null;break;case 3:case 5:break;default:throw Error(r(329))}if((t&62914560)===t&&(l=Ii+300-nt(),10<l)){if(Da(s,t,bn,!Aa),at(s,0,!0)!==0)break e;oa=t,s.timeoutHandle=Cp(ap.bind(null,s,n,on,tl,Gc,t,bn,ns,Us,Aa,c,"Throttled",-0,0),l);break e}ap(s,n,on,tl,Gc,t,bn,ns,Us,Aa,c,null,-0,0)}}break}while(!0);Un(e)}function ap(e,t,n,s,l,c,g,x,M,Q,oe,de,J,I){if(e.timeoutHandle=-1,de=t.subtreeFlags,de&8192||(de&16785408)===16785408){de={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:Fn},Zh(t,c,de);var Te=(c&62914560)===c?Ii-nt():(c&4194048)===c?Ih-nt():0;if(Te=Wy(de,Te),Te!==null){oa=c,e.cancelPendingCommit=Te(dp.bind(null,e,t,c,n,s,l,g,x,M,oe,de,null,J,I)),Da(e,c,g,!Q);return}}dp(e,t,c,n,s,l,g,x,M)}function py(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var s=0;s<n.length;s++){var l=n[s],c=l.getSnapshot;l=l.value;try{if(!hn(c(),l))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function Da(e,t,n,s){t&=~Lc,t&=~ns,e.suspendedLanes|=t,e.pingedLanes&=~t,s&&(e.warmLanes|=t),s=e.expirationTimes;for(var l=t;0<l;){var c=31-Zt(l),g=1<<c;s[c]=-1,l&=~g}n!==0&&fd(e,n,t)}function nl(){return(Pe&6)===0?(Oo(0),!1):!0}function Vc(){if(Fe!==null){if(st===0)var e=Fe.return;else e=Fe,Jn=Qa=null,rc(e),Os=null,po=0,e=Fe;for(;e!==null;)jh(e.alternate,e),e=e.return;Fe=null}}function Gs(e,t){var n=e.timeoutHandle;n!==-1&&(e.timeoutHandle=-1,jy(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),oa=0,Vc(),ut=e,Fe=n=Vn(e.current,null),Ve=t,st=0,yn=null,Aa=!1,Hs=bt(e,t),Uc=!1,Us=bn=Lc=ns=Ea=xt=0,on=Mo=null,Gc=!1,(t&8)!==0&&(t|=t&32);var s=e.entangledLanes;if(s!==0)for(e=e.entanglements,s&=t;0<s;){var l=31-Zt(s),c=1<<l;t|=e[l],s&=~c}return sa=t,Ai(),n}function sp(e,t){Ue=null,E.H=So,t===$s||t===$i?(t=xf(),st=3):t===Kr?(t=xf(),st=4):st=t===Ec?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,yn=t,Fe===null&&(xt=1,Xi(e,An(t,e.current)))}function op(){var e=mn.current;return e===null?!0:(Ve&4194048)===Ve?Dn===null:(Ve&62914560)===Ve||(Ve&536870912)!==0?e===Dn:!1}function ip(){var e=E.H;return E.H=So,e===null?So:e}function lp(){var e=E.A;return E.A=fy,e}function al(){xt=4,Aa||(Ve&4194048)!==Ve&&mn.current!==null||(Hs=!0),(Ea&134217727)===0&&(ns&134217727)===0||ut===null||Da(ut,Ve,bn,!1)}function Qc(e,t,n){var s=Pe;Pe|=2;var l=ip(),c=lp();(ut!==e||Ve!==t)&&(tl=null,Gs(e,t)),t=!1;var g=xt;e:do try{if(st!==0&&Fe!==null){var x=Fe,M=yn;switch(st){case 8:Vc(),g=6;break e;case 3:case 2:case 9:case 6:mn.current===null&&(t=!0);var Q=st;if(st=0,yn=null,Ys(e,x,M,Q),n&&Hs){g=0;break e}break;default:Q=st,st=0,yn=null,Ys(e,x,M,Q)}}my(),g=xt;break}catch(oe){sp(e,oe)}while(!0);return t&&e.shellSuspendCounter++,Jn=Qa=null,Pe=s,E.H=l,E.A=c,Fe===null&&(ut=null,Ve=0,Ai()),g}function my(){for(;Fe!==null;)rp(Fe)}function gy(e,t){var n=Pe;Pe|=2;var s=ip(),l=lp();ut!==e||Ve!==t?(tl=null,el=nt()+500,Gs(e,t)):Hs=bt(e,t);e:do try{if(st!==0&&Fe!==null){t=Fe;var c=yn;t:switch(st){case 1:st=0,yn=null,Ys(e,t,c,1);break;case 2:case 9:if(bf(c)){st=0,yn=null,cp(t);break}t=function(){st!==2&&st!==9||ut!==e||(st=7),Un(e)},c.then(t,t);break e;case 3:st=7;break e;case 4:st=5;break e;case 7:bf(c)?(st=0,yn=null,cp(t)):(st=0,yn=null,Ys(e,t,c,7));break;case 5:var g=null;switch(Fe.tag){case 26:g=Fe.memoizedState;case 5:case 27:var x=Fe;if(g?Jp(g):x.stateNode.complete){st=0,yn=null;var M=x.sibling;if(M!==null)Fe=M;else{var Q=x.return;Q!==null?(Fe=Q,sl(Q)):Fe=null}break t}}st=0,yn=null,Ys(e,t,c,5);break;case 6:st=0,yn=null,Ys(e,t,c,6);break;case 8:Vc(),xt=6;break e;default:throw Error(r(462))}}yy();break}catch(oe){sp(e,oe)}while(!0);return Jn=Qa=null,E.H=s,E.A=l,Pe=n,Fe!==null?0:(ut=null,Ve=0,Ai(),xt)}function yy(){for(;Fe!==null&&!Oe();)rp(Fe)}function rp(e){var t=Oh(e.alternate,e,sa);e.memoizedProps=e.pendingProps,t===null?sl(e):Fe=t}function cp(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=kh(n,t,t.pendingProps,t.type,void 0,Ve);break;case 11:t=kh(n,t,t.pendingProps,t.type.render,t.ref,Ve);break;case 5:rc(t);default:jh(n,t),t=Fe=lf(t,sa),t=Oh(n,t,sa)}e.memoizedProps=e.pendingProps,t===null?sl(e):Fe=t}function Ys(e,t,n,s){Jn=Qa=null,rc(t),Os=null,po=0;var l=t.return;try{if(oy(e,l,t,n,Ve)){xt=1,Xi(e,An(n,e.current)),Fe=null;return}}catch(c){if(l!==null)throw Fe=l,c;xt=1,Xi(e,An(n,e.current)),Fe=null;return}t.flags&32768?(Je||s===1?e=!0:Hs||(Ve&536870912)!==0?e=!1:(Aa=e=!0,(s===2||s===9||s===3||s===6)&&(s=mn.current,s!==null&&s.tag===13&&(s.flags|=16384))),up(t,e)):sl(t)}function sl(e){var t=e;do{if((t.flags&32768)!==0){up(t,Aa);return}e=t.return;var n=ry(t.alternate,t,sa);if(n!==null){Fe=n;return}if(t=t.sibling,t!==null){Fe=t;return}Fe=t=e}while(t!==null);xt===0&&(xt=5)}function up(e,t){do{var n=cy(e.alternate,e);if(n!==null){n.flags&=32767,Fe=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){Fe=e;return}Fe=e=n}while(e!==null);xt=6,Fe=null}function dp(e,t,n,s,l,c,g,x,M){e.cancelPendingCommit=null;do ol();while(Ct!==0);if((Pe&6)!==0)throw Error(r(327));if(t!==null){if(t===e.current)throw Error(r(177));if(c=t.lanes|t.childLanes,c|=Br,di(e,n,c,g,x,M),e===ut&&(Fe=ut=null,Ve=0),Ls=t,ka=e,oa=n,Yc=c,Fc=l,ep=s,(t.subtreeFlags&10256)!==0||(t.flags&10256)!==0?(e.callbackNode=null,e.callbackPriority=0,wy(yt,function(){return gp(),null})):(e.callbackNode=null,e.callbackPriority=0),s=(t.flags&13878)!==0,(t.subtreeFlags&13878)!==0||s){s=E.T,E.T=null,l=z.p,z.p=2,g=Pe,Pe|=4;try{uy(e,t,n)}finally{Pe=g,z.p=l,E.T=s}}Ct=1,fp(),hp(),pp()}}function fp(){if(Ct===1){Ct=0;var e=ka,t=Ls,n=(t.flags&13878)!==0;if((t.subtreeFlags&13878)!==0||n){n=E.T,E.T=null;var s=z.p;z.p=2;var l=Pe;Pe|=4;try{Vh(t,e);var c=ou,g=Pd(e.containerInfo),x=c.focusedElem,M=c.selectionRange;if(g!==x&&x&&x.ownerDocument&&Kd(x.ownerDocument.documentElement,x)){if(M!==null&&Mr(x)){var Q=M.start,oe=M.end;if(oe===void 0&&(oe=Q),"selectionStart"in x)x.selectionStart=Q,x.selectionEnd=Math.min(oe,x.value.length);else{var de=x.ownerDocument||document,J=de&&de.defaultView||window;if(J.getSelection){var I=J.getSelection(),Te=x.textContent.length,Be=Math.min(M.start,Te),rt=M.end===void 0?Be:Math.min(M.end,Te);!I.extend&&Be>rt&&(g=rt,rt=Be,Be=g);var q=Zd(x,Be),B=Zd(x,rt);if(q&&B&&(I.rangeCount!==1||I.anchorNode!==q.node||I.anchorOffset!==q.offset||I.focusNode!==B.node||I.focusOffset!==B.offset)){var V=de.createRange();V.setStart(q.node,q.offset),I.removeAllRanges(),Be>rt?(I.addRange(V),I.extend(B.node,B.offset)):(V.setEnd(B.node,B.offset),I.addRange(V))}}}}for(de=[],I=x;I=I.parentNode;)I.nodeType===1&&de.push({element:I,left:I.scrollLeft,top:I.scrollTop});for(typeof x.focus=="function"&&x.focus(),x=0;x<de.length;x++){var le=de[x];le.element.scrollLeft=le.left,le.element.scrollTop=le.top}}yl=!!su,ou=su=null}finally{Pe=l,z.p=s,E.T=n}}e.current=t,Ct=2}}function hp(){if(Ct===2){Ct=0;var e=ka,t=Ls,n=(t.flags&8772)!==0;if((t.subtreeFlags&8772)!==0||n){n=E.T,E.T=null;var s=z.p;z.p=2;var l=Pe;Pe|=4;try{Lh(e,t.alternate,t)}finally{Pe=l,z.p=s,E.T=n}}Ct=3}}function pp(){if(Ct===4||Ct===3){Ct=0,Et();var e=ka,t=Ls,n=oa,s=ep;(t.subtreeFlags&10256)!==0||(t.flags&10256)!==0?Ct=5:(Ct=0,Ls=ka=null,mp(e,e.pendingLanes));var l=e.pendingLanes;if(l===0&&(_a=null),dr(n),t=t.stateNode,Vt&&typeof Vt.onCommitFiberRoot=="function")try{Vt.onCommitFiberRoot(Mn,t,void 0,(t.current.flags&128)===128)}catch{}if(s!==null){t=E.T,l=z.p,z.p=2,E.T=null;try{for(var c=e.onRecoverableError,g=0;g<s.length;g++){var x=s[g];c(x.value,{componentStack:x.stack})}}finally{E.T=t,z.p=l}}(oa&3)!==0&&ol(),Un(e),l=e.pendingLanes,(n&261930)!==0&&(l&42)!==0?e===Xc?$o++:($o=0,Xc=e):$o=0,Oo(0)}}function mp(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,fo(t)))}function ol(){return fp(),hp(),pp(),gp()}function gp(){if(Ct!==5)return!1;var e=ka,t=Yc;Yc=0;var n=dr(oa),s=E.T,l=z.p;try{z.p=32>n?32:n,E.T=null,n=Fc,Fc=null;var c=ka,g=oa;if(Ct=0,Ls=ka=null,oa=0,(Pe&6)!==0)throw Error(r(331));var x=Pe;if(Pe|=4,Ph(c.current),Jh(c,c.current,g,n),Pe=x,Oo(0,!1),Vt&&typeof Vt.onPostCommitFiberRoot=="function")try{Vt.onPostCommitFiberRoot(Mn,c)}catch{}return!0}finally{z.p=l,E.T=s,mp(e,t)}}function yp(e,t,n){t=An(n,t),t=Ac(e.stateNode,t,2),e=va(e,t,2),e!==null&&(ua(e,2),Un(e))}function ot(e,t,n){if(e.tag===3)yp(e,e,n);else for(;t!==null;){if(t.tag===3){yp(t,e,n);break}else if(t.tag===1){var s=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof s.componentDidCatch=="function"&&(_a===null||!_a.has(s))){e=An(n,e),n=bh(2),s=va(t,n,2),s!==null&&(vh(n,s,t,e),ua(s,2),Un(s));break}}t=t.return}}function Jc(e,t,n){var s=e.pingCache;if(s===null){s=e.pingCache=new hy;var l=new Set;s.set(t,l)}else l=s.get(t),l===void 0&&(l=new Set,s.set(t,l));l.has(n)||(Uc=!0,l.add(n),e=by.bind(null,e,t,n),t.then(e,e))}function by(e,t,n){var s=e.pingCache;s!==null&&s.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,ut===e&&(Ve&n)===n&&(xt===4||xt===3&&(Ve&62914560)===Ve&&300>nt()-Ii?(Pe&2)===0&&Gs(e,0):Lc|=n,Us===Ve&&(Us=0)),Un(e)}function bp(e,t){t===0&&(t=zn()),e=Fa(e,t),e!==null&&(ua(e,t),Un(e))}function vy(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),bp(e,n)}function xy(e,t){var n=0;switch(e.tag){case 31:case 13:var s=e.stateNode,l=e.memoizedState;l!==null&&(n=l.retryLane);break;case 19:s=e.stateNode;break;case 22:s=e.stateNode._retryCache;break;default:throw Error(r(314))}s!==null&&s.delete(t),bp(e,n)}function wy(e,t){return be(e,t)}var il=null,Fs=null,Zc=!1,ll=!1,Kc=!1,Ta=0;function Un(e){e!==Fs&&e.next===null&&(Fs===null?il=Fs=e:Fs=Fs.next=e),ll=!0,Zc||(Zc=!0,Ay())}function Oo(e,t){if(!Kc&&ll){Kc=!0;do for(var n=!1,s=il;s!==null;){if(e!==0){var l=s.pendingLanes;if(l===0)var c=0;else{var g=s.suspendedLanes,x=s.pingedLanes;c=(1<<31-Zt(42|e)+1)-1,c&=l&~(g&~x),c=c&201326741?c&201326741|1:c?c|2:0}c!==0&&(n=!0,Sp(s,c))}else c=Ve,c=at(s,s===ut?c:0,s.cancelPendingCommit!==null||s.timeoutHandle!==-1),(c&3)===0||bt(s,c)||(n=!0,Sp(s,c));s=s.next}while(n);Kc=!1}}function Sy(){vp()}function vp(){ll=Zc=!1;var e=0;Ta!==0&&Cy()&&(e=Ta);for(var t=nt(),n=null,s=il;s!==null;){var l=s.next,c=xp(s,t);c===0?(s.next=null,n===null?il=l:n.next=l,l===null&&(Fs=n)):(n=s,(e!==0||(c&3)!==0)&&(ll=!0)),s=l}Ct!==0&&Ct!==5||Oo(e),Ta!==0&&(Ta=0)}function xp(e,t){for(var n=e.suspendedLanes,s=e.pingedLanes,l=e.expirationTimes,c=e.pendingLanes&-62914561;0<c;){var g=31-Zt(c),x=1<<g,M=l[g];M===-1?((x&n)===0||(x&s)!==0)&&(l[g]=Bn(x,t)):M<=t&&(e.expiredLanes|=x),c&=~x}if(t=ut,n=Ve,n=at(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),s=e.callbackNode,n===0||e===t&&(st===2||st===9)||e.cancelPendingCommit!==null)return s!==null&&s!==null&&Ne(s),e.callbackNode=null,e.callbackPriority=0;if((n&3)===0||bt(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(s!==null&&Ne(s),dr(n)){case 2:case 8:n=Jt;break;case 32:n=yt;break;case 268435456:n=Wt;break;default:n=yt}return s=wp.bind(null,e),n=be(n,s),e.callbackPriority=t,e.callbackNode=n,t}return s!==null&&s!==null&&Ne(s),e.callbackPriority=2,e.callbackNode=null,2}function wp(e,t){if(Ct!==0&&Ct!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(ol()&&e.callbackNode!==n)return null;var s=Ve;return s=at(e,e===ut?s:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),s===0?null:(np(e,s,t),xp(e,nt()),e.callbackNode!=null&&e.callbackNode===n?wp.bind(null,e):null)}function Sp(e,t){if(ol())return null;np(e,t,!0)}function Ay(){By(function(){(Pe&6)!==0?be(Rt,Sy):vp()})}function Pc(){if(Ta===0){var e=Ns;e===0&&(e=ze,ze<<=1,(ze&261888)===0&&(ze=256)),Ta=e}return Ta}function Ap(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:mi(""+e)}function Ep(e,t){var n=t.ownerDocument.createElement("input");return n.name=t.name,n.value=t.value,e.id&&n.setAttribute("form",e.id),t.parentNode.insertBefore(n,t),e=new FormData(e),n.parentNode.removeChild(n),e}function Ey(e,t,n,s,l){if(t==="submit"&&n&&n.stateNode===l){var c=Ap((l[en]||null).action),g=s.submitter;g&&(t=(t=g[en]||null)?Ap(t.formAction):g.getAttribute("formAction"),t!==null&&(c=t,g=null));var x=new vi("action","action",null,s,l);e.push({event:x,listeners:[{instance:null,listener:function(){if(s.defaultPrevented){if(Ta!==0){var M=g?Ep(l,g):new FormData(l);yc(n,{pending:!0,data:M,method:l.method,action:c},null,M)}}else typeof c=="function"&&(x.preventDefault(),M=g?Ep(l,g):new FormData(l),yc(n,{pending:!0,data:M,method:l.method,action:c},c,M))},currentTarget:l}]})}}for(var Wc=0;Wc<jr.length;Wc++){var Ic=jr[Wc],_y=Ic.toLowerCase(),ky=Ic[0].toUpperCase()+Ic.slice(1);$n(_y,"on"+ky)}$n(ef,"onAnimationEnd"),$n(tf,"onAnimationIteration"),$n(nf,"onAnimationStart"),$n("dblclick","onDoubleClick"),$n("focusin","onFocus"),$n("focusout","onBlur"),$n(G0,"onTransitionRun"),$n(Y0,"onTransitionStart"),$n(F0,"onTransitionCancel"),$n(af,"onTransitionEnd"),ms("onMouseEnter",["mouseout","mouseover"]),ms("onMouseLeave",["mouseout","mouseover"]),ms("onPointerEnter",["pointerout","pointerover"]),ms("onPointerLeave",["pointerout","pointerover"]),Ua("onChange","change click focusin focusout input keydown keyup selectionchange".split(" ")),Ua("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),Ua("onBeforeInput",["compositionend","keypress","textInput","paste"]),Ua("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" ")),Ua("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" ")),Ua("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Co="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Dy=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Co));function _p(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var s=e[n],l=s.event;s=s.listeners;e:{var c=void 0;if(t)for(var g=s.length-1;0<=g;g--){var x=s[g],M=x.instance,Q=x.currentTarget;if(x=x.listener,M!==c&&l.isPropagationStopped())break e;c=x,l.currentTarget=Q;try{c(l)}catch(oe){Si(oe)}l.currentTarget=null,c=M}else for(g=0;g<s.length;g++){if(x=s[g],M=x.instance,Q=x.currentTarget,x=x.listener,M!==c&&l.isPropagationStopped())break e;c=x,l.currentTarget=Q;try{c(l)}catch(oe){Si(oe)}l.currentTarget=null,c=M}}}}function Xe(e,t){var n=t[fr];n===void 0&&(n=t[fr]=new Set);var s=e+"__bubble";n.has(s)||(kp(t,e,2,!1),n.add(s))}function eu(e,t,n){var s=0;t&&(s|=4),kp(n,e,s,t)}var rl="_reactListening"+Math.random().toString(36).slice(2);function tu(e){if(!e[rl]){e[rl]=!0,bd.forEach(function(n){n!=="selectionchange"&&(Dy.has(n)||eu(n,!1,e),eu(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[rl]||(t[rl]=!0,eu("selectionchange",!1,t))}}function kp(e,t,n,s){switch(tm(t)){case 2:var l=tb;break;case 8:l=nb;break;default:l=gu}n=l.bind(null,t,n,e),l=void 0,!wr||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(l=!0),s?l!==void 0?e.addEventListener(t,n,{capture:!0,passive:l}):e.addEventListener(t,n,!0):l!==void 0?e.addEventListener(t,n,{passive:l}):e.addEventListener(t,n,!1)}function nu(e,t,n,s,l){var c=s;if((t&1)===0&&(t&2)===0&&s!==null)e:for(;;){if(s===null)return;var g=s.tag;if(g===3||g===4){var x=s.stateNode.containerInfo;if(x===l)break;if(g===4)for(g=s.return;g!==null;){var M=g.tag;if((M===3||M===4)&&g.stateNode.containerInfo===l)return;g=g.return}for(;x!==null;){if(g=fs(x),g===null)return;if(M=g.tag,M===5||M===6||M===26||M===27){s=c=g;continue e}x=x.parentNode}}s=s.return}Md(function(){var Q=c,oe=vr(n),de=[];e:{var J=sf.get(e);if(J!==void 0){var I=vi,Te=e;switch(e){case"keypress":if(yi(n)===0)break e;case"keydown":case"keyup":I=x0;break;case"focusin":Te="focus",I=_r;break;case"focusout":Te="blur",I=_r;break;case"beforeblur":case"afterblur":I=_r;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":I=Cd;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":I=r0;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":I=A0;break;case ef:case tf:case nf:I=d0;break;case af:I=_0;break;case"scroll":case"scrollend":I=i0;break;case"wheel":I=D0;break;case"copy":case"cut":case"paste":I=h0;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":I=Bd;break;case"toggle":case"beforetoggle":I=N0}var Be=(t&4)!==0,rt=!Be&&(e==="scroll"||e==="scrollend"),q=Be?J!==null?J+"Capture":null:J;Be=[];for(var B=Q,V;B!==null;){var le=B;if(V=le.stateNode,le=le.tag,le!==5&&le!==26&&le!==27||V===null||q===null||(le=eo(B,q),le!=null&&Be.push(jo(B,le,V))),rt)break;B=B.return}0<Be.length&&(J=new I(J,Te,null,n,oe),de.push({event:J,listeners:Be}))}}if((t&7)===0){e:{if(J=e==="mouseover"||e==="pointerover",I=e==="mouseout"||e==="pointerout",J&&n!==br&&(Te=n.relatedTarget||n.fromElement)&&(fs(Te)||Te[ds]))break e;if((I||J)&&(J=oe.window===oe?oe:(J=oe.ownerDocument)?J.defaultView||J.parentWindow:window,I?(Te=n.relatedTarget||n.toElement,I=Q,Te=Te?fs(Te):null,Te!==null&&(rt=i(Te),Be=Te.tag,Te!==rt||Be!==5&&Be!==27&&Be!==6)&&(Te=null)):(I=null,Te=Q),I!==Te)){if(Be=Cd,le="onMouseLeave",q="onMouseEnter",B="mouse",(e==="pointerout"||e==="pointerover")&&(Be=Bd,le="onPointerLeave",q="onPointerEnter",B="pointer"),rt=I==null?J:Is(I),V=Te==null?J:Is(Te),J=new Be(le,B+"leave",I,n,oe),J.target=rt,J.relatedTarget=V,le=null,fs(oe)===Q&&(Be=new Be(q,B+"enter",Te,n,oe),Be.target=V,Be.relatedTarget=rt,le=Be),rt=le,I&&Te)t:{for(Be=Ty,q=I,B=Te,V=0,le=q;le;le=Be(le))V++;le=0;for(var Ce=B;Ce;Ce=Be(Ce))le++;for(;0<V-le;)q=Be(q),V--;for(;0<le-V;)B=Be(B),le--;for(;V--;){if(q===B||B!==null&&q===B.alternate){Be=q;break t}q=Be(q),B=Be(B)}Be=null}else Be=null;I!==null&&Dp(de,J,I,Be,!1),Te!==null&&rt!==null&&Dp(de,rt,Te,Be,!0)}}e:{if(J=Q?Is(Q):window,I=J.nodeName&&J.nodeName.toLowerCase(),I==="select"||I==="input"&&J.type==="file")var Ze=Yd;else if(Ld(J))if(Fd)Ze=H0;else{Ze=R0;var $e=z0}else I=J.nodeName,!I||I.toLowerCase()!=="input"||J.type!=="checkbox"&&J.type!=="radio"?Q&&yr(Q.elementType)&&(Ze=Yd):Ze=q0;if(Ze&&(Ze=Ze(e,Q))){Gd(de,Ze,n,oe);break e}$e&&$e(e,J,Q),e==="focusout"&&Q&&J.type==="number"&&Q.memoizedProps.value!=null&&gr(J,"number",J.value)}switch($e=Q?Is(Q):window,e){case"focusin":(Ld($e)||$e.contentEditable==="true")&&(ws=$e,$r=Q,ro=null);break;case"focusout":ro=$r=ws=null;break;case"mousedown":Or=!0;break;case"contextmenu":case"mouseup":case"dragend":Or=!1,Wd(de,n,oe);break;case"selectionchange":if(L0)break;case"keydown":case"keyup":Wd(de,n,oe)}var Le;if(Dr)e:{switch(e){case"compositionstart":var Qe="onCompositionStart";break e;case"compositionend":Qe="onCompositionEnd";break e;case"compositionupdate":Qe="onCompositionUpdate";break e}Qe=void 0}else xs?Hd(e,n)&&(Qe="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(Qe="onCompositionStart");Qe&&(zd&&n.locale!=="ko"&&(xs||Qe!=="onCompositionStart"?Qe==="onCompositionEnd"&&xs&&(Le=$d()):(fa=oe,Sr="value"in fa?fa.value:fa.textContent,xs=!0)),$e=cl(Q,Qe),0<$e.length&&(Qe=new jd(Qe,e,null,n,oe),de.push({event:Qe,listeners:$e}),Le?Qe.data=Le:(Le=Ud(n),Le!==null&&(Qe.data=Le)))),(Le=$0?O0(e,n):C0(e,n))&&(Qe=cl(Q,"onBeforeInput"),0<Qe.length&&($e=new jd("onBeforeInput","beforeinput",null,n,oe),de.push({event:$e,listeners:Qe}),$e.data=Le)),Ey(de,e,Q,n,oe)}_p(de,t)})}function jo(e,t,n){return{instance:e,listener:t,currentTarget:n}}function cl(e,t){for(var n=t+"Capture",s=[];e!==null;){var l=e,c=l.stateNode;if(l=l.tag,l!==5&&l!==26&&l!==27||c===null||(l=eo(e,n),l!=null&&s.unshift(jo(e,l,c)),l=eo(e,t),l!=null&&s.push(jo(e,l,c))),e.tag===3)return s;e=e.return}return[]}function Ty(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function Dp(e,t,n,s,l){for(var c=t._reactName,g=[];n!==null&&n!==s;){var x=n,M=x.alternate,Q=x.stateNode;if(x=x.tag,M!==null&&M===s)break;x!==5&&x!==26&&x!==27||Q===null||(M=Q,l?(Q=eo(n,c),Q!=null&&g.unshift(jo(n,Q,M))):l||(Q=eo(n,c),Q!=null&&g.push(jo(n,Q,M)))),n=n.return}g.length!==0&&e.push({event:t,listeners:g})}var Ny=/\r\n?/g,My=/\u0000|\uFFFD/g;function Tp(e){return(typeof e=="string"?e:""+e).replace(Ny,`
`).replace(My,"")}function Np(e,t){return t=Tp(t),Tp(e)===t}function lt(e,t,n,s,l,c){switch(n){case"children":typeof s=="string"?t==="body"||t==="textarea"&&s===""||ys(e,s):(typeof s=="number"||typeof s=="bigint")&&t!=="body"&&ys(e,""+s);break;case"className":hi(e,"class",s);break;case"tabIndex":hi(e,"tabindex",s);break;case"dir":case"role":case"viewBox":case"width":case"height":hi(e,n,s);break;case"style":Td(e,s,c);break;case"data":if(t!=="object"){hi(e,"data",s);break}case"src":case"href":if(s===""&&(t!=="a"||n!=="href")){e.removeAttribute(n);break}if(s==null||typeof s=="function"||typeof s=="symbol"||typeof s=="boolean"){e.removeAttribute(n);break}s=mi(""+s),e.setAttribute(n,s);break;case"action":case"formAction":if(typeof s=="function"){e.setAttribute(n,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof c=="function"&&(n==="formAction"?(t!=="input"&&lt(e,t,"name",l.name,l,null),lt(e,t,"formEncType",l.formEncType,l,null),lt(e,t,"formMethod",l.formMethod,l,null),lt(e,t,"formTarget",l.formTarget,l,null)):(lt(e,t,"encType",l.encType,l,null),lt(e,t,"method",l.method,l,null),lt(e,t,"target",l.target,l,null)));if(s==null||typeof s=="symbol"||typeof s=="boolean"){e.removeAttribute(n);break}s=mi(""+s),e.setAttribute(n,s);break;case"onClick":s!=null&&(e.onclick=Fn);break;case"onScroll":s!=null&&Xe("scroll",e);break;case"onScrollEnd":s!=null&&Xe("scrollend",e);break;case"dangerouslySetInnerHTML":if(s!=null){if(typeof s!="object"||!("__html"in s))throw Error(r(61));if(n=s.__html,n!=null){if(l.children!=null)throw Error(r(60));e.innerHTML=n}}break;case"multiple":e.multiple=s&&typeof s!="function"&&typeof s!="symbol";break;case"muted":e.muted=s&&typeof s!="function"&&typeof s!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(s==null||typeof s=="function"||typeof s=="boolean"||typeof s=="symbol"){e.removeAttribute("xlink:href");break}n=mi(""+s),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",n);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":s!=null&&typeof s!="function"&&typeof s!="symbol"?e.setAttribute(n,""+s):e.removeAttribute(n);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":s&&typeof s!="function"&&typeof s!="symbol"?e.setAttribute(n,""):e.removeAttribute(n);break;case"capture":case"download":s===!0?e.setAttribute(n,""):s!==!1&&s!=null&&typeof s!="function"&&typeof s!="symbol"?e.setAttribute(n,s):e.removeAttribute(n);break;case"cols":case"rows":case"size":case"span":s!=null&&typeof s!="function"&&typeof s!="symbol"&&!isNaN(s)&&1<=s?e.setAttribute(n,s):e.removeAttribute(n);break;case"rowSpan":case"start":s==null||typeof s=="function"||typeof s=="symbol"||isNaN(s)?e.removeAttribute(n):e.setAttribute(n,s);break;case"popover":Xe("beforetoggle",e),Xe("toggle",e),fi(e,"popover",s);break;case"xlinkActuate":Yn(e,"http://www.w3.org/1999/xlink","xlink:actuate",s);break;case"xlinkArcrole":Yn(e,"http://www.w3.org/1999/xlink","xlink:arcrole",s);break;case"xlinkRole":Yn(e,"http://www.w3.org/1999/xlink","xlink:role",s);break;case"xlinkShow":Yn(e,"http://www.w3.org/1999/xlink","xlink:show",s);break;case"xlinkTitle":Yn(e,"http://www.w3.org/1999/xlink","xlink:title",s);break;case"xlinkType":Yn(e,"http://www.w3.org/1999/xlink","xlink:type",s);break;case"xmlBase":Yn(e,"http://www.w3.org/XML/1998/namespace","xml:base",s);break;case"xmlLang":Yn(e,"http://www.w3.org/XML/1998/namespace","xml:lang",s);break;case"xmlSpace":Yn(e,"http://www.w3.org/XML/1998/namespace","xml:space",s);break;case"is":fi(e,"is",s);break;case"innerText":case"textContent":break;default:(!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")&&(n=s0.get(n)||n,fi(e,n,s))}}function au(e,t,n,s,l,c){switch(n){case"style":Td(e,s,c);break;case"dangerouslySetInnerHTML":if(s!=null){if(typeof s!="object"||!("__html"in s))throw Error(r(61));if(n=s.__html,n!=null){if(l.children!=null)throw Error(r(60));e.innerHTML=n}}break;case"children":typeof s=="string"?ys(e,s):(typeof s=="number"||typeof s=="bigint")&&ys(e,""+s);break;case"onScroll":s!=null&&Xe("scroll",e);break;case"onScrollEnd":s!=null&&Xe("scrollend",e);break;case"onClick":s!=null&&(e.onclick=Fn);break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":break;case"innerText":case"textContent":break;default:if(!vd.hasOwnProperty(n))e:{if(n[0]==="o"&&n[1]==="n"&&(l=n.endsWith("Capture"),t=n.slice(2,l?n.length-7:void 0),c=e[en]||null,c=c!=null?c[n]:null,typeof c=="function"&&e.removeEventListener(t,c,l),typeof s=="function")){typeof c!="function"&&c!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(t,s,l);break e}n in e?e[n]=s:s===!0?e.setAttribute(n,""):fi(e,n,s)}}}function Yt(e,t,n){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":Xe("error",e),Xe("load",e);var s=!1,l=!1,c;for(c in n)if(n.hasOwnProperty(c)){var g=n[c];if(g!=null)switch(c){case"src":s=!0;break;case"srcSet":l=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(r(137,t));default:lt(e,t,c,g,n,null)}}l&&lt(e,t,"srcSet",n.srcSet,n,null),s&&lt(e,t,"src",n.src,n,null);return;case"input":Xe("invalid",e);var x=c=g=l=null,M=null,Q=null;for(s in n)if(n.hasOwnProperty(s)){var oe=n[s];if(oe!=null)switch(s){case"name":l=oe;break;case"type":g=oe;break;case"checked":M=oe;break;case"defaultChecked":Q=oe;break;case"value":c=oe;break;case"defaultValue":x=oe;break;case"children":case"dangerouslySetInnerHTML":if(oe!=null)throw Error(r(137,t));break;default:lt(e,t,s,oe,n,null)}}Ed(e,c,x,M,Q,g,l,!1);return;case"select":Xe("invalid",e),s=g=c=null;for(l in n)if(n.hasOwnProperty(l)&&(x=n[l],x!=null))switch(l){case"value":c=x;break;case"defaultValue":g=x;break;case"multiple":s=x;default:lt(e,t,l,x,n,null)}t=c,n=g,e.multiple=!!s,t!=null?gs(e,!!s,t,!1):n!=null&&gs(e,!!s,n,!0);return;case"textarea":Xe("invalid",e),c=l=s=null;for(g in n)if(n.hasOwnProperty(g)&&(x=n[g],x!=null))switch(g){case"value":s=x;break;case"defaultValue":l=x;break;case"children":c=x;break;case"dangerouslySetInnerHTML":if(x!=null)throw Error(r(91));break;default:lt(e,t,g,x,n,null)}kd(e,s,l,c);return;case"option":for(M in n)n.hasOwnProperty(M)&&(s=n[M],s!=null)&&(M==="selected"?e.selected=s&&typeof s!="function"&&typeof s!="symbol":lt(e,t,M,s,n,null));return;case"dialog":Xe("beforetoggle",e),Xe("toggle",e),Xe("cancel",e),Xe("close",e);break;case"iframe":case"object":Xe("load",e);break;case"video":case"audio":for(s=0;s<Co.length;s++)Xe(Co[s],e);break;case"image":Xe("error",e),Xe("load",e);break;case"details":Xe("toggle",e);break;case"embed":case"source":case"link":Xe("error",e),Xe("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(Q in n)if(n.hasOwnProperty(Q)&&(s=n[Q],s!=null))switch(Q){case"children":case"dangerouslySetInnerHTML":throw Error(r(137,t));default:lt(e,t,Q,s,n,null)}return;default:if(yr(t)){for(oe in n)n.hasOwnProperty(oe)&&(s=n[oe],s!==void 0&&au(e,t,oe,s,n,void 0));return}}for(x in n)n.hasOwnProperty(x)&&(s=n[x],s!=null&&lt(e,t,x,s,n,null))}function $y(e,t,n,s){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var l=null,c=null,g=null,x=null,M=null,Q=null,oe=null;for(I in n){var de=n[I];if(n.hasOwnProperty(I)&&de!=null)switch(I){case"checked":break;case"value":break;case"defaultValue":M=de;default:s.hasOwnProperty(I)||lt(e,t,I,null,s,de)}}for(var J in s){var I=s[J];if(de=n[J],s.hasOwnProperty(J)&&(I!=null||de!=null))switch(J){case"type":c=I;break;case"name":l=I;break;case"checked":Q=I;break;case"defaultChecked":oe=I;break;case"value":g=I;break;case"defaultValue":x=I;break;case"children":case"dangerouslySetInnerHTML":if(I!=null)throw Error(r(137,t));break;default:I!==de&&lt(e,t,J,I,s,de)}}mr(e,g,x,M,Q,oe,c,l);return;case"select":I=g=x=J=null;for(c in n)if(M=n[c],n.hasOwnProperty(c)&&M!=null)switch(c){case"value":break;case"multiple":I=M;default:s.hasOwnProperty(c)||lt(e,t,c,null,s,M)}for(l in s)if(c=s[l],M=n[l],s.hasOwnProperty(l)&&(c!=null||M!=null))switch(l){case"value":J=c;break;case"defaultValue":x=c;break;case"multiple":g=c;default:c!==M&&lt(e,t,l,c,s,M)}t=x,n=g,s=I,J!=null?gs(e,!!n,J,!1):!!s!=!!n&&(t!=null?gs(e,!!n,t,!0):gs(e,!!n,n?[]:"",!1));return;case"textarea":I=J=null;for(x in n)if(l=n[x],n.hasOwnProperty(x)&&l!=null&&!s.hasOwnProperty(x))switch(x){case"value":break;case"children":break;default:lt(e,t,x,null,s,l)}for(g in s)if(l=s[g],c=n[g],s.hasOwnProperty(g)&&(l!=null||c!=null))switch(g){case"value":J=l;break;case"defaultValue":I=l;break;case"children":break;case"dangerouslySetInnerHTML":if(l!=null)throw Error(r(91));break;default:l!==c&&lt(e,t,g,l,s,c)}_d(e,J,I);return;case"option":for(var Te in n)J=n[Te],n.hasOwnProperty(Te)&&J!=null&&!s.hasOwnProperty(Te)&&(Te==="selected"?e.selected=!1:lt(e,t,Te,null,s,J));for(M in s)J=s[M],I=n[M],s.hasOwnProperty(M)&&J!==I&&(J!=null||I!=null)&&(M==="selected"?e.selected=J&&typeof J!="function"&&typeof J!="symbol":lt(e,t,M,J,s,I));return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var Be in n)J=n[Be],n.hasOwnProperty(Be)&&J!=null&&!s.hasOwnProperty(Be)&&lt(e,t,Be,null,s,J);for(Q in s)if(J=s[Q],I=n[Q],s.hasOwnProperty(Q)&&J!==I&&(J!=null||I!=null))switch(Q){case"children":case"dangerouslySetInnerHTML":if(J!=null)throw Error(r(137,t));break;default:lt(e,t,Q,J,s,I)}return;default:if(yr(t)){for(var rt in n)J=n[rt],n.hasOwnProperty(rt)&&J!==void 0&&!s.hasOwnProperty(rt)&&au(e,t,rt,void 0,s,J);for(oe in s)J=s[oe],I=n[oe],!s.hasOwnProperty(oe)||J===I||J===void 0&&I===void 0||au(e,t,oe,J,s,I);return}}for(var q in n)J=n[q],n.hasOwnProperty(q)&&J!=null&&!s.hasOwnProperty(q)&&lt(e,t,q,null,s,J);for(de in s)J=s[de],I=n[de],!s.hasOwnProperty(de)||J===I||J==null&&I==null||lt(e,t,de,J,s,I)}function Mp(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function Oy(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,n=performance.getEntriesByType("resource"),s=0;s<n.length;s++){var l=n[s],c=l.transferSize,g=l.initiatorType,x=l.duration;if(c&&x&&Mp(g)){for(g=0,x=l.responseEnd,s+=1;s<n.length;s++){var M=n[s],Q=M.startTime;if(Q>x)break;var oe=M.transferSize,de=M.initiatorType;oe&&Mp(de)&&(M=M.responseEnd,g+=oe*(M<x?1:(x-Q)/(M-Q)))}if(--s,t+=8*(c+g)/(l.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var su=null,ou=null;function ul(e){return e.nodeType===9?e:e.ownerDocument}function $p(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function Op(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function iu(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var lu=null;function Cy(){var e=window.event;return e&&e.type==="popstate"?e===lu?!1:(lu=e,!0):(lu=null,!1)}var Cp=typeof setTimeout=="function"?setTimeout:void 0,jy=typeof clearTimeout=="function"?clearTimeout:void 0,jp=typeof Promise=="function"?Promise:void 0,By=typeof queueMicrotask=="function"?queueMicrotask:typeof jp<"u"?function(e){return jp.resolve(null).then(e).catch(zy)}:Cp;function zy(e){setTimeout(function(){throw e})}function Na(e){return e==="head"}function Bp(e,t){var n=t,s=0;do{var l=n.nextSibling;if(e.removeChild(n),l&&l.nodeType===8)if(n=l.data,n==="/$"||n==="/&"){if(s===0){e.removeChild(l),Js(t);return}s--}else if(n==="$"||n==="$?"||n==="$~"||n==="$!"||n==="&")s++;else if(n==="html")Bo(e.ownerDocument.documentElement);else if(n==="head"){n=e.ownerDocument.head,Bo(n);for(var c=n.firstChild;c;){var g=c.nextSibling,x=c.nodeName;c[Ws]||x==="SCRIPT"||x==="STYLE"||x==="LINK"&&c.rel.toLowerCase()==="stylesheet"||n.removeChild(c),c=g}}else n==="body"&&Bo(e.ownerDocument.body);n=l}while(n);Js(t)}function zp(e,t){var n=e;e=0;do{var s=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display="none"):(n.style.display=n._stashedDisplay||"",n.getAttribute("style")===""&&n.removeAttribute("style")):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=""):n.nodeValue=n._stashedText||""),s&&s.nodeType===8)if(n=s.data,n==="/$"){if(e===0)break;e--}else n!=="$"&&n!=="$?"&&n!=="$~"&&n!=="$!"||e++;n=s}while(n)}function ru(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case"HTML":case"HEAD":case"BODY":ru(n),hr(n);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(n.rel.toLowerCase()==="stylesheet")continue}e.removeChild(n)}}function Ry(e,t,n,s){for(;e.nodeType===1;){var l=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!s&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(s){if(!e[Ws])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(c=e.getAttribute("rel"),c==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(c!==l.rel||e.getAttribute("href")!==(l.href==null||l.href===""?null:l.href)||e.getAttribute("crossorigin")!==(l.crossOrigin==null?null:l.crossOrigin)||e.getAttribute("title")!==(l.title==null?null:l.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(c=e.getAttribute("src"),(c!==(l.src==null?null:l.src)||e.getAttribute("type")!==(l.type==null?null:l.type)||e.getAttribute("crossorigin")!==(l.crossOrigin==null?null:l.crossOrigin))&&c&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var c=l.name==null?null:""+l.name;if(l.type==="hidden"&&e.getAttribute("name")===c)return e}else return e;if(e=Tn(e.nextSibling),e===null)break}return null}function qy(e,t,n){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!n||(e=Tn(e.nextSibling),e===null))return null;return e}function Rp(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=Tn(e.nextSibling),e===null))return null;return e}function cu(e){return e.data==="$?"||e.data==="$~"}function uu(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function Hy(e,t){var n=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||n.readyState!=="loading")t();else{var s=function(){t(),n.removeEventListener("DOMContentLoaded",s)};n.addEventListener("DOMContentLoaded",s),e._reactRetry=s}}function Tn(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var du=null;function qp(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"||n==="/&"){if(t===0)return Tn(e.nextSibling);t--}else n!=="$"&&n!=="$!"&&n!=="$?"&&n!=="$~"&&n!=="&"||t++}e=e.nextSibling}return null}function Hp(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"){if(t===0)return e;t--}else n!=="/$"&&n!=="/&"||t++}e=e.previousSibling}return null}function Up(e,t,n){switch(t=ul(n),e){case"html":if(e=t.documentElement,!e)throw Error(r(452));return e;case"head":if(e=t.head,!e)throw Error(r(453));return e;case"body":if(e=t.body,!e)throw Error(r(454));return e;default:throw Error(r(451))}}function Bo(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);hr(e)}var Nn=new Map,Lp=new Set;function dl(e){return typeof e.getRootNode=="function"?e.getRootNode():e.nodeType===9?e:e.ownerDocument}var ia=z.d;z.d={f:Uy,r:Ly,D:Gy,C:Yy,L:Fy,m:Xy,X:Qy,S:Vy,M:Jy};function Uy(){var e=ia.f(),t=nl();return e||t}function Ly(e){var t=hs(e);t!==null&&t.tag===5&&t.type==="form"?sh(t):ia.r(e)}var Xs=typeof document>"u"?null:document;function Gp(e,t,n){var s=Xs;if(s&&typeof t=="string"&&t){var l=wn(t);l='link[rel="'+e+'"][href="'+l+'"]',typeof n=="string"&&(l+='[crossorigin="'+n+'"]'),Lp.has(l)||(Lp.add(l),e={rel:e,crossOrigin:n,href:t},s.querySelector(l)===null&&(t=s.createElement("link"),Yt(t,"link",e),Bt(t),s.head.appendChild(t)))}}function Gy(e){ia.D(e),Gp("dns-prefetch",e,null)}function Yy(e,t){ia.C(e,t),Gp("preconnect",e,t)}function Fy(e,t,n){ia.L(e,t,n);var s=Xs;if(s&&e&&t){var l='link[rel="preload"][as="'+wn(t)+'"]';t==="image"&&n&&n.imageSrcSet?(l+='[imagesrcset="'+wn(n.imageSrcSet)+'"]',typeof n.imageSizes=="string"&&(l+='[imagesizes="'+wn(n.imageSizes)+'"]')):l+='[href="'+wn(e)+'"]';var c=l;switch(t){case"style":c=Vs(e);break;case"script":c=Qs(e)}Nn.has(c)||(e=w({rel:"preload",href:t==="image"&&n&&n.imageSrcSet?void 0:e,as:t},n),Nn.set(c,e),s.querySelector(l)!==null||t==="style"&&s.querySelector(zo(c))||t==="script"&&s.querySelector(Ro(c))||(t=s.createElement("link"),Yt(t,"link",e),Bt(t),s.head.appendChild(t)))}}function Xy(e,t){ia.m(e,t);var n=Xs;if(n&&e){var s=t&&typeof t.as=="string"?t.as:"script",l='link[rel="modulepreload"][as="'+wn(s)+'"][href="'+wn(e)+'"]',c=l;switch(s){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":c=Qs(e)}if(!Nn.has(c)&&(e=w({rel:"modulepreload",href:e},t),Nn.set(c,e),n.querySelector(l)===null)){switch(s){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(n.querySelector(Ro(c)))return}s=n.createElement("link"),Yt(s,"link",e),Bt(s),n.head.appendChild(s)}}}function Vy(e,t,n){ia.S(e,t,n);var s=Xs;if(s&&e){var l=ps(s).hoistableStyles,c=Vs(e);t=t||"default";var g=l.get(c);if(!g){var x={loading:0,preload:null};if(g=s.querySelector(zo(c)))x.loading=5;else{e=w({rel:"stylesheet",href:e,"data-precedence":t},n),(n=Nn.get(c))&&fu(e,n);var M=g=s.createElement("link");Bt(M),Yt(M,"link",e),M._p=new Promise(function(Q,oe){M.onload=Q,M.onerror=oe}),M.addEventListener("load",function(){x.loading|=1}),M.addEventListener("error",function(){x.loading|=2}),x.loading|=4,fl(g,t,s)}g={type:"stylesheet",instance:g,count:1,state:x},l.set(c,g)}}}function Qy(e,t){ia.X(e,t);var n=Xs;if(n&&e){var s=ps(n).hoistableScripts,l=Qs(e),c=s.get(l);c||(c=n.querySelector(Ro(l)),c||(e=w({src:e,async:!0},t),(t=Nn.get(l))&&hu(e,t),c=n.createElement("script"),Bt(c),Yt(c,"link",e),n.head.appendChild(c)),c={type:"script",instance:c,count:1,state:null},s.set(l,c))}}function Jy(e,t){ia.M(e,t);var n=Xs;if(n&&e){var s=ps(n).hoistableScripts,l=Qs(e),c=s.get(l);c||(c=n.querySelector(Ro(l)),c||(e=w({src:e,async:!0,type:"module"},t),(t=Nn.get(l))&&hu(e,t),c=n.createElement("script"),Bt(c),Yt(c,"link",e),n.head.appendChild(c)),c={type:"script",instance:c,count:1,state:null},s.set(l,c))}}function Yp(e,t,n,s){var l=(l=_e.current)?dl(l):null;if(!l)throw Error(r(446));switch(e){case"meta":case"title":return null;case"style":return typeof n.precedence=="string"&&typeof n.href=="string"?(t=Vs(n.href),n=ps(l).hoistableStyles,s=n.get(t),s||(s={type:"style",instance:null,count:0,state:null},n.set(t,s)),s):{type:"void",instance:null,count:0,state:null};case"link":if(n.rel==="stylesheet"&&typeof n.href=="string"&&typeof n.precedence=="string"){e=Vs(n.href);var c=ps(l).hoistableStyles,g=c.get(e);if(g||(l=l.ownerDocument||l,g={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},c.set(e,g),(c=l.querySelector(zo(e)))&&!c._p&&(g.instance=c,g.state.loading=5),Nn.has(e)||(n={rel:"preload",as:"style",href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},Nn.set(e,n),c||Zy(l,e,n,g.state))),t&&s===null)throw Error(r(528,""));return g}if(t&&s!==null)throw Error(r(529,""));return null;case"script":return t=n.async,n=n.src,typeof n=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(t=Qs(n),n=ps(l).hoistableScripts,s=n.get(t),s||(s={type:"script",instance:null,count:0,state:null},n.set(t,s)),s):{type:"void",instance:null,count:0,state:null};default:throw Error(r(444,e))}}function Vs(e){return'href="'+wn(e)+'"'}function zo(e){return'link[rel="stylesheet"]['+e+"]"}function Fp(e){return w({},e,{"data-precedence":e.precedence,precedence:null})}function Zy(e,t,n,s){e.querySelector('link[rel="preload"][as="style"]['+t+"]")?s.loading=1:(t=e.createElement("link"),s.preload=t,t.addEventListener("load",function(){return s.loading|=1}),t.addEventListener("error",function(){return s.loading|=2}),Yt(t,"link",n),Bt(t),e.head.appendChild(t))}function Qs(e){return'[src="'+wn(e)+'"]'}function Ro(e){return"script[async]"+e}function Xp(e,t,n){if(t.count++,t.instance===null)switch(t.type){case"style":var s=e.querySelector('style[data-href~="'+wn(n.href)+'"]');if(s)return t.instance=s,Bt(s),s;var l=w({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return s=(e.ownerDocument||e).createElement("style"),Bt(s),Yt(s,"style",l),fl(s,n.precedence,e),t.instance=s;case"stylesheet":l=Vs(n.href);var c=e.querySelector(zo(l));if(c)return t.state.loading|=4,t.instance=c,Bt(c),c;s=Fp(n),(l=Nn.get(l))&&fu(s,l),c=(e.ownerDocument||e).createElement("link"),Bt(c);var g=c;return g._p=new Promise(function(x,M){g.onload=x,g.onerror=M}),Yt(c,"link",s),t.state.loading|=4,fl(c,n.precedence,e),t.instance=c;case"script":return c=Qs(n.src),(l=e.querySelector(Ro(c)))?(t.instance=l,Bt(l),l):(s=n,(l=Nn.get(c))&&(s=w({},n),hu(s,l)),e=e.ownerDocument||e,l=e.createElement("script"),Bt(l),Yt(l,"link",s),e.head.appendChild(l),t.instance=l);case"void":return null;default:throw Error(r(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(s=t.instance,t.state.loading|=4,fl(s,n.precedence,e));return t.instance}function fl(e,t,n){for(var s=n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),l=s.length?s[s.length-1]:null,c=l,g=0;g<s.length;g++){var x=s[g];if(x.dataset.precedence===t)c=x;else if(c!==l)break}c?c.parentNode.insertBefore(e,c.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function fu(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function hu(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var hl=null;function Vp(e,t,n){if(hl===null){var s=new Map,l=hl=new Map;l.set(n,s)}else l=hl,s=l.get(n),s||(s=new Map,l.set(n,s));if(s.has(e))return s;for(s.set(e,null),n=n.getElementsByTagName(e),l=0;l<n.length;l++){var c=n[l];if(!(c[Ws]||c[Ht]||e==="link"&&c.getAttribute("rel")==="stylesheet")&&c.namespaceURI!=="http://www.w3.org/2000/svg"){var g=c.getAttribute(t)||"";g=e+g;var x=s.get(g);x?x.push(c):s.set(g,[c])}}return s}function Qp(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t==="title"?e.querySelector("head > title"):null)}function Ky(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;return t.rel==="stylesheet"?(e=t.disabled,typeof t.precedence=="string"&&e==null):!0;case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function Jp(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}function Py(e,t,n,s){if(n.type==="stylesheet"&&(typeof s.media!="string"||matchMedia(s.media).matches!==!1)&&(n.state.loading&4)===0){if(n.instance===null){var l=Vs(s.href),c=t.querySelector(zo(l));if(c){t=c._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=pl.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=c,Bt(c);return}c=t.ownerDocument||t,s=Fp(s),(l=Nn.get(l))&&fu(s,l),c=c.createElement("link"),Bt(c);var g=c;g._p=new Promise(function(x,M){g.onload=x,g.onerror=M}),Yt(c,"link",s),n.instance=c}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&(n.state.loading&3)===0&&(e.count++,n=pl.bind(e),t.addEventListener("load",n),t.addEventListener("error",n))}}var pu=0;function Wy(e,t){return e.stylesheets&&e.count===0&&gl(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var s=setTimeout(function(){if(e.stylesheets&&gl(e,e.stylesheets),e.unsuspend){var c=e.unsuspend;e.unsuspend=null,c()}},6e4+t);0<e.imgBytes&&pu===0&&(pu=62500*Oy());var l=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&gl(e,e.stylesheets),e.unsuspend)){var c=e.unsuspend;e.unsuspend=null,c()}},(e.imgBytes>pu?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(s),clearTimeout(l)}}:null}function pl(){if(this.count--,this.count===0&&(this.imgCount===0||!this.waitingForImages)){if(this.stylesheets)gl(this,this.stylesheets);else if(this.unsuspend){var e=this.unsuspend;this.unsuspend=null,e()}}}var ml=null;function gl(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,ml=new Map,t.forEach(Iy,e),ml=null,pl.call(e))}function Iy(e,t){if(!(t.state.loading&4)){var n=ml.get(e);if(n)var s=n.get(null);else{n=new Map,ml.set(e,n);for(var l=e.querySelectorAll("link[data-precedence],style[data-precedence]"),c=0;c<l.length;c++){var g=l[c];(g.nodeName==="LINK"||g.getAttribute("media")!=="not all")&&(n.set(g.dataset.precedence,g),s=g)}s&&n.set(null,s)}l=t.instance,g=l.getAttribute("data-precedence"),c=n.get(g)||s,c===s&&n.set(null,l),n.set(g,l),this.count++,s=pl.bind(this),l.addEventListener("load",s),l.addEventListener("error",s),c?c.parentNode.insertBefore(l,c.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(l,e.firstChild)),t.state.loading|=4}}var qo={$$typeof:C,Provider:null,Consumer:null,_currentValue:K,_currentValue2:K,_threadCount:0};function eb(e,t,n,s,l,c,g,x,M){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=fn(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=fn(0),this.hiddenUpdates=fn(null),this.identifierPrefix=s,this.onUncaughtError=l,this.onCaughtError=c,this.onRecoverableError=g,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=M,this.incompleteTransitions=new Map}function Zp(e,t,n,s,l,c,g,x,M,Q,oe,de){return e=new eb(e,t,n,g,M,Q,oe,de,x),t=1,c===!0&&(t|=24),c=pn(3,null,null,t),e.current=c,c.stateNode=e,t=Qr(),t.refCount++,e.pooledCache=t,t.refCount++,c.memoizedState={element:s,isDehydrated:n,cache:t},Pr(c),e}function Kp(e){return e?(e=Es,e):Es}function Pp(e,t,n,s,l,c){l=Kp(l),s.context===null?s.context=l:s.pendingContext=l,s=ba(t),s.payload={element:n},c=c===void 0?null:c,c!==null&&(s.callback=c),n=va(e,s,t),n!==null&&(ln(n,e,t),go(n,e,t))}function Wp(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function mu(e,t){Wp(e,t),(e=e.alternate)&&Wp(e,t)}function Ip(e){if(e.tag===13||e.tag===31){var t=Fa(e,67108864);t!==null&&ln(t,e,67108864),mu(e,67108864)}}function em(e){if(e.tag===13||e.tag===31){var t=vn();t=ur(t);var n=Fa(e,t);n!==null&&ln(n,e,t),mu(e,t)}}var yl=!0;function tb(e,t,n,s){var l=E.T;E.T=null;var c=z.p;try{z.p=2,gu(e,t,n,s)}finally{z.p=c,E.T=l}}function nb(e,t,n,s){var l=E.T;E.T=null;var c=z.p;try{z.p=8,gu(e,t,n,s)}finally{z.p=c,E.T=l}}function gu(e,t,n,s){if(yl){var l=yu(s);if(l===null)nu(e,t,s,bl,n),nm(e,s);else if(sb(l,e,t,n,s))s.stopPropagation();else if(nm(e,s),t&4&&-1<ab.indexOf(e)){for(;l!==null;){var c=hs(l);if(c!==null)switch(c.tag){case 3:if(c=c.stateNode,c.current.memoizedState.isDehydrated){var g=_t(c.pendingLanes);if(g!==0){var x=c;for(x.pendingLanes|=2,x.entangledLanes|=2;g;){var M=1<<31-Zt(g);x.entanglements[1]|=M,g&=~M}Un(c),(Pe&6)===0&&(el=nt()+500,Oo(0))}}break;case 31:case 13:x=Fa(c,2),x!==null&&ln(x,c,2),nl(),mu(c,2)}if(c=yu(s),c===null&&nu(e,t,s,bl,n),c===l)break;l=c}l!==null&&s.stopPropagation()}else nu(e,t,s,null,n)}}function yu(e){return e=vr(e),bu(e)}var bl=null;function bu(e){if(bl=null,e=fs(e),e!==null){var t=i(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=d(t),e!==null)return e;e=null}else if(n===31){if(e=h(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return bl=e,null}function tm(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(pt()){case Rt:return 2;case Jt:return 8;case yt:case qt:return 32;case Wt:return 268435456;default:return 32}default:return 32}}var vu=!1,Ma=null,$a=null,Oa=null,Ho=new Map,Uo=new Map,Ca=[],ab="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function nm(e,t){switch(e){case"focusin":case"focusout":Ma=null;break;case"dragenter":case"dragleave":$a=null;break;case"mouseover":case"mouseout":Oa=null;break;case"pointerover":case"pointerout":Ho.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Uo.delete(t.pointerId)}}function Lo(e,t,n,s,l,c){return e===null||e.nativeEvent!==c?(e={blockedOn:t,domEventName:n,eventSystemFlags:s,nativeEvent:c,targetContainers:[l]},t!==null&&(t=hs(t),t!==null&&Ip(t)),e):(e.eventSystemFlags|=s,t=e.targetContainers,l!==null&&t.indexOf(l)===-1&&t.push(l),e)}function sb(e,t,n,s,l){switch(t){case"focusin":return Ma=Lo(Ma,e,t,n,s,l),!0;case"dragenter":return $a=Lo($a,e,t,n,s,l),!0;case"mouseover":return Oa=Lo(Oa,e,t,n,s,l),!0;case"pointerover":var c=l.pointerId;return Ho.set(c,Lo(Ho.get(c)||null,e,t,n,s,l)),!0;case"gotpointercapture":return c=l.pointerId,Uo.set(c,Lo(Uo.get(c)||null,e,t,n,s,l)),!0}return!1}function am(e){var t=fs(e.target);if(t!==null){var n=i(t);if(n!==null){if(t=n.tag,t===13){if(t=d(n),t!==null){e.blockedOn=t,gd(e.priority,function(){em(n)});return}}else if(t===31){if(t=h(n),t!==null){e.blockedOn=t,gd(e.priority,function(){em(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function vl(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=yu(e.nativeEvent);if(n===null){n=e.nativeEvent;var s=new n.constructor(n.type,n);br=s,n.target.dispatchEvent(s),br=null}else return t=hs(n),t!==null&&Ip(t),e.blockedOn=n,!1;t.shift()}return!0}function sm(e,t,n){vl(e)&&n.delete(t)}function ob(){vu=!1,Ma!==null&&vl(Ma)&&(Ma=null),$a!==null&&vl($a)&&($a=null),Oa!==null&&vl(Oa)&&(Oa=null),Ho.forEach(sm),Uo.forEach(sm)}function xl(e,t){e.blockedOn===t&&(e.blockedOn=null,vu||(vu=!0,a.unstable_scheduleCallback(a.unstable_NormalPriority,ob)))}var wl=null;function om(e){wl!==e&&(wl=e,a.unstable_scheduleCallback(a.unstable_NormalPriority,function(){wl===e&&(wl=null);for(var t=0;t<e.length;t+=3){var n=e[t],s=e[t+1],l=e[t+2];if(typeof s!="function"){if(bu(s||n)===null)continue;break}var c=hs(n);c!==null&&(e.splice(t,3),t-=3,yc(c,{pending:!0,data:l,method:n.method,action:s},s,l))}}))}function Js(e){function t(M){return xl(M,e)}Ma!==null&&xl(Ma,e),$a!==null&&xl($a,e),Oa!==null&&xl(Oa,e),Ho.forEach(t),Uo.forEach(t);for(var n=0;n<Ca.length;n++){var s=Ca[n];s.blockedOn===e&&(s.blockedOn=null)}for(;0<Ca.length&&(n=Ca[0],n.blockedOn===null);)am(n),n.blockedOn===null&&Ca.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(s=0;s<n.length;s+=3){var l=n[s],c=n[s+1],g=l[en]||null;if(typeof c=="function")g||om(n);else if(g){var x=null;if(c&&c.hasAttribute("formAction")){if(l=c,g=c[en]||null)x=g.formAction;else if(bu(l)!==null)continue}else x=g.action;typeof x=="function"?n[s+1]=x:(n.splice(s,3),s-=3),om(n)}}}function im(){function e(c){c.canIntercept&&c.info==="react-transition"&&c.intercept({handler:function(){return new Promise(function(g){return l=g})},focusReset:"manual",scroll:"manual"})}function t(){l!==null&&(l(),l=null),s||setTimeout(n,20)}function n(){if(!s&&!navigation.transition){var c=navigation.currentEntry;c&&c.url!=null&&navigation.navigate(c.url,{state:c.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var s=!1,l=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(n,100),function(){s=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),l!==null&&(l(),l=null)}}}function xu(e){this._internalRoot=e}Sl.prototype.render=xu.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(r(409));var n=t.current,s=vn();Pp(n,s,e,t,null,null)},Sl.prototype.unmount=xu.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Pp(e.current,2,null,e,null,null),nl(),t[ds]=null}};function Sl(e){this._internalRoot=e}Sl.prototype.unstable_scheduleHydration=function(e){if(e){var t=md();e={blockedOn:null,target:e,priority:t};for(var n=0;n<Ca.length&&t!==0&&t<Ca[n].priority;n++);Ca.splice(n,0,e),n===0&&am(e)}};var lm=o.version;if(lm!=="19.2.7")throw Error(r(527,lm,"19.2.7"));z.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(r(188)):(e=Object.keys(e).join(","),Error(r(268,e)));return e=p(t),e=e!==null?y(e):null,e=e===null?null:e.stateNode,e};var ib={bundleType:0,version:"19.2.7",rendererPackageName:"react-dom",currentDispatcherRef:E,reconcilerVersion:"19.2.7"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var Al=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!Al.isDisabled&&Al.supportsFiber)try{Mn=Al.inject(ib),Vt=Al}catch{}}return Fo.createRoot=function(e,t){if(!f(e))throw Error(r(299));var n=!1,s="",l=ph,c=mh,g=gh;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(s=t.identifierPrefix),t.onUncaughtError!==void 0&&(l=t.onUncaughtError),t.onCaughtError!==void 0&&(c=t.onCaughtError),t.onRecoverableError!==void 0&&(g=t.onRecoverableError)),t=Zp(e,1,!1,null,null,n,s,null,l,c,g,im),e[ds]=t.current,tu(e),new xu(t)},Fo.hydrateRoot=function(e,t,n){if(!f(e))throw Error(r(299));var s=!1,l="",c=ph,g=mh,x=gh,M=null;return n!=null&&(n.unstable_strictMode===!0&&(s=!0),n.identifierPrefix!==void 0&&(l=n.identifierPrefix),n.onUncaughtError!==void 0&&(c=n.onUncaughtError),n.onCaughtError!==void 0&&(g=n.onCaughtError),n.onRecoverableError!==void 0&&(x=n.onRecoverableError),n.formState!==void 0&&(M=n.formState)),t=Zp(e,1,!0,t,n??null,s,l,M,c,g,x,im),t.context=Kp(null),n=t.current,s=vn(),s=ur(s),l=ba(s),l.callback=null,va(n,l,s),n=s,t.current.lanes=n,ua(t,n),Un(t),e[ds]=t.current,tu(e),new Sl(t)},Fo.version="19.2.7",Fo}var Bm;function vx(){if(Bm)return Mu.exports;Bm=1;function a(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(a)}catch(o){console.error(o)}}return a(),Mu.exports=bx(),Mu.exports}var xx=vx();const wx=`// API の往復の見本。行きの線と戻りの線を引き、戻りの線の名前は線の下に置く
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
`,Sx=`// API round trip example. Draw the request and the reply, and put the reply labels under the line
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
`,Ax=`// Chainlink CCIP でメッセージとトークンが送信元チェーンから送信先チェーンへ届くまで
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
`,Ex=`// How a message and tokens travel from the source chain to the destination chain with Chainlink CCIP
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
`,_x=`// 入門の見本。箱 2 つと線 1 本で、記法の形を見る
sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する, color: slate, icon: globe]
box アプリ [note: ログインを頼む側, color: blue, icon: app]

step ログインを押す
  say 利用者がアプリのログインを押す。アプリは本人の確認を認可サーバーに任せる。
  ブラウザ -> アプリ: GET /login
`,kx=`// Starter example. Two boxes and one line show the shape of the notation
sequence Ask to sign in

box browser as User's browser [note: operated by the user, color: slate, icon: globe]
box app as App [note: asks for sign-in, color: blue, icon: app]

step Press sign in
  say The user presses the app's sign-in button. The app leaves identity checks to the authorization server.
  browser -> app: GET /login
`,Dx=`// 直しの枝 fix と作業の枝 feature を、merge commit で main へ取り込むまで (#3164)。
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
`,Tx=`// Bringing the fix branch and the feature branch into main with merge commits (#3164).
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
`,Nx=`// OAuth 2.0 の認可コードと PKCE で、ログインしてから API を呼ぶまで
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
`,Mx=`// Sign in with the OAuth 2.0 authorization code and PKCE, then call an API
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
`,$x=`// ネット通販の注文 #1042 が受け付けられ、届いた後に返品されて返金で閉じるまでの状態 (#3163)。
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
`,Ox=`// The states of online order #1042, from the order to delivery, then a return and a refund that close it (#3163).
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
`,Cx=`// 支払いと後から届く知らせの見本。お金は硬貨で運び、注文の状態を帯で追う
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
`,jx=`// Payment and later notice example. Money moves as a coin, and the strip follows the order state
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
`,Bx=`// 作業の枝 feature を main の先端へ rebase し、main を早送りで進めて履歴を 1 本にするまで (#3164)。
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
`,zx=`// Rebasing the work branch feature onto the tip of main, then fast-forwarding main into one straight history (#3164).
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
`,Rx=`// 失敗してやり直す見本。同じ線を 2 度引き、待つ処理と何回目かを箱の中と下に見せる
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
`,qx=`// Retry example. Draw the same line twice, and show the wait and the attempt count inside and under the box
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
`,Hx=`// ウォレットで署名して取引を送る見本。署名した取引を札で運び、段ごとに呼ぶ命令を見せる
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
`,Ux=`// Wallet signing example. The signed transaction runs as a tag, and each step shows the call it makes
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
`,ui=["intro","api","retry","payment","wallet","oauth","ccip","order","rebase","merge"],zm="oauth",Lx=["intro","oauth","ccip"],Gx={intro:{ja:_x,en:kx},api:{ja:wx,en:Sx},retry:{ja:Rx,en:qx},payment:{ja:Cx,en:jx},wallet:{ja:Hx,en:Ux},oauth:{ja:Nx,en:Mx},ccip:{ja:Ax,en:Ex},order:{ja:$x,en:Ox},rebase:{ja:Bx,en:zx},merge:{ja:Dx,en:Tx}},ca=(a,o)=>Gx[a][o].trimEnd();function Ra(a,o){const u=ca(a,o),r=qa(u);if(!r.ok)return;const f=u.split(`
`)[0]??"";return{title:r.diagram.title,kind:r.diagram.kind,about:f.startsWith("//")?f.replace(/^\/\/\s*/u,""):""}}const ql={ja:["sequence 新しい図","","box 甲","box 乙","","step 最初の段","  say この段で起きることを書く。","  甲 -> 乙: 呼ぶ"].join(`
`),en:["sequence New diagram","","box a as A","box b as B","","step First step","  say Write what happens in this step.","  a -> b: call"].join(`
`)},Uu="new.dragon";function Hl(a){for(const o of ui)for(const u of["ja","en"])if(ca(o,u)===a.trimEnd())return{key:o,lang:u}}const tt={ja:{title:"dragon — 文章で書くと、動く図になる",tagline:"文章で書くと、動く図になる",language:"言葉",palette:"色味",paletteNames:{clear:"澄んだ色",paper:"紙と墨",night:"夜の計器"},site:{nav:{home:"概要",catalog:"カタログ",editor:"編集画面",docs:"使い方","release-notes":"更新履歴"},navLabel:"行き先",openMenu:"行き先を開く",closeMenu:"行き先を閉じる",openEditor:"編集画面を開く →",toDark:"暗い表示にする",toLight:"明るい表示にする",home:{chip:a=>[...a,"段ごとの再生"].join(" × "),title:["より自由な","図","を"],lead:"箱と線を書き、段ごとに動かす。型に合わせて諦めていた図が、文章のまま組み上がる。",readDocs:"使い方を読む",features:{eyebrow:"なぜ dragon か",title:"書く手間を、動く成果に。",items:[{title:"文章で書ける",text:"箱と線と段を 1 行ずつ書くだけ。座標も図の部品も組まない。"},{title:"段ごとに動き出す",text:"段を切り替えると、線の上を封筒や札が走り、箱の中の処理が進む。順序と因果が目に見える。"},{title:"URL と file で渡せる",text:"書いた記法は URL に載せて共有できる。CLI で mp4、GIF、HTML、PNG にも書き出せる。"}]},steps:{eyebrow:"3 手順",title:"1 分で走り出す。",items:[{title:"編集画面を開く",text:"ブラウザで編集画面を開く。導入作業は要らない。"},{title:"記法を書く",text:"箱と線と段を 1 行ずつ書く。最初の行で図の種類を選ぶ。"},{title:"図が動き出す",text:"右の実況表示に、段ごとに動く図が出る。URL で共有でき、file にも書き出せる。"}]},uses:{eyebrow:"使いどころ",title:"こんな図が書ける。",more:"カタログで図を見る →"},closing:{title:"今すぐ、書いて動かす。",lead:"記法を 1 つ書くだけ。動く図を 1 分後に手に入れる。"}},catalog:{crumb:"現在地",lead:(a,o,u)=>`今の記法の部品 ${a} 個と、部品を組み合わせた ${o} 種類の図を並べる。部品の頁で書き方と見え方を確かめ、図の頁で見本を検索して動かし、編集画面で開ける。合計 ${u} 件の見本。`,sections:{parts:{title:"部品",lead:"どの図でも使う部品。部品ごとに、時系列図と構成図と状態遷移図と枝分かれの図で描いた見え方を並べる。"},"kind-parts":{title:"図の種類だけの部品",lead:"1 つの図の種類でだけ使う部品。"},kinds:{title:"図",lead:"部品を組み合わせた図。図ごとに、使う部品の一覧と見本を載せる。"}},parts:{box:{name:"箱",desc:"box の行で、図に登場する物を 1 つ置く。名札と見せる名前を書き、線はこの名札で引く。"},edge:{name:"線",desc:"送る側の箱から受ける側の箱へ引く線。1 つの段に何本でも並べ、書いた順に引く。"},"edge-label":{name:"線の名前",desc:"線に添える名前。side で、上、下、左、右のどこに置くかを選ぶ。"},carry:{name:"運ぶ物",desc:"線の上を走る物。封筒、値を書いた札、硬貨、何も走らせないの 4 つから選ぶ。"},color:{name:"色の役",desc:"箱と区画に付ける色の役。7 つの役から選び、色そのものは色味が決める。"},icon:{name:"絵",desc:"箱と区画の名前に添える絵。user や db などの名前で選ぶ。"},note:{name:"小さな字",desc:"箱と区画の名前の下に添える小さな字。段の中で箱の小さな字を書き換えられる。"},act:{name:"箱の中の処理",desc:"線を引かずに、箱の中で起きる処理を札で見せる。"},strip:{name:"中身の帯と欄",desc:"図の下に置く中身の帯。段ごとに欄の値を入れ替え、運ばれる物の中身を追う。"},step:{name:"段",desc:"図を区切る段。段ごとに本文と打つ命令を書き、1 段ずつ送って見る。view で、枠が段を追うか全体を止めて見せるかを選ぶ。"},lifeline:{name:"生存線",desc:"時系列図だけの部品。箱の下に縦の線が伸び、上から下へ時が進む。"},group:{name:"区画",desc:"構成図だけの部品。group から end までの箱を 1 つの区画に囲み、仕組みの境目を見せる。"},"start-finish":{name:"始まりと終わり",desc:"状態遷移図だけの部品。線の送る側に start、受ける側に finish を書くと、始まりの印から出る線と、終わりの印へ入る線になる。"},"side-path":{name:"通らない道",desc:"状態遷移図だけの部品。最初の step より前に書いた線は、移れるが今回は通らない道として点線で引く。どの段も辿り着かない状態は点線の箱にして、脇道の囲みに入れる。"},branch:{name:"枝",desc:"枝分かれの図だけの部品。branch の行で枝を上から順に宣言すると、枝ごとに横長の帯が並ぶ。段の中で <枝> from <commit> と書くと、その commit から枝を切る。"},commit:{name:"commit",desc:"枝分かれの図だけの部品。commit <名札> on <枝> で枝に commit を積み、hash と一言を丸の外に添える。積んだ枝の札と、その枝を指す HEAD が新しい commit へ進む。"},copy:{name:"当て直し",desc:"枝分かれの図だけの部品。on <枝> の後ろに copy <commit> を書くと、元の commit と同じ変更を当て直した commit になり、元から点線で結ぶ。rebase で作り直す commit に使い、枝の札は動かさない。"},merge:{name:"merge commit",desc:"枝分かれの図だけの部品。on <枝> の後ろに merge <枝> を書くと、取り込む先の先端と取り込む枝の先端の 2 つを親に持つ commit になる。取り込む先の札だけが進む。"}},kindOnly:a=>`${a}だけ`,partKinds:"使える図",words:"記法の語",uses:"この図で使う部品",usesLead:"部品を押すと、その部品の書き方と見え方の頁へ移る。",partSamples:"この部品を使う見本",partSamplesLead:"見本を押すと、図の頁でその見本を開く。",partIcons:"使える絵柄",partIconsLead:a=>`箱と区画の icon に下の名前を書くと、その絵柄が名前の横に付く。使える絵柄は ${a} 個。`,count:a=>`${a} 件`,open:"開く →",kinds:{sequence:"登場する物の間で、誰が誰に何を渡すかを段ごとに追う図。ログインの流れや API の呼び出しの順を、線の上を走る封筒で見せる。",architecture:"区画と箱で仕組みの構成を描き、段ごとにどこからどこへ何が流れるかを見せる図。チェーンをまたぐ送金や、サービスの間の受け渡しに使う。",state:"1 つの物が状態を移る様子を段ごとに追う図。注文や申請が受付から閉じるまでにどの状態を通るかを、線の上を走る札で見せる。",git:"git の枝に commit が積まれ、rebase や merge commit で取り込まれる様子を段ごとに追う図。枝と HEAD がどの commit を指すかを、丸の上の札で見せる。"},total:a=>`全 ${a} 件`,showing:a=>`${a} 件 表示中`,search:"検索 (名前 / 説明)",searchLabel:"見本を検索",clearSearch:"検索語を消す",list:"見本の一覧",nothing:"当てはまる見本が無い",preview:"図の表示",views:"表示の切替",figure:"図",code:"コード",sameAsSite:"サイトと同じ",expand:"拡大",expandLabel:a=>`${a} を拡大して見る`,close:"閉じる",openEditor:"編集画面で開く →",source:"この図の記法",copy:"コードを写す",copied:"写しました"},screens:{catalog:{title:"カタログ"},editor:{title:"編集画面",lead:""},docs:{title:"使い方"},"release-notes":{title:"更新履歴"},"not-found":{title:"そこは、まだ書かれていない。"}},releaseNotes:{crumb:"道筋",eyebrow:a=>`公開の記録 · ${a} が最新`,accent:"履歴",lead:"dragon の今の版を示す。版ごとの詳しい変更は GitHub 上の CHANGELOG.md で読める。",changelog:"変更の記録を GitHub で見る"},notFound:{em:"そこは",lead:a=>`お探しの頁は移動または削除されたか、そもそも存在しません。dragon の ${a} つの入口から探してみてください。`,catalog:"カタログを見る",docs:"使い方を読む"}},notation:"記法",editor:"図の記法を書く欄",fold:"畳む",unfold:"開く",readable:(a,o)=>`読めています — 箱 ${a} つ、段 ${o}`,notJson:a=>`JSON として読めない — ${a}`,cannotDraw:a=>`描けない — ${a}`,kept:"誤りがあるあいだは、最後に描けた図を出しています",exportLead:"同じ図を書き出す",exportTail:"で mp4 / GIF / HTML / PNG",shelf:{label:"棚",open:"棚を開く",close:"棚を閉じる",newFile:"新規ファイル",tabs:{samples:"見本",parts:"部品",notation:"記法"},filter:"絞り込む…",filterLabel:"一覧を絞り込む",nothing:"当てはまる物が無い",kinds:{sequence:"時系列図",architecture:"構成図",state:"状態遷移図",git:"枝分かれの図"},partsHint:"押すと書く欄に足す。宣言の行は最初の段の前、段の中の行は最後の段に入る",notationHint:"行の形。書く欄の記法と同じ言葉の語で出す",parts:{box:"箱",region:"区画と箱",step:"段",edge:"線 (封筒が走る)","edge-tag":"札を運ぶ線","edge-coin":"硬貨を運ぶ線","edge-none":"何も運ばない線","edge-below":"名前を下に置く線",action:"箱の中の処理",swap:"箱の下の字の書き換え",strip:"帯の値"},syntax:{kind:"図の種類と題。最初の行に書く",view:"見せ方。書かなければ字の大きさで選ぶ",region:"区画。箱を囲む",box:"箱。名札は線と処理で使う",strip:"帯。段ごとに変わる値の欄",step:"段の題と本文",code:"段で打つ命令",edge:"線。運ぶ物を書かなければ封筒が走る",carry:"線の上を運ぶ物",side:"線の名前を置く側","start-finish":"始まりと終わり。状態遷移図の線の送る側に start、受ける側に finish を書く",path:"通らない道。状態遷移図の最初の step より前に書く",branch:"枝。枝分かれの図で上から帯に並べ、段の中の from で commit から枝を切る",commit:"commit を積む。hash と一言を丸の外に添える",copy:"当て直した commit。枝の札を動かさない",merge:"merge commit。取り込む枝の先端も親に持つ",ref:"札を動かす。枝の名札か HEAD から commit へ引く",action:"箱の中の処理",swap:"箱の下の小さな字の書き換え","strip-value":"帯の値",comment:"メモ。図には出ない"}},code:{file:"書類名",import:"file を取り込む (.dragon か .json)",export:"今の記法を .dragon の file に書き出す"},stage:{live:"実況表示",fontDown:"語りの字を小さくする",fontUp:"語りの字を大きくする",grid:"格子を出す",fullscreen:"全画面で見る",fit:"全体に合わせる",zoomOut:"縮小する",zoomIn:"拡大する",zoom:"表示の倍率",phase:(a,o,u)=>`段 ${a} / ${o} · ${u}`},notices:{line:a=>`${a} 行目`,count:a=>`誤り ${a} 件`,goTo:a=>`${a} 行目へ移る`},overlaps:{count:a=>`字の重なり ${a} 件`,step:a=>`段 ${a}`,goTo:a=>`段 ${a} へ移る`}},en:{title:"dragon — write it as text, get a moving diagram",tagline:"Write it as text, get a moving diagram",language:"Language",palette:"Palette",paletteNames:{clear:"Clear",paper:"Paper and ink",night:"Night gauges"},site:{nav:{home:"Home",catalog:"Catalog",editor:"Editor",docs:"Docs","release-notes":"Release notes"},navLabel:"Main navigation",openMenu:"Open navigation",closeMenu:"Close navigation",openEditor:"Open editor →",toDark:"Switch to dark",toLight:"Switch to light",home:{chip:a=>[...a,"step playback"].join(" × "),title:["","Diagrams"," beyond the template"],lead:"Write the boxes and the edges, and move them step by step. Diagrams you gave up on because the template could not hold them now build themselves from plain text.",readDocs:"Read the docs",features:{eyebrow:"Why dragon",title:"Turn your writing into diagrams that move.",items:[{title:"Write it as text",text:"Write boxes, edges and steps one line at a time. No coordinates, no hand-built parts."},{title:"Motion, step by step",text:"Switch steps and envelopes and tags run along the edges while actions play inside the boxes. Order and causality become visible."},{title:"Hand it over by URL or file",text:"Put the notation in a URL to share it, or export it to mp4, GIF, HTML or PNG with the CLI."}]},steps:{eyebrow:"3 steps",title:"Up and running in a minute.",items:[{title:"Open the editor",text:"Open the editor in your browser. Nothing to install."},{title:"Write the notation",text:"Write boxes, edges and steps one line at a time. The first line picks the diagram kind."},{title:"The diagram starts moving",text:"The live view on the right shows a diagram that moves step by step. Share it by URL, or export it to a file."}]},uses:{eyebrow:"Use cases",title:"Diagrams you can write.",more:"Browse the catalog →"},closing:{title:"Write it now, watch it move.",lead:"One notation file is all it takes. A moving diagram is yours a minute later."}},catalog:{crumb:"You are here",lead:(a,o,u)=>`The ${a} parts of the current notation, and the ${o} diagram kinds built from them. A part page shows how to write the part and how it looks; a diagram page lets you search its examples, watch them move, and open them in the editor. ${u} examples in total.`,sections:{parts:{title:"Parts",lead:"Parts every diagram uses. Each part page shows the part in a sequence diagram, an architecture diagram, a state diagram, and a git graph."},"kind-parts":{title:"Parts for one kind",lead:"Parts that only one diagram kind uses."},kinds:{title:"Diagrams",lead:"Diagrams built from the parts. Each lists the parts it uses and its examples."}},parts:{box:{name:"Box",desc:"A box line places one thing in the diagram. Write a tag and the name to show; edges use the tag."},edge:{name:"Edge",desc:"A line from the sending box to the receiving box. A step can hold any number, drawn in the order written."},"edge-label":{name:"Edge label",desc:"The name beside an edge. side puts it above, below, left or right."},carry:{name:"Carry",desc:"What runs along an edge: an envelope, a tag with a value, a coin, or nothing."},color:{name:"Color",desc:"The color role of a box or a group. Pick one of seven roles; the palette decides the actual color."},icon:{name:"Icon",desc:"A picture beside the name of a box or a group, chosen by a name such as user or db."},note:{name:"Note",desc:"Small text under the name of a box or a group. A step can rewrite the small text of a box."},act:{name:"Action",desc:"Shows work done inside a box as a badge, with no edge."},strip:{name:"Strip",desc:"A strip of fields under the diagram. Each step can rewrite a field to follow what is carried."},step:{name:"Step",desc:"A step of the diagram, with its own text and command, played one at a time. view picks whether the frame follows the step or holds the whole diagram."},lifeline:{name:"Lifeline",desc:"Sequence diagrams only. A line runs down from each box, and time moves down the page."},group:{name:"Group",desc:"Architecture diagrams only. The boxes between group and end sit inside one region that marks a boundary in the system."},"start-finish":{name:"Start and end",desc:"State diagrams only. Write start as the sender of a line and finish as its receiver, and the line leaves the start mark or goes into the end mark."},"side-path":{name:"Path not taken",desc:"State diagrams only. A line written before the first step is a path the object could take but does not this time, drawn dotted. A state that no step reaches becomes a dotted box inside the side path area."},branch:{name:"Branch",desc:"Git graphs only. Declare branches top to bottom with branch lines, and each gets its own lane. Inside a step, <branch> from <commit> cuts the branch at that commit."},commit:{name:"Commit",desc:"Git graphs only. commit <id> on <branch> adds a commit to the branch, with its hash and a short note beside the circle. The branch's ref, and HEAD when it points at that branch, move to the new commit."},copy:{name:"Replay",desc:"Git graphs only. Add copy <commit> after on <branch> to replay the same change as that commit, joined to it by a dotted line. Use it for commits a rebase rewrites; branch refs do not move."},merge:{name:"Merge commit",desc:"Git graphs only. Add merge <branch> after on <branch> to make a commit with two parents: the tip of the target and the tip of the merged branch. Only the target's ref moves."}},kindOnly:a=>`${a} only`,partKinds:"Used in",words:"Notation",uses:"Parts this diagram uses",usesLead:"Pick a part to see how to write it and how it looks.",partSamples:"Examples that use this part",partSamplesLead:"Pick an example to open it on its diagram page.",partIcons:"Available icons",partIconsLead:a=>`Write one of these names as the icon of a box or a group to put that picture beside its name. There are ${a} icons.`,count:a=>`${a} ${a===1?"example":"examples"}`,open:"Open →",kinds:{sequence:"Follow who hands what to whom, step by step. Show a sign-in flow or the order of API calls with envelopes running along the edges.",architecture:"Draw a system as regions and boxes, and show what flows where in each step. Use it for cross-chain transfers or hand-offs between services.",state:"Follow one object as it moves between states, step by step. A tag running along the lines shows which states an order or a request passes before it closes.",git:"Follow commits piling up on git branches and coming together through a rebase or a merge commit, step by step. Tags above the circles show which commit each branch and HEAD point at."},total:a=>`${a} ${a===1?"example":"examples"}`,showing:a=>`showing ${a}`,search:"Search (name / description)",searchLabel:"Search the examples",clearSearch:"Clear the search",list:"Example list",nothing:"No example matches",preview:"Diagram",views:"What to show",figure:"Diagram",code:"Code",sameAsSite:"Same as the site",expand:"Enlarge",expandLabel:a=>`Enlarge ${a}`,close:"Close",openEditor:"Open in the editor →",source:"Notation for this diagram",copy:"Copy the code",copied:"Copied"},screens:{catalog:{title:"Catalog"},editor:{title:"Editor",lead:""},docs:{title:"Docs"},"release-notes":{title:"Release notes"},"not-found":{title:"That page has not been written yet."}},releaseNotes:{crumb:"Breadcrumb",eyebrow:a=>`Release log • ${a} is current`,accent:"notes",lead:"Shows the current dragon version. The detailed record for each version is in CHANGELOG.md on GitHub.",changelog:"See the change log on GitHub"},notFound:{em:"That page",lead:a=>`The page you are looking for was moved, deleted, or never existed. Try one of dragon's ${a} entry points.`,catalog:"Browse the catalog",docs:"Read the docs"}},notation:"Notation",editor:"Diagram notation",fold:"Hide",unfold:"Show",readable:(a,o)=>`Reads fine — ${a} ${a===1?"box":"boxes"}, ${o} ${o===1?"step":"steps"}`,notJson:a=>`Not valid JSON — ${a}`,cannotDraw:a=>`Cannot draw — ${a}`,kept:"Showing the last diagram that drew",exportLead:"Export the same diagram",exportTail:"to mp4 / GIF / HTML / PNG",shelf:{label:"Shelf",open:"Open the shelf",close:"Close the shelf",newFile:"New file",tabs:{samples:"Samples",parts:"Parts",notation:"Notation"},filter:"Filter…",filterLabel:"Filter the list",nothing:"Nothing matches",kinds:{sequence:"Sequence",architecture:"Architecture",state:"State",git:"Git graph"},partsHint:"Click to add to the editor. Declarations go before the first step, step lines go to the last step",notationHint:"Line shapes, in the words of the notation you are writing",parts:{box:"Box",region:"Region with a box",step:"Step",edge:"Edge (an envelope runs)","edge-tag":"Edge carrying a tag","edge-coin":"Edge carrying a coin","edge-none":"Edge carrying nothing","edge-below":"Edge with its label below",action:"Action inside a box",swap:"Rewrite the text under a box",strip:"Strip value"},syntax:{kind:"Diagram kind and title, on the first line",view:"View. Chosen by text size when left out",region:"Region around boxes",box:"Box. Its id is used by edges and actions",strip:"Strip, the fields whose values change per step",step:"Step title and body",code:"Command run in the step",edge:"Edge. An envelope runs when nothing is carried",carry:"What runs along the edge",side:"Where the edge label sits","start-finish":"Start and end. In a state diagram, write start as a line's sender and finish as its receiver",path:"Path not taken. In a state diagram, write it before the first step",branch:"Branch. In a git graph, lanes go top to bottom; from inside a step cuts a branch at a commit",commit:"Add a commit, with its hash and a short note beside the circle",copy:"Replayed commit. Branch refs do not move",merge:"Merge commit. The merged branch's tip is a parent too",ref:"Move a ref, from a branch id or HEAD to a commit",action:"Action inside a box",swap:"Rewrite the small text under a box","strip-value":"Strip value",comment:"Memo. Not drawn"}},code:{file:"File name",import:"Import a file (.dragon or .json)",export:"Export the notation as a .dragon file"},stage:{live:"Live preview",fontDown:"Smaller narration text",fontUp:"Larger narration text",grid:"Show the grid",fullscreen:"Full screen",fit:"Fit to the frame",zoomOut:"Zoom out",zoomIn:"Zoom in",zoom:"Zoom level",phase:(a,o,u)=>`Step ${a} / ${o} · ${u}`},notices:{line:a=>`Line ${a}`,count:a=>`${a} ${a===1?"error":"errors"}`,goTo:a=>`Go to line ${a}`},overlaps:{count:a=>`${a} text ${a===1?"overlap":"overlaps"}`,step:a=>`Step ${a}`,goTo:a=>`Go to step ${a}`}}};function Yx(a){return a[0]?.toLowerCase().startsWith("ja")?"ja":"en"}const rn=Object.keys(tt.ja.shelf.kinds),id=a=>rn.some(o=>o===a),Ng=a=>ui.filter(o=>Ra(o,"ja")?.kind===a),Lu="n=";function ld(a){let o="";for(const u of new TextEncoder().encode(a))o+=String.fromCharCode(u);return`#${Lu}${btoa(o).replaceAll("+","-").replaceAll("/","_").replace(/=+$/u,"")}`}function Mg(a){if(a.startsWith(`#${Lu}`))try{const o=atob(a.slice(Lu.length+1).replaceAll("-","+").replaceAll("_","/"));return new TextDecoder("utf-8",{fatal:!0}).decode(Uint8Array.from(o,u=>u.charCodeAt(0)))}catch{return}}const za="/dragon/",ct={home:za,catalog:`${za}catalog`,editor:`${za}editor`,docs:`${za}docs`,"release-notes":`${za}release-notes`},rd="https://github.com/cardene777/dragon",Fx={catalog:"catalog",editor:"editor",docs:"docs","release-notes":"release-notes"};function $g(a){if(`${a}/`===za)return{screen:"home"};if(!a.startsWith(za))return{screen:"not-found"};const o=a.slice(za.length).split("/").filter(Boolean),[u,r,f]=o;if(u===void 0)return{screen:"home"};if(u==="catalog"&&r!==void 0&&o.length===2)return{screen:"category",category:decodeURIComponent(r)};if(u==="catalog"&&r==="part"&&f!==void 0&&o.length===3)return{screen:"part",part:decodeURIComponent(f)};const i=Fx[u];return i!==void 0&&o.length===1?{screen:i}:{screen:"not-found"}}function Xx(){$g(location.pathname).screen==="home"&&Mg(location.hash)!==void 0&&history.replaceState(null,"",`${ct.editor}${location.search}${location.hash}`)}const Gu=new Set;function Vx(a){return Gu.add(a),addEventListener("popstate",a),()=>{Gu.delete(a),removeEventListener("popstate",a)}}function Qx(){return Ae.useSyncExternalStore(Vx,()=>location.pathname)}function Jx(a){const o=new URL(a,location.href);if(o.pathname!==location.pathname||o.hash!==""&&o.hash!==location.hash){history.pushState(null,"",`${o.pathname}${o.hash}`);for(const u of Gu)u()}scrollTo(0,0)}function dt(a,o){a.button!==0||a.metaKey||a.ctrlKey||a.shiftKey||a.altKey||(a.preventDefault(),Jx(a.currentTarget.href),o?.())}const Zx=`architecture 箱の中の処理

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
`,Kx=`architecture Action

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
`,Px=`git 箱の中の処理

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
`,Wx=`git Action

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
`,Ix=`sequence 箱の中の処理

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
`,e1=`sequence Action

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
`,t1=`state 箱の中の処理

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
`,n1=`state Action

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
`,a1=`architecture 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,s1=`architecture Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,o1=`git 箱

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
`,i1=`git Box

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
`,l1=`sequence 箱

box 利用者
box アプリ as 注文のアプリ

step 頼む
  say box の行で箱を 1 つ置く。as の後ろに見せる名前を書く。
  利用者 -> アプリ: 注文する

step 返す
  say 線は箱の名札で書く。
  アプリ -> 利用者: 受け付けた
`,r1=`sequence Box

box user as User
box app as Order app

step Ask
  say A box line places one box. The name to show follows as.
  user -> app: place order

step Reply
  say Edges name the boxes by their tags.
  app -> user: accepted
`,c1=`state 箱

box 下書き
box 公開中 as 公開している

step 公開する
  say box の行で状態を 1 つ置く。as の後ろに見せる名前を書く。
  下書き -> 公開中: 公開する

step 戻す
  say 線は状態の名札で書く。
  公開中 -> 下書き: 取り下げる
`,u1=`state Box

box draft as Draft
box live as Published

step Publish
  say A box line places one state. The name to show follows as.
  draft -> live: publish

step Withdraw
  say Edges name the states by their tags.
  live -> draft: withdraw
`,d1=`git 枝

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
`,f1=`git Branch

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
`,h1=`architecture 運ぶ物

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
`,p1=`architecture Carry

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
`,m1=`git 運ぶ物

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
`,g1=`git Carry

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
`,y1=`sequence 運ぶ物

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
`,b1=`sequence Carry

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
`,v1=`state 運ぶ物

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
`,x1=`state Carry

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
`,w1=`architecture 色の役

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
`,S1=`architecture Color

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
`,A1=`git 色の役

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
`,E1=`git Color

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
`,_1=`sequence 色の役

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
`,k1=`sequence Color

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
`,D1=`state 色の役

box 下書き [color: slate]
box 審査中 [color: amber]
box 公開中 [color: green]

step 出す
  say color で、状態の箱に 7 つの役から色を選ぶ。
  下書き -> 審査中: 審査に出す

step 通る
  say 役は意味で選ぶ。待つ状態は amber、終えた状態は green のように揃える。
  審査中 -> 公開中: 通す
`,T1=`state Color

box draft as Draft [color: slate]
box review as In review [color: amber]
box live as Published [color: green]

step Submit
  say color picks one of 7 roles for a state box.
  draft -> review: submit

step Approve
  say Pick roles by meaning, such as amber for waiting states and green for finished ones.
  review -> live: approve
`,N1=`git commit

branch main

step 積む
  say commit <名札> on <枝> で枝に commit を積む。積んだ枝の札が新しい commit へ進む。
  commit A on main
  commit B on main

step 字を添える
  say hash と note で、丸の外に hash と一言を添える。
  commit C on main [hash: c41d0e5, note: 価格を丸める]
`,M1=`git Commit

branch main

step Commit
  say commit <id> on <branch> adds a commit to the branch. The branch's ref moves to the new commit.
  commit A on main
  commit B on main

step Add text
  say hash and note put a hash and a short note beside the circle.
  commit C on main [hash: c41d0e5, note: Round prices]
`,$1=`git 当て直し

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
`,O1=`git Replay

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
`,C1=`architecture 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,j1=`architecture Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,B1=`git 線の名前

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
`,z1=`git Edge label

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
`,R1=`sequence 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。横の線は above か below。
  乙 -> 甲: 下の名前 [side: below]
`,q1=`sequence Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above or below.
  b -> a: label below [side: below]
`,H1=`state 線の名前

box 甲
box 乙

step 上に置く
  say コロンの後ろが線の名前。書かなければ線の上に置く。
  甲 -> 乙: 上の名前

step 下に置く
  say side で名前を置く側を選ぶ。above、below、left、right の 4 つ。
  乙 -> 甲: 下の名前 [side: below]
`,U1=`state Edge label

box a as A
box b as B

step Above
  say The text after the colon is the label. It sits above by default.
  a -> b: label above

step Below
  say side picks where the label sits: above, below, left or right.
  b -> a: label below [side: below]
`,L1=`architecture 線

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
`,G1=`architecture Edge

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
`,Y1=`git 線

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
`,F1=`git Edge

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
`,X1=`sequence 線

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
`,V1=`sequence Edge

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
`,Q1=`state 線

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
`,J1=`state Edge

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
`,Z1=`architecture 区画

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
`,K1=`architecture Group

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
`,P1=`architecture 絵

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
`,W1=`architecture Icon

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
`,I1=`git 絵

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
`,e3=`git Icon

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
`,t3=`sequence 絵

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
`,n3=`sequence Icon

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
`,a3=`state 絵

box 下書き [icon: doc]
box 審査中 [icon: clock]
box 公開中 [icon: globe]

step 出す
  say icon で状態の箱に絵を付ける。
  下書き -> 審査中: 審査に出す

step 通る
  say 運ぶ物は、着いた状態の絵柄の横の置き場に留まる。
  審査中 -> 公開中: 通す
`,s3=`state Icon

box draft as Draft [icon: doc]
box review as In review [icon: clock]
box live as Published [icon: globe]

step Submit
  say icon puts a picture on a state box.
  draft -> review: submit

step Approve
  say The carried item rests in the slot beside the icon of the state it reaches.
  review -> live: approve
`,o3=`sequence 生存線

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
`,i3=`sequence Lifeline

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
`,l3=`git merge commit

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
`,r3=`git Merge commit

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
`,c3=`architecture 小さな字

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
`,u3=`architecture Note

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
`,d3=`git 小さな字

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
`,f3=`git Note

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
`,h3=`sequence 小さな字

box 財布 [note: 残高 5000 円]
box 店 [note: 待っている]

step 払う
  say note で箱の名前の下に小さな字を添える。
  財布 -> 店: 1200 円 [carry: coin]

step 書き換える
  say 段の中の note の行で、その段から小さな字を書き換える。
  note 財布: 残高 3800 円
  note 店: 受け取った
`,p3=`sequence Note

box wallet as Wallet [note: balance 50 USD]
box shop as Shop [note: waiting]

step Pay
  say note adds small text under the box name.
  wallet -> shop: 12 USD [carry: coin]

step Rewrite
  say A note line in a step rewrites the small text from then on.
  note wallet: balance 38 USD
  note shop: paid
`,m3=`state 小さな字

box 在庫あり [note: 残り 1 個]
box 品切れ [note: 入荷待ち]

step 売り切れる
  say note で状態の名前の下に小さな字を添える。
  在庫あり -> 品切れ: 最後の 1 個が売れた

step 入荷する
  say 段の中の note の行で、その段から状態の小さな字を書き換える。
  品切れ -> 在庫あり: 入荷した
  note 在庫あり: 残り 10 個
`,g3=`state Note

box stocked as In stock [note: 1 left]
box out as Sold out [note: awaiting stock]

step Sell out
  say note adds small text under the state name.
  stocked -> out: last one sold

step Restock
  say A note line inside a step rewrites the small text from that step on.
  out -> stocked: restocked
  note stocked: 10 left
`,y3=`state 通らない道

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
`,b3=`state Path not taken

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
`,v3=`state 始まりと終わり

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
`,x3=`state Start and end

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
`,w3=`architecture 段 [view: fixed]

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
`,S3=`architecture Step [view: fixed]

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
`,A3=`git 段 [view: fixed]

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
`,E3=`git Step [view: fixed]

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
`,_3=`sequence 段 [view: fixed]

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
`,k3=`sequence Step [view: fixed]

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
`,D3=`state 段 [view: fixed]

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
`,T3=`state Step [view: fixed]

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
`,N3=`architecture 中身の帯と欄

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
`,M3=`architecture Strip

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
`,$3=`git 中身の帯と欄

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
`,O3=`git Strip

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
`,C3=`sequence 中身の帯と欄

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
`,j3=`sequence Strip

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
`,B3=`state 中身の帯と欄

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
`,z3=`state Strip

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
`,Wo=[{id:"box",kinds:rn,words:["head:box"]},{id:"edge",kinds:rn,words:["edge:->"]},{id:"edge-label",kinds:rn,words:["attr:edge.side"]},{id:"carry",kinds:rn,words:["attr:edge.carry","attr:edge.tag"]},{id:"color",kinds:rn,words:["attr:box.color"]},{id:"icon",kinds:rn,words:["attr:box.icon"]},{id:"note",kinds:rn,words:["attr:box.note","head:note"]},{id:"act",kinds:rn,words:["head:act"]},{id:"strip",kinds:rn,words:["head:strip","head:set","attr:set.tag"]},{id:"step",kinds:rn,words:["head:step","head:say","head:code","attr:diagram.view"]},{id:"lifeline",kinds:["sequence"],words:["kind:sequence"]},{id:"group",kinds:["architecture"],words:["kind:architecture","head:group","head:end","attr:group.note","attr:group.color","attr:group.icon"]},{id:"start-finish",kinds:["state"],words:["kind:state","edge:start","edge:finish"]},{id:"side-path",kinds:["state"],words:["edge:before-step"]},{id:"branch",kinds:["git"],words:["kind:git","head:branch","attr:branch.note","git:from"]},{id:"commit",kinds:["git"],words:["head:commit","attr:commit.hash","attr:commit.note"]},{id:"copy",kinds:["git"],words:["git:copy"]},{id:"merge",kinds:["git"],words:["git:merge"]}],Yu=a=>rn.every(o=>a.kinds.includes(o)),cd=a=>Wo.find(o=>o.id===a),R3=a=>Wo.filter(o=>o.kinds.includes(a)),q3=Object.assign({"./parts/act.architecture.dragon":Zx,"./parts/act.architecture.en.dragon":Kx,"./parts/act.git.dragon":Px,"./parts/act.git.en.dragon":Wx,"./parts/act.sequence.dragon":Ix,"./parts/act.sequence.en.dragon":e1,"./parts/act.state.dragon":t1,"./parts/act.state.en.dragon":n1,"./parts/box.architecture.dragon":a1,"./parts/box.architecture.en.dragon":s1,"./parts/box.git.dragon":o1,"./parts/box.git.en.dragon":i1,"./parts/box.sequence.dragon":l1,"./parts/box.sequence.en.dragon":r1,"./parts/box.state.dragon":c1,"./parts/box.state.en.dragon":u1,"./parts/branch.git.dragon":d1,"./parts/branch.git.en.dragon":f1,"./parts/carry.architecture.dragon":h1,"./parts/carry.architecture.en.dragon":p1,"./parts/carry.git.dragon":m1,"./parts/carry.git.en.dragon":g1,"./parts/carry.sequence.dragon":y1,"./parts/carry.sequence.en.dragon":b1,"./parts/carry.state.dragon":v1,"./parts/carry.state.en.dragon":x1,"./parts/color.architecture.dragon":w1,"./parts/color.architecture.en.dragon":S1,"./parts/color.git.dragon":A1,"./parts/color.git.en.dragon":E1,"./parts/color.sequence.dragon":_1,"./parts/color.sequence.en.dragon":k1,"./parts/color.state.dragon":D1,"./parts/color.state.en.dragon":T1,"./parts/commit.git.dragon":N1,"./parts/commit.git.en.dragon":M1,"./parts/copy.git.dragon":$1,"./parts/copy.git.en.dragon":O1,"./parts/edge-label.architecture.dragon":C1,"./parts/edge-label.architecture.en.dragon":j1,"./parts/edge-label.git.dragon":B1,"./parts/edge-label.git.en.dragon":z1,"./parts/edge-label.sequence.dragon":R1,"./parts/edge-label.sequence.en.dragon":q1,"./parts/edge-label.state.dragon":H1,"./parts/edge-label.state.en.dragon":U1,"./parts/edge.architecture.dragon":L1,"./parts/edge.architecture.en.dragon":G1,"./parts/edge.git.dragon":Y1,"./parts/edge.git.en.dragon":F1,"./parts/edge.sequence.dragon":X1,"./parts/edge.sequence.en.dragon":V1,"./parts/edge.state.dragon":Q1,"./parts/edge.state.en.dragon":J1,"./parts/group.architecture.dragon":Z1,"./parts/group.architecture.en.dragon":K1,"./parts/icon.architecture.dragon":P1,"./parts/icon.architecture.en.dragon":W1,"./parts/icon.git.dragon":I1,"./parts/icon.git.en.dragon":e3,"./parts/icon.sequence.dragon":t3,"./parts/icon.sequence.en.dragon":n3,"./parts/icon.state.dragon":a3,"./parts/icon.state.en.dragon":s3,"./parts/lifeline.sequence.dragon":o3,"./parts/lifeline.sequence.en.dragon":i3,"./parts/merge.git.dragon":l3,"./parts/merge.git.en.dragon":r3,"./parts/note.architecture.dragon":c3,"./parts/note.architecture.en.dragon":u3,"./parts/note.git.dragon":d3,"./parts/note.git.en.dragon":f3,"./parts/note.sequence.dragon":h3,"./parts/note.sequence.en.dragon":p3,"./parts/note.state.dragon":m3,"./parts/note.state.en.dragon":g3,"./parts/side-path.state.dragon":y3,"./parts/side-path.state.en.dragon":b3,"./parts/start-finish.state.dragon":v3,"./parts/start-finish.state.en.dragon":x3,"./parts/step.architecture.dragon":w3,"./parts/step.architecture.en.dragon":S3,"./parts/step.git.dragon":A3,"./parts/step.git.en.dragon":E3,"./parts/step.sequence.dragon":_3,"./parts/step.sequence.en.dragon":k3,"./parts/step.state.dragon":D3,"./parts/step.state.en.dragon":T3,"./parts/strip.architecture.dragon":N3,"./parts/strip.architecture.en.dragon":M3,"./parts/strip.git.dragon":$3,"./parts/strip.git.en.dragon":O3,"./parts/strip.sequence.dragon":C3,"./parts/strip.sequence.en.dragon":j3,"./parts/strip.state.dragon":B3,"./parts/strip.state.en.dragon":z3}),H3=(a,o,u)=>(q3[`./parts/${a}.${o}${u==="en"?".en":""}.dragon`]??"").trimEnd(),os=a=>a.steps.flatMap(o=>o.events),Zs=a=>os(a).flatMap(o=>o.type==="edge"?[o]:[]),Xo=a=>os(a).flatMap(o=>o.type==="commit"?[o]:[]),U3=(a,o)=>o.carry.kind==="tag"&&!(a.kind==="git"&&o.carry.text===o.from),L3={"kind:sequence":a=>a.kind==="sequence","kind:architecture":a=>a.kind==="architecture","kind:state":a=>a.kind==="state","kind:git":a=>a.kind==="git","head:group":a=>(a.regions??[]).length>0,"head:end":a=>(a.regions??[]).length>0,"head:box":a=>a.boxes.length>0,"head:strip":a=>a.strip!==void 0,"head:step":a=>a.steps.length>0,"head:say":a=>a.steps.some(o=>o.body!==""),"head:code":a=>a.steps.some(o=>o.code!==void 0),"head:act":a=>os(a).some(o=>o.type==="action"),"head:note":a=>os(a).some(o=>o.type==="swap"),"head:set":a=>os(a).some(o=>o.type==="strip"),"attr:diagram.view":a=>a.view!==void 0,"attr:group.note":a=>(a.regions??[]).some(o=>o.note!==void 0),"attr:group.color":a=>(a.regions??[]).some(o=>o.color!==void 0),"attr:group.icon":a=>(a.regions??[]).some(o=>o.icon!==void 0),"attr:box.note":a=>a.boxes.some(o=>o.sub!==void 0),"attr:box.color":a=>a.boxes.some(o=>o.color!==void 0),"attr:box.icon":a=>a.boxes.some(o=>o.icon!==void 0),"attr:edge.carry":a=>Zs(a).some(o=>o.carry.kind==="coin"||o.carry.kind==="none"),"attr:edge.tag":a=>Zs(a).some(o=>U3(a,o)),"attr:edge.side":a=>Zs(a).some(o=>o.labelSide!==void 0),"attr:set.tag":a=>os(a).some(o=>o.type==="strip"&&o.tag!==void 0),"edge:->":a=>Zs(a).length>0,"edge:start":a=>Zs(a).some(o=>o.from==="start"),"edge:finish":a=>Zs(a).some(o=>o.to==="finish"),"edge:before-step":a=>(a.state?.paths??[]).length>0,"head:branch":a=>(a.git?.branches??[]).length>0,"head:commit":a=>Xo(a).length>0,"attr:branch.note":a=>(a.git?.branches??[]).some(o=>o.note!==void 0),"attr:commit.hash":a=>Xo(a).some(o=>o.hash!==void 0),"attr:commit.note":a=>Xo(a).some(o=>o.note!==void 0),"git:from":a=>os(a).some(o=>o.type==="branch"),"git:copy":a=>Xo(a).some(o=>o.copy!==void 0),"git:merge":a=>Xo(a).some(o=>o.merge!==void 0)},G3=ui.flatMap(a=>{const o=qa(ca(a,"ja"));return o.ok?[{key:a,diagram:o.diagram}]:[]}),Y3=a=>G3.filter(({diagram:o})=>a.kinds.includes(o.kind)&&a.words.some(u=>L3[u]?.(o)===!0)).map(({key:o,diagram:u})=>({key:o,kind:u.kind})),Og=a=>{const[o,u=""]=a.split(":");return o==="attr"?`[${u.split(".")[1]??u}: …]`:a==="edge:before-step"?"->":u};function F3({lang:a}){const o=tt[a],u=o.site.catalog,r=f=>b.jsxs("header",{className:"catalog-section-head",children:[b.jsx("h2",{className:"catalog-section-title",children:u.sections[f].title}),b.jsx("p",{className:"catalog-section-lead",children:u.sections[f].lead})]});return b.jsxs("div",{className:"catalog-page","data-catalog":"index",children:[b.jsxs("div",{className:"catalog-hero",children:[b.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":u.crumb,children:[b.jsx("a",{href:ct.home,onClick:f=>dt(f),children:o.site.nav.home}),b.jsx("span",{"aria-hidden":"true",children:"›"}),b.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:o.site.screens.catalog.title})]}),b.jsx("h1",{className:"catalog-title",children:o.site.screens.catalog.title}),b.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:u.lead(Wo.length,rn.length,ui.length)})]}),b.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"parts",children:[r("parts"),b.jsx("div",{className:"catalog-part-grid",children:Wo.filter(Yu).map(f=>b.jsx(Fu,{part:f,lang:a},f.id))})]}),b.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"kind-parts",children:[r("kind-parts"),b.jsx("div",{className:"catalog-part-grid",children:Wo.filter(f=>!Yu(f)).map(f=>b.jsx(Fu,{part:f,lang:a},f.id))})]}),b.jsxs("section",{className:"catalog-section","data-catalog":"section","data-section":"kinds",children:[r("kinds"),b.jsx("div",{className:"catalog-index-grid",children:rn.map((f,i)=>b.jsxs("a",{className:"catalog-index-card","data-catalog":"card",href:`${ct.catalog}/${f}`,onClick:d=>dt(d),children:[b.jsxs("div",{className:"catalog-index-card-top",children:[b.jsxs("div",{className:"catalog-index-card-head",children:[b.jsx("span",{className:"catalog-index-card-no","data-catalog":"card-no",children:String(i+1).padStart(2,"0")}),b.jsx("span",{className:"catalog-index-card-count","data-catalog":"card-count",children:u.count(Ng(f).length)})]}),b.jsx("h2",{className:"catalog-index-card-title",children:o.shelf.kinds[f]}),b.jsx("p",{className:"catalog-index-card-desc","data-catalog":"card-desc",children:u.kinds[f]})]}),b.jsx("span",{className:"catalog-index-card-link","data-catalog":"card-open",children:u.open})]},f))})]})]})}function Fu({part:a,lang:o,name:u="part-card"}){const r=tt[o],f=r.site.catalog;return b.jsxs("a",{className:"catalog-part-card","data-catalog":u,"data-part":a.id,href:`${ct.catalog}/part/${a.id}`,onClick:i=>dt(i),children:[b.jsxs("span",{className:"catalog-part-card-head",children:[b.jsx("span",{className:"catalog-part-card-name",children:f.parts[a.id].name}),!Yu(a)&&b.jsx("span",{className:"catalog-part-card-kind",children:f.kindOnly(a.kinds.map(i=>r.shelf.kinds[i]).join("、"))})]}),b.jsx("span",{className:"catalog-part-card-words",children:a.words.map(i=>b.jsx("code",{children:Og(i)},i))})]})}const X3=11,V3=1.5,Jl=1.2,Ps=[.25,4];function Q3(a,o,u,r=X3){if(a.width<=0||a.height<=0||o.width<=0||o.height<=0)return 1;const f=Math.min(a.width/o.width,a.height/o.height),i=u>0?r/u:0;return Math.min(V3,Math.max(i,f))}const Zl=(a,o)=>Math.min(Ps[1],Math.max(Ps[0],a*o)),Vo=a=>Number.parseFloat(a)||0;function ud(a,o,{palette:u,theme:r,lang:f,onStep:i,fitHeight:d=!1,onPlayer:h}){const[m,p]=Ae.useState(null),y=Ae.useRef(i),w=Ae.useRef(h);return Ae.useEffect(()=>{y.current=i,w.current=h}),Ae.useEffect(()=>{const _=a.current;if(!_||!o)return;const v=Tg(_,o,{palette:u,theme:r,lang:f,onStep:O=>y.current(O),fitHeight:d});w.current?.(v);const $=_.querySelector(".dg-frame"),j=()=>{const O=_.querySelector('svg[data-dragon="figure"]');if(!$||!O||O.dataset.view!=="fixed"){p(null);return}if($.clientWidth===0)return;const T=getComputedStyle($),C={width:$.clientWidth-Vo(T.paddingLeft)-Vo(T.paddingRight),height:$.clientHeight-Vo(T.paddingTop)-Vo(T.paddingBottom)},H=O.viewBox.baseVal,ue=O.querySelector(".dg-sn"),Z=ue?Vo(getComputedStyle(ue).fontSize):0,ie=d?og:void 0;p({width:H.width,scale:Q3(C,{width:H.width,height:H.height},Z,ie)})},N=new ResizeObserver(j);return $&&N.observe($),()=>{N.disconnect(),v.destroy(),w.current?.(null)}},[a,o,u,r,f,d]),m}const Cg="(max-width: 439px)";function J3(a){const o=matchMedia(Cg);return o.addEventListener("change",a),()=>o.removeEventListener("change",a)}const Z3=()=>matchMedia(Cg).matches;function jg(){return Ae.useSyncExternalStore(J3,Z3)}const Ul="site";function Bg(a){const o=qa(a);if(!o.ok)return null;const u=ii(o.diagram);return u.ok?u.diagram:null}function K3(a){const o=decodeURIComponent(location.hash.slice(1));return a.find(u=>u===o)??null}function P3(a,o,u){const r=u.trim().toLowerCase();if(r==="")return!0;const f=Ra(a,o);return[f?.title??"",f?.about??"",a].some(i=>i.toLowerCase().includes(r))}function W3({kind:a,lang:o,theme:u,palette:r}){const f=tt[o],i=f.site.catalog,d=Ng(a),[h,m]=Ae.useState(""),[p,y]=Ae.useState(()=>K3(d)),[w,_]=Ae.useState("figure"),[v,$]=Ae.useState("notation"),[j,N]=Ae.useState(null),[O,T]=Ae.useState(!1),C=j?.site===r?j.palette:Ul,H=C===Ul?r:C,ue=d.filter(U=>P3(U,o,h)),Z=p!==null&&d.includes(p)?p:d[0],ie=f.shelf.kinds[a];return b.jsxs("div",{className:"catalog-page","data-catalog":"category",children:[b.jsxs("div",{className:"catalog-hero",children:[b.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":i.crumb,children:[b.jsx("a",{href:ct.home,onClick:U=>dt(U),children:f.site.nav.home}),b.jsx("span",{"aria-hidden":"true",children:"›"}),b.jsx("a",{href:ct.catalog,onClick:U=>dt(U),children:f.site.screens.catalog.title}),b.jsx("span",{"aria-hidden":"true",children:"›"}),b.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:ie})]}),b.jsx("h1",{className:"catalog-title",children:ie}),b.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:i.kinds[a]}),b.jsxs("div",{className:"catalog-meta",children:[b.jsx("span",{className:"catalog-count","data-catalog":"count",children:i.total(d.length)}),ue.length!==d.length&&b.jsx("span",{className:"catalog-count catalog-count-filter",children:i.showing(ue.length)})]})]}),b.jsxs("div",{className:"catalog-body",children:[b.jsxs("aside",{className:"catalog-sidebar","data-catalog":"sidebar","aria-label":i.list,children:[b.jsxs("div",{className:"catalog-search-wrap",children:[b.jsx("span",{className:"catalog-search-icon","aria-hidden":"true"}),b.jsx("input",{type:"text",className:"catalog-search","data-catalog":"search",placeholder:i.search,"aria-label":i.searchLabel,value:h,onChange:U=>m(U.target.value)}),h!==""&&b.jsx("button",{type:"button",className:"catalog-search-clear","data-catalog":"search-clear","aria-label":i.clearSearch,onClick:()=>m(""),children:"×"})]}),b.jsx("div",{className:"catalog-list",role:"list",children:ue.length===0?b.jsx("p",{className:"catalog-list-empty","data-catalog":"empty",children:i.nothing}):ue.map(U=>b.jsx("button",{type:"button",role:"listitem",className:"catalog-list-item","data-catalog":"item","aria-current":U===Z?"true":void 0,onClick:()=>y(U),children:Ra(U,o)?.title??U},U))})]}),b.jsx("section",{className:"catalog-preview","data-catalog":"preview","aria-label":i.preview,children:Z!==void 0&&b.jsx(I3,{sample:Z,lang:o,theme:u,palette:H,choice:C,onChoice:U=>N(U===Ul?null:{site:r,palette:U}),view:w,onView:_,source:v,onSource:$,onExpand:()=>T(!0)},Z)})]}),b.jsxs("section",{className:"catalog-section catalog-uses","data-catalog":"uses","aria-label":i.uses,children:[b.jsxs("header",{className:"catalog-section-head",children:[b.jsx("h2",{className:"catalog-section-title",children:i.uses}),b.jsx("p",{className:"catalog-section-lead",children:i.usesLead})]}),b.jsx("div",{className:"catalog-part-grid",children:R3(a).map(U=>b.jsx(Fu,{part:U,lang:o,name:"uses-part"},U.id))})]}),O&&Z!==void 0&&b.jsx(e2,{sample:Z,lang:o,theme:u,palette:H,onClose:()=>T(!1)})]})}function I3({sample:a,lang:o,theme:u,palette:r,choice:f,onChoice:i,view:d,onView:h,source:m,onSource:p,onExpand:y}){const w=tt[o],_=w.site.catalog,v=ca(a,o),$=Ra(a,o),j=$?.title??a,N=Ae.useMemo(()=>Bg(v),[v]),O=Ae.useRef(null),[T,C]=Ae.useState(0),[H,ue]=Ae.useState(1),[Z,ie]=Ae.useState(!1),U=jg(),fe=ud(O,N,{palette:r,theme:u,lang:o,onStep:C});Ae.useEffect(()=>{if(!Z)return;const P=window.setTimeout(()=>ie(!1),1600);return()=>window.clearTimeout(P)},[Z]);const re=N?.steps.length??0,Ee=N?.steps[Math.min(T,re-1)],R=re>1&&Ee!==void 0,ge=fe?Zl(fe.scale,H):null,we=fe!==null&&d==="figure",ke=ge===null||!we?"—":`${Math.round(ge*100)}%`,E=P=>{fe&&ue(Zl(fe.scale,H*P)/fe.scale)},z=m==="notation"?v:N?JSON.stringify(N,null,2):"",K=()=>{navigator.clipboard?.writeText(z).then(()=>ie(!0),()=>{})};return b.jsxs("article",{className:"catalog-preview-card",children:[b.jsxs("header",{className:"catalog-preview-head",children:[b.jsx("h2",{className:"catalog-preview-title",children:j}),$?.about&&b.jsx("p",{className:"catalog-preview-sub","data-catalog":"about",children:$.about})]}),b.jsxs("div",{className:"catalog-preview-tabs",children:[b.jsx("div",{className:"catalog-tablist",role:"tablist","aria-label":_.views,children:["figure","code"].map(P=>b.jsx("button",{type:"button",role:"tab",className:"catalog-preview-tab","data-catalog":`tab-${P}`,"aria-selected":d===P,onClick:()=>h(P),children:P==="figure"?_.figure:_.code},P))}),b.jsxs("div",{className:"catalog-preview-actions",children:[b.jsxs("label",{className:"catalog-option",children:[b.jsx("span",{className:"catalog-option-label",children:w.palette}),b.jsx("span",{className:"catalog-select-field",children:b.jsxs("select",{className:"catalog-select","data-catalog":"palette",value:f,onChange:P=>i(P.target.value),children:[b.jsx("option",{value:Ul,children:_.sameAsSite}),Object.values(la).map(P=>b.jsx("option",{value:P.id,children:w.paletteNames[P.id]??P.name},P.id))]})})]}),b.jsxs("div",{className:"catalog-zoom",role:"group","aria-label":w.stage.zoom,children:[b.jsx(ju,{name:"zoom-out",icon:"zoom-out",label:w.stage.zoomOut,disabled:!we||ge===Ps[0],onClick:()=>E(1/Jl)}),U?b.jsx("button",{type:"button",className:"catalog-zoom-btn catalog-zoom-fit","data-catalog":"zoom-level","aria-label":`${w.stage.fit} (${ke})`,title:w.stage.fit,disabled:!we,onClick:()=>ue(1),children:ke}):b.jsx("span",{className:"catalog-zoom-value","data-catalog":"zoom-level",children:ke}),b.jsx(ju,{name:"zoom-in",icon:"zoom-in",label:w.stage.zoomIn,disabled:!we||ge===Ps[1],onClick:()=>E(Jl)}),!U&&b.jsx(ju,{name:"fit",icon:"fit",label:w.stage.fit,disabled:!we,onClick:()=>ue(1)})]}),b.jsxs("button",{type:"button",className:"catalog-expand-btn","data-catalog":"expand","aria-label":_.expandLabel(j),onClick:y,children:[b.jsx("span",{className:"pg-icon","data-icon":"fullscreen","aria-hidden":"true"}),b.jsx("span",{children:_.expand})]})]})]}),b.jsxs("div",{className:"catalog-preview-stage pg-figure","data-catalog":"stage","data-phased":R?"on":void 0,hidden:d!=="figure",style:fe&&ge!==null?{"--fig-w":`${fe.width*ge}px`}:void 0,children:[R&&b.jsxs("p",{className:"pg-phase","data-catalog":"phase-badge",children:[b.jsx("span",{className:"pg-phase-dot","aria-hidden":"true"}),w.stage.phase(T+1,re,Ee.title)]}),b.jsx("div",{className:"pg-player",ref:O})]}),d==="figure"&&(R||Ee?.body)&&b.jsxs("div",{className:"catalog-preview-note",children:[R&&b.jsx("div",{className:"pg-progress","data-catalog":"progress","aria-hidden":"true",children:N?.steps.map((P,he)=>b.jsx("span",{className:"pg-progress-seg","data-catalog":"progress-seg","data-done":he<=T},`${he}-${P.title}`))}),Ee?.body&&b.jsx("p",{className:"catalog-step-note","data-catalog":"step-note",children:Ee.body})]}),b.jsxs("div",{className:"catalog-source","data-catalog":"source",role:"region",hidden:d!=="code","aria-label":_.source,children:[b.jsxs("div",{className:"catalog-source-bar",children:[b.jsx("div",{className:"catalog-source-tabs",role:"group",children:["notation","json"].map(P=>b.jsx("button",{type:"button",className:"catalog-source-tab","data-catalog":`source-${P}`,"aria-pressed":m===P,onClick:()=>p(P),children:P==="notation"?w.notation:"JSON"},P))}),b.jsxs("button",{type:"button",className:"catalog-source-copy","data-catalog":"copy",onClick:K,children:[b.jsx("span",{className:"catalog-copy-icon","aria-hidden":"true"}),b.jsx("span",{"aria-live":"polite",children:Z?_.copied:_.copy})]})]}),b.jsx("pre",{className:"catalog-source-code","data-catalog":"source-code",children:b.jsx("code",{children:z})})]}),b.jsx("footer",{className:"catalog-preview-foot",children:b.jsx("a",{className:"catalog-preview-link","data-catalog":"open-editor",href:`${ct.editor}${ld(v)}`,onClick:P=>dt(P),children:_.openEditor})})]})}function ju({name:a,icon:o,label:u,disabled:r,onClick:f}){return b.jsx("button",{type:"button",className:"catalog-zoom-btn","data-catalog":a,"aria-label":u,title:u,disabled:r,onClick:f,children:b.jsx("span",{className:"pg-icon","data-icon":o,"aria-hidden":"true"})})}function e2({sample:a,lang:o,theme:u,palette:r,onClose:f}){const i=tt[o],d=ca(a,o),h=Ra(a,o),m=Ae.useMemo(()=>Bg(d),[d]),p=Ae.useRef(null),y=Ae.useRef(null),w=ud(p,m,{palette:r,theme:u,lang:o,onStep:()=>{},fitHeight:!0}),_=Ae.useRef(f);return Ae.useEffect(()=>{_.current=f}),Ae.useEffect(()=>{const v=document.activeElement instanceof HTMLElement?document.activeElement:null;y.current?.focus();const $=N=>{N.key==="Escape"&&_.current()};addEventListener("keydown",$);const j=document.body.style.overflow;return document.body.style.overflow="hidden",()=>{removeEventListener("keydown",$),document.body.style.overflow=j,v?.focus()}},[]),b.jsx("div",{className:"catalog-overlay","data-catalog":"overlay",role:"dialog","aria-modal":"true","aria-labelledby":"catalog-overlay-title",onClick:v=>{v.target===v.currentTarget&&f()},children:b.jsxs("div",{className:"catalog-overlay-card",children:[b.jsxs("div",{className:"catalog-overlay-head",children:[b.jsxs("div",{children:[b.jsx("h2",{className:"catalog-overlay-title",id:"catalog-overlay-title","data-catalog":"overlay-title",children:h?.title??a}),h?.about&&b.jsx("p",{className:"catalog-overlay-desc",children:h.about})]}),b.jsx("button",{ref:y,type:"button",className:"catalog-overlay-close","data-catalog":"overlay-close","aria-label":i.site.catalog.close,onClick:f,children:"×"})]}),b.jsx("div",{className:"catalog-overlay-stage pg-figure",style:w?{"--fig-w":`${w.width*w.scale}px`}:void 0,children:b.jsx("div",{className:"pg-player",ref:p})})]})})}function t2(a){let o;try{o=JSON.parse(a)}catch{return null}const u=ii(o);return u.ok?u.diagram:null}function n2(a){const o=qa(a);return o.ok?o.diagram:null}function cr({notation:a,lang:o,theme:u,palette:r,whole:f=!1,json:i=!1,onStep:d,className:h}){const m=Ae.useRef(null),p=Ae.useMemo(()=>{const w=i?t2(a):n2(a);return w?f?{...w,view:"fixed"}:w:null},[a,f,i]),y=Ae.useRef(d);return Ae.useEffect(()=>{y.current=d}),Ae.useEffect(()=>{const w=m.current;if(!w||!p)return;const _=Tg(w,p,{palette:r,theme:u,lang:o,onStep:v=>y.current?.(v)});return()=>_.destroy()},[p,r,u,o]),b.jsx("div",{ref:m,className:h})}function a2({part:a,lang:o,theme:u,palette:r}){const f=tt[o],i=f.site.catalog,d=i.parts[a.id];return b.jsxs("div",{className:"catalog-page","data-catalog":"part",children:[b.jsxs("div",{className:"catalog-hero",children:[b.jsxs("nav",{className:"catalog-crumb","data-catalog":"crumb","aria-label":i.crumb,children:[b.jsx("a",{href:ct.home,onClick:h=>dt(h),children:f.site.nav.home}),b.jsx("span",{"aria-hidden":"true",children:"›"}),b.jsx("a",{href:ct.catalog,onClick:h=>dt(h),children:f.site.screens.catalog.title}),b.jsx("span",{"aria-hidden":"true",children:"›"}),b.jsx("span",{className:"catalog-crumb-here","aria-current":"page",children:d.name})]}),b.jsx("h1",{className:"catalog-title",children:d.name}),b.jsx("p",{className:"catalog-desc","data-catalog":"desc",children:d.desc}),b.jsxs("dl",{className:"catalog-part-facts",children:[b.jsxs("div",{className:"catalog-part-fact",children:[b.jsx("dt",{children:i.partKinds}),b.jsx("dd",{className:"catalog-part-kinds","data-catalog":"part-kinds",children:a.kinds.map(h=>b.jsx("a",{href:`${ct.catalog}/${h}`,onClick:m=>dt(m),children:f.shelf.kinds[h]},h))})]}),b.jsxs("div",{className:"catalog-part-fact",children:[b.jsx("dt",{children:i.words}),b.jsx("dd",{className:"catalog-part-words","data-catalog":"part-words",children:a.words.map(h=>b.jsx("code",{children:Og(h)},h))})]})]})]}),b.jsx("div",{className:"catalog-part-figures","data-count":a.kinds.length,children:a.kinds.map(h=>b.jsx(o2,{part:a,kind:h,lang:o,theme:u,palette:r},h))}),a.id==="icon"&&b.jsx(s2,{lang:o}),b.jsxs("section",{className:"catalog-section","data-catalog":"part-samples","aria-label":i.partSamples,children:[b.jsxs("header",{className:"catalog-section-head",children:[b.jsx("h2",{className:"catalog-section-title",children:i.partSamples}),b.jsx("p",{className:"catalog-section-lead",children:i.partSamplesLead})]}),b.jsx("div",{className:"catalog-part-grid",children:Y3(a).map(({key:h,kind:m})=>b.jsxs("a",{className:"catalog-part-card","data-catalog":"part-sample","data-sample":h,href:`${ct.catalog}/${m}#${h}`,onClick:p=>dt(p),children:[b.jsxs("span",{className:"catalog-part-card-head",children:[b.jsx("span",{className:"catalog-part-card-name",children:Ra(h,o)?.title??h}),b.jsx("span",{className:"catalog-part-card-kind",children:f.shelf.kinds[m]})]}),b.jsx("span",{className:"catalog-part-sample-about",children:Ra(h,o)?.about})]},h))})]})]})}function s2({lang:a}){const o=tt[a].site.catalog,u=Object.keys(rs).sort();return b.jsxs("section",{className:"catalog-section","data-catalog":"part-icons","aria-label":o.partIcons,children:[b.jsxs("header",{className:"catalog-section-head",children:[b.jsx("h2",{className:"catalog-section-title",children:o.partIcons}),b.jsx("p",{className:"catalog-section-lead",children:o.partIconsLead(u.length)})]}),b.jsx("ul",{className:"catalog-icon-grid",children:u.map(r=>b.jsxs("li",{className:"catalog-icon","data-icon":r,children:[b.jsx("span",{className:"catalog-icon-chip",dangerouslySetInnerHTML:{__html:Cv(r)??""}}),b.jsx("code",{className:"catalog-icon-name",children:r})]},r))})]})}function o2({part:a,kind:o,lang:u,theme:r,palette:f}){const i=tt[u],d=i.site.catalog,h=H3(a.id,o,u);return b.jsxs("section",{className:"catalog-part-figure","data-catalog":"part-figure","data-kind":o,"aria-label":i.shelf.kinds[o],children:[b.jsx("h2",{className:"catalog-part-figure-title",children:i.shelf.kinds[o]}),b.jsx(cr,{className:"catalog-part-stage",notation:h,lang:u,theme:r,palette:f,whole:!0}),b.jsx("pre",{className:"catalog-part-source","data-catalog":"part-source","aria-label":d.source,children:b.jsx("code",{children:h})}),b.jsx("a",{className:"catalog-preview-link catalog-part-open","data-catalog":"part-open-editor",href:`${ct.editor}${ld(h)}`,onClick:m=>dt(m),children:d.openEditor})]})}const i2=`sequence 注文を受ける

box 客 [note: 注文する人, color: slate, icon: user]
box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 台帳 [note: 注文を残す, color: green, icon: db]

step 注文を送る
  say 客が店のアプリに注文を送り、店のアプリが台帳に残す。
  客 -> 店: 注文する
  店 -> 台帳: 残す
`,l2=`sequence Take an order

box customer as Customer [note: places the order, color: slate, icon: user]
box shop as Shop app [note: takes the order, color: blue, icon: app]
box ledger as Ledger [note: keeps the order, color: green, icon: db]

step Send the order
  say The customer sends an order to the shop app, and the shop app keeps it in the ledger.
  customer -> shop: place order
  shop -> ledger: keep
`,r2=`sequence 運ばれる物を見分ける

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
`,c2=`sequence Tell what travels

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
`,u2=`sequence 在庫を確かめる

box 店 as 店のアプリ [note: 注文を受ける, color: blue, icon: app]
box 倉庫 [note: 在庫を持つ, color: amber, icon: box]

step 在庫を聞く
  say 店のアプリが倉庫に在庫を聞き、倉庫は棚を数えてから答える。
  店 -> 倉庫: 在庫はあるか
  act 倉庫: 棚を数える
  倉庫 -> 店: 3 個ある
`,d2=`sequence Check the stock

box shop as Shop app [note: takes the order, color: blue, icon: app]
box warehouse as Warehouse [note: holds the stock, color: amber, icon: box]

step Ask for stock
  say The shop app asks the warehouse for stock, and the warehouse counts the shelf before it answers.
  shop -> warehouse: in stock?
  act warehouse: count the shelf
  warehouse -> shop: 3 left
`,f2=`git fix は merge commit で、feature は当て直して取り込む

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
`,h2=`git Merge fix with a merge commit and replay feature

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
`,p2=`{
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
`,m2=`{
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
`,g2=`architecture 店と倉庫をつなぐ

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
`,y2=`architecture Connect the shop and the warehouse

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
`,b2=`architecture 注文を倉庫へ回す

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
`,v2=`architecture Pass orders to the warehouse

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
`,x2=`sequence ログインを頼む

box ブラウザ as 利用者のブラウザ [note: 利用者が操作する]
box アプリ [note: ログインを頼む側]

step ログインを押す
  say 利用者がアプリのログインを押す。
  ブラウザ -> アプリ: GET /login
`,w2=`sequence Ask to sign in

box browser as User's browser [note: operated by the user]
box app as App [note: asks for sign-in]

step Press sign in
  say The user presses the app's sign-in button.
  browser -> app: GET /login
`,S2=`state 注文が届くまでの状態

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
`,A2=`state States of an order until it arrives

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
`,E2=`sequence 代金を払う

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
`,_2=`sequence Pay for the order

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
`,k2=`sequence 注文の状態を追う

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
`,D2=`sequence Follow the order

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
`,dd=`v${"0.41.0".split(".").slice(0,2).join(".")}`,T2=["start","rules","boxes","edges","regions","state","git","steps","strip","carry","json","place","export","migrate"],N2=["start","boxes","regions","steps","json","export"],M2={start:{screen:"editor"},rules:{section:"boxes"},boxes:{section:"edges"},edges:{section:"regions"},regions:{kind:"architecture"},state:{kind:"state"},git:{kind:"git"},steps:{section:"strip"},strip:{kind:"sequence"},carry:{section:"json"},json:{screen:"editor"},place:{section:"export"},export:{screen:"editor"},migrate:{screen:"editor"}},$2={place:[['import "@cardenelabs/dragon/fonts";','import { mountDiagram, parseNotation } from "@cardenelabs/dragon";',"",'const source = await (await fetch("login.dragon")).text();',"const parsed = parseNotation(source);",'if (!parsed.ok) throw new Error(parsed.errors.map((e) => `${e.line}: ${e.message}`).join("\\n"));',"",'const host = document.getElementById("figure");','if (host === null) throw new Error("#figure not found");',"const player = mountDiagram(host, parsed.diagram);"].join(`
`),null,null],export:["npm install @cardenelabs/dragon",`pnpm add -D playwright-core
pnpm exec playwright-core install chromium`,"dragon export login.dragon --out out"]},Ll={ja:{eyebrow:a=>`使い方の案内 · ${a}`,lead:"dragon記法の書き方を 1 枚にまとめた読み物。最初の 5 分で図を動かし、決まり 4 つを押さえてから、箱、線、区画、状態遷移図、枝分かれの図、段、帯、運ぶ物の順に記法の要素を掴む。JSON との行き来と、mp4 や GIF への書き出しと、前の形から書き直す対応表もここで扱う。",start:"5 分で始める →",browse:"カタログで図を見る",iconLink:"使える絵柄を部品「絵」の頁で全て見る →",sections:{start:{title:"5 分で動かす",text:["何も入れずに試すなら、編集画面を開く。左の欄に記法を書くと、右にその場で動く図が出る。","記法は行の頭の語で、その行に何を書くかが決まる。最初の行に図の種類と題を書き、`sequence` なら時間の順に箱どうしのやり取りを、`architecture` なら区画に置いた箱のつながりを描く。","次に登場する箱を `box` の行で並べ、`step` の行の下に字下げして、その段で起きることを起きる順に書く。下の例は箱 2 つと段 1 つの、いちばん小さな図になる。"],exit:"編集画面で書いてみる →"},rules:{title:"決まり",text:["dragon記法は、どの行も次の決まり 4 つに従う。決まりを押さえておけば、初めて見る行も形から読める。",'下の例は 4 つの決まりを全部使う。区画を `group` と `end` で囲み、`,` を含む札の値を `"` で囲み、長い本文を `say` の下に字下げして続けている。'],exit:"続き → 箱"},boxes:{title:"箱",text:["箱は `box <名札> as <名前> [note: <下の字>]` で宣言する。名札は線や処理で箱を指す時の呼び名で、図には名前と下の字が出る。`as <名前>` を省くと、名札がそのまま名前になる。",'`[ ]` の中に `color: <色>` を足すと箱の色の役が、`icon: <印>` を足すと名前の横の印が付き、2 つ以上は `,` で区切る。色は `blue` や `green` のような色の役の名前で、印は `user` や `db` のような名前で選ぶ。名前に `[` を、値に `,` か `]` を含める時は `"` で囲む。',"箱は宣言した順に並ぶ。時系列図では箱ごとに縦の線が左から右へ立ち、線はその間を走る。"],exit:"続き → 線"},edges:{title:"線",text:["線は `<名札> -> <名札>: <線の名前>` で書き、段の中に書いた順に走る。名前は省ける。","`act <名札>: <処理の名前>` は、線を引かずに箱の中で行う処理を表す。受け取った物を確かめる、数を数える、のような箱の中だけで済む動きに使う。","線の名前の置き場所は自動で決まる。崩れた時だけ、線の行の終わりに `[side: above]` か `below`、`left`、`right` を足して置く側を指す。"],exit:"続き → 区画"},regions:{title:"区画",text:["構成図では、箱を区画に分けて置ける。区画は `group <名札> as <名前> [note: <添え書き>]` の行で開いて `end` の行で閉じ、その間に書いた `box` の行の箱が区画の中に置かれる。","区画も `color:` と `icon:` を持てる。仕組みの持ち主や置き場所の境目 (チェーンと網、店と倉庫) を見せる時に使う。","同じ区画の箱が離れて並ぶ時は、同じ `group <名札>` をもう一度開いて続きの箱を書く。2 度目は名札だけを書き、名前と札は最初の 1 度だけ書く。"],exit:"構成図の見本を見る →"},state:{title:"状態遷移図",text:["1 つの物が状態を移る様子を段ごとに追う時は、最初の行を `state <題>` にする。箱が状態になり、線は状態から状態への移り変わりになる。札が乗っている状態は光り、札が出た状態には済んだ印が残る。","線の送る側に `start` を書くと始まりの印から出る線に、受ける側に `finish` を書くと終わりの印へ入る線になる。`start` と `finish` は箱の名札に使えない。","最初の `step` の行より前に書いた線は、移れるが今回は通らない道として点線で引き、運ぶ物を走らせない。どの段も辿り着かない状態 (例のキャンセル) は、図の右上の脇道の囲みに入る。"],exit:"状態遷移図の見本を見る →"},git:{title:"枝分かれの図",text:["git の枝に commit を積み、取り込むまでを段ごとに追う時は、最初の行を `git <題>` にする。枝は `branch <枝> [note: <添え書き>]` の行で上から順に宣言し、枝ごとに帯が並ぶ。箱は無くてもよい。","段の中では `commit <名札> on <枝>` で枝の先に commit を積み、`[hash: <hash>, note: <一言>]` で丸の外に hash と一言を添える。`copy <元>` を付けると元の commit を写した当て直しの commit に、`merge <枝>` を付けるとその枝の先端も親に持つ merge commit になる。","`<枝> from <commit>` でその commit から枝を切る。`<札> -> <commit>` は commit を作らずに枝の札か `HEAD` を動かし、`HEAD` を動かすと枝から離れる。どの札からも辿れなくなった commit (例の C) は点線の丸に変わる。"],exit:"枝分かれの図の見本を見る →"},steps:{title:"段",text:["段は `step <見出し>` の行で区切り、図はこの単位で 1 段ずつ進む。段の中の行は字下げして書き、その段で起きることを語る `say` の行を必ず書く。本文を 2 行以上に分ける時は、`say` だけの行の下に、さらに深く字下げして続ける。","例の `code pay(1200)` の行のように、`code` の行はその段で打つ命令になる。1 つの段に 1 行まで書ける。","`note <名札>: <字>` は、その段から箱の下の字を書き換える。残高や状態のように、段を追って替わる値を箱の上で見せる。","見せ方は最初の行の終わりに `[view: fixed]` か `[view: follow]` を足して選ぶ。`fixed` は全体を止めて中だけを動かし、`follow` は今動いている所へ寄って動かす。書かなければ、全体を枠に収めた時の字の大きさで決まる。"],exit:"続き → 帯"},strip:{title:"帯",text:["帯は図に添える中身の表で、段を追って替わる値を見せる。`strip <題>: <欄>, <欄>` で欄を宣言する。","段の中で `set <欄>: <値>` と書くとその欄に値が入り、`set <欄> [tag: <札>]` と書くとその欄に札が付く。","認可コードや注文の状態のように、やり取りの間に持ち物が替わる様子を、線とは別に追える。"],exit:"時系列図の見本を見る →"},carry:{title:"運ぶ物",text:["線の上には、何が運ばれたかを示す物が走る。何も書かなければ封筒が走る。","線の行の終わりに `[tag: <値>]` を足すと字を書いた札を、`[carry: coin]` を足すと硬貨を走らせる。番号や証明のような値が動く線には札を、代金やトークンのように価値が動く線には硬貨を使う。","`[carry: none]` は何も走らせない。知らせるだけで物が動かない線に使う。"],exit:"続き → JSON"},json:{title:"JSON",text:["記法と JSON は行き来できる。人は記法で書き、道具や AI は JSON (原本) で持つ。下の例は 5 分で動かすの節の図を JSON で書いた物で、図はその JSON をそのまま読んで描いている。","JSON は `version` に形式の版を持ち、古い版は読む時に今の形へ直す。形は package の `src/schemas/diagram.schema.json` が持つ。","`parseNotation` は記法を JSON に、`printNotation` は JSON を記法に直し、`readDiagram` は JSON を確かめて読む。JSON から記法へ書き戻すと決まった並べ方に整うので、書き手の行の並べ方と `//` で始まる注釈の行は残らない。"],exit:"編集画面で JSON を取り込む →"},place:{title:"頁に置く",text:["自分の頁に図を置く時は、頁で 1 度だけ字の入口 `@cardenelabs/dragon/fonts` を import し、記法を読んだ原本を `mountDiagram` に渡す。下の例は package の README と同じ物。","字の入口は、同梱の 2 つの字 (Noto Sans JP と JetBrains Mono) の CSS を読み込むだけで、何も出さない。図は同梱の字で測った字の幅で組むため、読み込まないと端末の字で描かれ、札から字がはみ出すことがある。CSS と字の file は、束ねる道具 (Vite など) が頁へ運ぶ。","`mountDiagram` が返す `player` で段を動かす (`next`、`prev`、`play`、`pause`、`destroy`)。3 つめの引数には、色味や段が替わった時に呼ぶ関数などの設定 (`PlayerOptions`) を渡す。"],exit:"続き → 書き出し"},export:{title:"書き出し",text:["同じ原本から、mp4、GIF、HTML、PNG を書き出せる。package を入れると `dragon` の命令が使える。","書き出しは画面なしの Chromium で、頁と同じ描画を 1 コマずつ撮る。Chromium を動かす `playwright-core` は、書き出しを使う時だけ入れる。","原本の JSON (`.json`) か記法 (`.dragon`) を渡すと、同じ名前の 4 つの file を書き出す。PNG は最後の段の止め絵になる。"],exit:"編集画面から書き出す →"},migrate:{title:"前の形から書き直す",text:["前の形の記法 (`時系列図` か `構成図` で始まり、段を `#` で区切る形) は読めなくなった。前の形の行を読むと、その行の新しい形を示す誤りで止まる。","前の形を新しい形へ移す命令は無いので、下の表を見て行ごとに書き直す。左が前の形、右が新しい形になる。"],exit:"編集画面で書き直す →"}},cards:{start:"導入なし。編集画面を開いて書くだけで図が動く。",boxes:"名前と下の字と色と印で、登場する物を描く。",regions:"構成図の箱を、持ち主ごとの区画に分けて置く。",steps:"図は段ごとに進み、本文がその段の動きを語る。",json:"人は記法で、道具は JSON で、同じ図を持つ。",export:"同じ図を mp4、GIF、HTML、PNG に書き出す。"},options:{head:["設定","意味"],rows:(a,o)=>[["--out <dir>","書き出す先。無ければ作る (既定は今の dir)"],["--width <px>","枠の幅。見せ方 (`fixed` / `follow`) を選び、`follow` の時の窓の幅になる"],["--palette <名前>",`色味 (${a}、既定は \`${o}\`)`],["--theme <明暗>","`light` か `dark`"],["--lang <言葉>","図の中の字と命令の文の言葉 (`ja` か `en`)。既定は `ja`"],["--fps <数>","mp4 の 1 秒のコマの数 (既定 30)"],["--gif-fps <数>","GIF の 1 秒のコマの数 (既定 10)"],["--format <形>","書き出す形を `,` で区切る (既定 `mp4,gif,html,png`)"]]},rules:["行の種類は行の頭の英語の語で決まる。矢印の行だけは箱の名札から始まる","鍵と値はコロンで区切り、属性は `[ ]` の中に `,` で並べる",'空白を含む名前と文は、行末か `[` の前に置く。`,` か `]` を含む値と、`[` を含む名前だけを `"` で囲む',"入れ子は `group … end` だけ。段は次の `step` までで、字下げは読みやすさのために付ける。`say` の続きの行だけは `say` より深く字下げする"],migration:{head:["前の形","新しい形"],rows:[["`時系列図 <題>`","`sequence <題>`"],["`構成図 <題>`","`architecture <題>`"],["`見せ方 止める`、`見せ方 寄る`","`sequence <題> [view: fixed]`、`sequence <題> [view: follow]`"],["`区画 <名札> = <名前>「<添え書き>」`","`group <名札> as <名前> [note: <添え書き>]` から `end` まで"],["箱の行の `[区画 <名札>]`","`group <名札>` と `end` の間に `box` の行を書く"],["`<名札> = <名前>「<下の字>」`","`box <名札> as <名前> [note: <下の字>]`"],["`[色 <色>]`、`[印 <印>]`","`box <名札> [color: <色>, icon: <印>]`"],["`帯 <題> = <欄>, <欄>`","`strip <題>: <欄>, <欄>`"],["`# <題>`","`step <題>`"],["`> <本文>`","`say <本文>`"],["バッククォートで囲んだ行","`code <命令>`"],["`<名札> -> <名札> : <線の名前>`","`<名札> -> <名札>: <線の名前>`"],["`[札 <値>]`、`[硬貨]`、`[なし]`","`<名札> -> <名札> [tag: <値>]`、`<名札> -> <名札> [carry: coin]`、`<名札> -> <名札> [carry: none]`"],["`[名前 上]`","`<名札> -> <名札> [side: above]`"],["`[名前 下]`","`<名札> -> <名札> [side: below]`"],["`[名前 左]`","`<名札> -> <名札> [side: left]`"],["`[名前 右]`","`<名札> -> <名札> [side: right]`"],["`<名札> : <処理の名前>`","`act <名札>: <処理の名前>`"],["`<名札>「<字>」`","`note <名札>: <字>`"],["`帯 <欄> = <値>`","`set <欄>: <値>`"],["`帯 <欄> [<札>]`","`set <欄> [tag: <札>]`"]]}},en:{eyebrow:a=>`guide • ${a}`,lead:"One page that lays out how to write dragon notation. Get a diagram moving in the first five minutes, learn the four rules, then take in the parts of the notation in order: boxes, lines, regions, state diagrams, git graphs, steps, the strip and what travels. Going between the notation and JSON, exporting to mp4 or GIF, and a table for rewriting the old form are covered here too.",start:"Start in five minutes →",browse:"Browse the catalog",iconLink:"See every icon on the Icon part page →",sections:{start:{title:"Up and running in five minutes",text:["To try it without installing anything, open the editor. Write notation in the box on the left and a moving diagram appears on the right as you type.","The first word of each line says what the line holds. The first line gives the diagram kind and title: `sequence` draws boxes exchanging messages in time order, and `architecture` draws how boxes placed in regions connect.","Then list the boxes that take part with `box` lines, and indented under a `step` line, write what happens in that step in the order it happens. The example below is the smallest diagram: two boxes and one step."],exit:"Write one in the editor →"},rules:{title:"Rules",text:["Every line of dragon notation follows the four rules below. Once you know them, you can read a line you have not seen before from its shape.",'The example below uses all four rules. It wraps the regions in `group` and `end`, wraps a tag value that contains `,` in `"`, and continues a long body indented under `say`.'],exit:"Next → Boxes"},boxes:{title:"Boxes",text:["Declare a box with `box <id> as <name> [note: <caption>]`. The id is how lines and actions point at the box, and the name and caption are what the diagram shows. Without `as <name>`, the id is the name.",'Inside the `[ ]`, add `color: <color>` to give the box a colour role and `icon: <icon>` to put an icon next to its name, separating two or more with `,`. Colours are role names such as `blue` or `green`, and icons are names such as `user` or `db`. Wrap a name in `"` when it contains `[`, and a value when it contains `,` or `]`.',"Boxes line up in the order you declare them. In a sequence diagram each box gets a vertical line from left to right, and lines run between them."],exit:"Next → Lines"},edges:{title:"Lines",text:["Write a line as `<id> -> <id>: <label>`. Lines run in the order they are written in the step, and the label can be left out.","`act <id>: <action>` is something a box does inside itself, without drawing a line. Use it for work that stays inside the box, such as checking what arrived or counting.","The label is placed automatically. Only when the placement breaks, add `[side: above]`, `below`, `left` or `right` at the end of the line to say which side it goes."],exit:"Next → Regions"},regions:{title:"Regions",text:["In an architecture diagram, boxes can be placed in regions. Open a region with a `group <id> as <name> [note: <note>]` line and close it with an `end` line, and the boxes on the `box` lines in between go inside it.","Regions can also take `color:` and `icon:`. Use them to show where ownership or placement changes, such as between chains and a network, or a shop and a warehouse.","When boxes of the same region are not next to each other, open the same `group <id>` again and write the rest of its boxes. The second time, write only the id, and give the name and attributes only the first time."],exit:"See the architecture samples →"},state:{title:"State diagrams",text:["To follow one thing as it moves between states step by step, start the first line with `state <title>`. Each box is a state, and each line is a move from one state to another. The state the tag sits on lights up, and a state the tag has left keeps a done mark.","Write `start` on the sending side for a line out of the start mark, and `finish` on the receiving side for a line into the end mark. `start` and `finish` cannot be used as box ids.","Lines written before the first `step` line are paths the diagram could take but does not take this time. They are drawn dotted, and nothing travels on them. A state that no step reaches (Cancelled in the example) goes in the side-path box at the top right."],exit:"See the state diagram samples →"},git:{title:"Git graphs",text:["To follow commits on git branches step by step until they are merged, start the first line with `git <title>`. Declare branches from top to bottom with `branch <branch> [note: <note>]` lines, and each branch gets its own band. Boxes are optional.","Inside a step, `commit <id> on <branch>` adds a commit at the tip of the branch, and `[hash: <hash>, note: <note>]` puts a hash and a short note beside the circle. Add `copy <source>` for a replayed copy of another commit, or `merge <branch>` for a merge commit whose parents include the tip of that branch.","`<branch> from <commit>` cuts a branch at that commit. `<ref> -> <commit>` moves a branch ref or `HEAD` without making a commit, and moving `HEAD` detaches it from its branch. A commit that no ref can reach any more (C in the example) turns into a dotted circle."],exit:"See the git graph samples →"},steps:{title:"Steps",text:["Steps are separated by `step <heading>` lines, and the diagram moves on one step at a time. Indent the lines inside a step, and every step needs a `say` line that tells what happens in it. To split the body over two or more lines, write `say` alone and continue on lines indented further below it.","A `code` line, like the `code pay(1200)` line in the example, is the command for that step. A step can have at most one.","`note <id>: <text>` rewrites the caption under a box from that step on. Use it to show a value that changes step by step, such as a balance or a state, right on the box.","Choose the view by adding `[view: fixed]` or `[view: follow]` at the end of the first line. `fixed` keeps the whole diagram still and moves only what is inside, and `follow` moves to where things are happening. Without it, the view is chosen by the text size when the whole diagram fits the frame."],exit:"Next → The strip"},strip:{title:"The strip",text:["The strip is a table that goes with the diagram and shows values that change step by step. Declare its fields with `strip <title>: <field>, <field>`.","Inside a step, `set <field>: <value>` puts a value in a field, and `set <field> [tag: <tag>]` puts a tag on it.","It lets you follow what is held while messages go back and forth, such as an authorization code or the state of an order, apart from the lines."],exit:"See the sequence samples →"},carry:{title:"What travels",text:["Something runs along each line to show what was carried. Without any option, an envelope travels.","Adding `[tag: <value>]` at the end of the line sends a tag with text on it, and `[carry: coin]` sends a coin. Use a tag for lines that move a value such as a number or a proof, and a coin for lines that move worth such as money or tokens.","`[carry: none]` sends nothing. Use it for lines that only tell, with nothing changing hands."],exit:"Next → JSON"},json:{title:"JSON",text:["The notation and JSON convert both ways. People write the notation, and tools and AI keep the JSON (the source). The example below is the diagram from the five-minute section written as JSON, and the diagram is drawn by reading that JSON as it is.","The JSON holds the format version in `version`, and older versions are converted to the current shape when read. The shape is defined in the package's `src/schemas/diagram.schema.json`.","`parseNotation` turns the notation into JSON, `printNotation` turns JSON back into the notation, and `readDiagram` checks and reads JSON. Writing JSON back as notation uses a fixed layout, so the writer's line order and the comment lines that start with `//` are not kept."],exit:"Import JSON in the editor →"},place:{title:"Placing on a page",text:["To place a diagram on your own page, import the font entry `@cardenelabs/dragon/fonts` once on the page, and pass the source read from the notation to `mountDiagram`. The example below is the same as in the package README.","The font entry only loads the CSS for the two bundled fonts (Noto Sans JP and JetBrains Mono) and exports nothing. Diagrams are laid out with character widths measured from the bundled fonts, so without it they are drawn in the device's fonts and text can overflow its labels. A bundler (such as Vite) carries the CSS and font files to the page.","Use the `player` returned by `mountDiagram` to move through the steps (`next`, `prev`, `play`, `pause`, `destroy`). The third argument takes settings such as the palette and a function called when the step changes (`PlayerOptions`)."],exit:"Next → Export"},export:{title:"Export",text:["The same source can be exported to mp4, GIF, HTML and PNG. Install the package and the `dragon` command is available.","Export uses a headless Chromium and captures the same drawing as the page one frame at a time. Install `playwright-core`, which runs Chromium, only when you use export.","Pass the source JSON (`.json`) or the notation (`.dragon`) and it writes four files with the same name. The PNG is a still of the last step."],exit:"Export from the editor →"},migrate:{title:"Rewriting the old form",text:["The old form of the notation (steps separated by `#`, bodies starting with `>`, and the same lines in Japanese words) is no longer read. Reading an old line stops with an error that shows the new form of that line.","There is no command that moves the old form to the new one, so rewrite each line with the table below. The left column is the old form with English words, and the right column is the new form."],exit:"Rewrite in the editor →"}},cards:{start:"Nothing to set up. Open the editor and write.",boxes:"Draw what takes part with a name, a caption, a colour and an icon.",regions:"Put the boxes of an architecture diagram in regions by owner.",steps:"The diagram moves step by step, and the body tells what each step does.",json:"People keep the notation, and tools keep the same diagram as JSON.",export:"Export the same diagram to mp4, GIF, HTML and PNG."},options:{head:["Option","Meaning"],rows:(a,o)=>[["--out <dir>","Where to write. Created if missing (default: the current dir)"],["--width <px>","Frame width. Picks the view (`fixed` / `follow`) and sets the window width for `follow`"],["--palette <name>",`Colours (${a}, default \`${o}\`)`],["--theme <mode>","`light` or `dark`"],["--lang <lang>","Language of the diagram text and command messages (`ja` or `en`). Defaults to `ja`"],["--fps <n>","Frames per second of the mp4 (default 30)"],["--gif-fps <n>","Frames per second of the GIF (default 10)"],["--format <list>","Formats to write, separated by `,` (default `mp4,gif,html,png`)"]]},rules:["The first English word of a line decides its kind. Only arrow lines start with a box id","A colon separates a key from its value, and attributes go inside `[ ]`, separated by `,`",'Names and text with spaces go at the end of the line or before `[`. Wrap only values that contain `,` or `]` and names that contain `[` in `"`',"The only nesting is `group … end`. A step runs until the next `step`, and indentation is for reading. Only the lines that continue a `say` must be indented deeper than `say`"],migration:{head:["Old form","New form"],rows:[["`sequence <title>`, `architecture <title>`","`sequence <title>`, `architecture <title>` (unchanged)"],["`view fixed`, `view follow`","`sequence <title> [view: fixed]`, `sequence <title> [view: follow]`"],['`region <id> = <name> "<note>"`',"`group <id> as <name> [note: <note>]` through `end`"],["`[region <id>]` on a box line","`box` lines between `group <id>` and `end`"],['`<id> = <name> "<caption>"`',"`box <id> as <name> [note: <caption>]`"],["`[color <color>]`, `[icon <icon>]`","`box <id> [color: <color>, icon: <icon>]`"],["`strip <title> = <field>, <field>`","`strip <title>: <field>, <field>`"],["`# <heading>`","`step <heading>`"],["`> <body>`","`say <body>`"],["A line wrapped in backticks","`code <command>`"],["`<id> -> <id> : <label>`","`<id> -> <id>: <label>`"],["`[tag <value>]`, `[coin]`, `[none]`","`<id> -> <id> [tag: <value>]`, `<id> -> <id> [carry: coin]`, `<id> -> <id> [carry: none]`"],["`[label above]`","`<id> -> <id> [side: above]`"],["`[label below]`","`<id> -> <id> [side: below]`"],["`[label left]`","`<id> -> <id> [side: left]`"],["`[label right]`","`<id> -> <id> [side: right]`"],["`<id> : <action>`","`act <id>: <action>`"],['`<id> "<text>"`',"`note <id>: <text>`"],["`strip <field> = <value>`","`set <field>: <value>`"],["`strip <field> [<tag>]`","`set <field> [tag: <tag>]`"]]}}},O2=Object.assign({"./examples/boxes.dragon":i2,"./examples/boxes.en.dragon":l2,"./examples/carry.dragon":r2,"./examples/carry.en.dragon":c2,"./examples/edges.dragon":u2,"./examples/edges.en.dragon":d2,"./examples/git.dragon":f2,"./examples/git.en.dragon":h2,"./examples/json.en.json":p2,"./examples/json.json":m2,"./examples/regions.dragon":g2,"./examples/regions.en.dragon":y2,"./examples/rules.dragon":b2,"./examples/rules.en.dragon":v2,"./examples/start.dragon":x2,"./examples/start.en.dragon":w2,"./examples/state.dragon":S2,"./examples/state.en.dragon":A2,"./examples/steps.dragon":E2,"./examples/steps.en.dragon":_2,"./examples/strip.dragon":k2,"./examples/strip.en.dragon":D2});function C2(a,o){return O2[`./examples/${a}${o==="en"?".en":""}.${a==="json"?"json":"dragon"}`]?.trimEnd()}function Qo(a){return a.split("`").map((o,u)=>b.jsx(Ae.Fragment,{children:u%2===1?b.jsx("code",{children:o}):o},u))}function j2(a){return"section"in a?`#${a.section}`:"kind"in a?`${ct.catalog}/${a.kind}`:ct[a.screen]}function Rm({head:a,rows:o,docs:u}){return b.jsxs("table",{className:"docs-options","data-docs":u,children:[b.jsx("thead",{children:b.jsx("tr",{children:a.map(r=>b.jsx("th",{children:r},r))})}),b.jsx("tbody",{children:o.map(([r,f],i)=>b.jsxs("tr",{children:[b.jsx("td",{children:r}),b.jsx("td",{children:f})]},i))})]})}function B2({id:a,index:o,lang:u,theme:r,palette:f}){const i=Ll[u].sections[a],d=C2(a,u),h=$2[a]??[],m=M2[a],{options:p,rules:y,migration:w}=Ll[u];return b.jsxs("section",{id:a,className:"docs-sec","data-docs":"section",children:[b.jsxs("div",{className:"docs-sec-head",children:[b.jsx("span",{className:"docs-sec-no","data-docs":"section-no",children:String(o+1).padStart(2,"0")}),b.jsx("h2",{children:i.title})]}),i.text.map((_,v)=>b.jsxs(Ae.Fragment,{children:[b.jsx("p",{className:"docs-sec-text","data-docs":"text",children:Qo(_)}),h[v]!=null&&b.jsx("pre",{className:"docs-command","data-docs":"command",children:b.jsx("code",{children:h[v]})})]},_)),a==="boxes"&&b.jsx("a",{className:"docs-sec-cta","data-docs":"icon-link",href:`${ct.catalog}/part/icon`,onClick:_=>dt(_),children:Ll[u].iconLink}),a==="rules"&&b.jsx("ol",{className:"docs-rules","data-docs":"rules",children:y.map(_=>b.jsx("li",{"data-docs":"rule",children:Qo(_)},_))}),d!==void 0&&b.jsxs("div",{className:"docs-example","data-docs":"example",children:[b.jsx("pre",{className:"docs-example-code","data-docs":"example-code",children:b.jsx("code",{children:d})}),b.jsx(cr,{className:"docs-example-figure",notation:d,json:a==="json",lang:u,theme:r,palette:f,whole:!0})]}),a==="export"&&b.jsx(Rm,{head:p.head,rows:p.rows(Object.keys(la).map(_=>`\`${_}\``).join(" / "),Yl).map(([_,v])=>[b.jsx("code",{children:_},"option"),Qo(v)])}),a==="migrate"&&b.jsx(Rm,{head:w.head,rows:w.rows.map(([_,v])=>[Qo(_),Qo(v)]),docs:"migration"}),b.jsx("a",{className:"docs-sec-cta","data-docs":"section-cta",href:j2(m),onClick:"section"in m?void 0:_=>dt(_),children:i.exit})]})}function z2({lang:a,theme:o,palette:u}){const r=Ll[a];return Ae.useEffect(()=>{const f=decodeURIComponent(location.hash.slice(1));f!==""&&document.getElementById(f)?.scrollIntoView()},[]),b.jsxs("div",{className:"docs",children:[b.jsxs("section",{className:"docs-hero","data-docs":"hero",children:[b.jsx("div",{className:"docs-eyebrow","data-docs":"eyebrow",children:r.eyebrow(dd)}),b.jsx("h1",{children:tt[a].site.screens.docs.title}),b.jsx("p",{className:"docs-lead","data-docs":"lead",children:r.lead}),b.jsxs("div",{className:"docs-cta","data-docs":"cta",children:[b.jsx("a",{className:"docs-btn-primary",href:ct.editor,onClick:f=>dt(f),children:r.start}),b.jsx("a",{className:"docs-btn-secondary",href:ct.catalog,onClick:f=>dt(f),children:r.browse})]})]}),b.jsx("nav",{className:"docs-features","data-docs":"features",children:N2.map(f=>b.jsxs("a",{className:"docs-card","data-docs":"card",href:`#${f}`,children:[b.jsx("span",{className:"docs-card-icon","data-icon":f,"aria-hidden":"true"}),b.jsx("span",{className:"docs-card-name","data-docs":"card-name",children:r.sections[f].title}),b.jsx("p",{children:r.cards[f]})]},f))}),b.jsx("div",{className:"docs-sections",children:T2.map((f,i)=>b.jsx(B2,{id:f,index:i,lang:a,theme:o,palette:u},f))})]})}const R2=`sequence ログイン処理

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
`,q2=`sequence Sign-in

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
`,H2={ja:R2.trimEnd(),en:q2.trimEnd()},U2="login.dragon",L2=["write","play","share"],G2=/^step(\s|$)/u;function Y2(a){const o=a.split(`
`),u=o.flatMap((r,f)=>G2.test(r)?[f]:[]);return u.map((r,f)=>{let i=(u[f+1]??o.length)-1;for(;i>r&&(o[i]??"").trim()==="";)i--;return Array.from({length:i-r+1},(d,h)=>r+h+1)})}function F2(a){let o;return a.map((u,r)=>{const f=u.trim(),i=u.length-u.trimStart().length;if(o!==void 0&&f!==""&&i>o)return"say";o=void 0;const d=f.split(/\s/u)[0];return f.startsWith("//")?"comment":d==="step"?"step":d==="say"?(o=i,"say"):d==="code"?"code":r===0?"head":void 0})}function X2({lang:a,theme:o,palette:u}){const r=tt[a],f=H2[a],[i,d]=Ae.useState(0),h=Ae.useMemo(()=>{const w=qa(f);return w.ok?w.diagram.steps:[]},[f]),m=new Set(Y2(f)[i]??[]),p=Ae.useMemo(()=>F2(f.split(`
`)),[f]),y=h[Math.min(i,h.length-1)];return b.jsx("section",{className:"home-demo","data-home":"demo",children:b.jsxs("div",{className:"home-canvas",children:[b.jsxs("div",{className:"home-canvas-bar",children:[b.jsxs("div",{className:"home-canvas-file",children:[b.jsxs("span",{className:"home-dots","aria-hidden":"true",children:[b.jsx("span",{}),b.jsx("span",{}),b.jsx("span",{})]}),b.jsx("span",{className:"home-file","data-home":"demo-file",children:U2})]}),y!==void 0&&b.jsxs("span",{className:"home-phase","data-home":"demo-phase",children:[b.jsx("span",{className:"home-live-dot","aria-hidden":"true"}),r.stage.phase(Math.min(i,h.length-1)+1,h.length,y.title)]})]}),b.jsxs("div",{className:"home-canvas-body",children:[b.jsx("div",{className:"home-code","data-home":"demo-code",children:f.split(`
`).map((w,_)=>b.jsxs("div",{className:"home-code-line","data-line":_+1,"data-current":m.has(_+1),"data-kind":p[_],children:[b.jsx("span",{className:"home-ln","aria-hidden":"true",children:_+1}),b.jsx("span",{className:"home-code-text","data-home":"code-text",children:w})]},_))}),b.jsx(cr,{className:"home-canvas-stage",notation:f,lang:a,theme:o,palette:u,onStep:d,whole:!0})]})]})})}function V2({lang:a,theme:o,palette:u}){const r=tt[a].site,f=r.home,[i,d,h]=f.title,m=tt[a].shelf.kinds,p=Lx.flatMap(y=>{const w=Ra(y,a);return w?[{key:y,...w}]:[]});return b.jsxs("div",{className:"home",children:[b.jsxs("section",{className:"home-hero","data-home":"hero",children:[b.jsxs("div",{className:"home-eyebrow",children:[b.jsx("span",{className:"home-chip","data-home":"version",children:dd}),b.jsx("span",{className:"home-chip",children:f.chip(Object.values(m))})]}),b.jsxs("h1",{children:[i,b.jsx("em",{children:d}),h]}),b.jsx("p",{className:"home-lead",children:f.lead}),b.jsxs("div",{className:"home-cta",children:[b.jsx("a",{className:"home-btn-primary",href:ct.editor,onClick:y=>dt(y),children:r.openEditor}),b.jsx("a",{className:"home-btn-secondary",href:ct.docs,onClick:y=>dt(y),children:f.readDocs})]})]}),b.jsx(X2,{lang:a,theme:o,palette:u}),b.jsxs("section",{className:"home-features","data-home":"features",children:[b.jsxs("div",{className:"home-head",children:[b.jsx("span",{className:"home-head-eyebrow",children:f.features.eyebrow}),b.jsx("h2",{children:f.features.title})]}),b.jsx("div",{className:"home-grid",children:f.features.items.map((y,w)=>b.jsxs("div",{className:"home-feature","data-home":"feature",children:[b.jsx("span",{className:"home-feature-icon","data-home":"feature-icon","data-icon":L2[w],"aria-hidden":"true"}),b.jsx("h3",{children:y.title}),b.jsx("p",{children:y.text})]},y.title))})]}),b.jsxs("section",{className:"home-steps","data-home":"steps",children:[b.jsxs("div",{className:"home-head",children:[b.jsx("span",{className:"home-head-eyebrow",children:f.steps.eyebrow}),b.jsx("h2",{children:f.steps.title})]}),b.jsx("div",{className:"home-grid",children:f.steps.items.map((y,w)=>b.jsxs("div",{className:"home-step","data-home":"step",children:[b.jsx("div",{className:"home-step-no","data-home":"step-no",children:String(w+1).padStart(2,"0")}),b.jsx("h3",{children:y.title}),b.jsx("p",{children:y.text}),w===1&&b.jsx("pre",{className:"home-step-code","data-home":"step-code",children:ql[a]})]},y.title))})]}),b.jsxs("section",{className:"home-uses","data-home":"uses",children:[b.jsxs("div",{className:"home-head",children:[b.jsx("span",{className:"home-head-eyebrow",children:f.uses.eyebrow}),b.jsx("h2",{children:f.uses.title})]}),b.jsx("div",{className:"home-use-grid",children:p.map(y=>b.jsxs("a",{className:"home-use","data-home":"use",href:`${ct.catalog}/${y.kind}`,onClick:w=>dt(w),children:[b.jsx(cr,{className:"home-use-thumb",notation:ca(y.key,a),lang:a,theme:o,palette:u,whole:!0}),b.jsxs("div",{className:"home-use-body",children:[b.jsx("span",{className:"home-use-kind","data-home":"use-kind",children:m[y.kind]}),b.jsx("h3",{children:y.title}),b.jsx("p",{"data-home":"use-about",children:y.about})]})]},y.key))}),b.jsx("div",{className:"home-uses-more","data-home":"uses-more",children:b.jsx("a",{className:"home-link",href:ct.catalog,onClick:y=>dt(y),children:f.uses.more})})]}),b.jsxs("section",{className:"home-closing","data-home":"closing",children:[b.jsx("h2",{children:f.closing.title}),b.jsx("p",{children:f.closing.lead}),b.jsxs("div",{className:"home-cta",children:[b.jsx("a",{className:"home-btn-primary",href:ct.editor,onClick:y=>dt(y),children:r.openEditor}),b.jsx("a",{className:"home-btn-secondary",href:rd,target:"_blank",rel:"noopener noreferrer",children:"GitHub ↗"})]})]})]})}const qm=["editor","catalog","docs"],Q2=4;function J2({lang:a,path:o}){const u=tt[a].site,r=u.notFound,f=u.screens["not-found"].title,i={editor:u.openEditor,catalog:r.catalog,docs:r.docs};return b.jsxs("section",{className:"not-found",children:[b.jsxs("div",{className:"not-found-code","data-not-found":"code","aria-label":"404",children:[b.jsx("span",{"aria-hidden":"true",children:"4"}),b.jsx("span",{className:"not-found-zero","aria-hidden":"true",children:"0"}),b.jsx("span",{"aria-hidden":"true",children:"4"})]}),b.jsx("div",{className:"not-found-ticks","aria-hidden":"true",children:Array.from({length:Q2},(d,h)=>b.jsx("span",{},h))}),b.jsxs("h1",{children:[b.jsx("em",{children:r.em}),f.slice(r.em.length)]}),b.jsx("p",{className:"not-found-lead","data-not-found":"lead",children:r.lead(qm.length)}),b.jsx("div",{className:"not-found-cta","data-not-found":"cta",children:qm.map((d,h)=>b.jsx("a",{className:h===0?"not-found-btn-primary":"not-found-btn-secondary",href:ct[d],onClick:m=>dt(m),children:i[d]},d))}),b.jsx("p",{className:"not-found-path","data-not-found":"path",children:o})]})}const zg=a=>a.map((o,u)=>({n:o,i:u})).sort((o,u)=>(o.n.line??1/0)-(u.n.line??1/0)||o.i-u.i).map(({n:o})=>o),Z2=a=>zg(a.map(o=>({line:o.line,text:o.message})));function K2(a,o){const u=o===void 0?void 0:ew(o);return zg(a.map(r=>{const f=u?I2(u,r.pointer):void 0;return{...f!==void 0?{line:f}:{},text:`${r.pointer||"/"} — ${r.message}`}}))}function P2(a,o){const u=/\bline (\d+)/u.exec(a);if(u)return Number(u[1]);const r=/\bposition (\d+)/u.exec(a);if(r)return o.slice(0,Number(r[1])).split(`
`).length}const W2=a=>a.replaceAll("~","~0").replaceAll("/","~1");function I2(a,o){for(let u=o;;u=u.slice(0,u.lastIndexOf("/"))){const r=a.get(u);if(r!==void 0)return r;if(u==="")return}}function ew(a){const o=new Map;let u=0,r=1;const f=()=>{for(;u<a.length&&/\s/u.test(a[u]??"");)a[u]===`
`&&r++,u++},i=()=>{const h=u;for(u++;u<a.length&&a[u]!=='"';)u+=a[u]==="\\"?2:1;return u++,JSON.parse(a.slice(h,u))},d=(h,m)=>{o.set(h,m);const p=a[u];if(p==="{"||p==="["){u++;for(let y=0;u<a.length;y++){if(f(),a[u]==="}"||a[u]==="]"){u++;return}if(a[u]===","&&(u++,f()),p==="{"){const w=r,_=i();f(),u++,f(),d(`${h}/${W2(_)}`,w)}else d(`${h}/${y}`,r)}return}if(p==='"'){i();return}for(;u<a.length&&!/[\s,\]}]/u.test(a[u]??"");)u++};return f(),d("",r),o}function tw(a){const o=[];for(const u of ui){const r=qa(ca(u,a),{lang:a});if(!r.ok)continue;const{kind:f,title:i}=r.diagram,d=o.find(h=>h.kind===f);d?d.samples.push({key:u,title:i}):o.push({kind:f,samples:[{key:u,title:i}]})}return o}const Xu=/^step(\s|$)/u,Bu=/^box\s/u,nw=/^group(\s|$)/u;function aw(a,o){const u=o.length+1,r=new Int32Array((a.length+1)*u),f=(d,h)=>r[d*u+h]??0;for(let d=a.length-1;d>=0;d--)for(let h=o.length-1;h>=0;h--)r[d*u+h]=a[d]===o[h]?f(d+1,h+1)+1:Math.max(f(d+1,h),f(d,h+1));const i=[];for(let d=0,h=0;h<o.length;)d<a.length&&a[d]===o[h]?(d++,h++):d<a.length&&f(d+1,h)>=f(d,h+1)?d++:(i.push(h),h++);return i}function Rg(a,o){const u=ni(a).split(`
`),r=ni(o).split(`
`),f=r.findIndex(d=>Xu.test(d)),i={declarations:[],steps:[]};for(const d of aw(u,r)){const h=r[d]??"";h.trim()!==""&&(f>=0&&d>=f?i.steps:i.declarations).push(h)}return i}function sw(a,o){const u=a.replace(/\s+$/u,"").split(`
`);let r=-1;const f=()=>{const p=u.findIndex((w,_)=>_>0&&Xu.test(w.trim()));let y=p<0?u.length:p;for(;y>1&&u[y-1]?.trim()==="";)y--;return y},i=(p,y)=>{u.splice(p,0,...y);const w=p+Math.max(y.findIndex(_=>_!==""),0);(r<0||w<r)&&(r=w)},d=o.declarations.some(p=>nw.test(p.trim())),h=d?[]:o.declarations.filter(p=>Bu.test(p.trim())),m=d?o.declarations:o.declarations.filter(p=>!Bu.test(p.trim()));if(h.length>0){const p=f();let y=-1;for(let w=0;w<p;w++)Bu.test(u[w]?.trim()??"")&&(y=w);i(y<0?p:y+1,h)}return m.length>0&&i(f(),d?["",...m]:m),o.steps.length>0&&i(u.length,Xu.test(o.steps[0]??"")?["",...o.steps]:o.steps),{text:u.join(`
`),line:r+1}}const ow=["box","region","step","edge","edge-tag","edge-coin","edge-none","edge-below","action","swap","strip"],iw={ja:{box:"箱",newBox:"新しい箱",region:"区画",newRegion:"新しい区画",newStep:"新しい段",stepBody:"この段で起きることを書く。",call:"呼ぶ",handOver:"渡す",key:"鍵",pay:"払う",notify:"知らせる",process:"処理する",rewritten:"書き換えた字",stripTitle:"状態",stripField:"値",stripValue:"1"},en:{box:"box",newBox:"New box",region:"zone",newRegion:"New region",newStep:"New step",stepBody:"Write what happens in this step.",call:"call",handOver:"hand over",key:"key",pay:"pay",notify:"notify",process:"process",rewritten:"Rewritten",stripTitle:"State",stripField:"value",stripValue:"1"}};function qg(a,o){const u=new Set([...a.boxes.map(f=>f.id),...(a.regions??[]).map(f=>f.id)]);let r=1;for(;u.has(`${o}${r}`);)r++;return`${o}${r}`}function Vu(a,o,u){const r=qg(a,o.box),f=u??(a.kind==="architecture"?a.boxes.at(-1)?.region:void 0),i={id:r,name:o.newBox,...f?{region:f}:{}},d=a.sequence?{sequence:{lifelines:[...a.sequence.lifelines,r]}}:{};return{id:r,diagram:{...a,boxes:[...a.boxes,i],...d}}}function Hg(a,o){const[u,r]=a.boxes;if(u&&r)return{diagram:a,from:u.id,to:r.id};const f=Vu(a,o);return{diagram:f.diagram,from:u?.id??f.id,to:f.id}}function Gl(a,o){const u=a.steps.at(-1);return u?{...a,steps:[...a.steps.slice(0,-1),{...u,events:[...u.events,o]}]}:a}const Jo=(a,o,u)=>(r,f)=>{const i=Hg(r,f);return Gl(i.diagram,{type:"edge",from:i.from,to:i.to,label:f[o],carry:a,...u?{labelSide:u}:{}})},lw={box:(a,o)=>Vu(a,o).diagram,region:(a,o)=>{const u=qg(a,o.region);return Vu({...a,regions:[...a.regions??[],{id:u,name:o.newRegion}]},o,u).diagram},step:(a,o)=>{const u=Hg(a,o),r={title:o.newStep,body:o.stepBody,events:[{type:"edge",from:u.from,to:u.to,label:o.call,carry:{kind:"envelope"}}]};return{...u.diagram,steps:[...u.diagram.steps,r]}},edge:Jo({kind:"envelope"},"call"),"edge-tag":(a,o)=>Jo({kind:"tag",text:o.key},"handOver")(a,o),"edge-coin":Jo({kind:"coin"},"pay"),"edge-none":Jo({kind:"none"},"notify"),"edge-below":Jo({kind:"envelope"},"call","below"),action:(a,o)=>Gl(a,{type:"action",box:a.boxes[0]?.id??"",label:o.process}),swap:(a,o)=>Gl(a,{type:"swap",box:a.boxes[0]?.id??"",text:o.rewritten}),strip:(a,o)=>{const u=a.strip??{title:o.stripTitle,fields:[o.stripField]};return Gl({...a,strip:u},{type:"strip",field:u.fields[0]??o.stripField,value:o.stripValue})}},Ug=(a,o,u)=>Rg(o,lw[a](o,iw[u])),rw={ja:{title:"題",id:"名札",name:"名前",note:"添え書き",color:"色",icon:"印",field:"欄",value:"値",tag:"札",stepTitle:"段の題",stepBody:"段の本文",command:"命令",label:"線の名前",action:"処理の名前",text:"字",memo:"メモ",branch:"枝",hash:"hash",message:"一言"},en:{title:"title",id:"id",name:"name",note:"note",color:"color",icon:"icon",field:"field",value:"value",tag:"tag",stepTitle:"step title",stepBody:"step body",command:"command",label:"label",action:"action",text:"text",memo:"memo",branch:"branch",hash:"hash",message:"message"}};function cw(a){const o=Object.fromEntries(Object.entries(rw[a]).map(([O,T])=>[O,`<${T}>`])),u=O=>O,r=O=>u({version:Pl,kind:O,title:o.title,boxes:[],steps:[]}),f=r("sequence"),i={title:o.stepTitle,body:o.stepBody,events:[]},d=u({...f,steps:[i]}),h=(O,T={})=>u({...f,...T,steps:[{...i,events:O}]}),m=(O,T)=>({type:"edge",from:o.id,to:o.id,label:o.label,carry:O,...T?{labelSide:T}:{}}),p=O=>O.flatMap(([T,C])=>{const H=Rg(T,C);return[...H.declarations,...H.steps]}),y={title:o.title,fields:[o.field]},w=O=>ni(O).split(`
`)[0]??"",_=u({...r("state"),steps:[i]}),v=(O,T)=>({type:"edge",from:O,to:T,label:o.label,carry:{kind:"envelope"}}),$=u({...r("git"),git:{branches:[{id:o.branch}]},steps:[i]}),j=O=>u({...$,steps:[{...i,events:O}]}),N=O=>({type:"commit",id:o.id,branch:o.branch,...O});return[{id:"kind",lines:[w(f),w(r("architecture")),w(r("state")),w(r("git"))]},{id:"view",lines:p([[f,u({...f,view:"fixed"})],[f,u({...f,view:"follow"})]])},{id:"region",lines:p([[f,u({...f,regions:[{id:o.id,name:o.name,note:o.note,color:o.color,icon:o.icon}],boxes:[{id:o.id,name:o.name,region:o.id}]})]])},{id:"box",lines:p([[f,u({...f,boxes:[{id:o.id,name:o.name,sub:o.note,color:o.color,icon:o.icon}]})]])},{id:"strip",lines:p([[f,u({...f,strip:{title:o.title,fields:[o.field,o.field]}})]])},{id:"step",lines:p([[f,d]])},{id:"code",lines:p([[d,u({...f,steps:[{...i,code:o.command}]})]])},{id:"edge",lines:p([[d,h([m({kind:"envelope"})])]])},{id:"carry",lines:p([{kind:"tag",text:o.value},{kind:"coin"},{kind:"none"}].map(O=>[d,h([m(O)])]))},{id:"side",lines:p(["above","below","left","right"].map(O=>[d,h([m({kind:"envelope"},O)])]))},{id:"start-finish",lines:p([[_,u({..._,steps:[{...i,events:[v("start",o.id),v(o.id,"finish")]}]})]])},{id:"path",lines:p([[_,u({..._,state:{paths:[{from:o.id,to:o.id,label:o.label}]}})]])},{id:"branch",lines:p([[u({...r("git"),steps:[i]}),u({...$,git:{branches:[{id:o.branch,note:o.note}]}})],[$,j([{type:"branch",branch:o.branch,from:o.id}])]])},{id:"commit",lines:p([[$,j([N({hash:o.hash,note:o.message})])]])},{id:"copy",lines:p([[$,j([N({copy:o.id})])]])},{id:"merge",lines:p([[$,j([N({merge:o.branch})])]])},{id:"ref",lines:p([[$,j([{type:"edge",from:o.branch,to:o.id,label:o.label,carry:{kind:"tag",text:o.branch}}])]])},{id:"action",lines:p([[d,h([{type:"action",box:o.id,label:o.action}])]])},{id:"swap",lines:p([[d,h([{type:"swap",box:o.id,text:o.text}])]])},{id:"strip-value",lines:p([[u({...d,strip:y}),h([{type:"strip",field:o.field,value:o.value,tag:o.tag}],{strip:y})]])},{id:"comment",lines:[`// ${o.memo}`]}]}const uw=["samples","parts","notation"];function dw({lang:a,base:o,active:u,open:r,onClose:f,onNew:i,onSample:d,onPart:h}){const m=tt[a].shelf,[p,y]=Ae.useState("samples"),[w,_]=Ae.useState(""),v=Ae.useMemo(()=>tw(a),[a]),$=Ae.useMemo(()=>o?ow.map(Z=>{const ie=Ug(Z,o,a);return{id:Z,lines:[...ie.declarations,...ie.steps]}}):[],[o,a]),j=Ae.useMemo(()=>cw(a),[a]),N=w.trim().toLowerCase(),O=(...Z)=>N===""||Z.some(ie=>ie.toLowerCase().includes(N)),T=v.map(Z=>({...Z,samples:Z.samples.filter(ie=>O(ie.title,ie.key))})).filter(Z=>Z.samples.length>0),C=$.filter(Z=>O(m.parts[Z.id],...Z.lines)),H=j.filter(Z=>O(m.syntax[Z.id],...Z.lines)),ue={samples:T.length,parts:C.length,notation:H.length}[p]===0;return b.jsxs("aside",{className:"pg-shelf","data-playground":"shelf","data-open":r?"on":void 0,"aria-label":m.label,onKeyDown:Z=>{Z.key==="Escape"&&r&&f()},children:[b.jsxs("button",{type:"button",className:"pg-new","data-playground":"new-file",onClick:i,children:[b.jsx("span",{className:"pg-new-plus","aria-hidden":"true",children:"+"}),m.newFile]}),b.jsx("div",{className:"pg-shelf-tabs",role:"tablist",children:uw.map(Z=>b.jsx("button",{type:"button",role:"tab","data-playground":`shelf-tab-${Z}`,"aria-selected":p===Z,onClick:()=>y(Z),children:m.tabs[Z]},Z))}),b.jsx("input",{className:"pg-filter","data-playground":"shelf-filter",type:"search",placeholder:m.filter,"aria-label":m.filterLabel,spellCheck:!1,value:w,onChange:Z=>_(Z.target.value)}),b.jsxs("div",{className:"pg-shelf-list",role:"tabpanel",children:[p==="samples"&&T.map(Z=>b.jsxs("section",{className:"pg-group",children:[b.jsx("h3",{className:"pg-group-title",children:m.kinds[Z.kind]}),Z.samples.map(ie=>b.jsx("button",{type:"button",className:"pg-item","data-playground":`sample-${ie.key}`,"aria-current":u===ie.key?"true":void 0,title:ie.title,onClick:()=>d(ie.key),children:ie.title},ie.key))]},Z.kind)),p==="parts"&&b.jsxs(b.Fragment,{children:[b.jsx("p",{className:"pg-shelf-hint",children:m.partsHint}),C.map(Z=>b.jsxs("button",{type:"button",className:"pg-entry pg-entry-button","data-playground":`part-${Z.id}`,onClick:()=>h(Z.id),children:[b.jsx("span",{className:"pg-entry-name",children:m.parts[Z.id]}),b.jsx("code",{className:"pg-entry-code",children:Z.lines.join(`
`)})]},Z.id))]}),p==="notation"&&b.jsxs(b.Fragment,{children:[b.jsx("p",{className:"pg-shelf-hint",children:m.notationHint}),H.map(Z=>b.jsxs("div",{className:"pg-entry","data-playground":`syntax-${Z.id}`,children:[b.jsx("code",{className:"pg-entry-code",children:Z.lines.join(`
`)}),b.jsx("span",{className:"pg-entry-note",children:m.syntax[Z.id]})]},Z.id))]}),ue&&b.jsx("p",{className:"pg-shelf-empty",children:m.nothing})]})]})}const Hm=1.15,Um=[.7,1.6],Lm=a=>Math.min(Um[1],Math.max(Um[0],a));function ss({name:a,icon:o,label:u,onClick:r,pressed:f,disabled:i}){return b.jsx("button",{type:"button",className:"pg-tool","data-playground":a,"aria-label":u,title:u,"aria-pressed":f,disabled:i,onClick:r,children:b.jsx("span",{className:"pg-icon","data-icon":o,"aria-hidden":"true"})})}function fw({diagram:a,palette:o,onPalette:u,theme:r,lang:f,kept:i,fileName:d,overlaps:h,jump:m}){const p=tt[f],y=Ae.useRef(null),w=Ae.useRef(null),[_,v]=Ae.useState(0),[$,j]=Ae.useState(1),[N,O]=Ae.useState(!1),[T,C]=Ae.useState(1),[H,ue]=Ae.useState(!1),Z=jg(),ie=Ae.useRef(null),U=ud(w,a,{palette:o,theme:r,lang:f,onStep:v,onPlayer:z=>{ie.current=z}});Ae.useEffect(()=>{ie.current?.mark(h.filter(z=>z.step===_).flatMap(z=>z.spots.map(K=>K.rect)))},[h,_,a,o,r,f]),Ae.useEffect(()=>{m&&ie.current?.goTo(m.step)},[m]),Ae.useEffect(()=>{const z=()=>ue(document.fullscreenElement!==null&&document.fullscreenElement===y.current);return document.addEventListener("fullscreenchange",z),()=>document.removeEventListener("fullscreenchange",z)},[]);const fe=()=>{document.fullscreenElement?document.exitFullscreen().catch(()=>{}):y.current?.requestFullscreen().catch(()=>{})},re=a?.steps.length??0,Ee=a?.steps[Math.min(_,re-1)],R=re>1&&Ee!==void 0,ge=U?Zl(U.scale,$):null,we=ge===null?"—":`${Math.round(ge*100)}%`,ke=z=>{U&&j(Zl(U.scale,$*z)/U.scale)},E={...U&&ge!==null?{"--fig-w":`${U.width*ge}px`}:{},"--say":String(T)};return b.jsxs("section",{className:"pg-stage","data-playground":"stage",ref:y,children:[b.jsxs("div",{className:"pg-stage-bar",children:[b.jsxs("span",{className:"pg-live",children:[b.jsx("span",{className:"pg-live-dot","aria-hidden":"true"}),p.stage.live]}),b.jsx("div",{className:"pg-swatches",role:"group","aria-label":p.palette,children:Object.values(la).map(z=>b.jsx("button",{type:"button",className:"pg-swatch","data-playground":`palette-${z.id}`,"aria-pressed":o===z.id,"aria-label":p.paletteNames[z.id]??z.name,title:p.paletteNames[z.id]??z.name,onClick:()=>u(z.id),children:b.jsx("span",{className:"pg-swatch-dot","aria-hidden":"true",style:{background:`linear-gradient(135deg, ${z.light.page} 50%, ${z.dark.page} 50%)`,borderColor:z.light["c-blue"]}})},z.id))}),b.jsx("span",{className:"pg-gap"}),b.jsx(ss,{name:"font-down",icon:"text-down",label:p.stage.fontDown,onClick:()=>C(Lm(T/Hm))}),b.jsx(ss,{name:"font-up",icon:"text-up",label:p.stage.fontUp,onClick:()=>C(Lm(T*Hm))}),b.jsx(ss,{name:"grid",icon:"grid",label:p.stage.grid,pressed:N,onClick:()=>O(!N)}),b.jsx(ss,{name:"fullscreen",icon:"fullscreen",label:p.stage.fullscreen,pressed:H,onClick:fe}),b.jsx("span",{className:"pg-tool-sep","aria-hidden":"true"}),!Z&&b.jsx(ss,{name:"fit",icon:"fit",label:p.stage.fit,disabled:!U,onClick:()=>j(1)}),b.jsx(ss,{name:"zoom-out",icon:"zoom-out",label:p.stage.zoomOut,disabled:!U||ge===Ps[0],onClick:()=>ke(1/Jl)}),Z&&b.jsx("button",{type:"button",className:"pg-tool pg-zoom-fit","data-playground":"zoom-level","aria-label":`${p.stage.fit} (${we})`,title:p.stage.fit,disabled:!U,onClick:()=>j(1),children:we}),b.jsx(ss,{name:"zoom-in",icon:"zoom-in",label:p.stage.zoomIn,disabled:!U||ge===Ps[1],onClick:()=>ke(Jl)}),!Z&&b.jsx("span",{className:"pg-zoom","data-playground":"zoom-level","aria-label":p.stage.zoom,children:we})]}),b.jsxs("div",{className:"pg-figure","data-playground":"figure","data-grid":N?"on":void 0,"data-phased":R?"on":void 0,style:E,children:[R&&b.jsxs("p",{className:"pg-phase","data-playground":"phase-badge",children:[b.jsx("span",{className:"pg-phase-dot","aria-hidden":"true"}),p.stage.phase(_+1,re,Ee.title)]}),i&&b.jsxs("p",{className:"pg-kept",children:["↺ ",p.kept]}),b.jsx("div",{className:"pg-player",ref:w})]}),b.jsxs("div",{className:"pg-stage-foot",children:[R&&b.jsx("div",{className:"pg-progress","data-playground":"progress","aria-hidden":"true",children:a?.steps.map((z,K)=>b.jsx("span",{className:"pg-progress-seg","data-playground":"progress-seg","data-done":K<=_},`${K}-${z.title}`))}),b.jsxs("p",{className:"pg-hint",children:[p.exportLead," ",b.jsxs("code",{children:["dragon export ",d]})," ",p.exportTail]})]})]})}const Lg=a=>a instanceof Error?a.message:String(a);function Gg(a,o,u){const r=ii(a,{lang:o});if(!r.ok)return{ok:!1,problem:{lang:o,notices:K2(r.errors,u)}};try{sd(r.diagram)}catch(f){return{ok:!1,problem:{lang:o,notices:[{text:tt[o].cannotDraw(Lg(f))}]}}}return{ok:!0,diagram:r.diagram}}function Ko(a,o){const u=qa(a,{lang:o});return u.ok?Gg(u.diagram,o):{ok:!1,problem:{lang:o,notices:Z2(u.errors)}}}function Gm(a,o){let u;try{u=JSON.parse(a)}catch(r){const f=Lg(r),i=P2(f,a);return{ok:!1,problem:{lang:o,notices:[{...i!==void 0?{line:i}:{},text:tt[o].notJson(f)}]}}}return Gg(u,o,a)}const Ym=a=>{const o=a.trim();return o===""?Uu:o.endsWith(".dragon")?o:`${o}.dragon`},zu=a=>a.replace(/\.dragon$/u,"");function hw(a,o){const u=a.value.split(`
`),r=u.slice(0,o-1).reduce((f,i)=>f+i.length+1,0);a.focus(),a.setSelectionRange(r,r+(u[o-1]?.length??0)),Yg(a,o)}function Yg(a,o){const u=Number.parseFloat(getComputedStyle(a).lineHeight)||20;a.scrollTop=Math.max(0,(o-1)*u-a.clientHeight/2)}const Fm=a=>a?JSON.stringify(a,null,2):"",Ru=a=>{history.replaceState(null,"",`${location.pathname}${location.search}${a===void 0?"":ld(a)}`)};function pw(a){const o=Mg(location.hash),u=o??ca(zm,a);return{text:u,example:o===void 0?zm:Hl(u)?.key??null,outcome:Ko(u,a)}}function mw({lang:a,theme:o,palette:u,onBeforeLang:r}){const[f]=Ae.useState(()=>pw(a)),[i,d]=Ae.useState("notation"),[h,m]=Ae.useState(f.text),[p,y]=Ae.useState(""),[w,_]=Ae.useState(f.example),[v,$]=Ae.useState(f.outcome.ok?f.outcome.diagram:null),[j,N]=Ae.useState(f.outcome.ok?null:f.outcome.problem),[O,T]=Ae.useState(null),C=O?.site===u?O.palette:u,[H,ue]=Ae.useState(!1),[Z,ie]=Ae.useState(zu(f.example===null?Uu:`${f.example}.dragon`)),[U,fe]=Ae.useState(!1),[re,Ee]=Ae.useState(null),R=Ae.useRef(null),ge=Ae.useRef(null),we=Ae.useRef(null),ke=Ae.useRef(null),E=tt[a],z=Ae.useMemo(()=>{const S=qa(h,{lang:a});return S.ok?S.diagram:v},[h,a,v]);Ae.useLayoutEffect(()=>{const S=ke.current;S===null||!R.current||(ke.current=null,Yg(R.current,S))});const K=S=>{$(F=>F&&JSON.stringify(F)===JSON.stringify(S)?F:S),N(null)},P=S=>{m(S),_(Hl(S)?.key??null),Ru(S);const F=Ko(S,a);F.ok?K(F.diagram):N(F.problem)},he=S=>{y(S);const F=Gm(S,a);if(!F.ok){N(F.problem);return}K(F.diagram);const ee=ni(F.diagram);m(ee),_(Hl(ee)?.key??null),Ru(ee)},k=(S,F,ee,te)=>{const be=Ko(S,te);m(S),_(F),ie(zu(ee)),Ru(void 0),be.ok?(K(be.diagram),y(Fm(be.diagram))):N(be.problem)},X=(S,F)=>k(ca(S,F),S,`${S}.dragon`,F),ce=()=>k(ql[a],null,Uu,a),ve=async S=>{const F=(await S.text()).replace(/\r\n?/gu,`
`).trimEnd();let ee=F;if(/^\s*\{/u.test(F))try{const te=ii(JSON.parse(F),{lang:a});te.ok&&(ee=ni(te.diagram))}catch{}d("notation"),P(ee),ie(zu(S.name.replace(/\.json$/iu,".dragon")))},Se=()=>{const S=URL.createObjectURL(new Blob([`${h.trimEnd()}
`],{type:"text/plain;charset=utf-8"})),F=document.createElement("a");F.href=S,F.download=Ym(Z),F.click(),window.setTimeout(()=>URL.revokeObjectURL(S),6e4)},_e=S=>{if(!z)return;const F=sw(h,Ug(S,z,a));i!=="notation"&&d("notation"),P(F.text),ke.current=F.line},Me=S=>{H&&ue(!1),R.current&&hw(R.current,S)},Ge=S=>{if(d(S),S==="json"){y(Fm(v)),N(null);return}const F=Ko(h,a);N(F.ok?null:F.problem)},L=S=>{if(i==="json"&&j){const ee=Gm(p,S);ee.ok||N(ee.problem);return}const F=Hl(h);if(F&&F.lang!==S){X(F.key,S);return}if(h===ql[a]&&a!==S){k(ql[S],null,Z,S);return}if(i==="notation"&&j){const ee=Ko(h,S);ee.ok||N(ee.problem)}};Ae.useLayoutEffect(()=>(r(L),()=>r(null)));const G=i==="notation"?h:p,A=Ae.useMemo(()=>v?sd(v,{lang:a}).overlaps:[],[v,a]),W=G.split(`
`).length,ae=new Set(j?.notices.flatMap(S=>S.line===void 0?[]:[S.line])),se=j?tt[j.lang].notices:void 0,xe=S=>(...F)=>{S(...F),fe(!1)};return b.jsxs("div",{className:"pg",children:[b.jsx(dw,{lang:a,base:z,active:w,open:U,onClose:()=>fe(!1),onNew:xe(ce),onSample:xe(S=>X(S,a)),onPart:_e}),U&&b.jsx("button",{type:"button",className:"pg-shelf-scrim","aria-label":E.shelf.close,onClick:()=>fe(!1)}),b.jsxs("section",{className:"pg-code","data-playground":"editor-pane","data-folded":H,children:[b.jsxs("div",{className:"pg-bar",children:[b.jsx("button",{type:"button",className:"pg-tool pg-shelf-toggle","data-playground":"shelf-toggle","aria-label":E.shelf.open,title:E.shelf.open,"aria-expanded":U,onClick:()=>fe(!U),children:b.jsx("span",{className:"pg-icon","data-icon":"list","aria-hidden":"true"})}),b.jsx("div",{className:"pg-tabs",role:"tablist",children:["notation","json"].map(S=>b.jsx("button",{type:"button",role:"tab","data-playground":`tab-${S}`,"aria-selected":i===S,onClick:()=>Ge(S),children:S==="notation"?E.notation:"JSON"},S))}),b.jsx("input",{className:"pg-file","data-playground":"file-name","aria-label":E.code.file,title:E.code.file,spellCheck:!1,value:Z,onChange:S=>ie(S.target.value)}),b.jsx("button",{type:"button",className:"pg-tool","data-playground":"import","aria-label":E.code.import,title:E.code.import,onClick:()=>we.current?.click(),children:b.jsx("span",{className:"pg-icon","data-icon":"import","aria-hidden":"true"})}),b.jsx("input",{ref:we,type:"file",hidden:!0,"data-playground":"import-file",accept:".dragon,.json,.txt,text/plain,application/json",onChange:S=>{const F=S.target.files?.[0];S.target.value="",F&&ve(F)}}),b.jsx("button",{type:"button",className:"pg-tool pg-tool-primary","data-playground":"export","aria-label":E.code.export,title:E.code.export,onClick:Se,children:b.jsx("span",{className:"pg-icon","data-icon":"export","aria-hidden":"true"})}),b.jsxs("button",{type:"button",className:"pg-fold","data-playground":"fold","aria-expanded":!H,onClick:()=>ue(!H),children:[H?E.unfold:E.fold," ",H?"▴":"▾"]})]}),b.jsxs("div",{className:"pg-code-body",hidden:H,children:[b.jsx("div",{className:"pg-gutter",ref:ge,"aria-hidden":"true",children:Array.from({length:W},(S,F)=>b.jsx("div",{className:ae.has(F+1)?"is-error":void 0,children:F+1},F))}),b.jsx("textarea",{ref:R,className:"pg-text","data-playground":"editor","aria-label":E.editor,spellCheck:!1,wrap:"off",value:G,onChange:S=>i==="notation"?P(S.target.value):he(S.target.value),onScroll:S=>{ge.current&&(ge.current.scrollTop=S.currentTarget.scrollTop)}})]}),b.jsx("div",{className:"pg-notices","data-playground":"status","data-state":j?"error":"ok",role:"status",children:j&&se?b.jsxs(b.Fragment,{children:[b.jsx("p",{className:"pg-notices-head",children:b.jsx("span",{className:"pg-notices-badge",children:se.count(j.notices.length)})}),b.jsx("ul",{className:"pg-notice-list",children:j.notices.map((S,F)=>b.jsxs("li",{className:"pg-notice","data-playground":"notice",children:[S.line!==void 0&&b.jsx("button",{type:"button",className:"pg-notice-line","data-playground":"notice-line","aria-label":se.goTo(S.line),onClick:()=>Me(S.line??1),children:se.line(S.line)}),b.jsx("span",{className:"pg-notice-text",children:S.text})]},`${F}-${S.line??"-"}`))})]}):b.jsxs(b.Fragment,{children:[b.jsxs("p",{className:"pg-ok",children:[b.jsx("span",{"aria-hidden":"true",children:"✓"})," ",v?E.readable(v.boxes.length,v.steps.length):""]}),A.length>0&&b.jsxs("div",{className:"pg-overlaps","data-playground":"overlaps",children:[b.jsx("p",{className:"pg-notices-head",children:b.jsx("span",{className:"pg-overlaps-badge","data-playground":"overlaps-count",children:E.overlaps.count(A.length)})}),b.jsx("ul",{className:"pg-notice-list",children:A.map((S,F)=>b.jsxs("li",{className:"pg-notice","data-playground":"overlap",children:[b.jsx("button",{type:"button",className:"pg-overlap-step","data-playground":"overlap-step","aria-label":E.overlaps.goTo(S.step+1),onClick:()=>Ee(ee=>({step:S.step,count:(ee?.count??0)+1})),children:E.overlaps.step(S.step+1)}),b.jsx("span",{className:"pg-notice-text","data-playground":"overlap-text",children:Ov(S,a)})]},`${F}-${S.step}`))})]})]})})]}),b.jsx(fw,{diagram:v,palette:C,onPalette:S=>T({site:u,palette:S}),theme:o,lang:a,kept:j!==null&&v!==null,overlaps:A,jump:re,fileName:Ym(Z)})]})}const gw=`${rd}/blob/main/CHANGELOG.md`;function yw({lang:a}){const o=tt[a].site,u=o.releaseNotes,r=o.screens["release-notes"].title;return b.jsxs("section",{className:"release","data-release":"hero",children:[b.jsxs("nav",{className:"release-crumb","data-release":"crumb","aria-label":u.crumb,children:[b.jsx("a",{href:ct.home,onClick:f=>dt(f),children:o.nav.home}),b.jsx("span",{"aria-hidden":"true",children:"›"}),b.jsx("span",{className:"release-crumb-here","aria-current":"page",children:r})]}),b.jsx("span",{className:"release-eyebrow","data-release":"eyebrow",children:u.eyebrow(dd)}),b.jsxs("h1",{children:[r.slice(0,r.length-u.accent.length),b.jsx("span",{className:"release-accent",children:u.accent})]}),b.jsx("p",{className:"release-lead","data-release":"lead",children:u.lead}),b.jsx("div",{className:"release-actions","data-release":"actions",children:b.jsxs("a",{className:"release-btn",href:gw,target:"_blank",rel:"noopener noreferrer",children:[b.jsx("span",{children:u.changelog}),b.jsx("span",{className:"release-btn-arrow","aria-hidden":"true",children:"↗"})]})})]})}const bw={paper:"rose",clear:"blue",night:"blue"},Fg="dragon-site-palette";function Xg(a,o){const u=er(a)[o];return u[`t-${bw[a]??"blue"}`]??u.ink??""}function vw(a,o){const u=er(a)[o],r=f=>u[f]??"";return{"--d-bg":r("page"),"--d-surface":r("surf"),"--d-surface-2":r("bg"),"--d-surface-3":r("sunk"),"--d-border":r("hair"),"--d-border-strong":r("line"),"--d-text-primary":r("ink"),"--d-text-secondary":r("ink2"),"--d-text-muted":r("mute"),"--d-accent":Xg(a,o),"--d-on-accent":r("on-c"),"--d-code-bg":r("sunk"),"--d-err":r("t-rose"),"--d-ok":r("t-green"),"--d-warn":r("t-amber")}}function Vg(a,o){const u=document.documentElement;u.dataset.scheme=o,u.style.colorScheme=o;for(const[r,f]of Object.entries(vw(a,o)))u.style.setProperty(r,f)}function Qg(){try{const a=localStorage.getItem(Fg);return a!==null&&Object.hasOwn(la,a)?a:Yl}catch{return Yl}}function xw(a){try{localStorage.setItem(Fg,a)}catch{}}const Xm=a=>({"--sw-light":a.light.page,"--sw-dark":a.dark.page,"--sw-accent":Xg(a.id,"light")}),Jg=["home","catalog","editor","docs","release-notes"],ww=a=>a.screen==="category"||a.screen==="part"?"catalog":Jg.find(o=>o===a.screen);function Sw({path:a,route:o,lang:u,theme:r,palette:f,onLang:i,onTheme:d,onPalette:h}){const m=tt[u].site,p=tt[u].paletteNames,y=ww(o),[w,_]=Ae.useState(null),v=w===a;Ae.useEffect(()=>{if(!v)return;const j=N=>{N.key==="Escape"&&_(null)};return addEventListener("keydown",j),()=>removeEventListener("keydown",j)},[v]);const $=(j,N)=>[...Jg.map(O=>b.jsx("a",{className:j,href:ct[O],"aria-current":O===y?"page":void 0,onClick:T=>dt(T,N),children:m.nav[O]},O)),b.jsx("a",{className:j,href:rd,target:"_blank",rel:"noopener noreferrer",children:"GitHub ↗"},"github")];return b.jsxs("header",{className:"site-head","data-site":"header",children:[b.jsxs("a",{className:"site-brand",href:ct.home,onClick:j=>dt(j),children:[b.jsx("span",{className:"site-mark","data-site":"mark","aria-hidden":"true"}),b.jsx("span",{className:"site-name","data-site":"name",children:"dragon"}),b.jsxs("span",{className:"site-tagline","data-site":"tagline",children:["— ",tt[u].tagline]})]}),b.jsx("nav",{className:"site-nav","data-site":"nav","aria-label":m.navLabel,children:$("site-nav-link")}),b.jsxs("div",{className:"site-actions",children:[b.jsx("div",{className:"site-lang",role:"group","aria-label":tt[u].language,children:["ja","en"].map(j=>b.jsx("button",{type:"button","data-site":`lang-${j}`,"aria-pressed":u===j,onClick:()=>i(j),children:j.toUpperCase()},j))}),b.jsx("div",{className:"site-palette","data-site":"palette",role:"group","aria-label":tt[u].palette,children:Object.values(la).map(j=>b.jsx("button",{type:"button",className:"site-palette-btn","data-site":`palette-${j.id}`,"aria-pressed":f===j.id,"aria-label":p[j.id]??j.name,title:p[j.id]??j.name,onClick:()=>h(j.id),children:b.jsx("span",{className:"site-swatch",style:Xm(j),"aria-hidden":"true"})},j.id))}),b.jsx("button",{type:"button",className:"site-icon-btn","data-site":"theme","aria-label":r==="dark"?m.toLight:m.toDark,title:r==="dark"?m.toLight:m.toDark,onClick:d,children:r==="dark"?"☀":"☾"}),b.jsx("button",{type:"button",className:"site-icon-btn site-menu-btn","data-site":"menu","aria-label":v?m.closeMenu:m.openMenu,"aria-expanded":v,"aria-controls":"site-sheet",onClick:()=>_(v?null:a),children:v?"×":"≡"}),b.jsx("a",{className:"site-cta","data-site":"open-editor",href:ct.editor,onClick:j=>dt(j),children:m.openEditor})]}),v&&b.jsxs(b.Fragment,{children:[b.jsx("div",{className:"site-scrim","aria-hidden":"true",onClick:()=>_(null)}),b.jsxs("div",{className:"site-sheet",id:"site-sheet",children:[b.jsx("nav",{"data-site":"sheet","aria-label":m.navLabel,children:$("site-sheet-link",()=>_(null))}),b.jsxs("div",{className:"site-sheet-palette","data-site":"sheet-palette",role:"group","aria-label":tt[u].palette,children:[b.jsx("span",{className:"site-sheet-label","aria-hidden":"true",children:tt[u].palette}),Object.values(la).map(j=>b.jsxs("button",{type:"button",className:"site-sheet-swatch","data-site":`palette-${j.id}`,"aria-pressed":f===j.id,onClick:()=>h(j.id),children:[b.jsx("span",{className:"site-swatch",style:Xm(j),"aria-hidden":"true"}),p[j.id]??j.name]},j.id))]}),b.jsx("a",{className:"site-sheet-cta",href:ct.editor,onClick:j=>dt(j,()=>_(null)),children:m.openEditor})]})]})]})}const Zg="(prefers-color-scheme: dark)";function Aw(a){const o=matchMedia(Zg);return o.addEventListener("change",a),()=>o.removeEventListener("change",a)}const Kg=()=>matchMedia(Zg).matches?"dark":"light";function Ew(a){const o=$g(a);return o.screen==="category"&&!id(o.category)?{screen:"not-found"}:o.screen==="part"&&cd(o.part)===void 0?{screen:"not-found"}:o}function _w(a,o){const u=tt[o];if(a.screen==="home")return null;if(a.screen==="category")return id(a.category)?u.shelf.kinds[a.category]:null;if(a.screen==="part"){const r=cd(a.part);return r?u.site.catalog.parts[r.id].name:null}return u.site.screens[a.screen].title}function kw(){const a=Qx(),o=Ew(a),u=cd(o.part),[r,f]=Ae.useState(()=>Yx(navigator.languages.length>0?navigator.languages:[navigator.language])),[i,d]=Ae.useState(null),[h,m]=Ae.useState(Qg),p=Ae.useSyncExternalStore(Aw,Kg),y=i??p,w=Ae.useRef(null),_=Ae.useCallback(N=>{w.current=N},[]);Ae.useLayoutEffect(()=>{const N=document.documentElement;N.lang=r,N.style.setProperty("--sans",`"${ai.sans}"`),N.style.setProperty("--mono",`"${ai.mono}"`)},[r]),Ae.useLayoutEffect(()=>{Vg(h,y)},[h,y]);const v=_w(o,r);Ae.useLayoutEffect(()=>{document.title=v===null?tt[r].title:`${v} — dragon`},[r,v]);const $=N=>{N!==r&&(w.current?.(N),f(N))},j=N=>{m(N),xw(N)};return b.jsxs("div",{className:"site",children:[b.jsx(Sw,{path:a,route:o,lang:r,theme:y,palette:h,onLang:$,onTheme:()=>d(y==="dark"?"light":"dark"),onPalette:j}),b.jsx("main",{className:"site-main","data-site-screen":o.screen,children:o.screen==="home"?b.jsx(V2,{lang:r,theme:y,palette:h}):o.screen==="editor"?b.jsx(mw,{lang:r,theme:y,palette:h,onBeforeLang:_}):o.screen==="catalog"?b.jsx(F3,{lang:r}):o.screen==="category"&&id(o.category)?b.jsx(W3,{kind:o.category,lang:r,theme:y,palette:h},o.category):o.screen==="part"&&u?b.jsx(a2,{part:u,lang:r,theme:y,palette:h},u.id):o.screen==="docs"?b.jsx(z2,{lang:r,theme:y,palette:h}):o.screen==="release-notes"?b.jsx(yw,{lang:r}):b.jsx(J2,{lang:r,path:a})})]})}Xx();Vg(Qg(),Kg());xx.createRoot(document.getElementById("root")).render(b.jsx(Ae.StrictMode,{children:b.jsx(kw,{})}));
