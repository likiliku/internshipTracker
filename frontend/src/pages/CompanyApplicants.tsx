import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, User, Download, CheckCircle, XCircle } from 'lucide-react';

export function CompanyApplicants() {
  const { id } = useParams();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [internship, setInternship] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch applicants
    api.get(`/api/internships/${id}/applicants`)
      .then(res => setApplicants(res.data))
      .catch(err => alert("Error loading applicants"));

    // Fetch internship details (could also be passed via state, but fetching is safer)
    api.get(`/api/internships/${id}`)
      .then(res => setInternship(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (appId: number, status: string) => {
    try {
      await api.put(`/api/applications/${appId}`, { status });
      setApplicants(apps => apps.map(a => a.id === appId ? { ...a, status } : a));
    } catch (e: any) {
      alert("Error updating status: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div style={{maxWidth: '1000px', margin: '0 auto'}}>
      <Link to="/company/dashboard" className="btn" style={{background: 'none', border: 'none', padding: '0', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', cursor: 'pointer', color: 'var(--text-light)', textDecoration: 'none'}}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="page-title">
        <span className="eyebrow">APPLICANTS</span>
        <h1>{internship ? internship.job_title : 'Loading...'}</h1>
        <p>Review and manage candidates who applied for this role.</p>
      </div>

      <div className="cards" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
        {loading ? <p>Loading applicants...</p> : applicants.length === 0 ? (
          <div className="empty">
            <User size={32} />
            <p>No applications received yet.</p>
          </div>
        ) : (
          applicants.map(app => (
            <article key={app.id} style={{background: 'var(--surface)', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
              <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                <div style={{width: '50px', height: '50px', borderRadius: '25px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)'}}>
                  {app.student_name?.[0] || 'U'}
                </div>
                <div>
                  <h3 style={{margin: '0 0 5px 0'}}>{app.student_name}</h3>
                  <div style={{fontSize: '0.9rem', color: 'var(--text-light)', display: 'flex', gap: '15px'}}>
                    <span>{app.student_email}</span>
                    {app.student_college && <span>• {app.student_college}</span>}
                    <span>• Applied: {app.applied_date ? app.applied_date.split('T')[0] : 'N/A'}</span>
                  </div>
                  <div className="tags" style={{marginTop: '10px'}}>
                    {app.student_skills.slice(0, 5).map((s: string) => <span key={s} style={{padding: '2px 8px', fontSize: '0.8rem'}}>{s}</span>)}
                    {app.student_skills.length > 5 && <span style={{padding: '2px 8px', fontSize: '0.8rem'}}>+{app.student_skills.length - 5} more</span>}
                  </div>
                </div>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px'}}>
                <span style={{padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', background: '#f1f5f9', color: '#475569'}}>
                  Current Status: {app.status}
                </span>
                
                <div style={{display: 'flex', gap: '10px'}}>
                  {app.status !== 'Selected' && (
                    <button onClick={() => updateStatus(app.id, 'Selected')} className="btn primary" style={{padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '5px', background: '#10b981'}}>
                      <CheckCircle size={16} /> Select
                    </button>
                  )}
                  {app.status !== 'Rejected' && (
                    <button onClick={() => updateStatus(app.id, 'Rejected')} className="btn secondary" style={{padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444', borderColor: '#fee2e2', background: '#fee2e2'}}>
                      <XCircle size={16} /> Reject
                    </button>
                  )}
                  {app.status !== 'Interview' && (
                    <button onClick={() => updateStatus(app.id, 'Interview')} className="btn secondary" style={{padding: '8px 15px'}}>
                      Invite to Interview
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
