import { useState } from "react";
import { Box, Typography, TextField, Button, Card, CardMedia, CardContent, Chip, IconButton } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTranslation } from "react-i18next";
import { useCakeLocale } from "../../services/locale";
import { createReservation } from "../../services/api";
import type { Cake, Reservation } from "../../types";

export default function ReserveForm({ cake, size, price, aiImage, aiPrompt, onBack, onDone, onViewOrder }: {
  cake: Cake; size?: string; price?: string; aiImage?: string; aiPrompt?: string; onBack: () => void; onDone: () => void; onViewOrder: (r: Reservation) => void;
}) {
  const { t } = useTranslation();
  const { name } = useCakeLocale();
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [message, setMessage] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<Reservation | null>(null);
  const [error, setError] = useState("");

  const validatePhone = (v: string) => /^\d{11}$/.test(v);

  const handleSubmit = async () => {
    if (!guestName) { setError("请填写姓名"); return; }
    if (!validatePhone(guestPhone)) { setError("请输入正确的11位手机号码"); return; }
    if (!pickupTime) { setError("请选择取货时间"); return; }
    setSubmitting(true);
    try {
      const status = aiImage ? "PENDING_AI" : undefined;
      const res = await createReservation({
        cakeId: cake.id || undefined,
        cakeName: `${name(cake)}${size ? ` (${size})` : ""}`,
        size,
        totalPrice: price ? parseFloat(price) : undefined,
        guestName,
        guestPhone,
        pickupTime: new Date(pickupTime).toISOString(),
        message: message || undefined,
        pickupMethod: "PICKUP",
        isAiCustom: !!aiImage,
        aiPrompt: aiPrompt || undefined,
        aiImageUrl: aiImage || undefined,
        ...(status ? { status } as any : {}),
      });
      setSuccess(res);
    } catch (err: any) { setError(err?.response?.data?.message || t("reserve.errorSubmit")); }
    setSubmitting(false);
  };

  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(14, 0, 0, 0);
  const quickTimes = [new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16), tomorrow.toISOString().slice(0, 16)];

  // Success page
  if (success) {
    const statusLabels: Record<string, string> = { PENDING: "待确认", PENDING_AI: "AI 定制待审核", CONFIRMED: "已确认", MAKING: "制作中", READY: "待取货", COMPLETED: "已完成" };
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <CheckCircleIcon sx={{ fontSize: 56, color: "secondary.main", mb: 2 }} />
        <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "primary.main", mb: 1 }}>
          {t("reserve.success")}
        </Typography>
        <Card sx={{ textAlign: "left", my: 3 }}>
          <CardContent>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>{success.cakeName}</Typography>
            <Typography variant="body2">{success.size}</Typography>
            <Typography variant="body2">取货：{new Date(success.pickupTime).toLocaleString("zh-CN")}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>状态：🟡 {statusLabels[success.status] || success.status}</Typography>
          </CardContent>
        </Card>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t("order.queryHint")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Button variant="outlined" onClick={() => onViewOrder(success)}>{t("order.viewMyOrders")}</Button>
          <Button variant="contained" onClick={onDone} sx={{ bgcolor: "primary.main" }}>{t("order.backHome")}</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton onClick={onBack} size="small"><ArrowBack /></IconButton>
        <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 20, color: "primary.main", ml: 1 }}>{t("reserve.title")}</Typography>
      </Box>

      {/* AI Design Preview */}
      {aiImage && (
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Card
            sx={{
              overflow: "hidden", mb: 1,
              border: "1px solid rgba(200,164,92,0.25)",
              boxShadow: "0 0 0 2px rgba(200,164,92,0.1)",
            }}
          >
            <CardMedia component="img" image={aiImage} alt="AI Design" sx={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
          </Card>
          <Chip label="🤖 AI 定制" size="small" sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 11, bgcolor: "rgba(180,130,220,0.1)", color: "#B482DC", border: "1px solid rgba(180,130,220,0.3)" }} />
          {aiPrompt && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: "italic", fontSize: 12, lineHeight: 1.5 }}>
              "{aiPrompt.length > 80 ? aiPrompt.slice(0, 80) + '...' : aiPrompt}"
            </Typography>
          )}
        </Box>
      )}

      <Card sx={{ mb: 3, overflow: "hidden", display: "flex" }}>
        <CardMedia component="img" image={cake.imageUrls?.[0] || "/placeholder-cake.svg"} alt={name(cake)} sx={{ width: 100, height: 100, objectFit: "cover", borderRadius: "4px 0 0 4px" }} />
        <CardContent sx={{ flex: 1, "&:last-child": { pb: 1 } }}>
          <Typography sx={{ fontFamily: "'Noto Serif SC', serif", fontSize: 14, color: "primary.main" }}>{name(cake)}</Typography>
          {size && <Typography variant="body2" sx={{ fontSize: 12 }}>{size}</Typography>}
          {price && <Typography sx={{ fontFamily: "Georgia, serif", fontSize: 14, color: "secondary.main" }}>¥{price}</Typography>}
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField label={t("reserve.name")} value={guestName} onChange={(e) => setGuestName(e.target.value)} required fullWidth />
        <TextField
          label={t("reserve.phone")} value={guestPhone}
          onChange={(e) => { setGuestPhone(e.target.value.replace(/\D/g, "").slice(0, 11)); setError(""); }}
          required fullWidth inputProps={{ maxLength: 11, inputMode: "numeric" }}
          error={!!error && error.includes("手机")} helperText={error && error.includes("手机") ? error : ""}
        />
        <TextField label={t("reserve.pickupTime")} type="datetime-local" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} required fullWidth InputLabelProps={{ shrink: true }} />
        <Box sx={{ display: "flex", gap: 1 }}>
          {quickTimes.map((qt) => (
            <Button key={qt} size="small" variant="outlined" onClick={() => setPickupTime(qt)}>{new Date(qt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</Button>
          ))}
        </Box>
        <TextField label={t("reserve.message")} value={message} onChange={(e) => setMessage(e.target.value)} multiline rows={2} fullWidth placeholder={t("reserve.messagePlaceholder")} />
        {error && !error.includes("手机") && (
          <Typography variant="body2" color="error">{error}</Typography>
        )}
        <Button variant="contained" size="large" fullWidth onClick={handleSubmit} disabled={submitting} sx={{ py: 1.5, fontSize: 15 }}>
          {submitting ? t("reserve.submitting") : t("reserve.submit")}
        </Button>
      </Box>
    </Box>
  );
}
