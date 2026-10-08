import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import type { AdminStudentSummary } from '../types';

export function AdminStudents() {
  const [students, setStudents] = useState<AdminStudentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const limit = 20;

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, q, status]);

  const load = async () => {
    try {
      const res = await api.get('/api/admin/students', { params: { page, limit, q, status } });
      setStudents(res.data.items);
      setTotal(res.data.total);
    } catch (err: any) {
      alert("Failed to load students: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <>
      <div className="page-title">
        <span className="eyebrow">STUDENT DIRECTORY</span>
        <h1>Manage Students</h1>
      </div>

      <div style={{display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center'}}>
        <div style={{flex: 1, position: 'relative'}}>
          <Search size={18} style={{position: 'absolute', left: '15px', top: '12px', color: '#9ca3af'}} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={q} 
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            style={{width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #dce2ec'}}
          />
        </div>
        <select 
          value={status} 
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          style={{padding: '10px', borderRadius: '8px', border: '1px solid #dce2ec', width: '200px'}}
        >
          <option value="">All Applications</option>
          <option value="pending">Has Pending</option>
          <option value="selected">Has Selected</option>
          <option value="rejected">Has Rejected</option>
        </select>
      </div>

      <div style={{background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
          <thead>
            <tr style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem'}}>
              <th style={{padding: '15px 20px'}}>Student Name</th>
              <th style={{padding: '15px 20px'}}>Contact</th>
              <th style={{padding: '15px 20px'}}>Education</th>
              <th style={{padding: '15px 20px'}}>Pending</th>
              <th style={{padding: '15px 20px'}}>Selected</th>
              <th style={{padding: '15px 20px'}}>Rejected</th>
              <th style={{padding: '15px 20px'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} style={{borderBottom: '1px solid #e2e8f0'}}>
                <td style={{padding: '15px 20px'}}>
                  <div style={{fontWeight: 'bold', color: '#0f172a'}}>{s.name}</div>
                </td>
                <td style={{padding: '15px 20px', color: '#475569', fontSize: '0.9rem'}}>
                  <div>{s.email}</div>
                  {s.phone && <div style={{fontSize: '0.8rem', marginTop: '2px'}}>{s.phone}</div>}
                </td>
                <td style={{padding: '15px 20px', color: '#475569', fontSize: '0.9rem'}}>
                  <div>{s.college || <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Not provided</span>}</div>
                  {s.branch && <div style={{fontSize: '0.8rem', marginTop: '2px'}}>{s.branch}</div>}
                </td>
                <td style={{padding: '15px 20px'}}>
                  {s.application_summary.pending > 0 ? <StatusBadge status={s.application_summary.pending + " Pending"} /> : '-'}
                </td>
                <td style={{padding: '15px 20px'}}>
                  {s.application_summary.selected > 0 ? <StatusBadge status={s.application_summary.selected + " Selected"} /> : '-'}
                </td>
                <td style={{padding: '15px 20px'}}>
                  {s.application_summary.rejected > 0 ? <StatusBadge status={s.application_summary.rejected + " Rejected"} /> : '-'}
                </td>
                <td style={{padding: '15px 20px'}}>
                  <Link to={`/admin/students/${s.id}`} style={{color: '#2563eb', textDecoration: 'none', fontWeight: 'bold'}}>View &rarr;</Link>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={7} style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>No students found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px'}}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="secondary">Previous</button>
          <span style={{padding: '10px', color: '#64748b'}}>Page {page} of {Math.ceil(total / limit)}</span>
          <button disabled={page * limit >= total} onClick={() => setPage(page + 1)} className="secondary">Next</button>
        </div>
      )}
    </>
  );
}
