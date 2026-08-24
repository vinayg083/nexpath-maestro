import { ensureAnonymousSupabaseSession } from "./auth";
import { supabase } from "./client";

export type ResourceType = "website" | "hotline" | "video" | "youtube" | "text" | string;

export type ResourceCarouselItem = {
  id: string;
  title: string;
  label: string;
  type: ResourceType | null;
  url: string | null;
  phone: string | null;
  body: string | null;
  image_url: string | null;
  provider: string;
};

export type ResourceFeedItem = ResourceCarouselItem;

export type ResourceFeed = {
  count: number;
  items: ResourceFeedItem[];
};

export type ResourceCarousel = {
  id: string;
  name: string;
  items: ResourceCarouselItem[];
};

export type DirectoryItem = {
  id: string;
  name: string;
  description: string | null;
  external_url: string;
  state_code: string;
  area_id: string | null;
};

export type ProfileLocation = {
  state_code: string | null;
  area_id: string | null;
};

type EmbeddedProvider = { name: string } | { name: string }[] | null;

type EmbeddedResource = {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  website_url: string | null;
  video_url: string | null;
  phone: string | null;
  thumbnail: string | null;
  providers: EmbeddedProvider;
};

type EmbeddedCategory = {
  id: string;
  title: string;
};

type CategoryResourceLinkRow = {
  category_id: string;
  sort_order: number | null;
  categories: EmbeddedCategory | EmbeddedCategory[] | null;
  resources: EmbeddedResource | EmbeddedResource[] | null;
};

type ResourceFeedRow = {
  id: string;
  title: string;
  description: string | null;
  type: string | null;
  website_url: string | null;
  video_url: string | null;
  phone: string | null;
  thumbnail: string | null;
  providers: EmbeddedProvider;
};

function getResourceUrl(resource: {
  type: string | null;
  video_url: string | null;
  website_url: string | null;
}) {
  return resource.type === "video" ? resource.video_url : resource.website_url;
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getProfileLocation(): Promise<ProfileLocation | null> {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("state_code, area_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/** Categories with all linked active resources, ordered by category / resource sort order. */
export async function getResourceCarousels(): Promise<ResourceCarousel[]> {
  const { data, error } = await supabase
    .from("category_resources")
    .select(
      `
      category_id,
      sort_order,
      categories!inner (
        id,
        title
      ),
      resources!inner (
        id, title, description, type, website_url, video_url, phone, thumbnail,
        providers ( name )
      )
    `,
    )
    .eq("resources.is_active", true)
    .order("title", { referencedTable: "categories" })
    .order("sort_order")
    .order("title", { referencedTable: "resources" })
    .returns<CategoryResourceLinkRow[]>();

  if (error) {
    throw error;
  }

  const carouselsByCategory = new Map<string, ResourceCarousel>();
  const seenResourcesByCategory = new Map<string, Set<string>>();

  for (const row of data ?? []) {
    const category = unwrapOne(row.categories);
    const resource = unwrapOne(row.resources);

    if (!category || !resource) {
      continue;
    }

    let carousel = carouselsByCategory.get(category.id);

    if (!carousel) {
      carousel = {
        id: category.id,
        name: category.title,
        items: [],
      };
      carouselsByCategory.set(category.id, carousel);
      seenResourcesByCategory.set(category.id, new Set());
    }

    const seenResources = seenResourcesByCategory.get(category.id);

    if (seenResources?.has(resource.id)) {
      continue;
    }

    seenResources?.add(resource.id);
    const provider = unwrapOne(resource.providers);

    carousel.items.push({
      id: resource.id,
      title: resource.title,
      label: resource.title,
      type: resource.type,
      url: getResourceUrl(resource),
      phone: resource.phone,
      body: resource.description,
      image_url: resource.thumbnail,
      provider: provider?.name ?? "",
    });
  }

  return Array.from(carouselsByCategory.values()).filter((carousel) => carousel.items.length > 0);
}

/** One resource by id, in the same shape the carousels and feed render. */
export async function getResourceById(resourceId: string): Promise<ResourceCarouselItem | null> {
  const { data, error } = await supabase
    .from("resources")
    .select(
      `
      id, title, description, type, website_url, video_url, phone, thumbnail,
      providers ( name )
    `,
    )
    .eq("id", resourceId)
    .maybeSingle<ResourceFeedRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const provider = unwrapOne(data.providers);

  return {
    id: data.id,
    title: data.title,
    label: data.title,
    type: data.type,
    url: getResourceUrl(data),
    phone: data.phone,
    body: data.description,
    image_url: data.thumbnail,
    provider: provider?.name ?? "",
  };
}

/** Active resources displayed as the full-screen vertical Resources feed. */
export async function getResourceFeed(): Promise<ResourceFeed> {
  const { count, data, error } = await supabase
    .from("resources")
    .select(
      `
      id, title, description, type, website_url, video_url, phone, thumbnail,
      providers ( name )
    `,
      { count: "exact" },
    )
    .eq("is_active", true)
    .order("title")
    .returns<ResourceFeedRow[]>();

  if (error) {
    throw error;
  }

  return {
    count: count ?? data?.length ?? 0,
    items: (data ?? []).map((resource) => {
      const provider = unwrapOne(resource.providers);

      return {
        id: resource.id,
        title: resource.title,
        label: resource.title,
        type: resource.type,
        url: getResourceUrl(resource),
        phone: resource.phone,
        body: resource.description,
        image_url: resource.thumbnail,
        provider: provider?.name ?? "",
      } satisfies ResourceFeedItem;
    }),
  };
}

/**
 * Directories for the signed-in profile's state (and area when set).
 * Statewide rows (area_id null) always match; area-specific rows need a matching area_id.
 * Returns [] when the profile has no state_code yet.
 */
export async function getDirectoriesForProfile(): Promise<DirectoryItem[]> {
  const profile = await getProfileLocation();

  if (!profile?.state_code) {
    return [];
  }

  let query = supabase
    .from("directories")
    .select("id, name, description, external_url, state_code, area_id")
    .eq("state_code", profile.state_code)
    .order("name");

  if (profile.area_id) {
    query = query.or(`area_id.is.null,area_id.eq.${profile.area_id}`);
  } else {
    query = query.is("area_id", null);
  }

  const { data, error } = await query.returns<DirectoryItem[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}
