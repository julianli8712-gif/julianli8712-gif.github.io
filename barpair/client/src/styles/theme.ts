import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#C8A96E" },          // gold amber
    secondary: { main: "#7B3F1E" },        // warm walnut
    background: { default: "#FDF8F0", paper: "#FFFFFF" },
    text: { primary: "#2D1810", secondary: "#6B5545" },
    divider: "#E8DFD3",
  },
  typography: {
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', serif",
    h4: { fontWeight: 600, letterSpacing: "0.02em" },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, fontSize: "1.1rem" },
    body1: { fontFamily: "'Noto Serif SC', serif", fontSize: "0.95rem", lineHeight: 1.8 },
    body2: { fontFamily: "'Noto Serif SC', serif", fontSize: "0.85rem", lineHeight: 1.7, color: "#6B5545" },
    button: { textTransform: "none", fontWeight: 600, fontFamily: "'Noto Serif SC', serif" },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { padding: "10px 24px", borderRadius: 6 },
        containedPrimary: {
          background: "linear-gradient(135deg, #C8A96E 0%, #A67C3D 100%)",
          color: "#FFFFFF",
          "&:hover": { background: "linear-gradient(135deg, #B8945A 0%, #8E682D 100%)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: "1px solid #E8DFD3", boxShadow: "none" },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small", fullWidth: true },
      styleOverrides: {
        root: { "& .MuiOutlinedInput-root": { borderRadius: 6 } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: "'Noto Serif SC', serif" },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12 },
      },
    },
  },
});
