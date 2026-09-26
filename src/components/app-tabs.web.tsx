import { useAuth } from '@/context/auth';
import { glassTheme } from '@/styles/glass';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import {
  Pressable,
  useColorScheme,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const isMobile = width < 640;

  return (
    <Tabs style={styles.tabContainer}>
      {!isMobile && (
        <TabList asChild>
          <CustomTabList />
        </TabList>
      )}
      <View style={styles.slotWrap}>
        <TabSlot style={styles.slot} />
      </View>
      {isMobile && (
        <TabList asChild>
          <CustomTabList />
        </TabList>
      )}
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={({ pressed }) => [
        styles.tabButton,
        {
          backgroundColor: isFocused
            ? isDark
              ? 'rgba(91,183,255,0.22)'
              : 'rgba(35,118,79,0.12)'
            : 'transparent',
          borderColor: isFocused
            ? isDark
              ? 'rgba(132,184,255,0.45)'
              : 'rgba(35,118,79,0.30)'
            : 'transparent',
        },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.tabButtonText,
          {
            color: isFocused
              ? isDark
                ? '#edf7ff'
                : '#10212b'
              : isDark
                ? '#a5c0d6'
                : '#485f73',
            fontWeight: isFocused ? '700' : '500',
          },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const palette = isDark ? glassTheme.dark : glassTheme.light;
  const { width } = useWindowDimensions();
  const isMobile = width < 640;
  const { user, signOut } = useAuth();

  return (
    <View
      {...props}
      accessibilityRole="tablist"
      style={[
        isMobile ? styles.mobileNavWrapper : styles.desktopNavWrapper,
        {
          backgroundColor: isDark
            ? 'rgba(12,22,31,0.85)'
            : 'rgba(255,255,255,0.88)',
          borderColor: palette.border,
        },
      ]}
    >
      {!isMobile && (
        <View style={styles.brandRow} accessibilityRole="none">
          <View style={styles.logoMark} accessibilityRole="none">
            <Text style={styles.logoText}>SS</Text>
          </View>
          <View>
            <Text
              style={[styles.brandTitle, { color: palette.text }]}
              accessibilityRole="header"
            >
              StockSense
            </Text>
            <Text style={[styles.brandSubtitle, { color: palette.textSoft }]}>
              IMS Platform
            </Text>
          </View>
        </View>
      )}

      <View
        style={[
          styles.tabLinksRow,
          isMobile && styles.tabLinksMobile,
        ]}
        accessibilityRole="none"
      >
        <TabTrigger name="index" href="/" asChild>
          <TabButton>Dashboard</TabButton>
        </TabTrigger>
        <TabTrigger name="products" href="/products" asChild>
          <TabButton>Products</TabButton>
        </TabTrigger>
        <TabTrigger name="operations" href="/operations" asChild>
          <TabButton>Operations</TabButton>
        </TabTrigger>
        <TabTrigger name="intelligence" href="/intelligence" asChild>
          <TabButton>History</TabButton>
        </TabTrigger>
      </View>

      {!isMobile && (
        <View style={styles.userActions} accessibilityRole="none">
          {user?.email && (
            <Text
              numberOfLines={1}
              style={[styles.userEmail, { color: palette.textSoft }]}
              accessibilityLabel={`Signed in as ${user.email}`}
            >
              {user.email}
            </Text>
          )}
          <Pressable
            onPress={() => void signOut()}
            accessibilityRole="button"
            accessibilityLabel="Sign out of StockSense"
            style={({ pressed }) => [
              styles.logoutButton,
              {
                borderColor: palette.border,
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
              },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.logoutText,
                { color: isDark ? '#ff9ead' : '#c53030' },
              ]}
            >
              Sign Out
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  slotWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  slot: {
    flex: 1,
    height: '100%',
  },
  desktopNavWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 100,
  },
  mobileNavWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    zIndex: 100,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#23764f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLinksMobile: {
    flex: 1,
    justifyContent: 'space-around',
    gap: 2,
  },
  tabButton: {
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 14,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userEmail: {
    fontSize: 12,
    maxWidth: 160,
  },
  logoutButton: {
    minHeight: 38,
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
