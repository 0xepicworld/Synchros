import { StyleSheet, View } from 'react-native';

import { formatClock } from '@/lib/dates';
import { radius, useColors } from '@/theme';

import { IconButton } from './button';
import { T } from './text';

/** Reminder time picker: steps in 15-minute increments, wraps around midnight. */
export function TimeStepper({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}) {
  const c = useColors();
  const step = (delta: number) => {
    const total = (((hour * 60 + minute + delta) % 1440) + 1440) % 1440;
    onChange(Math.floor(total / 60), total % 60);
  };
  return (
    <View style={[styles.wrap, { backgroundColor: c.surface, borderColor: c.line }]}>
      <IconButton icon="minus" label="Earlier by 15 minutes" onPress={() => step(-15)} />
      <T variant="heading" accessibilityLiveRegion="polite" accessibilityLabel={`Reminder at ${formatClock(hour, minute)}`}>
        {formatClock(hour, minute)}
      </T>
      <IconButton icon="plus" label="Later by 15 minutes" onPress={() => step(15)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.field,
    padding: 8,
  },
});
