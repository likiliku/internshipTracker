import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, IndianRupee, ArrowRight, Bookmark, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/' });
api.interceptors.request.use(c => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

function Empty({ text }: { text: string }) {
  return <div className="empty"><Bookmark size={28} /><p>{text}</p></div>
}

function InternshipCard({ data, onTrack }: { data: any, onTrack: (id: number, status: string) => void }) {
  return (
    <article className="internship">
      <div className="company-icon">{data.company_name?.[0] || 'C'}</div>
      <div className="card-top">
        <div>
          <h3>{data.job_title}</h3>
          <p>{data.company_name}</p>
        </div>
        <b className="score" style={{color: 'var(--text-light)', background: '#eee'}}>{data.source}</b>
      </div>
      <div className="meta">
        <span><MapPin size={14} />{data.location || 'Flexible'}</span>
        <span>{data.work_mode || 'Remote'}</span>
        <span>
          <IndianRupee size={14} />
          {data.stipend_min ? `${data.stipend_min / 1000}k–${data.stipend_max / 1000}k` : 'Not disclosed'}
        </span>
        {data.posted_date && <span>Posted: {data.posted_date}</span>}
      </div>
      <div className="tags">
        {(data.required_skills || []).slice(0, 4).map((s: string) => <span key={s}>{s}</span>)}
      </div>
      <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
        {data.id ? (
          <Link to={`/internships/${data.id}`} className="btn primary" style={{flex: 1, textAlign: 'center'}}>View Details</Link>
        ) : (
          <a href={data.application_url} target="_blank" rel="noreferrer" className="btn primary" style={{flex: 1, textAlign: 'center', textDecoration: 'none'}}>View on Adzuna</a>
        )}
        <button onClick={() => onTrack(data.id, 'Saved')} className="btn secondary">Save</button>
        <button onClick={() => onTrack(data.id, 'Applied')} className="btn secondary">Track Application</button>
      </div>
    </article>
  );
}

export default function InternshipSearch() {
  const [data, setData] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('latest');
  const [loading, setLoading] = useState(false);

  const loadLocal = () => {
    setLoading(true);
    api.get('/api/internships', { params: { q, location, work_mode: workMode, category, sort } })
      .then(r => setData(r.data.items))
      .finally(() => setLoading(false));
  };

  const loadLive = () => {
    setLoading(true);
    api.get('/api/internships/search', { params: { keyword: q, location } })
      .then(r => {
        // We get live Adzuna results. 
        // Note: They don't have DB IDs yet unless synced, but we can display them.
        // For full functionality, we should sync them.
        setData(r.data.items);
      })
      .finally(() => setLoading(false));
  };

  const syncAndLoad = () => {
    setLoading(true);
    api.post('/api/internships/sync', null, { params: { keyword: q, location } })
      .then(() => loadLocal())
      .catch(() => loadLocal());
  };

  useEffect(() => {
    loadLocal();
  }, []);

  const handleTrack = async (id: number, status: string) => {
    if(!id) {
        alert("This is a live result from Adzuna. Please search via DB to track it.");
        return;
    }
    try {
        await api.post('/api/applications', { internship_id: id, status });
        alert(`Application marked as ${status}!`);
    } catch(e: any) {
        alert(e.response?.data?.detail || "Error tracking application");
    }
  }

  return (
    <>
      <div className="page-title">
        <span className="eyebrow">OPPORTUNITY MARKETPLACE</span>
        <h1>Find Your Next Internship</h1>
        <p>Curated roles from verified feeds and authorized sources like Adzuna.</p>
      </div>
      
      <div className="search-panel" style={{display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface)', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
          <div style={{display: 'flex', gap: '10px'}}>
            <div style={{flex: 2, display: 'flex', alignItems: 'center', background: 'var(--bg)', padding: '10px', borderRadius: '4px'}}>
                <Search size={20} style={{marginRight: '10px'}}/>
                <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadLive()} placeholder="Search internships by role or skill" style={{border: 'none', background: 'none', width: '100%', outline: 'none'}}/>
            </div>
            <div style={{flex: 1}}>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (e.g. Bangalore)" style={{padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid var(--border)'}}/>
            </div>
          </div>
          <div style={{display: 'flex', gap: '10px'}}>
              <select value={workMode} onChange={e=>setWorkMode(e.target.value)} style={{flex: 1, padding: '10px'}}>
                  <option value="">Any Work Mode</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
              </select>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={{flex: 1, padding: '10px'}}>
                  <option value="">Any Category</option>
                  <option value="Software Development">Software Development</option>
                  <option value="Data Science">Data Science</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Other">Other</option>
              </select>
              <select value={sort} onChange={e=>setSort(e.target.value)} style={{flex: 1, padding: '10px'}}>
                  <option value="latest">Latest</option>
                  <option value="relevance">Relevance</option>
                  <option value="salary">Salary</option>
              </select>
              {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') || '{}').role === 'ADMIN' ? (
                <button onClick={syncAndLoad} className="primary" style={{padding: '10px 20px'}}>Search & Sync</button>
              ) : (
                <button onClick={loadLive} className="primary" style={{padding: '10px 20px'}}>Search</button>
              )}
          </div>
      </div>
      
      <div className="cards">
        {loading ? <p>Loading opportunities…</p> : data.length ? data.map((x, i) => <InternshipCard key={x.id || i} data={x} onTrack={handleTrack}/>) : <Empty text="No internships found. Try another keyword or location." />}
      </div>
    </>
  );
}
