import{bc as o,bd as a}from"./index-BoDylA-T.js";const s=`// How a message and tokens travel from the source chain to the destination chain with Chainlink CCIP
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
`,r=`// Starter example. Two boxes and one line show the shape of the notation
sequence Ask to sign in

box browser as User's browser [note: operated by the user, color: slate, icon: globe]
box app as App [note: asks for sign-in, color: blue, icon: app]

step Press sign in
  say The user presses the app's sign-in button. The app leaves identity checks to the authorization server.
  browser -> app: GET /login
`,i=`// Sign in with the OAuth 2.0 authorization code and PKCE, then call an API
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
`,c={title:"dragon — write it as text, get a moving diagram",tagline:"Write it as text, get a moving diagram",language:"Language",palette:"Palette",paletteNames:{clear:"Clear",paper:"Paper and ink",night:"Night gauges",arcade:"Arcade screen",sea:"Navy and ecru"},site:{nav:{home:"Home",catalog:"Catalog",editor:"Editor",docs:"Docs","release-notes":"Release notes"},navLabel:"Main navigation",openMenu:"Open navigation",closeMenu:"Close navigation",openEditor:"Open editor →",toDark:"Switch to dark",toLight:"Switch to light",home:{chip:e=>[...e,"step playback"].join(" × "),title:["","Diagrams"," beyond the template"],lead:"Write the boxes and the edges, and move them step by step. Diagrams you gave up on because the template could not hold them now build themselves from plain text.",readDocs:"Read the docs",features:{eyebrow:"Why dragon",title:"Turn your writing into diagrams that move.",items:[{title:"Write it as text",text:"Write boxes, edges and steps one line at a time. No coordinates, no hand-built parts."},{title:"Motion, step by step",text:"Switch steps and envelopes and tags run along the edges while actions play inside the boxes. Order and causality become visible."},{title:"Hand it over by URL or file",text:"Put the notation in a URL to share it, or export it to mp4, GIF, HTML or PNG with the CLI."}]},steps:{eyebrow:"3 steps",title:"Up and running in a minute.",items:[{title:"Open the editor",text:"Open the editor in your browser. Nothing to install."},{title:"Write the notation",text:"Write boxes, edges and steps one line at a time. The first line picks the diagram kind."},{title:"The diagram starts moving",text:"The live view on the right shows a diagram that moves step by step. Share it by URL, or export it to a file."}]},uses:{eyebrow:"Use cases",title:"Diagrams you can write.",more:"Browse the catalog →"},closing:{title:"Write it now, watch it move.",lead:"One notation file is all it takes. A moving diagram is yours a minute later."}},catalog:{parts:a("en"),loading:"Loading",loadFailed:"Could not load the diagram",pageLoadFailed:"Could not load the page",reload:"Reload"},screens:{catalog:{title:"Catalog"},editor:{title:"Editor",lead:""},docs:{title:"Docs"},"release-notes":{title:"Release notes"},"not-found":{title:"That page has not been written yet."}},releaseNotes:{crumb:"Breadcrumb",eyebrow:e=>`Release log • ${e} is current`,accent:"notes",lead:"Shows the current dragon version. The detailed record for each version is in CHANGELOG.md on GitHub.",changelog:"See the change log on GitHub"},notFound:{em:"That page",lead:e=>`The page you are looking for was moved, deleted, or never existed. Try one of dragon's ${e} entry points.`,catalog:"Browse the catalog",docs:"Read the docs"}},notation:"Notation",editor:"Diagram notation",fold:"Hide",unfold:"Show",split:{shelf:"Border between the shelf and the notation",code:"Border between the notation and the diagram"},readable:(e,t,n)=>`Reads fine — ${t} ${t===1?e:{box:"boxes",branch:"branches",row:"rows",lane:"lanes",part:"parts",item:"items"}[e]}, ${n} ${n===1?"step":"steps"}`,notJson:e=>`Not valid JSON — ${e}`,cannotDraw:e=>`Cannot draw — ${e}`,kept:"Showing the last diagram that drew",exportLead:"Export the same diagram",exportTail:"to mp4 / GIF / HTML / PNG",shelf:{label:"Shelf",open:"Open the shelf",close:"Close the shelf",newFile:"New file",tabs:{samples:"Samples",parts:"Parts",notation:"Notation"},filter:"Filter…",filterLabel:"Filter the list",nothing:"Nothing matches",kinds:{sequence:"Sequence",architecture:"Architecture",state:"State",git:"Git graph",time:"Time diagram",tree:"Tree diagram",lineup:"Lineup",try:"Try diagram",pipe:"Pipe diagram",chart:"Chart",flow:"Flow diagram",cycle:"Cycle diagram",mind:"Mind map",er:"Table relation diagram",matrix:"Two-axis matrix",venn:"Set overlap diagram",sankey:"Sankey diagram"},partsHint:"Click to add to the editor. Declarations go before the first step, step lines go to the last step",notationHint:"Line shapes, in the words of the notation you are writing",parts:o("en")},code:{file:"File name",import:"Import a file (.dragon or .json)",export:"Export the notation as a .dragon file"},stage:{live:"Live preview",fontDown:"Smaller narration text",fontUp:"Larger narration text",grid:"Show the grid",fullscreen:"Full screen",fit:"Fit to the frame",zoomOut:"Zoom out",zoomIn:"Zoom in",zoom:"Zoom level",phase:(e,t,n)=>`Step ${e} / ${t} · ${n}`,export:"Export",exportMenu:"Export format",exportFailed:e=>`Could not export: ${e}`},notices:{line:e=>`Line ${e}`,count:e=>`${e} ${e===1?"error":"errors"}`,hints:e=>`${e} ${e===1?"notice":"notices"}`,goTo:e=>`Go to line ${e}`},overlaps:{count:e=>`${e} text ${e===1?"overlap":"overlaps"}`,step:e=>`Step ${e}`,goTo:e=>`Go to step ${e}`}},d={intro:r,oauth:i,ccip:s};export{d as EN_FIRST_EXAMPLES,c as EN_TEXT};
