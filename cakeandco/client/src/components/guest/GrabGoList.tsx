import { useEffect, useState } from "react";
import { Box, Typography, Card, CardMedia, CardContent, Chip, IconButton } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { useCakeLocale } from "../../services/locale";
import { fetchCakes } from "../../services/api";
import { CATEGORIES, GRAB_SIZE_GROUPS } from "../../types";
import { Dot } from "../shared/BrandElements";
import type { Cake } from "../../types";


export default function GrabGoList({ onBack, onCakeClick }: { onBack: () => void; onCakeClick: (cake: Cake) => void }) {
  const { t } = useTranslation();
  const { name } = useCakeLocale();
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [sizeGroup, setSizeGroup] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  useEffect(() => { fetchCakes({ stock_mode: "GRAB" }).then(setCakes).catch(() => {}); }, []);

  const sizeCategories = sizeGroup ? GRAB_SIZE_GROUPS[sizeGroup]?.categories || [] : [];
  const filtered = cakes.filter((c) => {
    if (sizeGroup && !sizeCategories.includes(c.category)) return false;
    if (category && c.category !== category) return false;
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={onBack} size="small"><ArrowBack /></IconButton>
        <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "primary.main", ml: 1, display: "flex", alignItems: "center" }}>
          <Dot />{t("grabGo.title")}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 0.8, mb: 1 }}>
        <Chip label={t("grabGo.all")} variant={!sizeGroup ? "filled" : "outlined"} onClick={() => { setSizeGroup(""); setCategory(""); }} size="small" />
        {Object.entries(GRAB_SIZE_GROUPS).map(([key, group]) => (
          <Chip key={key} label={t(`grabGo.${key}`)} variant={sizeGroup === key ? "filled" : "outlined"} onClick={() => { setSizeGroup(key); setCategory(""); }} size="small" />
        ))}
      </Box>

      {sizeGroup && (
        <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: 2 }}>
          <Chip label={t("grabGo.all")} variant={!category ? "filled" : "outlined"} onClick={() => setCategory("")} size="small" />
          {GRAB_SIZE_GROUPS[sizeGroup]?.categories.map((cat) => (
            <Chip key={cat} label={t(`categories.${cat}`)} variant={category === cat ? "filled" : "outlined"} onClick={() => setCategory(cat)} size="small" />
          ))}
        </Box>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
        {filtered.map((cake) => (
          <Card key={cake.id} sx={{ cursor: "pointer", overflow: "hidden", position: "relative", "&:hover": { transform: "translateY(-2px)", transition: "0.2s", boxShadow: "0 4px 16px rgba(60,36,21,0.1)" } }} onClick={() => onCakeClick(cake)}>
            <Box sx={{ position: "relative" }}>
              <CardMedia component="img" height="140" image={cake.imageUrls?.[0] || "/placeholder-cake.svg"} alt={name(cake)} sx={{ objectFit: "cover" }} />
              <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(transparent, rgba(0,0,0,0.1))" }} />
              <Box sx={{ position: "absolute", bottom: 6, right: 6, width: 6, height: 6, borderRadius: "50%", bgcolor: "secondary.main", opacity: 0.5 }} />
            </Box>
            <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography noWrap sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 13, color: "primary.main", mb: 0.5 }}>{name(cake)}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography sx={{ fontFamily: "Georgia, serif", fontSize: 14, color: "secondary.main" }}>¥{cake.prices?.[0] || "?"}</Typography>
                {cake.stockQty <= cake.lowStockThreshold && (
                  <Chip label={t("grabGo.onlyLeft", { n: cake.stockQty })} size="small" sx={{ height: 18, fontSize: 10, bgcolor: "warning.main", color: "#FFF" }} />
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
