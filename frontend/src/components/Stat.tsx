import React from 'react';

export function Stat({ label, value, icon: Icon, color }: { label: string, value: any, icon: any, color: string }) {
  return (
    <article className="stat">
      <span className={color}><Icon size={21} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
