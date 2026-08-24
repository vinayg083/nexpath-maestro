import { ensureAnonymousSupabaseSession } from "./auth";
import { supabase } from "./client";
import type { Database } from "./types";

export type PathCategoryStatus =
  Database["public"]["Tables"]["user_path_categories"]["Row"]["status"];

export type PathCategorySummary = {
  id: string;
  name: string;
  short_description: string | null;
  icon_key: string | null;
  status: PathCategoryStatus;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
};

export type ExploreCategory = {
  id: string;
  name: string;
  short_description: string | null;
  long_description: string | null;
  icon_key: string | null;
};

export type PathTaskItem = {
  id: string;
  title: string;
  subtext: string | null;
  description: string | null;
  completion_label: string | null;
  incomplete_label: string | null;
  sort_order: number | null;
  isCompleted: boolean;
  completedAt: string | null;
};

export type PathTaskResource = {
  id: string;
  title: string;
  type: string | null;
  url: string | null;
  phone: string | null;
  body: string | null;
  image_url: string | null;
  providerName: string | null;
};

type PathCategoryQueryRow = {
  id: string;
  status: PathCategoryStatus;
  added_at: string;
  goal_categories:
    | {
        id: string;
        title: string;
        subtitle: string | null;
        icon_key: string | null;
        path_tasks: { count: number }[] | null;
      }
    | {
        id: string;
        title: string;
        subtitle: string | null;
        icon_key: string | null;
        path_tasks: { count: number }[] | null;
      }[]
    | null;
};

type CompletionQueryRow = {
  path_task_id: string;
  path_tasks: { goal_category_id: string } | { goal_category_id: string }[] | null;
};

type PathTaskQueryRow = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  completed_label: string | null;
  incomplete_label: string | null;
  sort_order: number | null;
  user_path_task_completions: { completed_at: string }[] | null;
};

type PathTaskResourceRow = {
  sort_order: number | null;
  resources:
    | {
        id: string;
        title: string;
        type: string | null;
        website_url: string | null;
        video_url: string | null;
        phone: string | null;
        description: string | null;
        thumbnail: string | null;
        providers: { name: string } | { name: string }[] | null;
      }
    | {
        id: string;
        title: string;
        type: string | null;
        website_url: string | null;
        video_url: string | null;
        phone: string | null;
        description: string | null;
        thumbnail: string | null;
        providers: { name: string } | { name: string }[] | null;
      }[]
    | null;
};

const DEFAULT_STATUS_LABELS: Record<PathCategoryStatus, string> = {
  not_started: "Getting going",
  in_progress: "Making progress",
  done: "Completed",
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function getResourceUrl(resource: {
  type: string | null;
  video_url: string | null;
  website_url: string | null;
}) {
  return resource.type === "video" ? resource.video_url : resource.website_url;
}

export async function getPathProgressLabels(): Promise<Record<PathCategoryStatus, string>> {
  const { data, error } = await supabase.from("path_progress_labels").select("status, label");

  if (error) {
    throw error;
  }

  const labels = { ...DEFAULT_STATUS_LABELS };

  for (const row of data ?? []) {
    if (row.status in labels && row.label) {
      labels[row.status as PathCategoryStatus] = row.label;
    }
  }

  return labels;
}

export async function getUserPathCategories(): Promise<PathCategorySummary[]> {
  const [pathResult, completionsResult] = await Promise.all([
    supabase
      .from("user_path_categories")
      .select(
        `
        id, status, added_at,
        goal_categories!inner ( id, title, subtitle, icon_key, path_tasks(count) )
      `,
      )
      // Oldest→latest. id is a deterministic tiebreaker for rows sharing an
      // added_at (categories added together during onboarding get one now()), so
      // the list can't reshuffle when a completion's status UPDATE rewrites a row.
      .order("added_at")
      .order("id")
      .returns<PathCategoryQueryRow[]>(),
    supabase
      .from("user_path_task_completions")
      .select("path_task_id, path_tasks!inner ( goal_category_id )")
      .returns<CompletionQueryRow[]>(),
  ]);

  if (pathResult.error) {
    throw pathResult.error;
  }

  if (completionsResult.error) {
    throw completionsResult.error;
  }

  const doneByCategory: Record<string, number> = {};

  for (const completion of completionsResult.data ?? []) {
    const pathTask = unwrapOne(completion.path_tasks);
    const categoryId = pathTask?.goal_category_id;

    if (!categoryId) {
      continue;
    }

    doneByCategory[categoryId] = (doneByCategory[categoryId] ?? 0) + 1;
  }

  return (pathResult.data ?? [])
    .map((row) => {
      const category = unwrapOne(row.goal_categories);

      if (!category) {
        return null;
      }

      const total = category.path_tasks?.[0]?.count ?? 0;
      const done = doneByCategory[category.id] ?? 0;

      return {
        id: category.id,
        name: category.title,
        short_description: category.subtitle,
        icon_key: category.icon_key,
        status: row.status,
        totalTasks: total,
        completedTasks: done,
        progressPercent: total === 0 ? 0 : Math.round((done / total) * 100),
      } satisfies PathCategorySummary;
    })
    .filter((row): row is PathCategorySummary => row != null);
}

export async function getExploreCategories(
  excludeCategoryIds: string[] = [],
): Promise<ExploreCategory[]> {
  const { data, error } = await supabase
    .from("goal_categories")
    .select("id, title, subtitle, icon_key")
    .order("title");

  if (error) {
    throw error;
  }

  const excluded = new Set(excludeCategoryIds);

  return (data ?? [])
    .filter((category) => !excluded.has(category.id))
    .map((category) => ({
      id: category.id,
      name: category.title,
      short_description: category.subtitle,
      long_description: null,
      icon_key: category.icon_key,
    }));
}

export async function getExploreCategory(categoryId: string): Promise<ExploreCategory | null> {
  const { data, error } = await supabase
    .from("goal_categories")
    .select("id, title, subtitle, description, icon_key")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        id: data.id,
        name: data.title,
        short_description: data.subtitle,
        long_description: data.description,
        icon_key: data.icon_key,
      }
    : null;
}

export async function addCategoryToPath(goalCategoryId: string) {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    throw new Error("No signed-in user is available.");
  }

  const { error } = await supabase.from("user_path_categories").insert({
    user_id: user.id,
    goal_category_id: goalCategoryId,
  });

  if (error) {
    // Unique (user_id, goal_category_id) — treat duplicate as a no-op.
    if (error.code === "23505") {
      return;
    }

    throw error;
  }
}

export async function removeCategoryFromPath(goalCategoryId: string) {
  const { error } = await supabase
    .from("user_path_categories")
    .delete()
    .eq("goal_category_id", goalCategoryId);

  if (error) {
    throw error;
  }
}

export async function getPathTasksForCategory(goalCategoryId: string): Promise<PathTaskItem[]> {
  const { data, error } = await supabase
    .from("path_tasks")
    .select(
      "id, title, subtitle, description, completed_label, incomplete_label, sort_order, user_path_task_completions ( completed_at )",
    )
    .eq("goal_category_id", goalCategoryId)
    // sort_order can tie (or be null), which leaves Postgres free to return tied
    // rows in a different order on each fetch — so the list appears to reshuffle
    // after a task is completed and the screen refetches. created_at is a stable,
    // deterministic tiebreaker that keeps the order fixed regardless of completion.
    .order("sort_order", { nullsFirst: false })
    .order("created_at")
    .returns<PathTaskQueryRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((task) => {
    const completions = task.user_path_task_completions ?? [];

    return {
      id: task.id,
      title: task.title,
      subtext: task.subtitle,
      description: task.description,
      completion_label: task.completed_label,
      incomplete_label: task.incomplete_label,
      sort_order: task.sort_order,
      isCompleted: completions.length > 0,
      completedAt: completions[0]?.completed_at ?? null,
    };
  });
}

export async function getPathTask(taskId: string): Promise<PathTaskItem | null> {
  const { data, error } = await supabase
    .from("path_tasks")
    .select(
      "id, title, subtitle, description, completed_label, incomplete_label, sort_order, user_path_task_completions ( completed_at )",
    )
    .eq("id", taskId)
    .maybeSingle()
    .returns<PathTaskQueryRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const completions = data.user_path_task_completions ?? [];

  return {
    id: data.id,
    title: data.title,
    subtext: data.subtitle,
    description: data.description,
    completion_label: data.completed_label,
    incomplete_label: data.incomplete_label,
    sort_order: data.sort_order,
    isCompleted: completions.length > 0,
    completedAt: completions[0]?.completed_at ?? null,
  };
}

export async function setPathTaskCompleted(taskId: string, completed: boolean) {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    throw new Error("No signed-in user is available.");
  }

  if (completed) {
    const { error } = await supabase.from("user_path_task_completions").insert({
      user_id: user.id,
      path_task_id: taskId,
    });

    if (error && error.code !== "23505") {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("user_path_task_completions")
    .delete()
    .eq("path_task_id", taskId);

  if (error) {
    throw error;
  }
}

export async function getPathTaskResources(taskId: string): Promise<PathTaskResource[]> {
  const { data, error } = await supabase
    .from("path_task_resources")
    .select(
      "sort_order, resources!inner ( id, title, type, website_url, video_url, phone, description, thumbnail, providers!inner ( name ) )",
    )
    .eq("path_task_id", taskId)
    .order("sort_order")
    .returns<PathTaskResourceRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => {
      const resource = unwrapOne(row.resources);

      if (!resource) {
        return null;
      }

      const provider = unwrapOne(resource.providers);

      return {
        id: resource.id,
        title: resource.title,
        type: resource.type,
        url: getResourceUrl(resource),
        phone: resource.phone,
        body: resource.description,
        image_url: resource.thumbnail,
        providerName: provider?.name ?? null,
      } satisfies PathTaskResource;
    })
    .filter((resource): resource is PathTaskResource => resource != null);
}
