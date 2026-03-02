import { Bot } from "grammy";
import { cfg } from "./lib/config.js";
import { extractTikTokUrl } from "./lib/extractUrl.js";
import { shouldHint } from "./lib/rateLimit.js";
import { handleDl } from "./commands/dl.js";
import { BOT_PROFILE } from "./lib/botProfile.js";

export function createBot(token) {
  const bot = new Bot(token);

  // Commands are registered via loader in src/index.js before any catch-all handler.

  bot.on("message:text", async (ctx, next) => {
    const raw = String(ctx.message?.text || "");
    if (raw.startsWith("/")) return next();

    const url = extractTikTokUrl(raw);
    if (url) {
      // Treat like /dl
      await handleDl(ctx, url);
      return;
    }

    // Ignore non-URL messages, but hint at most once per hour per user
    const uid = ctx.from?.id;
    if (shouldHint({ userId: uid, everyMs: 60 * 60 * 1000 })) {
      await ctx.reply('Send a TikTok link, or use: /dl <tiktok_url>');
    }

    return next();
  });

  // Keep profile string accessible for internal consistency/logging.
  bot.use(async (ctx, next) => {
    ctx.state = ctx.state || {};
    ctx.state.botProfile = BOT_PROFILE;
    return next();
  });

  return bot;
}
