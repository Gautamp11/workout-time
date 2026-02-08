export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions: string;
  image?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps?: string; // e.g., "12" or "8-12" or "AMRAP"
  restSeconds: number;
  notes?: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  description: string;
  duration: string; // e.g., "45 min"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: WorkoutExercise[];
  icon: string; // MaterialCommunityIcons name
  color: string;
}

export interface WorkoutLog {
  id: string;
  routineId: string;
  routineName: string;
  completedAt: string; // ISO date string
  duration: number; // minutes
  exercisesCompleted: number;
}
