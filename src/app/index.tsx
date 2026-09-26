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

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.title}>StockSense</Text>
          </View>

          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileText}>A</Text>
          </TouchableOpacity>
        </View>

        {/* Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.date}>Today</Text>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <KpiCard
            title="Total Products"
            value="128"
            subtitle="Across all locations"
            icon="▦"
          />

          <KpiCard
            title="Low Stock"
            value="08"
            subtitle="Needs attention"
            icon="!"
            accent={COLORS.red}
          />

          <KpiCard
            title="Receipts"
            value="12"
            subtitle="Pending"
            icon="↓"
            accent={COLORS.green}
          />

          <KpiCard
            title="Deliveries"
            value="06"
            subtitle="Pending"
            icon="↑"
            accent={COLORS.orange}
          />
        </View>

        {/* Stock Health */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stock Health</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <View>
              <Text style={styles.productName}>Industrial Motor A</Text>
              <Text style={styles.location}>Production Rack</Text>
            </View>

            <View style={styles.criticalBadge}>
              <Text style={styles.criticalText}>Critical</Text>
            </View>
          </View>

          <View style={styles.healthStats}>
            <View>
              <Text style={styles.statLabel}>Free to Use</Text>
              <Text style={styles.statValue}>4 units</Text>
            </View>

            <View>
              <Text style={styles.statLabel}>Reorder Point</Text>
              <Text style={styles.statValue}>10 units</Text>
            </View>

            <View>
              <Text style={styles.statLabel}>Days Cover</Text>
              <Text style={styles.statValue}>3 days</Text>
            </View>
          </View>

          <View style={styles.progressBackground}>
            <View style={styles.progressCritical} />
          </View>

          <Text style={styles.reason}>
            Stock is below the reorder point and has only 3 days of estimated
            coverage.
          </Text>
        </View>

        {/* Transfer Recommendation */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Smart Transfer</Text>
          <Text style={styles.aiLabel}>INTELLIGENCE</Text>
        </View>

        <View style={styles.transferCard}>
          <View style={styles.transferTop}>
            <View style={styles.transferIcon}>
              <Text style={styles.transferIconText}>↔</Text>
            </View>

            <View style={styles.transferInfo}>
              <Text style={styles.transferTitle}>Move 20 units</Text>
              <Text style={styles.productName}>Industrial Motor A</Text>
            </View>
          </View>

          <View style={styles.route}>
            <View>
              <Text style={styles.routeLabel}>FROM</Text>
              <Text style={styles.routeValue}>Storage Rack</Text>
            </View>

            <Text style={styles.arrow}>→</Text>

            <View>
              <Text style={styles.routeLabel}>TO</Text>
              <Text style={styles.routeValue}>Production Rack</Text>
            </View>
          </View>

          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Why this transfer?</Text>
            <Text style={styles.recommendationText}>
              Storage Rack has surplus stock while Production Rack is below
              its reorder point.
            </Text>
          </View>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Review Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <Activity
          reference="WH/IN/0012"
          description="Receipt completed"
          time="10 min ago"
          amount="+50 units"
          positive
        />

        <Activity
          reference="WH/OUT/0008"
          description="Delivery completed"
          time="42 min ago"
          amount="-12 units"
        />

        <Activity
          reference="WH/INT/0005"
          description="Internal transfer"
          time="1 hr ago"
          amount="20 units"
          positive
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent = COLORS.primary,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  accent?: string;
}) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: `${accent}20` }]}>
        <Text style={[styles.kpiIconText, { color: accent }]}>{icon}</Text>
      </View>

      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiSubtitle}>{subtitle}</Text>
    </View>
  );
}

function Activity({
  reference,
  description,
  time,
  amount,
  positive = false,
}: {
  reference: string;
  description: string;
  time: string;
  amount: string;
  positive?: boolean;
}) {
  return (
    <View style={styles.activity}>
      <View
        style={[
          styles.activityDot,
          { backgroundColor: positive ? COLORS.green : COLORS.red },
        ]}
      />

      <View style={styles.activityInfo}>
        <Text style={styles.activityReference}>{reference}</Text>
        <Text style={styles.activityDescription}>{description}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>

      <Text
        style={[
          styles.activityAmount,
          { color: positive ? COLORS.green : COLORS.red },
        ]}
      >
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 28,
  },

  greeting: {
    color: COLORS.muted,
    fontSize: 14,
    marginBottom: 4,
  },

  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 8,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '700',
  },

  date: {
    color: COLORS.muted,
    fontSize: 13,
  },

  viewAll: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  kpiCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  kpiIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  kpiIconText: {
    fontSize: 16,
    fontWeight: '800',
  },

  kpiTitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 5,
  },

  kpiValue: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },

  kpiSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  healthCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },

  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  productName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },

  location: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  criticalBadge: {
    backgroundColor: '#FF5C6718',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  criticalText: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: '700',
  },

  healthStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 16,
  },

  statLabel: {
    color: COLORS.muted,
    fontSize: 10,
    marginBottom: 5,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  progressBackground: {
    height: 6,
    borderRadius: 4,
    backgroundColor: COLORS.cardLight,
    overflow: 'hidden',
  },

  progressCritical: {
    width: '25%',
    height: '100%',
    backgroundColor: COLORS.red,
    borderRadius: 4,
  },

  reason: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  aiLabel: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  transferCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },

  transferTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  transferIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#5B8CFF18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  transferIconText: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: '700',
  },

  transferInfo: {
    flex: 1,
  },

  transferTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },

  route: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 13,
    marginTop: 16,
  },

  routeLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
  },

  routeValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },

  arrow: {
    color: COLORS.primary,
    fontSize: 20,
  },

  recommendation: {
    marginTop: 14,
  },

  recommendationTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },

  recommendationText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 9,
  },

  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },

  activityInfo: {
    flex: 1,
  },

  activityReference: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },

  activityDescription: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 2,
  },

  activityTime: {
    color: '#606A79',
    fontSize: 10,
    marginTop: 4,
  },

  activityAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
});