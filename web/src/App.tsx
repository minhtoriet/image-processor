// App becomes: loading → spinner; no user → LoginForm; user → UploadForm + a list of JobCards.
import { useAuth } from './auth/AuthContext';
import LoginForm from './components/LoginForm';
import './App.css';

export default function App() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p>Loading...</p>
  if (!user) return <LoginForm />

  return (
    <div>
      <h3>ASCII Art Generator</h3>
      <p>Signed in as {user.email}</p>
      <button onClick={logout}>Log out</button>
    </div>
  )
}

