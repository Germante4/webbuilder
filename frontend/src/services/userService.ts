
import { getToken } from "./authService";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export async function getCurrentUser(): Promise<User> {
  const response = await fetch(
    "http://localhost:8080/api/users/me",
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Nepavyko gauti vartotojo duomenų");
  }

  return response.json();
}
