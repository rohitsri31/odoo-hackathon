import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  background: '#0B0F14',
  card: '#131922',
  cardLight: '#1A212C',
  border: '#252D38',
  text: '#F5F7FA',
  muted: '#8B95A5',
  primary: '#5B8CFF',
  green: '#35C98A',
  red: '#FF5C67',
  orange: '#FFB454',
};

export default function OperationsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.heading}>Operations</Text>
        <Text style={styles.subtitle}>
          Manage inventory movement
        </Text>

        {/* Operation actions */}
        <View style={styles.grid}>
          <OperationCard
            title="Receipts"
            description="Stock coming in"
            icon="↓"
            color={COLORS.green}
          />

          <OperationCard
            title="Deliveries"
            description="Stock going out"
            icon="↑"
            color={COLORS.orange}
          />

          <OperationCard
            title="Transfers"
            description="Move between locations"
            icon="↔"
            color={COLORS.primary}
          />

          <OperationCard
            title="Adjustments"
            description="Correct stock levels"
            icon="±"
            color={COLORS.red}
          />
        </View>

        {/* Status */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Operations</Text>
          <Text style={styles.date}>Today</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusItem}>
            <Text style={styles.statusNumber}>12</Text>
            <Text style={styles.statusLabel}>Receipts</Text>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusItem}>
            <Text style={styles.statusNumber}>06</Text>
            <Text style={styles.statusLabel}>Deliveries</Text>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusItem}>
            <Text style={styles.statusNumber}>04</Text>
            <Text style={styles.statusLabel}>Transfers</Text>
          </View>
        </View>

        {/* Recent operations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Operations</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <OperationRow
          reference="WH/IN/0012"
          title="Receipt"
          contact="ABC Suppliers"
          status="Done"
          statusColor={COLORS.green}
          date="Today, 10:42 AM"
        />

        <OperationRow
          reference="WH/OUT/0008"
          title="Delivery"
          contact="Production Unit"
          status="Ready"
          statusColor={COLORS.orange}
          date="Today, 10:15 AM"
        />

        <OperationRow
          reference="WH/INT/0005"
          title="Transfer"
          contact="Internal"
          status="Done"
          statusColor={COLORS.green}
          date="Today, 09:40 AM"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function OperationCard({
  title,
  description,
  icon,
  color,
}: {
  title: string;
  description: string;
  icon: string;
  color: string;
}) {
  return (
    <TouchableOpacity
      style={styles.operationCard}
      activeOpacity={0.75}
    >
      <View
        style={[
          styles.operationIcon,
          { backgroundColor: `${color}18` },
        ]}
      >
        <Text style={[styles.operationIconText, { color }]}>
          {icon}
        </Text>
      </View>

      <Text style={styles.operationTitle}>{title}</Text>

      <Text style={styles.operationDescription}>
        {description}
      </Text>

      <Text style={[styles.openArrow, { color }]}>→</Text>
    </TouchableOpacity>
  );
}

function OperationRow({
  reference,
  title,
  contact,
  status,
  statusColor,
  date,
}: {
  reference: string;
  title: string;
  contact: string;
  status: string;
  statusColor: string;
  date: string;
}) {
  return (
    <View style={styles.operationRow}>
      <View style={styles.rowLeft}>
        <Text style={styles.reference}>{reference}</Text>

        <Text style={styles.rowTitle}>
          {title} · {contact}
        </Text>

        <Text style={styles.rowDate}>{date}</Text>
      </View>

      <View
        style={[
          styles.statusBadge,
          { backgroundColor: `${statusColor}18` },
        ]}
      >
        <Text style={[styles.statusText, { color: statusColor }]}>
          {status}
        </Text>
      </View>
    </View>
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
    marginBottom: 22,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  operationCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },

  operationIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  operationIconText: {
    fontSize: 20,
    fontWeight: '800',
  },

  operationTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },

  operationDescription: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
    lineHeight: 15,
  },

  openArrow: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 13,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },

  date: {
    color: COLORS.muted,
    fontSize: 12,
  },

  viewAll: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 18,
  },

  statusItem: {
    alignItems: 'center',
    flex: 1,
  },

  statusNumber: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },

  statusLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  statusDivider: {
    width: 1,
    height: 35,
    backgroundColor: COLORS.border,
  },

  operationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 9,
  },

  rowLeft: {
    flex: 1,
  },

  reference: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },

  rowTitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  rowDate: {
    color: '#606A79',
    fontSize: 9,
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },

  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
});