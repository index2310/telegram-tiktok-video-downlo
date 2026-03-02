import "dotenv/config";

import { run } from "@grammyjs/runner";
import { cfg } from "./lib/config.js";
import { createBot } from "./bot.js";
import { registerCommands } from "./commands/loader.js";
import { ensureIndexes } from "./lib/storage.js";
import { safeErr } from "./lib/errors.js";

process.on("unhandledRejection", (r) => {
  console.error("UnhandledRejection:", safeErr(r));
  process.exit(1);
});

process.on("uncaughtException", (e) => {
  console.error("UncaughtException:", safeErr(e));
  process.exit(1);
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function boot() {
  console.log("[boot] starting", {
    nodeEnv: process.env.NODE_ENV || "",
    TELEGRAM_BOT_TOKEN_set: !!cfg.TELEGRAM_BOT_TOKEN,
    RAPIDAPI_KEY_set: !!cfg.RAPIDAPI_KEY,
    MONGODB_URI_set: !!cfg.MONGODB_URI,
    adminsConfigured: (cfg.ADMIN_TELEGRAM_USER_IDS || []).length,
  });

  if (!cfg.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is required. Add it to your environment and redeploy.");
    process.exit(1);
  }

  if (cfg.MONGODB_URI) {
    try {
      await ensureIndexes(cfg.MONGODB_URI);
      console.log("[boot] DB enabled: true");
    } catch (e) {
      console.error("[boot] DB index init failed", { err: safeErr(e) });
      console.log("[boot] DB enabled: false");
    }
  } else {
    console.log("[boot] DB enabled: false");
  }

  const bot = createBot(cfg.TELEGRAM_BOT_TOKEN);

  bot.catch((err) => {
    console.error("[bot] handler error", {
      updateId: err?.ctx?.update?.update_id,
      err: safeErr(err?.error || err),
    });
  });

  // init so ctx.me works for group mention logic if added later
  try {
    await bot.init();
  } catch (e) {
    console.warn("[boot] bot.init failed", { err: safeErr(e) });
  }

  await registerCommands(bot);

  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Welcome & examples" },
      { command: "help", description: "Usage and troubleshooting" },
      { command: "dl", description: "Download a TikTok video" },
      { command: "stats", description: "Admin-only stats" },
    ]);
  } catch (e) {
    console.warn("[boot] setMyCommands failed", { err: safeErr(e) });
  }

  // Reliability: clear webhook to avoid conflicts with getUpdates
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: true });
  } catch (e) {
    console.warn("[boot] deleteWebhook failed", { err: safeErr(e) });
  }

  // Runner restart loop for 409 conflict tolerance
  let backoffMs = 2000;
  let runner = null;
  let restarting = false;

  async function startRunner() {
    if (runner) return;
    console.log("[polling] starting runner", { concurrency: 1 });
    runner = run(bot, { concurrency: 1 });
    backoffMs = 2000;
  }

  async function restartRunner(reason) {
    if (restarting) return;
    restarting = true;
    try {
      console.warn("[polling] restarting", { reason, backoffMs });
      try {
        runner?.stop?.();
      } catch {}
      runner = null;
      await sleep(backoffMs);
      backoffMs = Math.min(20_000, Math.floor(backoffMs * 1.8));
      await startRunner();
    } finally {
      restarting = false;
    }
  }

  await startRunner();

  // lightweight memory log once per minute
  setInterval(() => {
    const m = process.memoryUsage();
    console.log("[mem]", {
      rssMB: Math.round(m.rss / 1e6),
      heapUsedMB: Math.round(m.heapUsed / 1e6),
    });
  }, 60_000).unref();

  // Handle 409 conflicts gracefully
  bot.api.config.use(async (prev, method, payload, signal) => {
    try {
      return await prev(method, payload, signal);
    } catch (e) {
      const msg = safeErr(e);
      if (String(msg).includes("409") || String(msg).toLowerCase().includes("conflict")) {
        console.warn("[polling] conflict detected", { err: msg });
        restartRunner("409_conflict");
      }
      throw e;
    }
  });
}

boot().catch((e) => {
  console.error("[boot] fatal", { err: safeErr(e) });
  process.exit(1);
});
