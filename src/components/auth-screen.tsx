import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, SessionUser } from '@/lib/api';
import { useAuth } from '@/context/auth';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';
const green = '#23764f';

export function AuthScreen() {
  const { signIn } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); const [otp, setOtp] = useState('');
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(''); setMessage(''); setBusy(true);
    try {
      if (mode === 'forgot') {
        const result = await api<{ demoOtp: string }>('/auth/reset/request', { method: 'POST', body: JSON.stringify({ email }) });
        setOtp(result.demoOtp); setMessage(`Demo OTP: ${result.demoOtp}`); setMode('reset');
      } else if (mode === 'reset') {
        await api('/auth/reset/confirm', { method: 'POST', body: JSON.stringify({ email, otp, newPassword: password }) });
        setPassword(''); setOtp(''); setMode('login'); setMessage('Password updated. Sign in with your new password.');
      } else {
        const body = mode === 'signup' ? { name, email, password } : { email, password };
        const result = await api<{ token: string; user: SessionUser }>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) });
        await signIn(result.token, result.user);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to continue. Try again.'); }
    finally { setBusy(false); }
  };
  const title = mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : mode === 'forgot' ? 'Reset password' : 'Choose a new password';
  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}><View style={styles.brandIcon}><Text style={styles.brandIconText}>S</Text></View><View><Text style={styles.brandName}>StockSense</Text><Text style={styles.brandCaption}>INVENTORY CONTROL</Text></View></View>
        <Text style={styles.eyebrow}>YOUR OPERATIONS, IN SYNC</Text><Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{mode === 'login' ? 'Sign in to manage your inventory.' : mode === 'signup' ? 'Set up your StockSense workspace.' : 'We’ll help you get back into your account.'}</Text>
        <View style={styles.form}>
          {mode === 'signup' && <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />}
          {mode !== 'reset' && <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@company.com" keyboardType="email-address" autoCapitalize="none" />}
          {mode === 'reset' && <Field label="6-digit OTP" value={otp} onChangeText={setOtp} placeholder="000000" keyboardType="number-pad" />}
          {mode !== 'forgot' && <Field label={mode === 'reset' ? 'New password' : 'Password'} value={password} onChangeText={setPassword} placeholder={mode === 'reset' ? 'At least 8 characters' : 'Enter your password'} secureTextEntry />}
          {!!error && <Text style={styles.error}>{error}</Text>}{!!message && <Text style={styles.notice}>{message}</Text>}
          <Pressable disabled={busy} style={({ pressed }) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]} onPress={submit}>
            {busy ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryText}>{mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'forgot' ? 'Send demo OTP' : 'Update password'}</Text>}
          </Pressable>
        </View>
        <View style={styles.links}>{mode === 'login' ? <><Pressable onPress={() => { setMode('forgot'); setError(''); setMessage(''); }}><Text style={styles.link}>Forgot password?</Text></Pressable><Text style={styles.linkRow}>New to StockSense? <Text style={styles.link} onPress={() => { setMode('signup'); setError(''); setMessage(''); }}>Create account</Text></Text></> : <Text style={styles.link} onPress={() => { setMode('login'); setError(''); setMessage(''); }}>← Back to sign in</Text>}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; secureTextEntry?: boolean; keyboardType?: 'email-address' | 'number-pad'; autoCapitalize?: 'none' | 'words' }) {
  return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor="#9ba69e" secureTextEntry={props.secureTextEntry} keyboardType={props.keyboardType} autoCapitalize={props.autoCapitalize} autoCorrect={false} style={styles.input}/></View>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#f4f7f5' }, flex: { flex: 1 }, wrap: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 25, paddingVertical: 30, maxWidth: 520, width: '100%', alignSelf: 'center' }, brand: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 38 }, brandIcon: { height: 42, width: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: green }, brandIconText: { color: '#fff', fontSize: 20, fontWeight: '800' }, brandName: { color: '#1c2922', fontSize: 17, fontWeight: '800' }, brandCaption: { color: '#97a29b', fontSize: 9, letterSpacing: 1.2, marginTop: 3, fontWeight: '700' }, eyebrow: { color: '#93a098', fontSize: 10, letterSpacing: 1.4, fontWeight: '700', marginBottom: 9 }, title: { fontSize: 27, fontWeight: '800', color: '#1b2821' }, subtitle: { color: '#88948c', fontSize: 13, marginTop: 8, marginBottom: 25 }, form: { gap: 14 }, field: { gap: 7 }, label: { fontSize: 12, fontWeight: '700', color: '#57645c' }, input: { height: 48, borderWidth: 1, borderColor: '#dfe7e1', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 13, color: '#1c2922', fontSize: 14 }, primary: { backgroundColor: green, borderRadius: 10, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 }, primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 }, pressed: { opacity: 0.85 }, disabled: { opacity: 0.65 }, error: { color: '#ad4d43', fontSize: 12 }, notice: { backgroundColor: '#e8f3eb', color: '#36754d', padding: 10, borderRadius: 8, fontSize: 12 }, links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }, linkRow: { color: '#89958d', fontSize: 11 }, link: { color: green, fontWeight: '700', fontSize: 12 } });
