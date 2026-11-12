
export interface ProjectDraft {
  websiteFormat?: string;
  websiteCategory?: string;
  fields?: Record<string, unknown>;
}

const STORAGE_KEY = "webbuilder-project-draft";

export function getProjectDraft(): ProjectDraft {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return {};

    return JSON.parse(saved) as ProjectDraft;
  } catch {
    return {};
  }
}

export function saveProjectDraft(
  updates: Partial<ProjectDraft>
): void {
  const current = getProjectDraft();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...current,
      ...updates,
    })
  );
}

export function clearProjectDraft(): void {
  localStorage.removeItem(STORAGE_KEY);
}
