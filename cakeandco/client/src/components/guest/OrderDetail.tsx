import { useState } from "react";
import { Box, Typography, Card, CardContent, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { cancelReservation } from "../../services/api";
import type { Reservation } from "../../types";

const STATUSES = [
  { key: "PENDING", label: "待确认", labelEn: "Pending", desc: "酒店将电话与您确认订单", descEn: "The hotel will call to confirm" },
  { key: "CONFIRMED", label: "已确认", labelEn: "Confirmed", desc: "订单已确认，糕点师准备制作", descEn: "Confirmed, our pastry chef will begin" },
  { key: "MAKING", label: "制作中", labelEn: "Making", desc: "糕点师正在为您精心制作", descEn: "Being handcrafted by our pastry chef" },
  { key: "READY", label: "待取货", labelEn: "Ready", desc: "蛋糕已制作完成，等待取货", descEn: "Your cake is ready for pickup" },
  { key: "COMPLETED", label: "已完成", labelEn: "Completed", desc: "感谢您的惠顾", descEn: "Thank you for your order" },
  { key: "CANCELLED", label: "已取消", labelEn: "Cancelled", desc: "该订单已取消", descEn: "This order has been cancelled" },
];

const ACTIVE_COLOR = "#C8A45C";
const INACTIVE_COLOR = "rgba(200,164,92,0.2)";

export default function OrderDetail({ reservation, onBack, onStatusChange }: { reservation: Reservation; onBack: () => void; onStatusChange?: () => void }) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === "en";
  const currentIdx = STATUSES.findIndex((s) => s.key === reservation.status);
  const isCancelled = reservation.status === "CANCELLED";
  const canCancel = reservation.status === "PENDING";
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      await cancelReservation(reservation.id);
      onStatusChange?.();
      setCancelOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "";
      setCancelError(msg || (isEn ? "Unable to cancel. The order may already be confirmed." : "无法取消，订单可能已被确认。"));
    }
    setCancelling(false);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={onBack} size="small"><ArrowBack /></IconButton>
        <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "primary.main", ml: 1 }}>
          {t("order.detail")}
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 16, color: "primary.main", mb: 1 }}>
            {reservation.cakeName}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", fontSize: 13, color: "text.secondary", mb: 0.5 }}>
            {reservation.size && <span>{reservation.size}</span>}
            <span>×{reservation.quantity}</span>
            {reservation.totalPrice && <span>¥{reservation.totalPrice}</span>}
          </Box>
          <Typography variant="body2" sx={{ fontSize: 13 }}>
            {t("order.pickup")}：{new Date(reservation.pickupTime).toLocaleString(isEn ? "en-US" : "zh-CN")}
          </Typography>
          {reservation.message && (
            <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary", mt: 1, fontStyle: "italic" }}>
              💬 {reservation.message}
            </Typography>
          )}
        </CardContent>
      </Card>

      {canCancel && (
        <Box sx={{ mb: 3 }}>
          <Button variant="outlined" color="error" size="small" onClick={() => setCancelOpen(true)}>
            {isEn ? "Cancel Order" : "取消订单"}
          </Button>
        </Box>
      )}

      <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 15, color: "primary.main", mb: 2 }}>
        {t("order.status")}
      </Typography>

      <Box sx={{ pl: 2 }}>
        {STATUSES.map((s, i) => {
          const isActive = i <= currentIdx && !isCancelled;
          const isReached = isCancelled ? s.key === "CANCELLED" : isActive;
          return (
            <Box key={s.key} sx={{ display: "flex", gap: 1.5, mb: 0, position: "relative", pb: i < STATUSES.length - 1 ? 3 : 0 }}>
              {i < STATUSES.length - 1 && (
                <Box sx={{ position: "absolute", left: 11, top: 24, bottom: 0, width: 2, bgcolor: isReached && i < currentIdx ? ACTIVE_COLOR : INACTIVE_COLOR }} />
              )}
              <Box sx={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                bgcolor: isReached ? ACTIVE_COLOR : INACTIVE_COLOR,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFF", fontSize: 12, fontWeight: 700, mt: 0.2,
              }}>{isReached ? "✓" : i + 1}</Box>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: isReached ? 600 : 400, color: isReached ? "primary.main" : "text.secondary" }}>
                  {isEn ? s.labelEn : s.label}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12 }}>
                  {isEn ? s.descEn : s.desc}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)}>
        <DialogTitle>{isEn ? "Cancel Order" : "取消订单"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: cancelError ? 1.5 : 0 }}>
            {isEn ? "Are you sure you want to cancel this order?" : "确定要取消该订单吗？取消后无法恢复。"}
          </Typography>
          {cancelError && (
            <Typography variant="body2" color="error" sx={{ fontSize: 13 }}>
              {cancelError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>{isEn ? "Keep" : "保留"}</Button>
          <Button onClick={handleCancel} color="error" disabled={cancelling}>
            {cancelling ? (isEn ? "Cancelling..." : "取消中...") : (isEn ? "Cancel" : "确认取消")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
