export default function register(bot) {
  bot.command("help", async (ctx) => {
    const msg =
      "How to use TikTok Grabber\n\n" +
      "1) Download a video\n" +
      "Use: /dl <tiktok_url>\n" +
      "Example: /dl https://www.tiktok.com/@user/video/1234567890\n\n" +
      "2) Paste a link\n" +
      "You can also just paste a TikTok link and I’ll download it.\n\n" +
      "Supported URLs\n" +
      "- www.tiktok.com\n" +
      "- vm.tiktok.com (short links)\n" +
      "- tiktok.com/t/ (short links)\n\n" +
      "Common errors\n" +
      "- Private/deleted/region-blocked videos may not download\n" +
      "- The provider may rate-limit (try again later)\n" +
      "- Telegram may fail to fetch or send very large videos (I’ll send a direct link instead)\n\n" +
      "Privacy\n" +
      "I only use the link to fetch the file. If the database is enabled, I store a lightweight log entry (userId, chatId, URL hash, timestamp) and global counters.";

    await ctx.reply(msg);
  });
}
