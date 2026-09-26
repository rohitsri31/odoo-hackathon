import { api, Product } from "@/lib/api";
import { glassTheme } from "@/styles/glass";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const green = "#23764f";

export default function ProductsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const palette = isDark ? glassTheme.dark : glassTheme.light;
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    unit: "pcs",
    reorderThreshold: "10",
  });

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const next = await api<Product[]>("/products");
      setProducts(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load products. Please check network connection.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku} ${p.category}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  const open = (product?: Product) => {
    setError("");
    setEditing(product ?? null);
    setForm(
      product
        ? {
            name: product.name,
            sku: product.sku,
            category: product.category,
            unit: product.unit,
            reorderThreshold: String(product.reorderThreshold),
          }
        : {
            name: "",
            sku: "",
            category: "",
            unit: "pcs",
            reorderThreshold: "10",
          },
    );
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      setError("Product name and SKU are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api(editing ? `/products/${editing._id}` : "/products", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          sku: form.sku.trim().toUpperCase(),
          category: form.category.trim() || "General",
          unit: form.unit.trim() || "pcs",
          reorderThreshold: Math.max(0, Number(form.reorderThreshold) || 0),
        }),
      });
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save product");
    } finally {
      setSaving(false);
    }
  };

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
        {/* Head Banner */}
        <View
          style={[
            styles.head,
            {
              backgroundColor: palette.panelStrong,
              borderColor: palette.border,
            },
            styles.glass,
          ]}
          accessibilityRole="header"
        >
          <View style={styles.headTextWrap}>
            <Text style={[styles.eyebrow, isDark && styles.eyebrowDark]}>
              CATALOG
            </Text>
            <Text style={[styles.title, isDark && styles.titleDark]}>
              Products
            </Text>
            <Text style={[styles.sub, isDark && styles.subDark]}>
              Inventory across all warehouses
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add new product"
            accessibilityHint="Opens dialog to create a new product catalog item"
            style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
            onPress={() => open()}
          >
            <Text style={styles.addText}>+ Add Product</Text>
          </Pressable>
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
              accessibilityLabel="Retry loading products"
              style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
              onPress={() => void load()}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchWrap}>
          <TextInput
            style={[
              styles.search,
              { backgroundColor: palette.panel, borderColor: palette.border },
              isDark && styles.searchDark,
            ]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search products by name, SKU, or category..."
            placeholderTextColor={isDark ? "#adc8de" : "#768c9e"}
            accessibilityLabel="Search products"
            accessibilityHint="Filters the list of products below"
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Summary Cards */}
        <View
          style={[
            styles.summary,
            { backgroundColor: palette.panel, borderColor: palette.border },
            styles.glass,
          ]}
          accessibilityRole="summary"
        >
          <View style={styles.summaryItem}>
            <Text style={[styles.label, isDark && styles.labelDark]}>
              Total products
            </Text>
            <Text style={[styles.count, isDark && styles.countDark]}>
              {products.length}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.label, isDark && styles.labelDark]}>
              Low / Out of stock
            </Text>
            <Text
              style={[
                styles.count,
                { color: isDark ? "#ffbe7d" : "#b45309" },
              ]}
            >
              {
                products.filter(
                  (p) =>
                    p.stock.reduce((s, x) => s + x.quantity, 0) <=
                    p.reorderThreshold,
                ).length
              }
            </Text>
          </View>
        </View>

        {/* Products List */}
        {filtered.map((product) => {
          const total = product.stock.reduce((s, x) => s + x.quantity, 0);
          const isOut = total === 0;
          const isLow = !isOut && total <= product.reorderThreshold;
          const statusText = isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock";
          const statusIcon = isOut ? "✕" : isLow ? "▲" : "✓";

          return (
            <Pressable
              key={product._id}
              accessibilityRole="button"
              accessibilityLabel={`Product ${product.name}, SKU ${product.sku}, ${total} ${product.unit} on hand, status ${statusText}. Click to edit.`}
              onPress={() => open(product)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: palette.panel, borderColor: palette.border },
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.productGlyph} accessibilityRole="none">
                  <Text style={styles.glyphText}>
                    {product.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.productInfo}>
                  <Text
                    style={[styles.name, isDark && styles.nameDark]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {product.name}
                  </Text>
                  <Text
                    style={[styles.meta, isDark && styles.metaDark]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    SKU: {product.sku} · {product.category}
                  </Text>
                </View>
                <View
                  style={[
                    styles.stockBadge,
                    isOut
                      ? styles.badgeOut
                      : isLow
                        ? styles.badgeLow
                        : styles.badgeGood,
                  ]}
                  accessibilityRole="text"
                  accessibilityLabel={`Stock status: ${statusText}`}
                >
                  <Text
                    style={[
                      styles.stockFlagText,
                      isOut
                        ? styles.flagOut
                        : isLow
                          ? styles.flagLow
                          : styles.flagGood,
                    ]}
                  >
                    {statusIcon} {statusText}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, isDark && styles.dividerDark]} />

              <View style={styles.stockRow}>
                <View>
                  <Text style={[styles.label, isDark && styles.labelDark]}>
                    On hand
                  </Text>
                  <Text style={[styles.stock, isDark && styles.stockDark]}>
                    {total} {product.unit}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.label, isDark && styles.labelDark]}>
                    Reorder point
                  </Text>
                  <Text style={[styles.stock, isDark && styles.stockDark]}>
                    {product.reorderThreshold} {product.unit}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.warehouseLine,
                  isDark && styles.warehouseLineDark,
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {product.stock.length > 0
                  ? product.stock
                      .map(
                        (s) =>
                          `${typeof s.warehouse === "object" ? s.warehouse.name : "Warehouse"}: ${s.quantity} ${product.unit}`,
                      )
                      .join("  ·  ")
                  : "No stock allocated to any warehouse yet"}
              </Text>
            </Pressable>
          );
        })}

        {/* Empty state */}
        {!filtered.length && !busy && (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: palette.panel, borderColor: palette.border },
              styles.glass,
            ]}
          >
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              {query ? "No matching products found" : "No products in catalog yet"}
            </Text>
            <Text style={[styles.emptySub, isDark && styles.emptySubDark]}>
              {query
                ? "Try searching for another term or clear the filter."
                : "Add your first product to start tracking inventory across your warehouses."}
            </Text>
            {!query && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add first product"
                style={({ pressed }) => [styles.emptyCta, pressed && styles.pressed]}
                onPress={() => open()}
              >
                <Text style={styles.emptyCtaText}>+ Add First Product</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal with Accessible Keyboard-Safe Container */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalShade}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: palette.panelStrong,
                borderColor: palette.border,
              },
              styles.glass,
            ]}
          >
            <View style={styles.modalHead}>
              <Text
                style={[styles.modalTitle, isDark && styles.modalTitleDark]}
                accessibilityRole="header"
              >
                {editing ? "Edit Product" : "Add Product"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
                style={styles.closeBtn}
                onPress={() => setModalOpen(false)}
              >
                <Text style={styles.cancel}>Close</Text>
              </Pressable>
            </View>

            {!!error && (
              <View
                style={styles.modalError}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <ScrollView style={styles.modalFormScroll}>
              {(
                [
                  { key: "name", label: "Product Name *", placeholder: "e.g. Steel Bolts 10mm" },
                  { key: "sku", label: "SKU / Code *", placeholder: "e.g. BLT-10MM" },
                  { key: "category", label: "Category", placeholder: "e.g. Fasteners" },
                  { key: "unit", label: "Unit of Measure", placeholder: "e.g. pcs, kg, box" },
                  { key: "reorderThreshold", label: "Reorder Threshold (Alert Level)", placeholder: "10" },
                ] as const
              ).map(({ key, label, placeholder }) => (
                <View key={key} style={styles.formField}>
                  <Text
                    style={[styles.formLabel, isDark && styles.formLabelDark]}
                  >
                    {label}
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                      },
                      isDark && styles.formInputDark,
                    ]}
                    value={form[key as keyof typeof form]}
                    onChangeText={(value) => setForm({ ...form, [key]: value })}
                    keyboardType={
                      key === "reorderThreshold" ? "number-pad" : "default"
                    }
                    placeholder={placeholder}
                    placeholderTextColor={isDark ? "#8fa5b8" : "#8a9ba8"}
                    accessibilityLabel={label}
                    autoCapitalize={key === "sku" ? "characters" : "sentences"}
                  />
                </View>
              ))}
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={editing ? "Update product" : "Create product"}
              accessibilityState={{ disabled: saving }}
              onPress={() => void save()}
              disabled={saving}
              style={({ pressed }) => [
                styles.saveButton,
                saving && styles.saveButtonDisabled,
                pressed && styles.saveButtonPressed,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveText}>
                  {editing ? "Save Changes" : "Create Product"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    marginBottom: 16,
    gap: 12,
  },
  headTextWrap: { flex: 1 },
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
  add: {
    backgroundColor: green,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  addPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  addText: { color: "#ffffff", fontWeight: "700", fontSize: 13 },
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
  searchWrap: { marginBottom: 14 },
  search: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 44,
    color: "#122331",
  },
  searchDark: { color: "#edf7ff" },
  summary: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: { alignItems: "center" },
  label: { fontSize: 12, fontWeight: "600", color: "#374d61" },
  labelDark: { color: "#bcd6ea" },
  count: { fontSize: 24, fontWeight: "800", marginTop: 4, color: "#122331" },
  countDark: { color: "#edf7ff" },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  productGlyph: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(35,118,79,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  glyphText: { color: green, fontSize: 18, fontWeight: "800" },
  productInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: "#122331" },
  nameDark: { color: "#edf7ff" },
  meta: { fontSize: 12, color: "#374d61", marginTop: 2 },
  metaDark: { color: "#bcd6ea" },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeGood: { backgroundColor: "#dcfce7", borderColor: "#86efac" },
  badgeLow: { backgroundColor: "#fef3c7", borderColor: "#fde68a" },
  badgeOut: { backgroundColor: "#fee2e2", borderColor: "#fca5a5" },
  stockFlagText: { fontSize: 11, fontWeight: "700" },
  flagGood: { color: "#15803d" },
  flagLow: { color: "#92400e" },
  flagOut: { color: "#b91c1c" },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 12,
  },
  dividerDark: { backgroundColor: "rgba(255,255,255,0.08)" },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stock: { fontSize: 14, fontWeight: "700", marginTop: 2, color: "#122331" },
  stockDark: { color: "#edf7ff" },
  warehouseLine: { fontSize: 11, color: "#546e82", fontStyle: "italic" },
  warehouseLineDark: { color: "#9cbcd2" },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 20,
  },
  emptyIcon: { fontSize: 42, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#122331", textAlign: "center" },
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
  modalShade: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    padding: 20,
    borderRadius: 24,
  },
  modalHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#122331" },
  modalTitleDark: { color: "#edf7ff" },
  closeBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  cancel: { color: "#64748b", fontWeight: "600", fontSize: 14 },
  modalError: {
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  modalFormScroll: { maxHeight: 380 },
  formField: { marginBottom: 14 },
  formLabel: { fontSize: 12, fontWeight: "700", color: "#374d61", marginBottom: 6 },
  formLabelDark: { color: "#bcd6ea" },
  formInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
    color: "#122331",
  },
  formInputDark: { color: "#edf7ff" },
  saveButton: {
    backgroundColor: green,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    marginTop: 16,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonPressed: { transform: [{ scale: 0.98 }] },
  saveText: { color: "#ffffff", fontWeight: "800", fontSize: 15 },
  pressed: { opacity: 0.8 },
});
