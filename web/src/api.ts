export class ApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

// Lets the React app react when the session dies
let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) {
    onUnauthorized = fn;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body && !(init.body instanceof FormData && !headers.has('Content-Type'))){
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`/api${path}`,{
        ...init,
        headers,
        credentials: 'include' // send/receive cookies
    })
    if (!res.ok) {
        if (res.status === 401) onUnauthorized();
        const body = await res.json().catch(() => null);
        throw new ApiError(res.status, body?.message ?? res.statusText);
    }
    if (res.status === 204 || res.status === 205) return undefined as T;
    return res.json();
}