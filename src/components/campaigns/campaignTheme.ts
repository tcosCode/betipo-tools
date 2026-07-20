import { createTheme } from "@mui/material/styles";

import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";

const pxToRem = (value: number) => `${value / 16}rem`;
const responsiveFontSizes = ({
  sm,
  md,
  lg,
}: {
  sm: number;
  md: number;
  lg: number;
}) => ({
  "@media (min-width:600px)": { fontSize: pxToRem(sm) },
  "@media (min-width:900px)": { fontSize: pxToRem(md) },
  "@media (min-width:1200px)": { fontSize: pxToRem(lg) },
});

declare module "@mui/material/styles" {
  interface TypographyVariants {
    betipoMedium28: React.CSSProperties;
    betipoMedium18: React.CSSProperties;
    betipoMedium16: React.CSSProperties;
    betipoRegular18: React.CSSProperties;
    betipoRegular14: React.CSSProperties;
    betipoRegular12: React.CSSProperties;
    betipoRegular10: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    betipoMedium28?: React.CSSProperties;
    betipoMedium18?: React.CSSProperties;
    betipoMedium16?: React.CSSProperties;
    betipoRegular18?: React.CSSProperties;
    betipoRegular14?: React.CSSProperties;
    betipoRegular12?: React.CSSProperties;
    betipoRegular10?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    betipoMedium28: true;
    betipoMedium18: true;
    betipoMedium16: true;
    betipoRegular18: true;
    betipoRegular14: true;
    betipoRegular12: true;
    betipoRegular10: true;
  }
}

export const toolTheme = createTheme({
  typography: {
    fontFamily:
      "Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    button: { textTransform: "none" },
  },
  palette: {
    primary: { main: "#2563eb" },
    background: { default: "#f8fafc", paper: "#ffffff" },
  },
  shape: { borderRadius: 12 },
});

export const campaignPreviewTheme = createTheme({
  palette: {
    background: { default: "#111416", paper: "#646769" },
    text: { primary: "#ffffff" },
    grey: {
      50: "#e9e9e9",
      100: "#bababc",
      200: "#98989b",
      300: "#6a6a6e",
      400: "#4d4d51",
      500: "#202026",
      600: "#1d1d23",
      700: "#17171b",
      800: "#121215",
      900: "#0d0d10",
    },
  },
  typography: {
    fontFamily: [
      "Poppins",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    button: { textTransform: "unset" },
    betipoMedium28: {
      fontSize: pxToRem(28),
      fontWeight: 600,
      lineHeight: "42px",
      letterSpacing: "0.5px",
      ...responsiveFontSizes({ sm: 24, md: 26, lg: 28 }),
    },
    betipoMedium18: {
      fontSize: pxToRem(18),
      fontWeight: 500,
      lineHeight: "normal",
      letterSpacing: "0.5px",
      ...responsiveFontSizes({ sm: 16, md: 17.5, lg: 18 }),
    },
    betipoMedium16: {
      fontSize: pxToRem(16),
      fontWeight: 500,
      lineHeight: "normal",
      letterSpacing: "0.5px",
      ...responsiveFontSizes({ sm: 15, md: 15.5, lg: 16 }),
    },
    betipoRegular18: {
      fontSize: pxToRem(18),
      fontWeight: 400,
      lineHeight: "normal",
      letterSpacing: "0.5px",
      ...responsiveFontSizes({ sm: 16, md: 17, lg: 18 }),
    },
    betipoRegular14: {
      fontSize: pxToRem(14),
      fontWeight: 400,
      lineHeight: "21px",
      letterSpacing: "0.5px",
      ...responsiveFontSizes({ sm: 12, md: 13, lg: 14 }),
    },
    betipoRegular12: {
      fontSize: pxToRem(12),
      fontWeight: 400,
      lineHeight: "18px",
      letterSpacing: "0.5px",
      ...responsiveFontSizes({ sm: 10, md: 11, lg: 12 }),
    },
    betipoRegular10: {
      fontSize: pxToRem(10),
      fontWeight: 400,
      lineHeight: "15px",
      letterSpacing: "0.5px",
      ...responsiveFontSizes({ sm: 8, md: 9, lg: 10 }),
    },
  },
  components: {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundColor: "#181c1f",
          maxHeight: "100dvh",
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: { fontFamily: "Poppins, sans-serif" },
      },
    },
    MuiButton: {
      defaultProps: { color: "inherit", disableElevation: true },
      styleOverrides: {
        root: {
          display: "flex",
          height: 40,
          padding: "10px 24px",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          borderRadius: 50,
          fontSize: "1rem",
          fontWeight: 500,
        },
      },
      variants: [
        {
          props: { variant: "contained" },
          style: {
            color: "#0D0D10",
            fontWeight: 500,
            letterSpacing: "0.5px",
            background: "#54C1FB",
            "&:hover": {
              color: "#FFF",
              background: "#007BFF",
              boxShadow: "4px 4px 4px 0 rgba(0, 0, 0, 0.16)",
            },
            "&.Mui-disabled": { color: "#0D0D10", background: "#98989B" },
          },
        },
        {
          props: { variant: "outlined" },
          style: {
            color: "#BABABC",
            border: "1px solid #BABABC",
            fontWeight: 500,
            letterSpacing: "0.5px",
            "&:hover": { color: "#E9E9E9", border: "1px solid #E9E9E9" },
            "&.Mui-disabled": { color: "#4D4D51", border: "1px solid #4D4D51" },
          },
        },
      ],
    },
  },
});
