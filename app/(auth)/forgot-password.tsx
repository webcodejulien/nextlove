import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { AuthInput } from '../../components/AuthInput';

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const emailError = touched
    ? !email.trim()
      ? 'Email requis'
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Format invalide'
      : null
    : null;

  const handleReset = useCallback(async () => {
    setTouched(true);
    if (!email.trim() || emailError) return;

    setLoading(true);
    setError(null);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSuccess(true);
    } catch {
      setError('Impossible d\'envoyer l\'email. Vérifiez l\'adresse et réessayez.');
    } finally {
      setLoading(false);
    }
  }, [email, emailError, resetPassword]);

  if (success) {
    return (
      <LinearGradient colors={Colors.gradientDark} style={styles.container}>
        <View style={[styles.blob, styles.blob1]} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.successContent}>
            <LinearGradient colors={Colors.gradientAccent} style={styles.successIcon}>
              <Ionicons name="checkmark" size={36} color="#FFF" />
            </LinearGradient>
            <Text style={styles.successTitle}>Email envoyé !</Text>
            <Text style={styles.successSubtitle}>
              Un lien de réinitialisation a été envoyé à{'\n'}
              <Text style={styles.successEmail}>{email}</Text>
            </Text>
            <Text style={styles.successHint}>
              Le lien expire dans 60 minutes. Vérifiez également vos spams.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/sign-in')}
              style={styles.returnWrapper}
            >
              <LinearGradient
                colors={Colors.gradientAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.returnButton}
              >
                <Text style={styles.returnText}>Retour à la connexion</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.content}>
            {/* Back */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <LinearGradient
                  colors={['rgba(255,107,157,0.2)', 'rgba(107,53,217,0.2)']}
                  style={styles.iconBg}
                >
                  <Ionicons name="lock-open" size={32} color={Colors.primary} />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Mot de passe oublié</Text>
              <Text style={styles.subtitle}>
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <AuthInput
              icon="mail"
              placeholder="votre@email.com"
              label="Adresse email"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched(true)}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleReset}
            />

            {/* CTA */}
            <TouchableOpacity
              onPress={handleReset}
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
                    <Ionicons name="send" size={18} color="#FFF" />
                    <Text style={styles.ctaText}>Envoyer le lien</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
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
    right: -width * 0.15,
  },
  blob2: {
    width: width * 0.45,
    height: width * 0.45,
    backgroundColor: Colors.accent,
    bottom: -width * 0.1,
    left: -width * 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
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
    gap: 14,
    marginTop: 20,
    marginBottom: 10,
  },
  iconWrapper: { alignItems: 'center' },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,157,0.25)',
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
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
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  ctaWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
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
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  // Success state
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 18,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 8,
  },
  successTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  successSubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  successEmail: {
    color: Colors.primary,
    fontWeight: '700',
  },
  successHint: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  returnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  returnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
