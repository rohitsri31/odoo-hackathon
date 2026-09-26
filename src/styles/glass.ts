import { StyleSheet } from "react-native";

export const glassTheme = {
  light: {
    shell: "#edf4fb",
    wash: "#eaf2fc",
    panel: "rgba(255,255,255,0.72)",
    panelStrong: "rgba(255,255,255,0.88)",
    surface: "rgba(255,255,255,0.60)",
    border: "rgba(0,0,0,0.08)",
    text: "#122331",
    // Improved from #627a90 to #374d61 for > 5:1 contrast against light wash (WCAG AA compliant)
    textSoft: "#374d61",
    accent: "#0066cc",
    accentMint: "#1b7852",
    accentWarm: "#9a4e00",
    accentRose: "#b81d3d",
    shadow: "#203246",
    // Fallback solid backgrounds for reduced transparency
    solidPanel: "#ffffff",
    solidSurface: "#f1f5f9",
  },
  dark: {
    shell: "#071722",
    wash: "#091b29",
    panel: "rgba(16,26,36,0.76)",
    panelStrong: "rgba(17,29,40,0.90)",
    surface: "rgba(21,31,41,0.78)",
    border: "rgba(255,255,255,0.12)",
    text: "#edf7ff",
    textSoft: "#bcd6ea",
    accent: "#84b8ff",
    accentMint: "#7ee2c4",
    accentWarm: "#ffbe7d",
    accentRose: "#ff9ead",
    shadow: "#040b12",
    // Fallback solid backgrounds for reduced transparency
    solidPanel: "#101e2a",
    solidSurface: "#142533",
  },
};

export const glassStyles = StyleSheet.create({
  shell: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    backdropFilter: "blur(22px) saturate(180%)",
  },
  button: {
    borderRadius: 18,
    borderWidth: 1,
    backdropFilter: "blur(18px) saturate(170%)",
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
