/**
 * NextLove — Configuration Expo dynamique
 *
 * Ce fichier remplace app.json et permet d'utiliser des variables d'environnement
 * pour les IDs de production (AdMob, etc.).
 *
 * Variables à renseigner dans .env pour la production :
 *   EXPO_PUBLIC_ADMOB_APP_ID_IOS=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
 *   EXPO_PUBLIC_ADMOB_APP_ID_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
 */

// IDs de test AdMob (fallback si les variables de prod ne sont pas définies)
const TEST_ADMOB_APP_ID_IOS     = 'ca-app-pub-3940256099942544~1458002511';
const TEST_ADMOB_APP_ID_ANDROID = 'ca-app-pub-3940256099942544~3347511713';

// ✅ IDs de PRODUCTION configurés
// iOS: ca-app-pub-1427355931823204~8368010999
// Android: à ajouter après création dans AdMob

const admobAppIdIos     = process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS     || TEST_ADMOB_APP_ID_IOS;
const admobAppIdAndroid = process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID || TEST_ADMOB_APP_ID_ANDROID;

module.exports = {
  expo: {
    name: 'NextLove',
    slug: 'nextlove',
    scheme: 'nextlove',
    version: '1.0.0',
    runtimeVersion: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#0F0520',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.nextlove.app',
      // buildNumber géré automatiquement par EAS (autoIncrement: true)
      buildNumber: '1',
      infoPlist: {
        NSUserNotificationsUsageDescription: 'NextLove vous notifie pour les nouveaux matchs, messages et likes.',
        NSLocationWhenInUseUsageDescription: 'NextLove utilise votre position pour filtrer les profils par distance.',
        NSCameraUsageDescription: 'NextLove utilise votre appareil photo pour prendre une photo de profil.',
        NSPhotoLibraryUsageDescription: 'NextLove accède à votre galerie pour choisir une photo de profil.',
        NSMicrophoneUsageDescription: 'Accès microphone non utilisé.',
        NSUserTrackingUsageDescription: 'NextLove utilise vos données pour vous afficher des publicités pertinentes et améliorer votre expérience.',
        GADApplicationIdentifier: admobAppIdIos,
      },
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
        ],
      },
      entitlements: { 'aps-environment': 'production' },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0F0520',
      },
      package: 'com.nextlove.app',
      versionCode: 1,
      permissions: [
        'android.permission.RECEIVE_BOOT_COMPLETED',
        'android.permission.VIBRATE',
        'android.permission.POST_NOTIFICATIONS',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
      ],
    },
    web: { bundler: 'metro' },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'NextLove utilise votre position pour filtrer les profils par distance.',
          locationWhenInUsePermission: 'NextLove utilise votre position pour filtrer les profils par distance.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'NextLove accède à votre galerie pour choisir une photo de profil.',
          cameraPermission: 'NextLove utilise votre appareil photo pour prendre une photo de profil.',
          microphonePermission: false,
        },
      ],
      // Stripe retiré — paiements gérés par Apple IAP et Google Play Billing uniquement
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#FF6B9D',
          sounds: [],
          iosDisplayInForeground: true,
        },
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: admobAppIdAndroid,
          iosAppId: admobAppIdIos,
        },
      ],
      [
        'expo-tracking-transparency',
        {
          userTrackingPermission: 'NextLove utilise vos données pour vous afficher des publicités pertinentes et améliorer votre expérience.',
        },
      ],
    ],
    experiments: { typedRoutes: true },
    newArchEnabled: false,
    updates: {
      url: 'https://u.expo.dev/8ce46d8a-a984-4a27-a8c8-7d9ff3dc450d',
    },
    runtimeVersion: '1.0.0',
    extra: { eas: { projectId: '8ce46d8a-a984-4a27-a8c8-7d9ff3dc450d' } },
  },
};
