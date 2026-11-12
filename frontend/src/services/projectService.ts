
import { getToken } from "./authService";

const API_URL = "http://localhost:8080/api/projects";

export type ProjectStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED";


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
  });

  if (!response.ok) {
    throw new Error("Nepavyko gauti projektų");
  }

  return response.json();
}
