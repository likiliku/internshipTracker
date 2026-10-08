import React from 'react';

export function StatusBadge({ status }: { status: string }) {
  let bg = '#f3f4f6', color = '#4b5563'; // Saved / default

  switch (status.toLowerCase()) {
    case 'selected':
      bg = '#d1fae5'; color = '#065f46';
      break;
    case 'interview':
      bg = '#dbeafe'; color = '#1e40af';
      break;
    case 'applied':
      bg = '#e5e7eb'; color = '#374151';
      break;
    case 'rejected':
      bg = '#fee2e2'; color = '#991b1b';
      break;
    case 'withdrawn':
      bg = '#f3f4f6'; color = '#9ca3af';
      break;
  }

  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      background: bg,
      color: color,
      textTransform: 'capitalize'
    }}>
      {status}
    </span>
  );
}
