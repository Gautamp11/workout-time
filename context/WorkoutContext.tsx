import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutExercise, WorkoutLog, WorkoutRoutine } from '@/types';

const STORAGE_KEY = '@workout_time_logs';
const ROUTINE_EXERCISES_STORAGE_KEY = '@workout_time_routine_exercises';
const CUSTOM_ROUTINES_STORAGE_KEY = '@workout_time_custom_routines';

interface WorkoutContextType {
  workoutLogs: WorkoutLog[];
  addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => void;
  customRoutines: WorkoutRoutine[];
  addCustomRoutine: (routine: Omit<WorkoutRoutine, 'id'>) => string;
  getRoutineExercises: (routineId: string, fallbackExercises: WorkoutExercise[]) => WorkoutExercise[];
  setRoutineExercises: (routineId: string, exercises: WorkoutExercise[]) => void;
  totalWorkouts: number;
  thisWeekWorkouts: number;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [customRoutines, setCustomRoutines] = useState<WorkoutRoutine[]>([]);
  const [routineExercises, setRoutineExercisesState] = useState<Record<string, WorkoutExercise[]>>({});

  useEffect(() => {
    loadLogs();
    loadCustomRoutines();
    loadRoutineExercises();
  }, []);

  useEffect(() => {
    saveLogs(workoutLogs);
  }, [workoutLogs]);

  useEffect(() => {
    saveRoutineExercises(routineExercises);
  }, [routineExercises]);

  useEffect(() => {
    saveCustomRoutines(customRoutines);
  }, [customRoutines]);

  const loadLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setWorkoutLogs(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to load workout logs', e);
    }
  };

  const saveLogs = async (logs: WorkoutLog[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to save workout logs', e);
    }
  };

  const loadRoutineExercises = async () => {
    try {
      const stored = await AsyncStorage.getItem(ROUTINE_EXERCISES_STORAGE_KEY);
      if (stored) setRoutineExercisesState(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to load routine exercises', e);
    }
  };

  const loadCustomRoutines = async () => {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_ROUTINES_STORAGE_KEY);
      if (stored) setCustomRoutines(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to load custom routines', e);
    }
  };

  const saveRoutineExercises = async (value: Record<string, WorkoutExercise[]>) => {
    try {
      await AsyncStorage.setItem(ROUTINE_EXERCISES_STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to save routine exercises', e);
    }
  };

  const saveCustomRoutines = async (value: WorkoutRoutine[]) => {
    try {
      await AsyncStorage.setItem(CUSTOM_ROUTINES_STORAGE_KEY, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to save custom routines', e);
    }
  };

  const addWorkoutLog = useCallback((log: Omit<WorkoutLog, 'id'>) => {
    const newLog: WorkoutLog = {
      ...log,
      id: Date.now().toString(),
    };
    setWorkoutLogs(prev => [newLog, ...prev]);
  }, []);

  const addCustomRoutine = useCallback((routine: Omit<WorkoutRoutine, 'id'>) => {
    const id = `custom-routine-${Date.now()}`;
    setCustomRoutines(prev => [...prev, { ...routine, id }]);
    return id;
  }, []);

  const getRoutineExercises = useCallback(
    (routineId: string, fallbackExercises: WorkoutExercise[]) => {
      return routineExercises[routineId] ?? fallbackExercises;
    },
    [routineExercises]
  );

  const setRoutineExercises = useCallback((routineId: string, exercises: WorkoutExercise[]) => {
    setRoutineExercisesState(prev => ({
      ...prev,
      [routineId]: exercises,
    }));
  }, []);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const thisWeekWorkouts = workoutLogs.filter(
    log => new Date(log.completedAt) >= oneWeekAgo
  ).length;

  return (
    <WorkoutContext.Provider
      value={{
        workoutLogs,
        addWorkoutLog,
        customRoutines,
        addCustomRoutine,
        getRoutineExercises,
        setRoutineExercises,
        totalWorkouts: workoutLogs.length,
        thisWeekWorkouts,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used within WorkoutProvider');
  return ctx;
}
