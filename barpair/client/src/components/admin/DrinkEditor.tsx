import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Chip, Alert, CircularProgress, Typography,
} from "@mui/material";
import { createDrink, updateDrink, deleteDrink, generateStory, uploadImage } from "../../services/api";
import type { Drink } from "../../types";

const DRINK_TYPES = [
  { value: "WINE", label: "葡萄酒" },
  { value: "COCKTAIL", label: "鸡尾酒" },
  { value: "SPIRIT", label: "烈酒" },
  { value: "BEER", label: "啤酒" },
  { value: "SAKE", label: "清酒" },
  { value: "OTHER", label: "其他" },
];

const DRINK_SUBTYPES: Record<string, string[]> = {
  WINE: ["RED", "WHITE", "ROSE", "SPARKLING", "FORTIFIED", "ORANGE"],
  COCKTAIL: ["CLASSIC", "SIGNATURE", "SPRITZ", "SOUR", "STIRRED"],
  SPIRIT: ["WHISKY", "GIN", "VODKA", "RUM", "TEQUILA", "BRANDY", "BAIJIU"],
  BEER: ["CRAFT", "LAGER", "ALE", "STOUT", "SOUR_BEER"],
  SAKE: ["JUNMAI", "GINJO", "DAIGINJO", "NIGORI"],
  OTHER: [],
};

interface Props {
  open: boolean;
  drink: Drink | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function DrinkEditor({ open, drink, onClose, onSaved }: Props) {
  const isEdit = !!drink;
  const [form, setForm] = useState<Partial<Drink>>({
    name: "", nameEn: "", type: "WINE", subtype: "",
    region: "", producer: "", vintage: "", abv: undefined,
    bottlePrice: undefined, glassPrice: undefined,
    description: "", tastingNote: "", story: "", flavorTags: [],
    imageUrl: "",
  });
  const [loading, setLoading] = useState(false);
  const [storyGenerating, setStoryGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (drink) {
      setForm({
        name: drink.name, nameEn: drink.nameEn || "",
        type: drink.type, subtype: drink.subtype || "",
        region: drink.region || "", producer: drink.producer || "",
        vintage: drink.vintage || "",
        abv: drink.abv ? Number(drink.abv) : undefined,
        bottlePrice: drink.bottlePrice ? Number(drink.bottlePrice) : undefined,
        glassPrice: drink.glassPrice ? Number(drink.glassPrice) : undefined,
        description: drink.description || "", tastingNote: drink.tastingNote || "",
        story: drink.story || "", flavorTags: drink.flavorTags || [],
        imageUrl: drink.imageUrl || "",
      });
    } else {
      setForm({
        name: "", nameEn: "", type: "WINE", subtype: "",
        region: "", producer: "", vintage: "", abv: undefined,
        bottlePrice: undefined, glassPrice: undefined,
        description: "", tastingNote: "", story: "", flavorTags: [],
        imageUrl: "",
      });
    }
    setError("");
    setStoryGenerating(false);
  }, [drink, open]);

  async function handleSave() {
    if (!form.name) return;
    setLoading(true);
    setError("");
    try {
      if (isEdit && drink) {
        await updateDrink(drink.id, form);
      } else {
        await createDrink(form);
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
    if (!drink) return;
    if (!confirm(`确定删除「${drink.name}」？`)) return;
    setLoading(true);
    try {
      await deleteDrink(drink.id);
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || "Delete failed");
      setLoading(false);
    }
  }

  async function handleGenerateStory() {
    if (!drink?.id) return;
    setStoryGenerating(true);
    setError("");
    try {
      const updated = await generateStory(drink.id);
      setForm((prev) => ({ ...prev, story: updated.story || "" }));
      onSaved();
    } catch (e: any) {
      setError(e.message || "Story generation failed");
    } finally {
      setStoryGenerating(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { url } = await uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (e: any) {
      setError(e.message || "Upload failed");
    }
  }

  const subtypes = DRINK_SUBTYPES[form.type || "WINE"] || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: "'Noto Serif SC', serif" }}>
        {isEdit ? "编辑酒款" : "添加酒款"}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="名称 *" value={form.name || ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <TextField label="英文名" value={form.nameEn || ""} onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))} />
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {DRINK_TYPES.map((t) => (
              <Chip
                key={t.value} label={t.label}
                variant={form.type === t.value ? "filled" : "outlined"}
                onClick={() => setForm((p) => ({ ...p, type: t.value, subtype: "" }))}
                sx={form.type === t.value ? { bgcolor: "#C8A96E", color: "#FFF" } : {}}
              />
            ))}
          </Box>

          {subtypes.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {subtypes.map((st) => (
                <Chip
                  key={st} label={st} size="small"
                  variant={form.subtype === st ? "filled" : "outlined"}
                  onClick={() => setForm((p) => ({ ...p, subtype: st }))}
                  sx={form.subtype === st ? { bgcolor: "#2D1810", color: "#FFF" } : {}}
                />
              ))}
            </Box>
          )}

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField label="产区" value={form.region || ""} onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))} />
            <TextField label="酒庄/品牌" value={form.producer || ""} onChange={(e) => setForm((p) => ({ ...p, producer: e.target.value }))} />
            <TextField label="年份" value={form.vintage || ""} onChange={(e) => setForm((p) => ({ ...p, vintage: e.target.value }))} />
            <TextField label="酒精度(%)" type="number" value={form.abv ?? ""} onChange={(e) => setForm((p) => ({ ...p, abv: e.target.value ? Number(e.target.value) : undefined }))} />
            <TextField label="杯卖价(¥)" type="number" value={form.glassPrice ?? ""} onChange={(e) => setForm((p) => ({ ...p, glassPrice: e.target.value ? Number(e.target.value) : undefined }))} />
            <TextField label="整瓶价(¥)" type="number" value={form.bottlePrice ?? ""} onChange={(e) => setForm((p) => ({ ...p, bottlePrice: e.target.value ? Number(e.target.value) : undefined }))} />
          </Box>

          <TextField label="品鉴笔记" multiline rows={2} value={form.tastingNote || ""} onChange={(e) => setForm((p) => ({ ...p, tastingNote: e.target.value }))} />
          <TextField label="描述" multiline rows={2} value={form.description || ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />

          {/* Story */}
          {isEdit && (
            <Box sx={{ bgcolor: "#FDF8F0", p: 2, borderRadius: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontFamily: "'Noto Serif SC', serif" }}>
                  故事
                </Typography>
                <Button size="small" variant="outlined" disabled={storyGenerating} onClick={handleGenerateStory}>
                  {storyGenerating ? <CircularProgress size={16} /> : "AI 生成故事"}
                </Button>
              </Box>
              <TextField fullWidth multiline rows={3} value={form.story || ""} onChange={(e) => setForm((p) => ({ ...p, story: e.target.value }))} placeholder="酒款背后的故事..." />
            </Box>
          )}

          {/* Image URL */}
          <Box>
            <TextField label="图片 URL" value={form.imageUrl || ""} onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))} />
            <Button component="label" size="small" sx={{ mt: 1 }}>
              上传图片
              <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
            </Button>
            {form.imageUrl && (
              <Box sx={{ mt: 1 }}>
                <img src={form.imageUrl} alt="preview" style={{ maxWidth: 200, borderRadius: 8 }} />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Box>
          {isEdit && (
            <Button color="error" onClick={handleDelete} disabled={loading}>
              删除
            </Button>
          )}
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
