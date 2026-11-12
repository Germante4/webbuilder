import { getToken } from "./authService";

const API_URL =
  "http://localhost:8080/api/project-assets";

export interface ProjectAssetUploadResponse {
  logo: string | null;
  photos: string[];
  brandFile: string | null;
  textFiles: string[];
}

export interface UploadProjectAssetsParams {
  logoFile: File | null;
  photoFiles: File[];
  brandFile: File | null;
  textFiles: File[];
}

export async function uploadProjectAssets({
  logoFile,
  photoFiles,
  brandFile,
  textFiles,
}: UploadProjectAssetsParams): Promise<ProjectAssetUploadResponse> {
  const token = getToken();

  const formData = new FormData();

  // LOGOTIPAS
  if (logoFile) {
    formData.append("logo", logoFile);
  }

  // NUOTRAUKOS
  photoFiles.forEach((file) => {
    formData.append("photos", file);
  });

  // BRANDBOOK / SPALVŲ FAILAS
  if (brandFile) {
    formData.append("brandFile", brandFile);
  }

  // PARUOŠTI TEKSTAI
  textFiles.forEach((file) => {
    formData.append("textFiles", file);
  });

  const response = await fetch(
    `${API_URL}/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "Asset upload error:",
      response.status,
      errorText
    );

    throw new Error(
      `Nepavyko įkelti projekto failų (${response.status})`
    );
  }

  return response.json();
}