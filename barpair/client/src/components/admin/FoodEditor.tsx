import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Chip, Alert,
} from "@mui/material";
import { createFood, updateFood, deleteFood } from "../../services/api";
import type { FoodItem } from "../../types";

const FOOD_CATEGORIES = [
  "SMALL_PLATE", "CHEESE", "DESSERT", "CHARCUTERIE", "SNACK", "MAIN",
];

const CATEGORY_LABELS: Record<string, string> = {
  SMALL_PLATE: "小食", CHEESE: "芝士", DESSERT: "甜品",
  CHARCUTERIE: "腊味拼盘", SNACK: "佐酒小食", MAIN: "主食",
};

interface Props {
  open: boolean;
  food: FoodItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function FoodEditor({ open, food, onClose, onSaved }: Props) {
  const isEdit = !!food;
  const [form, setForm] = useState<Partial<FoodItem>>({
    name: "", nameEn: "", category: "", description: "", flavorNote: "",
    imageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (food) {
      setForm({
        name: food.name, nameEn: food.nameEn || "",
        category: food.category || "", description: food.description || "",
        flavorNote: food.flavorNote || "",
        imageUrl: food.imageUrl || "",
      });
    } else {
      setForm({
        name: "", nameEn: "", category: "", description: "", flavorNote: "",
        imageUrl: "",
      });
    }
    setError("");
  }, [food, open]);

  async function handleSave() {
    if (!form.name) return;
    setLoading(true);
    setError("");
    try {
      if (isEdit && food) {
        await updateFood(food.id, form);
      } else {
        await createFood(form);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!food) return;
    if (!confirm(`确定删除「${food.name}」？`)) return;
    setLoading(true);
    try {
      await deleteFood(food.id);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || "Delete failed");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: "'Noto Serif SC', serif" }}>
        {isEdit ? "编辑餐食" : "添加餐食"}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="名称 *" value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <TextField label="英文名" value={form.nameEn || ""} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} />
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {FOOD_CATEGORIES.map((cat) => (
              <Chip
                key={cat} label={CATEGORY_LABELS[cat] || cat}
                variant={form.category === cat ? "filled" : "outlined"}
                onClick={() => setForm((p) => ({ ...p, category: cat }))}
                sx={form.category === cat ? { bgcolor: "#2D1810", color: "#FFF" } : {}}
              />
            ))}
          </Box>

          <TextField label="风味特点" multiline rows={2} value={form.flavorNote || ""} onChange={(e) => setForm((p) => ({ ...p, flavorNote: e.target.value }))} placeholder="例如：烟熏、坚果、奶油感" />
          <TextField label="描述" multiline rows={2} value={form.description || ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />

          <TextField label="图片 URL" value={form.imageUrl || ""} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Box>
          {isEdit && <Button color="error" onClick={handleDelete} disabled={loading}>删除</Button>}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose}>取消</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading || !form.name}>
            {loading ? "保存中..." : "保存"}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
