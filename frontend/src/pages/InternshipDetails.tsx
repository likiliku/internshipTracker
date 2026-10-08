import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, IndianRupee, ArrowLeft, Clock, ExternalLink, CheckCircle } from 'lucide-react';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/' }); 
api.interceptors.request.use(c => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c
});

export default function InternshipDetails() {
  const { id } = useParams<{id: string}>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/api/internships/${id}`),
      api.get('/api/applications')
    ]).then(([resInternship, resApps]) => {
      setData(resInternship.data);
      const app = resApps.data.find((a: any) => a.internship_id === parseInt(id || '0'));
      if (app) setApplicationStatus(app.status);
    })
    .catch(err => alert('Failed to load internship details'))
    .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{padding: '50px'}}>Loading details...</div>;
  if (!data) return <div style={{padding: '50px'}}>Internship not found.</div>;

  return (
    <div style={{padding: '20px 0', maxWidth: '800px', margin: '0 auto'}}>
      <Link to="/internships" style={{display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-light)', marginBottom: '20px', textDecoration: 'none'}}>
        <ArrowLeft size={16} /> Back to search
      </Link>
      
      <div style={{background: 'var(--surface)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border)'}}>
        <div style={{display: 'flex', alignItems: 'flex-start', gap: '20px'}}>
          <div className="company-icon" style={{width: '60px', height: '60px', fontSize: '24px'}}>{data.company_name?.[0] || 'C'}</div>
          <div>
            <h1 style={{margin: '0 0 5px 0', fontSize: '24px'}}>{data.job_title}</h1>
            <p style={{margin: 0, fontSize: '18px', color: 'var(--text-light)'}}>{data.company_name}</p>
          </div>
        </div>

        <div className="meta" style={{marginTop: '25px', gap: '20px', display: 'flex', flexWrap: 'wrap'}}>
          <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><MapPin size={18}/>{data.location || 'Flexible'}</span>
          <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}><Clock size={18}/>{data.work_mode || 'Remote'}</span>
          <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
            <IndianRupee size={18}/>
            {data.stipend_min ? `${data.stipend_min / 1000}k–${data.stipend_max / 1000}k` : 'Not disclosed'}
          </span>
          <span style={{display: 'flex', alignItems: 'center', gap: '5px'}}>Source: {data.source || 'Local DB'}</span>
        </div>

        <div style={{marginTop: '30px'}}>
          <h3>Required Skills</h3>
          <div className="tags" style={{marginTop: '10px'}}>
            {(data.required_skills || []).length > 0 ? (
              data.required_skills.map((s: string) => <span key={s}>{s}</span>)
            ) : <span style={{background: 'transparent', padding: 0, color: 'var(--text-light)'}}>No specific skills mentioned</span>}
          </div>
        </div>

        <div style={{marginTop: '30px'}}>
          <h3>About the Opportunity</h3>
          <div style={{whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text)'}}>
            {data.description || 'No description provided.'}
          </div>
        </div>

        <div style={{marginTop: '40px', display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
          {data.application_url && (
            <a href={data.application_url} target="_blank" rel="noreferrer" className="btn primary" style={{display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none'}}>
              Apply on External Website <ExternalLink size={16}/>
            </a>
          )}
          {applicationStatus ? (
             <div style={{padding: '12px 20px', background: 'var(--bg)', borderRadius: '6px', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <CheckCircle size={18} /> {applicationStatus === 'Applied' ? 'Successfully Applied' : 'Saved to Dashboard'}
             </div>
          ) : (
            <>
              <button className="btn secondary" onClick={() => {
                api.post('/api/applications', { internship_id: data.id, status: 'Applied' })
                  .then(() => {
                    setApplicationStatus('Applied');
                    alert('Application tracked locally!');
                  })
                  .catch(e => alert(e.response?.data?.detail || 'Error applying'));
              }}>Mark as Applied (Internal Tracker)</button>
              
              <button className="btn secondary" onClick={() => {
                api.post('/api/applications', { internship_id: data.id, status: 'Saved' })
                  .then(() => {
                    setApplicationStatus('Saved');
                    alert('Saved to your dashboard!');
                  })
                  .catch(e => alert(e.response?.data?.detail || 'Error saving'));
              }}>Save for Later</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
