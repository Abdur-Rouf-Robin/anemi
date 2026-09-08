"use client";

export type Me = {
  id: string;
  email: string;
  displayName: string;
  role: "VIEWER" | "MEMBER" | "MODERATOR" | "ADMIN";
  mfaEnabled?: boolean;
  createdAt?: string;
};

function csrfToken() {
  const match = document.cookie.match(/(?:^|; )anemi_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }
  const method = (init.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD"].includes(method)) {
    const csrf = csrfToken();
    if (csrf) headers.set("x-csrf-token", csrf);
  }
  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: "include"
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(body.message)) message = body.message.join(", ");
      else if (body.message) message = body.message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type Access = {
  signupMode: "open" | "invite" | "closed";
  resetEnabled: boolean;
};

export function getMe() {
  return api<{ user: Me | null }>("/auth/me");
}

export function getAccess() {
  return api<Access>("/auth/access");
}

export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const headers = new Headers();
  const csrf = csrfToken();
  if (csrf) headers.set("x-csrf-token", csrf);
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers,
    body,
    credentials: "include"
  });
  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const payload = (await res.json()) as { message?: string };
      if (payload.message) message = payload.message;
    } catch {
      /* keep */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function uploadFiles<T>(path: string, files: File[]): Promise<T> {
  const headers = new Headers();
  const csrf = csrfToken();
  if (csrf) headers.set("x-csrf-token", csrf);
  const body = new FormData();
  for (const file of files) body.append("files", file);
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers,
    body,
    credentials: "include"
  });
  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const payload = (await res.json()) as { message?: string };
      if (payload.message) message = payload.message;
    } catch {
      /* keep */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}
