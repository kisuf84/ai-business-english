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
    display: "'Instrument Serif', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
  },
  radius: { sm: "6px", md: "10px", lg: "14px", pill: "9999px" },
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
    md: "0 4px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
    lg: "0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
  },
};

export const THEMES: Record<ThemeMode, ResolvedTheme> = {
  light: {
    ...SHARED_THEME,
    colors: {
      bg: "#F5EFE4",
      surface: "#FFFAF2",
      surfaceHover: "#F4EBDC",
      surfaceActive: "#EADFCE",
      ink: "#132743",
      inkMuted: "#4D5F77",
      inkFaint: "#73829A",
      border: "rgba(19, 39, 67, 0.13)",
      borderLight: "rgba(19, 39, 67, 0.08)",
      accent: "#0B1F3B",
      accentSoft: "rgba(168, 119, 23, 0.12)",
      accentMedium: "rgba(11, 31, 59, 0.16)",
      success: "#8B6A24",
      successSoft: "rgba(139, 106, 36, 0.11)",
      successBorder: "rgba(139, 106, 36, 0.18)",
      danger: "#B55E48",
      dangerSoft: "rgba(181, 94, 72, 0.12)",
      dangerBorder: "rgba(181, 94, 72, 0.2)",
      warning: "#A87717",
      warningSoft: "rgba(168, 119, 23, 0.12)",
      accentInk: "#FFF9EE",
    },
  },
  dark: {
    ...SHARED_THEME,
    colors: {
      bg: "#0B1F3B",
      surface: "#112A4C",
      surfaceHover: "#152F54",
      surfaceActive: "#152F54",
      ink: "#F4F6F8",
      inkMuted: "#C7D1DC",
      inkFaint: "#C7D1DC",
      border: "rgba(232, 193, 91, 0.28)",
      borderLight: "rgba(232, 193, 91, 0.20)",
      accent: "#E8C15B",
      accentSoft: "rgba(232, 193, 91, 0.14)",
      accentMedium: "rgba(232, 193, 91, 0.28)",
      success: "#D4A645",
      successSoft: "rgba(212, 166, 69, 0.16)",
      successBorder: "rgba(212, 166, 69, 0.38)",
      danger: "#E3725F",
      dangerSoft: "rgba(227, 114, 95, 0.14)",
      dangerBorder: "rgba(227, 114, 95, 0.34)",
      warning: "#E8C15B",
      warningSoft: "rgba(232, 193, 91, 0.16)",
      accentInk: "#0B1F3B",
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
