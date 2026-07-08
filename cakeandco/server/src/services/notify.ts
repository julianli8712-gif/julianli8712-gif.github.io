import { config } from "../config.js";

// Send notification to pastry team via webhook (DingTalk / WeCom)
export async function sendNotification(message: string): Promise<void> {
  if (!config.notifyWebhook) {
    console.log("[notify] No webhook configured, logging:", message);
    return;
  }

  try {
    await fetch(config.notifyWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msgtype: "text",
        text: { content: `🍰 Cake & Co.\n${message}` },
      }),
    });
    console.log("[notify] Sent:", message.slice(0, 100));
  } catch (err: any) {
    console.error("[notify] Failed:", err.message);
  }
}
