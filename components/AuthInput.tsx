import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface AuthInputProps extends TextInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  isPassword?: boolean;
  label?: string;
}

export const AuthInput = forwardRef<TextInput, AuthInputProps>(
  ({ icon, error, isPassword, label, style, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);

    const borderColor = error
      ? Colors.danger
      : focused
      ? Colors.primary
      : Colors.cardBorder;

    return (
      <View style={styles.wrapper}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={[styles.inputRow, { borderColor }]}>
          <Ionicons
            name={icon}
            size={18}
            color={error ? Colors.danger : focused ? Colors.primary : Colors.textMuted}
            style={styles.icon}
          />
          <TextInput
            ref={ref}
            style={styles.input}
            placeholderTextColor={Colors.textMuted}
            selectionColor={Colors.primary}
            secureTextEntry={isPassword && !showPassword}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...props}
          />
          {isPassword ? (
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }
);

AuthInput.displayName = 'AuthInput';

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  icon: {
    width: 20,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },
  eyeBtn: {
    padding: 2,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
