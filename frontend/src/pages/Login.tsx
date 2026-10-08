import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
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

  return (
    <div className="auth">
      {step === 1 ? (
        <form onSubmit={requestOtp}>
          <div className="logo">↗</div>
          <h1>Welcome back</h1>
          <p>Enter your Gmail address. We'll send you a secure OTP to sign in.</p>
          {err && <div className="error">{err}</div>}
          <label>Email Address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.name@gmail.com" required /></label>
          <button className="primary" disabled={loading}>
            {loading ? 'Sending...' : <>Send Secure Code <Mail size={17} style={{marginLeft: '8px'}}/></>}
          </button>
          <p>Don't have an account? It will be created automatically when you sign in.</p>
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
          <p style={{textAlign: 'center', marginTop: '10px'}}><button type="button" onClick={() => setStep(1)} style={{background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline'}}>Use a different email</button></p>
        </form>
      )}
    </div>
  );
}
