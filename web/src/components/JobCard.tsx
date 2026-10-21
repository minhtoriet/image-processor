// polls one job, shows PNG + text
import { useJob } from '../hooks/useJob';

export default function JobCard({ id }: { id: number }) {
    const { job, error } = useJob(id);

    if (error) return <div className="job-card"><p>{error}</p></div>;;
    if (!job) return <div className="job-card"><p>Loading...</p></div>;

    return (
        <div className='job-card'>
            <h3>Job #{job.id}</h3>
            {
                (job.status === 'QUEUED' || job.status === 'PROCESSING') &&
                <p>{job.status === 'PROCESSING' ? 'waiting in queue...' : 'processing...'}</p>
            }
            {job.status === 'FAILED' && <p>Processing failed. Try uploading again.</p>}
            {job.status === 'COMPLETED' && (
                <>
                    {job.imageUrl && (<img src={job.imageUrl} alt={`ASCII art for job ${job.id}`} style={{ maxWidth: '100%' }} />)}
                    <p>
                        {job.imageUrl && (<a href={job.imageUrl} target='_blank' rel="noreferrer">Open PNG</a>)}
                        {'.'}
                        {job.textUrl && (<a href={job.textUrl} target='_blank' rel='nonreferrer'>Open Text</a>)}
                    </p>
                </>
            )}
        </div>
    );
}