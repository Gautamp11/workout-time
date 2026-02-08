import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RoutineRow } from '@/components/RoutineRow';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useWorkout } from '@/context/WorkoutContext';
import { WORKOUT_ROUTINES } from '@/data/routines';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { totalWorkouts, thisWeekWorkouts } = useWorkout();

  const featuredRoutine = WORKOUT_ROUTINES[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="calendar-check" size={28} color={colors.accent} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {thisWeekWorkouts}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            This Week
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="trophy" size={28} color={colors.warning} />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {totalWorkouts}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total Workouts
          </Text>
        </View>
      </Animated.View>

      {/* Quick Start */}
      <Animated.View entering={FadeInDown.delay(200).springify()}>
        <Link href={`/workout/${featuredRoutine.id}`} asChild>
          <Pressable>
            <LinearGradient
              colors={[colors.accent, colors.accentSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaCard}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={40} color="#fff" />
              <View style={styles.ctaText}>
                <Text style={styles.ctaTitle}>Quick Start</Text>
                <Text style={styles.ctaSubtitle}>
                  Start {featuredRoutine.name}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={28} color="#fff" />
            </LinearGradient>
          </Pressable>
        </Link>
      </Animated.View>

      {/* Routines */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Workout Routines
        </Text>

        {WORKOUT_ROUTINES.slice(0, 3).map((routine) => (
          <Link key={routine.id} href={`/workout/${routine.id}`} asChild>
            <RoutineRow routine={routine} colors={colors} />
          </Link>
        ))}
      </Animated.View>

      <Link href="/(tabs)/workouts" asChild>
        <Pressable style={styles.viewAll}>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>
            View All Workouts
          </Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  ctaText: {
    flex: 1,
    marginLeft: 16,
  },
  ctaTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 2,
  },

  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  viewAll: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
