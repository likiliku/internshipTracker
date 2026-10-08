import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Bookmark } from 'lucide-react';
import { api } from '../services/api';

function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Bookmark size={28} />
      <p>{text}</p>
    </div>
  );
}

export function Notifications() {
  const [rows, setRows] = useState<any[]>([]);
  const loadData = () => {
    api.get('/api/students/notifications').then(r => setRows(r.data));
  };
  
  useEffect(() => {
    loadData();
  }, []);

  const markAllRead = async () => {
    await api.put('/api/students/notifications/read-all');
    loadData();
  };

  const markRead = async (id: number) => {
    await api.put(`/api/students/notifications/${id}/read`);
    setRows(rows.map(r => r.id === id ? {...r, is_read: true} : r));
  };
  return (
    <>
      <div className="page-title" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <span className="eyebrow">UPDATES</span>
          <h1>Notifications</h1>
        </div>
        {rows.some(r => !r.is_read) && (
          <button onClick={markAllRead} className="btn secondary">Mark all as read</button>
        )}
      </div>
      {rows.length ? rows.map(n => (
        <article 
          className="notice" 
          key={n.id} 
          onClick={() => !n.is_read && markRead(n.id)}
          style={{
            cursor: !n.is_read ? 'pointer' : 'default',
            opacity: n.is_read ? 0.7 : 1,
            borderLeft: !n.is_read ? '4px solid var(--primary)' : '4px solid transparent',
            background: !n.is_read ? 'white' : 'var(--surface)'
          }}
        >
          <Bell color={!n.is_read ? 'var(--primary)' : 'var(--text-light)'} />
          <div>
            <b style={{fontWeight: !n.is_read ? 700 : 500}}>{n.title}</b>
            <p>{n.message}</p>
          </div>
        </article>
      )) : <Empty text="You’re all caught up." />}
    </>
  );
}
