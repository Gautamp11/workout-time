import { StyleSheet, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useExercises } from '@/context/ExerciseContext';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { getExercise } = useExercises();

  const exercise = id ? getExercise(id) : undefined;
  if (!exercise) return null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.accent + '25' }]}>
        <MaterialCommunityIcons name="dumbbell" size={64} color={colors.accent} />
      </View>
      <Text style={[styles.name, { color: colors.text }]}>{exercise.name}</Text>
      <View style={styles.tags}>
        <View style={[styles.tag, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="weight" size={16} color={colors.textSecondary} />
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>{exercise.muscleGroup}</Text>
        </View>
        <View style={[styles.tag, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="hammer-wrench" size={16} color={colors.textSecondary} />
          <Text style={[styles.tagText, { color: colors.textSecondary }]}>{exercise.equipment}</Text>
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions</Text>
        <Text style={[styles.instructions, { color: colors.textSecondary }]}>
          {exercise.instructions}
        </Text>
      </View>

      <View style={[styles.tip, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
        <MaterialCommunityIcons name="lightbulb-outline" size={24} color={colors.accent} />
        <Text style={[styles.tipText, { color: colors.text }]}>
          Focus on controlled movements and proper form. If unsure, consider watching a video tutorial for this exercise.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 28,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  instructions: {
    fontSize: 15,
    lineHeight: 24,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
});
