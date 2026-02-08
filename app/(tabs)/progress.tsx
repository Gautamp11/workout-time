import { StyleSheet, ScrollView, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/Themed';
import { useWorkout } from '@/context/WorkoutContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { workoutLogs, totalWorkouts, thisWeekWorkouts } = useWorkout();

  const totalMinutes = workoutLogs.reduce((sum, log) => sum + log.duration, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stats}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="dumbbell" size={32} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.text }]}>{totalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Workouts</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="calendar-week" size={32} color={colors.accentSecondary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{thisWeekWorkouts}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Week</Text>
        </View>
      </View>
      <View style={[styles.statCardWide, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="clock-outline" size={28} color={colors.warning} />
        <View style={styles.statWideContent}>
          <Text style={[styles.statValue, { color: colors.text }]}>{totalMinutes} min</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Time</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Workout History</Text>
      {workoutLogs.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="run" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No workouts yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Complete a workout to see your history
          </Text>
        </View>
      ) : (
        workoutLogs.map(log => (
          <View
            key={log.id}
            style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.logIcon, { backgroundColor: colors.accent + '25' }]}>
              <MaterialCommunityIcons name="check-circle" size={24} color={colors.accent} />
            </View>
            <View style={styles.logContent}>
              <Text style={[styles.logName, { color: colors.text }]}>{log.routineName}</Text>
              <Text style={[styles.logMeta, { color: colors.textSecondary }]}>
                {formatDate(log.completedAt)} • {log.duration} min • {log.exercisesCompleted} exercises
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statCardWide: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statWideContent: { marginLeft: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  empty: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  logIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContent: { flex: 1, marginLeft: 14 },
  logName: { fontSize: 16, fontWeight: '600' },
  logMeta: { fontSize: 13, marginTop: 2 },
});
