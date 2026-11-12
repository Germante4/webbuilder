import { getToken } from "./authService";

const API_URL = "http://localhost:8080/api/requirements";

export interface QuestionOption {
  id: number;
  optionText: string;
}
export interface RequirementQuestion {
  id: number;
  questionText: string;
  questionType:
    | "TEXT"
    | "TEXTAREA"
    | "SINGLE_SELECT"
    | "MULTI_SELECT"
    | "BOOLEAN";
  required: boolean;
  displayOrder: number;
  placeholder: string | null;
  aiRefinementEnabled: boolean;
  options: QuestionOption[];
}

export async function getRequirementQuestions(
  category: string
): Promise<RequirementQuestion[]> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/questions?category=${encodeURIComponent(category)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Nepavyko gauti klausimų");
  }

  return response.json();
}
export interface RequirementRefinementResponse {
  needsRefinement: boolean;
  question: string | null;
  options: string[];
  summary: string | null;
}
export async function refineAudience(
  answer: string,
  websiteCategory: string,
  projectAnswers: Record<number, string>,
  previousAnswers: string[] = [],
  step: number = 0
): Promise<RequirementRefinementResponse> {
  const token = getToken();

  console.log("JWT tokenas egzistuoja:", Boolean(token));

  const response = await fetch(
    `${API_URL}/refine-audience`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        answer,
        websiteCategory,
        projectAnswers,
        previousAnswers,
        step,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();

    console.error("Auditorijos API klaida:", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });

    throw new Error(
      `Nepavyko patikslinti auditorijos (${response.status})`
    );
  }

  return response.json();
}
export interface ProjectSummary {
  websiteType: string | null;
  projectName: string | null;
  description: string | null;
  targetAudience: string | null;
  differentiation: string | null;
  customerNeed: string | null;
  customerResult: string | null;
}

export async function updateProjectSummary(
  websiteCategory: string,
  projectAnswers: Record<string, string>,
  currentSummary: ProjectSummary | null = null
): Promise<ProjectSummary> {
  const token = getToken();

  const response = await fetch(
    "http://localhost:8080/api/project-summary/update",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        websiteCategory,
        projectAnswers,
        currentSummary,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Nepavyko atnaujinti projekto santraukos");
  }

  return response.json();
}