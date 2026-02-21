const rawApiBase = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE_URL = rawApiBase.replace(/\/$/, "");
const API_KEY = import.meta.env.VITE_API_KEY || "";

export function buildApiHeaders(overrides = {}) {
  const headers = { ...overrides };
  if (API_KEY) {
    headers["x-api-key"] = API_KEY;
  }
  return headers;
}

export { API_BASE_URL };
