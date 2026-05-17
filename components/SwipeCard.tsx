import React, { useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Profile } from '../constants/mockData';
import { formatLastSeen } from '../utils/time';
import PhotoViewer from './PhotoViewer';
import { PROMPTS } from '../constants/prompts';
import { Colors } from '../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT_DEFAULT = SCREEN_HEIGHT * 0.57;

interface SwipeCardProps {
  profile: Profile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  cardHeight?: number;
}

export default function SwipeCard({ profile, onSwipeLeft, onSwipeRight, isTop, cardHeight }: SwipeCardProps) {
  const CARD_HEIGHT = cardHeight ?? CARD_HEIGHT_DEFAULT;
  const position = useRef(new Animated.ValueXY()).current;
  const [photoIndex, setPhotoIndex] = useState(0);

  // Toutes les photos disponibles
  const allPhotos = profile.photos && profile.photos.length > 1
    ? profile.photos
    : [profile.photo];

  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 6],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const skipOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 6, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Ref pour accéder à la valeur courante dans la closure PanResponder
  const photoIndexRef = useRef(0);
  const allPhotosRef = useRef(allPhotos);
  allPhotosRef.current = allPhotos;

  const goNextPhoto = () => {
    const max = allPhotosRef.current.length - 1;
    if (photoIndexRef.current < max) {
      photoIndexRef.current += 1;
      setPhotoIndex(photoIndexRef.current);
    }
  };

  const goPrevPhoto = () => {
    if (photoIndexRef.current > 0) {
      photoIndexRef.current -= 1;
      setPhotoIndex(photoIndexRef.current);
    }
  };

  const touchStartX = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onPanResponderGrant: (evt) => {
        touchStartX.current = evt.nativeEvent.pageX;
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
      },
      onPanResponderRelease: (_, gesture) => {
        const absDx = Math.abs(gesture.dx);
        const absDy = Math.abs(gesture.dy);
        const isTap = absDx < 10 && absDy < 10;

        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else if (isTap && allPhotosRef.current.length > 1) {
          resetPosition();
          // Utilise pageX du début du touch pour déterminer le côté
          const screenMid = SCREEN_WIDTH / 2;
          if (touchStartX.current > screenMid - 30) {
            goNextPhoto();
          } else {
            goPrevPhoto();
          }
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'right' | 'left') => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -(SCREEN_WIDTH + 100);
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setPhotoIndex(0);
      if (direction === 'right') onSwipeRight();
      else onSwipeLeft();
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  const score = profile.compatibilityScore ?? 75;
  const scoreColor = score >= 80 ? Colors.success : score >= 60 ? Colors.warning : Colors.danger;
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);

  const cardStyle = isTop
    ? { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate: rotation }] }
    : { transform: [{ scale: 0.95 }], top: 10 };

  return (
    <Animated.View style={[styles.card, { height: CARD_HEIGHT }, cardStyle]} {...(isTop ? panResponder.panHandlers : {})}>

      {/* Photo actuelle — double tap pour ouvrir le viewer */}
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={() => isTop && setPhotoViewerOpen(true)}
        delayLongPress={600}
        style={StyleSheet.absoluteFill}
      >
        <Image source={{ uri: allPhotos[photoIndex] }} style={styles.image} />
      </TouchableOpacity>

      {/* Indicateur visuel zones tap (gauche/droite) — interaction gérée par PanResponder */}

      {/* Indicateurs de photos en haut */}
      {allPhotos.length > 1 && (
        <View style={styles.dotsRow}>
          {allPhotos.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === photoIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
      />

      {/* LIKE overlay */}
      {isTop && (
        <Animated.View style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}>
          <View style={styles.overlayBadge}>
            <Ionicons name="heart" size={28} color={Colors.likeColor} />
            <Text style={[styles.overlayText, { color: Colors.likeColor }]}>LIKE</Text>
          </View>
        </Animated.View>
      )}

      {/* NOPE overlay */}
      {isTop && (
        <Animated.View style={[styles.overlay, styles.skipOverlay, { opacity: skipOpacity }]}>
          <View style={styles.overlayBadge}>
            <Ionicons name="close" size={28} color={Colors.skipColor} />
            <Text style={[styles.overlayText, { color: Colors.skipColor }]}>NOPE</Text>
          </View>
        </Animated.View>
      )}

      {/* AI Score badge */}
      <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
        <LinearGradient colors={['#1A0A35', '#2A0A4A']} style={styles.scoreBadgeInner}>
          <Ionicons name="sparkles" size={10} color={scoreColor} />
          <Text style={[styles.scoreText, { color: scoreColor }]}>{score}%</Text>
        </LinearGradient>
      </View>

      {/* Profile info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.age}>, {profile.age} ans</Text>
          {(() => {
            const ls = formatLastSeen(profile.lastSeen);
            if (!ls) return null;
            return (
              <View style={[styles.onlineBadge, ls.isOnline && styles.onlineBadgeGreen]}>
                <View style={[styles.onlineDot, ls.isOnline ? styles.onlineDotGreen : styles.onlineDotOrange]} />
                <Text style={[styles.onlineText, ls.isOnline && styles.onlineTextGreen]}>
                  {ls.isOnline ? 'En ligne' : ls.isRecent ? "Auj." : ''}
                </Text>
              </View>
            );
          })()}
        </View>
        {profile.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.location}>{profile.location}</Text>
          </View>
        ) : null}
        {profile.job ? (
          <View style={styles.locationRow}>
            <Ionicons name="briefcase-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.location}>{profile.job}</Text>
          </View>
        ) : null}
        {/* Prompt mis en avant (premier prompt si existe, sinon bio) */}
        {profile.profilePrompts && profile.profilePrompts.length > 0 ? (() => {
          const pp = profile.profilePrompts[0];
          const def = PROMPTS.find(p => p.id === pp.promptId);
          return (
            <View style={styles.promptCard}>
              {def && <Text style={styles.promptQuestion}>{def.emoji} {def.question}</Text>}
              <Text style={styles.promptAnswer} numberOfLines={2}>{pp.answer}</Text>
            </View>
          );
        })() : profile.bio ? (
          <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
        ) : null}
        <View style={styles.bottomRow}>
          <View style={styles.interestRow}>
            {profile.interests
              .filter(v =>
                v.length > 1 &&
                !v.includes('_') &&
                !v.match(/^(smoker|drinker|children|infidelity|no_|has_|wants_|long_|different_|casual_|religion_|jealousy)/) &&
                !v.match(/[Aa]lcool|[Ii]nfidél|[Ff]umeur|[Tt]romperie|[Jj]ealoux|[Vv]iolence|[Mm]anipu|[Tt]oxique|[Dd]ominant|[Pp]assé|[Ff]réquent/)
              )
              .slice(0, 2)
              .map((interest, i) => (
                <View key={i} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => router.push({
              pathname: '/profile/[userId]',
              params: {
                userId: profile.id,
                name: profile.name,
                photo: profile.photo,
                score: String(profile.compatibilityScore ?? 75),
                bio: profile.bio ?? '',
                job: profile.job ?? '',
                education: profile.education ?? '',
                location: profile.location ?? '',
              },
            })}
            activeOpacity={0.8}
          >
            <Ionicons name="information-circle-outline" size={16} color="#FFF" />
            <Text style={styles.profileBtnText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Photo viewer plein écran (longpress) */}
      <PhotoViewer
        photos={allPhotos}
        initialIndex={photoIndex}
        visible={photoViewerOpen}
        onClose={() => setPhotoViewerOpen(false)}
        name={profile.name}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // Indicateurs dots
  dotsRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#FFF',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  overlay: {
    position: 'absolute',
    top: 24,
    padding: 8,
    zIndex: 20,
  },
  likeOverlay: { left: 20 },
  skipOverlay: { right: 20 },
  overlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderColor: Colors.likeColor,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scoreBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    zIndex: 10,
  },
  scoreBadgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scoreText: { fontSize: 13, fontWeight: '700' },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 6,
    zIndex: 10,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,160,0,0.2)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  onlineBadgeGreen: { backgroundColor: 'rgba(0,230,118,0.2)' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF9800' },
  onlineDotGreen: { backgroundColor: '#00E676' },
  onlineDotOrange: { backgroundColor: '#FF9800' },
  onlineText: { color: '#FF9800', fontSize: 10, fontWeight: '700' },
  onlineTextGreen: { color: '#00E676' },
  name: { color: Colors.text, fontSize: 26, fontWeight: '800' },
  age: { color: Colors.textSecondary, fontSize: 22, fontWeight: '400' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { color: Colors.textSecondary, fontSize: 13 },
  bio: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18 },
  promptCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  promptQuestion: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', marginBottom: 3 },
  promptAnswer: { color: '#FFF', fontSize: 12, lineHeight: 17, fontWeight: '500' },
  interestRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  interestTag: {
    backgroundColor: 'rgba(255,107,157,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.4)',
  },
  interestText: { color: Colors.primary, fontSize: 11, fontWeight: '600' },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  profileBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
});
