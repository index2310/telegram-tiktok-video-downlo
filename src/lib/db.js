import { MongoClient } from "mongodb";
import { safeErr } from "./errors.js";

let _client = null;
let _db = null;
let _connecting = null;

export async function getDb(mongoUri) {
  const uri = String(mongoUri || "");
  if (!uri) return null;
  if (_db) return _db;
  if (_connecting) return _connecting;

  _connecting = (async () => {
    try {
      _client = new MongoClient(uri, { maxPoolSize: 5 });
      await _client.connect();
      _db = _client.db();
      console.log("[db] connected");
      return _db;
    } catch (e) {
      console.error("[db] connect failed", { err: safeErr(e) });
      _client = null;
      _db = null;
      return null;
    } finally {
      _connecting = null;
    }
  })();

  return _connecting;
}
