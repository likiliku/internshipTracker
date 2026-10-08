import React, { useState } from 'react';
import { X } from 'lucide-react';

export function ChipInput({ value = [], onChange, placeholder }: { value: any[], onChange: (v: any[]) => void, placeholder?: string }) {
  const [inp, setInp] = useState('');
  const add = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inp.trim()) {
      e.preventDefault();
      if (!value.find(x => x.name === inp.trim() || x === inp.trim())) {
        onChange([...value, typeof value[0] === 'string' ? inp.trim() : { name: inp.trim(), category: 'General' }]);
      }
      setInp('');
    }
  };
  return <div className="chip-input">
    <div className="chips">{value.map((v, i) => {
      const label = typeof v === 'string' ? v : v.name;
      return <span key={i} className="chip">{label} <X size={12} onClick={() => onChange(value.filter((_, idx) => idx !== i))} style={{cursor:'pointer'}}/></span>
    })}</div>
    <input value={inp} onChange={e => setInp(e.target.value)} onKeyDown={add} placeholder={placeholder} />
  </div>
}
