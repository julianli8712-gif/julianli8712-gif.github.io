import { createTheme } from "@mui/material/styles";

// Brand palette — editorial paper aesthetic
const cocoa = "#3C2415";
const gold = "#C8A45C";
const goldLight = "rgba(200,164,92,0.15)";
const cream = "#FFF9F0";
const paper = "#FFFDF9";
const textPrimary = "#2D2D2D";
const textSecondary = "#6B5E53";
const successMuted = "#8B9D83";
const warningMuted = "#C4956B";

export const theme = createTheme({
  palette: {
    primary: { main: cocoa, contrastText: "#FFF" },
    secondary: { main: gold, contrastText: "#FFF" },
    background: { default: cream, paper },
    text: { primary: textPrimary, secondary: textSecondary },
    success: { main: successMuted },
    warning: { main: warningMuted },
  },
  typography: {
    fontFamily: `Georgia, "Noto Serif SC", "STSong", "Songti SC", serif`,
    h4: { fontWeight: 400, color: cocoa, letterSpacing: "0.02em" },
    h5: { fontWeight: 400, color: cocoa, letterSpacing: "0.02em" },
    h6: { fontWeight: 400, color: cocoa, letterSpacing: "0.02em" },
    subtitle1: { fontWeight: 400, color: cocoa },
    body1: { fontFamily: `-apple-system, "PingFang SC", sans-serif`, color: textPrimary },
    body2: { fontFamily: `-apple-system, "PingFang SC", sans-serif`, color: textSecondary },
    caption: { fontFamily: `-apple-system, "PingFang SC", sans-serif`, color: textSecondary },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: "none", borderBottom: `1px solid ${goldLight}` },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 400, borderRadius: 6, letterSpacing: "0.03em" },
        containedPrimary: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
        outlined: { borderColor: goldLight, color: cocoa, "&:hover": { borderColor: gold, backgroundColor: goldLight } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 12px rgba(60,36,21,0.05)",
          borderRadius: 8,
          border: `1px solid ${goldLight}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 400, borderRadius: 6 },
        outlined: { borderColor: goldLight, color: cocoa },
        filled: { backgroundColor: gold, color: "#FFF" },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: gold },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: gold },
          },
          "& .MuiInputLabel-root.Mui-focused": { color: cocoa },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: goldLight,
          "&.Mui-checked": { color: gold },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: goldLight },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: { color: gold },
      },
    },
  },
});

export const colors = { cocoa, gold, goldLight, cream, paper, textPrimary, textSecondary, successMuted, warningMuted };
