const API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : import.meta.env.VITE_API_URL || "http://localhost:5000";

const request = async (path, { method = "GET", token, body } = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("cardwise_user");
    localStorage.removeItem("cardwise_token");
    if (typeof window !== "undefined") {
      window.location.reload();
    }
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export const api = {
  signup: (payload) =>
    request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  getCardCatalog: () => request("/cards/catalog"),
  getCards: (token) => request("/cards", { token }),
  addCard: (token, payload) =>
    request("/cards", { method: "POST", token, body: payload }),
  deleteCard: (token, cardId) =>
    request(`/cards/${cardId}`, { method: "DELETE", token }),
  recommend: (token, payload) =>
    request("/recommend", { method: "POST", token, body: payload }),
  monthlySavings: (token) => request("/recommend/monthly-savings", { token }),
  analytics: (token) => request("/recommend/analytics", { token }),
};
