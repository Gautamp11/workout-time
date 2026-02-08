import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '1:30', seconds: 90 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimerScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [timeLeft, setTimeLeft] = useState(60);
  const [initialTime, setInitialTime] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsRunning(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const start = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(true);
  };

  const pause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
  };

  const reset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    setTimeLeft(initialTime);
  };

  const selectPreset = (seconds: number) => {
    if (!isRunning) {
      setInitialTime(seconds);
      setTimeLeft(seconds);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const isDone = timeLeft === 0 && !isRunning && initialTime > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.display, { backgroundColor: colors.surface }]}>
        <Text
          style={[
            styles.time,
            { color: isDone ? colors.accent : colors.text },
          ]}
        >
          {formatTime(timeLeft)}
        </Text>
        {isDone && (
          <Text style={[styles.doneText, { color: colors.accent }]}>Done!</Text>
        )}
      </View>

      <View style={styles.controls}>
        {!isRunning && timeLeft > 0 && (
          <Pressable
            onPress={start}
            style={[styles.mainBtn, { backgroundColor: colors.accent }]}
          >
            <MaterialCommunityIcons name="play" size={36} color="#fff" />
            <Text style={styles.mainBtnText}>Start</Text>
          </Pressable>
        )}
        {isRunning && (
          <Pressable
            onPress={pause}
            style={[styles.mainBtn, { backgroundColor: colors.warning }]}
          >
            <MaterialCommunityIcons name="pause" size={36} color="#fff" />
            <Text style={styles.mainBtnText}>Pause</Text>
          </Pressable>
        )}
        {(!isRunning && timeLeft === 0) && (
          <Pressable
            onPress={() => selectPreset(initialTime)}
            style={[styles.mainBtn, { backgroundColor: colors.accent }]}
          >
            <MaterialCommunityIcons name="reload" size={36} color="#fff" />
            <Text style={styles.mainBtnText}>Restart</Text>
          </Pressable>
        )}
        {(!isRunning && timeLeft > 0) && (
          <Pressable
            onPress={reset}
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Reset</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.presets}>
        <Text style={[styles.presetLabel, { color: colors.textSecondary }]}>Quick select</Text>
        <View style={styles.presetRow}>
          {PRESETS.map(p => (
            <Pressable
              key={p.seconds}
              onPress={() => selectPreset(p.seconds)}
              disabled={isRunning}
              style={[
                styles.preset,
                {
                  backgroundColor: initialTime === p.seconds ? colors.accent + '25' : colors.surface,
                  borderColor: initialTime === p.seconds ? colors.accent : colors.border,
                  opacity: isRunning ? 0.6 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: initialTime === p.seconds ? colors.accent : colors.text },
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  display: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    marginBottom: 32,
  },
  time: {
    fontSize: 72,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  doneText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  controls: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    minWidth: 200,
  },
  mainBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  presets: {
    marginTop: 'auto',
  },
  presetLabel: {
    fontSize: 13,
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  preset: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
