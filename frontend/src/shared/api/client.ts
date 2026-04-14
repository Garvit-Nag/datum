import axios from "axios";
import { clientEnv } from "@/shared/utils/client-env";
import { supabase, getFreshAccessToken } from "@/shared/lib/supabase";

export const apiClient = axios.create({
  baseURL: clientEnv.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getFreshAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Don't nuke the Supabase session — the 401 might be a transient
      // backend issue (token not propagated yet, JWT config mismatch, etc.).
      // Only sign out if the Supabase session itself is truly gone.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
      } else {
        console.warn(
          "Backend returned 401 but Supabase session is still valid. " +
          "The backend may not be accepting the token correctly.",
          error.config?.url,
        );
      }
    }
    return Promise.reject(error);
  },
);
