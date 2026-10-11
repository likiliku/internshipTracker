import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Shield, Lock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  async function requestOtp(e: any) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      await api.post('/api/auth/send-otp', { email });
      setStep(2);
      setMsg(`We've sent a 6-digit code to ${email}. Check your inbox!`);
    } catch (e: any) {
      setErr(e.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: any) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const res = await api.post('/api/auth/verify-otp', { email, otp });
      login(res.data);
      if (res.data.user.role === 'ADMIN') nav('/admin');
      else if (res.data.user.role === 'COMPANY') nav('/company/dashboard');
      else nav('/student/dashboard');
    } catch (e: any) {
      setErr(e.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminPasswordLogin(e: any) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data);
      if (res.data.user.role === 'ADMIN') {
        nav('/admin');
      } else {
        setErr('This portal is strictly for administrators.');
      }
    } catch (e: any) {
      setErr(e.response?.data?.detail || 'Incorrect admin email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      {isAdminMode ? (
        <form onSubmit={handleAdminPasswordLogin}>
          <div className="logo" style={{ background: '#0f172a' }}><Lock size={16} /></div>
          <h1>Admin Login</h1>
          <p>Access restricted to administrators. Sign in with password.</p>
          {err && <div className="error">{err}</div>}
          <label>Admin Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@tracker.com" required /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required /></label>
          <button className="primary" disabled={loading} style={{ background: '#0f172a' }}>
            {loading ? 'Authenticating...' : <>Sign In as Admin <ArrowRight size={17} style={{marginLeft: '8px'}}/></>}
          </button>
          <p style={{textAlign: 'center', marginTop: '18px'}}>
            <button type="button" onClick={() => { setIsAdminMode(false); setErr(''); setEmail(''); setPassword(''); }} style={{background: 'none', border: 'none', color: '#155eef', cursor: 'pointer', textDecoration: 'underline'}}>
              ← Back to User Login (OTP)
            </button>
          </p>
        </form>
      ) : step === 1 ? (
        <form onSubmit={requestOtp}>
          <div className="logo">↗</div>
          <h1>User Sign In</h1>
          <p>Enter your Gmail address. We'll send you a secure OTP to sign in.</p>
          {err && <div className="error">{err}</div>}
          <label>Email Address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.name@gmail.com" required /></label>
          <button className="primary" disabled={loading}>
            {loading ? 'Sending...' : <>Send Secure Code <Mail size={17} style={{marginLeft: '8px'}}/></>}
          </button>
          <p style={{marginTop: '10px'}}>Don't have an account? It will be created automatically when you sign in.</p>
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '20px', paddingTop: '15px', textAlign: 'center' }}>
            <button type="button" onClick={() => { setIsAdminMode(true); setErr(''); setEmail(''); setPassword(''); }} style={{background: 'none', border: 'none', color: '#475467', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500}}>
              <Shield size={14} /> Admin Login (Password Only) →
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <div className="logo">↗</div>
          <h1>Verify it's you</h1>
          <p style={{color: 'green', background: '#e6ffe6', padding: '10px', borderRadius: '5px', fontSize: '14px', marginBottom: '20px'}}>{msg}</p>
          {err && <div className="error">{err}</div>}
          <label>6-Digit OTP<input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" maxLength={6} required autoFocus /></label>
          <button className="primary" disabled={loading}>
            {loading ? 'Verifying...' : <>Sign In <ArrowRight size={17} style={{marginLeft: '8px'}}/></>}
          </button>
          <p style={{textAlign: 'center', marginTop: '10px'}}>
            <button type="button" onClick={() => { setStep(1); setErr(''); setOtp(''); }} style={{background: 'none', border: 'none', color: '#155eef', cursor: 'pointer', textDecoration: 'underline'}}>
              Use a different email
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
