import { useState } from "react";
import { Box, Typography, TextField, Button, IconButton, Card, CardMedia, Chip } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { generateAiImage } from "../../services/api";
import { foilShimmer } from "../shared/BrandElements";
import type { AiImageResult } from "../../types";

const INSPIRATIONS_ZH = [
  { label: "🌹 浪漫花卉", prompt: "优雅的花卉装饰蛋糕，淡粉色系奶油裱花，点缀新鲜玫瑰花瓣" },
  { label: "🍫 黑巧奢华", prompt: "高级黑巧克力镜面淋面，金箔装饰，奢华现代风格" },
  { label: "🎂 极简韩式", prompt: "简约韩式裱花风格，柔和的马卡龙色调，干净流畅的线条" },
  { label: "🧧 中式韵味", prompt: "中式古典风格，红色和金色装饰，融入中国传统纹样元素" },
  { label: "✨ 星空幻彩", prompt: "星空主题，深蓝渐变淋面，银色糖珠点缀，梦幻优雅" },
  { label: "🍵 日式抹茶", prompt: "日式抹茶千层，绿色渐变，简约侘寂美学，自然质朴" },
];

const INSPIRATIONS_EN = [
  { label: "🌹 Floral Romance", prompt: "Elegant floral decorated cake with soft pink cream piping and fresh rose petals" },
  { label: "🍫 Dark Luxury", prompt: "Premium dark chocolate mirror glaze with gold leaf decoration, luxurious modern style" },
  { label: "🎂 Korean Minimalist", prompt: "Minimalist Korean-style piping with soft macaron tones, clean flowing lines" },
  { label: "🧧 Chinese Elegance", prompt: "Classical Chinese style with red and gold decorations, traditional pattern elements" },
  { label: "✨ Galaxy Dream", prompt: "Galaxy themed cake with deep blue gradient glaze and silver sugar pearl accents" },
  { label: "🍵 Matcha Zen", prompt: "Japanese matcha mille crepe with green gradient, wabi-sabi minimalist aesthetic" },
];

export default function AIStudio({
  onBack,
  onReserve,
}: {
  onBack: () => void;
  onReserve: (aiImage: string, aiPrompt: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh";
  const inspirations = isZh ? INSPIRATIONS_ZH : INSPIRATIONS_EN;

  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<AiImageResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(t("aiStudio.loading1"));
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError("");
    setImages([]);
    setSelectedIdx(null);

    // Rotate loading texts
    const texts = [t("aiStudio.loading1"), t("aiStudio.loading2"), t("aiStudio.loading3")];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % texts.length;
      setLoadingText(texts[idx]);
    }, 3000);

    try {
      const results = await generateAiImage(trimmed);
      setImages(results);
    } catch (err: any) {
      const msg = err?.response?.status === 429
        ? t("aiStudio.errorRateLimit")
        : err?.response?.data?.message || t("aiStudio.errorGeneration");
      setError(msg);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleUseDesign = () => {
    if (selectedIdx === null || !images[selectedIdx]) return;
    onReserve(images[selectedIdx].url, prompt.trim());
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={onBack} size="small"><ArrowBack /></IconButton>
        <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "primary.main", ml: 1 }}>
          {t("aiStudio.title")}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: "italic", lineHeight: 1.8 }}>
        {t("aiStudio.desc")}
      </Typography>

      {/* Prompt input */}
      <TextField
        multiline
        rows={4}
        fullWidth
        placeholder={t("aiStudio.promptPlaceholder")}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value.slice(0, 200))}
        onKeyDown={handleKeyDown}
        disabled={loading}
        sx={{
          mb: 1,
          "& .MuiOutlinedInput-root": {
            fontFamily: "'Noto Serif SC', serif",
            fontSize: 14,
            bgcolor: "background.paper",
          },
        }}
      />
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11, mb: 1.5 }}>
        {prompt.length}/200 {t("aiStudio.promptHint")}
      </Typography>

      {/* Inspiration chips */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 2.5 }}>
        {inspirations.map((ins) => (
          <Chip
            key={ins.label}
            label={ins.label}
            size="small"
            variant="outlined"
            disabled={loading}
            onClick={() => setPrompt(ins.prompt)}
            sx={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 12,
              borderColor: "rgba(200,164,92,0.25)",
              color: "primary.main",
              cursor: "pointer",
              "&:hover": { borderColor: "secondary.main", bgcolor: "rgba(200,164,92,0.04)" },
            }}
          />
        ))}
      </Box>

      {/* Generate button */}
      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleGenerate}
        disabled={!prompt.trim() || loading}
        sx={{
          py: 1.5,
          fontSize: 15,
          fontFamily: "'Noto Serif SC', serif",
          bgcolor: "secondary.main",
          color: "#FFF",
          "&:hover": { bgcolor: "#B8922E" },
          "&:disabled": { bgcolor: "rgba(200,164,92,0.2)", color: "rgba(60,36,21,0.3)" },
          mb: 3,
        }}
      >
        🎨 {t("aiStudio.btnGenerate")}
      </Button>

      {/* Loading state */}
      {loading && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          {/* Skeleton grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mb: 2 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  aspectRatio: "1",
                  bgcolor: "rgba(200,164,92,0.06)",
                  borderRadius: 2,
                  animation: "pulse 1.5s ease-in-out infinite",
                  animationDelay: `${i * 0.3}s`,
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 0.3 },
                    "50%": { opacity: 0.7 },
                  },
                }}
              />
            ))}
          </Box>

          {/* Animated dots */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1.5 }}>
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 8, height: 8, borderRadius: "50%",
                  bgcolor: "secondary.main",
                  animation: "pulse 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 0.2, transform: "scale(0.8)" },
                    "50%": { opacity: 1, transform: "scale(1.2)" },
                  },
                }}
              />
            ))}
          </Box>
          <Typography
            sx={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 13,
              color: "secondary.main",
              animation: "fadeInOut 2s ease-in-out infinite",
              "@keyframes fadeInOut": { "0%, 100%": { opacity: 0.5 }, "50%": { opacity: 1 } },
            }}
          >
            {loadingText}
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, color: "error.main", mb: 1 }}>
            {error}
          </Typography>
          <Button size="small" variant="outlined" onClick={() => { setError(""); setPrompt(""); }}>
            {t("aiStudio.btnRegenerate")}
          </Button>
        </Box>
      )}

      {/* Results grid */}
      {!loading && images.length > 0 && !error && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mb: 2 }}>
            {images.map((img, i) => (
              <Card
                key={i}
                onClick={() => setSelectedIdx(i)}
                sx={{
                  cursor: "pointer",
                  overflow: "hidden",
                  position: "relative",
                  border: selectedIdx === i ? "2px solid" : "2px solid transparent",
                  borderColor: selectedIdx === i ? "secondary.main" : "transparent",
                  boxShadow: selectedIdx === i ? "0 0 0 3px rgba(200,164,92,0.25)" : "0 1px 4px rgba(60,36,21,0.08)",
                  transition: "border 0.2s, box-shadow 0.2s",
                  "&:hover": { borderColor: "rgba(200,164,92,0.4)" },
                }}
              >
                <CardMedia
                  component="img"
                  image={img.url}
                  alt={`Design ${i + 1}`}
                  sx={{ aspectRatio: "1", objectFit: "cover" }}
                />
                {selectedIdx === i && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 6, right: 6,
                      width: 22, height: 22, borderRadius: "50%",
                      background: "linear-gradient(135deg, #E8D080, #C8A45C, #B8922E)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 1px 4px rgba(200,164,92,0.5)",
                      animation: `${foilShimmer} 3s ease-in-out infinite`,
                    }}
                  >
                    <Typography sx={{ fontSize: 12, color: "#FFF", lineHeight: 1 }}>✓</Typography>
                  </Box>
                )}
              </Card>
            ))}
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => { setPrompt(""); setImages([]); setSelectedIdx(null); }}
              sx={{
                py: 1.5,
                fontFamily: "'Noto Serif SC', serif",
                borderColor: "rgba(200,164,92,0.3)",
                color: "primary.main",
              }}
            >
              🔄 {t("aiStudio.btnRegenerate")}
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleUseDesign}
              disabled={selectedIdx === null}
              sx={{
                py: 1.5,
                fontFamily: "'Noto Serif SC', serif",
                fontSize: 14,
                bgcolor: "secondary.main",
                color: "#FFF",
                "&:hover": { bgcolor: "#B8922E" },
                "&:disabled": { bgcolor: "rgba(200,164,92,0.2)", color: "rgba(60,36,21,0.3)" },
              }}
            >
              💾 {t("aiStudio.btnUseThis")}
            </Button>
          </Box>
          {selectedIdx === null && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 1, fontSize: 12, fontStyle: "italic" }}>
              {t("aiStudio.selectHint")}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
