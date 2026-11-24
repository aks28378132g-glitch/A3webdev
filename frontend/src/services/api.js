
const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running and try again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.msg || "Something went wrong. Please try again.");
    error.status = response.status;
    throw error;
  }

  return data;
}
