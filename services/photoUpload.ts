import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

const BUCKET = 'photos';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
const MAX_DIMENSION = 1080; // px — resize if larger
const COMPRESS_QUALITY = 0.82; // JPEG quality after compression

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  publicUrl: string;
  path: string;
  sizeKb: number;
}

export type PhotoSource = 'gallery' | 'camera';

export interface ValidationError {
  code: 'TOO_LARGE' | 'WRONG_FORMAT' | 'PERMISSION_DENIED' | 'CANCELLED' | 'UNKNOWN';
  message: string;
}

// ─── Permission helpers ───────────────────────────────────────────────────────

async function requestGalleryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

// ─── Image picking ────────────────────────────────────────────────────────────

/**
 * Opens gallery or camera and returns the picked image URI.
 * Returns null if user cancelled or permission denied.
 * Throws ValidationError on hard failures.
 */
export async function pickImage(
  source: PhotoSource
): Promise<ImagePicker.ImagePickerAsset | null> {
  let result: ImagePicker.ImagePickerResult;

  if (source === 'camera') {
    const ok = await requestCameraPermission();
    if (!ok) {
      throw {
        code: 'PERMISSION_DENIED',
        message: 'Permission d\'accès à l\'appareil photo refusée.',
      } satisfies ValidationError;
    }
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // We compress ourselves below
    });
  } else {
    const ok = await requestGalleryPermission();
    if (!ok) {
      throw {
        code: 'PERMISSION_DENIED',
        message: 'Permission d\'accès à la galerie refusée.',
      } satisfies ValidationError;
    }
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
  }

  if (result.canceled || !result.assets?.length) return null;
  return result.assets[0];
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateAsset(asset: ImagePicker.ImagePickerAsset): void {
  // Format check (by extension when mimeType is unavailable)
  const mimeType = asset.mimeType ?? guessType(asset.uri);
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw {
      code: 'WRONG_FORMAT',
      message: 'Format invalide. Seuls JPG et PNG sont acceptés.',
    } satisfies ValidationError;
  }

  // Size check — fileSize may be undefined before compression
  if (asset.fileSize && asset.fileSize > MAX_SIZE_BYTES) {
    throw {
      code: 'TOO_LARGE',
      message: `La photo est trop lourde (max 5 MB, taille actuelle : ${(asset.fileSize / 1024 / 1024).toFixed(1)} MB).`,
    } satisfies ValidationError;
  }
}

function guessType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  return 'image/jpeg';
}

// ─── Compression ──────────────────────────────────────────────────────────────

/**
 * Resizes to MAX_DIMENSION on the longest side and compresses to JPEG.
 * Returns a new URI + estimated size.
 */
export async function compressImage(
  asset: ImagePicker.ImagePickerAsset
): Promise<{ uri: string; mimeType: string }> {
  const { width, height } = asset;

  // Compute target dimensions keeping aspect ratio
  let targetWidth = width;
  let targetHeight = height;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width >= height) {
      targetWidth = MAX_DIMENSION;
      targetHeight = Math.round((height / width) * MAX_DIMENSION);
    } else {
      targetHeight = MAX_DIMENSION;
      targetWidth = Math.round((width / height) * MAX_DIMENSION);
    }
  }

  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: targetWidth, height: targetHeight } }],
    {
      compress: COMPRESS_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  return { uri: manipulated.uri, mimeType: 'image/jpeg' };
}

// ─── Upload to Supabase Storage ───────────────────────────────────────────────

/**
 * Uploads the compressed image to Supabase Storage bucket "photos".
 * Path: {userId}/{timestamp}.jpg
 * Returns the public URL and storage path.
 */
export async function uploadToStorage(
  userId: string,
  uri: string,
  mimeType = 'image/jpeg'
): Promise<UploadResult> {
  // ArrayBuffer is more reliable than blob in React Native / Expo Go
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Impossible de lire le fichier image.');

  const arrayBuffer = await response.arrayBuffer();

  // Final size check after compression
  if (arrayBuffer.byteLength === 0) {
    throw new Error('Fichier image vide. Essayez une autre photo.');
  }
  if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
    throw {
      code: 'TOO_LARGE',
      message: `La photo compressée dépasse encore 5 MB (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB). Choisissez une image plus petite.`,
    } satisfies ValidationError;
  }

  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const fileName = `${Date.now()}.${ext}`;
  const path = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Upload échoué : ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

  return {
    publicUrl,
    path: data.path,
    sizeKb: Math.round(arrayBuffer.byteLength / 1024),
  };
}

// ─── Save URL to users table ──────────────────────────────────────────────────

/**
 * Saves the photo URL to the user's profile in the "users" table.
 * Sets it as primary photo and updates the photos array.
 */
export async function savePhotoToProfile(
  userId: string,
  publicUrl: string
): Promise<void> {
  // Get current photos array
  const { data: existing, error: fetchErr } = await supabase
    .from('users')
    .select('photos')
    .eq('id', userId)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);

  const currentPhotos: string[] = existing?.photos ?? [];
  // Add new photo at the front (primary)
  const updatedPhotos = [publicUrl, ...currentPhotos.filter(p => p !== publicUrl)];

  const { error: updateErr } = await supabase
    .from('users')
    .update({ photos: updatedPhotos })
    .eq('id', userId);

  if (updateErr) throw new Error(updateErr.message);
}

// ─── Delete old photo ─────────────────────────────────────────────────────────

export async function deletePhotoFromStorage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn('Delete failed (non-critical):', error.message);
}

// ─── Replace full photos array ───────────────────────────────────────────────

export async function updatePhotosArray(userId: string, photos: string[]): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ photos })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

// ─── All-in-one helper ────────────────────────────────────────────────────────

/**
 * Full flow: pick → validate → compress → upload → save to DB.
 * Returns the public URL or null if user cancelled.
 * Throws ValidationError on moderation failures.
 */
export async function pickAndUploadPhoto(
  source: PhotoSource,
  userId: string
): Promise<UploadResult | null> {
  const asset = await pickImage(source);
  if (!asset) return null;

  validateAsset(asset);

  const { uri, mimeType } = await compressImage(asset);
  const result = await uploadToStorage(userId, uri, mimeType);
  await savePhotoToProfile(userId, result.publicUrl);

  return result;
}
