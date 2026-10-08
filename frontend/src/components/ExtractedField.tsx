import React from 'react';

export function ExtractedField({ label, value, onChange, confidence, type="text", ...props }: any) {
  return (
    <div className={`extracted-field ${confidence && confidence < 80 ? 'low-confidence' : ''}`}>
      <label>
        {label}
        {confidence ? <span className={`conf ${confidence >= 90 ? 'high' : confidence >= 80 ? 'med' : 'low'}`} title={`${confidence}% confidence`}>{confidence}%</span> : null}
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} {...props} />
      </label>
      {confidence && confidence < 80 && <small className="warning">⚠ Please verify this field</small>}
    </div>
  )
}
