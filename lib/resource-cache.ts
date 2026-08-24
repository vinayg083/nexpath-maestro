import type { ResourceCarouselItem } from "@/lib/supabase";

/**
 * In-memory hand-off between the Resources tab and the resource detail screen.
 *
 * `getResourceCarousels()` already returns every field `getResourceById()` does, so a
 * resource opened from a carousel is fully loaded before the tap — refetching it only
 * bought a spinner. The tab fills this cache; detail reads it synchronously on first
 * render and revalidates in the background.
 */
const resourcesById = new Map<string, ResourceCarouselItem>();

export function cacheResources(resources: ResourceCarouselItem[]) {
  for (const resource of resources) {
    resourcesById.set(resource.id, resource);
  }
}

export function getCachedResource(resourceId: string): ResourceCarouselItem | null {
  return resourcesById.get(resourceId) ?? null;
}
