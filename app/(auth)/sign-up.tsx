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
import { useConsent } from '../../contexts/ConsentContext';

const { width } = Dimensions.get('window');

// ─── Validators ──────────────────────────────────────────────────────────────

function validateName(v: string) {
  if (!v.trim()) return 'Prénom requis';
  if (v.trim().length < 2) return '2 caractères minimum';
  return null;
}

function validateEmail(v: string) {
  if (!v.trim()) return 'Email requis';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Format invalide';
  return null;
}

function validatePassword(v: string) {
  if (!v) return 'Mot de passe requis';
  if (v.length < 8) return '8 caractères minimum';
  return null;
}

function validateConfirm(password: string, confirm: string) {
  if (!confirm) return 'Confirmez le mot de passe';
  if (password !== confirm) return 'Les mots de passe ne correspondent pas';
  return null;
}

function translateError(msg: string): string {
  if (msg.includes('User already registered')) return 'Un compte existe déjà avec cet email';
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit faire 8 caractères minimum';
  if (msg.includes('Unable to validate email')) return 'Email invalide';
  return 'Une erreur est survenue. Réessayez.';
}

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(p: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!p) return { level: 0, label: '', color: '' };
  const checks = [
    p.length >= 8,
    /[a-z]/.test(p),
    /[A-Z]/.test(p),
    /\d/.test(p),
    /[^a-zA-Z0-9]/.test(p),
  ].filter(Boolean).length;
  if (checks <= 2) return { level: 1, label: 'Faible', color: Colors.danger };
  if (checks <= 3) return { level: 2, label: 'Moyen', color: Colors.warning };
  return { level: 3, label: 'Fort', color: Colors.success };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { acceptAll } = useConsent();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [cguAccepted, setCguAccepted] = useState(false);
  const [cguTouched, setCguTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirm: false,
  });

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const errors = {
    name: touched.name ? validateName(name) : null,
    email: touched.email ? validateEmail(email) : null,
    password: touched.password ? validatePassword(password) : null,
    confirm: touched.confirm ? validateConfirm(password, confirm) : null,
  };

  const strength = getStrength(password);

  const isFormValid =
    !validateName(name) &&
    !validateEmail(email) &&
    !validatePassword(password) &&
    !validateConfirm(password, confirm) &&
    cguAccepted;

  const touch = (field: keyof typeof touched) =>
    setTouched((t) => ({ ...t, [field]: true }));

  const handleSignUp = useCallback(async () => {
    setTouched({ name: true, email: true, password: true, confirm: true });
    setCguTouched(true);
    if (!isFormValid) return;

    setLoading(true);
    setGlobalError(null);
    try {
      await signUp(email.trim().toLowerCase(), password, name.trim());
      // Accepter le consentement RGPD lors de l'inscription
      await acceptAll();
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (err: any) {
      setGlobalError(translateError(err.message ?? ''));
    } finally {
      setLoading(false);
    }
  }, [name, email, password, isFormValid, signUp, acceptAll]);

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />
      <View style={[styles.blob, styles.blob3]} />

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
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>
                Rejoignez NextLove et trouvez votre âme sœur
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
                icon="person"
                placeholder="Votre prénom"
                label="Prénom"
                value={name}
                onChangeText={setName}
                onBlur={() => touch('name')}
                error={errors.name}
                autoCapitalize="words"
                autoComplete="given-name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />

              <AuthInput
                ref={emailRef}
                icon="mail"
                placeholder="votre@email.com"
                label="Email"
                value={email}
                onChangeText={setEmail}
                onBlur={() => touch('email')}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <View style={styles.passwordField}>
                <AuthInput
                  ref={passwordRef}
                  icon="lock-closed"
                  placeholder="8 caractères minimum"
                  label="Mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => touch('password')}
                  error={errors.password}
                  isPassword
                  autoCapitalize="none"
                  autoComplete="new-password"
                  returnKeyType="next"
                  onSubmitEditing={() => confirmRef.current?.focus()}
                />
                {/* Strength indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    <View style={styles.strengthBars}>
                      {[1, 2, 3].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.strengthBar,
                            {
                              backgroundColor:
                                strength.level >= i ? strength.color : Colors.cardBorder,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  </View>
                )}
              </View>

              <AuthInput
                ref={confirmRef}
                icon="lock-closed"
                placeholder="Répétez le mot de passe"
                label="Confirmer le mot de passe"
                value={confirm}
                onChangeText={setConfirm}
                onBlur={() => touch('confirm')}
                error={errors.confirm}
                isPassword
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />

              {/* Match indicator */}
              {confirm.length > 0 && !errors.confirm && (
                <View style={styles.matchRow}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.matchText}>Les mots de passe correspondent</Text>
                </View>
              )}
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSignUp}
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
                    <Text style={styles.ctaText}>Créer mon compte</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* CGU Checkbox */}
            <TouchableOpacity
              style={[
                styles.cguRow,
                cguTouched && !cguAccepted && styles.cguRowError,
              ]}
              onPress={() => { setCguAccepted(v => !v); setCguTouched(true); }}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, cguAccepted && styles.checkboxChecked]}>
                {cguAccepted && <Ionicons name="checkmark" size={13} color="#FFF" />}
              </View>
              <Text style={styles.cguText}>
                J'accepte les{' '}
                <Text
                  style={styles.cguLink}
                  onPress={() => router.push('/legal/cgu')}
                >
                  Conditions d'utilisation
                </Text>
                {' '}et la{' '}
                <Text
                  style={styles.cguLink}
                  onPress={() => router.push('/legal/privacy')}
                >
                  Politique de confidentialité
                </Text>
                {' '}de NextLove
              </Text>
            </TouchableOpacity>
            {cguTouched && !cguAccepted && (
              <Text style={styles.cguError}>
                Vous devez accepter les CGU pour continuer
              </Text>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Déjà un compte ?</Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                <Text style={styles.switchLink}> Se connecter</Text>
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
    opacity: 0.11,
  },
  blob1: {
    width: width * 0.65,
    height: width * 0.65,
    backgroundColor: Colors.primary,
    top: -width * 0.2,
    right: -width * 0.2,
  },
  blob2: {
    width: width * 0.5,
    height: width * 0.5,
    backgroundColor: Colors.accent,
    bottom: width * 0.1,
    left: -width * 0.15,
  },
  blob3: {
    width: width * 0.35,
    height: width * 0.35,
    backgroundColor: Colors.secondary,
    bottom: -width * 0.05,
    right: -width * 0.05,
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
    marginTop: 28,
    marginBottom: 32,
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
    fontSize: 28,
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
  passwordField: {
    gap: 8,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 2,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
  },
  matchText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '500',
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
  cguRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 16,
    padding: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cguRowError: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(255,82,82,0.05)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cguText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  cguLink: {
    color: Colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  cguError: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
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
