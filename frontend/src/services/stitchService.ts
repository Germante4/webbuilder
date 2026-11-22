
import { getToken } from "./authService";
import type { ProjectSummary } from "./requirementService";
import type { DesignSummary } from "./designSummaryService";
import type { ProjectAssetUploadResponse } from "./projectAssetService";

const API_URL = "http://localhost:8080/api";

// ========================================
// GENERATION STATUS
// ========================================

export type StitchGenerationStatus =
  | "PENDING"
  | "GENERATING"
  | "COMPLETED"
  | "FAILED";

// ========================================
// STITCH RESPONSE
// ========================================

// Atsakymas, kai generavimas paleidžiamas fone.
export interface StitchGenerationResponse {
  webBuilderProjectId: number;
  generationStatus: StitchGenerationStatus;
  message: string;
}

// Atsakymas tikrinant generavimo būseną.
export interface StitchGenerationStatusResponse {
  webBuilderProjectId: number;
  generationStatus: StitchGenerationStatus | null;
  generationError: string | null;
  projectId: string | null;
  screenId: string | null;
}

// ========================================
// CONTACT INFORMATION
// ========================================

export interface ProjectContactInformation {
  email: string;
  phone: string;
  address: string;
  instagram: string;
  facebook: string;
  additionalContacts: {
    label: string;
    value: string;
  }[];
}

// ========================================
// WEBSITE CONTENT
// ========================================

export interface WebsiteContent {
  sections: Record<string, Record<string, string>[]>;
  priorities: string[];
  emphasis: string;
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

  websiteContent?: WebsiteContent | null;
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
  contactInformation?: ProjectContactInformation | null;
}

// ========================================
// AUTH HEADERS
// ========================================

function getAuthHeaders(): Record<string, string> {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Prisijunkite, kad galėtumėte naudotis svetaine."
    );
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ========================================
// GENERATE STITCH PROMPT
// ========================================

export async function generateStitchPrompt(
  request: StitchPromptRequest
): Promise<string> {
  const response = await fetch(
    `${API_URL}/stitch-prompt/generate`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        projectSummary: request.projectSummary,
        designSummary: request.designSummary,
        websiteCategory: request.websiteCategory ?? null,
        websiteFormat: request.websiteFormat ?? null,
        websiteLanguage: request.websiteLanguage,
        selectedDirection: request.selectedDirection ?? null,
        uploadedAssets: request.uploadedAssets ?? null,
        websiteContent: request.websiteContent ?? null,
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

  if (!data.prompt?.trim()) {
    throw new Error(
      "Nepavyko gauti sugeneruoto svetainės aprašymo."
    );
  }

  return data.prompt;
}

// ========================================
// START WEBSITE GENERATION
// ========================================

export async function generateStitchDesign(
  request: StitchDesignRequest
): Promise<StitchGenerationResponse> {
  const response = await fetch(
    `${API_URL}/stitch/generate`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        prompt: request.prompt,
        projectName: request.projectName,
        projectDescription: request.projectDescription,
        websiteCategory: request.websiteCategory,
        webBuilderProjectId:
          request.webBuilderProjectId ?? null,
        contactInformation:
          request.contactInformation ?? null,
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
      `Nepavyko pradėti svetainės generavimo (${response.status})`
    );
  }

  const data: StitchGenerationResponse =
    await response.json();

  if (
    !Number.isInteger(data.webBuilderProjectId) ||
    data.webBuilderProjectId <= 0
  ) {
    throw new Error(
      "Serveris negrąžino tinkamo WebBuilder projekto ID."
    );
  }

  return data;
}

// ========================================
// CHECK WEBSITE GENERATION STATUS
// ========================================

export async function getStitchGenerationStatus(
  webBuilderProjectId: number
): Promise<StitchGenerationStatusResponse> {
  if (
    !Number.isInteger(webBuilderProjectId) ||
    webBuilderProjectId <= 0
  ) {
    throw new Error("Neteisingas projekto ID.");
  }

  const response = await fetch(
    `${API_URL}/stitch/generation-status/${webBuilderProjectId}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Stitch generation status error:",
      response.status,
      errorText
    );

    throw new Error(
      `Nepavyko patikrinti svetainės generavimo būsenos (${response.status})`
    );
  }

  const data: StitchGenerationStatusResponse =
    await response.json();

  if (data.webBuilderProjectId !== webBuilderProjectId) {
    throw new Error(
      "Serveris grąžino kito projekto generavimo būseną."
    );
  }

  return data;
}
