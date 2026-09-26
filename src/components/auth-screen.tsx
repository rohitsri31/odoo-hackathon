import { useAuth } from "@/context/auth";
import { api, SessionUser } from "@/lib/api";
import { glassTheme } from "@/styles/glass";
import { useState, useRef } from "react";
import {
    AccessibilityInfo,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
    AccessibilityRole,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mode = "login" | "signup" | "forgot" | "reset";
const green = "#23764f";
// Minimum password length (must match server rule in auth.routes.ts)
const MIN_PASSWORD_LENGTH = 8;

export function AuthScreen() {
  const { signIn } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const palette = isDark ? glassTheme.dark : glassTheme.light;
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  // ref for the live-region so screen readers announce errors/messages
  const liveRef = useRef<View>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setMessage("");
  };

  // Client-side validation before hitting the network
  const validate = (): string | null => {
    if (mode === "signup" && !name.trim()) return "Full name is required.";
    if (mode !== "reset" && !email.trim()) return "Email address is required.";
    if (mode !== "reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }
    if (mode === "reset" && !otp.trim()) return "Please enter the OTP code.";
    if ((mode === "login" || mode === "signup" || mode === "reset") && !password) {
      return "Password is required.";
    }
    if (mode === "signup" && password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (mode === "reset" && password.length < MIN_PASSWORD_LENGTH) {
      return `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return null;
  };

  const submit = async () => {
    setError("");
    setMessage("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      // Announce error to screen readers
      AccessibilityInfo.announceForAccessibility(validationError);
      return;
    }

    setBusy(true);
    try {
      if (mode === "forgot") {
        const result = await api<{ demoOtp: string }>("/auth/reset/request", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        setOtp(result.demoOtp ?? "");
        const msg = `Demo OTP: ${result.demoOtp}. Enter it to set a new password.`;
        setMessage(msg);
        AccessibilityInfo.announceForAccessibility(msg);
        setMode("reset");
      } else if (mode === "reset") {
        await api("/auth/reset/confirm", {
          method: "POST",
          body: JSON.stringify({ email, otp, newPassword: password }),
        });
        setPassword("");
        setOtp("");
        setMode("login");
        const msg = "Password updated. Sign in with your new password.";
        setMessage(msg);
        AccessibilityInfo.announceForAccessibility(msg);
      } else {
        const body =
          mode === "signup" ? { name, email, password } : { email, password };
        const result = await api<{ token: string; user: SessionUser }>(
          `/auth/${mode}`,
          { method: "POST", body: JSON.stringify(body) },
        );
        await signIn(result.token, result.user);
      }
    } catch (cause) {
      const msg =
        cause instanceof Error ? cause.message : "Unable to continue. Try again.";
      setError(msg);
      AccessibilityInfo.announceForAccessibility(`Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "login"
      ? "Welcome back"
      : mode === "signup"
        ? "Create your account"
        : mode === "forgot"
          ? "Reset password"
          : "Choose a new password";

  const submitLabel =
    mode === "login"
      ? "Sign in"
      : mode === "signup"
        ? "Create account"
        : mode === "forgot"
          ? "Send demo OTP"
          : "Update password";

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.wrap}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.panelStrong,
                borderColor: palette.border,
              },
              styles.glass,
            ]}
            // Give the card a region role so screen readers know it's a form
            accessibilityRole="none"
          >
            {/* Brand */}
            <View style={styles.brand} accessibilityRole="header">
              <View style={styles.brandIcon} accessibilityElementsHidden>
                <Text style={styles.brandIconText}>S</Text>
              </View>
              <View>
                <Text style={[styles.brandName, isDark && styles.brandNameDark]}>
                  StockSense
                </Text>
                <Text
                  style={[
                    styles.brandCaption,
                    isDark && styles.brandCaptionDark,
                  ]}
                >
                  INVENTORY CONTROL
                </Text>
              </View>
            </View>

            <Text style={[styles.eyebrow, isDark && styles.eyebrowDark]} accessibilityElementsHidden>
              YOUR OPERATIONS, IN SYNC
            </Text>
            <Text
              style={[styles.title, isDark && styles.titleDark]}
              accessibilityRole="header"
            >
              {title}
            </Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {mode === "login"
                ? "Sign in to manage your inventory."
                : mode === "signup"
                  ? "Set up your StockSense workspace."
                  : "We'll help you get back into your account."}
            </Text>

            {/* Live region for errors and success messages */}
            <View
              ref={liveRef}
              accessible
              accessibilityLiveRegion="polite"
              accessibilityRole={"status" as AccessibilityRole}
            >
              {!!error && (
                <View style={styles.errorBox} accessibilityRole={"alert" as AccessibilityRole}>
                  <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
              )}
              {!!message && (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>✓ {message}</Text>
                </View>
              )}
            </View>

            <View style={styles.form}>
              {mode === "signup" && (
                <Field
                  dark={isDark}
                  label="Full name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              )}
              {mode !== "reset" && (
                <Field
                  dark={isDark}
                  label="Email address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@company.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
              )}
              {mode === "reset" && (
                <Field
                  dark={isDark}
                  label="6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="000000"
                  keyboardType="number-pad"
                  returnKeyType="next"
                />
              )}
              {mode !== "forgot" && (
                <Field
                  dark={isDark}
                  label={mode === "reset" ? "New password" : "Password"}
                  hint={
                    (mode === "signup" || mode === "reset")
                      ? `Minimum ${MIN_PASSWORD_LENGTH} characters`
                      : undefined
                  }
                  value={password}
                  onChangeText={setPassword}
                  placeholder={
                    mode === "reset"
                      ? `At least ${MIN_PASSWORD_LENGTH} characters`
                      : "Enter your password"
                  }
                  secureTextEntry
                  autoComplete={mode === "login" ? "password" : "new-password"}
                  textContentType={mode === "login" ? "password" : "newPassword"}
                  returnKeyType="done"
                  onSubmitEditing={submit}
                />
              )}

              <Pressable
                disabled={busy}
                style={({ pressed }) => [
                  styles.primary,
                  pressed && styles.pressed,
                  busy && styles.disabled,
                ]}
                onPress={submit}
                accessibilityRole="button"
                accessibilityLabel={submitLabel}
                accessibilityState={{ disabled: busy, busy }}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" accessibilityLabel="Loading" />
                ) : (
                  <Text style={styles.primaryText}>{submitLabel}</Text>
                )}
              </Pressable>
            </View>

            <View style={styles.links}>
              {mode === "login" ? (
                <>
                  <Pressable
                    onPress={() => switchMode("forgot")}
                    accessibilityRole="button"
                    accessibilityLabel="Forgot password — go to password reset"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={styles.link}>Forgot password?</Text>
                  </Pressable>
                  <Text style={[styles.linkRow, isDark && styles.linkRowDark]}>
                    New to StockSense?{" "}
                    <Text
                      style={styles.link}
                      onPress={() => switchMode("signup")}
                      accessibilityRole="button"
                      accessibilityLabel="Create account"
                    >
                      Create account
                    </Text>
                  </Text>
                </>
              ) : (
                <Pressable
                  onPress={() => switchMode("login")}
                  accessibilityRole="button"
                  accessibilityLabel="Back to sign in"
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={styles.link}>← Back to sign in</Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── FIELD ────────────────────────────────────────────────────────────────────
function Field(props: {
  dark: boolean;
  label: string;
  hint?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "email-address" | "number-pad";
  autoCapitalize?: "none" | "words";
  autoComplete?: string;
  textContentType?: string;
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const hintId = props.hint ? `${props.label}-hint` : undefined;

  return (
    <View style={styles.field}>
      <Text
        style={[styles.label, props.dark && styles.labelDark]}
        accessibilityRole="none"
      >
        {props.label}
      </Text>
      {props.hint && (
        <Text
          nativeID={hintId}
          style={[styles.fieldHint, props.dark && styles.fieldHintDark]}
        >
          {props.hint}
        </Text>
      )}
      <TextInput
        ref={inputRef}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={props.dark ? "#adc8de" : "#9ba69e"}
        secureTextEntry={props.secureTextEntry}
        keyboardType={props.keyboardType}
        autoCapitalize={props.autoCapitalize ?? "none"}
        autoCorrect={false}
        autoComplete={props.autoComplete as any}
        textContentType={props.textContentType as any}
        returnKeyType={props.returnKeyType}
        onSubmitEditing={props.onSubmitEditing}
        accessibilityLabel={props.label}
        accessibilityHint={props.hint}
        style={[
          styles.input,
          {
            backgroundColor: props.dark
              ? "rgba(16,26,36,0.46)"
              : "rgba(255,255,255,0.46)",
            borderColor: props.dark
              ? "rgba(255,255,255,0.10)"
              : "rgba(255,255,255,0.34)",
          },
          props.dark && styles.inputDark,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#edf4fb" },
  safeDark: { backgroundColor: "#071722" },
  flex: { flex: 1 },
  wrap: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 30,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
  },
  glass: {
    borderWidth: 1,
    borderRadius: 32,
    shadowColor: "#102231",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  card: { padding: 20, borderWidth: 1, borderRadius: 32 },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  brandIcon: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(91,183,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  brandIconText: { color: green, fontSize: 20, fontWeight: "800" },
  brandName: { color: "#102331", fontSize: 18, fontWeight: "800" },
  brandNameDark: { color: "#edf7ff" },
  brandCaption: {
    color: "#6f8390",
    fontSize: 9,
    letterSpacing: 1.2,
    marginTop: 3,
    fontWeight: "700",
  },
  brandCaptionDark: { color: "#bfd6ea" },
  eyebrow: {
    color: "#697d8e",
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: "700",
    marginBottom: 9,
  },
  eyebrowDark: { color: "#b9d8f4" },
  title: { fontSize: 28, fontWeight: "800", color: "#102331" },
  titleDark: { color: "#edf7ff" },
  subtitle: { color: "#637a8b", fontSize: 13, marginTop: 8, marginBottom: 22 },
  subtitleDark: { color: "#bfd6ea" },
  form: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: "700", color: "#3d5265" }, // ↑ contrast #3d5265 on white ≥ 4.5:1
  labelDark: { color: "#d5e9ff" },
  fieldHint: { fontSize: 11, color: "#4a6175", marginBottom: 2 }, // darker for contrast
  fieldHintDark: { color: "#b5d0e8" },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    color: "#132b3b",
    fontSize: 14,
    // Focus ring handled by React Native's default focus indicator on mobile
  },
  inputDark: { color: "#edf7ff" },
  primary: {
    backgroundColor: "#1a6647", // solid green for sufficient contrast on glass bg
    borderRadius: 18,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(35,118,79,0.60)",
    // Minimum 44pt touch target — height is 52
  },
  primaryText: { color: "#ffffff", fontWeight: "800", fontSize: 14 },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.92 },
  disabled: { opacity: 0.55 },
  errorBox: {
    backgroundColor: "rgba(255,243,241,0.92)",
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#a94d42",
    marginBottom: 4,
  },
  errorText: {
    color: "#7a1f1a", // ≥ 4.5:1 contrast on the light error bg
    fontSize: 12,
    fontWeight: "600",
  },
  noticeBox: {
    backgroundColor: "rgba(94,195,141,0.18)",
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#2f6b4f",
    marginBottom: 4,
  },
  noticeText: {
    color: "#1a4a34", // ≥ 4.5:1 on notice bg
    fontSize: 12,
    fontWeight: "600",
  },
  links: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    flexWrap: "wrap",
    gap: 8,
  },
  linkRow: { color: "#4a5f6d", fontSize: 11, fontWeight: "600" }, // higher contrast
  linkRowDark: { color: "#dfeeff" },
  link: { color: green, fontWeight: "700", fontSize: 12 },
});
