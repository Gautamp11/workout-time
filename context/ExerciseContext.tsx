import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Exercise } from '@/types';
import { EXERCISES as BUILT_IN_EXERCISES } from '@/data/exercises';

const STORAGE_KEY = '@workout_time_custom_exercises';

interface ExerciseContextType {
  customExercises: Exercise[];
  allExercises: Exercise[];
  addCustomExercise: (exercise: Omit<Exercise, 'id'>) => void;
  removeCustomExercise: (id: string) => void;
  getExercise: (id: string) => Exercise | undefined;
}

const ExerciseContext = createContext<ExerciseContextType | undefined>(undefined);

export function ExerciseProvider({ children }: { children: React.ReactNode }) {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    saveExercises(customExercises);
  }, [customExercises]);

  const loadExercises = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setCustomExercises(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to load custom exercises', e);
    }
  };

  const saveExercises = async (exercises: Exercise[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(exercises));
    } catch (e) {
      console.warn('Failed to save custom exercises', e);
    }
  };

  const addCustomExercise = useCallback((exercise: Omit<Exercise, 'id'>) => {
    const id = `custom-${Date.now()}`;
    setCustomExercises(prev => [...prev, { ...exercise, id }]);
  }, []);

  const removeCustomExercise = useCallback((id: string) => {
    setCustomExercises(prev => prev.filter(e => e.id !== id));
  }, []);

  const allExercises = [...BUILT_IN_EXERCISES, ...customExercises];

  const getExercise = useCallback((id: string): Exercise | undefined => {
    return allExercises.find(e => e.id === id);
  }, [customExercises]);

  return (
    <ExerciseContext.Provider
      value={{
        customExercises,
        allExercises,
        addCustomExercise,
        removeCustomExercise,
        getExercise,
      }}
    >
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercises() {
  const ctx = useContext(ExerciseContext);
  if (!ctx) throw new Error('useExercises must be used within ExerciseProvider');
  return ctx;
}
