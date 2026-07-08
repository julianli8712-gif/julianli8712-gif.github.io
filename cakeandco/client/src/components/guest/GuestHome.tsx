import { useEffect, useState, useRef } from "react";
import { Box, Typography, Card, CardContent, CardMedia, Chip } from "@mui/material";
import { GoldDivider, FoilDot, CornerDot, foilShimmer } from "../shared/BrandElements";
import { useTranslation } from "react-i18next";
import { fetchCakes } from "../../services/api";
import { useCakeLocale } from "../../services/locale";
import { OCCASIONS } from "../../types";
import type { Cake } from "../../types";

const SCENE_EMOJI: Record<string, string> = {
  "生日": "🎂",
  "纪念日": "💝",
  "下午茶": "🫖",
  "商务": "💼",
  "儿童": "🧒",
  "节日": "🎉",
  "长辈": "🎁",
  "健康无负担": "🥗",
};

export default function GuestHome({
  onGrabGo, onPreOrder, onSceneFilter, onCakeClick, onAIStudio,
}: {
  onGrabGo: () => void;
  onPreOrder: () => void;
  onSceneFilter: (occasion: string) => void;
  onCakeClick: (cake: Cake) => void;
  onAIStudio: () => void;
}) {
  const { t } = useTranslation();
  const { name } = useCakeLocale();
  const [grabCakes, setGrabCakes] = useState<Cake[]>([]);
  const [preorderCakes, setPreorderCakes] = useState<Cake[]>([]);
  const [chefPicks, setChefPicks] = useState<Cake[]>([]);
  const sceneScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCakes({ stock_mode: "GRAB" }).then(setGrabCakes).catch(() => {});
    fetchCakes({ stock_mode: "PREORDER" }).then(setPreorderCakes).catch(() => {});
    fetchCakes().then((all) => setChefPicks(all.filter((c) => c.isChefPick))).catch(() => {});
  }, []);

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Box sx={{ position: "relative", display: "inline-block", mb: 3 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: "50%", bgcolor: "rgba(200,164,92,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "rgba(200,164,92,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box sx={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #E8D080 0%, #C8A45C 30%, #B8922E 60%, #C8A45C 100%)", boxShadow: "0 3px 12px rgba(200,164,92,0.4), 0 1px 3px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.6)", animation: `${foilShimmer} 3s ease-in-out infinite` }} />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 0.5, mb: 0.5 }}>
          <Typography sx={{ fontFamily: "Georgia, serif", fontSize: 28, letterSpacing: 4, color: "primary.main", textShadow: "0 1px 1px rgba(200,164,92,0.2), 0 -1px 0 rgba(255,255,255,0.5)" }}>CAKE &amp; CO</Typography>
          <Box sx={{ width: 9, height: 9, borderRadius: "50%", background: "linear-gradient(135deg, #E8D080 0%, #C8A45C 30%, #B8922E 60%, #C8A45C 100%)", boxShadow: "0 1px 3px rgba(200,164,92,0.5), inset 0 1px 1px rgba(255,255,255,0.5)", animation: `${foilShimmer} 3s ease-in-out infinite` }} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 1, mb: 2 }}>
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 18, letterSpacing: 6, color: "primary.main" }}>汀</Typography>
          <Box sx={{ width: 5, height: 5, borderRadius: "50%", background: "linear-gradient(135deg, #E8D080, #C8A45C, #B8922E)", boxShadow: "0 1px 2px rgba(200,164,92,0.5)" }} />
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 18, letterSpacing: 6, color: "primary.main" }}>作</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, letterSpacing: "0.05em" }}>
          {t("brand.tagline")}
        </Typography>
      </Box>

      <GoldDivider />

      {/* Three entry cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mb: 1 }}>
        <Card sx={{ cursor: "pointer", textAlign: "center", py: 2.5, bgcolor: "background.paper", position: "relative", overflow: "hidden", "&:hover": { transform: "translateY(-2px)", transition: "0.2s", boxShadow: "0 4px 20px rgba(60,36,21,0.1)" } }} onClick={onGrabGo}>
          <Box sx={{ position: "absolute", top: 8, right: 12, width: 4, height: 4, borderRadius: "50%", bgcolor: "secondary.main", opacity: 0.15 }} />
          <Box sx={{ position: "absolute", bottom: 10, left: 14, width: 3, height: 3, borderRadius: "50%", bgcolor: "secondary.main", opacity: 0.1 }} />
          <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "secondary.main", mx: "auto", mb: 1, boxShadow: "0 2px 6px rgba(200,164,92,0.3)" }} />
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, color: "primary.main" }}>{t("home.grabGo")}</Typography>
          <Typography variant="body2" sx={{ fontSize: 11, mt: 0.5 }}>{t("home.grabGoDesc", { count: grabCakes.length })}</Typography>
        </Card>

        <Card sx={{ cursor: "pointer", textAlign: "center", py: 2.5, bgcolor: "background.paper", "&:hover": { transform: "translateY(-2px)", transition: "0.2s", boxShadow: "0 4px 20px rgba(60,36,21,0.1)" } }} onClick={onPreOrder}>
          <Box sx={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid", borderColor: "secondary.main", mx: "auto", mb: 1 }} />
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, color: "primary.main" }}>{t("home.preOrder")}</Typography>
          <Typography variant="body2" sx={{ fontSize: 11, mt: 0.5 }}>{t("home.preOrderDesc", { count: preorderCakes.length })}</Typography>
        </Card>

        <Card sx={{ cursor: "pointer", textAlign: "center", py: 2.5, bgcolor: "background.paper", "&:hover": { transform: "translateY(-2px)", transition: "0.2s", boxShadow: "0 4px 20px rgba(60,36,21,0.1)" } }} onClick={onAIStudio}>
          <Box sx={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg, #C8A45C, #B482DC)", mx: "auto", mb: 1, boxShadow: "0 2px 8px rgba(180,130,220,0.3)" }} />
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, color: "primary.main" }}>{t("home.aiStudio")}</Typography>
          <Typography variant="body2" sx={{ fontSize: 11, mt: 0.5 }}>{t("home.aiStudioDesc")}</Typography>
        </Card>
      </Box>

      <GoldDivider />

      {/* Scene discovery — compact horizontal pill bar */}
      <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, color: "primary.main", mb: 1 }}>
        {t("home.sceneTitle")}
      </Typography>
      <Box
        ref={sceneScrollRef}
        sx={{
          display: "flex", gap: 1, overflowX: "auto", pb: 1, mb: 0,
          scrollSnapType: "x proximity",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {OCCASIONS.map((o) => (
          <Chip
            key={o.key}
            label={`${SCENE_EMOJI[o.key] || ""} ${t(`occasions.${o.key}`)}`}
            onClick={() => onSceneFilter(o.key)}
            variant="outlined"
            sx={{
              flexShrink: 0, px: 1.5, py: 2,
              fontFamily: "'Noto Serif SC', serif",
              fontSize: 13, color: "primary.main",
              borderColor: "rgba(200,164,92,0.25)",
              bgcolor: "background.paper",
              "&:hover": { borderColor: "secondary.main", bgcolor: "rgba(200,164,92,0.04)" },
              "& .MuiChip-label": { px: 0.5 },
            }}
          />
        ))}
      </Box>

      <GoldDivider />

      {/* Chef's Picks — real product showcase */}
      {chefPicks.length > 0 && (
        <>
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, color: "primary.main", mb: 1.5 }}>
            🔥 {t("home.chefPick")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { display: "none" } }}>
            {chefPicks.map((cake) => (
              <Card key={cake.id} sx={{ minWidth: 152, cursor: "pointer", flexShrink: 0, overflow: "hidden", position: "relative", "&:hover": { transform: "translateY(-2px)", transition: "0.2s", boxShadow: "0 4px 16px rgba(60,36,21,0.1)" } }} onClick={() => onCakeClick(cake)}>
                <Box sx={{ position: "relative" }}>
                  <CardMedia component="img" height="140" image={cake.imageUrls?.[0] || "/placeholder-cake.svg"} alt={name(cake)} sx={{ objectFit: "cover" }} />
                  <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(transparent, rgba(0,0,0,0.15))" }} />
                </Box>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography noWrap sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 13, color: "primary.main", mb: 0.5 }}>{name(cake)}</Typography>
                  <Typography sx={{ fontFamily: "Georgia, serif", fontSize: 14, color: "secondary.main" }}>¥{cake.prices?.[0] || "?"}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          <GoldDivider />
        </>
      )}

      {/* Hot picks — grab & go */}
      {grabCakes.length > 0 && (
        <>
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, color: "primary.main", mb: 1.5 }}>
            ⚡ {t("home.todayPick")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { display: "none" } }}>
            {grabCakes.slice(0, 6).map((cake) => (
              <Card key={cake.id} sx={{ minWidth: 152, cursor: "pointer", flexShrink: 0, overflow: "hidden", position: "relative", "&:hover": { transform: "translateY(-2px)", transition: "0.2s", boxShadow: "0 4px 16px rgba(60,36,21,0.1)" } }} onClick={() => onCakeClick(cake)}>
                <Box sx={{ position: "relative" }}>
                  <CardMedia component="img" height="140" image={cake.imageUrls?.[0] || "/placeholder-cake.svg"} alt={name(cake)} sx={{ objectFit: "cover" }} />
                  <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(transparent, rgba(0,0,0,0.15))" }} />
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

          {/* Pre-order preview */}
          <Box sx={{ mt: 3, display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, color: "primary.main" }}>
              📋 {t("home.preOrderShowcase")}
            </Typography>
            <Typography
              onClick={onPreOrder}
              sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 12, color: "secondary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
            >
              {t("home.viewAll")} →
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { display: "none" } }}>
            {preorderCakes.slice(0, 6).map((cake) => (
              <Card key={cake.id} sx={{ minWidth: 152, cursor: "pointer", flexShrink: 0, overflow: "hidden", position: "relative", "&:hover": { transform: "translateY(-2px)", transition: "0.2s", boxShadow: "0 4px 16px rgba(60,36,21,0.1)" } }} onClick={() => onCakeClick(cake)}>
                <Box sx={{ position: "relative" }}>
                  <CardMedia component="img" height="140" image={cake.imageUrls?.[0] || "/placeholder-cake.svg"} alt={name(cake)} sx={{ objectFit: "cover" }} />
                  <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(transparent, rgba(0,0,0,0.15))" }} />
                </Box>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography noWrap sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 13, color: "primary.main", mb: 0.5 }}>{name(cake)}</Typography>
                  <Typography sx={{ fontFamily: "Georgia, serif", fontSize: 14, color: "secondary.main" }}>¥{cake.prices?.[0] || "?"}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
