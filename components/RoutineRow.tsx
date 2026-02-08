import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, PressableProps, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Themed';

type Props = {
  routine: any;
  colors: any;
} & PressableProps;

export function RoutineRow({ routine, colors, ...pressableProps }: Props) {
  return (
    <Pressable
      {...pressableProps}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: routine.color + '25' }]}>
        <MaterialCommunityIcons
          name={routine.icon as any}
          size={24}
          color={routine.color}
        />
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {routine.name}
        </Text>
        <Text
          style={[styles.meta, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {routine.duration} · {routine.difficulty} ·{' '}
          {routine.exercises.length} exercises
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    marginTop: 4,
  },
});
