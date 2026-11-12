
import { getToken } from "./authService";
import type { ProjectSummary } from "./requirementService";
import type { DesignSummary } from "./designSummaryService";
import type { ProjectAssetUploadResponse } from "./projectAssetService";

const API_URL = "http://localhost:8080/api";

// ========================================
// STITCH RESPONSE
// ========================================

export interface StitchGenerationResponse {
  projectId: string;
  screenId: string;
  html: unknown;
  image: unknown;
  webBuilderProjectId?: number;
}

// ========================================
// PROMPT REQUEST
// ========================================

export interface StitchPromptRequest {
  projectSummary: ProjectSummary;
  designSummary: DesignSummary;

  websiteCategory?: string;
  websiteFormat?: string;
  websiteLanguage: "lt" | "en";

  selectedDirection?: string | null;
  uploadedAssets?: ProjectAssetUploadResponse | null;
}

// ========================================
// DESIGN GENERATION REQUEST
// ========================================

export interface StitchDesignRequest {
  prompt: string;
  projectName: string;
  projectDescription: string | null;
  websiteCategory: string;
  webBuilderProjectId?: number | null;
}

// ========================================
// GENERATE STITCH PROMPT
// ========================================

export async function generateStitchPrompt(
  request: StitchPromptRequest
): Promise<string> {
  const token = getToken();

  const response = await fetch(
    `${API_URL}/stitch-prompt/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        projectSummary: request.projectSummary,
        designSummary: request.designSummary,
        websiteCategory: request.websiteCategory ?? null,
        websiteFormat: request.websiteFormat ?? null,
        websiteLanguage: request.websiteLanguage,
        selectedDirection: request.selectedDirection ?? null,
        uploadedAssets: request.uploadedAssets ?? null,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Stitch prompt generation error:",
      response.status,
      errorText
    );

    throw new Error(
      `Nepavyko sugeneruoti Stitch prompto (${response.status})`
    );
  }

  const data: { prompt: string } = await response.json();

  return data.prompt;
}

// ========================================
// GENERATE AND SAVE WEBSITE
// ========================================

export async function generateStitchDesign(
  request: StitchDesignRequest
): Promise<StitchGenerationResponse> {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Prisijunkite, kad galėtumėte generuoti svetainę."
    );
  }

  const response = await fetch(
    `${API_URL}/stitch/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: request.prompt,
        projectName: request.projectName,
        projectDescription: request.projectDescription,
        websiteCategory: request.websiteCategory,
        webBuilderProjectId:
          request.webBuilderProjectId ?? null,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Stitch generation error:",
      response.status,
      errorText
    );

    throw new Error(
      `Nepavyko sugeneruoti ir išsaugoti svetainės (${response.status})`
    );
  }

  return response.json();
}
