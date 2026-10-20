// App becomes: loading → spinner; no user → LoginForm; user → UploadForm + a list of JobCards.
import { useAuth } from './auth/AuthContext';
import LoginForm from './components/LoginForm';
import UploadForm from './components/UploadForm';
import './App.css';

export default function App() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p>Loading...</p>
  if (!user) return <LoginForm />

  return (
    <div>
      <h1>ASCII Art Generator</h1>
      <p>Signed in as {user.email}</p>
      <br></br>
      <h2>Upload Your Image</h2>
      <UploadForm/>
      <button onClick={logout}>Log out</button>
    </div>
  )
}

