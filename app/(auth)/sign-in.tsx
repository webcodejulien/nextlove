import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { AuthInput } from '../../components/AuthInput';

const { width } = Dimensions.get('window');

function validateEmail(email: string) {
  if (!email.trim()) return 'Email requis';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Format d\'email invalide';
  return null;
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect';
  if (msg.includes('Email not confirmed')) return 'Confirmez d\'abord votre email';
  if (msg.includes('Too many requests')) return 'Trop de tentatives. Réessayez plus tard';
  return 'Une erreur est survenue. Réessayez.';
}

export default function SignInScreen() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  const passwordRef = useRef<TextInput>(null);

  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password && !password ? 'Mot de passe requis' : null;

  const isFormValid = !validateEmail(email) && password.length > 0;

  const handleSignIn = useCallback(async () => {
    setTouched({ email: true, password: true });
    if (!isFormValid) return;

    setLoading(true);
    setGlobalError(null);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // Navigation handled by _layout.tsx auth guard
    } catch (err: any) {
      setGlobalError(translateError(err.message ?? ''));
    } finally {
      setLoading(false);
    }
  }, [email, password, isFormValid, signIn]);

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      {/* Blobs */}
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <LinearGradient colors={Colors.gradientAccent} style={styles.logoCircle}>
                <Ionicons name="heart" size={28} color="#FFF" />
              </LinearGradient>
              <Text style={styles.title}>Bon retour</Text>
              <Text style={styles.subtitle}>
                Connectez-vous pour retrouver vos matches
              </Text>
            </View>

            {/* Global error */}
            {globalError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorBannerText}>{globalError}</Text>
              </View>
            ) : null}

            {/* Form */}
            <View style={styles.form}>
              <AuthInput
                icon="mail"
                placeholder="votre@email.com"
                label="Email"
                value={email}
                onChangeText={setEmail}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <AuthInput
                ref={passwordRef}
                icon="lock-closed"
                placeholder="Votre mot de passe"
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                error={passwordError}
                isPassword
                autoCapitalize="none"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />

              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotBtn}
              >
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.ctaWrapper}
            >
              <LinearGradient
                colors={Colors.gradientAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.ctaText}>Se connecter</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Signup link */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Pas encore de compte ?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
                <Text style={styles.switchLink}> S'inscrire</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.12,
  },
  blob1: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: Colors.primary,
    top: -width * 0.2,
    right: -width * 0.2,
  },
  blob2: {
    width: width * 0.5,
    height: width * 0.5,
    backgroundColor: Colors.accent,
    bottom: -width * 0.1,
    left: -width * 0.15,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 36,
    gap: 12,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,82,82,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.35)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  form: {
    gap: 18,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -6,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  ctaText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  switchText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  switchLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
