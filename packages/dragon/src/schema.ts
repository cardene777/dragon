/**
 * JSON Schema を TypeScript から使えるように export。
 *
 * 使い方 (LLM 呼出):
 *   import Anthropic from "@anthropic-ai/sdk";
 *   import { diagramJsonSchema, jsonToDiagram } from "@cardenelabs/dragon";
 *   const client = new Anthropic();
 *   const res = await client.messages.create({
 *     model: "claude-sonnet-5",
 *     max_tokens: 4096,
 *     tools: [{ name: "create_diagram", description: "...", input_schema: diagramJsonSchema }],
 *     messages: [{ role: "user", content: "..." }],
 *   });
 *   const diagram = jsonToDiagram(res.content[0].input);
 *
 * schema JSON は `packages/dragon/schemas/diagram.json` が SSOT、 本 file は import して再 export するだけ。
 */

import schemaJson from "./schemas/diagram.json" with { type: "json" };

/**
 * Dragon DSL JSON Schema (Draft 7)。 Anthropic / OpenAI の tool schema にそのまま注入可能。
 */
export const diagramJsonSchema = schemaJson;
