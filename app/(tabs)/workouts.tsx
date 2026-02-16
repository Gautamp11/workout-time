import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Link, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { RoutineRow } from "@/components/RoutineRow";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useWorkout } from "@/context/WorkoutContext";
import { WORKOUT_ROUTINES } from "@/data/routines";

export default function WorkoutsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const { customRoutines } = useWorkout();
  const routines = [...WORKOUT_ROUTINES, ...customRoutines];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.header, { color: colors.textSecondary }]}>
        Choose a routine and get started
      </Text>
      <Pressable
        onPress={() => router.push("/add-workout")}
        style={[
          styles.addExerciseBtn,
          { borderColor: colors.accent, borderStyle: "dashed" },
        ]}
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.accent} />
        <Text style={[styles.addExerciseText, { color: colors.accent }]}>
          Add Custom Workout
        </Text>
      </Pressable>
      {routines.map((routine, i) => (
        <Animated.View
          key={routine.id}
          entering={FadeInDown.delay(i * 80).springify()}
          style={styles.rowWrapper}
        >
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
  addExerciseText: { fontSize: 16, fontWeight: "600" },
  addExerciseBtn: {
    width: "100%",
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
  rowWrapper: {
    marginBottom: 8,
  },
});
