import { useState, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/Themed';
import { useWorkout } from '@/context/WorkoutContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { WORKOUT_ROUTINES } from '@/data/routines';
import { useExercises } from '@/context/ExerciseContext';
import { WorkoutExercise } from '@/types';

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { addWorkoutLog, customRoutines, getRoutineExercises, setRoutineExercises } = useWorkout();
  const { allExercises, getExercise } = useExercises();
  const [showOverview, setShowOverview] = useState(true);
  const [sessionExercises, setSessionExercises] = useState<WorkoutExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const routines = [...WORKOUT_ROUTINES, ...customRoutines];
  const routine = routines.find(r => r.id === id);

  // Reset session when routine changes
  useEffect(() => {
    if (routine) {
      const savedExercises = getRoutineExercises(routine.id, routine.exercises);
      setSessionExercises([...savedExercises]);
      setShowOverview(true);
      setCurrentIndex(0);
    }
  }, [routine, getRoutineExercises]);

  if (!routine) return null;

  const currentWE = sessionExercises[currentIndex];
  const exercise = currentWE ? getExercise(currentWE.exerciseId) : null;
  const isLast = currentIndex >= sessionExercises.length - 1;

  const startWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startTimeRef.current = Date.now();
    setShowOverview(false);
  };

  const addExerciseToWorkout = (exerciseId: string) => {
    const newEx: WorkoutExercise = {
      exerciseId,
      sets: 3,
      reps: '10',
      restSeconds: 60,
    };
    setSessionExercises(prev => {
      const next = [...prev, newEx];
      setRoutineExercises(routine.id, next);
      return next;
    });
    setShowAddExercise(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeExercise = (index: number) => {
    setSessionExercises(prev => {
      const next = prev.filter((_, i) => i !== index);
      setRoutineExercises(routine.id, next);
      return next;
    });
    if (currentIndex >= sessionExercises.length - 1 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const finishExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isLast) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 60000);
      addWorkoutLog({
        routineId: routine.id,
        routineName: routine.name,
        completedAt: new Date().toISOString(),
        duration,
        exercisesCompleted: sessionExercises.length,
      });
      router.back();
    } else {
      setIsResting(true);
      setRestSeconds(currentWE?.restSeconds ?? 60);
    }
  };

  const skipRest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsResting(false);
    setCurrentIndex(prev => prev + 1);
  };

  if (isResting) {
    return (
      <RestTimer
        seconds={sessionExercises[currentIndex]?.restSeconds ?? 60}
        onComplete={() => {
          setIsResting(false);
          setCurrentIndex(prev => prev + 1);
        }}
        onSkip={skipRest}
        colors={colors}
      />
    );
  }

  // Overview screen - show workout list before starting
  if (showOverview) {
    const exercisesToShow = sessionExercises.length > 0 ? sessionExercises : routine.exercises;
    const availableToAdd = allExercises.filter(
      e => !exercisesToShow.some(we => we.exerciseId === e.id)
    );

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <View style={[styles.overviewHeader, { backgroundColor: colors.surface }]}>
          <View style={[styles.overviewIcon, { backgroundColor: routine.color + '25' }]}>
            <MaterialCommunityIcons name={routine.icon as any} size={40} color={routine.color} />
          </View>
          <Text style={[styles.overviewTitle, { color: colors.text }]}>{routine.name}</Text>
          <Text style={[styles.overviewDesc, { color: colors.textSecondary }]}>
            {routine.description}
          </Text>
          <Text style={[styles.overviewMeta, { color: colors.textSecondary }]}>
            {routine.duration} - {exercisesToShow.length} exercises
          </Text>
        </View>

        <Pressable
          onPress={startWorkout}
          style={[styles.startBtn, { backgroundColor: colors.accent }]}
        >
          <MaterialCommunityIcons name="play" size={24} color="#fff" />
          <Text style={styles.startBtnText}>Start Workout</Text>
        </Pressable>

        {!showAddExercise ? (
          <Pressable
            onPress={() => setShowAddExercise(true)}
            style={[styles.addExerciseBtn, { borderColor: colors.accent, borderStyle: 'dashed' }]}
          >
            <MaterialCommunityIcons name="plus" size={24} color={colors.accent} />
            <Text style={[styles.addExerciseText, { color: colors.accent }]}>Add exercise</Text>
          </Pressable>
        ) : (
          <View style={[styles.addExerciseSection, { backgroundColor: colors.surface }]}>
            <View style={styles.addExerciseSectionHeader}>
              <Text style={[styles.addExerciseSectionTitle, { color: colors.text }]}>
                Choose exercise to add
              </Text>
              <Pressable onPress={() => setShowAddExercise(false)} hitSlop={12}>
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => router.push('/add-exercise')}
              style={[styles.customExerciseBtn, { borderColor: colors.accent }]}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.accent} />
              <Text style={[styles.customExerciseText, { color: colors.accent }]}>
                Create custom exercise
              </Text>
            </Pressable>
            <ScrollView
              style={styles.addExerciseList}
              contentContainerStyle={styles.addExerciseListContent}
              nestedScrollEnabled
            >
              {availableToAdd.map(ex => (
                <Pressable
                  key={ex.id}
                  onPress={() => addExerciseToWorkout(ex.id)}
                  style={({ pressed }) => [
                    styles.addExerciseItem,
                    { borderColor: colors.border },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[styles.addExerciseItemName, { color: colors.text }]}>{ex.name}</Text>
                  <Text style={[styles.addExerciseItemMeta, { color: colors.textSecondary }]}>
                    {ex.muscleGroup} - {ex.equipment}
                  </Text>
                </Pressable>
              ))}
              {availableToAdd.length === 0 && (
                <Text style={[styles.noExercises, { color: colors.textSecondary }]}>
                  All exercises already in workout
                </Text>
              )}
            </ScrollView>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.text }]}>Exercises in this workout</Text>
        {exercisesToShow.map((we, i) => {
          const ex = getExercise(we.exerciseId);
          if (!ex) return null;
          return (
            <View
              key={`${we.exerciseId}-${i}`}
              style={[styles.overviewExerciseRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={styles.overviewExerciseNum}>
                <Text style={[styles.overviewExerciseNumText, { color: colors.textSecondary }]}>
                  {i + 1}
                </Text>
              </View>
              <View style={styles.overviewExerciseInfo}>
                <Text style={[styles.overviewExerciseName, { color: colors.text }]}>{ex.name}</Text>
                <Text style={[styles.overviewExerciseMeta, { color: colors.textSecondary }]}>
                  {we.sets} sets x {we.reps} - {ex.equipment}
                </Text>
              </View>
              <Pressable
                onPress={() => removeExercise(i)}
                hitSlop={12}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={24} color={colors.danger} />
              </Pressable>
            </View>
          );
        })}
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
          <View style={[styles.exerciseIcon, { backgroundColor: routine.color + '25' }]}>
            <MaterialCommunityIcons name="dumbbell" size={48} color={routine.color} />
          </View>
          <Text style={[styles.exerciseName, { color: colors.text }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseMeta, { color: colors.textSecondary }]}>
            {exercise.muscleGroup} â€¢ {exercise.equipment}
          </Text>
          <View style={styles.setsRow}>
            <Text style={[styles.setsText, { color: colors.text }]}>
              {currentWE.sets} sets Ã— {currentWE.reps}
            </Text>
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
            {isLast ? 'Finish Workout' : 'Done â†’ Rest'}
          </Text>
        </Pressable>
        {!isLast && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentIndex(prev => prev + 1);
            }}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Skip</Text>
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
  colors: typeof import('@/constants/Colors').default.dark;
}) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;
    if (seconds > 0) {
      t = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            if (t) clearInterval(t);
            onComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (t) clearInterval(t); };
  }, []);

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return (
    <View style={[styles.restContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.restLabel, { color: colors.textSecondary }]}>Rest</Text>
      <Text style={[styles.restTime, { color: colors.accent }]}>
        {m}:{s.toString().padStart(2, '0')}
      </Text>
      <Pressable onPress={onSkip} style={[styles.skipBtn, { borderColor: colors.border }]}>
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
    alignItems: 'center',
  },
  overviewIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  overviewDesc: {
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
  overviewMeta: {
    fontSize: 14,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  overviewExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  overviewExerciseNumText: {
    fontSize: 13,
    fontWeight: '700',
  },
  overviewExerciseInfo: { flex: 1, minWidth: 0, marginRight: 8 },
  overviewExerciseName: { fontSize: 15, fontWeight: '600' },
  overviewExerciseMeta: { fontSize: 12, marginTop: 2 },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    marginTop: 8,
    marginBottom: 24,
  },
  addExerciseText: { fontSize: 16, fontWeight: '600' },
  addExerciseSection: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    maxHeight: 360,
    minHeight: 260,
  },
  addExerciseSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciseSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  addExerciseList: {
    maxHeight: 280,
  },
  addExerciseListContent: {
    paddingBottom: 8,
  },
  customExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 12,
  },
  customExerciseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addExerciseItem: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  addExerciseItemName: { fontSize: 15, fontWeight: '500' },
  addExerciseItemMeta: { fontSize: 12, marginTop: 2 },
  noExercises: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Active workout styles
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
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
    alignItems: 'center',
  },
  exerciseIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
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
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  setsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    marginTop: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  restContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  restLabel: {
    fontSize: 18,
    marginBottom: 12,
  },
  restTime: {
    fontSize: 72,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
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
    fontWeight: '600',
  },
});

