import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/Themed';
import { useWorkout } from '@/context/WorkoutContext';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const DIFFICULTIES: Array<'beginner' | 'intermediate' | 'advanced'> = [
  'beginner',
  'intermediate',
  'advanced',
];

const COLOR_OPTIONS = ['#00D4AA', '#7C3AED', '#F59E0B', '#EC4899', '#06B6D4', '#10B981', '#EF4444'];

export default function AddWorkoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { addCustomRoutine } = useWorkout();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('45 min');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [accentColor, setAccentColor] = useState(COLOR_OPTIONS[0]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const id = addCustomRoutine({
      name: trimmedName,
      description: description.trim() || 'Custom workout routine',
      duration: duration.trim() || '45 min',
      difficulty,
      exercises: [],
      icon: 'dumbbell',
      color: accentColor,
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace(`/workout/${id}`);
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
        <Text style={[styles.label, { color: colors.textSecondary }]}>Workout name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Upper Body Pump"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Short description of this workout"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Duration</Text>
        <TextInput
          value={duration}
          onChangeText={setDuration}
          placeholder="e.g. 45 min"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Difficulty</Text>
        <View style={styles.chipRow}>
          {DIFFICULTIES.map(level => (
            <Pressable
              key={level}
              onPress={() => setDifficulty(level)}
              style={[
                styles.chip,
                {
                  backgroundColor: difficulty === level ? colors.accent : colors.surface,
                  borderColor: difficulty === level ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: difficulty === level ? '#fff' : colors.text }]}>
                {level[0].toUpperCase() + level.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Color</Text>
        <View style={styles.colorRow}>
          {COLOR_OPTIONS.map(color => (
            <Pressable
              key={color}
              onPress={() => setAccentColor(color)}
              style={[
                styles.colorDotWrap,
                { borderColor: accentColor === color ? colors.text : 'transparent' },
              ]}
            >
              <View style={[styles.colorDot, { backgroundColor: color }]} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleSave}
          disabled={!name.trim()}
          style={[
            styles.saveBtn,
            { backgroundColor: name.trim() ? colors.accent : colors.border, opacity: name.trim() ? 1 : 0.7 },
          ]}
        >
          <MaterialCommunityIcons name="check" size={24} color="#fff" />
          <Text style={styles.saveBtnText}>Create Workout</Text>
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
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorDotWrap: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 2,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
