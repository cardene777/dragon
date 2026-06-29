**@cardenelabs/cdl**

***

# @cardenelabs/cdl

## Interfaces

### IntentDiscrepancy

Defined in: [author-intent-verify.ts:35](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L35)

#### Properties

##### kind

> **kind**: [`IntentDiscrepancyKind`](#intentdiscrepancykind)

Defined in: [author-intent-verify.ts:36](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L36)

##### diagramId

> **diagramId**: `string`

Defined in: [author-intent-verify.ts:37](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L37)

##### elementId

> **elementId**: `string`

Defined in: [author-intent-verify.ts:38](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L38)

##### expected

> **expected**: `unknown`

Defined in: [author-intent-verify.ts:39](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L39)

##### actual

> **actual**: `unknown`

Defined in: [author-intent-verify.ts:40](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L40)

##### detail

> **detail**: `string`

Defined in: [author-intent-verify.ts:41](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L41)

***

### AuthorIntentOptions

Defined in: [author-intent-verify.ts:44](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L44)

#### Properties

##### edgeConnectionTolerance?

> `optional` **edgeConnectionTolerance?**: `number`

Defined in: [author-intent-verify.ts:46](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L46)

edge 起点 / 終点と from / to node bbox の許容距離 (px、 default 80)

##### laneContainmentTolerance?

> `optional` **laneContainmentTolerance?**: `number`

Defined in: [author-intent-verify.ts:53](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L53)

lane bbox からの node はみ出し許容 (px、 default 500)。
lane height 計算が node h 全部を含まないケースが engine layer に存在し、
視覚的には許容範囲 (同じ diagram 内に収まる) なので default は緩く設定。
engine bug hunting は --strict (= 24px) で。

##### toneColorTolerance?

> `optional` **toneColorTolerance?**: `number`

Defined in: [author-intent-verify.ts:55](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L55)

tone 色判定の RGB 距離許容 (default 30)

##### activationVisualDelta?

> `optional` **activationVisualDelta?**: `number`

Defined in: [author-intent-verify.ts:57](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L57)

activation 視覚効果判定の opacity / scale 差最小値 (default 0.1)

##### skipNodeInLane?

> `optional` **skipNodeInLane?**: `boolean`

Defined in: [author-intent-verify.ts:59](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L59)

軸を skip する flag (個別 disable 用)

##### skipNodeText?

> `optional` **skipNodeText?**: `boolean`

Defined in: [author-intent-verify.ts:60](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L60)

##### skipEdgeLabel?

> `optional` **skipEdgeLabel?**: `boolean`

Defined in: [author-intent-verify.ts:61](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L61)

##### skipEdgeConnected?

> `optional` **skipEdgeConnected?**: `boolean`

Defined in: [author-intent-verify.ts:62](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L62)

##### skipActivation?

> `optional` **skipActivation?**: `boolean`

Defined in: [author-intent-verify.ts:63](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L63)

##### skipToneColor?

> `optional` **skipToneColor?**: `boolean`

Defined in: [author-intent-verify.ts:64](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L64)

***

### AuthorIntentReport

Defined in: [author-intent-verify.ts:571](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L571)

複数 diagram を一括 verify。

#### Properties

##### total

> **total**: `number`

Defined in: [author-intent-verify.ts:572](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L572)

##### pass

> **pass**: `number`

Defined in: [author-intent-verify.ts:573](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L573)

##### fail

> **fail**: `number`

Defined in: [author-intent-verify.ts:574](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L574)

##### discrepancies

> **discrepancies**: [`IntentDiscrepancy`](#intentdiscrepancy)[]

Defined in: [author-intent-verify.ts:575](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L575)

***

### GenericDiagramSpec

Defined in: [dom-verify-core.ts:20](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L20)

任意 diagram tool が「目」 で検証されるために提供すべき構造的 spec。
cdl-specific な型を排し、 generic な primitive (id / cx / cy / w / h / path d / activate set 等) のみ。

#### Properties

##### id

> **id**: `string`

Defined in: [dom-verify-core.ts:22](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L22)

diagram の一意 id ([data-cdl-diagram="..."] でも別 attr でも良い、 adapter で selector を構築)

##### rootAttribute?

> `optional` **rootAttribute?**: `string`

Defined in: [dom-verify-core.ts:24](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L24)

root selector の DOM attribute (default "data-cdl-diagram")

##### nodeAttribute?

> `optional` **nodeAttribute?**: `string`

Defined in: [dom-verify-core.ts:26](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L26)

node selector の DOM attribute (default "data-cdl-node")

##### edgeAttribute?

> `optional` **edgeAttribute?**: `string`

Defined in: [dom-verify-core.ts:28](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L28)

edge selector の DOM attribute (default "data-cdl-edge")

##### particleAttribute?

> `optional` **particleAttribute?**: `string`

Defined in: [dom-verify-core.ts:30](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L30)

particle selector の DOM attribute (default "data-cdl-particle")

##### nodes

> **nodes**: `object`[]

Defined in: [dom-verify-core.ts:32](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L32)

node 一覧 (id / cx / cy / w / h)

###### id

> **id**: `string`

###### cx

> **cx**: `number`

###### cy

> **cy**: `number`

###### w

> **w**: `number`

###### h

> **h**: `number`

##### edges

> **edges**: `object`[]

Defined in: [dom-verify-core.ts:40](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L40)

edge 一覧 (id / from / to / d / labelX / labelY / style)

###### id

> **id**: `string`

###### from

> **from**: `string`

###### to

> **to**: `string`

###### d

> **d**: `string`

###### labelX

> **labelX**: `number`

###### labelY

> **labelY**: `number`

###### hasParticle

> **hasParticle**: `boolean`

"dotted-flow" 相当のスタイル (particle 検証対象判定用)

##### phases

> **phases**: `object`[]

Defined in: [dom-verify-core.ts:51](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L51)

phase 一覧 (id / activate set)

###### id

> **id**: `string`

###### activate

> **activate**: `string`[]

***

### GenericDiscrepancy

Defined in: [dom-verify-core.ts:71](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L71)

#### Properties

##### kind

> **kind**: [`GenericDiscrepancyKind`](#genericdiscrepancykind)

Defined in: [dom-verify-core.ts:72](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L72)

##### diagramId

> **diagramId**: `string`

Defined in: [dom-verify-core.ts:73](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L73)

##### elementId

> **elementId**: `string`

Defined in: [dom-verify-core.ts:74](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L74)

##### expected

> **expected**: `unknown`

Defined in: [dom-verify-core.ts:75](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L75)

##### actual

> **actual**: `unknown`

Defined in: [dom-verify-core.ts:76](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L76)

##### detail

> **detail**: `string`

Defined in: [dom-verify-core.ts:77](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L77)

***

### GenericVerifyOptions

Defined in: [dom-verify-core.ts:80](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L80)

#### Properties

##### positionTolerance?

> `optional` **positionTolerance?**: `number`

Defined in: [dom-verify-core.ts:81](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L81)

##### edgeEndpointTolerance?

> `optional` **edgeEndpointTolerance?**: `number`

Defined in: [dom-verify-core.ts:82](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L82)

##### particleTolerance?

> `optional` **particleTolerance?**: `number`

Defined in: [dom-verify-core.ts:83](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L83)

##### particleFrameCount?

> `optional` **particleFrameCount?**: `number`

Defined in: [dom-verify-core.ts:84](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L84)

##### particleConsecutiveFailThreshold?

> `optional` **particleConsecutiveFailThreshold?**: `number`

Defined in: [dom-verify-core.ts:85](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L85)

##### bboxTolerance?

> `optional` **bboxTolerance?**: `number`

Defined in: [dom-verify-core.ts:86](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L86)

##### skipBbox?

> `optional` **skipBbox?**: `boolean`

Defined in: [dom-verify-core.ts:87](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L87)

##### skipParticle?

> `optional` **skipParticle?**: `boolean`

Defined in: [dom-verify-core.ts:88](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L88)

##### skipPhase?

> `optional` **skipPhase?**: `boolean`

Defined in: [dom-verify-core.ts:89](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L89)

***

### DiagramAdapter

Defined in: [dom-verify-core.ts:116](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L116)

任意 diagram tool の adapter が満たすべき contract。

cdl の場合 ... CdlDiagram → GenericDiagramSpec を返す純関数。
Mermaid の場合 ... mermaid.parse() で AST 取得 → GenericDiagramSpec に変換。
D2 の場合 ... d2 CLI で JSON dump → GenericDiagramSpec に変換。

#### Type Parameters

##### DiagramType

`DiagramType`

#### Properties

##### name

> `readonly` **name**: `string`

Defined in: [dom-verify-core.ts:118](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L118)

diagram type 名 (例 "cdl" / "mermaid" / "d2")

#### Methods

##### toSpec()

> **toSpec**(`diagram`): [`GenericDiagramSpec`](#genericdiagramspec)

Defined in: [dom-verify-core.ts:120](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L120)

diagram 型から GenericDiagramSpec への変換

###### Parameters

###### diagram

`DiagramType`

###### Returns

[`GenericDiagramSpec`](#genericdiagramspec)

***

### PageLike

Defined in: [dom-verify-types.ts:11](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-types.ts#L11)

Playwright Page-like 抽象。 packages/cdl は Playwright を直接 import せず、
利用側で Page を渡す。 これで cdl が browser dependency 持たない。

#### Methods

##### $$eval()

> **$$eval**\<`T`\>(`selector`, `fn`): `Promise`\<`T`\>

Defined in: [dom-verify-types.ts:13](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-types.ts#L13)

querySelector の thin wrapper

###### Type Parameters

###### T

`T`

###### Parameters

###### selector

`string`

###### fn

(`els`) => `T`

###### Returns

`Promise`\<`T`\>

##### $eval()

> **$eval**\<`T`\>(`selector`, `fn`): `Promise`\<`T`\>

Defined in: [dom-verify-types.ts:14](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-types.ts#L14)

###### Type Parameters

###### T

`T`

###### Parameters

###### selector

`string`

###### fn

(`el`) => `T`

###### Returns

`Promise`\<`T`\>

##### evaluate()

> **evaluate**\<`T`, `A`\>(`fn`, `arg`): `Promise`\<`T`\>

Defined in: [dom-verify-types.ts:16](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-types.ts#L16)

任意 JS を browser context で evaluate

###### Type Parameters

###### T

`T`

###### A

`A`

###### Parameters

###### fn

(`arg`) => `T`

###### arg

`A`

###### Returns

`Promise`\<`T`\>

##### waitForTimeout()

> **waitForTimeout**(`ms`): `Promise`\<`void`\>

Defined in: [dom-verify-types.ts:18](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-types.ts#L18)

sleep (ms)

###### Parameters

###### ms

`number`

###### Returns

`Promise`\<`void`\>

##### click()

> **click**(`selector`): `Promise`\<`void`\>

Defined in: [dom-verify-types.ts:20](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-types.ts#L20)

click selector

###### Parameters

###### selector

`string`

###### Returns

`Promise`\<`void`\>

***

### Discrepancy

Defined in: [dom-verify.ts:30](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L30)

#### Properties

##### kind

> **kind**: [`DiscrepancyKind`](#discrepancykind)

Defined in: [dom-verify.ts:31](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L31)

##### diagramId

> **diagramId**: `string`

Defined in: [dom-verify.ts:32](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L32)

##### elementId

> **elementId**: `string`

Defined in: [dom-verify.ts:33](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L33)

##### expected

> **expected**: `unknown`

Defined in: [dom-verify.ts:34](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L34)

##### actual

> **actual**: `unknown`

Defined in: [dom-verify.ts:35](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L35)

##### detail

> **detail**: `string`

Defined in: [dom-verify.ts:36](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L36)

***

### VerifyOptions

Defined in: [dom-verify.ts:39](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L39)

#### Properties

##### positionTolerance?

> `optional` **positionTolerance?**: `number`

Defined in: [dom-verify.ts:41](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L41)

node 位置の許容誤差 (px、 default 2)

##### edgeEndpointTolerance?

> `optional` **edgeEndpointTolerance?**: `number`

Defined in: [dom-verify.ts:43](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L43)

edge path 起点終点と node 側面の許容誤差 (px、 default 4)

##### particleTolerance?

> `optional` **particleTolerance?**: `number`

Defined in: [dom-verify.ts:51](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L51)

particle 位置 vs path 上の点との許容誤差 (px、 default 250)。
Chrome / Firefox の animateMotion + getBoundingClientRect が animation 中の particle 位置を
必ずしも正確に返さない (frame 1 で static 0,0 fallback / mpath transform が screen CTM に反映されない 等)
ため、 user 視覚的に同 diagram 内で許容できる 250px (= 1 lane 程度) を default に。
実エンジン bug (particle が画面外 / 別 diagram 領域へ飛ぶ) は依然検知できる。

##### particleFrameCount?

> `optional` **particleFrameCount?**: `number`

Defined in: [dom-verify.ts:53](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L53)

particle 検証時の animation frame 撮影数 (default 8、 0.25s 間隔)

##### particleConsecutiveFailThreshold?

> `optional` **particleConsecutiveFailThreshold?**: `number`

Defined in: [dom-verify.ts:55](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L55)

particle が「path から外れている」 と判定する連続 frame 数の閾値 (default 3、 偶発的 1 frame ずれを許容)

##### bboxTolerance?

> `optional` **bboxTolerance?**: `number`

Defined in: [dom-verify.ts:57](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L57)

boundingBox 照合の許容誤差 (px、 viewBox transform scale を考慮するため大きめ default 8)

##### skipBbox?

> `optional` **skipBbox?**: `boolean`

Defined in: [dom-verify.ts:59](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L59)

boundingBox 照合を skip (高速 partial run 用)

##### skipParticle?

> `optional` **skipParticle?**: `boolean`

Defined in: [dom-verify.ts:61](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L61)

particle 検証を skip (animation がない static diagram 用)

##### skipPhase?

> `optional` **skipPhase?**: `boolean`

Defined in: [dom-verify.ts:63](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L63)

phase 切替検証を skip (single phase diagram 用)

***

### DomVerifyReport

Defined in: [dom-verify.ts:615](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L615)

複数 diagram を一括 verify。

#### Properties

##### total

> **total**: `number`

Defined in: [dom-verify.ts:616](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L616)

##### pass

> **pass**: `number`

Defined in: [dom-verify.ts:617](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L617)

##### fail

> **fail**: `number`

Defined in: [dom-verify.ts:618](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L618)

##### discrepancies

> **discrepancies**: [`Discrepancy`](#discrepancy)[]

Defined in: [dom-verify.ts:619](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L619)

***

### Violation

Defined in: [visual-validate.ts:22](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L22)

#### Properties

##### axis

> **axis**: [`VisualAxis`](#visualaxis)

Defined in: [visual-validate.ts:23](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L23)

##### diagramId

> **diagramId**: `string`

Defined in: [visual-validate.ts:24](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L24)

##### detail

> **detail**: `string`

Defined in: [visual-validate.ts:25](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L25)

##### severity

> **severity**: `"error"` \| `"warn"`

Defined in: [visual-validate.ts:26](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L26)

***

### VisualValidationReport

Defined in: [visual-validate.ts:37](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L37)

#### Properties

##### diagramId

> **diagramId**: `string`

Defined in: [visual-validate.ts:38](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L38)

##### ok

> **ok**: `boolean`

Defined in: [visual-validate.ts:39](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L39)

##### violations

> **violations**: [`Violation`](#violation)[]

Defined in: [visual-validate.ts:40](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L40)

##### counts

> **counts**: `Record`\<[`VisualAxis`](#visualaxis), `number`\>

Defined in: [visual-validate.ts:41](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L41)

***

### SweepReport

Defined in: [visual-validate.ts:208](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L208)

複数 diagram を sweep して合計 report を返す。

#### Properties

##### total

> **total**: `number`

Defined in: [visual-validate.ts:209](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L209)

##### pass

> **pass**: `number`

Defined in: [visual-validate.ts:210](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L210)

##### fail

> **fail**: `number`

Defined in: [visual-validate.ts:211](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L211)

##### reports

> **reports**: [`VisualValidationReport`](#visualvalidationreport)[]

Defined in: [visual-validate.ts:212](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L212)

##### totalCounts

> **totalCounts**: `Record`\<[`VisualAxis`](#visualaxis), `number`\>

Defined in: [visual-validate.ts:213](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L213)

## Type Aliases

### IntentDiscrepancyKind

> **IntentDiscrepancyKind** = `"node-outside-lane"` \| `"node-title-missing"` \| `"node-subtitle-missing"` \| `"node-eyebrow-missing"` \| `"edge-label-missing"` \| `"edge-sub-missing"` \| `"edge-disconnected-from-source"` \| `"edge-disconnected-from-target"` \| `"activation-not-visible"` \| `"tone-color-mismatch"`

Defined in: [author-intent-verify.ts:23](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L23)

***

### PhaseBuilder

> **PhaseBuilder** = `object`

Defined in: [builder.ts:16](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L16)

#### Properties

##### activate

> **activate**: (...`ids`) => [`PhaseBuilder`](#phasebuilder)

Defined in: [builder.ts:17](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L17)

###### Parameters

###### ids

...`string`[]

###### Returns

[`PhaseBuilder`](#phasebuilder)

##### tween

> **tween**: (`stateId`, `from`, `to`) => [`PhaseBuilder`](#phasebuilder)

Defined in: [builder.ts:19](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L19)

数値 state の線形補間 (write phase で 100→90 等)

###### Parameters

###### stateId

`string`

###### from

`number`

###### to

`number`

###### Returns

[`PhaseBuilder`](#phasebuilder)

##### set

> **set**: (`stateId`, `value`) => [`PhaseBuilder`](#phasebuilder)

Defined in: [builder.ts:21](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L21)

任意型 state を即時切替 (この phase 到達で value 上書き、 lerp なし)

###### Parameters

###### stateId

`string`

###### value

`string` \| `number`

###### Returns

[`PhaseBuilder`](#phasebuilder)

##### badge

> **badge**: (`text`) => [`PhaseBuilder`](#phasebuilder)

Defined in: [builder.ts:22](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L22)

###### Parameters

###### text

`string`

###### Returns

[`PhaseBuilder`](#phasebuilder)

***

### DiagramBuilder

> **DiagramBuilder** = `object`

Defined in: [builder.ts:56](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L56)

#### Properties

##### lane

> **lane**: (`id`, `opts`) => [`DiagramBuilder`](#diagrambuilder)

Defined in: [builder.ts:57](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L57)

###### Parameters

###### id

`string`

###### opts

`Omit`\<[`CdlLane`](#cdllane), `"id"`\>

###### Returns

[`DiagramBuilder`](#diagrambuilder)

##### node

> **node**: (`id`, `opts`) => [`DiagramBuilder`](#diagrambuilder)

Defined in: [builder.ts:58](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L58)

###### Parameters

###### id

`string`

###### opts

`Omit`\<[`CdlNode`](#cdlnode), `"id"`\>

###### Returns

[`DiagramBuilder`](#diagrambuilder)

##### edge

> **edge**: (`from`, `to`, `opts`) => [`DiagramBuilder`](#diagrambuilder)

Defined in: [builder.ts:59](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L59)

###### Parameters

###### from

`string`

###### to

`string`

###### opts

###### id?

`string`

edge id (省略時は `${from}-${to}` ベースで auto 生成、 重複時は連番付与)

###### label

`string`

###### sub?

`string`

###### tone?

[`Tone`](#tone-5)

tone (default "accent")

###### side?

[`Side`](#side)

###### style?

[`EdgeStyle`](#edgestyle)

###### guard?

`string`

FSM guard 条件、 text-dsl v0.5 inline option (`guard: "..."`) を CdlEdge.guard へ透過

###### cardinality?

`string`

ER 関係 cardinality、 text-dsl v0.5 inline option (`cardinality: "1:N"`) を CdlEdge.cardinality へ透過

###### labelOffsetX?

`number`

###### labelOffsetY?

`number`

###### routing?

`"default"` \| `"back-detour"`

###### Returns

[`DiagramBuilder`](#diagrambuilder)

##### nodes

> **nodes**: (`defs`) => [`DiagramBuilder`](#diagrambuilder)

Defined in: [builder.ts:84](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L84)

複数 node を 1 行で宣言する batch helper。

###### Parameters

###### defs

`object` & `Omit`\<[`CdlNode`](#cdlnode), `"id"`\>[]

###### Returns

[`DiagramBuilder`](#diagrambuilder)

###### Example

```ts
.nodes([{ id: "a", lane: "l", stack: 0, kind: "actor", title: "Alice" }, ...])
```

##### edges

> **edges**: (`defs`) => [`DiagramBuilder`](#diagrambuilder)

Defined in: [builder.ts:89](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L89)

複数 edge を 1 行で宣言する batch helper。

###### Parameters

###### defs

`object`[]

###### Returns

[`DiagramBuilder`](#diagrambuilder)

###### Example

```ts
.edges([{ from: "a", to: "b", label: "call" }, ...])
```

##### state

> **state**: (`id`, `opts`) => [`DiagramBuilder`](#diagrambuilder)

Defined in: [builder.ts:106](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L106)

###### Parameters

###### id

`string`

###### opts

`Omit`\<[`CdlState`](#cdlstate), `"id"`\>

###### Returns

[`DiagramBuilder`](#diagrambuilder)

##### phase

> **phase**: (`id`, `opts`, `build`) => [`DiagramBuilder`](#diagrambuilder)

Defined in: [builder.ts:107](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L107)

###### Parameters

###### id

`string`

###### opts

###### duration?

`number`

###### title

`string`

###### body

`string`

###### build

(`p`) => [`PhaseBuilder`](#phasebuilder)

###### Returns

[`DiagramBuilder`](#diagrambuilder)

##### build

> **build**: () => [`CdlDiagram`](#cdldiagram)

Defined in: [builder.ts:112](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L112)

###### Returns

[`CdlDiagram`](#cdldiagram)

***

### GenericDiscrepancyKind

> **GenericDiscrepancyKind** = `"missing-node-element"` \| `"missing-edge-element"` \| `"node-position-mismatch"` \| `"node-size-mismatch"` \| `"edge-path-endpoint-mismatch"` \| `"edge-label-position-mismatch"` \| `"particle-out-of-path"` \| `"activation-mismatch"` \| `"phase-transition-failure"`

Defined in: [dom-verify-core.ts:60](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify-core.ts#L60)

検証種別。

***

### DiscrepancyKind

> **DiscrepancyKind** = `"missing-node-element"` \| `"missing-edge-element"` \| `"node-position-mismatch"` \| `"node-size-mismatch"` \| `"edge-path-endpoint-mismatch"` \| `"edge-label-position-mismatch"` \| `"particle-out-of-path"` \| `"activation-mismatch"` \| `"phase-transition-failure"`

Defined in: [dom-verify.ts:19](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L19)

***

### SwimlanePreset

> **SwimlanePreset** = `object`

Defined in: [presets.ts:14](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L14)

高位 API ... 著者が「lane / node / edge を 1 件ずつ宣言」 する低位 API を簡略化。

- swimlane({ id, topic, lanes: ["送信元", "コントラクト", "出力"] }) で 3 lane 自動配置
- flow().step("A", "func").step("B", "storage").build() で sequence diagram 風

#### Properties

##### id

> **id**: `string`

Defined in: [presets.ts:15](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L15)

##### topic

> **topic**: `string`

Defined in: [presets.ts:16](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L16)

##### lanes

> **lanes**: `string`[]

Defined in: [presets.ts:18](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L18)

lane label の配列。 各 lane width は固定 (default 400)、 x は auto-layout

##### laneWidth?

> `optional` **laneWidth?**: `number`

Defined in: [presets.ts:20](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L20)

lane width (default 400)

##### contain?

> `optional` **contain?**: `boolean`

Defined in: [presets.ts:22](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L22)

各 lane が枠囲み contain か (default false、 true で全 lane contain)

***

### FlowStepInput

> **FlowStepInput** = `object`

Defined in: [presets.ts:63](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L63)

#### Properties

##### id

> **id**: `string`

Defined in: [presets.ts:64](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L64)

##### kind

> **kind**: [`NodeKind`](#nodekind)

Defined in: [presets.ts:65](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L65)

##### title

> **title**: `string`

Defined in: [presets.ts:66](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L66)

##### eyebrow?

> `optional` **eyebrow?**: `string`

Defined in: [presets.ts:67](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L67)

##### subtitle?

> `optional` **subtitle?**: `string`

Defined in: [presets.ts:68](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L68)

***

### FlowPreset

> **FlowPreset** = `object`

Defined in: [presets.ts:71](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L71)

#### Properties

##### id

> **id**: `string`

Defined in: [presets.ts:72](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L72)

##### topic

> **topic**: `string`

Defined in: [presets.ts:73](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L73)

##### laneLabel?

> `optional` **laneLabel?**: `string`

Defined in: [presets.ts:75](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L75)

lane label (1 本のみ、 全 step が縦 stack で並ぶ)

##### laneWidth?

> `optional` **laneWidth?**: `number`

Defined in: [presets.ts:76](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L76)

##### defaultTone?

> `optional` **defaultTone?**: [`Tone`](#tone-5)

Defined in: [presets.ts:78](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L78)

edge tone / style の default (各 step → next step の edge)

##### defaultStyle?

> `optional` **defaultStyle?**: [`EdgeStyle`](#edgestyle)

Defined in: [presets.ts:79](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L79)

***

### FlowBuilder

> **FlowBuilder** = `object`

Defined in: [presets.ts:82](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L82)

#### Properties

##### step

> **step**: (`node`, `edgeLabel?`) => [`FlowBuilder`](#flowbuilder)

Defined in: [presets.ts:84](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L84)

step を順番に追加、 自動で前 step から edge 接続

###### Parameters

###### node

[`FlowStepInput`](#flowstepinput)

###### edgeLabel?

`string`

###### Returns

[`FlowBuilder`](#flowbuilder)

##### build

> **build**: () => `ReturnType`\<[`DiagramBuilder`](#diagrambuilder)\[`"build"`\]\>

Defined in: [presets.ts:85](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L85)

###### Returns

`ReturnType`\<[`DiagramBuilder`](#diagrambuilder)\[`"build"`\]\>

***

### SequenceStep

> **SequenceStep** = `object`

Defined in: [presets.ts:148](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L148)

#### Properties

##### from

> **from**: `string`

Defined in: [presets.ts:150](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L150)

from actor id (or label slug)

##### to

> **to**: `string`

Defined in: [presets.ts:152](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L152)

to actor id (or label slug)

##### label

> **label**: `string`

Defined in: [presets.ts:154](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L154)

message label

##### sub?

> `optional` **sub?**: `string`

Defined in: [presets.ts:156](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L156)

補足 (2 行目、 例 ... POST /login の body 仕様等)

##### tone?

> `optional` **tone?**: [`Tone`](#tone-5)

Defined in: [presets.ts:157](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L157)

##### style?

> `optional` **style?**: [`EdgeStyle`](#edgestyle)

Defined in: [presets.ts:158](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L158)

***

### SequencePreset

> **SequencePreset** = `object`

Defined in: [presets.ts:161](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L161)

#### Properties

##### id

> **id**: `string`

Defined in: [presets.ts:162](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L162)

##### topic

> **topic**: `string`

Defined in: [presets.ts:163](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L163)

##### actors

> **actors**: `string`[]

Defined in: [presets.ts:165](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L165)

actor label の配列 (lifeline、 column 単位)

##### laneWidth?

> `optional` **laneWidth?**: `number`

Defined in: [presets.ts:167](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L167)

actor の lane width (default 220)

##### laneGap?

> `optional` **laneGap?**: `number`

Defined in: [presets.ts:169](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L169)

lane gap (default 60)

##### defaultTone?

> `optional` **defaultTone?**: [`Tone`](#tone-5)

Defined in: [presets.ts:171](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L171)

default edge tone (default accent)

##### defaultStyle?

> `optional` **defaultStyle?**: [`EdgeStyle`](#edgestyle)

Defined in: [presets.ts:173](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L173)

default edge style (default solid)

***

### SequenceBuilder

> **SequenceBuilder** = `object`

Defined in: [presets.ts:176](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L176)

#### Properties

##### step

> **step**: (`s`) => [`SequenceBuilder`](#sequencebuilder)

Defined in: [presets.ts:178](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L178)

message step を時系列順に追加、 from → to の水平 edge を引く

###### Parameters

###### s

[`SequenceStep`](#sequencestep)

###### Returns

[`SequenceBuilder`](#sequencebuilder)

##### build

> **build**: () => `ReturnType`\<[`DiagramBuilder`](#diagrambuilder)\[`"build"`\]\>

Defined in: [presets.ts:179](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L179)

###### Returns

`ReturnType`\<[`DiagramBuilder`](#diagrambuilder)\[`"build"`\]\>

***

### TopologyContainer

> **TopologyContainer** = `object`

Defined in: [presets.ts:273](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L273)

#### Properties

##### id

> **id**: `string`

Defined in: [presets.ts:274](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L274)

##### kind

> **kind**: [`NodeKind`](#nodekind)

Defined in: [presets.ts:275](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L275)

##### title

> **title**: `string`

Defined in: [presets.ts:276](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L276)

##### eyebrow?

> `optional` **eyebrow?**: `string`

Defined in: [presets.ts:277](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L277)

***

### TopologyConnection

> **TopologyConnection** = `object`

Defined in: [presets.ts:280](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L280)

#### Properties

##### from

> **from**: `string`

Defined in: [presets.ts:281](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L281)

##### to

> **to**: `string`

Defined in: [presets.ts:282](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L282)

##### label

> **label**: `string`

Defined in: [presets.ts:283](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L283)

##### sub?

> `optional` **sub?**: `string`

Defined in: [presets.ts:284](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L284)

##### tone?

> `optional` **tone?**: [`Tone`](#tone-5)

Defined in: [presets.ts:285](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L285)

##### style?

> `optional` **style?**: [`EdgeStyle`](#edgestyle)

Defined in: [presets.ts:286](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L286)

##### labelOffsetX?

> `optional` **labelOffsetX?**: `number`

Defined in: [presets.ts:287](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L287)

##### labelOffsetY?

> `optional` **labelOffsetY?**: `number`

Defined in: [presets.ts:288](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L288)

***

### TopologyPreset

> **TopologyPreset** = `object`

Defined in: [presets.ts:291](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L291)

#### Properties

##### id

> **id**: `string`

Defined in: [presets.ts:292](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L292)

##### topic

> **topic**: `string`

Defined in: [presets.ts:293](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L293)

##### groupWidth?

> `optional` **groupWidth?**: `number`

Defined in: [presets.ts:295](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L295)

group の lane width (default 360)

##### defaultTone?

> `optional` **defaultTone?**: [`Tone`](#tone-5)

Defined in: [presets.ts:296](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L296)

##### defaultStyle?

> `optional` **defaultStyle?**: [`EdgeStyle`](#edgestyle)

Defined in: [presets.ts:297](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L297)

***

### TopologyGroupBuilder

> **TopologyGroupBuilder** = `object`

Defined in: [presets.ts:300](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L300)

#### Properties

##### add

> **add**: (`container`) => [`TopologyGroupBuilder`](#topologygroupbuilder)

Defined in: [presets.ts:301](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L301)

###### Parameters

###### container

[`TopologyContainer`](#topologycontainer)

###### Returns

[`TopologyGroupBuilder`](#topologygroupbuilder)

***

### TopologyBuilder

> **TopologyBuilder** = `object`

Defined in: [presets.ts:304](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L304)

#### Properties

##### group

> **group**: (`id`, `opts`) => [`TopologyGroupBuilder`](#topologygroupbuilder)

Defined in: [presets.ts:305](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L305)

###### Parameters

###### id

`string`

###### opts

###### label

`string`

###### Returns

[`TopologyGroupBuilder`](#topologygroupbuilder)

##### connect

> **connect**: (`from`, `to`, `opts`) => [`TopologyBuilder`](#topologybuilder)

Defined in: [presets.ts:306](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L306)

###### Parameters

###### from

`string`

###### to

`string`

###### opts

###### label

`string`

###### sub?

`string`

###### tone?

[`Tone`](#tone-5)

###### style?

[`EdgeStyle`](#edgestyle)

###### labelOffsetX?

`number`

###### labelOffsetY?

`number`

###### Returns

[`TopologyBuilder`](#topologybuilder)

##### build

> **build**: () => `ReturnType`\<[`DiagramBuilder`](#diagrambuilder)\[`"build"`\]\>

Defined in: [presets.ts:311](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L311)

###### Returns

`ReturnType`\<[`DiagramBuilder`](#diagrambuilder)\[`"build"`\]\>

***

### ErEntity

> **ErEntity** = `object`

Defined in: [presets.ts:406](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L406)

#### Properties

##### id

> **id**: `string`

Defined in: [presets.ts:407](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L407)

##### title

> **title**: `string`

Defined in: [presets.ts:409](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L409)

entity 名 (例 "User")

##### rows

> **rows**: `string`[]

Defined in: [presets.ts:411](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L411)

列定義 (例 "id: PK", "email: string", "userId: FK")

***

### ErRelationCardinality

> **ErRelationCardinality** = `"1:1"` \| `"1:N"` \| `"N:1"` \| `"N:M"` \| `"0..1"` \| `"1..*"`

Defined in: [presets.ts:414](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L414)

***

### ErRelation

> **ErRelation** = `object`

Defined in: [presets.ts:416](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L416)

#### Properties

##### from

> **from**: `string`

Defined in: [presets.ts:417](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L417)

##### to

> **to**: `string`

Defined in: [presets.ts:418](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L418)

##### cardinality

> **cardinality**: [`ErRelationCardinality`](#errelationcardinality)

Defined in: [presets.ts:419](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L419)

##### label?

> `optional` **label?**: `string`

Defined in: [presets.ts:421](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L421)

関係名 (例 "places", "belongs_to")

##### tone?

> `optional` **tone?**: [`Tone`](#tone-5)

Defined in: [presets.ts:422](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L422)

***

### ErPreset

> **ErPreset** = `object`

Defined in: [presets.ts:425](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L425)

#### Properties

##### id

> **id**: `string`

Defined in: [presets.ts:426](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L426)

##### topic

> **topic**: `string`

Defined in: [presets.ts:427](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L427)

##### defaultTone?

> `optional` **defaultTone?**: [`Tone`](#tone-5)

Defined in: [presets.ts:428](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L428)

##### entityWidth?

> `optional` **entityWidth?**: `number`

Defined in: [presets.ts:430](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L430)

entity を横並びにする lane width (default 360)

***

### ErBuilder

> **ErBuilder** = `object`

Defined in: [presets.ts:433](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L433)

#### Properties

##### entity

> **entity**: (`e`) => [`ErBuilder`](#erbuilder)

Defined in: [presets.ts:434](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L434)

###### Parameters

###### e

[`ErEntity`](#erentity)

###### Returns

[`ErBuilder`](#erbuilder)

##### relation

> **relation**: (`r`) => [`ErBuilder`](#erbuilder)

Defined in: [presets.ts:435](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L435)

###### Parameters

###### r

[`ErRelation`](#errelation)

###### Returns

[`ErBuilder`](#erbuilder)

##### build

> **build**: () => `ReturnType`\<[`DiagramBuilder`](#diagrambuilder)\[`"build"`\]\>

Defined in: [presets.ts:436](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L436)

###### Returns

`ReturnType`\<[`DiagramBuilder`](#diagrambuilder)\[`"build"`\]\>

***

### FsmState

> **FsmState** = `object`

Defined in: [presets.ts:508](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L508)

#### Properties

##### id

> **id**: `string`

Defined in: [presets.ts:509](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L509)

##### title

> **title**: `string`

Defined in: [presets.ts:510](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L510)

##### initial?

> `optional` **initial?**: `boolean`

Defined in: [presets.ts:512](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L512)

initial state (1 つだけ)

##### final?

> `optional` **final?**: `boolean`

Defined in: [presets.ts:514](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L514)

final state (複数可)

***

### FsmTransition

> **FsmTransition** = `object`

Defined in: [presets.ts:517](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L517)

#### Properties

##### from

> **from**: `string`

Defined in: [presets.ts:518](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L518)

##### to

> **to**: `string`

Defined in: [presets.ts:519](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L519)

##### trigger

> **trigger**: `string`

Defined in: [presets.ts:521](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L521)

遷移 trigger (例 "submit" / "success" / "fail")

##### guard?

> `optional` **guard?**: `string`

Defined in: [presets.ts:523](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L523)

guard 条件 (例 "if validated")

##### tone?

> `optional` **tone?**: [`Tone`](#tone-5)

Defined in: [presets.ts:524](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L524)

***

### StateMachinePreset

> **StateMachinePreset** = `object`

Defined in: [presets.ts:527](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L527)

#### Properties

##### id

> **id**: `string`

Defined in: [presets.ts:528](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L528)

##### topic

> **topic**: `string`

Defined in: [presets.ts:529](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L529)

##### defaultTone?

> `optional` **defaultTone?**: [`Tone`](#tone-5)

Defined in: [presets.ts:530](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L530)

##### stateWidth?

> `optional` **stateWidth?**: `number`

Defined in: [presets.ts:531](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L531)

***

### StateMachineBuilder

> **StateMachineBuilder** = `object`

Defined in: [presets.ts:534](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L534)

#### Properties

##### state

> **state**: (`s`) => [`StateMachineBuilder`](#statemachinebuilder)

Defined in: [presets.ts:535](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L535)

###### Parameters

###### s

[`FsmState`](#fsmstate)

###### Returns

[`StateMachineBuilder`](#statemachinebuilder)

##### transition

> **transition**: (`t`) => [`StateMachineBuilder`](#statemachinebuilder)

Defined in: [presets.ts:536](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L536)

###### Parameters

###### t

[`FsmTransition`](#fsmtransition)

###### Returns

[`StateMachineBuilder`](#statemachinebuilder)

##### build

> **build**: () => `ReturnType`\<[`DiagramBuilder`](#diagrambuilder)\[`"build"`\]\>

Defined in: [presets.ts:537](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L537)

###### Returns

`ReturnType`\<[`DiagramBuilder`](#diagrambuilder)\[`"build"`\]\>

***

### PresetType

> **PresetType** = `"sequence"` \| `"flow"` \| `"swimlane"` \| `"er"` \| `"state"` \| `"topology"` \| `"solidity"` \| `"gantt"` \| `"class"` \| `"pie"` \| `"c4"` \| `"mind"`

Defined in: [text-dsl/types.ts:8](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L8)

***

### DslDocument

> **DslDocument** = `object`

Defined in: [text-dsl/types.ts:28](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L28)

トップレベル AST

#### Properties

##### title

> **title**: `string`

Defined in: [text-dsl/types.ts:29](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L29)

##### type

> **type**: [`PresetType`](#presettype)

Defined in: [text-dsl/types.ts:30](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L30)

##### actors

> **actors**: [`DslActor`](#dslactor)[]

Defined in: [text-dsl/types.ts:31](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L31)

##### flow

> **flow**: [`DslStep`](#dslstep)[]

Defined in: [text-dsl/types.ts:32](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L32)

##### animate?

> `optional` **animate?**: [`DslAnimate`](#dslanimate)

Defined in: [text-dsl/types.ts:33](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L33)

##### viewport?

> `optional` **viewport?**: `DslViewport`

Defined in: [text-dsl/types.ts:35](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L35)

v0.5+ 拡張 ... viewport / lanes / groups

##### lanes?

> `optional` **lanes?**: `Record`\<`string`, `DslLane`\>

Defined in: [text-dsl/types.ts:36](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L36)

##### groups?

> `optional` **groups?**: `Record`\<`string`, `DslGroup`\>

Defined in: [text-dsl/types.ts:37](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L37)

##### pos

> **pos**: `Position`

Defined in: [text-dsl/types.ts:38](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L38)

***

### DslActor

> **DslActor** = `object`

Defined in: [text-dsl/types.ts:42](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L42)

登場人物 (v0.5+ ... inline option 拡張)

#### Properties

##### name

> **name**: `string`

Defined in: [text-dsl/types.ts:43](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L43)

##### kind

> **kind**: [`NodeKind`](#nodekind)

Defined in: [text-dsl/types.ts:44](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L44)

##### subtitle?

> `optional` **subtitle?**: `string`

Defined in: [text-dsl/types.ts:46](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L46)

v0.5+ inline option

##### eyebrow?

> `optional` **eyebrow?**: `string`

Defined in: [text-dsl/types.ts:47](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L47)

##### value?

> `optional` **value?**: `string`

Defined in: [text-dsl/types.ts:48](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L48)

##### rows?

> `optional` **rows?**: `string`[]

Defined in: [text-dsl/types.ts:49](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L49)

##### lane?

> `optional` **lane?**: `string`

Defined in: [text-dsl/types.ts:50](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L50)

##### stack?

> `optional` **stack?**: `number`

Defined in: [text-dsl/types.ts:51](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L51)

##### initial?

> `optional` **initial?**: `boolean`

Defined in: [text-dsl/types.ts:52](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L52)

##### final?

> `optional` **final?**: `boolean`

Defined in: [text-dsl/types.ts:53](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L53)

##### pos

> **pos**: `Position`

Defined in: [text-dsl/types.ts:54](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L54)

***

### DslStep

> **DslStep** = `object`

Defined in: [text-dsl/types.ts:58](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L58)

流れ (1 行 = 1 step) (v0.5+ ... inline option 拡張)

#### Properties

##### no

> **no**: `number`

Defined in: [text-dsl/types.ts:59](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L59)

##### from

> **from**: `string`

Defined in: [text-dsl/types.ts:60](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L60)

##### to

> **to**: `string`

Defined in: [text-dsl/types.ts:61](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L61)

##### label

> **label**: `string`

Defined in: [text-dsl/types.ts:62](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L62)

##### sub?

> `optional` **sub?**: `string`

Defined in: [text-dsl/types.ts:63](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L63)

##### tone?

> `optional` **tone?**: [`Tone`](#tone-5)

Defined in: [text-dsl/types.ts:64](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L64)

##### style?

> `optional` **style?**: [`EdgeStyle`](#edgestyle)

Defined in: [text-dsl/types.ts:65](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L65)

##### guard?

> `optional` **guard?**: `string`

Defined in: [text-dsl/types.ts:67](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L67)

v0.5+ inline option

##### cardinality?

> `optional` **cardinality?**: `string`

Defined in: [text-dsl/types.ts:68](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L68)

##### labelOffsetX?

> `optional` **labelOffsetX?**: `number`

Defined in: [text-dsl/types.ts:69](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L69)

##### labelOffsetY?

> `optional` **labelOffsetY?**: `number`

Defined in: [text-dsl/types.ts:70](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L70)

##### pos

> **pos**: `Position`

Defined in: [text-dsl/types.ts:71](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L71)

***

### DslAnimate

> **DslAnimate** = `object`

Defined in: [text-dsl/types.ts:110](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L110)

アニメーション ブロック

#### Properties

##### states

> **states**: [`DslState`](#dslstate)[]

Defined in: [text-dsl/types.ts:111](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L111)

##### phases

> **phases**: [`DslPhase`](#dslphase)[]

Defined in: [text-dsl/types.ts:112](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L112)

##### pos

> **pos**: `Position`

Defined in: [text-dsl/types.ts:113](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L113)

***

### DslState

> **DslState** = `object`

Defined in: [text-dsl/types.ts:117](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L117)

状態宣言

#### Properties

##### name

> **name**: `string`

Defined in: [text-dsl/types.ts:118](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L118)

##### initial

> **initial**: `number` \| `string`

Defined in: [text-dsl/types.ts:119](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L119)

##### pos

> **pos**: `Position`

Defined in: [text-dsl/types.ts:120](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L120)

***

### DslPhase

> **DslPhase** = `object`

Defined in: [text-dsl/types.ts:124](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L124)

ステップ (phase)

#### Properties

##### name

> **name**: `string`

Defined in: [text-dsl/types.ts:125](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L125)

##### durationMs

> **durationMs**: `number`

Defined in: [text-dsl/types.ts:126](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L126)

##### highlight?

> `optional` **highlight?**: `string`[]

Defined in: [text-dsl/types.ts:127](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L127)

##### tweens?

> `optional` **tweens?**: [`DslTween`](#dsltween)[]

Defined in: [text-dsl/types.ts:128](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L128)

##### sets?

> `optional` **sets?**: [`DslSet`](#dslset)[]

Defined in: [text-dsl/types.ts:129](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L129)

##### body?

> `optional` **body?**: `string`

Defined in: [text-dsl/types.ts:130](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L130)

##### badge?

> `optional` **badge?**: `string`

Defined in: [text-dsl/types.ts:131](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L131)

##### pos

> **pos**: `Position`

Defined in: [text-dsl/types.ts:132](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L132)

***

### DslTween

> **DslTween** = `object`

Defined in: [text-dsl/types.ts:136](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L136)

state lerp (遷移)

#### Properties

##### state

> **state**: `string`

Defined in: [text-dsl/types.ts:137](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L137)

##### from

> **from**: `number`

Defined in: [text-dsl/types.ts:138](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L138)

##### to

> **to**: `number`

Defined in: [text-dsl/types.ts:139](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L139)

##### pos

> **pos**: `Position`

Defined in: [text-dsl/types.ts:140](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L140)

***

### DslSet

> **DslSet** = `object`

Defined in: [text-dsl/types.ts:144](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L144)

state 即時遷移 (切替)

#### Properties

##### state

> **state**: `string`

Defined in: [text-dsl/types.ts:145](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L145)

##### value

> **value**: `string` \| `number`

Defined in: [text-dsl/types.ts:146](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L146)

##### pos

> **pos**: `Position`

Defined in: [text-dsl/types.ts:147](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L147)

***

### DslError

> **DslError** = `object`

Defined in: [text-dsl/types.ts:151](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L151)

Parser error (行番号付き)

#### Properties

##### line

> **line**: `number`

Defined in: [text-dsl/types.ts:152](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L152)

##### message

> **message**: `string`

Defined in: [text-dsl/types.ts:153](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L153)

##### hint?

> `optional` **hint?**: `string`

Defined in: [text-dsl/types.ts:154](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/types.ts#L154)

***

### Tone

> **Tone** = `"accent"` \| `"teal"` \| `"success"` \| `"error"` \| `"warning"` \| `"info"`

Defined in: [types.ts:1](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L1)

***

### NodeKind

> **NodeKind** = `"actor"` \| `"function"` \| `"storage"` \| `"event"` \| `"card"` \| `"person"` \| `"user-group"` \| `"admin"` \| `"developer"` \| `"external-user"` \| `"database"` \| `"cache"` \| `"queue"` \| `"message-bus"` \| `"cloud"` \| `"cdn"` \| `"service"` \| `"api"` \| `"frontend"` \| `"backend"` \| `"webhook"` \| `"microservice"` \| `"wallet"` \| `"validator"` \| `"miner"` \| `"blockchain-node"` \| `"mempool"` \| `"block"` \| `"bridge-node"` \| `"relayer"` \| `"signer"` \| `"oracle"` \| `"merkle-tree"` \| `"decision"` \| `"contract"` \| `"eoa"` \| `"multisig"` \| `"proxy"` \| `"library"` \| `"interface"`

Defined in: [types.ts:3](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L3)

***

### Side

> **Side** = `"top"` \| `"right"` \| `"bottom"` \| `"left"`

Defined in: [types.ts:19](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L19)

***

### EdgeStyle

> **EdgeStyle** = `"solid"` \| `"dotted-flow"`

Defined in: [types.ts:27](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L27)

edge の visual style variant。
- "solid" (default) ... 実線 + 矢頭、 inactive は dashed grey
- "dotted-flow" ... 点線 + active phase で粒子が path 沿いに流れる。
  path が経由 node を貫通する場合は自動で粒子が node 中心を貫通する動きに切替。

***

### CdlLane

> **CdlLane** = `object`

Defined in: [types.ts:29](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L29)

#### Properties

##### id

> **id**: `string`

Defined in: [types.ts:30](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L30)

##### x?

> `optional` **x?**: `number`

Defined in: [types.ts:32](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L32)

lane の x 座標 (optional、 未指定なら engine が前 lane 右端 + gap で auto 計算)

##### width

> **width**: `number`

Defined in: [types.ts:33](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L33)

##### label?

> `optional` **label?**: `string`

Defined in: [types.ts:34](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L34)

##### contain?

> `optional` **contain?**: `boolean`

Defined in: [types.ts:35](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L35)

##### lifeline?

> `optional` **lifeline?**: `boolean`

Defined in: [types.ts:37](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L37)

UML sequence diagram の lifeline (= lane の中央 x に縦の点線を描画)

***

### CdlNode

> **CdlNode** = `object`

Defined in: [types.ts:40](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L40)

#### Properties

##### id

> **id**: `string`

Defined in: [types.ts:41](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L41)

##### lane

> **lane**: `string`

Defined in: [types.ts:42](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L42)

##### stack

> **stack**: `number`

Defined in: [types.ts:43](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L43)

##### kind

> **kind**: [`NodeKind`](#nodekind)

Defined in: [types.ts:44](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L44)

##### title

> **title**: `string`

Defined in: [types.ts:45](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L45)

##### eyebrow?

> `optional` **eyebrow?**: `string`

Defined in: [types.ts:46](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L46)

##### subtitle?

> `optional` **subtitle?**: `string`

Defined in: [types.ts:47](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L47)

##### value?

> `optional` **value?**: `string`

Defined in: [types.ts:49](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L49)

mono 数値表示用、 `{stateId}` を含めれば state 値で動的置換

##### rows?

> `optional` **rows?**: `string`[]

Defined in: [types.ts:51](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L51)

kind=storage 時の行 (各 mono、 state 参照可)

##### w?

> `optional` **w?**: `number`

Defined in: [types.ts:53](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L53)

width override (default は NodeKind 別 NODE_SIZE)、 catalog thumbnail 用に縮小可

##### h?

> `optional` **h?**: `number`

Defined in: [types.ts:55](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L55)

height override

***

### CdlEdge

> **CdlEdge** = `object`

Defined in: [types.ts:58](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L58)

#### Properties

##### id

> **id**: `string`

Defined in: [types.ts:59](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L59)

##### from

> **from**: `string`

Defined in: [types.ts:60](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L60)

##### to

> **to**: `string`

Defined in: [types.ts:61](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L61)

##### label

> **label**: `string`

Defined in: [types.ts:62](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L62)

##### sub?

> `optional` **sub?**: `string`

Defined in: [types.ts:63](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L63)

##### tone

> **tone**: [`Tone`](#tone-5)

Defined in: [types.ts:64](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L64)

##### side?

> `optional` **side?**: [`Side`](#side)

Defined in: [types.ts:65](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L65)

##### style?

> `optional` **style?**: [`EdgeStyle`](#edgestyle)

Defined in: [types.ts:67](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L67)

visual style、 default "solid"

##### guard?

> `optional` **guard?**: `string`

Defined in: [types.ts:72](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L72)

FSM transition の guard 条件 (例 "if validated")。
stateMachine preset では sub に併合される、 text-dsl v0.5 では guard 単独で渡せる。

##### cardinality?

> `optional` **cardinality?**: `string`

Defined in: [types.ts:77](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L77)

ER 関係 cardinality を author が宣言した文字列 (例 "1:N" / "N:M" / "1..*")。
compileEr 経路で edge label に "(1:N)" 形式で併記、 他 preset では透過。

##### labelOffsetX?

> `optional` **labelOffsetX?**: `number`

Defined in: [types.ts:79](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L79)

label の x 方向 fine offset (default 0)、 著者が細かく位置調整するための逃げ道

##### labelOffsetY?

> `optional` **labelOffsetY?**: `number`

Defined in: [types.ts:81](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L81)

label の y 方向 fine offset (default 0、 + で下、 - で上)

##### routing?

> `optional` **routing?**: `"default"` \| `"back-detour"`

Defined in: [types.ts:83](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L83)

routing mode (default "default" = 自動 routing、 "back-detour" = back transition 用の上方 detour 強制)

***

### CdlState

> **CdlState** = `object`

Defined in: [types.ts:86](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L86)

#### Properties

##### id

> **id**: `string`

Defined in: [types.ts:87](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L87)

##### initial

> **initial**: `number` \| `string`

Defined in: [types.ts:88](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L88)

***

### CdlPhase

> **CdlPhase** = `object`

Defined in: [types.ts:91](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L91)

#### Properties

##### id

> **id**: `string`

Defined in: [types.ts:92](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L92)

##### duration

> **duration**: `number`

Defined in: [types.ts:93](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L93)

##### title

> **title**: `string`

Defined in: [types.ts:94](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L94)

##### body

> **body**: `string`

Defined in: [types.ts:95](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L95)

##### activate

> **activate**: `string`[]

Defined in: [types.ts:96](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L96)

##### tweens

> **tweens**: `object`[]

Defined in: [types.ts:98](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L98)

数値 state の線形補間 (write phase で 100→90 等)

###### stateId

> **stateId**: `string`

###### from

> **from**: `number`

###### to

> **to**: `number`

##### sets

> **sets**: `object`[]

Defined in: [types.ts:100](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L100)

任意型 state の即時切替 (この phase に到達したら値を上書き、 lerp なし)

###### stateId

> **stateId**: `string`

###### value

> **value**: `string` \| `number`

##### badge?

> `optional` **badge?**: `string`

Defined in: [types.ts:101](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L101)

***

### CdlDiagram

> **CdlDiagram** = `object`

Defined in: [types.ts:104](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L104)

#### Properties

##### id

> **id**: `string`

Defined in: [types.ts:105](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L105)

##### topic

> **topic**: `string`

Defined in: [types.ts:106](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L106)

##### lanes

> **lanes**: [`CdlLane`](#cdllane)[]

Defined in: [types.ts:107](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L107)

##### nodes

> **nodes**: [`CdlNode`](#cdlnode)[]

Defined in: [types.ts:108](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L108)

##### edges

> **edges**: [`CdlEdge`](#cdledge)[]

Defined in: [types.ts:109](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L109)

##### states

> **states**: [`CdlState`](#cdlstate)[]

Defined in: [types.ts:110](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L110)

##### phases

> **phases**: [`CdlPhase`](#cdlphase)[]

Defined in: [types.ts:111](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L111)

##### viewport?

> `optional` **viewport?**: `CdlViewport`

Defined in: [types.ts:113](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L113)

v0.5+ ... canvas 全体仕様 (viewport.width / height で全体 size を author が宣言)

***

### LaidLane

> **LaidLane** = `Omit`\<[`CdlLane`](#cdllane), `"x"`\> & `object`

Defined in: [types.ts:135](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L135)

Layout 計算結果 (compile 後)、 lane.x は layout で必須解決

#### Type Declaration

##### x

> **x**: `number`

##### y

> **y**: `number`

##### height

> **height**: `number`

***

### LaidNode

> **LaidNode** = [`CdlNode`](#cdlnode) & `object`

Defined in: [types.ts:141](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L141)

#### Type Declaration

##### cx

> **cx**: `number`

##### cy

> **cy**: `number`

##### w

> **w**: `number`

##### h

> **h**: `number`

##### insideContainedLane

> **insideContainedLane**: `boolean`

lane が描く boundary 内側に居るか

***

### LaidEdge

> **LaidEdge** = [`CdlEdge`](#cdledge) & `object`

Defined in: [types.ts:150](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L150)

#### Type Declaration

##### d

> **d**: `string`

線 dot 用の visible path d (node 端で stop、 node 内を貫通しない)

##### dThrough?

> `optional` **dThrough?**: `string`

進行点 glow 用の hidden path d (style="dotted-through" のみ生成、 node 中心同士)。
粒子の animateMotion mpath 参照先として使い、 粒子が node を貫通する視覚を作る。

##### fromSide

> **fromSide**: [`Side`](#side)

##### toSide

> **toSide**: [`Side`](#side)

##### labelX

> **labelX**: `number`

##### labelY

> **labelY**: `number`

##### labelAnchor

> **labelAnchor**: `"start"` \| `"middle"` \| `"end"`

***

### LaidDiagram

> **LaidDiagram** = `object`

Defined in: [types.ts:184](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L184)

#### Properties

##### id

> **id**: `string`

Defined in: [types.ts:185](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L185)

##### topic

> **topic**: `string`

Defined in: [types.ts:186](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L186)

##### viewBox

> **viewBox**: `object`

Defined in: [types.ts:187](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L187)

###### x

> **x**: `number`

###### y

> **y**: `number`

###### w

> **w**: `number`

###### h

> **h**: `number`

##### lanes

> **lanes**: [`LaidLane`](#laidlane)[]

Defined in: [types.ts:188](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L188)

##### nodes

> **nodes**: [`LaidNode`](#laidnode)[]

Defined in: [types.ts:189](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L189)

##### edges

> **edges**: [`LaidEdge`](#laidedge)[]

Defined in: [types.ts:190](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L190)

##### states

> **states**: [`CdlState`](#cdlstate)[]

Defined in: [types.ts:191](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L191)

##### phases

> **phases**: [`CdlPhase`](#cdlphase)[]

Defined in: [types.ts:192](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L192)

##### bboxes

> **bboxes**: `BBox`[]

Defined in: [types.ts:197](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L197)

キャンバス全要素の bounding box list。
engine が「ここに何があるか」 を全部把握、 衝突検証 / debug 表示 / validation で使う。

##### collisions

> **collisions**: `object`[]

Defined in: [types.ts:199](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L199)

layout で検出された overlap warning list (engine が認識した衝突)

###### a

> **a**: `BBox`

###### b

> **b**: `BBox`

###### overlap\_area

> **overlap\_area**: `number`

##### nearCollisions

> **nearCollisions**: `object`[]

Defined in: [types.ts:204](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/types.ts#L204)

near-collision = 矩形交差はないが clearance (N px) 未満で接近している組合せ。
詰まって見える箇所を engine が機械検出するための情報源。

###### a

> **a**: `BBox`

###### b

> **b**: `BBox`

###### gap

> **gap**: `number`

###### required

> **required**: `number`

***

### VisualAxis

> **VisualAxis** = `"node-visibility"` \| `"edge-label-overlap"` \| `"text-readability"` \| `"row-format"` \| `"alignment"` \| `"clearance"`

Defined in: [visual-validate.ts:29](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L29)

## Variables

### cdlAdapter

> `const` **cdlAdapter**: [`DiagramAdapter`](#diagramadapter)\<[`CdlDiagram`](#cdldiagram)\>

Defined in: [dom-verify.ts:649](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L649)

cdl-adapter: CdlDiagram → GenericDiagramSpec への変換 (目 v4 library 化前段)。

将来 @chainome/diagram-verifier を独立 npm publish する際、
dom-verify-core.ts (generic) + 本 adapter (cdl 用) の 2 層構成にする。
同様の adapter を Mermaid / D2 / 任意 SVG tool 用に増やせる構造。

## Functions

### verifyAuthorIntent()

> **verifyAuthorIntent**(`page`, `diagram`, `options?`): `Promise`\<[`IntentDiscrepancy`](#intentdiscrepancy)[]\>

Defined in: [author-intent-verify.ts:79](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L79)

1 つの diagram について 6 軸検証を全部走らせる。

#### Parameters

##### page

[`PageLike`](#pagelike)

##### diagram

[`CdlDiagram`](#cdldiagram)

##### options?

[`AuthorIntentOptions`](#authorintentoptions) = `{}`

#### Returns

`Promise`\<[`IntentDiscrepancy`](#intentdiscrepancy)[]\>

***

### verifyAuthorIntentAll()

> **verifyAuthorIntentAll**(`page`, `diagrams`, `options?`): `Promise`\<[`AuthorIntentReport`](#authorintentreport)\>

Defined in: [author-intent-verify.ts:578](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/author-intent-verify.ts#L578)

#### Parameters

##### page

[`PageLike`](#pagelike)

##### diagrams

[`CdlDiagram`](#cdldiagram)[]

##### options?

[`AuthorIntentOptions`](#authorintentoptions)

#### Returns

`Promise`\<[`AuthorIntentReport`](#authorintentreport)\>

***

### diagram()

> **diagram**(`id`, `options`): [`DiagramBuilder`](#diagrambuilder)

Defined in: [builder.ts:115](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/builder.ts#L115)

#### Parameters

##### id

`string`

##### options

###### topic

`string`

#### Returns

[`DiagramBuilder`](#diagrambuilder)

***

### compile()

> **compile**(`diag`): [`LaidDiagram`](#laiddiagram)

Defined in: [compile.ts:9](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/compile.ts#L9)

compile = validate → layout で LaidDiagram を返す。
render は別 file (render.tsx) が LaidDiagram を消費。

#### Parameters

##### diag

[`CdlDiagram`](#cdldiagram)

#### Returns

[`LaidDiagram`](#laiddiagram)

***

### verifyDiagramDom()

> **verifyDiagramDom**(`page`, `diagram`, `options?`): `Promise`\<[`Discrepancy`](#discrepancy)[]\>

Defined in: [dom-verify.ts:78](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L78)

1 つの diagram について 5 種類の verifier を全部走らせる。

options.skipBbox / skipParticle / skipPhase で各検証を skip 可能 (動作確認 / partial run 用)。

#### Parameters

##### page

[`PageLike`](#pagelike)

##### diagram

[`CdlDiagram`](#cdldiagram)

##### options?

[`VerifyOptions`](#verifyoptions) = `{}`

#### Returns

`Promise`\<[`Discrepancy`](#discrepancy)[]\>

***

### verifyAllDiagramsDom()

> **verifyAllDiagramsDom**(`page`, `diagrams`, `options?`): `Promise`\<[`DomVerifyReport`](#domverifyreport)\>

Defined in: [dom-verify.ts:622](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/dom-verify.ts#L622)

#### Parameters

##### page

[`PageLike`](#pagelike)

##### diagrams

[`CdlDiagram`](#cdldiagram)[]

##### options?

[`VerifyOptions`](#verifyoptions)

#### Returns

`Promise`\<[`DomVerifyReport`](#domverifyreport)\>

***

### layout()

> **layout**(`diag`): [`LaidDiagram`](#laiddiagram)

Defined in: [layout.ts:20](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/layout.ts#L20)

Layout engine

規約 (SPEC.md §Layout engine 規約 と一致)。
- lane が x 軸 column を決める
- node は lane 内 stack 順で縦並び、 各 stack 間 gap 80px、 上端 80px
- lane label は lane 上部 30px 高
- contain: true の lane は内部 node 全部を 24px padding で囲む boundary
- edge routing は orthogonal L 字 (起点 side → 中継 → 終点 side)、 左右 lane 跨ぎは S 字 bezier
- edge label は path 中点から path 進行方向の垂直方向に 50-80px、 node bbox を避ける
- viewBox は cdl が auto 計算 (右端 +80 / 下端 +80)

#### Parameters

##### diag

[`CdlDiagram`](#cdldiagram)

#### Returns

[`LaidDiagram`](#laiddiagram)

***

### swimlane()

> **swimlane**(`preset`): `SwimlaneResult`

Defined in: [presets.ts:40](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L40)

#### Parameters

##### preset

[`SwimlanePreset`](#swimlanepreset)

#### Returns

`SwimlaneResult`

***

### flow()

> **flow**(`preset`): [`FlowBuilder`](#flowbuilder)

Defined in: [presets.ts:99](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L99)

flow preset ... 1 lane に縦 stack で node を並べ、 前 step → 次 step の edge を auto 接続。
sequence diagram 風 (mermaid `sequenceDiagram` の cdl 版)。

#### Parameters

##### preset

[`FlowPreset`](#flowpreset)

#### Returns

[`FlowBuilder`](#flowbuilder)

#### Example

```ts
flow({ id: "auth", topic: "Auth Flow" })
  .step({ id: "user", kind: "person", title: "User" })
  .step({ id: "api", kind: "api", title: "POST /login" }, "ログイン要求")
  .step({ id: "db", kind: "database", title: "users 表" }, "credential 検証")
  .build();
```

***

### sequence()

> **sequence**(`preset`): [`SequenceBuilder`](#sequencebuilder)

Defined in: [presets.ts:194](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L194)

sequence preset ... UML sequence diagram 風。 actors を column 化 (lifeline)、
step({ from, to, label }) で時系列順に message edge を生成。

#### Parameters

##### preset

[`SequencePreset`](#sequencepreset)

#### Returns

[`SequenceBuilder`](#sequencebuilder)

#### Example

```ts
sequence({ id: "auth-seq", topic: "Auth Sequence", actors: ["User", "API", "DB"] })
  .step({ from: "User", to: "API", label: "POST /login" })
  .step({ from: "API", to: "DB", label: "SELECT credentials" })
  .step({ from: "DB", to: "API", label: "rows", tone: "success", style: "dotted-flow" })
  .step({ from: "API", to: "User", label: "200 OK", tone: "success" })
  .build();
```

***

### topology()

> **topology**(`preset`): [`TopologyBuilder`](#topologybuilder)

Defined in: [presets.ts:331](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L331)

topology preset ... 構成図 / deployment diagram 風。
group で container を囲む、 add で内部 element を配置、 connect で element 間 connection。

#### Parameters

##### preset

[`TopologyPreset`](#topologypreset)

#### Returns

[`TopologyBuilder`](#topologybuilder)

#### Example

```ts
topology({ id: "aws", topic: "AWS Deployment" })
  .group("aws", { label: "AWS" })
    .add({ id: "alb", kind: "service", title: "ALB" })
    .add({ id: "ecs", kind: "service", title: "ECS Task" })
    .add({ id: "rds", kind: "database", title: "RDS" })
  .group("client", { label: "Client" })
    .add({ id: "browser", kind: "frontend", title: "Browser" })
  .connect("browser", "alb", { label: "HTTPS" })
  .connect("alb", "ecs", { label: "round-robin" })
  .connect("ecs", "rds", { label: "TCP 5432" })
  .build();
```

***

### er()

> **er**(`preset`): [`ErBuilder`](#erbuilder)

Defined in: [presets.ts:451](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L451)

er preset ... ER 図 (Entity Relationship)。 entity を table 風 node (rows 構造) で配置、
relation を edge で接続、 cardinality は edge label に記法 (1:1 / 1:N / N:M / 0..1 / 1..*) で表記。
mermaid ER 図の cdl 版。

#### Parameters

##### preset

[`ErPreset`](#erpreset)

#### Returns

[`ErBuilder`](#erbuilder)

#### Example

```ts
er({ id: "user-order", topic: "User-Order ER" })
  .entity({ id: "user", title: "User", rows: ["id: PK", "email: string", "createdAt: timestamp"] })
  .entity({ id: "order", title: "Order", rows: ["id: PK", "userId: FK", "total: number"] })
  .relation({ from: "user", to: "order", cardinality: "1:N", label: "places" })
  .build();
```

***

### stateMachine()

> **stateMachine**(`preset`): [`StateMachineBuilder`](#statemachinebuilder)

Defined in: [presets.ts:557](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/presets.ts#L557)

stateMachine preset ... FSM (Finite State Machine) / workflow。
state を card kind で配置、 transition を edge で接続、 trigger は edge label、 guard は sub。
initial / final state は eyebrow + tone で識別表現。

#### Parameters

##### preset

[`StateMachinePreset`](#statemachinepreset)

#### Returns

[`StateMachineBuilder`](#statemachinebuilder)

#### Example

```ts
stateMachine({ id: "auth-fsm", topic: "Auth FSM" })
  .state({ id: "idle", title: "Idle", initial: true })
  .state({ id: "loading", title: "Loading" })
  .state({ id: "done", title: "Done", final: true })
  .state({ id: "error", title: "Error" })
  .transition({ from: "idle", to: "loading", trigger: "submit" })
  .transition({ from: "loading", to: "done", trigger: "success", tone: "success" })
  .transition({ from: "loading", to: "error", trigger: "fail", tone: "error" })
  .transition({ from: "error", to: "idle", trigger: "retry", guard: "if attempts < 3" })
  .build();
```

***

### CdlDiagramView()

> **CdlDiagramView**(`__namedParameters`): `Element`

Defined in: [render.tsx:18](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/render.tsx#L18)

#### Parameters

##### \_\_namedParameters

`CdlDiagramViewProps`

#### Returns

`Element`

***

### compileToCdl()

> **compileToCdl**(`doc`): [`CdlDiagram`](#cdldiagram)

Defined in: [text-dsl/compile.ts:18](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/compile.ts#L18)

#### Parameters

##### doc

[`DslDocument`](#dsldocument)

#### Returns

[`CdlDiagram`](#cdldiagram)

***

### textDslToDiagram()

> **textDslToDiagram**(`src`): [`CdlDiagram`](#cdldiagram)

Defined in: [text-dsl/index.ts:43](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/index.ts#L43)

Text DSL から CdlDiagram に一発変換。 v0.5 (英語 keyword) / v0.4 (日本語 keyword) を auto-detect。

判定: src 内に英語 keyword `title:` / `type:` / `actors:` のいずれかが先頭近くにあれば v0.5、 そうでなければ v0.4。
v0.4 は deprecated、 console.warn を出す。

エラー時は throw、 詳細を取りたい場合は parseTextDslV05 / parseTextDsl を直接呼ぶ。

#### Parameters

##### src

`string`

#### Returns

[`CdlDiagram`](#cdldiagram)

***

### parseTextDsl()

> **parseTextDsl**(`src`): `ParseResult`

Defined in: [text-dsl/parser.ts:81](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/parser.ts#L81)

#### Parameters

##### src

`string`

#### Returns

`ParseResult`

***

### parseTextDslV05()

> **parseTextDslV05**(`src`): `V05ParseResult`

Defined in: [text-dsl/v05/parser.ts:136](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/text-dsl/v05/parser.ts#L136)

#### Parameters

##### src

`string`

#### Returns

`V05ParseResult`

***

### CdlDiagramThumbnail()

> **CdlDiagramThumbnail**(`props`): `Element`

Defined in: [thumbnail.tsx:10](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/thumbnail.tsx#L10)

CdlDiagramThumbnail ... 通常は CdlDiagramView を縮小表示、
クリックでモーダル開いて viewport いっぱい (94vw x 90vh) に拡大表示する。
Escape / 背景クリック / × ボタンで close。

#### Parameters

##### props

`CdlDiagramViewProps`

#### Returns

`Element`

***

### validate()

> **validate**(`diag`): `void`

Defined in: [validate.ts:21](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/validate.ts#L21)

cdl が compile される前に通る validator。
構造的破綻 (重複 id / 不存在 id 参照 / 必須要素 0 件 等) は throw、
文体警告 (japanese-only 違反) は console.warn で build を止めない。

error 統一 format ... `[cdl] {category}: {detail}` で grep / 著者の locate が楽に。

#### Parameters

##### diag

[`CdlDiagram`](#cdldiagram)

#### Returns

`void`

***

### visualValidate()

> **visualValidate**(`diag`): [`VisualValidationReport`](#visualvalidationreport)

Defined in: [visual-validate.ts:67](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L67)

1 つの cdl diagram を 6 軸で視覚検証する。

layout 計算込みで実行する。 `diag` は CdlDiagram (compile 前の builder 出力)。
layout 中の console.warn ([cdl layout] overlap / near) は本 validator が再判定するため抑止する。

#### Parameters

##### diag

[`CdlDiagram`](#cdldiagram)

#### Returns

[`VisualValidationReport`](#visualvalidationreport)

***

### visualValidateAll()

> **visualValidateAll**(`diagrams`): [`SweepReport`](#sweepreport)

Defined in: [visual-validate.ts:216](https://github.com/cardene777/cdl/blob/14cc7200f1d8580eeee83c08d4518187b59c9e34/packages/cdl/src/visual-validate.ts#L216)

#### Parameters

##### diagrams

[`CdlDiagram`](#cdldiagram)[]

#### Returns

[`SweepReport`](#sweepreport)
