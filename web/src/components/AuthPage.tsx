// components/AuthPage.tsx
import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

export default function AuthPage(){
    const [mode,setMode] = useState<'log in' | 'register'>('log in');
    return mode === 'log in' 
        ? <LoginForm onSwitch={()=>setMode('register')}/>
        : <RegisterForm onSwitch={()=>setMode('log in')}/>
}