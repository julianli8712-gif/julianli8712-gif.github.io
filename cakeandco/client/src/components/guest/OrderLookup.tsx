import { useState } from "react";
import { Box, Typography, TextField, Button, Card, CardContent, Chip, IconButton } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import { fetchReservationsByPhone } from "../../services/api";
import type { Reservation } from "../../types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待确认", CONFIRMED: "已确认", MAKING: "制作中", READY: "待取货", COMPLETED: "已完成", CANCELLED: "已取消",
};
const STATUS_LABELS_EN: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", MAKING: "Making", READY: "Ready", COMPLETED: "Done", CANCELLED: "Cancelled",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#F5A623", CONFIRMED: "#5A7D8C", MAKING: "#5B8C5A", READY: "#7B1FA2", COMPLETED: "#8B9D83", CANCELLED: "#9E9E9E",
};

export default function OrderLookup({ onBack, onOrderClick }: { onBack: () => void; onOrderClick: (r: Reservation) => void }) {
  const { t, i18n } = useTranslation();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Reservation[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const isEn = i18n.language === "en";
  const labels = isEn ? STATUS_LABELS_EN : STATUS_LABELS;

  const handleSearch = async () => {
    if (!/^\d{11}$/.test(phone)) { setError(t("order.phonePlaceholder")); return; }
    setError("");
    try { setOrders(await fetchReservationsByPhone(phone)); } catch { setOrders([]); }
    setSearched(true);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={onBack} size="small"><ArrowBack /></IconButton>
        <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "primary.main", ml: 1 }}>
          {t("order.title")}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
        <TextField
          placeholder={t("order.phonePlaceholder")}
          value={phone}
          onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 11)); setError(""); }}
          fullWidth inputProps={{ maxLength: 11, inputMode: "numeric" }}
          error={!!error} helperText={error}
        />
        <Button variant="contained" onClick={handleSearch} sx={{ minWidth: 72, px: 2, py: 1.5, flexShrink: 0 }} startIcon={<SearchIcon />}>
          {t("order.search")}
        </Button>
      </Box>

      {searched && orders.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          {t("order.empty")}
        </Typography>
      )}

      {orders.map((r) => (
        <Card key={r.id} sx={{ mb: 1.5, cursor: "pointer" }} onClick={() => onOrderClick(r)}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Box>
                <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, color: "primary.main" }}>{r.cakeName}</Typography>
                {r.size && <Typography variant="body2" sx={{ fontSize: 12 }}>{r.size}</Typography>}
              </Box>
              <Chip label={labels[r.status] || r.status} size="small" sx={{ bgcolor: STATUS_COLORS[r.status] || "#9E9E9E", color: "#FFF", fontSize: 11 }} />
            </Box>
            <Typography variant="body2" sx={{ fontSize: 12 }}>
              {t("order.pickup")}：{new Date(r.pickupTime).toLocaleString(isEn ? "en-US" : "zh-CN")}
            </Typography>
            {r.message && <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}>💬 {r.message}</Typography>}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
