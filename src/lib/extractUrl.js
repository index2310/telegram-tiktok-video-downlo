const TIKTOK_HOSTS = new Set([
  "www.tiktok.com",
  "tiktok.com",
  "m.tiktok.com",
  "vm.tiktok.com",
]);

function safeParseUrl(s) {
  try {
    return new URL(s);
  } catch {
    return null;
  }
}

export function isSupportedTikTokUrl(urlStr) {
  const u = safeParseUrl(urlStr);
  if (!u) return false;
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;

  const host = String(u.hostname || "").toLowerCase();
  if (TIKTOK_HOSTS.has(host)) return true;

  // allow tiktok.com/t/<short> on subpaths even if host is exactly tiktok.com
  if (host.endsWith(".tiktok.com")) return true;

  return false;
}

export function extractTikTokUrl(text) {
  const t = String(text || "");

  // first, try simple regex for urls
  const m = t.match(/https?:\/\/[\w.-]+[^\s)\]]+/i);
  if (!m) return null;

  const candidate = m[0];
  if (!isSupportedTikTokUrl(candidate)) return null;
  return candidate;
}
