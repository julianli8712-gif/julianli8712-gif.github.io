import { Router, Request, Response } from "express";
import crypto from "crypto";
import { config } from "../config.js";

export const wechatRouter = Router();

/**
 * Verify WeChat signature (used for both GET verification and POST decryption).
 * sha1(sort([token, timestamp, nonce]).join(""))
 */
function verifySignature(timestamp: string, nonce: string, signature: string): boolean {
  if (!config.wechatMsgToken) return false;
  const arr = [config.wechatMsgToken, timestamp, nonce].sort();
  const hash = crypto.createHash("sha1").update(arr.join("")).digest("hex");
  return hash === signature;
}

// GET /cake-api/wechat/callback — Token verification by WeChat
wechatRouter.get("/callback", (req: Request, res: Response) => {
  const { signature, timestamp, nonce, echostr } = req.query;

  if (!signature || !timestamp || !nonce || !echostr) {
    return res.status(400).send("Missing parameters");
  }

  if (!verifySignature(timestamp as string, nonce as string, signature as string)) {
    console.warn("[wechat] Signature verification failed");
    return res.status(403).send("Invalid signature");
  }

  console.log("[wechat] callback verified OK");
  res.type("text/plain").send(echostr as string);
});

// POST /cake-api/wechat/callback — Receive events from WeChat
wechatRouter.post("/callback", (req: Request, res: Response) => {
  const { signature, timestamp, nonce, openid, encrypt_type, msg_signature } = req.query;

  if (!signature || !timestamp || !nonce) {
    return res.status(400).send("Missing parameters");
  }

  if (!verifySignature(timestamp as string, nonce as string, signature as string)) {
    console.warn("[wechat] POST signature verification failed");
    return res.status(403).send("Invalid signature");
  }

  console.log("[wechat] event received:", JSON.stringify(req.body).slice(0, 500));
  console.log("[wechat] query:", JSON.stringify(req.query));

  // Always reply "success" — WeChat expects this within 5s, or it retries
  res.type("text/plain").send("success");
});
