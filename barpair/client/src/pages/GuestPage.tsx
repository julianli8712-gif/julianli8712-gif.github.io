import { useState, useEffect } from "react";
import { Box, Typography, Container, Chip, CircularProgress, Tabs, Tab } from "@mui/material";
import { fetchDrinks, fetchFoods, fetchProfile } from "../services/api";
import type { Drink, FoodItem, BarProfile } from "../types";

export default function GuestPage() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [profile, setProfile] = useState<BarProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"wines" | "foods">("wines");

  useEffect(() => {
    (async () => {
      try {
        const [d, f, p] = await Promise.all([
          fetchDrinks({ status: "ACTIVE" }),
          fetchFoods({ status: "ACTIVE" }),
          fetchProfile(),
        ]);
        setDrinks(d);
        setFoods(f);
        setProfile(p);
      } catch (e) {
        console.error("Failed to load menu", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const typeLabels: Record<string, string> = {
    WINE: "葡萄酒", COCKTAIL: "鸡尾酒", SPIRIT: "烈酒", BEER: "啤酒", SAKE: "清酒", OTHER: "其他",
  };

  const typeGroups = drinks.reduce((acc, d) => {
    const key = d.type || "OTHER";
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {} as Record<string, Drink[]>);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress size={24} sx={{ color: "#C8A96E" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FDF8F0" }}>
      {/* Bar header */}
      <Box sx={{
        background: "linear-gradient(135deg, #1A0F0A, #2D1810)", color: "#FFFFFF",
        py: 4, textAlign: "center", position: "relative",
      }}>
        <Typography variant="h4" sx={{ fontFamily: "'Cormorant Garamond', serif", color: "#C8A96E", mb: 0.5 }}>
          {profile?.nameEn || "Wine List"}
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
          {profile?.name || "酒单"}
        </Typography>
        {profile?.description && (
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(255,255,255,0.5)", maxWidth: 400, mx: "auto" }}>
            {profile.description}
          </Typography>
        )}
      </Box>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary" centered>
          <Tab label={`酒单 (${drinks.length})`} value="wines" />
          <Tab label={`小食 (${foods.length})`} value="foods" />
        </Tabs>

        {tab === "wines" && (
          <Box sx={{ mt: 2 }}>
            {Object.entries(typeGroups).map(([type, items]) => (
              <Box key={type} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontFamily: "'Noto Serif SC', serif", mb: 1, color: "#C8A96E" }}>
                  {typeLabels[type] || type}
                </Typography>
                {items.map((d) => (
                  <Box key={d.id} sx={{ p: 2, mb: 1, bgcolor: "#FFFFFF", borderRadius: 2, border: "1px solid", borderColor: "#E8DFD3" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {d.name}
                        {d.nameEn && <Typography component="span" variant="body2" sx={{ ml: 1, color: "text.secondary" }}>{d.nameEn}</Typography>}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                      {d.region && <Chip label={d.region} size="small" variant="outlined" />}
                      {d.subtype && <Chip label={d.subtype} size="small" variant="outlined" />}
                      {d.vintage && <Chip label={d.vintage} size="small" variant="outlined" />}
                      {d.abv != null && <Chip label={`${Number(d.abv)}%`} size="small" variant="outlined" />}
                    </Box>

                    {d.tastingNote && (
                      <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5, fontStyle: "italic" }}>
                        {d.tastingNote}
                      </Typography>
                    )}

                    {d.story && (
                      <Typography variant="body2" sx={{ mt: 1, pt: 1, borderTop: "1px solid", borderColor: "#E8DFD3", lineHeight: 1.7 }}>
                        {d.story}
                      </Typography>
                    )}

                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1, gap: 2 }}>
                      {d.glassPrice != null && (
                        <Typography variant="body2" sx={{ fontFamily: "'Cormorant Garamond', serif" }}>
                          ¥{Number(d.glassPrice)} / 杯
                        </Typography>
                      )}
                      {d.bottlePrice != null && (
                        <Typography variant="body2" sx={{ fontFamily: "'Cormorant Garamond', serif", color: "#C8A96E" }}>
                          ¥{Number(d.bottlePrice)} / 瓶
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        )}

        {tab === "foods" && (
          <Box sx={{ mt: 2 }}>
            {foods.map((f) => (
              <Box key={f.id} sx={{ p: 2, mb: 1, bgcolor: "#FFFFFF", borderRadius: 2, border: "1px solid", borderColor: "#E8DFD3" }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {f.name}
                  {f.nameEn && <Typography component="span" variant="body2" sx={{ ml: 1, color: "text.secondary" }}>{f.nameEn}</Typography>}
                </Typography>
                {f.flavorNote && (
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontStyle: "italic" }}>
                    {f.flavorNote}
                  </Typography>
                )}
                {f.description && (
                  <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                    {f.description}
                  </Typography>
                )}
              </Box>
            ))}
            {foods.length === 0 && (
              <Typography variant="body2" sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                暂无餐食
              </Typography>
            )}
          </Box>
        )}
      </Container>

      {/* Footer */}
      <Box sx={{ textAlign: "center", py: 3, color: "#C8A96E", opacity: 0.6 }}>
        <Typography variant="body2" sx={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.75rem" }}>
          Powered by Digital Sommelier
        </Typography>
      </Box>
    </Box>
  );
}
