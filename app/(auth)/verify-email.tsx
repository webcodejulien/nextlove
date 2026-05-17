import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { resendVerification } = useAuth();

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setSending(true);
    setError(null);
    try {
      await resendVerification(email);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch {
      setError('Impossible de renvoyer l\'email. Réessayez dans quelques instants.');
    } finally {
      setSending(false);
    }
  };

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <View style={[styles.blob, styles.blob1]} />
      <View style={[styles.blob, styles.blob2]} />

      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Illustration */}
          <View style={styles.illustration}>
            <LinearGradient
              colors={['rgba(255,107,157,0.2)', 'rgba(107,53,217,0.2)']}
              style={styles.illustrationBg}
            >
              <LinearGradient colors={Colors.gradientAccent} style={styles.illustrationInner}>
                <Ionicons name="mail" size={44} color="#FFF" />
              </LinearGradient>
            </LinearGradient>

            {/* Animated dots */}
            <View style={styles.dotsRow}>
              {[Colors.primary, Colors.secondary, Colors.accent].map((color, i) => (
                <View key={i} style={[styles.dot, { backgroundColor: color }]} />
              ))}
            </View>
          </View>

          {/* Text */}
          <Text style={styles.title}>Vérifiez votre email</Text>
          <Text style={styles.subtitle}>
            Nous avons envoyé un lien de confirmation à
          </Text>
          <View style={styles.emailPill}>
            <Ionicons name="mail-outline" size={14} color={Colors.primary} />
            <Text style={styles.emailText}>{email ?? 'votre adresse email'}</Text>
          </View>
          <Text style={styles.instruction}>
            Cliquez sur le lien dans l'email pour activer votre compte.{'\n'}
            Pensez à vérifier vos spams.
          </Text>

          {/* Resend feedback */}
          {sent && (
            <View style={styles.sentBanner}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.sentText}>Email renvoyé avec succès !</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleResend}
              disabled={sending}
              activeOpacity={0.85}
              style={styles.resendWrapper}
            >
              <LinearGradient
                colors={Colors.gradientAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resendButton}
              >
                {sending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={18} color="#FFF" />
                    <Text style={styles.resendText}>Renvoyer l'email</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/(auth)/sign-in')}
              style={styles.signinBtn}
            >
              <Text style={styles.signinText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </View>

          {/* Help */}
          <View style={styles.helpCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.helpText}>
              L'email peut prendre quelques minutes. Une fois confirmé, connectez-vous pour accéder à l'app.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.11,
  },
  blob1: {
    width: width * 0.7,
    height: width * 0.7,
    backgroundColor: Colors.primary,
    top: -width * 0.25,
    right: -width * 0.2,
  },
  blob2: {
    width: width * 0.5,
    height: width * 0.5,
    backgroundColor: Colors.accent,
    bottom: -width * 0.1,
    left: -width * 0.1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  illustration: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  illustrationBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,157,0.25)',
  },
  illustrationInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,157,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.25)',
  },
  emailText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  instruction: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  sentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,230,118,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  sentText: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,82,82,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  resendWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
  },
  resendText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signinBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
  },
  signinText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  helpCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    width: '100%',
    marginTop: 4,
  },
  helpText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
});
