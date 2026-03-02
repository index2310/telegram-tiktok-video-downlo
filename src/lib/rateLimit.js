const lastByUser = new Map();

export function checkCooldown({ userId, cooldownMs }) {
  const uid = String(userId || "");
  if (!uid) return { ok: true, remainingMs: 0 };

  const now = Date.now();
  const last = lastByUser.get(uid) || 0;
  const diff = now - last;
  if (diff >= cooldownMs) {
    lastByUser.set(uid, now);
    return { ok: true, remainingMs: 0 };
  }
  return { ok: false, remainingMs: cooldownMs - diff };
}

const lastHintByUser = new Map();

export function shouldHint({ userId, everyMs }) {
  const uid = String(userId || "");
  if (!uid) return true;

  const now = Date.now();
  const last = lastHintByUser.get(uid) || 0;
  if (now - last >= everyMs) {
    lastHintByUser.set(uid, now);
    return true;
  }
  return false;
}
