import { api, Operation, OperationType, Product, Warehouse } from "@/lib/api";
import { glassTheme } from "@/styles/glass";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AccessibilityInfo,
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
const types: OperationType[] = [
  "receipt",
  "delivery",
  "transfer",
  "adjustment",
];

// Status metadata — text label + colors so status is never color-only
const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  draft:    { color: "#3d5567", bg: "rgba(180,200,220,0.22)", label: "Draft"    },
  waiting:  { color: "#7a4e10", bg: "rgba(255,184,108,0.22)", label: "Waiting"  },
  ready:    { color: "#1e4d8c", bg: "rgba(91,183,255,0.22)",  label: "Ready"    },
  done:     { color: "#1a5a40", bg: "rgba(94,195,141,0.18)",  label: "Done"     },
  canceled: { color: "#6b2020", bg: "rgba(220,100,100,0.18)", label: "Canceled" },
};

export default function OperationsScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const palette = isDark ? glassTheme.dark : glassTheme.light;
  const [selectedType, setSelectedType] = useState<OperationType | null>(null);
  const type =
    selectedType ??
    (types.includes(params.type as OperationType)
      ? (params.type as OperationType)
      : "receipt");
  const [status, setStatus] = useState("all");
  const [warehouse, setWarehouse] = useState("all");
  const [category, setCategory] = useState("all");
  const [rows, setRows] = useState<Operation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [busy, setBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [supplier, setSupplier] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const [ops, prods, whs] = await Promise.all([
        api<Operation[]>("/operations"),
        api<Product[]>("/products"),
        api<Warehouse[]>("/warehouses"),
      ]);
      setRows(ops);
      setProducts(prods);
      setWarehouses(whs);
      if (prods.length) setProduct((current) => current || prods[0]._id);
      if (whs.length) setFrom((current) => current || whs[0]._id);
      if (whs.length > 1) setTo((current) => current || whs[1]._id);
      else if (whs.length) setTo((current) => current || whs[0]._id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to load operations";
      setError(msg);
      AccessibilityInfo.announceForAccessibility(`Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products],
  );

  const visible = rows.filter(
    (o) =>
      o.type === type &&
      (status === "all" || o.status === status) &&
      (category === "all" ||
        o.lines.some(
          (l) =>
            typeof l.product === "object" && l.product.category === category,
        )) &&
      (warehouse === "all" ||
        [o.fromWarehouse, o.toWarehouse].some(
          (w) => typeof w === "object" && w._id === warehouse,
        )),
  );

  const create = async () => {
    setError("");
    const amount = Number(quantity);
    if (
      !product ||
      !Number.isFinite(amount) ||
      amount < (type === "adjustment" ? 0 : Number.EPSILON)
    ) {
      const msg =
        type === "adjustment"
          ? "Enter the counted stock quantity."
          : "Enter a quantity greater than zero.";
      setError(msg);
      AccessibilityInfo.announceForAccessibility(msg);
      return;
    }
    if (type === "transfer" && from === to) {
      const msg = "Choose two different warehouses for a transfer.";
      setError(msg);
      AccessibilityInfo.announceForAccessibility(msg);
      return;
    }
    if (products.length === 0) {
      const msg = "Add at least one product before creating operations.";
      setError(msg);
      AccessibilityInfo.announceForAccessibility(msg);
      return;
    }
    if (warehouses.length === 0) {
      const msg = "Add at least one warehouse before creating operations.";
      setError(msg);
      AccessibilityInfo.announceForAccessibility(msg);
      return;
    }

    const body: Record<string, unknown> = {
      type,
      lines: [{ product, quantity: amount }],
    };
    if (type === "receipt") {
      body.toWarehouse = to;
      body.supplier = supplier;
    } else {
      body.fromWarehouse = from;
    }
    if (type === "transfer") body.toWarehouse = to;

    setActionBusy(true);
    try {
      await api("/operations", { method: "POST", body: JSON.stringify(body) });
      setModal(false);
      setQuantity("");
      setSupplier("");
      await load();
      AccessibilityInfo.announceForAccessibility(`${type} created successfully.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to create operation";
      setError(msg);
      AccessibilityInfo.announceForAccessibility(`Error: ${msg}`);
    } finally {
      setActionBusy(false);
    }
  };

  const transition = async (op: Operation, next: string) => {
    setActionBusy(true);
    try {
      await api(`/operations/${op._id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: next }),
      });
      await load();
      AccessibilityInfo.announceForAccessibility(`Operation moved to ${next}.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to update status";
      setError(msg);
      AccessibilityInfo.announceForAccessibility(`Error: ${msg}`);
    } finally {
      setActionBusy(false);
    }
  };

  const validate = async (op: Operation) => {
    setActionBusy(true);
    try {
      await api(`/operations/${op._id}/validate`, { method: "POST" });
      await load();
      AccessibilityInfo.announceForAccessibility("Operation validated. Stock has been updated.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to validate operation";
      setError(msg);
      AccessibilityInfo.announceForAccessibility(`Validation failed: ${msg}`);
    } finally {
      setActionBusy(false);
    }
  };

  const typeLabel = type[0].toUpperCase() + type.slice(1);

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
            accessibilityLabel="Refreshing operations"
          />
        }
      >
        {/* ── HEADER ── */}
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
          <View>
            <Text style={[styles.eyebrow, isDark && styles.eyebrowDark]} accessibilityElementsHidden>
              INVENTORY FLOW
            </Text>
            <Text style={[styles.title, isDark && styles.titleDark]}>
              Operations
            </Text>
            <Text style={[styles.sub, isDark && styles.subDark]}>
              Prepare and validate stock movements
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.add, pressed && styles.addPressed]}
            onPress={() => setModal(true)}
            accessibilityRole="button"
            accessibilityLabel={`Create new ${typeLabel}`}
          >
            <Text style={styles.addText}>+ New</Text>
          </Pressable>
        </View>

        {/* ── TYPE FILTER ── */}
        <Text style={[styles.filterLabel, isDark && styles.filterLabelDark]} accessibilityRole="none">
          TYPE
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontal}
          accessibilityLabel="Filter by operation type"
        >
          {types.map((t) => (
            <Pill
              key={t}
              label={t[0].toUpperCase() + t.slice(1)}
              selected={type === t}
              onPress={() => setSelectedType(t)}
              isDark={isDark}
              a11yLabel={`Show ${t} operations${type === t ? ", selected" : ""}`}
            />
          ))}
        </ScrollView>

        {/* ── STATUS FILTER ── */}
        <Text style={[styles.filterLabel, isDark && styles.filterLabelDark]} accessibilityRole="none">
          STATUS
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontal}
          accessibilityLabel="Filter by status"
        >
          {["all", "draft", "waiting", "ready", "done"].map((s) => (
            <Pill
              key={s}
              label={s === "all" ? "All" : (STATUS_META[s]?.label ?? s)}
              selected={status === s}
              onPress={() => setStatus(s)}
              isDark={isDark}
              a11yLabel={`Filter by status: ${s}${status === s ? ", selected" : ""}`}
            />
          ))}
        </ScrollView>

        {/* ── WAREHOUSE FILTER ── */}
        <Text style={[styles.filterLabel, isDark && styles.filterLabelDark]} accessibilityRole="none">
          WAREHOUSE
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontal}
          accessibilityLabel="Filter by warehouse"
        >
          <Pill
            label="All"
            selected={warehouse === "all"}
            onPress={() => setWarehouse("all")}
            isDark={isDark}
            a11yLabel="Show all warehouses"
          />
          {warehouses.map((w) => (
            <Pill
              key={w._id}
              label={w.name}
              selected={warehouse === w._id}
              onPress={() => setWarehouse(w._id)}
              isDark={isDark}
              a11yLabel={`Filter by warehouse: ${w.name}${warehouse === w._id ? ", selected" : ""}`}
            />
          ))}
        </ScrollView>

        {/* ── CATEGORY FILTER ── */}
        {categories.length > 0 && (
          <>
            <Text style={[styles.filterLabel, isDark && styles.filterLabelDark]} accessibilityRole="none">
              CATEGORY
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontal}
              accessibilityLabel="Filter by product category"
            >
              <Pill
                label="All"
                selected={category === "all"}
                onPress={() => setCategory("all")}
                isDark={isDark}
                a11yLabel="Show all categories"
              />
              {categories.map((c) => (
                <Pill
                  key={c}
                  label={c}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                  isDark={isDark}
                  a11yLabel={`Filter by category: ${c}${category === c ? ", selected" : ""}`}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── ERROR BANNER ── */}
        {!!error && (
          <Pressable
            onPress={() => void load()}
            accessibilityRole="button"
            accessibilityLabel={`Error: ${error}. Tap to retry.`}
          >
            <View style={styles.errorBox} accessibilityRole={"alert" as any}>
              <Text style={styles.errorText}>⚠ {error}</Text>
              <Text style={styles.retryHint}>Tap to retry</Text>
            </View>
          </Pressable>
        )}

        <Text
          style={[styles.count, isDark && styles.countDark]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${visible.length} ${type}${visible.length === 1 ? "" : "s"} found`}
        >
          {visible.length} {type}
          {visible.length === 1 ? "" : "s"}
        </Text>

        {/* ── OPERATION CARDS ── */}
        {visible.map((op) => {
          const statusMeta = STATUS_META[op.status] ?? STATUS_META.draft;
          return (
            <View
              key={op._id}
              style={[
                styles.card,
                { backgroundColor: palette.panel, borderColor: palette.border },
                styles.glass,
              ]}
              accessibilityRole={"article" as any}
              accessibilityLabel={`${op.type} operation ${op._id.slice(-8).toUpperCase()}, status: ${statusMeta.label}, ${op.lines.length} product line${op.lines.length === 1 ? "" : "s"}`}
            >
              <View style={styles.cardHead}>
                <View>
                  <Text
                    style={[styles.reference, isDark && styles.referenceDark]}
                    numberOfLines={1}
                  >
                    {op._id.slice(-8).toUpperCase()}
                  </Text>
                  <Text style={[styles.meta, isDark && styles.metaDark]} numberOfLines={1}>
                    {op.supplier || new Date(op.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {/* Status badge: text label + color — not color alone */}
                <View style={[styles.badge, { backgroundColor: statusMeta.bg }]}>
                  <Text style={[styles.badgeText, { color: statusMeta.color }]}>
                    {statusMeta.label}
                  </Text>
                </View>
              </View>

              {op.lines.map((line, index) => (
                <Text
                  key={`${op._id}-${index}`}
                  style={[styles.line, isDark && styles.lineDark]}
                  numberOfLines={1}
                >
                  {typeof line.product === "object"
                    ? line.product.name
                    : "Product"}{" "}
                  · {line.quantity}
                </Text>
              ))}

              <Text style={[styles.warehouse, isDark && styles.warehouseDark]} numberOfLines={2}>
                {op.type === "transfer"
                  ? `From: ${warehouseName(op.fromWarehouse)} → To: ${warehouseName(op.toWarehouse)}`
                  : `Warehouse: ${warehouseName(op.type === "receipt" ? op.toWarehouse : op.fromWarehouse)}`}
              </Text>

              {/* Action buttons — disabled during pending actions */}
              {op.status === "draft" && (
                <Action
                  title="Mark waiting"
                  onPress={() => void transition(op, "waiting")}
                  isDark={isDark}
                  disabled={actionBusy}
                  a11yLabel="Move to waiting status"
                />
              )}
              {op.status === "waiting" && (
                <View style={styles.actions}>
                  <Action
                    title="Mark ready"
                    onPress={() => void transition(op, "ready")}
                    isDark={isDark}
                    disabled={actionBusy}
                    a11yLabel="Move to ready status"
                  />
                  <Action
                    title="Validate"
                    primary
                    onPress={() => void validate(op)}
                    isDark={isDark}
                    disabled={actionBusy}
                    a11yLabel="Validate this operation and update stock"
                  />
                </View>
              )}
              {op.status === "ready" && (
                <Action
                  title="Validate"
                  primary
                  onPress={() => void validate(op)}
                  isDark={isDark}
                  disabled={actionBusy}
                  a11yLabel="Validate this operation and update stock"
                />
              )}
            </View>
          );
        })}

        {/* ── EMPTY STATE ── */}
        {!visible.length && !busy && (
          <View
            style={[
              styles.empty,
              { backgroundColor: palette.panel, borderColor: palette.border },
              styles.glass,
            ]}
            accessibilityRole="none"
          >
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              {products.length === 0
                ? "No products yet"
                : warehouses.length === 0
                  ? "No warehouses yet"
                  : `No ${type}s found`}
            </Text>
            <Text style={[styles.sub, isDark && styles.subDark]}>
              {products.length === 0
                ? "Add products in the Products tab first."
                : warehouses.length === 0
                  ? "You need at least one warehouse to create operations."
                  : "Create a draft to begin."}
            </Text>
            <Pressable
              onPress={() => setModal(true)}
              style={styles.ctaButton}
              accessibilityRole="button"
              accessibilityLabel={`Create new ${typeLabel}`}
            >
              <Text style={styles.ctaText}>+ Create {type}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* ── CREATE MODAL ── */}
      <Modal
        visible={modal}
        transparent
        animationType="slide"
        onRequestClose={() => setModal(false)}
        // onRequestClose handles Android back button — prevents keyboard trap
        accessibilityViewIsModal
      >
        <View style={styles.shade}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: palette.panelStrong,
                borderColor: palette.border,
              },
              styles.glass,
            ]}
            accessibilityRole="none"
          >
            <View style={styles.sheetHead}>
              <Text
                style={[styles.sheetTitle, isDark && styles.sheetTitleDark]}
                accessibilityRole="header"
              >
                Create {typeLabel}
              </Text>
              <Pressable
                onPress={() => setModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
                style={styles.closeButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.close}>✕ Close</Text>
              </Pressable>
            </View>

            {!!error && (
              <View style={styles.errorBox} accessibilityRole={"alert" as any} accessibilityLiveRegion="assertive">
                <Text style={styles.errorText}>⚠ {error}</Text>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Type picker */}
              <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                OPERATION TYPE
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontal}
                accessibilityLabel="Select operation type"
              >
                {types.map((t) => (
                  <Pill
                    key={t}
                    label={t[0].toUpperCase() + t.slice(1)}
                    selected={type === t}
                    onPress={() => setSelectedType(t)}
                    isDark={isDark}
                    a11yLabel={`Select operation type: ${t}${type === t ? ", selected" : ""}`}
                  />
                ))}
              </ScrollView>

              {/* Product picker — empty state */}
              <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                PRODUCT
              </Text>
              {products.length === 0 ? (
                <Text style={[styles.emptyHint, isDark && styles.emptyHintDark]}>
                  No products available. Add products in the Products tab first.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontal}
                  accessibilityLabel="Select product"
                >
                  {products.map((p) => (
                    <Pill
                      key={p._id}
                      label={p.name}
                      selected={product === p._id}
                      onPress={() => setProduct(p._id)}
                      isDark={isDark}
                      a11yLabel={`Select product: ${p.name}${product === p._id ? ", selected" : ""}`}
                    />
                  ))}
                </ScrollView>
              )}

              {/* Quantity */}
              <Text
                style={[styles.formLabel, isDark && styles.formLabelDark]}
                nativeID="qty-label"
              >
                {type === "adjustment" ? "COUNTED QUANTITY" : "QUANTITY"}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                  },
                  isDark && styles.inputDark,
                ]}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                placeholder="Enter quantity"
                placeholderTextColor={isDark ? "#adc8de" : "#9ba69e"}
                accessibilityLabel={type === "adjustment" ? "Counted quantity" : "Quantity"}
                accessibilityHint={type === "adjustment" ? "Enter the physical count of items" : "Enter how many units to move"}
              />

              {/* Supplier (receipt only) */}
              {type === "receipt" && (
                <>
                  <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                    SUPPLIER (optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                      },
                      isDark && styles.inputDark,
                    ]}
                    value={supplier}
                    onChangeText={setSupplier}
                    placeholder="Supplier name"
                    placeholderTextColor={isDark ? "#adc8de" : "#9ba69e"}
                    accessibilityLabel="Supplier name, optional"
                  />
                </>
              )}

              {/* From warehouse */}
              {type !== "receipt" && (
                <>
                  <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                    {type === "transfer" ? "FROM WAREHOUSE" : "WAREHOUSE"}
                  </Text>
                  {warehouses.length === 0 ? (
                    <Text style={[styles.emptyHint, isDark && styles.emptyHintDark]}>
                      No warehouses available yet.
                    </Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontal}
                      accessibilityLabel={type === "transfer" ? "Select source warehouse" : "Select warehouse"}
                    >
                      {warehouses.map((w) => (
                        <Pill
                          key={w._id}
                          label={w.name}
                          selected={from === w._id}
                          onPress={() => setFrom(w._id)}
                          isDark={isDark}
                          a11yLabel={`${type === "transfer" ? "From warehouse" : "Warehouse"}: ${w.name}${from === w._id ? ", selected" : ""}`}
                        />
                      ))}
                    </ScrollView>
                  )}
                </>
              )}

              {/* To warehouse */}
              {(type === "receipt" || type === "transfer") && (
                <>
                  <Text style={[styles.formLabel, isDark && styles.formLabelDark]}>
                    TO WAREHOUSE
                  </Text>
                  {warehouses.length === 0 ? (
                    <Text style={[styles.emptyHint, isDark && styles.emptyHintDark]}>
                      No warehouses available yet.
                    </Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.horizontal}
                      accessibilityLabel="Select destination warehouse"
                    >
                      {warehouses.map((w) => (
                        <Pill
                          key={w._id}
                          label={w.name}
                          selected={to === w._id}
                          onPress={() => setTo(w._id)}
                          isDark={isDark}
                          a11yLabel={`Destination warehouse: ${w.name}${to === w._id ? ", selected" : ""}`}
                        />
                      ))}
                    </ScrollView>
                  )}
                </>
              )}

              <Pressable
                onPress={() => void create()}
                disabled={actionBusy}
                style={({ pressed }) => [
                  styles.sheetButton,
                  pressed && styles.sheetButtonPressed,
                  actionBusy && styles.disabledButton,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Create ${typeLabel}`}
                accessibilityState={{ disabled: actionBusy, busy: actionBusy }}
              >
                {actionBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sheetButtonText}>Create {typeLabel}</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function warehouseName(w: Operation["fromWarehouse"]) {
  return w && typeof w === "object" ? w.name : "—";
}

// ─── PILL ─────────────────────────────────────────────────────────────────────
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
      style={[
        styles.pill,
        selected && styles.pillSelected,
        isDark && styles.pillDark,
      ]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ selected }}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.pillText,
          selected && styles.pillTextSelected,
          isDark && styles.pillTextDark,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── ACTION BUTTON ────────────────────────────────────────────────────────────
function Action({
  title,
  onPress,
  primary,
  isDark,
  disabled,
  a11yLabel,
}: {
  title: string;
  onPress: () => void;
  primary?: boolean;
  isDark: boolean;
  disabled?: boolean;
  a11yLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.action,
        primary && styles.actionPrimary,
        isDark && styles.actionDark,
        disabled && styles.actionDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? title}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#edf4fb" },
  safeDark: { backgroundColor: "#071722" },
  glass: {
    borderWidth: 1,
    borderRadius: 28,
    shadowColor: "#0f2135",
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  content: {
    padding: 18,
    paddingBottom: 34,
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginBottom: 16,
  },
  eyebrow: {
    color: "#4a6175",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  eyebrowDark: { color: "#b9d8f4" },
  title: { color: "#122331", fontSize: 28, fontWeight: "800", marginTop: 4 },
  titleDark: { color: "#edf7ff" },
  sub: { color: "#3d5567", fontSize: 12, marginTop: 4 }, // ≥ 4.5:1
  subDark: { color: "#bfd6ea" },
  add: {
    backgroundColor: "#1a6647",
    borderWidth: 1,
    borderColor: "rgba(35,118,79,0.50)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  addPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  addText: { color: "#ffffff", fontWeight: "800", fontSize: 12 },
  horizontal: { gap: 8, paddingBottom: 4, paddingRight: 10 },
  pill: {
    maxWidth: 190,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.52)",
  },
  pillDark: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(15,27,38,0.42)",
  },
  pillSelected: {
    backgroundColor: "rgba(94,195,141,0.18)",
    borderColor: "rgba(94,195,141,0.40)",
  },
  pillText: {
    color: "#2e3d47", // ≥ 4.5:1
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  pillTextDark: { color: "#dfeeff" },
  pillTextSelected: { color: "#1a5a40", fontWeight: "800" },
  filterLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#4a6175", // ≥ 4.5:1
    marginTop: 16,
    marginBottom: 8,
  },
  filterLabelDark: { color: "#cfe4f9" },
  count: {
    color: "#2e3d47",
    fontSize: 12,
    fontWeight: "700",
    marginVertical: 12,
  },
  countDark: { color: "#edf7ff" },

  // Error banner
  errorBox: {
    backgroundColor: "rgba(255,243,241,0.92)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#a94d42",
  },
  errorText: { color: "#7a1f1a", fontSize: 12, fontWeight: "600" },
  retryHint: { color: "#1a6647", fontSize: 11, marginTop: 4, fontWeight: "700" },

  // Operation card
  card: { padding: 14, borderRadius: 20, marginBottom: 10 },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reference: { color: "#253040", fontSize: 11, fontWeight: "800" },
  referenceDark: { color: "#edf7ff" },
  meta: { color: "#4a6175", fontSize: 10, marginTop: 4 }, // ≥ 4.5:1
  metaDark: { color: "#cfe4f9" },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    overflow: "hidden",
  },
  badgeText: { fontSize: 10, fontWeight: "800", textTransform: "capitalize" },
  line: { color: "#253040", fontSize: 12, fontWeight: "700", marginTop: 13 },
  lineDark: { color: "#edf7ff" },
  warehouse: { color: "#4a6175", fontSize: 10, marginTop: 8 }, // ≥ 4.5:1
  warehouseDark: { color: "#dfeeff" },
  actions: { flexDirection: "row", gap: 8, marginTop: 13 },
  action: {
    marginTop: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
    backgroundColor: "rgba(255,255,255,0.36)",
    minHeight: 44,
    justifyContent: "center",
  },
  actionDark: { backgroundColor: "rgba(17,29,41,0.34)" },
  actionPrimary: {
    backgroundColor: "#1a6647",
    borderColor: "rgba(35,118,79,0.50)",
  },
  actionDisabled: { opacity: 0.5 },
  actionText: { color: "#12304a", fontWeight: "800", fontSize: 12 },
  actionTextPrimary: { color: "#ffffff" },

  // Empty state
  empty: {
    alignItems: "center",
    borderRadius: 16,
    padding: 23,
    marginTop: 5,
    borderWidth: 1,
  },
  emptyTitle: {
    color: "#1f2f3a",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyTitleDark: { color: "#edf7ff" },
  emptyHint: { color: "#4a6175", fontSize: 11, marginBottom: 8, fontStyle: "italic" },
  emptyHintDark: { color: "#bfd7eb" },
  ctaButton: {
    marginTop: 14,
    backgroundColor: "#1a6647",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Modal
  shade: {
    flex: 1,
    backgroundColor: "rgba(5, 12, 18, 0.50)",
    justifyContent: "flex-end",
  },
  sheet: { margin: 14, borderRadius: 28, padding: 16, borderWidth: 1, maxHeight: "90%" },
  sheetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sheetTitle: { color: "#163042", fontSize: 18, fontWeight: "800" },
  sheetTitleDark: { color: "#edf7ff" },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  close: { color: "#1a6647", fontWeight: "700", fontSize: 13 },
  formLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "#4a6175",
    marginTop: 14,
    marginBottom: 8,
  },
  formLabelDark: { color: "#dfeeff" },
  input: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    color: "#17314a",
    fontSize: 13,
    marginBottom: 4,
  },
  inputDark: { color: "#edf7ff" },
  sheetButton: {
    marginTop: 20,
    backgroundColor: "#1a6647",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(35,118,79,0.50)",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginBottom: 8,
  },
  sheetButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  disabledButton: { opacity: 0.55 },
  sheetButtonText: { color: "#ffffff", fontWeight: "800", fontSize: 14 },
});
