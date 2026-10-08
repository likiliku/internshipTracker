import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export function AdminInternships() {
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api.get('/api/admin/internships')
      .then(res => {
        // Show pending first
        const sorted = res.data.sort((a: any, b: any) => {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
          return 0;
        });
        setInternships(sorted);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      await api.put(`/api/admin/internships/${id}/${action}`);
      loadData();
    } catch (e: any) {
      alert("Error: " + (e.response?.data?.detail || e.message));
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return <span style={{padding: '4px 8px', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'}}>{status}</span>;
    if (status === 'REJECTED') return <span style={{padding: '4px 8px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'}}>{status}</span>;
    return <span style={{padding: '4px 8px', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'}}>{status}</span>;
  };

  return (
    <div>
      <div className="page-title">
        <span className="eyebrow">MODERATION</span>
        <h1>Internships Queue</h1>
        <p>Review and approve or reject company postings.</p>
      </div>

      <div style={{background: 'var(--surface)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
          <thead style={{background: 'var(--bg)'}}>
            <tr>
              <th style={{padding: '15px', borderBottom: '1px solid var(--border)'}}>Job Title</th>
              <th style={{padding: '15px', borderBottom: '1px solid var(--border)'}}>Company</th>
              <th style={{padding: '15px', borderBottom: '1px solid var(--border)'}}>Source</th>
              <th style={{padding: '15px', borderBottom: '1px solid var(--border)'}}>Status</th>
              <th style={{padding: '15px', borderBottom: '1px solid var(--border)'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{padding: '20px', textAlign: 'center'}}>Loading...</td></tr>
            ) : internships.map(x => (
              <tr key={x.id}>
                <td style={{padding: '15px', borderBottom: '1px solid var(--border)'}}>
                  <div style={{fontWeight: 'bold'}}>{x.job_title}</div>
                  <div style={{fontSize: '0.85rem', color: 'var(--text-light)'}}>{x.location} • {x.work_mode}</div>
                </td>
                <td style={{padding: '15px', borderBottom: '1px solid var(--border)'}}>{x.company_name}</td>
                <td style={{padding: '15px', borderBottom: '1px solid var(--border)'}}>{x.source}</td>
                <td style={{padding: '15px', borderBottom: '1px solid var(--border)'}}>{getStatusBadge(x.status)}</td>
                <td style={{padding: '15px', borderBottom: '1px solid var(--border)'}}>
                  {x.status === 'PENDING' && (
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button onClick={() => handleAction(x.id, 'approve')} style={{padding: '5px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button onClick={() => handleAction(x.id, 'reject')} style={{padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'}}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
