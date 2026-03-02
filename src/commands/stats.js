import { cfg } from "../lib/config.js";
import { getStats } from "../lib/storage.js";

function isAdmin(ctx) {
  const uid = ctx.from?.id;
  if (!uid) return false;
  const admins = Array.isArray(cfg.ADMIN_TELEGRAM_USER_IDS) ? cfg.ADMIN_TELEGRAM_USER_IDS : [];
  return admins.includes(Number(uid));
}

function fmtDate(d) {
  if (!d) return "(none)";
  try {
    return new Date(d).toISOString();
  } catch {
    return String(d);
  }
}

export default function register(bot) {
  bot.command("stats", async (ctx) => {
    if (!isAdmin(ctx)) {
      return ctx.reply("This command is admin-only.");
    }

    const s = await getStats({ mongoUri: cfg.MONGODB_URI });

    const msg =
      `DB enabled: ${s.dbEnabled}\n` +
      `Total downloads: ${s.totalDownloads}\n` +
      `Downloads (last 24h): ${s.downloads24h}\n` +
      `Total errors: ${s.totalErrors}\n` +
      `Last error at: ${fmtDate(s.lastErrorAt)}\n` +
      (s.lastErrorMessage ? `Last error message: ${s.lastErrorMessage}` : "");

    await ctx.reply(msg);
  });
}
