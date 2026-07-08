import { useState } from "react";
import { Box, Container, AppBar, Toolbar, Typography, IconButton, Button } from "@mui/material";
import { useTranslation } from "react-i18next";
import GuestHome from "../components/guest/GuestHome";
import GrabGoList from "../components/guest/GrabGoList";
import PreOrderList from "../components/guest/PreOrderList";
import CakeDetail from "../components/guest/CakeDetail";
import RecommendPage from "../components/guest/RecommendPage";
import ReserveForm from "../components/guest/ReserveForm";
import AIStudio from "../components/guest/AIStudio";
import OrderLookup from "../components/guest/OrderLookup";
import OrderDetail from "../components/guest/OrderDetail";
import { BrandDot } from "../components/shared/BrandElements";
import type { Cake, Reservation } from "../types";

type View =
  | { name: "home" }
  | { name: "grab-go" }
  | { name: "pre-order" }
  | { name: "scene-filter"; occasion: string }
  | { name: "detail"; cake: Cake }
  | { name: "recommend" }
  | { name: "reserve"; cake: Cake; size?: string; price?: string; aiImage?: string; aiPrompt?: string }
  | { name: "ai-studio" }
  | { name: "order-lookup" }
  | { name: "order-detail"; reservation: Reservation };

export default function GuestPage() {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<View>({ name: "home" });
  const goHome = () => setView({ name: "home" });
  const toggleLang = () => i18n.changeLanguage(i18n.language === "zh" ? "en" : "zh");

  const renderView = () => {
    switch (view.name) {
      case "home":
        return (
          <GuestHome
            onGrabGo={() => setView({ name: "grab-go" })}
            onPreOrder={() => setView({ name: "pre-order" })}
            onSceneFilter={(occasion) => setView({ name: "scene-filter", occasion })}
            onCakeClick={(cake: Cake) => setView({ name: "detail", cake })}
            onAIStudio={() => setView({ name: "ai-studio" })}
          />
        );
      case "grab-go": return <GrabGoList onBack={goHome} onCakeClick={(cake: Cake) => setView({ name: "detail", cake })} />;
      case "pre-order": return <PreOrderList onBack={goHome} initialOccasion="" onCakeClick={(cake: Cake) => setView({ name: "detail", cake })} />;
      case "scene-filter": return <PreOrderList onBack={goHome} initialOccasion={view.occasion} onCakeClick={(cake: Cake) => setView({ name: "detail", cake })} />;
      case "detail": return <CakeDetail cake={view.cake} onBack={goHome} onReserve={(cake: Cake, size?: string, price?: string) => setView({ name: "reserve", cake, size, price })} />;
      case "recommend": return <RecommendPage onBack={goHome} onCakeClick={(cake: Cake) => setView({ name: "detail", cake })} onReserve={(cake: Cake, size?: string, price?: string) => setView({ name: "reserve", cake, size, price })} onViewOrder={(r) => setView({ name: "order-detail", reservation: r })} />;
      case "reserve":
        return (
          <ReserveForm cake={view.cake} size={view.size} price={view.price} aiImage={view.aiImage} aiPrompt={view.aiPrompt} onBack={goHome} onDone={goHome}
            onViewOrder={(r: Reservation) => setView({ name: "order-detail", reservation: r })}
          />
        );
      case "ai-studio": return <AIStudio onBack={goHome} onReserve={(aiImage, aiPrompt) => {
        // Create a placeholder cake for AI custom orders
        const aiCake: Cake = {
          id: "", name: "AI 灵感工坊定制", nameEn: "AI Studio Custom Design",
          category: "whole_mousse", stockMode: "PREORDER", status: "ACTIVE",
          stockQty: 999, lowStockThreshold: 0, isChefPick: false, leadTimeHours: 48,
          imageUrls: [aiImage], sizes: [], prices: [], tags: [], createdAt: new Date().toISOString(),
          description: aiPrompt, descriptionEn: aiPrompt,
        };
        setView({ name: "reserve", cake: aiCake, aiImage, aiPrompt });
      }} />;
      case "order-lookup": return <OrderLookup onBack={goHome} onOrderClick={(r: Reservation) => setView({ name: "order-detail", reservation: r })} />;
      case "order-detail": return <OrderDetail reservation={view.reservation} onBack={() => setView({ name: "order-lookup" })} onStatusChange={() => setView({ name: "order-lookup" })} />;
    }
  };

  return (
    <Box sx={{ pb: 8, minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" sx={{ bgcolor: "background.paper", boxShadow: "none", borderBottom: "1px solid rgba(200,164,92,0.15)" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <IconButton onClick={goHome} edge="start" disableRipple sx={{ p: 0 }}>
            <BrandDot size={12} />
          </IconButton>
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontFamily: "Georgia, serif", fontSize: 18, letterSpacing: 3, color: "primary.main", lineHeight: 1.2 }}>CAKE &amp; CO</Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
              <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 12, letterSpacing: 4, color: "primary.main" }}>汀</Typography>
              <BrandDot size={4} />
              <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 12, letterSpacing: 4, color: "primary.main" }}>作</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            <Button onClick={() => setView({ name: "order-lookup" })} size="small" sx={{ minWidth: 40, fontSize: 10, color: "text.secondary", textTransform: "none" }}>
              {t("order.lookup")}
            </Button>
            <Button onClick={toggleLang} size="small" sx={{ minWidth: 32, fontSize: 10, color: "text.secondary" }}>
              {i18n.language === "zh" ? "EN" : "中"}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ pt: 0 }}>
        {renderView()}
      </Container>

      {/* Footer */}
      <Box sx={{
        textAlign: "center", mt: 6, mb: 0, pt: 4, pb: 3,
        backgroundImage: "radial-gradient(circle, rgba(200,164,92,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
        borderTop: "1px solid rgba(200,164,92,0.1)",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, mb: 1.5 }}>
          <Box sx={{ flex: 0, width: 40, height: "1px", bgcolor: "rgba(200,164,92,0.15)" }} />
          <BrandDot size={6} />
          <Box sx={{ flex: 0, width: 40, height: "1px", bgcolor: "rgba(200,164,92,0.15)" }} />
        </Box>
        <Typography sx={{ fontFamily: "Georgia, serif", fontSize: 12, letterSpacing: 2, color: "rgba(60,36,21,0.4)" }}>CAKE &amp; CO</Typography>
        <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 10, letterSpacing: 3, color: "rgba(60,36,21,0.35)" }}>{t("footer.subbrand")}</Typography>
      </Box>
    </Box>
  );
}
