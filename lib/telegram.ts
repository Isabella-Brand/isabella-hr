const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_SUPERGROUP_CHAT_ID;
const API_BASE  = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function callTelegram(method: string, body: Record<string, unknown>) {
  const res  = await fetch(`${API_BASE}/${method}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description}`);
  return data;
}

export async function addToSupergroup(telegramUserId: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) throw new Error("Telegram env vars not configured");

  try {
    await callTelegram("addChatMember", {
      chat_id: CHAT_ID,
      user_id: Number(telegramUserId),
    });
  } catch (err: any) {
    const msg: string = err.message ?? "";

    // Already in the group — treat as success
    if (msg.includes("USER_ALREADY_PARTICIPANT") || msg.includes("already a member")) return;

    // Was previously kicked — unban first, then add
    if (msg.includes("USER_KICKED") || msg.includes("kicked") || msg.includes("banned")) {
      await callTelegram("unbanChatMember", { chat_id: CHAT_ID, user_id: Number(telegramUserId) });
      await callTelegram("addChatMember",   { chat_id: CHAT_ID, user_id: Number(telegramUserId) });
      return;
    }

    // Bot can't add/remove admins — treat as success (they're already in the group)
    if (msg.includes("not enough rights") || msg.includes("PARTICIPANT_ID_INVALID")) return;

    throw err;
  }
}

export async function removeFromSupergroup(telegramUserId: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) throw new Error("Telegram env vars not configured");

  try {
    // Ban then immediately unban — kicks without permanently banning
    await callTelegram("banChatMember", {
      chat_id:         CHAT_ID,
      user_id:         Number(telegramUserId),
      revoke_messages: false,
    });
    await callTelegram("unbanChatMember", {
      chat_id: CHAT_ID,
      user_id: Number(telegramUserId),
    });
  } catch (err: any) {
    const msg: string = err.message ?? "";

    // Can't remove an admin/owner — treat as success (they stay in, which is correct)
    if (msg.includes("not enough rights") || msg.includes("PARTICIPANT_ID_INVALID") ||
        msg.includes("can't remove chat owner")) return;

    throw err;
  }
}
