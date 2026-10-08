import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function Register() {
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [err, setErr] = useState('');
  const { login } = useAuth();
  const nav = useNavigate();

  async function submit(e: any) {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/register', f);
      login(res.data);
      nav('/student/dashboard');
    } catch (e: any) {
      let msg = 'Unable to create account';
      if (e.response?.data?.detail) {
        if (Array.isArray(e.response.data.detail)) {
          msg = e.response.data.detail.map((err: any) => err.msg).join(', ');
        } else {
          msg = e.response.data.detail;
        }
      }
      setErr(msg);
    }
  }

  return (
    <div className="auth">
      <form onSubmit={submit}>
        <div className="logo">↗</div>
        <h1>Start your search</h1>
        {err && <div className="error">{err}</div>}
        <label>Name<input onChange={e => setF({ ...f, name: e.target.value })} required /></label>
        <label>Email<input type="email" onChange={e => setF({ ...f, email: e.target.value })} required /></label>
        <label>Password<input type="password" minLength={8} onChange={e => setF({ ...f, password: e.target.value })} required /></label>
        <label>I am a
          <select onChange={e => setF({ ...f, role: e.target.value })}>
            <option value="STUDENT">Student</option>
            <option value="COMPANY">Recruiter</option>
          </select>
        </label>
        <button className="primary">Create account <ArrowRight size={17} /></button>
        <p>Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
