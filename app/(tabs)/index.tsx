import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { RoutineRow } from "@/components/RoutineRow";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useWorkout } from "@/context/WorkoutContext";
import { WORKOUT_ROUTINES } from "@/data/routines";

function formatLastSessionDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const { workoutLogs, totalWorkouts, thisWeekWorkouts } = useWorkout();

  const featuredRoutine = WORKOUT_ROUTINES[0];
  const recentRoutines = WORKOUT_ROUTINES.slice(0, 3);
  const lastWorkout = workoutLogs[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        entering={FadeInDown.delay(110).springify()}
        style={styles.statsRow}
      >
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons
            name="calendar-check"
            size={22}
            color={colors.accent}
          />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {thisWeekWorkouts}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            This Week
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons
            name="trophy-outline"
            size={22}
            color={colors.warning}
          />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {totalWorkouts}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(170).springify()}>
        <Link href={`/workout/${featuredRoutine.id}`} asChild>
          <Pressable>
            <LinearGradient
              colors={[colors.accent, colors.accentSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaCard}
            >
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={28}
                color="#fff"
              />
              <View style={styles.ctaText}>
                <Text style={styles.ctaTitle}>Quick Start</Text>
                <Text style={styles.ctaSubtitle}>
                  Start {featuredRoutine.name}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#fff"
              />
            </LinearGradient>
          </Pressable>
        </Link>
      </Animated.View>

      {lastWorkout && (
        <Animated.View
          entering={FadeInDown.delay(220).springify()}
          style={[
            styles.lastWorkoutCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.lastWorkoutIcon,
              { backgroundColor: colors.accent + "25" },
            ]}
          >
            <MaterialCommunityIcons
              name="history"
              size={18}
              color={colors.accent}
            />
          </View>
          <View style={styles.lastWorkoutContent}>
            <Text style={[styles.lastWorkoutTitle, { color: colors.text }]}>
              Last session
            </Text>
            <Text
              style={[styles.lastWorkoutMeta, { color: colors.textSecondary }]}
            >
              {lastWorkout.routineName} - {lastWorkout.duration} min -{" "}
              {formatLastSessionDate(lastWorkout.completedAt)}
            </Text>
          </View>
        </Animated.View>
      )}

      <Animated.View
        entering={FadeInDown.delay(270).springify()}
        style={styles.section}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Routines
        </Text>
        {recentRoutines.map((routine) => (
          <Link key={routine.id} href={`/workout/${routine.id}`} asChild>
            <RoutineRow routine={routine} colors={colors} />
          </Link>
        ))}
      </Animated.View>

      <Link href="/(tabs)/workouts" asChild>
        <Pressable
          style={[
            styles.viewAll,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.viewAllText, { color: colors.accent }]}>
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
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 1,
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  ctaText: {
    flex: 1,
    marginLeft: 14,
  },
  ctaTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  ctaSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginTop: 2,
  },
  lastWorkoutCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  lastWorkoutIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lastWorkoutContent: {
    marginLeft: 10,
    flex: 1,
  },
  lastWorkoutTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  lastWorkoutMeta: {
    fontSize: 12,
    marginTop: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  viewAll: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  viewAllText: {
    fontWeight: "600",
    fontSize: 14,
  },
});
