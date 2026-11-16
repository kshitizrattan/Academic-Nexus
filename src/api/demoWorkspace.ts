import { DemoWorkspaceState } from '../types/academic';

const workspaceStorageKey = 'academic-nexus-demo-workspace-v1';

export async function checkDemoSession(): Promise<boolean> {
  const result = await request<{ authenticated: boolean }>('/api/auth/session');
  return result.authenticated;
}

export async function signInDemo(password: string, workspaceId: string) {
  return request<{ authenticated: boolean; workspaceId: string }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, workspaceId }),
  });
}

export async function signOutDemo() {
  return request<{ authenticated: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function getDemoWorkspaceId() {
  const existingId = window.localStorage.getItem(workspaceStorageKey);
  if (existingId) return existingId;

  const workspaceId = window.crypto.randomUUID();
  window.localStorage.setItem(workspaceStorageKey, workspaceId);
  return workspaceId;
}

export async function loadDemoWorkspace(workspaceId: string): Promise<DemoWorkspaceState> {
  return request<DemoWorkspaceState>(`/api/demo/${encodeURIComponent(workspaceId)}`);
}

export async function saveDemoWorkspace(workspaceId: string, state: DemoWorkspaceState) {
  return request<{ saved: boolean }>(`/api/demo/${encodeURIComponent(workspaceId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new Error('Cannot reach the Academic Nexus API. Check that the app and PostgreSQL services are running.');
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `The API request failed with status ${response.status}.`;
    throw new Error(message);
  }
  return body as T;
}
