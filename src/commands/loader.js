import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function registerCommands(bot) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const commandFiles = fs
    .readdirSync(__dirname)
    .filter(
      (file) =>
        file.endsWith(".js") &&
        file !== "loader.js" &&
        !file.startsWith("_")
    );

  for (const file of commandFiles) {
    const url = pathToFileURL(path.join(__dirname, file)).toString();
    const mod = await import(url);

    const handler =
      (mod && (mod.default || mod.register || mod.command || mod.handler)) ||
      (typeof mod === "function" ? mod : null);

    if (typeof handler === "function") {
      await handler(bot);
    } else {
      console.warn("[commands] " + file + " has no usable export; skipped.");
    }
  }
}
