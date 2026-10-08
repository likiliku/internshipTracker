import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Briefcase, Edit, Users, Trash2, PlusCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function CompanyDashboard() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api.get('/api/internships/company/mine')
      .then(res => setInternships(res.data))
      .catch(err => alert("Error loading internships"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this internship?")) return;
    try {
      await api.delete(`/api/internships/${id}`);
      loadData();
    } catch (e: any) {
      alert("Error deleting internship: " + (e.response?.data?.detail || e.message));
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'APPROVED') return <CheckCircle size={16} color="green" />;
    if (status === 'REJECTED') return <XCircle size={16} color="red" />;
    return <Clock size={16} color="orange" />;
  };

  return (
    <>
      <div className="page-title" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <span className="eyebrow">COMPANY PORTAL</span>
          <h1>My Postings</h1>
          <p>Manage your internship postings and review applicants.</p>
        </div>
        <Link to="/company/internships/new" className="btn primary" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <PlusCircle size={18} /> Post New Internship
        </Link>
      </div>

      <div className="cards">
        {loading ? <p>Loading...</p> : internships.length === 0 ? (
          <div className="empty">
            <Briefcase size={32} />
            <p>You haven't posted any internships yet.</p>
            <Link to="/company/internships/new" className="btn primary" style={{marginTop: '15px'}}>Create First Posting</Link>
          </div>
        ) : (
          internships.map(x => (
            <article className="internship" key={x.id}>
              <div className="card-top">
                <div>
                  <h3>{x.job_title}</h3>
                  <p>{x.location} • {x.work_mode}</p>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', background: '#f1f5f9', borderRadius: '15px', fontSize: '0.85rem', fontWeight: 'bold'}}>
                  {getStatusIcon(x.status)} {x.status}
                </div>
              </div>
              <div className="meta" style={{margin: '15px 0'}}>
                <span><b>Stipend:</b> {x.stipend_min}-{x.stipend_max} INR</span>
                <span><b>Category:</b> {x.category}</span>
                <span><b>Posted:</b> {x.created_at.split('T')[0]}</span>
              </div>
              
              <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                <Link to={`/company/internships/${x.id}/applicants`} className="btn primary" style={{flex: 1, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px'}}>
                  <Users size={16} /> View Applicants
                </Link>
                <Link to={`/company/internships/${x.id}/edit`} className="btn secondary" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <Edit size={16} /> Edit
                </Link>
                <button onClick={() => handleDelete(x.id)} className="btn" style={{background: '#fee2e2', color: '#ef4444', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </>
  );
}
