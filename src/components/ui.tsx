import React, { useEffect, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { audio } from '../audio/engine';
import { C, FONT } from '../theme';

export function PxText({
  children,
  size = 12,
  color = C.text,
  style,
  shadow = true,
  numberOfLines,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  shadow?: boolean;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: FONT,
          fontSize: size,
          lineHeight: Math.round(size * 1.5),
          color,
        },
        shadow && { textShadowColor: C.ink, textShadowOffset: { width: Math.max(1, size / 8), height: Math.max(1, size / 8) }, textShadowRadius: 0 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function PxButton({
  label,
  onPress,
  color = C.gold,
  textColor = C.ink,
  size = 14,
  disabled,
  style,
  small,
}: {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => {
        audio.unlock();
        audio.sfx('click');
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: disabled ? C.lock : color, transform: [{ translateY: pressed ? 3 : 0 }], borderBottomWidth: pressed ? 3 : 6 },
        style,
      ]}
    >
      <PxText size={size} color={disabled ? '#2a2238' : textColor} shadow={false} style={{ textAlign: 'center' }}>
        {label}
      </PxText>
    </Pressable>
  );
}

/** Relógio de animação para telas fora da partida. */
export function useTicker(fps = 12): number {
  const [t, setT] = useState(() => performance.now() / 1000);
  useEffect(() => {
    const id = setInterval(() => setT(performance.now() / 1000), 1000 / fps);
    return () => clearInterval(id);
  }, [fps]);
  return t;
}

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderWidth: 3,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSmall: { paddingHorizontal: 12, paddingVertical: 9 },
  panel: {
    backgroundColor: C.panel,
    borderWidth: 3,
    borderColor: C.ink,
    padding: 14,
  },
});
