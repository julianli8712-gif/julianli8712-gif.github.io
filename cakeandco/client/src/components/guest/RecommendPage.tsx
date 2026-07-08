import { useState } from "react";
import { Box, Typography, Card, CardMedia, CardContent, Chip, IconButton } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { useCakeLocale } from "../../services/locale";
import { recommendByOccasion } from "../../services/api";
import { OCCASIONS } from "../../types";
import { Dot } from "../shared/BrandElements";
import type { Cake, RecommendResult } from "../../types";


function LoadingDot({ text }: { text: string }) {
  return (
    <Box sx={{ textAlign: "center", py: 6 }}>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mb: 3 }}>
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "secondary.main", animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.2}s`, "@keyframes pulse": { "0%, 100%": { opacity: 0.2, transform: "scale(0.8)" }, "50%": { opacity: 1, transform: "scale(1.2)" } } }} />
        ))}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>{text}</Typography>
    </Box>
  );
}

// Golden dots for match score instead of green badge
function MatchDots({ score }: { score: number }) {
  const filled = Math.round(score / 2); // Convert 1-10 to 1-5 dots
  return (
    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Box key={i} sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: i < filled ? "secondary.main" : "rgba(200,164,92,0.2)" }} />
      ))}
    </Box>
  );
}

export default function RecommendPage({ onBack, onCakeClick, onReserve, onViewOrder }: { onBack: () => void; onCakeClick: (cake: Cake) => void; onReserve: (cake: Cake, size?: string, price?: string) => void; onViewOrder: (r: any) => void }) {
  const { t } = useTranslation();
  const { name } = useCakeLocale();
  const [occasion, setOccasion] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendResult[]>([]);

  const handleRecommend = async (occ: string) => {
    setOccasion(occ);
    setLoading(true);
    setResults([]);
    try { const { results: res } = await recommendByOccasion({ occasion: occ }); setResults(res); } catch {}
    setLoading(false);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={onBack} size="small"><ArrowBack /></IconButton>
        <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "primary.main", ml: 1, display: "flex", alignItems: "center" }}>
          <Dot />{t("recommend.title")}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: "italic" }}>
        {t("recommend.desc")}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        {OCCASIONS.map((o) => (
          <Chip key={o.key} label={o.label} onClick={() => handleRecommend(o.key)} variant={occasion === o.key ? "filled" : "outlined"} sx={{ fontSize: 14, py: 2.5, px: 1.5, fontFamily: "'Noto Serif SC', serif" }} />
        ))}
      </Box>

      {loading && <LoadingDot text={t("recommend.loading")} />}

      {results.length > 0 && (
        <Box>
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, color: "primary.main", mb: 2 }}>
            {t("recommend.resultCount", { n: results.length })}
          </Typography>
          {results.map((r, i) => (
            <Card key={i} sx={{ mb: 2, cursor: "pointer", overflow: "hidden" }} onClick={() => onCakeClick(r.cake)}>
              <Box sx={{ display: "flex" }}>
                <CardMedia component="img" image={r.cake.imageUrls?.[0] || "/placeholder-cake.svg"} alt={name(r.cake)} sx={{ width: 120, height: 120, objectFit: "cover" }} />
                <CardContent sx={{ flex: 1, p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, color: "primary.main" }}>{name(r.cake)}</Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}><MatchDots score={r.occasionFit} /></Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", fontSize: 13, mb: 0.5 }}>{r.reason}</Typography>
                  {r.pairingDrink && <Typography variant="caption" color="text.secondary">{t("recommend.pairing")}：{r.pairingDrink}</Typography>}
                </CardContent>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
