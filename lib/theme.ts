export type ThemeMode = "light" | "dark";

type ThemeColors = {
  bg: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  border: string;
  borderLight: string;
  accent: string;
  accentSoft: string;
  accentMedium: string;
  success: string;
  successSoft: string;
  successBorder: string;
  danger: string;
  dangerSoft: string;
  dangerBorder: string;
  warning: string;
  warningSoft: string;
  accentInk: string;
};

type ThemeShared = {
  fonts: {
    display: string;
    body: string;
  };
  radius: { sm: string; md: string; lg: string; pill: string };
  shadow: {
    sm: string;
    md: string;
    lg: string;
  };
};

export type ResolvedTheme = ThemeShared & {
  colors: ThemeColors;
};

const SHARED_THEME: ThemeShared = {
  fonts: {
    display: "var(--font-display)",
    body: "var(--font-ui)",
  },
  radius: { sm: "12px", md: "18px", lg: "24px", pill: "9999px" },
  shadow: {
    sm: "0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.04)",
    md: "0 30px 80px -30px rgba(0,0,0,0.6), 0 10px 30px -10px rgba(0,0,0,0.4)",
    lg: "0 0 60px -10px rgba(124,92,255,0.45)",
  },
};

export const THEMES: Record<ThemeMode, ResolvedTheme> = {
  light: {
    ...SHARED_THEME,
    colors: {
      bg: "#FBF7EF",
      surface: "rgba(255,255,255,0.72)",
      surfaceHover: "rgba(255,255,255,0.88)",
      surfaceActive: "rgba(20,16,10,0.08)",
      ink: "#15110A",
      inkMuted: "#2F281E",
      inkFaint: "#554C3F",
      border: "rgba(20,16,10,0.14)",
      borderLight: "rgba(20,16,10,0.12)",
      accent: "#5F43DD",
      accentSoft: "rgba(95, 67, 221, 0.12)",
      accentMedium: "rgba(95, 67, 221, 0.22)",
      success: "#0E8278",
      successSoft: "rgba(25, 227, 203, 0.1)",
      successBorder: "rgba(25, 227, 203, 0.25)",
      danger: "#B73355",
      dangerSoft: "rgba(255, 111, 145, 0.1)",
      dangerBorder: "rgba(255, 111, 145, 0.25)",
      warning: "#78510E",
      warningSoft: "rgba(120, 81, 14, 0.12)",
      accentInk: "#0A0A14",
    },
  },
  dark: {
    ...SHARED_THEME,
    colors: {
      bg: "#06060C",
      surface: "rgba(18, 18, 30, 0.86)",
      surfaceHover: "rgba(255, 255, 255, 0.08)",
      surfaceActive: "rgba(255, 255, 255, 0.1)",
      ink: "#F6F4EE",
      inkMuted: "#CFC9BC",
      inkFaint: "#8B8675",
      border: "rgba(255, 255, 255, 0.11)",
      borderLight: "rgba(255, 255, 255, 0.08)",
      accent: "#7C5CFF",
      accentSoft: "rgba(124, 92, 255, 0.12)",
      accentMedium: "rgba(124, 92, 255, 0.28)",
      success: "#19E3CB",
      successSoft: "rgba(25, 227, 203, 0.1)",
      successBorder: "rgba(25, 227, 203, 0.25)",
      danger: "#FF6F91",
      dangerSoft: "rgba(255, 111, 145, 0.1)",
      dangerBorder: "rgba(255, 111, 145, 0.25)",
      warning: "#FFD86B",
      warningSoft: "rgba(255, 216, 107, 0.1)",
      accentInk: "#0A0A14",
    },
  },
};

function getActiveThemeMode(): ThemeMode {
  if (typeof document !== "undefined") {
    const mode = document.documentElement.getAttribute("data-theme");
    if (mode === "light" || mode === "dark") {
      return mode;
    }
  }
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("kl-theme");
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  }
  return "dark";
}

// Backward-compatible export for lesson subcomponents that still read THEME.
export const THEME = new Proxy({} as ResolvedTheme, {
  get(_target, prop) {
    return THEMES[getActiveThemeMode()][prop as keyof ResolvedTheme];
  },
});
