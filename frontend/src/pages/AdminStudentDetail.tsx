import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, GraduationCap, MapPin, Mail, Phone } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import type { AdminStudentDetail as DetailType } from '../types';

export function AdminStudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState<DetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/api/admin/students/' + id)
      .then(res => {
        setStudent(res.data);
        setLoading(false);
      })
      .catch(e => {
        setErr(e.response?.data?.detail || e.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading student data...</div>;
  if (err || !student) return <div style={{color: 'red'}}>Failed to load student: {err}</div>;

  return (
    <>
      <div style={{marginBottom: '20px'}}>
        <Link to="/admin/students" style={{display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#64748b', textDecoration: 'none'}}>
          <ArrowLeft size={16} /> Back to Directory
        </Link>
      </div>

      <div style={{background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px', display: 'flex', gap: '30px', border: '1px solid #e2e8f0'}}>
        <div style={{flex: 1}}>
          <h1 style={{margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <User size={24} color="#3b82f6"/> {student.name}
          </h1>
          <div style={{display: 'flex', gap: '20px', color: '#475569', fontSize: '0.9rem', marginBottom: '20px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}><Mail size={16}/> {student.email}</div>
            {student.phone && <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}><Phone size={16}/> {student.phone}</div>}
          </div>
          
          <h3 style={{fontSize: '0.9rem', color: '#64748b', margin: '0 0 10px 0', textTransform: 'uppercase'}}>Education Profile</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', color: '#0f172a'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><GraduationCap size={16} color="#94a3b8"/> {student.degree || 'Degree not set'} in {student.branch || 'Branch not set'}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="#94a3b8"/> {student.college || 'College not set'} {student.graduation_year ? `(Class of ${student.graduation_year})` : ''}</div>
            <div><strong>CGPA:</strong> {student.cgpa || 'N/A'}</div>
          </div>
        </div>

        <div style={{width: '250px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
          <h3 style={{margin: '0 0 15px 0', fontSize: '1rem', color: '#0f172a'}}>Application Stats</h3>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
            <span style={{color: '#64748b'}}>Total Applied</span>
            <strong style={{fontSize: '1.2rem'}}>{student.application_summary.total}</strong>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem'}}>
            <span style={{color: '#475569'}}>Pending</span>
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>{student.application_summary.pending}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem'}}>
            <span style={{color: '#475569'}}>Selected</span>
            <span style={{color: '#10b981', fontWeight: 'bold'}}>{student.application_summary.selected}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem'}}>
            <span style={{color: '#475569'}}>Rejected</span>
            <span style={{color: '#ef4444', fontWeight: 'bold'}}>{student.application_summary.rejected}</span>
          </div>
        </div>
      </div>

      <div className="page-title">
        <span className="eyebrow">APPLICATION HISTORY</span>
        <h2>Detailed Pipeline</h2>
      </div>

      <div style={{background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
          <thead>
            <tr style={{background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem'}}>
              <th style={{padding: '15px 20px'}}>Role & Company</th>
              <th style={{padding: '15px 20px'}}>Status</th>
              <th style={{padding: '15px 20px'}}>Applied On</th>
              <th style={{padding: '15px 20px'}}>Interview Date</th>
              <th style={{padding: '15px 20px'}}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {student.applications.map(a => (
              <tr key={a.internship_id} style={{borderBottom: '1px solid #e2e8f0'}}>
                <td style={{padding: '15px 20px'}}>
                  <div style={{fontWeight: 'bold', color: '#0f172a'}}>{a.job_title}</div>
                  <div style={{color: '#475569', fontSize: '0.9rem'}}>{a.company_name}</div>
                </td>
                <td style={{padding: '15px 20px'}}>
                  <StatusBadge status={a.status} />
                </td>
                <td style={{padding: '15px 20px', color: '#475569', fontSize: '0.9rem'}}>
                  {a.applied_date ? new Date(a.applied_date).toLocaleDateString() : 'N/A'}
                </td>
                <td style={{padding: '15px 20px', color: '#475569', fontSize: '0.9rem'}}>
                  {a.interview_date ? new Date(a.interview_date).toLocaleString() : 'N/A'}
                </td>
                <td style={{padding: '15px 20px', color: '#475569', fontSize: '0.85rem', maxWidth: '250px'}}>
                  {a.notes ? (
                    <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={a.notes}>
                      {a.notes}
                    </div>
                  ) : <span style={{color: '#9ca3af', fontStyle: 'italic'}}>No notes</span>}
                </td>
              </tr>
            ))}
            {student.applications.length === 0 && (
              <tr>
                <td colSpan={5} style={{padding: '30px', textAlign: 'center', color: '#64748b'}}>No applications found for this student.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
