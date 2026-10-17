//  user state + login/logout
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setUnauthorizedHandler } from '../api'

type User = { id: string, email: string };
type AuthState = {
    user: User | null,
    loading: boolean,
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setUnauthorizedHandler(() => setUser(null));
        api<User>('/users/me')
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    async function login(email: string, password: string) {
        await api('/users/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        setUser(await api<User>('/users/me'));
    }
    async function logout() {
        await api('/users/logout', { method: 'POST' });
        setUser(null);
    }
    return <AuthContext value={{ user, loading, login, logout }}>{children}</AuthContext>
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

