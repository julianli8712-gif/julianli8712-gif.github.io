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
  // Notification webhook (DingTalk / WeCom)
  notifyWebhook: process.env.NOTIFY_WEBHOOK || "",
  // Production domain
  domain: process.env.DOMAIN || "cakeandco.julianli.net",
};

export const isDev = config.nodeEnv === "development";
export const isProd = config.nodeEnv === "production";
