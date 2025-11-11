import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

// ✅ Don’t attach token for login or OTP routes
api.interceptors.request.use((config) => {
  const noAuthNeeded = [
    "/auth/login",
    "/auth/verify-otp",
    "/auth/reset-password",
    "/auth/reset-password-confirm",
  ];

  if (!noAuthNeeded.some((path) => config.url.includes(path))) {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ✅ Handle 401 without full reload during login/OTP
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const originalUrl = err.config?.url || "";

    // Ignore these during login flow
    const safeRoutes = ["/auth/login", "/auth/verify-otp"];
    const isSafe = safeRoutes.some((path) => originalUrl.includes(path));

    if (err.response?.status === 401 && !isSafe) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Instead of reloading, redirect gracefully:
      window.history.pushState({}, "", "/login");
    }

    return Promise.reject(err);
  }
);

export default api;
