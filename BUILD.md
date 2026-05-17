# 🚀 Guide de Build — NextLove

## Prérequis

1. **EAS CLI installé** :
   ```bash
   npm install -g eas-cli
   ```

2. **Compte Expo** : https://expo.dev (gratuit)

3. **Apple Developer Account** : https://developer.apple.com (99$/an) — requis pour iOS

---

## 📱 Build Development (tester sur ton iPhone)

```bash
# 1. Connecte-toi à Expo
eas login
# → Email : julien.antonis@gmail.com

# 2. Lance le build iOS
eas build --platform ios --profile development
# → EAS te demandera tes identifiants Apple Developer
# → Il génère automatiquement les certificats
# → Build time : ~15 min sur les serveurs EAS
# → Tu reçois un lien pour installer via QR code

# 3. Une fois installé, lance le serveur de dev
npx expo start --dev-client
# → Scanne le QR avec l'app installée (pas Expo Go)
```

---

## 🏪 Build Production (App Store)

```bash
# 1. Build production
eas build --platform ios --profile production

# 2. Soumettre à l'App Store
eas submit --platform ios --profile production
# → Nécessite ascAppId dans eas.json (App Store Connect App ID)
```

---

## ✅ Checklist avant App Store

- [ ] Apple Developer Account actif (99$/an)
- [ ] App créée sur App Store Connect (appleid.apple.com)
- [ ] `ascAppId` rempli dans eas.json
- [ ] `appleTeamId` rempli dans eas.json
- [ ] Captures d'écran iPhone 6.7" préparées
- [ ] Description app en français rédigée
- [ ] Politique de confidentialité publiée (Netlify/Vercel)
- [ ] Crédits Anthropic rechargés (console.anthropic.com)
- [ ] AdMob compte créé + vrais IDs dans services/adService.ts
- [ ] Stripe webhook configuré en production

---

## 💡 Commandes utiles

```bash
# Voir l'état des builds
eas build:list

# Build Android APK (test)
eas build --platform android --profile development

# Mettre à jour l'app sans rebuild (OTA)
eas update --channel production --message "Fix bug"

# Voir les logs d'un build
eas build:view
```

---

## 🔑 Variables d'environnement

Toutes les clés sont déjà dans `eas.json`. Pour ajouter un secret :
```bash
eas secret:create --name MON_SECRET --value "ma_valeur"
```
