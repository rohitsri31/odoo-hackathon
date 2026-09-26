import { NativeTabs } from "expo-router/unstable-native-tabs";
import { StyleSheet, View, useColorScheme } from "react-native";

export default function AppTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <View style={[styles.wrapper, isDark && styles.wrapperDark]}>
      <NativeTabs
        backgroundColor={
          isDark ? "rgba(12,22,31,0.72)" : "rgba(255,255,255,0.34)"
        }
        indicatorColor={
          isDark ? "rgba(121,150,255,0.25)" : "rgba(91,183,255,0.22)"
        }
        labelStyle={{
          selected: {
            color: isDark ? "#edf7ff" : "#10212b",
          },
          default: {
            color: isDark ? "#b5c7d8" : "#586c7d",
          },
        }}
        shadowColor={isDark ? "#031019" : "#0d1d2c"}
        blurEffect="systemThinMaterial"
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="products">
          <NativeTabs.Trigger.Label>Products</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="operations">
          <NativeTabs.Trigger.Label>Operations</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="intelligence">
          <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",
    shadowColor: "#0b1320",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  wrapperDark: {
    borderColor: "rgba(255,255,255,0.12)",
  },
});
