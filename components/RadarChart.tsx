/**
 * RadarChart — implémentation pure React Native (sans SVG natif)
 * Utilise des Views positionnées en absolu avec transforms.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';

export interface RadarAxis {
  label: string;
  emoji: string;
  value: number; // 0–100
}

interface Props {
  axes: RadarAxis[];
  size?: number;
  color?: string;
}

export default function RadarChart({ axes, size = 240, color = Colors.primary }: Props) {
  if (axes.length < 3) return null;

  const n = axes.length;
  const R = size / 2 - 32; // rayon des points de données
  const cx = size / 2;
  const cy = size / 2;

  const anims = useRef(axes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = axes.map((a, i) =>
      Animated.timing(anims[i], {
        toValue: a.value / 100,
        duration: 600 + i * 80,
        useNativeDriver: false,
      })
    );
    Animated.stagger(60, animations).start();
  }, []);

  // Coordonnées d'un point (value en 0–1)
  const pt = (value: number, i: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + R * value * Math.cos(angle),
      y: cy + R * value * Math.sin(angle),
    };
  };

  // Grille de fond (cercles concentriques simulés avec les labels)
  const levels = [0.25, 0.5, 0.75, 1];

  return (
    <View style={[styles.container, { width: size, height: size }]}>

      {/* Lignes d'axes (simple ligne depuis le centre) */}
      {axes.map((_, i) => {
        const end = pt(1, i);
        const dx = end.x - cx;
        const dy = end.y - cy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={`axis-${i}`}
            style={{
              position: 'absolute',
              left: cx,
              top: cy - 0.5,
              width: len,
              height: 1,
              backgroundColor: 'rgba(255,255,255,0.08)',
              transformOrigin: 'left center',
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {/* Polygones niveaux (cercles approximatifs visibles en points) */}
      {levels.map((lvl, l) => (
        axes.map((_, i) => {
          const p = pt(lvl, i);
          return (
            <View
              key={`grid-${l}-${i}`}
              style={{
                position: 'absolute',
                left: p.x - 2,
                top: p.y - 2,
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: `rgba(255,255,255,${0.04 + l * 0.02})`,
              }}
            />
          );
        })
      ))}

      {/* Barres de données animées depuis le centre */}
      {axes.map((a, i) => {
        const end = pt(1, i);
        const dx = end.x - cx;
        const dy = end.y - cy;
        const totalLen = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <Animated.View
            key={`bar-${i}`}
            style={{
              position: 'absolute',
              left: cx,
              top: cy - 2,
              height: 4,
              borderRadius: 2,
              backgroundColor: color + 'CC',
              width: anims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [0, totalLen],
              }),
              transformOrigin: 'left center',
              transform: [{ rotate: `${angle}deg` }],
            }}
          />
        );
      })}

      {/* Points de données */}
      {axes.map((a, i) => {
        const p = pt(a.value / 100, i);
        return (
          <Animated.View
            key={`dot-${i}`}
            style={{
              position: 'absolute',
              left: anims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [cx - 5, p.x - 5],
              }),
              top: anims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [cy - 5, p.y - 5],
              }),
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color,
              borderWidth: 2,
              borderColor: '#1A0A35',
            }}
          />
        );
      })}

      {/* Labels emoji + score */}
      {axes.map((a, i) => {
        const labelR = R + 22;
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        const scoreColor = a.value >= 80 ? Colors.success : a.value >= 60 ? Colors.warning : Colors.danger;
        return (
          <View
            key={`label-${i}`}
            style={[styles.labelWrap, { left: lx - 20, top: ly - 16 }]}
          >
            <Text style={styles.emoji}>{a.emoji}</Text>
            <Text style={[styles.score, { color: scoreColor }]}>{a.value}%</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  labelWrap: {
    position: 'absolute',
    alignItems: 'center',
    width: 40,
  },
  emoji: { fontSize: 15 },
  score: { fontSize: 10, fontWeight: '800', marginTop: 1 },
});
