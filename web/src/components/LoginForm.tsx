// login + register toggle
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function LoginForm({ onSwitch }: { onSwitch: () => void }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            await login(email, password);
        }
        catch (err) {
            setError('Wrong email or password');
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <label>--- Log in ---</label>
            <input type='email' value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type='submit'>Log in</button>
            {error && <p>{error}</p>}
            <p>
                No account yet? {' '}
                <button type="button" onClick={onSwitch}>Register</button>
            </p>
        </form>
    );
}