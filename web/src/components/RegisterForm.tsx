import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api, ApiError } from "../api";

export default function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        if (password !== confirm) {
            setError('passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await api('/users/register', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            await login(email, password);
        }
        catch (err) {
            if (err instanceof ApiError && err.status === 409) {
                setError('email already exists')
            } else {
                setError('could not create account');
            }
        } finally {
            setLoading(false);
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <label>--- Register ---</label>
            <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type='password' value={password} onChange={(e) => setPassword(e.target.value)}
                minLength={8} required />
            <input type='password' value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder='Confirm password' required />
            <button type='submit' disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
            {error && <p>{error}</p>}
            <p>
                Already have an account?{' '}
                <button type='button' onClick={onSwitch}>Log in</button>
            </p>
        </form>
    );
}