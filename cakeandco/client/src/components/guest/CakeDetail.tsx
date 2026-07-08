import { useState } from "react";
import { Box, Typography, CardMedia, Chip, Button, IconButton } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { useCakeLocale } from "../../services/locale";
import { Dot } from "../shared/BrandElements";
import type { Cake } from "../../types";


export default function CakeDetail({ cake, onBack, onReserve }: { cake: Cake; onBack: () => void; onReserve: (cake: Cake, size?: string, price?: string) => void }) {
  const { t } = useTranslation();
  const { name, description } = useCakeLocale();
  const [selectedSize, setSelectedSize] = useState(cake.sizes?.[0] || "");
  const priceIndex = cake.sizes?.indexOf(selectedSize);
  const currentPrice = priceIndex >= 0 ? cake.prices?.[priceIndex] : cake.prices?.[0];
  const isGrab = cake.stockMode === "GRAB";

  return (
    <Box>
      <IconButton onClick={onBack} size="small" sx={{ mb: 1 }}><ArrowBack /></IconButton>

      {/* Full-width image */}
      <Box sx={{ mx: -2, mb: 0 }}>
        <CardMedia component="img" height="320" image={cake.imageUrls?.[0] || "/placeholder-cake.svg"} alt={name(cake)} sx={{ objectFit: "cover" }} />
      </Box>

      {/* Gold divider after image */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, my: 2 }}>
        <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(200,164,92,0.25)" }} />
        <Dot size={5} opacity={0.5} />
        <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(200,164,92,0.25)" }} />
      </Box>

      {/* Mode badge */}
      <Chip label={isGrab ? t("cakeDetail.stockGrab") : t("cakeDetail.stockPreorder")} size="small" sx={{ mb: 1, fontFamily: "'Noto Serif SC', serif", fontSize: 11 }} variant="outlined" />

      {/* Name + Price */}
      <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 22, color: "primary.main", mb: 0.5 }}>{name(cake)}</Typography>
      <Typography sx={{ fontFamily: "Georgia, serif", fontSize: 20, color: "secondary.main", mb: 2 }}>¥{currentPrice || "?"}</Typography>

      {/* Tags */}
      <Box sx={{ display: "flex", gap: 0.5, mb: 2, flexWrap: "wrap" }}>
        {cake.tags?.map((t) => <Chip key={t.name} label={t.name} size="small" variant="outlined" />)}
      </Box>

      {/* Description */}
      {cake.description && <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.8 }}>{description(cake)}</Typography>}

      {/* Tasting note */}
      {cake.tastingNote && (
        <Box sx={{ bgcolor: "#FFF9F0", p: 2.5, borderRadius: 2, mb: 2, border: "1px solid rgba(200,164,92,0.15)" }}>
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 13, color: "secondary.main", mb: 0.5 }}>{t("cakeDetail.tasteNote")}</Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>{cake.tastingNote}</Typography>
        </Box>
      )}

      {/* Pairing */}
      {cake.pairingDrink && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: "italic" }}>
          {t("cakeDetail.pairing")}：{cake.pairingDrink}
        </Typography>
      )}

      {/* Size selector — gold dot as radio */}
      {cake.sizes?.length > 1 && (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 13, color: "primary.main", mb: 1 }}>{t("cakeDetail.size")}</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {cake.sizes.map((size, i) => (
              <Box
                key={size}
                onClick={() => setSelectedSize(size)}
                sx={{
                  cursor: "pointer", px: 2, py: 1, borderRadius: 2,
                  border: selectedSize === size ? "1.5px solid" : "1px solid rgba(200,164,92,0.2)",
                  borderColor: selectedSize === size ? "secondary.main" : undefined,
                  bgcolor: selectedSize === size ? "rgba(200,164,92,0.06)" : "background.paper",
                  display: "flex", alignItems: "center", gap: 1,
                }}
              >
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid", borderColor: selectedSize === size ? "secondary.main" : "rgba(200,164,92,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selectedSize === size && <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "secondary.main" }} />}
                </Box>
                <Typography sx={{ fontSize: 13 }}>{size}</Typography>
                <Typography sx={{ fontFamily: "Georgia, serif", fontSize: 13, color: "secondary.main", ml: "auto" }}>¥{cake.prices?.[i] || "?"}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Stock info */}
      <Typography variant="body2" sx={{ mb: 2, color: isGrab && cake.stockQty <= cake.lowStockThreshold ? "warning.main" : "text.secondary" }}>
        {isGrab ? (cake.stockQty <= cake.lowStockThreshold ? t("cakeDetail.lowStock", { n: cake.stockQty }) : t("cakeDetail.inStock", { n: cake.stockQty })) : t("cakeDetail.leadTime", { h: cake.leadTimeHours })}
      </Typography>

      <Button variant="contained" size="large" fullWidth onClick={() => onReserve(cake, selectedSize, currentPrice)} sx={{ py: 1.5, fontSize: 15 }}>
        {isGrab ? t("cakeDetail.reserveNow") : t("cakeDetail.reservePre")}
      </Button>
    </Box>
  );
}
