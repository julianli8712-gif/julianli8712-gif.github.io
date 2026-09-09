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

// Style/angle variants — one per image to force diverse outputs.
// Each gets its own independent API call with a different perspective.
const STYLE_VARIANTS = [
  "Overhead flat lay on marble surface, showing full cake top design, bright natural light, clean minimal composition.",
  "45-degree angle on elegant table setting with afternoon window light, romantic ambiance, golden hour tones, soft bokeh.",
  "Close-up detail shot highlighting texture and layers, editorial food magazine style, natural diffused light.",
];

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

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Call Qwen-Image-2.0 to generate N cake design previews.
 * Uses DashScope multimodal-generation API directly (NOT OpenAI-compatible chat).
 * Downloads temp OSS URLs to local disk and returns permanent URLs.
 * Staggers 3 independent API calls (each with a different style variant) by 700ms
 * to avoid DashScope burst throttle, while keeping each n=1 for output diversity.
 */
export async function generateCakeImages(
  prompt: string,
  _n: number = 3
): Promise<AiImageResult[]> {
  const basePrompt = `A luxury custom cake design: ${prompt}. Professional food photography, 5-star hotel pastry quality, editorial style.`;

  const results: AiImageResult[] = [];

  for (let i = 0; i < STYLE_VARIANTS.length; i++) {
    if (i > 0) await delay(700);

    const fullPrompt = `${basePrompt} ${STYLE_VARIANTS[i]}`;

    const resp = await postJson(
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
              content: [{ text: fullPrompt }],
            },
          ],
        },
        parameters: {
          size: "1024*1024",
          n: 1,
          watermark: false,
          prompt_extend: true,
        },
      })
    );

    if (!resp.output?.choices?.[0]?.message?.content) {
      console.error("[qwen-image] Unexpected response:", JSON.stringify(resp).slice(0, 500));
      continue;
    }

    const content = resp.output.choices[0].message.content;
    const imageItem = content.find((c: any) => c.image || c.image_url?.url || c.url);
    if (!imageItem) continue;

    const imgUrl = imageItem.image || imageItem.image_url?.url || imageItem.url;
    if (!imgUrl) continue;

    const filename = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const destPath = path.join(UPLOAD_DIR, filename);

    try {
      await downloadFile(imgUrl, destPath);
      results.push({ url: `/img/cakes/${filename}`, width: 1024, height: 1024 });
    } catch (err: any) {
      console.error(`[qwen-image] Download failed:`, err.message);
    }
  }

  if (results.length === 0) {
    throw new Error("Failed to generate any images");
  }

  return results;
}
