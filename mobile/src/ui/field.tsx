import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { font, radius, useColors } from '@/theme';

import { T } from './text';

type Props = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
  multiline?: boolean;
  minHeight?: number;
};

export const Field = forwardRef<TextInput, Props>(function Field(
  { label, hint, error, multiline, minHeight = 120, style, ...rest },
  ref,
) {
  const c = useColors();
  return (
    <View style={styles.wrap}>
      <T variant="small" color="inkSoft" nativeID={`${label}-label`}>
        {label}
      </T>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${label}-label`}
        placeholderTextColor={c.inkSoft}
        selectionColor={c.inner}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        maxFontSizeMultiplier={1.6}
        {...rest}
        style={[
          styles.input,
          {
            color: c.ink,
            backgroundColor: c.surface,
            borderColor: error ? c.danger : c.line,
            minHeight: multiline ? minHeight : 52,
            paddingTop: multiline ? 14 : 0,
            paddingBottom: multiline ? 14 : 0,
          },
          style,
        ]}
      />
      {error ? (
        <T variant="caption" color="danger">
          {error}
        </T>
      ) : hint ? (
        <T variant="caption" color="inkSoft">
          {hint}
        </T>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.field,
    paddingHorizontal: 16,
    fontFamily: font.body,
    fontSize: 17,
    lineHeight: 24,
  },
});
