import { useState } from 'react';
import { StyleSheet, ScrollView, View, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/Themed';
import { useExercises } from '@/context/ExerciseContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
const EQUIPMENT_OPTIONS = ['Bodyweight', 'Dumbbells', 'Barbell', 'Cable', 'Machine', 'Kettlebells', 'Bands', 'Other'];

export default function AddExerciseScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { addCustomExercise } = useExercises();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('Chest');
  const [equipment, setEquipment] = useState('Dumbbells');
  const [instructions, setInstructions] = useState('');

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addCustomExercise({
      name: trimmedName,
      muscleGroup,
      equipment,
      instructions: instructions.trim() || 'Add your own instructions for this exercise.',
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { color: colors.textSecondary }]}>Exercise name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Cable Crossover"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Muscle group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {MUSCLE_GROUPS.map(mg => (
            <Pressable
              key={mg}
              onPress={() => setMuscleGroup(mg)}
              style={[
                styles.chip,
                {
                  backgroundColor: muscleGroup === mg ? colors.accent : colors.surface,
                  borderColor: muscleGroup === mg ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: muscleGroup === mg ? '#fff' : colors.text }]}>
                {mg}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Equipment</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {EQUIPMENT_OPTIONS.map(eq => (
            <Pressable
              key={eq}
              onPress={() => setEquipment(eq)}
              style={[
                styles.chip,
                {
                  backgroundColor: equipment === eq ? colors.accent : colors.surface,
                  borderColor: equipment === eq ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: equipment === eq ? '#fff' : colors.text }]}>
                {eq}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Instructions (optional)</Text>
        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          placeholder="How to perform this exercise..."
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            styles.instructionsInput,
            { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
          ]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Pressable
          onPress={handleSave}
          disabled={!name.trim()}
          style={[
            styles.saveBtn,
            {
              backgroundColor: name.trim() ? colors.accent : colors.border,
              opacity: name.trim() ? 1 : 0.7,
            },
          ]}
        >
          <MaterialCommunityIcons name="check" size={24} color="#fff" />
          <Text style={styles.saveBtnText}>Add Exercise</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  instructionsInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  chipScroll: {
    marginBottom: 8,
    maxHeight: 44,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 32,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
