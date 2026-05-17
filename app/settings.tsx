import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

// ─── Row générique ─────────────────────────────────────────────────────────────

function Row({
  icon,
  label,
  value,
  onPress,
  danger,
  rightEl,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  rightEl?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons
          name={icon as any}
          size={16}
          color={danger ? Colors.danger : Colors.primary}
        />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      <View style={styles.rowRight}>
        {rightEl ?? (
          <>
            {value && <Text style={styles.rowValue}>{value}</Text>}
            {onPress && (
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Card section ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <LinearGradient colors={Colors.gradientCard} style={styles.card}>
        {children}
      </LinearGradient>
    </View>
  );
}

// ─── Champ texte inline ────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  // ── Masquer le profil ─────────────────────────────────────────────────────
  const [profileHidden, setProfileHidden] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('users')
      .select('is_active')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfileHidden(data.is_active === false);
      });
  }, [user?.id]);

  const toggleProfileHidden = async (value: boolean) => {
    setProfileHidden(value);
    try {
      await supabase
        .from('users')
        .update({ is_active: !value })
        .eq('id', user?.id ?? '');
    } catch {
      setProfileHidden(!value);
      Alert.alert('Erreur', 'Impossible de modifier la visibilité du profil.');
    }
  };

  // ── Changer email ──────────────────────────────────────────────────────────
  const [emailSection, setEmailSection] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !emailPassword.trim()) {
      Alert.alert('Erreur', 'Remplis tous les champs.');
      return;
    }
    setSavingEmail(true);
    try {
      // Re-authentifier d'abord
      const { error: reAuthErr } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: emailPassword,
      });
      if (reAuthErr) throw new Error('Mot de passe incorrect.');

      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw new Error(error.message);

      Alert.alert(
        '✉️ Confirmation envoyée',
        `Un lien de confirmation a été envoyé à ${newEmail.trim()}. Clique dessus pour valider le changement.`,
        [{ text: 'OK', onPress: () => { setEmailSection(false); setNewEmail(''); setEmailPassword(''); } }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de changer l\'email.');
    } finally {
      setSavingEmail(false);
    }
  };

  // ── Changer mot de passe ──────────────────────────────────────────────────
  const [pwSection, setPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Erreur', 'Remplis tous les champs.');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setSavingPw(true);
    try {
      // Re-authentifier
      const { error: reAuthErr } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: currentPw,
      });
      if (reAuthErr) throw new Error('Mot de passe actuel incorrect.');

      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw new Error(error.message);

      Alert.alert('✅ Mot de passe modifié', 'Ton mot de passe a été mis à jour avec succès.', [
        { text: 'OK', onPress: () => { setPwSection(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); } },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de changer le mot de passe.');
    } finally {
      setSavingPw(false);
    }
  };

  // ── Supprimer le compte ───────────────────────────────────────────────────
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Supprimer mon compte',
      'Cette action est irréversible. Ton profil, tes matchs et tes messages seront définitivement supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              if (user?.id) {
                await supabase.from('users').update({ is_active: false }).eq('id', user.id);
              }
              await signOut();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer le compte. Contacte le support.');
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

  // ── Déconnexion ──────────────────────────────────────────────────────────
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await signOut(); } catch {}
    setLoggingOut(false);
  };

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Paramètres</Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Email actuel */}
            <Section title="Compte">
              <Row
                icon="mail-outline"
                label="Email"
                value={user?.email ?? '—'}
              />
              <Row
                icon="pencil-outline"
                label="Changer l'email"
                onPress={() => { setEmailSection(!emailSection); setPwSection(false); }}
              />

              {emailSection && (
                <View style={styles.expandedForm}>
                  <Field
                    label="Nouvel email"
                    value={newEmail}
                    onChange={setNewEmail}
                    placeholder="nouveau@email.com"
                    keyboardType="email-address"
                  />
                  <Field
                    label="Ton mot de passe actuel"
                    value={emailPassword}
                    onChange={setEmailPassword}
                    placeholder="••••••••"
                    secureTextEntry
                  />
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleChangeEmail}
                    disabled={savingEmail}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={Colors.gradientPrimary}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.saveBtnInner}
                    >
                      {savingEmail
                        ? <ActivityIndicator color="#FFF" size="small" />
                        : <Text style={styles.saveBtnText}>Enregistrer</Text>
                      }
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              <Row
                icon="key-outline"
                label="Changer le mot de passe"
                onPress={() => { setPwSection(!pwSection); setEmailSection(false); }}
              />

              {pwSection && (
                <View style={styles.expandedForm}>
                  <Field
                    label="Mot de passe actuel"
                    value={currentPw}
                    onChange={setCurrentPw}
                    placeholder="••••••••"
                    secureTextEntry
                  />
                  <Field
                    label="Nouveau mot de passe"
                    value={newPw}
                    onChange={setNewPw}
                    placeholder="8 caractères minimum"
                    secureTextEntry
                  />
                  <Field
                    label="Confirmer"
                    value={confirmPw}
                    onChange={setConfirmPw}
                    placeholder="••••••••"
                    secureTextEntry
                  />
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleChangePassword}
                    disabled={savingPw}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={Colors.gradientPrimary}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.saveBtnInner}
                    >
                      {savingPw
                        ? <ActivityIndicator color="#FFF" size="small" />
                        : <Text style={styles.saveBtnText}>Enregistrer</Text>
                      }
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </Section>

            {/* Visibilité */}
            <Section title="Visibilité">
              <Row
                icon="eye-off-outline"
                label="Masquer mon profil"
                danger={profileHidden}
                rightEl={
                  <Switch
                    value={profileHidden}
                    onValueChange={toggleProfileHidden}
                    trackColor={{ true: Colors.danger, false: Colors.cardBorder }}
                    thumbColor="#FFF"
                  />
                }
              />
            </Section>

            {/* Sécurité */}
            <Section title="Sécurité & Confidentialité">
              <Row
                icon="shield-outline"
                label="Politique de confidentialité"
                onPress={() => router.push('/legal/privacy')}
              />
              <Row
                icon="document-text-outline"
                label="Conditions d'utilisation"
                onPress={() => router.push('/legal/cgu')}
              />
              <Row
                icon="mail-outline"
                label="Support"
                value="support@nextlove.app"
              />
            </Section>

            {/* Infos app */}
            <Section title="À propos">
              <Row icon="phone-portrait-outline" label="Version" value="1.0.0" />
              <Row
                icon="heart-outline"
                label="Laisser un avis"
                onPress={() => Alert.alert('Merci !', 'La fonctionnalité App Store arrivera bientôt.')}
              />
            </Section>

            {/* Déconnexion */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                disabled={loggingOut}
                activeOpacity={0.8}
              >
                {loggingOut
                  ? <ActivityIndicator size="small" color={Colors.danger} />
                  : <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
                }
                <Text style={styles.logoutText}>
                  {loggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Supprimer le compte */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
              activeOpacity={0.7}
            >
              {deletingAccount
                ? <ActivityIndicator size="small" color={Colors.textMuted} />
                : <Ionicons name="trash-outline" size={14} color={Colors.textMuted} />
              }
              <Text style={styles.deleteBtnText}>
                {deletingAccount ? 'Suppression...' : 'Supprimer mon compte'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  headerTitle: { color: Colors.text, fontSize: 18, fontWeight: '800' },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    color: Colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  card: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.cardBorder,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14,
    gap: 12, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  rowIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(255,107,157,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: 'rgba(255,82,82,0.12)' },
  rowLabel: { flex: 1, color: Colors.text, fontSize: 14, fontWeight: '500' },
  rowLabelDanger: { color: Colors.danger },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { color: Colors.textMuted, fontSize: 13 },

  expandedForm: {
    paddingHorizontal: 14, paddingBottom: 14, paddingTop: 6, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
    backgroundColor: 'rgba(255,107,157,0.04)',
  },
  field: { gap: 5 },
  fieldLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  fieldInput: {
    backgroundColor: Colors.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    color: Colors.text, fontSize: 14,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  saveBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  saveBtnInner: {
    paddingVertical: 13, alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
    backgroundColor: 'rgba(255,82,82,0.08)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,82,82,0.2)',
  },
  logoutText: { color: Colors.danger, fontSize: 15, fontWeight: '700' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 16, paddingVertical: 14,
  },
  deleteBtnText: { color: Colors.textMuted, fontSize: 13 },
});
