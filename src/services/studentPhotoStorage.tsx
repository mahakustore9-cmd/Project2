import { useState, useEffect } from 'react';
import { getSupabase } from './supabase';
import { Student } from '../types';

export const STUDENT_PHOTOS_BUCKET = 'student-photos';

// In-memory cache for signed URLs to eliminate duplicate API requests
interface CacheEntry {
  url: string;
  expiresAt: number; // unix timestamp in ms
}
const signedUrlCache = new Map<string, CacheEntry>();

/**
 * Checks if a given string represents a Supabase Storage path
 * e.g. "students/STU-2026-001.jpg" vs "data:image/jpeg;base64,..." or "https://images.unsplash..."
 */
export function isStoragePath(urlOrPath: string | null | undefined): boolean {
  if (!urlOrPath || typeof urlOrPath !== 'string') return false;
  const trimmed = urlOrPath.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return false;
  }
  return trimmed.length > 0;
}

/**
 * Converts a Base64 data URL into a binary Blob
 */
export function base64ToBlob(base64DataUrl: string): { blob: Blob; mimeType: string } {
  const parts = base64DataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const byteString = atob(parts[1] || parts[0]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([uint8Array], { type: mimeType });
  return { blob, mimeType };
}

/**
 * Generates or retrieves a cached signed URL for a private storage path.
 * Default expiration: 24 hours (86,400 seconds).
 */
export async function getSignedPhotoUrl(storagePath: string, expiresInSeconds = 86400): Promise<string> {
  const cleanPath = storagePath.trim();
  if (!cleanPath) return '';

  const now = Date.now();
  const cached = signedUrlCache.get(cleanPath);
  // Re-use cache if valid for at least 5 more minutes
  if (cached && cached.expiresAt > now + 300000) {
    return cached.url;
  }

  try {
    const client = getSupabase();
    const { data, error } = await client.storage
      .from(STUDENT_PHOTOS_BUCKET)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error) {
      console.warn(`[Storage] Failed to generate signed URL for ${cleanPath}:`, error.message);
      return '';
    }

    if (data?.signedUrl) {
      signedUrlCache.set(cleanPath, {
        url: data.signedUrl,
        expiresAt: now + expiresInSeconds * 1000,
      });
      return data.signedUrl;
    }
  } catch (err) {
    console.error(`[Storage] Network error creating signed URL for ${cleanPath}:`, err);
  }

  return '';
}

/**
 * Synchronously checks if a signed URL is already cached
 */
export function getCachedSignedUrl(storagePath: string): string | null {
  const cleanPath = storagePath.trim();
  const cached = signedUrlCache.get(cleanPath);
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.url;
  }
  return null;
}

/**
 * Resolves any student photo string (Base64, external URL, or Storage path)
 * into a valid browser-renderable image URL.
 */
export async function resolveStudentPhotoUrl(photoUrl: string | undefined | null): Promise<string> {
  if (!photoUrl) return '';
  if (!isStoragePath(photoUrl)) {
    return photoUrl; // Already a direct URL or Base64
  }
  return getSignedPhotoUrl(photoUrl);
}

/**
 * React Hook to safely resolve a student photo URL
 * - If Base64 or external URL: returns immediately with zero delay/flicker
 * - If Storage path: retrieves signed URL (cached or via API)
 */
export function useStudentPhotoUrl(photoUrl: string | undefined | null): string {
  const [resolved, setResolved] = useState<string>(() => {
    if (!photoUrl) return '';
    if (!isStoragePath(photoUrl)) return photoUrl;
    return getCachedSignedUrl(photoUrl) || '';
  });

  useEffect(() => {
    if (!photoUrl) {
      setResolved('');
      return;
    }

    if (!isStoragePath(photoUrl)) {
      setResolved(photoUrl);
      return;
    }

    const cached = getCachedSignedUrl(photoUrl);
    if (cached) {
      setResolved(cached);
      return;
    }

    let isMounted = true;
    getSignedPhotoUrl(photoUrl).then((signed) => {
      if (isMounted && signed) {
        setResolved(signed);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [photoUrl]);

  return resolved;
}

/**
 * Reusable Student Photo Component with built-in Storage path resolution,
 * private signed URL fetching, and graceful fallback.
 */
export function StudentPhoto({
  photoUrl,
  alt = 'Student Photo',
  className = 'w-10 h-10 rounded-xl object-cover',
  fallbackSrc = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
}: {
  photoUrl?: string | null;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
}) {
  const resolvedUrl = useStudentPhotoUrl(photoUrl);

  return (
    <img
      src={resolvedUrl || fallbackSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallbackSrc;
      }}
    />
  );
}

/**
 * Uploads an image Blob to Supabase Storage under `students/${studentId}.jpg`.
 * Returns the small deterministic storage path e.g. "students/STU-2026-001.jpg"
 */
export async function uploadStudentPhotoToStorage(
  studentId: string,
  imageBlob: Blob
): Promise<{ storagePath: string; error?: string }> {
  const cleanStudentId = studentId.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const storagePath = `students/${cleanStudentId}.jpg`;

  try {
    const client = getSupabase();
    const { error } = await client.storage
      .from(STUDENT_PHOTOS_BUCKET)
      .upload(storagePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      return { storagePath, error: error.message };
    }

    // Invalidate local signed url cache for this path so fresh image is shown
    signedUrlCache.delete(storagePath);

    return { storagePath };
  } catch (err: any) {
    return { storagePath, error: err.message || 'Unknown network error uploading image' };
  }
}

/**
 * Checks if the student-photos bucket exists. If not, attempts to initialize it.
 */
export async function ensureBucketExists(): Promise<{ exists: boolean; error?: string }> {
  try {
    const client = getSupabase();
    const { data: buckets, error } = await client.storage.listBuckets();
    if (error) {
      return { exists: false, error: error.message };
    }
    const found = buckets?.some((b) => b.id === STUDENT_PHOTOS_BUCKET);
    if (found) {
      return { exists: true };
    }

    // Try creating it as a private bucket
    const { error: createError } = await client.storage.createBucket(STUDENT_PHOTOS_BUCKET, {
      public: false,
      fileSizeLimit: 1048576, // 1MB limit
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (createError) {
      return { exists: false, error: createError.message };
    }
    return { exists: true };
  } catch (err: any) {
    return { exists: false, error: err.message || 'Network error' };
  }
}

/**
 * Test migration of ONE student:
 * 1. Checks if student photo is Base64 data URL
 * 2. Decodes Base64 to Blob
 * 3. Uploads Blob to Supabase Storage `student-photos` bucket
 * 4. Verifies upload by generating signed URL and testing access
 * 5. ONLY AFTER successful upload & verification, updates `students.photo_url` in database
 * 6. Keeps original Base64 untouched if anything fails
 */
export async function testMigrateOneStudent(student: Student): Promise<{
  success: boolean;
  studentId: string;
  studentName: string;
  oldPhotoUrlType: 'base64' | 'storage_path' | 'http_url' | 'empty';
  newStoragePath?: string;
  signedUrl?: string;
  savedBytes?: number;
  message: string;
}> {
  if (!student.photoUrl) {
    return {
      success: false,
      studentId: student.studentId,
      studentName: student.fullName,
      oldPhotoUrlType: 'empty',
      message: 'Student has no photo_url to migrate.',
    };
  }

  if (isStoragePath(student.photoUrl)) {
    return {
      success: false,
      studentId: student.studentId,
      studentName: student.fullName,
      oldPhotoUrlType: 'storage_path',
      message: `Student is already using Supabase Storage path: ${student.photoUrl}. No migration needed.`,
    };
  }

  if (student.photoUrl.startsWith('http://') || student.photoUrl.startsWith('https://')) {
    return {
      success: false,
      studentId: student.studentId,
      studentName: student.fullName,
      oldPhotoUrlType: 'http_url',
      message: 'Student photo is an external URL, not a Base64 string. No migration needed.',
    };
  }

  if (!student.photoUrl.startsWith('data:image/')) {
    return {
      success: false,
      studentId: student.studentId,
      studentName: student.fullName,
      oldPhotoUrlType: 'empty',
      message: 'Student photo_url is not recognized as a Base64 data URL.',
    };
  }

  const oldSizeBytes = student.photoUrl.length;

  // Step 1: Decode Base64 to Blob
  let blob: Blob;
  try {
    const decoded = base64ToBlob(student.photoUrl);
    blob = decoded.blob;
  } catch (err: any) {
    return {
      success: false,
      studentId: student.studentId,
      studentName: student.fullName,
      oldPhotoUrlType: 'base64',
      message: `Failed to decode Base64 image data: ${err.message}`,
    };
  }

  // Step 2: Upload to Supabase Storage
  const uploadRes = await uploadStudentPhotoToStorage(student.studentId, blob);
  if (uploadRes.error) {
    return {
      success: false,
      studentId: student.studentId,
      studentName: student.fullName,
      oldPhotoUrlType: 'base64',
      message: `Storage upload failed: ${uploadRes.error}. Database photo_url was preserved as original Base64.`,
    };
  }

  const storagePath = uploadRes.storagePath;

  // Step 3: Verify successful upload by creating a signed URL
  let signedUrl = '';
  try {
    signedUrl = await getSignedPhotoUrl(storagePath, 3600);
    if (!signedUrl) {
      return {
        success: false,
        studentId: student.studentId,
        studentName: student.fullName,
        oldPhotoUrlType: 'base64',
        message: 'Storage upload completed, but could not verify signed URL access. Database photo_url was NOT modified.',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      studentId: student.studentId,
      studentName: student.fullName,
      oldPhotoUrlType: 'base64',
      message: `Verification check failed: ${err.message}. Database photo_url was NOT modified.`,
    };
  }

  // Step 4: ONLY NOW update students.photo_url in Supabase Database
  try {
    const client = getSupabase();
    const { error: dbError } = await client
      .from('students')
      .update({
        photo_url: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', student.id);

    if (dbError) {
      return {
        success: false,
        studentId: student.studentId,
        studentName: student.fullName,
        oldPhotoUrlType: 'base64',
        message: `Storage upload succeeded (${storagePath}), but database update failed: ${dbError.message}. Original Base64 preserved.`,
      };
    }

    // Update local storage representation
    const LS_STUDENTS = 'sts_students_v1';
    const local = localStorage.getItem(LS_STUDENTS);
    if (local) {
      try {
        const list = JSON.parse(local);
        const idx = list.findIndex((s: any) => s.id === student.id || s.studentId === student.studentId);
        if (idx !== -1) {
          list[idx].photoUrl = storagePath;
          localStorage.setItem(LS_STUDENTS, JSON.stringify(list));
        }
      } catch (e) {
        console.warn('Could not update local storage for migrated student', e);
      }
    }

    const savedBytes = oldSizeBytes - storagePath.length;

    return {
      success: true,
      studentId: student.studentId,
      studentName: student.fullName,
      oldPhotoUrlType: 'base64',
      newStoragePath: storagePath,
      signedUrl,
      savedBytes,
      message: `Migration verified successfully! photo_url updated from ${Math.round(oldSizeBytes / 1024)} KB Base64 to "${storagePath}" (${storagePath.length} bytes). Saved ~${Math.round(savedBytes / 1024)} KB in database record!`,
    };
  } catch (err: any) {
    return {
      success: false,
      studentId: student.studentId,
      studentName: student.fullName,
      oldPhotoUrlType: 'base64',
      message: `Database update error: ${err.message}. Original Base64 preserved.`,
    };
  }
}

/**
 * Batch migration runner for Admin
 * - Runs sequentially with safety pauses
 * - Stops or continues on individual failure without corrupting remaining data
 * - Emits progress events
 */
export async function runBatchMigration(
  students: Student[],
  onProgress?: (current: number, total: number, result: string) => void
): Promise<{
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  savedBytesTotal: number;
  details: Array<{ studentId: string; name: string; status: 'migrated' | 'skipped' | 'failed'; message: string }>;
}> {
  const base64Students = students.filter(
    (s) => s.photoUrl && s.photoUrl.startsWith('data:image/')
  );

  const total = base64Students.length;
  let migrated = 0;
  let skipped = students.length - total;
  let failed = 0;
  let savedBytesTotal = 0;
  const details: Array<{ studentId: string; name: string; status: 'migrated' | 'skipped' | 'failed'; message: string }> = [];

  for (let i = 0; i < total; i++) {
    const student = base64Students[i];
    onProgress?.(i + 1, total, `Migrating ${student.fullName} (${student.studentId})...`);

    const res = await testMigrateOneStudent(student);
    if (res.success) {
      migrated++;
      savedBytesTotal += res.savedBytes || 0;
      details.push({
        studentId: student.studentId,
        name: student.fullName,
        status: 'migrated',
        message: res.message,
      });
    } else {
      failed++;
      details.push({
        studentId: student.studentId,
        name: student.fullName,
        status: 'failed',
        message: res.message,
      });
    }

    // Small 200ms throttle between students to avoid network spike
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  onProgress?.(total, total, `Batch completed: ${migrated} migrated, ${failed} failed.`);

  return {
    total: students.length,
    migrated,
    skipped,
    failed,
    savedBytesTotal,
    details,
  };
}
