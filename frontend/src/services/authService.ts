
const API_URL = "http://localhost:8080/api/auth";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export async function register(
  data: RegisterRequest
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 409) {
  throw new Error(
    "Šis el. paštas jau naudojamas. Prisijunkite."
  );
}

    if (response.status === 400) {
      throw new Error("Patikrinkite įvestus duomenis.");
    }

    throw new Error("Registracija nepavyko. Bandykite dar kartą.");
  }

  return response.json();
}

export async function login(
  data: LoginRequest
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Neteisingas el. paštas arba slaptažodis.");
  }

  const result: LoginResponse = await response.json();

  localStorage.setItem("token", result.token);

  return result;
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function logout(): void {
  localStorage.removeItem("token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
