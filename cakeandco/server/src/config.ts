import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3002", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  dashscopeApiKey: process.env.DASHSCOPE_API_KEY || "",
  dashscopeBaseUrl: process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
  aiModel: process.env.AI_MODEL || "qwen3.6-flash",
  aiBaseUrl: process.env.AI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
  // Auth
  jwtSecret: process.env.JWT_SECRET || "",
  // WeChat Mini Program
  wechatAppId: process.env.WECHAT_APPID || "",
  wechatAppSecret: process.env.WECHAT_APPSECRET || "",
  // WeChat message push (server URL verification)
  wechatMsgToken: process.env.WECHAT_MSG_TOKEN || "",
  wechatMsgAesKey: process.env.WECHAT_MSG_AESKEY || "",
  // Notification webhook (DingTalk / WeCom)
  notifyWebhook: process.env.NOTIFY_WEBHOOK || "",
  // Domain for cake orders
  domain: process.env.DOMAIN || "cakeandco.julianli.net",
  // Bar (Digital Sommelier)
  barDomain: process.env.BAR_DOMAIN || "pair.julianli.net",
  exportDir: process.env.EXPORT_DIR || "/www/wwwroot/julianli/exports",
};

export const isDev = config.nodeEnv === "development";
export const isProd = config.nodeEnv === "production";
