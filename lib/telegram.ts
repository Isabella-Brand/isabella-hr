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

// Telegram Bot API cannot directly add members to a supergroup.
// Instead, we generate a single-use invite link (expires in 24h)
// that HR can send to the employee.
export async function createInviteLink(employeeName: string): Promise<string> {
  if (!BOT_TOKEN || !CHAT_ID) throw new Error("Telegram env vars not configured");
  const expireDate = Math.floor(Date.now() / 1000) + 86400; // 24 hours
  const result = await callTelegram("createChatInviteLink", {
    chat_id:      CHAT_ID,
    name:         `Invite — ${employeeName}`,
    expire_date:  expireDate,
    member_limit: 1,
  });
  return result.result.invite_link as string;
}

// Bans then immediately unbans — kicks the user without permanently banning them.
export async function removeFromSupergroup(telegramUserId: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) throw new Error("Telegram env vars not configured");
  try {
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
    // Can't remove an admin/owner — silently ignore
    if (msg.includes("not enough rights") || msg.includes("PARTICIPANT_ID_INVALID") ||
        msg.includes("can't remove chat owner")) return;
    throw err;
  }
}
