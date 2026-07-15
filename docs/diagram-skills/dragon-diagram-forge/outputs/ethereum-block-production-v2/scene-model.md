# Scene Model: Ethereum ブロック生成

## Teaching Target

- Audience: Ethereum の実装・検証の流れを掴みたい日本語話者のエンジニア
- Misconception: ブロック生成は「tx を集めて chain に追加するだけ」ではない
- Primary mechanism: slot 内の proposer/payload/validation/attestation と、epoch 単位の finality は別の時間軸で動く
- Non-goals: PBS/MEV-Boost の詳細、全 Engine API 仕様、Casper FFG の完全な投票ルール

## Required Data

- Exact protocol fields: slot, epoch, proposer, execution payload, beacon block, attestation, fork-choice head, justified checkpoint, finalized checkpoint
- Numeric values: slot=12s, epoch=32 slots, finality threshold=2/3 stake
- State variables: local mempool, payload status, head weight, justified/finalized status
- Messages/functions/events/proofs: `engine_forkchoiceUpdated`, payload build request, payload retrieval, `engine_newPayload`, consensus gossip, attestation vote

## Scenes

### Scene 1: Slot clock and proposer selection

- Purpose: 12秒 slot と proposer が決まる入口を見せる
- Actors: validator set, selected proposer, consensus client, validator client
- Boundaries: consensus layer time domain
- Input: current slot number and RANDAO-derived proposer selection
- Execution boundary: consensus client / validator client
- State before: slot N has no proposed block
- Active data: slot=N, epoch=floor(N/32), proposer=validator #1842
- Active operation: one proposer is selected for the slot
- What changes / state delta: slot N moves from empty to proposer-assigned
- State after: proposer is responsible for building/broadcasting one block for slot N
- Output: proposer assignment
- Active path: validator set -> proposer spotlight
- Inactive context: other validators are quiet until attestation phase
- Visual grammar: circular slot clock plus spotlight over one validator
- Animation: clock hand sweeps to selected slot, proposer lights up
- Review risk: implying proposer alone finalizes the block

### Scene 2: Execution payload assembly

- Purpose: proposer CL asks EL for a payload; tx list is executed into an execution payload, not directly added to chain
- Actors: proposer consensus client, proposer execution client, local mempool, EVM/state transition
- Boundaries: execution layer boundary and consensus layer boundary
- Input: CL payload build request plus valid transactions from local mempool
- Execution boundary: execution client
- State before: mempool contains pending txs; stateRoot is old
- Active data: `engine_forkchoiceUpdated`, payload build request, payload retrieval, transactions[], gasUsed, baseFeePerGas, stateRoot, receiptsRoot
- Active operation: proposer CL updates fork choice / asks EL to build payload; EL bundles and executes transactions; CL retrieves the payload
- What changes / state delta: stateRoot and receiptsRoot become new payload commitments
- State after: execution payload is returned to proposer CL and ready for beacon block wrapping
- Output: execution payload
- Active path: proposer CL -> Engine API -> execution engine -> payload capsule -> proposer CL
- Inactive context: peer validators are quiet until gossip/validation
- Visual grammar: execution engine cutaway with payload capsule
- Animation: tx cards enter engine, stateRoot/receiptsRoot gauges update
- Review risk: hiding CL/EL handshake, hiding state transition, or treating payload as a generic block

### Scene 3: Beacon block proposal and gossip

- Purpose: execution payload is wrapped in a beacon block and gossiped
- Actors: proposer consensus client, peer consensus clients, execution clients
- Boundaries: proposer node, peer nodes, consensus gossip network
- Input: execution payload from EL
- Execution boundary: consensus client wraps payload into beacon block
- State before: peers do not yet have beacon block for slot N
- Active data: beacon block, execution payload, parent block, proposer signature
- Active operation: proposer signs and gossips the beacon block
- What changes / state delta: peers receive candidate block for slot N
- State after: peers can validate the proposed block
- Output: beacon block on consensus gossip
- Active path: proposer node -> peer nodes
- Inactive context: finality lane remains unchanged
- Visual grammar: radial gossip fanout with signed block capsule
- Animation: signed beacon block pulse spreads to peers
- Review risk: implying all nodes accept without validation

### Scene 4: Validation, attestation, and fork-choice head

- Purpose: validators re-execute/validate and attest; head weight changes
- Actors: peer consensus clients, peer execution clients, validator committee, fork-choice store
- Boundaries: peer node validation boundary and attestation committee
- Input: received beacon block
- Execution boundary: peer node passes payload to execution client for validation
- State before: fork-choice head has previous weight
- Active data: `engine_newPayload`, `engine_forkchoiceUpdated`, payloadStatus=VALID, attestation vote, head weight
- Active operation: peer CL sends payload to EL via `engine_newPayload`; EL returns VALID; fork choice is updated via `engine_forkchoiceUpdated`; validators attest to valid head
- What changes / state delta: payload status becomes VALID and head weight increases for the branch containing the proposed block
- State after: fork-choice head points to the block if attestation weight wins
- Output: attestations and updated head
- Active path: beacon block -> `engine_newPayload` validation gate -> `engine_forkchoiceUpdated` -> attestation ring -> head scale
- Inactive context: finalized checkpoint does not move in this scene
- Visual grammar: validation gate feeding an attestation weight scale
- Animation: block passes VALID gate; votes fill branch weight meter
- Review risk: saying "longest chain wins" or equating attestation with finality

### Scene 5: Epoch checkpoints and finality

- Purpose: inclusion/head choice is separated from finality
- Actors: validators across epoch, justified checkpoint, finalized checkpoint
- Boundaries: epoch/finality lane separate from slot lane
- Input: attestations across epochs
- Execution boundary: Casper FFG checkpoint voting
- State before: checkpoint A justified; checkpoint B not finalized
- Active data: epoch=E, checkpoints, source/target votes, attestation-derived checkpoint votes, 2/3 stake threshold
- Active operation: supermajority link upgrades checkpoint status
- What changes / state delta: target becomes justified; previous justified checkpoint becomes finalized
- State after: finalized checkpoint cannot be reverted without major slashing
- Output: finalized checkpoint
- Active path: votes -> 2/3 threshold -> justified/finalized badges
- Inactive context: individual slot proposal path is quiet
- Visual grammar: separate finality rail below slot scenes
- Animation: stake meter crosses 2/3, checkpoint lock closes
- Review risk: implying finality happens inside the 12-second slot
