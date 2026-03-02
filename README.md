TikTok Grabber Bot

A Telegram bot that downloads TikTok videos using a RapidAPI endpoint and sends them back to the chat.

Features
1) /dl <tiktok_url> downloads a TikTok video and sends it as a Telegram video (or document fallback)
2) Paste a TikTok link directly (same behavior as /dl)
3) Per-user cooldown (default 1 request per 20 seconds)
4) Optional MongoDB persistence for request logs and global metrics (runs fine without Mongo)
5) Optional admin-only /stats command

Architecture
1) src/index.js boots the service, checks env, connects DB (optional), starts long polling
2) src/bot.js wires grammY commands and message handlers
3) src/services/tiktokApi.js calls RapidAPI and extracts the best download URL
4) src/lib/storage.js is MongoDB helper and collections access (optional)
5) src/lib/rateLimit.js is per-user cooldown tracking
6) src/lib/extractUrl.js finds TikTok links in text
7) src/lib/errors.js normalizes errors for logs

Setup
1) Requirements
- Node.js 18+
- A Telegram bot token from @BotFather
- A RapidAPI key for the TikTok API endpoint
- Optional: MongoDB connection string

2) Install
- npm run install:root

3) Configure environment
- Copy .env.sample to .env and fill values

4) Run locally
- npm run dev

5) Run in production
- npm run build
- npm start

Commands
/start
- Welcome message and examples

/help
- Detailed usage, supported URLs, common errors, privacy note

/dl <tiktok_url>
- Downloads the TikTok video
Example: /dl https://www.tiktok.com/@taylorswift/video/7558098574555254046

/stats
- Admin-only. Shows global download and error metrics.

Environment variables
Required
1) TELEGRAM_BOT_TOKEN: Telegram bot token
2) RAPIDAPI_KEY: RapidAPI key used to call the download endpoint

Optional
1) RAPIDAPI_HOST: defaults to tiktok-api23.p.rapidapi.com
2) MONGODB_URI: enables persistence and /stats metrics storage
3) ADMIN_TELEGRAM_USER_IDS: comma-separated Telegram numeric user IDs allowed to use /stats
4) LOG_LEVEL: defaults to info

Database
If MONGODB_URI is set:
1) downloads collection: { userId, chatId, urlHash, createdAt }
2) metrics collection: { _id:"global", totalDownloads, totalErrors, lastErrorAt, lastErrorMessage, createdAt, updatedAt }

Troubleshooting
1) Bot does not start
- Ensure TELEGRAM_BOT_TOKEN is set

2) /dl fails with provider errors
- Ensure RAPIDAPI_KEY is set and valid
- The TikTok link might be private, deleted, or region-blocked

3) Telegram fails sending the video
- The file may be too large or Telegram cannot fetch the URL
- The bot will fall back to sending a direct download link

Extending
1) Add new commands under src/commands/*.js
2) They auto-register via src/commands/loader.js
3) Update src/index.js setMyCommands list to keep Telegram UI in sync
