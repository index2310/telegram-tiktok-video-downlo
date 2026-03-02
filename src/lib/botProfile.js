export const BOT_PROFILE = [
  "Purpose: Download TikTok videos from a link and send them back in Telegram.",
  "Public commands:",
  "1) /start - What this bot does and examples",
  "2) /help - Detailed usage and troubleshooting",
  "3) /dl <url> - Download a TikTok video",
  "4) /stats - Admin-only usage/error stats",
  "Key rules:",
  "1) Rate limit: 1 download request per user per 20 seconds",
  "2) /stats is restricted to ADMIN_TELEGRAM_USER_IDS",
  "3) In plain chat, only TikTok links are handled; other messages are usually ignored",
].join("\n");
