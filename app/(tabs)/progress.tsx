import { useState } from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
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

function toDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getCurrentStreak(dayKeysDesc: string[]) {
  if (dayKeysDesc.length === 0) return 0;
  const daySet = new Set(dayKeysDesc);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDayKey(d);
    if (daySet.has(key)) streak += 1;
    else {
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

function getLongestStreak(dayKeysDesc: string[]) {
  if (dayKeysDesc.length === 0) return 0;
  const keysAsc = [...dayKeysDesc].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < keysAsc.length; i++) {
    const prev = new Date(keysAsc[i - 1]);
    const cur = new Date(keysAsc[i]);
    const diff = (cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { workoutLogs, totalWorkouts, thisWeekWorkouts } = useWorkout();
  const [range, setRange] = useState<'30d' | 'all'>('30d');

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 29);
  const filteredLogs =
    range === '30d'
      ? workoutLogs.filter(log => new Date(log.completedAt) >= cutoff)
      : workoutLogs;

  const totalMinutes = filteredLogs.reduce((sum, log) => sum + log.duration, 0);
  const filteredTotalWorkouts = filteredLogs.length;
  const avgMinutes = filteredTotalWorkouts > 0 ? Math.round(totalMinutes / filteredTotalWorkouts) : 0;

  const uniqueDays = Array.from(
    new Set(filteredLogs.map(log => toDayKey(new Date(log.completedAt))))
  );
  const currentStreak = getCurrentStreak(uniqueDays);
  const longestStreak = getLongestStreak(uniqueDays);

  const routineCount = filteredLogs.reduce((acc, log) => {
    acc[log.routineName] = (acc[log.routineName] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topRoutineEntry = Object.entries(routineCount).sort((a, b) => b[1] - a[1])[0];
  const topRoutine = topRoutineEntry ? topRoutineEntry[0] : 'N/A';

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));
    const key = toDayKey(date);
    const count = filteredLogs.filter(log => toDayKey(new Date(log.completedAt)) === key).length;
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      count,
    };
  });
  const maxDayCount = Math.max(1, ...last7Days.map(d => d.count));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setRange('30d')}
          style={[
            styles.filterChip,
            {
              backgroundColor: range === '30d' ? colors.accent : colors.surface,
              borderColor: range === '30d' ? colors.accent : colors.border,
            },
          ]}
        >
          <Text style={[styles.filterChipText, { color: range === '30d' ? '#fff' : colors.text }]}>
            Last 30 Days
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setRange('all')}
          style={[
            styles.filterChip,
            {
              backgroundColor: range === 'all' ? colors.accent : colors.surface,
              borderColor: range === 'all' ? colors.accent : colors.border,
            },
          ]}
        >
          <Text style={[styles.filterChipText, { color: range === 'all' ? '#fff' : colors.text }]}>
            All Time
          </Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="dumbbell" size={28} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.text }]}>{filteredTotalWorkouts}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Workouts</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="calendar-week" size={28} color={colors.accentSecondary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{thisWeekWorkouts}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>This Week</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="fire" size={28} color={colors.warning} />
          <Text style={[styles.statValue, { color: colors.text }]}>{currentStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Current Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="medal" size={28} color={colors.accentSecondary} />
          <Text style={[styles.statValue, { color: colors.text }]}>{longestStreak}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Longest Streak</Text>
        </View>
      </View>

      <View style={[styles.statCardWide, { backgroundColor: colors.surface }]}>
        <View style={styles.statWideItem}>
          <MaterialCommunityIcons name="clock-outline" size={24} color={colors.warning} />
          <Text style={[styles.statWideValue, { color: colors.text }]}>{totalMinutes} min</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Time</Text>
        </View>
        <View style={styles.statWideDivider} />
        <View style={styles.statWideItem}>
          <MaterialCommunityIcons name="timer-outline" size={24} color={colors.accent} />
          <Text style={[styles.statWideValue, { color: colors.text }]}>{avgMinutes} min</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Duration</Text>
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Last 7 Days</Text>
        <View style={styles.weekBars}>
          {last7Days.map(day => (
            <View key={day.key} style={styles.dayCol}>
              <Text style={[styles.dayCount, { color: colors.textSecondary }]}>{day.count}</Text>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: colors.accent,
                      height: `${Math.max(10, (day.count / maxDayCount) * 100)}%`,
                      opacity: day.count > 0 ? 1 : 0.25,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Routine</Text>
        <View style={styles.topRoutineRow}>
          <MaterialCommunityIcons name="trophy-outline" size={22} color={colors.warning} />
          <Text style={[styles.topRoutineText, { color: colors.text }]}>{topRoutine}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Workout History</Text>
      {filteredLogs.length === 0 ? (
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
        filteredLogs.map(log => (
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
                {formatDate(log.completedAt)} - {log.duration} min - {log.exercisesCompleted} exercises
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
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 18,
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
    marginBottom: 16,
  },
  statWideItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statWideDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(128,128,128,0.25)',
    marginHorizontal: 12,
  },
  statWideValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  panel: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  weekBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 8,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dayCount: {
    fontSize: 12,
  },
  barTrack: {
    width: '100%',
    height: 72,
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 12,
  },
  topRoutineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topRoutineText: {
    fontSize: 16,
    fontWeight: '600',
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
