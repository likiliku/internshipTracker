import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Settings, LogOut, FileText, Users } from 'lucide-react';

export function CompanyShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const active = location.pathname.startsWith(to);
    return (
      <Link to={to} className={`nav-item ${active ? 'active' : ''}`}>
        <Icon size={20} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">
          <b>InternTrack</b> <span>Company</span>
        </div>
        
        <nav>
          <NavItem to="/company/dashboard" icon={Briefcase} label="My Postings" />
          <NavItem to="/company/internships/new" icon={FileText} label="Post Internship" />
        </nav>

        <div className="bottom-nav">
          <div className="nav-item user-info">
            <div className="avatar">{user?.name?.[0] || 'C'}</div>
            <div className="details">
              <b>{user?.name}</b>
              <small>Company Portal</small>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', textAlign: 'left'}}>
            <LogOut size={20} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="content-inner">
          {children}
        </div>
      </main>
    </div>
  );
}
