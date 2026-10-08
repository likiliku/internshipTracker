import React, { useState, useEffect } from 'react';
import { ShieldCheck, Trophy, Zap, AlertCircle, Settings, ChevronRight, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { ChipInput } from '../components/ChipInput';
import { ArrayField } from '../components/ArrayField';
import { ExtractedField } from '../components/ExtractedField';
import { ResumeUploader } from '../components/ResumeUploader';

export function Profile() {
  const [p, setP] = useState<any>({ skills: [], projects: [], certifications: [], experience: [], preferences: {roles:[], industries:[], locations:[]} });
  const [saved, setSaved] = useState(false);
  const [conf, setConf] = useState<any>({});
  const [showSummary, setShowSummary] = useState(false);
  
  useEffect(() => {
    api.get('/api/students/profile').then(r => setP({
      ...r.data,
      skills: r.data.skills || [],
      projects: r.data.projects || [],
      certifications: r.data.certifications || [],
      experience: r.data.experience || [],
      preferences: r.data.preferences || {roles:[], industries:[], locations:[]}
    }));
  }, []);
  
  const update = (k: string, v: any) => setP({ ...p, [k]: v });
  
  async function save() {
    await api.put('/api/students/profile', p);
    setSaved(true);
    setConf({});
    setShowSummary(false);
    setTimeout(() => setSaved(false), 3000);
  }
  
  const handleExtracted = (data: any, confidence: any) => {
    setConf(confidence || {});
    setShowSummary(true);
    setP((prev: any) => {
      const newP = { ...prev };
      if (data.name) newP.name = data.name;
      if (data.email) newP.email = data.email;
      if (data.phone) newP.phone = data.phone;
      if (data.education) {
        if (data.education.college) newP.college = data.education.college;
        if (data.education.degree) newP.degree = data.education.degree;
        if (data.education.branch) newP.branch = data.education.branch;
        if (data.education.graduation_year) newP.graduation_year = data.education.graduation_year;
        if (data.education.cgpa) newP.cgpa = data.education.cgpa;
      }
      if (data.skills) {
        const newSkills = [...prev.skills];
        data.skills.forEach((s: any) => {
          if (!newSkills.find((x:any) => x.name === s.name)) newSkills.push({ name: s.name, category: 'Parsed' });
        });
        newP.skills = newSkills;
      }
      if (data.links) {
        if (!newP.links) newP.links = {};
        if (data.links.github) newP.links.github = data.links.github;
        if (data.links.linkedin) newP.links.linkedin = data.links.linkedin;
        if (data.links.portfolio) newP.links.portfolio = data.links.portfolio;
      }
      if (data.experience && data.experience.length) newP.experience = data.experience;
      if (data.projects && data.projects.length) newP.projects = data.projects;
      if (data.certifications && data.certifications.length) newP.certifications = data.certifications;
      return newP;
    });
  };

  const calculateProfileScore = () => {
    let score = 0;
    const suggestions = [];

    // Basic Info (10%)
    if (p.name && p.email && p.phone) {
      score += 10;
    } else {
      suggestions.push("Complete your basic contact information.");
    }

    // Education (10%)
    if (p.college && p.degree && p.branch && p.graduation_year) {
      score += 10;
    } else {
      suggestions.push("Fill out all education details including college and graduation year.");
    }

    // Skills (Up to 35% - 5% per skill)
    const numSkills = p.skills ? p.skills.length : 0;
    if (numSkills > 0) {
      score += Math.min(35, numSkills * 5);
      if (numSkills < 7) {
        suggestions.push(`Add ${7 - numSkills} more skills to maximize your skill score.`);
      }
    } else {
      suggestions.push("Add at least 5-7 technical and soft skills to your profile.");
    }

    // Experience (Up to 15% - 7.5% per role)
    const numExp = p.experience ? p.experience.length : 0;
    if (numExp > 0) {
      score += Math.min(15, numExp * 7.5);
    } else {
      suggestions.push("Add your work experience or internships.");
    }

    // Projects (Up to 15% - 5% per project)
    const numProj = p.projects ? p.projects.length : 0;
    if (numProj > 0) {
      score += Math.min(15, numProj * 5);
      if (numProj < 3) {
        suggestions.push(`Add ${3 - numProj} more projects to showcase your practical work.`);
      }
    } else {
      suggestions.push("Add at least 1-3 projects to demonstrate your abilities.");
    }

    // Certifications & Achievements (Up to 10% - 5% per item)
    const numCerts = p.certifications ? p.certifications.length : 0;
    if (numCerts > 0) {
      score += Math.min(10, numCerts * 5);
    } else {
      suggestions.push("Add certifications or achievements to stand out.");
    }

    // Links (Up to 5%)
    let linkCount = 0;
    if (p.links?.github) linkCount++;
    if (p.links?.linkedin) linkCount++;
    if (p.links?.portfolio) linkCount++;
    if (linkCount > 0) {
      score += Math.min(5, Math.ceil(linkCount * 1.7));
    } else {
      suggestions.push("Add a link to your GitHub, LinkedIn, or Portfolio.");
    }

    // Round score to avoid decimals
    score = Math.floor(score);
    if (score > 100) score = 100;

    return { score, suggestions };
  };

  const { score, suggestions } = calculateProfileScore();

  return <>
    <div className="page-title">
      <span className="eyebrow">YOUR PROFILE</span>
      <h1>Make your matches smarter</h1>
    </div>

    {/* PREMIUM PROFILE COMPLETION WIDGET */}
    <div style={{
      background: 'linear-gradient(145deg, var(--surface) 0%, rgba(20,20,25,0.8) 100%)', 
      padding: '25px', 
      borderRadius: '12px', 
      border: '1px solid rgba(255,255,255,0.1)', 
      marginBottom: '30px', 
      maxWidth: '800px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative gradient orb */}
      <div style={{
        position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', 
        background: score >= 80 ? 'rgba(46, 204, 113, 0.2)' : score >= 50 ? 'rgba(52, 152, 219, 0.2)' : 'rgba(231, 76, 60, 0.2)',
        filter: 'blur(50px)', borderRadius: '50%', zIndex: 0
      }}></div>

      <div style={{position: 'relative', zIndex: 1}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            {score >= 80 ? <Trophy color="var(--green)" size={24} /> : score >= 50 ? <Zap color="var(--primary)" size={24} /> : <AlertCircle color="var(--red)" size={24} />}
            <h3 style={{margin: 0, fontSize: '1.2rem'}}>Profile Strength</h3>
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '20px', 
            border: `1px solid ${score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--primary)' : 'var(--red)'}`
          }}>
            <span style={{fontSize: '1.2rem', fontWeight: '900', color: score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--primary)' : 'var(--red)'}}>{score}%</span>
          </div>
        </div>

        <div style={{height: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: '5px', overflow: 'hidden', marginBottom: '20px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'}}>
          <div style={{
            height: '100%', 
            width: `${score}%`, 
            background: score >= 80 ? 'linear-gradient(90deg, #2ecc71, #27ae60)' : score >= 50 ? 'linear-gradient(90deg, #3498db, #2980b9)' : 'linear-gradient(90deg, #e74c3c, #c0392b)', 
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 10px rgba(255,255,255,0.3)'
          }}></div>
        </div>

        {suggestions.length > 0 ? (
          <div style={{background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '15px', borderLeft: `3px solid ${score >= 50 ? 'var(--primary)' : 'var(--red)'}`}}>
            <strong style={{color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.9rem'}}>
              <Settings size={14} /> Action Items to Level Up:
            </strong>
            <ul style={{margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px'}}>
              {suggestions.slice(0, 3).map((s, i) => (
                <li key={i} style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem', color: 'var(--text)'}}>
                  <ChevronRight size={16} color="var(--primary)" style={{flexShrink: 0, marginTop: '2px'}} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div style={{background: 'rgba(46, 204, 113, 0.1)', borderRadius: '8px', padding: '15px', border: '1px solid rgba(46, 204, 113, 0.3)', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <ShieldCheck size={24} color="var(--green)" />
            <div>
              <strong style={{color: 'var(--green)', display: 'block'}}>Maximum Strength Reached!</strong>
              <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Your profile is fully optimized. You are ready to get matched to top tier internships.</span>
            </div>
          </div>
        )}
      </div>
    </div>
    
    <div style={{display:'flex', flexDirection:'column', gap:'30px', maxWidth:'800px'}}>
      <section>
        <ResumeUploader onUpload={handleExtracted} />
        {showSummary && <div style={{marginTop:'20px', padding:'20px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'8px'}}>
          <h3 style={{display:'flex', alignItems:'center', gap:'10px'}}><CheckCircle size={20} color="var(--green)"/> Resume Analysis Complete</h3>
          <p style={{margin:'10px 0'}}>Resume analyzed successfully. Please review the extracted information before saving.</p>
        </div>}
      </section>

      <section>
        <h2>Basic Information</h2>
        <div className="profile-grid">
          <ExtractedField label="Full Name" value={p.name} onChange={(v:any) => update('name', v)} confidence={conf.name} />
          <ExtractedField label="Email" value={p.email} onChange={(v:any) => update('email', v)} confidence={conf.email} type="email" />
          <ExtractedField label="Phone" value={p.phone} onChange={(v:any) => update('phone', v)} confidence={conf.phone} />
          <ExtractedField label="College" value={p.college} onChange={(v:any) => update('college', v)} confidence={conf.education?.college} />
          <ExtractedField label="Degree" value={p.degree} onChange={(v:any) => update('degree', v)} confidence={conf.education?.degree} />
          <ExtractedField label="Branch" value={p.branch} onChange={(v:any) => update('branch', v)} confidence={conf.education?.branch} />
          <ExtractedField label="CGPA" type="number" step="0.01" value={p.cgpa} onChange={(v:any) => update('cgpa', parseFloat(v))} confidence={conf.education?.cgpa} />
          <ExtractedField label="Graduation Year" type="number" value={p.graduation_year} onChange={(v:any) => update('graduation_year', parseInt(v))} confidence={conf.education?.graduation_year} />
        </div>
      </section>

      <section>
        <h2>Skills</h2>
        <label style={{display:'flex', justifyContent:'space-between'}}>Add skills (Press Enter) {conf.skills && <span className={`conf ${conf.skills >= 80 ? 'med' : 'low'}`}>{conf.skills}% confidence</span>}</label>
        <ChipInput value={p.skills} onChange={v => update('skills', v)} placeholder="e.g. React, Python" />
      </section>

      <section>
        <h2>Projects</h2>
        <ArrayField 
          items={p.projects} onChange={v => update('projects', v)} 
          newItem={{name:'', description:'', link:''}}
          renderItem={(item, setItem) => (
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <input placeholder="Project Name" value={item.name} onChange={e => setItem({...item, name: e.target.value})} />
              <input placeholder="Link" value={item.link || ''} onChange={e => setItem({...item, link: e.target.value})} />
              <textarea placeholder="Description" value={item.description || ''} onChange={e => setItem({...item, description: e.target.value})} />
            </div>
          )}
        />
      </section>
      
      <section>
        <h2>Certifications</h2>
        <ArrayField 
          items={p.certifications} onChange={v => update('certifications', v)} 
          newItem={{name:'', issuer:'', date:'', link:''}}
          renderItem={(item, setItem) => (
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <input placeholder="Certification Name" value={item.name} onChange={e => setItem({...item, name: e.target.value})} />
              <input placeholder="Issuer" value={item.issuer || ''} onChange={e => setItem({...item, issuer: e.target.value})} />
              <input placeholder="Date" value={item.date || ''} onChange={e => setItem({...item, date: e.target.value})} />
            </div>
          )}
        />
      </section>
      
      <section>
        <h2>Experience</h2>
        <ArrayField 
          items={p.experience} onChange={v => update('experience', v)} 
          newItem={{company:'', role:'', duration:'', description:''}}
          renderItem={(item, setItem) => (
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <input placeholder="Company" value={item.company} onChange={e => setItem({...item, company: e.target.value})} />
              <input placeholder="Role" value={item.role} onChange={e => setItem({...item, role: e.target.value})} />
              <input placeholder="Duration" value={item.duration || ''} onChange={e => setItem({...item, duration: e.target.value})} />
              <textarea placeholder="Description" value={item.description || ''} onChange={e => setItem({...item, description: e.target.value})} />
            </div>
          )}
        />
      </section>

      <section>
        <h2>Preferences</h2>
        <div className="profile-grid">
          <label>Work Mode<select value={p.preferences?.work_mode || ''} onChange={e => update('preferences', {...p.preferences, work_mode: e.target.value})}>
            <option value="">Any</option><option>Remote</option><option>Hybrid</option><option>On-site</option>
          </select></label>
          <label>Minimum Stipend (monthly)<input type="number" value={p.preferences?.minimum_stipend || ''} onChange={e => update('preferences', {...p.preferences, minimum_stipend: parseFloat(e.target.value)})} /></label>
        </div>
      </section>

      <button className="primary" onClick={save} style={{marginTop:'20px', padding:'12px', fontSize:'16px'}}>
        {saved ? 'Saved!' : 'Save complete profile'}
      </button>
    </div>
  </>
}
