import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import {
  pickAndUploadPhoto,
  PhotoSource,
  UploadResult,
  ValidationError,
} from '../services/photoUpload';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhotoPickerProps {
  userId: string;
  currentPhotoUrl?: string;
  size?: number;
  onSuccess?: (result: UploadResult) => void;
  onError?: (err: ValidationError | Error) => void;
}

// ─── Source Picker Modal ──────────────────────────────────────────────────────

function SourceModal({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (src: PhotoSource) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={modal.overlay} onPress={onClose}>
        <Pressable style={modal.sheet} onPress={e => e.stopPropagation()}>
          <LinearGradient colors={Colors.gradientCard} style={modal.sheetInner}>
            <View style={modal.handle} />
            <Text style={modal.title}>Photo de profil</Text>
            <Text style={modal.subtitle}>Choisissez la source de votre photo</Text>

            <TouchableOpacity
              style={modal.option}
              activeOpacity={0.75}
              onPress={() => onSelect('camera')}
            >
              <LinearGradient
                colors={Colors.gradientPrimary}
                style={modal.optionIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="camera" size={22} color="#FFF" />
              </LinearGradient>
              <View style={modal.optionText}>
                <Text style={modal.optionTitle}>Prendre une photo</Text>
                <Text style={modal.optionSub}>Utiliser l'appareil photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={modal.divider} />

            <TouchableOpacity
              style={modal.option}
              activeOpacity={0.75}
              onPress={() => onSelect('gallery')}
            >
              <LinearGradient
                colors={['#6B35D9', '#9B59B6']}
                style={modal.optionIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="images" size={22} color="#FFF" />
              </LinearGradient>
              <View style={modal.optionText}>
                <Text style={modal.optionTitle}>Choisir depuis la galerie</Text>
                <Text style={modal.optionSub}>JPG ou PNG · max 5 MB</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={modal.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={modal.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: { marginHorizontal: 12, marginBottom: 12 },
  sheetInner: {
    borderRadius: 24,
    padding: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.cardBorder,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { color: Colors.text, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  optionSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 4,
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  cancelText: { color: Colors.textMuted, fontSize: 15, fontWeight: '600' },
});

// ─── Upload Progress Overlay ──────────────────────────────────────────────────

function UploadOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View style={overlay.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={overlay.text}>Envoi en cours...</Text>
    </View>
  );
}

const overlay = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: 'rgba(15,5,32,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: { color: '#FFF', fontSize: 10, fontWeight: '700' },
});

// ─── PhotoPicker ──────────────────────────────────────────────────────────────

export default function PhotoPicker({
  userId,
  currentPhotoUrl,
  size = 100,
  onSuccess,
  onError,
}: PhotoPickerProps) {
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(currentPhotoUrl);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedKb, setUploadedKb] = useState<number | null>(null);

  const handleSelect = async (source: PhotoSource) => {
    setShowModal(false);

    // Small delay so modal closes before picker opens
    await new Promise(r => setTimeout(r, 200));

    setUploading(true);
    setUploadedKb(null);

    try {
      const result = await pickAndUploadPhoto(source, userId);
      if (!result) {
        // User cancelled — no error
        setUploading(false);
        return;
      }

      setPhotoUrl(result.publicUrl);
      setUploadedKb(result.sizeKb);
      onSuccess?.(result);
    } catch (err: any) {
      const validationErr = err as ValidationError;
      if (validationErr.code === 'CANCELLED') {
        // silent
      } else {
        Alert.alert(
          'Photo non acceptée',
          validationErr.message ?? 'Une erreur est survenue.',
          [{ text: 'OK' }]
        );
        onError?.(err);
      }
    } finally {
      setUploading(false);
    }
  };

  const avatarSize = size;
  const editBtnSize = Math.round(size * 0.32);

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        activeOpacity={0.85}
        style={[pickerStyles.wrapper, { width: avatarSize, height: avatarSize }]}
        disabled={uploading}
      >
        {/* Avatar */}
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={[
              pickerStyles.avatar,
              { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
            ]}
          />
        ) : (
          <LinearGradient
            colors={['rgba(255,107,157,0.15)', 'rgba(106,53,217,0.15)']}
            style={[
              pickerStyles.placeholder,
              { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
            ]}
          >
            <Ionicons name="person" size={avatarSize * 0.45} color={Colors.textMuted} />
          </LinearGradient>
        )}

        {/* Upload overlay */}
        <UploadOverlay visible={uploading} />

        {/* Edit button */}
        {!uploading && (
          <LinearGradient
            colors={Colors.gradientPrimary}
            style={[
              pickerStyles.editBtn,
              {
                width: editBtnSize,
                height: editBtnSize,
                borderRadius: editBtnSize / 2,
                bottom: 0,
                right: 0,
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="camera" size={editBtnSize * 0.5} color="#FFF" />
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* Feedback badge */}
      {uploadedKb !== null && !uploading && (
        <View style={pickerStyles.successBadge}>
          <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
          <Text style={pickerStyles.successText}>
            Photo mise à jour · {uploadedKb} Ko
          </Text>
        </View>
      )}

      <SourceModal
        visible={showModal}
        onSelect={handleSelect}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

const pickerStyles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignSelf: 'center',
  },
  avatar: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  editBtn: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0,230,118,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,230,118,0.25)',
  },
  successText: { color: Colors.success, fontSize: 11, fontWeight: '600' },
});
