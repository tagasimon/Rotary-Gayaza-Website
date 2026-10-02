import { lookup } from "node:dns/promises";
import net from "node:net";

// Polite, safe fetching: identifies itself, short timeouts, a hard size cap, and no requests to
// private / loopback / link-local addresses (SSRF guard, re-checked on every redirect).
export const UA = `Mozilla/5.0 (compatible; RCGayazaSiteBot/1.0; +${process.env.APP_URL || "https://rotarygayaza.org"})`;
const MAX_BYTES = 8 * 1024 * 1024;

function privateIp(ip: string) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return privateIp(v.slice(7));
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

async function assertPublic(url: URL) {
  if (!/^https?:$/.test(url.protocol)) throw new Error("Only http(s) links are allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error("That address is not allowed");
}

export async function fetchText(input: string, timeoutMs = 20000): Promise<string> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    let url = new URL(input);
    for (let hop = 0; hop < 5; hop++) {
      await assertPublic(url);
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html,text/calendar,application/xhtml+xml,*/*;q=0.8" }, signal: ctl.signal, redirect: "manual", cache: "no-store" });
      if (r.status >= 300 && r.status < 400 && r.headers.get("location")) { url = new URL(r.headers.get("location")!, url); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status} from ${url.hostname}`);
      if (!r.body) return "";
      const reader = r.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) { await reader.cancel(); throw new Error("Response too large"); }
        chunks.push(value);
      }
      return Buffer.concat(chunks).toString("utf8");
    }
    throw new Error("Too many redirects");
  } finally {
    clearTimeout(t);
  }
}
