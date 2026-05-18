import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useApp } from '../contexts/AppContext';

// IDs de test Google (fallback si pas de prod ID)
const TEST_BANNER_IOS     = 'ca-app-pub-3940256099942544/2934735716';
const TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';

const PROD_BANNER_IOS     = process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS     ?? '';
const PROD_BANNER_ANDROID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID ?? '';

const BANNER_ID = Platform.OS === 'ios'
  ? (PROD_BANNER_IOS     !== '' ? PROD_BANNER_IOS     : TEST_BANNER_IOS)
  : (PROD_BANNER_ANDROID !== '' ? PROD_BANNER_ANDROID : TEST_BANNER_ANDROID);

interface AdBannerProps {
  onPremiumPress?: () => void;
}

export default function AdBanner({ onPremiumPress }: AdBannerProps) {
  const { isPremium } = useApp();
  const [adFailed, setAdFailed] = useState(false);

  // Pas de bannière pour les utilisateurs premium
  if (isPremium) return null;

  // Si la pub échoue à charger → on masque proprement
  if (adFailed) return null;

  return (
    <AdBannerNative
      bannerId={BANNER_ID}
      onFailed={() => setAdFailed(true)}
    />
  );
}

// Composant interne qui charge AdMob dynamiquement (natif seulement)
function AdBannerNative({
  bannerId,
  onFailed,
}: {
  bannerId: string;
  onFailed: () => void;
}) {
  const [BannerAd, setBannerAd] = React.useState<any>(null);
  const [BannerAdSize, setBannerAdSize] = React.useState<any>(null);

  React.useEffect(() => {
    import('react-native-google-mobile-ads')
      .then(({ BannerAd: BA, BannerAdSize: BAS }) => {
        setBannerAd(() => BA);
        setBannerAdSize(BAS);
      })
      .catch(() => onFailed());
  }, []);

  if (!BannerAd || !BannerAdSize) return null;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={bannerId}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => onFailed()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 60,
  },
});
