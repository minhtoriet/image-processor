import { useState } from 'react';
import { api } from '../api'

export default function UploadForm({ onUploaded }: { onUploaded: (id: number) => void }) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ResponseType | null>(null);

    type ResponseType = {
        id: number,
        filename: string,
        url: string,
        createdAt: string,
    }
    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        const form = e.currentTarget;
        const formData = new FormData(form);
        const file = formData.get('file');
        if (!(file instanceof File) || file.size === 0) {
            setError('Please choose a damn file');
            return;
        }
        setLoading(true);
        try {
            const data = await api<ResponseType>('/images/upload', {
                method: 'POST',
                body: formData,
            });
            setResult(data);
            onUploaded(data.id);
            form.reset;
        } catch (err) {

        } finally {
            setLoading(false);
        }
    }
    return (
        <form onSubmit={handleSubmit}>
            <input type="file" name='file' accept='image/*' />
            <button type='submit' disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
            {error && <p>{error}</p>}
            {result && <p>Uploaded {result.filename}</p>}
        </form>
    );
}