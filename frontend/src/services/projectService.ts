import { getToken } from "./authService";
import type { StitchGenerationStatus } from "./stitchService";

const API_URL = "http://localhost:8080/api/projects";

export type ProjectStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED";
export type ProjectGenerationStatus = StitchGenerationStatus;

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
  generationStatus?: ProjectGenerationStatus | null;
  generationError?: string | null;
  generatedHtml?: string | null;
  publishedUrl?: string | null;
  lastPublishedAt?: string | null;
}

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
    throw new Error(`Nepavyko gauti projektų (${response.status})`);
  }

  return response.json();
}
