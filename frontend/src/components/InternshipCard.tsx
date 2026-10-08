import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, IndianRupee, ArrowRight } from 'lucide-react';

export function InternshipCard({ data, score }: { data: any, score?: number }) {
  return (
    <article className="internship">
      <div className="company-icon">{data.company_name?.[0]}</div>
      <div className="card-top">
        <div>
          <h3>{data.job_title}</h3>
          <p>{data.company_name}</p>
        </div>
        {score !== undefined && <b className="score">{score}% match</b>}
      </div>
      <div className="meta">
        <span><MapPin size={14} />{data.location || 'Flexible'}</span>
        <span><IndianRupee size={14} />{data.stipend_min ? `${data.stipend_min / 1000}k–${data.stipend_max / 1000}k` : 'Not disclosed'}</span>
      </div>
      <div className="tags">
        {(data.required_skills || []).slice(0, 4).map((s: string) => <span key={s}>{s}</span>)}
      </div>
      <Link to={'/internships/' + data.id}>View opportunity <ArrowRight size={15} /></Link>
    </article>
  );
}
