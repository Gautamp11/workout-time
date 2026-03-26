import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useExercises } from "@/context/ExerciseContext";
import { useWorkout } from "@/context/WorkoutContext";
import { WORKOUT_ROUTINES } from "@/data/routines";
import { LoggedWorkoutExercise, WorkoutExercise, WorkoutLog } from "@/types";

interface SessionExerciseLog {
  loggedWeight: string;
  notes: string;
}

interface CompletionSummary {
  duration: number;
  personalRecords: Array<{
    exerciseName: string;
    weightLabel: string;
  }>;
}

function formatRestLabel(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds === 0
    ? `${minutes}m`
    : `${minutes}m ${remainingSeconds}s`;
}

function parseLoggedWeight(weight?: string) {
  if (!weight) return null;
  const match = weight.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function getPreviousBestWeight(logs: WorkoutLog[], exerciseId: string) {
  let best: number | null = null;

  for (const log of logs) {
    for (const detail of log.exerciseDetails ?? []) {
      if (detail.exerciseId !== exerciseId) continue;
      const parsedWeight = parseLoggedWeight(detail.loggedWeight);
      if (parsedWeight === null) continue;
      if (best === null || parsedWeight > best) best = parsedWeight;
    }
  }

  return best;
}

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const {
    addWorkoutLog,
    customRoutines,
    getRoutineExercises,
    setRoutineExercises,
    workoutLogs,
  } = useWorkout();
  const { allExercises, getExercise } = useExercises();
  const [showOverview, setShowOverview] = useState(true);
  const [sessionExercises, setSessionExercises] = useState<WorkoutExercise[]>(
    [],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SessionExerciseLog>>({});
  const [completionSummary, setCompletionSummary] = useState<CompletionSummary | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const routines = [...WORKOUT_ROUTINES, ...customRoutines];
  const routine = routines.find((r) => r.id === id);

  // Reset session when routine changes
  useEffect(() => {
    if (routine) {
      const savedExercises = getRoutineExercises(routine.id, routine.exercises);
      setSessionExercises([...savedExercises]);
      setExerciseLogs({});
      setCompletionSummary(null);
      setShowOverview(true);
      setCurrentIndex(0);
    }
  }, [routine, getRoutineExercises]);

  if (!routine) return null;

  const currentWE = sessionExercises[currentIndex];
  const exercise = currentWE ? getExercise(currentWE.exerciseId) : null;
  const hasExercises = sessionExercises.length > 0;
  const isLast = currentIndex >= sessionExercises.length - 1;
  const currentExerciseKey = `${currentIndex}-${currentWE?.exerciseId ?? "unknown"}`;
  const currentExerciseLog = exerciseLogs[currentExerciseKey] ?? {
    loggedWeight: "",
    notes: "",
  };

  const updateCurrentExerciseLog = (
    field: keyof SessionExerciseLog,
    value: string,
  ) => {
    setExerciseLogs((prev) => ({
      ...prev,
      [currentExerciseKey]: {
        loggedWeight: prev[currentExerciseKey]?.loggedWeight ?? "",
        notes: prev[currentExerciseKey]?.notes ?? "",
        [field]: value,
      },
    }));
  };

  const buildExerciseDetails = (): LoggedWorkoutExercise[] =>
    sessionExercises.map((sessionExercise, index) => {
      const sessionKey = `${index}-${sessionExercise.exerciseId}`;
      const exerciseInfo = getExercise(sessionExercise.exerciseId);
      const sessionLog = exerciseLogs[sessionKey];

      return {
        exerciseId: sessionExercise.exerciseId,
        exerciseName: exerciseInfo?.name ?? "Exercise",
        plannedSets: sessionExercise.sets,
        plannedReps: sessionExercise.reps,
        loggedWeight: sessionLog?.loggedWeight.trim() || undefined,
        notes: sessionLog?.notes.trim() || undefined,
      };
    });

  const getPersonalRecords = (exerciseDetails: LoggedWorkoutExercise[]) =>
    exerciseDetails.flatMap((detail) => {
      const currentWeight = parseLoggedWeight(detail.loggedWeight);
      if (currentWeight === null) return [];

      const previousBest = getPreviousBestWeight(workoutLogs, detail.exerciseId);
      if (previousBest !== null && currentWeight <= previousBest) return [];

      return [
        {
          exerciseName: detail.exerciseName,
          weightLabel: detail.loggedWeight ?? `${currentWeight}`,
        },
      ];
    });

  const startWorkout = () => {
    if (!hasExercises) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startTimeRef.current = Date.now();
    setShowOverview(false);
  };

  const addExerciseToWorkout = (exerciseId: string) => {
    const newEx: WorkoutExercise = {
      exerciseId,
      sets: 3,
      reps: "10",
      restSeconds: 60,
    };
    setSessionExercises((prev) => {
      const next = [...prev, newEx];
      setRoutineExercises(routine.id, next);
      return next;
    });
    setShowAddExercise(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeExercise = (index: number) => {
    setSessionExercises((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setRoutineExercises(routine.id, next);
      return next;
    });
    if (currentIndex >= sessionExercises.length - 1 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const updateExerciseConfig = (
    index: number,
    updates: Partial<WorkoutExercise>,
  ) => {
    setSessionExercises((prev) => {
      const next = prev.map((exercise, exerciseIndex) =>
        exerciseIndex === index ? { ...exercise, ...updates } : exercise,
      );
      setRoutineExercises(routine.id, next);
      return next;
    });
  };

  const moveExercise = (index: number, direction: "up" | "down") => {
    setSessionExercises((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      setRoutineExercises(routine.id, next);
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const finishExercise = () => {
    if (!currentWE) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isLast) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 60000);
      const exerciseDetails = buildExerciseDetails();
      const personalRecords = getPersonalRecords(exerciseDetails);
      addWorkoutLog({
        routineId: routine.id,
        routineName: routine.name,
        completedAt: new Date().toISOString(),
        duration,
        exercisesCompleted: sessionExercises.length,
        exerciseDetails,
      });
      setCompletionSummary({
        duration,
        personalRecords,
      });
    } else {
      setIsResting(true);
    }
  };

  const skipRest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsResting(false);
    setCurrentIndex((prev) => prev + 1);
  };

  if (isResting) {
    return (
      <RestTimer
        seconds={sessionExercises[currentIndex]?.restSeconds ?? 60}
        onComplete={() => {
          setIsResting(false);
          setCurrentIndex((prev) => prev + 1);
        }}
        onSkip={skipRest}
        colors={colors}
      />
    );
  }

  // Overview screen - show workout list before starting
  if (showOverview) {
    const exercisesToShow =
      sessionExercises.length > 0 ? sessionExercises : routine.exercises;
    const availableToAdd = allExercises.filter(
      (e) => !exercisesToShow.some((we) => we.exerciseId === e.id),
    );

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View
          style={[styles.overviewHeader, { backgroundColor: colors.surface }]}
        >
          <View
            style={[
              styles.overviewIcon,
              { backgroundColor: routine.color + "25" },
            ]}
          >
            <MaterialCommunityIcons
              name={routine.icon as any}
              size={40}
              color={routine.color}
            />
          </View>
          <Text style={[styles.overviewTitle, { color: colors.text }]}>
            {routine.name}
          </Text>
          <Text style={[styles.overviewDesc, { color: colors.textSecondary }]}>
            {routine.description}
          </Text>
          <Text style={[styles.overviewMeta, { color: colors.textSecondary }]}>
            {routine.duration} - {exercisesToShow.length} exercises
          </Text>
        </View>

        <Pressable
          onPress={startWorkout}
          disabled={!hasExercises}
          style={[
            styles.startBtn,
            {
              backgroundColor: hasExercises ? colors.accent : colors.border,
              opacity: hasExercises ? 1 : 0.65,
            },
          ]}
        >
          <MaterialCommunityIcons name="play" size={24} color="#fff" />
          <Text style={styles.startBtnText}>
            {hasExercises ? "Start Workout" : "Add an exercise to start"}
          </Text>
        </Pressable>

        {!showAddExercise ? (
          <Pressable
            onPress={() => setShowAddExercise(true)}
            style={[
              styles.addExerciseBtn,
              { borderColor: colors.accent, borderStyle: "dashed" },
            ]}
          >
            <MaterialCommunityIcons
              name="plus"
              size={24}
              color={colors.accent}
            />
            <Text style={[styles.addExerciseText, { color: colors.accent }]}>
              Add exercise
            </Text>
          </Pressable>
        ) : (
          <View
            style={[
              styles.addExerciseSection,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.addExerciseSectionHeader}>
              <Text
                style={[styles.addExerciseSectionTitle, { color: colors.text }]}
              >
                Choose exercise to add
              </Text>
              <Pressable onPress={() => setShowAddExercise(false)} hitSlop={12}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
            <Pressable
              onPress={() => router.push("/add-exercise")}
              style={[styles.customExerciseBtn, { borderColor: colors.accent }]}
            >
              <MaterialCommunityIcons
                name="plus-circle-outline"
                size={20}
                color={colors.accent}
              />
              <Text
                style={[styles.customExerciseText, { color: colors.accent }]}
              >
                Create custom exercise
              </Text>
            </Pressable>
            <ScrollView
              style={styles.addExerciseList}
              contentContainerStyle={styles.addExerciseListContent}
              nestedScrollEnabled
            >
              {availableToAdd.map((ex) => (
                <Pressable
                  key={ex.id}
                  onPress={() => addExerciseToWorkout(ex.id)}
                  style={({ pressed }) => [
                    styles.addExerciseItem,
                    { borderColor: colors.border },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    style={[styles.addExerciseItemName, { color: colors.text }]}
                  >
                    {ex.name}
                  </Text>
                  <Text
                    style={[
                      styles.addExerciseItemMeta,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {ex.muscleGroup} - {ex.equipment}
                  </Text>
                </Pressable>
              ))}
              {availableToAdd.length === 0 && (
                <Text
                  style={[styles.noExercises, { color: colors.textSecondary }]}
                >
                  All exercises already in workout
                </Text>
              )}
            </ScrollView>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Exercises in this workout
        </Text>
        {exercisesToShow.map((we, i) => {
          const ex = getExercise(we.exerciseId);
          if (!ex) return null;
          return (
            <View
              key={`${we.exerciseId}-${i}`}
              style={[
                styles.overviewExerciseRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.overviewExerciseNum}>
                <Text
                  style={[
                    styles.overviewExerciseNumText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {i + 1}
                </Text>
              </View>
              <View style={styles.overviewExerciseInfo}>
                <Text
                  style={[styles.overviewExerciseName, { color: colors.text }]}
                >
                  {ex.name}
                </Text>
                <Text
                  style={[
                    styles.overviewExerciseMeta,
                    { color: colors.textSecondary },
                  ]}
                >
                  {we.sets} sets x {we.reps} - {ex.equipment}
                </Text>
                <View style={styles.editorRow}>
                  <View
                    style={[
                      styles.editorGroup,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <Pressable
                      hitSlop={8}
                      onPress={() =>
                        updateExerciseConfig(i, { sets: Math.max(1, we.sets - 1) })
                      }
                      style={styles.editorButton}
                    >
                      <MaterialCommunityIcons
                        name="minus"
                        size={18}
                        color={colors.text}
                      />
                    </Pressable>
                    <Text style={[styles.editorValue, { color: colors.text }]}>
                      {we.sets} sets
                    </Text>
                    <Pressable
                      hitSlop={8}
                      onPress={() => updateExerciseConfig(i, { sets: we.sets + 1 })}
                      style={styles.editorButton}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={18}
                        color={colors.text}
                      />
                    </Pressable>
                  </View>

                  <TextInput
                    value={we.reps ?? ""}
                    onChangeText={(value) => updateExerciseConfig(i, { reps: value })}
                    placeholder="Reps"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.repsInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                  />

                  <View
                    style={[
                      styles.restControl,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  >
                    <Pressable
                      onPress={() =>
                        updateExerciseConfig(i, {
                          restSeconds: we.restSeconds >= 15 ? we.restSeconds - 15 : 0,
                        })
                      }
                      style={styles.editorButton}
                    >
                      <MaterialCommunityIcons
                        name="minus"
                        size={18}
                        color={colors.text}
                      />
                    </Pressable>
                    <Text style={[styles.restChipText, { color: colors.text }]}>
                      {formatRestLabel(we.restSeconds)}
                    </Text>
                    <Pressable
                      onPress={() =>
                        updateExerciseConfig(i, {
                          restSeconds: we.restSeconds + 15,
                        })
                      }
                      style={styles.editorButton}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={18}
                        color={colors.text}
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
              <View style={styles.rowActions}>
                <Pressable
                  hitSlop={10}
                  onPress={() => moveExercise(i, "up")}
                  disabled={i === 0}
                  style={({ pressed }) => [
                    styles.iconAction,
                    { opacity: i === 0 ? 0.35 : pressed ? 0.6 : 1 },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="chevron-up"
                    size={22}
                    color={colors.textSecondary}
                  />
                </Pressable>
                <Pressable
                  hitSlop={10}
                  onPress={() => moveExercise(i, "down")}
                  disabled={i === exercisesToShow.length - 1}
                  style={({ pressed }) => [
                    styles.iconAction,
                    {
                      opacity:
                        i === exercisesToShow.length - 1 ? 0.35 : pressed ? 0.6 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={22}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
              <Pressable
                onPress={() => removeExercise(i)}
                hitSlop={12}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={24}
                  color={colors.danger}
                />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    );
  }

  if (completionSummary) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.completionCard, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.completionIcon,
              { backgroundColor: colors.accent + "20" },
            ]}
          >
            <MaterialCommunityIcons
              name="check-decagram"
              size={42}
              color={colors.accent}
            />
          </View>
          <Text style={[styles.completionTitle, { color: colors.text }]}>
            Workout complete
          </Text>
          <Text style={[styles.completionMeta, { color: colors.textSecondary }]}>
            {routine.name} - {completionSummary.duration} min
          </Text>

          {completionSummary.personalRecords.length > 0 ? (
            <View
              style={[
                styles.prPanel,
                { backgroundColor: colors.accent + "14", borderColor: colors.accent + "30" },
              ]}
            >
              <View style={styles.prHeader}>
                <MaterialCommunityIcons
                  name="trophy"
                  size={20}
                  color={colors.warning}
                />
                <Text style={[styles.prTitle, { color: colors.text }]}>
                  New personal record
                </Text>
              </View>
              {completionSummary.personalRecords.map((record) => (
                <View key={`${record.exerciseName}-${record.weightLabel}`} style={styles.prRow}>
                  <Text style={[styles.prExercise, { color: colors.text }]}>
                    {record.exerciseName}
                  </Text>
                  <Text style={[styles.prWeight, { color: colors.accent }]}>
                    {record.weightLabel}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.completionBody, { color: colors.textSecondary }]}>
              Nice work. Your workout has been saved to Progress.
            </Text>
          )}

          <Pressable
            onPress={() => router.back()}
            style={[styles.completionBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.completionBtnText}>Done</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (!currentWE || !exercise) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View
          style={[styles.emptyStateCard, { backgroundColor: colors.surface }]}
        >
          <MaterialCommunityIcons
            name="dumbbell"
            size={42}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            This workout needs at least one exercise
          </Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            Go back to the overview and add an exercise before starting.
          </Text>
          <Pressable
            onPress={() => setShowOverview(true)}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              Back to Overview
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // Active workout - exercise by exercise
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((currentIndex + 1) / sessionExercises.length) * 100}%`,
              backgroundColor: routine.color,
            },
          ]}
        />
      </View>
      <Text style={[styles.counter, { color: colors.textSecondary }]}>
        Exercise {currentIndex + 1} of {sessionExercises.length}
      </Text>

      {exercise && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.exerciseIcon,
              { backgroundColor: routine.color + "25" },
            ]}
          >
            <MaterialCommunityIcons
              name="dumbbell"
              size={48}
              color={routine.color}
            />
          </View>
          <Text style={[styles.exerciseName, { color: colors.text }]}>
            {exercise.name}
          </Text>
          <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
            {exercise.muscleGroup} • {exercise.equipment}
          </Text>
          <View style={styles.setsRow}>
            <Text style={[styles.setsText, { color: colors.text }]}>
              {currentWE.sets} sets x {currentWE.reps}
            </Text>
          </View>
          <View style={styles.loggingSection}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Weight used
            </Text>
            <TextInput
              value={currentExerciseLog.loggedWeight}
              onChangeText={(value) => updateCurrentExerciseLog("loggedWeight", value)}
              placeholder="e.g. 20 kg or bodyweight"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Notes
            </Text>
            <TextInput
              value={currentExerciseLog.notes}
              onChangeText={(value) => updateCurrentExerciseLog("notes", value)}
              placeholder="Optional form or performance note"
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
              style={[
                styles.input,
                styles.notesInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
          </View>
          <Text style={[styles.instructions, { color: colors.textSecondary }]}>
            {exercise.instructions}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={finishExercise}
          style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
        >
          <MaterialCommunityIcons name="check" size={24} color="#fff" />
          <Text style={styles.primaryBtnText}>
            {isLast ? "Finish Workout" : "Done → Rest"}
          </Text>
        </Pressable>
        {!isLast && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentIndex((prev) => prev + 1);
            }}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              Skip
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function RestTimer({
  seconds: initialSeconds,
  onComplete,
  onSkip,
  colors,
}: {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
  colors: typeof import("@/constants/Colors").default.dark;
}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deadlineRef = useRef(Date.now() + initialSeconds * 1000);
  const completedRef = useRef(false);

  useEffect(() => {
    deadlineRef.current = Date.now() + initialSeconds * 1000;
    completedRef.current = false;
    setSeconds(initialSeconds);

    intervalRef.current = setInterval(() => {
      const remainingMs = deadlineRef.current - Date.now();
      const nextSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setSeconds(nextSeconds);

      if (remainingMs <= 0 && !completedRef.current) {
        completedRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        onComplete();
      }
    }, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [initialSeconds, onComplete]);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <View
      style={[styles.restContainer, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.restLabel, { color: colors.textSecondary }]}>
        Rest
      </Text>
      <Text style={[styles.restTime, { color: colors.accent }]}>
        {m}:{s.toString().padStart(2, "0")}
      </Text>
      <Pressable
        onPress={onSkip}
        style={[styles.skipBtn, { borderColor: colors.border }]}
      >
        <Text style={[styles.skipText, { color: colors.text }]}>Skip rest</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  // Overview styles
  overviewHeader: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  overviewIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  overviewDesc: {
    fontSize: 15,
    marginTop: 4,
    textAlign: "center",
  },
  overviewMeta: {
    fontSize: 14,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  overviewExerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  overviewExerciseNum: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  overviewExerciseNumText: {
    fontSize: 13,
    fontWeight: "700",
  },
  overviewExerciseInfo: { flex: 1, minWidth: 0, marginRight: 8 },
  overviewExerciseName: { fontSize: 15, fontWeight: "600" },
  overviewExerciseMeta: { fontSize: 12, marginTop: 2 },
  editorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  editorGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    minHeight: 40,
  },
  editorButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  rowActions: {
    justifyContent: "center",
    marginRight: 6,
  },
  iconAction: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  editorValue: {
    fontSize: 13,
    fontWeight: "600",
    minWidth: 56,
    textAlign: "center",
  },
  repsInput: {
    minWidth: 74,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "600",
  },
  restControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    minHeight: 40,
  },
  restChipText: {
    fontSize: 13,
    fontWeight: "600",
    minWidth: 54,
    textAlign: "center",
  },
  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    marginTop: 8,
    marginBottom: 24,
  },
  addExerciseText: { fontSize: 16, fontWeight: "600" },
  addExerciseSection: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    maxHeight: 360,
    minHeight: 260,
  },
  addExerciseSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addExerciseSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  addExerciseList: {
    maxHeight: 280,
  },
  addExerciseListContent: {
    paddingBottom: 8,
  },
  customExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 12,
  },
  customExerciseText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addExerciseItem: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  addExerciseItemName: { fontSize: 15, fontWeight: "500" },
  addExerciseItemMeta: { fontSize: 12, marginTop: 2 },
  noExercises: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
  emptyStateCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  completionCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  completionIcon: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  completionMeta: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  completionBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  prPanel: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  prHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  prTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  prExercise: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  prWeight: {
    fontSize: 15,
    fontWeight: "700",
  },
  completionBtn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 4,
  },
  completionBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  startBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  // Active workout styles
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  counter: {
    fontSize: 14,
    marginBottom: 20,
  },
  card: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  exerciseIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  exerciseMeta: {
    fontSize: 14,
    marginTop: 4,
  },
  setsRow: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  setsText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loggingSection: {
    width: "100%",
    marginTop: 18,
    gap: 8,
  },
  inputLabel: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  notesInput: {
    minHeight: 84,
  },
  instructions: {
    fontSize: 14,
    marginTop: 20,
    lineHeight: 22,
    textAlign: "center",
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  restContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  restLabel: {
    fontSize: 18,
    marginBottom: 12,
  },
  restTime: {
    fontSize: 72,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
    marginBottom: 32,
  },
  skipBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
