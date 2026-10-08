import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export function Recommendations() {
  const [rows, setRows] = useState<any[]>([]);
  const [errorStr, setErrorStr] = useState<string>('');
  
  useEffect(() => {
    console.log("USE EFFECT IS RUNNING!");
    api.get(`/api/ai/recommendations?t=${Date.now()}`)
      .then(r => { console.log("GOT RESPONSE!", r.data); setRows(r.data); })
      .catch(e => { console.log("GOT ERROR!", e); setErrorStr(e.message || String(e)); });
  }, []);
  
  return (
    <>
      <div className="page-title">
        <span className="eyebrow">PROFILE SIMILARITY</span>
        <h1>AI internship matches</h1>
        <p>Scores measure skills and preferences alignment, never your likelihood of being selected.</p>
        <p style={{color: 'red', fontWeight: 'bold'}}>DEBUG: Rows count = {rows.length}</p>
        {errorStr && <p style={{color: 'red'}}>DEBUG ERROR: {errorStr}</p>}
      </div>
      <div className="recommendations">
        {rows.map(x => (
          <article className="recommendation" key={x.internship_id}>
            <div className="ring">{x.match_score}%</div>
            <div>
              <h2>{x.title}</h2>
              <p>{x.company}</p>
              <p>{x.reason}</p>
              <div className="tags success">
                {x.matched_skills?.map((s: string) => <span key={s}>✓ {s}</span>)}
              </div>
              {(x.missing_skills?.length || 0) > 0 && (
                <div className="tags warning">
                  {x.missing_skills.map((s: string) => <span key={s}>Learn {s}</span>)}
                </div>
              )}
            </div>
            <Link to={'/internships/' + x.internship_id}>Details</Link>
          </article>
        ))}
      </div>
    </>
  );
}
