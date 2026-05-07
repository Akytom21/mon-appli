import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppointments, type Appointment } from '@/hooks/useAppointments';

const TYPE_ICONS: Record<string, string> = {
  generaliste: '🩺',
  urgences: '🚨',
  specialiste: '👨‍⚕️',
  pharmacie: '💊',
};

const TYPE_LABELS: Record<string, string> = {
  generaliste: 'Médecin généraliste',
  urgences: 'Urgences',
  specialiste: 'Spécialiste',
  pharmacie: 'Pharmacie',
};

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

export default function PlanningScreen() {
  const { myMissions, loading } = useAppointments();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const markedDates: Record<string, object> = {};
  for (const appt of myMissions) {
    const isSelected = selectedDate === appt.date;
    markedDates[appt.date] = {
      marked: true,
      dotColor: isSelected ? Colors.white : Colors.primary,
      ...(isSelected && {
        selected: true,
        selectedColor: Colors.primary,
        selectedTextColor: Colors.white,
      }),
    };
  }
  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: Colors.primaryLight,
      selectedTextColor: Colors.textPrimary,
    };
  }

  const handleDayPress = (day: DateData) => {
    setSelectedDate(selectedDate === day.dateString ? null : day.dateString);
  };

  const selectedMissions = selectedDate
    ? myMissions.filter((a) => a.date === selectedDate)
    : [];

  const upcoming = [...myMissions]
    .filter((a) => a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Calendrier mensuel */}
        <Calendar
          current={today}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={{
            todayTextColor: Colors.primary,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: Colors.white,
            dotColor: Colors.primary,
            selectedDotColor: Colors.white,
            arrowColor: Colors.primary,
            monthTextColor: Colors.textPrimary,
            textMonthFontWeight: '700',
            textDayFontSize: FontSize.md,
            textDayHeaderFontSize: FontSize.xs,
            dayTextColor: Colors.textPrimary,
            textDisabledColor: Colors.textSecondary,
          }}
          style={styles.calendar}
        />

        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Jour avec mission acceptée</Text>
          </View>
        </View>

        {/* Détails du jour sélectionné */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedMissions.length > 0
                ? `Mission du ${formatDateLong(selectedDate)}`
                : `Aucune mission le ${formatDateLong(selectedDate)}`}
            </Text>
            {selectedMissions.length === 0 ? (
              <Text style={styles.emptyNote}>Ce jour est libre.</Text>
            ) : (
              selectedMissions.map((appt) => <MissionCard key={appt.id} appt={appt} />)
            )}
          </View>
        )}

        {/* Missions à venir */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {`Missions à venir${upcoming.length > 0 ? ` (${upcoming.length})` : ''}`}
          </Text>
          {upcoming.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📅</Text>
              <Text style={styles.emptyStateTitle}>Aucune mission à venir</Text>
              <Text style={styles.emptyStateSub}>
                Acceptez des demandes depuis l'onglet Missions disponibles.
              </Text>
            </View>
          ) : (
            upcoming.map((appt) => <MissionCard key={appt.id} appt={appt} />)
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function MissionCard({ appt }: { appt: Appointment }) {
  return (
    <View style={styles.card}>
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{appt.time}</Text>
        <View style={styles.timeLine} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardType}>
          {TYPE_ICONS[appt.type] ?? '📋'} {TYPE_LABELS[appt.type] ?? appt.type}
        </Text>
        <Text style={styles.cardPatient}>Patient : {appt.patientName}</Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          📍 {appt.location}
        </Text>
        <Text style={styles.cardAddress} numberOfLines={1}>{appt.address}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  content: { paddingBottom: Spacing.xxl },

  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  legend: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  legendText: { fontSize: FontSize.xs, color: Colors.textSecondary },

  section: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  timeColumn: {
    alignItems: 'center',
    gap: 4,
    width: 44,
  },
  timeText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  timeLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.primaryLight,
    borderRadius: 1,
    minHeight: 24,
  },
  cardBody: { flex: 1, gap: 4 },
  cardType: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardPatient: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardLocation: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  cardAddress: { fontSize: FontSize.xs, color: Colors.textSecondary },

  emptyNote: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  emptyStateIcon: { fontSize: 44 },
  emptyStateTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyStateSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
