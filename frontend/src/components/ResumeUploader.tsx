import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { api } from '../services/api';

export function ResumeUploader({ onUpload }: { onUpload: (data: any, confidence: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileInfo, setFileInfo] = useState<any>(null);

  const handleFile = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileInfo({ name: file.name, size: (file.size / 1024 / 1024).toFixed(2) + ' MB' });
    setLoading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/api/students/resume/upload', fd, {
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      });
      onUpload(res.data.data, res.data.confidence);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Upload failed');
      setFileInfo(null);
    } finally {
      setLoading(false);
    }
  };
  return <div className="resume-upload" style={{border:'2px dashed var(--border)', padding:'30px', textAlign:'center', borderRadius:'8px', backgroundColor:'var(--surface)'}}>
    <label style={{cursor:'pointer', display:'block'}}>
      <Upload size={32} style={{margin:'0 auto 15px', color:'var(--primary)'}}/>
      <input type="file" accept=".pdf,.doc,.docx" style={{display:'none'}} onChange={handleFile} disabled={loading} />
      <h3 style={{marginBottom:'5px'}}>Build your profile automatically</h3>
      <p style={{color:'var(--text-light)', marginBottom:'15px'}}>Upload your resume to automatically fill your profile.<br/>Supported formats: PDF, DOC, DOCX</p>
      <div className="btn primary" style={{display:'inline-flex'}}>{loading ? 'Uploading & parsing...' : 'Upload Resume'}</div>
    </label>
    {fileInfo && <div style={{marginTop:'15px', padding:'10px', background:'var(--bg)', borderRadius:'4px', display:'flex', justifyContent:'center', alignItems:'center', gap:'10px'}}>
      <FileText size={16}/> {fileInfo.name} ({fileInfo.size})
      {loading && <span>{progress}%</span>}
    </div>}
  </div>
}
