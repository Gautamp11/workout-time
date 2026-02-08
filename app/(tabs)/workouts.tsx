import { Link } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { RoutineRow } from '@/components/RoutineRow';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { WORKOUT_ROUTINES } from '@/data/routines';

export default function WorkoutsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.header, { color: colors.textSecondary }]}>
        Choose a routine and get started
      </Text>
      {WORKOUT_ROUTINES.map((routine, i) => (
        <Animated.View key={routine.id} entering={FadeInDown.delay(i * 80).springify()} style={styles.rowWrapper}>
          <Link href={`/workout/${routine.id}`} asChild>
            <RoutineRow routine={routine} colors={colors} />
          </Link>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    fontSize: 14,
    marginBottom: 16,
  },
  rowWrapper: {
    marginBottom: 8,
  },
});
