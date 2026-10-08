import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Save, ArrowLeft } from 'lucide-react';

export function CompanyInternshipForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEditing = !!id && id !== 'new';
  
  const [formData, setFormData] = useState({
    job_title: '',
    description: '',
    requirements: '',
    location: '',
    work_mode: 'Remote',
    category: 'Software Development',
    stipend_min: 0,
    stipend_max: 0,
    duration_months: 3,
    application_deadline: '',
    required_skills: [] as string[],
    application_url: ''
  });

  const [skillsInput, setSkillsInput] = useState('');

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      api.get(`/api/internships/${id}`)
        .then(res => {
          const d = res.data;
          setFormData({
            job_title: d.job_title || '',
            description: d.description || '',
            requirements: d.requirements || '',
            location: d.location || '',
            work_mode: d.work_mode || 'Remote',
            category: d.category || 'Software Development',
            stipend_min: d.stipend_min || 0,
            stipend_max: d.stipend_max || 0,
            duration_months: d.duration_months || 3,
            application_deadline: d.application_deadline ? d.application_deadline.split('T')[0] : '',
            required_skills: d.required_skills || [],
            application_url: d.application_url || ''
          });
          setSkillsInput((d.required_skills || []).join(', '));
        })
        .catch(err => {
          alert("Error loading internship");
          navigate('/company/dashboard');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      required_skills: skillsInput.split(',').map(s => s.trim()).filter(s => s)
    };
    
    try {
      if (isEditing) {
        await api.put(`/api/internships/${id}`, payload);
        alert("Internship updated successfully! It is now Pending Approval.");
      } else {
        await api.post('/api/internships', payload);
        alert("Internship created successfully! It is now Pending Approval.");
      }
      navigate('/company/dashboard');
    } catch (e: any) {
      alert(e.response?.data?.detail || "Error saving internship");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth: '800px', margin: '0 auto'}}>
      <button onClick={() => navigate('/company/dashboard')} className="btn" style={{background: 'none', border: 'none', padding: '0', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px', cursor: 'pointer', color: 'var(--text-light)'}}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="page-title">
        <span className="eyebrow">{isEditing ? 'EDIT' : 'CREATE'} POSTING</span>
        <h1>{isEditing ? 'Edit Internship' : 'Post New Internship'}</h1>
      </div>

      <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--surface)', padding: '30px', borderRadius: '12px'}}>
        
        <div style={{display: 'flex', gap: '20px'}}>
          <div style={{flex: 1}}>
            <label>Job Title *</label>
            <input required value={formData.job_title} onChange={e=>setFormData({...formData, job_title: e.target.value})} placeholder="e.g. Frontend Developer Intern" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px'}}/>
          </div>
          <div style={{flex: 1}}>
            <label>Category *</label>
            <select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px'}}>
                <option value="Software Development">Software Development</option>
                <option value="Data Science">Data Science</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="Web Development">Web Development</option>
                <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label>Description *</label>
          <textarea required rows={5} value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} placeholder="Describe the internship role..." style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px', resize: 'vertical'}}/>
        </div>

        <div>
          <label>Requirements</label>
          <textarea rows={4} value={formData.requirements} onChange={e=>setFormData({...formData, requirements: e.target.value})} placeholder="What qualifications are needed?" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px', resize: 'vertical'}}/>
        </div>

        <div>
          <label>Required Skills (comma separated) *</label>
          <input required value={skillsInput} onChange={e=>setSkillsInput(e.target.value)} placeholder="React, TypeScript, Python" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px'}}/>
        </div>

        <div style={{display: 'flex', gap: '20px'}}>
          <div style={{flex: 1}}>
            <label>Work Mode</label>
            <select value={formData.work_mode} onChange={e=>setFormData({...formData, work_mode: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px'}}>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
            </select>
          </div>
          <div style={{flex: 1}}>
            <label>Location</label>
            <input value={formData.location} onChange={e=>setFormData({...formData, location: e.target.value})} placeholder="e.g. Bangalore" style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px'}}/>
          </div>
          <div style={{flex: 1}}>
            <label>Duration (Months)</label>
            <input type="number" min="1" value={formData.duration_months} onChange={e=>setFormData({...formData, duration_months: Number(e.target.value)})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px'}}/>
          </div>
        </div>

        <div style={{display: 'flex', gap: '20px'}}>
          <div style={{flex: 1}}>
            <label>Min Stipend (INR/mo)</label>
            <input type="number" value={formData.stipend_min} onChange={e=>setFormData({...formData, stipend_min: Number(e.target.value)})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px'}}/>
          </div>
          <div style={{flex: 1}}>
            <label>Max Stipend (INR/mo)</label>
            <input type="number" value={formData.stipend_max} onChange={e=>setFormData({...formData, stipend_max: Number(e.target.value)})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px'}}/>
          </div>
          <div style={{flex: 1}}>
            <label>Application Deadline</label>
            <input type="date" value={formData.application_deadline} onChange={e=>setFormData({...formData, application_deadline: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px'}}/>
          </div>
        </div>

        <div>
          <label>External Application URL (Optional)</label>
          <input type="url" value={formData.application_url} onChange={e=>setFormData({...formData, application_url: e.target.value})} placeholder="https://..." style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', marginTop: '5px'}}/>
        </div>

        <button type="submit" disabled={loading} className="btn primary" style={{alignSelf: 'flex-start', padding: '12px 25px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem'}}>
          <Save size={18} /> {loading ? 'Saving...' : 'Save Internship'}
        </button>

      </form>
    </div>
  );
}
