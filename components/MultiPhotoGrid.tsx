import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import {
  pickImage,
  compressImage,
  uploadToStorage,
  updatePhotosArray,
} from '../services/photoUpload';

const MAX_PHOTOS = 5;

interface Props {
  userId: string;
  photos: string[];         // URLs actuelles (max 5)
  onChange: (photos: string[]) => void;
}

export default function MultiPhotoGrid({ userId, photos, onChange }: Props) {
  const [uploading, setUploading] = useState<number | null>(null); // slot en cours d'upload

  const handleAdd = async (slotIndex: number) => {
    try {
      const asset = await pickImage('gallery');
      if (!asset) return;

      setUploading(slotIndex);
      const { uri, mimeType } = await compressImage(asset);
      const result = await uploadToStorage(userId, uri, mimeType);

      const newPhotos = [...photos];
      if (slotIndex < photos.length) {
        // Remplace une photo existante
        newPhotos[slotIndex] = result.publicUrl;
      } else {
        // Ajoute une nouvelle photo
        newPhotos.push(result.publicUrl);
      }

      await updatePhotosArray(userId, newPhotos);
      onChange(newPhotos);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible d\'ajouter cette photo.');
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = (slotIndex: number) => {
    Alert.alert(
      'Supprimer cette photo ?',
      slotIndex === 0 ? 'C\'est votre photo principale. La suivante la remplacera.' : '',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const newPhotos = photos.filter((_, i) => i !== slotIndex);
            await updatePhotosArray(userId, newPhotos).catch(() => {});
            onChange(newPhotos);
          },
        },
      ]
    );
  };

  const handleMoveLeft = async (index: number) => {
    if (index === 0) return;
    const newPhotos = [...photos];
    [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
    await updatePhotosArray(userId, newPhotos).catch(() => {});
    onChange(newPhotos);
  };

  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {/* Photos existantes */}
        {photos.slice(0, MAX_PHOTOS).map((uri, i) => (
          <View key={i} style={[styles.slot, i === 0 && styles.slotPrimary]}>
            <Image source={{ uri }} style={styles.photo} resizeMode="cover" />

            {/* Badge principale */}
            {i === 0 && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Principale</Text>
              </View>
            )}

            {/* Uploading overlay */}
            {uploading === i && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#FFF" size="small" />
              </View>
            )}

            {/* Actions: déplacer à gauche + supprimer */}
            <View style={styles.actions}>
              {i > 0 && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleMoveLeft(i)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={13} color="#FFF" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleDelete(i)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={13} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Tap to replace */}
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={() => handleAdd(i)}
              activeOpacity={1}
            />
          </View>
        ))}

        {/* Bouton ajouter — uniquement si pas encore au max */}
        {canAddMore && (
          <TouchableOpacity
            style={[styles.slot, styles.addSlot]}
            onPress={() => handleAdd(photos.length)}
            activeOpacity={0.75}
          >
            {uploading === photos.length ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <LinearGradient
                  colors={['rgba(255,107,157,0.2)', 'rgba(196,77,255,0.15)']}
                  style={styles.addIcon}
                >
                  <Ionicons name="add" size={24} color={Colors.primary} />
                </LinearGradient>
                <Text style={styles.addText}>Ajouter</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.hint}>
        {photos.length}/{MAX_PHOTOS} photos · Appuyez pour changer · Flèche pour réorganiser
      </Text>
    </View>
  );
}

const SLOT_SIZE = 104;

const styles = StyleSheet.create({
  container: { gap: 10 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE * 1.3,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    position: 'relative',
  },
  slotPrimary: {
    width: SLOT_SIZE * 1.5,
    height: SLOT_SIZE * 1.5,
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 3,
  },
  primaryBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  actions: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    gap: 5,
    zIndex: 3,
  },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: { backgroundColor: 'rgba(220,50,50,0.8)' },
  addSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,107,157,0.4)',
    backgroundColor: 'rgba(255,107,157,0.05)',
  },
  addIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,107,157,0.3)',
  },
  addText: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  hint: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' },
});
