import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useWorkout } from "@/context/WorkoutContext";
import { WorkoutLog } from "@/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

function toDayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseLoggedWeight(weight?: string) {
  if (!weight) return null;
  const match = weight.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function getExercisePersonalBests(logs: WorkoutLog[]) {
  const bests = new Map<
    string,
    {
      exerciseName: string;
      weight: number;
      weightLabel: string;
      completedAt: string;
      routineName: string;
    }
  >();

  for (const log of logs) {
    for (const detail of log.exerciseDetails ?? []) {
      const parsedWeight = parseLoggedWeight(detail.loggedWeight);
      if (parsedWeight === null) continue;

      const existing = bests.get(detail.exerciseId);
      if (!existing || parsedWeight > existing.weight) {
        bests.set(detail.exerciseId, {
          exerciseName: detail.exerciseName,
          weight: parsedWeight,
          weightLabel: detail.loggedWeight ?? `${parsedWeight}`,
          completedAt: log.completedAt,
          routineName: log.routineName,
        });
      }
    }
  }

  return Array.from(bests.values()).sort((a, b) => b.weight - a.weight);
}

function getExerciseHistory(logs: WorkoutLog[], exerciseName: string) {
  return logs
    .flatMap((log) =>
      (log.exerciseDetails ?? [])
        .filter((detail) => detail.exerciseName === exerciseName)
        .map((detail) => ({
          id: `${log.id}-${detail.exerciseId}`,
          completedAt: log.completedAt,
          routineName: log.routineName,
          plannedSets: detail.plannedSets,
          plannedReps: detail.plannedReps,
          loggedWeight: detail.loggedWeight,
          notes: detail.notes,
        })),
    )
    .filter((entry) => entry.loggedWeight)
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );
}

function getWeightNumber(weight?: string) {
  return parseLoggedWeight(weight);
}

function getAchievementProgress(current: number, target: number) {
  return Math.min(1, current / target);
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
  const colors = Colors[colorScheme ?? "dark"];
  const { workoutLogs, weeklyGoal, setWeeklyGoal } = useWorkout();
  const [range, setRange] = useState<"30d" | "all">("30d");
  const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - 29);
  const filteredLogs =
    range === "30d"
      ? workoutLogs.filter((log) => new Date(log.completedAt) >= cutoff)
      : workoutLogs;
  const weekStart = startOfLocalDay(new Date());
  weekStart.setDate(weekStart.getDate() - 6);
  const filteredThisWeekWorkouts = filteredLogs.filter(
    (log) => new Date(log.completedAt) >= weekStart,
  ).length;

  const totalMinutes = filteredLogs.reduce((sum, log) => sum + log.duration, 0);
  const filteredTotalWorkouts = filteredLogs.length;
  const avgMinutes =
    filteredTotalWorkouts > 0
      ? Math.round(totalMinutes / filteredTotalWorkouts)
      : 0;

  const uniqueDays = Array.from(
    new Set(filteredLogs.map((log) => toDayKey(new Date(log.completedAt)))),
  );
  const currentStreak = getCurrentStreak(uniqueDays);
  const longestStreak = getLongestStreak(uniqueDays);

  const routineCount = filteredLogs.reduce(
    (acc, log) => {
      acc[log.routineName] = (acc[log.routineName] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const topRoutineEntry = Object.entries(routineCount).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const topRoutine = topRoutineEntry ? topRoutineEntry[0] : "N/A";

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfLocalDay(new Date());
    date.setDate(date.getDate() - (6 - i));
    const key = toDayKey(date);
    const count = filteredLogs.filter(
      (log) => toDayKey(new Date(log.completedAt)) === key,
    ).length;
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      count,
    };
  });
  const maxDayCount = Math.max(1, ...last7Days.map((d) => d.count));
  const selectedDayWorkouts = selectedDayKey
    ? filteredLogs.filter(
        (log) => toDayKey(new Date(log.completedAt)) === selectedDayKey,
      )
    : [];
  const selectedDayLabel =
    last7Days.find((day) => day.key === selectedDayKey)?.label ?? null;
  const personalBests = getExercisePersonalBests(filteredLogs);
  const bestLift = personalBests[0];
  const selectedExerciseHistory = selectedExerciseName
    ? getExerciseHistory(filteredLogs, selectedExerciseName)
    : [];
  const chartEntries = [...selectedExerciseHistory]
    .reverse()
    .map((entry) => ({
      ...entry,
      weightValue: getWeightNumber(entry.loggedWeight) ?? 0,
    }));
  const maxChartWeight = Math.max(1, ...chartEntries.map((entry) => entry.weightValue));
  const achievements = [
    {
      key: "first_workout",
      title: "First Workout",
      icon: "flag-checkered",
      accent: colors.accent,
      unlocked: filteredTotalWorkouts >= 1,
      progress: getAchievementProgress(filteredTotalWorkouts, 1),
      subtitle:
        filteredTotalWorkouts >= 1
          ? "You got started."
          : "Finish your first workout.",
    },
    {
      key: "consistency",
      title: "7-Day Spark",
      icon: "calendar-star",
      accent: colors.accentSecondary,
      unlocked: filteredThisWeekWorkouts >= 3,
      progress: getAchievementProgress(filteredThisWeekWorkouts, 3),
      subtitle:
        filteredThisWeekWorkouts >= 3
          ? "3 workouts this week."
          : `${filteredThisWeekWorkouts}/3 workouts this week`,
    },
    {
      key: "streak",
      title: "Streak Builder",
      icon: "fire",
      accent: colors.warning,
      unlocked: longestStreak >= 3,
      progress: getAchievementProgress(longestStreak, 3),
      subtitle:
        longestStreak >= 3
          ? `${longestStreak}-day streak reached.`
          : `${longestStreak}/3 longest streak`,
    },
    {
      key: "pr_hunter",
      title: "PR Hunter",
      icon: "trophy",
      accent: colors.accent,
      unlocked: personalBests.length >= 1,
      progress: getAchievementProgress(personalBests.length, 1),
      subtitle:
        personalBests.length >= 1
          ? `${personalBests.length} lift${personalBests.length > 1 ? "s" : ""} with logged PRs.`
          : "Log a weight to unlock this badge.",
    },
  ];
  const weeklyGoalProgress = Math.min(1, filteredThisWeekWorkouts / weeklyGoal);
  const weeklyGoalOptions = [3, 4, 5, 6];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setRange("30d")}
          style={[
            styles.filterChip,
            {
              backgroundColor: range === "30d" ? colors.accent : colors.surface,
              borderColor: range === "30d" ? colors.accent : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: range === "30d" ? "#fff" : colors.text },
            ]}
          >
            Last 30 Days
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setRange("all")}
          style={[
            styles.filterChip,
            {
              backgroundColor: range === "all" ? colors.accent : colors.surface,
              borderColor: range === "all" ? colors.accent : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: range === "all" ? "#fff" : colors.text },
            ]}
          >
            All Time
          </Text>
        </Pressable>
      </View>

      <View style={styles.stats}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons
            name="dumbbell"
            size={28}
            color={colors.accent}
          />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {filteredTotalWorkouts}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total Workouts
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons
            name="calendar-week"
            size={28}
            color={colors.accentSecondary}
          />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {filteredThisWeekWorkouts}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            This Week
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons
            name="fire"
            size={28}
            color={colors.warning}
          />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {currentStreak}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Current Streak
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons
            name="medal"
            size={28}
            color={colors.accentSecondary}
          />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {longestStreak}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Longest Streak
          </Text>
        </View>
      </View>

      <View style={[styles.statCardWide, { backgroundColor: colors.surface }]}>
        <View style={styles.statWideItem}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={24}
            color={colors.warning}
          />
          <Text style={[styles.statWideValue, { color: colors.text }]}>
            {totalMinutes} min
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total Time
          </Text>
        </View>
        <View style={styles.statWideDivider} />
        <View style={styles.statWideItem}>
          <MaterialCommunityIcons
            name="timer-outline"
            size={24}
            color={colors.accent}
          />
          <Text style={[styles.statWideValue, { color: colors.text }]}>
            {avgMinutes} min
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Avg Duration
          </Text>
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Weekly Goal
        </Text>
        <View
          style={[
            styles.goalSummary,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <View style={styles.goalSummaryHeader}>
            <View>
              <Text style={[styles.goalSummaryValue, { color: colors.text }]}>
                {filteredThisWeekWorkouts} / {weeklyGoal}
              </Text>
              <Text style={[styles.goalSummaryMeta, { color: colors.textSecondary }]}>
                workouts this week
              </Text>
            </View>
            <Text style={[styles.goalSummaryPercent, { color: colors.accent }]}>
              {Math.round(weeklyGoalProgress * 100)}%
            </Text>
          </View>
          <View style={[styles.goalTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.goalFill,
                {
                  backgroundColor: colors.accent,
                  width: `${Math.max(10, weeklyGoalProgress * 100)}%`,
                  opacity: filteredThisWeekWorkouts > 0 ? 1 : 0.35,
                },
              ]}
            />
          </View>
        </View>
        <View style={styles.goalOptions}>
          {weeklyGoalOptions.map((goal) => (
            <Pressable
              key={goal}
              onPress={() => setWeeklyGoal(goal)}
              style={[
                styles.goalChip,
                {
                  backgroundColor: weeklyGoal === goal ? colors.accent : colors.background,
                  borderColor: weeklyGoal === goal ? colors.accent : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.goalChipText,
                  { color: weeklyGoal === goal ? "#fff" : colors.text },
                ]}
              >
                {goal}/week
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Last 7 Days
        </Text>
        <View style={styles.weekBars}>
          {last7Days.map((day) => {
            const isSelected = selectedDayKey === day.key;
            return (
              <Pressable
                key={day.key}
                onPress={() =>
                  setSelectedDayKey((current) =>
                    current === day.key ? null : day.key,
                  )
                }
                style={styles.dayCol}
              >
                <Text style={[styles.dayCount, { color: colors.textSecondary }]}>
                  {day.count}
                </Text>
                <View
                  style={[
                    styles.barTrack,
                    {
                      backgroundColor: isSelected
                        ? colors.accent + "20"
                        : colors.border,
                    },
                  ]}
                >
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
                <View style={styles.dayLabelRow}>
                  <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
                    {day.label}
                  </Text>
                  <MaterialCommunityIcons
                    name={isSelected ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
        {selectedDayKey && (
          <View
            style={[
              styles.dayDetails,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.dayDetailsTitle, { color: colors.text }]}>
              {selectedDayLabel} activity
            </Text>
            {selectedDayWorkouts.length > 0 ? (
              selectedDayWorkouts.map((log) => (
                <View
                  key={log.id}
                  style={[
                    styles.dayDetailsRow,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.dayDetailsWorkout, { color: colors.text }]}>
                    {log.routineName}
                  </Text>
                  <Text
                    style={[styles.dayDetailsMeta, { color: colors.textSecondary }]}
                  >
                    {log.duration} min - {log.exercisesCompleted} exercises
                  </Text>
                </View>
              ))
            ) : (
              <Text
                style={[styles.dayDetailsEmpty, { color: colors.textSecondary }]}
              >
                No workouts logged for this day.
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Top Routine
        </Text>
        <View style={styles.topRoutineRow}>
          <MaterialCommunityIcons
            name="trophy-outline"
            size={22}
            color={colors.warning}
          />
          <Text style={[styles.topRoutineText, { color: colors.text }]}>
            {topRoutine}
          </Text>
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Achievements
        </Text>
        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <View
              key={achievement.key}
              style={[
                styles.achievementCard,
                {
                  backgroundColor: achievement.unlocked
                    ? achievement.accent + "14"
                    : colors.background,
                  borderColor: achievement.unlocked
                    ? achievement.accent + "30"
                    : colors.border,
                },
              ]}
            >
              <View style={styles.achievementHeader}>
                <View
                  style={[
                    styles.achievementIconWrap,
                    {
                      backgroundColor: achievement.unlocked
                        ? achievement.accent + "20"
                        : colors.surface,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={achievement.icon as any}
                    size={20}
                    color={achievement.unlocked ? achievement.accent : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.achievementStatus,
                    {
                      color: achievement.unlocked
                        ? achievement.accent
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {achievement.unlocked ? "Unlocked" : "In Progress"}
                </Text>
              </View>
              <Text style={[styles.achievementTitle, { color: colors.text }]}>
                {achievement.title}
              </Text>
              <Text
                style={[styles.achievementSubtitle, { color: colors.textSecondary }]}
              >
                {achievement.subtitle}
              </Text>
              <View
                style={[
                  styles.achievementTrack,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.achievementFill,
                    {
                      backgroundColor: achievement.accent,
                      width: `${Math.max(8, achievement.progress * 100)}%`,
                      opacity: achievement.unlocked ? 1 : 0.85,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Personal Bests
        </Text>
        {bestLift ? (
          <>
            <View
              style={[
                styles.personalBestHero,
                { backgroundColor: colors.accent + "15", borderColor: colors.accent + "35" },
              ]}
            >
              <MaterialCommunityIcons
                name="trophy"
                size={22}
                color={colors.warning}
              />
              <View style={styles.personalBestHeroContent}>
                <Text style={[styles.personalBestHeroLabel, { color: colors.textSecondary }]}>
                  Heaviest Logged Lift
                </Text>
                <Text style={[styles.personalBestHeroValue, { color: colors.text }]}>
                  {bestLift.exerciseName}
                </Text>
                <Text style={[styles.personalBestHeroMeta, { color: colors.textSecondary }]}>
                  {bestLift.weightLabel} - {formatDate(bestLift.completedAt)}
                </Text>
              </View>
            </View>

            {personalBests.slice(0, 5).map((best) => (
              <Pressable
                key={best.exerciseName}
                onPress={() =>
                  setSelectedExerciseName((current) =>
                    current === best.exerciseName ? null : best.exerciseName,
                  )
                }
                style={[styles.personalBestRow, { borderTopColor: colors.border }]}
              >
                <View style={styles.personalBestText}>
                  <Text style={[styles.personalBestName, { color: colors.text }]}>
                    {best.exerciseName}
                  </Text>
                  <Text style={[styles.personalBestMeta, { color: colors.textSecondary }]}>
                    {best.routineName} - {formatDate(best.completedAt)}
                  </Text>
                </View>
                <View style={styles.personalBestRight}>
                  <Text style={[styles.personalBestWeight, { color: colors.accent }]}>
                    {best.weightLabel}
                  </Text>
                  <MaterialCommunityIcons
                    name={
                      selectedExerciseName === best.exerciseName
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            ))}

            {selectedExerciseName && (
              <View
                style={[
                  styles.exerciseHistoryPanel,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.exerciseHistoryTitle, { color: colors.text }]}
                >
                  {selectedExerciseName} History
                </Text>
                {chartEntries.length > 0 && (
                  <View style={styles.historyChartSection}>
                    <View style={styles.historyChart}>
                      {chartEntries.map((entry) => (
                        <View key={`chart-${entry.id}`} style={styles.historyChartCol}>
                          <Text
                            style={[
                              styles.historyChartValue,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {entry.loggedWeight}
                          </Text>
                          <View
                            style={[
                              styles.historyChartTrack,
                              { backgroundColor: colors.border },
                            ]}
                          >
                            <View
                              style={[
                                styles.historyChartFill,
                                {
                                  backgroundColor: colors.accent,
                                  height: `${Math.max(
                                    12,
                                    (entry.weightValue / maxChartWeight) * 100,
                                  )}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text
                            style={[
                              styles.historyChartLabel,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {formatDate(entry.completedAt)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {selectedExerciseHistory.length > 0 ? (
                  selectedExerciseHistory.map((entry) => (
                    <View
                      key={entry.id}
                      style={[
                        styles.exerciseHistoryRow,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <View style={styles.exerciseHistoryText}>
                        <Text
                          style={[
                            styles.exerciseHistoryWeight,
                            { color: colors.accent },
                          ]}
                        >
                          {entry.loggedWeight}
                        </Text>
                        <Text
                          style={[
                            styles.exerciseHistoryMeta,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatDate(entry.completedAt)} - {entry.routineName}
                        </Text>
                        <Text
                          style={[
                            styles.exerciseHistoryMeta,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {entry.plannedSets} sets
                          {entry.plannedReps ? ` x ${entry.plannedReps}` : ""}
                        </Text>
                        {!!entry.notes && (
                          <Text
                            style={[
                              styles.exerciseHistoryNotes,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {entry.notes}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <Text
                    style={[
                      styles.exerciseHistoryEmpty,
                      { color: colors.textSecondary },
                    ]}
                  >
                    No logged weight history in this date range.
                  </Text>
                )}
              </View>
            )}
          </>
        ) : (
          <View
            style={[styles.personalBestEmpty, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.personalBestEmptyText, { color: colors.textSecondary }]}>
              Log exercise weights during workouts to unlock personal best tracking.
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Workout History
      </Text>
      {filteredLogs.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons
            name="run"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No workouts yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Complete a workout to see your history
          </Text>
        </View>
      ) : (
        filteredLogs.map((log) => (
          <View
            key={log.id}
            style={[
              styles.logCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.logIcon,
                { backgroundColor: colors.accent + "25" },
              ]}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={colors.accent}
              />
            </View>
            <View style={styles.logContent}>
              <Text style={[styles.logName, { color: colors.text }]}>
                {log.routineName}
              </Text>
              <Text style={[styles.logMeta, { color: colors.textSecondary }]}>
                {formatDate(log.completedAt)} - {log.duration} min -{" "}
                {log.exercisesCompleted} exercises
              </Text>
              {!!log.exerciseDetails?.length && (
                <View
                  style={[
                    styles.exerciseDetails,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.exerciseDetailsTitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Exercise details
                  </Text>
                  {log.exerciseDetails.map((detail, index) => (
                    <View key={`${log.id}-${detail.exerciseId}-${index}`} style={styles.exerciseDetailRow}>
                      <Text
                        style={[
                          styles.exerciseDetailName,
                          { color: colors.text },
                        ]}
                      >
                        {detail.exerciseName}
                      </Text>
                      <Text
                        style={[
                          styles.exerciseDetailMeta,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {detail.plannedSets} sets
                        {detail.plannedReps ? ` x ${detail.plannedReps}` : ""}
                        {detail.loggedWeight ? ` - ${detail.loggedWeight}` : ""}
                      </Text>
                      {!!detail.notes && (
                        <Text
                          style={[
                            styles.exerciseDetailNotes,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {detail.notes}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
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
    flexDirection: "row",
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
    fontWeight: "600",
  },
  stats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statCardWide: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statWideItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statWideDivider: {
    width: 1,
    height: 48,
    backgroundColor: "rgba(128,128,128,0.25)",
    marginHorizontal: 12,
  },
  statWideValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  goalSummary: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  goalSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  goalSummaryValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  goalSummaryMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  goalSummaryPercent: {
    fontSize: 20,
    fontWeight: "700",
  },
  goalTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
  },
  goalFill: {
    height: "100%",
    borderRadius: 999,
  },
  goalOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  goalChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  panel: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  weekBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  dayCount: {
    fontSize: 12,
  },
  barTrack: {
    width: "100%",
    height: 72,
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 10,
  },
  dayLabel: {
    fontSize: 12,
  },
  dayLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  dayDetails: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  dayDetailsTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  dayDetailsRow: {
    borderTopWidth: 1,
    paddingVertical: 10,
    gap: 2,
  },
  dayDetailsWorkout: {
    fontSize: 14,
    fontWeight: "600",
  },
  dayDetailsMeta: {
    fontSize: 12,
  },
  dayDetailsEmpty: {
    fontSize: 13,
    lineHeight: 20,
    paddingVertical: 8,
  },
  topRoutineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topRoutineText: {
    fontSize: 16,
    fontWeight: "600",
  },
  achievementsGrid: {
    gap: 10,
  },
  achievementCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  achievementHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  achievementIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementStatus: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  achievementSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
  },
  achievementTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  achievementFill: {
    height: "100%",
    borderRadius: 999,
  },
  personalBestHero: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  personalBestHeroContent: {
    flex: 1,
  },
  personalBestHeroLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  personalBestHeroValue: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  personalBestHeroMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  personalBestRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingVertical: 10,
    gap: 10,
  },
  personalBestText: {
    flex: 1,
  },
  personalBestName: {
    fontSize: 14,
    fontWeight: "600",
  },
  personalBestMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  personalBestWeight: {
    fontSize: 15,
    fontWeight: "700",
  },
  personalBestRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  personalBestEmpty: {
    borderRadius: 12,
    padding: 16,
  },
  personalBestEmptyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  exerciseHistoryPanel: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 8,
  },
  exerciseHistoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  historyChartSection: {
    marginTop: 6,
    marginBottom: 8,
  },
  historyChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  historyChartCol: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  historyChartValue: {
    fontSize: 10,
  },
  historyChartTrack: {
    width: "100%",
    height: 88,
    borderRadius: 10,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  historyChartFill: {
    width: "100%",
    borderRadius: 10,
  },
  historyChartLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  exerciseHistoryRow: {
    borderTopWidth: 1,
    paddingVertical: 10,
  },
  exerciseHistoryText: {
    gap: 2,
  },
  exerciseHistoryWeight: {
    fontSize: 15,
    fontWeight: "700",
  },
  exerciseHistoryMeta: {
    fontSize: 12,
  },
  exerciseHistoryNotes: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  exerciseHistoryEmpty: {
    fontSize: 13,
    lineHeight: 20,
    paddingVertical: 10,
  },
  empty: {
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  logCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  logIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logContent: { flex: 1, marginLeft: 14 },
  logName: { fontSize: 16, fontWeight: "600" },
  logMeta: { fontSize: 13, marginTop: 2 },
  exerciseDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  exerciseDetailsTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  exerciseDetailRow: {
    gap: 2,
  },
  exerciseDetailName: {
    fontSize: 14,
    fontWeight: "600",
  },
  exerciseDetailMeta: {
    fontSize: 12,
  },
  exerciseDetailNotes: {
    fontSize: 12,
    lineHeight: 18,
  },
});
