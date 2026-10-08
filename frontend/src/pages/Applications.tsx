import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, X, Brain } from 'lucide-react';
import { api } from '../services/api';

import { StatusBadge } from '../components/StatusBadge';

import { DndContext, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';

function DroppableColumn({ id, title, count, children }: any) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <section ref={setNodeRef}>
      <h3>{title}<span>{count}</span></h3>
      {children}
    </section>
  );
}

function DraggableCard({ item, onClick }: any) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: item.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10, position: 'relative' as any } : undefined;
  
  return (
    <article 
      ref={setNodeRef}
      className="kanban-card"
      style={{...style, cursor: 'grab', border: '1px solid transparent'}}
      {...listeners} {...attributes}
      onDoubleClick={onClick}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <b>{item.internship.job_title}</b>
        <StatusBadge status={item.status} />
      </div>
      <p>{item.internship.company_name}</p>
      {item.notes && <p style={{fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>💬 {item.notes}</p>}
      {item.interview_date && <div style={{marginTop: '8px', padding: '5px 8px', background: 'var(--primary)', color: 'white', borderRadius: '4px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px'}}>
        <Clock size={12} /> {new Date(item.interview_date).toLocaleString()}
      </div>}
      {!item.interview_date && <small style={{display: 'block', marginTop: '5px'}}>{item.follow_up_date ? 'Follow-up ' + item.follow_up_date : 'No follow-up set'}</small>}
      <small style={{display: 'block', marginTop: '5px', color: 'var(--text-light)', fontSize: '0.7rem'}}>(Double click to edit)</small>
    </article>
  );
}

export function Applications() {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [activeId, setActiveId] = useState<any>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    api.get('/api/applications').then(r => setRows(r.data));
  }, []);

  const statuses = ['Saved', 'Applied', 'Interview', 'Selected', 'Rejected', 'Withdrawn'];

  const saveChanges = async (e: any) => {
    e.preventDefault();
    try {
      const res = await api.put('/api/applications/' + editing.id, {
        status: editing.status,
        follow_up_date: editing.follow_up_date || null,
        interview_date: editing.interview_date || null,
        notes: editing.notes || null
      });
      setRows(rows.map(x => x.id === editing.id ? { ...x, ...res.data } : x));
      setEditing(null);
    } catch (err: any) {
      alert("Error saving: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDragStart = (e: any) => {
    setActiveId(e.active.id);
  };

  const handleDragEnd = async (e: any) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    
    const appId = active.id;
    const newStatus = over.id;
    
    const app = rows.find(x => x.id === appId);
    if (app && app.status !== newStatus) {
      // Optimistic update
      setRows(rows.map(x => x.id === appId ? { ...x, status: newStatus } : x));
      try {
        await api.put('/api/applications/' + appId, { status: newStatus });
      } catch (err) {
        // Revert on error
        setRows(rows);
        alert("Failed to update status");
      }
    }
  };

  const activeItem = rows.find(x => x.id === activeId);

  return (
    <>
      <div className="page-title">
        <span className="eyebrow">APPLICATION PIPELINE</span>
        <h1>Keep every step visible</h1>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban">
          {statuses.map(s => (
            <DroppableColumn key={s} id={s} title={s} count={rows.filter(x => x.status === s).length}>
              {rows.filter(x => x.status === s).map(x => (
                <DraggableCard key={x.id} item={x} onClick={() => setEditing(x)} />
              ))}
            </DroppableColumn>
          ))}
        </div>
        
        <DragOverlay>
          {activeItem ? <DraggableCard item={activeItem} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {editing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff', padding: '30px', borderRadius: '12px', 
            width: '100%', maxWidth: '500px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            border: '1px solid #dce2ec'
          }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0, color: '#17223b'}}>Update Application</h2>
              <button onClick={() => setEditing(null)} style={{background: 'none', border: 'none', color: '#17223b', cursor: 'pointer'}}><X size={24}/></button>
            </div>
            
            <form onSubmit={saveChanges} style={{display: 'flex', flexDirection: 'column', gap: '15px', color: '#17223b'}}>
              <div>
                <strong>Role:</strong> {editing.internship.job_title} at {editing.internship.company_name}
              </div>

              <label style={{color: '#475467'}}>
                Status
                <select value={editing.status} onChange={e => setEditing({...editing, status: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dce2ec', background: '#f7f8fb', color: '#17223b', marginTop: '5px'}}>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label style={{color: '#475467'}}>
                Follow-up Date
                <input type="date" value={editing.follow_up_date || ''} onChange={e => setEditing({...editing, follow_up_date: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dce2ec', background: '#f7f8fb', color: '#17223b', marginTop: '5px'}}/>
              </label>
              
              <label style={{color: '#475467'}}>
                Interview Date
                <input type="datetime-local" value={editing.interview_date ? editing.interview_date.slice(0, 16) : ''} onChange={e => setEditing({...editing, interview_date: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dce2ec', background: '#f7f8fb', color: '#17223b', marginTop: '5px'}}/>
              </label>

              <label style={{color: '#475467'}}>
                Notes (Questions to ask, etc.)
                <textarea rows={4} value={editing.notes || ''} onChange={e => setEditing({...editing, notes: e.target.value})} style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dce2ec', background: '#f7f8fb', color: '#17223b', resize: 'vertical', marginTop: '5px', fontFamily: 'inherit'}} placeholder="Write down important notes..."/>
              </label>

              <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                <button type="submit" className="primary" style={{flex: 1, padding: '12px'}}>Save Changes</button>
                <button type="button" className="secondary" onClick={() => setEditing(null)} style={{flex: 1, padding: '12px', border: '1px solid #dce2ec', background: 'white', borderRadius: '8px'}}>Cancel</button>
              </div>

              <div style={{marginTop: '20px', padding: '15px', background: 'rgba(52, 152, 219, 0.1)', borderRadius: '8px', border: '1px solid rgba(52, 152, 219, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontWeight: 'bold'}}>
                  <Brain size={18} /> Practice for this role
                </div>
                <p style={{margin: 0, fontSize: '0.85rem', color: '#475467', textAlign: 'center'}}>Nervous about the interview? Let our AI hiring manager ask you realistic questions based on this exact job description.</p>
                <Link to={`/student/interview/${editing.id}`} style={{display: 'block', width: '100%', textAlign: 'center', background: '#1d4ed8', color: 'white', padding: '10px', borderRadius: '6px', fontWeight: 'bold', marginTop: '5px'}}>
                  Start Mock Interview
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
