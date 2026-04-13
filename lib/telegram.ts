const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID    = process.env.TELEGRAM_SUPERGROUP_CHAT_ID;
const API_BASE   = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function callTelegram(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/${method}`, {
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
  await callTelegram("unbanChatMember", {
    chat_id:          CHAT_ID,
    user_id:          Number(telegramUserId),
    only_if_banned:   true,
  });
  await callTelegram("addChatMember", {
    chat_id: CHAT_ID,
    user_id: Number(telegramUserId),
  });
}

export async function removeFromSupergroup(telegramUserId: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) throw new Error("Telegram env vars not configured");
  // Ban then immediately unban — kicks the user without permanently banning them
  await callTelegram("banChatMember", {
    chat_id:    CHAT_ID,
    user_id:    Number(telegramUserId),
    revoke_messages: false,
  });
  await callTelegram("unbanChatMember", {
    chat_id:        CHAT_ID,
    user_id:        Number(telegramUserId),
    only_if_banned: true,
  });
}
