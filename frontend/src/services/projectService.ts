
import { getToken } from "./authService";
import type { StitchGenerationStatus } from "./stitchService";

const API_URL = "http://localhost:8080/api/projects";

// ========================================
// PROJECT STATUS
// ========================================

export type ProjectStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED";

// ========================================
// PROJECT GENERATION STATUS
// ========================================

// PENDING    - laukia generavimo
// GENERATING - generuojama
// COMPLETED  - sugeneruota
// FAILED     - generavimas nepavyko

export type ProjectGenerationStatus =
  StitchGenerationStatus;

// ========================================
// PROJECT
// ========================================

export interface Project {
  id: number;
  name: string;
  description: string | null;

  status: ProjectStatus;

  websiteCategory: string | null;

  createdAt: string;
  updatedAt: string;

  stitchProjectId?: string | null;
  stitchScreenId?: string | null;

  // Nauji asinchroninio generavimo laukai
  generationStatus?: ProjectGenerationStatus | null;
  generationError?: string | null;

  // Išsaugotas sugeneruotos svetainės HTML
  generatedHtml?: string | null;
}

// ========================================
// GET USER PROJECTS
// ========================================

export async function getProjects(): Promise<Project[]> {
  const token = getToken();

  if (!token) {
    throw new Error("Neprisijungęs vartotojas");
  }

  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Nepavyko gauti projektų (${response.status})`
    );
  }

  const projects: Project[] = await response.json();

  return projects;
}
