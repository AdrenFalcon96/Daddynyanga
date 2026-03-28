import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAuthGuard() {
  const [, navigate] = useLocation();
  const token = localStorage.getItem("token");

  let payload: Record<string, any> | null = null;
  if (token) {
    try {
      const parts = token.split(".");
      payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload && payload.exp && payload.exp < Date.now() / 1000) {
        localStorage.removeItem("token");
        payload = null;
      }
    } catch {
      localStorage.removeItem("token");
      payload = null;
    }
  }

  useEffect(() => {
    if (!payload) {
      navigate("/login");
    }
  }, []);

  return payload;
}
