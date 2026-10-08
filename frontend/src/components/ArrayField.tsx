import React from 'react';
import { X, Plus } from 'lucide-react';

export function ArrayField({ items = [], onChange, renderItem, newItem }: { items: any[], onChange: (v: any[]) => void, renderItem: (item: any, update: (v: any) => void) => React.ReactNode, newItem: any }) {
  return <div className="array-field">
    {items.map((item, i) => (
      <div key={i} className="array-item" style={{position:'relative', padding:'10px', border:'1px solid #ddd', marginBottom:'10px', borderRadius:'4px'}}>
        <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} style={{position:'absolute', right:'10px', top:'10px', background:'none', border:'none', cursor:'pointer'}}><X size={16}/></button>
        {renderItem(item, (newVal) => {
          const newItems = [...items];
          newItems[i] = newVal;
          onChange(newItems);
        })}
      </div>
    ))}
    <button type="button" onClick={() => onChange([...items, newItem])} className="secondary"><Plus size={16}/> Add item</button>
  </div>
}
