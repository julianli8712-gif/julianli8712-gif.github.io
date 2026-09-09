import { useState, useEffect } from "react";
import {
  Box, Tabs, Tab, AppBar, Toolbar, Typography, Button,
  Container, CircularProgress, Alert,
} from "@mui/material";
import { Logout } from "@mui/icons-material";
import { login, logout, isLoggedIn, fetchDrinks, fetchFoods } from "../services/api";
import type { Drink, FoodItem } from "../types";
import DrinkEditor from "../components/admin/DrinkEditor";
import FoodEditor from "../components/admin/FoodEditor";

type TabKey = "drinks" | "foods" | "pairings" | "exports";

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>("drinks");

  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Editors
  const [drinkEditorOpen, setDrinkEditorOpen] = useState(false);
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null);
  const [foodEditorOpen, setFoodEditorOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);

  useEffect(() => {
    if (isLoggedIn()) setAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    loadData();
  }, [authenticated]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [d, f] = await Promise.all([fetchDrinks(), fetchFoods()]);
      setDrinks(d.filter((x: Drink) => x.status !== "DELETED"));
      setFoods(f.filter((x: FoodItem) => x.status !== "DELETED"));
    } catch (e: any) {
      setError(e.message || "Failed to load data");
      if (e.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setLoginLoading(true);
    setLoginError("");
    try {
      await login(username, password);
      setAuthenticated(true);
    } catch (e: any) {
      setLoginError(e.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setAuthenticated(false);
    setUsername("");
    setPassword("");
  }

  // ─── Login Screen ──────────────────────────────────────

  if (!authenticated) {
    return (
      <Box sx={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #FDF8F0 0%, #F3E5D0 100%)",
      }}>
        <Box sx={{
          p: 6, maxWidth: 400, width: "100%", textAlign: "center",
          background: "rgba(255,255,255,0.95)", borderRadius: 3,
          boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
        }}>
          <Typography variant="h4" sx={{ mb: 1, fontFamily: "'Cormorant Garamond', serif", color: "#C8A96E" }}>
            Digital Sommelier
          </Typography>
          <Typography variant="body2" sx={{ mb: 4 }}>
            数字侍酒师 · 管理后台
          </Typography>

          {loginError && <Alert severity="error" sx={{ mb: 2 }}>{loginError}</Alert>}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <input
              type="text" placeholder="用户名" value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                padding: "12px 16px", fontSize: 16, border: "1px solid #E8DFD3",
                borderRadius: 6, outline: "none", fontFamily: "'Noto Serif SC', serif",
              }}
            />
            <input
              type="password" placeholder="密码" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{
                padding: "12px 16px", fontSize: 16, border: "1px solid #E8DFD3",
                borderRadius: 6, outline: "none", fontFamily: "'Noto Serif SC', serif",
              }}
            />
            <Button
              variant="contained" fullWidth size="large"
              onClick={handleLogin} disabled={loginLoading}
              sx={{ mt: 1, py: 1.5 }}
            >
              {loginLoading ? "登录中..." : "登录"}
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  // ─── Admin Dashboard ───────────────────────────────────

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={0} sx={{ background: "linear-gradient(135deg, #1A0F0A, #2D1810)" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: "'Cormorant Garamond', serif", color: "#C8A96E" }}>
            Digital Sommelier
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<Logout />} sx={{ color: "#C8A96E" }}>
            退出
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3, mb: 6 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary"
          sx={{ mb: 3, "& .MuiTab-root": { fontFamily: "'Noto Serif SC', serif" } }}
        >
          <Tab label="酒款" value="drinks" />
          <Tab label="餐食" value="foods" />
          <Tab label="搭配" value="pairings" />
          <Tab label="导出" value="exports" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}><CircularProgress size={40} /></Box>
        ) : (
          <>
            {tab === "drinks" && (
              <DrinkTab
                drinks={drinks} onRefresh={loadData}
                onEdit={(d) => { setEditingDrink(d); setDrinkEditorOpen(true); }}
                onAdd={() => { setEditingDrink(null); setDrinkEditorOpen(true); }}
              />
            )}
            {tab === "foods" && (
              <FoodTab
                foods={foods} onRefresh={loadData}
                onEdit={(f) => { setEditingFood(f); setFoodEditorOpen(true); }}
                onAdd={() => { setEditingFood(null); setFoodEditorOpen(true); }}
              />
            )}
            {tab === "pairings" && <PairingTab drinks={drinks} foods={foods} />}
            {tab === "exports" && <ExportTab drinks={drinks} />}
          </>
        )}
      </Container>

      <DrinkEditor
        open={drinkEditorOpen} drink={editingDrink}
        onClose={() => setDrinkEditorOpen(false)}
        onSaved={loadData}
      />
      <FoodEditor
        open={foodEditorOpen} food={editingFood}
        onClose={() => setFoodEditorOpen(false)}
        onSaved={loadData}
      />
    </Box>
  );
}

// ─── Tab Panels ──────────────────────────────────────

function DrinkTab({ drinks, onRefresh, onEdit, onAdd }: {
  drinks: Drink[]; onRefresh: () => void; onEdit: (d: Drink) => void; onAdd: () => void;
}) {
  const typeLabels: Record<string, string> = {
    WINE: "葡萄酒", COCKTAIL: "鸡尾酒", SPIRIT: "烈酒", BEER: "啤酒", SAKE: "清酒", OTHER: "其他",
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: "'Noto Serif SC', serif" }}>
          酒款管理 ({drinks.length})
        </Typography>
        <Button variant="contained" onClick={onAdd}>添加酒款</Button>
      </Box>
      {drinks.length === 0 ? (
        <Typography variant="body2" sx={{ textAlign: "center", py: 6 }}>
          还没有酒款 — 点击"添加酒款"开始
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {drinks.map((d) => (
            <Box key={d.id} sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2, border: "1px solid", borderColor: "divider",
              display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 2, cursor: "pointer",
              "&:hover": { borderColor: "#C8A96E" },
            }} onClick={() => onEdit(d)}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {d.name}
                  </Typography>
                  {d.nameEn && <Typography variant="body2">({d.nameEn})</Typography>}
                  <Chip label={typeLabels[d.type] || d.type} size="small" sx={{ height: 22 }} />
                </Box>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {d.region && <Chip label={d.region} size="small" variant="outlined" />}
                  {d.vintage && <Chip label={d.vintage} size="small" variant="outlined" />}
                  {d.glassPrice != null && (
                    <Typography variant="body2" sx={{ color: "#C8A96E" }}>¥{Number(d.glassPrice)}/杯</Typography>
                  )}
                  {d.bottlePrice != null && (
                    <Typography variant="body2" sx={{ color: "#C8A96E" }}>¥{Number(d.bottlePrice)}/瓶</Typography>
                  )}
                  {d.story && <Chip label="有故事" size="small" sx={{ bgcolor: "#FDF8F0", color: "#C8A96E" }} />}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function FoodTab({ foods, onRefresh, onEdit, onAdd }: {
  foods: FoodItem[]; onRefresh: () => void; onEdit: (f: FoodItem) => void; onAdd: () => void;
}) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: "'Noto Serif SC', serif" }}>
          餐食管理 ({foods.length})
        </Typography>
        <Button variant="contained" onClick={onAdd}>添加餐食</Button>
      </Box>
      {foods.length === 0 ? (
        <Typography variant="body2" sx={{ textAlign: "center", py: 6 }}>
          还没有餐食 — 点击"添加餐食"开始
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {foods.map((f) => (
            <Box key={f.id} sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2, border: "1px solid", borderColor: "divider",
              display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
              "&:hover": { borderColor: "#C8A96E" },
            }} onClick={() => onEdit(f)}>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{f.name}</Typography>
                  {f.nameEn && <Typography variant="body2">({f.nameEn})</Typography>}
                  {f.category && <Chip label={f.category} size="small" />}
                </Box>
                {f.flavorNote && (
                  <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
                    风味：{f.flavorNote}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function PairingTab({ drinks, foods }: { drinks: Drink[]; foods: FoodItem[] }) {
  return (
    <Box sx={{ textAlign: "center", py: 6 }}>
      <Typography variant="h5" sx={{ mb: 2, fontFamily: "'Cormorant Garamond', serif", color: "#C8A96E" }}>
        搭配建议
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        选择酒款或餐食后，AI 将为您生成专业的搭配建议
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
        酒款 {drinks.length} 款 · 餐食 {foods.length} 道
      </Typography>
      {drinks.length > 0 && foods.length > 0 && (
        <Button variant="contained" sx={{ mt: 3 }} disabled>
          搭配功能即将上线
        </Button>
      )}
    </Box>
  );
}

function ExportTab({ drinks }: { drinks: Drink[] }) {
  return (
    <Box sx={{ textAlign: "center", py: 6 }}>
      <Typography variant="h5" sx={{ mb: 2, fontFamily: "'Cormorant Garamond', serif", color: "#C8A96E" }}>
        导出内容
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        将酒款故事和搭配建议导出为精美的可打印内容
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
        已录入 {drinks.length} 款酒，{drinks.filter((d) => d.story).length} 款有故事
      </Typography>
      {drinks.length > 0 && (
        <Button variant="contained" sx={{ mt: 3 }} disabled>
          导出功能即将上线
        </Button>
      )}
    </Box>
  );
}

// Reuse Chip import
import { Chip } from "@mui/material";
