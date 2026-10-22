// App becomes: loading → spinner; no user → LoginForm; user → UploadForm + a list of JobCards.
import { useAuth } from './auth/AuthContext';
import AuthPage from './components/AuthPage';
import UploadForm from './components/UploadForm';
import './App.css';
import { useState } from 'react';
import JobCard from './components/JobCard';

export default function App() {
  const { user, loading, logout } = useAuth();
  if (loading) return <p>Loading...</p>
  if (!user) return <AuthPage />
  const [jobIds, setJobIds] = useState<number[]>([]);

  return (
    <>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
        <title>Ascii generator</title>
      </head>
      <body>
        <main>
          <div className='container'>
            <div className='nav'>
            </div>
            <h1>ASCII Art Generator</h1>
            <p>Signed in as {user.email}</p>
            <br></br>
            <h2>Upload Your Image</h2>
            <UploadForm onUploaded={(id) => setJobIds((prev) => [id, ...prev])} />
            {jobIds.map((id) => <JobCard key={id} id={id}></JobCard>)}
            <button onClick={logout}>Log out</button>
          </div>
        </main>
        <footer>
        </footer>
      </body>

    </>

  )
}

