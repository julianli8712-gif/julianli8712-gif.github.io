import { Box } from "@mui/material";
import { keyframes } from "@mui/system";

export const foilShimmer = keyframes`
  0% { opacity: 0.7; }
  50% { opacity: 1; filter: brightness(1.2); }
  100% { opacity: 0.7; }
`;

export function BrandDot({ size = 8 }: { size?: number }) {
  return <Box component="span" sx={{ display: "inline-block", width: size, height: size, borderRadius: "50%", bgcolor: "secondary.main", flexShrink: 0 }} />;
}

export function FoilDot({ size = 8 }: { size?: number }) {
  return (
    <Box sx={{
      width: size, height: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #E8D080 0%, #C8A45C 30%, #B8922E 60%, #C8A45C 100%)",
      boxShadow: "0 1px 3px rgba(200,164,92,0.5), inset 0 1px 1px rgba(255,255,255,0.5)",
      animation: `${foilShimmer} 3s ease-in-out infinite`,
      flexShrink: 0,
    }} />
  );
}

export function Dot({ size = 6, opacity = 1 }: { size?: number; opacity?: number }) {
  return <Box component="span" sx={{ display: "inline-block", width: size, height: size, borderRadius: "50%", bgcolor: "secondary.main", opacity, flexShrink: 0 }} />;
}

export function CircleOutline({ size = 8, mr = 1 }: { size?: number; mr?: number }) {
  return <Box component="span" sx={{ display: "inline-block", width: size, height: size, borderRadius: "50%", border: "2px solid", borderColor: "secondary.main", flexShrink: 0, mr }} />;
}

export function GoldDivider() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, my: 3 }}>
      <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(200,164,92,0.2)" }} />
      <Dot size={6} />
      <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(200,164,92,0.2)" }} />
    </Box>
  );
}

export function CornerDot() {
  return <Box sx={{ position: "absolute", bottom: 6, right: 6, width: 6, height: 6, borderRadius: "50%", bgcolor: "secondary.main", opacity: 0.5 }} />;
}
