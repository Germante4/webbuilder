import { getToken } from "./authService";

const API_URL = "http://localhost:8080/api/website-categories";

export interface WebsiteCategory {
  value: string;
  displayName: string;
  description: string;
}

export async function getWebsiteCategories(): Promise<WebsiteCategory[]> {
  const token = getToken();

  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Nepavyko gauti svetainių kategorijų");
  }

  return response.json();
}