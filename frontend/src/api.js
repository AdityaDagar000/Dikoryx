// src/api.js
const BACKEND =
  (import.meta.env.VITE_BACKEND_URL ||
   "https://insider-threat-detection-szmm.onrender.com"
  ).replace(/\/$/, "");

const NO_CACHE = { cache: "no-store", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } };

class ApiError extends Error {
  constructor(message, { status, path } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
  }
}

function urlWithStamp(path) {
  return `${BACKEND}${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}`;
}

async function postJson(path, payload) {
  // In development, a missing route on the deployed service can be retried
  // through Vite's /api proxy against the current local backend.
  const bases = import.meta.env.DEV && BACKEND ? [BACKEND, ""] : [BACKEND];
  let deployedRouteMissing = false;

  for (let index = 0; index < bases.length; index += 1) {
    let r;

    try {
      r = await fetch(`${bases[index]}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (deployedRouteMissing) {
        throw new ApiError(`Backend endpoint unavailable: ${path}`, { path });
      }
      throw error;
    }

    const data = await r.json().catch(() => ({}));
    const canRetryLocally = r.status === 404 && index < bases.length - 1;

    if (canRetryLocally) {
      deployedRouteMissing = true;
      continue;
    }

    if (r.status === 404) {
      throw new ApiError(`Backend endpoint unavailable: ${path}`, {
        status: r.status,
        path,
      });
    }

    if (!r.ok || data?.error) {
      throw new ApiError(data?.detail || data?.error || data?.message || "Request failed", {
        status: r.status,
        path,
      });
    }

    return data;
  }

  throw new ApiError(`Backend endpoint unavailable: ${path}`, { path });
}

async function getJson(path) {
  const r = await fetch(urlWithStamp(path), NO_CACHE);
  const data = await r.json().catch(() => ({}));

  if (r.status === 404) {
    throw new Error(`Backend endpoint unavailable: ${path}`);
  }

  if (!r.ok || data?.error) {
    throw new Error(data?.detail || data?.error || data?.message || "Request failed");
  }

  return data;
}

export const API = {
  backendUrl: BACKEND,
  login: async (credentials) => postJson("/api/v1/login", credentials),
  signup: async (payload) => postJson("/api/v1/signup", payload),
  createOrganization: async (payload) => postJson("/api/v1/organizations", payload),
  listOrganizations: async () => getJson("/api/v1/organizations"),
  getOrganization: async (id) => getJson(`/api/v1/organizations/${encodeURIComponent(id)}`),
  listSystems: async () => {
    const r = await fetch(urlWithStamp("/api/v1/systems"), NO_CACHE);
    if (!r.ok) throw new Error("listSystems failed");
    return await r.json();
  },
  getSystem: async (id) => {
    const r = await fetch(urlWithStamp(`/api/v1/system/${encodeURIComponent(id)}`), NO_CACHE);
    if (!r.ok) throw new Error("getSystem failed");
    return await r.json();
  },
  getAllRisk: async () => {
    const r = await fetch(urlWithStamp("/api/v1/risk"), NO_CACHE);
    if (!r.ok) throw new Error("getAllRisk failed");
    return await r.json();
  },
  getRisk: async (agentId) => {
    const r = await fetch(urlWithStamp(`/api/v1/risk/${encodeURIComponent(agentId)}`), NO_CACHE);
    if (!r.ok) throw new Error("getRisk failed");
    return await r.json();
  },
  getDlpAlerts: async (agentId) => {
    const r = await fetch(urlWithStamp(`/api/v1/dlp/${encodeURIComponent(agentId)}`), NO_CACHE);
    if (!r.ok) throw new Error("getDlpAlerts failed");
    return await r.json();
  },
};

export function createWS(onMessage) {
  const url = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.hostname + ":8000/ws";
  const ws = new WebSocket(url);
  ws.onopen = () => console.info("ws open");
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch (err) {}
  };
  ws.onclose = () => console.info("ws closed");
  ws.onerror = (e) => console.error("ws error", e);
  return ws;
}
