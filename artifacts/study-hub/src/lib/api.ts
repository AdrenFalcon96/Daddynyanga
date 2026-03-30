import axios from "axios";

const baseURL =
  typeof __VITE_API_URL__ !== "undefined" && __VITE_API_URL__
    ? `${__VITE_API_URL__}/api`
    : "/api";

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? window.__studyHubToken ?? null
      : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

declare global {
  const __VITE_API_URL__: string;
  interface Window {
    __studyHubToken?: string;
  }
}
