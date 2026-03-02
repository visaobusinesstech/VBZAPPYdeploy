import axios from "axios";

const getBaseUrl = (input) => {
  let url = (input || "").trim();
  if (!url) {
    if (typeof window !== "undefined" && window.location && window.location.origin) {
      const port = String(window.location.port || "");
      // Ambiente local: preferir 8081 (backend padrão local)
      if (port) return "http://localhost:8081";
      return "http://localhost:8081";
    }
    return "http://localhost:8081";
  }
  if (/^https?:\/\//i.test(url)) {
    return url.replace(/\/+$/, "");
  }
  // Support ws/wss inputs by converting to http(s)
  if (/^wss?:\/\//i.test(url)) {
    url = url.replace(/^ws/i, "http");
    return url.replace(/\/+$/, "");
  }
  // If it looks like host[:port][/path], prepend http://
  if (/^[\w.-]+(?::\d+)?(\/.*)?$/.test(url)) {
    return `http://${url}`.replace(/\/+$/, "");
  }
  // Fallback: try to construct URL relative to current origin
  try {
    const abs = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost:8081");
    return abs.origin.replace(/\/+$/, "");
  } catch {
    return "http://localhost:8081";
  }
};

const baseURL = getBaseUrl(process.env.REACT_APP_BACKEND_URL);

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export const openApi = axios.create({
  baseURL
});

export default api;
