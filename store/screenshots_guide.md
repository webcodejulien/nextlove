# Guide Screenshots App Store

## Taille requise : 1290 × 2796 px (iPhone 6.7")

Simulateur recommandé : **iPhone 17 Pro** (ou iPhone 16 Pro Max) sous Xcode
Commande pour lancer : `npx expo start --clear` puis ouvrir dans le simulateur iOS

---

## Screenshots à capturer (dans l'ordre)

### 1. Discover — Swipe
- Aller sur l'onglet Découvrir
- S'assurer qu'un profil est visible avec une belle photo et un bon score
- Idéalement montrer un score de compatibilité élevé (85%+) dans la carte
- Cmd+S pour screenshot simulateur (ou File > Save Screen dans le simulateur)

### 2. Compatibilité — Score
- Ouvrir un profil depuis Découvrir
- Scroller pour montrer le score de compatibilité et le RadarChart
- Choisir un profil avec un score élevé pour l'aspect visuel
- Cmd+S

### 3. Chat — Conversation
- Aller dans l'onglet Matchs
- Ouvrir une conversation existante
- Si la conversation est vide, les icebreakers s'affichent automatiquement → bon pour le screenshot
- Cmd+S pour montrer le chat avec icebreakers ou messages échangés

### 4. Match — Modal
- Simuler un match en likant un profil qui vous a déjà liké (seed DB)
- Le modal de match s'affiche avec les deux photos
- Cmd+S sur le modal "C'est un Match !"

### 5. Recherche — Grille
- Aller dans l'onglet Recherche
- Montrer la grille de profils avec plusieurs photos visibles
- Cmd+S

### 6. Profil — Questionnaire
- Aller dans l'onglet Profil
- Montrer le score de compatibilité, la barre de complétion et les stats
- Cmd+S

---

## Procédure technique (Xcode Simulator)

```bash
# 1. Lancer l'app sur simulateur
npx expo start --clear

# 2. Dans Xcode Simulator : Device > iPhone 17 Pro

# 3. Capturer un screenshot
# Méthode 1 : Cmd+S (sauvegarde dans ~/Desktop)
# Méthode 2 : File > Save Screen
# Méthode 3 : xcrun simctl io booted screenshot ~/Desktop/screenshot_name.png

# 4. Vérifier la résolution (doit être 1290x2796)
sips -g pixelWidth -g pixelHeight ~/Desktop/screenshot_name.png
```

---

## Légendes à ajouter (avec Canva ou Figma)

Ajouter sur chaque screenshot :
- Un titre accrocheur en haut (police bold, blanc, grande taille)
- Un sous-titre descriptif en dessous (police regular, blanc/gris clair)
- Fond légèrement assombri en haut et en bas (gradient noir 40% opacity)
- Optionnel : cadre de téléphone autour du screenshot pour un rendu premium

| # | Titre | Sous-titre |
|---|---|---|
| 1 | Découvrez des profils compatibles | Swipez des personnes qui vous correspondent vraiment |
| 2 | 91% de compatibilité | Algorithme basé sur 7 thèmes psychologiques |
| 3 | Lancez la conversation | Icebreakers personnalisés pour briser la glace |
| 4 | C'est un Match ! | Vous vous plaisez mutuellement |
| 5 | Explorez tous les profils | Filtrez par âge, distance et style de vie |
| 6 | Votre profil complet | Score de compatibilité visible par vos matchs |

---

## Palette de couleurs pour les légendes

Utiliser la palette dark theme de l'app (constants/colors.ts) :
- Fond overlay : `#000000` à 40% d'opacité
- Texte titre : `#FFFFFF`
- Texte sous-titre : `#E0C8FF` (violet clair, cohérent avec le thème NextLove)
- Accent : `#A855F7` (violet principal de l'app)

---

## Ressources Canva

Template recommandé : "App Store Screenshot" sur Canva
- Taille custom : 1290 × 2796 px
- Importer le screenshot comme image de fond
- Ajouter un rectangle dégradé noir en overlay (haut + bas)
- Ajouter le texte par-dessus

---

## Checklist screenshots

- [ ] Screenshot 1 : Discover / Swipe cards
- [ ] Screenshot 2 : Score de compatibilité / RadarChart
- [ ] Screenshot 3 : Chat / Icebreakers
- [ ] Screenshot 4 : Modal Match
- [ ] Screenshot 5 : Grille de recherche
- [ ] Screenshot 6 : Profil utilisateur
- [ ] Légendes ajoutées sur chaque screenshot (Canva/Figma)
- [ ] Résolution vérifiée : 1290 × 2796 px
- [ ] Format : PNG ou JPEG (pas de transparence)
- [ ] Uploadés dans App Store Connect > Screenshots
