import { ExerciseRow } from '@/components/ExerciseRow';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useExercises } from '@/context/ExerciseContext';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function ExercisesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { allExercises } = useExercises();
  const [filter, setFilter] = useState('All');

  const muscleGroups = ['All', ...new Set(allExercises.map(e => e.muscleGroup))];
  const filtered = filter === 'All'
    ? allExercises
    : allExercises.filter(e => e.muscleGroup === filter);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.filterWrapper, { backgroundColor: colors.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          style={styles.filterScroll}
        >
          {muscleGroups.map(group => (
            <Pressable
              key={group}
              onPress={() => setFilter(group)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === group ? colors.accent : colors.surface,
                  borderColor: filter === group ? colors.accent : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === group ? '#fff' : colors.text },
                ]}
                numberOfLines={1}
              >
                {group}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map(exercise => (
          <Link key={exercise.id} href={`/exercise/${exercise.id}`} asChild>
            <ExerciseRow exercise={exercise} colors={colors} />
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
  },
  list: { flex: 1 },
  listContent: { padding: 20, paddingTop: 0, paddingBottom: 40 },
});
