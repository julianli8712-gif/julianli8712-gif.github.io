#!/usr/bin/env node
/**
 * 部署前检查：检测所有前后端代码中硬编码的外部 URL（非相对路径的 API 端点）。
 *
 * 规则：
 * - 禁止在 API 调用中使用绝对 URL（https://...），必须使用相对路径（'/api/...'或 ''）
 * - 例外：备案链接、cdn、gh、github、google、analytics、gtm、font、Sentry、地图
 *
 * 使用：node scripts/pre-deploy-check.mjs
 *
 * 创建原因：2026-07-16 发现个人主页 index.html 硬编码已下线的 Railway URL，
 *          导致聊天机器人不响应。迁移服务器时前端 URL 忘改，隐藏了两个多月。
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();

// --- Exemptions ---
const URL_EXEMPTIONS = [
  /reactjs\.org/,                                    // React error decoder
  /beian\.(miit|mps)\.gov\.cn/,                     // ICP 备案
  /fonts\.googleapis|fonts\.gstatic/,                // Fonts
  /cdn\./, /unpkg\.com/, /jsdelivr\.net/,           // CDN
  /github\.com/, /gitlab\.com/,                      // Source repos
  /google\.com/, /googletagmanager/,                 // GTM / GA
  /sentry\.io/, /sentry\.dev/,                      // Error monitoring
  /map\.baidu/, /map\.qq/, /amap\.com/,             // Maps
  /oss-accelerate/, /aliyuncs\.com/,                // OSS / DashScope
  /supabase\.co/,                                    // DB provider
  /linkedin\.com/, /tripadvisor/, /dianping/,       // 个人主页推荐链接
  /facebook\.com/, /instagram\.com/,                // 社交
  /weixin\.qq\.com/, /wechat\.com/,                 // WeChat
];

// --- Patterns that match hardcoded prod URLs in API calls ---
const API_URL_PATTERNS = [
  /API_BASE\s*=\s*['"]https?:\/\//,
  /baseURL\s*:\s*['"]https?:\/\//,
  /fetch\(\s*['"]https?:\/\//,
  /axios\.(get|post|put|delete)\(\s*['"]https?:\/\//,
  /axios\.create\(\s*\{\s*baseURL\s*:\s*['"]https?:\/\//,
];

function shouldSkip(filePath) {
  if (filePath.includes('node_modules')) return true;
  if (filePath.includes('.git/')) return true;
  if (filePath.endsWith('.min.js')) return true;
  if (filePath.endsWith('.jpg') || filePath.endsWith('.png') || filePath.endsWith('.svg')) return true;
  if (filePath.endsWith('.lock')) return true;
  if (filePath.endsWith('.json')) return true;
  return false;
}

function isExempted(url) {
  return URL_EXEMPTIONS.some((rx) => rx.test(url));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];

  // Check API base URL patterns
  for (const pat of API_URL_PATTERNS) {
    if (pat.test(content)) {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (pat.test(lines[i])) {
          // Extract the URL
          const m = lines[i].match(/(['"])(https?:\/\/[^'"]+)\1/);
          if (m && !isExempted(m[2])) {
            issues.push({
              line: i + 1,
              text: lines[i].trim(),
              url: m[2],
              type: 'HARDCODED_PRODUCTION_URL',
            });
          }
        }
      }
    }
  }

  return issues;
}

function gitTrackedFiles() {
  try {
    const out = execSync('git ls-files -z', { cwd: ROOT, encoding: 'utf-8' });
    return out.split('\0').filter(Boolean).map((f) => path.resolve(ROOT, f));
  } catch {
    // Not a git repo — fall back to find
    const out = execSync(`find "${ROOT}" -type f \\( -name '*.html' -o -name '*.js' -o -name '*.ts' -o -name '*.tsx' -o -name '*.jsx' \\)`, { encoding: 'utf-8' });
    return out.trim().split('\n').map((f) => path.resolve(ROOT, f));
  }
}

// ---- MAIN ----
const allIssues = [];
const files = gitTrackedFiles().filter((f) => !shouldSkip(f));
const total = files.length;

for (let i = 0; i < files.length; i++) {
  const issues = scanFile(files[i]);
  if (issues.length) {
    allIssues.push({ file: files[i].replace(ROOT + '/', ''), issues });
  }
}

console.log(`\n🔍 已扫描 ${total} 个文件\n`);

if (allIssues.length === 0) {
  console.log('✅ 未发现硬编码的外部 API URL');
  console.log('   (所有 API 调用都正确使用相对路径)\n');
  process.exit(0);
}

console.log(`❌ 发现 ${allIssues.reduce((s, f) => s + f.issues.length, 0)} 处问题:\n`);

for (const f of allIssues) {
  console.log(`📄 ${f.file}:`);
  for (const iss of f.issues) {
    console.log(`   L${String(iss.line).padStart(4)}  🔴 ${iss.url}`);
    console.log(`          ${iss.text.trim().substring(0, 100)}`);
  }
  console.log('');
}

console.log('💡 修复方法: 把 API_BASE/baseURL 改成相对路径');
console.log('   例如: "https://xxx.railway.app" → "" 或 "/api"\n');
process.exit(1);
