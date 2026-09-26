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

export default function IntelligenceScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>Intelligence</Text>
            <Text style={styles.subtitle}>
              Understand what your inventory needs
            </Text>
          </View>

          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        {/* Overall Health */}
        <View style={styles.healthOverview}>
          <View style={styles.healthCircle}>
            <Text style={styles.healthScore}>72</Text>
            <Text style={styles.outOf}>/100</Text>
          </View>

          <View style={styles.healthInfo}>
            <Text style={styles.healthTitle}>Inventory Health</Text>

            <View style={styles.healthStatus}>
              <View style={styles.greenDot} />
              <Text style={styles.healthStatusText}>
                Needs attention
              </Text>
            </View>

            <Text style={styles.healthDescription}>
              Most inventory is healthy, but several products require
              replenishment or redistribution.
            </Text>
          </View>
        </View>

        {/* Stock Health */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stock Health</Text>
          <Text style={styles.count}>3 alerts</Text>
        </View>

        <HealthCard
          product="Industrial Motor A"
          location="Production Rack"
          status="Critical"
          statusColor={COLORS.red}
          stock="4 units"
          reorder="10 units"
          cover="3 days"
          reason="Free stock is below the reorder point."
        />

        <HealthCard
          product="Copper Cable 10mm"
          location="Electrical Store"
          status="Warning"
          statusColor={COLORS.orange}
          stock="18 units"
          reorder="25 units"
          cover="7 days"
          reason="Demand has increased over the last 7 days."
        />

        <HealthCard
          product="Steel Bearing"
          location="Storage Rack"
          status="Healthy"
          statusColor={COLORS.green}
          stock="42 units"
          reorder="15 units"
          cover="28 days"
          reason="Stock is comfortably above the safety threshold."
        />

        {/* Smart Transfer */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Smart Transfer Recommendations
          </Text>
        </View>

        <View style={styles.transferCard}>
          <View style={styles.transferHeader}>
            <View style={styles.transferIcon}>
              <Text style={styles.transferIconText}>↔</Text>
            </View>

            <View style={styles.transferHeaderInfo}>
              <Text style={styles.transferTitle}>
                Industrial Motor A
              </Text>
              <Text style={styles.transferQuantity}>
                Recommended: 20 units
              </Text>
            </View>

            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>
                Recommended
              </Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeLocation}>
              <Text style={styles.routeLabel}>FROM</Text>
              <Text style={styles.routeName}>Storage Rack</Text>
              <Text style={styles.routeStock}>
                35 units surplus
              </Text>
            </View>

            <View style={styles.routeArrow}>
              <Text style={styles.routeArrowText}>→</Text>
            </View>

            <View style={styles.routeLocation}>
              <Text style={styles.routeLabel}>TO</Text>
              <Text style={styles.routeName}>Production Rack</Text>
              <Text style={styles.routeStock}>
                4 units available
              </Text>
            </View>
          </View>

          <View style={styles.whyBox}>
            <Text style={styles.whyTitle}>Why this recommendation?</Text>
            <Text style={styles.whyText}>
              The destination is below its reorder point while the source
              location has enough stock above its safety threshold.
            </Text>
          </View>

          <TouchableOpacity style={styles.reviewButton}>
            <Text style={styles.reviewButtonText}>
              Review Transfer
            </Text>
          </TouchableOpacity>
        </View>

        {/* How it works */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How StockSense Decides</Text>
        </View>

        <View style={styles.methodCard}>
          <MethodRow
            number="01"
            title="Days of Cover"
            description="How long current stock can satisfy average usage."
          />

          <MethodRow
            number="02"
            title="Reorder Point"
            description="Checks whether available stock has fallen below the threshold."
          />

          <MethodRow
            number="03"
            title="Safety Stock"
            description="Protects locations from unnecessary stock shortages."
          />

          <MethodRow
            number="04"
            title="Demand Pattern"
            description="Looks at recent movement history to identify changing demand."
          />
        </View>

        <Text style={styles.footerNote}>
          Recommendations are explainable and based on inventory movement
          data.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function HealthCard({
  product,
  location,
  status,
  statusColor,
  stock,
  reorder,
  cover,
  reason,
}: {
  product: string;
  location: string;
  status: string;
  statusColor: string;
  stock: string;
  reorder: string;
  cover: string;
  reason: string;
}) {
  return (
    <View style={styles.healthCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.productName}>{product}</Text>
          <Text style={styles.location}>{location}</Text>
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

      <View style={styles.metricRow}>
        <Metric label="Free Stock" value={stock} />
        <Metric label="Reorder Point" value={reorder} />
        <Metric label="Days Cover" value={cover} />
      </View>

      <View style={styles.reasonContainer}>
        <Text style={styles.reasonLabel}>WHY</Text>
        <Text style={styles.reasonText}>{reason}</Text>
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function MethodRow({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.methodRow}>
      <View style={styles.methodNumber}>
        <Text style={styles.methodNumberText}>{number}</Text>
      </View>

      <View style={styles.methodInfo}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodDescription}>{description}</Text>
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
    paddingBottom: 45,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 25,
  },

  heading: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },

  aiBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#5B8CFF18',
    borderWidth: 1,
    borderColor: '#5B8CFF40',
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiBadgeText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '900',
  },

  healthOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 25,
  },

  healthCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 7,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 17,
  },

  healthScore: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: '800',
  },

  outOf: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: -3,
  },

  healthInfo: {
    flex: 1,
  },

  healthTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },

  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.orange,
    marginRight: 6,
  },

  healthStatusText: {
    color: COLORS.orange,
    fontSize: 11,
    fontWeight: '600',
  },

  healthDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
    marginTop: 5,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },

  count: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: '700',
  },

  healthCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  cardTitleContainer: {
    flex: 1,
  },

  productName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  location: {
    color: COLORS.muted,
    fontSize: 10,
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

  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 17,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  metricLabel: {
    color: COLORS.muted,
    fontSize: 9,
    marginBottom: 5,
  },

  metricValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },

  reasonContainer: {
    marginTop: 12,
  },

  reasonLabel: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },

  reasonText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  transferCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 24,
  },

  transferHeader: {
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
    marginRight: 11,
  },

  transferIconText: {
    color: COLORS.primary,
    fontSize: 21,
    fontWeight: '800',
  },

  transferHeaderInfo: {
    flex: 1,
  },

  transferTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },

  transferQuantity: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  recommendedBadge: {
    backgroundColor: '#35C98A18',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
  },

  recommendedText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: '700',
  },

  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
  },

  routeLocation: {
    flex: 1,
  },

  routeLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '700',
    marginBottom: 4,
  },

  routeName: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
  },

  routeStock: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 3,
  },

  routeArrow: {
    paddingHorizontal: 9,
  },

  routeArrowText: {
    color: COLORS.primary,
    fontSize: 18,
  },

  whyBox: {
    marginTop: 12,
    padding: 11,
    backgroundColor: '#5B8CFF0D',
    borderRadius: 10,
  },

  whyTitle: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },

  whyText: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  reviewButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },

  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  methodCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
  },

  methodRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  methodNumber: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.cardLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  methodNumberText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
  },

  methodInfo: {
    flex: 1,
  },

  methodTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },

  methodDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  footerNote: {
    color: '#606A79',
    fontSize: 9,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 18,
  },
});