import { Text, TextProps } from 'react-native';

import { Palette, type as typeScale, TypeVariant, useColors } from '@/theme';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: keyof Palette;
  center?: boolean;
};

export function T({ variant = 'body', color = 'ink', center, style, ...rest }: Props) {
  const c = useColors();
  return (
    <Text
      {...rest}
      maxFontSizeMultiplier={1.6}
      style={[typeScale[variant], { color: c[color] }, center && { textAlign: 'center' }, style]}
    />
  );
}
