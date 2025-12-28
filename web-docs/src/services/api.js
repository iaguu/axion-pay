const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3060";

const USER_TOKEN_KEY = "axionpay_user_token";
const ADMIN_TOKEN_KEY = "axionpay_admin_token";

export function getUserToken() {
  return localStorage.getItem(USER_TOKEN_KEY);
}

export function setUserToken(token) {
  localStorage.setItem(USER_TOKEN_KEY, token);
}

export function clearUserToken() {
  localStorage.removeItem(USER_TOKEN_KEY);
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function apiRequest(
  path,
  { method = "GET", body, token, adminToken } = {}
) {
  const headers = {};
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (adminToken) {
    headers["x-admin-token"] = adminToken;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Erro ${response.status}: ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export { API_BASE_URL };
