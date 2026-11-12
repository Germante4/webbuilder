import { getToken } from "./authService";
import type { ProjectSummary } from "./requirementService";
import type { DesignSummary } from "./designSummaryService";

const API_URL =
  "http://localhost:8080/api/design-directions";

export interface DesignDirection {
  id: string;
  name: string;
  tagline: string;
  description: string;
  layoutDirection: string;
  typographyDirection: string;
  imageDirection: string;
  colorDirection: string;
  mood: string;
}

export interface DesignDirectionsResponse {
  directions: DesignDirection[];
}

interface GenerateDesignDirectionsParams {
  projectSummary: ProjectSummary;
  designSummary: DesignSummary;
}

export async function generateDesignDirections(
  data: GenerateDesignDirectionsParams
): Promise<DesignDirectionsResponse> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Design directions error:",
      response.status,
      errorText
    );

    throw new Error(
      `Nepavyko sugeneruoti dizaino krypčių (${response.status})`
    );
  }

  return response.json();
}