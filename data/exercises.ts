import { Exercise } from '@/types';

export const EXERCISES: Exercise[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Chest', equipment: 'Barbell', instructions: 'Lie on bench, grip bar slightly wider than shoulders. Lower bar to mid-chest, then press up. Keep feet flat and core engaged.' },
  { id: 'push-ups', name: 'Push-Ups', muscleGroup: 'Chest', equipment: 'Bodyweight', instructions: 'Hands shoulder-width apart, body in straight line. Lower chest to floor, then push back up. Keep core tight throughout.' },
  { id: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', equipment: 'Dumbbells', instructions: 'Set bench to 30-45°. Press dumbbells from shoulder level. Focus on upper chest contraction.' },
  { id: 'cable-fly', name: 'Cable Fly', muscleGroup: 'Chest', equipment: 'Cable', instructions: 'Stand between cables, bring hands together in arc motion. Squeeze chest at center, control the return.' },
  // Back
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell', instructions: 'Hinge at hips, grip bar outside knees. Drive through heels, extend hips. Keep bar close to body.' },
  { id: 'pull-ups', name: 'Pull-Ups', muscleGroup: 'Back', equipment: 'Pull-up Bar', instructions: 'Hang with overhand grip. Pull until chin over bar. Lower with control, avoid swinging.' },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', instructions: 'Hinge forward, row bar to lower chest. Squeeze shoulder blades. Keep core braced.' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', equipment: 'Cable', instructions: 'Wide grip, pull bar to upper chest. Control the eccentric. Engage lats throughout.' },
  // Legs
  { id: 'squat', name: 'Barbell Squat', muscleGroup: 'Legs', equipment: 'Barbell', instructions: 'Bar on upper back, feet shoulder-width. Descend until thighs parallel. Drive through heels to stand.' },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'Legs', equipment: 'Machine', instructions: 'Feet shoulder-width on platform. Lower with control, press through full foot. Don\'t lock knees.' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'Legs', equipment: 'Barbell', instructions: 'Slight knee bend, hinge at hips. Lower bar along legs. Feel hamstring stretch, drive hips forward.' },
  { id: 'lunges', name: 'Walking Lunges', muscleGroup: 'Legs', equipment: 'Dumbbells', instructions: 'Step forward, lower back knee toward floor. Push through front heel to step. Alternate legs.' },
  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell', instructions: 'Bar at shoulders, press overhead. Lock out at top. Lower with control.' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'Shoulders', equipment: 'Dumbbells', instructions: 'Slight forward lean, raise dumbbells to sides. Lead with elbows. Control the descent.' },
  { id: 'face-pulls', name: 'Face Pulls', muscleGroup: 'Shoulders', equipment: 'Cable', instructions: 'Rope attachment, pull to face level. Externally rotate at end. Great for rear delts.' },
  // Arms
  { id: 'barbell-curl', name: 'Barbell Curl', muscleGroup: 'Arms', equipment: 'Barbell', instructions: 'Elbows at sides, curl bar to shoulders. Control descent. No swinging.' },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'Arms', equipment: 'Cable', instructions: 'Elbows locked at sides. Push bar down, squeeze triceps. Control return.' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'Arms', equipment: 'Dumbbells', instructions: 'Neutral grip, curl to shoulders. Alternating or both arms. Feel bicep and brachialis.' },
  { id: 'skull-crushers', name: 'Skull Crushers', muscleGroup: 'Arms', equipment: 'Barbell', instructions: 'Lie down, bar over chest. Lower to forehead, extend arms. Keep elbows stable.' },
  // Core
  { id: 'plank', name: 'Plank', muscleGroup: 'Core', equipment: 'Bodyweight', instructions: 'Forearms on floor, body straight. Hold position. Engage core and glutes.' },
  { id: 'dead-bug', name: 'Dead Bug', muscleGroup: 'Core', equipment: 'Bodyweight', instructions: 'On back, extend opposite arm and leg. Lower slowly, keep lower back pressed down.' },
];
