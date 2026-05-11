import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppointments, type Appointment } from '@/hooks/useAppointments';
import { useAuth } from '@/context/AuthContext';
import { useInterpreterReviews, type Review } from '@/hooks/useReviews';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

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
  const { user } = useAuth();
  const { myMissions, history, loading } = useAppointments();
  const { reviews } = useInterpreterReviews();
  const unreadMap = useUnreadMessages();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [refreshing, setRefreshing]     = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const uid = user?.id ?? '';

  const pastMissions = useMemo(
    () => history
      .filter((a) => a.status === 'accepted' && a.interpreterId === uid)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [history, uid],
  );

  const markedDates = useMemo(() => {
    const result: Record<string, object> = {};
    for (const appt of myMissions) {
      const isSelected = selectedDate === appt.date;
      result[appt.date] = {
        marked: true,
        dotColor: isSelected ? Colors.white : Colors.primary,
        ...(isSelected && {
          selected: true,
          selectedColor: Colors.primary,
          selectedTextColor: Colors.white,
        }),
      };
    }
    if (selectedDate && !result[selectedDate]) {
      result[selectedDate] = {
        selected: true,
        selectedColor: Colors.primaryLight,
        selectedTextColor: Colors.textPrimary,
      };
    }
    return result;
  }, [myMissions, selectedDate]);

  const handleDayPress = useCallback((day: DateData) => {
    setSelectedDate((prev) => (prev === day.dateString ? null : day.dateString));
  }, []);

  const selectedMissions = useMemo(
    () => (selectedDate ? myMissions.filter((a) => a.date === selectedDate) : []),
    [selectedDate, myMissions],
  );

  const upcoming = useMemo(
    () => [...myMissions]
      .filter((a) => a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [myMissions, today],
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >

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
              selectedMissions.map((appt) => (
                <MissionCard
                  key={appt.id}
                  appt={appt}
                  onMessage={() => router.push(`/(tabs)/messagerie/${appt.id}?recipientId=${encodeURIComponent(appt.patientId)}&name=${encodeURIComponent(appt.patientName)}`)}
                  unreadCount={unreadMap.get(appt.id)}
                />
              ))
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
            upcoming.map((appt) => (
              <MissionCard
                key={appt.id}
                appt={appt}
                onMessage={() => router.push(`/(tabs)/messagerie/${appt.id}?recipientId=${encodeURIComponent(appt.patientId)}&name=${encodeURIComponent(appt.patientName)}`)}
                unreadCount={unreadMap.get(appt.id)}
              />
            ))
          )}
        </View>

        {/* Missions passées */}
        {pastMissions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique ({pastMissions.length})</Text>
            {pastMissions.map((appt) => {
              const review = reviews.find((r) => r.appointmentId === appt.id);
              return <MissionCard key={appt.id} appt={appt} review={review} past />;
            })}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const MissionCard = memo(function MissionCard({
  appt, review, past, onMessage, unreadCount,
}: {
  appt: Appointment;
  review?: Review;
  past?: boolean;
  onMessage?: () => void;
  unreadCount?: number;
}) {
  return (
    <View style={[styles.card, past && styles.cardPast]}>
      <View style={styles.timeColumn}>
        <Text style={[styles.timeText, past && styles.timeTextPast]}>{appt.time}</Text>
        <View style={[styles.timeLine, past && styles.timeLinePast]} />
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
        {!past && onMessage && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={onMessage}
            accessibilityRole="button"
            accessibilityLabel={unreadCount ? `Contacter le patient — ${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}` : 'Contacter le patient'}
          >
            <Feather name="message-circle" size={14} color={Colors.white} />
            <Text style={styles.chatBtnText}>💬 Contacter le patient</Text>
            {!!unreadCount && (
              <View style={styles.chatBtnBadge}>
                <Text style={styles.chatBtnBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {past && (
          review ? (
            <View style={styles.reviewRow}>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1,2,3,4,5].map((i) => (
                  <Text key={i} style={{ fontSize: 13, color: i <= review.rating ? '#F59E0B' : '#CBD5E1' }}>★</Text>
                ))}
              </View>
              {review.comment ? (
                <Text style={styles.reviewComment} numberOfLines={1}>"{review.comment}"</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.noReview}>Pas encore noté</Text>
          )
        )}
      </View>
    </View>
  );
});

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
  cardPast: { opacity: 0.8, borderStyle: 'dashed' },
  cardBody: { flex: 1, gap: 4 },
  cardType: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardPatient: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardLocation: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  cardAddress: { fontSize: FontSize.xs, color: Colors.textSecondary },
  timeTextPast: { color: Colors.textSecondary },
  timeLinePast: { backgroundColor: Colors.border },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  reviewComment: { fontSize: 11, color: '#92400E', fontStyle: 'italic', flex: 1 },
  noReview: { fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic' },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.lg, backgroundColor: Colors.primary, alignSelf: 'flex-start', marginTop: 4, position: 'relative' },
  chatBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.white },
  chatBtnBadge: { position: 'absolute', top: -5, right: -5, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.white },
  chatBtnBadgeTxt: { fontSize: 9, fontWeight: '800', color: Colors.white },

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
