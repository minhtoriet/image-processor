// App becomes: loading → spinner; no user → LoginForm; user → UploadForm + a list of JobCards.
import { useAuth } from './auth/AuthContext';
import LoginForm from './components/LoginForm';
import UploadForm from './components/UploadForm';
import './App.css';
import { useState } from 'react';
import JobCard from './components/JobCard';

export default function App() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p>Loading...</p>
  if (!user) return <LoginForm />
  const [jobIds, setJobIds] = useState<number[]>([]);

  return (
    <div>
      <h1>ASCII Art Generator</h1>
      <p>Signed in as {user.email}</p>
      <br></br>
      <h2>Upload Your Image</h2>
      <UploadForm onUploaded={(id) => setJobIds((prev) => [id, ...prev])} />
        {jobIds.map((id)=><JobCard key={id} id={id}></JobCard>)}
      <button onClick={logout}>Log out</button>
    </div>
  )
}

