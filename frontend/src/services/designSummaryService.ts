import { getToken } from "./authService";
import type { ProjectSummary } from "./requirementService";
import type {
  ProjectAssetUploadResponse,
} from "./projectAssetService";

const API_URL =
  "http://localhost:8080/api/design-summary";

export interface DesignSummary {
  visualStyles: string[];
  visualDirection: string;
  colorDirection: string;
  brandColors: string | null;
  typography: string | null;
  referenceWebsite: string | null;
  referencePreferences: string | null;
  hasLogo: boolean;
  hasPhotos: boolean;
  hasBrandFile: boolean;
  hasPreparedTexts: boolean;
  designBrief: string;
}

export interface GenerateDesignSummaryParams {
  projectSummary: ProjectSummary;

  styles: string[];
  colorDirection: string;

  assets: string[];
  hasNoAssets: boolean;

  brandColors: string | null;
  fonts: string | null;

  referenceUrl: string | null;
  referenceLikes: string | null;

  uploadedAssets: ProjectAssetUploadResponse;
}

export async function generateDesignSummary(
  data: GenerateDesignSummaryParams
): Promise<DesignSummary> {
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
      "Design summary error:",
      response.status,
      errorText
    );

    throw new Error(
      `Nepavyko sugeneruoti dizaino santraukos (${response.status})`
    );
  }

  return response.json();
}