# NextLove — Checklist de Lancement

## ✅ Code — 100% prêt

- [x] Questionnaire 9 étapes
- [x] Swipe + filtres automatiques par préférence
- [x] Chat temps réel (réactions, typing, accusés de lecture)
- [x] Système de likes quotidiens (10/jour) + AdMob rewarded
- [x] Premium Gold (Stripe)
- [x] Profils enrichis avec vraies données questionnaire
- [x] Score de compatibilité réel (7 thèmes)
- [x] Icebreakers personnalisés
- [x] Tutoriel swipe first-launch
- [x] Notifications locales
- [x] Paramètres (email, mdp, masquer profil, suppression)
- [x] RGPD (consentement, CGU, politique confidentialité)
- [x] Icône 1024×1024 + Splash screen
- [x] Analytics (events trackés dans Supabase)
- [x] Haptic feedback

---

## 🚀 Étapes de lancement (dans l'ordre)

### 1. Compte Apple Developer (99$/an)
→ https://developer.apple.com/programs/enroll/
→ Nécessaire pour soumettre sur l'App Store

### 2. Compte Google AdMob
→ https://admob.google.com
→ Créer une app iOS → copier les IDs dans `services/adService.ts` lignes 10-11

### 3. EAS Login + Init
```bash
cd /Users/durieujulien/NextLove
npx eas-cli login          # julien.antonis@gmail.com
npx eas-cli init           # Crée le projet Expo → copier l'ID dans notificationService.ts
```

### 4. Mettre à jour EXPO_PROJECT_ID
Dans `services/notificationService.ts` ligne 13 :
```ts
export const EXPO_PROJECT_ID = 'VOTRE_ID_ICI'; // après eas init
```

### 5. Stripe Webhook
→ Dashboard Stripe → Developers → Webhooks
→ Ajouter : https://esccnfqkavtvngowizgc.supabase.co/functions/v1/stripe-webhook
→ Événements : `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### 6. Recharger Anthropic
→ https://console.anthropic.com/settings/billing
→ Ajouter 10-20$ pour le scoring IA

### 7. Build iOS Production
```bash
npx eas-cli build --platform ios --profile production
```

### 8. Soumettre sur l'App Store
```bash
npx eas-cli submit --platform ios --latest
```

### 9. Déployer la Landing Page
```bash
# Dans /landing/
# Déployer sur Vercel (gratuit)
npx vercel --prod
```

### 10. Analytics → passer à Mixpanel (optionnel)
→ mixpanel.com → créer projet → remplacer `services/analytics.ts`

---

## Variables d'environnement à mettre à jour

| Variable | Valeur actuelle | À changer |
|---|---|---|
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | sk-ant-api03-... | Recharger le compte |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | pk_test_... | Remplacer par pk_live_ en prod |
| AdMob iOS App ID | Test | Remplacer par vrai ID |
| AdMob Rewarded Ad ID | Test | Remplacer par vrai ID |

---

## Contacts utiles
- **Support** : support@nextlove.app
- **DPO** : dpo@nextlove.app
- **Bundle ID** : com.nextlove.app
- **Supabase** : https://app.supabase.com/project/esccnfqkavtvngowizgc
