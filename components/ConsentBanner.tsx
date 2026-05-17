import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { useConsent, ConsentChoices } from '../contexts/ConsentContext';
import { APP_NAME } from '../constants/legalContent';

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  icon,
  title,
  description,
  value,
  onChange,
  locked,
}: {
  icon: string;
  title: string;
  description: string;
  value: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <View style={toggleStyles.row}>
      <View style={toggleStyles.iconWrap}>
        <Ionicons name={icon as any} size={16} color={locked ? Colors.textMuted : Colors.primary} />
      </View>
      <View style={toggleStyles.text}>
        <View style={toggleStyles.titleRow}>
          <Text style={toggleStyles.title}>{title}</Text>
          {locked && (
            <View style={toggleStyles.requiredBadge}>
              <Text style={toggleStyles.requiredText}>Requis</Text>
            </View>
          )}
        </View>
        <Text style={toggleStyles.desc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={locked}
        trackColor={{ false: Colors.surface, true: Colors.primary }}
        thumbColor={Platform.OS === 'android' ? (value ? Colors.primary : Colors.textMuted) : undefined}
        ios_backgroundColor={Colors.surface}
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,157,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  text: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  desc: { color: Colors.textMuted, fontSize: 11, lineHeight: 15 },
  requiredBadge: {
    backgroundColor: 'rgba(255,107,157,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.3)',
  },
  requiredText: { color: Colors.primary, fontSize: 10, fontWeight: '700' },
});

// ─── Customise panel ──────────────────────────────────────────────────────────

function CustomizePanel({
  choices,
  onChange,
}: {
  choices: Omit<ConsentChoices, 'essential'>;
  onChange: (key: keyof Omit<ConsentChoices, 'essential'>, val: boolean) => void;
}) {
  return (
    <View style={customStyles.container}>
      <ToggleRow
        icon="shield-checkmark"
        title="Cookies essentiels"
        description="Authentification, préférences de l'app. Indispensables au fonctionnement."
        value={true}
        locked
      />
      <ToggleRow
        icon="bar-chart"
        title="Analytiques"
        description="Mesure d'audience anonymisée pour améliorer l'application."
        value={choices.analytics}
        onChange={(v) => onChange('analytics', v)}
      />
      <ToggleRow
        icon="mail"
        title="Marketing"
        description="Communications promotionnelles et offres spéciales par email."
        value={choices.marketing}
        onChange={(v) => onChange('marketing', v)}
      />
      <ToggleRow
        icon="color-wand"
        title="Personnalisation"
        description="Adaptation de l'expérience selon vos habitudes de navigation."
        value={choices.personalization}
        onChange={(v) => onChange('personalization', v)}
      />
    </View>
  );
}

const customStyles = StyleSheet.create({
  container: { gap: 0 },
});

// ─── Main Banner ──────────────────────────────────────────────────────────────

export default function ConsentBanner() {
  const { consent, loading, acceptAll, rejectAll, saveChoices } = useConsent();

  const [showCustomize, setShowCustomize] = useState(false);
  const [localChoices, setLocalChoices] = useState<Omit<ConsentChoices, 'essential'>>({
    analytics: false,
    marketing: false,
    personalization: false,
  });

  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const shouldShow = !loading && consent.hasConsented === null;

  useEffect(() => {
    if (shouldShow) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      ]).start();
    }
  }, [shouldShow]);

  if (!shouldShow) return null;

  const handleLocalChoice = (key: keyof Omit<ConsentChoices, 'essential'>, val: boolean) => {
    setLocalChoices((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveCustom = async () => {
    await saveChoices(localChoices);
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[bannerStyles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[bannerStyles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <LinearGradient colors={['#1A0A35', '#2A1050']} style={bannerStyles.inner}>
            {/* Handle */}
            <View style={bannerStyles.handle} />

            {/* Logo + title */}
            <View style={bannerStyles.hero}>
              <LinearGradient colors={Colors.gradientPrimary} style={bannerStyles.heroIcon}>
                <Ionicons name="shield" size={22} color="#FFF" />
              </LinearGradient>
              <View style={bannerStyles.heroText}>
                <Text style={bannerStyles.heroTitle}>Vos données, votre choix</Text>
                <Text style={bannerStyles.heroSub}>
                  {APP_NAME} respecte votre vie privée
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={bannerStyles.scroll}
              bounces={false}
            >
              {!showCustomize ? (
                /* ── Résumé ─────────────────────────────────────────── */
                <View style={bannerStyles.summary}>
                  <Text style={bannerStyles.summaryText}>
                    {APP_NAME} et ses partenaires utilisent des cookies et des technologies
                    similaires pour faire fonctionner l'application, mesurer son audience et,
                    avec votre accord, personnaliser votre expérience et vous envoyer des
                    communications.
                  </Text>
                  <View style={bannerStyles.linksRow}>
                    <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
                      <Text style={bannerStyles.link}>Politique de confidentialité</Text>
                    </TouchableOpacity>
                    <Text style={bannerStyles.linkSep}>·</Text>
                    <TouchableOpacity onPress={() => router.push('/legal/cgu')}>
                      <Text style={bannerStyles.link}>CGU</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* ── Personnalisation ────────────────────────────────── */
                <View style={bannerStyles.customContainer}>
                  <Text style={bannerStyles.customTitle}>Personnaliser mes choix</Text>
                  <CustomizePanel
                    choices={localChoices}
                    onChange={handleLocalChoice}
                  />
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            <View style={bannerStyles.actions}>
              {showCustomize ? (
                <>
                  <TouchableOpacity
                    onPress={handleSaveCustom}
                    activeOpacity={0.85}
                    style={bannerStyles.primaryWrapper}
                  >
                    <LinearGradient
                      colors={Colors.gradientPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={bannerStyles.primaryBtn}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                      <Text style={bannerStyles.primaryText}>Enregistrer mes choix</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowCustomize(false)}
                    style={bannerStyles.secondaryBtn}
                  >
                    <Text style={bannerStyles.secondaryText}>← Retour</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Tout accepter */}
                  <TouchableOpacity
                    onPress={acceptAll}
                    activeOpacity={0.85}
                    style={bannerStyles.primaryWrapper}
                  >
                    <LinearGradient
                      colors={Colors.gradientPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={bannerStyles.primaryBtn}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                      <Text style={bannerStyles.primaryText}>Tout accepter</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Boutons secondaires */}
                  <View style={bannerStyles.secondaryRow}>
                    <TouchableOpacity
                      onPress={rejectAll}
                      style={[bannerStyles.halfBtn, bannerStyles.rejectBtn]}
                      activeOpacity={0.8}
                    >
                      <Text style={bannerStyles.halfBtnText}>Refuser</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowCustomize(true)}
                      style={[bannerStyles.halfBtn, bannerStyles.customBtn]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="options" size={14} color={Colors.text} />
                      <Text style={bannerStyles.halfBtnText}>Personnaliser</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

            {/* RGPD badge */}
            <View style={bannerStyles.rgpdBadge}>
              <Ionicons name="shield-checkmark" size={11} color={Colors.textMuted} />
              <Text style={bannerStyles.rgpdText}>
                Conforme au RGPD · Données hébergées en UE
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const bannerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: { marginHorizontal: 6, marginBottom: 8 },
  inner: {
    borderRadius: 26,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.cardBorder,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: { color: Colors.text, fontSize: 17, fontWeight: '800' },
  heroSub: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
  scroll: { paddingHorizontal: 20 },
  summary: { gap: 14 },
  summaryText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  link: { color: Colors.primary, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  linkSep: { color: Colors.textMuted, fontSize: 13 },
  customContainer: { gap: 14 },
  customTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  actions: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  primaryWrapper: { borderRadius: 14, overflow: 'hidden' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  primaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  halfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  rejectBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: Colors.cardBorder,
  },
  customBtn: {
    backgroundColor: 'rgba(255,107,157,0.08)',
    borderColor: 'rgba(255,107,157,0.25)',
  },
  halfBtnText: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryText: { color: Colors.textMuted, fontSize: 13 },
  rgpdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 12,
    paddingBottom: 4,
  },
  rgpdText: { color: Colors.textMuted, fontSize: 10 },
});
