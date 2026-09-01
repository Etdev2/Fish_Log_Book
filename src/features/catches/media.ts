"use client";

import { uuidv7 } from "@/core/sync/uuid";
import { deleteMedia, mediaFor, putMedia } from "@/lib/offline/db";

/**
 * Photos on a catch (spec §25).
 *
 * Stored as blobs on the device, in their own IndexedDB store so a list query never
 * drags megabytes along with it. Upload is a later concern: spec §25 is explicit that a
 * photo failing must not prevent the catch, so nothing here is on the save path and
 * every failure is swallowed after the catch is already durable.
 *
 * EXIF is deliberately not read for time or position. Spec §25 forbids relying on it,
 * and for good reason — a photo taken on a second phone, imported from a friend, or
 * shot after the fish was on ice carries a time and place that are not the catch's.
 * `caught_at` comes from the tap, and coordinates from the device's own fix.
 */

export interface CatchPhoto {
  readonly id: string;
  readonly blob: Blob;
}

/** Attach photos to an already-saved catch. Never throws. */
export async function attachPhotos(catchId: string, files: readonly File[]): Promise<number> {
  let saved = 0;
  const now = new Date().toISOString();
  for (const file of files) {
    try {
      await putMedia(uuidv7(), catchId, file, now);
      saved += 1;
    } catch {
      // The catch stands without its photo. Nothing here is worth losing a fish over.
    }
  }
  return saved;
}

export async function photosFor(catchId: string): Promise<readonly CatchPhoto[]> {
  try {
    return await mediaFor(catchId);
  } catch {
    return [];
  }
}

export async function removePhoto(id: string): Promise<void> {
  try {
    await deleteMedia(id);
  } catch {
    // Nothing to do; the photo stays until the next attempt.
  }
}
