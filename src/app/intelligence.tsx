import { api, Movement, Product, Warehouse } from "@/lib/api";
import { glassTheme } from "@/styles/glass";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
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

export default function MoveHistoryScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const palette = isDark ? glassTheme.dark : glassTheme.light;
  const [rows, setRows] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [product, setProduct] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [ledger, prods, whs] = await Promise.all([
        api<Movement[]>(
          `/dashboard/ledger?${product ? `product=${product}&` : ""}${warehouse ? `warehouse=${warehouse}` : ""}`,
        ),
        api<Product[]>("/products"),
        api<Warehouse[]>("/warehouses"),
      ]);
      setRows(ledger);
      setProducts(prods);
      setWarehouses(whs);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to load stock move ledger. Please check network connection.",
      );
    } finally {
      setBusy(false);
    }
  }, [product, warehouse]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <SafeAreaView
      style={[styles.safe, isDark && styles.safeDark]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={busy}
            onRefresh={() => void load()}
            tintColor={green}
          />
        }
      >
        {/* Header */}
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
          <Text style={[styles.eyebrow, isDark && styles.eyebrowDark]}>
            AUDIT TRAIL
          </Text>
          <Text style={[styles.title, isDark && styles.titleDark]}>
            Move Ledger
          </Text>
          <Text style={[styles.sub, isDark && styles.subDark]}>
            Immutable log of validated stock operations
          </Text>
        </View>

        {/* Error Banner with Retry */}
        {!!error && (
          <View
            style={[styles.errorBanner, isDark && styles.errorBannerDark]}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry loading ledger"
              style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
              onPress={() => void load()}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Product Filter */}
        <Text
          style={[styles.filterTitle, isDark && styles.filterTitleDark]}
          accessibilityRole="none"
        >
          FILTER BY PRODUCT
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
          accessibilityLabel="Filter by product"
        >
          <Pill
            label="All Products"
            selected={!product}
            onPress={() => setProduct("")}
            isDark={isDark}
            a11yLabel="Show moves for all products"
          />
          {products.map((p) => (
            <Pill
              key={p._id}
              label={p.name}
              selected={product === p._id}
              onPress={() => setProduct(p._id)}
              isDark={isDark}
              a11yLabel={`Filter by product ${p.name}`}
            />
          ))}
        </ScrollView>

        {/* Warehouse Filter */}
        <Text
          style={[styles.filterTitle, isDark && styles.filterTitleDark]}
          accessibilityRole="none"
        >
          FILTER BY WAREHOUSE
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
          accessibilityLabel="Filter by warehouse"
        >
          <Pill
            label="All Warehouses"
            selected={!warehouse}
            onPress={() => setWarehouse("")}
            isDark={isDark}
            a11yLabel="Show moves for all warehouses"
          />
          {warehouses.map((w) => (
            <Pill
              key={w._id}
              label={w.name}
              selected={warehouse === w._id}
              onPress={() => setWarehouse(w._id)}
              isDark={isDark}
              a11yLabel={`Filter by warehouse ${w.name}`}
            />
          ))}
        </ScrollView>

        <View style={styles.countRow}>
          <Text style={[styles.count, isDark && styles.countDark]}>
            {rows.length} {rows.length === 1 ? "entry" : "entries"} recorded
          </Text>
        </View>

        {/* Ledger Entries */}
        {rows.map((row) => {
          const isPos = row.quantityDelta > 0;
          const deltaSign = isPos ? "+" : "";
          const typeGlyph =
            row.operationType === "receipt"
              ? "📥"
              : row.operationType === "delivery"
                ? "📤"
                : row.operationType === "transfer"
                  ? "⇄"
                  : "⚖";

          return (
            <View
              key={row._id}
              style={[
                styles.card,
                { backgroundColor: palette.panel, borderColor: palette.border },
                styles.glass,
              ]}
              accessibilityRole="text"
              accessibilityLabel={`${row.operationType} of ${Math.abs(row.quantityDelta)} units of ${row.product?.name || "Product"}. Route: ${row.fromWarehouse?.name || "External"} to ${row.toWarehouse?.name || "External"}. Recorded on ${new Date(row.createdAt).toLocaleString()}.`}
            >
              <View style={styles.cardHead}>
                <View style={styles.glyph} accessibilityRole="none">
                  <Text style={styles.glyphText}>{typeGlyph}</Text>
                </View>
                <View style={styles.main}>
                  <Text
                    style={[styles.name, isDark && styles.nameDark]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {row.product?.name || "Product"}
                  </Text>
                  <Text
                    style={[styles.meta, isDark && styles.metaDark]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {row.product?.sku ? `SKU: ${row.product.sku} · ` : ""}
                    {new Date(row.createdAt).toLocaleString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.deltaBadge,
                    isPos ? styles.deltaBadgePos : styles.deltaBadgeNeg,
                  ]}
                >
                  <Text
                    style={[
                      styles.delta,
                      isPos ? styles.positive : styles.negative,
                    ]}
                  >
                    {deltaSign}{row.quantityDelta}
                  </Text>
                </View>
              </View>

              <View style={[styles.routeBox, isDark && styles.routeBoxDark]}>
                <Text
                  style={[styles.routeType, isDark && styles.routeTypeDark]}
                >
                  {row.operationType.toUpperCase()}
                </Text>
                <Text
                  style={[styles.route, isDark && styles.routeDark]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {row.fromWarehouse?.name || "Vendor / External"} →{" "}
                  {row.toWarehouse?.name || "Customer / External"}
                </Text>
              </View>
            </View>
          );
        })}

        {/* Empty State */}
        {!rows.length && !busy && (
          <View
            style={[
              styles.empty,
              { backgroundColor: palette.panel, borderColor: palette.border },
              styles.glass,
            ]}
          >
            <Text style={styles.emptyIcon}>📜</Text>
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No stock movements yet
            </Text>
            <Text style={[styles.emptySub, isDark && styles.emptySubDark]}>
              Validated receipts, deliveries, transfers, and inventory adjustments will automatically appear in this immutable audit ledger.
            </Text>
            <Link href="/operations" asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Go to operations screen"
                style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
              >
                <Text style={styles.emptyCtaText}>Go to Operations →</Text>
              </Pressable>
            </Link>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({
  label,
  selected,
  onPress,
  isDark,
  a11yLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
  a11yLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={a11yLabel || label}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.selected,
        isDark && styles.pillDark,
        pressed && styles.pressed,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.pillText,
          selected && styles.selectedText,
          isDark && styles.pillTextDark,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#edf4fb" },
  safeDark: { backgroundColor: "#071722" },
  glass: {
    borderWidth: 1,
    borderRadius: 24,
    shadowColor: "#122233",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 780,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    padding: 20,
    marginBottom: 16,
  },
  eyebrow: {
    color: "#374d61",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  eyebrowDark: { color: "#b9d8f4" },
  title: { color: "#122331", fontSize: 26, fontWeight: "800", marginTop: 2 },
  titleDark: { color: "#edf7ff" },
  sub: { color: "#374d61", fontSize: 13, marginTop: 2 },
  subDark: { color: "#bcd6ea" },
  errorBanner: {
    backgroundColor: "#fee2e2",
    borderColor: "#f87171",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorBannerDark: {
    backgroundColor: "#450a0a",
    borderColor: "#991b1b",
  },
  errorText: { color: "#991b1b", fontSize: 13, fontWeight: "600", flex: 1 },
  retryBtn: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  retryText: { color: "#ffffff", fontWeight: "700", fontSize: 12 },
  filterTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#374d61",
    marginTop: 10,
    marginBottom: 6,
    marginLeft: 4,
  },
  filterTitleDark: { color: "#bcd6ea" },
  pills: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "rgba(255,255,255,0.65)",
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  pillDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  selected: {
    backgroundColor: green,
    borderColor: green,
  },
  pillText: { fontSize: 13, fontWeight: "600", color: "#374d61" },
  pillTextDark: { color: "#bcd6ea" },
  selectedText: { color: "#ffffff", fontWeight: "700" },
  countRow: {
    marginVertical: 12,
    marginLeft: 4,
  },
  count: { fontSize: 13, fontWeight: "700", color: "#374d61" },
  countDark: { color: "#bcd6ea" },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  glyph: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(35,118,79,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  glyphText: { fontSize: 18 },
  main: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: "#122331" },
  nameDark: { color: "#edf7ff" },
  meta: { fontSize: 12, color: "#374d61", marginTop: 2 },
  metaDark: { color: "#bcd6ea" },
  deltaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  deltaBadgePos: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  deltaBadgeNeg: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  delta: { fontSize: 14, fontWeight: "800" },
  positive: { color: "#15803d" },
  negative: { color: "#b91c1c" },
  routeBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeBoxDark: {
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  routeType: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: green,
    backgroundColor: "rgba(35,118,79,0.10)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routeTypeDark: {
    color: "#7ee2c4",
    backgroundColor: "rgba(126,226,196,0.15)",
  },
  route: { fontSize: 12, color: "#374d61", flex: 1 },
  routeDark: { color: "#bcd6ea" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 36,
    marginTop: 16,
  },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#122331" },
  emptyTitleDark: { color: "#edf7ff" },
  emptySub: {
    fontSize: 13,
    color: "#374d61",
    textAlign: "center",
    marginTop: 6,
    maxWidth: 340,
    lineHeight: 18,
  },
  emptySubDark: { color: "#bcd6ea" },
  emptyCta: {
    marginTop: 18,
    backgroundColor: green,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 44,
    justifyContent: "center",
  },
  emptyCtaText: { color: "#ffffff", fontWeight: "700", fontSize: 14 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
