import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, Briefcase, Brain, User, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      api.get('/api/students/notifications')
        .then(res => setUnreadCount(res.data.filter((n: any) => !n.is_read).length))
        .catch(() => {});
    }
  }, [user, location.pathname]); // Refresh when navigating

  const links = [
    ['/student/dashboard', LayoutDashboard, 'Dashboard'],
    ['/internships', Search, 'Discover'],
    ['/student/applications', Briefcase, 'Applications'],
    ['/student/recommendations', Brain, 'AI matches'],
    ['/student/profile', User, 'Profile'],
    ['/student/notifications', Bell, 'Notifications']
  ] as const;

  return (
    <div className="shell">
      <aside>
        <Link className="brand" to="/student/dashboard"><span>↗</span> InternIQ</Link>
        <small>INTELLIGENT CAREER PLATFORM</small>
        <nav>
          {links.map(([to, Icon, label]) => (
            <Link to={to as string} key={to as string} className={location.pathname.startsWith(to as string) ? 'active' : ''}>
              <Icon size={18} />
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
                <span>{label}</span>
                {label === 'Notifications' && unreadCount > 0 && (
                  <span style={{background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px'}}>{unreadCount}</span>
                )}
              </div>
            </Link>
          ))}
        </nav>
        <button onClick={logout}><LogOut size={18} />Sign out</button>
      </aside>
      <main>
        <header>
          <div>
            <b>Good to see you{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</b>
            <p>Find the internship that moves your career forward.</p>
          </div>
          <Link className="avatar" to="/student/profile">{user?.name?.[0] || 'U'}</Link>
        </header>
        {children}
      </main>
    </div>
  );
}
