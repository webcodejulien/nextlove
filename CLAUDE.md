# NextLove — Context pour Claude Code
> Mis à jour le 17 mai 2026 — État réel du projet

---

## 🔑 Clés & Identifiants

```env
# Les vraies clés sont dans le fichier .env (non versionné)
EXPO_PUBLIC_SUPABASE_URL=https://esccnfqkavtvngowizgc.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=voir .env
SUPABASE_SERVICE_ROLE_KEY=voir .env
EXPO_PUBLIC_ANTHROPIC_API_KEY=voir .env
```

- **Supabase Project ID** : `esccnfqkavtvngowizgc`
- **Supabase Personal Token** : voir .env (sbp_...)
- **Expo Account** : `durapp` / `julien.antonis@gmail.com`
- **Expo Project ID** : `8ce46d8a-a984-4a27-a8c8-7d9ff3dc450d`
- **Bundle ID** : `com.nextlove.app`
- **Apple Team ID** : `XZLZ7PWDXD` (julien Durieu - Individual)
- **Apple ID** : `julien.durieu89@gmail.com`
- **ASC App ID** : `6770281015`
- **Domaine** : `nextlove.app` ✅ acheté

### AdMob (production — déjà configuré dans eas.json)
- iOS App ID : `ca-app-pub-1427355931823204~8368010999`
- iOS Rewarded : `ca-app-pub-1427355931823204/6608435678`
- Android App ID : `ca-app-pub-1427355931823204~4908112285`
- Android Rewarded : `ca-app-pub-1427355931823204/3595030616`

---

## 🏗 Stack technique

| Technologie | Usage |
|---|---|
| Expo SDK 54 + Expo Router 6 | Navigation file-based |
| Supabase | Auth, DB, Storage, Realtime, Edge Functions |
| Apple IAP (expo-iap) | Monétisation — 4 plans (hebdo/mensuel/trimestriel/annuel) |
| Google AdMob | Rewarded video (likes) + bannières non-premium |
| expo-notifications | Push notifications |
| expo-location | Filtres par distance GPS |
| **Stripe = SUPPRIMÉ** | Remplacé par Apple IAP / Google Play Billing |

---

## ✅ Fonctionnalités — 100% codées

### Core
- Auth complète (signup/login/logout/forgot-password/verify-email)
- Questionnaire 9-10 étapes (60+ questions)
- Algo matching IA 7 thèmes pondérés + deal-breakers
- Swipe cards + filtres (âge, distance, genre, relation, lifestyle, éducation)
- 10 likes/jour gratuits → vidéo AdMob rewarded = +5 likes
- Matchs → liste style WhatsApp + badges non-lus + realtime

### Chat
- Chat temps réel (Supabase Realtime)
- Icebreakers personnalisés
- Réactions emoji (appui long → picker 6 emojis)
- Accusés de lecture (✓✓ roses)
- Indicateur "typing" animé
- Dématcher depuis la liste (longPress)

### Profil
- Modifier profil : ville GPS (OpenStreetMap) + picker métier (130+)
- Upload photo (Supabase Storage, compression, 5MB)
- Profil détaillé match : radar IA par thème, valeurs, hobbies
- Vues du profil : compteur hebdo (gratuit) + liste viewers (premium)
- Streak de connexion + Boost 30min (premium)
- Barre de complétion de profil
- Supprimer son compte (is_active = false)

### Monétisation
- Apple IAP : `com.nextlove.app.gold.weekly/monthly/quarterly/yearly`
- AdMob rewarded video + bannières non-premium
- Features Gold lockées : viewers, boost, super like, undo, filtres avancés

### Infra
- EAS build configuré (profiles: development, preview, production)
- expo-updates configuré (OTA updates)
- 3 Edge Functions déployées (create-payment-intent, stripe-webhook, send-push-notification)
- 26+ profils seedés en DB
- Triggers auto-match + push notification sur nouveau match
- Bucket Storage 'photos' (public, 5MB, JPG/PNG)
- Analytics trackés dans Supabase

---

## 📁 Structure des dossiers importants

```
app/                    — Screens (Expo Router)
assets/                 — Icône 1024×1024 ✅, splash ✅
landing/                — Site nextlove.app (index.html, privacy.html, support.html)
                          → Prêt à déployer sur Netlify (netlify.toml présent)
store/                  — Métadonnées App Store (descriptions, mots-clés, etc.)
store-assets/           — Screenshots + textes pour App Store Connect
services/
  iapService.ts         — Apple IAP (plus de Stripe)
  adService.ts          — AdMob rewarded + compteur likes
  supabase.ts           — Tous les services DB
  notificationService.ts
  photoUpload.ts
  questionnaireScore.ts
```

---

## 🚀 État du déploiement

### EAS Builds iOS
| Build | Status | Note |
|---|---|---|
| #1-4 | Échec | Erreurs de config |
| #5 | ✅ Réussi | Soumission échouée (build # déjà utilisé) |
| **#6** | 🔄 En cours | Lancé le 17/05/2026 — auto-incrémenté |

### App Store Connect
- App créée : ✅ (ASC ID: 6770281015)
- Build uploadé : ❌ (en attente du build #6)
- Screenshots : ❌ à uploader dans ASC
- Description/mots-clés : ✅ prêts dans `store/metadata.md`
- IAP Products : ❌ à créer dans ASC
- Compte démo reviewer : ❌ `demo@nextlove.app` à créer en DB

### Domaine & Landing
- `nextlove.app` : ✅ acheté
- `nextlove.app/privacy` : ✅ fichier prêt → à déployer Netlify
- `nextlove.app/support` : ✅ fichier prêt → à déployer Netlify
- Emails `contact@` et `dpo@` : ❌ à configurer (redirection vers Gmail)

---

## 🔴 Ce qui reste à faire (dans l'ordre)

1. **Attendre build #6** → puis lancer :
   ```bash
   eas submit --platform ios --latest
   ```

2. **Déployer landing page sur Netlify** (5 min) :
   - Aller sur netlify.com → "Add new site" → glisser le dossier `landing/`
   - Connecter le domaine `nextlove.app`

3. **Créer les IAP dans App Store Connect** :
   - `com.nextlove.app.gold.weekly` — 3,99€
   - `com.nextlove.app.gold.monthly` — 9,99€
   - `com.nextlove.app.gold.quarterly` — 19,99€
   - `com.nextlove.app.gold.yearly` — 39,99€

4. **Uploader les screenshots** dans App Store Connect (dossier `store-assets/screenshots/`)

5. **Créer le compte démo** pour le reviewer Apple :
   - Email : `demo@nextlove.app` (ou Gmail temporaire)
   - MDP : `Demo2026!`
   - L'insérer en DB Supabase

6. **Recharger Anthropic** : https://console.anthropic.com/settings/billing (10-20$)

---

## 🚀 Commandes utiles

```bash
cd /Users/durieujulien/NextLove

# Démarrer en dev
npx expo start --clear

# Voir les builds
eas build:list --platform ios --limit 5

# Soumettre le dernier build
eas submit --platform ios --latest

# Requête DB directe
supabase db query --linked "SELECT COUNT(*) FROM public.users;"
```
