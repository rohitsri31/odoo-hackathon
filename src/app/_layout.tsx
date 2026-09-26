import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
    ActivityIndicator,
    StyleSheet,
    View,
    useColorScheme,
} from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { AuthScreen } from "@/components/auth-screen";
import { AuthProvider, useAuth } from "@/context/auth";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { loading, token } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  if (loading) {
    return (
      <View style={[styles.appShell, isDark && styles.appShellDark]}>
        <View
          style={[styles.backgroundWash, isDark && styles.backgroundWashDark]}
        />
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={isDark ? "#a7d6ff" : "#23764f"} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.appShell, isDark && styles.appShellDark]}>
      <View
        style={[styles.backgroundWash, isDark && styles.backgroundWashDark]}
      />
      {token ? (
        <View style={styles.appFrame}>
          <AnimatedSplashOverlay />
          <AppTabs />
        </View>
      ) : (
        <AuthScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: "#edf4fb",
  },
  appShellDark: {
    backgroundColor: "#071722",
  },
  backgroundWash: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#eaf2fc",
    opacity: 0.8,
  },
  backgroundWashDark: {
    backgroundColor: "#081924",
    opacity: 1,
  },
  appFrame: {
    flex: 1,
    padding: 14,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
