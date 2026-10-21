import { useEffect, useState } from 'react';
import { api } from '../api';

export type Job = {
  id: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  imageUrl: string | null;
  textUrl: string | null;
};

export function useJob(id:number) {
    const [job,setJob] = useState<Job | null>(null);
    const [error, setError] = useState('');

    useEffect(()=>{
        let cancelled = false;
        let timer: number | undefined;
        async function poll(){
            try {
                const data = await api<Job>(`/images/${id}`);
                if (cancelled) return;
                setJob(data);
                if (data.status === 'QUEUED' || data.status === 'PROCESSING') {
                    timer = window.setTimeout(poll,2000);
                }
            } catch(err) {
                if (cancelled) setError('count not load job status');
            }
        }
        poll();
        return()=>{
            cancelled = true;
            window.clearTimeout(timer);
        }
    },[id]);
    return {job,error};
}