import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; details?: string[] } | undefined;
    if (data?.error) return data.error;
    if (data?.details?.length) return data.details.join(" ");
    if (err.code === "ECONNABORTED" || !err.response) {
      return "Can't reach the server right now. Check your connection.";
    }
  }
  return "Something went wrong. Please try again.";
}
