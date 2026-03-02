import { extractTikTokUrl, isSupportedTikTokUrl } from "../lib/extractUrl.js";
import { checkCooldown } from "../lib/rateLimit.js";
import { cfg } from "../lib/config.js";
import { fetchTikTokDownload } from "../services/tiktokApi.js";
import { incMetric, logDownload, sha256Hex } from "../lib/storage.js";

function formatMs(ms) {
  const s = Math.ceil(ms / 1000);
  return s <= 1 ? "1s" : `${s}s`;
}

async function sendWithFallback(ctx, videoUrl) {
  const chatId = ctx.chat?.id;
  const log = console;

  if (!chatId) {
    await ctx.reply("I couldn't identify this chat. Please try again.");
    return;
  }

  // Prefer sendVideo by URL (Telegram fetches it)
  try {
    log.info("[media] sendVideo attempt", { chatId });
    await ctx.api.sendVideo(chatId, videoUrl);
    log.info("[media] sendVideo success", { chatId });
    return;
  } catch (e1) {
    log.warn("[media] sendVideo failed", { chatId, err: String(e1?.message || e1) });
  }

  // Fallback to sendDocument (sometimes works when sendVideo doesn't)
  try {
    log.info("[media] sendDocument attempt", { chatId });
    await ctx.api.sendDocument(chatId, videoUrl);
    log.info("[media] sendDocument success", { chatId });
    return;
  } catch (e2) {
    log.warn("[media] sendDocument failed", { chatId, err: String(e2?.message || e2) });
  }

  // Final fallback: give direct link
  await ctx.reply(
    "I couldn't send the video file (it may be too large or Telegram couldn't fetch it).\n\n" +
      "Direct download link:\n" +
      videoUrl
  );
}

export async function handleDl(ctx, urlText) {
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;

  const raw = String(urlText || "").trim();
  const url = extractTikTokUrl(raw) || raw;

  if (!url || !isSupportedTikTokUrl(url)) {
    await ctx.reply(
      "Please provide a valid TikTok URL.\n\n" +
        "Usage: /dl <tiktok_url>\n" +
        "Example: /dl https://www.tiktok.com/@taylorswift/video/7558098574555254046"
    );
    return;
  }

  const cooldown = checkCooldown({ userId, cooldownMs: 20_000 });
  if (!cooldown.ok) {
    await ctx.reply(`Please wait ${formatMs(cooldown.remainingMs)} before downloading another video.`);
    return;
  }

  if (!cfg.RAPIDAPI_KEY) {
    await ctx.reply("Downloading is not configured yet (RAPIDAPI_KEY is missing).");
    return;
  }

  await ctx.reply("Got it. Fetching the download link…");

  const res = await fetchTikTokDownload({
    rapidApiKey: cfg.RAPIDAPI_KEY,
    rapidApiHost: cfg.RAPIDAPI_HOST,
    tiktokUrl: url,
    log: console,
  });

  if (!res.ok || !res.bestUrl) {
    const msg = String(res.error || "Download failed").slice(0, 500);
    await ctx.reply(
      "Sorry, I couldn't get a downloadable video for that link.\n" +
        "This can happen with private, deleted, or region-blocked videos.\n\n" +
        `Error: ${msg}`
    );

    await incMetric({ mongoUri: cfg.MONGODB_URI, field: "totalErrors", lastErrorMessage: msg });
    return;
  }

  const urlHash = sha256Hex(url);
  await logDownload({ mongoUri: cfg.MONGODB_URI, userId, chatId, urlHash });
  await incMetric({ mongoUri: cfg.MONGODB_URI, field: "totalDownloads" });

  await sendWithFallback(ctx, res.bestUrl);
}

export default function register(bot) {
  bot.command("dl", async (ctx) => {
    const text = String(ctx.message?.text || "");
    const arg = text.replace(/^\/dl(@\w+)?\s*/i, "").trim();
    await handleDl(ctx, arg);
  });
}
