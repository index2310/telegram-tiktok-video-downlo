export default function register(bot) {
  bot.command("start", async (ctx) => {
    const msg =
      "TikTok Grabber downloads TikTok videos and sends them here.\n\n" +
      "Examples:\n" +
      "/dl https://www.tiktok.com/@taylorswift/video/7558098574555254046\n" +
      "Or just paste a TikTok link.\n\n" +
      "Note: private or region-blocked videos may fail.";

    await ctx.reply(msg);
  });
}
