function parseAdminIds(v) {
  const raw = String(v || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export const cfg = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,

  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || "",
  RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || "tiktok-api23.p.rapidapi.com",

  MONGODB_URI: process.env.MONGODB_URI || "",

  ADMIN_TELEGRAM_USER_IDS: parseAdminIds(process.env.ADMIN_TELEGRAM_USER_IDS),

  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};
