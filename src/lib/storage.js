import crypto from "node:crypto";
import { getDb } from "./db.js";
import { safeErr } from "./errors.js";

export function sha256Hex(s) {
  return crypto.createHash("sha256").update(String(s || ""), "utf8").digest("hex");
}

export async function ensureIndexes(mongoUri) {
  const db = await getDb(mongoUri);
  if (!db) return;

  // Never create _id index.
  await db.collection("downloads").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("downloads").createIndex({ urlHash: 1, createdAt: -1 });
}

export async function logDownload({ mongoUri, userId, chatId, urlHash }) {
  const db = await getDb(mongoUri);
  if (!db) return;

  try {
    await db.collection("downloads").insertOne({
      userId: String(userId || ""),
      chatId: String(chatId || ""),
      urlHash: String(urlHash || ""),
      createdAt: new Date(),
    });
  } catch (e) {
    console.error("[db] downloads insertOne failed", { err: safeErr(e) });
  }
}

export async function incMetric({ mongoUri, field, lastErrorMessage = "" }) {
  const db = await getDb(mongoUri);
  if (!db) return;

  const now = new Date();
  const set = { updatedAt: now };
  const inc = {};

  if (field === "totalDownloads") inc.totalDownloads = 1;
  if (field === "totalErrors") inc.totalErrors = 1;

  if (field === "totalErrors") {
    set.lastErrorAt = now;
    set.lastErrorMessage = String(lastErrorMessage || "").slice(0, 500);
  }

  try {
    await db.collection("metrics").updateOne(
      { _id: "global" },
      {
        $setOnInsert: { createdAt: now, totalDownloads: 0, totalErrors: 0 },
        $set: set,
        $inc: inc,
      },
      { upsert: true }
    );
  } catch (e) {
    console.error("[db] metrics updateOne failed", { err: safeErr(e) });
  }
}

export async function getStats({ mongoUri }) {
  const db = await getDb(mongoUri);
  if (!db) {
    return {
      dbEnabled: false,
      totalDownloads: 0,
      totalErrors: 0,
      downloads24h: 0,
      lastErrorAt: null,
      lastErrorMessage: "",
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const metrics = await db.collection("metrics").findOne({ _id: "global" });
    const downloads24h = await db
      .collection("downloads")
      .countDocuments({ createdAt: { $gte: since } });

    return {
      dbEnabled: true,
      totalDownloads: Number(metrics?.totalDownloads || 0),
      totalErrors: Number(metrics?.totalErrors || 0),
      downloads24h,
      lastErrorAt: metrics?.lastErrorAt || null,
      lastErrorMessage: String(metrics?.lastErrorMessage || ""),
    };
  } catch (e) {
    console.error("[db] stats read failed", { err: safeErr(e) });
    return {
      dbEnabled: true,
      totalDownloads: 0,
      totalErrors: 0,
      downloads24h: 0,
      lastErrorAt: null,
      lastErrorMessage: "",
    };
  }
}
