import "dotenv/config";

// 百炼专属域名 {workspaceId}.{region}.maas.aliyuncs.com
// 老共享域名 dashscope.aliyuncs.com 自 2026-09-30 进入维护状态（仍可用，但不再迭代新特性）。
// 域名只在这一处定义，其余配置从它派生，避免多处硬编码漂移。
const dashscopeBaseUrl =
  process.env.DASHSCOPE_BASE_URL || "https://ws-v7oqs755ffhfr3h4.cn-beijing.maas.aliyuncs.com/compatible-mode/v1";

export const config = {
  port: parseInt(process.env.PORT || "3002", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  dashscopeApiKey: process.env.DASHSCOPE_API_KEY || "",
  dashscopeBaseUrl,
  /** 原生 API（如图片生成 /api/v1/services/aigc/...）用的主机名 */
  dashscopeHost: process.env.DASHSCOPE_HOST || new URL(dashscopeBaseUrl).host,
  aiModel: process.env.AI_MODEL || "qwen3.6-flash",
  aiBaseUrl: process.env.AI_BASE_URL || dashscopeBaseUrl,
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
