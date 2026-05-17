import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Colors } from '../constants/colors';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { activatePremiumLocally } from '../services/iapService';
import { subscriptionService } from '../services/supabase';

// ── Détection environnement ────────────────────────────────────────────────────
const IS_EXPO_GO = Constants.appOwnership === 'expo';
const IS_IOS = Platform.OS === 'ios';

// ── Apple IAP Product IDs (correspond aux identifiants App Store Connect) ──────
export const IAP_PRODUCTS = {
  weekly:    '01',
  monthly:   '02',
  quarterly: '03',
  yearly:    '04',
} as const;

// ── Plans tarifaires ───────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'weekly' as const,
    label: '1 semaine',
    price: '3,99 €',
    priceNum: 3.99,
    period: 'semaine',
    perMonth: null,
    badge: null,
    iapId: IAP_PRODUCTS.weekly,
  },
  {
    id: 'monthly' as const,
    label: '1 mois',
    price: '9,99 €',
    priceNum: 9.99,
    period: 'mois',
    perMonth: '9,99 €/mois',
    badge: null,
    iapId: IAP_PRODUCTS.monthly,
  },
  {
    id: 'quarterly' as const,
    label: '3 mois',
    price: '19,99 €',
    priceNum: 19.99,
    period: '3 mois',
    perMonth: '6,66 €/mois',
    badge: '-33%',
    iapId: IAP_PRODUCTS.quarterly,
  },
  {
    id: 'yearly' as const,
    label: '1 an',
    price: '49,99 €',
    priceNum: 49.99,
    period: 'an',
    perMonth: '4,17 €/mois',
    badge: 'MEILLEUR PRIX',
    iapId: IAP_PRODUCTS.yearly,
  },
] as const;

type PlanId = typeof PLANS[number]['id'];

// ── Features incluses ──────────────────────────────────────────────────────────
const FEATURES = [
  { icon: 'infinite',       label: 'Likes illimités',         sub: 'Plus aucune restriction' },
  { icon: 'eye',            label: 'Voir qui t\'a liké',      sub: 'Profils révélés en temps réel' },
  { icon: 'star',           label: '5 Super Likes / jour',    sub: 'Montre ton intérêt fort' },
  { icon: 'rocket',         label: 'Boost quotidien',         sub: '30 min de visibilité ×3' },
  { icon: 'refresh-circle', label: 'Retour en arrière',       sub: 'Reswiper les profils manqués' },
  { icon: 'ban',            label: 'Sans publicité',          sub: 'Expérience immersive totale' },
  { icon: 'sparkles',       label: 'Analyse approfondie',     sub: 'Score de compatibilité détaillé' },
] as const;

// ── Composant Feature Row ──────────────────────────────────────────────────────
function FeatureRow({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <View style={fStyles.row}>
      <LinearGradient colors={Colors.premiumGradient} style={fStyles.icon}>
        <Ionicons name={icon as any} size={16} color="#000" />
      </LinearGradient>
      <View style={fStyles.txt}>
        <Text style={fStyles.label}>{label}</Text>
        <Text style={fStyles.sub}>{sub}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
    </View>
  );
}
const fStyles = StyleSheet.create({
  row:   { flexDirection:'row', alignItems:'center', gap:14, paddingVertical:9 },
  icon:  { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center' },
  txt:   { flex:1 },
  label: { color:Colors.text, fontSize:14, fontWeight:'700' },
  sub:   { color:Colors.textMuted, fontSize:11, marginTop:1 },
});

// ── Sélecteur de plan ──────────────────────────────────────────────────────────
function PlanSelector({
  selected, onSelect,
}: { selected: PlanId; onSelect: (id: PlanId) => void }) {
  return (
    <View style={planStyles.container}>
      {PLANS.map(plan => {
        const isSelected = selected === plan.id;
        const isBest = plan.id === 'yearly';
        return (
          <TouchableOpacity
            key={plan.id}
            onPress={() => onSelect(plan.id)}
            activeOpacity={0.8}
            style={[planStyles.card, isSelected && planStyles.cardSelected, isBest && planStyles.cardBest]}
          >
            {plan.badge && (
              <View style={[planStyles.badge, plan.badge === 'MEILLEUR PRIX' ? planStyles.badgeBest : planStyles.badgeDiscount]}>
                <Text style={planStyles.badgeText}>{plan.badge}</Text>
              </View>
            )}
            <View style={planStyles.row}>
              <View style={[planStyles.radio, isSelected && planStyles.radioSelected]}>
                {isSelected && <View style={planStyles.radioDot} />}
              </View>
              <View style={planStyles.info}>
                <Text style={[planStyles.planLabel, isSelected && planStyles.planLabelSelected]}>
                  {plan.label}
                </Text>
                {plan.perMonth && (
                  <Text style={planStyles.perMonth}>{plan.perMonth}</Text>
                )}
              </View>
              <View style={planStyles.priceBlock}>
                <Text style={[planStyles.price, isSelected && planStyles.priceSelected]}>
                  {plan.price}
                </Text>
                <Text style={planStyles.pricePeriod}>/ {plan.period}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const planStyles = StyleSheet.create({
  container:       { gap:10, marginHorizontal:16, marginBottom:4 },
  card:            { borderRadius:16, borderWidth:1.5, borderColor:Colors.cardBorder, backgroundColor:Colors.card, padding:14, position:'relative' },
  cardSelected:    { borderColor:Colors.premium, backgroundColor:'rgba(255,215,0,0.06)' },
  cardBest:        { },
  badge:           { position:'absolute', top:-10, right:14, borderRadius:20, paddingHorizontal:10, paddingVertical:3 },
  badgeBest:       { backgroundColor:Colors.premium },
  badgeDiscount:   { backgroundColor:Colors.primary },
  badgeText:       { fontSize:10, fontWeight:'900', color:'#000', letterSpacing:0.3 },
  row:             { flexDirection:'row', alignItems:'center', gap:12 },
  radio:           { width:20, height:20, borderRadius:10, borderWidth:2, borderColor:Colors.cardBorder, alignItems:'center', justifyContent:'center' },
  radioSelected:   { borderColor:Colors.premium },
  radioDot:        { width:10, height:10, borderRadius:5, backgroundColor:Colors.premium },
  info:            { flex:1 },
  planLabel:       { color:Colors.textMuted, fontSize:15, fontWeight:'700' },
  planLabelSelected:{ color:Colors.text },
  perMonth:        { color:Colors.textMuted, fontSize:11, marginTop:1 },
  priceBlock:      { alignItems:'flex-end' },
  price:           { color:Colors.text, fontSize:18, fontWeight:'900', letterSpacing:-0.5 },
  priceSelected:   { color:Colors.premium },
  pricePeriod:     { color:Colors.textMuted, fontSize:10, marginTop:1 },
});

// ── Bouton CTA ─────────────────────────────────────────────────────────────────
function PayButton({ onPress, loading, plan }: { onPress: () => void; loading: boolean; plan: typeof PLANS[number] }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.85} style={ctaStyles.wrap}>
      <LinearGradient colors={Colors.premiumGradient} start={{x:0,y:0}} end={{x:1,y:0}} style={ctaStyles.btn}>
        {loading
          ? <ActivityIndicator color="#000" />
          : <>
              <Ionicons name="star" size={18} color="#000" />
              <Text style={ctaStyles.text}>Commencer — {plan.price} / {plan.period}</Text>
            </>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}
const ctaStyles = StyleSheet.create({
  wrap: { marginHorizontal:16 },
  btn:  { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, paddingVertical:17, borderRadius:50, shadowColor:Colors.premium, shadowOffset:{width:0,height:6}, shadowOpacity:0.4, shadowRadius:12 },
  text: { color:'#000', fontSize:16, fontWeight:'800', letterSpacing:-0.3 },
});

// ── Écran succès ───────────────────────────────────────────────────────────────
function SuccessScreen() {
  return (
    <View style={successStyles.container}>
      <LinearGradient colors={Colors.premiumGradient} style={successStyles.icon}>
        <Ionicons name="star" size={42} color="#000" />
      </LinearGradient>
      <Text style={successStyles.title}>Bienvenue dans Gold ! 👑</Text>
      <Text style={successStyles.sub}>Toutes les fonctionnalités premium sont maintenant actives.</Text>
      <TouchableOpacity onPress={() => router.back()} style={successStyles.btn}>
        <Text style={successStyles.btnText}>Découvrir NextLove Gold →</Text>
      </TouchableOpacity>
    </View>
  );
}
const successStyles = StyleSheet.create({
  container: { flex:1, alignItems:'center', justifyContent:'center', padding:32, gap:16 },
  icon:      { width:96, height:96, borderRadius:28, alignItems:'center', justifyContent:'center', marginBottom:8 },
  title:     { color:Colors.text, fontSize:24, fontWeight:'900', textAlign:'center', letterSpacing:-0.5 },
  sub:       { color:Colors.textMuted, fontSize:15, textAlign:'center', lineHeight:22 },
  btn:       { marginTop:8, backgroundColor:Colors.card, borderWidth:1, borderColor:Colors.premium, borderRadius:50, paddingHorizontal:28, paddingVertical:14 },
  btnText:   { color:Colors.premium, fontWeight:'700', fontSize:15 },
});

// ── Fallback Expo Go ───────────────────────────────────────────────────────────
function ExpoGoFallback({ plan }: { plan: typeof PLANS[number] }) {
  const { setPremium } = useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    try {
      if (user) await activatePremiumLocally(user.id);
      setPremium(true);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'activer le premium de test.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={exStyles.container}>
      <View style={exStyles.badge}>
        <Ionicons name="flask" size={14} color={Colors.warning} />
        <Text style={exStyles.badgeText}>MODE DEV — Paiement simulé</Text>
      </View>
      <Text style={exStyles.info}>
        Apple IAP et Google Play nécessitent un build de production (EAS).{'\n'}
        En mode développement, le premium est activé gratuitement.
      </Text>
      <PayButton onPress={handleActivate} loading={loading} plan={plan} />
    </View>
  );
}
const exStyles = StyleSheet.create({
  container: { marginHorizontal:16, gap:14 },
  badge:     { flexDirection:'row', alignItems:'center', gap:8, backgroundColor:'rgba(255,200,0,0.1)', borderWidth:1, borderColor:'rgba(255,200,0,0.3)', borderRadius:10, padding:10 },
  badgeText: { color:Colors.warning, fontSize:12, fontWeight:'700' },
  info:      { color:Colors.textMuted, fontSize:13, lineHeight:20, textAlign:'center' },
});

// ── Achat natif : Apple IAP (iOS) ou Google Play Billing (Android) ─────────────
function NativePayment({ plan, onSuccess }: { plan: typeof PLANS[number]; onSuccess: () => void }) {
  const { setPremium } = useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const iap = (() => { try { return require('react-native-iap'); } catch { return null; } })();
      if (!iap) throw new Error('Module IAP non disponible. Utilisez un build EAS.');

      // Initialise la connexion (Apple Store ou Google Play selon la plateforme)
      await iap.initConnection();

      const daysMap = { weekly: 7, monthly: 30, quarterly: 90, yearly: 365 };

      // requestSubscription fonctionne identiquement sur iOS et Android avec react-native-iap
      const purchase = await iap.requestSubscription({
        sku: plan.iapId, // même ID utilisé sur Apple et Google Play
      });

      if (purchase) {
        // Finaliser l'achat (obligatoire pour éviter le remboursement automatique)
        await iap.finishTransaction({ purchase, isConsumable: false });

        // Activer dans Supabase
        if (user) {
          await activatePremiumLocally(user.id);
          await subscriptionService.createFromIAP({
            userId: user.id,
            plan: plan.id,
            daysFromNow: daysMap[plan.id],
          });
        }
        setPremium(true);
        onSuccess();
      }
    } catch (err: any) {
      // E_USER_CANCELLED = l'utilisateur a annulé volontairement → pas d'alerte
      if (err?.code !== 'E_USER_CANCELLED' && err?.message !== 'User canceled the purchase.') {
        Alert.alert(
          'Erreur de paiement',
          err?.message ?? 'Une erreur est survenue. Réessayez dans un moment.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return <PayButton onPress={handlePurchase} loading={loading} plan={plan} />;
}

// ── ÉCRAN PRINCIPAL ────────────────────────────────────────────────────────────
export default function PremiumScreen() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [success, setSuccess] = useState(false);

  const currentPlan = PLANS.find(p => p.id === selectedPlan)!;

  if (success) {
    return (
      <LinearGradient colors={Colors.gradientDark} style={styles.container}>
        <SafeAreaView style={styles.safe} edges={['top','bottom']}>
          <SuccessScreen />
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top','bottom']}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NextLove Gold 👑</Text>
          <View style={{ width:38 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Hero badge */}
          <View style={styles.hero}>
            <LinearGradient colors={Colors.premiumGradient} style={styles.heroIcon}>
              <Ionicons name="star" size={36} color="#000" />
            </LinearGradient>
            <Text style={styles.heroTitle}>Passe à Gold</Text>
            <Text style={styles.heroSub}>
              Débloque toutes les fonctionnalités{'\n'}et trouve vraiment quelqu'un
            </Text>
          </View>

          {/* Sélecteur de plans */}
          <Text style={styles.sectionTitle}>Choisir un forfait</Text>
          <PlanSelector selected={selectedPlan} onSelect={setSelectedPlan} />

          {/* Économie mise en avant */}
          {selectedPlan === 'yearly' && (
            <View style={styles.savingsBanner}>
              <Ionicons name="sparkles" size={14} color={Colors.premium} />
              <Text style={styles.savingsText}>Tu économises <Text style={{color:Colors.premium,fontWeight:'900'}}>70,89 €</Text> vs le forfait semaine 🎉</Text>
            </View>
          )}
          {selectedPlan === 'quarterly' && (
            <View style={styles.savingsBanner}>
              <Ionicons name="sparkles" size={14} color={Colors.premium} />
              <Text style={styles.savingsText}>Tu économises <Text style={{color:Colors.premium,fontWeight:'900'}}>9,98 €</Text> vs le forfait mensuel</Text>
            </View>
          )}

          {/* Features */}
          <View style={styles.featuresCard}>
            <LinearGradient colors={Colors.gradientCard} style={styles.featuresInner}>
              <Text style={styles.sectionLabel}>Inclus dans Gold</Text>
              <View style={styles.divider} />
              {FEATURES.map(f => <FeatureRow key={f.label} {...f} />)}
            </LinearGradient>
          </View>

          {/* Garantie */}
          <View style={styles.guarantee}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
            <Text style={styles.guaranteeText}>
              Résiliable à tout moment depuis les réglages de ton compte
            </Text>
          </View>

          {/* Legal */}
          <Text style={styles.legal}>
            En souscrivant, vous acceptez nos CGU. L'abonnement se renouvelle automatiquement.
            Gérez votre abonnement depuis les réglages Apple / Google Play.
          </Text>
        </ScrollView>

        {/* CTA fixe en bas */}
        <View style={styles.footer}>
          {IS_EXPO_GO
            ? <ExpoGoFallback plan={currentPlan} />
            : <NativePayment plan={currentPlan} onSuccess={() => setSuccess(true)} />
          }
          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={11} color={Colors.textMuted} />
            <Text style={styles.secureText}>
              {IS_IOS ? 'Paiement sécurisé · Apple In-App Purchase' : 'Paiement sécurisé · Google Play'}
            </Text>
          </View>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex:1 },
  safe:           { flex:1 },
  header:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12 },
  backBtn:        { width:38, height:38, borderRadius:12, backgroundColor:Colors.card, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:Colors.cardBorder },
  headerTitle:    { color:Colors.text, fontSize:18, fontWeight:'800' },
  scroll:         { paddingBottom:12 },

  hero:           { alignItems:'center', paddingVertical:24, gap:10 },
  heroIcon:       { width:80, height:80, borderRadius:24, alignItems:'center', justifyContent:'center', marginBottom:4 },
  heroTitle:      { color:Colors.text, fontSize:28, fontWeight:'900', letterSpacing:-0.5 },
  heroSub:        { color:Colors.textMuted, fontSize:14, textAlign:'center', lineHeight:20 },

  sectionTitle:   { color:Colors.textMuted, fontSize:11, fontWeight:'700', textTransform:'uppercase', letterSpacing:1, marginHorizontal:16, marginBottom:10, marginTop:4 },

  savingsBanner:  { flexDirection:'row', alignItems:'center', gap:8, marginHorizontal:16, marginTop:10, backgroundColor:'rgba(255,215,0,0.08)', borderWidth:1, borderColor:'rgba(255,215,0,0.2)', borderRadius:12, padding:12 },
  savingsText:    { color:Colors.textMuted, fontSize:13, flex:1 },

  featuresCard:   { marginHorizontal:16, marginTop:18, marginBottom:14 },
  featuresInner:  { borderRadius:20, padding:18, gap:2, borderWidth:1, borderColor:Colors.cardBorder },
  sectionLabel:   { color:Colors.textMuted, fontSize:11, fontWeight:'700', textTransform:'uppercase', letterSpacing:1, marginBottom:4 },
  divider:        { height:1, backgroundColor:Colors.cardBorder, marginBottom:8 },

  guarantee:      { flexDirection:'row', alignItems:'center', gap:10, marginHorizontal:16, marginBottom:12, padding:12, backgroundColor:'rgba(80,200,120,0.08)', borderRadius:12, borderWidth:1, borderColor:'rgba(80,200,120,0.2)' },
  guaranteeText:  { color:Colors.textMuted, fontSize:13, flex:1 },

  legal:          { color:Colors.textMuted, fontSize:11, textAlign:'center', lineHeight:16, paddingHorizontal:24, marginBottom:16 },

  footer:         { gap:10, paddingTop:12, paddingBottom:8, borderTopWidth:1, borderTopColor:Colors.cardBorder },
  secureRow:      { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:5, paddingBottom:4 },
  secureText:     { color:Colors.textMuted, fontSize:11 },
});
