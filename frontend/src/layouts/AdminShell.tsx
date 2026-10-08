import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const links = [
    ['/admin/dashboard', LayoutDashboard, 'Dashboard'],
    ['/admin/students', Users, 'Students'],
    ['/admin/internships', LayoutDashboard, 'Internships'],
  ] as const;

  return (
    <div className="shell">
      <aside>
        <Link className="brand" to="/admin/dashboard"><span>↗</span> InternIQ Admin</Link>
        <small>SYSTEM ADMINISTRATION</small>
        <nav>
          {links.map(([to, Icon, label]) => (
            <Link to={to as string} key={to as string}>
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout}><LogOut size={18} />Sign out</button>
      </aside>
      <main>
        <header>
          <div>
            <b>Administrator Console</b>
            <p>Manage users, content, and system configuration.</p>
          </div>
          <div className="avatar" style={{background: '#ef4444'}}>A</div>
        </header>
        {children}
      </main>
    </div>
  );
}
