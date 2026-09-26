import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const tokenKey = 'stocksense.token';
const userKey = 'stocksense.user';
const apiBase = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
let unauthorizedHandler: (() => void) | undefined;

export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
  return () => { unauthorizedHandler = undefined; };
}

export async function saveToken(token: string | null) {
  if (Platform.OS === 'web') {
    if (token) localStorage.setItem(tokenKey, token);
    else localStorage.removeItem(tokenKey);
  } else if (token) await SecureStore.setItemAsync(tokenKey, token);
  else await SecureStore.deleteItemAsync(tokenKey);
}

export async function getToken() {
  return Platform.OS === 'web' ? localStorage.getItem(tokenKey) : SecureStore.getItemAsync(tokenKey);
}

export type SessionUser = { id: string; name: string; email: string };
export async function saveUser(user: SessionUser | null) {
  const value = user ? JSON.stringify(user) : null;
  if (Platform.OS === 'web') {
    if (value) localStorage.setItem(userKey, value);
    else localStorage.removeItem(userKey);
  } else if (value) await SecureStore.setItemAsync(userKey, value);
  else await SecureStore.deleteItemAsync(userKey);
}
export async function getUser(): Promise<SessionUser | null> {
  const value = Platform.OS === 'web' ? localStorage.getItem(userKey) : await SecureStore.getItemAsync(userKey);
  if (!value) return null;
  try { return JSON.parse(value) as SessionUser; } catch { return null; }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${apiBase}/api${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401) {
    await Promise.all([saveToken(null), saveUser(null)]);
    unauthorizedHandler?.();
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export type Warehouse = { _id: string; name: string; code: string };
export type Product = { _id: string; name: string; sku: string; category: string; unit: string; reorderThreshold: number; stock: { warehouse: Warehouse | string; quantity: number }[] };
export type OperationType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';
export type Operation = { _id: string; type: OperationType; status: string; supplier?: string; fromWarehouse?: Warehouse | string; toWarehouse?: Warehouse | string; lines: { product: Product | string; quantity: number }[]; createdAt: string };
export type Kpis = { totalProducts: number; lowStock: number; outOfStock: number; pendingReceipts: number; pendingDeliveries: number; scheduledTransfers: number };
export type Movement = { _id: string; operationType: OperationType; quantityDelta: number; product: Product; fromWarehouse?: Warehouse; toWarehouse?: Warehouse; createdAt: string };
