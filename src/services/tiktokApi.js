import { safeErr } from "../lib/errors.js";

function nowMs() {
  return Date.now();
}

function tryJsonParse(x) {
  if (x && typeof x === "object") return x;
  if (typeof x !== "string") return null;
  try {
    return JSON.parse(x);
  } catch {
    return null;
  }
}

function looksLikeUrl(s) {
  if (!s || typeof s !== "string") return false;
  return /^https?:\/\//i.test(s);
}

function collectUrlCandidates(obj, out) {
  if (!obj) return;

  if (typeof obj === "string") {
    if (looksLikeUrl(obj)) out.push({ url: obj, hint: "string" });
    const parsed = tryJsonParse(obj);
    if (parsed) collectUrlCandidates(parsed, out);
    return;
  }

  if (Array.isArray(obj)) {
    for (const it of obj) collectUrlCandidates(it, out);
    return;
  }

  if (typeof obj !== "object") return;

  // common keys seen in tiktok download APIs
  const preferredKeys = [
    "nowm",
    "no_watermark",
    "noWatermark",
    "noWatermarkUrl",
    "no_wm",
    "nwm",
    "download",
    "downloadUrl",
    "download_url",
    "video",
    "videoUrl",
    "video_url",
    "play",
    "playUrl",
    "play_url",
    "url",
    "link",
  ];

  for (const k of preferredKeys) {
    const v = obj[k];
    if (typeof v === "string" && looksLikeUrl(v)) {
      out.push({ url: v, hint: k });
    }
  }

  // recurse all fields to catch nested variants
  for (const v of Object.values(obj)) {
    if (v && (typeof v === "object" || typeof v === "string")) {
      collectUrlCandidates(v, out);
    }
  }
}

function scoreCandidate(c) {
  const h = String(c?.hint || "").toLowerCase();
  // prefer no-watermark-ish keys
  if (h.includes("nowm") || h.includes("no_water") || h.includes("nowater") || h.includes("no_wm") || h.includes("nwm")) return 100;
  if (h.includes("download")) return 80;
  if (h.includes("video") || h.includes("play")) return 60;
  if (h === "url" || h === "link") return 40;
  return 10;
}

export async function fetchTikTokDownload({ rapidApiKey, rapidApiHost, tiktokUrl, log = console }) {
  const host = String(rapidApiHost || "tiktok-api23.p.rapidapi.com");
  const keySet = !!rapidApiKey;

  if (!keySet) {
    return { ok: false, error: "RAPIDAPI_KEY is missing", status: 412, data: null, bestUrl: "" };
  }

  const endpoint = `https://${host}/api/download/video?url=${encodeURIComponent(String(tiktokUrl || "").trim())}`;
  const started = nowMs();

  // sanitized logging (hostname only)
  log.info?.("[rapidapi] start", { host, path: "/api/download/video" });

  try {
    const r = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-rapidapi-key": String(rapidApiKey),
        "x-rapidapi-host": host,
      },
    });

    const elapsedMs = nowMs() - started;

    const text = await r.text();
    let data = tryJsonParse(text);
    if (!data && text && typeof text === "string") {
      // sometimes API returns already-json-string inside JSON
      data = { raw: text };
    }

    if (!r.ok) {
      log.warn?.("[rapidapi] fail", { status: r.status, elapsedMs });
      return {
        ok: false,
        status: r.status,
        error: (data && (data.error || data.message)) || text || `RapidAPI error (${r.status})`,
        data,
        bestUrl: "",
      };
    }

    log.info?.("[rapidapi] success", { status: r.status, elapsedMs });

    const candidates = [];
    collectUrlCandidates(data, candidates);

    candidates.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
    const bestUrl = String(candidates[0]?.url || "");

    return {
      ok: !!bestUrl,
      status: r.status,
      error: bestUrl ? "" : "No downloadable video URL found in provider response",
      data,
      bestUrl,
      candidates,
    };
  } catch (e) {
    const elapsedMs = nowMs() - started;
    log.error?.("[rapidapi] exception", { elapsedMs, err: safeErr(e) });
    return { ok: false, status: 0, error: safeErr(e), data: null, bestUrl: "" };
  }
}
