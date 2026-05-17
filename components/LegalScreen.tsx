import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { LegalSection } from '../constants/legalContent';

// ─── Table of contents ────────────────────────────────────────────────────────

function TableOfContents({
  sections,
  onSelect,
}: {
  sections: LegalSection[];
  onSelect: (id: string) => void;
}) {
  return (
    <View style={tocStyles.container}>
      <Text style={tocStyles.label}>Sommaire</Text>
      {sections.map((s) => (
        <TouchableOpacity
          key={s.id}
          onPress={() => onSelect(s.id)}
          style={tocStyles.item}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={13} color={Colors.primary} />
          <Text style={tocStyles.text}>{s.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const tocStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 8,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  text: { color: Colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },
});

// ─── Section block ────────────────────────────────────────────────────────────

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.titleRow}>
        <View style={sectionStyles.titleAccent} />
        <Text style={sectionStyles.title}>{section.title}</Text>
      </View>
      <Text style={sectionStyles.content}>{section.content}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleAccent: {
    width: 3,
    height: '100%',
    minHeight: 20,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginTop: 2,
  },
  title: { color: Colors.text, fontSize: 16, fontWeight: '700', flex: 1, lineHeight: 22 },
  content: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
});

// ─── Read progress bar ────────────────────────────────────────────────────────

function ReadProgress({ progress }: { progress: number }) {
  return (
    <View style={progressStyles.track}>
      <Animated.View
        style={[progressStyles.fill, { width: `${Math.round(progress * 100)}%` }]}
      />
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 2,
    backgroundColor: Colors.cardBorder,
    width: '100%',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
});

// ─── Main LegalScreen component ───────────────────────────────────────────────

interface LegalScreenProps {
  title: string;
  subtitle: string;
  icon: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export default function LegalScreen({
  title,
  subtitle,
  icon,
  lastUpdated,
  sections,
}: LegalScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  const sectionRefs = useRef<Record<string, number>>({});
  const [readProgress, setReadProgress] = useState(0);
  const [showToc, setShowToc] = useState(false);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll <= 0) return;
    setReadProgress(Math.min(1, contentOffset.y / maxScroll));
  };

  const scrollToSection = (id: string) => {
    const y = sectionRefs.current[id];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: y - 80, animated: true });
      setShowToc(false);
    }
  };

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{title}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowToc(v => !v)}
            style={[styles.tocBtn, showToc && styles.tocBtnActive]}
          >
            <Ionicons
              name="list"
              size={20}
              color={showToc ? Colors.primary : Colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Read progress */}
        <ReadProgress progress={readProgress} />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <LinearGradient colors={Colors.gradientAccent} style={styles.heroIcon}>
              <Ionicons name={icon as any} size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSub}>{subtitle}</Text>
            <View style={styles.updateBadge}>
              <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.updateText}>Mise à jour le {lastUpdated}</Text>
            </View>
          </View>

          {/* Table of contents (collapsible) */}
          {showToc && (
            <TableOfContents sections={sections} onSelect={scrollToSection} />
          )}

          {/* Sections */}
          <View style={styles.sections}>
            {sections.map((section) => (
              <View
                key={section.id}
                onLayout={(e) => {
                  sectionRefs.current[section.id] = e.nativeEvent.layout.y;
                }}
              >
                <SectionBlock section={section} />
              </View>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.textMuted} />
            <Text style={styles.footerText}>
              Ce document est conforme au RGPD (Règlement UE 2016/679) et à la loi
              Informatique et Libertés modifiée.
            </Text>
          </View>

          {/* Back to top */}
          {readProgress > 0.3 && (
            <TouchableOpacity
              onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
              style={styles.backToTop}
              activeOpacity={0.8}
            >
              <LinearGradient colors={Colors.gradientPrimary} style={styles.backToTopBtn}>
                <Ionicons name="arrow-up" size={16} color="#FFF" />
                <Text style={styles.backToTopText}>Haut de page</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  tocBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tocBtnActive: { borderColor: Colors.primary, backgroundColor: 'rgba(255,107,157,0.1)' },
  scroll: { paddingHorizontal: 16 },
  hero: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: Colors.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  heroSub: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  updateText: { color: Colors.textMuted, fontSize: 11 },
  sections: { gap: 0 },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  footerText: { color: Colors.textMuted, fontSize: 12, flex: 1, lineHeight: 18 },
  backToTop: { alignSelf: 'center', marginTop: 20, borderRadius: 20, overflow: 'hidden' },
  backToTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backToTopText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
});
