import React, { useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');

interface PhotoViewerProps {
  photos: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
  name?: string;
}

export default function PhotoViewer({
  photos,
  initialIndex = 0,
  visible,
  onClose,
  name,
}: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Reset index when opening
  React.useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: initialIndex * W, animated: false });
      }, 50);
    }
  }, [visible, initialIndex]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W);
    setCurrentIndex(Math.max(0, Math.min(photos.length - 1, idx)));
  }, [photos.length]);

  const handleClose = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(onClose);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <StatusBar hidden />
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>

        {/* Photos horizontales */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={StyleSheet.absoluteFill}
        >
          {photos.map((uri, i) => (
            <ScrollView
              key={i}
              style={{ width: W, height: H }}
              contentContainerStyle={styles.imageContainer}
              maximumZoomScale={4}
              minimumZoomScale={1}
              centerContent
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              bouncesZoom
            >
              <Image
                source={{ uri }}
                style={styles.photo}
                resizeMode="contain"
              />
            </ScrollView>
          ))}
        </ScrollView>

        {/* Header overlay */}
        <SafeAreaView style={styles.header} edges={['top']}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>

          {name && (
            <Text style={styles.headerName}>{name}</Text>
          )}

          {photos.length > 1 && (
            <Text style={styles.counter}>
              {currentIndex + 1} / {photos.length}
            </Text>
          )}
        </SafeAreaView>

        {/* Dots indicator */}
        {photos.length > 1 && (
          <View style={styles.dots}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Arrows (desktop-like navigation) */}
        {photos.length > 1 && currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.arrow, styles.arrowLeft]}
            onPress={() => {
              const newIdx = currentIndex - 1;
              scrollRef.current?.scrollTo({ x: newIdx * W, animated: true });
              setCurrentIndex(newIdx);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
        )}
        {photos.length > 1 && currentIndex < photos.length - 1 && (
          <TouchableOpacity
            style={[styles.arrow, styles.arrowRight]}
            onPress={() => {
              const newIdx = currentIndex + 1;
              scrollRef.current?.scrollTo({ x: newIdx * W, animated: true });
              setCurrentIndex(newIdx);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={28} color="#FFF" />
          </TouchableOpacity>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    width: W,
    height: H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: W,
    height: H,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  counter: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  dots: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    zIndex: 10,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
  dotActive: {
    width: 22,
    backgroundColor: '#FFF',
  },
  dotInactive: {
    width: 7,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
});
