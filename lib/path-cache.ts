import type { ExploreCategory, PathTaskItem } from "@/lib/supabase";

/**
 * In-memory hand-off between the task list and task detail screens.
 *
 * `getPathTasksForCategory()` selects exactly the columns `getPathTask()` does, so a
 * task opened from the list is already fully loaded — refetching it only bought a
 * spinner. The list fills this cache; detail reads it synchronously on first render
 * and revalidates in the background so completion state still stays fresh.
 */
const tasksById = new Map<string, PathTaskItem>();
const categoriesById = new Map<string, ExploreCategory>();

export function cacheCategoryTasks(category: ExploreCategory | null, tasks: PathTaskItem[]) {
  if (category) {
    categoriesById.set(category.id, category);
  }

  for (const task of tasks) {
    tasksById.set(task.id, task);
  }
}

export function cacheTask(task: PathTaskItem) {
  tasksById.set(task.id, task);
}

export function getCachedTask(taskId: string): PathTaskItem | null {
  return tasksById.get(taskId) ?? null;
}

export function getCachedCategory(categoryId: string): ExploreCategory | null {
  return categoriesById.get(categoryId) ?? null;
}
