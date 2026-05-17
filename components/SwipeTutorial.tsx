import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/colors';

const TUTORIAL_KEY = '@nextlove:swipe_tutorial_shown';

const STEPS = [
  { icon: 'heart', color: Colors.likeColor, direction: 'right', label: 'Swipe à droite', sub: 'pour liker un profil' },
  { icon: 'close', color: Colors.skipColor, direction: 'left', label: 'Swipe à gauche', sub: 'pour passer' },
  { icon: 'information-circle-outline', color: Colors.primary, direction: null, label: 'Tape sur le profil', sub: 'pour voir plus de détails' },
];

export default function SwipeTutorial() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(TUTORIAL_KEY).then(val => {
      if (!val) setVisible(true);
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    animateArrow();
  }, [visible, step]);

  const animateArrow = () => {
    arrowAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(arrowAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      { iterations: 3 }
    ).start();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      AsyncStorage.setItem(TUTORIAL_KEY, '1');
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setVisible(false));
    }
  };

  if (!visible) return null;

  const current = STEPS[step];
  const translateX = arrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: current.direction === 'right' ? [0, 20] : current.direction === 'left' ? [0, -20] : [0, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.card}>
          {/* Icône animée */}
          <Animated.View style={[styles.iconWrap, { backgroundColor: current.color + '22', transform: [{ translateX }] }]}>
            <Ionicons name={current.icon as any} size={48} color={current.color} />
          </Animated.View>

          {/* Flèche directionnelle */}
          {current.direction && (
            <Animated.View style={[styles.arrow, { transform: [{ translateX }] }]}>
              <Ionicons
                name={current.direction === 'right' ? 'arrow-forward' : 'arrow-back'}
                size={32}
                color={current.color}
              />
            </Animated.View>
          )}

          <Text style={styles.label}>{current.label}</Text>
          <Text style={styles.sub}>{current.sub}</Text>

          {/* Dots */}
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === step && { backgroundColor: Colors.primary, width: 20 }]} />
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleNext} activeOpacity={0.85}>
            <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnInner}>
              <Text style={styles.btnText}>{step < STEPS.length - 1 ? 'Suivant' : "C'est parti !"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { AsyncStorage.setItem(TUTORIAL_KEY, '1'); setVisible(false); }} style={styles.skip}>
            <Text style={styles.skipText}>Passer</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    position: 'absolute',
    top: 56,
    right: 48,
  },
  label: { color: Colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { color: Colors.textMuted, fontSize: 15, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cardBorder },
  btn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  btnInner: { paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  skip: { paddingVertical: 8 },
  skipText: { color: Colors.textMuted, fontSize: 13 },
});
