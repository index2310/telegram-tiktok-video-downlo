What this bot does

TikTok Grabber is a Telegram bot that takes a TikTok link and returns a downloadable video. It uses a RapidAPI endpoint to get the best download URL (no-watermark when available) and then sends the video back in Telegram.

Public commands

1) /start
What it does: Welcome message and quick examples.
Usage: /start

2) /help
What it does: Detailed usage, supported URLs, common errors, and privacy note.
Usage: /help

3) /dl <tiktok_url>
What it does: Downloads a TikTok video from the provided URL.
Usage: /dl https://www.tiktok.com/@user/video/1234567890
Notes: You can also just paste a TikTok link (same behavior).

4) /stats
What it does: Admin-only stats (requires ADMIN_TELEGRAM_USER_IDS).
Usage: /stats

Supported URLs
1) https://www.tiktok.com/@user/video/<id>
2) https://vm.tiktok.com/<short>
3) https://tiktok.com/t/<short>

Common errors
1) Missing or invalid URL
- Use: /dl <tiktok_url>

2) Private / deleted / region-blocked videos
- The provider may not be able to fetch these.

3) Telegram cannot send the video
- The file may be too large or Telegram may not be able to fetch it from the returned URL.
- The bot will fall back to sending a direct download link.

Privacy
The bot only uses the TikTok link you provide to fetch the downloadable file. If MongoDB is enabled, it stores a lightweight log entry (hash of the URL, userId, chatId, timestamp) and global counters.

Environment variables
1) TELEGRAM_BOT_TOKEN (required): Telegram bot token
2) RAPIDAPI_KEY (required to download): RapidAPI key
3) RAPIDAPI_HOST (optional): defaults to tiktok-api23.p.rapidapi.com
4) MONGODB_URI (optional): enables persistence and metrics
5) ADMIN_TELEGRAM_USER_IDS (optional): comma-separated numeric Telegram user IDs for /stats
6) LOG_LEVEL (optional): info|warn|error (default info)

Run instructions
1) Install: npm run install:root
2) Start dev: npm run dev
3) Start prod: npm start
