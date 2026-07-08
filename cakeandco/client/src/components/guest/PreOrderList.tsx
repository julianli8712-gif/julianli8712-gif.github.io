import { useEffect, useState } from "react";
import { Box, Typography, Card, CardMedia, CardContent, Chip, IconButton } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { useCakeLocale } from "../../services/locale";
import { fetchCakes } from "../../services/api";
import { OCCASIONS } from "../../types";
import { CircleOutline } from "../shared/BrandElements";
import type { Cake } from "../../types";


export default function PreOrderList({ onBack, initialOccasion, onCakeClick }: { onBack: () => void; initialOccasion: string; onCakeClick: (cake: Cake) => void }) {
  const { t } = useTranslation();
  const { name } = useCakeLocale();
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [occasion, setOccasion] = useState(initialOccasion || "");

  useEffect(() => { fetchCakes({ stock_mode: "PREORDER" }).then(setCakes).catch(() => {}); }, []);

  const filtered = occasion ? cakes.filter((c) => c.tags?.some((t) => t.name === occasion)) : cakes;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={onBack} size="small"><ArrowBack /></IconButton>
        <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "primary.main", ml: 1, display: "flex", alignItems: "center" }}>
          <CircleOutline />{t("preOrder.title")}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: 2 }}>
        <Chip label={t("preOrder.all")} variant={!occasion ? "filled" : "outlined"} onClick={() => setOccasion("")} size="small" />
        {OCCASIONS.map((o) => (
          <Chip key={o.key} label={t(`occasions.${o.key}`)} variant={occasion === o.key ? "filled" : "outlined"} onClick={() => setOccasion(o.key)} size="small" />
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
        {filtered.map((cake) => (
          <Card key={cake.id} sx={{ cursor: "pointer", overflow: "hidden", position: "relative", "&:hover": { transform: "translateY(-2px)", transition: "0.2s", boxShadow: "0 4px 16px rgba(60,36,21,0.1)" } }} onClick={() => onCakeClick(cake)}>
            <Box sx={{ position: "relative" }}>
              <CardMedia component="img" height="150" image={cake.imageUrls?.[0] || "/placeholder-cake.svg"} alt={name(cake)} sx={{ objectFit: "cover" }} />
              <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(transparent, rgba(0,0,0,0.1))" }} />
              <Box sx={{ position: "absolute", bottom: 6, right: 6, width: 6, height: 6, borderRadius: "50%", bgcolor: "secondary.main", opacity: 0.5 }} />
            </Box>
            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 13, color: "primary.main", mb: 0.5 }}>{name(cake)}</Typography>
              <Typography variant="body2" sx={{ fontSize: 11, mb: 0.5 }}>{t("preOrder.leadTime", { h: cake.leadTimeHours })} · ¥{cake.prices?.[0] || "?"}</Typography>
              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                {cake.tags?.slice(0, 3).map((tag) => (
                  <Chip key={tag.name} label={t(`occasions.${tag.name}`)} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
