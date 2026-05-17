import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useApp } from '../contexts/AppContext';
import { router } from 'expo-router';

interface AdBannerProps {
  onPremiumPress?: () => void;
}

export default function AdBanner({ onPremiumPress }: AdBannerProps) {
  const { isPremium } = useApp();

  if (isPremium) return null;

  const handlePress = () => {
    if (onPremiumPress) onPremiumPress();
    else router.push('/premium');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.wrapper}>
        <LinearGradient
          colors={['rgba(106,53,217,0.18)', 'rgba(255,107,157,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        >
          {/* Gauche : icône + texte pub */}
          <View style={styles.left}>
            <View style={styles.iconBox}>
              <Ionicons name="megaphone" size={14} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.adLabel}>Publicité</Text>
              <Text style={styles.adSub}>Supprimez les pubs avec Premium</Text>
            </View>
          </View>

          {/* Droite : CTA premium */}
          <LinearGradient
            colors={Colors.premiumGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaBtn}
          >
            <Ionicons name="star" size={11} color="#000" />
            <Text style={styles.ctaText}>Premium</Text>
          </LinearGradient>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  wrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.2)',
    borderRadius: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,107,157,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.25)',
  },
  adLabel: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  adSub: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ctaText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
});
