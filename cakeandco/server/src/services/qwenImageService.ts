import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { config } from "../config.js";

const UPLOAD_DIR = "/www/wwwroot/julianli/img/cakes";

// Ensure upload dir exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface AiImageResult {
  url: string;
  width: number;
  height: number;
}

/**
 * Simple POST with JSON body — returns parsed JSON response.
 */
function postJson(
  hostname: string,
  endpoint: string,
  headers: Record<string, string>,
  body: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path: endpoint, method: "POST", headers, timeout: 30000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Invalid JSON response: ${data.slice(0, 200)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timeout")); });
    req.write(body);
    req.end();
  });
}

/**
 * Download a URL to a local file path. Handles redirects.
 */
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    proto
      .get(url, { timeout: 15000 }, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          file.close();
          fs.unlinkSync(dest);
          downloadFile(response.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
        file.on("error", (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      })
      .on("timeout", () => {
        file.close();
        fs.unlink(dest, () => {});
        reject(new Error("Download timeout"));
      });
  });
}

/**
 * Call Qwen-Image-2.0 to generate N cake design previews.
 * Uses DashScope multimodal-generation API directly (NOT OpenAI-compatible chat).
 * Downloads temp OSS URLs to local disk and returns permanent URLs.
 */
export async function generateCakeImages(
  prompt: string,
  n: number = 3
): Promise<AiImageResult[]> {
  const enhancedPrompt = `A luxury custom cake design: ${prompt}. Professional food photography, elegant presentation, 5-star hotel pastry quality, editorial style, natural lighting, shallow depth of field, warm golden tones.`;

  // Step 1: Generate images via DashScope multimodal-generation API
  const genResp = await postJson(
    "dashscope.aliyuncs.com",
    "/api/v1/services/aigc/multimodal-generation/generation",
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.dashscopeApiKey}`,
    },
    JSON.stringify({
      model: "qwen-image-2.0",
      input: {
        messages: [
          {
            role: "user",
            content: [{ text: enhancedPrompt }],
          },
        ],
      },
      parameters: {
        size: "1024*1024",
        n,
        watermark: false,
        prompt_extend: true,
      },
    })
  );

  if (!genResp.output?.choices?.[0]?.message?.content) {
    console.error("[qwen-image] Unexpected response:", JSON.stringify(genResp).slice(0, 500));
    throw new Error(genResp.message || "Image generation failed");
  }

  const content = genResp.output.choices[0].message.content;
  const imageItems = content.filter(
    (c: any) => c.image || c.image_url?.url || c.url
  );

  if (imageItems.length === 0) {
    throw new Error("No images in response");
  }

  // Step 2: Download each image and save locally
  const results: AiImageResult[] = [];
  for (let i = 0; i < imageItems.length; i++) {
    const imgUrl =
      imageItems[i]?.image || imageItems[i]?.image_url?.url || imageItems[i]?.url;
    if (!imgUrl) continue;

    const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const destPath = path.join(UPLOAD_DIR, filename);

    try {
      await downloadFile(imgUrl, destPath);
      results.push({
        url: `/img/cakes/${filename}`,
        width: genResp.usage?.width || 1024,
        height: genResp.usage?.height || 1024,
      });
    } catch (err: any) {
      console.error(`[qwen-image] Download failed for image ${i}:`, err.message);
    }
  }

  if (results.length === 0) {
    throw new Error("Failed to download any generated images");
  }

  return results;
}
