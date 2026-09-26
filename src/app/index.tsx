import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { api, Kpis, Operation, Warehouse } from '@/lib/api';
import { useAuth } from '@/context/auth';

const green = '#23764f';
const types = ['receipt', 'delivery', 'transfer', 'adjustment'] as const;

export default function HomeScreen() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signOut, user } = useAuth();
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [summary, rows, locations] = await Promise.all([api<Kpis>('/dashboard/kpis'), api<Operation[]>('/operations'), api<Warehouse[]>('/warehouses')]);
      setKpis(summary); setOperations(rows.slice(0, 6)); setWarehouses(locations);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load dashboard'); }
    finally { setLoading(false); }
  }, []);
  // Async fetch on mount; state updates happen after the network response.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const profile = () => Alert.alert('My Profile', `${user?.name ?? 'StockSense user'}\n${user?.email ?? ''}`, [{ text: 'Close' }, { text: 'Log out', style: 'destructive', onPress: () => { void signOut(); } }]);
  const cards = [
    { label: 'Products', value: kpis?.totalProducts ?? '—', note: 'In your catalog', tint: '#eef4ff', color: '#5678b2' },
    { label: 'Low / out of stock', value: kpis ? `${kpis.lowStock} / ${kpis.outOfStock}` : '—', note: 'Needs attention', tint: '#fff4e7', color: '#bd7e32' },
    { label: 'Pending receipts', value: kpis?.pendingReceipts ?? '—', note: 'Awaiting validation', tint: '#eaf4ed', color: green },
    { label: 'Deliveries / transfers', value: kpis ? `${kpis.pendingDeliveries} / ${kpis.scheduledTransfers}` : '—', note: 'Scheduled moves', tint: '#f3eef8', color: '#80649b' },
  ];
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={green} />}>
      <View style={styles.header}><View><Text style={styles.kicker}>INVENTORY OVERVIEW</Text><Text style={styles.heading}>Good morning</Text><Text style={styles.subtitle}>Here’s what’s happening today.</Text></View><Pressable style={styles.profile} onPress={profile}><Text style={styles.profileText}>S</Text></Pressable></View>
      {!!error && <Pressable onPress={() => void load()}><Text style={styles.error}>{error} · Tap to retry</Text></Pressable>}
      <View style={styles.grid}>{cards.map((card) => <View key={card.label} style={styles.kpi}><View style={[styles.kpiDot, { backgroundColor: card.tint }]}><Text style={{ color: card.color, fontWeight: '800' }}>•</Text></View><Text style={styles.kpiLabel}>{card.label}</Text><Text style={styles.kpiValue}>{card.value}</Text><Text style={styles.kpiNote}>{card.note}</Text></View>)}</View>
      <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Quick actions</Text><Text style={styles.sectionHint}>Move stock between warehouses</Text></View></View>
      <View style={styles.quickGrid}>{types.map((type) => <Pressable key={type} style={styles.quickButton} onPress={() => router.push({ pathname: '/operations', params: { type } })}><Text style={styles.quickIcon}>{type === 'receipt' ? '↓' : type === 'delivery' ? '↑' : type === 'transfer' ? '⇄' : '±'}</Text><Text style={styles.quickLabel}>{type[0].toUpperCase() + type.slice(1)}</Text></Pressable>)}</View>
      <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Recent operations</Text><Text style={styles.sectionHint}>{warehouses.length} warehouses connected</Text></View><Link href="/operations" style={styles.viewAll}>View all</Link></View>
      <View style={styles.list}>{operations.length ? operations.map((op) => <OperationRow key={op._id} operation={op} />) : <Text style={styles.empty}>{loading ? 'Loading activity…' : 'No operations yet. Create a receipt to get started.'}</Text>}</View>
    </ScrollView>
  </SafeAreaView>;
}

function OperationRow({ operation }: { operation: Operation }) {
  const warehouse = operation.toWarehouse || operation.fromWarehouse;
  const place = warehouse && typeof warehouse === 'object' ? warehouse.name : 'Warehouse';
  return <View style={styles.row}><View style={styles.rowIcon}><Text style={styles.rowIconText}>{operation.type[0].toUpperCase()}</Text></View><View style={styles.rowMain}><Text style={styles.rowTitle}>{operation.type[0].toUpperCase() + operation.type.slice(1)} · {operation.lines.length} line{operation.lines.length === 1 ? '' : 's'}</Text><Text style={styles.rowHint}>{place} · {new Date(operation.createdAt).toLocaleDateString()}</Text></View><Text style={[styles.badge, operation.status === 'done' ? styles.done : styles.pending]}>{operation.status}</Text></View>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#f5f7f6' }, content: { padding: 20, paddingBottom: 36, maxWidth: 720, width: '100%', alignSelf: 'center' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7, marginBottom: 22 }, kicker: { color: '#93a098', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 }, heading: { color: '#1b2821', fontWeight: '800', fontSize: 28, marginTop: 5 }, subtitle: { color: '#8b968f', fontSize: 13, marginTop: 5 }, profile: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#e4efe7', alignItems: 'center', justifyContent: 'center' }, profileText: { color: green, fontSize: 16, fontWeight: '800' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, kpi: { flexBasis: '48%', flexGrow: 1, minHeight: 134, borderRadius: 15, backgroundColor: '#fff', padding: 14, borderWidth: 1, borderColor: '#edf0ed' }, kpiDot: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, kpiLabel: { color: '#718078', fontSize: 11, fontWeight: '600' }, kpiValue: { color: '#202c25', fontSize: 25, fontWeight: '800', marginTop: 4 }, kpiNote: { color: '#a0aaa3', fontSize: 10, marginTop: 3 }, sectionHeader: { marginTop: 25, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { color: '#26332b', fontSize: 16, fontWeight: '800' }, sectionHint: { color: '#99a39d', fontSize: 11, marginTop: 4 }, quickGrid: { flexDirection: 'row', gap: 8 }, quickButton: { flex: 1, alignItems: 'center', paddingVertical: 13, backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: '#edf0ed' }, quickIcon: { color: green, fontSize: 22, fontWeight: '700' }, quickLabel: { color: '#59665e', fontSize: 10, fontWeight: '700', marginTop: 6 }, viewAll: { color: green, fontSize: 11, fontWeight: '700' }, list: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 13, borderWidth: 1, borderColor: '#edf0ed' }, row: { minHeight: 67, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e9edea', gap: 10 }, rowIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#eef5f0', alignItems: 'center', justifyContent: 'center' }, rowIconText: { color: green, fontWeight: '800' }, rowMain: { flex: 1 }, rowTitle: { color: '#39463f', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }, rowHint: { color: '#98a29c', fontSize: 10, marginTop: 4 }, badge: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99, fontSize: 9, fontWeight: '800', textTransform: 'capitalize' }, done: { backgroundColor: '#e9f4ec', color: '#48815d' }, pending: { backgroundColor: '#fff4e5', color: '#ae7b36' }, empty: { color: '#929d96', paddingVertical: 26, textAlign: 'center', fontSize: 12 }, error: { color: '#a94d42', backgroundColor: '#fff3f1', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12 } });
