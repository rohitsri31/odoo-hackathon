import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  background: '#0B0F14',
  card: '#131922',
  border: '#252D38',
  text: '#F5F7FA',
  muted: '#8B95A5',
  primary: '#5B8CFF',
  green: '#35C98A',
  red: '#FF5C67',
};

const products = [
  {
    name: 'Industrial Motor A',
    sku: 'MTR-001',
    category: 'Motors',
    stock: 4,
    reserved: 0,
  },
  {
    name: 'Copper Cable 10mm',
    sku: 'CBL-010',
    category: 'Electrical',
    stock: 86,
    reserved: 20,
  },
  {
    name: 'Steel Bearing',
    sku: 'BRG-205',
    category: 'Mechanical',
    stock: 42,
    reserved: 8,
  },
  {
    name: 'Control Panel X1',
    sku: 'CTL-101',
    category: 'Electronics',
    stock: 17,
    reserved: 5,
  },
];

export default function ProductsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.heading}>Products</Text>
        <Text style={styles.subtitle}>
          Inventory across all locations
        </Text>

        <View style={styles.searchBox}>
          <Text style={styles.searchText}>⌕  Search products or SKU</Text>
        </View>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>Total Products</Text>
            <Text style={styles.summaryValue}>128</Text>
          </View>

          <View>
            <Text style={styles.summaryLabel}>Low Stock</Text>
            <Text style={[styles.summaryValue, { color: COLORS.red }]}>
              08
            </Text>
          </View>
        </View>

        {products.map((product) => {
          const freeToUse = product.stock - product.reserved;
          const isLow = freeToUse <= 5;

          return (
            <View style={styles.productCard} key={product.sku}>
              <View style={styles.productTop}>
                <View style={styles.productIcon}>
                  <Text style={styles.productIconText}>
                    {product.name.charAt(0)}
                  </Text>
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productSku}>
                    {product.sku} · {product.category}
                  </Text>
                </View>

                <View
                  style={[
                    styles.stockBadge,
                    {
                      backgroundColor: isLow
                        ? '#FF5C6718'
                        : '#35C98A18',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stockBadgeText,
                      {
                        color: isLow
                          ? COLORS.red
                          : COLORS.green,
                      },
                    ]}
                  >
                    {isLow ? 'Low' : 'Healthy'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.stockRow}>
                <View>
                  <Text style={styles.stockLabel}>On Hand</Text>
                  <Text style={styles.stockValue}>
                    {product.stock} units
                  </Text>
                </View>

                <View>
                  <Text style={styles.stockLabel}>Reserved</Text>
                  <Text style={styles.stockValue}>
                    {product.reserved} units
                  </Text>
                </View>

                <View>
                  <Text style={styles.stockLabel}>Free to Use</Text>
                  <Text style={styles.stockValue}>
                    {freeToUse} units
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  heading: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 10,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
    marginBottom: 20,
  },

  searchBox: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,
    padding: 15,
    marginBottom: 16,
  },

  searchText: {
    color: COLORS.muted,
    fontSize: 13,
  },

  summary: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  summaryLabel: {
    color: COLORS.muted,
    fontSize: 11,
  },

  summaryValue: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },

  productCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginBottom: 12,
  },

  productTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  productIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#5B8CFF18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  productIconText: {
    color: COLORS.primary,
    fontSize: 17,
    fontWeight: '800',
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  productSku: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },

  stockBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },

  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  stockLabel: {
    color: COLORS.muted,
    fontSize: 9,
    marginBottom: 4,
  },

  stockValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
});