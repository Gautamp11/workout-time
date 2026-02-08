import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutLog } from '@/types';

const STORAGE_KEY = '@workout_time_logs';

interface WorkoutContextType {
  workoutLogs: WorkoutLog[];
  addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => void;
  totalWorkouts: number;
  thisWeekWorkouts: number;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    saveLogs(workoutLogs);
  }, [workoutLogs]);

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

  const addWorkoutLog = useCallback((log: Omit<WorkoutLog, 'id'>) => {
    const newLog: WorkoutLog = {
      ...log,
      id: Date.now().toString(),
    };
    setWorkoutLogs(prev => [newLog, ...prev]);
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
