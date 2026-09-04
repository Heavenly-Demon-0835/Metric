export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

const TOKEN_KEY = "token";

export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(TOKEN_KEY);
}

// Kept for callers that still hand-roll fetch (e.g. the auth forms, which need
// a non-JSON body). New code should prefer apiFetch/apiGet/apiSend below.
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function onAuthPage(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/auth")
  );
}

// A rejected session is unrecoverable in place: drop the token and send the
// user to login once. Guarded so it never loops on the auth pages themselves.
function handleUnauthorized(): void {
  clearToken();
  if (typeof window !== "undefined" && !onAuthPage()) {
    window.location.replace("/auth/login");
  }
}

export interface ApiOptions extends RequestInit {
  // Auth endpoints return 401/400 for bad credentials — that is not an expired
  // session and must not trigger the global redirect.
  skipAuthRedirect?: boolean;
}

export async function apiFetch(path: string, options: ApiOptions = {}): Promise<Response> {
  const { skipAuthRedirect, headers, ...rest } = options;
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...rest,
    headers: { ...getAuthHeaders(), ...headers },
  });

  if (res.status === 401 && !skipAuthRedirect) {
    handleUnauthorized();
    throw new ApiError(401, "Session expired");
  }
  return res;
}

async function readError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    // FastAPI validation errors come back as a list of {msg, loc, ...}.
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ");
    }
  } catch {
    /* fall through to status text */
  }
  return res.statusText || `Request failed (${res.status})`;
}

// GET a JSON resource. Throws ApiError on any non-2xx.
export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  return res.json() as Promise<T>;
}

// Send a JSON body (POST/PUT/PATCH/DELETE). Returns the parsed JSON, or null
// for an empty body. Throws ApiError on any non-2xx.
export async function apiSend<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await apiFetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await readError(res));
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}
