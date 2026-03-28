import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, borderRadius, fontFamily, space } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  isPassword,
  style,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? colors.error.DEFAULT
    : focused
      ? colors.accent.DEFAULT
      : colors.border;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, { borderColor }]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithIcon, style]}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent.DEFAULT}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    height: 48,
  },
  leftIcon: {
    paddingLeft: space.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: space.md,
    fontSize: 15,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  inputWithIcon: {
    paddingLeft: space.sm,
  },
  eyeButton: {
    paddingRight: space.md,
    paddingLeft: space.sm,
  },
  error: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.error.DEFAULT,
  },
  hint: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
});
