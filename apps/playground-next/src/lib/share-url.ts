/**
 * dragon share URL SSOT — mermaid.live pattern を移植。
 *
 * URL hash に diagram 全文を zlib deflate + base64 (URL-safe) で埋込。
 * server stateless + 送信先の browser で即 decode + render。
 *
 * hash format ... `#s=<base64url>` (payload = deflate(JSON.stringify(preset)))
 * fallback ... hash 不在時は default preset (swimlane) を返す。
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function deflate(input: Uint8Array): Promise<Uint8Array> {
  const blob = new Blob([input as BlobPart]);
  const stream = blob.stream().pipeThrough(new CompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function inflate(input: Uint8Array): Promise<Uint8Array> {
  const blob = new Blob([input as BlobPart]);
  const stream = blob.stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

function toBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const raw = atob(s + pad);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function encodeShare(payload: unknown): Promise<string> {
  const json = JSON.stringify(payload);
  const deflated = await deflate(encoder.encode(json));
  return "s=" + toBase64Url(deflated);
}

export async function decodeShare<T>(hash: string): Promise<T | null> {
  try {
    const clean = hash.startsWith("#") ? hash.slice(1) : hash;
    const match = clean.match(/(?:^|&)s=([^&]+)/);
    if (!match) return null;
    const bytes = fromBase64Url(match[1]!);
    const inflated = await inflate(bytes);
    const json = decoder.decode(inflated);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
