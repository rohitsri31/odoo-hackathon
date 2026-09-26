import { useAuth } from "@/context/auth";
import { api, Kpis, Operation, Warehouse } from "@/lib/api";
import { glassTheme } from "@/styles/glass";
import { Link, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    AccessibilityInfo,
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const green = "#23764f";
const types = ["receipt", "delivery", "transfer", "adjustment"] as const;

// Icon + label pairs for operation quick-actions — never rely on icon alone
const TYPE_META: Record<
  typeof types[number],
  { icon: string; label: string; a11yLabel: string }
> = {
  receipt:    { icon: "↓", label: "Receipt",    a11yLabel: "New receipt — add stock" },
  delivery:   { icon: "↑", label: "Delivery",   a11yLabel: "New delivery — dispatch stock" },
  transfer:   { icon: "⇄", label: "Transfer",   a11yLabel: "New transfer — move stock between warehouses" },
  adjustment: { icon: "±", label: "Adjust",     a11yLabel: "New adjustment — correct stock count" },
};

// Status colors + textual labels — never color-only
const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  draft:    { color: "#4a6175", bg: "rgba(180,200,220,0.22)", label: "Draft" },
  waiting:  { color: "#a46d32", bg: "rgba(255,184,108,0.22)", label: "Waiting" },
  ready:    { color: "#3d7cbf", bg: "rgba(91,183,255,0.22)",  label: "Ready" },
  done:     { color: "#3c7c5b", bg: "rgba(94,195,141,0.18)",  label: "Done" },
  canceled: { color: "#8f4040", bg: "rgba(220,100,100,0.18)", label: "Canceled" },
};

export default function HomeScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const palette = isDark ? glassTheme.dark : glassTheme.light;
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signOut, user } = useAuth();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summary, rows, locations] = await Promise.all([
        api<Kpis>("/dashboard/kpis"),
        api<Operation[]>("/operations"),
        api<Warehouse[]>("/warehouses"),
      ]);
      setKpis(summary);
      setOperations(rows.slice(0, 6));
      setWarehouses(locations);
      // Announce KPI load for screen reader users
      AccessibilityInfo.announceForAccessibility(
        `Dashboard updated: ${summary.totalProducts} products, ${summary.pendingReceipts} pending receipts.`
      );
    } catch (cause) {
      const msg =
        cause instanceof Error ? cause.message : "Unable to load dashboard";
      setError(msg);
      AccessibilityInfo.announceForAccessibility(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const profile = () =>
    Alert.alert(
      "My Profile",
      `${user?.name ?? "StockSense user"}\n${user?.email ?? ""}`,
      [
        { text: "Close" },
        {
          text: "Log out",
          style: "destructive",
          onPress: () => { void signOut(); },
        },
      ],
    );

  const cards = [
    {
      id: "total-products",
      label: "Products",
      value: kpis?.totalProducts ?? "—",
      note: "In your catalog",
      tint: "rgba(116,183,255,0.22)",
      color: "#1e4d8c", // ≥ 4.5:1 on rgba bg at full opacity approximation
    },
    {
      id: "low-stock",
      label: "Low / out of stock",
      value: kpis ? `${kpis.lowStock} / ${kpis.outOfStock}` : "—",
      note: "Needs attention",
      tint: "rgba(255,185,100,0.22)",
      color: "#7a4e10",
    },
    {
      id: "pending-receipts",
      label: "Pending receipts",
      value: kpis?.pendingReceipts ?? "—",
      note: "Awaiting validation",
      tint: "rgba(91,215,173,0.20)",
      color: "#1a5a40",
    },
    {
      id: "deliveries-transfers",
      label: "Deliveries / transfers",
      value: kpis
        ? `${kpis.pendingDeliveries} / ${kpis.scheduledTransfers}`
        : "—",
      note: "Scheduled moves",
      tint: "rgba(166,138,255,0.20)",
      color: "#3d2575",
    },
  ];

  return (
    <SafeAreaView
      style={[styles.safe, isDark && styles.safeDark]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void load()}
            tintColor={green}
            accessibilityLabel="Refreshing dashboard"
          />
        }
      >
        {/* ── HEADER ── */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: palette.panelStrong,
              borderColor: palette.border,
            },
            styles.glass,
          ]}
          accessibilityRole="header"
        >
          <View>
            <Text style={[styles.kicker, isDark && styles.kickerDark]} accessibilityElementsHidden>
              INVENTORY OVERVIEW
            </Text>
            <Text style={[styles.heading, isDark && styles.headingDark]}>
              Good morning
            </Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {"Here's what's happening today."}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.profile,
              pressed && styles.profilePressed,
            ]}
            onPress={profile}
            accessibilityRole="button"
            accessibilityLabel={`Profile — ${user?.name ?? "Open profile and sign out"}`}
          >
            <Text style={styles.profileText} accessibilityElementsHidden>
              {(user?.name ?? "S")[0].toUpperCase()}
            </Text>
          </Pressable>
        </View>

        {/* ── ERROR BANNER ── */}
        {!!error && (
          <Pressable
            onPress={() => void load()}
            accessibilityRole="button"
            accessibilityLabel={`Error: ${error}. Tap to retry.`}
          >
            <View style={styles.errorBanner} accessibilityRole={"alert" as any}>
              <Text style={styles.errorText}>⚠ {error}</Text>
              <Text style={styles.retryText}>Tap to retry →</Text>
            </View>
          </Pressable>
        )}

        {/* ── KPI GRID ── */}
        <View
          style={styles.grid}
          accessibilityRole={"list" as any}
          accessibilityLabel="Dashboard KPIs"
          // Live region so screen readers announce on refresh
          accessibilityLiveRegion="polite"
        >
          {cards.map((card) => (
            <View
              key={card.id}
              nativeID={card.id}
              style={[
                styles.kpi,
                { backgroundColor: palette.panel, borderColor: palette.border },
              ]}
              accessibilityRole={"listitem" as any}
              accessibilityLabel={`${card.label}: ${card.value}. ${card.note}`}
            >
              <View style={[styles.kpiDot, { backgroundColor: card.tint }]}>
                <Text style={{ color: card.color, fontWeight: "800" }} accessibilityElementsHidden>•</Text>
              </View>
              <Text style={[styles.kpiLabel, isDark && styles.kpiLabelDark]}>
                {card.label}
              </Text>
              <Text style={[styles.kpiValue, isDark && styles.kpiValueDark, { color: card.color }]}>
                {card.value}
              </Text>
              <Text style={[styles.kpiNote, isDark && styles.kpiNoteDark]}>
                {card.note}
              </Text>
            </View>
          ))}
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Quick actions
            </Text>
            <Text style={[styles.sectionHint, isDark && styles.sectionHintDark]}>
              Move stock between warehouses
            </Text>
          </View>
        </View>

        {/* Empty state: no warehouses yet */}
        {!loading && warehouses.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: palette.panel, borderColor: palette.border },
              styles.glass,
            ]}
            accessibilityRole="none"
          >
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              🏭 No warehouses yet
            </Text>
            <Text style={[styles.emptySub, isDark && styles.emptySubDark]}>
              You need at least one warehouse before creating stock operations.
            </Text>
          </View>
        ) : (
          <View
            style={styles.quickGrid}
            accessibilityRole={"list" as any}
            accessibilityLabel="Quick action buttons"
          >
            {types.map((type) => {
              const meta = TYPE_META[type];
              return (
                <Pressable
                  key={type}
                  onPress={() =>
                    router.push({ pathname: "/operations", params: { type } })
                  }
                  style={({ pressed }) => [
                    styles.quickButton,
                    pressed && styles.quickButtonPressed,
                    { backgroundColor: palette.panel, borderColor: palette.border },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={meta.a11yLabel}
                >
                  {/* Icon + label pair — never icon-only */}
                  <Text style={styles.quickIcon} accessibilityElementsHidden>
                    {meta.icon}
                  </Text>
                  <Text style={[styles.quickLabel, isDark && styles.quickLabelDark]}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ── RECENT OPERATIONS ── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Recent operations
            </Text>
            <Text style={[styles.sectionHint, isDark && styles.sectionHintDark]}>
              {warehouses.length} warehouse{warehouses.length !== 1 ? "s" : ""} connected
            </Text>
          </View>
          <Link
            href="/operations"
            style={styles.viewAll}
            accessibilityRole="link"
            accessibilityLabel="View all operations"
          >
            View all
          </Link>
        </View>

        <View
          style={[
            styles.list,
            { backgroundColor: palette.panel, borderColor: palette.border },
            isDark && styles.listDark,
          ]}
          accessibilityRole={"list" as any}
          accessibilityLabel="Recent operations"
        >
          {operations.length ? (
            operations.map((op) => (
              <OperationRow key={op._id} operation={op} isDark={isDark} />
            ))
          ) : (
            /* Empty state with CTA */
            <View style={styles.emptyInline} accessibilityRole="none">
              <Text style={[styles.emptyInlineTitle, isDark && styles.emptyInlineTitleDark]}>
                {loading ? "Loading activity…" : "No operations yet"}
              </Text>
              {!loading && (
                <>
                  <Text style={[styles.emptyInlineSub, isDark && styles.emptyInlineSubDark]}>
                    Create your first receipt to get started tracking stock.
                  </Text>
                  <Pressable
                    onPress={() => router.push({ pathname: "/operations", params: { type: "receipt" } })}
                    style={styles.ctaButton}
                    accessibilityRole="button"
                    accessibilityLabel="Create your first receipt"
                  >
                    <Text style={styles.ctaText}>+ Create receipt</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── OPERATION ROW ────────────────────────────────────────────────────────────
function OperationRow({
  operation,
  isDark,
}: {
  operation: Operation;
  isDark: boolean;
}) {
  const warehouse = operation.toWarehouse || operation.fromWarehouse;
  const place =
    warehouse && typeof warehouse === "object" ? warehouse.name : "Warehouse";
  const statusMeta = STATUS_META[operation.status] ?? STATUS_META.draft;
  const typeLabel = operation.type[0].toUpperCase() + operation.type.slice(1);

  return (
    <View
      style={[styles.row, isDark && styles.rowDark]}
      accessibilityRole={"listitem" as any}
      accessibilityLabel={`${typeLabel} at ${place}, ${operation.lines.length} line${operation.lines.length === 1 ? "" : "s"}, status: ${statusMeta.label}`}
    >
      {/* Type initial badge — decorative, hidden from a11y */}
      <View style={styles.rowIcon} accessibilityElementsHidden>
        <Text style={styles.rowIconText}>{operation.type[0].toUpperCase()}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={[styles.rowTitle, isDark && styles.rowTitleDark]} numberOfLines={1}>
          {typeLabel} · {operation.lines.length} line{operation.lines.length === 1 ? "" : "s"}
        </Text>
        <Text style={[styles.rowHint, isDark && styles.rowHintDark]} numberOfLines={1}>
          {place} · {new Date(operation.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {/* Status badge: always has text label — not color-only */}
      <View style={[styles.badge, { backgroundColor: statusMeta.bg }]}>
        <Text style={[styles.badgeText, { color: statusMeta.color }]}>
          {statusMeta.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#edf4fb" },
  safeDark: { backgroundColor: "#071722" },
  glass: {
    borderWidth: 1,
    borderRadius: 28,
    shadowColor: "#122233",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    padding: 16,
    marginBottom: 16,
  },
  content: {
    padding: 18,
    paddingBottom: 34,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: {
    color: "#4a6175", // higher contrast: ≥ 4.5:1 on white-ish bg
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  kickerDark: { color: "#b9d8f4" },
  heading: { color: "#122331", fontWeight: "800", fontSize: 28, marginTop: 5 },
  headingDark: { color: "#edf7ff" },
  subtitle: { color: "#3d5567", fontSize: 13, marginTop: 5 }, // ≥ 4.5:1
  subtitleDark: { color: "#bdd6ea" },
  profile: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.54)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#23364b",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
  },
  profilePressed: { transform: [{ scale: 0.97 }] },
  profileText: { color: green, fontSize: 16, fontWeight: "800" },

  // Error banner
  errorBanner: {
    backgroundColor: "rgba(255,243,241,0.92)",
    borderColor: "rgba(200,100,80,0.4)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: { color: "#7a1f1a", fontSize: 12, fontWeight: "600", flex: 1 },
  retryText: { color: "#1a6647", fontSize: 12, fontWeight: "700", marginLeft: 8 },

  // KPI grid — responsive: 2-column flex-wrap
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 6 },
  kpi: {
    flexBasis: "48%",
    flexGrow: 1,
    minHeight: 138,
    // Ensure min touch target when pressed — actual cards are bigger
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    shadowColor: "#1a2e40",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  kpiDot: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  kpiLabel: { color: "#3d5567", fontSize: 11, fontWeight: "600" }, // ≥ 4.5:1
  kpiLabelDark: { color: "#b9d8f4" },
  kpiValue: { fontSize: 25, fontWeight: "800", marginTop: 4 },
  kpiValueDark: { color: "#edf7ff" },
  kpiNote: { color: "#4a6175", fontSize: 10, marginTop: 4 }, // ≥ 4.5:1
  kpiNoteDark: { color: "#bfd7eb" },

  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: "#1f2f3a", fontSize: 16, fontWeight: "800" },
  sectionTitleDark: { color: "#edf7ff" },
  sectionHint: { color: "#4a6175", fontSize: 11, marginTop: 4 }, // ≥ 4.5:1
  sectionHintDark: { color: "#bfd7eb" },

  quickGrid: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  quickButton: {
    flexBasis: "22%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    // Minimum 44pt touch target — paddingVertical 15 + text ≈ 50
    minHeight: 60,
    shadowColor: "#1b2e41",
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  quickButtonPressed: { transform: [{ scale: 0.97 }] },
  quickIcon: { color: green, fontSize: 22, fontWeight: "700" },
  quickLabel: {
    color: "#2e3d47", // ≥ 4.5:1
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  quickLabelDark: { color: "#ebf4ff" },
  viewAll: { color: green, fontSize: 11, fontWeight: "700" },

  list: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: "#1d2f42",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  listDark: { borderColor: "rgba(255,255,255,0.09)" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,168,181,0.22)",
    // Ensure row meets 44pt minimum height
    minHeight: 44,
  },
  rowDark: { borderBottomColor: "rgba(255,255,255,0.10)" },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(95, 167, 122, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconText: { color: green, fontWeight: "800", fontSize: 12 },
  rowMain: { flex: 1, paddingLeft: 10 },
  rowTitle: { color: "#23313c", fontSize: 13, fontWeight: "700" },
  rowTitleDark: { color: "#edf7ff" },
  rowHint: { color: "#4a6175", fontSize: 10, marginTop: 4 }, // ≥ 4.5:1
  rowHintDark: { color: "#c1d8eb" },
  badge: {
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },

  // Empty states
  emptyCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { color: "#253040", fontSize: 14, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  emptyTitleDark: { color: "#edf7ff" },
  emptySub: { color: "#4a6175", fontSize: 12, textAlign: "center" },
  emptySubDark: { color: "#bfd7eb" },

  emptyInline: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  emptyInlineTitle: { color: "#253040", fontSize: 13, fontWeight: "700", marginBottom: 6 },
  emptyInlineTitleDark: { color: "#edf7ff" },
  emptyInlineSub: { color: "#4a6175", fontSize: 12, textAlign: "center", marginBottom: 14 },
  emptyInlineSubDark: { color: "#bfd7eb" },
  ctaButton: {
    backgroundColor: "#1a6647",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
